const adminUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
})();

if (!adminUser || adminUser.role !== "admin") {
  window.location.replace("../index.html");
} else {
  document.addEventListener("DOMContentLoaded", () => {
    const requestRows = document.getElementById("requestsList");
    const userRows = document.getElementById("usersList");
    const requestSearch = document.getElementById("requestSearch");
    const requestMessage = document.getElementById("adminMessage");
    const userMessage = document.getElementById("userMessage");
    let requests = [];
    let users = [];

    document.getElementById("adminName").textContent =
      adminUser.name || localStorage.getItem("usuarioNome") || "Administrador";

    function readList(key) {
      const value = localStorage.getItem(key);
      if (!value) return [];
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error(`Os dados de "${key}" estão inválidos.`);
      return parsed;
    }

    function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleDateString("pt-BR");
    }

    function requestTitle(request) {
      const titles = {
        problemas: request.dados?.titulo || "Relato de problema",
        presencial: "Chamado presencial"
      };
      return titles[request.tipo] || "Solicitação";
    }

    function requestDetail(request) {
      const data = request.dados || {};
      return data.categoria || data.local || data.descricao || "Sem detalhes";
    }

    function renderRequests() {
      const term = requestSearch.value.trim().toLocaleLowerCase("pt-BR");
      const matches = requests
        .map((request, index) => ({ request, index }))
        .filter(({ request }) => `${requestTitle(request)} ${requestDetail(request)}`.toLocaleLowerCase("pt-BR").includes(term));

      requestRows.replaceChildren();
      if (!matches.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = requests.length ? "Nenhuma solicitação corresponde à busca." : "Ainda não há solicitações enviadas.";
        row.append(cell);
        requestRows.append(row);
      }

      matches.forEach(({ request, index }) => {
        const row = document.createElement("tr");
        const titleCell = document.createElement("td");
        const title = document.createElement("strong");
        title.textContent = requestTitle(request);
        const category = document.createElement("span");
        category.className = "table-subtitle";
        category.textContent = request.tipo || "Solicitação";
        titleCell.append(title, category);

        const detailCell = document.createElement("td");
        detailCell.textContent = requestDetail(request);
        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(request.data);
        const statusCell = document.createElement("td");
        const status = document.createElement("select");
        status.className = "status-select";
        status.setAttribute("aria-label", `Status de ${requestTitle(request)}`);
        ["Recebido", "Em andamento", "Concluído"].forEach((label) => {
          const option = document.createElement("option");
          option.value = label;
          option.textContent = label;
          status.append(option);
        });
        status.value = request.status || "Recebido";
        status.addEventListener("change", () => {
          requests[index].status = status.value;
          try {
            localStorage.setItem("furia_enviados", JSON.stringify(requests));
            requestMessage.textContent = "Status atualizado.";
            updateStats();
          } catch {
            requestMessage.textContent = "Não foi possível salvar a alteração no navegador.";
          }
        });
        statusCell.append(status);
        row.append(titleCell, detailCell, dateCell, statusCell);
        requestRows.append(row);
      });
      updateStats();
    }

    function updateStats() {
      document.getElementById("totalRequests").textContent = String(requests.length);
      document.getElementById("openRequests").textContent = String(
        requests.filter((request) => request.status !== "Concluído").length
      );
      document.getElementById("totalUsers").textContent = String(users.length);
    }

    function renderUsers() {
      userRows.replaceChildren();
      if (!users.length) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.textContent = "Nenhum usuário adicional cadastrado.";
        userRows.append(empty);
      }
      users.forEach((user) => {
        if (!user || typeof user.name !== "string" || typeof user.rm !== "string") return;
        const item = document.createElement("li");
        const identity = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = user.name;
        const rm = document.createElement("span");
        rm.textContent = `RM ${user.rm}`;
        identity.append(name, rm);
        const role = document.createElement("span");
        role.className = "role-badge";
        role.textContent = user.role === "admin" ? "Administrador" : "Funcionário";
        item.append(identity, role);
        userRows.append(item);
      });
      updateStats();
    }

    document.getElementById("userForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = form.elements.name.value.trim();
      const rm = form.elements.rm.value.trim();
      const role = form.elements.role.value;

      if (users.some((user) => typeof user.rm === "string" && user.rm.toLocaleLowerCase() === rm.toLocaleLowerCase())) {
        userMessage.textContent = "Já existe um usuário cadastrado com essa identificação.";
        return;
      }

      users.push({ name, rm, role });
      try {
        localStorage.setItem("registeredUsers", JSON.stringify(users));
        form.reset();
        userMessage.textContent = "Usuário cadastrado com sucesso.";
        renderUsers();
      } catch {
        users.pop();
        userMessage.textContent = "Não foi possível salvar o usuário no navegador.";
      }
    });

    requestSearch.addEventListener("input", renderRequests);

    try {
      requests = readList("furia_enviados");
      users = readList("registeredUsers");
      renderRequests();
      renderUsers();
    } catch (error) {
      requestMessage.textContent = error.message;
      userMessage.textContent = error.message;
    }
  });
}
