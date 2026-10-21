const API_URL = window.FURIA_API_URL || "http://localhost:3000";
const LIMPAR_AO_SAIR = ["currentUser", "usuarioNome", "usuarioRM"];

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const esqueciRm = document.getElementById("esqueciRm");
  const roleInput = document.getElementById("userRole");
  const roleBtns = document.querySelectorAll(".role-btn");

  roleBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      roleBtns.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      if (roleInput) roleInput.value = btn.dataset.role;
    })
  );

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameValue = (document.getElementById("name")?.value || "").trim();
      const rmValue = (document.getElementById("rm")?.value || "").trim();
      const role = roleInput ? roleInput.value : "funcionario";
      const mensagem = document.getElementById("loginMessage");

      if (!nameValue || !rmValue) {
        if (mensagem) mensagem.textContent = "Preencha seu nome e RM para continuar.";
        return;
      }
      if (mensagem) mensagem.textContent = "";

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
          if (mensagem) mensagem.textContent = erro.message || "Não foi possível concluir o acesso.";
          return;
        }

        localStorage.setItem("usuarioNome", nameValue);
        localStorage.setItem("usuarioRM", rmValue);
        localStorage.setItem("currentUser", JSON.stringify({ name: nameValue, rm: rmValue, role }));
        window.location.href = role === "admin" ? "./admin/index.html" : "./inicial/inicial.html";
      } catch (error) {
        if (mensagem) {
          mensagem.textContent = error.name === "AbortError"
            ? "O servidor demorou para responder. Tente novamente."
            : "Não foi possível conectar ao servidor. Verifique se o serviço está ativo.";
        }
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

  // Menu do perfil nas telas internas.
  const icone = document.getElementById("iconeUsuario");
  const menu = document.getElementById("menuUsuario");
  if (icone && menu) {
    const alternar = (abrir) => {
      const ativo = abrir ?? !menu.classList.contains("ativo");
      menu.classList.toggle("ativo", ativo);
      icone.setAttribute("aria-expanded", String(ativo));
    };

    if (icone.tagName !== "BUTTON") {
      icone.setAttribute("role", "button");
      icone.setAttribute("tabindex", "0");
      icone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); }
      });
    }
    icone.setAttribute("aria-haspopup", "true");
    icone.setAttribute("aria-expanded", "false");
    icone.addEventListener("click", (e) => { e.stopPropagation(); alternar(); });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) alternar(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); });
  }

  let usuarioAtual = null;
  try {
    usuarioAtual = JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    usuarioAtual = null;
  }
  if (usuarioAtual?.role === "admin" && menu && !menu.querySelector('a[href*="/admin/"]')) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "../admin/index.html";
    link.textContent = "Painel administrativo";
    item.append(link);
    menu.querySelector("ul")?.prepend(item);
  }

  document.querySelectorAll(".logout a").forEach((a) =>
    a.addEventListener("click", () => LIMPAR_AO_SAIR.forEach((k) => localStorage.removeItem(k)))
  );
});
