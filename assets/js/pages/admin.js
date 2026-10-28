/**
 * ==============================================================================
 * FURIA Helpdesk - Painel Administrativo (assets/js/pages/admin.js)
 * ==============================================================================
 * Lógica do painel de administração:
 * 1. Protegido com exclusividade para administradores (role === 'admin').
 * 2. Carrega todos os chamados e colaboradores do SQLite via API (/api/tickets e /api/users).
 * 3. Permite busca em tempo real nos chamados.
 * 4. Permite alterar status de chamados e excluir chamados.
 * 5. Permite editar o setor e perfil de usuários e cadastrar novos colaboradores.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Exclusivo para perfil Administrador
  if (!Furia.requireAuth('admin')) return;
  Furia.initMenu();

  const admin = Furia.getUser();
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl && admin) {
    adminNameEl.textContent = (admin.name || admin.nome || 'Admin').split(' ')[0];
  }

  const requestsListEl = document.getElementById('requestsList');
  const usersListEl = document.getElementById('usersList');
  const searchInput = document.getElementById('requestSearch');
  const adminMsgEl = document.getElementById('adminMessage');
  const userMsgEl = document.getElementById('userMessage');
  const userForm = document.getElementById('userForm');

  const totalRequestsEl = document.getElementById('totalRequests');
  const openRequestsEl = document.getElementById('openRequests');
  const totalUsersEl = document.getElementById('totalUsers');

  let chamados = [];
  let usuarios = [];

  // Busca chamados e usuários do banco SQLite
  async function carregarDados() {
    try {
      chamados = await Furia.api('/tickets');
      usuarios = await Furia.api('/users');
      atualizarMetricas();
      renderizarChamados();
      renderizarUsuarios();
    } catch (err) {
      mostrarMensagem(adminMsgEl, err.message, true);
    }
  }

  function atualizarMetricas() {
    if (totalRequestsEl) totalRequestsEl.textContent = String(chamados.length);
    if (openRequestsEl) {
      const abertos = chamados.filter((c) => c.status !== 'Concluído').length;
      openRequestsEl.textContent = String(abertos);
    }
    if (totalUsersEl) totalUsersEl.textContent = String(usuarios.length);
  }

  // Renderiza a tabela de chamados com busca
  function renderizarChamados() {
    if (!requestsListEl) return;
    const busca = (searchInput ? searchInput.value : '').trim().toLowerCase();

    const filtrados = chamados.filter((c) => {
      const texto = `${c.id} ${c.titulo} ${c.descricao} ${c.userName || c.user_name} ${c.local || ''}`.toLowerCase();
      return texto.includes(busca);
    });

    requestsListEl.innerHTML = '';

    if (filtrados.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" class="empty-state">${chamados.length ? 'Nenhuma solicitação encontrada com esse termo.' : 'Nenhum chamado aberto até o momento.'}</td>`;
      requestsListEl.appendChild(tr);
      return;
    }

    filtrados.forEach((c) => {
      const tr = document.createElement('tr');

      // Título
      const tdTitle = document.createElement('td');
      tdTitle.innerHTML = `
        <strong>${Furia.escape(c.titulo || 'Chamado')}</strong>
        <span class="table-subtitle">#${Furia.escape(c.id)} • ${c.tipo === 'presencial' ? 'Presencial' : 'Problema'}</span>
      `;

      // Solicitante
      const tdUser = document.createElement('td');
      tdUser.innerHTML = `
        <div>${Furia.escape(c.userName || c.user_name || 'Usuário')}</div>
        <span class="table-subtitle">${Furia.escape(c.userEmail || c.user_email || '')}</span>
      `;

      // Detalhes
      const tdDetails = document.createElement('td');
      tdDetails.textContent = c.descricao || 'Sem detalhes';

      // Data
      const tdDate = document.createElement('td');
      tdDate.textContent = Furia.formatDate(c.created_at || c.data);

      // Select de Status
      const tdStatus = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'status-select';
      select.innerHTML = `
        <option value="Recebido">Recebido</option>
        <option value="Em andamento">Em andamento</option>
        <option value="Concluído">Concluído</option>
      `;
      select.value = c.status || 'Recebido';

      select.addEventListener('change', async () => {
        try {
          await Furia.api(`/tickets/${encodeURIComponent(c.id)}/status`, 'PUT', { status: select.value });
          c.status = select.value;
          atualizarMetricas();
          mostrarMensagem(adminMsgEl, `Status do chamado #${c.id} atualizado para "${select.value}"!`, false);
        } catch (err) {
          mostrarMensagem(adminMsgEl, err.message, true);
        }
      });
      tdStatus.appendChild(select);

      // Botão Excluir Chamado
      const tdActions = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-ticket';
      deleteBtn.innerHTML = '🗑️ Excluir';
      deleteBtn.title = 'Excluir chamado permanentemente';

      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja excluir permanentemente o chamado #${c.id}?`)) {
          try {
            await Furia.api(`/tickets/${encodeURIComponent(c.id)}`, 'DELETE');
            mostrarMensagem(adminMsgEl, `Chamado #${c.id} excluído com sucesso do banco SQLite.`, false);
            carregarDados();
          } catch (err) {
            mostrarMensagem(adminMsgEl, err.message, true);
          }
        }
      });
      tdActions.appendChild(deleteBtn);

      tr.append(tdTitle, tdUser, tdDetails, tdDate, tdStatus, tdActions);
      requestsListEl.appendChild(tr);
    });
  }

  // Renderiza a lista de colaboradores
  function renderizarUsuarios() {
    if (!usersListEl) return;
    usersListEl.innerHTML = '';

    if (usuarios.length === 0) {
      usersListEl.innerHTML = '<li class="empty-state">Nenhum colaborador encontrado.</li>';
      return;
    }

    usuarios.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'user-item-row';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'user-item-info';
      infoDiv.innerHTML = `
        <strong>${Furia.escape(u.name || u.nome)}</strong>
        <span>${Furia.escape(u.email)}</span>
      `;

      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'user-edit-controls';

      // Setor
      const deptField = document.createElement('div');
      deptField.className = 'user-edit-field';
      deptField.innerHTML = `
        <label>Setor</label>
        <input type="text" class="user-dept-input" value="${Furia.escape(u.department || 'Geral')}">
      `;
      const deptInput = deptField.querySelector('input');

      // Perfil
      const roleField = document.createElement('div');
      roleField.className = 'user-edit-field';
      roleField.innerHTML = `
        <label>Perfil</label>
        <select class="user-role-select">
          <option value="funcionario">Funcionário</option>
          <option value="tecnico">Técnico</option>
          <option value="admin">Administrador</option>
        </select>
      `;
      const roleSelect = roleField.querySelector('select');
      roleSelect.value = u.role || 'funcionario';

      // Botão Salvar
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn-save-user';
      saveBtn.textContent = 'Salvar';
      saveBtn.addEventListener('click', async () => {
        try {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Salvando...';

          await Furia.api(`/users/${encodeURIComponent(u.id)}`, 'PUT', {
            department: deptInput.value.trim() || 'Geral',
            role: roleSelect.value
          });

          u.department = deptInput.value.trim() || 'Geral';
          u.role = roleSelect.value;

          mostrarMensagem(userMsgEl, `Dados de ${u.name || u.nome} salvos com sucesso!`, false);
        } catch (err) {
          mostrarMensagem(userMsgEl, err.message, true);
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar';
        }
      });

      controlsDiv.append(deptField, roleField, saveBtn);

      // Botão Remover (não pode excluir a própria conta de admin logada)
      if (u.id !== admin.id) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-user';
        removeBtn.textContent = 'Remover';
        removeBtn.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja remover ${u.name || u.nome}?`)) {
            try {
              await Furia.api(`/users/${encodeURIComponent(u.id)}`, 'DELETE');
              mostrarMensagem(userMsgEl, `Usuário ${u.name || u.nome} removido do banco.`, false);
              carregarDados();
            } catch (err) {
              mostrarMensagem(userMsgEl, err.message, true);
            }
          }
        });
        controlsDiv.appendChild(removeBtn);
      }

      li.append(infoDiv, controlsDiv);
      usersListEl.appendChild(li);
    });
  }

  // Formulário para cadastrar novo colaborador pelo admin
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = userForm.elements['name'].value.trim();
      const email = userForm.elements['email'].value.trim();
      const department = userForm.elements['department'].value.trim() || 'Geral';
      const role = userForm.elements['role'].value || 'funcionario';
      const password = userForm.elements['password'].value || '123';
      const submitBtn = userForm.querySelector('button[type="submit"]');

      if (!name || !email) {
        mostrarMensagem(userMsgEl, 'Preencha o nome e o e-mail do colaborador.', true);
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;

        await Furia.api('/users', 'POST', {
          name,
          email,
          department,
          role,
          password
        });

        userForm.reset();
        mostrarMensagem(userMsgEl, `Colaborador "${name}" cadastrado com sucesso!`, false);
        carregarDados();
      } catch (err) {
        mostrarMensagem(userMsgEl, err.message, true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderizarChamados);
  }

  function mostrarMensagem(el, texto, isError) {
    if (!el) return;
    el.textContent = texto;
    el.className = isError ? 'alert alert-error' : 'alert alert-success';
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4500);
  }

  carregarDados();
});

