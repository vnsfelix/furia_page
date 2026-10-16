const profileIcon = document.getElementById('profileIcon');
const profileDropdown = document.getElementById('profileDropdown');

if (profileIcon && profileDropdown) {
  profileIcon.addEventListener('click', (event) => {
    event.stopPropagation();
    profileDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (event) => {
    if (!profileDropdown.contains(event.target) && !profileIcon.contains(event.target)) {
      profileDropdown.classList.remove('active');
    }
  });
}

let currentUser = null;
try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } catch { currentUser = null; }
const cadastrarCard = document.getElementById('cadastrarCard');
const cadastrarModal = document.getElementById('cadastrarModal');
const closeModal = document.getElementById('closeModal');
const cadastrarForm = document.getElementById('cadastrarForm');

if (currentUser && currentUser.role === 'admin' && cadastrarCard) {
  cadastrarCard.style.display = 'flex';
}

if (cadastrarCard) {
  cadastrarCard.addEventListener('click', () => {
    cadastrarModal.classList.add('active');
  });
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    cadastrarModal.classList.remove('active');
  });
}

window.addEventListener('click', (event) => {
  if (event.target === cadastrarModal) {
    cadastrarModal.classList.remove('active');
  }
});

if (cadastrarForm) {
  cadastrarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newNombre').value.trim();
    const rm = document.getElementById('newRm').value.trim();
    const role = document.getElementById('newTipo').value;

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    if (registeredUsers.some((u) => u.rm === rm)) {
      alert('Já existe um usuário com este RM.');
      return;
    }
    registeredUsers.push({ name, rm, role });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    alert('Novo usuário cadastrado com sucesso!');
    cadastrarForm.reset();
    cadastrarModal.classList.remove('active');
  });
}

if (cadastrarCard) {
  cadastrarCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cadastrarModal.classList.add('active'); }
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cadastrarModal.classList.remove('active');
});
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    ['currentUser', 'usuarioNome', 'usuarioRM'].forEach((k) => localStorage.removeItem(k));
  });
}