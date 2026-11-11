/* ═════════════════════ COMANDA COM MAIS ESPAÇO + ACRÉSCIMO + PARCELAS COM VALOR (v52) ═════════════════════
   Pedidos da Madu (11/11/2026):
   1. "aqui tá tudo muito junto, precisa de mais espaço na hora de passar as vendas"
      → no computador a comanda fica mais larga, os produtos e o pagamento rolam juntos num bloco só
        e o Total + Finalizar ficam presos embaixo, sempre à vista. Kommo, fidelidade e roleta viram 3 botões lado a lado.
   2. "além do desconto, o botão de acréscimo" → linha Acréscimo (% ou R$) logo abaixo do Desconto.
      Só aparece quando o servidor já sabe somar (PDV.gs v52 manda cfg.acrescimo = 1).
   3. "a parcela tem que ter o valor; até 6x sem juros, de 7 em diante com juros calculado na máquina"
      → lista de parcelas com o valor de cada uma (crédito e misto).
   Carrega por último (antes do app12), por cima de todos os encaixes da comanda (app22, 23, 26, 41, 48). */
const C52_SEM_JUROS = 6;
const C52 = {rola:0};

(function(){ const st = document.createElement('style'); st.textContent = `
@media (min-width:901px){
  #app .pdv{grid-template-columns:minmax(0,1fr) clamp(400px,34vw,480px);gap:18px;min-height:calc(100vh - 24px)}
}
#pdv-comanda.c52 .cab{padding:16px 18px}
#pdv-comanda.c52 .cx48-quem{padding:8px 18px 10px}
#pdv-comanda.c52 .c52-meio{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}
#pdv-comanda.c52 .pdv-itens{flex:none;min-height:0;overflow:visible;padding:8px 12px}
#pdv-comanda.c52 .pdv-item{padding:14px 6px;grid-template-columns:minmax(0,1fr) auto auto;gap:8px 8px;align-items:center}
#pdv-comanda.c52 .pdv-item > :first-child{grid-column:1;grid-row:1/3;padding-right:6px}
#pdv-comanda.c52 .pdv-item .tt{grid-column:2/4;grid-row:1;font-size:15.5px}
#pdv-comanda.c52 .pdv-item .pdv-passo{grid-column:2;grid-row:2;justify-self:end}
#pdv-comanda.c52 .pdv-item > :last-child{grid-column:3;grid-row:2}
#pdv-comanda.c52 .pdv-item .nm{font-size:14.5px;line-height:1.3}
#pdv-comanda.c52 .pdv-item .un{margin-top:2px}
#pdv-comanda.c52 .pdv-passo{height:36px}
#pdv-comanda.c52 .pdv-passo button{width:36px;height:34px}
#pdv-comanda.c52 .pdv-passo span{min-width:30px;font-size:15px}
#pdv-comanda.c52 .pdv-fecha{flex:none;overflow:visible;padding:18px 18px 20px}
#pdv-comanda.c52 .pdv-linha{margin-bottom:14px;font-size:14.5px;min-height:24px}
#pdv-comanda.c52 .pdv-desc{gap:6px}
#pdv-comanda.c52 .pdv-desc input{width:84px;height:38px;font-size:15px}
#pdv-comanda.c52 .pdv-desc button{height:38px;min-width:42px;font-size:13.5px}
#pdv-comanda.c52 .pdv-pags{gap:8px;margin:18px 0 16px}
#pdv-comanda.c52 .pdv-pags button{padding:12px 2px;font-size:12.5px;gap:5px;border-radius:14px}
#pdv-comanda.c52 .pdv-pags button i{font-size:23px}
#pdv-comanda.c52 .pdv-extra{margin-bottom:16px}
#pdv-comanda.c52 .pdv-cli{margin:4px 0 14px}
#pdv-comanda.c52 .c52-pe{flex:none;padding:10px 18px 14px;background:#fff;border-top:1px solid var(--linha);box-shadow:0 -12px 22px -18px rgba(28,20,22,.45);position:relative;z-index:2}
#pdv-comanda.c52 .c52-pe .pdv-total{margin:0 0 8px}
#pdv-comanda.c52 .c52-pe .pdv-total b{font-size:30px}
#pdv-comanda.c52 .c52-pe .pdv-fim{position:relative;bottom:auto;box-shadow:none;width:100%}
/* Kommo · fidelidade · roleta: 3 botões lado a lado enquanto não estão em uso */
.c52-atalhos{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px;margin:0 0 16px}
.c52-atalhos > *{min-width:0;display:flex}
.c52-atalhos .kmv-liga,.c52-atalhos .fid-btn,.c52-atalhos .rt-btn{flex:1;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;margin:0;padding:12px 6px;border-radius:14px;min-height:74px;font-size:12.5px;font-weight:700;line-height:1.2;color:var(--creme)}
.c52-atalhos .kmv-liga{border-width:1.5px}
.c52-atalhos .kmv-liga i{font-size:24px;color:#1a9f55}
.c52-atalhos .fid-btn small,.c52-atalhos .rt-btn small,.c52-atalhos .fid-btn > i,.c52-atalhos .rt-btn > i{display:none}
.c52-atalhos .fid-btn b,.c52-atalhos .rt-btn b{font-size:12.5px}
.c52-atalhos .fid-btn .ic,.c52-atalhos .rt-btn .ic{font-size:24px;line-height:1}
/* acréscimo */
.c52-acr small.c52-mais{color:var(--ok);font-weight:700}
/* parcelas */
.c52-parc{margin-top:8px;padding:10px 12px;border-radius:12px;background:var(--ok-bg);color:var(--ok);font-size:14px;font-weight:700;line-height:1.35}
.c52-parc.juros{background:var(--warn-bg,#FFF4D6);color:var(--warn,#8A5A00)}
.c52-parc small{display:block;font-weight:600;font-size:12.5px;opacity:.9}
`; document.head.appendChild(st); })();

/* ═════════ acréscimo: entra na conta por último (depois de desconto, fidelidade e roleta) ═════════ */
function c52AcrOk(){ try{ return !!(pdvD() && pdvD().cfg && pdvD().cfg.acrescimo); }catch(e){ return false; } }
const _pdvContasV52 = pdvContas;
pdvContas = function pdvContas(){
  const k = _pdvContasV52.apply(this, arguments);
  const v = c52AcrOk() ? num2(PDV.acrV) : 0;
  k.acr = (k.sub && v > 0) ? r2((PDV.acrTipo||'R$')==='%' ? k.sub*v/100 : v) : 0;
  k.acrAcima = k.acr > k.sub + .009;          // o servidor recusa acréscimo maior que a venda (erro de digitação)
  if(k.acr) k.total = r2(k.total + k.acr);
  return k;
};
const _pdvGuardarV52 = pdvGuardar;
pdvGuardar = function pdvGuardar(){
  const r = _pdvGuardarV52.apply(this, arguments);
  try{ if(PDV.eid) LS.set('lv_pdv52_'+PDV.eid, {acrV:PDV.acrV||'', acrTipo:PDV.acrTipo||'R$', uid:PDV.uid||''}); }catch(e){}
  return r;
};
function c52Restaurar(){
  if(PDV._c52 === PDV.eid) return;
  PDV._c52 = PDV.eid;
  try{ const g = PDV.eid && LS.get('lv_pdv52_'+PDV.eid); if(g && g.uid && g.uid===PDV.uid && PDV.car.length){ PDV.acrV = g.acrV||''; PDV.acrTipo = g.acrTipo||'R$'; } }catch(e){}
}
function c52AcrLinha(k){
  return `<div class="pdv-linha c52-acr" id="c52-acr"><span>Acréscimo <small class="c52-mais" id="c52-acr-info">${c52AcrTxt(k)}</small></span><span class="pdv-desc"><input class="num" inputmode="decimal" placeholder="0" value="${esc(PDV.acrV||'')}" title="Taxa de entrega, juros do parcelado…" oninput="PDV.acrV=this.value;pdvGuardar();c52AcrDigitou()"><button class="${(PDV.acrTipo||'R$')==='%'?'on':''}" onclick="PDV.acrTipo='%';pdvGuardar();pdvPintarComanda()">%</button><button class="${(PDV.acrTipo||'R$')==='R$'?'on':''}" onclick="PDV.acrTipo='R$';pdvGuardar();pdvPintarComanda()">R$</button></span></div>`;
}
function c52AcrTxt(k){ return k.acrAcima ? '⚠️ maior que a venda' : (k.acr && (PDV.acrTipo||'R$')==='%') ? '+ '+brl2(k.acr) : ''; }
function c52AcrDigitou(){
  pdvPintarComandaLeve();
  try{ if(PDV.pag==='dinheiro' && typeof pdvPintarTroco==='function') pdvPintarTroco(); }catch(e){}
}
function c52Travas(){            // acréscimo maior que a venda não finaliza
  const k = pdvContas(), i = $('#c52-acr-info'), fim = $('#pdv-fim');
  if(i){ i.textContent = c52AcrTxt(k); i.style.color = k.acrAcima ? 'var(--bad)' : ''; }
  if(fim && k.acrAcima && PDV.car.length && PDV.pag && !PDV.env){ fim.disabled = true; fim.innerHTML = '<i class="ti ti-hand-finger"></i> Confira o acréscimo'; }
}
const _apiV52 = api;
api = async function api(a, dados={}){
  if(a==='venda' && dados && dados.pdv && !dados.cancelar && c52AcrOk()){
    try{ const k = pdvContas(); if(k.acr && !k.acrAcima) dados = {...dados, acrescimo:String(k.acr)}; }catch(e){}
  }
  return _apiV52.call(this, a, dados);
};
const _pdvFinalizarV52 = pdvFinalizar;
pdvFinalizar = async function pdvFinalizar(){
  if(pdvContas().acrAcima){ toast('O acréscimo está maior que a venda. Confira o valor.', true); return; }
  const r = await _pdvFinalizarV52.apply(this, arguments);
  if(!PDV.car.length && !PDV.env && PDV.acrV){ PDV.acrV = ''; pdvGuardar(); try{ if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){} }
  return r;
};
const _pdvLimparV52 = pdvLimpar;
pdvLimpar = function pdvLimpar(){
  const r = _pdvLimparV52.apply(this, arguments);
  if(!PDV.car.length && PDV.acrV){ PDV.acrV = ''; pdvGuardar(); try{ if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){} }
  return r;
};

/* ═════════ parcelas com o valor: até 6× sem juros; de 7× em diante, juros na maquininha ═════════ */
function c52Parcelas(){
  const el = $('#pdv-comanda'); if(!el) return;
  const noMisto = PDV.pag==='misto';
  const sel = noMisto ? el.querySelector('#cx48-parc select') : (PDV.pag==='credito' ? el.querySelector('.pdv-extra select.inp') : null);
  if(!sel) return;
  const base = noMisto ? num2(PDV.mix && PDV.mix.credito) : pdvContas().total;
  [...sel.options].forEach(o=>{
    const n = +o.value;
    o.textContent = n===1 ? `1× de ${brl2(base)} · à vista`
      : n<=C52_SEM_JUROS ? `${n}× de ${brl2(base/n)} · sem juros`
      : `${n}× · com juros (valor na maquininha)`;
  });
  let info = el.querySelector('#c52-parc');
  if(!info){ info = document.createElement('div'); info.id = 'c52-parc'; sel.insertAdjacentElement('afterend', info); sel.addEventListener('change', ()=>setTimeout(c52Parcelas, 0)); }
  const n = +sel.value || 1;
  info.style.display = base > 0 ? '' : 'none';
  info.className = 'c52-parc' + (n>C52_SEM_JUROS ? ' juros' : '');
  info.innerHTML = n===1 ? `Crédito à vista: <b class="num">${brl2(base)}</b>`
    : n<=C52_SEM_JUROS ? `${n}× de <b class="num">${brl2(base/n)}</b> sem juros<small>Total no crédito: ${brl2(base)}</small>`
    : `⚠️ ${n}× tem juros<small>Calcule a parcela na maquininha e confirme o valor com a cliente antes de passar. Até ${C52_SEM_JUROS}× é sem juros (${C52_SEM_JUROS}× de ${brl2(base/C52_SEM_JUROS)}).</small>`;
}

/* ═════════ comanda: mais espaço ═════════ */
function c52Arrumar(scrollAntes, pagAntes){
  const el = $('#pdv-comanda'); if(!el) return;
  const k = pdvContas(), fecha = el.querySelector('.pdv-fecha'), itens = el.querySelector('.pdv-itens');
  /* acréscimo logo abaixo do desconto */
  if(fecha && c52AcrOk() && !el.querySelector('#c52-acr')){
    const ref = el.querySelector('#pdv-desc-info') || el.querySelector('.pdv-desc')?.closest('.pdv-linha');
    if(ref) ref.insertAdjacentHTML('afterend', c52AcrLinha(k));
    if(k.acr){ const t = $('#pdv-total'); if(t) t.textContent = brl2(k.total); }
  }
  /* Kommo · fidelidade · roleta lado a lado (só os que ainda são botão; em uso, continuam grandes) */
  if(fecha){
    const km = fecha.querySelector('.kmv-liga'), fb = fecha.querySelector('#fid-box > button.fid-btn'), rb = fecha.querySelector('#rt-box > button.rt-btn');
    const caixas = [km && km.parentNode, fb && fb.parentNode, rb && rb.parentNode].filter(Boolean);
    if(caixas.length >= 2){
      const linha = document.createElement('div'); linha.className = 'c52-atalhos';
      caixas[0].parentNode.insertBefore(linha, caixas[0]);
      caixas.forEach(c=>linha.appendChild(c));
      if(km){ km.title = km.textContent.trim(); km.innerHTML = '<i class="ti ti-brand-whatsapp"></i><span>Venda do WhatsApp / Instagram</span>'; }
      if(fb) fb.title = 'Buscar ou cadastrar · selo, presente e cashback';
      if(rb) rb.title = 'A cliente ganhou no totem? Digite o código LV…';
    }
  }
  c52Parcelas();
  /* computador: produtos + pagamento rolam juntos; Total e Finalizar ficam presos embaixo */
  const largo = window.innerWidth > 900;
  el.classList.toggle('c52', largo && !!(fecha && itens));
  if(largo && fecha && itens){
    const meio = document.createElement('div'); meio.className = 'c52-meio';
    itens.parentNode.insertBefore(meio, itens); meio.appendChild(itens); meio.appendChild(fecha);
    const pe = document.createElement('div'); pe.className = 'c52-pe';
    const tot = fecha.querySelector('.pdv-total'), fim = fecha.querySelector('#pdv-fim');
    if(tot) pe.appendChild(tot); if(fim) pe.appendChild(fim);
    el.appendChild(pe);
    try{ if(typeof cx48Altura==='function') cx48Altura(); }catch(e){}
    meio.scrollTop = scrollAntes || 0;
    meio.addEventListener('scroll', ()=>{ C52.rola = meio.scrollTop; }, {passive:true});
    const ver = alvo => { if(!alvo) return; const a = alvo.getBoundingClientRect(), m = meio.getBoundingClientRect(); if(a.bottom > m.bottom - 8) meio.scrollTop += a.bottom - m.bottom + 14; else if(a.top < m.top + 8) meio.scrollTop -= m.top - a.top + 14; };
    c52Subir();
    const novo = itens.querySelector('.pdv-item.novo');
    if(novo) ver(novo);
    else if(PDV.pag && PDV.pag !== pagAntes) ver(fecha.querySelector('.cx48-trava') || fecha.querySelector('.pdv-extra') || fecha.querySelector('.pdv-pags'));
  }
  c52Travas();
}
/* a venda começou: sobe a página até o PDV para a comanda usar a altura toda da tela (o cabeçalho e os avisos ficam acima) */
function c52Subir(){
  const n = PDV.car.length, antes = PDV._c52n || 0; PDV._c52n = n;
  if(!(n && !antes)) return;
  const g = document.querySelector('.pdv'); if(!g) return;
  const alvo = Math.round(g.getBoundingClientRect().top + window.scrollY - 12);
  if(window.scrollY < alvo - 4) window.scrollTo({top:alvo, behavior: (typeof semMov==='function' && semMov()) ? 'auto' : 'smooth'});
}
{
  const _pintarV52 = pdvPintarComanda;
  pdvPintarComanda = function pdvPintarComanda(){
    c52Restaurar();
    if(!PDV.car.length){ if(PDV.acrV) PDV.acrV = ''; C52.rola = 0; }          // comanda vazia (vendeu ou limpou): acréscimo zera junto
    const m0 = document.querySelector('#pdv-comanda .c52-meio');
    const scrollAntes = m0 ? m0.scrollTop : C52.rola, pagAntes = PDV._c52pag;
    const r = _pintarV52.apply(this, arguments);
    try{ c52Arrumar(scrollAntes, pagAntes); }catch(e){ console.warn('v52 comanda', e); }
    PDV._c52pag = PDV.pag;
    return r;
  };
  const _leveV52 = pdvPintarComandaLeve;
  pdvPintarComandaLeve = function pdvPintarComandaLeve(){
    const r = _leveV52.apply(this, arguments);
    try{ c52Travas(); c52Parcelas(); if(PDV.pag==='misto' && typeof cx48MixAtualizar==='function') cx48MixAtualizar(); }catch(e){}
    return r;
  };
  if(typeof cx48MixAtualizar==='function'){
    const _mixV52 = cx48MixAtualizar;
    cx48MixAtualizar = function cx48MixAtualizar(){ const r = _mixV52.apply(this, arguments); try{ c52Parcelas(); c52Travas(); }catch(e){} return r; };
  }
  if(typeof pdvPintarTroco==='function'){
    const _trocoV52 = pdvPintarTroco;
    pdvPintarTroco = function pdvPintarTroco(){ const r = _trocoV52.apply(this, arguments); try{ c52Travas(); }catch(e){} return r; };
  }
  let lg = window.innerWidth > 900;
  window.addEventListener('resize', ()=>{ const a = window.innerWidth > 900; if(a !== lg){ lg = a; try{ if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){} } });
}

/* ═════════ datas: as barras entram sozinhas (aniversário da cliente fidelidade e outros campos dd/mm/aaaa) ═════════
   Digita só os números — 12101994 vira 12/10/1994. Vale para qualquer campo com o modelo "dd/mm/aaaa". */
function c52Data(v){ const d = String(v||'').replace(/\D/g,'').slice(0,8); return d.length>4 ? d.slice(0,2)+'/'+d.slice(2,4)+'/'+d.slice(4) : d.length>2 ? d.slice(0,2)+'/'+d.slice(2) : d; }
document.addEventListener('input', e=>{
  const el = e.target;
  if(!el || el.tagName!=='INPUT' || el.getAttribute('placeholder')!=='dd/mm/aaaa') return;
  if(!el.inputMode) el.inputMode = 'numeric';
  el.maxLength = 10;
  const novo = c52Data(el.value);
  if(novo === el.value) return;
  el.value = novo;
  try{ el.setSelectionRange(novo.length, novo.length); }catch(_){}
  if(typeof el.oninput === 'function'){ try{ el.oninput.call(el, e); }catch(_){} }     // o campo guarda o valor já com as barras
}, true);
