/* ═══════════ Portal Equipe Las Vegas · v69 — entrada nova (sem QR Code por enquanto) ═══════════
   Pedido da Madu (27/11/2026): tirar o QR Code da entrada POR ENQUANTO (a equipe está batendo o ponto
   direto no computador) e deixar a página de entrada mais intuitiva e moderna, sem buraco.
   • QR_PAUSADO69 = true → some o cartão do QR no computador e a opção "Bater o ponto pelo celular".
     Para voltar o QR: trocar para false (o servidor PONTOCEL.gs continua igual, nada foi apagado).
   • Entrada nova: passo a passo (nome → PIN → pronto), cartões grandes com foto e o que cada uma vai fazer
     agora (entrada / voltar do almoço…), coluna ao lado com as lojas ao vivo, "Vem aí" e frase do dia.
   Sem servidor (nada no Apps Script). */

const QR_PAUSADO69 = true;
if(QR_PAUSADO69 && typeof pcLigado === 'function'){ pcLigado = function pcLigado(){ return false; }; }

const _htmlEntradaV69 = htmlEntrada;
htmlEntrada = function htmlEntrada(){
  const qrLigado = !QR_PAUSADO69 && typeof pcLigado==='function' && pcLigado();
  if(qrLigado && !modoLoja()) return _htmlEntradaV69.apply(this, arguments);   // celular com QR ligado: tela da v30
  const b = S.boot, d = agoraServidor(), hoje = hojeISO(), loja = modoLoja();
  if(!loja && S.modoEntrada === 'ponto') S.modoEntrada = 'portal';
  const modo = S.modoEntrada, P = b.painel || {}, ponto = modo === 'ponto';
  const agora = new Map((P.agora||[]).map(a=>[a.eid, a]));
  const h = d.getHours(), saud = h<12 ? 'Bom dia' : h<18 ? 'Boa tarde' : 'Boa noite';
  const lojaAqui = loja ? S.aparelho?.loja : '';
  const escalaHoje = new Set((b.escala||[]).filter(e=>e.data===hoje && (!lojaAqui || e.loja===lojaAqui)).map(e=>e.colaboradora_id));
  const ordem = c => { const a = agora.get(c.id); return !c.temPin ? 5 : !a ? (escalaHoje.has(c.id) ? 0 : 1) : a.st==='saiu' ? 4 : 2; };
  const pessoas = b.colaboradoras.slice().sort((x,y)=> ponto ? (ordem(x)-ordem(y) || x.nome.localeCompare(y.nome)) : x.nome.localeCompare(y.nome));

  const estado = (c, a) => {
    if(!c.temPin) return {cls:'sem', ic:'ti-key-off', t:'PIN não criado', s:'Fale com a administração'};
    if(!ponto) return {cls:'portal', ic:'ti-layout-dashboard', t:'Entrar no portal', s:a ? (ST_TXT[a.st]||'')+' · '+a.desde : 'Toque para entrar'};
    if(!a) return {cls:'entrar', ic:'ti-login-2', t:'Registrar entrada', s:escalaHoje.has(c.id) ? 'Na escala de hoje' : 'Toque para começar'};
    if(a.st==='ativa') return {cls:'ativa', ic:'ti-player-play', t:'Trabalhando', s:'desde '+a.desde};
    if(a.st==='almoco') return {cls:'pausa', ic:'ti-tools-kitchen-2', t:'No almoço', s:'desde '+a.desde};
    if(a.st==='pausa') return {cls:'pausa', ic:'ti-coffee', t:'Na pausa', s:'desde '+a.desde};
    if(a.st==='saiu') return {cls:'saiu', ic:'ti-moon-stars', t:'Já saiu', s:'às '+a.desde+' · dia encerrado'};
    return {cls:'ativa', ic:'ti-clock', t:(ST_TXT[a.st]||'')+' · '+a.desde, s:''};
  };
  const pessoa = (c, i) => { const a = agora.get(c.id), e = estado(c, a);
    return `<button class="e69-p ${e.cls}" style="--i:${i}" onclick="entradaPessoa('${c.id}')" ${c.temPin?'':'aria-disabled="true"'}>
      ${escalaHoje.has(c.id) && ponto && !a ? '<span class="e69-escala"><i class="ti ti-calendar-check"></i> hoje</span>' : ''}
      <span class="e69-av">${avatar(c, a && a.st!=='saiu' ? a.st : '', 84)}</span>
      <b>${esc(primeiroNome(c.nome))}</b>
      <span class="e69-st"><i class="ti ${e.ic}"></i>${esc(e.t)}</span>
      <small>${esc(e.s)}</small>
      <span class="e69-seta"><i class="ti ti-arrow-right"></i></span></button>`; };

  const opc = (m, ic, t, s, off) => `<button class="e69-modo ${modo===m?'on':''} ${off?'off':''}" onclick="entradaModo('${m}')" aria-pressed="${modo===m}">
      <i class="ti ${ic}"></i><span><b>${t}</b><small>${s}</small></span></button>`;
  const lojas = Object.entries(b.lojas).map(([k,l])=>{ const st = lojaStatus(l, d), mt = (P.meta||{})[k], aqui = (P.agora||[]).filter(a=>a.loja===k && a.st!=='saiu');
    return `<div class="e69-loja ${st.aberta?'aberta':''} ${k===lojaAqui?'aqui':''}">
      <div class="linha entre"><b>Loja ${esc(l.nome)}${k===lojaAqui?' <em>você está aqui</em>':''}</b></div>
      <span class="lob-st"><i></i><span data-loja-st="${k}">${st.txt}</span></span>
      <div class="linha entre" style="margin-top:10px;gap:10px"><span class="ent-av">${aqui.map(a=>avatar(a, a.st, 32)).join('') || '<small class="apagado">ninguém no ponto agora</small>'}</span>
      ${mt?`<span class="ent-meta"><small>meta do mês</small><b class="num">${mt.pct}%</b></span>`:''}</div>
      ${mt?`<div class="medidor"><i style="width:${Math.min(100, mt.pct)}%"></i></div>`:''}</div>`; }).join('');
  const ev = (b.calendario?.eventos||[]).filter(e=>e.tipo!=='aviso' && (e.data_fim||e.data)>=hoje).sort((x,y)=>x.data.localeCompare(y.data))[0];
  const evTxt = ev ? (()=>{ const n = Math.round((dt(ev.data)-dt(hoje))/864e5), t = TIPO_EV[ev.tipo]||TIPO_EV.evento; return `<span class="e69-ev-e">${t.e}</span><div><b>${esc(ev.titulo)}</b><small>${n<=0?'hoje':n===1?'amanhã':'em '+n+' dias'}</small></div>`; })() : '';
  const frases = P.frases||[], frase = frases.length ? frases[Math.max(0, LOB.frase) % frases.length] : '';
  const noPonto = (P.agora||[]).filter(a=>a.st!=='saiu').length;
  LOB.ultimo = JSON.stringify([b.painel, b.calendario, b.escala, b.colaboradoras.map(c=>c.temPin)]);

  const passos = ponto
    ? [['ti-hand-finger','Toque no seu nome'],['ti-lock-open','Digite seu PIN'],['ti-circle-check','Pronto, ponto batido']]
    : [['ti-hand-finger','Toque no seu nome'],['ti-lock-open','Digite seu PIN'],['ti-layout-dashboard','Seu portal abre']];

  return `<div class="wrap ent e69 ${S.primeiraVez?'ent-intro':''}">${letreiro(`<div class="linha" style="margin-left:auto;gap:12px"><span class="ao-vivo-chip"><i></i> ao vivo</span><div class="relogio"><b id="clk" class="num">--:--</b></div></div>`)}
    ${S.fila.length?`<div class="faixa"><i class="ti ti-cloud-upload"></i> ${S.fila.length} marcação(ões) guardada(s) sem internet. Envio automático quando a conexão voltar.</div>`:''}
    <div class="e69-topo" style="--i:0">
      <div><h2>${saud}, equipe Las Vegas <span class="e69-onda">👋</span></h2><p>${esc(dataLonga(hoje))}${noPonto?` · <b>${noPonto}</b> no ponto agora`:''}</p></div>
      <div class="e69-modos">
        ${opc('ponto', 'ti-fingerprint', 'Bater o ponto', loja ? 'Entrada, almoço, pausa e saída' : 'Só no computador da loja', !loja)}
        ${opc('portal', 'ti-layout-dashboard', 'Entrar no portal', 'Vender, metas, estoque e mais')}
      </div>
    </div>
    <div class="e69-grade">
      <section class="e69-quem" style="--i:1">
        <div class="e69-quem-topo">
          <div><h3>${ponto ? 'Quem vai bater o ponto?' : 'Quem vai entrar no portal?'}</h3><small>Toque no seu nome</small></div>
          <ol class="e69-passos">${passos.map(([ic,t],i)=>`<li style="--i:${i}"><span><i class="ti ${ic}"></i></span><b>${i+1}</b> ${t}</li>`).join('')}</ol>
        </div>
        ${qrLigado && loja && ponto ? pcCartaoPC() : ''}
        <div class="e69-pessoas">${pessoas.map(pessoa).join('') || '<p class="suave">Ninguém cadastrado ainda.</p>'}</div>
      </section>
      <aside class="e69-lado" style="--i:2">
        <div class="e69-lado-t"><i class="ti ti-building-store"></i> Agora nas lojas</div>
        ${lojas}
        ${evTxt?`<div class="e69-ev"><span>Vem aí</span><div class="e69-ev-c">${evTxt}</div></div>`:''}
        ${frase?`<div class="e69-frase"><i class="ti ti-quote"></i><p id="frase" class="vem">${esc(frase)}</p></div>`:''}
      </aside>
    </div>
    <div class="rodape ent-rod" style="--i:3">
      <button class="btn fantasma p" onclick="painelCompleto(true)"><i class="ti ti-device-tv"></i> Painel completo</button>
      <button class="btn fantasma p" onclick="abrirPin('__admin')"><i class="ti ti-lock"></i> Administração</button>
      ${loja?`<button class="btn fantasma p" onclick="telaCheia()"><i class="ti ti-maximize"></i> Tela cheia</button>`:`<button class="btn fantasma p" onclick="abrirPin('__aparelho')"><i class="ti ti-device-desktop"></i> Autorizar este computador</button>`}
      <button class="btn fantasma p" onclick="carregar()"><i class="ti ti-refresh"></i> Atualizar</button>
    </div></div>`;
};

document.head.insertAdjacentHTML('beforeend', `<style>
.e69{max-width:1320px}
.e69-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:2px 4px 18px;flex-wrap:wrap}
.e69-topo h2{font-size:clamp(26px,3.4vw,38px);font-weight:800;letter-spacing:-.025em;line-height:1.05}
.e69-topo p{color:var(--creme2);font-weight:600;margin-top:6px}
.e69-topo p::first-letter{text-transform:uppercase}
.e69-topo p b{color:var(--ok)}
.e69-onda{display:inline-block;transform-origin:70% 70%;animation:e69Onda 2.4s ease-in-out 1s 2}
@keyframes e69Onda{0%,60%,100%{transform:none}10%,30%{transform:rotate(16deg)}20%,40%{transform:rotate(-8deg)}}
.e69-modos{display:flex;gap:6px;padding:6px;border-radius:22px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.e69-modo{display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;border-radius:16px;text-align:left;color:var(--creme);background:transparent;border:0;transition:background .3s,color .3s,transform .25s var(--mola)}
.e69-modo>i{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--vermelho-claro);color:var(--vermelho);transition:transform .4s var(--mola),background .3s,color .3s}
.e69-modo b{display:block;font-size:15.5px;line-height:1.15}.e69-modo small{display:block;font-size:12.5px;color:var(--creme3);margin-top:2px}
.e69-modo:hover{background:var(--noite)}
.e69-modo.on{background:linear-gradient(130deg,#C10A18,var(--vermelho) 55%,#F0262F);color:#fff;box-shadow:0 12px 26px -14px rgba(227,16,31,.8)}
.e69-modo.on>i{background:rgba(255,255,255,.2);color:#fff;transform:rotate(-6deg) scale(1.05)}
.e69-modo.on small{color:rgba(255,255,255,.82)}
.e69-modo.off{opacity:.5}.e69-modo.off:hover{background:transparent}
.e69-grade{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:16px;align-items:start}
.e69-quem{padding:22px;border-radius:26px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.e69-quem-topo{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.e69-quem h3{font-size:22px;font-weight:800;letter-spacing:-.015em}
.e69-quem-topo small{display:block;color:var(--creme3);font-size:13.5px;margin-top:2px}
.e69-passos{display:flex;gap:6px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.e69-passos li{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 7px;border-radius:999px;background:var(--noite);font-size:13px;font-weight:700;color:var(--creme2);position:relative}
.e69-passos li span{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--vermelho);font-size:16px;box-shadow:var(--sh)}
.e69-passos li b{display:none}
.e69-passos li:not(:last-child)::after{content:'';width:6px;height:6px;border-top:2px solid var(--creme3);border-right:2px solid var(--creme3);transform:rotate(45deg);margin-left:4px;opacity:.6}
.e69-passos li:first-child span{animation:e69Toque 2.6s ease-in-out infinite}
@keyframes e69Toque{0%,70%,100%{transform:none}80%{transform:scale(1.18)}90%{transform:scale(.95)}}
.e69-pessoas{display:grid;grid-template-columns:repeat(auto-fit,minmax(138px,1fr));gap:12px}
.e69-p{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:22px 12px 18px;border-radius:22px;background:var(--noite);border:1.5px solid transparent;color:var(--creme);overflow:hidden;transition:transform .3s var(--mola),box-shadow .3s,border-color .25s,background .25s}
.e69-p::before{content:'';position:absolute;inset:0 0 auto;height:56px;background:linear-gradient(180deg,rgba(227,16,31,.07),transparent);pointer-events:none}
.e69-p.ativa::before{background:linear-gradient(180deg,rgba(14,159,98,.10),transparent)}
.e69-p.pausa::before{background:linear-gradient(180deg,rgba(245,181,36,.16),transparent)}
.e69-av{margin-bottom:6px}
.e69-p .lob-av{font-size:26px;transition:transform .4s var(--mola)}
.e69-p b{font-size:18.5px;line-height:1.1;letter-spacing:-.01em}
.e69-st{white-space:nowrap;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:12.5px;font-weight:700;background:var(--vermelho-claro);color:var(--vermelho2)}
.e69-st i{font-size:14px}
.e69-p.ativa .e69-st{background:var(--ok-bg);color:var(--ok)}
.e69-p.pausa .e69-st{background:var(--warn-bg);color:var(--warn)}
.e69-p.saiu .e69-st,.e69-p.sem .e69-st{background:var(--noite2);color:var(--creme3)}
.e69-p.portal .e69-st{background:var(--info-bg);color:var(--info)}
.e69-p small{font-size:12px;color:var(--creme3);min-height:15px}
.e69-p.saiu{opacity:.62}
.e69-p[aria-disabled]{opacity:.55}
.e69-seta{position:absolute;right:12px;top:12px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--vermelho);color:#fff;font-size:16px;opacity:0;transform:translateX(-6px) scale(.8);transition:opacity .25s,transform .3s var(--mola)}
.e69-escala{position:absolute;left:12px;top:12px;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:800;color:var(--info);background:var(--info-bg);padding:3px 8px;border-radius:999px}
.e69-p:hover{background:#fff;border-color:var(--vermelho);transform:translateY(-5px);box-shadow:var(--sh2)}
.e69-p:hover .lob-av{transform:scale(1.07)}
.e69-p:hover .e69-seta{opacity:1;transform:none}
.e69-p:active{transform:scale(.97)}
.e69-p[aria-disabled]:hover{transform:none;border-color:transparent;box-shadow:none}
.e69-p[aria-disabled] .e69-seta{display:none}
.ent-intro .e69-p{animation:entraCard .5s var(--mola,ease) both;animation-delay:calc(var(--i,0) * 50ms + 240ms)}
.e69-lado{display:flex;flex-direction:column;gap:12px}
.e69-lado-t{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--creme2);text-transform:uppercase;letter-spacing:.06em;margin:4px 4px 0}
.e69-lado-t i{font-size:17px;color:var(--vermelho)}
.e69-loja{padding:14px 16px;border-radius:20px;background:#fff;border:1px solid var(--linha);box-shadow:var(--sh)}
.e69-loja b em{font-style:normal;font-size:11px;font-weight:800;color:var(--vermelho);background:var(--vermelho-claro);padding:2px 7px;border-radius:999px;margin-left:6px;vertical-align:2px}
.e69-loja .lob-st{margin-top:4px}
.e69-loja.aberta .lob-st{color:var(--ok)}.e69-loja.aberta .lob-st i{background:var(--ok);animation:vivo 1.8s infinite}
.e69-loja.aqui{border-color:rgba(227,16,31,.25)}
.e69-ev{padding:14px 16px;border-radius:20px;background:var(--creme);color:#fff}
.e69-ev>span{font-size:12px;font-weight:800;color:#FFD98A;text-transform:uppercase;letter-spacing:.06em}
.e69-ev-c{display:flex;align-items:center;gap:12px;margin-top:8px}
.e69-ev-e{font-size:28px;line-height:1}
.e69-ev b{display:block;font-size:15px;line-height:1.25}.e69-ev small{display:block;font-size:12.5px;color:rgba(255,255,255,.7);margin-top:2px}
.e69-frase{display:flex;gap:10px;padding:14px 16px;border-radius:20px;background:linear-gradient(135deg,var(--ouro-claro),#fff);border:1px solid rgba(227,154,0,.22)}
.e69-frase i{font-size:22px;color:var(--dourado)}
.e69-frase p{font-size:14px;line-height:1.4;font-weight:600;color:var(--creme2)}
.e69 .pc-card{margin:0 0 16px}
@media (max-width:1040px){
  .e69-grade{grid-template-columns:1fr}
  .e69-lado{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .e69-lado-t{grid-column:1/-1}
}
@media (max-width:760px){
  .e69 .ao-vivo-chip{display:none}
  .e69-topo{align-items:stretch}
  .e69-modos{width:100%}.e69-modo{flex:1;flex-direction:column;align-items:flex-start;gap:8px;padding:12px}
  .e69-modo>i{width:38px;height:38px;font-size:20px}
  .e69-quem{padding:16px;border-radius:22px}
  .e69-quem-topo{margin-bottom:14px}
  .e69-passos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}
  .e69-passos li{flex-direction:column;gap:4px;padding:8px 4px;border-radius:14px;font-size:11px;line-height:1.15;text-align:center}
  .e69-passos li span{width:26px;height:26px;font-size:14px}
  .e69-passos li:not(:last-child)::after{display:none}
  .e69-pessoas{grid-template-columns:1fr 1fr;gap:10px}
  .e69-p{padding:18px 8px 14px}.e69-p b{font-size:16.5px}.e69-st{font-size:11.5px;padding:3px 8px}
  .e69-lado{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.e69-onda,.e69-passos li:first-child span{animation:none}}
</style>`);
