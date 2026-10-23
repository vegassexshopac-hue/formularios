/* ═════════════════════ ARENA ═════════════════════ */
function vendedorasDe(M){
  const equipe = (M.equipe||[]).filter(c=>c.ativa!=='NÃO');
  return equipe.filter(c=>!/servi|limpeza|entreg|admin/i.test(c.cargo||'') || M.porPessoa[c.id]);
}
function metaPessoa(c, M, vendedoras){
  const p = (M.m.pessoas||{})[c.id];
  if(p && p.meta) return {meta:p.meta, super:p.super||p.meta, hiper:p.hiper||p.super||p.meta, fonte:'individual'};
  if(c.id===M.lider && M.m.lider?.meta) return {...M.m.lider, fonte:'lider'};
  const lj = M.m[c.loja]; if(!lj || !lj.meta) return null;
  const n = Math.max(1, vendedoras.filter(x=>x.loja===c.loja && x.id!==M.lider).length);
  const arr = v => Math.round(v/n/100)*100;
  return {meta:arr(lj.meta), super:arr(lj.super||lj.meta), hiper:arr(lj.hiper||lj.super||lj.meta), fonte:'estimada'};
}
function diasUteis(ym){ const fer = S.boot?.regras?.feriados || S.sess?.dados?.regras?.feriados || []; return diasDoMes(ym).filter(d=>dow(d)!==0 && !fer.includes(d)); }
function arenaCalc(){
  const hoje = hojeISO(), ym = mesDe(hoje), M = metasDe(ym), P = pdvD();
  const pv = P.vendas.filter(v=>v.status!=='cancelada' && v.data.startsWith(ym));
  const vendedoras = vendedorasDe(M);
  const uteis = diasUteis(ym), passados = uteis.filter(d=>d<hoje).length + (uteis.includes(hoje) ? Math.min(1, Math.max(0,(agoraServidor().getHours()-8)/12)) : 0);
  const ritmo = uteis.length ? passados/uteis.length*100 : 0;
  const dias14 = Array.from({length:14},(_,i)=>addDays(hoje, i-13));
  const pessoas = vendedoras.map(c=>{
    const val = M.porPessoa[c.id]||0, mt = metaPessoa(c, M, vendedoras);
    const minhas = pv.filter(v=>v.colaboradora_id===c.id), n = minhas.length;
    const somaPdv = minhas.reduce((s,v)=>s+v.total,0), pecas = minhas.reduce((s,v)=>s+v.qtd_itens,0);
    const hojeV = M.v.filter(v=>v.data===hoje && v.colaboradora_id===c.id).reduce((s,v)=>s+(Number(v.valor)||0),0);
    const serie = dias14.map(d=>M.v.filter(v=>v.data===d && v.colaboradora_id===c.id).reduce((s,v)=>s+(Number(v.valor)||0),0));
    return {c, val, mt, pct: mt ? val/mt.meta*100 : 0, faixa: mt ? faixaDe(val, mt) : null, n, ticket: n ? somaPdv/n : 0, pa: n ? pecas/n : 0, hoje:hojeV, serie};
  }).sort((a,b)=>b.val-a.val || a.c.nome.localeCompare(b.c.nome));
  const lojas = Object.entries(S.boot.lojas).map(([k,l])=>{ const val = M.porLoja[k]||0, mt = M.m[k]; return {k, l, val, mt, pct: mt?.meta ? val/mt.meta*100 : 0}; });
  const hojeTot = M.v.filter(v=>v.data===hoje).reduce((s,v)=>s+(Number(v.valor)||0),0);
  const pvHoje = pv.filter(v=>v.data===hoje);
  const horas = Array.from({length:13},(_,i)=>i+8).map(h=>({h, v:pvHoje.filter(v=>Number(String(v.hora).slice(0,2))===h).reduce((s,v)=>s+v.total,0)}));
  const prods = {}; pv.forEach(v=>v.itens.forEach(i=>{ const k = i.nome; prods[k] = prods[k]||{nome:k, qtd:0, val:0, cat:i.cat}; prods[k].qtd += i.qtd; prods[k].val += i.qtd*i.preco; }));
  const top = Object.values(prods).sort((a,b)=>b.qtd-a.qtd || b.val-a.val).slice(0,6);
  const pags = {}; pv.forEach(v=>{ pags[v.pagamento]=(pags[v.pagamento]||0)+v.total; });
  const feed = pvHoje.slice().sort((a,b)=>b.criada_em.localeCompare(a.criada_em)).slice(0,8);
  return {hoje, ym, M, pv, pessoas, lojas, ritmo, hojeTot, nHoje:pvHoje.length, ticketHoje: pvHoje.length ? pvHoje.reduce((s,v)=>s+v.total,0)/pvHoje.length : 0, horas, top, pags, feed, total:M.total};
}
function gaugeSVG(L, ritmo, tam=150){
  const mt = L.mt, max = mt ? (mt.hiper||mt.super||mt.meta) : 1, frac = 0.75, r = tam/2-12, c = tam/2;
  const pos = x => Math.min(1, x/max) * frac * 100;
  const ang = p => (135 + p/100*360) * Math.PI/180;
  const tick = (x) => { const a = ang(pos(x)); return `<line class="tick" x1="${c+Math.cos(a)*(r-6)}" y1="${c+Math.sin(a)*(r-6)}" x2="${c+Math.cos(a)*(r+10)}" y2="${c+Math.sin(a)*(r+10)}"/>`; };
  const rp = mt ? pos(mt.meta*ritmo/100) : 0, ra = ang(rp);
  const v = mt ? pos(L.val) : 0, hiper = mt && L.val>=mt.hiper;
  return `<div class="gauge" style="width:${tam}px;height:${tam}px"><svg viewBox="0 0 ${tam} ${tam}">
    <defs><linearGradient id="gOuro" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#B30A17"/><stop offset=".55" stop-color="#F5B524"/><stop offset="1" stop-color="#FFD15C"/></linearGradient>
    <linearGradient id="gVerde" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F5B524"/><stop offset="1" stop-color="#3DDC97"/></linearGradient></defs>
    <circle class="trk" cx="${c}" cy="${c}" r="${r}" pathLength="100" stroke-dasharray="${frac*100} 100" transform="rotate(135 ${c} ${c})"/>
    <circle class="val ${hiper?'hiper':''}" cx="${c}" cy="${c}" r="${r}" pathLength="100" stroke-dasharray="${ARENA.prev['g'+L.k]??0} 100" data-alvo="${v}" data-k="g${L.k}" transform="rotate(135 ${c} ${c})"/>
    ${mt?tick(mt.meta)+tick(mt.super):''}
    ${mt?`<circle class="ritmo" cx="${c+Math.cos(ra)*r}" cy="${c+Math.sin(ra)*r}" r="5"><title>Ritmo esperado para hoje</title></circle>`:''}
  </svg><div class="meio"> <b class="num" data-cu="${Math.floor(L.pct)}" data-k="gp${L.k}" data-f="pct">${Math.round(ARENA.num['gp'+L.k]??0)}%</b><small>da meta</small></div></div>`;
}
const cu = (k, v, f='brl', cls='') => `<b class="num ${cls}" data-cu="${v}" data-k="${k}" data-f="${f}">${f==='brl'?brl(ARENA.num[k]??0):f==='brl2'?brl2(ARENA.num[k]??0):f==='pct'?Math.round(ARENA.num[k]??0)+'%':Math.round(ARENA.num[k]??0)}</b>`;
function sparkSVG(serie){
  const w = 220, h = 46, max = Math.max(1, ...serie), n = serie.length;
  const pts = serie.map((v,i)=>[i/(n-1)*w, h-4-(v/max)*(h-10)]);
  const d = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path class="a" d="${d} L${w} ${h} L0 ${h} Z"/><path class="l" d="${d}" pathLength="1"/></svg>`;
}
function arenaHTML(tv){
  const A = arenaCalc(), M = A.M, eu = S.sess?.eid;
  const fmtFalta = p => !p.mt ? '<span class="apagado">sem meta definida</span>' : p.val<p.mt.meta ? `Faltam <b class="num">${brl(p.mt.meta-p.val)}</b> para a meta` : p.val<p.mt.super ? `Meta batida ✔ · faltam <b class="num">${brl(p.mt.super-p.val)}</b> p/ super` : p.val<p.mt.hiper ? `Super meta ✔ · faltam <b class="num">${brl(p.mt.hiper-p.val)}</b> p/ hiper` : '<b class="pos">Hiper meta batida! 👑</b>';
  const ritmoTxt = L => { if(!L.mt) return '<span class="apagado">Meta da loja não definida</span>'; const dif = Math.round(L.pct - A.ritmo); return dif>=0 ? `<span class="pos">▲ ${dif} pts à frente do ritmo</span>` : `<span class="neg">▼ ${-dif} pts atrás do ritmo</span>`; };
  const lanes = A.pessoas.map((p,i)=>{
    const max = p.mt ? p.mt.hiper : Math.max(1, A.pessoas[0]?.val||1);
    const pos = Math.min(100, p.val/max*100), prev = ARENA.prev['l'+p.c.id] ?? 0, corre = pos > prev + .3;
    const marca = (x, n) => p.mt ? `<i class="marca ${p.val>=x?'bat':''}" style="left:${Math.min(100,x/max*100)}%" data-n="${n}"></i>` : '';
    return `<div class="lane" data-id="${p.c.id}" style="--cor:${esc(p.c.cor||'#F5B524')}">
      <div class="pos">${i+1}</div>
      <div class="trilha">${marca(p.mt?.meta,'meta')}${marca(p.mt?.super,'super')}<span class="bandeira">🏁</span>
        <div class="rastro" style="width:${prev}%" data-alvo="${pos}"></div>
        <div class="corredora ${corre?'corre':''}" style="left:${Math.max(3,prev)}%" data-alvo="${Math.max(3,Math.min(97,pos))}"><span class="fogo">🔥</span>${avatar(p.c,'',42).replace('lob-av','lob-av av')}</div></div>
      <div class="quem"><b>${esc(primeiroNome(p.c.nome))}${p.c.id===M.lider?' ⭐':''}${p.c.id===eu?' <small style="display:inline;color:var(--dourado)">(você)</small>':''}</b><span class="v">${cu('lv'+p.c.id, Math.round(p.val))}</span><small>${p.mt?Math.floor(p.pct)+'% da meta':'—'}${p.hoje?' · hoje '+brl(p.hoje):''}</small></div></div>`; }).join('');
  const cards = A.pessoas.map((p,i)=>`<div class="ar-pessoa" style="--cor:${esc(p.c.cor||'#F5B524')};--i:${i}">
      ${i<3&&p.val?`<span class="medalha">${['🥇','🥈','🥉'][i]}</span>`:''}
      <div class="top">${anelArena(p)}<div><b>${esc(primeiroNome(p.c.nome))}</b><small>Loja ${esc(S.boot.lojas[p.c.loja]?.nome||p.c.loja||'')}${p.mt?' · meta '+brl(p.mt.meta):''}</small>${p.mt?.fonte==='estimada'?'<div class="estim">meta estimada pela meta da loja</div>':''}</div></div>
      <div class="kpis"><div><small>Vendas</small><b>${p.n}</b></div><div><small>Ticket</small><b>${p.n?brl(p.ticket):'—'}</b></div><div><small>Peças/venda</small><b>${p.n?p.pa.toFixed(1).replace('.',','):'—'}</b></div></div>
      ${sparkSVG(p.serie)}
      <div class="falta">${fmtFalta(p)}</div></div>`).join('');
  const maxH = Math.max(1, ...A.horas.map(h=>h.v)), hAgora = agoraServidor().getHours();
  const maxTop = Math.max(1, ...A.top.map(t=>t.qtd));
  const totPag = Object.values(A.pags).reduce((a,b)=>a+b,0);
  let acc = 0; const fatias = Object.entries(A.pags).sort((a,b)=>b[1]-a[1]).map(([f,v])=>{ const p = v/totPag*100, o = {f, v, p, ini:acc}; acc += p; return o; });
  const feedCor = id => (M.equipe.find(c=>c.id===id)||{cor:'#F5B524'});
  return `<div class="arena ${tv?'tv':''}">
    <div class="ar-topo"><div><h2>Arena de vendas <span>· ${nomeMes(A.ym).split(' ')[0]}</span></h2><div class="sub"><span class="vivo"></span> ao vivo · atualiza sozinha · ritmo esperado hoje: ${Math.round(A.ritmo)}% do mês</div></div>
      <div class="acoes">${tv?`<button class="btn p" onclick="arenaSairTV()"><i class="ti ti-x"></i> Sair do modo TV</button>`:`${S.sess?`<button class="btn p ouro" onclick="S.portalTab='pdv';render()"><i class="ti ti-shopping-cart"></i> Vender</button>`:''}<button class="btn p" onclick="arenaTV()"><i class="ti ti-device-tv"></i> Modo TV</button>`}</div></div>
    <div class="ar-hero">
      <div class="ar-num ouro" style="--i:0"><i class="ti ti-flame bg-ico"></i><small>Vendido hoje</small>${cu('hoje', Math.round(A.hojeTot))}<span>${A.nHoje} venda(s) no PDV</span></div>
      <div class="ar-num" style="--i:1"><i class="ti ti-receipt bg-ico"></i><small>Ticket médio hoje</small>${cu('tkh', Math.round(A.ticketHoje))}<span>valor médio por venda</span></div>
      <div class="ar-num" style="--i:2"><i class="ti ti-calendar-stats bg-ico"></i><small>Total do mês</small>${cu('mes', Math.round(A.total))}<span>as duas lojas</span></div>
      <div class="ar-num" style="--i:3"><i class="ti ti-shopping-bag bg-ico"></i><small>Vendas no mês</small>${cu('nm', A.pv.length, 'n')}<span>${A.pv.length?'ticket '+brl(A.pv.reduce((s,v)=>s+v.total,0)/A.pv.length):'pelo PDV'}</span></div>
    </div>
    <div class="ar-lojas">${A.lojas.map(L=>`<div class="ar-loja">${gaugeSVG(L, A.ritmo, tv?180:150)}<div class="info"><h3>Loja ${esc(L.l.nome)}</h3><div class="v">${cu('lj'+L.k, Math.round(L.val))}</div>
        ${L.mt?`<div class="faixas"><span class="${L.val>=L.mt.meta?'ok':''}">Meta ${brl(L.mt.meta)}</span><span class="${L.val>=L.mt.super?'ok':''}">Super ${brl(L.mt.super)}</span><span class="${L.val>=L.mt.hiper?'ok':''}">Hiper ${brl(L.mt.hiper)}</span></div>`:''}
        <div class="ritmo-txt">${ritmoTxt(L)}</div></div></div>`).join('')}</div>
    <div class="ar-bloco"><h3>🏁 Corrida da meta <small>quem chega primeiro na bandeira?</small></h3><div class="corrida">${lanes||'<p class="apagado">Nenhuma vendedora ativa.</p>'}</div></div>
    <div class="ar-gente">${cards}</div>
    <div class="ar-baixo">
      <div class="ar-bloco"><h3><span class="vivo"></span> Acabou de vender <small>hoje</small></h3><div class="feed">${A.feed.length?A.feed.map((v,i)=>`<div style="--i:${i}" class="${ARENA.vistos&&!ARENA.vistos.has(v.id)?'novo':''}">${avatar(feedCor(v.colaboradora_id),'',34).replace('lob-av','lob-av av')}<div><b>${esc(primeiroNome(v.colaboradora))}</b><small>${v.hora} · ${v.qtd_itens} ${v.qtd_itens===1?'item':'itens'} · ${FORMAS[v.pagamento]?.n||v.pagamento} · ${esc(S.boot.lojas[v.loja]?.nome||'')}</small></div><span class="v">${brl(v.total)}</span></div>`).join(''):'<p class="apagado" style="font-size:14px">Nenhuma venda no PDV hoje ainda. A primeira aparece aqui na hora. ⚡</p>'}</div></div>
      <div class="ar-bloco"><h3>⏱️ Ritmo do dia <small>vendas por hora</small></h3><div class="horas">${A.horas.map(h=>`<div><i class="${h.h===hAgora?'agora':''}" data-alvo="${h.v/maxH*100}" style="height:${ARENA.prev['h'+h.h]??0}%">${h.v?`<span>${h.v>=1000?(h.v/1000).toFixed(1).replace('.',',')+'k':Math.round(h.v)}</span>`:''}</i><small>${h.h}h</small></div>`).join('')}</div></div>
      <div class="ar-bloco"><h3>🔥 Mais vendidos <small>no mês</small></h3><div class="tops">${A.top.length?A.top.map(t=>`<div><div class="lb"><span>${emojiDe(t)} ${esc(t.nome)}</span><span>${t.qtd} un · ${brl(t.val)}</span></div><div class="br"><i data-alvo="${t.qtd/maxTop*100}"></i></div></div>`).join(''):'<p class="apagado" style="font-size:14px">Aparece quando as vendas passarem pelo PDV.</p>'}</div>
        ${totPag?`<div class="donut-wrap"><svg class="donut" viewBox="0 0 42 42">${fatias.map(x=>`<circle cx="21" cy="21" r="15.9" pathLength="100" stroke="${FORMAS[x.f]?.c||'#999'}" stroke-dasharray="0 100" data-alvo="${x.p}" stroke-dashoffset="${-x.ini}"/>`).join('')}</svg><div class="legenda">${fatias.map(x=>`<span><i style="background:${FORMAS[x.f]?.c||'#999'}"></i>${FORMAS[x.f]?.n||x.f} · ${Math.round(x.p)}%</span>`).join('')}</div></div>`:''}</div>
    </div></div>`;
}
function anelArena(p){
  const tam = 64, r = tam/2-7, c = 2*Math.PI*r, pr = ARENA.prev['a'+p.c.id] ?? 0;
  return `<div class="anel" style="width:${tam}px;height:${tam}px"><svg viewBox="0 0 ${tam} ${tam}"><circle cx="${tam/2}" cy="${tam/2}" r="${r}" class="trilho"/><circle cx="${tam/2}" cy="${tam/2}" r="${r}" class="cheio" data-k="a${p.c.id}" data-alvo="${Math.min(100,p.pct)}" style="stroke-dasharray:${c};stroke-dashoffset:${c*(1-pr/100)}"/></svg><div><b class="num" style="font-size:15px">${p.mt?Math.floor(p.pct)+'%':'—'}</b></div></div>`;
}
function portalArena(){ return arenaHTML(false); }
function admArena(){ return arenaHTML(false); }

/* anima tudo que tem data-alvo / data-cu depois de desenhar */
function arenaAnimar(raiz){
  if(!raiz) return;
  raiz.querySelectorAll('[data-cu]').forEach(el=>{ const k = el.dataset.k, v = Number(el.dataset.cu)||0, de = ARENA.num[k] ?? 0; ARENA.num[k] = v; contar(el, de, v, el.dataset.f||'brl', 1500); });
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    raiz.querySelectorAll('.gauge .val[data-alvo]').forEach(el=>{ const v = Number(el.dataset.alvo); el.style.strokeDasharray = v+' 100'; ARENA.prev[el.dataset.k] = v; });
    raiz.querySelectorAll('.lane').forEach(l=>{ const id = l.dataset.id, ra = l.querySelector('.rastro'), co = l.querySelector('.corredora'); ra.style.width = ra.dataset.alvo+'%'; co.style.left = co.dataset.alvo+'%'; ARENA.prev['l'+id] = Number(ra.dataset.alvo); });
    raiz.querySelectorAll('.ar-pessoa .cheio[data-alvo]').forEach(el=>{ const c = parseFloat(el.style.strokeDasharray); el.style.strokeDashoffset = c*(1-Number(el.dataset.alvo)/100); ARENA.prev[el.dataset.k] = Number(el.dataset.alvo); });
    raiz.querySelectorAll('.horas i[data-alvo]').forEach((el,i)=>{ el.style.transitionDelay = (i*40)+'ms'; el.style.height = el.dataset.alvo+'%'; ARENA.prev['h'+(i+8)] = Number(el.dataset.alvo); });
    raiz.querySelectorAll('.tops i[data-alvo]').forEach((el,i)=>{ el.style.transitionDelay = (i*80)+'ms'; el.style.width = el.dataset.alvo+'%'; });
    raiz.querySelectorAll('.donut circle[data-alvo]').forEach(el=>{ el.style.strokeDasharray = el.dataset.alvo+' 100'; });
  }));
  // troca de posição na corrida desliza (FLIP)
  const novas = {}; raiz.querySelectorAll('.lane').forEach(l=>{ novas[l.dataset.id] = l.getBoundingClientRect().top; });
  if(!semMov()) raiz.querySelectorAll('.lane').forEach(l=>{ const a = ARENA.pos[l.dataset.id]; if(a==null) return; const dy = a - novas[l.dataset.id]; if(Math.abs(dy)<2) return; l.style.transition='none'; l.style.transform=`translateY(${dy}px)`; requestAnimationFrame(()=>requestAnimationFrame(()=>{ l.style.transition=''; l.style.transform=''; })); });
  ARENA.pos = novas;
  if(!ARENA.vistos) ARENA.vistos = new Set(pdvD().vendas.map(v=>v.id));
}
function arenaGuardarPos(){ document.querySelectorAll('.arena .lane').forEach(l=>{ ARENA.pos[l.dataset.id] = l.getBoundingClientRect().top; }); }

/* atualização automática + "flash" quando entra venda nova */
function naArena(){ return ARENA.tv || (S.tela==='portal' && S.portalTab==='arena') || (S.tela==='admin' && S.adm?.tab==='arena'); }
function arenaLigar(){
  if(ARENA.timer) return;
  ARENA.timer = setInterval(arenaBuscar, 30000);
}
async function arenaBuscar(){
  if(!naArena()){ clearInterval(ARENA.timer); ARENA.timer = null; return; }
  if(ARENA.buscando || document.hidden) return;
  ARENA.buscando = true;
  try{
    if(S.adm){
      const r = await api('admAoVivo', S.adm.cred), d = S.adm.dados, ym = mesDe(r.hoje);
      d.vendas = (d.vendas||[]).filter(v=>!v.data.startsWith(ym)).concat(r.vendas||[]); d.metas = r.metas; d.liderId = r.liderId;
      if(d.pdv && r.pdvHoje) d.pdv.vendas = d.pdv.vendas.filter(v=>v.data!==r.hoje).concat(r.pdvHoje);
    } else if(S.sess){
      S.sess.dados = await api('dados', {eid:S.sess.eid, ...S.sess.cred});
    }
    const novas = pdvD().vendas.filter(v=>v.status!=='cancelada' && v.data===hojeISO() && ARENA.vistos && !ARENA.vistos.has(v.id));
    if(ARENA.tv) arenaPintarTV(); else if(naArena() && !modalAberto() && !$('#festa')){ arenaGuardarPos(); render(); }
    novas.slice(-3).forEach((v,i)=>setTimeout(()=>arenaFlash(v), i*3300));
    pdvD().vendas.forEach(v=>ARENA.vistos?.add(v.id));
  }catch(e){} finally{ ARENA.buscando = false; }
}
function arenaFlash(v){
  if(semMov()) return;
  const M = metasDe(mesDe(hojeISO())), c = M.equipe.find(x=>x.id===v.colaboradora_id) || {nome:v.colaboradora, cor:'#F5B524'};
  const el = document.createElement('div'); el.className='flash';
  el.innerHTML = `<div>${avatar(c,'',58).replace('lob-av','lob-av av')}<div><b>${esc(primeiroNome(c.nome))} vendeu!</b><small>${v.qtd_itens} ${v.qtd_itens===1?'item':'itens'} · Loja ${esc(S.boot.lojas[v.loja]?.nome||'')}</small></div><span class="v">+${brl(v.total)}</span></div>`;
  document.body.appendChild(el); chuvaConfete(); setTimeout(()=>el.remove(), 3300);
}
function arenaTV(){
  ARENA.tv = true; document.body.classList.add('tv-on');
  const t = document.createElement('div'); t.className='tv-tela'; t.id='tv-tela'; document.body.appendChild(t);
  arenaPintarTV(); arenaLigar();
  try{ document.documentElement.requestFullscreen?.(); }catch(e){}
}
function arenaPintarTV(){ const t = $('#tv-tela'); if(!t) return; arenaGuardarPos(); t.innerHTML = arenaHTML(true); arenaAnimar(t); }
function arenaSairTV(){ ARENA.tv = false; document.body.classList.remove('tv-on'); $('#tv-tela')?.remove(); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} render(); }
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && ARENA.tv) arenaSairTV(); });
document.addEventListener('keydown', ev=>{ // "/" foca a busca do PDV
  if(ev.key==='/' && $('#pdv-q') && document.activeElement?.tagName!=='INPUT' && document.activeElement?.tagName!=='TEXTAREA' && !modalAberto()){ ev.preventDefault(); $('#pdv-q').focus(); }
});

/* ───────── gancho no render: monta PDV/Arena depois de desenhar ───────── */
const _renderV6 = render;
render = function(){
  _renderV6();
  if($('#pdv-raiz')){ pdvPintar(); if(window.innerWidth>900 && !modalAberto()) setTimeout(()=>$('#pdv-q')?.focus(), 30); }
  const ar = document.querySelector('#app .arena'); if(ar){ arenaAnimar(ar); arenaLigar(); }
};

