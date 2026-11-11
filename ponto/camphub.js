/* ═══════════ Portal Equipe Las Vegas · v55 — CAMPANHA DO MÊS: TELA INICIAL ═══════════
   Pedido da Madu (11/11): a Campanha do mês estava "muito simples, nada intuitiva e nem explicativa".
   • Tela inicial: resumo do dia (3 anéis), "O que fazer agora" (lista com botão) e um cartão por jogo
     dizendo em uma frase como funciona, como está e o que ganha.
   • Dentro de cada jogo: botão de voltar, atalho para os outros jogos e "Como funciona" em 3 passos.
   Só desenha — os dados e as regras continuam no campanha.js / missao.js. Carregado depois do missao.js. */
const CH = { visto:{} };
(function(){
  const css = `
.ch-hero{position:relative;overflow:hidden;border-radius:24px;padding:18px;color:#fff;background:linear-gradient(125deg,#1C1416,#3a0c12 55%,#E3101F);margin-bottom:14px;animation:cpSobe .35s var(--mola)}
.ch-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.12) 48%,transparent 60%);background-size:260% 100%;animation:cpBrilho 7s ease-in-out infinite;pointer-events:none}
.ch-hero h2{margin:0;font-size:clamp(20px,3vw,26px);letter-spacing:-.02em;line-height:1.15}
.ch-hero p{margin:4px 0 0;opacity:.88;font-size:14px}
.ch-aneis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;position:relative;z-index:1}
.ch-anel{background:rgba(255,255,255,.1);border-radius:16px;padding:10px 8px;text-align:center;border:0;color:#fff;font:inherit;cursor:pointer;transition:transform .15s var(--mola),background .2s}
.ch-anel:hover{background:rgba(255,255,255,.17);transform:translateY(-2px)}.ch-anel:active{transform:scale(.96)}
.ch-anel svg{width:64px;height:64px;display:block;margin:0 auto 4px}
.ch-anel circle{fill:none;stroke-width:7;stroke-linecap:round}
.ch-anel .f{stroke:rgba(255,255,255,.18)}.ch-anel .p{stroke:#F5B524;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1.1s var(--mola)}
.ch-anel text{fill:#fff;font-size:15px;font-weight:900}
.ch-anel b{display:block;font-size:13.5px;line-height:1.15}.ch-anel small{display:block;font-size:11.5px;opacity:.8;line-height:1.25;margin-top:2px}
.ch-tit{display:flex;align-items:center;gap:8px;margin:16px 2px 8px;font-size:17px;font-weight:800;letter-spacing:-.01em}
.ch-tit small{font-weight:600;color:var(--creme2);font-size:13px}
.ch-agora{display:grid;gap:8px}
.ch-ag{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1px solid var(--linha2);border-left:5px solid var(--cor,var(--vermelho));border-radius:16px;padding:12px;font:inherit;cursor:pointer;animation:cpSobe .35s both;transition:transform .15s var(--mola),box-shadow .15s}
.ch-ag:hover{transform:translateY(-2px);box-shadow:var(--sh)}.ch-ag:active{transform:scale(.98)}
.ch-ag .em{font-size:28px;flex:none;width:36px;text-align:center}
.ch-ag b{display:block;font-size:15px;line-height:1.2}.ch-ag small{display:block;color:var(--creme2);font-size:12.5px;margin-top:2px;line-height:1.3}
.ch-ag .ir{flex:none;background:var(--cor,var(--vermelho));color:#fff;border-radius:99px;padding:7px 12px;font-size:12.5px;font-weight:800;white-space:nowrap}
.ch-ag.pulsa .em{animation:cpPulsa 1.4s infinite}
.ch-ok{display:flex;gap:10px;align-items:center;background:var(--ok-bg);color:var(--ok);border-radius:16px;padding:12px 14px;font-weight:700}
.ch-jogos{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.ch-j{position:relative;display:flex;flex-direction:column;gap:8px;text-align:left;background:#fff;border:1px solid var(--linha);border-radius:20px;padding:14px;font:inherit;cursor:pointer;box-shadow:var(--sh);overflow:hidden;animation:cpPula .45s var(--mola) both;transition:transform .2s var(--mola),box-shadow .2s}
.ch-j::before{content:'';position:absolute;left:0;right:0;top:0;height:5px;background:var(--cor)}
.ch-j:hover{transform:translateY(-3px);box-shadow:var(--sh2)}.ch-j:active{transform:scale(.98)}
.ch-j .cab{display:flex;align-items:center;gap:10px}
.ch-j .ic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:26px;background:var(--fundo)}
.ch-j h3{margin:0;font-size:16.5px;letter-spacing:-.01em;flex:1}
.ch-j .contador{flex:none}
.ch-j p{margin:0;font-size:13.5px;line-height:1.4;color:var(--creme)}
.ch-j .st{font-size:12.5px;font-weight:700;color:var(--creme2);display:flex;justify-content:space-between;gap:8px}
.ch-j .br{height:8px;border-radius:99px;background:var(--veludo2);overflow:hidden}
.ch-j .br i{display:block;height:100%;border-radius:99px;background:var(--cor);transform-origin:left;animation:cpCresce 1s var(--mola) both}
.ch-j .pr{font-size:12.5px;background:var(--fundo);border-radius:10px;padding:6px 8px;line-height:1.35}
.ch-j .abrir{margin-top:auto;align-self:flex-start;background:var(--cor);color:#fff;border-radius:99px;padding:7px 14px;font-size:13px;font-weight:800;display:inline-flex;gap:6px;align-items:center}
.ch-nav{display:flex;align-items:center;gap:8px;margin-bottom:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.ch-nav::-webkit-scrollbar{display:none}
.ch-nav button{flex:none;border:1px solid var(--linha2);background:#fff;border-radius:99px;padding:7px 12px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;display:flex;gap:6px;align-items:center;white-space:nowrap;transition:transform .15s var(--mola)}
.ch-nav button:active{transform:scale(.95)}
.ch-nav .volta{background:#1C1416;color:#fff;border-color:#1C1416}
.ch-nav .on{background:var(--vermelho);color:#fff;border-color:var(--vermelho)}
.ch-nav .contador{background:var(--vermelho);color:#fff}.ch-nav .on .contador{background:#fff;color:var(--vermelho)}
.ch-como{background:var(--fundo,#FFF3D6);border-radius:18px;padding:12px 14px;margin-bottom:12px;animation:cpSobe .35s both}
.ch-como h3{margin:0 0 2px;font-size:17px;display:flex;gap:8px;align-items:center}
.ch-como>p{margin:0 0 10px;font-size:13.5px;color:var(--creme);line-height:1.4}
.ch-passos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ch-passos div{background:#fff;border-radius:14px;padding:10px;font-size:12.5px;line-height:1.35;position:relative}
.ch-passos i{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--cor,var(--vermelho));color:#fff;font-style:normal;font-weight:900;font-size:12px;margin-bottom:5px}
.ch-passos b{display:block;font-size:13px;margin-bottom:1px}
.ch-ganha{margin-top:8px;font-size:13px;font-weight:700;display:flex;gap:6px;align-items:flex-start;line-height:1.35}
@media(max-width:620px){.ch-passos{grid-template-columns:1fr}.ch-passos div{display:grid;grid-template-columns:auto 1fr;gap:0 10px;align-items:start}.ch-passos i{grid-row:1/3;margin:0}.ch-anel svg{width:54px;height:54px}.ch-jogos{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.ch-hero::after,.ch-ag.pulsa .em{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

const CH_COR = { missao:['#C2185B','#FCE4EC'], raspadinha:['#D99A00','#FFF3D6'], bingo:['#E3101F','#FDE8EA'], ouro:['#C77700','#FFF0D9'], ranking:['#1C1416','#EFEAEA'], sonhos:['#7B3FB5','#F1E7FA'] };
const CH_LINHAS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const chIr = k => `CP.sub='${k}';${k==='ouro'?'CP.ouro=null;':''}render();window.scrollTo&&scrollTo(0,0)`;
function chAnel(pct, txt){ const r = 26, c = 2*Math.PI*r, p = Math.max(0, Math.min(100, pct||0));
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="f" cx="32" cy="32" r="${r}"/><circle class="p" cx="32" cy="32" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c*(1-p/100)).toFixed(1)}"/><text x="32" y="37" text-anchor="middle">${txt}</text></svg>`; }
/* quanto falta para fechar uma linha do bingo, e quais quadrados */
function chBingoFalta(b){
  if(!b || !b.quadrados) return null;
  let melhor = null;
  CH_LINHAS.forEach(l=>{ const f = l.filter(i=>!b.quadrados[i]?.feito); if(f.length && (!melhor || f.length < melhor.length)) melhor = f; });
  return melhor ? melhor.map(i=>b.quadrados[i]) : null;
}
function chNomeMes(){ return new Date().toLocaleDateString('pt-BR', {month:'long'}); }

/* ───────── o que cada jogo é (frase, passos, prêmio) ───────── */
function chInfo(k, c){
  const m = c.missao && !c.missao.erro ? c.missao : null, vd = brl(c.valor_dia), bp = c.bingo_premios||{}, j = c.janela||{};
  return ({
    missao: m && { em:'📲', nome:'Missão do Dia', frase:`Poste 1 story por dia de um produto das Ofertas do Dia e ganhe pontos. A cada ${m.por_raspadinha} pontos, uma raspadinha extra.`,
      passos:[['Escolha o produto','Um dos 6 da oferta de hoje. Cada produto fica com uma vendedora.'],['Poste e mande o print',`Story no @${m.conta}, no seu horário. O portal confere o print na hora.`],['Mande os números','Visualizações, respostas e cliques viram mais pontos.']],
      ganha:`A cada ${m.por_raspadinha} pontos = 1 raspadinha. Vender o produto da oferta dá +${m.regras.venda} pontos.` },
    raspadinha: { em:'🎟️', nome:'Raspadinha do Dia', frase:`Vendeu ${vd} no dia? Ganha uma raspadinha com prêmio surpresa.`,
      passos:[['Bata o valor do dia',`Some ${vd} em vendas no mesmo dia (vale qualquer loja).`],['A raspadinha aparece','Ela fica aqui esperando por alguns dias.'],['Raspe com o dedo','O prêmio aparece na hora e a administração entrega.']],
      ganha:'Prêmio surpresa a cada dia batido. Quanto mais dias, mais raspadinhas.' },
    bingo: { em:'🎱', nome:'Bingo de Vendas', frase:'Cartela nova toda segunda. Cada tipo de venda marca um quadrado. Fechou uma linha, ganhou.',
      passos:[['Venda normalmente','Os quadrados marcam sozinhos quando a venda passa no PDV.'],['Alguns pedem print','Avaliação no Google e story: mande o print pelo quadrado.'],['Feche linha ou cartela','Linha deitada, em pé ou na diagonal já vale prêmio.']],
      ganha:`Linha: ${bp.premio_linha||'prêmio'} · Cartela cheia: ${bp.premio_cartela||'prêmio'}` },
    ouro: { em:'⏰', nome:'Hora de Ouro', frase:`Todo dia${j.ini?`, das ${j.ini} às ${j.fim},`:''} chame clientes que sumiram. A mensagem já vai pronta.`,
      passos:[['Abra a sua lista',`${c.qtd_ouro||10} clientes só suas, que não compram há mais de um mês.`],['Toque em Chamar','Abre o WhatsApp com a mensagem pronta, sem falar do que ela comprou.'],['Ela voltou a comprar?','Marca sozinho o quadrado 🔁 do bingo e conta na sua meta.']],
      ganha:'Loja parada vira venda — e venda vira raspadinha, bingo e meta.' },
    ranking: { em:'🏆', nome:'Ranking da semana', frase:'Veja quem está na frente na semana e no mês, e quanto falta para cada meta.',
      passos:[['Semana de segunda a sábado','Recomeça toda segunda.'],['Conta tudo o que você vendeu','PDV das duas lojas e vendas fechadas pelo WhatsApp.'],['Meta, super e hiper','A barra mostra onde você está no mês.']],
      ganha:`Meta ${brl(c.meta?.meta||0)} · super ${brl(c.meta?.super||0)} · hiper ${brl(c.meta?.hiper||0)}` },
    sonhos: { em:'💭', nome:'Mural dos Sonhos', frase:'Coloque a foto e a frase do seu sonho. A meta é o caminho, o sonho é o motivo.',
      passos:[['Escolha o seu sonho','Uma viagem, uma conta paga, um presente…'],['Coloque foto e frase','Fica no mural para você e a equipe verem.'],['Olhe todo dia','Lembra por que vale a pena bater a meta.']],
      ganha:'' }
  })[k] || null;
}
/* como está cada jogo agora: {txt, dir, pct, n} */
function chStatus(k, c){
  const m = c.missao && !c.missao.erro ? c.missao : null;
  if(k==='missao' && m){ if(!m.participa) return {txt:'Você acompanha o ranking'}; const f = m.por_raspadinha - m.faltam;
    return {txt:`⭐ ${m.pontos_mes} ponto${m.pontos_mes===1?'':'s'} no mês`, dir:`faltam ${m.faltam}`, pct:f/m.por_raspadinha*100, n:typeof msPendentes==='function'?msPendentes(m):0}; }
  if(k==='raspadinha'){ const n = (c.raspadinhas||[]).length, h = c.hoje||0;
    return {txt: n ? `${n} para raspar!` : `Hoje: ${brl(h)} de ${brl(c.valor_dia)}`, dir: h>=c.valor_dia ? 'batido ✔' : `faltam ${brl(c.valor_dia-h)}`, pct:h/c.valor_dia*100, n}; }
  if(k==='bingo' && c.bingo){ const b = c.bingo; return {txt:`${b.feitos} de 9 quadrados`, dir:b.cheia?'cartela cheia 🏆':b.linhas.length?'linha fechada ✔':'', pct:b.feitos/9*100}; }
  if(k==='ouro'){ const f = c.chamadas_hoje||0, q = c.qtd_ouro||10, st = cpOuroAgora(c.janela);
    return {txt:`${f} de ${q} chamadas hoje`, dir:st==='agora'?'é agora!':st==='antes'?`começa às ${c.janela.ini}`:'', pct:f/q*100, n:st==='agora' && f<q ? q-f : 0}; }
  if(k==='ranking'){ const mt = c.meta?.meta||0, v = c.mes||0; return c.participa ? {txt:`Seu mês: ${brl(v)}`, dir:mt?Math.round(v/mt*100)+'% da meta':'', pct:mt?v/mt*100:0} : {txt:'Veja a equipe'}; }
  if(k==='sonhos') return {txt:'O motivo de cada uma'};
  return {txt:''};
}
/* lista "O que fazer agora", em ordem de prioridade */
function chAgora(c, tem){
  const L = [], m = c.missao && !c.missao.erro ? c.missao : null, cor = k => CH_COR[k][0];
  const r = (c.raspadinhas||[]).length;
  if(tem('raspadinha') || (m && r)){ if(r) L.push({k: tem('raspadinha')?'raspadinha':'missao', em:'🎟️', t:`Você tem ${r===1?'1 raspadinha':r+' raspadinhas'} para raspar!`, s:'Toque, raspe com o dedo e veja o prêmio.', b:'Raspar', pulsa:true, cor:cor('raspadinha')}); }
  if(tem('missao') && m && m.participa){
    const semStory = (m.ofertas||[]).length && (!m.story || m.story.status==='recusado');
    const nums = (m.numeros||[]).filter(s=>s.status==='ok' && (!s.num_status || s.num_status==='recusado')).length;
    if(semStory) L.push({k:'missao', em:'📲', t:'Poste o seu story de hoje', s:`Seu horário: ${m.horario||'livre'} · vale +${m.regras.postou} pontos`, b:'Ver produtos', cor:cor('missao')});
    if(nums) L.push({k:'missao', em:'📊', t:`Mande os números do seu story`, s:`${nums===1?'1 story esperando':nums+' stories esperando'} o print das visualizações`, b:'Mandar', cor:cor('missao')});
  }
  if(tem('ouro') && cpOuroAgora(c.janela)==='agora' && (c.chamadas_hoje||0) < (c.qtd_ouro||10))
    L.push({k:'ouro', em:'⏰', t:'É Hora de Ouro!', s:`${c.chamadas_hoje||0} de ${c.qtd_ouro} clientes chamadas · até ${c.janela.fim}`, b:'Chamar', pulsa:true, cor:cor('ouro')});
  if(tem('raspadinha') && c.participa && (c.hoje||0) < c.valor_dia)
    L.push({k:'pdv', em:'🎯', t:`Faltam ${brl(c.valor_dia-(c.hoje||0))} para a raspadinha de hoje`, s:`Você vendeu ${brl(c.hoje||0)} de ${brl(c.valor_dia)}`, b:'Vender', cor:cor('raspadinha')});
  if(tem('bingo') && c.bingo && !c.bingo.linhas.length){ const f = chBingoFalta(c.bingo);
    if(f && f.length <= 2) L.push({k:'bingo', em:'🎱', t:`${f.length===1?'Falta 1 quadrado':'Faltam 2 quadrados'} para fechar uma linha`, s:f.map(q=>q.em+' '+q.t).join(' · '), b:'Ver cartela', cor:cor('bingo')}); }
  return L;
}

/* ───────── tela ───────── */
function chTela(c, subs){
  const tem = k => subs.some(s=>s[0]===k);
  const titulo = `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><h2 class="secao" style="margin:0">🎯 Campanha do mês</h2><button class="icone" title="Atualizar" onclick="cpRecarregar()"><i class="ti ti-refresh"></i></button></div>`;
  const sub = tem(CP.sub) ? CP.sub : 'inicio';
  if(sub === 'inicio') return titulo + chInicio(c, subs, tem);
  const telas = {missao:()=>msTela(c), raspadinha:()=>cpRaspadinha(c), bingo:()=>cpBingo(c), ouro:()=>cpOuro(c), ranking:()=>cpRanking(c), sonhos:cpSonhos};
  const info = chInfo(sub, c), cor = CH_COR[sub]||CH_COR.bingo;
  const nav = `<div class="ch-nav"><button class="volta" onclick="CP.sub='inicio';render()"><i class="ti ti-arrow-left"></i> Todos os jogos</button>${subs.map(([k,i,n])=>{ const st = chStatus(k, c); return `<button class="${sub===k?'on':''}" onclick="${chIr(k)}"><i class="ti ${i}"></i>${n}${st.n?`<span class="contador">${st.n}</span>`:''}</button>`; }).join('')}</div>`;
  const como = info ? `<div class="ch-como" style="--cor:${cor[0]};--fundo:${cor[1]}"><h3>${info.em} ${info.nome}</h3><p>${esc(info.frase)}</p>
      <div class="ch-passos">${info.passos.map((p,i)=>`<div><i>${i+1}</i><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div>`).join('')}</div>
      ${info.ganha?`<div class="ch-ganha"><span>🎁</span><span>${esc(info.ganha)}</span></div>`:''}</div>` : '';
  const topo = sub==='raspadinha' && c.participa ? cpTopo(c) : '';
  return titulo + nav + como + topo + telas[sub]();
}
function chInicio(c, subs, tem){
  const m = c.missao && !c.missao.erro && tem('missao') ? c.missao : null, mt = c.meta||{};
  const pD = (c.hoje||0)/c.valor_dia*100, pM = mt.meta ? (c.mes||0)/mt.meta*100 : 0;
  const aneis = [];
  if(c.participa){
    aneis.push(`<button class="ch-anel" onclick="${tem('raspadinha')?chIr('raspadinha'):''}">${chAnel(pD, Math.round(Math.min(999,pD))+'%')}<b>Hoje</b><small>${brl(c.hoje||0)} de ${brl(c.valor_dia)}</small></button>`);
    aneis.push(`<button class="ch-anel" onclick="${tem('ranking')?chIr('ranking'):''}">${chAnel(pM, Math.round(Math.min(999,pM))+'%')}<b>Meta do mês</b><small>${brl(c.mes||0)} de ${brl(mt.meta||0)}</small></button>`);
  }
  if(m && m.participa){ const f = m.por_raspadinha - m.faltam; aneis.push(`<button class="ch-anel" onclick="${chIr('missao')}">${chAnel(f/m.por_raspadinha*100, '⭐'+m.pontos_mes)}<b>Pontos da Missão</b><small>faltam ${m.faltam} para a raspadinha</small></button>`); }
  const nome = typeof primeiroNome==='function' && S.sess?.dados?.eu?.nome ? primeiroNome(S.sess.dados.eu.nome) : '';
  const hero = `<div class="ch-hero"><h2>Campanha de ${chNomeMes()} 🎉</h2><p>${c.participa?'Venda, jogue e ganhe prêmios. Aqui embaixo está o que dá para fazer agora.':'Você está como suporte este mês: não entra na meta de vendas, mas os jogos abaixo são seus também 💛'}</p>
    ${aneis.length?`<div class="ch-aneis" style="grid-template-columns:repeat(${aneis.length},1fr)">${aneis.join('')}</div>`:''}</div>`;
  const ag = chAgora(c, tem);
  const agora = `<div class="ch-tit">👉 O que fazer agora ${ag.length?`<small>${ag.length} ${ag.length===1?'coisa':'coisas'}</small>`:''}</div>` + (ag.length
    ? `<div class="ch-agora">${ag.map((a,i)=>`<button class="ch-ag ${a.pulsa?'pulsa':''}" style="--cor:${a.cor};animation-delay:${i*60}ms" onclick="${a.k==='pdv'?`S.portalTab='pdv';render()`:chIr(a.k)}"><span class="em">${a.em}</span><span class="cresce"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></span><span class="ir">${a.b} ›</span></button>`).join('')}</div>`
    : `<div class="ch-ok"><span style="font-size:22px">✨</span><span>Tudo em dia por aqui. Continue vendendo que os jogos marcam sozinhos.</span></div>`);
  const jogos = `<div class="ch-tit">🎮 Os jogos <small>toque para abrir</small></div><div class="ch-jogos">${subs.map(([k],i)=>{ const info = chInfo(k, c); if(!info) return ''; const st = chStatus(k, c), cor = CH_COR[k]||CH_COR.bingo;
      return `<button class="ch-j" id="ch-j-${k}" style="--cor:${cor[0]};--fundo:${cor[1]};animation-delay:${i*60}ms" onclick="${chIr(k)}">
        <span class="cab"><span class="ic">${info.em}</span><h3>${info.nome}</h3>${st.n?`<span class="contador">${st.n}</span>`:''}</span>
        <p>${esc(info.frase)}</p>
        ${st.txt?`<span class="st"><span>${esc(st.txt)}</span><span>${esc(st.dir||'')}</span></span>`:''}
        ${st.pct!=null?`<span class="br"><i style="width:${Math.max(0,Math.min(100,st.pct))}%"></i></span>`:''}
        ${info.ganha?`<span class="pr">🎁 ${esc(info.ganha)}</span>`:''}
        <span class="abrir">Abrir <i class="ti ti-arrow-right"></i></span></button>`; }).join('')}</div>`;
  return hero + agora + jogos;
}
/* a campanha passa a abrir na tela inicial; os atalhos (Início, busca) continuam levando direto ao jogo */
CP.sub = 'inicio';
if(typeof sair === 'function'){ const _sairCh = sair; sair = function sair(){ CP.sub = 'inicio'; return _sairCh.apply(this, arguments); }; }
