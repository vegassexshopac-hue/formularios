/* ═══════════ Portal Equipe Las Vegas · v24b — ATENDIMENTO · KOMMO (WhatsApp, Instagram…) ═══════════
   Equipe (Portal › Vendas › WhatsApp) e Administração (Visão geral › WhatsApp · Kommo):
   clientes esperando resposta, tempo de resposta, tarefas da Kommo em balões
   (Concluir / Remarcar / Repassar), funil e ficha da cliente, vendas ganhas por vendedora.
   Quem fala com a Kommo é o "motor" no Railway (portal-kommo-las-vegas), separado do robô.
   Discrição: nenhuma tela mostra mensagem, produto ou nota da conversa. */
const KOMMO_URL_FIXO = 'https://portal-kommo-las-vegas-production.up.railway.app';
const KM = { url: LS.get('lv_kommo_teste','') || KOMMO_URL_FIXO, tk:null, quem:null, exp:0, res:null, carregando:false, erro:'', sub:null, funil:null, funilId:null, tar:null, tarQuem:'', vend:null, tempo:null, cfg:null, t:0, timer:null };
(function(){
  const css = `
.km-hub{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.km-hub button{border:1px solid var(--linha2);background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;gap:6px;align-items:center;transition:transform .15s var(--mola),box-shadow .15s}
.km-hub button:hover{transform:translateY(-1px);box-shadow:var(--sh)}.km-hub button:active{transform:scale(.95)}
.km-hub button.on{background:var(--vermelho);color:#fff;border-color:var(--vermelho)}
.km-hub .contador{background:#fff;color:var(--vermelho)}.km-hub button:not(.on) .contador{background:var(--vermelho);color:#fff}
.km-topo{display:flex;align-items:center;gap:14px;background:linear-gradient(120deg,#0f5132,#1a7f4b 60%,#25D366);color:#fff;border-radius:20px;padding:14px 16px;margin-bottom:12px;position:relative;overflow:hidden;animation:kmSobe .35s var(--mola)}
.km-topo::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.14) 48%,transparent 60%);background-size:260% 100%;animation:kmBrilho 6s ease-in-out infinite;pointer-events:none}
.km-topo.alerta{background:linear-gradient(120deg,#7a0d18,#C8101C 60%,#ff4d5a)}
.km-topo .big{font-size:40px;font-weight:900;line-height:1;letter-spacing:-.03em;min-width:54px;text-align:center}
.km-topo b{display:block;font-size:15.5px}.km-topo small{opacity:.9;font-size:12.5px}
.km-topo .ic{font-size:30px;animation:kmBalanca 2.6s ease-in-out infinite}
.km-lista{display:grid;gap:8px}
.km-cli{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px 12px;animation:kmSobe .3s both;transition:transform .15s var(--mola),border-color .15s;cursor:pointer}
.km-cli:hover{transform:translateX(3px);border-color:var(--vermelho)}.km-cli:active{transform:scale(.98)}
.km-cli.minha{border-left:4px solid var(--vermelho)}
.km-cli .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;flex:none;background:#E7F8EE;color:#127a43}
.km-cli.atrasada .av{background:var(--vermelho-claro);color:var(--vermelho2);animation:kmPulsa 1.4s infinite}
.km-cli .av{position:relative}.km-selo{position:absolute;right:-4px;bottom:-4px;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-style:normal;border:2px solid #fff}
.km-cli .t{flex:1;min-width:0}.km-cli .t b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.km-cli .t small{color:var(--creme2);font-size:12.5px}
.km-tempo{font-weight:800;font-size:13px;border-radius:99px;padding:4px 10px;background:#E7F8EE;color:#127a43;white-space:nowrap}
.km-tempo.warn{background:var(--ouro-claro);color:#8a5a00}.km-tempo.bad{background:var(--vermelho-claro);color:var(--vermelho2)}
.km-ir{border:0;background:#25D366;color:#fff;border-radius:12px;width:38px;height:38px;display:grid;place-items:center;font-size:18px;cursor:pointer;flex:none;transition:transform .15s var(--mola)}
.km-ir:hover{transform:scale(1.08)}.km-ir:active{transform:scale(.92)}
.km-grupo{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--creme2);margin:14px 0 6px;display:flex;align-items:center;gap:6px}
.km-tar{background:#fff;border:1px solid var(--linha2);border-radius:18px;padding:12px 14px;animation:kmSobe .3s both;position:relative}
.km-tar.atrasada{border-color:#f3b4b8;background:linear-gradient(0deg,#fff,#fff6f6)}
.km-tar .tx{font-weight:700;font-size:14.5px;line-height:1.35}
.km-tar .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;font-size:12.5px;color:var(--creme2)}
.km-tar .acoes{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.km-tar .acoes button{border:0;border-radius:99px;padding:8px 13px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;display:flex;gap:5px;align-items:center;transition:transform .15s var(--mola)}
.km-tar .acoes button:hover{transform:translateY(-1px)}.km-tar .acoes button:active{transform:scale(.93)}
.km-b-ok{background:#1a7f4b;color:#fff}.km-b-2{background:var(--veludo2);color:var(--creme)}
.km-tar.saindo{animation:kmSai .45s forwards}
.km-kanban{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x proximity}
.km-col{flex:0 0 230px;background:var(--veludo2);border-radius:16px;padding:10px;scroll-snap-align:start;animation:kmSobe .35s both}
.km-col h4{margin:0 0 2px;font-size:13.5px;display:flex;justify-content:space-between;gap:6px}
.km-col h4 span{background:#fff;border-radius:99px;padding:1px 8px;font-size:12px}
.km-col .v{font-size:12px;color:var(--creme2);margin-bottom:8px}
.km-card{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--linha2);border-radius:12px;padding:8px 10px;margin-bottom:6px;font:inherit;cursor:pointer;transition:transform .15s var(--mola),border-color .15s;animation:kmSobe .3s both}
.km-card:hover{transform:translateY(-2px);border-color:var(--vermelho)}.km-card:active{transform:scale(.97)}
.km-card b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.km-card small{font-size:12px;color:var(--creme2)}
.km-card.minha{border-left:3px solid var(--vermelho)}
.km-card .zap{color:#127a43;font-weight:800}
.km-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px}
.km-kpi{background:#fff;border-radius:16px;padding:12px 14px;box-shadow:var(--sh);animation:kmSobe .4s both}
.km-kpi b{display:block;font-size:24px;letter-spacing:-.02em}.km-kpi small{color:var(--creme2);font-size:12.5px}
.km-barra{height:10px;border-radius:99px;background:var(--veludo2);overflow:hidden;margin-top:6px}
.km-barra i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#25D366,#1a7f4b);transform-origin:left;animation:kmCresce .9s var(--mola) both}
.km-tab{width:100%;border-collapse:collapse;font-size:13.5px}
.km-tab th{text-align:left;font-size:12px;color:var(--creme2);font-weight:700;padding:6px 8px;border-bottom:1px solid var(--linha2)}
.km-tab td{padding:9px 8px;border-bottom:1px solid var(--linha2)}
.km-ini{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.km-ini button{flex:1 1 150px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px 12px;font:inherit;text-align:left;cursor:pointer;animation:kmSobe .35s both;transition:transform .15s var(--mola)}
.km-ini button:hover{transform:translateY(-2px)}.km-ini button:active{transform:scale(.97)}
.km-ini b{display:block;font-size:20px;line-height:1}.km-ini small{color:var(--creme2);font-size:12px}
.km-ini .ic{font-size:22px}.km-ini .alerta{border-color:var(--vermelho);background:var(--vermelho-claro)}
.km-ini .alerta .ic{animation:kmBalanca 1.6s infinite}
.km-vazio{text-align:center;padding:26px 10px;color:var(--creme2)}
.km-vazio .em{font-size:44px;display:block;animation:kmFlutua 3s ease-in-out infinite}
@keyframes kmSobe{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes kmBrilho{0%,60%{background-position:120% 0}100%{background-position:-60% 0}}
@keyframes kmBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}
@keyframes kmPulsa{0%,100%{box-shadow:0 0 0 0 rgba(227,16,31,.45)}50%{box-shadow:0 0 0 7px rgba(227,16,31,0)}}
@keyframes kmSai{to{transform:translateX(40px) scale(.95);opacity:0;height:0;padding:0;margin:0}}
@keyframes kmCresce{from{transform:scaleX(0)}}
@keyframes kmFlutua{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.km-hero{background:linear-gradient(125deg,#0f5132,#17804a 55%,#22b864);color:#fff;border-radius:22px;padding:16px 18px;margin-bottom:12px;position:relative;overflow:hidden;animation:kmSobe .4s var(--mola)}
.km-hero.alerta{background:linear-gradient(125deg,#5e0a12,#b10f1c 55%,#ff4d5a)}
.km-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.13) 48%,transparent 60%);background-size:260% 100%;animation:kmBrilho 6s ease-in-out infinite;pointer-events:none}
.km-hero-l{display:flex;align-items:center;gap:14px}.km-hero-l b{display:block;font-size:17px}.km-hero-l small{opacity:.9;font-size:12.5px}
.km-big{font-size:54px;font-weight:900;line-height:1;letter-spacing:-.04em;min-width:70px}
.km-hero-k{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px;position:relative;z-index:1}
.km-hero-k div{background:rgba(255,255,255,.13);border-radius:14px;padding:9px 10px;backdrop-filter:blur(4px);animation:kmPop .5s var(--mola)}
@keyframes kmPop{from{transform:scale(.9)}to{transform:none}}
.km-hero-k div.quente{background:rgba(255,215,0,.22);box-shadow:inset 0 0 0 1.5px rgba(255,215,0,.6)}
.km-hero-k span{font-size:16px}.km-hero-k b{display:block;font-size:22px;line-height:1.1}.km-hero-k small{font-size:11.5px;opacity:.9}
.km-urg{display:flex;height:9px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.2);margin-top:14px;position:relative;z-index:1}
.km-urg i{display:block;height:100%;transform-origin:left;animation:kmCresce 1s var(--mola) both}
.km-urg i.ok,.km-urg-leg i.ok{background:#7CF0B5}.km-urg i.quase,.km-urg-leg i.quase{background:#FFD54A}.km-urg i.atr,.km-urg-leg i.atr{background:#fff}
.km-urg i.quase{animation-delay:.15s}.km-urg i.atr{animation-delay:.3s}
.km-urg-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:12px;opacity:.95;position:relative;z-index:1}.km-urg-leg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.km-barra2{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.km-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.km-chips button{flex:none;border:1px solid var(--linha2);background:#fff;border-radius:99px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;display:flex;gap:6px;align-items:center;transition:transform .15s var(--mola),background .15s}
.km-chips button span{background:var(--veludo2);border-radius:99px;padding:0 7px;font-size:12px}
.km-chips button.on{background:var(--creme);color:#fff;border-color:var(--creme)}.km-chips button.on span{background:rgba(255,255,255,.2)}
.km-chips button:hover{transform:translateY(-1px)}.km-chips button:active{transform:scale(.94)}
.km-vistas{display:flex;background:#fff;border:1px solid var(--linha2);border-radius:12px;padding:3px}
.km-vistas button{border:0;background:none;width:34px;height:30px;border-radius:9px;cursor:pointer;font-size:16px;color:var(--creme2);transition:background .15s}
.km-vistas button.on{background:var(--vermelho);color:#fff}
.km-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px;align-items:start}
.km-gcard,.km-row,.km-glist{min-width:0}.km-gcard{overflow:hidden}
.km-et{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.km-vivo{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--creme2)}
.km-vivo i.pt{width:8px;height:8px;border-radius:50%;background:#22b864;box-shadow:0 0 0 0 rgba(34,184,100,.6);animation:kmVivo 1.6s infinite}
.km-vivo.carregando i.pt{background:#F5B524}
@keyframes kmVivo{0%{box-shadow:0 0 0 0 rgba(34,184,100,.6)}70%{box-shadow:0 0 0 8px rgba(34,184,100,0)}100%{box-shadow:0 0 0 0 rgba(34,184,100,0)}}
.km-gcard{background:#fff;border-radius:20px;box-shadow:var(--sh);padding:12px;animation:kmSobe .45s var(--mola) both;border:1px solid transparent}
.km-gcard.sem{background:linear-gradient(180deg,#FFF7E0,#fff 70px);border-color:#F5D27A}
.km-gcard.eu{border-color:var(--vermelho);box-shadow:0 8px 26px rgba(227,16,31,.14)}
.km-gcard header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.km-gcard header b{display:block;font-size:15px}.km-gcard header b em{font-style:normal;font-size:11px;background:var(--vermelho);color:#fff;border-radius:99px;padding:1px 7px;margin-left:4px;vertical-align:2px}
.km-gcard header small{color:var(--creme2);font-size:12.5px}.km-gcard .neg{color:var(--vermelho2);font-weight:700}
.km-gav{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;background:conic-gradient(var(--vermelho) calc(var(--p)*1%),#E7F8EE 0);position:relative;flex:none}
.km-gav::before{content:'';position:absolute;inset:4px;border-radius:50%;background:#fff;z-index:0}.km-gav{isolation:isolate}.km-gav{color:var(--creme)}
.km-gav{z-index:0}.km-gcard header .km-gav{font-size:14px}
.km-gav > *{position:relative}
.km-gn{font-size:24px;font-weight:900;color:var(--creme);min-width:30px;text-align:right}
.km-glist,.km-lista2{display:grid;gap:6px}
.km-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:14px;background:var(--veludo2);cursor:pointer;animation:kmEntra .35s var(--mola) both;transition:transform .15s var(--mola),background .15s,box-shadow .15s;position:relative}
.km-lista2 .km-row{background:#fff;border:1px solid var(--linha2)}
.km-row:hover{transform:translateX(3px);background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.07)}.km-row:active{transform:scale(.98)}
.km-row.minha{box-shadow:inset 3px 0 0 var(--vermelho)}
.km-row.nova{animation:kmEntra .35s var(--mola) both,kmFlash 1.6s .2s 2}
.km-cn{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:#fff;font-size:18px;flex:none}
.km-row.atrasada .km-cn{animation:kmPulsa 1.4s infinite}
.km-rt{flex:1;min-width:0}.km-rt b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.km-rt small{display:flex;flex-wrap:wrap;gap:4px 8px;font-size:11.5px;color:var(--creme2);margin-top:1px}
.km-et{background:#fff;border:1px solid var(--linha2);border-radius:99px;padding:0 7px;color:var(--creme)}
.km-tag{background:#E8F0FF;color:#2453b5;border-radius:99px;padding:0 7px;font-weight:700}
.km-prog{height:4px;border-radius:99px;background:rgba(0,0,0,.07);margin-top:6px;overflow:hidden}
.km-prog i{display:block;height:100%;border-radius:99px;background:#22b864;transform-origin:left;animation:kmCresce .9s var(--mola) both}
.km-prog.warn i{background:#F5B524}.km-prog.bad i{background:var(--vermelho)}
.km-rr{display:flex;flex-direction:column;align-items:flex-end;gap:2px}.km-rr small{font-size:10.5px;color:var(--creme3);text-transform:uppercase;letter-spacing:.04em}
.km-mais{width:100%;margin-top:6px;border:1px dashed var(--linha2);background:none;border-radius:12px;padding:7px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;color:var(--creme2)}
.km-mais:hover{background:var(--veludo2)}
.km-hq,.km-hq .km-hero-k div,.km-hq .km-urg i,.km-quieto .km-row:not(.nova),.km-quieto .km-gcard,.km-quieto .km-prog i{animation:none}
@keyframes kmEntra{from{transform:translateY(8px) scale(.98);opacity:0}to{transform:none;opacity:1}}
@keyframes kmFlash{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}50%{box-shadow:0 0 0 4px rgba(37,211,102,.45)}}
@media(max-width:700px){.km-hero-k{grid-template-columns:repeat(3,1fr)}.km-hero-k div:nth-child(n+4){display:none}.km-big{font-size:44px;min-width:56px}.km-grade{grid-template-columns:1fr}.km-rt small span:nth-child(n+4){display:none}}
@media(prefers-reduced-motion:reduce){.km-hero::after,.km-row,.km-row.nova,.km-row.atrasada .km-cn,.km-urg i,.km-prog i{animation:none}}
@media(prefers-reduced-motion:reduce){.km-topo::after,.km-topo .ic,.km-cli.atrasada .av,.km-vazio .em{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ───────── conexão com o motor ───────── */
function kmQuem(){ return S.tela==='admin' && S.adm ? 'admin' : S.sess?.eid ? 'eq:'+S.sess.eid : null; }
async function kmEntrar(){
  const q = kmQuem(); if(!q) throw new Error('Entre no portal primeiro');
  if(KM.tk && KM.quem===q && KM.exp > Date.now()+60e3) return;
  const g = LS.get('lv_km_'+q); if(g && g.exp > Date.now()+60e3){ Object.assign(KM, {tk:g.tk, quem:q, exp:g.exp}); return; }
  const corpo = q==='admin' ? S.adm.cred : {eid:S.sess.eid, ...S.sess.cred};
  const r = await fetch(KM.url+'/api/sessao', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(corpo)});
  const j = await r.json().catch(()=>({ok:false, erro:'O motor da Kommo não respondeu'}));
  if(!j.ok) throw new Error(j.erro || 'Não consegui entrar na Kommo');
  Object.assign(KM, {tk:j.token, quem:q, exp:j.exp}); LS.set('lv_km_'+q, {tk:j.token, exp:j.exp});
}
async function kmApi(p, corpo, tentou){
  await kmEntrar();
  let r;
  try{ r = await fetch(KM.url+p, {method:corpo?'POST':'GET', headers:{Authorization:'Bearer '+KM.tk, ...(corpo?{'Content-Type':'application/json'}:{})}, body:corpo?JSON.stringify(corpo):undefined}); }
  catch(e){ throw new Error('Sem conexão com o motor da Kommo'); }
  const j = await r.json().catch(()=>({ok:false, erro:'Resposta estranha do motor'}));
  if(r.status===401 && !tentou){ LS.del('lv_km_'+KM.quem); KM.tk=null; return kmApi(p, corpo, true); }
  if(!j.ok) throw new Error(j.erro || 'Erro na Kommo');
  return j;
}
function kmSair(){ ['admin', S.sess?.eid && 'eq:'+S.sess.eid].filter(Boolean).forEach(q=>LS.del('lv_km_'+q)); Object.assign(KM, {tk:null, quem:null, res:null, funil:null, tar:null, vend:null, tempo:null, cfg:null}); }
const _sairV24 = typeof sair==='function' ? sair : null;
if(_sairV24) sair = function sair(){ kmSair(); return _sairV24.apply(this, arguments); };

async function kmCarregar(forcar){
  const q = kmQuem(); if(!q) return;
  if(KM.quem && KM.quem!==q){ KM.res=null; KM.funil=null; KM.tar=null; KM.vend=null; KM.tempo=null; KM.cfg=null; }
  if(KM.carregando || (!forcar && KM.res && Date.now()-KM.t < 12e3)) return;
  KM.carregando = true;
  try{ KM.res = await kmApi('/api/resumo'); KM.erro=''; KM.t = Date.now(); KM.tar = KM.res.tarefas?.itens ? KM.res.tarefas : KM.tar; }
  catch(e){ KM.erro = e.message; }
  finally{ KM.carregando = false; }
  kmRepintar();
}
function naTelaKm(){ return (S.tela==='portal' && S.portalTab==='whats') || (S.tela==='admin' && S.adm?.tab==='whats'); }
function kmRepintar(){ if(typeof modalAberto==='function' && modalAberto()) return; const ae = document.activeElement; if(ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return; if(naTelaKm() || (S.tela==='portal' && S.portalTab==='inicio')) render(); }
function kmHaQuanto(){ if(!KM.t) return 'conectando…'; const s = Math.max(0, Math.round((Date.now()-KM.t)/1000)); return 'ao vivo · atualizado ' + (s<5?'agora':s<60?'há '+s+' s':'há '+Math.round(s/60)+' min'); }
setInterval(()=>{ const el = document.querySelector('#km-vivo span'); if(el && !KM.carregando) el.textContent = kmHaQuanto(); }, 1000);
function kmRelogio(){
  clearInterval(KM.timer);
  KM.timer = setInterval(()=>{ if(document.hidden || (KM.sub==='config' && naTelaKm())) return; if(naTelaKm() || (S.tela==='portal' && S.portalTab==='inicio')) kmCarregar(true); }, 15e3);
}
kmRelogio();

/* ───────── canal da conversa (vem da origem da mensagem na Kommo) ───────── */
const KM_CANAIS = {
  whatsapp:{n:'WhatsApp', i:'ti-brand-whatsapp', bg:'#25D366'},
  instagram:{n:'Instagram', i:'ti-brand-instagram', bg:'linear-gradient(45deg,#F58529,#DD2A7B 55%,#8134AF)'},
  instagram_comentario:{n:'Comentário no Instagram', i:'ti-brand-instagram', bg:'linear-gradient(45deg,#F58529,#DD2A7B 55%,#8134AF)'},
  facebook:{n:'Messenger', i:'ti-brand-messenger', bg:'#0084FF'},
  telegram:{n:'Telegram', i:'ti-brand-telegram', bg:'#229ED9'},
  tiktok:{n:'TikTok', i:'ti-brand-tiktok', bg:'#111'},
  email:{n:'E-mail', i:'ti-mail', bg:'#6b6b6b'},
  chat:{n:'Chat', i:'ti-message-circle', bg:'#8a8a8a'}
};
const kmCanal = k => KM_CANAIS[k] || KM_CANAIS.chat;

/* ───────── pedacinhos ───────── */
function kmMin(m){ if(m < 1) return 'agora'; if(m < 60) return m+' min'; const h = Math.floor(m/60); return h < 24 ? h+'h'+(m%60?String(m%60).padStart(2,'0'):'') : Math.floor(h/24)+'d'; }
function kmClasseTempo(min, prazo){ return min >= prazo ? 'bad' : min >= prazo*.6 ? 'warn' : ''; }
function kmHora(ts){ const d = new Date(ts); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function kmQuando(ts){ const d = new Date(ts), h = new Date(), am = new Date(); am.setDate(h.getDate()+1);
  const hr = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===h.toDateString()) return 'hoje '+hr; if(d.toDateString()===am.toDateString()) return 'amanhã '+hr; return kmHora(ts); }
function kmVazio(em, t, s){ return `<div class="km-vazio"><span class="em">${em}</span><b>${t}</b>${s?`<p style="margin:4px 0 0;font-size:13.5px">${s}</p>`:''}</div>`; }
function kmSemUsuario(){ return `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-link"></i><div><b>Seu nome ainda não está ligado ao campo “Atendente Responsável” da Kommo.</b> Avise a administração (Administração › Atendimento · Kommo › Configurar). Enquanto isso você vê a fila da loja, mas não as suas tarefas e vendas.</div></div>`; }
function kmErroHtml(){
  return `<div class="nota" style="border-color:var(--vermelho);margin-bottom:12px"><i class="ti ti-plug-x"></i><div><b>Não consegui falar com a Kommo.</b> ${esc(KM.erro)}<br><button class="btn p" style="margin-top:8px" onclick="kmCarregar(true)"><i class="ti ti-refresh"></i> Tentar de novo</button></div></div>`;
}

/* ───────── esperando resposta ───────── */
function kmEsperando(adm){
  const e = KM.res?.esperando; if(!e || e.erro) return e?.erro ? `<p class="suave">${esc(e.erro)}</p>` : '';
  const todas = e.itens||[], pz = e.prazoMin||10;
  // quem chegou desde a última atualização pisca
  const antes = KM._vistos || null; KM._vistos = new Set(todas.map(i=>i.k));
  const novas = new Set(antes ? todas.filter(i=>!antes.has(i.k)).map(i=>i.k) : []);
  const atras = todas.filter(i=>i.atrasada).length, quase = todas.filter(i=>!i.atrasada && i.minUteis >= pz*.6).length, emDia = todas.length - atras - quase;
  const porCanal = c => todas.filter(i=>i.canal===c || (c==='instagram' && i.canal==='instagram_comentario')).length;
  const semAt = todas.filter(i=>!i.at).length, maior = todas.reduce((m,i)=>Math.max(m,i.minUteis),0), minhas = todas.filter(i=>i.minha).length;
  const F = KM.filtro || 'todas';
  const filtros = [['todas','Todas',todas.length],...(adm?[]:[['minhas','Minhas',minhas]]),['atrasadas','Atrasadas',atras],['instagram','Instagram',porCanal('instagram')],['whatsapp','WhatsApp',porCanal('whatsapp')],['sem','Sem atendente',semAt]];
  const passa = i => F==='todas' || (F==='minhas'&&i.minha) || (F==='atrasadas'&&i.atrasada) || (F==='sem'&&!i.at) || (F==='instagram'&&/instagram/.test(i.canal)) || (F==='whatsapp'&&i.canal==='whatsapp');
  const it = todas.filter(passa);
  const vista = KM.vista || 'atendente';
  const sig = F+'|'+vista, quieto = KM._sigEsp === sig; KM._sigEsp = sig;
  const pct = (n)=> todas.length ? Math.round(n/todas.length*100) : 0;

  const topo = `<div class="km-hero ${atras?'alerta':''}">
    <div class="km-hero-l"><span class="km-big" data-km-n="${todas.length}">0</span><div><b>${todas.length===1?'cliente esperando':'clientes esperando'}</b><small>${e.lojaAberta?'🟢 loja aberta · o relógio está correndo':'🌙 fora do horário · o relógio está parado'}</small></div></div>
    <div class="km-hero-k">
      <div class="${atras?'quente':''}"><span>⏰</span><b data-km-n="${atras}">0</b><small>passaram de ${pz} min</small></div>
      <div><span>⚡</span><b>${kmMin(maior)}</b><small>espera mais longa</small></div>
      <div><span>📸</span><b data-km-n="${porCanal('instagram')}">0</b><small>Instagram</small></div>
      <div><span>💬</span><b data-km-n="${porCanal('whatsapp')}">0</b><small>WhatsApp</small></div>
      <div class="${semAt?'quente':''}"><span>🙋</span><b data-km-n="${semAt}">0</b><small>sem atendente</small></div>
    </div>
    ${todas.length?`<div class="km-urg" title="Em dia · quase no prazo · atrasadas"><i class="ok" style="width:${pct(emDia)}%"></i><i class="quase" style="width:${pct(quase)}%"></i><i class="atr" style="width:${pct(atras)}%"></i></div>
    <div class="km-urg-leg"><span><i class="ok"></i>${emDia} em dia</span><span><i class="quase"></i>${quase} quase no prazo</span><span><i class="atr"></i>${atras} atrasadas</span></div>`:''}
  </div>`;
  if(!todas.length){ setTimeout(kmAnimar, 30); KM._sigEsp = null; return topo + kmVazio('💚','Todas as clientes foram respondidas.','A lista atualiza sozinha a cada 15 segundos.'); }

  const barra = `<div class="km-barra2"><div class="km-chips">${filtros.map(([k,n,c])=>`<button class="${F===k?'on':''}" onclick="KM.filtro='${k}';render()">${n}<span>${c}</span></button>`).join('')}</div>
    <div class="km-vistas"><button class="${vista==='atendente'?'on':''}" title="Por atendente" onclick="KM.vista='atendente';render()"><i class="ti ti-layout-grid"></i></button><button class="${vista==='lista'?'on':''}" title="Lista" onclick="KM.vista='lista';render()"><i class="ti ti-list"></i></button></div></div>`;

  const linha = (i,n) => { const cn = kmCanal(i.canal), p = Math.min(100, Math.round(i.minUteis/pz*100)), cls = kmClasseTempo(i.minUteis, pz);
    return `<div class="km-row ${i.atrasada?'atrasada':''} ${i.minha?'minha':''} ${novas.has(i.k)?'nova':''}" style="animation-delay:${Math.min(n,14)*30}ms" onclick="${i.lead?`kmFicha(${i.lead})`:''}">
      <span class="km-cn" style="background:${cn.bg}" title="${cn.n}"><i class="ti ${cn.i}"></i></span>
      <div class="km-rt"><b>${esc(i.nome)}</b>
        <small>${i.etapaNome?`<span class="km-et">${esc(bonitoEt(i.etapaNome))}</span>`:''}${i.primeira?'<span class="km-tag">1º contato</span>':''}${vista==='lista'?`<span>${i.atNome?esc(i.atNome):'sem atendente'}</span>`:''}${i.valor?`<span>${brl(i.valor)}</span>`:''}${i.tel?`<span>${esc(i.tel)}</span>`:''}</small>
        <div class="km-prog ${cls}"><i style="width:${p}%"></i></div></div>
      <div class="km-rr"><span class="km-tempo ${cls}">${kmMin(i.minUteis)}</span><small>${i.atrasada?'atrasada':i.minUteis>=pz*.6?'quase':'no prazo'}</small></div>
      ${i.link?`<a class="km-ir" style="background:${cn.bg}" href="${esc(i.link)}" target="_blank" rel="noopener" title="Responder na Kommo (${cn.n})" onclick="event.stopPropagation()"><i class="ti ti-send"></i></a>`:''}
    </div>`; };

  let corpo;
  if(!it.length) corpo = kmVazio('🔎','Nada nesse filtro.','Toque em “Todas” para ver a fila inteira.');
  else if(vista==='lista') corpo = `<div class="km-lista2">${it.map(linha).join('')}</div>`;
  else {
    const grupos = {}; it.forEach(i=>{ const k = i.at ? String(i.at) : 'sem'; (grupos[k] ||= []).push(i); });
    const ord = Object.keys(grupos).sort((a,b)=> (a==='sem'?-1:b==='sem'?1:0) || (grupos[b].filter(x=>x.atrasada).length - grupos[a].filter(x=>x.atrasada).length) || (grupos[b].length-grupos[a].length));
    corpo = `<div class="km-grade">${ord.map((k,gi)=>{ const ls = grupos[k], nome = k==='sem' ? 'Sem atendente' : (ls[0].atNome||'Atendente'), at = ls.filter(x=>x.atrasada).length, aberto = KM.abertos?.[k], mostra = aberto ? ls : ls.slice(0,4);
      const p = Math.round(at/ls.length*100), eu = ls.some(x=>x.minha);
      return `<section class="km-gcard ${k==='sem'?'sem':''} ${eu?'eu':''}" style="animation-delay:${gi*70}ms">
        <header><span class="km-gav" style="--p:${p}">${k==='sem'?'🙋':esc(iniciais(nome))}</span><div class="cresce"><b>${esc(nome)}${eu?' <em>você</em>':''}</b><small>${ls.length} ${ls.length===1?'esperando':'esperando'}${at?` · <span class="neg">${at} atrasada${at>1?'s':''}</span>`:' · tudo no prazo'}</small></div><span class="km-gn">${ls.length}</span></header>
        <div class="km-glist">${mostra.map(linha).join('')}</div>
        ${ls.length>4?`<button class="km-mais" onclick="KM.abertos={...(KM.abertos||{}),'${k}':${!aberto}};render()">${aberto?'Mostrar menos':`Ver mais ${ls.length-4}`} <i class="ti ti-chevron-${aberto?'up':'down'}"></i></button>`:''}
      </section>`; }).join('')}</div>`;
  }
  setTimeout(kmAnimar, 30);
  return (quieto ? topo.replace('class="km-hero','class="km-hq km-hero') : topo) + barra + `<div class="${quieto?'km-quieto':''}">` + corpo + `</div><p class="apagado" style="font-size:12.5px;margin-top:10px">⏱️ O tempo conta só no horário da loja e a barrinha mostra quanto do prazo de ${pz} min já passou. Toque na cliente para ver a ficha; no botão colorido para responder na Kommo. Atualiza sozinho a cada 15 s.</p>`;
}
const bonitoEt = t => String(t||'').toLowerCase().replace(/(^|\s|\/)\S/g, x=>x.toUpperCase());
/* números contando (só quando o valor muda) */
function kmAnimar(){
  KM._numAnt ||= {};
  document.querySelectorAll('[data-km-n]').forEach((el,n)=>{
    const alvo = +el.dataset.kmN, de = KM._numAnt[n] ?? 0; KM._numAnt[n] = alvo;
    if(de === alvo || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){ el.textContent = alvo; return; }
    const t0 = performance.now(), d = 700;
    const passo = t=>{ const k = Math.min(1,(t-t0)/d), v = Math.round(de + (alvo-de)*(1-Math.pow(1-k,3))); el.textContent = v; if(k<1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  });
}

/* ───────── tarefas ───────── */
function kmTarefas(adm){
  const t = KM.tar || KM.res?.tarefas;
  if(!t) return `<p class="suave"><i class="ti ti-loader-2"></i> Carregando tarefas…</p>`;
  if(t.erro) return `<p class="suave">${esc(t.erro)}</p>`;
  if(t.semUsuario) return kmSemUsuario();
  const us = t.atendentes||[];
  const filtro = adm ? `<div class="linha quebra" style="gap:8px;margin-bottom:10px"><select class="inp" style="max-width:240px" onchange="KM.tarQuem=this.value;kmTarCarregar()"><option value="">Todas as atendentes</option>${us.map(u=>`<option value="${u.id}" ${String(KM.tarQuem)===String(u.id)?'selected':''}>${esc(u.nome)}</option>`).join('')}</select></div>` : '';
  const it = t.itens||[];
  if(!it.length) return filtro + kmVazio('✅','Nenhuma tarefa aberta.', adm?'':'Quando alguém criar uma tarefa para você na Kommo, ela aparece aqui.');
  const grupos = [['Atrasadas','ti-alarm',it.filter(x=>x.atrasada)],['Hoje','ti-sun',it.filter(x=>!x.atrasada&&x.hoje)],['Próximas','ti-calendar',it.filter(x=>!x.atrasada&&!x.hoje)]];
  let n = 0;
  return filtro + grupos.filter(g=>g[2].length).map(([nome,ic,ls])=>`<div class="km-grupo"><i class="ti ${ic}"></i>${nome} · ${ls.length}</div><div class="km-lista">${ls.map(x=>`
    <div class="km-tar ${x.atrasada?'atrasada':''}" id="kmt-${x.id}" style="animation-delay:${Math.min(n++,12)*35}ms">
      <div class="tx">${esc(x.texto||'Tarefa')}</div>
      <div class="meta"><span class="km-tempo ${x.atrasada?'bad':x.hoje?'warn':''}"><i class="ti ti-clock"></i> ${kmQuando(x.prazo)}</span>${x.cliente?`<span>👤 ${x.lead?`<a href="#" onclick="event.preventDefault();kmFicha(${x.lead})">${esc(x.cliente)}</a>`:esc(x.cliente)}</span>`:''}${adm&&x.atNome?`<span>· ${esc(x.atNome)}</span>`:''}</div>
      <div class="acoes"><button class="km-b-ok" onclick="kmTarConcluir(${x.id})"><i class="ti ti-check"></i>Concluir</button><button class="km-b-2" onclick="kmTarRemarcar(${x.id})"><i class="ti ti-clock-edit"></i>Remarcar</button><button class="km-b-2" onclick="kmTarRepassar(${x.id})"><i class="ti ti-arrow-forward-up"></i>Repassar</button>${x.link?`<a class="km-ir" style="margin-left:auto" href="${esc(x.link)}" target="_blank" rel="noopener" title="Abrir na Kommo"><i class="ti ti-external-link"></i></a>`:''}</div>
    </div>`).join('')}</div>`).join('');
}
async function kmTarCarregar(){
  try{ KM.tar = await kmApi('/api/tarefas'+(S.tela==='admin'&&KM.tarQuem?'?at='+KM.tarQuem:'')); }catch(e){ toast(e.message, true); }
  render();
}
async function kmTarAgir(id, corpo, ok){
  try{
    await kmApi('/api/tarefas/'+id, corpo);
    const el = $('#kmt-'+id); if(el) el.classList.add('saindo');
    toast(ok);
    setTimeout(async()=>{ KM.t = 0; await kmTarCarregar(); kmCarregar(true); }, 420);
  }catch(e){ toast(e.message, true); }
}
function kmModal(titulo, corpo){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal"><div class="modal-t"><h3 class="cresce">${titulo}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div><div class="modal-c">${corpo}</div></div></div>`;
}
function kmTarConcluir(id){
  kmModal('✅ Concluir tarefa', `<div class="campo"><label>O que foi feito? (opcional)</label><input class="inp" id="km-res" placeholder="Ex.: entregue, cliente confirmou" maxlength="300"></div>
    <button class="btn pri" style="width:100%" onclick="const v=$('#km-res').value;fecharModal();kmTarAgir(${id},{acao:'concluir',texto:v||'Feito pelo Portal Equipe'},'Tarefa concluída ✔')"><i class="ti ti-check"></i> Concluir</button>`);
  setTimeout(()=>$('#km-res')?.focus(), 50);
}
function kmTarRemarcar(id){
  const d = new Date(), am = new Date(); am.setDate(d.getDate()+1); am.setHours(9,0,0,0);
  const em1h = Date.now()+3600e3, em3h = Date.now()+3*3600e3, local = new Date(Date.now()+86400e3 - new Date().getTimezoneOffset()*60e3).toISOString().slice(0,16);
  kmModal('⏰ Remarcar', `<div class="km-lista">
    <button class="btn" onclick="fecharModal();kmTarAgir(${id},{acao:'remarcar',quando:${em1h}},'Remarcada para daqui 1 hora')">Daqui 1 hora</button>
    <button class="btn" onclick="fecharModal();kmTarAgir(${id},{acao:'remarcar',quando:${em3h}},'Remarcada para daqui 3 horas')">Daqui 3 horas</button>
    <button class="btn" onclick="fecharModal();kmTarAgir(${id},{acao:'remarcar',quando:${am.getTime()}},'Remarcada para amanhã 9h')">Amanhã às 9h</button>
    <div class="campo" style="margin-top:6px"><label>Outro dia e hora</label><input class="inp" type="datetime-local" id="km-qd" value="${local}"></div>
    <button class="btn pri" onclick="const v=new Date($('#km-qd').value).getTime();if(!v)return toast('Escolha a data',true);fecharModal();kmTarAgir(${id},{acao:'remarcar',quando:v},'Tarefa remarcada ✔')"><i class="ti ti-calendar-check"></i> Remarcar</button></div>`);
}
function kmTarRepassar(id){
  const us = (KM.tar||KM.res?.tarefas)?.atendentes||[];
  kmModal('↪️ Passar a cliente para', `<div class="km-lista">${us.map(u=>`<button class="btn" style="justify-content:flex-start" onclick="fecharModal();kmTarAgir(${id},{acao:'repassar',para:${u.id}},'Repassada para ${esc(primeiroNome(u.nome)).replace(/'/g,'')} ✔')"><span class="av" style="width:28px;height:28px;border-radius:50%;display:inline-grid;place-items:center;background:var(--veludo2);font-size:12px;font-weight:800;margin-right:8px">${esc(iniciais(u.nome))}</span>${esc(u.nome)}</button>`).join('') || '<p class="suave">Nenhuma atendente no campo da Kommo.</p>'}<p class="apagado" style="font-size:12.5px;margin:6px 0 0">Muda o campo “Atendente Responsável” da cliente na Kommo — a tarefa vai junto.</p></div>`);
}

/* ───────── funil e ficha ───────── */
function kmFunil(){
  const f = KM.funil;
  if(!f){ kmFunilCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Carregando o funil…</p>`; }
  if(f.erro) return `<p class="suave">${esc(f.erro)}</p>`;
  if(!f.etapas?.length) return kmVazio('🗂️','Nenhum funil encontrado na Kommo.');
  const tot = f.etapas.reduce((a,e)=>a+e.total,0);
  return `<div class="km-hub" style="margin-bottom:8px">${f.funis.map(x=>`<button class="${x.id===f.funil.id?'on':''}" onclick="KM.funilId=${x.id};KM.funil=null;render()">${esc(x.nome)}</button>`).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin:0 0 8px">${tot} ${tot===1?'cliente aberta':'clientes abertas'} · arraste para o lado para ver todas as etapas · 💬 = esperando resposta</p>
    <div class="km-kanban">${f.etapas.map((e,i)=>`<div class="km-col" style="animation-delay:${i*50}ms;border-top:4px solid ${esc(e.cor||'#ddd')}"><h4>${esc(e.nome)}<span>${e.total}</span></h4><div class="v">${e.valor?brl(e.valor):'&nbsp;'}</div>
      ${e.leads.map((l,j)=>`<button class="km-card ${l.minha?'minha':''}" style="animation-delay:${Math.min(j,10)*30}ms" onclick="kmFicha(${l.id})"><b>${l.canal?`<i class="ti ${kmCanal(l.canal).i}" title="${kmCanal(l.canal).n}" style="color:${/gradient/.test(kmCanal(l.canal).bg)?'#DD2A7B':kmCanal(l.canal).bg}"></i> `:''}${l.esperando?'<span class="zap">💬</span> ':''}${esc(l.nome)}</b><small>${l.atNome?esc(l.atNome):'—'}${l.valor?' · '+brl(l.valor):''}${l.parado>=3?` · <span style="color:var(--vermelho2)">${l.parado}d parada</span>`:''}</small></button>`).join('')}
      ${e.total>e.leads.length?`<small class="apagado">+${e.total-e.leads.length} na Kommo</small>`:''}</div>`).join('')}</div>`;
}
async function kmFunilCarregar(){
  if(KM._fc) return; KM._fc = true;
  try{ KM.funil = await kmApi('/api/funil'+(KM.funilId?'?id='+KM.funilId:'')); }catch(e){ KM.funil = {erro:e.message}; }
  finally{ KM._fc = false; }
  kmRepintar();
}
async function kmFicha(id){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal"><div class="modal-c"><p class="suave"><i class="ti ti-loader-2"></i> Abrindo a ficha…</p></div></div></div>`;
  let f; try{ f = (await kmApi('/api/lead/'+id)).ficha; }catch(e){ fecharModal(); return toast(e.message, true); }
  const adm = S.tela==='admin';
  const espera = f.esperandoDesde ? Math.round((Date.now()-f.esperandoDesde)/60e3) : null;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(f.nome)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${espera!=null?`<div class="km-topo alerta" style="margin-bottom:10px"><span class="ic">⏰</span><div class="cresce"><b>Esperando resposta há ${kmMin(espera)}</b><small>desde ${kmHora(f.esperandoDesde)}</small></div></div>`:''}
      <div class="km-kpis">
        <div class="km-kpi"><small>Funil</small><b style="font-size:16px">${esc(f.funil||'—')}</b></div>
        <div class="km-kpi"><small>Atendente</small><b style="font-size:16px">${esc(f.atNome||'—')}</b></div>
        <div class="km-kpi"><small>Valor</small><b style="font-size:16px">${f.valor?brl2(f.valor):'—'}</b></div>
        <div class="km-kpi"><small>Canal</small><b style="font-size:16px;display:flex;align-items:center;gap:6px">${f.canal?`<span class="km-ir" style="width:26px;height:26px;font-size:14px;border-radius:8px;background:${kmCanal(f.canal).bg}"><i class="ti ${kmCanal(f.canal).i}"></i></span>${kmCanal(f.canal).n}`:'—'}</b>${f.tel?`<small>${esc(adm?fmtTel(f.tel):f.tel)}</small>`:''}</div>
      </div>
      <div class="campo"><label>Etapa</label><select class="inp" id="km-etapa" onchange="kmMoverEtapa(${f.id}, this.value)">${f.etapas.map(e=>`<option value="${e.id}" ${e.id===f.etapaId?'selected':''}>${esc(e.nome)}</option>`).join('')}${f.etapas.some(e=>e.id===f.etapaId)?'':`<option selected>${esc(f.etapa)}</option>`}</select></div>
      ${(adm||f.minha)&&f.atendentes?.length?`<div class="campo"><label>Atendente responsável</label><select class="inp" onchange="kmTrocarAt(${f.id}, this.value)">${f.at?'':'<option value="">— sem atendente —</option>'}${f.atendentes.map(a=>`<option value="${a.id}" ${a.id===f.at?'selected':''}>${esc(a.nome)}</option>`).join('')}</select></div>`:''}
      <p class="apagado" style="font-size:12.5px;margin:-4px 0 10px">Na Kommo desde ${kmHora(f.criado)} · mexida em ${kmHora(f.atualizado)}${f.ultEntrada?` · última mensagem dela ${kmHora(f.ultEntrada)}`:''}${f.ultSaida?` · última resposta ${kmHora(f.ultSaida)}`:''}</p>
      <b style="font-size:14px">📌 Tarefas abertas</b>
      <div class="km-lista" style="margin:6px 0 12px">${f.tarefas.length?f.tarefas.map(t=>`<div class="km-cli" style="cursor:default"><div class="t"><b style="white-space:normal">${esc(t.texto||'Tarefa')}</b><small>${kmQuando(t.prazo)}</small></div><button class="km-ir" style="background:#1a7f4b" title="Concluir" onclick="fecharModal();kmTarConcluir(${t.id})"><i class="ti ti-check"></i></button></div>`).join(''):'<p class="suave" style="font-size:13.5px;margin:0">Nenhuma.</p>'}</div>
      <div id="km-fid"></div>
      <div class="linha quebra" style="gap:8px">
        <a class="btn pri" href="${esc(f.link)}" target="_blank" rel="noopener"><i class="ti ${f.canal?kmCanal(f.canal).i:'ti-external-link'}"></i> Abrir na Kommo</a>
        ${typeof fidApi==='function'||typeof fidAdm==='function'?`<button class="btn" onclick="kmFidelidade('${esc(f.nome).replace(/'/g,'')}','${esc(adm?f.tel:f.telFinal)}')"><i class="ti ti-heart-handshake"></i> Cartão fidelidade</button>`:''}
      </div>
    </div></div></div>`;
}
async function kmTrocarAt(id, at){
  if(!at) return;
  try{ const r = await kmApi('/api/lead/'+id+'/atendente', {at:Number(at)}); toast(r?.movida?.etapa ? 'Atendente trocada e cliente movida para '+r.movida.etapa+' na Kommo ✔' : 'Atendente trocada na Kommo ✔'); KM.funil = null; KM.vend = null; kmCarregar(true); kmFicha(id); }
  catch(e){ toast(e.message, true); }
}
async function kmMoverEtapa(id, etapa){
  try{ await kmApi('/api/lead/'+id+'/etapa', {etapa:Number(etapa)}); toast('Etapa atualizada na Kommo ✔'); KM.funil = null; kmCarregar(true); kmFicha(id); }
  catch(e){ toast(e.message, true); }
}
/* liga a cliente da Kommo ao cartão fidelidade do PDV (pelo WhatsApp) */
async function kmFidelidade(nome, tel){
  const box = $('#km-fid'); if(!box) return;
  box.innerHTML = `<p class="suave"><i class="ti ti-loader-2"></i> Procurando o cartão…</p>`;
  const so = String(tel||'').replace(/\D/g,''), fim = so.slice(-8);
  try{
    let achou = null;
    if(S.tela==='admin' && typeof fidAdm==='function'){
      const r = await fidAdm('lista'); achou = (r.clientes||[]).find(c=>fim && String(c.tel||'').replace(/\D/g,'').endsWith(fim));
      if(achou){ const c = (await fidAdm('cartao', {id:achou.id})).cartao; achou = c; }
    } else if(typeof fidApi==='function'){
      const r = await fidApi('buscar', {q:so.slice(-4) || nome}); const ls = r.clientes||[];
      achou = ls.length===1 ? ls[0] : ls.find(c=>semAcento(c.nome).toLowerCase().includes(semAcento(primeiroNome(nome)).toLowerCase())) || null;
    }
    box.innerHTML = achou ? `<div class="fid-card" style="margin-bottom:12px"><div class="top"><span style="font-size:20px">💳</span><b>${esc(achou.nome)}</b><small>${achou.selos??achou.no_cartao??0} selos</small></div>
      <div class="fid-msg">${achou.cashback?.saldo?`💸 Cashback <b>${brl2(achou.cashback.saldo)}</b>`:'Sem cashback no momento'}${achou.pendentes?.length?` · 🎁 ${achou.pendentes.length} prêmio(s) a entregar`:''}</div></div>`
      : `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-heart-handshake"></i><div>Não achei cartão fidelidade para essa cliente (pelo telefone ou nome). Cadastre na próxima compra pelo PDV.</div></div>`;
  }catch(e){ box.innerHTML = `<p class="apagado" style="font-size:13px">Cartão fidelidade indisponível: ${esc(e.message)}</p>`; }
}

/* ───────── meus números (equipe) ───────── */
function kmMeusNumeros(){
  const v = KM.res?.vendas?.eu, t = KM.res?.tempo?.eu, pz = KM.res?.tempo?.prazoMin || 10;
  if(!KM.res?.temUsuario) return kmSemUsuario();
  const med = s => s==null ? '—' : s < 60 ? s+' s' : Math.round(s/60)+' min';
  return `<div class="km-kpis">
    <div class="km-kpi"><small>Vendas pela Kommo (mês)</small><b class="num">${v?brl(v.total):'—'}</b><small>${v?v.n+(v.n===1?' venda ganha':' vendas ganhas'):''}</small></div>
    <div class="km-kpi" style="animation-delay:60ms"><small>Hoje pela Kommo</small><b class="num">${v?brl(v.hoje):'—'}</b></div>
    <div class="km-kpi" style="animation-delay:120ms"><small>Seu tempo de resposta (hoje)</small><b>${med(t?.hoje?.mediana)}</b><small>${t?.hoje?.n?t.hoje.n+' respostas':'sem respostas hoje'}</small></div>
    <div class="km-kpi" style="animation-delay:180ms"><small>Dentro de ${pz} min (7 dias)</small><b>${t?.semana?.dentro!=null?t.semana.dentro+'%':'—'}</b><div class="km-barra"><i style="width:${t?.semana?.dentro||0}%"></i></div></div>
  </div><p class="apagado" style="font-size:12.5px">Só você contra você: compare com a semana passada. As vendas contam quando a cliente vai para “venda ganha” na Kommo com você no campo Atendente Responsável${KM.res?.vendas?.pdv?.ligado?' — e já somam na sua meta do PDV.':'.'}</p>`;
}

/* ───────── administração: vendas, tempo, configurar ───────── */
function kmVendas(){
  const v = KM.vend; if(!v){ kmVendCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Somando as vendas…</p>`; }
  if(v.erro) return `<p class="suave">${esc(v.erro)}</p>`;
  const mx = Math.max(1, ...v.pessoas.map(p=>p.total));
  const nomes = {}; (S.adm?.dados?.colaboradoras||[]).forEach(c=>nomes[c.id]=c.nome);
  return `<div class="linha quebra" style="gap:8px;margin-bottom:10px"><input class="inp" type="month" style="max-width:180px" value="${v.mes}" onchange="KM.vendMes=this.value;KM.vend=null;render()"></div>
    <div class="km-kpis"><div class="km-kpi"><small>Ganhas no mês</small><b>${v.total.n}</b></div><div class="km-kpi" style="animation-delay:60ms"><small>Valor no mês</small><b>${brl(v.total.total)}</b></div><div class="km-kpi" style="animation-delay:120ms"><small>Hoje</small><b>${brl(v.total.hoje)}</b></div><div class="km-kpi" style="animation-delay:180ms"><small>Ticket médio</small><b>${brl(v.total.n?v.total.total/v.total.n:0)}</b></div></div>
    <div class="cartao pad">${v.pessoas.length?v.pessoas.map((p,i)=>`<div style="margin-bottom:12px"><div class="linha entre"><b>${esc(p.eid&&nomes[p.eid]?primeiroNome(nomes[p.eid]):p.nome)}${p.eid?'':' <small class="apagado">(não ligada ao portal)</small>'}</b><span><b>${brl(p.total)}</b> <small class="apagado">· ${p.n} ${p.n===1?'venda':'vendas'}${p.hoje?' · hoje '+brl(p.hoje):''}</small></span></div><div class="km-barra"><i style="width:${p.total/mx*100}%;animation-delay:${i*80}ms"></i></div></div>`).join(''):kmVazio('📭','Nenhuma venda ganha na Kommo neste mês.')}</div>
    <p class="apagado" style="font-size:12.5px">Conta cada cliente que foi para “venda ganha” na Kommo, pelo valor do lead e pelo campo Atendente Responsável. ${v.pdv?.ligado?'<b>Somando na meta do PDV</b> (atualiza a cada 5 min).':'Ainda não está somando na meta do PDV — ligue em Configurar.'}</p>`;
}
async function kmVendCarregar(){ if(KM._vc) return; KM._vc = true; try{ KM.vend = await kmApi('/api/vendas'+(KM.vendMes?'?mes='+KM.vendMes:'')); }catch(e){ KM.vend = {erro:e.message}; } finally{ KM._vc = false; } kmRepintar(); }
function kmTempo(){
  const t = KM.res?.tempo; if(!t) return '';
  if(t.erro) return `<p class="suave">${esc(t.erro)}</p>`;
  const med = s => s==null ? '—' : s < 60 ? s+' s' : Math.round(s/60)+' min';
  const cel = x => `<td><b>${med(x.mediana)}</b><br><small class="apagado">${x.n} resp.${x.dentro!=null?' · '+x.dentro+'% no prazo':''}</small></td>`;
  return `<div class="cartao pad" style="overflow-x:auto"><table class="km-tab"><thead><tr><th>Pessoa</th><th>Hoje</th><th>7 dias</th><th>30 dias</th></tr></thead><tbody>${(t.pessoas||[]).map(p=>`<tr><td><b>${esc(p.nome)}</b>${p.eid?'':' <small class="apagado">(não ligada)</small>'}</td>${cel(p.hoje)}${cel(p.semana)}${cel(p.mes)}</tr>`).join('') || '<tr><td colspan="4" class="apagado">Ainda sem respostas medidas. O motor começa a medir a partir de agora.</td></tr>'}</tbody></table></div>
    <p class="apagado" style="font-size:12.5px">Mediana = o tempo “do meio” (não deixa um dia ruim estragar a média). Conta só no horário da loja (${t.prazoMin} min de prazo). Resposta do robô de atendimento fecha a espera, mas não entra na conta de ninguém.</p>`;
}
function kmConfig(){
  const c = KM.cfg; if(!c){ kmCfgCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Abrindo…</p>`; }
  if(c.erro) return `<p class="suave">${esc(c.erro)}</p>`;
  const colabs = (S.adm?.dados?.colaboradoras||[]).filter(x=>x.ativa==='SIM');
  const k = c.kommo||{}, dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return `<div class="nota ${k.ok?'info':''}" style="margin-bottom:12px;${k.ok?'':'border-color:var(--vermelho)'}"><i class="ti ti-${k.ok?'plug-connected':'plug-x'}"></i><div><b>${k.ok?'Kommo conectada':'Kommo com problema'}</b>${k.conta?' · conta '+esc(k.conta):''}${k.subdominio?' · '+esc(k.subdominio)+'.kommo.com':''}${k.ultimaLeitura?`<br><small>Última leitura das conversas: ${kmHora(k.ultimaLeitura)}</small>`:''}${k.erro?`<br><small>${esc(k.erro)}</small>`:''}
      <br><button class="btn p" style="margin-top:6px" onclick="kmAtualizarJa()"><i class="ti ti-refresh"></i> Atualizar agora</button></div></div>
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🔗 Quem é quem</h3><p class="apagado" style="font-size:13px;margin:0 0 10px">${c.campo?`Pelo campo <b>${esc(c.campo.nome)}</b> do lead (as etapas de cada atendente no funil preenchem esse campo).`:'<b>Não achei o campo de atendente na Kommo.</b>'} Ligue cada opção à colaboradora do portal: é isso que faz as tarefas, as vendas e o tempo de resposta aparecerem para cada uma.</p>
      ${(c.atendentes||[]).map(u=>{ const sug = c.mapaAt[u.id] || (colabs.find(x=>semAcento(primeiroNome(x.nome)).slice(0,3)===semAcento(u.nome).slice(0,3))||{}).id || ''; return `<div class="linha entre" style="gap:10px;padding:6px 0;border-bottom:1px solid var(--linha2)"><span><b>${esc(u.nome)}</b><br><small class="apagado">${c.mapaAt[u.id]?'ligada':(sug?'sugestão — confira e salve':'opção da Kommo')}</small></span><select class="inp km-map" data-at="${u.id}" style="max-width:220px"><option value="">— ninguém —</option>${colabs.map(x=>`<option value="${x.id}" ${sug===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>`; }).join('')}</div>
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🧾 Vendas da Kommo no PDV</h3>
      <p class="apagado" style="font-size:13px;margin:0 0 10px">Quando a cliente vai para “venda ganha” na Kommo, o valor entra na meta da atendente no PDV (Arena, ranking e metas), uma vez só. Se o valor ou a atendente mudar, corrige; se sair de “venda ganha”, tira. <b>Por isso, a venda do WhatsApp/Instagram não deve ser passada de novo no caixa do PDV.</b></p>
      ${c.pdv?.segredo?`<label class="linha" style="gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="km-somar" ${c.cfg.somarMeta?'checked':''}> Somar as vendas da Kommo na meta do PDV</label>
        ${c.pdv.ultimo?`<p class="apagado" style="font-size:12.5px;margin:0 0 8px">${c.pdv.ultimo.ok?'✅':'⚠️'} Última sincronização ${kmHora(c.pdv.ultimo.em)}${c.pdv.ultimo.ok?(c.pdv.ultimo.res||[]).map(r=>` · ${r.mes}: ${r.novas||0} novas, ${r.corrigidas||0} corrigidas, ${r.tiradas||0} tiradas`).join(''):' · '+esc(c.pdv.ultimo.erro||'')}</p>`:''}`
      :`<button class="btn pri" onclick="kmLigarPdv()"><i class="ti ti-plug-connected"></i> Ligar vendas da Kommo ao PDV</button><p class="apagado" style="font-size:12.5px;margin:6px 0 0">Precisa do arquivo KOMMO.gs no Apps Script (publicado como nova versão).</p>`}</div>
    <div class="cartao pad"><h3 style="margin:0 0 10px;font-size:16px">⏰ Prazo e horário</h3>
      <div class="fid-g2"><div class="campo"><label>Prazo para responder (min)</label><input class="inp" type="number" id="km-prazo" min="1" max="240" value="${c.cfg.prazoMin}"></div>
      <div class="campo"><label>Horário da loja</label><div class="linha" style="gap:6px"><input class="inp" type="time" id="km-ini" value="${c.cfg.ini}"><span>às</span><input class="inp" type="time" id="km-fim" value="${c.cfg.fim}"></div></div></div>
      <div class="linha quebra" style="gap:6px;margin:4px 0 10px">${dias.map((d,i)=>`<label class="selo" style="cursor:pointer"><input type="checkbox" class="km-dia" value="${i}" ${c.cfg.dias.includes(i)?'checked':''}> ${d}</label>`).join('')}</div>
      <label class="linha" style="gap:8px;margin-bottom:12px;cursor:pointer"><input type="checkbox" id="km-masc" ${c.cfg.mascararTel?'checked':''}> Esconder o WhatsApp da cliente da equipe (mostra só o final)</label>
      <button class="btn pri" onclick="kmCfgSalvar()"><i class="ti ti-device-floppy"></i> Salvar</button></div>`;
}
async function kmLigarPdv(){
  try{
    const g = await api('admKommo', {...S.adm.cred, op:'segredo'});
    const r = await kmApi('/api/admin/salvar', {pdvSegredo:g.segredo, cfg:{somarMeta:true}});
    KM.cfg = {...KM.cfg, cfg:r.cfg, pdv:r.pdv}; KM.vend = null; render();
    toast(r.pdv?.ultimo?.ok ? 'Vendas da Kommo ligadas ao PDV ✔' : 'Ligado, mas a primeira sincronização falhou: '+(r.pdv?.ultimo?.erro||''), !r.pdv?.ultimo?.ok);
  }catch(e){ toast(/desconhecida/i.test(e.message) ? 'Falta colar o KOMMO.gs no Apps Script e publicar nova versão.' : e.message, true); }
}
async function kmCfgCarregar(){ if(KM._cc) return; KM._cc = true; try{ KM.cfg = await kmApi('/api/admin/config'); }catch(e){ KM.cfg = {erro:e.message}; } finally{ KM._cc = false; } kmRepintar(); }
async function kmCfgSalvar(){
  const mapaAt = {}; document.querySelectorAll('.km-map').forEach(s=>{ if(s.value) mapaAt[s.dataset.at] = s.value; });
  const dias = [...document.querySelectorAll('.km-dia:checked')].map(x=>+x.value);
  try{ const r = await kmApi('/api/admin/salvar', {mapaAt, cfg:{prazoMin:+$('#km-prazo').value, ini:$('#km-ini').value, fim:$('#km-fim').value, dias, mascararTel:$('#km-masc').checked, ...($('#km-somar')?{somarMeta:$('#km-somar').checked}:{})}});
    KM.cfg = {...KM.cfg, mapaAt:r.mapaAt, cfg:r.cfg, pdv:r.pdv}; KM.vend = null; toast('Configuração salva ✔'); kmCarregar(true); render(); }
  catch(e){ toast(e.message, true); }
}
async function kmAtualizarJa(){ try{ await kmApi('/api/admin/atualizar', {}); KM.cfg = null; KM.funil = null; KM.vend = null; toast('Atualizado ✔'); kmCarregar(true); render(); }catch(e){ toast(e.message, true); } }

/* ───────── telas ───────── */
function kmTela(adm){
  if(!KM.res && !KM.erro){ kmCarregar(); }
  const r = KM.res, esp = r?.esperando?.itens?.length || 0, tar = (KM.tar||r?.tarefas)?.itens?.length || 0;
  const subs = adm ? [['esperando','ti-message-circle','Esperando',esp],['tarefas','ti-checklist','Tarefas',tar],['funil','ti-layout-kanban','Funil'],['vendas','ti-trophy','Vendas'],['tempo','ti-stopwatch','Tempo de resposta'],['config','ti-settings','Configurar']]
                   : [['esperando','ti-message-circle','Esperando',esp],['tarefas','ti-checklist','Minhas tarefas',tar],['funil','ti-layout-kanban','Funil'],['numeros','ti-chart-bar','Meus números']];
  const sub = subs.some(s=>s[0]===KM.sub) ? KM.sub : 'esperando';
  const corpo = !r && !KM.erro ? `<p class="suave"><i class="ti ti-loader-2"></i> Conectando na Kommo…</p>` :
    ({esperando:()=>kmEsperando(adm), tarefas:()=>kmTarefas(adm), funil:kmFunil, numeros:kmMeusNumeros, vendas:kmVendas, tempo:kmTempo, config:kmConfig})[sub]();
  return `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><h2 class="secao" style="margin:0">💬 Atendimento · Kommo</h2><span class="linha" style="gap:6px;align-items:center"><span class="km-vivo ${KM.carregando?'carregando':''}" id="km-vivo"><i class="pt"></i><span>${KM.carregando?'atualizando…':kmHaQuanto()}</span></span> <button class="icone" title="Atualizar" onclick="KM.funil=null;KM.vend=null;kmCarregar(true);if(KM.sub==='tarefas')kmTarCarregar()"><i class="ti ti-refresh"></i></button></span></div>
    ${KM.erro?kmErroHtml():''}
    <div class="km-hub">${subs.map(([k,i,n,b])=>`<button class="${sub===k?'on':''}" onclick="KM.sub='${k}';${k==='tarefas'?'kmTarCarregar();':''}render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}`;
}

/* atalho no Início da vendedora */
function kmCartaoInicio(){
  if(!KM.res){ if(!KM.erro) kmCarregar(); return ''; }
  const e = KM.res.esperando?.itens||[], minhas = e.filter(i=>i.minha), atras = e.filter(i=>i.atrasada).length;
  const t = KM.res.tarefas?.itens||[], ta = t.filter(x=>x.atrasada||x.hoje).length, v = KM.res.vendas?.eu;
  return `<div class="km-ini">
    <button class="${atras?'alerta':''}" onclick="S.portalTab='whats';KM.sub='esperando';render()"><span class="ic">💬</span><span><b>${e.length}</b><small>${minhas.length?minhas.length+' sua(s) · ':''}esperando resposta</small></span></button>
    <button style="animation-delay:60ms" onclick="S.portalTab='whats';KM.sub='tarefas';kmTarCarregar();render()"><span class="ic">📌</span><span><b>${ta}</b><small>tarefas para hoje</small></span></button>
    ${v?`<button style="animation-delay:120ms" onclick="S.portalTab='whats';KM.sub='numeros';render()"><span class="ic">🏆</span><span><b>${brl(v.total)}</b><small>vendido pela Kommo no mês</small></span></button>`:''}
  </div>`;
}

/* ───────── encaixe no portal da equipe ───────── */
/* os grupos do menu (app12) só existem depois deste arquivo: encaixa na hora de desenhar */
function kmGrupos(){
  try{
    if(typeof GRUPOS_PORTAL !== 'undefined'){ const g = GRUPOS_PORTAL.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('whats')) g.k.splice(g.k.indexOf('pdv')+1, 0, 'whats'); NOMES12.portal.whats = 'Atendimento · Kommo'; }
    if(typeof GRUPOS_ADM !== 'undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('aovivo')); if(g && !g.k.includes('whats')) g.k.splice(g.k.indexOf('aovivo')+1, 0, 'whats'); NOMES12.admin.whats = 'Atendimento · Kommo'; }
  }catch(e){}
}
const _telaPortalV24 = telaPortal;
telaPortal = function telaPortal(){
  kmGrupos(); kmPatchMais();
  const aqui = S.portalTab === 'whats';
  let h;
  if(aqui){
    const orig = portalAtalhos; S.portalTab = 'atalhos'; portalAtalhos = () => kmTela(false);
    try{ h = _telaPortalV24(); } finally { portalAtalhos = orig; S.portalTab = 'whats'; }
    h = h.replace(`class="aba on" style="flex:0 0 auto" onclick="S.portalTab='atalhos'`, `class="aba " style="flex:0 0 auto" onclick="S.portalTab='atalhos'`);
  } else h = _telaPortalV24();
  const n = KM.res?.esperando?.itens?.length || 0;
  const btn = `<button class="aba ${aqui?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='whats';S.protoAberto=null;render()"><i class="ti ti-messages"></i> Atendimento ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const a = h.indexOf(`onclick="S.portalTab='arena'`);
  if(a > 0){ const ini = h.lastIndexOf('<button', a); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _portalInicioV24 = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioV24(), c = kmCartaoInicio();
  if(!c) return h;
  const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
  return f >= 0 ? h.slice(0, f+6) + c + h.slice(f+6) : c + h;
};
/* "Mais" do celular (app12 monta os blocos depois deste arquivo): o bloco do WhatsApp entra na hora de desenhar */
function kmPatchMais(){
  if(window._kmMais) return; window._kmMais = true;
  const base = portalMais;
  portalMais = function portalMais(){
    const g = typeof GRUPOS_PORTAL!=='undefined' ? GRUPOS_PORTAL.find(x=>x.k.includes('whats')) : null, i = g ? g.k.indexOf('whats') : -1;
    if(i >= 0) g.k.splice(i, 1);
    let h; try{ h = base(); } finally { if(i >= 0) g.k.splice(i, 0, 'whats'); }
    const n = KM.res?.esperando?.itens?.length || 0;
    const tile = `<button class="tile" style="--cor:var(--g-vendas)" onclick="S.portalTab='whats';render()"><i class="ti ti-messages"></i><b>Atendimento · Kommo</b><small>${n?n+' esperando resposta':'Fila, tarefas e funil'}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
    const a = h.indexOf('<div class="tiles">');
    return a >= 0 ? h.slice(0, a+19) + tile + h.slice(a+19) : tile + h;
  };
}

/* ───────── encaixe na Administração ───────── */
const _telaAdminV24 = telaAdmin;
telaAdmin = function telaAdmin(){
  kmGrupos();
  const A = S.adm, aqui = A.tab === 'whats';
  if(aqui) A.tab = 'regras';
  let h;
  try{ h = _telaAdminV24(); } finally { if(aqui) A.tab = 'whats'; }
  if(aqui){
    const base = admRegras(), i = h.lastIndexOf(base);
    if(i >= 0) h = h.slice(0, i) + kmTela(true) + h.slice(i + base.length);
    h = h.replace(`class="aba on" onclick="S.adm.tab='regras'`, `class="aba " onclick="S.adm.tab='regras'`);
  }
  const n = KM.quem==='admin' ? (KM.res?.esperando?.itens?.length || 0) : 0;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='whats';TR=null;render()"><i class="ti ti-messages"></i> Atendimento ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV24 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV24(), adm = !!(S.adm && S.tela==='admin');
  if(adm || S.sess) r.unshift({t:'Atendimento · Kommo', s:'WhatsApp e Instagram: clientes esperando resposta, tarefas, funil e vendas', i:'ti-messages', go:()=>{ if(adm) S.adm.tab='whats'; else { S.tela='portal'; S.portalTab='whats'; } render(); }});
  return r;
};
