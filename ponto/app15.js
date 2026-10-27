/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v15c (app15.js): MUTIRÃO DE ARRUMAÇÃO (link sem PIN)
   • Administração › Estoque › 📸 Produtos › "Link sem PIN": gera …/#fotos=CHAVE.
   • Quem abre o link (sem PIN) escolhe o nome e vê TODOS os produtos, por categoria,
     com os problemas de cada um: sem foto, sem código, sem categoria, preço zerado
     ou estranho (sem vírgula), nome em MAIÚSCULA / estranho, nome ou código repetido.
   • Toca no produto → arruma: foto (tira ou troca), nome, código, categoria e preço.
     Foto, nome, código e categoria entram na hora. PREÇO vai para a administração
     aprovar (Administração › Estoque › Produtos › "Preços para aprovar").
   • "Está certo assim" some com um aviso que não é problema.
   • Ranking do mutirão: quem mais fotografou e arrumou (aba Arrumacao da planilha).
   • 1 foto por produto (a principal, usada no PDV); trocar substitui a anterior.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.fl-pag{max-width:760px;margin:0 auto;padding:14px 16px 70px;font-family:inherit;color:#222}
.fl-topo{display:flex;align-items:center;gap:12px;background:#D4121B;color:#fff;border-radius:16px;padding:12px 14px;margin-bottom:12px}
.fl-topo img{height:36px}
.fl-topo b{font-size:16px;display:block}.fl-topo small{opacity:.92;font-size:12px}
.fl-card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.fl-card h3{margin:0 0 6px;font-size:15px}
.fl-barra{height:10px;border-radius:99px;background:rgba(0,0,0,.08);overflow:hidden;margin:8px 0 6px}
.fl-barra i{display:block;height:100%;background:linear-gradient(90deg,#F5B524,#2fb36b);border-radius:99px;transition:width .6s}
.fl-resumo{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:#555}
.fl-nomes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.fl-nomes button,.fl-chips button{border:1.5px solid rgba(0,0,0,.12);background:#fff;border-radius:99px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer;color:#222;font-family:inherit}
.fl-nomes button.on,.fl-chips button.on{background:#D4121B;border-color:#D4121B;color:#fff}
.fl-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-top:10px;-webkit-overflow-scrolling:touch}
.fl-chips button{white-space:nowrap;padding:7px 12px;font-size:13px}
.fl-busca,.fl-sel,.fl-inp{width:100%;border:1.5px solid rgba(0,0,0,.14);border-radius:12px;padding:11px 12px;font-size:15px;font-family:inherit;background:#fff;color:#222;box-sizing:border-box}
.fl-sel{margin-top:8px;padding:9px 10px;font-size:14px}
.fl-rank{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.fl-rank div{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:#faf7f5}
.fl-rank div.eu{background:rgba(212,18,27,.08);outline:1.5px solid rgba(212,18,27,.35)}
.fl-rank .med{font-size:20px;width:28px;text-align:center}
.fl-rank b{flex:1;font-size:14px}.fl-rank small{color:#666;font-size:12px}.fl-rank .pt{font-weight:800;color:#D4121B;font-size:16px;min-width:34px;text-align:right}
.fl-cat{display:flex;justify-content:space-between;align-items:baseline;margin:18px 2px 8px;font-weight:800;font-size:14px;color:#444;text-transform:uppercase;letter-spacing:.03em}
.fl-cat small{text-transform:none;letter-spacing:0;font-weight:600;color:#888}
.fl-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.fl-item{position:relative;display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:14px;background:#fff;border:1px solid rgba(0,0,0,.08);text-align:left;cursor:pointer;color:#222;font:inherit}
.fl-item.pronto{border-color:rgba(47,179,107,.45)}
.fl-item .ft{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;background:#f3f3f3}
.fl-item .semft{width:100%;aspect-ratio:1/1;border-radius:10px;border:2px dashed rgba(212,18,27,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#D4121B;font-weight:800;font-size:13px;background:rgba(212,18,27,.05)}
.fl-item .semft i{font-size:30px}
.fl-item b{font-size:12.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fl-item small{font-size:11px;color:#777}
.fl-item .ok{position:absolute;top:12px;right:12px;background:#2fb36b;color:#fff;border-radius:99px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px}
.fl-av{display:flex;flex-wrap:wrap;gap:4px}
.fl-av span{font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(212,18,27,.1);color:#B30F17}
.fl-av span.am{background:rgba(245,181,36,.18);color:#8a5d00}
.fl-vazio{text-align:center;color:#777;padding:30px 10px;font-size:15px}
.fl-rod{text-align:center;color:#999;font-size:12px;margin-top:18px}
.fl-m{position:fixed;inset:0;z-index:9000;background:rgba(20,10,10,.55);display:flex;align-items:flex-end;justify-content:center}
@media(min-width:700px){.fl-m{align-items:center}}
.fl-mc{background:#fff;color:#222;width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px 22px;box-sizing:border-box}
@media(min-width:700px){.fl-mc{border-radius:20px}}
.fl-mc h3{margin:0;font-size:17px;flex:1}
.fl-mt{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.fl-x{border:0;background:#f1eeee;border-radius:99px;width:36px;height:36px;font-size:18px;cursor:pointer}
.fl-fg{width:100%;max-height:42vh;object-fit:contain;border-radius:14px;background:#f3f3f3}
.fl-fv{width:100%;aspect-ratio:4/3;border-radius:14px;border:2px dashed rgba(212,18,27,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#D4121B;font-weight:800;background:rgba(212,18,27,.05);cursor:pointer}
.fl-fv i{font-size:38px}
.fl-lb{display:block;font-size:12.5px;font-weight:800;color:#555;margin:12px 0 4px}
.fl-lin{display:flex;gap:8px}.fl-lin .fl-inp{flex:1}
.fl-bt{border:0;border-radius:12px;padding:12px 14px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.fl-bt.pri{background:#D4121B;color:#fff;width:100%;margin-top:16px}
.fl-bt.sec{background:#f1eeee;color:#222}
.fl-bt.ouro{background:#F5B524;color:#222}
.fl-bt:disabled{opacity:.5}
.fl-avl{margin-top:12px;display:flex;flex-direction:column;gap:6px}
.fl-avl div{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(212,18,27,.06);font-size:13px;font-weight:700;color:#8e0b12}
.fl-avl div span{flex:1}
.fl-avl button{border:1px solid rgba(0,0,0,.15);background:#fff;border-radius:99px;padding:5px 10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
.fl-dica{font-size:12px;color:#777;margin-top:4px}
.fl-pend{font-size:12.5px;font-weight:800;color:#8a5d00;background:rgba(245,181,36,.18);border-radius:10px;padding:6px 10px;margin-top:6px}
`; document.head.appendChild(st); })();

/* ───────── os avisos (o que está errado em cada produto) ───────── */
const FL_AVISOS = {
  sem_foto:        {t:'Sem foto',                         c:'📷 sem foto'},
  sem_codigo:      {t:'Sem código de barras / código',    c:'sem código'},
  sem_categoria:   {t:'Sem categoria',                    c:'sem categoria'},
  preco_zero:      {t:'Sem preço',                        c:'sem preço'},
  preco_estranho:  {t:'Preço parece sem vírgula',         c:'preço estranho'},
  nome_maiusculo:  {t:'Nome todo em MAIÚSCULA',           c:'MAIÚSCULA', am:1},
  nome_estranho:   {t:'Nome com caractere estranho ou curto demais', c:'nome estranho'},
  nome_repetido:   {t:'Tem outro produto com o mesmo nome', c:'nome repetido'},
  codigo_repetido: {t:'Tem outro produto com o mesmo código', c:'código repetido'}
};
function flNorm(s){ return semAcento(String(s||'')).replace(/\s+/g,' ').trim(); }
function flAvisos(p){
  const a = [], nm = String(p.nome||'');
  if(!p.foto) a.push('sem_foto');
  if(!p.codigo && !p.sku) a.push('sem_codigo');
  if(!String(p.categoria||'').trim()) a.push('sem_categoria');
  if(!(p.preco>0)) a.push('preco_zero');
  else if(p.preco>=1000) a.push('preco_estranho');
  if(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4}/.test(nm) && nm===nm.toUpperCase()) a.push('nome_maiusculo');
  if(/[?�]|\s{2,}/.test(nm) || nm.trim().length<5) a.push('nome_estranho');
  if((FL.dupNome[flNorm(nm)]||0)>1) a.push('nome_repetido');
  const cod = p.codigo || '';
  if(cod && (FL.dupCod[cod]||0)>1) a.push('codigo_repetido');
  return a.filter(k=>!(p.ok||[]).includes(k));
}
function flTitulo(s){ return String(s||'').toLowerCase().replace(/(^|[\s\-\/(])([a-zà-ú])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E|Com|Para|Em|No|Na|Nos|Nas|Ao)\b/g, w=>w.toLowerCase()).replace(/\b(\d+)(Ml|G|Gr|Cm|Un)\b/g,(m,n,u)=>n+u.toLowerCase()); }

var FL = null;
function flChaveDaUrl(){ const m = location.hash.match(/^#fotos=([a-z0-9]{6,20})$/i); return m ? m[1] : ''; }

/* entra no modo "mutirão" antes do app normal abrir */
const _carregarV15 = carregar;
carregar = async function(){
  const ch = flChaveDaUrl();
  if(!ch || !S.api) return _carregarV15();
  S.tela = 'fotos';
  FL = {chave: ch, por: LS.get('lv_fotos_por', ''), lista: [], total: 0, ranking: [], nomes: [], erro: '', q: '', filtro: 'arrumar', aviso: '', lim: 150, dupNome: {}, dupCod: {}, enviando: {}, eu: 0, carregando: true};
  flPintar();
  await flCarregar();
};
const _renderV15 = render;
render = function(){ if(S.tela==='fotos' && FL){ flPintar(); return; } return _renderV15.apply(this, arguments); };

async function flCarregar(){
  FL.carregando = true;
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'lista'});
    FL.lista = r.produtos || []; FL.total = r.total || FL.lista.length; FL.nomes = r.nomes || []; FL.ranking = r.ranking || []; FL.erro = '';
    flRecalcular();
  }catch(e){ FL.erro = e.message; }
  FL.carregando = false; flPintar();
}
function flRecalcular(){
  FL.dupNome = {}; FL.dupCod = {};
  FL.lista.forEach(p=>{ const n = flNorm(p.nome); FL.dupNome[n] = (FL.dupNome[n]||0)+1; if(p.codigo) FL.dupCod[p.codigo] = (FL.dupCod[p.codigo]||0)+1; });
  FL.lista.forEach(p=>{ p._av = flAvisos(p); });
}
function flContas(){
  const L = FL.lista, c = {todos: L.length, arrumar: 0, sem_foto: 0, prontos: 0, por: {}};
  L.forEach(p=>{ if(p._av.length){ c.arrumar++; p._av.forEach(k=>c.por[k]=(c.por[k]||0)+1); } else c.prontos++; if(!p.foto) c.sem_foto++; });
  return c;
}
function flFiltrada(){
  const q = semAcento(FL.q.trim()), ws = q ? q.split(/\s+/) : [];
  let l = FL.lista.filter(p=>!ws.length || ws.every(w=>semAcento(p.nome+' '+(p.codigo||'')+' '+(p.sku||'')+' '+(p.categoria||'')).includes(w)));
  if(FL.filtro==='arrumar') l = l.filter(p=>p._av.length && (!FL.aviso || p._av.includes(FL.aviso)));
  else if(FL.filtro==='sem_foto') l = l.filter(p=>!p.foto);
  else if(FL.filtro==='prontos') l = l.filter(p=>!p._av.length);
  return l.sort((a,b)=>(a.categoria||'~').localeCompare(b.categoria||'~') || a.nome.localeCompare(b.nome));
}

function flPintar(){
  const app = $('#app'); if(!app || S.tela!=='fotos') return;
  if(FL.erro){ app.innerHTML = `<div class="fl-pag">${flTopo('—')}<div class="fl-card" style="border-color:#D4121B;color:#D4121B;font-weight:700"><i class="ti ti-alert-triangle"></i> ${esc(FL.erro)}</div></div>`; return; }
  if(FL.carregando && !FL.lista.length){ app.innerHTML = `<div class="fl-pag">${flTopo('carregando…')}<div class="fl-card fl-vazio"><span class="gira"></span> Carregando os produtos…</div></div>`; return; }
  const c = flContas(), pct = c.todos ? Math.round(c.prontos/c.todos*100) : 0;
  app.innerHTML = `<div class="fl-pag">
    ${flTopo(c.arrumar+' para arrumar · '+c.sem_foto+' sem foto')}
    <div class="fl-card">
      <h3>Progresso do mutirão</h3>
      <div class="fl-resumo"><span><b style="color:#222">${c.prontos}</b> de ${c.todos} produtos prontos (${pct}%)</span></div>
      <div class="fl-barra"><i style="width:${pct}%"></i></div>
      <div class="fl-resumo"><span>📷 ${c.sem_foto} sem foto</span><span>⚠️ ${c.arrumar} com algo para arrumar</span>${FL.eu?`<span style="color:#2fb36b;font-weight:800">✔ você arrumou ${FL.eu} agora</span>`:''}</div>
    </div>
    ${flRankingHtml()}
    <div class="fl-card">
      ${FL.por?`<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;font-size:14px">Você é <b>${esc(FL.por)}</b></span><button class="fl-bt sec" style="padding:7px 12px;font-size:13px" onclick="FL.trocarNome=1;flPintar()">trocar</button></div>`:''}
      ${!FL.por || FL.trocarNome ? `<h3 style="margin-top:${FL.por?10:0}px">Quem está arrumando?</h3>
      <div class="fl-nomes">${FL.nomes.map(n=>`<button class="${FL.por===n?'on':''}" onclick="flPor(${esc(JSON.stringify(n))})">${esc(n)}</button>`).join('')}<button onclick="flPorOutro()">Outro…</button></div>
      ${!FL.por?`<p style="margin:10px 0 0;font-size:13px;color:#D4121B;font-weight:700">Toque no seu nome para começar.</p>`:''}`:''}
    </div>
    <div class="fl-card">
      <h3>Toque no produto para arrumar</h3>
      <p class="fl-dica" style="margin:0">Foto com fundo claro e produto inteiro. Confira nome, código, categoria e preço. Preço novo vai para a administração aprovar.</p>
      <input class="fl-busca" style="margin-top:10px" placeholder="Buscar por nome ou código…" value="${esc(FL.q)}" oninput="FL.q=this.value;FL.lim=150;flPintarLista()">
      <div class="fl-chips">${[['arrumar','⚠️ Para arrumar',c.arrumar],['sem_foto','📷 Sem foto',c.sem_foto],['prontos','✅ Prontos',c.prontos],['todos','Todos',c.todos]].map(([k,n,v])=>`<button class="${FL.filtro===k?'on':''}" onclick="FL.filtro='${k}';FL.lim=150;flPintar()">${n} (${v})</button>`).join('')}</div>
      ${FL.filtro==='arrumar'?`<select class="fl-sel" onchange="FL.aviso=this.value;FL.lim=150;flPintarLista()"><option value="">Todos os problemas</option>${Object.keys(FL_AVISOS).filter(k=>c.por[k]).map(k=>`<option value="${k}" ${FL.aviso===k?'selected':''}>${FL_AVISOS[k].t} (${c.por[k]})</option>`).join('')}</select>`:''}
    </div>
    <div id="fl-lista">${flListaHtml()}</div>
    <div class="fl-rod">Mutirão de arrumação · Las Vegas · <a href="#" onclick="flCarregar();return false" style="color:#D4121B">atualizar</a></div>
  </div>`;
}
function flTopo(sub){ return `<div class="fl-topo"><img src="${LOGO}" alt=""><div><b>Mutirão dos produtos</b><small>Las Vegas Sex Shop · ${esc(sub)}</small></div></div>`; }
function flRankingHtml(){
  const R = FL.ranking || []; if(!R.length) return `<div class="fl-card"><h3>🏆 Ranking do mutirão</h3><p class="fl-dica" style="margin:0">Ninguém pontuou ainda. Cada foto ou correção vale 1 ponto — seja a primeira!</p></div>`;
  const med = ['🥇','🥈','🥉'];
  return `<div class="fl-card"><h3>🏆 Ranking do mutirão</h3><div class="fl-rank">${R.slice(0,6).map((r,i)=>`<div class="${r.nome===FL.por?'eu':''}"><span class="med">${med[i]||(i+1)+'º'}</span><b>${esc(r.nome)}</b><small>📷 ${r.fotos} · ✏️ ${r.correcoes}</small><span class="pt">${r.pontos}</span></div>`).join('')}</div></div>`;
}
function flListaHtml(){
  const l = flFiltrada();
  if(!l.length) return `<div class="fl-card fl-vazio">${FL.filtro==='arrumar'&&!FL.q?'🎉 Nada para arrumar aqui!':'Nada encontrado.'}</div>`;
  const vis = l.slice(0, FL.lim), grupos = [];
  vis.forEach(p=>{ const k = p.categoria || 'Sem categoria'; let g = grupos[grupos.length-1]; if(!g || g.k!==k){ g = {k, itens:[]}; grupos.push(g); } g.itens.push(p); });
  const totCat = {}; l.forEach(p=>{ const k = p.categoria||'Sem categoria'; totCat[k]=(totCat[k]||0)+1; });
  return grupos.map(g=>`<div class="fl-cat"><span>${esc(g.k)}</span><small>${totCat[g.k]} produto(s)</small></div><div class="fl-grade">${g.itens.map(flItemHtml).join('')}</div>`).join('')
    + (l.length>FL.lim?`<button class="fl-bt sec" style="width:100%;margin-top:14px" onclick="FL.lim+=150;flPintarLista()">Mostrar mais (${l.length-FL.lim})</button>`:'');
}
function flItemHtml(p){
  const env = FL.enviando[p.id], u = p.foto ? fotoUrl(p, 240) : '';
  return `<button class="fl-item ${p._av.length?'':'pronto'}" onclick="flAbrir('${p.id}')">
    ${!p._av.length?'<span class="ok">✓</span>':''}
    ${u?`<img class="ft" src="${esc(u)}" loading="lazy" alt="" onerror="this.outerHTML='<span class=&quot;semft&quot;><i class=&quot;ti ti-photo-off&quot;></i>foto não abriu</span>'">`:`<span class="semft"><i class="ti ${env?'ti-loader-2':'ti-camera-plus'}"></i>${env?'Enviando…':'Tirar foto'}</span>`}
    <b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'sem código')} · ${p.preco>0?brl2(p.preco):'sem preço'}</small>
    ${p._av.filter(k=>k!=='sem_foto').length||p.precoPendente?`<span class="fl-av">${p._av.filter(k=>k!=='sem_foto').map(k=>`<span class="${FL_AVISOS[k].am?'am':''}">${FL_AVISOS[k].c}</span>`).join('')}${p.precoPendente?`<span class="am">preço em aprovação</span>`:''}</span>`:''}
  </button>`;
}
function flPintarLista(){ const g = $('#fl-lista'); if(g) g.innerHTML = flListaHtml(); }
function flPor(n){ FL.por = n; FL.trocarNome = 0; LS.set('lv_fotos_por', n); flPintar(); }
function flPorOutro(){ const n = prompt('Seu nome:', FL.por && !FL.nomes.includes(FL.por) ? FL.por : ''); if(n && n.trim()) flPor(n.trim().slice(0,40)); }
function flPrecisaNome(){ if(FL.por) return false; toast('Primeiro toque no seu nome (lá em cima)', true); window.scrollTo({top:0, behavior:'smooth'}); return true; }
function flPonto(r){ FL.eu++; if(r && r.ranking) FL.ranking = r.ranking; }

/* ───────── arrumar um produto ───────── */
let FLP = null;
function flAbrir(id){
  if(flPrecisaNome()) return;
  const p = FL.lista.find(x=>x.id===id); if(!p) return;
  FLP = {id, nome: p.nome, codigo: p.codigo || '', categoria: p.categoria || '', preco: p.preco>0 ? Number(p.preco).toFixed(2).replace('.',',') : ''};
  flModal();
}
function flModal(){
  const p = FL.lista.find(x=>x.id===FLP.id); if(!p) return;
  const cats = [...new Set(FL.lista.map(x=>x.categoria).filter(Boolean))].sort();
  const u = p.foto ? fotoUrl(p, 640) : '', env = FL.enviando[p.id];
  let m = $('#fl-m'); if(!m){ m = document.createElement('div'); m.id = 'fl-m'; document.body.appendChild(m); }
  m.innerHTML = `<div class="fl-m" onclick="if(event.target===this)flFechar()"><div class="fl-mc" role="dialog" aria-modal="true">
    <div class="fl-mt"><h3>${esc(p.nome)}</h3><button class="fl-x" aria-label="Fechar" onclick="flFechar()">✕</button></div>
    ${u?`<img class="fl-fg" src="${esc(u)}" alt="">`:`<div class="fl-fv" onclick="flFoto()"><i class="ti ${env?'ti-loader-2':'ti-camera-plus'}"></i>${env?'Enviando a foto…':'Tirar foto'}</div>`}
    <button class="fl-bt ouro" style="width:100%;margin-top:8px" onclick="flFoto()" ${env?'disabled':''}><i class="ti ti-camera"></i> ${p.foto?'Trocar a foto':'Tirar foto'}</button>
    ${p._av.length?`<div class="fl-avl">${p._av.map(k=>`<div><span>⚠️ ${FL_AVISOS[k].t}</span>${k!=='sem_foto'?`<button onclick="flOk('${k}')">está certo assim</button>`:''}</div>`).join('')}</div>`:`<div class="fl-avl"><div style="background:rgba(47,179,107,.1);color:#1f7a49"><span>✅ Tudo certo com este produto</span></div></div>`}
    <label class="fl-lb">Nome do produto</label>
    <div class="fl-lin"><input class="fl-inp" id="flp-nome" value="${esc(FLP.nome)}" oninput="FLP.nome=this.value"><button class="fl-bt sec" title="Arrumar maiúsculas" onclick="FLP.nome=flTitulo(FLP.nome);$('#flp-nome').value=FLP.nome">Aa</button></div>
    <label class="fl-lb">Código de barras / código</label>
    <div class="fl-lin"><input class="fl-inp" id="flp-cod" inputmode="numeric" value="${esc(FLP.codigo)}" oninput="FLP.codigo=this.value">${typeof estCamera==='function'?`<button class="fl-bt sec" title="Ler com a câmera" onclick="flBipar()"><i class="ti ti-barcode"></i></button>`:''}</div>
    <label class="fl-lb">Categoria</label>
    <input class="fl-inp" list="flp-cats" value="${esc(FLP.categoria)}" oninput="FLP.categoria=this.value" placeholder="Ex.: Lubrificantes"><datalist id="flp-cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
    <label class="fl-lb">Preço de venda (R$)</label>
    <input class="fl-inp" inputmode="decimal" value="${esc(FLP.preco)}" oninput="FLP.preco=this.value" placeholder="0,00">
    <p class="fl-dica">Mudança de preço vai para a administração aprovar antes de valer no PDV.</p>
    ${p.precoPendente?`<div class="fl-pend">⏳ Aguardando aprovação: ${brl2(p.precoPendente)}</div>`:''}
    <button class="fl-bt pri" id="flp-ok" onclick="flSalvar()"><i class="ti ti-check"></i> Salvar</button>
  </div></div>`;
}
function flFechar(){ const m = $('#fl-m'); if(m) m.innerHTML = ''; FLP = null; }
function flBipar(){ try{ estCamera(cod=>{ try{ estCameraFechar(); }catch(e){} FLP.codigo = String(cod).trim(); const i = $('#flp-cod'); if(i) i.value = FLP.codigo; try{ estBip(true); }catch(e){} }, 'Ler o código do produto'); }catch(e){ toast('Câmera indisponível — digite o código', true); } }
async function flFoto(){
  if(flPrecisaNome() || !FLP) return;
  const pid = FLP.id, p = FL.lista.find(x=>x.id===pid); if(!p || FL.enviando[pid]) return;
  const img = await fotoEscolher(); if(!img) return;
  FL.enviando[pid] = true; if(FLP) flModal(); flPintarLista();
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'salvar', produto_id: pid, img, por: FL.por});
    p.foto = r.foto; flPonto(r); try{ estBip(true); }catch(e){}
    toast('Foto salva ✔');
  }catch(e){ toast(erroRede(e) ? 'Sem internet — tente de novo' : e.message, true); }
  delete FL.enviando[pid]; flRecalcular();
  if(FLP && FLP.id===pid) flModal();
  flPintar();
}
async function flSalvar(){
  if(flPrecisaNome() || !FLP) return;
  const p = FL.lista.find(x=>x.id===FLP.id); if(!p) return;
  const campos = {};
  if(FLP.nome.trim() !== p.nome) campos.nome = FLP.nome.trim();
  if(FLP.codigo.replace(/\s/g,'') !== (p.codigo||'')) campos.codigo = FLP.codigo.replace(/\s/g,'');
  if(FLP.categoria.trim() !== (p.categoria||'')) campos.categoria = FLP.categoria.trim();
  const pr = num2(FLP.preco);
  if(String(FLP.preco).trim() && Math.abs(pr - (p.preco||0)) > .004 && pr !== p.precoPendente) campos.preco = String(pr);
  if(!Object.keys(campos).length){ flFechar(); return; }
  const b = $('#flp-ok'); if(b){ b.disabled = true; b.innerHTML = '<span class="gira"></span> Salvando…'; }
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'corrigir', produto_id: p.id, campos, por: FL.por});
    if('nome' in campos && r.feitos.includes('nome')) p.nome = campos.nome;
    if('codigo' in campos && r.feitos.includes('codigo')) p.codigo = campos.codigo;
    if('categoria' in campos && r.feitos.includes('categoria')) p.categoria = campos.categoria;
    if(r.pendentes.includes('preco')) p.precoPendente = pr;
    flPonto(r); flRecalcular(); flFechar(); flPintar();
    toast(r.pendentes.length ? 'Salvo ✔ Preço enviado para aprovação' : 'Produto arrumado ✔');
  }catch(e){ if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-check"></i> Salvar'; } toast(erroRede(e) ? 'Sem internet — tente de novo' : e.message, true); }
}
async function flOk(aviso){
  if(flPrecisaNome() || !FLP) return;
  const p = FL.lista.find(x=>x.id===FLP.id); if(!p) return;
  try{ await api('fotos', {chave: FL.chave, op: 'ok', produto_id: p.id, aviso, por: FL.por}); (p.ok = p.ok || []).push(aviso); flRecalcular(); flModal(); flPintar(); toast('Ok, aviso tirado ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ═════════ administração: link + preços para aprovar + ranking (na tela 📸 Produtos) ═════════ */
var FLA = {pend: null, ranking: [], carregado: false};
async function flaCarregar(){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'arrPendentes'}); FLA.pend = r.pendentes || []; FLA.ranking = r.ranking || []; }catch(e){ FLA.pend = []; }
  FLA.carregado = true; if(S.tela==='admin' && S.adm?.tab==='estoque') render();
}
const _estCatalogoV15 = estCatalogo;
estCatalogo = function(){
  const h = _estCatalogoV15();
  if(!estAdmin()) return h;
  if(!FLA.carregado){ FLA.carregado = true; setTimeout(flaCarregar, 50); }
  const n = (FLA.pend||[]).length;
  const extra = `<button class="btn" onclick="flAdmin()" title="Link do mutirão (sem PIN)"><i class="ti ti-camera-share"></i> Link sem PIN</button>${n?`<button class="btn ouro" onclick="flaPrecos()"><i class="ti ti-currency-real"></i> ${n} preço(s) para aprovar</button>`:''}<button class="btn ouro" onclick="novoProduto()">`;
  return h.replace('<button class="btn ouro" onclick="novoProduto()">', extra);
};
function flaPrecos(){
  const L = FLA.pend || [];
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:560px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">💲 Preços sugeridos pela equipe</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${!L.length?'<p class="suave">Nenhum preço esperando aprovação.</p>':L.map(a=>`<div class="cartao pad" style="margin-bottom:8px">
      <b>${esc(a.produto)}</b><div class="suave" style="font-size:13px;margin:2px 0 8px">${esc(a.por)} · ${esc(String(a.quando).slice(8,10)+'/'+String(a.quando).slice(5,7)+' '+String(a.quando).slice(11,16))}</div>
      <div class="linha" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="apagado">${brl2(Number(a.antes)||0)} →</span><input class="inp num" id="pa-${esc(a.id)}" inputmode="decimal" value="${esc((Number(a.depois)||0).toFixed(2).replace('.',','))}" style="max-width:130px">
        <button class="btn ouro" onclick="flaRevisar('${esc(a.id)}',true)"><i class="ti ti-check"></i> Aprovar</button><button class="btn p" onclick="flaRevisar('${esc(a.id)}',false)"><i class="ti ti-x"></i> Recusar</button></div></div>`).join('')}
    ${FLA.ranking.length?`<h4 style="margin:14px 0 6px">🏆 Ranking do mutirão</h4>${FLA.ranking.slice(0,10).map((r,i)=>`<div class="linha entre" style="padding:4px 0"><span>${i+1}º ${esc(r.nome)}</span><span class="suave">📷 ${r.fotos} · ✏️ ${r.correcoes} · <b>${r.pontos}</b></span></div>`).join('')}`:''}
    </div></div></div>`;
}
async function flaRevisar(id, aprovar){
  const i = document.getElementById('pa-'+id);
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'arrRevisar', id, aprovar, preco: i ? String(num2(i.value)) : ''}); FLA.pend = r.pendentes || []; toast(aprovar ? 'Preço aprovado ✔ — já vale no PDV' : 'Recusado');
    if(aprovar){ try{ S.adm.dados = await api('admDados', S.adm.cred); }catch(e){} }
    flaPrecos(); render(); }
  catch(e){ toast(e.message, true); }
}
function flCopiar(){ const i = $('#modal .inp'); if(!i) return; i.select(); navigator.clipboard.writeText(i.value).then(()=>toast('Link copiado ✔ — mande no grupo'), ()=>toast('Selecione e copie o link', true)); }
async function flAdmin(acao){
  let chave;
  try{ toast('Um instante…'); const r = await api('admEstoque', {...S.adm.cred, op:'fotosLink', novo: acao==='novo', desligar: acao==='desligar'}); chave = r.chave; }
  catch(e){ toast(e.message, true); return; }
  const link = chave ? location.origin + location.pathname + '#fotos=' + chave : '';
  const msg = `📸 *Mutirão dos produtos — Las Vegas* ✨\n\nMeninas, vamos deixar o catálogo impecável! 💪\n\n1️⃣ Toquem no link e escolham o nome de vocês\n2️⃣ Abram *⚠️ Para arrumar*\n3️⃣ Toquem no produto: tirem a foto (fundo claro, produto inteiro) e confiram nome, código, categoria e preço\n\n🏆 Cada foto ou correção vale 1 ponto no *ranking*!\n\n${link}`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:520px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">📸 Link do mutirão (sem PIN)</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${chave?`<p class="suave" style="margin:0 0 8px;font-size:13px">Quem abrir este link vê os produtos com o que falta arrumar (foto, nome, código, categoria, preço), sem estoque nem vendas. Foto, nome, código e categoria entram na hora; <b>preço vem para você aprovar</b>. Tem ranking de quem mais arrumou.</p>
      <input class="inp" readonly value="${esc(link)}" onclick="this.select()" style="margin-bottom:10px">
      <div class="g2"><button class="btn ouro" onclick="flCopiar()"><i class="ti ti-copy"></i> Copiar link</button>
        <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Mandar no WhatsApp</a></div>
      <div class="g2" style="margin-top:8px"><button class="btn p" onclick="flAdmin('novo')"><i class="ti ti-refresh"></i> Gerar link novo</button><button class="btn p" onclick="flAdmin('desligar')"><i class="ti ti-link-off"></i> Desligar o link</button></div>
      <p class="apagado" style="font-size:12px;margin:10px 0 0">Gerar link novo ou desligar faz o link antigo parar de funcionar na hora.</p>`
      :`<p class="suave" style="margin:0 0 12px">O link está <b>desligado</b>. Ninguém consegue mexer nos produtos por ele.</p><button class="btn ouro largo" onclick="flAdmin('novo')"><i class="ti ti-link"></i> Ligar e gerar o link</button>`}
    </div></div></div>`;
}
