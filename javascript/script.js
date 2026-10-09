document.addEventListener('DOMContentLoaded', () => {
  const iconeUsuario = document.getElementById('iconeUsuario');
  const menuUsuario = document.getElementById('menuUsuario');

  if (iconeUsuario && menuUsuario) {
    // Alterna a classe 'ativo' para abrir e fechar o menu com animação
    iconeUsuario.addEventListener('click', (event) => {
      menuUsuario.classList.toggle('ativo');
      event.stopPropagation();
    });

    // Fecha o menu se clicar em qualquer área fora dele
    document.addEventListener('click', (event) => {
      if (!iconeUsuario.contains(event.target) && !menuUsuario.contains(event.target)) {
        menuUsuario.classList.remove('ativo');
      }
    });
  }
});