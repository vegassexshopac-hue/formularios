/* ═══════════════════════════════════════════════════════════════
   v38 · COMPRAS DO SISTEMA ANTIGO na ficha da cliente
   Administração › Vendas › Clientes › ficha → "🕰️ Compras antigas"
   (data, loja, vendedora, valor; toque abre os produtos com foto).
   Administração › Vendas › Clientes › Importar → card "Compras do sistema antigo".
   Não entra nas vendas do PDV: não mexe em metas, estoque, selos nem cashback.
   Servidor: HISTORICO.gs (ação admHistorico + ficha já volta com cartao.antigas).
   ═══════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.h38{margin-top:16px;border:1px solid var(--borda,#ece7e2);border-radius:16px;padding:12px 12px 6px;background:linear-gradient(180deg,#fffaf3,#fff)}
.h38-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.h38-top b{font-size:14px}
.h38-top .sub{font-size:12.5px;color:var(--apagado,#8a8178)}
.h38-v{width:100%;display:flex;align-items:center;gap:10px;text-align:left;background:#fff;border:1px solid #efe8e1;border-radius:12px;padding:9px 10px;margin:0 0 8px;cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;animation:h38in .35s ease both}
.h38-v:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(120,60,20,.10);border-color:#f2c46b}
.h38-v:active{transform:scale(.985)}
.h38-v .d{min-width:54px;font-weight:800;font-size:13px;line-height:1.15}
.h38-v .d small{display:block;font-weight:600;color:var(--apagado,#8a8178);font-size:11px}
.h38-v .m{flex:1;min-width:0}
.h38-v .m small{color:var(--apagado,#8a8178);font-size:12px}
.h38-v .fts{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
.h38-v .fts .pf,.h38-v .fts .pf-emo{border-radius:8px}
.h38-v .val{font-weight:800;white-space:nowrap}
.h38-v .seta{transition:transform .2s ease;color:var(--apagado,#8a8178)}
.h38-v.on .seta{transform:rotate(180deg)}
.h38-it{margin:-4px 0 10px;padding:6px 10px 2px;border-left:3px solid #f5b524;animation:h38in .25s ease both}
.h38-it .i{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed #efe8e1}
.h38-it .i:last-child{border-bottom:0}
.h38-it .i .n{flex:1;min-width:0;font-size:13.5px}
.h38-it .i .n small{display:block;color:var(--apagado,#8a8178);font-size:11.5px}
.h38-it .i .pf{cursor:zoom-in}
.h38-mais{width:100%;margin:2px 0 8px}
@keyframes h38in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
`; document.head.appendChild(st); })();

const H38 = {abertas:{}, mostrar:8, idx:null, idxN:0, imp:null};

/* liga o item antigo ao produto do catálogo (código de barras → SKU → nome) para mostrar a foto */
function h38Idx(){
  const P = (S.adm?.dados?.pdv?.produtos) || [];
  if(H38.idx && H38.idxN === P.length) return H38.idx;
  const cod = {}, nome = {};
  P.forEach(p=>{ [p.codigo, p.sku].forEach(c=>{ c = String(c||'').replace(/^0+/,'').trim(); if(c && !cod[c]) cod[c] = p; }); const n = semAcento(p.nome).replace(/[^a-z0-9]+/g,' ').trim(); if(n && !nome[n]) nome[n] = p; });
  H38.idx = {cod, nome}; H38.idxN = P.length; return H38.idx;
}
function h38Prod(i){
  const X = h38Idx(), c = String(i.cod||'').replace(/^0+/,'').trim();
  return (c && X.cod[c]) || X.nome[semAcento(i.desc).replace(/[^a-z0-9]+/g,' ').trim()] || null;
}
function h38Nome(i, p){ return p ? p.nome : String(i.desc||'').toLowerCase().replace(/(^|\s)\S/g, s=>s.toUpperCase()); }
function h38Data(s){ s = String(s||''); return s.length >= 10 ? s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4) : s; }
function h38Loja(l){ return S.boot?.lojas?.[l]?.nome || (l ? l[0].toUpperCase()+l.slice(1) : ''); }
function h38Zoom(cod, desc){
  const p = h38Prod({cod, desc}); if(!p || !p.foto) return;
  $('#modal').insertAdjacentHTML('beforeend', `<div class="veu" id="foto-zoom" style="z-index:9999" onclick="this.remove()"><div class="modal" style="max-width:520px"><div class="modal-c" style="padding:12px"><img class="cat-foto-g" style="width:100%;border-radius:12px" src="${esc(fotoUrl(p,640))}"><p style="margin:10px 4px 0;font-weight:700">${esc(p.nome)}</p></div></div></div>`);
}
function h38Ico(i, px){
  const p = h38Prod(i);
  const ico = typeof pIco === 'function' ? pIco(p || {nome:i.desc}, px) : '';
  return p && p.foto ? ico.replace(/onclick="[^"]*"/, `onclick="event.stopPropagation();h38Zoom('${esc(String(i.cod||''))}','${esc(String(i.desc||'').replace(/'/g,''))}')"`) : ico;
}

function h38Secao(c){
  const L = c.antigas;
  if(!Array.isArray(L)) return `<div class="h38"><div class="h38-top"><b>🕰️ Compras antigas</b><span class="sub">O servidor ainda não tem o histórico (falta o HISTORICO.gs no Apps Script).</span></div></div>`;
  if(!L.length) return `<div class="h38"><div class="h38-top"><b>🕰️ Compras antigas</b><span class="sub">Nenhuma compra no sistema antigo.</span></div></div>`;
  const tot = L.reduce((s,v)=>s+(Number(v.total)||0),0), pecas = L.reduce((s,v)=>s+v.itens.reduce((a,i)=>a+(Number(i.qtd)||0),0),0);
  const lojas = [...new Set(L.map(v=>h38Loja(v.loja)))].join(' e ');
  const vis = L.slice(0, H38.mostrar);
  return `<div class="h38"><div class="h38-top"><b>🕰️ Compras antigas</b><span class="sub">${L.length} ${L.length===1?'compra':'compras'} · ${brl2(tot)} · ${pecas} ${pecas===1?'peça':'peças'} · ${esc(lojas)} · de ${h38Data(L[L.length-1].data).slice(3)} a ${h38Data(L[0].data).slice(3)}</span></div>
    ${vis.map((v,k)=>{ const id = v.loja+'-'+v.cupom, on = !!H38.abertas[id];
      return `<button class="h38-v ${on?'on':''}" style="animation-delay:${k*35}ms" onclick="h38Abrir('${esc(id)}')">
        <span class="d">${h38Data(v.data).slice(0,5)}<small>${h38Data(v.data).slice(6)}</small></span>
        <span class="m"><small>${esc(h38Loja(v.loja))}${v.vendedora?' · '+esc(String(v.vendedora).toLowerCase().replace(/(^|\s)\S/g,s=>s.toUpperCase())):''} · ${v.itens.length} ${v.itens.length===1?'produto':'produtos'}</small>
          <span class="fts">${v.itens.slice(0,5).map(i=>h38Ico(i,30)).join('')}${v.itens.length>5?`<small style="align-self:center">+${v.itens.length-5}</small>`:''}</span></span>
        <span class="val">${brl2(v.total)}</span><i class="ti ti-chevron-down seta"></i></button>
        ${on?`<div class="h38-it">${v.itens.length?v.itens.map(i=>{ const p = h38Prod(i); return `<div class="i">${h38Ico(i,44)}<span class="n">${esc(h38Nome(i,p))}<small>${Number(i.qtd)!==1?esc(String(i.qtd).replace('.',','))+' × ':''}${brl2(i.preco)}${p?'':' · fora do catálogo atual'}</small></span><b>${brl2(i.total)}</b></div>`; }).join(''):'<p class="suave" style="font-size:13px">Sem produtos registrados nesta venda.</p>'}</div>`:''}`; }).join('')}
    ${L.length>H38.mostrar?`<button class="btn p fantasma h38-mais" onclick="H38.mostrar+=10;h38Pintar()"><i class="ti ti-chevron-down"></i> Ver mais ${Math.min(10,L.length-H38.mostrar)} de ${L.length-H38.mostrar}</button>`:''}</div>`;
}
function h38Abrir(id){ H38.abertas[id] = !H38.abertas[id]; h38Pintar(); }
function h38Pintar(){
  const box = $('#modal .fid-ficha .h38'), c = FA.ficha; if(!box || !c) return;
  const tmp = document.createElement('div'); tmp.innerHTML = h38Secao(c); box.replaceWith(tmp.firstElementChild);
}

/* encaixe na ficha (app22) — depois do bloco Compras / Indicações, antes de "Editar cadastro" */
if(typeof fidAdmFichaPintar === 'function'){
  const _fichaV38 = fidAdmFichaPintar;
  fidAdmFichaPintar = function fidAdmFichaPintar(){
    const c = FA.ficha;
    if(c && H38.ficha !== c.id){ H38.ficha = c.id; H38.abertas = {}; H38.mostrar = 8; }
    _fichaV38();
    const alvo = $('#modal .fid-ficha .modal-c > details');
    if(alvo && c) alvo.insertAdjacentHTML('beforebegin', h38Secao(c));
  };
}

/* ───────── importar o histórico (Administração › Clientes › Importar) ───────── */
async function h38Arquivo(inp){
  const f = inp.files[0]; if(!f) return;
  const buf = await f.arrayBuffer(); let txt; try{ txt = new TextDecoder('utf-8', {fatal:true}).decode(buf); }catch(e){ txt = new TextDecoder('windows-1252').decode(buf); }
  const rows = lerCSV(txt); if(rows.length < 2){ toast('Arquivo sem linhas', true); return; }
  const cab = rows[0].map(h=>semAcento(h).replace(/[^a-z0-9_]/g,'').trim()), ix = n => cab.indexOf(n);
  const need = ['loja','cupom','data','cliente','whatsapp','vendedora','total_venda','codigo','produto','qtd','preco','total_item'];
  const falta = need.filter(n=>ix(n)<0);
  if(falta.length){ toast('Esse não é o arquivo do histórico (faltam: '+falta.join(', ')+')', true); return; }
  const num = s => Number(String(s||'').replace(/\./g,'').replace(',','.')) || 0;
  const V = {};
  rows.slice(1).forEach(r=>{
    const loja = (r[ix('loja')]||'').trim().toLowerCase(), cupom = (r[ix('cupom')]||'').trim(); if(!loja || !cupom) return;
    const k = loja+'-'+cupom;
    const v = V[k] = V[k] || {loja, cupom, data:(r[ix('data')]||'').trim(), cliente:(r[ix('cliente')]||'').trim(), tel:String(r[ix('whatsapp')]||'').replace(/\D/g,''), vendedora:(r[ix('vendedora')]||'').trim(), total:num(r[ix('total_venda')]), itens:[]};
    if((r[ix('produto')]||'').trim()) v.itens.push({cod:(r[ix('codigo')]||'').trim(), desc:(r[ix('produto')]||'').trim(), qtd:num(r[ix('qtd')]), preco:num(r[ix('preco')]), total:num(r[ix('total_item')])});
  });
  const lista = Object.values(V);
  H38.imp = {lista, nome:f.name, clientes:new Set(lista.map(v=>v.tel||v.cliente)).size, itens:lista.reduce((s,v)=>s+v.itens.length,0),
    lojas:[...new Set(lista.map(v=>v.loja))], env:false, feito:0, fim:null};
  render();
}
async function h38Enviar(){
  const I = H38.imp; I.env = true; I.feito = 0; render();
  const tot = {novas:0, atualizadas:0, ignoradas:0};
  try{
    for(let i=0;i<I.lista.length;i+=300){
      const r = await api('admHistorico', {...S.adm.cred, op:'importar', lista:I.lista.slice(i,i+300)});
      for(const k in tot) tot[k] += r.importados[k]||0;
      I.feito = Math.min(I.lista.length, i+300); render();
    }
    I.env = false; I.fim = tot; render();
    toast(`✔ ${tot.novas} compras antigas novas${tot.atualizadas?' · '+tot.atualizadas+' atualizadas':''}`);
  }catch(e){ I.env = false; render(); toast(/desconhecida/i.test(e.message)?'Falta colar o HISTORICO.gs no Apps Script e publicar nova versão':e.message, true); }
}
function h38CardImportar(){
  const I = H38.imp;
  return `<div class="cartao pad" style="margin-top:14px"><h3 style="margin:0 0 4px;font-size:16px">🕰️ Compras do sistema antigo</h3>
    <p class="apagado" style="margin:0 0 10px;font-size:13.5px">Cada compra antiga (data, loja, vendedora e produtos) aparece na ficha da cliente, em <b>Compras antigas</b>. Não entra nas vendas, metas, estoque nem selos. Importar de novo o mesmo arquivo não duplica.</p>
    <div class="campo"><label>Arquivo do histórico (CSV)</label><input class="inp" type="file" accept=".csv,.txt,text/csv" style="padding-top:10px" onchange="h38Arquivo(this)"></div>
    ${I?`<div class="nota ${I.lista.length?'info':'warn'}"><i class="ti ti-history"></i><div><b>${I.lista.length} compras lidas</b> · ${I.clientes} clientes · ${I.itens} produtos · lojas: ${I.lojas.map(h38Loja).join(', ')}</div></div>
      ${I.fim?`<div class="nota ok"><i class="ti ti-check"></i><div><b>Pronto!</b> ${I.fim.novas} novas · ${I.fim.atualizadas} atualizadas${I.fim.ignoradas?' · '+I.fim.ignoradas+' ignoradas':''}. Abra a ficha de uma cliente para ver.</div></div>`
      :`<button class="btn pri" ${I.env||!I.lista.length?'disabled':''} onclick="h38Enviar()">${I.env?`<i class="ti ti-loader-2"></i> Importando ${I.feito}/${I.lista.length}…`:'<i class="ti ti-upload"></i> Importar '+I.lista.length+' compras antigas'}</button>`}`:''}</div>`;
}
if(typeof fidAdmImportar === 'function'){
  const _impV38 = fidAdmImportar;
  fidAdmImportar = function fidAdmImportar(){ return _impV38() + h38CardImportar(); };
}
