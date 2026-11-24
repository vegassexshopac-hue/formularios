/* ═════════════════════ v64 (24/11/2026) — "Quem vendeu?" com qualquer colega + impressão do caixa ═════════════════════
   Pedido da Madu:
   1) No PDV só apareciam as vendedoras com o ponto aberto NAQUELA loja. Às vezes a colega está no Bosque e a venda
      é dela → agora tem "+ Outra colega": lista todas as vendedoras ativas (mostra "no Bosque", "no Centro" ou
      "sem ponto"). A venda conta na meta de quem foi escolhida e fica gravado quem lançou.
      ⚠️ Precisa do CAIXA.gs v64 publicado (o servidor antigo recusa "não está com o ponto aberto").
   2) Abertura e fechamento do caixa imprimem sozinhos no computador da loja (comprovante de 80 mm com assinatura).
      Sem diálogo só com o Chrome aberto com --kiosk-printing e a impressora térmica como padrão do Windows.
      Liga/desliga por computador (marcador no resultado). Botão "Imprimir" no resultado da abertura.
   Carrega depois do app48 (usa cx48…, opImprimirHtml, OP_CSS_PRINT do app28). */
(function(){ const st = document.createElement('style'); st.textContent = `
.cx48-quem .cx64-mais{border:2px dashed var(--borda,#ddd);background:#fff;color:var(--suave,#777);padding:6px 12px}
.cx48-quem .cx64-mais:hover{border-color:var(--pri,#E3101F);color:var(--pri,#E3101F)}
.cx64-lista{margin-top:6px;padding-top:6px;border-top:1px dashed var(--borda,#e5e5e5)}
.cx64-lista>small{display:block;font-size:11px;margin-bottom:4px}
.cx48-quem .cx48-chip small{font-size:10px;font-weight:500;color:var(--suave,#888)}
.cx64-auto{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;font-size:12px;color:var(--suave,#777);cursor:pointer}
`; document.head.appendChild(st); })();

/* ═════════ 1) "Quem vendeu?" — colegas fora do ponto desta loja ═════════ */
function cx64Outras(){
  if(typeof PDV==='undefined') return [];
  const aqui = new Set(cx48Vendedoras().map(p=>p.id)), noPonto = cx48NoPonto(''), eu = S.sess?.eid;
  return cx48Equipe()
    .filter(c=>c && c.id && (!c.ativa || c.ativa==='SIM') && !aqui.has(c.id) && !/servi|limpeza|entreg|admin/i.test(c.cargo||''))
    .map(c=>{ const p = noPonto.find(x=>x.id===c.id); return {...c, eu:c.id===eu, onde: p ? 'no '+cx48LojaNome(p.loja) : 'sem ponto'}; })
    .sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
}
{
  const _garV64 = cx48GarantirVend;
  cx48GarantirVend = function cx48GarantirVend(){
    const v = PDV.vend, fora = v && cx64Outras().some(p=>p.id===v);
    const L = _garV64.apply(this, arguments);
    if(fora) PDV.vend = v;                       // colega escolhida de fora do ponto continua escolhida
    return L;
  };
}
function cx64Ver(){ PDV.outras64 = !PDV.outras64; pdvPintarComanda(); }
cx48BarraQuem = function cx48BarraQuem(){
  const L = cx48GarantirVend(), comp = cx48Compart(), eu = S.sess?.eid, O = cx64Outras();
  const fora = O.find(p=>p.id===PDV.vend);
  const chip = (p, extra) => `<button class="cx48-chip ${PDV.vend===p.id?'on':''}" onclick="cx48Quem('${p.id}')">${avatar(p,'',30)}<b>${esc(primeiroNome(p.nome))}</b>${extra?`<small>${esc(extra)}</small>`:''}</button>`;
  const extraAqui = p => p.st&&p.st!=='ativa' ? (p.st==='almoco'?'almoço':'pausa') : (p.eu&&!comp ? 'eu' : '');
  const aberto = !!(PDV.outras64 || (comp && !L.length));
  const foraChip = fora && !aberto ? chip(fora, fora.onde) : '';
  const mais = O.length && !(comp && !L.length) ? `<button class="cx48-chip cx64-mais" onclick="cx64Ver()"><i class="ti ${aberto?'ti-chevron-up':'ti-user-plus'}"></i><b>${aberto?'Esconder':'Outra colega'}</b></button>` : '';
  const lista = aberto && O.length ? `<div class="cx64-lista"><small class="suave">Colega que não bateu o ponto aqui (está na outra loja ou sem ponto) — a venda conta na meta dela:</small><div class="cx48-chips">${O.map(p=>chip(p, p.onde)).join('')}</div></div>` : '';
  const modo = `<button class="cx48-modo" onclick="cx48TrocarModo()"><i class="ti ${comp?'ti-device-tablet':'ti-user'}"></i> ${comp?'aparelho da loja':'aparelho pessoal'}</button>`;

  /* celular pessoal, sozinha no ponto: linha curta + "outra colega" */
  if(!comp && L.length<=1){
    const quem = cx48Colab(PDV.vend || eu);
    return `<div class="cx48-quem" style="padding:4px 12px 6px"><div class="t" style="margin:0"><span>Vendendo: ${esc(primeiroNome(quem.nome))}${PDV.vend && PDV.vend!==eu ? ' <small class="suave">(lançada por você)</small>' : ''}</span><button class="cx48-modo" onclick="cx48TrocarModo()"><i class="ti ti-device-tablet"></i> é o aparelho da loja?</button></div>
      ${O.length ? `<div class="cx48-chips" style="margin-top:4px">${fora||PDV.vend!==eu?chip({...cx48Colab(eu), id:eu}, 'eu'):''}${foraChip}${mais}</div>` : ''}${lista}</div>`;
  }
  /* aparelho da loja sem ninguém no ponto desta loja: mostra todas */
  if(comp && !L.length){
    return `<div class="cx48-quem"><div class="t ${!PDV.vend||PDV.vend===eu?'pede':''}"><span>⚠️ Ninguém com o ponto aberto nesta loja — toque em quem vendeu</span>${modo}</div>
      <small class="suave">Sem tocar, a venda sai no nome de quem está logada (${esc(primeiroNome(cx48Colab(eu).nome))}).</small>${lista}</div>`;
  }
  const pede = !PDV.vend;
  return `<div class="cx48-quem"><div class="t ${pede?'pede':''}"><span>${pede?'👆 Toque em quem vendeu':'Quem vendeu?'}</span>${modo}</div>
    <div class="cx48-chips">${L.map(p=>chip(p, extraAqui(p))).join('')}${foraChip}${mais}</div>${lista}</div>`;
};
/* depois de cada venda no aparelho da loja a lista de "outras" fecha de novo */
{
  const _limparV64 = pdvLimpar;
  pdvLimpar = function pdvLimpar(){ const n = PDV.car.length; _limparV64.apply(this, arguments); if(n && !PDV.car.length) PDV.outras64 = false; };
  const _finV64 = pdvFinalizar;
  pdvFinalizar = async function pdvFinalizar(){
    const r = await _finV64.apply(this, arguments);
    if(!PDV.car.length && !PDV.env && PDV.outras64){ PDV.outras64 = false; try{ if($('#pdv-comanda')) pdvPintarComanda(); }catch(e){} }
    return r;
  };
}

/* ═════════ 2) Impressão automática da abertura e do fechamento (computador da loja) ═════════ */
function cx64AutoLigada(){ return cx48Terminal() && LS.get('lv_impr64', true) !== false; }
function cx64AutoSet(v){ LS.set('lv_impr64', !!v); toast(v ? 'Este computador imprime sozinho a abertura e o fechamento ✔' : 'Impressão automática desligada neste computador'); }
function cx64AutoHtml(){
  if(!cx48Terminal()) return '';
  return `<label class="cx64-auto"><input type="checkbox" ${cx64AutoLigada()?'checked':''} onchange="cx64AutoSet(this.checked)"> 🖨️ Imprimir sozinho neste computador</label>`;
}
function cx64AberturaHtml(a){
  const dif = Number(a.diferenca)||0, ok = a.status!=='diferenca';
  const dt = String(a.data||hojeISO()).split('-').reverse().join('/');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Abertura de Caixa</title><style>${OP_CSS_PRINT}body{max-width:76mm;margin:0 auto}</style></head><body>
  <div class="c"><h1>LAS VEGAS SEX SHOP</h1><div class="sub">Abertura de caixa</div></div>
  <div class="linha"></div>
  <table><tr><td>Loja</td><td class="n forte">${esc(cx48LojaNome(a.loja))}</td></tr><tr><td>Data</td><td class="n forte">${esc(dt)}</td></tr>
  <tr><td>Aberto por</td><td class="n">${esc(a.por||'')}</td></tr><tr><td>Hora</td><td class="n">${esc(a.hora||'')}</td></tr></table>
  <div class="linha"></div>
  <table><tr class="forte"><td>Dinheiro contado na gaveta</td><td class="n">${brl2(a.contado)}</td></tr></table>
  <div class="c"><span class="st">${ok?'CONFERIDO':'COM DIFERENÇA'}</span></div>
  ${!ok?`<p class="sub c">Diferença: ${esc(cx48Brl(dif))}${a.obs?' · Motivo: '+esc(a.obs):''}</p>`:''}
  <div class="ass">Assinatura de quem abriu</div>
  <p class="sub c" style="margin-top:10px">Impresso em ${opAgoraTxt()}</p></body></html>`;
}
function cx64ImprimirAbertura(){
  const a = window._cx64Ab; if(!a || typeof opImprimirHtml!=='function') return;
  opImprimirHtml(cx64AberturaHtml(a), `Abertura de Caixa - ${cx48LojaNome(a.loja)} - ${String(a.data||hojeISO()).split('-').reverse().join('-')} - ${primeiroNome(a.por||'')}`);
}
/* guarda quem abriu/que loja (o servidor devolve só status, contado e diferença) */
{
  const _envV64 = cx48Enviar;
  cx48Enviar = async function cx48Enviar(){
    const c = CXM;
    if(c && c.op==='abrir') window._cx64Pend = {loja:c.loja, por:cx48Colab(c.quem).nome, obs:c.obs};
    return _envV64.apply(this, arguments);
  };
  const _resV64 = cx48Resultado;
  cx48Resultado = function cx48Resultado(op, f){
    _resV64.apply(this, arguments);
    if(op!=='abrir') return;
    const p = window._cx64Pend || {}, agora = new Date();
    window._cx64Ab = {...f, loja:f.loja||p.loja, por:p.por, obs:p.obs, data:hojeISO(), hora:agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
    const bt = document.querySelector('#modal .cx48-res .btn.pri');
    if(bt) bt.insertAdjacentHTML('beforebegin', `<button class="btn largo" style="margin-top:10px" onclick="cx64ImprimirAbertura()"><i class="ti ti-printer"></i> Imprimir comprovante</button>`);
    const box = document.querySelector('#modal .cx48-res'); if(box) box.insertAdjacentHTML('beforeend', cx64AutoHtml());
    if(cx64AutoLigada()) setTimeout(cx64ImprimirAbertura, 500);
  };
}
/* fechamento: imprime sozinho logo depois de fechar (não quando só está vendo um fechamento antigo) */
if(typeof opCaixaResultado==='function'){
  const _fechV64 = opCaixaResultado;
  opCaixaResultado = function opCaixaResultado(f, soVer){
    const r = _fechV64.apply(this, arguments);
    try{
      if(f && !soVer && cx48Terminal()){
        const box = document.querySelector('#modal .modal-c'); if(box) box.insertAdjacentHTML('beforeend', cx64AutoHtml());
        if(cx64AutoLigada() && typeof opImprimirAtual==='function') setTimeout(opImprimirAtual, 500);
      }
    }catch(e){ console.warn('v64 impressão', e); }
    return r;
  };
}
