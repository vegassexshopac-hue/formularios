/* ═══════════ v66: Pós-venda (25/11/2026) ═══════════
   Pedido da Madu: "botão no portal com acesso às vendedoras pra conseguirem o número do WhatsApp da cliente pra fazer pós-venda".
   Decisões dela: botão abre o WhatsApp com mensagem pronta (número continua mascarado na tela) · qualquer cliente da loja ·
   lista no Início + botão em cada venda de "Minhas vendas".
   • Início da equipe: botão "🛍️ Pós-venda" (sempre visível com o PDV ligado) → janela com busca de qualquer cliente
     + lista de quem comprou há 2 a 7 dias (as vendas dela primeiro), com Mandar / ✓ / Desfazer.
   • Minhas vendas: venda com cliente identificada ganha o botão "Pós-venda".
   • Administração › Vendas › Clientes › Para chamar: seção Pós-venda.
   • Todo número pego fica registrado (aba Contatos: quem, quando, qual cliente). Nada de produto na mensagem.
   • v66b: ficha da cliente (toque no nome ou "Ficha da cliente" em Minhas vendas): compras do portal + sistema antigo,
     quem vendeu, o que ela mais leva, cartão fidelidade/cashback, quem já chamou. Telefone continua mascarado.
   • Servidor: POSVENDA.gs (último no Apps Script). Para voltar: tirar a linha do app66 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
.pv66-card{background:linear-gradient(120deg,#0f5132,#1a7f4b 60%,#25D366);color:#fff;border:0;border-radius:18px;padding:13px 16px;margin:12px 0;width:100%;display:flex;gap:12px;align-items:center;text-align:left;font:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(26,127,75,.25);animation:pv66Sobe .4s both;transition:transform .15s var(--mola,ease)}
.pv66-card:hover{transform:translateY(-2px)}.pv66-card:active{transform:scale(.98)}
.pv66-card .ic{font-size:28px;animation:pv66Bal 2.8s ease-in-out infinite}
.pv66-card b{display:block;font-size:15.5px}.pv66-card small{display:block;font-size:12.5px;opacity:.92;line-height:1.35}
.pv66-card .n{background:#fff;color:#1a7f4b;font-weight:800;border-radius:99px;padding:2px 10px;font-size:13px;margin-left:auto;flex:none;animation:pv66Pulso 1.8s ease-in-out infinite}
@keyframes pv66Sobe{from{opacity:0;transform:translateY(8px)}}
@keyframes pv66Bal{0%,100%{transform:rotate(0)}10%{transform:rotate(-12deg)}20%{transform:rotate(10deg)}30%{transform:rotate(0)}}
@keyframes pv66Pulso{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.6)}50%{box-shadow:0 0 0 6px rgba(255,255,255,0)}}
.pv66-busca{position:relative;margin:2px 0 12px}
.pv66-busca input{width:100%;padding:12px 14px 12px 40px;border-radius:14px;border:1.5px solid var(--linha2,#ddd);font:inherit;font-size:15px;background:#fff}
.pv66-busca input:focus{outline:0;border-color:#25D366;box-shadow:0 0 0 3px rgba(37,211,102,.15)}
.pv66-busca>i{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:19px;color:var(--creme2,#888)}
.pv66-it{display:flex;gap:10px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--linha,#eee);animation:pv66Sobe .3s both}
.pv66-it.foi{opacity:.5}.pv66-it .t{flex:1;min-width:0}.pv66-it .t b{display:block;font-size:14.5px}.pv66-it .t small{display:block;color:var(--creme2,#777);font-size:12.5px;line-height:1.35}
.pv66-it .av{font-size:22px;flex:none}
.pv66-tag{display:inline-block;font-size:11px;font-weight:700;border-radius:99px;padding:1px 8px;margin-left:4px;vertical-align:1px;background:#e8f7ee;color:#1a7f4b}
.pv66-tag.k{background:#eef3ff;color:#3355aa}
.pv66-zap{background:#25D366;color:#fff;border:0;border-radius:12px;padding:8px 12px;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;gap:5px;align-items:center;flex:none;transition:transform .12s}
.pv66-zap:hover{transform:translateY(-1px)}.pv66-zap:active{transform:scale(.95)}.pv66-zap[disabled]{opacity:.6}
.pv66-ok{background:none;border:1px solid var(--linha2,#ddd);border-radius:12px;padding:7px 10px;font:inherit;font-size:13px;cursor:pointer;flex:none}
.pv66-seg{display:flex;gap:6px;margin:4px 0 6px}.pv66-seg button{border:1px solid var(--linha2,#ddd);background:#fff;border-radius:99px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}
.pv66-seg button.on{background:#1a7f4b;border-color:#1a7f4b;color:#fff}
.pv66-sec{display:flex;align-items:center;gap:8px;margin:14px 0 2px}.pv66-sec h4{margin:0;font-size:15px}
.btn.pv66-bt{background:#25D366;color:#fff;border-color:#25D366}
.pv66-it .t.lk{cursor:pointer}.pv66-it .t.lk b{text-decoration:underline dotted 1.5px;text-underline-offset:3px}
.pv66-fx{position:fixed;inset:0;z-index:140;background:rgba(20,10,12,.45);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px;animation:pv66Fade .2s}
@keyframes pv66Fade{from{opacity:0}}
.pv66-fc{background:var(--fundo,#f6f4f4);border-radius:22px;width:100%;max-width:760px;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;animation:pv66Sobe .3s both}
.pv66-fh{background:linear-gradient(120deg,#a50d1c,#e11d2e 60%,#ff4d5e);color:#fff;padding:18px 18px 16px;position:relative}
.pv66-fh h3{margin:0 0 6px;font-size:21px;padding-right:40px}.pv66-fh .x{position:absolute;right:12px;top:12px;background:rgba(255,255,255,.2);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px}
.pv66-fh .chips{display:flex;flex-wrap:wrap;gap:6px}.pv66-fh .chips span{background:rgba(255,255,255,.18);border-radius:99px;padding:3px 10px;font-size:12.5px}
.pv66-fh .acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.pv66-fh .acts button{background:#fff;color:#1a7f4b;border:0;border-radius:12px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.pv66-fb{padding:14px 16px 18px}
.pv66-k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}@media(max-width:560px){.pv66-k{grid-template-columns:repeat(2,1fr)}}
.pv66-k div{background:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 1px 3px rgba(0,0,0,.05);animation:pv66Sobe .35s both}
.pv66-k small{display:block;color:var(--creme2,#777);font-size:11.5px}.pv66-k b{font-size:18px}
.pv66-bx{background:#fff;border-radius:16px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.pv66-bx h4{margin:0 0 8px;font-size:14.5px}
.pv66-fav{display:flex;flex-wrap:wrap;gap:8px}.pv66-fav span{display:inline-flex;align-items:center;gap:6px;background:var(--fundo,#f6f4f4);border-radius:12px;padding:4px 10px 4px 4px;font-size:13px}
.pv66-fav span .pf,.pv66-fav span .pf-emo{border-radius:9px}
.pv66-fav .q{background:#fff3d6;color:#8a5a00;font-weight:800;border-radius:99px;padding:0 7px;font-size:11.5px}
.pv66-h{border-top:1px solid var(--linha,#eee);padding:9px 0}.pv66-h:first-of-type{border-top:0}
.pv66-h .l1{display:flex;gap:8px;align-items:baseline}.pv66-h .l1 b{font-size:14px}.pv66-h .l1 .v{margin-left:auto;font-weight:800;white-space:nowrap}
.pv66-h .l1 small{color:var(--creme2,#777);font-size:12.5px}.pv66-h .its{font-size:12.5px;color:#444;margin-top:3px;line-height:1.45}
.pv66-h .tg{font-size:10.5px;font-weight:700;border-radius:99px;padding:1px 7px;background:#eee;color:#555;margin-left:4px}
.pv66-h .tg.k{background:#eef3ff;color:#3355aa}.pv66-h .tg.a{background:#f3ecdf;color:#7a5a2a}

`; document.head.appendChild(st); })();

const PV66 = { q:'', res:null, t:null, esperando:false, falhou:false, filtro:'minhas', feitos:new Set(), ok:new Set() };
const pv66Admin = () => S.tela==='admin' && !!S.adm;
const pv66Eu = () => { try{ return primeiroNome(S.sess.dados.colaboradora.nome); }catch(e){ return ''; } };
function pv66Lista(){ return (typeof REL!=='undefined' && REL.d && REL.d.posvenda) || []; }
function pv66Pend(){ return pv66Lista().filter(x=>!PV66.feitos.has(x.id+'|'+x.ref)); }
function pv66Msg(nome, cash){
  const eu = pv66Admin() ? '' : pv66Eu(), n = primeiroNome(nome||'');
  return `*Oi, ${n}!* 💋\n${eu?`Aqui é a *${eu}*, da Las Vegas.`:'Aqui é da *Las Vegas*.'} Passando pra saber se deu tudo certo com a sua compra e se ficou alguma dúvida — tô aqui pra te ajudar no que precisar! 😊`
    + (cash && cash.saldo>0 ? `\n\n💸 Lembrando: você tem *${brl2(cash.saldo)} de cashback* pra usar${cash.vence?` até *${ddmm(cash.vence)}*`:''}.` : '')
    + `\n\n_Obrigada pela confiança!_ ❤️`;
}
async function pv66Api(dados){
  return pv66Admin() ? api('admRelacionamento', {...S.adm.cred, ...dados}) : api('relacionamento', {eid:S.sess.eid, ...S.sess.cred, ...dados});
}

/* abre o WhatsApp da cliente (o número vem do servidor na hora e fica registrado quem pegou) */
async function pv66Zap(cliente_id, venda_id, bt){
  if(bt) bt.disabled = true;
  const w = window.open('', '_blank');          // abre já: o navegador bloqueia janela aberta depois de esperar
  try{
    const r = await pv66Api({op:'zap', cliente_id, venda_id: venda_id||''});
    const url = 'https://wa.me/'+telWa(r.tel)+'?text='+encodeURIComponent(pv66Msg(r.nome, r.cashback));
    if(w) w.location.href = url; else location.href = url;
    if(r.ja) toast(`ℹ️ ${primeiroNome(r.ja.por||'')} já tinha feito o pós-venda dessa cliente (${ddmm(String(r.ja.quando).slice(0,10))})`);
    else toast(r.posvenda ? '💬 Pós-venda registrado' : '💬 Abrindo o WhatsApp de '+primeiroNome(r.nome));
    if(venda_id) PV66.ok.add(venda_id);
    pv66Lista().filter(x=>x.id===cliente_id).forEach(x=>PV66.feitos.add(x.id+'|'+x.ref));
    pv66Pintar(); pv66AtualizarCard();
  }catch(e){
    if(w) try{ w.close(); }catch(_){}
    toast(/desconhecida/i.test(e.message) ? 'O pós-venda ainda não foi ligado no servidor. Avise a administração.' : e.message, true);
  }finally{ if(bt) bt.disabled = false; }
}
async function pv66Feito(id, ref, desfazer){
  const k = id+'|'+ref;
  if(desfazer) PV66.feitos.delete(k); else PV66.feitos.add(k);
  pv66Pintar(); pv66AtualizarCard();
  try{ await pv66Api({op:'feito', tipo:'posvenda', cliente_id:id, ref, desfazer: desfazer?1:''}); }
  catch(e){ toast(e.message, true); if(desfazer) PV66.feitos.add(k); else PV66.feitos.delete(k); pv66Pintar(); }
}

/* ───────── itens ───────── */
function pv66Item(x, i){
  const foi = PV66.feitos.has(x.id+'|'+x.ref), minha = !pv66Admin() && x.colaboradora_id===S.sess?.eid;
  const quando = x.dias===0?'hoje':x.dias===1?'ontem':`há ${x.dias} dias`;
  return `<div class="pv66-it ${foi?'foi':''}" style="animation-delay:${Math.min(i,12)*35}ms"><span class="av">🛍️</span>
    <div class="t lk" title="Ver a ficha" onclick="pv66Ficha('${x.id}')"><b>${esc(x.nome)}${minha?'<span class="pv66-tag">sua venda</span>':''}${x.kommo?'<span class="pv66-tag k">WhatsApp/Insta</span>':''}</b>
      <small>Comprou ${quando} (${ddmm(x.data)})${minha?'':' com '+esc(x.vendedora||'—')} · Loja ${esc(S.boot?.lojas?.[x.loja]?.nome||x.loja||'')}${x.compras>1?` · ${x.compras} compras na semana`:''}${x.cashback?` · 💸 ${brl2(x.cashback.saldo)} de cashback`:''}</small></div>
    ${foi?`<button class="pv66-ok" onclick="pv66Feito('${x.id}','${x.ref}',true)">Desfazer</button>`
      :`<button class="pv66-zap" onclick="pv66Zap('${x.id}','${x.ref}',this)"><i class="ti ti-brand-whatsapp"></i> Mandar</button><button class="pv66-ok" title="Já falei com ela" onclick="pv66Feito('${x.id}','${x.ref}')">✓</button>`}</div>`;
}
function pv66ItemBusca(c, i){
  return `<div class="pv66-it" style="animation-delay:${Math.min(i,12)*30}ms"><span class="av">👤</span>
    <div class="t lk" title="Ver a ficha" onclick="pv66Ficha('${c.id}')"><b>${esc(c.nome)}</b><small>WhatsApp ${esc(c.tel_mask||'—')}${c.ultima?` · última compra ${ddmm(String(c.ultima).slice(0,10))}`:''}${c.cashback>0?` · 💸 ${brl2(c.cashback)}`:''}</small></div>
    ${c.tel_mask?`<button class="pv66-zap" onclick="pv66Zap('${c.id}','',this)"><i class="ti ti-brand-whatsapp"></i> Chamar</button>`:'<small class="apagado">sem WhatsApp</small>'}</div>`;
}


/* carrega a lista UMA vez (v66c: tocar no botão enquanto a lista ainda carregava travava a página num laço) */
function pv66Carregar(forcar){
  if(PV66.esperando || typeof relCarregar!=='function') return;
  PV66.esperando = true;
  const fim = () => { PV66.esperando = false; if(!REL.d) PV66.falhou = true; pv66Pintar(); pv66AtualizarCard(); };
  if(REL.carregando){ const t = setInterval(()=>{ if(!REL.carregando){ clearInterval(t); fim(); } }, 300); return; }
  relCarregar(forcar).then(fim, fim);
}
/* ───────── janela (equipe) ───────── */
function pv66ListaHtml(){
  if(PV66.q.trim().length >= 2) return '';
  const d = typeof REL!=='undefined' ? REL.d : null;
  if(!d){
    if(PV66.falhou) return `<div class="nota warn"><i class="ti ti-wifi-off"></i><div>Não deu para carregar a lista agora. <button class="btn p" onclick="PV66.falhou=false;pv66Carregar(true)">Tentar de novo</button></div></div>`;
    pv66Carregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Procurando as clientes…</p>`;
  }
  if(d.semServidor || !d.posvenda) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>Falta o servidor.</b> A administração precisa colar o arquivo <b>POSVENDA</b> no Apps Script e publicar uma nova versão.</div></div>`;
  const eu = S.sess?.eid, todas = d.posvenda;
  const minhas = todas.filter(x=>x.colaboradora_id===eu);
  const ver = PV66.filtro==='minhas' ? minhas : [...minhas, ...todas.filter(x=>x.colaboradora_id!==eu)];
  const cfg = d.cfg_pv || {de:2, ate:7};
  return `<div class="pv66-sec"><span style="font-size:20px">🛍️</span><h4>Compraram há ${cfg.de} a ${cfg.ate} dias</h4></div>
    <div class="pv66-seg"><button class="${PV66.filtro==='minhas'?'on':''}" onclick="PV66.filtro='minhas';pv66Pintar()">Minhas vendas (${minhas.length})</button><button class="${PV66.filtro==='todas'?'on':''}" onclick="PV66.filtro='todas';pv66Pintar()">Loja toda (${todas.length})</button></div>
    ${ver.length ? ver.map(pv66Item).join('') : `<p class="suave" style="font-size:13.5px">${PV66.filtro==='minhas'&&todas.length?'Nenhuma venda sua nesse período — veja a <b>Loja toda</b>.':'Ninguém por enquanto ✨'}</p>`}`;
}
function pv66ResHtml(){
  if(PV66.q.trim().length < 2) return '';
  const R = PV66.res;
  if(!R) return `<p class="suave"><i class="ti ti-loader-2"></i> Procurando…</p>`;
  if(R.erro) return `<p class="suave">${esc(R.erro)}</p>`;
  if(!R.lista.length) return `<p class="suave" style="font-size:13.5px">Nenhuma cliente com esse nome ou número.</p>`;
  return R.lista.map(pv66ItemBusca).join('') + (R.lista.length>=40?'<p class="apagado" style="font-size:12px">Mostrando as 40 mais parecidas — digite mais do nome.</p>':'');
}
function pv66Abrir(){
  PV66.q = ''; PV66.res = null;
  if(typeof REL!=='undefined' && REL.d && !REL.carregando && Date.now()-REL.em > 5*60e3) pv66Carregar(true);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo"><div class="modal-t"><h3 class="cresce">🛍️ Pós-venda</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div><div class="modal-c" id="pv66-corpo">
    <p class="suave" style="margin:0 0 10px;font-size:13.5px">Toque no <b>nome</b> para ver a ficha da cliente (compras, quem vendeu, o que ela mais leva). <b>Mandar</b> abre o WhatsApp com a mensagem pronta — sem produto, e fica registrado que você chamou.</p>
    <div class="pv66-busca"><i class="ti ti-search"></i><input id="pv66-q" type="search" autocomplete="off" placeholder="Procurar qualquer cliente (nome ou final do WhatsApp)" oninput="pv66Buscar(this.value)"></div>
    <div id="pv66-res"></div><div id="pv66-lista">${pv66ListaHtml()}</div></div></div></div>`;
}
function pv66Pintar(){
  const r = document.getElementById('pv66-res'), l = document.getElementById('pv66-lista');
  if(r) r.innerHTML = pv66ResHtml();
  if(l) l.innerHTML = pv66ListaHtml();
  if(pv66Admin() && typeof relPintar==='function') relPintar();
}
function pv66Buscar(q){
  PV66.q = q; clearTimeout(PV66.t);
  if(q.trim().length < 2){ PV66.res = null; pv66Pintar(); return; }
  PV66.res = null; pv66Pintar();
  PV66.t = setTimeout(async ()=>{
    const pedido = q;
    try{ const r = await fidApi('buscar', {q:pedido}); if(PV66.q!==pedido) return; PV66.res = {lista: r.clientes||[]}; }
    catch(e){ if(PV66.q!==pedido) return; PV66.res = {lista:[], erro: /desconhecida|desligada/i.test(e.message) ? 'A busca de clientes ainda não está ligada no servidor.' : e.message}; }
    pv66Pintar();
  }, 350);
}

/* ───────── botão no Início ───────── */
function pv66On(){ return S.tela==='portal' && S.sess?.dados && (typeof mod45On!=='function' || mod45On('pdv')); }
function pv66CardHtml(){
  const n = pv66Pend().filter(x=>x.colaboradora_id===S.sess.eid).length, t = pv66Pend().length;
  return `<button class="pv66-card" id="pv66-card" onclick="pv66Abrir()"><span class="ic">🛍️</span><span style="flex:1"><b>Pós-venda</b>
    <small>${t?`${n?`${n} cliente${n>1?'s':''} sua${n>1?'s':''}`:'Nenhuma sua'} · ${t} na loja para chamar no WhatsApp`:'Chamar qualquer cliente no WhatsApp com a mensagem pronta'}</small></span>${n?`<span class="n">${n}</span>`:''}<i class="ti ti-chevron-right"></i></button>`;
}
function pv66AtualizarCard(){ const el = document.getElementById('pv66-card'); if(el && pv66On()) el.outerHTML = pv66CardHtml(); }
if(typeof portalInicio==='function'){
  const _portalInicioV66 = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioV66.apply(this, arguments);
    let card = ''; try{ if(pv66On()) card = pv66CardHtml(); }catch(e){ console.warn('v66', e); }
    if(!card) return h;
    const a = h.indexOf('class="vr47-at"');
    if(a >= 0){ const f = h.indexOf('</button>', a); if(f >= 0) return h.slice(0, f+9) + card + h.slice(f+9); }
    const j = h.indexOf('class="suave"'), f2 = j >= 0 ? h.indexOf('</div>', j) : -1;
    return f2 >= 0 ? h.slice(0, f2+6) + card + h.slice(f2+6) : card + h;
  };
}

/* ───────── Minhas vendas: botão em cada venda com cliente ───────── */
if(typeof vr47Card==='function'){
  const _vr47CardV66 = vr47Card;
  vr47Card = function vr47Card(v){
    const h = _vr47CardV66.apply(this, arguments);
    if(!v || !v.cliente_id || v.status==='cancelada' || h.indexOf('<div class="vr47-acoes">') < 0) return h;
    const feito = PV66.ok.has(v.id);
    const bt = `<button class="btn pv66-bt" onclick="event.stopPropagation();pv66Zap('${esc(v.cliente_id)}','${esc(v.id)}',this)"><i class="ti ti-message-heart"></i> ${feito?'Pós-venda ✓':'Pós-venda'}</button>`;
    const fc = `<button class="btn" onclick="event.stopPropagation();pv66Ficha('${esc(v.cliente_id)}')"><i class="ti ti-id-badge-2"></i> Ficha da cliente</button>`;
    return h.replace('<div class="vr47-acoes">', '<div class="vr47-acoes">' + bt + fc);
  };
}

/* ───────── Administração › Clientes › Para chamar: seção pós-venda ───────── */
if(typeof relTela==='function'){
  const _relTelaV66 = relTela;
  relTela = function relTela(){
    const h = _relTelaV66.apply(this, arguments);
    if(!pv66Admin() || !REL.d || REL.d.semServidor) return h;
    if(!REL.d.posvenda) return h + `<div class="nota warn" style="margin-top:12px"><i class="ti ti-plug-connected-x"></i><div><b>Pós-venda:</b> falta colar o arquivo <b>POSVENDA</b> no Apps Script e publicar uma nova versão.</div></div>`;
    const l = REL.d.posvenda, cfg = REL.d.cfg_pv || {de:2, ate:7};
    return h + `<div class="rel-sec"><span style="font-size:20px">🛍️</span><h4>Pós-venda <small>(${l.length})</small></h4></div><p class="apagado" style="font-size:12.5px;margin:-2px 0 8px">Compraram há ${cfg.de} a ${cfg.ate} dias (loja e vendas da Kommo lançadas no PDV). Some quando alguém da equipe faz o pós-venda.</p>
      ${l.length ? l.map(pv66Item).join('') : '<p class="suave" style="font-size:13.5px;margin:0 0 6px">Ninguém por enquanto ✨</p>'}`;
  };
}


/* ───────── ficha da cliente (v66b) ───────── */
const PV66F = { d:null, id:null, todas:false };
function pv66Cat(){
  const P = (typeof pdvD==='function' && pdvD().produtos) || [];
  if(PV66F.cat && PV66F.catN === P.length) return PV66F.cat;
  const id = {}, cod = {}, nome = {};
  P.forEach(p=>{ id[p.id] = p; [p.codigo, p.sku].forEach(c=>{ c = String(c||'').replace(/^0+/,'').trim(); if(c && !cod[c]) cod[c] = p; }); const n = semAcento(p.nome||'').replace(/[^a-z0-9]+/g,' ').trim(); if(n && !nome[n]) nome[n] = p; });
  PV66F.cat = {id, cod, nome}; PV66F.catN = P.length; return PV66F.cat;
}
function pv66Prod(i){ const X = pv66Cat(); return (i.id && X.id[i.id]) || X.cod[String(i.cod||'').replace(/^0+/,'').trim()] || X.nome[semAcento(i.nome||'').replace(/[^a-z0-9]+/g,' ').trim()] || null; }
function pv66Ico(i, px){ try{ return typeof pIco==='function' ? pIco(pv66Prod(i) || {nome:i.nome}, px) : ''; }catch(e){ return ''; } }
const pv66D = s => s ? `${String(s).slice(8,10)}/${String(s).slice(5,7)}/${String(s).slice(2,4)}` : '';
async function pv66Ficha(id){
  PV66F.id = id; PV66F.d = null; PV66F.todas = false; pv66FPintar();
  try{ const r = await pv66Api({op:'ficha', cliente_id:id}); if(PV66F.id!==id) return; PV66F.d = r.ficha; }
  catch(e){ if(PV66F.id!==id) return; PV66F.d = {erro: /desconhecida/i.test(e.message) ? 'A ficha ainda não foi ligada no servidor. Avise a administração.' : e.message}; }
  pv66FPintar();
}
function pv66FFechar(){ PV66F.id = null; document.getElementById('pv66-fx')?.remove(); }
function pv66FPintar(){
  if(!PV66F.id) return;
  let el = document.getElementById('pv66-fx');
  if(!el){ el = document.createElement('div'); el.id = 'pv66-fx'; el.className = 'pv66-fx'; el.onclick = e=>{ if(e.target===el) pv66FFechar(); }; document.body.appendChild(el); }
  el.innerHTML = `<div class="pv66-fc">${pv66FHtml()}</div>`;
}
function pv66FHtml(){
  const f = PV66F.d;
  if(!f) return `<div class="pv66-fh"><h3>Ficha da cliente</h3><button class="x" onclick="pv66FFechar()">✕</button><div class="chips"><span>Carregando…</span></div></div><div class="pv66-fb"><p class="suave"><i class="ti ti-loader-2"></i> Buscando as compras…</p></div>`;
  if(f.erro) return `<div class="pv66-fh"><h3>Ficha da cliente</h3><button class="x" onclick="pv66FFechar()">✕</button></div><div class="pv66-fb"><div class="nota warn"><i class="ti ti-info-circle"></i><div>${esc(f.erro)}</div></div></div>`;
  const loja = l => S.boot?.lojas?.[l]?.nome || (l ? l[0].toUpperCase()+l.slice(1) : '');
  const chips = [f.desde?`Cliente desde ${pv66D(f.desde)}`:'', f.aniversario?`🎂 ${f.aniversario.slice(3)}/${f.aniversario.slice(0,2)}`:'', f.loja_fav?`📍 Mais na loja ${loja(f.loja_fav)}`:'', f.tel_mask?`WhatsApp ${f.tel_mask}`:'sem WhatsApp', f.indicado_por?`🤝 indicada por ${primeiroNome(f.indicado_por)}`:'', f.indicacoes?`🤝 indicou ${f.indicacoes}`:''].filter(Boolean);
  const ult = f.ultima ? (f.dias_ultima===0?'hoje':f.dias_ultima===1?'ontem':`há ${f.dias_ultima} dias`) : '—';
  const hist = PV66F.todas ? f.historico : f.historico.slice(0, 8);
  const linha = (v, i) => `<div class="pv66-h" style="animation:pv66Sobe .3s both;animation-delay:${Math.min(i,10)*30}ms"><div class="l1"><b>${pv66D(v.data)}</b><small>${v.hora?esc(v.hora)+' · ':''}${esc(loja(v.loja))}${v.vendedora?' · vendeu: <b>'+esc(v.vendedora)+'</b>':''}</small>${v.origem==='kommo'?'<span class="tg k">WhatsApp/Insta</span>':v.origem==='antigo'?'<span class="tg a">sistema antigo</span>':''}<span class="v">${brl2(v.total)}</span></div>
    <div class="its">${v.itens.length ? v.itens.map(x=>`${Number(x.qtd)!==1?esc(String(x.qtd).replace('.',','))+'× ':''}${esc(x.nome)}`).join(' · ') : '<span class="apagado">sem produtos registrados</span>'}</div></div>`;
  return `<div class="pv66-fh"><h3>${esc(f.nome)}</h3><button class="x" onclick="pv66FFechar()">✕</button>
      <div class="chips">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>
      <div class="acts">${f.tem_zap?`<button onclick="pv66Zap('${esc(f.id)}','',this)"><i class="ti ti-brand-whatsapp"></i> Chamar no WhatsApp</button>`:''}</div></div>
    <div class="pv66-fb">
      <div class="pv66-k"><div><small>Compras</small><b class="num">${f.compras}</b></div><div style="animation-delay:40ms"><small>Já gastou</small><b class="num">${brl2(f.gasto)}</b></div><div style="animation-delay:80ms"><small>Ticket médio</small><b class="num">${brl2(f.ticket)}</b></div><div style="animation-delay:120ms"><small>Última compra</small><b>${ult}</b></div></div>
      <div class="pv66-bx"><h4>💳 Cartão fidelidade</h4><div style="font-size:13.5px">💋 <b>${f.no_cartao} de ${f.ciclo}</b> selos no cartão${f.selos>f.no_cartao?` (${f.selos} no total)`:''}${f.premios_pendentes?` · <b style="color:var(--vermelho,#d00)">🎁 ${f.premios_pendentes} prêmio${f.premios_pendentes>1?'s':''} para entregar</b>`:''}${f.cashback?` · 💸 <b>${brl2(f.cashback.saldo)}</b> de cashback${f.cashback.vence?' até '+pv66D(f.cashback.vence):''}`:' · sem cashback agora'}</div></div>
      ${f.top.length?`<div class="pv66-bx"><h4>❤️ O que ela mais leva</h4><div class="pv66-fav">${f.top.map(p=>`<span>${pv66Ico(p,30)}${esc(p.nome)}${p.vezes>1?` <i class="q">${p.vezes}×</i>`:''}</span>`).join('')}</div></div>`:''}
      ${f.quem.length?`<div class="pv66-bx"><h4>🙋‍♀️ Quem mais atende</h4><div class="pv66-fav">${f.quem.map(q=>`<span style="padding-left:10px">${esc(q.nome)} <i class="q">${q.vezes}×</i></span>`).join('')}</div></div>`:''}
      ${f.obs?`<div class="pv66-bx"><h4>📝 Observação</h4><div style="font-size:13.5px">${esc(f.obs)}</div></div>`:''}
      <div class="pv66-bx"><h4>🛍️ Histórico de compras <small class="apagado">(${f.historico_total})</small></h4>${hist.length?hist.map(linha).join(''):'<p class="suave" style="font-size:13.5px;margin:0">Nenhuma compra registrada ainda.</p>'}
        ${!PV66F.todas && f.historico.length>8?`<button class="btn p" style="width:100%;margin-top:6px" onclick="PV66F.todas=true;pv66FPintar()"><i class="ti ti-chevron-down"></i> Ver todas (${f.historico.length})</button>`:''}</div>
      ${f.contatos.length?`<div class="pv66-bx"><h4>💬 Quem já chamou</h4>${f.contatos.map(c=>`<div style="font-size:13px;padding:3px 0">${c.tipo==='posvenda'?'🛍️ Pós-venda':c.tipo==='aniversario'?'🎂 Aniversário':c.tipo==='cashback'?'💸 Cashback':c.tipo==='sumida'?'💭 Sumida':'💬 WhatsApp'} · <b>${esc(primeiroNome(c.por||''))}</b> · ${pv66D(c.quando.slice(0,10))}${c.quando.length>11?' '+esc(c.quando.slice(11,16)):''}</div>`).join('')}</div>`:''}
    </div>`;
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && PV66F.id) pv66FFechar(); });

/* ───────── "Tirar dúvida" ───────── */
if(typeof AJ46_GUIA!=='undefined'){
  AJ46_GUIA.splice(6, 0, {id:'pos-venda', t:'Fazer pós-venda (WhatsApp da cliente)', p:'pos venda posvenda whatsapp numero telefone cliente contato chamar mensagem ligar falar ficha historico compras quem vendeu',
    s:['No Início, toque em "Pós-venda".','Em "Compraram há 2 a 7 dias" aparecem as clientes para chamar (as suas vendas primeiro). Toque em Mandar: abre o WhatsApp com a mensagem pronta.','Para outra cliente, digite o nome ou o final do WhatsApp na busca e toque em Chamar.','Também dá pelo "Minhas vendas": abra a venda e toque em Pós-venda (só aparece quando a venda tem cliente identificada).','Toque no nome da cliente para abrir a ficha: compras, quem vendeu, o que ela mais leva, cartão fidelidade e quem já chamou.'],
    ir:'fn:pv66Abrir()', v:''});
}
