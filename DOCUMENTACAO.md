# Central de Documentação – Portal FURIA

Olá! Este arquivo reúne a explicação geral do sistema e aponta para os arquivos de documentação específicos de cada sessão do projeto.

---

## Documentação Dividida por Sessão

Cada pasta possui seu próprio arquivo `README.md` explicando detalhadamente seu funcionamento:

1. [**Conta (`/conta`)**](conta/README.md): Visualização e edição do perfil do colaborador, geração de avatar e integridade de dados.
2. [**Inicial (`/inicial`)**](inicial/README.md): Boas-vindas personalizadas, cards dos serviços disponíveis e menu rápido do usuário.
3. [**Chamados (`/chamados`)**](chamados/README.md): Histórico do colaborador, filtros por status (*Recebido*, *Em andamento*, *Concluído*) e isolamento de dados.
4. [**Problemas (`/problemas`)**](problemas/README.md): Formulário para relatar falhas em sistemas, computadores, redes e anexo de capturas de tela.
5. [**Atendimento Presencial (`/presencial`)**](presencial/README.md): Solicitação de visita técnica local (arena, estúdio, refeitório, etc.).
6. [**Painel Administrativo (`/admin`)**](admin/README.md): Gestão de todos os chamados da equipe, busca em tempo real, alteração de status e cadastro/remoção de membros.
7. [**Confirmação de Envio (`/enviados`)**](enviados/README.md): Tela de sucesso com o código do chamado gerado.
8. [**Página de Erro (`/errado`)**](errado/README.md): Tratamento amigável de falhas com opção de tentar novamente.
9. [**Backend & Banco de Dados (`/backend`)**](backend/README.md): Servidor Node.js, banco SQLite3 (`database.sqlite`), esquema SQL das tabelas e guia para o SQLite3 Editor.

---

## Login e Cadastro
- **Login ([`index.html`](index.html))**: Feito exclusivamente com **E-mail e Senha**, com opção de ver/ocultar senha e botão de acesso direto ao cadastro.
- **Cadastro ([`cadastro.html`](cadastro.html))**: Criação de novas contas com nome, e-mail e senha (com perfil de funcionário padrão).

---

## Conta de Teste do Administrador
- **E-mail**: `admin@furia.gg`
- **Senha**: `admin`
*(Todos os novos colaboradores e chamados podem ser cadastrados do zero por você).*
