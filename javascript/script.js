const API_URL = window.FURIA_API_URL || "http://localhost:3000";
const LIMPAR_AO_SAIR = ["currentUser", "usuarioNome", "usuarioRM"];

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const esqueciRm = document.getElementById("esqueciRm");
  const roleInput = document.getElementById("userRole");
  const roleBtns = document.querySelectorAll(".role-btn");

  roleBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      roleBtns.forEach((b) => b.classList.toggle("active", b === btn));
      if (roleInput) roleInput.value = btn.dataset.role;
    })
  );

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameValue = (document.getElementById("name")?.value || "").trim();
      const rmValue = (document.getElementById("rm")?.value || "").trim();
      const role = roleInput ? roleInput.value : "funcionario";

      if (!nameValue || !rmValue) {
        alert("Por favor, preencha todos os campos antes de continuar.");
        return;
      }

      const botao = loginForm.querySelector('button[type="submit"]');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      botao.disabled = true;

      try {
        const response = await fetch(`${API_URL}/api/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ nome: nameValue, email: `${rmValue}@furia.com` })
        });

        if (!response.ok) {
          const erro = await response.json().catch(() => ({}));
          alert(erro.message || "Erro ao ligar ao servidor.");
          return;
        }

        localStorage.setItem("usuarioNome", nameValue);
        localStorage.setItem("usuarioRM", rmValue);
        localStorage.setItem("currentUser", JSON.stringify({ name: nameValue, rm: rmValue, role }));
        window.location.href = role === "admin" ? "./cadastro/index.html" : "./inicial/inicial.html";
      } catch {
        alert("Servidor indisponível. Certifique-se de que o back-end está a rodar.");
      } finally {
        clearTimeout(timer);
        botao.disabled = false;
      }
    });
  }

  if (esqueciRm) {
    esqueciRm.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Entre em contacto com a equipa do sistema para recuperar o seu RM.");
    });
  }

  // Menu do perfil (inicial e chamados)
  const icone = document.getElementById("iconeUsuario");
  const menu = document.getElementById("menuUsuario");
  if (icone && menu) {
    icone.setAttribute("role", "button");
    icone.setAttribute("tabindex", "0");
    icone.setAttribute("aria-haspopup", "true");
    icone.setAttribute("aria-expanded", "false");
    const alternar = (abrir) => {
      const ativo = abrir ?? !menu.classList.contains("ativo");
      menu.classList.toggle("ativo", ativo);
      icone.setAttribute("aria-expanded", String(ativo));
    };
    icone.addEventListener("click", (e) => { e.stopPropagation(); alternar(); });
    icone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); }
    });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) alternar(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
  }

  document.querySelectorAll(".logout a").forEach((a) =>
    a.addEventListener("click", () => LIMPAR_AO_SAIR.forEach((k) => localStorage.removeItem(k)))
  );
});
