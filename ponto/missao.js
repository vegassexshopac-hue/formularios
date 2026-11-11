/* ═══════════ Portal Equipe Las Vegas · v54 — MISSÃO DO DIA ═══════════
   Stories das "Ofertas do Dia" do site valendo pontos (Campanha do mês › Missão do Dia).
   Equipe: escolhe 1 produto da oferta de hoje, posta no Instagram da loja no horário do rodízio e manda o print
   do story no ar; depois manda o print dos números. A IA do servidor confere os prints (MISSAO.gs) — o que ela
   não consegue ler vai para a administração. Os pontos viram raspadinha extra.
   Administração (Campanha › Missão do Dia): prints para conferir, ofertas e escala de hoje, ranking, regras.
   Carregado logo depois do campanha.js (que tem os ganchos msSubs / msTela / msInicio / msAdm…). */
const MS = { adm:null, escolha:null, alvo:null, cfgAberta:false, _c:{} };
(function(){
  const css = `
.ms-topo{background:linear-gradient(125deg,#1C1416,#4a0d2c 50%,#E3101F)}
.ms-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.ms-chips span{background:rgba(255,255,255,.16);border-radius:99px;padding:4px 10px;font-size:12.5px;font-weight:700}
.ms-passo{background:#fff;border:1px solid var(--linha2);border-radius:18px;padding:14px;margin-bottom:10px;animation:cpSobe .35s both}
.ms-passo h4{margin:0 0 8px;font-size:15px;display:flex;gap:8px;align-items:center}
.ms-passo h4 i.n{flex:none;width:24px;height:24px;border-radius:50%;background:var(--vermelho);color:#fff;font-style:normal;font-size:13px;font-weight:900;display:grid;place-items:center}
.ms-of{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}
.ms-o{position:relative;border:2px solid var(--linha2);background:#fff;border-radius:14px;padding:0;overflow:hidden;font:inherit;text-align:left;cursor:pointer;transition:transform .15s var(--mola),box-shadow .15s;animation:cpPula .4s var(--mola) both}
.ms-o:hover{transform:translateY(-2px);box-shadow:var(--sh)}.ms-o:active{transform:scale(.96)}
.ms-o .ft{aspect-ratio:1;background:var(--veludo2) center/cover no-repeat;display:block}
.ms-o .tx{padding:7px 9px 9px;display:block}.ms-o .tx b{display:block;font-size:12.5px;line-height:1.25}.ms-o .tx small{color:var(--creme2);font-size:11.5px}
.ms-o.on{border-color:var(--vermelho);box-shadow:0 0 0 3px rgba(227,16,31,.18)}
.ms-o.on::after{content:'✔';position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:var(--vermelho);color:#fff;font-weight:900;display:grid;place-items:center;animation:cpCarimbo .4s var(--mola) both}
.ms-o.fora{opacity:.45;cursor:not-allowed}.ms-o.fora:hover{transform:none;box-shadow:none}
.ms-o .tag{position:absolute;top:6px;left:6px;background:#F5B524;color:#1C1416;border-radius:99px;padding:2px 8px;font-size:10.5px;font-weight:900}
.ms-o .tag.tm{background:#1C1416;color:#fff}
.ms-acao{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ms-st{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:center;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px;animation:cpSobe .3s both}
.ms-st img{width:64px;height:96px;object-fit:cover;border-radius:10px;background:var(--veludo2);cursor:zoom-in}
.ms-st .nums{display:flex;gap:10px;flex-wrap:wrap;font-size:13px;font-weight:700;margin-top:3px}
.ms-st .bts{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.ms-pts{background:linear-gradient(120deg,#F5B524,#FFE08A);color:#1C1416;border-radius:99px;padding:3px 10px;font-size:12.5px;font-weight:900;white-space:nowrap}
.ms-rk{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:center;background:#fff;border-radius:16px;padding:10px 12px;box-shadow:var(--sh);animation:cpSobe .35s both}
.ms-rk .pos{font-size:24px;width:34px;text-align:center}.ms-rk .nm{font-weight:800}.ms-rk .vl{font-weight:900;font-size:17px}
.ms-rk .sub{grid-column:2/4;font-size:12px;color:var(--creme2);display:flex;gap:9px;flex-wrap:wrap}
.ms-rk .tr{grid-column:1/4;height:8px;border-radius:99px;background:var(--veludo2);overflow:hidden;margin-top:5px}
.ms-rk .tr i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),#F5B524);transform-origin:left;animation:cpCresce 1s var(--mola) both}
.ms-ex{display:flex;gap:10px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--linha);font-size:13.5px}
.ms-ex b{flex:none;min-width:44px;color:var(--ok)}.ms-ex small{color:var(--creme3);flex:none}
.ms-regras{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px}
.ms-regras div{background:#fff;border:1px solid var(--linha);border-radius:14px;padding:9px 10px;font-size:12.5px;line-height:1.3}
.ms-regras b{display:block;font-size:17px;color:var(--vermelho2)}
.ms-nums{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:6px 0}
.ms-nums label{font-size:11px;font-weight:700;color:var(--creme2);display:block}.ms-nums input{width:100%;padding:7px 6px}
.ms-conf{display:grid;grid-template-columns:84px 1fr;gap:12px;background:#fff;border:2px solid #F5B524;border-radius:16px;padding:10px;animation:cpSobe .3s both}
.ms-conf img{width:84px;height:140px;object-fit:cover;border-radius:10px;background:var(--veludo2);cursor:zoom-in}
.ms-esc{display:flex;gap:8px;flex-wrap:wrap}.ms-esc span{background:#fff;border:1px solid var(--linha2);border-radius:12px;padding:6px 10px;font-size:13px}
@media(max-width:560px){.ms-nums{grid-template-columns:repeat(3,minmax(0,1fr))}.ms-of{grid-template-columns:repeat(2,1fr)}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ───────── pedacinhos ───────── */
const msD = () => { const c = cpD(); return c && c.missao && !c.missao.erro ? c.missao : null; };
const msPts = n => (n===1 ? '1 ponto' : (n||0)+' pontos');
const msFotoG = u => String(u||'').replace('sz=w800', 'sz=w1600');
function msPendentes(m){
  if(!m || !m.participa || !m.comecou) return 0;
  const postar = (m.ofertas||[]).length && (!m.story || m.story.status==='recusado') ? 1 : 0;
  return postar + (m.numeros||[]).filter(s=>s.status==='ok' && (!s.num_status || s.num_status==='recusado')).length;
}
function msNums(s){ return `<span>👁 ${s.views}</span><span>💬 ${s.respostas}</span><span>🔗 ${s.cliques}</span><span>❤️ ${s.reacoes}</span><span>↗️ ${s.compart}</span>`; }

/* ganchos chamados pelo campanha.js */
function msSubs(c, subs){
  const m = msD(); if(!m || !m.ativa || !m.comecou) return;
  subs.unshift(['missao', 'ti-brand-instagram', 'Missão do Dia', msPendentes(m)]);
}
function msInicio(c){
  const m = msD(); if(!m || !m.ativa || !m.comecou || !m.participa) return '';
  const ir = `onclick="S.portalTab='campanha';CP.sub='missao';render()"`;
  const semStory = (m.ofertas||[]).length && (!m.story || m.story.status==='recusado');
  const nums = (m.numeros||[]).filter(s=>s.status==='ok' && (!s.num_status || s.num_status==='recusado')).length;
  if(semStory) return `<button class="rasp" ${ir}><span class="ic">📲</span><span><b>Missão do Dia: poste o seu story</b><small>seu horário hoje: ${esc(m.horario||'livre')} · vale ${msPts(m.regras.postou)}</small></span></button>`;
  if(nums) return `<button class="ouro" ${ir}><span class="ic">📊</span><span><b>Mande os números do seu story</b><small>${nums===1?'1 story esperando':nums+' stories esperando'} o print</small></span></button>`;
  return `<button ${ir}><span class="ic">⭐</span><span><b>${msPts(m.pontos_mes)} na Missão</b><small>faltam ${m.faltam} para a próxima raspadinha</small></span></button>`;
}

/* ───────── tela da vendedora ───────── */
function msTela(c){
  const m = msD();
  if(!m) return cpVazio('🛠️', 'A Missão do Dia ainda não foi ligada no servidor', 'Avise a administração.');
  const P = m.regras, por = m.por_raspadinha;
  let h = '';
  if(m.participa){
    const feito = por - m.faltam, pct = Math.min(100, feito/por*100);
    h += `<div class="cp-topo ms-topo"><div class="linha entre" style="gap:10px;align-items:flex-end"><div><h3>⭐ ${msPts(m.pontos_mes)} este mês</h3><p>Faltam <b>${m.faltam}</b> para a próxima raspadinha 🎟️ (a cada ${por} pontos)</p></div><span class="num">${feito}/${por}</span></div>
      <div class="barra"><i style="width:${pct}%"></i></div>
      <div class="ms-chips"><span>🔥 ${m.sequencia} dia${m.sequencia===1?'':'s'} seguido${m.sequencia===1?'':'s'}</span>${m.horario?`<span>⏰ seu horário hoje: ${esc(m.horario)}</span>`:''}<span>📲 @${esc(m.conta)}</span></div></div>`;
    const rs = m.raspadinhas||[];
    if(rs.length) h += `<div class="cp-grade" style="margin-bottom:12px">${rs.map((r,i)=>`<button class="cp-tick" style="animation-delay:${i*70}ms" onclick="cpAbrirRaspa('${r.data}')"><span class="em">🎟️</span><b>${cpRaspNome(r.data)}</b><small>toque para raspar</small></button>`).join('')}</div>`;
    h += msHoje(m);
    h += msMeusNumeros(m);
  } else h += `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-info-circle"></i><div>Você não está na Missão do Dia este mês, mas pode acompanhar o ranking.</div></div>`;
  h += msRanking(m);
  if(m.participa && (m.extrato||[]).length) h += `<h3 class="secao" style="margin-top:16px">De onde vieram os seus pontos</h3><div class="cartao pad">${m.extrato.map(e=>`<div class="ms-ex"><b>+${e.pts}</b><span class="cresce">${esc(e.txt)}</span><small>${cpDia(e.data)}</small></div>`).join('')}</div>`;
  const fx = (P.views||[]).map(f=>`<div><b>+${f.pts}</b>story com ${f.min} visualizações ou mais</div>`).join('');
  h += `<details class="cpa-como" ${m.participa && !m.pontos_mes?'open':''}><summary>❓ Como ganhar pontos</summary><div class="ms-regras">
      <div><b>+${P.postou}</b>postou o story da oferta do dia</div>
      <div><b>+${P.sequencia}</b>a cada ${P.sequencia_dias} dias seguidos postando</div>
      <div><b>+${P.resposta}</b>cada resposta/direct que o story gerou</div>
      <div><b>+${P.clique}</b>cada clique no link</div>
      <div><b>+${P.reacao}</b>cada curtida ou reação</div>
      <div><b>+${P.compart}</b>cada compartilhamento</div>${fx}
      <div><b>+${P.venda}</b>vendeu um produto da oferta do dia (conta sozinho pelo PDV)</div>
      <div><b>+${P.campea}</b>story campeão da semana</div></div>
    <p class="apagado" style="font-size:12.5px;margin:10px 0 0">Cada story soma no máximo ${P.teto_story} pontos de engajamento. O mesmo print não vale duas vezes. O horário roda todo dia, então todas passam pelo horário bom. Os números podem ser mandados até ${m.prazo_dias} dias depois do story.</p></details>
    <input type="file" accept="image/*" id="ms-arq" hidden onchange="msEnviar(this)">`;
  return h;
}
function msHoje(m){
  const s = m.story, of = m.ofertas||[], P = m.regras;
  if(s && s.status==='ok') return `<div class="ms-passo" style="border-color:var(--ok)"><h4>✅ Story de hoje valendo <span class="ms-pts">+${P.postou}</span></h4><div class="ms-st" style="border:0;padding:0"><img src="${esc(s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(s.url_post))}','_blank')"><div><b>${esc(s.produto)}</b><br><small class="apagado">Agora é vender esse produto (+${P.venda} por venda) e mandar o print dos números mais tarde ou amanhã.</small></div></div></div>`;
  if(s && s.status==='conferir') return `<div class="ms-passo" style="border-color:#F5B524"><h4>⏳ Story enviado — esperando a conferência</h4><div class="ms-st" style="border:0;padding:0"><img src="${esc(s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(s.url_post))}','_blank')"><div><b>${esc(s.produto)}</b><br><small class="apagado">A administração confere e os pontos entram. Você não precisa fazer mais nada agora.</small></div></div></div>`;
  if(m.domingo) return cpVazio('😴', 'Hoje não tem missão', 'A Missão do Dia roda de segunda a sábado.');
  if(!of.length) return cpVazio('🕐', 'As ofertas de hoje ainda não chegaram', 'Toque em atualizar daqui a pouco. Se continuar assim, avise a administração.');
  const livre = o => !o.tomada || o.tomada==='você';
  if(!MS.escolha || !of.some(o=>o.handle===MS.escolha && livre(o))) MS.escolha = (of.find(o=>o.handle===m.sugerida && livre(o)) || of.find(livre) || {}).handle || null;
  const esc1 = of.find(o=>o.handle===MS.escolha);
  const rec = s && s.status==='recusado' ? `<div class="nota" style="border-color:var(--vermelho);margin-bottom:10px"><i class="ti ti-alert-triangle"></i><div><b>O print de antes não valeu:</b> ${esc(s.obs||'mande de novo')}</div></div>` : '';
  return `${rec}<div class="ms-passo"><h4><i class="n">1</i> Escolha o produto do seu story</h4>
      <div class="ms-of">${of.map((o,i)=>`<button class="ms-o ${o.handle===MS.escolha?'on':''} ${livre(o)?'':'fora'}" style="animation-delay:${i*50}ms" ${livre(o)?`onclick="MS.escolha='${o.handle}';render()"`:'disabled'} title="${esc(o.nome)}">
        <span class="ft" style="background-image:url('${esc(o.foto)}')"></span>${!livre(o)?`<span class="tag tm">${esc(o.tomada)} já postou</span>`:o.handle===m.sugerida?'<span class="tag">sugestão pra você</span>':''}
        <span class="tx"><b>${esc(o.nome)}</b><small>${o.preco?brl(o.preco)+' · ':''}10% OFF hoje</small></span></button>`).join('')}</div>
      <p class="apagado" style="font-size:12.5px;margin:8px 0 0">Cada produto fica com uma vendedora. Não tem na sua loja? Escolha outro que esteja livre.</p></div>
    <div class="ms-passo"><h4><i class="n">2</i> Poste no Instagram da loja ${m.horario?`às ${esc(m.horario)}`:''}</h4>
      <p style="margin:0 0 8px;font-size:13.5px">Story em <b>@${esc(m.conta)}</b>, do seu jeito, mostrando <b>${esc(esc1?esc1.nome:'o produto')}</b> e avisando que hoje ele está com 10% OFF no site. Coloque a figurinha de link do produto.</p>
      <div class="ms-acao">${esc1?`<button class="btn" onclick="msCopiar('${esc(esc1.url)}')"><i class="ti ti-link"></i> Copiar o link do produto</button><a class="btn" href="${esc(esc1.url)}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Ver no site</a>`:''}</div></div>
    <div class="ms-passo"><h4><i class="n">3</i> Mande o print do story no ar <span class="ms-pts">+${P.postou}</span></h4>
      <p style="margin:0 0 8px;font-size:13.5px">Abra o story já publicado e tire o print (tem que aparecer o nome da loja no topo). ${m.ia?'O portal confere na hora.':'A administração confere.'}</p>
      <button class="btn pri" ${esc1?'':'disabled'} onclick="msPegar('postar')"><i class="ti ti-camera"></i> Mandar o print do story</button></div>`;
}
function msMeusNumeros(m){
  const L = (m.numeros||[]).filter(s=>s.status==='ok');
  if(!L.length) return '';
  const it = (s,i) => {
    let corpo, bt = '';
    if(s.num_status==='ok'){ corpo = `<div class="nums">${msNums(s)}</div>`; bt = `<button class="btn p" onclick="msPegar('numeros','${s.data}')"><i class="ti ti-refresh"></i> Atualizar com print novo</button>`; }
    else if(s.num_status==='conferir'){ corpo = `<small class="apagado">⏳ print dos números esperando a conferência</small>`; }
    else { corpo = `${s.num_status==='recusado'?`<small style="color:var(--bad);font-weight:700">${esc(s.obs||'O print não valeu')}</small><br>`:''}<small class="apagado">Abra o story, deslize para cima e tire o print das visualizações. Até ${cpDia(s.prazo)}.</small>`;
           bt = `<button class="btn pri" onclick="msPegar('numeros','${s.data}')"><i class="ti ti-chart-bar"></i> Mandar o print dos números</button>`; }
    return `<div class="ms-st" style="animation-delay:${i*40}ms"><img src="${esc(s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(s.url_post))}','_blank')">
      <div><div class="linha entre" style="gap:8px"><b>${esc(s.produto)}</b><span class="ms-pts">+${s.pontos}</span></div><small class="apagado">story de ${cpDia(s.data)}</small><br>${corpo}<div class="bts">${bt}</div></div></div>`; };
  return `<h3 class="secao" style="margin-top:14px">📊 Números dos seus stories</h3><div class="cp-lista">${L.map(it).join('')}</div>`;
}
function msRanking(m, eu){
  const R = m.ranking||[]; if(!R.length) return '';
  eu = eu === undefined ? S.sess?.eid : eu;
  const top = Math.max(1, ...R.map(p=>p.mes)), med = ['🥇','🥈','🥉'];
  return `<h3 class="secao" style="margin-top:16px">🏆 Ranking da Missão no mês</h3><div class="cp-rank">${R.map((p,i)=>`<div class="ms-rk" style="animation-delay:${i*70}ms;${p.id===eu?'outline:3px solid var(--vermelho)':''}">
      <span class="pos">${p.mes?(med[i]||'#'+(i+1)):'·'}</span><span class="nm">${esc(p.nome)} ${p.hoje==='ok'?'<span class="cp-ok">postou hoje</span>':p.hoje==='conferir'?'<span class="cp-pend">em conferência</span>':''}</span><span class="vl">${p.mes} pts</span>
      <span class="sub"><span>📲 ${p.stories} stor${p.stories===1?'y':'ies'}</span><span>🛍️ ${p.vendas} venda${p.vendas===1?'':'s'} da oferta</span><span>🔥 ${p.sequencia} seguido${p.sequencia===1?'':'s'}</span><span>📅 ${p.semana} na semana</span></span>
      <div class="tr"><i style="width:${p.mes/top*100}%;animation-delay:${i*70}ms"></i></div></div>`).join('')}</div>`;
}
async function msCopiar(t){ try{ await navigator.clipboard.writeText(t); }catch(e){ const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } toast('Link copiado ✔ Cole na figurinha de link do story.'); }
function msPegar(op, data){ MS.alvo = {op, data}; const i = $('#ms-arq'); if(i){ i.value = ''; i.click(); } }
async function msEnviar(inp){
  const f = inp.files && inp.files[0], a = MS.alvo; if(!f || !a) return;
  const m = msD(), antes = m ? m.pontos_mes : 0, rasp = m ? (m.raspadinhas||[]).length : 0;
  cpModal(a.op==='postar'?'📲 Conferindo o seu story':'📊 Lendo os números', `<div class="cp-vazio"><span class="em">🔎</span><b>${m && m.ia?'O portal está olhando o seu print…':'Enviando o seu print…'}</b><p style="margin:4px 0 0;font-size:13.5px">Leva uns segundos. Não feche esta tela.</p></div>`);
  try{
    const img = await cpFoto(f, 1600);
    const r = await api('missao', {eid:S.sess.eid, ...S.sess.cred, op:a.op, handle:MS.escolha, data:a.data, img});
    cpAtualizar(r.campanha); fecharModal();
    const d = msD(), ganhou = d ? d.pontos_mes - antes : 0, novas = d ? (d.raspadinhas||[]).length - rasp : 0;
    if(r.status==='ok'){
      toast(a.op==='postar' ? `Story conferido ✔ +${ganhou||d.regras.postou} pontos!` : `Números lidos ✔ ${r.numeros.views} visualizações${ganhou>0?' · +'+ganhou+' pontos':''}`);
      cpConfete(a.op==='postar'?60:40);
      if(novas > 0) setTimeout(()=>{ toast('🎟️ Você juntou pontos e liberou uma RASPADINHA!'); cpConfete(80); }, 2600);
    } else toast('Print recebido ✔ A administração vai conferir e os pontos entram depois.');
    render();
  }catch(e){ fecharModal(); render(); toast(e.message, true); }
}

/* ───────── administração ───────── */
async function msAdmApi(op, dados={}){ return api('admMissao', {...S.adm.cred, op, ...dados}); }
async function msAdmCarregar(){
  if(MS._c.adm) return; MS._c.adm = true;
  try{ MS.adm = await msAdmApi('painel'); }catch(e){ MS.adm = {erro:e.message}; } finally{ MS._c.adm = false; }
  cpRepintar();
}
/* recarrega junto com a campanha (botão Atualizar zera CP.adm) */
if(typeof cpAdmCarregar === 'function'){ const _cpAdmCarregarMs = cpAdmCarregar; cpAdmCarregar = function cpAdmCarregar(){ if(!MS._c.adm){ MS.adm = null; msAdmCarregar(); } return _cpAdmCarregarMs.apply(this, arguments); }; }
function msAdmFila(){
  const A = MS.adm; if(!A || A.erro) return [];
  const f = [];
  A.stories.forEach(s=>{ if(s.status==='conferir') f.push({s, parte:'post'}); if(s.status==='ok' && s.num_status==='conferir') f.push({s, parte:'num'}); });
  return f;
}
function msAdmPend(){ return msAdmFila().length; }
function msAdmPrecisa(precisa){
  if(!MS.adm){ msAdmCarregar(); return; }
  msAdmFila().forEach(({s, parte})=>precisa.push(`<div class="c34-it warn cpa-it"><img class="cpa-mini" src="${esc(parte==='num'?s.url_num:s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(parte==='num'?s.url_num:s.url_post))}','_blank')">
      <span class="cresce"><b>Missão do Dia: ${esc(s.colaboradora)} mandou ${parte==='num'?'os números do story':'o print do story'}</b><small>${esc(s.produto)} · ${cpDia(s.data)} · ${esc(s.obs||'confira se está certo')}</small></span>
      <span class="cpa-bts"><button class="btn pri" onclick="CP.admSub='missao';render()"><i class="ti ti-eye"></i> Conferir</button></span></div>`));
}
function msAdm34(I){
  if(!MS.adm){ msAdmCarregar(); return; }
  const n = msAdmPend();
  if(n) I.push({c:'warn', i:'ti-brand-instagram', t:`${n===1?'1 print':n+' prints'} da Missão do Dia para conferir`, s:msAdmFila().slice(0,3).map(x=>x.s.colaboradora).join(' · '), b:'Conferir', go:()=>{ S.adm.tab = 'campanha'; CP.admSub = 'missao'; }});
}
function msAdmTela(){
  const A = MS.adm;
  if(!A){ msAdmCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Carregando a Missão do Dia…</p>`; }
  if(A.erro) return `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(A.erro)?'<b>Falta instalar o servidor da Missão do Dia.</b> Cole o arquivo MISSAO.gs no Apps Script e publique uma Nova versão.':esc(A.erro)}<br><button class="btn p" style="margin-top:8px" onclick="MS.adm=null;render()">Tentar de novo</button></div></div>`;
  const cfg = A.cfg, P = cfg.pontos, fila = msAdmFila();
  const nome = {}; A.escala.forEach(e=>nome[e.id]=e);
  const hojeSt = {}; A.stories.forEach(s=>{ if(s.data===A.hoje) hojeSt[s.colaboradora_id] = s; });
  const conf = ({s, parte}) => parte==='post'
    ? `<div class="ms-conf"><img src="${esc(s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(s.url_post))}','_blank')"><div><b>${esc(s.colaboradora)}</b> · story de ${cpDia(s.data)}<br><small>${esc(s.produto)}</small><br><small class="apagado">${esc(s.obs||'')}</small>
        <div class="linha quebra" style="gap:6px;margin-top:8px"><button class="btn pri" onclick="msAdmDecidir('${esc(s.id)}','post',true)"><i class="ti ti-check"></i> É o story, aprovar</button><button class="btn" onclick="msAdmRecusar('${esc(s.id)}','post')"><i class="ti ti-x"></i> Recusar</button></div></div></div>`
    : `<div class="ms-conf"><img src="${esc(s.url_num)}" alt="" onclick="window.open('${esc(msFotoG(s.url_num))}','_blank')"><div><b>${esc(s.colaboradora)}</b> · números do story de ${cpDia(s.data)}<br><small>${esc(s.produto)}</small><br><small class="apagado">${esc(s.obs||'')} — confira os números com o print e corrija se precisar.</small>
        ${msAdmCampos(s)}<div class="linha quebra" style="gap:6px"><button class="btn pri" onclick="msAdmDecidir('${esc(s.id)}','num',true)"><i class="ti ti-check"></i> Salvar e aprovar</button><button class="btn" onclick="msAdmRecusar('${esc(s.id)}','num')"><i class="ti ti-x"></i> Recusar</button></div></div></div>`;
  const hoje = A.ofertas.length ? `<div class="ms-of" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">${A.ofertas.map(o=>{ const q = A.stories.find(s=>s.data===A.hoje && s.handle===o.handle && s.status!=='recusado');
      return `<a class="ms-o" href="${esc(o.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="ft" style="background-image:url('${esc(o.foto)}')"></span>${q?`<span class="tag tm">${esc(q.colaboradora)}${q.status==='ok'?' ✔':' ⏳'}</span>`:''}<span class="tx"><b>${esc(o.nome)}</b><small>${o.preco?brl(o.preco):''}</small></span></a>`; }).join('')}</div>`
    : cpVazio('🕐', 'Sem ofertas carregadas para hoje', esc(A.aviso||'Aos domingos a missão não roda.'));
  const st = s => `<div class="ms-st"><img src="${esc(s.url_post)}" alt="" onclick="window.open('${esc(msFotoG(s.url_post))}','_blank')"><div><div class="linha entre" style="gap:8px"><b>${esc(s.colaboradora)} · ${esc(s.produto)}</b><span class="ms-pts">+${s.pontos}</span></div>
      <small class="apagado">${cpDia(s.data)} · ${s.status==='ok'?'story aprovado'+(s.por?' ('+esc(s.por)+')':''):s.status==='conferir'?'⏳ story em conferência':'❌ story recusado'}${s.num_status==='conferir'?' · ⏳ números em conferência':s.num_status==='recusado'?' · números recusados':''}</small>
      ${s.num_status==='ok'?`<div class="nums">${msNums(s)}</div>`:''}
      <div class="bts">${s.status==='ok'?`<button class="btn p" onclick="msAdmEditar('${esc(s.id)}')"><i class="ti ti-pencil"></i> ${s.num_status==='ok'?'Corrigir números':'Lançar números'}</button>`:''}${s.url_num?`<button class="btn p" onclick="window.open('${esc(msFotoG(s.url_num))}','_blank')"><i class="ti ti-photo"></i> Print dos números</button>`:''}${s.status!=='recusado'?`<button class="btn p" style="color:var(--bad)" onclick="msAdmRecusar('${esc(s.id)}','post')">Recusar story</button>`:''}</div></div></div>`;
  return `${A.ia?'':`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-robot-off"></i><div><b>A leitura automática dos prints está desligada.</b> Enquanto isso, todo print chega aqui para você conferir. Para ligar: Estoque › Configurar › cole a chave da IA (a mesma que lê as notas).</div></div>`}
    ${A.aviso?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>${esc(A.aviso)}</div></div>`:''}
    <section class="c34-caixa ${fila.length?'':'ok'}"><div class="c34-cab"><h3>${fila.length?'Prints para você conferir':'Nenhum print esperando ✨'}</h3>${fila.length?`<span class="c34-n">${fila.length}</span>`:''}</div>
      ${fila.length?`<div class="cp-lista">${fila.map(conf).join('')}</div>`:`<p class="c34-vazio">${A.ia?'A IA confere os prints sozinha. Só chega aqui o que ela não conseguir ler.':'Quando alguém mandar print, aparece aqui.'}</p>`}</section>
    <h2 class="secao" style="margin-top:18px">Hoje · ${cpDia(A.hoje)} ${A.origem?`<small class="apagado" style="font-weight:600">(ofertas vindas ${A.origem==='site'?'do site':'da administração'})</small>`:''}</h2>
    ${hoje}
    <div class="ms-esc" style="margin-top:10px">${A.escala.map(e=>{ const s = hojeSt[e.id], o = A.ofertas.find(x=>x.handle===e.sugerida); return `<span><b>${esc(e.nome)}</b> · ⏰ ${esc(e.horario)} ${s?(s.status==='ok'?'· ✅ postou':s.status==='conferir'?'· ⏳ em conferência':'· ❌ recusado'):o?'· sugestão: '+esc(o.nome):''}</span>`; }).join('')}</div>
    <div class="linha quebra" style="gap:8px;margin-top:10px"><button class="btn" onclick="msAdmOfertas(true)"><i class="ti ti-refresh"></i> Buscar no site de novo</button><button class="btn" onclick="msAdmColar()"><i class="ti ti-link"></i> Colar os links de hoje</button></div>
    ${msRanking({ranking:A.ranking}, '')}
    <h2 class="secao" style="margin-top:18px">Últimos stories</h2>
    ${A.stories.length?`<div class="cp-lista">${A.stories.slice(0, 40).map(st).join('')}</div>`:cpVazio('📲','Nenhum story enviado ainda','Apresente a missão para a equipe com a mensagem pronta aqui embaixo.')}
    <div class="cartao pad" style="margin-top:14px"><b>📣 Mensagem para apresentar à equipe</b><p class="apagado" style="font-size:13px;margin:4px 0 8px">Pronta para colar no grupo do WhatsApp.</p>
      <textarea class="inp" id="cp-msg" rows="12" style="font-family:inherit">${esc(msMsgEquipe(cfg))}</textarea><button class="btn pri" style="margin-top:8px" onclick="cpCopiar()"><i class="ti ti-copy"></i> Copiar mensagem</button></div>
    <details class="cpa-como" ${MS.cfgAberta?'open':''} ontoggle="MS.cfgAberta=this.open"><summary>⚙️ Regras e pontos da Missão</summary>${msAdmCfg(A)}</details>`;
}
function msAdmCampos(s){
  const c = (k, n) => `<div><label>${n}</label><input class="inp ms-n-${k}" inputmode="numeric" value="${s[k]||0}"></div>`;
  return `<div class="ms-nums" data-id="${esc(s.id)}">${c('views','👁 Visualiz.')}${c('respostas','💬 Respostas')}${c('cliques','🔗 Cliques')}${c('reacoes','❤️ Reações')}${c('compart','↗️ Compart.')}</div>`;
}
function msAdmLerCampos(id){
  const box = [...document.querySelectorAll('#modal .ms-nums, .ms-nums')].find(b=>b.dataset.id===id && (!document.querySelector('#modal .ms-nums') || b.closest('#modal'))); if(!box) return null;
  const o = {}; ['views','respostas','cliques','reacoes','compart'].forEach(k=>o[k] = box.querySelector('.ms-n-'+k).value);
  return o;
}
async function msAdmDecidir(id, parte, aprovar, motivo){
  try{ await msAdmApi('decidir', {id, parte, aprovar, motivo, numeros: parte==='num' && aprovar ? msAdmLerCampos(id) : null});
    toast(aprovar ? 'Aprovado ✔ Os pontos já entraram.' : 'Recusado — ela pode mandar de novo.'); fecharModal(); MS.adm = null; msAdmCarregar(); render(); }
  catch(e){ toast(e.message, true); }
}
function msAdmRecusar(id, parte){
  cpModal('Recusar o print', `<div class="campo"><label>Por quê? (ela vai ver este recado)</label><input class="inp" id="ms-motivo" maxlength="200" value="${parte==='num'?'Não dá para ler os números — manda de novo?':'Não é o print do story no ar — manda de novo?'}"></div>
    <button class="btn pri" style="width:100%" onclick="msAdmDecidir('${esc(id)}','${parte}',false,$('#ms-motivo').value)">Recusar</button>`);
}
function msAdmEditar(id){
  const s = MS.adm.stories.find(x=>x.id===id); if(!s) return;
  cpModal('📊 Números do story', `<p class="suave" style="margin:0 0 6px">${esc(s.colaboradora)} · ${esc(s.produto)} · ${cpDia(s.data)}</p>${s.url_num?`<img src="${esc(s.url_num)}" alt="" style="max-height:220px;border-radius:12px;display:block;margin:0 auto 8px;cursor:zoom-in" onclick="window.open('${esc(msFotoG(s.url_num))}','_blank')">`:''}
    ${msAdmCampos(s)}<button class="btn pri" style="width:100%" onclick="msAdmDecidir('${esc(id)}','num',true)"><i class="ti ti-device-floppy"></i> Salvar os números</button>`);
}
async function msAdmOfertas(buscar, links){
  toast(buscar ? 'Buscando as ofertas no site…' : 'Salvando as ofertas…');
  try{ await msAdmApi('ofertas', {buscar:!!buscar, links}); fecharModal(); toast('Ofertas de hoje atualizadas ✔'); MS.adm = null; msAdmCarregar(); render(); }catch(e){ toast(e.message, true); }
}
function msAdmColar(){
  cpModal('🔗 Ofertas de hoje', `<p class="suave" style="margin:0 0 8px">Cole o link de cada produto da oferta de hoje, um por linha (copie do site).</p>
    <textarea class="inp" id="ms-links" rows="6" placeholder="https://www.lasvegassexshop.com.br/produtos/…"></textarea>
    <button class="btn pri" style="width:100%;margin-top:8px" onclick="msAdmOfertas(false, $('#ms-links').value)">Salvar as ofertas de hoje</button>`);
}
function msMsgEquipe(cfg){
  const P = cfg.pontos, fx = (P.views||[]).map(f=>`+${f.pts} se passar de ${f.min} visualizações`).join(' · ');
  return `*📲 MISSÃO DO DIA — NOVIDADE NA CAMPANHA!*\n\nTodo dia o site tem *6 Ofertas do Dia* com 10% OFF. Agora cada uma de nós apresenta *1 produto* nos stories da loja (@${cfg.conta}) — do seu jeitinho! 💋\n\n*Como funciona:*\n1️⃣ Abra o portal › Campanha › *Missão do Dia*\n2️⃣ Escolha o seu produto (cada produto fica com uma)\n3️⃣ Poste o story no *seu horário do dia* (ele roda todo dia: ${cfg.horarios.join(', ')})\n4️⃣ Mande o *print do story no ar* pelo portal\n5️⃣ Depois mande o *print dos números* (visualizações, respostas, cliques)\n\n*⭐ Pontos:*\n• Postou: *+${P.postou}*\n• ${P.sequencia_dias} dias seguidos: *+${P.sequencia}*\n• Cada resposta: *+${P.resposta}* · cada clique no link: *+${P.clique}*${fx?'\n• '+fx:''}\n• Vendeu um produto da oferta do dia: *+${P.venda}* (conta sozinho no PDV)\n• Story campeão da semana: *+${P.campea}*\n\n*🎟️ A cada ${cfg.por_raspadinha} pontos = 1 raspadinha extra!*\n\n_Bora mostrar pra cidade o que a gente tem de melhor! 🔥_`;
}
function msAdmCfg(A){
  const c = A.cfg, P = c.pontos, v = P.views||[], n = (id, rot, val) => `<div class="campo"><label>${rot}</label><input class="inp" type="number" min="0" id="${id}" value="${val}"></div>`;
  return `<div style="margin-top:10px">
    <label class="linha" style="gap:8px;margin-bottom:10px;cursor:pointer"><input type="checkbox" id="ms-ativa" ${c.ativa?'checked':''}> Missão do Dia ligada</label>
    <div class="fid-g2"><div class="campo"><label>Vale a partir de</label><input class="inp" type="date" id="ms-ini" value="${esc(c.inicio)}"></div><div class="campo"><label>Instagram da loja</label><input class="inp" id="ms-conta" value="@${esc(c.conta)}"></div></div>
    <div class="fid-g2"><div class="campo"><label>Horários do rodízio</label><input class="inp" id="ms-hor" value="${esc(c.horarios.join(', '))}"></div>${n('ms-prazo','Dias para mandar os números',c.prazo_numeros_dias)}</div>
    <div class="fid-g2" style="grid-template-columns:repeat(3,1fr)">${n('ms-por','Pontos por raspadinha',c.por_raspadinha)}${n('ms-p-postou','Postou o story',P.postou)}${n('ms-p-venda','Vendeu a oferta do dia',P.venda)}</div>
    <div class="fid-g2" style="grid-template-columns:repeat(3,1fr)">${n('ms-p-sequencia','Bônus da sequência',P.sequencia)}${n('ms-p-sequencia_dias','A cada quantos dias',P.sequencia_dias)}${n('ms-p-campea','Story campeão da semana',P.campea)}</div>
    <div class="fid-g2" style="grid-template-columns:repeat(4,1fr)">${n('ms-p-resposta','Cada resposta',P.resposta)}${n('ms-p-clique','Cada clique',P.clique)}${n('ms-p-reacao','Cada reação',P.reacao)}${n('ms-p-compart','Cada compart.',P.compart)}</div>
    <div class="fid-g2" style="grid-template-columns:repeat(4,1fr)">${n('ms-v1m','Faixa 1: visualizações',(v[0]||{}).min||0)}${n('ms-v1p','Faixa 1: pontos',(v[0]||{}).pts||0)}${n('ms-v2m','Faixa 2: visualizações',(v[1]||{}).min||0)}${n('ms-v2p','Faixa 2: pontos',(v[1]||{}).pts||0)}</div>
    <div class="fid-g2">${n('ms-p-teto_story','Máximo de pontos de engajamento por story',P.teto_story)}<div></div></div>
    <div class="campo"><label>Quem participa</label><div class="linha quebra" style="gap:6px">${A.colaboradoras.map(x=>`<label class="selo" style="cursor:pointer"><input type="checkbox" class="ms-part" value="${esc(x.id)}" ${c.fora.includes(x.id)?'':'checked'}> ${esc(primeiroNome(x.nome))}</label>`).join('')}</div></div>
    <button class="btn pri" style="width:100%" onclick="msAdmSalvar()"><i class="ti ti-device-floppy"></i> Salvar as regras</button></div>`;
}
async function msAdmSalvar(){
  const g = id => $('#'+id).value, pts = {};
  ['postou','venda','sequencia','sequencia_dias','campea','resposta','clique','reacao','compart','teto_story'].forEach(k=>pts[k] = g('ms-p-'+k));
  pts.views = [{min:g('ms-v1m'), pts:g('ms-v1p')}, {min:g('ms-v2m'), pts:g('ms-v2p')}];
  const valor = { ativa:$('#ms-ativa').checked, inicio:g('ms-ini'), conta:g('ms-conta'), horarios:g('ms-hor'), prazo_numeros_dias:g('ms-prazo'), por_raspadinha:g('ms-por'), pontos:pts,
    fora:[...document.querySelectorAll('.ms-part')].filter(x=>!x.checked).map(x=>x.value) };
  try{ await msAdmApi('cfg', {valor}); toast('Regras da Missão salvas ✔'); MS.adm = null; msAdmCarregar(); render(); }catch(e){ toast(e.message, true); }
}
/* sai da sessão: esquece a escolha */
if(typeof sair === 'function'){ const _sairMs = sair; sair = function sair(){ MS.escolha = null; MS.alvo = null; return _sairMs.apply(this, arguments); }; }
