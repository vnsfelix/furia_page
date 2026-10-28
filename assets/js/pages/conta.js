/**
 * FURIA Helpdesk - Script da Página Minha Conta / Perfil
 */

document.addEventListener('DOMContentLoaded', () => {
  // Protege a rota
  if (!window.FuriaAuth.requireAuth()) return;

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

  let originalData = {};

  async function loadUserData() {
    const user = window.FuriaAuth.getCurrentUser();
    if (!user) return;

    // Busca dados completos do usuário no banco SQLite
    let fullUser = user;
    try {
      const fetched = await window.FuriaDB.getUserById(user.id);
      if (fetched) fullUser = fetched;
    } catch {
      // usa dados da sessão
    }

    originalData = {
      name: fullUser.name || fullUser.nome || '',
      email: fullUser.email || '',
      department: fullUser.department || 'Geral',
      role: fullUser.role || 'funcionario'
    };

    if (nomeInput) nomeInput.value = originalData.name;
    if (emailInput) emailInput.value = originalData.email;
    if (departmentInput) departmentInput.value = originalData.department;
    if (roleInput) roleInput.value = originalData.role === 'admin' ? 'Administrador' : 'Funcionário';

    if (nomeExibido) nomeExibido.textContent = originalData.name || 'Usuário FURIA';
    if (emailExibido) emailExibido.textContent = originalData.email || 'E-mail não informado';
    if (cargoExibido) cargoExibido.textContent = originalData.role === 'admin' ? 'Administrador' : 'Funcionário';

    if (avatarEl) {
      const initial = (originalData.name && originalData.name.trim().charAt(0).toUpperCase()) || 'U';
      avatarEl.textContent = initial;
    }
  }

  function setEditMode(active) {
    if (nomeInput) nomeInput.disabled = !active;
    if (departmentInput) departmentInput.disabled = !active;
    // E-mail e Cargo permanecem bloqueados para manter integridade
    if (editarBtn) editarBtn.hidden = active;
    if (acoesDiv) acoesDiv.hidden = !active;
    window.FuriaUI.setMessage(messageEl, '', false);
  }

  if (editarBtn) {
    editarBtn.addEventListener('click', () => {
      setEditMode(true);
      if (nomeInput) nomeInput.focus();
    });
  }

  if (cancelarBtn) {
    cancelarBtn.addEventListener('click', () => {
      loadUserData();
      setEditMode(false);
      window.FuriaUI.setMessage(messageEl, '', false);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newName = nomeInput ? nomeInput.value.trim() : '';
      const newDepartment = departmentInput ? departmentInput.value.trim() : '';

      if (!newName || newName.length < 3) {
        window.FuriaUI.setMessage(messageEl, 'Por favor, informe seu nome completo.', true);
        return;
      }

      try {
        await window.FuriaAuth.updateProfile({
          name: newName,
          department: newDepartment
        });

        await loadUserData();
        setEditMode(false);
        window.FuriaUI.setMessage(messageEl, 'Alterações salvas com sucesso no banco de dados.', false);

        // Atualiza cabeçalho do menu
        window.FuriaUI.initUserMenu();
      } catch (error) {
        window.FuriaUI.setMessage(messageEl, error.message || 'Não foi possível salvar as alterações.', true);
      }
    });
  }

  loadUserData();
});

