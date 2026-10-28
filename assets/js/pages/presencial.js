/**
 * ==============================================================================
 * FURIA Helpdesk - Atendimento Presencial (assets/js/pages/presencial.js)
 * ==============================================================================
 * Lógica do formulário de solicitação de técnico presencial:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Captura os campos: local, tipo de serviço, nível de urgência e descrição.
 * 3. Envia o chamado diretamente para o SQLite via API (/api/tickets).
 * 4. Redireciona para a tela de confirmação (/enviados/index.html?id=...).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
  Furia.initMenu();

  const form = document.getElementById('form-presencial');
  const messageEl = document.getElementById('formMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = Furia.getUser();
    const local = document.getElementById('local').value;
    const tipoServico = document.getElementById('tipo-servico').value;
    const urgencia = document.getElementById('urgencia').value;
    const descricao = document.getElementById('descricao').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!local || !tipoServico || !descricao) {
      mostrarMensagem('Preencha o local, o tipo de serviço e descreva o motivo do chamado.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando chamado...';
      esconderMensagem();

      // Monta o chamado e envia para a tabela tickets no SQLite
      const ticketData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        tipo: 'presencial',
        titulo: `Atendimento Presencial - ${local.toUpperCase()} (${tipoServico})`,
        local,
        tiposervico: tipoServico,
        urgencia,
        descricao
      };

      const res = await Furia.api('/tickets', 'POST', ticketData);

      // Redireciona para a tela de confirmação com o ID do chamado
      window.location.href = `../enviados/index.html?id=${res.ticket.id}`;
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao registrar chamado presencial.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Solicitar Presença do Técnico';
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

