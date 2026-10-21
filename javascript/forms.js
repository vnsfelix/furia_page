// Envio dos formulários: valida (campos required), registra e redireciona.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[data-enviar]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const botao = document.querySelector(`button[form="${form.id}"]`) || form.querySelector('button[type="submit"]');
    const mensagem = document.getElementById("formMessage");
    if (botao) botao.disabled = true;

    const dados = {};
    new FormData(form).forEach((v, k) => { dados[k] = v instanceof File ? v.name : v; });

    try {
      const salvo = localStorage.getItem("furia_enviados");
      const lista = salvo ? JSON.parse(salvo) : [];
      if (!Array.isArray(lista)) throw new Error("O histórico de solicitações está inválido.");

      let usuario = null;
      try {
        usuario = JSON.parse(localStorage.getItem("currentUser"));
      } catch {
        usuario = null;
      }
      lista.push({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        tipo: form.dataset.enviar,
        dados,
        solicitante: usuario?.name || localStorage.getItem("usuarioNome") || "Usuário",
        rm: usuario?.rm || localStorage.getItem("usuarioRM") || "",
        status: "Recebido",
        data: new Date().toISOString()
      });
      localStorage.setItem("furia_enviados", JSON.stringify(lista));
      window.location.href = "../enviados/enviados.html";
    } catch (error) {
      if (botao) botao.disabled = false;
      if (mensagem) {
        mensagem.textContent = error instanceof SyntaxError
          ? "Não foi possível ler o histórico salvo. Entre em contato com o suporte."
          : "Não foi possível registrar a solicitação neste navegador.";
        mensagem.classList.add("erro");
      } else {
        alert("Não foi possível registrar a solicitação neste navegador.");
      }
    }
  });
});
