/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v19 (app19.js): LINK DO MUTIRÃO MAIS INTUITIVO
   • Boas-vindas: 3 passos animados e "quem é você?" em botões grandes.
   • Topo com anel de progresso que anima e conta, "você arrumou N hoje".
   • Missões em blocos grandes (Tirar foto, Pôr categoria, Arrumar nome, Conferir
     preço, Código, Contar estoque): toca e a lista mostra só aquilo.
   • Barra de busca fixa com leitor de código, botão flutuante de câmera.
   • Produto: abre de baixo para cima, mostra "3 de 285 nesta missão",
     "Salvar e próximo" e "Pular"; produto que fica pronto solta confete.
   • Animações só com movimento (sem depender de transparência) e desligam
     se o aparelho pedir menos movimento.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.fl-pag{max-width:820px;padding:12px 14px 110px}
.fl-pag *{-webkit-tap-highlight-color:transparent}
@keyframes flSobe{from{transform:translateY(16px)}to{transform:none}}
@keyframes flPop{0%{transform:scale(.8)}70%{transform:scale(1.05)}100%{transform:none}}
@keyframes flFolha{from{transform:translateY(40px)}to{transform:none}}
@keyframes flBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
@keyframes flPulso{0%{box-shadow:0 0 0 0 rgba(212,18,27,.45)}70%{box-shadow:0 0 0 14px rgba(212,18,27,0)}100%{box-shadow:0 0 0 0 rgba(212,18,27,0)}}
@keyframes flBrilho{from{background-position:-200px 0}to{background-position:200px 0}}
@keyframes flConf{to{transform:translate(var(--x),var(--y)) rotate(var(--r))}}
@keyframes flCheck{0%{transform:scale(0) rotate(-30deg)}60%{transform:scale(1.25)}100%{transform:none}}
.fl-entra>*{animation:flSobe .5s cubic-bezier(.2,.8,.2,1) both}
.fl-entra>*:nth-child(2){animation-delay:.06s}.fl-entra>*:nth-child(3){animation-delay:.12s}.fl-entra>*:nth-child(4){animation-delay:.18s}.fl-entra>*:nth-child(5){animation-delay:.24s}.fl-entra>*:nth-child(6){animation-delay:.3s}

/* boas-vindas */
.fl-boas{min-height:calc(100vh - 40px);display:flex;flex-direction:column;justify-content:center;gap:16px;padding:8px 0}
.fl-boas .hero{background:linear-gradient(140deg,#D4121B,#a50b13 70%,#7d0910);color:#fff;border-radius:24px;padding:22px 20px;position:relative;overflow:hidden}
.fl-boas .hero:after{content:'';position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(245,181,36,.45),transparent 70%)}
.fl-boas .hero img{height:46px;animation:flBalanca 2.4s ease-in-out .6s 2}
.fl-boas h1{margin:12px 0 4px;font-size:26px;line-height:1.15}
.fl-boas .hero p{margin:0;font-size:14.5px;opacity:.95;max-width:440px}
.fl-passos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fl-passo{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 10px;text-align:center;animation:flSobe .5s both}
.fl-passo:nth-child(2){animation-delay:.1s}.fl-passo:nth-child(3){animation-delay:.2s}
.fl-passo .ic{font-size:28px;display:block;margin-bottom:6px;animation:flPop .6s .3s both}
.fl-passo b{display:block;font-size:13.5px}.fl-passo small{font-size:11.5px;color:#777;line-height:1.3;display:block;margin-top:2px}
.fl-boas .quem{background:#fff;border-radius:22px;padding:16px;border:1px solid rgba(0,0,0,.07)}
.fl-boas .quem h3{margin:0 0 2px;font-size:17px}
.fl-boas .fl-nomes{gap:10px;margin-top:12px}
.fl-boas .fl-nomes button{padding:12px 18px;font-size:15px;animation:flPop .45s both;transition:transform .15s}
.fl-boas .fl-nomes button:active{transform:scale(.95)}

/* topo */
.fl-hero{display:flex;align-items:center;gap:16px;background:linear-gradient(140deg,#D4121B,#a50b13);color:#fff;border-radius:24px;padding:16px 18px;position:relative;overflow:hidden;margin-bottom:12px}
.fl-hero:after{content:'';position:absolute;right:-50px;bottom:-70px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(245,181,36,.35),transparent 70%);pointer-events:none}
.fl-anel{position:relative;width:92px;height:92px;flex:none}
.fl-anel svg{width:92px;height:92px;transform:rotate(-90deg)}
.fl-anel circle{fill:none;stroke-width:9}
.fl-anel .fundo{stroke:rgba(255,255,255,.22)}
.fl-anel .frente{stroke:#F5B524;stroke-linecap:round;transition:stroke-dashoffset .2s}
.fl-anel .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:22px;line-height:1}
.fl-anel .num small{font-size:10px;font-weight:700;opacity:.85;margin-top:3px}
.fl-hero .txt{flex:1;min-width:0;position:relative;z-index:1}
.fl-hero .oi{font-size:19px;font-weight:900;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fl-hero .oi button{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:99px;padding:4px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.fl-hero .sub{font-size:13.5px;opacity:.95;margin-top:3px}
.fl-hero .eu{display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:rgba(255,255,255,.16);border-radius:99px;padding:5px 11px;font-size:12.5px;font-weight:800}
.fl-hero .eu b{font-size:15px;color:#F5B524}

/* dica de como funciona */
.fl-comofunc{display:flex;gap:10px;align-items:flex-start;background:#fff8e6;border:1.5px solid #f3d58a;border-radius:18px;padding:12px 14px;margin-bottom:12px;font-size:13.5px;color:#5c4300}
.fl-comofunc .ic{font-size:22px;animation:flBalanca 2s ease-in-out 1s 2}
.fl-comofunc ol{margin:4px 0 0;padding-left:18px}.fl-comofunc li{margin:2px 0}
.fl-comofunc button{border:0;background:none;font:inherit;font-weight:800;color:#8a5d00;cursor:pointer;padding:4px;margin-left:auto}

/* missões */
.fl-sec{display:flex;align-items:baseline;justify-content:space-between;margin:16px 4px 8px;font-weight:900;font-size:15px}
.fl-sec small{font-weight:600;color:#888;font-size:12.5px}
.fl-missoes{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.fl-missao{position:relative;display:flex;flex-direction:column;gap:2px;text-align:left;border:1.5px solid rgba(0,0,0,.08);background:#fff;border-radius:20px;padding:14px 14px 12px;cursor:pointer;font:inherit;color:#222;overflow:hidden;transition:transform .18s, box-shadow .18s, border-color .18s}
.fl-entra .fl-missao{animation:flSobe .45s both}
.fl-missao:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.08)}
.fl-missao:active{transform:scale(.97)}
.fl-missao .ic{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-size:21px;background:var(--c-f,#fdeceb);margin-bottom:6px}
.fl-missao b{font-size:14.5px}
.fl-missao .n{font-size:26px;font-weight:900;color:var(--c,#D4121B);line-height:1.1}
.fl-missao small{font-size:11.5px;color:#777;line-height:1.3}
.fl-missao .mb{height:5px;border-radius:9px;background:rgba(0,0,0,.06);margin-top:8px;overflow:hidden}
.fl-missao .mb i{display:block;height:100%;width:var(--p);background:var(--c,#D4121B);border-radius:9px;transform-origin:left}
.fl-entra .fl-missao .mb i{animation:flBarra .9s .3s cubic-bezier(.2,.8,.2,1) both}
@keyframes flBarra{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.fl-missao.on{border-color:var(--c,#D4121B);box-shadow:0 0 0 3px color-mix(in srgb,var(--c,#D4121B) 18%,transparent)}
.fl-missao.on:after{content:'✓';position:absolute;top:10px;right:12px;width:22px;height:22px;border-radius:50%;background:var(--c,#D4121B);color:#fff;font-size:12px;font-weight:900;display:grid;place-items:center;animation:flCheck .35s both}
.fl-missao.feita{opacity:1;background:#f3fbf6;border-color:rgba(47,179,107,.35)}
.fl-missao.feita .n{color:#2fb36b}

/* contagem */
.fl-pag .fl-card{border-radius:20px}
.fl-cont-mini{display:flex;align-items:center;gap:10px;font-size:13px;color:#777;background:#fff;border:1px dashed rgba(0,0,0,.14);border-radius:16px;padding:10px 14px;margin-top:12px}

/* barra fixa */
.fl-fixa{position:sticky;top:0;z-index:50;margin:16px -14px 0;padding:10px 14px 8px;background:rgba(246,243,242,.92);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px)}
.fl-fixa .lin{display:flex;gap:8px}
.fl-fixa .fl-busca{border-radius:16px;padding:12px 14px 12px 40px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%23999' stroke-width='2.2' stroke-linecap='round'%3E%3Ccircle cx='8' cy='8' r='6'/%3E%3Cpath d='m13 13 4 4'/%3E%3C/svg%3E") 14px 50%/18px no-repeat}
.fl-fixa .cam{border:0;border-radius:16px;width:50px;background:#222;color:#fff;font-size:22px;cursor:pointer;flex:none}
.fl-fixa .fl-chips{margin-top:8px}
.fl-fixa .fl-chips button{transition:transform .15s,background .2s}
.fl-fixa .fl-chips button:active{transform:scale(.94)}
.fl-mostra{display:flex;align-items:center;gap:8px;margin:6px 2px 0;font-size:13px;color:#555}
.fl-mostra b{color:#222}
.fl-mostra button{border:0;background:#ece7e5;border-radius:99px;padding:4px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.fl-edit{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;border:1.5px dashed rgba(0,0,0,.18);background:#fff;border-radius:16px;padding:11px;font:inherit;font-weight:800;font-size:14px;color:#444;cursor:pointer}

/* cartões dos produtos */
.fl-grade{grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
.fl-item{border-radius:18px;padding:8px 8px 10px;transition:transform .18s,box-shadow .18s}
.fl-item:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(0,0,0,.09)}
.fl-item:active{transform:scale(.97)}
.fl-item.surge{animation:flSobe .45s cubic-bezier(.2,.8,.2,1) both}
.fl-item .ft{border-radius:13px;background:linear-gradient(90deg,#f1eeec 0,#faf8f7 50%,#f1eeec 100%) 0 0/400px 100%;animation:flBrilho 1.2s linear infinite}
.fl-item .ft.carregou{animation:none;background:#f3f3f3}
.fl-item .semft{border-radius:13px}
.fl-item .semft i{animation:flBalanca 2.6s ease-in-out infinite}
.fl-item.acabou{animation:flPop .6s both;border-color:#2fb36b;box-shadow:0 0 0 3px rgba(47,179,107,.25)}
.fl-cat{margin:22px 4px 10px;font-size:13px}
.fl-cat span{display:inline-flex;align-items:center;gap:8px}
.fl-cat span:before{content:'';width:8px;height:8px;border-radius:50%;background:#D4121B}

/* botão flutuante */
.fl-fab{position:fixed;right:18px;bottom:22px;z-index:60;border:0;border-radius:22px;background:#D4121B;color:#fff;font:inherit;font-weight:900;font-size:15px;padding:15px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 10px 26px rgba(212,18,27,.4);animation:flPop .5s .5s both,flPulso 2.2s 1.4s 3}
.fl-fab i{font-size:22px}
.fl-fab:active{transform:scale(.95)}
.fl-topo-btn{position:fixed;left:18px;bottom:26px;z-index:60;border:0;width:44px;height:44px;border-radius:50%;background:#fff;color:#222;box-shadow:0 6px 18px rgba(0,0,0,.15);font-size:20px;cursor:pointer;transform:translateY(90px);transition:transform .3s}
.fl-topo-btn.vis{transform:none}

/* janela do produto */
.fl-mc.abrindo{animation:flFolha .35s cubic-bezier(.2,.8,.2,1) both}
.fl-mc{border-radius:24px 24px 0 0;padding-top:10px}
@media(min-width:700px){.fl-mc{border-radius:24px}}
.fl-mc:before{content:'';display:block;width:42px;height:5px;border-radius:9px;background:#ddd;margin:0 auto 10px}
@media(min-width:700px){.fl-mc:before{display:none}}
.fl-seq{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#777;margin:-4px 0 10px}
.fl-seq .b{flex:1;height:5px;border-radius:9px;background:#eee;overflow:hidden}
.fl-seq .b i{display:block;height:100%;background:#D4121B;border-radius:9px;transition:width .4s}
.fl-mc .fl-fg{border-radius:18px}
.fl-mc .fl-avl div{border-radius:14px;animation:flSobe .35s both}
.fl-mc .fl-avl div:nth-child(2){animation-delay:.05s}.fl-mc .fl-avl div:nth-child(3){animation-delay:.1s}
.fl-acoes{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:16px}
.fl-acoes .fl-bt.pri{margin-top:0}
.fl-prox{display:flex;gap:8px;margin-top:8px}
.fl-prox .fl-bt{flex:1;font-size:14px;padding:11px}
.fl-bt{transition:transform .15s}
.fl-bt:active{transform:scale(.97)}

/* confete */
.fl-conf{position:fixed;left:50%;top:45%;z-index:9700;pointer-events:none}
.fl-conf i{position:absolute;width:9px;height:14px;border-radius:2px;animation:flConf .9s cubic-bezier(.15,.7,.3,1) forwards}
.fl-pronto{position:fixed;left:50%;top:40%;z-index:9701;transform:translate(-50%,-50%);pointer-events:none;background:#2fb36b;color:#fff;font-weight:900;font-size:17px;padding:14px 20px;border-radius:20px;box-shadow:0 14px 30px rgba(47,179,107,.4);animation:flPop .45s both;display:flex;align-items:center;gap:8px}

@media(max-width:520px){.fl-passos{grid-template-columns:1fr}.fl-passo{display:flex;align-items:center;gap:12px;text-align:left;padding:12px 14px}.fl-passo .ic{margin:0}
  .fl-missoes{grid-template-columns:1fr 1fr}.fl-missao .n{font-size:23px}.fl-hero{padding:14px}.fl-anel,.fl-anel svg{width:80px;height:80px}.fl-hero .oi{font-size:17px}
  .fl-grade{grid-template-columns:1fr 1fr;gap:10px}.fl-fab span{display:none}.fl-fab{padding:16px;border-radius:50%}}
@media(prefers-reduced-motion:reduce){.fl-pag *,.fl-mc,.fl-fab,.fl-conf i,.fl-pronto{animation:none!important;transition:none!important}}
`; document.head.appendChild(st); })();

/* missões: grupos de avisos que a equipe entende de cara */
const FL_MISSOES = [
  {id:'foto',  ic:'📷', t:'Tirar foto',     d:'Fundo claro, produto inteiro', k:['sem_foto'], c:'#D4121B', cf:'#fdeceb'},
  {id:'cat',   ic:'🏷️', t:'Pôr categoria',  d:'Em qual seção ele fica',       k:['sem_categoria'], c:'#7c3aed', cf:'#f1eafe'},
  {id:'nome',  ic:'Aa', t:'Arrumar o nome', d:'Só a 1ª letra maiúscula',      k:['nome_maiusculo','nome_estranho','nome_repetido'], c:'#c2410c', cf:'#fff1e6'},
  {id:'preco', ic:'💲', t:'Conferir preço', d:'Vai para aprovação',           k:['preco_zero','preco_estranho'], c:'#b45309', cf:'#fff7e0'},
  {id:'cod',   ic:'🔢', t:'Código',         d:'Bipe o código de barras',      k:['sem_codigo','codigo_repetido'], c:'#0f766e', cf:'#e3f6f3'}
];
function flMissaoConta(m){ return FL.lista.filter(p=>p._av.some(k=>m.k.includes(k))).length; }
function flMissao(id){
  if(FL.filtro==='missao' && FL.missao===id){ FL.filtro = 'arrumar'; FL.missao = ''; }
  else if(id==='contar'){ FL.filtro = 'naocontados'; FL.missao = ''; }
  else { FL.filtro = 'missao'; FL.missao = id; FL.aviso = ''; }
  FL.lim = 150; FL._animLista = true; flPintar();
  setTimeout(()=>document.getElementById('fl-fixa')?.scrollIntoView({behavior:'smooth', block:'start'}), 30);
}
const _flFiltradaV19 = flFiltrada;
flFiltrada = function(){
  if(FL.filtro!=='missao') return _flFiltradaV19();
  const m = FL_MISSOES.find(x=>x.id===FL.missao); const f = FL.filtro; FL.filtro = 'todos';
  const l = _flFiltradaV19(); FL.filtro = f;
  return m ? l.filter(p=>p._av.some(k=>m.k.includes(k))) : l;
};
function flPrimeiro(n){ return String(n||'').trim().split(/\s+/)[0]; }

function flAnel(pct){
  const r = 40, c = 2*Math.PI*r;
  return `<div class="fl-anel" id="fl-anel" data-p="${pct}"><svg viewBox="0 0 92 92"><circle class="fundo" cx="46" cy="46" r="${r}"/><circle class="frente" cx="46" cy="46" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c*(1-(FL._pctAnt??0)/100)).toFixed(1)}"/></svg><div class="num"><span id="fl-anel-n">${FL._pctAnt??0}%</span><small>prontos</small></div></div>`;
}
function flAnimarAnel(){
  const el = document.getElementById('fl-anel'); if(!el) return;
  const alvo = +el.dataset.p, de = FL._pctAnt ?? 0, c = 2*Math.PI*40, ci = el.querySelector('.frente'), n = document.getElementById('fl-anel-n');
  FL._pctAnt = alvo;
  if(de===alvo || matchMedia('(prefers-reduced-motion: reduce)').matches){ ci.setAttribute('stroke-dashoffset', (c*(1-alvo/100)).toFixed(1)); n.textContent = alvo+'%'; return; }
  const t0 = performance.now(), dur = 1100;
  const passo = t => { const k = Math.min(1, (t-t0)/dur), e = 1-Math.pow(1-k, 3), v = de + (alvo-de)*e;
    ci.setAttribute('stroke-dashoffset', (c*(1-v/100)).toFixed(1)); n.textContent = Math.round(v)+'%'; if(k<1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
function flContarAte(el){ const alvo = +el.dataset.n; if(!alvo || matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent = alvo; return; }
  const t0 = performance.now(), dur = 800; const passo = t => { const k = Math.min(1,(t-t0)/dur); el.textContent = Math.round(alvo*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); }

function flBoasVindas(){
  return `<div class="fl-pag"><div class="fl-boas">
    <div class="hero"><img src="${LOGO}" alt=""><h1>Bem-vinda ao<br>mutirão dos produtos ✨</h1><p>Vamos deixar cada produto com foto, nome certinho, categoria e estoque contado. Sem pressa: bem feito vale mais que rápido.</p></div>
    <div class="fl-passos">
      <div class="fl-passo"><span class="ic">👆</span><div><b>1. Escolha uma missão</b><small>Foto, categoria, nome, preço ou contagem</small></div></div>
      <div class="fl-passo"><span class="ic">📷</span><div><b>2. Toque no produto</b><small>Tire a foto e confira os dados</small></div></div>
      <div class="fl-passo"><span class="ic">✅</span><div><b>3. Salve e vá pro próximo</b><small>O progresso aparece para todas</small></div></div>
    </div>
    <div class="quem"><h3>Quem está arrumando?</h3><p class="fl-dica" style="margin:0">Toque no seu nome. Fica guardado neste celular.</p>
      <div class="fl-nomes">${FL.nomes.map((n,i)=>`<button class="${FL.por===n?'on':''}" style="animation-delay:${.25+i*.05}s" onclick="flPor(${esc(JSON.stringify(n))})">${esc(n)}</button>`).join('')}<button style="animation-delay:${.25+FL.nomes.length*.05}s" onclick="flPorOutro()">Outro nome…</button></div>
      ${FL.por?`<button class="fl-bt sec" style="width:100%;margin-top:12px" onclick="FL.trocarNome=0;flPintar()">Continuar como ${esc(FL.por)}</button>`:''}
    </div>
  </div></div>`;
}

flPintar = function flPintar(){
  const app = $('#app'); if(!app || S.tela!=='fotos') return;
  if(FL.erro){ app.innerHTML = `<div class="fl-pag">${flTopo('—')}<div class="fl-card" style="border-color:#D4121B;color:#D4121B;font-weight:700"><i class="ti ti-alert-triangle"></i> ${esc(FL.erro)}</div></div>`; return; }
  if(FL.carregando && !FL.lista.length){ app.innerHTML = `<div class="fl-pag"><div class="fl-boas"><div class="hero"><img src="${LOGO}" alt=""><h1>Mutirão dos produtos</h1><p><span class="gira"></span> Carregando os produtos…</p></div></div></div>`; return; }
  if(!FL.por || FL.trocarNome){ app.innerHTML = flBoasVindas(); return; }
  const c = flContas(), pct = c.todos ? Math.round(c.prontos/c.todos*100) : 0, primeiraVez = !FL._ja;
  const naoCont = FL.ct ? FL.lista.filter(p=>!flContado(p)).length : 0;
  const ms = FL_MISSOES.map(m=>({...m, n:flMissaoConta(m)}));
  let dica = true; try{ dica = !localStorage.getItem('lv_fl_dica'); }catch(e){}
  const mAtiva = FL.filtro==='missao' ? FL_MISSOES.find(m=>m.id===FL.missao) : null;
  const rotFiltro = mAtiva ? mAtiva.ic+' '+mAtiva.t : ({arrumar:'⚠️ Tudo para arrumar', sem_foto:'📷 Sem foto', naocontados:'📦 Não contados', contados:'📦 Contados', prontos:'✅ Prontos', todos:'Todos os produtos'})[FL.filtro] || '';
  const nLista = flFiltrada().length;
  app.innerHTML = `<div class="fl-pag ${primeiraVez?'fl-entra':''}">
    <div class="fl-hero">${flAnel(pct)}<div class="txt">
      <div class="oi">Oi, ${esc(flPrimeiro(FL.por))} 👋 <button onclick="FL.trocarNome=1;flPintar()">não é você?</button></div>
      <div class="sub"><b>${c.prontos}</b> de ${c.todos} produtos prontos · faltam <b>${c.arrumar}</b></div>
      ${FL.eu?`<div class="eu">✔ você já arrumou <b>${FL.eu}</b> hoje</div>`:`<div class="eu">Escolha uma missão abaixo 👇</div>`}
    </div></div>
    ${dica?`<div class="fl-comofunc"><span class="ic">💡</span><div><b>Como funciona</b><ol><li>Toque numa <b>missão</b> (ex.: Tirar foto).</li><li>Toque no produto, arrume e <b>Salvar e próximo</b>.</li><li>Na dúvida, deixe para a administração.</li></ol></div><button onclick="try{localStorage.setItem('lv_fl_dica','1')}catch(e){};flPintar()">Entendi</button></div>`:''}
    <div>
      <div class="fl-sec"><span>Missões</span><small>toque para ver só aquilo</small></div>
      <div class="fl-missoes">${ms.map((m,i)=>`<button class="fl-missao ${FL.missao===m.id&&FL.filtro==='missao'?'on':''} ${m.n?'':'feita'}" style="--c:${m.c};--c-f:${m.cf};--p:${c.todos?Math.max(3,Math.round((c.todos-m.n)/c.todos*100)):100}%;animation-delay:${primeiraVez?.15+i*.05:0}s" onclick="flMissao('${m.id}')">
          <span class="ic">${m.ic}</span><b>${m.t}</b><span class="n" data-n="${m.n}">${m.n?m.n:'✓'}</span><small>${m.n?m.d:'Tudo feito! 🎉'}</small><span class="mb"><i></i></span></button>`).join('')}
        ${FL.ct?`<button class="fl-missao ${FL.filtro==='naocontados'?'on':''} ${naoCont?'':'feita'}" style="--c:#2563eb;--c-f:#e8f0ff;--p:${c.todos?Math.max(3,Math.round((c.todos-naoCont)/c.todos*100)):100}%" onclick="flMissao('contar')"><span class="ic">📦</span><b>Contar estoque</b><span class="n" data-n="${naoCont}">${naoCont||'✓'}</span><small>${naoCont?'Conte o total e salve':'Tudo contado! 🎉'}</small><span class="mb"><i></i></span></button>`:''}
      </div>
      ${FL.contagemOn===false ? '' : (FL.contagens||[]).length ? flContagemHtml() : `<div class="fl-cont-mini">📦 Contagem de estoque: a administração ainda não abriu nenhuma. Quando abrir, aparece aqui.</div>`}
    </div>
    <div class="fl-fixa" id="fl-fixa">
      <div class="lin"><input class="fl-busca" style="flex:1" placeholder="Buscar por nome ou código…" value="${esc(FL.q)}" oninput="FL.q=this.value;FL.lim=150;flPintarLista();flAtualizaMostra()"><button class="cam" title="Ler o código de barras pela câmera" onclick="flCamera()"><i class="ti ti-barcode"></i></button></div>
      <div class="fl-chips">${[['arrumar','⚠️ Para arrumar',c.arrumar],['sem_foto','📷 Sem foto',c.sem_foto]].concat(FL.ct?[['naocontados','📦 Não contados',naoCont],['contados','📦 Contados',FL.lista.length-naoCont]]:[]).concat([['prontos','✅ Prontos',c.prontos],['todos','Todos',c.todos]]).map(([k,n,v])=>`<button class="${FL.filtro===k?'on':''}" onclick="FL.filtro='${k}';FL.missao='';FL.aviso='';FL.lim=150;FL._animLista=true;flPintar()">${n} (${v})</button>`).join('')}</div>
      <div class="fl-mostra" id="fl-mostra">${flMostraHtml(rotFiltro, nLista)}</div>
    </div>
    <div id="fl-lista">${flListaHtml()}</div>
    <button class="fl-edit" onclick="flEditados()"><i class="ti ti-history"></i> Ver os já editados (quem fez e o que mudou)</button>
    <div class="fl-rod">Mutirão de arrumação · Las Vegas · <a href="#" onclick="flCarregar();return false" style="color:#D4121B">atualizar</a></div>
  </div>
  <button class="fl-fab" onclick="flCamera()" title="Achar o produto pelo código de barras"><i class="ti ti-barcode"></i><span>Bipar produto</span></button>
  <button class="fl-topo-btn" id="fl-topo-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Voltar ao topo"><i class="ti ti-arrow-up"></i></button>`;
  FL._ja = true;
  requestAnimationFrame(()=>{ flAnimarAnel(); if(primeiraVez) document.querySelectorAll('.fl-missao .n[data-n]').forEach(el=>{ if(+el.dataset.n) flContarAte(el); }); flPosLista(); });
};
function flMostraHtml(rot, n){ return `Mostrando <b>${esc(rot)}</b> · ${n} produto(s)${FL.q?` com “${esc(FL.q)}”`:''}${FL.filtro==='missao'||FL.q?` <button onclick="FL.filtro='arrumar';FL.missao='';FL.q='';FL._animLista=true;flPintar()">✕ limpar</button>`:''}`; }
function flAtualizaMostra(){ const el = $('#fl-mostra'); if(!el) return; const m = FL.filtro==='missao' ? FL_MISSOES.find(x=>x.id===FL.missao) : null;
  el.innerHTML = flMostraHtml(m ? m.ic+' '+m.t : ({arrumar:'⚠️ Tudo para arrumar', sem_foto:'📷 Sem foto', naocontados:'📦 Não contados', contados:'📦 Contados', prontos:'✅ Prontos', todos:'Todos os produtos'})[FL.filtro]||'', flFiltrada().length); }

/* animação dos cartões quando a lista muda de filtro, e foto que terminou de carregar */
function flPosLista(){
  const g = document.getElementById('fl-lista'); if(!g) return;
  g.querySelectorAll('img.ft').forEach(im=>{ if(im.complete) im.classList.add('carregou'); else im.addEventListener('load', ()=>im.classList.add('carregou'), {once:true}); });
  if(FL._animLista || !FL._listaAnimada){ [...g.querySelectorAll('.fl-item')].slice(0, 24).forEach((b,i)=>{ b.classList.add('surge'); b.style.animationDelay = (i*0.03)+'s'; }); }
  FL._animLista = false; FL._listaAnimada = true;
  if(FL._acabou){ const b = g.querySelector(`.fl-item[data-id="${FL._acabou}"]`); if(b){ b.classList.add('acabou'); } FL._acabou = null; }
}
const _flItemHtmlV19 = flItemHtml;
flItemHtml = function(p){ return _flItemHtmlV19(p).replace('<button class="fl-item', `<button data-id="${p.id}" class="fl-item`); };
const _flPintarListaV19 = flPintarLista;
flPintarLista = function(){ FL._animLista = true; _flPintarListaV19(); flPosLista(); };
window.addEventListener('scroll', ()=>{ const b = document.getElementById('fl-topo-btn'); if(b) b.classList.toggle('vis', window.scrollY > 700); }, {passive:true});

/* ───────── janela do produto: abre animada, mostra a posição na missão, salvar e próximo ───────── */
const _flModalV19 = flModal;
flModal = function(){
  const novo = FL._mAberto !== (FLP && FLP.id);
  _flModalV19();
  const mc = document.querySelector('#fl-m .fl-mc'); if(!mc || !FLP) return;
  if(novo){ mc.classList.add('abrindo'); FL._mAberto = FLP.id; }
  if(!FL._ordem || !FL._ordem.includes(FLP.id)) FL._ordem = flFiltrada().map(x=>x.id);   // ordem guardada: o produto some da missão quando ganha a foto, mas a sequência continua
  const l = FL._ordem.map(id=>({id})), i = FL._ordem.indexOf(FLP.id);
  const t = mc.querySelector('.fl-mt');
  if(t && i>=0 && l.length>1) t.insertAdjacentHTML('afterend', `<div class="fl-seq"><span>${i+1} de ${l.length} nesta lista</span><span class="b"><i style="width:${Math.round((i+1)/l.length*100)}%"></i></span></div>`);
  const ok = mc.querySelector('#flp-ok');
  if(ok){ const prox = flProximoId();
    ok.insertAdjacentHTML('afterend', `<div class="fl-prox">${prox?`<button class="fl-bt ouro" onclick="flSalvarProximo()"><i class="ti ti-player-track-next"></i> Salvar e próximo</button><button class="fl-bt sec" onclick="flPular()" title="Ir para o próximo sem salvar">Pular <i class="ti ti-arrow-right"></i></button>`:''}</div>`); }
};
function flProximoId(atual){ atual = atual || (FLP && FLP.id); if(!atual) return null;
  const agora = new Set(flFiltrada().map(x=>x.id)), ordem = FL._ordem && FL._ordem.includes(atual) ? FL._ordem : [...agora], i = ordem.indexOf(atual);
  return ordem.slice(i+1).find(id=>agora.has(id)) || [...agora].find(id=>id!==atual) || null; }
function flPular(){ const n = flProximoId(); if(!n) return; flAbrir(n); }
async function flSalvarProximo(){
  const atual = FLP && FLP.id; if(!atual) return;
  FL._seguindo = true;
  try{ await flSalvar(); } finally { FL._seguindo = false; }
  if(FLP) return;   // deu erro: continua aberto
  const n = flProximoId(atual);
  if(n) setTimeout(()=>flAbrir(n), 420); else toast('🎉 Acabou esta lista!');
}
const _flFecharV19 = flFechar;
flFechar = function(){ if(FL){ FL._mAberto = null; if(!FL._seguindo) FL._ordem = null; } return _flFecharV19.apply(this, arguments); };

/* ───────── comemoração quando um produto fica pronto ───────── */
function flConfete(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cores = ['#D4121B','#F5B524','#2fb36b','#2563eb','#ff7ab8'], box = document.createElement('div'); box.className = 'fl-conf';
  box.innerHTML = Array.from({length:26}, (_, k)=>{ const a = Math.random()*Math.PI*2, d = 90+Math.random()*140;
    return `<i style="background:${cores[k%cores.length]};--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d+60}px;--r:${Math.random()*720-360}deg;animation-delay:${Math.random()*.08}s"></i>`; }).join('');
  document.body.appendChild(box); setTimeout(()=>box.remove(), 1200);
}
function flCelebrar(nome){
  flConfete();
  const b = document.createElement('div'); b.className = 'fl-pronto'; b.innerHTML = '✅ Produto pronto!'; document.body.appendChild(b); setTimeout(()=>b.remove(), 1300);
}
function flVigiar(fn){ return async function(){
  const id = FLP && FLP.id, p = id && FL.lista.find(x=>x.id===id), tinha = p ? p._av.length : 0;
  const r = await fn.apply(this, arguments);
  const p2 = id && FL.lista.find(x=>x.id===id);
  if(p2 && tinha && !p2._av.length){ FL._acabou = id; flCelebrar(p2.nome); flPosLista(); }
  return r; }; }
flSalvar = flVigiar(flSalvar);
flFoto = flVigiar(flFoto);
flOk = flVigiar(flOk);
