/**
 * FURIA Helpdesk - Camada de Dados e Armazenamento Híbrido
 * Suporta modo API REST (quando o servidor backend está online)
 * e modo LocalStorage (quando rodando estático ou offline).
 */

(function () {
  const { STORAGE_KEYS, API_BASE_URL, ROLES, TICKET_STATUS } = window.FURIA_CONFIG;

  // Apenas o Administrador de teste
  const INITIAL_USERS = [
    {
      id: 'usr_admin',
      name: 'Administrador FURIA',
      email: 'admin@furia.gg',
      password: 'admin',
      role: ROLES.ADMIN,
      department: 'Tecnologia & Operações',
      createdAt: new Date().toISOString()
    }
  ];

  // Chamados iniciam 100% limpos para seu novo banco
  const INITIAL_TICKETS = [];

  // Inicializa o banco local garantindo que apenas o admin exista inicialmente
  function initLocalStorageDB() {
    let users = [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      users = data ? JSON.parse(data) : [];
      if (!Array.isArray(users)) users = [];
    } catch {
      users = [];
    }

    // Remove usuários de teste antigos para manter apenas o Admin
    users = users.filter((u) => u.email && u.email.toLowerCase() !== 'usuario@furia.gg');

    // Garante que o Administrador de teste sempre exista
    INITIAL_USERS.forEach((initUser) => {
      const index = users.findIndex((u) => u.email && u.email.toLowerCase() === initUser.email.toLowerCase());
      if (index === -1) {
        users.push(initUser);
      } else {
        users[index].password = initUser.password;
        users[index].role = initUser.role;
      }
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Remove chamados antigos de teste deixando a lista limpa
    try {
      let tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || '[]');
      tickets = tickets.filter((t) => t.id !== 'TK-1001' && t.id !== 'TK-1002');
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    } catch {
      localStorage.setItem(STORAGE_KEYS.TICKETS, '[]');
    }
  }

  initLocalStorageDB();

  // Função global para você zerar tudo a qualquer momento pelo Console do navegador
  window.resetarBancoFURIA = function () {
    localStorage.clear();
    sessionStorage.clear();
    initLocalStorageDB();
    console.log('Todos os dados foram resetados! Apenas o Admin permanece ativo.');
    window.location.reload();
  };

  // Helper para verificar se a API Express está online
  let isApiOnline = null;
  async function checkApiOnline() {
    if (isApiOnline !== null) return isApiOnline;
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(1200) });
      isApiOnline = res.ok;
    } catch {
      isApiOnline = false;
    }
    return isApiOnline;
  }

  const FuriaDB = {
    // --- USUÁRIOS ---
    getUsers() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },

    getUserByEmail(email) {
      if (!email) return null;
      const cleanEmail = email.trim().toLowerCase();
      const users = this.getUsers();
      return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
    },

    getUserById(id) {
      const users = this.getUsers();
      return users.find(u => u.id === id) || null;
    },

    createUser(userData) {
      const users = this.getUsers();
      const cleanEmail = userData.email.trim().toLowerCase();

      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        throw new Error('Este e-mail já está cadastrado no sistema.');
      }

      const newUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: userData.name.trim(),
        email: cleanEmail,
        password: userData.password,
        role: userData.role || ROLES.FUNCIONARIO,
        department: userData.department || 'Geral',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return newUser;
    },

    updateUser(id, updates) {
      const users = this.getUsers();
      const index = users.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Usuário não encontrado.');

      users[index] = { ...users[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[index];
    },

    deleteUser(id) {
      let users = this.getUsers();
      users = users.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    },

    // --- TICKETS / CHAMADOS ---
    getTickets(filter = {}) {
      try {
        let tickets = JSON.parse(localStorage.getItem(STORAGE_KEYS.TICKETS) || '[]');
        if (filter.userId) {
          tickets = tickets.filter(t => t.userId === filter.userId);
        }
        if (filter.status) {
          tickets = tickets.filter(t => t.status === filter.status);
        }
        return tickets;
      } catch {
        return [];
      }
    },

    getTicketById(id) {
      const tickets = this.getTickets();
      return tickets.find(t => t.id === id) || null;
    },

    createTicket(ticketData) {
      const tickets = this.getTickets();
      const newTicket = {
        id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: ticketData.userId,
        userName: ticketData.userName,
        userEmail: ticketData.userEmail,
        tipo: ticketData.tipo || 'problemas',
        titulo: ticketData.titulo || 'Solicitação de suporte',
        categoria: ticketData.categoria || 'Geral',
        local: ticketData.local || '',
        tiposervico: ticketData.tiposervico || '',
        descricao: ticketData.descricao || '',
        urgencia: ticketData.urgencia || 'media',
        anexo: ticketData.anexo || null,
        status: TICKET_STATUS.RECEBIDO,
        data: new Date().toISOString()
      };

      tickets.unshift(newTicket);
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      return newTicket;
    },

    updateTicketStatus(ticketId, newStatus) {
      const tickets = this.getTickets();
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) throw new Error('Chamado não encontrado.');

      ticket.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      return ticket;
    },

    deleteTicket(ticketId) {
      let tickets = this.getTickets();
      tickets = tickets.filter(t => t.id !== ticketId);
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      return true;
    }
  };

  window.FuriaDB = FuriaDB;
})();

