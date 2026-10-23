# Sessão: Atendimento Presencial (`/presencial`)

Esta tela é voltada para solicitações de reparo físico, infraestrutura ou manutenção nos espaços da FURIA (arena, estúdio, escritório, etc.).

---

## O que o usuário informa?
1. **Local da ocorrência**:
   - Recepção
   - Estúdio / Arena FURIA
   - Escritório Administrativo
   - Sala de Reuniões
   - Refeitório / Convivência
   - Depósito / Almoxarifado
2. **Tipo de serviço**:
   - Suporte de Informática / Hardware
   - Rede / Cabeamento / Wi-Fi
   - Manutenção Elétrica
   - Limpeza / Organização Técnica
   - Infraestrutura / Reparo Geral
3. **Nível de urgência**: Baixa, Média ou Alta.
4. **Descrição detalhada**: O que precisa ser reparado, trocado ou instalado no ambiente.

---

## O que acontece ao enviar?
- O chamado é registrado no banco local (`FuriaDB`) com o tipo `presencial` e o autor vinculado à sessão.
- O colaborador é levado para a página de sucesso (`../enviados/index.html`) com o código do ticket para acompanhamento.

---

## Observação sobre o nome da pasta:
Antes a pasta estava nomeada como `Presencial` (com "P" maiúsculo). Padronizamos para `presencial` (em minúsculas) para evitar erros de arquivo não encontrado quando você publicar o site na nuvem ou em servidores Linux. Os redirecionamentos antigos continuam funcionando.

