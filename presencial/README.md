# Atendimento Presencial

Formulário para solicitar suporte presencial ou manutenção nos espaços físicos da FURIA.

## Arquivos da tela

- `index.html`: estrutura visual do formulário de atendimento presencial.
- `../assets/js/pages/presencial.js`: validação dos dados, envio para a API e redirecionamento.
- `../assets/css/pages/presencial.css`: estilização visual da página.

## Campos do chamado

- **Local:** ambiente onde o técnico deve comparecer (Arena, Estúdio, Escritório, Recepção, etc.).
- **Tipo de serviço:** categoria do serviço (Rede/Wi-Fi, Informática/Hardware, Elétrica, Infraestrutura, etc.).
- **Urgência:** nível de prioridade (Baixa, Média ou Alta).
- **Descrição:** detalhes do que precisa ser consertado, instalado ou ajustado.

## Fluxo de envio

Ao enviar a solicitação, o sistema grava o chamado via API (`POST /api/tickets`) com o tipo `presencial` e status *Recebido*, redirecionando o usuário para a tela de confirmação (`/enviados`).

## Proteção de acesso

Exige login ativo. Usuários deslogados são redirecionados automaticamente para a tela de login.
