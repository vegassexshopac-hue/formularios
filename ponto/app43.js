/* ═══════════ v43: Avisos no WhatsApp ═══════════
   Pedido da Madu (04/11/2026): avisos no WhatsApp das vendedoras como no painel do escritório, saindo do WhatsApp da loja.
   • Administração › Comunicação › Avisos (e sino 🔔 no letreiro): o que a administração recebe, o que cada pessoa recebe,
     liga/desliga por tipo, "Enviar teste", pausar 1 h / 3 h / até amanhã, horários e últimos avisos.
   • Tudo roda no motor da Kommo (Railway) — /api/avisos/*. Sem a chave da Evolution API a tela fica pronta e mostra o que falta.
   • Enquanto o KOMMO.gs novo (kommoEquipe) não está publicado, a administração manda para o motor um retrato da equipe
     (números, ponto de hoje, vendas) toda vez que abre a tela — assim os avisos já funcionam.
   • Para voltar: tirar a linha do app43 no app9.js. */

const AV43 = { cfg:null, carregando:false, erro:'', t:0, aberto:null, hist:null, enviando:'' };
const av43Tel = n => n ? n : '';
const av43Quando = t => { const d = new Date(t); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const AV43_ICO = {bomdia:'🌅', comecou:'🟢', clientenova:'🆕', esperando:'⏳', tarefa:'⏰', resumo:'🌙', resumos:'📊', ninguemativo:'😴', evolucao:'💡', teste:'✅'};

/* ───────── motor ───────── */
async function av43Carregar(forcar){
  if(typeof kmApi!=='function' || !S.adm) return;
  if(AV43.carregando || (!forcar && AV43.cfg && Date.now()-AV43.t < 20e3)) return;
  AV43.carregando = true;
  try{
    AV43.cfg = await kmApi('/api/avisos/config'); AV43.erro = ''; AV43.t = Date.now();
    const eq = AV43.cfg.equipe;
    if(!eq || eq.fonte!=='planilha' || Date.now()-eq.em > 15*60e3){ await av43Retrato(); AV43.cfg = await kmApi('/api/avisos/config'); }
  }catch(e){ AV43.erro = /Não encontrado|404/.test(e.message) ? 'motor antigo' : e.message; }
  finally{ AV43.carregando = false; }
  av43Repintar();
}
/* retrato da equipe para o motor (vale enquanto o KOMMO.gs com kommoEquipe não estiver publicado) */
async function av43Retrato(){
  try{
    const d = S.adm.dados, hoje = d.hoje;
    await kmApi('/api/avisos/equipe', { hoje, hora:d.hora, lojas:d.lojas, turnos:d.turnos||{}, pendentes:(typeof pendentes==='function' ? pendentes(d).length : 0),
      colaboradoras: d.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>({id:c.id, nome:c.nome, loja:c.loja, cargo:c.cargo||'', telefone:c.telefone||''})),
      pontos: (d.pontos||[]).filter(p=>p.data===hoje).map(p=>({colaboradora_id:p.colaboradora_id, entrada:p.entrada, saida_almoco:p.saida_almoco, volta_almoco:p.volta_almoco, inicio_pausa:p.inicio_pausa, fim_pausa:p.fim_pausa, saida:p.saida, tipo:p.tipo})),
      escala: (d.escala||[]).filter(e=>e.data===hoje).map(e=>({colaboradora_id:e.colaboradora_id, loja:e.loja, turno:e.turno})),
      vendas: (d.vendas||[]).filter(v=>v.data===hoje).map(v=>({colaboradora_id:v.colaboradora_id, valor:Number(v.valor)||0, loja:v.loja})) });
  }catch(e){}
}
function av43Repintar(){ if(S.tela!=='admin' || S.adm?.tab!=='avisos' || modalAberto()) return; const ae = document.activeElement; if(ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return; render(); }
async function av43Salvar(corpo, msg){
  try{ await kmApi('/api/avisos/config', corpo); AV43.t = 0; if(msg) toast(msg); await av43Carregar(true); }catch(e){ toast(e.message, true); av43Repintar(); }
}
function av43Toggle(quem, tipo, on){
  const c = AV43.cfg; if(!c) return;
  if(quem==='admin'){ if(tipo==='__') c.admin.ligado = on; else c.admin.tipos[tipo] = on; av43Salvar({admin:{ligado:c.admin.ligado, tipos:c.admin.tipos}}); }
  else if(quem==='__geral'){ c.cfg.ligado = on; av43Salvar({ligado:on, pausaAte:0}, on?'Avisos ligados ✔':'Avisos desligados'); }
  else { const p = c.pessoas.find(x=>x.eid===quem); if(!p) return; if(tipo==='__') p.ligado = on; else p.tipos[tipo] = on; av43Salvar({pessoas:{[quem]:{ligado:p.ligado, tipos:p.tipos}}}); }
  render();
}
async function av43Pausar(horas){
  const ate = horas==='amanha' ? (()=>{ const d = new Date(); d.setDate(d.getDate()+1); d.setHours(0,5,0,0); return d.getTime(); })() : Date.now()+horas*3600e3;
  await av43Salvar({pausaAte:ate}, horas==='amanha' ? 'Pausado até amanhã' : `Pausado por ${horas} h`);
}
async function av43Teste(quem){
  AV43.enviando = quem; render();
  try{ const r = await kmApi('/api/avisos/teste', {quem}); const e = r.envio; toast(e.ok ? `Teste enviado para ${e.nome} ✔` : `Não enviou: ${e.erro}`, !e.ok); AV43.t = 0; await av43Carregar(true); }
  catch(e){ toast(e.message, true); }
  finally{ AV43.enviando = ''; render(); }
}
async function av43Numero(quem){
  const inp = $('#av43-num-'+quem); if(!inp) return; const numero = inp.value.replace(/\D/g,'');
  if(numero && numero.length < 10) return toast('Número incompleto (DDD + número)', true);
  await av43Salvar(quem==='admin' ? {admin:{numero}} : {pessoas:{[quem]:{numero}}}, numero ? 'Número salvo ✔' : 'Número removido — volta a usar o do cadastro');
}
async function av43Horas(){
  await av43Salvar({horaBomdia:$('#av43-h1').value, horaMeio:$('#av43-h2').value, horaResumo:$('#av43-h3').value, paradaMin:Number($('#av43-h4').value)||45}, 'Horários salvos ✔');
}
async function av43Historico(){
  try{ AV43.hist = (await kmApi('/api/avisos/historico')).itens; }catch(e){ toast(e.message, true); return; }
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3>Últimos avisos</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c av43-hist">${AV43.hist.length ? AV43.hist.map(h=>`<div class="av43-hi ${h.ok?'':'ruim'}"><span class="em">${AV43_ICO[h.tipo]||'📨'}</span><div class="cresce"><b>${esc(h.nome)} <small>${esc(h.numero)}</small></b><pre>${esc(h.texto)}</pre>${h.ok?'':`<small class="neg">não enviou: ${esc(h.erro)}</small>`}</div><small class="num">${av43Quando(h.t)}</small></div>`).join('') : '<p class="suave">Nenhum aviso enviado ainda.</p>'}</div></div></div>`;
}

/* ───────── tela ───────── */
const av43Sw = (on, oc, small) => `<button class="av43-sw ${on?'on':''} ${small?'p':''}" role="switch" aria-checked="${on}" onclick="${oc}"><i></i></button>`;
function av43Tela(){
  const c = AV43.cfg;
  if(!c && !AV43.erro){ av43Carregar(); return `<div class="carregando"><span class="gira"></span> Abrindo os avisos…</div>`; }
  if(!c) return `<div class="nota warn"><i class="ti ti-plug-x"></i><div>${AV43.erro==='motor antigo' ? 'O motor da Kommo ainda não tem os avisos (publicar a versão nova no Railway).' : 'Motor da Kommo: '+esc(AV43.erro)}</div></div>`;
  if(Date.now()-AV43.t > 20e3 && !AV43.carregando) setTimeout(()=>av43Carregar(), 50);
  const ev = c.evolution, pausado = c.cfg.pausaAte > Date.now(), geralOn = c.cfg.ligado && !pausado;
  const estado = !ev.configurada ? {c:'warn', t:'Aguardando a chave da Evolution API no motor', s:'Matheus: variáveis EVOLUTION_URL, EVOLUTION_KEY e EVOLUTION_INSTANCE no serviço portal-kommo-las-vegas (Railway). A tela já está pronta.'}
    : ev.estado==='open' ? {c:'ok', t:'WhatsApp da loja conectado', s:`instância "${esc(ev.instancia)}" · os avisos saem do número da Las Vegas`}
    : {c:'bad', t:'WhatsApp da loja desconectado', s:`instância "${esc(ev.instancia)}": ${esc(ev.estado)}${ev.erro?' · '+esc(ev.erro):''} — ler o QR Code de novo na Evolution API`};
  const tipoRow = (quem, k, n, d, on) => `<div class="av43-tipo"><span class="em">${AV43_ICO[k]||'📨'}</span><div class="cresce"><b>${esc(n)}</b><small>${esc(d)}</small></div>${av43Sw(on, `av43Toggle('${quem}','${k}',${!on})`, true)}</div>`;
  const admTipos = c.tipos.admin.map(t=>tipoRow('admin', t.k, t.n, t.d, c.admin.tipos[t.k]!==false)).join('');
  const pessoa = p => { const aberto = AV43.aberto===p.eid, n = Object.values(p.tipos).filter(Boolean).length, tot = c.tipos.pessoa.length;
    return `<div class="av43-pessoa ${p.ligado?'':'off'}">
      <div class="av43-ph"><span class="av43-av">${typeof avatar==='function' ? avatar({id:p.eid, nome:p.nome, cor:'#F5B524'}, '', 40) : ''}</span>
        <div class="cresce"><b>${esc(p.nome)}</b><small>${p.numero ? `recebendo no WhatsApp ${p.numeroProprio?'':'do cadastro '}${esc(p.numeroFim)}` : '<span class="neg">sem número cadastrado</span>'}${p.at==null?' · <span class="neg">sem atendente na Kommo</span>':''}</small></div>
        ${av43Sw(p.ligado, `av43Toggle('${p.eid}','__',${!p.ligado})`)}</div>
      <div class="av43-num"><label>WhatsApp</label><input class="inp" id="av43-num-${p.eid}" inputmode="tel" placeholder="${p.telefoneCadastro ? 'usa o do cadastro '+esc(p.telefoneCadastro) : '68 99999-9999'}" value=""><button class="btn p" onclick="av43Numero('${p.eid}')">Salvar número</button><button class="btn p" ${!p.numero||AV43.enviando?'disabled':''} onclick="av43Teste('${p.eid}')"><i class="ti ti-send"></i> ${AV43.enviando===p.eid?'Enviando…':'Enviar teste'}</button></div>
      <button class="av43-abrir" onclick="AV43.aberto=${aberto?'null':`'${p.eid}'`};render()"><i class="ti ti-chevron-${aberto?'down':'right'}"></i> O que chega <small>${n} de ${tot} ligados</small></button>
      ${aberto ? `<div class="av43-tipos">${c.tipos.pessoa.map(t=>tipoRow(p.eid, t.k, t.n, t.d, p.tipos[t.k]!==false)).join('')}</div>` : ''}
    </div>`; };
  return `<div class="av43">
    <div class="av43-topo"><div><span class="p41-selo">GESTÃO · SÓ VOCÊ VÊ</span><h2>Avisos no <mark>WhatsApp</mark></h2><p>Saem do WhatsApp da loja e chegam no WhatsApp de cada pessoa. Nada de texto de cliente nem de produto — só nome, hora e contagens.</p></div>
      <div class="linha" style="gap:8px;flex-wrap:wrap"><button class="btn p" onclick="av43Historico()"><i class="ti ti-history"></i> Últimos avisos</button><button class="btn p" onclick="AV43.t=0;av43Carregar(true)"><i class="ti ti-refresh"></i> Atualizar</button></div></div>
    <div class="nota ${estado.c}" style="margin-bottom:12px"><i class="ti ${estado.c==='ok'?'ti-brand-whatsapp':'ti-plug-x'}"></i><div><b>${estado.t}</b><br><small>${estado.s}</small>${c.equipe?`<br><small class="apagado">Equipe: ${c.equipe.n} pessoa(s) · dados ${c.equipe.fonte==='planilha'?'da planilha (KOMMO.gs)':'do portal'} · ${av43Quando(c.equipe.em)}</small>`:''}</div></div>
    <section class="av43-bloco geral">
      <div class="av43-ph"><span class="av43-ic"><i class="ti ti-bell-ringing"></i></span><div class="cresce"><b>${geralOn ? 'Avisos ligados' : pausado ? 'Pausados até '+av43Quando(c.cfg.pausaAte) : 'Avisos desligados'}</b><small>${geralOn ? 'Bom-dia às '+esc(c.cfg.horaBomdia)+' · meio do dia às '+esc(c.cfg.horaMeio)+' · resumo às '+esc(c.cfg.horaResumo) : 'Ninguém recebe nada enquanto estiver assim'}</small></div>${av43Sw(geralOn, `av43Toggle('__geral','__',${!geralOn})`)}</div>
      <div class="av43-pausa"><span>Pausar:</span><button class="btn p" onclick="av43Pausar(1)">1 hora</button><button class="btn p" onclick="av43Pausar(3)">3 horas</button><button class="btn p" onclick="av43Pausar('amanha')">Até amanhã</button></div>
    </section>
    <div class="av43-g2">
      <section class="av43-bloco">
        <h3>Você recebe</h3>
        <div class="av43-ph"><span class="av43-ic adm"><i class="ti ti-shield-lock"></i></span><div class="cresce"><b>Administração</b><small>${c.admin.numeroFim ? 'no WhatsApp '+esc(c.admin.numeroFim) : '<span class="neg">coloque o seu número abaixo</span>'}</small></div>${av43Sw(c.admin.ligado, `av43Toggle('admin','__',${!c.admin.ligado})`)}</div>
        <div class="av43-num"><label>Seu WhatsApp</label><input class="inp" id="av43-num-admin" inputmode="tel" placeholder="68 99999-9999" value=""><button class="btn p" onclick="av43Numero('admin')">Salvar número</button><button class="btn p" ${!c.admin.numeroFim||AV43.enviando?'disabled':''} onclick="av43Teste('admin')"><i class="ti ti-send"></i> ${AV43.enviando==='admin'?'Enviando…':'Enviar teste'}</button></div>
        <div class="av43-tipos">${admTipos}</div>
        <h3 style="margin-top:16px">Horários</h3>
        <div class="av43-horas"><label>Bom-dia<input class="inp" id="av43-h1" type="time" value="${esc(c.cfg.horaBomdia)}"></label><label>Meio do dia<input class="inp" id="av43-h2" type="time" value="${esc(c.cfg.horaMeio)}"></label><label>Resumo<input class="inp" id="av43-h3" type="time" value="${esc(c.cfg.horaResumo)}"></label><label>"Ninguém ativo" após<input class="inp" id="av43-h4" type="number" min="10" max="240" value="${c.cfg.paradaMin}"></label><button class="btn pri" onclick="av43Horas()">Salvar</button></div>
        <small class="apagado">Cliente esperando: avisa quem atende aos ${c.cfg.prazoMin} min e você aos ${c.cfg.prazoMin*3} min (prazo em Atendimento · Kommo › Configurar). Tarefa: avisa 30 min antes; para você, 30 min depois de vencer.</small>
      </section>
      <section class="av43-bloco">
        <h3>Avisos da equipe <small class="apagado">no WhatsApp de cada uma, só o que é dela</small></h3>
        ${c.pessoas.length ? c.pessoas.map(pessoa).join('') : '<p class="suave">Nenhuma colaboradora ativa.</p>'}
      </section>
    </div>
    ${c.ultimos.length ? `<section class="av43-bloco"><h3>Últimos avisos</h3><div class="av43-hist">${c.ultimos.slice(0,8).map(h=>`<div class="av43-hi ${h.ok?'':'ruim'}"><span class="em">${AV43_ICO[h.tipo]||'📨'}</span><div class="cresce"><b>${esc(h.nome)} <small>${esc(h.numero)}</small></b><pre>${esc(h.texto.split('\n')[0])}</pre>${h.ok?'':`<small class="neg">não enviou: ${esc(h.erro)}</small>`}</div><small class="num">${av43Quando(h.t)}</small></div>`).join('')}</div></section>` : ''}
  </div>`;
}

/* ───────── encaixe na Administração (Comunicação › Avisos) + sino no letreiro ───────── */
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='comunic'); if(a && !a.k.includes('avisos')) a.k.splice(1, 0, 'avisos'); NOMES34.avisos = 'Avisos no WhatsApp'; }
if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('mural')); if(g && !g.k.includes('avisos')) g.k.splice(g.k.indexOf('mural')+1, 0, 'avisos'); if(typeof NOMES12!=='undefined') NOMES12.admin.avisos = 'Avisos no WhatsApp'; }
const _telaAdminV43 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, aqui = A.tab === 'avisos', marca = '<!--av43-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV43.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'avisos'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + av43Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV43.apply(this, arguments);
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='avisos';TR=null;render()"><i class="ti ti-bell"></i> Avisos </button>`;
  h = h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
  // sino no letreiro
  const sino = `<button class="icone av43-sino ${AV43.cfg && AV43.cfg.evolution?.estado==='open' && AV43.cfg.cfg.ligado && !(AV43.cfg.cfg.pausaAte>Date.now()) ? 'on':''}" title="Avisos no WhatsApp" onclick="S.adm.tab='avisos';TR=null;render()"><i class="ti ti-bell"></i></button>`;
  const anc = h.indexOf('<button class="icone" title="Atualizar"');
  if(anc > 0) h = h.slice(0, anc) + sino + h.slice(anc);
  return h;
};
const _itensBuscaV43 = typeof itensBusca==='function' ? itensBusca : null;
if(_itensBuscaV43) itensBusca = function itensBusca(){ const r = _itensBuscaV43.apply(this, arguments); if(S.adm && S.tela==='admin') r.unshift({t:'Avisos no WhatsApp', s:'O que cada pessoa recebe, testes, pausa', i:'ti-bell', go:()=>{ S.adm.tab='avisos'; render(); }}); return r; };
/* o motor precisa do retrato da equipe de vez em quando (enquanto o KOMMO.gs não responde kommoEquipe) */
setInterval(()=>{ if(S.tela==='admin' && S.adm?.dados && document.visibilityState==='visible' && typeof kmApi==='function' && KM?.tk && AV43.cfg && AV43.cfg.equipe?.fonte!=='planilha') av43Retrato(); }, 10*60e3);

document.head.insertAdjacentHTML('beforeend', `<style>
.av43-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 14px}
.av43-topo h2{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:6px 0 4px}.av43-topo h2 mark{background:linear-gradient(transparent 55%,rgba(37,211,102,.45) 55%);color:inherit;padding:0 2px}
.av43-topo p{color:var(--creme2);font-size:14px;max-width:640px}
.av43-bloco{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:16px 18px;box-shadow:var(--sh);margin-bottom:12px;animation:entraBloco .45s var(--suave,ease) both}
.av43-bloco h3{font-size:16px;font-weight:800;margin:0 0 10px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.av43-bloco h3 small{font-weight:600;font-size:12.5px}
.av43-bloco.geral{background:linear-gradient(135deg,#fff,rgba(37,211,102,.1));border-color:rgba(37,211,102,.35)}
.av43-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:12px}
.av43-ph{display:flex;align-items:center;gap:12px;padding:4px 0}.av43-ph b{display:block;font-size:15px}.av43-ph small{display:block;font-size:12.5px;color:var(--creme3)}
.av43-ic{width:40px;height:40px;border-radius:13px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0}.av43-ic.adm{background:var(--creme)}
.av43-av .lob-av{width:40px;height:40px;font-size:13px}
.av43-sw{position:relative;width:48px;height:28px;border-radius:99px;background:#d9d4d6;flex-shrink:0;transition:background .25s;cursor:pointer}.av43-sw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:99px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .25s var(--mola,ease)}
.av43-sw.on{background:#25D366}.av43-sw.on i{transform:translateX(20px)}.av43-sw.p{width:40px;height:24px}.av43-sw.p i{width:18px;height:18px}.av43-sw.p.on i{transform:translateX(16px)}.av43-sw:active i{transform:scale(.9) translateX(var(--x,0))}
.av43-pausa{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:13px;font-weight:700;color:var(--creme2)}
.av43-tipos{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.av43-tipo{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:var(--noite)}.av43-tipo .em{font-size:20px;width:28px;text-align:center}.av43-tipo b{display:block;font-size:14px}.av43-tipo small{display:block;font-size:12px;color:var(--creme3);line-height:1.3}
.av43-pessoa{border:1px solid var(--linha);border-radius:16px;padding:12px 14px;margin-bottom:10px;transition:opacity .2s}.av43-pessoa.off{opacity:.6}
.av43-num{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:end;margin:8px 0}.av43-num label{grid-column:1/-1;font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--creme3);margin-bottom:-2px}.av43-num .inp{min-width:0}
.av43-abrir{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13.5px;color:var(--creme2);padding:6px 2px}.av43-abrir small{margin-left:auto;color:var(--creme3);font-weight:600}
.av43-horas{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;align-items:end;margin-bottom:8px}.av43-horas label{font-size:12px;font-weight:700;color:var(--creme2);display:flex;flex-direction:column;gap:4px}
.av43-hist{display:flex;flex-direction:column;gap:6px}.av43-hi{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-radius:14px;background:var(--noite)}.av43-hi.ruim{background:var(--bad-bg)}.av43-hi .em{font-size:18px}.av43-hi b{font-size:13.5px}.av43-hi b small{color:var(--creme3);font-weight:600}.av43-hi pre{white-space:pre-wrap;font:inherit;font-size:13px;color:var(--creme2);margin:2px 0 0}.av43-hi>small{white-space:nowrap;color:var(--creme3)}
.av43-sino{position:relative}.av43-sino.on::after{content:'';position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:99px;background:#25D366;box-shadow:0 0 0 2px #fff}
@media (max-width:900px){.av43-g2{grid-template-columns:1fr}}
@media (max-width:560px){.av43-num{grid-template-columns:1fr 1fr}.av43-num .inp{grid-column:1/-1}}
</style>`);
