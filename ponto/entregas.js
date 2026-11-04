/* ═══════════ Portal Equipe Las Vegas · v50 — ENTREGAS COM MOTO (rastreio ao vivo estilo iFood) ═══════════
   Pedido da Madu (04/11): "a gente faz entregas com a moto… a cliente verificar a entrega por um link, tipo iFood,
   e a equipe saber onde a motogirl está no mapa e o tempo para entregar". Motogirl da loja (Android e iPhone),
   as entregas saem sempre da Loja Bosque.
   • Portal › Vendas › Entregas (equipe) e Administração › Vendas › Entregas.
   • Cadastrar: cliente, WhatsApp, endereço, referência, localização (buscar endereço, colar o link do WhatsApp/Maps,
     usar a localização atual ou tocar no mapa), cobrar na entrega e pedido do site.
   • Motogirl: marca as entregas e toca "Sair para entrega"; o celular manda a posição enquanto o portal fica aberto
     (tela acesa no suporte), com Google Maps/Waze, ligar, WhatsApp, "Entreguei" e "Não consegui".
   • Mapa ao vivo para a equipe e a administração (moto, loja, paradas, tempo de cada uma).
   • Link da cliente: /e/?c=código (página pública e discreta, sem produto nem endereço escrito).
   • Quem guarda e calcula tudo é o serviço entregas-las-vegas no Railway (/api/entregas*, /api/rastreio/*), com o mesmo PIN do portal.
   Nomes internos: ENT50, ent50… */
const ENT50 = { d:null, t:0, carregando:false, erro:'', filtro:'', marcadas:{}, form:null, salvando:false, novo:null, aberta:null,
  gps:{ watch:null, ult:null, enviadoEm:0, enviando:false, erro:'', wake:null, pedido:false, enviou:0 }, mapa:null, mapaEl:null, camadas:null, fmapa:null, fmapaEl:null,
  busca:{ q:'', r:null, carregando:false }, rel:null, ajustes:false, pinMudou:false };
const ENT50_FORMAS = [['pix','Pix'],['dinheiro','Dinheiro'],['cartao','Cartão'],['pago','Já pago']];
const ENT50_ST = { aguardando:['Para sair','#F5B524','ti-package'], a_caminho:['A caminho','#E3101F','ti-motorbike'], entregue:['Entregue','#1a7f4b','ti-circle-check'], nao_entregue:['Não entregue','#8a5a00','ti-alert-triangle'], cancelada:['Cancelada','#999','ti-x'] };

function ent50Adm(){ return S.tela==='admin' && !!S.adm; }
function ent50Aqui(){ return (S.tela==='portal' && S.portalTab==='entregas') || (ent50Adm() && S.adm.tab==='entregas'); }
function ent50Logado(){ return (S.tela==='portal' && !!S.sess) || ent50Adm(); }
function ent50Eu(){ return ent50Adm() ? null : (S.sess?.eid || null); }
function ent50On(){ return typeof mod45On!=='function' || ent50Adm() || mod45On('entregas'); }
function ent50Minhas(){ const eu = ent50Eu(); return eu ? (ENT50.d?.lista||[]).filter(e=>e.status==='a_caminho' && e.entregadora?.eid===eu).sort((a,b)=>a.ordem-b.ordem) : []; }
function ent50Pend(){ return (ENT50.d?.lista||[]).filter(e=>e.status==='aguardando').length; }
const ent50Min = s => s==null ? '' : s < 90 ? '1 min' : Math.round(s/60) + ' min';
const ent50Km = m => m==null ? '' : m < 1000 ? Math.round(m/10)*10 + ' m' : (m/1000).toFixed(1).replace('.',',') + ' km';
const ent50Hora = t => t ? new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '';
const ent50Ha = t => { const s = Math.round((Date.now()-t)/1000); return s < 60 ? 'agora' : s < 3600 ? 'há ' + Math.floor(s/60) + ' min' : 'há ' + Math.floor(s/3600) + ' h'; };

/* conexão com o serviço de entregas (Railway › entregas-las-vegas): mesmo PIN do portal, passe de 12 h */
const ENT50_URL = (()=>{ try{ return JSON.parse(localStorage.getItem('lv_entregas_teste')||'""') || 'https://entregas-las-vegas-production.up.railway.app'; }catch(e){ return 'https://entregas-las-vegas-production.up.railway.app'; } })();
const ENT50_SES = { tk:null, quem:null, exp:0 };
function ent50Quem(){ return ent50Adm() ? 'admin' : S.sess?.eid ? 'eq:'+S.sess.eid : null; }
async function ent50Entrar(){
  const q = ent50Quem(); if(!q) throw new Error('Entre no portal primeiro');
  if(ENT50_SES.tk && ENT50_SES.quem===q && ENT50_SES.exp > Date.now()+60e3) return;
  try{ const g = JSON.parse(localStorage.getItem('lv_ent_'+q)||'null'); if(g && g.exp > Date.now()+60e3){ Object.assign(ENT50_SES, {tk:g.tk, quem:q, exp:g.exp}); return; } }catch(e){}
  const corpo = q==='admin' ? S.adm.cred : {eid:S.sess.eid, ...S.sess.cred};
  let r; try{ r = await fetch(ENT50_URL+'/api/sessao', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(corpo)}); }catch(e){ throw new Error('Sem conexão com o serviço de entregas'); }
  const j = await r.json().catch(()=>({ok:false, erro:'O serviço de entregas não respondeu'}));
  if(!j.ok) throw new Error(j.erro || 'Não consegui entrar nas entregas');
  Object.assign(ENT50_SES, {tk:j.token, quem:q, exp:j.exp}); try{ localStorage.setItem('lv_ent_'+q, JSON.stringify({tk:j.token, exp:j.exp})); }catch(e){}
}
async function ent50Api(p, corpo, tentou){
  await ent50Entrar();
  let r;
  try{ r = await fetch(ENT50_URL+p, {method:corpo?'POST':'GET', headers:{Authorization:'Bearer '+ENT50_SES.tk, ...(corpo?{'Content-Type':'application/json'}:{})}, body:corpo?JSON.stringify(corpo):undefined}); }
  catch(e){ throw new Error('Sem internet — tentando de novo'); }
  const j = await r.json().catch(()=>({ok:false, erro:'Resposta estranha do serviço de entregas'}));
  if(r.status===401 && !tentou){ try{ localStorage.removeItem('lv_ent_'+ENT50_SES.quem); }catch(e){} ENT50_SES.tk = null; return ent50Api(p, corpo, true); }
  if(!j.ok) throw new Error(j.erro || 'Erro nas entregas');
  return j;
}
const _sairV50 = typeof sair==='function' ? sair : null;
if(_sairV50) sair = function sair(){ try{ ['admin', S.sess?.eid && 'eq:'+S.sess.eid].filter(Boolean).forEach(q=>localStorage.removeItem('lv_ent_'+q)); }catch(e){} Object.assign(ENT50_SES, {tk:null, quem:null, exp:0}); ent50GpsDesligar(); return _sairV50.apply(this, arguments); };
async function ent50Carregar(silencioso){
  if(ENT50.carregando || !ent50Logado()) return; ENT50.carregando = true;
  try{ const r = await ent50Api('/api/entregas'); ent50Novas(r); ENT50.d = r; ENT50.erro = ''; ENT50.t = Date.now(); }
  catch(e){ ENT50.erro = e.message; }
  ENT50.carregando = false;
  ent50GpsConferir();
  if(ent50Aqui()){ if(!silencioso || !ent50Digitando()) render(); else ent50MapaPintar(); }
}
function ent50Digitando(){ const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest('.e50')); }
let _ent50Ult = null;
function ent50Novas(r){
  const n = (r.lista||[]).filter(e=>e.status==='aguardando').length;
  if(_ent50Ult!=null && n > _ent50Ult && !ent50Adm()) toast('🛵 Entrega nova para sair!');
  _ent50Ult = n;
}

/* ───────── GPS da entregadora ───────── */
function ent50GpsConferir(){
  const tem = ent50Minhas().length > 0;
  if(tem && ENT50.gps.watch==null) ent50GpsLigar();
  if(!tem && ENT50.gps.watch!=null) ent50GpsDesligar();
}
function ent50GpsLigar(){
  const G = ENT50.gps;
  if(!('geolocation' in navigator)){ G.erro = 'Este aparelho não tem localização'; return; }
  if(G.watch!=null) return;
  G.erro = '';
  G.watch = navigator.geolocation.watchPosition(ent50GpsPos, err=>{
    G.erro = err.code===1 ? 'Localização bloqueada — libere para o portal nas configurações do navegador' : err.code===3 ? 'Procurando o GPS…' : 'Sem sinal de GPS';
    if(ent50Aqui()) ent50Repintar();
  }, {enableHighAccuracy:true, maximumAge:5000, timeout:25000});
  ent50Acordar();
}
function ent50GpsDesligar(){
  const G = ENT50.gps;
  if(G.watch!=null){ try{ navigator.geolocation.clearWatch(G.watch); }catch(e){} }
  G.watch = null; try{ G.wake?.release(); }catch(e){} G.wake = null;
}
async function ent50Acordar(){
  const G = ENT50.gps;
  if(G.wake || !('wakeLock' in navigator) || document.visibilityState!=='visible') return;
  try{ G.wake = await navigator.wakeLock.request('screen'); G.wake.addEventListener('release', ()=>{ G.wake = null; }); }catch(e){}
}
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState!=='visible') return;
  if(ENT50.gps.watch!=null){ ent50Acordar(); ent50Carregar(true); }
});
function ent50GpsPos(p){
  const G = ENT50.gps, c = p.coords, ant = G.ult;
  G.ult = {lat:c.latitude, lng:c.longitude, acc:c.accuracy, vel:c.speed!=null && c.speed>=0 ? +(c.speed*3.6).toFixed(1) : null, rumo:c.heading!=null && !isNaN(c.heading) ? Math.round(c.heading) : null, t:Date.now()};
  G.erro = '';
  const longe = !ant || ent50Dist(ant, G.ult) > 20, desde = Date.now() - G.enviadoEm;
  if(!G.enviando && (desde > 25e3 || (longe && desde > 7e3))) ent50GpsEnviar();
  ent50MapaPintar();
}
async function ent50GpsEnviar(){
  const G = ENT50.gps; if(!G.ult || G.enviando) return;
  G.enviando = true;
  try{
    const r = await ent50Api('/api/entregas/pos', G.ult);
    G.enviadoEm = Date.now(); G.enviou++;
    if(r.prox){ const e = (ENT50.d?.lista||[]).find(x=>x.id===r.prox.id); if(e){ e.etaSeg = r.prox.etaSeg; e._m = r.prox.m; } }
  }catch(e){ G.erro = 'Sem internet — a posição vai assim que voltar'; }
  G.enviando = false;
  if(ent50Aqui() && !ent50Digitando()) ent50Repintar();
}
function ent50Dist(a, b){ const R = 6371e3, r = x=>x*Math.PI/180, dLa = r(b.lat-a.lat), dLo = r(b.lng-a.lng); const h = Math.sin(dLa/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
/* a posição continua indo mesmo fora da tela de Entregas (o mapa e a tela só repintam quando estão abertos) */
setInterval(()=>{ const G = ENT50.gps; if(G.watch!=null && G.ult && Date.now()-G.enviadoEm > 30e3) ent50GpsEnviar(); }, 10e3);

/* ───────── ações ───────── */
async function ent50Agir(id, op, extra){
  const b = document.querySelector(`[data-e50="${id}-${op}"]`); if(b){ b.disabled = true; b.classList.add('ind'); }
  try{
    const corpo = {op, ...(extra||{})};
    if(op==='sair' && ENT50.gps.ult) Object.assign(corpo, {lat:ENT50.gps.ult.lat, lng:ENT50.gps.ult.lng, acc:ENT50.gps.ult.acc});
    const r = await ent50Api('/api/entregas/'+id, corpo);
    ent50Troca(r.entrega);
    return r.entrega;
  }catch(e){ toast(e.message, true); if(b){ b.disabled = false; b.classList.remove('ind'); } throw e; }
}
function ent50Troca(e){ if(!ENT50.d) return; const L = ENT50.d.lista, i = L.findIndex(x=>x.id===e.id); if(i>=0) L[i] = e; else L.unshift(e); }
async function ent50Sair(){
  const ids = Object.keys(ENT50.marcadas).filter(k=>ENT50.marcadas[k] && (ENT50.d?.lista||[]).some(e=>e.id===k && e.status==='aguardando'));
  if(!ids.length){ toast('Marque as entregas que vai levar', true); return; }
  ent50GpsLigar();
  let n = 0, semAuto = [];
  for(const id of ids){ try{ const e = await ent50Agir(id, 'sair'); n++; if(!ENT50.d.whatsAuto && e.whatsUrl) semAuto.push(e); }catch(e){} }
  ENT50.marcadas = {}; ENT50.filtro = 'rota';
  if(n) toast(`🛵 Boa entrega! ${n} ${n===1?'entrega':'entregas'} na rota`);
  if(semAuto.length) ENT50.avisar = semAuto.map(e=>e.id);
  await ent50Carregar(true); render();
}
async function ent50Entreguei(id){
  const e = (ENT50.d?.lista||[]).find(x=>x.id===id); if(!e) return;
  let extra = {};
  if(e.cobrar?.valor && e.cobrar.forma!=='pago'){
    if(!confirm(`Recebeu ${brl2(e.cobrar.valor)} (${ent50Forma(e.cobrar.forma)}) da cliente?`)) return;
    extra.recebido = String(e.cobrar.valor);
  } else if(!confirm(`Confirmar entrega para ${e.cliente}?`)) return;
  try{ await ent50Agir(id, 'entregue', extra); ent50Festa(); toast('✅ Entregue!'); await ent50Carregar(true); render(); }catch(err){}
}
async function ent50NaoConsegui(id){
  const m = prompt('O que aconteceu? (ex.: ninguém em casa, endereço errado, cliente não atendeu)'); if(m==null) return;
  try{ await ent50Agir(id, 'nao_entregue', {motivo:m}); toast('Registrado. Avise a loja 💬'); await ent50Carregar(true); render(); }catch(e){}
}
async function ent50Simples(id, op, pergunta){
  let extra = {};
  if(op==='cancelar'){ const m = prompt(pergunta || 'Motivo do cancelamento?'); if(m==null) return; extra.motivo = m; }
  else if(pergunta && !confirm(pergunta)) return;
  try{ await ent50Agir(id, op, extra); await ent50Carregar(true); render(); }catch(e){}
}
function ent50Festa(){ const w = document.createElement('div'); w.className = 'e50-festa'; w.innerHTML = '🛵<span>Entregue!</span>'; document.body.appendChild(w); setTimeout(()=>w.remove(), 1500); }
function ent50Forma(f){ return (ENT50_FORMAS.find(x=>x[0]===f)||[,f||''])[1]; }
async function ent50Copiar(txt, msg){
  try{ await navigator.clipboard.writeText(txt); toast(msg || 'Copiado ✔'); }
  catch(e){ prompt('Copie o link:', txt); }
}

/* ───────── formulário (nova / editar) ───────── */
function ent50Novo(){
  ENT50.form = { id:null, cliente:'', tel:'', endereco:'', ref:'', obs:'', pedido:'', valor:'', forma:'pix', lat:null, lng:null, fonte:'', local:'' };
  ENT50.busca = { q:'', r:null, carregando:false }; ENT50.novo = null; render();
  setTimeout(()=>document.getElementById('e50-cli')?.focus(), 80);
}
function ent50Editar(id){
  const e = (ENT50.d?.lista||[]).find(x=>x.id===id); if(!e) return;
  ENT50.form = { id, cliente:e.cliente||'', tel:e.telVisivel ? e.tel : '', telOculto:!e.telVisivel && !!e.tel, endereco:e.endereco||'', ref:e.ref||'', obs:e.obs||'', pedido:e.pedido||'', valor:e.cobrar?.valor ? String(e.cobrar.valor).replace('.',',') : '', forma:e.cobrar?.forma||'pix', lat:e.dest?.lat ?? null, lng:e.dest?.lng ?? null, fonte:e.dest?.fonte||'', local:'' };
  ENT50.busca = { q:'', r:null, carregando:false }; render(); window.scrollTo({top:0, behavior:'smooth'});
}
function ent50F(k, v){ if(ENT50.form) ENT50.form[k] = v; }
async function ent50Buscar(){
  const F = ENT50.form; if(!F) return;
  const q = (F.endereco || '').trim(); if(q.length < 4){ toast('Escreva o endereço primeiro (rua e número, bairro)', true); return; }
  ENT50.busca = { q, r:null, carregando:true }; ent50Repintar();
  try{ const r = await ent50Api('/api/entregas/geo?q='+encodeURIComponent(q)); ENT50.busca.r = r.r || []; }
  catch(e){ ENT50.busca.r = []; toast(e.message, true); }
  ENT50.busca.carregando = false;
  if(ENT50.busca.r.length===1) ent50Pino(ENT50.busca.r[0].lat, ENT50.busca.r[0].lng, 'busca');
  ent50Repintar();
}
async function ent50Link(){
  const F = ENT50.form; if(!F) return;
  let txt = (F.local||'').trim();
  if(!txt){ try{ txt = (await navigator.clipboard.readText()).trim(); F.local = txt; }catch(e){} }
  if(!txt){ toast('Cole aqui o link da localização que a cliente mandou', true); document.getElementById('e50-local')?.focus(); return; }
  try{
    const r = await ent50Api('/api/entregas/geo?local='+encodeURIComponent(txt));
    if(r.r?.length){ ent50Pino(r.r[0].lat, r.r[0].lng, 'link'); toast('📍 Localização encontrada'); }
    else toast('Não achei a localização nesse link — busque pelo endereço ou toque no mapa', true);
  }catch(e){ toast(e.message, true); }
  ent50Repintar();
}
function ent50AquiAgora(){
  if(!('geolocation' in navigator)){ toast('Este aparelho não tem localização', true); return; }
  toast('Pegando a localização…');
  navigator.geolocation.getCurrentPosition(p=>{ ent50Pino(p.coords.latitude, p.coords.longitude, 'gps'); ent50Repintar(); }, ()=>toast('Não consegui a localização', true), {enableHighAccuracy:true, timeout:15000});
}
function ent50Pino(lat, lng, fonte){ const F = ENT50.form; if(!F) return; F.lat = +lat.toFixed(6); F.lng = +lng.toFixed(6); F.fonte = fonte; ENT50.pinMudou = true; }
async function ent50Salvar(){
  const F = ENT50.form; if(!F || ENT50.salvando) return;
  if(!F.cliente.trim()){ toast('Coloca o nome da cliente', true); return; }
  if(!F.endereco.trim() && F.lat==null){ toast('Coloca o endereço ou marque no mapa', true); return; }
  ENT50.salvando = true; ent50Repintar();
  const corpo = { cliente:F.cliente, endereco:F.endereco, ref:F.ref, obs:F.obs, pedido:F.pedido, cobrar:{valor:F.forma==='pago' ? '' : F.valor, forma:F.forma} };
  if(!F.telOculto || F.tel) corpo.tel = F.tel;
  if(F.lat!=null) Object.assign(corpo, {lat:F.lat, lng:F.lng, fonte:F.fonte||'mapa'}); else if(F.local) corpo.local = F.local;
  try{
    const r = F.id ? await ent50Api('/api/entregas/'+F.id, {op:'editar', ...corpo}) : await ent50Api('/api/entregas', corpo);
    ent50Troca(r.entrega);
    if(!F.id){ ENT50.novo = r.entrega; toast('📦 Entrega cadastrada!'); } else toast('Salvo ✔');
    ENT50.form = null; ENT50.filtro = '';
  }catch(e){ toast(e.message, true); }
  ENT50.salvando = false; render();
}

/* ───────── mapa (Leaflet + OpenStreetMap) ───────── */
let _ent50Leaf = null;
function ent50Leaflet(){
  if(window.L && L.map) return Promise.resolve();
  if(_ent50Leaf) return _ent50Leaf;
  _ent50Leaf = new Promise((ok, erro)=>{
    const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = ok; s.onerror = ()=>{ _ent50Leaf = null; erro(new Error('mapa')); }; document.head.appendChild(s);
  });
  return _ent50Leaf;
}
function ent50Icone(tipo, txt){
  const cls = {moto:'e50-pin moto', loja:'e50-pin loja', dest:'e50-pin dest', destOn:'e50-pin dest on', destOk:'e50-pin dest ok', novo:'e50-pin novo'}[tipo];
  const em = {moto:'🛵', loja:'🏬', dest:'📦', destOn:'📦', destOk:'✔', novo:'📍'}[tipo];
  return L.divIcon({className:'', html:`<div class="${cls}"><span>${em}</span>${txt?`<b>${esc(txt)}</b>`:''}</div>`, iconSize:[34,34], iconAnchor:[17,17]});
}
function ent50MapaCriar(){
  if(ENT50.mapa || !window.L) return;
  const el = document.createElement('div'); el.className = 'e50-mapa';
  ENT50.mapaEl = el;
  const loja = ENT50.d?.cfg?.loja || {lat:-9.9672, lng:-67.8232};
  const m = L.map(el, {zoomControl:true, attributionControl:true}).setView([loja.lat, loja.lng], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(m);
  ENT50.mapa = m; ENT50.camadas = L.layerGroup().addTo(m); ENT50.enquadrou = false;
}
function ent50MapaPintar(){
  const m = ENT50.mapa; if(!m || !ENT50.d) return;
  const g = ENT50.camadas; g.clearLayers();
  const D = ENT50.d, pts = [], eu = ent50Eu();
  const loja = D.cfg?.loja; if(loja){ L.marker([loja.lat, loja.lng], {icon:ent50Icone('loja'), zIndexOffset:-100}).addTo(g).bindTooltip(loja.nome||'Loja'); pts.push([loja.lat, loja.lng]); }
  (D.lista||[]).forEach(e=>{
    if(!e.dest || !['aguardando','a_caminho'].includes(e.status) && !(e.status==='entregue' && e.fimEm > Date.now()-3600e3)) return;
    const t = e.status==='a_caminho' ? 'destOn' : e.status==='entregue' ? 'destOk' : 'dest';
    const quando = e.status==='a_caminho' && e.etaSeg ? ' · ~' + ent50Min(e.etaSeg) : '';
    L.marker([e.dest.lat, e.dest.lng], {icon:ent50Icone(t, e.status==='a_caminho' ? String(e.ordem) : '')}).addTo(g).bindTooltip(`${esc(e.cliente)} — ${ENT50_ST[e.status][0]}${quando}`);
    if(e.status!=='entregue') pts.push([e.dest.lat, e.dest.lng]);
  });
  const motos = (D.motos||[]).slice();
  const G = ENT50.gps;
  if(eu && G.ult){ const i = motos.findIndex(x=>x.eid===eu); const eu_ = {eid:eu, nome:'Você', lat:G.ult.lat, lng:G.ult.lng, t:G.ult.t, emRota:true}; if(i>=0) motos[i] = eu_; else motos.push(eu_); }
  motos.forEach(mo=>{
    const velha = Date.now()-mo.t > 3*60e3;
    if(!mo.emRota && Date.now()-mo.t > 30*60e3) return;
    L.marker([mo.lat, mo.lng], {icon:ent50Icone('moto', mo.nome + (velha ? ' · ' + ent50Ha(mo.t) : '')), zIndexOffset:1000}).addTo(g);
    if(mo.emRota) pts.push([mo.lat, mo.lng]);
    const prox = (D.lista||[]).filter(e=>e.status==='a_caminho' && e.entregadora?.eid===mo.eid && e.dest).sort((a,b)=>a.ordem-b.ordem);
    if(prox.length) L.polyline([[mo.lat, mo.lng], ...prox.map(e=>[e.dest.lat, e.dest.lng])], {color:'#E3101F', weight:3, opacity:.55, dashArray:'6 8'}).addTo(g);
  });
  if(!ENT50.enquadrou && pts.length){ ENT50.enquadrou = true; if(pts.length===1) m.setView(pts[0], 15); else m.fitBounds(pts, {padding:[36,36], maxZoom:16}); }
}
function ent50Centralizar(){ ENT50.enquadrou = false; ent50MapaPintar(); }
function ent50FormMapa(){
  const F = ENT50.form; if(!F || !window.L) return;
  if(!ENT50.fmapa){
    const el = document.createElement('div'); el.className = 'e50-fmapa'; ENT50.fmapaEl = el;
    const loja = ENT50.d?.cfg?.loja || {lat:-9.9672, lng:-67.8232};
    const m = L.map(el, {zoomControl:true}).setView([loja.lat, loja.lng], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(m);
    m.on('click', ev=>{ ent50Pino(ev.latlng.lat, ev.latlng.lng, 'mapa'); ent50FormMapaPino(); ent50Repintar(); });
    ENT50.fmapa = m; ENT50.fpino = null; ENT50.pinMudou = true;
  }
  ent50FormMapaPino();
}
function ent50FormMapaPino(){
  const F = ENT50.form, m = ENT50.fmapa; if(!F || !m) return;
  if(F.lat==null){ if(ENT50.fpino){ ENT50.fpino.remove(); ENT50.fpino = null; } return; }
  if(!ENT50.fpino){
    ENT50.fpino = L.marker([F.lat, F.lng], {icon:ent50Icone('novo'), draggable:true}).addTo(m);
    ENT50.fpino.on('dragend', ev=>{ const p = ev.target.getLatLng(); ent50Pino(p.lat, p.lng, 'mapa'); ent50Repintar(); });
  } else ENT50.fpino.setLatLng([F.lat, F.lng]);
  if(ENT50.pinMudou){ ENT50.pinMudou = false; m.setView([F.lat, F.lng], Math.max(m.getZoom(), 16)); }
}
/* depois de cada render: devolve os mapas (que não podem ser recriados a cada pintura) para o lugar deles */
function ent50Encaixar(){
  if(!ent50Aqui()) return;
  const slot = document.getElementById('e50-mapa-slot'), fslot = document.getElementById('e50-fmapa-slot');
  if((slot || fslot) && !window.L){ ent50Leaflet().then(()=>{ if(ent50Aqui()) ent50Encaixar(); }).catch(()=>{ const s = document.getElementById('e50-mapa-slot'); if(s) s.innerHTML = '<div class="e50-sem">Mapa indisponível agora (sem internet?)</div>'; }); return; }
  if(slot){ ent50MapaCriar(); if(ENT50.mapaEl.parentNode!==slot) slot.appendChild(ENT50.mapaEl); setTimeout(()=>{ if(ENT50.mapa){ ENT50.mapa.invalidateSize(); ent50MapaPintar(); } }, 30); }
  if(fslot){ ent50FormMapa(); if(ENT50.fmapaEl.parentNode!==fslot) fslot.appendChild(ENT50.fmapaEl); setTimeout(()=>{ if(ENT50.fmapa){ ENT50.fmapa.invalidateSize(); ent50FormMapaPino(); } }, 30); }
  else if(ENT50.fmapa && !ENT50.form){ ENT50.fmapa.remove(); ENT50.fmapa = null; ENT50.fmapaEl = null; ENT50.fpino = null; }
}
/* repinta só a tela de Entregas (sem refazer o portal inteiro) */
function ent50Repintar(){
  const box = document.getElementById('e50-raiz'); if(!box){ if(ent50Aqui()) render(); return; }
  const foco = document.activeElement, fid = foco && foco.closest('#e50-raiz') ? foco.id : null, pos = fid && foco.selectionStart;
  box.outerHTML = ent50Tela();
  ent50Encaixar();
  if(fid){ const el = document.getElementById(fid); if(el){ el.focus(); try{ if(pos!=null) el.setSelectionRange(pos, pos); }catch(e){} } }
}

/* ───────── telas ───────── */
function ent50Tela(){
  if(!ENT50.d && !ENT50.erro){ setTimeout(()=>ent50Carregar(), 0); return `<div id="e50-raiz" class="e50"><div class="e50-vazio"><span class="giro">🛵</span><p>Carregando as entregas…</p></div></div>`; }
  const D = ENT50.d || {lista:[], motos:[], resumo:{}}, adm = ent50Adm(), eu = ent50Eu(), minhas = ent50Minhas();
  const L_ = D.lista || [], aguard = L_.filter(e=>e.status==='aguardando'), rota = L_.filter(e=>e.status==='a_caminho').sort((a,b)=>(a.entregadora?.nome||'').localeCompare(b.entregadora?.nome||'') || a.ordem-b.ordem), fim = L_.filter(e=>!['aguardando','a_caminho'].includes(e.status));
  let filtro = ENT50.filtro || (minhas.length ? 'rota' : aguard.length ? 'sair' : rota.length ? 'rota' : 'hoje');
  const lista = {sair:aguard, rota, hoje:fim}[filtro] || aguard;
  const R = D.resumo || {};
  const quieto = ENT50._ja; ENT50._ja = true;
  return `<div id="e50-raiz" class="e50 ${quieto?'quieto':''}">
    <div class="e50-topo"><div><span class="e50-tag"><i class="ti ti-motorbike"></i> Entregas com moto</span>
      <h2>Entregas <mark>ao vivo</mark></h2>
      <p>${adm ? 'Onde a moto está, o tempo de cada entrega e o link que a cliente acompanha.' : 'Cadastre a entrega, a motogirl sai com o celular e a cliente acompanha pelo link — como no iFood.'}</p></div>
      <div class="e50-topo-b"><button class="e50-btn" onclick="ent50Novo()"><i class="ti ti-plus"></i> Nova entrega</button></div></div>
    ${ENT50.erro ? `<div class="e50-aviso ruim"><i class="ti ti-wifi-off"></i> ${esc(ENT50.erro)} <button class="e50-mini" onclick="ent50Carregar()">Tentar de novo</button></div>` : ''}
    ${ENT50.form ? ent50FormTela() : ''}
    ${ENT50.novo ? ent50NovoTela(ENT50.novo) : ''}
    ${(ENT50.avisar||[]).length ? ent50AvisarTela() : ''}
    ${minhas.length ? ent50RotaTela(minhas) : ''}
    <div class="e50-numeros">
      <div><b>${aguard.length}</b><small>para sair</small></div>
      <div><b>${rota.length}</b><small>a caminho</small></div>
      <div><b>${R.entregues||0}</b><small>entregues hoje</small></div>
      <div><b>${R.mediaMin!=null ? R.mediaMin+'<em>min</em>' : '—'}</b><small>tempo médio</small></div>
    </div>
    <div class="e50-mapa-box"><div id="e50-mapa-slot"></div><button class="e50-centro" title="Ver todos" onclick="ent50Centralizar()"><i class="ti ti-focus-centered"></i></button></div>
    <div class="e50-filtros">
      <button class="${filtro==='sair'?'on':''} ${aguard.length?'pulsa':''}" onclick="ENT50.filtro='sair';ent50Repintar()"><i class="ti ti-package"></i> Para sair ${aguard.length?`<span class="contador">${aguard.length}</span>`:''}</button>
      <button class="${filtro==='rota'?'on':''}" onclick="ENT50.filtro='rota';ent50Repintar()"><i class="ti ti-motorbike"></i> A caminho ${rota.length?`<span class="contador">${rota.length}</span>`:''}</button>
      <button class="${filtro==='hoje'?'on':''}" onclick="ENT50.filtro='hoje';ent50Repintar()"><i class="ti ti-history"></i> Concluídas hoje ${fim.length?`<span class="contador">${fim.length}</span>`:''}</button>
    </div>
    ${lista.length ? `<div class="e50-lista">${lista.map(ent50Card).join('')}</div>` : `<div class="e50-vazio"><span>${filtro==='sair'?'📦':filtro==='rota'?'🛵':'✨'}</span><p>${filtro==='sair'?'Nenhuma entrega esperando para sair.':filtro==='rota'?'Ninguém na rua agora.':'Nada concluído hoje ainda.'}</p></div>`}
    ${filtro==='sair' && aguard.length && !adm ? ent50BarraSair(aguard) : ''}
    ${adm ? ent50AdmTela() : ''}
    <p class="e50-rod suave">🔒 A cliente só vê o primeiro nome, a moto e o tempo — nunca o produto. A posição da moto só aparece para ela quando é a vez dela.</p>
  </div>`;
}
function ent50Card(e){
  const st = ENT50_ST[e.status] || ['', '#999', 'ti-point'], eu = ent50Eu(), minha = e.entregadora?.eid && e.entregadora.eid===eu, adm = ent50Adm();
  const marc = !!ENT50.marcadas[e.id];
  const eta = e.status==='a_caminho' && e.etaSeg ? `<span class="e50-eta"><i class="ti ti-clock"></i> ~${ent50Min(e.etaSeg)} · ${ent50Hora(Date.now()+e.etaSeg*1000)}</span>` : '';
  const cobra = e.cobrar?.valor ? `<span class="e50-chip ${e.cobrar.forma==='pago'?'':'cobra'}"><i class="ti ti-cash"></i> ${e.cobrar.forma==='pago'?'Já pago':'Cobrar '+brl2(e.cobrar.valor)+' · '+ent50Forma(e.cobrar.forma)}</span>` : '';
  const sinal = e.status==='a_caminho' && e.entregadora && !minha ? (()=>{ const mo = (ENT50.d?.motos||[]).find(m=>m.eid===e.entregadora.eid); return mo && Date.now()-mo.t > 3*60e3 ? `<span class="e50-chip ruim"><i class="ti ti-antenna-bars-off"></i> sinal ${ent50Ha(mo.t)}</span>` : ''; })() : '';
  const quem = e.status==='a_caminho' ? `🛵 ${esc(e.entregadora?.nome||'')} · saiu ${ent50Hora(e.saiuEm)}` : e.status==='aguardando' ? `Cadastrada ${ent50Hora(e.criadoEm)} por ${esc(e.criadoPor?.nome||'')}` : `${st[0]} ${ent50Hora(e.fimEm)}${e.entregadora?' · '+esc(e.entregadora.nome):''}${e.saiuEm&&e.fimEm&&e.status==='entregue'?' · '+Math.max(1,Math.round((e.fimEm-e.saiuEm)/60e3))+' min':''}`;
  const podeMarcar = e.status==='aguardando' && !adm;
  return `<article class="e50-card s-${e.status} ${marc?'marc':''}" style="--c:${st[1]}">
    <header ${podeMarcar?`onclick="ENT50.marcadas['${e.id}']=!ENT50.marcadas['${e.id}'];ent50Repintar()" class="toca"`:''}>
      ${podeMarcar?`<span class="e50-ck"><i class="ti ti-check"></i></span>`:`<span class="e50-st"><i class="ti ${st[2]}"></i></span>`}
      <div class="t"><b>${esc(e.cliente)}${e.status==='a_caminho'?` <small class="e50-ord">${e.ordem}ª parada</small>`:''}</b><small>${quem}</small></div>
      <span class="e50-num">#${e.num}</span>
    </header>
    <div class="e50-end"><i class="ti ti-map-pin"></i><div>${esc(e.endereco||'(sem endereço escrito)')}${e.ref?`<small>Ref.: ${esc(e.ref)}</small>`:''}${!e.dest?`<small class="e50-falta">⚠️ sem localização no mapa — sem tempo estimado</small>`:''}</div></div>
    ${e.obs?`<div class="e50-obs"><i class="ti ti-note"></i> ${esc(e.obs)}</div>`:''}
    <div class="e50-chips">${eta}${cobra}${sinal}${e.pedido?`<span class="e50-chip"><i class="ti ti-world"></i> Pedido #${esc(e.pedido)}</span>`:''}${e.status==='nao_entregue'&&e.motivo?`<span class="e50-chip ruim">${esc(e.motivo)}</span>`:''}${ent50AvisoChip(e)}</div>
    <div class="e50-acoes">
      ${e.status==='aguardando' ? `<button class="e50-mini" onclick="ent50Copiar('${e.link}','🔗 Link da cliente copiado')"><i class="ti ti-link"></i> Link da cliente</button>${e.whatsUrl?`<a class="e50-mini zap" href="${e.whatsUrl}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Mandar link</a>`:''}<button class="e50-mini" onclick="ent50Editar('${e.id}')"><i class="ti ti-pencil"></i> Editar</button>${(adm||e.criadoPor?.eid===eu)?`<button class="e50-mini" data-e50="${e.id}-cancelar" onclick="ent50Simples('${e.id}','cancelar')"><i class="ti ti-x"></i> Cancelar</button>`:''}` : ''}
      ${e.status==='a_caminho' && !minha ? `<button class="e50-mini" onclick="ent50Copiar('${e.link}','🔗 Link da cliente copiado')"><i class="ti ti-link"></i> Link da cliente</button><a class="e50-mini" href="${e.link}" target="_blank" rel="noopener"><i class="ti ti-eye"></i> Ver como a cliente</a>${adm?`<button class="e50-mini" data-e50="${e.id}-entregue" onclick="ent50Simples('${e.id}','entregue','Marcar como entregue pela administração?')"><i class="ti ti-check"></i> Marcar entregue</button><button class="e50-mini" data-e50="${e.id}-voltar" onclick="ent50Simples('${e.id}','voltar','Voltar esta entrega para \\'Para sair\\'?')"><i class="ti ti-arrow-back-up"></i> Voltar</button>`:''}` : ''}
      ${e.status==='a_caminho' && minha ? `<span class="suave" style="font-size:12.5px">Esta está na sua rota (acima)</span>` : ''}
      ${e.status==='nao_entregue' ? `<button class="e50-mini" data-e50="${e.id}-voltar" onclick="ent50Simples('${e.id}','voltar','Tentar de novo? A entrega volta para \\'Para sair\\'.')"><i class="ti ti-refresh"></i> Tentar de novo</button>` : ''}
      ${e.status==='entregue' && adm ? `<a class="e50-mini" href="${e.link}" target="_blank" rel="noopener"><i class="ti ti-eye"></i> Link da cliente</a>` : ''}
    </div>
  </article>`;
}
function ent50AvisoChip(e){
  const a = e.avisos?.saiu; if(!a || e.status==='aguardando') return '';
  return a.ok ? `<span class="e50-chip ok"><i class="ti ti-brand-whatsapp"></i> link enviado ${ent50Hora(a.t)}</span>` : (ent50Adm() ? `<span class="e50-chip"><i class="ti ti-brand-whatsapp"></i> ${esc(a.erro||'não enviado')}</span>` : '');
}
function ent50BarraSair(aguard){
  const n = aguard.filter(e=>ENT50.marcadas[e.id]).length;
  return `<div class="e50-barra">
    ${n ? `<button class="e50-btn verde" onclick="ent50Sair()"><i class="ti ti-motorbike"></i> Sair para entrega (${n})</button>` : `<button class="e50-btn" disabled>Toque nas entregas que vai levar</button>`}
    ${aguard.length > 1 ? `<button class="e50-mini" onclick="${aguard.map(e=>`ENT50.marcadas['${e.id}']=true;`).join('')}ent50Repintar()">Marcar todas</button>` : ''}
  </div>`;
}
function ent50RotaTela(minhas){
  const G = ENT50.gps, p = minhas[0], d = p.dest;
  const gpsOk = G.watch!=null && G.ult && Date.now()-G.ult.t < 60e3 && !G.erro;
  const gps = G.erro ? `<div class="e50-gps ruim" onclick="ent50GpsDesligar();ent50GpsLigar();ent50Repintar()"><i class="ti ti-map-pin-off"></i><div><b>${esc(G.erro)}</b><small>Toque para tentar de novo. Sem a localização a cliente não vê a moto.</small></div></div>`
    : gpsOk ? `<div class="e50-gps ok"><span class="e50-radar"></span><div><b>Localização ligada${G.enviadoEm ? ' · enviada ' + ent50Ha(G.enviadoEm) : ''}</b><small>${G.wake ? '☀️ Tela vai ficar acesa. ' : ''}Deixe o portal aberto no suporte da moto até terminar.</small></div></div>`
    : `<div class="e50-gps" onclick="ent50GpsLigar();ent50Repintar()"><i class="ti ti-gps"></i><div><b>Ligando a localização…</b><small>Se o celular perguntar, toque em <b>Permitir</b>.</small></div></div>`;
  const nav = d ? `<a class="e50-nav" href="https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving" target="_blank" rel="noopener"><i class="ti ti-brand-google-maps"></i> Google Maps</a><a class="e50-nav" href="https://waze.com/ul?ll=${d.lat},${d.lng}&navigate=yes" target="_blank" rel="noopener"><i class="ti ti-brand-waze"></i> Waze</a>`
    : `<a class="e50-nav" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.endereco||'')+', Rio Branco')}" target="_blank" rel="noopener"><i class="ti ti-brand-google-maps"></i> Abrir no mapa</a>`;
  return `<section class="e50-rota">
    ${gps}
    <div class="e50-prox">
      <small class="e50-sup">PRÓXIMA PARADA${minhas.length>1?` · 1 de ${minhas.length}`:''}</small>
      <div class="e50-prox-t"><div><b>${esc(p.cliente)}</b><span>${esc(p.endereco||'')}</span>${p.ref?`<span class="ref">Ref.: ${esc(p.ref)}</span>`:''}</div>
        ${p.etaSeg?`<div class="e50-prox-eta"><b>${ent50Min(p.etaSeg)}</b><small>${p._m!=null?ent50Km(p._m):'chega '+ent50Hora(Date.now()+p.etaSeg*1000)}</small></div>`:''}</div>
      ${p.cobrar?.valor && p.cobrar.forma!=='pago' ? `<div class="e50-cobrar"><i class="ti ti-cash"></i> Cobrar <b>${brl2(p.cobrar.valor)}</b> no ${esc(ent50Forma(p.cobrar.forma))}</div>` : ''}
      ${p.obs?`<div class="e50-obs"><i class="ti ti-note"></i> ${esc(p.obs)}</div>`:''}
      <div class="e50-navs">${nav}${p.telVisivel?`<a class="e50-nav" href="tel:+${p.tel}"><i class="ti ti-phone"></i> Ligar</a><a class="e50-nav zap" href="https://wa.me/${p.tel}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> WhatsApp</a>`:''}</div>
      <div class="e50-fim">
        <button class="e50-btn verde" data-e50="${p.id}-entregue" onclick="ent50Entreguei('${p.id}')"><i class="ti ti-circle-check"></i> Entreguei</button>
        <button class="e50-mini" data-e50="${p.id}-nao_entregue" onclick="ent50NaoConsegui('${p.id}')"><i class="ti ti-alert-triangle"></i> Não consegui</button>
      </div>
    </div>
    ${minhas.length>1 ? `<div class="e50-depois"><small class="e50-sup">DEPOIS</small>${minhas.slice(1).map((e,i)=>`<div class="e50-dep"><span class="n">${i+2}</span><div class="t"><b>${esc(e.cliente)}</b><small>${esc(e.endereco||'')}${e.etaSeg?' · ~'+ent50Min(e.etaSeg):''}</small></div><button class="e50-mini" title="Fazer esta primeiro" onclick="ent50Agir('${e.id}','ordem',{para:'primeiro'}).then(()=>ent50Carregar(true))"><i class="ti ti-arrow-bar-to-up"></i> Fazer agora</button></div>`).join('')}</div>` : ''}
  </section>`;
}
function ent50NovoTela(e){
  return `<section class="e50-novo">
    <div class="e50-novo-t"><span>🔗</span><div><b>Entrega #${e.num} cadastrada!</b><small>Mande o link para ${esc(e.cliente.split(' ')[0])} acompanhar. Quando a motogirl sair, ${ENT50.d?.whatsAuto?'o link vai sozinho pelo WhatsApp da loja':'mande de novo (ou agora mesmo)'}.</small></div><button class="e50-x" onclick="ENT50.novo=null;ent50Repintar()"><i class="ti ti-x"></i></button></div>
    <div class="e50-link"><code>${esc(e.link)}</code></div>
    <div class="e50-acoes"><button class="e50-mini" onclick="ent50Copiar('${e.link}','🔗 Link copiado')"><i class="ti ti-copy"></i> Copiar link</button>${e.whatsUrl?`<a class="e50-mini zap" href="${e.whatsUrl}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Mandar no WhatsApp</a>`:''}<a class="e50-mini" href="${e.link}" target="_blank" rel="noopener"><i class="ti ti-eye"></i> Ver como a cliente</a></div>
  </section>`;
}
function ent50AvisarTela(){
  const L_ = (ENT50.avisar||[]).map(id=>(ENT50.d?.lista||[]).find(e=>e.id===id)).filter(e=>e && e.status==='a_caminho' && e.whatsUrl);
  if(!L_.length){ ENT50.avisar = []; return ''; }
  return `<section class="e50-novo zap">
    <div class="e50-novo-t"><span>💬</span><div><b>Avise ${L_.length===1?'a cliente':'as clientes'} que você saiu</b><small>Toque para abrir o WhatsApp com a mensagem e o link prontos.</small></div><button class="e50-x" onclick="ENT50.avisar=[];ent50Repintar()"><i class="ti ti-x"></i></button></div>
    <div class="e50-acoes">${L_.map(e=>`<a class="e50-mini zap" href="${e.whatsUrl}" target="_blank" rel="noopener" onclick="ENT50.avisar=ENT50.avisar.filter(x=>x!=='${e.id}');setTimeout(ent50Repintar,400)"><i class="ti ti-brand-whatsapp"></i> ${esc(e.cliente.split(' ')[0])}</a>`).join('')}</div>
  </section>`;
}
function ent50FormTela(){
  const F = ENT50.form, B = ENT50.busca, v = k => esc(F[k]==null?'':F[k]);
  const fonte = {busca:'pelo endereço', link:'pelo link', gps:'localização atual', mapa:'marcado no mapa'}[F.fonte] || '';
  return `<section class="e50-form">
    <div class="e50-form-t"><b>${F.id?'Editar entrega':'Nova entrega'}</b><button class="e50-x" onclick="ENT50.form=null;render()"><i class="ti ti-x"></i></button></div>
    <div class="e50-grade">
      <label>Nome da cliente *<input class="inp" id="e50-cli" value="${v('cliente')}" oninput="ent50F('cliente',this.value)" placeholder="Ex.: Maria Souza" autocomplete="off"></label>
      <label>WhatsApp da cliente<input class="inp" id="e50-tel" value="${v('tel')}" oninput="ent50F('tel',this.value)" placeholder="${F.telOculto?'(já cadastrado — deixe vazio para manter)':'(68) 9 9999-9999'}" inputmode="tel" autocomplete="off"></label>
      <label class="larga">Endereço *<span class="e50-linha"><input class="inp" id="e50-end" value="${v('endereco')}" oninput="ent50F('endereco',this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();ent50Buscar()}" placeholder="Rua, número, bairro" autocomplete="off"><button class="e50-mini" onclick="ent50Buscar()"><i class="ti ti-search"></i> Achar no mapa</button></span></label>
      <label class="larga">Ponto de referência<input class="inp" id="e50-ref" value="${v('ref')}" oninput="ent50F('ref',this.value)" placeholder="Ex.: portão preto, ao lado da farmácia"></label>
    </div>
    <div class="e50-loc">
      <b><i class="ti ti-map-pin"></i> Onde entregar no mapa ${F.lat!=null?`<span class="e50-chip ok">✔ ${fonte}</span>`:'<span class="e50-chip">ainda sem ponto</span>'}</b>
      <small>Busque pelo endereço, cole o link de localização que a cliente mandou no WhatsApp, ou toque no mapa. Dá para arrastar o 📍.</small>
      ${B.carregando ? '<div class="e50-busca"><span class="giro">⏳</span> Procurando…</div>' : B.r ? (B.r.length ? `<div class="e50-busca">${B.r.length>1?'<small>Qual destes?</small>':''}${B.r.map(x=>`<button class="e50-mini" onclick="ent50Pino(${x.lat},${x.lng},'busca');ent50Repintar()"><i class="ti ti-map-pin"></i> ${esc(x.nome)}</button>`).join('')}</div>` : `<div class="e50-busca ruim">Não achei esse endereço no mapa — cole o link da cliente ou toque no mapa onde é.</div>`) : ''}
      <span class="e50-linha"><input class="inp" id="e50-local" value="${v('local')}" oninput="ent50F('local',this.value)" placeholder="Cole o link (maps.app.goo.gl…, google.com/maps…)" autocomplete="off"><button class="e50-mini" onclick="ent50Link()"><i class="ti ti-clipboard"></i> Usar link</button><button class="e50-mini" onclick="ent50AquiAgora()" title="Estou no local"><i class="ti ti-current-location"></i> Estou aqui</button></span>
      <div id="e50-fmapa-slot"></div>
    </div>
    <div class="e50-grade">
      <label>Cobrar na entrega<span class="e50-linha"><select class="inp" id="e50-forma" onchange="ent50F('forma',this.value);ent50Repintar()">${ENT50_FORMAS.map(([k,n])=>`<option value="${k}" ${F.forma===k?'selected':''}>${n}</option>`).join('')}</select>${F.forma!=='pago'?`<input class="inp" id="e50-valor" value="${v('valor')}" oninput="ent50F('valor',this.value)" placeholder="R$ 0,00" inputmode="decimal">`:''}</span></label>
      <label>Pedido do site (nº)<input class="inp" id="e50-ped" value="${v('pedido')}" oninput="ent50F('pedido',this.value)" placeholder="opcional" inputmode="numeric"></label>
      <label class="larga">Observação para a motogirl<textarea class="inp" id="e50-obs" rows="2" oninput="ent50F('obs',this.value)" placeholder="Ex.: entregar só para ela, ligar antes de chegar">${v('obs')}</textarea></label>
    </div>
    <p class="suave" style="font-size:12.5px;margin:4px 0 10px">🔒 Não escreva o que é o pedido — a entrega é discreta.</p>
    <div class="e50-acoes"><button class="e50-btn" ${ENT50.salvando?'disabled':''} onclick="ent50Salvar()"><i class="ti ti-${ENT50.salvando?'loader-2 giro':'device-floppy'}"></i> ${F.id?'Salvar':'Cadastrar entrega'}</button><button class="e50-mini" onclick="ENT50.form=null;render()">Cancelar</button></div>
  </section>`;
}
/* administração: ajustes + relatório */
function ent50AdmTela(){
  const c = ENT50.d?.cfg || {}, R = ENT50.rel;
  return `<section class="e50-adm">
    <details ${ENT50.ajustes?'open':''} ontoggle="ENT50.ajustes=this.open"><summary><i class="ti ti-settings"></i> Ajustes das entregas</summary>
      <div class="e50-ajustes">
        ${[['avisarCliente','Mandar o link no WhatsApp da cliente quando a moto sair'],['avisarChegando','Avisar a cliente quando a moto estiver chegando'],['avisarEntregue','Mensagem de "Entregue" com agradecimento']].map(([k,n])=>`<label class="e50-tog"><input type="checkbox" ${c[k]?'checked':''} onchange="ent50Cfg({${k}:this.checked})"><span></span>${n}</label>`).join('')}
        <p class="suave" style="font-size:12.5px;margin:0">${ENT50.d?.whatsAuto?'✅ WhatsApp automático ligado (sai do número da loja).':'⏳ O envio automático liga quando a chave da Evolution API (EVOLUTION_KEY) estiver no motor. Até lá a motogirl manda pelo botão do WhatsApp, com a mensagem pronta.'}</p>
        <label class="e50-linha" style="align-items:center">Tempo de cada parada <input class="inp" style="flex:0 0 80px;min-width:0;max-width:80px" type="number" min="0" max="20" value="${c.paradaMin??3}" onchange="ent50Cfg({paradaMin:this.value})"> min</label>
        <div><b>Ponto de saída:</b> ${esc(c.loja?.nome||'Loja Bosque')} ${c.loja?.definido?'<span class="e50-chip ok">✔ conferido</span>':'<span class="e50-chip cobra">aproximado</span>'}
          <button class="e50-mini" onclick="ent50LojaAqui()"><i class="ti ti-current-location"></i> Estou na loja — usar minha localização</button></div>
      </div>
    </details>
    <details ${R?'open':''} ontoggle="if(this.open&&!ENT50.rel)ent50Rel()"><summary><i class="ti ti-chart-bar"></i> Relatório do mês</summary>
      ${!R ? '<p class="suave">Carregando…</p>' : `<div class="e50-numeros"><div><b>${R.entregues}</b><small>entregues</small></div><div><b>${R.mediaMin!=null?R.mediaMin+'<em>min</em>':'—'}</b><small>tempo médio</small></div><div><b>${R.naoEntregues}</b><small>não entregues</small></div><div><b>${brl(R.cobrado)}</b><small>cobrado na entrega</small></div></div>
        ${R.pessoas.length?`<div class="e50-rel">${R.pessoas.map(p=>`<div><b>🛵 ${esc(p.nome)}</b><span>${p.entregues} entregas${p.mediaMin!=null?' · média '+p.mediaMin+' min':''}</span></div>`).join('')}</div>`:''}
        ${R.dias.length?`<div class="e50-dias">${R.dias.map(d=>{ const mx = Math.max(...R.dias.map(x=>x.entregues)); return `<div title="${d.dia.slice(8)}/${d.dia.slice(5,7)}: ${d.entregues}"><i style="height:${Math.max(6,d.entregues/mx*100)}%"></i><small>${d.dia.slice(8)}</small></div>`; }).join('')}</div>`:''}`}
    </details>
  </section>`;
}
async function ent50Cfg(b){ try{ const r = await ent50Api('/api/entregas/config', b); if(ENT50.d) ENT50.d.cfg = {...ENT50.d.cfg, ...r.cfg}; toast('Salvo ✔'); ENT50.enquadrou = false; ent50Repintar(); }catch(e){ toast(e.message, true); } }
function ent50LojaAqui(){
  if(!('geolocation' in navigator)) return toast('Este aparelho não tem localização', true);
  toast('Pegando a localização…');
  navigator.geolocation.getCurrentPosition(p=>{ if(p.coords.accuracy > 150){ toast('Sinal impreciso ('+Math.round(p.coords.accuracy)+' m) — tente perto da porta', true); return; } ent50Cfg({loja:{lat:p.coords.latitude, lng:p.coords.longitude}}); }, ()=>toast('Não consegui a localização', true), {enableHighAccuracy:true, timeout:15000});
}
async function ent50Rel(){ try{ ENT50.rel = await ent50Api('/api/entregas/relatorio'); }catch(e){ toast(e.message, true); ENT50.rel = null; } ent50Repintar(); }

/* ───────── encaixe no portal (Vendas › Entregas) ───────── */
function ent50Grupos(){
  try{
    if(typeof MOD45_LISTA!=='undefined' && !MOD45_LISTA.some(x=>x.k==='entregas')){ const i = MOD45_LISTA.findIndex(x=>x.k==='site'); MOD45_LISTA.splice(i>=0?i+1:0, 0, {g:'Vendas', k:'entregas', n:'Entregas com moto', s:'Cadastrar entregas, sair com a moto e o link da cliente', ic:'ti-motorbike'}); }
    if(typeof GRUPOS_PORTAL!=='undefined'){ const g = GRUPOS_PORTAL.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('entregas')){ const i = g.k.indexOf('site'); g.k.splice((i>=0?i:g.k.indexOf('pdv'))+1, 0, 'entregas'); } NOMES12.portal.entregas = 'Entregas'; }
    if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='vendas'); if(a && !a.k.includes('entregas')){ const i = a.k.indexOf('site'); a.k.splice((i>=0?i:a.k.indexOf('pdv'))+1, 0, 'entregas'); } NOMES34.entregas = 'Entregas'; }
    if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('entregas')){ const i = g.k.indexOf('site'); g.k.splice((i>=0?i:g.k.indexOf('pdv'))+1, 0, 'entregas'); } if(typeof NOMES12!=='undefined') NOMES12.admin.entregas = 'Entregas'; }
  }catch(e){}
}
ent50Grupos();
const _telaPortalV50 = telaPortal;
telaPortal = function telaPortal(){
  ent50Grupos(); ent50PatchMais();
  if(S.portalTab==='entregas' && !ent50On()) S.portalTab = 'inicio';
  const aqui = S.portalTab === 'entregas', marca = '<!--e50-conteudo-->';
  let h;
  if(aqui){
    const orig = portalAtalhos; S.portalTab = 'atalhos'; portalAtalhos = () => marca;
    try{ h = _telaPortalV50.apply(this, arguments); } finally { portalAtalhos = orig; S.portalTab = 'entregas'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + ent50Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" style="flex:0 0 auto" onclick="S.portalTab='atalhos'`, `class="aba " style="flex:0 0 auto" onclick="S.portalTab='atalhos'`);
  } else h = _telaPortalV50.apply(this, arguments);
  if(!ent50On()) return h;
  const n = ent50Pend(), rota = ent50Minhas().length;
  const btn = `<button class="aba ${aqui?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='entregas';S.protoAberto=null;render()"><i class="ti ti-motorbike"></i> Entregas ${rota?`<span class="contador">🛵</span>`:n?`<span class="contador">${n}</span>`:''}</button>`;
  const a = h.indexOf(`onclick="S.portalTab='arena'`);
  if(a > 0){ const ini = h.lastIndexOf('<button', a); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
/* cartão no Início: quem está na rota volta para a rota; para sair, aviso */
const _portalInicioV50 = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioV50.apply(this, arguments);
  if(!ent50On() || !ENT50.d) return h;
  const minhas = ent50Minhas(), n = ent50Pend();
  let c = '';
  if(minhas.length) c = `<button class="e50-ini rota" onclick="S.portalTab='entregas';render()"><span class="ic">🛵</span><span class="t"><b>Você está em rota · ${minhas.length} ${minhas.length===1?'entrega':'entregas'}</b><small>Toque para voltar ao mapa — a cliente acompanha pelo link</small></span><i class="ti ti-chevron-right"></i></button>`;
  else if(n) c = `<button class="e50-ini" onclick="S.portalTab='entregas';ENT50.filtro='sair';render()"><span class="ic">📦</span><span class="t"><b>${n} ${n===1?'entrega esperando':'entregas esperando'} para sair</b><small>Sai da Loja Bosque · toque para ver</small></span><i class="ti ti-chevron-right"></i></button>`;
  if(!c) return h;
  const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
  return f >= 0 ? h.slice(0, f+6) + c + h.slice(f+6) : c + h;
};
function ent50PatchMais(){
  if(window._e50Mais) return; window._e50Mais = true;
  const base = portalMais;
  portalMais = function portalMais(){
    const g = typeof GRUPOS_PORTAL!=='undefined' ? GRUPOS_PORTAL.find(x=>x.k.includes('entregas')) : null, i = g ? g.k.indexOf('entregas') : -1;
    if(i >= 0) g.k.splice(i, 1);
    let h; try{ h = base.apply(this, arguments); } finally { if(i >= 0) g.k.splice(i, 0, 'entregas'); }
    if(!ent50On()) return h;
    const n = ent50Pend();
    const tile = `<button class="tile" style="--cor:var(--g-vendas)" onclick="S.portalTab='entregas';render()"><i class="ti ti-motorbike"></i><b>Entregas</b><small>${ent50Minhas().length?'Você está em rota':n?n+' para sair':'Moto e link da cliente'}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
    const a = h.indexOf('<div class="tiles">');
    return a >= 0 ? h.slice(0, a+19) + tile + h.slice(a+19) : tile + h;
  };
}
/* ───────── encaixe na Administração (Vendas › Entregas) ───────── */
const _telaAdminV50 = telaAdmin;
telaAdmin = function telaAdmin(){
  ent50Grupos();
  const A = S.adm, aqui = A.tab === 'entregas', marca = '<!--e50-adm-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV50.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'entregas'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + ent50Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV50.apply(this, arguments);
  const rota = (ENT50.d?.lista||[]).filter(e=>e.status==='a_caminho').length;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='entregas';TR=null;render()"><i class="ti ti-motorbike"></i> Entregas ${rota?`<span class="contador">${rota}</span>`:''}</button>`;
  h = h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
  return h;
};
const _itensBuscaV50 = typeof itensBusca==='function' ? itensBusca : null;
if(_itensBuscaV50) itensBusca = function itensBusca(){
  const r = _itensBuscaV50.apply(this, arguments), adm = ent50Adm();
  if(adm || (S.sess && ent50On())) r.unshift({t:'Entregas com moto', s:'Cadastrar entrega, mapa ao vivo e link da cliente', i:'ti-motorbike', go:()=>{ if(adm) S.adm.tab='entregas'; else { S.tela='portal'; S.portalTab='entregas'; } render(); }});
  return r;
};
/* depois de cada pintura do portal: encaixa os mapas */
const _renderV50 = render;
render = function(){ if(!ent50Aqui()) ENT50._ja = false; const r = _renderV50.apply(this, arguments); try{ ent50Encaixar(); }catch(e){ console.warn('entregas', e); } return r; };

/* atualiza sozinho: na tela a cada 10 s; em rota a cada 20 s; fora dela a cada 90 s */
setInterval(()=>{
  if(document.visibilityState!=='visible' || !ent50Logado() || !ent50On()) return;
  const idade = Date.now() - (ENT50.t||0), rota = ENT50.gps.watch!=null;
  if(ent50Aqui() ? idade > 9e3 : rota ? idade > 19e3 : idade > 89e3) ent50Carregar(true);
}, 5e3);
/* trocou de pessoa/perfil: começa do zero (e desliga a localização) */
let _e50Quem = '';
setInterval(()=>{
  const q = ent50Adm() ? 'adm' : (S.sess?.eid||''); if(q===_e50Quem) return;
  const era = _e50Quem; _e50Quem = q;
  if(!era && ENT50.d && (ENT50.d.eu || 'adm') === q) return;            // primeira vez e os dados já são desta pessoa
  ENT50.d = null; ENT50.t = 0; ENT50.marcadas = {}; ENT50.novo = null; ENT50.rel = null; _ent50Ult = null;
  if(era){ ENT50.form = null; ent50GpsDesligar(); }
  if(q) setTimeout(()=>ent50Carregar(true).then(()=>{ if(S.tela==='portal' && S.portalTab==='inicio') render(); }), 300);
}, 2e3);

/* ajuda (botão "Tirar dúvida") */
try{ if(typeof AJ46_GUIA!=='undefined' && Array.isArray(AJ46_GUIA) && !AJ46_GUIA.some(x=>x.id==='entregas')) AJ46_GUIA.push(
  {id:'entregas', t:'Fazer uma entrega com a moto', p:'entrega moto motogirl motoboy entregar rota link cliente acompanhar mapa localização gps', s:['Toque em "Entregas" e em "Nova entrega": nome, WhatsApp, endereço e "Achar no mapa" (ou cole o link de localização da cliente).','A motogirl toca nas entregas que vai levar e em "Sair para entrega".','Deixe o portal aberto no suporte da moto — é assim que a cliente vê a moto chegando.','Ao entregar, toque em "Entreguei" (ou "Não consegui", com o motivo).'], ir:'entregas'}); if(typeof AJ46_TELAS!=='undefined') AJ46_TELAS.entregas = 'Entregas'; }catch(e){}

document.head.insertAdjacentHTML('beforeend', `<style>
.e50-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 12px}
.e50-topo h2{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:6px 0 4px}.e50-topo h2 mark{background:linear-gradient(transparent 55%,rgba(227,16,31,.25) 55%);color:inherit;padding:0 2px}
.e50-topo p{color:var(--creme2);font-size:14px;max-width:640px;margin:0}
.e50-tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:800;letter-spacing:.04em;color:#E3101F;background:rgba(227,16,31,.08);border-radius:99px;padding:3px 10px}
.e50-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:16px;padding:13px 18px;font:inherit;font-weight:900;font-size:15px;background:#E3101F;color:#fff;cursor:pointer;box-shadow:0 6px 16px rgba(227,16,31,.28);transition:transform .15s var(--mola,ease),opacity .2s;text-decoration:none}
.e50-btn:hover:not(:disabled){transform:translateY(-2px)}.e50-btn:active:not(:disabled){transform:scale(.96)}
.e50-btn:disabled{background:#d9d4d6;box-shadow:none;cursor:default;font-weight:700;font-size:14px}
.e50-btn.verde{background:#1a7f4b;box-shadow:0 6px 16px rgba(26,127,75,.3)}.e50-btn.ind,.e50-mini.ind{opacity:.55}
.e50-mini{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--linha);background:#fff;border-radius:99px;padding:8px 13px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;color:var(--creme1,#1C1416);text-decoration:none;transition:transform .15s var(--mola,ease),border-color .2s}
.e50-mini:hover{transform:translateY(-1px);border-color:#E3101F}.e50-mini:active{transform:scale(.95)}
.e50-mini.zap{background:#25D366;border-color:#25D366;color:#fff}
.e50-x{border:0;background:transparent;font-size:20px;cursor:pointer;color:var(--creme3);padding:4px;border-radius:50%;transition:transform .2s}.e50-x:hover{transform:rotate(90deg)}
.e50-aviso{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--warn-bg,#fff7e6);color:var(--warn,#8a5a00);border-radius:14px;padding:9px 12px;font-size:13.5px;margin-bottom:10px}.e50-aviso.ruim{background:#fdecec;color:#b3261e}
.e50-numeros{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
.e50-numeros div{background:#fff;border:1px solid var(--linha);border-radius:16px;padding:10px 12px;box-shadow:var(--sh)}.e50-numeros b{display:block;font-size:24px;font-weight:900;letter-spacing:-.02em}.e50-numeros b em{font-style:normal;font-size:13px;margin-left:2px;color:var(--creme3)}.e50-numeros small{color:var(--creme3);font-size:12px}
.e50-mapa-box{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--linha);box-shadow:var(--sh);margin-bottom:12px;background:#e9e5e6}
.e50-mapa{height:min(46vh,380px);width:100%}.e50-fmapa{height:240px;width:100%;border-radius:14px;margin-top:8px;border:1px solid var(--linha)}
.e50-centro{position:absolute;right:10px;bottom:24px;z-index:500;width:40px;height:40px;border-radius:12px;border:0;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.2);font-size:20px;cursor:pointer}
.e50-sem{padding:40px 16px;text-align:center;color:var(--creme2)}
.e50-pin{position:relative;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:18px;background:#fff;border:2px solid #15100D;box-shadow:0 3px 10px rgba(0,0,0,.25)}
.e50-pin b{position:absolute;left:50%;top:36px;transform:translateX(-50%);white-space:nowrap;background:#15100D;color:#fff;font-size:11px;font-weight:800;border-radius:99px;padding:2px 8px}
.e50-pin.moto{background:#E3101F;border-color:#fff;width:40px;height:40px;font-size:22px;animation:e50Pulso 2s infinite}
.e50-pin.loja{background:#15100D;border-color:#F5B524}.e50-pin.dest{background:#F5B524;border-color:#fff}.e50-pin.dest.on{background:#fff;border-color:#E3101F}.e50-pin.dest.on b{top:-20px;background:#E3101F}
.e50-pin.dest.ok{background:#1a7f4b;color:#fff;border-color:#fff;font-size:15px}.e50-pin.novo{background:#E3101F;border-color:#fff}
.e50-filtros{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}
.e50-filtros button{flex:none;display:flex;align-items:center;gap:6px;border:1px solid var(--linha);background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;color:var(--creme2);transition:transform .15s var(--mola,ease)}
.e50-filtros button:active{transform:scale(.95)}.e50-filtros button.on{background:#15100D;color:#fff;border-color:#15100D}.e50-filtros button.pulsa:not(.on){animation:e50Borda 1.8s ease-in-out infinite}
.e50-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:12px}
.e50-card{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:12px 14px 12px 18px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;animation:e50Sobe .35s both;transition:border-color .2s,transform .15s var(--mola,ease)}
.e50-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--c)}
.e50-card.marc{border-color:#1a7f4b;box-shadow:0 0 0 2px rgba(26,127,75,.35)}
.e50-card header{display:flex;gap:10px;align-items:center}.e50-card header.toca{cursor:pointer}.e50-card header.toca:active{transform:scale(.98)}
.e50-ck{width:28px;height:28px;border-radius:9px;border:2px solid #ccc;display:grid;place-items:center;color:transparent;flex:none;transition:all .2s var(--mola,ease)}
.e50-card.marc .e50-ck{background:#1a7f4b;border-color:#1a7f4b;color:#fff;transform:scale(1.08)}
.e50-st{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font-size:17px;flex:none}
.e50-card .t{flex:1;min-width:0}.e50-card .t b{display:block;font-size:15.5px}.e50-card .t small{color:var(--creme3);font-size:12.5px}
.e50-ord{font-size:11px;font-weight:800;color:#E3101F;background:rgba(227,16,31,.08);border-radius:99px;padding:1px 7px;margin-left:4px}
.e50-num{font-weight:900;color:var(--creme3);font-size:13px}
.e50-end{display:flex;gap:8px;font-size:14px;line-height:1.35}.e50-end i{color:#E3101F;margin-top:2px}.e50-end small{display:block;color:var(--creme3);font-size:12.5px}.e50-end .e50-falta{color:#8a5a00}
.e50-obs{font-size:13px;background:#FFF4D6;border-radius:12px;padding:6px 10px}
.e50-chips{display:flex;gap:6px;flex-wrap:wrap}.e50-chips:empty{display:none}
.e50-chip,.e50-eta{display:inline-flex;align-items:center;gap:4px;background:var(--noite,#f6f3f4);border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700}
.e50-eta{background:#E3101F;color:#fff}.e50-chip.cobra{background:#FFF4D6;color:#8a5a00}.e50-chip.ok{background:#E7F8EE;color:#127a43}.e50-chip.ruim{background:#fdecec;color:#b3261e}
.e50-acoes{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.e50-acoes:empty{display:none}
.e50-barra{position:sticky;bottom:0;z-index:20;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 0 6px;background:linear-gradient(transparent,var(--noite,#F3F1F2) 35%);margin-top:6px}.e50-barra .e50-btn{flex:1;min-width:220px}
@media(max-width:640px){.e50-barra{bottom:64px}}
.e50-rota{background:linear-gradient(160deg,#15100D,#3a0d10 70%,#5c0d14);color:#fff;border-radius:24px;padding:14px;margin-bottom:12px;box-shadow:0 12px 30px rgba(21,16,13,.35);animation:e50Sobe .35s both}
.e50-gps{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.1);border-radius:16px;padding:10px 12px;cursor:pointer;margin-bottom:10px}.e50-gps b{display:block;font-size:14px}.e50-gps small{opacity:.85;font-size:12.5px}.e50-gps i{font-size:22px}
.e50-gps.ok{background:rgba(37,211,102,.16)}.e50-gps.ruim{background:rgba(227,16,31,.35);animation:e50Pisca 1.6s infinite}
.e50-radar{width:14px;height:14px;border-radius:50%;background:#25D366;flex:none;box-shadow:0 0 0 0 rgba(37,211,102,.6);animation:e50Radar 1.6s infinite}
.e50-sup{font-size:10.5px;letter-spacing:.12em;font-weight:800;opacity:.7}
.e50-prox{background:#fff;color:#1C1416;border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:9px}
.e50-prox .e50-sup{color:#E3101F;opacity:1}
.e50-prox-t{display:flex;gap:12px;align-items:flex-start}.e50-prox-t>div:first-child{flex:1;min-width:0}.e50-prox-t b{display:block;font-size:20px;font-weight:900;letter-spacing:-.02em}.e50-prox-t span{display:block;font-size:14.5px;line-height:1.35}.e50-prox-t .ref{color:var(--creme3);font-size:13px}
.e50-prox-eta{text-align:center;background:#E3101F;color:#fff;border-radius:16px;padding:8px 12px;flex:none}.e50-prox-eta b{font-size:22px}.e50-prox-eta small{font-size:11.5px;opacity:.9}
.e50-cobrar{background:#FFF4D6;border:2px dashed #F5B524;border-radius:14px;padding:8px 12px;font-size:15px}
.e50-navs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px}
.e50-nav{display:flex;align-items:center;justify-content:center;gap:6px;background:var(--noite,#f3f0f1);border-radius:14px;padding:11px 8px;font-weight:800;font-size:14px;color:#1C1416;text-decoration:none;transition:transform .15s var(--mola,ease)}.e50-nav:active{transform:scale(.95)}.e50-nav.zap{background:#25D366;color:#fff}
.e50-fim{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.e50-fim .e50-btn{flex:1;min-width:180px;font-size:17px;padding:15px}
.e50-depois{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.e50-dep{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.08);border-radius:14px;padding:8px 10px}.e50-dep .n{width:26px;height:26px;border-radius:50%;background:#F5B524;color:#15100D;font-weight:900;display:grid;place-items:center;flex:none}.e50-dep .t{flex:1;min-width:0}.e50-dep b{display:block;font-size:14px}.e50-dep small{opacity:.8;font-size:12px}
.e50-novo{background:#fff;border:2px solid #1a7f4b;border-radius:20px;padding:12px 14px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;animation:e50Sobe .35s both}.e50-novo.zap{border-color:#25D366}
.e50-novo-t{display:flex;gap:10px;align-items:flex-start}.e50-novo-t>span{font-size:26px}.e50-novo-t>div{flex:1}.e50-novo-t b{display:block;font-size:15.5px}.e50-novo-t small{color:var(--creme2);font-size:13px}
.e50-link code{display:block;background:var(--noite,#f6f3f4);border-radius:12px;padding:8px 10px;font-size:12.5px;word-break:break-all}
.e50-form{background:#fff;border:1px solid var(--linha);border-radius:22px;padding:14px;box-shadow:var(--sh);margin-bottom:12px;animation:e50Sobe .35s both}
.e50-form-t{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.e50-form-t b{font-size:18px;font-weight:900}
.e50-grade{display:grid;grid-template-columns:1fr 1fr;gap:10px}.e50-grade label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:13px;color:var(--creme2)}.e50-grade .larga{grid-column:1/-1}
.e50-grade .inp,.e50-loc .inp{font-weight:500}
.e50-linha{display:flex;gap:6px;flex-wrap:wrap;align-items:stretch}.e50-linha .inp{flex:1;min-width:150px}
.e50-loc{background:var(--noite,#f8f6f7);border-radius:16px;padding:10px 12px;margin:10px 0;display:flex;flex-direction:column;gap:6px}.e50-loc>b{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.e50-loc>small{color:var(--creme3);font-size:12.5px}
.e50-busca{display:flex;flex-direction:column;gap:5px;align-items:flex-start}.e50-busca.ruim{color:#b3261e;font-size:13px}.e50-busca .e50-mini{text-align:left;border-radius:12px}
.e50-adm{margin-top:16px;display:flex;flex-direction:column;gap:10px}
.e50-adm details{background:#fff;border:1px solid var(--linha);border-radius:18px;padding:10px 14px}.e50-adm summary{cursor:pointer;font-weight:800;display:flex;gap:6px;align-items:center}
.e50-ajustes{display:flex;flex-direction:column;gap:10px;margin-top:10px;font-size:14px}
.e50-tog{display:flex;gap:10px;align-items:center;cursor:pointer}.e50-tog input{display:none}.e50-tog span{width:42px;height:24px;border-radius:99px;background:#ccc;position:relative;flex:none;transition:background .2s}.e50-tog span::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s var(--mola,ease)}.e50-tog input:checked+span{background:#1a7f4b}.e50-tog input:checked+span::after{transform:translateX(18px)}
.e50-rel{display:flex;flex-direction:column;gap:6px;margin:8px 0}.e50-rel div{display:flex;justify-content:space-between;gap:10px;background:var(--noite,#f6f3f4);border-radius:12px;padding:8px 12px;font-size:14px}
.e50-dias{display:flex;align-items:flex-end;gap:3px;height:90px;padding-top:6px}.e50-dias div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}.e50-dias i{display:block;width:100%;max-width:18px;background:#E3101F;border-radius:6px 6px 2px 2px;animation:e50Cresce .6s both}.e50-dias small{font-size:9.5px;color:var(--creme3)}
.e50-vazio{text-align:center;padding:30px 16px;color:var(--creme2)}.e50-vazio span{font-size:44px;display:inline-block;animation:e50Balanca 2.6s ease-in-out infinite}
.e50-rod{font-size:12.5px;margin-top:14px}
.e50-ini{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:0;font:inherit;cursor:pointer;background:linear-gradient(120deg,#15100D,#3a0d10 60%,#F5B524);color:#fff;border-radius:18px;padding:14px 16px;margin:12px 0;box-shadow:var(--sh);animation:e50Sobe .4s both;transition:transform .15s var(--mola,ease)}
.e50-ini.rota{background:linear-gradient(120deg,#15100D,#5c0d14 55%,#E3101F)}
.e50-ini:hover{transform:translateY(-2px)}.e50-ini:active{transform:scale(.98)}.e50-ini .ic{font-size:30px;animation:e50Anda 1.4s ease-in-out infinite}.e50-ini .t{flex:1}.e50-ini b{display:block;font-size:15.5px}.e50-ini small{opacity:.85;font-size:12.5px}
.e50-festa{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:9999;font-size:72px;display:flex;flex-direction:column;align-items:center;pointer-events:none;animation:e50Festa 1.5s var(--mola,ease) forwards}.e50-festa span{font-size:20px;font-weight:900;background:#1a7f4b;color:#fff;border-radius:99px;padding:6px 16px;margin-top:4px}
.e50 .giro,.e50-vazio .giro{display:inline-block;animation:e50Gira 1s linear infinite}
@keyframes e50Sobe{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes e50Pulso{0%{box-shadow:0 0 0 0 rgba(227,16,31,.5)}70%{box-shadow:0 0 0 14px rgba(227,16,31,0)}100%{box-shadow:0 0 0 0 rgba(227,16,31,0)}}
@keyframes e50Radar{0%{box-shadow:0 0 0 0 rgba(37,211,102,.6)}70%{box-shadow:0 0 0 10px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}
@keyframes e50Borda{0%,100%{border-color:var(--linha)}50%{border-color:#E3101F;color:#E3101F}}
@keyframes e50Pisca{0%,100%{opacity:1}50%{opacity:.75}}
@keyframes e50Balanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
@keyframes e50Anda{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
@keyframes e50Gira{to{transform:rotate(360deg)}}
@keyframes e50Cresce{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1);transform-origin:bottom}}
@keyframes e50Festa{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}70%{opacity:1;transform:translate(-50%,-55%) scale(1)}100%{opacity:0;transform:translate(-60%,-80%) scale(.9)}}
@media(max-width:640px){.e50-numeros{grid-template-columns:repeat(2,1fr)}.e50-grade{grid-template-columns:1fr}.e50-topo-b{width:100%}.e50-topo-b .e50-btn{width:100%}.e50-card{padding:11px 12px 11px 16px}}
.e50.quieto .e50-card,.e50.quieto .e50-form,.e50.quieto .e50-rota,.e50.quieto .e50-novo{animation:none}
@media(prefers-reduced-motion:reduce){.e50-pin.moto,.e50-radar,.e50-ini .ic,.e50-vazio span,.e50-filtros button.pulsa,.e50-gps.ruim{animation:none}}
</style>`);
