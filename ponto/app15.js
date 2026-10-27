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
.fl-falta{display:flex;flex-direction:column;gap:5px;margin-top:10px}
.fl-falta button{position:relative;display:flex;justify-content:space-between;gap:8px;border:0;background:#faf5f3;border-radius:10px;padding:7px 10px;font:inherit;font-size:13px;color:#333;cursor:pointer;overflow:hidden;text-align:left}
.fl-falta button span,.fl-falta button b{position:relative;z-index:1}
.fl-falta button i{position:absolute;left:0;top:0;bottom:0;background:rgba(212,18,27,.12);border-radius:10px}
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
function flAvisos(p, D){
  D = D || FL; const a = [], nm = String(p.nome||'');
  if(!p.foto) a.push('sem_foto');
  if(!p.codigo && !p.sku) a.push('sem_codigo');
  if(!String(p.categoria||'').trim()) a.push('sem_categoria');
  if(!(p.preco>0)) a.push('preco_zero');
  else if(p.preco>=1000) a.push('preco_estranho');
  if(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4}/.test(nm) && nm===nm.toUpperCase()) a.push('nome_maiusculo');
  if(/[?�]|\s{2,}/.test(nm) || nm.trim().length<5) a.push('nome_estranho');
  if((D.dupNome[flNorm(nm)]||0)>1) a.push('nome_repetido');
  const cod = p.codigo || '';
  if(cod && (D.dupCod[cod]||0)>1) a.push('codigo_repetido');
  return a.filter(k=>!(p.ok||[]).includes(k));
}
const FL_SIGLAS = new Set(['LGBT','LGBTQIA','LGBTQIA+','LGBTQ','INTT','BDSM','DS','PU','USB','LED','APP','CBD','SD','KY','TPE','PVC','3D','XL','XXL','XG','GG','PP','P','M','G','UV','SI','MDF','IA','TV','DVD']);
const FL_MINUSC = new Set(['de','da','do','das','dos','e','com','para','em','no','na','nos','nas','ao','aos','que','a','o','as','os','ou','sem','por','pra','c/','s/']);
function flTitulo(s){
  let primeira = true;
  return String(s||'').replace(/\s+/g,' ').trim().split(/(\s|[-\/(),.·])/).map(t=>{
    if(!t || /^(\s|[-\/(),.·])$/.test(t)) return t;
    const up = t.toUpperCase(), lo = t.toLowerCase(), era1 = primeira; primeira = false;
    if(/^\d+([.,]\d+)?(ml|g|gr|cm|mm|kg|un|x|m)$/i.test(t)) return lo;
    if(/^\d+x\d+$/i.test(t)) return lo;
    if(!era1 && /^(x|cm|ml|mm|kg|un|gr)$/i.test(t)) return lo;
    if(FL_SIGLAS.has(up) && !(up==='E'||up==='O'||up==='A')) return (t.length===1 && era1) ? up : (t.length===1 && !/^[PMG]$/.test(up)) ? lo : up;
    if(!era1 && FL_MINUSC.has(lo)) return lo;
    if(/\d/.test(t) && /[A-Za-z]/.test(t) && t.length<=4) return up;   // I3, 5G, A6…
    return lo.charAt(0).toUpperCase() + lo.slice(1);
  }).join('').replace(/(^|\s)([CS])\/ ?/g,(m,a,l)=>a+l.toLowerCase()+'/ ').replace(/\s+$/,'');
}

var FL = null;
function flChaveDaUrl(){ const m = location.hash.match(/^#fotos=([a-z0-9]{6,20})$/i); return m ? m[1] : ''; }

/* entra no modo "mutirão" antes do app normal abrir */
const _carregarV15 = carregar;
carregar = async function(){
  const ch = flChaveDaUrl();
  if(!ch || !S.api) return _carregarV15();
  S.tela = 'fotos';
  FL = {chave: ch, por: LS.get('lv_fotos_por', ''), lista: [], total: 0, nomes: [], erro: '', q: '', filtro: 'arrumar', aviso: '', lim: 150, dupNome: {}, dupCod: {}, enviando: {}, eu: 0, carregando: true};
  flPintar();
  await flCarregar();
};
const _renderV15 = render;
render = function(){ if(S.tela==='fotos' && FL){ flPintar(); return; } return _renderV15.apply(this, arguments); };

async function flCarregar(){
  FL.carregando = true;
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'lista'});
    FL.lista = r.produtos || []; FL.total = r.total || FL.lista.length; FL.nomes = r.nomes || []; FL.erro = '';
    flRecalcular();
  }catch(e){ FL.erro = e.message; }
  FL.carregando = false; flPintar();
}
function flCalcular(L){
  const D = {dupNome:{}, dupCod:{}};
  L.forEach(p=>{ const n = flNorm(p.nome); D.dupNome[n] = (D.dupNome[n]||0)+1; if(p.codigo) D.dupCod[p.codigo] = (D.dupCod[p.codigo]||0)+1; });
  L.forEach(p=>{ p._av = flAvisos(p, D); });
  return D;
}
function flRecalcular(){ const D = flCalcular(FL.lista); FL.dupNome = D.dupNome; FL.dupCod = D.dupCod; }
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
      ${Object.keys(c.por).length?`<div class="fl-falta">${Object.keys(FL_AVISOS).filter(k=>c.por[k]).map(k=>`<button onclick="FL.filtro='arrumar';FL.aviso='${k}';FL.lim=150;flPintar();document.getElementById('fl-lista').scrollIntoView({behavior:'smooth'})"><span>${FL_AVISOS[k].t}</span><b>${c.por[k]}</b><i style="width:${Math.max(4,Math.round(c.por[k]/c.todos*100))}%"></i></button>`).join('')}</div>`:''}
    </div>
    <div class="fl-card">
      ${FL.por?`<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;font-size:14px">Você é <b>${esc(FL.por)}</b></span><button class="fl-bt sec" style="padding:7px 12px;font-size:13px" onclick="FL.trocarNome=1;flPintar()">trocar</button></div>`:''}
      ${!FL.por || FL.trocarNome ? `<h3 style="margin-top:${FL.por?10:0}px">Quem está arrumando?</h3>
      <div class="fl-nomes">${FL.nomes.map(n=>`<button class="${FL.por===n?'on':''}" onclick="flPor(${esc(JSON.stringify(n))})">${esc(n)}</button>`).join('')}<button onclick="flPorOutro()">Outro…</button></div>
      ${!FL.por?`<p style="margin:10px 0 0;font-size:13px;color:#D4121B;font-weight:700">Toque no seu nome para começar.</p>`:''}`:''}
    </div>
    <div class="fl-card">
      <h3>Toque no produto para arrumar</h3>
      <p class="fl-dica" style="margin:0">Com calma e capricho: foto com fundo claro e produto inteiro; confira nome, código, categoria e preço. Na dúvida, deixe para a administração. Preço novo vai para a administração aprovar.</p>
      <input class="fl-busca" style="margin-top:10px" placeholder="Buscar por nome ou código…" value="${esc(FL.q)}" oninput="FL.q=this.value;FL.lim=150;flPintarLista()">
      <button class="fl-bt ouro" style="width:100%;margin-top:10px" onclick="flEditados()"><i class="ti ti-edit"></i> Ver os já editados (quem fez e o que mudou)</button>
      <div class="fl-chips">${[['arrumar','⚠️ Para arrumar',c.arrumar],['sem_foto','📷 Sem foto',c.sem_foto],['prontos','✅ Prontos',c.prontos],['todos','Todos',c.todos]].map(([k,n,v])=>`<button class="${FL.filtro===k?'on':''}" onclick="FL.filtro='${k}';FL.lim=150;flPintar()">${n} (${v})</button>`).join('')}</div>
      ${FL.filtro==='arrumar'?`<select class="fl-sel" onchange="FL.aviso=this.value;FL.lim=150;flPintarLista()"><option value="">Todos os problemas</option>${Object.keys(FL_AVISOS).filter(k=>c.por[k]).map(k=>`<option value="${k}" ${FL.aviso===k?'selected':''}>${FL_AVISOS[k].t} (${c.por[k]})</option>`).join('')}</select>`:''}
    </div>
    <div id="fl-lista">${flListaHtml()}</div>
    <div class="fl-rod">Mutirão de arrumação · Las Vegas · <a href="#" onclick="flCarregar();return false" style="color:#D4121B">atualizar</a></div>
  </div>`;
}
function flTopo(sub){ return `<div class="fl-topo"><img src="${LOGO}" alt=""><div><b>Mutirão dos produtos</b><small>Las Vegas Sex Shop · ${esc(sub)}</small></div></div>`; }
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
function flPonto(){ FL.eu++; }

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
function flFechar(){ const m = $('#fl-m'); if(m) m.innerHTML = ''; FLP = null; if(EDT && EDT.modo==='link' && document.getElementById('ed-tela')?.innerHTML) flEditados(); }
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

/* ═════════ administração: link + preços para aprovar + histórico do mutirão (na tela 📸 Produtos) ═════════ */
var FLA = {pend: null, carregado: false, hist: null, pessoas: [], fPessoa: '', fTipo: '', fStatus: ''};
async function flaCarregar(){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'arrPendentes'}); FLA.pend = r.pendentes || []; }catch(e){ FLA.pend = []; }
  FLA.carregado = true; if(S.tela==='admin' && S.adm?.tab==='estoque') render();
}
const _estCatalogoV15 = estCatalogo;
estCatalogo = function(){
  const h = _estCatalogoV15();
  if(!estAdmin()) return h;
  if(!FLA.carregado){ FLA.carregado = true; setTimeout(flaCarregar, 50); }
  const n = (FLA.pend||[]).length;
  const extra = `<button class="btn" onclick="flAdmin()" title="Link do mutirão (sem PIN)"><i class="ti ti-camera-share"></i> Link sem PIN</button><button class="btn" onclick="flaPainel()" title="O que já foi feito e o que falta"><i class="ti ti-chart-bar"></i> Painel do mutirão</button><button class="btn ouro" onclick="flaEditados()" title="Produtos editados: quem fez, o que mudou, desfazer"><i class="ti ti-edit"></i> Editados</button><button class="btn" onclick="flaHistorico()" title="Lista completa de edições"><i class="ti ti-history"></i> Histórico (lista)</button>${(()=>{ const n = pdvD().produtos.filter(p=>p.ativo!==false && nsMaiusculoFL(p.nome)).length; return n?`<button class="btn" onclick="flaMaiusculas()"><i class="ti ti-letter-case"></i> Arrumar maiúsculas (${n})</button>`:''; })()}${n?`<button class="btn ouro" onclick="flaPrecos()"><i class="ti ti-currency-real"></i> ${n} preço(s) para aprovar</button>`:''}<button class="btn ouro" onclick="novoProduto()">`;
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
  const msg = `📸 *Mutirão dos produtos — Las Vegas* ✨\n\nMeninas, vamos deixar o catálogo impecável, com calma e capricho 💛\n\n1️⃣ Toquem no link e escolham o nome de vocês\n2️⃣ Abram *⚠️ Para arrumar*\n3️⃣ Toquem no produto: tirem a foto (fundo claro, produto inteiro) e confiram nome, código, categoria e preço\n\n✨ Sem pressa: o importante é ficar *certinho*. Na dúvida, deixa que a administração confere.\n\n${link}`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:520px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">📸 Link do mutirão (sem PIN)</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${chave?`<p class="suave" style="margin:0 0 8px;font-size:13px">Quem abrir este link vê os produtos com o que falta arrumar (foto, nome, código, categoria, preço), sem estoque nem vendas. Foto, nome, código e categoria entram na hora; <b>preço vem para você aprovar</b>. Tudo fica registrado no <b>Histórico do mutirão</b> (só a administração vê).</p>
      <input class="inp" readonly value="${esc(link)}" onclick="this.select()" style="margin-bottom:10px">
      <div class="g2"><button class="btn ouro" onclick="flCopiar()"><i class="ti ti-copy"></i> Copiar link</button>
        <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Mandar no WhatsApp</a></div>
      <div class="g2" style="margin-top:8px"><button class="btn p" onclick="flAdmin('novo')"><i class="ti ti-refresh"></i> Gerar link novo</button><button class="btn p" onclick="flAdmin('desligar')"><i class="ti ti-link-off"></i> Desligar o link</button></div>
      <p class="apagado" style="font-size:12px;margin:10px 0 0">Gerar link novo ou desligar faz o link antigo parar de funcionar na hora.</p>`
      :`<p class="suave" style="margin:0 0 12px">O link está <b>desligado</b>. Ninguém consegue mexer nos produtos por ele.</p><button class="btn ouro largo" onclick="flAdmin('novo')"><i class="ti ti-link"></i> Ligar e gerar o link</button>`}
    </div></div></div>`;
}

/* ───────── Histórico do mutirão (conferência interna) ───────── */
const FLA_CAMPO = {foto:'📷 Foto', nome:'Nome', codigo:'Código', categoria:'Categoria', preco:'💲 Preço'};
const FLA_ST = {feito:'', pendente:'⏳ aguardando aprovação', aprovado:'✅ aprovado', recusado:'✖ recusado', desfeito:'↩ desfeito'};
async function flaHistorico(rec){
  if(!FLA.hist || rec){ try{ toast('Carregando o histórico…'); const r = await api('admEstoque', {...S.adm.cred, op:'arrHistorico'}); FLA.hist = r.historico || []; FLA.pessoas = r.pessoas || []; }catch(e){ toast(e.message, true); return; } }
  flaHistPintar();
}
function flaHistPintar(){
  const H = (FLA.hist||[]).filter(a=>(!FLA.fPessoa || a.por===FLA.fPessoa) && (!FLA.fTipo || (FLA.fTipo==='foto'?a.tipo==='foto':FLA.fTipo==='ok'?a.tipo==='ok':FLA.fTipo==='preco'?a.campo==='preco':(a.tipo==='correcao'&&a.campo!=='preco'))) && (!FLA.fStatus || a.status===FLA.fStatus));
  const quando = q => String(q).slice(8,10)+'/'+String(q).slice(5,7)+' '+String(q).slice(11,16);
  const val = (a,v) => a.campo==='foto' ? (v?`<img src="${esc(fotoUrl({foto:v},120))}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;vertical-align:middle;background:#f3f3f3">`:'<span class="apagado">sem foto</span>') : a.campo==='preco' ? brl2(Number(v)||0) : (v?esc(v):'<span class="apagado">vazio</span>');
  const linha = a => `<tr style="${a.status==='desfeito'||a.status==='recusado'?'opacity:.5':''}"><td style="white-space:nowrap" class="suave">${quando(a.quando)}</td><td><b>${esc(a.por)}</b></td>
    <td><div style="font-weight:700">${esc(a.produto)}</div>${a.tipo==='ok'?`<span class="suave">marcou "está certo assim": ${esc(a.campo)}</span>`:`<span class="suave">${FLA_CAMPO[a.campo]||esc(a.campo)}:</span> ${val(a,a.antes)} → <b>${val(a,a.depois)}</b>`}
      ${FLA_ST[a.status]?`<div class="apagado" style="font-size:12px">${FLA_ST[a.status]}${a.revisado_por?' · '+esc(a.revisado_por):''}</div>`:''}</td>
    <td style="text-align:right">${a.tipo!=='ok' && (a.status==='feito'||a.status==='aprovado')?`<button class="btn p" style="padding:6px 10px;font-size:12px" onclick="flaDesfazer('${esc(a.id)}')"><i class="ti ti-arrow-back-up"></i> Desfazer</button>`:''}</td></tr>`;
  const P = FLA.pessoas || [];
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:860px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">🕵️ Histórico do mutirão <span class="suave" style="font-size:12px;font-weight:500">· só a administração vê</span></h3><button class="icone" aria-label="Atualizar" onclick="flaHistorico(1)"><i class="ti ti-refresh"></i></button><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${P.length?`<div class="tabela-wrap" style="margin-bottom:10px"><table class="ns-tab" style="width:100%;font-size:13px"><tr class="suave"><td>Pessoa</td><td>📷 Fotos</td><td>✏️ Correções</td><td>💲 Preços</td><td>👍 "Está certo"</td><td>↩ Desfeitos/recusados</td></tr>
        ${P.map(x=>`<tr style="cursor:pointer" onclick="FLA.fPessoa=FLA.fPessoa===${esc(JSON.stringify(x.nome))}?'':${esc(JSON.stringify(x.nome))};flaHistPintar()"><td><b>${esc(x.nome)}</b>${FLA.fPessoa===x.nome?' ✔':''}</td><td>${x.fotos}</td><td>${x.correcoes}</td><td>${x.precos}</td><td>${x.ok}</td><td>${x.desfeitos}</td></tr>`).join('')}</table></div>`:''}
      <div class="est-lojas" style="margin-bottom:8px">${[['','Tudo'],['foto','📷 Fotos'],['correcao','✏️ Nome/código/categoria'],['preco','💲 Preços'],['ok','👍 "Está certo"']].map(([k,n])=>`<button class="${FLA.fTipo===k?'on':''}" onclick="FLA.fTipo='${k}';flaHistPintar()">${n}</button>`).join('')}
        ${FLA.fPessoa?`<button class="on" onclick="FLA.fPessoa='';flaHistPintar()">✕ ${esc(FLA.fPessoa)}</button>`:''}</div>
      ${!H.length?'<p class="suave">Nada por aqui ainda.</p>':`<div class="ns-lista" style="max-height:56vh"><table class="ns-tab">${H.slice(0,400).map(linha).join('')}</table></div>${H.length>400?`<p class="apagado">mostrando as 400 mais recentes de ${H.length}</p>`:''}`}
      <p class="apagado" style="font-size:12px;margin:8px 0 0">Desfazer volta o campo (ou a foto) para como estava antes daquela edição. Preço pendente se resolve em "preços para aprovar".</p>
    </div></div></div>`;
}
async function flaDesfazer(id){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'arrDesfazer', id}); FLA.hist = r.historico || []; FLA.pessoas = r.pessoas || []; toast('Desfeito ✔');
    try{ S.adm.dados = await api('admDados', S.adm.cred); }catch(e){} flaHistPintar(); }
  catch(e){ toast(e.message, true); }
}

/* ───────── Arrumar maiúsculas de uma vez (com prévia) ───────── */
function nsMaiusculoFL(s){ const t = String(s||''); return /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4}/.test(t) && t===t.toUpperCase(); }
var FLM = null;
function flaMaiusculas(){
  const L = pdvD().produtos.filter(p=>p.ativo!==false && nsMaiusculoFL(p.nome)).map(p=>({id:p.id, de:p.nome, para:flTitulo(p.nome)})).filter(x=>x.para!==x.de);
  FLM = {L, fora:new Set(), gravando:false}; flaMaiPintar();
}
function flaMaiPintar(){
  const M = FLM, n = M.L.length - M.fora.size;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this&&!FLM.gravando)fecharModal()"><div class="modal" style="max-width:720px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">🔠 Arrumar maiúsculas</h3><button class="icone" aria-label="Fechar" onclick="if(!FLM.gravando)fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 8px;font-size:13px">Primeira letra de cada palavra; de/da/com/e… minúsculas; siglas (LGBT, INTT, BDSM…) e tamanhos (P, M, G) continuam em maiúscula; 15ML → 15ml. Desmarque o que não quiser.</p>
      <div class="ns-lista" style="max-height:52vh"><table class="ns-tab">${M.L.map(x=>`<tr><td style="width:26px"><input type="checkbox" ${M.fora.has(x.id)?'':'checked'} onchange="this.checked?FLM.fora.delete('${x.id}'):FLM.fora.add('${x.id}');flaMaiPintar()"></td><td><span class="de">${esc(x.de)}</span><br><span class="para">${esc(x.para)}</span></td></tr>`).join('')}</table></div>
      <button class="btn ouro largo" style="margin-top:10px" ${n&&!M.gravando?'':'disabled'} onclick="flaMaiAplicar()">${M.gravando?'<span class="gira"></span> Gravando…':`<i class="ti ti-check"></i> Arrumar ${n} nome(s)`}</button></div></div></div>`;
}
async function flaMaiAplicar(){
  const lista = FLM.L.filter(x=>!FLM.fora.has(x.id)).map(x=>({id:x.id, nome:x.para})); if(!lista.length) return;
  FLM.gravando = true; flaMaiPintar();
  try{ let n = 0; for(let i=0;i<lista.length;i+=150){ const r = await api('admEstoque', {...S.adm.cred, op:'catalogoLote', lista:lista.slice(i,i+150), origem:'arrumar maiúsculas'}); n += r.alterados||0; }
    S.adm.dados = await api('admDados', S.adm.cred); FLM.gravando = false; fecharModal(); render(); toast(`Nomes arrumados ✔ ${n}`); }
  catch(e){ FLM.gravando = false; flaMaiPintar(); toast(e.message, true); }
}

/* ───────── Painel do mutirão (gráficos) ───────── */
var FLP2 = null;
async function flaPainel(){
  try{ toast('Montando o painel…'); const r = await api('admEstoque', {...S.adm.cred, op:'arrPainel'}); FLP2 = {L: r.produtos||[], H: r.historico||[]}; }
  catch(e){ toast(e.message, true); return; }
  flCalcular(FLP2.L); flaPainelPintar();
}
function flaBarra(rot, v, tot, cor, extra){ const pct = tot ? Math.round(v/tot*100) : 0;
  return `<div style="margin:6px 0"><div class="linha entre" style="font-size:13px"><span>${rot}</span><span><b>${v}</b>${tot?` <span class="apagado">/ ${tot} · ${pct}%</span>`:''}${extra||''}</span></div>
    <div style="height:10px;border-radius:99px;background:rgba(0,0,0,.07);overflow:hidden;margin-top:3px"><i style="display:block;height:100%;width:${pct}%;background:${cor};border-radius:99px"></i></div></div>`; }
function flaPainelPintar(){
  const L = FLP2.L, H = FLP2.H, tot = L.length, prontos = L.filter(p=>!p._av.length).length, comFoto = L.filter(p=>p.foto).length;
  const por = {}; L.forEach(p=>p._av.forEach(k=>por[k]=(por[k]||0)+1));
  const feitosPor = {foto:0, nome:0, codigo:0, categoria:0, preco:0, ok:0};
  H.forEach(a=>{ if(a.status==='desfeito'||a.status==='recusado') return; if(a.tipo==='ok') feitosPor.ok++; else feitosPor[a.campo]=(feitosPor[a.campo]||0)+1; });
  const cats = {}; L.forEach(p=>{ const k = p.categoria||'Sem categoria'; cats[k] = cats[k]||{t:0,ok:0}; cats[k].t++; if(!p._av.length) cats[k].ok++; });
  const dias = []; for(let i=13;i>=0;i--){ const d = new Date(Date.now()-i*864e5); dias.push(d.toISOString().slice(0,10)); }
  const porDia = {}; H.forEach(a=>{ if(a.status==='desfeito'||a.status==='recusado') return; const d = String(a.quando).slice(0,10); porDia[d]=(porDia[d]||0)+1; });
  const maxDia = Math.max(1, ...dias.map(d=>porDia[d]||0));
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:820px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">📊 Painel do mutirão</h3><button class="icone" aria-label="Atualizar" onclick="flaPainel()"><i class="ti ti-refresh"></i></button><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="ns-res"><div><b>${prontos}</b>prontos de ${tot} (${tot?Math.round(prontos/tot*100):0}%)</div><div><b>${tot-prontos}</b>ainda com algo</div><div><b>${comFoto}</b>com foto (${tot?Math.round(comFoto/tot*100):0}%)</div><div><b>${H.filter(a=>a.status!=='desfeito'&&a.status!=='recusado'&&a.tipo!=='ok').length}</b>edições feitas</div></div>
      ${flaBarra('<b>Produtos prontos</b>', prontos, tot, 'linear-gradient(90deg,#F5B524,#2fb36b)')}
      <h4 style="margin:16px 0 4px">O que falta, por tipo</h4>
      ${Object.keys(FL_AVISOS).filter(k=>por[k]).map(k=>flaBarra(FL_AVISOS[k].t, por[k], tot, '#D4121B')).join('') || '<p class="suave">Nada faltando 🎉</p>'}
      <h4 style="margin:16px 0 4px">O que já foi feito no mutirão</h4>
      <div class="ns-res">${[['foto','📷 fotos'],['nome','✏️ nomes'],['codigo','🔢 códigos'],['categoria','🏷️ categorias'],['preco','💲 preços'],['ok','👍 "está certo"']].map(([k,n])=>`<div><b>${feitosPor[k]||0}</b>${n}</div>`).join('')}</div>
      <h4 style="margin:16px 0 4px">Prontos por categoria</h4>
      ${Object.entries(cats).sort((a,b)=>b[1].t-a[1].t).map(([k,v])=>flaBarra(esc(k), v.ok, v.t, '#2fb36b')).join('')}
      <h4 style="margin:16px 0 6px">Edições por dia (14 dias)</h4>
      <div style="display:flex;align-items:flex-end;gap:4px;height:120px;padding:4px 0;border-bottom:1px solid var(--linha)">${dias.map(d=>{ const v = porDia[d]||0; return `<div title="${d.slice(8,10)}/${d.slice(5,7)}: ${v}" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span style="font-size:10px;color:var(--creme3)">${v||''}</span><i style="display:block;width:100%;height:${Math.round(v/maxDia*90)}%;min-height:${v?3:0}px;background:#D4121B;border-radius:5px 5px 0 0"></i></div>`; }).join('')}</div>
      <div style="display:flex;gap:4px">${dias.map(d=>`<span style="flex:1;text-align:center;font-size:10px;color:var(--creme3)">${d.slice(8,10)}</span>`).join('')}</div>
      <p class="apagado" style="font-size:12px;margin:12px 0 0">Quem fez cada edição: botão <b>Histórico</b>.</p>
    </div></div></div>`;
}

/* ═════════ ✏️ EDITADOS NO MUTIRÃO (administração) — cartões por produto, quem fez, linha do tempo, desfazer ═════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.ed-tela{position:fixed;inset:0;z-index:8000;background:var(--fundo,#f6f3f2);overflow:auto;animation:edEntra .35s cubic-bezier(.2,.8,.2,1)}
@keyframes edEntra{from{opacity:0;transform:translateY(24px)}}
.ed-topo{position:sticky;top:0;z-index:2;background:linear-gradient(135deg,#D4121B,#a80d14);color:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 6px 20px rgba(120,0,0,.25)}
.ed-topo h2{margin:0;font-size:18px;flex:1}.ed-topo button{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
.ed-wrap{max-width:1180px;margin:0 auto;padding:16px}
.ed-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.ed-kpi{background:#fff;border-radius:16px;padding:14px;box-shadow:0 2px 12px rgba(0,0,0,.05);animation:edPop .5s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--i)*70ms)}
.ed-kpi b{display:block;font-size:30px;line-height:1.1;color:#D4121B}.ed-kpi span{font-size:12.5px;color:#666}
@keyframes edPop{from{opacity:0;transform:scale(.85) translateY(10px)}}
.ed-pessoas{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 10px}
.ed-p{flex:0 0 auto;display:flex;align-items:center;gap:8px;background:#fff;border:2px solid transparent;border-radius:99px;padding:5px 14px 5px 5px;cursor:pointer;font:inherit;box-shadow:0 2px 8px rgba(0,0,0,.05);transition:.2s}
.ed-p:hover{transform:translateY(-2px)}.ed-p.on{border-color:#D4121B;background:#fff5f5}
.ed-av{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex:0 0 auto}
.ed-p small{display:block;font-size:11px;color:#777;line-height:1}
.ed-tipos{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 14px}
.ed-tipos button{border:1.5px solid rgba(0,0,0,.1);background:#fff;border-radius:99px;padding:6px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.ed-tipos button.on{background:#222;color:#fff;border-color:#222}
.ed-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px}
.ed-card{position:relative;background:#fff;border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.06);animation:edCard .45s cubic-bezier(.2,.9,.3,1.1) both;animation-delay:calc(min(var(--i),24)*35ms);transition:transform .2s, box-shadow .2s;text-align:left;border:0;padding:0;font:inherit;color:#222}
.ed-card:hover{transform:translateY(-4px);box-shadow:0 10px 26px rgba(0,0,0,.12)}
@keyframes edCard{from{opacity:0;transform:translateY(18px) scale(.96)}}
.ed-card .ft{width:100%;aspect-ratio:4/3;object-fit:cover;background:#f2eeee;display:block}
.ed-card .sem{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;background:#f6f0ef;color:#bbb;font-size:34px}
.ed-card .co{padding:10px 12px 12px}
.ed-card b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13.5px;line-height:1.25}
.ed-tags{display:flex;flex-wrap:wrap;gap:4px;margin:7px 0}
.ed-tag{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:99px;color:#fff}
.ed-quem{display:flex;align-items:center;gap:6px;font-size:12px;color:#666}
.ed-quem .ed-av{width:24px;height:24px;font-size:10px;margin-left:-6px;border:2px solid #fff}.ed-quem .ed-av:first-child{margin-left:0}
.ed-card .pend{position:absolute;top:10px;left:10px;background:#F5B524;color:#222;font-size:11px;font-weight:800;padding:3px 9px;border-radius:99px;box-shadow:0 2px 8px rgba(0,0,0,.15);animation:edPulsa 1.6s infinite}
.ed-card .desf{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.65);color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:99px}
@keyframes edPulsa{50%{transform:scale(1.08)}}
.ed-lado{position:fixed;inset:0;z-index:8500;background:rgba(20,8,8,.45);display:flex;justify-content:flex-end;animation:edFade .25s}
@keyframes edFade{from{opacity:0}}
.ed-painel{width:min(520px,100%);height:100%;background:#fff;overflow:auto;box-shadow:-10px 0 40px rgba(0,0,0,.2);animation:edDesliza .35s cubic-bezier(.2,.9,.2,1)}
@keyframes edDesliza{from{transform:translateX(100%)}}
.ed-painel .ft{width:100%;max-height:300px;object-fit:contain;background:#f3efee;display:block}
.ed-linha{position:relative;margin:6px 0 0 14px;padding-left:22px;border-left:3px solid #f0e3e2}
.ed-ev{position:relative;margin:0 0 16px;animation:edEv .4s both;animation-delay:calc(var(--i)*60ms)}
@keyframes edEv{from{opacity:0;transform:translateX(16px)}}
.ed-ev .dot{position:absolute;left:-36px;top:0}
.ed-ev .q{font-size:12.5px;color:#666}.ed-ev .q b{color:#222}
.ed-mud{margin-top:5px;background:#faf7f6;border-radius:12px;padding:8px 10px;font-size:13.5px}
.ed-mud .de{text-decoration:line-through;color:#999}.ed-mud .para{font-weight:800;color:#1b7a45;background:rgba(47,179,107,.12);border-radius:6px;padding:0 4px}
.ed-fotos{display:flex;gap:8px;align-items:center}.ed-fotos img{width:84px;height:84px;object-fit:cover;border-radius:10px;background:#eee}
.ed-ev.cancel{opacity:.5}
.ed-bt{border:0;border-radius:10px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;background:#f1eeee;color:#222;margin-top:6px}
.ed-bt.vermelho{background:#fde8e8;color:#b30f17}
.ed-vazio{text-align:center;color:#888;padding:60px 10px;font-size:15px}
@media (prefers-reduced-motion:reduce){.ed-tela,.ed-kpi,.ed-card,.ed-painel,.ed-ev,.ed-lado,.ed-card .pend{animation:none!important}}
`; document.head.appendChild(st); })();

const ED_COR = {foto:'#7b5cff', nome:'#0e9f6e', codigo:'#2563eb', categoria:'#d97706', preco:'#D4121B', ok:'#6b7280'};
const ED_NOME = {foto:'Foto', nome:'Nome', codigo:'Código', categoria:'Categoria', preco:'Preço', ok:'Está certo'};
const ED_PALETA = ['#D4121B','#7b5cff','#0e9f6e','#d97706','#2563eb','#db2777','#0891b2','#65a30d','#9333ea','#ea580c'];
function edCorPessoa(n){ let h = 0; for(const c of String(n||'')) h = (h*31 + c.charCodeAt(0)) >>> 0; return ED_PALETA[h % ED_PALETA.length]; }
function edAv(n){ return `<span class="ed-av" style="background:${edCorPessoa(n)}" title="${esc(n)}">${esc(iniciais(n))}</span>`; }
function edHa(q){ const t = new Date(String(q).replace(' ','T')+'-05:00').getTime(), m = Math.max(0, Math.round((Date.now()-t)/60000));
  return m<1?'agora':m<60?`há ${m} min`:m<1440?`há ${Math.round(m/60)} h`:`há ${Math.round(m/1440)} d`; }
function edCampo(a){ return a.tipo==='foto' ? 'foto' : a.tipo==='ok' ? 'ok' : a.campo; }
var EDT = null;
async function flEditados(){
  EDT = Object.assign(EDT||{pessoa:'', tipo:'', q:'', aberto:null}, {modo:'link'});
  try{ toast('Carregando…'); const r = await api('fotos', {chave: FL.chave, op:'editados'}); EDT.H = r.historico||[]; EDT.L = FL.lista; }
  catch(e){ toast(erroRede(e)?'Sem internet — tente de novo':e.message, true); return; }
  EDT.porId = {}; EDT.L.forEach(p=>EDT.porId[p.id]=p);
  edPintar();
}
async function flaEditados(){
  EDT = Object.assign(EDT||{pessoa:'', tipo:'', q:'', aberto:null}, {modo:'admin'});
  try{ toast('Carregando…'); const r = await api('admEstoque', {...S.adm.cred, op:'arrPainel'}); EDT.L = r.produtos||[]; EDT.H = r.historico||[]; }
  catch(e){ toast(e.message, true); return; }
  EDT.porId = {}; EDT.L.forEach(p=>EDT.porId[p.id]=p);
  edPintar();
}
function edFiltrados(){
  return EDT.H.filter(a=>(!EDT.pessoa || a.por===EDT.pessoa) && (!EDT.tipo || edCampo(a)===EDT.tipo));
}
function edPintar(){
  let el = document.getElementById('ed-tela'); if(!el){ el = document.createElement('div'); el.id = 'ed-tela'; document.body.appendChild(el); }
  const H = EDT.H, F = edFiltrados();
  const grupos = new Map(); F.forEach(a=>{ if(!grupos.has(a.produto_id)) grupos.set(a.produto_id, []); grupos.get(a.produto_id).push(a); });
  const q = semAcento(EDT.q.trim());
  const cards = [...grupos.entries()].filter(([id,ev])=>!q || semAcento((EDT.porId[id]?.nome||ev[0].produto)).includes(q));
  const pessoas = {}; H.forEach(a=>{ const n = a.por||'?'; pessoas[n] = pessoas[n]||{n:0, prods:new Set()}; if(a.status!=='desfeito'&&a.status!=='recusado'){ pessoas[n].n++; pessoas[n].prods.add(a.produto_id); } });
  const validos = H.filter(a=>a.status!=='desfeito'&&a.status!=='recusado');
  const link = EDT.modo==='link';
  const kpi = [[new Set(validos.map(a=>a.produto_id)).size,'produtos editados'],[validos.filter(a=>a.tipo==='foto').length,'fotos tiradas'],[validos.filter(a=>a.tipo==='correcao').length,'correções'],[H.filter(a=>a.status==='pendente').length, link?'preços esperando aprovação':'preços esperando você']].concat(link?[]:[[Object.keys(pessoas).length,'pessoas ajudando']]);
  const tipos = {}; H.forEach(a=>{ const k = edCampo(a); tipos[k]=(tipos[k]||0)+1; });
  el.innerHTML = `<div class="ed-tela">
    <div class="ed-topo"><h2>✏️ Editados no mutirão</h2><button onclick="EDT.modo==='link'?flEditados():flaEditados()"><i class="ti ti-refresh"></i></button><button onclick="edFechar()"><i class="ti ti-x"></i> Fechar</button></div>
    <div class="ed-wrap">
      <div class="ed-kpis">${kpi.map(([v,t],i)=>`<div class="ed-kpi" style="--i:${i}"><b data-conta="${v}">0</b><span>${t}</span></div>`).join('')}</div>
      <div class="ed-pessoas"><button class="ed-p ${!EDT.pessoa?'on':''}" onclick="EDT.pessoa='';edPintar()"><span class="ed-av" style="background:#222">★</span><span>Todas${link?'':`<small>${validos.length} edições</small>`}</span></button>
        ${Object.entries(pessoas).sort((a,b)=>b[1].n-a[1].n).map(([n,x])=>`<button class="ed-p ${EDT.pessoa===n?'on':''}" onclick="EDT.pessoa=EDT.pessoa===${esc(JSON.stringify(n))}?'':${esc(JSON.stringify(n))};edPintar()">${edAv(n)}<span>${esc(n)}${link?'':`<small>${x.prods.size} produto(s) · ${x.n} edições</small>`}</span></button>`).join('')}</div>
      <div class="ed-tipos">${[['','Tudo'],['foto','📷 Fotos'],['nome','Nome'],['codigo','Código'],['categoria','Categoria'],['preco','💲 Preço'],['ok','👍 Está certo']].filter(([k])=>!k||tipos[k]).map(([k,n])=>`<button class="${EDT.tipo===k?'on':''}" onclick="EDT.tipo='${k}';edPintar()">${n}${k?` · ${tipos[k]}`:''}</button>`).join('')}
        <input class="inp" style="flex:1;min-width:180px;max-width:320px;border-radius:99px" placeholder="Buscar produto…" value="${esc(EDT.q)}" oninput="EDT.q=this.value;clearTimeout(window._edT);window._edT=setTimeout(edPintar,250)"></div>
      ${!cards.length?`<div class="ed-vazio">Nenhuma edição ${EDT.pessoa?'de '+esc(EDT.pessoa)+' ':''}por aqui ainda.</div>`:`<div class="ed-grade">${cards.slice(0,300).map(([id,ev],i)=>edCardHtml(id, ev, i)).join('')}</div>`}
    </div></div>`;
  el.querySelectorAll('[data-conta]').forEach(b=>{ const fim = Number(b.dataset.conta)||0, t0 = performance.now(); const passo = t=>{ const k = Math.min(1,(t-t0)/700); b.textContent = Math.round(fim*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); });
  if(EDT.aberto) edAbrir(EDT.aberto, true);
}
function edCardHtml(id, ev, i){
  const p = EDT.porId[id] || {nome: ev[0].produto}, u = p.foto ? fotoUrl(p, 320) : '';
  const campos = [...new Set(ev.filter(a=>a.status!=='desfeito'&&a.status!=='recusado').map(edCampo))];
  const quem = [...new Set(ev.map(a=>a.por))];
  const pend = ev.some(a=>a.status==='pendente'), todosDesf = ev.every(a=>a.status==='desfeito'||a.status==='recusado');
  return `<button class="ed-card" style="--i:${i}" onclick="edAbrir('${id}')">
    ${pend?'<span class="pend">💲 preço p/ aprovar</span>':''}${todosDesf?'<span class="desf">↩ desfeito</span>':''}
    ${u?`<img class="ft" src="${esc(u)}" loading="lazy" alt="">`:'<div class="sem">📷</div>'}
    <div class="co"><b>${esc(p.nome)}</b>
      <div class="ed-tags">${campos.map(k=>`<span class="ed-tag" style="background:${ED_COR[k]||'#888'}">${ED_NOME[k]||k}</span>`).join('')}</div>
      <div class="ed-quem">${quem.slice(0,4).map(edAv).join('')}<span>${esc(quem.length===1?quem[0]:quem.length+' pessoas')} · ${edHa(ev[0].quando)}</span></div></div></button>`;
}
function edValor(a, v){
  if(edCampo(a)==='foto') return v ? `<img src="${esc(fotoUrl({foto:v},240))}" alt="">` : '<span style="color:#999">sem foto</span>';
  if(a.campo==='preco') return brl2(Number(v)||0);
  return v ? esc(v) : '<i style="color:#999">vazio</i>';
}
function edAbrir(id, re){
  EDT.aberto = id;
  const p = EDT.porId[id] || {}, ev = EDT.H.filter(a=>a.produto_id===id), u = p.foto ? fotoUrl(p, 640) : '';
  let el = document.getElementById('ed-lado'); if(!el){ el = document.createElement('div'); el.id = 'ed-lado'; document.body.appendChild(el); }
  el.innerHTML = `<div class="ed-lado" onclick="if(event.target===this)edFecharLado()" ${re?'style="animation:none"':''}><div class="ed-painel" ${re?'style="animation:none"':''}>
    <div class="ed-topo" style="position:sticky"><h2 style="font-size:15px">${esc(p.nome || ev[0]?.produto || '')}</h2><button onclick="edFecharLado()"><i class="ti ti-x"></i></button></div>
    ${u?`<img class="ft" src="${esc(u)}" alt="">`:''}
    <div style="padding:14px 16px">
      <div class="linha" style="gap:6px;flex-wrap:wrap;font-size:13px;color:#555;margin-bottom:6px"><span>${esc(p.codigo||'sem código')}</span>·<span>${esc(p.categoria||'sem categoria')}</span>·<b>${brl2(p.preco||0)}</b></div>
      <div class="linha" style="gap:6px;margin-bottom:14px">${EDT.modo==='link'?`<button class="ed-bt" style="background:#D4121B;color:#fff" onclick="edFechar();flAbrir('${id}')"><i class="ti ti-pencil"></i> Corrigir este produto</button>`:`<button class="ed-bt" onclick="edFecharTudo();catAbrir('${id}')"><i class="ti ti-camera"></i> Foto</button><button class="ed-bt" onclick="edFecharTudo();admPdvProduto('${id}')"><i class="ti ti-pencil"></i> Editar produto</button>`}</div>
      <h4 style="margin:0 0 10px">Linha do tempo</h4>
      <div class="ed-linha">${ev.map((a,i)=>{ const k = edCampo(a), cancel = a.status==='desfeito'||a.status==='recusado';
        return `<div class="ed-ev ${cancel?'cancel':''}" style="--i:${i}"><span class="dot">${edAv(a.por)}</span>
          <div class="q"><b>${esc(a.por)}</b> ${k==='foto'?(a.antes?'trocou a foto':'tirou a foto'):k==='ok'?`marcou "está certo assim" (${esc((FL_AVISOS[a.campo]||{}).t||a.campo)})`:`mudou <b style="color:${ED_COR[k]}">${ED_NOME[k]||k}</b>`} · ${edHa(a.quando)} <span style="color:#aaa">(${esc(String(a.quando).slice(8,10)+'/'+String(a.quando).slice(5,7)+' '+String(a.quando).slice(11,16))})</span></div>
          ${k!=='ok'?`<div class="ed-mud">${k==='foto'?`<div class="ed-fotos">${edValor(a,a.antes)}<span style="font-size:20px">→</span>${edValor(a,a.depois)}</div>`:`<span class="de">${edValor(a,a.antes)}</span> → <span class="para">${edValor(a,a.depois)}</span>`}</div>`:''}
          ${a.status==='pendente'?`<div style="font-size:12px;font-weight:800;color:#8a5d00;margin-top:5px">⏳ esperando aprovação</div>${EDT.modo==='link'?'':`<button class="ed-bt" onclick="edRevisar('${esc(a.id)}',true)">✅ Aprovar</button> <button class="ed-bt vermelho" onclick="edRevisar('${esc(a.id)}',false)">✖ Recusar</button>`}`:''}
          ${a.status==='aprovado'?'<div style="font-size:12px;color:#1b7a45;font-weight:800;margin-top:4px">✅ aprovado</div>':''}
          ${cancel?`<div style="font-size:12px;color:#888;margin-top:4px">${a.status==='desfeito'?'↩ desfeito':'✖ recusado'}${a.revisado_por?' por '+esc(a.revisado_por):''}</div>`:''}
          ${EDT.modo!=='link' && k!=='ok' && (a.status==='feito'||a.status==='aprovado')?`<button class="ed-bt vermelho" onclick="edDesfazer('${esc(a.id)}')"><i class="ti ti-arrow-back-up"></i> Desfazer</button>`:''}
        </div>`; }).join('')}</div>
    </div></div></div>`;
}
function edFecharLado(){ EDT.aberto = null; const el = document.getElementById('ed-lado'); if(el) el.innerHTML = ''; }
function edFechar(){ edFecharLado(); const el = document.getElementById('ed-tela'); if(el) el.innerHTML = ''; }
function edFecharTudo(){ edFechar(); }
async function edDesfazer(id){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'arrDesfazer', id}); toast('Desfeito ✔'); try{ S.adm.dados = await api('admDados', S.adm.cred); }catch(e){} await flaEditados(); }
  catch(e){ toast(e.message, true); }
}
async function edRevisar(id, aprovar){
  try{ await api('admEstoque', {...S.adm.cred, op:'arrRevisar', id, aprovar}); toast(aprovar?'Preço aprovado ✔':'Recusado'); try{ S.adm.dados = await api('admDados', S.adm.cred); }catch(e){} await flaEditados(); }
  catch(e){ toast(e.message, true); }
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && document.getElementById('ed-tela')?.innerHTML){ if(EDT?.aberto) edFecharLado(); else edFechar(); } });
