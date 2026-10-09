document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("perfilForm");
    const editarBtn = document.getElementById("editarBtn");
    const cancelarBtn = document.getElementById("cancelarBtn");
    const acoes = document.getElementById("acoes");
    const mensagem = document.getElementById("mensagem");

    const campos = [
        "nome",
        "usuario",
        "email",
        "telefone",
        "nascimento",
        "setor"
    ];

    const chave = "furia_perfil";
    let dadosOriginais = {};

    const camposForm = campos.map(id => document.getElementById(id));

    function lerFormulario() {
        const dados = {};

        campos.forEach(id => {
            dados[id] = document.getElementById(id).value.trim();
        });

        return dados;
    }

    function preencherFormulario(dados) {
        campos.forEach(id => {
            document.getElementById(id).value = dados[id] || "";
        });

        atualizarResumo();
    }

    function atualizarResumo() {
        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();

        document.getElementById("nomeExibido").textContent =
            nome || "Nome do usuário";

        document.getElementById("emailExibido").textContent =
            email || "E-mail não informado";

        document.getElementById("avatar").textContent =
            nome ? nome.charAt(0).toUpperCase() : "U";
    }

    function definirEdicao(ativo) {
        camposForm.forEach(campo => {
            campo.disabled = !ativo;
        });

        editarBtn.hidden = ativo;
        acoes.hidden = !ativo;
        mensagem.textContent = "";
        mensagem.classList.remove("erro");
    }

    function mostrarMensagem(texto, erro = false) {
        mensagem.textContent = texto;
        mensagem.classList.toggle("erro", erro);
    }

    function carregarDados() {
        let salvos = {};

        try {
            salvos = JSON.parse(localStorage.getItem(chave)) || {};
        } catch {
            salvos = {};
        }

        preencherFormulario(salvos);

        const cadastro = localStorage.getItem("furia_data_cadastro");

        document.getElementById("dataCadastro").textContent =
            cadastro || "Não informado";

        dadosOriginais = lerFormulario();
    }

    editarBtn.addEventListener("click", () => {
        dadosOriginais = lerFormulario();
        definirEdicao(true);
        document.getElementById("nome").focus();
    });

    cancelarBtn.addEventListener("click", () => {
        preencherFormulario(dadosOriginais);
        definirEdicao(false);
        mostrarMensagem("Alterações canceladas.");
    });

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const dados = lerFormulario();

        try {
            localStorage.setItem(chave, JSON.stringify(dados));

            if (!localStorage.getItem("furia_data_cadastro")) {
                const hoje = new Date().toLocaleDateString("pt-BR");
                localStorage.setItem("furia_data_cadastro", hoje);
            }

            dadosOriginais = { ...dados };
            document.getElementById("dataCadastro").textContent =
                localStorage.getItem("furia_data_cadastro");

            atualizarResumo();
            definirEdicao(false);
            mostrarMensagem("Perfil salvo com sucesso!");
        } catch {
            mostrarMensagem(
                "Não foi possível salvar. Verifique o armazenamento do navegador.",
                true
            );
        }
    });

    carregarDados();
});