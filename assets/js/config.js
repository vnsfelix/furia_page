/**
 * FURIA Helpdesk - Configurações Globais
 */
const FURIA_CONFIG = {
  // Determina a URL base da API REST (se acessado por localhost:3000 ou via Live Server)
  API_BASE_URL: window.FURIA_API_URL || (
    window.location.port === '3000'
      ? '/api'
      : 'http://localhost:3000/api'
  ),

  // Chaves de armazenamento de sessão no navegador
  // (Apenas a sessão ativa do usuário fica guardada, nada de listas de usuários ou chamados no LocalStorage)
  STORAGE_KEYS: {
    CURRENT_USER: 'furia_current_user',
    AUTH_TOKEN: 'furia_auth_token'
  },

  // Papéis de usuários suportados
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
