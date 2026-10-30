/* ═══════ PORTAL EQUIPE LAS VEGAS · v7 — PDV (Vender) + Arena de vendas (metas em movimento) ═══════
   Vender: catálogo + comanda + pagamento. Cada venda entra na hora na meta (aba Vendas) e fica guardada
   item a item na aba VendasPDV (servidor: arquivo PDV.gs no Apps Script).
   Arena: corrida da meta, anéis, ritmo, feed ao vivo, top produtos — tudo animado e atualizando sozinho. */

const PDV = {car:[], q:'', cat:'', descTipo:'%', descV:'', pag:'', parc:1, receb:'', cli:'', tel:'', obs:'', verCli:false, env:false, uid:null, loja:null, eid:null, aberta:false};
const ARENA = {timer:null, vistos:null, num:{}, prev:{}, pos:{}, tv:false, buscando:false};
const semMov = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const FORMAS = {pix:{n:'Pix', i:'ti-qrcode', c:'#3DDC97'}, dinheiro:{n:'Dinheiro', i:'ti-cash', c:'#F5B524'}, debito:{n:'Débito', i:'ti-credit-card', c:'#7FB7FF'}, credito:{n:'Crédito', i:'ti-credit-card-pay', c:'#C77DFF'}, misto:{n:'Misto', i:'ti-arrows-shuffle', c:'#FF8FA3'}};
const num2 = v => { const t = String(v??'').replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.'); const n = Number(t); return isNaN(n) ? 0 : n; };
const r2 = n => Math.round((Number(n)||0)*100)/100;
const brlC = n => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

/* ───────── dados ───────── */
function pdvD(){
  const d = S.adm ? S.adm.dados : S.sess?.dados;
  if(d && d.pdv && !d.pdv.erro) return d.pdv;
  return {produtos:[], vendas:[], cfg:{desconto_max:15, cancelar_min:15}, semServidor:true, erro:d?.pdv?.erro};
}
const precoDe = p => (p.promo>0 && p.promo<p.preco) ? p.promo : p.preco;
const PDV_ICONES = [[/lubri|gel |oleo|excita|sensibil|aromat|beijav|comest|esquent|esfria|retard/,'💧'],[/vibr|plug|dild|penis|masturb|bullet|capsul|anel|brinq|egg|sugador|estimul/,'💜'],[/lingerie|calcinha|sutia|body|corset|espartilho|camisola|baby ?doll|meia|cinta|tanga|fio/,'👙'],[/fantasia|cosplay|uniforme/,'🎭'],[/algema|chicote|bdsm|venda |mordaca|coleira|fetiche|palmat/,'⛓️'],[/jogo|dado|baralho|raspad|roleta/,'🎲'],[/higien|sabonete|limpa|cleaner|desodor|intimo/,'🫧'],[/perfum|cosmet|hidrat|massag|vela|pomada|creme/,'✨'],[/preserv|camisinha/,'🛡️'],[/presente|kit|cesta|caixa/,'🎁']];
/* v21: um produto pode ter várias categorias, gravadas no mesmo campo separadas por " | " (a 1ª é a principal) */
const CAT_SEP = ' | ';
function catsDe(p){ return String((p && (p.categoria||p.cat)) || '').split('|').map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean); }
function catsTexto(p){ return catsDe(p).join(', '); }
function emojiDe(p){ const t = ' '+semAcento((p.categoria||p.cat||'')+' '+(p.nome||''))+' '; const m = PDV_ICONES.find(([r])=>r.test(t)); return m ? m[1] : '🔥'; }
function lojaAtual(){
  const d = S.sess?.dados; if(!d) return Object.keys(S.boot.lojas)[0];
  const hoje = hojeISO(), esc0 = (d.escala||[]).find(e=>e.data===hoje && e.colaboradora_id===d.colaboradora.id);
  return S.aparelho?.loja || (d.pontos.find(p=>p.data===hoje)||{}).loja || esc0?.loja || d.colaboradora.loja || Object.keys(S.boot.lojas)[0];
}
function maisVendidos(){
  const c = {}; pdvD().vendas.filter(v=>v.status!=='cancelada').forEach(v=>(v.itens||[]).forEach(i=>{ if(i.id) c[i.id]=(c[i.id]||0)+i.qtd; }));
  return c;
}

/* ───────── carrinho ───────── */
function pdvCarregarCarrinho(){
  const eid = S.sess?.eid; if(PDV.eid===eid) return;
  const g = LS.get('lv_pdv_'+eid, null);
  Object.assign(PDV, {car:[], q:'', cat:'', descTipo:'%', descV:'', pag:'', parc:1, receb:'', cli:'', tel:'', obs:'', verCli:false, uid:null}, g||{}, {eid, env:false, loja:(g&&g.loja)||lojaAtual()});
}
function pdvGuardar(){ if(PDV.eid) LS.set('lv_pdv_'+PDV.eid, {car:PDV.car, descTipo:PDV.descTipo, descV:PDV.descV, pag:PDV.pag, parc:PDV.parc, receb:PDV.receb, cli:PDV.cli, tel:PDV.tel, obs:PDV.obs, uid:PDV.uid, loja:PDV.loja}); }
function pdvNovoUid(){ return 'V'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function pdvContas(){
  const sub = r2(PDV.car.reduce((s,i)=>s+i.preco*i.qtd,0));
  const dv = num2(PDV.descV);
  const desc = r2(Math.min(sub, PDV.descTipo==='%' ? sub*dv/100 : dv));
  const max = pdvD().cfg.desconto_max ?? 15;
  const total = r2(sub-desc);
  return {sub, desc, total, pctDesc: sub ? desc/sub*100 : 0, max, acima: sub && desc > sub*max/100 + .01, qtd: PDV.car.reduce((s,i)=>s+i.qtd,0)};
}
function pdvAdd(id, el){
  const p = pdvD().produtos.find(x=>x.id===id); if(!p) return;
  const l = PDV.car.find(i=>i.id===id);
  if(l) l.qtd++; else PDV.car.push({k:'p:'+id, id, nome:p.nome, preco:precoDe(p), cat:p.categoria, qtd:1});
  if(!PDV.uid) PDV.uid = pdvNovoUid();
  pdvGuardar(); if(el) pdvVoar(el, emojiDe(p)); pdvPintar(true);
}
function pdvQtd(k, n){
  const l = PDV.car.find(i=>i.k===k); if(!l) return;
  l.qtd += n;
  if(l.qtd<=0){ const el = document.querySelector(`[data-k="${CSS.escape(k)}"]`); PDV.car = PDV.car.filter(i=>i.k!==k); if(el && !semMov()){ el.classList.add('sai'); setTimeout(()=>{ pdvGuardar(); pdvPintar(true); }, 200); return; } }
  pdvGuardar(); pdvPintar(true);
}
function pdvLimpar(){ if(PDV.car.length && !confirm('Limpar a comanda?')) return; Object.assign(PDV, {car:[], descV:'', pag:'', parc:1, receb:'', cli:'', tel:'', obs:'', verCli:false, uid:null}); pdvGuardar(); pdvPintar(true); }
function pdvAvulso(){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Item avulso</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="font-size:14px;margin-bottom:12px">Produto que ainda não está no catálogo. Escreva o nome para aparecer no relatório.</p>
      <div class="campo"><label>O que é</label><input class="inp" id="av-nome" placeholder="Ex.: Óleo de massagem 120 ml"></div>
      <div class="g2"><div class="campo"><label>Valor (R$)</label><input class="inp num" id="av-preco" inputmode="decimal" placeholder="0,00" onkeydown="if(event.key==='Enter')pdvAvulsoOk()"></div>
      <div class="campo"><label>Quantidade</label><input class="inp num" id="av-qtd" inputmode="numeric" value="1"></div></div>
      <button class="btn ouro largo" onclick="pdvAvulsoOk()"><i class="ti ti-plus"></i> Pôr na comanda</button></div></div></div>`;
  setTimeout(()=>$('#av-nome')?.focus(), 30);
}
function pdvAvulsoOk(){
  const nome = $('#av-nome').value.trim() || 'Item avulso', preco = r2(num2($('#av-preco').value)), qtd = Math.max(1, Math.round(num2($('#av-qtd').value)||1));
  if(preco<=0){ toast('Digite o valor', true); return; }
  PDV.car.push({k:'a:'+Date.now(), id:'', nome, preco, cat:'Avulso', qtd, avulso:true});
  if(!PDV.uid) PDV.uid = pdvNovoUid();
  fecharModal(); pdvGuardar(); pdvPintar(true);
}
function pdvVoar(el, emo){
  if(semMov()) return;
  const alvo = window.innerWidth<=900 ? $('#pdv-folha') : $('#pdv-itens'); if(!alvo) return;
  const a = el.getBoundingClientRect(), b = alvo.getBoundingClientRect();
  const v = document.createElement('div'); v.className='pdv-voa'; v.textContent = emo;
  v.style.left = (a.left+a.width/2-13)+'px'; v.style.top = (a.top+a.height/2-13)+'px';
  document.body.appendChild(v);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ v.style.transform = `translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+Math.min(60,b.height/2)-a.top-a.height/2}px) scale(.5)`; v.style.opacity='.2'; }));
  setTimeout(()=>v.remove(), 600);
}

/* ───────── busca ───────── */
function pdvFiltrar(){
  const prods = pdvD().produtos, q = semAcento(PDV.q.trim()), mv = maisVendidos();
  let r = prods;
  if(PDV.cat) r = r.filter(p=>{ const c = catsDe(p); return c.length ? c.includes(PDV.cat) : PDV.cat==='Sem categoria'; });
  if(q){ const ws = q.split(/\s+/); r = r.filter(p=>{ const t = semAcento(p.nome+' '+(p.codigo||'')+' '+(p.sku||'')+' '+(p.categoria||'')); return ws.every(w=>t.includes(w)); }); }
  r = r.slice().sort((a,b)=> q ? ((semAcento(a.nome).startsWith(q)?0:1)-(semAcento(b.nome).startsWith(q)?0:1) || (mv[b.id]||0)-(mv[a.id]||0) || a.nome.localeCompare(b.nome)) : ((mv[b.id]||0)-(mv[a.id]||0) || a.nome.localeCompare(b.nome)));
  return {lista:r.slice(0, 80), total:r.length, mv};
}
function pdvBusca(ev){
  if(ev.key==='Enter'){
    const q = PDV.q.trim(); if(!q) return;
    const ps = pdvD().produtos, exato = ps.find(p=>(p.codigo && p.codigo===q) || (p.sku && p.sku.toLowerCase()===q.toLowerCase()));
    const f = exato ? [exato] : pdvFiltrar().lista;
    if(f.length===1 || exato){ pdvAdd(f[0].id, document.querySelector('.pdv-prod[data-id]')); PDV.q=''; ev.target.value=''; pdvPintarGrade(); }
    else if(!f.length) toast('Nenhum produto com "'+q+'"', true);
    else toast('Mais de um produto — toque no certo', false);
  } else if(ev.key==='Escape'){ PDV.q=''; ev.target.value=''; pdvPintarGrade(); }
}

/* ───────── tela VENDER ───────── */
function portalPDV(){
  pdvCarregarCarrinho();
  const P = pdvD(), d = S.sess.dados, c = d.colaboradora;
  const cats = [...new Set(P.produtos.flatMap(p=>{ const c = catsDe(p); return c.length ? c : ['Sem categoria']; }))].sort((a,b)=>a.localeCompare(b));
  const hoje = hojeISO(), minhas = P.vendas.filter(v=>v.data===hoje && v.colaboradora_id===c.id && v.status!=='cancelada');
  const somaHoje = minhas.reduce((s,v)=>s+v.total,0);
  return `<div id="pdv-raiz">
    ${P.semServidor?`<div class="nota warn pdv-aviso"><i class="ti ti-plug-connected-x"></i><div><b>Falta ligar o PDV no servidor.</b> ${P.erro?esc(P.erro):'A administração precisa publicar a versão nova do servidor (arquivo PDV no Apps Script). Até lá dá para montar a comanda, mas a venda não é gravada.'}</div></div>`:''}
    <div class="pdv">
      <section class="pdv-esq">
        <div class="pdv-topo">
          <label class="pdv-busca"><i class="ti ti-scan"></i><input id="pdv-q" placeholder="Buscar produto ou bipar o código…" autocomplete="off" value="${esc(PDV.q)}" oninput="PDV.q=this.value;pdvPintarGrade()" onkeydown="pdvBusca(event)"><kbd>Enter</kbd></label>
        </div>
        <div class="pdv-cats"><button class="${!PDV.cat?'on':''}" onclick="PDV.cat='';pdvPintarGrade(true)">Tudo · ${P.produtos.length}</button>${cats.map(k=>`<button class="${PDV.cat===k?'on':''}" onclick="PDV.cat=this.dataset.c;pdvPintarGrade(true)" data-c="${esc(k)}">${emojiDe({categoria:k})} ${esc(k)}</button>`).join('')}</div>
        <div id="pdv-grade" class="pdv-grade"></div>
        <div class="pdv-hoje">
          <span class="selo ${minhas.length?'ok':''}" onclick="pdvMinhasHoje()"><i class="ti ti-receipt"></i> Minhas vendas hoje: <b class="num">${minhas.length}</b> · <b class="num">${brl2(somaHoje)}</b></span>
          <span class="selo" onclick="S.portalTab='arena';render()"><i class="ti ti-flame"></i> Ver a Arena</span>
        </div>
      </section>
      <aside class="pdv-dir ${PDV.aberta?'aberta':''}" id="pdv-comanda"></aside>
    </div>
    <button class="pdv-folha" id="pdv-folha" onclick="PDV.aberta=true;$('#pdv-comanda').classList.add('aberta')"></button>
  </div>`;
}
function pdvPintar(bater){ pdvPintarComanda(bater); pdvPintarGrade(); }
function pdvPintarGrade(reanima){
  const g = $('#pdv-grade'); if(!g) return;
  const P = pdvD();
  document.querySelectorAll('.pdv-cats button').forEach(b=>b.classList.toggle('on', (b.dataset.c||'')===PDV.cat));
  if(!P.produtos.length){
    g.innerHTML = `<button class="pdv-prod avulso" onclick="pdvAvulso()"><span class="emo">➕</span><b>Item avulso</b><small>digite nome e valor</small></button>
      <div class="pdv-vazio" style="grid-column:1/-1"><i class="ti ti-package"></i>O catálogo ainda está vazio.<br>A administração importa os produtos em <b>Administração › PDV › Produtos</b> (planilha da Nuvemshop ou do Gestão Fácil). Enquanto isso, use o <b>item avulso</b>.</div>`;
    return;
  }
  const {lista, total, mv} = pdvFiltrar(), noCar = {}; PDV.car.forEach(i=>{ if(i.id) noCar[i.id]=(noCar[i.id]||0)+i.qtd; });
  const topIds = Object.entries(mv).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  g.innerHTML = lista.map((p,i)=>`<button class="pdv-prod ${topIds.includes(p.id)&&!noCar[p.id]?'top':''}" data-id="${p.id}" style="--i:${reanima||!g.dataset.ok?Math.min(i,24):0}" onclick="pdvAdd('${p.id}',this)">
      <span class="emo">${emojiDe(p)}</span><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||catsDe(p)[0]||'')}</small>
      <span class="preco">${brl2(precoDe(p))}${precoDe(p)<p.preco?`<s>${brl2(p.preco)}</s>`:''}</span>${noCar[p.id]?`<span class="qtd">${noCar[p.id]}</span>`:''}</button>`).join('')
    + `<button class="pdv-prod avulso" onclick="pdvAvulso()"><span class="emo">➕</span><b>Item avulso</b><small>fora do catálogo</small></button>`
    + (total>lista.length?`<div class="pdv-vazio" style="grid-column:1/-1;padding:14px">Mostrando ${lista.length} de ${total}. Digite mais letras para achar.</div>`:'')
    + (!lista.length?`<div class="pdv-vazio" style="grid-column:1/-1"><i class="ti ti-mood-search"></i>Nada com “${esc(PDV.q)}”. Tente outra palavra ou use o item avulso.</div>`:'');
  g.dataset.ok = 1;
}
function pdvPintarComanda(bater){
  const el = $('#pdv-comanda'); if(!el) return;
  const k = pdvContas(), d = S.sess.dados, c = d.colaboradora, P = pdvD();
  const lojas = S.boot.lojas, podeFechar = PDV.car.length && PDV.pag && !k.acima && !PDV.env && !P.semServidor && !(PDV.pag==='dinheiro' && PDV.receb && num2(PDV.receb) < k.total-.009);
  const troco = PDV.pag==='dinheiro' && PDV.receb ? r2(num2(PDV.receb)-k.total) : null;
  const notas = [k.total, ...[20,50,100,200].filter(n=>n>k.total).slice(0,3)];
  el.innerHTML = `<div class="cab">${avatar(c,'',38)}<div><b>Comanda</b><small>${esc(primeiroNome(c.nome))} vendendo</small></div>
      <select title="Loja" onchange="PDV.loja=this.value;pdvGuardar()">${Object.entries(lojas).map(([kk,l])=>`<option value="${kk}" ${PDV.loja===kk?'selected':''}>Loja ${esc(l.nome)}</option>`).join('')}</select>
      <button class="icone fecha-folha" style="display:none" onclick="PDV.aberta=false;$('#pdv-comanda').classList.remove('aberta')"><i class="ti ti-chevron-down"></i></button></div>
    <div class="pdv-itens" id="pdv-itens">${PDV.car.length ? PDV.car.map(i=>`<div class="pdv-item ${PDV.vistos?.has(i.k+'|'+i.qtd)?'':'novo'}" data-k="${esc(i.k)}">
        <div><div class="nm">${i.avulso?'➕ ':''}${esc(i.nome)}</div><div class="un">${brl2(i.preco)} cada</div></div>
        <div class="tt">${brl2(i.preco*i.qtd)}</div>
        <div class="pdv-passo"><button onclick="pdvQtd('${esc(i.k)}',-1)" aria-label="Menos"><i class="ti ti-minus"></i></button><span class="num">${i.qtd}</span><button onclick="pdvQtd('${esc(i.k)}',1)" aria-label="Mais"><i class="ti ti-plus"></i></button></div>
        <div style="text-align:right"><button class="btn p fantasma" style="height:30px;padding:0 6px" onclick="pdvQtd('${esc(i.k)}',-999)"><i class="ti ti-trash"></i></button></div></div>`).join('')
      : `<div class="pdv-limpo"><span class="sacola">🛍️</span>Comanda vazia.<br>Toque num produto ou bipe o código.</div>`}</div>
    <div class="pdv-fecha">
      <div class="pdv-linha"><span>Subtotal · ${k.qtd} ${k.qtd===1?'item':'itens'}</span><b>${brl2(k.sub)}</b></div>
      <div class="pdv-linha"><span>Desconto <small class="apagado">(máx. ${k.max}%)</small></span><span class="pdv-desc"><input class="num" inputmode="decimal" placeholder="0" value="${esc(PDV.descV)}" oninput="PDV.descV=this.value;pdvGuardar();pdvPintarComandaLeve()"><button class="${PDV.descTipo==='%'?'on':''}" onclick="PDV.descTipo='%';pdvGuardar();pdvPintarComanda()">%</button><button class="${PDV.descTipo==='R$'?'on':''}" onclick="PDV.descTipo='R$';pdvGuardar();pdvPintarComanda()">R$</button></span></div>
      <div class="pdv-linha" id="pdv-desc-info" style="${k.desc?'':'display:none'}"><span class="${k.acima?'neg':''}">${k.acima?'⚠️ Acima do permitido — fale com a administração':'Desconto de '+k.pctDesc.toFixed(1).replace('.',',')+'%'}</span><b class="${k.acima?'neg':''}">− ${brl2(k.desc)}</b></div>
      <div class="pdv-total"><span>Total</span><b class="num ${bater?'bate':''}" id="pdv-total">${brl2(k.total)}</b></div>
      <div class="pdv-pags">${Object.entries(FORMAS).map(([f,o])=>`<button class="${PDV.pag===f?'on':''}" onclick="PDV.pag='${f}';pdvGuardar();pdvPintarComanda()"><i class="ti ${o.i}"></i>${o.n}</button>`).join('')}</div>
      ${PDV.pag==='dinheiro'?`<div class="pdv-extra"><div class="campo" style="margin-bottom:0"><label>Valor recebido</label><input class="inp num" id="pdv-receb" inputmode="decimal" placeholder="${brl2(k.total)}" value="${esc(PDV.receb)}" oninput="PDV.receb=this.value;pdvGuardar();pdvPintarTroco()"></div>
        <div class="pdv-notas">${notas.map(n=>`<button onclick="PDV.receb='${String(n).replace('.',',')}';pdvGuardar();pdvPintarComanda()">${n===k.total?'Exato':brl(n)}</button>`).join('')}</div>
        <div id="pdv-troco">${troco==null?'':`<div class="pdv-troco ${troco<0?'ruim':''}"><span>${troco<0?'Falta':'Troco'}</span><b class="num">${brl2(Math.abs(troco))}</b></div>`}</div></div>`:''}
      ${PDV.pag==='credito'?`<div class="pdv-extra"><div class="campo" style="margin-bottom:0"><label>Parcelas</label><select class="inp" onchange="PDV.parc=+this.value;pdvGuardar()">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${PDV.parc===i+1?'selected':''}>${i+1}× de ${brl2(k.total/(i+1))}</option>`).join('')}</select></div></div>`:''}
      ${PDV.pag==='misto'?`<div class="pdv-extra"><input class="inp" placeholder="Como foi pago? Ex.: R$ 50 Pix + resto no débito" value="${esc(PDV.obs)}" oninput="PDV.obs=this.value;pdvGuardar()"></div>`:''}
      ${PDV.verCli?`<div class="pdv-extra g2"><input class="inp" placeholder="Nome da cliente" value="${esc(PDV.cli)}" oninput="PDV.cli=this.value;pdvGuardar()"><input class="inp num" inputmode="tel" placeholder="WhatsApp" value="${esc(PDV.tel)}" oninput="PDV.tel=this.value;pdvGuardar()"></div>`
        :`<button class="pdv-cli" onclick="PDV.verCli=true;pdvPintarComanda()"><i class="ti ti-user-plus"></i> Adicionar cliente (opcional) — para mandar o comprovante</button>`}
      <button class="btn ouro largo pdv-fim" id="pdv-fim" ${podeFechar?'':'disabled'} onclick="pdvFinalizar()">${PDV.env?'<i class="ti ti-loader-2"></i> Gravando…':!PDV.car.length?'Adicione produtos':!PDV.pag?'Escolha o pagamento':`<i class="ti ti-check"></i> Finalizar · ${brl2(k.total)}`}</button>
      ${PDV.car.length?`<button class="btn p fantasma largo" style="margin-top:6px" onclick="pdvLimpar()"><i class="ti ti-eraser"></i> Limpar comanda</button>`:''}
    </div>`;
  PDV.vistos = new Set(PDV.car.map(i=>i.k+'|'+i.qtd));
  if(window.innerWidth<=900){ const f = el.querySelector('.fecha-folha'); if(f) f.style.display=''; }
  const fo = $('#pdv-folha');
  if(fo){ fo.style.display = PDV.car.length ? '' : 'none'; fo.innerHTML = `<span class="n">${k.qtd}</span> Ver comanda <b class="num">${brl2(k.total)}</b>`; if(bater){ fo.classList.remove('bump'); void fo.offsetWidth; fo.classList.add('bump'); } }
}
function pdvPintarComandaLeve(){ // durante a digitação do desconto: não recria o campo (mantém o cursor)
  const k = pdvContas(), t = $('#pdv-total'), info = $('#pdv-desc-info'), fim = $('#pdv-fim');
  if(t) t.textContent = brl2(k.total);
  if(info){ info.style.display = k.desc?'':'none'; info.innerHTML = `<span class="${k.acima?'neg':''}">${k.acima?'⚠️ Acima do permitido — fale com a administração':'Desconto de '+k.pctDesc.toFixed(1).replace('.',',')+'%'}</span><b class="${k.acima?'neg':''}">− ${brl2(k.desc)}</b>`; }
  if(fim){ const ok = PDV.car.length && PDV.pag && !k.acima && !pdvD().semServidor; fim.disabled = !ok; if(ok) fim.innerHTML = `<i class="ti ti-check"></i> Finalizar · ${brl2(k.total)}`; }
  const fo = $('#pdv-folha'); if(fo) fo.querySelector('b') && (fo.querySelector('b').textContent = brl2(k.total));
}
function pdvPintarTroco(){
  const k = pdvContas(), el = $('#pdv-troco'), fim = $('#pdv-fim'); if(!el) return;
  const t = PDV.receb ? r2(num2(PDV.receb)-k.total) : null;
  el.innerHTML = t==null ? '' : `<div class="pdv-troco ${t<0?'ruim':''}"><span>${t<0?'Falta':'Troco'}</span><b class="num">${brl2(Math.abs(t))}</b></div>`;
  if(fim) fim.disabled = !(PDV.car.length && PDV.pag && !k.acima && !(t!=null && t<0));
}

/* ───────── finalizar ───────── */
function minhaPosicao(eid){
  const M = metasDe(mesDe(hojeISO())), A = arenaCalc();
  const p = A.pessoas.find(x=>x.c.id===eid);
  return {val:M.porPessoa[eid]||0, rank: p ? A.pessoas.indexOf(p)+1 : 0, mt:p?.mt||null, pct:p?.pct||0, faixa:p?.faixa||null, frente: p && A.pessoas.indexOf(p)>0 ? A.pessoas[A.pessoas.indexOf(p)-1] : null};
}
async function pdvFinalizar(){
  const k = pdvContas();
  if(!PDV.car.length || !PDV.pag || k.acima || PDV.env) return;
  if(PDV.pag==='dinheiro' && PDV.receb && num2(PDV.receb) < k.total-.009){ toast('Valor recebido menor que o total', true); return; }
  if(!PDV.uid) PDV.uid = pdvNovoUid();
  PDV.env = true; pdvPintarComanda();
  const antes = minhaPosicao(S.sess.eid);
  try{
    const d = await api('venda', {eid:S.sess.eid, ...S.sess.cred, pdv:1, uid:PDV.uid, loja:PDV.loja,
      itens: PDV.car.map(i=>({id:i.id||'', nome:i.nome, preco:i.preco, qtd:i.qtd})),
      desconto: k.desc ? String(k.desc) : '', pagamento:PDV.pag, parcelas:PDV.parc, recebido: PDV.pag==='dinheiro' ? PDV.receb : '',
      cliente:PDV.cli.trim(), cliente_tel:PDV.tel.replace(/\D/g,''), obs:PDV.obs.trim()});
    S.sess.dados = d;
    const venda = d.pdvVenda, cli = {nome:PDV.cli.trim(), tel:PDV.tel.replace(/\D/g,'')};
    Object.assign(PDV, {car:[], descV:'', pag:'', parc:1, receb:'', cli:'', tel:'', obs:'', verCli:false, uid:null, env:false, aberta:false});
    pdvGuardar();
    render();
    pdvCelebrar(venda, antes, minhaPosicao(S.sess.eid), cli);
    if(d.estoqueErro) setTimeout(()=>toast(d.estoqueErro, true), 1500);
    else if(d.estoqueAviso) setTimeout(()=>toast('⚠️ '+d.estoqueAviso), 1500);
  }catch(e){
    PDV.env = false; pdvPintarComanda();
    toast(erroRede(e) ? 'Sem internet: a venda NÃO foi gravada. Toque em Finalizar de novo quando voltar (não duplica).' : e.message, true);
  }
}
function pdvCelebrar(v, antes, depois, cli){
  if(!v) return;
  const f = FORMAS[v.pagamento]||{n:v.pagamento};
  const mt = depois.mt, faltaMeta = mt ? mt.meta - depois.val : 0;
  const prox = mt ? (depois.val<mt.meta?['meta',mt.meta]: depois.val<mt.super?['super meta',mt.super]: depois.val<mt.hiper?['hiper meta',mt.hiper]: null) : null;
  const bateu = mt && antes.faixa !== depois.faixa && depois.faixa;
  const subiu = antes.rank && depois.rank && depois.rank < antes.rank;
  const pctA = antes.pct, pctD = depois.pct;
  const el = document.createElement('div'); el.className='festa'; el.id='festa';
  el.innerHTML = `<div class="festa-raios"></div><div class="festa-card">
    <svg class="festa-check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><path d="M30 52 L45 66 L72 36"/></svg>
    <small class="top">Venda #${v.numero} · ${esc(f.n)}${v.parcelas>1?' '+v.parcelas+'×':''}${v.troco?' · troco '+brl2(v.troco):''}</small>
    <b class="festa-valor num" id="festa-v">${brl2(0)}</b>
    <div class="suave">${v.qtd_itens} ${v.qtd_itens===1?'item':'itens'}${v.desconto?' · desconto '+brl2(v.desconto):''}</div>
    ${mt?`<div class="festa-meta">${anel(pctA, Math.floor(pctD)+'%', 'da meta', 92)}<div><b>${brl(depois.val)} no mês</b><p>${prox?`Faltam <b class="num">${brl(prox[1]-depois.val)}</b> para a ${prox[0]}`:'Hiper meta batida! Você é demais 👑'}</p></div></div>`:''}
    ${subiu?`<div class="festa-sobe">🚀 Você subiu para ${depois.rank}º lugar na Arena!</div>`:''}
    ${bateu?`<div class="festa-trofeu">🏆 ${FAIXA_NOME[depois.faixa].toUpperCase()}!</div>`:''}
    <div class="festa-acoes">
      <button class="btn ouro largo" id="festa-ok" onclick="pdvFecharFesta()"><i class="ti ti-shopping-cart-plus"></i> Nova venda <kbd style="margin-left:6px">Enter</kbd></button>
      <button class="btn" onclick="pdvComprovante('${v.id}','${esc(cli?.tel||'')}')"><i class="ti ti-brand-whatsapp"></i> Comprovante</button>
      <button class="btn" onclick="pdvCupom('${v.id}')"><i class="ti ti-printer"></i> Imprimir</button>
    </div></div>`;
  document.body.appendChild(el);
  chuvaConfete(); if(bateu) setTimeout(chuvaConfete, 900);
  contar($('#festa-v'), 0, v.total, 'brl2', 1100);
  const ring = el.querySelector('.anel .cheio');
  if(ring){ const c = parseFloat(ring.style.strokeDasharray); requestAnimationFrame(()=>requestAnimationFrame(()=>{ ring.style.strokeDashoffset = c*(1-Math.min(100,pctD)/100); })); }
  setTimeout(()=>$('#festa-ok')?.focus(), 60);
  el._tecla = ev => { if(ev.key==='Enter' || ev.key==='Escape'){ ev.preventDefault(); pdvFecharFesta(); } };
  document.addEventListener('keydown', el._tecla);
}
function pdvFecharFesta(){ const el = $('#festa'); if(!el) return; document.removeEventListener('keydown', el._tecla); el.remove(); setTimeout(()=>$('#pdv-q')?.focus(), 30); }
function contar(el, de, ate, fmt, dur=1200){
  if(!el) return; const f = fmt==='brl2'?brl2: fmt==='brl'?brl: fmt==='pct'?(n=>Math.round(n)+'%'): (n=>String(Math.round(n)));
  if(semMov() || de===ate){ el.textContent = f(ate); return; }
  const t0 = performance.now();
  const passo = t => { const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,4); el.textContent = f(de+(ate-de)*e); if(p<1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/* ───────── comprovante / cupom ───────── */
function pdvAchar(id){ return pdvD().vendas.find(v=>v.id===id); }
function textoComprovante(v){
  const loja = S.boot.lojas[v.loja]?.nome||v.loja;
  return `*Las Vegas Sex Shop* · Loja ${loja}\n_Comprovante da compra #${v.numero} · ${ddmm(v.data)} às ${v.hora}_\n\n`
    + v.itens.map(i=>`• ${i.qtd}× ${i.nome} — ${brl2(i.preco*i.qtd)}`).join('\n')
    + (v.desconto?`\nDesconto: − ${brl2(v.desconto)}`:'')
    + `\n*Total: ${brl2(v.total)}* (${FORMAS[v.pagamento]?.n||v.pagamento}${v.parcelas>1?' '+v.parcelas+'×':''})\n\nObrigada pela preferência! 💋\n_O que acontece em Vegas, fica em Vegas._`;
}
function pdvComprovante(id, tel){
  const v = pdvAchar(id); if(!v) return;
  const t = String(tel||'').replace(/\D/g,'');
  window.open('https://wa.me/'+(t?telWa(t):'')+'?text='+encodeURIComponent(textoComprovante(v)), '_blank');
}
function pdvCupom(id){
  const v = pdvAchar(id); if(!v) return;
  const loja = S.boot.lojas[v.loja]?.nome||v.loja;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cupom #${v.numero}</title><style>
    @page{size:80mm auto;margin:4mm}body{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#000;width:72mm;margin:0}
    h1{font-size:15px;text-align:center;margin:0}p{margin:2px 0}.c{text-align:center}.l{display:flex;justify-content:space-between;gap:6px}hr{border:0;border-top:1px dashed #000;margin:6px 0}b{font-weight:700}
    </style></head><body><h1>LAS VEGAS SEX SHOP</h1><p class="c">CNPJ ${EMPRESA.cnpj} · Loja ${esc(loja)}</p><hr>
    <p>Venda #${v.numero} · ${ddmm(v.data)}/${v.data.slice(0,4)} ${v.hora}</p><p>Vendedora: ${esc(primeiroNome(v.colaboradora))}</p>${v.cliente?`<p>Cliente: ${esc(v.cliente)}</p>`:''}<hr>
    ${v.itens.map(i=>`<p>${esc(i.nome)}</p><div class="l"><span>${i.qtd} x ${brl2(i.preco)}</span><span>${brl2(i.qtd*i.preco)}</span></div>`).join('')}<hr>
    <div class="l"><span>Subtotal</span><span>${brl2(v.subtotal)}</span></div>${v.desconto?`<div class="l"><span>Desconto</span><span>- ${brl2(v.desconto)}</span></div>`:''}
    <div class="l"><b>TOTAL</b><b>${brl2(v.total)}</b></div><div class="l"><span>${FORMAS[v.pagamento]?.n||v.pagamento}${v.parcelas>1?' '+v.parcelas+'x':''}</span><span>${v.recebido?'recebido '+brl2(v.recebido):''}</span></div>${v.troco?`<div class="l"><span>Troco</span><span>${brl2(v.troco)}</span></div>`:''}
    <hr><p class="c">*** CUPOM SEM VALOR FISCAL ***</p><p class="c">Obrigada pela preferência!</p><p class="c">O que acontece em Vegas, fica em Vegas.</p></body></html>`;
  const f = document.createElement('iframe'); f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){} setTimeout(()=>f.remove(), 2000); }, 250);
}
function pdvMinhasHoje(){
  const P = pdvD(), eid = S.sess.eid, hoje = hojeISO(), lim = P.cfg.cancelar_min ?? 15;
  const lista = P.vendas.filter(v=>v.data===hoje && v.colaboradora_id===eid).sort((a,b)=>b.criada_em.localeCompare(a.criada_em));
  const pode = v => v.status!=='cancelada' && (agoraServidor().getTime() - new Date(v.criada_em.replace(' ','T')).getTime()) < lim*60000;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">Minhas vendas de hoje</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${lista.length?lista.map(v=>`<div class="pedido" style="align-items:center${v.status==='cancelada'?';opacity:.5':''}">
        <div class="ico"><i class="ti ${FORMAS[v.pagamento]?.i||'ti-receipt'}"></i></div>
        <div class="cresce"><b>#${v.numero} · ${v.hora} · ${brl2(v.total)}</b>${v.status==='cancelada'?' <span class="selo bad">desfeita</span>':''}<p>${esc(v.itens.map(i=>i.qtd+'× '+i.nome).join(', '))}</p></div>
        <div class="linha" style="gap:4px;flex-wrap:wrap;justify-content:flex-end">${v.status!=='cancelada'?`<button class="icone" title="Comprovante no WhatsApp" onclick="pdvComprovante('${v.id}')"><i class="ti ti-brand-whatsapp"></i></button><button class="icone" title="Imprimir" onclick="pdvCupom('${v.id}')"><i class="ti ti-printer"></i></button>`:''}${pode(v)?`<button class="btn p" onclick="pdvDesfazer('${v.id}')"><i class="ti ti-arrow-back-up"></i> Desfazer</button>`:''}</div></div>`).join('')
      : '<p class="suave">Nenhuma venda no PDV hoje ainda. Bora vender! 💃</p>'}
      <p class="apagado" style="font-size:13px;margin-top:12px">Errou? Dá para desfazer a sua venda até ${lim} minutos depois. Depois disso, só a administração cancela.</p></div></div></div>`;
}
async function pdvDesfazer(id){
  const motivo = prompt('Por que desfazer esta venda? (ex.: errei o produto, cliente desistiu)'); if(motivo===null) return;
  try{ S.sess.dados = await api('venda', {eid:S.sess.eid, ...S.sess.cred, pdv:1, cancelar:1, id, motivo}); fecharModal(); render(); toast('Venda desfeita ✔ A meta já foi ajustada.'); }
  catch(e){ toast(e.message, true); }
}

