/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · CLIENTES E FIDELIDADE (Portal Equipe) — v22
   Cartão fidelidade de 10 selos, presente na 5ª, 20% + presente na 10ª,
   indicação (vale selo quando a amiga indicada FINALIZA a 1ª compra),
   cashback de 10% com validade e lista de presentes.
   Arquivo SEPARADO — fica DEPOIS de Código.gs, PDV, ROLETA, ESTOQUE, NUVEMSHOP e OPERACAO.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: FIDELIDADE  (o último da lista)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   As abas Clientes e Presentes são criadas sozinhas. Config › fidelidade guarda as regras.
   ───────────────────────────────────────────────────────────────
   COMO CONTA (tudo é recalculado das vendas — cancelou a venda, sai o selo/cashback/prêmio dela):
   • Selo = compra com cliente vinculado e valor (subtotal − desconto manual) ≥ mínimo.
   • Selo de indicação = a amiga cadastrada com "quem indicou" finaliza a 1ª compra que vale selo.
   • Selos 5, 15, 25… → presente. Selos 10, 20, 30… → 20% + presente (o cartão recomeça).
   • O prêmio é usado na compra que completa o selo ou, se veio de indicação, na próxima compra.
   • Cashback = % do valor pago, vale X dias; usa primeiro o que vence antes.
   ═══════════════════════════════════════════════════════════════ */

ABAS.Clientes = ['id', 'nome', 'tel', 'nascimento', 'email', 'indicado_por', 'selos_iniciais', 'origem', 'criado_em', 'criado_por', 'obs', 'ativo'];
ABAS.Presentes = ['id', 'nome', 'produto_id', 'para', 'ativo', 'obs', 'atualizado_em'];
ABAS.VendasPDV = ABAS.VendasPDV.concat(['cliente_id', 'fid_conta', 'fid_selo', 'fid_premios', 'desc_manual', 'desc_fid', 'cashback_usado', 'cashback_gerado']);

var FID_PADRAO = { minimo: 50, cashback_pct: 10, cashback_dias: 30, ciclo: 10, presente_em: 5, desconto10: 20 };
CONFIG_PADRAO.push(['fidelidade', JSON.stringify(FID_PADRAO), 'Fidelidade (JSON): minimo (R$ para valer selo), cashback_pct, cashback_dias, ciclo (selos do cartão), presente_em (selo do 1º presente), desconto10 (% no fim do cartão)']);

function fidCfg_() {
  var c = cfgJson_('fidelidade', {}) || {}, o = {};
  for (var k in FID_PADRAO) o[k] = (c[k] != null && c[k] !== '' && !isNaN(Number(c[k]))) ? Number(c[k]) : FID_PADRAO[k];
  o.ciclo = Math.max(2, Math.round(o.ciclo)); o.presente_em = Math.max(1, Math.min(o.ciclo - 1, Math.round(o.presente_em)));
  return o;
}
function fidR2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function fidTel_(t) {
  t = String(t || '').replace(/\D/g, '');
  if (/^55\d{10,11}$/.test(t)) t = t.slice(2);
  if (/^0\d{10,11}$/.test(t)) t = t.slice(1);
  return t;
}
function fidMascara_(t) { t = String(t || ''); return t.length >= 4 ? '•••• ' + t.slice(-4) : ''; }
function fidNasc_(s) {
  s = String(s || '').trim(); var m;
  if (/^\d{8}$/.test(s)) s = s.slice(0, 2) + '/' + s.slice(2, 4) + '/' + s.slice(4);
  if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/))) { var a = m[3].length === 2 ? (Number(m[3]) > 30 ? '19' : '20') + m[3] : m[3]; return a + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
}
function fidDataMais_(iso, n) { var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function fidJson_(s, p) { try { var v = JSON.parse(s || ''); return v == null ? p : v; } catch (e) { return p; } }
function fidTipoPremio_(n, cfg) { if (n % cfg.ciclo === 0) return 10; if (n % cfg.ciclo === cfg.presente_em) return 5; return 0; }

/* ───────── índice: vendas por cliente e quem cada uma indicou (uma leitura só) ───────── */
function fidIndice_(vendas, clientes) {
  var porCli = {}, indicados = {}, porId = {};
  (vendas || ler_('VendasPDV')).forEach(function (v) {
    if (!v.cliente_id || v.status === 'cancelada') return;
    (porCli[v.cliente_id] = porCli[v.cliente_id] || []).push(v);
  });
  for (var k in porCli) porCli[k].sort(function (a, b) { return String(a.criada_em).localeCompare(String(b.criada_em)); });
  (clientes || ler_('Clientes')).forEach(function (c) {
    porId[c.id] = c;
    if (c.indicado_por && c.indicado_por !== c.id) (indicados[c.indicado_por] = indicados[c.indicado_por] || []).push(c);
  });
  return { porCli: porCli, indicados: indicados, porId: porId };
}

/* ───────── o cartão de uma cliente ───────── */
function fidCartao_(cli, idx, cfg, completo) {
  cfg = cfg || fidCfg_();
  var hoje = hoje_(), ini = Math.max(0, Math.round(Number(cli.selos_iniciais) || 0));
  var minhas = idx.porCli[cli.id] || [];
  var marcas = [];
  minhas.forEach(function (v) { if (v.fid_conta === 'SIM') marcas.push({ tipo: 'compra', em: String(v.criada_em), venda_id: v.id }); });
  var inds = (idx.indicados[cli.id] || []).map(function (a) {
    var primeira = (idx.porCli[a.id] || []).filter(function (v) { return v.fid_conta === 'SIM'; })[0];
    if (primeira) marcas.push({ tipo: 'indicacao', em: String(primeira.criada_em), amigo: a.nome, amigo_id: a.id });
    return { id: a.id, nome: a.nome, valida: !!primeira, em: primeira ? String(primeira.criada_em).slice(0, 10) : '', cadastrada: String(a.criado_em || '').slice(0, 10) };
  });
  marcas.sort(function (a, b) { return a.em.localeCompare(b.em) || (a.tipo === 'compra' ? -1 : 1); });
  marcas.forEach(function (m, i) { m.n = ini + i + 1; });
  var total = ini + marcas.length;

  var premios = [];
  marcas.forEach(function (m) { var t = fidTipoPremio_(m.n, cfg); if (t) premios.push({ key: cli.id + '|' + m.n, tipo: t, n: m.n, em: m.em.slice(0, 10), origem: m.tipo, amigo: m.amigo || '' }); });
  var usados = {};
  minhas.forEach(function (v) { fidJson_(v.fid_premios, []).forEach(function (p) { usados[p.key] = { venda_id: v.id, data: v.data, presente: p.presente || '' }; }); });
  premios.forEach(function (p) { if (usados[p.key]) { p.usado = true; p.usado_em = usados[p.key].data; p.presente = usados[p.key].presente; } });
  var pendentes = premios.filter(function (p) { return !p.usado; });

  /* cashback: percorre as vendas em ordem — primeiro usa (do que vence antes), depois ganha */
  var creditos = [], ganho = 0, usado = 0, vencido = 0;
  minhas.forEach(function (v) {
    var d = String(v.data), u = fidR2_(v.cashback_usado);
    if (u > 0) {
      usado = fidR2_(usado + u);
      creditos.filter(function (c) { return c.resta > 0 && c.data <= d && c.expira >= d; })
        .sort(function (a, b) { return a.expira.localeCompare(b.expira); })
        .forEach(function (c) { if (u <= 0) return; var x = Math.min(u, c.resta); c.resta = fidR2_(c.resta - x); u = fidR2_(u - x); });
    }
    var g = fidR2_(v.cashback_gerado);
    if (g > 0) { creditos.push({ data: d, valor: g, resta: g, expira: fidDataMais_(d, cfg.cashback_dias) }); ganho = fidR2_(ganho + g); }
  });
  var saldo = 0, vence = null;
  creditos.forEach(function (c) {
    if (c.resta <= 0) return;
    if (c.expira >= hoje) { saldo = fidR2_(saldo + c.resta); if (!vence || c.expira < vence.data) vence = { data: c.expira, valor: c.resta }; else if (c.expira === vence.data) vence.valor = fidR2_(vence.valor + c.resta); }
    else vencido = fidR2_(vencido + c.resta);
  });

  var gasto = fidR2_(minhas.reduce(function (s, v) { return s + (Number(v.total) || 0); }, 0));
  var o = {
    id: cli.id, nome: cli.nome, tel_mask: fidMascara_(cli.tel), nascimento: cli.nascimento || '',
    selos: total, ciclo: cfg.ciclo, presente_em: cfg.presente_em, no_cartao: total % cfg.ciclo, cartoes_completos: Math.floor(total / cfg.ciclo),
    pendentes: pendentes, cashback: { saldo: saldo, vence: vence, ganho: ganho, usado: usado, vencido: vencido },
    compras: minhas.length, gasto: gasto, ticket: minhas.length ? fidR2_(gasto / minhas.length) : 0,
    ultima: minhas.length ? String(minhas[minhas.length - 1].data) : '', primeira: minhas.length ? String(minhas[0].data) : '',
    indicacoes: inds.length, indicacoes_validas: inds.filter(function (a) { return a.valida; }).length,
    indicado_por: cli.indicado_por || '', indicado_por_nome: cli.indicado_por && idx.porId[cli.indicado_por] ? idx.porId[cli.indicado_por].nome : ''
  };
  if (completo) {
    o.premios = premios; o.lista_indicacoes = inds; o.selos_iniciais = ini;
    o.marcas = marcas.map(function (m) { return { n: m.n, tipo: m.tipo, em: m.em.slice(0, 10), amigo: m.amigo || '' }; });
    o.historico = minhas.slice(-40).reverse().map(function (v) {
      return { data: v.data, hora: v.hora, loja: v.loja, numero: Number(v.numero) || 0, total: fidR2_(v.total), conta: v.fid_conta === 'SIM', selo: Number(v.fid_selo) || 0,
               premios: fidJson_(v.fid_premios, []).map(function (p) { return { tipo: p.tipo, presente: p.presente || '' }; }),
               cashback_gerado: fidR2_(v.cashback_gerado), cashback_usado: fidR2_(v.cashback_usado), desc_fid: fidR2_(v.desc_fid), vendedora: primeiroNomeFid_(v.colaboradora) };
    });
    o.email = cli.email || ''; o.obs = cli.obs || ''; o.criado_em = String(cli.criado_em || '').slice(0, 10); o.origem = cli.origem || '';
  }
  return o;
}
function primeiroNomeFid_(n) { return String(n || '').split(' ')[0]; }

/* ───────── presentes ───────── */
function fidPresentes_(admin) {
  var prods = {}; try { pdvProdutos_(true).forEach(function (p) { prods[p.id] = p; }); } catch (e) {}
  return ler_('Presentes').filter(function (p) { return admin || p.ativo !== 'NÃO'; }).map(function (p) {
    var pr = prods[p.produto_id];
    return { id: p.id, nome: p.nome, produto_id: p.produto_id || '', produto: pr ? pr.nome : '', para: p.para || 'ambos', ativo: p.ativo !== 'NÃO', obs: p.obs || '' };
  });
}

/* ───────── cadastro ───────── */
function fidCadastrar_(dados, por, admin) {
  return comTrava_(function () {
    var nome = String(dados.nome || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (nome.length < 2) throw new Error('Escreva o nome da cliente');
    var tel = fidTel_(dados.tel);
    if (!/^\d{10,11}$/.test(tel)) throw new Error('WhatsApp inválido — use DDD + número');
    var todas = ler_('Clientes');
    var ja = todas.filter(function (c) { return fidTel_(c.tel) === tel && c.ativo !== 'NÃO'; })[0];
    if (ja) { var e = new Error('Esse WhatsApp já é da cliente ' + ja.nome); e.existe = ja.id; throw e; }
    var ind = String(dados.indicado_por || '');
    if (ind && !todas.some(function (c) { return c.id === ind && c.ativo !== 'NÃO'; })) throw new Error('Quem indicou não foi encontrada');
    var c = { id: 'C' + new Date().getTime() + Math.floor(Math.random() * 1e3), nome: nome, tel: tel, nascimento: fidNasc_(dados.nascimento), email: String(dados.email || '').trim().slice(0, 80),
              indicado_por: ind, selos_iniciais: admin && dados.selos_iniciais ? String(Math.max(0, Math.round(Number(dados.selos_iniciais) || 0))) : '0',
              origem: admin ? 'administração' : 'loja', criado_em: agora_(), criado_por: por, obs: String(dados.obs || '').slice(0, 200), ativo: 'SIM' };
    gravar_('Clientes', c);
    log_(por, 'cliente nova', nome + (ind ? ' · indicada' : ''));
    return c;
  });
}

/* ───────── busca (equipe vê telefone mascarado) ───────── */
function fidBuscar_(q) {
  q = String(q || '').trim(); if (q.length < 2) return [];
  var dig = q.replace(/\D/g, ''), nq = norm_(q);
  var cl = ler_('Clientes').filter(function (c) { return c.ativo !== 'NÃO'; });
  var achou = cl.filter(function (c) { return (dig.length >= 4 && String(c.tel).indexOf(dig) >= 0) || (!/^\d+$/.test(q.replace(/\s/g, '')) && norm_(c.nome).indexOf(nq) >= 0); });
  achou.sort(function (a, b) { var ia = norm_(a.nome).indexOf(nq) === 0 ? 0 : 1, ib = norm_(b.nome).indexOf(nq) === 0 ? 0 : 1; return ia - ib || norm_(a.nome).localeCompare(norm_(b.nome)); });
  achou = achou.slice(0, 12);
  if (!achou.length) return [];
  var idx = fidIndice_(null, cl), cfg = fidCfg_();
  return achou.map(function (c) { var k = fidCartao_(c, idx, cfg, false); return { id: c.id, nome: c.nome, tel_mask: k.tel_mask, selos: k.selos, no_cartao: k.no_cartao, cashback: k.cashback.saldo, pendentes: k.pendentes.length, ultima: k.ultima }; });
}
function fidCartaoPorId_(id, completo) {
  var cl = ler_('Clientes'), c = cl.filter(function (x) { return x.id === id; })[0];
  if (!c || c.ativo === 'NÃO') throw new Error('Cliente não encontrada');
  var k = fidCartao_(c, fidIndice_(null, cl), fidCfg_(), completo);
  k.tel = fidTel_(c.tel);
  return k;
}

/* ───────── a venda com cliente: selo, prêmio, cashback ───────── */
var _fidPdvVenderDentro = pdvVenderDentro_;
pdvVenderDentro_ = function (c, req) {
  var cid = String(req.cliente_id || '');
  if (!cid) return _fidPdvVenderDentro(c, req);
  var uid = String(req.uid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (uid && ler_('VendasPDV').some(function (v) { return v.id === uid; })) { var dr = _fidPdvVenderDentro(c, req); try { dr.fid = { repetida: true }; } catch (e) {} return dr; }

  var cfg = fidCfg_(), pcfg = pdvCfg_();
  var clientes = ler_('Clientes'), cli = clientes.filter(function (x) { return x.id === cid && x.ativo !== 'NÃO'; })[0];
  if (!cli) throw new Error('Cliente da fidelidade não encontrada — tire e escolha de novo');
  var idx = fidIndice_(null, clientes), antes = fidCartao_(cli, idx, cfg, false);

  // subtotal do mesmo jeito que o PDV calcula (preço do catálogo)
  var cat = {}; pdvProdutos_(true).forEach(function (p) { cat[p.id] = p; });
  var sub = fidR2_((Array.isArray(req.itens) ? req.itens.slice(0, 80) : []).reduce(function (s, i) {
    var q = Math.max(1, Math.min(999, Math.round(Number(i.qtd) || 1))), p = cat[i.id];
    var preco = p ? fidR2_(p.promo > 0 ? p.promo : p.preco) : (function () { try { return valor_(i.preco); } catch (e) { return 0; } })();
    return s + preco * q;
  }, 0));
  var manual = req.desconto ? valor_(req.desconto) : 0;
  if (manual > sub * pcfg.desconto_max / 100 + 0.01) throw new Error('Desconto acima de ' + pcfg.desconto_max + '% precisa da administração.');
  var conta = fidR2_(sub - manual) >= cfg.minimo - 0.001;
  var pend = antes.pendentes.slice(), novoSelo = conta ? antes.selos + 1 : 0, novoPremio = null;
  if (novoSelo) { var t = fidTipoPremio_(novoSelo, cfg); if (t) { novoPremio = { key: cid + '|' + novoSelo, tipo: t, n: novoSelo, origem: 'compra' }; pend.push(novoPremio); } }

  var presentes = {}; fidPresentes_(false).forEach(function (p) { presentes[p.id] = p; });
  var escolhas = req.fid_presentes && typeof req.fid_presentes === 'object' ? req.fid_presentes : {};
  var resgate = [];
  pend.forEach(function (p) {
    var e = escolhas[p.key]; if (!e) return;
    var pr = e.id ? presentes[e.id] : null;
    var nome = pr ? pr.nome : String(e.texto || '').trim().slice(0, 80);
    if (!nome) throw new Error('Escolha o presente da ' + p.n + 'ª compra');
    resgate.push({ key: p.key, tipo: p.tipo, n: p.n, presente: nome, presente_id: pr ? pr.id : '', produto_id: pr ? pr.produto_id : '' });
  });
  var tem20 = resgate.some(function (p) { return p.tipo === 10; });
  if (tem20 && manual > 0.009) throw new Error('A compra com ' + cfg.desconto10 + '% do cartão fidelidade não soma com outro desconto. Tire o desconto manual.');
  var descFid = tem20 ? fidR2_(sub * cfg.desconto10 / 100) : 0;
  var usar = req.cashback_usar ? valor_(req.cashback_usar) : 0;
  if (usar > antes.cashback.saldo + 0.009) throw new Error('Cashback disponível: R$ ' + antes.cashback.saldo.toFixed(2).replace('.', ','));
  usar = fidR2_(Math.min(usar, Math.max(0, sub - manual - descFid)));

  var req2 = {}; for (var k in req) req2[k] = req[k];
  req2.desconto = String(fidR2_(manual + descFid + usar)); req2.cliente = cli.nome; req2.cliente_tel = fidTel_(cli.tel);
  var cfgOrig = pdvCfg_, d;
  pdvCfg_ = function () { var o = cfgOrig(); o.desconto_max = 100; return o; };   // os descontos da fidelidade já foram conferidos acima
  try { d = _fidPdvVenderDentro(c, req2); } finally { pdvCfg_ = cfgOrig; }
  try { if (d.pdv && !d.pdv.erro) d.pdv.cfg = pdvCfg_(); } catch (e) {}

  var v = ler_('VendasPDV').filter(function (x) { return x.id === d.pdvVenda.id; })[0];
  var gerado = fidR2_((Number(v.total) || 0) * cfg.cashback_pct / 100);
  v.cliente_id = cid; v.fid_conta = conta ? 'SIM' : 'NÃO'; v.fid_selo = novoSelo ? String(novoSelo) : '';
  v.fid_premios = resgate.length ? JSON.stringify(resgate.map(function (p) { return { key: p.key, tipo: p.tipo, n: p.n, presente: p.presente, presente_id: p.presente_id }; })) : '';
  v.desc_manual = String(fidR2_(manual)); v.desc_fid = String(descFid); v.cashback_usado = String(usar); v.cashback_gerado = String(gerado);
  gravar_('VendasPDV', v);
  d.pdvVenda = pdvVenda_(v, false);

  // presente que é produto do catálogo: sai do estoque da prateleira
  try {
    var saem = resgate.filter(function (p) { return p.produto_id; });
    if (saem.length && typeof estMovimentar_ === 'function' && estCfg_().baixa_pdv)
      estMovimentar_(saem.map(function (p) { return { produto_id: p.produto_id, produto: p.presente, loja: estPrateleiraDe_(v.loja), delta: -1 }; }), 'brinde', 'Fidelidade · PDV #' + v.numero + ' · ' + v.id, c.nome, 'Presente da ' + saem.map(function (p) { return p.n + 'ª'; }).join(', ') + ' compra · ' + cli.nome);
  } catch (e) { log_('Sistema', 'erro baixa brinde', String(e && e.message || e)); }

  var depois = fidCartao_(cli, fidIndice_(null, clientes), cfg, false);
  d.fid = { cliente: { id: cid, nome: cli.nome }, selo: novoSelo, conta: conta, minimo: cfg.minimo, premios: resgate.map(function (p) { return { tipo: p.tipo, n: p.n, presente: p.presente }; }),
            novo_premio: novoPremio && !resgate.some(function (p) { return p.key === novoPremio.key; }) ? { tipo: novoPremio.tipo, n: novoPremio.n } : null,
            desc_fid: descFid, cashback_usado: usar, cashback_gerado: gerado, cartao: depois };
  log_(c.nome, 'fidelidade', cli.nome + ' · selo ' + (novoSelo || '—') + (resgate.length ? ' · prêmio ' + resgate.map(function (p) { return p.n; }).join(',') : '') + ' · cashback +' + gerado + (usar ? ' −' + usar : ''));
  return d;
};

/* ───────── pacotes ───────── */
var _fidDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _fidDadosColab(c);
  try { d.fidelidade = { cfg: fidCfg_(), presentes: fidPresentes_(false) }; } catch (e) { d.fidelidade = { erro: String(e && e.message || e) }; }
  return d;
};
var _fidAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _fidAdmDados(req);
  try { d.fidelidade = { cfg: fidCfg_(), presentes: fidPresentes_(true) }; } catch (e) { d.fidelidade = { erro: String(e && e.message || e) }; }
  return d;
};

/* ───────── ações da equipe: a = 'fidelidade' ───────── */
var _fidRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'fidelidade') {
    try {
      var c = checarColab_(req);
      if (req.op === 'buscar') return { ok: true, clientes: fidBuscar_(req.q) };
      if (req.op === 'cartao') return { ok: true, cartao: fidCartaoPorId_(req.id, false) };
      if (req.op === 'cadastrar') { var n = fidCadastrar_(req.cliente || {}, c.nome, false); return { ok: true, cartao: fidCartaoPorId_(n.id, false) }; }
      return { ok: false, erro: 'Operação desconhecida' };
    } catch (e) { return { ok: false, erro: String(e && e.message || e), existe: e && e.existe || '' }; }
  }
  return _fidRodar(req);
};

/* ───────── administração: a = 'admFidelidade' ───────── */
ADMIN.admFidelidade = function (req) {
  var op = req.op;
  if (op === 'lista') {
    var cl = ler_('Clientes').filter(function (c) { return c.ativo !== 'NÃO'; }), idx = fidIndice_(null, cl), cfg = fidCfg_();
    return { ok: true, cfg: cfg, clientes: cl.map(function (c) { var k = fidCartao_(c, idx, cfg, false); k.tel = fidTel_(c.tel); k.criado_em = String(c.criado_em || '').slice(0, 10); k.pendentes = k.pendentes.length; return k; }) };
  }
  if (op === 'cartao') return { ok: true, cartao: fidCartaoPorId_(req.id, true) };
  if (op === 'cadastrar') { var n = fidCadastrar_(req.cliente || {}, 'Administração', true); return { ok: true, cartao: fidCartaoPorId_(n.id, true) }; }
  if (op === 'salvar') return comTrava_(function () {
    var x = req.cliente || {}, todas = ler_('Clientes'), c = todas.filter(function (y) { return y.id === x.id; })[0];
    if (!c) throw new Error('Cliente não encontrada');
    if (x.nome != null) { var nm = String(x.nome).trim().replace(/\s+/g, ' ').slice(0, 80); if (nm.length < 2) throw new Error('Nome muito curto'); c.nome = nm; }
    if (x.tel != null) { var t = fidTel_(x.tel); if (!/^\d{10,11}$/.test(t)) throw new Error('WhatsApp inválido'); if (todas.some(function (y) { return y.id !== c.id && y.ativo !== 'NÃO' && fidTel_(y.tel) === t; })) throw new Error('Esse WhatsApp já é de outra cliente'); c.tel = t; }
    if (x.nascimento != null) c.nascimento = fidNasc_(x.nascimento);
    if (x.email != null) c.email = String(x.email).trim().slice(0, 80);
    if (x.obs != null) c.obs = String(x.obs).slice(0, 200);
    if (x.selos_iniciais != null) c.selos_iniciais = String(Math.max(0, Math.round(Number(x.selos_iniciais) || 0)));
    if (x.indicado_por != null) {
      var ind = String(x.indicado_por);
      if (ind === c.id) throw new Error('A cliente não pode indicar ela mesma');
      if (ind && !todas.some(function (y) { return y.id === ind && y.ativo !== 'NÃO'; })) throw new Error('Quem indicou não foi encontrada');
      c.indicado_por = ind;
    }
    if (x.ativo === false) c.ativo = 'NÃO';
    gravar_('Clientes', c);
    log_('Administração', 'cliente editada', c.nome);
    return { ok: true, cartao: c.ativo === 'NÃO' ? null : fidCartaoPorId_(c.id, true) };
  });
  if (op === 'presente') {
    var p = req.presente || {};
    if (!String(p.nome || '').trim()) throw new Error('Dê um nome ao presente');
    var r = p.id ? ler_('Presentes').filter(function (y) { return y.id === p.id; })[0] : null;
    r = r || { id: 'G' + new Date().getTime() + Math.floor(Math.random() * 1e3) };
    r.nome = String(p.nome).trim().slice(0, 80); r.produto_id = String(p.produto_id || ''); r.para = ['5', '10', 'ambos'].indexOf(String(p.para)) >= 0 ? String(p.para) : 'ambos';
    r.ativo = p.ativo === false ? 'NÃO' : 'SIM'; r.obs = String(p.obs || '').slice(0, 200); r.atualizado_em = agora_();
    gravar_('Presentes', r);
    log_('Administração', 'presente', r.nome + ' · ' + r.ativo);
    return { ok: true, presentes: fidPresentes_(true) };
  }
  if (op === 'cfg') {
    var v = req.valor || {}, o = {};
    for (var k in FID_PADRAO) if (v[k] != null && v[k] !== '') { var nv = Number(String(v[k]).replace(',', '.')); if (isNaN(nv) || nv < 0) throw new Error('Valor inválido em ' + k); o[k] = nv; }
    var atual = cfgJson_('fidelidade', {}) || {}; for (var j in o) atual[j] = o[j];
    setCfg_('fidelidade', JSON.stringify(atual));
    log_('Administração', 'config fidelidade', JSON.stringify(atual));
    return { ok: true, cfg: fidCfg_() };
  }
  if (op === 'importar') return comTrava_(function () { return fidImportar_(req.lista); });
  throw new Error('Operação desconhecida');
};

/** Importa a lista exportada do sistema antigo. Junta pelo WhatsApp (ou pelo nome, quando não tem telefone). Não apaga ninguém. */
function fidImportar_(lista) {
  lista = Array.isArray(lista) ? lista : [];
  if (!lista.length) throw new Error('Lista vazia');
  if (lista.length > 20000) throw new Error('Lista grande demais (máx. 20.000)');
  var sh = aba_('Clientes'), cab = cabecalho_('Clientes', sh), atuais = ler_('Clientes'), porTel = {}, porNome = {};
  atuais.forEach(function (c) { var t = fidTel_(c.tel); if (t) porTel[t] = c; porNome[norm_(c.nome)] = porNome[norm_(c.nome)] || c; });
  var novos = 0, atualizados = 0, ignorados = 0, agora = agora_(), base = new Date().getTime();
  lista.forEach(function (i, n) {
    var nome = String(i.nome || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    var tel = fidTel_(i.tel); if (!/^\d{10,11}$/.test(tel)) tel = '';
    if (nome.length < 2 && !tel) { ignorados++; return; }
    var c = (tel && porTel[tel]) || (!tel && porNome[norm_(nome)]) || null;
    if (!c) {
      c = { id: 'C' + base + '-' + n, nome: nome || 'Cliente ' + tel.slice(-4), tel: tel, nascimento: '', email: '', indicado_por: '', selos_iniciais: '0', origem: 'importado', criado_em: agora, criado_por: 'Importação', obs: '', ativo: 'SIM' };
      atuais.push(c); if (tel) porTel[tel] = c; porNome[norm_(c.nome)] = c; novos++;
    } else atualizados++;
    if (nome && (!c.nome || /^Cliente \d{4}$/.test(c.nome))) c.nome = nome;
    var nas = fidNasc_(i.nascimento); if (nas) c.nascimento = nas;
    if (i.email) c.email = String(i.email).trim().slice(0, 80);
    if (i.selos_iniciais != null && i.selos_iniciais !== '' && !isNaN(Number(i.selos_iniciais))) c.selos_iniciais = String(Math.max(0, Math.round(Number(i.selos_iniciais))));
    if (i.obs && !c.obs) c.obs = String(i.obs).slice(0, 200);
  });
  var linhas = atuais.map(function (c) { return linha_('Clientes', c, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  log_('Administração', 'importar clientes', novos + ' novas · ' + atualizados + ' atualizadas · ' + ignorados + ' ignoradas');
  return { ok: true, importados: { novos: novos, atualizados: atualizados, ignorados: ignorados } };
}
