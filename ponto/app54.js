/* ═══════════ Portal Equipe Las Vegas · v54 (11/11/2026) ═══════════
   Pedidos da Madu:
   1) Estoque sem "Bosque · Depósito": só Bosque · Prateleira e Centro · Prateleira (a troca em si está no app10/app11/app13
      e no ESTOQUE.gs; aqui não tem nada disso).
   2) Estoque › Produtos: a equipe pode EDITAR o produto (nome, código, categoria e preço) e tirar do catálogo o que a loja
      não trabalha mais. Nome, código e categoria entram na hora; preço mexido pela equipe vai para a administração aprovar.
   3) "Metas e prêmios" e "Campanha do mês" viram UM balão só no menu ("Metas e campanha"), com as duas abas por dentro.
   4) Administração › Equipe e ponto › Histórico: tudo o que cada pessoa fez no portal (ponto, vendas, caixa, estoque,
      produtos, pedidos do site, campanha…), por período, por pessoa e por assunto — nos perfis Madu e Matheus.
   Servidor: ESTOQUE.gs (produtoEditar, produtoTirar, fim do depósito) + ANDAMENTOS.gs (admAndamentos).
   Para desfazer: tirar a linha do app54 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
.sub54{display:flex;gap:8px;margin:0 0 14px;padding:5px;background:#fff;border:1px solid var(--linha);border-radius:16px;box-shadow:0 2px 10px rgba(28,20,22,.04)}
.sub54 button{all:unset;box-sizing:border-box;flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border-radius:12px;font-weight:800;font-size:14.5px;color:var(--creme2);cursor:pointer;position:relative;transition:transform .18s,background .2s,color .2s;text-align:center}
.sub54 button i.ti{font-size:19px}
.sub54 button:hover{background:var(--vermelho-claro);color:var(--vermelho);transform:translateY(-1px)}
.sub54 button:active{transform:scale(.97)}
.sub54 button.on{background:linear-gradient(135deg,var(--vermelho),var(--vermelho2));color:#fff;box-shadow:0 6px 16px rgba(227,16,31,.28)}
.sub54 button:not(.on) i.ti{animation:sub54pulso 2.4s ease-in-out infinite}
.sub54 .contador{position:static;margin-left:2px}
@keyframes sub54pulso{0%,100%{transform:scale(1)}50%{transform:scale(1.18) rotate(-6deg)}}
.pe54-btn{animation:pe54chama 2.6s ease-in-out infinite}
@keyframes pe54chama{0%,100%{box-shadow:0 0 0 0 rgba(227,154,0,0)}50%{box-shadow:0 0 0 5px rgba(227,154,0,.22)}}
.pe54-aviso{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.35;color:var(--ouro-escuro);background:var(--ouro-claro);border-radius:12px;padding:9px 11px;margin:-2px 0 12px}
.pe54-tirar{all:unset;cursor:pointer;display:block;margin:12px auto 0;font-size:13px;font-weight:700;color:var(--creme3);text-decoration:underline;text-underline-offset:3px}
.pe54-tirar:hover{color:var(--vermelho)}
.cat-item .pe54-lapis{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:99px;background:#fff;color:var(--ouro-escuro);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:16px;transition:transform .18s}
.cat-item:hover .pe54-lapis{transform:scale(1.15) rotate(-8deg)}
.cat-item .pe54-pend{font-size:11px;font-weight:800;color:var(--ouro-escuro)}
.h54-topo{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.h54-topo h2{margin:0 0 2px;font-size:22px}.h54-topo p{margin:0;color:var(--creme2);font-size:14px;max-width:640px}
.h54-per{display:flex;gap:6px;flex-wrap:wrap}
.h54-per button,.h54-chips button{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 14px;border-radius:99px;background:#fff;border:1px solid var(--linha2);font-weight:700;font-size:13.5px;color:var(--creme2);transition:transform .16s,background .2s,color .2s,border-color .2s;display:inline-flex;align-items:center;gap:6px}
.h54-per button:hover,.h54-chips button:hover{transform:translateY(-2px);border-color:var(--vermelho);color:var(--vermelho)}
.h54-per button.on,.h54-chips button.on{background:var(--vermelho);border-color:var(--vermelho);color:#fff}
.h54-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.h54-chips button small{font-weight:800;opacity:.75}
.h54-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.h54-num{background:#fff;border:1px solid var(--linha);border-radius:16px;padding:14px 16px}
.h54-num small{display:block;font-size:12.5px;font-weight:700;color:var(--creme3)}
.h54-num b{display:block;font-size:26px;line-height:1.15;margin-top:2px}
.h54-num span{font-size:12.5px;color:var(--creme2)}
.h54-grade{display:grid;grid-template-columns:minmax(280px,380px) 1fr;gap:14px;align-items:start}
.h54-pessoa{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;padding:10px;border-radius:14px;border:1px solid transparent;transition:background .2s,border-color .2s,transform .16s}
.h54-pessoa:hover{background:var(--vermelho-claro);transform:translateX(3px)}
.h54-pessoa.on{border-color:var(--vermelho);background:var(--vermelho-claro)}
.h54-pessoa .l1{display:flex;align-items:center;gap:10px}
.h54-pessoa .l1 b{flex:1;font-size:15px}.h54-pessoa .l1 strong{font-size:18px}
.h54-barra{height:8px;border-radius:99px;background:rgba(28,20,22,.07);overflow:hidden;margin:8px 0 6px}
.h54-barra i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),var(--dourado2));transition:width .8s cubic-bezier(.2,.8,.2,1)}
.h54-mini{display:flex;gap:5px;flex-wrap:wrap;font-size:11.5px;color:var(--creme2)}
.h54-mini span{background:rgba(28,20,22,.05);border-radius:99px;padding:2px 8px;font-weight:700}
.h54-av{flex:0 0 auto;width:34px;height:34px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff}
.h54-dia{font-size:13px;font-weight:800;color:var(--creme3);margin:14px 0 6px;text-transform:capitalize}
.h54-dia:first-child{margin-top:0}
.h54-linha{display:flex;gap:10px;align-items:flex-start;padding:9px 4px;border-bottom:1px solid var(--linha)}
.h54-linha:last-child{border-bottom:0}
.h54-linha time{flex:0 0 44px;font-weight:800;font-size:13px;color:var(--creme2);padding-top:8px;font-variant-numeric:tabular-nums}
.h54-linha .ic{flex:0 0 34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff}
.h54-linha .tx{flex:1;min-width:0}
.h54-linha .tx b{font-size:14.5px}.h54-linha .tx span{font-size:14.5px;color:var(--creme2)}
.h54-linha .tx small{display:block;font-size:12.5px;color:var(--creme3);overflow-wrap:anywhere;line-height:1.35}
@media (max-width:900px){.h54-nums{grid-template-columns:1fr 1fr}.h54-grade{grid-template-columns:1fr}.sub54 button{font-size:13px;padding:10px 6px;gap:5px}}
`; document.head.appendChild(st); })();

/* ═════════ 3) Metas e prêmios + Campanha do mês = um balão só ═════════ */
const V54 = { menu:null };
function menu54(tabs, adm){
  if(adm || !tabs.metas || !tabs.campanha) return V54.menu(tabs, adm);
  const b = (parseInt(tabs.metas.badge)||0) + (parseInt(tabs.campanha.badge)||0);
  const t2 = {...tabs}; delete t2.campanha; t2.metas = {...tabs.metas, badge: b ? String(b) : ''};
  const nome = NOMES12.portal.metas, era = S.portalTab;
  NOMES12.portal.metas = 'Metas e campanha'; if(era==='campanha') S.portalTab = 'metas';
  try{ return V54.menu(t2, adm); } finally { S.portalTab = era; NOMES12.portal.metas = nome; }
}
function metas54Dom(){
  if(S.tela!=='portal' || !S.sess?.dados) return;
  const w = document.querySelector('#app > .wrap'); if(!w) return;
  const tem = k => !!w.querySelector(`:scope > .abas button[onclick*="portalTab='${k}'"]`);
  const faixa = w.querySelector(':scope > .abas');
  // faixa com as duas abas por dentro (só quando as duas telas estão ligadas para a equipe)
  if((S.portalTab==='metas' || S.portalTab==='campanha') && faixa && tem('metas') && tem('campanha') && !w.querySelector('.sub54')){
    let n = 0; try{ n = (cpD()?.raspadinhas||[]).length; }catch(e){}
    const on = k => S.portalTab===k ? 'on' : '';
    faixa.insertAdjacentHTML('afterend', `<div class="sub54" role="tablist" aria-label="Metas e campanha">
      <button role="tab" class="${on('metas')}" aria-selected="${S.portalTab==='metas'}" onclick="S.portalTab='metas';S.protoAberto=null;render()"><i class="ti ti-trophy"></i>Metas e prêmios</button>
      <button role="tab" class="${on('campanha')}" aria-selected="${S.portalTab==='campanha'}" onclick="S.portalTab='campanha';S.protoAberto=null;render()"><i class="ti ti-confetti"></i>Campanha do mês${n?`<span class="contador">${n}</span>`:''}</button></div>`);
  }
  // "Mais" (celular): um bloco só
  if(S.portalTab==='mais'){
    const tm = w.querySelector(`.tile[onclick*="portalTab='metas'"]`), tc = w.querySelector(`.tile[onclick*="portalTab='campanha'"]`);
    if(tm && tc){
      const bc = tc.querySelector('.contador'); if(bc && !tm.querySelector('.contador')) tm.appendChild(bc);
      const b = tm.querySelector('b'), s = tm.querySelector('small');
      if(b) b.textContent = 'Metas e campanha'; if(s) s.textContent = 'Premiação, raspadinha e bingo';
      tc.remove();
    }
  }
}
const _renderV54 = render;
render = function(){
  if(!V54.menu && typeof menu12==='function'){ V54.menu = menu12; menu12 = menu54; }
  const r = _renderV54.apply(this, arguments);
  try{ metas54Dom(); }catch(e){ console.warn('v54 metas', e); }
  return r;
};
if(typeof itensBusca==='function'){
  const _ib54 = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ib54.apply(this, arguments);
    if(S.adm && S.tela==='admin') r.unshift({t:'Histórico de andamentos', s:'Tudo o que cada pessoa da equipe fez no portal', i:'ti-history', go:()=>{ S.adm.tab='andamentos'; render(); }});
    return r;
  };
}

/* ═════════ 2) Editar produto (Estoque › Produtos) ═════════ */
var PE54 = null;                       // formulário aberto
const PEND54 = {};                     // preços que esta pessoa mandou para aprovar (nesta sessão)
const pe54Preco = v => (Number(v)||0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const _catAbrirV54 = catAbrir;
catAbrir = function catAbrir(id){
  if(estAdmin()) return _catAbrirV54(id);          // a administração continua com o editor completo dela
  const p = estProd(id); if(!p) return;
  const locs = estLocais().map(l=>[l, estQtdDe(p.id, l.id)]).filter(([l,q])=>q!=null);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">${esc(p.nome)}</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${p.foto?`<img class="cat-foto-g" src="${esc(fotoUrl(p,640))}" alt="">`:`<div class="np-foto" onclick="fotoTirar('${p.id}',()=>catAbrir('${p.id}'))"><i class="ti ti-camera-plus"></i>Tirar foto</div>`}
      <div class="linha entre" style="margin:12px 0 4px"><span class="suave">${esc(p.codigo||p.sku||'sem código')}${p.categoria?' · '+esc(catsTexto(p)):''}</span><b style="font-size:20px;color:var(--dourado2)">${brl2(precoDe(p))}</b></div>
      ${PEND54[p.id]?`<div class="pe54-aviso"><i class="ti ti-hourglass-high"></i><span>Preço novo de <b>${brl2(PEND54[p.id])}</b> esperando a administração aprovar.</span></div>`:''}
      ${locs.length?`<div class="est-lojas" style="margin:8px 0 12px">${locs.map(([l,q])=>`<span class="selo ${q>0?'ok':''}">${esc(l.nome)}: <b>${estFmt(q)}</b></span>`).join(' ')}</div>`:''}
      <div class="g2"><button class="btn" onclick="fotoTirar('${p.id}',()=>catAbrir('${p.id}'))"><i class="ti ti-camera"></i> ${p.foto?'Trocar foto':'Tirar foto'}</button>
        <button class="btn ouro pe54-btn" id="pe54-editar" onclick="pe54Abrir('${p.id}')"><i class="ti ti-pencil"></i> Editar</button></div>
    </div></div></div>`;
};
/* na grade: produto sem foto também abre a ficha (para dar para editar); no filtro "Sem foto" o toque continua indo direto para a câmera */
const _catGradeHtmlV54 = catGradeHtml;
catGradeHtml = function catGradeHtml(l){
  if(estAdmin()) return _catGradeHtmlV54(l);
  if(!l.length) return _catGradeHtmlV54(l);
  const direto = CAT.filtro==='sem';
  return `<div class="cat-grade">${l.slice(0,CAT.lim).map(p=>`<button class="cat-item" data-id="${p.id}" onclick="${(!p.foto && direto)?`fotoTirar('${p.id}')`:`catAbrir('${p.id}')`}">
      ${p.foto?`<img class="ft" src="${esc(fotoUrl(p,240))}" loading="lazy" alt="">`:`<span class="semft"><i class="ti ti-camera-plus"></i>${direto?'Tirar foto':'Sem foto'}</span>`}
      ${direto?'':'<span class="pe54-lapis" aria-hidden="true"><i class="ti ti-pencil"></i></span>'}
      <b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'sem código')}</small><span class="pr">${brl2(precoDe(p))}</span>${PEND54[p.id]?'<span class="pe54-pend">⏳ preço em aprovação</span>':''}</button>`).join('')}</div>
    ${l.length>CAT.lim?`<button class="btn largo" style="margin-top:12px" onclick="CAT.lim+=90;catPintar()">Mostrar mais (${l.length-CAT.lim})</button>`:''}`;
};
function pe54Abrir(id){
  const p = estProd(id); if(!p) return;
  PE54 = {id, nome:p.nome||'', codigo:p.codigo||'', categoria:p.categoria||'', preco:pe54Preco(p.preco), tirar:false, motivo:''};
  pe54Pintar();
}
function pe54Pintar(){
  const p = estProd(PE54.id); if(!p) return fecharModal();
  const cats = [...new Set(pdvD().produtos.flatMap(catsDe))].sort();
  const corpo = PE54.tirar ? `
      <p style="margin:0 0 10px;font-size:15px"><b>Tirar "${esc(p.nome)}" do catálogo?</b></p>
      <p class="suave" style="margin:0 0 12px;font-size:14px">Use quando a loja não trabalha mais com o produto. Ele some do PDV e desta lista. Nada é apagado: a administração consegue voltar.</p>
      <div class="campo"><label>Motivo</label><input class="inp" id="pe54-motivo" value="${esc(PE54.motivo)}" placeholder="ex.: fornecedor parou de fazer" oninput="PE54.motivo=this.value"></div>
      <div class="g2"><button class="btn" onclick="PE54.tirar=false;pe54Pintar()"><i class="ti ti-arrow-left"></i> Voltar</button>
        <button class="btn pri" id="pe54-tirar-ok" onclick="pe54Tirar()"><i class="ti ti-archive"></i> Tirar do catálogo</button></div>` : `
      <div class="campo"><label>Nome do produto</label><input class="inp" id="pe54-nome" value="${esc(PE54.nome)}" oninput="PE54.nome=this.value"></div>
      <div class="campo"><label>Código de barras</label><div class="linha" style="gap:6px"><input class="inp num cresce" id="pe54-cod" inputmode="numeric" value="${esc(PE54.codigo)}" placeholder="bipe ou digite" oninput="PE54.codigo=this.value.trim()">
        <button class="btn" aria-label="Ler o código pela câmera" onclick="estCamera(pe54Codigo,'Ler o código do produto')"><i class="ti ti-barcode"></i></button></div></div>
      <div class="g2"><div class="campo"><label>Preço de venda (R$)</label><input class="inp num" id="pe54-preco" inputmode="decimal" value="${esc(PE54.preco)}" placeholder="0,00" oninput="PE54.preco=this.value"></div>
        <div class="campo"><label>Categoria</label><input class="inp" id="pe54-cat" list="pe54-cats" value="${esc(PE54.categoria)}" placeholder="opcional" oninput="PE54.categoria=this.value"><datalist id="pe54-cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div></div>
      <div class="pe54-aviso"><i class="ti ti-info-circle"></i><span>Nome, código e categoria mudam na hora. <b>Preço</b> novo vai para a administração aprovar antes de valer no PDV.</span></div>
      <div class="g2"><button class="btn" onclick="catAbrir('${p.id}')"><i class="ti ti-arrow-left"></i> Voltar</button>
        <button class="btn pri" id="pe54-salvar" onclick="pe54Salvar()"><i class="ti ti-device-floppy"></i> Salvar</button></div>
      <button class="pe54-tirar" id="pe54-tirar" onclick="PE54.tirar=true;pe54Pintar()">A loja não trabalha mais com este produto</button>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">✏️ Editar produto</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}</div></div></div>`;
}
function pe54Codigo(cod){ estCameraFechar(); if(!PE54) return; PE54.codigo = String(cod).trim(); estBip(true); pe54Pintar(); }
const pe54Erro = e => /Só a administração/i.test(e.message||'') ? 'A edição entra no ar assim que a atualização do servidor for publicada.' : e.message;
async function pe54Salvar(){
  const p = estProd(PE54.id); if(!p) return;
  const campos = {}, limpo = s => String(s||'').replace(/\s+/g,' ').trim();
  if(limpo(PE54.nome) !== limpo(p.nome)) campos.nome = limpo(PE54.nome);
  if(String(PE54.codigo||'').replace(/\s/g,'') !== String(p.codigo||'')) campos.codigo = String(PE54.codigo||'').replace(/\s/g,'');
  if(limpo(PE54.categoria) !== limpo(p.categoria)) campos.categoria = limpo(PE54.categoria);
  const novo = estN(PE54.preco);
  if(limpo(PE54.preco) !== '' && Math.abs(novo - (Number(p.preco)||0)) > 0.004){
    if(!(novo > 0)) return toast('Confira o preço', true);
    campos.preco = String(novo);
  }
  if('nome' in campos && campos.nome.length < 3) return toast('Escreva o nome do produto', true);
  if(!Object.keys(campos).length) return toast('Nada mudou');
  const b = $('#pe54-salvar'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Salvando…'; }
  try{
    const r = await estApi('produtoEditar', {produto_id:p.id, campos});
    const n = r.produto || {};
    if(r.feitos?.includes('nome')) p.nome = n.nome;
    if(r.feitos?.includes('codigo')) p.codigo = n.codigo;
    if(r.feitos?.includes('categoria')) p.categoria = n.categoria;
    if(r.feitos?.includes('preco')) p.preco = n.preco;
    if(r.pendentes?.includes('preco')) PEND54[p.id] = novo;
    PE54 = null; estBip(true); render(); catAbrir(p.id);
    toast(r.pendentes?.length ? (r.feitos?.length ? 'Salvo ✔ — o preço novo foi para a administração aprovar' : 'Preço novo enviado para a administração aprovar ✔') : 'Produto atualizado ✔');
  }catch(e){ toast(pe54Erro(e), true); if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-device-floppy"></i> Salvar'; } }
}
async function pe54Tirar(){
  const p = estProd(PE54.id); if(!p) return;
  if(String(PE54.motivo||'').trim().length < 3) return toast('Conte o motivo', true);
  const b = $('#pe54-tirar-ok'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Tirando…'; }
  try{
    await estApi('produtoTirar', {produto_id:p.id, motivo:PE54.motivo});
    p.ativo = false; PE54 = null; fecharModal(); render(); toast('Produto tirado do catálogo ✔');
  }catch(e){ toast(pe54Erro(e), true); if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-archive"></i> Tirar do catálogo'; } }
}

/* ═════════ 4) Administração › Histórico de andamentos ═════════ */
var H54 = {per:'7', r:null, erro:'', buscando:false, quem:'', cat:'', q:'', lim:80, todos:false, em:0};
const H54_CATS = [
  {k:'vendas',   n:'Vendas',          ic:'ti-shopping-cart',   cor:'var(--g-vendas)',  re:/^(pdv |venda$|cancelamento|pediu cancelamento)/},
  {k:'caixa',    n:'Caixa',           ic:'ti-cash-banknote',   cor:'var(--g-dia)',     re:/(caixa|sangria|suprimento)/},
  {k:'ponto',    n:'Ponto',           ic:'ti-clock-check',     cor:'var(--g-ponto)',   re:/^(bater|ponto)/},
  {k:'produtos', n:'Produtos',        ic:'ti-photo-edit',      cor:'var(--g-aprender)',re:/(produto|foto)/},
  {k:'estoque',  n:'Estoque',         ic:'ti-packages',        cor:'var(--g-equipe)',  re:/(estoque|transfer|contagem|código vinculado|depósito)/},
  {k:'site',     n:'Pedidos do site', ic:'ti-world',           cor:'var(--g-ponto)',   re:/(pedido do site|nuvemshop)/},
  {k:'clientes', n:'Clientes',        ic:'ti-heart-handshake', cor:'var(--g-vendas)',  re:/(cliente|fidelidade)/},
  {k:'campanha', n:'Campanha',        ic:'ti-confetti',        cor:'var(--g-dia)',     re:/(raspadinha|bingo|mural dos sonhos|roleta)/},
  {k:'pedidos',  n:'Pedidos e dúvidas', ic:'ti-send',          cor:'var(--g-sistema)', re:/(solicitar|dúvida|trocou o próprio pin)/},
  {k:'outros',   n:'Outros',          ic:'ti-dots',            cor:'var(--g-sistema)', re:/./}
];
const H54_NOMES = {'bater':'bateu o ponto', 'ponto pelo celular':'bateu o ponto pelo celular', 'pdv venda':'fez uma venda no PDV', 'venda':'lançou a venda do dia', 'pdv cancelar':'desfez uma venda',
  'pdv venda kommo':'lançou uma venda da Kommo', 'pdv venda para outra':'lançou a venda de outra vendedora', 'pediu cancelamento':'pediu o cancelamento de uma venda', 'cancelamento':'resolveu um pedido de cancelamento',
  'sangria':'fez uma sangria', 'caixa aberto':'abriu o caixa', 'caixa fechado':'fechou o caixa', 'passagem de caixa':'passou o caixa', 'suprimento de caixa':'colocou troco no caixa',
  'entrada estoque':'recebeu mercadoria', 'entrada estoque cancelada':'cancelou uma entrada de mercadoria', 'saída estoque':'registrou uma saída sem venda', 'transferência':'transferiu mercadoria',
  'transferência recebida':'conferiu uma transferência', 'transferência cancelada':'cancelou uma transferência', 'contagem aberta':'abriu uma contagem', 'contagem fechada':'fechou uma contagem',
  'contagem cancelada':'cancelou uma contagem', 'contagem desfeita':'desfez uma contagem', 'contagem apagada':'apagou uma contagem', 'código vinculado':'ligou um código a um produto',
  'produto novo':'cadastrou um produto', 'arrumou produto':'editou um produto', 'tirou produto do catálogo':'tirou um produto do catálogo', 'foto do produto':'colocou foto em um produto',
  'pedido do site':'mexeu em um pedido do site', 'cliente nova':'cadastrou uma cliente', 'fidelidade':'usou o cartão fidelidade', 'raspadinha':'raspou uma raspadinha', 'bingo':'marcou o bingo',
  'print bingo':'mandou um print do bingo', 'mural dos sonhos':'atualizou o mural dos sonhos', 'roleta cupom':'usou um cupom da roleta', 'solicitar':'fez um pedido à administração',
  'trocou o próprio PIN':'trocou o próprio PIN', 'respondeu dúvida':'respondeu uma dúvida'};
const h54Cat = acao => H54_CATS.find(c=>c.re.test(String(acao||'').toLowerCase())) || H54_CATS[H54_CATS.length-1];
const h54Quem = q => String(q||'').replace(/ \((link|desfez|ajuste)\)$/,'').trim() || '—';
const H54_FORA = /^(Administração|Sistema|Site|Kommo|—)$/;
function h54Periodo(){
  const h = hojeISO();
  if(H54.per==='hoje') return {de:h, ate:h, n:'hoje'};
  if(H54.per==='ontem') return {de:addDays(h,-1), ate:addDays(h,-1), n:'ontem'};
  if(H54.per==='30') return {de:addDays(h,-29), ate:h, n:'nos últimos 30 dias'};
  return {de:addDays(h,-6), ate:h, n:'nos últimos 7 dias'};
}
async function h54Carregar(forcar){
  if(H54.buscando) return;
  const p = h54Periodo();
  if(!forcar && H54.r && H54.r.de===p.de && H54.r.ate===p.ate && Date.now()-H54.em < 60000) return;
  H54.buscando = true; H54.erro = '';
  try{ H54.r = await api('admAndamentos', {...S.adm.cred, de:p.de, ate:p.ate}); H54.em = Date.now(); }
  catch(e){ H54.erro = e.message || 'Erro'; H54.r = null; }
  H54.buscando = false;
  if(S.adm && S.tela==='admin' && S.adm.tab==='andamentos') render();
}
function h54Colab(nome){
  const eq = S.adm.dados?.colaboradoras || [], pn = primeiroNome(nome);
  return eq.find(c=>c.nome===nome) || eq.find(c=>primeiroNome(c.nome)===pn) || null;
}
function h54Av(nome){
  const c = h54Colab(nome), cor = (c && c.cor) || '#8a8286';
  let foto = ''; try{ if(c && typeof fotoDe39==='function'){ const f = fotoDe39(c); if(f) foto = fotoCss39(f, 160); } }catch(e){}
  return `<span class="h54-av" style="background:${esc(cor)};${foto}">${esc(iniciais(nome))}</span>`;
}
function h54Filtradas(semPessoa, semCat){
  const q = semAcento(H54.q.trim());
  return (H54.r?.linhas||[]).filter(l=>{
    const quem = h54Quem(l.quem);
    if(!H54.todos && H54_FORA.test(quem)) return false;
    if(!semPessoa && H54.quem && primeiroNome(quem)!==H54.quem) return false;
    if(!semCat && H54.cat && h54Cat(l.acao).k!==H54.cat) return false;
    if(q && !semAcento(quem+' '+l.acao+' '+(H54_NOMES[l.acao]||'')+' '+l.det).includes(q)) return false;
    return true;
  });
}
function h54Tela(){
  const per = h54Periodo();
  const topo = `<div class="h54-topo"><div><h2>🕓 Histórico de andamentos</h2><p>Tudo o que cada pessoa da equipe fez no portal: ponto, vendas, caixa, estoque, produtos, pedidos do site e campanha. Toque em uma pessoa ou em um assunto para filtrar.</p></div>
    <div class="h54-per">${[['hoje','Hoje'],['ontem','Ontem'],['7','7 dias'],['30','30 dias']].map(([k,n])=>`<button class="${H54.per===k?'on':''}" onclick="H54.per='${k}';H54.lim=80;render()">${n}</button>`).join('')}
      <button aria-label="Atualizar" title="Atualizar" onclick="h54Carregar(true);render()"><i class="ti ti-refresh"></i></button></div></div>`;
  if(H54.erro) return topo + `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(H54.erro)?'<b>Falta publicar a atualização do servidor (ANDAMENTOS.gs).</b> Assim que for publicada, o histórico aparece aqui.':esc(H54.erro)}<br><button class="btn p" style="margin-top:8px" onclick="h54Carregar(true);render()">Tentar de novo</button></div></div>`;
  const ok = H54.r && H54.r.de===per.de && H54.r.ate===per.ate;
  if(!ok){ h54Carregar(); return topo + `<p class="suave"><i class="ti ti-loader-2"></i> Carregando o histórico…</p>`; }
  h54Carregar();
  const base = h54Filtradas(true, true), comCat = h54Filtradas(true, false), comPessoa = h54Filtradas(false, true), lista = h54Filtradas(false, false);
  // por pessoa
  const pes = {};
  comCat.forEach(l=>{ const nm = h54Quem(l.quem), k = primeiroNome(nm), p = pes[k] = pes[k] || {k, nome:nm, n:0, cats:{}, ult:''}; p.n++; const c = h54Cat(l.acao).k; p.cats[c] = (p.cats[c]||0)+1; if(l.q > p.ult) p.ult = l.q; });
  const lp = Object.values(pes).sort((a,b)=>b.n-a.n), maxP = Math.max(1, ...lp.map(p=>p.n));
  const cats = {}; comPessoa.forEach(l=>{ const c = h54Cat(l.acao).k; cats[c] = (cats[c]||0)+1; });
  const vendas = base.filter(l=>/^pdv venda/.test(l.acao)).length;
  const top = Object.values(base.reduce((m,l)=>{ const k = primeiroNome(h54Quem(l.quem)); if(!H54_FORA.test(h54Quem(l.quem))){ m[k] = m[k] || {k, n:0}; m[k].n++; } return m; }, {})).sort((a,b)=>b.n-a.n)[0];
  const nums = `<div class="h54-nums">
    <div class="h54-num"><small>Andamentos ${per.n}</small><b>${base.length}</b><span>${H54.r.cortado?'mostrando os mais recentes':'registrados no portal'}</span></div>
    <div class="h54-num"><small>Pessoas ativas</small><b>${Object.keys(base.reduce((m,l)=>{ const q = h54Quem(l.quem); if(!H54_FORA.test(q)) m[primeiroNome(q)] = 1; return m; }, {})).length}</b><span>da equipe</span></div>
    <div class="h54-num"><small>Vendas no PDV</small><b>${vendas}</b><span>lançadas ${per.n}</span></div>
    <div class="h54-num"><small>Quem mais fez</small><b style="font-size:21px;line-height:1.5">${top?esc(top.k):'—'}</b><span>${top?top.n+' andamentos':'sem registros'}</span></div></div>`;
  const pessoas = `<div class="cartao pad"><h3 style="margin:0 0 8px;font-size:16px">Por pessoa</h3>
    ${lp.length?lp.map(p=>`<button class="h54-pessoa ${H54.quem===p.k?'on':''}" data-quem="${esc(p.k)}" onclick="H54.quem=H54.quem==='${esc(p.k)}'?'':'${esc(p.k)}';H54.lim=80;render()">
      <span class="l1">${h54Av(p.nome)}<b>${esc(p.k)}</b><strong>${p.n}</strong></span>
      <span class="h54-barra"><i style="width:${Math.round(p.n/maxP*100)}%"></i></span>
      <span class="h54-mini">${H54_CATS.filter(c=>p.cats[c.k]).map(c=>`<span>${c.n} ${p.cats[c.k]}</span>`).join('')}</span></button>`).join(''):'<p class="suave" style="margin:0">Ninguém fez nada no portal nesse período.</p>'}
    <label class="linha" style="gap:8px;margin-top:12px;font-size:13px;color:var(--creme2);cursor:pointer"><input type="checkbox" id="h54-todos" ${H54.todos?'checked':''} onchange="H54.todos=this.checked;H54.quem='';render()"> Mostrar também a administração e o sistema</label></div>`;
  // linha do tempo
  const dias = {}; lista.slice(0, H54.lim).forEach(l=>{ (dias[l.q.slice(0,10)] = dias[l.q.slice(0,10)] || []).push(l); });
  const nomeDia = d => d===hojeISO() ? 'Hoje' : d===addDays(hojeISO(),-1) ? 'Ontem' : new Date(d+'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'2-digit'});
  const linha = l => { const c = h54Cat(l.acao), quem = h54Quem(l.quem);
    return `<div class="h54-linha"><time>${esc(l.q.slice(11,16))}</time><span class="ic" style="background:${c.cor}"><i class="ti ${c.ic}"></i></span>
      <div class="tx"><b>${esc(primeiroNome(quem))}</b> <span>${esc(H54_NOMES[l.acao] || l.acao)}</span>${l.det?`<small>${esc(l.det)}</small>`:''}</div></div>`; };
  const tempo = `<div class="cartao pad">
    <div class="h54-chips"><button class="${!H54.cat?'on':''}" onclick="H54.cat='';H54.lim=80;render()">Tudo <small>${comPessoa.length}</small></button>
      ${H54_CATS.filter(c=>cats[c.k]).map(c=>`<button class="${H54.cat===c.k?'on':''}" data-cat="${c.k}" onclick="H54.cat=H54.cat==='${c.k}'?'':'${c.k}';H54.lim=80;render()"><i class="ti ${c.ic}"></i>${c.n} <small>${cats[c.k]}</small></button>`).join('')}</div>
    <div class="linha" style="gap:8px;margin-bottom:12px"><input class="inp cresce" id="h54-q" placeholder="Buscar no histórico (produto, nº da venda, nome…)" value="${esc(H54.q)}" oninput="H54.q=this.value;H54.lim=80;h54Pintar()">
      <button class="btn p" onclick="h54Csv()" title="Baixar em planilha"><i class="ti ti-download"></i> Planilha</button></div>
    <div id="h54-lista">${h54ListaHtml(lista, dias, nomeDia, linha)}</div></div>`;
  return topo + nums + `<div class="h54-grade">${pessoas}${tempo}</div>`;
}
function h54ListaHtml(lista, dias, nomeDia, linha){
  if(!lista.length) return `<p class="suave" style="text-align:center;margin:18px 0">Nada encontrado com esse filtro.</p>`;
  return Object.keys(dias).map(d=>`<div class="h54-dia">${esc(nomeDia(d))} · ${lista.filter(l=>l.q.slice(0,10)===d).length}</div>${dias[d].map(linha).join('')}`).join('')
    + (lista.length>H54.lim?`<button class="btn largo" style="margin-top:12px" onclick="H54.lim+=150;render()">Mostrar mais (${lista.length-H54.lim})</button>`:'');
}
/* busca: repinta a tela sem perder o cursor do campo */
function h54Pintar(){
  const i = document.activeElement?.id==='h54-q', pos = i ? document.activeElement.selectionStart : 0;
  render();
  if(i){ const el = $('#h54-q'); if(el){ el.focus(); try{ el.setSelectionRange(pos, pos); }catch(e){} } }
}
function h54Csv(){
  const l = h54Filtradas(false, false), cel = v => '"' + String(v==null?'':v).replace(/"/g,'""') + '"';
  const csv = '﻿' + [['Data','Hora','Quem','Assunto','O que fez','Detalhe']].concat(l.map(x=>[x.q.slice(0,10), x.q.slice(11,19), h54Quem(x.quem), h54Cat(x.acao).n, H54_NOMES[x.acao]||x.acao, x.det])).map(r=>r.map(cel).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  a.download = `historico-equipe-${h54Periodo().de}-a-${h54Periodo().ate}.csv`; document.body.appendChild(a); a.click(); a.remove();
  toast('Planilha baixada ✔');
}
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='equipe'); if(a && !a.k.includes('andamentos')) a.k.splice(a.k.indexOf('produtividade')>=0 ? a.k.indexOf('produtividade')+1 : a.k.length, 0, 'andamentos'); NOMES34.andamentos = 'Histórico'; }
if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('equipe')); if(g && !g.k.includes('andamentos')) g.k.push('andamentos'); if(typeof NOMES12!=='undefined') NOMES12.admin.andamentos = 'Histórico'; }
const _telaAdminV54 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm; if(!A || (typeof perfil29==='function' && !A.perfil)) return _telaAdminV54.apply(this, arguments);
  const aqui = A.tab === 'andamentos', marca = '<!--h54-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV54.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'andamentos'; }
    const i = h.indexOf(marca);
    let tela; try{ tela = h54Tela(); }catch(e){ console.error('v54 histórico', e); tela = `<div class="nota"><i class="ti ti-alert-triangle"></i><div>Não consegui montar o histórico. Atualize a página.</div></div>`; }
    h = i >= 0 ? h.slice(0, i) + tela + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV54.apply(this, arguments);
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='andamentos';TR=null;render()"><i class="ti ti-history"></i> Histórico </button>`;
  return h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
};
