/**
 * ==============================================================================
 * FURIA Helpdesk - Utilitários Compartilhados (assets/js/app.js)
 * ==============================================================================
 * Este arquivo reúne as funções essenciais compartilhadas por todas as páginas:
 * 1. Comunicação com a API do Backend (Supabase / Vercel Serverless).
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

  setUser(user, remember = null) {
    if (remember === null) remember = Boolean(localStorage.getItem('furia_user'));
    sessionStorage.removeItem('furia_user');
    localStorage.removeItem('furia_user');
    (remember ? localStorage : sessionStorage).setItem('furia_user', JSON.stringify(user));
  },

  async restoreSession() {
    try {
      const result = await this.api('/auth/me');
      this.setUser(result.user);
      return result.user;
    } catch {
      sessionStorage.removeItem('furia_user');
      localStorage.removeItem('furia_user');
      return null;
    }
  },

  async logout() {
    try { await this.api('/auth/logout', 'POST', {}); }
    catch (err) { window.alert(err.message); return; }
    sessionStorage.removeItem('furia_user');
    localStorage.removeItem('furia_user');
    window.location.href = this.getRootPath() + 'index.html';
  },

  async requireAuth(allowedRole = null) {
    const user = await this.restoreSession();
    const root = this.getRootPath();
    if (!user) { window.location.replace(root + 'index.html?unauthorized=1'); return false; }
    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (allowedRole && !allowed.includes(user.role)) { window.location.replace(root + 'inicial/index.html?forbidden=1'); return false; }
    return true;
  },

  watch(refresh) {
    let busy = false;
    let stopped = false;
    let failures = 0;
    let timer;
    const tick = async () => {
      clearTimeout(timer);
      if (stopped) return;
      if (!busy && !document.hidden && !['SELECT', 'INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        busy = true;
        try { await refresh(); failures = 0; } catch { failures = Math.min(failures + 1, 3); }
        finally { busy = false; }
      }
      timer = setTimeout(tick, 15000 * (2 ** failures));
    };
    timer = setTimeout(tick, 15000);
    const visible = () => { if (!document.hidden && !busy) tick(); };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', visible); }, { once: true });
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
  // COMUNICAÇÃO COM O BANCO DE DADOS (API REST -> Supabase)
  // ----------------------------------------------------------------------------
  async api(endpoint, method = 'GET', data = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      credentials: 'include',
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
      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        sessionStorage.removeItem('furia_user'); localStorage.removeItem('furia_user');
        window.location.replace(this.getRootPath() + 'index.html?unauthorized=1');
      }
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
      const isAdmin = user.role === 'admin';
      const isTecnico = user.role === 'tecnico' || isAdmin;

      // Monta os links do menu de forma consistente e sem duplicidades
      const items = [];

      if (isAdmin) {
        items.push(`<li><a href="${root}admin/index.html">👑 Painel Admin</a></li>`);
      }
      if (isTecnico) {
        items.push(`<li><a href="${root}tecnico/index.html">🛠️ Painel Técnico</a></li>`);
      }

      const inicioLabel = (isAdmin || isTecnico) ? 'Área do Funcionário' : 'Início';
      items.push(`<li><a href="${root}inicial/index.html">${inicioLabel}</a></li>`);
      items.push(`<li><a href="${root}chamados/index.html">Meus Chamados</a></li>`);
      items.push(`<li><a href="${root}conta/index.html">Minha Conta</a></li>`);

      menuList.innerHTML = items.join('');

      // Cabeçalho do usuário no menu suspenso
      if (!menu.querySelector('.user-menu-header')) {
        const header = document.createElement('div');
        header.className = 'user-menu-header';
        const roleLabel = isAdmin ? 'Administrador' : (user.role === 'tecnico' ? 'Técnico' : 'Funcionário');
        header.innerHTML = `
          <span class="user-menu-name">${this.escape(user.nome || user.name || 'Usuário')}</span>
          <span class="user-menu-email">${this.escape(user.email || '')}</span>
          <span class="user-menu-role">${this.escape(roleLabel)}</span>
        `;
        menu.insertBefore(header, menuList);
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
  attachmentUrl(value) {
    return typeof value === 'string' && value.startsWith('/api/') ? this.apiUrl + value.slice(4) : value;
  },
  parseAttachment(anexo) {
    if (!anexo) return null;
    if (typeof anexo === 'object') {
      const url = this.attachmentUrl(anexo.data || anexo.url || null);
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
        const url = this.attachmentUrl(obj.data || obj.url || null);
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

  showAttachment(attachment, title, author) {
    if (!attachment?.url) return;
    if (attachment.isImage) return this.showImageModal(attachment.url, title, author);
    if (attachment.url.startsWith(this.apiUrl + '/tickets/')) {
      const link = document.createElement('a'); link.href = attachment.url;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click();
    }
  },

  showImageModal(imageUrl, title = 'Imagem do Chamado', author = '') {
    if (!imageUrl || typeof imageUrl !== 'string') return;
    const cleanUrl = imageUrl.trim();
    const isSafe = /^data:image\/(png|jpeg|gif|webp);base64,/i.test(cleanUrl) || /^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('../') || cleanUrl.startsWith('./') || cleanUrl.startsWith('/');
    if (!isSafe) {
      console.warn('URL bloqueada por segurança:', cleanUrl);
      return;
    }
    const safeUrl = this.escape(cleanUrl);
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
          <img src="${safeUrl}" alt="Anexo do chamado" class="image-modal-img">
        </div>

        <footer class="image-modal-footer">
          <a href="${safeUrl}" download="furia-chamado-anexo.png" class="btn btn-secondary btn-sm">
            ⬇️ Baixar Imagem
          </a>
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
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
