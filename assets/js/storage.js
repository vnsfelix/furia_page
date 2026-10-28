/**
 * FURIA Helpdesk - Camada de Integração com o Banco de Dados SQLite (Backend API)
 *
 * Todos os dados (usuários, senhas criptografadas, chamados) são gravados
 * EXCLUSIVAMENTE no banco SQLite (backend/database.sqlite).
 * Nenhum dado sensível de tabela de usuários ou histórico de chamados fica
 * no LocalStorage do navegador, protegendo contra inspeção via Console/DevTools.
 */

(function () {
  const { STORAGE_KEYS, API_BASE_URL } = window.FURIA_CONFIG;

  // Limpeza imediata de qualquer resíduo legado do LocalStorage
  try {
    localStorage.removeItem('furia_users');
    localStorage.removeItem('furia_users_db');
    localStorage.removeItem('furia_tickets');
    localStorage.removeItem('furia_tickets_db');
  } catch (e) {
    // ignora em caso de bloqueio de storage
  }

  // Helper central para requisições à API
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-id'] = token;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers
      });
    } catch (networkError) {
      throw new Error(
        'Não foi possível conectar ao servidor backend (http://localhost:3000). ' +
        'Inicie o servidor com "npm start" na pasta backend para salvar no SQLite.'
      );
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = (data && (data.error || data.message)) || `Erro na comunicação com o servidor (${response.status})`;
      throw new Error(errorMsg);
    }

    return data;
  }

  const FuriaDB = {
    // Acesso direto à API para chamadas especiais (como login e registro)
    rawRequest: apiRequest,

    // --- USUÁRIOS (Tabela users no SQLite) ---
    async getUsers() {
      const users = await apiRequest('/users', { method: 'GET' });
      return Array.isArray(users) ? users : [];
    },

    async getUserById(id) {
      if (!id) return null;
      try {
        return await apiRequest(`/users/${encodeURIComponent(id)}`, { method: 'GET' });
      } catch {
        return null;
      }
    },

    async createUser(userData) {
      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return res.user || res;
    },

    async updateUser(id, updates) {
      const res = await apiRequest(`/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return res.user || res;
    },

    async deleteUser(id) {
      await apiRequest(`/users/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return true;
    },

    // --- TICKETS / CHAMADOS (Tabela tickets no SQLite) ---
    async getTickets(filter = {}) {
      let endpoint = '/tickets';
      if (filter.userId) {
        endpoint = `/tickets/user/${encodeURIComponent(filter.userId)}`;
      } else if (filter.status) {
        endpoint = `/tickets?status=${encodeURIComponent(filter.status)}`;
      }

      const tickets = await apiRequest(endpoint, { method: 'GET' });
      return Array.isArray(tickets) ? tickets : [];
    },

    async getTicketById(id) {
      if (!id) return null;
      try {
        return await apiRequest(`/tickets/${encodeURIComponent(id)}`, { method: 'GET' });
      } catch {
        return null;
      }
    },

    async createTicket(ticketData) {
      const res = await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      });
      return res.ticket || res;
    },

    async updateTicketStatus(ticketId, newStatus) {
      const res = await apiRequest(`/tickets/${encodeURIComponent(ticketId)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      return res.ticket || res;
    },

    async deleteTicket(ticketId) {
      await apiRequest(`/tickets/${encodeURIComponent(ticketId)}`, {
        method: 'DELETE'
      });
      return true;
    }
  };

  // Função para limpar dados locais de sessão pelo console
  window.resetarBancoFURIA = function () {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Sessão limpa! Os usuários e chamados permanecem seguros no banco SQLite (backend/database.sqlite).');
    window.location.reload();
  };

  window.FuriaDB = FuriaDB;
})();
