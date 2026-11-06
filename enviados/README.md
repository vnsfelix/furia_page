# Confirmação de Envio

Tela exibida após o envio com sucesso de um chamado técnico ou presencial.

## Arquivos da tela

- `index.html`: estrutura visual da tela de sucesso.
- `../assets/js/pages/enviados.js`: captura o código do chamado pela URL (`?id=TK-...`) e exibe na tela.
- `../assets/css/pages/enviados.css`: estilização visual da confirmação.

## Funcionalidades

- **Identificador do chamado:** lê o parâmetro da URL e exibe o código gerado para o ticket (ex.: `#TK-1234`).
- **Atalhos:** botões para acompanhar o status em *Meus Chamados* ou voltar para a tela inicial.

## Proteção de acesso

Exige login ativo. Usuários deslogados são redirecionados automaticamente para a tela de login.
