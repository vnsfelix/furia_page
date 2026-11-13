// Read-only preflight. No import, schema alteration or external connection.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
const filename = path.resolve(process.argv[2] || 'backend/database.sqlite');
const db = new DatabaseSync(filename, { readOnly: true });
try {
  const report = {
    source: filename,
    integrity: db.prepare('pragma integrity_check').all(),
    counts: db.prepare('select (select count(*) from users) users,(select count(*) from tickets) tickets').get(),
    orphans: db.prepare('select count(*) count from tickets t left join users u on u.id=t.user_id where u.id is null').get(),
    emailConflicts: db.prepare('select count(*) count from (select lower(trim(email)) from users group by lower(trim(email)) having count(*)>1)').get(),
    nonCanonicalEmails: db.prepare('select count(*) count from users where email<>lower(trim(email))').get(),
    invalidUsers: db.prepare("select count(*) count from users where length(id)>50 or length(nome)>100 or length(email)>100 or length(senha)>255 or length(department)>50 or role not in ('admin','tecnico','funcionario')").get(),
    invalidTickets: db.prepare("select count(*) count from tickets where length(id)>50 or length(titulo)>150 or length(categoria)>50 or length(local)>50 or length(tiposervico)>50 or status not in ('Recebido','Em andamento','Concluído') or urgencia not in ('baixa','media','alta')").get(),
    attachments: db.prepare('select count(*) count,max(length(anexo)) maxCharacters from tickets where anexo is not null').get(),
    tables: db.prepare("select name,sql from sqlite_master where type='table'").all()
  };
  console.log(JSON.stringify(report, null, 2));
} finally { db.close(); }
