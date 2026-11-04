/* ═══════════ v39: foto das colaboradoras ═══════════
   • Administração › Equipe e ponto › Cadastro da equipe: coluna com a foto e, ao tocar na colaboradora,
     "📷 Colocar foto" (câmera ou galeria), trocar ou remover. Na colaboradora nova, a foto sobe logo depois de salvar.
   • Onde aparecia a bolinha com as iniciais (entrada, painel, Arena, comanda, PIN, menu, perfil…) passa a aparecer a foto.
   • A foto é cortada em quadrado e reduzida no aparelho (400 px) antes de subir. Servidor: FOTOEQUIPE.gs.
   • Sem o FOTOEQUIPE.gs no servidor: o botão avisa que falta o servidor e nada mais muda. */

const F39 = { local:{}, pend:null };

function fotosMapa39(){
  return Object.assign({}, F39.fotos||{}, S.boot?.fotosEquipe||{}, S.sess?.dados?.fotosEquipe||{}, S.adm?.dados?.fotosEquipe||{}, F39.local);
}
function fotoDe39(c){
  if(!c) return '';
  const m = fotosMapa39(), id = c.id || c.eid || c.colaboradora_id;
  if(id && m[id] !== undefined) return m[id] || '';
  const nome = String(c.nome || c.colaboradora || '').trim(); if(!nome) return '';
  const eq = [].concat(S.adm?.dados?.colaboradoras||[], S.boot?.colaboradoras||[], S.sess?.dados?.equipe||[]);
  let x = eq.find(p=>p.nome===nome);
  if(!x){ const pn = primeiroNome(nome), v = eq.filter(p=>primeiroNome(p.nome)===pn); const ids = [...new Set(v.map(p=>p.id))]; if(ids.length===1) x = v[0]; }
  return x && m[x.id] ? m[x.id] : '';
}
const fotoUrl39 = (u, w) => String(u||'').replace(/sz=w\d+/, 'sz=w'+(w||200));
const fotoCss39 = (u, w) => `background:#eee url('${esc(fotoUrl39(u, w))}') center/cover no-repeat;color:transparent;`;

/* avatar() do app7 (entrada, painel, Arena, comanda, "vendeu!"…) */
const _avatarV39 = avatar;
avatar = function avatar(c, st, tam){
  const h = _avatarV39.apply(this, arguments), f = fotoDe39(c);
  if(!f) return h;
  return h.replace('class="lob-av', 'class="lob-av av39').replace('style="', `style="${fotoCss39(f, (tam||46)>60?300:160)}`);
};

/* bolinhas que não usam avatar(): PIN, menu (Eu), perfil e a tela de bater o ponto */
function pintarDom39(){
  try{
    const p = S.pin, mt = p && document.querySelector('#modal .modal-t > .avatar');
    if(mt && p.alvo && !p.alvo.startsWith('__')){ const f = fotoDe39({id:p.alvo}); if(f){ mt.setAttribute('style', mt.getAttribute('style')+';'+fotoCss39(f,160)); mt.classList.add('av39'); } }
    const eu = S.sess?.dados?.colaboradora, f = eu && fotoDe39(eu);
    if(f){
      const av = document.querySelector('#menu12 .menu-eu .av'); if(av && !av.classList.contains('av39')){ av.setAttribute('style', av.getAttribute('style')+';'+fotoCss39(f,160)); av.classList.add('av39'); }
      if(S.tela==='portal' && S.portalTab==='eu'){ const a = document.querySelector('#app > .wrap .cartao .avatar'); if(a){ a.setAttribute('style', a.getAttribute('style')+';'+fotoCss39(f,300)); a.classList.add('av39'); } }
      if(S.tela==='bater' || S.tela==='pontocel'){ const a = document.querySelector('#app .ola'); if(a && !a.querySelector('.av39')) a.insertAdjacentHTML('afterbegin', `<span class="lob-av av39" style="${fotoCss39(f,160)};width:44px;height:44px;vertical-align:middle;margin-right:10px"></span>`); }
    }
  }catch(e){}
}
const _renderPinV39 = renderPin;
renderPin = function renderPin(){ const r = _renderPinV39.apply(this, arguments); pintarDom39(); return r; };
const _renderV39 = render;
render = function render(){ if(S.tela==='admin') patchEquipe39(); const r = _renderV39.apply(this, arguments); queueMicrotask(pintarDom39); return r; };

/* ───────── Cadastro da equipe: coluna com a foto ───────── */
function pintarAdmEquipe39(h){
  const d = S.adm?.dados; if(!d) return h;
  d.colaboradoras.forEach(c=>{
    const velho = `<span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(c.nome)}`, f = fotoDe39(c);
    const novo = `<span class="eq39"><span class="lob-av ${f?'av39':''}" style="--cor:${esc(c.cor||'#F5B524')};width:34px;height:34px;font-size:12px;${f?fotoCss39(f,160):''}">${f?'':esc(iniciais(c.nome))}</span>${esc(c.nome)}${f?'':' <small class="eq39-sem"><i class="ti ti-camera-plus"></i> sem foto</small>'}</span>`;
    h = h.split(velho).join(novo);
  });
  return h;
}
function patchEquipe39(){
  if(window._eq39 || typeof admEquipe!=='function' || typeof renderColab!=='function') return; window._eq39 = true;
  const baseEq = admEquipe;
  admEquipe = function admEquipe(){ return pintarAdmEquipe39(baseEq.apply(this, arguments)); };
  const baseRC = renderColab;
  renderColab = function renderColab(){
    const r = baseRC.apply(this, arguments);
    try{
      const e = EC; if(!e) return r;
      const c = e.id ? {id:e.id, nome:e.nome} : null, f = c ? fotoDe39(c) : (F39.pend?.prev || '');
      const bloco = `<div class="foto39">
        <div class="foto39-img" style="--cor:${esc(e.cor)};${f?(f.startsWith('data:')?`background:#eee url('${f}') center/cover;`:fotoCss39(f,300)):''}">${f?'':`<span>${esc(iniciais(e.nome||'?'))}</span>`}</div>
        <div class="foto39-txt"><b>Foto</b><small>${f?'Aparece na entrada, na Arena e no ponto.':'Toque para tirar ou escolher uma foto do rosto.'}</small>
          <div class="linha" style="gap:6px;margin-top:8px;flex-wrap:wrap">
            <label class="btn p ${f?'':'ouro'}" id="foto39-btn"><i class="ti ti-camera"></i> ${f?'Trocar foto':'Colocar foto'}<input type="file" accept="image/*" hidden onchange="fotoEscolher39(this)"></label>
            ${f?`<button class="btn p fantasma" onclick="fotoRemover39()"><i class="ti ti-trash"></i> Remover</button>`:''}
          </div></div></div>`;
      const mc = document.querySelector('#modal .modal-c'); if(mc) mc.insertAdjacentHTML('afterbegin', bloco);
    }catch(err){ console.warn('v39 foto', err); }
    return r;
  };
  const baseEd = editarColab;
  editarColab = function editarColab(){ F39.pend = null; return baseEd.apply(this, arguments); };
  const baseSalvar = salvarColab;
  salvarColab = async function salvarColab(){
    const pend = (!EC?.id && F39.pend) ? {...F39.pend, nome:EC.nome.trim()} : null;
    const r = await baseSalvar.apply(this, arguments);
    if(pend && !EC){
      const c = S.adm.dados.colaboradoras.filter(x=>x.nome.trim()===pend.nome).pop();
      if(c) await fotoEnviar39(c.id, pend.base64, true);
    }
    F39.pend = null;
    return r;
  };
}
document.addEventListener('DOMContentLoaded', patchEquipe39);

/* corta em quadrado (centro) e reduz para 400 px */
function fotoPreparar39(file){
  return new Promise((ok, erro)=>{
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = ()=>{ try{
      const lado = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth-lado)/2, sy = (img.naturalHeight-lado)/2.6;
      const cv = document.createElement('canvas'); cv.width = cv.height = 400;
      cv.getContext('2d').drawImage(img, sx, Math.max(0, sy), lado, lado, 0, 0, 400, 400);
      URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', .82));
    }catch(e){ erro(e); } };
    img.onerror = ()=>{ URL.revokeObjectURL(url); erro(new Error('Não consegui abrir essa imagem')); };
    img.src = url;
  });
}
async function fotoEscolher39(inp){
  const file = inp.files && inp.files[0]; if(!file) return;
  const b = $('#foto39-btn'); if(b) b.classList.add('carregando');
  try{
    const dataUrl = await fotoPreparar39(file), base64 = dataUrl.split(',')[1];
    if(!EC.id){ F39.pend = {base64, prev:dataUrl}; renderColab(); toast('Foto pronta — ela sobe quando você salvar'); return; }
    await fotoEnviar39(EC.id, base64);
  }catch(e){ toast(e.message, true); }
  finally{ const b2 = $('#foto39-btn'); if(b2) b2.classList.remove('carregando'); }
}
async function fotoEnviar39(id, base64, silencioso){
  try{
    S.adm.dados = await api('admFotoColab', {...S.adm.cred, id, foto:{base64}});
    const f = (S.adm.dados.fotosEquipe||{})[id];
    if(f) F39.local[id] = f; else if(!S.adm.dados.fotosEquipe) throw new Error('O servidor ainda não tem o FOTOEQUIPE.gs');
    if(EC && EC.id===id) renderColab();
    render(); toast('Foto salva ✔ 📸'); if(typeof carregarBootSilencioso==='function') carregarBootSilencioso();
  }catch(e){ toast(/desconhecida/i.test(e.message) ? 'Falta colar o FOTOEQUIPE.gs no Apps Script' : e.message, true); }
}
async function fotoRemover39(){
  if(!EC?.id || !confirm('Remover a foto de '+primeiroNome(EC.nome)+'?')) return;
  try{
    S.adm.dados = await api('admFotoColab', {...S.adm.cred, id:EC.id, remover:true});
    F39.local[EC.id] = ''; renderColab(); render(); toast('Foto removida');
    if(typeof carregarBootSilencioso==='function') carregarBootSilencioso();
  }catch(e){ toast(e.message, true); }
}


/* ───────── link do mutirão / produtos (#fotos=…): corrida, "Acabou de acontecer" e quem mexeu ───────── */
function nomeChave39(n){
  return String(n||'').trim().split(/\s+/)[0].normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()
    .replace(/ph/g,'f').replace(/y/g,'i').replace(/^es(?=t)/,'s').replace(/(.)\1+/g,'$1').replace(/e$/,'');
}
function fotoPorNome39(nome){
  const m = fotosMapa39(); if(!nome) return '';
  const eq = [].concat(S.adm?.dados?.colaboradoras||[], S.boot?.colaboradoras||[], S.sess?.dados?.equipe||[], F39.equipe||[]).filter(p=>p && p.id && m[p.id]);
  const exato = eq.find(p=>p.nome===nome); if(exato) return m[exato.id];
  const k = nomeChave39(nome), v = eq.filter(p=>nomeChave39(p.nome)===k), ids = [...new Set(v.map(p=>p.id))];
  return ids.length===1 ? m[ids[0]] : '';
}
const desesc39 = t => String(t).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function pintarMutirao39(h){
  h = h.replace(/<span class="pl-av" data-nome="([^"]*)"([^>]*)>([^<]*)<\/span>/g, (t, nome, resto, ini)=>{
    const f = fotoPorNome39(desesc39(nome)); return f ? `<span class="pl-av av39" data-nome="${nome}"${resto} style="${fotoCss39(f,160)}"></span>` : t; });
  h = h.replace(/<span class="b" style="background:([^"]*)">([^<]*)<\/span><span class="t"><b>([^<]*)<\/b>/g, (t, cor, ini, nome)=>{
    const f = fotoPorNome39(desesc39(nome)); return f ? `<span class="b av39" style="${fotoCss39(f,120)}"></span><span class="t"><b>${nome}</b>` : t; });
  return h;
}
/* o link do mutirão não carrega a tela inicial: busca as fotos da equipe uma vez (boot é público) e redesenha o placar */
let _fotosBoot39 = false;
async function fotosBoot39(){
  if(_fotosBoot39 || S.boot?.fotosEquipe || F39.fotos) return; _fotosBoot39 = true;
  try{
    const b = await api('boot');
    if(b && b.fotosEquipe){ F39.fotos = b.fotosEquipe; F39.equipe = b.colaboradoras || []; if(typeof plRepintar==='function') plRepintar(); }
  }catch(e){}
}
if(typeof plHtml==='function'){ const _plHtmlV39 = plHtml; plHtml = function plHtml(){ if(S.tela==='fotos') fotosBoot39(); return pintarMutirao39(_plHtmlV39.apply(this, arguments)); }; }
if(typeof edAv==='function'){ const _edAvV39 = edAv; edAv = function edAv(n){ const h = _edAvV39.apply(this, arguments), f = fotoPorNome39(n); return f ? h.replace('class="ed-av"', 'class="ed-av av39"').replace('style="', `style="${fotoCss39(f,120)}`) : h; }; }

document.head.insertAdjacentHTML('beforeend', `<style>
.av39{color:transparent!important;font-size:0!important}
.pl-av.av39,.pl-feed .b.av39,.ed-av.av39{background-color:#eee}
.eq39{display:inline-flex;align-items:center;gap:10px}
.eq39 .lob-av{box-shadow:0 0 0 2px #fff,0 0 0 3px var(--linha2)}
.eq39-sem{font-size:11.5px;color:var(--creme3);font-weight:600;white-space:nowrap}
.foto39{display:flex;align-items:center;gap:14px;padding:12px;margin-bottom:14px;border-radius:16px;background:var(--noite)}
.foto39-img{width:84px;height:84px;border-radius:50%;flex-shrink:0;background:var(--cor);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;color:#fff;box-shadow:0 0 0 3px #fff,0 0 0 5px var(--linha2);animation:pcSurge39 .4s ease}
.foto39-txt b{display:block;font-size:15px}.foto39-txt small{display:block;color:var(--creme3);font-size:12.5px}
#foto39-btn{cursor:pointer}
#foto39-btn.carregando{opacity:.6;pointer-events:none}
#foto39-btn.carregando i{animation:gira39 1s linear infinite}
@keyframes gira39{to{transform:rotate(360deg)}}
@keyframes pcSurge39{from{transform:scale(.85);opacity:0}}
</style>`);
