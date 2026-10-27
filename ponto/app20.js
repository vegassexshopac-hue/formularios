/* v20 — Operação da loja:
   1) Abertura e fechamento ligados ao ponto (checklist na tela da batida; quem abriu/fechou em Administração › Hoje)
   2) Fechamento de caixa às cegas (Pix/dinheiro/débito/crédito contados × PDV e sangrias) com conferência da administração
   3) Transferência entre lojas: aviso "chegou mercadoria" na entrada e no Início + WhatsApp pronto para avisar a outra loja
   4) Alerta de estoque mínimo: "Alertas de hoje" na Visão geral + tela Compras (lista de compra, mínimo automático, pedido no WhatsApp)
   Servidor: OPERACAO.gs (aba Caixa, Config › caixa). (Era app19.js; renomeado porque o mutirão v19 pegou o nome.) */
(function(){
  const css = `
.op-card{background:var(--veludo,#fff);border:1px solid #eee5e1;border-radius:18px;padding:14px 16px;margin:12px 0;text-align:left;animation:opSobe .4s both}
.op-card h3{margin:0 0 4px;font-size:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.op-card .sub{font-size:12.5px;color:#7b6f6a}
.op-chk{display:grid;gap:6px;margin-top:8px}
.op-chk label{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;background:#f6f3f2;border-radius:12px;padding:8px 10px;cursor:pointer;font-size:14px;animation:opSobe .35s both}
.op-chk label.ok{opacity:.65}.op-chk label.ok b{text-decoration:line-through}
.op-chk input{width:20px;height:20px;accent-color:var(--vermelho)}
.op-chk small{display:block;font-size:11.5px;color:#7b6f6a}
.op-alerta{border-left:5px solid var(--warn);background:var(--warn-bg)}
.op-alerta.bad{border-left-color:var(--bad);background:var(--bad-bg)}.op-alerta.ok{border-left-color:var(--ok);background:var(--ok-bg)}
.op-alertas{display:grid;gap:6px;margin-top:8px}
.op-alertas button{display:flex;gap:10px;align-items:center;text-align:left;background:#fff;border:1px solid #eee5e1;border-radius:12px;padding:9px 12px;cursor:pointer;font:inherit;font-size:13.5px;animation:opSobe .35s both}
.op-alertas button i.ti{font-size:18px}.op-alertas button.bad{border-color:rgba(215,38,61,.35)}.op-alertas button.warn{border-color:rgba(184,110,0,.35)}
.op-alertas button b{display:block}.op-alertas button small{color:#7b6f6a}
.op-kpis{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.op-kpi{background:#f6f3f2;border-radius:12px;padding:6px 10px;font-size:12.5px;color:#6b5f5a}.op-kpi b{font-size:15px;color:#231a17;margin-right:3px}
.op-kpi.pos b{color:var(--ok)}.op-kpi.neg b{color:var(--bad)}
.op-st{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
.op-st.ok{background:var(--ok-bg);color:var(--ok)}.op-st.diferenca{background:var(--bad-bg);color:var(--bad)}.op-st.conferido{background:var(--info-bg);color:var(--info)}.op-st.aberto{background:var(--warn-bg);color:var(--warn)}
.op-formas{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.op-formas .campo label{display:flex;align-items:center;gap:6px}
.op-dif td.pos{color:var(--ok);font-weight:700}.op-dif td.neg{color:var(--bad);font-weight:700}
.op-lista{display:grid;gap:8px}
.op-fech{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #eee5e1;border-radius:14px;padding:10px 12px;cursor:pointer;text-align:left;font:inherit;width:100%;animation:opSobe .35s both}
.op-fech .d{font-size:22px}.op-fech .t{flex:1}.op-fech .t b{display:block}.op-fech .t small{color:#7b6f6a}
.op-fech.ok{border-left:5px solid var(--ok)}.op-fech.diferenca{border-left:5px solid var(--bad)}.op-fech.conferido{border-left:5px solid var(--info)}
.op-passos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 12px}
.op-passo{background:#f6f3f2;border-radius:14px;padding:10px 12px 10px 40px;position:relative;font-size:13px;line-height:1.35}
.op-passo b{display:block;font-size:14px}.op-passo .n{position:absolute;left:10px;top:10px;width:22px;height:22px;border-radius:50%;background:var(--dourado2);color:#2a1c00;font-weight:800;display:grid;place-items:center;font-size:12px}
@media(max-width:760px){.op-passos{grid-template-columns:1fr}.op-formas{grid-template-columns:1fr}}
@keyframes opSobe{from{transform:translateY(8px);opacity:.3}to{transform:none;opacity:1}}
.op-pulsa{animation:opPulsa 1.8s infinite}@keyframes opPulsa{0%,100%{box-shadow:0 0 0 0 rgba(227,16,31,.35)}50%{box-shadow:0 0 0 8px rgba(227,16,31,0)}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ═════════ utilidades ═════════ */
const opFormas = {pix:['Pix','ti-qrcode'], dinheiro:['Dinheiro','ti-cash'], debito:['Débito','ti-credit-card'], credito:['Crédito','ti-credit-card-pay']};
function opD(){ const d = S.adm ? S.adm.dados : S.sess?.dados; return (d && d.operacao && !d.operacao.erro) ? d.operacao : {cfg:{tolerancia:5,fundo:{}}, fechamentos:[], semServidor:!(d&&d.operacao)}; }
function opAdmin(){ return S.tela==='admin' && !!S.adm; }
function opDados(){ return opAdmin() ? S.adm.dados : S.sess?.dados; }
function opLojaNome(k){ return S.boot?.lojas?.[k]?.nome || k; }
function opHoraMin(h){ const [a,b] = String(h||'00:00').split(':').map(Number); return (a||0)*60+(b||0); }
function opNum(v){ return Number(String(v==null?'':v).replace(/\./g,'').replace(',','.')) || 0; }
function opCopiar(t, ok){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast(ok||'Copiado ✔')).catch(()=>window.open('https://wa.me/?text='+encodeURIComponent(t))); }
function opZap(t){ window.open('https://wa.me/?text='+encodeURIComponent(t)); }

/* ═════════ 1) ABERTURA E FECHAMENTO LIGADOS AO PONTO ═════════ */
function opChkEstado(d, loja, turno){
  const hoje = hojeISO(), itens = (typeof itensChecklist==='function' ? itensChecklist(d.checklist?.itens||[], loja, hoje) : []).filter(i=>i.turno===turno);
  const feitos = (d.checklist?.feitos||[]).filter(f=>f.loja===loja);
  const ok = itens.filter(i=>feitos.some(f=>f.item_id===i.id));
  const primeiro = ok.map(i=>feitos.find(f=>f.item_id===i.id)).sort((a,b)=>String(a.hora).localeCompare(String(b.hora)))[0];
  const ultimo = ok.map(i=>feitos.find(f=>f.item_id===i.id)).sort((a,b)=>String(b.hora).localeCompare(String(a.hora)))[0];
  return {itens, feitos, ok:ok.length, total:itens.length, completo: itens.length>0 && ok.length===itens.length, primeiro, ultimo};
}
function opChkBloco(turno, loja){
  const d = S.sess?.dados; if(!d) return '';
  const e = opChkEstado(d, loja, turno);
  if(!e.total) return '';
  const tit = turno==='abertura' ? '🌅 Abertura da loja' : '🌙 Fechamento da loja';
  if(e.completo) return `<div class="op-card"><h3>${tit} <span class="op-st ok"><i class="ti ti-check"></i> feito</span></h3><div class="sub">${turno==='abertura'?'Aberta':'Fechada'} por ${esc(primeiroNome(e.ultimo?.colaboradora||''))} às ${esc(e.ultimo?.hora||'')}</div></div>`;
  const linha = i => { const f = e.feitos.find(x=>x.item_id===i.id); return `<label class="${f?'ok':''}"><input type="checkbox" ${f?'checked':''} ${f&&f.colaboradora_id!==S.sess.eid?'disabled':''} onchange="opChecar('${i.id}','${loja}',this.checked)"><div><b>${esc(i.texto)}</b>${f?`<small>✔ ${esc(primeiroNome(f.colaboradora))} às ${esc(f.hora)}</small>`:''}</div></label>`; };
  return `<div class="op-card ${turno==='abertura'?'op-pulsa':''}"><h3>${tit} <span class="op-st aberto">${e.ok}/${e.total}</span></h3>
    <div class="sub">${turno==='abertura'?'Marque o que já fez antes de atender a primeira cliente.':'Marque tudo antes de ir embora — fica registrado quem fechou.'}</div>
    <div class="op-chk">${e.itens.map(linha).join('')}</div></div>`;
}
async function opChecar(item, loja, feito){
  try{ clearTimeout(timerVolta); timerVolta = setTimeout(sair, 180000); }catch(e){}
  return checar(item, loja, feito);
}
function opChegandoCard(loja){
  if(typeof estContadores!=='function' || !S.sess?.dados?.estoque) return '';
  const L = estLocais(), em = (estD().transferencias||[]).filter(t=>t.status==='em_transito' && (L.find(l=>l.id===t.para)||{}).loja===loja);
  if(!em.length) return '';
  return `<div class="op-card op-alerta"><h3>📦 Chegou mercadoria para conferir</h3><div class="sub">${em.length===1?'1 transferência':em.length+' transferências'} de ${em.map(t=>esc(estLojaNome(t.de))).filter((v,i,a)=>a.indexOf(v)===i).join(', ')} esperando a loja ${esc(opLojaNome(loja))} conferir (${estFmt(em.reduce((s,t)=>s+Number(t.qtd_total||0),0))} peças).</div>
    <button class="btn p" style="margin-top:8px" onclick="S.tela='portal';S.portalTab='estoque';S.estAba='transferir';render()"><i class="ti ti-truck"></i> Conferir agora</button></div>`;
}
const _telaSucessoV20 = telaSucesso;
telaSucesso = function telaSucesso(){
  let h = _telaSucessoV20();
  const u = S.ultimo, d = S.sess?.dados; if(!d || !u) return h;
  const loja = S.aparelho?.loja || (typeof lojaAtual==='function' ? lojaAtual() : d.colaboradora.loja);
  let extra = '';
  if(u.campo==='entrada'){
    extra = opChkBloco('abertura', loja) + opChegandoCard(loja);
    const e = opChkEstado(d, loja, 'abertura');
    if(extra && (!e.completo || opChegandoCard(loja))) setTimeout(()=>{ clearTimeout(timerVolta); timerVolta = setTimeout(sair, 120000); }, 0);   // dá tempo de marcar (a tela normal some em 7 s)
  }
  if(u.campo==='saida'){
    const fx = (opD().fechamentos||[]).find(f=>f.data===hojeISO() && f.loja===loja);
    extra = opChkBloco('fechamento', loja) + `<div class="op-card"><h3>🧾 Fechamento de caixa ${fx?`<span class="op-st ${fx.status}">${fx.status==='ok'?'fechado ✔':fx.status==='diferenca'?'com diferença':'conferido'}</span>`:'<span class="op-st aberto">ainda não fechado</span>'}</h3>
      <div class="sub">${fx?`Fechado por ${esc(primeiroNome(fx.por))} às ${esc(String(fx.criado_em).slice(11,16))}.`:'Conte o dinheiro e os comprovantes da maquininha e feche o caixa da loja '+esc(opLojaNome(loja))+'.'}</div>
      <button class="btn ${fx?'':'ouro'}" style="margin-top:8px" onclick="opFecharCaixa('${loja}')"><i class="ti ti-cash-register"></i> ${fx?'Refazer o fechamento':'Fechar o caixa'}</button></div>`;
  }
  if(!extra) return h;
  const marca = '<div class="linha" style="justify-content:center;margin-top:20px;gap:8px">';
  const i = h.lastIndexOf(marca);
  return i<0 ? h.replace('</div></div>', extra+'</div></div>') : h.slice(0,i) + extra + h.slice(i);
};
/* Administração › Hoje: quem abriu e fechou cada loja */
const _admHojeV20 = admHoje;
admHoje = function admHoje(){
  const d = S.adm.dados, hoje = d.hoje, agora = opHoraMin(d.hora || S.boot.hora);
  const blocos = Object.entries(d.lojas).map(([k,l])=>{
    const ab = opChkEstado(d, k, 'abertura'), fe = opChkEstado(d, k, 'fechamento'), cx = (opD().fechamentos||[]).find(f=>f.data===hoje && f.loja===k);
    const atrasada = !ab.completo && agora > opHoraMin(l.abre)+30;
    const chip = (ico, t, cls) => `<span class="op-kpi ${cls||''}">${ico} ${t}</span>`;
    return `<div class="op-card" style="margin:6px 0"><h3>Loja ${esc(l.nome)}</h3><div class="op-kpis" style="margin:4px 0 0">
      ${!ab.total?chip('🌅','sem itens de abertura cadastrados'):ab.completo?chip('🌅',`aberta por <b style="font-size:13px">${esc(primeiroNome(ab.ultimo.colaboradora))}</b> às ${esc(ab.ultimo.hora)}`,'pos'):chip('🌅',`abertura ${ab.ok}/${ab.total}${atrasada?' — <b style="font-size:13px;color:var(--bad)">atrasada</b>':''}`, atrasada?'neg':'')}
      ${!fe.total?chip('🌙','sem itens de fechamento'):fe.completo?chip('🌙',`fechada por <b style="font-size:13px">${esc(primeiroNome(fe.ultimo.colaboradora))}</b> às ${esc(fe.ultimo.hora)}`,'pos'):chip('🌙',`fechamento ${fe.ok}/${fe.total}`)}
      ${cx?chip('🧾',`caixa ${cx.status==='ok'?'fechado ✔':cx.status==='conferido'?'conferido ✔':'<b style="font-size:13px;color:var(--bad)">com diferença</b>'} por ${esc(primeiroNome(cx.por))}`, cx.status==='diferenca'?'neg':'pos'):chip('🧾','caixa ainda não fechado')}
    </div></div>`;
  }).join('');
  return `<h2 class="secao">Abertura, fechamento e caixa</h2>${blocos}` + _admHojeV20();
};

/* ═════════ 2) FECHAMENTO DE CAIXA ═════════ */
let CX = null;
function opFecharCaixa(loja, data){
  const cfg = opD().cfg || {fundo:{}};
  loja = loja || (opAdmin() ? Object.keys(S.boot.lojas)[0] : lojaAtual());
  CX = {loja, data: data || hojeISO(), fundo: cfg.fundo?.[loja] != null ? String(cfg.fundo[loja]).replace('.',',') : '', contado:{pix:'',dinheiro:'',debito:'',credito:''}, obs:'', ocupado:false};
  opCaixaModal();
}
function opCaixaModal(){
  const c = CX, adm = opAdmin();
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">🧾 Fechar o caixa</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="op-passos"><div class="op-passo"><span class="n">1</span><b>Conte o dinheiro</b>Tudo que está na gaveta, inclusive o fundo de troco.</div><div class="op-passo"><span class="n">2</span><b>Some a maquininha</b>Relatório do dia: débito, crédito e Pix separados.</div><div class="op-passo"><span class="n">3</span><b>Digite e feche</b>O portal compara com o PDV e as sangrias e mostra se bateu.</div></div>
      <div class="linha quebra" style="gap:8px;margin-bottom:10px">${Object.entries(S.boot.lojas).map(([k,l])=>`<button class="selo ${c.loja===k?'info':''}" style="cursor:pointer;border:0;font-size:13px;padding:6px 12px" onclick="CX.loja='${k}';opCaixaModal()"><i class="ti ti-building-store"></i> ${esc(l.nome)}</button>`).join('')}
        ${adm?`<input class="inp" type="date" style="width:auto" value="${esc(c.data)}" max="${hojeISO()}" onchange="CX.data=this.value">`:`<span class="suave" style="align-self:center">${esc(dataLonga(c.data))}</span>`}</div>
      <div class="campo"><label><i class="ti ti-coin"></i> Fundo de troco que ficou na gaveta (R$)</label><input class="inp num" inputmode="decimal" placeholder="Ex.: 100,00" value="${esc(c.fundo)}" oninput="CX.fundo=this.value"></div>
      <div class="op-formas">${Object.entries(opFormas).map(([k,[n,i]])=>`<div class="campo"><label><i class="ti ${i}"></i> ${n} contado (R$)</label><input class="inp num" inputmode="decimal" placeholder="0,00" value="${esc(c.contado[k])}" oninput="CX.contado.${k}=this.value"></div>`).join('')}</div>
      <div class="campo"><label>Observação (opcional)</label><input class="inp" placeholder="Ex.: troco emprestado da outra loja" value="${esc(c.obs)}" oninput="CX.obs=this.value"></div>
      <div class="nota info" style="margin:6px 0 12px"><i class="ti ti-eye-off"></i><div>Contagem às cegas: o valor esperado só aparece depois que você fecha. Dinheiro = fundo + vendas em dinheiro − sangrias do dia.</div></div>
      <button class="btn pri largo" id="btn-cx" onclick="opCaixaEnviar()" ${c.ocupado?'disabled':''}><i class="ti ti-lock-check"></i> ${c.ocupado?'Fechando…':'Fechar o caixa'}</button></div></div></div>`;
}
async function opCaixaEnviar(){
  const c = CX; if(!c || c.ocupado) return;
  if(Object.values(c.contado).every(v=>v==='')) return toast('Digite o que foi contado', true);
  c.ocupado = true; opCaixaModal();
  try{
    let d;
    if(opAdmin()){ d = await api('admOperacao', {...S.adm.cred, op:'caixaFechar', loja:c.loja, data:c.data, fundo:c.fundo, contado:c.contado, obs:c.obs}); S.adm.dados = d; }
    else { d = await api('caixa', {eid:S.sess.eid, ...S.sess.cred, op:'fechar', loja:c.loja, fundo:c.fundo, contado:c.contado, obs:c.obs}); S.sess.dados = d; }
    CX = null; opCaixaResultado(d.caixaFeito); render();
  }catch(e){ c.ocupado=false; opCaixaModal(); toast(e.message, true); }
}
function opDifTxt(v){ const n = Number(v)||0; return (n>0?'+':'')+brl2(n).replace('R$ -','-R$ '); }
function opCaixaResultado(f, soVer){
  if(!f) return;
  const adm = opAdmin(), tol = f.tolerancia ?? opD().cfg?.tolerancia ?? 5;
  const maior = Math.max(...Object.values(f.diferenca||{}).map(v=>Math.abs(Number(v)||0)), 0);
  const cab = f.status==='ok' ? ['✅','Caixa bateu!','Diferenças dentro da tolerância de '+brl2(tol)+'.'] : f.status==='conferido' ? ['✔️','Caixa conferido pela administração', f.conferido_por ? 'Por '+f.conferido_por+' em '+String(f.conferido_em).slice(0,16) : ''] : ['⚠️','Deu diferença de '+brl2(maior), 'Confira de novo o dinheiro e o relatório da maquininha. Se continuar, avise a administração.'];
  const linha = k => { const d = Number(f.diferenca?.[k])||0; return `<tr><td>${opFormas[k][0]}</td><td class="n num">${brl2(f.contado?.[k])}</td><td class="n num">${brl2(f.esperado?.[k])}</td><td class="n num ${d>0.001?'pos':d<-0.001?'neg':''}">${Math.abs(d)<0.005?'✔':opDifTxt(d)}</td></tr>`; };
  const v = f.vendas||{};
  const zap = () => [`*🧾 Fechamento de caixa — ${opLojaNome(f.loja)} · ${ddmm(f.data)}*`, `Por: ${f.por}`, '', ...Object.keys(opFormas).map(k=>`${opFormas[k][0]}: contado ${brl2(f.contado?.[k])} · esperado ${brl2(f.esperado?.[k])} · ${Math.abs(Number(f.diferenca?.[k])||0)<0.005?'ok ✔':opDifTxt(f.diferenca?.[k])}`), '', `Vendas PDV: ${f.qtd_vendas} (${brl2(v.total)}) · Sangrias: ${brl2(f.sangrias)} · Fundo: ${brl2(f.fundo)}`, f.obs?`Obs: ${f.obs}`:'', f.status==='ok'?'✅ Caixa bateu':'⚠️ Com diferença'].filter(x=>x!=null).join('\n');
  window._opZapCx = () => opZap(zap());
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${cab[0]} ${esc(cab[1])}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px">${esc(cab[2])}</p>
      <div class="op-kpis"><span class="op-kpi">🏬 <b style="font-size:13px">${esc(opLojaNome(f.loja))}</b> ${ddmm(f.data)}</span><span class="op-kpi">🛒 <b>${f.qtd_vendas}</b>vendas no PDV</span><span class="op-kpi">💸 <b>${brl2(f.sangrias)}</b>sangrias</span><span class="op-kpi">🪙 <b>${brl2(f.fundo)}</b>fundo</span></div>
      ${f.sangriasLidas===false?'<div class="nota warn" style="margin-bottom:8px"><i class="ti ti-alert-triangle"></i><div>Não achei a aba de sangrias na planilha — o dinheiro esperado está sem descontar as sangrias.</div></div>':''}
      <div class="tabela op-dif"><table><thead><tr><th>Forma</th><th>Contado</th><th>Esperado</th><th>Diferença</th></tr></thead><tbody>${Object.keys(opFormas).map(linha).join('')}</tbody></table></div>
      ${v.misto>0?`<div class="nota warn" style="margin-top:8px"><i class="ti ti-arrows-shuffle"></i><div><b>${brl2(v.misto)} em vendas "mistas"</b> não entram no esperado por forma — confira pela observação de cada venda: ${(v.mistos||[]).map(m=>'#'+m.numero+' '+brl2(m.total)+(m.obs?' ('+esc(m.obs)+')':'')).join(' · ')||'—'}</div></div>`:''}
      ${f.obs?`<p class="suave" style="margin-top:8px">Obs.: ${esc(f.obs)}</p>`:''}${f.obs_adm?`<p class="suave">Administração: ${esc(f.obs_adm)}</p>`:''}
      <div class="linha quebra" style="gap:8px;margin-top:12px">
        <button class="btn" onclick="_opZapCx()"><i class="ti ti-brand-whatsapp"></i> Mandar no grupo</button>
        ${adm?(f.status==='conferido'?`<button class="btn" onclick="opCaixaConferir('${f.id}',true)"><i class="ti ti-lock-open"></i> Reabrir</button>`:`<button class="btn pri" onclick="opCaixaConferir('${f.id}')"><i class="ti ti-check"></i> Marcar como conferido</button>`):(f.status!=='conferido'&&!soVer?`<button class="btn" onclick="fecharModal();opFecharCaixa('${f.loja}')"><i class="ti ti-refresh"></i> Contar de novo</button>`:'')}
        <button class="btn ${adm?'':'pri'}" onclick="fecharModal()">Concluir</button></div>
      ${adm?`<div class="campo" style="margin-top:10px"><label>Observação da administração</label><input class="inp" id="cx-obs-adm" value="${esc(f.obs_adm||'')}" placeholder="Ex.: diferença era o troco emprestado"></div>`:''}
    </div></div></div>`;
}
async function opCaixaConferir(id, reabrir){
  try{ const d = await api('admOperacao', {...S.adm.cred, op:'caixaConferir', id, reabrir:!!reabrir, obs_adm:$('#cx-obs-adm')?.value, quem:'Administração'}); S.adm.dados = d; fecharModal(); render(); toast(reabrir?'Caixa reaberto':'Caixa conferido ✔'); }
  catch(e){ toast(e.message, true); }
}
function opFechCard(f, adm){
  const dif = f.diferenca ? Math.max(...Object.values(f.diferenca).map(v=>Math.abs(Number(v)||0)),0) : null;
  const ico = {ok:'✅', diferenca:'⚠️', conferido:'✔️'}[f.status]||'🧾';
  const abre = adm || f.colaboradora_id===S.sess?.eid;
  return `<button class="op-fech ${f.status}" ${abre?`onclick="opVerFech('${f.id}')"`:'style="cursor:default"'}><span class="d">${ico}</span><div class="t"><b>${esc(opLojaNome(f.loja))} · ${ddmm(f.data)} <span class="op-st ${f.status}">${f.status==='ok'?'bateu':f.status==='diferenca'?'diferença':'conferido'}</span></b><small>${esc(primeiroNome(f.por))} às ${esc(String(f.criado_em).slice(11,16))}${dif!=null&&f.status!=='ok'?' · maior diferença '+brl2(dif):''}${f.obs?' · '+esc(f.obs):''}</small></div>${abre?'<i class="ti ti-chevron-right apagado"></i>':''}</button>`;
}
function opVerFech(id){ const f = (opD().fechamentos||[]).find(x=>x.id===id); if(f) opCaixaResultado(f, true); }
const _portalCaixaV20 = portalCaixa;
portalCaixa = function portalCaixa(){
  const hoje = hojeISO(), loja = lojaAtual(), F = opD().fechamentos||[], fx = F.find(f=>f.data===hoje && f.loja===loja), meus = F.filter(f=>f.colaboradora_id===S.sess.eid).slice(0,10);
  return `<div class="op-card ${fx?'':'op-pulsa'}" style="margin-top:0"><h3>🧾 Caixa de hoje — ${esc(opLojaNome(loja))} ${fx?`<span class="op-st ${fx.status}">${fx.status==='ok'?'fechado ✔':fx.status==='diferenca'?'com diferença':'conferido'}</span>`:'<span class="op-st aberto">aberto</span>'}</h3>
      <div class="sub">${fx?`Fechado por ${esc(primeiroNome(fx.por))} às ${esc(String(fx.criado_em).slice(11,16))}.`:'No fim do turno: conte a gaveta e a maquininha e feche o caixa. O portal compara com o PDV e as sangrias.'}</div>
      <div class="linha quebra" style="gap:8px;margin-top:10px"><button class="btn ${fx?'':'ouro'}" onclick="opFecharCaixa('${loja}')"><i class="ti ti-cash-register"></i> ${fx?'Refazer o fechamento':'Fechar o caixa'}</button>${fx&&fx.colaboradora_id===S.sess.eid?`<button class="btn" onclick="opVerFech('${fx.id}')"><i class="ti ti-eye"></i> Ver resultado</button>`:''}</div></div>
    ${opD().semServidor?'<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div>O servidor ainda não tem o OPERACAO.gs — o fechamento de caixa funciona depois de publicar.</div></div>':''}
    ${_portalCaixaV20()}
    ${meus.length?`<h2 class="secao">Meus fechamentos</h2><div class="op-lista">${meus.map(f=>opFechCard(f,false)).join('')}</div>`:''}`;
};
let CXC = null;
const _admCaixaV20 = admCaixa;
admCaixa = function admCaixa(){
  const ym = S.adm.mes, F = (opD().fechamentos||[]).filter(f=>f.data.startsWith(ym)), cfg = opD().cfg||{tolerancia:5,fundo:{}}, hoje = S.adm.dados.hoje;
  const semHoje = Object.keys(S.boot.lojas).filter(k=>!F.some(f=>f.data===hoje&&f.loja===k));
  const n = s => F.filter(f=>f.status===s).length;
  CXC = CXC || {tolerancia:String(cfg.tolerancia).replace('.',','), fundo:Object.fromEntries(Object.keys(S.boot.lojas).map(k=>[k, cfg.fundo?.[k]!=null?String(cfg.fundo[k]).replace('.',','):'']))};
  return `<h2 class="secao" style="margin-top:0">Fechamentos de caixa <small>${ym}</small></h2>
    ${opD().semServidor?'<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem o OPERACAO.gs.</b> Abra o Apps Script, crie o arquivo OPERACAO, cole o código e publique uma nova versão.</div></div>':''}
    <div class="op-kpis"><span class="op-kpi pos"><b>${n('ok')}</b>bateram</span><span class="op-kpi neg"><b>${n('diferenca')}</b>com diferença</span><span class="op-kpi"><b>${n('conferido')}</b>conferidos</span>${semHoje.length?`<span class="op-kpi"><b>${semHoje.length}</b>sem fechar hoje (${semHoje.map(opLojaNome).join(', ')})</span>`:''}</div>
    <div class="linha quebra" style="gap:8px;margin-bottom:10px"><button class="btn ouro" onclick="opFecharCaixa()"><i class="ti ti-cash-register"></i> Fechar um caixa</button><button class="btn" onclick="opCaixaCfgModal()"><i class="ti ti-settings"></i> Fundo de troco e tolerância</button></div>
    <div class="op-lista" style="margin-bottom:16px">${F.map(f=>opFechCard(f,true)).join('')||'<p class="suave">Nenhum fechamento neste mês.</p>'}</div>
    ${_admCaixaV20()}`;
};
function opCaixaCfgModal(){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Fundo de troco e tolerância</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${Object.entries(S.boot.lojas).map(([k,l])=>`<div class="campo"><label>Fundo de troco padrão — ${esc(l.nome)} (R$)</label><input class="inp num" inputmode="decimal" value="${esc(CXC.fundo[k])}" oninput="CXC.fundo.${k}=this.value"></div>`).join('')}
      <div class="campo"><label>Tolerância (R$) — até esse valor o caixa conta como "bateu"</label><input class="inp num" inputmode="decimal" value="${esc(CXC.tolerancia)}" oninput="CXC.tolerancia=this.value"></div>
      <button class="btn pri largo" onclick="opCaixaCfgSalvar()"><i class="ti ti-check"></i> Salvar</button></div></div></div>`;
}
async function opCaixaCfgSalvar(){
  try{ S.adm.dados = await api('admOperacao', {...S.adm.cred, op:'caixaCfg', tolerancia:CXC.tolerancia, fundo:CXC.fundo}); CXC = null; fecharModal(); render(); toast('Salvo ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ═════════ 3) TRANSFERÊNCIA: aviso no Início + WhatsApp ═════════ */
const _portalInicioV20 = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioV20();
  const card = opChegandoCard(lojaAtual());
  return card ? card.replace('class="op-card op-alerta"','class="op-card op-alerta" style="margin-top:0"') + h : h;
};
const _estTransfEnviarV20 = estTransfEnviar;
estTransfEnviar = async function estTransfEnviar(){
  await _estTransfEnviarV20();
  const d = opDados(), t = d && d.transfFeita;
  if(!t || t.status!=='em_transito' || window._opTrfAvisada===t.id) return;
  window._opTrfAvisada = t.id;
  const de = estLojaNome(t.de), para = estLojaNome(t.para), itens = (t.itens||[]).map(i=>`• ${i.qtd}x ${estProd(i.produto_id)?.nome||i.produto||i.produto_id}`);
  const msg = [`*📦 Mercadoria a caminho — ${de} → ${para}*`, `Enviado por ${t.por} em ${String(t.criada_em).slice(0,16)}`, '', ...itens.slice(0,40), itens.length>40?`… e mais ${itens.length-40}`:'', '', `_${estFmt(t.qtd_total)} peças. Quando chegar, confira no portal: Estoque › Transferir › Conferir._`].filter(x=>x!=null&&x!=='').join('\n');
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">🚚 Avisar a loja ${esc(para)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px">A transferência fica <b>em trânsito</b> até a ${esc(para)} conferir. Manda a lista pra elas já saberem o que vai chegar:</p>
      <pre style="white-space:pre-wrap;background:#f6f3f2;border-radius:12px;padding:10px;font:inherit;font-size:13px;max-height:220px;overflow:auto">${esc(msg)}</pre>
      <div class="linha quebra" style="gap:8px;margin-top:10px"><button class="btn pri" onclick="opZap(${JSON.stringify(msg).replace(/"/g,'&quot;')})"><i class="ti ti-brand-whatsapp"></i> Abrir no WhatsApp</button><button class="btn" onclick="opCopiar(${JSON.stringify(msg).replace(/"/g,'&quot;')},'Lista copiada ✔')"><i class="ti ti-copy"></i> Copiar</button><button class="btn" onclick="fecharModal()">Agora não</button></div></div></div></div>`;
};

/* ═════════ 4) ESTOQUE MÍNIMO: lista de compra + alertas ═════════ */
function opVendasPorProduto(dias){
  const desde = new Date(Date.now()-dias*864e5).toISOString().slice(0,10), v = {}, vl = {};
  (pdvD().vendas||[]).filter(x=>x.status!=='cancelada' && x.data>=desde).forEach(x=>(x.itens||[]).forEach(i=>{ if(i.id){ v[i.id]=(v[i.id]||0)+i.qtd; const k=i.id+'|'+x.loja; vl[k]=(vl[k]||0)+i.qtd; } }));
  return {total:v, porLoja:vl};
}
function opCompras(){
  if(typeof estD!=='function' || !pdvD().produtos) return [];
  const sal = {}; (estD().saldos||[]).forEach(s=>{ sal[s.produto_id] = sal[s.produto_id] || {qtd:0, min:0, locais:{}}; sal[s.produto_id].qtd += Number(s.qtd)||0; sal[s.produto_id].min = Math.max(sal[s.produto_id].min, Number(s.minimo)||0); sal[s.produto_id].locais[s.loja] = Number(s.qtd)||0; });
  const V = opVendasPorProduto(30), lista = [];
  pdvD().produtos.forEach(p=>{
    if(p.ativo===false) return;
    const s = sal[p.id] || {qtd:0, min:0, locais:{}}, vend = V.total[p.id]||0;
    const abaixo = s.min>0 && s.qtd<=s.min, zerado = s.qtd<=0 && vend>0;
    if(!abaixo && !zerado) return;
    const sugerir = Math.max(1, Math.ceil(Math.max(s.min*2 - s.qtd, vend - s.qtd, zerado?Math.ceil(vend/2):0)));
    lista.push({p, qtd:s.qtd, min:s.min, vend, sugerir, locais:s.locais, motivo: s.qtd<=0?'zerado':'abaixo do mínimo'});
  });
  lista.sort((a,b)=>(a.qtd>0)-(b.qtd>0) || b.vend-a.vend || a.p.nome.localeCompare(b.p.nome));
  return lista;
}
function opComprasTela(){
  const L = opCompras(), q = semAcento(S.adm.cpQ||''), cat = S.adm.cpCat||'';
  const cats = [...new Set(L.map(x=>x.p.categoria||'Sem categoria'))].sort();
  const vis = L.filter(x=>(!cat || (x.p.categoria||'Sem categoria')===cat) && (!q || semAcento(x.p.nome+' '+(x.p.codigo||'')+' '+(x.p.sku||'')).includes(q)));
  const locais = typeof estLocais==='function' ? estLocais() : [];
  if(!(estD().saldos||[]).length) return `<div class="cartao pad"><p class="suave" style="margin:0">A lista de compra aparece depois do levantamento (contagem) do estoque.</p></div>`;
  return `<div class="op-passos"><div class="op-passo"><span class="n">1</span><b>Mínimo por produto</b>Cada produto tem um mínimo por local. Use "Mínimo automático" para calcular pelas vendas.</div><div class="op-passo"><span class="n">2</span><b>Alerta</b>Entra aqui o que está no mínimo ou abaixo (somando todos os locais) e o que zerou mas vende.</div><div class="op-passo"><span class="n">3</span><b>Pedido</b>A quantidade sugerida cobre 2× o mínimo ou o que vendeu em 30 dias. Copie e mande pro fornecedor.</div></div>
    <div class="op-kpis"><span class="op-kpi neg"><b>${L.filter(x=>x.qtd<=0).length}</b>zerados</span><span class="op-kpi"><b>${L.filter(x=>x.qtd>0).length}</b>abaixo do mínimo</span><span class="op-kpi"><b>${L.reduce((s,x)=>s+x.sugerir,0)}</b>peças sugeridas</span></div>
    <div class="linha quebra" style="gap:8px;margin-bottom:10px">
      <input class="inp" style="flex:1;min-width:160px" placeholder="Buscar produto…" value="${esc(S.adm.cpQ||'')}" oninput="S.adm.cpQ=this.value;clearTimeout(window._cpT);window._cpT=setTimeout(render,250)">
      <select class="inp" style="width:auto" onchange="S.adm.cpCat=this.value;render()"><option value="">Todas as categorias</option>${cats.map(c=>`<option ${cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
      <button class="btn pri" onclick="opComprasCopiar()"><i class="ti ti-brand-whatsapp"></i> Copiar pedido</button><button class="btn" onclick="opComprasCsv()"><i class="ti ti-download"></i> CSV</button><button class="btn" onclick="opMinimoAuto()"><i class="ti ti-wand"></i> Mínimo automático</button></div>
    ${!vis.length?'<div class="cartao pad"><h2 style="margin:0 0 4px;font-size:19px">✅ Nada para comprar</h2><p class="suave" style="margin:0">Nenhum produto no mínimo ou abaixo. Se a lista parece vazia demais, cadastre os mínimos (Mínimo automático).</p></div>':`
    <div class="tabela"><table><thead><tr><th>Produto</th><th>Categoria</th>${locais.map(l=>`<th class="esconde-p">${esc(l.nome)}</th>`).join('')}<th>Total</th><th>Mínimo</th><th>Vendeu 30d</th><th>Comprar</th></tr></thead><tbody>
      ${vis.slice(0,300).map(x=>`<tr class="clica" onclick="typeof admEstAjuste==='function'?admEstAjuste('${x.p.id}'):0"><td>${emojiDe(x.p)} ${esc(x.p.nome)} ${x.qtd<=0?'<span class="selo bad">zerado</span>':''}</td><td class="apagado">${esc(x.p.categoria||'')}</td>${locais.map(l=>`<td class="n num esconde-p">${estFmt(x.locais[l.id]||0)}</td>`).join('')}<td class="n num" style="${x.qtd<=0?'color:var(--bad);font-weight:700':''}">${estFmt(x.qtd)}</td><td class="n num">${x.min||'—'}</td><td class="n num">${x.vend||''}</td><td class="n num"><b>${x.sugerir}</b></td></tr>`).join('')}
      ${vis.length>300?`<tr><td colspan="9" class="apagado">… e mais ${vis.length-300}. Use a busca.</td></tr>`:''}</tbody></table></div>`}`;
}
function opComprasVis(){ const q = semAcento(S.adm.cpQ||''), cat = S.adm.cpCat||''; return opCompras().filter(x=>(!cat || (x.p.categoria||'Sem categoria')===cat) && (!q || semAcento(x.p.nome+' '+(x.p.codigo||'')).includes(q))); }
function opComprasCopiar(){
  const L = opComprasVis(); if(!L.length) return toast('Nada na lista', true);
  const porCat = {}; L.forEach(x=>{ const c = x.p.categoria||'Outros'; (porCat[c]=porCat[c]||[]).push(x); });
  const t = [`*🛒 Pedido de compra — Las Vegas Sex Shop · ${ddmm(hojeISO())}*`, '', ...Object.entries(porCat).flatMap(([c,xs])=>[`*${c}*`, ...xs.map(x=>`• ${x.sugerir}x ${x.p.nome}${x.p.codigo?' ('+x.p.codigo+')':''}`), '']), `_${L.length} produtos · ${L.reduce((s,x)=>s+x.sugerir,0)} peças_`].join('\n');
  opCopiar(t, 'Pedido copiado ✔');
}
function opComprasCsv(){
  const L = opComprasVis(), locais = estLocais();
  const linhas = [['Produto','Código','Categoria',...locais.map(l=>l.nome),'Total','Mínimo','Vendeu 30d','Comprar'], ...L.map(x=>[x.p.nome, x.p.codigo||x.p.sku||'', x.p.categoria||'', ...locais.map(l=>x.locais[l.id]||0), x.qtd, x.min, x.vend, x.sugerir])];
  const csv = '﻿'+linhas.map(l=>l.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'lista-de-compra-'+hojeISO()+'.csv'; a.click();
}
async function opMinimoAuto(){
  const V = opVendasPorProduto(30), L = estLocais().filter(l=>l.tipo!=='deposito'), lista = [];
  const sal = {}; (estD().saldos||[]).forEach(s=>{ sal[s.produto_id+'|'+s.loja] = s; });
  pdvD().produtos.forEach(p=>L.forEach(l=>{ const v = V.porLoja[p.id+'|'+l.loja]||0; if(v<=0) return; const mn = Math.max(1, Math.ceil(v/2)); const s = sal[p.id+'|'+l.id]; if(s && Number(s.minimo)===mn) return; lista.push({produto_id:p.id, loja:l.id, minimo:mn}); }));
  if(!lista.length) return toast('Os mínimos já estão em dia (ou ainda não há vendas no PDV).', true);
  if(!confirm(`Definir o mínimo de ${lista.length} produto(s) pelas vendas dos últimos 30 dias?\n\nRegra: mínimo da prateleira = metade do que vendeu na loja no mês (pelo menos 1). Produtos que não venderam não mudam. Mínimos já iguais ficam como estão.`)) return;
  try{ const d = await api('admOperacao', {...S.adm.cred, op:'minimoLote', lista}); S.adm.dados = d; render(); toast(`Mínimo gravado em ${d.minimo?.gravados??lista.length} produto(s) ✔`); }
  catch(e){ toast(e.message, true); }
}
/* botão "Compras" na barra de Administração › Estoque */
const _admEstoqueV20 = admEstoque;
admEstoque = function admEstoque(){
  const compras = S.adm.estSub==='compras';
  if(compras) S.adm.estSub = 'saldo';
  let h = _admEstoqueV20();
  if(compras) S.adm.estSub = 'compras';
  const n = opCompras().length;
  const i0 = h.indexOf('<div class="pdv-sub">'); if(i0<0) return compras ? h + opComprasTela() : h;
  const i1 = h.indexOf('</div>', i0);
  let barra = h.slice(i0, i1);
  if(compras) barra = barra.replace(/ class="on"/g,' class=""');
  barra += `<button class="${compras?'on':''}" onclick="S.adm.estSub='compras';render()"><i class="ti ti-shopping-cart-plus"></i>Compras${n?` <span class="contador">${n}</span>`:''}</button>`;
  return h.slice(0,i0) + barra + (compras ? '</div>' + opComprasTela() : h.slice(i1));
};
/* "Alertas de hoje" no topo da Visão geral (Ao vivo) */
function opAlertas(){
  const d = S.adm?.dados; if(!d) return [];
  const hoje = d.hoje, ontem = addDays(hoje,-1), agora = opHoraMin(d.hora||S.boot.hora), A = [];
  Object.entries(d.lojas).forEach(([k,l])=>{
    const ab = opChkEstado(d, k, 'abertura');
    if(ab.total && !ab.completo && agora > opHoraMin(l.abre)+30) A.push({c:'warn', i:'ti-sunrise', t:`Loja ${l.nome} sem abertura marcada`, s:`${ab.ok}/${ab.total} itens — devia abrir às ${l.abre}`, go:()=>{ S.adm.tab='hoje'; }});
    const fe = opChkEstado(d, k, 'fechamento');
    if(fe.total && !fe.completo && agora > opHoraMin(l.fecha)+30) A.push({c:'warn', i:'ti-moon', t:`Loja ${l.nome} sem fechamento marcado`, s:`${fe.ok}/${fe.total} itens — fecha às ${l.fecha}`, go:()=>{ S.adm.tab='hoje'; }});
    const semCaixa = []; for(let n=1;n<=7;n++){ const dia = addDays(hoje,-n); if((pdvD().vendas||[]).some(v=>v.data===dia && v.loja===k && v.status!=='cancelada') && !(opD().fechamentos||[]).some(f=>f.data===dia && f.loja===k)) semCaixa.push(dia); }
    if(semCaixa.length) A.push({c:'bad', i:'ti-cash-register', t:`Caixa da ${l.nome} sem fechar: ${semCaixa.map(ddmm).join(', ')}`, s:semCaixa.length===1&&semCaixa[0]===ontem?'Ontem teve venda no PDV e ninguém fechou o caixa':'Dias com venda no PDV e sem fechamento (últimos 7 dias)', go:()=>{ S.adm.tab='caixa'; }});
  });
  (opD().fechamentos||[]).filter(f=>f.status==='diferenca').slice(0,5).forEach(f=>{ const m = Math.max(...Object.values(f.diferenca||{}).map(v=>Math.abs(Number(v)||0)),0); A.push({c:'bad', i:'ti-alert-triangle', t:`Caixa ${opLojaNome(f.loja)} ${ddmm(f.data)} com diferença de ${brl2(m)}`, s:`Fechado por ${primeiroNome(f.por)} — toque para conferir`, go:()=>{ S.adm.tab='caixa'; setTimeout(()=>opVerFech(f.id), 60); }}); });
  if(typeof estD==='function' && d.estoque && !d.estoque.erro){
    const velhas = (estD().transferencias||[]).filter(t=>t.status==='em_transito' && String(t.criada_em).slice(0,10) < hoje);
    if(velhas.length) A.push({c:'warn', i:'ti-truck', t:`${velhas.length} transferência(s) em trânsito desde ontem ou antes`, s:'A loja de destino ainda não conferiu', go:()=>{ S.adm.tab='estoque'; S.adm.estSub='transferir'; }});
    const n = opCompras().length, z = opCompras().filter(x=>x.qtd<=0).length;
    if(n) A.push({c: z?'bad':'warn', i:'ti-shopping-cart-plus', t:`${n} produto(s) para comprar`, s:`${z} zerado(s) e ${n-z} abaixo do mínimo — lista pronta em Estoque › Compras`, go:()=>{ S.adm.tab='estoque'; S.adm.estSub='compras'; }});
  }
  return A;
}
window._opAlertasGo = [];
function opAlertasHtml(){
  const A = opAlertas(); window._opAlertasGo = A.map(a=>a.go);
  if(!A.length) return `<div class="op-card op-alerta ok" style="margin-top:0"><h3>✅ Tudo em ordem hoje</h3><div class="sub">Abertura, caixa, transferências e estoque mínimo sem pendências.</div></div>`;
  return `<div class="op-card op-alerta ${A.some(a=>a.c==='bad')?'bad':''}" style="margin-top:0"><h3>🔔 Alertas de hoje <span class="op-st ${A.some(a=>a.c==='bad')?'diferenca':'aberto'}">${A.length}</span></h3>
    <div class="op-alertas">${A.map((a,i)=>`<button class="${a.c}" onclick="_opAlertasGo[${i}]();render()"><i class="ti ${a.i}"></i><div><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div><i class="ti ti-chevron-right apagado"></i></button>`).join('')}</div></div>`;
}
if(typeof htmlAoVivo==='function'){
  const _htmlAoVivoV20 = htmlAoVivo;
  htmlAoVivo = function htmlAoVivo(){ const h = _htmlAoVivoV20(); const i = h.indexOf('>'); return i>0 ? h.slice(0,i+1) + opAlertasHtml() + h.slice(i+1) : opAlertasHtml()+h; };
}
