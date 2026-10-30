/**
 * ==============================================================================
 * FURIA Helpdesk - Utilitários Compartilhados (assets/js/app.js)
 * ==============================================================================
 * Este arquivo reúne as funções essenciais compartilhadas por todas as páginas:
 * 1. Comunicação com a API do Backend (SQLite / Vercel Serverless).
 * 2. Gestão simples da sessão do usuário ativo.
 * 3. Controle do menu do avatar e visualização de senha (olho aberto/fechado).
 * 4. Visualização de anexos/imagens em modal com download e tela cheia.
 */

const Furia = {
  // Endereço base da API backend (detecta automaticamente localhost:3000 ou Vercel /api)
  apiUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '3000' ? '/api' : 'http://localhost:3000/api')
    : '/api',

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

    if (allowedRole) {
      const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
      if (!allowed.includes(user.role)) {
        window.location.replace(`${root}inicial/index.html?forbidden=1`);
        return false;
      }
    }

    return true;
  },

  // Retorna o caminho relativo correto até a raiz do site
  getRootPath() {
    const p = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const subfolders = ['/admin', '/tecnico', '/inicial', '/chamados', '/conta', '/presencial', '/problemas', '/enviados', '/errado'];
    for (const folder of subfolders) {
      if (p.includes(`${folder}/`) || p.endsWith(folder) || p.endsWith(`${folder}/index.html`)) {
        return '../';
      }
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
  // HELPERS DE INTERFACE (Menu do Avatar, Olho da Senha, Formatação, Modais)
  // ----------------------------------------------------------------------------
  initMenu() {
    const btn = document.getElementById('iconeUsuario');
    const menu = document.getElementById('menuUsuario');
    const user = this.getUser();

    if (!btn || !menu) return;

    const menuList = menu.querySelector('ul');
    if (menuList && user) {
      const root = this.getRootPath();

      // Painel Admin para administradores
      if (user.role === 'admin' && !menuList.querySelector('a[href*="admin"]')) {
        const liAdmin = document.createElement('li');
        liAdmin.innerHTML = `<a href="${root}admin/index.html">👑 Painel Admin</a>`;
        menuList.prepend(liAdmin);
      }

      // Painel Técnico para técnicos e admins
      if ((user.role === 'tecnico' || user.role === 'admin') && !menuList.querySelector('a[href*="tecnico"]')) {
        const liTecnico = document.createElement('li');
        liTecnico.innerHTML = `<a href="${root}tecnico/index.html">🛠️ Painel Técnico</a>`;
        const adminLi = menuList.querySelector('a[href*="admin"]')?.closest('li');
        if (adminLi && adminLi.nextSibling) {
          menuList.insertBefore(liTecnico, adminLi.nextSibling);
        } else {
          menuList.prepend(liTecnico);
        }
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
  },

  // ----------------------------------------------------------------------------
  // GESTÃO E VISUALIZAÇÃO DE ANEXOS / IMAGENS
  // ----------------------------------------------------------------------------
  parseAttachment(anexo) {
    if (!anexo) return null;
    if (typeof anexo === 'object') {
      const url = anexo.data || anexo.url || null;
      const isImg = !!(anexo.type && anexo.type.startsWith('image/')) || !!(url && url.startsWith('data:image'));
      return {
        name: anexo.name || 'Anexo',
        url,
        isImage: isImg
      };
    }
    const str = String(anexo).trim();
    if (str.startsWith('{')) {
      try {
        const obj = JSON.parse(str);
        const url = obj.data || obj.url || null;
        const isImg = !!(obj.type && obj.type.startsWith('image/')) || !!(url && url.startsWith('data:image'));
        return {
          name: obj.name || 'Anexo',
          url,
          isImage: isImg
        };
      } catch {}
    }
    if (str.startsWith('data:image')) {
      return {
        name: 'Imagem anexada',
        url: str,
        isImage: true
      };
    }
    return {
      name: str,
      url: null,
      isImage: false
    };
  },

  showImageModal(imageUrl, title = 'Imagem do Chamado', author = '') {
    const existing = document.getElementById('furiaImageModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'furiaImageModal';
    modal.className = 'image-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', title);

    modal.innerHTML = `
      <div class="image-modal-content">
        <header class="image-modal-header">
          <div class="image-modal-title-box">
            <h3 class="image-modal-title">${this.escape(title)}</h3>
            ${author ? `<p class="image-modal-subtitle">Enviado por: <strong>${this.escape(author)}</strong></p>` : ''}
          </div>
          <button type="button" class="image-modal-close" aria-label="Fechar">&times;</button>
        </header>

        <div class="image-modal-body">
          <img src="${imageUrl}" alt="Anexo do chamado" class="image-modal-img">
        </div>

        <footer class="image-modal-footer">
          <a href="${imageUrl}" download="furia-chamado-anexo.png" class="btn btn-secondary btn-sm">
            ⬇️ Baixar Imagem
          </a>
          <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
            ↗️ Abrir em Nova Aba
          </a>
          <button type="button" class="btn btn-sm image-modal-close-btn">Fechar</button>
        </footer>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Animação de entrada
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });

    const closeModal = () => {
      modal.classList.remove('active');
      modal.classList.add('closing');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 180);
      document.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    modal.querySelectorAll('.image-modal-close, .image-modal-close-btn').forEach((b) => {
      b.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', onKeyDown);
  }
};

window.Furia = Furia;
