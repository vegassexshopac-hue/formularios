/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v13 (app13.js): FOTOS DOS PRODUTOS + CATÁLOGO
   • Cada produto tem foto (do site da Nuvemshop ou tirada pela equipe no celular).
   • A foto aparece no PDV, na contagem e nas listas de transferência e saída.
   • Tela "📸 Produtos" (Estoque › Produtos · link direto …/ponto/#produtos):
     catálogo com fotos, filtro "sem foto" (toca e fotografa) e cadastro rápido de
     produto novo (bipa o código, tira a foto, nome, preço e quantas peças chegaram).
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.pf{flex:0 0 auto;object-fit:cover;border-radius:9px;background:#fff;display:inline-block;vertical-align:middle}
.pf-emo{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:rgba(255,255,255,.05);vertical-align:middle;line-height:1}
td .pf,td .pf-emo{margin-right:8px}
.pdv-prod .pdv-foto{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:11px;background:#fff;margin-bottom:4px}
.pdv-prod:has(.pdv-foto){min-height:0}
.cat-topo{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.cat-barra{flex:1 1 220px;height:10px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.cat-barra i{display:block;height:100%;background:linear-gradient(90deg,var(--dourado),var(--ok));border-radius:99px}
.cat-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.cat-item{position:relative;display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:14px;background:linear-gradient(165deg,var(--veludo2),var(--veludo));border:1px solid var(--linha);color:var(--creme);text-align:left;cursor:pointer}
.cat-item:hover{border-color:var(--dourado)}
.cat-item .ft{width:100%;aspect-ratio:1/1;border-radius:10px;object-fit:cover;background:#fff}
.cat-item .semft{width:100%;aspect-ratio:1/1;border-radius:10px;border:2px dashed rgba(245,181,36,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--dourado2);font-weight:800;font-size:13px;background:rgba(245,181,36,.06)}
.cat-item .semft i{font-size:30px}
.cat-item b{font-size:12.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cat-item small{font-size:11px;color:var(--creme3)}
.cat-item .pr{font-weight:800;color:var(--dourado2);font-size:14px}
.cat-item .novo{position:absolute;top:12px;left:12px;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--vermelho);color:#fff}
.cat-foto-g{width:100%;max-height:52vh;object-fit:contain;border-radius:14px;background:#fff}
.np-foto{width:100%;aspect-ratio:4/3;border-radius:14px;border:2px dashed rgba(245,181,36,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--dourado2);font-weight:800;background:rgba(245,181,36,.06);cursor:pointer;overflow:hidden;margin-bottom:12px}
.np-foto img{width:100%;height:100%;object-fit:contain;background:#fff}
.np-foto i{font-size:38px}
.cnt-ult .pf,.cnt-ult .pf-emo{margin-right:2px}
.cnt-ult .semfoto{border:1px dashed rgba(245,181,36,.6);color:var(--dourado2);background:rgba(245,181,36,.08)}
`; document.head.appendChild(st); })();

/* ───────── foto: endereço no tamanho certo ───────── */
function fotoUrl(p, w){
  const u = p && p.foto; if(!u) return '';
  if(/mitiendanube\.com/.test(u)) return u.replace(/^http:/,'https:').replace(/-\d+-\d+\.(webp|png|jpe?g)$/i, `-${w>320?640:w>100?240:100}-0.$1`);
  if(/drive\.google\.com\/thumbnail/.test(u)) return u.replace(/sz=w\d+/, 'sz=w'+(w>320?800:320));
  return u;
}
/* miniatura (ou o emoji, se ainda não tem foto) — px = lado */
function pIco(p, px=36){
  p = p || {};
  const u = fotoUrl(p, px*2);
  if(u) return `<img class="pf" src="${esc(u)}" style="width:${px}px;height:${px}px" loading="lazy" alt="" onclick="event.stopPropagation();fotoVer('${p.id||''}')" onerror="this.outerHTML='<span class=&quot;pf-emo&quot; style=&quot;width:${px}px;height:${px}px;font-size:${Math.round(px*.55)}px&quot;>🖼️</span>'">`;
  return `<span class="pf-emo" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.55)}px">${emojiDe(p)}</span>`;
}
function fotoVer(id){
  const p = estProd(id); if(!p || !p.foto) return;
  $('#modal').insertAdjacentHTML('beforeend', `<div class="veu" id="foto-zoom" style="z-index:9999" onclick="this.remove()"><div class="modal" style="max-width:520px"><div class="modal-c" style="padding:12px"><img class="cat-foto-g" src="${esc(fotoUrl(p,640))}"><p style="margin:10px 4px 0;font-weight:700">${esc(p.nome)}</p></div></div></div>`);
}

/* ───────── tirar / escolher foto (celular abre a câmera) ───────── */
function fotoEscolher(galeria){   // galeria=true: escolhe uma foto já salva no aparelho (sem abrir a câmera)
  return new Promise((res)=>{
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if(!galeria) i.setAttribute('capture','environment'); i.style.display = 'none';
    i.onchange = async ()=>{ const f = i.files[0]; i.remove(); if(!f) return res(null); try{ res(await fotoReduzir(f)); }catch(e){ toast('Não consegui ler essa foto', true); res(null); } };
    document.body.appendChild(i); i.click();
  });
}
async function fotoReduzir(f, max=900){
  const url = URL.createObjectURL(f);
  try{
    const img = await new Promise((ok, ruim)=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = ruim; im.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth*k); c.height = Math.round(img.naturalHeight*k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(img, 0, 0, c.width, c.height);
    let q = .82, d = c.toDataURL('image/jpeg', q);
    while(d.length > 600*1024 && q > .4){ q -= .12; d = c.toDataURL('image/jpeg', q); }
    return d;
  } finally { URL.revokeObjectURL(url); }
}
async function fotoTirar(pid, depois){
  const p = estProd(pid); if(!p) return;
  const img = await fotoEscolher(); if(!img) return;
  toast('Enviando a foto…');
  try{
    const r = await estApi('foto', {produto_id:pid, img});
    p.foto = r.foto; estBip(true); toast('Foto salva ✔ — já aparece no PDV');
    if(depois) depois(); else render();
  }catch(e){ toast(e.message, true); }
}

/* ───────── fotos no PDV (grade de produtos) ───────── */
const _pdvPintarGradeV13 = pdvPintarGrade;
pdvPintarGrade = function pdvPintarGrade(reanima){
  _pdvPintarGradeV13(reanima);
  document.querySelectorAll('#pdv-grade .pdv-prod[data-id]').forEach(b=>{
    const p = estProd(b.dataset.id), u = fotoUrl(p, 240), e = b.querySelector('.emo');
    if(u && e) e.outerHTML = `<img class="pdv-foto" src="${esc(u)}" loading="lazy" alt="" onerror="this.outerHTML='<span class=&quot;emo&quot;>${emojiDe(p)}</span>'">`;
  });
};

/* ═════════ CATÁLOGO COM FOTOS ═════════ */
var CAT = {q:'', filtro:'todos', lim:60};
function catLista(){
  const P = pdvD().produtos.filter(p=>p.ativo!==false), q = semAcento(CAT.q.trim()), ws = q ? q.split(/\s+/) : [];
  let l = P.filter(p=>!ws.length || ws.every(w=>semAcento(p.nome+' '+(p.codigo||'')+' '+(p.sku||'')+' '+(p.categoria||'')).includes(w)));
  if(CAT.filtro==='sem') l = l.filter(p=>!p.foto); else if(CAT.filtro==='com') l = l.filter(p=>p.foto);
  else if(CAT.filtro==='estoque'){ const tem = new Set(estD().saldos.filter(s=>s.qtd>0).map(s=>s.produto_id)); l = l.filter(p=>tem.has(p.id)); }
  return l.sort((a,b)=>a.nome.localeCompare(b.nome));
}
function estCatalogo(){
  const P = pdvD().produtos.filter(p=>p.ativo!==false), com = P.filter(p=>p.foto).length, pct = P.length ? Math.round(com/P.length*100) : 0;
  const l = catLista(), link = location.origin + location.pathname + '#produtos';
  return `<div class="cartao pad">
    <div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><h2 style="margin:0;font-size:19px">📸 Produtos</h2>
      <div class="linha" style="gap:6px"><button class="btn p" onclick="catCopiarLink()" title="${esc(link)}"><i class="ti ti-link"></i> Link</button><button class="btn ouro" onclick="novoProduto()"><i class="ti ti-plus"></i> Produto novo</button></div></div>
    <div class="cat-topo"><div class="cat-barra"><i style="width:${pct}%"></i></div><span class="suave" style="font-size:13px"><b>${com}</b> de ${P.length} com foto (${pct}%)</span></div>
    <div class="cnt-scan" style="margin-bottom:8px"><input class="inp" id="cat-q" placeholder="Buscar por nome ou código…" value="${esc(CAT.q)}" oninput="CAT.q=this.value;CAT.lim=60;catPintar()" onkeydown="if(event.key==='Enter')catEnter()">
      <button class="btn" onclick="estCamera(catCodigo,'Achar produto pela câmera')"><i class="ti ti-barcode"></i></button></div>
    <div class="est-lojas" style="margin-bottom:10px">${[['todos','Todos'],['sem','📷 Sem foto ('+(P.length-com)+')'],['com','Com foto'],['estoque','Com estoque']].map(([k,n])=>`<button class="${CAT.filtro===k?'on':''}" onclick="CAT.filtro='${k}';CAT.lim=60;render()">${n}</button>`).join('')}</div>
    ${CAT.filtro==='sem'&&P.length-com?`<p class="suave" style="font-size:13px;margin:0 0 10px">Toque no produto, tire a foto com fundo claro e pronto. Ele sai desta lista na hora.</p>`:''}
    <div id="cat-grade">${catGradeHtml(l)}</div></div>`;
}
function catGradeHtml(l){
  if(!l.length) return `<p class="suave" style="text-align:center;margin:18px 0">${CAT.filtro==='sem'?'🎉 Todos os produtos já têm foto!':'Nada encontrado.'}</p>`;
  return `<div class="cat-grade">${l.slice(0,CAT.lim).map(p=>`<button class="cat-item" onclick="${p.foto?`catAbrir('${p.id}')`:`fotoTirar('${p.id}')`}">
      ${p.foto?`<img class="ft" src="${esc(fotoUrl(p,240))}" loading="lazy" alt="">`:`<span class="semft"><i class="ti ti-camera-plus"></i>Tirar foto</span>`}
      <b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'sem código')}</small><span class="pr">${brl2(precoDe(p))}</span></button>`).join('')}</div>
    ${l.length>CAT.lim?`<button class="btn largo" style="margin-top:12px" onclick="CAT.lim+=90;catPintar()">Mostrar mais (${l.length-CAT.lim})</button>`:''}`;
}
function catPintar(){ const g = $('#cat-grade'); if(g) g.innerHTML = catGradeHtml(catLista()); else render(); }
function catEnter(){ const p = estAcharCodigo(CAT.q.trim()); if(p){ CAT.q=''; render(); catAbrir(p.id); } }
function catCodigo(cod){
  estCameraFechar(); const p = estAcharCodigo(cod);
  if(p){ estBip(true); return catAbrir(p.id); }
  estBip(false);
  if(confirm('O código '+cod+' não está cadastrado. Cadastrar produto novo com ele?')) novoProduto({codigo:cod});
}
function catCopiarLink(){
  const link = location.origin + location.pathname + '#produtos';
  try{ navigator.clipboard.writeText(link); toast('Link copiado ✔ — mande no grupo da equipe'); }catch(e){ prompt('Copie o link:', link); }
}
function catAbrir(id){
  const p = estProd(id); if(!p) return;
  const locs = estLocais().map(l=>[l, estQtdDe(p.id, l.id)]).filter(([l,q])=>q!=null);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">${esc(p.nome)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${p.foto?`<img class="cat-foto-g" src="${esc(fotoUrl(p,640))}" alt="">`:`<div class="np-foto" onclick="fotoTirar('${p.id}',()=>catAbrir('${p.id}'))"><i class="ti ti-camera-plus"></i>Tirar foto</div>`}
      <div class="linha entre" style="margin:12px 0 4px"><span class="suave">${esc(p.codigo||p.sku||'sem código')}${p.categoria?' · '+esc(p.categoria):''}</span><b style="font-size:20px;color:var(--dourado2)">${brl2(precoDe(p))}</b></div>
      ${locs.length?`<div class="est-lojas" style="margin:8px 0 12px">${locs.map(([l,q])=>`<span class="selo ${q>0?'ok':''}">${esc(l.nome)}: <b>${estFmt(q)}</b></span>`).join(' ')}</div>`:''}
      <div class="g2"><button class="btn" onclick="fotoTirar('${p.id}',()=>catAbrir('${p.id}'))"><i class="ti ti-camera"></i> ${p.foto?'Trocar foto':'Tirar foto'}</button>
        ${estAdmin()?`<button class="btn" onclick="fecharModal();admPdvProduto('${p.id}')"><i class="ti ti-pencil"></i> Editar</button>`:`<button class="btn" onclick="fecharModal()">Fechar</button>`}</div>
      ${estAdmin()&&p.foto?`<button class="btn p largo" style="margin-top:8px" onclick="catRemoverFoto('${p.id}')"><i class="ti ti-trash"></i> Tirar a foto deste produto</button>`:''}
    </div></div></div>`;
}
async function catRemoverFoto(id){
  if(!confirm('Remover a foto deste produto?')) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'fotoRemover', produto_id:id}); fecharModal(); render(); toast('Foto removida'); }catch(e){ toast(e.message, true); }
}

/* ───────── produto novo (rápido, pelo celular) ───────── */
var NP = null;
function novoProduto(pre={}){
  NP = {codigo:'', nome:'', preco:'', categoria:'', qtd:'', local:estLojaPadrao(), img:'', ...pre};
  novoPintar();
}
function novoPintar(){
  const cats = [...new Set(pdvD().produtos.flatMap(catsDe))].sort();
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">➕ Produto novo</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="np-foto" onclick="novoFoto()">${NP.img?`<img src="${NP.img}" alt="">`:`<i class="ti ti-camera-plus"></i>Tirar foto do produto<small class="apagado" style="font-weight:600">fundo claro, produto inteiro</small>`}</div>
      <div class="campo"><label>Código de barras</label><div class="linha" style="gap:6px"><input class="inp num cresce" id="np-cod" inputmode="numeric" value="${esc(NP.codigo)}" placeholder="bipe ou digite (se tiver)" oninput="NP.codigo=this.value.trim()" onchange="novoChecarCodigo()">
        <button class="btn" onclick="estCamera(novoCodigo,'Ler o código do produto')"><i class="ti ti-barcode"></i></button></div></div>
      <div class="campo"><label>Nome do produto</label><input class="inp" value="${esc(NP.nome)}" placeholder="ex.: Gel excitante Xana Loka 15g" oninput="NP.nome=this.value"></div>
      <div class="g2"><div class="campo"><label>Preço de venda (R$)</label><input class="inp num" inputmode="decimal" value="${esc(NP.preco)}" placeholder="0,00" oninput="NP.preco=this.value"></div>
        <div class="campo"><label>Categoria</label><input class="inp" list="np-cats" value="${esc(NP.categoria)}" placeholder="opcional" oninput="NP.categoria=this.value"><datalist id="np-cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div></div>
      <div class="campo"><label>Quantas peças chegaram? <span class="apagado">(opcional — já entra no estoque)</span></label><input class="inp num" inputmode="numeric" value="${esc(NP.qtd)}" placeholder="0" oninput="NP.qtd=this.value"></div>
      <div class="campo"><label>Onde vai ficar</label>${estChipsLocal(NP.local, "NP.local='$ID';novoPintar()")}</div>
      <button class="btn pri largo" id="btn-np" onclick="novoSalvar()"><i class="ti ti-device-floppy"></i> Cadastrar produto</button>
    </div></div></div>`;
}
async function novoFoto(){ const img = await fotoEscolher(); if(img){ NP.img = img; novoPintar(); } }
function novoCodigo(cod){ estCameraFechar(); NP.codigo = String(cod).trim(); estBip(true); novoPintar(); novoChecarCodigo(); }
function novoChecarCodigo(){
  const p = NP.codigo && estAcharCodigo(NP.codigo);
  if(p){ estBip(false); if(confirm('Esse código já é do produto:\n\n'+p.nome+'\n\nAbrir ele?')){ catAbrir(p.id); } }
}
async function novoSalvar(mesmoAssim){
  if(!NP.img && !confirm('Cadastrar sem foto? (dá pra tirar depois)')) return;
  const b = $('#btn-np'); b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Cadastrando…';
  try{
    const d = await estApi('produtoNovo', {nome:NP.nome, preco:NP.preco, codigo:NP.codigo, categoria:NP.categoria, qtd:NP.qtd, local:NP.local, img:NP.img, mesmoAssim:!!mesmoAssim});
    estAposSalvar(d); const p = d.produtoFeito;
    fecharModal(); render(); chuvaConfete();
    toast(`${p?.nome||'Produto'} cadastrado ✔${p?.erroFoto?' (a foto não subiu — tire de novo)':''}`, !!p?.erroFoto);
  }catch(e){
    if(/Já existe/.test(e.message) && confirm(e.message+'\n\nCadastrar mesmo assim?')) return novoSalvar(true);
    toast(e.message, true); b.disabled = false; b.innerHTML = '<i class="ti ti-device-floppy"></i> Cadastrar produto';
  }
}

/* ───────── link direto: …/ponto/#produtos ───────── */
const _telaPortalV13 = telaPortal;
telaPortal = function telaPortal(){
  if(location.hash==='#produtos' && S.sess?.dados && !window._hashFeito){ window._hashFeito = true; S.portalTab = 'estoque'; S.estAba = 'produtos'; }
  return _telaPortalV13();
};
const _telaAdminV13 = typeof telaAdmin==='function' ? telaAdmin : null;
if(_telaAdminV13) telaAdmin = function telaAdmin(){
  if(location.hash==='#produtos' && S.adm && !window._hashFeitoAdm){ window._hashFeitoAdm = true; S.adm.tab = 'estoque'; S.adm.estSub = 'produtos'; }
  return _telaAdminV13.apply(this, arguments);
};
const _itensBuscaV13 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV13(), adm = !!(S.adm && S.tela==='admin');
  if(adm || S.sess) r.unshift({t:'Produtos e fotos', s:'Catálogo com fotos · cadastrar produto novo', i:'ti-photo', go:()=>{ if(adm){ S.adm.tab='estoque'; S.adm.estSub='produtos'; } else { S.tela='portal'; S.portalTab='estoque'; S.estAba='produtos'; } render(); }});
  return r;
};

/* ───────── aba "Produtos" no Estoque (equipe e administração) ───────── */
portalEstoque = function portalEstoque(){
  const k = estContadores(), aba = S.estAba || (k.cont ? 'contar' : 'receber');
  const abas = [['receber','ti-truck-delivery','Receber'],['contar','ti-scan','Contar',k.cont],['produtos','ti-photo','Produtos'],['transferir','ti-arrows-exchange','Transferir',k.chegando],['repor','ti-basket','Repor',k.repor],['saida','ti-package-export','Saída'],['consulta','ti-search','Consultar']];
  const corpo = ({receber:estTela, contar:estContar, produtos:estCatalogo, transferir:estTransferir, repor:estRepor, saida:estSaidaTela, consulta:()=>estConsulta().replace('<h2 class="secao">','<h2 class="secao" style="margin-top:0">')})[aba]();
  return `<div class="est-hub">${abas.map(([id,i,n,b])=>`<button class="${aba===id?'on':''}" onclick="S.estAba='${id}';render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>${corpo}`;
};
const _admEstoqueV13 = admEstoque;
admEstoque = function admEstoque(){
  let h;
  if(S.adm.estSub==='produtos'){ S.adm.estSub = 'config'; try{ h = _admEstoqueV13(); } finally { S.adm.estSub = 'produtos'; }
    h = h.slice(0, h.indexOf('</div>', h.indexOf('class="pdv-sub"')) + 6).replace('class="on" onclick="S.adm.estSub=\'config\'', 'class="" onclick="S.adm.estSub=\'config\'') + estCatalogo();
  } else h = _admEstoqueV13();
  return h.replace('<div class="pdv-sub">', `<div class="pdv-sub"><button class="${S.adm.estSub==='produtos'?'on':''}" onclick="S.adm.estSub='produtos';render()"><i class="ti ti-photo"></i>Produtos e fotos</button>`);
};

/* ───────── foto na busca e na lista da contagem ───────── */
cntResHtml = function cntResHtml(res){ return res.map(p=>`<button class="est-prod" onclick="cntLer('${p.id}')">${pIco(p,40)}<div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'')}</small></div><b>+${CNT.mult}</b></button>`).join(''); };
estListaResHtml = function estListaResHtml(nome, res, loc){ return res.map(p=>`<button class="est-prod" onclick="estListaAdd('${nome}','${p.id}')">${pIco(p,40)}<div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'')}${loc?' · tem '+estFmt(estQtdLocal(p.id,loc)):''}</small></div><i class="ti ti-plus apagado"></i></button>`).join(''); };
const _estContarV13 = estContar;
estContar = function estContar(){
  let h = _estContarV13(); if(!CNT) return h;
  let k = 0;
  h = h.replace(/<span class="q">([^<]*)<\/span><div class="nm">/g, (m, q)=>{ const u = CNT.ult[k], p = u && estProd(u.produto_id), kk = k++;
    return `<span class="q">${q}</span>${pIco(p, kk===0?56:38)}<div class="nm">`; });
  return h.replace(/<button class="btn p" onclick="cntDesfazer\((\d+)\)">/g, (m, n)=>{ const u = CNT.ult[+n], p = u && estProd(u.produto_id);
    return (p && !p.foto && +n<3 ? `<button class="btn p semfoto" title="Tirar foto" onclick="fotoTirar('${p.id}')"><i class="ti ti-camera-plus"></i></button>` : '') + m; });
};
