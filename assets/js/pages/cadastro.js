/**
 * FURIA Helpdesk - Script da Tela de Cadastro
 */

document.addEventListener('DOMContentLoaded', () => {
  const cadastroForm = document.getElementById('cadastroForm');
  const messageEl = document.getElementById('cadastroMessage');

  // Se já estiver logado, redireciona
  const currentUser = window.FuriaAuth.getCurrentUser();
  if (currentUser) {
    const destination = currentUser.role === 'admin' ? './admin/index.html' : './inicial/index.html';
    window.location.replace(destination);
    return;
  }

  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;
      const submitBtn = cadastroForm.querySelector('button[type="submit"]');

      window.FuriaUI.setMessage(messageEl, '', false);

      if (!name || !email || !password || !confirmPassword) {
        window.FuriaUI.setMessage(messageEl, 'Preencha todos os campos para se cadastrar.', true);
        return;
      }

      if (password !== confirmPassword) {
        window.FuriaUI.setMessage(messageEl, 'As senhas não coincidem. Digite novamente.', true);
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Criando conta...';

      try {
        const newUser = await window.FuriaAuth.register({
          name,
          email,
          department: 'Geral',
          role: 'funcionario',
          password,
          confirmPassword
        });

        // Entra direto na conta criada
        window.location.href = newUser.role === 'admin' ? './admin/index.html' : './inicial/index.html';
      } catch (error) {
        window.FuriaUI.setMessage(messageEl, error.message || 'Não foi possível concluir o cadastro.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});

