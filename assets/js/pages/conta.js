/**
 * ==============================================================================
 * FURIA Helpdesk - Minha Conta / Perfil (assets/js/pages/conta.js)
 * ==============================================================================
 * Lógica da tela de perfil do colaborador:
 * 1. Verifica autenticação e inicializa menu do usuário.
 * 2. Carrega os dados atualizados do colaborador vindos do SQLite (/api/users/:id).
 * 3. Permite alternar modo de edição (nome e setor).
 * 4. Salva as alterações no banco SQLite e atualiza a sessão local.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a página
  if (!Furia.requireAuth()) return;
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

  // Busca dados mais recentes do banco de dados SQLite
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
      // Atualiza o registro no banco SQLite
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
});

