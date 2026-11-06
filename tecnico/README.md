# Painel do Técnico

Painel operacional para técnicos de suporte (`role: 'tecnico'`) e administradores.

## Arquivos da tela

- `index.html`: estrutura visual do painel técnico.
- `../assets/js/pages/tecnico.js`: listagem, filtros, alteração de status e abertura de anexos.
- `../assets/css/pages/tecnico.css`: estilização visual do painel.

## Funcionalidades

- **Métricas:** contadores de chamados totais, em andamento e concluídos.
- **Fila de atendimento:** lista de chamados com campo de busca e filtros rápidos por status (Recebido, Em andamento, Concluído).
- **Atualização de status:** seletor direto na linha do chamado para atualizar o andamento do suporte.
- **Visualização de anexos:** modal para ver fotos e prints anexados em tamanho ampliado, com opção de download.

## Proteção de acesso

Acesso restrito a usuários com perfil `tecnico` ou `admin`. Usuários com outros perfis são redirecionados para a tela inicial.
