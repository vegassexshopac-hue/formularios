/* v28: segurança e impressão do caixa
   • 🖨️ Imprimir o resumo do fechamento (comprovante com assinaturas — impressora comum ou térmica 80 mm).
   • 🖨️ Administração › Caixa: relatório do mês (fechamentos + sangrias) para imprimir.
   • 🔁 Fechamento refeito não some mais: o servidor guarda cada versão (aba CaixaHistorico) e a administração vê todas.
   • 📷 Sangria só é registrada com a FOTO do envelope (vai para o Drive; o link fica na sangria).
   Servidor: OPERACAO.gs v28. */

/* ───────── utilidades de impressão ───────── */
function opImprimirHtml(html){
  const fr = document.createElement('iframe');
  fr.setAttribute('aria-hidden','true');
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(fr);
  const d = fr.contentDocument; d.open(); d.write(html); d.close();
  setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){ toast('Não consegui abrir a impressão neste aparelho', true); } setTimeout(()=>fr.remove(), 4000); }, 350);
}
function opSoma(o){ return Object.keys(opFormas).reduce((s,k)=>s+(Number(o?.[k])||0), 0); }
function opMaiorDif(f){ return Math.max(0, ...Object.values(f.diferenca||{}).map(v=>Math.abs(Number(v)||0))); }
function opStatusTxt(s){ return {ok:'BATEU', diferenca:'COM DIFERENÇA', conferido:'CONFERIDO'}[s] || String(s||'').toUpperCase(); }
function opVersoes(id){ return (opD().historico||[]).filter(h=>h.orig_id===id).sort((a,b)=>String(a.criado_em).localeCompare(String(b.criado_em))); }
function opAgoraTxt(){ const d = new Date(); return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
const OP_CSS_PRINT = `*{box-sizing:border-box}body{font:12px/1.35 Arial,Helvetica,sans-serif;color:#000;margin:0}
h1{font-size:15px;margin:0;letter-spacing:.5px}h2{font-size:13px;margin:10px 0 4px;border-bottom:1px solid #000;padding-bottom:2px}
table{width:100%;border-collapse:collapse}th,td{padding:3px 2px;text-align:left;vertical-align:top}th{border-bottom:1px solid #000;font-size:11px}
td.n,th.n{text-align:right;white-space:nowrap}.c{text-align:center}.sub{font-size:11px}.forte{font-weight:700}.linha{border-top:1px dashed #000;margin:8px 0}
.st{display:inline-block;border:2px solid #000;padding:2px 8px;font-weight:700;margin:6px 0}.ass{margin-top:28px;border-top:1px solid #000;padding-top:2px;font-size:11px;text-align:center}
@page{margin:6mm}`;

/* ───────── comprovante de um fechamento ───────── */
function opReciboHtml(f){
  const temEsp = f.esperado && Object.keys(f.esperado).length, v = f.vendas||{}, vers = opAdmin() ? opVersoes(f.id) : [];
  const lin = k => `<tr><td>${opFormas[k][0]}</td><td class="n">${brl2(f.contado?.[k])}</td>${temEsp?`<td class="n">${brl2(f.esperado?.[k])}</td>`:''}<td class="n">${Math.abs(Number(f.diferenca?.[k])||0)<0.005?'ok':opDifTxt(f.diferenca?.[k])}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Fechamento ${esc(opLojaNome(f.loja))} ${ddmm(f.data)}</title><style>${OP_CSS_PRINT}body{max-width:76mm;margin:0 auto}</style></head><body>
  <div class="c"><h1>LAS VEGAS SEX SHOP</h1><div class="sub">Fechamento de caixa</div></div>
  <div class="linha"></div>
  <table><tr><td>Loja</td><td class="n forte">${esc(opLojaNome(f.loja))}</td></tr><tr><td>Data</td><td class="n forte">${esc(String(f.data).split('-').reverse().join('/'))}</td></tr>
  <tr><td>Fechado por</td><td class="n">${esc(f.por||'')}</td></tr><tr><td>Hora</td><td class="n">${esc(String(f.criado_em||'').slice(11,16))}</td></tr></table>
  <div class="c"><span class="st">${opStatusTxt(f.status)}</span></div>
  <table><thead><tr><th>Forma</th><th class="n">Contado</th>${temEsp?'<th class="n">Esperado</th>':''}<th class="n">Dif.</th></tr></thead><tbody>
  ${Object.keys(opFormas).map(lin).join('')}
  <tr class="forte"><td>TOTAL</td><td class="n">${brl2(opSoma(f.contado))}</td>${temEsp?`<td class="n">${brl2(opSoma(f.esperado))}</td>`:''}<td class="n">${opDifTxt(opSoma(f.diferenca))}</td></tr></tbody></table>
  <div class="linha"></div>
  <table><tr><td>Fundo de troco</td><td class="n">${brl2(f.fundo)}</td></tr>${f.sangrias!=null?`<tr><td>Sangrias do dia</td><td class="n">${brl2(f.sangrias)}</td></tr>`:''}
  ${f.qtd_vendas!=null?`<tr><td>Vendas no PDV</td><td class="n">${esc(String(f.qtd_vendas))}${v.total!=null?' · '+brl2(v.total):''}</td></tr>`:''}
  ${v.misto>0?`<tr><td>Vendas mistas (conferir)</td><td class="n">${brl2(v.misto)}</td></tr>`:''}</table>
  ${f.obs?`<p class="sub"><b>Obs.:</b> ${esc(f.obs)}</p>`:''}${f.obs_adm?`<p class="sub"><b>Administração:</b> ${esc(f.obs_adm)}</p>`:''}
  ${f.status==='conferido'?`<p class="sub">Conferido por ${esc(f.conferido_por||'')} em ${esc(String(f.conferido_em||'').slice(0,16))}</p>`:''}
  ${vers.length?`<h2>Contagens anteriores (refeito ${vers.length}x)</h2><table><thead><tr><th>Hora</th><th>Quem</th><th class="n">Contado</th><th class="n">Dif.</th></tr></thead><tbody>${vers.map(h=>`<tr><td>${esc(String(h.criado_em).slice(11,16))}</td><td>${esc(primeiroNome(h.por||''))}</td><td class="n">${brl2(opSoma(h.contado))}</td><td class="n">${opDifTxt(opSoma(h.diferenca))}</td></tr>`).join('')}</tbody></table>`:''}
  <div class="ass">Assinatura de quem fechou</div><div class="ass">Assinatura de quem conferiu</div>
  <p class="sub c" style="margin-top:10px">Impresso em ${opAgoraTxt()}</p></body></html>`;
}
function opImprimirAtual(){ if(window._opCxF) opImprimirHtml(opReciboHtml(window._opCxF)); }

/* resultado do fechamento: botão Imprimir + versões anteriores (administração) */
const _opCaixaResultadoV28 = opCaixaResultado;
opCaixaResultado = function opCaixaResultado(f, soVer){
  _opCaixaResultadoV28.apply(this, arguments);
  if(!f) return;
  window._opCxF = f;
  const barra = document.querySelector('#modal .modal-c .linha.quebra');
  if(barra) barra.insertAdjacentHTML('afterbegin', `<button class="btn" onclick="opImprimirAtual()"><i class="ti ti-printer"></i> Imprimir</button>`);
  const vers = opAdmin() ? opVersoes(f.id) : [];
  if(vers.length && barra) barra.insertAdjacentHTML('beforebegin', `<div class="nota warn" style="margin-top:10px"><i class="ti ti-history"></i><div><b>Este caixa foi refeito ${vers.length}x.</b> Contagens anteriores:
    <div class="tabela" style="margin-top:6px"><table><thead><tr><th>Hora</th><th>Quem</th><th>Contado</th><th>Diferença</th><th>Status</th></tr></thead><tbody>${vers.map(h=>`<tr><td class="num">${esc(String(h.criado_em).slice(11,16))}</td><td>${esc(primeiroNome(h.por||''))}</td><td class="n num">${brl2(opSoma(h.contado))}</td><td class="n num">${opDifTxt(opSoma(h.diferenca))}</td><td>${h.status==='ok'?'bateu':h.status==='conferido'?'conferido':'diferença'}</td></tr>`).join('')}</tbody></table></div></div></div>`);
};

/* cartão do fechamento: selo "refeito Nx" para a administração */
const _opFechCardV28 = opFechCard;
opFechCard = function opFechCard(f, adm){
  const h = _opFechCardV28.apply(this, arguments), n = adm ? opVersoes(f.id).length : 0;
  return n ? h.replace('</b><small>', ` <span class="op-st diferenca">🔁 refeito ${n}x</span></b><small>`) : h;
};

/* equipe: aviso antes de refazer */
const _opFecharCaixaV28 = opFecharCaixa;
opFecharCaixa = function opFecharCaixa(loja, data){
  if(!opAdmin()){
    const l = loja || lojaAtual(), ja = (opD().fechamentos||[]).find(f=>f.data===(data||hojeISO()) && f.loja===l);
    if(ja && !confirm('O caixa de hoje já foi fechado.\n\nSe você refizer, a contagem anterior continua guardada e a administração vê todas as contagens. Refazer mesmo assim?')) return;
  }
  return _opFecharCaixaV28.apply(this, arguments);
};

/* ───────── relatório do mês (administração) ───────── */
function opRelatorioMes(){
  const ym = S.adm.mes, F = (opD().fechamentos||[]).filter(f=>String(f.data).startsWith(ym)).slice().sort((a,b)=>(a.data+a.loja).localeCompare(b.data+b.loja));
  const SG = (S.adm.dados.sangrias||[]).filter(s=>String(s.data).startsWith(ym)).slice().sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
  const lojas = Object.keys(S.boot.lojas), [ano, mes] = ym.split('-');
  const resumo = lojas.map(k=>{ const fl = F.filter(f=>f.loja===k), sl = SG.filter(s=>s.loja===k);
    return `<tr><td>${esc(opLojaNome(k))}</td><td class="n">${fl.length}</td><td class="n">${fl.filter(f=>f.status!=='diferenca').length}</td><td class="n">${fl.filter(f=>f.status==='diferenca').length}</td><td class="n">${opDifTxt(fl.reduce((s,f)=>s+opSoma(f.diferenca),0))}</td><td class="n">${sl.length} · ${brl2(sl.reduce((s,x)=>s+Number(x.valor||0),0))}</td></tr>`; }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Caixa ${mes}/${ano}</title><style>${OP_CSS_PRINT}body{padding:4mm}tbody tr:nth-child(even){background:#f2f2f2}td,th{border-bottom:1px solid #ddd}</style></head><body>
  <h1>LAS VEGAS SEX SHOP — Relatório de caixa ${mes}/${ano}</h1><p class="sub">Impresso em ${opAgoraTxt()}</p>
  <h2>Resumo por loja</h2><table><thead><tr><th>Loja</th><th class="n">Fechamentos</th><th class="n">Bateram/conferidos</th><th class="n">Com diferença</th><th class="n">Soma das diferenças</th><th class="n">Sangrias</th></tr></thead><tbody>${resumo}</tbody></table>
  <h2>Fechamentos</h2><table><thead><tr><th>Data</th><th>Loja</th><th>Fechou</th><th class="n">Contado</th><th class="n">Esperado</th><th class="n">Diferença</th><th>Status</th><th>Refeito</th></tr></thead><tbody>
  ${F.map(f=>`<tr><td>${ddmm(f.data)}</td><td>${esc(opLojaNome(f.loja))}</td><td>${esc(primeiroNome(f.por||''))} ${esc(String(f.criado_em).slice(11,16))}</td><td class="n">${brl2(opSoma(f.contado))}</td><td class="n">${brl2(opSoma(f.esperado))}</td><td class="n">${opDifTxt(opSoma(f.diferenca))}</td><td>${opStatusTxt(f.status)}</td><td class="c">${opVersoes(f.id).length||''}</td></tr>`).join('')||'<tr><td colspan="8">Nenhum fechamento.</td></tr>'}</tbody></table>
  <h2>Sangrias</h2><table><thead><tr><th>Data</th><th>Hora</th><th>Loja</th><th class="n">Valor</th><th>Tirou</th><th>Conferiu</th><th>Foto</th></tr></thead><tbody>
  ${SG.map(s=>`<tr><td>${ddmm(s.data)}</td><td>${esc(s.hora)}</td><td>${esc(opLojaNome(s.loja))}</td><td class="n">${brl2(s.valor)}</td><td>${esc(primeiroNome(s.tirou||''))}</td><td>${esc(s.conferiu||'—')}</td><td>${s.video_url?'sim':'NÃO'}</td></tr>`).join('')||'<tr><td colspan="7">Nenhuma sangria.</td></tr>'}</tbody></table>
  <div style="display:flex;gap:30px"><div class="ass" style="flex:1">Conferido por</div><div class="ass" style="flex:1">Data</div></div></body></html>`;
  opImprimirHtml(html);
}
const _admCaixaV28 = admCaixa;
admCaixa = function admCaixa(){
  return _admCaixaV28.apply(this, arguments)
    .replace('<button class="btn" onclick="opCaixaCfgModal()">', '<button class="btn" onclick="opRelatorioMes()"><i class="ti ti-printer"></i> Imprimir relatório do mês</button><button class="btn" onclick="opCaixaCfgModal()">')
    .replace(/🎥 ver/g, '📷 ver').replace('<th>Vídeo</th>', '<th>Foto</th>');
};

/* ───────── sangria com foto obrigatória do envelope ───────── */
const _abrirSangriaV28 = abrirSangria;
abrirSangria = function abrirSangria(){
  _abrirSangriaV28.apply(this, arguments);
  if(!SG) return;
  SG.foto = '';
  const campos = [...document.querySelectorAll('#modal .modal-c .campo')], video = campos.find(c=>/vídeo/i.test(c.textContent));
  const bloco = `<div class="campo" id="sg-foto-campo"><label>📷 Foto do envelope (obrigatória)</label>
    <p class="suave" style="margin:0 0 6px;font-size:13px">Escreva no envelope a data, a loja e o valor, e fotografe com o dinheiro dentro antes de fechar.</p>
    <label class="btn largo" style="cursor:pointer"><i class="ti ti-camera"></i> <span id="sg-foto-txt">Tirar foto do envelope</span>
      <input type="file" accept="image/*" capture="environment" style="display:none" onchange="sgFoto(this)"></label>
    <img id="sg-foto-prev" alt="" style="display:none;margin-top:8px;max-width:100%;max-height:220px;border-radius:10px;object-fit:contain"></div>`;
  if(video){ video.insertAdjacentHTML('beforebegin', bloco); const l = video.querySelector('label'); if(l) l.textContent = 'Link do vídeo do envelope (opcional)'; }
  else document.querySelector('#btn-sg')?.insertAdjacentHTML('beforebegin', bloco);
};
async function sgFoto(inp){
  const f = inp.files && inp.files[0]; if(!f || !SG) return;
  const t = $('#sg-foto-txt'); if(t) t.textContent = 'Preparando a foto…';
  try{
    SG.foto = await fotoReduzir(f, 1000);
    const p = $('#sg-foto-prev'); if(p){ p.src = SG.foto; p.style.display = 'block'; }
    if(t) t.textContent = 'Foto pronta ✔ — tocar para tirar outra';
  }catch(e){ SG.foto = ''; if(t) t.textContent = 'Tirar foto do envelope'; toast('Não consegui ler a foto, tente de novo', true); }
}
const _salvarSangriaV28 = salvarSangria;
salvarSangria = async function salvarSangria(){
  if(SG && !SG.foto){ toast('Tire a foto do envelope antes de registrar', true); $('#sg-foto-campo')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
  return _salvarSangriaV28.apply(this, arguments);
};
