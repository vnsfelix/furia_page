/**
 * ==============================================================================
 * FURIA Helpdesk - Atendimento Presencial (assets/js/pages/presencial.js)
 * ==============================================================================
 * Lógica do formulário de solicitação de técnico presencial:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Captura os campos: local, tipo de serviço, nível de urgência e descrição.
 * 3. Envia o chamado diretamente para o SQLite via API (/api/tickets).
 * 4. Envia notificação para o grupo do Telegram.
 * 5. Redireciona para a tela de confirmação (/enviados/index.html?id=...).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
  Furia.initMenu();

  const form = document.getElementById('form-presencial');
  const messageEl = document.getElementById('formMessage');

  // Função para enviar notificação para o Telegram (Chamado Presencial)
  function notificarNovoChamadoTelegram(id, nome, local, tipoServico, urgencia) {
    const token = '9165048331:AAEDm29bmRsvERxXbKPbTO7K91yB1o8XnA0'; 
    const chatId = '-5397870012'; 
    
    // Formatação da mensagem customizada para atendimento presencial
    const msg = `🏃‍♂️ *NOVO CHAMADO PRESENCIAL*\n\n🎫 *Chamado:* #${id}\n👤 *Usuário:* ${nome}\n📍 *Local:* ${local}\n🛠️ *Serviço:* ${tipoServico}\n⚠️ *Urgência:* ${urgencia.toUpperCase()}`;
    
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    }).catch(err => console.error("Erro ao enviar notificação para o Telegram:", err));
  }

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

      // --- DISPARA A NOTIFICAÇÃO PARA O TELEGRAM AQUI ---
      notificarNovoChamadoTelegram(res.ticket.id, currentUser.name, local, tipoServico, urgencia);

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