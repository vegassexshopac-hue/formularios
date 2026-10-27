/* ═══════════ Portal Equipe Las Vegas · v14 — entrada nova ═══════════
   A primeira tela fica enxuta: escolher "Bater o ponto" ou "Entrar no portal", tocar no nome, digitar o PIN.
   O que é ao vivo fica num resumo curto; o painel completo (bom para a TV da loja) continua a um toque.
   O portal agora abre em equipe.lasvegassexshop.com.br (sem /ponto). */

const _telaInicioV6 = telaInicio;
S.modoEntrada = modoLoja() ? 'ponto' : 'portal';
S.painelCompleto = false;

function entradaModo(m){
  if(m === 'ponto' && !modoLoja()){ toast('O ponto é batido no computador autorizado da loja. Aqui você entra no portal.'); return; }
  S.modoEntrada = m; render();
}
function entradaPessoa(id){ S.intencao = S.modoEntrada; abrirPin(id); }
function painelCompleto(on){ S.painelCompleto = on; S.primeiraVez = on; render(); window.scrollTo({top:0}); }

function htmlEntrada(){
  const b = S.boot, d = agoraServidor(), hoje = hojeISO(), loja = modoLoja();
  if(!loja && S.modoEntrada === 'ponto') S.modoEntrada = 'portal';
  const modo = S.modoEntrada, P = b.painel || {};
  const agora = new Map((P.agora||[]).map(a=>[a.eid, a]));
  const h = d.getHours(), saud = h<12 ? 'Bom dia' : h<18 ? 'Boa tarde' : 'Boa noite';
  const pessoas = b.colaboradoras.slice().sort((x,y)=>x.nome.localeCompare(y.nome));
  const stTxt = a => !a ? '' : a.st==='ativa' ? 'trabalhando · desde '+a.desde : a.st==='saiu' ? 'já saiu · '+a.desde : (ST_TXT[a.st]||'') + ' · ' + a.desde;
  const pessoa = (c, i) => { const a = agora.get(c.id);
    return `<button class="ent-p" style="--i:${i}" onclick="entradaPessoa('${c.id}')" ${c.temPin?'':'aria-disabled="true"'}>
      ${avatar(c, a && a.st!=='saiu' ? a.st : '', 58)}
      <b>${esc(primeiroNome(c.nome))}</b>
      <small>${!c.temPin ? '<span class="neg">PIN não criado</span>' : a ? esc(stTxt(a)) : (modo==='ponto' ? 'Bater o ponto' : 'Entrar')}</small></button>`; };
  const opc = (m, ic, t, s, off) => `<button class="ent-modo ${modo===m?'on':''} ${off?'off':''}" onclick="entradaModo('${m}')" aria-pressed="${modo===m}">
      <i class="ti ${ic}"></i><span><b>${t}</b><small>${s}</small></span></button>`;
  const lojas = Object.entries(b.lojas).map(([k,l])=>{ const st = lojaStatus(l, d), mt = (P.meta||{})[k], aqui = (P.agora||[]).filter(a=>a.loja===k && a.st!=='saiu');
    return `<div class="ent-loja ${st.aberta?'aberta':''}"><div class="linha entre"><b>Loja ${esc(l.nome)}</b><span class="lob-st"><i></i><span data-loja-st="${k}">${st.txt}</span></span></div>
      <div class="linha entre" style="margin-top:10px;gap:10px"><span class="ent-av">${aqui.map(a=>avatar(a, a.st, 30)).join('') || '<small class="apagado">ninguém no ponto agora</small>'}</span>
      ${mt?`<span class="ent-meta"><small>meta do mês</small><b class="num">${mt.pct}%</b></span>`:''}</div>
      ${mt?`<div class="medidor"><i style="width:${Math.min(100, mt.pct)}%"></i></div>`:''}</div>`; }).join('');
  const ev = (b.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && (e.data_fim||e.data)>=hoje).sort((x,y)=>x.data.localeCompare(y.data))[0];
  const evTxt = ev ? (()=>{ const n = Math.round((dt(ev.data)-dt(hoje))/864e5), t = TIPO_EV[ev.tipo]||TIPO_EV.evento; return `${t.e} <b>${esc(ev.titulo)}</b> · ${n<=0?'hoje':n===1?'amanhã':'em '+n+' dias'}`; })() : '';
  LOB.ultimo = JSON.stringify([b.painel, b.calendario, b.escala, b.colaboradoras.map(c=>c.temPin)]);
  return `<div class="wrap ent ${S.primeiraVez?'ent-intro':''}">${letreiro(`<div class="linha" style="margin-left:auto;gap:12px"><span class="ao-vivo-chip"><i></i> ao vivo</span><div class="relogio"><b id="clk" class="num">--:--</b></div></div>`)}
    ${S.fila.length?`<div class="faixa"><i class="ti ti-cloud-upload"></i> ${S.fila.length} marcação(ões) guardada(s) sem internet. Envio automático quando a conexão voltar.</div>`:''}
    <div class="ent-topo" style="--i:0"><div><h2>${saud}, equipe Las Vegas</h2><p>${esc(dataLonga(hoje))}</p></div></div>
    <div class="ent-modos" style="--i:1">
      ${opc('ponto', 'ti-fingerprint', 'Bater o ponto', loja ? 'Entrada, almoço, pausa e saída' : 'Só no computador da loja', !loja)}
      ${opc('portal', 'ti-layout-dashboard', 'Entrar no portal', 'Vender, metas, estoque, pedidos e mais')}
    </div>
    <section class="ent-quem" style="--i:2"><h3>Quem é você?</h3><small>Toque no seu nome e digite o PIN</small>
      <div class="ent-pessoas">${pessoas.map(pessoa).join('') || '<p class="suave">Ninguém cadastrado ainda.</p>'}</div></section>
    <section class="ent-agora" style="--i:3"><div class="ent-lojas">${lojas}</div>
      ${evTxt?`<div class="ent-ev"><span>Vem aí</span><p>${evTxt}</p></div>`:''}</section>
    <div class="rodape ent-rod" style="--i:4">
      <button class="btn fantasma p" onclick="painelCompleto(true)"><i class="ti ti-device-tv"></i> Painel completo</button>
      <button class="btn fantasma p" onclick="abrirPin('__admin')"><i class="ti ti-lock"></i> Administração</button>
      ${loja?`<button class="btn fantasma p" onclick="telaCheia()"><i class="ti ti-maximize"></i> Tela cheia</button>`:`<button class="btn fantasma p" onclick="abrirPin('__aparelho')"><i class="ti ti-device-desktop"></i> Autorizar este computador</button>`}
      <button class="btn fantasma p" onclick="carregar()"><i class="ti ti-refresh"></i> Atualizar</button>
    </div></div>`;
}
telaInicio = function telaInicio(){
  if(!S.painelCompleto) return htmlEntrada();
  return _telaInicioV6().replace(/<div class="wrap lobby/, `<button class="btn ent-voltar" onclick="painelCompleto(false)"><i class="ti ti-arrow-left"></i> Voltar para a entrada</button>$&`);
};

/* depois do PIN: no computador da loja, quem escolheu "Entrar no portal" vai direto para o portal */
const _renderV14 = render;
render = function(){
  if(S.tela==='bater' && S.intencao==='portal' && S.sess?.dados){ S.tela = 'portal'; S.portalTab = S.portalTab || 'inicio'; }
  if(S.tela!=='inicio') S.intencao = null;
  if(S.tela==='inicio' && !S.sess) S.modoEntrada = S.modoEntrada || (modoLoja() ? 'ponto' : 'portal');
  return _renderV14.apply(this, arguments);
};

document.head.insertAdjacentHTML('beforeend', `<style>
.ent{max-width:1080px}
.ent-intro>*{animation:entraBloco .6s var(--suave,ease) both;animation-delay:calc(var(--i,0) * 80ms + 60ms)}
.ent-intro .ent-p{animation:entraCard .5s var(--mola,ease) both;animation-delay:calc(var(--i,0) * 45ms + 260ms)}
.ent-topo{margin:4px 4px 16px}
.ent-topo h2{font-size:clamp(26px,3.6vw,36px);font-weight:800;letter-spacing:-.025em;line-height:1.05;font-variation-settings:'opsz' 96}
.ent-topo p{color:var(--creme2);font-weight:600;margin-top:4px}
.ent-topo p::first-letter{text-transform:uppercase}
.ent-modos{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ent-modo{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:20px;background:#fff;border:1.5px solid var(--linha);box-shadow:var(--sh);text-align:left;color:var(--creme);transition:transform .25s var(--mola),box-shadow .25s,background .3s,border-color .3s;position:relative;overflow:hidden}
.ent-modo>i{width:50px;height:50px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--vermelho-claro);color:var(--vermelho);flex-shrink:0;transition:transform .4s var(--mola),background .3s,color .3s}
.ent-modo b{display:block;font-size:17px;line-height:1.15}.ent-modo small{display:block;font-size:13px;color:var(--creme3);margin-top:2px}
.ent-modo:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
.ent-modo.on{background:linear-gradient(130deg,#C10A18,var(--vermelho) 55%,#F0262F);border-color:transparent;color:#fff;box-shadow:0 14px 30px -14px rgba(227,16,31,.7)}
.ent-modo.on>i{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.06) rotate(-6deg)}
.ent-modo.on small{color:rgba(255,255,255,.8)}
.ent-modo.off{opacity:.55;box-shadow:none;background:transparent;border-style:dashed}
.ent-modo.off:hover{transform:none}
.ent-quem{margin-top:22px;padding:20px;border-radius:24px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.ent-quem h3{font-size:19px;font-weight:800;letter-spacing:-.01em}
.ent-quem>small{display:block;color:var(--creme3);font-size:13px;margin-top:2px}
.ent-pessoas{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:14px}
.ent-p{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:18px 10px 16px;border-radius:20px;background:var(--noite);border:1.5px solid transparent;color:var(--creme);transition:transform .25s var(--mola),box-shadow .25s,border-color .2s,background .2s;position:relative;overflow:hidden}
.ent-p b{font-size:17px;line-height:1.1}.ent-p small{font-size:12.5px;color:var(--creme3);line-height:1.25;min-height:16px}
.ent-p:hover{background:#fff;border-color:var(--vermelho);transform:translateY(-4px);box-shadow:var(--sh2)}
.ent-p:active{transform:scale(.97)}
.ent-p[aria-disabled]{opacity:.6}
.ent-p .lob-av{font-size:19px;transition:transform .35s var(--mola)}
.ent-p:hover .lob-av{transform:scale(1.08)}
.ent-agora{display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:14px;align-items:stretch}
.ent-lojas{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ent-loja{padding:14px 16px;border-radius:18px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.ent-loja.aberta .lob-st{color:var(--ok)}.ent-loja.aberta .lob-st i{background:var(--ok);animation:vivo 1.8s infinite}
.ent-av{display:flex;align-items:center;min-height:34px}.ent-av .lob-av{margin-right:-6px;font-size:11px}
.ent-meta{text-align:right;line-height:1.05}.ent-meta small{display:block;font-size:11.5px;color:var(--creme3);font-weight:600}.ent-meta b{font-size:20px;color:var(--vermelho)}
.ent-ev{max-width:280px;padding:14px 16px;border-radius:18px;background:var(--creme);color:#fff;display:flex;flex-direction:column;justify-content:center}
.ent-ev span{font-size:12px;font-weight:800;color:#FFD98A}.ent-ev p{font-size:14.5px;margin-top:4px;line-height:1.35}
.ent-rod{margin-top:22px}
.ent-voltar{position:fixed;left:16px;bottom:16px;z-index:45;background:var(--creme);color:#fff;border-color:var(--creme);box-shadow:var(--sh2)}
@media (max-width:760px){
  .ent .ao-vivo-chip{display:none}
  .ent-modos{grid-template-columns:1fr 1fr;gap:8px}
  .ent-modo{flex-direction:column;align-items:flex-start;gap:10px;padding:14px}
  .ent-modo>i{width:42px;height:42px;font-size:22px}
  .ent-modo b{font-size:15.5px}.ent-modo small{font-size:12px}
  .ent-quem{padding:16px;margin-top:16px}
  .ent-pessoas{grid-template-columns:1fr 1fr;gap:10px}
  .ent-agora{grid-template-columns:1fr}.ent-lojas{grid-template-columns:1fr}.ent-ev{max-width:none}
}
</style>`);
