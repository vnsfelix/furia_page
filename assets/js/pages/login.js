/**
 * ==============================================================================
 * FURIA Helpdesk - Script de Login (assets/js/pages/login.js)
 * ==============================================================================
 * Lógica da tela de login:
 * 1. Inicializa o botão de alternar visualização de senha (olho aberto/fechado).
 * 2. Se o usuário já estiver logado, redireciona automaticamente.
 * 3. Envia o e-mail e senha digitados para a API (/api/auth/login).
 * 4. Salva a sessão e entra na conta (admin vai para /admin, outros para /inicial).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ativa o olho para mostrar/esconder senha
  Furia.setupPasswordToggle();

  // Se já estiver logado, redireciona imediatamente
  const user = Furia.getUser();
  if (user) {
    window.location.replace(user.role === 'admin' ? './admin/index.html' : './inicial/index.html');
    return;
  }

  const form = document.getElementById('loginForm');
  const messageEl = document.getElementById('loginMessage');
  const esqueciSenhaLink = document.getElementById('esqueciSenha');

  // Mostra aviso se o usuário foi deslogado ou tentou acessar página restrita
  const params = new URLSearchParams(window.location.search);
  if (params.get('unauthorized')) {
    mostrarMensagem('Faça login com seu e-mail e senha para continuar.');
  }

  // Quando o usuário clica em "Entrar na Conta"
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('rememberMe').checked;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      mostrarMensagem('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando...';
      esconderMensagem();

      // Envia os dados para a API do backend
      const res = await Furia.api('/auth/login', 'POST', { email, password });

      // Salva os dados do usuário autenticado na sessão
      Furia.setUser(res.user, remember);

      // Redireciona de acordo com o nível de acesso
      window.location.href = res.user.role === 'admin' ? './admin/index.html' : './inicial/index.html';
    } catch (err) {
      mostrarMensagem(err.message || 'E-mail ou senha incorretos.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar na Conta';
    }
  });

  // Link "Esqueci minha senha"
  if (esqueciSenhaLink) {
    esqueciSenhaLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Para redefinir sua senha, solicite ao suporte de TI da FURIA ou use a conta de teste:\n\n• Admin: admin@furia.gg (senha: admin)');
    });
  }

  function mostrarMensagem(texto) {
    messageEl.textContent = texto;
    messageEl.style.display = 'block';
  }

  function esconderMensagem() {
    messageEl.textContent = '';
    messageEl.style.display = 'none';
  }
});

