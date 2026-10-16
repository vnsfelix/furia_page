document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const esqueciRm = document.getElementById("esqueciRm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
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
        const response = await fetch("http://localhost:3000/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nameValue,
            email: `${rmValue}@furia.com`
          })
        });

        if (!response.ok) {
          const erro = await response.json();
          alert(erro.message || "Erro ao ligar ao servidor.");
          return;
        }

        localStorage.setItem("usuarioNome", nameValue);
        localStorage.setItem("usuarioRM", rmValue);

        window.location.href = "./inicial/inicial.html";
      } catch (error) {
        alert("Servidor indisponível. Certifique-se de que o back-end está a rodar.");
      }
    });
  }

  if (esqueciRm) {
    esqueciRm.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Entre em contacto com a equipa do sistema para recuperar o seu RM.");
    });
  }
});