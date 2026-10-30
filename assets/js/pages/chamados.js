/**
 * ==============================================================================
 * FURIA Helpdesk - Histórico de Chamados (assets/js/pages/chamados.js)
 * ==============================================================================
 * Lógica da visualização de chamados do colaborador:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Busca da API (/api/tickets) apenas os chamados do usuário logado.
 * 3. Renderiza os cards de chamados com status, título, descrição e data.
 * 4. Permite filtrar em tempo real por status (Todos, Recebido, Em andamento, Concluído).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
  Furia.initMenu();

  const user = Furia.getUser();
  const listContainer = document.getElementById('chamadosList');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let chamados = [];
  let filtroAtual = 'todos';

  // Carrega os chamados do banco de dados SQLite
  async function carregarChamados() {
    listContainer.innerHTML = '<p class="chamados-empty">Carregando seus chamados do banco de dados...</p>';

    try {
      // Se for admin, pode ver todos; se for funcionário, busca apenas os seus
      const endpoint = user.role === 'admin' ? '/tickets' : `/tickets/user/${encodeURIComponent(user.id)}`;
      chamados = await Furia.api(endpoint);
      renderizarChamados();
    } catch (err) {
      listContainer.innerHTML = `<p class="chamados-empty" style="color: #ff5555;">Erro ao carregar chamados: ${Furia.escape(err.message)}</p>`;
    }
  }

  // Renderiza os cards na tela conforme o filtro selecionado
  function renderizarChamados() {
    listContainer.innerHTML = '';

    const filtrados = chamados.filter((t) => {
      if (filtroAtual === 'todos') return true;
      return (t.status || '').toLowerCase() === filtroAtual.toLowerCase();
    });

    if (filtrados.length === 0) {
      listContainer.innerHTML = `
        <div class="chamados-empty">
          <p>Nenhum chamado encontrado ${filtroAtual !== 'todos' ? `com o status "${filtroAtual}"` : 'no seu histórico'}.</p>
          <a href="../inicial/index.html" class="btn btn-secondary">Abrir Nova Solicitação</a>
        </div>
      `;
      return;
    }

    filtrados.forEach((ticket) => {
      let badgeClass = 'status-pendente';
      if (ticket.status === 'Em andamento') badgeClass = 'status-andamento';
      else if (ticket.status === 'Concluído') badgeClass = 'status-concluido';

      const card = document.createElement('article');
      card.className = 'chamado-card';
      card.innerHTML = `
        <div class="chamado-header">
          <span class="chamado-id">#${Furia.escape(ticket.id)}</span>
          <span class="status-badge ${badgeClass}">${Furia.escape(ticket.status || 'Recebido')}</span>
        </div>
        <h2 class="chamado-titulo">${Furia.escape(ticket.titulo || 'Chamado Técnico')}</h2>
        <p class="chamado-descricao">${Furia.escape(ticket.descricao || 'Sem descrição')}</p>
        <div class="chamado-footer">
          <div class="chamado-info-tags">
            <span class="chamado-categoria">${ticket.tipo === 'presencial' ? `Local: ${Furia.escape(ticket.local || 'Geral')}` : `Categoria: ${Furia.escape(ticket.categoria || 'Geral')}`}</span>
            ${ticket.urgencia ? `<span class="chamado-urgencia ${ticket.urgencia === 'alta' ? 'alta' : ''}">Urgência: ${Furia.escape(ticket.urgencia.toUpperCase())}</span>` : ''}
          </div>
          <span class="chamado-data">${Furia.formatDate(ticket.created_at || ticket.data)}</span>
        </div>
      `;
      const anexo = Furia.parseAttachment(ticket.anexo);
      if (anexo) {
        const slot = card.querySelector('.card-attachment-slot');
        if (slot) {
          const attachBox = document.createElement('div');
          attachBox.className = 'ticket-attachment-box';
          attachBox.style.marginBottom = '12px';

          if (anexo.url) {
            if (anexo.isImage) {
              const thumb = document.createElement('img');
              thumb.src = anexo.url;
              thumb.alt = anexo.name;
              thumb.className = 'attachment-thumbnail-trigger';
              thumb.title = 'Clique para ampliar a imagem';
              thumb.addEventListener('click', () => {
                Furia.showImageModal(anexo.url, ticket.titulo, ticket.userName || ticket.user_name);
              });
              attachBox.appendChild(thumb);
            }

            const btnView = document.createElement('button');
            btnView.type = 'button';
            btnView.className = 'btn-attachment-preview';
            btnView.innerHTML = `🖼️ Ver Imagem Anexada <span style="font-size: 0.72rem; opacity: 0.8">(${Furia.escape(anexo.name)})</span>`;
            btnView.addEventListener('click', () => {
              Furia.showImageModal(anexo.url, ticket.titulo, ticket.userName || ticket.user_name);
            });
            attachBox.appendChild(btnView);
          } else {
            const fileNote = document.createElement('span');
            fileNote.className = 'text-muted';
            fileNote.style.fontSize = '0.78rem';
            fileNote.textContent = `📎 ${anexo.name}`;
            attachBox.appendChild(fileNote);
          }

          slot.appendChild(attachBox);
        }
      }

      listContainer.appendChild(card);
    });
  }

  // Configuração dos botões de filtro de status
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      filtroAtual = btn.dataset.filter || 'todos';
      renderizarChamados();
    });
  });

  carregarChamados();
});

