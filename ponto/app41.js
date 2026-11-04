/* ═══════════ Portal Equipe Las Vegas · v41 — RELACIONAMENTO E SEGURANÇA ═══════════
   1) Venda da Kommo no PDV: botão na ficha da Kommo "Lançar os produtos no PDV" e chave na comanda
      "Venda do WhatsApp/Instagram" → baixa estoque e dá selo/cashback, sem somar a meta de novo.
   2) Clientes para chamar hoje: aniversariantes, cashback vencendo e sumidas, com mensagem pronta
      no WhatsApp e "feito" (Início da equipe + Administração › Vendas › Clientes › Para chamar).
   3) Backup automático da planilha (Administração › Ajustes › Regras).
   Servidor: RELACIONAMENTO.gs. */
(function(){
  const css = `
.kmv-box{display:flex;gap:10px;align-items:center;background:linear-gradient(120deg,#0f5132,#1a7f4b 60%,#25D366);color:#fff;border-radius:16px;padding:10px 12px;margin-bottom:10px;animation:relSobe .35s var(--mola)}
.kmv-box .ic{font-size:22px}.kmv-box b{display:block;font-size:14px}.kmv-box small{display:block;font-size:12px;opacity:.9;line-height:1.3}
.kmv-box button{margin-left:auto;background:rgba(255,255,255,.18);border:0;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;flex:none}
.kmv-liga{display:flex;align-items:center;gap:6px;width:100%;background:none;border:1px dashed var(--linha2);border-radius:12px;padding:7px 10px;margin-bottom:10px;font:inherit;font-size:12.5px;color:var(--creme2);cursor:pointer;transition:border-color .15s,color .15s}
.kmv-liga:hover{border-color:#25D366;color:#1a7f4b}
.rel-card{background:#fff;border-radius:18px;padding:14px 16px;margin:12px 0;box-shadow:var(--sh);display:flex;gap:12px;align-items:center;cursor:pointer;animation:relSobe .4s both;transition:transform .15s var(--mola);text-align:left;border:0;width:100%;font:inherit}
.rel-card:hover{transform:translateY(-2px)}.rel-card:active{transform:scale(.98)}
.rel-card .ic{font-size:30px;animation:relBalanca 2.6s ease-in-out infinite}
.rel-card b{display:block;font-size:15.5px}.rel-card small{color:var(--creme2);font-size:12.5px}
.rel-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.rel-chips span{background:var(--veludo2);border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700}
.rel-sec{margin:14px 0 6px;display:flex;align-items:center;gap:8px}.rel-sec h4{margin:0;font-size:15px}.rel-sec small{color:var(--creme3)}
.rel-it{display:flex;gap:10px;align-items:center;background:var(--veludo2);border-radius:14px;padding:9px 11px;margin-bottom:6px;animation:relSobe .3s both;transition:opacity .3s,transform .3s}
.rel-it.foi{opacity:.45;transform:scale(.98)}
.rel-it .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:19px;flex:none;background:#fff}
.rel-it .t{flex:1;min-width:0}.rel-it .t b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rel-it .t small{color:var(--creme2);font-size:12px}
.rel-zap{background:#25D366;color:#fff;border:0;border-radius:99px;padding:7px 12px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;display:flex;gap:5px;align-items:center;transition:transform .15s var(--mola);flex:none}
.rel-zap:active{transform:scale(.94)}.rel-ok{background:none;border:1px solid var(--linha2);border-radius:99px;padding:6px 10px;font:inherit;font-size:12px;cursor:pointer;flex:none}
.bk-card{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.bk-card .st{display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:13px;padding:4px 12px;border-radius:99px}
.bk-card .st.on{background:var(--ok-bg);color:var(--ok)}.bk-card .st.off{background:var(--warn-bg);color:var(--warn)}
@keyframes relSobe{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@keyframes relBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ═════════ 1) venda da Kommo no PDV ═════════ */
const KMV = {v:null, _eid:null};
function kmvGuardar(){ if(S.sess?.eid) LS.set('lv_kmv_'+S.sess.eid, KMV.v); }
function kmvRestaurar(){ if(KMV._eid === S.sess?.eid) return; KMV._eid = S.sess?.eid; KMV.v = S.sess?.eid ? LS.get('lv_kmv_'+S.sess.eid) : null; }
function kmvLigar(dados){ KMV.v = dados || {lead:'', nome:''}; kmvGuardar(); pdvPintarComanda(); }
function kmvTirar(){ KMV.v = null; kmvGuardar(); pdvPintarComanda(); }
const _pdvPintarComandaV41 = pdvPintarComanda;
pdvPintarComanda = function pdvPintarComanda(bater){
  kmvRestaurar();
  _pdvPintarComandaV41(bater);
  const el = $('#pdv-comanda'); if(!el) return;
  const ancora = el.querySelector('#fid-box') || el.querySelector('.pdv-cli') || el.querySelector('.pdv-fim');
  if(!ancora) return;
  const box = document.createElement('div');
  box.innerHTML = KMV.v
    ? `<div class="kmv-box"><span class="ic">💬</span><div><b>Venda do WhatsApp/Instagram${KMV.v.nome?' · '+esc(KMV.v.nome):''}</b><small>Baixa o estoque e conta no cartão fidelidade. A meta já entra pela Kommo (Venda ganha), não soma de novo.</small></div><button title="Não é venda da Kommo" onclick="kmvTirar()"><i class="ti ti-x"></i></button></div>`
    : `<button class="kmv-liga" onclick="kmvLigar()"><i class="ti ti-brand-whatsapp"></i> É venda do WhatsApp/Instagram (Kommo)? Toque aqui</button>`;
  ancora.parentNode.insertBefore(box, ancora);
};
const _apiV41 = api;
api = async function api(a, dados={}){
  if(a==='venda' && dados && dados.pdv && !dados.cancelar && KMV.v){
    const r = await _apiV41(a, {...dados, kommo:1, kommo_lead: KMV.v.lead||''});
    KMV.v = null; kmvGuardar();
    return r;
  }
  return _apiV41(a, dados);
};
/* botão na ficha da Kommo (equipe) */
if(typeof kmFicha === 'function'){
  const _kmFichaV41 = kmFicha;
  kmFicha = async function kmFicha(id){
    await _kmFichaV41(id);
    if(S.tela!=='portal') return;
    const m = $('#modal'), lin = m?.querySelector('.linha.quebra'); if(!lin || m.querySelector('#kmv-btn')) return;
    const nome = m.querySelector('.modal-t h3')?.textContent.trim() || '';
    const fim = ((m.querySelector('.km-kpis')?.textContent || '').match(/(\d{4})\s*$/m) || [])[1] || '';
    lin.insertAdjacentHTML('beforeend', `<button class="btn ouro" id="kmv-btn" onclick="kmvLancar('${id}','${esc(nome).replace(/'/g,'')}','${fim}')"><i class="ti ti-shopping-cart-plus"></i> Lançar os produtos no PDV</button>`);
  };
}
async function kmvLancar(lead, nome, fim){
  fecharModal();
  KMV.v = {lead:String(lead), nome}; kmvGuardar();
  S.tela = 'portal'; S.portalTab = 'pdv'; render();
  toast('💬 Monte a comanda com os produtos da venda de '+primeiroNome(nome));
  try{   // acha o cartão fidelidade pelo final do WhatsApp
    if(typeof fidApi==='function' && fim && !FID.cli){
      const r = await fidApi('buscar', {q:fim}), ls = (r.clientes||[]).filter(c=>c.tel_mask.endsWith(fim));
      const c = ls.length===1 ? ls[0] : ls.find(x=>semAcento(x.nome).includes(semAcento(primeiroNome(nome))));
      if(c){ const k = await fidApi('cartao', {id:c.id}); fidUsar(k.cartao); }
    }
  }catch(e){}
}

/* ═════════ 2) clientes para chamar ═════════ */
const REL = {d:null, em:0, carregando:false, feitos:new Set()};
async function relCarregar(forcar){
  if(REL.carregando || (!forcar && REL.d && Date.now()-REL.em < 10*60e3)) return REL.d;
  REL.carregando = true;
  try{
    REL.d = S.tela==='admin' && S.adm ? await api('admRelacionamento', {...S.adm.cred, op:'lista'}) : await api('relacionamento', {eid:S.sess.eid, ...S.sess.cred, op:'lista'});
    REL.em = Date.now(); REL.feitos = new Set();
  }catch(e){ if(!/desconhecida/i.test(e.message)) toast(e.message, true); REL.d = REL.d || {semServidor:true}; }
  REL.carregando = false; return REL.d;
}
function relNum(d){ return d && !d.semServidor ? (d.aniversarios?.length||0) + (d.cashback?.length||0) + (d.sumidas?.length||0) : 0; }
function relMsg(tipo, x){
  const n = primeiroNome(x.nome);
  if(tipo==='aniversario') return `*${x.dias===0?'Feliz aniversário':'Seu aniversário está chegando'}, ${n}!* 🎂💋\nA Las Vegas preparou um *mimo especial* pra você comemorar. Passa na loja ${x.dias===0?'essa semana':'no seu dia'} pra retirar! 🎁\n_Te esperamos!_`;
  if(tipo==='cashback') return `*Oi, ${n}!* 💋\nVocê tem *${brl2(x.valor)} de cashback* na Las Vegas${x.vence?` e ${x.vence_valor && x.vence_valor < x.valor ? brl2(x.vence_valor)+' dele vence' : 'ele vence'} em *${ddmm(x.vence)}*`:''}. Use no que quiser! 💸\n_Te esperamos na loja!_`;
  return `*Oi, ${n}! Que saudade de você aqui na Las Vegas* 💋\nChegou muita novidade desde a sua última visita. Passa pra conhecer!${x.selos?` Você já tem *${x.selos} ${x.selos===1?'selo':'selos'}* no cartão fidelidade 🎁`:''}\n_Te esperamos!_`;
}
function relItem(tipo, x, i){
  const k = tipo+'|'+x.id+'|'+x.ref, foi = REL.feitos.has(k);
  const ic = tipo==='aniversario'?'🎂':tipo==='cashback'?'💸':'💭';
  const sub = tipo==='aniversario' ? (x.dias===0?'<b style="color:var(--vermelho)">HOJE</b>':x.dias===1?'amanhã':`em ${x.dias} dias`)+` · ${ddmm(x.data)} · faz ${x.idade} anos`
    : tipo==='cashback' ? `${brl2(x.valor)} de saldo · vence ${x.dias===0?'hoje':x.dias===1?'amanhã':'em '+x.dias+' dias'}`
    : `última compra há ${x.dias} dias${x.origem==='antigo'?' (sistema antigo)':''} · ${x.compras} ${x.compras===1?'compra':'compras'}`;
  return `<div class="rel-it ${foi?'foi':''}" style="animation-delay:${Math.min(i,12)*40}ms" id="rel-${tipo}-${x.id}"><span class="av">${ic}</span><div class="t"><b>${esc(x.nome)}</b><small>${sub}</small></div>
    ${foi?`<button class="rel-ok" onclick="relFeito('${tipo}','${x.id}','${x.ref}',true)">Desfazer</button>`:`<button class="rel-zap" onclick="relZap('${tipo}','${x.id}')"><i class="ti ti-brand-whatsapp"></i> Mandar</button><button class="rel-ok" title="Já falei com ela" onclick="relFeito('${tipo}','${x.id}','${x.ref}')">✓</button>`}</div>`;
}
function relTela(){
  const d = REL.d;
  if(!d){ relCarregar().then(()=>relPintar()); return `<p class="suave"><i class="ti ti-loader-2"></i> Procurando as clientes…</p>`; }
  if(d.semServidor) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>Falta o servidor.</b> A administração precisa colar o arquivo <b>RELACIONAMENTO</b> no Apps Script e publicar uma nova versão.</div></div>`;
  const sec = (tipo, ic, tit, sub, lista, extra='') => `<div class="rel-sec"><span style="font-size:20px">${ic}</span><h4>${tit} <small>(${lista.length}${extra})</small></h4></div><p class="apagado" style="font-size:12.5px;margin:-2px 0 8px">${sub}</p>${lista.length?lista.map((x,i)=>relItem(tipo,x,i)).join(''):'<p class="suave" style="font-size:13.5px;margin:0 0 6px">Ninguém por enquanto ✨</p>'}`;
  return `<div class="linha" style="gap:8px;margin-bottom:4px"><p class="suave" style="margin:0;font-size:13.5px;flex:1">Toque em <b>Mandar</b>: abre o WhatsApp com a mensagem pronta e marca como feito. Nada de produto na mensagem.</p><button class="btn p" onclick="relCarregar(true).then(relPintar)"><i class="ti ti-refresh"></i></button></div>
    ${sec('aniversario','🎂','Aniversariantes', `Hoje e nos próximos ${d.cfg?.aniversario_dias||7} dias.`, d.aniversarios||[])}
    ${sec('cashback','💸','Cashback vencendo', `Saldo que vence nos próximos ${d.cfg?.cashback_dias||7} dias — lembrar traz a cliente de volta.`, d.cashback||[])}
    ${sec('sumida','💭','Sumidas', `Sem comprar há ${d.cfg?.sumida_de||60} a ${d.cfg?.sumida_ate||365} dias (portal ou sistema antigo). As que mais compravam primeiro.`, d.sumidas||[], d.sumidas_total>(d.sumidas||[]).length?` de ${d.sumidas_total}`:'')}`;
}
function relPintar(){ const el = $('#rel-corpo'); if(el) el.innerHTML = relTela(); else if((S.tela==='admin' && typeof FA!=='undefined' && FA.sub==='chamar') ) render(); }
function relAbrir(){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo"><div class="modal-t"><h3 class="cresce">💌 Clientes para chamar hoje</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div><div class="modal-c" id="rel-corpo">${relTela()}</div></div></div>`;
}
function relAchar(tipo, id){ const l = tipo==='aniversario'?REL.d?.aniversarios:tipo==='cashback'?REL.d?.cashback:REL.d?.sumidas; return (l||[]).find(x=>x.id===id); }
function relZap(tipo, id){
  const x = relAchar(tipo, id); if(!x) return;
  window.open('https://wa.me/'+telWa(x.tel)+'?text='+encodeURIComponent(relMsg(tipo, x)), '_blank');
  relFeito(tipo, id, x.ref);
}
async function relFeito(tipo, id, ref, desfazer){
  const k = tipo+'|'+id+'|'+ref;
  if(desfazer) REL.feitos.delete(k); else REL.feitos.add(k);
  relPintar();
  try{
    const dados = {op:'feito', cliente_id:id, tipo, ref, desfazer: desfazer?1:''};
    if(S.tela==='admin' && S.adm) await api('admRelacionamento', {...S.adm.cred, ...dados}); else await api('relacionamento', {eid:S.sess.eid, ...S.sess.cred, ...dados});
  }catch(e){ toast(e.message, true); if(desfazer) REL.feitos.add(k); else REL.feitos.delete(k); relPintar(); }
}
/* cartão no Início da equipe */
if(typeof portalInicio === 'function'){
  const _portalInicioV41 = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioV41();
    if(!REL.d && !REL.carregando){ relCarregar().then(d=>{ if(relNum(d) && S.tela==='portal' && S.portalTab==='inicio') render(); }); return h; }
    const d = REL.d, n = relNum(d) - REL.feitos.size; if(!n || n < 0) return h;
    const card = `<button class="rel-card" onclick="relAbrir()"><span class="ic">💌</span><div style="flex:1"><b>${n} ${n===1?'cliente para chamar':'clientes para chamar'} hoje</b><small>Mensagem pronta no WhatsApp — traz a cliente de volta pra loja</small>
      <div class="rel-chips">${d.aniversarios?.length?`<span>🎂 ${d.aniversarios.length} aniversário${d.aniversarios.length>1?'s':''}</span>`:''}${d.cashback?.length?`<span>💸 ${d.cashback.length} cashback vencendo</span>`:''}${d.sumidas?.length?`<span>💭 ${d.sumidas.length} sumida${d.sumidas.length>1?'s':''}</span>`:''}</div></div><i class="ti ti-chevron-right"></i></button>`;
    const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
    return f >= 0 ? h.slice(0, f+6) + card + h.slice(f+6) : card + h;
  };
}

/* ═════════ 3) backup automático (Administração › Ajustes › Regras) ═════════ */
const BK = {d:null, carregando:false, fazendo:false};
async function bkCarregar(){ if(BK.carregando) return; BK.carregando = true; try{ BK.d = await api('admBackup', {...S.adm.cred, op:'estado'}); }catch(e){ BK.d = {erro:e.message}; } BK.carregando = false; if(S.adm?.tab==='regras') render(); }
async function bkOp(op){
  BK.fazendo = op; render();
  try{ BK.d = await api('admBackup', {...S.adm.cred, op}); toast(op==='agora'?'💾 Backup feito no Drive':op==='ligar'?'✔ Backup automático ligado (todo dia às 3h)':'Backup automático desligado'); }
  catch(e){ toast(e.message, true); }
  BK.fazendo = false; render();
}
function bkCard(){
  if(!BK.d){ bkCarregar(); return ''; }
  if(BK.d.erro) return /desconhecida/i.test(BK.d.erro) ? `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-database-off"></i><div><b>Backup automático:</b> falta colar o arquivo <b>RELACIONAMENTO</b> no Apps Script e publicar uma nova versão.</div></div>` : '';
  const d = BK.d;
  return `<div class="cartao pad" style="margin-bottom:14px"><div class="bk-card"><span style="font-size:28px">💾</span><div style="flex:1;min-width:200px"><b style="font-size:15.5px">Backup automático da planilha</b>
    <div style="font-size:13px;color:var(--creme2);margin-top:2px"><span class="st ${d.ligado?'on':'off'}">${d.ligado?'● Ligado · todo dia às 3h':'● Desligado'}</span> ${d.ultimo?` · último: ${ddmm(d.ultimo.slice(0,10))} ${d.ultimo.slice(11,16)}`:' · nenhum backup ainda'}${d.qtd?` · ${d.qtd} cópia(s) guardada(s)`:''}</div>
    <small class="apagado">Uma cópia inteira da planilha (vendas, ponto, estoque, clientes) vai para o Drive todo dia. Guarda as 30 últimas.</small></div>
    <div class="linha" style="gap:6px;flex-wrap:wrap">${d.pasta?`<a class="btn" href="${esc(d.pasta)}" target="_blank" rel="noopener"><i class="ti ti-folder"></i> Pasta</a>`:''}
    <button class="btn" ${BK.fazendo?'disabled':''} onclick="bkOp('agora')">${BK.fazendo==='agora'?'<i class="ti ti-loader-2"></i> Fazendo…':'<i class="ti ti-device-floppy"></i> Fazer agora'}</button>
    <button class="btn ${d.ligado?'':'pri'}" ${BK.fazendo?'disabled':''} onclick="bkOp('${d.ligado?'desligar':'ligar'}')">${d.ligado?'Desligar':'<i class="ti ti-power"></i> Ligar todo dia'}</button></div></div></div>`;
}
const _telaAdminV41 = telaAdmin;
telaAdmin = function telaAdmin(){
  const h = _telaAdminV41();
  if(S.adm?.tab !== 'regras' || typeof admRegras !== 'function') return h;
  const base = admRegras(), i = h.lastIndexOf(base);
  return i >= 0 ? h.slice(0, i) + bkCard() + h.slice(i) : h;
};
