/**
 * ==============================================================================
 * FURIA Helpdesk - Minha Conta / Perfil (assets/js/pages/conta.js)
 * ==============================================================================
 * Lógica da tela de perfil do colaborador:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Carrega os dados atualizados do colaborador vindos do Supabase (/api/users/:id).
 * 3. Permite alternar modo de edição (nome e setor).
 * 4. Salva as alterações no banco Supabase e atualiza a sessão local.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Protege a página
  if (!await Furia.requireAuth()) return;
  Furia.initMenu();

  const user = Furia.getUser();

  const form = document.getElementById('perfilForm');
  const editarBtn = document.getElementById('editarBtn');
  const cancelarBtn = document.getElementById('cancelarBtn');
  const acoesDiv = document.getElementById('acoes');
  const messageEl = document.getElementById('mensagem');

  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const departmentInput = document.getElementById('department');
  const roleInput = document.getElementById('role');

  const nomeExibido = document.getElementById('nomeExibido');
  const emailExibido = document.getElementById('emailExibido');
  const cargoExibido = document.getElementById('cargoExibido');
  const avatarEl = document.getElementById('avatar');

  // Preenche a tela com os dados do usuário
  function exibirDados(dados) {
    if (nomeInput) nomeInput.value = dados.name || dados.nome || '';
    if (emailInput) emailInput.value = dados.email || '';
    if (departmentInput) departmentInput.value = dados.department || 'Geral';
    if (roleInput) roleInput.value = dados.role === 'admin' ? 'Administrador' : 'Funcionário';

    if (nomeExibido) nomeExibido.textContent = dados.name || dados.nome || 'Colaborador';
    if (emailExibido) emailExibido.textContent = dados.email || '';
    if (cargoExibido) cargoExibido.textContent = dados.role === 'admin' ? 'Administrador' : 'Funcionário';

    if (avatarEl) {
      const letra = (dados.name || dados.nome || 'U').trim().charAt(0).toUpperCase();
      avatarEl.textContent = letra;
    }
  }

  // Busca dados mais recentes do banco de dados Supabase
  async function carregarDados() {
    exibirDados(user);
    try {
      const atualizado = await Furia.api(`/users/${encodeURIComponent(user.id)}`);
      if (atualizado) {
        exibirDados(atualizado);
        Furia.setUser({ ...user, ...atualizado });
      }
    } catch {
      // Se não conseguir buscar, mantém os dados da sessão
    }
  }

  // Alterna o modo de edição dos campos
  function setModoEdicao(ativo) {
    if (nomeInput) nomeInput.disabled = !ativo;
    if (departmentInput) departmentInput.disabled = !ativo;
    if (editarBtn) editarBtn.hidden = ativo;
    if (acoesDiv) acoesDiv.hidden = !ativo;
    messageEl.textContent = '';
  }

  if (editarBtn) {
    editarBtn.addEventListener('click', () => {
      setModoEdicao(true);
      if (nomeInput) nomeInput.focus();
    });
  }

  if (cancelarBtn) {
    cancelarBtn.addEventListener('click', () => {
      carregarDados();
      setModoEdicao(false);
    });
  }

  // Salva as alterações
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novoNome = nomeInput.value.trim();
    const novoDept = departmentInput.value.trim() || 'Geral';

    if (!novoNome || novoNome.length < 3) {
      mostrarMensagem('O nome deve ter no mínimo 3 caracteres.', true);
      return;
    }

    try {
      // Atualiza o registro no banco Supabase
      const res = await Furia.api(`/users/${encodeURIComponent(user.id)}`, 'PUT', {
        name: novoNome,
        department: novoDept
      });

      // Atualiza a sessão
      const usuarioAtualizado = { ...user, name: novoNome, department: novoDept };
      Furia.setUser(usuarioAtualizado);

      exibirDados(usuarioAtualizado);
      setModoEdicao(false);
      mostrarMensagem('Dados atualizados com sucesso no banco de dados!', false);
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao salvar alterações.', true);
    }
  });

  function mostrarMensagem(texto, isError) {
    messageEl.textContent = texto;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.style.display = 'block';
  }

  carregarDados();
  const passwordForm = document.getElementById('passwordForm');
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = passwordForm.querySelector('button[type="submit"]');
    const status = document.getElementById('passwordStatus');
    button.disabled = true;
    try {
      const result = await Furia.api('/auth/password', 'POST', {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
        remember: Boolean(localStorage.getItem('furia_user'))
      });
      passwordForm.reset(); status.textContent = result.message;
    } catch (err) { status.textContent = err.message; }
    finally { button.disabled = false; }
  });
  const linkButton = document.getElementById('telegramLink');
  const unlinkButton = document.getElementById('telegramUnlink');
  const telegramStatus = document.getElementById('telegramStatus');
  const connectUrl = document.getElementById('telegramConnectUrl');
  async function loadTelegram() {
    try {
      const result = await Furia.api('/telegram/link');
      telegramStatus.textContent = result.available ? (result.linked ? 'Conta vinculada. Use /chamado no bot.' : 'Vincule sua conta para abrir chamados pelo bot.') : 'O bot ainda não está disponível.';
      linkButton.hidden = !result.available || result.linked;
      unlinkButton.hidden = !result.linked;
    } catch { telegramStatus.textContent = 'Não foi possível consultar a integração agora.'; }
  }
  linkButton.addEventListener('click', async () => {
    linkButton.disabled = true;
    try { const result = await Furia.api('/telegram/link', 'POST', {}); connectUrl.href = result.url; connectUrl.hidden = false; }
    catch (err) { telegramStatus.textContent = err.message; }
    finally { linkButton.disabled = false; }
  });
  unlinkButton.addEventListener('click', async () => {
    if (!confirm('Desvincular sua conta do Telegram?')) return;
    try { await Furia.api('/telegram/link', 'DELETE'); connectUrl.hidden = true; await loadTelegram(); }
    catch (err) { telegramStatus.textContent = err.message; }
  });
  await loadTelegram();
  window.addEventListener('focus', loadTelegram);
});

