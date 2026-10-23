# Sessão: Minha Conta (`/conta`)

Esta pasta cuida do perfil do usuário logado no portal da FURIA.

---

## O que esta tela faz?
Aqui o colaborador pode:
- Ver seus dados cadastrais (nome completo, e-mail corporativo, setor e tipo de perfil).
- Ver seu avatar personalizado, gerado automaticamente com a inicial do seu nome.
- Atualizar seu nome e setor com um clique no botão **Editar perfil**.
- Acessar o menu superior para ir para a tela inicial, ver seus chamados ou sair da conta.

---

## Arquivos desta pasta:
- `index.html`: A estrutura visual da página de perfil, com layout escuro no padrão FURIA.
- `script.js` / `style.css`: Arquivos mantidos para compatibilidade, com os estilos e comportamentos principais centralizados em `assets/` para evitar duplicação de código.

---

## Como as alterações são salvas?
1. O usuário clica em **Editar perfil**.
2. Os campos de nome e setor são liberados para digitação (o e-mail e o perfil ficam protegidos para manter a segurança do acesso).
3. Ao clicar em **Salvar Alterações**, o script atualiza as informações da sessão ativa e salva no banco local (`FuriaDB`).
4. O menu superior do usuário no topo da tela é atualizado na mesma hora com o novo nome.

---

## Quando você for conectar o Banco de Dados:
Quando seu banco estiver rodando, basta fazer uma requisição `PUT /api/users/:id` enviando `{ name, department }` para atualizar o registro na tabela `users` do banco.

