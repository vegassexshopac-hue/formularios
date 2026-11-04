/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PEDIDOS DO SITE PARA A EQUIPE (v44) — Portal Equipe
   Arquivo SEPARADO — fica DEPOIS do NUVEMSHOP.gs (e do KOMMO.gs). Pode ficar logo antes do PERF.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: SITE
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   O que ele faz:
   • A baixa do estoque continua automática (NUVEMSHOP.gs). Aqui é a SEPARAÇÃO:
     cada pedido do site passa por  A separar → Separado → Enviado → Entregue,
     com quem fez e quando. Sai sempre da Loja Bosque (depósito).
   • Equipe (com PIN): a = 'pedidosSite' · op = lista | etapa (id, etapa, rastreio, obs)
   • Administração: admPedidosSite (mesmas ops + voltar etapa)
   • dados da colaboradora ganham site_pendentes (bolinha no menu).
   • Motor do WhatsApp: a = 'sitePendentes' com a chave KOMMO_SEGREDO (só número, hora,
     quantidade de peças e etapa — nunca produto nem cliente) + quem está no ponto no Bosque.
   ═══════════════════════════════════════════════════════════════ */

ABAS.VendasSite = ABAS.VendasSite.concat(['envio_tipo', 'endereco', 'nota', 'etapa', 'separado_por', 'separado_em', 'enviado_por', 'enviado_em', 'entregue_por', 'entregue_em', 'rastreio', 'etapa_obs']);
var SITE_ETAPAS = ['', 'separado', 'enviado', 'entregue'];
var SITE_NOME_ETAPA = { '': 'A separar', separado: 'Separado', enviado: 'Enviado', entregue: 'Entregue' };
var SITE_LOJA = 'bosque';

/* ───────── o pedido passa a guardar o tipo de envio, o endereço e o recado da cliente ───────── */
var _siteDoSite = nsPedidoDoSite_;
nsPedidoDoSite_ = function (o) {
  var v = _siteDoSite(o), env = o.shipping_address || {};
  var retirada = o.shipping_pickup_type === 'pickup';
  v.envio_tipo = String(retirada ? ('Retirada' + (o.shipping_store_branch_name ? ' · ' + o.shipping_store_branch_name : ' na loja')) : (o.shipping_option || o.shipping || '')).slice(0, 80);
  v.endereco = retirada ? '' : JSON.stringify({ nome: String(env.name || '').slice(0, 80), rua: String(env.address || '').slice(0, 100), numero: String(env.number || '').slice(0, 15),
    compl: String(env.floor || '').slice(0, 60), bairro: String(env.locality || '').slice(0, 60), cidade: String(env.city || '').slice(0, 60), uf: String(env.province || '').slice(0, 30), cep: String(env.zipcode || '').slice(0, 12) });
  v.nota = String(o.note || '').slice(0, 300);
  return v;
};

/* etapa que vale: a da equipe, ou a que a Nuvemshop já informou (se alguém marcou lá) */
function siteEtapa_(v) {
  var e = SITE_ETAPAS.indexOf(String(v.etapa || '')); if (e < 0) e = 0;
  var envio = String(v.envio_status || ''), ns = /deliver|fulfill/.test(envio) || v.status === 'closed' ? 3 : /ship/.test(envio) && envio !== 'unshipped' ? 2 : 0;
  return SITE_ETAPAS[Math.max(e, ns)];
}
function siteSituacao_(v) {
  if (v.status === 'cancelled' || v.status === 'cancelado') return 'cancelado';
  var et = siteEtapa_(v);
  if (et === 'entregue') return 'concluido';
  if (!et && !/^(paid|authorized)$/.test(String(v.pagamento_status || ''))) return 'aguardando';
  return et || 'separar';
}
function siteItens_(itens) {
  var vinc = nsVinculos_(), porVar = {}, porSku = {}, prods = {}, fotos = {};
  try { fotos = estFotosMapa_(); } catch (e) {}
  vinc.forEach(function (x) { porVar[x.ns_variante_id] = x; if (x.sku) porSku[x.sku] = x; });
  ler_('Produtos').forEach(function (p) { prods[p.id] = p; });
  return (itens || []).map(function (i) {
    var x = porVar[i.ns_variante_id] || (i.sku && porSku[i.sku]), p = x && prods[x.produto_id];
    return { nome: p ? p.nome : i.nome, nome_site: i.nome, qtd: i.qtd, preco: i.preco, produto_id: p ? p.id : '', codigo: p ? (p.codigo || p.sku || '') : (i.sku || ''),
             foto: p ? (fotos[p.id] || p.foto || '') : '' };
  });
}
/** Pedido como a equipe vê: sem telefone; endereço só quando é entrega. */
function sitePedido_(v, adm) {
  var o = nsPedidoLimpo_(v), end = {};
  try { end = JSON.parse(v.endereco || '{}') || {}; } catch (e) {}
  var r = { id: o.id, numero: o.numero, criada_em: o.criada_em, data: o.data, hora: o.hora, cliente: o.cliente, total: o.total, frete: o.frete, qtd_itens: o.qtd_itens,
            pagamento: o.pagamento, pagamento_status: o.pagamento_status, status: o.status, envio_status: o.envio_status, envio_tipo: v.envio_tipo || '', endereco: end, nota: v.nota || '',
            etapa: siteEtapa_(v), situacao: siteSituacao_(v), separado_por: v.separado_por || '', separado_em: v.separado_em || '', enviado_por: v.enviado_por || '', enviado_em: v.enviado_em || '',
            entregue_por: v.entregue_por || '', entregue_em: v.entregue_em || '', rastreio: v.rastreio || '', etapa_obs: v.etapa_obs || '',
            baixa_local: v.baixa_local || '', baixa_em: v.baixa_em || '', devolvido_em: v.devolvido_em || '', obs: v.obs || '', itens: siteItens_(o.itens) };
  if (adm) r.cliente_tel = v.cliente_tel || '';
  return r;
}
function siteLista_(adm) {
  var limite = diaMais_(-45), feitos = diaMais_(-7);
  var todos = ler_('VendasSite').filter(function (v) { return String(v.data || '') >= limite; }), lista = [];
  todos.forEach(function (v) {
    var s = siteSituacao_(v);
    if ((s === 'concluido' || s === 'cancelado') && String(String(v.entregue_em || v.atualizado_em || v.data).slice(0, 10)) < feitos) return;
    lista.push(sitePedido_(v, adm));
  });
  lista.sort(function (a, b) { return String(b.criada_em).localeCompare(String(a.criada_em)); });
  var cont = { separar: 0, separado: 0, enviado: 0, aguardando: 0 };
  lista.forEach(function (p) { if (cont[p.situacao] != null) cont[p.situacao]++; });
  return { ok: true, hoje: hoje_(), hora: hora_(), loja: SITE_LOJA, pedidos: lista.slice(0, 120), contagem: cont };
}
function sitePendentes_() {
  var n = 0; try { ler_('VendasSite').forEach(function (v) { if (siteSituacao_(v) === 'separar') n++; }); } catch (e) {}
  return n;
}
/** Muda a etapa do pedido. Avança uma etapa por vez (ou volta, só a administração). */
function siteMarcar_(req, quem, adm) {
  return comTrava_(function () {
    var v = ler_('VendasSite').filter(function (x) { return x.id === String(req.id || ''); })[0];
    if (!v) throw new Error('Pedido não encontrado');
    if (v.status === 'cancelled' || v.status === 'cancelado') throw new Error('Este pedido foi cancelado — não precisa separar.');
    var atual = SITE_ETAPAS.indexOf(siteEtapa_(v)), nova = SITE_ETAPAS.indexOf(String(req.etapa || ''));
    if (nova < 0) throw new Error('Etapa inválida');
    if (nova === atual) return siteLista_(adm);
    if (nova < atual && !adm) throw new Error('Só a administração volta a etapa de um pedido.');
    var retirada = /^Retirada/.test(String(v.envio_tipo || ''));
    if (nova > atual + 1 && !adm && !(retirada && atual === 1 && nova === 3)) throw new Error('Marque uma etapa de cada vez.');
    if (nova > 0 && atual === 0 && !/^(paid|authorized)$/.test(String(v.pagamento_status || '')) && !adm) throw new Error('Esse pedido ainda não foi pago. Espere o pagamento antes de separar.');
    var agora = agora_();
    if (nova < atual) {  // voltar (administração)
      if (nova < 3) { v.entregue_por = ''; v.entregue_em = ''; }
      if (nova < 2) { v.enviado_por = ''; v.enviado_em = ''; }
      if (nova < 1) { v.separado_por = ''; v.separado_em = ''; }
    } else {
      if (nova >= 1 && !v.separado_em) { v.separado_por = quem; v.separado_em = agora; }
      if (nova >= 2 && !v.enviado_em && !(retirada && nova === 3)) { v.enviado_por = quem; v.enviado_em = agora; }
      if (nova >= 3 && !v.entregue_em) { v.entregue_por = quem; v.entregue_em = agora; }
    }
    if (req.rastreio != null) v.rastreio = String(req.rastreio).replace(/[^\w\-. ]/g, '').trim().slice(0, 40);
    if (req.obs != null && String(req.obs).trim()) v.etapa_obs = String(req.obs).trim().slice(0, 200);
    v.etapa = SITE_ETAPAS[nova];
    gravar_('VendasSite', v);
    log_(quem, 'pedido do site', '#' + v.numero + ' → ' + SITE_NOME_ETAPA[v.etapa]);
    return siteLista_(adm);
  });
}

/* ───────── ações ───────── */
var _siteRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'pedidosSite') {
    try {
      var c = checarColab_(req);
      if (req.op === 'etapa') return siteMarcar_(req, String(c.nome || '').split(' ')[0], false);
      return siteLista_(false);
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (req && req.a === 'sitePendentes') {
    try { return siteMotor_(req); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _siteRodar(req);
};
ADMIN.admPedidosSite = function (req) {
  if (req.op === 'etapa') return siteMarcar_(req, 'Administração', true);
  return siteLista_(true);
};
/* bolinha no menu da equipe */
var _siteDados = dadosColab_;
dadosColab_ = function (c) {
  var d = _siteDados.apply(this, arguments);
  try { if (d && d.ok !== false) d.site_pendentes = sitePendentes_(); } catch (e) {}
  return d;
};

/* ───────── motor do WhatsApp (Railway): pedidos para separar + quem está no ponto no Bosque ───────── */
function siteMotor_(req) {
  var segredo = PropertiesService.getScriptProperties().getProperty('KOMMO_SEGREDO');
  if (!segredo || String(req.segredo || '') !== segredo) return { ok: false, erro: 'Chave não confere' };
  var hoje = hoje_(), lista = [];
  ler_('VendasSite').forEach(function (v) {
    var s = siteSituacao_(v);
    if (s === 'separar' || s === 'aguardando') lista.push({ id: v.id, numero: String(v.numero), data: v.data, hora: v.hora, pecas: Number(v.qtd_itens) || 0, situacao: s, criada_em: v.criada_em });
  });
  var noPonto = ler_('Pontos').filter(function (p) { return p.data === hoje && p.loja === SITE_LOJA && p.entrada && !p.saida; }).map(function (p) { return p.colaboradora_id; });
  var equipe = colabs_().filter(function (c) { return c.ativa === 'SIM' && (c.loja === SITE_LOJA || noPonto.indexOf(c.id) >= 0); })
    .map(function (c) { return { id: c.id, nome: c.nome, telefone: String(c.telefone || '').replace(/\D/g, ''), no_ponto: noPonto.indexOf(c.id) >= 0 }; });
  return { ok: true, hoje: hoje, hora: hora_(), loja: SITE_LOJA, pedidos: lista, equipe: equipe };
}
