/* v25: miniatura do produto em cada item da comanda (PDV).
   Usa a mesma foto do catálogo (fotoUrl/pIco do app13). Sem foto → emoji da categoria.
   Tocar na miniatura abre a foto grande. Carregado depois de app22/app23/app24, antes do app12. */
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
