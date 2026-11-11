/* ═══════════ Portal Equipe Las Vegas · v44 — PEDIDOS DO SITE PARA A EQUIPE ═══════════
   Pedido da Madu (04/11): "teve o primeiro pedido no site… onde aparece para as vendedoras?"
   • A baixa do estoque já é automática (NUVEMSHOP.gs). Aqui a equipe SEPARA e ENVIA:
     A separar → Separado → Enviado → Entregue (retirada: Separado → Cliente retirou), com quem fez.
   • Sai sempre da Loja Bosque (depósito): bolinha no menu e cartão no Início para quem está no Bosque.
   • Portal › Vendas › Pedidos do site · Administração › Vendas › Pedidos do site (vê telefone e volta etapa).
   • Discrição: a equipe não vê o telefone da cliente; o aviso no WhatsApp não mostra produto.
   Servidor: SITE.gs (a = pedidosSite · admPedidosSite · sitePendentes). */
const SITE44 = { d:null, carregando:false, filtro:'separar', erro:'', marcados:{}, abertos:{}, ultimoN:null, t:0 };
const SITE44_PASSOS = [['', 'Recebido', 'ti-shopping-bag'], ['separado', 'Separado', 'ti-checks'], ['enviado', 'Enviado', 'ti-truck-delivery'], ['entregue', 'Entregue', 'ti-circle-check']];

function site44Adm(){ return S.tela==='admin' && !!S.adm; }
function site44LojaHoje(){
  try{ const d = S.sess?.dados; return S.aparelho?.loja || (d?.pontos||[]).find(p=>p.data===hojeISO())?.loja || d?.colaboradora?.loja || ''; }catch(e){ return ''; }
}
function site44Pend(){
  if(SITE44.d && !site44Adm()) return SITE44.d.contagem?.separar || 0;
  return Number(S.sess?.dados?.site_pendentes) || 0;
}
function site44Meu(){ return site44Adm() || site44LojaHoje()==='bosque' || site44LojaHoje()==='deposito'; }
async function site44Carregar(silencioso){
  if(SITE44.carregando) return; SITE44.carregando = true;
  try{
    const r = site44Adm() ? await api('admPedidosSite', {...S.adm.cred}) : await api('pedidosSite', {eid:S.sess.eid, ...S.sess.cred});
    site44Novo(r); SITE44.d = r; SITE44.erro = ''; SITE44.t = Date.now();
  }catch(e){ SITE44.erro = /desconhecida/i.test(e.message) ? 'servidor' : e.message; }
  SITE44.carregando = false;
  if(!silencioso || site44Aqui()) render();
}
function site44Aqui(){ return (S.tela==='portal' && S.portalTab==='site') || (site44Adm() && S.adm.tab==='site'); }
function site44Novo(r){
  const n = r?.contagem?.separar || 0;
  if(SITE44.ultimoN != null && n > SITE44.ultimoN && site44Meu()) toast('🛍️ Pedido novo do site para separar!');
  SITE44.ultimoN = n;
}
async function site44Etapa(id, etapa){
  const p = (SITE44.d?.pedidos||[]).find(x=>x.id===id); if(!p) return;
  const dados = {op:'etapa', id, etapa};
  if(etapa==='enviado'){ const el = document.getElementById('s44-rast-'+id); if(el && el.value.trim()) dados.rastreio = el.value.trim(); }
  const b = document.querySelector(`[data-s44="${id}"]`); if(b){ b.disabled = true; b.classList.add('ind'); }
  try{
    const r = site44Adm() ? await api('admPedidosSite', {...S.adm.cred, ...dados}) : await api('pedidosSite', {eid:S.sess.eid, ...S.sess.cred, ...dados});
    SITE44.d = r; SITE44.ultimoN = r.contagem?.separar || 0;
    if(S.sess?.dados) S.sess.dados.site_pendentes = r.contagem?.separar || 0;
    const volta = SITE44_PASSOS.findIndex(s=>s[0]===etapa) < SITE44_PASSOS.findIndex(s=>s[0]===p.etapa);
    if(volta) toast('↩️ Pedido #'+p.numero+' voltou para '+(SITE44_PASSOS.find(s=>s[0]===etapa)||[])[1]); else toast({separado:'📦 Pedido #'+p.numero+' separado ✔', enviado:'🚚 Pedido #'+p.numero+' enviado ✔', entregue:'✅ Pedido #'+p.numero+' entregue ✔', '':'Pedido #'+p.numero+' voltou para A separar'}[etapa]);
    if(!volta && etapa==='separado' && !site44Adm()) site44Festa();
    render();
  }catch(e){ toast(e.message, true); if(b){ b.disabled = false; b.classList.remove('ind'); } }
}
function site44Festa(){
  const w = document.createElement('div'); w.className = 's44-festa';
  w.innerHTML = '📦'.repeat(1) + '<span>Separado!</span>';
  document.body.appendChild(w); setTimeout(()=>w.remove(), 1400);
}
function site44Marcar(id, i){
  const k = id+'|'+i; SITE44.marcados[k] = !SITE44.marcados[k]; render();
}
function site44Quando(s){ s = String(s||''); return s ? `${s.slice(8,10)}/${s.slice(5,7)} ${s.slice(11,16)}` : ''; }
function site44Pago(p){ return /^(paid|authorized)$/.test(p.pagamento_status); }
function site44Retirada(p){ return /^Retirada/.test(p.envio_tipo||''); }

function site44Cartao(p){
  const adm = site44Adm(), ret = site44Retirada(p), i0 = SITE44_PASSOS.findIndex(s=>s[0]===p.etapa);
  const passos = (ret ? SITE44_PASSOS.filter(s=>s[0]!=='enviado') : SITE44_PASSOS).map(([k, n, ic])=>{
    const idx = SITE44_PASSOS.findIndex(s=>s[0]===k), prox = ret && i0===1 ? 3 : i0+1, feito = idx <= i0, agora = idx===prox && !['cancelado','aguardando'].includes(p.situacao);
    const quem = k==='separado' ? p.separado_por : k==='enviado' ? p.enviado_por : k==='entregue' ? p.entregue_por : '';
    const em = k==='separado' ? p.separado_em : k==='enviado' ? p.enviado_em : k==='entregue' ? p.entregue_em : p.criada_em;
    return `<div class="s44-passo ${feito?'feito':''} ${agora?'agora':''}"><span class="b"><i class="ti ${feito?'ti-check':ic}"></i></span><b>${k==='entregue'&&ret?'Retirou':n}</b><small>${feito && em ? esc(site44Quando(em)) : ''}${quem&&feito?'<br>'+esc(quem):''}</small></div>`;
  }).join('<span class="s44-linha"></span>');
  const cancel = p.situacao==='cancelado', conc = p.situacao==='concluido', esperando = p.situacao==='aguardando';
  const marc = p.itens.map((_, i)=>!!SITE44.marcados[p.id+'|'+i]), todos = marc.every(Boolean), nMarc = marc.filter(Boolean).length;
  const itens = p.itens.map((it, i)=>{
    const on = marc[i], pode = !p.etapa && !cancel && !esperando;
    return `<div class="s44-it ${on?'on':''} ${pode?'toca':''}" ${pode?`onclick="site44Marcar('${p.id}',${i})"`:''}>
      ${pode?`<span class="s44-ck"><i class="ti ti-check"></i></span>`:''}
      ${typeof pIco==='function' ? pIco({id:it.produto_id, foto:it.foto, nome:it.nome}, 52) : ''}
      <div class="t"><b>${esc(it.nome)}</b><small>${it.codigo?'cód. '+esc(it.codigo):''}${it.nome_site && it.nome_site!==it.nome?` · no site: ${esc(it.nome_site)}`:''}</small></div>
      <span class="s44-q">${it.qtd}×</span></div>`;
  }).join('');
  const e = p.endereco||{}, temEnd = !ret && (e.rua || e.bairro);
  const end = temEnd ? `${esc(e.rua)}${e.numero?', '+esc(e.numero):''}${e.compl?' · '+esc(e.compl):''}<br>${esc(e.bairro)}${e.cidade?' · '+esc(e.cidade):''}${e.uf?'/'+esc(e.uf):''}${e.cep?' · CEP '+esc(e.cep):''}${e.nome && e.nome!==p.cliente?`<br>Recebe: ${esc(e.nome)}`:''}` : '';
  let acao = '';
  if(cancel) acao = `<div class="s44-aviso ruim"><i class="ti ti-ban"></i> Pedido cancelado — não separe. O estoque já voltou sozinho.</div>`;
  else if(esperando) acao = `<div class="s44-aviso"><i class="ti ti-hourglass"></i> Esperando o pagamento. <b>Não separe ainda</b> — quando pagar, ele vai para "A separar".</div>`;
  else if(!p.etapa) acao = `<button class="s44-btn" data-s44="${p.id}" ${todos||adm?'':'disabled'} onclick="site44Etapa('${p.id}','separado')"><i class="ti ti-checks"></i> ${todos||adm?'Separei tudo':`Toque nos itens que já pegou (${nMarc}/${p.itens.length})`}</button>`;
  else if(p.etapa==='separado' && ret) acao = `<button class="s44-btn verde" data-s44="${p.id}" onclick="site44Etapa('${p.id}','entregue')"><i class="ti ti-hand-finger"></i> Cliente retirou</button>`;
  else if(p.etapa==='separado') acao = `<div class="s44-env"><input class="inp" id="s44-rast-${p.id}" placeholder="Código de rastreio (se tiver)" maxlength="40"><button class="s44-btn" data-s44="${p.id}" onclick="site44Etapa('${p.id}','enviado')"><i class="ti ti-truck-delivery"></i> Enviei</button></div>`;
  else if(p.etapa==='enviado') acao = `<button class="s44-btn verde" data-s44="${p.id}" onclick="site44Etapa('${p.id}','entregue')"><i class="ti ti-circle-check"></i> Chegou na cliente</button>`;
  const voltar = adm && p.etapa && !cancel ? `<button class="btn" onclick="site44Etapa('${p.id}','${SITE44_PASSOS[Math.max(0,i0-1)][0]}')"><i class="ti ti-arrow-back-up"></i> Voltar etapa</button>` : '';
  const nsId = String(p.id).replace(/^NS/,'');
  return `<article class="s44-card s-${p.situacao}">
    <header><div><span class="s44-num">#${esc(p.numero)}</span><small>${esc(site44Quando(p.criada_em))}</small></div>
      <div class="s44-cli"><b>${esc(p.cliente||'Cliente')}</b>${adm && p.cliente_tel?`<small><i class="ti ti-phone"></i> ${esc(p.cliente_tel)}</small>`:''}</div>
      <div class="s44-tot"><b>${brl2(p.total)}</b><small>${p.qtd_itens} ${p.qtd_itens===1?'peça':'peças'}${p.pagamento?' · '+esc(p.pagamento):''}</small></div></header>
    <div class="s44-passos">${passos}</div>
    <div class="s44-envio"><span><i class="ti ${ret?'ti-building-store':'ti-truck'}"></i> ${esc(p.envio_tipo||'Envio')}</span>${p.frete?`<span>frete ${brl2(p.frete)}</span>`:''}${p.rastreio?`<span><i class="ti ti-barcode"></i> ${esc(p.rastreio)}</span>`:''}</div>
    ${p.nota?`<div class="s44-nota"><i class="ti ti-message-2"></i> <b>Recado da cliente:</b> ${esc(p.nota)}</div>`:''}
    <div class="s44-itens">${itens}</div>
    ${p.obs?`<div class="s44-aviso"><i class="ti ti-alert-triangle"></i> ${esc(p.obs)} — confira esse item no depósito.</div>`:''}
    ${temEnd?`<details class="s44-end"><summary><i class="ti ti-map-pin"></i> Endereço de entrega</summary><p>${end}</p></details>`:''}
    <div class="s44-acoes">${acao}${voltar}${adm?`<a class="btn" href="https://www.lasvegassexshop.com.br/admin/orders/${esc(nsId)}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Na Nuvemshop</a>`:''}</div>
  </article>`;
}

function site44Tela(){
  const adm = site44Adm();
  if(!SITE44.d && !SITE44.erro){ if(!SITE44.carregando) site44Carregar(true); return `<div class="s44"><div class="s44-vazio"><span class="giro">🛍️</span><p>Buscando os pedidos do site…</p></div></div>`; }
  if(SITE44.erro==='servidor') return `<div class="nota warn"><i class="ti ti-server"></i><div><b>Falta publicar o servidor.</b> ${adm?'No Apps Script: Arquivos › + › Script › nome <b>SITE</b>, cole o código de <code>ponto/servidor/SITE.gs</code> e publique uma Nova versão.':'Peça para a administração publicar a atualização do servidor (SITE).'}</div></div>`;
  if(SITE44.erro && !SITE44.d) return `<div class="nota bad"><i class="ti ti-wifi-off"></i><div>${esc(SITE44.erro)} <button class="btn" onclick="SITE44.erro='';site44Carregar()">Tentar de novo</button></div></div>`;
  const d = SITE44.d, c = d.contagem||{}, todos = d.pedidos||[];
  const filtros = [['separar','Para separar','ti-package',c.separar], ['separado','Separados','ti-checks',c.separado], ['enviado','Enviados','ti-truck-delivery',c.enviado], ['aguardando','Esperando pagamento','ti-hourglass',c.aguardando], ['concluido','Concluídos','ti-circle-check',0], ['todos','Todos','ti-list',0]];
  const f = SITE44.filtro, lista = todos.filter(p => f==='todos' ? true : f==='concluido' ? (p.situacao==='concluido'||p.situacao==='cancelado') : p.situacao===f);
  const vazio = {separar:['🎉','Nenhum pedido para separar agora.','Quando chegar pedido novo no site, ele aparece aqui sozinho.'], separado:['📦','Nenhum pedido esperando envio.',''], enviado:['🚚','Nenhum pedido a caminho.',''], aguardando:['⏳','Nenhum pedido esperando pagamento.',''], concluido:['✅','Nada concluído nos últimos 7 dias.',''], todos:['🛍️','Nenhum pedido do site ainda.','']}[f];
  return `<div class="s44">
    <div class="s44-topo">
      <div><span class="s44-tag"><i class="ti ti-world"></i> lasvegassexshop.com.br</span><h2>Pedidos do <mark>site</mark></h2>
        <p>Saem sempre da <b>Loja Bosque · Depósito</b>. A baixa no estoque já foi feita sozinha — aqui é só <b>separar, embalar e enviar</b>.${!adm && !site44Meu()?' <i>(Você está no Centro hoje — quem separa é a equipe do Bosque.)</i>':''}</p></div>
      <button class="btn" onclick="site44Carregar()"><i class="ti ti-refresh ${SITE44.carregando?'giro':''}"></i> Atualizar</button>
    </div>
    <div class="s44-filtros">${filtros.map(([k,n,ic,q])=>`<button class="${f===k?'on':''} ${k==='separar'&&q?'pulsa':''}" onclick="SITE44.filtro='${k}';render()"><i class="ti ${ic}"></i> ${n}${q?`<span class="contador">${q}</span>`:''}</button>`).join('')}</div>
    ${lista.length ? `<div class="s44-lista">${lista.map(site44Cartao).join('')}</div>` : `<div class="s44-vazio"><span>${vazio[0]}</span><p><b>${vazio[1]}</b><br>${vazio[2]}</p></div>`}
    <p class="apagado s44-rod"><i class="ti ti-lock"></i> Discrição: o telefone da cliente fica só com a administração e nenhum aviso mostra o que ela comprou.${SITE44.t?` · atualizado ${new Date(SITE44.t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:''}</p>
  </div>`;
}

/* cartão no Início de quem está no Bosque */
function site44CartaoInicio(){
  const n = site44Pend(); if(!n || !site44Meu()) return '';
  return `<button class="s44-ini" onclick="S.portalTab='site';SITE44.filtro='separar';render()"><span class="ic">🛍️</span><span class="t"><b>${n} ${n===1?'pedido do site':'pedidos do site'} para separar</b><small>Sai da Loja Bosque · toque para ver</small></span><i class="ti ti-chevron-right"></i></button>`;
}

/* ───────── encaixe no portal da equipe (Vendas › Pedidos do site) ───────── */
function site44Grupos(){
  try{
    if(typeof GRUPOS_PORTAL!=='undefined'){ const g = GRUPOS_PORTAL.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('site')){ const i = g.k.indexOf('whats'); g.k.splice((i>=0?i:g.k.indexOf('pdv'))+1, 0, 'site'); } NOMES12.portal.site = 'Pedidos do site'; }
    if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='vendas'); if(a && !a.k.includes('site')) a.k.splice(a.k.indexOf('pdv')+1, 0, 'site'); NOMES34.site = 'Pedidos do site'; }
    if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('site')) g.k.splice(g.k.indexOf('pdv')+1, 0, 'site'); if(typeof NOMES12!=='undefined') NOMES12.admin.site = 'Pedidos do site'; }
  }catch(e){}
}
const _telaPortalV44 = telaPortal;
telaPortal = function telaPortal(){
  site44Grupos(); site44PatchMais();
  const aqui = S.portalTab === 'site', marca = '<!--s44-conteudo-->';
  let h;
  if(aqui){
    const orig = portalAtalhos; S.portalTab = 'atalhos'; portalAtalhos = () => marca;
    try{ h = _telaPortalV44.apply(this, arguments); } finally { portalAtalhos = orig; S.portalTab = 'site'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + site44Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" style="flex:0 0 auto" onclick="S.portalTab='atalhos'`, `class="aba " style="flex:0 0 auto" onclick="S.portalTab='atalhos'`);
  } else h = _telaPortalV44.apply(this, arguments);
  const n = site44Meu() ? site44Pend() : 0;
  const btn = `<button class="aba ${aqui?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='site';S.protoAberto=null;render()"><i class="ti ti-world"></i> Pedidos do site ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const a = h.indexOf(`onclick="S.portalTab='arena'`);
  if(a > 0){ const ini = h.lastIndexOf('<button', a); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _portalInicioV44 = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioV44.apply(this, arguments), c = site44CartaoInicio();
  if(!c) return h;
  const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
  return f >= 0 ? h.slice(0, f+6) + c + h.slice(f+6) : c + h;
};
function site44PatchMais(){
  if(window._s44Mais) return; window._s44Mais = true;
  const base = portalMais;
  portalMais = function portalMais(){
    const g = typeof GRUPOS_PORTAL!=='undefined' ? GRUPOS_PORTAL.find(x=>x.k.includes('site')) : null, i = g ? g.k.indexOf('site') : -1;
    if(i >= 0) g.k.splice(i, 1);
    let h; try{ h = base.apply(this, arguments); } finally { if(i >= 0) g.k.splice(i, 0, 'site'); }
    const n = site44Meu() ? site44Pend() : 0;
    const tile = `<button class="tile" style="--cor:var(--g-vendas)" onclick="S.portalTab='site';render()"><i class="ti ti-world"></i><b>Pedidos do site</b><small>${n?n+' para separar':'Separar e enviar'}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
    const a = h.indexOf('<div class="tiles">');
    return a >= 0 ? h.slice(0, a+19) + tile + h.slice(a+19) : tile + h;
  };
}

/* ───────── encaixe na Administração (Vendas › Pedidos do site) ───────── */
site44Grupos();
const _telaAdminV44 = telaAdmin;
telaAdmin = function telaAdmin(){
  site44Grupos();
  const A = S.adm, aqui = A.tab === 'site', marca = '<!--s44-adm-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV44.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'site'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + site44Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV44.apply(this, arguments);
  const n = SITE44.d?.contagem?.separar || 0;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='site';TR=null;render()"><i class="ti ti-world"></i> Pedidos do site ${n?`<span class="contador">${n}</span>`:''}</button>`;
  h = h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
  return h;
};
const _itensBuscaV44 = typeof itensBusca==='function' ? itensBusca : null;
if(_itensBuscaV44) itensBusca = function itensBusca(){
  const r = _itensBuscaV44.apply(this, arguments), adm = site44Adm();
  if(adm || S.sess) r.unshift({t:'Pedidos do site', s:'Separar, enviar e entregar os pedidos da Nuvemshop', i:'ti-world', go:()=>{ if(adm) S.adm.tab='site'; else { S.tela='portal'; S.portalTab='site'; } render(); }});
  return r;
};
/* atualiza sozinho: na tela a cada 45 s; fora dela a cada 2 min (para a bolinha e o aviso de pedido novo) */
setInterval(()=>{
  if(document.visibilityState!=='visible') return;
  const logado = (S.tela==='portal' && S.sess) || site44Adm();
  if(!logado) return;
  const idade = Date.now() - (SITE44.t||0);
  if(site44Aqui() ? idade > 40e3 : idade > 115e3) site44Carregar(true);
}, 15e3);
/* trocou de pessoa/perfil: começa do zero */
let _s44Quem = '';
setInterval(()=>{ const q = site44Adm() ? 'adm' : (S.sess?.eid||''); if(q!==_s44Quem){ _s44Quem = q; SITE44.d = null; SITE44.ultimoN = null; SITE44.t = 0; SITE44.marcados = {}; } }, 2e3);

document.head.insertAdjacentHTML('beforeend', `<style>
.s44-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 12px}
.s44-topo h2{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:6px 0 4px}.s44-topo h2 mark{background:linear-gradient(transparent 55%,rgba(227,16,31,.25) 55%);color:inherit;padding:0 2px}
.s44-topo p{color:var(--creme2);font-size:14px;max-width:680px;margin:0}
.s44-tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:800;letter-spacing:.04em;color:#E3101F;background:rgba(227,16,31,.08);border-radius:99px;padding:3px 10px}
.s44-filtros{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;margin-bottom:6px;scrollbar-width:none}
.s44-filtros button{flex:none;display:flex;align-items:center;gap:6px;border:1px solid var(--linha);background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;color:var(--creme2);transition:transform .15s var(--mola,ease),background .2s,color .2s}
.s44-filtros button:hover{transform:translateY(-1px)}.s44-filtros button:active{transform:scale(.95)}
.s44-filtros button.on{background:#15100D;color:#fff;border-color:#15100D}
.s44-filtros button.pulsa:not(.on){animation:s44Pulsa 1.8s ease-in-out infinite}
.s44-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,460px),1fr));gap:12px}
.s44-card{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:14px 16px;box-shadow:var(--sh);animation:s44Sobe .4s both;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden}
.s44-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:#E3101F}
.s44-card.s-separado::before{background:#F5B524}.s44-card.s-enviado::before{background:#3B82F6}.s44-card.s-concluido::before{background:#1a7f4b}.s44-card.s-aguardando::before,.s44-card.s-cancelado::before{background:#bbb}
.s44-card.s-cancelado{opacity:.7}
.s44-card header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.s44-num{display:block;font-size:22px;font-weight:900;letter-spacing:-.02em}.s44-card header small{display:block;font-size:12px;color:var(--creme3)}
.s44-cli{flex:1;min-width:120px}.s44-cli b{display:block;font-size:15px}
.s44-tot{text-align:right}.s44-tot b{display:block;font-size:16px}
.s44-passos{display:flex;align-items:flex-start;gap:4px;padding:4px 0}
.s44-passo{display:flex;flex-direction:column;align-items:center;text-align:center;flex:0 0 auto;width:74px}
.s44-passo .b{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--noite,#f3f0f1);color:var(--creme3);font-size:17px;transition:all .3s}
.s44-passo b{font-size:11.5px;margin-top:4px;color:var(--creme3)}.s44-passo small{font-size:10.5px;color:var(--creme3);line-height:1.2}
.s44-passo.feito .b{background:#1a7f4b;color:#fff}.s44-passo.feito b{color:#1a7f4b}
.s44-passo.agora .b{background:#E3101F;color:#fff;box-shadow:0 0 0 0 rgba(227,16,31,.5);animation:s44Anel 1.8s infinite}.s44-passo.agora b{color:#E3101F}
.s44-linha{flex:1;height:3px;border-radius:3px;background:var(--linha);margin-top:15px;min-width:10px}
.s44-envio{display:flex;gap:8px;flex-wrap:wrap}.s44-envio span{display:inline-flex;align-items:center;gap:5px;background:var(--noite,#f6f3f4);border-radius:99px;padding:4px 11px;font-size:12.5px;font-weight:700}
.s44-nota{background:#FFF4D6;border:1px solid #F5B524;border-radius:14px;padding:8px 12px;font-size:13.5px}
.s44-itens{display:flex;flex-direction:column;gap:6px}
.s44-it{display:flex;gap:10px;align-items:center;background:var(--noite,#f6f3f4);border-radius:14px;padding:8px 10px;border:2px solid transparent;transition:all .2s var(--mola,ease)}
.s44-it.toca{cursor:pointer}.s44-it.toca:active{transform:scale(.98)}
.s44-it.on{border-color:#1a7f4b;background:rgba(26,127,75,.08)}
.s44-ck{width:26px;height:26px;border-radius:8px;border:2px solid var(--linha2,#ccc);display:grid;place-items:center;flex:none;color:transparent;background:#fff;transition:all .2s var(--mola,ease)}
.s44-it.on .s44-ck{background:#1a7f4b;border-color:#1a7f4b;color:#fff;transform:scale(1.08)}
.s44-it .pf,.s44-it .pf-emo{border-radius:12px;flex:none;background:#fff;object-fit:contain}
.s44-it .t{flex:1;min-width:0}.s44-it .t b{display:block;font-size:14px;line-height:1.25}.s44-it .t small{color:var(--creme3);font-size:12px}
.s44-q{font-size:20px;font-weight:900;color:#E3101F;flex:none;min-width:40px;text-align:right}
.s44-aviso{display:flex;gap:8px;align-items:center;background:var(--warn-bg,#fff7e6);color:var(--warn,#8a5a00);border-radius:14px;padding:9px 12px;font-size:13.5px}
.s44-aviso.ruim{background:var(--bad-bg,#fdecec);color:var(--bad,#b3261e)}
.s44-end summary{cursor:pointer;font-weight:700;font-size:13.5px;color:var(--creme2)}.s44-end p{margin:6px 0 0;font-size:13.5px;line-height:1.45}
.s44-acoes{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.s44-btn{flex:1;min-width:200px;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:16px;padding:13px 16px;font:inherit;font-weight:900;font-size:15px;background:#E3101F;color:#fff;cursor:pointer;box-shadow:0 6px 16px rgba(227,16,31,.28);transition:transform .15s var(--mola,ease),opacity .2s,box-shadow .2s}
.s44-btn:hover:not(:disabled){transform:translateY(-2px)}.s44-btn:active:not(:disabled){transform:scale(.96)}
.s44-btn:disabled{background:#d9d4d6;box-shadow:none;cursor:default;font-weight:700;font-size:13.5px}
.s44-btn.verde{background:#1a7f4b;box-shadow:0 6px 16px rgba(26,127,75,.28)}
.s44-btn.ind{opacity:.6}
.s44-env{display:flex;gap:8px;flex:1;flex-wrap:wrap}.s44-env .inp{flex:1;min-width:160px}
.s44-vazio{text-align:center;padding:40px 16px;color:var(--creme2)}.s44-vazio span{font-size:46px;display:inline-block;animation:s44Balanca 2.6s ease-in-out infinite}
.s44-rod{font-size:12.5px;margin-top:14px}
.s44-ini{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:0;font:inherit;cursor:pointer;background:linear-gradient(120deg,#15100D,#3a0d10 60%,#E3101F);color:#fff;border-radius:18px;padding:14px 16px;margin:12px 0;box-shadow:var(--sh);animation:s44Sobe .4s both;transition:transform .15s var(--mola,ease)}
.s44-ini:hover{transform:translateY(-2px)}.s44-ini:active{transform:scale(.98)}
.s44-ini .ic{font-size:30px;animation:s44Balanca 2.6s ease-in-out infinite}.s44-ini .t{flex:1}.s44-ini b{display:block;font-size:15.5px}.s44-ini small{opacity:.85;font-size:12.5px}
.s44-festa{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:9999;font-size:70px;display:flex;flex-direction:column;align-items:center;pointer-events:none;animation:s44Festa 1.4s var(--mola,ease) forwards}
.s44-festa span{font-size:20px;font-weight:900;background:#1a7f4b;color:#fff;border-radius:99px;padding:6px 16px;margin-top:4px}
.s44 .giro,.s44-vazio .giro{display:inline-block;animation:s44Gira 1s linear infinite}
@keyframes s44Sobe{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes s44Anel{0%{box-shadow:0 0 0 0 rgba(227,16,31,.45)}70%{box-shadow:0 0 0 10px rgba(227,16,31,0)}100%{box-shadow:0 0 0 0 rgba(227,16,31,0)}}
@keyframes s44Pulsa{0%,100%{border-color:var(--linha)}50%{border-color:#E3101F;color:#E3101F}}
@keyframes s44Balanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
@keyframes s44Gira{to{transform:rotate(360deg)}}
@keyframes s44Festa{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}70%{opacity:1;transform:translate(-50%,-55%) scale(1)}100%{opacity:0;transform:translate(-50%,-80%) scale(.9)}}
@media (max-width:560px){.s44-card{padding:12px}.s44-passo{width:60px}.s44-tot{text-align:left}.s44-btn{min-width:0}}
</style>`);
