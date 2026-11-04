/* ═══════════ Portal Equipe Las Vegas · v47 — Relatório de vendas da equipe + cancelamento com motivo ═══════════
   Pedido da Madu (04/11): "um botão de relatório de vendas, com o histórico das vendas do dia, da semana, do mês, para que elas
   mesmas possam acessar, rever e verificar; e o botão, caso faça errada, apagar (mas não do histórico) em até 15 minutos.
   Depois disso tem que mandar pra administração cancelar e registrar o motivo do cancelamento."
   • Vendedora: botão "Minhas vendas" no Início e no PDV → Hoje / Semana / Mês, Minhas ou Loja toda, total, nº de vendas,
     ticket médio, barras por dia, lista com os itens. Em cada venda dela: Desfazer (até 15 min, contagem regressiva, motivo
     obrigatório) ou, depois, "Pedir cancelamento" com motivo → acompanha: aguardando / cancelada / recusada (com a resposta).
     Venda desfeita ou cancelada continua na lista, riscada, com quem cancelou e o motivo.
   • Administração: Vendas › PDV › aba "Cancelamentos" (contador) — aprovar (cancela, devolve estoque e tira da meta) ou recusar
     com resposta; histórico de quem decidiu. Item no "Precisa de mim hoje". Na venda aberta aparece o pedido com os botões.
   Servidor: VENDAS.gs. Sem ele: o relatório funciona, só o "Pedir cancelamento" avisa que falta publicar.
   Nomes internos: VR47/vr47… */

const VR47 = { per:'hoje', quem:'minhas', aberta:null, mot:null, tick:null };
const VR47_MOTIVOS = ['Errei o produto', 'Errei a quantidade', 'Errei a forma de pagamento', 'Cliente desistiu', 'Venda lançada duas vezes', 'Troca ou devolução'];

function vr47Lim(){ return pdvD().cfg?.cancelar_min ?? 15; }
function vr47Feita(v){ return new Date(String(v.criada_em).replace(' ','T')+'-05:00').getTime(); }
function vr47Resta(v){   // ms que ainda faltam para ela mesma desfazer (0 = acabou)
  if(v.status==='cancelada' || v.colaboradora_id!==S.sess?.eid || v.data!==hojeISO()) return 0;
  return Math.max(0, vr47Feita(v) + vr47Lim()*60000 - agoraServidor().getTime());
}
function vr47Pedido(v){ return (pdvD().pedidosCancel||[]).find(p=>p.venda_id===v.id && p.status==='pendente') || (pdvD().pedidosCancel||[]).find(p=>p.venda_id===v.id); }
function vr47Periodo(per){
  const hoje = hojeISO();
  if(per==='hoje') return {de:hoje, ate:hoje, nome:'Hoje', sub:dataLonga(hoje)};
  if(per==='semana'){ const seg = addDays(hoje, -((dow(hoje)+6)%7)); return {de:seg, ate:hoje, nome:'Semana', sub:`${ddmm(seg)} a ${ddmm(hoje)}`}; }
  return {de:mesDe(hoje)+'-01', ate:hoje, nome:'Mês', sub:nomeMes(mesDe(hoje))};
}
function vr47Lista(){
  const P = pdvD(), eid = S.sess.eid, R = vr47Periodo(VR47.per), loja = vr47MinhaLoja();
  return P.vendas.filter(v=>v.data>=R.de && v.data<=R.ate && (VR47.quem==='minhas' ? v.colaboradora_id===eid : v.loja===loja))
    .sort((a,b)=>String(b.criada_em).localeCompare(String(a.criada_em)));
}
function vr47MinhaLoja(){
  const d = S.sess.dados, hoje = hojeISO();
  const p = (d.pontos||[]).find(x=>x.colaboradora_id===S.sess.eid && x.data===hoje && x.loja);
  return p?.loja || d.colaboradora?.loja || Object.keys(S.boot?.lojas||{})[0];
}
function vr47Origem(v){ return v.origem==='kommo' ? '<span class="vr47-tag kom"><i class="ti ti-brand-whatsapp"></i> Kommo</span>' : ''; }

/* ───────── a janela ───────── */
function vr47Abrir(per){
  if(per) VR47.per = per;
  VR47.aberta = null; vr47Pintar();
  clearInterval(VR47.tick); VR47.tick = setInterval(vr47Contar, 1000);
}
function vr47Fechar(){ clearInterval(VR47.tick); VR47.tick = null; fecharModal(); }
function vr47Pintar(){
  const P = pdvD(), R = vr47Periodo(VR47.per), lista = vr47Lista(), ok = lista.filter(v=>v.status!=='cancelada');
  const tot = ok.reduce((s,v)=>s+v.total,0), pecas = ok.reduce((s,v)=>s+(v.qtd_itens||0),0), canc = lista.length-ok.length;
  const lojaNome = S.boot?.lojas?.[vr47MinhaLoja()]?.nome || '';
  const pend = (P.pedidosCancel||[]).filter(p=>p.status==='pendente').length;
  // barras por dia (semana e mês)
  let barras = '';
  if(VR47.per!=='hoje'){
    const dias = []; for(let d=R.de; d<=R.ate; d=addDays(d,1)) dias.push(d);
    const porDia = {}; ok.forEach(v=>porDia[v.data]=(porDia[v.data]||0)+v.total);
    const max = Math.max(1, ...dias.map(d=>porDia[d]||0));
    barras = `<div class="vr47-dias ${dias.length>10?'mes':''}">${dias.map((d,i)=>`<button class="vr47-dia ${d===hojeISO()?'hoje':''}" style="--d:${i*25}ms" title="${ddmm(d)} · ${brl2(porDia[d]||0)}" onclick="vr47IrDia('${d}')">
        <span class="vr47-col"><i style="--h:${Math.max(porDia[d]?6:0, (porDia[d]||0)/max*100)}%"></i></span><small>${dias.length>10?d.slice(8):semana(d).slice(0,3)}</small></button>`).join('')}</div>`;
  }
  // lista agrupada por dia
  const grupos = {}; lista.forEach(v=>(grupos[v.data]=grupos[v.data]||[]).push(v));
  const corpo = lista.length ? Object.keys(grupos).sort().reverse().map(d=>{
      const g = grupos[d], s = g.filter(v=>v.status!=='cancelada').reduce((x,v)=>x+v.total,0);
      return `<div class="vr47-gr" id="vr47-${d}"><div class="vr47-gt"><b>${d===hojeISO()?'Hoje':esc(dataLonga(d))}</b><span>${g.filter(v=>v.status!=='cancelada').length} venda(s) · <b class="num">${brl2(s)}</b></span></div>
        ${g.map((v,i)=>vr47Card(v,i)).join('')}</div>`;
    }).join('')
    : `<div class="vr47-vazio">${VR47.per==='hoje'?'Nenhuma venda hoje ainda. Bora vender! 💃':'Nenhuma venda neste período.'}</div>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)vr47Fechar()"><div class="modal largo vr47">
    <div class="modal-t"><h3 class="cresce"><i class="ti ti-report-analytics"></i> ${VR47.quem==='minhas'?'Minhas vendas':'Vendas da loja '+esc(lojaNome)}</h3><button class="icone" aria-label="Fechar" onclick="vr47Fechar()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="vr47-filtros">
        <div class="vr47-seg">${['hoje','semana','mes'].map(k=>`<button class="${VR47.per===k?'on':''}" onclick="VR47.per='${k}';VR47.aberta=null;vr47Pintar()">${vr47Periodo(k).nome}</button>`).join('')}</div>
        <div class="vr47-seg pq">${[['minhas','Minhas'],['loja','Loja toda']].map(([k,n])=>`<button class="${VR47.quem===k?'on':''}" onclick="VR47.quem='${k}';VR47.aberta=null;vr47Pintar()">${n}</button>`).join('')}</div>
      </div>
      <p class="vr47-sub">${esc(R.sub)}${VR47.quem==='loja'?' · loja '+esc(lojaNome):''}</p>
      ${pend && VR47.quem==='minhas' ? `<div class="vr47-aviso"><i class="ti ti-hourglass"></i> ${pend===1?'1 pedido de cancelamento esperando':pend+' pedidos de cancelamento esperando'} a administração</div>` : ''}
      <div class="vr47-nums">
        <div class="vr47-n vr47-dest"><small>Total vendido</small><b class="num" data-vr47-conta="${tot}">${brl2(tot)}</b></div>
        <div class="vr47-n"><small>Vendas</small><b class="num">${ok.length}</b>${canc?`<span>${canc} desfeita(s)/cancelada(s)</span>`:''}</div>
        <div class="vr47-n"><small>Ticket médio</small><b class="num">${ok.length?brl2(tot/ok.length):'—'}</b></div>
        <div class="vr47-n"><small>Peças</small><b class="num">${pecas}</b>${ok.length?`<span>${(pecas/ok.length).toFixed(1).replace('.',',')} por venda</span>`:''}</div>
      </div>
      ${barras}
      <div class="vr47-lista">${corpo}</div>
      <p class="apagado vr47-regra"><i class="ti ti-info-circle"></i> Errou? Você mesma desfaz a sua venda até <b>${vr47Lim()} minutos</b> depois. Passou disso, toque em <b>Pedir cancelamento</b> e conte o motivo — a administração cancela. Nada some: tudo fica no histórico.</p>
    </div></div></div>`;
  vr47Contar();
}
function vr47Card(v, i){
  const minha = v.colaboradora_id===S.sess.eid, aberta = VR47.aberta===v.id, ped = minha ? vr47Pedido(v) : null;
  const canc = v.status==='cancelada', resta = vr47Resta(v);
  let selo = '';
  if(canc) selo = `<span class="vr47-tag bad">${v.cancelada_por===v.colaboradora ? 'desfeita' : 'cancelada'}</span>`;
  else if(ped?.status==='pendente') selo = `<span class="vr47-tag warn"><i class="ti ti-hourglass"></i> cancelamento pedido</span>`;
  else if(ped?.status==='recusado') selo = `<span class="vr47-tag">cancelamento recusado</span>`;
  else if(resta) selo = `<span class="vr47-tag tempo" data-vr47-t="${v.id}"></span>`;
  const detalhe = aberta ? `<div class="vr47-det">
      <div class="vr47-itens">${v.itens.map(x=>`<div><span>${x.qtd}×</span><b>${esc(x.nome)}</b><span class="num">${brl2(x.preco*x.qtd)}</span></div>`).join('')}</div>
      <div class="vr47-tot">Subtotal ${brl2(v.subtotal)}${v.desconto?` · desconto <b class="neg">− ${brl2(v.desconto)}</b>`:''} · <b>Total ${brl2(v.total)}</b> · ${FORMAS[v.pagamento]?.n||esc(v.pagamento)}${v.parcelas>1?' '+v.parcelas+'×':''}${v.cliente?' · cliente '+esc(v.cliente):''}</div>
      ${canc ? `<div class="vr47-hist bad"><i class="ti ti-ban"></i><div><b>${esc(v.cancelada_por||'')}</b> em ${esc(quando(v.cancelada_em))}<br>Motivo: ${esc(v.motivo_cancel||'—')}</div></div>` : ''}
      ${ped && !canc ? `<div class="vr47-hist ${ped.status==='recusado'?'':'warn'}"><i class="ti ${ped.status==='recusado'?'ti-message-reply':'ti-hourglass'}"></i><div>
          Você pediu o cancelamento em ${esc(quando(ped.pedido_em))}: “${esc(ped.motivo)}”<br>
          ${ped.status==='pendente'?'Esperando a administração.':`<b>Recusado</b> por ${esc(ped.decidido_por)}: ${esc(ped.resposta)}`}</div></div>` : ''}
      <div class="vr47-acoes">
        ${!canc ? `<button class="btn" onclick="pdvComprovante('${v.id}')"><i class="ti ti-brand-whatsapp"></i> Comprovante</button><button class="btn" onclick="pdvCupom('${v.id}')"><i class="ti ti-printer"></i> Cupom</button>` : ''}
        ${minha && !canc && resta ? `<button class="btn vr47-desf" onclick="vr47Motivo('${v.id}','desfazer')"><i class="ti ti-arrow-back-up"></i> Desfazer venda</button>` : ''}
        ${minha && !canc && !resta && ped?.status!=='pendente' ? `<button class="btn vr47-pedir" onclick="vr47Motivo('${v.id}','pedir')"><i class="ti ti-send"></i> Pedir cancelamento</button>` : ''}
      </div></div>` : '';
  return `<div class="vr47-v ${canc?'canc':''} ${aberta?'aberta':''}" style="--d:${Math.min(i,12)*35}ms">
    <button class="vr47-vt" onclick="VR47.aberta=VR47.aberta==='${v.id}'?null:'${v.id}';vr47Pintar()" aria-expanded="${aberta}">
      <span class="vr47-ic" style="--c:${FORMAS[v.pagamento]?.c||'#999'}"><i class="ti ${FORMAS[v.pagamento]?.i||'ti-receipt'}"></i></span>
      <span class="vr47-vm"><b>#${v.numero} · ${esc(v.hora)}${VR47.quem==='loja'?' · '+esc(primeiroNome(v.colaboradora)):''}</b>
        <small>${esc(v.itens.map(x=>x.qtd+'× '+x.nome).join(', '))}</small><span class="vr47-selos">${selo}${vr47Origem(v)}</span></span>
      <b class="num vr47-val">${brl2(v.total)}</b><i class="ti ti-chevron-down vr47-seta"></i>
    </button>${detalhe}</div>`;
}
function vr47IrDia(d){ const el = document.getElementById('vr47-'+d); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); else toast('Sem vendas em '+ddmm(d)); }
function vr47Contar(){
  if(!document.querySelector('.vr47')){ clearInterval(VR47.tick); VR47.tick = null; return; }
  let acabou = false;
  document.querySelectorAll('[data-vr47-t]').forEach(el=>{
    const v = pdvAchar(el.dataset.vr47T); const r = v ? vr47Resta(v) : 0;
    if(!r){ acabou = true; return; }
    const m = Math.floor(r/60000), s = Math.floor(r%60000/1000);
    el.innerHTML = `<i class="ti ti-clock"></i> desfazer: ${m}:${String(s).padStart(2,'0')}`;
  });
  if(acabou && !VR47.mot) vr47Pintar();
}

/* ───────── motivo (desfazer ou pedir) ───────── */
function vr47Motivo(id, tipo){
  const v = pdvAchar(id); if(!v) return;
  VR47.mot = {id, tipo};
  const pedir = tipo==='pedir';
  document.getElementById('vr47-mot')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div id="vr47-mot" class="vr47-mveu" onclick="if(event.target===this)vr47MotFechar()"><div class="vr47-mcx" role="dialog">
    <h3>${pedir?'<i class="ti ti-send"></i> Pedir cancelamento':'<i class="ti ti-arrow-back-up"></i> Desfazer venda'} #${v.numero}</h3>
    <p class="suave">${brl2(v.total)} · ${esc(v.hora)} · ${esc(v.itens.map(x=>x.qtd+'× '+x.nome).join(', ')).slice(0,120)}</p>
    <p class="vr47-mexp">${pedir?'Já passou de '+vr47Lim()+' minutos: a administração vai analisar e cancelar. Você acompanha aqui em Minhas vendas.':'A venda sai da sua meta e o estoque volta. Ela continua no histórico como desfeita.'}</p>
    <label for="vr47-mtxt"><b>Motivo</b> (obrigatório)</label>
    <div class="vr47-mchips">${VR47_MOTIVOS.map(m=>`<button onclick="const t=document.getElementById('vr47-mtxt');t.value='${m}';t.focus()">${m}</button>`).join('')}</div>
    <textarea id="vr47-mtxt" class="inp" rows="2" maxlength="200" placeholder="Conte o que aconteceu"></textarea>
    <div class="vr47-mbt"><button class="btn" onclick="vr47MotFechar()">Voltar</button><button class="btn pri" id="vr47-mok" onclick="vr47MotEnviar()">${pedir?'<i class="ti ti-send"></i> Enviar pedido':'<i class="ti ti-arrow-back-up"></i> Desfazer'}</button></div>
  </div></div>`);
  setTimeout(()=>document.getElementById('vr47-mtxt')?.focus(), 80);
}
function vr47MotFechar(){ VR47.mot = null; document.getElementById('vr47-mot')?.remove(); }
async function vr47MotEnviar(){
  const M = VR47.mot; if(!M) return;
  const motivo = (document.getElementById('vr47-mtxt')?.value||'').trim();
  if(motivo.length < 3){ toast('Escreva o motivo', true); document.getElementById('vr47-mtxt')?.focus(); return; }
  const bt = document.getElementById('vr47-mok'); if(bt){ bt.disabled = true; bt.innerHTML = '<i class="ti ti-loader-2"></i> Enviando…'; }
  try{
    const extra = M.tipo==='pedir' ? {pedirCancel:1} : {cancelar:1};
    S.sess.dados = await api('venda', {eid:S.sess.eid, ...S.sess.cred, pdv:1, id:M.id, motivo, ...extra});
    vr47MotFechar(); VR47.aberta = M.id; render(); vr47Pintar();
    toast(M.tipo==='pedir' ? 'Pedido enviado ✔ A administração vai analisar.' : 'Venda desfeita ✔ A meta já foi ajustada.');
  }catch(e){
    if(bt){ bt.disabled = false; bt.innerHTML = M.tipo==='pedir' ? '<i class="ti ti-send"></i> Enviar pedido' : '<i class="ti ti-arrow-back-up"></i> Desfazer'; }
    toast(/desconhecida|não encontrada/i.test(e.message) && M.tipo==='pedir' && !pdvD().pedidosCancel ? 'O pedido de cancelamento ainda não foi ligado no servidor. Avise a administração.' : e.message, true);
  }
}

/* o antigo "Minhas vendas de hoje" do PDV abre o relatório novo (resolve também a janela espremida no celular) */
pdvMinhasHoje = function(){ vr47Abrir('hoje'); };
pdvDesfazer = function(id){ vr47Motivo(id, 'desfazer'); };

/* ───────── Início da vendedora: atalho "Minhas vendas" ───────── */
function vr47Atalho(){
  if(S.tela!=='portal' || !S.sess?.dados || (typeof mod45On==='function' && !mod45On('pdv'))) return '';
  const P = pdvD(); if(P.semServidor) return '';
  const hoje = hojeISO(), eid = S.sess.eid;
  const h = P.vendas.filter(v=>v.data===hoje && v.colaboradora_id===eid && v.status!=='cancelada');
  const ped = (P.pedidosCancel||[]), pend = ped.filter(p=>p.status==='pendente').length;
  const nov = ped.filter(p=>p.status!=='pendente' && String(p.decidido_em).slice(0,10) >= addDays(hoje,-2)).length;
  const extra = pend ? `<span class="vr47-at-av warn"><i class="ti ti-hourglass"></i> ${pend} cancelamento${pend>1?'s':''} esperando</span>`
    : nov ? `<span class="vr47-at-av"><i class="ti ti-message-reply"></i> resposta da administração</span>` : '';
  return `<button class="vr47-at" onclick="vr47Abrir('hoje')"><span class="vr47-at-ic"><i class="ti ti-report-analytics"></i></span>
    <span class="cresce"><b>Minhas vendas</b><small>Hoje: ${h.length} venda${h.length===1?'':'s'} · <b class="num">${brl2(h.reduce((s,v)=>s+v.total,0))}</b> · ver dia, semana e mês</small>${extra}</span>
    <i class="ti ti-chevron-right"></i></button>`;
}
if(typeof portalInicio==='function'){
  const _portalInicioV47 = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioV47.apply(this, arguments);
    let a = ''; try{ a = vr47Atalho(); }catch(e){ console.warn('v47', e); }
    if(!a) return h;
    const i = h.indexOf('</section>', h.indexOf('class="mm46"'));               // logo depois do cartão "Minha meta"
    if(h.indexOf('class="mm46"') >= 0 && i >= 0) return h.slice(0, i+10) + a + h.slice(i+10);
    const j = h.indexOf('class="suave"'), f = j >= 0 ? h.indexOf('</div>', j) : -1;
    return f >= 0 ? h.slice(0, f+6) + a + h.slice(f+6) : a + h;
  };
}

/* ───────── "Tirar dúvida": respostas atualizadas ───────── */
if(typeof AJ46_GUIA!=='undefined'){
  const g = AJ46_GUIA.find(x=>x.id==='desfazer-venda');
  if(g){ g.s = ['Toque em "Minhas vendas" (no Início ou no PDV) e toque na venda.','Até 15 minutos depois: toque em "Desfazer venda", escolha o motivo e confirme. A venda fica no histórico como desfeita.','Depois de 15 minutos: toque em "Pedir cancelamento", conte o motivo e envie. A administração analisa e você acompanha a resposta ali mesmo.'];
    g.p += ' pedir cancelamento motivo 15 minutos administracao'; g.ir = 'fn:vr47Abrir("hoje")'; }
  AJ46_GUIA.splice(5, 0, {id:'relatorio-vendas', t:'Ver minhas vendas (dia, semana e mês)', p:'relatorio vendas historico minhas vendas hoje semana mes conferir rever quanto vendi total ticket', s:['Toque em "Minhas vendas" no Início (ou no PDV).','Escolha Hoje, Semana ou Mês — e Minhas ou Loja toda.','Toque numa venda para ver os itens, mandar o comprovante, desfazer ou pedir cancelamento.'], ir:'fn:vr47Abrir("hoje")', v:'03'});
}

/* ═════════════════ ADMINISTRAÇÃO ═════════════════ */
function vr47Por(){ return S.adm?.perfil==='matheus' ? 'Matheus' : 'Madu'; }
function vr47PendAdm(){ return ((S.adm?.dados?.pdv||{}).pedidosCancel||[]).filter(p=>p.status==='pendente'); }

function vr47AdmTela(){
  const P = pdvD(), L = P.pedidosCancel;
  if(!L) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>Falta publicar o VENDAS.gs no servidor.</b> Sem ele as vendedoras não conseguem pedir cancelamento.</div></div>`;
  const pend = L.filter(p=>p.status==='pendente'), feitos = L.filter(p=>p.status!=='pendente');
  const equipe = S.adm.dados.colaboradoras || [], colab = id => equipe.find(c=>c.id===id) || {id, nome:'?', cor:'#ccc'};
  const card = (p, i) => { const v = pdvAchar(p.venda_id);
    return `<div class="vr47-pc ${p.status}" style="--d:${i*50}ms">${avatar(colab(p.colaboradora_id),'',38)}
      <div class="cresce"><b>${esc(primeiroNome(p.colaboradora))} · venda #${p.numero} · ${brl2(p.total)}</b>
        <small>Venda de ${ddmm(p.data_venda)} às ${esc(p.hora_venda)} · Loja ${esc(S.boot.lojas[p.loja]?.nome||p.loja)} · pedido ${esc(quando(p.pedido_em))}</small>
        ${v?`<small class="vr47-pc-it">${esc(v.itens.map(x=>x.qtd+'× '+x.nome).join(', '))} · ${FORMAS[v.pagamento]?.n||esc(v.pagamento)}</small>`:''}
        <div class="vr47-pc-mot"><i class="ti ti-quote"></i> ${esc(p.motivo)}</div>
        ${p.status!=='pendente'?`<small class="vr47-pc-dec">${p.status==='aprovado'?'✅ Cancelada':'❌ Recusado'} por ${esc(p.decidido_por)} em ${esc(quando(p.decidido_em))}${p.resposta?' · '+esc(p.resposta):''}</small>`:''}
      </div>
      ${p.status==='pendente'?`<div class="vr47-pc-bt"><button class="btn pri" onclick="vr47Decidir('${p.id}',true)"><i class="ti ti-check"></i> Cancelar a venda</button><button class="btn" onclick="vr47Decidir('${p.id}',false)"><i class="ti ti-x"></i> Recusar</button>${v?`<button class="btn p" onclick="admPdvVer('${v.id}')">Ver venda</button>`:''}</div>`:''}
    </div>`; };
  return `<h2 class="secao">Pedidos de cancelamento <small>a vendedora pede quando passou de ${vr47Lim()} minutos</small></h2>
    ${pend.length?`<div class="vr47-pcs">${pend.map(card).join('')}</div>`:'<div class="vr47-vazio">Nenhum pedido esperando ✨</div>'}
    <h2 class="secao">Decididos nos últimos 30 dias</h2>
    ${feitos.length?`<div class="vr47-pcs">${feitos.slice(0,60).map(card).join('')}</div>`:'<p class="suave">Nada ainda.</p>'}
    <p class="apagado" style="font-size:13px;margin-top:10px">Cancelar devolve o estoque, tira da meta da vendedora e ajusta fidelidade/cashback da cliente. A venda continua no histórico com quem cancelou e o motivo.</p>`;
}
async function vr47Decidir(id, aprovar){
  const p = vr47PendAdm().find(x=>x.id===id); if(!p) return;
  let resposta = prompt(aprovar ? `Cancelar a venda #${p.numero} (${brl2(p.total)}) da ${primeiroNome(p.colaboradora)}?\n\nMotivo dela: ${p.motivo}\n\nObservação (opcional):` : `Por que recusar? (a ${primeiroNome(p.colaboradora)} vê esta resposta)`, '');
  if(resposta===null) return; resposta = resposta.trim();
  if(!aprovar && resposta.length < 3){ toast('Escreva a resposta para ela', true); return; }
  try{ S.adm.dados = await api('admPdvPedidoCancel', {...S.adm.cred, id, aprovar:!!aprovar, resposta, por:vr47Por()}); fecharModal(); render();
    toast(aprovar ? 'Venda cancelada ✔ Meta e estoque ajustados.' : 'Pedido recusado ✔ Ela vê a resposta.'); }
  catch(e){ toast(e.message, true); }
}

/* aba "Cancelamentos" dentro de Vendas › PDV */
if(typeof admPDV==='function'){
  const _admPDVV47 = admPDV;
  admPDV = function admPDV(){
    const A = S.adm, aqui = A.pdvSub==='cancel', n = vr47PendAdm().length;
    let h;
    if(aqui){ const orig = admPdvVendas; admPdvVendas = vr47AdmTela; A.pdvSub = 'vendas';
      try{ h = _admPDVV47.apply(this, arguments); } finally { admPdvVendas = orig; A.pdvSub = 'cancel'; }
      h = h.replace(`class="on" onclick="S.adm.pdvSub='vendas'`, `class="" onclick="S.adm.pdvSub='vendas'`);
    } else h = _admPDVV47.apply(this, arguments);
    const bt = `<button class="${aqui?'on':''}" onclick="S.adm.pdvSub='cancel';render()"><i class="ti ti-receipt-off"></i>Cancelamentos${n?` <span class="contador">${n}</span>`:''}</button>`;
    return h.replace(/(<div class="pdv-sub">[\s\S]*?)(<\/div>)/, (m, a, b) => a + bt + b);
  };
}
/* na venda aberta pela administração: o pedido aparece com os botões */
if(typeof admPdvVer==='function'){
  const _admPdvVerV47 = admPdvVer;
  admPdvVer = function admPdvVer(id){
    _admPdvVerV47.apply(this, arguments);
    const p = vr47PendAdm().find(x=>x.venda_id===id), c = document.querySelector('#modal .modal-c'); if(!p || !c) return;
    c.insertAdjacentHTML('afterbegin', `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-hourglass"></i><div><b>${esc(primeiroNome(p.colaboradora))} pediu o cancelamento</b> em ${esc(quando(p.pedido_em))}: “${esc(p.motivo)}”
      <div class="linha quebra" style="gap:6px;margin-top:8px"><button class="btn pri" onclick="vr47Decidir('${p.id}',true)"><i class="ti ti-check"></i> Cancelar a venda</button><button class="btn" onclick="vr47Decidir('${p.id}',false)"><i class="ti ti-x"></i> Recusar</button></div></div></div>`);
  };
}
/* cancelamento direto pela administração: registra quem cancelou (Madu ou Matheus) */
admPdvCancelar = async function admPdvCancelar(id){
  const motivo = prompt('Motivo do cancelamento (fica registrado):'); if(!motivo || !motivo.trim()) return;
  try{ S.adm.dados = await api('admPdvCancelar', {...S.adm.cred, id, motivo, por:vr47Por()}); fecharModal(); render(); toast('Venda cancelada ✔ Meta ajustada.'); }
  catch(e){ toast(e.message, true); }
};
/* "O que precisa de mim hoje" */
if(typeof itens34==='function'){
  const _itens34V47 = itens34;
  itens34 = function itens34(){
    const I = _itens34V47.apply(this, arguments);
    try{ const p = vr47PendAdm();
      if(p.length) I.unshift({c:'warn', i:'ti-receipt-off', t:`${p.length===1?'1 pedido':p.length+' pedidos'} de cancelamento de venda`,
        s:p.slice(0,3).map(x=>`${primeiroNome(x.colaboradora)} · #${x.numero} ${brl2(x.total)}`).join(' · ') + (p.length>3?' …':''), b:'Decidir', go:()=>{ S.adm.tab='pdv'; S.adm.pdvSub='cancel'; }});
    }catch(e){}
    return I;
  };
}

document.head.insertAdjacentHTML('beforeend', `<style>
.vr47-at{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:14px 16px;border-radius:20px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh);cursor:pointer;animation:vr47e .45s cubic-bezier(.2,.8,.2,1) both;transition:transform .15s,border-color .15s}
.vr47-at:hover{transform:translateY(-2px);border-color:var(--vermelho)}.vr47-at:active{transform:scale(.98)}
.vr47-at-ic{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;background:linear-gradient(135deg,#1d1d1f,#4a3d40);flex-shrink:0;animation:vr47p 2.8s ease-in-out infinite}
.vr47-at b{display:block;font-size:16px}.vr47-at small{display:block;font-size:13px;color:var(--creme3)}.vr47-at small b{display:inline;font-size:13px;color:var(--vermelho)}
.vr47-at>.ti-chevron-right{font-size:20px;color:var(--creme3);animation:vr47s 1.8s ease-in-out infinite}
.vr47-at-av{display:inline-flex;align-items:center;gap:4px;margin-top:5px;font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px;background:rgba(26,127,75,.1);color:var(--ok,#1a7f4b)}.vr47-at-av.warn{background:#fff4dc;color:#a86b00}
.vr47 .modal-c{padding-top:6px}.vr47 h3 i{color:var(--vermelho)}
.vr47-filtros{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between}
.vr47-seg{display:flex;gap:3px;background:var(--noite);border-radius:99px;padding:3px}.vr47-seg button{border:0;background:none;font:inherit;font-size:14px;font-weight:800;padding:8px 16px;border-radius:99px;cursor:pointer;color:var(--creme2);transition:background .2s,color .2s}
.vr47-seg button.on{background:#fff;color:var(--vermelho);box-shadow:var(--sh)}.vr47-seg.pq button{font-size:13px;padding:7px 12px}
.vr47-sub{margin:8px 2px 10px;font-size:13px;color:var(--creme3)}
.vr47-aviso{display:flex;gap:6px;align-items:center;background:#fff4dc;color:#7a4e00;border-radius:12px;padding:8px 12px;font-size:13.5px;font-weight:700;margin-bottom:10px}
.vr47-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}@media (max-width:620px){.vr47-nums{grid-template-columns:1fr 1fr}}
.vr47-n{background:var(--noite);border-radius:16px;padding:10px 12px;animation:vr47e .4s both}.vr47-n small{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--creme3)}
.vr47-n b{display:block;font-size:clamp(17px,4.6vw,20px);font-weight:900;margin-top:2px;white-space:nowrap}.vr47-n span{font-size:11.5px;color:var(--creme3)}
.vr47-n.vr47-dest{display:block;background:linear-gradient(135deg,#E3101F,#8f0a14);color:#fff}.vr47-n.vr47-dest small{color:rgba(255,255,255,.8)}.vr47-n.vr47-dest b{color:#FFD15C}
.vr47-dias{display:flex;gap:4px;align-items:flex-end;height:96px;margin:0 0 12px;padding:8px 6px 0;background:var(--noite);border-radius:16px;overflow-x:auto}
.vr47-dia{all:unset;flex:1;min-width:16px;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;cursor:pointer;animation:vr47e .35s both;animation-delay:var(--d)}
.vr47-col{flex:1;width:100%;max-width:34px;display:flex;align-items:flex-end}.vr47-col i{display:block;width:100%;height:var(--h);border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#F5B524,#E3101F);animation:vr47h .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d)}
.vr47-dia small{font-size:10.5px;color:var(--creme3);padding-bottom:4px}.vr47-dia.hoje small{color:var(--vermelho);font-weight:900}.vr47-dia:hover .vr47-col i{filter:brightness(1.15)}
.vr47-gr{margin-bottom:12px;scroll-margin-top:10px}.vr47-gt{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:4px 2px 6px;font-size:13.5px;border-bottom:1px solid var(--linha);margin-bottom:6px}.vr47-gt span{color:var(--creme3);white-space:nowrap}.vr47-gt span b{color:var(--creme1,inherit)}
.vr47-v{border:1px solid var(--linha);border-radius:16px;margin-bottom:6px;background:#fff;overflow:hidden;animation:vr47e .35s both;animation-delay:var(--d);transition:border-color .15s,box-shadow .15s}
.vr47-v.aberta{border-color:var(--vermelho);box-shadow:var(--sh)}.vr47-v.canc .vr47-vm b,.vr47-v.canc .vr47-val{text-decoration:line-through;opacity:.55}
.vr47-vt{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;cursor:pointer}.vr47-vt:active{background:var(--noite)}
.vr47-ic{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:#fff;background:var(--c)}
.vr47-vm{flex:1;min-width:0}.vr47-vm b{display:block;font-size:14.5px}.vr47-vm small{display:block;font-size:12.5px;color:var(--creme3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vr47-selos{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}.vr47-selos:empty{display:none}
.vr47-tag{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--noite);color:var(--creme2)}
.vr47-tag.bad{background:#ffe5e7;color:#b30a17}.vr47-tag.warn{background:#fff4dc;color:#7a4e00}.vr47-tag.kom{background:#e3f7ec;color:#1a7f4b}
.vr47-tag.tempo{background:#1d1d1f;color:#FFD15C;font-variant-numeric:tabular-nums;animation:vr47p 2s ease-in-out infinite}
.vr47-val{font-size:15px;white-space:nowrap}.vr47-seta{color:var(--creme3);transition:transform .2s}.vr47-v.aberta .vr47-seta{transform:rotate(180deg)}
.vr47-det{padding:0 12px 12px;animation:vr47e .25s both}
.vr47-itens{background:var(--noite);border-radius:12px;padding:8px 10px}.vr47-itens div{display:grid;grid-template-columns:30px 1fr auto;gap:6px;font-size:13.5px;padding:3px 0}.vr47-itens b{font-weight:600}
.vr47-tot{font-size:13.5px;margin:8px 2px}
.vr47-hist{display:flex;gap:8px;align-items:flex-start;border-radius:12px;padding:8px 10px;font-size:13px;margin:6px 0;background:var(--noite)}.vr47-hist.bad{background:#ffe5e7}.vr47-hist.warn{background:#fff4dc}.vr47-hist>i{font-size:18px;margin-top:1px}
.vr47-acoes{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.vr47-acoes .btn{font-size:13.5px;transition:transform .15s}.vr47-acoes .btn:hover{transform:translateY(-2px)}
.vr47-desf{border-color:var(--vermelho)!important;color:var(--vermelho)!important;animation:vr47b 2.4s ease-in-out infinite}.vr47-pedir{background:#1d1d1f!important;color:#fff!important;border-color:#1d1d1f!important}
.vr47-vazio{text-align:center;padding:26px 10px;color:var(--creme3);background:var(--noite);border-radius:16px;font-size:14.5px}
.vr47-regra{font-size:12.5px;margin-top:10px}
.vr47-mveu{position:fixed;inset:0;z-index:9100;background:rgba(20,10,12,.5);display:flex;align-items:flex-end;justify-content:center;animation:vr47f .2s both}@media (min-width:700px){.vr47-mveu{align-items:center}}
.vr47-mcx{width:min(480px,100%);background:#fff;border-radius:24px 24px 0 0;padding:18px 16px 20px;box-shadow:0 -10px 40px rgba(0,0,0,.25);animation:vr47u .3s cubic-bezier(.2,.9,.3,1) both}@media (min-width:700px){.vr47-mcx{border-radius:24px}}
.vr47-mcx h3{margin:0 0 4px;font-size:18px;display:flex;gap:6px;align-items:center}.vr47-mcx h3 i{color:var(--vermelho)}.vr47-mcx .suave{font-size:13px;margin:0 0 8px}
.vr47-mexp{font-size:13.5px;background:var(--noite);border-radius:12px;padding:8px 10px;margin:0 0 10px}
.vr47-mchips{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 8px}.vr47-mchips button{border:1px solid var(--linha);background:var(--noite);border-radius:99px;padding:6px 10px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:transform .15s,border-color .15s}.vr47-mchips button:hover{transform:translateY(-2px);border-color:var(--vermelho)}
.vr47-mcx textarea{width:100%;box-sizing:border-box;font-size:16px}
.vr47-mbt{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.vr47-pcs{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.vr47-pc{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;background:#fff;border:1px solid var(--linha);border-radius:18px;padding:12px 14px;box-shadow:var(--sh);animation:vr47e .35s both;animation-delay:var(--d)}
.vr47-pc.pendente{border-color:#F5B524;background:linear-gradient(135deg,#fff,#fffaf0)}.vr47-pc .lob-av{width:38px!important;height:38px!important;flex-shrink:0}
.vr47-pc b{display:block;font-size:15px}.vr47-pc small{display:block;font-size:12.5px;color:var(--creme3)}.vr47-pc-it{margin-top:2px}
.vr47-pc-mot{margin-top:6px;font-size:14px;background:var(--noite);border-radius:10px;padding:6px 10px}.vr47-pc-dec{margin-top:6px;color:var(--creme2)!important}
.vr47-pc-bt{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
@keyframes vr47e{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes vr47h{from{height:0}}@keyframes vr47f{from{opacity:0}}@keyframes vr47u{from{opacity:0;transform:translateY(40px)}}
@keyframes vr47p{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@keyframes vr47s{0%,100%{transform:none}50%{transform:translateX(4px)}}
@keyframes vr47b{0%,100%{box-shadow:0 0 0 0 rgba(227,16,31,.0)}50%{box-shadow:0 0 0 5px rgba(227,16,31,.15)}}
@media (prefers-reduced-motion:reduce){.vr47-at,.vr47-at-ic,.vr47-at>.ti-chevron-right,.vr47-n,.vr47-dia,.vr47-col i,.vr47-v,.vr47-tag.tempo,.vr47-desf,.vr47-pc,.vr47-mcx{animation:none}}
</style>`);
