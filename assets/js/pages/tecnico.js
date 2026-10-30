/**
 * ==============================================================================
 * FURIA Helpdesk - Painel do Técnico (assets/js/pages/tecnico.js)
 * ==============================================================================
 * Lógica da visualização operacional para técnicos de suporte:
 * 1. Acesso permitido para 'tecnico' e 'admin'.
 * 2. Carrega todos os chamados abertos pelos usuários via API (/api/tickets).
 * 3. Permite busca em tempo real e filtros rápidos por status.
 * 4. Permite ao técnico alterar o status do chamado (Recebido, Em andamento, Concluído).
 * 5. Permite visualização em tela cheia e download das imagens anexadas pelo usuário.
 * 6. NÃO possui controle de adicionar, remover ou modificar usuários.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Apenas técnicos de suporte e administradores podem acessar
  if (!Furia.requireAuth(['tecnico', 'admin'])) return;
  Furia.initMenu();

  const user = Furia.getUser();
  const tecnicoNameEl = document.getElementById('tecnicoName');
  if (tecnicoNameEl && user) {
    tecnicoNameEl.textContent = (user.name || user.nome || 'Técnico').split(' ')[0];
  }

  const requestsListEl = document.getElementById('requestsList');
  const searchInput = document.getElementById('requestSearch');
  const tecnicoMsgEl = document.getElementById('tecnicoMessage');
  const filterChips = document.querySelectorAll('.filter-chip');

  const totalRequestsEl = document.getElementById('totalRequests');
  const openRequestsEl = document.getElementById('openRequests');
  const completedRequestsEl = document.getElementById('completedRequests');

  let chamados = [];
  let statusFiltro = 'todos';

  // Carrega lista de todos os chamados da API do backend
  async function carregarChamados() {
    try {
      chamados = await Furia.api('/tickets');
      atualizarMetricas();
      renderizarChamados();
    } catch (err) {
      mostrarMensagem(err.message, true);
    }
  }

  function atualizarMetricas() {
    if (totalRequestsEl) totalRequestsEl.textContent = String(chamados.length);

    if (openRequestsEl) {
      const abertos = chamados.filter((c) => c.status !== 'Concluído').length;
      openRequestsEl.textContent = String(abertos);
    }

    if (completedRequestsEl) {
      const concluidos = chamados.filter((c) => c.status === 'Concluído').length;
      completedRequestsEl.textContent = String(concluidos);
    }
  }

  // Renderiza a lista de chamados na tabela
  function renderizarChamados() {
    if (!requestsListEl) return;
    const busca = (searchInput ? searchInput.value : '').trim().toLowerCase();

    const filtrados = chamados.filter((c) => {
      // Filtro por status do chip
      if (statusFiltro !== 'todos' && (c.status || '').toLowerCase() !== statusFiltro.toLowerCase()) {
        return false;
      }

      // Filtro por termo de busca
      const texto = `${c.id} ${c.titulo} ${c.descricao} ${c.userName || c.user_name} ${c.local || ''} ${c.categoria || ''}`.toLowerCase();
      return texto.includes(busca);
    });

    requestsListEl.innerHTML = '';

    if (filtrados.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" class="empty-state">${chamados.length ? 'Nenhuma solicitação encontrada com os filtros atuais.' : 'Nenhum chamado aberto até o momento.'}</td>`;
      requestsListEl.appendChild(tr);
      return;
    }

    filtrados.forEach((c) => {
      const tr = document.createElement('tr');

      // 1. Título & Identificador
      const tdTitle = document.createElement('td');
      tdTitle.innerHTML = `
        <strong>${Furia.escape(c.titulo || 'Chamado Técnico')}</strong>
        <span class="table-subtitle">#${Furia.escape(c.id)} • ${c.tipo === 'presencial' ? 'Atendimento Presencial' : 'Problema Técnico'}</span>
      `;

      // 2. Solicitante
      const tdUser = document.createElement('td');
      tdUser.innerHTML = `
        <div><strong>${Furia.escape(c.userName || c.user_name || 'Usuário')}</strong></div>
        <span class="table-subtitle">${Furia.escape(c.userEmail || c.user_email || '')}</span>
      `;

      // 3. Detalhes & Anexo de Imagem
      const tdDetails = document.createElement('td');
      const descP = document.createElement('p');
      descP.style.margin = '0 0 6px';
      descP.textContent = c.descricao || 'Sem descrição detalhada';
      tdDetails.appendChild(descP);

      // Tags de categoria / urgência
      const tagsDiv = document.createElement('div');
      tagsDiv.style.display = 'flex';
      tagsDiv.style.gap = '6px';
      tagsDiv.style.alignItems = 'center';
      tagsDiv.style.flexWrap = 'wrap';
      tagsDiv.style.marginBottom = '6px';

      if (c.local) {
        tagsDiv.innerHTML += `<span class="chamado-categoria" style="font-size: 0.72rem;">Local: ${Furia.escape(c.local)}</span>`;
      } else if (c.categoria) {
        tagsDiv.innerHTML += `<span class="chamado-categoria" style="font-size: 0.72rem;">Cat: ${Furia.escape(c.categoria)}</span>`;
      }

      if (c.urgencia) {
        tagsDiv.innerHTML += `<span class="chamado-urgencia ${c.urgencia === 'alta' ? 'alta' : ''}" style="font-size: 0.72rem;">Urgência: ${Furia.escape(c.urgencia.toUpperCase())}</span>`;
      }
      tdDetails.appendChild(tagsDiv);

      // Anexo / Imagem do chamado
      const anexo = Furia.parseAttachment(c.anexo);
      if (anexo) {
        const attachBox = document.createElement('div');
        attachBox.className = 'ticket-attachment-box';

        if (anexo.url) {
          if (anexo.isImage) {
            const thumb = document.createElement('img');
            thumb.src = anexo.url;
            thumb.alt = anexo.name;
            thumb.className = 'attachment-thumbnail-trigger';
            thumb.title = 'Clique para ampliar a imagem do problema';
            thumb.addEventListener('click', () => {
              Furia.showImageModal(anexo.url, c.titulo, c.userName || c.user_name);
            });
            attachBox.appendChild(thumb);
          }

          const btnView = document.createElement('button');
          btnView.type = 'button';
          btnView.className = 'btn-attachment-preview';
          btnView.innerHTML = `Ver Imagem <span style="font-size: 0.72rem; opacity: 0.8">(${Furia.escape(anexo.name)})</span>`;
          btnView.addEventListener('click', () => {
            Furia.showImageModal(anexo.url, c.titulo, c.userName || c.user_name);
          });
          attachBox.appendChild(btnView);
        } else {
          const fileNote = document.createElement('span');
          fileNote.className = 'text-muted';
          fileNote.style.fontSize = '0.78rem';
          fileNote.textContent = `${anexo.name}`;
          attachBox.appendChild(fileNote);
        }

        tdDetails.appendChild(attachBox);
      }

      // 4. Data
      const tdDate = document.createElement('td');
      tdDate.textContent = Furia.formatDate(c.created_at || c.data);

      // 5. Select para Mudar Status
      const tdStatus = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'status-select';
      select.dataset.status = c.status || 'Recebido';
      select.innerHTML = `
        <option value="Recebido">Recebido</option>
        <option value="Em andamento">Em andamento</option>
        <option value="Concluído">Concluído</option>
      `;
      select.value = c.status || 'Recebido';

      select.addEventListener('change', async () => {
        const novoStatus = select.value;
        try {
          await Furia.api(`/tickets/${encodeURIComponent(c.id)}/status`, 'PUT', { status: novoStatus });
          c.status = novoStatus;
          select.dataset.status = novoStatus;
          atualizarMetricas();
          mostrarMensagem(`Status do chamado #${c.id} alterado para "${novoStatus}" com sucesso!`, false);
        } catch (err) {
          select.value = c.status;
          mostrarMensagem(err.message, true);
        }
      });
      tdStatus.appendChild(select);

      // 6. Ações (Visualizar Imagem / Detalhes)
      const tdActions = document.createElement('td');
      if (anexo && anexo.url) {
        const btnVer = document.createElement('button');
        btnVer.type = 'button';
        btnVer.className = 'btn-action-view';
        btnVer.innerHTML = 'Ver Imagem';
        btnVer.title = 'Abrir imagem anexada do chamado';
        btnVer.addEventListener('click', () => {
          Furia.showImageModal(anexo.url, c.titulo, c.userName || c.user_name);
        });
        tdActions.appendChild(btnVer);
      } else {
        const spanNoAttach = document.createElement('span');
        spanNoAttach.className = 'text-muted';
        spanNoAttach.style.fontSize = '0.76rem';
        spanNoAttach.textContent = 'Sem anexo';
        tdActions.appendChild(spanNoAttach);
      }

      tr.append(tdTitle, tdUser, tdDetails, tdDate, tdStatus, tdActions);
      requestsListEl.appendChild(tr);
    });
  }

  // Configuração dos chips de filtro
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      statusFiltro = chip.dataset.filter || 'todos';
      renderizarChamados();
    });
  });

  // Busca em tempo real
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderizarChamados();
    });
  }

  function mostrarMensagem(texto, isError = false) {
    if (!tecnicoMsgEl) return;
    tecnicoMsgEl.textContent = texto;
    tecnicoMsgEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    tecnicoMsgEl.style.display = 'block';

    setTimeout(() => {
      tecnicoMsgEl.style.display = 'none';
    }, 4500);
  }

  carregarChamados();
});

