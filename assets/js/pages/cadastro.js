/**
 * ==============================================================================
 * FURIA Helpdesk - Script de Cadastro (assets/js/pages/cadastro.js)
 * ==============================================================================
 * Lógica da tela de cadastro de novos usuários:
 * 1. Ativa botões de ver/ocultar senha.
 * 2. Valida nome, e-mail, senha e confirmação de senha.
 * 3. Envia os dados para a API (/api/auth/register), gravando direto no SQLite.
 * 4. Faz login automático e redireciona para a página inicial.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ativa o olho para mostrar/esconder senha nos dois campos
  Furia.setupPasswordToggle();

  // Se já estiver logado, redireciona
  const user = Furia.getUser();
  if (user) {
    window.location.replace(user.role === 'admin' ? './admin/index.html' : './inicial/index.html');
    return;
  }

  const form = document.getElementById('cadastroForm');
  const messageEl = document.getElementById('cadastroMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validações básicas antes de enviar ao servidor
    if (!name || !email || !password || !confirmPassword) {
      mostrarMensagem('Preencha todos os campos para se cadastrar.');
      return;
    }

    if (password !== confirmPassword) {
      mostrarMensagem('As senhas digitadas não são iguais.');
      return;
    }

    if (password.length < 3) {
      mostrarMensagem('A senha deve ter no mínimo 3 caracteres.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Criando sua conta...';
      esconderMensagem();

      // Envia os dados para gravação direta no banco SQLite
      const res = await Furia.api('/auth/register', 'POST', {
        name,
        email,
        password
      });

      // Salva sessão do usuário recém-criado
      Furia.setUser(res.user);

      // Redireciona para o portal interno
      window.location.href = './inicial/index.html';
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao realizar cadastro.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Criar Conta';
    }
  });

  function mostrarMensagem(texto) {
    messageEl.textContent = texto;
    messageEl.style.display = 'block';
  }

  function esconderMensagem() {
    messageEl.textContent = '';
    messageEl.style.display = 'none';
  }
});

