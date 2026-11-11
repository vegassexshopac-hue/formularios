/* ═════════════════════ COMPROVANTE PELA CONVERSA DA KOMMO (v53) ═════════════════════
   Pedido da Madu (11/11/2026): "no botão comprovante, tem como enviar pela Kommo para o cliente? O importante é a conversa na Kommo."
   O botão Comprovante (celebração da venda, Minhas vendas, Administração) agora manda o comprovante pelo motor da Kommo:
   o motor acha a cliente pelo WhatsApp, grava o texto no campo "Comprovante (Portal)" do lead e liga um robô que envia a mensagem
   na própria conversa. Se a cliente não está na Kommo, se falta telefone ou se o envio ainda não foi configurado,
   aparece o botão do WhatsApp de sempre (nada se perde).
   Configuração (perfil Matheus): Atendimento · Kommo › Configurar › "Comprovante pela conversa".
   Motor: /api/comprovante e /api/comprovante/config (portal-kommo-server.js v53). */
const C53 = {ocupado:false, cfg:null, carregando:false, pronto:false};
/* o motor diz (sem senha, só sim/não) se o envio pela Kommo está configurado; enquanto não estiver, o botão continua abrindo o WhatsApp direto */
async function c53Status(){ try{ const j = await (await fetch(KM.url+'/api/status')).json(); C53.pronto = !!j.comprovante; }catch(e){} }
if(typeof KM !== 'undefined'){ setTimeout(c53Status, 1500); setInterval(c53Status, 10*60e3); }
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
  if(t.length < 10 || typeof kmApi !== 'function' || !C53.pronto) return _pdvComprovanteV53(id, tel);      // sem número: WhatsApp de sempre (a vendedora escolhe o contato)
  if(C53.ocupado) return;
  C53.ocupado = true;
  toast('Enviando o comprovante pela Kommo…');
  const botaoWhats = `<button class="btn largo" style="margin-top:10px" onclick="c53Whats('${esc(id)}','${esc(t)}')"><i class="ti ti-brand-whatsapp"></i> Mandar pelo WhatsApp</button>`;
  try{
    const r = await kmApi('/api/comprovante', {tel:t, texto:textoComprovante(v), venda:v.numero});
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

/* ═════════ Administração › Atendimento · Kommo › Configurar ═════════ */
async function c53Carregar(){
  if(C53.carregando) return; C53.carregando = true;
  try{ C53.cfg = await kmApi('/api/comprovante/config'); }catch(e){ C53.cfg = {erro: /404|estranha/i.test(e.message||'') ? 'O motor da Kommo ainda não tem esta novidade (falta publicar a versão nova).' : e.message}; }
  C53.carregando = false;
  try{ if(typeof naTelaKm==='function' && naTelaKm()) render(); }catch(e){}
}
async function c53Salvar(corpo, ok){
  try{ C53.cfg = await kmApi('/api/comprovante/config', corpo); C53.pronto = !!C53.cfg.pronto; toast(ok); render(); }catch(e){ toast(e.message, true); }
}
function c53Copiar(t){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Copiado ✔')).catch(()=>toast(t)); }
function c53Bloco(){
  const c = C53.cfg;
  if(!c){ c53Carregar(); return `<div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0;font-size:16px">🧾 Comprovante pela conversa</h3><p class="suave" style="margin:6px 0 0"><i class="ti ti-loader-2"></i> Abrindo…</p></div>`; }
  if(c.erro) return `<div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🧾 Comprovante pela conversa</h3><p class="suave" style="margin:0">${esc(c.erro)}</p></div>`;
  return `<div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🧾 Comprovante pela conversa ${c.pronto?'<span class="selo" style="background:var(--ok-bg);color:var(--ok)">ligado</span>':'<span class="selo">falta configurar</span>'}</h3>
    <p class="apagado" style="font-size:13px;margin:0 0 6px">O botão <b>Comprovante</b> do PDV manda a mensagem na conversa da cliente na Kommo (fica registrado lá). Quem envia é um robô da Kommo; o portal só entrega o texto e liga o robô.</p>
    <ol class="c53-passos">
      <li>${c.campo?`Campo do lead <b>${esc(c.campo.nome)}</b> criado ✔`:`<button class="btn p" onclick="c53Salvar({criarCampo:true},'Campo criado na Kommo ✔')"><i class="ti ti-plus"></i> Criar o campo “Comprovante (Portal)” na Kommo</button>`}</li>
      <li>Na Kommo, crie um robô (Salesbot) chamado <b>Comprovante do Portal</b> com um passo só — <b>Enviar mensagem</b> — e cole como texto: ${c.marcador?`<span class="c53-cod" title="Toque para copiar" onclick="c53Copiar('${esc(c.marcador)}')">${esc(c.marcador)} <i class="ti ti-copy"></i></span>`:'<i>(aparece aqui depois de criar o campo)</i>'}</li>
      <li>Abra o robô: o número dele aparece no endereço da página. Digite aqui:
        <div class="linha" style="gap:6px;margin-top:6px"><input class="inp num" id="c53-bot" inputmode="numeric" placeholder="número do robô" value="${c.botId||''}" style="max-width:180px"><button class="btn pri" onclick="c53Salvar({botId:$('#c53-bot').value},'Robô salvo ✔')">Salvar</button></div></li>
    </ol>
    ${(c.ultimos||[]).length?`<p class="apagado" style="font-size:12.5px;margin:0">Últimos envios: ${c.ultimos.slice(0,5).map(u=>`${esc(u.por||'—')}${u.venda?' · venda #'+esc(u.venda):''} · ${typeof kmHora==='function'?kmHora(u.t):''}`).join(' &nbsp;|&nbsp; ')}</p>`:''}
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
