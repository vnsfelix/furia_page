/**
 * FURIA Helpdesk - Sistema de Autenticação Segura (Integrado ao SQLite)
 */

(function () {
  const { STORAGE_KEYS, ROLES } = window.FURIA_CONFIG;

  const FuriaAuth = {
    // Retorna os dados do usuário atualmente logado (sem senha)
    getCurrentUser() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    // Verifica se há usuário autenticado
    isAuthenticated() {
      return this.getCurrentUser() !== null;
    },

    // Verifica se o usuário autenticado é admin
    isAdmin() {
      const user = this.getCurrentUser();
      return user && user.role === ROLES.ADMIN;
    },

    // Realiza o Login por E-MAIL e SENHA consultando diretamente o banco SQLite
    async login(email, password, remember = false) {
      if (!email || !password) {
        throw new Error('Informe seu e-mail e senha.');
      }

      const cleanEmail = email.trim().toLowerCase();
      const inputPass = String(password).trim();

      const res = await window.FuriaDB.rawRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password: inputPass
        })
      });

      const sessionUser = res.user;
      const token = res.token || sessionUser.id;

      // Armazena apenas o usuário logado para manter a sessão ativa
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

      if (remember) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      }

      return sessionUser;
    },

    // Realiza o Cadastro de novo usuário direto no banco SQLite
    async register(data) {
      const { name, email, password, confirmPassword, department, role } = data;

      if (!name || name.trim().length < 3) {
        throw new Error('Informe seu nome completo (mínimo 3 caracteres).');
      }

      if (!email || !this.isValidEmail(email)) {
        throw new Error('Informe um endereço de e-mail válido.');
      }

      if (!password || password.length < 3) {
        throw new Error('A senha deve ter pelo menos 3 caracteres.');
      }

      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }

      const res = await window.FuriaDB.rawRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          department: department || 'Geral',
          role: role || ROLES.FUNCIONARIO
        })
      });

      const sessionUser = res.user;
      const token = res.token || sessionUser.id;

      // Efetua login automático após o cadastro
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

      return sessionUser;
    },

    // Atualiza os dados do perfil logado no banco SQLite
    async updateProfile(updates) {
      const currentUser = this.getCurrentUser();
      if (!currentUser) throw new Error('Nenhum usuário logado.');

      const updated = await window.FuriaDB.updateUser(currentUser.id, updates);

      const sessionUser = {
        ...currentUser,
        name: updated.name || updated.nome || currentUser.name,
        department: updated.department || currentUser.department
      };

      if (localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      }
      if (sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      }

      return sessionUser;
    },

    // Logout
    logout() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

      const rootPath = this.getRootPath();
      window.location.href = `${rootPath}index.html`;
    },

    // Validador de formato de e-mail
    isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    },

    // Retorna o caminho relativo até a raiz do projeto
    getRootPath() {
      const pathname = window.location.pathname.replace(/\\/g, '/');
      if (
        pathname.includes('/admin/') ||
        pathname.includes('/inicial/') ||
        pathname.includes('/chamados/') ||
        pathname.includes('/conta/') ||
        pathname.includes('/presencial/') ||
        pathname.includes('/Presencial/') ||
        pathname.includes('/problemas/') ||
        pathname.includes('/enviados/') ||
        pathname.includes('/errado/')
      ) {
        return '../';
      }
      return './';
    },

    // Guarda de Rotas (Route Guard): Protege páginas privadas
    requireAuth(allowedRoles = null) {
      const user = this.getCurrentUser();
      const root = this.getRootPath();

      if (!user) {
        window.location.replace(`${root}index.html?unauthorized=1`);
        return false;
      }

      if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
        window.location.replace(`${root}inicial/index.html?forbidden=1`);
        return false;
      }

      return true;
    }
  };

  window.FuriaAuth = FuriaAuth;
})();
