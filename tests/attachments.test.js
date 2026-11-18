import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachmentBytes, ticketSummary } from '../backend/src/services/attachments.js';
test('list responses replace embedded Base64 with an authorized file route without changing stored data', () => {
  const original = { id: 'TK-old', anexo: JSON.stringify({ name: 'photo.png', data: 'data:image/png;base64,aGVsbG8=', type: 'image/png' }) };
  const summary = ticketSummary(original); assert.equal(summary.anexo.url, '/api/tickets/TK-old/attachment'); assert.equal(summary.anexo.name, 'photo.png'); assert.ok(!JSON.stringify(summary).includes('aGVsbG8=')); assert.equal(attachmentBytes(original.anexo).bytes.toString(), 'hello');
});
test('PDF survives and unsafe inline formats are refused', () => {
  assert.equal(attachmentBytes({ name: 'a.pdf', data: 'data:application/pdf;base64,JVBERg==' }).type, 'application/pdf');
  assert.throws(() => attachmentBytes({ data: 'data:image/svg+xml;base64,PHN2Zz4=' }), e => e.status === 404);
});
