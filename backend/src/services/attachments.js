import { HttpError } from './validation.js';
export function readAttachment(value) {
  if (!value) return null;
  let attachment = value;
  if (typeof value === 'string') {
    try { attachment = JSON.parse(value); }
    catch { attachment = value.startsWith('data:') ? { data: value, name: 'Anexo' } : { name: value }; }
  }
  if (!attachment || typeof attachment !== 'object') return null;
  return attachment;
}
export function ticketSummary(ticket) {
  const attachment = readAttachment(ticket.anexo);
  if (!attachment) return ticket;
  const match = attachment.data?.match(/^data:(image\/(?:png|jpeg|gif|webp)|application\/pdf);base64,/i);
  return { ...ticket, anexo: { name: attachment.name || 'Anexo', type: match?.[1] || '',
    ...(match ? { url: `/api/tickets/${encodeURIComponent(ticket.id)}/attachment` } : {}) } };
}
export function attachmentBytes(value) {
  const attachment = readAttachment(value);
  const match = attachment?.data?.match(/^data:(image\/(?:png|jpeg|gif|webp)|application\/pdf);base64,([a-zA-Z0-9+/=\r\n]+)$/i);
  if (!match) throw new HttpError(404, 'Anexo não disponível.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 4 * 1024 * 1024) throw new HttpError(413, 'Anexo excede o limite disponível nesta hospedagem.');
  return { bytes, type: match[1].toLowerCase(), name: String(attachment.name || 'Anexo').replace(/[\r\n"\\]/g, '_') };
}
