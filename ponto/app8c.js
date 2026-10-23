/* ═════════════════════ ADMINISTRAÇÃO › PDV ═════════════════════ */
function admPDV(){
  const sub = S.adm.pdvSub || 'vendas', P = pdvD();
  const corpo = ({vendas:admPdvVendas, produtos:admPdvProdutos, metas:admPdvMetas, regras:admPdvRegras})[sub]();
  return `${P.semServidor?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem o PDV.</b> Abra o Apps Script, crie o arquivo <b>PDV</b>, cole o código e publique uma nova versão. ${P.erro?'<br>Erro: '+esc(P.erro):''}</div></div>`:''}
    <div class="pdv-sub">${[['vendas','ti-receipt','Vendas'],['produtos','ti-package','Produtos'],['metas','ti-target-arrow','Metas por vendedora'],['regras','ti-adjustments','Regras do PDV']].map(([k,i,n])=>`<button class="${sub===k?'on':''}" onclick="S.adm.pdvSub='${k}';render()"><i class="ti ${i}"></i>${n}</button>`).join('')}</div>${corpo}`;
}
function admPdvVendas(){
  const A = S.adm, P = pdvD(), dia = A.pdvDia || A.dados.hoje, f = A.pdvFiltro || {};
  const lista = P.vendas.filter(v=>v.data===dia && (!f.loja||v.loja===f.loja) && (!f.eid||v.colaboradora_id===f.eid)).sort((a,b)=>b.criada_em.localeCompare(a.criada_em));
  const ok = lista.filter(v=>v.status!=='cancelada'), tot = ok.reduce((s,v)=>s+v.total,0);
  const porPag = {}; ok.forEach(v=>porPag[v.pagamento]=(porPag[v.pagamento]||0)+v.total);
  const nomes = {}; A.dados.colaboradoras.forEach(c=>nomes[c.id]=c.nome);
  return `<div class="linha quebra" style="gap:8px;margin-bottom:12px">
      <input class="inp num" type="date" style="max-width:180px" value="${dia}" onchange="S.adm.pdvDia=this.value;render()">
      <select class="inp" style="max-width:170px" onchange="S.adm.pdvFiltro={...(S.adm.pdvFiltro||{}),loja:this.value};render()"><option value="">Todas as lojas</option>${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${f.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select>
      <select class="inp" style="max-width:200px" onchange="S.adm.pdvFiltro={...(S.adm.pdvFiltro||{}),eid:this.value};render()"><option value="">Todas as vendedoras</option>${A.dados.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>`<option value="${c.id}" ${f.eid===c.id?'selected':''}>${esc(primeiroNome(c.nome))}</option>`).join('')}</select>
      <button class="btn p" style="margin-left:auto" onclick="pdvExportar()"><i class="ti ti-download"></i> Exportar mês (CSV)</button></div>
    <div class="numeros"><div class="numero"><small>Total do dia</small><b class="num">${brl2(tot)}</b><span>${ok.length} venda(s)${lista.length-ok.length?' · '+(lista.length-ok.length)+' cancelada(s)':''}</span></div>
      <div class="numero"><small>Ticket médio</small><b class="num">${ok.length?brl2(tot/ok.length):'—'}</b><span>${ok.length?(ok.reduce((s,v)=>s+v.qtd_itens,0)/ok.length).toFixed(1).replace('.',',')+' peças por venda':''}</span></div>
      ${Object.entries(FORMAS).filter(([k])=>porPag[k]).map(([k,o])=>`<div class="numero"><small><i class="ti ${o.i}"></i> ${o.n}</small><b class="num">${brl2(porPag[k])}</b><span>para conferir no caixa</span></div>`).join('')}</div>
    <h2 class="secao">Vendas de ${ddmm(dia)} <small>toque para ver, imprimir ou cancelar</small></h2>
    <div class="tabela"><table><thead><tr><th>Hora</th><th>#</th><th>Loja</th><th>Vendedora</th><th>Itens</th><th>Pagamento</th><th>Total</th></tr></thead><tbody>
      ${lista.map(v=>`<tr class="clica ${v.status==='cancelada'?'cancelada':''}" onclick="admPdvVer('${v.id}')"><td>${v.hora}</td><td>${v.numero}</td><td>${esc(S.boot.lojas[v.loja]?.nome||v.loja)}</td><td>${esc(primeiroNome(nomes[v.colaboradora_id]||v.colaboradora))}</td><td style="max-width:280px;overflow:hidden;text-overflow:ellipsis">${esc(v.itens.map(i=>i.qtd+'× '+i.nome).join(', '))}</td><td>${FORMAS[v.pagamento]?.n||v.pagamento}${v.parcelas>1?' '+v.parcelas+'×':''}</td><td class="n num"><b>${brl2(v.total)}</b></td></tr>`).join('')||'<tr><td colspan="7" class="suave">Nenhuma venda no PDV neste dia.</td></tr>'}</tbody></table></div>`;
}
function admPdvVer(id){
  const v = pdvAchar(id); if(!v) return;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">Venda #${v.numero} · ${ddmm(v.data)} ${v.hora}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${v.status==='cancelada'?`<div class="nota bad" style="margin-bottom:12px"><i class="ti ti-ban"></i><div><b>Cancelada</b> por ${esc(v.cancelada_por)} em ${esc(quando(v.cancelada_em))}. Motivo: ${esc(v.motivo_cancel)}</div></div>`:''}
      <p class="suave" style="margin-bottom:10px">${esc(v.colaboradora)} · Loja ${esc(S.boot.lojas[v.loja]?.nome||v.loja)}${v.cliente?' · cliente '+esc(v.cliente):''}${v.cliente_tel?' · '+fmtTel(v.cliente_tel):''}</p>
      <div class="tabela"><table><thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead><tbody>${v.itens.map(i=>`<tr><td>${i.avulso?'➕ ':''}${esc(i.nome)}</td><td>${i.qtd}</td><td class="n num">${brl2(i.preco)}</td><td class="n num">${brl2(i.preco*i.qtd)}</td></tr>`).join('')}</tbody></table></div>
      <div style="margin:12px 0;font-size:15px">Subtotal ${brl2(v.subtotal)}${v.desconto?` · desconto <b class="neg">− ${brl2(v.desconto)}</b>`:''} · <b>Total ${brl2(v.total)}</b> · ${FORMAS[v.pagamento]?.n||v.pagamento}${v.parcelas>1?' '+v.parcelas+'×':''}${v.recebido?' · recebido '+brl2(v.recebido)+' · troco '+brl2(v.troco):''}${v.obs?'<br><span class="suave">'+esc(v.obs)+'</span>':''}</div>
      <div class="linha quebra" style="gap:8px"><button class="btn" onclick="pdvCupom('${v.id}')"><i class="ti ti-printer"></i> Imprimir cupom</button><button class="btn" onclick="pdvComprovante('${v.id}','${esc(v.cliente_tel||'')}')"><i class="ti ti-brand-whatsapp"></i> Comprovante</button>
      ${v.status!=='cancelada'?`<button class="btn" style="margin-left:auto;color:var(--bad)" onclick="admPdvCancelar('${v.id}')"><i class="ti ti-ban"></i> Cancelar venda</button>`:''}</div></div></div></div>`;
}
async function admPdvCancelar(id){
  const motivo = prompt('Motivo do cancelamento (fica registrado):'); if(!motivo || !motivo.trim()) return;
  try{ S.adm.dados = await api('admPdvCancelar', {...S.adm.cred, id, motivo}); fecharModal(); render(); toast('Venda cancelada ✔ Meta ajustada.'); }
  catch(e){ toast(e.message, true); }
}
function pdvExportar(){
  const P = pdvD(), ym = mesDe(S.adm.pdvDia || S.adm.dados.hoje);
  const q = v => /[";\n]/.test(String(v??'')) ? '"'+String(v).replace(/"/g,'""')+'"' : String(v??'');
  const head = 'data;hora;numero;loja;vendedora;itens;qtd;subtotal;desconto;total;pagamento;parcelas;cliente;status';
  const rows = P.vendas.filter(v=>v.data.startsWith(ym)).sort((a,b)=>a.criada_em.localeCompare(b.criada_em)).map(v=>[v.data,v.hora,v.numero,S.boot.lojas[v.loja]?.nome||v.loja,v.colaboradora,v.itens.map(i=>i.qtd+'x '+i.nome).join(' | '),v.qtd_itens,String(v.subtotal).replace('.',','),String(v.desconto).replace('.',','),String(v.total).replace('.',','),FORMAS[v.pagamento]?.n||v.pagamento,v.parcelas,v.cliente,v.status].map(q).join(';'));
  const blob = new Blob([String.fromCharCode(0xFEFF)+[head,...rows].join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vendas-pdv-${ym}.csv`; a.click();
}

/* produtos */
function admPdvProdutos(){
  const A = S.adm, P = pdvD(), q = semAcento(A.pdvQ||'');
  const lista = P.produtos.filter(p=>!q || semAcento(p.nome+' '+p.codigo+' '+p.sku+' '+p.categoria).includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  return `<div class="linha quebra" style="gap:8px;margin-bottom:12px">
      <input class="inp" style="max-width:340px" placeholder="Buscar no catálogo…" value="${esc(A.pdvQ||'')}" oninput="S.adm.pdvQ=this.value;clearTimeout(window._pq);window._pq=setTimeout(()=>{render();const i=document.querySelector('.pdv-sub ~ .linha input');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},250)">
      <button class="btn ouro" onclick="admPdvImportar()"><i class="ti ti-file-import"></i> Importar planilha</button>
      <button class="btn" onclick="admPdvProduto()"><i class="ti ti-plus"></i> Novo produto</button></div>
    ${!P.produtos.length?`<div class="nota info" style="margin-bottom:12px"><i class="ti ti-bulb"></i><div><b>Como trazer os ${'669'} produtos do site de uma vez:</b> Nuvemshop › Produtos › <b>Exportar lista de produtos</b> (CSV) › aqui em <b>Importar planilha</b>. Também aceita CSV do Gestão Fácil (com código de barras) ou colar direto do Excel. Se importar de novo depois, ele só atualiza preços e cria os novos — não duplica.</div></div>`:''}
    <div class="tabela"><table><thead><tr><th>Produto</th><th>Código</th><th>Categoria</th><th>Preço</th><th>Promo</th><th>No PDV</th></tr></thead><tbody>
      ${lista.slice(0,300).map(p=>`<tr class="clica" onclick="admPdvProduto('${p.id}')" style="${p.ativo?'':'opacity:.5'}"><td>${emojiDe(p)} ${esc(p.nome)}</td><td class="apagado">${esc(p.codigo||p.sku||'')}</td><td>${esc(p.categoria||'')}</td><td class="n num">${brl2(p.preco)}</td><td class="n num">${p.promo?brl2(p.promo):''}</td><td>${p.ativo?'<span class="selo ok">sim</span>':'<span class="selo">oculto</span>'}</td></tr>`).join('')||'<tr><td colspan="6" class="suave">Nenhum produto.</td></tr>'}</tbody></table></div>
    ${lista.length>300?`<p class="apagado" style="font-size:13px;margin-top:8px">Mostrando 300 de ${lista.length}. Use a busca.</p>`:''}`;
}
let PRD = null;
function admPdvProduto(id){
  const p = id ? pdvD().produtos.find(x=>x.id===id) : null;
  PRD = p ? {...p} : {id:'', nome:'', codigo:'', sku:'', categoria:'', preco:'', promo:'', ativo:true};
  const cats = [...new Set(pdvD().produtos.map(x=>x.categoria).filter(Boolean))].sort();
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${p?'Editar produto':'Novo produto'}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><div class="campo"><label>Nome</label><input class="inp" value="${esc(PRD.nome)}" oninput="PRD.nome=this.value"></div>
      <div class="g2"><div class="campo"><label>Código de barras</label><input class="inp num" value="${esc(PRD.codigo)}" oninput="PRD.codigo=this.value"></div><div class="campo"><label>SKU / referência</label><input class="inp" value="${esc(PRD.sku)}" oninput="PRD.sku=this.value"></div></div>
      <div class="campo"><label>Categoria</label><input class="inp" list="pdv-cats" value="${esc(PRD.categoria)}" oninput="PRD.categoria=this.value"><datalist id="pdv-cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="g2"><div class="campo"><label>Preço (R$)</label><input class="inp num" inputmode="decimal" value="${PRD.preco?String(PRD.preco).replace('.',','):''}" oninput="PRD.preco=this.value"></div><div class="campo"><label>Preço promocional</label><input class="inp num" inputmode="decimal" value="${PRD.promo?String(PRD.promo).replace('.',','):''}" oninput="PRD.promo=this.value" placeholder="opcional"></div></div>
      <label class="linha" style="gap:8px;margin-bottom:14px;font-weight:700"><input type="checkbox" ${PRD.ativo?'checked':''} onchange="PRD.ativo=this.checked"> Aparece no PDV</label>
      <button class="btn pri largo" id="btn-prd" onclick="admPdvSalvarProduto()"><i class="ti ti-device-floppy"></i> Salvar</button></div></div></div>`;
}
async function admPdvSalvarProduto(){
  const b = $('#btn-prd'); b.disabled = true;
  try{ S.adm.dados = await api('admProduto', {...S.adm.cred, produto:PRD}); fecharModal(); render(); toast('Produto salvo ✔'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}
let IMP = null;
function admPdvImportar(){
  IMP = {lista:[], origem:''};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">Importar produtos</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="font-size:14px;margin-bottom:12px">Escolha o arquivo <b>CSV</b> exportado da Nuvemshop (Produtos › Exportar) ou do Gestão Fácil. Planilha do Excel? Salve como CSV, ou copie as colunas e cole abaixo.</p>
      <div class="campo"><label>Arquivo CSV</label><input class="inp" type="file" accept=".csv,.txt,text/csv" style="padding-top:10px" onchange="admPdvLerArquivo(this)"></div>
      <div class="campo"><label>…ou cole aqui (com a linha de títulos: Nome, Preço, Código…)</label><textarea class="inp" id="imp-txt" placeholder="Nome;Preço;Código de barras;Categoria" oninput="admPdvPrever(this.value,'colado')"></textarea></div>
      <div id="imp-prev"></div></div></div></div>`;
}
async function admPdvLerArquivo(inp){
  const f = inp.files[0]; if(!f) return;
  const buf = await f.arrayBuffer();
  let txt; try{ txt = new TextDecoder('utf-8', {fatal:true}).decode(buf); }catch(e){ txt = new TextDecoder('windows-1252').decode(buf); }
  admPdvPrever(txt, /nuvem|tiendanube/i.test(f.name) ? 'nuvemshop' : 'arquivo');
}
function lerCSV(txt){
  txt = txt.replace(/^﻿/,'');
  const l1 = txt.split(/\r?\n/)[0]||'';
  const sep = ['\t',';',','].map(s=>[s, l1.split(s).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows = []; let row = [], cel = '', aspas = false;
  for(let i=0;i<txt.length;i++){
    const ch = txt[i];
    if(aspas){ if(ch==='"'){ if(txt[i+1]==='"'){ cel+='"'; i++; } else aspas=false; } else cel+=ch; continue; }
    if(ch==='"') aspas = true;
    else if(ch===sep){ row.push(cel); cel=''; }
    else if(ch==='\n' || ch==='\r'){ if(ch==='\r' && txt[i+1]==='\n') i++; row.push(cel); rows.push(row); row=[]; cel=''; }
    else cel += ch;
  }
  if(cel || row.length){ row.push(cel); rows.push(row); }
  return rows.filter(r=>r.some(c=>String(c).trim()));
}
function mapearProdutos(rows){
  if(rows.length<2) return [];
  const cab = rows[0].map(h=>semAcento(h).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim());
  const acha = (...nomes) => { for(const n of nomes){ const i = cab.indexOf(n); if(i>=0) return i; } for(const n of nomes){ const i = cab.findIndex(h=>h.startsWith(n)); if(i>=0) return i; } return -1; };
  const iNome = acha('nome','produto','nome do produto','descricao','descricao do produto','item');
  const iPreco = acha('preco','preco de venda','preco venda','valor','valor de venda','valor venda','pv','preco varejo');
  const iPromo = acha('preco promocional','promocional','preco promocao');
  const iSku = acha('sku','referencia','ref','cod interno','codigo interno');
  const iCod = acha('codigo de barras','cod barras','ean','gtin','codigo barras','codigo');
  const iCat = acha('categorias','categoria','grupo','departamento','secao');
  const iId = acha('identificador url','identificador');
  const iExibe = acha('exibir na loja');
  const iVars = [1,2,3].map(n=>acha('valor da variacao '+n)).filter(i=>i>=0);
  if(iNome<0 || iPreco<0) return null;
  const out = []; let pai = null;
  rows.slice(1).forEach(r=>{
    const g = i => i>=0 ? String(r[i]??'').trim() : '';
    let nome = g(iNome);
    if(iId>=0 && !nome && pai && g(iId)===pai.ident) nome = pai.nome;
    if(!nome) return;
    const vars = iVars.map(g).filter(Boolean);
    if(g(iNome)) pai = {nome, ident:g(iId), cat:g(iCat), preco:g(iPreco)};
    const catRaw = g(iCat) || pai?.cat || '';
    const cat = catRaw.split(',')[0].split('>').pop().trim();
    const preco = g(iPreco) || pai?.preco || '';
    if(!num2(preco)) return;
    out.push({nome: vars.length ? nome+' · '+vars.join(' / ') : nome, preco: String(num2(preco)), promo: num2(g(iPromo))>0 ? String(num2(g(iPromo))) : '', sku:g(iSku), codigo: iCod!==iSku ? g(iCod).replace(/\.0$/,'') : '', categoria:cat, ativo: iExibe>=0 ? !/^n(ao)?$/i.test(semAcento(g(iExibe))) : undefined});
  });
  return out;
}
function admPdvPrever(txt, origem){
  const el = $('#imp-prev'); if(!el) return;
  if(!txt.trim()){ el.innerHTML=''; return; }
  const lista = mapearProdutos(lerCSV(txt));
  if(lista===null){ el.innerHTML = `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div>Não achei as colunas de <b>nome</b> e <b>preço</b>. A primeira linha precisa ter os títulos (ex.: Nome; Preço; Código de barras; Categoria).</div></div>`; return; }
  IMP = {lista, origem};
  el.innerHTML = `<div class="nota ok"><i class="ti ti-check"></i><div><b>${lista.length} produto(s) prontos.</b> Quem já existir (mesmo código, SKU ou nome) só tem o preço atualizado.</div></div>
    <div class="tabela pdv-prev"><table><thead><tr><th>Produto</th><th>Código</th><th>Categoria</th><th>Preço</th></tr></thead><tbody>${lista.slice(0,12).map(p=>`<tr><td>${emojiDe(p)} ${esc(p.nome)}</td><td class="apagado">${esc(p.codigo||p.sku)}</td><td>${esc(p.categoria)}</td><td class="n num">${brl2(p.preco)}${p.promo?' <small class="pos">'+brl2(p.promo)+'</small>':''}</td></tr>`).join('')}${lista.length>12?`<tr><td colspan="4" class="apagado">… e mais ${lista.length-12}</td></tr>`:''}</tbody></table></div>
    <button class="btn ouro largo" id="btn-imp" style="margin-top:12px" onclick="admPdvConfirmarImport()"><i class="ti ti-file-import"></i> Importar ${lista.length} produtos</button>`;
}
async function admPdvConfirmarImport(){
  const b = $('#btn-imp'); b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Importando… (pode levar até 1 minuto)';
  try{ const d = await api('admProdutos', {...S.adm.cred, lista:IMP.lista, origem:IMP.origem}); S.adm.dados = d; fecharModal(); render(); chuvaConfete(); toast(`Catálogo pronto ✔ ${d.importados?.novos||0} novos · ${d.importados?.alterados||0} atualizados`); }
  catch(e){ toast(e.message, true); b.disabled = false; b.textContent = 'Tentar de novo'; }
}

/* metas por vendedora */
function admPdvMetas(){
  const d = S.adm.dados, ym = S.adm.mes, m = (d.metas||{})[ym]||{}, M = metasDe(ym), vend = vendedorasDe(M);
  return `<div style="max-width:420px;margin-bottom:12px">${seletorMes(ym,'admMudarMes')}</div>
    <div class="nota info" style="margin-bottom:12px"><i class="ti ti-target-arrow"></i><div>Meta individual de cada vendedora na <b>Arena</b>. Deixe em branco para o portal <b>estimar</b> (meta da loja dividida entre as vendedoras dela; a líder usa a meta de líder). A premiação continua a mesma da aba Metas.</div></div>
    <div class="cartao pad" style="max-width:760px">${vend.map(c=>{ const p = (m.pessoas||{})[c.id]||{}, e = metaPessoa(c, {...M, m:{...m, pessoas:{}}}, vend);
      return `<div class="linha" style="gap:10px;margin-bottom:6px">${avatar(c,'',34)}<b>${esc(primeiroNome(c.nome))}</b><small class="apagado">Loja ${esc(S.boot.lojas[c.loja]?.nome||c.loja||'')}${e?' · estimada: '+brl(e.meta):''}</small></div>
      <div class="g3"><div class="campo"><label>Meta</label><input class="inp num" id="mp-${c.id}-meta" value="${p.meta||''}" placeholder="${e?e.meta:''}"></div><div class="campo"><label>Super</label><input class="inp num" id="mp-${c.id}-super" value="${p.super||''}" placeholder="${e?e.super:''}"></div><div class="campo"><label>Hiper</label><input class="inp num" id="mp-${c.id}-hiper" value="${p.hiper||''}" placeholder="${e?e.hiper:''}"></div></div>`; }).join('')}
      <button class="btn pri" onclick="admPdvSalvarMetas()"><i class="ti ti-device-floppy"></i> Salvar metas de ${nomeMes(ym)}</button></div>`;
}
async function admPdvSalvarMetas(){
  const d = S.adm.dados, ym = S.adm.mes, metas = JSON.parse(JSON.stringify(d.metas||{})), M = metasDe(ym);
  metas[ym] = metas[ym]||{}; const pes = {};
  vendedorasDe(M).forEach(c=>{ const n = k => num2($('#mp-'+c.id+'-'+k)?.value||''); const o = {meta:n('meta'), super:n('super'), hiper:n('hiper')}; if(o.meta) pes[c.id] = {meta:o.meta, super:o.super||o.meta, hiper:o.hiper||o.super||o.meta}; });
  metas[ym].pessoas = pes;
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'metas', valor:JSON.stringify(metas)}); render(); toast('Metas individuais salvas ✔ A Arena já mostra.'); }
  catch(e){ toast(e.message, true); }
}
function admPdvRegras(){
  const c = pdvD().cfg;
  return `<div class="cartao pad" style="max-width:560px">
    <div class="campo"><label>Desconto máximo que a vendedora pode dar sozinha (%)</label><input class="inp num" id="pr-desc" value="${c.desconto_max??15}"></div>
    <div class="campo"><label>Minutos para a vendedora desfazer a própria venda</label><input class="inp num" id="pr-canc" value="${c.cancelar_min??15}"></div>
    <button class="btn pri" onclick="admPdvSalvarRegras()"><i class="ti ti-device-floppy"></i> Salvar</button>
    <p class="apagado" style="font-size:13px;margin-top:10px">Acima do desconto máximo o botão Finalizar trava e aparece “fale com a administração”. Cancelamentos ficam registrados com quem, quando e o motivo — nada some.</p></div>`;
}
async function admPdvSalvarRegras(){
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'pdv', valor:JSON.stringify({desconto_max:num2($('#pr-desc').value), cancelar_min:num2($('#pr-canc').value)})}); render(); toast('Regras do PDV salvas ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ───────── encaixe no portal (versões novas das telas, sem mexer nos arquivos antigos) ───────── */
telaPortal = function telaPortal(){
  const d = S.sess.dados;
  const pend = d.solicitacoes.filter(s=>s.status==='pendente').length;
  const nl = avisosNaoLidos().length;
  const abas = [['inicio','ti-home','Início'],['pdv','ti-shopping-cart','Vender'],['arena','ti-flame','Arena'],['mural','ti-speakerphone','Mural',nl],['mes','ti-calendar-stats','Meu mês'],['metas','ti-trophy','Metas'],['pedidos','ti-send','Pedidos',pend],['checklist','ti-checklist','Checklist'],['caixa','ti-cash-banknote','Caixa'],['escala','ti-calendar-time','Escala'],['protocolos','ti-book','Protocolos'],['treino','ti-school','Treinamento'],['atalhos','ti-apps','Atalhos'],['agenda','ti-calendar-event','Agenda'],['eu','ti-user-circle','Eu']];
  const barra = [['inicio','ti-home','Início'],['pdv','ti-shopping-cart','Vender'],['arena','ti-flame','Arena'],['mural','ti-speakerphone','Mural',nl],['mais','ti-dots','Mais',pend]];
  const fn = {pdv:portalPDV, arena:portalArena, inicio:portalInicio, mes:portalMes, metas:portalMetas, pedidos:portalPedidos, checklist:portalChecklist, caixa:portalCaixa, escala:portalEscala, agenda:portalAgenda, eu:portalEu, mais:portalMais, mural:portalMural, protocolos:portalProtocolos, treino:portalTreino, atalhos:portalAtalhos};
  const corpo = (fn[S.portalTab]||portalInicio)();
  const naBarra = barra.some(b=>b[0]===S.portalTab) ? S.portalTab : 'mais';
  return `<div class="wrap" style="max-width:${['pdv','arena'].includes(S.portalTab)?'1320px':'860px'}">${letreiro(`<div class="linha" style="margin-left:auto;gap:6px">${btnBusca()}<button class="btn p" onclick="sair()"><i class="ti ti-logout-2"></i> Sair</button></div>`)}
    ${modoLoja()?btnVoltar('Voltar ao ponto'):''}
    <div class="abas esconde-p" style="margin-bottom:14px">${abas.map(([k,i,n,b])=>`<button class="aba ${S.portalTab===k?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='${k}';S.protoAberto=null;render()"><i class="ti ${i}"></i> ${n} ${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}
    <div class="barra" style="display:none" id="barra">${barra.map(([k,i,n,b])=>`<button class="${naBarra===k?'on':''}" onclick="S.portalTab='${k}';render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    <style>@media (max-width:640px){#barra{display:flex!important}}</style>
  </div>`;
};
portalMais = function portalMais(){
  const pend = S.sess.dados.solicitacoes.filter(s=>s.status==='pendente').length, tr = progressoTrilha();
  const itens = [['metas','ti-trophy','Metas e prêmios','Ranking, meta da loja e premiação'],['pedidos','ti-send','Meus pedidos',pend?pend+' aguardando a administração':'Correção, atestado e folga'],['protocolos','ti-book','Protocolos da loja','O manual: regras e passo a passo'],['treino','ti-school','Treinamento',tr.total?tr.pct+'% da trilha concluída':'Trilha da equipe'],['atalhos','ti-apps','Atalhos','Kommo, Nuvemshop, Instagram…'],['mes','ti-calendar-stats','Meu mês','Ponto, saldo e banco de horas'],['checklist','ti-checklist','Checklist do dia','Abertura, loja, conteúdo, fechamento'],['caixa','ti-cash-banknote','Caixa / sangria','Registrar a sangria de hoje'],['escala','ti-calendar-time','Minha escala','Loja e turno dos próximos dias'],['agenda','ti-calendar-event','Agenda da equipe','Folgas, eventos e campanhas'],['eu','ti-user-circle','Meu perfil','WhatsApp e PIN']];
  return itens.map(([k,i,n,s])=>`<button class="pedido" style="width:100%;text-align:left;cursor:pointer" onclick="S.portalTab='${k}';render()"><div class="ico"><i class="ti ${i}"></i></div><div class="cresce"><b>${n}</b><p>${s}</p></div><i class="ti ti-chevron-right apagado"></i></button>`).join('');
};
portalInicio = function portalInicio(){
  const d = S.sess.dados, c = d.colaboradora, regras = d.regras;
  const mapa = mapaPontos(d.pontos, c.id);
  const hoje = hojeISO(), r = mapa[hoje] || {};
  const res = resumoMes(c, mesDe(hoje), mapa, regras), banco = bancoTotal(c, mapa, regras);
  const prox = proximoCampo(r);
  const h = agoraServidor().getHours();
  const saud = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const avisos = (d.calendario?.eventos||[]).filter(e=>e.tipo==='aviso' && (e.data_fim||e.data) >= addDays(hoje,-7)).slice(-5).reverse();
  const proximos = (d.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && (e.data_fim||e.data) >= hoje).sort((a,b)=>a.data.localeCompare(b.data)).slice(0,4);
  const pct = Math.max(0, Math.min(100, Math.round(res.trabalhado / Math.max(1,res.previsto) * 100)));
  const marcas = CAMPOS.filter(k=>r[k]).map(k=>`<span class="selo">${CURTO[k]} <b class="num">${r[k]}</b></span>`).join('');
  const mh = minutosHoje(r), tr = progressoTrilha();
  return `<div class="ola" style="margin-bottom:4px">${saud}, ${esc(primeiroNome(c.nome))}!</div>
    <div class="suave" style="margin-bottom:14px">${esc(dataLonga(hoje))}</div>
    ${blocoAvisosPendentes()}
    <div class="cartao pad linha" style="gap:16px;align-items:center">${r.tipo&&r.tipo!=='normal'?'':anel(mh/regras.jornada_min*100, hm(mh), 'de '+hm(regras.jornada_min), 92)}<div class="cresce">
      <div class="linha entre quebra"><b style="font-size:16px">Hoje</b>${r.tipo&&r.tipo!=='normal'?`<span class="selo info">${TIPO_NOME[r.tipo]}</span>`:prox?(r.entrada?`<span class="selo ok">Trabalhando</span>`:`<span class="selo">Ainda sem marcação</span>`):`<span class="selo ok">Dia encerrado · ${hm(trab(r))}</span>`}</div>
      <div class="linha quebra" style="gap:6px;margin-top:10px">${marcas || '<span class="apagado" style="font-size:14px">Nenhuma marcação hoje. O ponto é batido no computador da loja.</span>'}</div>
    </div></div>
    ${tr.total && tr.pct<100?`<button class="nota info" style="width:100%;text-align:left;margin-top:12px;cursor:pointer" onclick="S.portalTab='treino';render()"><i class="ti ti-school"></i><div><b>Treinamento: ${tr.feitos} de ${tr.total} passos.</b> Toque para continuar a sua trilha.</div></button>`:''}
    <div class="numeros" style="margin-top:12px">
      <div class="numero"><small>Banco de horas</small><b class="num ${banco.saldo>0?'pos':banco.saldo<0?'neg':''}">${hm(banco.saldo,true)}</b><span>${banco.folgasDisp?banco.folgasDisp+' folga(s) disponível(is)':'ainda sem folga disponível'}</span></div>
      <div class="numero"><small>Este mês</small><b class="num">${hm(res.trabalhado)}</b><span>de ${hm(res.previsto)} previstas</span><div class="medidor"><i style="width:${pct}%"></i></div></div>
      <div class="numero"><small>Pendências</small><b class="${res.pend?'neg':'pos'}">${res.pend}</b><span>${res.pend?'dias para corrigir':'tudo em dia'}</span></div>
    </div>
    ${(()=>{ const M = metasDe(mesDe(hoje)); const esc0 = escalaDe(hoje, d.escala).find(e=>e.colaboradora_id===c.id); const lojaHoje = esc0?.loja || r.loja || c.loja; const mt = M.m[lojaHoje]; const minha = M.porPessoa[c.id]||0;
      const it = itensChecklist(d.checklist?.itens||[], lojaHoje, hoje), ok = it.filter(i=>(d.checklist?.feitos||[]).some(f=>f.item_id===i.id&&f.loja===lojaHoje)).length;
      return `<div class="numeros" style="margin-top:12px">
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='metas';render()"><small>Meta da loja ${esc(S.boot.lojas[lojaHoje]?.nome||'')} · ${nomeMes(mesDe(hoje)).split(' ')[0]}</small><b class="num">${brl(M.porLoja[lojaHoje]||0)}</b><span>${mt?'de '+brl(mt.meta)+' · você: '+brl(minha):'meta não definida'}</span>${mt?`<div class="medidor"><i style="width:${Math.min(100,(M.porLoja[lojaHoje]||0)/mt.hiper*100)}%"></i></div>`:''}</button>
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='checklist';render()"><small>Checklist de hoje</small><b class="num ${ok===it.length&&it.length?'pos':''}">${ok}/${it.length}</b><span>${ok===it.length&&it.length?'tudo feito 🎉':'toque para marcar'}</span></button>
        <button class="numero" style="text-align:left;cursor:pointer" onclick="S.portalTab='escala';render()"><small>Minha escala hoje</small><b style="font-size:18px">${esc0?'Loja '+esc(S.boot.lojas[esc0.loja]?.nome||esc0.loja):'—'}</b><span>${esc0?esc(turnoTxt(esc0)):'sem escala definida'}</span></button>
      </div>`; })()}
    <h2 class="secao">O que você precisa?</h2>
    <div class="atalhos">
      <button onclick="S.portalTab='pdv';render()" style="border-color:rgba(245,181,36,.55)"><i class="ti ti-shopping-cart"></i>Vender (PDV)</button>
      <button onclick="S.portalTab='arena';render()"><i class="ti ti-flame"></i>Arena de vendas</button>
      <button onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i>Registrar sangria</button>
      <button onclick="novoPedido({tipo:'correcao'})"><i class="ti ti-clock-edit"></i>Esqueci de bater ou corrigir horário</button>
      <button onclick="novoPedido({tipo:'atestado'})"><i class="ti ti-file-certificate"></i>Enviar atestado</button>
      <button onclick="novoPedido({tipo:'folga'})"><i class="ti ti-beach"></i>Pedir folga</button>
      <button onclick="S.portalTab='mes';render()"><i class="ti ti-calendar-stats"></i>Ver meu mês</button>
    </div>
    ${avisos.filter(e=>lido('aviso',e.id,c.id,d.leituras)).length?`<h2 class="secao">Mural <small><button class="btn p fantasma" style="padding:0;height:auto" onclick="S.portalTab='mural';render()">ver todos</button></small></h2><div class="mural">${avisos.filter(e=>lido('aviso',e.id,c.id,d.leituras)).slice(0,3).map(e=>cardAviso(e,d)).join('')}</div>`:''}
    ${proximos.length?`<h2 class="secao">Próximos eventos</h2>${proximos.map(e=>{ const t=TIPO_EV[e.tipo]||TIPO_EV.evento; return `<div class="pedido" style="align-items:center"><div class="ico">${t.e}</div><div class="cresce"><b>${esc(e.titulo)}</b><p>${t.n}, ${ddmm(e.data)}${e.data_fim&&e.data_fim!==e.data?' a '+ddmm(e.data_fim):''}${e.loja&&d.lojas[e.loja]?', loja '+esc(d.lojas[e.loja].nome):''}${e.obs?' — '+esc(e.obs):''}</p></div></div>`; }).join('')}`:''}
    ${(d.atalhos||[]).length?`<h2 class="secao">Atalhos <small><button class="btn p fantasma" style="padding:0;height:auto" onclick="S.portalTab='atalhos';render()">ver todos</button></small></h2><div class="grade-atalhos">${(d.atalhos||[]).flatMap(g=>g.itens||[]).filter(a=>a.destaque).slice(0,6).map(a=>tileAtalho(a)).join('')}</div>`:''}`;
};
function pdvHojeDe(loja){ const l = (S.sess?.dados?.pdv?.vendas||[]).filter(v=>v.data===hojeISO() && v.colaboradora_id===S.sess.eid && v.loja===loja && v.status!=='cancelada'); return {n:l.length, total:l.reduce((s,v)=>s+(Number(v.total)||0),0)}; }
telaSucesso = function telaSucesso(){
  const u = S.ultimo;
  const confete = Array.from({length:26},(_,i)=>`<i class="confete" style="--d:${(i%7)*.05}s;--x:${(Math.random()*2-1)*220}px;--y:${-80-Math.random()*220}px;background:${i%3?'var(--dourado)':'var(--vermelho)'};left:${45+Math.random()*10}%"></i>`).join('');
  const fimDia = u.campo==='saida' && S.sess?.dados;
  if(fimDia){ clearTimeout(timerVolta); timerVolta = setTimeout(sair, 90000); }
  const lojaHoje = S.aparelho?.loja || S.sess?.dados?.colaboradora?.loja;
  const vendaHoje = fimDia ? (S.sess.dados.metas?.vendas||[]).find(v=>v.data===hojeISO() && v.colaboradora_id===S.sess.eid && v.loja===lojaHoje) : null;
  return `<div class="wrap" style="max-width:560px">${letreiro()}<div class="cartao sucesso">${confete}
    <svg class="check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><path d="M30 52 L45 66 L72 36"/></svg>
    <div style="margin-top:14px;font-weight:800;font-size:20px">${esc(NOME[u.campo])} registrada</div>
    <b class="hora num">${esc(u.hora)}</b>
    <div class="suave">${esc(primeiroNome(u.nome))}${u.offline?' · guardado sem internet, envia sozinho':u.foto?' · foto registrada':''}</div>
    ${fimDia && pdvHojeDe(lojaHoje).n?`<div class="cartao pad" style="margin-top:18px;text-align:left;background:var(--noite2)">
      <b style="font-size:16px">💰 Hoje você vendeu <span class="num" style="color:var(--dourado2)">${brl2(pdvHojeDe(lojaHoje).total)}</span> no PDV</b>
      <p class="suave" style="font-size:13.5px;margin:4px 0 6px">${pdvHojeDe(lojaHoje).n} venda(s) — já está tudo na meta, não precisa lançar nada. ✔</p>
      <button class="btn p fantasma" style="padding:0" onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i> Registrar sangria de hoje</button>
    </div>`:fimDia?`<div class="cartao pad" style="margin-top:18px;text-align:left;background:var(--noite2)">
      <b style="font-size:16px">💰 Quanto você vendeu hoje na loja ${esc(S.boot.lojas[lojaHoje]?.nome||'')}?</b>
      <p class="suave" style="font-size:13.5px;margin:4px 0 10px">Entra na meta do mês na hora. ${vendaHoje?`Já lançado: <b class="num">${brl2(vendaHoje.valor)}</b> — pode corrigir.`:''}</p>
      <div class="g2"><input class="inp num" id="venda-valor" inputmode="decimal" placeholder="Ex.: 1.250,00" value="${vendaHoje?esc(vendaHoje.valor).replace('.',','):''}"><button class="btn ouro" id="btn-venda" onclick="lancarVendaRapida('${lojaHoje}')"><i class="ti ti-trending-up"></i> Lançar venda</button></div>
      <button class="btn p fantasma" style="margin-top:8px;padding:0" onclick="abrirSangria()"><i class="ti ti-cash-banknote"></i> Registrar sangria de hoje</button>
    </div>`:''}
    <div class="linha" style="justify-content:center;margin-top:20px;gap:8px">
      ${S.sess?.dados?`<button class="btn" onclick="S.tela='bater';render()"><i class="ti ti-send"></i> Fazer um pedido</button>`:''}
      <button class="btn pri" onclick="sair()">Concluir</button>
    </div></div></div>`;
};
telaAdmin = function telaAdmin(){
  const A = S.adm, d = A.dados;
  if(!A.v5){ A.v5 = true; AOV.d = null; AOV.vistos = null; if(A.tab==='hoje') A.tab = 'aovivo'; }
  const np = pendentes(d).length;
  const tabs = [['aovivo','ti-broadcast','Ao vivo'],['arena','ti-flame','Arena'],['pdv','ti-shopping-cart','PDV'],['pedidos','ti-inbox','Pedidos',np],['hoje','ti-clock','Hoje'],['produtividade','ti-chart-bar','Produtividade'],['mural','ti-speakerphone','Mural'],['protocolos','ti-book','Protocolos'],['treino','ti-school','Treinamento'],['atalhos','ti-apps','Atalhos'],['metas','ti-trophy','Metas'],['caixa','ti-cash-banknote','Caixa'],['checklist','ti-checklist','Checklist'],['escala','ti-calendar-time','Escala'],['mes','ti-calendar','Espelho'],['banco','ti-pig-money','Banco'],['agenda','ti-calendar-event','Agenda'],['equipe','ti-users','Equipe'],['aparelhos','ti-device-desktop','Aparelhos'],['regras','ti-settings','Regras']];
  const corpo = ({arena:admArena, pdv:admPDV, aovivo:admAoVivo, produtividade:admProdutividade, mural:admMural, protocolos:admProtocolos, treino:admTreino, atalhos:admAtalhos, pedidos:admPedidos, hoje:admHoje, metas:admMetas, caixa:admCaixa, checklist:admChecklist, escala:admEscala, mes:admMes, banco:admBanco, agenda:admAgenda, equipe:admEquipe, aparelhos:admAparelhos, regras:admRegras})[A.tab]();
  return `<div class="wrap" style="${A.tab==='arena'||A.tab==='pdv'?'max-width:1320px':''}">${letreiro(`<div class="linha" style="margin-left:auto;gap:6px">
      ${btnBusca()}<button class="icone" title="Atualizar" onclick="admRecarregar()"><i class="ti ti-refresh"></i></button>
      <button class="btn p" onclick="S.adm=null;S.tela='inicio';render()"><i class="ti ti-logout-2"></i> Sair</button></div>`)}
    ${btnVoltar('Sair da administração')}
    <div class="abas" style="margin-bottom:16px">${tabs.map(([k,i,n,b])=>`<button class="aba ${A.tab===k?'on':''}" onclick="S.adm.tab='${k}';TR=null;render()"><i class="ti ${i}"></i> ${n} ${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}</div>`;
};
itensBusca = function itensBusca(){
  const r = [];
  if(S.adm){
    [['arena','Arena de vendas','ti-flame'],['pdv','PDV: vendas e produtos','ti-shopping-cart'],['aovivo','Painel ao vivo','ti-broadcast'],['pedidos','Pedidos','ti-inbox'],['hoje','Hoje','ti-clock'],['produtividade','Produtividade','ti-chart-bar'],['metas','Metas e vendas','ti-trophy'],['caixa','Caixa e sangrias','ti-cash-banknote'],['checklist','Checklist','ti-checklist'],['escala','Escala','ti-calendar-time'],['mural','Mural de avisos','ti-speakerphone'],['protocolos','Protocolos','ti-book'],['treino','Treinamento','ti-school'],['atalhos','Atalhos','ti-apps'],['mes','Espelho de ponto','ti-calendar'],['banco','Banco de horas','ti-pig-money'],['agenda','Agenda','ti-calendar-event'],['equipe','Equipe','ti-users'],['aparelhos','Aparelhos','ti-device-desktop'],['regras','Regras','ti-settings']]
      .forEach(([k,n,i])=>r.push({t:n, s:'Tela da administração', i, go:()=>{ S.adm.tab=k; render(); }}));
    S.adm.dados.colaboradoras.forEach(c=>r.push({t:c.nome, s:(c.cargo||'Equipe')+(c.telefone?' · '+fmtTel(c.telefone):''), i:'ti-user', go:()=>{ S.adm.tab='equipe'; render(); editarColab(c.id); }}));
    r.push({t:'Lançar venda', s:'Metas', i:'ti-trending-up', go:()=>{ S.adm.tab='metas'; render(); admAbrirVenda(); }});
    r.push({t:'Novo aviso no mural', s:'Mural', i:'ti-speakerphone', go:()=>{ S.adm.tab='mural'; render(); novoAviso(); }});
  } else if(S.sess){
    [['Vender (PDV)','ti-shopping-cart',()=>{ S.tela='portal'; S.portalTab='pdv'; render(); }],['Arena de vendas','ti-flame',()=>{ S.tela='portal'; S.portalTab='arena'; render(); }],['Lançar venda do dia','ti-trending-up',()=>abrirVenda()],['Registrar sangria','ti-cash-banknote',()=>abrirSangria()],['Pedir folga','ti-beach',()=>novoPedido({tipo:'folga'})],['Enviar atestado','ti-file-certificate',()=>novoPedido({tipo:'atestado'})],['Corrigir horário do ponto','ti-clock-edit',()=>novoPedido({tipo:'correcao'})]]
      .forEach(([t,i,go])=>r.push({t, s:'Ação rápida', i, go}));
    [['inicio','Início','ti-home'],['mes','Meu mês','ti-calendar-stats'],['metas','Metas','ti-trophy'],['checklist','Checklist do dia','ti-checklist'],['escala','Minha escala','ti-calendar-time'],['mural','Mural de avisos','ti-speakerphone'],['protocolos','Protocolos da loja','ti-book'],['treino','Treinamento','ti-school'],['atalhos','Atalhos','ti-apps'],['agenda','Agenda','ti-calendar-event'],['pedidos','Meus pedidos','ti-send'],['eu','Meu perfil','ti-user-circle']]
      .forEach(([k,n,i])=>r.push({t:n, s:'Tela do portal', i, go:()=>{ S.tela='portal'; S.portalTab=k; S.protoAberto=null; render(); }}));
    avisosAtivos(S.sess.dados.calendario, hojeISO(), 45).forEach(e=>r.push({t:e.titulo, s:'Aviso · '+ddmm(e.data), txt:e.obs, i:'ti-speakerphone', go:()=>{ S.tela='portal'; S.portalTab='mural'; render(); }}));
  }
  listaProtocolos().forEach(p=>r.push({t:p.titulo, s:'Protocolo · '+(p.secao||''), txt:p.texto, i:'ti-book', go:()=>abrirProtocolo(p.id)}));
  ((S.adm ? S.adm.dados.atalhos : S.sess?.dados?.atalhos)||[]).forEach(g=>(g.itens||[]).forEach(a=>r.push({t:a.nome, s:'Atalho · '+(a.obs||g.grupo), i:'ti-external-link', url:a.url})));
  return r;
};
