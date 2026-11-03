/* ═══════════ v30: ponto pelo celular — QR Code no computador da loja + selfie ═══════════
   • Computador autorizado da loja: a entrada mostra um QR Code que muda a cada 40 s (vale 2 min).
   • Celular da colaboradora: lê o QR (câmera do celular ou "Bater o ponto" no portal), tira a selfie e registra.
     O servidor (PONTOCEL.gs) confere o código e bate o ponto como se fosse no computador daquela loja.
   • Plano B continua: no computador da loja, tocar no nome e digitar o PIN.
   • Liga/desliga em Administração › Regras. Sem o PONTOCEL.gs no servidor, nada muda na tela. */

const PC = { codigo:'', svg:'', quando:0, buscando:false, erro:'', lido:'', ocupado:false, stream:null, camOk:false };
const PC_GIRO_MS = 40000;

/* ───────── utilidades ───────── */
function pcLigado(){ return !!S.boot?.pontoCelular; }
function pcUrl(c){ return location.origin + '/#ponto=' + c; }
function pcFmtCod(c){ return String(c||'').replace(/^(\w{3})(\w+)$/, '$1 $2'); }
function pcDoTexto(t){
  t = String(t||'').trim();
  const m = t.match(/#ponto=([A-Za-z0-9]{4,12})/); if(m) return m[1].toUpperCase();
  const s = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z0-9]{6}$/.test(s) ? s : '';
}
function pcLib(){
  if(window.qrcode) return Promise.resolve();
  return new Promise((ok, erro)=>{ const s = document.createElement('script'); s.src = 'qrcode-generator.js?v=1.4.4'; s.onload = ok; s.onerror = ()=>erro(new Error('Não consegui carregar o gerador de QR Code')); document.head.appendChild(s); });
}

/* ───────── COMPUTADOR DA LOJA: QR Code na entrada ───────── */
function pcAtivoPC(){ return modoLoja() && pcLigado() && S.tela==='inicio' && !S.sess && !S.painelCompleto && S.modoEntrada!=='portal'; }
async function pcBuscarQr(){
  if(PC.buscando || !pcAtivoPC()) return;
  PC.buscando = true;
  try{
    const r = await api('qrPonto', {token:S.aparelho.token});
    if(r.desligado){ S.boot.pontoCelular = false; PC.svg=''; render(); return; }
    await pcLib();
    const q = qrcode(0, 'M'); q.addData(pcUrl(r.codigo)); q.make();
    PC.codigo = r.codigo; PC.svg = q.createSvgTag({cellSize:6, margin:2, scalable:true}); PC.quando = Date.now(); PC.erro = '';
  }catch(e){
    if(/desconhecida/i.test(e.message||'')){ S.boot.pontoCelular = false; render(); return; }   // servidor ainda sem o PONTOCEL.gs
    PC.erro = erroRede(e) ? 'Sem internet — use o PIN aqui no computador' : e.message;
    if(Date.now() - PC.quando > 110000){ PC.svg=''; PC.codigo=''; }                              // código velho não vale mais
  }finally{ PC.buscando = false; }
  pcPintarQr();
}
function pcPintarQr(){
  const q = $('#pc-qr'); if(!q) return;
  q.innerHTML = PC.svg || `<div class="pc-qr-vazio">${PC.erro?`<i class="ti ti-wifi-off"></i><small>${esc(PC.erro)}</small>`:'<span class="gira"></span>'}</div>`;
  q.classList.toggle('pc-velho', !!PC.erro && !!PC.svg);
  const c = $('#pc-cod'); if(c) c.textContent = pcFmtCod(PC.codigo) || '······';
  const b = $('#pc-barra'); if(b && PC.svg && !PC.erro){ const n = b.cloneNode(); n.style.animationDuration = PC_GIRO_MS+'ms'; b.replaceWith(n); }
}
function pcCartaoPC(){
  return `<section class="pc-card" style="--i:2">
    <div class="pc-qr ${PC.erro&&PC.svg?'pc-velho':''}" id="pc-qr">${PC.svg || `<div class="pc-qr-vazio"><span class="gira"></span></div>`}</div>
    <div class="pc-txt"><span class="pc-tag"><i class="ti ti-device-mobile"></i> Ponto pelo celular</span>
      <h3>Aponte a câmera do seu celular aqui</h3>
      <ol><li><b>Abra a câmera</b> do celular e leia o QR Code</li><li>Tire a <b>selfie</b></li><li>Toque em <b>Registrar</b> ✅</li></ol>
      <p>Câmera não leu? No portal, toque em <b>Bater o ponto</b> e digite <b class="num pc-cod" id="pc-cod">${esc(pcFmtCod(PC.codigo)||'······')}</b></p>
      <div class="pc-tempo"><i id="pc-barra" style="animation-duration:${PC_GIRO_MS}ms"></i></div>
      <small class="pc-muda">O código muda sozinho a cada 40 segundos.</small></div></section>`;
}
setInterval(()=>{ if(pcAtivoPC() && document.visibilityState!=='hidden') pcBuscarQr(); }, PC_GIRO_MS);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && pcAtivoPC() && Date.now()-PC.quando > PC_GIRO_MS-2000) pcBuscarQr(); });

/* entrada: cartão do QR (computador) · opção "Bater o ponto" liberada no celular */
const _htmlEntradaV30 = htmlEntrada;
htmlEntrada = function htmlEntrada(){
  let h = _htmlEntradaV30.apply(this, arguments);
  if(!pcLigado()) return h;
  if(modoLoja()){
    if(S.modoEntrada==='portal') return h;
    h = h.replace('<section class="ent-quem"', pcCartaoPC() + '<section class="ent-quem"')
         .replace('<h3>Quem é você?</h3><small>Toque no seu nome e digite o PIN</small>', '<h3>Sem celular?</h3><small>Toque no seu nome e digite o PIN aqui no computador</small>');
    return h;
  }
  // celular / computador pessoal
  h = h.replace(/class="ent-modo ([^"]*)\boff\b([^"]*)"(\s+onclick="entradaModo\('ponto'\)")/, 'class="ent-modo $1$2"$3')
       .replace('<small>Só no computador da loja</small>', '<small>Com o QR Code da loja + selfie</small>');
  if(S.pcModo){
    h = h.replace(/class="ent-modo on ([^"]*)"(\s+onclick="entradaModo\('portal'\)")/, 'class="ent-modo $1"$2')
         .replace(/class="ent-modo ([^"]*)"(\s+onclick="entradaModo\('ponto'\)")/, 'class="ent-modo on $1"$2')
         .replace(/<small>Entrar<\/small>/g, '<small>Bater o ponto</small>');
  }
  return h;
};
const _entradaModoV30 = entradaModo;
entradaModo = function entradaModo(m){
  if(!modoLoja() && pcLigado()){
    if(m==='ponto'){ S.pcModo = true; render(); return; }
    S.pcModo = false;
  }
  return _entradaModoV30.apply(this, arguments);
};
const _entradaPessoaV30 = entradaPessoa;
entradaPessoa = function entradaPessoa(id){
  if(!modoLoja() && pcLigado()) S.pcDepoisLogin = !!S.pcModo;
  return _entradaPessoaV30.apply(this, arguments);
};

/* ───────── CELULAR: tela "Bater o ponto" ───────── */
function pcAbrir(){
  if(!pcLigado()){ toast('O ponto pelo celular está desligado. Bata no computador da loja.', true); return; }
  S.tela = 'pontocel'; render();
}
function pcLerQr(){
  if(typeof estCamera!=='function'){ toast('Digite o código que aparece na tela da loja', true); return; }
  pcPararCam();
  estCamera(cod=>{
    const c = pcDoTexto(cod);
    if(!c){ const st = $('#cam-st'); if(st) st.textContent = 'Esse não é o QR Code do ponto. Aponte para a tela do computador da loja.'; return; }
    estCameraFechar(); PC.lido = c; render();
  }, 'Leia o QR Code da tela da loja');
  setTimeout(()=>{ const st = $('#cam-st'); if(st && /Aponte/.test(st.textContent)) st.textContent = 'Aponte para o QR Code na tela do computador da loja'; }, 900);
}
function pcUsarCodigo(){
  const c = pcDoTexto($('#pc-digita')?.value);
  if(!c){ toast('Digite as 6 letras/números que aparecem na tela da loja', true); return; }
  PC.lido = c; render();
}
async function pcLigarCam(){
  const v = $('#pc-cam'); if(!v) return;
  if(PC.stream){ v.srcObject = PC.stream; try{ await v.play(); }catch(e){} PC.camOk = true; $('#pc-cam-sem')?.remove(); const b0 = $('#pc-btn'); if(b0) b0.disabled = false; return; }
  PC.camOk = false;
  try{
    PC.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user', width:{ideal:640}, height:{ideal:480}}, audio:false});
    const v2 = $('#pc-cam'); if(!v2 || S.tela!=='pontocel'){ pcPararCam(); return; }
    v2.srcObject = PC.stream; await v2.play(); PC.camOk = true;
    $('#pc-cam-sem')?.remove();
    const b = $('#pc-btn'); if(b) b.disabled = false;
  }catch(e){
    const s = $('#pc-cam-sem'); if(s) s.innerHTML = '<i class="ti ti-camera-off"></i><small>Libere a câmera para tirar a selfie<br>(toque no cadeado ao lado do endereço)</small>';
  }
}
function pcPararCam(){ if(PC.stream){ PC.stream.getTracks().forEach(t=>t.stop()); PC.stream = null; } PC.camOk = false; }
function pcFoto(){
  const v = $('#pc-cam'); if(!v || !PC.camOk || !v.videoWidth) return null;
  try{
    const w = 480, h = Math.round(w * v.videoHeight / v.videoWidth), cv = document.createElement('canvas');
    cv.width = w; cv.height = h; cv.getContext('2d').drawImage(v, 0, 0, w, h);
    return {base64: cv.toDataURL('image/jpeg', .72).split(',')[1]};
  }catch(e){ return null; }
}
async function pcBater(campo){
  const s = S.sess; if(PC.ocupado || !s?.dados) return;
  const foto = pcFoto();
  if(!foto){ toast('Tire a selfie: libere a câmera e olhe para ela 📸', true); return; }
  PC.ocupado = true;
  document.querySelectorAll('.pc-acoes button').forEach(b=>b.disabled = true);
  const b = $('#pc-btn'); if(b) b.innerHTML = '<span class="gira"></span> Registrando…';
  $('#pc-flash')?.classList.add('on');
  try{
    const j = await api('baterCel', {eid:s.eid, ...s.cred, campo, codigo:PC.lido, foto});
    const i = s.dados.pontos.findIndex(p=>p.data===j.ponto.data);
    if(i>=0) s.dados.pontos[i] = j.ponto; else s.dados.pontos.push(j.ponto);
    S.ultimo = {campo, hora:j.hora, nome:s.dados.colaboradora.nome, offline:false, foto:true};
    if(!S.aparelho && j.lojaPonto) S.aparelho = {loja:j.lojaPonto, pc30:true};   // só para a tela de sucesso saber a loja (não é computador autorizado)
    PC.lido = ''; pcPararCam(); S.tela = 'sucesso';
  }catch(e){
    if(erroRede(e)) toast('Sem internet. Conecte o celular (Wi-Fi da loja ou dados) ou bata no computador da loja.', true);
    else { if(/QR Code vencido/i.test(e.message)) PC.lido = ''; toast(e.message, true); }
  }
  PC.ocupado = false; render();
}
function telaPontoCel(){
  const s = S.sess, nome = s.dados.colaboradora.nome;
  const r = registroHoje(), prox = proximoCampo(r);
  const bloqueado = r.tipo && r.tipo!=='normal';
  const podeSaida = prox && ['saida_almoco','inicio_pausa','fim_pausa'].includes(prox) && r.entrada;
  const d = agoraServidor(), hh = pad(d.getHours())+':'+pad(d.getMinutes());
  const passo = n => `<span class="pc-passo ${(!PC.lido && n===1) || (PC.lido && n===2) ? 'on' : ''} ${PC.lido && n===1 ? 'ok' : ''}"><i>${PC.lido && n===1 ? '✓' : n}</i>${n===1?'QR Code da loja':'Selfie e registrar'}</span>`;
  let corpo;
  if(bloqueado) corpo = `<div class="nota info"><i class="ti ti-calendar-off"></i><div>Hoje está lançado como <b>${esc(TIPO_NOME[r.tipo])}</b>. Se estiver errado, avise a administração.</div></div>`;
  else if(!prox) corpo = `<div class="nota ok"><i class="ti ti-circle-check"></i><div>Dia encerrado. Você trabalhou <b class="num">${hm(trab(r))}</b> hoje. Bom descanso! ✨</div></div>`;
  else if(!PC.lido) corpo = `
    <button class="pc-scan" onclick="pcLerQr()"><span class="pc-scan-ic"><i class="ti ti-scan"></i></span><b>Ler o QR Code</b><small>Aponte para a tela do computador da loja</small></button>
    <div class="pc-ou"><span>ou digite o código da tela</span></div>
    <div class="g2 pc-digita"><input class="inp num" id="pc-digita" maxlength="7" autocomplete="off" autocapitalize="characters" placeholder="ABC 123" onkeydown="if(event.key==='Enter')pcUsarCodigo()"><button class="btn" onclick="pcUsarCodigo()"><i class="ti ti-arrow-right"></i> Continuar</button></div>`;
  else corpo = `
    <div class="pc-selfie"><video id="pc-cam" muted playsinline></video><div class="pc-cam-sem" id="pc-cam-sem"><span class="gira"></span><small>ligando a câmera…</small></div><i class="pc-flash" id="pc-flash"></i></div>
    <p class="pc-dica">Olhe para a câmera: a selfie confirma que é você 😊</p>
    <div class="pc-acoes">
      <button class="botao-ponto" id="pc-btn" onclick="pcBater('${prox}')" ${PC.camOk?'':'disabled'}><i class="ti ${ICO[prox]}"></i> Registrar ${NOME[prox].toLowerCase()} · <span class="num">${hh}</span></button>
      ${podeSaida?`<button class="btn largo" onclick="pcBater('saida')"><i class="ti ti-logout-2"></i> Registrar saída e encerrar o dia</button>`:''}
    </div>
    <button class="btn p fantasma pc-outro" onclick="PC.lido='';render()"><i class="ti ti-refresh"></i> Ler o QR de novo</button>`;
  return `<div class="wrap pc-wrap">${letreiro()}
    ${btnVoltar('Voltar ao portal')}
    <div class="cartao pad pc-tela">
      <div class="pc-topo"><div><div class="apagado" style="font-size:13.5px;font-weight:600;text-transform:capitalize">${esc(dataLonga(hojeISO()))}</div>
        <div class="ola">Oi, ${esc(primeiroNome(nome))}!</div></div><div class="relogio"><b id="clk" class="num">${hh}</b></div></div>
      ${!bloqueado && prox ? `<div class="pc-passos">${passo(1)}${passo(2)}</div>` : ''}
      <div class="hoje-grade pc-grade">${CAMPOS.map(k=>`<div class="vaga ${r[k]?'feita':''} ${k===prox&&!bloqueado?'proxima':''}"><small>${CURTO[k]}</small><b class="num">${r[k]||'--:--'}</b></div>`).join('')}</div>
      <div class="pc-corpo">${corpo}</div>
      <p class="apagado pc-rod">A hora é a do servidor. O ponto só vale lido na loja: o QR Code muda a cada 40 segundos.</p>
    </div></div>`;
}

/* ───────── atalho no Início do portal ───────── */
function pcAtalhoInicio(){
  if(modoLoja() || !pcLigado() || !S.sess?.dados) return '';
  const r = registroHoje(), prox = proximoCampo(r), bloq = r.tipo && r.tipo!=='normal';
  const sub = bloq ? 'Hoje: '+(TIPO_NOME[r.tipo]||r.tipo) : prox ? 'Próximo: '+NOME[prox].toLowerCase() : 'Dia encerrado ✓';
  return `<button class="pc-atalho ${prox&&!bloq?'':'feito'}" onclick="pcAbrir()"><span class="pc-atalho-ic"><i class="ti ti-fingerprint"></i></span><span class="cresce"><b>Bater o ponto</b><small>${esc(sub)} · QR Code da loja + selfie</small></span><i class="ti ti-chevron-right"></i></button>`;
}
const _portalInicioV30 = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioV30.apply(this, arguments), a = pcAtalhoInicio();
  if(!a) return h;
  const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
  return f >= 0 ? h.slice(0, f+6) + a + h.slice(f+6) : a + h;
};

/* ───────── navegação ───────── */
const _renderV30 = render;
render = function render(){
  if(S.tela!=='sucesso' && S.aparelho?.pc30) S.aparelho = null;
  if(S.tela==='portal' && S.pcDepoisLogin && S.sess?.dados && !modoLoja()){ S.pcDepoisLogin = false; S.pcModo = false; S.tela = 'pontocel'; }
  if(S.tela!=='inicio') S.pcModo = false;
  if(S.tela!=='pontocel') pcPararCam();
  if(S.tela==='pontocel'){
    if(!S.sess?.dados || modoLoja()){ S.tela = S.sess?.dados ? 'portal' : 'inicio'; return render(); }
    clearTimeout(timerVolta); pararCamera();
    const app = $('#app'); app.classList.remove('com-menu','adm','port'); app.querySelector(':scope > .menu')?.remove();
    app.innerHTML = telaPontoCel(); tickRelogio();
    try{ if(!history.state || history.state.lv!=='pontocel') history.pushState({lv:'pontocel'}, ''); }catch(e){}
    if(PC.lido) pcLigarCam();
    return;
  }
  if(S.tela==='admin') pcPatchRegras();
  const r = _renderV30.apply(this, arguments);
  if(pcAtivoPC() && Date.now()-PC.quando > PC_GIRO_MS-2000) pcBuscarQr();
  return r;
};
const _voltarV30 = voltar;
voltar = function voltar(){
  if(S.tela==='pontocel' && !modalAberto()){ pcPararCam(); S.tela = 'portal'; S.portalTab = 'inicio'; render(); return; }
  if(S.tela==='pontocel' && modalAberto() && typeof estCameraFechar==='function') estCameraFechar();
  return _voltarV30.apply(this, arguments);
};

/* ───────── link do QR (câmera nativa do celular abre equipe…/#ponto=ABC123) ───────── */
function pcDoLink(){
  const c = pcDoTexto(location.hash.startsWith('#ponto=') ? location.hash : '');
  if(!c) return false;
  PC.lido = c;
  try{ history.replaceState(history.state, '', location.pathname + location.search); }catch(e){}
  return true;
}
pcDoLink();
function pcSeguirLink(){
  if(!PC.lido) return;
  if(modoLoja() || !pcLigado()){ PC.lido = ''; return; }
  if(S.sess?.dados){ if(S.tela!=='pontocel'){ S.tela = 'pontocel'; render(); } }
  else if(S.tela==='inicio'){ S.pcModo = true; S.modoEntrada = 'portal'; render(); toast('📱 Toque no seu nome e digite o PIN para bater o ponto'); }
}
window.addEventListener('hashchange', ()=>{ if(pcDoLink() && S.boot) pcSeguirLink(); });   // app já aberto (ex.: instalado no celular)
const _carregarV30 = carregar;
carregar = async function carregar(){
  const r = await _carregarV30.apply(this, arguments);
  pcSeguirLink();
  return r;
};

/* ───────── Administração › Regras: liga/desliga ───────── */
function pcPatchRegras(){                       // admRegras mora no app4.js, que carrega depois deste arquivo
  if(window._pcRegras || typeof admRegras!=='function') return; window._pcRegras = true;
  const base = admRegras;
  admRegras = function admRegras(){
    const h = base.apply(this, arguments), d = S.adm?.dados || {};
    if(!('pontoCelular' in d)) return h;
    const marca = 'Tirar foto a cada marcação</label>', i = h.indexOf(marca);
    if(i < 0) return h;
    const add = `<label class="linha" style="font-weight:700"><input type="checkbox" id="cf-pontocel" ${d.pontoCelular?'checked':''} onchange="pcAdmLigar(this.checked)" style="width:18px;height:18px"> Ponto pelo celular (QR Code da loja + selfie)</label>`;
    return h.slice(0, i+marca.length) + add + h.slice(i+marca.length);
  };
}
document.addEventListener('DOMContentLoaded', pcPatchRegras);
async function pcAdmLigar(v){
  try{
    S.adm.dados = await api('admPontoCel', {...S.adm.cred, valor: v ? 'SIM' : 'NÃO'});
    if(S.boot) S.boot.pontoCelular = v;
    toast(v ? 'Ponto pelo celular ligado ✔ O QR Code aparece no computador da loja' : 'Ponto pelo celular desligado');
    render();
  }catch(e){ toast(e.message, true); const c = $('#cf-pontocel'); if(c) c.checked = !v; }
}

/* ───────── visual ───────── */
document.head.insertAdjacentHTML('beforeend', `<style>
.pc-card{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;margin-top:22px;padding:20px;border-radius:24px;background:#fff;border:1.5px solid var(--vermelho);box-shadow:0 18px 40px -22px rgba(227,16,31,.55);position:relative;overflow:hidden;animation:entraBloco .6s var(--suave,ease) both}
.pc-card::before{content:'';position:absolute;inset:0;background:radial-gradient(420px 220px at 0 0,rgba(227,16,31,.08),transparent 70%);pointer-events:none}
.pc-qr{width:230px;height:230px;border-radius:18px;background:#fff;padding:8px;box-shadow:inset 0 0 0 2px var(--linha);display:flex;align-items:center;justify-content:center;position:relative;transition:opacity .3s,filter .3s}
.pc-qr svg{width:100%;height:100%;display:block;animation:pcSurge .45s var(--mola,ease)}
.pc-qr.pc-velho{opacity:.35;filter:grayscale(1)}
.pc-qr-vazio{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--creme3);text-align:center;font-size:13px}.pc-qr-vazio i{font-size:30px}
.pc-txt{position:relative}
.pc-tag{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--vermelho);background:var(--vermelho-claro,rgba(227,16,31,.1));padding:5px 11px;border-radius:99px}
.pc-txt h3{font-size:clamp(20px,2.6vw,26px);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin:10px 0 8px}
.pc-txt ol{margin:0 0 10px 20px;font-size:15px;line-height:1.6}
.pc-txt p{font-size:13.5px;color:var(--creme2)}
.pc-cod{font-size:17px;color:var(--creme);letter-spacing:.08em;background:var(--noite);padding:2px 9px;border-radius:8px;white-space:nowrap}
.pc-tempo{height:6px;border-radius:99px;background:var(--noite);overflow:hidden;margin-top:12px}
.pc-tempo i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--vermelho),var(--dourado));border-radius:99px;transform-origin:left;animation:pcTempo linear both}
.pc-muda{display:block;font-size:12px;color:var(--creme3);margin-top:5px}
@keyframes pcTempo{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes pcSurge{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}
@media (max-width:760px){.pc-card{grid-template-columns:1fr;justify-items:center;text-align:center}.pc-txt ol{text-align:left}}

.pc-wrap{max-width:560px}
.pc-tela{position:relative}
.pc-topo{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pc-topo .relogio b{font-size:28px}
.pc-passos{display:flex;gap:8px;margin:14px 0 4px}
.pc-passo{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--creme3);padding:8px 10px;border-radius:14px;background:var(--noite);transition:background .3s,color .3s}
.pc-passo i{font-style:normal;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--linha2);font-size:12.5px;flex-shrink:0}
.pc-passo.on{background:var(--vermelho-claro,rgba(227,16,31,.1));color:var(--vermelho)}.pc-passo.on i{background:var(--vermelho);color:#fff}
.pc-passo.ok{color:var(--ok)}.pc-passo.ok i{background:var(--ok);color:#fff}
.pc-grade{margin-top:12px}
.pc-corpo{margin-top:14px}
.pc-scan{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;padding:26px 16px 22px;border-radius:22px;background:linear-gradient(130deg,#C10A18,var(--vermelho) 55%,#F0262F);color:#fff;box-shadow:0 16px 34px -16px rgba(227,16,31,.75);transition:transform .25s var(--mola,ease)}
.pc-scan:active{transform:scale(.97)}
.pc-scan-ic{width:74px;height:74px;border-radius:22px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:42px;animation:pcPulsa 2s infinite}
.pc-scan b{font-size:20px}.pc-scan small{opacity:.85;font-size:13.5px}
@keyframes pcPulsa{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.45)}60%{box-shadow:0 0 0 14px rgba(255,255,255,0)}}
.pc-ou{display:flex;align-items:center;gap:10px;margin:16px 0 10px;color:var(--creme3);font-size:12.5px;font-weight:700}
.pc-ou::before,.pc-ou::after{content:'';flex:1;height:1px;background:var(--linha2)}
.pc-digita input{text-transform:uppercase;letter-spacing:.12em;font-size:18px;text-align:center}
.pc-selfie{position:relative;width:min(210px,56vw);aspect-ratio:1;margin:0 auto;border-radius:50%;overflow:hidden;background:var(--noite);box-shadow:0 0 0 4px #fff,0 0 0 7px var(--vermelho),0 18px 40px -18px rgba(0,0,0,.4)}
.pc-selfie video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.pc-cam-sem{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--creme3);font-size:13px;padding:24px}.pc-cam-sem i{font-size:30px}
.pc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.pc-flash.on{animation:pcFlash .5s ease}
@keyframes pcFlash{0%{opacity:.9}100%{opacity:0}}
.pc-dica{text-align:center;font-size:13.5px;color:var(--creme2);margin:12px 0 14px}
.pc-acoes{display:flex;flex-direction:column;gap:10px}
.pc-acoes .botao-ponto[disabled]{opacity:.55}
.pc-outro{display:flex;margin:10px auto 0}
.pc-rod{font-size:12.5px;text-align:center;margin-top:14px}
.pc-atalho{width:100%;display:flex;align-items:center;gap:14px;text-align:left;margin:12px 0 4px;padding:14px 16px;border-radius:20px;background:linear-gradient(130deg,#C10A18,var(--vermelho) 55%,#F0262F);color:#fff;box-shadow:0 14px 30px -16px rgba(227,16,31,.75);transition:transform .25s var(--mola,ease),box-shadow .25s}
.pc-atalho:hover{transform:translateY(-2px)}.pc-atalho:active{transform:scale(.98)}
.pc-atalho b{display:block;font-size:17px}.pc-atalho small{display:block;font-size:12.5px;opacity:.85}
.pc-atalho-ic{width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;animation:pcPulsa 2.4s infinite}
.pc-atalho>.ti-chevron-right{font-size:22px;transition:transform .25s}.pc-atalho:hover>.ti-chevron-right{transform:translateX(4px)}
.pc-atalho.feito{background:#fff;color:var(--creme);border:1.5px solid var(--linha);box-shadow:var(--sh)}
.pc-atalho.feito .pc-atalho-ic{background:var(--ok-bg);color:var(--ok);animation:none}
</style>`);
