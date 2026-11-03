/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v21b (app21.js): PLACAR DO MUTIRÃO no link
   • Cartão "🏁 Corrida do mutirão": cada pessoa corre até a bandeira conforme o
     que já arrumou (avatar desliza, número conta, medalhas, "você" em destaque).
   • Detalhe por pessoa: fotos, categorias, nomes, códigos, preços, contagens e
     "está certo"; tocar na pessoa abre o detalhe.
   • Período: Hoje · 7 dias · Tudo.  Feed "Acabou de acontecer" ao vivo.
   • Só conta o que vale: desfeito pela administração ou preço recusado não entra.
   • Usa a ação pública `fotos` op `editados` (já existe) — sem mudar o servidor.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.fl-plac{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:22px;padding:16px 14px 12px;box-shadow:0 6px 24px rgba(0,0,0,.05);position:relative;overflow:hidden}
.fl-plac:before{content:'';position:absolute;inset:0 0 auto 0;height:4px;background:linear-gradient(90deg,#D4121B,#F5B524,#2fb36b,#2563eb,#7c3aed);background-size:200% 100%;animation:plFaixa 6s linear infinite}
@keyframes plFaixa{to{background-position:200% 0}}
.fl-plac .cab{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fl-plac h3{margin:0;font-size:17px;flex:1;min-width:150px}
.fl-plac .per{display:flex;background:#f3f0ef;border-radius:99px;padding:3px}
.fl-plac .per button{border:0;background:none;font:inherit;font-size:12.5px;font-weight:800;padding:6px 11px;border-radius:99px;cursor:pointer;color:#666;transition:background .2s,color .2s,transform .15s}
.fl-plac .per button:active{transform:scale(.94)}
.fl-plac .per button.on{background:#222;color:#fff}
.fl-plac .tot{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0 6px}
.fl-plac .tot div{background:#faf7f5;border-radius:14px;padding:9px 10px;text-align:center}
.fl-plac .tot b{display:block;font-size:22px;font-weight:900;color:#222;line-height:1.1}
.fl-plac .tot small{font-size:11px;color:#777;font-weight:700}
.pl-pistas{display:flex;flex-direction:column;gap:9px;margin-top:10px}
.pl-lin{display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;border:0;background:none;padding:0;font:inherit;text-align:left;cursor:pointer;color:#222;width:100%}
.pl-lin .pos{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:#eee;color:#555}
.pl-lin .pos.m1{background:linear-gradient(135deg,#ffd966,#F5B524);color:#5a3d00}.pl-lin .pos.m2{background:linear-gradient(135deg,#eee,#c9c9c9);color:#444}.pl-lin .pos.m3{background:linear-gradient(135deg,#f0c49b,#cd7f32);color:#4a2a0c}
.pl-pista{position:relative;height:40px;border-radius:99px;background:repeating-linear-gradient(90deg,#efeaea 0 14px,#f6f2f2 14px 28px);overflow:visible}
.pl-pista .rastro{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,transparent,var(--c));opacity:.28;width:0;transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.pl-pista .band{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:16px}
.pl-av{position:absolute;top:50%;left:0;transform:translate(-2px,-50%);width:36px;height:36px;border-radius:50%;background:var(--c);color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff,0 4px 12px rgba(0,0,0,.18);transition:left 1.4s cubic-bezier(.2,.8,.2,1);z-index:1}
.pl-av.corre{animation:plPula .35s ease-in-out 4}
@keyframes plPula{50%{transform:translate(-2px,-62%)}}
.pl-lin.lider .pl-av:after{content:'👑';position:absolute;top:-15px;font-size:15px;animation:plCoroa 2s ease-in-out infinite}
@keyframes plCoroa{50%{transform:translateY(-3px) rotate(8deg)}}
.pl-lin.eu .pl-pista{outline:2px solid rgba(212,18,27,.35);outline-offset:2px}
.pl-lin .nm{min-width:74px;text-align:right}
.pl-lin .nm b{display:block;font-size:13.5px;line-height:1.1}
.pl-lin .nm span{font-size:19px;font-weight:900;color:var(--c)}
.pl-lin .nm small{font-size:10.5px;color:#999;font-weight:700;display:block}
.pl-lin:active .pl-pista{transform:scale(.99)}
.pl-det{grid-column:2 / 4;display:flex;flex-wrap:wrap;gap:5px;padding:2px 0 4px;animation:plAbre .3s ease-out}
@keyframes plAbre{from{transform:translateY(-6px)}to{transform:none}}
.pl-det span{font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:99px;background:var(--f);color:var(--t)}
.pl-vazio{text-align:center;color:#888;padding:14px 6px;font-size:14px}
.pl-feed{margin-top:12px;border-top:1px dashed rgba(0,0,0,.12);padding-top:10px}
.pl-feed h4{margin:0 0 6px;font-size:12.5px;color:#777;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:6px}
.pl-feed h4 i{width:8px;height:8px;border-radius:50%;background:#2fb36b;display:inline-block;animation:plVivo 1.6s ease-out infinite}
@keyframes plVivo{0%{box-shadow:0 0 0 0 rgba(47,179,107,.6)}100%{box-shadow:0 0 0 9px rgba(47,179,107,0)}}
.pl-feed ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.pl-feed li{display:flex;align-items:center;gap:8px;font-size:13px;color:#444;animation:plEntra .45s cubic-bezier(.2,.8,.2,1) both}
.pl-feed li .b{width:24px;height:24px;flex:none;border-radius:50%;color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center}
.pl-feed li .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-feed li small{color:#aaa;font-size:11px;white-space:nowrap}
@keyframes plEntra{from{transform:translateX(-14px)}to{transform:none}}
.pl-rod{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11.5px;color:#999}
.pl-rod button{border:0;background:#f3f0ef;border-radius:99px;padding:6px 11px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;color:#444;transition:transform .15s}
.pl-rod button:active{transform:scale(.94)}
.pl-bonus{position:fixed;left:50%;top:38%;z-index:9700;transform:translateX(-50%);background:#222;color:#fff;font-weight:900;font-size:18px;padding:12px 20px;border-radius:99px;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:plBonus 1.3s ease-out forwards;pointer-events:none}
@keyframes plBonus{0%{transform:translate(-50%,20px) scale(.7)}20%{transform:translate(-50%,0) scale(1.08)}35%{transform:translate(-50%,0) scale(1)}100%{transform:translate(-50%,-50px) scale(1)}}
@media(prefers-reduced-motion:reduce){.fl-plac *,.fl-plac:before,.pl-bonus{animation:none!important;transition:none!important}}
`; document.head.appendChild(st); })();

const PL_TIPOS = {foto:{ic:'📷',t:'fotos',f:'#fdeceb',c:'#B30F17'}, categoria:{ic:'🏷️',t:'categorias',f:'#f1eafe',c:'#5b21b6'}, nome:{ic:'Aa',t:'nomes',f:'#fff1e6',c:'#9a3412'},
  codigo:{ic:'🔢',t:'códigos',f:'#e3f6f3',c:'#0f766e'}, preco:{ic:'💲',t:'preços',f:'#fff7e0',c:'#8a5d00'}, estoque:{ic:'📦',t:'contagens',f:'#e8f0ff',c:'#1d4ed8'}, ok:{ic:'👍',t:'conferidos',f:'#f1f1f1',c:'#555'}};
const PL_CORES = ['#D4121B','#7c3aed','#0f766e','#2563eb','#c2410c','#db2777','#059669','#b45309','#4f46e5','#0891b2'];
var PL = {per: 'tudo', H: null, aberto: '', ant: {}, carregando: false, quando: 0};
try{ PL.per = localStorage.getItem('lv_pl_per') || 'tudo'; }catch(e){}

function plCor(n){ let h = 0; for(const ch of semAcento(String(n||''))) h = (h*31 + ch.charCodeAt(0)) >>> 0; return PL_CORES[h % PL_CORES.length]; }
function plIni(n){ const p = String(n||'?').trim().split(/\s+/); return ((p[0]||'?')[0] + (p[1]?p[1][0]:'')).toUpperCase(); }
function plTipo(a){ return a.tipo==='foto' ? 'foto' : a.tipo==='ok' ? 'ok' : a.tipo==='contagem' ? 'estoque' : a.campo; }
function plValido(a){ return a.status!=='desfeito' && a.status!=='recusado'; }
function plDia(d){ return String(d||'').slice(0,10); }
function plHoje(){ return typeof hojeISO==='function' ? hojeISO() : new Date(Date.now()-5*3600000).toISOString().slice(0,10); }
function plNoPeriodo(a){
  if(PL.per==='tudo') return true;
  const d = plDia(a.quando), h = plHoje();
  if(PL.per==='hoje') return d===h;
  const lim = new Date(new Date(h+'T12:00:00').getTime() - 6*86400000).toISOString().slice(0,10);
  return d >= lim;
}
function plContas(){
  const H = (PL.H||[]).filter(a=>plValido(a) && plNoPeriodo(a)), P = {};
  H.forEach(a=>{ const n = String(a.por||'?').replace(/\s*\(.*\)$/,'').trim() || '?', k = plTipo(a);
    const p = P[n] = P[n] || {nome:n, pts:0, por:{}, prods:new Set()}; p.pts++; p.por[k] = (p.por[k]||0)+1; p.prods.add(a.produto_id); });
  const L = Object.values(P).sort((a,b)=>b.pts-a.pts || a.nome.localeCompare(b.nome));
  return {L, H, prods: new Set(H.map(a=>a.produto_id)).size, fotos: H.filter(a=>a.tipo==='foto').length};
}
function plFrase(a){
  const k = plTipo(a), prod = esc(String(a.produto||'').slice(0,60));
  if(k==='foto') return `${a.antes?'trocou a foto de':'fotografou'} <b>${prod}</b>`;
  if(k==='ok') return `conferiu <b>${prod}</b>`;
  if(k==='estoque') return `contou <b>${prod}</b>`;
  if(k==='preco') return `sugeriu preço em <b>${prod}</b>`;
  return `arrumou ${(PL_TIPOS[k]||{t:k}).t.replace(/s$/,'')} de <b>${prod}</b>`;
}
function plHtml(){
  if(!PL.H) return `<div class="fl-plac" id="fl-plac"><div class="cab"><h3>🏁 Corrida do mutirão</h3></div><div class="pl-vazio"><span class="gira"></span> Carregando o placar…</div></div>`;
  const c = plContas(), max = Math.max(1, ...c.L.map(p=>p.pts)), eu = semAcento(flPrimeiro(FL.por||''));
  const feed = (PL.H||[]).filter(plValido).slice(0, 6);
  const per = [['hoje','Hoje'],['semana','7 dias'],['tudo','Tudo']];
  return `<div class="fl-plac" id="fl-plac">
    <div class="cab"><h3>🏁 Corrida do mutirão</h3><div class="per">${per.map(([k,t])=>`<button class="${PL.per===k?'on':''}" onclick="plPeriodo('${k}')">${t}</button>`).join('')}</div></div>
    <div class="tot"><div><b class="pl-n" data-n="${c.H.length}">${c.H.length}</b><small>ações</small></div><div><b class="pl-n" data-n="${c.prods}">${c.prods}</b><small>produtos mexidos</small></div><div><b class="pl-n" data-n="${c.fotos}">${c.fotos}</b><small>fotos</small></div></div>
    ${!c.L.length ? `<div class="pl-vazio">${PL.per==='hoje'?'Ninguém arrumou nada hoje ainda. Bora ser a primeira? 💪':'Nada por aqui ainda.'}</div>` :
    `<div class="pl-pistas">${c.L.map((p,i)=>{ const cor = plCor(p.nome), pct = Math.round(p.pts/max*100), souEu = semAcento(flPrimeiro(p.nome))===eu, ab = PL.aberto===p.nome;
      return `<button class="pl-lin ${i===0?'lider':''} ${souEu?'eu':''}" style="--c:${cor}" onclick="plAbrir(${esc(JSON.stringify(p.nome))})" aria-expanded="${ab}">
        <span class="pos ${i<3?'m'+(i+1):''}">${i+1}</span>
        <span class="pl-pista"><span class="rastro" data-w="${pct}"></span><span class="pl-av" data-nome="${esc(p.nome)}" data-l="${pct}">${esc(plIni(p.nome))}</span><span class="band">🏁</span></span>
        <span class="nm"><b>${esc(flPrimeiro(p.nome))}${souEu?' <small style="display:inline;color:#D4121B">(você)</small>':''}</b><span class="pl-n" data-n="${p.pts}">${p.pts}</span><small>${p.prods.size} produto(s)</small></span>
      </button>${ab?`<div class="pl-det" style="display:flex;padding-left:34px">${Object.keys(PL_TIPOS).filter(k=>p.por[k]).map(k=>`<span style="--f:${PL_TIPOS[k].f};--t:${PL_TIPOS[k].c}">${PL_TIPOS[k].ic} ${p.por[k]} ${PL_TIPOS[k].t}</span>`).join('')}</div>`:''}`; }).join('')}</div>`}
    ${feed.length?`<div class="pl-feed"><h4><i></i> Acabou de acontecer</h4><ul>${feed.map((a,i)=>`<li style="animation-delay:${i*.06}s"><span class="b" style="background:${plCor(a.por)}">${esc(plIni(a.por))}</span><span class="t"><b>${esc(flPrimeiro(a.por))}</b> ${plFrase(a)}</span><small>${typeof edHa==='function'?edHa(a.quando):''}</small></li>`).join('')}</ul></div>`:''}
    <div class="pl-rod"><span>Conta tudo que ficou valendo (desfeito ou recusado não entra). Toque na pessoa para ver o detalhe.</span><button onclick="plCarregar(true)"><i class="ti ti-refresh"></i> atualizar</button></div>
  </div>`;
}
function plAnimar(){
  const box = document.getElementById('fl-plac'); if(!box || !PL.H) return;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  box.querySelectorAll('.pl-av').forEach(av=>{
    const nome = av.dataset.nome, alvo = +av.dataset.l, de = PL.ant[nome+'|'+PL.per] ?? 0;
    const pos = v => `calc(${v}% - ${Math.round(v*0.4)}px)`;   // para o avatar não passar da bandeira
    const ras = av.parentElement.querySelector('.rastro');
    av.style.transition = 'none'; ras.style.transition = 'none'; av.style.left = pos(de); ras.style.width = de+'%';
    av.offsetWidth;
    av.style.transition = ''; ras.style.transition = '';
    requestAnimationFrame(()=>{ av.style.left = pos(alvo); ras.style.width = alvo+'%'; if(alvo>de && !reduz) av.classList.add('corre'); });
    PL.ant[nome+'|'+PL.per] = alvo;
  });
  box.querySelectorAll('.pl-n').forEach(el=>{ const chave = 'n|'+PL.per+'|'+(el.closest('.pl-lin')?.querySelector('.pl-av')?.dataset.nome||el.parentElement.querySelector('small')?.textContent), alvo = +el.dataset.n, de = PL.ant[chave] ?? 0;
    PL.ant[chave] = alvo; if(reduz || de===alvo){ el.textContent = alvo; return; }
    const t0 = performance.now(), dur = 900; const passo = t => { const k = Math.min(1,(t-t0)/dur); el.textContent = Math.round(de + (alvo-de)*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); });
}
function plRepintar(){ const box = document.getElementById('fl-plac'); if(!box) return; box.outerHTML = plHtml(); requestAnimationFrame(plAnimar); }
function plPeriodo(k){ PL.per = k; try{ localStorage.setItem('lv_pl_per', k); }catch(e){} plRepintar(); }
function plAbrir(n){ PL.aberto = PL.aberto===n ? '' : n; const sv = Object.assign({}, PL.ant); plRepintar(); PL.ant = sv; }
async function plCarregar(manual){
  if(!FL || !FL.chave || PL.carregando) return;
  PL.carregando = true;
  try{ const r = await api('fotos', {chave: FL.chave, op:'editados'}); PL.H = r.historico || []; PL.quando = Date.now(); }
  catch(e){ if(manual) toast(erroRede(e)?'Sem internet — tente de novo':e.message, true); if(!PL.H) PL.H = []; }
  PL.carregando = false; plRepintar();
}
/* conta na hora o que a própria pessoa fez (sem esperar o servidor) e mostra "+1" */
function plMarcar(tipo, campo, pid){
  if(!PL.H || !FL) return;
  const p = FL.lista.find(x=>x.id===pid);
  const ag = new Date(Date.now()-5*3600000).toISOString().replace('T',' ').slice(0,19);
  PL.H.unshift({por: FL.por, tipo, campo, produto_id: pid, produto: p ? p.nome : '', quando: ag, status: campo==='preco'?'pendente':'feito'});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ const b = document.createElement('div'); b.className = 'pl-bonus'; b.textContent = '+1 pra você 🏁'; document.body.appendChild(b); setTimeout(()=>b.remove(), 1300); }
}

/* encaixe no link: placar logo abaixo do topo, carrega junto e atualiza sozinho a cada 60 s */
const _flPintarV21 = flPintar;
flPintar = function(){
  _flPintarV21.apply(this, arguments);
  const hero = document.querySelector('.fl-pag .fl-hero'); if(!hero) return;
  hero.insertAdjacentHTML('afterend', plHtml());
  requestAnimationFrame(plAnimar);
  if(!PL.H && !PL.carregando) plCarregar();
};
const _flCarregarV21 = flCarregar;
flCarregar = async function(){ const r = await _flCarregarV21.apply(this, arguments); if(FL && FL.chave) plCarregar(); return r; };
setInterval(()=>{ if(FL && S.tela==='fotos' && !document.hidden && !FLP && Date.now()-PL.quando > 55000) plCarregar(); }, 15000);

const _flSalvarV21 = flSalvar;
flSalvar = async function(){
  const id = FLP && FLP.id, p = id && FL.lista.find(x=>x.id===id), antes = p ? {nome:p.nome, codigo:p.codigo, categoria:p.categoria, pend:p.precoPendente} : null;
  const r = await _flSalvarV21.apply(this, arguments);
  const p2 = id && FL.lista.find(x=>x.id===id);
  if(p2 && antes){ let n = 0;
    ['nome','codigo','categoria'].forEach(k=>{ if((antes[k]||'')!==(p2[k]||'')){ plMarcar('correcao', k, id); n++; } });
    if(p2.precoPendente && p2.precoPendente!==antes.pend){ plMarcar('correcao', 'preco', id); n++; }
    if(n) plRepintar(); }
  return r;
};
const _flFotoV21 = flFoto;
flFoto = async function(){
  const id = FLP && FLP.id, p = id && FL.lista.find(x=>x.id===id), antes = p ? p.foto : '';
  const r = await _flFotoV21.apply(this, arguments);
  const p2 = id && FL.lista.find(x=>x.id===id);
  if(p2 && p2.foto && p2.foto!==antes){ plMarcar('foto', 'foto', id); plRepintar(); }
  return r;
};
const _flOkV21 = flOk;
flOk = async function(aviso){
  const id = FLP && FLP.id, p = id && FL.lista.find(x=>x.id===id), n0 = p ? (p.ok||[]).length : 0;
  const r = await _flOkV21.apply(this, arguments);
  const p2 = id && FL.lista.find(x=>x.id===id);
  if(p2 && (p2.ok||[]).length > n0){ plMarcar('ok', aviso, id); plRepintar(); }
  return r;
};

/* ═════════ v21b: TIRAR PRODUTO DO CATÁLOGO (a loja não trabalha mais) ═════════
   Fica desativado (some do link, do PDV e da busca); histórico, estoque e vendas antigas continuam.
   Aparece em "Editados" e a administração pode Desfazer (volta para o catálogo). */
(function(){ const st = document.createElement('style'); st.textContent = `
.fl-tirar{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:18px;border:1.5px dashed rgba(212,18,27,.45);background:#fff;color:#B30F17;border-radius:12px;padding:11px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:transform .15s,background .2s}
.fl-tirar:hover{background:#fff5f5}.fl-tirar:active{transform:scale(.97)}
.fl-tirarbox{margin-top:18px;border:2px solid #D4121B;border-radius:16px;padding:14px;background:#fff5f5;animation:plAbre .3s ease-out}
.fl-tirarbox h4{margin:0 0 4px;font-size:15px;color:#8e0b12}
.fl-tirarbox p{margin:0 0 10px;font-size:13px;color:#555}
.fl-tirarbox .mot{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.fl-tirarbox .mot button{border:1.5px solid rgba(0,0,0,.14);background:#fff;border-radius:99px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:transform .15s}
.fl-tirarbox .mot button:active{transform:scale(.95)}
.fl-tirarbox .mot button.on{background:#222;color:#fff;border-color:#222}
.fl-tirarbox .acoes{display:flex;gap:8px}.fl-tirarbox .acoes .fl-bt{flex:1}
.fl-bt.perigo{background:#D4121B;color:#fff}
.pl-ver{border:0;background:#222;color:#fff;border-radius:99px;padding:5px 11px;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;transition:transform .15s}
.pl-ver:active{transform:scale(.94)}
.fl-item.saindo{animation:plSai .45s ease-in forwards}
@keyframes plSai{to{transform:scale(.6);opacity:0}}
`; document.head.appendChild(st); })();

PL_TIPOS.ativo = {ic:'🗑️', t:'tirados do catálogo', f:'#fdeceb', c:'#8e0b12'};
ED_COR.ativo = '#8e0b12'; ED_NOME.ativo = 'situação no catálogo';
const _plFraseV21b = plFrase;
plFrase = function(a){ return plTipo(a)==='ativo' ? `tirou do catálogo <b>${esc(String(a.produto||'').slice(0,60))}</b>` : _plFraseV21b(a); };
const _edValorV21b = edValor;
edValor = function(a, v){ if(a.campo!=='ativo') return _edValorV21b(a, v);
  const s = String(v||''); return s.indexOf('NÃO')===0 ? `<b style="color:#8e0b12">fora do catálogo</b>${s.split(' · ')[1]?' <span style="color:#888">('+esc(s.split(' · ').slice(1).join(' · '))+')</span>':''}` : '<b style="color:#1f7a49">no catálogo</b>'; };

const FL_MOTIVOS = ['Não trabalhamos mais', 'Fora de linha', 'Produto repetido', 'Cadastro errado / teste'];
let FLT = null;   // {id, motivo}
const _flModalV21b = flModal;
flModal = function(){
  _flModalV21b.apply(this, arguments);
  const mc = document.querySelector('#fl-m .fl-mc'); if(!mc || !FLP) return;
  const p = FL.lista.find(x=>x.id===FLP.id); if(!p) return;
  const aberto = FLT && FLT.id===p.id;
  mc.insertAdjacentHTML('beforeend', aberto ? `<div class="fl-tirarbox" id="fl-tirarbox">
      <h4>🗑️ Tirar “${esc(p.nome)}” do catálogo?</h4>
      <p>Ele some do link e do PDV. O histórico e as vendas antigas ficam guardados, e a administração pode voltar com ele se precisar.</p>
      <div class="mot">${FL_MOTIVOS.map(m=>`<button class="${FLT.motivo===m?'on':''}" onclick="FLT.motivo=${esc(JSON.stringify(m))};flModal()">${esc(m)}</button>`).join('')}</div>
      <div class="acoes"><button class="fl-bt sec" onclick="FLT=null;flModal()">Cancelar</button><button class="fl-bt perigo" id="fl-tirar-ok" ${FLT.motivo?'':'disabled'} onclick="flTirar()"><i class="ti ti-trash"></i> Sim, tirar</button></div>
      ${FLT.motivo?'':'<p style="margin:8px 0 0;font-size:12px;color:#8e0b12;font-weight:700">Escolha o motivo para liberar o botão.</p>'}
    </div>` : `<button class="fl-tirar" onclick="FLT={id:'${p.id}',motivo:''};flModal();setTimeout(()=>document.getElementById('fl-tirarbox')?.scrollIntoView({behavior:'smooth',block:'center'}),40)"><i class="ti ti-trash"></i> A loja não vende mais? Tirar do catálogo</button>`);
};
const _flFecharV21b = flFechar;
flFechar = function(){ FLT = null; return _flFecharV21b.apply(this, arguments); };
const _flAbrirV21b = flAbrir;
flAbrir = function(id){ if(FL && !FL.lista.some(x=>x.id===id)){ toast('Esse produto foi tirado do catálogo. Para voltar com ele, fale com a administração.', true); return; } FLT = null; return _flAbrirV21b.apply(this, arguments); };
async function flTirar(){
  if(flPrecisaNome() || !FLP || !FLT || !FLT.motivo) return;
  const id = FLP.id, p = FL.lista.find(x=>x.id===id); if(!p) return;
  const b = $('#fl-tirar-ok'); if(b){ b.disabled = true; b.innerHTML = '<span class="gira"></span> Tirando…'; }
  try{
    await api('fotos', {chave: FL.chave, op:'tirar', produto_id: id, motivo: FLT.motivo, por: FL.por});
    const prox = typeof flProximoId==='function' ? flProximoId(id) : null, seguir = !!(FL._ordem && prox);
    plMarcar('correcao', 'ativo', id);
    FL._seguindo = seguir; flFechar(); FL._seguindo = false;
    const card = document.querySelector(`.fl-item[data-id="${id}"]`);
    const tira = ()=>{ FL.lista = FL.lista.filter(x=>x.id!==id); if(FL._ordem) FL._ordem = FL._ordem.filter(x=>x!==id); flRecalcular(); flPintar(); if(seguir) setTimeout(()=>flAbrir(prox), 300); };
    if(card && !matchMedia('(prefers-reduced-motion: reduce)').matches){ card.classList.add('saindo'); setTimeout(tira, 430); } else tira();
    toast('🗑️ Tirado do catálogo ✔');
  }catch(e){
    if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-trash"></i> Sim, tirar'; }
    toast(/desconhecida|Qual aviso|op/i.test(e.message) && !erroRede(e) ? 'O servidor ainda não tem essa função — avise a administração para atualizar o Apps Script.' : (erroRede(e) ? 'Sem internet — tente de novo' : e.message), true);
  }
}

/* placar → conferir/corrigir o que cada pessoa fez (abre "Editados" já filtrado na pessoa) */
function plVer(nome){ EDT = {pessoa: nome, tipo:'', q:'', aberto:null}; flEditados(); }
const _plHtmlV21b = plHtml;
plHtml = function(){
  let h = _plHtmlV21b();
  if(PL.aberto) h = h.replace(/(<div class="pl-det"[^>]*>)([\s\S]*?)(<\/div>)/, (m, a, mid, c)=>`${a}${mid}<button class="pl-ver" onclick="plVer(${esc(JSON.stringify(PL.aberto))})"><i class="ti ti-eye"></i> Conferir e corrigir o que ${esc(flPrimeiro(PL.aberto))} fez</button>${c}`);
  return h;
};
