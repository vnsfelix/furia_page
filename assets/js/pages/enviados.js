/**
 * ==============================================================================
 * FURIA Helpdesk - Confirmação de Envio (assets/js/pages/enviados.js)
 * ==============================================================================
 * Lógica da tela de confirmação:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Lê o parâmetro ?id=... da URL para exibir o código do chamado enviado.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
  Furia.initMenu();

  // Obtém o ID do chamado gerado da URL
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get('id');
  const badge = document.getElementById('ticketBadge');

  if (ticketId && badge) {
    badge.textContent = `#${Furia.escape(ticketId)}`;
  }
});

