/* ═══════════ Portal Equipe Las Vegas · v12 — layout novo ═══════════
   Tema claro (tema.css), menu lateral agrupado no lugar da faixa de abas, "Mais" em blocos
   no celular e movimento: troca de tela deslizando, números contando, barras e anéis enchendo,
   indicador do menu deslizando e toque com onda. Não mexe nas telas: monta a casca em volta. */
document.write('<link rel="stylesheet" href="tema.css?v=12">');
(function(){ const m = document.querySelector('meta[name="theme-color"]'); if(m) m.content = '#E3101F'; })();

const GRUPOS_PORTAL = [
  {n:'Vendas', cor:'var(--g-vendas)', k:['pdv','arena','metas','estoque']},
  {n:'Meu dia', cor:'var(--g-dia)', k:['checklist','caixa','mural','agenda']},
  {n:'Meu ponto', cor:'var(--g-ponto)', k:['mes','escala','pedidos']},
  {n:'Aprender', cor:'var(--g-aprender)', k:['protocolos','treino','atalhos']}
];
const GRUPOS_ADM = [
  {n:'Visão geral', cor:'var(--g-vendas)', k:['aovivo','arena']},
  {n:'Vendas e estoque', cor:'var(--g-dia)', k:['pdv','estoque','metas','caixa','roleta']},
  {n:'Equipe e ponto', cor:'var(--g-ponto)', k:['pedidos','hoje','produtividade','escala','mes','banco','equipe']},
  {n:'Comunicação', cor:'var(--g-equipe)', k:['mural','agenda','checklist']},
  {n:'Aprender', cor:'var(--g-aprender)', k:['protocolos','treino','atalhos']},
  {n:'Sistema', cor:'var(--g-sistema)', k:['aparelhos','regras']}
];
const NOMES12 = {
  portal:{pdv:'Vender', arena:'Arena de vendas', metas:'Metas e prêmios', estoque:'Estoque', checklist:'Checklist do dia', caixa:'Caixa e sangria', mural:'Mural de avisos', agenda:'Agenda da equipe', mes:'Meu mês', escala:'Minha escala', pedidos:'Meus pedidos', protocolos:'Protocolos', treino:'Treinamento', atalhos:'Atalhos'},
  admin:{aovivo:'Ao vivo', arena:'Arena de vendas', pdv:'PDV', estoque:'Estoque', metas:'Metas', caixa:'Caixa', roleta:'Roleta do site', pedidos:'Pedidos', hoje:'Hoje', produtividade:'Produtividade', escala:'Escala', mes:'Espelho de ponto', banco:'Banco de horas', equipe:'Equipe', mural:'Mural', agenda:'Agenda', checklist:'Checklist', protocolos:'Protocolos', treino:'Treinamento', atalhos:'Atalhos', aparelhos:'Aparelhos', regras:'Regras'}
};
const M12 = {ultimo:'', indY:null, scroll:0, aberto:false};

/* lê as abas que as telas antigas montaram (com ícone, nome, contador e o clique original) */
function abas12(el){
  const r = {};
  if(!el) return r;
  el.querySelectorAll('button').forEach(b=>{
    const oc = b.getAttribute('onclick')||'', m = oc.match(/(?:portalTab|adm\.tab)='([\w-]+)'/); if(!m) return;
    const ic = [...(b.querySelector('i.ti')?.classList||[])].find(c=>c.startsWith('ti-')) || 'ti-point';
    const badge = b.querySelector('.contador')?.textContent.trim() || '';
    const nome = [...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();
    r[m[1]] = {k:m[1], ic, nome, badge, oc};
  });
  return r;
}
function chave12(){
  if(S.tela==='admin' && S.adm) return 'admin|'+S.adm.tab+'|'+(S.adm.pdvSub||'')+'|'+(S.adm.estSub||'');
  if(S.tela==='portal') return 'portal|'+S.portalTab+'|'+(S.estAba||'')+'|'+(S.protoAberto||'');
  return S.tela;
}
function itemMenu12(t, cor, on){
  return `<a class="${on?'on':''}" style="--cor:${cor}" data-k="${t.k}" tabindex="0"><i class="ti ${t.ic}"></i><span>${esc(t.nome)}</span>${t.badge?`<span class="contador">${esc(t.badge)}</span>`:''}</a>`;
}
function menu12(tabs, adm){
  const grupos = adm ? GRUPOS_ADM : GRUPOS_PORTAL, nomes = NOMES12[adm?'admin':'portal'];
  const atual = adm ? S.adm.tab : S.portalTab, usados = new Set(['inicio','eu','mais']);
  Object.values(tabs).forEach(t=>{ if(nomes[t.k]) t.nome = nomes[t.k]; });
  let h = '';
  if(!adm && tabs.inicio) h += itemMenu12({...tabs.inicio, nome:'Início'}, 'var(--g-vendas)', atual==='inicio');
  grupos.forEach(g=>{
    const its = g.k.filter(k=>tabs[k]); its.forEach(k=>usados.add(k));
    if(its.length) h += `<div class="menu-g" style="--cor:${g.cor}"><small>${g.n}</small>${its.map(k=>itemMenu12(tabs[k], g.cor, atual===k)).join('')}</div>`;
  });
  const resto = Object.values(tabs).filter(t=>!usados.has(t.k));
  if(resto.length) h += `<div class="menu-g" style="--cor:var(--g-sistema)"><small>Outros</small>${resto.map(t=>itemMenu12(t, 'var(--g-sistema)', atual===t.k)).join('')}</div>`;
  let eu;
  if(adm) eu = `<div class="menu-eu"><span class="av" style="--cor:var(--creme);background:var(--creme);color:#fff"><i class="ti ti-shield-lock"></i></span><div><b>Administração</b><small>Las Vegas Sex Shop</small></div></div>`;
  else { const c = S.sess.dados.colaboradora; eu = `<a class="menu-eu" data-k="eu" style="height:auto;color:var(--creme)"><span class="av" style="--cor:${esc(c.cor||'#ccc')};background:${esc(c.cor||'#ccc')}">${esc(iniciais(c.nome))}</span><div><b>${esc(primeiroNome(c.nome))}</b><small>${esc(c.cargo||'Equipe')}</small></div></a>`; }
  const sair = adm ? `S.adm=null;S.tela='inicio';render()` : `sair()`;
  return `<aside class="menu" id="menu12" aria-label="Menu">
    <button class="icone menu-x" aria-label="Fechar menu" onclick="menuFechar12()"><i class="ti ti-x"></i></button>
    ${eu}
    <nav class="menu-nav"><div class="menu-ind" hidden></div>${h}</nav>
    <div class="menu-sair"><a data-sair="1" style="--cor:var(--g-sistema)" tabindex="0" onclick="${sair}"><i class="ti ti-logout-2"></i><span>${adm?'Sair da administração':'Sair do portal'}</span></a></div>
  </aside>`;
}
function menuAbrir12(){ const m = $('#menu12'); if(!m) return; m.classList.add('aberto'); M12.aberto = true;
  const f = document.createElement('div'); f.className = 'menu-fundo'; f.onclick = menuFechar12; document.body.appendChild(f); }
function menuFechar12(){ $('#menu12')?.classList.remove('aberto'); M12.aberto = false; document.querySelectorAll('.menu-fundo').forEach(x=>x.remove()); }

function montarCasca12(){
  const app = $('#app'), w = app.querySelector(':scope > .wrap');
  app.classList.remove('com-menu','adm','port'); app.querySelector(':scope > .menu')?.remove();
  document.querySelectorAll('.menu-fundo').forEach(x=>x.remove());
  if(!w) return null;
  const adm = S.tela==='admin' && S.adm;
  if(!adm && !(S.tela==='portal' && S.sess?.dados)) return w;
  const faixa = w.querySelector(':scope > .abas'), tabs = abas12(faixa);
  if(!Object.keys(tabs).length) return w;
  faixa.remove();
  if(adm) w.querySelectorAll(':scope > .voltar').forEach(v=>{ if(/administra/i.test(v.textContent)) v.remove(); });
  app.insertAdjacentHTML('afterbegin', menu12(tabs, adm));
  app.classList.add('com-menu', adm?'adm':'port');
  const menu = $('#menu12');
  menu.querySelectorAll('.menu-nav a[data-k], a.menu-eu').forEach(a=>{
    const t = tabs[a.dataset.k];
    const ir = ()=>{ menuFechar12(); if(a.dataset.k==='eu' && !t){ S.portalTab='eu'; S.protoAberto=null; render(); return; } if(t) new Function(t.oc)(); };
    a.onclick = ir; a.onkeydown = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); ir(); } };
  });
  // botões do letreiro: ☰ no celular (administração) e o "Sair" de cima só no celular
  const dir = w.querySelector(':scope > .letreiro > .linha');
  if(dir){
    [...dir.querySelectorAll('button')].filter(b=>/sair\(\)|S\.adm=null/.test(b.getAttribute('onclick')||'')).forEach(b=>b.classList.add('btn-sair-top'));
    if(adm) dir.insertAdjacentHTML('afterbegin', `<button class="icone btn-menu" aria-label="Abrir menu" onclick="menuAbrir12()"><i class="ti ti-menu-2"></i></button>`);
  }
  menu.scrollTop = M12.scroll;
  // indicador vermelho desliza do item anterior para o novo
  const on = menu.querySelector('.menu-nav a.on'), ind = menu.querySelector('.menu-ind');
  if(on && ind){
    ind.hidden = false;
    const y = on.offsetTop;
    if(M12.indY!=null && M12.indY!==y && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      ind.style.transition = 'none'; ind.style.transform = `translateY(${M12.indY}px)`; ind.offsetWidth;
      ind.style.transition = ''; requestAnimationFrame(()=>{ ind.style.transform = `translateY(${y}px)`; });
    } else ind.style.transform = `translateY(${y}px)`;
    M12.indY = y;
  } else M12.indY = null;
  return w;
}

/* ───── movimento ───── */
const calmo12 = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function contar12(el){
  const txt = el.textContent.trim(), m = txt.match(/^([+-]?)(R\$\s?)?(\d{1,3}(?:\.\d{3})*|\d+)(,\d{1,2})?(%?)$/);
  if(!m || el.children.length) return;
  const v = Number(m[3].replace(/\./g,'') + (m[4]?'.'+m[4].slice(1):''));
  if(!v || v < 2) return;
  const dec = m[4] ? m[4].length-1 : 0, t0 = performance.now(), dur = Math.min(1300, 600 + Math.log10(v)*140);
  const fmt = x => m[1] + (m[2]||'') + x.toLocaleString('pt-BR', {minimumFractionDigits:dec, maximumFractionDigits:dec}) + m[5];
  const passo = t => { if(!el.isConnected) return; const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,4);
    el.textContent = p<1 ? fmt(Math.round(v*e*Math.pow(10,dec))/Math.pow(10,dec)) : txt; if(p<1) requestAnimationFrame(passo); };
  el.textContent = fmt(0); requestAnimationFrame(passo);
}
function encher12(w){
  w.querySelectorAll('.medidor i').forEach(el=>{ const fim = el.style.width; el.style.transition = 'none'; el.style.width = '0'; el.offsetWidth; el.style.transition = ''; setTimeout(()=>{ el.style.width = fim; }, 120); });
  w.querySelectorAll('.anel .cheio').forEach(el=>{ const fim = el.style.strokeDashoffset, tot = el.style.strokeDasharray; if(!tot) return;
    el.style.transition = 'none'; el.style.strokeDashoffset = tot; el.getBoundingClientRect(); el.style.transition = ''; setTimeout(()=>{ el.style.strokeDashoffset = fim; }, 150); });
}
function animarEntrada12(w){
  if(!w || calmo12()) return;
  [...w.children].filter(c=>!c.classList.contains('letreiro')).forEach((c,i)=>c.style.setProperty('--k', Math.min(i, 10)));
  w.querySelectorAll('.numeros,.atalhos,.tiles').forEach(g=>[...g.children].forEach((c,j)=>c.style.setProperty('--j', Math.min(j, 12))));
  w.classList.add('entra');
  clearTimeout(M12.tEntra); M12.tEntra = setTimeout(()=>w.classList.remove('entra'), 1600);
  w.querySelectorAll('.numero b, .mini-num b, .ar-num b, .pdv-total b').forEach(contar12);
  encher12(w);
}

const _renderV12 = render;
render = function(){
  const m = $('#menu12'); if(m) M12.scroll = m.scrollTop;
  _renderV12.apply(this, arguments);
  let w = null;
  try{ w = montarCasca12(); }catch(e){ console.warn('casca v12', e); }
  document.querySelectorAll('.anel .cheio').forEach(c=>c.classList.toggle('zero', parseFloat(c.style.strokeDashoffset) >= parseFloat(c.style.strokeDasharray) - .5));
  const k = chave12();
  if(k !== M12.ultimo){
    const veio = M12.ultimo; M12.ultimo = k;
    if(S.tela!=='inicio' && veio) { try{ animarEntrada12(w || $('#app > .wrap')); }catch(e){} if(S.tela==='portal'||S.tela==='admin') window.scrollTo({top:0}); }
  }
};

/* "Mais" no celular: os mesmos grupos do menu, em blocos */
portalMais = function portalMais(){
  const d = S.sess.dados, pend = d.solicitacoes.filter(s=>s.status==='pendente').length, nl = avisosNaoLidos().length;
  let tr = {total:0}; try{ tr = progressoTrilha(); }catch(e){}
  let est = 0; try{ const k = estContadores(); est = k.cont + k.chegando; }catch(e){}
  const info = {
    pdv:['ti-shopping-cart','Vender','Abrir o caixa (PDV)'], arena:['ti-flame','Arena','Corrida da meta ao vivo'], metas:['ti-trophy','Metas e prêmios','Ranking e premiação'], estoque:['ti-packages','Estoque','Receber, contar, transferir', est],
    checklist:['ti-checklist','Checklist do dia','Abertura até fechamento'], caixa:['ti-cash-banknote','Caixa e sangria','Registrar a sangria'], mural:['ti-speakerphone','Mural','Avisos da equipe', nl], agenda:['ti-calendar-event','Agenda','Folgas e eventos'],
    mes:['ti-calendar-stats','Meu mês','Ponto e banco de horas'], escala:['ti-calendar-time','Minha escala','Loja e turno'], pedidos:['ti-send','Meus pedidos','Correção, atestado, folga', pend],
    protocolos:['ti-book','Protocolos','O manual da loja'], treino:['ti-school','Treinamento', tr.total?tr.pct+'% concluído':'Trilha da equipe'], atalhos:['ti-apps','Atalhos','Kommo, Nuvemshop…']
  };
  const tile = (k,cor) => { const [ic,n,s,b] = info[k]; return `<button class="tile" style="--cor:${cor}" onclick="S.portalTab='${k}';S.protoAberto=null;render()"><i class="ti ${ic}"></i><b>${n}</b><small>${esc(String(s))}</small>${b?`<span class="contador">${b}</span>`:''}</button>`; };
  return `<div class="ola" style="margin-bottom:14px">Tudo do portal</div>
    ${GRUPOS_PORTAL.map(g=>`<div class="mais-g" style="--cor:${g.cor}"><small>${g.n}</small><div class="tiles">${g.k.map(k=>tile(k,g.cor)).join('')}</div></div>`).join('')}
    <div class="mais-g" style="--cor:var(--g-sistema)"><small>Eu</small><div class="tiles">
      <button class="tile" style="--cor:var(--g-sistema)" onclick="S.portalTab='eu';render()"><i class="ti ti-user-circle"></i><b>Meu perfil</b><small>WhatsApp e PIN</small></button>
      <button class="tile" style="--cor:var(--g-vendas)" onclick="sair()"><i class="ti ti-logout-2"></i><b>Sair</b><small>Fechar o portal</small></button></div></div>`;
};

/* onda no toque */
document.addEventListener('pointerdown', e=>{
  if(calmo12()) return;
  const el = e.target.closest('.btn, .tile, .atalhos button, .menu a, .numero[onclick], button.numero');
  if(!el || el.disabled) return;
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height)*2.2, o = document.createElement('span');
  o.className = 'onda'; o.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  if(getComputedStyle(el).position==='static') el.style.position = 'relative';
  el.appendChild(o); setTimeout(()=>o.remove(), 650);
}, {passive:true});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && M12.aberto) menuFechar12(); });
