/**
 * FURIA Helpdesk - Componentes de Interface e Helpers UI
 */

(function () {
  const FuriaUI = {
    // Sanitizador simples para proteção contra XSS
    escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Formata datas para o padrão brasileiro
    formatDate(dateString) {
      if (!dateString) return 'Data indisponível';
      const d = new Date(dateString);
      return Number.isNaN(d.getTime())
        ? 'Data indisponível'
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    // Inicializa o menu de usuário / perfil presente no topo das páginas internas
    initUserMenu() {
      const userBtn = document.getElementById('iconeUsuario');
      const userMenu = document.getElementById('menuUsuario');
      const user = window.FuriaAuth ? window.FuriaAuth.getCurrentUser() : null;

      if (!userBtn || !userMenu) return;

      const root = window.FuriaAuth ? window.FuriaAuth.getRootPath() : '../';

      // Atualiza ou insere o cabeçalho do menu com informações reais do usuário
      let menuHeader = userMenu.querySelector('.user-menu-header');
      if (!menuHeader && user) {
        menuHeader = document.createElement('div');
        menuHeader.className = 'user-menu-header';
        menuHeader.innerHTML = `
          <span class="user-menu-name">${this.escapeHTML(user.name)}</span>
          <span class="user-menu-email">${this.escapeHTML(user.email)}</span>
          <span class="user-menu-role">${user.role === 'admin' ? 'Administrador' : 'Funcionário'}</span>
        `;
        userMenu.prepend(menuHeader);
      }

      // Adiciona link para o painel administrativo se for admin
      if (user && user.role === 'admin') {
        const menuList = userMenu.querySelector('ul');
        if (menuList && !menuList.querySelector('a[href*="admin"]')) {
          const adminLi = document.createElement('li');
          adminLi.innerHTML = `<a href="${root}admin/index.html">👑 Painel Admin</a>`;
          menuList.prepend(adminLi);
        }
      }

      // Alternar abertura do menu
      const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !userMenu.classList.contains('ativo');
        userMenu.classList.toggle('ativo', isOpen);
        userBtn.setAttribute('aria-expanded', String(isOpen));
      };

      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Fechar ao clicar fora ou pressionar ESC
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userBtn.contains(e.target)) {
          toggleMenu(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(false);
      });

      // Tratar botões de logout
      const logoutLinks = document.querySelectorAll('.logout a, [data-action="logout"]');
      logoutLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.FuriaAuth) {
            window.FuriaAuth.logout();
          }
        });
      });
    },

    // Exibe mensagens nos alertas
    setMessage(element, message, isError = true) {
      if (!element) return;
      element.textContent = message;
      if (message) {
        element.classList.toggle('erro', isError);
        element.classList.toggle('sucesso', !isError);
        element.classList.toggle('alert-error', isError);
        element.classList.toggle('alert-success', !isError);
      } else {
        element.className = '';
      }
    },

    // Ícones SVG nítidos e padronizados
    eyeOpenIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeClosedIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',

    // Inicializa botões de alternar visualização de senha
    initPasswordToggles() {
      document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;

        // Estado inicial
        btn.innerHTML = input.type === 'password' ? this.eyeOpenIcon : this.eyeClosedIcon;
        btn.setAttribute('aria-label', input.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');

        btn.addEventListener('click', () => {
          if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = this.eyeClosedIcon;
            btn.setAttribute('aria-label', 'Ocultar senha');
          } else {
            input.type = 'password';
            btn.innerHTML = this.eyeOpenIcon;
            btn.setAttribute('aria-label', 'Mostrar senha');
          }
        });
      });
    }
  };

  window.FuriaUI = FuriaUI;

  // Auto-inicializa componentes comuns ao carregar o DOM
  document.addEventListener('DOMContentLoaded', () => {
    FuriaUI.initUserMenu();
    FuriaUI.initPasswordToggles();
  });
})();

