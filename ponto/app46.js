/* ═══════════ Portal Equipe Las Vegas · v46 — "Minha meta" animada + "Tirar dúvida" monitorado ═══════════
   Pedidos da Madu (04/11, dia da apresentação do portal à equipe):
   1) Metas visíveis com motion graphics, fácil de ver, "concorrência saudável" e quanto falta para cada metinha e a meta
      → cartão "Minha meta" no topo do Início da vendedora: barra que enche até a hiper, metinhas (25/50/75%), quanto falta,
        quanto vender por dia para bater, vendido hoje, posição no ranking e a corrida da equipe com as fotos.
   2) Botão de busca para a equipe tirar dúvida no próprio portal — e monitorado (quem perguntou o quê)
      → botão "Tirar dúvida" (flutuante + Ctrl+K não), guia com passo a passo, botão "Ir para a tela", vídeo do assunto,
        "Resolveu / Não resolveu", IA (se a chave da IA estiver ligada) e "Suas dúvidas" com a resposta da administração.
        Administração › Comunicação › "Dúvidas da equipe": métricas, quem usa, o que mais perguntam, responder, vídeos.
   Servidor: AJUDA.gs (ações duvida e admDuvidas). Sem ele: o guia funciona, só não registra.
   Nomes internos: MM46/mm46…, AJ46/aj46…, DV46/dv46…. */

/* ═════════════════ 1) MINHA META ═════════════════ */
const MM46 = { ultimoNivel: null };
const MM46_ROTULO = {m1:'1ª metinha', m2:'2ª metinha', m3:'3ª metinha', meta:'Meta', super:'Super meta', hiper:'Hiper meta'};
function mm46On(){ return typeof mod45On!=='function' || mod45On('metas') || mod45On('arena'); }
function mm46Dados(){
  const eid = S.sess?.eid; if(!eid || typeof minhaPosicao!=='function') return null;
  let A, P;
  try{ A = arenaCalc(); P = minhaPosicao(eid); }catch(e){ return null; }
  const hoje = A.hoje, mt = P.mt, val = P.val;
  const uteis = typeof diasUteis==='function' ? diasUteis(A.ym) : [];
  const restam = Math.max(1, uteis.filter(d=>d>=hoje).length);
  const hojeV = (A.M.v||[]).filter(v=>v.data===hoje && v.colaboradora_id===eid).reduce((s,v)=>s+(Number(v.valor)||0),0);
  let marcos = [];
  if(mt){
    marcos = [
      {k:'m1', v:Math.round(mt.meta*.25)}, {k:'m2', v:Math.round(mt.meta*.5)}, {k:'m3', v:Math.round(mt.meta*.75)},
      {k:'meta', v:mt.meta}, {k:'super', v:mt.super}, {k:'hiper', v:mt.hiper}
    ].filter((m,i,l)=>m.v>0 && (i===0 || m.v>l[i-1].v));
  }
  const prox = marcos.find(m=>m.v>val) || null, feitos = marcos.filter(m=>m.v<=val);
  const nivel = feitos.length ? feitos[feitos.length-1].k : '';
  const alvoDia = mt ? Math.max(0, (val>=mt.meta ? (val>=mt.super ? mt.hiper : mt.super) : mt.meta) - (val - hojeV)) / restam : 0;
  const pessoas = A.pessoas, eu = pessoas.findIndex(p=>p.c.id===eid);
  return {A, P, mt, val, hoje, hojeV, restam, marcos, prox, nivel, alvoDia, pessoas, eu, premios:A.M.premios||{}};
}
function mm46Cartao(){
  if(S.tela!=='portal' || !mm46On()) return '';
  const D = mm46Dados(); if(!D) return '';
  const {mt, val, marcos, prox, pessoas, eu} = D;
  const max = mt ? mt.hiper : Math.max(1, pessoas[0]?.val||1);
  const pc = x => Math.max(0, Math.min(100, x/max*100));
  const irPara = typeof mod45On!=='function' || mod45On('arena') ? 'arena' : 'metas';
  const nomeP = p => esc(primeiroNome(p.c.nome));
  // frase de competição saudável
  let corrida = '';
  if(eu > 0){ const f = pessoas[eu-1], dif = f.val - val; corrida = `🏃‍♀️ Faltam <b>${brl(dif+1)}</b> para passar a <b>${nomeP(f)}</b>`; }
  else if(eu === 0 && pessoas.length > 1){ const s = pessoas[1], dif = val - s.val; corrida = dif > 0 ? `👑 Você lidera! <b>${brl(dif)}</b> à frente da <b>${nomeP(s)}</b>` : `🤝 Empatada com a <b>${nomeP(s)}</b> — a próxima venda decide!`; }
  const premio = k => D.premios[k] ? ` · prêmio ${brl(D.premios[k])}` : '';
  const proxTxt = !mt ? 'A meta deste mês ainda não foi definida — mas a corrida já começou!'
    : prox ? `Faltam <b class="mm46-falta">${brl(prox.v - val)}</b> para a <b>${MM46_ROTULO[prox.k]}</b>${['meta','super','hiper'].includes(prox.k)?premio(prox.k):''}`
    : `🔥 <b>HIPER META BATIDA!</b> Você é demais!`;
  const marcosHTML = mt ? marcos.map(m=>`<span class="mm46-mk ${m.v<=val?'ok':''} ${['meta','super','hiper'].includes(m.k)?'g':''}" style="left:${pc(m.v)}%" title="${MM46_ROTULO[m.k]}: ${brl(m.v)}"><i></i><small>${['meta','super','hiper'].includes(m.k)?MM46_ROTULO[m.k].replace(' meta',''):''}</small></span>`).join('') : '';
  const top = pessoas.slice(0, 6), lider = Math.max(1, top[0]?.val||1);
  const corridaHTML = top.length > 1 ? `<div class="mm46-run">${top.map((p,i)=>`<div class="mm46-rl ${p.c.id===S.sess.eid?'eu':''}" style="--d:${i*70}ms">
      <span class="mm46-pos">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>${avatar(p.c, '', 28)}<span class="mm46-rn">${nomeP(p)}</span>
      <span class="mm46-rb"><i style="--w:${Math.max(3, p.val/lider*100)}%"></i></span><b class="num">${brl(p.val)}</b></div>`).join('')}</div>` : '';
  return `<section class="mm46" onclick="if(!event.target.closest('button'))mm46Ir('${irPara}')" role="button" tabindex="0">
    <div class="mm46-top">
      <div><small>Minha meta · ${esc(nomeMes(D.A.ym).split(' ')[0])}</small>
        <b class="mm46-val num" data-mm46="${Math.round(val)}">${brl(0)}</b>
        <span class="mm46-de">${mt?`de ${brl(mt.meta)} · <b>${Math.floor(val/mt.meta*100)}%</b>`:'vendido no mês'}</span></div>
      ${eu>=0?`<div class="mm46-rank"><span>${eu+1}º</span><small>de ${pessoas.length}</small></div>`:''}
    </div>
    <div class="mm46-barra"><div class="mm46-fill" style="--w:${pc(val)}%"></div>${marcosHTML}</div>
    <div class="mm46-prox">${proxTxt}</div>
    <div class="mm46-chips">
      <span><i class="ti ti-sun"></i> Hoje <b>${brl(D.hojeV)}</b></span>
      ${mt && val < mt.hiper ? `<span><i class="ti ti-target-arrow"></i> Vender <b>${brl(Math.ceil(D.alvoDia))}</b>/dia · ${D.restam} dia${D.restam>1?'s':''}</span>` : ''}
      ${corrida?`<span class="mm46-cmp">${corrida}</span>`:''}
    </div>
    ${corridaHTML}
    <div class="mm46-pe"><button class="btn p" onclick="mm46Ir('${irPara}')"><i class="ti ti-flame"></i> Ver a ${irPara==='arena'?'Arena':'tabela de metas'}</button></div>
  </section>`;
}
function mm46Ir(t){ S.portalTab = t; S.protoAberto = null; render(); }
function mm46Animar(){
  const el = document.querySelector('.mm46-val'); if(!el || el.dataset.ok) return; el.dataset.ok = 1;
  const alvo = Number(el.dataset.mm46)||0, t0 = performance.now(), dur = 1200;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const passo = t => { if(!el.isConnected) return; const p = calmo ? 1 : Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,4); el.textContent = brl(Math.round(alvo*e)); if(p<1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  requestAnimationFrame(()=>document.querySelectorAll('.mm46-fill,.mm46-rb i').forEach(b=>b.classList.add('on')));
  // comemora quando passa de nível (uma vez por nível no mês)
  try{
    const D = mm46Dados(); if(!D || !D.nivel) return;
    const k = 'lv_mm46_'+S.sess.eid+'_'+D.A.ym, antes = localStorage.getItem(k)||'';
    const ordem = ['m1','m2','m3','meta','super','hiper'];
    if(ordem.indexOf(D.nivel) > ordem.indexOf(antes)){
      localStorage.setItem(k, D.nivel);
      if(antes!=='' || ['meta','super','hiper'].includes(D.nivel)){ setTimeout(()=>{ try{ chuvaConfete(); }catch(e){} toast('🎉 '+MM46_ROTULO[D.nivel]+' batida! Arrasou!'); }, 900); }
    }
  }catch(e){}
}
if(typeof portalInicio==='function'){
  const _portalInicioV46 = portalInicio;
  portalInicio = function portalInicio(){
    const h = _portalInicioV46.apply(this, arguments);
    let c = ''; try{ c = mm46Cartao(); }catch(e){ console.warn('v46 meta', e); }
    if(!c) return h;
    const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
    return f >= 0 ? h.slice(0, f+6) + c + h.slice(f+6) : c + h;
  };
}

/* ═════════════════ 2) TIRAR DÚVIDA ═════════════════ */
/* guia: id, título, palavras (como a equipe fala), passos, tela (aba do portal ou função), vídeo (nº do roteiro) */
const AJ46_GUIA = [
  {id:'ponto-celular', t:'Bater o ponto pelo celular', p:'ponto bater entrada saida almoco volta qr code selfie foto camera registrar', s:['No computador da loja aparece um QR Code (muda a cada 40 s).','Abra a câmera do celular, aponte para o QR Code e toque no link — ou toque em "Bater o ponto" no Início do portal.','Tire a selfie quando o portal pedir.','Toque em "Registrar". A hora que vale é a do sistema.'], ir:'pontocel', v:'02'},
  {id:'ponto-sem-celular', t:'Bater o ponto sem celular', p:'sem celular bateria descarregou computador loja pin nome', s:['No computador da loja, embaixo do QR Code, toque em "Sem celular?".','Toque no seu nome e digite o seu PIN.','Escolha o horário (entrada, almoço, volta, saída).'], v:'02'},
  {id:'esqueci-ponto', t:'Esqueci de bater o ponto / corrigir horário', p:'esqueci bater ponto corrigir correcao horario errado atrasado faltou marcar', s:['Toque em "Esqueci de bater ou corrigir horário" no Início (ou Meus pedidos).','Escolha o dia e o horário certo e explique o motivo.','Envie. A administração aprova e o ponto é corrigido.'], ir:'fn:novoPedido({tipo:"correcao"})', v:'08'},
  {id:'venda-pdv', t:'Fazer uma venda no PDV', p:'venda vender pdv caixa registrar produto passar codigo barras leitor comanda finalizar cobrar', s:['Toque em "Vender".','Passe o leitor no código de barras ou busque o produto pelo nome.','Ajuste a quantidade no + e − da comanda.','Escolha a forma de pagamento (Pix, dinheiro, débito, crédito ou misto).','Toque em "Finalizar". A venda já conta na sua meta.'], ir:'pdv', v:'03'},
  {id:'desfazer-venda', t:'Desfazer ou cancelar uma venda', p:'desfazer cancelar venda errada estornar errei devolver', s:['Até 15 minutos depois, você mesma desfaz a venda: abra a venda em "Acabou de vender" e toque em "Desfazer".','Depois de 15 minutos, só a administração cancela — avise com o número da venda e o motivo.'], ir:'pdv', v:'03'},
  {id:'desconto', t:'Dar desconto na venda', p:'desconto abatimento promocao porcentagem reais', s:['Na comanda, toque em "Desconto".','Escolha em % ou em R$ e digite o valor.','O limite de desconto é definido pela administração (padrão 15%).'], ir:'pdv', v:'03'},
  {id:'cliente-fidelidade', t:'Cadastrar cliente e cartão fidelidade', p:'cliente cadastrar fidelidade cartao presente cashback telefone nome aniversario indicacao', s:['Na venda, toque em "Cliente".','Digite o telefone: se ela já existe, aparece; se não, preencha o nome.','A compra entra no cartão fidelidade dela (presente na 5ª e na 10ª compra).'], ir:'pdv', v:'03'},
  {id:'comprovante', t:'Mandar comprovante para a cliente', p:'comprovante cupom recibo whatsapp nota imprimir', s:['Depois de finalizar a venda, toque em "WhatsApp" para mandar o comprovante.','Ou em "Cupom" para imprimir (sem valor fiscal).'], ir:'pdv', v:'03'},
  {id:'venda-whats', t:'Venda feita pelo WhatsApp ou Instagram', p:'whatsapp instagram kommo venda online atendimento conta duas vezes', s:['Venda fechada pelo WhatsApp/Instagram já conta pela Kommo.','Não passe de novo no caixa do PDV — senão conta duas vezes na meta.'], v:'03'},
  {id:'sangria', t:'Registrar sangria', p:'sangria tirar dinheiro caixa retirada envelope', s:['Toque em "Registrar sangria" no Início (ou Mais › Caixa e sangria).','Digite o valor que tirou do caixa.','Registre. Fica anotado quem tirou e a que horas.'], ir:'fn:abrirSangria()', v:'04'},
  {id:'fechar-caixa', t:'Fechar o caixa', p:'fechar caixa fechamento fim do dia contar dinheiro diferenca fundo troco', s:['Ao bater o ponto de saída aparece o cartão "Fechar o caixa".','Conte antes de olhar o sistema e digite: fundo de troco, dinheiro, Pix, débito e crédito.','O portal compara com as vendas e as sangrias e diz se bateu.'], ir:'caixa', v:'04'},
  {id:'tem-na-loja', t:'Ver se tem o produto na loja', p:'tem na loja estoque quantidade produto acabou outra loja bosque centro consultar', s:['Toque em Mais › Estoque › "Tem na loja?".','Digite o nome ou leia o código.','Aparece quanto tem no Bosque e no Centro.'], ir:'estoque', v:'05'},
  {id:'foto-produto', t:'Tirar foto de produto ou cadastrar produto novo', p:'foto produto sem foto cadastrar produto novo catalogo preco codigo', s:['Toque em Mais › Estoque › Produtos.','Produto sem foto: toque nele e tire a foto com a câmera.','Produto que não existe: toque em "Produto novo" e preencha foto, código, nome e preço.'], ir:'estoque', v:'05'},
  {id:'pedido-site', t:'Separar e enviar pedido do site', p:'pedido site nuvemshop separar enviar entregar rastreio retirada online loja virtual', s:['Toque em "Pedidos do site" (sai sempre do Bosque).','Abra o pedido e toque em cada item ao pegar na prateleira.','Toque em "Separei tudo".','Ao enviar, coloque o rastreio e toque em "Enviado" — ou "Cliente retirou".'], ir:'site', v:'06'},
  {id:'folga', t:'Pedir folga', p:'folga pedir folga banco de horas dia livre', s:['Toque em "Pedir folga" no Início (ou Meus pedidos).','Escolha o dia (folga do banco: de terça a sexta) e envie.','Acompanhe em Meus pedidos: pendente, aprovado ou recusado.'], ir:'fn:novoPedido({tipo:"folga"})', v:'08'},
  {id:'atestado', t:'Enviar atestado', p:'atestado medico doente consulta falta justificar', s:['Toque em "Enviar atestado" no Início.','Tire a foto do atestado e escolha os dias.','Envie. Aprovado, aparece na agenda.'], ir:'fn:novoPedido({tipo:"atestado"})', v:'08'},
  {id:'banco-horas', t:'Ver meu banco de horas e meu mês', p:'banco de horas horas extras saldo meu mes espelho trabalhei', s:['Toque em Mais › Meu mês.','Você vê cada dia, as horas trabalhadas e o saldo do banco.'], ir:'mes', v:'08'},
  {id:'escala', t:'Ver minha escala', p:'escala turno loja hoje amanha trabalho onde', s:['Toque em Mais › Minha escala.','Aparece a loja e o turno de cada dia.'], ir:'escala', v:'08'},
  {id:'meta', t:'Minha meta, metinhas e prêmios', p:'meta metinha quanto falta premio premiacao super hiper bater vendi ranking', s:['No Início, o cartão "Minha meta" mostra quanto você vendeu, quanto falta para a próxima metinha e quanto vender por dia.','Em "Metas e prêmios" estão a meta, a super e a hiper e o prêmio de cada uma.','O prêmio vale quando a meta da loja também é batida.'], ir:'metas', v:'07'},
  {id:'arena', t:'Arena de vendas e ranking', p:'arena ranking corrida posicao primeira lugar competicao', s:['Toque em "Arena".','Veja a corrida da meta com a foto de cada uma e as vendas que acabaram de sair.'], ir:'arena', v:'07'},
  {id:'pin', t:'Trocar ou esqueci o PIN', p:'pin senha esqueci trocar entrar login acesso', s:['Para trocar: toque em "Eu" (seu nome no menu) › PIN.','Esqueceu? Peça para a administração criar um novo.'], ir:'eu', v:'01'},
  {id:'instalar', t:'Instalar o portal no celular', p:'instalar aplicativo app tela inicial atalho celular icone', s:['Abra equipe.lasvegassexshop.com.br no navegador do celular.','No menu do navegador, toque em "Adicionar à tela inicial".'], v:'01'},
  {id:'sem-internet', t:'Ficou sem internet', p:'sem internet offline caiu rede wifi nao carrega', s:['O ponto no computador da loja guarda sem internet e envia sozinho depois.','A comanda do PDV fica guardada; finalize quando a internet voltar (não duplica).','Se nada carregar, toque em Atualizar (🔄) no topo.'], v:''},
  {id:'ideia', t:'Dar uma ideia para melhorar o portal', p:'ideia sugestao melhorar lampada sugerir', s:['Toque na lampadazinha 💡 de qualquer bloco.','Escreva a ideia: ela chega para a administração com o seu nome.'], v:''}
];
const AJ46_TELAS = {pdv:'Vender', estoque:'Estoque', site:'Pedidos do site', caixa:'Caixa e sangria', mes:'Meu mês', escala:'Minha escala', metas:'Metas e prêmios', arena:'Arena', eu:'Meu perfil'};
const AJ46 = { aberto:false, q:'', sel:null, reg:null, ia:null, iaCarregando:false, enviado:{}, avaliado:{}, servidorOk:true };
const aj46Norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function aj46Buscar(q){
  const toks = aj46Norm(q).split(/[^a-z0-9]+/).filter(t=>t.length>2 && !['como','que','faco','fazer','para','uma','com','nao','sim','onde','qual','meu','minha','esta','dar','tem','pra','quer','ela','ele'].includes(t));
  if(!toks.length) return [];
  return AJ46_GUIA.map(g=>{
    const pal = x => aj46Norm(x).split(/[^a-z0-9]+/).filter(Boolean);
    const T = pal(g.t), P = pal(g.p), Sx = pal(g.s.join(' '));
    const tem = (lista, r) => lista.some(w => w.startsWith(r) || (w.length >= 4 && r.startsWith(w)));
    let sc = 0; toks.forEach(t=>{ const r = t.length>4 ? t.slice(0, t.length-1) : t; if(tem(T, r)) sc += 3; if(tem(P, r)) sc += 2; if(tem(Sx, r)) sc += .5; });
    return {g, sc};
  }).filter(x=>x.sc>=2).sort((a,b)=>b.sc-a.sc).slice(0,4).map(x=>x.g);
}
function aj46Visivel(g){ if(!g.ir || g.ir.startsWith('fn:') || g.ir==='pontocel' || g.ir==='eu') return true; return typeof mod45On!=='function' || mod45On(g.ir); }
function aj46Id(){ return 'D'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
async function aj46Enviar(extra){
  if(!S.sess?.eid) return;
  const novo = !AJ46.reg; if(novo) AJ46.reg = aj46Id();
  const corpo = {eid:S.sess.eid, ...S.sess.cred, op:'registrar', id:AJ46.reg, tela:S.portalTab||'', ...extra};
  try{ const r = await api('duvida', corpo); if(r.minhasDuvidas && S.sess.dados) S.sess.dados.minhasDuvidas = r.minhasDuvidas; AJ46.servidorOk = true; }
  catch(e){ if(/desconhecida/i.test(e.message)) AJ46.servidorOk = false; }
}
function aj46Abrir(){
  AJ46.aberto = true; AJ46.q = ''; AJ46.sel = null; AJ46.reg = null; AJ46.ia = null;
  aj46Pintar(); setTimeout(()=>document.getElementById('aj46-q')?.focus(), 80);
}
function aj46Fechar(){ AJ46.aberto = false; document.getElementById('aj46')?.remove(); }
function aj46Digitar(v){ AJ46.q = v; AJ46.sel = null; AJ46.ia = null; aj46PintarLista(); }
function aj46Escolher(id){
  const g = AJ46_GUIA.find(x=>x.id===id); if(!g) return;
  AJ46.sel = g; AJ46.ia = null;
  aj46Enviar({pergunta: AJ46.q || g.t, achou:g.id, achou_titulo:g.t});
  aj46PintarLista();
}
async function aj46PerguntarIA(){
  const q = AJ46.q.trim(); if(q.length < 4){ toast('Escreva a dúvida com um pouco mais de detalhe', true); return; }
  AJ46.iaCarregando = true; AJ46.sel = null; aj46PintarLista();
  aj46Enviar({pergunta:q, achou:'', achou_titulo:'', ia:true});
  const guia = AJ46_GUIA.map(g=>`[${g.id}] ${g.t}: ${g.s.join(' ')}`).join('\n');
  try{ AJ46.ia = await api('duvida', {eid:S.sess.eid, ...S.sess.cred, op:'ia', pergunta:q, guia}); }
  catch(e){ AJ46.ia = {ia:false, erro:e.message}; }
  AJ46.iaCarregando = false; aj46PintarLista();
}
function aj46Avaliar(util){
  if(!AJ46.reg) aj46Enviar({pergunta:AJ46.q || AJ46.sel?.t || ''});
  AJ46.avaliado[AJ46.reg||'x'] = util;
  if(util==='sim'){ aj46Enviar({util:'sim'}); toast('Que bom! 💛'); aj46PintarLista(); return; }
  aj46PintarLista();
  setTimeout(()=>document.getElementById('aj46-com')?.focus(), 60);
}
async function aj46NaoResolveu(){
  const c = (document.getElementById('aj46-com')?.value||'').trim();
  await aj46Enviar({util:'nao', comentario:c || AJ46.q, pergunta: AJ46.q || AJ46.sel?.t || c});
  AJ46.enviado[AJ46.reg] = true;
  toast(AJ46.servidorOk ? 'Enviado para a administração ✔ A resposta aparece aqui em "Suas dúvidas"' : 'Anotado ✔');
  aj46PintarLista();
}
function aj46IrTela(ir){
  aj46Fechar();
  if(ir.startsWith('fn:')){ try{ new Function(ir.slice(3))(); }catch(e){} return; }
  if(ir==='pontocel'){ try{ if(typeof abrirPontoCel30==='function') return abrirPontoCel30(); }catch(e){} location.hash = ''; S.portalTab='inicio'; render(); return; }
  S.portalTab = ir; S.protoAberto = null; render();
}
function aj46Video(g){ const u = (S.sess?.dados?.ajudaVideos||{})[g.id] || (S.sess?.dados?.ajudaVideos||{})['v'+g.v]; return u || ''; }
function aj46Resposta(g){
  const vid = aj46Video(g), aval = AJ46.avaliado[AJ46.reg||'x'];
  return `<div class="aj46-resp">
    <button class="aj46-volta" onclick="AJ46.sel=null;aj46PintarLista()"><i class="ti ti-arrow-left"></i> outras respostas</button>
    <h3>${esc(g.t)}</h3>
    <ol>${g.s.map((p,i)=>`<li style="--d:${i*80}ms">${esc(p)}</li>`).join('')}</ol>
    <div class="aj46-acoes">
      ${g.ir && aj46Visivel(g) ? `<button class="btn pri" onclick="aj46IrTela('${esc(g.ir).replace(/'/g,"\\'")}')"><i class="ti ti-arrow-right"></i> Ir para ${esc(AJ46_TELAS[g.ir] || 'a tela')}</button>` : ''}
      ${vid ? `<a class="btn" href="${esc(vid)}" target="_blank" rel="noopener"><i class="ti ti-player-play"></i> Ver o vídeo</a>` : (g.v ? `<span class="aj46-semvid"><i class="ti ti-video"></i> vídeo ${esc(g.v)} em breve</span>` : '')}
    </div>
    ${aj46Avaliacao(aval)}
  </div>`;
}
function aj46Avaliacao(aval){
  if(AJ46.enviado[AJ46.reg]) return `<div class="aj46-ok"><i class="ti ti-circle-check"></i> A administração recebeu a sua dúvida. A resposta aparece aqui em "Suas dúvidas".</div>`;
  if(aval==='sim') return `<div class="aj46-ok"><i class="ti ti-heart"></i> Que bom que ajudou!</div>`;
  if(aval==='nao') return `<div class="aj46-nao"><label for="aj46-com">Conta o que você precisa (a administração responde):</label>
    <textarea id="aj46-com" class="inp" rows="3" placeholder="Ex.: a cliente quer trocar um produto, como faço?">${esc(AJ46.q)}</textarea>
    <button class="btn pri" onclick="aj46NaoResolveu()"><i class="ti ti-send"></i> Enviar para a administração</button></div>`;
  return `<div class="aj46-aval"><span>Resolveu?</span><button class="btn p" onclick="aj46Avaliar('sim')">👍 Sim</button><button class="btn p" onclick="aj46Avaliar('nao')">👎 Não resolveu</button></div>`;
}
function aj46PintarLista(){
  const box = document.getElementById('aj46-lista'); if(!box) return;
  const q = AJ46.q.trim();
  if(AJ46.sel){ box.innerHTML = aj46Resposta(AJ46.sel); return; }
  if(AJ46.iaCarregando){ box.innerHTML = `<div class="aj46-pensa"><span></span><span></span><span></span> Procurando a resposta…</div>`; return; }
  if(AJ46.ia){
    const I = AJ46.ia, g = I.tema ? AJ46_GUIA.find(x=>x.id===I.tema) : null;
    box.innerHTML = I.ia ? `<div class="aj46-resp"><button class="aj46-volta" onclick="AJ46.ia=null;aj46PintarLista()"><i class="ti ti-arrow-left"></i> voltar</button>
      <h3><i class="ti ti-sparkles"></i> Resposta do portal</h3><div class="aj46-ia">${esc(I.resposta).replace(/\n/g,'<br>')}</div>
      ${g && g.ir && aj46Visivel(g) ? `<div class="aj46-acoes"><button class="btn pri" onclick="aj46IrTela('${g.ir.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')"><i class="ti ti-arrow-right"></i> Ir para ${esc(AJ46_TELAS[g.ir]||'a tela')}</button></div>` : ''}
      ${aj46Avaliacao(AJ46.avaliado[AJ46.reg||'x'])}</div>`
      : `<div class="aj46-resp"><h3>Não achei essa no guia 🤔</h3><p class="suave">Manda para a administração que a gente responde — e a resposta fica aqui para você.</p>${aj46Avaliacao('nao')}</div>`;
    return;
  }
  if(!q){
    const minhas = S.sess?.dados?.minhasDuvidas || [];
    const pop = ['ponto-celular','venda-pdv','sangria','fechar-caixa','pedido-site','meta','folga','tem-na-loja'].map(id=>AJ46_GUIA.find(g=>g.id===id)).filter(aj46Visivel);
    box.innerHTML = `<small class="aj46-sub">Mais procurados</small><div class="aj46-chips">${pop.map((g,i)=>`<button style="--d:${i*40}ms" onclick="AJ46.q='${esc(g.t).replace(/'/g,"\\'")}';aj46Escolher('${g.id}')">${esc(g.t)}</button>`).join('')}</div>
      ${minhas.length?`<small class="aj46-sub">Suas dúvidas</small><div class="aj46-minhas">${minhas.map(d=>`<div class="aj46-m ${d.status}"><b>${esc(d.comentario||d.pergunta)}</b>${d.status==='respondida'?`<p><i class="ti ti-message-reply"></i> ${esc(d.resposta)} <small>— ${esc(d.respondido_por||'Administração')}</small></p>`:'<p class="apagado"><i class="ti ti-clock"></i> esperando resposta</p>'}</div>`).join('')}</div>`:''}`;
    return;
  }
  const r = aj46Buscar(q).filter(aj46Visivel);
  box.innerHTML = (r.length ? r.map((g,i)=>`<button class="aj46-it" style="--d:${i*50}ms" onclick="aj46Escolher('${g.id}')"><i class="ti ti-bulb"></i><span><b>${esc(g.t)}</b><small>${esc(g.s[0])}</small></span><i class="ti ti-chevron-right"></i></button>`).join('') : `<p class="suave" style="margin:6px 2px">Nada pronto sobre isso ainda.</p>`)
    + `<button class="aj46-perg" onclick="aj46PerguntarIA()"><i class="ti ti-sparkles"></i><span><b>${r.length?'Não é isso? ':''}Perguntar ao portal</b><small>“${esc(q.slice(0,80))}”</small></span></button>`;
}
function aj46Pintar(){
  document.getElementById('aj46')?.remove();
  if(!AJ46.aberto) return;
  document.body.insertAdjacentHTML('beforeend', `<div id="aj46" class="aj46-veu" onclick="if(event.target===this)aj46Fechar()">
    <div class="aj46-caixa" role="dialog" aria-label="Tirar dúvida">
      <div class="aj46-cab"><span class="aj46-ic">💬</span><div class="cresce"><b>Tirar dúvida</b><small>Pergunte do seu jeito</small></div><button class="icone" aria-label="Fechar" onclick="aj46Fechar()"><i class="ti ti-x"></i></button></div>
      <div class="aj46-busca"><i class="ti ti-search"></i><input id="aj46-q" class="inp" autocomplete="off" placeholder="Ex.: como faço sangria?" value="${esc(AJ46.q)}" oninput="aj46Digitar(this.value)" onkeydown="if(event.key==='Enter'){const r=aj46Buscar(AJ46.q).filter(aj46Visivel);if(!r.length)aj46PerguntarIA();else this.blur();}"></div>
      <div id="aj46-lista" class="aj46-lista"></div>
    </div></div>`);
  aj46PintarLista();
}
function aj46Botao(){
  const quer = S.tela==='portal' && S.sess?.dados;
  let b = document.getElementById('aj46-bt');
  if(!quer){ b?.remove(); return; }
  if(!b){ document.body.insertAdjacentHTML('beforeend', `<button id="aj46-bt" class="aj46-bt" onclick="aj46Abrir()" aria-label="Tirar dúvida"><span>💬</span><b>Tirar dúvida</b></button>`); }
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && AJ46.aberto) aj46Fechar(); });

/* render: anima o cartão da meta e mantém o botão */
const _renderV46 = render;
render = function(){
  _renderV46.apply(this, arguments);
  try{ aj46Botao(); if(S.tela==='portal' && S.portalTab==='inicio') mm46Animar(); }catch(e){ console.warn('v46', e); }
};

/* ═════════════════ 3) ADMINISTRAÇÃO › Comunicação › Dúvidas da equipe ═════════════════ */
const DV46 = { r:null, dias:30, filtro:'todas', vids:null };
async function dv46Carregar(forcar){
  if(!S.adm || (DV46.r && !forcar) || DV46._c) return;
  DV46._c = true;
  try{ DV46.r = await api('admDuvidas', {...S.adm.cred, op:'lista', dias:90}); }
  catch(e){ DV46.r = {erro:e.message}; }
  finally{ DV46._c = false; }
  if(S.tela==='admin' && S.adm?.tab==='duvidas') render();
}
function dv46Responder(id){
  const d = (DV46.r?.itens||[]).find(x=>x.id===id); if(!d) return;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">Responder ${esc(primeiroNome(d.colaboradora))}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><div class="nota info" style="margin-bottom:10px"><i class="ti ti-message-question"></i><div><b>${esc(d.comentario||d.pergunta)}</b>${d.achou_titulo?`<br><small>Ela tinha aberto: ${esc(d.achou_titulo)}</small>`:''}</div></div>
    <textarea id="dv46-txt" class="inp" rows="5" placeholder="Escreva a resposta — ela vê no botão Tirar dúvida">${esc(d.resposta||'')}</textarea>
    <div class="linha" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn" onclick="fecharModal()">Cancelar</button><button class="btn pri" onclick="dv46Enviar('${d.id}')"><i class="ti ti-send"></i> Responder</button></div></div></div></div>`;
  setTimeout(()=>$('#dv46-txt')?.focus(), 60);
}
async function dv46Enviar(id){
  const texto = ($('#dv46-txt')?.value||'').trim(); if(!texto){ toast('Escreva a resposta', true); return; }
  try{ DV46.r = await api('admDuvidas', {...S.adm.cred, op:'responder', id, texto, por:S.adm.perfil==='matheus'?'Matheus':'Madu', dias:90}); fecharModal(); toast('Resposta enviada ✔'); render(); }
  catch(e){ toast(e.message, true); }
}
async function dv46SalvarVideos(){
  const v = {}; document.querySelectorAll('[data-dv46v]').forEach(i=>{ const u = i.value.trim(); if(u) v[i.dataset.dv46v] = u; });
  try{ DV46.r = await api('admDuvidas', {...S.adm.cred, op:'videos', videos:v, por:S.adm.perfil==='matheus'?'Matheus':'Madu', dias:90}); toast('Vídeos salvos ✔ Aparecem para a equipe na próxima atualização'); render(); }
  catch(e){ toast(e.message, true); }
}
function dv46Tela(){
  const R = DV46.r;
  const topo = `<div class="dv46-topo"><div><h2>💬 Dúvidas da <mark>equipe</mark></h2><p>Tudo o que a equipe pergunta no botão "Tirar dúvida": quem usa, o que mais perguntam e o que ficou sem resposta.</p></div>
    <div class="dv46-per">${[7,30,90].map(n=>`<button class="${DV46.dias===n?'on':''}" onclick="DV46.dias=${n};render()">${n} dias</button>`).join('')}</div></div>`;
  if(!R){ dv46Carregar(); return topo + `<p class="suave"><i class="ti ti-loader-2"></i> Carregando…</p>`; }
  if(R.erro) return topo + `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(R.erro)?'<b>Falta publicar o AJUDA.gs no servidor.</b> O botão já funciona para a equipe, mas ainda não registra as perguntas.':esc(R.erro)}<br><button class="btn p" style="margin-top:8px" onclick="DV46.r=null;render()">Tentar de novo</button></div></div>`;
  const lim = addDays(hojeISO(), -DV46.dias+1), it = (R.itens||[]).filter(d=>d.data>=lim);
  const abertas = (R.itens||[]).filter(d=>d.status==='aberta');
  const pessoas = {}; it.forEach(d=>{ const p = pessoas[d.colaboradora_id] = pessoas[d.colaboradora_id] || {id:d.colaboradora_id, nome:d.colaboradora, n:0, sim:0, nao:0}; p.n++; if(d.util==='sim') p.sim++; if(d.util==='nao') p.nao++; });
  const lp = Object.values(pessoas).sort((a,b)=>b.n-a.n), maxP = Math.max(1, ...lp.map(p=>p.n));
  const temas = {}; it.forEach(d=>{ const k = d.achou_titulo || '❓ ' + (d.pergunta||'').slice(0,50); temas[k] = (temas[k]||0)+1; });
  const lt = Object.entries(temas).sort((a,b)=>b[1]-a[1]).slice(0,8), maxT = Math.max(1, ...lt.map(x=>x[1]));
  const aval = it.filter(d=>d.util), pctOk = aval.length ? Math.round(aval.filter(d=>d.util==='sim').length/aval.length*100) : null;
  const equipe = S.adm.dados?.colaboradoras || [], colabDe = id => equipe.find(c=>c.id===id) || {id, nome:(pessoas[id]||{}).nome||id, cor:'#ccc'};
  const ver = DV46.filtro==='abertas' ? abertas : DV46.filtro==='ia' ? it.filter(d=>d.ia==='SIM') : it;
  const quando = q => { const s = String(q||''); return s.slice(8,10)+'/'+s.slice(5,7)+' '+s.slice(11,16); };
  const vids = R.videos || {}, temasV = AJ46_GUIA.filter((g,i,l)=>g.v && l.findIndex(x=>x.v===g.v)===i);
  const nomesV = {'01':'Entrar e instalar','02':'Bater o ponto','03':'Venda no PDV','04':'Sangria e caixa','05':'Produtos e estoque','06':'Pedidos do site','07':'Arena e metas','08':'Meu mês, escala e pedidos'};
  return topo + `
    <div class="dv46-cards">
      <div class="dv46-c"><small>Perguntas</small><b class="num">${it.length}</b><span>nos últimos ${DV46.dias} dias</span></div>
      <div class="dv46-c"><small>Quem usou</small><b class="num">${lp.length}</b><span>de ${equipe.filter(c=>c.ativa==='SIM').length} da equipe</span></div>
      <div class="dv46-c"><small>Resolveu</small><b class="num ${pctOk!=null&&pctOk<60?'neg':''}">${pctOk==null?'—':pctOk+'%'}</b><span>${aval.length} avaliação(ões)</span></div>
      <button class="dv46-c ${abertas.length?'alerta':''}" onclick="DV46.filtro='abertas';render()"><small>Para responder</small><b class="num">${abertas.length}</b><span>${abertas.length?'toque para ver':'nada pendente ✨'}</span></button>
    </div>
    <div class="dv46-g2">
      <section class="dv46-bloco"><h3>O que mais perguntam</h3>${lt.length?lt.map(([k,n],i)=>`<div class="dv46-bar" style="--d:${i*60}ms"><span>${esc(k)}</span><i style="--w:${n/maxT*100}%"></i><b class="num">${n}</b></div>`).join(''):'<p class="suave">Ninguém perguntou ainda.</p>'}</section>
      <section class="dv46-bloco"><h3>Quem usa</h3>${lp.length?lp.map((p,i)=>`<div class="dv46-pes" style="--d:${i*60}ms">${avatar(colabDe(p.id),'',30)}<span>${esc(primeiroNome(p.nome))}</span><i style="--w:${p.n/maxP*100}%"></i><b class="num">${p.n}</b><small>${p.sim?'👍'+p.sim:''} ${p.nao?'👎'+p.nao:''}</small></div>`).join(''):'<p class="suave">Ninguém usou ainda.</p>'}</section>
    </div>
    <section class="dv46-bloco"><div class="linha entre quebra" style="gap:8px;margin-bottom:8px"><h3 style="margin:0">Perguntas</h3>
      <div class="dv46-per">${[['todas','Todas'],['abertas','Para responder'],['ia','Feitas à IA']].map(([k,n])=>`<button class="${DV46.filtro===k?'on':''}" onclick="DV46.filtro='${k}';render()">${n}</button>`).join('')}</div></div>
      ${ver.length?`<div class="dv46-lista">${ver.slice(0,80).map(d=>`<div class="dv46-it ${d.status}">${avatar(colabDe(d.colaboradora_id),'',34)}<div class="cresce"><b>${esc(d.comentario||d.pergunta||'—')}</b>
        <small>${esc(primeiroNome(d.colaboradora))} · ${quando(d.quando)}${d.tela?' · na tela '+esc(d.tela):''}${d.achou_titulo?' · abriu "'+esc(d.achou_titulo)+'"':''}${d.ia==='SIM'?' · ✨ IA':''}</small>
        ${d.status==='respondida'?`<p class="dv46-r"><i class="ti ti-message-reply"></i> ${esc(d.resposta)}</p>`:''}</div>
        <span class="dv46-st">${d.util==='sim'?'👍 resolveu':d.util==='nao'?'👎 não resolveu':'—'}</span>
        ${d.util==='nao'||d.status==='respondida'?`<button class="btn p" onclick="dv46Responder('${d.id}')">${d.status==='respondida'?'Editar resposta':'Responder'}</button>`:''}</div>`).join('')}</div>`:'<p class="suave">Nada aqui.</p>'}
    </section>
    <section class="dv46-bloco"><h3>Vídeos da ajuda <small class="apagado">cole o link do Drive ou YouTube de cada vídeo — aparece no "Tirar dúvida"</small></h3>
      <div class="dv46-vids">${temasV.map(g=>`<label><span>Vídeo ${g.v} · ${esc(nomesV[g.v]||g.t)}</span><input class="inp" data-dv46v="v${g.v}" placeholder="https://…" value="${esc(vids['v'+g.v]||'')}"></label>`).join('')}</div>
      <button class="btn pri" style="margin-top:10px" onclick="dv46SalvarVideos()"><i class="ti ti-device-floppy"></i> Salvar vídeos</button>
      ${R.ia?'<p class="suave" style="margin-top:8px"><i class="ti ti-sparkles"></i> A IA está ligada: quando o guia não tem a resposta, o portal responde com base no guia.</p>':'<p class="suave" style="margin-top:8px"><i class="ti ti-sparkles"></i> Para o "Perguntar ao portal" responder com IA, cole a chave da IA em Estoque › Configurar (perfil Matheus). Sem ela, a pergunta vai direto para vocês responderem.</p>'}
    </section>`;
}
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='comunic'); if(a && !a.k.includes('duvidas')) a.k.splice(a.k.indexOf('avisos')>=0?a.k.indexOf('avisos')+1:1, 0, 'duvidas'); NOMES34.duvidas = 'Dúvidas da equipe'; }
if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('mural')); if(g && !g.k.includes('duvidas')) g.k.push('duvidas'); if(typeof NOMES12!=='undefined') NOMES12.admin.duvidas = 'Dúvidas da equipe'; }
const _telaAdminV46 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm; if(!A || !A.perfil) return _telaAdminV46.apply(this, arguments);
  const aqui = A.tab === 'duvidas', marca = '<!--dv46-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV46.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'duvidas'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + dv46Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV46.apply(this, arguments);
  const n = (DV46.r?.itens||[]).filter(d=>d.status==='aberta').length;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='duvidas';TR=null;render()"><i class="ti ti-message-question"></i> Dúvidas ${n?`<span class="contador">${n}</span>`:''}</button>`;
  return h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
};
if(typeof itensBusca==='function'){
  const _ib46 = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ib46.apply(this, arguments);
    if(S.adm && S.tela==='admin') r.unshift({t:'Dúvidas da equipe', s:'O que a equipe pergunta, quem usa, responder, vídeos', i:'ti-message-question', go:()=>{ S.adm.tab='duvidas'; render(); }});
    return r;
  };
}
/* carrega as dúvidas em segundo plano para o contador da aba */
setTimeout(()=>{ if(S.tela==='admin' && S.adm?.perfil) dv46Carregar(); }, 4000);
setInterval(()=>{ if(S.tela==='admin' && S.adm?.perfil && document.visibilityState==='visible') dv46Carregar(true); }, 5*60e3);

document.head.insertAdjacentHTML('beforeend', `<style>
/* ── Minha meta ── */
.mm46{position:relative;overflow:hidden;cursor:pointer;margin:0 0 14px;padding:18px 18px 14px;border-radius:24px;color:#fff;
  background:radial-gradient(120% 140% at 100% 0%,#ff3b47 0%,#E3101F 38%,#8f0a14 100%);box-shadow:0 14px 34px rgba(227,16,31,.28);animation:mm46e .55s cubic-bezier(.2,.8,.2,1) both}
.mm46::after{content:'';position:absolute;inset:-40% -10% auto auto;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(255,209,92,.35),transparent 65%);animation:mm46g 6s ease-in-out infinite;pointer-events:none}
.mm46-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;position:relative;z-index:1}
.mm46-top small{display:block;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
.mm46-val{display:block;font-size:clamp(30px,7vw,40px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:4px 0 2px}
.mm46-de{font-size:13.5px;opacity:.9}.mm46-de b{color:#FFD15C}
.mm46-rank{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:8px 14px;text-align:center;backdrop-filter:blur(4px);animation:mm46p 2.6s ease-in-out infinite}
.mm46-rank span{display:block;font-size:26px;font-weight:900;line-height:1;color:#FFD15C}.mm46-rank small{font-size:11px;letter-spacing:.04em;text-transform:none}
.mm46-barra{position:relative;height:16px;border-radius:99px;background:rgba(0,0,0,.25);margin:18px 0 26px;z-index:1}
.mm46-fill{position:absolute;inset:0 auto 0 0;width:0;border-radius:99px;background:linear-gradient(90deg,#F5B524,#FFD15C 60%,#fff3c4);box-shadow:0 0 18px rgba(255,209,92,.7);transition:width 1.4s cubic-bezier(.2,.8,.2,1) .15s;overflow:hidden}
.mm46-fill.on{width:var(--w)}
.mm46-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.65) 50%,transparent 70%);transform:translateX(-100%);animation:mm46s 2.4s ease-in-out 1.6s infinite}
.mm46-mk{position:absolute;top:50%;transform:translate(-50%,-50%);z-index:2}
.mm46-mk i{display:block;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.7)}
.mm46-mk.g i{width:16px;height:16px;background:#8f0a14;border-color:#FFD15C}
.mm46-mk.ok i{background:#FFD15C;border-color:#fff;box-shadow:0 0 10px #FFD15C}
.mm46-mk small{position:absolute;top:16px;left:50%;transform:translateX(-50%);font-size:10.5px;font-weight:800;white-space:nowrap;opacity:.9}
.mm46-mk:last-child small{left:auto;right:-4px;transform:none}
.mm46-prox{position:relative;z-index:1;font-size:15px;line-height:1.35}.mm46-prox b{color:#FFD15C}.mm46-falta{font-size:19px}
.mm46-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;position:relative;z-index:1}
.mm46-chips span{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:99px;padding:5px 10px}
.mm46-chips b{color:#FFD15C}.mm46-cmp{background:rgba(255,209,92,.2)!important;border-color:rgba(255,209,92,.5)!important}
.mm46-run{margin-top:14px;background:rgba(0,0,0,.18);border-radius:16px;padding:8px 10px;position:relative;z-index:1}
.mm46-rl{display:grid;grid-template-columns:22px 28px minmax(56px,90px) 1fr auto;align-items:center;gap:8px;padding:4px 2px;font-size:13px;animation:mm46e .45s both;animation-delay:var(--d)}
.mm46-rl .lob-av{width:28px!important;height:28px!important;font-size:10px}
.mm46-rl.eu{background:rgba(255,209,92,.18);border-radius:10px;font-weight:800}
.mm46-pos{text-align:center}.mm46-rn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm46-rb{height:8px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
.mm46-rb i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#F5B524,#FFD15C);transition:width 1.2s cubic-bezier(.2,.8,.2,1) .3s}
.mm46-rb i.on{width:var(--w)}.mm46-rl.eu .mm46-rb i{background:linear-gradient(90deg,#fff,#FFD15C)}
.mm46-rl b{font-size:12.5px}
.mm46-pe{margin-top:10px;position:relative;z-index:1}.mm46-pe .btn{background:rgba(255,255,255,.95);color:#B30A17;border:0;font-weight:800}
@keyframes mm46e{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
@keyframes mm46g{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
@keyframes mm46p{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes mm46s{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.mm46,.mm46::after,.mm46-rank,.mm46-fill::after,.mm46-rl{animation:none}}
/* ── Tirar dúvida ── */
.aj46-bt{position:fixed;left:16px;bottom:18px;z-index:61;display:flex;align-items:center;gap:8px;border:0;cursor:pointer;padding:10px 16px 10px 12px;border-radius:99px;
  background:#1d1d1f;color:#fff;font:inherit;font-weight:800;font-size:14px;box-shadow:0 10px 26px rgba(0,0,0,.25);animation:aj46b .5s cubic-bezier(.2,1.4,.5,1) both;transition:transform .15s}
.aj46-bt span{font-size:18px;animation:aj46w 3.2s ease-in-out 1s infinite}.aj46-bt:hover{transform:translateY(-3px)}.aj46-bt:active{transform:scale(.95)}
@media (max-width:900px){.aj46-bt{bottom:84px;padding:10px 12px}.aj46-bt b{display:none}}
.aj46-veu{position:fixed;inset:0;z-index:9000;background:rgba(20,10,12,.45);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;animation:aj46f .2s both}
@media (min-width:700px){.aj46-veu{align-items:center}}
.aj46-caixa{width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.25);animation:aj46s .35s cubic-bezier(.2,.9,.3,1) both}
@media (min-width:700px){.aj46-caixa{border-radius:24px}}
.aj46-cab{display:flex;align-items:center;gap:10px;padding:16px 16px 8px}.aj46-cab b{display:block;font-size:18px}.aj46-cab small{color:var(--creme3)}
.aj46-ic{width:42px;height:42px;border-radius:14px;background:#1d1d1f;display:flex;align-items:center;justify-content:center;font-size:20px}
.aj46-busca{position:relative;margin:4px 16px 10px}.aj46-busca i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--creme3)}.aj46-busca .inp{padding-left:40px;height:48px;font-size:16px;border-radius:14px}
.aj46-lista{overflow:auto;padding:0 16px 18px}
.aj46-sub{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--creme3);margin:8px 2px 6px}
.aj46-chips{display:flex;flex-wrap:wrap;gap:6px}.aj46-chips button{border:1px solid var(--linha);background:var(--noite);border-radius:99px;padding:8px 12px;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;animation:mm46e .35s both;animation-delay:var(--d);transition:transform .15s,border-color .15s}
.aj46-chips button:hover{transform:translateY(-2px);border-color:var(--vermelho)}
.aj46-it,.aj46-perg{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid var(--linha);background:#fff;border-radius:14px;padding:11px 12px;margin-bottom:6px;font:inherit;cursor:pointer;animation:mm46e .3s both;animation-delay:var(--d);transition:transform .15s,border-color .15s}
.aj46-it:hover,.aj46-perg:hover{transform:translateX(3px);border-color:var(--vermelho)}
.aj46-it>i:first-child{color:#F5B524;font-size:20px}.aj46-it span,.aj46-perg span{flex:1;min-width:0}.aj46-it b,.aj46-perg b{display:block;font-size:14.5px}.aj46-it small,.aj46-perg small{display:block;font-size:12.5px;color:var(--creme3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aj46-perg{background:linear-gradient(135deg,#fff,#fff6f6);border-style:dashed}.aj46-perg>i{color:var(--vermelho);font-size:20px}
.aj46-resp h3{font-size:18px;margin:6px 0 10px;display:flex;gap:6px;align-items:center}
.aj46-resp ol{margin:0 0 12px;padding-left:22px}.aj46-resp li{margin:6px 0;font-size:15px;line-height:1.4;animation:mm46e .35s both;animation-delay:var(--d)}
.aj46-volta{border:0;background:none;color:var(--creme3);font:inherit;font-size:13px;cursor:pointer;padding:0}
.aj46-acoes{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}.aj46-acoes a{text-decoration:none}
.aj46-semvid{font-size:12.5px;color:var(--creme3);display:inline-flex;align-items:center;gap:4px}
.aj46-aval{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-top:1px solid var(--linha);padding-top:12px}.aj46-aval span{font-weight:800;margin-right:4px}
.aj46-nao{border-top:1px solid var(--linha);padding-top:12px;display:flex;flex-direction:column;gap:8px}.aj46-nao label{font-weight:700;font-size:14px}
.aj46-ok{border-top:1px solid var(--linha);padding-top:12px;color:var(--ok,#1a7f4b);font-weight:700;display:flex;gap:6px;align-items:center}
.aj46-ia{background:var(--noite);border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.5;margin-bottom:10px}
.aj46-pensa{display:flex;align-items:center;gap:5px;color:var(--creme3);padding:14px 4px}.aj46-pensa span{width:8px;height:8px;border-radius:50%;background:var(--vermelho);animation:aj46d 1s infinite}.aj46-pensa span:nth-child(2){animation-delay:.15s}.aj46-pensa span:nth-child(3){animation-delay:.3s;margin-right:6px}
.aj46-minhas{display:flex;flex-direction:column;gap:6px}.aj46-m{border:1px solid var(--linha);border-radius:14px;padding:10px 12px}.aj46-m b{font-size:14px}.aj46-m p{margin:4px 0 0;font-size:13.5px}.aj46-m.respondida{border-color:rgba(26,127,75,.4);background:rgba(26,127,75,.05)}
@keyframes aj46b{from{opacity:0;transform:translateY(20px) scale(.8)}to{opacity:1;transform:none}}
@keyframes aj46w{0%,90%,100%{transform:rotate(0)}93%{transform:rotate(-14deg)}96%{transform:rotate(12deg)}}
@keyframes aj46f{from{opacity:0}to{opacity:1}}@keyframes aj46s{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@keyframes aj46d{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}
@media (prefers-reduced-motion:reduce){.aj46-bt,.aj46-bt span,.aj46-caixa,.aj46-chips button,.aj46-it,.aj46-perg,.aj46-resp li{animation:none}}
/* ── Dúvidas da equipe (administração) ── */
.dv46-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 14px}
.dv46-topo h2{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-.03em;margin:6px 0 4px}.dv46-topo h2 mark{background:linear-gradient(transparent 55%,rgba(245,181,36,.5) 55%);color:inherit;padding:0 2px}.dv46-topo p{color:var(--creme2);font-size:14px;max-width:600px;margin:0}
.dv46-per{display:flex;gap:4px;background:var(--noite);border-radius:99px;padding:3px}.dv46-per button{border:0;background:none;font:inherit;font-size:13px;font-weight:700;padding:6px 12px;border-radius:99px;cursor:pointer;color:var(--creme2)}.dv46-per button.on{background:#fff;color:var(--vermelho);box-shadow:var(--sh)}
.dv46-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}
.dv46-c{all:unset;box-sizing:border-box;background:#fff;border:1px solid var(--linha);border-radius:18px;padding:14px 16px;box-shadow:var(--sh);animation:mm46e .4s both}.dv46-c small{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--creme3)}.dv46-c b{display:block;font-size:30px;font-weight:900;margin:2px 0}.dv46-c span{font-size:12.5px;color:var(--creme3)}
button.dv46-c{cursor:pointer}.dv46-c.alerta{border-color:var(--vermelho);background:linear-gradient(135deg,#fff,#fff1f1)}.dv46-c.alerta b{color:var(--vermelho)}
.dv46-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media (max-width:860px){.dv46-g2{grid-template-columns:1fr}}
.dv46-bloco{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:14px 16px;box-shadow:var(--sh);margin-bottom:12px}.dv46-bloco h3{font-size:16px;font-weight:800;margin:0 0 10px}.dv46-bloco h3 small{font-weight:600;font-size:12.5px}
.dv46-bar,.dv46-pes{display:grid;grid-template-columns:minmax(120px,1.2fr) 2fr auto;align-items:center;gap:8px;margin:6px 0;font-size:13.5px;animation:mm46e .4s both;animation-delay:var(--d)}
.dv46-pes{grid-template-columns:30px 80px 1fr auto 60px}.dv46-pes .lob-av{width:30px!important;height:30px!important;font-size:10px}
.dv46-bar span,.dv46-pes span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv46-bar i,.dv46-pes i{display:block;height:10px;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),#F5B524);width:var(--w);animation:dv46w 1s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d)}
.dv46-pes small{font-size:12px;color:var(--creme3)}
.dv46-lista{display:flex;flex-direction:column;gap:6px}.dv46-it{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:14px;background:var(--noite)}.dv46-it.aberta{background:#fff1f1;border:1px solid rgba(227,16,31,.3)}
.dv46-it .lob-av{width:34px!important;height:34px!important;font-size:11px;flex-shrink:0}.dv46-it b{display:block;font-size:14px}.dv46-it small{display:block;font-size:12px;color:var(--creme3)}.dv46-r{margin:6px 0 0;font-size:13px;color:var(--ok,#1a7f4b)}
.dv46-st{font-size:12.5px;white-space:nowrap;color:var(--creme2)}
.dv46-vids{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px}.dv46-vids label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;font-weight:700;color:var(--creme2)}
@keyframes dv46w{from{width:0}}
@media (max-width:560px){.dv46-it{flex-wrap:wrap}.dv46-pes{grid-template-columns:30px 70px 1fr auto}.dv46-pes small{display:none}}
</style>`);
