/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · ROLETA DA LOJA (totem + celular) — v23
   O sorteio acontece AQUI (ninguém inventa cupom). Cada giro vira um cupom
   na aba CuponsRoleta. No PDV a vendedora digita o código: o servidor confere,
   aplica o desconto e liga o cupom à cliente do cartão fidelidade.
   Arquivo SEPARADO — fica DEPOIS de todos (Código.gs, PDV, ROLETA, ESTOQUE,
   NUVEMSHOP, OPERACAO, FIDELIDADE).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: ROLETA_TOTEM  (o último da lista)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   A aba CuponsRoleta é criada sozinha. Config › roleta_totem guarda prêmios e regras.
   ───────────────────────────────────────────────────────────────
   REGRAS:
   • Cupom vale X dias (validade_dias). Status: aberto → usado (ou cancelado).
   • Para usar no PDV precisa de cliente do cartão fidelidade na comanda.
   • 1 cupom da roleta por cliente a cada X dias (bloqueio_dias).
   • Não soma com os 20% do cartão fidelidade. Vale com "acumula: false" não soma com desconto manual.
   • Cancelou a venda → o cupom volta a ficar aberto.
   ═══════════════════════════════════════════════════════════════ */

ABAS.CuponsRoleta = ['id', 'criado_em', 'data', 'hora', 'premio', 'tipo', 'valor', 'minimo', 'custo', 'regra', 'nome', 'aparelho', 'validade',
                     'status', 'usado_em', 'venda_id', 'venda_numero', 'loja', 'colaboradora', 'cliente_id', 'cliente', 'desconto', 'obs'];
ABAS.VendasPDV = ABAS.VendasPDV.concat(['roleta_codigo', 'desc_roleta']);

var RT_TIPOS = ['desconto', 'vale', 'produto', 'servico'];
var RT_PADRAO = {
  validade_dias: 30, bloqueio_dias: 30, limite_minuto: 40,
  whatsapp: '5568992822275',
  mensagem: 'Oi! Sou {NOME} e ganhei na Roleta Las Vegas 🎰 Prêmio: {PREMIO} | Código: {CODIGO}',
  premios: [
    { nome: '5% OFF', curto: '5% OFF', sub: 'em qualquer produto da loja', tipo: 'desconto', valor: 5, minimo: 50, custo: 0, chance: 20, icone: 'porcento', regra: 'Desconto aplicado no caixa, em compras a partir de R$ 50.' },
    { nome: 'GEL BEIJÁVEL', curto: 'GEL\nBEIJÁVEL', sub: 'Gel Beijável Morango 35ml', tipo: 'produto', valor: 0, minimo: 0, custo: 6, chance: 13, icone: 'gota', regra: 'Retire o produto no caixa junto com qualquer compra.' },
    { nome: 'VALE R$ 10', curto: 'VALE\nR$ 10', sub: 'dez reais de crédito na loja', tipo: 'vale', valor: 10, minimo: 60, custo: 10, chance: 12, icone: 'nota', acumula: false, regra: 'Abate R$ 10 em compras a partir de R$ 60. Não acumula com desconto.' },
    { nome: '10% OFF', curto: '10% OFF', sub: 'em qualquer produto da loja', tipo: 'desconto', valor: 10, minimo: 50, custo: 0, chance: 18, icone: 'porcento', regra: 'Desconto aplicado no caixa, em compras a partir de R$ 50.' },
    { nome: 'MÁSCARA DE CETIM', curto: 'MÁSCARA', sub: 'Máscara de Cetim Preta', tipo: 'produto', valor: 0, minimo: 0, custo: 9, chance: 7, icone: 'mascara', regra: 'Retire o produto no caixa junto com qualquer compra.' },
    { nome: 'VELA DE MASSAGEM', curto: 'VELA', sub: 'Vela de Massagem Baunilha 50g', tipo: 'produto', valor: 0, minimo: 80, custo: 14, chance: 6, icone: 'vela', regra: 'Retire o produto no caixa em compras a partir de R$ 80.' },
    { nome: '15% OFF', curto: '15% OFF', sub: 'em qualquer produto da loja', tipo: 'desconto', valor: 15, minimo: 50, custo: 0, chance: 8, icone: 'porcento', regra: 'Desconto aplicado no caixa, em compras a partir de R$ 50.' },
    { nome: 'VALE R$ 30', curto: 'VALE\nR$ 30', sub: 'trinta reais de crédito na loja', tipo: 'vale', valor: 30, minimo: 150, custo: 30, chance: 5, icone: 'nota', acumula: false, regra: 'Abate R$ 30 em compras a partir de R$ 150. Não acumula com desconto.' },
    { nome: 'FRETE GRÁTIS', curto: 'FRETE\nGRÁTIS', sub: 'entrega grátis em Rio Branco', tipo: 'servico', valor: 0, minimo: 0, custo: 12, chance: 8, icone: 'caminhao', regra: 'Peça a entrega grátis ao fechar a compra, só na cidade.' },
    { nome: 'KIT VIP', curto: 'KIT VIP', sub: 'Kit VIP montado pela casa', tipo: 'produto', valor: 0, minimo: 100, custo: 60, chance: 3, icone: 'sacola', destaque: true, regra: 'Sorte grande! Retire o kit no caixa em compras a partir de R$ 100.' }
  ]
};
CONFIG_PADRAO.push(['roleta_totem', JSON.stringify(RT_PADRAO), 'Roleta da loja (JSON): prêmios, chances, validade_dias, bloqueio_dias, whatsapp, mensagem — edite em Administração › Roleta']);

/* ───────── utilidades ───────── */
/* trava: usa a do PDV.gs novo; se o PDV for antigo, usa a própria */
function rtTrava_(fn) {
  if (typeof comTrava_ === 'function') return comTrava_(fn);
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function rtR2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function rtNum_(v, p) { if (v == null || String(v).trim() === '') return p; var n = Number(String(v).replace(',', '.')); return isNaN(n) ? p : n; }
function rtCod_(s) { s = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (s && !/^LV/.test(s)) s = 'LV' + s; return /^LV[A-Z0-9]{4,8}$/.test(s) ? s : ''; }
function rtDdmm_(iso) { iso = String(iso || ''); return iso.length >= 10 ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : iso; }
function rtDataMais_(iso, n) { var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function rtNome_(s) {
  var p = String(s || '').trim().split(/\s+/)[0] || '';
  p = p.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'-]/g, '').slice(0, 18);
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
}

function rtPremio_(p) {
  var tipo = RT_TIPOS.indexOf(p.tipo) >= 0 ? p.tipo : 'produto';
  var nome = String(p.nome || '').trim().slice(0, 28);
  return {
    nome: nome, curto: String(p.curto || nome).slice(0, 24), sub: String(p.sub || '').slice(0, 60), regra: String(p.regra || '').slice(0, 160),
    tipo: tipo, valor: Math.max(0, rtNum_(p.valor, 0)), minimo: Math.max(0, rtNum_(p.minimo, 0)), custo: Math.max(0, rtNum_(p.custo, 0)),
    chance: Math.max(0, rtNum_(p.chance, 0)), icone: String(p.icone || 'sacola').slice(0, 16), destaque: !!p.destaque, acumula: p.acumula !== false
  };
}
function rtCfg_() {
  var c = cfgJson_('roleta_totem', {}) || {}, o = {};
  ['validade_dias', 'bloqueio_dias', 'limite_minuto'].forEach(function (k) { o[k] = Math.max(0, Math.round(rtNum_(c[k], RT_PADRAO[k]))); });
  o.validade_dias = Math.max(1, o.validade_dias); o.limite_minuto = Math.max(5, o.limite_minuto);
  o.whatsapp = String(c.whatsapp || RT_PADRAO.whatsapp).replace(/\D/g, '');
  o.mensagem = String(c.mensagem || RT_PADRAO.mensagem).slice(0, 300);
  var lista = Array.isArray(c.premios) && c.premios.length >= 2 ? c.premios : RT_PADRAO.premios;
  o.premios = lista.map(rtPremio_).filter(function (p) { return p.nome; });
  return o;
}
/** O que o totem/celular pode ver (sem custo). */
function rtPremioPublico_(p) { return { nome: p.nome, curto: p.curto, sub: p.sub, regra: p.regra, tipo: p.tipo, icone: p.icone, destaque: p.destaque }; }

function rtRanking_(cups) {
  return (cups || ler_('CuponsRoleta')).filter(function (c) { return c.nome && c.status !== 'cancelado'; })
    .sort(function (a, b) { return String(b.criado_em).localeCompare(String(a.criado_em)); })
    .slice(0, 5).map(function (c) { return { nome: c.nome, premio: c.premio }; });
}
function rtPublicoCfg_() {
  var cache = CacheService.getScriptCache(), j = cache.get('rt_pub');
  if (j) return JSON.parse(j);
  var cfg = rtCfg_();
  var o = { ok: true, premios: cfg.premios.map(rtPremioPublico_), whatsapp: cfg.whatsapp, mensagem: cfg.mensagem, validade_dias: cfg.validade_dias, ranking: rtRanking_() };
  cache.put('rt_pub', JSON.stringify(o), 20);
  return o;
}
function rtLimparCache_() { try { CacheService.getScriptCache().remove('rt_pub'); } catch (e) {} }

/* ───────── o giro (público) ───────── */
function rtGirar_(req) {
  var cache = CacheService.getScriptCache(), chave = 'rt_min_' + Math.floor(new Date().getTime() / 60000);
  var n = Number(cache.get(chave) || 0), cfg = rtCfg_();
  if (n >= cfg.limite_minuto) throw new Error('Muitos giros agora. Tente de novo em 1 minuto.');
  cache.put(chave, String(n + 1), 120);

  var total = cfg.premios.reduce(function (s, p) { return s + p.chance; }, 0), idx = 0;
  if (total > 0) { var r = Math.random() * total; for (var i = 0; i < cfg.premios.length; i++) { r -= cfg.premios[i].chance; if (r < 0) { idx = i; break; } } }
  else idx = Math.floor(Math.random() * cfg.premios.length);
  var p = cfg.premios[idx];

  return rtTrava_(function () {
    var usados = {}; ler_('CuponsRoleta').forEach(function (c) { usados[c.id] = 1; });
    var letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', cod = '';
    for (var t = 0; t < 50; t++) { cod = 'LV'; for (var k = 0; k < 4; k++) cod += letras.charAt(Math.floor(Math.random() * letras.length)); if (!usados[cod]) break; }
    if (usados[cod]) { cod = 'LV'; for (var k2 = 0; k2 < 6; k2++) cod += letras.charAt(Math.floor(Math.random() * letras.length)); }
    var data = hoje_(), aparelho = req.aparelho === 'celular' ? 'celular' : 'totem';
    var row = { id: cod, criado_em: agora_(), data: data, hora: hora_(), premio: p.nome, tipo: p.tipo, valor: String(p.valor), minimo: String(p.minimo), custo: String(p.custo),
                regra: p.regra, nome: '', aparelho: aparelho, validade: rtDataMais_(data, cfg.validade_dias - 1), status: 'aberto', usado_em: '', venda_id: '', venda_numero: '',
                loja: '', colaboradora: '', cliente_id: '', cliente: '', desconto: '', obs: p.acumula ? '' : 'não acumula' };
    gravar_('CuponsRoleta', row);
    rtLimparCache_();
    return { ok: true, indice: idx, premio: rtPremioPublico_(p), codigo: cod, validade: row.validade };
  });
}
function rtNomear_(req) {
  var cod = rtCod_(req.codigo), nome = rtNome_(req.nome);
  if (!cod) throw new Error('Código inválido');
  if (nome.length < 2) throw new Error('Escreva o primeiro nome');
  return rtTrava_(function () {
    var cups = ler_('CuponsRoleta'), c = cups.filter(function (x) { return x.id === cod; })[0];
    if (!c) throw new Error('Código não encontrado');
    var feito = new Date(String(c.criado_em).replace(' ', 'T') + '-05:00').getTime();
    if (c.nome) return { ok: true, ranking: rtRanking_(cups) };
    if (!isNaN(feito) && new Date().getTime() - feito > 30 * 60000) throw new Error('Esse giro já passou');
    c.nome = nome; gravar_('CuponsRoleta', c);
    rtLimparCache_();
    return { ok: true, ranking: rtRanking_(cups) };
  });
}

/* ───────── conferir o cupom ───────── */
function rtValidar_(cup, cid, cups) {
  if (!cup) return 'Código não encontrado. Confira as letras com a cliente.';
  if (cup.status === 'usado') return 'Esse cupom já foi usado em ' + rtDdmm_(cup.usado_em) + (cup.venda_numero ? ' (venda #' + cup.venda_numero + ')' : '') + '.';
  if (cup.status === 'cancelado') return 'Esse cupom foi cancelado pela administração.';
  if (String(cup.validade) < hoje_()) return 'Esse cupom venceu em ' + rtDdmm_(cup.validade) + '.';
  if (cid) {
    var dias = rtCfg_().bloqueio_dias;
    if (dias > 0) {
      var desde = rtDataMais_(hoje_(), -dias);
      var ant = (cups || ler_('CuponsRoleta')).filter(function (x) { return x.cliente_id === cid && x.status === 'usado' && x.id !== cup.id && String(x.usado_em).slice(0, 10) > desde; })[0];
      if (ant) return 'Essa cliente já usou um cupom da roleta em ' + rtDdmm_(ant.usado_em) + '. Vale 1 a cada ' + dias + ' dias.';
    }
  }
  return '';
}
function rtCupomVer_(req) {
  var cod = rtCod_(req.codigo); if (!cod) throw new Error('Digite o código (ex.: LV4MK4)');
  var cups = ler_('CuponsRoleta'), cup = cups.filter(function (x) { return x.id === cod; })[0];
  var erro = rtValidar_(cup, String(req.cliente_id || ''), cups);
  if (!cup) return { ok: true, cupom: null, erro: erro };
  return { ok: true, erro: erro, cupom: { codigo: cup.id, premio: cup.premio, tipo: cup.tipo, valor: rtNum_(cup.valor, 0), minimo: rtNum_(cup.minimo, 0), regra: cup.regra,
    nome: cup.nome, criado_em: cup.criado_em, validade: cup.validade, status: cup.status, acumula: cup.obs !== 'não acumula', aparelho: cup.aparelho,
    usado_em: cup.usado_em, venda_numero: cup.venda_numero, cliente: cup.cliente } };
}

/* ───────── a venda com cupom ───────── */
var _rtPdvVenderDentro = pdvVenderDentro_;
pdvVenderDentro_ = function (c, req) {
  var cod = rtCod_(req.roleta_codigo);
  if (!cod) return _rtPdvVenderDentro(c, req);
  var uid = String(req.uid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (uid && ler_('VendasPDV').some(function (v) { return v.id === uid; })) { var r0 = {}; for (var k0 in req) r0[k0] = req[k0]; delete r0.roleta_codigo; return _rtPdvVenderDentro(c, r0); }

  var cid = String(req.cliente_id || '');
  if (!cid) throw new Error('Para usar o cupom da roleta, coloque a cliente do cartão fidelidade na comanda.');
  var cups = ler_('CuponsRoleta'), cup = cups.filter(function (x) { return x.id === cod; })[0];
  var erro = rtValidar_(cup, cid, cups); if (erro) throw new Error(erro);

  var cat = {}; pdvProdutos_(true).forEach(function (p) { cat[p.id] = p; });
  var sub = rtR2_((Array.isArray(req.itens) ? req.itens.slice(0, 80) : []).reduce(function (s, i) {
    var q = Math.max(1, Math.min(999, Math.round(Number(i.qtd) || 1))), p = cat[i.id];
    var preco = p ? rtR2_(p.promo > 0 ? p.promo : p.preco) : (function () { try { return valor_(i.preco); } catch (e) { return 0; } })();
    return s + preco * q;
  }, 0));
  var manual = req.desconto ? valor_(req.desconto) : 0, pcfg = pdvCfg_();
  if (manual > sub * pcfg.desconto_max / 100 + 0.01) throw new Error('Desconto acima de ' + pcfg.desconto_max + '% precisa da administração.');
  var minimo = rtNum_(cup.minimo, 0), valor = rtNum_(cup.valor, 0);
  if (minimo > 0 && sub < minimo - 0.001) throw new Error('O prêmio ' + cup.premio + ' vale em compras a partir de R$ ' + minimo.toFixed(2).replace('.', ',') + '.');
  try {
    var ciclo = fidCfg_().ciclo, esc = req.fid_presentes && typeof req.fid_presentes === 'object' ? req.fid_presentes : {};
    for (var key in esc) { var nn = Number(String(key).split('|')[1]); if (nn && nn % ciclo === 0) throw new Error('O cupom da roleta não soma com os 20% do cartão fidelidade. Deixe um dos dois para a próxima compra.'); }
  } catch (e) { if (/roleta/.test(e.message)) throw e; }
  if (cup.tipo === 'vale' && cup.obs === 'não acumula' && manual > 0.009) throw new Error('O ' + cup.premio + ' não soma com outro desconto. Tire o desconto manual.');
  var descR = cup.tipo === 'desconto' ? rtR2_(sub * valor / 100) : cup.tipo === 'vale' ? rtR2_(Math.min(valor, Math.max(0, sub - manual))) : 0;

  var req2 = {}; for (var k in req) req2[k] = req[k];
  delete req2.roleta_codigo;
  req2.desconto = String(rtR2_(manual + descR));
  var cfgOrig = pdvCfg_, d;
  pdvCfg_ = function () { var o = cfgOrig(); o.desconto_max = 100; return o; };   // o desconto do cupom já foi conferido acima
  try { d = _rtPdvVenderDentro(c, req2); } finally { pdvCfg_ = cfgOrig; }
  try { if (d.pdv && !d.pdv.erro) d.pdv.cfg = pdvCfg_(); } catch (e) {}

  var v = ler_('VendasPDV').filter(function (x) { return x.id === d.pdvVenda.id; })[0];
  v.roleta_codigo = cod; v.desc_roleta = String(descR);
  if (v.desc_manual != null && v.desc_manual !== '') v.desc_manual = String(rtR2_(manual));
  gravar_('VendasPDV', v);
  d.pdvVenda = pdvVenda_(v, false);

  var cli = ler_('Clientes').filter(function (x) { return x.id === cid; })[0] || {};
  cup = ler_('CuponsRoleta').filter(function (x) { return x.id === cod; })[0];
  cup.status = 'usado'; cup.usado_em = agora_(); cup.venda_id = v.id; cup.venda_numero = v.numero; cup.loja = v.loja; cup.colaboradora = c.nome;
  cup.cliente_id = cid; cup.cliente = cli.nome || v.cliente || ''; cup.desconto = String(descR);
  gravar_('CuponsRoleta', cup);
  rtLimparCache_();
  d.roleta = { codigo: cod, premio: cup.premio, tipo: cup.tipo, desconto: descR, regra: cup.regra };
  log_(c.nome, 'roleta cupom', cod + ' · ' + cup.premio + ' · ' + (cli.nome || '') + ' · PDV #' + v.numero + (descR ? ' · −' + descR : ''));
  return d;
};

/* venda cancelada → cupom volta a valer */
var _rtPdvCancelarLinha = typeof pdvCancelarLinha_ === 'function' ? pdvCancelarLinha_ : null;
if (_rtPdvCancelarLinha) pdvCancelarLinha_ = function (v, por, motivo) {
  _rtPdvCancelarLinha(v, por, motivo);
  try {
    if (!v.roleta_codigo) return;
    var cup = ler_('CuponsRoleta').filter(function (x) { return x.id === v.roleta_codigo && x.venda_id === v.id && x.status === 'usado'; })[0];
    if (!cup) return;
    cup.status = 'aberto'; cup.obs = (cup.obs === 'não acumula' ? 'não acumula' : '') ; cup.usado_em = ''; cup.venda_id = ''; cup.venda_numero = ''; cup.loja = ''; cup.colaboradora = ''; cup.cliente_id = ''; cup.cliente = ''; cup.desconto = '';
    gravar_('CuponsRoleta', cup);
    log_(por, 'roleta cupom reaberto', cup.id + ' · venda #' + v.numero + ' cancelada');
  } catch (e) { log_('Sistema', 'erro roleta cancelar', String(e && e.message || e)); }
};

/* ───────── entradas: pública (totem/celular) e da equipe ───────── */
var _rtRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'roletaTotem') {
    try {
      if (req.op === 'girar') return rtGirar_(req);
      if (req.op === 'nome') return rtNomear_(req);
      return rtPublicoCfg_();
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (req && req.a === 'roletaCupom') {
    try { checarColab_(req); return rtCupomVer_(req); }
    catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _rtRodar(req);
};

/* ───────── administração: a = 'admRoletaTotem' ───────── */
ADMIN.admRoletaTotem = function (req) {
  var op = req.op;
  if (op === 'lista') {
    var cfg = rtCfg_(), hoje = hoje_(), cups = ler_('CuponsRoleta');
    var res = { gerados: cups.length, hoje: 0, abertos: 0, usados: 0, vencidos: 0, cancelados: 0, custo_usados: 0, desconto_usado: 0, com_nome: 0 };
    var custo = {}; cfg.premios.forEach(function (p) { custo[p.nome] = p.custo; });
    cups.forEach(function (c) {
      if (c.data === hoje) res.hoje++;
      if (c.nome) res.com_nome++;
      if (c.status === 'usado') { res.usados++; res.custo_usados += rtNum_(c.custo, custo[c.premio] || 0); res.desconto_usado += rtNum_(c.desconto, 0); }
      else if (c.status === 'cancelado') res.cancelados++;
      else if (String(c.validade) < hoje) res.vencidos++;
      else res.abertos++;
    });
    res.custo_usados = rtR2_(res.custo_usados); res.desconto_usado = rtR2_(res.desconto_usado);
    var lista = cups.slice(-500).reverse().map(function (c) {
      var st = c.status === 'aberto' && String(c.validade) < hoje ? 'vencido' : c.status;
      return { codigo: c.id, criado_em: c.criado_em, data: c.data, premio: c.premio, tipo: c.tipo, nome: c.nome, aparelho: c.aparelho, validade: c.validade, status: st,
               usado_em: c.usado_em, venda_numero: c.venda_numero, loja: c.loja, colaboradora: c.colaboradora, cliente: c.cliente, desconto: rtNum_(c.desconto, 0) };
    });
    return { ok: true, cfg: cfg, resumo: res, cupons: lista };
  }
  if (op === 'cfg') {
    var v = req.valor || {}, atual = cfgJson_('roleta_totem', {}) || {};
    if (v.premios != null) {
      if (!Array.isArray(v.premios) || v.premios.length < 4 || v.premios.length > 14) throw new Error('A roleta precisa de 4 a 14 prêmios');
      var ps = v.premios.map(rtPremio_);
      ps.forEach(function (p, i) { if (!p.nome) throw new Error('Prêmio ' + (i + 1) + ' sem nome'); if (p.tipo === 'desconto' && (p.valor <= 0 || p.valor > 100)) throw new Error(p.nome + ': desconto entre 1 e 100%'); if (p.tipo === 'vale' && p.valor <= 0) throw new Error(p.nome + ': informe o valor do vale'); });
      if (!ps.some(function (p) { return p.chance > 0; })) throw new Error('Pelo menos um prêmio precisa ter chance');
      atual.premios = ps;
    }
    ['validade_dias', 'bloqueio_dias', 'limite_minuto'].forEach(function (k) { if (v[k] != null && v[k] !== '') { var n = rtNum_(v[k], NaN); if (isNaN(n) || n < 0) throw new Error('Valor inválido em ' + k); atual[k] = Math.round(n); } });
    if (v.whatsapp != null) { var w = String(v.whatsapp).replace(/\D/g, ''); if (!/^55\d{10,11}$/.test(w)) throw new Error('WhatsApp com 55 + DDD + número'); atual.whatsapp = w; }
    if (v.mensagem != null) { if (String(v.mensagem).indexOf('{CODIGO}') < 0) throw new Error('A mensagem precisa ter {CODIGO}'); atual.mensagem = String(v.mensagem).slice(0, 300); }
    setCfg_('roleta_totem', JSON.stringify(atual));
    rtLimparCache_();
    log_('Administração', 'config roleta da loja', (atual.premios || []).length + ' prêmios');
    return ADMIN.admRoletaTotem({ op: 'lista' });
  }
  if (op === 'cancelar') return rtTrava_(function () {
    var cod = rtCod_(req.codigo), c = ler_('CuponsRoleta').filter(function (x) { return x.id === cod; })[0];
    if (!c) throw new Error('Cupom não encontrado');
    if (c.status === 'usado') throw new Error('Cupom já usado — cancele a venda #' + c.venda_numero + ' primeiro');
    c.status = 'cancelado'; c.obs = String(req.motivo || 'Cancelado pela administração').slice(0, 120);
    gravar_('CuponsRoleta', c); rtLimparCache_();
    log_('Administração', 'roleta cupom cancelado', cod);
    return ADMIN.admRoletaTotem({ op: 'lista' });
  });
  throw new Error('Operação desconhecida');
};
