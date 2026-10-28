/**
 * ==============================================================================
 * FURIA Helpdesk - Utilitários Compartilhados (assets/js/app.js)
 * ==============================================================================
 * Este arquivo reúne apenas as funções essenciais compartilhadas por todas as páginas:
 * 1. Comunicação com a API do Backend (SQLite).
 * 2. Gestão simples da sessão do usuário ativo.
 * 3. Controle do menu do avatar e visualização de senha (olho aberto/fechado).
 */

const Furia = {
  // Endereço base da API backend (porta 3000)
  apiUrl: (window.location.port === '3000') ? '/api' : 'http://localhost:3000/api',

  // ----------------------------------------------------------------------------
  // SESSÃO DO USUÁRIO
  // Mantemos APENAS a sessão do usuário conectado (NUNCA lista de outros usuários)
  // ----------------------------------------------------------------------------
  getUser() {
    try {
      const saved = sessionStorage.getItem('furia_user') || localStorage.getItem('furia_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setUser(user, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('furia_user', JSON.stringify(user));
    if (remember) {
      localStorage.setItem('furia_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('furia_user');
    }
  },

  logout() {
    sessionStorage.removeItem('furia_user');
    localStorage.removeItem('furia_user');
    const root = this.getRootPath();
    window.location.href = `${root}index.html`;
  },

  // Garante que páginas privadas só sejam acessadas por quem está autenticado
  requireAuth(allowedRole = null) {
    const user = this.getUser();
    const root = this.getRootPath();

    if (!user) {
      window.location.replace(`${root}index.html?unauthorized=1`);
      return false;
    }

    if (allowedRole && user.role !== allowedRole) {
      window.location.replace(`${root}inicial/index.html?forbidden=1`);
      return false;
    }

    return true;
  },

  // Retorna o caminho relativo correto até a raiz do site
  getRootPath() {
    const p = window.location.pathname.replace(/\\/g, '/');
    const subfolders = ['/admin/', '/inicial/', '/chamados/', '/conta/', '/presencial/', '/problemas/', '/enviados/', '/errado/'];
    for (const folder of subfolders) {
      if (p.includes(folder)) return '../';
    }
    return './';
  },

  // ----------------------------------------------------------------------------
  // COMUNICAÇÃO COM O BANCO DE DADOS (API REST -> SQLite)
  // ----------------------------------------------------------------------------
  async api(endpoint, method = 'GET', data = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkError) {
      throw new Error('Servidor backend offline. Abra o terminal na pasta backend e execute: npm start');
    }

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      const msg = (result && (result.error || result.message)) || `Erro na requisição (${response.status})`;
      throw new Error(msg);
    }

    return result;
  },

  // ----------------------------------------------------------------------------
  // HELPERS DE INTERFACE (Menu do Avatar, Olho da Senha, Formatação)
  // ----------------------------------------------------------------------------
  initMenu() {
    const btn = document.getElementById('iconeUsuario');
    const menu = document.getElementById('menuUsuario');
    const user = this.getUser();

    if (!btn || !menu) return;

    // Se for admin, adiciona link de acesso rápido ao painel administrativo
    if (user && user.role === 'admin') {
      const menuList = menu.querySelector('ul');
      if (menuList && !menuList.querySelector('a[href*="admin"]')) {
        const root = this.getRootPath();
        const li = document.createElement('li');
        li.innerHTML = `<a href="${root}admin/index.html">👑 Painel Admin</a>`;
        menuList.prepend(li);
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('ativo');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('ativo');
      }
    });

    // Links de logout
    document.querySelectorAll('.logout a, [data-action="logout"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  },

  setupPasswordToggle() {
    const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

    document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? eyeClosedSVG : eyeOpenSVG;
        btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Ver senha');
      });
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return 'Data não informada';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Data não informada';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.Furia = Furia;

