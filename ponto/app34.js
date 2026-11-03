/* ═══════════ v34: Administração organizada — 6 áreas no menu + abas por dentro + "O que precisa de mim hoje" ═══════════
   Pedido da Madu: "está tudo muito confuso, muitas opções no menu lateral; precisa ser mais organizado e intuitivo".
   • Menu lateral da Administração com só 6 áreas: Início · Vendas · Estoque · Equipe e ponto · Comunicação · Ajustes.
     Cada área mostra as telas dela numa faixa de abas no topo do conteúdo (as telas continuam as mesmas).
   • Início abre na tela nova "O que precisa de mim hoje": pedidos da equipe, alertas da loja, sangrias sem conferir,
     quem ainda não bateu o ponto — cada um com o botão para resolver. Embaixo, as lojas agora e atalhos.
   • No celular: barra de baixo com Início · Vendas · Estoque · Equipe · Mais.
   • Não mexe em nenhuma tela, só na casca (o app12 continua montando o menu; aqui só muda o que vai dentro).
   • Para voltar ao menu antigo: tirar a linha do app34 no app9.js. */

const AREAS34 = [
  {id:'inicio',  n:'Início',          ic:'ti-home',         cor:'var(--g-vendas)',   k:['central','aovivo']},
  {id:'vendas',  n:'Vendas',          ic:'ti-shopping-bag', cor:'var(--g-dia)',      k:['pdv','arena','metas','campanha','caixa','clientes','whats']},
  {id:'estoque', n:'Estoque',         ic:'ti-packages',     cor:'var(--g-dia)',      k:['estoque']},
  {id:'equipe',  n:'Equipe e ponto',  ic:'ti-users',        cor:'var(--g-ponto)',    k:['hoje','pedidos','escala','mes','banco','produtividade','equipe']},
  {id:'comunic', n:'Comunicação',     ic:'ti-speakerphone', cor:'var(--g-equipe)',   k:['mural','agenda','checklist','protocolos','treino','atalhos']},
  {id:'ajustes', n:'Ajustes',         ic:'ti-settings',     cor:'var(--g-sistema)',  k:['regras','aparelhos','nuvemshop','roleta']}
];
const NOMES34 = {central:'Precisa de mim', aovivo:'Ao vivo', pdv:'PDV', arena:'Arena', metas:'Metas', campanha:'Campanha do mês', caixa:'Caixa', clientes:'Clientes', whats:'Atendimento · Kommo',
  estoque:'Estoque', hoje:'Ponto de hoje', pedidos:'Pedidos', escala:'Escala', mes:'Espelho de ponto', banco:'Banco de horas', produtividade:'Produtividade', equipe:'Cadastro da equipe',
  mural:'Mural', agenda:'Agenda', checklist:'Checklist', protocolos:'Protocolos', treino:'Treinamento', atalhos:'Atalhos', regras:'Regras', aparelhos:'Aparelhos', nuvemshop:'Nuvemshop (site)', roleta:'Roleta do site'};
const M34 = { ultimo:{}, go:[] };

function area34(k){ return AREAS34.find(a=>a.k.includes(k)) || AREAS34[AREAS34.length-1]; }
function areasComTabs34(tabs){
  const extras = Object.keys(tabs).filter(k=>!AREAS34.some(a=>a.k.includes(k)));
  return AREAS34.map(a=>({...a, tabs:(a.id==='ajustes' ? a.k.concat(extras) : a.k).filter(k=>tabs[k]).map(k=>tabs[k])})).filter(a=>a.tabs.length);
}
const ocAttr34 = oc => String(oc||'').replace(/"/g, '&quot;');

/* ───────── menu: 6 áreas no lugar da lista comprida (só na Administração) ───────── */
let _menu12V34 = null;
function menu34(tabs, adm){
  if(!adm || !S.adm) return _menu12V34(tabs, adm);
  const h0 = _menu12V34(tabs, adm);
  const atual = S.adm.tab, aqui = area34(atual).id;
  M34.ultimo[aqui] = atual;
  const areas = areasComTabs34(tabs);
  const soma = a => a.tabs.reduce((s,t)=>s + (parseInt(t.badge)||0), 0);
  const destino = a => (a.id===aqui ? atual : (a.tabs.find(t=>t.k===M34.ultimo[a.id]) || a.tabs[0]).k);
  const nav = `<nav class="menu-nav nav34"><div class="menu-ind" hidden></div>${areas.map(a=>{ const b = soma(a);
    return `<a class="${a.id===aqui?'on':''}" style="--cor:${a.cor}" data-k="${destino(a)}" tabindex="0"><i class="ti ${a.ic}"></i><span>${a.n}</span>${b?`<span class="contador">${b}</span>`:''}</a>`; }).join('')}</nav>`;
  try{ pintarAbas34(areas.find(a=>a.id===aqui), areas, destino, soma); }catch(e){ console.warn('v34 abas', e); }
  return h0.replace(/<nav class="menu-nav">[\s\S]*?<\/nav>/, nav);
}
/* faixa de abas da área (no topo do conteúdo) + barra de baixo no celular */
function pintarAbas34(area, areas, destino, soma){
  const w = document.querySelector('#app > .wrap'); if(!w || !area) return;
  w.querySelectorAll(':scope > .sub34, :scope > .bar34').forEach(x=>x.remove());
  const atual = S.adm.tab;
  const sub = `<div class="sub34" style="--cor:${area.cor}"><div class="sub34-t"><i class="ti ${area.ic}"></i><b>${area.n}</b></div>
    ${area.tabs.length>1 ? `<div class="sub34-abas" role="tablist">${area.tabs.map(t=>`<button role="tab" class="${t.k===atual?'on':''}" aria-selected="${t.k===atual}" onclick="${ocAttr34(t.oc)}"><i class="ti ${t.ic}"></i>${esc(NOMES34[t.k]||t.nome)}${t.badge?`<span class="contador">${esc(t.badge)}</span>`:''}</button>`).join('')}</div>` : ''}</div>`;
  const let_ = w.querySelector(':scope > .letreiro');
  if(let_) let_.insertAdjacentHTML('afterend', sub); else w.insertAdjacentHTML('afterbegin', sub);
  const on = w.querySelector('.sub34-abas button.on'); if(on) on.scrollIntoView({block:'nearest', inline:'center'});
  // barra de baixo (celular): 4 áreas principais + Mais
  const princ = ['inicio','vendas','estoque','equipe'].map(id=>areas.find(a=>a.id===id)).filter(Boolean);
  const aqui = area.id, tabs = Object.fromEntries(areas.flatMap(a=>a.tabs.map(t=>[t.k,t])));
  const outra = !princ.some(a=>a.id===aqui);
  w.insertAdjacentHTML('beforeend', `<nav class="bar34" aria-label="Áreas">${princ.map(a=>{ const b = soma(a), t = tabs[destino(a)];
      return `<button class="${a.id===aqui?'on':''}" style="--cor:${a.cor}" onclick="${ocAttr34(t.oc)}"><i class="ti ${a.ic}"></i><span>${a.n.split(' ')[0]}</span>${b?`<i class="bolinha">${b}</i>`:''}</button>`; }).join('')}
    <button class="${outra?'on':''}" onclick="menuAbrir12()"><i class="ti ti-dots"></i><span>Mais</span></button></nav>`);
}

/* ───────── tela nova: "O que precisa de mim hoje" ───────── */
function itens34(){
  const d = S.adm.dados, hoje = d.hoje, I = [];
  const ped = (typeof pendentes==='function') ? pendentes(d) : [];
  if(ped.length){
    const tipo = {correcao:'correção de ponto', atestado:'atestado', folga:'folga', outro:'pedido'};
    const quem = s => primeiroNome(s.colaboradora || (d.colaboradoras.find(c=>c.id===s.colaboradora_id)||{}).nome || '');
    I.push({c:'warn', i:'ti-inbox', t:`${ped.length===1?'1 pedido':ped.length+' pedidos'} da equipe esperando você`, s:ped.slice(0,3).map(s=>`${quem(s)} · ${tipo[s.tipo]||'pedido'}`).join(' · ') + (ped.length>3?' …':''), b:'Responder', go:()=>{ S.adm.tab='pedidos'; }});
  }
  if(typeof opAlertas==='function'){ try{ opAlertas().forEach(a=>I.push({c:a.c, i:a.i, t:a.t, s:a.s, b:'Resolver', go:a.go})); }catch(e){} }
  const sang = (d.sangrias||[]).filter(s=>!s.conferiu && s.data >= addDays(hoje,-7));
  if(sang.length) I.push({c:'warn', i:'ti-cash-banknote', t:`${sang.length===1?'1 sangria':sang.length+' sangrias'} para conferir`, s:'Confira o envelope e marque como conferida', b:'Conferir', go:()=>{ S.adm.tab='caixa'; }});
  try{
    const agora = toM(d.hora||'00:00'), esc_ = escalaDe(hoje, d.escala), turnos = d.turnos || S.boot.turnos || {};
    const faltam = esc_.filter(e=>{
      const p = (d.pontos||[]).find(x=>x.colaboradora_id===e.colaboradora_id && x.data===hoje);
      if(p && (p.entrada || (p.tipo && p.tipo!=='normal'))) return false;
      const ini = String((turnos[e.loja]||{})[e.turno]||'').match(/(\d{1,2}):(\d{2})/), loja = d.lojas[e.loja]||{};
      const h0 = ini ? Number(ini[1])*60+Number(ini[2]) : toM(loja.abre||'08:00');
      return agora > h0 + 15;
    });
    if(faltam.length) I.push({c:'bad', i:'ti-clock-exclamation', t:`${faltam.length===1?'1 pessoa da escala ainda não bateu':faltam.length+' pessoas da escala ainda não bateram'} o ponto`,
      s:faltam.map(e=>`${primeiroNome((d.colaboradoras.find(c=>c.id===e.colaboradora_id)||{}).nome||'')} · ${(d.lojas[e.loja]||{}).nome||e.loja}`).join(' · '), b:'Ver ponto', go:()=>{ S.adm.tab='hoje'; }});
  }catch(e){}
  const peso = {bad:0, warn:1, info:2};
  return I.sort((a,b)=>(peso[a.c]??3)-(peso[b.c]??3));
}
function admCentral34(){
  const d = S.adm.dados, hoje = d.hoje, I = itens34(); M34.go = I.map(x=>x.go);
  const h = toM(d.hora||'12:00'), saud = h<720 ? 'Bom dia' : h<1080 ? 'Boa tarde' : 'Boa noite';
  const nome = (typeof perfil29==='function' && perfil29()==='matheus') ? 'Matheus' : 'Madu';
  const vend = (d.vendas||[]).filter(v=>v.data===hoje);
  const lojas = Object.entries(d.lojas).map(([k,l])=>{
    const tot = vend.filter(v=>v.loja===k).reduce((s,v)=>s+(Number(v.valor)||0),0);
    const aqui = (d.pontos||[]).filter(p=>p.data===hoje && p.loja===k && p.entrada && !p.saida);
    const quem = aqui.map(p=>primeiroNome(p.colaboradora || (d.colaboradoras.find(c=>c.id===p.colaboradora_id)||{}).nome || ''));
    return `<div class="c34-loja"><div class="linha entre"><b>Loja ${esc(l.nome)}</b><small>${esc(l.abre)}–${esc(l.fecha)}</small></div>
      <div class="c34-num"><small>vendido hoje</small><b class="num">${brl2(tot)}</b></div>
      <small class="c34-quem"><i class="ti ti-user-check"></i> ${quem.length ? esc(quem.join(', ')) : 'ninguém no ponto agora'}</small></div>`;
  }).join('');
  const atalho = (ic, t, oc, cor) => `<button class="c34-at" style="--cor:${cor}" onclick="${oc}"><i class="ti ${ic}"></i><span>${t}</span></button>`;
  return `<div class="c34">
    <div class="c34-topo"><h2>${saud}, ${nome} 👋</h2><p>${esc(dataLonga(hoje))}</p></div>
    <section class="c34-caixa ${I.length?'':'ok'}">
      <div class="c34-cab"><h3>${I.length ? 'O que precisa de você hoje' : 'Tudo em dia ✨'}</h3>${I.length?`<span class="c34-n">${I.length}</span>`:''}</div>
      ${I.length ? `<div class="c34-lista">${I.map((x,i)=>`<button class="c34-it ${x.c}" style="--k:${i}" onclick="M34.go[${i}]();render()">
          <span class="c34-ic"><i class="ti ${x.i}"></i></span><span class="cresce"><b>${esc(x.t)}</b><small>${esc(x.s||'')}</small></span>
          <span class="c34-btn">${x.b} <i class="ti ti-chevron-right"></i></span></button>`).join('')}</div>`
        : `<p class="c34-vazio">Nenhum pedido esperando, caixa e abertura em ordem, todo mundo da escala no ponto. Aproveite! 💃</p>`}
    </section>
    <h2 class="secao">Agora nas lojas</h2>
    <div class="c34-lojas">${lojas}</div>
    <h2 class="secao">Atalhos</h2>
    <div class="c34-ats">
      ${atalho('ti-flame','Arena de vendas',"S.adm.tab='arena';render()",'var(--g-vendas)')}
      ${atalho('ti-speakerphone','Novo aviso no mural',"S.adm.tab='mural';render()",'var(--g-equipe)')}
      ${atalho('ti-calendar-time','Escala',"S.adm.tab='escala';render()",'var(--g-ponto)')}
      ${atalho('ti-trophy','Metas',"S.adm.tab='metas';render()",'var(--g-dia)')}
    </div></div>`;
}

/* encaixe da tela nova (mesmo jeito do campanha.js: a tela "atalhos" vira um marcador e é trocada) */
const _telaAdminV34 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, aqui = A.tab === 'central', marca = '<!--c34-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV34.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'central'; }
    h = h.replace(marca, admCentral34()).replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV34.apply(this, arguments);
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='central';TR=null;render()"><i class="ti ti-checklist"></i> Precisa de mim </button>`;
  return h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
};

/* entrar na Administração → começa no "Precisa de mim"; menu do app12 trocado na primeira vez */
const _renderV34 = render;
render = function render(){
  if(!_menu12V34 && typeof menu12==='function'){ _menu12V34 = menu12; menu12 = menu34; }
  if(S.tela==='admin' && S.adm && !S.adm._v34){ S.adm._v34 = true; if(!(location.hash==='#produtos')) S.adm.tab = 'central'; }
  return _renderV34.apply(this, arguments);
};

document.head.insertAdjacentHTML('beforeend', `<style>
.nav34 a{min-height:48px;font-size:15.5px}
.nav34 a i.ti{font-size:21px}
.sub34{margin:0 0 16px;animation:entraBloco .45s var(--suave,ease) both}
.sub34-t{display:flex;align-items:center;gap:10px;margin:2px 2px 10px}
.sub34-t i{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;background:var(--cor);box-shadow:0 8px 18px -10px var(--cor)}
.sub34-t b{font-size:22px;font-weight:800;letter-spacing:-.02em}
.sub34-abas{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:4px;border-radius:16px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.sub34-abas::-webkit-scrollbar{display:none}
.sub34-abas button{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;font-weight:700;font-size:14px;color:var(--creme2);white-space:nowrap;transition:background .2s,color .2s,transform .2s var(--mola,ease)}
.sub34-abas button i{font-size:17px}
.sub34-abas button:hover{background:var(--noite);color:var(--creme);transform:translateY(-1px)}
.sub34-abas button.on{background:var(--cor);color:#fff;box-shadow:0 8px 18px -10px var(--cor)}
.sub34-abas button .contador{margin-left:2px}
.bar34{display:none}
@media (max-width:860px){
  .bar34{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid var(--linha);box-shadow:0 -8px 24px -14px rgba(0,0,0,.25);padding:6px 6px calc(6px + env(safe-area-inset-bottom))}
  .bar34 button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:12px;font-size:11.5px;font-weight:700;color:var(--creme3);position:relative;transition:color .2s,transform .2s var(--mola,ease)}
  .bar34 button i.ti{font-size:23px}
  .bar34 button.on{color:var(--cor,var(--vermelho))}
  .bar34 button.on i.ti{transform:translateY(-2px) scale(1.08)}
  .bar34 button:active{transform:scale(.94)}
  .bar34 .bolinha{position:absolute;top:2px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:99px;background:var(--vermelho);color:#fff;font:800 10.5px/18px var(--font);font-style:normal}
  #app.adm > .wrap{padding-bottom:86px}
  .sub34-t b{font-size:19px}
}
.c34-topo{margin:2px 2px 14px}
.c34-topo h2{font-size:clamp(24px,3.2vw,32px);font-weight:800;letter-spacing:-.025em;line-height:1.1}
.c34-topo p{color:var(--creme2);font-weight:600;margin-top:2px}.c34-topo p::first-letter{text-transform:uppercase}
.c34-caixa{background:#fff;border:1px solid var(--linha);border-radius:22px;padding:16px;box-shadow:var(--sh)}
.c34-caixa.ok{background:linear-gradient(135deg,#fff,var(--ok-bg))}
.c34-cab{display:flex;align-items:center;gap:10px;margin:2px 4px 12px}
.c34-cab h3{font-size:18px;font-weight:800}
.c34-n{min-width:28px;height:28px;padding:0 9px;border-radius:99px;background:var(--vermelho);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;animation:pcPulsa34 2s infinite}
@keyframes pcPulsa34{0%,100%{box-shadow:0 0 0 0 rgba(227,16,31,.45)}60%{box-shadow:0 0 0 9px rgba(227,16,31,0)}}
.c34-lista{display:flex;flex-direction:column;gap:8px}
.c34-it{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;border-radius:16px;background:var(--noite);border-left:4px solid var(--warn);transition:transform .2s var(--mola,ease),box-shadow .2s,background .2s;animation:entraCard .45s var(--mola,ease) both;animation-delay:calc(var(--k,0) * 60ms)}
.c34-it.bad{border-left-color:var(--bad)}.c34-it.info{border-left-color:var(--info)}
.c34-it:hover{background:#fff;transform:translateX(3px);box-shadow:var(--sh)}
.c34-it:active{transform:scale(.98)}
.c34-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;background:var(--warn-bg);color:#B7791F}
.c34-it.bad .c34-ic{background:var(--bad-bg);color:var(--bad)}
.c34-it b{display:block;font-size:15px;line-height:1.25}.c34-it small{display:block;font-size:12.5px;color:var(--creme3);margin-top:2px}
.c34-btn{flex-shrink:0;display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:800;color:var(--vermelho);padding:7px 11px;border-radius:99px;background:var(--vermelho-claro,rgba(227,16,31,.08));transition:transform .2s}
.c34-it:hover .c34-btn{transform:translateX(2px)}
.c34-vazio{color:var(--creme2);margin:0 4px 4px;font-size:14.5px}
.c34-lojas{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.c34-loja{background:#fff;border:1px solid var(--linha);border-radius:18px;padding:14px 16px;box-shadow:var(--sh)}
.c34-loja small{color:var(--creme3);font-size:12.5px}
.c34-num{margin:10px 0 6px}.c34-num small{display:block}.c34-num b{font-size:24px;color:var(--vermelho)}
.c34-quem{display:flex;align-items:center;gap:6px}
.c34-ats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.c34-at{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:16px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh);font-weight:700;font-size:14px;text-align:left;transition:transform .2s var(--mola,ease),border-color .2s}
.c34-at i{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;background:var(--cor);flex-shrink:0}
.c34-at:hover{transform:translateY(-2px);border-color:var(--cor)}
@media (max-width:560px){.c34-it{padding:11px 12px;gap:10px}.c34-btn{padding:6px 9px;font-size:12px}.c34-ats{grid-template-columns:1fr 1fr}}
</style>`);
