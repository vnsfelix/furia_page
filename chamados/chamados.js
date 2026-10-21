document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("chamadosList");
  const message = document.createElement("p");
  message.className = "chamados-empty";

  let currentUser = null;
  let requests = [];
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const savedRequests = localStorage.getItem("furia_enviados");
    requests = savedRequests ? JSON.parse(savedRequests) : [];
    if (!Array.isArray(requests)) throw new Error("O histórico de chamados está inválido.");
  } catch {
    message.textContent = "Não foi possível carregar seus chamados. Tente novamente mais tarde.";
    list.replaceChildren(message);
    return;
  }

  const currentRm = currentUser?.rm || localStorage.getItem("usuarioRM") || "";
  const mine = requests.filter((request) =>
    currentRm ? request.rm === currentRm : request.solicitante === (currentUser?.name || localStorage.getItem("usuarioNome"))
  );
  const labels = {
    problemas: "Relato de problema",
    presencial: "Chamado presencial"
  };
  const statusClass = {
    "Recebido": "status-pendente",
    "Em andamento": "status-andamento",
    "Concluído": "status-concluido"
  };

  if (!mine.length) {
    message.textContent = "Você ainda não enviou solicitações. Quando enviar um formulário, poderá acompanhá-lo por aqui.";
    list.replaceChildren(message);
    return;
  }

  list.replaceChildren(...mine.slice().reverse().map((request) => {
    const data = request.dados || {};
    const title = request.tipo === "problemas" ? data.titulo : null;
    const detail = data.categoria || data.local || data.descricao || "Sem detalhes adicionais";
    const statusLabel = request.status || "Recebido";
    const card = document.createElement("article");
    card.className = "chamado-card";

    const header = document.createElement("div");
    header.className = "chamado-header";
    const id = document.createElement("span");
    id.className = "chamado-id";
    id.textContent = `#${request.id || "SOLICITAÇÃO"}`;
    const status = document.createElement("span");
    status.className = `status-badge ${statusClass[statusLabel] || "status-pendente"}`;
    status.textContent = statusLabel;
    header.append(id, status);

    const heading = document.createElement("h2");
    heading.className = "chamado-titulo";
    heading.textContent = title || labels[request.tipo] || "Solicitação";
    const description = document.createElement("p");
    description.className = "chamado-descricao";
    description.textContent = detail;

    const footer = document.createElement("div");
    footer.className = "chamado-footer";
    const category = document.createElement("span");
    category.className = "chamado-categoria";
    category.textContent = labels[request.tipo] || "Solicitação";
    const date = document.createElement("span");
    date.className = "chamado-data";
    const created = new Date(request.data);
    date.textContent = Number.isNaN(created.getTime()) ? "Data indisponível" : created.toLocaleDateString("pt-BR");
    footer.append(category, date);
    card.append(header, heading, description, footer);
    return card;
  }));
});
