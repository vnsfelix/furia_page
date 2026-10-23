/**
 * FURIA Helpdesk - Script da Tela Inicial / Home
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a rota: apenas usuários autenticados
  if (!window.FuriaAuth.requireAuth()) return;

  const user = window.FuriaAuth.getCurrentUser();
  const userNameEl = document.getElementById('userName');

  if (userNameEl && user) {
    const firstName = user.name.split(' ')[0] || user.name;
    userNameEl.textContent = firstName;
  }
});

