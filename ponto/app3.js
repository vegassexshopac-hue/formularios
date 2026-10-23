function cardPedido(s, admin){
  const ico = {correcao:'ti-clock-edit', atestado:'ti-file-certificate', folga:'ti-beach', outro:'ti-message-dots'}[s.tipo];
  const tit = {correcao:'Correção de ponto', atestado:'Atestado', folga:'Folga do banco de horas', outro:'Outro pedido'}[s.tipo];
  const st = {pendente:'<span class="selo warn">Aguardando</span>', aprovada:'<span class="selo ok">Aprovado</span>', recusada:'<span class="selo bad">Recusado</span>', cancelada:'<span class="selo">Cancelado</span>'}[s.status];
  const periodo = s.data_fim && s.data_fim!==s.data ? ddmm(s.data)+' a '+ddmm(s.data_fim) : dataLonga(s.data);
  let det = periodo;
  if(s.tipo==='correcao') det += ` — ${NOME[s.campo]} para <b class="num">${esc(s.horario)}</b>`;
  let extra = '';
  if(admin && s.tipo==='correcao'){
    const p = S.adm.dados.pontos.find(p=>p.colaboradora_id===s.colaboradora_id && p.data===s.data);
    extra += `<p>Hoje está: <span class="num">${p && p[s.campo] ? esc(p[s.campo]) : 'sem marcação'}</span></p>`;
  }
  if(admin && s.tipo==='folga' && s.status==='pendente'){
    const b = saldoDe(s.colaboradora_id), falta = b ? S.adm.dados.regras.folga_min - b.saldo : 0;
    extra += b && b.saldo < S.adm.dados.regras.folga_min
      ? `<div class="nota warn" style="margin-top:8px"><i class="ti ti-alert-triangle"></i><div>Banco atual <b class="num">${hm(b.saldo,true)}</b>: não cobre as 8h da folga (faltam ${hm(falta)}). Se aprovar, o banco fica negativo.</div></div>`
      : `<div class="nota ok" style="margin-top:8px"><i class="ti ti-check"></i><div>Banco atual <b class="num">${hm(b.saldo,true)}</b>: cobre a folga.</div></div>`;
  }
  const tel = admin ? (S.adm.dados.colaboradoras.find(c=>c.id===s.colaboradora_id)||{}).telefone : '';
  return `<div class="pedido"><div class="ico"><i class="ti ${ico}"></i></div><div class="cresce">
    <div class="linha entre quebra"><b>${admin?esc(primeiroNome(s.colaboradora))+' — ':''}${tit}</b>${st}</div>
    <p>${det}</p>${extra}
    ${s.motivo?`<p>“${esc(s.motivo)}”</p>`:''}
    ${s.anexo_url?`<p><a href="${esc(s.anexo_url)}" target="_blank" rel="noopener" style="font-weight:700"><i class="ti ti-paperclip"></i> Ver anexo</a></p>`:''}
    ${s.resposta?`<p><i class="ti ti-message-reply"></i> ${esc(s.resposta)}</p>`:''}
    <p class="apagado" style="font-size:12.5px">Enviado ${esc(s.criada_em.slice(8,10)+'/'+s.criada_em.slice(5,7)+' '+s.criada_em.slice(11,16))}${s.decidido_em?' · respondido '+esc(s.decidido_em.slice(8,10)+'/'+s.decidido_em.slice(5,7)):''}</p>
    ${!admin && s.status==='pendente'?`<button class="btn p fantasma" style="padding:0;margin-top:4px" onclick="cancelarPedido('${s.id}')">Cancelar pedido</button>`:''}
    ${admin && s.status==='pendente'?`<div class="linha" style="margin-top:10px;gap:8px">
      <button class="btn p ok" onclick="decidir('${s.id}',true)"><i class="ti ti-check"></i> Aprovar</button>
      <button class="btn p" onclick="decidir('${s.id}',false)"><i class="ti ti-x"></i> Recusar</button></div>`:''}
    ${admin && (s.status==='aprovada'||s.status==='recusada')?`<button class="btn p" style="margin-top:8px" onclick="avisarWhats('${s.id}')"><i class="ti ti-brand-whatsapp"></i> Avisar no WhatsApp${tel?'':' (sem número)'}</button>`:''}
  </div></div>`;
}

/* pedidos */
let PED = null;
function pedirParaDia(data){
  const r = S.sess.dados.pontos.find(p=>p.data===data) || {};
  const campo = CAMPOS.find(k=>!r[k] && !k.includes('pausa')) || CAMPOS.find(k=>!r[k]) || 'entrada';
  novoPedido({tipo:'correcao', data, campo});
}
function novoPedido(pre={}){
  PED = {tipo:'correcao', data:hojeISO(), data_fim:'', campo:'entrada', horario:'', motivo:'', arquivo:null, ...pre};
  renderPedido();
}
function renderPedido(){
  const p = PED; if(!p){ $('#modal').innerHTML=''; return; }
  const r = S.sess.dados.pontos.find(x=>x.data===p.data) || {};
  const tipos = [['correcao','ti-clock-edit','Corrigir ou esqueci'],['atestado','ti-file-certificate','Atestado'],['folga','ti-beach','Pedir folga'],['outro','ti-message-dots','Outro']];
  let campos = '';
  if(p.tipo==='correcao') campos = `
    <div class="campo"><label>Qual marcação?</label><select class="inp" onchange="PED.campo=this.value;renderPedido()">${CAMPOS.map(k=>`<option value="${k}" ${p.campo===k?'selected':''}>${NOME[k]}${r[k]?' (está '+r[k]+')':' (vazia)'}</option>`).join('')}</select></div>
    <div class="campo"><label>Horário certo</label><input class="inp num" type="time" value="${esc(p.horario)}" oninput="PED.horario=this.value"></div>
    <div class="campo"><label>O que aconteceu?</label><textarea class="inp" placeholder="Ex.: esqueci de bater a volta do almoço" oninput="PED.motivo=this.value">${esc(p.motivo)}</textarea></div>`;
  if(p.tipo==='atestado') campos = `
    <div class="g2"><div class="campo"><label>Primeiro dia</label><input class="inp" type="date" value="${p.data}" onchange="PED.data=this.value"></div>
    <div class="campo"><label>Último dia</label><input class="inp" type="date" value="${p.data_fim||p.data}" onchange="PED.data_fim=this.value"></div></div>
    <div class="campo"><label>Foto ou PDF do atestado</label><input class="inp" style="padding-top:10px" type="file" accept="image/*,application/pdf" onchange="lerArquivo(this)">
      ${p.arquivo?`<span class="selo ok" style="margin-top:6px"><i class="ti ti-check"></i> ${esc(p.arquivo.nome)}</span>`:''}</div>
    <div class="campo"><label>Observação (opcional)</label><textarea class="inp" oninput="PED.motivo=this.value">${esc(p.motivo)}</textarea></div>`;
  if(p.tipo==='folga'){
    const dw = dow(p.data);
    const jaFora = (S.sess.dados.calendario?.ausencias||[]).filter(a=>a.data===p.data && a.eid!==S.sess.eid);
    const b = saldoDe(S.sess.eid), fm = S.sess.dados.regras.folga_min;
    campos = `<div class="campo"><label>Dia da folga</label><input class="inp" type="date" value="${p.data}" min="${hojeISO()}" onchange="PED.data=this.value;renderPedido()"></div>
    ${b ? (b.saldo >= fm ? `<div class="nota ok" style="margin-bottom:12px"><i class="ti ti-pig-money"></i><div>Seu banco tem <b class="num">${hm(b.saldo,true)}</b>: dá para ${b.folgasDisp} folga(s) de 8h.</div></div>` : `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>Seu banco tem <b class="num">${hm(b.saldo,true)}</b> e a folga usa 8h. Faltam <b>${hm(fm-b.saldo)}</b>. Você pode pedir mesmo assim, mas a administração vai avaliar.</div></div>`) : ''}
    ${[0,1,6].includes(dw)?'<div class="nota bad" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>Folga do banco só pode ser de <b>terça a sexta</b>.</div></div>':''}
    ${jaFora.length?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-users"></i><div>Nesse dia já ${jaFora.length>1?'estão':'está'} fora: <b>${jaFora.map(a=>esc(a.nome)).join(', ')}</b>.</div></div>`:''}
    <div class="campo"><label>Observação (opcional)</label><textarea class="inp" oninput="PED.motivo=this.value">${esc(p.motivo)}</textarea></div>`;
  }
  if(p.tipo==='outro') campos = `
    <div class="campo"><label>Data</label><input class="inp" type="date" value="${p.data}" onchange="PED.data=this.value"></div>
    <div class="campo"><label>Explique o pedido</label><textarea class="inp" oninput="PED.motivo=this.value">${esc(p.motivo)}</textarea></div>
    <div class="campo"><label>Anexo (opcional)</label><input class="inp" style="padding-top:10px" type="file" accept="image/*,application/pdf" onchange="lerArquivo(this)">
      ${p.arquivo?`<span class="selo ok" style="margin-top:6px"><i class="ti ti-check"></i> ${esc(p.arquivo.nome)}</span>`:''}</div>`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharPedido()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Novo pedido</h3><button class="icone" onclick="fecharPedido()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="opcoes">${tipos.map(([k,i,n])=>`<button class="${p.tipo===k?'on':''}" onclick="PED.tipo='${k}';renderPedido()"><i class="ti ${i}"></i>${n}</button>`).join('')}</div>
      ${p.tipo==='correcao'?`<div class="campo"><label>Dia</label><input class="inp" type="date" value="${p.data}" max="${hojeISO()}" onchange="PED.data=this.value;renderPedido()"></div>`:''}
      ${campos}
      <button class="btn pri largo" id="btn-enviar" onclick="enviarPedido()"><i class="ti ti-send"></i> Enviar para a administração</button>
    </div></div></div>`;
}
function fecharPedido(){ PED=null; renderPedido(); }
async function lerArquivo(inp){
  const f = inp.files[0]; if(!f) return;
  try{
    if(f.type.startsWith('image/')){
      const img = await new Promise((ok,er)=>{ const i = new Image(); i.onload=()=>ok(i); i.onerror=er; i.src=URL.createObjectURL(f); });
      const k = Math.min(1, 1600/Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      PED.arquivo = {nome:f.name.replace(/\.\w+$/,'')+'.jpg', mime:'image/jpeg', base64: cv.toDataURL('image/jpeg',.82).split(',')[1]};
    } else {
      if(f.size > 10*1024*1024){ toast('Arquivo muito grande (máximo 10 MB)', true); return; }
      const b64 = await new Promise((ok,er)=>{ const r = new FileReader(); r.onload=()=>ok(String(r.result).split(',')[1]); r.onerror=er; r.readAsDataURL(f); });
      PED.arquivo = {nome:f.name, mime:f.type||'application/pdf', base64:b64};
    }
    renderPedido();
  }catch(e){ toast('Não consegui ler o arquivo', true); }
}
async function enviarPedido(){
  const b = $('#btn-enviar'); b.disabled=true; b.innerHTML='<span class="gira"></span> Enviando…';
  try{
    const s = S.sess;
    s.dados = await api('solicitar', {eid:s.eid, ...s.cred, ...PED, data_fim: PED.data_fim || PED.data});
    PED=null; renderPedido(); S.portalTab='pedidos'; S.tela='portal'; render(); toast('Pedido enviado ✔ A administração vai analisar.');
  }catch(e){ toast(e.message, true); b.disabled=false; b.innerHTML='<i class="ti ti-send"></i> Enviar para a administração'; }
}
async function cancelarPedido(id){
  try{ const s=S.sess; s.dados = await api('cancelar', {eid:s.eid, ...s.cred, id}); render(); toast('Pedido cancelado'); }
  catch(e){ toast(e.message, true); }
}
async function trocarMeuPin(){
  const v = $('#novo-pin').value.trim();
  if(!/^\d{6}$/.test(v)){ toast('O PIN precisa ter 6 números', true); return; }
  try{ await api('trocarPin', {eid:S.sess.eid, ...S.sess.cred, novo:v}); S.sess.cred = await credencial('pin', v); $('#novo-pin').value=''; toast('PIN trocado ✔ Use o novo da próxima vez.'); }
  catch(e){ toast(e.message, true); }
}
async function salvarMeuTel(){
  try{ S.sess.dados = await api('perfil', {eid:S.sess.eid, ...S.sess.cred, telefone:$('#meu-tel').value}); render(); toast('Número salvo ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── ADMINISTRAÇÃO ──────────── */
const pendentes = d => d.solicitacoes.filter(s=>s.status==='pendente');
async function admRecarregar(){
  try{ S.adm.dados = await api('admDados', S.adm.cred); render(); toast('Atualizado'); }
  catch(e){ toast(e.message, true); }
}
function telaAdmin(){
  const A = S.adm, d = A.dados;
  const np = pendentes(d).length;
  const tabs = [['pedidos','ti-inbox','Pedidos',np],['hoje','ti-clock','Hoje'],['metas','ti-trophy','Metas'],['caixa','ti-cash-banknote','Caixa'],['checklist','ti-checklist','Checklist'],['escala','ti-calendar-time','Escala'],['mes','ti-calendar','Espelho'],['banco','ti-pig-money','Banco'],['agenda','ti-calendar-event','Agenda'],['equipe','ti-users','Equipe'],['aparelhos','ti-device-desktop','Aparelhos'],['regras','ti-settings','Regras']];
  const corpo = ({pedidos:admPedidos, hoje:admHoje, metas:admMetas, caixa:admCaixa, checklist:admChecklist, escala:admEscala, mes:admMes, banco:admBanco, agenda:admAgenda, equipe:admEquipe, aparelhos:admAparelhos, regras:admRegras})[A.tab]();
  return `<div class="wrap">${letreiro(`<div class="linha" style="margin-left:auto;gap:6px">
      <button class="icone" title="Atualizar" onclick="admRecarregar()"><i class="ti ti-refresh"></i></button>
      <button class="btn p" onclick="S.adm=null;S.tela='inicio';render()"><i class="ti ti-logout-2"></i> Sair</button></div>`)}
    ${btnVoltar('Sair da administração')}
    <div class="abas" style="margin-bottom:16px">${tabs.map(([k,i,n,b])=>`<button class="aba ${A.tab===k?'on':''}" onclick="S.adm.tab='${k}';render()"><i class="ti ${i}"></i> ${n} ${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}</div>`;
}
function admPedidos(){
  const d = S.adm.dados, p = pendentes(d);
  const outros = d.solicitacoes.filter(s=>s.status!=='pendente').slice(-30).reverse();
  return `${p.length ? p.map(s=>cardPedido(s,true)).join('') : `<div class="nota ok"><i class="ti ti-circle-check"></i><div>Nenhum pedido aguardando. 🎉</div></div>`}
    ${outros.length?`<h2 class="secao">Últimos respondidos</h2>${outros.map(s=>cardPedido(s,true)).join('')}`:''}`;
}
async function decidir(id, aprovar){
  const resposta = aprovar ? '' : (prompt('Motivo da recusa (a colaboradora vai ver):') ?? null);
  if(resposta===null) return;
  try{
    S.adm.dados = await api('admDecidir', {...S.adm.cred, id, aprovar, resposta}); render(); carregarBootSilencioso();
    toast(aprovar?'Aprovado e lançado no ponto e na agenda ✔':'Pedido recusado');
    avisarWhats(id);
  }catch(e){ toast(e.message, true); }
}
function msgWhats(s, c){
  const nome = primeiroNome(c.nome), tit = {correcao:'correção de ponto', atestado:'atestado', folga:'folga', outro:'pedido'}[s.tipo];
  const quando = s.data_fim && s.data_fim!==s.data ? `${ddmm(s.data)} a ${ddmm(s.data_fim)}` : ddmm(s.data);
  if(s.status==='aprovada') return `✅ *Pedido aprovado*\n\nOi, ${nome}! Seu pedido de *${tit}* (${quando}) foi *aprovado* e já está lançado no seu ponto.${s.tipo==='folga'?'\n\n🌴 _Aproveite a folga!_':''}\n\n_Qualquer dúvida é só chamar_ 💛`;
  return `❌ *Pedido não aprovado*\n\nOi, ${nome}. Seu pedido de *${tit}* (${quando}) *não foi aprovado*.${s.resposta?`\n\n📝 _Motivo:_ ${s.resposta}`:''}\n\n_Se quiser conversar, me chama_ 💛`;
}
function avisarWhats(id){
  const d = S.adm.dados, s = d.solicitacoes.find(x=>x.id===id); if(!s || s.status==='pendente') return;
  const c = d.colaboradoras.find(x=>x.id===s.colaboradora_id) || {nome:s.colaboradora};
  const msg = msgWhats(s, c), tel = telWa(c.telefone);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Avisar ${esc(primeiroNome(c.nome))} no WhatsApp</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <textarea class="inp" id="wa-msg" style="min-height:170px">${esc(msg)}</textarea>
      ${tel?`<a class="btn ok largo" style="margin-top:10px;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${tel}?text=${encodeURIComponent(msg)}" onclick="this.href='https://wa.me/${tel}?text='+encodeURIComponent(document.getElementById('wa-msg').value);setTimeout(fecharModal,300)"><i class="ti ti-brand-whatsapp"></i> Abrir WhatsApp de ${esc(fmtTel(c.telefone))}</a>`
        :`<div class="nota warn" style="margin-top:10px"><i class="ti ti-phone-off"></i><div>${esc(primeiroNome(c.nome))} ainda não tem WhatsApp cadastrado. Cadastre em Equipe, ou copie a mensagem.</div></div>`}
      <button class="btn largo" style="margin-top:8px" onclick="navigator.clipboard.writeText(document.getElementById('wa-msg').value).then(()=>toast('Mensagem copiada ✔'))"><i class="ti ti-copy"></i> Copiar mensagem</button>
    </div></div></div>`;
}
function admHoje(){
  const d = S.adm.dados, hoje = d.hoje;
  const ativas = d.colaboradoras.filter(c=>c.ativa==='SIM');
  const temMarca = r => r && (CAMPOS.some(f=>r[f]) || (r.tipo && r.tipo!=='normal'));
  const blocos = Object.entries(d.lojas).map(([k,l])=>{
    const linhas = ativas.map(c=>{
      const r = d.pontos.find(p=>p.colaboradora_id===c.id && p.data===hoje);
      if(!temMarca(r) || (r.loja||'')!==k) return '';
      let st = '';
      if(r.tipo && r.tipo!=='normal') st = `<span class="selo info">${TIPO_NOME[r.tipo]}</span>`;
      else if(r.saida) st = `<span class="selo">Saiu às ${r.saida}</span>`;
      else if(r.saida_almoco && !r.volta_almoco) st = `<span class="selo warn">No almoço desde ${r.saida_almoco}</span>`;
      else if(r.inicio_pausa && !r.fim_pausa) st = `<span class="selo warn">Em pausa desde ${r.inicio_pausa}</span>`;
      else if(r.entrada) st = `<span class="selo ok">Trabalhando desde ${r.entrada}</span>`;
      const fotos = (()=>{ try{ return JSON.parse(r.fotos||'{}'); }catch(e){ return {}; } })();
      return `<tr class="clica" onclick="abrirEditor('${c.id}','${hoje}')"><td><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(primeiroNome(c.nome))}</td><td>${st}</td>
        ${CAMPOS.map(f=>`<td class="n esconde-p num">${r[f]?(fotos[f]?`<a href="${esc(fotos[f])}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="ver foto">${r[f]} 📷</a>`:r[f]):''}</td>`).join('')}</tr>`;
    }).join('');
    return `<h2 class="secao">Loja ${esc(l.nome)} <small>${esc(l.abre)} às ${esc(l.fecha)}</small></h2>
      <div class="tabela"><table><thead><tr><th>Colaboradora</th><th>Agora</th>${CAMPOS.map(f=>`<th class="esconde-p">${CURTO[f]}</th>`).join('')}</tr></thead><tbody>${linhas||'<tr><td colspan="8" class="suave">Ninguém bateu ponto aqui hoje</td></tr>'}</tbody></table></div>`;
  }).join('');
  const faltam = ativas.filter(c=>!temMarca(d.pontos.find(p=>p.colaboradora_id===c.id && p.data===hoje)));
  return `<div class="suave" style="font-weight:600;text-transform:capitalize">${dataLonga(hoje)} <span class="apagado" style="text-transform:none">— toque numa linha para corrigir; 📷 abre a foto</span></div>${blocos}
    ${faltam.length?`<h2 class="secao">Ainda não bateram hoje</h2><div class="linha quebra" style="gap:8px">${faltam.map(c=>`<button class="selo" style="height:34px;cursor:pointer" onclick="abrirEditor('${c.id}','${hoje}')"><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(primeiroNome(c.nome))}</button>`).join('')}</div>`:''}`;
}
/* ──────────── ADMIN: METAS ──────────── */
function admMetas(){
  const d = S.adm.dados, ym = S.adm.mes, m = (d.metas||{})[ym]||{}, p = d.premios||{};
  const vendas = (d.vendas||[]).filter(v=>v.data.startsWith(ym)).sort((a,b)=>b.data.localeCompare(a.data)||a.loja.localeCompare(b.loja));
  const campo = (k, lab) => `<div class="g3"><div class="campo"><label>${lab} · meta</label><input class="inp num" id="mt-${k}-meta" value="${(m[k]||{}).meta||''}"></div><div class="campo"><label>super</label><input class="inp num" id="mt-${k}-super" value="${(m[k]||{}).super||''}"></div><div class="campo"><label>hiper</label><input class="inp num" id="mt-${k}-hiper" value="${(m[k]||{}).hiper||''}"></div></div>`;
  return `<div class="linha quebra" style="gap:10px;margin-bottom:12px"><div style="max-width:420px;flex:1">${seletorMes(ym,'admMudarMes')}</div><button class="btn ouro" onclick="admAbrirVenda()"><i class="ti ti-plus"></i> Lançar venda</button></div>
    ${painelMetasHTML(ym,true)}
    <h2 class="secao">Vendas lançadas em ${nomeMes(ym)} <small>toque para corrigir</small></h2>
    <div class="tabela"><table><thead><tr><th>Dia</th><th>Loja</th><th>Vendedora</th><th>Valor</th><th>Lançado por</th></tr></thead><tbody>${vendas.map(v=>`<tr class="clica" onclick="admAbrirVenda('${v.colaboradora_id}','${v.data}','${v.loja}','${esc(v.valor)}')"><td>${ddmm(v.data)}</td><td>${esc(S.boot.lojas[v.loja]?.nome||v.loja)}</td><td>${esc(primeiroNome(v.colaboradora))}</td><td class="n num">${brl2(v.valor)}</td><td class="apagado">${esc(v.lancado_por)} ${esc((v.lancado_em||'').slice(5,16))}</td></tr>`).join('')||'<tr><td colspan="5" class="suave">Nenhuma venda neste mês.</td></tr>'}</tbody></table></div>
    <h2 class="secao">Metas de ${nomeMes(ym)} (R$)</h2>
    <div class="cartao pad" style="max-width:720px">
      ${Object.entries(S.boot.lojas).map(([k,l])=>campo(k,'Loja '+esc(l.nome))).join('')}
      ${campo('lider','Líder (soma das lojas)')}
      <div class="g2"><div class="campo"><label>Vendedora líder</label><select class="inp" id="mt-lider"><option value="">— nenhuma —</option>${d.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>`<option value="${c.id}" ${d.liderId===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div></div>
      <h2 class="secao">Premiação (R$)</h2>
      <div class="g3"><div class="campo"><label>Meta</label><input class="inp num" id="pr-meta" value="${p.meta||''}"></div><div class="campo"><label>Super meta</label><input class="inp num" id="pr-super" value="${p.super||''}"></div><div class="campo"><label>Hiper meta</label><input class="inp num" id="pr-hiper" value="${p.hiper||''}"></div></div>
      <div class="campo"><label>Bônus da hiper (texto)</label><input class="inp" id="pr-bonus" value="${esc(p.hiper_bonus||'')}" placeholder="Ex.: Dia de Princesa ou folga"></div>
      <button class="btn pri" onclick="salvarMetas()"><i class="ti ti-device-floppy"></i> Salvar metas e premiação</button>
      <p class="apagado" style="font-size:13px;margin-top:10px">Mês novo sem meta? Preencha aqui que o portal da equipe passa a mostrar na hora. Vendas do site (Nuvemshop) podem ser lançadas como "origem site".</p>
    </div>`;
}
async function salvarMetas(){
  const d = S.adm.dados, ym = S.adm.mes, metas = JSON.parse(JSON.stringify(d.metas||{}));
  const n = id => Number(String($('#'+id).value).replace(/\./g,'').replace(',','.'))||0;
  metas[ym] = {};
  [...Object.keys(S.boot.lojas),'lider'].forEach(k=>{ const o = {meta:n('mt-'+k+'-meta'), super:n('mt-'+k+'-super'), hiper:n('mt-'+k+'-hiper')}; if(o.meta) metas[ym][k] = {meta:o.meta, super:o.super||o.meta, hiper:o.hiper||o.super||o.meta}; });
  try{
    S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'metas', valor:JSON.stringify(metas)});
    S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'premios', valor:JSON.stringify({meta:n('pr-meta'), super:n('pr-super'), hiper:n('pr-hiper'), hiper_bonus:$('#pr-bonus').value.trim()})});
    S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'lider_id', valor:$('#mt-lider').value});
    render(); toast('Metas salvas ✔ A equipe já vê.');
  }catch(e){ toast(e.message, true); }
}
let AV = null;
function admAbrirVenda(eid, data, loja, valor){
  const d = S.adm.dados;
  AV = {eid: eid||d.colaboradoras.filter(c=>c.ativa==='SIM')[0]?.id, data: data||d.hoje, loja: loja||Object.keys(S.boot.lojas)[0], valor: valor||'', origem:'admin'};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${eid?'Corrigir venda':'Lançar venda'}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="campo"><label>Vendedora</label><select class="inp" onchange="AV.eid=this.value">${d.colaboradoras.map(c=>`<option value="${c.id}" ${AV.eid===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="g2"><div class="campo"><label>Dia</label><input class="inp" type="date" value="${AV.data}" onchange="AV.data=this.value"></div>
      <div class="campo"><label>Loja</label><select class="inp" onchange="AV.loja=this.value">${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${AV.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div></div>
      <div class="g2"><div class="campo"><label>Valor (R$) — vazio apaga</label><input class="inp num" inputmode="decimal" value="${esc(AV.valor)}" oninput="AV.valor=this.value"></div>
      <div class="campo"><label>Origem</label><select class="inp" onchange="AV.origem=this.value"><option value="admin">Loja (admin)</option><option value="site">Site (Nuvemshop)</option></select></div></div>
      <button class="btn pri largo" id="btn-av" onclick="admSalvarVenda()"><i class="ti ti-check"></i> Salvar</button>
    </div></div></div>`;
}
async function admSalvarVenda(){
  const b = $('#btn-av'); b.disabled=true;
  try{ S.adm.dados = await api('admVenda', {...S.adm.cred, ...AV}); fecharModal(); render(); toast('Salvo ✔'); }
  catch(e){ toast(e.message, true); b.disabled=false; }
}

/* ──────────── ADMIN: CAIXA / SANGRIAS ──────────── */
function admCaixa(){
  const d = S.adm.dados, ym = S.adm.mes;
  const lista = (d.sangrias||[]).filter(s=>s.data.startsWith(ym)).sort((a,b)=>(b.data+b.hora).localeCompare(a.data+a.hora));
  const tot = {}; Object.keys(S.boot.lojas).forEach(k=>tot[k]=0); lista.forEach(s=>{ tot[s.loja]=(tot[s.loja]||0)+(Number(s.valor)||0); });
  const porDia = {}; lista.forEach(s=>{ porDia[s.data+'|'+s.loja]=(porDia[s.data+'|'+s.loja]||0)+(Number(s.valor)||0); });
  return `<div style="max-width:420px;margin-bottom:12px">${seletorMes(ym,'admMudarMes')}</div>
    <div class="numeros" style="margin-bottom:12px">${Object.entries(S.boot.lojas).map(([k,l])=>num('Sangrias '+esc(l.nome), brl2(tot[k]), lista.filter(s=>s.loja===k).length+' retirada(s)')).join('')}${num('Total do mês', brl2(Object.values(tot).reduce((a,b)=>a+b,0)), lista.length+' retiradas')}</div>
    <div class="tabela"><table><thead><tr><th>Dia</th><th>Hora</th><th>Loja</th><th>Valor</th><th>Tirou</th><th>Conferiu</th><th>Vídeo</th><th>Obs</th></tr></thead><tbody>
    ${lista.map(s=>`<tr class="clica" onclick="admConferirSangria('${s.id}')"><td>${ddmm(s.data)}</td><td class="num">${esc(s.hora)}</td><td>${esc(S.boot.lojas[s.loja]?.nome||s.loja)}</td><td class="n num"><b>${brl2(s.valor)}</b></td><td>${esc(primeiroNome(s.tirou))}</td><td>${s.conferiu?esc(s.conferiu):'<span class="selo warn">sem conferência</span>'}</td><td>${s.video_url?`<a href="${esc(s.video_url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🎥 ver</a>`:'<span class="apagado">—</span>'}</td><td class="apagado">${esc(s.obs||'')}</td></tr>`).join('')||'<tr><td colspan="8" class="suave">Nenhuma sangria neste mês.</td></tr>'}
    </tbody></table></div>
    <div class="nota info" style="margin-top:12px"><i class="ti ti-lock"></i><div>Sangrias nunca são apagadas nem editadas — você só pode registrar quem conferiu e uma observação (toque na linha). Para bater o caixa, compare com o envelope e o vídeo do grupo.</div></div>`;
}
function admConferirSangria(id){
  const s = S.adm.dados.sangrias.find(x=>x.id===id); if(!s) return;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Sangria ${ddmm(s.data)} ${esc(s.hora)} · ${brl2(s.valor)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin-bottom:10px">Loja ${esc(S.boot.lojas[s.loja]?.nome||s.loja)} · tirou ${esc(s.tirou)}</p>
      <div class="campo"><label>Conferido por</label><input class="inp" id="sg-conf" value="${esc(s.conferiu||'')}" placeholder="Ex.: Madu"></div>
      <div class="campo"><label>Observação</label><input class="inp" id="sg-obs" value="${esc(s.obs||'')}"></div>
      <button class="btn pri largo" onclick="admSalvarSangria('${s.id}')"><i class="ti ti-check"></i> Salvar conferência</button></div></div></div>`;
}
async function admSalvarSangria(id){
  try{ S.adm.dados = await api('admSangria', {...S.adm.cred, id, conferiu:$('#sg-conf').value, obs:$('#sg-obs').value}); fecharModal(); render(); toast('Conferência salva ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── ADMIN: CHECKLIST ──────────── */
let CK = null;
function admChecklist(){
  const d = S.adm.dados, data = S.adm.chkDia || d.hoje;
  const itens = d.checklist?.itens||[], feitos = (d.checklist?.feitos||[]).filter(f=>f.data===data);
  if(!CK) CK = JSON.parse(JSON.stringify(itens));
  const porLoja = Object.entries(S.boot.lojas).map(([k,l])=>{ const it = itensChecklist(itens, k, data); const ok = it.filter(i=>feitos.some(f=>f.item_id===i.id&&f.loja===k));
    return `<div class="cartao pad"><div class="linha entre"><b>Loja ${esc(l.nome)}</b><span class="selo ${ok.length===it.length&&it.length?'ok':ok.length?'warn':'bad'}">${ok.length}/${it.length}</span></div>
      <div class="dias" style="margin-top:10px">${it.map(i=>{ const f = feitos.find(x=>x.item_id===i.id&&x.loja===k); return `<div class="dia" style="grid-template-columns:28px 1fr;padding:8px 10px"><span>${f?'✅':'⬜'}</span><div style="font-size:13.5px">${esc(i.texto)}${f?`<div class="apagado" style="font-size:12px">${esc(primeiroNome(f.colaboradora))} às ${esc(f.hora)}</div>`:''}</div></div>`; }).join('')||'<p class="apagado">Sem itens para este dia.</p>'}</div></div>`; }).join('');
  const linha = (i, idx) => `<div class="cartao pad" style="padding:10px;display:grid;grid-template-columns:1fr 130px 120px 90px 40px;gap:8px;align-items:center">
      <input class="inp" value="${esc(i.texto)}" oninput="CK[${idx}].texto=this.value">
      <select class="inp" onchange="CK[${idx}].turno=this.value">${['abertura','dia','fechamento'].map(t=>`<option value="${t}" ${i.turno===t?'selected':''}>${TURNO_NOME[t]==='Dia todo'?'Durante o dia':TURNO_NOME[t]}</option>`).join('')}</select>
      <select class="inp" onchange="CK[${idx}].loja=this.value"><option value="">Todas</option>${Object.entries(S.boot.lojas).map(([k,l])=>`<option value="${k}" ${i.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select>
      <label class="linha" style="font-size:12.5px"><input type="checkbox" ${i.dias==='6'?'checked':''} onchange="CK[${idx}].dias=this.checked?'6':''"> só sáb</label>
      <button class="icone" onclick="CK.splice(${idx},1);render()"><i class="ti ti-trash"></i></button></div>`;
  return `<div class="linha quebra" style="gap:10px;margin-bottom:12px"><input class="inp" type="date" style="width:auto" value="${data}" onchange="S.adm.chkDia=this.value;render()"><span class="suave">${esc(dataLonga(data))}</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px">${porLoja}</div>
    <h2 class="secao">Itens do checklist <small>o que a equipe marca todo dia</small></h2>
    <div style="display:flex;flex-direction:column;gap:6px">${CK.map(linha).join('')}</div>
    <div class="linha" style="gap:8px;margin-top:10px"><button class="btn" onclick="CK.push({id:'i'+Date.now().toString(36),texto:'',turno:'dia',loja:''});render()"><i class="ti ti-plus"></i> Novo item</button><button class="btn pri" onclick="salvarChecklist()"><i class="ti ti-device-floppy"></i> Salvar itens</button></div>`;
}
async function salvarChecklist(){
  const itens = CK.filter(i=>i.texto.trim()).map(i=>({id:i.id||('i'+Date.now().toString(36)), texto:i.texto.trim(), turno:i.turno||'dia', loja:i.loja||'', dias:i.dias||''}));
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'checklist', valor:JSON.stringify(itens)}); CK=null; render(); toast('Checklist salvo ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── ADMIN: ESCALA ──────────── */
const OPC_TURNO = () => [['','—']].concat(Object.entries(S.boot.lojas).flatMap(([k,l])=>[['abertura','fechamento','dia'].map(t=>[k+'|'+t, l.nome+' · '+(t==='dia'?'dia todo':TURNO_NOME[t].toLowerCase())])].flat()));
function semanaDe(d){ const x = dt(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return isoD(x); } // segunda
function admEscala(){
  const d = S.adm.dados, seg = S.adm.semana || semanaDe(d.hoje), dias = Array.from({length:6},(_,i)=>addDays(seg,i));
  const eq = d.colaboradoras.filter(c=>c.ativa==='SIM');
  if(!S.adm.escalaEdit) S.adm.escalaEdit = {};
  const val = (eid, data) => { const k = data+'|'+eid; if(k in S.adm.escalaEdit) return S.adm.escalaEdit[k]; const e = (d.escala||[]).find(x=>x.chave===k); return e ? e.loja+'|'+e.turno : ''; };
  const cab = dias.map(x=>`<th style="text-align:center">${semana(x)}<br><span class="apagado">${ddmm(x)}</span></th>`).join('');
  const linhas = eq.map(c=>`<tr><td><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(primeiroNome(c.nome))}${c.id===d.liderId?' ⭐':''}</td>${dias.map(x=>{ const v = val(c.id,x); const aus = (d.calendario?.ausencias||[]).find(a=>a.data===x&&a.eid===c.id); return `<td style="padding:4px">${aus?`<span class="selo info">${esc(TIPO_AUS[aus.tipo]?.n||aus.tipo)}</span>`:`<select class="inp" style="height:36px;font-size:12.5px;padding:0 6px;min-width:150px;${v?'border-color:var(--dourado)':''}" onchange="S.adm.escalaEdit['${x}|${c.id}']=this.value;this.style.borderColor=this.value?'var(--dourado)':''">${OPC_TURNO().map(([k,n])=>`<option value="${k}" ${v===k?'selected':''}>${esc(n)}</option>`).join('')}</select>`}</td>`; }).join('')}</tr>`).join('');
  const pend = Object.keys(S.adm.escalaEdit).length;
  return `<div class="linha quebra" style="gap:8px;margin-bottom:12px">
      <div class="linha entre cartao" style="padding:6px 8px;min-width:280px"><button class="icone" style="border:0" onclick="S.adm.semana='${addDays(seg,-7)}';render()"><i class="ti ti-chevron-left"></i></button><b>Semana de ${ddmm(seg)} a ${ddmm(addDays(seg,5))}</b><button class="icone" style="border:0" onclick="S.adm.semana='${addDays(seg,7)}';render()"><i class="ti ti-chevron-right"></i></button></div>
      <button class="btn p" onclick="escalaRepetir('${seg}')"><i class="ti ti-copy"></i> Repetir semana anterior</button>
      <button class="btn p" onclick="escalaRodizio('${seg}')"><i class="ti ti-refresh"></i> Gerar rodízio</button>
      <button class="btn p" onclick="escalaWhats('${seg}')"><i class="ti ti-brand-whatsapp"></i> Mandar no WhatsApp</button>
      <button class="btn pri" ${pend?'':'disabled'} onclick="salvarEscala()"><i class="ti ti-device-floppy"></i> Salvar${pend?' ('+pend+')':''}</button></div>
    <div class="tabela"><table><thead><tr><th>Colaboradora</th>${cab}</tr></thead><tbody>${linhas}</tbody></table></div>
    <div class="nota info" style="margin-top:12px"><i class="ti ti-info-circle"></i><div><b>Gerar rodízio</b> alterna abertura/fechamento em relação à semana anterior para quem tem loja fixa; a líder ⭐ fica no Centro seg/qua/sex e no Bosque ter/qui/sáb. Folgas e atestados aprovados já aparecem e não entram na escala. Horários dos turnos: ${Object.entries(d.turnos||{}).map(([k,t])=>`${esc(S.boot.lojas[k]?.nome||k)} ${esc(t.abertura)} / ${esc(t.fechamento)}`).join(' · ')} (edite em Regras).</div></div>`;
}
