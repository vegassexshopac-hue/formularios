/* ═════════════════════ BLACK FRIDAY NA COMANDA (v59 · 19/11/2026) ═════════════════════
   Pedido da Madu: "um botão temporário até dia 21, sábado, que é 30% da Black Friday; qualquer vendedora pode colocar,
   em qualquer produto da loja".
   • Botão grande na comanda, logo acima do Desconto. Um toque aplica 30% na venda inteira; outro toque tira.
   • Quem manda é o servidor (PDV.gs › PDV_BF): ele avisa a porcentagem e até que dia vale. Passou do dia, o botão some
     sozinho e o servidor recusa. Servidor antigo (sem PDV_BF) → o botão nem aparece.
   • Não soma com o desconto digitado, com o cupom da roleta nem com os 20% do cartão fidelidade. Cashback continua valendo.
   Carrega depois do app54 (por cima de todos os encaixes da comanda). Para desligar antes da hora: tirar a linha do app59 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
/* balão da Black Friday: preto e dourado, com o botão pulsando */
.bf59{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px 14px;width:100%;margin:2px 0 16px;padding:14px 14px 14px;border-radius:18px;border:1.5px solid #E8B923;background:radial-gradient(120% 140% at 0% 0%,#2a2410 0%,#0b0b0d 55%);color:#fff;font:inherit;text-align:left;cursor:pointer;box-shadow:0 10px 24px -12px rgba(0,0,0,.75),0 0 0 3px rgba(232,185,35,.14);transition:transform .15s ease}
.bf59:hover{transform:translateY(-1px)}
.bf59:active{transform:scale(.985)}
.bf59::before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 38%,rgba(255,221,120,.22) 50%,transparent 62%);transform:translateX(-100%);animation:bf59brilho 3s ease-in-out infinite;pointer-events:none}
.bf59 .pct{grid-row:1;display:flex;align-items:baseline;gap:3px;font-size:38px;font-weight:900;line-height:.9;color:#FFD23F;letter-spacing:-1.5px;white-space:nowrap;text-shadow:0 0 18px rgba(255,210,63,.35)}
.bf59 .pct small{font-size:14px;font-weight:900;letter-spacing:.5px}
.bf59 .tx{min-width:0;display:grid;gap:3px}
.bf59 .tx b{font-size:15px;font-weight:900;letter-spacing:2px;text-transform:uppercase;white-space:nowrap}
.bf59 .tx small{font-size:12.5px;opacity:.85;line-height:1.3}
.bf59 .tx small b{font-size:inherit;letter-spacing:0;text-transform:none}
.bf59 .ac{grid-column:1/3;position:relative;display:flex;align-items:center;justify-content:center;gap:8px;height:44px;border-radius:999px;background:linear-gradient(180deg,#FFE066,#F2A900);color:#0b0b0d;font-size:14.5px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;animation:bf59pulsa 1.5s ease-in-out infinite}
.bf59 .ac i{font-size:19px}
.bf59.on{background:linear-gradient(135deg,#FFE066,#F2A900);color:#0b0b0d;border-color:#0b0b0d;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.bf59.on::before{animation:none}
.bf59.on .pct{color:#0b0b0d;text-shadow:none}
.bf59.on .ac{background:#0b0b0d;color:#FFD23F;animation:none;height:38px;font-size:13px}
.bf59-travado input,.bf59-travado button{opacity:.55;pointer-events:none}
@keyframes bf59brilho{0%,55%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes bf59pulsa{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,210,63,.65)}50%{transform:scale(1.035);box-shadow:0 0 0 10px rgba(255,210,63,0)}}
@media (prefers-reduced-motion:reduce){.bf59::before,.bf59 .ac{animation:none}.bf59{transition:none}}
`; document.head.appendChild(st); })();

/* a promoção que o servidor mandou — só enquanto está no prazo */
function bfCfg(){
  try{ const b = pdvD().cfg && pdvD().cfg.bf; return (b && Number(b.pct) > 0 && String(b.ate) >= hojeISO()) ? b : null; }catch(e){ return null; }
}
function bfOn(){ return !!(PDV.bf && PDV.car && PDV.car.length && bfCfg()); }
function bfAte(b){ const d = new Date(b.ate+'T12:00:00'); return ['dom.','seg.','ter.','qua.','qui.','sex.','sáb.'][d.getDay()] + ' ' + b.ate.slice(8) + '/' + b.ate.slice(5,7); }
function bfRoleta(){ try{ return !!(typeof RT !== 'undefined' && RT.cup); }catch(e){ return false; } }

/* ═════════ contas: com o botão ligado, o desconto da venda é o da promoção (o limite normal não vale para ela) ═════════ */
const _pdvContasV59 = pdvContas;
pdvContas = function pdvContas(){
  const b = bfOn() && !bfRoleta() ? bfCfg() : null;
  if(!b) return _pdvContasV59.apply(this, arguments);
  const cfg = pdvD().cfg, max0 = cfg.desconto_max;
  const base24 = (typeof bvBase === 'function') ? bvBase() : null;      // v60: com produto de R$ 24 na comanda, os 30% contam só sobre os outros produtos
  if(base24 != null){ PDV.descTipo = 'R$'; PDV.descV = String(r2(base24*Number(b.pct)/100)).replace('.', ','); }
  else { PDV.descTipo = '%'; PDV.descV = String(b.pct); }
  cfg.desconto_max = Math.max(Number(max0 == null ? 15 : max0), Number(b.pct));
  let k;
  try{ k = _pdvContasV59.apply(this, arguments); } finally { cfg.desconto_max = max0; }
  k.bf = k.desc > 0 ? b : null;          // com os 20% do cartão fidelidade o desconto manual zera → a promoção não entra
  return k;
};

/* ═════════ guarda junto da comanda (fechou a tela sem querer: o botão volta como estava) ═════════ */
const _pdvGuardarV59 = pdvGuardar;
pdvGuardar = function pdvGuardar(){
  const r = _pdvGuardarV59.apply(this, arguments);
  try{ if(PDV.eid) LS.set('lv_pdv59_'+PDV.eid, {bf:!!PDV.bf, uid:PDV.uid||''}); }catch(e){}
  return r;
};
function bfRestaurar(){
  if(PDV._bf59 === PDV.eid) return;
  PDV._bf59 = PDV.eid;
  try{ const g = PDV.eid && LS.get('lv_pdv59_'+PDV.eid); PDV.bf = !!(g && g.bf && g.uid && g.uid===PDV.uid && PDV.car.length); }catch(e){ PDV.bf = false; }
}
function bfDesligar(){ if(PDV.bf){ PDV.bf = false; PDV.descV = ''; PDV.descTipo = '%'; } }

function bfAlternar(){
  const b = bfCfg(); if(!b) { toast('A promoção já acabou.', true); bfDesligar(); pdvGuardar(); pdvPintarComanda(); return; }
  if(PDV.env) return;
  if(PDV.bf){ bfDesligar(); pdvGuardar(); pdvPintarComanda(); toast(b.nome+' tirada desta venda'); return; }
  if(!PDV.car.length){ toast('Coloque os produtos na comanda primeiro 🛍️', true); return; }
  if(bfRoleta()){ toast('A '+b.nome+' não soma com o cupom da roleta. Tire o cupom para usar os '+b.pct+'%.', true); return; }
  try{ const k = pdvContas(); if(k.fid && k.fid.tem20){ toast('Esta compra já tem os 20% do cartão fidelidade — não soma com a '+b.nome+'.', true); return; } }catch(e){}
  const base24 = (typeof bvBase === 'function') ? bvBase() : null;      // v60
  if(base24 != null && base24 < .01){ toast('Os produtos de R$ 24 já estão no preço final. A '+b.nome+' vale para os outros produtos.', true); return; }
  PDV.bf = true; PDV.descTipo = '%'; PDV.descV = String(b.pct);
  pdvGuardar(); pdvPintarComanda(true);
  toast('🖤 '+b.nome+': '+b.pct+'% aplicado '+(base24 != null ? 'nos produtos fora da campanha de R$ 24' : 'na venda'));
}

function bfBotao(k){
  const b = bfCfg(); if(!b) return '';
  const on = !!(k && k.bf);
  const s = on ? 'Aplicado nesta venda: <b>− '+brl2(k.desc)+'</b>' : 'Em qualquer produto da loja · até '+bfAte(b);
  return `<button type="button" class="bf59 ${on?'on':''}" id="bf59" onclick="bfAlternar()" title="${esc(b.nome)}: ${b.pct}% em qualquer produto, até ${bfAte(b)}">
    <span class="pct">${b.pct}%<small>OFF</small></span>
    <span class="tx"><b>🖤 ${esc(b.nome)}</b><small>${s}</small></span>
    <span class="ac">${on?'<i class="ti ti-check"></i> Aplicado · toque para tirar':'<i class="ti ti-hand-click"></i> Toque para aplicar '+b.pct+'%'}</span></button>`;
}

/* ═════════ comanda: o botão entra logo acima da linha do Desconto ═════════ */
{
  const _pintarV59 = pdvPintarComanda;
  pdvPintarComanda = function pdvPintarComanda(){
    bfRestaurar();
    if(PDV.bf && (!PDV.car.length || !bfCfg())){ bfDesligar(); try{ pdvGuardar(); }catch(e){} }      // comanda vazia ou promoção encerrada
    if(PDV.bf && bfRoleta()){ bfDesligar(); try{ pdvGuardar(); }catch(e){} setTimeout(()=>toast('O cupom da roleta entrou: a Black Friday saiu desta venda (não somam).', true), 50); }
    const r = _pintarV59.apply(this, arguments);
    try{ bfArrumar(); }catch(e){ console.warn('v59 black friday', e); }
    return r;
  };
}
function bfArrumar(){
  const el = $('#pdv-comanda'); if(!el || !bfCfg()) return;
  const linha = el.querySelector('.pdv-fecha .pdv-desc') && el.querySelector('.pdv-fecha .pdv-desc').closest('.pdv-linha');
  if(!linha || el.querySelector('#bf59')) return;
  const k = pdvContas();
  linha.insertAdjacentHTML('beforebegin', bfBotao(k));
  if(k.bf){                                  // com a promoção ligada o desconto não é digitado
    linha.classList.add('bf59-travado');
    const inp = linha.querySelector('input'); if(inp){ inp.disabled = true; inp.value = String(k.bf.pct); inp.title = 'Desconto da '+k.bf.nome+'. Para digitar outro desconto, tire a promoção no botão acima.'; }
    linha.querySelectorAll('button').forEach(x=>{ x.disabled = true; if(x.textContent.trim()==='%' || x.textContent.trim()==='R$') x.classList.toggle('on', x.textContent.trim()==='%'); });
    const rot = linha.querySelector('span'); if(rot) rot.innerHTML = 'Desconto <small class="apagado">('+esc(k.bf.nome)+')</small>';
    const info = el.querySelector('#pdv-desc-info span'); if(info) info.textContent = '🖤 '+k.bf.nome+' · '+k.bf.pct+'% OFF';
  }
}

/* ═════════ finalizar: avisa o servidor que o desconto é o da promoção ═════════ */
const _apiV59 = api;
api = async function api(a, dados={}){
  if(a==='venda' && dados && dados.pdv && !dados.cancelar && bfOn()){
    try{ const k = pdvContas(); if(k.bf) dados = {...dados, bf:1}; }catch(e){}
  }
  return _apiV59.call(this, a, dados);
};
const _pdvFinalizarV59 = pdvFinalizar;
pdvFinalizar = async function pdvFinalizar(){
  const r = await _pdvFinalizarV59.apply(this, arguments);
  if(!PDV.car.length && !PDV.env && PDV.bf){ PDV.bf = false; try{ pdvGuardar(); }catch(e){} }
  return r;
};
const _pdvLimparV59 = pdvLimpar;
pdvLimpar = function pdvLimpar(){
  const r = _pdvLimparV59.apply(this, arguments);
  if(!PDV.car.length && PDV.bf){ PDV.bf = false; try{ pdvGuardar(); if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){} }
  return r;
};

/* ═════════ comprovante da cliente: o desconto sai com o nome da promoção ═════════ */
const _textoComprovanteV59 = textoComprovante;
textoComprovante = function textoComprovante(v){
  const t = _textoComprovanteV59.apply(this, arguments);
  const bf = v && v.promo ? String(v.promo).split(' + ').find(x=>!/24 por/.test(x)) : '';      // v60: a marca "24 por R$ 24" não é o nome do desconto
  return bf ? t.replace('\nDesconto: −', '\n🖤 '+bf+' OFF: −') : t;
};
