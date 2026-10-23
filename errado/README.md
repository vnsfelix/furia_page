# Sessão: Página de Erro (`/errado`)

Esta tela serve como rede de segurança para exibir avisos ou falhas de forma amigável ao usuário, sem quebrar a experiência no navegador.

---

## Como funciona?
- Lê mensagens de erro personalizadas passadas via URL (ex.: `?msg=Servidor+indisponível`).
- Caso nenhuma mensagem seja passada, exibe um texto amigável: *"Algo não saiu como esperado. Ocorreu uma instabilidade ou falha temporária ao processar esta ação. Verifique os dados e tente novamente."*
- Oferece um botão **Tentar Novamente** (que retorna ao formulário anterior mantendo os dados digitados no histórico do navegador) e um botão para voltar à tela inicial.

