function escalaRepetir(seg){
  const d = S.adm.dados;
  d.colaboradoras.filter(c=>c.ativa==='SIM').forEach(c=>{ for(let i=0;i<6;i++){ const ant = (d.escala||[]).find(x=>x.chave===addDays(seg,i-7)+'|'+c.id); S.adm.escalaEdit[addDays(seg,i)+'|'+c.id] = ant ? ant.loja+'|'+ant.turno : ''; } });
  render();
}
function escalaRodizio(seg){
  const d = S.adm.dados, eq = d.colaboradoras.filter(c=>c.ativa==='SIM'), lojas = Object.keys(S.boot.lojas);
  const porLoja = {}; lojas.forEach(k=>porLoja[k]=[]);
  eq.forEach(c=>{ if(c.id===d.liderId) return; (porLoja[c.loja]||(porLoja[c.loja]=[])).push(c); });
  lojas.forEach(k=>{
    const vs = porLoja[k]; if(!vs.length) return;
    vs.forEach((c,i)=>{
      const ant = (d.escala||[]).find(x=>x.chave===addDays(seg,-7)+'|'+c.id);
      let turno = vs.length===1 ? 'dia' : (ant && ant.turno==='abertura' ? 'fechamento' : ant && ant.turno==='fechamento' ? 'abertura' : (i%2?'fechamento':'abertura'));
      for(let j=0;j<6;j++) S.adm.escalaEdit[addDays(seg,j)+'|'+c.id] = k+'|'+turno;
    });
  });
  if(d.liderId && lojas.includes('centro') && lojas.includes('bosque')) for(let j=0;j<6;j++) S.adm.escalaEdit[addDays(seg,j)+'|'+d.liderId] = (j%2===0?'centro':'bosque')+'|dia';
  // folgas/atestados já lançados não entram
  (d.calendario?.ausencias||[]).forEach(a=>{ if(a.data>=seg && a.data<=addDays(seg,5)) S.adm.escalaEdit[a.data+'|'+a.eid] = ''; });
  render(); toast('Rodízio gerado — confira e salve');
}
async function salvarEscala(){
  const itens = Object.entries(S.adm.escalaEdit).map(([k,v])=>{ const [data,eid] = k.split('|'); const [loja,turno] = (v||'|').split('|'); return {data, eid, loja, turno}; });
  try{ S.adm.dados = await api('admEscala', {...S.adm.cred, itens}); S.adm.escalaEdit = {}; render(); carregarBootSilencioso(); toast('Escala salva ✔ A equipe já vê.'); }
  catch(e){ toast(e.message, true); }
}
function escalaWhats(seg){
  const d = S.adm.dados, eq = d.colaboradoras.filter(c=>c.ativa==='SIM');
  const dias = Array.from({length:6},(_,i)=>addDays(seg,i));
  let txt = `📅 *Escala da semana ${ddmm(seg)} a ${ddmm(addDays(seg,5))}*\n`;
  dias.forEach(x=>{ const l = (d.escala||[]).filter(e=>e.data===x); if(!l.length) return; txt += `\n*${semana(x).toUpperCase()} ${ddmm(x)}*\n`; l.forEach(e=>{ const c = eq.find(c=>c.id===e.colaboradora_id)||{nome:e.colaboradora_id}; const t=(d.turnos||{})[e.loja]||{}; txt += `• ${primeiroNome(c.nome)} — ${S.boot.lojas[e.loja]?.nome||e.loja} ${e.turno==='dia'?'':(TURNO_NOME[e.turno]||'').toLowerCase()} ${t[e.turno]||''}\n`; }); });
  txt += `\n_Folgas e atestados aprovados já estão descontados. Dúvida? Me chama_ 💛`;
  navigator.clipboard.writeText(txt).then(()=>toast('Escala copiada ✔ Cole no grupo do WhatsApp'), ()=>prompt('Copie:', txt));
}

function admColabAtual(){
  const d = S.adm.dados, lista = d.colaboradoras.filter(c=>c.ativa==='SIM');
  if(!S.adm.eid || !d.colaboradoras.some(c=>c.id===S.adm.eid)) S.adm.eid = (lista[0]||d.colaboradoras[0]||{}).id;
  return d.colaboradoras.find(c=>c.id===S.adm.eid);
}
function seletorColab(){
  const d = S.adm.dados;
  return `<select class="inp" style="max-width:300px" onchange="S.adm.eid=this.value;render()">
    ${d.colaboradoras.map(c=>`<option value="${c.id}" ${c.id===S.adm.eid?'selected':''}>${esc(c.nome)}${c.ativa==='SIM'?'':' (inativa)'}</option>`).join('')}</select>`;
}
function admMes(){
  const d = S.adm.dados, c = admColabAtual(); if(!c) return '<p class="suave">Cadastre alguém na aba Equipe.</p>';
  const mapa = mapaPontos(d.pontos, c.id), res = resumoMes(c, S.adm.mes, mapa, d.regras), banco = bancoTotal(c, mapa, d.regras);
  return `<div class="linha quebra" style="gap:10px;margin-bottom:12px">${seletorColab()}<div class="cresce" style="min-width:240px">${seletorMes(S.adm.mes,'admMudarMes')}</div></div>
    <div class="numeros" style="margin-bottom:12px">
      ${num('Trabalhado', hm(res.trabalhado), 'previsto '+hm(res.previsto))}
      ${num('Saldo do mês', hm(res.saldo,true), res.pend?res.pend+' pendência(s) para resolver':'sem pendências', res.saldo)}
      ${num('Banco total', hm(banco.saldo,true), banco.folgasDisp+' folga(s) disponível(is)', banco.saldo)}
      ${num('Ocorrências', String(res.faltas+res.atestados+res.folgas), `${res.faltas} falta, ${res.atestados} atestado, ${res.folgas} folga`)}
    </div>
    <div class="linha quebra" style="gap:8px;margin-bottom:12px">
      <button class="btn p" onclick="imprimirEspelho([admColabAtual()])"><i class="ti ti-printer"></i> Espelho para assinatura</button>
      <button class="btn p" onclick="copiarResumo()"><i class="ti ti-brand-whatsapp"></i> Resumo para o WhatsApp</button>
      <button class="btn p" onclick="exportarCSV()"><i class="ti ti-file-spreadsheet"></i> Baixar CSV do mês</button>
    </div>
    ${res.pend?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>Resolva as pendências (sem marcação ou marcação faltando) antes de fechar o mês: número errado no espelho vira prova contra a loja.</div></div>`:''}
    <div class="dias">${res.dias.map(x=>linhaDia(x, 'admEditarDia')).join('')}</div>`;
}
function admMudarMes(n){ S.adm.mes = mesAdd(S.adm.mes, n); render(); }
function admEditarDia(data){ abrirEditor(S.adm.eid, data); }

let ED = null;
function abrirEditor(eid, data){
  const d = S.adm.dados, c = d.colaboradoras.find(x=>x.id===eid);
  const r = d.pontos.find(p=>p.colaboradora_id===eid && p.data===data) || {};
  ED = {eid, data, nome:c.nome, tipo:r.tipo||'normal', loja:r.loja||c.loja, obs:r.obs||'', motivo:'', existe:!!r.data, hist:(()=>{try{return JSON.parse(r.historico||'[]')}catch(e){return[]}})(), fotos:(()=>{try{return JSON.parse(r.fotos||'{}')}catch(e){return{}}})()};
  CAMPOS.forEach(k=>ED[k]=r[k]||'');
  renderEditor();
}
function renderEditor(){
  const e = ED; if(!e){ $('#modal').innerHTML=''; return; }
  const lojas = S.adm.dados.lojas;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharEditor()"><div class="modal largo">
    <div class="modal-t"><div class="cresce"><h3>${esc(primeiroNome(e.nome))} — ${esc(dataLonga(e.data))}</h3><div class="apagado" style="font-size:13.5px">Tudo que for alterado fica no histórico</div></div><button class="icone" onclick="fecharEditor()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="g2">
        <div class="campo"><label>Tipo do dia</label><select class="inp" onchange="ED.tipo=this.value;renderEditor()">${Object.entries(TIPO_NOME).map(([k,n])=>`<option value="${k}" ${e.tipo===k?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="campo"><label>Loja</label><select class="inp" onchange="ED.loja=this.value">${Object.entries(lojas).map(([k,l])=>`<option value="${k}" ${e.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div>
      </div>
      ${e.tipo==='folga' && [0,1,6].includes(dow(e.data))?'<div class="nota bad" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>Regra da loja: folga do banco só de terça a sexta.</div></div>':''}
      ${e.tipo==='normal'?`<div class="g3">${CAMPOS.map(k=>`<div class="campo"><label>${NOME[k]}${e.fotos[k]?` <a href="${esc(e.fotos[k])}" target="_blank" rel="noopener" title="ver foto">📷</a>`:''}</label><input class="inp num" type="time" value="${e[k]}" oninput="ED['${k}']=this.value"></div>`).join('')}</div>`:''}
      <div class="campo"><label>Observação</label><input class="inp" value="${esc(e.obs)}" oninput="ED.obs=this.value"></div>
      <div class="campo"><label>Motivo da alteração</label><input class="inp" placeholder="Ex.: combinado com a colaboradora" value="${esc(e.motivo)}" oninput="ED.motivo=this.value"></div>
      <div class="linha" style="gap:8px"><button class="btn pri cresce" id="btn-salvar-dia" onclick="salvarEditor()"><i class="ti ti-device-floppy"></i> Salvar</button>
        ${e.existe?`<button class="btn" onclick="apagarDia()"><i class="ti ti-trash"></i></button>`:''}</div>
      ${e.hist.length?`<h2 class="secao">Histórico</h2><div class="historico">${e.hist.slice().reverse().map(h=>`<div><b>${esc(NOME[h.campo]||h.campo)}</b>: ${esc(h.de||'vazio')} → ${esc(h.para||'vazio')} <span class="apagado">(${esc(h.por)}${h.em?', '+esc(h.em.slice(8,10)+'/'+h.em.slice(5,7)+' '+h.em.slice(11,16)):''}${h.motivo?': '+esc(h.motivo):''})</span></div>`).join('')}</div>`:''}
    </div></div></div>`;
}
function fecharEditor(){ ED=null; renderEditor(); }
async function salvarEditor(){
  const e = ED, b = $('#btn-salvar-dia'); b.disabled=true; b.innerHTML='<span class="gira"></span> Salvando…';
  const campos = {}; if(e.tipo==='normal') CAMPOS.forEach(k=>campos[k]=e[k]); else CAMPOS.forEach(k=>campos[k]='');
  try{
    const j = await api('admPonto', {...S.adm.cred, eid:e.eid, data:e.data, campos, tipo:e.tipo, loja:e.loja, obs:e.obs, motivo:e.motivo||'Ajuste da administração'});
    const L = S.adm.dados.pontos, i = L.findIndex(p=>p.chave===j.ponto.chave);
    if(i>=0) L[i]=j.ponto; else L.push(j.ponto);
    ED=null; renderEditor(); render(); carregarBootSilencioso(); toast('Salvo ✔');
    api('admDados', S.adm.cred).then(d=>{ if(S.adm){ S.adm.dados=d; if(S.adm.tab==='agenda') render(); } }).catch(()=>{});
  }catch(err){ toast(err.message, true); b.disabled=false; b.innerHTML='<i class="ti ti-device-floppy"></i> Salvar'; }
}
async function apagarDia(){
  if(!confirm('Apagar todas as marcações deste dia?')) return;
  try{
    await api('admApagarPonto', {...S.adm.cred, eid:ED.eid, data:ED.data});
    S.adm.dados.pontos = S.adm.dados.pontos.filter(p=>p.chave!==ED.eid+'|'+ED.data);
    ED=null; renderEditor(); render(); toast('Dia apagado');
  }catch(err){ toast(err.message, true); }
}
function admBanco(){
  const d = S.adm.dados, ym = S.adm.mes;
  const linhas = d.colaboradoras.filter(c=>c.ativa==='SIM').map(c=>{
    const mapa = mapaPontos(d.pontos, c.id), r = resumoMes(c, ym, mapa, d.regras), b = bancoTotal(c, mapa, d.regras);
    return `<tr class="clica" onclick="S.adm.eid='${c.id}';S.adm.tab='mes';render()">
      <td><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(primeiroNome(c.nome))}</td>
      <td class="n num">${hm(r.trabalhado)}</td><td class="n num">${hm(r.previsto)}</td>
      <td class="n num ${r.saldo>0?'pos':r.saldo<0?'neg':''}">${hm(r.saldo,true)}</td>
      <td class="n num ${b.saldo>0?'pos':b.saldo<0?'neg':''}"><b>${hm(b.saldo,true)}</b></td>
      <td class="n">${b.folgasDisp}</td>
      <td>${b.proximas.length?b.proximas.slice(0,3).map(x=>ddmm(x)).join(', '):'<span class="apagado">—</span>'}</td>
      <td>${r.pend?`<span class="selo bad">${r.pend} pendência</span>`:''} ${r.alertas?`<span class="selo warn">${r.alertas} alerta</span>`:''}</td></tr>`;
  }).join('');
  return `<div class="linha quebra" style="gap:10px;margin-bottom:12px"><div style="max-width:420px;flex:1">${seletorMes(ym,'admMudarMes')}</div>
      <button class="btn pri" onclick="imprimirEspelho(S.adm.dados.colaboradoras.filter(c=>c.ativa==='SIM'))"><i class="ti ti-printer"></i> Fechar o mês: imprimir espelhos de todas</button>
      <button class="btn p" onclick="exportarCSV(true)"><i class="ti ti-file-spreadsheet"></i> CSV do mês</button></div>
    <div class="tabela"><table><thead><tr><th>Colaboradora</th><th>Trabalhado</th><th>Previsto</th><th>Saldo do mês</th><th>Banco total</th><th>Folgas disp.</th><th>Folgas marcadas</th><th>Atenção</th></tr></thead><tbody>${linhas}</tbody></table></div>
    <div class="nota info" style="margin-top:14px"><i class="ti ti-info-circle"></i><div>Previsto é 7h20 por dia útil de segunda a sábado, sem feriados; até ${d.regras.tolerancia_min} min por dia não contam. Cada folga desconta ${hm(d.regras.folga_min)} e só pode ser de terça a sexta. O banco soma desde ${ddmm(d.regras.inicio_banco)}/${d.regras.inicio_banco.slice(0,4)} mais o saldo inicial de cada uma (aba Equipe). Crédito não compensado até o fim do mês seguinte precisa ser pago como hora extra com 50%.</div></div>`;
}
function admAgenda(){
  const d = S.adm.dados, ev = (d.calendario?.eventos||[]).slice().sort((a,b)=>a.data.localeCompare(b.data));
  const prox = ev.filter(e=>(e.data_fim||e.data) >= d.hoje);
  return `<button class="btn pri" style="margin-bottom:12px" onclick="editarEvento()"><i class="ti ti-plus"></i> Novo evento, campanha ou aviso</button>
    ${calendario(d.calendario, true)}
    <div class="nota info" style="margin-top:12px"><i class="ti ti-info-circle"></i><div>Folgas, atestados e férias entram sozinhos quando você aprova o pedido ou lança no espelho. Para a equipe, atestado aparece só como "ausente". Avisos aparecem no mural do portal de cada uma.</div></div>
    <h2 class="secao">Próximos</h2>
    ${prox.length ? prox.map(e=>{ const t=TIPO_EV[e.tipo]||TIPO_EV.evento; return `<div class="pedido" style="align-items:center"><div class="ico">${t.e}</div><div class="cresce"><b>${esc(e.titulo)}</b><p>${t.n}, ${ddmm(e.data)}${e.data_fim&&e.data_fim!==e.data?' a '+ddmm(e.data_fim):''}${e.loja&&d.lojas[e.loja]?', loja '+esc(d.lojas[e.loja].nome):''}</p></div><button class="btn p" onclick="editarEvento('${e.id}')"><i class="ti ti-pencil"></i> Editar</button></div>`; }).join('') : '<p class="suave">Nada marcado.</p>'}`;
}
let EV = null;
function editarEvento(id, data){
  const e = id ? (S.adm.dados.calendario.eventos.find(x=>x.id===id)||{}) : {};
  EV = {id:id||'', titulo:e.titulo||'', tipo:e.tipo||'cha', data:e.data||data||hojeISO(), data_fim:e.data_fim||'', loja:e.loja||'', obs:e.obs||''};
  renderEvento();
}
function renderEvento(){
  const e = EV; if(!e){ $('#modal').innerHTML=''; return; }
  const lojas = S.adm.dados.lojas;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${e.id?'Editar':'Novo'} ${e.tipo==='aviso'?'aviso':'evento'}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="opcoes">${Object.entries(TIPO_EV).map(([k,t])=>`<button class="${e.tipo===k?'on':''}" onclick="EV.tipo='${k}';renderEvento()"><span style="font-size:22px">${t.e}</span>${t.n}</button>`).join('')}</div>
      <div class="campo"><label>${e.tipo==='aviso'?'Título do aviso':'Nome'}</label><input class="inp" value="${esc(e.titulo)}" placeholder="${e.tipo==='aviso'?'Ex.: Reunião mensal dia 30':'Ex.: Chá de lingerie da Leandra'}" oninput="EV.titulo=this.value"></div>
      <div class="g2"><div class="campo"><label>${e.tipo==='aviso'?'Publicar em':'Começa em'}</label><input class="inp" type="date" value="${e.data}" onchange="EV.data=this.value"></div>
      <div class="campo"><label>${e.tipo==='aviso'?'Mostrar até (opcional)':'Termina em (opcional)'}</label><input class="inp" type="date" value="${e.data_fim}" onchange="EV.data_fim=this.value"></div></div>
      <div class="campo"><label>Loja</label><select class="inp" onchange="EV.loja=this.value"><option value="">Todas ou fora da loja</option>${Object.entries(lojas).map(([k,l])=>`<option value="${k}" ${e.loja===k?'selected':''}>${esc(l.nome)}</option>`).join('')}</select></div>
      <div class="campo"><label>${e.tipo==='aviso'?'Texto do aviso':'Detalhes (opcional)'}</label><textarea class="inp" placeholder="${e.tipo==='aviso'?'O que a equipe precisa saber':'Ex.: equipe Sabrynna e Cibelly, 19h'}" oninput="EV.obs=this.value">${esc(e.obs)}</textarea></div>
      <div class="linha" style="gap:8px"><button class="btn pri cresce" id="btn-ev" onclick="salvarEvento()"><i class="ti ti-device-floppy"></i> Salvar na agenda</button>
      ${e.id?`<button class="btn" onclick="apagarEvento()"><i class="ti ti-trash"></i></button>`:''}</div>
    </div></div></div>`;
}
async function salvarEvento(){
  const b = $('#btn-ev'); b.disabled=true;
  try{ S.adm.dados = await api('admEvento', {...S.adm.cred, ...EV}); fecharModal(); render(); carregarBootSilencioso(); toast('Salvo ✔ A equipe já vê.'); }
  catch(e){ toast(e.message, true); b.disabled=false; }
}
async function apagarEvento(){
  if(!confirm('Apagar da agenda?')) return;
  try{ S.adm.dados = await api('admApagarEvento', {...S.adm.cred, id:EV.id}); fecharModal(); render(); carregarBootSilencioso(); toast('Apagado'); }
  catch(e){ toast(e.message, true); }
}
function admEquipe(){
  const d = S.adm.dados;
  return `<button class="btn pri" style="margin-bottom:12px" onclick="editarColab()"><i class="ti ti-user-plus"></i> Nova colaboradora</button>
    <div class="tabela"><table><thead><tr><th>Nome</th><th>Cargo</th><th>WhatsApp</th><th>Admissão</th><th>Saldo inicial</th><th>PIN</th><th>Situação</th></tr></thead><tbody>
    ${d.colaboradoras.map(c=>`<tr class="clica" onclick="editarColab('${c.id}')"><td><span class="ponto" style="background:${esc(c.cor)}"></span> ${esc(c.nome)}</td>
      <td>${esc(c.cargo||'')||'<span class="apagado">—</span>'}</td><td class="num">${c.telefone?esc(fmtTel(c.telefone)):'<span class="selo warn">sem número</span>'}</td><td>${c.admissao?ddmm(c.admissao)+'/'+c.admissao.slice(0,4):'<span class="apagado">—</span>'}</td>
      <td class="n num">${hm(c.saldo_inicial_min,true)}</td><td>${c.temPin?'<span class="selo ok">Criado</span>':'<span class="selo bad">Falta criar</span>'}</td>
      <td>${c.ativa==='SIM'?'<span class="selo ok">Ativa</span>':'<span class="selo">Inativa</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}
let EC = null;
function editarColab(id){
  const d = S.adm.dados, c = id ? d.colaboradoras.find(x=>x.id===id) : {nome:'', loja:'bosque', cor:'#F5B524', admissao:'', saldo_inicial_min:0, ativa:'SIM', telefone:'', cargo:''};
  EC = {id:id||'', nome:c.nome, loja:c.loja, cor:c.cor||'#F5B524', admissao:c.admissao||'', saldo:hm(c.saldo_inicial_min||0), ativa:c.ativa==='SIM', pin:'', temPin:c.temPin, telefone:fmtTel(c.telefone), cargo:c.cargo||''};
  renderColab();
}
function renderColab(){
  const e = EC; if(!e){ $('#modal').innerHTML=''; return; }
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this){EC=null;renderColab()}"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${e.id?'Editar colaboradora':'Nova colaboradora'}</h3><button class="icone" onclick="EC=null;renderColab()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="campo"><label>Nome completo</label><input class="inp" value="${esc(e.nome)}" oninput="EC.nome=this.value"></div>
      <div class="g2">
        <div class="campo"><label>Cargo</label><input class="inp" value="${esc(e.cargo)}" placeholder="Ex.: Vendedora" oninput="EC.cargo=this.value"></div>
        <div class="campo"><label>WhatsApp</label><input class="inp" inputmode="tel" value="${esc(e.telefone)}" placeholder="(68) 9 9999-9999" oninput="EC.telefone=this.value"></div>
        <div class="campo"><label>Admissão</label><input class="inp" type="date" value="${e.admissao}" onchange="EC.admissao=this.value"></div>
        <div class="campo"><label>Saldo inicial do banco</label><input class="inp num" value="${esc(e.saldo)}" oninput="EC.saldo=this.value" placeholder="+00:00"></div>
        <div class="campo"><label>Cor</label><input class="inp" type="color" value="${esc(e.cor)}" oninput="EC.cor=this.value" style="padding:4px"></div>
        <div class="campo"><label>${e.temPin?'Trocar PIN (vazio mantém)':'Criar PIN de 6 números'}</label><input class="inp num" inputmode="numeric" maxlength="6" value="${esc(e.pin)}" oninput="EC.pin=this.value"></div>
      </div>
      <label class="linha" style="margin-bottom:14px;font-weight:700"><input type="checkbox" ${e.ativa?'checked':''} onchange="EC.ativa=this.checked" style="width:18px;height:18px"> Ativa (aparece na tela do ponto)</label>
      <button class="btn pri largo" id="btn-colab" onclick="salvarColab()"><i class="ti ti-device-floppy"></i> Salvar</button>
    </div></div></div>`;
}
async function salvarColab(){
  const e = EC;
  const m = /^([+-])?(\d{1,3}):(\d{2})$/.exec(e.saldo.trim()||'0:00');
  if(!m){ toast('Saldo inicial no formato +hh:mm ou -hh:mm', true); return; }
  const saldo = (m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]));
  if(e.pin && !/^\d{6}$/.test(e.pin)){ toast('O PIN precisa ter 6 números', true); return; }
  const b = $('#btn-colab'); b.disabled=true;
  try{
    S.adm.dados = await api('admColab', {...S.adm.cred, id:e.id||undefined, nome:e.nome, loja:e.loja, cor:e.cor, admissao:e.admissao, cargo:e.cargo, telefone:e.telefone, saldo_inicial_min:saldo, ativa:e.ativa, pin:e.pin||undefined});
    EC=null; renderColab(); render(); toast('Salvo ✔'+(e.pin?' PIN '+e.pin+' — passe para ela':''));
    carregarBootSilencioso();
  }catch(err){ toast(err.message, true); b.disabled=false; }
}
async function carregarBootSilencioso(){ try{ S.boot = await api('boot'); LS.set('lv_boot', S.boot); }catch(e){} }
function admAparelhos(){
  const d = S.adm.dados, lista = d.aparelhos || [];
  return `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-device-desktop"></i><div>O ponto só é batido nos computadores desta lista. Para autorizar um computador, abra o site <b>nele</b>, toque em "Autorizar este computador" no rodapé e digite o PIN da administração.${modoLoja()?' Este aqui já está autorizado.':''}</div></div>
    <div class="tabela"><table><thead><tr><th>Nome</th><th>Loja</th><th>Autorizado em</th><th>Último ponto</th><th>Situação</th><th></th></tr></thead><tbody>
    ${lista.length ? lista.map(a=>`<tr><td>${esc(a.nome)}${S.aparelho?.id===a.id?' <span class="selo ok">este</span>':''}</td><td>${esc(d.lojas[a.loja]?.nome||a.loja)}</td><td>${esc((a.criado_em||'').slice(0,16))}</td><td>${esc((a.ultimo_uso||'—').slice(0,16))}</td>
      <td>${a.ativo==='SIM'?'<span class="selo ok">Ativo</span>':'<span class="selo">Revogado</span>'}</td><td>${a.ativo==='SIM'?`<button class="btn p" onclick="revogarAparelho('${a.id}')"><i class="ti ti-ban"></i> Revogar</button>`:''}</td></tr>`).join('') : '<tr><td colspan="6" class="suave">Nenhum computador autorizado ainda.</td></tr>'}
    </tbody></table></div>
    ${!modoLoja()?`<button class="btn ouro" style="margin-top:12px" onclick="S.admCred=S.adm.cred;abrirAutorizarAparelho(S.adm.dados)"><i class="ti ti-device-desktop"></i> Autorizar este computador agora</button>`:''}`;
}
async function revogarAparelho(id){
  if(!confirm('Esse computador não vai mais conseguir bater ponto. Continuar?')) return;
  try{ S.adm.dados = await api('admRevogarAparelho', {...S.adm.cred, id}); if(S.aparelho?.id===id){ S.aparelho=null; LS.del('lv_aparelho'); } render(); toast('Revogado'); }
  catch(e){ toast(e.message, true); }
}
function admRegras(){
  const d = S.adm.dados, r = d.regras;
  return `<div class="cartao pad" style="max-width:680px">
    <div class="g2">
      <div class="campo"><label>Jornada por dia útil (minutos)</label><input class="inp num" id="cf-jornada_min" value="${r.jornada_min}"></div>
      <div class="campo"><label>Cada folga consome (minutos)</label><input class="inp num" id="cf-folga_min" value="${r.folga_min}"></div>
      <div class="campo"><label>Tolerância por dia (minutos)</label><input class="inp num" id="cf-tolerancia_min" value="${r.tolerancia_min}"></div>
      <div class="campo"><label>Banco conta a partir de</label><input class="inp" type="date" id="cf-inicio_banco" value="${r.inicio_banco}"></div>
    </div>
    <div class="campo"><label>Feriados (AAAA-MM-DD separados por vírgula)</label><textarea class="inp" id="cf-feriados" style="font-size:13px">${esc(r.feriados.join(', '))}</textarea></div>
    <div class="g2">
      <label class="linha" style="font-weight:700"><input type="checkbox" id="cf-exigir" ${d.exigirAparelho?'checked':''} style="width:18px;height:18px"> Ponto só em computador autorizado</label>
      <label class="linha" style="font-weight:700"><input type="checkbox" id="cf-foto" ${d.fotoPonto?'checked':''} style="width:18px;height:18px"> Tirar foto a cada marcação</label>
    </div>
    <button class="btn pri" style="margin-top:14px" onclick="salvarRegras()"><i class="ti ti-device-floppy"></i> Salvar regras</button>
    <p class="apagado" style="font-size:13px;margin-top:10px">Nunca recalcule um mês já fechado com regra nova: mude a data de início do banco e lance o saldo de fechamento como saldo inicial de cada uma.</p>
  </div>
  <h2 class="secao">Horário das lojas</h2>
  <div class="cartao pad" style="max-width:680px">${Object.entries(d.lojas).map(([k,l])=>`<div class="g3"><div class="campo"><label>Loja</label><input class="inp" value="${esc(l.nome)}" disabled></div>
    <div class="campo"><label>Abre</label><input class="inp num" type="time" id="lj-${k}-abre" value="${l.abre}"></div><div class="campo"><label>Fecha</label><input class="inp num" type="time" id="lj-${k}-fecha" value="${l.fecha}"></div></div>`).join('')}
    <h2 class="secao" style="margin-top:6px">Turnos da escala</h2>
    ${Object.entries(d.lojas).map(([k,l])=>`<div class="g3"><div class="campo"><label>Loja</label><input class="inp" value="${esc(l.nome)}" disabled></div><div class="campo"><label>Abertura</label><input class="inp num" id="tn-${k}-abertura" value="${esc((d.turnos||{})[k]?.abertura||'')}" placeholder="08:00–17:00"></div><div class="campo"><label>Fechamento</label><input class="inp num" id="tn-${k}-fechamento" value="${esc((d.turnos||{})[k]?.fechamento||'')}" placeholder="11:00–20:00"></div></div>`).join('')}
    <button class="btn" onclick="salvarLojas()"><i class="ti ti-device-floppy"></i> Salvar horários e turnos</button></div>
  <h2 class="secao">Links úteis do portal</h2>
  <div class="cartao pad" style="max-width:680px"><p class="suave" style="font-size:14px;margin-bottom:10px">Aparecem na tela inicial do portal de cada colaboradora. Um por linha: <b>Título | link</b></p>
    <textarea class="inp" id="cf-links" style="min-height:110px">${esc((d.links||[]).map(l=>l.titulo+' | '+l.url).join('\n'))}</textarea>
    <button class="btn" style="margin-top:10px" onclick="salvarLinks()"><i class="ti ti-device-floppy"></i> Salvar links</button></div>
  <h2 class="secao">PIN da administração</h2>
  <div class="cartao pad" style="max-width:680px"><div class="g2"><input class="inp num" id="adm-novo-pin" inputmode="numeric" maxlength="6" placeholder="Novo PIN (6 números)"><button class="btn" onclick="trocarPinAdmin()">Trocar PIN</button></div></div>`;
}
async function salvarRegras(){
  try{
    for(const k of ['jornada_min','folga_min','tolerancia_min','inicio_banco','feriados']){
      let v = $('#cf-'+k).value.trim();
      if(k==='feriados') v = v.split(/[\s,;]+/).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).join(',');
      S.adm.dados = await api('admConfig', {...S.adm.cred, chave:k, valor:v});
    }
    S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'exigir_aparelho', valor:$('#cf-exigir').checked?'SIM':'NÃO'});
    S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'foto_ponto', valor:$('#cf-foto').checked?'SIM':'NÃO'});
    carregarBootSilencioso(); render(); toast('Regras salvas ✔');
  }catch(e){ toast(e.message, true); }
}
async function salvarLojas(){
  const l = JSON.parse(JSON.stringify(S.adm.dados.lojas));
  Object.keys(l).forEach(k=>{ l[k].abre=$('#lj-'+k+'-abre').value; l[k].fecha=$('#lj-'+k+'-fecha').value; });
  const tn = {}; Object.keys(l).forEach(k=>{ tn[k] = {abertura:$('#tn-'+k+'-abertura').value.trim(), fechamento:$('#tn-'+k+'-fechamento').value.trim()}; });
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'lojas', valor:JSON.stringify(l)}); S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'turnos', valor:JSON.stringify(tn)}); carregarBootSilencioso(); render(); toast('Horários salvos ✔'); }
  catch(e){ toast(e.message, true); }
}
async function salvarLinks(){
  const links = $('#cf-links').value.split('\n').map(l=>l.split('|')).filter(p=>p.length>=2 && p[1].trim()).map(p=>({titulo:p[0].trim(), url:p[1].trim(), icone:'link'}));
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'links', valor:JSON.stringify(links)}); carregarBootSilencioso(); render(); toast('Links salvos ✔'); }
  catch(e){ toast(e.message, true); }
}
async function trocarPinAdmin(){
  const v = $('#adm-novo-pin').value.trim();
  if(!/^\d{6}$/.test(v)){ toast('O PIN precisa ter 6 números', true); return; }
  try{ await api('admTrocarPin', {...S.adm.cred, novo:v}); S.adm.cred = await credencial('adminPin', v); $('#adm-novo-pin').value=''; toast('PIN da administração trocado ✔'); }
  catch(e){ toast(e.message, true); }
}

/* ──────────── espelho / exportações ──────────── */
function espelhoHTML(c, ym){
  const d = S.adm.dados, mapa = mapaPontos(d.pontos, c.id), res = resumoMes(c, ym, mapa, d.regras), banco = bancoTotal(c, mapa, d.regras);
  const linhas = res.dias.map(x=>{
    const r = x.r || {};
    const tipo = x.domingo && !r.entrada ? 'DSR' : x.feriado && !r.entrada ? 'Feriado' : (x.tipo!=='normal' ? TIPO_NOME[x.tipo] : '');
    return `<tr><td>${ddmm(x.data)} ${semana(x.data)}${r.loja&&r.entrada?' · '+esc((d.lojas[r.loja]||{}).nome||''):''}</td>${CAMPOS.map(k=>`<td>${r[k]||''}</td>`).join('')}<td>${x.trabalhado?hm(x.trabalhado):''}</td><td>${x.previsto?hm(x.previsto):''}</td><td>${x.saldo?hm(x.saldo,true):''}</td><td>${esc([tipo, ...x.flags.filter(f=>f.c!=='info').map(f=>f.n)].filter(Boolean).join(' · '))}</td></tr>`;
  }).join('');
  return `<div class="pagina">
    <div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px">
      <img src="${LOGO}" style="height:40px"><div><h1>Espelho de Ponto — ${nomeMes(ym)}</h1><div>${EMPRESA.nome} · CNPJ ${EMPRESA.cnpj}</div></div></div>
    <p><b>Colaboradora:</b> ${esc(c.nome)}${c.cargo?' · '+esc(c.cargo):''} &nbsp; · &nbsp; <b>Jornada:</b> 7h20 por dia, seg a sáb (44h semanais)</p>
    <table style="margin-top:8px"><thead><tr><th>Dia</th>${CAMPOS.map(k=>`<th>${CURTO[k]}</th>`).join('')}<th>Trab.</th><th>Prev.</th><th>Saldo</th><th>Obs.</th></tr></thead><tbody>${linhas}</tbody></table>
    <p style="margin-top:10px"><b>Trabalhado:</b> ${hm(res.trabalhado)} · <b>Previsto:</b> ${hm(res.previsto)} · <b>Saldo do mês:</b> ${hm(res.saldo,true)} · <b>Banco de horas acumulado:</b> ${hm(banco.saldo,true)}</p>
    <p style="margin-top:8px">Declaro que os horários acima conferem com a minha jornada. Caso discorde de algum registro, tenho 5 (cinco) dias úteis a partir do recebimento para contestar por escrito. Saldo credor do banco de horas deve ser compensado até o fim do mês seguinte; o que não for compensado será pago como hora extra com adicional de 50%.</p>
    <div style="display:flex;gap:40px;margin-top:46px">
      <div style="flex:1;border-top:1px solid #000;padding-top:4px;text-align:center">${EMPRESA.nome}<br>Empregadora</div>
      <div style="flex:1;border-top:1px solid #000;padding-top:4px;text-align:center">${esc(c.nome)}<br>Colaboradora</div></div>
    <p style="margin-top:14px;color:#555">Rio Branco/AC, ____ de ______________ de ${ym.slice(0,4)}.</p></div>`;
}
function imprimirEspelho(lista){
  $('#print').innerHTML = lista.map(c=>espelhoHTML(c, S.adm.mes)).join('');
  setTimeout(()=>window.print(), 300);
}
function copiarResumo(){
  const d = S.adm.dados, c = admColabAtual(), ym = S.adm.mes;
  const mapa = mapaPontos(d.pontos, c.id), res = resumoMes(c, ym, mapa, d.regras), banco = bancoTotal(c, mapa, d.regras);
  const txt = `🕐 *Seu ponto de ${nomeMes(ym)}*\n\nOi, ${primeiroNome(c.nome)}! Segue o resumo:\n\n⏱️ *Trabalhado:* ${hm(res.trabalhado)}\n📋 *Previsto:* ${hm(res.previsto)}\n${res.saldo>=0?'➕':'➖'} *Saldo do mês:* ${hm(res.saldo,true)}\n🏦 *Banco de horas:* ${hm(banco.saldo,true)}${banco.folgasDisp?`\n🌴 *Folgas disponíveis:* ${banco.folgasDisp}`:''}${res.pend?`\n\n⚠️ _Tem ${res.pend} dia(s) com marcação pendente. Confere no seu portal e manda a correção por lá._`:''}\n\n_Qualquer dúvida é só chamar_ 💛`;
  const tel = telWa(c.telefone);
  if(tel) window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(txt), '_blank');
  else navigator.clipboard.writeText(txt).then(()=>toast('Resumo copiado ✔ Cole no WhatsApp'), ()=>{ prompt('Copie o texto:', txt); });
}
function exportarCSV(todas){
  const d = S.adm.dados, ym = S.adm.mes;
  const ids = todas ? d.colaboradoras.map(c=>c.id) : [admColabAtual().id];
  const q = v => /[",\n]/.test(v) ? '"'+String(v).replace(/"/g,'""')+'"' : String(v??'');
  const head = 'funcionaria,loja,data,'+CAMPOS.join(',')+',tipo,obs';
  const rows = d.pontos.filter(p=>ids.includes(p.colaboradora_id) && p.data.startsWith(ym)).sort((a,b)=>(a.colaboradora+a.data).localeCompare(b.colaboradora+b.data))
    .map(p=>[p.colaboradora,p.loja,p.data,...CAMPOS.map(k=>p[k]),p.tipo==='normal'?'':p.tipo,p.obs].map(q).join(','));
  const blob = new Blob([String.fromCharCode(0xFEFF)+[head,...rows].join('\n')], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pontos-${ym}${todas?'':'-'+admColabAtual().id}.csv`; a.click();
}

/* ──────────── link do servidor (só sem API_FIXO) ──────────── */
function telaConfig(){
  return `<div class="wrap" style="max-width:620px">${letreiro(' ')}
    <div class="cartao pad"><h2 class="secao">Conectar à planilha</h2>
    <p class="suave" style="margin-bottom:12px">Cole o link do App da Web do Apps Script (termina em <b>/exec</b>).</p>
    <div class="campo"><input class="inp" id="api-url" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(S.api)}"></div>
    <button class="btn pri" onclick="salvarApi()"><i class="ti ti-plug-connected"></i> Conectar</button></div></div>`;
}
async function salvarApi(){
  const v = $('#api-url').value.trim();
  if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(v)){ toast('Link inválido: precisa terminar em /exec', true); return; }
  S.api = v; LS.set('lv_api', v); S.tela='inicio'; carregar();
}

try{ $('#fav').href = LOGO; }catch(e){}
carregar();

