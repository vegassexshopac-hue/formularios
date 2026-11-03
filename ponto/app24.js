/* ═══════════ Portal Equipe Las Vegas · v24 — WHATSAPP · KOMMO ═══════════
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
  if(KM.carregando || (!forcar && KM.res && Date.now()-KM.t < 25e3)) return;
  KM.carregando = true;
  try{ KM.res = await kmApi('/api/resumo'); KM.erro=''; KM.t = Date.now(); KM.tar = KM.res.tarefas?.itens ? KM.res.tarefas : KM.tar; }
  catch(e){ KM.erro = e.message; }
  finally{ KM.carregando = false; }
  kmRepintar();
}
function naTelaKm(){ return (S.tela==='portal' && S.portalTab==='whats') || (S.tela==='admin' && S.adm?.tab==='whats'); }
function kmRepintar(){ if(typeof modalAberto==='function' && modalAberto()) return; const ae = document.activeElement; if(ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return; if(naTelaKm() || (S.tela==='portal' && S.portalTab==='inicio')) render(); }
function kmRelogio(){
  clearInterval(KM.timer);
  KM.timer = setInterval(()=>{ if(document.hidden || (KM.sub==='config' && naTelaKm())) return; if(naTelaKm() || (S.tela==='portal' && S.portalTab==='inicio')) kmCarregar(true); }, 30e3);
}
kmRelogio();

/* ───────── pedacinhos ───────── */
function kmMin(m){ if(m < 1) return 'agora'; if(m < 60) return m+' min'; const h = Math.floor(m/60); return h < 24 ? h+'h'+(m%60?String(m%60).padStart(2,'0'):'') : Math.floor(h/24)+'d'; }
function kmClasseTempo(min, prazo){ return min >= prazo ? 'bad' : min >= prazo*.6 ? 'warn' : ''; }
function kmHora(ts){ const d = new Date(ts); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function kmQuando(ts){ const d = new Date(ts), h = new Date(), am = new Date(); am.setDate(h.getDate()+1);
  const hr = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  if(d.toDateString()===h.toDateString()) return 'hoje '+hr; if(d.toDateString()===am.toDateString()) return 'amanhã '+hr; return kmHora(ts); }
function kmVazio(em, t, s){ return `<div class="km-vazio"><span class="em">${em}</span><b>${t}</b>${s?`<p style="margin:4px 0 0;font-size:13.5px">${s}</p>`:''}</div>`; }
function kmSemUsuario(){ return `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-link"></i><div><b>Seu usuário da Kommo ainda não está ligado ao seu nome.</b> Avise a administração (Administração › WhatsApp · Kommo › Configurar). Enquanto isso você vê a fila da loja, mas não as suas tarefas e vendas.</div></div>`; }
function kmErroHtml(){
  return `<div class="nota" style="border-color:var(--vermelho);margin-bottom:12px"><i class="ti ti-plug-x"></i><div><b>Não consegui falar com a Kommo.</b> ${esc(KM.erro)}<br><button class="btn p" style="margin-top:8px" onclick="kmCarregar(true)"><i class="ti ti-refresh"></i> Tentar de novo</button></div></div>`;
}

/* ───────── esperando resposta ───────── */
function kmEsperando(adm){
  const e = KM.res?.esperando; if(!e || e.erro) return e?.erro ? `<p class="suave">${esc(e.erro)}</p>` : '';
  const it = e.itens||[], atras = it.filter(i=>i.atrasada).length, minhas = it.filter(i=>i.minha).length;
  const topo = `<div class="km-topo ${atras?'alerta':''}"><span class="big">${it.length}</span><div class="cresce"><b>${it.length?(it.length===1?'cliente esperando resposta':'clientes esperando resposta'):'Ninguém esperando 🎉'}</b>
    <small>${atras?`${atras} passou de ${e.prazoMin} min · `:''}${!adm&&minhas?`${minhas} ${minhas===1?'é sua':'são suas'} · `:''}${e.lojaAberta?'loja aberta':'fora do horário — o relógio do prazo está parado'}</small></div><span class="ic">${atras?'⏰':'💬'}</span></div>`;
  if(!it.length) return topo + kmVazio('💚','Todas as clientes foram respondidas.','A lista atualiza sozinha a cada 30 segundos.');
  const ordem = adm ? it : [...it].sort((a,b)=>(b.minha-a.minha) || (a.desde-b.desde));
  return topo + `<div class="km-lista">${ordem.map((i,n)=>`<div class="km-cli ${i.atrasada?'atrasada':''} ${i.minha?'minha':''}" style="animation-delay:${Math.min(n,12)*35}ms" onclick="${i.lead?`kmFicha(${i.lead})`:''}">
    <span class="av">${esc(iniciais(i.nome))}</span>
    <div class="t"><b>${esc(i.nome)}</b><small>${i.respNome?esc(primeiroNome(i.respNome)):'sem responsável'}${i.tel?' · '+esc(i.tel):''}</small></div>
    <span class="km-tempo ${kmClasseTempo(i.minUteis, e.prazoMin)}">${kmMin(i.minUteis)}</span>
    ${i.link?`<a class="km-ir" href="${esc(i.link)}" target="_blank" rel="noopener" title="Responder na Kommo" onclick="event.stopPropagation()"><i class="ti ti-brand-whatsapp"></i></a>`:''}</div>`).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin-top:8px">O tempo conta só no horário da loja. Toque no nome para ver a ficha; no botão verde para responder na Kommo.</p>`;
}

/* ───────── tarefas ───────── */
function kmTarefas(adm){
  const t = KM.tar || KM.res?.tarefas;
  if(!t) return `<p class="suave"><i class="ti ti-loader-2"></i> Carregando tarefas…</p>`;
  if(t.erro) return `<p class="suave">${esc(t.erro)}</p>`;
  if(t.semUsuario) return kmSemUsuario();
  const us = t.usuarios||[];
  const filtro = adm ? `<div class="linha quebra" style="gap:8px;margin-bottom:10px"><select class="inp" style="max-width:240px" onchange="KM.tarQuem=this.value;kmTarCarregar()"><option value="">Todas as pessoas</option>${us.map(u=>`<option value="${u.id}" ${String(KM.tarQuem)===String(u.id)?'selected':''}>${esc(u.nome)}</option>`).join('')}</select></div>` : '';
  const it = t.itens||[];
  if(!it.length) return filtro + kmVazio('✅','Nenhuma tarefa aberta.', adm?'':'Quando alguém criar uma tarefa para você na Kommo, ela aparece aqui.');
  const grupos = [['Atrasadas','ti-alarm',it.filter(x=>x.atrasada)],['Hoje','ti-sun',it.filter(x=>!x.atrasada&&x.hoje)],['Próximas','ti-calendar',it.filter(x=>!x.atrasada&&!x.hoje)]];
  let n = 0;
  return filtro + grupos.filter(g=>g[2].length).map(([nome,ic,ls])=>`<div class="km-grupo"><i class="ti ${ic}"></i>${nome} · ${ls.length}</div><div class="km-lista">${ls.map(x=>`
    <div class="km-tar ${x.atrasada?'atrasada':''}" id="kmt-${x.id}" style="animation-delay:${Math.min(n++,12)*35}ms">
      <div class="tx">${esc(x.texto||'Tarefa')}</div>
      <div class="meta"><span class="km-tempo ${x.atrasada?'bad':x.hoje?'warn':''}"><i class="ti ti-clock"></i> ${kmQuando(x.prazo)}</span>${x.cliente?`<span>👤 ${x.lead?`<a href="#" onclick="event.preventDefault();kmFicha(${x.lead})">${esc(x.cliente)}</a>`:esc(x.cliente)}</span>`:''}${adm&&x.respNome?`<span>· ${esc(primeiroNome(x.respNome))}</span>`:''}</div>
      <div class="acoes"><button class="km-b-ok" onclick="kmTarConcluir(${x.id})"><i class="ti ti-check"></i>Concluir</button><button class="km-b-2" onclick="kmTarRemarcar(${x.id})"><i class="ti ti-clock-edit"></i>Remarcar</button><button class="km-b-2" onclick="kmTarRepassar(${x.id})"><i class="ti ti-arrow-forward-up"></i>Repassar</button>${x.link?`<a class="km-ir" style="margin-left:auto" href="${esc(x.link)}" target="_blank" rel="noopener" title="Abrir na Kommo"><i class="ti ti-external-link"></i></a>`:''}</div>
    </div>`).join('')}</div>`).join('');
}
async function kmTarCarregar(){
  try{ KM.tar = await kmApi('/api/tarefas'+(S.tela==='admin'&&KM.tarQuem?'?todas='+KM.tarQuem:'')); }catch(e){ toast(e.message, true); }
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
  const us = (KM.tar||KM.res?.tarefas)?.usuarios||[];
  kmModal('↪️ Repassar para', `<div class="km-lista">${us.map(u=>`<button class="btn" style="justify-content:flex-start" onclick="fecharModal();kmTarAgir(${id},{acao:'repassar',para:${u.id}},'Repassada para ${esc(primeiroNome(u.nome)).replace(/'/g,'')} ✔')"><span class="av" style="width:28px;height:28px;border-radius:50%;display:inline-grid;place-items:center;background:var(--veludo2);font-size:12px;font-weight:800;margin-right:8px">${esc(iniciais(u.nome))}</span>${esc(u.nome)}</button>`).join('') || '<p class="suave">Nenhuma pessoa encontrada na Kommo.</p>'}</div>`);
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
      ${e.leads.map((l,j)=>`<button class="km-card ${l.minha?'minha':''}" style="animation-delay:${Math.min(j,10)*30}ms" onclick="kmFicha(${l.id})"><b>${l.esperando?'<span class="zap">💬</span> ':''}${esc(l.nome)}</b><small>${l.respNome?esc(primeiroNome(l.respNome)):'—'}${l.valor?' · '+brl(l.valor):''}${l.parado>=3?` · <span style="color:var(--vermelho2)">${l.parado}d parada</span>`:''}</small></button>`).join('')}
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
        <div class="km-kpi"><small>Atende</small><b style="font-size:16px">${esc(f.respNome||'—')}</b></div>
        <div class="km-kpi"><small>Valor</small><b style="font-size:16px">${f.valor?brl2(f.valor):'—'}</b></div>
        <div class="km-kpi"><small>WhatsApp</small><b style="font-size:16px">${f.tel?esc(adm?fmtTel(f.tel):f.tel):'—'}</b></div>
      </div>
      <div class="campo"><label>Etapa</label><select class="inp" id="km-etapa" onchange="kmMoverEtapa(${f.id}, this.value)">${f.etapas.map(e=>`<option value="${e.id}" ${e.id===f.etapaId?'selected':''}>${esc(e.nome)}</option>`).join('')}${f.etapas.some(e=>e.id===f.etapaId)?'':`<option selected>${esc(f.etapa)}</option>`}</select></div>
      <p class="apagado" style="font-size:12.5px;margin:-4px 0 10px">Na Kommo desde ${kmHora(f.criado)} · mexida em ${kmHora(f.atualizado)}${f.ultEntrada?` · última mensagem dela ${kmHora(f.ultEntrada)}`:''}${f.ultSaida?` · última resposta ${kmHora(f.ultSaida)}`:''}</p>
      <b style="font-size:14px">📌 Tarefas abertas</b>
      <div class="km-lista" style="margin:6px 0 12px">${f.tarefas.length?f.tarefas.map(t=>`<div class="km-cli" style="cursor:default"><div class="t"><b style="white-space:normal">${esc(t.texto||'Tarefa')}</b><small>${kmQuando(t.prazo)}</small></div><button class="km-ir" style="background:#1a7f4b" title="Concluir" onclick="fecharModal();kmTarConcluir(${t.id})"><i class="ti ti-check"></i></button></div>`).join(''):'<p class="suave" style="font-size:13.5px;margin:0">Nenhuma.</p>'}</div>
      <div id="km-fid"></div>
      <div class="linha quebra" style="gap:8px">
        <a class="btn pri" href="${esc(f.link)}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Abrir na Kommo</a>
        ${typeof fidApi==='function'||typeof fidAdm==='function'?`<button class="btn" onclick="kmFidelidade('${esc(f.nome).replace(/'/g,'')}','${esc(adm?f.tel:f.telFinal)}')"><i class="ti ti-heart-handshake"></i> Cartão fidelidade</button>`:''}
      </div>
    </div></div></div>`;
}
async function kmMoverEtapa(id, etapa){
  try{ await kmApi('/api/lead/'+id+'/etapa', {etapa:Number(etapa)}); toast('Etapa atualizada na Kommo ✔'); KM.funil = null; kmCarregar(true); }
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
      : `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-heart-handshake"></i><div>Ainda não tem cartão fidelidade com esse WhatsApp. Cadastre na próxima compra pelo PDV.</div></div>`;
  }catch(e){ box.innerHTML = `<p class="apagado" style="font-size:13px">Cartão fidelidade indisponível: ${esc(e.message)}</p>`; }
}

/* ───────── meus números (equipe) ───────── */
function kmMeusNumeros(){
  const v = KM.res?.vendas?.eu, t = KM.res?.tempo?.eu, pz = KM.res?.tempo?.prazoMin || 10;
  if(!KM.res?.temUsuario) return kmSemUsuario();
  const med = s => s==null ? '—' : s < 60 ? s+' s' : Math.round(s/60)+' min';
  return `<div class="km-kpis">
    <div class="km-kpi"><small>Vendas no WhatsApp (mês)</small><b class="num">${v?brl(v.total):'—'}</b><small>${v?v.n+(v.n===1?' venda ganha':' vendas ganhas'):''}</small></div>
    <div class="km-kpi" style="animation-delay:60ms"><small>Hoje no WhatsApp</small><b class="num">${v?brl(v.hoje):'—'}</b></div>
    <div class="km-kpi" style="animation-delay:120ms"><small>Seu tempo de resposta (hoje)</small><b>${med(t?.hoje?.mediana)}</b><small>${t?.hoje?.n?t.hoje.n+' respostas':'sem respostas hoje'}</small></div>
    <div class="km-kpi" style="animation-delay:180ms"><small>Dentro de ${pz} min (7 dias)</small><b>${t?.semana?.dentro!=null?t.semana.dentro+'%':'—'}</b><div class="km-barra"><i style="width:${t?.semana?.dentro||0}%"></i></div></div>
  </div><p class="apagado" style="font-size:12.5px">Só você contra você: compare com a semana passada. As vendas contam quando a cliente vai para “venda ganha” na Kommo com você como responsável.</p>`;
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
    <p class="apagado" style="font-size:12.5px">Conta cada cliente que foi para “venda ganha” na Kommo, pelo valor do lead e pela responsável. Ainda não soma na meta do PDV, para não contar duas vezes a venda que também passou no caixa.</p>`;
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
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🔗 Quem é quem</h3><p class="apagado" style="font-size:13px;margin:0 0 10px">Ligue cada usuário da Kommo à colaboradora do portal. É isso que faz as tarefas, as vendas e o tempo de resposta aparecerem para cada uma.</p>
      ${c.usuarios.filter(u=>u.ativo).map(u=>`<div class="linha entre" style="gap:10px;padding:6px 0;border-bottom:1px solid var(--linha2)"><span><b>${esc(u.nome)}</b><br><small class="apagado">Kommo #${u.id}</small></span><select class="inp km-map" data-uid="${u.id}" style="max-width:220px"><option value="">— ninguém —</option>${colabs.map(x=>`<option value="${x.id}" ${c.mapa[u.id]===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>`).join('')}</div>
    <div class="cartao pad"><h3 style="margin:0 0 10px;font-size:16px">⏰ Prazo e horário</h3>
      <div class="fid-g2"><div class="campo"><label>Prazo para responder (min)</label><input class="inp" type="number" id="km-prazo" min="1" max="240" value="${c.cfg.prazoMin}"></div>
      <div class="campo"><label>Horário da loja</label><div class="linha" style="gap:6px"><input class="inp" type="time" id="km-ini" value="${c.cfg.ini}"><span>às</span><input class="inp" type="time" id="km-fim" value="${c.cfg.fim}"></div></div></div>
      <div class="linha quebra" style="gap:6px;margin:4px 0 10px">${dias.map((d,i)=>`<label class="selo" style="cursor:pointer"><input type="checkbox" class="km-dia" value="${i}" ${c.cfg.dias.includes(i)?'checked':''}> ${d}</label>`).join('')}</div>
      <label class="linha" style="gap:8px;margin-bottom:12px;cursor:pointer"><input type="checkbox" id="km-masc" ${c.cfg.mascararTel?'checked':''}> Esconder o WhatsApp da cliente da equipe (mostra só o final)</label>
      <button class="btn pri" onclick="kmCfgSalvar()"><i class="ti ti-device-floppy"></i> Salvar</button></div>`;
}
async function kmCfgCarregar(){ if(KM._cc) return; KM._cc = true; try{ KM.cfg = await kmApi('/api/admin/usuarios'); }catch(e){ KM.cfg = {erro:e.message}; } finally{ KM._cc = false; } kmRepintar(); }
async function kmCfgSalvar(){
  const mapa = {}; document.querySelectorAll('.km-map').forEach(s=>{ if(s.value) mapa[s.dataset.uid] = s.value; });
  const dias = [...document.querySelectorAll('.km-dia:checked')].map(x=>+x.value);
  try{ const r = await kmApi('/api/admin/salvar', {mapa, cfg:{prazoMin:+$('#km-prazo').value, ini:$('#km-ini').value, fim:$('#km-fim').value, dias, mascararTel:$('#km-masc').checked}});
    KM.cfg = {...KM.cfg, mapa:r.mapa, cfg:r.cfg}; KM.vend = null; toast('Configuração salva ✔'); kmCarregar(true); render(); }
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
  return `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><h2 class="secao" style="margin:0">💬 WhatsApp · Kommo</h2><span class="apagado" style="font-size:12.5px">${KM.carregando?'<i class="ti ti-loader-2"></i> atualizando…':KM.t?'atualizado '+new Date(KM.t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''} <button class="icone" title="Atualizar" onclick="KM.funil=null;KM.vend=null;kmCarregar(true);if(KM.sub==='tarefas')kmTarCarregar()"><i class="ti ti-refresh"></i></button></span></div>
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
    <button class="${atras?'alerta':''}" onclick="S.portalTab='whats';KM.sub='esperando';render()"><span class="ic">💬</span><span><b>${e.length}</b><small>${minhas.length?minhas.length+' sua(s) · ':''}esperando no WhatsApp</small></span></button>
    <button style="animation-delay:60ms" onclick="S.portalTab='whats';KM.sub='tarefas';kmTarCarregar();render()"><span class="ic">📌</span><span><b>${ta}</b><small>tarefas para hoje</small></span></button>
    ${v?`<button style="animation-delay:120ms" onclick="S.portalTab='whats';KM.sub='numeros';render()"><span class="ic">🏆</span><span><b>${brl(v.total)}</b><small>vendido no WhatsApp no mês</small></span></button>`:''}
  </div>`;
}

/* ───────── encaixe no portal da equipe ───────── */
/* os grupos do menu (app12) só existem depois deste arquivo: encaixa na hora de desenhar */
function kmGrupos(){
  try{
    if(typeof GRUPOS_PORTAL !== 'undefined'){ const g = GRUPOS_PORTAL.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('whats')) g.k.splice(g.k.indexOf('pdv')+1, 0, 'whats'); NOMES12.portal.whats = 'WhatsApp · Kommo'; }
    if(typeof GRUPOS_ADM !== 'undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('aovivo')); if(g && !g.k.includes('whats')) g.k.splice(g.k.indexOf('aovivo')+1, 0, 'whats'); NOMES12.admin.whats = 'WhatsApp · Kommo'; }
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
  const btn = `<button class="aba ${aqui?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='whats';S.protoAberto=null;render()"><i class="ti ti-brand-whatsapp"></i> WhatsApp ${n?`<span class="contador">${n}</span>`:''}</button>`;
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
    const tile = `<button class="tile" style="--cor:var(--g-vendas)" onclick="S.portalTab='whats';render()"><i class="ti ti-brand-whatsapp"></i><b>WhatsApp · Kommo</b><small>${n?n+' esperando resposta':'Fila, tarefas e funil'}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
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
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='whats';TR=null;render()"><i class="ti ti-brand-whatsapp"></i> WhatsApp ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV24 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV24(), adm = !!(S.adm && S.tela==='admin');
  if(adm || S.sess) r.unshift({t:'WhatsApp · Kommo', s:'Clientes esperando resposta, tarefas, funil e vendas', i:'ti-brand-whatsapp', go:()=>{ if(adm) S.adm.tab='whats'; else { S.tela='portal'; S.portalTab='whats'; } render(); }});
  return r;
};
