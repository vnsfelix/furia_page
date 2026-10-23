# Sessão: Painel Administrativo (`/admin`)

Esta é a central de comando da equipe técnica e administrativa da FURIA.

---

## Quem pode acessar?
**Apenas usuários com perfil de Administrador (`role: 'admin'`).**
Se qualquer colaborador comum ou usuário não logado tentar entrar nesta página, a guarda de rotas (`FuriaAuth.requireAuth(['admin'])`) bloqueia o acesso e o redireciona automaticamente para a área inicial.

---

## Funcionalidades principais:

### 1. Indicadores em tempo real (Cards do topo)
- **Total de Chamados**: Contagem de todos os tickets já abertos no sistema.
- **Em Aberto / Andamento**: Quantidade de tickets que ainda precisam de resolução.
- **Membros Cadastrados**: Quantidade de colaboradores com conta no sistema.

### 2. Gestão de Chamados
- **Tabela dinâmica**: Mostra título do chamado, nome e e-mail do autor, descrição, data e status.
- **Busca em tempo real**: O campo de pesquisa filtra os chamados instantaneamente conforme você digita (pelo nome do autor, título, setor ou código).
- **Alteração de status**: Um seletor em cada linha permite mudar o status entre *Recebido*, *Em andamento* e *Concluído*. Ao mudar, as métricas e o histórico do usuário são atualizados na hora.
- **Exclusão de chamados**: Botão `🗑️ Excluir` em cada chamado para apagar solicitações com confirmação e atualização imediata dos contadores.

### 3. Gestão de Equipe (Usuários)
- **Lista de membros**: Mostra o nome e e-mail de cada usuário cadastrado.
- **Alteração de Setor e Perfil**: Campos editáveis diretamente na linha de cada funcionário para alterar seu setor e perfil (*Funcionário*, *Técnico*, *Administrador*) com salvamento instantâneo no botão `Salvar`.
- **Adicionar usuário**: Um formulário direto para cadastrar novos membros com o perfil desejado.
- **Remover usuário**: Botão para excluir contas da equipe (com proteção para evitar que o próprio admin logado se apague por engano).

---

## Quando você for conectar o Banco de Dados:
- A listagem de tickets virá de `GET /api/tickets` (todos os tickets).
- A mudança de status usará `PUT /api/tickets/:id/status`.
- A exclusão de tickets usará `DELETE /api/tickets/:id`.
- A lista de usuários virá de `GET /api/users`.
- A alteração de setor e perfil usará `PUT /api/users/:id`.
- O cadastro de novos membros usará `POST /api/users`.
- A exclusão usará `DELETE /api/users/:id`.

