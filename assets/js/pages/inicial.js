/**
 * ==============================================================================
 * FURIA Helpdesk - Script da Página Inicial (assets/js/pages/inicial.js)
 * ==============================================================================
 * Lógica da página inicial:
 * 1. Verifica se o usuário está logado (se não estiver, manda pro login).
 * 2. Ativa o menu do avatar.
 * 3. Exibe o primeiro nome do colaborador na mensagem de boas-vindas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página: só entra quem estiver logado
  if (!Furia.requireAuth()) return;

  // Ativa o menu de perfil no topo
  Furia.initMenu();

  // Personaliza o cumprimento com o primeiro nome do usuário
  const user = Furia.getUser();
  const userNameEl = document.getElementById('userName');

  if (userNameEl && user && user.name) {
    const firstName = user.name.trim().split(' ')[0];
    userNameEl.textContent = firstName;
  }
});

