import { ticketInput } from '../services/validation.js';

const categories = ['sistema', 'equipamento', 'acesso', 'processo', 'outro'];
const places = ['recepcao', 'estudio', 'escritorio-adm', 'sala-reunioes', 'refeitorio', 'deposito'];
const services = ['hardware', 'redes', 'eletrica', 'limpeza', 'estrutura'];
export const emptyState = () => ({ stage: 'idle', draft: {} });
export function nextConversation(state, message) {
  const input = message.trim(); const command = input.toLowerCase();
  const current = { ...emptyState(), ...state, draft: { ...(state?.draft || {}) } };
  const answer = (reply, next = current, ticket = null) => ({ reply, next, ticket });
  if (command === '/cancelar') return answer('Solicitação cancelada. Use /chamado para começar novamente.', emptyState());
  if (command === '/ajuda' || command === '/start') return answer('Use /chamado para abrir uma solicitação, /cancelar para cancelar. Vincule sua conta na página Minha Conta do site.');
  if (command === '/chamado') return answer('Qual o tipo? Responda problemas ou presencial.', { stage: 'tipo', draft: {} });
  switch (current.stage) {
    case 'tipo':
      if (!['problemas', 'presencial'].includes(command)) return answer('Responda problemas ou presencial.');
      current.draft.tipo = command; current.stage = command === 'problemas' ? 'categoria' : 'local';
      return answer(command === 'problemas' ? `Categoria: ${categories.join(', ')}.` : `Local: ${places.join(', ')}.`);
    case 'categoria':
      if (!categories.includes(command)) return answer(`Escolha: ${categories.join(', ')}.`);
      current.draft.categoria = command; current.stage = 'titulo'; return answer('Informe o título (até 150 caracteres).');
    case 'local':
      if (!places.includes(command)) return answer(`Escolha: ${places.join(', ')}.`);
      current.draft.local = command; current.stage = 'tiposervico'; return answer(`Serviço: ${services.join(', ')}.`);
    case 'tiposervico':
      if (!services.includes(command)) return answer(`Escolha: ${services.join(', ')}.`);
      current.draft.tiposervico = command; current.stage = 'titulo'; return answer('Informe o título (até 150 caracteres).');
    case 'titulo':
      if (!input || input.length > 150 || input.startsWith('/')) return answer('Informe um título entre 1 e 150 caracteres.');
      current.draft.titulo = input; current.stage = 'descricao'; return answer('Descreva a solicitação em uma mensagem de texto.');
    case 'descricao':
      if (!input || input.length > 4096 || input.startsWith('/')) return answer('Envie a descrição em texto, com até 4096 caracteres.');
      current.draft.descricao = input; current.stage = 'urgencia'; return answer('Urgência: baixa, media ou alta.');
    case 'urgencia':
      if (!['baixa', 'media', 'alta'].includes(command)) return answer('Responda baixa, media ou alta.');
      current.draft.urgencia = command; current.stage = 'confirmar';
      return answer(`Resumo: ${current.draft.titulo}\nTipo: ${current.draft.tipo}\n${current.draft.categoria || current.draft.local}\nUrgência: ${command}\n${current.draft.descricao.slice(0, 1500)}\n\nResponda confirmar para abrir ou /cancelar para descartar.`);
    case 'confirmar':
      if (command !== 'confirmar') return answer('Responda confirmar para abrir ou /cancelar para descartar.');
      return answer('Chamado recebido.', emptyState(), ticketInput(current.draft));
    default: return answer('Use /chamado para abrir uma solicitação.', emptyState());
  }
}
