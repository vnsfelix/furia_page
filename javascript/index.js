document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const esqueciRm = document.getElementById("esqueciRm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const inputName = document.getElementById("name");
      const inputRm = document.getElementById("rm");

      const nameValue = inputName ? inputName.value.trim() : "";
      const rmValue = inputRm ? inputRm.value.trim() : "";

      if (nameValue === "" || rmValue === "") {
        alert("Por favor, preencha todos os campos antes de continuar.");
        return;
      }

      try {
        localStorage.setItem("usuarioNome", nameValue);
        localStorage.setItem("usuarioRM", rmValue);
      } catch (error) {
        console.warn("Aviso: não foi possível salvar os dados no navegador.");
      }

      window.location.href = "inicial/inicial.html";
    });
  }

  if (esqueciRm) {
    esqueciRm.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Entre em contato com a equipe do sistema para recuperar seu RM.");
    });
  }
});