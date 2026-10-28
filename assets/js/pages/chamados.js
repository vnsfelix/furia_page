/**
 * FURIA Helpdesk - Script da Página de Meus Chamados
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a rota
  if (!window.FuriaAuth.requireAuth()) return;

  const currentUser = window.FuriaAuth.getCurrentUser();
  const listContainer = document.getElementById('chamadosList');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentFilter = 'todos';

  async function renderTickets() {
    if (!listContainer) return;

    try {
      // Busca chamados do usuário logado diretamente do banco SQLite
      const filterOptions = currentUser.role === 'admin' ? {} : { userId: currentUser.id };
      let tickets = await window.FuriaDB.getTickets(filterOptions);

      // Aplica filtro de status se não for "todos"
      if (currentFilter !== 'todos') {
        tickets = tickets.filter(t => (t.status || '').toLowerCase() === currentFilter.toLowerCase());
      }

      listContainer.replaceChildren();

      if (!tickets.length) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'chamados-empty';
        emptyDiv.innerHTML = `
          <p>Nenhuma solicitação encontrada ${currentFilter !== 'todos' ? 'com status "' + currentFilter + '"' : 'no seu histórico'}.</p>
          <a href="../inicial/index.html" class="btn btn-secondary">Abrir Nova Solicitação</a>
        `;
        listContainer.append(emptyDiv);
        return;
      }

    tickets.forEach((ticket) => {
      const card = document.createElement('article');
      card.className = 'chamado-card';

      // Status Badge class
      let badgeClass = 'status-pendente';
      if (ticket.status === 'Em andamento') badgeClass = 'status-andamento';
      else if (ticket.status === 'Concluído') badgeClass = 'status-concluido';

      const formattedDate = window.FuriaUI.formatDate(ticket.data);

      const header = document.createElement('div');
      header.className = 'chamado-header';
      header.innerHTML = `
        <span class="chamado-id">#${window.FuriaUI.escapeHTML(ticket.id)}</span>
        <span class="status-badge ${badgeClass}">${window.FuriaUI.escapeHTML(ticket.status)}</span>
      `;

      const title = document.createElement('h2');
      title.className = 'chamado-titulo';
      title.textContent = ticket.titulo || (ticket.tipo === 'presencial' ? 'Atendimento Presencial' : 'Relato de Problema');

      const desc = document.createElement('p');
      desc.className = 'chamado-descricao';
      desc.textContent = ticket.descricao || 'Sem descrição adicional.';

      const footer = document.createElement('div');
      footer.className = 'chamado-footer';

      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'chamado-info-tags';

      const catTag = document.createElement('span');
      catTag.className = 'chamado-categoria';
      catTag.textContent = ticket.tipo === 'presencial' ? `Local: ${ticket.local || 'Geral'}` : `Categoria: ${ticket.categoria || 'Geral'}`;
      tagsContainer.append(catTag);

      if (ticket.urgencia) {
        const urgTag = document.createElement('span');
        urgTag.className = `chamado-urgencia ${ticket.urgencia === 'alta' ? 'alta' : ''}`;
        urgTag.textContent = `Urgência: ${ticket.urgencia.toUpperCase()}`;
        tagsContainer.append(urgTag);
      }

      if (currentUser.role === 'admin' && ticket.userName) {
        const userTag = document.createElement('span');
        userTag.className = 'chamado-categoria';
        userTag.textContent = `Por: ${ticket.userName}`;
        tagsContainer.append(userTag);
      }

      const dateEl = document.createElement('span');
      dateEl.className = 'chamado-data';
      dateEl.textContent = formattedDate;

      footer.append(tagsContainer, dateEl);

      card.append(header, title, desc, footer);
      listContainer.append(card);
    });
    } catch (error) {
      listContainer.replaceChildren();
      const errDiv = document.createElement('div');
      errDiv.className = 'chamados-empty';
      errDiv.innerHTML = `<p style="color: #ff5555;">Erro ao carregar chamados do banco: ${window.FuriaUI.escapeHTML(error.message)}</p>`;
      listContainer.append(errDiv);
    }
  }

  // Filtros de status
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'todos';
      renderTickets();
    });
  });

  renderTickets();
});

