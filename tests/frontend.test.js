import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function storage() { const entries=new Map(); return {getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}; }
function browser(fetchImpl) {
  const timers=[]; const listeners={}; const redirects=[];
  const context={sessionStorage:storage(),localStorage:storage(),fetch:fetchImpl,setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},
    document:{hidden:false,activeElement:null,addEventListener:(name,fn)=>{listeners[name]=fn;},removeEventListener:()=>{}},
    window:{location:{hostname:'localhost',port:'3000',pathname:'/chamados/index.html',replace:path=>redirects.push(path)},addEventListener:()=>{},alert:()=>{}}};
  vm.createContext(context); vm.runInContext(source,context); return {context,furia:context.window.Furia,timers,listeners,redirects};
}
test('server identity overrides a forged cached administrator role',async()=>{
  const {context,furia,redirects}=browser(async()=>({ok:true,json:async()=>({user:{id:'real',role:'funcionario'}})}));
  context.localStorage.setItem('furia_user',JSON.stringify({id:'forged',role:'admin'}));
  assert.equal(await furia.requireAuth('admin'),false); assert.equal(furia.getUser().id,'real'); assert.equal(furia.getUser().role,'funcionario'); assert.match(redirects[0],/forbidden/);
});
test('API requests carry cookies and logout clears persistent and session caches',async()=>{
  const calls=[]; const {context,furia}=browser(async(url,options)=>{calls.push({url,options});return {ok:true,status:204,json:async()=>null};});
  furia.setUser({id:'x'},true); await furia.logout(); assert.equal(calls[0].options.credentials,'include'); assert.equal(calls[0].url,'/api/auth/logout');
  assert.equal(context.localStorage.getItem('furia_user'),null); assert.equal(context.sessionStorage.getItem('furia_user'),null);
});
test('expired server session clears cache and redirects to login',async()=>{
  const {furia,context,redirects}=browser(async()=>({ok:false,status:401,json:async()=>({error:'Expired'})}));
  furia.setUser({id:'x'}); assert.equal(await furia.requireAuth(),false); assert.equal(context.sessionStorage.getItem('furia_user'),null); assert.match(redirects[0],/unauthorized/);
});
test('polling pauses in hidden tabs and while controls are edited, and resumes on focus',async()=>{
  const {context,furia,timers,listeners}=browser(); let refreshed=0; furia.watch(async()=>refreshed++);
  context.document.hidden=true; await timers.shift()(); assert.equal(refreshed,0);
  context.document.hidden=false; context.document.activeElement={tagName:'SELECT'}; await timers.shift()(); assert.equal(refreshed,0);
  context.document.activeElement=null; await listeners.visibilitychange(); await Promise.resolve(); assert.equal(refreshed,1);
});
test('HTML and attachment metadata remain escaped',()=>{
  const {furia}=browser(); assert.equal(furia.escape('\" onerror=\"alert(1)'), '&quot; onerror=&quot;alert(1)');
  assert.equal(furia.parseAttachment({name:'a.png',type:'image/png',url:'/api/tickets/a/attachment'}).isImage,true);
  assert.equal(furia.parseAttachment({name:'a.pdf',type:'application/pdf',url:'/api/tickets/a/attachment'}).isImage,false);
  furia.apiUrl='http://localhost:3000/api';
  assert.equal(furia.parseAttachment({url:'/api/tickets/a/attachment'}).url,'http://localhost:3000/api/tickets/a/attachment');
});
