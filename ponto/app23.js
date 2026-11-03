/* ═══════════ Portal Equipe Las Vegas · v23 — CUPOM DA ROLETA DA LOJA ═══════════
   Na comanda: botão "Cupom da roleta" → digita o código (LV….) → o servidor confere
   (aberto, no prazo, compra mínima, 1 por cliente a cada X dias) → o desconto entra na conta
   e, ao finalizar, o cupom fica ligado à cliente do cartão fidelidade e à venda.
   Administração › Roleta: cupons (gerados, usados, vencidos), prêmios e chances, regras.
   Servidor: ROLETA_TOTEM.gs (aba CuponsRoleta, Config › roleta_totem). Totem: games.lasvegassexshop.com.br/roleta */
(function(){
  const css = `
.rt-btn{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px dashed var(--vermelho);border-radius:14px;padding:10px 12px;margin-bottom:10px;font:inherit;text-align:left;cursor:pointer;color:var(--creme);transition:transform .15s var(--mola)}
.rt-btn:hover{transform:translateY(-1px)}.rt-btn:active{transform:scale(.98)}
.rt-btn .ic{font-size:22px}.rt-btn b{display:block;font-size:14px}.rt-btn small{display:block;color:var(--creme2);font-size:12px}
.rt-card{position:relative;border-radius:16px;padding:11px 13px;margin-bottom:10px;background:linear-gradient(120deg,#FFF4D6,#fff);border:1.5px solid #E9B949;animation:rtSobe .3s var(--mola)}
.rt-card.ruim{background:linear-gradient(120deg,#FFE8E5,#fff);border-color:#E3101F}
.rt-card .top{display:flex;gap:8px;align-items:center}
.rt-card .top b{font-size:15px}.rt-card .cod{font-family:ui-monospace,monospace;font-weight:800;letter-spacing:.12em;font-size:12.5px;background:#1C1416;color:#FFD98A;border-radius:6px;padding:2px 7px}
.rt-card .x{margin-left:auto;border:0;background:none;cursor:pointer;color:var(--creme2);font-size:18px}
.rt-card p{margin:5px 0 0;font-size:12.8px;color:var(--creme2);line-height:1.4}
.rt-card .ok{color:#127a43;font-weight:700}.rt-card .no{color:#c0101c;font-weight:700}
.rt-linha b{color:#127a43}
.rt-modal .inp.cod{font-family:ui-monospace,monospace;font-size:26px;letter-spacing:.2em;text-transform:uppercase;text-align:center;font-weight:800}
.rt-res{margin-top:12px;border-radius:14px;padding:14px;background:var(--veludo2);animation:rtSobe .3s var(--mola)}
.rt-res h4{margin:0 0 4px;font-size:20px}.rt-res .sub{color:var(--creme2);font-size:13.5px}
.rt-res.ruim{background:#FFE8E5}
.rt-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0 14px}
.rt-kpi{background:#fff;border:1px solid var(--linha2);border-radius:14px;padding:12px}
.rt-kpi b{display:block;font-size:24px;letter-spacing:-.02em}.rt-kpi small{color:var(--creme2);font-size:12.5px}
.rt-st{display:inline-block;border-radius:99px;padding:2px 9px;font-size:12px;font-weight:700}
.rt-st.aberto{background:#E7F7EE;color:#127a43}.rt-st.usado{background:#E8EEFF;color:#2747b8}.rt-st.vencido{background:#F1EEEE;color:#7c6f6f}.rt-st.cancelado{background:#FFE8E5;color:#c0101c}
.rt-prem{display:grid;grid-template-columns:minmax(120px,1.4fr) 132px 76px 76px 76px 70px 34px;gap:6px;align-items:center;margin-bottom:6px}
.rt-prem input,.rt-prem select{width:100%;min-width:0;font:inherit;font-size:13.5px;padding:7px 8px;border:1px solid var(--linha2);border-radius:9px;background:#fff}
.rt-prem.cab{font-size:11.5px;color:var(--creme2);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.rt-prem .pct{font-size:11px;color:var(--creme2);text-align:right}
.rt-prem .rg{grid-column:1/-1}
.rt-scroll{overflow-x:auto}.rt-scroll>div{min-width:640px}
@keyframes rtSobe{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

const RT = {cup:null, conf:null, aviso:''};
const RT_TOTEM = 'https://games.lasvegassexshop.com.br/roleta';
function rtGuardar(){ if(S.sess?.eid) LS.set('lv_rt_'+S.sess.eid, {cup:RT.cup}); }
function rtRestaurar(){ if(RT._eid === S.sess?.eid) return; RT._eid = S.sess?.eid; const g = S.sess?.eid ? LS.get('lv_rt_'+S.sess.eid) : null; RT.cup = g?.cup || null; }
async function rtApi(op, dados={}){ return api('roletaCupom', {eid:S.sess.eid, ...S.sess.cred, op, ...dados}); }
function rtPremioTxt(c){ return c.tipo==='desconto' ? `${c.valor}% de desconto` : c.tipo==='vale' ? `vale de ${brl2(c.valor)}` : c.tipo==='servico' ? 'serviço (sem desconto no valor)' : 'brinde (entregar o produto)'; }

/* o que o cupom faz nesta comanda (prévia — o servidor confere de novo) */
function rtPrevia(k){
  const c = RT.cup; if(!c) return null;
  const prob = [];
  if(!FID.cli) prob.push('Coloque a cliente do cartão fidelidade na comanda');
  if(c.minimo > 0 && k.sub < c.minimo - .001) prob.push(`Compra mínima de ${brl2(c.minimo)} (faltam ${brl2(c.minimo - k.sub)})`);
  if(k.fid?.tem20) prob.push(`Não soma com os ${fidCfg().desconto10}% do cartão — escolha um dos dois`);
  if(c.tipo==='vale' && c.acumula===false && k.desc > .009) prob.push('Esse vale não soma com o desconto manual');
  let desc = 0;
  if(!prob.length && k.sub){ desc = c.tipo==='desconto' ? r2(k.sub * c.valor / 100) : c.tipo==='vale' ? r2(Math.min(c.valor, Math.max(0, k.sub - k.desc))) : 0; }
  return {prob, desc};
}

/* ═════════ contas: o desconto do cupom entra no total ═════════ */
const _pdvContasV23 = pdvContas;
pdvContas = function pdvContas(){
  const k = _pdvContasV23();
  k.rtDesc = 0; k.rt = null;
  if(!RT.cup) return k;
  k.rt = rtPrevia(k);
  if(k.rt.desc){
    k.rtDesc = k.rt.desc;
    if(k.fidCash){ const saldo = FID.cli?.cashback?.saldo || 0; k.fidCash = r2(Math.min(saldo, Math.max(0, k.sub - k.desc - k.fidDesc - k.rtDesc))); }
    k.total = r2(k.sub - k.desc - (k.fidDesc||0) - k.rtDesc - (k.fidCash||0));
  }
  return k;
};

/* ═════════ comanda: bloco do cupom logo abaixo da cliente ═════════ */
const _pdvPintarComandaV23 = pdvPintarComanda;
pdvPintarComanda = function pdvPintarComanda(bater){
  rtRestaurar();
  _pdvPintarComandaV23(bater);
  const el = $('#pdv-comanda'); if(!el) return;
  const k = pdvContas(), ref = el.querySelector('#fid-box') || el.querySelector('.pdv-cli') || el.querySelector('.pdv-extra.g2');
  if(ref){ const box = document.createElement('div'); box.id = 'rt-box'; box.innerHTML = rtBloco(k); ref.parentNode.insertBefore(box, ref.nextSibling); }
  const tot = el.querySelector('.pdv-total');
  if(tot && k.rtDesc) tot.insertAdjacentHTML('beforebegin', `<div class="pdv-linha rt-linha"><span>🎰 Roleta · ${esc(RT.cup.premio)}</span><b>− ${brl2(k.rtDesc)}</b></div>`);
  const fim = $('#pdv-fim');
  if(fim && RT.cup && k.rt?.prob.length && PDV.car.length && PDV.pag && !PDV.env){ fim.disabled = false; fim.innerHTML = '🎰 Resolver o cupom da roleta'; }
};
function rtBloco(k){
  const c = RT.cup;
  if(!c) return `<button class="rt-btn" onclick="rtAbrir()"><span class="ic">🎰</span><span><b>Cupom da roleta</b><small>A cliente ganhou no totem? Digite o código LV…</small></span><i class="ti ti-chevron-right" style="margin-left:auto"></i></button>`;
  const p = k.rt || rtPrevia(k), ruim = p.prob.length;
  return `<div class="rt-card ${ruim?'ruim':''}">
    <div class="top"><span style="font-size:20px">🎰</span><b>${esc(c.premio)}</b><span class="cod">${esc(c.codigo)}</span><button class="x" title="Tirar o cupom" onclick="rtTirar()"><i class="ti ti-x"></i></button></div>
    <p>${esc(c.regra||rtPremioTxt(c))}${c.nome?` · ganhou: <b>${esc(c.nome)}</b>`:''} · vale até ${ddmm(c.validade)}</p>
    ${ruim ? p.prob.map(x=>`<p class="no">⚠️ ${esc(x)}</p>`).join('')
      : k.sub ? `<p class="ok">✔ ${p.desc ? `Desconto de ${brl2(p.desc)} aplicado` : c.tipo==='produto' ? 'Entregue o brinde junto com a compra' : 'Prêmio confirmado nesta compra'} — o cupom é baixado ao finalizar</p>`
      : `<p>Adicione os produtos.</p>`}
  </div>`;
}
function rtTirar(){ RT.cup = null; rtGuardar(); pdvPintarComanda(); }

/* ═════════ digitar e conferir o código ═════════ */
function rtAbrir(){
  RT.conf = null;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal rt-modal">
    <div class="modal-t"><h3 class="cresce">🎰 Cupom da roleta</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="apagado" style="margin:0 0 10px;font-size:13.5px">Peça o código que apareceu no totem ou no WhatsApp da cliente.</p>
      <input class="inp cod" id="rt-cod" maxlength="10" placeholder="LV····" autocomplete="off" autocapitalize="characters" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')" onkeydown="if(event.key==='Enter')rtConferir()">
      <button class="btn ouro largo" id="rt-conf" style="margin-top:10px" onclick="rtConferir()"><i class="ti ti-search"></i> Conferir código</button>
      <div id="rt-res"></div></div></div></div>`;
  setTimeout(()=>$('#rt-cod')?.focus(), 50);
}
async function rtConferir(){
  const cod = ($('#rt-cod')?.value||'').trim(), b = $('#rt-conf'); if(cod.length < 4) return toast('Digite o código', true);
  if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Conferindo…'; }
  try{
    const r = await rtApi('ver', {codigo:cod, cliente_id:FID.cli?.id||''});
    RT.conf = r; const el = $('#rt-res'); if(!el) return;
    if(!r.cupom){ el.innerHTML = `<div class="rt-res ruim"><h4>❌ Não encontrado</h4><div class="sub">${esc(r.erro)}</div></div>`; return; }
    const c = r.cupom;
    el.innerHTML = r.erro
      ? `<div class="rt-res ruim"><h4>❌ ${esc(c.premio)}</h4><div class="sub">${esc(r.erro)}</div></div>`
      : `<div class="rt-res"><h4>🎉 ${esc(c.premio)}</h4><div class="sub">${esc(c.regra||rtPremioTxt(c))}</div>
          <div class="sub" style="margin-top:6px">Código <b>${esc(c.codigo)}</b>${c.nome?` · ganhou: <b>${esc(c.nome)}</b>`:''} · girou ${ddmm(String(c.criado_em).slice(0,10))} no ${esc(c.aparelho||'totem')} · vale até <b>${ddmm(c.validade)}</b></div>
          ${FID.cli?'':`<div class="nota warn" style="margin-top:10px"><i class="ti ti-user-heart"></i><div>Para baixar o cupom, coloque a <b>cliente do cartão fidelidade</b> na comanda.</div></div>`}
          <button class="btn ouro largo" style="margin-top:12px" onclick="rtUsar()"><i class="ti ti-check"></i> Usar nesta comanda</button></div>`;
  }catch(e){ toast(e.message, true); }
  finally{ if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-search"></i> Conferir código'; } }
}
function rtUsar(){
  const c = RT.conf?.cupom; if(!c) return;
  RT.cup = c; rtGuardar(); fecharModal(); pdvPintarComanda(true);
  toast(`🎰 ${c.premio} na comanda`);
  if(!FID.cli) setTimeout(()=>{ try{ fidAbrirBusca(); }catch(e){} }, 350);
}

/* ═════════ finalizar: manda o código junto ═════════ */
const _pdvFinalizarV23 = pdvFinalizar;
pdvFinalizar = async function pdvFinalizar(){
  if(RT.cup && PDV.car.length){ const k = pdvContas(); if(k.rt?.prob.length){ toast('🎰 ' + k.rt.prob[0], true); if(!FID.cli) try{ fidAbrirBusca(); }catch(e){} return; } }
  return _pdvFinalizarV23();
};
const _apiV23 = api;
api = async function api(a, dados={}){
  if(a==='venda' && dados && dados.pdv && !dados.cancelar && RT.cup){
    const cod = RT.cup.codigo, premio = RT.cup.premio;
    const r = await _apiV23(a, {...dados, roleta_codigo:cod});
    RT.cup = null; rtGuardar();
    if(r.roleta) setTimeout(()=>toast(`🎰 Cupom ${cod} (${premio}) baixado e ligado à cliente`), 900);
    return r;
  }
  return _apiV23(a, dados);
};
const _pdvLimparV23 = pdvLimpar;
pdvLimpar = function pdvLimpar(){ const tinha = PDV.car.length; _pdvLimparV23(); if(!PDV.car.length && tinha && RT.cup){ RT.cup = null; rtGuardar(); pdvPintarComanda(); } };

/* ═════════ Administração › Roleta: a roleta da loja ═════════ */
const RTA = {d:null, carregando:false, filtro:'todos', q:'', ed:null, salvando:false};
async function rtAdm(op, dados={}){ return api('admRoletaTotem', {...S.adm.cred, op, ...dados}); }
async function rtAdmCarregar(forcar){
  if(RTA.carregando || (RTA.d && !forcar)) return;
  RTA.carregando = true;
  try{ RTA.d = await rtAdm('lista'); RTA.ed = null; }catch(e){ RTA.erro = e.message; }
  RTA.carregando = false; if(S.adm?.tab==='roleta') render();
}
const _admRoletaV23 = admRoleta;
admRoleta = function admRoleta(){
  let h = '';
  try{ h = _admRoletaV23(); }catch(e){ h = ''; }
  return `<h2 class="secao" style="margin-top:4px">🎰 Roleta da loja <small class="apagado" style="font-weight:400">· totem e celular</small></h2>${rtAdmCorpo()}
    <h2 class="secao" style="margin-top:28px">🌐 Roleta do site</h2>${h}`;
};
function rtAdmCorpo(){
  if(!RTA.d){
    if(!RTA.carregando && !RTA.erro) setTimeout(()=>rtAdmCarregar(), 0);
    if(RTA.erro && /desconhec|admRoletaTotem|not a function|inválid/i.test(RTA.erro)) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem a roleta da loja.</b> No Apps Script, crie o arquivo <b>ROLETA_TOTEM</b> (o último da lista), cole o código e publique uma nova versão.</div></div>`;
    return RTA.erro ? `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div>${esc(RTA.erro)} <button class="btn p" onclick="RTA.erro='';rtAdmCarregar(true)">Tentar de novo</button></div></div>` : `<p class="suave"><i class="ti ti-loader-2"></i> Carregando os cupons…</p>`;
  }
  const R = RTA.d.resumo, C = RTA.d.cfg;
  const kpi = (n,t,cor)=>`<div class="rt-kpi"><b style="${cor?'color:'+cor:''}">${n}</b><small>${t}</small></div>`;
  return `<div class="linha quebra" style="gap:8px"><a class="btn ouro" href="${RT_TOTEM}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Abrir a roleta</a>
      <button class="btn" onclick="rtAdmCarregar(true)"><i class="ti ti-refresh"></i> Atualizar</button></div>
    <div class="rt-kpis">${kpi(R.hoje,'giros hoje')}${kpi(R.gerados,'cupons gerados')}${kpi(R.abertos,'abertos (no prazo)','#127a43')}${kpi(R.usados,'usados no caixa','#2747b8')}${kpi(R.vencidos,'vencidos','#7c6f6f')}${kpi(brl2(R.desconto_usado),'desconto dado')}${kpi(brl2(R.custo_usados),'custo dos prêmios usados')}</div>
    <div class="fid-sub">${[['todos','Todos'],['aberto','Abertos'],['usado','Usados'],['vencido','Vencidos'],['premios','⚙️ Prêmios e regras']].map(([k,n])=>`<button class="${RTA.filtro===k?'on':''}" onclick="RTA.filtro='${k}';render()">${n}</button>`).join('')}</div>
    ${RTA.filtro==='premios' ? rtAdmPremios(C) : rtAdmLista()}`;
}
function rtAdmLista(){
  const q = RTA.q.trim().toUpperCase();
  let L = RTA.d.cupons.filter(c=>RTA.filtro==='todos' || c.status===RTA.filtro);
  if(q) L = L.filter(c=>(c.codigo+' '+c.nome+' '+c.cliente+' '+c.premio).toUpperCase().includes(q));
  const tot = L.length; L = L.slice(0, 200);
  return `<input class="inp" placeholder="Buscar código, nome ou cliente" value="${esc(RTA.q)}" oninput="RTA.q=this.value;clearTimeout(window._rtT);window._rtT=setTimeout(()=>{render();const i=document.querySelector('#rt-busca');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},350)" id="rt-busca" style="margin-bottom:10px">
    ${tot ? `<div class="tabela"><table><thead><tr><th>Girou</th><th>Código</th><th>Prêmio</th><th>Nome</th><th>Situação</th><th>Cliente / venda</th><th></th></tr></thead><tbody>
      ${L.map(c=>`<tr><td>${ddmm(c.data)} <small class="apagado">${esc(String(c.criado_em).slice(11,16))} · ${esc(c.aparelho||'')}</small></td><td><b style="font-family:ui-monospace,monospace;letter-spacing:.08em">${esc(c.codigo)}</b></td><td>${esc(c.premio)}</td><td>${esc(c.nome||'—')}</td>
        <td><span class="rt-st ${c.status}">${{aberto:'Aberto',usado:'Usado',vencido:'Vencido',cancelado:'Cancelado'}[c.status]||c.status}</span>${c.status==='aberto'?` <small class="apagado">até ${ddmm(c.validade)}</small>`:''}</td>
        <td>${c.status==='usado'?`${esc(c.cliente)} · #${esc(c.venda_numero)} ${esc(S.adm.dados?.lojas?.[c.loja]?.nome||c.loja||'')} · ${esc(primeiroNome(c.colaboradora||''))}${c.desconto?` · −${brl2(c.desconto)}`:''} <small class="apagado">${ddmm(String(c.usado_em).slice(0,10))}</small>`:''}</td>
        <td>${c.status==='aberto'?`<button class="btn p fantasma" title="Cancelar cupom" onclick="rtAdmCancelar('${esc(c.codigo)}',this)"><i class="ti ti-ban"></i></button>`:''}</td></tr>`).join('')}</tbody></table></div>
      ${tot>200?`<p class="apagado" style="font-size:12.5px">Mostrando 200 de ${tot}. Use a busca.</p>`:''}`
    : `<p class="suave">Nenhum cupom${RTA.filtro!=='todos'?' nesse filtro':''} ainda.</p>`}`;
}
async function rtAdmCancelar(cod, b){
  if(b.dataset.armado!=='1'){ b.dataset.armado='1'; b.innerHTML='Cancelar?'; setTimeout(()=>{ if(b.isConnected){ b.dataset.armado=''; b.innerHTML='<i class="ti ti-ban"></i>'; } }, 3000); return; }
  try{ RTA.d = await rtAdm('cancelar', {codigo:cod}); render(); toast('Cupom '+cod+' cancelado'); }catch(e){ toast(e.message, true); }
}
function rtAdmPremios(C){
  if(!RTA.ed) RTA.ed = JSON.parse(JSON.stringify({premios:C.premios.map(p=>({...p,_n0:p.nome})), validade_dias:C.validade_dias, bloqueio_dias:C.bloqueio_dias, whatsapp:C.whatsapp, mensagem:C.mensagem}));
  const E = RTA.ed, soma = E.premios.reduce((s,p)=>s+(+p.chance||0),0);
  const medio = soma ? E.premios.reduce((s,p)=>s+(+p.chance||0)/soma*(+p.custo||0),0) : 0;
  const tipos = {desconto:'% de desconto', vale:'Vale em R$', produto:'Brinde', servico:'Serviço'};
  return `<div class="nota info"><i class="ti ti-info-circle"></i><div>Vale para o <b>totem e o celular</b> na hora. A <b>chance</b> é o peso de cada prêmio (somar 100 facilita a conta). <b>Valor</b> = % do desconto ou R$ do vale. <b>Mín.</b> = compra mínima para usar no caixa.</div></div>
    <div class="rt-scroll"><div>
    <div class="rt-prem cab"><span>Prêmio</span><span>Tipo</span><span>Valor</span><span>Mín. R$</span><span>Custo R$</span><span>Chance</span><span></span></div>
    ${E.premios.map((p,i)=>`<div class="rt-prem">
      <input value="${esc(p.nome)}" maxlength="28" oninput="RTA.ed.premios[${i}].nome=this.value">
      <select onchange="RTA.ed.premios[${i}].tipo=this.value;render()">${Object.entries(tipos).map(([k,n])=>`<option value="${k}" ${p.tipo===k?'selected':''}>${n}</option>`).join('')}</select>
      <input type="number" min="0" step="0.5" value="${p.tipo==='desconto'||p.tipo==='vale'?(+p.valor||0):''}" ${p.tipo==='desconto'||p.tipo==='vale'?'':'disabled placeholder="—"'} oninput="RTA.ed.premios[${i}].valor=this.value">
      <input type="number" min="0" step="1" value="${+p.minimo||0}" oninput="RTA.ed.premios[${i}].minimo=this.value">
      <input type="number" min="0" step="0.5" value="${+p.custo||0}" oninput="RTA.ed.premios[${i}].custo=this.value">
      <div><input type="number" min="0" step="1" value="${+p.chance||0}" onchange="RTA.ed.premios[${i}].chance=this.value;render()"><div class="pct">${soma?((+p.chance||0)/soma*100).toFixed(1).replace('.',','):0}%</div></div>
      <button class="btn p fantasma" title="Tirar" onclick="if(RTA.ed.premios.length<=4)return toast('Mínimo de 4 prêmios',true);RTA.ed.premios.splice(${i},1);render()"><i class="ti ti-trash"></i></button>
      <input class="rg" value="${esc(p.regra||'')}" maxlength="160" placeholder="Regra que aparece para a cliente (ex.: em compras a partir de R$ 50)" oninput="RTA.ed.premios[${i}].regra=this.value">
    </div>`).join('')}</div></div>
    <div class="linha quebra" style="gap:8px;margin:8px 0 16px"><button class="btn" onclick="if(RTA.ed.premios.length>=14)return toast('Máximo de 14 prêmios',true);RTA.ed.premios.push({nome:'NOVO PRÊMIO',curto:'NOVO',tipo:'produto',valor:0,minimo:0,custo:0,chance:0,icone:'estrela',regra:'Retire no caixa.'});render()"><i class="ti ti-plus"></i> Adicionar prêmio</button>
      <span class="apagado" style="font-size:13px">Soma das chances: <b>${soma}</b> · custo médio por giro: <b>${brl2(medio)}</b></span></div>
    <div class="fid-g2">
      <div class="campo"><label>Cupom vale quantos dias?</label><input class="inp" type="number" min="1" value="${E.validade_dias}" oninput="RTA.ed.validade_dias=this.value"></div>
      <div class="campo"><label>1 cupom por cliente a cada (dias)</label><input class="inp" type="number" min="0" value="${E.bloqueio_dias}" oninput="RTA.ed.bloqueio_dias=this.value"></div>
      <div class="campo"><label>WhatsApp que recebe a mensagem (55 + DDD)</label><input class="inp" inputmode="numeric" value="${esc(E.whatsapp)}" oninput="RTA.ed.whatsapp=this.value"></div>
      <div class="campo"><label>Mensagem da cliente <small class="apagado">({NOME} {PREMIO} {CODIGO})</small></label><input class="inp" value="${esc(E.mensagem)}" oninput="RTA.ed.mensagem=this.value"></div>
    </div>
    <div class="linha" style="gap:8px"><button class="btn ouro" id="rt-salvar" onclick="rtAdmSalvar()"><i class="ti ti-device-floppy"></i> Salvar prêmios e regras</button><button class="btn p fantasma" onclick="RTA.ed=null;render()">Desfazer mudanças</button></div>`;
}
async function rtAdmSalvar(){
  if(RTA.salvando) return; RTA.salvando = true; const b = $('#rt-salvar'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Salvando…'; }
  const E = RTA.ed, premios = E.premios.map(p=>{ const o = {...p, curto: p.curto && p.nome===p._n0 ? p.curto : rtCurto(p.nome)}; delete o._n0; return o; });
  try{ RTA.d = await rtAdm('cfg', {valor:{...E, premios}}); RTA.ed = null; render(); toast('Roleta atualizada ✔ O totem pega em até 1 minuto'); chuvaConfete?.(); }
  catch(e){ toast(e.message, true); if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-device-floppy"></i> Salvar prêmios e regras'; } }
  RTA.salvando = false;
}
/* texto da fatia: quebra em 2 linhas quando o nome é comprido */
function rtCurto(n){ n = String(n||'').trim().toUpperCase(); if(n.length <= 9) return n; const w = n.split(' '); if(w.length < 2) return n.slice(0,12); let a = '', i = 0; while(i < w.length && (a + ' ' + w[i]).trim().length <= Math.ceil(n.length/2)+1){ a = (a+' '+w[i]).trim(); i++; } if(!a){ a = w[0]; i = 1; } return a + '\n' + w.slice(i).join(' '); }

const _telaAdminV23 = telaAdmin;
telaAdmin = function telaAdmin(){ return _telaAdminV23().replace('<i class="ti ti-confetti"></i> Roleta do site </button>', '<i class="ti ti-confetti"></i> Roletas </button>'); };
const _itensBuscaV23 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV23();
  if(S.adm && S.tela==='admin') r.unshift({t:'Roleta da loja (cupons)', s:'Cupons do totem: usados, abertos, vencidos · prêmios e chances', i:'ti-ticket', go:()=>{ S.adm.tab='roleta'; RTA.d=null; render(); }});
  return r;
};
