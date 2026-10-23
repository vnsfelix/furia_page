# Sessão: Relatar Problemas (`/problemas`)

Esta tela é usada quando o colaborador precisa de suporte técnico para computadores, softwares, senhas ou sistemas internos.

---

## O que o usuário preenche aqui?
1. **Categoria da ocorrência**:
   - Erro no Sistema / Software
   - Falha em Equipamento / Hardware
   - Problema de Acesso / Senha
   - Falha Operacional / Processo
   - Outro Problema
2. **Nível de urgência**:
   - Baixa (não impede a rotina)
   - Média (atrapalha algumas atividades)
   - Alta (impede completamente o trabalho ou transmissão)
3. **Título do relato**: Resumo curto do problema (ex.: *"Erro 500 ao gerar relatório de partidas"*).
4. **Descrição detalhada**: Campo de texto para explicar o que aconteceu e como reproduzir o erro.
5. **Anexo (opcional)**: Campo para anexar um print ou arquivo PDF com o erro exibido. O nome do arquivo selecionado é exibido imediatamente para dar segurança ao usuário.

---

## O que acontece ao clicar em "Enviar Solicitação"?
1. O formulário valida se todos os campos obrigatórios foram preenchidos.
2. O chamado é montado e vinculado automaticamente ao nome, ID e e-mail de quem está logado.
3. O chamado é salvo no banco local (`FuriaDB`) com o status inicial **Recebido** e um código gerado (ex.: `TK-8421`).
4. O usuário é encaminhado para a tela de confirmação (`../enviados/index.html?id=TK-8421`).

---

## Quando você for conectar o Banco de Dados:
Basta enviar uma requisição `POST /api/tickets` com o JSON contendo os dados do formulário e o ID do usuário.

