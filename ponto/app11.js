/* ═════════════════════ ESTOQUE v10: 3 LOCAIS + CONTAGEM + TRANSFERÊNCIA + SAÍDA + REPOSIÇÃO + PDV LIGADO ═════════════════════
   Locais: Bosque · Prateleira (bosque) · Bosque · Depósito (deposito) · Centro · Prateleira (centro).
   Portal › Estoque: Receber · Contar · Transferir · Saída · Repor · Consultar.
   Administração › Estoque: Saldo por local · Repor · Contagens · Transferências · Receber · Saída · Entradas · Movimentos · Importar · Configurar.
   Servidor: ponto/servidor/ESTOQUE.gs (mesmo arquivo do v9, ampliado). */

(function(){ const st = document.createElement('style'); st.textContent = `
.est-hub{display:flex;gap:6px;overflow-x:auto;margin:0 0 14px;padding-bottom:2px;scrollbar-width:none}
.est-hub button{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:14px;border:1.5px solid var(--linha);background:rgba(255,255,255,.03);color:inherit;font:inherit;font-weight:700;cursor:pointer;position:relative}
.est-hub button.on{border-color:var(--dourado);background:rgba(245,181,36,.14);color:var(--dourado)}
.est-hub button .contador{margin-left:2px}
.cnt-topo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
.cnt-topo div{padding:12px;border-radius:14px;background:rgba(255,255,255,.04);text-align:center} .cnt-topo b{display:block;font-size:26px;font-variant-numeric:tabular-nums} .cnt-topo small{opacity:.7;font-size:12px}
.cnt-scan{display:flex;gap:8px;align-items:stretch}
.cnt-scan .inp{font-size:18px;padding:14px;flex:1}
.cnt-scan .btn{white-space:nowrap}
.cnt-mult{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13.5px;flex-wrap:wrap}
.cnt-mult button{min-width:44px;padding:6px 10px;border-radius:10px;border:1.5px solid var(--linha);background:transparent;color:inherit;font:inherit;font-weight:800;cursor:pointer}
.cnt-mult button.on{border-color:var(--dourado);color:var(--dourado);background:rgba(245,181,36,.12)}
.cnt-ult{display:grid;gap:6px;margin-top:12px}
.cnt-ult>div{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);animation:cntEntra .35s ease}
.cnt-ult>div.novo{background:rgba(91,212,155,.12)} .cnt-ult .q{font-size:20px;font-weight:900;min-width:52px;text-align:center;font-variant-numeric:tabular-nums}
.cnt-ult .nm{flex:1;min-width:0} .cnt-ult .nm b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .cnt-ult .nm small{opacity:.7;font-size:12px}
@keyframes cntEntra{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}
.cnt-sync{font-size:12.5px;display:flex;align-items:center;gap:6px;opacity:.85}
.cnt-flash{position:fixed;inset:0;pointer-events:none;z-index:90;box-shadow:inset 0 0 0 6px var(--ok);animation:cntFlash .45s ease forwards}
.cnt-flash.ruim{box-shadow:inset 0 0 0 6px var(--bad)}
@keyframes cntFlash{to{opacity:0}}
.est-lst{display:grid;gap:6px;margin-top:10px}
.est-lst>div{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04)}
.est-lst .nm{flex:1;min-width:0} .est-lst .nm b{display:block;font-size:14px} .est-lst .nm small{opacity:.7;font-size:12px}
.est-step{display:flex;align-items:center;gap:4px} .est-step button{width:34px;height:34px;border-radius:10px;border:1px solid var(--linha);background:transparent;color:inherit;font-size:18px;cursor:pointer}
.est-step input{width:62px;text-align:center;font-weight:800;padding:6px}
.est-res{display:grid;gap:6px;margin-top:8px;max-height:280px;overflow:auto}
.est-seta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.est-atalhos{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
.rep-grupo{margin-bottom:16px}
.rep-grupo h3{margin:0 0 8px;font-size:16px;display:flex;align-items:center;gap:8px}
.cam-veu video{width:100%;max-height:60vh;border-radius:14px;background:#000;object-fit:cover}
.cam-mira{position:relative} .cam-mira:after{content:'';position:absolute;left:10%;right:10%;top:50%;height:2px;background:var(--bad);box-shadow:0 0 12px var(--bad)}
.pdv-prod .est-badge{position:absolute;right:8px;bottom:10px;font-size:11px;font-weight:800;padding:1px 7px;border-radius:99px;background:rgba(91,212,155,.18);color:var(--ok)}
.pdv-prod .est-badge.zero{background:rgba(255,92,92,.18);color:var(--bad)} .pdv-prod .est-badge.pouco{background:rgba(245,181,36,.18);color:var(--warn)}
@media (max-width:640px){.cnt-topo b{font-size:22px}.cnt-scan{flex-wrap:wrap}.cnt-scan .inp{flex:1 1 100%}}
`; document.head.appendChild(st); })();

/* ───────── utilidades ───────── */
const estProd = id => pdvD().produtos.find(p=>p.id===id);
function estAcharCodigo(cod){
  cod = String(cod||'').trim(); if(!cod) return null;
  const P = pdvD().produtos, low = cod.toLowerCase();
  let p = P.find(x=>x.codigo===cod) || P.find(x=>x.sku && x.sku.toLowerCase()===low);
  if(!p && /^0\d{8,13}$/.test(cod)) p = P.find(x=>x.codigo===cod.replace(/^0+/,''));
  if(!p){ const v = (estD().vinculos||[]).find(v=>v.chave==='EAN|'+cod); if(v) p = estProd(v.produto_id); }
  return p || null;
}
function estBuscarNome(q, lim=12){
  const qs = semAcento(q.trim()); if(qs.length<2) return [];
  const ws = qs.split(/\s+/);
  return pdvD().produtos.filter(p=>{ const t = semAcento(p.nome+' '+(p.codigo||'')+' '+(p.sku||'')); return ws.every(w=>t.includes(w)); })
    .sort((a,b)=>(semAcento(a.nome).startsWith(qs)?0:1)-(semAcento(b.nome).startsWith(qs)?0:1) || a.nome.localeCompare(b.nome)).slice(0,lim);
}
const estQtdLocal = (pid, loc) => estQtdDe(pid, loc) ?? 0;
function estBip(ok=true){
  try{ const a = new (window.AudioContext||window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination);
    o.frequency.value = ok ? 1250 : 220; g.gain.value = .08; o.start(); o.stop(a.currentTime + (ok?.08:.25)); setTimeout(()=>a.close(), 400); }catch(e){}
  try{ navigator.vibrate && navigator.vibrate(ok?30:[60,40,60]); }catch(e){}
  const f = document.createElement('div'); f.className = 'cnt-flash'+(ok?'':' ruim'); document.body.appendChild(f); setTimeout(()=>f.remove(), 500);
}
const estUid = () => 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function estMinhaLoja(){ return estAdmin() ? null : estLojaHoje(); }
function estAposSalvar(d){ if(estAdmin()) S.adm.dados = d; else S.sess.dados = d; }

/* ───────── câmera: lê código de barras (BarcodeDetector nativo; senão ZXing) ───────── */
let CAM = null;
async function estCamera(onCode, titulo){
  estCameraFechar();
  CAM = {onCode, ultimo:'', quando:0, parar:null};
  $('#modal').innerHTML = `<div class="veu cam-veu" onclick="if(event.target===this)estCameraFechar()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${esc(titulo||'Ler código de barras')}</h3><button class="icone" onclick="estCameraFechar()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><div class="cam-mira"><video id="cam-v" playsinline muted></video></div>
      <p class="suave" id="cam-st" style="font-size:13px;margin:10px 0 0;text-align:center">Abrindo a câmera…</p>
      <button class="btn largo" style="margin-top:10px" onclick="estCameraFechar()"><i class="ti ti-check"></i> Pronto</button></div></div></div>`;
  const v = $('#cam-v'), st = t => { const e = $('#cam-st'); if(e) e.textContent = t; };
  const achou = cod => { const agora = Date.now(); if(cod===CAM?.ultimo && agora-CAM.quando<1500) return; if(!CAM) return; CAM.ultimo = cod; CAM.quando = agora; st('Lido: '+cod); CAM.onCode(cod); };
  try{
    if('BarcodeDetector' in window){
      const det = new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','qr_code']});
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment', width:{ideal:1280}}});
      v.srcObject = stream; await v.play(); st('Aponte para o código de barras');
      let vivo = true; CAM.parar = ()=>{ vivo = false; stream.getTracks().forEach(t=>t.stop()); };
      const loop = async ()=>{ if(!vivo) return; try{ const r = await det.detect(v); if(r[0]) achou(r[0].rawValue); }catch(e){} setTimeout(loop, 180); };
      loop();
    } else {
      if(!window.ZXing) await new Promise((ok, erro)=>{ const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'; s.onload = ok; s.onerror = ()=>erro(new Error('Não consegui carregar o leitor')); document.head.appendChild(s); });
      const leitor = new ZXing.BrowserMultiFormatReader();
      CAM.parar = ()=>{ try{ leitor.reset(); }catch(e){} };
      st('Aponte para o código de barras');
      leitor.decodeFromVideoDevice(undefined, 'cam-v', (res)=>{ if(res) achou(res.getText()); });
    }
  }catch(e){ st('Câmera indisponível: '+(e.message||e)+'. Use o leitor ou digite o código.'); }
}
function estCameraFechar(){ if(CAM?.parar) try{ CAM.parar(); }catch(e){} const tinha = !!CAM; CAM = null; if(tinha && $('#cam-v')) $('#modal').innerHTML = ''; }

/* código que não está no catálogo → a pessoa diz qual produto é (fica ligado para sempre) */
let VINC = null;
function estVincularCodigo(cod, depois){
  VINC = {cod, depois, q:''};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">Código novo: ${esc(cod)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px;font-size:14px">Esse código ainda não está ligado a nenhum produto. Busque o produto pelo nome: daqui pra frente o sistema reconhece esse código sozinho (na contagem, nas transferências e no PDV).</p>
      <input class="inp" id="vinc-q" placeholder="Nome do produto…" oninput="VINC.q=this.value;estVincPintar()">
      <div class="est-res" id="vinc-res"></div></div></div></div>`;
  setTimeout(()=>$('#vinc-q')?.focus(), 50);
}
function estVincPintar(){ const el = $('#vinc-res'); if(!el) return;
  el.innerHTML = estBuscarNome(VINC.q, 20).map(p=>`<button class="est-prod" onclick="estVincular('${p.id}')"><span style="font-size:20px">${emojiDe(p)}</span><div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'sem código')}</small></div></button>`).join('') || (VINC.q.length>1?'<p class="suave">Nada encontrado.</p>':''); }
async function estVincular(pid){
  const {cod, depois} = VINC;
  try{ const r = await estApi('vincular', {codigo:cod, produto_id:pid}); const E = estD(); if(r.vinculos) E.vinculos = r.vinculos; else if(r.estoque) estAposSalvar(r);
    fecharModal(); toast('Código ligado ✔'); depois && depois(estProd(pid)); }
  catch(e){ toast(e.message, true); }
}

/* ───────── lista de itens (transferir / saída) ───────── */
function estListaHtml(st, nome, localOrigem){
  const res = st.q ? estBuscarNome(st.q, 8) : [];
  return `<div class="cnt-scan"><input class="inp" id="${nome}-q" placeholder="Bipe o código ou digite o nome…" value="${esc(st.q)}" autocomplete="off"
      oninput="${nome}.q=this.value;estListaRes('${nome}','${localOrigem||''}')" onkeydown="estListaEnter(event,'${nome}')">
      <button class="btn" onclick="estCamera(c=>estListaCodigo('${nome}',c),'Adicionar pela câmera')"><i class="ti ti-camera"></i> Câmera</button></div>
    <div class="est-res" id="${nome}-res">${estListaResHtml(nome, res, localOrigem)}</div>
    <div class="est-lst">${st.itens.map((i,k)=>{ const p = estProd(i.produto_id); const disp = localOrigem ? estQtdLocal(i.produto_id, localOrigem) : null;
      return `<div><span style="font-size:20px">${emojiDe(p||{})}</span><div class="nm"><b>${esc(p?.nome||'?')}</b><small>${localOrigem?`tem ${estFmt(disp)} em ${esc(estLojaNome(localOrigem))}${i.qtd>disp?' · <b style="color:var(--warn)">mais do que o sistema tem</b>':''}`:esc(p?.codigo||'')}</small></div>
        <div class="est-step"><button onclick="${nome}.itens[${k}].qtd=Math.max(1,${nome}.itens[${k}].qtd-1);render()">−</button><input class="inp num" inputmode="numeric" value="${i.qtd}" onchange="${nome}.itens[${k}].qtd=Math.max(1,estN(this.value)||1);render()"><button onclick="${nome}.itens[${k}].qtd++;render()">+</button></div>
        <button class="icone" onclick="${nome}.itens.splice(${k},1);render()"><i class="ti ti-trash"></i></button></div>`; }).join('')}</div>`;
}
function estListaResHtml(nome, res, loc){ return res.map(p=>`<button class="est-prod" onclick="estListaAdd('${nome}','${p.id}')"><span style="font-size:18px">${emojiDe(p)}</span><div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'')}${loc?' · tem '+estFmt(estQtdLocal(p.id,loc)):''}</small></div><i class="ti ti-plus apagado"></i></button>`).join(''); }
function estListaRes(nome, loc){ const st = window[nome], el = $('#'+nome+'-res'); if(el) el.innerHTML = estListaResHtml(nome, st.q ? estBuscarNome(st.q, 8) : [], loc); }
function estListaAdd(nome, pid, n=1){ const st = window[nome], i = st.itens.find(x=>x.produto_id===pid); if(i) i.qtd += n; else st.itens.unshift({produto_id:pid, qtd:n}); st.q = ''; render(); setTimeout(()=>$('#'+nome+'-q')?.focus(), 30); }
function estListaCodigo(nome, cod){ const p = estAcharCodigo(cod); if(p){ estBip(true); estListaAdd(nome, p.id); } else { estBip(false); estCameraFechar(); estVincularCodigo(cod, p2=>p2 && estListaAdd(nome, p2.id)); } }
function estListaEnter(ev, nome){
  if(ev.key!=='Enter') return; const st = window[nome], q = st.q.trim(); if(!q) return;
  const p = estAcharCodigo(q); if(p){ estBip(true); return estListaAdd(nome, p.id); }
  const r = estBuscarNome(q, 2); if(r.length===1){ estBip(true); return estListaAdd(nome, r[0].id); }
  if(/^\d{6,14}$/.test(q)){ estBip(false); return estVincularCodigo(q, p2=>p2 && estListaAdd(nome, p2.id)); }
  toast(r.length ? 'Mais de um produto — toque no certo' : 'Nada encontrado', !r.length);
}

/* ═════════ CONTAR (levantamento) ═════════ */
let CNT = null;   // {id, mult, ult:[], fila:[], totais:{}, pessoas:{}, enviando}
const cntChaveFila = id => 'lv_cnt_'+id;
function cntAbertas(){ return (estD().contagens||[]).filter(c=>c.status==='aberta'); }
function cntAbrir(id){
  const fila = LS.get(cntChaveFila(id), []);
  CNT = {id, mult:1, ult:[], fila, totais:{}, pessoas:{}, enviando:false, q:''};
  render(); cntSync(true);
}
function estContar(){
  const ab = cntAbertas();
  if(CNT && !ab.some(c=>c.id===CNT.id)) CNT = null;
  if(!CNT){
    if(!ab.length) return `<div class="cartao pad"><h2 style="margin:0 0 6px;font-size:19px">🔢 Contagem de estoque</h2><p class="suave" style="margin:0">Nenhuma contagem aberta agora. ${estAdmin()?'Abra uma em <b>Contagens</b>.':'Quando a administração abrir o levantamento de um local, ele aparece aqui.'}</p></div>`;
    return `<div class="cartao pad"><h2 style="margin:0 0 10px;font-size:19px">🔢 Escolha a contagem</h2>${ab.map(c=>`<button class="est-ent" onclick="cntAbrir('${c.id}')"><span class="ico"><i class="ti ${estLocalIco(c.local)}"></i></span><div class="cresce"><b>${esc(c.nome)}</b><small>${esc(estLojaNome(c.local))} · aberta ${quando(c.criada_em)} por ${esc(c.criada_por)}</small></div><i class="ti ti-chevron-right apagado"></i></button>`).join('')}</div>`;
  }
  const c = ab.find(x=>x.id===CNT.id), meu = S.adm ? 'Administração' : S.sess?.dados?.colaboradora?.nome;
  const tot = Object.values(CNT.totais).reduce((s,v)=>s+Math.max(0,v),0) + CNT.fila.reduce((s,l)=>s+l.delta,0);
  const prods = new Set([...Object.keys(CNT.totais).filter(k=>CNT.totais[k]>0), ...CNT.fila.map(l=>l.produto_id)]).size;
  const res = CNT.q && !/^\d{6,}$/.test(CNT.q) ? estBuscarNome(CNT.q, 8) : [];
  return `<div class="cartao pad">
    <div class="linha entre quebra" style="gap:8px"><div><h2 style="margin:0;font-size:19px">🔢 ${esc(c.nome)}</h2><small class="suave">${esc(estLojaNome(c.local))} · contando junto: ${Object.keys(CNT.pessoas).map(n=>esc(primeiroNome(n))).join(', ')||'só você'}</small></div>
      <button class="btn p" onclick="CNT=null;render()"><i class="ti ti-arrow-left"></i> Trocar</button></div>
    <div class="cnt-topo"><div><b>${estFmt(tot)}</b><small>peças contadas</small></div><div><b>${prods}</b><small>produtos</small></div><div><b>${estFmt((CNT.pessoas[meu]||0)+CNT.fila.reduce((s,l)=>s+l.delta,0))}</b><small>por você</small></div></div>
    <div class="cnt-scan"><input class="inp" id="cnt-q" placeholder="Bipe o código (ou digite o nome)…" autocomplete="off" value="${esc(CNT.q)}" oninput="CNT.q=this.value;cntRes()" onkeydown="cntEnter(event)">
      <button class="btn ouro" onclick="estCamera(cntCodigo,'Contar pela câmera')"><i class="ti ti-camera"></i> Câmera</button></div>
    <div class="cnt-mult">Cada leitura conta: ${[1,2,3,5,6,10,12,24].map(n=>`<button class="${CNT.mult===n?'on':''}" onclick="CNT.mult=${n};render()">${n}</button>`).join('')}<span class="apagado">(use 12 para uma caixa fechada com 12)</span></div>
    <div class="est-res" id="cnt-res">${cntResHtml(res)}</div>
    <div class="linha entre" style="margin-top:12px"><span class="cnt-sync">${CNT.enviando?'<i class="ti ti-loader-2"></i> enviando…':CNT.fila.length?`<i class="ti ti-cloud-upload" style="color:var(--warn)"></i> ${CNT.fila.length} leitura(s) para enviar`:'<i class="ti ti-cloud-check" style="color:var(--ok)"></i> tudo enviado'}</span>
      ${CNT.fila.length?`<button class="btn p" onclick="cntSync(true)">Enviar agora</button>`:''}</div>
    <div class="cnt-ult">${CNT.ult.slice(0,15).map((u,k)=>{ const p = estProd(u.produto_id); const t = (CNT.totais[u.produto_id]||0) + CNT.fila.filter(l=>l.produto_id===u.produto_id).reduce((s,l)=>s+l.delta,0);
      return `<div class="${k===0?'novo':''}"><span class="q">+${estFmt(u.delta)}</span><div class="nm"><b>${esc(p?.nome||'?')}</b><small>total contado: <b>${estFmt(t)}</b>${u.desfeita?' · desfeita':''}</small></div>${u.desfeita?'':`<button class="btn p" onclick="cntDesfazer(${k})"><i class="ti ti-arrow-back-up"></i></button>`}</div>`; }).join('') || '<p class="suave" style="text-align:center;margin:14px 0 0">Comece a bipar. Cada produto que você ler aparece aqui.</p>'}</div>
  </div>`;
}
function cntResHtml(res){ return res.map(p=>`<button class="est-prod" onclick="cntLer('${p.id}')"><span style="font-size:18px">${emojiDe(p)}</span><div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'')}</small></div><b>+${CNT.mult}</b></button>`).join(''); }
function cntRes(){ const el = $('#cnt-res'); if(el) el.innerHTML = cntResHtml(CNT.q && !/^\d{6,}$/.test(CNT.q) ? estBuscarNome(CNT.q, 8) : []); }
function cntLer(pid, delta){
  const d = delta ?? CNT.mult, l = {uid:estUid(), produto_id:pid, delta:d};
  CNT.fila.push(l); LS.set(cntChaveFila(CNT.id), CNT.fila);
  CNT.ult.unshift({...l}); CNT.ult = CNT.ult.slice(0,30); CNT.q = '';
  estBip(true); render(); setTimeout(()=>$('#cnt-q')?.focus(), 20);
  clearTimeout(window._cntT); window._cntT = setTimeout(()=>cntSync(), CNT.fila.length>=15 ? 50 : 2500);
}
function cntCodigo(cod){ const p = estAcharCodigo(cod); if(p) return cntLer(p.id); estBip(false); estCameraFechar(); estVincularCodigo(cod, p2=>p2 && cntLer(p2.id)); }
function cntEnter(ev){
  if(ev.key!=='Enter') return; const q = CNT.q.trim(); if(!q) return;
  const p = estAcharCodigo(q); if(p) return cntLer(p.id);
  const r = estBuscarNome(q, 2); if(r.length===1) return cntLer(r[0].id);
  if(/^\d{6,14}$/.test(q)){ estBip(false); CNT.q=''; return estVincularCodigo(q, p2=>p2 && cntLer(p2.id)); }
  estBip(false); toast(r.length ? 'Mais de um produto — toque no certo' : 'Não achei "'+q+'"', !r.length);
}
function cntDesfazer(k){ const u = CNT.ult[k]; if(!u || u.desfeita) return; u.desfeita = true; cntLer(u.produto_id, -u.delta); CNT.ult.shift(); }
async function cntSync(forcar){
  if(!CNT || CNT.enviando) return;
  if(!CNT.fila.length && !forcar) return;
  CNT.enviando = true; const lote = CNT.fila.slice(0, 400), id = CNT.id;
  try{
    const r = await estApi(lote.length ? 'contar' : 'contagem', lote.length ? {contagem_id:id, leituras:lote} : {id});
    if(!CNT || CNT.id!==id) return;
    const enviados = new Set(lote.map(l=>l.uid)); CNT.fila = CNT.fila.filter(l=>!enviados.has(l.uid)); LS.set(cntChaveFila(id), CNT.fila);
    CNT.totais = r.contagem.totais||{}; CNT.pessoas = r.contagem.pessoas||{};
  }catch(e){ if(/fechada|não encontrada/.test(e.message)){ toast(e.message, true); LS.del(cntChaveFila(id)); CNT = null; } else if(!erroRede(e)) toast(e.message, true); }
  finally{ if(CNT) CNT.enviando = false; const ativo = document.activeElement?.id; render(); if(ativo) setTimeout(()=>document.getElementById(ativo)?.focus(), 10); if(CNT?.fila.length) setTimeout(()=>cntSync(), 4000); }
}
setInterval(()=>{ if(CNT && document.getElementById('cnt-q') && !CNT.enviando) cntSync(true); }, 20000);   // vê a contagem das colegas

/* ═════════ TRANSFERIR ═════════ */
var TRF = {de:'deposito', para:'bosque', itens:[], q:'', obs:''};
function estTransferir(){
  const em = (estD().transferencias||[]).filter(t=>t.status==='em_transito');
  const minhaLoja = estMinhaLoja(), locais = estLocais();
  const paraMim = em.filter(t=>!minhaLoja || (locais.find(l=>l.id===t.para)||{}).loja===minhaLoja);
  const atalhos = [];
  locais.filter(l=>l.tipo==='deposito').forEach(d=>locais.filter(l=>l.id!==d.id && l.tipo!=='deposito').forEach(p=>atalhos.push([d.id,p.id])));
  const tot = TRF.itens.reduce((s,i)=>s+i.qtd,0), mesmaLoja = (locais.find(l=>l.id===TRF.de)||{}).loja === (locais.find(l=>l.id===TRF.para)||{}).loja;
  return `${paraMim.length?`<div class="cartao pad" style="margin-bottom:14px;border-color:rgba(245,181,36,.6)"><h2 style="margin:0 0 8px;font-size:18px">📦 Chegando para conferir (${paraMim.length})</h2>${paraMim.map(estLinhaTransf).join('')}</div>`:''}
  <div class="cartao pad"><h2 style="margin:0 0 8px;font-size:19px">🔁 Transferir mercadoria</h2>
    <div class="est-atalhos">${atalhos.map(([a,b])=>`<button class="btn ${TRF.de===a&&TRF.para===b?'ouro':'p'}" onclick="TRF.de='${a}';TRF.para='${b}';render()">${esc(estLojaNome(a))} → ${esc(estLojaNome(b))}</button>`).join('')}</div>
    <div class="g2"><div class="campo"><label>Sai de</label>${estChipsLocal(TRF.de, "TRF.de='$ID';render()")}</div><div class="campo"><label>Vai para</label>${estChipsLocal(TRF.para, "TRF.para='$ID';render()")}</div></div>
    ${TRF.de===TRF.para?'<div class="nota warn"><i class="ti ti-alert-triangle"></i><div>Origem e destino iguais.</div></div>':`<p class="suave" style="font-size:13px;margin:0 0 8px">${mesmaLoja?'Mesma loja: entra no destino na hora.':'Entre lojas: sai agora e fica <b>em trânsito</b> até quem recebe conferir lá.'}</p>`}
    ${estListaHtml(TRF, 'TRF', TRF.de)}
    <div class="campo" style="margin-top:12px"><label>Observação</label><input class="inp" value="${esc(TRF.obs)}" placeholder="ex.: levado pela Nayara" oninput="TRF.obs=this.value"></div>
    <button class="btn pri largo" id="btn-trf" ${TRF.itens.length&&TRF.de!==TRF.para?'':'disabled'} onclick="estTransfEnviar()"><i class="ti ti-arrows-exchange"></i> Transferir ${estFmt(tot)} peça(s)</button></div>
  <h2 class="secao">Últimas transferências</h2>${(estD().transferencias||[]).filter(t=>t.status!=='em_transito').slice(0,10).map(estLinhaTransf).join('')||'<p class="suave">Nenhuma ainda.</p>'}`;
}
function estLinhaTransf(t){
  const ico = {em_transito:'🚚', concluida:'✅', recebida:t.divergencias?.length?'⚠️':'✅', cancelada:'🚫'}[t.status]||'•';
  return `<button class="est-ent" onclick="estVerTransf('${t.id}')"><span class="ico">${ico}</span><div class="cresce"><b>${esc(estLojaNome(t.de))} → ${esc(estLojaNome(t.para))}</b>
    <small>${quando(t.criada_em)} · ${esc(primeiroNome(t.por))} · ${estFmt(t.qtd_total)} peças · ${({em_transito:'em trânsito — falta receber',concluida:'concluída',recebida:'recebida por '+primeiroNome(t.recebida_por),cancelada:'cancelada'})[t.status]}${t.divergencias?.length?` · <span style="color:var(--warn)">${t.divergencias.length} diferença(s)</span>`:''}</small></div><i class="ti ti-chevron-right apagado"></i></button>`;
}
async function estTransfEnviar(){
  const b = $('#btn-trf'); b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Gravando…';
  try{ const d = await estApi('transferir', {de:TRF.de, para:TRF.para, itens:TRF.itens, obs:TRF.obs}); estAposSalvar(d);
    toast(d.transfFeita?.status==='em_transito' ? 'Enviada ✔ Fica em trânsito até receberem lá' : 'Transferido ✔'); TRF.itens = []; TRF.obs = ''; render(); }
  catch(e){ toast(e.message, true); render(); }
}
let RCB = null;
function estVerTransf(id){
  const t = (estD().transferencias||[]).find(x=>x.id===id); if(!t) return;
  RCB = {id, q:Object.fromEntries(t.itens.map(i=>[i.produto_id, i.qtd]))};
  const receber = t.status==='em_transito';
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(estLojaNome(t.de))} → ${esc(estLojaNome(t.para))}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px;font-size:14px">${quando(t.criada_em)} · enviada por ${esc(t.por)}${t.obs?' · '+esc(t.obs):''}${t.recebida_por?' · recebida por '+esc(t.recebida_por)+' '+quando(t.recebida_em):''}</p>
      ${receber?'<div class="nota info" style="margin-bottom:10px"><i class="ti ti-checklist"></i><div>Confira o que chegou. Se faltou alguma peça, ajuste o número antes de confirmar.</div></div>':''}
      <div class="tabela"><table><thead><tr><th>Produto</th><th>Enviado</th>${receber?'<th>Chegou</th>':t.divergencias?.length?'<th>Chegou</th>':''}</tr></thead><tbody>
      ${t.itens.map(i=>{ const dv = (t.divergencias||[]).find(x=>x.produto===i.produto); return `<tr><td>${esc(i.produto)}</td><td class="n num">${estFmt(i.qtd)}</td>${receber?`<td><input class="inp num" style="width:80px;padding:6px;text-align:center" inputmode="numeric" value="${i.qtd}" oninput="RCB.q['${i.produto_id}']=estN(this.value)"></td>`:t.divergencias?.length?`<td class="n num" style="${dv?'color:var(--warn)':''}">${estFmt(dv?dv.recebido:i.qtd)}</td>`:''}</tr>`; }).join('')}</tbody></table></div>
      <div class="linha quebra" style="gap:8px;margin-top:12px">${receber?`<button class="btn pri" id="btn-rcb" onclick="estReceberTransf()"><i class="ti ti-check"></i> Confirmar recebimento</button>`:''}
      ${receber && estAdmin()?`<button class="btn" style="color:var(--bad)" onclick="estCancelarTransfUI('${t.id}')"><i class="ti ti-arrow-back-up"></i> Cancelar (volta para a origem)</button>`:''}</div></div></div></div>`;
}
async function estReceberTransf(){
  const b = $('#btn-rcb'); b.disabled = true;
  try{ const d = await estApi('receberTransf', {id:RCB.id, itens:Object.entries(RCB.q).map(([produto_id,qtd])=>({produto_id, qtd}))}); estAposSalvar(d); fecharModal(); render();
    toast(d.transfFeita?.divergencias?.length ? 'Recebida ✔ Diferença registrada' : 'Recebida ✔ Estoque atualizado'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}
async function estCancelarTransfUI(id){
  const motivo = prompt('Motivo do cancelamento? As peças voltam para a origem.'); if(!motivo) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'cancelarTransf', id, motivo}); fecharModal(); render(); toast('Cancelada ✔'); }catch(e){ toast(e.message, true); }
}

/* ═════════ SAÍDA (sem venda) ═════════ */
var SAI = {local:null, motivo:'', itens:[], q:'', obs:''};
function estSaidaTela(){
  if(!SAI.local) SAI.local = estAdmin() ? 'deposito' : estPrateleira(estLojaHoje());
  const motivos = estD().motivos || ['Avaria / quebra','Brinde','Chá de lingerie / evento','Uso interno / mostruário','Devolução ao fornecedor','Perda / sumiu','Troca com cliente','Outro'];
  const tot = SAI.itens.reduce((s,i)=>s+i.qtd,0);
  return `<div class="cartao pad"><h2 style="margin:0 0 4px;font-size:19px">📤 Saída sem venda</h2><p class="suave" style="margin:0 0 12px;font-size:14px">Produto que saiu do estoque sem ser vendido: quebrou, foi brinde, foi para um chá de lingerie, voltou para o fornecedor…</p>
    <div class="campo"><label>De onde saiu</label>${estChipsLocal(SAI.local, "SAI.local='$ID';render()")}</div>
    <div class="campo"><label>Motivo</label><div class="est-lojas">${motivos.map(m=>`<button class="${SAI.motivo===m?'on':''}" onclick="SAI.motivo=${esc(JSON.stringify(m))};render()">${esc(m)}</button>`).join('')}</div></div>
    ${estListaHtml(SAI, 'SAI', SAI.local)}
    <div class="campo" style="margin-top:12px"><label>Observação</label><input class="inp" value="${esc(SAI.obs)}" placeholder="ex.: chá da cliente Ana, 12/11" oninput="SAI.obs=this.value"></div>
    <button class="btn pri largo" id="btn-sai" ${SAI.itens.length&&SAI.motivo?'':'disabled'} onclick="estSaidaEnviar()"><i class="ti ti-package-export"></i> Registrar saída de ${estFmt(tot)} peça(s)</button></div>`;
}
async function estSaidaEnviar(){
  const b = $('#btn-sai'); b.disabled = true;
  try{ const d = await estApi('saida', {local:SAI.local, motivo:SAI.motivo, itens:SAI.itens, obs:SAI.obs}); estAposSalvar(d); SAI.itens = []; SAI.obs = ''; render(); toast('Saída registrada ✔'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}

/* ═════════ REPOSIÇÃO AUTOMÁTICA ═════════
   Para cada prateleira: o que está abaixo do alvo e tem no depósito. Alvo = mínimo cadastrado ou, se não tiver,
   o que vendeu nos últimos 14 dias naquela loja (no mínimo 1: prateleira nunca vazia se tem no depósito). */
function estReposicao(){
  const L = estLocais(), deps = L.filter(l=>l.tipo==='deposito'), prats = L.filter(l=>l.tipo!=='deposito');
  if(!deps.length) return [];
  const vend = {}, desde = new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  (pdvD().vendas||[]).filter(v=>v.status!=='cancelada' && v.data>=desde).forEach(v=>(v.itens||[]).forEach(i=>{ if(i.id){ const k = i.id+'|'+estPrateleira(v.loja); vend[k] = (vend[k]||0)+i.qtd; } }));
  const sal = {}; estD().saldos.forEach(s=>{ sal[s.produto_id+'|'+s.loja] = s; });
  const grupos = [];
  prats.forEach(pr=>{
    const dep = deps.find(d=>d.loja===pr.loja) || deps[0];
    const itens = [];
    pdvD().produtos.forEach(p=>{
      const sd = sal[p.id+'|'+dep.id]; if(!sd || sd.qtd<=0) return;
      const sp = sal[p.id+'|'+pr.id], atual = sp ? sp.qtd : 0;
      const alvo = Math.max(1, sp?.minimo || 0, vend[p.id+'|'+pr.id] || 0);
      if(atual >= alvo) return;
      const q = Math.min(sd.qtd, Math.ceil(alvo - Math.max(0, atual)));
      if(q>0) itens.push({produto_id:p.id, qtd:q, atual, alvo, dep:sd.qtd, vendeu:vend[p.id+'|'+pr.id]||0});
    });
    itens.sort((a,b)=>(a.atual>0)-(b.atual>0) || b.vendeu-a.vendeu);
    if(itens.length) grupos.push({de:dep.id, para:pr.id, itens});
  });
  return grupos;
}
function estRepor(){
  const minha = estMinhaLoja(), G = estReposicao().filter(g=>!minha || (estLocais().find(l=>l.id===g.para)||{}).loja===minha || (estLocais().find(l=>l.id===g.de)||{}).loja===minha);
  if(!estD().saldos.length) return `<div class="cartao pad"><p class="suave" style="margin:0">A reposição aparece depois do levantamento (contagem) do depósito e das prateleiras.</p></div>`;
  if(!G.length) return `<div class="cartao pad"><h2 style="margin:0 0 4px;font-size:19px">✅ Prateleiras abastecidas</h2><p class="suave" style="margin:0">Nada para repor agora com o que tem no depósito.</p></div>`;
  return `<p class="suave" style="margin:0 0 12px;font-size:14px">Calculado sozinho: prateleira vazia ou abaixo do que vende em 14 dias (ou do mínimo cadastrado), e que tem no depósito. Um toque cria a transferência.</p>
    ${G.map((g,gi)=>`<div class="cartao pad rep-grupo"><h3><i class="ti ti-truck"></i> ${esc(estLojaNome(g.de))} → ${esc(estLojaNome(g.para))} <span class="selo">${g.itens.length} produtos · ${estFmt(g.itens.reduce((s,i)=>s+i.qtd,0))} peças</span></h3>
      <div class="tabela"><table><thead><tr><th>Produto</th><th>Prateleira</th><th>Vendeu 14d</th><th>Depósito</th><th>Levar</th></tr></thead><tbody>
      ${g.itens.slice(0,60).map(i=>{ const p = estProd(i.produto_id); return `<tr><td>${emojiDe(p)} ${esc(p.nome)}</td><td class="n num" style="${i.atual<=0?'color:var(--bad)':''}">${estFmt(i.atual)}</td><td class="n num">${i.vendeu||''}</td><td class="n num">${estFmt(i.dep)}</td><td class="n num"><b>${i.qtd}</b></td></tr>`; }).join('')}
      ${g.itens.length>60?`<tr><td colspan="5" class="apagado">… e mais ${g.itens.length-60}</td></tr>`:''}</tbody></table></div>
      <div class="linha quebra" style="gap:8px;margin-top:10px"><button class="btn ouro" onclick="estReporUsar(${gi})"><i class="ti ti-arrows-exchange"></i> Montar transferência com tudo</button>
      <button class="btn p" onclick="estReporCopiar(${gi})"><i class="ti ti-brand-whatsapp"></i> Copiar lista</button></div></div>`).join('')}`;
}
function estReporUsar(gi){ const g = estReposicao()[gi]; TRF.de = g.de; TRF.para = g.para; TRF.itens = g.itens.map(i=>({produto_id:i.produto_id, qtd:i.qtd})); estIr('transferir'); toast('Confira as quantidades e toque em Transferir'); }
function estReporCopiar(gi){ const g = estReposicao()[gi];
  const t = [`*🧺 Reposição — ${estLojaNome(g.de)} → ${estLojaNome(g.para)}*`, '', ...g.itens.map(i=>`• ${i.qtd}x ${estProd(i.produto_id).nome}`), '', `_${g.itens.length} produtos · ${g.itens.reduce((s,i)=>s+i.qtd,0)} peças_`].join('\n');
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Lista copiada ✔')).catch(()=>window.open('https://wa.me/?text='+encodeURIComponent(t))); }

/* ═════════ ADMINISTRAÇÃO › CONTAGENS ═════════ */
var CNA = {local:'deposito', nome:''};
let CNREV = null;
function admContagens(){
  const L = estD().contagens||[], ab = L.filter(c=>c.status==='aberta'), fe = L.filter(c=>c.status!=='aberta');
  const livres = estLocais().filter(l=>!ab.some(c=>c.local===l.id));
  return `<div class="cartao pad" style="margin-bottom:14px"><h2 style="margin:0 0 4px;font-size:19px">🔢 Levantamento / contagem</h2>
      <p class="suave" style="margin:0 0 12px;font-size:14px">Abra a contagem de um local: a equipe conta pelo celular (câmera) ou pelo leitor de código, várias pessoas ao mesmo tempo. Você revisa sistema × contado e fecha — aí o estoque do local vira o número contado. <b>Dica:</b> conte com a loja fechada ou fora do horário de pico.</p>
      ${livres.length?`<div class="campo"><label>Local</label>${estChipsLocal(livres.some(l=>l.id===CNA.local)?CNA.local:livres[0].id, "CNA.local='$ID';render()", l=>livres.includes(l))}</div>
      <div class="cnt-scan"><input class="inp" style="font-size:15px;padding:10px" placeholder="Nome (opcional), ex.: Levantamento outubro" value="${esc(CNA.nome)}" oninput="CNA.nome=this.value"><button class="btn ouro" onclick="admContagemAbrir()"><i class="ti ti-player-play"></i> Abrir contagem</button></div>`
      :'<p class="suave" style="margin:0">Todos os locais já têm contagem aberta.</p>'}</div>
    ${ab.map(c=>`<div class="cartao pad" style="margin-bottom:10px;border-color:rgba(245,181,36,.6)"><div class="linha entre quebra" style="gap:8px"><div><b style="font-size:16px">${esc(c.nome)}</b><br><small class="suave">${esc(estLojaNome(c.local))} · aberta ${quando(c.criada_em)}</small></div>
      <div class="linha quebra" style="gap:6px"><button class="btn" onclick="S.adm.estSub='contar';cntAbrir('${c.id}')"><i class="ti ti-scan"></i> Contar também</button><button class="btn ouro" onclick="admContagemRevisar('${c.id}')"><i class="ti ti-list-check"></i> Revisar e fechar</button></div></div></div>`).join('')}
    <h2 class="secao">Contagens fechadas</h2>
    ${fe.length?`<div class="tabela"><table><thead><tr><th>Contagem</th><th>Local</th><th>Fechada</th><th>Produtos</th><th>Peças</th><th>Sobrou</th><th>Faltou</th></tr></thead><tbody>${fe.map(c=>`<tr style="${c.status==='cancelada'?'opacity:.5':''}"><td>${esc(c.nome)}${c.status==='cancelada'?' (cancelada)':''}</td><td>${esc(estLojaNome(c.local))}</td><td>${quando(c.fechada_em)}</td><td class="n num">${c.resumo?.produtos??''}</td><td class="n num">${c.resumo?.pecas!=null?estFmt(c.resumo.pecas):''}</td><td class="n num pos">${c.resumo?.sobra?'+'+estFmt(c.resumo.sobra):''}</td><td class="n num" style="color:var(--bad)">${c.resumo?.falta?'−'+estFmt(c.resumo.falta):''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="suave">Nenhuma ainda.</p>'}`;
}
async function admContagemAbrir(){
  const livres = estLocais().filter(l=>!(estD().contagens||[]).some(c=>c.status==='aberta' && c.local===l.id));
  const local = livres.some(l=>l.id===CNA.local) ? CNA.local : livres[0]?.id;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'contagemAbrir', local, nome:CNA.nome.trim() || ('Levantamento '+estLojaNome(local)+' · '+ddmm(hojeISO()))}); CNA.nome = ''; render(); toast('Contagem aberta ✔ A equipe já vê no portal'); }
  catch(e){ toast(e.message, true); }
}
async function admContagemRevisar(id){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'contagem', id}); CNREV = {c:r.contagem, zerar:true, f:'dif'}; admContagemModal(); }
  catch(e){ toast(e.message, true); }
}
function admContagemModal(){
  const c = CNREV.c, t = c.totais, sal = {}; estD().saldos.filter(s=>s.loja===c.local).forEach(s=>{ sal[s.produto_id] = s.qtd; });
  const ids = new Set([...Object.keys(t), ...Object.keys(sal).filter(k=>sal[k]!==0)]);
  const linhas = [...ids].map(pid=>({p:estProd(pid), pid, sis:sal[pid]??0, cont:t[pid]})).filter(x=>x.p);
  const naoCont = linhas.filter(x=>x.cont==null && x.sis>0);
  const vis = linhas.filter(x=> CNREV.f==='todos' || (CNREV.f==='dif' && (x.cont??(CNREV.zerar?0:x.sis))!==x.sis) || (CNREV.f==='nao' && x.cont==null && x.sis>0))
    .sort((a,b)=>Math.abs((b.cont??0)-b.sis)-Math.abs((a.cont??0)-a.sis));
  const pecas = Object.values(t).reduce((s,v)=>s+Math.max(0,v),0);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(c.nome)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><div class="cnt-topo"><div><b>${Object.keys(t).filter(k=>t[k]>0).length}</b><small>produtos contados</small></div><div><b>${estFmt(pecas)}</b><small>peças</small></div><div><b>${c.leituras}</b><small>leituras · ${Object.keys(c.pessoas).length} pessoa(s)</small></div></div>
      ${naoCont.length?`<label class="linha" style="gap:10px;align-items:flex-start;margin:4px 0 10px;cursor:pointer"><input type="checkbox" ${CNREV.zerar?'checked':''} onchange="CNREV.zerar=this.checked;admContagemModal()" style="margin-top:4px"><div><b>Zerar os ${naoCont.length} produtos que o sistema tinha e ninguém contou</b><br><span class="suave" style="font-size:13px">Marque se a contagem foi completa (levantamento). Desmarque se foi só uma parte do local.</span></div></label>`:''}
      <div class="est-q">${[['dif','Diferenças'],['nao','Não contados'],['todos','Todos']].map(([k,n])=>`<button class="selo ${CNREV.f===k?'info':''}" style="cursor:pointer;border:0" onclick="CNREV.f='${k}';admContagemModal()">${n}</button>`).join('')}</div>
      <div class="tabela"><table><thead><tr><th>Produto</th><th>Sistema</th><th>Contado</th><th>Fica</th></tr></thead><tbody>
      ${vis.slice(0,250).map(x=>{ const fica = x.cont!=null ? Math.max(0,x.cont) : (CNREV.zerar?0:x.sis), d = fica - x.sis; return `<tr><td>${emojiDe(x.p)} ${esc(x.p.nome)}</td><td class="n num">${estFmt(x.sis)}</td><td class="n num">${x.cont==null?'<span class="apagado">—</span>':estFmt(x.cont)}</td><td class="n num"><b>${estFmt(fica)}</b> ${d?`<small style="color:${d>0?'var(--ok)':'var(--bad)'}">${d>0?'+':''}${estFmt(d)}</small>`:''}</td></tr>`; }).join('') || '<tr><td colspan="4" class="suave">Nada aqui.</td></tr>'}</tbody></table></div>
      <div class="linha quebra" style="gap:8px;margin-top:12px"><button class="btn pri" id="btn-cnf" onclick="admContagemFechar()"><i class="ti ti-lock-check"></i> Fechar e atualizar o estoque</button>
        <button class="btn p" onclick="admContagemCancelar()">Cancelar contagem</button></div></div></div></div>`;
}
async function admContagemFechar(){
  if(!confirm('Fechar a contagem? O estoque de '+estLojaNome(CNREV.c.local)+' passa a ser o número contado.')) return;
  const b = $('#btn-cnf'); b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Atualizando… (pode levar até 1 minuto)';
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'contagemFechar', id:CNREV.c.id, zerar:CNREV.zerar}); LS.del(cntChaveFila(CNREV.c.id)); fecharModal(); render(); try{ chuvaConfete(); }catch(e){} toast('Contagem fechada ✔ Estoque atualizado'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}
async function admContagemCancelar(){
  if(!confirm('Cancelar esta contagem? Nada muda no estoque e as leituras são descartadas.')) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'contagemCancelar', id:CNREV.c.id}); fecharModal(); render(); toast('Contagem cancelada'); }catch(e){ toast(e.message, true); }
}

/* ═════════ HUB (equipe e administração) ═════════ */
function estIr(aba){ if(estAdmin()) S.adm.estSub = aba; else S.estAba = aba; render(); }
function estContadores(){
  const minha = estMinhaLoja(), L = estLocais();
  const chegando = (estD().transferencias||[]).filter(t=>t.status==='em_transito' && (!minha || (L.find(l=>l.id===t.para)||{}).loja===minha)).length;
  const cont = cntAbertas().length;
  const repor = estReposicao().filter(g=>!minha || (L.find(l=>l.id===g.para)||{}).loja===minha).reduce((s,g)=>s+g.itens.length,0);
  return {chegando, cont, repor};
}
function portalEstoque(){
  const k = estContadores(), aba = S.estAba || (k.cont ? 'contar' : 'receber');
  const abas = [['receber','ti-truck-delivery','Receber'],['contar','ti-scan','Contar',k.cont],['transferir','ti-arrows-exchange','Transferir',k.chegando],['repor','ti-basket','Repor',k.repor],['saida','ti-package-export','Saída'],['consulta','ti-search','Consultar']];
  const corpo = ({receber:estTela, contar:estContar, transferir:estTransferir, repor:estRepor, saida:estSaidaTela, consulta:()=>estConsulta().replace('<h2 class="secao">','<h2 class="secao" style="margin-top:0">')})[aba]();
  return `<div class="est-hub">${abas.map(([id,i,n,b])=>`<button class="${aba===id?'on':''}" onclick="S.estAba='${id}';render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>${corpo}`;
}
function admEstoque(){
  const sub = S.adm.estSub || 'saldo', E = estD(), k = estContadores();
  const subs = [['saldo','ti-stack-2','Saldo por local'],['repor','ti-basket','Repor',k.repor],['contagens','ti-scan','Contagens',k.cont],['transferir','ti-arrows-exchange','Transferências',k.chegando],['receber','ti-truck-delivery','Receber'],['saida','ti-package-export','Saída'],['entradas','ti-file-invoice','Entradas'],['movimentos','ti-history','Movimentos'],['importar','ti-file-import','Importar saldo'],['config','ti-settings','Configurar']];
  const corpo = ({saldo:admEstSaldo, repor:estRepor, contagens:admContagens, contar:estContar, transferir:estTransferir, receber:estTela, saida:estSaidaTela, entradas:admEstEntradas, movimentos:admEstMov, importar:admEstImportar, config:admEstConfig})[sub]();
  return `${E.semServidor?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem o estoque.</b> Abra o Apps Script, crie/atualize o arquivo <b>ESTOQUE</b>, cole o código e publique uma nova versão. ${E.erro?'<br>Erro: '+esc(E.erro):''}</div></div>`:''}
    ${!E.semServidor && E.locais===undefined?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-refresh-alert"></i><div><b>Atualize o ESTOQUE.gs no Apps Script</b> (versão com depósito, contagem e transferências) e publique uma nova versão.</div></div>`:''}
    <div class="pdv-sub">${subs.map(([id,i,n,b])=>`<button class="${sub===id||(sub==='contar'&&id==='contagens')?'on':''}" onclick="S.adm.estSub='${id}';render()"><i class="ti ${i}"></i>${n}${b?` <span class="contador">${b}</span>`:''}</button>`).join('')}</div>${corpo}`;
}

/* nome da aba no portal: "Receber" vira "Estoque" (com contador) */
const _telaPortalV10 = telaPortal;
telaPortal = function telaPortal(){
  let h = _telaPortalV10();
  if(S.sess?.dados){ const k = estContadores(), n = k.cont + k.chegando;
    h = h.replace('<i class="ti ti-truck-delivery"></i> Receber </button>', `<i class="ti ti-packages"></i> Estoque ${n?`<span class="contador">${n}</span>`:''}</button>`); }
  return h;
};
const _portalMaisV10 = portalMais;
portalMais = function portalMais(){
  return _portalMaisV10().replace('<b>Receber mercadoria</b><p>Nota do fornecedor → estoque da loja · consultar estoque</p>', '<b>Estoque</b><p>Receber nota · contar · transferir · repor · saída · consultar</p>');
};
const _itensBuscaV10 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV10();
  const ir = (a, adm) => ()=>{ if(adm){ S.adm.tab='estoque'; S.adm.estSub=a; } else { S.tela='portal'; S.portalTab='estoque'; S.estAba=a; } render(); };
  const adm = !!(S.adm && S.tela==='admin');
  if(adm || S.sess) [['Contar estoque','Levantamento com leitor ou câmera','ti-scan', adm?'contagens':'contar'],['Transferir mercadoria','Depósito → prateleira, Bosque → Centro','ti-arrows-exchange','transferir'],['Repor prateleira','Lista automática do que levar do depósito','ti-basket','repor'],['Saída sem venda','Avaria, brinde, chá de lingerie…','ti-package-export','saida']]
    .forEach(([t,s,i,a])=>r.unshift({t, s, i, go:ir(a, adm)}));
  return r;
};

/* ═════════ PDV ligado ao estoque ═════════
   Cada produto mostra quanto tem na prateleira da loja; o código de barras ligado pela equipe também é reconhecido. */
const _pdvPintarGradeV10 = pdvPintarGrade;
pdvPintarGrade = function pdvPintarGrade(reanima){
  _pdvPintarGradeV10(reanima);
  const E = estD(); if(E.semServidor || !E.saldos.length) return;
  const loc = estPrateleira(PDV.loja || estLojaHoje());
  document.querySelectorAll('#pdv-grade .pdv-prod[data-id]').forEach(b=>{
    const q = estQtdDe(b.dataset.id, loc); if(q==null) return;
    const s = document.createElement('span'); s.className = 'est-badge'+(q<=0?' zero':q<=2?' pouco':''); s.textContent = (q<=0 ? 0 : q)+' un';
    const outros = estLocais().filter(l=>l.id!==loc).map(l=>l.nome+': '+estFmt(estQtdDe(b.dataset.id, l.id)??0)).join(' · ');
    b.title = estLojaNome(loc)+': '+q+' · '+outros; b.appendChild(s);
  });
};
const _pdvBuscaV10 = pdvBusca;
pdvBusca = function pdvBusca(ev){
  if(ev.key==='Enter'){
    const q = PDV.q.trim(), ps = pdvD().produtos;
    if(q && !ps.some(p=>(p.codigo && p.codigo===q) || (p.sku && p.sku.toLowerCase()===q.toLowerCase()))){
      const p = estAcharCodigo(q);
      if(p){ pdvAdd(p.id, document.querySelector(`.pdv-prod[data-id="${p.id}"]`)); PDV.q=''; ev.target.value=''; pdvPintarGrade(); return; }
    }
  }
  return _pdvBuscaV10(ev);
};
