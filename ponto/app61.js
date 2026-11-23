/* ═════════════════════ ROLETA DO SITE › QUEM GIROU (v61 · 23/11/2026) ═════════════════════
   Pedido da Madu: a roleta do site (versão de Natal) passa a guardar cada giro e a dar um cupom único de 24 h.
   • Administração › Roleta do site ganha a lista "Quem girou": nome, WhatsApp, prêmio, código, até quando vale e se já usou.
   • O sorteio, o cupom na Nuvemshop e a lista são do servidor (ROLETA_SITE.gs, ação admRoletaSite).
   • Servidor antigo (sem ROLETA_SITE.gs) → a tela continua como era, com um aviso.
   Carrega depois do app60. Nomes internos: RS61, rs61… */
let RS61 = null, RS61_BUSCA = false, RS61_ERRO = '', RS61_TESTES = false;

async function rs61Carregar(op, dados){
  if(RS61_BUSCA) return;
  RS61_BUSCA = true; RS61_ERRO = '';
  try{ RS61 = await api('admRoletaSite', {...S.adm.cred, op: op || 'lista', ...(dados||{})}); }
  catch(e){ RS61_ERRO = e.message || 'Erro'; if(op && op !== 'lista') toast(RS61_ERRO, true); }
  RS61_BUSCA = false;
  if(S.adm && S.adm.tab === 'roleta') render();
}
function rs61Hora(s){ s = String(s||''); return s.length >= 16 ? `${s.slice(8,10)}/${s.slice(5,7)} ${s.slice(11,16)}` : '—'; }
function rs61Fone(t){ t = String(t||''); return t.length === 11 ? `(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}` : t.length === 10 ? `(${t.slice(0,2)}) ${t.slice(2,6)}-${t.slice(6)}` : t; }
function rs61Situacao(g){
  if(g.status === 'usado') return `<span class="selo" style="background:var(--ok-bg);color:var(--ok)">${g.tipo==='brinde' ? 'Brinde entregue' : 'Usou' + (g.pedido ? ' · pedido #' + esc(g.pedido) : '')}</span>`;
  if(g.status === 'vencido') return `<span class="selo" style="background:var(--bad-bg);color:var(--bad)">Venceu ${rs61Hora(g.vence_em)}</span>`;
  return `<span class="selo" style="background:var(--warn-bg);color:var(--warn)">Vale até ${rs61Hora(g.vence_em)}</span>`;
}
async function rs61Brinde(id){
  if(!confirm('Marcar o brinde ' + id + ' como entregue?')) return;
  await rs61Carregar('brinde', {id});
  if(!RS61_ERRO) toast('Brinde marcado como entregue ✔');
}
function rs61Lista(){
  if(!RS61 && !RS61_ERRO){ if(!RS61_BUSCA) setTimeout(()=>rs61Carregar(), 0); return `<p class="apagado" style="margin-top:14px">Carregando quem girou…</p>`; }
  if(!RS61) return /desconhec|admRoletaSite|not a function|inválid/i.test(RS61_ERRO)
    ? `<div class="nota warn" style="max-width:760px;margin-top:14px"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem a lista da roleta.</b> Falta publicar o arquivo <b>ROLETA_SITE</b> no Apps Script.</div></div>`
    : `<div class="nota bad" style="max-width:760px;margin-top:14px"><i class="ti ti-alert-triangle"></i><div>Não consegui ler a lista: ${esc(RS61_ERRO)} <button class="btn p" onclick="RS61_ERRO='';render()">Tentar de novo</button></div></div>`;
  const R = RS61.resumo || {}, c = RS61.cfg || {};
  const giros = (RS61.giros || []).filter(g => RS61_TESTES || g.modo !== 'teste');
  const avisos = [
    RS61.nuvemshop === false ? `<div class="nota bad" style="margin-bottom:10px"><i class="ti ti-plug-connected-x"></i><div><b>A Nuvemshop está desconectada.</b> Sem ela a roleta não consegue criar o cupom e a cliente vê "em manutenção". Reconecte em Nuvemshop (site).</div></div>` : '',
  ].join('');
  const linhas = giros.map(g => `<tr>
      <td>${rs61Hora(g.criado_em)}${g.modo==='teste' ? ' <span class="selo">teste</span>' : ''}</td>
      <td><b>${esc(g.nome)}</b></td>
      <td><a href="https://wa.me/55${esc(g.tel)}" target="_blank" rel="noopener">${esc(rs61Fone(g.tel))}</a>${g.aceita==='sim' ? '' : ' <small class="apagado" title="Não marcou que aceita receber novidades">sem novidades</small>'}</td>
      <td>${esc(g.premio)}</td>
      <td><span class="selo">${esc(g.id)}</span></td>
      <td>${rs61Situacao(g)}${g.tipo==='brinde' && g.status==='aberto' ? ` <button class="btn p" onclick="rs61Brinde('${esc(g.id)}')">Entreguei</button>` : ''}</td>
    </tr>`).join('');
  return `<h2 class="secao">Quem girou <small>${R.total||0} giro${R.total===1?'':'s'} · ${R.usados||0} usaram · ${R.abertos||0} valendo agora · ${R.vencidos||0} venceram</small></h2>
  <div style="max-width:980px">${avisos}
  <div class="linha quebra" style="gap:8px;margin-bottom:10px">
    <button class="btn" onclick="RS61=null;render()"><i class="ti ti-refresh"></i> Atualizar</button>
    ${R.testes ? `<button class="btn p fantasma" onclick="RS61_TESTES=!RS61_TESTES;render()">${RS61_TESTES ? 'Esconder' : 'Mostrar'} os ${R.testes} de teste</button>` : ''}
  </div>
  ${giros.length ? `<div class="tabela"><table><thead><tr><th>Quando</th><th>Nome</th><th>WhatsApp</th><th>Prêmio</th><th>Código</th><th>Situação</th></tr></thead><tbody>${linhas}</tbody></table></div>`
    : `<p class="apagado">Ninguém girou ainda${R.testes && !RS61_TESTES ? ' (só testes)' : ''}.</p>`}
  <p class="apagado" style="font-size:13px;margin-top:10px">Cada cliente ganha <b>um cupom só dela</b>, que vale <b>${c.horas||24} horas</b>, serve para <b>1 compra</b> e <b>não soma</b> com outras promoções. Um giro por WhatsApp a cada ${c.bloqueio_dias||30} dias. Quando o prazo acaba, o portal apaga o cupom na Nuvemshop sozinho. Toque no WhatsApp para chamar a cliente antes de vencer.</p></div>`;
}
function rs61Premios(){
  const ps = (RS61 && RS61.cfg && RS61.cfg.premios) || [];
  if(!ps.length) return '';
  const tot = ps.reduce((s,p)=>s+(Number(p.chance)||0),0) || 1;
  const oque = p => p.tipo==='percentage' ? `${p.valor}% de desconto` : p.tipo==='shipping' ? `Frete grátis${p.minimo>0 ? ` em compras acima de R$ ${String(p.minimo).replace('.',',')}` : ''}` : 'Brinde surpresa (resgata pelo WhatsApp)';
  return `<h2 class="secao">Prêmios <small>todo giro ganha · cupom único criado na hora</small></h2>
  <div class="tabela" style="max-width:760px"><table><thead><tr><th>Prêmio</th><th>O que é</th><th>Chance</th></tr></thead><tbody>
    ${ps.map(p=>`<tr><td>${esc(p.nome)}</td><td>${esc(oque(p))}</td><td class="num">${Math.round(p.chance/tot*100)}%</td></tr>`).join('')}</tbody></table></div>
  <p class="apagado" style="font-size:13px;margin-top:10px;max-width:760px">Para mudar prêmios, chances, textos ou o tema, peça ao Claude: ele edita a roleta e você testa aqui antes de ligar.</p>`;
}

const _admRoleta61 = admRoleta;
admRoleta = function admRoleta(){
  let h = _admRoleta61();
  if(!S.adm.dados.roleta || S.adm.dados.roleta.erro) return h;
  const lista = rs61Lista();
  const i = h.indexOf('<h2 class="secao">Prêmios');
  if(RS61 && i > 0) h = h.slice(0, i) + rs61Premios();       // a tabela antiga falava dos cupons fixos (GIRO5…)
  return h + lista;
};
