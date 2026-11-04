/* ═══════════ v48: CAIXA DA LOJA — uma gaveta por loja, venda por vendedora ═══════════
   Pedido da Madu (04/11): "só temos uma gaveta; uma abre, outra fecha; no tablet/celular da loja precisa identificar a vendedora
   sem trocar de conta; tem que ser prático, intuitivo e, acima de tudo, seguro".
   • PDV: barra "Quem vendeu?" com a foto de quem bateu o ponto hoje na loja (um toque) — no aparelho da loja volta vazia a cada venda.
   • PDV: misto dividido por forma (Pix, Dinheiro, Débito, Crédito + parcelas); dinheiro só com o caixa aberto.
   • Caixa: Abrir o caixa (contagem às cegas), Passagem de turno (dois PINs), Suprimento — no computador da loja.
   • Fechamento: crédito à vista × parcelado; o fundo vem da abertura (não é mais digitado).
   • Administração: alertas no "Precisa de mim" e movimentos do caixa em Vendas › Caixa.
   Servidor: CAIXA.gs (fim da lista no Apps Script). */

(function(){
  const css = `
.cx48-quem{padding:8px 12px 10px;border-bottom:1px solid var(--linha,#eee)}
.cx48-quem .t{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;color:var(--suave,#666);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
.cx48-quem .t.pede{color:var(--pri,#E3101F);animation:cx48Pisca 1.2s infinite}
@keyframes cx48Pisca{50%{opacity:.45}}
.cx48-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:none}
.cx48-chip{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px;padding:6px 6px 5px;border-radius:14px;border:2px solid transparent;background:var(--fundo2,#f5f5f7);cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:inherit;transition:transform .15s,border-color .15s,background .15s}
.cx48-chip:active{transform:scale(.94)}
.cx48-chip.on{border-color:var(--pri,#E3101F);background:#fff0f1;box-shadow:0 4px 14px rgba(227,16,31,.18)}
.cx48-chip.on b{color:var(--pri,#E3101F)}
.cx48-chip small{font-size:10px;font-weight:500;color:var(--suave,#888)}
.cx48-modo{border:0;background:none;font:inherit;font-size:11px;color:var(--suave,#888);cursor:pointer;text-transform:none;letter-spacing:0;font-weight:500;display:flex;align-items:center;gap:4px}
.cx48-mix{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cx48-mix label{font-size:12px;font-weight:600;display:block;margin-bottom:2px}
.cx48-mix .inp{height:38px}
.cx48-mixst{grid-column:1/-1;font-size:13px;font-weight:700;padding:6px 10px;border-radius:10px;background:#fff7e0;color:#8a5a00}
.cx48-mixst.ok{background:#e6f8ef;color:#0d7a45}
.cx48-mixst.ruim{background:#ffe8ea;color:#b0101c}
.cx48-trava{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px;padding:8px 10px;border-radius:10px;background:#ffe8ea;color:#8a0d17;margin:6px 0}
.cx48-trava>div{flex:1 1 170px;min-width:0}
.cx48-trava button{margin-left:auto;white-space:nowrap}
.cx48-banner{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;margin:0 0 10px;font-size:14px;background:#fff7e0;color:#6b4700}
.cx48-banner.ok{background:#e6f8ef;color:#0b5e36}
.cx48-banner.ruim{background:#ffe8ea;color:#8a0d17}
.cx48-banner .cresce{flex:1}
.cx48-card{background:#fff;border-radius:18px;padding:16px;margin:0 0 14px;box-shadow:0 2px 10px rgba(0,0,0,.05);border:1px solid var(--linha,#eee)}
.cx48-card h3{display:flex;align-items:center;gap:8px;margin:0 0 4px;font-size:17px}
.cx48-card .sub{color:var(--suave,#666);font-size:13px}
.cx48-linha{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.cx48-st{font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;background:#eee}
.cx48-st.aberto{background:#e6f8ef;color:#0d7a45}.cx48-st.fechado{background:#eef0f4;color:#4a5160}.cx48-st.nao{background:#ffe8ea;color:#b0101c}
.cx48-tl{list-style:none;margin:10px 0 0;padding:0;font-size:13px}
.cx48-tl li{display:block;padding:5px 0;border-top:1px dashed #eee}
.cx48-tl li:first-child{border-top:0}
.cx48-pessoas{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}
.cx48-pessoas .cx48-chip{min-width:72px}
.cx48-passo{font-size:12px;font-weight:700;color:var(--suave,#777);text-transform:uppercase;letter-spacing:.04em;margin:10px 0 4px}
.cx48-pin{letter-spacing:.4em;text-align:center;font-size:20px}
.cx48-res{text-align:center;padding:10px 0}
.cx48-res .g{font-size:46px;line-height:1}
.cx48-res b{display:block;font-size:20px;margin:8px 0 4px}
.cx48-mov{display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:#fff;border:1px solid var(--linha,#eee);border-radius:12px;padding:10px 12px;margin:0 0 6px;font:inherit;cursor:pointer}
.cx48-mov .d{font-size:20px}
.cx48-mov small{display:block;color:var(--suave,#777)}
.cx48-mov.diferenca{border-color:#f5b5bb;background:#fff6f7}
.cx48-cfg label.sw{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #eee;font-size:14px}
.cx48-cfg label.sw input{width:20px;height:20px;margin-top:2px}
@media(max-width:900px){.cx48-mix{grid-template-columns:1fr 1fr}}
/* v48b: a comanda ficou alta (fidelidade, roleta, Kommo, quem vendeu) e o botão Finalizar sumia embaixo:
   a parte de baixo rola sozinha e o Finalizar fica sempre à vista */
.pdv-dir .pdv-fecha{overflow-y:auto;min-height:0;flex-shrink:1;overscroll-behavior:contain}
.pdv-dir .pdv-itens{flex:1 1 90px;min-height:90px}
.pdv-fecha .pdv-fim{position:sticky;bottom:0;z-index:3;box-shadow:0 -8px 16px rgba(255,255,255,.9),0 6px 18px rgba(227,16,31,.25)}
.cx48-quem{padding:6px 12px 8px}
.cx48-quem .t{margin-bottom:4px}
.cx48-quem .cx48-chip{flex-direction:row;min-width:0;padding:3px 12px 3px 3px;border-radius:99px;gap:6px;flex:0 0 auto}
.cx48-quem .cx48-chip .av,.cx48-quem .cx48-chip img,.cx48-quem .cx48-chip>span:first-child{flex:0 0 auto}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ═════════ dados ═════════ */
function cx48D(){ const d = S.adm ? S.adm.dados : S.sess?.dados; const c = d && d.caixa48; return (c && !c.erro) ? c : null; }
function cx48Equipe(){ const d = S.adm ? S.adm.dados : S.sess?.dados; return (d && (d.equipe || d.colaboradoras)) || S.boot?.colaboradoras || []; }
function cx48Colab(id){ return cx48Equipe().find(c=>c.id===id) || (S.boot?.colaboradoras||[]).find(c=>c.id===id) || {id, nome:'?'}; }
function cx48Loja(loja){ const c = cx48D(); return (c && c.lojas && c.lojas[loja]) || null; }
function cx48Cfg(){ return (cx48D()||{}).cfg || {so_terminal:true, bloquear_dinheiro:true, limite_sangria:500}; }
function cx48NoPonto(loja){ return ((cx48D()||{}).noPonto||[]).filter(p=>!loja || !p.loja || p.loja===loja); }
function cx48Terminal(){ return !!(S.aparelho && S.aparelho.token); }
function cx48PodeAqui(){ return !cx48Cfg().so_terminal || cx48Terminal(); }
function cx48Compart(){ return cx48Terminal() || !!LS.get('lv_compart48', false); }
function cx48LojaNome(k){ return S.boot?.lojas?.[k]?.nome || k; }
function cx48Brl(v){ return brl2(Number(v)||0).replace('R$ -','-R$ '); }

/* ═════════ API: leva o token do computador e os campos novos da venda ═════════ */
{
  const _apiV48 = api;
  api = async function api(a, dados={}){
    if(a==='caixa' && !dados.token && S.aparelho?.token) dados = {...dados, token:S.aparelho.token};
    if(a==='venda' && dados.pdv && !dados.cancelar && !dados.pedirCancel && typeof PDV!=='undefined'){
      const extra = {};
      if(PDV.vend && PDV.vend!==S.sess?.eid) extra.vendedora_id = PDV.vend;
      if(dados.pagamento==='misto' && PDV.mix){
        extra.mix = {...PDV.mix};
        if(!String(dados.obs||'').trim()) extra.obs = cx48MixTexto();
      }
      dados = {...dados, ...extra};
    }
    return _apiV48(a, dados);
  };
}

/* ═════════ PDV: "Quem vendeu?" ═════════ */
function cx48Vendedoras(){
  const loja = PDV.loja, eu = S.sess?.eid;
  let lista = cx48NoPonto(loja).map(p=>({...cx48Colab(p.id), st:p.st}));
  if(!cx48Compart() && eu && !lista.some(p=>p.id===eu)) lista.unshift({...cx48Colab(eu), eu:true});
  lista.forEach(p=>{ if(p.id===eu) p.eu = true; });
  return lista;
}
function cx48GarantirVend(){
  const L = cx48Vendedoras(), eu = S.sess?.eid;
  if(PDV.vend && !L.some(p=>p.id===PDV.vend) && PDV.vend!==eu) PDV.vend = '';
  if(!PDV.vend){
    if(!cx48Compart()) PDV.vend = eu;
    else if(L.length===1) PDV.vend = L[0].id;
    else if(!L.length) PDV.vend = eu;           // ninguém com ponto aberto: fica com quem está logada
  }
  return L;
}
function cx48Quem(id){ PDV.vend = id; pdvPintarComanda(); }
function cx48TrocarModo(){
  if(cx48Terminal()) return toast('O computador da loja é sempre "aparelho da loja".');
  const v = !LS.get('lv_compart48', false); LS.set('lv_compart48', v); PDV.vend = '';
  toast(v ? 'Aparelho da loja: a cada venda, toque em quem vendeu.' : 'Aparelho pessoal: as vendas saem no seu nome.'); pdvPintarComanda();
}
function cx48BarraQuem(){
  const L = cx48GarantirVend(), comp = cx48Compart(), eu = S.sess?.eid;
  if(!comp && L.length<=1) return `<div class="cx48-quem" style="padding:4px 12px 6px"><div class="t" style="margin:0"><span>Vendendo: ${esc(primeiroNome(cx48Colab(eu).nome))}</span><button class="cx48-modo" onclick="cx48TrocarModo()"><i class="ti ti-device-tablet"></i> é o aparelho da loja?</button></div></div>`;
  if(comp && !L.length) return `<div class="cx48-quem"><div class="t"><span>⚠️ Ninguém com o ponto aberto nesta loja</span></div><small class="suave">A venda sai no nome de quem está logada (${esc(primeiroNome(cx48Colab(eu).nome))}). Bata o ponto para aparecer aqui.</small></div>`;
  const pede = !PDV.vend;
  return `<div class="cx48-quem"><div class="t ${pede?'pede':''}"><span>${pede?'👆 Toque em quem vendeu':'Quem vendeu?'}</span>
      <button class="cx48-modo" onclick="cx48TrocarModo()"><i class="ti ${comp?'ti-device-tablet':'ti-user'}"></i> ${comp?'aparelho da loja':'aparelho pessoal'}</button></div>
    <div class="cx48-chips">${L.map(p=>`<button class="cx48-chip ${PDV.vend===p.id?'on':''}" onclick="cx48Quem('${p.id}')">${avatar(p,'',30)}<b>${esc(primeiroNome(p.nome))}</b>${p.st&&p.st!=='ativa'?`<small>${p.st==='almoco'?'almoço':'pausa'}</small>`:p.eu&&!comp?'<small>eu</small>':''}</button>`).join('')}</div></div>`;
}

/* ═════════ PDV: misto dividido ═════════ */
const MIX48 = [['pix','Pix'],['dinheiro','Dinheiro'],['debito','Débito'],['credito','Crédito']];
function cx48MixSoma(){ return r2(MIX48.reduce((s,[k])=>s+num2(PDV.mix?.[k]),0)); }
function cx48MixTexto(){ return MIX48.filter(([k])=>num2(PDV.mix?.[k])>0).map(([k,n])=>`${n} ${brl2(num2(PDV.mix[k]))}${k==='credito'&&PDV.parc>1?' '+PDV.parc+'×':''}`).join(' + '); }
function cx48MixSt(){
  const tot = pdvContas().total, s = cx48MixSoma(), f = r2(tot-s);
  if(!s) return {ok:false, cls:'', t:`Divida os ${brl2(tot)} entre as formas abaixo`};
  if(Math.abs(f)<0.011) return {ok:true, cls:'ok', t:'✔ Bateu com o total'};
  return f>0 ? {ok:false, cls:'', t:`Falta ${brl2(f)}`} : {ok:false, cls:'ruim', t:`Passou ${brl2(-f)} do total`};
}
function cx48MixHtml(){
  PDV.mix = PDV.mix || {pix:'',dinheiro:'',debito:'',credito:''};
  const st = cx48MixSt();
  return `<div class="pdv-extra"><div class="cx48-mix" id="cx48-mix">
    <div class="cx48-mixst ${st.cls}" id="cx48-mixst">${st.t}</div>
    ${MIX48.map(([f,n])=>`<div><label>${n}</label><input class="inp num" id="cx48-m-${f}" inputmode="decimal" placeholder="0,00" value="${esc(PDV.mix[f]||'')}" oninput="PDV.mix.${f}=this.value;pdvGuardar();cx48MixAtualizar()"></div>`).join('')}
    <div class="cx48-resto" id="cx48-resto" style="grid-column:1/-1">${cx48RestoHtml()}</div>
    <div style="grid-column:1/-1;${num2(PDV.mix.credito)>0?'':'display:none'}" id="cx48-parc"><label style="font-size:12px;font-weight:600">Parcelas do crédito</label><select class="inp" onchange="PDV.parc=+this.value;pdvGuardar()">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${PDV.parc===i+1?'selected':''}>${i+1}× ${i?'(parcelado)':'(à vista)'}</option>`).join('')}</select></div>
  </div></div>`;
}
function cx48RestoHtml(){   // "o resto vai em…": um toque completa a forma escolhida
  const falta = r2(pdvContas().total - cx48MixSoma());
  if(falta<=0.009) return '';
  return `<small class="suave" style="font-size:12px">Resto (${brl2(falta)}) em:</small> ${MIX48.map(([f,n])=>`<button class="selo" style="cursor:pointer;border:0;font-size:12px;padding:4px 10px;margin:2px" onclick="cx48MixResto('${f}')">${n}</button>`).join('')}`;
}
function cx48MixResto(f){
  const falta = r2(pdvContas().total - cx48MixSoma()); if(falta<=0.009) return;
  const v = r2(num2(PDV.mix[f]) + falta); PDV.mix[f] = String(v).replace('.',',');
  const el = $('#cx48-m-'+f); if(el) el.value = PDV.mix[f];
  pdvGuardar(); cx48MixAtualizar();
}
function cx48MixAtualizar(){
  const st = cx48MixSt(), el = $('#cx48-mixst'); if(el){ el.className = 'cx48-mixst '+st.cls; el.textContent = st.t; }
  const p = $('#cx48-parc'); if(p) p.style.display = num2(PDV.mix?.credito)>0 ? '' : 'none';
  const r = $('#cx48-resto'); if(r) r.innerHTML = cx48RestoHtml();
  cx48Botao();
}

/* ═════════ PDV: trava do dinheiro + botão finalizar ═════════ */
function cx48TemDinheiro(){ return PDV.pag==='dinheiro' || (PDV.pag==='misto' && num2(PDV.mix?.dinheiro)>0); }
function cx48DinheiroTravado(){
  if(!cx48D() || !cx48Cfg().bloquear_dinheiro) return false;
  const L = cx48Loja(PDV.loja); return !L || !L.aberto;
}
function cx48Motivo(){
  if(!PDV.car.length || !PDV.pag) return '';
  if(cx48Compart() && cx48Vendedoras().length>1 && !PDV.vend) return 'Toque em quem vendeu';
  if(PDV.pag==='misto' && !cx48MixSt().ok) return 'Divida o pagamento misto';
  if(cx48TemDinheiro() && cx48DinheiroTravado()) return 'Caixa fechado: dinheiro bloqueado';
  return '';
}
function cx48Botao(){
  const fim = $('#pdv-fim'); if(!fim) return;
  const m = cx48Motivo(), k = pdvContas();
  if(m){ fim.disabled = true; fim.innerHTML = `<i class="ti ti-hand-finger"></i> ${esc(m)}`; return; }
  const pode = PDV.car.length && PDV.pag && !k.acima && !PDV.env && !pdvD().semServidor && !(PDV.pag==='dinheiro' && PDV.receb && num2(PDV.receb) < k.total-.009);
  if(pode && fim.disabled){ fim.disabled = false; fim.innerHTML = `<i class="ti ti-check"></i> Finalizar · ${brl2(k.total)}`; }
}
function cx48TravaHtml(){
  if(!cx48TemDinheiro() || !cx48DinheiroTravado()) return '';
  const L = cx48Loja(PDV.loja), nome = cx48LojaNome(PDV.loja);
  const txt = L && L.fechado ? `O caixa de hoje da loja ${esc(nome)} já foi fechado.` : `O caixa da loja ${esc(nome)} ainda não foi aberto. Venda em dinheiro só com o caixa aberto — cartão e Pix continuam liberados.`;
  return `<div class="cx48-trava"><i class="ti ti-lock"></i><div>${txt}</div>${L && !L.fechado && cx48PodeAqui() ? `<button class="btn p" onclick="cx48Abrir('${PDV.loja}')">Abrir caixa</button>`:''}</div>`;
}
{
  const _pintarV48 = pdvPintarComanda;
  pdvPintarComanda = function pdvPintarComanda(){
    const r = _pintarV48.apply(this, arguments);
    const el = $('#pdv-comanda'); if(!el || !S.sess) return r;
    try{
      const cab = el.querySelector('.cab');
      if(cab && cx48D()){ cab.insertAdjacentHTML('afterend', cx48BarraQuem()); const sm = cab.querySelector('small'); if(sm && PDV.vend) sm.textContent = primeiroNome(cx48Colab(PDV.vend).nome)+' vendendo'; }
      if(PDV.pag==='misto'){
        const ob = el.querySelector('.pdv-extra input[placeholder^="Como foi pago"]');
        if(ob) ob.closest('.pdv-extra').outerHTML = cx48MixHtml();
      }
      const pags = el.querySelector('.pdv-pags'); if(pags) pags.insertAdjacentHTML('afterend', cx48TravaHtml());
      cx48Botao(); cx48Altura();
    }catch(e){ console.warn('v48 comanda', e); }
    return r;
  };
  const _leveV48 = pdvPintarComandaLeve;
  pdvPintarComandaLeve = function pdvPintarComandaLeve(){ const r = _leveV48.apply(this, arguments); if(PDV.pag==='misto') cx48MixAtualizar(); else cx48Botao(); return r; };
  const _trocoV48 = pdvPintarTroco;
  pdvPintarTroco = function pdvPintarTroco(){ const r = _trocoV48.apply(this, arguments); cx48Botao(); return r; };
  const _finalizarV48 = pdvFinalizar;
  pdvFinalizar = async function pdvFinalizar(){
    const m = cx48Motivo();
    if(m){ toast(m, true); return; }
    const vend = PDV.vend, eu = S.sess?.eid;
    await _finalizarV48.apply(this, arguments);
    if(!PDV.car.length && !PDV.env){          // gravou
      PDV.mix = {pix:'',dinheiro:'',debito:'',credito:''};
      if(vend && vend!==eu) setTimeout(()=>toast(`Venda registrada para ${primeiroNome(cx48Colab(vend).nome)} ✔`), 900);
      PDV.vend = cx48Compart() ? '' : eu;
      pdvGuardar();
      try{ if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){}
    }
  };
  const _limparV48 = pdvLimpar;
  pdvLimpar = function pdvLimpar(){ const n = PDV.car.length; _limparV48.apply(this, arguments); if(n && !PDV.car.length){ PDV.mix = {pix:'',dinheiro:'',debito:'',credito:''}; if(cx48Compart()) PDV.vend=''; } };
  const _guardarV48 = pdvGuardar;
  pdvGuardar = function pdvGuardar(){ _guardarV48.apply(this, arguments); if(PDV.eid) LS.set('lv_pdvmix48_'+PDV.eid, PDV.mix||null); };
  const _carregarV48 = pdvCarregarCarrinho;
  pdvCarregarCarrinho = function pdvCarregarCarrinho(){
    const antes = PDV.eid; _carregarV48.apply(this, arguments);
    if(PDV.eid!==antes){ PDV.mix = LS.get('lv_pdvmix48_'+PDV.eid, null) || {pix:'',dinheiro:'',debito:'',credito:''}; PDV.vend = cx48Compart() ? '' : PDV.eid; }
  };
  const _portalPDVV48 = portalPDV;
  portalPDV = function portalPDV(){
    const h = _portalPDVV48.apply(this, arguments);
    try{
      let b = cx48BannerPDV();
      if(typeof vr47Abrir==='function'){        // v48b: "Minhas vendas" à vista no topo (o selo antigo ficava lá embaixo, depois dos produtos)
        const hoje = hojeISO(), eu = S.sess?.eid, n = pdvD().vendas.filter(v=>v.data===hoje && (v.colaboradora_id===eu || v.lancada_por_id===eu) && v.status!=='cancelada').length;
        b = `<div class="linha" style="gap:8px;margin:0 0 10px;flex-wrap:wrap"><button class="btn p" id="cx48-minhas" onclick="vr47Abrir('hoje')"><i class="ti ti-receipt"></i> Minhas vendas de hoje · <b class="num">${n}</b></button><small class="suave" style="align-self:center">Errou? Toque aqui e em <b>Desfazer venda</b> (até ${vr47Lim()} min).</small></div>` + b;
      }
      if(b) return h.replace('<div class="pdv">', b+'<div class="pdv">');
    }catch(e){ console.warn('v48 pdv', e); }
    return h;
  };
}
/* v48b: a comanda cabe na tela a partir de onde ela começa (antes passava do fim da janela e o Finalizar ficava escondido) */
function cx48Altura(){
  const el = document.getElementById('pdv-comanda'); if(!el) return;
  if(window.innerWidth<=900){ el.style.maxHeight = ''; return; }
  const topo = Math.max(12, el.getBoundingClientRect().top);
  el.style.maxHeight = Math.max(380, window.innerHeight - topo - 12) + 'px';
}
window.addEventListener('scroll', ()=>{ if(document.getElementById('pdv-comanda')) requestAnimationFrame(cx48Altura); }, {passive:true});
window.addEventListener('resize', ()=>requestAnimationFrame(cx48Altura));
function cx48BannerPDV(){
  if(!cx48D()) return '';
  const loja = PDV.loja || lojaAtual(), L = cx48Loja(loja); if(!L) return '';
  if(L.aberto && L.pedirSangria) return `<div class="cx48-banner"><i class="ti ti-cash-banknote"></i><span class="cresce"><b>Hora da sangria:</b> tem dinheiro demais na gaveta da loja ${esc(cx48LojaNome(loja))}.</span><button class="btn p" onclick="S.portalTab='caixa';render()">Fazer sangria</button></div>`;
  if(L.aberto || L.fechado) return '';
  return `<div class="cx48-banner ruim"><i class="ti ti-lock"></i><span class="cresce"><b>Caixa da loja ${esc(cx48LojaNome(loja))} fechado.</b> Dinheiro só depois de abrir o caixa${cx48PodeAqui()?'':' no computador da loja'}.</span>${cx48PodeAqui()?`<button class="btn p" onclick="cx48Abrir('${loja}')">Abrir caixa</button>`:''}</div>`;
}

/* ═════════ CAIXA: cartão do dia ═════════ */
function cx48Card(loja){
  const L = cx48Loja(loja); if(!L) return '';
  const nome = cx48LojaNome(loja), aqui = cx48PodeAqui();
  const st = L.fechado ? ['fechado','fechado'] : L.aberto ? ['aberto','aberto'] : ['nao','não aberto'];
  const tl = [];
  if(L.abertura) tl.push(`<li>🔓 Aberto por <b>${esc(primeiroNome(L.abertura.por))}</b> às ${esc(L.abertura.hora)}${L.abertura.status==='diferenca'?' <span class="cx48-st nao">diferença</span>':''}</li>`);
  (L.passagens||[]).forEach(p=>tl.push(`<li>🔁 Passagem: <b>${esc(primeiroNome(p.por))}</b> → <b>${esc(primeiroNome(p.por2))}</b> às ${esc(p.hora)}${p.status==='diferenca'?' <span class="cx48-st nao">diferença</span>':' ✔'}</li>`));
  if(L.suprimentos) tl.push(`<li>➕ ${L.suprimentos} suprimento(s) de troco</li>`);
  if(L.fechamento) tl.push(`<li>🔒 Fechado por <b>${esc(primeiroNome(L.fechamento.por))}</b> às ${esc(L.fechamento.hora)}</li>`);
  const btns = [];
  if(!L.aberto && !L.fechado) btns.push(`<button class="btn ouro" onclick="cx48Abrir('${loja}')"><i class="ti ti-lock-open"></i> Abrir o caixa</button>`);
  if(L.aberto){
    btns.push(`<button class="btn" onclick="cx48Passagem('${loja}')"><i class="ti ti-arrows-exchange"></i> Passagem de turno</button>`);
    btns.push(`<button class="btn" onclick="cx48Suprimento('${loja}')"><i class="ti ti-coin"></i> Suprimento</button>`);
  }
  const fx = (typeof opD==='function' ? (opD().fechamentos||[]) : []).find(f=>f.data===hojeISO() && f.loja===loja);
  if(L.aberto) btns.push(`<button class="btn pri" onclick="opFecharCaixa('${loja}')"><i class="ti ti-lock"></i> Fechar o caixa</button>`);
  if(L.fechado && fx && fx.status!=='conferido') btns.push(`<button class="btn" onclick="opFecharCaixa('${loja}')"><i class="ti ti-refresh"></i> Refazer o fechamento</button>`);
  const verRes = fx && fx.colaboradora_id===S.sess?.eid ? `<button class="btn" onclick="opVerFech('${fx.id}')"><i class="ti ti-eye"></i> Ver o fechamento</button>` : '';
  return `<div class="cx48-card"><h3>💵 Caixa da loja ${esc(nome)} <span class="cx48-st ${st[0]}">${st[1]}</span></h3>
    <div class="sub">${L.fechado?'O caixa de hoje já foi fechado.':L.aberto?'Gaveta aberta. Na troca de turno, façam a passagem juntas.':'Comece o dia contando a gaveta: sem caixa aberto, venda em dinheiro fica bloqueada.'}</div>
    ${tl.length?`<ul class="cx48-tl">${tl.join('')}</ul>`:''}
    ${L.aberto && L.pedirSangria?'<div class="cx48-trava" style="background:#fff7e0;color:#6b4700"><i class="ti ti-cash-banknote"></i><div><b>Hora da sangria:</b> a gaveta passou do limite. Faça a sangria aqui embaixo.</div></div>':''}
    ${btns.length ? (aqui ? `<div class="cx48-linha">${btns.join('')}${verRes}</div>` : `<div class="nota info" style="margin-top:10px"><i class="ti ti-device-desktop"></i><div>Abrir, passagem, suprimento e fechamento são feitos no <b>computador da loja</b>.</div></div>${verRes?`<div class="cx48-linha">${verRes}</div>`:''}`) : (verRes?`<div class="cx48-linha">${verRes}</div>`:'')}
  </div>`;
}
if(typeof portalCaixa==='function'){
  const _portalCaixaV48 = portalCaixa;
  portalCaixa = function portalCaixa(){
    const h = _portalCaixaV48.apply(this, arguments);
    try{
      const card = cx48Card(lojaAtual()); if(!card) return h;
      let x = h; const i0 = x.indexOf('🧾 Caixa de hoje');      // o cartão antigo (v20) vira parte do novo
      if(i0>=0){ const ini = x.lastIndexOf('<div class="op-card', i0), lq = x.indexOf('class="linha quebra"', i0), fim = lq>=0 ? x.indexOf('</div></div>', lq) : -1;
        if(ini>=0 && fim>ini) x = x.slice(0, ini) + x.slice(fim+12); }
      return card + x;
    }catch(e){ console.warn('v48 caixa', e); return h; }
  };
}
/* ponto de entrada no computador da loja: já oferece abrir o caixa */
if(typeof telaSucesso==='function'){
  const _telaSucessoV48 = telaSucesso;
  telaSucesso = function telaSucesso(){
    let h = _telaSucessoV48.apply(this, arguments);
    try{
      const u = S.ultimo; if(!u || u.campo!=='entrada' || !cx48Terminal()) return h;
      const loja = S.aparelho.loja, L = cx48Loja(loja); if(!L || L.aberto || L.fechado) return h;
      const card = `<div class="op-card op-pulsa"><h3>💵 Caixa da loja ainda fechado</h3><div class="sub">Conte a gaveta e abra o caixa antes da primeira venda em dinheiro.</div><button class="btn ouro" style="margin-top:8px" onclick="clearTimeout(timerVolta);cx48Abrir('${loja}')"><i class="ti ti-lock-open"></i> Abrir o caixa</button></div>`;
      setTimeout(()=>{ try{ clearTimeout(timerVolta); timerVolta = setTimeout(sair, 120000); }catch(e){} }, 0);
      const marca = '<div class="linha" style="justify-content:center;margin-top:20px;gap:8px">', i = h.lastIndexOf(marca);
      return i<0 ? h.replace('</div></div>', card+'</div></div>') : h.slice(0,i) + card + h.slice(i);
    }catch(e){ return h; }
  };
}

/* ═════════ CAIXA: modais (PIN de quem faz) ═════════ */
let CXM = null;
function cx48Pessoas(loja, campo, exceto){
  const no = cx48NoPonto(loja).map(p=>p.id);
  const todas = cx48Equipe().filter(c=>c.ativa!=='NÃO' && c.id!==exceto && (c.temPin!==false));
  const lista = [...todas.filter(c=>no.includes(c.id)), ...(CXM.todas ? todas.filter(c=>!no.includes(c.id)) : [])];
  return `<div class="cx48-pessoas">${lista.map(c=>`<button class="cx48-chip ${CXM[campo]===c.id?'on':''}" onclick="CXM.${campo}='${c.id}';cx48Modal()">${avatar(c,'',38)}<b>${esc(primeiroNome(c.nome))}</b>${no.includes(c.id)?'<small>no ponto</small>':''}</button>`).join('')}
    ${CXM.todas?'':`<button class="cx48-chip" onclick="CXM.todas=true;cx48Modal()"><span style="font-size:24px;line-height:38px">＋</span><b>Outra</b></button>`}</div>`;
}
function cx48PinCampo(campo, ph){ return `<input class="inp num cx48-pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="${ph||'PIN'}" value="${esc(CXM[campo]||'')}" oninput="CXM.${campo}=this.value">`; }
function cx48Abrir(loja){ CXM = {op:'abrir', loja: loja || lojaAtual(), quem:'', pin:'', contado:'', obs:'', verObs:false, todas:false, ocupado:false}; if(!cx48Checar()) return; cx48Modal(); }
function cx48Passagem(loja){ CXM = {op:'passagem', loja: loja || lojaAtual(), quem:'', pin:'', quem2:'', pin2:'', contado:'', obs:'', todas:false, ocupado:false}; if(!cx48Checar()) return; cx48Modal(); }
function cx48Suprimento(loja){ CXM = {op:'suprimento', loja: loja || lojaAtual(), quem:'', pin:'', valor:'', obs:'', todas:false, ocupado:false}; if(!cx48Checar()) return; cx48Modal(); }
function cx48Checar(){
  if(!cx48D()){ toast('Falta publicar o servidor novo do caixa (CAIXA.gs).', true); return false; }
  if(!cx48PodeAqui()){ toast('Isso é feito no computador da loja.', true); return false; }
  if(cx48Terminal() && S.aparelho.loja) CXM.loja = S.aparelho.loja;
  return true;
}
function cx48Modal(){
  const c = CXM; if(!c) return;
  const tit = {abrir:'🔓 Abrir o caixa', passagem:'🔁 Passagem de turno', suprimento:'➕ Suprimento de troco'}[c.op];
  let corpo = '';
  if(c.op==='abrir') corpo = `
    <p class="suave" style="margin:0 0 6px">Loja <b>${esc(cx48LojaNome(c.loja))}</b> · conte <b>todo</b> o dinheiro da gaveta antes de digitar. O valor esperado não aparece (contagem às cegas).</p>
    <div class="cx48-passo">1 · Quem está abrindo</div>${cx48Pessoas(c.loja,'quem')}
    ${c.quem?`<div class="cx48-passo">2 · PIN de ${esc(primeiroNome(cx48Colab(c.quem).nome))}</div>${cx48PinCampo('pin')}
    <div class="cx48-passo">3 · Dinheiro contado na gaveta (R$)</div><input class="inp num" inputmode="decimal" placeholder="0,00" value="${esc(c.contado)}" oninput="CXM.contado=this.value">
    ${c.verObs?`<div class="cx48-passo">Motivo da diferença</div><input class="inp" placeholder="Ex.: faltou troco ontem, contei 2 vezes" value="${esc(c.obs)}" oninput="CXM.obs=this.value">`:''}`:''}`;
  if(c.op==='passagem') corpo = `
    <p class="suave" style="margin:0 0 6px">As duas contam o dinheiro da gaveta <b>juntas</b>. Cada uma confirma com o próprio PIN — a partir daqui a gaveta é responsabilidade de quem fica.</p>
    <div class="cx48-passo">1 · Quem está saindo</div>${cx48Pessoas(c.loja,'quem')}
    ${c.quem?cx48PinCampo('pin','PIN de '+primeiroNome(cx48Colab(c.quem).nome)):''}
    <div class="cx48-passo">2 · Quem fica com o caixa</div>${cx48Pessoas(c.loja,'quem2',c.quem)}
    ${c.quem2?cx48PinCampo('pin2','PIN de '+primeiroNome(cx48Colab(c.quem2).nome)):''}
    <div class="cx48-passo">3 · Dinheiro contado na gaveta (R$)</div><input class="inp num" inputmode="decimal" placeholder="0,00" value="${esc(c.contado)}" oninput="CXM.contado=this.value">
    <input class="inp" style="margin-top:8px" placeholder="Observação (opcional)" value="${esc(c.obs)}" oninput="CXM.obs=this.value">`;
  if(c.op==='suprimento') corpo = `
    <p class="suave" style="margin:0 0 6px">Dinheiro que <b>entrou</b> na gaveta sem ser venda (troco trazido). Fica registrado e entra no esperado do fechamento.</p>
    <div class="cx48-passo">1 · Quem está registrando</div>${cx48Pessoas(c.loja,'quem')}
    ${c.quem?`${cx48PinCampo('pin','PIN de '+primeiroNome(cx48Colab(c.quem).nome))}
    <div class="cx48-passo">2 · Valor (R$)</div><input class="inp num" inputmode="decimal" placeholder="0,00" value="${esc(c.valor)}" oninput="CXM.valor=this.value">
    <div class="cx48-passo">3 · De onde veio</div><input class="inp" placeholder="Ex.: troco trazido pela Madu" value="${esc(c.obs)}" oninput="CXM.obs=this.value">`:''}`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)cx48Fechar()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${tit}</h3><button class="icone" onclick="cx48Fechar()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}
      <button class="btn pri largo" style="margin-top:14px" onclick="cx48Enviar()" ${c.ocupado?'disabled':''}><i class="ti ti-lock-check"></i> ${c.ocupado?'Gravando…':{abrir:'Abrir o caixa', passagem:'Confirmar a passagem', suprimento:'Registrar suprimento'}[c.op]}</button>
    </div></div></div>`;
}
function cx48Fechar(){ CXM = null; fecharModal(); }
async function cx48Enviar(){
  const c = CXM; if(!c || c.ocupado) return;
  if(!c.quem) return toast('Toque em quem está fazendo', true);
  if(!c.pin) return toast('Digite o PIN', true);
  if(c.op==='passagem' && (!c.quem2 || !c.pin2)) return toast('Escolha quem fica e digite o PIN dela', true);
  if((c.op==='abrir' || c.op==='passagem') && String(c.contado).trim()==='') return toast('Digite o dinheiro contado', true);
  if(c.op==='suprimento' && !num2(c.valor)) return toast('Digite o valor', true);
  c.ocupado = true; cx48Modal();
  try{
    const r = await api('caixa', {op:c.op, eid:c.quem, pin:c.pin, eid2:c.quem2||'', pin2:c.pin2||'', loja:c.loja, contado:c.contado, valor:c.valor, obs:c.obs});
    if(S.sess?.dados) S.sess.dados.caixa48 = r.caixa48;
    if(S.adm?.dados && S.adm.dados.caixa48 && r.caixa48) S.adm.dados.caixa48.hoje = r.caixa48;
    const f = r.feito || {}; CXM = null;
    cx48Resultado(c.op, f);
    try{ if(S.tela==='portal') render(); else if(typeof pdvPintarComanda==='function' && $('#pdv-comanda')) pdvPintarComanda(); }catch(e){}
  }catch(e){
    c.ocupado = false;
    if(c.op==='abrir' && /diferença/i.test(e.message)) c.verObs = true;
    c.pin = ''; if(c.pin2) c.pin2 = '';
    cx48Modal(); toast(e.message, true);
  }
}
function cx48Resultado(op, f){
  const dif = Number(f.diferenca)||0, ok = f.status!=='diferenca';
  const t = op==='abrir' ? (ok?'Caixa aberto!':'Caixa aberto com diferença') : op==='passagem' ? (ok?'Passagem feita — bateu!':'Passagem com diferença') : 'Suprimento registrado';
  const s = op==='suprimento' ? `${brl2(f.valor)} entraram na gaveta.` : ok ? (op==='abrir'?'Boas vendas! 💃 Dinheiro liberado no PDV.':'A gaveta agora é de quem ficou.') : `Diferença de ${cx48Brl(dif)}. A administração foi avisada.`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal"><div class="modal-c cx48-res">
    <div class="g">${ok?'✅':'⚠️'}</div><b>${esc(t)}</b><p class="suave">${esc(s)}</p>
    <button class="btn pri largo" style="margin-top:10px" onclick="fecharModal()">Concluir</button></div></div></div>`;
}

/* ═════════ FECHAMENTO: crédito à vista × parcelado; fundo vem da abertura ═════════ */
if(typeof opFormas!=='undefined'){
  // as formas novas só valem com o CAIXA.gs publicado (o servidor antigo espera "credito")
  const FORMAS_V20 = {...opFormas}, FORMAS_V48 = {pix:opFormas.pix, dinheiro:opFormas.dinheiro, debito:opFormas.debito, credito_vista:['Crédito à vista','ti-credit-card-pay'], credito_parc:['Crédito parcelado','ti-calendar-dollar']};
  const usar = o => { Object.keys(opFormas).forEach(k=>delete opFormas[k]); Object.assign(opFormas, o); };
  const padrao = () => cx48D() ? FORMAS_V48 : FORMAS_V20;
  const _abrirFechV48 = opFecharCaixa;
  opFecharCaixa = function opFecharCaixa(loja, data){
    if(!opAdmin() && cx48D() && !cx48PodeAqui()){ toast('O fechamento é feito no computador da loja.', true); return; }
    usar(padrao());
    _abrirFechV48.apply(this, arguments);
    if(CX && cx48D()){ CX.contado = {pix:'', dinheiro:'', debito:'', credito_vista:'', credito_parc:''}; opCaixaModal(); }
  };
  const _modalFechV48 = opCaixaModal;
  opCaixaModal = function opCaixaModal(){
    _modalFechV48.apply(this, arguments);
    try{
      const L = CX && cx48Loja(CX.loja), hoje = CX && CX.data===hojeISO();
      const box = document.querySelector('#modal .modal-c'); if(!box || !cx48D()) return;
      box.querySelectorAll('.op-passo').forEach((p,i)=>{ if(i===1) p.innerHTML = '<span class="n">2</span><b>Some a maquininha</b>Relatório do dia: débito, crédito à vista, crédito parcelado e Pix.'; });
      if(L && L.abertura && hoje){
        const f = [...box.querySelectorAll('.campo')].find(x=>/Fundo de troco/.test(x.textContent));
        if(f) f.outerHTML = `<div class="nota info" style="margin-bottom:10px"><i class="ti ti-lock-open"></i><div>Fundo de troco = o que foi contado na <b>abertura</b> (${esc(primeiroNome(L.abertura.por))} às ${esc(L.abertura.hora)}). Conte tudo que está na gaveta agora.</div></div>`;
        const n = [...box.querySelectorAll('.nota.info')].find(x=>/Contagem às cegas/.test(x.textContent));
        if(n) n.querySelector('div').textContent = 'Contagem às cegas: o valor esperado só aparece depois que você fecha. Dinheiro = abertura + suprimentos + vendas em dinheiro − sangrias do dia.';
      }
      if(L && hoje && !opAdmin()){
        const bt = box.querySelector('#btn-cx');
        if(bt && !box.querySelector('.cx48-aviso-fech')) bt.insertAdjacentHTML('beforebegin', '<div class="nota warn cx48-aviso-fech" style="margin:0 0 10px"><i class="ti ti-alert-triangle"></i><div><b>Feche só no fim do expediente.</b> Depois de fechar, venda em dinheiro fica bloqueada até amanhã.</div></div>');
      }
    }catch(e){ console.warn('v48 fechamento', e); }
  };
  const _resV48 = opCaixaResultado;
  opCaixaResultado = function opCaixaResultado(f){
    const antigo = f && f.contado && ('credito' in f.contado) && !('credito_vista' in f.contado);
    usar(antigo || !cx48D() ? FORMAS_V20 : FORMAS_V48);
    try{ return _resV48.apply(this, arguments); } finally { usar(padrao()); }
  };
}

/* ═════════ desfazer a venda que ESTE aparelho lançou para outra vendedora ═════════ */
if(typeof vr47Card==='function'){
  const _vr47CardV48 = vr47Card;
  vr47Card = function vr47Card(v){
    const eu = S.sess?.eid;
    if(v && eu && v.colaboradora_id!==eu && v.lancada_por_id===eu){
      S.sess.eid = v.colaboradora_id;
      try{ return _vr47CardV48.apply(this, arguments).replace('</b>', `</b> <small class="apagado">· lançada por você</small>`); } finally { S.sess.eid = eu; }
    }
    return _vr47CardV48.apply(this, arguments);
  };
}

/* ═════════ ADMINISTRAÇÃO ═════════ */
const CX48_ALERTA = {
  abertura: a => ({c:'bad', i:'ti-lock-open', t:`Abertura do caixa com diferença — ${a.lojaNome}`, s:`${a.quem} às ${a.hora} · ${cx48Brl(a.valor)}${a.obs?' · '+a.obs:''}`}),
  passagem: a => ({c:'bad', i:'ti-arrows-exchange', t:`Passagem de turno com diferença — ${a.lojaNome}`, s:`${a.quem} às ${a.hora} · ${cx48Brl(a.valor)}${a.obs?' · '+a.obs:''}`}),
  cancelDinheiro: a => ({c:'warn', i:'ti-cash-off', t:`Venda em dinheiro cancelada — ${a.lojaNome}`, s:`#${a.numero} · ${brl2(a.valor)} em dinheiro · ${a.quem} às ${a.hora}${a.obs?' · '+a.obs:''}`}),
  naoFechou: a => ({c:'bad', i:'ti-lock-exclamation', t:`Caixa da loja ${a.lojaNome} ainda não foi fechado`, s:`A loja fecha às ${a.hora} · aberto por ${a.quem}`}),
  gaveta: a => ({c:'warn', i:'ti-cash-banknote', t:`Dinheiro demais na gaveta — ${a.lojaNome}`, s:`Hora de pedir a sangria (gaveta ~${brl(a.valor)})`}),
  semAbertura: a => ({c:'warn', i:'ti-lock', t:`Loja ${a.lojaNome} vendendo sem abrir o caixa`, s:'Só cartão e Pix passam; peça para abrir o caixa no computador'}),
};
if(typeof itens34==='function'){
  const _itens34V48 = itens34;
  itens34 = function itens34(){
    const I = _itens34V48.apply(this, arguments);
    try{
      ((cx48D()||{}).alertas||[]).forEach(a=>{ const f = CX48_ALERTA[a.tipo]; if(f) I.push({...f(a), b:'Ver caixa', go:()=>{ S.adm.tab='caixa'; }}); });
      const peso = {bad:0, warn:1, info:2}; I.sort((a,b)=>(peso[a.c]??3)-(peso[b.c]??3));
    }catch(e){ console.warn('v48 alertas', e); }
    return I;
  };
}
if(typeof admCaixa==='function'){
  const _admCaixaV48 = admCaixa;
  admCaixa = function admCaixa(){
    const h = _admCaixaV48.apply(this, arguments);
    try{
      const C = cx48D(); if(!C) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>Falta publicar o CAIXA.gs</b> (abertura, passagem de turno, "quem vendeu?").</div></div>` + h;
      const lojas = Object.keys(S.boot.lojas).map(k=>{ const L = (C.hoje?.lojas||{})[k]; if(!L) return '';
        const st = L.fechado?'🔒 fechado':L.aberto?'🔓 aberto':'⛔ não aberto';
        return `<span class="op-kpi ${L.aberto?'pos':''}"><b style="font-size:13px">${esc(cx48LojaNome(k))}</b>${st}${L.abertura?` por ${esc(primeiroNome(L.abertura.por))} ${esc(L.abertura.hora)} (${brl2(L.abertura.contado)})`:''}${L.passagens?.length?` · ${L.passagens.length} passagem(ns)`:''}${L.fechado?` <button class="btn p" style="height:28px;padding:0 10px;margin-left:6px" onclick="cx48AdmReabrir('${k}')"><i class="ti ti-lock-open"></i> Reabrir</button>`:''}</span>`; }).join('');
      const ym = S.adm.mes || hojeISO().slice(0,7);
      const movs = (C.movs||[]).filter(m=>String(m.data).startsWith(ym));
      const ico = {abertura:'🔓', passagem:'🔁', suprimento:'➕'};
      const desc = m => m.tipo==='suprimento' ? `${brl2(m.valor)} · ${esc(m.obs||'')}` : `contado ${brl2(m.contado)}${m.esperado!=null?` · esperado ${brl2(m.esperado)}`:''}${m.diferenca?` · <b>${cx48Brl(m.diferenca)}</b>`:''}${m.obs?' · '+esc(m.obs):''}`;
      const lista = movs.map(m=>`<button class="cx48-mov ${m.status}" onclick="cx48AdmMov('${m.id}')"><span class="d">${ico[m.tipo]||'💵'}</span><span class="cresce"><b>${esc(cx48LojaNome(m.loja))} · ${ddmm(m.data)} ${esc(String(m.criado_em).slice(11,16))} · ${m.tipo==='passagem'?esc(primeiroNome(m.por))+' → '+esc(primeiroNome(m.por2)):esc(primeiroNome(m.por))}</b><small>${m.tipo==='abertura'?'Abertura':m.tipo==='passagem'?'Passagem de turno':'Suprimento'} · ${desc(m)}</small></span>${m.status==='diferenca'?'<span class="cx48-st nao">diferença</span>':m.status==='conferido'?'<span class="cx48-st fechado">conferido</span>':''}</button>`).join('');
      const cfg = C.cfg||{};
      return `<h2 class="secao" style="margin-top:0">Caixa de hoje</h2><div class="op-kpis">${lojas}</div>
        <div class="linha quebra" style="gap:8px;margin:0 0 10px"><button class="btn" onclick="cx48AdmCfg()"><i class="ti ti-shield-lock"></i> Regras do caixa</button>
        <span class="suave" style="align-self:center;font-size:13px">${cfg.so_terminal?'Só no computador da loja':'Em qualquer aparelho'} · ${cfg.bloquear_dinheiro?'dinheiro só com caixa aberto':'dinheiro liberado sempre'} · sangria acima de ${brl(cfg.limite_sangria||0)} · WhatsApp: ${C.whats ? (C.whats.ligado && C.whats.chave && C.whats.numeros ? '✅ ligado' : '⚠️ falta configurar') : '—'}</span></div>
        <h2 class="secao">Abertura, passagem e suprimento <small>${ym}</small></h2>
        <div style="margin-bottom:16px">${lista||'<p class="suave">Nada neste mês ainda.</p>'}</div>` + h;
    }catch(e){ console.warn('v48 admCaixa', e); return h; }
  };
}
function cx48AdmMov(id){
  const m = ((cx48D()||{}).movs||[]).find(x=>x.id===id); if(!m) return;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${m.tipo==='abertura'?'🔓 Abertura':m.tipo==='passagem'?'🔁 Passagem de turno':'➕ Suprimento'} · ${esc(cx48LojaNome(m.loja))}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><div class="tabela"><table><tbody>
      <tr><td>Quando</td><td>${ddmm(m.data)} às ${esc(String(m.criado_em).slice(11,16))}</td></tr>
      <tr><td>Quem</td><td>${esc(m.por)}${m.por2?' → '+esc(m.por2):''}</td></tr>
      ${m.tipo==='suprimento'?`<tr><td>Valor</td><td>${brl2(m.valor)}</td></tr>`:`<tr><td>Contado</td><td>${brl2(m.contado)}</td></tr><tr><td>Esperado</td><td>${m.esperado==null?'—':brl2(m.esperado)}</td></tr><tr><td>Diferença</td><td><b>${m.diferenca==null?'—':cx48Brl(m.diferenca)}</b></td></tr>`}
      <tr><td>Aparelho</td><td>${esc(m.terminal||'—')}</td></tr><tr><td>Obs.</td><td>${esc(m.obs||'—')}</td></tr></tbody></table></div>
      <div class="campo" style="margin-top:10px"><label>Observação da administração</label><input class="inp" id="cx48-obsadm" placeholder="Ex.: conferido, era troco da outra loja"></div>
      <button class="btn pri largo" onclick="cx48AdmConferir('${m.id}')"><i class="ti ti-check"></i> ${m.status==='diferenca'?'Marcar como conferido':'Salvar observação'}</button></div></div></div>`;
}
function cx48AdmReabrir(loja){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">🔓 Reabrir o caixa de hoje — ${esc(cx48LojaNome(loja))}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px">O fechamento de hoje vai para o histórico (nada é apagado) e o caixa volta a ficar <b>aberto</b>: dinheiro liberado de novo e o próximo fechamento vale no lugar deste.</p>
      <div class="campo"><label>Motivo</label><input class="inp" id="cx48-reab" placeholder="Ex.: fechado por engano / teste"></div>
      <button class="btn pri largo" onclick="cx48AdmReabrirOk('${loja}')"><i class="ti ti-lock-open"></i> Reabrir o caixa</button></div></div></div>`;
}
async function cx48AdmReabrirOk(loja){
  try{ S.adm.dados = await api('admCaixa48', {...S.adm.cred, op:'reabrir', loja, motivo:$('#cx48-reab')?.value||''}); fecharModal(); render(); toast('Caixa reaberto ✔'); }
  catch(e){ toast(e.message, true); }
}
async function cx48AdmConferir(id){
  try{ S.adm.dados = await api('admCaixa48', {...S.adm.cred, op:'obs', id, obs:$('#cx48-obsadm')?.value||'conferido', conferido:true}); fecharModal(); render(); toast('Conferido ✔'); }
  catch(e){ toast(e.message, true); }
}
function cx48AdmCfg(){
  const c = (cx48D()||{}).cfg || {};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">🛡️ Regras do caixa</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c cx48-cfg">
      <label class="sw"><input type="checkbox" id="cx48-term" ${c.so_terminal?'checked':''}><span><b>Abrir, passagem, suprimento e fechar só no computador da loja</b><br><small class="suave">Recomendado. Desligue só se o computador da loja estiver com problema.</small></span></label>
      <label class="sw"><input type="checkbox" id="cx48-din" ${c.bloquear_dinheiro?'checked':''}><span><b>Venda em dinheiro só com o caixa aberto</b><br><small class="suave">Cartão e Pix passam sempre.</small></span></label>
      <div class="campo" style="margin-top:10px"><label>Avisar "hora da sangria" quando a gaveta passar de (R$)</label><input class="inp num" id="cx48-lim" inputmode="decimal" value="${esc(String(c.limite_sangria??500).replace('.',','))}"></div>
      <p class="suave" style="font-size:13px">Fundo de troco e tolerância ficam no botão "Fundo de troco e tolerância", mais abaixo.</p>
      <button class="btn pri largo" onclick="cx48AdmCfgSalvar()"><i class="ti ti-check"></i> Salvar</button>
      ${cx48WhatsHtml()}</div></div></div>`;
}
/* v48e: avisos do caixa no WhatsApp (saem do WhatsApp da loja direto da planilha) */
function cx48WhatsHtml(){
  const w = (cx48D()||{}).whats; if(!w) return '';
  return `<div style="border-top:1px solid #eee;margin-top:16px;padding-top:12px">
    <h4 style="margin:0 0 4px">📱 Avisos do caixa no WhatsApp</h4>
    <p class="suave" style="font-size:13px;margin:0 0 8px">Saem do WhatsApp da loja na hora: diferença na abertura ou na passagem, resumo de cada fechamento, venda em dinheiro cancelada, sangria, gaveta cheia e caixa sem fechar.</p>
    <label class="sw"><input type="checkbox" id="cx48-wl" ${w.ligado?'checked':''}><span><b>Ligado</b></span></label>
    <div class="campo"><label>Número que recebe (pode pôr mais de um, separado por vírgula)</label><input class="inp" id="cx48-wn" inputmode="tel" placeholder="(68) 9 9999-9999" value="${esc(w.numeros||'')}"></div>
    <div class="campo"><label>Chave do WhatsApp da loja ${w.chave?'<span class="cx48-st aberto">✔ já colada</span>':'<span class="cx48-st nao">falta colar</span>'}</label>
      <input class="inp" id="cx48-wk" type="password" autocomplete="off" placeholder="${w.chave?'Só cole de novo se a chave mudar':'Cole aqui a chave (AUTHENTICATION_API_KEY da Evolution API)'}">
      <small class="suave">Fica guardada no servidor e não aparece mais na tela.</small></div>
    <label class="sw"><input type="checkbox" id="cx48-wg" ${w.gatilho?'checked':''}><span><b>Conferir sozinho a cada 15 min</b><br><small class="suave">Para avisar "caixa sem fechar" e "gaveta cheia" mesmo se ninguém estiver usando o portal.</small></span></label>
    <div class="linha" style="gap:8px;margin-top:8px"><button class="btn pri" onclick="cx48WhatsSalvar(false)"><i class="ti ti-check"></i> Salvar WhatsApp</button><button class="btn" onclick="cx48WhatsSalvar(true)"><i class="ti ti-send"></i> Salvar e enviar teste</button></div>
  </div>`;
}
async function cx48WhatsSalvar(teste){
  try{
    const chave = $('#cx48-wk').value.trim();
    const d = await api('admCaixa48', {...S.adm.cred, op:'whats', whats:$('#cx48-wn').value, whats_ligado:$('#cx48-wl').checked, gatilho:$('#cx48-wg').checked, ...(chave?{chave}:{}), teste:!!teste});
    S.adm.dados = d; fecharModal(); render();
    if(teste) toast(d.whatsTeste==='ok' ? 'Teste enviado ✔ Confira o WhatsApp.' : 'Não enviou: '+d.whatsTeste, d.whatsTeste!=='ok'); else toast('WhatsApp do caixa salvo ✔');
  }catch(e){ toast(e.message, true); }
}
async function cx48AdmCfgSalvar(){
  try{ S.adm.dados = await api('admCaixa48', {...S.adm.cred, op:'cfg', so_terminal:$('#cx48-term').checked, bloquear_dinheiro:$('#cx48-din').checked, limite_sangria:$('#cx48-lim').value}); fecharModal(); render(); toast('Regras salvas ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ═════════ "Tirar dúvida" ═════════ */
if(typeof AJ46_GUIA!=='undefined'){
  AJ46_GUIA.splice(3, 0,
    {id:'abrir-caixa', t:'Abrir o caixa da loja', p:'abrir caixa abertura gaveta fundo troco dinheiro bloqueado comecar dia', s:['No computador da loja, vá em Caixa e sangria (ou bata o ponto de entrada).','Toque em "Abrir o caixa", toque no seu nome e digite o seu PIN.','Conte todo o dinheiro da gaveta e digite o valor. Pronto: venda em dinheiro liberada.'], ir:'caixa'},
    {id:'passagem-caixa', t:'Passagem de turno do caixa', p:'passagem turno troca caixa sair ir embora entregar gaveta', s:['Antes de ir embora, chame quem fica.','No computador da loja: Caixa e sangria › "Passagem de turno".','Quem sai toca no nome e digita o PIN; quem fica faz o mesmo. Contem a gaveta juntas e digitem o valor.'], ir:'caixa'},
    {id:'quem-vendeu', t:'Vender no tablet ou computador da loja (quem vendeu?)', p:'quem vendeu vendedora tablet computador loja trocar conta meta nome', s:['Monte a comanda normalmente.','Em cima da comanda, toque na SUA foto ("Quem vendeu?"). Só aparece quem bateu o ponto hoje.','Finalize. A venda conta na sua meta. Na próxima venda, toque de novo.'], ir:'pdv'},
    {id:'misto', t:'Venda com dois pagamentos (misto)', p:'misto dois pagamentos parte dinheiro parte cartao pix dividir', s:['Escolha "Misto" no pagamento.','Digite quanto foi em uma forma; o que faltar, toque em "Resto em…" e escolha a outra forma.','Quando aparecer "Bateu com o total", finalize.'], ir:'pdv'});
}
