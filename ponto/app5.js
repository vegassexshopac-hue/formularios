/* ═══════ PORTAL EQUIPE LAS VEGAS · v5 — mural com leitura, protocolos, treinamento, atalhos, busca rápida ═══════ */

/* ──────────── utilitários ──────────── */
const favicon = url => { try{ return 'https://www.google.com/s2/favicons?sz=64&domain='+new URL(url).hostname; }catch(e){ return ''; } };
const semAcento = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function mdHTML(t){ // markdown simples: ### título · - item · 1. item · **negrito**
  let html = '', lista = null;
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  const fecha = () => { if(lista){ html += lista==='ul'?'</ul>':'</ol>'; lista = null; } };
  String(t||'').split('\n').forEach(l=>{
    const s = l.trim(); let m;
    if(!s){ fecha(); return; }
    if((m = s.match(/^#{2,4}\s+(.*)/))){ fecha(); html += `<h4>${inl(m[1])}</h4>`; return; }
    if((m = s.match(/^[-•]\s+(.*)/))){ if(lista!=='ul'){ fecha(); html += '<ul>'; lista='ul'; } html += `<li>${inl(m[1])}</li>`; return; }
    if((m = s.match(/^\d+[.)]\s+(.*)/))){ if(lista!=='ol'){ fecha(); html += '<ol>'; lista='ol'; } html += `<li>${inl(m[1])}</li>`; return; }
    fecha(); html += `<p>${inl(s)}</p>`;
  });
  fecha(); return html;
}
const quando = s => s ? s.slice(8,10)+'/'+s.slice(5,7)+(s.length>11?' às '+s.slice(11,16):'') : '';
function anel(pct, centro, sub, tam=96){
  const r = tam/2-7, c = 2*Math.PI*r, p = Math.max(0, Math.min(100, pct||0));
  return `<div class="anel" style="width:${tam}px;height:${tam}px"><svg viewBox="0 0 ${tam} ${tam}"><circle cx="${tam/2}" cy="${tam/2}" r="${r}" class="trilho"/><circle cx="${tam/2}" cy="${tam/2}" r="${r}" class="cheio" style="stroke-dasharray:${c};stroke-dashoffset:${c*(1-p/100)}"/></svg><div><b class="num">${centro}</b>${sub?`<small>${sub}</small>`:''}</div></div>`;
}
function chuvaConfete(){
  const v = document.createElement('div'); v.className = 'confete-tela';
  v.innerHTML = Array.from({length:60},(_,i)=>`<i style="left:${Math.random()*100}%;--d:${Math.random()*.6}s;--x:${(Math.random()*2-1)*120}px;background:${['var(--dourado)','var(--vermelho)','#fff','var(--dourado2)'][i%4]}"></i>`).join('');
  document.body.appendChild(v); setTimeout(()=>v.remove(), 2600);
}

/* ──────────── leituras ("Li e entendi" / "Concluí") ──────────── */
const lido = (tipo, ref, eid, lista) => (lista||[]).find(l=>l.tipo===tipo && l.ref_id===ref && l.colaboradora_id===eid);
function avisosAtivos(cal, hoje, dias=7){ return (cal?.eventos||[]).filter(e=>e.tipo==='aviso' && e.data<=hoje && (e.data_fim||e.data) >= addDays(hoje,-dias)).sort((a,b)=>b.data.localeCompare(a.data)); }
function avisosNaoLidos(){
  const d = S.sess?.dados; if(!d) return [];
  return avisosAtivos(d.calendario, hojeISO()).filter(a=>!lido('aviso', a.id, d.colaboradora.id, d.leituras));
}
async function marcarLido(tipo, ref, btn){
  if(btn){ btn.disabled = true; btn.innerHTML = '<span class="gira"></span>'; }
  const antes = progressoTrilha().feitos;
  try{
    const s = S.sess; s.dados = await api('ler', {eid:s.eid, ...s.cred, tipo, ref});
    const p = progressoTrilha();
    render();
    if(tipo==='trilha' && p.total && p.feitos===p.total && antes<p.total){ chuvaConfete(); toast('Trilha concluída! Você arrasou 🎉'); }
    else toast(tipo==='trilha' ? 'Passo concluído ✔' : 'Leitura registrada ✔');
  }catch(e){ toast(e.message, true); if(btn){ btn.disabled = false; btn.innerHTML = 'Tentar de novo'; } }
}
function cardAviso(e, d){
  const l = lido('aviso', e.id, d.colaboradora.id, d.leituras);
  return `<div class="item ${l?'':'novo'}"><b>📌 ${esc(e.titulo)}</b>${e.obs?`<div style="white-space:pre-line">${esc(e.obs)}</div>`:''}
    <div class="linha entre quebra" style="margin-top:8px"><span class="apagado" style="font-size:12px">${ddmm(e.data)}${e.loja&&S.boot.lojas[e.loja]?' · Loja '+esc(S.boot.lojas[e.loja].nome):''}</span>
    ${l?`<span class="selo ok"><i class="ti ti-checks"></i> Você leu ${quando(l.lido_em)}</span>`:`<button class="btn p ouro" onclick="marcarLido('aviso','${e.id}',this)"><i class="ti ti-check"></i> Li e entendi</button>`}</div></div>`;
}
function blocoAvisosPendentes(){
  const d = S.sess?.dados; if(!d) return '';
  const n = avisosNaoLidos(); if(!n.length) return '';
  return `<div class="pendente-aviso"><div class="linha" style="margin-bottom:8px"><i class="ti ti-speakerphone" style="font-size:22px;color:var(--dourado)"></i><b>${n.length>1?n.length+' avisos novos':'Aviso novo'} da administração</b></div><div class="mural">${n.map(e=>cardAviso(e,d)).join('')}</div></div>`;
}
function portalMural(){
  const d = S.sess.dados, hoje = hojeISO();
  const todos = avisosAtivos(d.calendario, hoje, 45);
  return `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-info-circle"></i><div>Avisos da administração. Toque em <b>Li e entendi</b> em cada um: fica registrado que você leu.</div></div>
    <div class="mural">${todos.map(e=>cardAviso(e,d)).join('') || '<p class="suave" style="text-align:center;padding:20px">Nenhum aviso por enquanto.</p>'}</div>`;
}

/* ──────────── protocolos (manual da loja) ──────────── */
async function carregarProtocolos(){
  try{ const s = S.sess; const j = await api('protocolos', {eid:s.eid, ...s.cred}); S.protos = j.protocolos; }
  catch(e){ S.protos = []; toast(e.message, true); }
  if(S.tela==='portal') render();
}
function listaProtocolos(){ return S.adm ? (S.adm.dados.protocolos||[]) : (S.protos||[]); }
function portalProtocolos(){
  if(!S.protos){ carregarProtocolos(); return '<div class="carregando"><span class="gira"></span> Abrindo os protocolos…</div>'; }
  if(S.protoAberto){ const p = S.protos.find(x=>x.id===S.protoAberto); if(p) return leituraProtocolo(p); S.protoAberto = null; }
  const d = S.sess.dados, eid = d.colaboradora.id;
  const lidos = S.protos.filter(p=>lido('protocolo', p.id, eid, d.leituras)).length;
  return `<div class="linha quebra" style="gap:12px;margin-bottom:14px">${anel(S.protos.length?lidos/S.protos.length*100:0, lidos+'/'+S.protos.length, 'lidos', 84)}
      <div class="cresce"><b style="font-size:17px">Protocolos da loja</b><p class="suave" style="font-size:14px">As regras escritas de como a Las Vegas funciona. Na dúvida, consulte aqui primeiro.</p></div></div>
    <input class="inp" id="proto-busca" placeholder="Buscar nos protocolos… (ex.: troca, sangria, provador)" value="${esc(S.protoBusca||'')}" oninput="S.protoBusca=this.value;desenharIndice()">
    <div id="proto-indice" style="margin-top:12px">${indiceProtocolos()}</div>`;
}
function indiceProtocolos(){
  const d = S.sess.dados, eid = d.colaboradora.id, q = semAcento(S.protoBusca||'').trim();
  let lista = S.protos;
  if(q) lista = lista.filter(p=>semAcento(p.titulo+' '+p.secao+' '+p.texto).includes(q));
  if(!lista.length) return `<p class="suave" style="text-align:center;padding:20px">${S.protos.length?'Nada encontrado com essa palavra.':'Os protocolos ainda não foram publicados pela administração.'}</p>`;
  const grupos = {}; lista.forEach(p=>{ (grupos[p.secao||'Geral'] = grupos[p.secao||'Geral'] || []).push(p); });
  return Object.entries(grupos).map(([g,ps])=>`<h2 class="secao">${esc(g)}</h2>${ps.map(p=>{ const l = lido('protocolo', p.id, eid, d.leituras);
    const trecho = q ? trechoCom(p.texto, q) : '';
    return `<button class="pedido proto" onclick="abrirProtocolo('${p.id}')"><div class="ico">${l?'<i class="ti ti-checks" style="color:var(--ok)"></i>':'<i class="ti ti-book"></i>'}</div><div class="cresce"><b>${esc(p.titulo)}</b><p>${trecho || (l?'Lido em '+quando(l.lido_em):'Ainda não lido')}</p></div><i class="ti ti-chevron-right apagado"></i></button>`; }).join('')}`).join('');
}
function trechoCom(texto, q){
  const t = String(texto||'').replace(/[#*]/g,''), i = semAcento(t).indexOf(q); if(i<0) return '';
  const ini = Math.max(0, i-50); return (ini?'…':'')+esc(t.slice(ini, i))+'<mark>'+esc(t.slice(i, i+q.length))+'</mark>'+esc(t.slice(i+q.length, i+q.length+70))+'…';
}
function desenharIndice(){ const el = $('#proto-indice'); if(el) el.innerHTML = indiceProtocolos(); }
function abrirProtocolo(id){
  if(S.adm){ admEditarProtocolo(id); return; }
  if(S.tela!=='portal'){ S.tela='portal'; }
  S.portalTab='protocolos'; S.protoAberto=id; render(); window.scrollTo(0,0);
}
function leituraProtocolo(p){
  const d = S.sess.dados, l = lido('protocolo', p.id, d.colaboradora.id, d.leituras);
  return `<div class="progresso-leitura"><i id="barra-leitura"></i></div>
    <button class="btn p" style="margin-bottom:12px" onclick="S.protoAberto=null;render()"><i class="ti ti-arrow-left"></i> Todos os protocolos</button>
    <article class="cartao pad leitura" id="leitura"><div class="apagado" style="font-size:13px;font-weight:700">${esc(p.secao||'')}</div><h3>${esc(p.titulo)}</h3>
      ${mdHTML(p.texto)}
      <div style="margin-top:22px;padding-top:16px;border-top:1px solid var(--linha)">${l?`<span class="selo ok"><i class="ti ti-checks"></i> Você leu e entendeu ${quando(l.lido_em)}</span>`:`<button class="btn ouro largo" onclick="marcarLido('protocolo','${p.id}',this)"><i class="ti ti-check"></i> Li e entendi este protocolo</button>`}
      <p class="apagado" style="font-size:12px;margin-top:8px">Atualizado ${quando(p.atualizado_em)}</p></div></article>`;
}
window.addEventListener('scroll', ()=>{
  const b = $('#barra-leitura'), a = $('#leitura'); if(!b || !a) return;
  const r = a.getBoundingClientRect(), total = r.height - innerHeight;
  b.style.width = (total<=0 ? 100 : Math.max(0, Math.min(100, -r.top/total*100))) + '%';
}, {passive:true});

/* ──────────── treinamento (trilha) ──────────── */
function progressoTrilha(eid, dados){
  const d = dados || S.sess?.dados; if(!d) return {feitos:0,total:0};
  const t = d.trilha||[], id = eid || d.colaboradora?.id;
  const feitos = t.filter(p=>lido('trilha', p.id, id, d.leituras)).length;
  return {feitos, total:t.length, pct: t.length ? Math.round(feitos/t.length*100) : 0};
}
function portalTreino(){
  const d = S.sess.dados, eid = d.colaboradora.id, t = d.trilha||[], p = progressoTrilha();
  const proxima = t.find(x=>!lido('trilha', x.id, eid, d.leituras));
  const temProto = id => (d.protocolosIdx||[]).some(x=>x.id===id);
  return `<div class="cartao pad linha quebra" style="gap:16px;margin-bottom:14px">${anel(p.pct, p.pct+'%', p.feitos+' de '+p.total, 104)}
      <div class="cresce"><b style="font-size:18px">${p.pct===100?'Trilha concluída 🎉':'Sua trilha na Las Vegas'}</b><p class="suave" style="font-size:14px">${p.pct===100?'Você completou todos os passos. Pode revisar quando quiser.':proxima?'Próximo passo: <b>'+esc(proxima.titulo)+'</b>':'A administração ainda não montou a trilha.'}</p></div></div>
    <ol class="trilha">${t.map((x,i)=>{ const l = lido('trilha', x.id, eid, d.leituras);
      return `<li class="${l?'feito':x===proxima?'atual':''}"><span class="marco">${l?'<i class="ti ti-check"></i>':i+1}</span><div class="cresce"><b>${esc(x.titulo)}</b>${x.texto?`<p>${esc(x.texto)}</p>`:''}
        <div class="linha quebra" style="gap:6px;margin-top:8px">
          ${x.protocolo&&temProto(x.protocolo)?`<button class="btn p" onclick="abrirProtocolo('${esc(x.protocolo)}')"><i class="ti ti-book"></i> Abrir protocolo</button>`:''}
          ${x.link?`<a class="btn p" href="${esc(x.link)}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Abrir</a>`:''}
          ${l?`<span class="selo ok">Concluído ${quando(l.lido_em)}</span>`:`<button class="btn p ${x===proxima?'ouro':''}" onclick="marcarLido('trilha','${x.id}',this)"><i class="ti ti-check"></i> Concluí</button>`}
        </div></div></li>`; }).join('')}</ol>`;
}

/* ──────────── atalhos com logo ──────────── */
function tileAtalho(a, grande){
  const ico = favicon(a.url);
  return `<a class="atalho ${grande?'grande':''}" href="${esc(a.url)}" target="_blank" rel="noopener">${ico?`<img src="${esc(ico)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'ti ti-link'}))">`:'<i class="ti ti-link"></i>'}<span class="cresce"><b>${esc(a.nome)}</b>${a.obs?`<small>${esc(a.obs)}</small>`:''}</span></a>`;
}
function gradeAtalhos(grupos){
  const destaques = grupos.flatMap(g=>g.itens||[]).filter(a=>a.destaque);
  return `${destaques.length?`<div class="atalhos-grandes">${destaques.map(a=>tileAtalho(a,true)).join('')}</div>`:''}
    ${grupos.map(g=>`<h2 class="secao">${esc(g.grupo)}${g.so_admin?' <small>só a administração vê</small>':''}</h2><div class="grade-atalhos">${(g.itens||[]).map(a=>tileAtalho(a)).join('')}</div>`).join('')}`;
}
function portalAtalhos(){
  const g = S.sess.dados.atalhos||[];
  return g.length ? gradeAtalhos(g) : '<p class="suave" style="text-align:center;padding:20px">Nenhum atalho cadastrado ainda.</p>';
}

/* ──────────── anel de hoje (tempo trabalhado × jornada) ──────────── */
function minutosHoje(r){
  if(!r || !r.entrada) return 0;
  const agora = agoraServidor(), now = agora.getHours()*60 + agora.getMinutes();
  const fim = r.saida ? toM(r.saida) : now;
  let t = fim - toM(r.entrada);
  if(r.saida_almoco) t -= (r.volta_almoco ? toM(r.volta_almoco) : (r.saida?toM(r.saida_almoco):now)) - toM(r.saida_almoco);
  if(r.inicio_pausa) t -= (r.fim_pausa ? toM(r.fim_pausa) : (r.saida?toM(r.inicio_pausa):now)) - toM(r.inicio_pausa);
  return Math.max(0, t);
}

/* ──────────── busca rápida (Ctrl K) ──────────── */
let BUSCA = null;
function itensBusca(){
  const r = [];
  if(S.adm){
    [['aovivo','Painel ao vivo','ti-broadcast'],['pedidos','Pedidos','ti-inbox'],['hoje','Hoje','ti-clock'],['produtividade','Produtividade','ti-chart-bar'],['metas','Metas e vendas','ti-trophy'],['caixa','Caixa e sangrias','ti-cash-banknote'],['checklist','Checklist','ti-checklist'],['escala','Escala','ti-calendar-time'],['mural','Mural de avisos','ti-speakerphone'],['protocolos','Protocolos','ti-book'],['treino','Treinamento','ti-school'],['atalhos','Atalhos','ti-apps'],['mes','Espelho de ponto','ti-calendar'],['banco','Banco de horas','ti-pig-money'],['agenda','Agenda','ti-calendar-event'],['equipe','Equipe','ti-users'],['aparelhos','Aparelhos','ti-device-desktop'],['regras','Regras','ti-settings']]
      .forEach(([k,n,i])=>r.push({t:n, s:'Tela da administração', i, go:()=>{ S.adm.tab=k; render(); }}));
    S.adm.dados.colaboradoras.forEach(c=>r.push({t:c.nome, s:(c.cargo||'Equipe')+(c.telefone?' · '+fmtTel(c.telefone):''), i:'ti-user', go:()=>{ S.adm.tab='equipe'; render(); editarColab(c.id); }}));
    r.push({t:'Lançar venda', s:'Metas', i:'ti-trending-up', go:()=>{ S.adm.tab='metas'; render(); admAbrirVenda(); }});
    r.push({t:'Novo aviso no mural', s:'Mural', i:'ti-speakerphone', go:()=>{ S.adm.tab='mural'; render(); novoAviso(); }});
  } else if(S.sess){
    [['Lançar venda do dia','ti-trending-up',()=>abrirVenda()],['Registrar sangria','ti-cash-banknote',()=>abrirSangria()],['Pedir folga','ti-beach',()=>novoPedido({tipo:'folga'})],['Enviar atestado','ti-file-certificate',()=>novoPedido({tipo:'atestado'})],['Corrigir horário do ponto','ti-clock-edit',()=>novoPedido({tipo:'correcao'})]]
      .forEach(([t,i,go])=>r.push({t, s:'Ação rápida', i, go}));
    [['inicio','Início','ti-home'],['mes','Meu mês','ti-calendar-stats'],['metas','Metas','ti-trophy'],['checklist','Checklist do dia','ti-checklist'],['escala','Minha escala','ti-calendar-time'],['mural','Mural de avisos','ti-speakerphone'],['protocolos','Protocolos da loja','ti-book'],['treino','Treinamento','ti-school'],['atalhos','Atalhos','ti-apps'],['agenda','Agenda','ti-calendar-event'],['pedidos','Meus pedidos','ti-send'],['eu','Meu perfil','ti-user-circle']]
      .forEach(([k,n,i])=>r.push({t:n, s:'Tela do portal', i, go:()=>{ S.tela='portal'; S.portalTab=k; S.protoAberto=null; render(); }}));
    avisosAtivos(S.sess.dados.calendario, hojeISO(), 45).forEach(e=>r.push({t:e.titulo, s:'Aviso · '+ddmm(e.data), txt:e.obs, i:'ti-speakerphone', go:()=>{ S.tela='portal'; S.portalTab='mural'; render(); }}));
  }
  listaProtocolos().forEach(p=>r.push({t:p.titulo, s:'Protocolo · '+(p.secao||''), txt:p.texto, i:'ti-book', go:()=>abrirProtocolo(p.id)}));
  ((S.adm ? S.adm.dados.atalhos : S.sess?.dados?.atalhos)||[]).forEach(g=>(g.itens||[]).forEach(a=>r.push({t:a.nome, s:'Atalho · '+(a.obs||g.grupo), i:'ti-external-link', url:a.url})));
  return r;
}
function abrirBusca(){
  if(!S.adm && !S.sess) return;
  if(S.sess && !S.protos && !S.adm) carregarProtocolos().then(()=>{ if(BUSCA) filtrarBusca(); });
  BUSCA = {sel:0, res:[]};
  $('#modal').innerHTML = `<div class="veu topo" onclick="if(event.target===this)fecharBusca()"><div class="modal busca">
    <div class="linha" style="padding:12px 14px;border-bottom:1px solid var(--linha)"><i class="ti ti-search" style="font-size:20px;color:var(--dourado)"></i>
      <input class="cresce" id="busca-q" placeholder="Buscar telas, protocolos, atalhos${S.adm?', pessoas':''}…" autocomplete="off" oninput="filtrarBusca()" onkeydown="teclaBusca(event)"><kbd>Esc</kbd></div>
    <div id="busca-res" class="busca-res"></div></div></div>`;
  filtrarBusca(); setTimeout(()=>$('#busca-q')?.focus(), 30);
}
function fecharBusca(){ BUSCA=null; $('#modal').innerHTML=''; }
function filtrarBusca(){
  if(!BUSCA) return;
  const q = semAcento($('#busca-q')?.value||'').trim(), todos = itensBusca();
  BUSCA.res = (q ? todos.map(x=>{ const t = semAcento(x.t), s = semAcento(x.s+' '+(x.txt||''));
      const pts = t.startsWith(q)?3 : t.includes(q)?2 : s.includes(q)?1 : 0; return {...x, pts, trecho: pts===1 && x.txt ? trechoCom(x.txt, q) : ''}; }).filter(x=>x.pts).sort((a,b)=>b.pts-a.pts)
    : todos.filter(x=>/Ação rápida|Tela/.test(x.s))).slice(0, 12);
  BUSCA.sel = Math.min(BUSCA.sel, Math.max(0, BUSCA.res.length-1));
  $('#busca-res').innerHTML = BUSCA.res.map((x,i)=>`<button class="${i===BUSCA.sel?'on':''}" onmouseenter="BUSCA.sel=${i};marcarBusca()" onclick="irBusca(${i})"><i class="ti ${x.i}"></i><span class="cresce"><b>${esc(x.t)}</b><small>${x.trecho||esc(x.s)}</small></span>${x.url?'<i class="ti ti-arrow-up-right apagado"></i>':''}</button>`).join('') || '<p class="suave" style="padding:18px;text-align:center">Nada encontrado.</p>';
}
function marcarBusca(){ document.querySelectorAll('#busca-res button').forEach((b,i)=>b.classList.toggle('on', i===BUSCA.sel)); }
function teclaBusca(ev){
  if(!BUSCA) return;
  if(ev.key==='ArrowDown'){ BUSCA.sel = Math.min(BUSCA.res.length-1, BUSCA.sel+1); marcarBusca(); ev.preventDefault(); }
  else if(ev.key==='ArrowUp'){ BUSCA.sel = Math.max(0, BUSCA.sel-1); marcarBusca(); ev.preventDefault(); }
  else if(ev.key==='Enter'){ irBusca(BUSCA.sel); ev.preventDefault(); }
  else if(ev.key==='Escape') fecharBusca();
}
function irBusca(i){
  const x = BUSCA?.res[i]; if(!x) return;
  fecharBusca();
  if(x.url) window.open(x.url, '_blank', 'noopener'); else x.go();
}
document.addEventListener('keydown', ev=>{
  const digitando = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');
  if((ev.key==='k' || ev.key==='K') && (ev.ctrlKey || ev.metaKey)){ ev.preventDefault(); BUSCA ? fecharBusca() : abrirBusca(); }
  else if(ev.key==='/' && !digitando && !modalAberto() && (S.adm || S.sess) && S.tela!=='bater'){ ev.preventDefault(); abrirBusca(); }
});
const btnBusca = () => `<button class="icone" title="Buscar (Ctrl K)" onclick="abrirBusca()"><i class="ti ti-search"></i></button>`;
