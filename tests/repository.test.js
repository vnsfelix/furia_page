import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createRepository } from '../backend/src/db/repository.js';

function fixture(handler) {
  const calls=[];
  const client=createClient('https://test.supabase.co','sb_secret_test',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,options)=>{
    const call={url:new URL(url),options,body:options.body?JSON.parse(options.body):null}; calls.push(call);
    const result=handler(call); return new Response(JSON.stringify(result.body),{status:result.status||200,headers:{'Content-Type':'application/json',...(result.headers||{})}});
  }}});
  return {repository:createRepository(client),calls};
}
test('Supabase pagination preserves more than 100 records and applies user filter on every page',async()=>{
  const rows=Array.from({length:205},(_,n)=>({id:`ticket-${n}`,user_id:'user',created_at:'2026-01-01'}));
  const {repository,calls}=fixture(({url})=>{
    assert.equal(url.searchParams.get('user_id'),'eq.user');
    const offset=Number(url.searchParams.get('offset')||0);
    return {body:rows.slice(offset,offset+100)};
  });
  const result=await repository.findTickets({userId:'user'});
  assert.equal(result.length,205); assert.equal(calls.length,3); assert.equal(result[204].id,'ticket-204'); assert.equal(result[0].userId,'user');
});
test('email is queried with equality rather than wildcard matching',async()=>{
  const {repository,calls}=fixture(()=>({body:null})); await repository.findUserByEmail(' SOME@test.invalid ');
  assert.equal(calls[0].url.searchParams.get('email'),'eq.some@test.invalid');
});
test('server database errors are translated without leaking provider messages',async()=>{
  const {repository}=fixture(()=>({status:500,body:{code:'XX000',message:'sensitive server internals'}}));
  await assert.rejects(repository.findUserById('x'),e=>e.status===503&&!e.message.includes('sensitive'));
});
test('updates and deletions return 404 for nonexistent records',async()=>{
  const {repository}=fixture(({options})=>({body:options.method==='DELETE'?[]:null}));
  await assert.rejects(repository.updateTicket('missing',{status:'Recebido'}),e=>e.status===404);
  await assert.rejects(repository.deleteTicket('missing'),e=>e.status===404);
});
test('new ticket protocol is assigned by PostgreSQL, keeping the existing short format',async()=>{
  const {repository,calls}=fixture(({body})=>({body:{...body,id:'TK-10000'}}));
  const ticket=await repository.createTicket({tipo:'problemas',titulo:'Test',descricao:'Test'}, {id:'usr-existing',nome:'Existing',email:'existing@test.invalid'});
  assert.equal(calls[0].body.id,undefined); assert.equal(ticket.id,'TK-10000'); assert.equal(ticket.user_id,'usr-existing');
});
