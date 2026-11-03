/* v32: portal mais rápido para abrir.
   • Celular/computador pessoal com login fixo (v27): ao abrir, mostra NA HORA os últimos dados guardados no próprio aparelho
     e busca os novos ao mesmo tempo (selo "Atualizando…" no canto). Quando chegam, a tela troca sozinha.
   • Sem dados guardados: busca a tela inicial e os dados da colaboradora AO MESMO TEMPO (antes era um depois do outro).
   • Os arquivos do portal ficam guardados no aparelho (sw.js na raiz): abrir de novo não baixa tudo outra vez.
   No computador da loja (modo loja) nada muda: lá não se guarda nada de ninguém.
   Os dados ficam no IndexedDB do aparelho e são apagados no "Sair do portal". */
const R32 = {db:null, guardado:null, atualizando:false, pre:null};

/* ───────── guardar/ler os dados no aparelho (IndexedDB: cabe bem mais que o localStorage) ───────── */
function r32Db(){
  if(R32.db) return R32.db;
  R32.db = new Promise((ok, falha)=>{
    try{
      const rq = indexedDB.open('lv_portal', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('dados');
      rq.onsuccess = () => ok(rq.result);
      rq.onerror = () => falha(rq.error);
    }catch(e){ falha(e); }
  });
  R32.db.catch(()=>{ R32.db = null; });
  return R32.db;
}
async function r32Ler(eid){
  try{
    const db = await r32Db();
    return await new Promise(ok=>{ const rq = db.transaction('dados').objectStore('dados').get(eid); rq.onsuccess = () => ok(rq.result||null); rq.onerror = () => ok(null); });
  }catch(e){ return null; }
}
async function r32Gravar(eid, dados){
  try{ const db = await r32Db(); db.transaction('dados', 'readwrite').objectStore('dados').put({em:Date.now(), dados}, eid); }catch(e){}
}
async function r32Apagar(){
  try{ const db = await r32Db(); db.transaction('dados', 'readwrite').objectStore('dados').clear(); }catch(e){}
}
function r32PodeGuardar(){ return !!(S.sess && S.sess.dados && !S.sess.offline && !modoLoja() && typeof lembrado==='function' && lembrado()); }

/* ───────── o pacote da colaboradora é guardado sempre que muda (entrar, venda, checklist…) ───────── */
setInterval(()=>{
  if(!r32PodeGuardar() || S.sess.doAparelho || S.sess.dados===R32.guardado) return;
  R32.guardado = S.sess.dados; r32Gravar(S.sess.eid, S.sess.dados);
}, 4000);
const _apiV32 = api;
api = async function api(a, dados={}){
  if(a==='entrar' && R32.pre && dados && dados.eid===R32.pre.eid){ const p = R32.pre.p; R32.pre = null; return p; }
  const r = await _apiV32(a, dados);
  return r;
};

/* ───────── selo "Atualizando…" ───────── */
(function(){ const st = document.createElement('style'); st.textContent = `
body.lv-entrando.lv-rapido #app{opacity:1;pointer-events:auto}
body.lv-entrando.lv-rapido::after{display:none}
#r32-selo{position:fixed;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:60;display:flex;align-items:center;gap:7px;
  padding:7px 12px;border-radius:99px;font:700 12.5px/1 var(--font,system-ui);background:var(--noite2,#fff);color:var(--creme,#222);
  box-shadow:0 6px 22px rgba(0,0,0,.16);opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;pointer-events:none}
#r32-selo.on{opacity:1;transform:none}
#r32-selo i{animation:r32gira 1s linear infinite;display:inline-block}
@keyframes r32gira{to{transform:rotate(360deg)}}
@media (min-width:900px){#r32-selo{bottom:16px}}
`; document.head.appendChild(st); })();
function r32Selo(on, txt){
  let el = document.getElementById('r32-selo');
  if(!el){ el = document.createElement('div'); el.id = 'r32-selo'; document.body.appendChild(el); }
  el.innerHTML = `<i class="ti ti-refresh"></i> ${txt||'Atualizando…'}`;
  el.classList.toggle('on', !!on);
}

/* ninguém está digitando nem com janela aberta → pode redesenhar a tela */
function r32PodeRedesenhar(){
  const a = document.activeElement;
  if(typeof modalAberto==='function' && modalAberto()) return false;
  if(document.getElementById('festa')) return false;
  if(a && (a.tagName==='INPUT' || a.tagName==='TEXTAREA' || a.tagName==='SELECT' || a.isContentEditable)) return false;
  return true;
}
function r32Redesenhar(){
  if(r32PodeRedesenhar()){ render(); return; }
  const tenta = () => { if(r32PodeRedesenhar()){ render(); } else setTimeout(tenta, 1500); };
  setTimeout(tenta, 1500);
}

/* ───────── abrir o portal ───────── */
const _carregarV32 = carregar;
carregar = async function carregar(){
  let l = null;
  try{ l = typeof lembrarLer==='function' ? lembrarLer() : null; }catch(e){}
  const especial = (typeof flChaveDaUrl==='function' && flChaveDaUrl()) || /^#(pc|ponto|qr)/i.test(location.hash||'');
  if(!l || modoLoja() || S.sess || especial || S.tela!=='inicio' || !S.api) return _carregarV32.apply(this, arguments);

  // busca os dados dela JÁ (junto com a tela inicial), em vez de esperar a tela inicial terminar
  const pre = {eid:l.eid, p:_apiV32('entrar', {eid:l.eid, ...l.cred})};
  pre.p.catch(()=>{});
  R32.pre = pre;

  const guardado = await r32Ler(l.eid);
  const boot = S.boot || LS.get('lv_boot', null);
  const fresco = guardado && guardado.dados && (Date.now() - (guardado.em||0) < 3*864e5);
  if(!fresco || !boot || !(boot.colaboradoras||[]).some(c=>c.id===l.eid)){
    try{ return await _carregarV32.apply(this, arguments); } finally { R32.pre = null; }
  }

  // abre na hora com o que estava guardado
  R32.pre = null;
  S.boot = boot;
  S.sess = {eid:l.eid, cred:l.cred, dados:guardado.dados, doAparelho:true};
  S.portalTab = 'inicio'; S.portalMes = mesDe(guardado.dados.hoje || hojeISO()); S.tela = 'portal';
  document.body.classList.add('lv-rapido');
  render();
  R32.atualizando = true; r32Selo(true);

  // a tela inicial (boot) segue o caminho normal, sem tampar a tela
  const base = _carregarV32.apply(this, arguments).catch(()=>{});
  try{
    const d = await pre.p;
    if(S.sess && S.sess.eid===l.eid){
      S.sess.dados = d; delete S.sess.doAparelho;
      if(S.portalMes === mesDe(guardado.dados.hoje || '')) S.portalMes = mesDe(d.hoje);
      try{ emprestarCredFila(l.eid, l.cred); enviarFila(); }catch(e){}
      try{ lembrarGuardar(l.eid, l.cred); }catch(e){}
      R32.guardado = d; r32Gravar(l.eid, d);
      r32Redesenhar();
    }
  }catch(e){
    if(typeof erroRede==='function' && erroRede(e)) toast('Sem internet — mostrando os últimos dados guardados', true);
    else if(S.sess && S.sess.eid===l.eid && /PIN|não encontrada/i.test(e.message||'')){ try{ lembrarApagar(); }catch(x){} r32Apagar(); S.sess = null; S.tela = 'inicio'; render(); toast('Entre de novo com o seu PIN 🔐', true); }
    else toast('Não consegui atualizar agora ('+(e.message||'erro')+') — mostrando os últimos dados guardados', true);
  }finally{
    R32.atualizando = false; r32Selo(false);
    await base;
    document.body.classList.remove('lv-rapido');
  }
};

/* "Sair do portal" apaga o que estava guardado no aparelho */
const _sairV32 = sair;
sair = function sair(){
  const r = _sairV32.apply(this, arguments);
  try{ if(!lembrarLer()) r32Apagar(); }catch(e){}
  return r;
};

/* arquivos do portal guardados no aparelho (sw.js na raiz do site). Para testar sem ele: abrir com ?sem-sw */
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  if(/[?&]sem-sw\b/.test(location.search)) navigator.serviceWorker.getRegistrations().then(l=>l.forEach(r=>r.unregister())).catch(()=>{});
  else window.addEventListener('load', ()=>{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
}
