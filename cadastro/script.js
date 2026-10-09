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

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
    const name = document.getElementById('newNombre').value;
    const rm = document.getElementById('newRm').value;
    const role = document.getElementById('newTipo').value;

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    registeredUsers.push({ name, rm, role });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    alert('Novo usuário cadastrado com sucesso!');
    cadastrarForm.reset();
    cadastrarModal.classList.remove('active');
  });
}