/* ═════════════════════ COMPROVANTE PELA CONVERSA DA KOMMO (v53) ═════════════════════
   Pedido da Madu (11/11/2026): "no botão comprovante, tem como enviar pela Kommo para o cliente? O importante é a conversa na Kommo."
   O botão Comprovante (celebração da venda, Minhas vendas, Administração) agora manda o comprovante por um serviço próprio ligado à Kommo:
   o serviço acha a cliente pelo WhatsApp, grava o texto no campo "Comprovante (Portal)" do lead e liga um robô que envia a mensagem
   na própria conversa. Se a cliente não está na Kommo, se falta telefone ou se o envio ainda não foi configurado,
   aparece o botão do WhatsApp de sempre (nada se perde).
   Situação (perfil Matheus): Atendimento · Kommo › Configurar › "Comprovante pela conversa".
   Serviço próprio no Railway: comprovante-kommo-las-vegas (comprovante/comprovante-server.js) — o motor da Kommo não foi mexido. */
const C53_URL_FIXO = 'https://comprovante-kommo-las-vegas-production.up.railway.app';
const C53 = {url: LS.get('lv_comp_teste','') || C53_URL_FIXO, ocupado:false, st:null, pronto:false, tk:null, quem:null, exp:0};
/* o serviço diz (sem senha, só sim/não) se o envio pela Kommo está configurado; enquanto não estiver, o botão continua abrindo o WhatsApp direto */
async function c53Status(){ try{ const j = await (await fetch(C53.url+'/api/status')).json(); C53.st = j; C53.pronto = !!j.comprovante; }catch(e){ C53.st = {erro:'O serviço do comprovante não respondeu.'}; C53.pronto = false; } return C53.st; }
setTimeout(c53Status, 1500); setInterval(c53Status, 10*60e3);
/* passe de 12 h com o mesmo PIN que o portal já usa (igual ao motor da Kommo); fica só na memória */
function c53Quem(){ return S.tela==='admin' && S.adm ? 'admin' : S.sess?.eid ? 'eq:'+S.sess.eid : null; }
async function c53Entrar(){
  const q = c53Quem(); if(!q) throw new Error('Entre no portal primeiro');
  if(C53.tk && C53.quem===q && C53.exp > Date.now()+60e3) return;
  const corpo = q==='admin' ? S.adm.cred : {eid:S.sess.eid, ...S.sess.cred};
  let r; try{ r = await fetch(C53.url+'/api/sessao', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(corpo)}); }catch(e){ throw new Error('Sem conexão com o serviço do comprovante'); }
  const j = await r.json().catch(()=>({ok:false, erro:'O serviço do comprovante não respondeu'}));
  if(!j.ok) throw new Error(j.erro || 'Não consegui entrar no serviço do comprovante');
  Object.assign(C53, {tk:j.token, quem:q, exp:j.exp});
}
async function c53Api(p, corpo, tentou){
  await c53Entrar();
  let r; try{ r = await fetch(C53.url+p, {method:'POST', headers:{Authorization:'Bearer '+C53.tk, 'Content-Type':'application/json'}, body:JSON.stringify(corpo||{})}); }catch(e){ throw new Error('Sem conexão com o serviço do comprovante'); }
  const j = await r.json().catch(()=>({ok:false, erro:'Resposta estranha do serviço'}));
  if(r.status===401 && !tentou){ C53.tk = null; return c53Api(p, corpo, true); }
  if(!j.ok) throw new Error(j.erro || 'Erro no envio');
  return j;
}
const C53_PORQUE = {
  sem_contato: 'Essa cliente ainda não tem conversa na Kommo com esse número.',
  sem_lead: 'Essa cliente está na Kommo, mas sem nenhum atendimento aberto para receber a mensagem.',
  nao_configurado: 'O envio pela Kommo ainda não foi configurado pela administração.',
  sem_telefone: 'Faltou o WhatsApp da cliente.',
};

(function(){ const st = document.createElement('style'); st.textContent = `
.c53-ok{text-align:center;padding:6px 0 2px}
.c53-ok .g{font-size:44px;line-height:1;animation:c53Pop .45s var(--mola,ease) both}
.c53-ok b{display:block;font-size:19px;margin:8px 0 4px}
@keyframes c53Pop{from{transform:scale(.4);opacity:0}}
.c53-passos{margin:8px 0 12px;padding-left:20px;font-size:13.5px;line-height:1.5}
.c53-cod{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:8px;background:var(--veludo2,#f4f1f1);font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;cursor:pointer;border:1px dashed var(--linha2,#ccc)}
`; document.head.appendChild(st); })();

function c53Modal(titulo, corpo){          // z-index acima da celebração da venda (#festa), de onde o botão Comprovante é tocado
  $('#modal').innerHTML = `<div class="veu" style="z-index:130" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:420px">
    <div class="modal-t"><h3 class="cresce">${titulo}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${corpo}</div></div></div>`;
}
const _pdvComprovanteV53 = pdvComprovante;
function c53Whats(id, tel){ fecharModal(); _pdvComprovanteV53(id, tel); }
pdvComprovante = async function pdvComprovante(id, tel){
  const v = pdvAchar(id); if(!v) return;
  const t = String(tel || v.cliente_tel || '').replace(/\D/g,'');
  if(t.length < 10 || !C53.pronto) return _pdvComprovanteV53(id, tel);      // sem número: WhatsApp de sempre (a vendedora escolhe o contato)
  if(C53.ocupado) return;
  C53.ocupado = true;
  toast('Enviando o comprovante pela Kommo…');
  const botaoWhats = `<button class="btn largo" style="margin-top:10px" onclick="c53Whats('${esc(id)}','${esc(t)}')"><i class="ti ti-brand-whatsapp"></i> Mandar pelo WhatsApp</button>`;
  try{
    const r = await c53Api('/api/comprovante', {tel:t, texto:textoComprovante(v), venda:v.numero});
    if(r.enviado){
      c53Modal('Comprovante', `<div class="c53-ok"><span class="g">✅</span><b>Enviado pela Kommo${r.nome?' para '+esc(r.nome):''}</b>
        <p class="suave" style="font-size:14px;margin:0 0 12px">A mensagem sai na conversa da cliente em alguns segundos e fica registrada na Kommo.</p>
        ${r.link?`<a class="btn largo" href="${esc(r.link)}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Ver a conversa na Kommo</a>`:''}
        <button class="btn pri largo" style="margin-top:8px" onclick="fecharModal()">Pronto</button></div>`);
    } else {
      c53Modal('Comprovante', `<div class="nota warn"><i class="ti ti-info-circle"></i><div><b>Não foi pela Kommo.</b> ${C53_PORQUE[r.motivo]||'Não deu para enviar pela Kommo agora.'}</div></div>${botaoWhats}`);
    }
  }catch(e){
    c53Modal('Comprovante', `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div><b>Não deu para enviar pela Kommo.</b> ${esc(e.message||'')}</div></div>${botaoWhats}`);
  }finally{ C53.ocupado = false; }
};

/* ═════════ Administração › Atendimento · Kommo › Configurar (só mostra a situação; o robô é ligado no Railway) ═════════ */
function c53Copiar(t){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Copiado ✔')).catch(()=>toast(t)); }
function c53Conferir(){ C53.st = null; c53Status().then(()=>{ try{ render(); }catch(e){} }); try{ render(); }catch(e){} }
function c53Bloco(){
  const c = C53.st, cab = `<h3 style="margin:0 0 4px;font-size:16px">🧾 Comprovante pela conversa`;
  if(!c){ c53Status().then(()=>{ try{ if(typeof naTelaKm==='function' && naTelaKm()) render(); }catch(e){} }); return `<div class="cartao pad" style="margin-bottom:12px">${cab}</h3><p class="suave" style="margin:6px 0 0"><i class="ti ti-loader-2"></i> Abrindo…</p></div>`; }
  if(c.erro && !c.campo) return `<div class="cartao pad" style="margin-bottom:12px">${cab}</h3><p class="suave" style="margin:0 0 8px">${esc(c.erro)}</p><button class="btn p" onclick="c53Conferir()"><i class="ti ti-refresh"></i> Conferir de novo</button></div>`;
  const sim = '<b style="color:var(--ok)">✔</b>', nao = '<b style="color:var(--bad)">✖</b>';
  return `<div class="cartao pad" style="margin-bottom:12px">${cab} ${c.comprovante?'<span class="selo" style="background:var(--ok-bg);color:var(--ok)">ligado</span>':'<span class="selo">falta configurar</span>'}</h3>
    <p class="apagado" style="font-size:13px;margin:0 0 6px">O botão <b>Comprovante</b> do PDV manda a mensagem na conversa da cliente na Kommo (fica registrado lá). Quem envia é um robô da Kommo; o portal só entrega o texto e liga o robô. Cliente que não está na Kommo recebe pelo WhatsApp de sempre.</p>
    <ol class="c53-passos">
      <li>${c.campo?sim:nao} Campo do lead <b>${esc(c.campo?.nome||'Comprovante (Portal)')}</b> na Kommo${c.campo?'':' (o serviço cria sozinho quando a Kommo responde)'}</li>
      <li>${c.robo?sim:nao} Robô (Salesbot) <b>Comprovante do Portal</b>: um passo só, <b>Enviar mensagem</b>, com o texto ${c.marcador?`<span class="c53-cod" title="Toque para copiar" onclick="c53Copiar('${esc(c.marcador)}')">${esc(c.marcador)} <i class="ti ti-copy"></i></span>`:'<i>(aparece aqui quando o campo existir)</i>'}</li>
      <li>${c.robo?sim:nao} Número do robô guardado no Railway (serviço <b>comprovante-kommo-las-vegas</b>, variável <b>COMP_BOT_ID</b>)</li>
    </ol>
    <button class="btn p" onclick="c53Conferir()"><i class="ti ti-refresh"></i> Conferir de novo</button>
  </div>`;
}
if(typeof kmConfig === 'function'){
  const _kmConfigV53 = kmConfig;
  kmConfig = function kmConfig(){
    const h = _kmConfigV53.apply(this, arguments);
    if(!KM.cfg || KM.cfg.erro) return h;
    const ancora = h.indexOf('<div class="cartao pad"><h3 style="margin:0 0 10px;font-size:16px">⏰ Prazo e horário');
    return ancora > 0 ? h.slice(0, ancora) + c53Bloco() + h.slice(ancora) : h + c53Bloco();
  };
}
