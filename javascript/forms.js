// Envio dos formulários: valida (campos required), registra e redireciona.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[data-enviar]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = {};
    new FormData(form).forEach((v, k) => { dados[k] = v instanceof File ? v.name : v; });

    try {
      let lista = [];
      try { lista = JSON.parse(localStorage.getItem("furia_enviados")) || []; } catch { lista = []; }
      lista.push({ tipo: form.dataset.enviar, dados, data: new Date().toISOString() });
      localStorage.setItem("furia_enviados", JSON.stringify(lista));
      window.location.href = "../enviados/enviados.html";
    } catch {
      window.location.href = "../errado/errados.html";
    }
  });
});
