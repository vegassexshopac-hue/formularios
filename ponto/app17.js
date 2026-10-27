/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v15d (app17.js): CATÁLOGO DO SITE (CSV da Nuvemshop)
   Administração › Estoque › 📸 Produtos › "Categorias do site (CSV)":
   • escolhe o CSV exportado da Nuvemshop (Produtos › Exportar);
   • o navegador lê e cruza com os produtos do portal: código de barras / SKU,
     depois nome igual (com a cor/variação), depois nome parecido (desmarcado);
   • monta a prévia: CATEGORIA do site, NOME bonito do site (só onde o portal está
     em MAIÚSCULA), DESCRIÇÃO, PREÇO do site onde o portal tem preço sem vírgula,
     e "arrumar maiúsculas" para quem não está no site;
   • a Madu desmarca o que não quiser e aprova → grava em lotes (admEstoque catalogoLote).
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.ns-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin:10px 0}
.ns-res div{background:rgba(0,0,0,.035);border-radius:12px;padding:8px 10px;font-size:12px;color:var(--creme3)}
.ns-res b{display:block;font-size:20px;color:var(--creme)}
.ns-op{display:flex;flex-direction:column;gap:6px;margin:8px 0 12px}
.ns-op label{display:flex;gap:8px;align-items:flex-start;font-size:14px;cursor:pointer}
.ns-op input{margin-top:3px}
.ns-tab{width:100%;border-collapse:collapse;font-size:12.5px}
.ns-tab td{padding:6px 4px;border-top:1px solid var(--linha);vertical-align:top}
.ns-tab .de{color:var(--creme3);text-decoration:line-through}
.ns-tab .para{font-weight:700}
.ns-tag{display:inline-block;font-size:10.5px;font-weight:800;padding:1px 7px;border-radius:99px;background:rgba(245,181,36,.2);color:#8a5d00;margin-left:4px}
.ns-tag.ok{background:rgba(47,179,107,.15);color:#1f7a49}
.ns-lista{max-height:46vh;overflow:auto;border:1px solid var(--linha);border-radius:12px;padding:0 8px}
`; document.head.appendChild(st); })();

/* categorias que são "vitrine" no site (não servem como categoria do produto) e a ordem de preferência das reais */
const NS_VITRINES = ['todos os produtos','novidades','um toque de amor proprio','promocoes','promoções','ofertas','mais vendidos','lancamentos','destaques'];
const NS_PRIORIDADE = ['vibradores e proteses','lingeries e fantasias','linha bdsm','cosmeticos','acessorios','tecnicas da madu'];

/* CSV com aspas, ; e quebras de linha dentro das descrições */
function nsCsv(t){
  const sep = (t.split('\n')[0].match(/;/g)||[]).length >= (t.split('\n')[0].match(/,/g)||[]).length ? ';' : ',';
  const rows = []; let row = [], f = '', q = false;
  for(let i=0;i<t.length;i++){
    const c = t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){ f+='"'; i++; } else q = false; } else f += c; continue; }
    if(c==='"') q = true; else if(c===sep){ row.push(f); f=''; } else if(c==='\n'){ row.push(f.replace(/\r$/,'')); rows.push(row); row=[]; f=''; } else f += c;
  }
  if(f || row.length){ row.push(f); rows.push(row); }
  return rows.filter(r=>r.some(x=>x.trim()));
}
async function nsLerArquivo(file){
  const buf = await file.arrayBuffer();
  try{ return new TextDecoder('utf-8', {fatal:true}).decode(buf); }catch(e){ return new TextDecoder('windows-1252').decode(buf); }
}
const nsN = s => semAcento(String(s||'')).replace(/[^a-z0-9]+/g,' ').trim();
function nsTexto(html){
  const d = document.createElement('div'); d.innerHTML = String(html||'').replace(/<(br|\/p|\/div|\/li|\/h\d)\s*\/?>/gi,'\n');
  return (d.textContent||'').replace(/ /g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
}
function nsCategoria(lista){
  const cats = String(lista||'').split(',').map(s=>s.trim()).filter(Boolean);
  const reais = cats.filter(c=>!NS_VITRINES.includes(nsN(c)));
  if(!reais.length) return '';
  reais.sort((a,b)=>{ const ia = NS_PRIORIDADE.indexOf(nsN(a)), ib = NS_PRIORIDADE.indexOf(nsN(b)); return (ia<0?99:ia)-(ib<0?99:ib); });
  return reais[0];
}
function nsMaiusculo(s){ const t = String(s||''); return /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4}/.test(t) && t===t.toUpperCase(); }
function nsTitulo(s){ return typeof flTitulo==='function' ? flTitulo(s) : String(s||'').toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase()); }

/* lê o CSV e devolve a "loja do site" indexada */
function nsMontar(rows){
  const cab = rows[0].map(h=>nsN(h)), col = n => cab.indexOf(nsN(n));
  const C = {nome:col('Nome'), cats:col('Categorias'), v1:col('Valor da variação 1'), v2:col('Valor da variação 2'), v3:col('Valor da variação 3'), preco:col('Preço'), promo:col('Preço promocional'), sku:col('SKU'), ean:col('Código de barras'), desc:col('Descrição')};
  if(C.nome<0 || C.cats<0) throw new Error('Esse arquivo não parece o CSV de produtos da Nuvemshop (faltam as colunas Nome e Categorias).');
  const pais = [], linhas = []; let pai = null;
  rows.slice(1).forEach(r=>{
    const g = i => i>=0 ? String(r[i]||'').trim() : '';
    if(g(C.nome)){ pai = {nome:g(C.nome), categoria:nsCategoria(g(C.cats)), descricao:nsTexto(g(C.desc)), linhas:[]}; pais.push(pai); }
    if(!pai) return;
    const L = {pai, sku:g(C.sku), ean:g(C.ean).replace(/\D/g,''), varia:[g(C.v1),g(C.v2),g(C.v3)].filter(Boolean).join(' / '), preco:Number(String(g(C.preco)).replace(',','.'))||0};
    pai.linhas.push(L); linhas.push(L);
  });
  const porCod = {}, porNome = {};
  linhas.forEach(L=>{ if(L.sku) porCod[L.sku] = porCod[L.sku] || L; if(L.ean) porCod[L.ean] = porCod[L.ean] || L;
    porNome[nsN(L.pai.nome)] = porNome[nsN(L.pai.nome)] || L.pai.linhas[0];
    if(L.varia) porNome[nsN(L.pai.nome+' '+L.varia)] = porNome[nsN(L.pai.nome+' '+L.varia)] || L; });
  return {pais, linhas, porCod, porNome};
}
function nsParecido(nome, site){
  const A = new Set(nsN(nome).split(' ').filter(w=>w.length>2)); if(A.size<2) return null;
  let melhor = null, nota = 0, empate = false;
  site.pais.forEach(p=>{ const B = new Set(nsN(p.nome).split(' ').filter(w=>w.length>2)); if(!B.size) return;
    let i = 0; A.forEach(w=>{ if(B.has(w)) i++; }); const j = i / (A.size + B.size - i);
    if(j > nota + .001){ nota = j; melhor = p; empate = false; } else if(Math.abs(j-nota) <= .001) empate = true; });
  return nota >= .6 && !empate ? {pai:melhor, nota} : null;
}

/* cruza o catálogo do portal com o site e monta as mudanças */
function nsCruzar(site){
  const P = pdvD().produtos, res = [];
  const contaPai = new Map();
  P.forEach(p=>{
    let L = null, como = '';
    for(const k of [p.codigo, p.sku].filter(Boolean)){ if(site.porCod[k]){ L = site.porCod[k]; como = 'código'; break; } }
    if(!L){ const n = nsN(p.nome).replace(/\b(\d{2,4})$/,'').trim(); L = site.porNome[nsN(p.nome)] || site.porNome[n] || null; if(L) como = 'nome'; }
    let pai = L ? L.pai : null, nota = 1;
    if(!pai){ const z = nsParecido(p.nome, site); if(z){ pai = z.pai; L = z.pai.linhas[0]; como = 'parecido'; nota = z.nota; } }
    if(pai) contaPai.set(pai, (contaPai.get(pai)||0)+1);
    res.push({p, L, pai, como, nota});
  });
  res.forEach(r=>{
    const p = r.p, m = {id:p.id, nome:p.nome, como:r.como, nota:r.nota, mud:{}};
    if(r.pai){
      if(r.pai.categoria && r.pai.categoria !== (p.categoria||'')) m.mud.categoria = r.pai.categoria;
      if(nsMaiusculo(p.nome)){
        let novo = r.pai.nome;
        const variaDoPortal = r.L && r.L.varia && contaPai.get(r.pai) > 1;
        if(variaDoPortal) novo += ' · ' + nsTitulo(r.L.varia);
        else if(contaPai.get(r.pai) > 1){ const resto = nsN(p.nome).replace(nsN(r.pai.nome),'').trim(); if(resto) novo += ' · ' + nsTitulo(resto); }
        if(novo !== p.nome) m.mud.nome = novo;
      }
      if(r.pai.descricao) m.mud.descricao = r.pai.descricao;
      const precoSite = r.L && r.L.preco > 0 ? r.L.preco : 0;
      if(p.preco >= 1000 && precoSite > 0 && precoSite < 1000 && Math.abs(precoSite - p.preco) > .004) m.mud.preco = precoSite;
    } else if(nsMaiusculo(p.nome)){ m.semSite = true; m.mud.nomeTitulo = nsTitulo(p.nome); }
    res.push && (r.m = m);
  });
  return res.map(r=>r.m);
}

var NSC = null;   // {arquivo, site, itens, op:{categoria,nome,descricao,preco,titulo,parecidos}, fora:Set, ver}
function nsAbrir(){
  NSC = {arquivo:'', site:null, itens:[], op:{categoria:true, nome:true, descricao:true, preco:true, titulo:true, parecidos:false}, fora:new Set(), ver:'categoria', gravando:false};
  nsPintar();
}
function nsPintar(){
  const N = NSC;
  let corpo;
  if(!N.site){
    corpo = `<p class="suave" style="margin:0 0 10px">Na Nuvemshop: <b>Produtos › Exportar</b> (CSV). Escolha o arquivo aqui — o portal cruza com os produtos pelo código de barras/SKU e pelo nome e mostra tudo antes de gravar.</p>
      <label class="btn ouro largo" style="cursor:pointer"><i class="ti ti-file-upload"></i> Escolher o CSV da Nuvemshop<input type="file" accept=".csv,text/csv" style="display:none" onchange="nsArquivo(this.files[0])"></label>
      ${N.erro?`<div class="nota bad" style="margin-top:10px"><i class="ti ti-alert-triangle"></i><div>${esc(N.erro)}</div></div>`:''}`;
  } else {
    const I = N.itens, c = k => I.filter(m=>nsAtivo(m,k)).length;
    const casados = I.filter(m=>m.como==='código'||m.como==='nome').length, parecidos = I.filter(m=>m.como==='parecido').length, sem = I.filter(m=>!m.como).length;
    const total = new Set(I.filter(m=>['categoria','nome','descricao','preco','titulo'].some(k=>N.op[k] && nsAtivo(m,k))).map(m=>m.id)).size;
    const abas = [['categoria','Categoria'],['nome','Nome do site'],['preco','Preço'],['titulo','Maiúsculas'],['descricao','Descrição']];
    const vis = I.filter(m=>nsAtivo(m, N.ver, true));
    corpo = `<div class="suave" style="font-size:13px">${esc(N.arquivo)} · ${N.site.pais.length} produtos no site</div>
      <div class="ns-res"><div><b>${casados}</b>casados por código/nome</div><div><b>${parecidos}</b>por nome parecido</div><div><b>${sem}</b>não estão no site</div><div><b>${total}</b>vão mudar</div></div>
      <div class="ns-op">
        <label><input type="checkbox" ${N.op.categoria?'checked':''} onchange="NSC.op.categoria=this.checked;nsPintar()"> <span><b>Categoria do site</b> em ${c('categoria')} produto(s)</span></label>
        <label><input type="checkbox" ${N.op.nome?'checked':''} onchange="NSC.op.nome=this.checked;nsPintar()"> <span><b>Nome bonito do site</b> no lugar do nome em MAIÚSCULA (${c('nome')})</span></label>
        <label><input type="checkbox" ${N.op.preco?'checked':''} onchange="NSC.op.preco=this.checked;nsPintar()"> <span><b>Preço do site</b> onde o portal tem preço sem vírgula (${c('preco')})</span></label>
        <label><input type="checkbox" ${N.op.titulo?'checked':''} onchange="NSC.op.titulo=this.checked;nsPintar()"> <span><b>Arrumar maiúsculas</b> de quem não está no site (${c('titulo')})</span></label>
        <label><input type="checkbox" ${N.op.descricao?'checked':''} onchange="NSC.op.descricao=this.checked;nsPintar()"> <span><b>Descrição</b> do site (${c('descricao')})</span></label>
        <label><input type="checkbox" ${N.op.parecidos?'checked':''} onchange="NSC.op.parecidos=this.checked;nsPintar()"> <span>Incluir também os <b>${parecidos} casados por nome parecido</b> <span class="apagado">(confira na lista — vêm com a etiqueta "parecido")</span></span></label>
      </div>
      <div class="est-lojas" style="margin-bottom:8px">${abas.map(([k,n])=>`<button class="${N.ver===k?'on':''}" onclick="NSC.ver='${k}';nsPintar()">${n} (${c(k)})</button>`).join('')}</div>
      <div class="ns-lista"><table class="ns-tab">${vis.slice(0,400).map(m=>nsLinha(m)).join('') || '<tr><td class="suave" style="padding:14px">Nada aqui.</td></tr>'}</table>${vis.length>400?`<p class="apagado" style="text-align:center">… e mais ${vis.length-400}</p>`:''}</div>
      <p class="apagado" style="font-size:12px;margin:8px 0 0">Desmarque a linha que não quiser mudar. Nada é gravado até você tocar em Aplicar.</p>
      <button class="btn ouro largo" style="margin-top:10px" id="ns-ok" ${total&&!N.gravando?'':'disabled'} onclick="nsAplicar()">${N.gravando?'<span class="gira"></span> Gravando… '+N.gravando:`<i class="ti ti-check"></i> Aplicar em ${total} produto(s)`}</button>`;
  }
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this&&!NSC.gravando)fecharModal()"><div class="modal" style="max-width:760px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">🛍️ Catálogo do site (CSV da Nuvemshop)</h3><button class="icone" aria-label="Fechar" onclick="if(!NSC.gravando)fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}</div></div></div>`;
}
function nsAtivo(m, k, ignorarOp){
  if(!ignorarOp && !NSC.op[k]) return false;
  if(m.como==='parecido' && !NSC.op.parecidos) return false;
  if(NSC.fora.has(m.id+'|'+k)) return ignorarOp ? (k==='titulo'?'nomeTitulo' in m.mud:k in m.mud) : false;
  return k==='titulo' ? 'nomeTitulo' in m.mud : k in m.mud;
}
function nsLinha(m){
  const k = NSC.ver, fora = NSC.fora.has(m.id+'|'+k);
  const de = {categoria: esc(pdvD().produtos.find(p=>p.id===m.id)?.categoria||'—'), nome: esc(m.nome), preco: brl2(pdvD().produtos.find(p=>p.id===m.id)?.preco||0), titulo: esc(m.nome), descricao: ''}[k];
  const para = {categoria: esc(m.mud.categoria), nome: esc(m.mud.nome), preco: brl2(m.mud.preco), titulo: esc(m.mud.nomeTitulo), descricao: esc(String(m.mud.descricao||'').slice(0,140))+(String(m.mud.descricao||'').length>140?'…':'')}[k];
  const tag = m.como==='parecido' ? `<span class="ns-tag">parecido</span>` : m.como ? `<span class="ns-tag ok">${m.como}</span>` : '';
  return `<tr><td style="width:26px"><input type="checkbox" ${fora?'':'checked'} onchange="nsFora('${m.id}','${k}',!this.checked)"></td>
    <td>${k==='nome'||k==='titulo'?'':`<b>${esc(m.nome)}</b>${tag}<br>`}${de?`<span class="de">${de}</span> → `:''}<span class="para">${para}</span>${(k==='nome'||k==='titulo')?tag:''}</td></tr>`;
}
function nsFora(id, k, sim){ if(sim) NSC.fora.add(id+'|'+k); else NSC.fora.delete(id+'|'+k); nsPintar(); }
async function nsArquivo(f){
  if(!f) return;
  try{
    const t = await nsLerArquivo(f), rows = nsCsv(t);
    NSC.site = nsMontar(rows); NSC.arquivo = f.name; NSC.itens = nsCruzar(NSC.site); NSC.erro = '';
  }catch(e){ NSC.erro = e.message; NSC.site = null; }
  nsPintar();
}
async function nsAplicar(){
  const N = NSC, porId = {};
  N.itens.forEach(m=>{
    const o = {id:m.id}; let tem = false;
    if(nsAtivo(m,'categoria')){ o.categoria = m.mud.categoria; tem = true; }
    if(nsAtivo(m,'nome')){ o.nome = m.mud.nome; tem = true; }
    else if(nsAtivo(m,'titulo')){ o.nome = m.mud.nomeTitulo; tem = true; }
    if(nsAtivo(m,'descricao')){ o.descricao = m.mud.descricao; tem = true; }
    if(nsAtivo(m,'preco')){ o.preco = String(m.mud.preco); tem = true; }
    if(tem) porId[m.id] = o;
  });
  const lista = Object.values(porId); if(!lista.length) return;
  N.gravando = '0/' + lista.length; nsPintar();
  let feitos = 0;
  try{
    for(let i=0;i<lista.length;i+=150){
      const r = await api('admEstoque', {...S.adm.cred, op:'catalogoLote', lista: lista.slice(i, i+150), origem: N.arquivo});
      feitos += r.alterados || 0; N.gravando = Math.min(i+150, lista.length) + '/' + lista.length; nsPintar();
    }
    S.adm.dados = await api('admDados', S.adm.cred);
    N.gravando = false; fecharModal(); render(); try{ chuvaConfete(); }catch(e){}
    toast(`Catálogo atualizado ✔ ${feitos} produto(s)`);
  }catch(e){ N.gravando = false; nsPintar(); toast((feitos?feitos+' gravados, mas parou: ':'')+e.message, true); }
}

/* botão na tela 📸 Produtos da administração */
const _estCatalogoV17 = estCatalogo;
estCatalogo = function(){
  const h = _estCatalogoV17();
  if(!estAdmin()) return h;
  return h.replace('<button class="btn ouro" onclick="novoProduto()">', '<button class="btn" onclick="nsAbrir()" title="Categorias, nomes, descrição e preços a partir do CSV da Nuvemshop"><i class="ti ti-building-store"></i> Catálogo do site (CSV)</button><button class="btn ouro" onclick="novoProduto()">');
};
