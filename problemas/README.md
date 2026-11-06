# Relatar Problema

Formulário para abertura de chamados técnicos de software, hardware, acessos ou falhas de sistema.

## Arquivos da tela

- `index.html`: estrutura visual do formulário de chamado.
- `../assets/js/pages/problemas.js`: validação dos campos, envio para a API e redirecionamento.
- `../assets/css/pages/problemas.css`: estilização visual do formulário.

## Campos do chamado

- **Categoria:** tipo do problema (Sistema/Software, Hardware, Senha/Acesso, etc.).
- **Urgência:** nível de criticidade (Baixa, Média ou Alta).
- **Título e Descrição:** resumo e explicação detalhada da ocorrência.
- **Anexo:** envio opcional de foto ou print do erro.

## Fluxo de envio

Ao clicar em enviar, o sistema vincula o chamado ao usuário logado, grava o registro no banco via API (`POST /api/tickets`) com o status *Recebido* e redireciona para a tela de confirmação (`/enviados`).

## Proteção de acesso

Exige login ativo. Usuários deslogados são redirecionados automaticamente para a tela de login.
