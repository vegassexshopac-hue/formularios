/* ═══════════════════════════════════════════════════════════
   LAS VEGAS · Portal da Equipe + Cartão de Ponto
   Modo loja (computador autorizado): bater ponto com foto.
   Portal (celular / qualquer lugar): meu mês, pedidos, agenda, avisos.
   Administração: pedidos, hoje, espelho, banco, agenda, equipe, aparelhos, regras.
   ═══════════════════════════════════════════════════════════ */

const API_FIXO = 'https://script.google.com/macros/s/AKfycbw_rhPwaL7Xj-Bxcc5QiLUR2kbrNy8KDdUh7V58mi0FM9UUjE32WbAcTSEuUlfeMmpX/exec';
const PIN_SALT = 'lv-jornada-bosque-2026';
const LOGO = 'data:image/png;base64,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';
const EMPRESA = {nome:'Las Vegas Sex Shop', cnpj:'47.100.282/0001-62'};
const CAMPOS = ['entrada','saida_almoco','volta_almoco','inicio_pausa','fim_pausa','saida'];
const NOME = {entrada:'Entrada',saida_almoco:'Saída para o almoço',volta_almoco:'Volta do almoço',inicio_pausa:'Início da pausa',fim_pausa:'Fim da pausa',saida:'Saída'};
const CURTO = {entrada:'Entrada',saida_almoco:'Almoço',volta_almoco:'Volta',inicio_pausa:'Pausa',fim_pausa:'Fim pausa',saida:'Saída'};
const ICO = {entrada:'ti-login-2',saida_almoco:'ti-tools-kitchen-2',volta_almoco:'ti-arrow-back-up',inicio_pausa:'ti-coffee',fim_pausa:'ti-player-play',saida:'ti-logout-2'};
const TIPO_NOME = {normal:'Normal',folga:'Folga (banco)',atestado:'Atestado',ferias:'Férias',abono:'Abonado',falta:'Falta'};
const TIPO_EV = {cha:{n:'Chá de lingerie',e:'💝'}, campanha:{n:'Campanha',e:'📣'}, evento:{n:'Evento',e:'🎉'}, reuniao:{n:'Reunião',e:'👥'}, aviso:{n:'Aviso',e:'📌'}};
const TIPO_AUS = {folga:{n:'Folga',e:'🌴'}, ausente:{n:'Ausente',e:'•'}, atestado:{n:'Atestado',e:'🩺'}, ferias:{n:'Férias',e:'✈️'}};

/* ──────────── utilidades ──────────── */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k, d=null){ try{ const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const toM = t => { if(!t) return null; const [h,m] = String(t).split(':').map(Number); return h*60+m; };
const hm = (m, sinal=false) => {
  if(m==null || isNaN(m)) return '--:--';
  const s = m<0 ? '-' : (sinal && m>0 ? '+' : '');
  const a = Math.abs(Math.round(m));
  return s + String(Math.floor(a/60)).padStart(2,'0') + ':' + String(a%60).padStart(2,'0');
};
const pad = n => String(n).padStart(2,'0');
const isoD = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const dt = s => new Date(s+'T12:00:00');
const dow = s => dt(s).getDay();
const addDays = (s, n) => { const d = dt(s); d.setDate(d.getDate()+n); return isoD(d); };
const diasDoMes = ym => { const [y,m] = ym.split('-').map(Number); const n = new Date(y,m,0).getDate(); return Array.from({length:n},(_,i)=>`${ym}-${pad(i+1)}`); };
const nomeMes = ym => { const s = dt(ym+'-15').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}); return s[0].toUpperCase()+s.slice(1); };
const ddmm = s => s.slice(8,10)+'/'+s.slice(5,7);
const semana = s => dt(s).toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');
const dataLonga = s => { const x = dt(s).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}); return x[0].toUpperCase()+x.slice(1); };
const primeiroNome = n => String(n||'').split(' ')[0];
const iniciais = n => String(n||'?').split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const mesDe = s => s.slice(0,7);
const mesAdd = (ym, n) => { const [y,m] = ym.split('-').map(Number); const d = new Date(y, m-1+n, 15); return d.getFullYear()+'-'+pad(d.getMonth()+1); };
const brl = n => 'R$ ' + (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:0, maximumFractionDigits:0});
const brl2 = n => 'R$ ' + (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
const TURNO_NOME = {abertura:'Abertura', fechamento:'Fechamento', dia:'Dia todo'};
const fmtTel = t => { t = String(t||'').replace(/\D/g,''); if(t.length===11) return `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`; if(t.length===13) return `+${t.slice(0,2)} (${t.slice(2,4)}) ${t.slice(4,9)}-${t.slice(9)}`; return t; };
const telWa = t => { t = String(t||'').replace(/\D/g,''); if(!t) return ''; return t.length<=11 ? '55'+t : t; };
async function sha256(txt){
  if(!window.crypto?.subtle) return null;
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function credencial(campo, pin){ const h = await sha256(PIN_SALT+':'+pin); return h ? {[campo+'Hash']:h} : {[campo]:pin}; }

function toast(msg, ruim=false){
  const t = document.createElement('div'); t.className = 'toast'+(ruim?' bad':''); t.textContent = msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), ruim ? 4500 : 2600);
}

/* ──────────── estado ──────────── */
const S = {
  api: LS.get('lv_api_teste','') || API_FIXO || LS.get('lv_api',''),
  boot: null,
  aparelho: LS.get('lv_aparelho', null),   // {token, nome, loja} — só no computador autorizado da loja
  tela: 'inicio',                            // inicio | bater | sucesso | portal | admin | config
  sess: null,                                // {eid, cred, dados}
  portalTab: 'inicio', portalMes: null,
  adm: null,
  pin: null,
  ocupado: false,
  offset: 0,
  fila: LS.get('lv_fila', []).map(f=>{ const {pin, pinHash, ...r} = f; r.uid = r.uid || ('F'+Date.now()+Math.floor(Math.random()*1e4)); return r; }),   // limpa PIN de filas antigas
  primeiraVez: true,
};
let timerVolta = null;
const modoLoja = () => !!(S.aparelho && S.aparelho.token);

/* ──────────── servidor ──────────── */
async function api(a, dados={}){
  if(!S.api) throw new Error('Link do servidor não configurado');
  const r = await fetch(S.api, {method:'POST', body: JSON.stringify({a, ...dados})});
  const j = await r.json();
  if(!j.ok) throw new Error(j.erro || 'Erro no servidor');
  return j;
}
function erroRede(e){ return e && (e.name==='TypeError' || /fetch|network|Failed/i.test(e.message||'')); }

async function carregar(){
  if(!S.api){ S.tela='config'; render(); return; }
  try{
    S.boot = await api('boot');
    LS.set('lv_boot', S.boot);
    const servidor = toM(S.boot.hora), local = new Date().getHours()*60+new Date().getMinutes();
    S.offset = (S.boot.hoje === isoD(new Date())) ? servidor - local : 0;
    if(S.aparelho){ try{ const r = await api('aparelho', {token:S.aparelho.token}); if(!r.aparelho){ S.aparelho=null; LS.del('lv_aparelho'); toast('Este computador não está mais autorizado a bater ponto.', true); } else { S.aparelho = {...S.aparelho, ...r.aparelho}; LS.set('lv_aparelho', S.aparelho); } }catch(e){} }
  }catch(e){
    S.boot = LS.get('lv_boot', null);
    if(!S.boot){ render(); toast('Não consegui falar com o servidor: '+e.message, true); return; }
    toast('Sem conexão — mostrando os dados guardados', true);
  }
  render(); enviarFila();
}

/* ──────────── regras (7h20 · folga 8h · ter–sex) ──────────── */
function trab(r){
  if(!r || !r.entrada || !r.saida) return null;
  let t = toM(r.saida) - toM(r.entrada);
  if(r.saida_almoco && r.volta_almoco) t -= toM(r.volta_almoco) - toM(r.saida_almoco);
  if(r.inicio_pausa && r.fim_pausa) t -= toM(r.fim_pausa) - toM(r.inicio_pausa);
  return Math.max(0, t);
}
function hojeISO(){ return S.boot?.hoje && S.boot.hoje >= isoD(new Date()) ? S.boot.hoje : isoD(new Date()); }
function analisaDia(colab, data, r, regras, anterior){
  const hoje = hojeISO(), w = dow(data), feriado = regras.feriados.includes(data);
  const inicio = [regras.inicio_banco, colab.admissao||''].sort().pop();
  const conta = data >= inicio;
  const previsto = (w!==0 && !feriado) ? regras.jornada_min : 0;
  const tipo = (r && r.tipo) || 'normal';
  const o = {data, r, tipo, previsto:0, trabalhado:0, saldo:0, flags:[], conta, feriado, domingo:w===0, futuro:data>hoje, hoje:data===hoje};
  if(data > hoje && tipo==='normal') return o;
  if(['atestado','ferias','abono'].includes(tipo)){ o.previsto=previsto; o.trabalhado=previsto; o.flags.push({n:TIPO_NOME[tipo], c:'info'}); }
  else if(tipo==='folga'){ o.previsto=previsto; o.saldo=-regras.folga_min; o.flags.push({n:'Folga do banco −'+hm(regras.folga_min), c:'info'}); }
  else if(tipo==='falta'){ o.previsto=previsto; o.flags.push({n:'Falta', c:'bad'}); }
  else {
    const t = trab(r);
    const temAlgo = r && CAMPOS.some(k=>r[k]);
    if(!temAlgo){
      if(previsto && data < hoje && conta){ o.previsto=previsto; o.saldo=-previsto; o.flags.push({n:'Sem marcação', c:'bad', pend:true}); }
    } else if(t==null){
      o.previsto = previsto;
      if(data < hoje) o.flags.push({n:'Falta marcar '+(!r.entrada?'entrada':'saída'), c:'bad', pend:true});
      else o.flags.push({n:'Em andamento', c:'ok'});
    } else {
      o.previsto = previsto; o.trabalhado = t;
      let s = t - previsto;
      if(previsto && Math.abs(s) <= regras.tolerancia_min) s = 0;
      o.saldo = s;
      if(!previsto) o.flags.push({n: feriado?'Trabalhou no feriado':'Trabalhou no domingo', c:'warn'});
      if((r.saida_almoco && !r.volta_almoco) || (!r.saida_almoco && r.volta_almoco)) o.flags.push({n:'Almoço incompleto', c:'bad', pend:true});
      if((r.inicio_pausa && !r.fim_pausa) || (!r.inicio_pausa && r.fim_pausa)) o.flags.push({n:'Pausa incompleta', c:'warn'});
      const alm = (r.saida_almoco && r.volta_almoco) ? toM(r.volta_almoco)-toM(r.saida_almoco) : 0;
      if(t > 360 && alm < 55) o.flags.push({n: alm ? 'Almoço de '+alm+' min' : 'Sem almoço', c:'warn'});
      if(t > 600) o.flags.push({n:'Mais de 10h', c:'warn'});
      if(t < 240 && previsto) o.flags.push({n:'Menos de 4h', c:'bad', pend:true});
      if(anterior && anterior.saida && r.entrada && addDays(anterior.data,1)===data){
        const inter = (24*60 - toM(anterior.saida)) + toM(r.entrada);
        if(inter < 660) o.flags.push({n:'Descanso de '+hm(inter)+' (menos de 11h)', c:'warn'});
      }
    }
  }
  if(!conta) o.saldo = 0;
  return o;
}
function mapaPontos(pontos, eid){ const m = {}; pontos.filter(p=>p.colaboradora_id===eid).forEach(p=>{ m[p.data]=p; }); return m; }
function resumoMes(colab, ym, mapa, regras){
  const dias = diasDoMes(ym).map(d => analisaDia(colab, d, mapa[d], regras, mapa[addDays(d,-1)]));
  const t = {trabalhado:0, previsto:0, saldo:0, faltas:0, atestados:0, folgas:0, pend:0, alertas:0, dias};
  dias.forEach(x=>{
    if(!x.conta) return;
    t.trabalhado += x.trabalhado; t.previsto += x.previsto; t.saldo += x.saldo;
    if(x.tipo==='falta') t.faltas++; if(x.tipo==='atestado') t.atestados++; if(x.tipo==='folga') t.folgas++;
    x.flags.forEach(f=>{ if(f.pend) t.pend++; else if(f.c==='warn') t.alertas++; });
  });
  return t;
}
function bancoTotal(colab, mapa, regras){
  let ym = mesDe(regras.inicio_banco), fim = mesDe(hojeISO()), soma = Number(colab.saldo_inicial_min||0), seg=0;
  while(ym <= fim && seg++ < 36){ soma += resumoMes(colab, ym, mapa, regras).saldo; ym = mesAdd(ym,1); }
  const futuras = Object.values(mapa).filter(p=>p.tipo==='folga' && p.data > hojeISO()).map(p=>p.data).sort();
  return {saldo: soma, folgasDisp: soma>0 ? Math.floor(soma/regras.folga_min) : 0, proximas: futuras, folgasMarcadas: futuras.length};
}

/* ──────────── fila offline (só no computador autorizado) ──────────── */
/* A fila guardada no computador NUNCA leva o PIN (nem o hash): a credencial fica só na memória desta aba.
   Se a página recarregar antes de enviar, a marcação espera a colaboradora digitar o PIN de novo (aí vai). */
const FILA_CRED = {};
function salvarFila(){ LS.set('lv_fila', S.fila.map(f=>{ const {pin, pinHash, ...resto} = f; return resto; })); }
function emprestarCredFila(eid, cred){ S.fila.forEach(f=>{ if(f.eid===eid && !FILA_CRED[f.uid]) FILA_CRED[f.uid]=cred; }); }
let filaEnviando = false;
async function enviarFila(){
  if(!S.fila.length || !navigator.onLine || filaEnviando) return;
  filaEnviando = true;
  const resta = []; let semPin = 0;
  try{
    for(const f of S.fila){
      const cred = FILA_CRED[f.uid];
      if(!cred){ resta.push(f); semPin++; continue; }
      try{ await api('bater', {...f, ...cred, token:S.aparelho?.token}); delete FILA_CRED[f.uid]; }
      catch(e){ if(erroRede(e)) resta.push(f); else toast('Marcação sem internet de '+f.nome+' recusada: '+e.message, true); }
    }
  } finally { filaEnviando = false; }
  const enviadas = S.fila.length - resta.length;
  S.fila = resta; salvarFila();
  if(enviadas) toast(enviadas+' marcação(ões) feitas sem internet foram enviadas ✔');
  if(semPin && navigator.onLine && !S.filaAvisou){ S.filaAvisou = true; toast(semPin+' marcação(ões) guardada(s) aguardam a colaboradora digitar o PIN para serem enviadas.'); }
  if(S.tela==='inicio') render();
}
window.addEventListener('online', enviarFila);
setInterval(enviarFila, 60000);

/* ──────────── render / navegação ──────────── */
function render(){
  clearTimeout(timerVolta);
  pararCamera();
  const app = $('#app');
  if(S.tela==='config'){ app.innerHTML = telaConfig(); return; }
  if(!S.boot){ app.innerHTML = `<div class="wrap">${letreiro()}<div class="nota bad"><i class="ti ti-wifi-off"></i><div>Não consegui carregar. Confira a internet e <button class="btn p" onclick="carregar()">tente de novo</button></div></div></div>`; return; }
  if(S.tela==='admin') app.innerHTML = telaAdmin();
  else if(S.tela==='portal') app.innerHTML = telaPortal();
  else if(S.tela==='bater'){ app.innerHTML = telaBater(); iniciarCamera(); }
  else if(S.tela==='sucesso'){ app.innerHTML = telaSucesso(); if(!(S.ultimo?.campo==='saida' && S.sess?.dados)) timerVolta = setTimeout(sair, 7000); }   // na saída do dia a tela fica 90 s (telaSucesso arma)
  else app.innerHTML = telaInicio();
  tickRelogio();
  try{ if(S.tela!=='inicio' && (!history.state || history.state.lv!==S.tela)) history.pushState({lv:S.tela}, ''); }catch(e){}
  S.primeiraVez = false;
}
function modalAberto(){ return !!$('#modal').innerHTML.trim(); }
function fecharModal(){ PED=null; ED=null; EC=null; EV=null; AP=null; VD=null; SG=null; S.pin=null; $('#modal').innerHTML=''; }
function voltar(){
  if(modalAberto()){ fecharModal(); return; }
  if(S.tela==='portal' && modoLoja()){ S.tela='bater'; render(); return; }
  if(S.tela==='portal' || S.tela==='bater' || S.tela==='sucesso'){ sair(); return; }
  if(S.tela==='admin'){ S.adm=null; S.tela='inicio'; render(); return; }
  if(S.tela==='config'){ S.tela='inicio'; render(); }
}
window.addEventListener('popstate', ()=>{
  const tinhaModal = modalAberto();
  voltar();
  try{ if(tinhaModal || S.tela!=='inicio') history.pushState({lv:S.tela}, ''); }catch(e){}
});
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && !S.pin && modalAberto()) fecharModal(); });
const btnVoltar = (txt='Voltar') => `<button class="voltar" onclick="voltar()"><i class="ti ti-arrow-left"></i> ${txt}</button>`;

function letreiro(direita=''){
  const bulbos = []; const n = 34;
  for(let i=0;i<n;i++){ // ao redor do cartão: topo, direita, base, esquerda
    const t = i/n; let x, y;
    if(t<.4){ x = t/.4*100; y = 0; } else if(t<.5){ x=100; y=(t-.4)/.1*100; } else if(t<.9){ x=100-(t-.5)/.4*100; y=100; } else { x=0; y=100-(t-.9)/.1*100; }
    bulbos.push(`<i style="--i:${i};left:calc(${x}% - 4px);top:calc(${y}% - 4px)"></i>`);
  }
  return `<div class="letreiro"><div class="lampadas ${S.primeiraVez?'correndo':''}">${bulbos.join('')}</div>
    <img src="${LOGO}" alt="Las Vegas">
    <div><h1>${modoLoja()?'Cartão de Ponto':'Portal da Equipe'}</h1><div class="sub">${modoLoja()?'Loja '+esc(S.boot?.lojas?.[S.aparelho.loja]?.nome||S.aparelho.loja):'Las Vegas Sex Shop'}</div></div>
    ${direita || `<div class="relogio"><b id="clk" class="num">--:--</b><span id="clkd"></span></div>`}
  </div>`;
}
function agoraServidor(){ return new Date(Date.now() + S.offset*60000); }
function tickRelogio(){
  const c = $('#clk'); if(!c) return;
  const d = agoraServidor();
  c.textContent = pad(d.getHours())+':'+pad(d.getMinutes());
  const cd = $('#clkd'); if(cd) cd.textContent = d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
}
setInterval(tickRelogio, 10000);

/* ──────────── INÍCIO ──────────── */
function telaInicio(){
  const b = S.boot;
  const todas = b.colaboradoras.slice().sort((x,y)=>x.nome.localeCompare(y.nome));
  const card = c => `<button class="pessoa" onclick="abrirPin('${c.id}')">
      <div class="avatar" style="background:${esc(c.cor||'#F5B524')}">${esc(iniciais(c.nome))}</div>
      <div class="cresce"><b>${esc(primeiroNome(c.nome))}</b><small>${c.temPin ? (modoLoja()?'Toque para bater o ponto':'Toque para entrar') : '<span style="color:var(--bad)">PIN não criado</span>'}</small></div>
      <i class="ti ti-chevron-right apagado"></i></button>`;
  return `<div class="wrap">${letreiro()}
    ${S.fila.length?`<div class="faixa"><i class="ti ti-cloud-upload"></i> ${S.fila.length} marcação(ões) guardada(s) sem internet. Envio automático quando a conexão voltar.</div>`:''}
    ${!modoLoja() && b.exigirAparelho ? `<div class="nota info" style="margin-bottom:14px"><i class="ti ti-device-desktop"></i><div>O ponto é batido no computador da loja. Aqui você entra no seu portal: vê o mês, o banco de horas, faz pedidos e acompanha a agenda.</div></div>`:''}
    <h2 class="secao">${modoLoja()?'Quem vai bater o ponto?':'Quem é você?'}</h2>
    <div class="pessoas">${todas.map(card).join('') || '<p class="suave">Ninguém cadastrado ainda.</p>'}</div>
    <h2 class="secao">Agenda da equipe <small>atualiza sozinha</small></h2>
    ${calendario(b.calendario, false)}
    ${rodape()}</div>`;
}
function rodape(){
  return `<div class="rodape">
    <button class="btn fantasma p" onclick="abrirPin('__admin')"><i class="ti ti-lock"></i> Administração</button>
    ${modoLoja()?`<button class="btn fantasma p" onclick="telaCheia()"><i class="ti ti-maximize"></i> Tela cheia</button>`:`<button class="btn fantasma p" onclick="abrirPin('__aparelho')"><i class="ti ti-device-desktop"></i> Autorizar este computador</button>`}
    <button class="btn fantasma p" onclick="carregar()"><i class="ti ti-refresh"></i> Atualizar</button>
  </div>`;
}
function telaCheia(){ const el = document.documentElement; if(!document.fullscreenElement) (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el); else (document.exitFullscreen||function(){}).call(document); }

/* ──────────── AGENDA ──────────── */
function itensDoDia(cal, data, regras){
  const it = [];
  if(regras && regras.feriados.includes(data)) it.push({cls:'feriado', txt:'Feriado', det:'Feriado'});
  (cal?.eventos||[]).filter(e=>data>=e.data && data<=(e.data_fim||e.data)).forEach(e=>{
    const t = TIPO_EV[e.tipo]||TIPO_EV.evento;
    it.push({cls:e.tipo, txt:t.e+' '+e.titulo, det:`${t.e} <b>${esc(e.titulo)}</b> — ${t.n}${e.loja&&S.boot.lojas[e.loja]?', loja '+esc(S.boot.lojas[e.loja].nome):''}${e.obs?'<br><span class="apagado">'+esc(e.obs)+'</span>':''}`, ev:e});
  });
  (cal?.ausencias||[]).filter(a=>a.data===data).forEach(a=>{
    const t = TIPO_AUS[a.tipo]||TIPO_AUS.ausente;
    it.push({cls:a.tipo, txt:(a.tipo==='ausente'?'':t.e+' ')+a.nome+(a.tipo==='ausente'?' (ausente)':''), det:`${t.e} <b>${esc(a.nome)}</b> — ${t.n}`});
  });
  return it;
}
function calendario(cal, admin){
  const ym = S.calMes || mesDe(hojeISO());
  const [y,m] = ym.split('-').map(Number);
  const primeiro = new Date(y, m-1, 1).getDay();
  const dias = diasDoMes(ym), hoje = hojeISO(), regras = S.boot?.regras;
  const cells = [];
  for(let i=0;i<primeiro;i++) cells.push('<div class="cal-dia fora"></div>');
  dias.forEach(d=>{
    const it = itensDoDia(cal, d, regras), max = 3;
    cells.push(`<button class="cal-dia ${d===hoje?'hoje':''}" onclick="verDia('${d}',${admin?'true':'false'})">
      <div class="n"><span>${Number(d.slice(8))}</span></div>
      ${it.slice(0,max).map(x=>`<span class="chip ${x.cls}">${esc(x.txt)}</span>`).join('')}
      ${it.length>max?`<span class="chip mais">+${it.length-max}</span>`:''}</button>`);
  });
  while(cells.length%7) cells.push('<div class="cal-dia fora"></div>');
  return `<div class="cal">
    <div class="cal-t"><button class="icone" style="border:0" onclick="mudarCal(-1)"><i class="ti ti-chevron-left"></i></button>
      <b>${nomeMes(ym)}</b>
      <button class="icone" style="border:0" onclick="mudarCal(1)"><i class="ti ti-chevron-right"></i></button></div>
    <div class="cal-grade">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="cal-sem">${x}</div>`).join('')}${cells.join('')}</div>
  </div>
  <div class="legenda"><span class="chip folga">🌴 Folga</span><span class="chip ${admin?'atestado':'ausente'}">${admin?'🩺 Atestado':'Ausente'}</span><span class="chip ferias">✈️ Férias</span><span class="chip cha">💝 Chá de lingerie</span><span class="chip campanha">📣 Campanha</span><span class="chip evento">🎉 Evento</span><span class="chip reuniao">👥 Reunião</span><span class="chip aviso">📌 Aviso</span></div>`;
}
function mudarCal(n){ S.calMes = mesAdd(S.calMes || mesDe(hojeISO()), n); render(); }
function verDia(d, admin){
  const cal = admin ? S.adm.dados.calendario : (S.sess?.dados?.calendario || S.boot.calendario);
  const it = itensDoDia(cal, d, S.boot.regras);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${esc(dataLonga(d))}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${it.length ? it.map(x=>`<div class="pedido" style="align-items:center">${admin&&x.ev?`<div class="cresce">${x.det}</div><button class="btn p" onclick="editarEvento('${x.ev.id}')"><i class="ti ti-pencil"></i> Editar</button>`:`<div class="cresce">${x.det}</div>`}</div>`).join('') : '<p class="suave">Nada marcado neste dia.</p>'}
      ${(()=>{ const esc1 = escalaDe(d, admin ? S.adm.dados.escala : (S.sess?.dados?.escala || S.boot.escala)); if(!esc1.length) return ''; const eq = admin ? S.adm.dados.colaboradoras : (S.sess?.dados?.equipe || S.boot.colaboradoras); return `<h2 class="secao">Escala</h2><div class="linha quebra" style="gap:6px">${esc1.map(e=>{ const c = eq.find(x=>x.id===e.colaboradora_id)||{nome:e.colaboradora_id}; return `<span class="selo"><span class="ponto" style="background:${esc(c.cor||'#999')}"></span> ${esc(primeiroNome(c.nome))} · ${esc(S.boot.lojas[e.loja]?.nome||e.loja)} ${esc(turnoTxt(e))}</span>`; }).join('')}</div>`; })()}
      ${admin?`<button class="btn pri largo" style="margin-top:12px" onclick="editarEvento(null,'${d}')"><i class="ti ti-plus"></i> Adicionar evento neste dia</button>`:''}
      <button class="btn largo" style="margin-top:8px" onclick="fecharModal()"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div></div></div>`;
}
setInterval(async ()=>{
  if(S.tela!=='inicio' || modalAberto() || document.hidden) return;
  try{ S.boot = await api('boot'); LS.set('lv_boot', S.boot); if(S.tela==='inicio' && !modalAberto()) render(); }catch(e){}
}, 60000);

/* ──────────── PIN ──────────── */
function abrirPin(alvo){
  if(alvo==='__admin') S.pin = {alvo, buf:'', erro:'', titulo:'Administração', sub:'PIN da administração'};
  else if(alvo==='__aparelho') S.pin = {alvo, buf:'', erro:'', titulo:'Autorizar este computador', sub:'PIN da administração'};
  else {
    const c = S.boot.colaboradoras.find(x=>x.id===alvo);
    if(!c.temPin){ toast('Peça para a administração criar o seu PIN.', true); return; }
    S.pin = {alvo, buf:'', erro:'', titulo: primeiroNome(c.nome), sub:'Digite seu PIN de 6 números', cor:c.cor};
  }
  renderPin();
}
function renderPin(){
  const p = S.pin, m = $('#modal');
  if(!p){ m.innerHTML=''; return; }
  m.innerHTML = `<div class="veu" onclick="if(event.target===this)fecharPin()"><div class="modal" style="max-width:380px">
    <div class="modal-t">${p.cor?`<div class="avatar" style="background:${esc(p.cor)}">${esc(iniciais(p.titulo))}</div>`:'<div class="avatar" style="background:var(--dourado)"><i class="ti ti-lock"></i></div>'}
      <div class="cresce"><h3>${esc(p.titulo)}</h3><div class="apagado" style="font-size:13.5px">${esc(p.sub)}</div></div>
      <button class="icone" onclick="fecharPin()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="pin-pontos ${p.erro?'err':''}">${[0,1,2,3,4,5].map(i=>`<i class="${i<p.buf.length?'on':''}"></i>`).join('')}</div>
      <div class="pin-erro">${p.ocupado?'<span class="gira" style="color:var(--creme2)"></span>':esc(p.erro)}</div>
      <div class="teclado">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="tecla" onclick="tecla('${n}')">${n}</button>`).join('')}
        <button class="tecla fn" onclick="fecharPin()">Cancelar</button><button class="tecla" onclick="tecla('0')">0</button>
        <button class="tecla fn" onclick="tecla('bk')"><i class="ti ti-backspace" style="font-size:22px"></i></button></div>
    </div></div></div>`;
}
function fecharPin(){ S.pin=null; renderPin(); }
async function tecla(k){
  const p = S.pin; if(!p || p.ocupado) return;
  if(k==='bk'){ p.buf=p.buf.slice(0,-1); p.erro=''; renderPin(); return; }
  if(p.buf.length>=6) return;
  p.buf += k; p.erro=''; renderPin();
  if(p.buf.length<6) return;
  p.ocupado = true; renderPin();
  try{
    if(p.alvo==='__admin' || p.alvo==='__aparelho'){
      const cred = await credencial('adminPin', p.buf);
      const d = await api('admDados', cred);
      S.pin=null; renderPin();
      if(p.alvo==='__aparelho'){ S.admCred = cred; abrirAutorizarAparelho(d); return; }
      S.adm = {cred, dados:d, tab: pendentes(d).length ? 'pedidos' : 'hoje', eid:null, mes:mesDe(d.hoje)};
      S.tela='admin'; render();
    } else {
      const cred = await credencial('pin', p.buf);
      const d = await api('entrar', {eid:p.alvo, ...cred});
      S.sess = {eid:p.alvo, cred, dados:d};
      emprestarCredFila(p.alvo, cred); enviarFila();
      S.pin=null; renderPin(); S.portalTab='inicio'; S.portalMes=mesDe(d.hoje);
      S.tela = modoLoja() ? 'bater' : 'portal'; render();
    }
  }catch(e){
    if(erroRede(e) && p.alvo!=='__admin' && p.alvo!=='__aparelho' && modoLoja()){
      const c = S.boot.colaboradoras.find(x=>x.id===p.alvo);
      const cred = await credencial('pin', p.buf);
      S.sess = {eid:p.alvo, cred, dados:null, offline:true, nome:c.nome};
      emprestarCredFila(p.alvo, cred);
      S.pin=null; renderPin(); S.tela='bater'; render(); return;
    }
    p.ocupado=false; p.buf=''; p.erro=e.message; renderPin();
  }
}
document.addEventListener('keydown', ev=>{
  if(!S.pin) return;
  if(ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
  if(ev.key>='0' && ev.key<='9'){ ev.preventDefault(); tecla(ev.key); }
  else if(ev.key==='Backspace'){ ev.preventDefault(); tecla('bk'); }
  else if(ev.key==='Escape') fecharPin();
});

/* ──────────── AUTORIZAR COMPUTADOR ──────────── */
let AP = null;
function abrirAutorizarAparelho(d){
  AP = {loja: Object.keys(d.lojas)[0], nome:''};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Autorizar este computador</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="nota info" style="margin-bottom:12px"><i class="ti ti-device-desktop"></i><div>Só computadores autorizados batem ponto. A autorização fica guardada neste navegador; você pode revogar depois em Administração › Aparelhos.</div></div>
      <div class="campo"><label>Este computador fica em qual loja?</label><select class="inp" onchange="AP.loja=this.value">${Object.entries(d.lojas).map(([k,l])=>`<option value="${k}">${esc(l.nome)}</option>`).join('')}</select></div>
      <div class="campo"><label>Nome para identificar (opcional)</label><input class="inp" placeholder="Ex.: Caixa do Bosque" oninput="AP.nome=this.value"></div>
      <button class="btn pri largo" id="btn-ap" onclick="autorizarAparelho()"><i class="ti ti-check"></i> Autorizar e começar a bater ponto aqui</button>
    </div></div></div>`;
}
async function autorizarAparelho(){
  const b = $('#btn-ap'); b.disabled = true;
  try{
    const r = await api('admAutorizarAparelho', {...S.admCred, loja:AP.loja, nome:AP.nome});
    S.aparelho = {token:r.token, ...r.aparelho}; LS.set('lv_aparelho', S.aparelho); S.admCred=null;
    const nomeLoja = S.boot.lojas[AP.loja]?.nome||'';
    fecharModal(); render(); toast('Computador autorizado ✔ Agora ele bate ponto da loja '+nomeLoja);
  }catch(e){ toast(e.message, true); b.disabled=false; }
}

/* ──────────── BATER PONTO (modo loja) ──────────── */
let camStream = null, camPronta = false;
async function iniciarCamera(){
  camPronta = false;
  const v = $('#cam'); if(!v || !S.boot?.fotoPonto) return;
  try{
    camStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user', width:{ideal:480}, height:{ideal:360}}, audio:false});
    v.srcObject = camStream; await v.play(); camPronta = true;
    const s = $('#cam-sem'); if(s) s.remove();
  }catch(e){ const s = $('#cam-sem'); if(s) s.innerHTML = '<i class="ti ti-camera-off"></i>sem câmera'; }
}
function pararCamera(){ if(camStream){ camStream.getTracks().forEach(t=>t.stop()); camStream=null; } camPronta=false; }
function fotoAgora(){
  if(!camPronta) return null;
  try{
    const v = $('#cam'), cv = document.createElement('canvas'); cv.width = 320; cv.height = 240;
    cv.getContext('2d').drawImage(v, 0, 0, 320, 240);
    return {base64: cv.toDataURL('image/jpeg', .6).split(',')[1]};
  }catch(e){ return null; }
}
function proximoCampo(r){
  r = r || {};
  if(r.saida) return null;
  if(!r.entrada) return 'entrada';
  if(!r.saida_almoco && !r.volta_almoco && !r.inicio_pausa) return 'saida_almoco';
  if(r.saida_almoco && !r.volta_almoco) return 'volta_almoco';
  if(!r.inicio_pausa) return 'inicio_pausa';
  if(!r.fim_pausa) return 'fim_pausa';
  return 'saida';
}
function registroHoje(){
  const s = S.sess; if(!s) return {};
  const hoje = hojeISO();
  let r = s.dados ? (s.dados.pontos.find(p=>p.data===hoje) || {}) : {};
  r = {...r};
  S.fila.filter(f=>f.eid===s.eid && f.dataAparelho===hoje).forEach(f=>{ r[f.campo]=f.horaAparelho; });
  return r;
}
function telaBater(){
  const s = S.sess;
  const nome = s.dados ? s.dados.colaboradora.nome : s.nome;
  const r = registroHoje(), prox = proximoCampo(r);
  const bloqueado = r.tipo && r.tipo!=='normal';
  const podeSaida = prox && ['saida_almoco','inicio_pausa','fim_pausa'].includes(prox) && r.entrada;
  const d = agoraServidor();
  return `<div class="wrap" style="max-width:680px">${letreiro()}
    ${btnVoltar('Sair')}
    ${s.offline?`<div class="faixa"><i class="ti ti-wifi-off"></i> Sem internet: a marcação fica guardada neste computador e é enviada sozinha depois.</div>`:''}
    <div class="cartao pad">
      <div class="linha" style="gap:16px">
        ${S.boot.fotoPonto?`<div class="camera"><video id="cam" muted playsinline></video><div class="sem" id="cam-sem"><i class="ti ti-camera"></i>ligando…</div></div>`:''}
        <div class="cresce"><div class="apagado" style="font-size:13.5px;font-weight:600;text-transform:capitalize">${esc(dataLonga(hojeISO()))}</div>
        <div class="ola">Oi, ${esc(primeiroNome(nome))}!</div>
        ${S.boot.fotoPonto?`<div class="apagado" style="font-size:12.5px">Olhe para a câmera: a foto confirma que foi você.</div>`:''}</div>
      </div>
      <div class="hoje-grade" style="margin-top:16px">
        ${CAMPOS.map(k=>`<div class="vaga ${r[k]?'feita':''} ${k===prox&&!bloqueado?'proxima':''}"><small>${CURTO[k]}</small><b class="num">${r[k]||'--:--'}</b></div>`).join('')}
      </div>
      <div style="margin-top:16px">
      ${bloqueado ? `<div class="nota info"><i class="ti ti-calendar-off"></i><div>Hoje está lançado como <b>${esc(TIPO_NOME[r.tipo])}</b>. Se estiver errado, avise a administração.</div></div>`
        : prox ? `<button class="botao-ponto" id="btn-bater" onclick="bater('${prox}')"><i class="ti ${ICO[prox]}"></i> Registrar ${NOME[prox].toLowerCase()} · <span class="num">${pad(d.getHours())}:${pad(d.getMinutes())}</span></button>
          ${podeSaida?`<button class="btn largo" style="margin-top:10px" onclick="bater('saida')"><i class="ti ti-logout-2"></i> Registrar saída e encerrar o dia</button>`:''}
          <p class="apagado" style="font-size:13px;text-align:center;margin-top:10px">A hora é a do servidor, não a deste computador.</p>`
        : `<div class="nota ok"><i class="ti ti-circle-check"></i><div>Dia encerrado. Você trabalhou <b class="num">${hm(trab(r))}</b> hoje. Bom descanso! ✨</div></div>`}
      </div>
    </div>
    ${s.dados?blocoAtalhos():''}
    <button class="btn largo" style="margin-top:14px" onclick="sair()"><i class="ti ti-arrow-left"></i> Sair</button>
  </div>`;
}
