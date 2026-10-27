function blocoAtalhos(){
  const sol = S.sess.dados.solicitacoes;
  const pend = sol.filter(x=>x.status==='pendente').length;
  const novas = sol.filter(x=>x.status!=='pendente' && x.decidido_em && x.decidido_em.slice(0,10) >= addDays(hojeISO(),-3));
  return `${blocoAvisosPendentes()}<h2 class="secao">Precisa de algo?</h2>
    <div class="atalhos">
      <button onclick="novoPedido({tipo:'correcao'})"><i class="ti ti-clock-edit"></i>Esqueci de bater ou corrigir horário</button>
      <button onclick="novoPedido({tipo:'atestado'})"><i class="ti ti-file-certificate"></i>Enviar atestado</button>
      <button onclick="novoPedido({tipo:'folga'})"><i class="ti ti-beach"></i>Pedir folga</button>
      <button onclick="S.portalTab='inicio';irPortal()"><i class="ti ti-layout-dashboard"></i>Meu portal</button>
    </div>
    ${pend||novas.length?`<button class="nota ${pend?'warn':'info'}" style="width:100%;margin-top:10px;text-align:left" onclick="S.portalTab='pedidos';irPortal()"><i class="ti ti-inbox"></i><div>${pend?`<b>${pend} pedido(s) aguardando</b> a administração.`:''} ${novas.length?`${novas.length} pedido(s) respondido(s) nos últimos dias.`:''} Toque para ver.</div></button>`:''}`;
}
async function bater(campo){
  const s = S.sess; if(S.ocupado) return;
  S.ocupado = true;
  const b = $('#btn-bater'); if(b){ b.disabled=true; b.innerHTML='<span class="gira"></span> Registrando…'; }
  const d = agoraServidor();
  const foto = fotoAgora();
  const pedido = {eid:s.eid, campo, token:S.aparelho?.token};
  try{
    if(s.offline) throw new TypeError('offline');
    const j = await api('bater', {...pedido, ...s.cred, foto});
    const i = s.dados.pontos.findIndex(p=>p.data===j.ponto.data);
    if(i>=0) s.dados.pontos[i]=j.ponto; else s.dados.pontos.push(j.ponto);
    S.ultimo = {campo, hora:j.hora, nome:s.dados.colaboradora.nome, offline:false, foto:!!(j.ponto.fotos && JSON.parse(j.ponto.fotos||'{}')[campo])};
    S.tela='sucesso';
  }catch(e){
    if(erroRede(e)){
      const nome = s.dados ? s.dados.colaboradora.nome : s.nome;
      const uid = 'F'+Date.now()+Math.floor(Math.random()*1e4);
      FILA_CRED[uid] = s.cred;                          // credencial só na memória; no disco vai sem PIN
      S.fila.push({...pedido, uid, offline:true, horaAparelho:pad(d.getHours())+':'+pad(d.getMinutes()), dataAparelho:isoD(d), nome});
      salvarFila();
      S.ultimo = {campo, hora:pad(d.getHours())+':'+pad(d.getMinutes()), nome, offline:true};
      S.tela='sucesso';
    } else toast(e.message, true);
  }
  S.ocupado=false; render();
}
function telaSucesso(){
  const u = S.ultimo;
  const confete = Array.from({length:26},(_,i)=>`<i class="confete" style="--d:${(i%7)*.05}s;--x:${(Math.random()*2-1)*220}px;--y:${-80-Math.random()*220}px;background:${i%3?'var(--dourado)':'var(--vermelho)'};left:${45+Math.random()*10}%"></i>`).join('');
  const fimDia = u.campo==='saida' && S.sess?.dados;
  if(fimDia){ clearTimeout(timerVolta); timerVolta = setTimeout(sair, 90000); }
  const lojaHoje = S.aparelho?.loja || S.sess?.dados?.colaboradora?.loja;
  const vendaHoje = fimDia ? (S.sess.dados.metas?.vendas||[]).find(v=>v.data===hojeISO() && v.colaboradora_id===S.sess.eid && v.loja===lojaHoje) : null;
  return `<div class="wrap" style="max-width:560px">${letreiro()}<div class="cartao sucesso">${confete}
    <svg class="check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><path d="M30 52 L45 66 L72 36"/></svg>
    <div style="margin-top:14px;font-weight:800;font-size:20px">${esc(NOME[u.campo])} registrada</div>
    <b class="hora num">${esc(u.hora)}</b>
    <div class="suave">${esc(primeiroNome(u.nome))}${u.offline?' · guardado sem internet, envia sozinho':u.foto?' · foto registrada':''}</div>
    ${fimDia?`<div class="cartao pad" style="margin-top:18px;text-align:left;background:var(--noite2)">
      <b style="font-size:16px">💰 Quanto você vendeu hoje na loja ${esc(S.boot.lojas[lojaHoje]?.nome||'')}?</b>
      <p class="suave" style="font-size:13.5px;margin:4px 0 10px">Entra na meta do mês na hora. ${vendaHoje?`Já lançado: <b class="num">${brl2(vendaHoje.valor)}</b> — pode corrigir.`:''}</p>
      <div class="g2"><input class="inp num" id="venda-valor" inputmode="decimal" placeholder="Ex.: 1.250,00" value="${vendaHoje?esc(vendaHoje.valor).replace('.',','):''}"><button class="btn ouro" id="btn-venda" onclick="lancarVendaRapida('${lojaHoje}')"><i class="ti ti-trending-up"></i> Lançar venda</button></div>
      <button class="btn p fantasma" style="margin-top:8px;padding:0" onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i> Registrar sangria de hoje</button>
    </div>`:''}
    <div class="linha" style="justify-content:center;margin-top:20px;gap:8px">
      ${S.sess?.dados?`<button class="btn" onclick="S.tela='bater';render()"><i class="ti ti-send"></i> Fazer um pedido</button>`:''}
      <button class="btn pri" onclick="sair()">Concluir</button>
    </div></div></div>`;
}
async function lancarVendaRapida(loja){
  const v = $('#venda-valor').value.trim(); if(!v){ toast('Digite o valor vendido', true); return; }
  const b = $('#btn-venda'); b.disabled = true;
  try{ S.sess.dados = await api('venda', {eid:S.sess.eid, ...S.sess.cred, loja, valor:v}); toast('Venda lançada ✔ Meta atualizada'); render(); }
  catch(e){ toast(e.message, true); b.disabled=false; }
}

/* ──────────── METAS ──────────── */
function fonteMetas(){
  if(S.adm) return {vendas:S.adm.dados.vendas||[], cfg:S.adm.dados.metas||{}, premios:S.adm.dados.premios||{}, lider:S.adm.dados.liderId||'', equipe:S.adm.dados.colaboradoras};
  const m = S.sess.dados.metas||{};
  return {vendas:m.vendas||[], cfg:m.metas||{}, premios:m.premios||{}, lider:m.liderId||'', equipe:S.sess.dados.equipe||[]};
}
function metasDe(ym){
  const f = fonteMetas(), v = f.vendas.filter(x=>x.data.startsWith(ym)), m = f.cfg[ym]||{};
  const porLoja = {}, porPessoa = {}, lojaPessoa = {};
  Object.keys(S.boot.lojas).forEach(k=>porLoja[k]=0);
  v.forEach(x=>{ const n = Number(x.valor)||0; porLoja[x.loja]=(porLoja[x.loja]||0)+n; porPessoa[x.colaboradora_id]=(porPessoa[x.colaboradora_id]||0)+n; lojaPessoa[x.colaboradora_id]=x.loja; });
  const total = Object.values(porLoja).reduce((a,b)=>a+b,0);
  return {ym, v, m, porLoja, porPessoa, lojaPessoa, total, faixa:faixaDe, premios:f.premios, lider:f.lider, equipe:f.equipe};
}
const FAIXA_NOME = {meta:'Meta batida', super:'Super meta', hiper:'Hiper meta'};
const faixaDe = (val, mt) => !mt||!mt.meta ? null : val>=mt.hiper?'hiper': val>=mt.super?'super': val>=mt.meta?'meta': null;
function barraMeta(val, mt){
  if(!mt||!mt.meta) return '<p class="apagado" style="font-size:13px">Meta não definida para este mês.</p>';
  const max = mt.hiper||mt.meta, pct = Math.min(100, val/max*100);
  const marca = (x, n) => `<i style="position:absolute;left:${Math.min(100,x/max*100)}%;top:-3px;width:2px;height:14px;background:var(--creme3)" title="${n}"></i>`;
  const f = faixaDe(val, mt);
  const prox = val<mt.meta?['meta',mt.meta]: val<mt.super?['super',mt.super]: val<mt.hiper?['hiper',mt.hiper]: null;
  return `<div class="medidor" style="height:12px;position:relative;overflow:visible;margin-top:10px"><i style="width:${pct}%;background:${f==='hiper'?'linear-gradient(90deg,var(--ok),#9FF0CC)':f?'linear-gradient(90deg,var(--dourado),var(--dourado2))':'linear-gradient(90deg,var(--vermelho2),var(--vermelho))'}"></i>${marca(mt.meta,'Meta')}${marca(mt.super,'Super')}</div>
    <div class="linha entre" style="font-size:12px;margin-top:8px;color:var(--creme3)"><span>Meta ${brl(mt.meta)}</span><span>Super ${brl(mt.super)}</span><span>Hiper ${brl(mt.hiper)}</span></div>
    <div style="margin-top:6px;font-size:13.5px">${f?`<span class="selo ${f==='hiper'?'ok':'warn'}">🏆 ${FAIXA_NOME[f]}</span>`:''} ${prox?`<span class="suave">Faltam <b class="num">${brl(prox[1]-val)}</b> para a ${prox[0]==='meta'?'meta':prox[0]==='super'?'super meta':'hiper meta'}</span>`:'<span class="pos">Hiper meta batida! 🎉</span>'}</div>`;
}
function painelMetasHTML(ym, admin){
  const M = metasDe(ym), lojas = S.boot.lojas;
  const cards = Object.entries(lojas).map(([k,l])=>`<div class="cartao pad"><div class="linha entre"><b style="font-size:16px">Loja ${esc(l.nome)}</b><b class="num" style="font-size:22px">${brl(M.porLoja[k]||0)}</b></div>${barraMeta(M.porLoja[k]||0, M.m[k])}</div>`).join('');
  const liderC = M.equipe.find(c=>c.id===M.lider);
  const liderCard = liderC && M.m.lider ? `<div class="cartao pad" style="border-color:rgba(245,181,36,.45)"><div class="linha entre"><b style="font-size:16px">⭐ ${esc(primeiroNome(liderC.nome))} (líder) — soma das lojas</b><b class="num" style="font-size:22px">${brl(M.total)}</b></div>${barraMeta(M.total, M.m.lider)}</div>` : '';
  const ranking = Object.entries(M.porPessoa).sort((a,b)=>b[1]-a[1]).map(([id,val],i)=>{ const c = M.equipe.find(x=>x.id===id)||{nome:id,cor:'#999'}; const lj = M.lojaPessoa[id]; const f = id===M.lider ? M.faixa(M.total, M.m.lider) : M.faixa(M.porLoja[lj]||0, M.m[lj]);
    return `<tr><td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(primeiroNome(c.nome))}${id===M.lider?' ⭐':''}</td><td class="n num"><b>${brl(val)}</b></td><td>${f?`<span class="selo ${f==='hiper'?'ok':'warn'}">${FAIXA_NOME[f]} · ${brl(M.premios[f]||0)}${f==='hiper'&&M.premios.hiper_bonus?' + '+esc(M.premios.hiper_bonus):''}</span>`:'<span class="apagado">ainda sem prêmio</span>'}</td></tr>`; }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">${cards}${liderCard}</div>
    <h2 class="secao">Ranking de ${nomeMes(ym)} <small>prêmio só sai com a meta da loja batida</small></h2>
    <div class="tabela"><table><thead><tr><th>#</th><th>Vendedora</th><th>Vendido</th><th>Premiação</th></tr></thead><tbody>${ranking||'<tr><td colspan="4" class="suave">Nenhuma venda lançada ainda neste mês.</td></tr>'}</tbody></table></div>
    <div class="nota info" style="margin-top:12px"><i class="ti ti-trophy"></i><div>Prêmios: meta <b>${brl(M.premios.meta||0)}</b> · super meta <b>${brl(M.premios.super||0)}</b> · hiper meta <b>${brl(M.premios.hiper||0)}</b>${M.premios.hiper_bonus?' + <b>'+esc(M.premios.hiper_bonus)+'</b>':''}. A vendedora só recebe se a meta da <b>loja</b> for batida; a líder ganha pela soma das duas lojas.</div></div>`;
}
function portalMetas(){
  const ym = S.portalMes || mesDe(hojeISO());
  const minhas = metasDe(ym).v.filter(v=>v.colaboradora_id===S.sess.eid).sort((a,b)=>b.data.localeCompare(a.data));
  return `${seletorMes(ym,'mudarMesPortal')}
    <button class="btn ouro largo" style="margin:12px 0" onclick="abrirVenda()"><i class="ti ti-trending-up"></i> Lançar venda do dia</button>
    ${painelMetasHTML(ym,false)}
    <h2 class="secao">Minhas vendas lançadas</h2>
    ${minhas.length?`<div class="tabela"><table><thead><tr><th>Dia</th><th>Loja</th><th>Valor</th></tr></thead><tbody>${minhas.map(v=>`<tr><td>${ddmm(v.data)}</td><td>${esc(S.boot.lojas[v.loja]?.nome||v.loja)}</td><td class="n num">${brl2(v.valor)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="suave">Você ainda não lançou vendas neste mês.</p>'}`;
}
let VD = null;
function abrirVenda(pre={}){
  const lojaHoje = S.aparelho?.loja || (S.sess.dados.pontos.find(p=>p.data===hojeISO())||{}).loja || S.sess.dados.colaboradora.loja;
  VD = {data:hojeISO(), loja:lojaHoje, valor:'', ...pre};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Lançar venda</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="g2"><div class="campo"><label>Dia</label><input class="inp" type="date" value="${VD.data}" min="${addDays(hojeISO(),-3)}" max="${hojeISO()}" onchange="VD.data=this.value"></div>
      <div class="campo"><label>Loja</label><select class="inp" onchange="VD.loja=this.value">${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${VD.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div></div>
      <div class="campo"><label>Total vendido no dia (R$)</label><input class="inp num" inputmode="decimal" placeholder="Ex.: 1.250,00" oninput="VD.valor=this.value"></div>
      <p class="apagado" style="font-size:13px;margin-bottom:12px">Se já tiver um valor lançado nesse dia e loja, ele é substituído.</p>
      <button class="btn ouro largo" id="btn-vd" onclick="salvarVenda()"><i class="ti ti-check"></i> Lançar</button>
    </div></div></div>`;
}
async function salvarVenda(){
  const b = $('#btn-vd'); b.disabled=true;
  try{ S.sess.dados = await api('venda', {eid:S.sess.eid, ...S.sess.cred, ...VD}); fecharModal(); S.portalTab='metas'; render(); toast('Venda lançada ✔'); }
  catch(e){ toast(e.message, true); b.disabled=false; }
}

/* ──────────── SANGRIA (caixa) ──────────── */
let SG = null;
function abrirSangria(){
  const d = S.sess.dados, lojaHoje = S.aparelho?.loja || (d.pontos.find(p=>p.data===hojeISO())||{}).loja || d.colaboradora.loja;
  SG = {loja:lojaHoje, valor:'', conferiu:'', video_url:'', obs:''};
  const outras = (d.equipe||[]).filter(c=>c.id!==S.sess.eid);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Registrar sangria</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="nota warn" style="margin-bottom:12px"><i class="ti ti-lock"></i><div>Depois de registrada, a sangria não pode ser editada nem apagada. Confira o valor antes.</div></div>
      <div class="g2"><div class="campo"><label>Loja</label><select class="inp" onchange="SG.loja=this.value">${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${SG.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div>
      <div class="campo"><label>Valor retirado (R$)</label><input class="inp num" inputmode="decimal" placeholder="Ex.: 300,00" oninput="SG.valor=this.value"></div></div>
      <div class="campo"><label>Quem conferiu com você</label><input class="inp" list="lista-equipe" placeholder="Nome de quem conferiu" oninput="SG.conferiu=this.value"><datalist id="lista-equipe">${outras.map(c=>`<option value="${esc(primeiroNome(c.nome))}">`).join('')}<option value="Madu"></datalist></div>
      <div class="campo"><label>Link do vídeo do envelope (opcional)</label><input class="inp" placeholder="Cole o link do Drive/WhatsApp" oninput="SG.video_url=this.value"></div>
      <div class="campo"><label>Observação (opcional)</label><input class="inp" oninput="SG.obs=this.value"></div>
      <button class="btn pri largo" id="btn-sg" onclick="salvarSangria()"><i class="ti ti-cash-banknote"></i> Registrar sangria</button>
    </div></div></div>`;
}
async function salvarSangria(){
  if(!SG.valor){ toast('Informe o valor', true); return; }
  if(!confirm('Confirmar sangria de R$ '+SG.valor+' da loja '+(S.boot.lojas[SG.loja]?.nome||'')+'? Não dá para editar depois.')) return;
  const b = $('#btn-sg'); b.disabled=true;
  try{ S.sess.dados = await api('sangria', {eid:S.sess.eid, ...S.sess.cred, ...SG}); fecharModal(); if(S.tela==='portal') S.portalTab='caixa'; render(); toast('Sangria registrada ✔'); }
  catch(e){ toast(e.message, true); b.disabled=false; }
}
function portalCaixa(){
  const d = S.sess.dados, hoje = d.sangriasHoje||[];
  return `<button class="btn pri largo" style="margin-bottom:12px" onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i> Registrar sangria</button>
    <h2 class="secao">Minhas sangrias de hoje</h2>
    ${hoje.length?`<div class="tabela"><table><thead><tr><th>Hora</th><th>Loja</th><th>Valor</th><th>Conferiu</th></tr></thead><tbody>${hoje.map(s=>`<tr><td class="num">${esc(s.hora)}</td><td>${esc(S.boot.lojas[s.loja]?.nome||s.loja)}</td><td class="n num">${brl2(s.valor)}</td><td>${esc(s.conferiu||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="suave">Nenhuma sangria registrada por você hoje.</p>'}
    <div class="nota info" style="margin-top:12px"><i class="ti ti-info-circle"></i><div>Como funciona: tirou a sangria → coloca no envelope → registra aqui com quem conferiu → manda o vídeo do envelope no grupo. O total do caixa só a administração vê.</div></div>`;
}

/* ──────────── CHECKLIST ──────────── */
function itensChecklist(itens, loja, data){
  const dw = dow(data);
  return itens.filter(i => (!i.loja || i.loja===loja) && (!i.dias || String(i.dias).split(',').includes(String(dw))));
}
function portalChecklist(){
  const d = S.sess.dados, hoje = hojeISO();
  const loja = S.chkLoja || S.aparelho?.loja || (d.pontos.find(p=>p.data===hoje)||{}).loja || d.colaboradora.loja;
  const itens = itensChecklist(d.checklist?.itens||[], loja, hoje), feitos = (d.checklist?.feitos||[]).filter(f=>f.loja===loja);
  const grupo = t => itens.filter(i=>i.turno===t);
  const linha = i => { const f = feitos.find(x=>x.item_id===i.id); return `<label class="dia" style="grid-template-columns:34px 1fr;cursor:pointer;${f?'opacity:.75':''}"><input type="checkbox" ${f?'checked':''} ${f&&f.colaboradora_id!==S.sess.eid?'disabled':''} style="width:22px;height:22px;accent-color:var(--dourado)" onchange="checar('${i.id}','${loja}',this.checked)"><div><div style="font-weight:700;${f?'text-decoration:line-through':''}">${esc(i.texto)}</div>${f?`<div class="apagado" style="font-size:12px">✔ ${esc(primeiroNome(f.colaboradora))} às ${esc(f.hora)}</div>`:''}</div></label>`; };
  const bloco = (t, titulo, ico) => grupo(t).length ? `<h2 class="secao">${ico} ${titulo} <small>${grupo(t).filter(i=>feitos.some(f=>f.item_id===i.id)).length}/${grupo(t).length}</small></h2><div class="dias">${grupo(t).map(linha).join('')}</div>` : '';
  const total = itens.length, ok = itens.filter(i=>feitos.some(f=>f.item_id===i.id)).length;
  return `<div class="linha entre quebra" style="margin-bottom:10px"><div><div class="ola" style="font-size:22px">Checklist de hoje</div><div class="suave">${esc(dataLonga(hoje))}</div></div>
      <select class="inp" style="width:auto" onchange="S.chkLoja=this.value;render()">${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${loja===k?'selected':''}>Loja ${esc(l.nome)}</option>`).join('')}</select></div>
    <div class="numero" style="margin-bottom:6px"><small>Feito</small><b class="num ${ok===total&&total?'pos':''}">${ok} de ${total}</b><div class="medidor"><i style="width:${total?ok/total*100:0}%"></i></div></div>
    ${bloco('abertura','Abertura','🌅')}${bloco('dia','Durante o dia','☀️')}${bloco('fechamento','Fechamento','🌙')}
    ${!total?'<p class="suave">Nenhum item cadastrado para hoje.</p>':''}`;
}
async function checar(item, loja, feito){
  try{ S.sess.dados = await api('checar', {eid:S.sess.eid, ...S.sess.cred, item, loja, feito}); render(); if(feito){ const d=S.sess.dados; const it = itensChecklist(d.checklist.itens, loja, hojeISO()); const ok = it.filter(i=>d.checklist.feitos.some(f=>f.item_id===i.id&&f.loja===loja)).length; if(ok===it.length) toast('Checklist completo! 🎉'); } }
  catch(e){ toast(e.message, true); render(); }
}

/* ──────────── ESCALA ──────────── */
function escalaDe(data, lista){ return (lista||[]).filter(e=>e.data===data); }
function turnoTxt(e){ const t = (S.boot.turnos||{})[e.loja]||{}; return `${TURNO_NOME[e.turno]||e.turno}${t[e.turno]?' '+t[e.turno]:''}`; }
function portalEscala(){
  const d = S.sess.dados, hoje = hojeISO(), eq = d.equipe||[];
  const dias = Array.from({length:14},(_,i)=>addDays(hoje,i)).filter(x=>dow(x)!==0);
  const minha = dias.map(x=>{ const e = escalaDe(x, d.escala).find(e=>e.colaboradora_id===S.sess.eid); return `<div class="dia" style="grid-template-columns:78px 1fr"><div><div class="d1">${ddmm(x)}</div><div class="d2">${semana(x)}</div></div><div>${e?`<b>Loja ${esc(S.boot.lojas[e.loja]?.nome||e.loja)}</b> · ${esc(turnoTxt(e))}${e.obs?' · '+esc(e.obs):''}`:'<span class="apagado">sem escala definida</span>'}</div></div>`; }).join('');
  const equipeHoje = escalaDe(hoje, d.escala).map(e=>{ const c = eq.find(x=>x.id===e.colaboradora_id)||{nome:e.colaboradora_id}; return `<span class="selo"><span class="ponto" style="background:${esc(c.cor||'#999')}"></span> ${esc(primeiroNome(c.nome))} · ${esc(S.boot.lojas[e.loja]?.nome||e.loja)} ${TURNO_NOME[e.turno]||''}</span>`; }).join(' ');
  return `<h2 class="secao">Quem está onde hoje</h2><div class="linha quebra" style="gap:6px">${equipeHoje||'<span class="apagado">Escala de hoje não definida.</span>'}</div>
    <h2 class="secao">Minha escala <small>próximos 14 dias</small></h2><div class="dias">${minha}</div>`;
}
function portalMais(){
  const pend = S.sess.dados.solicitacoes.filter(s=>s.status==='pendente').length, tr = progressoTrilha();
  const itens = [['pedidos','ti-send','Meus pedidos',pend?pend+' aguardando a administração':'Correção, atestado e folga'],['protocolos','ti-book','Protocolos da loja','O manual: regras e passo a passo'],['treino','ti-school','Treinamento',tr.total?tr.pct+'% da trilha concluída':'Trilha da equipe'],['atalhos','ti-apps','Atalhos','Kommo, Nuvemshop, Instagram…'],['mes','ti-calendar-stats','Meu mês','Ponto, saldo e banco de horas'],['checklist','ti-checklist','Checklist do dia','Abertura, loja, conteúdo, fechamento'],['caixa','ti-cash-banknote','Caixa / sangria','Registrar a sangria de hoje'],['escala','ti-calendar-time','Minha escala','Loja e turno dos próximos dias'],['agenda','ti-calendar-event','Agenda da equipe','Folgas, eventos e campanhas'],['eu','ti-user-circle','Meu perfil','WhatsApp e PIN']];
  return itens.map(([k,i,n,s])=>`<button class="pedido" style="width:100%;text-align:left;cursor:pointer" onclick="S.portalTab='${k}';render()"><div class="ico"><i class="ti ${i}"></i></div><div class="cresce"><b>${n}</b><p>${s}</p></div><i class="ti ti-chevron-right apagado"></i></button>`).join('');
}
function sair(){ S.sess=null; S.tela='inicio'; render(); }
function irPortal(){ S.tela='portal'; render(); }

/* ──────────── PORTAL DA EQUIPE ──────────── */
function telaPortal(){
  const d = S.sess.dados;
  const pend = d.solicitacoes.filter(s=>s.status==='pendente').length;
  const nl = avisosNaoLidos().length;
  const abas = [['inicio','ti-home','Início'],['mural','ti-speakerphone','Mural',nl],['mes','ti-calendar-stats','Meu mês'],['metas','ti-trophy','Metas'],['pedidos','ti-send','Pedidos',pend],['checklist','ti-checklist','Checklist'],['caixa','ti-cash-banknote','Caixa'],['escala','ti-calendar-time','Escala'],['protocolos','ti-book','Protocolos'],['treino','ti-school','Treinamento'],['atalhos','ti-apps','Atalhos'],['agenda','ti-calendar-event','Agenda'],['eu','ti-user-circle','Eu']];
  const barra = [['inicio','ti-home','Início'],['metas','ti-trophy','Metas'],['checklist','ti-checklist','Checklist'],['mural','ti-speakerphone','Mural',nl],['mais','ti-dots','Mais',pend]];
  const fn = {inicio:portalInicio, mes:portalMes, metas:portalMetas, pedidos:portalPedidos, checklist:portalChecklist, caixa:portalCaixa, escala:portalEscala, agenda:portalAgenda, eu:portalEu, mais:portalMais, mural:portalMural, protocolos:portalProtocolos, treino:portalTreino, atalhos:portalAtalhos};
  const corpo = (fn[S.portalTab]||portalInicio)();
  const naBarra = barra.some(b=>b[0]===S.portalTab) ? S.portalTab : 'mais';
  return `<div class="wrap" style="max-width:860px">${letreiro(`<div class="linha" style="margin-left:auto;gap:6px">${btnBusca()}<button class="btn p" onclick="sair()"><i class="ti ti-logout-2"></i> Sair</button></div>`)}
    ${modoLoja()?btnVoltar('Voltar ao ponto'):''}
    <div class="abas esconde-p" style="margin-bottom:14px">${abas.map(([k,i,n,b])=>`<button class="aba ${S.portalTab===k?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='${k}';S.protoAberto=null;render()"><i class="ti ${i}"></i> ${n} ${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}
    <div class="barra" style="display:none" id="barra">${barra.map(([k,i,n,b])=>`<button class="${naBarra===k?'on':''}" onclick="S.portalTab='${k}';render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    <style>@media (max-width:640px){#barra{display:flex!important}}</style>
  </div>`;
}
function portalInicio(){
  const d = S.sess.dados, c = d.colaboradora, regras = d.regras;
  const mapa = mapaPontos(d.pontos, c.id);
  const hoje = hojeISO(), r = mapa[hoje] || {};
  const res = resumoMes(c, mesDe(hoje), mapa, regras), banco = bancoTotal(c, mapa, regras);
  const prox = proximoCampo(r);
  const h = agoraServidor().getHours();
  const saud = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const avisos = (d.calendario?.eventos||[]).filter(e=>e.tipo==='aviso' && (e.data_fim||e.data) >= addDays(hoje,-7)).slice(-5).reverse();
  const proximos = (d.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && (e.data_fim||e.data) >= hoje).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,4);
  const pct = Math.max(0, Math.min(100, Math.round(res.trabalhado / Math.max(1,res.previsto) * 100)));
  const marcas = CAMPOS.filter(k=>r[k]).map(k=>`<span class="selo">${CURTO[k]} <b class="num">${r[k]}</b></span>`).join('');
  const mh = minutosHoje(r), tr = progressoTrilha();
  return `<div class="ola" style="margin-bottom:4px">${saud}, ${esc(primeiroNome(c.nome))}!</div>
    <div class="suave" style="margin-bottom:14px">${esc(dataLonga(hoje))}</div>
    ${blocoAvisosPendentes()}
    <div class="cartao pad linha" style="gap:16px;align-items:center">${r.tipo&&r.tipo!=='normal'?'':anel(mh/regras.jornada_min*100, hm(mh), 'de '+hm(regras.jornada_min), 92)}<div class="cresce">
      <div class="linha entre quebra"><b style="font-size:16px">Hoje</b>${r.tipo&&r.tipo!=='normal'?`<span class="selo info">${TIPO_NOME[r.tipo]}</span>`:prox?(r.entrada?`<span class="selo ok">Trabalhando</span>`:`<span class="selo">Ainda sem marcação</span>`):`<span class="selo ok">Dia encerrado · ${hm(trab(r))}</span>`}</div>
      <div class="linha quebra" style="gap:6px;margin-top:10px">${marcas || '<span class="apagado" style="font-size:14px">Nenhuma marcação hoje. O ponto é batido no computador da loja.</span>'}</div>
    </div></div>
    ${tr.total && tr.pct<100?`<button class="nota info" style="width:100%;text-align:left;margin-top:12px;cursor:pointer" onclick="S.portalTab='treino';render()"><i class="ti ti-school"></i><div><b>Treinamento: ${tr.feitos} de ${tr.total} passos.</b> Toque para continuar a sua trilha.</div></button>`:''}
    <div class="numeros" style="margin-top:12px">
      <div class="numero"><small>Banco de horas</small><b class="num ${banco.saldo>0?'pos':banco.saldo<0?'neg':''}">${hm(banco.saldo,true)}</b><span>${banco.folgasDisp?banco.folgasDisp+' folga(s) disponível(is)':'ainda sem folga disponível'}</span></div>
      <div class="numero"><small>Este mês</small><b class="num">${hm(res.trabalhado)}</b><span>de ${hm(res.previsto)} previstas</span><div class="medidor"><i style="width:${pct}%"></i></div></div>
      <div class="numero"><small>Pendências</small><b class="${res.pend?'neg':'pos'}">${res.pend}</b><span>${res.pend?'dias para corrigir':'tudo em dia'}</span></div>
    </div>
    ${(()=>{ const M = metasDe(mesDe(hoje)); const esc0 = escalaDe(hoje, d.escala).find(e=>e.colaboradora_id===c.id); const lojaHoje = esc0?.loja || r.loja || c.loja; const mt = M.m[lojaHoje]; const minha = M.porPessoa[c.id]||0;
      const it = itensChecklist(d.checklist?.itens||[], lojaHoje, hoje), ok = it.filter(i=>(d.checklist?.feitos||[]).some(f=>f.item_id===i.id&&f.loja===lojaHoje)).length;
      return `<div class="numeros" style="margin-top:12px">
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='metas';render()"><small>Meta da loja ${esc(S.boot.lojas[lojaHoje]?.nome||'')} · ${nomeMes(mesDe(hoje)).split(' ')[0]}</small><b class="num">${brl(M.porLoja[lojaHoje]||0)}</b><span>${mt?'de '+brl(mt.meta)+' · você: '+brl(minha):'meta não definida'}</span>${mt?`<div class="medidor"><i style="width:${Math.min(100,(M.porLoja[lojaHoje]||0)/mt.hiper*100)}%"></i></div>`:''}</button>
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='checklist';render()"><small>Checklist de hoje</small><b class="num ${ok===it.length&&it.length?'pos':''}">${ok}/${it.length}</b><span>${ok===it.length&&it.length?'tudo feito 🎉':'toque para marcar'}</span></button>
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='escala';render()"><small>Minha escala hoje</small><b style="font-size:18px">${esc0?'Loja '+esc(S.boot.lojas[esc0.loja]?.nome||esc0.loja):'—'}</b><span>${esc0?esc(turnoTxt(esc0)):'sem escala definida'}</span></button>
      </div>`; })()}
    <h2 class="secao">O que você precisa?</h2>
    <div class="atalhos">
      <button onclick="abrirVenda()"><i class="ti ti-trending-up"></i>Lançar venda do dia</button>
      <button onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i>Registrar sangria</button>
      <button onclick="novoPedido({tipo:'correcao'})"><i class="ti ti-clock-edit"></i>Esqueci de bater ou corrigir horário</button>
      <button onclick="novoPedido({tipo:'atestado'})"><i class="ti ti-file-certificate"></i>Enviar atestado</button>
      <button onclick="novoPedido({tipo:'folga'})"><i class="ti ti-beach"></i>Pedir folga</button>
      <button onclick="S.portalTab='mes';render()"><i class="ti ti-calendar-stats"></i>Ver meu mês</button>
    </div>
    ${avisos.filter(e=>lido('aviso',e.id,c.id,d.leituras)).length?`<h2 class="secao">Mural <small><button class="btn p fantasma" style="padding:0;height:auto" onclick="S.portalTab='mural';render()">ver todos</button></small></h2><div class="mural">${avisos.filter(e=>lido('aviso',e.id,c.id,d.leituras)).slice(0,3).map(e=>cardAviso(e,d)).join('')}</div>`:''}
    ${proximos.length?`<h2 class="secao">Próximos eventos</h2>${proximos.map(e=>{ const t=TIPO_EV[e.tipo]||TIPO_EV.evento; return `<div class="pedido" style="align-items:center"><div class="ico">${t.e}</div><div class="cresce"><b>${esc(e.titulo)}</b><p>${t.n}, ${ddmm(e.data)}${e.data_fim&&e.data_fim!==e.data?' a '+ddmm(e.data_fim):''}${e.loja&&d.lojas[e.loja]?', loja '+esc(d.lojas[e.loja].nome):''}${e.obs?' — '+esc(e.obs):''}</p></div></div>`; }).join('')}`:''}
    ${(d.atalhos||[]).length?`<h2 class="secao">Atalhos <small><button class="btn p fantasma" style="padding:0;height:auto" onclick="S.portalTab='atalhos';render()">ver todos</button></small></h2><div class="grade-atalhos">${(d.atalhos||[]).flatMap(g=>g.itens||[]).filter(a=>a.destaque).slice(0,6).map(a=>tileAtalho(a)).join('')}</div>`:''}`;
}
function portalMes(){
  const d = S.sess.dados, c = d.colaboradora, regras = d.regras;
  const mapa = mapaPontos(d.pontos, c.id);
  const ym = S.portalMes || mesDe(d.hoje);
  const res = resumoMes(c, ym, mapa, regras), banco = bancoTotal(c, mapa, regras);
  return `${seletorMes(ym,'mudarMesPortal')}
    <div class="numeros" style="margin:12px 0">
      ${num('Trabalhado', hm(res.trabalhado), 'previsto '+hm(res.previsto))}
      ${num('Saldo do mês', hm(res.saldo,true), res.pend? res.pend+' pendência(s)':'sem pendências', res.saldo)}
      ${num('Banco total', hm(banco.saldo,true), banco.folgasDisp? banco.folgasDisp+' folga(s) disponível(is)':'acumulado', banco.saldo)}
    </div>
    <div class="nota info" style="margin-bottom:12px"><i class="ti ti-info-circle"></i><div>Jornada de <b>7h20 por dia</b>, de segunda a sábado. O que passar vira crédito; cada folga usa <b>8h</b> e só pode ser de terça a sexta. Toque num dia para pedir correção.</div></div>
    <div class="dias">${res.dias.filter(x=>x.data<=hojeISO() || x.tipo!=='normal').reverse().map(x=>linhaDia(x, 'pedirParaDia')).join('') || '<p class="suave" style="text-align:center;padding:20px">Mês ainda não começou.</p>'}</div>`;
}
function portalPedidos(){
  const d = S.sess.dados;
  return `<button class="btn pri largo" style="margin-bottom:12px" onclick="novoPedido()"><i class="ti ti-plus"></i> Novo pedido</button>
    ${d.solicitacoes.length ? d.solicitacoes.slice().reverse().map(s=>cardPedido(s,false)).join('') : '<p class="suave" style="text-align:center;padding:20px">Nenhum pedido ainda. Correções, atestados e folgas aparecem aqui.</p>'}`;
}
function portalAgenda(){ return calendario(S.sess.dados.calendario, false); }
function portalEu(){
  const c = S.sess.dados.colaboradora;
  return `<div class="cartao pad"><div class="linha" style="gap:14px"><div class="avatar" style="background:${esc(c.cor)};width:64px;height:64px;font-size:22px">${esc(iniciais(c.nome))}</div>
      <div><div style="font-weight:800;font-size:19px">${esc(c.nome)}</div><div class="apagado">${esc(c.cargo||'Equipe Las Vegas')}${c.admissao?' · desde '+ddmm(c.admissao)+'/'+c.admissao.slice(0,4):''}</div></div></div></div>
    <h2 class="secao">Meu WhatsApp</h2>
    <div class="cartao pad"><p class="suave" style="font-size:14px;margin-bottom:10px">A administração usa este número para avisar quando um pedido for respondido.</p>
      <div class="g2"><input class="inp" id="meu-tel" inputmode="tel" placeholder="(68) 9 9999-9999" value="${esc(fmtTel(c.telefone))}"><button class="btn" onclick="salvarMeuTel()">Salvar número</button></div></div>
    <h2 class="secao">Meu PIN</h2>
    <div class="cartao pad"><div class="g2"><input class="inp num" id="novo-pin" inputmode="numeric" maxlength="6" placeholder="Novo PIN (6 números)"><button class="btn" onclick="trocarMeuPin()">Salvar novo PIN</button></div></div>`;
}
function mudarMesPortal(n){ S.portalMes = mesAdd(S.portalMes || mesDe(hojeISO()), n); render(); }
function seletorMes(ym, fn){
  return `<div class="linha entre cartao" style="padding:6px 8px">
    <button class="icone" style="border:0" onclick="${fn}(-1)"><i class="ti ti-chevron-left"></i></button>
    <b style="font-size:16px">${nomeMes(ym)}</b>
    <button class="icone" style="border:0" onclick="${fn}(1)"><i class="ti ti-chevron-right"></i></button></div>`;
}
function num(t, v, sub, sinal){
  const cls = sinal==null ? '' : (sinal>0?'pos':sinal<0?'neg':'');
  return `<div class="numero"><small>${t}</small><b class="num ${cls}">${v}</b><span>${sub||''}</span></div>`;
}
function linhaDia(x, onclick){
  const r = x.r || {};
  const hist = (()=>{ try{ return JSON.parse(r.historico||'[]'); }catch(e){ return []; } })();
  const editados = new Set(hist.map(h=>h.campo));
  const marks = CAMPOS.filter(k=>r[k]).map(k=>`<span class="num ${editados.has(k)?'ed':''}" title="${NOME[k]}">${r[k]}</span>`).join('');
  let dir = '';
  if(x.trabalhado || x.saldo) dir = `<span class="num">${x.trabalhado?hm(x.trabalhado):''}</span><small class="num ${x.saldo>0?'pos':x.saldo<0?'neg':'apagado'}">${x.saldo?hm(x.saldo,true):'em dia'}</small>`;
  const cls = x.domingo && !marks ? 'dom' : (x.futuro && x.tipo==='normal' ? 'futuro' : '');
  const body = marks ? `<div class="marcas">${marks}</div>` : `<div class="apagado" style="font-size:13.5px">${x.domingo?'Domingo, descanso':x.feriado?'Feriado':x.futuro?'—':x.tipo!=='normal'?'':'Sem marcação'}</div>`;
  return `<button class="dia ${cls}" onclick="${onclick}('${x.data}')">
    <div><div class="d1">${ddmm(x.data)}</div><div class="d2">${semana(x.data)}${r.loja&&marks?' · '+esc((S.boot.lojas[r.loja]||{}).nome||r.loja):''}</div></div>
    <div>${body}${x.flags.length?`<div class="avisos">${x.flags.map(f=>`<span class="selo ${f.c}">${esc(f.n)}</span>`).join('')}</div>`:''}</div>
    <div class="dir">${dir}</div></button>`;
}
function saldoDe(eid){ // banco atual (admin ou própria)
  const d = S.adm ? S.adm.dados : S.sess.dados;
  const c = (d.colaboradoras||[d.colaboradora]).find(x=>x.id===eid); if(!c) return null;
  return bancoTotal(c, mapaPontos(d.pontos, eid), d.regras);
}
