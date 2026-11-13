export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const roles = ['admin', 'tecnico', 'funcionario'];
export const statuses = ['Recebido', 'Em andamento', 'Concluído'];
export function text(value, label, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new HttpError(400, `${label} inválido.`);
  return value.trim();
}
export function choice(value, allowed, label) {
  if (!allowed.includes(value)) throw new HttpError(400, `${label} inválido.`);
  return value;
}
export function userInput(data, admin = false) {
  const email = text(data.email, 'E-mail', 100).toLowerCase();
  if (!/^[^\s@%]+@[^\s@%]+\.[^\s@%]+$/.test(email)) throw new HttpError(400, 'E-mail inválido.');
  const password = data.password;
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new HttpError(400, 'A senha deve ter entre 8 e 128 caracteres.');
  return { nome: text(data.name ?? data.nome, 'Nome', 100), email, password,
    role: admin ? choice(data.role || 'funcionario', roles, 'Perfil') : 'funcionario', department: text(data.department || 'Geral', 'Setor', 50) };
}
export function ticketInput(data, partial = false) {
  const result = {};
  for (const [key, max] of Object.entries({ titulo: 150, descricao: 20000, categoria: 50, local: 50, tiposervico: 50 })) {
    if (data[key] !== undefined) result[key] = text(data[key], key, max, ['titulo', 'descricao'].includes(key));
  }
  if (!partial) {
    result.titulo = text(data.titulo, 'Título', 150);
    result.descricao = text(data.descricao, 'Descrição', 20000);
    result.tipo = choice(data.tipo, ['problemas', 'presencial'], 'Tipo');
    if (result.tipo === 'problemas') result.categoria = text(data.categoria, 'Categoria', 50);
    else { result.local = text(data.local, 'Local', 50); result.tiposervico = text(data.tiposervico, 'Serviço', 50); }
  }
  if (!partial || data.urgencia !== undefined) result.urgencia = choice(data.urgencia || 'media', ['baixa', 'media', 'alta'], 'Urgência');
  if (partial && data.status !== undefined) result.status = choice(data.status, statuses, 'Status');
  if (!partial && data.anexo) {
    let attachment = data.anexo;
    if (typeof attachment === 'string') { try { attachment = JSON.parse(attachment); } catch { throw new HttpError(400, 'Anexo inválido.'); } }
    if (!attachment || typeof attachment !== 'object' || typeof attachment.data !== 'string' || !/^data:(image\/(png|jpeg|gif|webp)|application\/pdf);base64,[a-zA-Z0-9+/=\r\n]+$/.test(attachment.data)) throw new HttpError(400, 'Use imagem PNG, JPEG, GIF, WebP ou PDF.');
    const serialized = JSON.stringify({ name: text(attachment.name, 'Nome do arquivo', 255), type: attachment.data.slice(5, attachment.data.indexOf(';')), data: attachment.data });
    if (Buffer.byteLength(serialized) > 3 * 1024 * 1024) throw new HttpError(413, 'Anexo muito grande. Use um arquivo menor.');
    result.anexo = serialized;
  }
  return result;
}
