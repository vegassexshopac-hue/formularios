/* v18 — Administração › Estoque › Contagens mais detalhada:
   passo a passo em balões, andamento das abertas (produtos, peças, quem está contando, última leitura),
   histórico em cartões com detalhes produto a produto, corrigir/tirar um produto antes de fechar,
   desfazer uma contagem fechada e apagar testes. */
(function(){
  const css = `
.cn-passos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:4px 0 14px}
.cn-passo{position:relative;background:var(--noite2,#f6f3f2);border-radius:14px;padding:10px 12px 10px 42px;font-size:13px;line-height:1.35;animation:cnSobe .45s both}
.cn-passo b{display:block;font-size:14px;margin-bottom:2px}
.cn-passo .n{position:absolute;left:10px;top:10px;width:24px;height:24px;border-radius:50%;background:#e3b448;color:#2a1c00;font-weight:800;display:grid;place-items:center;font-size:13px}
.cn-passo:nth-child(2){animation-delay:.07s}.cn-passo:nth-child(3){animation-delay:.14s}.cn-passo:nth-child(4){animation-delay:.21s}
@media(max-width:760px){.cn-passos{grid-template-columns:1fr 1fr}}
@keyframes cnSobe{from{transform:translateY(10px)}to{transform:none}}
@keyframes cnPulsa{0%,100%{box-shadow:0 0 0 0 rgba(227,180,72,.55)}50%{box-shadow:0 0 0 7px rgba(227,180,72,0)}}
.cn-i{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#e9e4e1;color:#6b5f5a;font-size:11px;font-weight:800;cursor:help;position:relative;vertical-align:2px;margin-left:4px;font-style:normal}
.cn-i:hover::after,.cn-i:focus::after{content:attr(data-d);position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);width:max-content;max-width:260px;background:#231a17;color:#fff;font-weight:500;font-size:12.5px;line-height:1.4;padding:8px 10px;border-radius:10px;z-index:50;white-space:normal;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.cn-i:hover::before,.cn-i:focus::before{content:'';position:absolute;left:50%;bottom:calc(100% + 2px);transform:translateX(-50%);border:6px solid transparent;border-top-color:#231a17;z-index:51}
.cn-card{background:#fff;border:1px solid #eee5e1;border-radius:18px;padding:14px 16px;margin-bottom:10px;animation:cnSobe .4s both}
.cn-card.aberta{border-color:rgba(227,180,72,.75);background:linear-gradient(180deg,#fffaf0,#fff)}
.cn-card .topo{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}
.cn-card h3{margin:0;font-size:16px}
.cn-card .sub{font-size:12.5px;color:#7b6f6a;margin-top:2px}
.cn-st{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;margin-left:6px;vertical-align:2px}
.cn-st.aberta{background:#fff1cc;color:#8a5a00}.cn-st.aberta i{width:7px;height:7px;border-radius:50%;background:#e39b00;animation:cnPulsa 1.6s infinite}
.cn-st.fechada{background:#e3f6ea;color:#1d7a43}.cn-st.desfeita{background:#eceaff;color:#4b3fb5}.cn-st.cancelada{background:#f1eeec;color:#7b6f6a}
.cn-kpis{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}
.cn-kpi{background:#f6f3f2;border-radius:12px;padding:6px 10px;font-size:12.5px;color:#6b5f5a}
.cn-kpi b{font-size:15px;color:#231a17;margin-right:3px}
.cn-kpi.pos b{color:#1d7a43}.cn-kpi.neg b{color:#c0392b}
.cn-acoes{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cn-acoes .btn{font-size:13.5px;padding:8px 12px}
.cn-acoes .lixo{color:#c0392b}
.cn-pessoas{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.cn-pessoas span{background:#f1eeec;border-radius:99px;padding:2px 9px;font-size:12px}
.cn-vazio{background:#f6f3f2;border-radius:14px;padding:14px;color:#7b6f6a;font-size:13.5px}
.cn-tab td .ed{border:0;background:none;cursor:pointer;color:#8b7f7a;padding:2px 4px;font-size:15px}
.cn-tab td .ed:hover{color:#231a17}
.cn-tab td input{width:70px;padding:4px 6px;border:1px solid #ddd;border-radius:8px;font-size:14px}
.cn-quem{font-size:11.5px;color:#8b7f7a}
.cn-busca{width:100%;margin:6px 0 8px}
@media(max-width:640px){.cn-tab table{min-width:0!important;width:100%}.cn-tab tr{display:grid;grid-template-columns:repeat(3,1fr);align-items:center}.cn-tab thead th:first-child{display:none}.cn-tab th,.cn-tab td{padding:6px 8px!important;font-size:13px;border:0!important}.cn-tab td:first-child{grid-column:1/-1;padding-top:10px!important;font-weight:600}.cn-tab tbody tr{border-top:1px solid #f0e9e6}.cn-tab th .cn-i{display:none}.cn-tab td.n,.cn-tab th{text-align:center!important}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

const cnNorm = t => String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const cnDica = t => `<i class="cn-i" tabindex="0" data-d="${esc(t)}">?</i>`;
function cnHa(iso){ if(!iso) return ''; const d = new Date(String(iso).replace(' ','T')); const m = Math.round((Date.now()-d)/60000);
  return isNaN(m) ? '' : m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m/60)} h` : quando(iso); }
const CN_ST = {aberta:['aberta','Aberta — contando'], fechada:['fechada','✅ Fechada — estoque atualizado'], desfeita:['desfeita','↩️ Desfeita — estoque voltou'], cancelada:['cancelada','✖ Cancelada — não mexeu no estoque']};

admContagens = function admContagens(){
  const L = estD().contagens||[], ab = L.filter(c=>c.status==='aberta'), fe = L.filter(c=>c.status!=='aberta');
  const livres = estLocais().filter(l=>!ab.some(c=>c.local===l.id));
  const passos = [
    ['Abra a contagem','Escolha o local (prateleira ou depósito) e toque em Abrir. Um local por vez.'],
    ['A equipe conta','Pelo portal (Estoque › Contar) ou pelo link do mutirão. Várias pessoas juntas, cada uma conta uma parte.'],
    ['Você revisa','Veja sistema × contado, corrija ou tire um produto que foi contado errado.'],
    ['Fecha','Aí o estoque do local vira o número contado. Errou? Dá para desfazer depois.']];
  return `<div class="cartao pad" style="margin-bottom:14px"><h2 style="margin:0 0 4px;font-size:19px">🔢 Levantamento / contagem</h2>
      <p class="suave" style="margin:0 0 10px;font-size:14px">Contar o que tem de verdade em cada local e acertar o estoque do sistema. <b>Dica:</b> conte com a loja fechada ou fora do horário de pico, e um local inteiro de cada vez.</p>
      <div class="cn-passos">${passos.map(([t,d],k)=>`<div class="cn-passo"><span class="n">${k+1}</span><b>${t}</b>${d}</div>`).join('')}</div>
      ${livres.length?`<div class="campo"><label>Onde vai contar? ${cnDica('Cada local tem o seu estoque. Prateleira é o que está à venda na loja; depósito é o que está guardado. Local que já tem contagem aberta não aparece aqui.')}</label>${estChipsLocal(livres.some(l=>l.id===CNA.local)?CNA.local:livres[0].id, "CNA.local='$ID';render()", l=>livres.includes(l))}</div>
      <div class="cnt-scan"><input class="inp" style="font-size:15px;padding:10px" placeholder="Nome (opcional), ex.: Levantamento outubro" value="${esc(CNA.nome)}" oninput="CNA.nome=this.value"><button class="btn ouro" onclick="admContagemAbrir()"><i class="ti ti-player-play"></i> Abrir contagem</button></div>`
      :'<p class="suave" style="margin:0">Todos os locais já têm contagem aberta.</p>'}</div>
    <h2 class="secao">Abertas agora ${cnDica('A equipe já está vendo essas contagens no portal e no link do mutirão. Nada muda no estoque até você fechar.')}</h2>
    ${ab.length ? ab.map(cnCardAberta).join('') : '<div class="cn-vazio">Nenhuma contagem aberta. Abra uma acima para a equipe começar.</div>'}
    <h2 class="secao" style="margin-top:18px">Histórico ${cnDica('Últimos 60 dias. Toque em Ver detalhes para ver produto a produto o que mudou e quem contou. Contagem de teste? Use Apagar: o estoque volta como estava.')}</h2>
    ${fe.length ? fe.map(cnCardFeita).join('') : '<div class="cn-vazio">Nenhuma contagem fechada ainda.</div>'}`;
};
function cnCardAberta(c){
  const a = c.andamento || {produtos:0,pecas:0,pessoas:[],ultima:'',leituras:0};
  return `<div class="cn-card aberta"><div class="topo"><div><h3>${esc(c.nome)}<span class="cn-st aberta"><i></i>contando</span></h3>
      <div class="sub">${esc(estLojaNome(c.local))} · aberta ${quando(c.criada_em)}${c.criada_por?' por '+esc(primeiroNome(c.criada_por)):''}</div></div></div>
    <div class="cn-kpis"><span class="cn-kpi"><b>${a.produtos}</b>produtos contados</span><span class="cn-kpi"><b>${estFmt(a.pecas)}</b>peças</span><span class="cn-kpi"><b>${a.leituras}</b>leituras</span>${a.ultima?`<span class="cn-kpi">última ${cnHa(a.ultima)}</span>`:''}</div>
    ${a.pessoas.length?`<div class="cn-pessoas">👥 ${a.pessoas.map(n=>`<span>${esc(primeiroNome(n)||n)}</span>`).join('')}</div>`:'<div class="sub">Ninguém contou ainda.</div>'}
    <div class="cn-acoes"><button class="btn" onclick="S.adm.estSub='contar';cntAbrir('${c.id}')" title="Você também conta, pelo leitor ou câmera"><i class="ti ti-scan"></i> Contar também</button>
      <button class="btn ouro" onclick="admContagemRevisar('${c.id}')" title="Ver o que foi contado, corrigir e fechar"><i class="ti ti-list-check"></i> Ver, corrigir e fechar</button>
      <button class="btn lixo" onclick="cnApagar('${c.id}','aberta')" title="Descarta as leituras; o estoque não muda"><i class="ti ti-trash"></i> Apagar</button></div></div>`;
}
function cnCardFeita(c){
  const r = c.resumo || {}, [cls, rot] = CN_ST[c.status] || ['cancelada', c.status];
  const kp = c.status==='cancelada' ? '' : `<div class="cn-kpis"><span class="cn-kpi"><b>${r.produtos??0}</b>produtos</span><span class="cn-kpi"><b>${estFmt(r.pecas||0)}</b>peças</span>${r.sobra?`<span class="cn-kpi pos"><b>+${estFmt(r.sobra)}</b>sobrou ${cnDica('Tinha mais na loja do que o sistema dizia.')}</span>`:''}${r.falta?`<span class="cn-kpi neg"><b>−${estFmt(r.falta)}</b>faltou ${cnDica('Tinha menos na loja do que o sistema dizia.')}</span>`:''}${r.iguais?`<span class="cn-kpi"><b>${r.iguais}</b>certinhos</span>`:''}${r.zerados?`<span class="cn-kpi"><b>${r.zerados}</b>zerados ${cnDica('Estavam no sistema mas ninguém contou, então ficaram com 0.')}</span>`:''}</div>`;
  return `<div class="cn-card"><div class="topo"><div><h3>${esc(c.nome)}<span class="cn-st ${cls}">${rot}</span></h3>
      <div class="sub">${esc(estLojaNome(c.local))} · ${c.status==='fechada'?'fechada':'encerrada'} ${quando(c.fechada_em)}${c.fechada_por?' por '+esc(primeiroNome(c.fechada_por)||c.fechada_por):''}${c.status==='desfeita'&&c.obs?' · '+esc(c.obs):''}</div></div></div>
    ${kp}
    <div class="cn-acoes">${c.status!=='cancelada'?`<button class="btn" onclick="cnDetalhe('${c.id}')"><i class="ti ti-list-details"></i> Ver detalhes</button>`:''}
      ${c.status==='fechada'?`<button class="btn" onclick="cnDesfazer('${c.id}')" title="O estoque volta como estava antes desta contagem"><i class="ti ti-arrow-back-up"></i> Desfazer</button>`:''}
      <button class="btn lixo" onclick="cnApagar('${c.id}','${c.status}')"><i class="ti ti-trash"></i> Apagar</button></div></div>`;
}
async function cnApagar(id, status){
  const msg = status==='aberta' ? 'Apagar esta contagem aberta?\n\nAs leituras são descartadas e nada muda no estoque.'
    : status==='fechada' ? 'Apagar esta contagem?\n\nO estoque deste local volta como estava antes dela (o que foi vendido ou entrou depois continua valendo). Use para contagem de teste.'
    : 'Tirar esta contagem do histórico?';
  if(!confirm(msg)) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'contagemApagar', id}); fecharModal(); render(); toast(status==='fechada'?'Contagem apagada ✔ Estoque voltou':'Contagem apagada ✔'); }
  catch(e){ toast(e.message, true); }
}
async function cnDesfazer(id){
  if(!confirm('Desfazer esta contagem?\n\nO estoque deste local volta como estava antes dela (o que foi vendido ou entrou depois continua valendo). Ela continua no histórico marcada como desfeita.')) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'contagemDesfazer', id}); fecharModal(); render(); toast('Contagem desfeita ✔ Estoque voltou'); }
  catch(e){ toast(e.message, true); }
}

/* ─── detalhe de uma contagem fechada/desfeita ─── */
let CND = null;
async function cnDetalhe(id){
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'contagemDetalhe', id}); CND = {...r, f:'dif', q:''}; cnDetalheModal(); }
  catch(e){ toast(e.message, true); }
}
function cnDetalheModal(){
  const c = CND.contagem, it = CND.itens, q = cnNorm(CND.q);
  const vis = it.filter(x=> CND.f==='todos' || (CND.f==='dif' && x.dif) || (CND.f==='sobra' && x.dif>0) || (CND.f==='falta' && x.dif<0))
    .filter(x=>!q || cnNorm(x.produto).includes(q))
    .sort((a,b)=>Math.abs(b.dif)-Math.abs(a.dif));
  const sobra = it.filter(x=>x.dif>0), falta = it.filter(x=>x.dif<0);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(c.nome)} <span class="cn-st ${(CN_ST[c.status]||['cancelada'])[0]}">${(CN_ST[c.status]||[,c.status])[1]}</span></h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="sub suave" style="font-size:13px">${esc(estLojaNome(c.local))} · aberta ${quando(c.criada_em)} · fechada ${quando(c.fechada_em)}${c.fechada_por?' por '+esc(c.fechada_por):''}</div>
      <div class="cn-kpis"><span class="cn-kpi"><b>${it.length}</b>produtos mexidos</span><span class="cn-kpi pos"><b>${sobra.length}</b>sobraram (+${estFmt(sobra.reduce((s,x)=>s+x.dif,0))})</span><span class="cn-kpi neg"><b>${falta.length}</b>faltaram (−${estFmt(-falta.reduce((s,x)=>s+x.dif,0))})</span><span class="cn-kpi"><b>${CND.leituras}</b>leituras</span></div>
      ${Object.keys(CND.pessoas).length?`<div class="cn-pessoas">👥 Contaram: ${Object.entries(CND.pessoas).map(([n,k])=>`<span>${esc(n)} · ${k}</span>`).join('')}</div>`:''}
      <div class="est-q" style="margin-top:10px">${[['dif','Com diferença'],['sobra','Sobrou'],['falta','Faltou'],['todos','Todos']].map(([k,n])=>`<button class="selo ${CND.f===k?'info':''}" style="cursor:pointer;border:0" onclick="CND.f='${k}';cnDetalheModal()">${n}</button>`).join('')}</div>
      <input class="inp cn-busca" placeholder="Buscar produto…" value="${esc(CND.q)}" oninput="CND.q=this.value;clearTimeout(window._cndT);window._cndT=setTimeout(()=>{cnDetalheModal();const i=document.querySelector('.cn-busca');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)">
      <div class="tabela cn-tab"><table><thead><tr><th>Produto</th><th>Antes ${cnDica('Quanto o sistema tinha antes de fechar.')}</th><th>Contado</th><th>Diferença</th></tr></thead><tbody>
      ${vis.slice(0,300).map(x=>`<tr><td>${esc(x.produto)}${x.obs?` <small class="apagado">(${esc(x.obs)})</small>`:''}${x.quem?.length?`<div class="cn-quem">contou: ${x.quem.map(esc).join(', ')}</div>`:''}</td><td class="n num">${estFmt(x.antes)}</td><td class="n num"><b>${estFmt(x.contado)}</b></td><td class="n num" style="color:${x.dif>0?'var(--ok)':x.dif<0?'var(--bad)':'inherit'}">${x.dif>0?'+':''}${x.dif?estFmt(x.dif):'='}</td></tr>`).join('') || '<tr><td colspan="4" class="suave">Nada aqui.</td></tr>'}</tbody></table></div>
      ${c.status==='fechada'?`<div class="cn-acoes" style="margin-top:12px"><button class="btn" onclick="cnDesfazer('${c.id}')"><i class="ti ti-arrow-back-up"></i> Desfazer esta contagem</button><button class="btn lixo" onclick="cnApagar('${c.id}','fechada')"><i class="ti ti-trash"></i> Apagar (era teste)</button></div>`:''}
    </div></div></div>`;
}

/* ─── revisão de uma contagem aberta: agora dá para corrigir ou tirar cada produto ─── */
let CNED = null;   // produto em edição
admContagemModal = function admContagemModal(){
  const c = CNREV.c, t = c.totais, sal = {}; estD().saldos.filter(s=>s.loja===c.local).forEach(s=>{ sal[s.produto_id] = s.qtd; });
  const ids = new Set([...Object.keys(t), ...Object.keys(sal).filter(k=>sal[k]!==0)]);
  const linhas = [...ids].map(pid=>({p:estProd(pid), pid, sis:sal[pid]??0, cont:t[pid]})).filter(x=>x.p);
  const naoCont = linhas.filter(x=>x.cont==null && x.sis>0);
  const q = cnNorm(CNREV.q);
  const vis = linhas.filter(x=> CNREV.f==='todos' || (CNREV.f==='cont' && x.cont!=null) || (CNREV.f==='dif' && (x.cont??(CNREV.zerar?0:x.sis))!==x.sis) || (CNREV.f==='nao' && x.cont==null && x.sis>0))
    .filter(x=>!q || cnNorm(x.p.nome+' '+(x.p.codigo||'')+' '+(x.p.sku||'')).includes(q))
    .sort((a,b)=>Math.abs((b.cont??0)-b.sis)-Math.abs((a.cont??0)-a.sis));
  const pecas = Object.values(t).reduce((s,v)=>s+Math.max(0,v),0);
  const nCont = Object.keys(t).length, sobra = linhas.filter(x=>x.cont!=null && x.cont>x.sis).length, falta = linhas.filter(x=>x.cont!=null && x.cont<x.sis).length;
  const cel = x => {
    if(CNED===x.pid) return `<input id="cned" type="number" min="0" inputmode="numeric" value="${x.cont??''}" onkeydown="if(event.key==='Enter')cnAjustar('${x.pid}');if(event.key==='Escape'){CNED=null;admContagemModal()}"> <button class="ed" onclick="cnAjustar('${x.pid}')" title="Salvar"><i class="ti ti-check"></i></button>`;
    return `${x.cont==null?'<span class="apagado">—</span>':estFmt(x.cont)} <button class="ed" onclick="CNED='${x.pid}';admContagemModal();setTimeout(()=>{const i=$('#cned');i&&i.focus();i&&i.select()},20)" title="Corrigir a quantidade"><i class="ti ti-pencil"></i></button>${x.cont!=null?`<button class="ed" onclick="cnAjustar('${x.pid}',true)" title="Tirar da contagem (como se ninguém tivesse contado)"><i class="ti ti-trash"></i></button>`:''}`;
  };
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(c.nome)} <span class="cn-st aberta"><i></i>contando</span></h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      <div class="cn-kpis" style="margin-top:0"><span class="cn-kpi"><b>${nCont}</b>produtos contados</span><span class="cn-kpi"><b>${estFmt(pecas)}</b>peças</span><span class="cn-kpi pos"><b>${sobra}</b>com sobra</span><span class="cn-kpi neg"><b>${falta}</b>com falta</span><span class="cn-kpi"><b>${c.leituras}</b>leituras · ${Object.keys(c.pessoas).length} pessoa(s)</span></div>
      ${Object.keys(c.pessoas).length?`<div class="cn-pessoas" style="margin-bottom:8px">👥 ${Object.entries(c.pessoas).map(([n,k])=>`<span>${esc(n.replace(/ \((link|desfez|ajuste)\)$/,''))} · ${estFmt(k)} peças</span>`).join('')}</div>`:''}
      <div class="nota" style="margin:6px 0 10px;font-size:13px"><i class="ti ti-info-circle"></i><div>Contaram errado? Toque no <i class="ti ti-pencil"></i> para pôr o número certo ou no <i class="ti ti-trash"></i> para tirar o produto da contagem. Nada muda no estoque até você fechar.</div></div>
      ${naoCont.length?`<label class="linha" style="gap:10px;align-items:flex-start;margin:4px 0 10px;cursor:pointer"><input type="checkbox" ${CNREV.zerar?'checked':''} onchange="CNREV.zerar=this.checked;admContagemModal()" style="margin-top:4px"><div><b>Zerar os ${naoCont.length} produtos que o sistema tinha e ninguém contou</b> ${cnDica('Se a contagem foi do local inteiro, o que ninguém achou não está lá: fica 0. Se contaram só uma parte (uma prateleira, uma categoria), desmarque e esses produtos ficam como estão.')}<br><span class="suave" style="font-size:13px">Marque se a contagem foi completa. Desmarque se foi só uma parte do local.</span></div></label>`:''}
      <div class="est-q">${[['dif','Diferenças'],['cont','Contados'],['nao','Não contados'],['todos','Todos']].map(([k,n])=>`<button class="selo ${CNREV.f===k?'info':''}" style="cursor:pointer;border:0" onclick="CNREV.f='${k}';admContagemModal()">${n}</button>`).join('')}</div>
      <input class="inp cn-busca" id="cnr-q" placeholder="Buscar produto ou código…" value="${esc(CNREV.q||'')}" oninput="CNREV.q=this.value;clearTimeout(window._cnrT);window._cnrT=setTimeout(()=>{admContagemModal();const i=$('#cnr-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)">
      <div class="tabela cn-tab"><table><thead><tr><th>Produto</th><th>Sistema ${cnDica('O que o portal acha que tem hoje neste local.')}</th><th>Contado</th><th>Fica ${cnDica('O número que vai ficar no estoque quando você fechar.')}</th></tr></thead><tbody>
      ${vis.slice(0,250).map(x=>{ const fica = x.cont!=null ? Math.max(0,x.cont) : (CNREV.zerar?0:x.sis), d = fica - x.sis; return `<tr><td>${emojiDe(x.p)} ${esc(x.p.nome)}</td><td class="n num">${estFmt(x.sis)}</td><td class="n num" style="white-space:nowrap">${cel(x)}</td><td class="n num"><b>${estFmt(fica)}</b> ${d?`<small style="color:${d>0?'var(--ok)':'var(--bad)'}">${d>0?'+':''}${estFmt(d)}</small>`:''}</td></tr>`; }).join('') || '<tr><td colspan="4" class="suave">Nada aqui.</td></tr>'}</tbody></table></div>
      ${vis.length>250?`<p class="suave" style="font-size:12.5px">Mostrando 250 de ${vis.length}. Use a busca para achar um produto.</p>`:''}
      <div class="linha quebra" style="gap:8px;margin-top:12px"><button class="btn pri" id="btn-cnf" onclick="admContagemFechar()"><i class="ti ti-lock-check"></i> Fechar e atualizar o estoque</button>
        <button class="btn" onclick="fecharModal()">Continuar depois</button>
        <button class="btn lixo" style="color:var(--bad)" onclick="cnApagar('${c.id}','aberta')"><i class="ti ti-trash"></i> Apagar contagem</button></div></div></div></div>`;
};
async function cnAjustar(pid, tirar){
  let qtd = null;
  if(!tirar){ const v = $('#cned')?.value; if(v===''||v==null) return toast('Digite a quantidade', true); qtd = Number(v); if(!(qtd>=0)) return toast('Quantidade inválida', true); }
  else if(!confirm('Tirar '+(estProd(pid)?.nome||'este produto')+' da contagem?\n\nFica como se ninguém tivesse contado.')) return;
  try{ const r = await api('admEstoque', {...S.adm.cred, op:'contagemAjustar', id:CNREV.c.id, produto_id:pid, qtd});
    CNREV.c = {...CNREV.c, ...r.contagem}; CNED = null; admContagemModal(); toast(tirar?'Produto tirado da contagem':'Quantidade corrigida ✔'); }
  catch(e){ toast(e.message, true); }
}
