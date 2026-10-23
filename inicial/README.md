# Sessão: Tela Inicial (`/inicial`)

Esta é a página principal que o colaborador vê logo após fazer login no sistema.

---

## O que tem nesta tela?
- **Boas-vindas personalizadas**: O sistema reconhece quem fez login e dá boas-vindas chamando o colaborador pelo primeiro nome (ex.: *"Olá, Gabriel! Como podemos ajudar hoje?"*).
- **Cards de serviços**:
  1. **Relatar um Problema**: Leva para a tela de suporte a softwares, sistemas, acessos ou computadores (`../problemas/index.html`).
  2. **Solicitar Atendimento Presencial**: Leva para a tela de chamado presencial na arena, estúdio ou escritório da FURIA (`../presencial/index.html`).
- **Menu do Usuário**: No canto superior direito, o ícone de perfil abre um menu rápido com links para Minha Conta, Meus Chamados e Logout. Se quem estiver logado for um Administrador, um atalho exclusivo para o **Painel Admin** aparece no topo da lista.
- **Link rápido no rodapé**: Leva direto para acompanhar o andamento dos chamados abertos.

---

## Proteção de acesso (Segurança):
Se uma pessoa deslogada tentar acessar essa página digitando a URL diretamente no navegador, o sistema identifica que não há usuário ativo e a redireciona de volta para a tela de login.

---

## Arquivos desta pasta:
- `index.html`: A página principal da central de serviços.
- `inicial.html`: Arquivo de compatibilidade com redirecionamento automático para `index.html`.

