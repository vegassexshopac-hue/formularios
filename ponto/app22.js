/* ═══════════ Portal Equipe Las Vegas · v22 — CLIENTES E FIDELIDADE ═══════════
   Na comanda: buscar/cadastrar a cliente (com "Quem indicou?"), cartão de 10 selos,
   presente na 5ª, 20% + presente na 10ª, cashback de 10% (vale 30 dias) e a comemoração BEM GRANDE.
   Administração › Clientes: lista, ficha com a evolução, presentes, importação e regras.
   Indicação: vale selo para quem indicou quando a amiga FINALIZA a 1ª compra.
   Servidor: FIDELIDADE.gs (abas Clientes e Presentes, Config › fidelidade). */
(function(){
  const css = `
.fid-btn{width:100%;display:flex;align-items:center;gap:10px;background:linear-gradient(120deg,var(--ouro-claro),#fff);border:1.5px dashed var(--dourado2);border-radius:14px;padding:10px 12px;margin-bottom:10px;font:inherit;text-align:left;cursor:pointer;color:var(--creme);transition:transform .15s var(--mola)}
.fid-btn:hover{transform:translateY(-1px) scale(1.01)}.fid-btn:active{transform:scale(.98)}
.fid-btn .ic{font-size:24px;animation:fidBalanca 2.4s ease-in-out infinite}
.fid-btn b{display:block;font-size:14px}.fid-btn small{display:block;color:var(--creme2);font-size:12px}
.fid-card{background:linear-gradient(135deg,#1C1416,#3a1218 70%,#5e0d16);color:#fff;border-radius:18px;padding:12px 14px;margin-bottom:10px;position:relative;overflow:hidden;animation:fidSobe .35s var(--mola)}
.fid-card::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.12) 48%,transparent 60%);background-size:260% 100%;animation:fidBrilho 5s ease-in-out infinite;pointer-events:none}
.fid-card .top{display:flex;align-items:center;gap:8px}
.fid-card .top b{font-size:15px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fid-card .top small{color:#FFD98A;font-size:11.5px}
.fid-card .x{background:rgba(255,255,255,.12);border:0;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:grid;place-items:center;position:relative;z-index:1}
.fid-selos{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:10px 0 6px}
.fid-selos i{aspect-ratio:1;border-radius:50%;border:1.5px solid rgba(255,217,138,.45);display:grid;place-items:center;font-style:normal;font-size:11px;color:rgba(255,255,255,.5);position:relative}
.fid-selos i.on{background:radial-gradient(circle at 35% 30%,#FFE9A8,#F5B524 60%,#C98300);border-color:#FFD98A;color:#3a2500;box-shadow:0 0 10px rgba(245,181,36,.5)}
.fid-selos i.agora{border-style:dashed;border-color:#fff;animation:fidPulsa 1.3s infinite}
.fid-selos i.pr{font-size:13px}
.fid-msg{font-size:12.5px;color:#FFE3A3;line-height:1.35}
.fid-msg b{color:#fff}
.fid-premio{background:rgba(255,255,255,.1);border-radius:12px;padding:8px 10px;margin-top:8px;position:relative;z-index:1}
.fid-premio .t{font-weight:800;font-size:13.5px;color:#FFD98A}
.fid-premio select,.fid-premio input{width:100%;margin-top:6px;border-radius:10px;border:0;padding:8px 10px;font:inherit;font-size:13.5px;color:#1C1416;background:#fff}
.fid-cash{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;position:relative;z-index:1}
.fid-cash b{font-size:15px;color:#7CF0B5}
.fid-cash button{margin-left:auto;border:0;border-radius:99px;padding:6px 12px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;background:#fff;color:#1C1416;transition:transform .15s var(--mola)}
.fid-cash button.on{background:#7CF0B5}
.fid-cash button:active{transform:scale(.94)}
.fid-linha b{color:var(--ok)!important}
.fid-res{display:grid;gap:6px;margin-top:10px;max-height:46vh;overflow:auto}
.fid-res button{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid var(--linha2);border-radius:14px;padding:10px 12px;font:inherit;text-align:left;cursor:pointer;animation:fidSobe .3s both;transition:transform .15s var(--mola),border-color .15s}
.fid-res button:hover{border-color:var(--vermelho);transform:translateX(3px)}
.fid-res .av{width:38px;height:38px;border-radius:50%;background:var(--vermelho-claro);color:var(--vermelho2);display:grid;place-items:center;font-weight:800;flex:none}
.fid-res .t{flex:1;min-width:0}.fid-res .t b{display:block}.fid-res .t small{color:var(--creme2);font-size:12px}
.fid-mini{display:inline-flex;gap:2px;vertical-align:middle}.fid-mini i{width:7px;height:7px;border-radius:50%;background:var(--linha2)}.fid-mini i.on{background:var(--dourado2)}
.fid-chip{display:inline-flex;align-items:center;gap:6px;background:var(--ouro-claro);border-radius:99px;padding:5px 10px;font-size:13px;font-weight:700}
.fid-chip button{border:0;background:none;cursor:pointer;color:var(--creme2)}
/* comemoração */
.fid-festa{background:linear-gradient(135deg,rgba(245,181,36,.18),rgba(227,16,31,.18));border:1px solid rgba(255,217,138,.35);border-radius:18px;padding:12px 14px;margin:12px 0;color:#fff;animation:fidSobe .5s .3s both}
.fid-festa h4{margin:0;font-size:18px;color:#FFD98A}
.fid-festa p{margin:4px 0 0;font-size:13.5px;color:rgba(255,255,255,.85)}
.fid-festa .fid-selos i{animation:fidCai .45s both}
.fid-show{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:20px;color:#fff;background:radial-gradient(circle at 50% 40%,#7a0d18,#1C1416 70%);animation:fade .25s}
.fid-show .raios{position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg,rgba(255,217,138,.13) 0 10deg,transparent 10deg 20deg);animation:fidGira 18s linear infinite;pointer-events:none}
.fid-show .em{font-size:clamp(70px,16vw,140px);animation:fidPresente 1.2s var(--mola) both,fidBalanca 2.4s 1.2s ease-in-out infinite;position:relative}
.fid-show h1{font-size:clamp(34px,8vw,76px);line-height:1;margin:10px 0 6px;color:#FFD98A;text-shadow:0 6px 30px rgba(245,181,36,.55);animation:fidZoom .7s .25s var(--mola) both;position:relative;letter-spacing:-.02em}
.fid-show h2{font-size:clamp(20px,4.4vw,36px);margin:0;position:relative;animation:fidSobe .6s .5s both}
.fid-show .pres{position:relative;margin-top:16px;background:#fff;color:#1C1416;border-radius:20px;padding:14px 22px;font-size:clamp(18px,3.6vw,28px);font-weight:800;box-shadow:0 20px 50px rgba(0,0,0,.4);animation:fidZoom .6s .8s var(--mola) both}
.fid-show .pres small{display:block;font-size:13px;color:#7b6f6a;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.fid-show .off{position:relative;margin-top:12px;font-size:clamp(26px,6vw,52px);font-weight:900;color:#7CF0B5;animation:fidZoom .6s 1s var(--mola) both}
.fid-show .ok{position:relative;margin-top:22px;animation:fidSobe .5s 1.3s both}
/* administração */
.fid-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.fid-kpi{background:#fff;border-radius:16px;padding:12px 14px;box-shadow:var(--sh);animation:fidSobe .4s both}
.fid-kpi b{display:block;font-size:24px;letter-spacing:-.02em}.fid-kpi small{color:var(--creme2);font-size:12.5px}
.fid-sub{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.fid-sub button{border:1px solid var(--linha2);background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;gap:6px;align-items:center;transition:transform .15s var(--mola)}
.fid-sub button.on{background:var(--vermelho);color:#fff;border-color:var(--vermelho)}
.fid-sub button:active{transform:scale(.95)}
.fid-ficha .fid-card{margin:0 0 12px}
.fid-tl{display:grid;gap:6px}
.fid-tl div{display:flex;gap:10px;align-items:center;background:var(--veludo2);border-radius:12px;padding:8px 10px;font-size:13.5px;animation:fidSobe .3s both}
.fid-tl .d{font-weight:800;min-width:46px}.fid-tl .c{flex:1}.fid-tl small{color:var(--creme2)}
.fid-barras{display:flex;align-items:flex-end;gap:6px;height:90px;margin:8px 0 2px}
.fid-barras div{flex:1;background:linear-gradient(180deg,var(--dourado2),var(--vermelho));border-radius:6px 6px 2px 2px;min-height:3px;transform-origin:bottom;animation:fidCresce .7s var(--mola) both;position:relative}
.fid-barras div span{position:absolute;top:-17px;left:0;right:0;text-align:center;font-size:11px;font-weight:700;color:var(--creme2)}
.fid-meses{display:flex;gap:6px}.fid-meses span{flex:1;text-align:center;font-size:11px;color:var(--creme3)}
.fid-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:700px){.fid-g2{grid-template-columns:1fr}}
@keyframes fidSobe{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes fidBrilho{0%,60%{background-position:120% 0}100%{background-position:-60% 0}}
@keyframes fidPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@keyframes fidBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
@keyframes fidCai{from{transform:scale(0) rotate(-90deg);opacity:0}to{transform:none;opacity:1}}
@keyframes fidGira{to{transform:rotate(360deg)}}
@keyframes fidPresente{0%{transform:scale(0) rotate(-30deg)}60%{transform:scale(1.25) rotate(8deg)}100%{transform:none}}
@keyframes fidZoom{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
@keyframes fidCresce{from{transform:scaleY(0)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.fid-card::after,.fid-show .raios,.fid-btn .ic{animation:none}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ═════════ estado e utilidades ═════════ */
const FID = {cli:null, escolhas:{}, usarCash:false, fresco:false, ultimo:null, busca:{q:'', res:null, t:null, carregando:false}, novo:null};
function fidD(){ const d = S.adm && S.tela==='admin' ? S.adm.dados : S.sess?.dados; return d?.fidelidade && !d.fidelidade.erro ? d.fidelidade : null; }
function fidCfg(){ return fidD()?.cfg || {minimo:50, cashback_pct:10, cashback_dias:30, ciclo:10, presente_em:5, desconto10:20}; }
function fidGuardar(){ if(S.sess?.eid) LS.set('lv_fid_'+S.sess.eid, {cli:FID.cli, escolhas:FID.escolhas, usarCash:FID.usarCash}); }
function fidRestaurar(){ if(FID._eid === S.sess?.eid) return; FID._eid = S.sess?.eid; const g = S.sess?.eid ? LS.get('lv_fid_'+S.sess.eid) : null; Object.assign(FID, {cli:g?.cli||null, escolhas:g?.escolhas||{}, usarCash:!!g?.usarCash, fresco:false}); }
function fidTipo(n){ const c = fidCfg(); return n % c.ciclo === 0 ? 10 : n % c.ciclo === c.presente_em ? 5 : 0; }
function fidFalta(n){ const c = fidCfg(), r = n % c.ciclo; return r < c.presente_em ? c.presente_em - r : c.ciclo - r; }
function fidOrd(n){ return n + 'ª'; }
function fidIni(nome){ return String(nome||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase(); }
async function fidApi(op, dados={}){ return api('fidelidade', {eid:S.sess.eid, ...S.sess.cred, op, ...dados}); }
async function fidAdm(op, dados={}){ return api('admFidelidade', {...S.adm.cred, op, ...dados}); }
function fidSelos(noCartao, agora, ciclo, extraCls=''){
  ciclo = ciclo || fidCfg().ciclo; const pe = fidCfg().presente_em;
  return `<div class="fid-selos ${extraCls}">${Array.from({length:ciclo},(_,i)=>{ const n = i+1, on = n<=noCartao, ag = n===agora; const pr = n===ciclo?'⭐':n===pe?'🎁':'';
    return `<i class="${on?'on':''} ${ag?'agora':''} ${pr&&!on?'pr':''}" style="animation-delay:${i*60}ms">${on?(pr||'💋'):(pr||n)}</i>`; }).join('')}</div>`;
}

/* o que a fidelidade faz nesta comanda (prévia; o servidor confere tudo de novo) */
function fidPrevia(k){
  const c = FID.cli, cfg = fidCfg(); if(!c) return null;
  const base = r2(k.sub - k.desc), conta = k.sub > 0 && base >= cfg.minimo - .001;
  const selo = conta ? c.selos + 1 : 0, pend = (c.pendentes||[]).slice();
  if(selo && fidTipo(selo)) pend.push({key:c.id+'|'+selo, tipo:fidTipo(selo), n:selo, origem:'compra', nova:true});
  const ativo = p => { const e = FID.escolhas[p.key]; return e && !e.depois && (e.id || (e.texto||'').trim()); };
  const falta = pend.filter(p=>!FID.escolhas[p.key] || (!FID.escolhas[p.key].depois && !ativo(p)));
  const tem20 = pend.some(p=>p.tipo===10 && ativo(p));
  return {base, conta, selo, pend, falta, tem20, ativo};
}

/* ═════════ contas da comanda: 20% do cartão e cashback ═════════ */
const _pdvContasV22 = pdvContas;
pdvContas = function pdvContas(){
  const k = _pdvContasV22();
  k.fidDesc = 0; k.fidCash = 0;
  if(!FID.cli || !k.sub) return k;
  let p = fidPrevia(k);
  if(p.tem20 && k.desc){ k.desc = 0; k.acima = false; k.pctDesc = 0; k.total = k.sub; p = fidPrevia(k); }
  if(p.tem20) k.fidDesc = r2(k.sub * fidCfg().desconto10 / 100);
  const saldo = FID.cli.cashback?.saldo || 0;
  if(FID.usarCash && saldo > 0) k.fidCash = r2(Math.min(saldo, Math.max(0, k.sub - k.desc - k.fidDesc)));
  k.total = r2(k.sub - k.desc - k.fidDesc - k.fidCash);
  k.fid = p;
  return k;
};

/* ═════════ comanda: cartão da cliente no lugar de "Adicionar cliente" ═════════ */
const _pdvPintarComandaV22 = pdvPintarComanda;
pdvPintarComanda = function pdvPintarComanda(bater){
  fidRestaurar();
  _pdvPintarComandaV22(bater);
  const el = $('#pdv-comanda'); if(!el) return;
  if(FID.cli && !FID.fresco){ FID.fresco = true; fidRecarregarCli(); }
  const k = pdvContas(), alvo = el.querySelector('.pdv-cli') || el.querySelector('.pdv-extra.g2');
  if(alvo){
    const box = document.createElement('div'); box.id = 'fid-box'; box.innerHTML = fidBloco(k);
    alvo.parentNode.insertBefore(box, alvo);
    if(FID.cli) alvo.remove();
  }
  const tot = el.querySelector('.pdv-total');
  if(tot && FID.cli){
    let h = '';
    if(k.fidDesc) h += `<div class="pdv-linha fid-linha"><span>⭐ Cartão fidelidade · ${fidCfg().desconto10}%</span><b>− ${brl2(k.fidDesc)}</b></div>`;
    if(k.fidCash) h += `<div class="pdv-linha fid-linha"><span>💸 Cashback usado</span><b>− ${brl2(k.fidCash)}</b></div>`;
    if(h) tot.insertAdjacentHTML('beforebegin', h);
    if(k.fid?.tem20){ const inp = el.querySelector('.pdv-desc input'); if(inp){ inp.disabled = true; inp.value = ''; inp.placeholder = '—'; inp.title = 'O 20% do cartão não soma com outro desconto'; } }
  }
  const fim = $('#pdv-fim');
  if(fim && FID.cli && k.fid?.falta.length && PDV.car.length && PDV.pag && !PDV.env){ fim.disabled = false; fim.innerHTML = '🎁 Escolha o presente da cliente'; fim.classList.add('op-pulsa'); }
};
function fidBloco(k){
  const c = FID.cli, cfg = fidCfg();
  if(!c && !fidD()) return `<div class="fid-btn" style="cursor:default;border-color:var(--bad)"><span class="ic">⚠️</span><span><b>Fidelidade ainda desligada</b><small>A administração precisa atualizar o servidor (FIDELIDADE.gs)</small></span></div>`;
  if(!c) return `<button class="fid-btn" onclick="fidAbrirBusca()"><span class="ic">💳</span><span><b>Cliente fidelidade</b><small>Buscar ou cadastrar · selo, presente e cashback</small></span><i class="ti ti-chevron-right" style="margin-left:auto"></i></button>`;
  const p = k.fid || fidPrevia(k), no = c.no_cartao, cheio = no===0 && c.selos>0 && (c.pendentes||[]).some(x=>x.tipo===10);
  const mostrar = cheio ? cfg.ciclo : no, agora = p && p.selo ? ((p.selo-1) % cfg.ciclo) + 1 : 0;
  const novoCartao = p && p.selo && agora===1 && no===0 && c.selos>0;
  let msg;
  if(!PDV.car.length) msg = `<b>${c.selos}</b> ${c.selos===1?'selo':'selos'} · ${c.compras||0} ${c.compras===1?'compra':'compras'}. Adicione os produtos.`;
  else if(p.conta){ const t = fidTipo(p.selo); msg = `Esta compra vira a <b>${fidOrd(p.selo)}</b>${t===10?` — <b>${cfg.desconto10}% OFF + presente!</b> ⭐`:t===5?` — <b>ganha presente!</b> 🎁`:` · faltam <b>${fidFalta(p.selo)}</b> para o próximo prêmio`}`; }
  else msg = `Faltam <b>${brl2(cfg.minimo - p.base)}</b> para esta compra ganhar selo (mín. ${brl(cfg.minimo)})`;
  const pres = (fidD()?.presentes||[]);
  const premios = (p?.pend||[]).map(x=>{
    const e = FID.escolhas[x.key] || {}, lista = pres.filter(g=>g.para==='ambos' || g.para===String(x.tipo));
    const val = e.depois ? '__depois' : e.id ? e.id : (e.texto!=null ? '__outro' : '');
    return `<div class="fid-premio"><div class="t">${x.tipo===10?`⭐ ${fidOrd(x.n)} compra: ${cfg.desconto10}% OFF + presente`:`🎁 Presente da ${fidOrd(x.n)} compra`}${x.origem==='indicacao'?' <small>(por indicação)</small>':''}</div>
      <select onchange="fidEscolher('${x.key}',this.value)"><option value="" ${!val?'selected':''}>Escolha o presente…</option>${lista.map(g=>`<option value="${g.id}" ${val===g.id?'selected':''}>${esc(g.nome)}</option>`).join('')}<option value="__outro" ${val==='__outro'?'selected':''}>Outro (escrever)</option><option value="__depois" ${val==='__depois'?'selected':''}>Entregar na próxima visita</option></select>
      ${val==='__outro'?`<input placeholder="Qual presente?" value="${esc(e.texto||'')}" oninput="FID.escolhas['${x.key}'].texto=this.value;fidGuardar();clearTimeout(window._fidT);window._fidT=setTimeout(()=>pdvPintarComanda(),500)">`:''}
      ${val==='__depois'&&x.tipo===10?`<small style="display:block;margin-top:4px;color:#FFE3A3">O ${cfg.desconto10}% também fica para a próxima compra.</small>`:''}</div>`;
  }).join('');
  const cb = c.cashback || {saldo:0};
  return `<div class="fid-card">
    <div class="top"><span style="font-size:20px">💳</span><b>${esc(c.nome)}</b><small>${esc(c.tel_mask||'')}</small><button class="x" title="Tirar a cliente" onclick="fidTirar()"><i class="ti ti-x"></i></button></div>
    ${fidSelos(mostrar, novoCartao ? 1 : (agora > no ? agora : 0))}
    <div class="fid-msg">${novoCartao?'🔁 Cartão novo! ':''}${msg}</div>
    ${premios}
    ${cb.saldo>0?`<div class="fid-cash"><span>💸 Cashback <b>${brl2(cb.saldo)}</b>${cb.vence?`<br><small style="color:#FFE3A3">vence ${ddmm(cb.vence.data)}</small>`:''}</span><button class="${FID.usarCash?'on':''}" onclick="FID.usarCash=!FID.usarCash;fidGuardar();pdvPintarComanda()">${FID.usarCash?'✔ Usando':'Usar agora'}</button></div>`:''}
  </div>`;
}
function fidEscolher(key, v){
  FID.escolhas[key] = v==='__depois' ? {depois:true} : v==='__outro' ? {texto:''} : v ? {id:v} : undefined;
  if(!FID.escolhas[key]) delete FID.escolhas[key];
  fidGuardar(); pdvPintarComanda();
}
function fidTirar(){ Object.assign(FID, {cli:null, escolhas:{}, usarCash:false}); PDV.cli=''; PDV.tel=''; PDV.verCli=false; fidGuardar(); pdvGuardar(); pdvPintarComanda(); }
function fidUsar(cartao){
  FID.cli = cartao; FID.escolhas = {}; FID.usarCash = false; FID.fresco = true;
  PDV.cli = cartao.nome; PDV.tel = cartao.tel || ''; PDV.verCli = false;
  fidGuardar(); pdvGuardar(); fecharModal(); pdvPintarComanda(true);
  toast(`💳 ${primeiroNome(cartao.nome)} na comanda`);
}
async function fidRecarregarCli(){
  if(!FID.cli) return;
  try{ const r = await fidApi('cartao', {id:FID.cli.id}); if(FID.cli && FID.cli.id===r.cartao.id){ FID.cli = r.cartao; fidGuardar(); pdvPintarComanda(); } }
  catch(e){ if(/não encontrada/.test(e.message)){ fidTirar(); toast('A cliente da comanda não existe mais', true); } }
}

/* ═════════ buscar / cadastrar ═════════ */
function fidAbrirBusca(){
  FID.busca = {q:'', res:null, t:null, carregando:false}; FID.novo = null;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">💳 Cliente fidelidade</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c" id="fid-modal">${fidModalCorpo()}</div></div></div>`;
  setTimeout(()=>$('#fid-q')?.focus(), 50);
}
function fidModalCorpo(){
  if(FID.novo) return fidFormNovo();
  const B = FID.busca;
  return `<input class="inp" id="fid-q" placeholder="Nome ou WhatsApp da cliente" value="${esc(B.q)}" autocomplete="off" oninput="fidDigitou(this.value)" onkeydown="if(event.key==='Enter'){const b=document.querySelector('#fid-res button');b&&b.click();}">
    <div id="fid-res" class="fid-res">${fidResultados()}</div>
    <button class="btn ouro largo" style="margin-top:12px" onclick="fidNovo()"><i class="ti ti-user-plus"></i> Cadastrar cliente nova</button>`;
}
function fidResultados(){
  const B = FID.busca;
  if(B.carregando) return `<p class="suave" style="margin:6px 2px"><i class="ti ti-loader-2"></i> Procurando…</p>`;
  if(!B.res) return `<p class="suave" style="margin:6px 2px;font-size:13.5px">Digite pelo menos 2 letras do nome ou 4 números do WhatsApp.</p>`;
  if(!B.res.length) return `<p class="suave" style="margin:6px 2px">Ninguém com “${esc(B.q)}”. Cadastre a cliente 👇</p>`;
  const ci = fidCfg().ciclo;
  return B.res.map((c,i)=>`<button style="animation-delay:${i*40}ms" onclick="fidEscolherCli('${c.id}')"><span class="av">${fidIni(c.nome)}</span><span class="t"><b>${esc(c.nome)}</b><small>${esc(c.tel_mask)} · <span class="fid-mini">${Array.from({length:ci},(_,j)=>`<i class="${j<c.no_cartao?'on':''}"></i>`).join('')}</span> ${c.selos} selos${c.cashback?` · 💸 ${brl2(c.cashback)}`:''}${c.pendentes?' · 🎁 prêmio':''}</small></span><i class="ti ti-chevron-right"></i></button>`).join('');
}
function fidDigitou(v){
  const B = FID.busca; B.q = v; clearTimeout(B.t);
  const dig = v.replace(/\D/g,''), ok = /\d/.test(v) ? dig.length>=4 : v.trim().length>=2;
  if(!ok){ B.res = null; B.carregando=false; $('#fid-res').innerHTML = fidResultados(); return; }
  B.carregando = true; $('#fid-res').innerHTML = fidResultados();
  B.t = setTimeout(async ()=>{
    const q = v;
    try{ const r = await fidApi('buscar', {q}); if(FID.busca.q!==q) return; B.res = r.clientes; }
    catch(e){ B.res = []; toast(e.message, true); }
    B.carregando = false; const el = $('#fid-res'); if(el) el.innerHTML = fidResultados();
  }, 320);
}
async function fidEscolherCli(id){
  try{ const r = await fidApi('cartao', {id}); fidUsar(r.cartao); }catch(e){ toast(e.message, true); }
}
function fidNovo(){
  const q = FID.busca.q.trim(), tel = /\d{4}/.test(q) ? q.replace(/\D/g,'') : '';
  FID.novo = {nome: tel ? '' : q, tel, nascimento:'', ind:null, indQ:'', indRes:null, env:false};
  $('#fid-modal').innerHTML = fidModalCorpo(); setTimeout(()=>$(FID.novo.nome?'#fid-tel':'#fid-nome')?.focus(), 30);
}
function fidFormNovo(){
  const N = FID.novo;
  return `<div class="campo"><label>Nome da cliente</label><input class="inp" id="fid-nome" value="${esc(N.nome)}" oninput="FID.novo.nome=this.value" autocomplete="off"></div>
    <div class="campo"><label>WhatsApp (com DDD)</label><input class="inp num" id="fid-tel" inputmode="tel" placeholder="(68) 9 9999-9999" value="${esc(N.tel)}" oninput="FID.novo.tel=this.value"></div>
    <div class="campo"><label>Aniversário <small class="apagado">(opcional)</small></label><input class="inp" placeholder="dd/mm/aaaa" inputmode="numeric" value="${esc(N.nascimento)}" oninput="FID.novo.nascimento=this.value"></div>
    <div class="campo"><label>🤝 Quem indicou? <small class="apagado">(opcional)</small></label>
      ${N.ind?`<span class="fid-chip">💳 ${esc(N.ind.nome)} <button onclick="FID.novo.ind=null;$('#fid-modal').innerHTML=fidModalCorpo()"><i class="ti ti-x"></i></button></span>
        <p class="apagado" style="font-size:12.5px;margin:6px 0 0">Quando esta cliente finalizar a 1ª compra, a ${esc(primeiroNome(N.ind.nome))} ganha 1 selo.</p>`
      :`<input class="inp" id="fid-indq" placeholder="Buscar quem indicou (nome ou WhatsApp)" value="${esc(N.indQ)}" autocomplete="off" oninput="fidIndDigitou(this.value)"><div class="fid-res" id="fid-indres">${fidIndRes()}</div>`}</div>
    <div class="linha" style="gap:8px;margin-top:6px"><button class="btn" onclick="FID.novo=null;$('#fid-modal').innerHTML=fidModalCorpo()"><i class="ti ti-arrow-left"></i> Voltar</button>
      <button class="btn ouro cresce" id="fid-salvar" onclick="fidSalvarNovo()"><i class="ti ti-check"></i> Cadastrar e usar na comanda</button></div>`;
}
function fidIndRes(){ const r = FID.novo?.indRes; if(!r) return ''; if(!r.length) return '<p class="suave" style="margin:4px 2px;font-size:13px">Não achei.</p>';
  return r.map(c=>`<button onclick="fidIndPegar('${c.id}','${esc(c.nome).replace(/'/g,'&#39;')}')"><span class="av">${fidIni(c.nome)}</span><span class="t"><b>${esc(c.nome)}</b><small>${esc(c.tel_mask)}</small></span></button>`).join(''); }
function fidIndDigitou(v){
  const N = FID.novo; N.indQ = v; clearTimeout(N.t);
  const dig = v.replace(/\D/g,''); if(/\d/.test(v) ? dig.length<4 : v.trim().length<2){ N.indRes = null; $('#fid-indres').innerHTML=''; return; }
  N.t = setTimeout(async ()=>{ try{ const r = await fidApi('buscar', {q:v}); if(FID.novo?.indQ!==v) return; N.indRes = r.clientes; }catch(e){ N.indRes = []; } const el = $('#fid-indres'); if(el) el.innerHTML = fidIndRes(); }, 320);
}
function fidIndPegar(id, nome){ FID.novo.ind = {id, nome}; $('#fid-modal').innerHTML = fidModalCorpo(); }
async function fidSalvarNovo(){
  const N = FID.novo; if(N.env) return;
  if((N.nome||'').trim().length < 2) return toast('Escreva o nome', true);
  if(!/^\d{10,11}$/.test(N.tel.replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,''))) return toast('WhatsApp com DDD, ex.: 68 99999-9999', true);
  N.env = true; const b = $('#fid-salvar'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Cadastrando…'; }
  try{
    const r = await fidApi('cadastrar', {cliente:{nome:N.nome, tel:N.tel, nascimento:N.nascimento, indicado_por:N.ind?.id||''}});
    fidUsar(r.cartao); chuvaConfete(); toast(`Bem-vinda, ${primeiroNome(r.cartao.nome)}! 💋`);
  }catch(e){
    N.env = false; if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-check"></i> Cadastrar e usar na comanda'; }
    const m = String(e.message||''); toast(m, true);
    if(/já é da cliente/.test(m)){ FID.novo = null; FID.busca.q = N.tel; $('#fid-modal').innerHTML = fidModalCorpo(); fidDigitou(N.tel.replace(/\D/g,'').slice(-8)); }
  }
}

/* ═════════ finalizar: manda os dados da fidelidade junto da venda ═════════ */
const _apiV22 = api;
api = async function api(a, dados={}){
  if(a==='venda' && dados && dados.pdv && !dados.cancelar && FID.cli){
    const k = pdvContas(), p = k.fid || fidPrevia(k), esc2 = {};
    (p?.pend||[]).forEach(x=>{ const e = FID.escolhas[x.key]; if(e && !e.depois && (e.id || (e.texto||'').trim())) esc2[x.key] = e.id ? {id:e.id} : {texto:e.texto.trim()}; });
    dados = {...dados, cliente_id:FID.cli.id, cashback_usar: k.fidCash ? String(k.fidCash) : '', fid_presentes: esc2, desconto: p?.tem20 ? '' : dados.desconto};
    const r = await _apiV22(a, dados);
    FID.ultimo = r.fid && !r.fid.repetida ? r.fid : null;
    Object.assign(FID, {cli:null, escolhas:{}, usarCash:false}); fidGuardar();
    return r;
  }
  return _apiV22(a, dados);
};
const _pdvFinalizarV22 = pdvFinalizar;
pdvFinalizar = async function pdvFinalizar(){
  if(FID.cli && PDV.car.length){ const k = pdvContas(); if(k.fid?.falta.length){ toast('🎁 Escolha o presente da cliente (ou "Entregar na próxima visita")', true); const s = document.querySelector('.fid-premio select'); if(s){ s.focus(); s.scrollIntoView({block:'center', behavior:'smooth'}); } return; } }
  return _pdvFinalizarV22();
};
const _pdvLimparV22 = pdvLimpar;
pdvLimpar = function pdvLimpar(){ const tinha = PDV.car.length; _pdvLimparV22(); if(!PDV.car.length && tinha){ Object.assign(FID, {cli:null, escolhas:{}, usarCash:false}); fidGuardar(); pdvPintarComanda(); } };

/* ═════════ a comemoração — bem grande ═════════ */
const _pdvCelebrarV22 = pdvCelebrar;
pdvCelebrar = function pdvCelebrar(v, antes, depois, cli){
  _pdvCelebrarV22(v, antes, depois, cli);
  const F = FID.ultimo; FID.ultimo = null; if(!F) return;
  const card = document.querySelector('#festa .festa-card'), acoes = card?.querySelector('.festa-acoes'); if(!card) return;
  const cfg = fidCfg(), K = F.cartao || {}, nome = primeiroNome(F.cliente.nome);
  const cheio = F.selo && F.selo % cfg.ciclo === 0, mostrar = cheio ? cfg.ciclo : (K.no_cartao||0);
  const prox = F.selo ? (()=>{ const r = F.selo % cfg.ciclo; return r < cfg.presente_em ? ['🎁 presente', cfg.presente_em - r] : ['⭐ '+cfg.desconto10+'% + presente', cfg.ciclo - r]; })() : null;
  const html = `<div class="fid-festa">
    <h4>💋 Parabéns, ${esc(nome)}!</h4>
    ${F.selo?`<p>Esta é a sua <b style="color:#FFD98A;font-size:17px">${fidOrd(F.selo)} compra</b> no cartão fidelidade da Las Vegas.</p>`:`<p>Compras a partir de ${brl(F.minimo)} ganham selo no cartão.</p>`}
    ${fidSelos(mostrar, 0, cfg.ciclo)}
    ${prox && !F.premios.length && !F.novo_premio?`<p>Faltam <b>${prox[1]}</b> ${prox[1]===1?'compra':'compras'} para o ${prox[0]}.</p>`:''}
    ${F.premios.map(p=>`<p style="color:#FFD98A;font-weight:800;font-size:15px">${p.tipo===10?'⭐':'🎁'} Ganhou: ${esc(p.presente)}${p.tipo===10?` + ${cfg.desconto10}% OFF`:''}</p>`).join('')}
    ${F.novo_premio?`<p style="color:#FFD98A;font-weight:800">🎁 Presente da ${fidOrd(F.novo_premio.n)} compra liberado — entrega na próxima visita.</p>`:''}
    ${F.cashback_gerado?`<p>💸 Ganhou <b style="color:#7CF0B5">${brl2(F.cashback_gerado)}</b> de cashback${K.cashback?.saldo?` · saldo ${brl2(K.cashback.saldo)}`:''} · vale ${cfg.cashback_dias} dias</p>`:''}
    ${F.cashback_usado?`<p>Usou ${brl2(F.cashback_usado)} de cashback nesta compra.</p>`:''}
  </div>`;
  if(acoes) acoes.insertAdjacentHTML('beforebegin', html); else card.insertAdjacentHTML('beforeend', html);
  card.querySelectorAll('.fid-festa .fid-selos i').forEach((i,n)=>i.style.animationDelay = (500+n*90)+'ms');
  if(F.premios.length || F.novo_premio) setTimeout(()=>fidShow(F), 250);
};
function fidShow(F){
  const cfg = fidCfg(), nome = primeiroNome(F.cliente.nome), p10 = F.premios.find(p=>p.tipo===10), p = p10 || F.premios[0];
  const el = document.createElement('div'); el.className = 'fid-show'; el.id = 'fid-show';
  el.innerHTML = `<div class="raios"></div><div class="em">${p10?'⭐':'🎁'}</div>
    <h1>PARABÉNS, ${esc(nome.toUpperCase())}!</h1>
    <h2>${p ? `Você está na sua <b style="color:#FFD98A">${fidOrd(p.n)} compra</b> e ganhou<br>um presente da Las Vegas!` : `Seu presente da ${fidOrd(F.novo_premio.n)} compra está liberado!`}</h2>
    ${p?`<div class="pres"><small>Seu presente</small>${esc(p.presente)}</div>`:`<div class="pres"><small>Retire na próxima visita</small>🎁 Presente Las Vegas</div>`}
    ${p10?`<div class="off">+ ${cfg.desconto10}% OFF NESTA COMPRA</div>`:''}
    <div class="ok"><button class="btn ouro" onclick="fidShowFechar()" style="font-size:17px;padding:0 26px;height:50px">Continuar 💋</button></div>`;
  document.body.appendChild(el);
  chuvaConfete(); setTimeout(chuvaConfete, 700); setTimeout(chuvaConfete, 1500);
  el._tecla = ev => { if(ev.key==='Enter' || ev.key==='Escape'){ ev.preventDefault(); ev.stopImmediatePropagation(); fidShowFechar(); } };
  document.addEventListener('keydown', el._tecla, true);
}
function fidShowFechar(){ const el = $('#fid-show'); if(!el) return; document.removeEventListener('keydown', el._tecla, true); el.remove(); setTimeout(()=>$('#festa-ok')?.focus(), 30); }

/* ═════════ ADMINISTRAÇÃO › CLIENTES ═════════ */
const FA = {L:null, carregando:false, sub:'lista', q:'', ord:'ultima', ficha:null, imp:null, gEd:null};
async function fidAdmCarregar(forcar){
  if(FA.carregando || (FA.L && !forcar)) return;
  FA.carregando = true;
  try{ const r = await fidAdm('lista'); FA.L = r.clientes; if(r.cfg && S.adm.dados.fidelidade) S.adm.dados.fidelidade.cfg = r.cfg; }
  catch(e){ toast(e.message, true); FA.L = FA.L || []; }
  FA.carregando = false; if(S.adm?.tab==='clientes') render();
}
function admClientes(){
  if(!fidD()) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem a fidelidade.</b> Abra o Apps Script, crie o arquivo <b>FIDELIDADE</b> (o último da lista), cole o código de <code>ponto/servidor/FIDELIDADE.gs</code> e publique uma nova versão.</div></div>`;
  if(!FA.L){ fidAdmCarregar(); return `<div class="cartao pad"><p class="suave" style="margin:0"><i class="ti ti-loader-2"></i> Carregando as clientes…</p></div>`; }
  const L = FA.L, cfg = fidCfg(), hoje = hojeISO(), d30 = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  const k = {n:L.length, ativas:L.filter(c=>c.ultima>=d30).length, cash:L.reduce((s,c)=>s+(c.cashback?.saldo||0),0), pend:L.reduce((s,c)=>s+(c.pendentes||0),0), ind:L.reduce((s,c)=>s+(c.indicacoes_validas||0),0)};
  const subs = [['lista','ti-users','Clientes'],['presentes','ti-gift','Presentes'],['importar','ti-file-import','Importar'],['regras','ti-adjustments','Regras']];
  return `<div class="fid-kpis">
      <div class="fid-kpi"><b class="num">${k.n}</b><small>clientes no cadastro</small></div>
      <div class="fid-kpi" style="animation-delay:.05s"><b class="num">${k.ativas}</b><small>compraram nos últimos 30 dias</small></div>
      <div class="fid-kpi" style="animation-delay:.1s"><b class="num" style="color:var(--ok)">${brl2(k.cash)}</b><small>cashback em aberto</small></div>
      <div class="fid-kpi" style="animation-delay:.15s"><b class="num" style="color:var(--dourado)">${k.pend}</b><small>presentes a entregar</small></div>
      <div class="fid-kpi" style="animation-delay:.2s"><b class="num">${k.ind}</b><small>indicações que viraram compra</small></div></div>
    <div class="fid-sub">${subs.map(([s,i,n])=>`<button class="${FA.sub===s?'on':''}" onclick="FA.sub='${s}';render()"><i class="ti ${i}"></i>${n}</button>`).join('')}
      <button style="margin-left:auto" onclick="fidAdmCarregar(true)"><i class="ti ti-refresh"></i>Atualizar</button></div>
    ${FA.sub==='presentes'?fidAdmPresentes():FA.sub==='importar'?fidAdmImportar():FA.sub==='regras'?fidAdmRegras():fidAdmLista()}`;
}
function fidAdmLista(){
  const q = semAcento(FA.q), dig = FA.q.replace(/\D/g,''), ci = fidCfg().ciclo;
  let vis = FA.L.filter(c=>!q || semAcento(c.nome).includes(q) || (dig.length>=3 && String(c.tel).includes(dig)));
  const ords = {ultima:(a,b)=>String(b.ultima).localeCompare(String(a.ultima)), selos:(a,b)=>b.selos-a.selos, gasto:(a,b)=>b.gasto-a.gasto, cash:(a,b)=>(b.cashback?.saldo||0)-(a.cashback?.saldo||0), nome:(a,b)=>a.nome.localeCompare(b.nome), novas:(a,b)=>String(b.criado_em).localeCompare(String(a.criado_em))};
  vis = vis.sort(ords[FA.ord]||ords.ultima);
  return `<div class="linha quebra" style="gap:8px;margin-bottom:10px">
      <input class="inp" style="flex:1;min-width:180px" placeholder="Buscar nome ou WhatsApp…" value="${esc(FA.q)}" oninput="FA.q=this.value;clearTimeout(window._faT);window._faT=setTimeout(render,250)">
      <select class="inp" style="width:auto" onchange="FA.ord=this.value;render()">${[['ultima','Última compra'],['selos','Mais selos'],['gasto','Mais gastou'],['cash','Mais cashback'],['novas','Cadastro mais novo'],['nome','Nome A–Z']].map(([v,n])=>`<option value="${v}" ${FA.ord===v?'selected':''}>${n}</option>`).join('')}</select>
      <button class="btn pri" onclick="fidAdmNova()"><i class="ti ti-user-plus"></i> Nova cliente</button><button class="btn" onclick="fidAdmCsv()"><i class="ti ti-download"></i> CSV</button></div>
    ${!vis.length?`<div class="cartao pad"><p class="suave" style="margin:0">${FA.L.length?'Ninguém com essa busca.':'Nenhuma cliente ainda. Importe o cadastro antigo em <b>Importar</b> ou cadastre pela comanda.'}</p></div>`:`
    <div class="tabela"><table><thead><tr><th>Cliente</th><th class="esconde-p">WhatsApp</th><th>Cartão</th><th class="n">Compras</th><th class="n esconde-p">Gastou</th><th class="n">Cashback</th><th class="esconde-p">Última</th><th class="n esconde-p">Indicou</th></tr></thead><tbody>
    ${vis.slice(0,400).map(c=>`<tr class="clica" onclick="fidAdmFicha('${c.id}')"><td><b>${esc(c.nome)}</b>${c.pendentes?' <span class="selo warn">🎁 '+c.pendentes+'</span>':''}${c.indicado_por_nome?`<br><small class="apagado">indicada por ${esc(primeiroNome(c.indicado_por_nome))}</small>`:''}</td>
      <td class="esconde-p apagado">${fmtTel(c.tel)}</td><td><span class="fid-mini">${Array.from({length:ci},(_,j)=>`<i class="${j<c.no_cartao?'on':''}"></i>`).join('')}</span> <small class="apagado">${c.selos}</small></td>
      <td class="n num">${c.compras}</td><td class="n num esconde-p">${brl(c.gasto)}</td><td class="n num" style="${c.cashback?.saldo?'color:var(--ok);font-weight:700':''}">${c.cashback?.saldo?brl2(c.cashback.saldo):'—'}</td>
      <td class="esconde-p apagado">${c.ultima?ddmm(c.ultima):'—'}</td><td class="n num esconde-p">${c.indicacoes_validas||''}${c.indicacoes>c.indicacoes_validas?`<small class="apagado"> +${c.indicacoes-c.indicacoes_validas}</small>`:''}</td></tr>`).join('')}
    ${vis.length>400?`<tr><td colspan="8" class="apagado">… e mais ${vis.length-400}. Use a busca.</td></tr>`:''}</tbody></table></div>`}`;
}
function fidAdmCsv(){
  const q = s => '"'+String(s??'').replace(/"/g,'""')+'"';
  const linhas = ['nome;whatsapp;nascimento;selos;compras;gastou;cashback;ultima_compra;indicada_por;indicacoes_validas'].concat(FA.L.map(c=>[c.nome,c.tel,c.nascimento,c.selos,c.compras,String(c.gasto).replace('.',','),String(c.cashback?.saldo||0).replace('.',','),c.ultima,c.indicado_por_nome,c.indicacoes_validas].map(q).join(';')));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿'+linhas.join('\n')],{type:'text/csv'})); a.download = 'clientes-las-vegas-'+hojeISO()+'.csv'; a.click();
}
async function fidAdmFicha(id){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo"><div class="modal-c"><p class="suave"><i class="ti ti-loader-2"></i> Abrindo a ficha…</p></div></div></div>`;
  try{ const r = await fidAdm('cartao', {id}); FA.ficha = r.cartao; fidAdmFichaPintar(); }catch(e){ fecharModal(); toast(e.message, true); }
}
function fidAdmFichaPintar(){
  const c = FA.ficha, cfg = fidCfg(), cheio = c.no_cartao===0 && c.selos>0 && (c.pendentes||[]).some(x=>x.tipo===10);
  const meses = []; for(let i=5;i>=0;i--){ const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); meses.push(d.toISOString().slice(0,7)); }
  const porMes = meses.map(m=>c.historico.filter(h=>String(h.data).startsWith(m)).reduce((s,h)=>s+h.total,0)), mx = Math.max(1,...porMes);
  const nomesMes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const msgCash = c.cashback.saldo ? `*Oi, ${primeiroNome(c.nome)}!* 💋\nVocê tem *${brl2(c.cashback.saldo)} de cashback* na Las Vegas Sex Shop${c.cashback.vence?` — use até *${ddmm(c.cashback.vence.data)}*`:''}.\nE já está com *${c.selos} ${c.selos===1?'selo':'selos'}* no cartão fidelidade 🎁\n_Te esperamos!_` : '';
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo fid-ficha">
    <div class="modal-t"><h3 class="cresce">${esc(c.nome)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="fid-card"><div class="top"><span style="font-size:20px">💳</span><b>${c.selos} ${c.selos===1?'selo':'selos'} · ${c.cartoes_completos} ${c.cartoes_completos===1?'cartão completo':'cartões completos'}</b><small>${fmtTel(c.tel)}</small></div>
        ${fidSelos(cheio?cfg.ciclo:c.no_cartao, 0, cfg.ciclo)}
        <div class="fid-msg">${c.pendentes.length?`🎁 <b>${c.pendentes.length} prêmio(s) a entregar:</b> ${c.pendentes.map(p=>fidOrd(p.n)+(p.tipo===10?' (20% + presente)':' (presente)')).join(', ')}`:'Nenhum prêmio pendente.'}${c.selos_iniciais?` · ${c.selos_iniciais} selos de antes do sistema`:''}</div>
        <div class="fid-cash"><span>💸 Cashback <b>${brl2(c.cashback.saldo)}</b>${c.cashback.vence?` <small style="color:#FFE3A3">· ${brl2(c.cashback.vence.valor)} vence ${ddmm(c.cashback.vence.data)}</small>`:''}<br><small style="color:#FFE3A3">ganhou ${brl2(c.cashback.ganho)} · usou ${brl2(c.cashback.usado)} · venceu ${brl2(c.cashback.vencido)}</small></span>${msgCash?`<button onclick='window.open("https://wa.me/${telWa(c.tel)}?text="+encodeURIComponent(${JSON.stringify(msgCash).replace(/'/g,"&#39;")}))'>Lembrar no Zap</button>`:''}</div></div>
      <div class="op-kpis"><span class="op-kpi"><b>${c.compras}</b>compras</span><span class="op-kpi"><b>${brl(c.gasto)}</b>gastou</span><span class="op-kpi"><b>${brl(c.ticket)}</b>ticket médio</span><span class="op-kpi"><b>${c.primeira?ddmm(c.primeira):'—'}</b>1ª compra</span><span class="op-kpi"><b>${c.indicacoes_validas}</b>indicações valendo</span></div>
      <b style="font-size:14px">📈 Evolução (últimos 6 meses)</b>
      <div class="fid-barras">${porMes.map((v,i)=>`<div style="height:${Math.max(3,v/mx*100)}%;animation-delay:${i*80}ms">${v?`<span>${brl(v)}</span>`:''}</div>`).join('')}</div>
      <div class="fid-meses">${meses.map(m=>`<span>${nomesMes[+m.slice(5)-1]}</span>`).join('')}</div>
      <div class="fid-g2" style="margin-top:14px">
        <div><b style="font-size:14px">🧾 Compras</b><div class="fid-tl" style="margin-top:6px">${c.historico.length?c.historico.slice(0,15).map((h,i)=>`<div style="animation-delay:${i*30}ms"><span class="d">${ddmm(h.data)}</span><span class="c">${brl2(h.total)} <small>· ${esc(S.boot?.lojas?.[h.loja]?.nome||h.loja)} · ${esc(h.vendedora)}</small>${h.premios.length?`<br><small>🎁 ${h.premios.map(p=>esc(p.presente)).join(', ')}</small>`:''}${h.cashback_usado?`<br><small>usou ${brl2(h.cashback_usado)} de cashback</small>`:''}</span>${h.conta?`<span class="selo ok">selo ${h.selo}</span>`:'<small>sem selo</small>'}</div>`).join(''):'<p class="suave">Nenhuma compra ainda.</p>'}</div></div>
        <div><b style="font-size:14px">🤝 Indicações</b><div class="fid-tl" style="margin-top:6px">${c.lista_indicacoes.length?c.lista_indicacoes.map(a=>`<div><span class="c">${esc(a.nome)}<br><small>cadastrada ${a.cadastrada?ddmm(a.cadastrada):''}</small></span>${a.valida?`<span class="selo ok">valeu selo ${ddmm(a.em)}</span>`:'<span class="selo warn">aguardando 1ª compra</span>'}</div>`).join(''):'<p class="suave" style="font-size:13.5px">Ainda não indicou ninguém.</p>'}</div>
          ${c.indicado_por_nome?`<p class="apagado" style="font-size:13px">Foi indicada por <b>${esc(c.indicado_por_nome)}</b>.</p>`:''}
          <b style="font-size:14px;display:block;margin-top:12px">🎁 Prêmios</b><div class="fid-tl" style="margin-top:6px">${c.premios.length?c.premios.map(p=>`<div><span class="c">${fidOrd(p.n)} ${p.tipo===10?'⭐ 20% + presente':'🎁 presente'}${p.origem==='indicacao'?' <small>(indicação)</small>':''}${p.presente?`<br><small>${esc(p.presente)}</small>`:''}</span>${p.usado?`<span class="selo ok">entregue ${ddmm(p.usado_em)}</span>`:'<span class="selo warn">a entregar</span>'}</div>`).join(''):'<p class="suave" style="font-size:13.5px">Nenhum ainda.</p>'}</div></div></div>
      <details style="margin-top:14px"><summary style="cursor:pointer;font-weight:700">✏️ Editar cadastro</summary>
        <div class="fid-g2" style="margin-top:10px">
          <div class="campo"><label>Nome</label><input class="inp" id="fe-nome" value="${esc(c.nome)}"></div>
          <div class="campo"><label>WhatsApp</label><input class="inp" id="fe-tel" value="${esc(c.tel)}"></div>
          <div class="campo"><label>Aniversário</label><input class="inp" id="fe-nasc" placeholder="dd/mm/aaaa" value="${c.nascimento?c.nascimento.split('-').reverse().join('/'):''}"></div>
          <div class="campo"><label>E-mail</label><input class="inp" id="fe-email" value="${esc(c.email||'')}"></div>
          <div class="campo"><label>Selos de antes do sistema</label><input class="inp num" id="fe-ini" inputmode="numeric" value="${c.selos_iniciais||0}"></div>
          <div class="campo"><label>Quem indicou</label><select class="inp" id="fe-ind"><option value="">— ninguém —</option>${(FA.L||[]).filter(x=>x.id!==c.id).sort((a,b)=>a.nome.localeCompare(b.nome)).slice(0,3000).map(x=>`<option value="${x.id}" ${c.indicado_por===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></div>
        </div>
        <div class="campo"><label>Observação interna</label><input class="inp" id="fe-obs" value="${esc(c.obs||'')}"></div>
        <div class="linha" style="gap:8px"><button class="btn pri" onclick="fidAdmSalvar()"><i class="ti ti-device-floppy"></i> Salvar</button><button class="btn p fantasma" style="margin-left:auto" onclick="fidAdmApagar()"><i class="ti ti-trash"></i> Tirar do cadastro</button></div>
      </details>
    </div></div></div>`;
}
async function fidAdmSalvar(){
  const c = FA.ficha, v = id => $('#'+id)?.value;
  try{ const r = await fidAdm('salvar', {cliente:{id:c.id, nome:v('fe-nome'), tel:v('fe-tel'), nascimento:v('fe-nasc'), email:v('fe-email'), selos_iniciais:v('fe-ini'), indicado_por:v('fe-ind'), obs:v('fe-obs')}});
    FA.ficha = r.cartao; fidAdmFichaPintar(); toast('Salvo ✔'); fidAdmCarregar(true); }catch(e){ toast(e.message, true); }
}
async function fidAdmApagar(){
  if(!confirm('Tirar '+FA.ficha.nome+' do cadastro? As vendas continuam no relatório.')) return;
  try{ await fidAdm('salvar', {cliente:{id:FA.ficha.id, ativo:false}}); fecharModal(); toast('Cliente tirada do cadastro'); fidAdmCarregar(true); }catch(e){ toast(e.message, true); }
}
function fidAdmNova(){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal"><div class="modal-t"><h3 class="cresce">Nova cliente</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div><div class="modal-c">
    <div class="campo"><label>Nome</label><input class="inp" id="fn-nome"></div><div class="campo"><label>WhatsApp</label><input class="inp" id="fn-tel" inputmode="tel"></div>
    <div class="campo"><label>Aniversário (opcional)</label><input class="inp" id="fn-nasc" placeholder="dd/mm/aaaa"></div>
    <div class="campo"><label>Selos de antes do sistema</label><input class="inp num" id="fn-ini" inputmode="numeric" value="0"></div>
    <div class="campo"><label>Quem indicou (opcional)</label><select class="inp" id="fn-ind"><option value="">— ninguém —</option>${(FA.L||[]).slice().sort((a,b)=>a.nome.localeCompare(b.nome)).slice(0,3000).map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join('')}</select></div>
    <button class="btn pri largo" onclick="fidAdmNovaSalvar()"><i class="ti ti-check"></i> Cadastrar</button></div></div></div>`;
}
async function fidAdmNovaSalvar(){
  const v = id => $('#'+id)?.value;
  try{ const r = await fidAdm('cadastrar', {cliente:{nome:v('fn-nome'), tel:v('fn-tel'), nascimento:v('fn-nasc'), selos_iniciais:v('fn-ini'), indicado_por:v('fn-ind')}}); toast('Cadastrada ✔'); await fidAdmCarregar(true); FA.ficha = r.cartao; fidAdmFichaPintar(); }catch(e){ toast(e.message, true); }
}

/* presentes */
function fidAdmPresentes(){
  const L = fidD().presentes || [], prods = (S.adm.dados.pdv?.produtos||[]).filter(p=>p.ativo!==false);
  const E = FA.gEd;
  return `<div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">${E?.id?'✏️ Editar presente':'➕ Novo presente'}</h3><p class="apagado" style="margin:0 0 10px;font-size:13px">O que a equipe pode dar na 5ª e na 10ª compra. Ligando a um produto do catálogo, o presente sai do estoque da loja sozinho.</p>
      <div class="fid-g2"><div class="campo"><label>Nome do presente</label><input class="inp" id="fg-nome" value="${esc(E?.nome||'')}" placeholder="Ex.: Mini gel beijável"></div>
      <div class="campo"><label>Produto do catálogo (opcional)</label><input class="inp" id="fg-prod" list="fg-lista" value="${esc(E?.produto||'')}" placeholder="Buscar produto…"><datalist id="fg-lista">${prods.slice(0,2500).map(p=>`<option value="${esc(p.nome)}">`).join('')}</datalist></div>
      <div class="campo"><label>Vale para</label><select class="inp" id="fg-para">${[['ambos','5ª e 10ª compra'],['5','Só 5ª compra'],['10','Só 10ª compra']].map(([v,n])=>`<option value="${v}" ${(E?.para||'ambos')===v?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="campo"><label>Observação</label><input class="inp" id="fg-obs" value="${esc(E?.obs||'')}" placeholder="Ex.: só enquanto tiver"></div></div>
      <div class="linha" style="gap:8px"><button class="btn pri" onclick="fidAdmPresSalvar()"><i class="ti ti-check"></i> ${E?.id?'Salvar':'Adicionar'}</button>${E?`<button class="btn" onclick="FA.gEd=null;render()">Cancelar</button>`:''}</div></div>
    ${L.length?`<div class="fid-tl">${L.map((g,i)=>`<div style="animation-delay:${i*40}ms;${g.ativo?'':'opacity:.5'}"><span style="font-size:22px">🎁</span><span class="c"><b>${esc(g.nome)}</b><br><small>${g.para==='ambos'?'5ª e 10ª compra':'Só '+g.para+'ª compra'}${g.produto?' · sai do estoque: '+esc(g.produto):''}${g.obs?' · '+esc(g.obs):''}</small></span>
      <button class="btn p fantasma" onclick='FA.gEd=${JSON.stringify(g).replace(/'/g,"&#39;")};render()'><i class="ti ti-pencil"></i></button><button class="btn p fantasma" onclick="fidAdmPresAtivo('${g.id}',${!g.ativo})">${g.ativo?'Pausar':'Ativar'}</button></div>`).join('')}</div>`
      :'<div class="cartao pad"><p class="suave" style="margin:0">Nenhum presente cadastrado. Enquanto isso, a equipe escreve o presente na hora (opção "Outro").</p></div>'}`;
}
async function fidAdmPresSalvar(){
  const nome = $('#fg-nome').value.trim(), pn = $('#fg-prod').value.trim();
  const prod = pn ? (S.adm.dados.pdv?.produtos||[]).find(p=>p.nome===pn) : null;
  if(pn && !prod) return toast('Escolha o produto da lista (ou deixe vazio)', true);
  try{ const r = await fidAdm('presente', {presente:{id:FA.gEd?.id||'', nome:nome||prod?.nome||'', produto_id:prod?.id||'', para:$('#fg-para').value, obs:$('#fg-obs').value, ativo:FA.gEd ? FA.gEd.ativo!==false : true}});
    S.adm.dados.fidelidade.presentes = r.presentes; FA.gEd = null; render(); toast('Presente salvo 🎁'); }catch(e){ toast(e.message, true); }
}
async function fidAdmPresAtivo(id, ativo){
  const g = fidD().presentes.find(x=>x.id===id); if(!g) return;
  try{ const r = await fidAdm('presente', {presente:{...g, ativo}}); S.adm.dados.fidelidade.presentes = r.presentes; render(); }catch(e){ toast(e.message, true); }
}

/* importar */
function fidAdmImportar(){
  const I = FA.imp;
  return `<div class="cartao pad"><h3 style="margin:0 0 4px;font-size:16px">📥 Importar o cadastro de clientes</h3>
    <p class="apagado" style="margin:0 0 10px;font-size:13.5px">Exporte do sistema antigo em <b>CSV</b> (no Excel: Salvar como › CSV). O portal acha sozinho as colunas de nome, telefone/celular/WhatsApp, aniversário e e-mail. Quem já existe (mesmo WhatsApp) é atualizado, não duplica.</p>
    <div class="campo"><label>Arquivo CSV</label><input class="inp" type="file" accept=".csv,.txt,text/csv" style="padding-top:10px" onchange="fidAdmArquivo(this)"></div>
    ${I?`<div class="nota ${I.lista.length?'info':'warn'}"><i class="ti ti-table"></i><div><b>${I.lista.length} clientes lidas</b> · colunas: nome = <b>${esc(I.cols.nome||'—')}</b>, WhatsApp = <b>${esc(I.cols.tel||'—')}</b>, aniversário = <b>${esc(I.cols.nasc||'—')}</b>, e-mail = <b>${esc(I.cols.email||'—')}</b>${I.cols.compras?`, compras anteriores = <b>${esc(I.cols.compras)}</b>`:''}
      <br>${I.lista.slice(0,4).map(c=>esc(c.nome)+' · '+esc(fmtTel(c.tel))).join('<br>')}</div></div>
      ${I.cols.compras?`<label class="linha" style="gap:8px;margin:8px 0;font-size:14px"><input type="checkbox" ${I.usarCompras?'checked':''} onchange="FA.imp.usarCompras=this.checked"> Contar as compras anteriores como selos já ganhos (em cada cartão de ${fidCfg().ciclo})</label>`:''}
      <button class="btn pri" ${I.env||!I.lista.length?'disabled':''} onclick="fidAdmImportarEnviar()">${I.env?`<i class="ti ti-loader-2"></i> Importando ${I.feito}/${I.lista.length}…`:'<i class="ti ti-upload"></i> Importar '+I.lista.length+' clientes'}</button>`:''}</div>`;
}
async function fidAdmArquivo(inp){
  const f = inp.files[0]; if(!f) return;
  const buf = await f.arrayBuffer(); let txt; try{ txt = new TextDecoder('utf-8', {fatal:true}).decode(buf); }catch(e){ txt = new TextDecoder('windows-1252').decode(buf); }
  const rows = lerCSV(txt); if(rows.length < 2){ toast('Arquivo sem linhas', true); return; }
  const cab = rows[0].map(h=>semAcento(h).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim());
  const acha = (...ns) => { for(const n of ns){ const i = cab.indexOf(n); if(i>=0) return i; } for(const n of ns){ const i = cab.findIndex(h=>h.includes(n)); if(i>=0) return i; } return -1; };
  const iN = acha('nome','nome completo','cliente','razao social','name'), iT = acha('whatsapp','celular','telefone celular','telefone','fone','tel','contato'), iD = acha('nascimento','data de nascimento','aniversario','data nasc','dt nasc');
  const iE = acha('email','e mail'), iC = acha('qtd compras','quantidade de compras','compras','num compras','n compras');
  const lista = rows.slice(1).map(r=>({nome:(r[iN]||'').trim(), tel:iT>=0?String(r[iT]||'').replace(/\D/g,''):'', nascimento:iD>=0?(r[iD]||'').trim():'', email:iE>=0?(r[iE]||'').trim():'', compras:iC>=0?Number(String(r[iC]||'').replace(/\D/g,''))||0:0})).filter(c=>c.nome||c.tel);
  if(iN<0) toast('Não achei a coluna de nome — confira o cabeçalho do arquivo', true);
  FA.imp = {lista, cols:{nome:rows[0][iN], tel:rows[0][iT], nasc:rows[0][iD], email:rows[0][iE], compras:iC>=0?rows[0][iC]:''}, usarCompras:false, env:false, feito:0};
  render();
}
async function fidAdmImportarEnviar(){
  const I = FA.imp, ci = fidCfg().ciclo; I.env = true; I.feito = 0; render();
  const tot = {novos:0, atualizados:0, ignorados:0};
  try{
    for(let i=0;i<I.lista.length;i+=1500){
      const parte = I.lista.slice(i,i+1500).map(c=>({nome:c.nome, tel:c.tel, nascimento:c.nascimento, email:c.email, selos_iniciais: I.usarCompras && c.compras ? c.compras % ci : ''}));
      const r = await fidAdm('importar', {lista:parte}); for(const k in tot) tot[k] += r.importados[k]||0;
      I.feito = Math.min(I.lista.length, i+1500); render();
    }
    FA.imp = null; toast(`✔ ${tot.novos} novas · ${tot.atualizados} atualizadas${tot.ignorados?' · '+tot.ignorados+' sem nome/telefone':''}`); FA.sub = 'lista'; fidAdmCarregar(true);
  }catch(e){ I.env = false; render(); toast(e.message, true); }
}

/* regras */
function fidAdmRegras(){
  const c = fidCfg(), f = (k,n,s,u) => `<div class="campo"><label>${n}</label><div class="linha" style="gap:6px"><input class="inp num" id="fr-${k}" inputmode="decimal" value="${c[k]}" style="max-width:120px"><span class="apagado">${u}</span></div><small class="apagado">${s}</small></div>`;
  return `<div class="cartao pad"><h3 style="margin:0 0 10px;font-size:16px">⚙️ Regras do cartão fidelidade</h3><div class="fid-g2">
    ${f('minimo','Valor mínimo para ganhar selo','Compras abaixo disso ganham só cashback.','R$')}
    ${f('cashback_pct','Cashback','Do valor pago, em toda compra com cliente.','%')}
    ${f('cashback_dias','Validade do cashback','Depois disso o saldo vence.','dias')}
    ${f('ciclo','Selos no cartão','No último selo: desconto + presente e o cartão recomeça.','selos')}
    ${f('presente_em','Selo do presente','Presente no meio do cartão.','º selo')}
    ${f('desconto10','Desconto no fim do cartão','Não soma com desconto manual.','%')}</div>
    <div class="nota info" style="margin:6px 0 12px"><i class="ti ti-users"></i><div><b>Indicação:</b> a cliente nova é cadastrada com "Quem indicou?". Quando ela <b>finaliza a 1ª compra</b> que vale selo, quem indicou ganha 1 selo — igual a uma compra.</div></div>
    <button class="btn pri" onclick="fidAdmRegrasSalvar()"><i class="ti ti-device-floppy"></i> Salvar regras</button></div>`;
}
async function fidAdmRegrasSalvar(){
  const v = {}; ['minimo','cashback_pct','cashback_dias','ciclo','presente_em','desconto10'].forEach(k=>v[k] = $('#fr-'+k).value);
  try{ const r = await fidAdm('cfg', {valor:v}); S.adm.dados.fidelidade.cfg = r.cfg; render(); toast('Regras salvas ✔'); fidAdmCarregar(true); }catch(e){ toast(e.message, true); }
}

/* ───────── encaixe na Administração (mesmo jeito do app16) ───────── */
const _telaAdminV22 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, aqui = A.tab === 'clientes';
  if(typeof GRUPOS_ADM !== 'undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('clientes')) g.k.splice(g.k.indexOf('pdv')+1, 0, 'clientes'); if(typeof NOMES12 !== 'undefined') NOMES12.admin.clientes = 'Clientes e fidelidade'; }
  if(aqui) A.tab = 'regras';
  let h = _telaAdminV22();
  if(aqui){
    A.tab = 'clientes';
    const base = admRegras(), i = h.lastIndexOf(base);
    if(i >= 0) h = h.slice(0, i) + admClientes() + h.slice(i + base.length);
    h = h.replace(`class="aba on" onclick="S.adm.tab='regras'`, `class="aba " onclick="S.adm.tab='regras'`);
  }
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='clientes';TR=null;render()"><i class="ti ti-heart-handshake"></i> Clientes </button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV22 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV22();
  if(S.adm && S.tela==='admin') r.unshift({t:'Clientes e fidelidade', s:'Cartão fidelidade, cashback, presentes, indicações e importação', i:'ti-heart-handshake', go:()=>{ S.adm.tab='clientes'; render(); }});
  return r;
};
