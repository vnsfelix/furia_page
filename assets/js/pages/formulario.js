/**
 * FURIA Helpdesk - Script de Envio de Chamados (Problemas e Presencial)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a rota
  if (!window.FuriaAuth.requireAuth()) return;

  const form = document.querySelector('form[data-tipo-chamado]');
  const messageEl = document.getElementById('formMessage');
  const fileInput = document.getElementById('arquivos');
  const fileLabel = document.getElementById('fileLabel');

  if (!form) return;

  const tipoChamado = form.dataset.tipoChamado; // 'problemas' ou 'presencial'

  // Feedback visual de anexo de arquivo
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileLabel.textContent = `Arquivo selecionado: ${fileInput.files[0].name}`;
      } else {
        fileLabel.textContent = 'Clique para anexar imagem ou captura de tela (opcional)';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const currentUser = window.FuriaAuth.getCurrentUser();
    const submitBtn = form.querySelector('button[type="submit"]');

    window.FuriaUI.setMessage(messageEl, '', false);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando chamado...';
    }

    try {
      const formData = new FormData(form);
      const ticketPayload = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        tipo: tipoChamado,
        descricao: formData.get('descricao') || '',
        urgencia: formData.get('urgencia') || 'media'
      };

      if (tipoChamado === 'problemas') {
        ticketPayload.titulo = formData.get('titulo') || 'Relato de Problema';
        ticketPayload.categoria = formData.get('categoria') || 'sistema';
        const file = formData.get('anexo');
        if (file && file.name) {
          ticketPayload.anexo = file.name;
        }
      } else if (tipoChamado === 'presencial') {
        const local = formData.get('local') || 'Geral';
        const servico = formData.get('tipo-servico') || 'Suporte Geral';
        ticketPayload.local = local;
        ticketPayload.tiposervico = servico;
        ticketPayload.titulo = `Chamado Presencial - ${local.toUpperCase()} (${servico})`;
      }

      // Salva no banco de dados / LocalStorage
      const created = window.FuriaDB.createTicket(ticketPayload);

      // Redireciona para a página de sucesso
      const root = window.FuriaAuth.getRootPath();
      window.location.href = `${root}enviados/index.html?id=${created.id}`;
    } catch (error) {
      window.FuriaUI.setMessage(messageEl, error.message || 'Erro ao registrar chamado.', true);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tentar Novamente';
      }
    }
  });
});

