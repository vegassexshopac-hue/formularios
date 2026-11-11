/* v26: miniaturas dos produtos — na comanda do PDV e no "Acabou de vender" da Arena (com detalhes da venda).
   (A parte da comanda nasceu como app25.js em 03/11; foi movida para cá para não colidir com o app25 de outra sessão.)

   ── 1) COMANDA ──
   Usa a mesma foto do catálogo (fotoUrl/pIco do app13). Sem foto → emoji da categoria.
   Tocar na miniatura abre a foto grande. Carregado depois de app22/app23/app24/app25, antes do app12. */
(function(){ const st = document.createElement('style'); st.textContent = `
.pdv-item .pdv-it-cab{display:flex;align-items:center;gap:10px;min-width:0}
.pdv-item .pdv-it-cab > div{min-width:0}
.pdv-item .pdv-mini{flex:0 0 auto;width:46px;height:46px;border-radius:10px;overflow:hidden;background:#fff;border:1px solid var(--linha,rgba(0,0,0,.08));display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;cursor:zoom-in;transition:transform .15s}
.pdv-item .pdv-mini:hover{transform:scale(1.06)}
.pdv-item .pdv-mini:active{transform:scale(.95)}
.pdv-item .pdv-mini img{width:100%;height:100%;object-fit:contain;display:block}
.pdv-item .pdv-mini.sem{background:rgba(245,181,36,.10);cursor:default}
.pdv-item .pdv-mini.sem:hover{transform:none}
.pdv-item.novo .pdv-mini{animation:pdvMiniEntra .35s both}
@keyframes pdvMiniEntra{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.pdv-item.novo .pdv-mini{animation:none}}
`; document.head.appendChild(st); })();

function pdvMiniHtml(i){
  const p = i.id ? estProdV25(i.id) : null;
  const u = p && typeof fotoUrl==='function' ? fotoUrl(p, 120) : '';
  const emo = i.avulso ? '➕' : emojiDe(p || {nome:i.nome, categoria:i.cat});
  if(u) return `<span class="pdv-mini" title="Ver foto" onclick="event.stopPropagation();typeof fotoVer==='function'&&fotoVer('${esc(i.id)}')"><img src="${esc(u)}" loading="lazy" alt="" onerror="this.parentNode.classList.add('sem');this.outerHTML='${emo}'"></span>`;
  return `<span class="pdv-mini sem">${emo}</span>`;
}
function estProdV25(id){
  try{ if(typeof estProd==='function'){ const p = estProd(id); if(p) return p; } }catch(e){}
  return (pdvD().produtos||[]).find(p=>p.id===id) || null;
}

const _pdvPintarComandaV25 = pdvPintarComanda;
pdvPintarComanda = function pdvPintarComanda(bater){
  _pdvPintarComandaV25(bater);
  document.querySelectorAll('#pdv-itens .pdv-item[data-k]').forEach(el=>{
    if(el.querySelector('.pdv-mini')) return;
    const i = PDV.car.find(x=>x.k===el.dataset.k), info = el.firstElementChild;
    if(!i || !info) return;
    info.classList.add('pdv-it-cab');
    const txt = document.createElement('div');
    while(info.firstChild) txt.appendChild(info.firstChild);
    info.innerHTML = pdvMiniHtml(i);
    info.appendChild(txt);
  });
};

/* ── 2) ARENA › "Acabou de vender": miniaturas dos produtos + toque abre os detalhes da venda ──
   Discrição: os detalhes NÃO mostram o nome nem o telefone da cliente. */
(function(){ const st = document.createElement('style'); st.textContent = `
.feed{max-height:none}
.feed>div.ar-vd{cursor:pointer;flex-wrap:nowrap;transition:transform .15s,box-shadow .15s,border-color .15s}
.feed>div.ar-vd:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.08);border-color:var(--ouro,#F5B524)}
.feed>div.ar-vd:active{transform:scale(.98)}
.feed>div.ar-vd>div{min-width:0;flex:1 1 auto}
.feed .ar-ch{color:var(--creme3);font-size:18px;margin-left:2px;transition:transform .15s}
.feed>div.ar-vd:hover .ar-ch{transform:translateX(3px)}
.ar-minis{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.ar-minis .m{width:31px;height:31px;border-radius:8px;background:#fff;border:1px solid var(--linha,rgba(0,0,0,.08));display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:17px;line-height:1;position:relative}
.ar-minis .m img{width:100%;height:100%;object-fit:contain}
.ar-minis .m.sem{background:rgba(245,181,36,.10)}
.ar-minis .m .q{position:absolute;right:1px;bottom:1px;background:rgba(20,10,15,.78);color:#fff;font-size:9px;font-weight:800;border-radius:5px;padding:0 3px;line-height:13px}
.ar-minis .ar-mais{width:31px;height:31px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;background:var(--linha,rgba(0,0,0,.06));color:var(--creme2,#555)}
.ar-det .topo{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ar-det .topo .tt{margin-left:auto;text-align:right}
.ar-det .topo .tt b{display:block;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}
.ar-det .it{display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid var(--linha,rgba(0,0,0,.08));animation:arDetIt .35s both;animation-delay:calc(var(--i,0)*45ms)}
.ar-det .it .ft{flex:0 0 auto;width:54px;height:54px;border-radius:11px;background:#fff;border:1px solid var(--linha,rgba(0,0,0,.08));display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:26px;cursor:zoom-in}
.ar-det .it .ft img{width:100%;height:100%;object-fit:contain}
.ar-det .it .ft.sem{background:rgba(245,181,36,.10);cursor:default}
.ar-det .it .nm{font-weight:700;font-size:14px;line-height:1.25}
.ar-det .it small{display:block;font-size:12px;color:var(--creme3)}
.ar-det .it .vl{margin-left:auto;font-weight:800;white-space:nowrap;font-variant-numeric:tabular-nums}
.ar-det .soma{border-top:2px solid var(--linha,rgba(0,0,0,.1));margin-top:4px;padding-top:10px}
.ar-det .soma div{display:flex;justify-content:space-between;font-size:14px;padding:2px 0}
.ar-det .soma .tot{font-size:17px;font-weight:900}
.ar-det .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.ar-det .tags span{font-size:12px;font-weight:700;padding:4px 9px;border-radius:99px;background:var(--linha,rgba(0,0,0,.06))}
@keyframes arDetIt{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ar-det .it{animation:none}.feed>div.ar-vd:hover{transform:none}}
`; document.head.appendChild(st); })();

function arItens(v){ let l = v && v.itens; if(typeof l==='string'){ try{ l = JSON.parse(l); }catch(e){ l = []; } } return Array.isArray(l) ? l : []; }
function arFotoItem(i, w){ const p = i.id ? estProdV25(i.id) : null; return p && typeof fotoUrl==='function' ? fotoUrl(p, w) : ''; }
function arEmoItem(i){ return i.avulso ? '➕' : emojiDe(estProdV25(i.id) || {nome:i.nome, categoria:i.cat}); }
function arMinis(v){
  const l = arItens(v), max = 4, mostra = l.length > max ? l.slice(0, max-1) : l;
  return `<div class="ar-minis">${mostra.map(i=>{ const u = arFotoItem(i, 80), e = arEmoItem(i), q = i.qtd>1?`<span class="q">${i.qtd}×</span>`:'';
    return u ? `<span class="m" title="${esc(i.nome)}"><img src="${esc(u)}" loading="lazy" alt="" onerror="this.parentNode.classList.add('sem');this.outerHTML='${e}'">${q}</span>` : `<span class="m sem" title="${esc(i.nome)}">${e}${q}</span>`; }).join('')}${l.length>max?`<span class="ar-mais">+${l.length-max+1}</span>`:''}</div>`;
}
let _arFeed = [];
const _arenaCalcV26 = arenaCalc;
arenaCalc = function arenaCalc(){ const A = _arenaCalcV26(); _arFeed = A.feed || []; return A; };
const _arenaHTMLV26 = arenaHTML;
arenaHTML = function arenaHTML(tv){
  const h = _arenaHTMLV26(tv), ini = h.indexOf('<div class="feed">');
  if(ini < 0 || !_arFeed.length) return h;
  const feed = _arFeed, cauda = h.slice(ini).replace(/<div style="--i:(\d+)" class="([^"]*)">([\s\S]*?)<\/small><\/div><span class="v">([^<]*)<\/span><\/div>/g, (m, i, cls, meio, val)=>{
    const v = feed[Number(i)]; if(!v) return m;
    return `<div style="--i:${i}" class="${cls} ar-vd" role="button" tabindex="0" title="Ver detalhes da venda" onclick="arVendaVer('${esc(v.id)}')" onkeydown="if(event.key==='Enter')arVendaVer('${esc(v.id)}')">${meio}</small>${arMinis(v)}</div><span class="v">${val}</span><i class="ti ti-chevron-right ar-ch"></i></div>`;
  });
  return h.slice(0, ini) + cauda;
};
function arVendaVer(id){
  const v = (pdvD().vendas||[]).find(x=>x.id===id) || _arFeed.find(x=>x.id===id); if(!v) return;
  const l = arItens(v), cor = {cor:'#F5B524', nome:v.colaboradora};
  try{ const eq = (S.sess?.dados?.equipe || S.adm?.dados?.colaboradoras || []); const x = eq.find(e=>e.id===v.colaboradora_id); if(x) Object.assign(cor, x); }catch(e){}
  const forma = (FORMAS[v.pagamento]?.n || v.pagamento) + (v.pagamento==='credito' && Number(v.parcelas)>1 ? ' · '+v.parcelas+'×' : '');
  const pecas = l.reduce((s,i)=>s+(Number(i.qtd)||0),0);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Venda #${esc(v.numero||'')}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c ar-det">
      <div class="topo">${avatar(cor,'',42)}<div><b>${esc(primeiroNome(v.colaboradora))}</b><small class="suave" style="display:block;font-size:12px">${esc(v.hora||'')} · Loja ${esc(S.boot.lojas[v.loja]?.nome||v.loja||'')}</small></div>
        <div class="tt"><small class="suave">Total</small><b>${brl2(v.total)}</b></div></div>
      ${l.map((i,n)=>{ const u = arFotoItem(i, 160), e = arEmoItem(i);
        const ft = u ? `<span class="ft" onclick="${i.id?`fotoVer('${esc(i.id)}')`:''}"><img src="${esc(u)}" alt="" onerror="this.parentNode.classList.add('sem');this.outerHTML='${e}'"></span>` : `<span class="ft sem">${e}</span>`;
        return `<div class="it" style="--i:${n}">${ft}<div style="min-width:0"><div class="nm">${esc(i.nome)}</div><small>${i.qtd} × ${brl2(i.preco)}${i.codigo?' · cód. '+esc(i.codigo):''}</small></div><span class="vl">${brl2(i.qtd*i.preco)}</span></div>`; }).join('')}
      <div class="soma">
        <div><span>Subtotal · ${pecas} ${pecas===1?'peça':'peças'}</span><span>${brl2(v.subtotal||v.total)}</span></div>
        ${Number(v.desconto)>0?`<div><span>Desconto</span><span class="neg">− ${brl2(v.desconto)}</span></div>`:''}${Number(v.acrescimo)>0?`<div><span>Acréscimo</span><span>+ ${brl2(v.acrescimo)}</span></div>`:''}
        <div class="tot"><span>Total</span><span>${brl2(v.total)}</span></div>
      </div>
      <div class="tags"><span>💳 ${esc(forma)}</span>${v.pagamento==='dinheiro'&&Number(v.troco)>0?`<span>💵 Troco ${brl2(v.troco)}</span>`:''}<span>🛍️ ${pecas} ${pecas===1?'peça':'peças'}</span></div>
    </div></div></div>`;
}
