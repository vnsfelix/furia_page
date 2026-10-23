/**
 * FURIA Helpdesk - Configurações Globais
 */
const FURIA_CONFIG = {
  // URL base do backend Express (se estiver em execução)
  API_BASE_URL: window.FURIA_API_URL || 'http://localhost:3000/api',

  // Chaves de armazenamento no LocalStorage / SessionStorage
  STORAGE_KEYS: {
    CURRENT_USER: 'furia_current_user',
    AUTH_TOKEN: 'furia_auth_token',
    USERS: 'furia_users_db',
    TICKETS: 'furia_tickets_db',
    SETTINGS: 'furia_settings'
  },

  // Papeis de usuários suportados
  ROLES: {
    ADMIN: 'admin',
    FUNCIONARIO: 'funcionario',
    TECNICO: 'tecnico'
  },

  // Status de chamados
  TICKET_STATUS: {
    RECEBIDO: 'Recebido',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído'
  }
};

window.FURIA_CONFIG = FURIA_CONFIG;

