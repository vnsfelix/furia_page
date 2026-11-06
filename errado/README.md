# Página de Erro

Tela exibida quando ocorre alguma falha ou instabilidade no processamento de uma ação.

## Arquivos da tela

- `index.html`: estrutura visual da tela de aviso de erro.
- `../assets/js/pages/errado.js`: captura parâmetros da URL (`?msg=...`) para exibir a mensagem específica da falha.
- `../assets/css/pages/errado.css`: estilização visual da página.

## Funcionalidades

- **Mensagem contextual:** exibe a mensagem de erro enviada pela URL (ex.: falha no envio do chamado) ou uma mensagem padrão amigável caso não haja parâmetro.
- **Ações de recuperação:** botão para tentar novamente (voltando à tela anterior) e botão para retornar à tela inicial.

## Acesso

Página aberta. Se o usuário estiver conectado, o menu de perfil é ativado automaticamente.
