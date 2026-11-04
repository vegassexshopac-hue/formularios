/* ═══════════ v42 (arquivo app42.js): Painel da loja + Produtividade da equipe (estilo do painel do escritório) ═══════════
   Pedido da Madu (03/11/2026): trazer para o Portal Equipe o que couber dos prints do painel do escritório —
   gráficos, layout mais organizado, fácil de ler para a administração; Matheus com detalhe muito maior.
   • Administração › Início › Ao vivo → "Painel da loja": 6 cartões (trabalhando agora, vendido hoje, clientes esperando,
     tarefas vencidas, mensagens hoje, avisos sem leitura), Pulso do dia (por hora), Resposta no prazo (velocímetro),
     Movimentos no funil, Semana no funil, Linha do dia da equipe e Histórico de hoje por pessoa; Modo TV.
   • Equipe e ponto › Produtividade → cartões por período, ranking com abas (Índice · Vendas · Resposta · Tarefas ·
     Tempo ativo · Mensagens · Pontualidade · Checklist), Destaques, "Quando a equipe trabalha" (mapa de calor) e
     "Resposta aos clientes". Perfil Matheus: Configurar (pesos do índice), paradas e tabela completa.
   • Os dados vêm da planilha (ponto, PDV, checklist, mural) e do motor da Kommo (/api/painel — mensagens, tarefas,
     etapas, tempo de resposta). Sem o motor novo o painel continua só com a parte da loja.
   • Para voltar ao painel antigo: tirar a linha do app42 no app9.js. */

const P41 = { k:null, kt:0, kErro:'', kProm:null, filtro:'equipe', prod:null, prodT:0, prodDias:0, prodProm:null, aba:'indice', tabela:false, tv:false, parada:15 };
const TZ41 = 'America/Rio_Branco';
const _fmt41 = new Intl.DateTimeFormat('pt-BR', {timeZone:TZ41, hour:'2-digit', minute:'2-digit', hour12:false});
const hhmm41 = t => _fmt41.format(new Date(t));
const min41 = t => toM(hhmm41(t));
const norm41 = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const matheus41 = () => typeof perfil29==='function' && perfil29()==='matheus';
const hmCurto41 = m => { m = Math.round(m||0); return m<60 ? m+' min' : Math.floor(m/60)+'h'+String(m%60).padStart(2,'0'); };
const seg41 = s => s==null ? '—' : s<60 ? s+' s' : s<3600 ? Math.round(s/60)+' min' : (s/3600).toFixed(1).replace('.0','')+' h';
const pct41 = (a,b) => b ? Math.round(100*a/b) : 0;
const avatar41 = (c, tam) => c ? avatar(c, '', tam||28) : `<span class="lob-av" style="--cor:#999;width:${tam||28}px;height:${tam||28}px">?</span>`;

/* ───────── motor da Kommo: /api/painel ───────── */
async function p41Kommo(dias, forcar, prod){
  if(typeof kmApi!=='function' || !S.adm) return null;
  const cache = prod ? 'prod' : 'k', tCache = prod ? 'prodT' : 'kt', pk = prod ? 'prodProm' : 'kProm';
  if(!forcar && P41[cache] && Date.now()-P41[tCache] < 15e3 && (!prod || P41.prodDias===dias)) return P41[cache];
  if(P41[pk]) return P41[pk];
  P41[pk] = (async()=>{ try{ const r = await kmApi('/api/painel?dias='+dias); P41[cache] = r; P41[tCache] = Date.now(); P41.kErro = ''; if(prod) P41.prodDias = dias; return r; }
    catch(e){ P41.kErro = /Não encontrado|404/.test(e.message) ? 'motor antigo' : e.message; if(prod) P41.prodDias = dias; return P41[cache]; }
    finally{ P41[pk] = null; } })();
  return P41[pk];
}
/* pessoas ativas + atendente da Kommo correspondente (pelo vínculo do motor ou pelo primeiro nome) */
function p41Pessoas(k){
  const d = S.adm.dados, ats = (k && k.atendentes) || [];
  return d.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>{
    const a = ats.find(x=>x.eid===c.id) || ats.find(x=>norm41(primeiroNome(x.nome))===norm41(primeiroNome(c.nome)));
    return {c, id:c.id, nome:primeiroNome(c.nome), at:a ? a.id : null};
  });
}
const p41Dia = (c) => (AOV.d?.pontos||[]).find(p=>p.colaboradora_id===c.id) || null;

/* ações de hoje de uma pessoa: ponto + PDV + checklist (planilha) e Kommo (motor). {m:minuto, t:'ponto|venda|chk|msg|tarefa|etapa|lead', txt, ic, link} */
function p41AcoesHoje(p, k){
  const d = AOV.d, L = [];
  if(d){
    const r = p41Dia(p.c);
    if(r) CAMPOS.forEach(f=>{ if(r[f]) L.push({m:toM(r[f]), t:'ponto', txt:`bateu ${CURTO[f].toLowerCase()}`, ic:ICO[f]}); });
    (d.vendas||[]).filter(v=>v.data===d.hoje && v.colaboradora_id===p.id).forEach(v=>L.push({m:toM(String(v.lancado_em||'').slice(11,16))??0, t:'venda', txt:`lançou venda de ${brl(v.valor)}${v.origem==='kommo'?' · pela Kommo':''}`, ic:'ti-shopping-bag', v:Number(v.valor)||0}));
    (d.checklist?.feitos||[]).filter(f=>f.colaboradora_id===p.id).forEach(f=>{ const it = (d.checklist.itens||[]).find(i=>i.id===f.item_id); L.push({m:toM(f.hora)??0, t:'chk', txt:`✓ ${it?it.texto:'item do checklist'}`, ic:'ti-checklist'}); });
    (d.sangrias||[]).filter(s=>norm41(primeiroNome(s.tirou))===norm41(p.nome)).forEach(s=>L.push({m:toM(s.hora)??0, t:'sangria', txt:`registrou sangria de ${brl2(s.valor)}`, ic:'ti-cash-banknote'}));
  }
  if(k && p.at!=null) (k.hojeDados?.acoes||[]).filter(a=>a.at===p.at).forEach(a=>{
    const nome = a.nome || 'cliente', m = min41(a.t);
    if(a.tipo==='msg') L.push({m, t:'msg', txt:`enviou mensagem para ${nome}`, ic:'ti-send', link:a.link, canal:a.canal});
    else if(a.tipo==='tarefa') L.push({m, t:'tarefa', txt:`concluiu uma tarefa em ${nome}`, ic:'ti-circle-check', link:a.link});
    else if(a.tipo==='etapa') L.push({m, t:'etapa', txt:`moveu ${nome}: ${a.de||'?'} → ${a.para||'?'}`, ic:'ti-arrow-right', link:a.link});
    else if(a.tipo==='lead') L.push({m, t:'lead', txt:`cliente nova: ${nome}`, ic:'ti-user-plus', link:a.link});
  });
  return L.filter(x=>x.m!=null).sort((a,b)=>a.m-b.m);
}
/* trechos trabalhados de hoje pelo ponto [{a,b}] em minutos (b = agora se ainda não saiu) */
function p41Trechos(r, agora){
  if(!r || !r.entrada) return [];
  const fim = r.saida ? toM(r.saida) : agora, T = [];
  let ini = toM(r.entrada);
  const pausas = [[r.saida_almoco, r.volta_almoco], [r.inicio_pausa, r.fim_pausa]].filter(x=>x[0]).map(x=>[toM(x[0]), x[1] ? toM(x[1]) : fim]).sort((x,y)=>x[0]-y[0]);
  pausas.forEach(([a,b])=>{ if(a>ini) T.push({a:ini, b:Math.min(a, fim)}); ini = Math.max(ini, b); });
  if(ini < fim) T.push({a:ini, b:fim});
  return T.filter(t=>t.b>t.a);
}
/* paradas: dentro do trecho trabalhado, mais de P41.parada min sem nenhuma ação (ponto, PDV, checklist, Kommo) */
function p41Paradas(trechos, acoes, agora){
  const P = [], ms = acoes.map(a=>a.m).sort((a,b)=>a-b);
  trechos.forEach(t=>{ const pts = [t.a, ...ms.filter(m=>m>t.a && m<t.b), t.b];
    for(let i=1;i<pts.length;i++){ const gap = pts[i]-pts[i-1]; if(gap >= P41.parada) P.push({a:pts[i-1], b:pts[i], agora: pts[i]===t.b && t.b===agora}); } });
  return P;
}
const p41Range = () => { const L = Object.values(S.adm.dados.lojas||{}); const h0 = Math.min(6, ...L.map(l=>Math.floor(toM(l.abre)/60))), h1 = Math.max(21, ...L.map(l=>Math.ceil(toM(l.fecha)/60)+1)); return {h0, h1:Math.min(24,h1)}; };

/* ───────── painel da loja (Ao vivo) ───────── */
function p41Spark(vals, cor){
  const max = Math.max(1, ...vals), w = 90, h = 26, n = vals.length;
  const pts = vals.map((v,i)=>[(i/(n-1))*w, h-2-(v/max)*(h-6)]);
  const path = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg class="p41-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${path}" fill="none" stroke="${cor||'var(--creme3)'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts[n-1][0]}" cy="${pts[n-1][1]}" r="2.4" fill="${cor||'var(--vermelho)'}"/></svg>`;
}
function p41Card(opts){
  const {ic, num, txt, chips, spark, vermelho, oc, sub, k} = opts;
  return `<${oc?'button':'div'} class="p41-card ${vermelho?'alerta':''}" ${oc?`onclick="${oc}"`:''} style="--k:${k||0}">
    <div class="p41-card-t"><span class="ic"><i class="ti ${ic}"></i></span>${oc?'<small>detalhes <i class="ti ti-chevron-right"></i></small>':''}</div>
    <b class="num p41-big">${num}</b><span class="p41-lbl">${txt}</span>
    ${spark||''}
    ${chips&&chips.length ? `<div class="p41-chips">${chips.map(x=>`<span class="p41-chip ${x.zero?'zero':''}">${x.av||''}<span>${esc(x.n)}</span><b>${x.v}</b></span>`).join('')}</div>` : sub?`<small class="p41-sub">${sub}</small>`:''}
  </${oc?'button':'div'}>`;
}
function p41Serie(p, k, h0, h1){
  const arr = Array(24).fill(0);
  p41AcoesHoje(p, k).forEach(a=>{ arr[Math.floor(a.m/60)]++; });
  return arr.slice(h0, h1+1);
}
function p41Pulso(pessoas, k, agora){
  const {h0, h1} = p41Range(), n = h1-h0+1;
  const series = pessoas.map(p=>({p, v:p41Serie(p, k, h0, h1)}));
  const equipe = Array.from({length:n},(_,i)=>series.reduce((s,x)=>s+x.v[i],0));
  const sel = P41.filtro==='equipe' ? null : series.find(x=>x.p.id===P41.filtro);
  const max = Math.max(1, ...equipe), W = 720, H = 150, px = i => 18 + (i/(n-1))*(W-36), py = v => H-4-(v/max)*(H-24);
  const curva = (vals, fechar) => { const P = vals.map((v,i)=>[px(i), py(v)]); let d = `M${P[0][0]} ${P[0][1]}`;
    for(let i=0;i<P.length-1;i++){ const [x0,y0]=P[i],[x1,y1]=P[i+1], c=(x1-x0)/2; d += ` C${x0+c} ${y0} ${x1-c} ${y1} ${x1} ${y1}`; }
    return fechar ? d+` L${P[P.length-1][0]} ${H} L${P[0][0]} ${H} Z` : d; };
  const pico = equipe.indexOf(Math.max(...equipe)), total = equipe.reduce((a,b)=>a+b,0);
  const agoraX = Math.max(0, Math.min(W, px((agora/60)-h0)));
  const ult15 = pessoas.reduce((s,p)=>s+p41AcoesHoje(p,k).filter(a=>a.m>agora-15&&a.m<=agora).length,0), ult60 = pessoas.reduce((s,p)=>s+p41AcoesHoje(p,k).filter(a=>a.m>agora-60&&a.m<=agora).length,0);
  const chips = [{id:'equipe', n:'Equipe', av:''}].concat(pessoas.map(p=>({id:p.id, n:p.nome, av:avatar41(p.c, 22)})));
  return `<section class="p41-bloco p41-pulso">
    <div class="p41-bloco-t"><h3>Pulso do dia</h3><span class="p41-vivo"><i></i>ao vivo</span></div>
    <div class="p41-filtros">${chips.map(x=>`<button class="${P41.filtro===x.id?'on':''}" onclick="P41.filtro='${x.id}';p41Repintar()">${x.av}${esc(x.n)}</button>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H+22}" class="p41-grafico">
      ${Array.from({length:n},(_,i)=>i%3===0?`<text x="${px(i)}" y="${H+16}" text-anchor="middle">${h0+i}h</text>`:'').join('')}
      <path d="${curva(equipe, true)}" class="area eq"/><path d="${curva(equipe)}" class="linha eq"/>
      ${sel ? `<path d="${curva(sel.v, true)}" class="area sel" style="--c:${esc(sel.p.c.cor)}"/><path d="${curva(sel.v)}" class="linha sel" style="--c:${esc(sel.p.c.cor)}"/>` : ''}
      ${total ? `<circle cx="${px(pico)}" cy="${py(equipe[pico])}" r="4" class="pico"/><text x="${px(pico)}" y="${Math.max(12, py(equipe[pico])-10)}" text-anchor="middle" class="rot">pico da equipe ${h0+pico}h (${equipe[pico]})</text>`:''}
      <line x1="${agoraX}" x2="${agoraX}" y1="0" y2="${H}" class="agora"/>
    </svg>
    <div class="p41-pulso-res"><span class="selo">${sel ? esc(sel.p.nome).toUpperCase() : 'EQUIPE TODA'}</span> <b>${ult15}</b> ações nos últimos 15 min · <b>${ult60}</b> na última hora · <b>${sel ? sel.v.reduce((a,b)=>a+b,0) : total}</b> hoje${total?` · pico <b>${h0+pico}h</b>`:''}</div>
  </section>`;
}
function p41Gauge(k){
  const r = k?.hojeDados?.respostas, pr = r && r.dentro!=null ? r.dentro : null;
  const ang = -90 + (pr==null?0:pr)*1.8, arco = (a0,a1,cls) => { const p = a => [100+86*Math.cos(a*Math.PI/180), 96+86*Math.sin(a*Math.PI/180)], A = p(a0), B = p(a1); return `<path d="M${A[0]} ${A[1]} A86 86 0 ${a1-a0>180?1:0} 1 ${B[0]} ${B[1]}" class="${cls}"/>`; };
  const d7 = (k?.hojeDados?.dias7||[]).map(x=>`<span class="p41-dia ${x.dentro==null?'vazio':x.dentro>=70?'ok':'ruim'}" title="${ddmm(x.data)}: ${x.dentro==null?'sem respostas':x.dentro+'% no prazo'}"><i></i><small>${'DSTQQSS'[dow(x.data)]}</small></span>`).join('');
  return `<section class="p41-bloco p41-gauge">
    <div class="p41-bloco-t"><h3>Resposta no prazo</h3></div>
    ${!k ? `<p class="suave p41-semkommo">Liga quando o motor da Kommo responder.</p>` : `
    <svg viewBox="0 0 200 120" class="p41-vel">${arco(-180, 0, 'trilho')}${pr!=null?arco(-180, -180+pr*1.8, 'cheio'):''}
      <g style="transform:rotate(${ang}deg);transform-origin:100px 96px"><path d="M100 96 L100 22" class="pont"/><circle cx="100" cy="96" r="6" class="eixo"/></g></svg>
    <b class="p41-pct ${pr==null?'':pr>=70?'ok':'ruim'}">${pr==null?'—':pr+'%'}</b><small>no prazo hoje</small>
    <p class="p41-gauge-l"><b>${r.n}</b> clientes respondidos · mediana <b>${seg41(r.mediana)}</b> · prazo <b>${k.prazoMin} min</b></p>
    <small class="p41-rot">ÚLTIMOS 7 DIAS</small><div class="p41-dias">${d7}</div>`}
  </section>`;
}
function p41Funil(pessoas, k){
  const mov = k?.funil?.movimentos||[], sem = k?.funil?.semana;
  const quem = at => pessoas.find(p=>p.at===at);
  const maxDia = Math.max(1, ...((sem?.porDia||[]).map(x=>x.n)));
  return `<section class="p41-bloco">
    <div class="p41-bloco-t"><h3>Movimentos no funil</h3><span class="selo">${mov.length} hoje</span></div>
    <p class="suave" style="font-size:13px;margin:-4px 0 10px">Clientes que a equipe mudou de etapa hoje. Toque para abrir na Kommo.</p>
    ${!k ? '<p class="suave p41-semkommo">Precisa do motor da Kommo.</p>' : mov.length ? `<div class="p41-mov">${mov.map(m=>{ const p = quem(m.at);
      return `<a class="p41-mov-it" ${m.link?`href="${esc(m.link)}" target="_blank" rel="noopener"`:''}><b>${esc(m.nome)}</b><div class="linha" style="gap:8px;margin-top:4px">${avatar41(p?.c, 24)}<span class="p41-etapa">→ ${esc(m.para||'?')}</span></div><small>${p?esc(p.nome):'sem atendente'} · ${hhmm41(m.t)}${m.de?` · antes: ${esc(m.de)}`:''}</small></a>`; }).join('')}</div>` : '<p class="suave">Nenhuma mudança de etapa hoje ainda.</p>'}
  </section>
  <section class="p41-bloco">
    <div class="p41-bloco-t"><h3>Semana no funil</h3><button class="btn p" onclick="S.adm.tab='whats';KM.sub='funil';render()">Abrir funil <i class="ti ti-arrow-right"></i></button></div>
    <p class="suave" style="font-size:13px;margin:-4px 0 10px">Clientes que chegaram nos últimos 7 dias e onde estão agora.</p>
    ${!sem ? '<p class="suave p41-semkommo">Precisa do motor da Kommo.</p>' : `<div class="p41-barras">
      ${[['Chegaram', sem.chegaram, 'esc'],['Em atendimento', sem.emAtendimento, 'verm'],['Viraram venda', sem.ganhos, 'ok'],['Perdidas', sem.perdidos, 'cinza']].map(([n,v,c])=>`<div class="p41-barra"><span>${n}</span><div><i class="${c}" style="width:${pct41(v, sem.chegaram||1)}%"></i></div><b>${v}</b></div>`).join('')}</div>
      <p class="p41-conv"><b>${pct41(sem.ganhos, sem.chegaram)}%</b> das que chegaram nesta semana já viraram venda</p>
      <div class="p41-semana">${sem.porDia.map((x,i)=>`<div class="${i===sem.porDia.length-1?'hoje':''}"><small>${x.n}</small><i style="height:${Math.max(6, 60*x.n/maxDia)}px"></i><span>${['DOM','SEG','TER','QUA','QUI','SEX','SÁB'][dow(x.data)]}</span></div>`).join('')}</div>`}
  </section>`;
}
function p41Linha(pessoas, k, agora){
  const {h0, h1} = p41Range(), m0 = h0*60, m1 = h1*60, x = m => Math.max(0, Math.min(100, (m-m0)/(m1-m0)*100));
  const rows = pessoas.map(p=>{
    const r = p41Dia(p.c), A = p41AcoesHoje(p, k), T = p41Trechos(r, agora), par = matheus41() ? p41Paradas(T, A, agora) : [];
    const ult = A.length ? A[A.length-1] : null, st = statusPonto(r);
    const estado = !r?.entrada ? (st.t||'sem ponto hoje') : r.saida ? `saiu às ${r.saida} · ${hmCurto41(trab(r)||0)} ativa` : ult && agora-ult.m >= P41.parada ? `parada há ${hmCurto41(agora-ult.m)} · ${hmCurto41(T.reduce((s,t)=>s+t.b-t.a,0))} no ponto` : `ativa · ${hmCurto41(T.reduce((s,t)=>s+t.b-t.a,0))} no ponto`;
    return `<div class="p41-tl-row" onclick="p41Hist('${p.id}')" title="Ver o histórico de hoje">
      <div class="p41-tl-quem">${avatar41(p.c, 34)}<div><b>${esc(p.nome)}</b><small>${esc(estado)}</small></div></div>
      <div class="p41-tl-pista">
        ${T.map(t=>`<i class="trab" style="left:${x(t.a)}%;width:${x(t.b)-x(t.a)}%" title="${hm(t.a)}–${hm(t.b)} no ponto"></i>`).join('')}
        ${par.map(q=>`<i class="parada ${q.agora?'agora':''}" style="left:${x(q.a)}%;width:${x(q.b)-x(q.a)}%" title="parada ${hm(q.a)}–${hm(q.b)} (${hmCurto41(q.b-q.a)})"></i>`).join('')}
        ${A.map(a=>`<i class="ac ${a.t}" style="left:${x(a.m)}%" title="${hm(a.m)} · ${esc(a.txt)}"></i>`).join('')}
      </div></div>`; }).join('');
  const horas = []; for(let h=h0; h<=h1; h+=Math.ceil((h1-h0)/8)) horas.push(h);
  return `<section class="p41-bloco p41-tl">
    <div class="p41-bloco-t"><h3>Linha do dia da equipe</h3><span class="p41-vivo"><i></i>agora · ${hm(agora)}</span></div>
    <p class="suave" style="font-size:13px;margin:-4px 0 10px">Claro = no ponto · <span class="p41-lg msg"></span> Kommo · <span class="p41-lg venda"></span> venda no PDV · <span class="p41-lg chk"></span> checklist · <span class="p41-lg ponto"></span> ponto${matheus41()?' · <span class="p41-lg parada"></span> parada (mais de '+P41.parada+' min sem ação)':''}. Toque numa pessoa para o histórico completo.</p>
    <div class="p41-tl-row cab"><div></div><div class="p41-tl-pista eixo">${horas.map(h=>`<small style="left:${x(h*60)}%">${h}h</small>`).join('')}<i class="agora" style="left:${x(agora)}%"></i></div></div>
    ${rows || '<p class="suave">Ninguém ativa cadastrada.</p>'}
  </section>`;
}
function p41Hist(eid){
  const k = P41.k, agora = toM(AOV.d?.hora||'12:00'), p = p41Pessoas(k).find(x=>x.id===eid); if(!p) return;
  const A = p41AcoesHoje(p, k), r = p41Dia(p.c), T = p41Trechos(r, agora), par = p41Paradas(T, A, agora);
  const n = t => A.filter(a=>a.t===t).length, vendas = A.filter(a=>a.t==='venda').reduce((s,a)=>s+a.v,0);
  const kr = k?.periodo?.respostas?.[String(p.at)], esp = k?.hojeDados?.esperando?.[String(p.at)]||0, venc = k?.hojeDados?.vencidas?.[String(p.at)]||0;
  const hoje = AOV.d?.hoje || hojeISO();
  const per = Array.from({length:12},(_,i)=>i+8).map(h=>A.filter(a=>Math.floor(a.m/60)===h).length), maxP = Math.max(1,...per);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo p41-modal">
    <div class="modal-t">${avatar41(p.c, 44)}<div class="cresce"><h3>${esc(p.c.nome)}</h3><div class="apagado" style="font-size:13px">${esc(p.c.cargo||'')}${p.c.cargo?' · ':''}${esc(dataLonga(hoje))}</div></div><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c p41-hist">
      <div class="p41-hist-lado">
        <div class="p41-hist-num"><b class="num">${hmCurto41(T.reduce((s,t)=>s+t.b-t.a,0))}</b><small>no ponto hoje${r?.entrada?` · desde ${r.entrada}`:''}</small></div>
        <div class="p41-mini-bar">${per.map((v,i)=>`<i style="height:${Math.max(3, 40*v/maxP)}px" title="${i+8}h: ${v}"></i>`).join('')}<small>8h</small><small style="right:0">19h</small></div>
        <div class="p41-tags">
          ${vendas?`<span class="ok">${brl(vendas)} vendido</span>`:''}<span>${n('msg')} mensagens</span><span>${n('tarefa')} tarefas concluídas</span><span>${n('chk')} itens do checklist</span>
          ${esp?`<span class="ruim">${esp} esperando agora</span>`:''}${venc?`<span class="ruim">${venc} tarefas vencidas</span>`:''}
          ${kr?`<span class="${kr.dentro>=70?'ok':'warn'}">resposta: mediana ${seg41(kr.mediana)} · ${kr.dentro}% no prazo</span>`:''}
        </div>
        ${matheus41()?`<h4>Ativa e parada</h4><div class="p41-paradas">${[...T.map(t=>({a:t.a,b:t.b,k:'ativa'})), ...par.map(q=>({...q,k:'parada'}))].sort((x,y)=>x.a-y.a).map(q=>`<div class="${q.k}"><span>${hm(q.a)} – ${q.agora?'agora':hm(q.b)}</span><b>${q.k==='ativa'?'NO PONTO':'PARADA'}</b><small>${hmCurto41(q.b-q.a)}</small></div>`).join('')||'<p class="suave">Sem ponto hoje.</p>'}</div>`:''}
      </div>
      <div class="p41-hist-lista"><div class="linha entre"><b class="p41-rot">HISTÓRICO DE HOJE</b><span class="selo">${A.length} ações</span></div>
        ${A.length ? [...A].reverse().map(a=>`<div class="p41-hist-it tipo-${a.t}"><i class="ti ${a.ic}"></i><span class="cresce">${esc(a.txt)}${a.link?` <a href="${esc(a.link)}" target="_blank" rel="noopener" title="abrir na Kommo"><i class="ti ti-external-link"></i></a>`:''}</span><small class="num">${hm(a.m)}</small></div>`).join('') : '<p class="suave" style="margin-top:10px">Nenhuma ação registrada hoje.</p>'}
      </div>
    </div></div></div>`;
}
function p41Painel(){
  const d = AOV.d, k = P41.k, hoje = d.hoje, agora = toM(d.hora), pessoas = p41Pessoas(k), D = S.adm.dados;
  const chip = (p, v, zero) => ({n:p.nome, v, av:avatar41(p.c, 20), zero});
  const trabalhando = pessoas.filter(p=>statusPonto(p41Dia(p.c)).c==='ativa');
  const dias7 = Array.from({length:7},(_,i)=>addDays(hoje, i-6));
  const vendHoje = (D.vendas||[]).filter(v=>v.data===hoje), totHoje = vendHoje.reduce((s,v)=>s+Number(v.valor||0),0);
  const porP = p => vendHoje.filter(v=>v.colaboradora_id===p.id).reduce((s,v)=>s+Number(v.valor||0),0);
  const sparkV = dias7.map(x=>(D.vendas||[]).filter(v=>v.data===x).reduce((s,v)=>s+Number(v.valor||0),0));
  const sparkT = dias7.map(x=>(D.pontos||[]).filter(p=>p.data===x).reduce((s,p)=>s+(trab(p)||0),0));
  const kH = k?.hojeDados, kAt = p => p.at!=null ? String(p.at) : null;
  const msgs = p => kH && kAt(p) ? (kH.acoes||[]).filter(a=>a.at===p.at && a.tipo==='msg').length : 0;
  const msgsTot = kH ? (kH.acoes||[]).filter(a=>a.tipo==='msg').length : 0;
  const sparkM = k ? dias7.map(x=>Object.values(k.periodo.porDia).reduce((s,o)=>s+((o[x]||{}).msg||0),0)) : null;
  const esp = p => kH && kAt(p) ? (kH.esperando[kAt(p)]||0) : 0, venc = p => kH && kAt(p) ? (kH.vencidas[kAt(p)]||0) : 0;
  const naoLidos = (d.avisos||[]).reduce((n,a)=>n + d.colaboradoras.filter(c=>!(d.leituras||[]).some(l=>l.tipo==='aviso'&&l.ref_id===a.id&&l.colaboradora_id===c.id)).length, 0);
  const semAt = kH ? (kH.esperando['0']||0) : 0;
  const ordem = f => [...pessoas].sort((a,b)=>f(b)-f(a));
  const cards = [
    p41Card({k:0, ic:'ti-users', num:`${trabalhando.length}<small>/${pessoas.length}</small>`, txt:'ativas agora', spark:sparkT.some(Boolean)?`<div class="p41-sp"><span>no ponto · 7 dias</span>${p41Spark(sparkT)}</div>`:'', chips:pessoas.map(p=>{ const st = statusPonto(p41Dia(p.c)); return chip(p, st.c==='ativa'?'<i class="ti ti-circle-check-filled ok"></i>':st.c==='pausa'?'pausa':st.c==='saiu'?'saiu':'—', st.c!=='ativa'); }), oc:"S.adm.tab='hoje';render()"}),
    p41Card({k:1, ic:'ti-shopping-bag', num:brl(totHoje), txt:'vendido hoje', spark:`<div class="p41-sp"><span>vendas · 7 dias</span>${p41Spark(sparkV,'var(--vermelho)')}</div>`, chips:ordem(porP).map(p=>chip(p, brl(porP(p)), !porP(p))), oc:"S.adm.tab='arena';render()"}),
    p41Card({k:2, ic:'ti-clock', num:kH?kH.esperandoTotal:'—', txt:'clientes esperando resposta', vermelho:!!(kH&&kH.esperandoTotal), chips:kH?ordem(esp).filter(p=>esp(p)).map(p=>chip(p, esp(p))).concat(semAt?[{n:'sem atendente', v:semAt}]:[]):null, sub:kH?'ninguém esperando ✨':'sem motor da Kommo', oc:"S.adm.tab='whats';KM.sub='esperando';render()"}),
    p41Card({k:3, ic:'ti-alert-triangle', num:kH?kH.vencidasTotal:'—', txt:'tarefas vencidas na equipe', vermelho:!!(kH&&kH.vencidasTotal), chips:kH?ordem(venc).filter(p=>venc(p)).map(p=>chip(p, venc(p))):null, sub:kH?'nenhuma tarefa vencida':'sem motor da Kommo', oc:"S.adm.tab='whats';KM.sub='tarefas';kmTarCarregar();render()"}),
    p41Card({k:4, ic:'ti-send', num:kH?msgsTot:'—', txt:'mensagens enviadas hoje', spark:sparkM&&sparkM.some(Boolean)?`<div class="p41-sp"><span>mensagens · 7 dias</span>${p41Spark(sparkM,'var(--info)')}</div>`:'', chips:kH?ordem(msgs).map(p=>chip(p, msgs(p), !msgs(p))):null, sub:kH?'':'sem motor da Kommo'}),
    p41Card({k:5, ic:'ti-speakerphone', num:naoLidos, txt:'avisos sem leitura', vermelho:naoLidos>0, sub:naoLidos?`${(d.avisos||[]).length} aviso(s) ativo(s)`:'Todos leram', oc:"S.adm.tab='mural';render()"})
  ].join('');
  return `<div id="aovivo" class="p41 ${P41.tv?'tv':''}">
    <div class="p41-topo"><div><span class="p41-selo">${matheus41()?'GESTÃO · DETALHE COMPLETO':'GESTÃO · SÓ VOCÊ VÊ'}</span><h2>Painel da <mark>loja</mark></h2><p>O dia de cada uma, contado sozinho pelo ponto, pelo PDV e pela Kommo. Atualiza sozinho a cada 20 segundos.</p></div>
      <div class="p41-topo-b"><span class="p41-vivo"><i></i>AO VIVO <span id="aov-idade">agora mesmo</span></span>
        <button class="btn p" onclick="carregarAoVivo();p41Kommo(7,true).then(p41Repintar)"><i class="ti ti-refresh"></i> Atualizar</button>
        <button class="btn p" onclick="p41TV()"><i class="ti ${P41.tv?'ti-arrows-minimize':'ti-device-tv'}"></i> ${P41.tv?'Sair do modo TV':'Modo TV'}</button></div></div>
    ${P41.kErro && P41.kErro!=='motor antigo' ? `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-x"></i><div>Motor da Kommo: ${esc(P41.kErro)}. O painel mostra só a parte da loja por enquanto.</div></div>` : ''}
    <div class="p41-cards">${cards}</div>
    <div class="p41-g2">${p41Pulso(pessoas, k, agora)}${p41Gauge(k)}</div>
    <div class="p41-g2">${p41Funil(pessoas, k)}</div>
    ${p41Linha(pessoas, k, agora)}
  </div>`;
}
function p41Repintar(){ if(S.tela!=='admin' || S.adm?.tab!=='aovivo' || modalAberto()) return; const el = $('#aovivo'); if(el && AOV.d){ el.outerHTML = p41Painel(); animarNumeros(); } }
function p41TV(){
  P41.tv = !P41.tv; document.body.classList.toggle('p41-tv', P41.tv);
  try{ if(P41.tv && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else if(!P41.tv && document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(e){}
  render();
}
document.addEventListener('fullscreenchange', ()=>{ if(!document.fullscreenElement && P41.tv){ P41.tv = false; document.body.classList.remove('p41-tv'); render(); } });

if(typeof NOMES34!=='undefined') NOMES34.aovivo = 'Painel da loja';
/* encaixe: a tela "Ao vivo" passa a ser o painel; a atualização sozinha do app6 (carregarAoVivo) continua valendo */
const _htmlAoVivoV41 = htmlAoVivo;
htmlAoVivo = function htmlAoVivo(){ try{ return p41Painel(); }catch(e){ console.error('v41 painel', e); return _htmlAoVivoV41.apply(this, arguments); } };
const _admAoVivoV41 = admAoVivo;
admAoVivo = function admAoVivo(){
  if(!P41.k && !P41.kErro && !P41.kProm) p41Kommo(7).then(()=>p41Repintar());
  else if(Date.now()-P41.kt > 15e3 && !P41.kProm && P41.kErro!=='motor antigo') setTimeout(()=>p41Kommo(7, true).then(p41Repintar), 60);
  return _admAoVivoV41.apply(this, arguments);
};

/* ───────── produtividade da equipe ───────── */
const PESOS41 = {vendas:35, resposta:15, tarefas:10, tempo:10, msgs:10, pont:10, chk:10};
function p41Pesos(){ let p = null; try{ p = LS.get('lv_p41_pesos', null); }catch(e){} return Object.assign({}, PESOS41, p||{}); }
function p41Metricas(dias){
  const D = S.adm.dados, hoje = D.hoje, ini = addDays(hoje, -(dias-1)), meio = addDays(hoje, -Math.floor(dias/2)), k = P41.prod;
  const base = metricas(dias), kp = k?.periodo, ats = k?.atendentes||[];
  const uteis = Array.from({length:dias},(_,i)=>addDays(hoje,-i)).filter(x=>dow(x)!==0 && !(D.regras.feriados||[]).includes(x)).length || 1;
  return base.map(m=>{
    const a = ats.find(x=>x.eid===m.c.id) || ats.find(x=>norm41(primeiroNome(x.nome))===norm41(primeiroNome(m.c.nome)));
    const at = a ? String(a.id) : null, pd = at && kp ? (kp.porDia[at]||{}) : {}, dk = Object.keys(pd);
    const soma = f => dk.reduce((s,x)=>s+(pd[x][f]||0),0);
    const diasPonto = new Set(D.pontos.filter(p=>p.colaboradora_id===m.c.id && p.data>=ini && p.data<=hoje && p.entrada).map(p=>p.data));
    const diasAtivos = new Set([...diasPonto, ...dk]), nA = diasAtivos.size || 1;
    const resp = at && kp ? kp.respostas[at] : null;
    const entradas = D.pontos.filter(p=>p.colaboradora_id===m.c.id && p.data>=ini && p.data<=hoje && p.entrada).map(p=>toM(p.entrada));
    const vendDia = x => m.vendas.filter(v=>v.data===x).reduce((s,v)=>s+Number(v.valor||0),0);
    const metade = (f) => { const A = [...diasAtivos].filter(x=>x<meio), B = [...diasAtivos].filter(x=>x>=meio); const ma = A.length ? A.reduce((s,x)=>s+f(x),0)/A.length : 0, mb = B.length ? B.reduce((s,x)=>s+f(x),0)/B.length : 0; return ma ? Math.round(100*(mb-ma)/ma) : null; };
    return {...m, at, msgs:soma('msg'), tar:soma('tar'), etapas:soma('etapa'), leads:soma('leads'), diasAtivos:nA, constancia:Math.round(100*Math.min(1, nA/uteis)),
      msgsDia:soma('msg')/nA, tarDia:soma('tar')/nA, leadsDia:soma('leads')/nA, tempoDia:m.horas/(diasPonto.size||1), vendasDia:m.total/nA,
      resp, entradaMedia: entradas.length ? Math.round(entradas.reduce((s,x)=>s+x,0)/entradas.length) : null, tendVendas: metade(vendDia)};
  });
}
const ABAS41 = [['indice','Índice'],['vendas','Vendas'],['resposta','Resposta'],['tarefas','Tarefas'],['tempo','Tempo ativo'],['msgs','Mensagens'],['pont','Pontualidade'],['chk','Checklist']];
function p41Valor(m, aba){ return ({indice:m.indice, vendas:m.total, resposta:m.resp?m.resp.dentro:-1, tarefas:m.tarDia, tempo:m.tempoDia, msgs:m.msgsDia, pont:m.pont??-1, chk:m.chkDia})[aba]; }
function p41Fmt(m, aba){ return ({indice:()=>Math.round(m.indice)+' pts', vendas:()=>brl(m.total), resposta:()=>m.resp?`${m.resp.dentro}% no prazo <small>mediana ${seg41(m.resp.mediana)}</small>`:'—', tarefas:()=>m.tarDia.toFixed(1)+' <small>/dia</small>', tempo:()=>hmCurto41(m.tempoDia)+' <small>/dia</small>', msgs:()=>m.msgsDia.toFixed(1)+' <small>/dia</small>', pont:()=>m.pont==null?'—':m.pont+'%', chk:()=>m.chkDia.toFixed(1)+' <small>/dia</small>'})[aba](); }
function p41Prod(){
  const dias = S.adm.prodDias || 15, D = S.adm.dados, hoje = D.hoje, k = P41.prod, kp = k?.periodo;
  const M = p41Metricas(dias), pesos = p41Pesos();
  const max = f => Math.max(1e-9, ...M.map(f));
  const mx = {vendas:max(m=>m.total), tarefas:max(m=>m.tarDia), tempo:max(m=>m.tempoDia), msgs:max(m=>m.msgsDia), chk:max(m=>m.chkDia)};
  M.forEach(m=>{ m.indice = pesos.vendas*m.total/mx.vendas + pesos.resposta*((m.resp?m.resp.dentro:0)/100) + pesos.tarefas*m.tarDia/mx.tarefas + pesos.tempo*m.tempoDia/mx.tempo + pesos.msgs*m.msgsDia/mx.msgs + pesos.pont*((m.pont??0)/100) + pesos.chk*m.chkDia/mx.chk; });
  const aba = ABAS41.some(a=>a[0]===P41.aba) ? P41.aba : 'indice';
  const R = [...M].sort((a,b)=>p41Valor(b,aba)-p41Valor(a,aba) || ((a.resp?.mediana??1e9)-(b.resp?.mediana??1e9)));
  const vmax = Math.max(1e-9, ...R.map(m=>p41Valor(m,aba))), media = R.length ? R.reduce((s,m)=>s+Math.max(0,p41Valor(m,aba)),0)/R.length : 0;
  const top = (f, ok) => { const l = M.filter(ok||(()=>true)).sort((a,b)=>f(b)-f(a))[0]; return l; };
  const dest = [
    ['Mais vendeu', top(m=>m.total, m=>m.total>0), m=>brl(m.total)],
    ['Responde mais rápido', top(m=>-(m.resp?.mediana??1e9), m=>m.resp&&m.resp.n>=3), m=>seg41(m.resp.mediana)],
    ['Mais tarefas por dia', top(m=>m.tarDia, m=>m.tar>0), m=>m.tarDia.toFixed(1)],
    ['Mais tempo no ponto', top(m=>m.tempoDia, m=>m.horas>0), m=>hmCurto41(m.tempoDia)+'/dia'],
    ['Mais mensagens por dia', top(m=>m.msgsDia, m=>m.msgs>0), m=>m.msgsDia.toFixed(1)],
    ['Mais clientes atendidas', top(m=>m.leadsDia, m=>m.leads>0), m=>m.leadsDia.toFixed(1)+'/dia'],
    ['Mais constante', top(m=>m.constancia, m=>m.diasAtivos>1), m=>m.constancia+'% dos dias'],
    ['Começa mais cedo', top(m=>-(m.entradaMedia??1e9), m=>m.entradaMedia!=null), m=>hm(m.entradaMedia)],
    ['Mais pontual', top(m=>m.pont??-1, m=>m.comEscala>=2), m=>m.pont+'%'],
    ['Checklist mais completo', top(m=>m.chkDia, m=>m.chk>0), m=>m.chkDia.toFixed(1)+'/dia']
  ].filter(x=>x[1]);
  const cardP = (ic, num, txt, f, fmt, vermelho) => `<div class="p41-card p41-cardp ${vermelho?'alerta':''}"><div class="p41-card-t"><span class="ic"><i class="ti ${ic}"></i></span></div><b class="p41-big">${num}</b><span class="p41-lbl">${txt}</span>
    <div class="p41-lista">${[...M].sort((a,b)=>f(b)-f(a)).map(m=>`<div><span>${avatar41(m.c,20)} ${esc(primeiroNome(m.c.nome))}</span><b>${fmt(m)}</b></div>`).join('')}</div></div>`;
  const tot = kp?.total;
  const cards = [
    cardP('ti-shopping-bag', brl(M.reduce((s,m)=>s+m.total,0)), `vendido em ${dias} dias`, m=>m.total, m=>brl(m.total)),
    cardP('ti-circle-check', M.reduce((s,m)=>s+m.tar,0), `tarefas concluídas na Kommo`, m=>m.tar, m=>m.tar),
    cardP('ti-clock', hmCurto41(M.reduce((s,m)=>s+m.tempoDia,0)/(M.length||1)), 'tempo no ponto por dia (média)', m=>m.tempoDia, m=>hmCurto41(m.tempoDia)),
    cardP('ti-send', M.reduce((s,m)=>s+m.msgs,0), 'mensagens enviadas', m=>m.msgs, m=>m.msgs),
    cardP('ti-users', (M.reduce((s,m)=>s+m.leadsDia,0)).toFixed(1), 'clientes atendidas por dia (soma)', m=>m.leadsDia, m=>m.leadsDia.toFixed(1)),
    cardP('ti-stopwatch', tot?seg41(tot.mediana):'—', tot?`tempo de resposta (mediana) · ${tot.dentro}% em até ${k.prazoMin} min`:'tempo de resposta (sem motor da Kommo)', m=>m.resp?-(m.resp.mediana??1e9):-1e9, m=>m.resp?seg41(m.resp.mediana):'—', true)
  ].join('');
  const calor = p41Calor(dias);
  return `<div class="p41 p41-prod">
    <div class="p41-topo"><div><span class="p41-selo">${matheus41()?'GESTÃO · DETALHE COMPLETO':'GESTÃO · SÓ VOCÊ VÊ'}</span><h2>Produtividade da <mark>equipe</mark></h2><p>Levantamento de cada pessoa nos últimos ${dias} dias (${ddmm(addDays(hoje,-(dias-1)))} a ${ddmm(hoje)}), contado sozinho pelo ponto, pelo PDV, pelo checklist e pela Kommo.</p></div>
      <div class="p41-topo-b">${matheus41()?`<button class="btn p" onclick="p41Config()"><i class="ti ti-adjustments"></i> Configurar</button>`:''}<div class="p41-per">${[7,15,30].map(n=>`<button class="${dias===n?'on':''}" onclick="S.adm.prodDias=${n};p41Kommo(${n},true,true).then(()=>render());render()">${n} dias</button>`).join('')}</div></div></div>
    ${P41.kErro && P41.kErro!=='motor antigo' ? `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-x"></i><div>Motor da Kommo: ${esc(P41.kErro)}. Mensagens, tarefas e tempo de resposta ficam de fora por enquanto.</div></div>` : ''}
    <div class="p41-cards seis">${cards}</div>
    <div class="p41-g2 rank">
      <section class="p41-bloco">
        <div class="p41-bloco-t"><h3>Ranking · ${ABAS41.find(a=>a[0]===aba)[1].toLowerCase()}</h3></div>
        <div class="p41-abas">${ABAS41.map(([kk,n])=>`<button class="${aba===kk?'on':''}" onclick="P41.aba='${kk}';render()">${n}</button>`).join('')}</div>
        <div class="p41-rank">${R.map((m,i)=>{ const v = p41Valor(m,aba), vs = media>0 && v>=0 ? Math.round(100*(v-media)/media) : null;
          return `<div class="p41-rank-it" onclick="fichaProd('${m.c.id}')" style="--k:${i}"><b class="pos">${i+1}º</b>${avatar41(m.c, 40)}<div class="cresce"><div class="linha entre"><b>${esc(primeiroNome(m.c.nome))}</b><span class="val">${v<0?'—':p41Fmt(m,aba)}</span></div>
            <div class="p41-rank-bar"><i style="width:${v>0?Math.max(2, 100*v/vmax):0}%;--c:${esc(m.c.cor)}"></i><em style="left:${media>0?Math.min(100,100*media/vmax):0}%"></em></div>
            <small>${vs!=null?`<span class="${vs>=0?'ok':'ruim'}">${vs>=0?'▲':'▼'} ${vs>=0?'+':''}${vs}% vs média</span> · `:''}${aba==='vendas'&&m.tendVendas!=null?`<span class="${m.tendVendas>=0?'ok':'ruim'}">${m.tendVendas>=0?'▲':'▼'} ${Math.abs(m.tendVendas)}% na 2ª metade</span> · `:''}${m.diasAtivos} dia(s) com atividade</small></div></div>`; }).join('')}</div>
      </section>
      <section class="p41-bloco"><div class="p41-bloco-t"><h3>Destaques do período</h3></div>
        <div class="p41-dest">${dest.map(([t,m,f])=>`<div><span>${t}</span><span class="quem">${avatar41(m.c,24)} <b>${esc(primeiroNome(m.c.nome))}</b> <em>${f(m)}</em></span></div>`).join('')||'<p class="suave">Ainda sem dados no período.</p>'}</div>
      </section>
    </div>
    <div class="p41-g2 rank">
      ${calor}
      <section class="p41-bloco"><div class="p41-bloco-t"><h3>Resposta aos clientes</h3>${tot?`<span class="selo">${tot.n} respostas</span>`:''}</div>
        ${!kp ? '<p class="suave p41-semkommo">Precisa do motor da Kommo.</p>' : `<div class="p41-resp2"><div><small>MEDIANA</small><b>${seg41(tot.mediana)}</b></div><div><small>NO PRAZO (ATÉ ${k.prazoMin} MIN)</small><b>${tot.dentro==null?'—':tot.dentro+'%'}</b></div></div>
        <div class="p41-barras hist">${[['até 5 min','ate5','ok'],['5 a 15 min','ate15','ok'],['15 min a 1 h','ate60','warn'],['1 a 4 h','ate240','verm'],['mais de 4 h','mais','verm']].map(([n,c,cls])=>`<div class="p41-barra"><span>${n}</span><div><i class="${cls}" style="width:${pct41(kp.hist[c], tot.n||1)}%"></i></div><b>${kp.hist[c]}</b></div>`).join('')}</div>
        <small class="suave" style="display:block;margin-top:10px">Contado só dentro do horário de atendimento (${k.horario.ini}–${k.horario.fim}). ${matheus41()?`<a href="#" onclick="S.adm.tab='whats';KM.sub='config';render();return false">Ajustar</a>`:''}</small>`}
      </section>
    </div>
    ${matheus41() ? `<section class="p41-bloco"><div class="p41-bloco-t"><h3>Tabela completa</h3><button class="btn p" onclick="P41.tabela=!P41.tabela;render()">${P41.tabela?'Esconder':'Mostrar'}</button></div>${P41.tabela?`<div class="p41-tabela">${_admProdutividadeV41()}</div>`:'<p class="suave" style="font-size:13px">Vendas, dias, horas, pontualidade, checklist, avisos e treinamento por pessoa + cobertura das lojas por hora.</p>'}</section>` : ''}
  </div>`;
}
function p41Calor(dias){
  const D = S.adm.dados, hoje = D.hoje, ini = addDays(hoje,-(dias-1)), kp = P41.prod?.periodo, G = Array.from({length:7},()=>Array(24).fill(0));
  const add = (data, hhmm) => { const m = toM(hhmm); if(m==null || !data) return; G[dow(data)][Math.floor(m/60)]++; };
  D.pontos.filter(p=>p.data>=ini && p.data<=hoje).forEach(p=>CAMPOS.forEach(f=>{ if(p[f]) add(p.data, p[f]); }));
  D.vendas.filter(v=>v.data>=ini && v.data<=hoje).forEach(v=>add(v.data, String(v.lancado_em||'').slice(11,16)));
  (D.checklist?.feitos||[]).forEach(f=>add(f.data||hoje, f.hora));
  if(kp) kp.calor.forEach((row,i)=>row.forEach((v,j)=>{ G[i][j]+=v; }));
  const h0 = 7, h1 = 21, max = Math.max(1, ...G.flat()), nomes = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], ordem = [1,2,3,4,5,6,0];
  const tot = G.flat().reduce((a,b)=>a+b,0), porH = Array.from({length:24},(_,h)=>G.reduce((s,r)=>s+r[h],0)), porD = G.map(r=>r.reduce((a,b)=>a+b,0));
  const hMax = porH.indexOf(Math.max(...porH)), dMax = porD.indexOf(Math.max(...porD));
  let pico = {v:-1}; G.forEach((r,d)=>r.forEach((v,h)=>{ if(v>pico.v) pico = {v,d,h}; }));
  const manha = porH.slice(0,12).reduce((a,b)=>a+b,0), tarde = porH.slice(12,18).reduce((a,b)=>a+b,0), noite = porH.slice(18).reduce((a,b)=>a+b,0);
  const L = Object.values(D.lojas||{}), abre = Math.min(...L.map(l=>toM(l.abre))), fecha = Math.max(...L.map(l=>toM(l.fecha)));
  const fora = G.flat().length ? pct41(porH.filter((v,h)=>h*60<abre || h*60>=fecha).reduce((a,b)=>a+b,0), tot||1) : 0;
  const stat = (t, v) => `<div class="p41-stat"><small>${t}</small><b>${v}</b></div>`;
  return `<section class="p41-bloco p41-calor"><div class="p41-bloco-t"><h3>Quando a equipe trabalha</h3><small class="suave">ações por hora · ${dias} dias</small></div>
    <div class="p41-mapa" style="grid-template-columns:34px repeat(${h1-h0},1fr)"><span></span>${Array.from({length:h1-h0},(_,i)=>`<small>${(h0+i)%2===0?(h0+i)+'h':''}</small>`).join('')}
      ${ordem.map(d=>`<small>${nomes[d]}</small>${Array.from({length:h1-h0},(_,i)=>{ const v = G[d][h0+i]; return `<i style="--a:${v?0.15+0.85*v/max:0}" title="${nomes[d]} ${h0+i}h: ${v} ação(ões)"></i>`; }).join('')}`).join('')}</div>
    <div class="p41-legenda"><span>menos</span><i style="--a:.2"></i><i style="--a:.5"></i><i style="--a:.8"></i><i style="--a:1"></i><span>mais</span></div>
    <div class="p41-stats">${stat('HORÁRIO MAIS FORTE', tot?`${hMax}h às ${hMax+2}h`:'—')}${stat('PICO', tot&&pico.v>0?`${nomes[pico.d].toLowerCase()}, ${pico.h}h`:'—')}${stat('DIA MAIS FORTE', tot?nomes[dMax].toLowerCase():'—')}${stat('MANHÃ · TARDE · NOITE', tot?`${pct41(manha,tot)}% · ${pct41(tarde,tot)}% · ${pct41(noite,tot)}%`:'—')}${stat('FORA DO HORÁRIO DA LOJA', tot?fora+'%':'—')}</div>
  </section>`;
}
function p41Config(){
  const p = p41Pesos(), campo = (k, n) => `<label class="p41-peso"><span>${n}</span><input class="inp" type="number" min="0" max="100" id="p41-${k}" value="${p[k]}"><small>%</small></label>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3>Configurar o índice</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="font-size:14px">Peso de cada parte no ranking "Índice" (quem lidera em cada uma ganha o peso inteiro; as outras, proporcional). Também vale a parada: mais de <input class="inp" type="number" min="5" max="60" id="p41-parada" value="${P41.parada}" style="width:64px;display:inline-block"> min sem ação conta como parada na linha do dia.</p>
      ${campo('vendas','Vendas')}${campo('resposta','Tempo de resposta (% no prazo)')}${campo('tarefas','Tarefas concluídas por dia')}${campo('tempo','Tempo no ponto por dia')}${campo('msgs','Mensagens por dia')}${campo('pont','Pontualidade')}${campo('chk','Checklist por dia')}
      <div class="linha" style="gap:8px;margin-top:14px;justify-content:flex-end"><button class="btn p" onclick="LS.del('lv_p41_pesos');LS.del('lv_p41_parada');P41.parada=15;fecharModal();render()">Voltar ao padrão</button><button class="btn pri" onclick="p41SalvarCfg()">Salvar</button></div></div></div></div>`;
}
function p41SalvarCfg(){
  const o = {}; Object.keys(PESOS41).forEach(k=>{ o[k] = Math.max(0, Math.min(100, Number($('#p41-'+k).value)||0)); });
  LS.set('lv_p41_pesos', o); P41.parada = Math.max(5, Math.min(60, Number($('#p41-parada').value)||15)); LS.set('lv_p41_parada', P41.parada);
  fecharModal(); render(); toast('Índice configurado ✔');
}
try{ P41.parada = Number(LS.get('lv_p41_parada', 15)) || 15; }catch(e){}
const _admProdutividadeV41 = admProdutividade;
admProdutividade = function admProdutividade(){
  const dias = S.adm.prodDias || 15;
  if((!P41.prod || P41.prodDias!==dias) && !P41.prodProm && P41.kErro!=='motor antigo') p41Kommo(dias, false, true).then(()=>{ if(S.adm?.tab==='produtividade') render(); });
  try{ return p41Prod(); }catch(e){ console.error('v41 produtividade', e); return _admProdutividadeV41.apply(this, arguments); }
};

/* ───────── estilo ───────── */
document.head.insertAdjacentHTML('beforeend', `<style>
.p41{--azul:#2563EB}
.p41-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 16px}
.p41-topo h2{font-size:clamp(26px,3.4vw,36px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:6px 0 4px}
.p41-topo h2 mark{background:linear-gradient(transparent 55%,rgba(245,181,36,.55) 55%);color:inherit;padding:0 2px}
.p41-topo p{color:var(--creme2);font-size:14px;max-width:720px}
.p41-selo{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.08em;padding:3px 9px;border-radius:99px;background:rgba(245,181,36,.2);color:#8a5a00;border:1px solid rgba(245,181,36,.5)}
.p41-topo-b{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.p41-vivo{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--vermelho);letter-spacing:.04em}
.p41-vivo i{width:8px;height:8px;border-radius:99px;background:var(--vermelho);animation:p41Pisca 1.6s infinite}
.p41-vivo span{color:var(--creme3);font-weight:600;letter-spacing:0}
@keyframes p41Pisca{0%,100%{box-shadow:0 0 0 0 rgba(227,16,31,.5)}60%{box-shadow:0 0 0 7px rgba(227,16,31,0)}}
.p41-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}
@media (min-width:1500px){.p41-cards{grid-template-columns:repeat(6,minmax(0,1fr))}}
.p41-card{position:relative;text-align:left;background:#fff;border:1px solid var(--linha);border-radius:20px;padding:14px 16px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:4px;animation:entraCard .5s var(--mola,ease) both;animation-delay:calc(var(--k,0) * 60ms);transition:transform .2s var(--mola,ease),box-shadow .2s}
button.p41-card{cursor:pointer}button.p41-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px -16px rgba(28,20,22,.35)}
.p41-card.alerta{background:linear-gradient(145deg,#E3101F,#B30A17);color:#fff;border-color:transparent;box-shadow:0 16px 34px -16px rgba(227,16,31,.7)}
.p41-card-t{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.p41-card-t .ic{width:34px;height:34px;border-radius:11px;background:var(--noite);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--creme2)}
.p41-card.alerta .ic{background:rgba(255,255,255,.18);color:#fff}
.p41-card-t small{font-size:12px;font-weight:700;color:var(--creme3);display:inline-flex;align-items:center;gap:2px}.p41-card.alerta .p41-card-t small{color:rgba(255,255,255,.8)}
.p41-big{font-size:34px;font-weight:900;letter-spacing:-.03em;line-height:1}.p41-big small{font-size:18px;color:var(--creme3);font-weight:700}.p41-card.alerta .p41-big small{color:rgba(255,255,255,.7)}
.p41-lbl{font-size:13px;font-weight:700;color:var(--creme2)}.p41-card.alerta .p41-lbl{color:rgba(255,255,255,.9)}
.p41-sub{font-size:12.5px;color:var(--creme3);margin-top:4px}.p41-card.alerta .p41-sub{color:rgba(255,255,255,.8)}
.p41-sp{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 0}.p41-sp span{font-size:11.5px;color:var(--creme3)}
.p41-spark{width:90px;height:26px;flex-shrink:0}
.p41-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.p41-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 4px;border-radius:99px;background:var(--noite);font-size:12.5px;font-weight:700;color:var(--creme)}
.p41-chip .lob-av{width:20px;height:20px;font-size:9px}.p41-chip b{color:var(--vermelho)}.p41-chip .ok{color:var(--ok)}.p41-chip.zero{opacity:.55}.p41-chip.zero b{color:var(--creme3)}
.p41-card.alerta .p41-chip{background:rgba(255,255,255,.95);color:var(--creme)}
.p41-g2{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;margin-bottom:12px}.p41-g2.rank{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)}
.p41-bloco{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:16px 18px;box-shadow:var(--sh);min-width:0;animation:entraBloco .5s var(--suave,ease) both}
.p41-bloco-t{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.p41-bloco-t h3{font-size:17px;font-weight:800;letter-spacing:-.01em}
.p41-semkommo{font-size:13.5px;padding:14px;border-radius:14px;background:var(--noite)}
.p41-filtros{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.p41-filtros button,.p41-abas button,.p41-per button{display:inline-flex;align-items:center;gap:6px;padding:6px 12px 6px 6px;border-radius:99px;background:var(--noite);font-weight:700;font-size:13px;color:var(--creme2);transition:background .2s,color .2s,transform .2s var(--mola,ease)}
.p41-filtros button:hover,.p41-abas button:hover,.p41-per button:hover{transform:translateY(-1px)}
.p41-filtros button.on,.p41-abas button.on,.p41-per button.on{background:var(--creme);color:#fff}
.p41-filtros button:first-child,.p41-abas button,.p41-per button{padding:6px 13px}
.p41-filtros .lob-av{width:22px;height:22px;font-size:9px}
.p41-grafico{width:100%;height:auto;display:block}
.p41-grafico text{font-size:11px;fill:var(--creme3);font-family:var(--font)}.p41-grafico .rot{font-size:11px;font-weight:800;fill:#8a5a00}
.p41-grafico .area.eq{fill:rgba(28,20,22,.08)}.p41-grafico .linha.eq{fill:none;stroke:rgba(28,20,22,.35);stroke-width:1.5}
.p41-grafico .area.sel{fill:var(--c);opacity:.18}.p41-grafico .linha.sel{fill:none;stroke:var(--c);stroke-width:2.2}
.p41-grafico .pico{fill:#F5B524;stroke:#fff;stroke-width:1.5}.p41-grafico .agora{stroke:var(--vermelho);stroke-width:1.5;stroke-dasharray:3 3}
.p41-pulso-res{font-size:13px;color:var(--creme2);display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px}.p41-pulso-res b{color:var(--creme)}
.p41-gauge{text-align:center;display:flex;flex-direction:column;align-items:center}
.p41-vel{width:min(100%,230px);height:auto;margin-top:4px}.p41-vel .trilho{fill:none;stroke:var(--noite2);stroke-width:18;stroke-linecap:round}.p41-vel .cheio{fill:none;stroke:var(--vermelho);stroke-width:18;stroke-linecap:round;transition:d .8s}
.p41-vel .pont{stroke:var(--creme);stroke-width:4;stroke-linecap:round}.p41-vel .eixo{fill:var(--creme)}.p41-vel g{transition:transform 1.1s var(--suave,ease)}
.p41-pct{font-size:40px;font-weight:900;letter-spacing:-.03em;line-height:1;margin-top:-26px}.p41-pct.ok{color:var(--ok)}.p41-pct.ruim{color:var(--vermelho)}
.p41-gauge small{color:var(--creme3);font-weight:700}.p41-gauge-l{font-size:13px;color:var(--creme2);margin:10px 0 12px}
.p41-rot{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--creme3)}
.p41-dias{display:flex;gap:10px;margin-top:6px}.p41-dia{display:flex;flex-direction:column;align-items:center;gap:3px}.p41-dia i{width:12px;height:12px;border-radius:4px;background:var(--noite2)}.p41-dia.ok i{background:var(--ok)}.p41-dia.ruim i{background:var(--vermelho)}.p41-dia small{font-size:10px;font-weight:800;color:var(--creme3)}
.p41-mov{display:flex;flex-direction:column;gap:8px;max-height:330px;overflow:auto;padding-right:4px}
.p41-mov-it{display:block;padding:10px 12px;border-radius:14px;background:var(--noite);text-decoration:none;color:inherit;transition:transform .2s var(--mola,ease),background .2s}.p41-mov-it:hover{background:var(--veludo2);transform:translateX(3px)}
.p41-mov-it b{font-size:14.5px}.p41-mov-it small{display:block;color:var(--creme3);font-size:12px;margin-top:3px}
.p41-etapa{font-size:11.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--vermelho);background:var(--vermelho-claro);padding:3px 8px;border-radius:99px}
.p41-barras{display:flex;flex-direction:column;gap:8px}.p41-barra{display:grid;grid-template-columns:118px 1fr 34px;align-items:center;gap:10px;font-size:13px;font-weight:700;color:var(--creme2)}
.p41-barra div{height:10px;border-radius:99px;background:var(--noite2);overflow:hidden}.p41-barra i{display:block;height:100%;border-radius:99px;background:var(--vermelho);transition:width 1s var(--suave,ease)}
.p41-barra i.esc{background:var(--creme)}.p41-barra i.ok{background:var(--ok)}.p41-barra i.cinza{background:#b8b2b4}.p41-barra i.warn{background:#F5B524}.p41-barra i.verm{background:var(--vermelho)}.p41-barra b{text-align:right;color:var(--creme)}
.p41-conv{font-size:13px;color:var(--creme2);margin:12px 0 8px}.p41-conv b{color:var(--vermelho)}
.p41-semana{display:flex;gap:8px;align-items:flex-end;height:96px}.p41-semana div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;height:100%}
.p41-semana i{width:100%;border-radius:8px 8px 4px 4px;background:var(--noite2)}.p41-semana .hoje i{background:var(--vermelho)}.p41-semana small{font-size:11px;font-weight:800;color:var(--creme2)}.p41-semana span{font-size:10px;font-weight:800;color:var(--creme3)}
.p41-tl-row{display:grid;grid-template-columns:170px 1fr;gap:12px;align-items:center;padding:7px 0;cursor:pointer;border-radius:12px}.p41-tl-row:hover{background:var(--noite)}.p41-tl-row.cab{cursor:default;padding:0 0 4px}.p41-tl-row.cab:hover{background:none}
.p41-tl-quem{display:flex;align-items:center;gap:10px;padding-left:6px;min-width:0}.p41-tl-quem b{display:block;font-size:14px}.p41-tl-quem small{display:block;font-size:11.5px;color:var(--creme3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p41-tl-pista{position:relative;height:22px;border-radius:8px;background:var(--noite);overflow:visible}.p41-tl-pista.eixo{background:none;height:16px}
.p41-tl-pista.eixo small{position:absolute;top:0;transform:translateX(-50%);font-size:10.5px;font-weight:800;color:var(--creme3)}.p41-tl-pista.eixo .agora{position:absolute;top:-2px;width:2px;height:20px;background:var(--vermelho);border-radius:2px}
.p41-tl-pista .trab{position:absolute;top:0;height:100%;background:rgba(245,181,36,.28);border-radius:6px}
.p41-tl-pista .parada{position:absolute;top:3px;height:16px;border-radius:5px;background:repeating-linear-gradient(135deg,rgba(28,20,22,.07) 0 4px,transparent 4px 8px)}.p41-tl-pista .parada.agora{outline:1.5px dashed var(--vermelho)}
.p41-tl-pista .ac{position:absolute;top:4px;width:7px;height:14px;border-radius:3px;transform:translateX(-50%);background:var(--azul)}
.p41-tl-pista .ac.venda{background:var(--vermelho);width:9px;top:2px;height:18px;border-radius:99px}.p41-tl-pista .ac.chk{background:var(--ok)}.p41-tl-pista .ac.ponto{background:var(--creme);width:3px;top:0;height:22px}.p41-tl-pista .ac.sangria{background:#8B3FD9}
.p41-lg{display:inline-block;width:10px;height:10px;border-radius:3px;vertical-align:middle;background:var(--azul)}.p41-lg.venda{background:var(--vermelho);border-radius:99px}.p41-lg.chk{background:var(--ok)}.p41-lg.ponto{background:var(--creme);width:4px}.p41-lg.parada{background:repeating-linear-gradient(135deg,rgba(28,20,22,.25) 0 2px,transparent 2px 4px);width:14px}
.p41-hist{display:grid;grid-template-columns:230px 1fr;gap:18px}
.p41-hist-num b{font-size:30px;font-weight:900;letter-spacing:-.03em;display:block;line-height:1}.p41-hist-num small{color:var(--creme3);font-size:12.5px}
.p41-mini-bar{position:relative;display:flex;align-items:flex-end;gap:3px;height:48px;margin:12px 0 18px;padding-bottom:14px}.p41-mini-bar i{flex:1;background:var(--vermelho);border-radius:3px 3px 0 0;opacity:.85}.p41-mini-bar small{position:absolute;bottom:0;font-size:10px;color:var(--creme3)}
.p41-tags{display:flex;flex-wrap:wrap;gap:5px}.p41-tags span{font-size:12px;font-weight:700;padding:4px 9px;border-radius:99px;background:var(--noite)}.p41-tags .ok{background:var(--ok-bg);color:var(--ok)}.p41-tags .ruim{background:var(--bad-bg);color:var(--bad)}.p41-tags .warn{background:var(--warn-bg);color:var(--warn)}
.p41-hist h4{font-size:11px;letter-spacing:.08em;color:var(--creme3);margin:16px 0 6px}
.p41-paradas div{display:grid;grid-template-columns:1fr auto auto;gap:8px;font-size:12.5px;padding:6px 10px;border-radius:10px;margin-bottom:4px;background:var(--noite)}.p41-paradas .parada{background:var(--warn-bg)}.p41-paradas b{font-size:10.5px;letter-spacing:.06em}.p41-paradas .ativa b{color:var(--ok)}.p41-paradas .parada b{color:var(--warn)}
.p41-hist-lista{max-height:60vh;overflow:auto;padding-right:4px}
.p41-hist-it{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--linha);font-size:14px}.p41-hist-it i.ti{width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--noite);color:var(--creme2);font-size:15px;flex-shrink:0}
.p41-hist-it.tipo-venda i.ti{background:var(--vermelho-claro);color:var(--vermelho)}.p41-hist-it.tipo-msg i.ti{background:var(--info-bg);color:var(--azul)}.p41-hist-it.tipo-tarefa i.ti,.p41-hist-it.tipo-chk i.ti{background:var(--ok-bg);color:var(--ok)}.p41-hist-it small{color:var(--creme3)}.p41-hist-it a{color:var(--azul);margin-left:4px}
.p41-cardp .p41-lista{margin-top:8px;display:flex;flex-direction:column;gap:5px}.p41-cardp .p41-lista div{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;color:var(--creme2)}.p41-cardp .p41-lista span{display:inline-flex;align-items:center;gap:6px}.p41-cardp .p41-lista .lob-av{width:20px;height:20px;font-size:9px}.p41-cardp .p41-lista b{color:var(--creme)}
.p41-card.alerta .p41-lista div,.p41-card.alerta .p41-lista b{color:#fff}.p41-card.alerta .p41-lista div{color:rgba(255,255,255,.9)}
.p41-per{display:inline-flex;gap:4px;padding:4px;border-radius:99px;background:#fff;border:1px solid var(--linha)}.p41-per button{background:transparent}
.p41-abas{display:flex;gap:4px;flex-wrap:wrap;padding:4px;border-radius:14px;background:var(--noite);margin-bottom:12px}.p41-abas button{background:transparent;font-size:12.5px}.p41-abas button.on{background:var(--creme);color:#fff}
.p41-rank{display:flex;flex-direction:column;gap:6px}
.p41-rank-it{display:grid;grid-template-columns:34px 40px 1fr;gap:10px;align-items:center;padding:10px 8px;border-radius:14px;cursor:pointer;animation:entraCard .45s var(--mola,ease) both;animation-delay:calc(var(--k,0) * 50ms);transition:background .2s}.p41-rank-it:hover{background:var(--noite)}
.p41-rank-it .pos{font-size:15px;font-weight:900;color:var(--creme3);text-align:center}.p41-rank-it:first-child .pos{color:#8a5a00}
.p41-rank-it .val{font-size:15px;font-weight:900;white-space:nowrap}.p41-rank-it .val small{font-size:11px;color:var(--creme3);font-weight:700}
.p41-rank-bar{position:relative;height:8px;border-radius:99px;background:var(--noite2);margin:5px 0 4px;overflow:visible}.p41-rank-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#F5B524,var(--c,var(--vermelho)));transition:width 1s var(--suave,ease)}.p41-rank-bar em{position:absolute;top:-3px;width:2px;height:14px;background:var(--creme);opacity:.5}
.p41-rank-it small{font-size:11.5px;color:var(--creme3)}.p41-rank-it small .ok{color:var(--ok);font-weight:700}.p41-rank-it small .ruim{color:var(--bad);font-weight:700}
.p41-dest{display:flex;flex-direction:column;gap:6px}.p41-dest div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;background:var(--noite);font-size:13.5px}.p41-dest .quem{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.p41-dest .quem .lob-av{width:24px;height:24px;font-size:10px}.p41-dest em{font-style:normal;font-weight:900;color:var(--vermelho)}
.p41-mapa{display:grid;gap:3px;align-items:center}.p41-mapa small{font-size:10px;font-weight:800;color:var(--creme3);text-align:center}.p41-mapa i{aspect-ratio:1;border-radius:4px;background:rgba(227,16,31,var(--a,0));border:1px solid rgba(28,20,22,.06)}
.p41-legenda{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--creme3);margin:8px 0 10px}.p41-legenda i{width:12px;height:12px;border-radius:3px;background:rgba(227,16,31,var(--a))}
.p41-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.p41-stat{padding:10px 12px;border-radius:14px;border:1px solid var(--linha);background:var(--veludo2)}.p41-stat small{display:block;font-size:9.5px;font-weight:800;letter-spacing:.06em;color:var(--creme3);margin-bottom:4px}.p41-stat b{font-size:15px;font-weight:900}
.p41-resp2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.p41-resp2 div{padding:12px 14px;border-radius:14px;border:1px solid var(--linha)}.p41-resp2 small{display:block;font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--creme3)}.p41-resp2 b{font-size:22px;font-weight:900}
.p41-peso{display:grid;grid-template-columns:1fr 80px 20px;align-items:center;gap:8px;margin-top:8px;font-size:14px}
.p41-tabela{margin-top:6px}
body.p41-tv #app.com-menu{grid-template-columns:minmax(0,1fr)}body.p41-tv #menu12,body.p41-tv .letreiro,body.p41-tv .sub34,body.p41-tv .bar34,body.p41-tv .voltar,body.p41-tv .evo-lamp,body.p41-tv .evo-flut{display:none!important}
body.p41-tv #app.com-menu>.wrap{max-width:none;padding:16px 24px}body.p41-tv .p41-big{font-size:44px}body.p41-tv .p41-cards{grid-template-columns:repeat(6,minmax(0,1fr))}
@media (max-width:1100px){.p41-g2,.p41-g2.rank{grid-template-columns:1fr}}
@media (max-width:700px){.p41-cards{grid-template-columns:1fr 1fr}.p41-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.p41-big{font-size:28px}.p41-tl-row{grid-template-columns:120px 1fr;gap:8px}.p41-tl-quem small{display:none}.p41-hist{grid-template-columns:1fr}.p41-barra{grid-template-columns:96px 1fr 30px}.p41-bloco{padding:14px}.p41-topo-b{width:100%}}
@media (max-width:420px){.p41-cards{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.p41-vivo i,.p41-card,.p41-bloco,.p41-rank-it{animation:none}}
</style>`);
