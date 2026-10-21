document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("perfilForm");
    const editarBtn = document.getElementById("editarBtn");
    const cancelarBtn = document.getElementById("cancelarBtn");
    const acoes = document.getElementById("acoes");
    const mensagem = document.getElementById("mensagem");
    const campos = ["nome", "rm"];
    const chave = "furia_perfil";
    const camposForm = campos.map(id => document.getElementById(id));
    let dadosOriginais = {};

    function lerFormulario() {
        return Object.fromEntries(campos.map(id => [
            id,
            document.getElementById(id).value.trim()
        ]));
    }

    function preencherFormulario(dados) {
        campos.forEach(id => {
            document.getElementById(id).value = dados[id] || "";
        });
        atualizarResumo();
    }

    function atualizarResumo() {
        const { nome, rm } = lerFormulario();
        document.getElementById("nomeExibido").textContent =
            nome || "Nome do usuário";
        document.getElementById("rmExibido").textContent =
            rm ? `RM ${rm}` : "RM não informado";
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
        let usuario = {};
        let perfilSalvo = {};

        try {
            usuario = JSON.parse(localStorage.getItem("currentUser")) || {};
            perfilSalvo = JSON.parse(localStorage.getItem(chave)) || {};
        } catch {
            mostrarMensagem(
                "Não foi possível carregar os dados salvos da conta.",
                true
            );
        }

        const dados = {
            nome: perfilSalvo.nome || usuario.name || localStorage.getItem("usuarioNome") || "",
            rm: perfilSalvo.rm || usuario.rm || localStorage.getItem("usuarioRM") || ""
        };
        preencherFormulario(dados);
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
        if (!form.reportValidity()) return;

        const dados = lerFormulario();
        let usuario = {};
        try {
            usuario = JSON.parse(localStorage.getItem("currentUser")) || {};
            localStorage.setItem(chave, JSON.stringify(dados));
            localStorage.setItem("usuarioNome", dados.nome);
            localStorage.setItem("usuarioRM", dados.rm);
            localStorage.setItem("currentUser", JSON.stringify({
                ...usuario,
                name: dados.nome,
                rm: dados.rm
            }));
        } catch {
            mostrarMensagem(
                "Não foi possível salvar. Verifique o armazenamento do navegador.",
                true
            );
            return;
        }

        dadosOriginais = { ...dados };
        atualizarResumo();
        definirEdicao(false);
        mostrarMensagem("Perfil salvo com sucesso!");
    });

    carregarDados();
});
