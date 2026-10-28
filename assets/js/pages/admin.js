/**
 * FURIA Helpdesk - Script do Painel Administrativo (Conectado ao SQLite)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a rota: EXCLUSIVO PARA ADMINISTRADORES
  if (!window.FuriaAuth.requireAuth(['admin'])) return;

  const adminUser = window.FuriaAuth.getCurrentUser();
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl && adminUser) {
    adminNameEl.textContent = adminUser.name.split(' ')[0] || adminUser.name;
  }

  const requestsListEl = document.getElementById('requestsList');
  const usersListEl = document.getElementById('usersList');
  const requestSearchInput = document.getElementById('requestSearch');
  const adminMessageEl = document.getElementById('adminMessage');
  const userMessageEl = document.getElementById('userMessage');
  const userForm = document.getElementById('userForm');

  const totalRequestsEl = document.getElementById('totalRequests');
  const openRequestsEl = document.getElementById('openRequests');
  const totalUsersEl = document.getElementById('totalUsers');

  let allRequests = [];
  let allUsers = [];

  async function loadData() {
    try {
      allRequests = await window.FuriaDB.getTickets();
      allUsers = await window.FuriaDB.getUsers();
      updateStats();
      renderRequests();
      renderUsers();
    } catch (err) {
      if (adminMessageEl) {
        window.FuriaUI.setMessage(adminMessageEl, err.message, true);
      }
    }
  }

  function updateStats() {
    if (totalRequestsEl) totalRequestsEl.textContent = String(allRequests.length);
    if (openRequestsEl) {
      const openCount = allRequests.filter(r => r.status !== 'Concluído').length;
      openRequestsEl.textContent = String(openCount);
    }
    if (totalUsersEl) totalUsersEl.textContent = String(allUsers.length);
  }

  function renderRequests() {
    if (!requestsListEl) return;
    const term = (requestSearchInput ? requestSearchInput.value : '').trim().toLowerCase();

    const filtered = allRequests.filter(r => {
      const text = `${r.id} ${r.titulo} ${r.descricao} ${r.userName || r.user_name} ${r.categoria} ${r.local}`.toLowerCase();
      return text.includes(term);
    });

    requestsListEl.replaceChildren();

    if (!filtered.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" class="empty-state">${allRequests.length ? 'Nenhuma solicitação encontrada com esse termo.' : 'Nenhum chamado aberto até o momento.'}</td>`;
      requestsListEl.append(tr);
      return;
    }

    filtered.forEach((req) => {
      const tr = document.createElement('tr');

      // Coluna Solicitação
      const tdTitle = document.createElement('td');
      tdTitle.innerHTML = `
        <strong>${window.FuriaUI.escapeHTML(req.titulo || 'Chamado')}</strong>
        <span class="table-subtitle">#${window.FuriaUI.escapeHTML(req.id)} • ${req.tipo === 'presencial' ? 'Atendimento Presencial' : 'Problema'}</span>
      `;

      // Coluna Solicitante
      const tdUser = document.createElement('td');
      tdUser.innerHTML = `
        <div>${window.FuriaUI.escapeHTML(req.userName || req.user_name || 'Usuário')}</div>
        <span class="table-subtitle">${window.FuriaUI.escapeHTML(req.userEmail || req.user_email || '')}</span>
      `;

      // Coluna Detalhes
      const tdDetails = document.createElement('td');
      tdDetails.textContent = req.descricao || 'Sem descrição';

      // Coluna Data
      const tdDate = document.createElement('td');
      tdDate.textContent = window.FuriaUI.formatDate(req.data || req.created_at);

      // Coluna Status (com select interativo conectado ao SQLite)
      const tdStatus = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'status-select';
      select.innerHTML = `
        <option value="Recebido">Recebido</option>
        <option value="Em andamento">Em andamento</option>
        <option value="Concluído">Concluído</option>
      `;
      select.value = req.status || 'Recebido';

      select.addEventListener('change', async () => {
        try {
          await window.FuriaDB.updateTicketStatus(req.id, select.value);
          req.status = select.value;
          updateStats();
          window.FuriaUI.setMessage(adminMessageEl, `Status do chamado #${req.id} atualizado para "${select.value}" no SQLite.`, false);
          setTimeout(() => window.FuriaUI.setMessage(adminMessageEl, '', false), 4000);
        } catch (error) {
          window.FuriaUI.setMessage(adminMessageEl, error.message, true);
        }
      });

      tdStatus.append(select);

      // Coluna Ações (Excluir chamado do SQLite)
      const tdActions = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-ticket';
      deleteBtn.innerHTML = '🗑️ Excluir';
      deleteBtn.title = 'Excluir este chamado permanentemente';

      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja excluir o chamado #${req.id}?`)) {
          try {
            await window.FuriaDB.deleteTicket(req.id);
            await loadData();
            window.FuriaUI.setMessage(adminMessageEl, `Chamado #${req.id} excluído com sucesso do banco de dados.`, false);
            setTimeout(() => window.FuriaUI.setMessage(adminMessageEl, '', false), 4000);
          } catch (error) {
            window.FuriaUI.setMessage(adminMessageEl, error.message, true);
          }
        }
      });

      tdActions.append(deleteBtn);

      tr.append(tdTitle, tdUser, tdDetails, tdDate, tdStatus, tdActions);
      requestsListEl.append(tr);
    });
  }

  function renderUsers() {
    if (!usersListEl) return;
    usersListEl.replaceChildren();

    if (!allUsers.length) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'Nenhum usuário cadastrado.';
      usersListEl.append(li);
      return;
    }

    allUsers.forEach((user) => {
      const li = document.createElement('li');
      li.className = 'user-item-row';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'user-item-info';
      infoDiv.innerHTML = `
        <strong>${window.FuriaUI.escapeHTML(user.name || user.nome)}</strong>
        <span>${window.FuriaUI.escapeHTML(user.email)}</span>
      `;

      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'user-edit-controls';

      // Campo de Departamento editável
      const deptField = document.createElement('div');
      deptField.className = 'user-edit-field';
      deptField.innerHTML = `
        <label>Setor</label>
        <input type="text" class="user-dept-input" value="${window.FuriaUI.escapeHTML(user.department || 'Geral')}" placeholder="Setor">
      `;
      const deptInput = deptField.querySelector('input');

      // Campo de Perfil (Role) selecionável
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
      roleSelect.value = user.role || 'funcionario';

      // Botão Salvar Alterações de Perfil e Setor no SQLite
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn-save-user';
      saveBtn.textContent = 'Salvar';
      saveBtn.title = 'Salvar setor e perfil deste usuário';
      saveBtn.addEventListener('click', async () => {
        const newDept = deptInput.value.trim() || 'Geral';
        const newRole = roleSelect.value;
        try {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Salvando...';

          await window.FuriaDB.updateUser(user.id, { department: newDept, role: newRole });
          user.department = newDept;
          user.role = newRole;

          // Se o admin editou seu próprio perfil ou setor, atualiza a sessão ativa
          if (user.id === adminUser.id) {
            await window.FuriaAuth.updateProfile({ department: newDept, role: newRole });
          }

          await loadData();
          window.FuriaUI.setMessage(userMessageEl, `Dados de ${user.name || user.nome} atualizados no SQLite com sucesso!`, false);
          setTimeout(() => window.FuriaUI.setMessage(userMessageEl, '', false), 4000);
        } catch (err) {
          window.FuriaUI.setMessage(userMessageEl, err.message, true);
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar';
        }
      });

      controlsDiv.append(deptField, roleField, saveBtn);

      // Botão Remover Usuário (não pode se auto-excluir)
      if (user.id !== adminUser.id) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-user';
        removeBtn.textContent = 'Remover';
        removeBtn.title = 'Remover usuário do sistema';

        removeBtn.addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja remover o usuário ${user.name || user.nome}?`)) {
            try {
              removeBtn.disabled = true;
              await window.FuriaDB.deleteUser(user.id);
              await loadData();
              window.FuriaUI.setMessage(userMessageEl, `Usuário ${user.name || user.nome} removido do banco SQLite.`, false);
              setTimeout(() => window.FuriaUI.setMessage(userMessageEl, '', false), 4000);
            } catch (err) {
              window.FuriaUI.setMessage(userMessageEl, err.message, true);
              removeBtn.disabled = false;
            }
          }
        });

        controlsDiv.append(removeBtn);
      }

      li.append(infoDiv, controlsDiv);
      usersListEl.append(li);
    });
  }

  // Formulário para Adicionar Usuário pela equipe admin diretamente no SQLite
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = userForm.elements['name']?.value.trim();
      const email = userForm.elements['email']?.value.trim();
      const department = userForm.elements['department']?.value.trim() || 'Geral';
      const role = userForm.elements['role']?.value || 'funcionario';
      const password = userForm.elements['password']?.value || '123';
      const submitBtn = userForm.querySelector('button[type="submit"]');

      if (!name || !email) {
        window.FuriaUI.setMessage(userMessageEl, 'Preencha o nome e o e-mail.', true);
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;

        await window.FuriaDB.createUser({
          name,
          email,
          department,
          role,
          password
        });

        userForm.reset();
        await loadData();
        window.FuriaUI.setMessage(userMessageEl, `Usuário "${name}" gravado com sucesso no SQLite!`, false);
      } catch (error) {
        window.FuriaUI.setMessage(userMessageEl, error.message, true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  if (requestSearchInput) {
    requestSearchInput.addEventListener('input', renderRequests);
  }

  loadData();
});
