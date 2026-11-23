/* ═════════════════════ BLACK VEGAS — 24 POR R$ 24 (v60 · 23/11/2026) ═════════════════════
   Pedido da Madu: campanha de 24 horas na terça 24/11 — 24 produtos por R$ 24 cada, nas lojas e no site.
   • Quem manda é o servidor (BV24.gs): no dia ele entrega os 24 produtos já com o preço de R$ 24 (marca bv24)
     e avisa em pdv.cfg.bv24. Fora do dia nada disso vem e esta tela não muda nada.
   • Faixa preta e vermelha em cima dos produtos: um toque mostra só os 24; outro toque volta.
   • R$ 24 é preço final: desconto digitado e Black Friday 30% contam só sobre os OUTROS produtos da comanda.
     Cupom da roleta e 20% do cartão fidelidade não entram em comanda com produto de R$ 24 (o servidor avisa).
   Carrega depois do app59. Para desligar antes da hora: tirar a linha do app60 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
.bv60{position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;width:100%;margin:0 0 10px;padding:11px 14px;border-radius:16px;border:1.5px solid #E0162B;background:linear-gradient(110deg,#0b0b0d 0%,#1d0508 60%,#3a070d 100%);color:#fff;font:inherit;text-align:left;cursor:pointer;box-shadow:0 10px 22px -14px rgba(224,22,43,.9);transition:transform .15s ease}
.bv60:hover{transform:translateY(-1px)} .bv60:active{transform:scale(.99)}
.bv60::before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,.16) 50%,transparent 60%);transform:translateX(-100%);animation:bv60brilho 3.2s ease-in-out infinite;pointer-events:none}
.bv60 .n{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#E0162B;color:#fff;font-size:21px;font-weight:900;letter-spacing:-1px;animation:bv60pulsa 1.6s ease-in-out infinite}
.bv60 .t{min-width:0;flex:1;display:grid;gap:2px}
.bv60 .t b{font-size:14.5px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase}
.bv60 .t small{font-size:12.5px;opacity:.88;line-height:1.3}
.bv60 .a{flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:999px;background:#FFD23F;color:#0b0b0d;font-size:13px;font-weight:900;white-space:nowrap}
.bv60.on{background:#E0162B;border-color:#0b0b0d} .bv60.on .n{background:#0b0b0d;animation:none} .bv60.on .a{background:#0b0b0d;color:#FFD23F}
.pdv-prod.bv24{box-shadow:0 0 0 2px #E0162B inset}
.pdv-prod .bv24-selo{position:absolute;top:6px;left:6px;z-index:2;padding:3px 8px;border-radius:999px;background:#E0162B;color:#fff;font-size:11px;font-weight:900;letter-spacing:.3px;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.pdv-item .bv24-tag{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:#E0162B;color:#fff;font-size:10.5px;font-weight:900;vertical-align:middle;white-space:nowrap}
.bv60-nota{display:flex;gap:8px;align-items:flex-start;margin:2px 0 10px;padding:9px 11px;border-radius:12px;background:#fff1f2;border:1px solid #f6b8bf;color:#7a0c18;font-size:12.5px;line-height:1.35}
.bv60-nota b{font-weight:900}
@keyframes bv60brilho{0%,55%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes bv60pulsa{0%,100%{box-shadow:0 0 0 0 rgba(224,22,43,.7)}50%{box-shadow:0 0 0 9px rgba(224,22,43,0)}}
@media (max-width:520px){.bv60{gap:10px;padding:10px 11px}.bv60 .a{padding:0 10px;font-size:12px}.bv60 .t b{font-size:13px;letter-spacing:.6px}}
@media (prefers-reduced-motion:reduce){.bv60::before,.bv60 .n{animation:none}.bv60{transition:none}}
`; document.head.appendChild(st); })();

const BV60 = { dia:'2026-11-24', pediu:{} };
/* a campanha que o servidor mandou — só no dia */
function bvCfg(){ try{ const b = pdvD().cfg && pdvD().cfg.bv24; return (b && !b.previa && String(b.data) === hojeISO()) ? b : null; }catch(e){ return null; } }
/* prévia (véspera): a faixa e os selos aparecem só para a equipe ver quais são; o preço ainda é o normal */
function bvPrev(){ try{ const b = pdvD().cfg && pdvD().cfg.bv24; return (b && b.previa && String(b.data) > hojeISO()) ? b : null; }catch(e){ return null; } }
function bvDia(b){ const d = new Date(b.data+'T12:00:00'); return ['dom.','seg.','ter.','qua.','qui.','sex.','sáb.'][d.getDay()] + ' ' + b.data.slice(8) + '/' + b.data.slice(5,7); }
function bvProd(id){ try{ return pdvD().produtos.find(p=>p.id===id) || null; }catch(e){ return null; } }
/* acerta a comanda com o catálogo: produto da campanha entra (e sai) do preço de R$ 24 junto com o servidor */
function bvAcertar(){
  let mudou = false;
  try{ (PDV.car||[]).forEach(i=>{ if(!i.id) return; const p = bvProd(i.id); if(!p) return;
    if(p.bv24 || i.bv24){ const pr = precoDe(p), f = p.bv24 ? 1 : 0; if(i.preco !== pr || (i.bv24||0) !== f){ i.preco = pr; i.bv24 = f; mudou = true; } } }); }catch(e){}
  return mudou;
}
function bvSoma(){ return r2((PDV.car||[]).reduce((s,i)=>s+(i.bv24 ? i.preco*i.qtd : 0),0)); }
function bvQtd(){ return (PDV.car||[]).reduce((s,i)=>s+(i.bv24 ? i.qtd : 0),0); }
/* valor da comanda que PODE receber desconto (tudo menos os produtos de R$ 24). null = não há produto de R$ 24 na comanda */
function bvBase(){
  if(!bvCfg()) return null;
  bvAcertar();
  if(!bvQtd()) return null;
  return r2((PDV.car||[]).reduce((s,i)=>s+(i.bv24 ? 0 : i.preco*i.qtd),0));
}

/* ═════════ contas: o desconto em % conta só sobre os outros produtos ═════════ */
const _pdvContasV60 = pdvContas;
pdvContas = function pdvContas(){
  const base = bvBase();
  if(base == null) return _pdvContasV60.apply(this, arguments);
  const bfLigada = (typeof bfOn === 'function') && bfOn() && !(typeof bfRoleta === 'function' && bfRoleta());   // o app59 já calcula sobre a base
  const tipo0 = PDV.descTipo, v0 = PDV.descV, dv = num2(v0);
  let k;
  if(!bfLigada && tipo0 === '%' && dv > 0){
    PDV.descTipo = 'R$'; PDV.descV = String(r2(base*dv/100)).replace('.', ',');
    try{ k = _pdvContasV60.apply(this, arguments); } finally { PDV.descTipo = tipo0; PDV.descV = v0; }
  } else k = _pdvContasV60.apply(this, arguments);
  const max = k.bf ? Number(k.bf.pct) : Number(k.max == null ? 15 : k.max);
  const manual = bfLigada ? r2(base*max/100) : (tipo0 === '%' ? r2(base*dv/100) : dv);
  if(manual > base*max/100 + .01) k.acima = true;
  k.bv24 = { qtd: bvQtd(), soma: bvSoma(), base, teto: r2(base*max/100) };
  return k;
};

/* ═════════ produtos: faixa da campanha + selo nos 24 ═════════ */
const _pdvFiltrarV60 = pdvFiltrar;
pdvFiltrar = function pdvFiltrar(){
  if(!(PDV.bv24f && (bvCfg() || bvPrev()))) return _pdvFiltrarV60.apply(this, arguments);
  const P = pdvD(), todos = P.produtos;
  P.produtos = todos.filter(p=>p.bv24 || p.bv24p);
  try{ return _pdvFiltrarV60.apply(this, arguments); } finally { P.produtos = todos; }
};
function bvAlternar(){ PDV.bv24f = !PDV.bv24f; if(PDV.bv24f){ PDV.cat = ''; PDV.q = ''; const q = $('#pdv-q'); if(q) q.value = ''; } pdvPintarGrade(true); }
document.addEventListener('click', ev=>{ try{ if(PDV.bv24f && ev.target.closest && ev.target.closest('.pdv-cats button')) PDV.bv24f = false; }catch(e){} }, true);
function bvFaixa(b){
  const on = !!PDV.bv24f, n = pdvD().produtos.filter(p=>p.bv24 || p.bv24p).length, prev = !!b.previa;
  return `<button type="button" class="bv60 ${on?'on':''}" id="bv60" onclick="bvAlternar()" title="${esc(b.nome)}: ${b.qtd} produtos por ${brl2(b.preco)} cada, só ${prev ? bvDia(b) : 'hoje'}">
    <span class="n">${Math.round(b.preco)}</span>
    <span class="t"><b>🔥 ${esc(b.nome)} · ${esc(b.titulo)}</b><small>${on ? 'Mostrando os produtos da campanha ('+n+' no catálogo)'+(prev ? ' · hoje ainda no preço normal' : '') : prev ? 'Começa '+bvDia(b)+' à meia-noite · '+b.qtd+' produtos por '+brl2(b.preco)+' cada · hoje ainda é preço normal' : 'Só hoje · '+b.qtd+' produtos por '+brl2(b.preco)+' cada · preço final, não soma com desconto'}</small></span>
    <span class="a">${on ? '<i class="ti ti-x"></i> Ver tudo' : '<i class="ti ti-hand-click"></i> Ver os '+b.qtd}</span></button>`;
}
function bvPedirDados(){            // aparelho aberto desde ontem: busca o catálogo do dia (uma vez)
  try{
    const hoje = hojeISO(), tem = !!(pdvD().cfg && pdvD().cfg.bv24 && !pdvD().cfg.bv24.previa);
    if(!S.sess || S.adm || BV60.pediu[hoje] || (hoje === BV60.dia) === tem) return;
    BV60.pediu[hoje] = 1;
    api('dados', {eid:S.sess.eid, ...S.sess.cred}).then(d=>{ if(d && S.sess){ S.sess.dados = d; if(bvAcertar()) pdvGuardar(); render(); } }).catch(()=>{});
  }catch(e){}
}
{
  const _gradeV60 = pdvPintarGrade;
  pdvPintarGrade = function pdvPintarGrade(){
    const r = _gradeV60.apply(this, arguments);
    try{
      bvPedirDados();
      const b = bvCfg() || bvPrev(), velha = $('#bv60');
      if(!b){ if(velha) velha.remove(); PDV.bv24f = false; return r; }
      const cats = document.querySelector('.pdv-cats');
      if(velha) velha.outerHTML = bvFaixa(b); else if(cats) cats.insertAdjacentHTML('beforebegin', bvFaixa(b));
      document.querySelectorAll('#pdv-grade .pdv-prod[data-id]').forEach(el=>{
        const p = bvProd(el.dataset.id); if(!p || !(p.bv24 || p.bv24p) || el.querySelector('.bv24-selo')) return;
        el.classList.add('bv24'); if(getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.insertAdjacentHTML('afterbegin', '<span class="bv24-selo">'+(p.bv24 ? '🔥 ' : 'amanhã ')+brl2(b.preco).replace(',00','')+'</span>');
      });
    }catch(e){ console.warn('v60 black vegas (grade)', e); }
    return r;
  };
}

/* ═════════ comanda: selo no item e o aviso de que R$ 24 não entra em desconto ═════════ */
{
  const _pintarV60 = pdvPintarComanda;
  pdvPintarComanda = function pdvPintarComanda(){
    try{ if(bvAcertar()) pdvGuardar(); }catch(e){}
    const r = _pintarV60.apply(this, arguments);
    try{ bvArrumar(); }catch(e){ console.warn('v60 black vegas (comanda)', e); }
    return r;
  };
}
function bvArrumar(){
  const el = $('#pdv-comanda'), b = bvCfg(); if(!el || !b) return;
  const k = pdvContas(); if(!k.bv24) return;
  el.querySelectorAll('.pdv-item[data-k]').forEach(it=>{
    const i = PDV.car.find(x=>x.k === it.dataset.k), nm = it.querySelector('.nm');
    if(i && i.bv24 && nm && !nm.querySelector('.bv24-tag')) nm.insertAdjacentHTML('beforeend', '<span class="bv24-tag">🔥 '+esc(b.titulo)+'</span>');
  });
  if(el.querySelector('#bv60-nota')) return;
  const alvo = el.querySelector('#bf59') || (el.querySelector('.pdv-fecha .pdv-desc') && el.querySelector('.pdv-fecha .pdv-desc').closest('.pdv-linha'));
  if(!alvo) return;
  const outros = k.bv24.base > .009;
  alvo.insertAdjacentHTML('beforebegin', `<div class="bv60-nota" id="bv60-nota"><span>🔥</span><div><b>${k.bv24.qtd} produto${k.bv24.qtd===1?'':'s'} por ${brl2(b.preco)}</b> (${esc(b.nome)}) — preço final, não entra${k.bv24.qtd===1?'':'m'} em desconto.${outros ? ' Desconto e Black Friday contam só sobre os outros produtos ('+brl2(k.bv24.base)+').' : ''} Cupom da roleta e 20% do cartão: passe em outra comanda.</div></div>`);
}

/* ═════════ comprovante e cupom impresso: a cliente vê quais produtos são da campanha e que eles não acumulam com desconto ═════════ */
function bvDaVenda(v){ try{ return (v && /24 por/.test(String(v.promo||''))) ? (v.itens||[]).filter(i=>i.bv24) : []; }catch(e){ return []; } }
function bvAvisoVenda(v, its){
  const n = its.reduce((s,i)=>s+i.qtd,0), um = n === 1;
  return 'Black Vegas - 24 por R$ 24: '+(um ? 'o produto marcado saiu' : 'os '+n+' produtos marcados saíram')+' por '+brl2(its[0].preco)+(um ? '' : ' cada')+', preço final de campanha, e não acumula'+(um ? '' : 'm')+' com outros descontos.'
    + (Number(v.desconto) > 0 ? ' O desconto desta compra foi aplicado só nos demais produtos.' : '');
}
const _textoComprovanteV60 = textoComprovante;
textoComprovante = function textoComprovante(v){
  let t = _textoComprovanteV60.apply(this, arguments);
  const its = bvDaVenda(v); if(!its.length) return t;
  its.forEach(i=>{ const l = `• ${i.qtd}× ${i.nome} — ${brl2(i.preco*i.qtd)}`; t = t.replace(l, l+' 🔥'); });
  const aviso = '\n\n🔥 _'+bvAvisoVenda(v, its).replace('Black Vegas - 24 por R$ 24:', '*Black Vegas · 24 por R$ 24:*')+'_\n';
  const p = t.indexOf('\n*Total:');
  return p >= 0 ? t.slice(0, p) + aviso + t.slice(p) : t + aviso;
};
const _pdvCupomV60 = pdvCupom;
pdvCupom = function pdvCupom(id){
  const v = pdvAchar(id), its = v ? bvDaVenda(v) : [];
  if(!its.length) return _pdvCupomV60.apply(this, arguments);
  const loja = S.boot.lojas[v.loja]?.nome||v.loja;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cupom #${v.numero}</title><style>
    @page{size:80mm auto;margin:4mm}body{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#000;width:72mm;margin:0}
    h1{font-size:15px;text-align:center;margin:0}p{margin:2px 0}.c{text-align:center}.l{display:flex;justify-content:space-between;gap:6px}hr{border:0;border-top:1px dashed #000;margin:6px 0}b{font-weight:700}.o{font-size:11px;line-height:1.35}
    </style></head><body><h1>LAS VEGAS SEX SHOP</h1><p class="c">CNPJ ${EMPRESA.cnpj} · Loja ${esc(loja)}</p><hr>
    <p>Venda #${v.numero} · ${ddmm(v.data)}/${v.data.slice(0,4)} ${v.hora}</p><p>Vendedora: ${esc(primeiroNome(v.colaboradora))}</p>${v.cliente?`<p>Cliente: ${esc(v.cliente)}</p>`:''}<hr>
    ${v.itens.map(i=>`<p>${i.bv24?'<b>(*)</b> ':''}${esc(i.nome)}</p><div class="l"><span>${i.qtd} x ${brl2(i.preco)}${i.bv24?' BLACK VEGAS':''}</span><span>${brl2(i.qtd*i.preco)}</span></div>`).join('')}<hr>
    <div class="l"><span>Subtotal</span><span>${brl2(v.subtotal)}</span></div>${v.desconto?`<div class="l"><span>Desconto${/Black Friday/.test(v.promo||'')?' Black Friday':''}</span><span>- ${brl2(v.desconto)}</span></div>`:''}${v.acrescimo?`<div class="l"><span>Acréscimo</span><span>+ ${brl2(v.acrescimo)}</span></div>`:''}
    <div class="l"><b>TOTAL</b><b>${brl2(v.total)}</b></div><div class="l"><span>${FORMAS[v.pagamento]?.n||v.pagamento}${v.parcelas>1?' '+v.parcelas+'x':''}</span><span>${v.recebido?'recebido '+brl2(v.recebido):''}</span></div>${v.troco?`<div class="l"><span>Troco</span><span>${brl2(v.troco)}</span></div>`:''}
    <hr><p class="o"><b>(*)</b> ${esc(bvAvisoVenda(v, its))}</p>
    ${Number(v.cashback_gerado)>0 && typeof fidCashAte==='function'?`<hr><p class="c"><b>CASHBACK: ${brl2(v.cashback_gerado)}</b></p><p class="c">para usar ate ${fidCashAte(v.data)}</p>`:''}<hr><p class="c">*** CUPOM SEM VALOR FISCAL ***</p><p class="c">Obrigada pela preferência!</p><p class="c">O que acontece em Vegas, fica em Vegas.</p></body></html>`;
  const f = document.createElement('iframe'); f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){} setTimeout(()=>f.remove(), 2000); }, 250);
};
