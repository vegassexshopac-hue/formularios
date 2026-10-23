/* ═══════ PORTAL EQUIPE LAS VEGAS · v5 — administração: ao vivo, produtividade, mural, protocolos, treinamento, atalhos ═══════ */

/* ──────────── PAINEL AO VIVO ──────────── */
const AOV = {d:null, em:0, vistos:null, num:{}};
function inicioTurno(loja, turno, turnos){ const t = ((turnos||{})[loja]||{})[turno]; const m = String(t||'').match(/(\d{1,2}):(\d{2})/); return m ? Number(m[1])*60+Number(m[2]) : null; }
function statusPonto(r){
  if(!r || !r.entrada) return {c:'fora', t:'Ainda não chegou'};
  if(r.tipo && r.tipo!=='normal') return {c:'fora', t:TIPO_NOME[r.tipo]};
  if(r.saida) return {c:'saiu', t:'Saiu às '+r.saida};
  if(r.saida_almoco && !r.volta_almoco) return {c:'pausa', t:'No almoço desde '+r.saida_almoco};
  if(r.inicio_pausa && !r.fim_pausa) return {c:'pausa', t:'Em pausa desde '+r.inicio_pausa};
  const ult = CAMPOS.filter(k=>r[k]).pop();
  return {c:'ativa', t:'Trabalhando · '+CURTO[ult].toLowerCase()+' às '+r[ult]};
}
function admAoVivo(){
  if(!AOV.d){ carregarAoVivo(); return '<div class="carregando"><span class="gira"></span> Abrindo o painel ao vivo…</div>'; }
  if(Date.now()-AOV.em > 15000) setTimeout(()=>carregarAoVivo(true), 50);
  return htmlAoVivo();
}
async function carregarAoVivo(silencioso){
  if(AOV.carregando) return; AOV.carregando = true;
  try{
    const d = await api('admAoVivo', S.adm.cred);
    AOV.d = d; AOV.em = Date.now();
    if(S.tela==='admin' && S.adm?.tab==='aovivo' && !modalAberto()){ const el = $('#aovivo'); if(el){ el.outerHTML = htmlAoVivo(); animarNumeros(); } else render(); }
  }catch(e){ if(!silencioso) toast(e.message, true); }
  AOV.carregando = false;
}
setInterval(()=>{ if(S.tela==='admin' && S.adm?.tab==='aovivo' && document.visibilityState==='visible' && !modalAberto()) carregarAoVivo(true); }, 20000);
setInterval(()=>{ const x = $('#aov-idade'); if(x && AOV.em){ const s = Math.round((Date.now()-AOV.em)/1000); x.textContent = s<5 ? 'agora mesmo' : 'há '+s+' s'; } }, 1000);
function numVivo(k, v, fmt){ return `<b class="num rola" data-k="${k}" data-v="${v}" data-f="${fmt||''}">${fmt==='brl'?brl(v):v}</b>`; }
function animarNumeros(){
  document.querySelectorAll('.rola').forEach(el=>{
    const k = el.dataset.k, v = Number(el.dataset.v)||0, de = AOV.num[k] ?? v, f = el.dataset.f;
    AOV.num[k] = v;
    if(de===v || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now(), dur = 900;
    const passo = t => { const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3), x = Math.round(de+(v-de)*e); el.textContent = f==='brl'?brl(x):x; if(p<1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
    const dif = v-de; if(dif>0){ const s = document.createElement('span'); s.className='mais'; s.textContent = '+'+(f==='brl'?brl(dif):dif); el.parentNode.appendChild(s); setTimeout(()=>s.remove(), 2200); }
  });
}
function htmlAoVivo(){
  const d = AOV.d, hoje = d.hoje, agora = toM(d.hora), ym = mesDe(hoje), tol = 10;
  const metas = (d.metas||{})[ym]||{};
  const eventos = [];
  const pessoas = d.colaboradoras.map(c=>{
    const r = d.pontos.find(p=>p.colaboradora_id===c.id) || null;
    const e = d.escala.find(x=>x.colaboradora_id===c.id);
    const loja = (r&&r.loja) || e?.loja || c.loja;
    const ini = e ? inicioTurno(e.loja, e.turno==='dia'?'abertura':e.turno, d.turnos) : null;
    let alerta = '';
    if(ini!=null && r?.entrada && toM(r.entrada) > ini+tol) alerta = `Chegou ${toM(r.entrada)-ini} min depois da escala`;
    if(ini!=null && !r?.entrada && agora > ini+tol && !(r&&r.tipo&&r.tipo!=='normal')) alerta = `Escala ${hm(ini)} · ainda sem entrada`;
    if(r) CAMPOS.forEach(k=>{ if(r[k]) eventos.push({h:r[k], t:`${primeiroNome(c.nome)} · ${CURTO[k]}`, l:loja, i:ICO[k], k:'p'+c.id+k}); });
    const venda = d.vendas.filter(v=>v.data===hoje && v.colaboradora_id===c.id).reduce((s,v)=>s+Number(v.valor||0),0);
    const chk = d.checklist.feitos.filter(f=>f.colaboradora_id===c.id).length;
    return {c, r, e, loja, st:statusPonto(r), alerta, venda, chk};
  });
  d.vendas.filter(v=>v.data===hoje).forEach(v=>eventos.push({h:(v.lancado_em||'').slice(11,16), t:`${primeiroNome(v.colaboradora)} lançou venda de ${brl(v.valor)}`, l:v.loja, i:'ti-trending-up', k:'v'+v.chave+v.valor}));
  d.sangrias.forEach(s=>eventos.push({h:s.hora, t:`${primeiroNome(s.tirou)} registrou sangria de ${brl2(s.valor)}`, l:s.loja, i:'ti-cash-banknote', k:'s'+s.id}));
  d.checklist.feitos.forEach(f=>{ const it = d.checklist.itens.find(i=>i.id===f.item_id); eventos.push({h:f.hora, t:`${primeiroNome(f.colaboradora)} ✓ ${it?it.texto:f.item_id}`, l:f.loja, i:'ti-checklist', k:'c'+f.chave}); });
  d.leituras.filter(l=>String(l.lido_em).slice(0,10)===hoje).forEach(l=>eventos.push({h:String(l.lido_em).slice(11,16), t:`${primeiroNome(l.colaboradora)} ${l.tipo==='trilha'?'concluiu um passo do treinamento':'leu '+(l.tipo==='aviso'?'um aviso':'um protocolo')}`, l:'', i:'ti-checks', k:'l'+l.chave}));
  eventos.sort((a,b)=>b.h.localeCompare(a.h));
  const novos = AOV.vistos ? eventos.filter(e=>!AOV.vistos.has(e.k)) : [];
  AOV.vistos = new Set(eventos.map(e=>e.k));
  const ativas = pessoas.filter(p=>p.st.c==='ativa').length;
  const vendaHoje = d.vendas.filter(v=>v.data===hoje).reduce((s,v)=>s+Number(v.valor||0),0);
  const sangHoje = d.sangrias.reduce((s,x)=>s+Number(x.valor||0),0);
  const naoLidos = d.avisos.reduce((n,a)=>n + d.colaboradoras.filter(c=>!d.leituras.some(l=>l.tipo==='aviso'&&l.ref_id===a.id&&l.colaboradora_id===c.id)).length, 0);
  const lojas = Object.entries(d.lojas).map(([k,l])=>{
    const ps = pessoas.filter(p=>p.loja===k && (p.r?.entrada || p.e || p.alerta));
    const mes = d.vendas.filter(v=>v.loja===k).reduce((s,v)=>s+Number(v.valor||0),0), mt = metas[k];
    const it = itensChecklist(d.checklist.itens, k, hoje), ok = it.filter(i=>d.checklist.feitos.some(f=>f.item_id===i.id&&f.loja===k)).length;
    const abre = toM(l.abre), ninguem = agora > abre+15 && agora < toM(l.fecha) && !ps.some(p=>p.r?.entrada && !p.r?.saida);
    return `<div class="cartao pad loja-vivo"><div class="linha entre"><b style="font-size:17px">Loja ${esc(l.nome)}</b><span class="apagado" style="font-size:13px">${esc(l.abre)}–${esc(l.fecha)}</span></div>
      ${ninguem?`<div class="nota bad" style="margin-top:10px"><i class="ti ti-alert-triangle"></i><div>Ninguém trabalhando na loja agora.</div></div>`:''}
      <div class="mini-num"><div><small>Mês</small>${numVivo('m'+k, Math.round(mes), 'brl')}${mt?`<span>${Math.round(mes/mt.meta*100)}% da meta</span>`:'<span>sem meta</span>'}</div>
        <div><small>Checklist</small><b class="num ${ok===it.length&&it.length?'pos':''}">${ok}/${it.length}</b><span>${it.length?Math.round(ok/it.length*100)+'%':''}</span></div></div>
      ${mt?`<div class="medidor"><i style="width:${Math.min(100,mes/mt.hiper*100)}%"></i></div>`:''}
      <div class="pessoas-vivo">${ps.map(p=>`<button class="pv ${p.st.c}" onclick="abrirEditor('${p.c.id}','${hoje}')"><span class="av" style="--cor:${esc(p.c.cor)}">${esc(iniciais(p.c.nome))}</span>
        <span class="cresce"><b>${esc(primeiroNome(p.c.nome))}${p.e?` <small class="apagado">${esc(TURNO_NOME[p.e.turno]||'')}</small>`:''}</b><small>${esc(p.st.t)}</small>${p.alerta?`<small class="neg">${esc(p.alerta)}</small>`:''}</span>
        <span class="dir">${p.venda?`<small class="pos">${brl(p.venda)}</small>`:''}${p.chk?`<small>✓ ${p.chk}</small>`:''}</span></button>`).join('') || '<p class="apagado" style="font-size:14px">Ninguém escalado nem com ponto hoje.</p>'}</div></div>`;
  }).join('');
  return `<div id="aovivo">
    <div class="linha entre quebra" style="margin-bottom:12px"><div class="linha"><span class="vivo"></span><b>Ao vivo</b><span class="apagado" style="font-size:13px" id="aov-idade">agora mesmo</span></div>
      <button class="btn p" onclick="carregarAoVivo()"><i class="ti ti-refresh"></i> Atualizar</button></div>
    <div class="numeros">
      <div class="numero"><small>Trabalhando agora</small>${numVivo('ativas', ativas)}<span>de ${pessoas.filter(p=>p.r?.entrada||p.e).length} com escala ou ponto hoje</span></div>
      <div class="numero"><small>Vendas lançadas hoje</small>${numVivo('vh', Math.round(vendaHoje), 'brl')}<span>${d.vendas.filter(v=>v.data===hoje).length} lançamento(s)</span></div>
      <div class="numero"><small>Sangrias hoje</small>${numVivo('sg', Math.round(sangHoje), 'brl')}<span>${d.sangrias.length} retirada(s)</span></div>
      <button class="numero" style="text-align:left;cursor:pointer" onclick="S.adm.tab='pedidos';render()"><small>Pedidos aguardando</small>${numVivo('pend', d.pendentes)}<span>${d.pendentes?'toque para responder':'tudo respondido'}</span></button>
      <button class="numero" style="text-align:left;cursor:pointer" onclick="S.adm.tab='mural';render()"><small>Avisos sem leitura</small>${numVivo('nl', naoLidos)}<span>${d.avisos.length} aviso(s) ativo(s)</span></button>
    </div>
    <div class="grade-vivo">${lojas}</div>
    <h2 class="secao">Linha do tempo de hoje <small>${eventos.length} registro(s)</small></h2>
    <div class="linha-tempo">${eventos.slice(0,18).map(e=>`<div class="${novos.some(n=>n.k===e.k)?'novo':''}"><span class="num">${esc(e.h)}</span><i class="ti ${e.i}"></i><span class="cresce">${esc(e.t)}</span>${e.l&&d.lojas[e.l]?`<small class="apagado">${esc(d.lojas[e.l].nome)}</small>`:''}</div>`).join('') || '<p class="apagado">Nada registrado hoje ainda.</p>'}</div>
  </div>`;
}

/* ──────────── PRODUTIVIDADE ──────────── */
function metricas(dias){
  const d = S.adm.dados, hoje = d.hoje, ini = addDays(hoje, -(dias-1)), tol = d.regras.tolerancia_min || 10;
  const dentro = s => s && s >= ini && s <= hoje;
  const avisos = (d.calendario?.eventos||[]).filter(e=>e.tipo==='aviso' && dentro(e.data));
  return d.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>{
    const pts = d.pontos.filter(p=>p.colaboradora_id===c.id && dentro(p.data) && p.entrada);
    const vendas = d.vendas.filter(v=>v.colaboradora_id===c.id && dentro(v.data));
    const total = vendas.reduce((s,v)=>s+Number(v.valor||0),0);
    let comEscala = 0, atrasos = 0, minAtraso = 0; const listaAtrasos = [];
    pts.forEach(p=>{ const e = (d.escala||[]).find(x=>x.colaboradora_id===c.id && x.data===p.data); if(!e) return;
      const i0 = inicioTurno(e.loja, e.turno==='dia'?'abertura':e.turno, d.turnos); if(i0==null) return;
      comEscala++; const atr = toM(p.entrada) - i0; if(atr > tol){ atrasos++; minAtraso += atr; listaAtrasos.push({data:p.data, min:atr}); } });
    const horas = pts.reduce((s,p)=>s+(trab(p)||0),0);
    const fts = (d.checklist?.feitos||[]).filter(f=>f.colaboradora_id===c.id && dentro(f.data)), chk = fts.length;
    const diasAtivos = new Set(pts.map(p=>p.data).concat(fts.map(f=>f.data))).size;
    const lidos = avisos.filter(a=>lido('aviso', a.id, c.id, d.leituras)).length;
    const tr = progressoTrilha(c.id, d);
    return {c, dias:pts.length, total, vendas, horas, comEscala, atrasos, minAtraso, listaAtrasos, pont: comEscala ? Math.round((1-atrasos/comEscala)*100) : null,
            chk, chkDia: diasAtivos ? chk/diasAtivos : 0, avisos:avisos.length, lidos, trilha:tr};
  });
}
function admProdutividade(){
  const dias = S.adm.prodDias || 15, ordem = S.adm.prodOrdem || 'total', M = metricas(dias);
  const chave = {total:m=>m.total, pont:m=>m.pont??-1, chk:m=>m.chkDia, horas:m=>m.horas};
  M.sort((a,b)=>chave[ordem](b)-chave[ordem](a));
  const top = (f, ok) => { const l = M.filter(ok||(()=>true)).sort((a,b)=>f(b)-f(a))[0]; return l; };
  const tv = top(m=>m.total, m=>m.total>0), tp = top(m=>m.pont??-1, m=>m.comEscala>=2), tc = top(m=>m.chkDia, m=>m.chk>0);
  const dest = (ico, t, m, v) => `<div class="numero"><small>${ico} ${t}</small><b style="font-size:20px">${m?esc(primeiroNome(m.c.nome)):'—'}</b><span>${m?v(m):'sem dados no período'}</span></div>`;
  const col = (k, n) => `<th><button class="ord ${ordem===k?'on':''}" onclick="S.adm.prodOrdem='${k}';render()">${n}${ordem===k?' ↓':''}</button></th>`;
  return `<div class="linha quebra" style="gap:8px;margin-bottom:12px"><div class="abas" style="flex:0 0 auto">${[7,15,30].map(n=>`<button class="aba ${dias===n?'on':''}" onclick="S.adm.prodDias=${n};render()">${n} dias</button>`).join('')}</div>
      <span class="apagado" style="font-size:13px">${ddmm(addDays(S.adm.dados.hoje,-(dias-1)))} a ${ddmm(S.adm.dados.hoje)}</span></div>
    <div class="numeros" style="margin-bottom:12px">${dest('💰','Mais vendeu', tv, m=>brl(m.total))}${dest('⏰','Mais pontual', tp, m=>m.pont+'% dos dias no horário')}${dest('✅','Checklist mais completo', tc, m=>m.chkDia.toFixed(1)+' itens por dia')}</div>
    <div class="tabela"><table><thead><tr><th>#</th><th>Colaboradora</th>${col('total','Vendas')}<th>Dias</th>${col('horas','Horas')}${col('pont','Pontualidade')}${col('chk','Checklist/dia')}<th>Avisos lidos</th><th>Treinamento</th></tr></thead><tbody>
    ${M.map((m,i)=>`<tr class="clica" onclick="fichaProd('${m.c.id}')"><td class="apagado">${i+1}</td><td><span class="ponto" style="background:${esc(m.c.cor)}"></span> ${esc(primeiroNome(m.c.nome))}</td>
      <td class="n num"><b>${brl(m.total)}</b></td><td class="n">${m.dias}</td><td class="n num">${hm(m.horas)}</td>
      <td class="n">${m.pont==null?'<span class="apagado">sem escala</span>':`<span class="${m.pont>=90?'pos':m.pont<70?'neg':''}">${m.pont}%</span>${m.atrasos?` <small class="apagado">${m.atrasos} atraso(s)</small>`:''}`}</td>
      <td class="n num">${m.chkDia.toFixed(1)}</td><td class="n">${m.avisos?m.lidos+'/'+m.avisos:'—'}</td><td class="n">${m.trilha.total?m.trilha.pct+'%':'—'}</td></tr>`).join('')}
    </tbody></table></div>
    <h2 class="secao">Cobertura das lojas <small>média de pessoas trabalhando por hora</small></h2>
    ${Object.entries(S.adm.dados.lojas).map(([k,l])=>mapaCobertura(k, l, dias)).join('')}
    <div class="nota info" style="margin-top:12px"><i class="ti ti-info-circle"></i><div>Pontualidade compara a entrada com o início do turno da <b>Escala</b> (tolerância de ${S.adm.dados.regras.tolerancia_min} min). Vendas vêm do que é lançado no portal. Toque numa linha para ver a ficha.</div></div>`;
}
function mapaCobertura(loja, l, dias){
  const d = S.adm.dados, hoje = d.hoje, h0 = Math.floor(toM(l.abre)/60), h1 = Math.ceil(toM(l.fecha)/60);
  const datas = Array.from({length:dias},(_,i)=>addDays(hoje,-i)).filter(x=>dow(x)!==0 && !d.regras.feriados.includes(x));
  const horas = Array.from({length:h1-h0},(_,i)=>h0+i), soma = {}, cont = {};
  datas.forEach(x=>{ const w = dow(x); cont[w] = (cont[w]||0)+1;
    d.pontos.filter(p=>p.data===x && p.loja===loja && p.entrada).forEach(p=>{
      const fim = p.saida ? toM(p.saida) : (x===hoje ? toM(d.hora) : toM(p.entrada));
      horas.forEach(h=>{ const a = h*60+30; let dentro = a>=toM(p.entrada) && a<fim;
        if(p.saida_almoco && p.volta_almoco && a>=toM(p.saida_almoco) && a<toM(p.volta_almoco)) dentro = false;
        if(dentro) soma[w+'|'+h] = (soma[w+'|'+h]||0)+1; }); }); });
  const nomes = ['','seg','ter','qua','qui','sex','sáb'];
  return `<div class="cartao pad" style="margin-bottom:10px;overflow-x:auto"><b>Loja ${esc(l.nome)}</b>
    <div class="calor" style="grid-template-columns:40px repeat(${horas.length},minmax(30px,1fr))"><span></span>${horas.map(h=>`<small>${h}h</small>`).join('')}
    ${[1,2,3,4,5,6].map(w=>`<small>${nomes[w]}</small>${horas.map(h=>{ const v = cont[w] ? (soma[w+'|'+h]||0)/cont[w] : 0; return `<span class="${v===0?'zero':''}" style="--a:${Math.min(1,v/2.5)}" title="${nomes[w]} ${h}h: ${v.toFixed(1)} pessoa(s)">${v?v.toFixed(1).replace('.0',''):''}</span>`; }).join('')}`).join('')}</div></div>`;
}
function fichaProd(eid){
  const m = metricas(S.adm.prodDias || 15).find(x=>x.c.id===eid); if(!m) return;
  const dias = S.adm.prodDias || 15, hoje = S.adm.dados.hoje;
  const serie = Array.from({length:dias},(_,i)=>{ const x = addDays(hoje, -(dias-1-i)); return {x, v:m.vendas.filter(v=>v.data===x).reduce((s,v)=>s+Number(v.valor||0),0)}; });
  const max = Math.max(1, ...serie.map(s=>s.v)), comV = serie.filter(s=>s.v>0), media = comV.length ? comV.reduce((s,x)=>s+x.v,0)/comV.length : 0;
  const W = 560, H = 160, bw = W/serie.length;
  const svg = `<svg viewBox="0 0 ${W} ${H+18}" class="grafico">${serie.map((s,i)=>`<rect x="${i*bw+2}" y="${H-s.v/max*H}" width="${bw-4}" height="${s.v/max*H}" rx="3"><title>${ddmm(s.x)}: ${brl(s.v)}</title></rect>${i%Math.ceil(serie.length/8)===0?`<text x="${i*bw+bw/2}" y="${H+14}">${ddmm(s.x)}</text>`:''}`).join('')}
    ${media?`<line x1="0" x2="${W}" y1="${H-media/max*H}" y2="${H-media/max*H}" class="media"/><text x="${W-4}" y="${H-media/max*H-4}" class="rot">média ${brl(media)}</text>`:''}</svg>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><span class="avatar" style="background:${esc(m.c.cor)};width:44px;height:44px;font-size:15px">${esc(iniciais(m.c.nome))}</span><div class="cresce"><h3>${esc(m.c.nome)}</h3><div class="apagado" style="font-size:13px">Últimos ${dias} dias</div></div><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="numeros">${num('Vendas', brl(m.total), comV.length+' dia(s) com venda')}${num('Horas', hm(m.horas), m.dias+' dia(s) trabalhados')}${num('Pontualidade', m.pont==null?'—':m.pont+'%', m.atrasos?m.atrasos+' atraso(s), '+m.minAtraso+' min no total':'sem atrasos')}${num('Checklist', String(m.chk), m.chkDia.toFixed(1)+' por dia')}</div>
      <h2 class="secao">Vendas por dia</h2>${svg}
      ${m.listaAtrasos.length?`<h2 class="secao">Atrasos</h2><div class="linha quebra" style="gap:6px">${m.listaAtrasos.map(a=>`<span class="selo warn">${ddmm(a.data)} · ${a.min} min</span>`).join('')}</div>`:''}
      <h2 class="secao">Treinamento e avisos</h2><p class="suave">Trilha: <b>${m.trilha.feitos}/${m.trilha.total}</b> passos · Avisos do período lidos: <b>${m.lidos}/${m.avisos}</b></p>
    </div></div></div>`;
}

/* ──────────── MURAL (admin) ──────────── */
function novoAviso(){ editarEvento(); EV.tipo='aviso'; EV.data=S.adm.dados.hoje; renderEvento(); }
function admMural(){
  const d = S.adm.dados, ativas = d.colaboradoras.filter(c=>c.ativa==='SIM');
  const avisos = (d.calendario?.eventos||[]).filter(e=>e.tipo==='aviso').sort((a,b)=>b.data.localeCompare(a.data)).slice(0,30);
  return `<button class="btn pri" style="margin-bottom:12px" onclick="novoAviso()"><i class="ti ti-speakerphone"></i> Novo aviso</button>
    <div class="nota info" style="margin-bottom:12px"><i class="ti ti-info-circle"></i><div>Cada colaboradora vê o aviso no portal e no computador da loja e toca em <b>Li e entendi</b>. Aqui você vê quem já leu e cobra quem não leu.</div></div>
    ${avisos.map(e=>{ const leram = ativas.filter(c=>lido('aviso', e.id, c.id, d.leituras)), falta = ativas.filter(c=>!leram.includes(c));
      return `<div class="cartao pad" style="margin-bottom:10px"><div class="linha entre quebra"><b>📌 ${esc(e.titulo)}</b><span class="selo ${falta.length?'warn':'ok'}">${leram.length}/${ativas.length} leram</span></div>
        ${e.obs?`<p class="suave" style="font-size:14px;margin-top:4px;white-space:pre-line">${esc(e.obs)}</p>`:''}
        <div class="linha quebra" style="gap:6px;margin-top:10px">${leram.map(c=>{ const l = lido('aviso', e.id, c.id, d.leituras); return `<span class="selo ok" title="${quando(l.lido_em)}"><i class="ti ti-checks"></i> ${esc(primeiroNome(c.nome))} · ${quando(l.lido_em)}</span>`; }).join('')}
          ${falta.map(c=>`<button class="selo warn" style="cursor:pointer" onclick="cobrarLeitura('${e.id}','${c.id}')"><i class="ti ti-brand-whatsapp"></i> ${esc(primeiroNome(c.nome))} não leu</button>`).join('')}</div>
        <div class="linha" style="gap:6px;margin-top:10px"><span class="apagado cresce" style="font-size:12.5px">Publicado ${ddmm(e.data)}${e.data_fim&&e.data_fim!==e.data?' · até '+ddmm(e.data_fim):''}</span><button class="btn p" onclick="editarEvento('${e.id}')"><i class="ti ti-pencil"></i> Editar</button></div></div>`; }).join('') || '<p class="suave">Nenhum aviso publicado ainda.</p>'}`;
}
function cobrarLeitura(aid, eid){
  const d = S.adm.dados, e = d.calendario.eventos.find(x=>x.id===aid), c = d.colaboradoras.find(x=>x.id===eid);
  const msg = `📢 *Aviso novo no portal*\n\nOi, ${primeiroNome(c.nome)}! Tem um aviso esperando a sua leitura:\n\n*${e.titulo}*\n\n_Abre o Portal Equipe Las Vegas e toca em "Li e entendi", tá?_ 💛`;
  const tel = telWa(c.telefone);
  if(tel) window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(msg), '_blank');
  else navigator.clipboard.writeText(msg).then(()=>toast(primeiroNome(c.nome)+' não tem WhatsApp cadastrado — mensagem copiada'), ()=>prompt('Copie:', msg));
}

/* ──────────── PROTOCOLOS (admin) ──────────── */
function admProtocolos(){
  const d = S.adm.dados, ps = d.protocolos||[], ativas = d.colaboradoras.filter(c=>c.ativa==='SIM');
  const rasc = ps.filter(p=>p.publicado!=='SIM');
  const temPop = ps.some(p=>/^pop-/.test(p.id));
  return `<div class="linha quebra" style="gap:8px;margin-bottom:12px">
      <button class="btn pri" onclick="admEditarProtocolo()"><i class="ti ti-plus"></i> Novo protocolo</button>
      ${!temPop?`<button class="btn ouro" id="btn-pop" onclick="importarPOP()"><i class="ti ti-file-import"></i> Importar o POP (versão 3.0)</button>`:''}
      ${rasc.length?`<button class="btn" onclick="publicarProtocolos(${JSON.stringify(rasc.map(p=>p.id)).replace(/"/g,'&quot;')})"><i class="ti ti-world-upload"></i> Publicar os ${rasc.length} rascunho(s)</button>`:''}</div>
    ${rasc.length?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-eye-off"></i><div><b>${rasc.length} rascunho(s)</b> só você vê. Revise (o POP 3.0 é de junho: confira nomes de responsáveis, horários e metas) e publique.</div></div>`:''}
    ${ps.length?ps.map(p=>{ const n = ativas.filter(c=>lido('protocolo', p.id, c.id, d.leituras)).length;
      return `<button class="pedido proto" onclick="admEditarProtocolo('${p.id}')"><div class="ico"><i class="ti ti-book"></i></div><div class="cresce"><b>${esc(p.ordem)}. ${esc(p.titulo)}</b><p>${esc(p.secao||'Geral')} · ${p.publicado==='SIM'?`${n}/${ativas.length} leram`:'rascunho'}</p></div>${p.publicado==='SIM'?'<span class="selo ok">Publicado</span>':'<span class="selo">Rascunho</span>'}</button>`; }).join('')
      :'<p class="suave">Nenhum protocolo ainda. Importe o POP ou crie o primeiro.</p>'}`;
}
async function importarPOP(){
  const b = $('#btn-pop'); if(b){ b.disabled = true; b.innerHTML = '<span class="gira"></span> Importando…'; }
  try{
    const j = await (await fetch('protocolos-pop.json?v=5')).json();
    S.adm.dados = await api('admProtocolos', {...S.adm.cred, itens:j.itens}); render(); toast(j.itens.length+' protocolos importados como rascunho ✔ Revise e publique.');
  }catch(e){ toast('Não consegui importar: '+e.message, true); if(b){ b.disabled=false; b.innerHTML='Tentar de novo'; } }
}
async function publicarProtocolos(ids){
  if(!confirm(ids.length+' protocolo(s) vão aparecer para toda a equipe. Publicar?')) return;
  try{ S.adm.dados = await api('admProtocolos', {...S.adm.cred, publicar:ids}); render(); toast('Publicado ✔ A equipe já vê.'); }
  catch(e){ toast(e.message, true); }
}
let PR = null;
function admEditarProtocolo(id){
  const ps = S.adm.dados.protocolos||[], p = id ? ps.find(x=>x.id===id) : null;
  PR = p ? {...p, publicado:p.publicado==='SIM', ver:false} : {id:'', titulo:'', secao:'', ordem:String(ps.length+1), texto:'', publicado:true, ver:false};
  renderProtocolo();
}
function renderProtocolo(){
  const p = PR; if(!p){ $('#modal').innerHTML=''; return; }
  const secoes = [...new Set((S.adm.dados.protocolos||[]).map(x=>x.secao).filter(Boolean))];
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this){PR=null;renderProtocolo()}"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${p.id?'Editar protocolo':'Novo protocolo'}</h3><button class="icone" onclick="PR=null;renderProtocolo()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="campo"><label>Título</label><input class="inp" value="${esc(p.titulo)}" oninput="PR.titulo=this.value"></div>
      <div class="g2"><div class="campo"><label>Grupo</label><input class="inp" list="secoes" value="${esc(p.secao)}" oninput="PR.secao=this.value" placeholder="Ex.: Rotina da loja"><datalist id="secoes">${secoes.map(s=>`<option value="${esc(s)}">`).join('')}</datalist></div>
        <div class="campo"><label>Ordem</label><input class="inp num" value="${esc(p.ordem)}" oninput="PR.ordem=this.value"></div></div>
      <div class="linha entre" style="margin-bottom:6px"><label style="font-size:13px;font-weight:700;color:var(--creme2)">Texto</label><button class="btn p fantasma" onclick="PR.ver=!PR.ver;renderProtocolo()">${p.ver?'<i class="ti ti-pencil"></i> Editar':'<i class="ti ti-eye"></i> Ver como a equipe vê'}</button></div>
      ${p.ver?`<div class="leitura cartao pad" style="max-height:50vh;overflow:auto">${mdHTML(p.texto)}</div>`:`<textarea class="inp" style="min-height:300px;font-size:14px" oninput="PR.texto=this.value">${esc(p.texto)}</textarea>
      <p class="apagado" style="font-size:12px;margin-top:4px"><b>### Título</b> vira subtítulo · <b>- item</b> vira lista · <b>1. item</b> vira passo numerado · <b>**texto**</b> em negrito</p>`}
      <label class="linha" style="margin:12px 0;font-weight:700"><input type="checkbox" ${p.publicado?'checked':''} onchange="PR.publicado=this.checked" style="width:18px;height:18px"> Publicado (a equipe vê)</label>
      <div class="linha" style="gap:8px"><button class="btn pri cresce" id="btn-pr" onclick="salvarProtocolo()"><i class="ti ti-device-floppy"></i> Salvar</button>${p.id?`<button class="btn" onclick="apagarProtocolo()"><i class="ti ti-trash"></i></button>`:''}</div>
    </div></div></div>`;
}
async function salvarProtocolo(){
  const b = $('#btn-pr'); b.disabled = true;
  try{ S.adm.dados = await api('admProtocolo', {...S.adm.cred, id:PR.id||undefined, titulo:PR.titulo, secao:PR.secao, ordem:PR.ordem, texto:PR.texto, publicado:PR.publicado}); PR=null; renderProtocolo(); render(); toast('Protocolo salvo ✔'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}
async function apagarProtocolo(){
  if(!confirm('Apagar este protocolo?')) return;
  try{ S.adm.dados = await api('admProtocolo', {...S.adm.cred, id:PR.id, apagar:true}); PR=null; renderProtocolo(); render(); toast('Apagado'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── TREINAMENTO (admin) ──────────── */
let TR = null;
function admTreino(){
  const d = S.adm.dados, t = d.trilha||[], ativas = d.colaboradoras.filter(c=>c.ativa==='SIM');
  if(!TR) TR = JSON.parse(JSON.stringify(t));
  const protos = d.protocolos||[];
  return `<h2 class="secao" style="margin-top:0">Progresso da equipe</h2>
    <div class="grade-trilha">${ativas.map(c=>{ const p = progressoTrilha(c.id, d); const prox = t.find(x=>!lido('trilha', x.id, c.id, d.leituras));
      return `<div class="cartao pad linha" style="gap:12px">${anel(p.pct, p.pct+'%', '', 64)}<div class="cresce"><b>${esc(primeiroNome(c.nome))}</b><p class="apagado" style="font-size:13px">${p.pct===100?'Concluiu a trilha 🎉':prox?'Próximo: '+esc(prox.titulo):'—'}</p></div></div>`; }).join('')}</div>
    <h2 class="secao">Passos da trilha <small>na ordem em que a pessoa faz</small></h2>
    <div style="display:flex;flex-direction:column;gap:6px">${TR.map((x,i)=>`<div class="cartao pad passo-ed"><span class="marco">${i+1}</span>
      <input class="inp" value="${esc(x.titulo)}" placeholder="Título do passo" oninput="TR[${i}].titulo=this.value">
      <input class="inp" value="${esc(x.texto||'')}" placeholder="Explicação curta" oninput="TR[${i}].texto=this.value">
      <select class="inp" onchange="TR[${i}].protocolo=this.value"><option value="">Sem protocolo</option>${protos.map(p=>`<option value="${p.id}" ${x.protocolo===p.id?'selected':''}>${esc(p.titulo)}</option>`).join('')}</select>
      <input class="inp" value="${esc(x.link||'')}" placeholder="Link (opcional)" oninput="TR[${i}].link=this.value">
      <div class="linha" style="gap:4px"><button class="icone" title="Subir" onclick="moverPasso(${i},-1)"><i class="ti ti-arrow-up"></i></button><button class="icone" title="Apagar" onclick="TR.splice(${i},1);render()"><i class="ti ti-trash"></i></button></div></div>`).join('')}</div>
    <div class="linha" style="gap:8px;margin-top:10px"><button class="btn" onclick="TR.push({id:'t'+Date.now().toString(36),titulo:'',texto:''});render()"><i class="ti ti-plus"></i> Novo passo</button><button class="btn pri" onclick="salvarTrilha()"><i class="ti ti-device-floppy"></i> Salvar trilha</button></div>`;
}
function moverPasso(i, n){ const j = i+n; if(j<0 || j>=TR.length) return; [TR[i], TR[j]] = [TR[j], TR[i]]; render(); }
async function salvarTrilha(){
  const t = TR.filter(x=>x.titulo.trim()).map(x=>({id:x.id||('t'+Date.now().toString(36)), titulo:x.titulo.trim(), texto:(x.texto||'').trim(), protocolo:x.protocolo||'', link:(x.link||'').trim()}));
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'trilha', valor:JSON.stringify(t)}); TR=null; render(); toast('Trilha salva ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── ATALHOS (admin) ──────────── */
function atalhosParaTexto(g){ return g.map(x=>`${x.so_admin?'#!':'#'} ${x.grupo}\n`+(x.itens||[]).map(a=>`${a.destaque?'* ':''}${a.nome} | ${a.url}${a.obs?' | '+a.obs:''}`).join('\n')).join('\n\n'); }
function textoParaAtalhos(t){
  const g = []; let cur = null;
  t.split('\n').forEach(l=>{ const s = l.trim(); if(!s) return;
    const m = s.match(/^#(!?)\s*(.+)/);
    if(m){ cur = {grupo:m[2].trim(), itens:[]}; if(m[1]) cur.so_admin = true; g.push(cur); return; }
    const dest = s.startsWith('*'), p = s.replace(/^\*\s*/,'').split('|').map(x=>x.trim());
    if(p.length<2 || !/^https?:\/\//.test(p[1])) return;
    if(!cur){ cur = {grupo:'Atalhos', itens:[]}; g.push(cur); }
    const a = {nome:p[0], url:p[1], obs:p[2]||''}; if(dest) a.destaque = true; cur.itens.push(a); });
  return g.filter(x=>x.itens.length);
}
function admAtalhos(){
  const g = S.adm.dados.atalhos||[];
  return `${gradeAtalhos(g)}
    <h2 class="secao">Editar atalhos</h2>
    <div class="cartao pad"><p class="suave" style="font-size:13.5px;margin-bottom:8px"><b># Grupo</b> abre um grupo · <b>#! Grupo</b> = só a administração vê · uma linha por atalho: <b>Nome | link | observação</b> · comece com <b>*</b> para destacar no topo.</p>
      <textarea class="inp" id="atalhos-txt" style="min-height:260px;font-size:13.5px;font-family:ui-monospace,monospace">${esc(atalhosParaTexto(g))}</textarea>
      <button class="btn pri" style="margin-top:10px" onclick="salvarAtalhos()"><i class="ti ti-device-floppy"></i> Salvar atalhos</button></div>`;
}
async function salvarAtalhos(){
  const g = textoParaAtalhos($('#atalhos-txt').value);
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'atalhos', valor:JSON.stringify(g)}); render(); toast('Atalhos salvos ✔'); }
  catch(e){ toast(e.message, true); }
}
