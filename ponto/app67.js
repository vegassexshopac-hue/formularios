/* ═══════════ v67: Etiquetas (25/11/2026) ═══════════
   Pedido da Madu (vídeo da "Emissão de Etiquetas" do Gestão Fácil): um botão para as vendedoras imprimirem etiquetas
   pelo portal — e muito melhor que o sistema antigo.
   • Início da equipe: cartão "🏷️ Imprimir etiquetas" → janela em tela cheia.
   • 1) Escolher: bipa o código ou digita o nome (Enter já põe na lista); entradas de mercadoria recentes viram
        etiquetas com um toque (uma por peça que chegou); mais vendidos como atalho.
   • 2) Conferir e imprimir: a etiqueta aparece na tela do jeito que sai (nome, preço, código de barras),
        quantidade com + e −, "igual ao estoque", 3 modelos (com preço · sem preço · preço grande).
   • Impressora térmica de etiquetas (rolo 40×40 mm, 1 coluna — a mesma do vídeo): cada etiqueta é uma página do
     tamanho exato. Tamanho, deslocamento e etiqueta de teste em "Ajustes da impressora" (ficam guardados no aparelho).
   • Código de barras Code 128 gerado aqui mesmo, com o código que o leitor do PDV já reconhece (código interno/EAN).
   • Estoque › Produtos: a ficha do produto ganha o botão "Imprimir etiqueta".
   • Não tem servidor: usa o catálogo que já está no aparelho. Para voltar: tirar a linha do app67 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
.et67-card{background:linear-gradient(120deg,#1C1416,#3b2b30 55%,#E39A00);color:#fff;border:0;border-radius:18px;padding:13px 16px;margin:12px 0;width:100%;display:flex;gap:12px;align-items:center;text-align:left;font:inherit;cursor:pointer;box-shadow:0 6px 18px rgba(28,20,22,.25);animation:et67Sobe .4s both;transition:transform .15s var(--mola,ease)}
.et67-card:hover{transform:translateY(-2px)}.et67-card:active{transform:scale(.98)}
.et67-card .ic{font-size:28px;animation:et67Bal 3.2s ease-in-out infinite;transform-origin:20% 20%}
.et67-card b{display:block;font-size:15.5px}.et67-card small{display:block;font-size:12.5px;opacity:.92;line-height:1.35}
.et67-card .n{background:#fff;color:#A86F00;font-weight:800;border-radius:99px;padding:2px 10px;font-size:13px;margin-left:auto;flex:none}
@keyframes et67Sobe{from{opacity:0;transform:translateY(8px)}}
@keyframes et67Bal{0%,100%{transform:rotate(0)}8%{transform:rotate(-14deg)}16%{transform:rotate(10deg)}24%{transform:rotate(0)}}
@keyframes et67Fade{from{opacity:0}}
@keyframes et67Sai{from{transform:translateY(-70%);opacity:.2}}
@keyframes et67Pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
@keyframes et67Pisca{0%{background:#FFF3D6}100%{background:#fff}}
.et67-fx{position:fixed;inset:0;z-index:130;background:rgba(28,20,22,.5);backdrop-filter:blur(5px);display:flex;align-items:stretch;justify-content:center;padding:18px;animation:et67Fade .2s}
.et67-jan{background:var(--noite,#F3F1F2);border-radius:24px;width:100%;max-width:1240px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);animation:et67Sobe .3s both}
.et67-h{background:linear-gradient(120deg,#1C1416,#3b2b30 60%,#8a5d00);color:#fff;padding:14px 18px;display:flex;gap:12px;align-items:center;flex:none}
.et67-h .ic{font-size:30px}.et67-h h3{margin:0;font-size:20px;line-height:1.1}.et67-h small{display:block;opacity:.85;font-size:12.5px;margin-top:2px}
.et67-h .x{margin-left:auto;background:rgba(255,255,255,.16);border:0;color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:18px;flex:none;transition:transform .15s}.et67-h .x:hover{transform:rotate(90deg)}
.et67-g{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:14px;padding:14px;flex:1;min-height:0}
.et67-col{background:#fff;border-radius:18px;box-shadow:var(--sh,0 1px 3px rgba(0,0,0,.08));display:flex;flex-direction:column;min-height:0;overflow:hidden}
.et67-rola{overflow:auto;flex:1;min-height:0;padding:0 14px 14px;scrollbar-width:thin}
.et67-passo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:15.5px;padding:14px 14px 10px;flex:none}
.et67-passo i{font-style:normal;width:26px;height:26px;border-radius:50%;background:var(--vermelho,#E3101F);color:#fff;display:grid;place-items:center;font-size:14px;flex:none}
.et67-passo span{margin-left:auto;font-weight:700;font-size:12.5px;color:var(--creme2,#777)}
.et67-busca{position:relative;margin:0 14px 10px;flex:none}
.et67-busca input{width:100%;padding:14px 14px 14px 46px;border-radius:14px;border:2px solid var(--linha2,#ddd);font:inherit;font-size:16px;background:#fff;transition:border-color .15s,box-shadow .15s}
.et67-busca input:focus{outline:0;border-color:var(--dourado,#E39A00);box-shadow:0 0 0 4px rgba(227,154,0,.16)}
.et67-busca>i{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:22px;color:var(--ouro-escuro,#A86F00)}
.et67-sec{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--creme3,#999);margin:12px 2px 6px}
.et67-p{display:flex;gap:10px;align-items:center;width:100%;text-align:left;font:inherit;background:#fff;border:1px solid var(--linha,#eee);border-radius:14px;padding:8px 10px;margin-bottom:6px;cursor:pointer;transition:transform .12s,border-color .12s,box-shadow .12s;animation:et67Sobe .25s both}
.et67-p:hover{border-color:var(--dourado,#E39A00);box-shadow:0 4px 14px -6px rgba(227,154,0,.5);transform:translateY(-1px)}.et67-p:active{transform:scale(.985)}
.et67-p .t{flex:1;min-width:0}.et67-p .t>b{display:block;font-size:14px;line-height:1.25}.et67-p .t small{display:block;font-size:12px;color:var(--creme2,#777);line-height:1.35}
.et67-p .e67m{flex:none;background:var(--ouro-claro,#FFF3D6);color:var(--ouro-escuro,#A86F00);border-radius:99px;padding:5px 11px;font-size:12.5px;font-weight:800;white-space:nowrap}
.et67-p.tem .e67m{background:var(--ok-bg,#e5f6ee);color:var(--ok,#0E9F62)}
.et67-ent{display:flex;gap:10px;align-items:center;background:var(--veludo2,#F8F5F6);border-radius:14px;padding:9px 11px;margin-bottom:6px}
.et67-ent .t{flex:1;min-width:0}.et67-ent b{display:block;font-size:13.5px}.et67-ent small{display:block;font-size:12px;color:var(--creme2,#777)}
.et67-bt{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;background:var(--creme,#1C1416);color:#fff;white-space:nowrap;flex:none;transition:transform .12s}
.et67-bt:hover{transform:translateY(-1px)}.et67-bt:active{transform:scale(.95)}
.et67-bt.cl{background:#fff;color:var(--creme,#1C1416);border:1px solid var(--linha2,#ddd)}
.et67-vazio{text-align:center;color:var(--creme2,#777);font-size:13.5px;padding:22px 10px}.et67-vazio .e{font-size:38px;display:block;margin-bottom:6px}
.et67-palco{background:repeating-linear-gradient(135deg,#f3eee6,#f3eee6 10px,#efe8dd 10px,#efe8dd 20px);border-radius:16px;margin:0 14px;padding:0 14px 14px;display:flex;gap:14px;align-items:flex-start;flex:none}
.et67-maq{flex:none;display:flex;flex-direction:column;align-items:center}
.et67-boca{width:calc(100% + 16px);height:11px;background:#1C1416;border-radius:0 0 8px 8px;box-shadow:0 3px 6px rgba(0,0,0,.25);position:relative;z-index:2}
.et67-papel{overflow:hidden;padding:9px 4px 6px;margin-top:-3px}
.et67-zoom{box-shadow:0 6px 16px -4px rgba(0,0,0,.35);border-radius:3px;overflow:hidden;animation:et67Sai .45s var(--suave,ease) both;background:#fff}
.et67-zoom>.etq{transform-origin:0 0}
.et67-lado{flex:1;min-width:0;padding-top:14px}
.et67-lado h4{margin:0 0 2px;font-size:13.5px}.et67-lado p{margin:0 0 8px;font-size:12px;color:var(--creme2,#777);line-height:1.35}
.et67-seg{display:flex;flex-wrap:wrap;gap:6px}
.et67-seg button{border:1.5px solid var(--linha2,#ddd);background:#fff;border-radius:99px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:all .12s}
.et67-seg button.on{background:var(--creme,#1C1416);border-color:var(--creme,#1C1416);color:#fff}
.et67-f{display:flex;gap:9px;align-items:center;border:1px solid var(--linha,#eee);border-radius:14px;padding:7px 8px 7px 10px;margin-bottom:6px;cursor:pointer;transition:border-color .12s;background:#fff}
.et67-f.sel{border-color:var(--dourado,#E39A00);box-shadow:0 0 0 3px rgba(227,154,0,.14)}
.et67-f.novo{animation:et67Pisca 1s both}
.et67-f .t{flex:1;min-width:0}.et67-f .t>b{display:block;font-size:13.5px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.et67-f .t small{display:block;font-size:11.5px;color:var(--creme2,#777)}
.et67-f .t .al{color:var(--warn,#B86E00);font-weight:700}
.et67-f .t .lk{background:none;border:0;padding:0;font:inherit;font-size:11.5px;font-weight:700;color:var(--info,#2563EB);cursor:pointer;text-decoration:underline}
.et67-q{display:flex;align-items:center;flex:none;background:var(--veludo2,#F8F5F6);border-radius:12px}
.et67-q button{width:34px;height:36px;border:0;background:none;font-size:19px;font-weight:800;cursor:pointer;color:var(--creme,#1C1416);border-radius:12px}.et67-q button:active{background:var(--linha2,#ddd)}
.et67-q input{width:40px;border:0;background:none;text-align:center;font:inherit;font-size:15.5px;font-weight:800;padding:0;-moz-appearance:textfield}.et67-q input::-webkit-outer-spin-button,.et67-q input::-webkit-inner-spin-button{-webkit-appearance:none}
.et67-q input:focus{outline:0}.et67-q.pop input{animation:et67Pop .25s}
.et67-rm{border:0;background:none;color:var(--creme3,#999);cursor:pointer;font-size:17px;width:30px;height:36px;flex:none;border-radius:10px}.et67-rm:hover{color:var(--bad,#D7263D);background:var(--bad-bg,#fde)}
.et67-barra{flex:none;border-top:1px solid var(--linha,#eee);padding:12px 14px;background:#fff}
.et67-imp{width:100%;border:0;border-radius:16px;padding:15px 16px;font:inherit;font-size:17px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(120deg,#C10A18,var(--vermelho,#E3101F) 60%,#F0262F);box-shadow:0 10px 24px -10px rgba(227,16,31,.7);display:flex;gap:10px;align-items:center;justify-content:center;transition:transform .12s,filter .12s}
.et67-imp:hover{transform:translateY(-2px)}.et67-imp:active{transform:scale(.98)}.et67-imp[disabled]{filter:grayscale(1);opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.et67-sub{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:9px;font-size:12.5px;color:var(--creme2,#777);flex-wrap:wrap}
.et67-sub button{background:none;border:0;font:inherit;font-size:12.5px;font-weight:700;color:var(--creme2,#666);cursor:pointer;text-decoration:underline;padding:2px}
.et67-pos{background:var(--ok-bg,#e5f6ee);border-radius:14px;padding:11px 12px;animation:et67Sobe .3s both}
.et67-pos b{display:block;font-size:14.5px;margin-bottom:8px}.et67-pos .bs{display:flex;gap:6px;flex-wrap:wrap}
.et67-aj{margin:10px 14px 0;background:var(--veludo2,#F8F5F6);border-radius:14px;padding:12px;flex:none;animation:et67Sobe .25s both}
.et67-aj h4{margin:0 0 6px;font-size:13.5px}.et67-aj h4:not(:first-child){margin-top:12px}
.et67-aj .ln{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:13px}
.et67-aj input[type=number]{width:62px;padding:7px 6px;border-radius:10px;border:1.5px solid var(--linha2,#ddd);font:inherit;font-size:14px;text-align:center}
.et67-aj ol{margin:4px 0 0;padding-left:18px;font-size:12.5px;line-height:1.5;color:var(--creme2,#555)}
.et67-set{width:34px;height:34px;border-radius:10px;border:1.5px solid var(--linha2,#ddd);background:#fff;cursor:pointer;font-size:15px}
.et67-aviso{margin:0 14px 10px;background:var(--info-bg,#eef3ff);color:var(--info,#2563EB);border-radius:12px;padding:8px 11px;font-size:12.5px;font-weight:600;flex:none}
@media(max-width:900px){
  .et67-fx{padding:0}.et67-jan{border-radius:0;max-width:none}
  .et67-g{display:block;overflow:auto;padding:10px}.et67-col{margin-bottom:10px;overflow:visible}.et67-rola{overflow:visible}
  .et67-esq .et67-rola{max-height:46vh;overflow:auto}
  .et67-barra{position:sticky;bottom:0;box-shadow:0 -8px 20px -10px rgba(0,0,0,.25);border-radius:0 0 18px 18px}
  .et67-f .t>b{white-space:normal}
  .et67-palco{flex-direction:column;align-items:center}.et67-lado{padding-top:0;width:100%}
}
@media(prefers-reduced-motion:reduce){.et67-card .ic,.et67-zoom,.et67-p,.et67-f.novo{animation:none}}
` + ET67_CSS_ETQ(); document.head.appendChild(st); })();

/* ───────── a etiqueta (o mesmo desenho vale para a tela e para a impressora) ───────── */
function ET67_CSS_ETQ(){ return `
.etq{box-sizing:border-box;width:var(--w);height:var(--h);background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;overflow:hidden;position:relative;line-height:1.1;text-align:center}
.etq *{box-sizing:border-box;margin:0;padding:0}
.etq .in{position:absolute;inset:0;padding:calc(1.5mm*var(--k)) calc(1.6mm*var(--k));display:flex;flex-direction:column;align-items:center;justify-content:space-between;transform:translate(var(--dx),var(--dy))}
.etq .lj{width:100%;font-size:calc(2.15mm*var(--k));font-weight:900;letter-spacing:.3mm;border-bottom:.3mm solid #000;padding-bottom:calc(.5mm*var(--k));white-space:nowrap}
.etq .nm{width:100%;font-weight:700;font-size:calc(var(--fn)*var(--k));line-height:1.13;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:var(--ln,3);word-break:break-word}
.etq .de{font-size:calc(2.1mm*var(--k));font-weight:700;text-decoration:line-through;line-height:1}
.etq .pr{font-weight:900;font-size:calc(var(--fp)*var(--k));line-height:.95;white-space:nowrap;letter-spacing:-.1mm}
.etq .pr small{font-size:.4em;font-weight:900;vertical-align:.95em;margin-right:.5mm;letter-spacing:0}
.etq .pr i{font-style:normal;font-size:.5em;vertical-align:.82em;letter-spacing:0}
.etq .bc{display:flex;flex-direction:column;align-items:center}
.etq .bc svg{display:block;height:calc(var(--hb)*var(--k))}
.etq .cd{font-size:calc(2.2mm*var(--k));font-weight:700;letter-spacing:.35mm;line-height:1;margin-top:calc(.5mm*var(--k))}
.etq .tq{position:absolute;inset:1mm;border:.3mm solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;font-weight:900;font-size:calc(3mm*var(--k));transform:translate(var(--dx),var(--dy))}
.etq .tq small{font-size:.62em;font-weight:700}
.etq .tq:before,.etq .tq:after{content:'';position:absolute;background:#000}
.etq .tq:before{left:50%;top:0;height:2mm;width:.3mm}.etq .tq:after{top:50%;left:0;width:2mm;height:.3mm}
`; }

/* Code 128 (conjuntos B e C). Devolve as larguras das barras/espaços, em módulos. */
const ET67_C128 = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112'.split(' ');
function et67Valores(txt){
  const s = String(txt), v = [];
  if(/^\d{4,}$/.test(s)){
    let i = 0;
    if(s.length % 2){ v.push(104, s.charCodeAt(0)-32, 99); i = 1; } else v.push(105);
    for(; i < s.length; i += 2) v.push(Number(s.substr(i, 2)));
  } else {
    v.push(104);
    for(const ch of s){ const c = ch.charCodeAt(0); v.push(c >= 32 && c <= 126 ? c-32 : 31); }
  }
  let soma = v[0]; for(let i = 1; i < v.length; i++) soma += v[i]*i;
  v.push(soma % 103, 106);
  return v;
}
function et67Barras(txt, largMaxMm, alturaCss){
  const pad = et67Valores(txt).map(n=>ET67_C128[n]).join('');
  let mod = 0; for(const c of pad) mod += Number(c);
  const passo = [0.5, 0.375, 0.25].find(m => (mod+12)*m <= largMaxMm);      // múltiplos do ponto da térmica (0,125 mm)
  const m = passo || Math.max(0.19, largMaxMm/(mod+8));
  let x = 0, r = '';
  for(let i = 0; i < pad.length; i++){ const w = Number(pad[i]); if(i % 2 === 0) r += `<rect x="${x}" y="0" width="${w}" height="1"/>`; x += w; }
  return { apertado: !passo, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mod} 1" preserveAspectRatio="none" shape-rendering="crispEdges" style="width:${(mod*m).toFixed(3)}mm${alturaCss?';height:'+alturaCss:''}" fill="#000">${r}</svg>` };
}

/* ───────── estado (fica guardado no aparelho) ───────── */
const ET67 = Object.assign({ fila:[], modelo:'preco', cfg:{}, q:'', sel:null, aj:false, pos:false, novo:null }, (function(){ const g = LS.get('lv_etq67', null) || {}; return { fila: Array.isArray(g.fila) ? g.fila.filter(x=>x && x.id).map(x=>({id:String(x.id), qtd:Math.max(1, Math.min(200, parseInt(x.qtd)||1))})) : [], modelo: ['preco','sempreco','grande'].includes(g.modelo) ? g.modelo : 'preco', cfg: g.cfg || {} }; })());
ET67.cfg = Object.assign({ w:40, h:40, dx:0, dy:0, marca:true }, ET67.cfg);
const ET67_MOD = { preco:['Com preço','Nome, preço e código de barras — a etiqueta do dia a dia.'], sempreco:['Sem preço','Só nome e código de barras — para presente.'], grande:['Preço grande','Preço bem grande, sem código de barras — para a prateleira.'] };
function et67Salvar(){ LS.set('lv_etq67', { fila: ET67.fila, modelo: ET67.modelo, cfg: ET67.cfg }); }
function et67Prods(){ try{ return (typeof pdvD==='function' && pdvD().produtos) || []; }catch(e){ return []; } }
function et67Mapa(){
  const P = et67Prods();
  if(ET67._m && ET67._mP === P) return ET67._m;
  const id = {}, cod = {}, vezes = {};
  P.forEach(p=>{ id[p.id] = p; const c = et67Cod(p); if(c) vezes[c.toLowerCase()] = (vezes[c.toLowerCase()]||0) + 1;
    [p.codigo, p.sku].forEach(x=>{ x = String(x||'').trim().toLowerCase(); if(x && !cod[x]) cod[x] = p; }); });
  ET67._m = {id, cod, vezes}; ET67._mP = P; return ET67._m;
}
const et67P = id => et67Mapa().id[id] || null;
/* o código que vai nas barras: o mais curto entre o código interno e o EAN (barras maiores leem melhor); o leitor do PDV reconhece os dois */
function et67Cod(p){ const a = String(p.sku||'').trim(), b = String(p.codigo||'').trim(); const ok = x => x && x.length <= 20 && /^[\x20-\x7E]+$/.test(x); return ok(a) && ok(b) ? (a.length < b.length ? a : b) : ok(a) ? a : ok(b) ? b : ''; }
function et67Repetido(p){ const c = et67Cod(p); return !!c && et67Mapa().vezes[c.toLowerCase()] > 1; }
function et67Preco(p){ try{ return typeof precoDe==='function' ? precoDe(p) : p.preco; }catch(e){ return p.preco; } }
function et67Loja(){ try{ if(typeof estAdmin==='function' && estAdmin()) return (estLocais()[0]||{}).id || ''; return lojaAtual(); }catch(e){ return ''; } }
function et67Est(p){ try{ const q = estQtdDe(p.id, et67Loja()); return q==null ? null : Math.max(0, Math.floor(q)); }catch(e){ return null; } }
function et67LojaNome(){ try{ return estLojaNome(et67Loja()); }catch(e){ return 'loja'; } }
function et67Ico(p, px){ try{ return typeof pIco==='function' ? pIco(p, px).replace(/ onclick="[^"]*"/, '') : ''; }catch(e){ return ''; } }
function et67Fila(){ ET67.fila = ET67.fila.filter(x=>!et67Prods().length || et67P(x.id)); return ET67.fila; }
function et67Total(){ return et67Fila().reduce((s,x)=>s+x.qtd, 0); }

/* ───────── desenho da etiqueta ───────── */
function et67Reais(v){
  const n = Math.round((Number(v)||0)*100), int = Math.floor(n/100).toLocaleString('pt-BR'), cent = String(n%100).padStart(2,'0');
  return `<small>R$</small>${int}<i>,${cent}</i>`;
}
function et67Estilo(){ const c = ET67.cfg, k = Math.max(.5, Math.min(1.6, Math.min(c.w, c.h*1.0)/40)); return `--w:${c.w}mm;--h:${c.h}mm;--k:${k.toFixed(3)};--dx:${c.dx}mm;--dy:${c.dy}mm`; }
function et67Etiqueta(p, modelo){
  const c = ET67.cfg, k = Math.max(.5, Math.min(1.6, Math.min(c.w, c.h)/40)), nome = String(p.nome||'').replace(/\s+/g,' ').trim(), cod = et67Cod(p);
  const baixa = c.h/c.w < .8, n = nome.length;
  let fn = n <= 18 ? 3.5 : n <= 34 ? 3.0 : n <= 54 ? 2.6 : 2.25, ln = baixa ? 2 : 3, fp = 7.2, hb = baixa ? 6.5 : 8.5;
  const preco = et67Preco(p), cheio = Number(p.preco)||0, promo = preco > 0 && preco < cheio;
  if(modelo==='sempreco'){ fn += .5; hb = baixa ? 8 : 12; ln = baixa ? 2 : 4; }
  if(modelo==='grande'){ fp = baixa ? 9 : 11; fn += .3; }
  if(String(Math.round(preco)).length >= 4) fp *= .86;
  const marca = c.marca ? `<div class="lj">LAS VEGAS</div>` : '';
  const barras = cod && modelo!=='grande' ? et67Barras(cod, c.w-3, '') : null;
  const bc = barras ? `<div class="bc">${barras.svg}<div class="cd">${esc(cod)}</div></div>` : (cod ? `<div class="cd">cód. ${esc(cod)}</div>` : '');
  const pr = modelo==='sempreco' ? '' : `<div>${promo?`<div class="de">de R$ ${cheio.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>`:''}<div class="pr">${et67Reais(preco)}</div></div>`;
  return `<div class="etq" style="${et67Estilo()};--fn:${fn}mm;--fp:${fp}mm;--hb:${hb}mm;--ln:${ln}"><div class="in">${marca}<div class="nm">${esc(nome)}</div>${pr}${bc}</div></div>`;
}
function et67EtiquetaTeste(){ const c = ET67.cfg; return `<div class="etq" style="${et67Estilo()}"><div class="tq">TESTE<small>${c.w} × ${c.h} mm</small><small>a moldura tem que sair inteira</small></div></div>`; }

/* ───────── impressão: cada etiqueta é uma página do tamanho exato do rolo ───────── */
function et67Doc(etqs){
  const c = ET67.cfg;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiquetas</title><style>@page{size:${c.w}mm ${c.h}mm;margin:0}html,body{margin:0;padding:0;background:#fff}${ET67_CSS_ETQ()}.etq{break-after:page;page-break-after:always;break-inside:avoid}.etq:last-child{break-after:auto;page-break-after:auto}@media print{html,body{width:${c.w}mm}}</style></head><body>${etqs.join('')}</body></html>`;
}
function et67Mandar(etqs, titulo){
  const antes = document.title; document.title = titulo || 'Etiquetas';
  document.getElementById('et67-fr')?.remove();
  const fr = document.createElement('iframe'); fr.id = 'et67-fr'; fr.setAttribute('aria-hidden','true');
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(fr);
  const d = fr.contentDocument; d.open(); d.write(et67Doc(etqs)); d.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){ toast('Não consegui abrir a impressão neste aparelho', true); }
    setTimeout(()=>{ document.title = antes; }, 1500); setTimeout(()=>{ if(fr.isConnected && document.getElementById('et67-fr')===fr) fr.remove(); }, 60000); }, 300);
}
function et67Imprimir(){
  const F = et67Fila(), total = et67Total(); if(!total) return;
  if(total > 600){ toast('São '+total+' etiquetas de uma vez — imprima em partes de até 600', true); return; }
  if(total > 150 && !confirm('Imprimir '+total+' etiquetas de uma vez?')) return;
  const etqs = []; F.forEach(x=>{ const p = et67P(x.id); if(!p) return; const h = et67Etiqueta(p, ET67.modelo); for(let i = 0; i < x.qtd; i++) etqs.push(h); });
  et67Mandar(etqs, 'Etiquetas Las Vegas ('+total+')');
  ET67.pos = true; et67Pintar();
}
function et67Teste(){ et67Mandar([et67EtiquetaTeste()], 'Etiqueta de teste'); }

/* ───────── lista ───────── */
function et67Add(id, qtd, silencio){
  const p = et67P(id); if(!p) return false;
  const x = ET67.fila.find(f=>f.id===id), n = Math.max(1, parseInt(qtd)||1);
  if(x) x.qtd = Math.min(200, x.qtd + n); else ET67.fila.unshift({id, qtd: Math.min(200, n)});
  ET67.sel = id; ET67.novo = id; ET67.pos = false; et67Salvar();
  if(!silencio){ et67Pintar(); try{ if(typeof estBip==='function') estBip(true); }catch(e){} }
  return true;
}
function et67Qtd(id, v, rel){
  const x = ET67.fila.find(f=>f.id===id); if(!x) return;
  const n = rel ? x.qtd + v : parseInt(v);
  if(!rel && isNaN(n)) return;
  if(n < 1){ if(rel) et67Tirar(id); return; }
  x.qtd = Math.min(200, n); ET67.sel = id; ET67.pos = false; et67Salvar(); et67Pintar('qtd');
}
function et67Tirar(id){ ET67.fila = ET67.fila.filter(f=>f.id!==id); if(ET67.sel===id) ET67.sel = ET67.fila[0]?.id || null; et67Salvar(); et67Pintar(); }
function et67Limpar(sem){ if(!sem && ET67.fila.length > 2 && !confirm('Tirar tudo da lista de etiquetas?')) return; ET67.fila = []; ET67.sel = null; ET67.pos = false; et67Salvar(); et67Pintar(); }
function et67Igualar(id){
  const alvo = id ? ET67.fila.filter(f=>f.id===id) : ET67.fila; let n = 0;
  alvo.forEach(x=>{ const p = et67P(x.id), q = p ? et67Est(p) : null; if(q > 0){ x.qtd = Math.min(200, q); n++; } });
  et67Salvar(); et67Pintar();
  if(!id) toast(n ? 'Quantidades iguais ao estoque de '+et67LojaNome()+' ✔' : 'Nenhum desses produtos tem estoque lançado nesta loja', !n);
}
function et67Entrada(eid){
  const e = ((typeof estD==='function' && estD().entradas) || []).find(x=>x.id===eid); if(!e) return;
  let n = 0; (e.itens||[]).slice().reverse().forEach(i=>{ const q = Math.floor(Number(i.qtd)||0); if(q > 0 && et67Add(i.produto_id, q, true)) n += q; });
  et67Pintar(); toast(n ? '🏷️ '+n+' etiquetas na lista — uma para cada peça que chegou' : 'Não achei os produtos dessa entrada no catálogo', !n);
}

/* ───────── busca ───────── */
function et67Achar(q){
  q = String(q||'').trim(); if(!q) return null;
  try{ if(typeof estAcharCodigo==='function'){ const p = estAcharCodigo(q); if(p) return p; } }catch(e){}
  return et67Mapa().cod[q.toLowerCase()] || null;
}
function et67Filtrar(){
  const q = semAcento(ET67.q.trim()); if(!q) return [];
  const ws = q.split(/\s+/);
  const r = et67Prods().filter(p=>{ const t = semAcento((p.nome||'')+' '+(p.codigo||'')+' '+(p.sku||'')+' '+(p.categoria||'')); return ws.every(w=>t.includes(w)); });
  r.sort((a,b)=>(semAcento(a.nome).startsWith(q)?0:1)-(semAcento(b.nome).startsWith(q)?0:1) || String(a.nome).localeCompare(String(b.nome)));
  return r;
}
function et67Tecla(ev){
  if(ev.key==='Enter'){
    const q = ET67.q.trim(); if(!q) return;
    const exato = et67Achar(q), f = exato ? [exato] : et67Filtrar();
    if(f.length===1){ et67Add(f[0].id, 1); ET67.q = ''; ev.target.value = ''; et67Pintar('res'); }
    else if(!f.length) toast('Nenhum produto com "'+q+'"', true);
    else toast('Mais de um produto — toque no certo');
  } else if(ev.key==='Escape' && ET67.q){ ev.stopPropagation(); ET67.q = ''; ev.target.value = ''; et67Pintar('res'); }
}
function et67Linha(p, i){
  const na = ET67.fila.find(f=>f.id===p.id), est = et67Est(p), cod = et67Cod(p);
  return `<button class="et67-p ${na?'tem':''}" data-a="add" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i,10)*22}ms">${et67Ico(p, 42)}
    <span class="t"><b>${esc(p.nome)}</b><small>${cod?'cód. '+esc(cod):'sem código'} · <b>${brl2(et67Preco(p))}</b>${est!=null?` · ${esc(et67LojaNome())}: ${est} un`:''}</small></span>
    <span class="e67m">${na?`na lista · ${na.qtd}`:'＋ etiqueta'}</span></button>`;
}
function et67ResHtml(){
  const P = et67Prods();
  if(!P.length) return `<div class="et67-vazio"><span class="e">📦</span>O catálogo de produtos ainda não carregou neste aparelho. Feche, espere um instante e abra de novo.</div>`;
  if(ET67.q.trim()){
    const r = et67Filtrar();
    if(!r.length) return `<div class="et67-vazio"><span class="e">🔎</span>Nenhum produto com "<b>${esc(ET67.q.trim())}</b>".<br>Confira o nome ou bipe o código de barras.</div>`;
    return `<div class="et67-sec">${r.length} produto${r.length>1?'s':''}${r.length>40?' · mostrando 40, digite mais do nome':''}</div>` + r.slice(0,40).map(et67Linha).join('');
  }
  let h = '';
  const ent = ((typeof estD==='function' && estD().entradas) || []).filter(e=>e.status!=='cancelada' && (e.itens||[]).some(i=>et67P(i.produto_id))).slice(0,3);
  if(ent.length) h += `<div class="et67-sec">📦 Chegou mercadoria? Etiqueta de tudo com um toque</div>` + ent.map(e=>{ const n = (e.itens||[]).reduce((s,i)=>s+(et67P(i.produto_id)?Math.max(0,Math.floor(Number(i.qtd)||0)):0),0);
    return `<div class="et67-ent"><span style="font-size:24px">🚚</span><span class="t"><b>${esc(e.fornecedor||'Entrada')}${e.numero?' · NF '+esc(e.numero):''}</b><small>${String(e.criada_em||'').slice(8,10)}/${String(e.criada_em||'').slice(5,7)} · ${(e.itens||[]).length} produto${(e.itens||[]).length>1?'s':''} · ${n} peça${n>1?'s':''}</small></span><button class="et67-bt" data-a="ent" data-id="${esc(e.id)}">＋ ${n} etiqueta${n>1?'s':''}</button></div>`; }).join('');
  let mv = {}; try{ mv = maisVendidos(); }catch(e){}
  const top = P.filter(p=>mv[p.id]).sort((a,b)=>mv[b.id]-mv[a.id]).slice(0,8);
  if(top.length) h += `<div class="et67-sec">🔥 Mais vendidos do mês</div>` + top.map(et67Linha).join('');
  return h || `<div class="et67-vazio"><span class="e">🏷️</span>Bipe o código de barras ou digite o nome do produto aqui em cima.</div>`;
}

/* ───────── direita: prévia, lista e imprimir ───────── */
function et67PrevHtml(){
  const c = ET67.cfg, sel = et67P(ET67.sel) || et67P(ET67.fila[0]?.id);
  const amostra = sel || { nome:'Nome do produto aparece aqui', preco:35, sku:'605' };
  const z = Math.min(1.7, 250/(c.w*3.78), 250/(c.h*3.78));
  return `<div class="et67-palco"><div class="et67-maq"><div class="et67-boca"></div><div class="et67-papel"><div class="et67-zoom" id="et67-zoom" style="width:calc(${c.w}mm*${z});height:calc(${c.h}mm*${z})">${et67Etiqueta(amostra, ET67.modelo).replace('class="etq" style="', `class="etq" style="transform:scale(${z});`)}</div></div></div>
    <div class="et67-lado"><h4>${sel?'Vai sair assim':'Exemplo da etiqueta'} <span style="font-weight:600;color:var(--creme2,#777)">· ${c.w} × ${c.h} mm</span></h4><p>${esc(ET67_MOD[ET67.modelo][1])}</p>
      <div class="et67-seg">${Object.keys(ET67_MOD).map(k=>`<button class="${ET67.modelo===k?'on':''}" data-a="modelo" data-id="${k}">${ET67_MOD[k][0]}</button>`).join('')}</div></div></div>`;
}
function et67FilaHtml(){
  const F = et67Fila();
  if(!F.length) return `<div class="et67-vazio"><span class="e">👈</span>A lista está vazia.<br>Escolha os produtos ao lado — cada toque soma <b>1 etiqueta</b>.</div>`;
  const comEst = F.some(x=>{ const p = et67P(x.id); return p && et67Est(p) > 0; });
  return `<div class="et67-sec" style="display:flex;align-items:center;gap:8px">Na lista${comEst?`<button class="et67-bt cl" style="margin-left:auto;padding:5px 10px;font-size:11.5px;text-transform:none;letter-spacing:0" data-a="igualar" title="Uma etiqueta para cada peça que tem na loja">Quantidade = estoque</button>`:''}</div>` + F.map(x=>{
    const p = et67P(x.id); if(!p) return ''; const est = et67Est(p), cod = et67Cod(p);
    const al = !cod ? (ET67.modelo==='grande' ? '' : `<span class="al">⚠ sem código — sai sem código de barras</span>`) : et67Repetido(p) ? `<span class="al">⚠ outro produto usa o código ${esc(cod)}</span>` : '';
    return `<div class="et67-f ${ET67.sel===x.id?'sel':''} ${ET67.novo===x.id?'novo':''}" data-a="sel" data-id="${esc(x.id)}">${et67Ico(p, 36)}
      <div class="t"><b title="${esc(p.nome)}">${esc(p.nome)}</b><small>${brl2(et67Preco(p))}${cod?' · cód. '+esc(cod):''}${est>0 && est!==x.qtd?` · <button class="lk" data-a="igual1" data-id="${esc(x.id)}">tem ${est} na loja</button>`:est>0?` · = estoque`:''}</small>${al?`<small>${al}</small>`:''}</div>
      <div class="et67-q ${ET67.novo===x.id?'pop':''}"><button data-a="menos" data-id="${esc(x.id)}" aria-label="Menos uma">−</button><input type="number" inputmode="numeric" min="1" max="200" value="${x.qtd}" data-qtd="${esc(x.id)}" aria-label="Quantidade de etiquetas"><button data-a="mais" data-id="${esc(x.id)}" aria-label="Mais uma">+</button></div>
      <button class="et67-rm" data-a="tirar" data-id="${esc(x.id)}" aria-label="Tirar da lista"><i class="ti ti-x"></i></button></div>`; }).join('');
}
function et67BarraHtml(){
  const t = et67Total(), n = et67Fila().length;
  if(ET67.pos && t) return `<div class="et67-pos"><b>🖨️ Mandei ${t} etiqueta${t>1?'s':''} para a impressora. Saiu certinho?</b><div class="bs"><button class="et67-bt" data-a="ok">✔ Saiu! Limpar a lista</button><button class="et67-bt cl" data-a="imprimir">Imprimir de novo</button><button class="et67-bt cl" data-a="ajuda">Saiu torto ou não saiu</button></div></div>`;
  return `<button class="et67-imp" data-a="imprimir" ${t?'':'disabled'}><i class="ti ti-printer"></i> ${t?`Imprimir ${t} etiqueta${t>1?'s':''}`:'Imprimir etiquetas'}</button>
    <div class="et67-sub"><span>${n?`${n} produto${n>1?'s':''} · rolo ${ET67.cfg.w} × ${ET67.cfg.h} mm`:`Rolo ${ET67.cfg.w} × ${ET67.cfg.h} mm`}</span><span>${n?`<button data-a="limpar">Limpar lista</button> · `:''}<button data-a="aj">${ET67.aj?'Fechar ajustes':'⚙️ Ajustes da impressora'}</button></span></div>`;
}
function et67AjHtml(){
  if(!ET67.aj) return '';
  const c = ET67.cfg, pre = [[40,40],[50,30],[60,40],[40,25]];
  return `<div class="et67-aj"><h4>Tamanho da etiqueta do rolo</h4>
    <div class="ln"><div class="et67-seg">${pre.map(([w,h])=>`<button class="${c.w===w&&c.h===h?'on':''}" data-a="tam" data-id="${w}x${h}">${w} × ${h}</button>`).join('')}</div>
      <span>ou</span><input type="number" min="15" max="110" step="1" value="${c.w}" data-cfg="w" aria-label="Largura em mm"> × <input type="number" min="10" max="160" step="1" value="${c.h}" data-cfg="h" aria-label="Altura em mm"> mm</div>
    <h4>Saiu fora do lugar? Empurre o desenho</h4>
    <div class="ln"><button class="et67-set" data-a="mv" data-id="-1,0" aria-label="Para a esquerda">←</button><button class="et67-set" data-a="mv" data-id="1,0" aria-label="Para a direita">→</button><button class="et67-set" data-a="mv" data-id="0,-1" aria-label="Para cima">↑</button><button class="et67-set" data-a="mv" data-id="0,1" aria-label="Para baixo">↓</button>
      <span class="suave">${c.dx||c.dy?`${c.dx>0?'→':'←'} ${Math.abs(c.dx).toLocaleString('pt-BR')} mm · ${c.dy>0?'↓':'↑'} ${Math.abs(c.dy).toLocaleString('pt-BR')} mm`:'no centro'}</span>${c.dx||c.dy?`<button class="et67-bt cl" data-a="mv0" style="padding:5px 10px">Centralizar</button>`:''}</div>
    <div class="ln" style="margin-top:10px"><label style="display:flex;gap:7px;align-items:center;cursor:pointer"><input type="checkbox" data-cfg="marca" ${c.marca?'checked':''}> Escrever <b>LAS VEGAS</b> no topo da etiqueta</label></div>
    <div class="ln" style="margin-top:10px"><button class="et67-bt" data-a="teste"><i class="ti ti-printer"></i> Imprimir 1 etiqueta de teste</button></div>
    <h4>Na janela de impressão (só na primeira vez)</h4>
    <ol><li><b>Destino:</b> a impressora de etiquetas (a branca, TOMATE) — não a do cupom.</li><li><b>Mais definições › Tamanho do papel:</b> ${c.w} × ${c.h} mm (o do rolo).</li><li><b>Margens:</b> Nenhuma · <b>Escala:</b> 100 · sem cabeçalho e rodapé.</li><li>Imprima a etiqueta de teste: a moldura tem que sair inteira. Se cortar, use as setas aqui em cima.</li></ol></div>`;
}

/* ───────── janela ───────── */
function et67Abrir(id){
  ET67.q = ''; ET67.pos = false; ET67.novo = null;
  if(!ET67.sel || !et67P(ET67.sel)) ET67.sel = et67Fila()[0]?.id || null;
  let el = document.getElementById('et67');
  if(!el){
    el = document.createElement('div'); el.id = 'et67'; el.className = 'et67-fx';
    el.addEventListener('mousedown', e=>{ if(e.target===el) et67Fechar(); });
    el.addEventListener('click', et67Clique);
    el.addEventListener('change', et67Mudou);
    el.addEventListener('focusin', e=>{ if(e.target.dataset && e.target.dataset.qtd) e.target.select(); });
    document.body.appendChild(el);
  }
  const celular = window.innerWidth < 900, loja = (()=>{ try{ return typeof cx48Terminal==='function' && cx48Terminal(); }catch(e){ return false; } })();
  el.innerHTML = `<div class="et67-jan" role="dialog" aria-label="Etiquetas">
    <header class="et67-h"><span class="ic">🏷️</span><div><h3>Etiquetas</h3><small>Bipe ou procure o produto, confira a etiqueta na tela e imprima.</small></div><button class="x" data-a="fechar" aria-label="Fechar">✕</button></header>
    <div class="et67-g">
      <section class="et67-col et67-esq"><div class="et67-passo"><i>1</i> Escolha os produtos</div>
        <div class="et67-busca"><i class="ti ti-barcode"></i><input id="et67-q" type="search" autocomplete="off" enterkeyhint="done" placeholder="Bipe o código ou digite o nome do produto" oninput="ET67.q=this.value;et67Pintar('res')" onkeydown="et67Tecla(event)"></div>
        <div class="et67-rola" id="et67-res"></div></section>
      <section class="et67-col et67-dir"><div class="et67-passo"><i>2</i> Confira e imprima <span id="et67-cont"></span></div>
        ${celular && !loja ? `<div class="et67-aviso">🖨️ A impressora de etiquetas fica no computador da loja — abra o portal lá para imprimir.</div>` : ''}
        <div id="et67-prev"></div><div id="et67-aj"></div>
        <div class="et67-rola" id="et67-fila" style="padding-top:4px"></div>
        <div class="et67-barra" id="et67-barra"></div></section>
    </div></div>`;
  if(id) et67Add(id, 1, true);
  et67Pintar();
  if(!celular) setTimeout(()=>document.getElementById('et67-q')?.focus(), 80);
}
function et67Fechar(){ document.getElementById('et67')?.remove(); document.getElementById('et67-fr')?.remove(); et67AtualizarCard(); }
function et67Pintar(so){
  const g = id => document.getElementById(id);
  if(!g('et67')){ et67AtualizarCard(); return; }
  if(so!=='qtd') g('et67-res').innerHTML = et67ResHtml();
  if(so==='res') return;
  const t = et67Total();
  g('et67-cont').textContent = t ? t+' etiqueta'+(t>1?'s':'') : '';
  g('et67-prev').innerHTML = et67PrevHtml();
  g('et67-aj').innerHTML = et67AjHtml();
  if(so==='qtd'){                                    // não redesenha a lista: o campo em que a pessoa está digitando continua com o foco
    ET67.fila.forEach(x=>{ const i = document.querySelector(`#et67-fila input[data-qtd="${CSS.escape(x.id)}"]`); if(i && document.activeElement!==i) i.value = x.qtd; });
    document.querySelectorAll('#et67-fila .et67-f').forEach(f=>f.classList.toggle('sel', f.dataset.id===ET67.sel));
  } else g('et67-fila').innerHTML = et67FilaHtml();
  g('et67-barra').innerHTML = et67BarraHtml();
  ET67.novo = null;
}
function et67Clique(e){
  const b = e.target.closest('[data-a]'); if(!b) return;
  const a = b.dataset.a, id = b.dataset.id, foco = ()=>{ if(window.innerWidth >= 900) document.getElementById('et67-q')?.focus(); };
  if(a==='sel'){ if(e.target.closest('.et67-q,.et67-rm,.lk')) return; ET67.sel = id; et67Pintar('qtd'); return; }
  e.stopPropagation();
  if(a==='fechar') et67Fechar();
  else if(a==='add'){ et67Add(id, 1); foco(); }
  else if(a==='ent') et67Entrada(id);
  else if(a==='mais') et67Qtd(id, 1, true);
  else if(a==='menos') et67Qtd(id, -1, true);
  else if(a==='tirar') et67Tirar(id);
  else if(a==='igual1') et67Igualar(id);
  else if(a==='igualar') et67Igualar();
  else if(a==='limpar') et67Limpar();
  else if(a==='ok'){ et67Limpar(true); toast('Lista limpa — pronta para as próximas ✔'); foco(); }
  else if(a==='modelo'){ ET67.modelo = id; ET67.pos = false; et67Salvar(); et67Pintar(); }
  else if(a==='imprimir') et67Imprimir();
  else if(a==='teste') et67Teste();
  else if(a==='aj'){ ET67.aj = !ET67.aj; et67Pintar(); }
  else if(a==='ajuda'){ ET67.aj = true; ET67.pos = false; et67Pintar(); document.getElementById('et67-aj')?.scrollIntoView({behavior:'smooth', block:'center'}); }
  else if(a==='tam'){ const [w,h] = id.split('x').map(Number); ET67.cfg.w = w; ET67.cfg.h = h; et67Salvar(); et67Pintar(); }
  else if(a==='mv'){ const [x,y] = id.split(',').map(Number); ET67.cfg.dx = Math.max(-6, Math.min(6, Math.round((ET67.cfg.dx + x*.5)*10)/10)); ET67.cfg.dy = Math.max(-6, Math.min(6, Math.round((ET67.cfg.dy + y*.5)*10)/10)); et67Salvar(); et67Pintar(); }
  else if(a==='mv0'){ ET67.cfg.dx = 0; ET67.cfg.dy = 0; et67Salvar(); et67Pintar(); }
}
function et67Mudou(e){
  const t = e.target;
  if(t.dataset.qtd){ const n = parseInt(t.value); if(isNaN(n) || n < 1){ t.value = (ET67.fila.find(f=>f.id===t.dataset.qtd)||{}).qtd || 1; return; } et67Qtd(t.dataset.qtd, n); t.value = Math.min(200, n); }
  else if(t.dataset.cfg==='marca'){ ET67.cfg.marca = t.checked; et67Salvar(); et67Pintar(); }
  else if(t.dataset.cfg){ const lim = t.dataset.cfg==='w' ? [15,110] : [10,160], n = Math.max(lim[0], Math.min(lim[1], Math.round(Number(t.value)||40))); ET67.cfg[t.dataset.cfg] = n; et67Salvar(); et67Pintar(); }
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && document.getElementById('et67') && !document.getElementById('pv66-fx')){ if(e.target && e.target.id==='et67-q' && ET67.q) return; et67Fechar(); } });

/* ───────── botão no Início ───────── */
function et67On(){ try{ return S.tela==='portal' && !!S.sess?.dados && (typeof mod45On!=='function' || mod45On('pdv') || mod45On('estoque')); }catch(e){ return false; } }
function et67CardHtml(){
  const t = et67Total();
  return `<button class="et67-card" id="et67-card" onclick="et67Abrir()"><span class="ic">🏷️</span><span style="flex:1"><b>Imprimir etiquetas</b>
    <small>${t?`${t} etiqueta${t>1?'s':''} esperando na lista — toque para imprimir`:'Bipe ou procure o produto e a etiqueta sai com nome, preço e código de barras'}</small></span>${t?`<span class="n">${t}</span>`:''}<i class="ti ti-chevron-right"></i></button>`;
}
function et67AtualizarCard(){ const el = document.getElementById('et67-card'); if(el && et67On()) el.outerHTML = et67CardHtml(); }
if(typeof portalInicio==='function'){
  const _portalInicioV67 = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioV67.apply(this, arguments);
    let card = ''; try{ if(et67On()) card = et67CardHtml(); }catch(e){ console.warn('v67', e); }
    if(!card || typeof h!=='string') return h;
    const pv = h.indexOf('id="pv66-card"');                                   // logo depois do Pós-venda
    if(pv >= 0){ const f = h.indexOf('</button>', pv); if(f >= 0) return h.slice(0, f+9) + card + h.slice(f+9); }
    const a = h.indexOf('class="vr47-at"');
    if(a >= 0){ const f = h.indexOf('</button>', a); if(f >= 0) return h.slice(0, f+9) + card + h.slice(f+9); }
    const j = h.indexOf('class="suave"'), f2 = j >= 0 ? h.indexOf('</div>', j) : -1;
    return f2 >= 0 ? h.slice(0, f2+6) + card + h.slice(f2+6) : card + h;
  };
}

/* ───────── Estoque › Produtos: botão na ficha do produto (equipe e administração) ───────── */
if(typeof catAbrir==='function'){
  const _catAbrirV67 = catAbrir;
  catAbrir = function catAbrir(id){
    const r = _catAbrirV67.apply(this, arguments);
    try{
      const c = document.querySelector('#modal .modal-c');
      if(c && et67P(id) && !c.querySelector('.et67-ficha')){
        const b = document.createElement('button'); b.className = 'btn largo et67-ficha'; b.style.marginTop = '8px';
        b.innerHTML = '<i class="ti ti-tag"></i> Imprimir etiqueta';
        b.onclick = ()=>{ fecharModal(); et67Abrir(id); };
        c.appendChild(b);
      }
    }catch(e){ console.warn('v67', e); }
    return r;
  };
}

/* ───────── "Tirar dúvida" ───────── */
if(typeof AJ46_GUIA!=='undefined' && !AJ46_GUIA.some(g=>g.id==='etiquetas')){
  AJ46_GUIA.splice(7, 0, {id:'etiquetas', t:'Imprimir etiqueta de produto', p:'etiqueta etiquetas imprimir preco codigo de barras rolo impressora tomate adesivo tag produto remarcar',
    s:['No Início, toque em "Imprimir etiquetas".','Bipe o código de barras ou digite o nome do produto — cada toque soma 1 etiqueta na lista.','Ajuste a quantidade no + e − (ou toque em "tem X na loja" para fazer uma por peça).','Confira a etiqueta na tela e toque em "Imprimir". Na janela, escolha a impressora de etiquetas.','Saiu certo? Toque em "Saiu! Limpar a lista".'], ir:'fn:et67Abrir()'});
}
