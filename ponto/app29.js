/* ═══════════ Portal Equipe Las Vegas · v29 — perfis da administração (Madu × Matheus) ═══════════
   Ao entrar na administração (depois do PIN), escolhe-se quem está entrando:
   - Madu (gestão da loja): só o que se usa no dia a dia. Somem Nuvemshop, Roletas, Aparelhos e Regras,
     as subtelas de configuração (Estoque › Importar/Configurar, Kommo › Configurar, Clientes › Importar)
     e os avisos técnicos (Apps Script, servidor, webhook…) viram "o Matheus está ajustando".
   - Matheus (técnico): tudo, com as telas técnicas juntas no grupo "Técnico" do menu.
   Troca de perfil no cartão do topo do menu. Os dados são os mesmos para os dois (nada muda na planilha).
   Encaixe: embrulha telaAdmin, render (antes do app12 montar o menu), montarCasca12 e itensBusca. */
const PERFIS29 = {
  madu:    {nome:'Madu', papel:'Gestão da loja', em:'👩', cor:'#E3101F'},
  matheus: {nome:'Matheus', papel:'Parte técnica', em:'👨‍💻', cor:'#1E40AF'}
};
const TEC29 = ['nuvemshop','roleta','aparelhos','regras'];              // telas só do Matheus
const TEC_SUB29 = [/estSub='(config|importar)'/, /KM\.sub='config'/, /FA\.sub='importar'/];
const TEC_TXT29 = /apps\s*script|servidor|\.gs\b|nova vers[aã]o|webhook|token|implanta|propriedades do script|railway|\bAPI\b|client secret|oauth/i;
const perfil29 = () => (S.tela==='admin' && S.adm && S.adm.perfil) || null;
const madu29 = () => perfil29()==='madu';

function admPerfil29(p){
  if(!S.adm || !PERFIS29[p]) return;
  S.adm.perfil = p;
  try{ localStorage.setItem('lv_perfil_adm', p); }catch(e){}
  if(p==='madu' && TEC29.includes(S.adm.tab)) S.adm.tab = 'aovivo';
  render();
}
function trocarPerfil29(){
  if(!S.adm) return;
  const p = S.adm.perfil==='madu' ? 'matheus' : 'madu';
  if(p==='matheus' && !confirm('Entrar no modo técnico (Matheus)? Lá ficam integrações e configurações do sistema.')) return;
  admPerfil29(p);
  toast(PERFIS29[p].em+' Modo '+PERFIS29[p].nome);
}

(function(){
  if(document.getElementById('css29')) return;
  const st = document.createElement('style'); st.id = 'css29';
  st.textContent = `
  .perfil29{max-width:640px;margin:24px auto 0;text-align:center}
  .perfil29 h2{font-size:22px;margin:0 0 4px}
  .perfil29 .g{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px}
  .perfil29 button{all:unset;box-sizing:border-box;cursor:pointer;background:#fff;border:2px solid #eee;border-radius:20px;padding:26px 14px;display:flex;flex-direction:column;align-items:center;gap:6px;
    box-shadow:0 6px 20px rgba(0,0,0,.06);transition:transform .18s, border-color .18s, box-shadow .18s;animation:entra29 .45s both}
  .perfil29 button:nth-child(2){animation-delay:.08s}
  .perfil29 button:hover,.perfil29 button:focus-visible{transform:translateY(-4px) scale(1.02);border-color:var(--c);box-shadow:0 12px 28px rgba(0,0,0,.12)}
  .perfil29 button:active{transform:scale(.97)}
  .perfil29 .em{font-size:46px;line-height:1;animation:pula29 2.4s ease-in-out infinite}
  .perfil29 b{font-size:20px;color:var(--c)} .perfil29 small{color:#666;font-size:13.5px}
  .perfil29 .ult{font-size:11.5px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 10%,#fff);padding:2px 10px;border-radius:99px}
  .perfil29 .sair29{margin:22px auto 0;display:inline-flex}
  @keyframes entra29{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pula29{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @media (max-width:420px){.perfil29 .g{grid-template-columns:1fr}}
  @media (prefers-reduced-motion:reduce){.perfil29 button,.perfil29 .em{animation:none}}
  .menu-eu .troca29{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font-size:11.5px;font-weight:700;color:var(--c29,#E3101F);cursor:pointer;background:none;border:0;padding:0}
  .menu-eu .troca29:hover{text-decoration:underline}
  .nota.tec29{color:#555}`;
  document.head.appendChild(st);
})();

/* tela de escolha logo depois do PIN */
const _telaAdminV29 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm;
  if(A && !A.perfil){
    let ult = ''; try{ ult = localStorage.getItem('lv_perfil_adm')||''; }catch(e){}
    const card = k => { const p = PERFIS29[k];
      return `<button style="--c:${p.cor}" onclick="admPerfil29('${k}')"><span class="em">${p.em}</span><b>${p.nome}</b><small>${p.papel}</small>${ult===k?'<span class="ult">última vez</span>':''}</button>`; };
    return `<div class="wrap">${letreiro()}<div class="perfil29">
      <h2>Quem está entrando?</h2><p class="suave">A administração mostra só o que cada um usa.</p>
      <div class="g">${card('madu')}${card('matheus')}</div>
      <button class="btn p fantasma sair29" onclick="S.adm=null;S.tela='inicio';render()"><i class="ti ti-arrow-left"></i> Sair da administração</button></div></div>`;
  }
  if(A && A.perfil==='madu'){
    if(TEC29.includes(A.tab)) A.tab = 'aovivo';
    if(A.estSub==='config' || A.estSub==='importar') A.estSub = 'saldo';
    if(typeof KM!=='undefined' && KM.sub==='config') KM.sub = 'esperando';
    if(typeof FA!=='undefined' && FA.sub==='importar') FA.sub = 'lista';
  }
  return _telaAdminV29.apply(this, arguments);
};

/* depois de desenhar (e antes do app12 montar o menu): esconde o técnico (Madu) ou junta no grupo "Técnico" (Matheus) */
function grupos29(){
  if(typeof GRUPOS_ADM==='undefined') return;
  GRUPOS_ADM.forEach(g=>{ if(g.n!=='Técnico') g.k = g.k.filter(k=>!TEC29.includes(k)); });
  let t = GRUPOS_ADM.find(g=>g.n==='Técnico' || g.n==='Sistema');
  if(!t){ t = {n:'Técnico', cor:'var(--g-sistema)', k:[]}; GRUPOS_ADM.push(t); }
  t.n = 'Técnico'; t.k = TEC29.slice();
  if(typeof NOMES12!=='undefined'){ NOMES12.admin.nuvemshop = 'Nuvemshop (site)'; NOMES12.admin.roleta = NOMES12.admin.roleta || 'Roleta do site'; }
}
function limpar29(){
  const w = document.querySelector('#app > .wrap'); if(!w) return;
  w.querySelectorAll(':scope > .abas button').forEach(b=>{
    const m = (b.getAttribute('onclick')||'').match(/adm\.tab='([\w-]+)'/);
    if(m && TEC29.includes(m[1])) b.remove();
  });
  w.querySelectorAll('button').forEach(b=>{ const oc = b.getAttribute('onclick')||''; if(TEC_SUB29.some(r=>r.test(oc))) b.remove(); });
  w.querySelectorAll('.nota').forEach(n=>{
    if(n.querySelector('input,textarea,select') || !TEC_TXT29.test(n.textContent)) return;
    n.className = 'nota info tec29';
    n.innerHTML = '<i class="ti ti-tool"></i><div>Essa parte está sendo ajustada pelo Matheus.</div>';
  });
}
const _renderV29 = render;
render = function(){
  if(!_cascaOrig29 && typeof montarCasca12==='function'){ _cascaOrig29 = montarCasca12; montarCasca12 = casca29; }
  _renderV29.apply(this, arguments);
  if(!perfil29()) return;
  try{ grupos29(); if(madu29()) limpar29(); }catch(e){ console.warn('perfil v29', e); }
};

/* cartão do topo do menu: quem está + trocar */
let _cascaOrig29 = null;
function casca29(){
  const w = _cascaOrig29.apply(this, arguments);
  try{
    const p = perfil29(), eu = p && document.querySelector('#menu12 .menu-eu');
    if(eu){
      const P = PERFIS29[p], o = PERFIS29[p==='madu'?'matheus':'madu'];
      const av = eu.querySelector('.av'); if(av){ av.innerHTML = `<span style="font-size:18px">${P.em}</span>`; av.style.background = P.cor; }
      const box = eu.querySelector('div');
      if(box) box.innerHTML = `<b>${P.nome}</b><small>Administração · ${P.papel}</small><button class="troca29" style="--c29:${o.cor}" onclick="trocarPerfil29()"><i class="ti ti-switch-horizontal"></i> Trocar para ${o.nome}</button>`;
    }
  }catch(e){}
  return w;
}
(function ligar29(){
  if(typeof montarCasca12==='function' && !_cascaOrig29){ _cascaOrig29 = montarCasca12; montarCasca12 = casca29; return; }
  if(!_cascaOrig29) document.addEventListener('DOMContentLoaded', ligar29, {once:true});   // o app12 carrega depois deste
})();

/* busca: no modo Madu não oferece as telas técnicas */
if(typeof itensBusca==='function'){
  const _ib29 = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ib29.apply(this, arguments);
    return madu29() ? r.filter(x=>!/^(Aparelhos|Regras|Roleta|Roletas|Nuvemshop)/.test(x.t||'')) : r;
  };
}
