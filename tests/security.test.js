import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from '../backend/src/app.js';
import { memoryRepository } from './helpers/memory-repository.js';
import { hashPassword, comparePassword, tokenHash } from '../backend/src/services/passwords.js';
import { readConfig } from '../backend/src/config/env.js';
const config = { production: false, origin: 'http://localhost:3000' };
let repo, server, base, users, cookies;
async function request(url, { method = 'GET', cookie, body, origin = config.origin, headers = {} } = {}) {
  const r = await fetch(base + url, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const value = await r.text(); return { status: r.status, data: value ? (() => { try { return JSON.parse(value); } catch { return value; } })() : null, headers: r.headers };
}
before(async () => {
  repo = memoryRepository(); users = {}; cookies = {};
  const senha = await hashPassword('testing-password');
  for (const role of ['admin', 'tecnico', 'funcionario', 'other']) users[role] = await repo.createUser({ nome: role, email: `${role}@test.invalid`, role: role === 'other' ? 'funcionario' : role, senha });
  server = createApp({ repository: repo, config }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
  for (const role of Object.keys(users)) {
    const r = await request('/api/auth/login', { method: 'POST', body: { email: users[role].email, password: 'testing-password' } });
    assert.equal(r.status, 200); cookies[role] = r.headers.get('set-cookie').split(';')[0];
  }
});
after(() => new Promise(resolve => server.close(resolve)));
test('configuration refuses a public key, accepts explicit server key, never enables SQLite', () => {
  assert.equal(readConfig({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_KEY: 'sb_publishable_test' }).databaseReady, false);
  assert.equal(readConfig({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test' }).databaseReady, true);
});
test('password salts differ, legacy SHA-256 works, plaintext refused', async () => {
  const a = await hashPassword('12345678'); const b = await hashPassword('12345678');
  assert.notEqual(a,b); assert.equal(await comparePassword('12345678',a),true); assert.equal(await comparePassword('wrong',a),false);
  assert.equal(await comparePassword('old',createHash('sha256').update('old').digest('hex')),true);
  assert.equal(await comparePassword('old','old'),false);
});
test('protected endpoints refuse missing, forged and expired cookies', async () => {
  for(const url of ['/api/tickets','/api/users',`/api/users/${users.admin.id}`]) assert.equal((await request(url)).status,401);
  assert.equal((await request('/api/auth/me',{cookie:'furia_session='+'a'.repeat(43)})).status,401);
  const token='b'.repeat(43); await repo.createSession({ token_hash: tokenHash(token), user_id: users.admin.id, expires_at:'2000-01-01' });
  assert.equal((await request('/api/auth/me',{cookie:`furia_session=${token}`})).status,401);
});
test('registration authenticates automatically and ignores a forged administrator role', async () => {
  const r=await request('/api/auth/register',{method:'POST',body:{name:'New User',email:'new@test.invalid',password:'testing-password',role:'admin'}});
  assert.equal(r.status,201); assert.equal(r.data.user.role,'funcionario'); assert.ok(!('senha' in r.data.user));
  assert.match(r.headers.get('set-cookie'),/HttpOnly/); assert.match(r.headers.get('set-cookie'),/SameSite=Strict/);
  const cookie=r.headers.get('set-cookie').split(';')[0]; assert.equal((await request('/api/auth/me',{cookie})).status,200);
});
test('login rejects wrong password and remember creates persistent cookie', async () => {
  assert.equal((await request('/api/auth/login',{method:'POST',body:{email:users.admin.email,password:'wrong'}})).status,401);
  const r=await request('/api/auth/login',{method:'POST',body:{email:users.admin.email,password:'testing-password',remember:true}});
  assert.match(r.headers.get('set-cookie'),/Max-Age=2592000/);
});
test('legacy login upgrades the password without changing identity', async () => {
  const old=await repo.createUser({nome:'Legacy',email:'legacy@test.invalid',role:'funcionario',senha:createHash('sha256').update('old-password').digest('hex')});
  const r=await request('/api/auth/login',{method:'POST',body:{email:old.email,password:'old-password'}});
  assert.equal(r.status,200); assert.equal(r.data.user.id,old.id); assert.match(repo.users.get(old.id).senha,/^scrypt\$/);
});
test('CSRF and untrusted origins are rejected, including absent Origin', async () => {
  for(const origin of ['https://evil.invalid','']) assert.equal((await request('/api/tickets',{method:'POST',origin,cookie:cookies.admin,body:{}})).status,403);
  assert.equal((await request('/api/tickets',{method:'POST',cookie:cookies.admin,headers:{'Sec-Fetch-Site':'cross-site'},body:{}})).status,403);
});
test('ticket author is derived from the authenticated user', async () => {
  const r=await request('/api/tickets',{method:'POST',cookie:cookies.funcionario,body:{tipo:'problemas',categoria:'sistema',titulo:'Problem',descricao:'Details',userId:users.admin.id,userName:'Forged',status:'Concluído'}});
  assert.equal(r.status,201); assert.equal(r.data.ticket.user_id,users.funcionario.id); assert.equal(r.data.ticket.status,'Recebido');
  const id=r.data.ticket.id;
  assert.equal((await request(`/api/tickets/${id}`,{cookie:cookies.other})).status,403);
  assert.equal((await request(`/api/tickets/user/${users.funcionario.id}`,{cookie:cookies.other})).status,403);
  assert.equal((await request('/api/tickets',{cookie:cookies.other})).data.length,0);
  assert.equal((await request(`/api/tickets/${id}/status`,{method:'PUT',cookie:cookies.funcionario,body:{status:'Concluído'}})).status,403);
  assert.equal((await request(`/api/tickets/${id}/status`,{method:'PUT',cookie:cookies.tecnico,body:{status:'Em andamento'}})).status,200);
  assert.equal((await request(`/api/tickets/${id}/status`,{method:'PUT',cookie:cookies.tecnico,body:{status:'invalid'}})).status,400);
  assert.equal((await request(`/api/tickets/${id}`,{method:'DELETE',cookie:cookies.tecnico})).status,403);
  assert.equal((await request(`/api/tickets/${id}`,{method:'DELETE',cookie:cookies.admin})).status,200);
  assert.equal((await request(`/api/tickets/${id}`,{cookie:cookies.admin})).status,404);
});
test('profiles and user management are restricted on the server', async () => {
  for(const route of ['/api/users','/api/tecnicos','/api/clientes']) assert.equal((await request(route,{cookie:cookies.tecnico})).status,403);
  assert.equal((await request(`/api/users/${users.funcionario.id}`,{method:'PUT',cookie:cookies.funcionario,body:{role:'admin'}})).status,403);
  assert.equal((await request(`/api/users/${users.other.id}`,{method:'PUT',cookie:cookies.funcionario,body:{name:'Attack'}})).status,403);
  assert.equal((await request(`/api/users/${users.funcionario.id}`,{method:'PUT',cookie:cookies.funcionario,body:{name:'My name',department:'TI'}})).status,200);
  assert.equal((await request('/api/users',{cookie:cookies.admin})).status,200);
  assert.equal((await request(`/api/users/${users.admin.id}`,{method:'DELETE',cookie:cookies.admin})).status,400);
});
test('unsafe attachments and incomplete tickets are refused', async () => {
  assert.equal((await request('/api/tickets',{method:'POST',cookie:cookies.admin,body:{tipo:'problemas'}})).status,400);
  const r=await request('/api/tickets',{method:'POST',cookie:cookies.admin,body:{tipo:'problemas',categoria:'x',titulo:'x',descricao:'x',anexo:{name:'x.svg',data:'data:image/svg+xml;base64,PHN2Zz4='}}}); assert.equal(r.status,400);
});
test('private files cannot be downloaded through express.static', async () => {
  for(const url of ['/backend/database.sqlite','/backend/server.js','/.env','/package.json','/supabase_schema.sql']) assert.equal((await request(url)).status,404);
  for(const url of ['/','/cadastro.html','/admin/index.html','/chamados/','/assets/css/base.css']) assert.equal((await request(url)).status,200);
});
test('logout revokes server session, and role changes take effect without login', async () => {
  const r=await request('/api/auth/login',{method:'POST',body:{email:users.tecnico.email,password:'testing-password'}}); const cookie=r.headers.get('set-cookie').split(';')[0];
  await repo.updateUser(users.tecnico.id,{role:'funcionario'});
  assert.equal((await request('/api/tickets/no/status',{method:'PUT',cookie,body:{status:'Recebido'}})).status,403);
  await repo.updateUser(users.tecnico.id,{role:'tecnico'});
  assert.equal((await request('/api/auth/logout',{method:'POST',cookie,body:{}})).status,204);
  assert.equal((await request('/api/auth/me',{cookie})).status,401);
});
test('attachment delivery checks ticket ownership and list responses omit binary data',async()=>{
  const created=await request('/api/tickets',{method:'POST',cookie:cookies.funcionario,body:{tipo:'problemas',categoria:'sistema',titulo:'Attachment',descricao:'Details',anexo:{name:'a.png',data:'data:image/png;base64,aGVsbG8='}}});
  assert.equal(created.status,201); const id=created.data.ticket.id;
  const listing=await request('/api/tickets',{cookie:cookies.funcionario}); const row=listing.data.find(t=>t.id===id);
  assert.equal(row.anexo.url,`/api/tickets/${id}/attachment`); assert.ok(!JSON.stringify(row).includes('aGVsbG8='));
  assert.equal((await request(row.anexo.url,{cookie:cookies.other})).status,403);
  const file=await request(row.anexo.url,{cookie:cookies.funcionario}); assert.equal(file.status,200); assert.equal(file.headers.get('content-type'),'image/png');
});
test('password change revokes other sessions and authenticates the new session',async()=>{
  const r=await request('/api/auth/password',{method:'POST',cookie:cookies.other,body:{currentPassword:'testing-password',newPassword:'new-testing-password'}});
  assert.equal(r.status,200); assert.equal((await request('/api/auth/me',{cookie:cookies.other})).status,401);
  const fresh=r.headers.get('set-cookie').split(';')[0]; assert.equal((await request('/api/auth/me',{cookie:fresh})).status,200);
  assert.equal(await comparePassword('new-testing-password',repo.users.get(users.other.id).senha),true);
});
test('public registration cannot use weak passwords and technicians cannot create users',async()=>{
  assert.equal((await request('/api/auth/register',{method:'POST',body:{name:'Test',email:'weak@test.invalid',password:'123'}})).status,400);
  assert.equal((await request('/api/users',{method:'POST',cookie:cookies.tecnico,body:{name:'Test',email:'x@test.invalid',password:'testing-password',role:'admin'}})).status,403);
});
test('rate limiting is enforced on login',async()=>{
  let last;
  for(let n=0;n<12;n++) last=await request('/api/auth/login',{method:'POST',body:{email:'unknown@test.invalid',password:'wrong'}});
  assert.equal(last.status,429);
});

test('webhook and scheduler require independent secrets',async()=>{
  const cfg={...config,telegramToken:'test',telegramUsername:'TestBot',telegramSecret:'webhook-secret',cronSecret:'cron-secret'};
  let processed=0,delivered=0; const endpoint=createApp({repository:repo,config:cfg,telegram:{async process(){processed++;},async deliver(){delivered++;return 1;}}}).listen(0,'127.0.0.1');
  await new Promise(resolve=>endpoint.once('listening',resolve)); const url=`http://127.0.0.1:${endpoint.address().port}`;
  try {
    assert.equal((await fetch(url+'/api/telegram/webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"update_id":1}'})).status,403);
    assert.equal((await fetch(url+'/api/telegram/webhook',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':'webhook-secret'},body:'{"update_id":1}'})).status,200);
    assert.equal(processed,1);
    assert.equal((await fetch(url+'/api/internal/telegram-delivery')).status,403);
    assert.equal((await fetch(url+'/api/internal/telegram-delivery',{headers:{Authorization:'Bearer cron-secret'}})).status,200); assert.equal(delivered,1);
  } finally {endpoint.closeAllConnections();await new Promise(resolve=>endpoint.close(resolve));}
});
test('missing database configuration fails closed but keeps liveness available',async()=>{
  const endpoint=createApp({repository:null,config}).listen(0,'127.0.0.1'); await new Promise(resolve=>endpoint.once('listening',resolve));
  const url=`http://127.0.0.1:${endpoint.address().port}`;
  try {assert.equal((await fetch(url+'/api/health')).status,200);assert.equal((await fetch(url+'/api/ready')).status,503);assert.equal((await fetch(url+'/api/tickets')).status,503);}
  finally {endpoint.closeAllConnections();await new Promise(resolve=>endpoint.close(resolve));}
});
