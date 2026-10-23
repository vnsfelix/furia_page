/**
 * FURIA Helpdesk - Script da Tela de Login
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const messageEl = document.getElementById('loginMessage');
  const esqueciSenhaLink = document.getElementById('esqueciSenha');

  // Se já estiver logado, redireciona diretamente
  const currentUser = window.FuriaAuth.getCurrentUser();
  if (currentUser) {
    const destination = currentUser.role === 'admin' ? './admin/index.html' : './inicial/index.html';
    window.location.replace(destination);
    return;
  }

  // Verifica parâmetros de URL informativos
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('unauthorized')) {
    window.FuriaUI.setMessage(messageEl, 'Faça login com seu e-mail e senha para continuar.', true);
  } else if (urlParams.get('registered')) {
    window.FuriaUI.setMessage(messageEl, 'Conta criada! Você já pode entrar.', false);
  } else if (urlParams.get('logged_out')) {
    window.FuriaUI.setMessage(messageEl, 'Sessão encerrada.', false);
  }

  // Handler de Envio do Formulário de Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const rememberInput = document.getElementById('rememberMe');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const remember = rememberInput ? rememberInput.checked : false;

      window.FuriaUI.setMessage(messageEl, '', false);

      if (!email || !password) {
        window.FuriaUI.setMessage(messageEl, 'Informe seu e-mail e senha para entrar.', true);
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Entrando...';

      try {
        const user = await window.FuriaAuth.login(email, password, remember);
        // Redirecionamento direto e natural
        window.location.href = user.role === 'admin' ? './admin/index.html' : './inicial/index.html';
      } catch (error) {
        window.FuriaUI.setMessage(messageEl, error.message || 'E-mail ou senha incorretos.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Link Esqueci Minha Senha
  if (esqueciSenhaLink) {
    esqueciSenhaLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Para recuperar sua senha, contate a equipe de TI da FURIA ou acesse com o admin de teste:\n\n• Admin: admin@furia.gg (senha: admin)');
    });
  }
});

