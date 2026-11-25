/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PÓS-VENDA (Portal Equipe) — v66
   Pedido da Madu (25/11/2026): botão no portal para as vendedoras chamarem a cliente
   no WhatsApp para o pós-venda.
   Decisões dela: botão abre o WhatsApp com a mensagem pronta (o número continua
   mascarado na tela) · vale para QUALQUER cliente da loja · lista no Início
   (quem comprou há alguns dias) + botão em cada venda de "Minhas vendas".
   1) Lista de pós-venda: clientes com compra no PDV (loja ou Kommo lançada) entre
      "de" e "ate" dias atrás, uma linha por cliente (a compra mais recente), some
      quando alguém faz o pós-venda.
   2) Ação "zap": devolve o WhatsApp da cliente na hora do toque e REGISTRA quem pegou
      (aba Contatos: tipo posvenda quando vem de uma venda; tipo contato quando veio da busca).
   3) Ficha da cliente (v66b): histórico de compras (portal + sistema antigo), quem vendeu, o que ela mais
      leva, cartão fidelidade/cashback e quem já chamou — para a equipe conhecer a cliente. Só dentro do portal.
   Nunca vai produto na mensagem nem na lista.
   Arquivo SEPARADO — fica no FIM da lista (depois do RELATORIO). Precisa do RELACIONAMENTO e do FIDELIDADE.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: POSVENDA
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   ═══════════════════════════════════════════════════════════════ */

var PV_PADRAO = { de: 2, ate: 7, max: 80 };
CONFIG_PADRAO.push(['posvenda', JSON.stringify(PV_PADRAO), 'Pós-venda (JSON): a cliente aparece na lista de "de" até "ate" dias depois da compra; max = tamanho da lista']);

function pvCfg_() { var c = cfgJson_('posvenda', {}) || {}, o = {}; for (var k in PV_PADRAO) o[k] = (c[k] != null && c[k] !== '' && !isNaN(Number(c[k]))) ? Math.max(0, Math.round(Number(c[k]))) : PV_PADRAO[k]; if (o.ate < o.de) o.ate = o.de; return o; }

/** Cashback da cliente para lembrar na mensagem (saldo e quando vence). */
function pvCash_(c, idx, cfg) {
  try {
    if (!(idx.porCli[c.id] || []).length) return null;
    var k = fidCartao_(c, idx, cfg, false);
    return k.cashback && k.cashback.saldo > 0 ? { saldo: k.cashback.saldo, vence: k.cashback.vence ? k.cashback.vence.data : '' } : null;
  } catch (e) { return null; }
}

/* ═════════ 1) lista de pós-venda ═════════ */
function pvLista_() {
  var hoje = hoje_(), rc = pvCfg_(), cfg = fidCfg_();
  var todas = ler_('Clientes').filter(function (c) { return c.ativo !== 'NÃO'; }), cl = {};
  todas.forEach(function (c) { cl[c.id] = c; });
  var ultPV = {};   // último pós-venda feito para a cliente (cobre as compras até aquele dia)
  ler_('Contatos').forEach(function (r) { if (r.tipo === 'posvenda' && (!ultPV[r.cliente_id] || r.data > ultPV[r.cliente_id])) ultPV[r.cliente_id] = String(r.data); });
  var porCli = {};
  ler_('VendasPDV').forEach(function (v) {
    if (!v.cliente_id || v.status === 'cancelada' || !/^\d{4}-\d{2}-\d{2}/.test(v.data || '')) return;
    var dias = relDias_(v.data, hoje);
    if (dias < rc.de || dias > rc.ate) return;
    var c = cl[v.cliente_id]; if (!c || !fidTel_(c.tel)) return;
    if (ultPV[c.id] && ultPV[c.id] >= String(v.data).slice(0, 10)) return;
    var a = porCli[c.id], chave = String(v.data) + ' ' + String(v.hora || '');
    if (a && a._chave >= chave) { a.compras++; return; }
    porCli[c.id] = { id: c.id, nome: c.nome, tel: fidTel_(c.tel), ref: v.id, numero: Number(v.numero) || 0, data: String(v.data).slice(0, 10), dias: dias,
                     loja: v.loja, colaboradora_id: v.colaboradora_id, vendedora: String(v.colaboradora || '').split(' ')[0], kommo: v.origem === 'kommo',
                     compras: a ? a.compras + 1 : 1, _chave: chave };
  });
  var lista = [], idx = null;
  for (var id in porCli) lista.push(porCli[id]);
  lista.sort(function (x, y) { return x.dias - y.dias || (y._chave > x._chave ? 1 : -1); });
  lista = lista.slice(0, rc.max);
  if (lista.length) idx = fidIndice_(null, todas);
  lista.forEach(function (x) { delete x._chave; x.cashback = idx ? pvCash_(cl[x.id], idx, cfg) : null; });
  return { lista: lista, cfg: rc };
}
var _pvRelLista = relLista_;
relLista_ = function () {
  var r = _pvRelLista.apply(this, arguments);
  try { var p = pvLista_(); r.posvenda = p.lista; r.cfg_pv = p.cfg; }
  catch (e) { r.posvenda = []; r.pv_erro = String(e && e.message || e); }
  return r;
};

/* "feito" também para o pós-venda (✓ sem mandar / Desfazer) */
var _pvFeito = relFeito_;
relFeito_ = function (req, por) {
  if (!req || req.tipo !== 'posvenda') return _pvFeito(req, por);
  if (!req.cliente_id || !req.ref) throw new Error('Faltou a cliente');
  return relTrava_(function () {
    var ja = ler_('Contatos').filter(function (r) { return r.tipo === 'posvenda' && r.cliente_id === req.cliente_id && r.ref === String(req.ref); })[0];
    if (req.desfazer) { if (ja) aba_('Contatos').deleteRow(ja._linha); return { ok: true }; }
    if (ja) return { ok: true, ja: true };
    var c = ler_('Clientes').filter(function (x) { return x.id === req.cliente_id; })[0];
    gravar_('Contatos', { id: 'R' + new Date().getTime() + Math.floor(Math.random() * 1e3), cliente_id: req.cliente_id, cliente: c ? c.nome : '', tipo: 'posvenda', ref: String(req.ref), data: hoje_(), quando: agora_(), por: por });
    return { ok: true };
  });
};

/* ═════════ 2) pegar o WhatsApp da cliente (qualquer cliente) e registrar quem pegou ═════════ */
function pvZap_(req, por) {
  var cid = String(req.cliente_id || '');
  var c = ler_('Clientes').filter(function (x) { return x.id === cid && x.ativo !== 'NÃO'; })[0];
  if (!c) throw new Error('Cliente não encontrada');
  var tel = fidTel_(c.tel);
  if (!/^\d{10,11}$/.test(tel)) throw new Error('Essa cliente está sem WhatsApp no cadastro. Peça para a administração completar.');
  var vid = String(req.venda_id || ''), venda = null, anterior = null;
  if (vid) venda = ler_('VendasPDV').filter(function (v) { return v.id === vid && v.cliente_id === c.id; })[0] || null;
  var tipo = venda ? 'posvenda' : 'contato', ref = venda ? venda.id : agora_();
  relTrava_(function () {
    if (venda) anterior = ler_('Contatos').filter(function (r) { return r.tipo === 'posvenda' && r.cliente_id === c.id && r.ref === venda.id; })[0] || null;
    if (!anterior) gravar_('Contatos', { id: 'R' + new Date().getTime() + Math.floor(Math.random() * 1e3), cliente_id: c.id, cliente: c.nome, tipo: tipo, ref: ref, data: hoje_(), quando: agora_(), por: por });
  });
  log_(por, venda ? 'pós-venda' : 'whatsapp da cliente', c.nome + (venda ? ' · venda #' + venda.numero : ''));
  var cash = null;
  try { cash = pvCash_(c, fidIndice_(null, ler_('Clientes').filter(function (x) { return x.ativo !== 'NÃO'; })), fidCfg_()); } catch (e) {}
  return { ok: true, id: c.id, nome: c.nome, tel: tel, cashback: cash, posvenda: !!venda,
           ja: anterior ? { por: anterior.por, quando: anterior.quando } : null };
}


/* ═════════ 3) ficha da cliente (v66b) ═════════ */
function pvTitulo_(s) { return String(s || '').toLowerCase().replace(/(^|\s)\S/g, function (x) { return x.toUpperCase(); }).trim(); }
function pvFicha_(id) {
  var todas = ler_('Clientes'), c = todas.filter(function (x) { return x.id === String(id || '') && x.ativo !== 'NÃO'; })[0];
  if (!c) throw new Error('Cliente não encontrada');
  var idx = fidIndice_(null, todas), cfg = fidCfg_(), k = fidCartao_(c, idx, cfg, false);
  var compras = [];
  (idx.porCli[c.id] || []).forEach(function (v) {
    var it = []; try { it = JSON.parse(v.itens || '[]'); } catch (e) {}
    compras.push({ origem: v.origem === 'kommo' ? 'kommo' : 'portal', data: String(v.data).slice(0, 10), hora: String(v.hora || '').slice(0, 5), loja: v.loja,
      numero: Number(v.numero) || 0, vendedora: String(v.colaboradora || '').split(' ')[0], total: fidR2_(v.total), pagamento: v.pagamento || '',
      itens: it.map(function (i) { return { id: i.id || '', nome: i.nome || '', qtd: Number(i.qtd) || 1 }; }) });
  });
  var antigas = [];
  try { if (typeof histDoCliente_ === 'function') antigas = histDoCliente_(c.tel, c.nome); } catch (e) {}
  antigas.forEach(function (h) {
    compras.push({ origem: 'antigo', data: String(h.data).slice(0, 10), hora: String(h.data).slice(11, 16), loja: h.loja, numero: 0, vendedora: pvTitulo_(h.vendedora).split(' ')[0],
      total: Number(h.total) || 0, pagamento: '', itens: (h.itens || []).map(function (i) { return { cod: i.cod || '', nome: pvTitulo_(i.desc), qtd: Number(i.qtd) || 1 }; }) });
  });
  compras.sort(function (a, b) { var x = a.data + ' ' + a.hora, y = b.data + ' ' + b.hora; return x < y ? 1 : x > y ? -1 : 0; });
  // o que ela mais leva e quem mais atende
  var prods = {}, vends = {}, lojas = {}, gasto = 0;
  compras.forEach(function (v) {
    gasto += v.total; if (v.loja) lojas[v.loja] = (lojas[v.loja] || 0) + 1;
    if (v.vendedora) vends[v.vendedora] = (vends[v.vendedora] || 0) + 1;
    v.itens.forEach(function (i) { var n = norm_(i.nome); if (!n) return; var p = prods[n] || (prods[n] = { nome: i.nome, id: i.id || '', cod: i.cod || '', vezes: 0, qtd: 0, ultima: '' }); p.vezes++; p.qtd += i.qtd; if (v.data > p.ultima) p.ultima = v.data; if (i.id && !p.id) p.id = i.id; });
  });
  var top = Object.keys(prods).map(function (n) { return prods[n]; }).sort(function (a, b) { return b.vezes - a.vezes || b.qtd - a.qtd || (a.ultima < b.ultima ? 1 : -1); }).slice(0, 8);
  var quem = Object.keys(vends).map(function (n) { return { nome: n, vezes: vends[n] }; }).sort(function (a, b) { return b.vezes - a.vezes; }).slice(0, 5);
  var lojaFav = Object.keys(lojas).sort(function (a, b) { return lojas[b] - lojas[a]; })[0] || '';
  var contatos = ler_('Contatos').filter(function (r) { return r.cliente_id === c.id; }).map(function (r) { return { tipo: r.tipo, quando: String(r.quando || r.data), por: r.por }; })
    .sort(function (a, b) { return a.quando < b.quando ? 1 : -1; }).slice(0, 10);
  var n = compras.length, ult = n ? compras[0].data : '';
  return { ok: true, ficha: {
    id: c.id, nome: c.nome, tel_mask: fidMascara_(c.tel), tem_zap: /^\d{10,11}$/.test(fidTel_(c.tel)),
    aniversario: /^\d{4}-\d{2}-\d{2}$/.test(c.nascimento || '') ? c.nascimento.slice(5) : '', desde: String(c.criado_em || '').slice(0, 10), obs: c.obs || '',
    indicado_por: k.indicado_por_nome || '', indicacoes: k.indicacoes_validas || 0,
    compras: n, gasto: fidR2_(gasto), ticket: n ? fidR2_(gasto / n) : 0, ultima: ult, dias_ultima: ult ? relDias_(ult, hoje_()) : null, loja_fav: lojaFav,
    selos: k.selos, no_cartao: k.no_cartao, ciclo: k.ciclo, presente_em: k.presente_em, premios_pendentes: (k.pendentes || []).length,
    cashback: k.cashback && k.cashback.saldo > 0 ? { saldo: k.cashback.saldo, vence: k.cashback.vence ? k.cashback.vence.data : '' } : null,
    top: top, quem: quem, historico: compras.slice(0, 60), historico_total: n, contatos: contatos
  } };
}

/* ═════════ ações ═════════ */
var _pvRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'relacionamento' && (req.op === 'zap' || req.op === 'ficha')) {
    try { var c = checarColab_(req); return req.op === 'ficha' ? pvFicha_(req.cliente_id) : pvZap_(req, c.nome); }
    catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _pvRodar(req);
};
var _pvAdmRel = ADMIN.admRelacionamento;
ADMIN.admRelacionamento = function (req) {
  if (req.op === 'zap') return pvZap_(req, 'Administração');
  if (req.op === 'ficha') return pvFicha_(req.cliente_id);
  if (req.op === 'cfg_pv') {
    var v = req.valor || {}, atual = cfgJson_('posvenda', {}) || {};
    for (var k in PV_PADRAO) if (v[k] != null && v[k] !== '' && !isNaN(Number(v[k]))) atual[k] = Math.max(0, Math.round(Number(v[k])));
    setCfg_('posvenda', JSON.stringify(atual));
    return relLista_();
  }
  if (req.op === 'historico_pv') {
    return { ok: true, contatos: ler_('Contatos').filter(function (r) { return r.tipo === 'posvenda' || r.tipo === 'contato'; }).map(limpar_).reverse().slice(0, 300) };
  }
  return _pvAdmRel(req);
};
