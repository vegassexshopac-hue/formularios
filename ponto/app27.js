/* v27: login fixo no celular/computador pessoal.
   • Entrou com o PIN no aparelho dela → fica lembrada (60 dias, renovando a cada uso). Ao abrir o portal, já entra direto.
   • No computador autorizado da loja (modoLoja) NADA é lembrado — lá continua pedindo o PIN a cada ponto.
   • Administração continua pedindo o PIN sempre.
   • Só sai quando ela toca em "Sair do portal". O botão Voltar do celular não desloga mais (volta para o Início).
   • Se o PIN for trocado pela administração, o aparelho pede o PIN de novo.
   Guarda só o hash do PIN (o mesmo que o portal já manda ao servidor), em localStorage do próprio aparelho. */
const LEMBRAR_KEY = 'lv_lembrar', LEMBRAR_DIAS = 60;
function lembrarLer(){ const l = LS.get(LEMBRAR_KEY, null); if(!l || !l.eid || !l.cred) return null; if(Date.now() - (l.em||0) > LEMBRAR_DIAS*864e5){ LS.del(LEMBRAR_KEY); return null; } return l; }
function lembrarGuardar(eid, cred){ if(modoLoja()) return; LS.set(LEMBRAR_KEY, {eid, cred, em:Date.now()}); }
function lembrarApagar(){ LS.del(LEMBRAR_KEY); }
function lembrado(){ const l = lembrarLer(); return !!(l && S.sess && S.sess.eid===l.eid); }

/* logo depois do login com PIN (tecla → S.sess → emprestarCredFila) */
const _emprestarCredFilaV27 = emprestarCredFila;
emprestarCredFila = function emprestarCredFila(eid, cred){
  try{ if(!modoLoja() && S.sess && S.sess.eid===eid && !S.sess.offline) lembrarGuardar(eid, cred); }catch(e){}
  return _emprestarCredFilaV27.apply(this, arguments);
};

/* "Sair do portal" apaga; telas de sucesso do ponto (que chamam sair sozinhas) voltam para o portal */
const _sairV27 = sair;
sair = function sair(){
  if(!modoLoja() && lembrado() && (S.tela==='sucesso' || S.tela==='bater')){ S.tela = 'portal'; S.portalTab = 'inicio'; render(); return; }
  lembrarApagar();
  return _sairV27.apply(this, arguments);
};

/* Voltar do celular dentro do portal: não desloga */
const _voltarV27 = voltar;
voltar = function voltar(){
  if(!modalAberto() && S.tela==='portal' && !modoLoja() && lembrado()){
    if(S.portalTab && S.portalTab!=='inicio'){ S.portalTab = 'inicio'; render(); }
    return;
  }
  return _voltarV27.apply(this, arguments);
};

/* ao abrir: entra direto se este aparelho lembra de alguém */
async function lembrarEntrar(){
  const l = lembrarLer();
  if(!l || modoLoja() || S.sess || S.tela!=='inicio' || (typeof flChaveDaUrl==='function' && flChaveDaUrl())) return false;
  const c = (S.boot?.colaboradoras||[]).find(x=>x.id===l.eid);
  if(!c){ lembrarApagar(); return false; }
  try{
    const d = await api('entrar', {eid:l.eid, ...l.cred});
    if(S.sess || S.tela!=='inicio') return false;           // ela já fez outra coisa enquanto carregava
    S.sess = {eid:l.eid, cred:l.cred, dados:d};
    _emprestarCredFilaV27(l.eid, l.cred); enviarFila();
    lembrarGuardar(l.eid, l.cred);                           // renova os 60 dias
    S.portalTab = 'inicio'; S.portalMes = mesDe(d.hoje); S.tela = 'portal'; render();
    return true;
  }catch(e){
    if(!erroRede(e)){ lembrarApagar(); toast('Entre de novo com o seu PIN 🔐', true); }
    return false;
  }
}
const _carregarV27 = carregar;
carregar = async function carregar(){
  const l = lembrarLer();
  if(l && !modoLoja()) document.body.classList.add('lv-entrando');
  try{ await _carregarV27.apply(this, arguments); await lembrarEntrar(); }
  finally{ document.body.classList.remove('lv-entrando'); }
};
(function(){ const st = document.createElement('style'); st.textContent = `
body.lv-entrando #app{opacity:.25;pointer-events:none;transition:opacity .2s}
body.lv-entrando::after{content:'Entrando…';position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);font:800 15px/1 system-ui,sans-serif;color:var(--creme,#222);background:var(--noite2,#fff);padding:14px 22px;border-radius:99px;box-shadow:0 8px 30px rgba(0,0,0,.15);z-index:99}
`; document.head.appendChild(st); })();
