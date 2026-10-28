/**
 * ==============================================================================
 * FURIA Helpdesk - Aviso / Erro do Sistema (assets/js/pages/errado.js)
 * ==============================================================================
 * Lógica da página de erro:
 * 1. Inicializa o menu de usuário caso esteja autenticado.
 * 2. Lê a mensagem de erro da URL (?msg=...) e exibe de forma amigável na tela.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o menu caso o usuário esteja logado
  if (Furia.getUser()) {
    Furia.initMenu();
  }

  // Se houver mensagem customizada passada por parâmetro, exibe na tela
  const params = new URLSearchParams(window.location.search);
  const msg = params.get('msg');
  const descEl = document.getElementById('errorDescription');

  if (msg && descEl) {
    descEl.textContent = msg;
  }
});

