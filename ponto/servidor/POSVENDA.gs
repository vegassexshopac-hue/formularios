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

/* ═════════ ações ═════════ */
var _pvRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'relacionamento' && req.op === 'zap') {
    try { var c = checarColab_(req); return pvZap_(req, c.nome); }
    catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _pvRodar(req);
};
var _pvAdmRel = ADMIN.admRelacionamento;
ADMIN.admRelacionamento = function (req) {
  if (req.op === 'zap') return pvZap_(req, 'Administração');
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
