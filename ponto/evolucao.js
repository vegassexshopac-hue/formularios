/* ═══════════ Portal Equipe Las Vegas · v40 — EVOLUÇÃO DO PORTAL ═══════════
   💡 Lampadazinha em cada bloco (.secao): a pessoa manda "Tenho uma ideia" / "Algo atrapalhou"
   ou a resposta rápida 👍 "Isso me ajuda" / 👎 "Não uso isso". A ideia vai COM O NOME de quem mandou.
   O portal anota só quais telas são abertas e quais botões são tocados — nunca o que é digitado,
   nem nomes de cliente ou produto (botões com números ou dentro de listas não entram).
   Administração › Início › Evolução: ideias por status (Nova → Aprovada → Em construção → Feita),
   resposta para quem sugeriu, o que a equipe mais usa e o que ninguém abriu no mês.
   Equipe: "Minhas ideias" (status + resposta) e aviso no Início quando a ideia ganha resposta.
   Dados no motor do Railway (portal-kommo-las-vegas, /api/evo/*) — nada muda no Apps Script. */
const EVO = { minhas:null, novidades:0, feitas:[], painel:null, filtro:'nova', fila:{telas:{}, botoes:{}}, tela:'', tMinhas:0, tPainel:0, carregando:false, modal:null, pronto:null };
(function(){
  const css = `
.ev-lamp{flex:none;width:26px;height:26px;border-radius:50%;border:0;display:inline-grid;place-items:center;background:#F5B524;color:#1C1416;font-size:14px;cursor:pointer;box-shadow:0 4px 12px -4px rgba(227,154,0,.8);transition:transform .18s var(--mola);margin-left:auto;position:relative;animation:evPisca 4s ease-in-out infinite}
.ev-lamp:hover{transform:scale(1.15) rotate(-8deg)}.ev-lamp:active{transform:scale(.88)}
.ev-lamp::after{content:attr(data-dica);position:absolute;right:calc(100% + 8px);top:50%;transform:translateY(-50%) scale(.9);background:#1C1416;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;padding:5px 9px;border-radius:8px;opacity:0;pointer-events:none;transition:.15s}
.ev-lamp:hover::after{opacity:1;transform:translateY(-50%) scale(1)}
.ev-flut{position:fixed;right:16px;bottom:86px;z-index:60;width:46px;height:46px;font-size:20px}
@media(min-width:901px){.ev-flut{bottom:22px}}
.ev-m{max-width:440px}
.ev-m .sub{color:var(--creme2);font-size:12.5px;margin:-4px 0 12px}
.ev-m label.t{display:block;font-weight:800;font-size:13.5px;margin:10px 0 6px}
.ev-rapida{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
.ev-rapida span{font-size:12.5px;color:var(--creme2);font-weight:700}
.ev-chip{border:1.5px solid var(--linha2);background:#fff;border-radius:99px;padding:7px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:transform .15s var(--mola)}
.ev-chip:hover{transform:translateY(-1px)}.ev-chip:active{transform:scale(.94)}
.ev-chip.on{background:#1C1416;color:#fff;border-color:#1C1416}
.ev-seg{display:inline-flex;background:var(--veludo2);border-radius:14px;padding:4px;gap:4px;margin-bottom:10px}
.ev-seg button{border:0;background:transparent;border-radius:10px;padding:7px 12px;font:inherit;font-size:13px;font-weight:800;color:var(--creme2);cursor:pointer}
.ev-seg button.on{background:#1C1416;color:#fff}
.ev-m textarea{width:100%;min-height:96px;border-radius:14px;border:1.5px solid var(--linha2);padding:10px 12px;font:inherit;font-size:14.5px;resize:vertical;box-sizing:border-box}
.ev-m textarea:focus{outline:3px solid rgba(245,181,36,.35);border-color:#F5B524}
.ev-pe{display:flex;align-items:center;gap:10px;margin-top:12px}
.ev-pe small{flex:1;color:var(--creme3);font-size:11.5px;line-height:1.35}
.ev-link{border:0;background:none;color:var(--vermelho2);font:inherit;font-weight:800;font-size:13px;cursor:pointer;padding:0;display:inline-flex;gap:5px;align-items:center}
.ev-it{background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:11px 13px;margin-bottom:8px;animation:evSobe .3s both}
.ev-it .top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--creme2)}
.ev-it p{margin:6px 0 0;font-size:14.5px;line-height:1.4;white-space:pre-wrap}
.ev-it .resp{margin-top:8px;background:var(--ouro-claro);border-radius:12px;padding:8px 10px;font-size:13.5px}
.ev-st{border-radius:99px;padding:3px 9px;font-size:11.5px;font-weight:800;white-space:nowrap}
.ev-st.nova{background:var(--info-bg);color:var(--info)}.ev-st.aprovada{background:var(--warn-bg);color:var(--warn)}
.ev-st.fazendo{background:#F3E8FF;color:#7C3AED}.ev-st.feita{background:var(--ok-bg);color:var(--ok)}.ev-st.recusada{background:var(--veludo2);color:var(--creme2)}
.ev-hero{position:relative;overflow:hidden;border-radius:22px;padding:18px 20px;color:#fff;background:linear-gradient(125deg,#1C1416,#3a0c12 55%,#B30A17);margin-bottom:14px;animation:evSobe .35s var(--mola)}
.ev-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.12) 48%,transparent 60%);background-size:260% 100%;animation:evBrilho 6s ease-in-out infinite;pointer-events:none}
.ev-hero h2{margin:0;font-size:clamp(20px,3vw,27px);letter-spacing:-.02em}.ev-hero p{margin:4px 0 0;opacity:.85;font-size:13.5px}
.ev-k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.ev-k div{background:rgba(255,255,255,.1);border-radius:14px;padding:9px 10px}.ev-k b{display:block;font-size:24px;font-weight:900;line-height:1}.ev-k small{font-size:11.5px;opacity:.8}
@media(max-width:600px){.ev-k{grid-template-columns:repeat(2,1fr)}}
.ev-filtros{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.ev-card{display:grid;grid-template-columns:42px 1fr;gap:10px;background:#fff;border-radius:18px;padding:12px 14px;box-shadow:var(--sh);margin-bottom:10px;animation:evSobe .35s both}
.ev-card .av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#fff;background:linear-gradient(135deg,var(--vermelho),#F5B524)}
.ev-card .quem{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.ev-card .quem b{font-size:15px}
.ev-card .onde{font-size:12px;color:var(--creme2)}
.ev-card p{margin:6px 0 0;font-size:15px;line-height:1.42;white-space:pre-wrap}
.ev-card .tipo{font-size:11.5px;font-weight:800;border-radius:99px;padding:2px 8px;background:var(--vermelho-claro);color:var(--vermelho2)}
.ev-card .acoes{grid-column:1/3;display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:4px}
.ev-card .acoes input{flex:1 1 200px;border:1.5px solid var(--linha2);border-radius:12px;padding:8px 10px;font:inherit;font-size:13.5px;min-width:0}
.ev-b{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;display:inline-flex;gap:5px;align-items:center;transition:transform .15s var(--mola)}
.ev-b:hover{transform:translateY(-1px)}.ev-b:active{transform:scale(.93)}
.ev-b.ap{background:var(--warn-bg);color:var(--warn)}.ev-b.fz{background:#F3E8FF;color:#7C3AED}.ev-b.ok{background:var(--ok);color:#fff}.ev-b.no{background:var(--veludo2);color:var(--creme2)}.ev-b.lx{background:transparent;color:var(--bad)}
.ev-grade{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
@media(max-width:800px){.ev-grade{grid-template-columns:1fr}}
.ev-box{background:#fff;border-radius:18px;padding:14px;box-shadow:var(--sh)}
.ev-box h3{margin:0 0 10px;font-size:15.5px}
.ev-bar{display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;gap:8px;align-items:center;font-size:13px;margin-bottom:7px}
.ev-bar .tr{height:10px;border-radius:99px;background:var(--veludo2);overflow:hidden}.ev-bar .tr i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),#F5B524);transform-origin:left;animation:evCresce .9s var(--mola) both}
.ev-bar small{color:var(--creme2);white-space:nowrap}
.ev-tags{display:flex;gap:6px;flex-wrap:wrap}.ev-tags span{background:var(--veludo2);border-radius:99px;padding:5px 10px;font-size:12.5px;font-weight:700}
.ev-vazio{text-align:center;padding:22px 10px;color:var(--creme2)}.ev-vazio .em{font-size:42px;display:block;animation:evFlutua 3s ease-in-out infinite}
.ev-ini{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:18px;padding:12px 14px;margin:0 0 12px;font:inherit;text-align:left;cursor:pointer;color:#1C1416;background:linear-gradient(120deg,#FFF3D6,#fff);box-shadow:0 0 0 2px #F5B524 inset;animation:evSobe .35s var(--mola)}
.ev-ini .em{font-size:28px;animation:evPisca 2s infinite}.ev-ini b{display:block}.ev-ini small{color:var(--creme2);font-size:12.5px}
@keyframes evPisca{0%,100%{box-shadow:0 4px 12px -4px rgba(227,154,0,.8)}50%{box-shadow:0 0 0 6px rgba(245,181,36,.25),0 4px 12px -4px rgba(227,154,0,.8)}}
@keyframes evSobe{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes evBrilho{0%,100%{background-position:100% 0}50%{background-position:0 0}}
@keyframes evCresce{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes evFlutua{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@media(prefers-reduced-motion:reduce){.ev-lamp,.ev-hero::after,.ev-ini .em,.ev-vazio .em,.ev-it,.ev-card,.ev-bar .tr i{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ───────── básico ───────── */
const EV_ST = {nova:'Nova', aprovada:'Aprovada ✅', fazendo:'Em construção 🛠️', feita:'Já está no portal 🚀', recusada:'Não por agora', registrada:'Registrada'};
const EV_TIPO = {ideia:'💡 Ideia', atrapalhou:'😕 Atrapalhou', ajuda:'👍 Me ajuda', naouso:'👎 Não uso'};
function evQuem(){ return typeof kmQuem==='function' && !!kmQuem(); }
/* o motor precisa ter /api/evo — sem ele, tudo fica escondido (sem erro para a equipe) */
function evLogado(){
  if(!evQuem()) return false;
  if(EVO.pronto===null){ EVO.pronto = 'testando'; kmApi('/api/evo/minhas').then(r=>{ EVO.pronto = true; EVO.minhas = r.ideias; EVO.novidades = r.novidades||0; EVO.feitas = r.feitas||[]; EVO.tMinhas = Date.now(); try{ render(); }catch(_){} })
    .catch(e=>{ EVO.pronto = /não encontrado/i.test(e.message) ? false : null; }); }
  return EVO.pronto === true;
}
function evAdm(){ return S.tela==='admin' && !!S.adm; }
function evPerfil(){ return (typeof perfil29==='function' && perfil29()==='matheus') ? 'matheus' : 'madu'; }
function evNomeTela(k){
  const lado = evAdm() ? 'admin' : 'portal';
  if(k==='evolucao') return 'Evolução';
  if(k==='central') return 'Precisa de mim';
  const n = (typeof NOMES12!=='undefined' && NOMES12[lado] && NOMES12[lado][k]) || '';
  if(n) return n;
  const b = document.querySelector(`[onclick*="tab='${k}'"]`);
  const t = b ? [...b.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join(' ').trim() : '';
  return t || (k ? k[0].toUpperCase()+k.slice(1) : 'Portal');
}
function evTelaAtual(){
  if(evAdm()) return {k:S.adm.tab||'central', nome:evNomeTela(S.adm.tab||'central')};
  if(S.tela==='portal') return {k:S.portalTab||'inicio', nome:S.portalTab==='inicio'||!S.portalTab ? 'Início' : evNomeTela(S.portalTab)};
  return null;
}
function evQuando(t){
  const m = Math.round((Date.now()-t)/60e3);
  if(m < 1) return 'agora'; if(m < 60) return `há ${m} min`;
  const h = Math.round(m/60); if(h < 24) return `há ${h} h`;
  const d = Math.round(h/24); return d===1 ? 'ontem' : `há ${d} dias`;
}
async function evApi(p, corpo){ return kmApi('/api/evo/'+p, corpo); }

/* ───────── uso (só telas abertas e botões tocados) ───────── */
function evMarcarTela(){
  if(!evLogado()) return;
  const t = evTelaAtual(); if(!t) return;
  const id = (evAdm()?'adm:':'eq:')+t.k;
  if(EVO.tela === id) return;
  EVO.tela = id; EVO.fila.telas[id] = (EVO.fila.telas[id]||0)+1;
}
document.addEventListener('click', e=>{
  try{
    if(!evLogado()) return;
    const b = e.target.closest('button, a.btn, [role="button"]'); if(!b || b.closest('#modal .ev-m')) return;
    if(b.closest('.km-row,.km-cli,.cp-it,.fid-card,[class*="prod"],[class*="cliente"],[class*="lista"],[class*="item"],table')) return;   // listas: podem ter nome de cliente/produto
    let txt = (b.getAttribute('title') || [...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ') || b.textContent || '').replace(/\s+/g,' ').trim();
    if(!txt || txt.length > 28 || /\d/.test(txt) || /R\$/.test(txt)) return;
    const t = evTelaAtual(); if(!t) return;
    const k = (evAdm()?'adm:':'eq:')+t.k+' › '+txt;
    EVO.fila.botoes[k] = (EVO.fila.botoes[k]||0)+1;
  }catch(_){}
}, true);
async function evEnviarUso(){
  const f = EVO.fila; if(!evLogado() || (!Object.keys(f.telas).length && !Object.keys(f.botoes).length)) return;
  EVO.fila = {telas:{}, botoes:{}};
  try{ await evApi('uso', f); }
  catch(e){ for(const [k,v] of Object.entries(f.telas)) EVO.fila.telas[k]=(EVO.fila.telas[k]||0)+v; for(const [k,v] of Object.entries(f.botoes)) EVO.fila.botoes[k]=(EVO.fila.botoes[k]||0)+v; }
}
setInterval(evEnviarUso, 60e3);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') evEnviarUso(); });

/* ───────── lampadazinhas ───────── */
function evLampadas(){
  document.querySelectorAll('.ev-flut').forEach(x=>{ if(!evLogado()) x.remove(); });
  if(!evLogado()) return;
  const app = document.getElementById('app'); if(!app) return;
  let n = 0;
  app.querySelectorAll('.secao').forEach(sec=>{
    if(sec.closest('#modal') || sec.querySelector('.ev-lamp')) { n++; return; }
    const bloco = [...sec.childNodes].map(x=>x.nodeType===3 ? x.textContent : (x.matches&&x.matches('button,.contador,small') ? '' : x.textContent)).join(' ').replace(/\s+/g,' ').trim().slice(0,60);
    const b = document.createElement('button');
    b.className = 'ev-lamp'; b.type = 'button'; b.innerHTML = '💡'; b.dataset.dica = 'Ideia para melhorar este bloco';
    b.setAttribute('aria-label', 'Ideia para melhorar este bloco');
    b.onclick = ev=>{ ev.stopPropagation(); evAbrir(bloco); };
    if(getComputedStyle(sec).display!=='flex'){ sec.style.display='flex'; sec.style.alignItems='center'; sec.style.gap='10px'; }
    sec.appendChild(b); n++;
  });
  let f = document.querySelector('.ev-flut');
  if(!f){
    f = document.createElement('button'); f.className = 'ev-lamp ev-flut'; f.type='button'; f.innerHTML='💡';
    f.dataset.dica = 'Ideia para melhorar o portal'; f.setAttribute('aria-label','Ideia para melhorar o portal');
    f.onclick = ()=>evAbrir(''); document.body.appendChild(f);
  }
  f.style.display = (n || S.tela==='lobby') ? 'none' : '';
}

/* ───────── modal "Como deixar o portal melhor?" ───────── */
function evAbrir(bloco, aba){
  const t = evTelaAtual() || {k:'portal', nome:'Portal'};
  EVO.modal = {bloco:bloco||'', tela:t.k, telaNome:t.nome, tipo:'ideia', rapida:'', aba:aba||'nova', texto:''};
  evPintarModal();
  if(!EVO.minhas || Date.now()-EVO.tMinhas > 60e3) evCarregarMinhas().then(()=>{ if(EVO.modal) evPintarModal(true); });
}
function evOpcoesTela(){
  const lado = evAdm() ? 'admin' : 'portal', M = EVO.modal, vistos = new Set(), ops = [];
  const add = (k, n) => { if(!k || vistos.has(k)) return; vistos.add(k); ops.push([k, n]); };
  add(M.tela, M.telaNome);
  document.querySelectorAll(`#app [onclick*="${lado==='admin'?'adm.tab':'portalTab'}='"]`).forEach(b=>{
    const m = (b.getAttribute('onclick')||'').match(/(?:portalTab|adm\.tab)='([\w-]+)'/); if(m) add(m[1], evNomeTela(m[1]));
  });
  add('geral', 'O portal todo');
  return ops;
}
function evPintarModal(soLista){
  const M = EVO.modal; if(!M) return;
  const ta = document.getElementById('ev-tx'); if(ta) M.texto = ta.value;
  const sel = document.getElementById('ev-tela'); if(sel){ M.tela = sel.value; M.telaNome = sel.options[sel.selectedIndex].text; }
  if(soLista && M.aba==='nova'){ const l = document.getElementById('ev-n-minhas'); if(l) l.outerHTML = evBotaoMinhas(); return; }
  const nome = evAdm() ? (evPerfil()==='matheus'?'Matheus':'Madu') : primeiroNome(S.sess?.dados?.colaboradora?.nome || '');
  const corpo = M.aba==='minhas' ? evListaMinhas() : `
      <p class="sub">Sua ideia entra direto na tela <b>Evolução</b>${nome?`, com o seu nome (${esc(nome)})`:''} 💛</p>
      ${M.bloco?`<div class="selo" style="margin-bottom:4px"><i class="ti ti-pin"></i> Bloco: <b>${esc(M.bloco)}</b></div>`:''}
      <label class="t" for="ev-tela">Sobre qual parte?</label>
      <select id="ev-tela" class="inp" style="width:100%">${evOpcoesTela().map(([k,n])=>`<option value="${esc(k)}" ${k===M.tela?'selected':''}>${esc(n)}</option>`).join('')}</select>
      <div class="ev-rapida"><span>Resposta rápida:</span>
        <button class="ev-chip ${M.rapida==='ajuda'?'on':''}" onclick="evRapida('ajuda')">👍 Isso me ajuda</button>
        <button class="ev-chip ${M.rapida==='naouso'?'on':''}" onclick="evRapida('naouso')">Não uso isso</button></div>
      <div class="ev-seg"><button class="${M.tipo==='ideia'?'on':''}" onclick="EVO.modal.tipo='ideia';evPintarModal()">Tenho uma ideia</button><button class="${M.tipo==='atrapalhou'?'on':''}" onclick="EVO.modal.tipo='atrapalhou';evPintarModal()">Algo atrapalhou</button></div>
      <textarea id="ev-tx" maxlength="600" placeholder="${M.tipo==='ideia'?'O que você mudaria? Ex.: “queria ver o telefone da cliente aqui sem abrir a ficha”.':'O que te atrapalhou? Ex.: “o botão de finalizar some no celular”.'}">${esc(M.texto)}</textarea>
      <div class="ev-pe"><small><i class="ti ti-eye"></i> O portal anota quais telas e botões são usados — nunca o que você digita — para melhorar com o tempo.</small>
        <button class="btn pri" id="ev-env" onclick="evEnviar()"><i class="ti ti-send"></i> Enviar</button></div>
      <div style="margin-top:12px">${evBotaoMinhas()}</div>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)evFechar()"><div class="modal ev-m">
    <div class="modal-t"><div class="avatar" style="background:#F5B524;color:#1C1416">💡</div><h3 class="cresce">${M.aba==='minhas'?'Minhas ideias':'Como deixar o portal melhor?'}</h3><button class="icone" onclick="evFechar()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}</div></div></div>`;
  if(M.aba==='nova'){ const t2 = document.getElementById('ev-tx'); if(t2 && !soLista) setTimeout(()=>t2.focus({preventScroll:true}), 60); }
}
function evBotaoMinhas(){
  const n = EVO.novidades, q = (EVO.minhas||[]).filter(i=>i.tipo==='ideia'||i.tipo==='atrapalhou').length;
  return `<button class="ev-link" id="ev-n-minhas" onclick="EVO.modal.aba='minhas';evPintarModal();evMarcarVisto()"><i class="ti ti-bulb"></i> Minhas ideias${q?` (${q})`:''}${n?` <span class="contador">${n} resposta${n>1?'s':''}</span>`:''}</button>`;
}
function evListaMinhas(){
  const L = (EVO.minhas||[]).filter(i=>i.tipo==='ideia'||i.tipo==='atrapalhou');
  const feitas = (EVO.feitas||[]).slice(0,6);
  return `<button class="ev-link" style="margin-bottom:10px" onclick="EVO.modal.aba='nova';evPintarModal()"><i class="ti ti-arrow-left"></i> Mandar outra ideia</button>
    ${EVO.minhas===null ? '<div class="ev-vazio">Carregando…</div>' : !L.length ? '<div class="ev-vazio"><span class="em">💡</span>Você ainda não mandou nenhuma ideia.<br>Toque na lampadazinha de qualquer bloco!</div>'
      : L.map((i,x)=>`<div class="ev-it" style="animation-delay:${x*40}ms"><div class="top"><span class="ev-st ${i.status}">${EV_ST[i.status]||i.status}</span><span>${esc(i.telaNome||'')}${i.bloco?' · '+esc(i.bloco):''}</span><span style="margin-left:auto">${evQuando(i.em)}</span></div>
        <p>${esc(i.texto)}</p>${i.resposta?`<div class="resp"><b>${esc(i.por||'Administração')}:</b> ${esc(i.resposta)}</div>`:''}</div>`).join('')}
    ${feitas.length?`<h4 style="margin:16px 0 8px">🚀 Ideias da equipe que já viraram melhoria</h4>${feitas.map(f=>`<div class="ev-it"><div class="top"><b>${esc(f.autor)}</b><span>${esc(f.telaNome||'')}</span><span style="margin-left:auto">${evQuando(f.feitaEm)}</span></div><p>${esc(f.texto)}</p>${f.resposta?`<div class="resp">${esc(f.resposta)}</div>`:''}</div>`).join('')}`:''}`;
}
function evFechar(){ EVO.modal = null; fecharModal(); }
async function evRapida(tipo){
  const M = EVO.modal; if(!M) return;
  evPintarModal(); M.rapida = tipo; evPintarModal();
  try{ await evApi('ideia', {tipo, tela:M.tela, telaNome:M.telaNome, bloco:M.bloco, perfil:evAdm()?evPerfil():undefined}); toast(tipo==='ajuda'?'Anotado 👍 Obrigada!':'Anotado — vamos ver se dá pra melhorar ou tirar 👀'); }
  catch(e){ M.rapida=''; evPintarModal(); toast(e.message, true); }
}
async function evEnviar(){
  const M = EVO.modal; if(!M) return;
  evPintarModal();
  if(String(M.texto).trim().length < 3) return toast('Escreve sua ideia antes de enviar 🙂', true);
  const b = document.getElementById('ev-env'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Enviando…'; }
  try{
    const r = await evApi('ideia', {tipo:M.tipo, texto:M.texto, tela:M.tela, telaNome:M.telaNome, bloco:M.bloco, perfil:evAdm()?evPerfil():undefined});
    (EVO.minhas ||= []).unshift(r.ideia); EVO.painel = null;
    evFechar(); toast('Ideia enviada 💡 Obrigada! Você vai ver a resposta em “Minhas ideias”.');
    evConfete();
  }catch(e){ if(b){ b.disabled=false; b.innerHTML='<i class="ti ti-send"></i> Enviar'; } toast(e.message, true); }
}
function evConfete(){
  try{ if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    for(let i=0;i<26;i++){ const c=document.createElement('i'); c.textContent=['💡','✨','💛'][i%3]; c.style.cssText=`position:fixed;left:${50+(Math.random()-.5)*60}vw;top:-20px;font-style:normal;font-size:${14+Math.random()*12}px;z-index:9999;pointer-events:none;transition:transform 1.4s cubic-bezier(.2,.6,.4,1),opacity 1.4s`;
      document.body.appendChild(c); requestAnimationFrame(()=>{ c.style.transform=`translate(${(Math.random()-.5)*160}px,${60+Math.random()*40}vh) rotate(${Math.random()*360}deg)`; c.style.opacity='0'; }); setTimeout(()=>c.remove(),1500); } }catch(_){}
}
async function evCarregarMinhas(){
  if(!evLogado()) return;
  try{ const r = await evApi('minhas'); EVO.minhas = r.ideias; EVO.novidades = r.novidades||0; EVO.feitas = r.feitas||[]; EVO.tMinhas = Date.now(); }
  catch(e){ if(EVO.minhas===null) EVO.minhas = []; }
}
async function evMarcarVisto(){ if(!EVO.novidades) return; EVO.novidades = 0; try{ await evApi('vi', {}); }catch(_){} }

/* ───────── Administração › Início › Evolução ───────── */
async function evCarregarPainel(forcar){
  if(EVO.carregando || (!forcar && EVO.painel && Date.now()-EVO.tPainel < 30e3)) return;
  EVO.carregando = true;
  try{ EVO.painel = await evApi('painel'); EVO.tPainel = Date.now(); }
  catch(e){ EVO.painel = {erro:e.message}; }
  EVO.carregando = false;
  if(evAdm() && (S.adm.tab==='evolucao' || S.adm.tab==='central')) render();
}
function evTelaAdm(){
  const P = EVO.painel;
  if(EVO.pronto===false) return '<div class="nota"><i class="ti ti-plug-x"></i><div><b>Falta publicar o servidor da Evolução</b> (motor do Railway). Assim que ele estiver no ar, as ideias aparecem aqui.</div></div>';
  if(!P){ evCarregarPainel(); return '<div class="ev-vazio"><span class="em">💡</span>Carregando as ideias da equipe…</div>'; }
  if(P.erro) return `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${esc(P.erro)}<br><button class="btn pri" style="margin-top:8px" onclick="EVO.painel=null;render()">Tentar de novo</button></div></div>`;
  const I = P.ideias, mes = new Date().toISOString().slice(0,7);
  const cont = s => I.filter(i=>i.status===s).length;
  const feitasMes = I.filter(i=>i.status==='feita' && new Date(i.mudou).toISOString().slice(0,7)===mes).length;
  const pessoas = new Set(I.map(i=>i.autor)).size;
  const F = EVO.filtro, lista = F==='todas' ? I : I.filter(i=>i.status===F);
  const fil = [['nova','Novas'],['aprovada','Aprovadas'],['fazendo','Em construção'],['feita','Feitas'],['recusada','Não agora'],['todas','Todas']];
  const card = (i,x) => `<div class="ev-card" style="animation-delay:${Math.min(x,8)*40}ms">
      <div class="av">${esc((i.autor||'?')[0])}</div>
      <div><div class="quem"><b>${esc(i.autor)}</b><span class="tipo">${EV_TIPO[i.tipo]||''}</span><span class="ev-st ${i.status}">${EV_ST[i.status]||i.status}</span></div>
        <div class="onde">${esc(i.telaNome||i.tela||'')}${i.bloco?' · '+esc(i.bloco):''} · ${evQuando(i.em)}${i.por?` · por ${esc(i.por)}`:''}</div>
        <p>${esc(i.texto)}</p>${i.resposta?`<div class="ev-it resp" style="margin-top:8px;border:0;padding:8px 10px;background:var(--ouro-claro)"><b>Resposta:</b> ${esc(i.resposta)}</div>`:''}</div>
      <div class="acoes">
        <input id="ev-r-${i.id}" placeholder="Resposta para ${esc(i.autor)} (opcional)" value="${esc(i.resposta||'')}" maxlength="400">
        ${i.status!=='aprovada'&&i.status!=='feita'?`<button class="ev-b ap" onclick="evMudar('${i.id}','aprovada')"><i class="ti ti-thumb-up"></i> Aprovar</button>`:''}
        ${i.status!=='fazendo'&&i.status!=='feita'?`<button class="ev-b fz" onclick="evMudar('${i.id}','fazendo')"><i class="ti ti-tools"></i> Fazendo</button>`:''}
        ${i.status!=='feita'?`<button class="ev-b ok" onclick="evMudar('${i.id}','feita')"><i class="ti ti-rocket"></i> Feita</button>`:''}
        ${i.status!=='recusada'&&i.status!=='feita'?`<button class="ev-b no" onclick="evMudar('${i.id}','recusada')">Não agora</button>`:''}
        ${i.status==='feita'||i.status==='recusada'?`<button class="ev-b no" onclick="evMudar('${i.id}','',true)"><i class="ti ti-message"></i> Salvar resposta</button>`:''}
        ${evPerfil()==='matheus'?`<button class="ev-b lx" title="Apagar" onclick="evApagar('${i.id}')"><i class="ti ti-trash"></i></button>`:''}
      </div></div>`;
  const telas = (P.uso.telas||[]).filter(t=>t.tela.startsWith('eq:') || t.tela.startsWith('adm:'));
  const eq = telas.filter(t=>t.tela.startsWith('eq:')), max = Math.max(1, ...eq.map(t=>t.vezes));
  const nomeT = k => { const [l, t] = k.split(':'); const n = (typeof NOMES12!=='undefined' && NOMES12[l==='adm'?'admin':'portal']?.[t]) || (t==='inicio'?'Início':t==='central'?'Precisa de mim':t==='evolucao'?'Evolução':t); return n; };
  const conhecidas = typeof NOMES12!=='undefined' ? Object.keys(NOMES12.portal) : [];
  const nunca = conhecidas.filter(k=>!eq.some(t=>t.tela==='eq:'+k)).map(k=>NOMES12.portal[k]);
  const reac = Object.entries(P.reacoes||{});
  return `<div class="ev-hero"><h2>💡 Evolução do portal</h2><p>O que a equipe pede, o que já melhorou e o que ninguém usa — para o portal evoluir com quem usa todo dia.</p>
      <div class="ev-k"><div><b>${cont('nova')}</b><small>ideias novas</small></div><div><b>${cont('aprovada')+cont('fazendo')}</b><small>aprovadas / em construção</small></div><div><b>${feitasMes}</b><small>feitas este mês</small></div><div><b>${pessoas}</b><small>pessoas já sugeriram</small></div></div></div>
    <div class="ev-filtros">${fil.map(([k,n])=>`<button class="ev-chip ${F===k?'on':''}" onclick="EVO.filtro='${k}';render()">${n}${k!=='todas'&&cont(k)?` · ${cont(k)}`:''}</button>`).join('')}
      <button class="ev-chip" style="margin-left:auto" onclick="evAbrir('')">💡 Mandar ideia</button><button class="icone" title="Atualizar" onclick="evCarregarPainel(true)"><i class="ti ti-refresh"></i></button></div>
    ${lista.length ? lista.slice(0,60).map(card).join('') : `<div class="ev-vazio"><span class="em">${F==='nova'?'✨':'💡'}</span>${F==='nova'?'Nenhuma ideia nova esperando. Tudo em dia!':'Nada aqui por enquanto.'}<br><small>A equipe manda ideias pela 💡 em cada bloco do portal.</small></div>`}
    <h2 class="secao" style="margin-top:22px">O que a equipe usa (${esc(P.uso.mes||'')})</h2>
    <div class="ev-grade">
      <div class="ev-box"><h3>📈 Telas mais abertas pela equipe</h3>${eq.length ? eq.slice(0,10).map(t=>`<div class="ev-bar"><span>${esc(nomeT(t.tela))}</span><div class="tr"><i style="width:${Math.round(t.vezes/max*100)}%"></i></div><small>${t.vezes}× · ${t.pessoas} pessoa${t.pessoas>1?'s':''}</small></div>`).join('') : '<p class="ev-vazio" style="padding:8px">Ainda sem dados — começa a contar quando a equipe entrar no portal.</p>'}</div>
      <div class="ev-box"><h3>💤 Ninguém da equipe abriu este mês</h3>${eq.length ? (nunca.length?`<div class="ev-tags">${nunca.map(n=>`<span>${esc(n)}</span>`).join('')}</div><p style="font-size:12.5px;color:var(--creme2);margin:10px 0 0">Vale perguntar: ninguém precisa ou ninguém sabe que existe?</p>`:'<p>Todas as telas foram usadas 🎉</p>') : '<p class="ev-vazio" style="padding:8px">Aparece quando houver uso registrado.</p>'}
        ${reac.length?`<h3 style="margin-top:14px">👍 / 👎 Respostas rápidas</h3>${reac.map(([t,r])=>`<div class="ev-bar" style="grid-template-columns:1fr auto"><span>${esc(t)}</span><small>👍 ${r.ajuda} · 👎 ${r.naouso}</small></div>`).join('')}`:''}</div>
    </div>
    ${(P.uso.botoes||[]).length?`<div class="ev-box" style="margin-top:12px"><h3>👆 Botões mais tocados</h3><div class="ev-tags">${P.uso.botoes.slice(0,24).map(b=>`<span>${esc(b.botao.replace(/^(adm|eq):([\w-]+)/,(m,l,t)=>nomeT(l+':'+t)))} · ${b.vezes}</span>`).join('')}</div></div>`:''}`;
}
async function evMudar(id, status, soResposta){
  const inp = document.getElementById('ev-r-'+id), resposta = inp ? inp.value : undefined;
  try{
    const r = await evApi('ideia/'+id, {status:soResposta?undefined:status, resposta, perfil:evPerfil()});
    const i = EVO.painel.ideias.findIndex(x=>x.id===id); if(i>=0) EVO.painel.ideias[i] = r.ideia;
    toast(status==='feita'?'Feita 🚀 Quem sugeriu vai ver no portal.':status==='aprovada'?'Aprovada ✅':status==='fazendo'?'Marcada como em construção 🛠️':status==='recusada'?'Guardada como “não por agora”':'Resposta salva ✔');
    if(status==='feita') evConfete();
    render();
  }catch(e){ toast(e.message, true); }
}
async function evApagar(id){
  if(!confirm('Apagar esta ideia de vez?')) return;
  try{ await evApi('ideia/'+id, {apagar:true}); EVO.painel.ideias = EVO.painel.ideias.filter(x=>x.id!==id); render(); toast('Apagada'); }catch(e){ toast(e.message, true); }
}

/* aba "Evolução" na Administração (área Início) — mesmo truque da campanha: casca da tela Atalhos */
try{ if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='inicio'); if(a && !a.k.includes('evolucao')) a.k.push('evolucao'); } }catch(e){}
try{ if(typeof NOMES12!=='undefined') NOMES12.admin.evolucao = 'Evolução'; }catch(e){}
const _telaAdminEvo = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, aqui = A.tab === 'evolucao';
  let h;
  if(aqui){
    const orig = admAtalhos, marca = '<!--ev-adm-conteudo-->';
    A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminEvo(); } finally { admAtalhos = orig; A.tab = 'evolucao'; }
    const i = h.indexOf(marca);
    h = i >= 0 ? h.slice(0, i) + evTelaAdm() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminEvo();
  const n = EVO.painel && !EVO.painel.erro ? EVO.painel.ideias.filter(i=>i.status==='nova').length : 0;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='evolucao';render()"><i class="ti ti-bulb"></i> Evolução ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};

/* "O que precisa de mim hoje": ideias novas da equipe */
function evGancho34(){
  if(window._ev34 || typeof itens34 !== 'function') return; window._ev34 = true;
  const _itens34Evo = itens34;
  itens34 = function itens34(){
    const I = _itens34Evo.apply(this, arguments);
    try{
      if(!evLogado()) return I;
      if(!EVO.painel){ evCarregarPainel(); return I; }
      if(EVO.painel.erro) return I;
      const nv = EVO.painel.ideias.filter(i=>i.status==='nova');
      if(nv.length) I.push({c:'info', i:'ti-bulb', t:`${nv.length===1?'1 ideia nova':nv.length+' ideias novas'} da equipe para o portal`, s:nv.slice(0,3).map(i=>`${i.autor}: ${String(i.texto).slice(0,40)}${i.texto.length>40?'…':''}`).join(' · '), b:'Ver ideias', go:()=>{ S.adm.tab='evolucao'; EVO.filtro='nova'; }});
    }catch(e){}
    return I;
  };
}

/* Início da equipe: aviso quando a ideia ganhou resposta */
if(typeof portalInicio === 'function'){
  const _portalInicioEvo = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioEvo.apply(this, arguments);
    if(!EVO.minhas || Date.now()-EVO.tMinhas > 5*60e3){ if(!EVO._buscando){ EVO._buscando = true; evCarregarMinhas().then(()=>{ EVO._buscando=false; if(EVO.novidades && S.tela==='portal' && (S.portalTab||'inicio')==='inicio') render(); }); } }
    if(!EVO.novidades) return h;
    const ult = (EVO.minhas||[]).find(i=>!i.viu && i.status!=='nova' && i.status!=='registrada');
    const card = `<button class="ev-ini" onclick="evAbrir('', 'minhas');evMarcarVisto()"><span class="em">💡</span><span><b>${ult&&ult.status==='feita'?'Sua ideia virou melhoria no portal! 🚀':'Sua ideia ganhou resposta!'}</b><small>${ult?esc(String(ult.texto).slice(0,70)):''} — toque para ver</small></span></button>`;
    const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
    return f >= 0 ? h.slice(0, f+6) + card + h.slice(f+6) : card + h;
  };
}

/* busca rápida (Ctrl+K) */
if(typeof itensBusca === 'function'){
  const _itensBuscaEvo = itensBusca;
  itensBusca = function itensBusca(){
    const r = _itensBuscaEvo.apply(this, arguments), adm = evAdm();
    if(adm) r.unshift({t:'Evolução do portal', s:'Ideias da equipe e o que é mais usado', i:'ti-bulb', go:()=>{ S.adm.tab='evolucao'; render(); }});
    if(adm || S.sess) r.unshift({t:'Mandar uma ideia para o portal', s:'💡 Como deixar o portal melhor?', i:'ti-bulb', go:()=>evAbrir('')});
    return r;
  };
}

/* sair: esquece o que era da pessoa */
const _sairEvo = typeof sair==='function' ? sair : null;
if(_sairEvo) sair = function sair(){ evEnviarUso(); Object.assign(EVO, {minhas:null, novidades:0, feitas:[], painel:null, tela:'', tMinhas:0}); return _sairEvo.apply(this, arguments); };

/* depois de cada desenho: marca a tela e coloca as lâmpadas */
const _renderEvo = render;
render = function render(){
  const r = _renderEvo.apply(this, arguments);
  try{ evGancho34(); evMarcarTela(); requestAnimationFrame(evLampadas); }catch(e){}
  return r;
};
