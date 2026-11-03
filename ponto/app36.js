/* v36: entrar mais rápido depois do PIN (portal e Administração).
   1) Aquecimento: ao tocar no nome (ou em Administração), o portal já "acorda" o servidor do Google enquanto o PIN
      é digitado — a 1ª chamada depois de um tempo parado é a mais lenta (2–5 s a mais).
   2) Tela "Entrando…" animada no lugar do teclado travado, para ficar claro que está carregando.
   3) Administração lembrada no aparelho pessoal (igual ao login fixo da equipe, v27): depois do 1º PIN, abrir o portal
      vai direto para a Administração, NA HORA, com os últimos dados guardados no aparelho e o selo "Atualizando…"
      enquanto busca os novos. Só sai pelo "Sair da administração". Computador da loja (modo loja) nunca lembra.
      Se o aparelho lembra da Administração e de uma colaboradora, abre o que foi usado por último.
   Guarda só o hash do PIN (como o v27) e os dados no IndexedDB do v32 (chave "__admin"). */
const R36 = {quente:0, prevTela:null, salvo:null};
const ADM_KEY = 'lv_lembrar_adm', ADM_DIAS = 60;
function admLer(){ const l = LS.get(ADM_KEY, null); if(!l || !l.cred) return null; if(Date.now()-(l.em||0) > ADM_DIAS*864e5){ LS.del(ADM_KEY); return null; } return l; }
function admGuardar(){ if(modoLoja() || !S.adm || !S.adm.cred) return; LS.set(ADM_KEY, {cred:S.adm.cred, perfil:S.adm.perfil||'', em:Date.now()}); }
function admEsquecer(){ LS.del(ADM_KEY); R36.salvo = null; try{ r32Db().then(db=>db.transaction('dados','readwrite').objectStore('dados').delete('__admin')).catch(()=>{}); }catch(e){} }
function admLembrada(){ return !!(admLer() && S.tela==='admin' && S.adm && !modoLoja()); }

/* 1) aquecer o servidor enquanto digita o PIN */
function aquecer36(){
  if(Date.now() - R36.quente < 4*60e3 || !S.api) return;
  R36.quente = Date.now();
  api('boot').then(b=>{ if(b && b.ok){ LS.set('lv_boot', b); if(!S.sess && !S.adm) S.boot = b; } }).catch(()=>{ R36.quente = 0; });
}
const _abrirPinV36 = abrirPin;
abrirPin = function abrirPin(){ try{ aquecer36(); }catch(e){} return _abrirPinV36.apply(this, arguments); };

/* 2) "Entrando…" no lugar do teclado */
const _renderPinV36 = renderPin;
renderPin = function renderPin(){
  _renderPinV36.apply(this, arguments);
  const p = S.pin, m = $('#modal .modal');
  if(!p || !p.ocupado || !m) return;
  const adm = p.alvo==='__admin', c = (S.boot?.colaboradoras||[]).find(x=>x.id===p.alvo);
  const quem = adm ? 'Abrindo a administração…' : `Oi, ${esc(primeiroNome(c?.nome||''))}! Abrindo seu portal…`;
  const el = document.createElement('div'); el.className = 'pin36';
  el.innerHTML = `<div class="ic">${adm?'🔐':'✨'}</div><b>${quem}</b><div class="barra"><i></i></div><small>Só um instante</small>`;
  m.style.position = 'relative'; m.appendChild(el);
};

/* 3) Administração lembrada */
const _renderV36 = render;
render = function render(){
  const prev = R36.prevTela;
  const r = _renderV36.apply(this, arguments);
  try{
    if(prev==='admin' && S.tela!=='admin' && !S.adm) admEsquecer();          // saiu da administração
    if(S.tela==='admin' && S.adm && S.adm.cred && !modoLoja()){ admGuardar(); LS.set('lv_ultimo', 'adm'); }
    else if(S.tela==='portal' && S.sess) LS.set('lv_ultimo', 'eq');
  }catch(e){}
  R36.prevTela = S.tela;
  return r;
};
const _voltarV36 = voltar;
voltar = function voltar(){
  if(!modalAberto() && admLembrada()){ if(S.adm.tab!=='central'){ S.adm.tab = 'central'; render(); } return; }
  return _voltarV36.apply(this, arguments);
};
/* guarda os dados da administração no aparelho sempre que mudam */
setInterval(()=>{
  try{ if(admLembrada() && S.adm.dados && S.adm.dados !== R36.salvo && !S.adm.doAparelho){ R36.salvo = S.adm.dados; r32Gravar('__admin', S.adm.dados); } }catch(e){}
}, 4000);

function admRefrescar36(d){
  const A = S.adm; if(!A) return;
  A.dados = d; delete A.doAparelho;
  const ocupado = modalAberto() || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
  if(!ocupado) render();
}
async function admAbrir36(l, chamar){
  const pre = api('admDados', l.cred); pre.catch(()=>{});
  const guardado = await r32Ler('__admin');
  const boot = S.boot || LS.get('lv_boot', null);
  const fresco = guardado && guardado.dados && (Date.now() - (guardado.em||0) < 3*864e5);
  const novoAdm = d => ({cred:l.cred, dados:d, tab:'central', eid:null, mes:mesDe(d.hoje || hojeISO()), perfil:l.perfil || undefined, _v34:true});
  if(fresco && boot){
    S.boot = boot; S.adm = novoAdm(guardado.dados); S.adm.doAparelho = true; R36.salvo = guardado.dados;
    S.tela = 'admin'; render();
    try{ r32Selo(true); }catch(e){}
    chamar(); document.body.classList.remove('lv-entrando');
  } else {
    document.body.classList.add('lv-entrando');
    await chamar().catch(()=>{});
  }
  try{
    const d = await pre;
    if(S.adm && S.adm.cred===l.cred) admRefrescar36(d);
    else if(!S.adm && !S.sess && S.tela==='inicio'){ S.adm = novoAdm(d); S.tela = 'admin'; render(); }
  }catch(e){
    if(!erroRede(e)){ admEsquecer(); if(S.adm && S.adm.cred===l.cred){ S.adm = null; S.tela = 'inicio'; render(); } toast('Entre de novo com o PIN da administração 🔐', true); }
    else if(S.adm && S.adm.doAparelho) toast('Sem conexão — mostrando os dados guardados', true);
  }finally{
    document.body.classList.remove('lv-entrando');
    try{ r32Selo(false); }catch(e){}
  }
}
const _carregarV36 = carregar;
carregar = async function carregar(){
  const args = arguments, chamar = () => _carregarV36.apply(this, args);
  const la = admLer(), eq = typeof lembrarLer==='function' ? lembrarLer() : null;
  const especial = (typeof flChaveDaUrl==='function' && flChaveDaUrl()) || /^#(pc|ponto|qr)/i.test(location.hash||'');
  if(la && !modoLoja() && S.tela==='inicio' && !S.sess && !S.adm && !especial && S.api && (LS.get('lv_ultimo','')==='adm' || !eq)) return admAbrir36(la, chamar);
  return chamar();
};

(function(){ const st = document.createElement('style'); st.textContent = `
.pin36{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;
  background:var(--noite2,#fff);border-radius:inherit;animation:pin36Entra .25s both}
.pin36 .ic{font-size:44px;animation:pin36Pula 1s ease-in-out infinite}
.pin36 b{font-size:17px;line-height:1.3}
.pin36 small{color:var(--creme3,#888);font-size:13px}
.pin36 .barra{width:72%;height:7px;border-radius:99px;background:var(--linha,rgba(0,0,0,.08));overflow:hidden}
.pin36 .barra i{display:block;height:100%;width:40%;border-radius:99px;background:linear-gradient(90deg,#E3101F,#F5B524);animation:pin36Barra 1.1s ease-in-out infinite}
@keyframes pin36Entra{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
@keyframes pin36Pula{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pin36Barra{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}
@media (prefers-reduced-motion:reduce){.pin36 .ic,.pin36 .barra i{animation:none}}
`; document.head.appendChild(st); })();
