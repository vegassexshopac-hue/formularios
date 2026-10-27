/* ═══════ PORTAL EQUIPE LAS VEGAS · v6 — tela inicial ao vivo (o "saguão"): visível para todos, sem login ═══════
   Substitui a telaInicio do app1.js. Mostra só o que pode ficar à vista: presença por primeiro nome,
   meta em % (nunca em reais), checklist do dia, eventos, quantidade de avisos e frase do dia. */

const LOB = {num:{}, frase:-1, ultimo:''};
const pad2 = n => String(n).padStart(2,'0');

function lojaStatus(l, d){
  const hoje = isoD(d), min = d.getHours()*60+d.getMinutes(), abre = toM(l.abre), fecha = toM(l.fecha);
  const fechadoHoje = d.getDay()===0 || (S.boot.regras?.feriados||[]).includes(hoje);
  if(!fechadoHoje && min>=abre && min<fecha){ const f = fecha-min; return {aberta:true, txt:`Aberta · fecha em ${f>=60?Math.floor(f/60)+'h'+pad2(f%60):f+' min'}`}; }
  if(!fechadoHoje && min<abre) return {aberta:false, txt:`Fechada · abre às ${l.abre}`};
  return {aberta:false, txt:`Fechada · abre ${d.getDay()===6?'segunda':'amanhã'} às ${l.abre}`};
}
function relogioGrande(d){
  const t = pad2(d.getHours())+pad2(d.getMinutes());
  return `<div class="neon-relogio" aria-label="${t.slice(0,2)}:${t.slice(2)}"><span class="dig" data-i="0">${t[0]}</span><span class="dig" data-i="1">${t[1]}</span><span class="dois">:</span><span class="dig" data-i="2">${t[2]}</span><span class="dig" data-i="3">${t[3]}</span></div>
    <div class="seg-barra"><i id="seg-barra" style="width:${d.getSeconds()/60*100}%"></i></div>`;
}
function tickLobby(){
  const d = agoraServidor();
  const b = $('#seg-barra'); if(b) b.style.width = (d.getSeconds()/60*100)+'%';
  const t = pad2(d.getHours())+pad2(d.getMinutes());
  document.querySelectorAll('.neon-relogio .dig').forEach(el=>{ const v = t[el.dataset.i]; if(el.textContent!==v){ el.textContent = v; el.classList.remove('troca'); void el.offsetWidth; el.classList.add('troca'); } });
  if(d.getSeconds()===0) document.querySelectorAll('[data-loja-st]').forEach(el=>{ const st = lojaStatus(S.boot.lojas[el.dataset.lojaSt], d); el.textContent = st.txt; el.parentNode.classList.toggle('aberta', st.aberta); });
}
setInterval(()=>{ if(S.tela==='inicio') tickLobby(); }, 1000);
setInterval(()=>{ const f = $('#frase'); const fr = S.boot?.painel?.frases||[]; if(!f || fr.length<2) return; LOB.frase = (Math.max(0,LOB.frase)+1)%fr.length; f.classList.remove('vem'); void f.offsetWidth; f.textContent = fr[LOB.frase]; f.classList.add('vem'); }, 12000);
setInterval(async ()=>{   // a tela inicial se atualiza sozinha (presença, metas, checklist)
  if(S.tela!=='inicio' || modalAberto() || document.visibilityState!=='visible' || !S.api) return;
  try{ const b = await api('boot'); const assin = JSON.stringify([b.painel, b.calendario, b.escala, b.colaboradoras.map(c=>c.temPin)]);
    S.boot = b; LS.set('lv_boot', b); if(assin!==LOB.ultimo && S.tela==='inicio' && !modalAberto()){ LOB.ultimo = assin; render(); } }catch(e){}
}, 60000);

function contaNum(k, v, suf=''){ return `<b class="num conta" data-k="${k}" data-v="${v}" data-s="${suf}">${v}${suf}</b>`; }
function animarContas(){
  document.querySelectorAll('.conta').forEach(el=>{
    const k = el.dataset.k, v = Number(el.dataset.v)||0, s = el.dataset.s||'', de = LOB.num[k] ?? 0; LOB.num[k] = v;
    if(de===v || matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent = v+s; return; }
    const t0 = performance.now(), dur = 1100;
    const passo = t => { const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3); el.textContent = Math.round(de+(v-de)*e)+s; if(p<1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  });
}
function avatar(c, st, tam){
  return `<span class="lob-av ${st||''}" style="--cor:${esc(c.cor||'#F5B524')};${tam?`width:${tam}px;height:${tam}px`:''}">${esc(iniciais(c.nome))}</span>`;
}
const ST_TXT = {ativa:'trabalhando', almoco:'no almoço', pausa:'na pausa', saiu:'já saiu'};

function blocoLojasAgora(d, hoje){
  const P = S.boot.painel||{}, agora = P.agora||[], eq = S.boot.colaboradoras;
  return Object.entries(S.boot.lojas).map(([k,l])=>{
    const st = lojaStatus(l, d), aqui = agora.filter(a=>a.loja===k).sort((a,b)=>(a.st==='saiu')-(b.st==='saiu'));
    const esperando = (S.boot.escala||[]).filter(e=>e.data===hoje && e.loja===k && !agora.some(a=>a.eid===e.colaboradora_id)).map(e=>{ const c = eq.find(x=>x.id===e.colaboradora_id); if(!c) return ''; const t = ((S.boot.turnos||{})[k]||{})[e.turno==='dia'?'abertura':e.turno]; return `<span class="esperando">${avatar(c,'fora',28)} ${esc(primeiroNome(c.nome))}${t?` <small>${esc(String(t).split(/[–-]/)[0])}</small>`:''}</span>`; }).join('');
    return `<div class="lob-loja ${st.aberta?'aberta':''}">
      <div class="linha entre quebra"><b class="lob-nome">Loja ${esc(l.nome)}</b><span class="lob-st"><i></i><span data-loja-st="${k}">${st.txt}</span></span></div>
      <div class="lob-pessoas">${aqui.map(a=>`<div class="lob-p ${a.st}">${avatar(a, a.st, 52)}<b>${esc(a.nome)}</b><small>${ST_TXT[a.st]} · ${esc(a.desde)}</small></div>`).join('') || `<p class="apagado lob-vazio">${st.aberta?'Ninguém bateu o ponto aqui ainda.':'Loja vazia agora.'}</p>`}</div>
      ${esperando?`<div class="lob-esperando"><small>Na escala de hoje</small>${esperando}</div>`:''}
    </div>`;
  }).join('');
}
function blocoCorrida(hoje){
  const P = S.boot.painel||{}, meta = P.meta||{};
  const [y,m] = hoje.split('-').map(Number), diasMes = new Date(y,m,0).getDate(), ritmo = Math.round(Number(hoje.slice(8))/diasMes*100);
  const pistas = Object.entries(S.boot.lojas).map(([k,l])=>{
    const mt = meta[k]; if(!mt) return `<div class="pista-l"><div class="linha entre"><b>Loja ${esc(l.nome)}</b><span class="apagado">meta do mês não definida</span></div></div>`;
    const max = Math.max(mt.hiperPct, mt.pct, 100), x = v => Math.min(100, v/max*100);
    const faixa = mt.pct>=mt.hiperPct?'Hiper meta! 🏆':mt.pct>=mt.superPct?'Super meta! 🥳':mt.pct>=100?'Meta batida! 🎉':'';
    const dif = mt.pct - ritmo;
    return `<div class="pista-l"><div class="linha entre quebra"><b>Loja ${esc(l.nome)}</b><span class="pista-pct">${contaNum('m'+k, mt.pct, '%')}<small> da meta</small></span></div>
      <div class="pista"><i class="pista-fill" style="--w:${x(mt.pct)}%"></i>
        <span class="bandeira" style="left:${x(100)}%" title="Meta"></span><span class="bandeira s" style="left:${x(mt.superPct)}%" title="Super meta"></span><span class="bandeira h" style="left:${x(mt.hiperPct)}%" title="Hiper meta"></span>
        <span class="ritmo" style="left:${x(ritmo)}%" title="Ritmo do mês"></span>
        <span class="corredor" style="--w:${x(mt.pct)}%"></span></div>
      <div class="linha entre quebra pista-leg"><span>${faixa || (dif>=0?`<span class="pos">${dif} pontos na frente do ritmo 🔥</span>`:`<span class="warn-t">${-dif} pontos abaixo do ritmo — bora!</span>`)}</span><span class="apagado">meta · super · hiper</span></div></div>`;
  }).join('');
  return `<div class="lob-card corrida"><div class="linha entre quebra"><h3>Corrida da meta</h3><small class="apagado">${nomeMes(hoje.slice(0,7)).split(' ')[0]} · ${ritmo}% do mês já passou</small></div>${pistas}
    ${P.destaque?`<div class="destaque"><span>⭐</span><div><small>Destaque de vendas do mês</small><b>${esc(P.destaque)}</b></div></div>`:''}</div>`;
}
function blocoEventos(hoje){
  const ev = (S.boot.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && (e.data_fim||e.data)>=hoje).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,4);
  const quando = e => { const n = Math.round((dt(e.data)-dt(hoje))/864e5); return n<=0?'é hoje!':n===1?'amanhã':`em ${n} dias`; };
  return `<div class="lob-card"><h3>Vem aí</h3>${ev.length?ev.map(e=>{ const t = TIPO_EV[e.tipo]||TIPO_EV.evento; return `<div class="evento"><div class="dia-bloco"><b>${e.data.slice(8)}</b><small>${dt(e.data).toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}</small></div><div class="cresce"><b>${t.e} ${esc(e.titulo)}</b><small>${t.n}${e.loja&&S.boot.lojas[e.loja]?' · Loja '+esc(S.boot.lojas[e.loja].nome):''}</small></div><span class="falta ${quando(e)==='é hoje!'?'hoje':''}">${quando(e)}</span></div>`; }).join(''):'<p class="apagado">Nenhum evento marcado. A agenda fica lá embaixo.</p>'}</div>`;
}
function blocoChecklist(){
  const c = S.boot.painel?.checklist||{};
  return `<div class="lob-card"><h3>Checklist de hoje</h3>${Object.entries(S.boot.lojas).map(([k,l])=>{ const x = c[k]||{ok:0,total:0}, p = x.total?Math.round(x.ok/x.total*100):0;
    return `<div class="chk-l"><div class="linha entre"><span>Loja ${esc(l.nome)}</span><b class="num ${p===100?'pos':''}">${x.ok}/${x.total}${p===100?' ✨':''}</b></div><div class="medidor"><i style="width:${p}%"></i></div></div>`; }).join('')}
    <p class="apagado" style="font-size:12.5px;margin-top:8px">Cada item é marcado no portal por quem fez.</p></div>`;
}
function blocoFrase(){
  const fr = S.boot.painel?.frases||[], n = S.boot.painel?.avisos||0;
  if(fr.length && (LOB.frase<0 || LOB.frase>=fr.length)) LOB.frase = Number(hojeISO().slice(8)) % fr.length;
  return `<div class="lob-card frase-card"><span class="aspas">“</span><p id="frase" class="vem">${esc(fr[LOB.frase]||'O que acontece em Vegas, fica em Vegas.')}</p>
    ${n?`<div class="aviso-teaser"><i class="ti ti-speakerphone"></i><span><b>${n} aviso${n>1?'s':''} da semana</b> no mural. Entre no seu portal para ler.</span></div>`:''}</div>`;
}
function itensTicker(d, hoje){
  const P = S.boot.painel||{}, it = [];
  const trab = (P.agora||[]).filter(a=>a.st==='ativa').length;
  it.push(trab?`🟢 ${trab} pessoa${trab>1?'s':''} trabalhando agora`:'🌙 Nenhum ponto aberto agora');
  Object.entries(S.boot.lojas).forEach(([k,l])=>{ const m = (P.meta||{})[k]; if(m) it.push(`🏁 Loja ${l.nome}: ${m.pct}% da meta do mês`); const c = (P.checklist||{})[k]; if(c&&c.total) it.push(`✅ Checklist ${l.nome}: ${c.ok} de ${c.total}`); });
  const ev = (S.boot.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && e.data>=hoje).sort((a,b)=>a.data.localeCompare(b.data))[0];
  if(ev){ const n = Math.round((dt(ev.data)-dt(hoje))/864e5); it.push(`💝 ${ev.titulo} ${n<=0?'é hoje':n===1?'é amanhã':'em '+n+' dias'}`); }
  if(P.avisos) it.push(`📢 ${P.avisos} aviso${P.avisos>1?'s':''} no mural — entre para ler`);
  if(P.destaque) it.push(`⭐ Destaque do mês: ${P.destaque}`);
  (S.boot.calendario?.ausencias||[]).filter(a=>a.data===hoje && a.tipo==='folga').forEach(a=>it.push(`🌴 ${a.nome} está de folga hoje`));
  it.push('✨ O que acontece em Vegas, fica em Vegas');
  return it;
}

function telaInicio(){
  const b = S.boot, d = agoraServidor(), hoje = hojeISO(), intro = S.primeiraVez && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const presentes = new Set((b.painel?.agora||[]).filter(a=>a.st!=='saiu').map(a=>a.eid));
  const todas = b.colaboradoras.slice().sort((x,y)=>x.nome.localeCompare(y.nome));
  const card = c => `<button class="lob-pessoa ${presentes.has(c.id)?'on':''}" onclick="abrirPin('${c.id}')">${avatar(c, presentes.has(c.id)?'ativa':'', 46)}
      <span class="cresce"><b>${esc(primeiroNome(c.nome))}</b><small>${c.temPin ? (modoLoja()?'Bater o ponto':'Entrar no portal') : '<span class="neg">PIN não criado</span>'}</small></span><i class="ti ti-chevron-right"></i></button>`;
  const h = d.getHours(), saud = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const tk = itensTicker(d, hoje), tkHtml = tk.map(t=>`<span>${esc(t)}</span><i class="sep">✦</i>`).join('');
  const pessoas = `<section class="lob-sec quem" style="--i:2"><div class="linha entre quebra"><h2 class="lob-h">${modoLoja()?'Quem vai bater o ponto?':'Quem é você?'}</h2><small class="apagado">${modoLoja()?'Toque no seu nome e digite o PIN':'Toque no seu nome para entrar no seu portal'}</small></div>
      <div class="lob-pessoas-grade">${todas.map(card).join('') || '<p class="suave">Ninguém cadastrado ainda.</p>'}</div></section>`;
  setTimeout(()=>{ animarContas(); }, intro?500:0);
  LOB.ultimo = JSON.stringify([b.painel, b.calendario, b.escala, b.colaboradoras.map(c=>c.temPin)]);
  return `<div class="wrap lobby ${intro?'intro':''}">${letreiro(`<div class="linha" style="margin-left:auto;gap:8px"><span class="ao-vivo-chip"><i></i> ao vivo</span></div>`)}
    ${S.fila.length?`<div class="faixa"><i class="ti ti-cloud-upload"></i> ${S.fila.length} marcação(ões) guardada(s) sem internet. Envio automático quando a conexão voltar.</div>`:''}
    <section class="lob-hero lob-sec" style="--i:0">
      <div class="hero-txt"><div class="hero-saud">${saud}, equipe Las Vegas</div><div class="hero-data">${esc(dataLonga(hoje))}</div>
        ${modoLoja()?'':`<button class="btn ouro hero-entrar" onclick="document.querySelector('.quem').scrollIntoView({behavior:'smooth',block:'start'})"><i class="ti ti-login-2"></i> Entrar no meu portal</button>`}
        <div class="hero-lojas">${Object.entries(b.lojas).map(([k,l])=>{ const st = lojaStatus(l, d); return `<span class="pill-loja ${st.aberta?'aberta':''}"><i></i>${esc(l.nome)} · <span data-loja-st="${k}">${st.txt}</span></span>`; }).join('')}</div></div>
      <div class="hero-rel">${relogioGrande(d)}</div>
    </section>
    <div class="ticker lob-sec" style="--i:1;--dur:${Math.max(28, tk.length*7)}s"><div class="ticker-trilho">${tkHtml}${tkHtml}</div></div>
    ${modoLoja()?pessoas:''}
    <div class="lob-grade">
      <section class="lob-card lob-sec agora-card" style="--i:3"><div class="linha entre quebra"><h3>Agora nas lojas</h3><small class="apagado">atualiza sozinho</small></div><div class="lob-lojas">${blocoLojasAgora(d, hoje)}</div></section>
      <section class="lob-sec" style="--i:4">${blocoCorrida(hoje)}</section>
    </div>
    ${modoLoja()?'':pessoas}
    <div class="lob-grade tres">
      <section class="lob-sec" style="--i:5">${blocoEventos(hoje)}</section>
      <section class="lob-sec" style="--i:6">${blocoChecklist()}</section>
      <section class="lob-sec" style="--i:7">${blocoFrase()}</section>
    </div>
    ${!modoLoja() && b.exigirAparelho ? `<div class="nota info" style="margin-top:14px"><i class="ti ti-device-desktop"></i><div>O ponto é batido no computador da loja. No celular você entra no seu portal: mês, banco de horas, metas, pedidos, protocolos e treinamento.</div></div>`:''}
    <h2 class="secao" style="margin-top:22px">Agenda da equipe <small>atualiza sozinha</small></h2>
    ${calendario(b.calendario, false)}
    ${rodape()}</div>`;
}

/* v7: PDV (Vender) + Arena de vendas — carrega logo depois deste arquivo, antes do app4 (que inicia o app) */
/* v8: Roleta do site (Administração › Roleta do site) */
document.write('<link rel="stylesheet" href="pdv.css?v=7"><script src="app8.js?v=15"><\/script><script src="app8b.js?v=7"><\/script><script src="app8c.js?v=7"><\/script><script src="app9.js?v=15"><\/script>');
