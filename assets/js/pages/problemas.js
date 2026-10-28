/**
 * ==============================================================================
 * FURIA Helpdesk - Relatar Problema (assets/js/pages/problemas.js)
 * ==============================================================================
 * Lógica do formulário de relato de falhas e problemas técnicos:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Atualiza o texto do anexo quando o usuário seleciona um arquivo.
 * 3. Envia o chamado diretamente para o SQLite via API (/api/tickets).
 * 4. Redireciona para a tela de confirmação (/enviados/index.html?id=...).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
  Furia.initMenu();

  const form = document.getElementById('form-problema');
  const messageEl = document.getElementById('formMessage');
  const fileInput = document.getElementById('arquivos');
  const fileLabel = document.getElementById('fileLabel');

  // Mostra o nome do arquivo anexado
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileLabel.textContent = `Arquivo anexado: ${fileInput.files[0].name}`;
      } else {
        fileLabel.textContent = 'Clique ou arraste um arquivo para anexar';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUser = Furia.getUser();
    const categoria = document.getElementById('categoria').value;
    const urgencia = document.getElementById('urgencia').value;
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!categoria || !titulo || !descricao) {
      mostrarMensagem('Preencha a categoria, o título e a descrição do problema.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando chamado...';
      esconderMensagem();

      // Pega o nome do anexo caso tenha sido selecionado
      let anexoNome = null;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        anexoNome = fileInput.files[0].name;
      }

      // Monta os dados do chamado para o SQLite
      const ticketData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        tipo: 'problemas',
        titulo,
        categoria,
        urgencia,
        descricao,
        anexo: anexoNome
      };

      const res = await Furia.api('/tickets', 'POST', ticketData);

      // Redireciona para a tela de confirmação com o ID gerado
      window.location.href = `../enviados/index.html?id=${res.ticket.id}`;
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao registrar chamado de problema.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar Solicitação';
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

