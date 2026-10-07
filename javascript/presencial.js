
const form = document.getElementById('form-chamado');

form.addEventListener('submit', function (event) {
    
    event.preventDefault();

    const local = document.getElementById('local').value;
    const tipoServico = document.getElementById('tipo-servico').value;
    const descricao = document.getElementById('descricao').value;
    const urgencia = document.getElementById('urgencia').value;

    const dadosChamado = {
        local: local,
        tipo: tipoServico,
        descricao: descricao,
        urgencia: urgencia
    };

    console.log('Dados do chamado:', dadosChamado);

    alert('Chamado registrado com sucesso!');
    
    window.location.href = '../enviados/enviados.html';
});