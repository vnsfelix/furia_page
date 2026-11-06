# Minha Conta

Página de visualização e edição do perfil do usuário logado.

## Arquivos da tela

- `index.html`: estrutura visual do perfil do colaborador.
- `../assets/js/pages/conta.js`: carregamento dos dados cadastrais e atualização de nome/setor na API.
- `../assets/css/pages/conta.css`: estilização visual da página de perfil.

## Funcionalidades

- **Dados cadastrais:** exibe nome completo, e-mail corporativo, setor e cargo (Administrador, Técnico ou Funcionário).
- **Edição de perfil:** permite ao próprio colaborador atualizar seu nome e setor de atuação.
- **Campos protegidos:** e-mail e cargo não podem ser alterados pelo próprio usuário comum por questões de segurança.

## Proteção de acesso

Exige login ativo. Usuários deslogados são redirecionados automaticamente para a tela de login.
