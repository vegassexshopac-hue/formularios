/* ═══════════ Portal Equipe Las Vegas · v33 — vendas da Kommo na Arena ═══════════
   Venda que vai para "Venda ganha" na Kommo aparece no "Acabou de vender", com o flash na tela,
   e conta no nº de vendas e no ticket da atendente. Sem produto nenhum (discrição).
   Dados: pacote do PDV › "kommo" (KOMMO.gs v33). A meta já somava antes pela aba Vendas. */
(function(){
  const st = document.createElement('style');
  st.textContent = `.feed>div.ar-km .ar-minis{display:none}.ar-kmtag{display:inline-flex;align-items:center;gap:4px;background:#25D366;color:#fff;border-radius:99px;padding:1px 8px;font-size:11px;font-weight:800;margin-left:4px}`;
  document.head.appendChild(st);
})();
const KMA = {vistos:null};
function kmArenaVendas(){
  const P = pdvD();
  return (P.kommo||[]).map(r=>{ const mesmoDia = String(r.criado_em).slice(0,10) === r.data;
    return {id:'K'+r.lead, numero:'', criada_em: mesmoDia ? r.criado_em : r.data+' 23:59:00', data:r.data, hora: mesmoDia ? String(r.criado_em).slice(11,16) : '—', loja:r.loja,
      colaboradora_id:r.colaboradora_id, colaboradora:r.colaboradora, itens:[], qtd_itens:0, subtotal:r.valor, desconto:0, total:r.valor, pagamento:'Kommo', parcelas:1, status:'ok', kommo:true}; });
}
const _arenaCalcV33 = arenaCalc;
arenaCalc = function arenaCalc(){
  const P = pdvD(), orig = P.vendas || [], km = kmArenaVendas();
  if(!km.length) return _arenaCalcV33();
  P.vendas = orig.concat(km);
  let A; try{ A = _arenaCalcV33(); } finally { P.vendas = orig; }
  // peças por venda continua só do PDV (venda da Kommo não tem produtos)
  const ym = A.ym;
  (A.pessoas||[]).forEach(p=>{ const m = orig.filter(v=>v.status!=='cancelada' && v.data.startsWith(ym) && v.colaboradora_id===p.c.id); p.pa = m.length ? m.reduce((s,v)=>s+v.qtd_itens,0)/m.length : 0; });
  if(!KMA.vistos) KMA.vistos = new Set(km.map(v=>v.id));
  return A;
};
const _arenaHTMLV33 = arenaHTML;
arenaHTML = function arenaHTML(tv){
  const h = kmArenaVendas().length ? _arenaHTMLV33(tv).replace(/venda\(s\) no PDV/g, 'venda(s) · PDV + Kommo') : _arenaHTMLV33(tv);
  return h.replace(/(<div style="--i:\d+" class="[^"]*)("[^>]*>(?:(?!<div style="--i:)[\s\S])*?)0 itens · Kommo/g, (m, a, b)=> a + ' ar-km' + b + '<span class="ar-kmtag"><i class="ti ti-brand-whatsapp"></i> Kommo</span> WhatsApp/Instagram');
};
if(typeof arVendaVer === 'function'){
  const _arVendaVerV33 = arVendaVer;
  arVendaVer = function arVendaVer(id){
    if(!String(id).startsWith('K')) return _arVendaVerV33(id);
    const v = kmArenaVendas().find(x=>x.id===id); if(!v) return;
    $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal"><div class="modal-t"><h3 class="cresce">💬 Venda pela Kommo</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
      <div class="modal-c"><p style="margin:0 0 6px"><b>${esc(primeiroNome(v.colaboradora))}</b> · ${esc(v.hora)} · Loja ${esc(S.boot.lojas[v.loja]?.nome||v.loja||'')}</p>
      <p style="font-size:28px;font-weight:900;margin:4px 0 10px">${brl2(v.total)}</p>
      <p class="apagado" style="font-size:13px;margin:0">Venda fechada pelo WhatsApp/Instagram e marcada como <b>Venda ganha</b> na Kommo. Já conta na meta da atendente. Os produtos ficam só na Kommo.</p></div></div></div>`;
  };
}
/* flash quando entra venda nova da Kommo */
function kmArenaFlash(v){
  if(typeof semMov==='function' && semMov()) return;
  const M = metasDe(mesDe(hojeISO())), c = M.equipe.find(x=>x.id===v.colaboradora_id) || {nome:v.colaboradora, cor:'#25D366'};
  const el = document.createElement('div'); el.className='flash';
  el.innerHTML = `<div>${avatar(c,'',58).replace('lob-av','lob-av av')}<div><b>${esc(primeiroNome(c.nome))} vendeu!</b><small>💬 pela Kommo · WhatsApp/Instagram</small></div><span class="v">+${brl(v.total)}</span></div>`;
  document.body.appendChild(el); chuvaConfete(); setTimeout(()=>el.remove(), 3300);
}
const _arenaBuscarV33 = arenaBuscar;
arenaBuscar = async function arenaBuscar(){
  await _arenaBuscarV33();
  try{
    const km = kmArenaVendas(), hoje = hojeISO();
    if(!KMA.vistos){ KMA.vistos = new Set(km.map(v=>v.id)); return; }
    const novas = km.filter(v=>v.data===hoje && !KMA.vistos.has(v.id));
    km.forEach(v=>KMA.vistos.add(v.id));
    novas.slice(-3).forEach((v,i)=>setTimeout(()=>kmArenaFlash(v), 3400 + i*3300));
  }catch(e){}
};
/* administração: o "ao vivo" da Arena também traz as vendas da Kommo do mês */
const _apiV33 = api;
api = async function api(a, dados={}){
  const r = await _apiV33(a, dados);
  try{ if(a==='admAoVivo' && r && r.kommoMes && S.adm?.dados?.pdv){ const ym = mesDe(r.hoje||hojeISO()); S.adm.dados.pdv.kommo = (S.adm.dados.pdv.kommo||[]).filter(x=>!String(x.data).startsWith(ym)).concat(r.kommoMes); } }catch(e){}
  return r;
};
