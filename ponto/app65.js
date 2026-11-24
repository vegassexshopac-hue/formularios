/* ═══════════ v65: Relatórios no WhatsApp (24/11/2026) ═══════════
   Pedido da Madu: relatório do dia no WhatsApp dela e do Matheus quando o último caixa fecha + aviso a cada ponto batido;
   tudo pronto para as colaboradoras (confirmação do ponto e "seu dia" com quanto falta da meta) — só colocar o número e ligar.
   • Administração › Comunicação › Relatórios no WhatsApp (só no perfil Matheus).
   • Servidor: RELATORIO.gs (ação admRel65). Sai do WhatsApp da loja pela Evolution API (mesma chave dos avisos do caixa).
   • Para voltar: tirar a linha do app65 no app9.js. */

const R65 = { d:null, erro:'', carregando:false, rasc:null, chave:'', previa:null, previaErro:'', enviando:'' };
const R65_ADM_TIPOS = [['relatorio','ti-report-analytics','Relatório do dia','Quando o último caixa fecha'],['ponto','ti-fingerprint','Ponto · entrada e saída','Na hora em que bate'],['intervalo','ti-coffee','Ponto · intervalo','Almoço e pausa'],['so_atraso','ti-alarm','Ponto · só atrasos','Não avisa quem chegou no horário']];
const R65_EQ_TIPOS = [['ponto','ti-circle-check','Confirmação do ponto','“Ponto batido, Isabel!”'],['dia','ti-target-arrow','Seu dia + meta','Quanto vendeu e quanto falta']];
const r65Tel = d => { d = String(d||'').replace(/\D/g,''); if(d.length<12) return d; const l = d.slice(4); return `(${d.slice(2,4)}) ${l.slice(0,l.length-4)}-${l.slice(-4)}`; };
const r65Num = n => { let d = String(n||'').replace(/\D/g,''); if(d.length===10||d.length===11) d = '55'+d; return d.length>=12 && d.length<=13 ? d : ''; };
const r65Quando = s => s ? `${String(s).slice(8,10)}/${String(s).slice(5,7)} ${String(s).slice(11,16)}` : '';

async function r65Carregar(forcar){
  if(R65.carregando || (R65.d && !forcar)) return;
  R65.carregando = true;
  try{ r65Usar(await api('admRel65', {...S.adm.cred, op:'ver'})); R65.erro = ''; }
  catch(e){ R65.erro = e.message; }
  finally{ R65.carregando = false; }
  if(S.tela==='admin' && S.adm?.tab==='relatorios' && !modalAberto()) render();
}
function r65Usar(d){ R65.d = d; R65.rasc = JSON.parse(JSON.stringify(d.cfg)); d.equipe.forEach(e=>{ if(!R65.rasc.equipe[e.id]) R65.rasc.equipe[e.id] = {ligado:false, numero:'', tipos:{ponto:true, dia:true}}; }); }
const r65Mudou = () => R65.d && R65.rasc && (JSON.stringify(r65Limpo(R65.rasc)) !== JSON.stringify(r65Limpo(R65.d.cfg)) || !!R65.chave);
function r65Limpo(c){ const o = JSON.parse(JSON.stringify(c)); Object.keys(o.equipe||{}).forEach(k=>{ const e = o.equipe[k]; if(!e.ligado && !e.numero && e.tipos.ponto && e.tipos.dia) delete o.equipe[k]; }); o.admins.forEach(a=>a.numero = r65Num(a.numero)); Object.values(o.equipe).forEach(e=>e.numero = r65Num(e.numero)); o.meta_equipe = Number(o.meta_equipe)||0; o.tol_atraso = o.tol_atraso===''||o.tol_atraso==null ? null : Number(o.tol_atraso); return o; }

/* ───────── mexer no rascunho (sem re-render dos campos de texto) ───────── */
function r65Geral(){ R65.rasc.ligado = !R65.rasc.ligado; render(); }
function r65Adm(i, k){ const a = R65.rasc.admins[i]; if(k==='ligado') a.ligado = !a.ligado; else a.tipos[k] = !a.tipos[k]; render(); }
function r65AdmNum(i, el){ R65.rasc.admins[i].numero = el.value; r65BarraSalvar(); }
function r65AdmNome(i, el){ R65.rasc.admins[i].nome = el.value; r65BarraSalvar(); }
function r65AdmMais(){ R65.rasc.admins.push({id:'adm'+Date.now(), nome:'', numero:'', ligado:true, tipos:{relatorio:true, ponto:false, intervalo:false, so_atraso:false}}); render(); }
function r65AdmTirar(i){ if(!confirm('Tirar '+(R65.rasc.admins[i].nome||'este número')+' da lista?')) return; R65.rasc.admins.splice(i,1); render(); }
function r65Eq(id, k){ const e = R65.rasc.equipe[id]; if(k==='ligado'){ e.ligado = !e.ligado; const p = R65.d.equipe.find(x=>x.id===id); if(e.ligado && !r65Num(e.numero) && !p?.telCadastro){ toast('Coloque o WhatsApp dela para ligar.', true); e.ligado = false; } } else e.tipos[k] = !e.tipos[k]; render(); }
function r65EqNum(id, el){ R65.rasc.equipe[id].numero = el.value; r65BarraSalvar(); }
function r65Ajuste(k, el){ if(k==='sem_resumo_caixa'){ R65.rasc[k] = !R65.rasc[k]; render(); return; } R65.rasc[k] = el.value; r65BarraSalvar(); }
function r65Chave(el){ R65.chave = el.value.trim(); r65BarraSalvar(); }
function r65BarraSalvar(){ const b = document.querySelector('.r65-salvar'); if(!b) return; const m = r65Mudou(); b.classList.toggle('on', !!m); const s = b.querySelector('span'); if(s) s.textContent = m ? 'Você mudou os relatórios.' : 'Tudo salvo.'; b.querySelectorAll('.r65-so-mudou').forEach(x=>x.style.display = m ? '' : 'none'); }

async function r65Salvar(){
  const c = JSON.parse(JSON.stringify(R65.rasc));
  for(const a of c.admins){ if(a.numero && !r65Num(a.numero)) return toast('Número de '+(a.nome||'administração')+' inválido — use DDD + número.', true); }
  for(const [id,e] of Object.entries(c.equipe)){ if(e.numero && !r65Num(e.numero)) return toast('WhatsApp de '+primeiroNome(R65.d.equipe.find(x=>x.id===id)?.nome||'')+' inválido.', true); }
  try{
    r65Usar(await api('admRel65', {...S.adm.cred, op:'salvar', cfg:c, ...(R65.chave?{chave:R65.chave}:{}), por:(S.adm.perfil==='madu'?'Madu':'Matheus')}));
    R65.chave = ''; render(); toast('Relatórios salvos ✔');
  }catch(e){ toast(e.message, true); }
}
function r65Desfazer(){ r65Usar(R65.d); R65.chave = ''; render(); }

async function r65Teste(numero, quem, tipo){
  const n = r65Num(numero); if(!n) return toast('Coloque um número com DDD primeiro.', true);
  if(r65Mudou()) return toast('Salve antes de testar.', true);
  R65.enviando = quem; render();
  try{ const d = await api('admRel65', {...S.adm.cred, op:'teste', numero:n, quem, tipo:tipo||''}); const t = d.teste; r65Usar(d); toast(t==='ok' ? 'Teste enviado ✔ Confira o WhatsApp de '+quem+'.' : 'Não enviou: '+t, t!=='ok'); }
  catch(e){ toast(e.message, true); }
  finally{ R65.enviando = ''; render(); }
}
async function r65Agora(){
  if(!confirm('Mandar agora o relatório de hoje (com os números de agora) para quem está ligado?')) return;
  try{ const d = await api('admRel65', {...S.adm.cred, op:'agora'}); const a = d.agora||{}; r65Usar(d); render(); toast(a.enviado ? `Relatório enviado ✔ (${a.ok} mensagem${a.ok===1?'':'s'})` : 'Não enviou: '+(a.erro||a.motivo||''), !a.enviado); }
  catch(e){ toast(e.message, true); }
}
async function r65Previa(){
  R65.previa = 'carregando'; r65PreviaModal();
  try{ R65.previa = await api('admRel65', {...S.adm.cred, op:'previa'}); }
  catch(e){ R65.previa = {erro:e.message}; }
  r65PreviaModal();
}
/* formatação do WhatsApp: *negrito* e _itálico_ */
const r65Zap = t => esc(t).replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,]|$)/gm,'$1<i>$2</i>').replace(/\n/g,'<br>');
function r65PreviaModal(){
  const P = R65.previa;
  let corpo;
  if(P==='carregando') corpo = '<p class="apagado"><i class="ti ti-loader-2"></i> Montando com os números de agora…</p>';
  else if(P?.erro) corpo = `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-alert-triangle"></i><div>${esc(P.erro)}</div></div>`;
  else {
    const eu = Object.entries(P.eu||{});
    const nome = id => primeiroNome((R65.d?.equipe||[]).find(x=>x.id===id)?.nome||id);
    corpo = `<div class="r65-zap-fundo">
      <div class="r65-rot">Madu e Matheus · relatório do dia</div><div class="r65-balao">${r65Zap(P.relatorio)}</div>
      ${P.ponto?`<div class="r65-rot">Ponto (exemplo)</div><div class="r65-balao">${r65Zap(P.ponto.adm)}</div><div class="r65-rot">A colaboradora recebe</div><div class="r65-balao">${r65Zap(P.ponto.eu)}</div>`:''}
      ${eu.map(([id,t])=>`<div class="r65-rot">${esc(nome(id))} · seu dia</div><div class="r65-balao">${r65Zap(t)}</div>`).join('')}
    </div><p class="apagado" style="font-size:12.5px;margin:8px 0 0">Números de agora — o de verdade sai quando o último caixa do dia fecha.</p>`;
  }
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal r65-modal">
    <div class="modal-t"><h3 class="cresce"><i class="ti ti-brand-whatsapp"></i> Prévia das mensagens</h3><button class="icone" onclick="fecharModal()" aria-label="Fechar"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}</div></div></div>`;
}

/* ───────── tela ───────── */
function r65Sw(on, oc){ return typeof mod45Sw==='function' ? mod45Sw(on, oc) : `<button class="mod45-sw ${on?'on':''}" role="switch" aria-checked="${on}" onclick="${oc}"><i></i></button>`; }
function r65Chip(on, ic, t, oc, dica){ return `<button class="r65-chip ${on?'on':''}" title="${esc(dica||'')}" onclick="${oc}"><i class="ti ${on?'ti-check':ic}"></i> ${esc(t)}</button>`; }
function r65Tela(){
  if(!R65.d){ if(!R65.erro) r65Carregar(); return `<div class="mod45-topo"><div><h2>📲 Relatórios no <mark>WhatsApp</mark></h2>${R65.erro?'':'<p><i class="ti ti-loader-2"></i> Carregando…</p>'}</div></div>${R65.erro?`<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(R65.erro)?'<b>Falta publicar o RELATORIO.gs no servidor</b><br>Apps Script › Arquivos › + › Script › nome <b>RELATORIO</b> (último da lista) › colar <code>ponto/servidor/RELATORIO.gs</code> › Salvar › Implantar › Gerenciar implantações › ✏️ › Nova versão.':esc(R65.erro)}<br><button class="btn p" style="margin-top:8px" onclick="R65.erro='';R65.d=null;render()"><i class="ti ti-refresh"></i> Tentar de novo</button></div></div>`:''}`; }
  const D = R65.d, C = R65.rasc, mudou = r65Mudou(), geral = C.ligado;
  const lojasHoje = (D.hoje?.lojas||[]).map(l=>`${esc(S.boot?.lojas?.[l.k]?.nome||l.k)} ${l.fechado?'✅':'🔓'}`).join(' · ');
  const estado = `<div class="r65-estado">
      <span class="r65-pill ${D.chave?'ok':'ruim'}"><i class="ti ti-brand-whatsapp"></i> ${D.chave?'WhatsApp da loja conectado':'Falta a chave do WhatsApp'}</span>
      <span class="r65-pill"><i class="ti ti-building-store"></i> Hoje: ${lojasHoje||'nenhuma loja abriu o caixa ainda'}</span>
      <span class="r65-pill ${D.hoje?.enviado?'ok':''}"><i class="ti ti-report-analytics"></i> ${D.hoje?.enviado?'Relatório enviado às '+esc(String(D.hoje.enviado).slice(11,16)):'Relatório de hoje ainda não saiu'}</span></div>`;
  const adm = C.admins.map((a,i)=>`<div class="r65-pessoa ${a.ligado&&geral?'':'off'}">
      <div class="r65-p-top">${r65Sw(a.ligado, `r65Adm(${i},'ligado')`)}
        <input class="inp r65-nome" value="${esc(a.nome)}" placeholder="Nome" oninput="r65AdmNome(${i},this)">
        <input class="inp num r65-num" inputmode="tel" value="${esc(r65Tel(a.numero)||a.numero)}" placeholder="(68) 99999-9999" oninput="r65AdmNum(${i},this)">
        <button class="btn p r65-teste" ${R65.enviando?'disabled':''} onclick="r65Teste(R65.rasc.admins[${i}].numero, R65.rasc.admins[${i}].nome||'administração')"><i class="ti ${R65.enviando===a.nome?'ti-loader-2':'ti-send'}"></i> Teste</button>
        ${C.admins.length>1?`<button class="icone" title="Tirar da lista" onclick="r65AdmTirar(${i})"><i class="ti ti-trash"></i></button>`:''}</div>
      <div class="r65-chips">${R65_ADM_TIPOS.map(([k,ic,t,s])=>r65Chip(a.tipos[k], ic, t, `r65Adm(${i},'${k}')`, s)).join('')}</div></div>`).join('');
  const eq = D.equipe.map(p=>{ const e = C.equipe[p.id], num = r65Num(e.numero) || p.telCadastro, cor = p.cor || 'var(--vermelho)';
    return `<div class="r65-pessoa ${e.ligado&&geral?'':'off'}">
      <div class="r65-p-top">${r65Sw(e.ligado, `r65Eq('${p.id}','ligado')`)}
        <span class="r65-av" style="background:${esc(cor)}">${esc(primeiroNome(p.nome).slice(0,1))}</span>
        <div class="r65-quem"><b>${esc(primeiroNome(p.nome))}</b><small>${esc(p.cargo||'')}${p.loja?' · '+esc(S.boot?.lojas?.[p.loja]?.nome||p.loja):''}</small></div>
        <input class="inp num r65-num" inputmode="tel" value="${esc(e.numero?(r65Tel(e.numero)||e.numero):'')}" placeholder="${p.telCadastro?'Cadastro: '+esc(r65Tel(p.telCadastro)):'WhatsApp dela'}" oninput="r65EqNum('${p.id}',this)">
        <button class="btn p r65-teste" ${R65.enviando||!num?'disabled':''} onclick="r65Teste(r65Num(R65.rasc.equipe['${p.id}'].numero)||'${esc(p.telCadastro)}','${esc(primeiroNome(p.nome))}')"><i class="ti ${R65.enviando===primeiroNome(p.nome)?'ti-loader-2':'ti-send'}"></i> Teste</button></div>
      <div class="r65-chips">${R65_EQ_TIPOS.map(([k,ic,t,s])=>r65Chip(e.tipos[k], ic, t, `r65Eq('${p.id}','${k}')`, s)).join('')}</div></div>`; }).join('');
  const hist = (D.hist||[]).slice(0,8).map(h=>`<li class="${h.ok?'':'erro'}"><small class="num">${esc(r65Quando(h.em))}</small> <i class="ti ${h.ok?'ti-check':'ti-alert-triangle'}"></i> ${esc(h.tipo)} → <b>${esc(h.para)}</b>${h.ok?'':' · '+esc(h.erro)}</li>`).join('');
  return `<div class="mod45-topo"><div><h2>📲 Relatórios no <mark>WhatsApp</mark></h2>
      <p>Relatório do dia quando o <b>último caixa fecha</b> (vendido, quem vendeu mais, lojas, pagamentos, meta e ponto) e um aviso a cada <b>ponto batido</b>. Sai do WhatsApp da loja. Nunca vai nome de cliente nem produto.</p></div>
      <div class="r65-geral ${geral?'on':''}" onclick="r65Geral()">${r65Sw(geral, 'event.stopPropagation();r65Geral()')}<div><b>${geral?'Ligado':'Desligado'}</b><small>chave geral</small></div></div></div>
    ${estado}
    <div class="r65-acoes"><button class="btn p" onclick="r65Previa()"><i class="ti ti-eye"></i> Ver prévia com os números de hoje</button><button class="btn p" onclick="r65Agora()" ${!geral||!D.chave?'disabled':''}><i class="ti ti-send"></i> Mandar o relatório agora</button></div>
    <section class="mod45-bloco r65-b"><h3>Quem recebe agora <small>administração</small></h3>${adm}
      <button class="btn p" style="margin-top:6px" onclick="r65AdmMais()"><i class="ti ti-plus"></i> Outro número</button></section>
    <section class="mod45-bloco r65-b"><h3>Colaboradoras <small>prontas para ligar — coloque o WhatsApp dela e ligue a chave</small></h3>${eq||'<p class="apagado">Nenhuma colaboradora ativa.</p>'}
      <p class="apagado" style="font-size:12.5px;margin:6px 2px 0">Sem número aqui, usa o WhatsApp do Cadastro da equipe. “Seu dia” só chega para quem tem meta ou vendeu no dia — e mostra só os números dela.</p></section>
    <section class="mod45-bloco r65-b"><h3>Ajustes</h3>
      <div class="r65-aj">
        <div class="campo"><label>Meta da equipe no relatório (R$)</label><input class="inp num" inputmode="numeric" value="${esc(C.meta_equipe||'')}" placeholder="soma das metas individuais" oninput="r65Ajuste('meta_equipe',this)"></div>
        <div class="campo"><label>Conta como atraso depois de (min)</label><input class="inp num" inputmode="numeric" value="${esc(C.tol_atraso??'')}" placeholder="5" oninput="r65Ajuste('tol_atraso',this)"></div>
      </div>
      <div class="r65-linha" onclick="r65Ajuste('sem_resumo_caixa')">${r65Sw(!C.sem_resumo_caixa, "event.stopPropagation();r65Ajuste('sem_resumo_caixa')")}<div><b>Resumo curto de cada fechamento</b><small>${C.sem_resumo_caixa?'Desligado — só chega o relatório do dia.':'Os avisos do caixa continuam mandando o resumo de cada loja (Caixa › Regras do caixa).'}</small></div></div>
      <div class="campo" style="margin-top:10px"><label>Chave do WhatsApp da loja (Evolution API) ${D.chave?'<span class="r65-pill ok" style="padding:2px 8px">✔ já colada</span>':'<span class="r65-pill ruim" style="padding:2px 8px">falta colar</span>'}</label>
        <input class="inp" type="password" autocomplete="off" placeholder="${D.chave?'Só cole de novo se a chave mudar':'Cole aqui a AUTHENTICATION_API_KEY da Evolution API'}" oninput="r65Chave(this)"><small class="apagado">É a mesma dos avisos do caixa. Fica guardada no servidor e não volta para a tela.</small></div>
    </section>
    ${hist?`<section class="mod45-bloco r65-b"><h3>Últimos envios</h3><ul class="r65-hist">${hist}</ul></section>`:''}
    <div class="mod45-salvar r65-salvar ${mudou?'on':''}"><span>${mudou?'Você mudou os relatórios.':'Tudo salvo.'}</span>
      <button class="btn r65-so-mudou" style="${mudou?'':'display:none'}" onclick="r65Desfazer()">Desfazer</button>
      <button class="btn pri r65-so-mudou" style="${mudou?'':'display:none'}" onclick="r65Salvar()"><i class="ti ti-device-floppy"></i> Salvar</button></div>`;
}

/* ───────── encaixe na Administração (Comunicação, perfil Matheus) ───────── */
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='comunic'); if(a && !a.k.includes('relatorios')){ const i = a.k.indexOf('avisos'); a.k.splice(i>=0?i+1:1, 0, 'relatorios'); } NOMES34.relatorios = 'Relatórios no WhatsApp'; }
if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('mural')); if(g && !g.k.includes('relatorios')) g.k.splice(g.k.indexOf('mural')+1, 0, 'relatorios'); if(typeof NOMES12!=='undefined') NOMES12.admin.relatorios = 'Relatórios no WhatsApp'; }
if(typeof TEC29!=='undefined' && !TEC29.includes('relatorios')) TEC29.push('relatorios');
const _telaAdminV65 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm; if(!A) return _telaAdminV65.apply(this, arguments);
  if(A.perfil==='madu' && A.tab==='relatorios') A.tab = 'central';
  const aqui = A.tab === 'relatorios', marca = '<!--r65-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV65.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'relatorios'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + r65Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV65.apply(this, arguments);
  if(A.perfil!=='madu'){
    const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='relatorios';TR=null;render()"><i class="ti ti-report-analytics"></i> Relatórios </button>`;
    h = h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
  }
  return h;
};
if(typeof itensBusca==='function'){
  const _ibV65 = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ibV65.apply(this, arguments);
    if(S.adm && S.tela==='admin' && S.adm.perfil!=='madu') r.unshift({t:'Relatórios no WhatsApp', s:'Relatório do dia e ponto no WhatsApp — Madu, Matheus e equipe', i:'ti-report-analytics', go:()=>{ S.adm.tab='relatorios'; render(); }});
    return r;
  };
}

document.head.insertAdjacentHTML('beforeend', `<style>
.r65-geral{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--linha);border-radius:18px;padding:10px 16px;box-shadow:var(--sh);cursor:pointer;transition:transform .15s,border-color .25s}
.r65-geral:hover{transform:translateY(-2px)}.r65-geral.on{border-color:#22A55A}.r65-geral b{display:block;font-size:16px}.r65-geral small{font-size:12px;color:var(--creme3)}
.r65-estado{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}
.r65-pill{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;background:#fff;border:1px solid var(--linha);border-radius:99px;padding:6px 12px;color:var(--creme2)}
.r65-pill.ok{background:#E8F7EE;border-color:rgba(34,165,90,.3);color:#17773F}.r65-pill.ruim{background:var(--vermelho-claro,#FDE8EA);border-color:rgba(227,16,31,.3);color:var(--vermelho2,#B30A17)}
.r65-acoes{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.r65-acoes .btn{display:inline-flex;align-items:center;gap:6px;transition:transform .15s}.r65-acoes .btn:hover:not([disabled]){transform:translateY(-2px)}
.r65-b h3 small{font-size:11.5px;font-weight:600;letter-spacing:0;text-transform:none}
.r65-pessoa{border:1px solid var(--linha);border-radius:16px;padding:10px 12px;margin:0 0 8px;transition:opacity .25s,background .25s;animation:mod45e .4s both}
.r65-pessoa.off{background:var(--veludo2,#F8F5F6)}.r65-pessoa.off .r65-chips{opacity:.5}
.r65-p-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.r65-nome{flex:0 1 150px;min-width:110px}.r65-num{flex:1 1 170px;min-width:150px}.r65-teste{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.r65-av{width:34px;height:34px;border-radius:12px;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.r65-quem{flex:0 1 150px;min-width:100px}.r65-quem b{display:block;font-size:15px}.r65-quem small{font-size:12px;color:var(--creme3)}
.r65-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.r65-chip{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;padding:6px 11px;border-radius:99px;border:1px dashed var(--linha2);color:var(--creme2);transition:transform .15s,background .2s,color .2s}
.r65-chip:hover{transform:translateY(-1px)}.r65-chip:active{transform:scale(.96)}
.r65-chip.on{background:var(--vermelho,#E3101F);border:1px solid var(--vermelho,#E3101F);color:#fff}
.r65-chip:focus-visible{outline:2px solid var(--vermelho);outline-offset:2px}
.r65-aj{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.r65-linha{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;cursor:pointer}.r65-linha:hover{background:var(--noite)}.r65-linha b{display:block;font-size:14.5px}.r65-linha small{display:block;font-size:12.5px;color:var(--creme3)}
.r65-hist{list-style:none;margin:0;padding:0;font-size:13px}.r65-hist li{padding:5px 0;border-bottom:1px solid var(--linha)}.r65-hist li:last-child{border:0}.r65-hist li.erro{color:var(--vermelho2)}.r65-hist .ti-check{color:#22A55A}
.r65-salvar:not(.on){display:none}
.r65-modal{max-width:460px}
.r65-zap-fundo{background:#ECE5DD;border-radius:16px;padding:12px;max-height:62vh;overflow:auto}
.r65-rot{font-size:11.5px;font-weight:800;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.06em;margin:10px 4px 4px}.r65-rot:first-child{margin-top:0}
.r65-balao{background:#fff;border-radius:4px 14px 14px 14px;padding:9px 11px;font-size:14px;line-height:1.45;color:#111;box-shadow:0 1px 1px rgba(0,0,0,.12);word-wrap:break-word}
@media (max-width:560px){.r65-nome,.r65-quem{flex:1 1 120px}.r65-num{flex:1 1 100%}.r65-teste{flex:1}}
</style>`);
