/**
 * ==============================================================================
 * FURIA Helpdesk - Relatar Problema (assets/js/pages/problemas.js)
 * ==============================================================================
 * Lógica do formulário de relato de falhas e problemas técnicos:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Processa o anexo (imagem/captura de tela) para Base64 com compressão e pré-visualização.
 * 3. Envia o chamado e a imagem diretamente para o SQLite via API (/api/tickets).
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
  const previewBox = document.getElementById('imagePreviewBox');
  const previewThumb = document.getElementById('imagePreviewThumb');
  const previewName = document.getElementById('imagePreviewName');
  const btnRemove = document.getElementById('btnRemoveAttachment');

  let currentAttachment = null;

  // Processa arquivo selecionado e converte para Base64
  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        limparAnexo();
        return;
      }

      if (fileLabel) {
        fileLabel.textContent = `Processando: ${file.name}...`;
      }

      try {
        const base64Data = await processarArquivo(file);
        currentAttachment = {
          name: file.name,
          type: file.type || 'image/png',
          data: base64Data
        };

        if (fileLabel) {
          fileLabel.textContent = `Arquivo anexado: ${file.name}`;
        }

        if (previewBox && previewThumb && previewName) {
          previewThumb.src = base64Data;
          previewName.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
          previewBox.style.display = 'flex';
        }
      } catch (err) {
        mostrarMensagem('Falha ao processar o anexo selecionado. Tente uma imagem em JPG ou PNG.');
        limparAnexo();
      }
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      limparAnexo();
    });
  }

  function limparAnexo() {
    currentAttachment = null;
    if (fileInput) fileInput.value = '';
    if (fileLabel) fileLabel.textContent = 'Clique ou arraste um arquivo para anexar';
    if (previewBox) previewBox.style.display = 'none';
    if (previewThumb) previewThumb.src = '';
    if (previewName) previewName.textContent = '';
  }

  // Comprime imagens muito grandes para envio rápido e seguro
  function processarArquivo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.onload = () => {
        const result = reader.result;

        // Se for imagem, redimensiona se passar de 1600px para economizar espaço
        if (file.type && file.type.startsWith('image/')) {
          const img = new Image();
          img.onerror = () => resolve(result); // fallback pro base64 puro
          img.onload = () => {
            const maxDim = 1600;
            let { width, height } = img;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              // Salva em JPEG com qualidade 0.85
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            } else {
              resolve(result);
            }
          };
          img.src = result;
        } else {
          resolve(result);
        }
      };
      reader.readAsDataURL(file);
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

      // Monta os dados do chamado com anexo completo para o SQLite
      const ticketData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        tipo: 'problemas',
        titulo,
        categoria,
        urgencia,
        descricao,
        anexo: currentAttachment // Salva objeto com Base64 Data URL
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
