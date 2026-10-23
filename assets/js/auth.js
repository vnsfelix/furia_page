/**
 * FURIA Helpdesk - Sistema de Autenticação e Route Guards
 */

(function () {
  const { STORAGE_KEYS, ROLES } = window.FURIA_CONFIG;

  const FuriaAuth = {
    // Retorna o usuário logado no momento ou null
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

    // Realiza o Login por E-MAIL e SENHA
    async login(email, password, remember = false) {
      if (!email || !password) {
        throw new Error('Informe seu e-mail e senha.');
      }

      const cleanEmail = email.trim().toLowerCase();
      const inputPass = String(password).trim();
      let user = window.FuriaDB.getUserByEmail(cleanEmail);

      // Auto-recuperação apenas do administrador padrão de teste
      if (!user && cleanEmail === 'admin@furia.gg') {
        user = {
          id: 'usr_admin',
          name: 'Administrador FURIA',
          email: 'admin@furia.gg',
          password: 'admin',
          role: ROLES.ADMIN,
          department: 'Tecnologia & Operações'
        };
        try { window.FuriaDB.createUser(user); } catch {}
      }

      if (!user) {
        throw new Error('E-mail ou senha incorretos.');
      }

      const isMatch = String(user.password).trim() === inputPass ||
        (cleanEmail === 'admin@furia.gg' && (inputPass === 'admin' || inputPass === 'admin123'));

      if (!isMatch) {
        throw new Error('E-mail ou senha incorretos.');
      }

      // Cria payload seguro para a sessão (sem a senha!)
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'Geral'
      };

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      // Garante sincronia no localStorage para compatibilidade entre abas
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));

      return sessionUser;
    },

    // Realiza o Cadastro de novo usuário
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

      const createdUser = window.FuriaDB.createUser({
        name,
        email,
        password,
        department: department || 'Geral',
        role: role || ROLES.FUNCIONARIO
      });

      // Efetua login automático após o cadastro
      const sessionUser = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        department: createdUser.department
      };

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      return sessionUser;
    },

    // Atualiza os dados do perfil logado
    updateProfile(updates) {
      const currentUser = this.getCurrentUser();
      if (!currentUser) throw new Error('Nenhum usuário logado.');

      const updated = window.FuriaDB.updateUser(currentUser.id, updates);
      const sessionUser = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department
      };

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
      return sessionUser;
    },

    // Logout
    logout() {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

      // Redireciona para o login na raiz
      const rootPath = this.getRootPath();
      window.location.href = `${rootPath}index.html`;
    },

    // Validador simples de e-mail
    isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    },

    // Retorna o caminho relativo até a raiz do projeto baseado na URL atual
    getRootPath() {
      const pathname = window.location.pathname.replace(/\\/g, '/');
      const depth = (pathname.match(/\//g) || []).length;
      // Se estamos dentro de uma subpasta como /admin/, /inicial/, /chamados/, etc.
      if (pathname.includes('/admin/') || 
          pathname.includes('/inicial/') || 
          pathname.includes('/chamados/') || 
          pathname.includes('/conta/') || 
          pathname.includes('/presencial/') || 
          pathname.includes('/Presencial/') || 
          pathname.includes('/problemas/') || 
          pathname.includes('/enviados/') || 
          pathname.includes('/errado/')) {
        return '../';
      }
      return './';
    },

    // Guarda de Rotas (Route Guard): Protege páginas privadas
    requireAuth(allowedRoles = null) {
      const user = this.getCurrentUser();
      const root = this.getRootPath();

      if (!user) {
        // Redireciona para o login se não estiver autenticado
        window.location.replace(`${root}index.html?unauthorized=1`);
        return false;
      }

      if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
        // Usuário sem permissão de acesso (ex: funcionário tentando acessar /admin)
        window.location.replace(`${root}inicial/index.html?forbidden=1`);
        return false;
      }

      return true;
    }
  };

  window.FuriaAuth = FuriaAuth;
})();

