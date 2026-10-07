const form = document.getElementById('form-comunicacao');

form.addEventListener('submit', function (event) {
    event.preventDefault(); 

    const areaDestino = document.getElementById('area-destino').value;
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;

    const novaMensagem = {
        area: areaDestino,
        assunto: assunto,
        mensagem: mensagem,
        data: new Date().toLocaleDateString('pt-BR') 
    };

    let mensagensSalvas = JSON.parse(localStorage.getItem('listaDeMensagens')) || [];

    mensagensSalvas.push(novaMensagem);

    localStorage.setItem('listaDeMensagens', JSON.stringify(mensagensSalvas));

    alert('Mensagem enviada e salva no sistema!');

    form.reset();
});