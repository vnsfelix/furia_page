# Painel Administrativo

Painel de controle exclusivo para administradores (`role: 'admin'`).

## Arquivos da tela

- `index.html`: estrutura visual do painel.
- `../assets/js/pages/admin.js`: carregamento de dados, filtros, atualização de status e gestão de membros.
- `../assets/css/pages/admin.css`: estilização visual do painel.

## Funcionalidades

- **Métricas:** contadores de total de chamados, solicitações em andamento e colaboradores cadastrados.
- **Gestão de chamados:** listagem de todos os chamados, busca rápida, alteração de status (Recebido, Em andamento, Concluído) e exclusão.
- **Gestão de colaboradores:** listagem de usuários, alteração de setor e perfil (Funcionário, Técnico, Administrador), cadastro de novo membro e remoção.

## Proteção de acesso

Apenas usuários com perfil `admin` conseguem acessar. Caso um usuário comum ou não autenticado tente entrar pela URL, o sistema bloqueia e redireciona para o início.
