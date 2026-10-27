/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v16 (app16.js): NUVEMSHOP (API do site)
   Administração › Vendas e estoque › Nuvemshop:
   • Conectar a loja do site (App ID + Client Secret do Portal de Parceiros → Autorizar).
   • Importar os produtos do site (variações, código, preço e foto) para o PDV.
   • Mandar o estoque do portal para o site (na hora e em lote) e registrar os webhooks
     que trazem os pedidos do site para cá (com baixa automática no depósito).
   Servidor: ponto/servidor/NUVEMSHOP.gs
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.ns-hero{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,var(--veludo2),var(--veludo));border:1px solid var(--linha);margin-bottom:14px;position:relative;overflow:hidden}
.ns-hero .lamp{width:58px;height:58px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;background:rgba(255,255,255,.06);flex:0 0 auto}
.ns-hero.on .lamp{background:rgba(61,220,151,.14);color:var(--ok);box-shadow:0 0 0 0 rgba(61,220,151,.5);animation:nsPulso 2.2s infinite}
.ns-hero.meio .lamp{background:rgba(245,181,36,.14);color:var(--dourado2)}
.ns-hero.off .lamp{background:rgba(227,16,31,.1);color:var(--vermelho)}
@keyframes nsPulso{0%{box-shadow:0 0 0 0 rgba(61,220,151,.45)}70%{box-shadow:0 0 0 14px rgba(61,220,151,0)}100%{box-shadow:0 0 0 0 rgba(61,220,151,0)}}
.ns-hero .cresce{min-width:180px}.ns-hero .acoes{display:flex;gap:6px;flex-wrap:wrap}@media(max-width:640px){.ns-hero .acoes{flex:1 1 100%}}
.ns-hero b{font-size:17px;display:block}.ns-hero small{color:var(--creme3);display:block;margin-top:2px}
.ns-passos{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin:4px 0 14px}
.ns-passo{position:relative;padding:14px 14px 14px 52px;border-radius:14px;background:var(--noite2);border:1px solid var(--linha)}
.ns-passo .n{position:absolute;left:14px;top:13px;width:28px;height:28px;border-radius:50%;background:var(--vermelho);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px}
.ns-passo.ok .n{background:var(--ok)}.ns-passo b{display:block;margin-bottom:3px}.ns-passo p{margin:0;font-size:13px;color:var(--creme2)}
.ns-copia{display:flex;gap:6px;align-items:center;margin-top:8px}.ns-copia code{flex:1;min-width:0;font-size:11.5px;padding:8px 10px;border-radius:9px;background:rgba(0,0,0,.18);border:1px solid var(--linha);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ns-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;align-items:start}
.ns-acao{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:14px;border:1px solid var(--linha);background:var(--noite2);margin-bottom:8px}
.ns-acao .ico{width:40px;height:40px;border-radius:12px;background:rgba(245,181,36,.12);color:var(--dourado2);display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}
.ns-acao b{display:block}.ns-acao p{margin:2px 0 8px;font-size:13px;color:var(--creme2)}
.ns-stat{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}.ns-stat span{font-size:12.5px;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid var(--linha)}
.ns-ped td:first-child{font-weight:800;white-space:nowrap}
.ns-sw{display:flex;gap:10px;align-items:flex-start;cursor:pointer;margin-bottom:8px}.ns-sw input{margin-top:4px}.ns-sw b{display:block}.ns-sw span{font-size:13px;color:var(--creme2)}
.ns-barra{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:8px}.ns-barra i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--dourado),var(--ok));border-radius:99px;transition:width .4s}
`; document.head.appendChild(st); })();

let NSF = null;   // formulário (App ID / secret / locais) enquanto edita
const nsD = () => (S.adm && S.adm.dados && S.adm.dados.nuvemshop) || null;
function nsStatusNome(st){ const m = {open:'Aberto', closed:'Fechado', cancelled:'Cancelado', paid:'Pago', pending:'Pendente', unpaid:'Não pago', unpacked:'A separar', shipped:'Enviado', unshipped:'Não enviado', fulfilled:'Entregue', refunded:'Estornado', voided:'Anulado', authorized:'Autorizado', abandoned:'Abandonado'}; return m[st] || st || '—'; }
function nsQuando(s){ s = String(s||''); return s ? `${s.slice(8,10)}/${s.slice(5,7)} ${s.slice(11,16)}` : '—'; }

function admNuvemshop(){
  const N = nsD();
  if(!N) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem a Nuvemshop.</b> Abra o Apps Script, crie o arquivo <b>NUVEMSHOP</b>, cole o código de <code>ponto/servidor/NUVEMSHOP.gs</code> e publique uma nova versão.</div></div>`;
  if(N.erro) return `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div>Erro ao ler a Nuvemshop: ${esc(N.erro)}</div></div>`;
  const c = N.cfg || {};
  NSF = NSF || {app_id:N.app_id||'', secret:'', locais:[...(c.locais_site||[])], baixa:c.local_baixa||'deposito', baixa_site:!!c.baixa_site, enviar:!!c.enviar_estoque, fotos:c.importar_fotos!==false};
  const estado = N.conectado ? 'on' : N.configurado ? 'meio' : 'off';
  const hero = N.conectado
    ? `<b>Conectado à ${esc(N.loja_nome||'loja do site')}</b><small>Loja nº ${esc(N.store_id)} · desde ${nsQuando(N.conectado_em)}${N.loja_url?` · <a href="${esc(N.loja_url)}" target="_blank" rel="noopener">${esc(N.loja_url.replace(/^https?:\/\//,''))}</a>`:''}</small>`
    : N.configurado ? `<b>App salvo — falta autorizar na loja</b><small>Clique em "Autorizar na Nuvemshop": abre a loja, você confirma e volta pronto.</small>`
    : `<b>Site ainda não conectado</b><small>Siga os 3 passos abaixo. Leva uns 5 minutos e só precisa fazer uma vez.</small>`;
  const passos = `<div class="ns-passos">
    <div class="ns-passo ${N.configurado?'ok':''}"><span class="n">${N.configurado?'<i class="ti ti-check"></i>':'1'}</span><b>Crie o app no Portal de Parceiros</b><p>Em <a href="https://partners.nuvemshop.com.br" target="_blank" rel="noopener">partners.nuvemshop.com.br</a> › Aplicativos › Criar app › tipo <b>Aplicativo externo</b>. Permissões: <b>Produtos</b> (ler e escrever), <b>Pedidos</b> (ler e escrever) e <b>Loja</b> (ler). Em <b>URL de redirecionamento</b> cole:</p>
      <div class="ns-copia"><code id="ns-cb">${esc(N.url_callback||'(publique o servidor como app da web)')}</code><button class="btn p" onclick="nsCopiar('${esc(N.url_callback)}')"><i class="ti ti-copy"></i></button></div></div>
    <div class="ns-passo ${N.configurado?'ok':''}"><span class="n">${N.configurado?'<i class="ti ti-check"></i>':'2'}</span><b>Cole as chaves do app aqui</b><p>No app criado aparecem o <b>App ID</b> (número) e o <b>Client Secret</b>. Cole abaixo e salve — ficam só no servidor.</p>
      <div class="campo" style="margin:10px 0 6px"><label>App ID</label><input class="inp" inputmode="numeric" placeholder="ex.: 12345" value="${esc(NSF.app_id)}" oninput="NSF.app_id=this.value"></div>
      <div class="campo" style="margin:0 0 8px"><label>Client Secret ${N.configurado?'(deixe em branco para manter)':''}</label><input class="inp" type="password" autocomplete="off" placeholder="cole aqui" value="${esc(NSF.secret)}" oninput="NSF.secret=this.value"></div>
      <button class="btn pri" id="ns-salvar" onclick="nsSalvarChaves()"><i class="ti ti-device-floppy"></i> Salvar chaves</button></div>
    <div class="ns-passo ${N.conectado?'ok':''}"><span class="n">${N.conectado?'<i class="ti ti-check"></i>':'3'}</span><b>Autorize o app na sua loja</b><p>Abre a Nuvemshop já logada como dona da loja, você confirma e a Nuvemshop devolve a chave para o portal. Pronto: conectado.</p>
      ${N.url_autorizar?`<a class="btn ouro" style="margin-top:8px" href="${esc(N.url_autorizar)}" target="_blank" rel="noopener"><i class="ti ti-plug-connected"></i> ${N.conectado?'Autorizar de novo':'Autorizar na Nuvemshop'}</a>`:`<span class="apagado" style="font-size:13px">Salve as chaves primeiro.</span>`}
      ${N.conectado?`<button class="btn p" style="margin:8px 0 0 6px" onclick="nsOp('testar',{},'Conexão OK ✔')"><i class="ti ti-activity"></i> Testar</button><button class="btn p fantasma" style="margin:8px 0 0 6px;color:var(--bad)" onclick="if(confirm('Desconectar o site? O estoque e os pedidos param de sincronizar até autorizar de novo.'))nsOp('desconectar',{},'Site desconectado')">Desconectar</button>`:''}</div>
  </div>`;
  const locais = N.locais || [];
  const sync = !N.conectado ? '' : `<div class="ns-grid">
    <div class="cartao pad"><h2 style="margin:0 0 10px;font-size:17px"><i class="ti ti-refresh"></i> O que sincroniza</h2>
      <div class="campo"><label>Locais que somam no estoque do site</label><div class="est-lojas">${locais.map(l=>`<button class="${NSF.locais.includes(l.id)?'on':''}" onclick="nsLocal('${esc(l.id)}')">${esc(l.nome)}</button>`).join('')}</div></div>
      <div class="campo"><label>De onde sai o pedido do site</label><div class="est-lojas">${locais.map(l=>`<button class="${NSF.baixa===l.id?'on':''}" onclick="NSF.baixa='${esc(l.id)}';render()">${esc(l.nome)}</button>`).join('')}</div></div>
      <label class="ns-sw"><input type="checkbox" ${NSF.enviar?'checked':''} onchange="NSF.enviar=this.checked"><div><b>Mandar o estoque para o site na hora</b><span>Venda no PDV, entrada, contagem, transferência ou saída → o site recebe o número novo em segundos.</span></div></label>
      <label class="ns-sw"><input type="checkbox" ${NSF.baixa_site?'checked':''} onchange="NSF.baixa_site=this.checked"><div><b>Dar baixa dos pedidos do site</b><span>Pedido novo no site tira do local escolhido acima. Pedido cancelado devolve.</span></div></label>
      <label class="ns-sw"><input type="checkbox" ${NSF.fotos?'checked':''} onchange="NSF.fotos=this.checked"><div><b>Trazer as fotos do site</b><span>Produto sem foto no portal ganha a foto do site ao importar.</span></div></label>
      <button class="btn pri" id="ns-cfg" onclick="nsSalvarCfg()"><i class="ti ti-device-floppy"></i> Salvar</button></div>
    <div class="cartao pad"><h2 style="margin:0 0 10px;font-size:17px"><i class="ti ti-bolt"></i> Ações</h2>
      <div class="ns-acao"><div class="ico"><i class="ti ti-cloud-download"></i></div><div class="cresce"><b>Importar produtos do site</b><p>Traz todos os produtos e variações (código de barras, SKU, preço, promoção e foto) para o PDV. Pode repetir: não duplica, só atualiza.</p>
        <button class="btn" onclick="nsOp('importar',{},null,'Importando os produtos do site… (até 1 min)')"><i class="ti ti-cloud-download"></i> Importar agora</button>
        <div class="ns-stat"><span>${N.vinculos||0} variações ligadas</span><span>${N.produtos||0} produtos no PDV</span>${c.ultima_importacao?`<span>última: ${nsQuando(c.ultima_importacao)}</span>`:''}</div></div></div>
      <div class="ns-acao"><div class="ico"><i class="ti ti-cloud-upload"></i></div><div class="cresce"><b>Mandar o estoque para o site</b><p>Soma dos locais marcados → estoque de cada variação no site. Envia o que mudou (ou tudo, se marcar).</p>
        <div class="linha quebra" style="gap:6px"><button class="btn" onclick="nsEnviar(false)"><i class="ti ti-cloud-upload"></i> Enviar o que mudou</button><button class="btn p fantasma" onclick="if(confirm('Reenviar o estoque de TODAS as variações? Leva alguns minutos.'))nsEnviar(true)">Reenviar tudo</button></div>
        <div class="ns-barra" id="ns-barra" style="display:none"><i></i></div>
        <div class="ns-stat">${N.fila?`<span style="color:var(--dourado2)">${N.fila} na fila</span>`:'<span>fila vazia</span>'}${c.ultimo_envio?`<span>último envio: ${nsQuando(c.ultimo_envio)}</span>`:''}<span>${N.gatilho?'envio em 2º plano ligado':'envio em 2º plano desligado'}</span></div>
        <button class="btn p fantasma" style="margin-top:6px" onclick="nsOp('gatilho',{ligar:${N.gatilho?'false':'true'}},'${N.gatilho?'Envio em segundo plano desligado':'Envio em segundo plano ligado ✔ (a cada 5 min)'}')"><i class="ti ti-clock-play"></i> ${N.gatilho?'Desligar':'Ligar'} envio em 2º plano</button></div></div>
      <div class="ns-acao"><div class="ico"><i class="ti ti-webhook"></i></div><div class="cresce"><b>Pedidos do site chegando sozinhos</b><p>Registra os avisos (webhooks) na Nuvemshop: pedido criado, pago, cancelado e atualizado aparecem aqui e dão baixa no estoque.</p>
        <div class="linha quebra" style="gap:6px"><button class="btn" onclick="nsOp('webhooks',{},'Webhooks registrados ✔')"><i class="ti ti-webhook"></i> ${(c.webhooks||[]).length?'Conferir':'Registrar'} webhooks</button><button class="btn p fantasma" onclick="nsOp('pedidos',{dias:7},null,'Buscando os pedidos dos últimos 7 dias…')">Buscar pedidos (7 dias)</button></div>
        <div class="ns-stat">${(c.webhooks||[]).length?`<span style="color:var(--ok)">${c.webhooks.length} avisos ligados</span><span>desde ${nsQuando(c.webhooks[0].em)}</span>`:'<span>nenhum aviso registrado</span>'}</div></div></div>
    </div></div>`;
  const ped = N.pedidos || [];
  const pedidos = !N.conectado ? '' : `<h2 class="secao" style="margin-top:16px">Pedidos do site</h2>
    ${ped.length ? `<div class="tabela ns-ped"><table><thead><tr><th>Pedido</th><th>Quando</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Envio</th><th>Estoque</th></tr></thead><tbody>
      ${ped.map(p=>`<tr><td>#${esc(p.numero)}</td><td>${nsQuando(p.criada_em)}</td><td>${esc(p.cliente||'—')}</td><td title="${esc(p.itens.map(i=>i.qtd+'× '+i.nome).join('\n'))}">${p.qtd_itens} ${p.qtd_itens===1?'peça':'peças'}</td><td><b>${brl2(p.total)}</b></td>
        <td><span class="selo">${esc(nsStatusNome(p.status==='cancelled'?'cancelled':p.pagamento_status))}</span></td><td>${esc(nsStatusNome(p.envio_status))}</td>
        <td>${p.devolvido_em?'<span class="selo">devolvido</span>':p.baixa_em?`<span class="selo" style="color:var(--ok)">baixou · ${esc((locais.find(l=>l.id===p.baixa_local)||{}).nome||p.baixa_local)}</span>`:'<span class="apagado">—</span>'}${p.obs?`<div class="apagado" style="font-size:11.5px;margin-top:3px">${esc(p.obs)}</div>`:''}</td></tr>`).join('')}
    </tbody></table></div>` : `<div class="nota info"><i class="ti ti-shopping-bag"></i><div>Nenhum pedido do site ainda. Quando os webhooks estiverem registrados, cada pedido aparece aqui sozinho — ou clique em <b>Buscar pedidos</b>.</div></div>`}`;
  return `<div class="ns-hero ${estado}"><div class="lamp"><i class="ti ${N.conectado?'ti-plug-connected':N.configurado?'ti-plug':'ti-plug-connected-x'}"></i></div><div class="cresce">${hero}</div>
      <div class="acoes">${N.conectado?`<a class="btn p" href="https://${esc((N.loja_url||'www.lasvegassexshop.com.br').replace(/^https?:\/\//,''))}/admin" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Painel da Nuvemshop</a>`:''}</div></div>
    ${N.conectado && !N.vinculos ? `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-arrow-down"></i><div><b>Conectado!</b> Agora clique em <b>Importar produtos do site</b> para ligar cada variação do site a um produto do PDV. Depois registre os webhooks.</div></div>`:''}
    ${N.conectado ? `<details style="margin-bottom:12px"><summary class="apagado" style="cursor:pointer;font-size:13.5px">Chaves do app e autorização</summary>${passos}</details>` : passos}
    ${sync}${pedidos}
    <p class="apagado" style="font-size:12.5px;margin-top:14px;max-width:800px">O token da loja, o Client Secret e a chave dos webhooks ficam nas Propriedades do Apps Script — nunca na planilha nem no celular de ninguém. O estoque que vale é o do portal: o site recebe a soma dos locais marcados.</p>`;
}
function nsCopiar(t){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Copiado ✔')).catch(()=>toast(t)); }
function nsLocal(id){ const i = NSF.locais.indexOf(id); if(i>=0) NSF.locais.splice(i,1); else NSF.locais.push(id); render(); }
async function nsSalvarChaves(){
  const cfg = {app_id:NSF.app_id.trim()}; if(NSF.secret.trim()) cfg.client_secret = NSF.secret.trim();
  if(!cfg.app_id) return toast('Cole o App ID', true);
  if(!nsD().configurado && !cfg.client_secret) return toast('Cole o Client Secret', true);
  await nsOp('cfg', {cfg}, 'Chaves salvas ✔ Agora autorize na Nuvemshop (passo 3).');
  if(NSF) NSF.secret = '';
}
async function nsSalvarCfg(){
  await nsOp('cfg', {cfg:{locais_site:NSF.locais, local_baixa:NSF.baixa, baixa_site:NSF.baixa_site, enviar_estoque:NSF.enviar, importar_fotos:NSF.fotos}}, 'Sincronização salva ✔');
}
async function nsOp(op, dados, okMsg, aguarde){
  document.querySelectorAll('#tela .btn').forEach(b=>b.disabled=true);
  if(aguarde) toast(aguarde);
  try{
    const d = await api('admNuvemshop', {...S.adm.cred, op, ...dados});
    S.adm.dados = d; NSF = null; render();
    if(op==='importar' && d.ns_importacao){ const r = d.ns_importacao; toast(`Importado ✔ ${r.produtos_site} produtos · ${r.variantes} variações · ${r.novos} novos · ${r.atualizados} atualizados${r.fotos?` · ${r.fotos} fotos`:''}`); }
    else if(op==='pedidos') toast(`${d.ns_buscados||0} pedidos conferidos ✔`);
    else if(op==='testar' && d.ns_teste) toast(`Conexão OK ✔ ${d.ns_teste.nome||''}`);
    else if(okMsg) toast(okMsg);
    return d;
  }catch(e){ toast(e.message, true); render(); }
}
async function nsEnviar(tudo){
  const barra = $('#ns-barra'); if(barra){ barra.style.display='block'; barra.firstElementChild.style.width='30%'; }
  document.querySelectorAll('#tela .btn').forEach(b=>b.disabled=true);
  toast(tudo ? 'Reenviando tudo para o site… pode levar alguns minutos' : 'Enviando o estoque para o site…');
  let total = 0, voltas = 0;
  try{
    while(voltas++ < 12){
      const d = await api('admNuvemshop', {...S.adm.cred, op:'enviar', tudo: tudo && voltas===1});
      S.adm.dados = d; const r = d.ns_envio || {}; total += r.enviados||0;
      if(barra) barra.firstElementChild.style.width = Math.min(95, 30 + voltas*10) + '%';
      if(r.erros && r.erros.length) toast('Alguns não foram: ' + r.erros.slice(0,2).join(' · '), true);
      if(!r.restam) break;
      tudo = false;
    }
    NSF = null; render(); toast(`Estoque enviado ✔ ${total} variações atualizadas no site`);
  }catch(e){ toast(e.message, true); render(); }
}

/* ───────── encaixe na Administração (mesmo jeito dos outros módulos) ───────── */
const _telaAdminV16 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, naNs = A.tab === 'nuvemshop';
  if(typeof GRUPOS_ADM !== 'undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('estoque')); if(g && !g.k.includes('nuvemshop')) g.k.splice(g.k.indexOf('estoque')+1, 0, 'nuvemshop'); if(typeof NOMES12 !== 'undefined') NOMES12.admin.nuvemshop = 'Nuvemshop (site)'; }
  if(naNs) A.tab = 'regras';
  let h = _telaAdminV16();
  if(naNs){
    A.tab = 'nuvemshop';
    const base = admRegras(), i = h.lastIndexOf(base);
    if(i >= 0) h = h.slice(0, i) + admNuvemshop() + h.slice(i + base.length);
    h = h.replace(`class="aba on" onclick="S.adm.tab='regras'`, `class="aba " onclick="S.adm.tab='regras'`);
  }
  const btn = `<button class="aba ${naNs?'on':''}" onclick="S.adm.tab='nuvemshop';TR=null;render()"><i class="ti ti-cloud"></i> Nuvemshop </button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV16 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV16();
  if(S.adm && S.tela==='admin') r.unshift({t:'Nuvemshop (site)', s:'Conectar, importar produtos, estoque e pedidos do site', i:'ti-cloud', go:()=>{ S.adm.tab='nuvemshop'; render(); }});
  return r;
};
