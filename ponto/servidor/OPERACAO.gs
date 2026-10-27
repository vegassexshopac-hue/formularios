/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · OPERAÇÃO DA LOJA (Portal Equipe) — v19
   Fechamento de caixa (esperado × contado) + mínimo de estoque em lote.
   Arquivo SEPARADO — fica DEPOIS do Código.gs, PDV.gs, ROLETA.gs, ESTOQUE.gs e NUVEMSHOP.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: OPERACAO
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   A aba Caixa é criada sozinha. Config › caixa guarda o fundo de troco por loja e a tolerância.
   ═══════════════════════════════════════════════════════════════ */

ABAS.Caixa = ['id', 'data', 'loja', 'criado_em', 'por', 'colaboradora_id', 'fundo', 'esperado', 'contado', 'diferenca',
              'sangrias', 'vendas', 'qtd_vendas', 'status', 'obs', 'conferido_por', 'conferido_em', 'obs_adm'];

var OPX_PADRAO = { tolerancia: 5, fundo: {} };          // fundo: { bosque: 100, centro: 100 }
var OPX_FORMAS = ['pix', 'dinheiro', 'debito', 'credito'];
CONFIG_PADRAO.push(['caixa', JSON.stringify(OPX_PADRAO), 'Fechamento de caixa (JSON): tolerancia em R$ e fundo de troco por loja']);

function opxCfg_() {
  var c = cfgJson_('caixa', {}) || {}, o = { tolerancia: OPX_PADRAO.tolerancia, fundo: {} };
  if (c.tolerancia != null && !isNaN(Number(c.tolerancia))) o.tolerancia = Math.max(0, Number(c.tolerancia));
  if (c.fundo && typeof c.fundo === 'object') for (var k in c.fundo) o.fundo[k] = Number(c.fundo[k]) || 0;
  return o;
}
function opxR2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function opxNum_(v) { var n = Number(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.')); if (isNaN(n)) n = Number(v); return isNaN(n) ? 0 : opxR2_(n); }
function opxJson_(s, p) { try { var v = JSON.parse(s || ''); return v == null ? p : v; } catch (e) { return p; } }

/* ───────── o que o PDV diz que entrou no dia ───────── */
function opxVendasDia_(data, loja) {
  var t = { pix: 0, dinheiro: 0, debito: 0, credito: 0, misto: 0, total: 0, qtd: 0, mistos: [] };
  ler_('VendasPDV').forEach(function (v) {
    if (v.data !== data || v.loja !== loja || v.status === 'cancelada') return;
    var tot = opxR2_(v.total), f = v.pagamento;
    if (t[f] == null) f = 'misto';
    t[f] = opxR2_(t[f] + tot); t.total = opxR2_(t.total + tot); t.qtd++;
    if (f === 'misto') t.mistos.push({ numero: v.numero, total: tot, obs: v.obs || '' });
  });
  return t;
}
/* sangrias do dia (a aba é do Código.gs; tenta os nomes conhecidos) */
function opxSangriasDia_(data, loja) {
  var nomes = ['Sangrias', 'Sangria', 'Caixa_Sangrias'], lista = null;
  for (var i = 0; i < nomes.length && !lista; i++) { try { lista = ler_(nomes[i]); } catch (e) { lista = null; } }
  if (!lista) return { total: 0, qtd: 0, lidas: false };
  var t = 0, q = 0;
  lista.forEach(function (s) {
    var d = String(s.data || s.quando || s.criada_em || '').slice(0, 10);
    if (d === data && s.loja === loja) { t = opxR2_(t + opxNum_(s.valor)); q++; }
  });
  return { total: t, qtd: q, lidas: true };
}
function opxEsperado_(data, loja) {
  var cfg = opxCfg_(), v = opxVendasDia_(data, loja), s = opxSangriasDia_(data, loja);
  var fundo = Number(cfg.fundo[loja]) || 0;
  return { data: data, loja: loja, fundo: fundo, vendas: v, sangrias: s,
           esperado: { pix: v.pix, dinheiro: opxR2_(fundo + v.dinheiro - s.total), debito: v.debito, credito: v.credito } };
}
function opxFech_(r) {
  var o = limpar_(r);
  ['fundo', 'esperado', 'contado', 'diferenca', 'vendas'].forEach(function (k) { o[k] = opxJson_(r[k], k === 'fundo' ? 0 : {}); });
  o.fundo = Number(o.fundo) || 0; o.sangrias = Number(o.sangrias) || 0; o.qtd_vendas = Number(o.qtd_vendas) || 0;
  return o;
}
function opxLista_(desde) { return ler_('Caixa').filter(function (r) { return r.data >= desde; }).map(opxFech_).reverse(); }

/* ───────── fechar o caixa (colaboradora ou administração) ───────── */
function opxFechar_(req, por, eid, admin) {
  return comTrava_(function () {
    var lojas = JSON.parse(cfg_('lojas'));
    var loja = lojas[req.loja] ? req.loja : null;
    if (!loja) throw new Error('Escolha a loja');
    var data = admin && /^\d{4}-\d{2}-\d{2}$/.test(req.data || '') ? req.data : hoje_();
    if (data > hoje_()) throw new Error('Não dá para fechar caixa de dia futuro');
    var cont = {}, tudoVazio = true;
    OPX_FORMAS.forEach(function (f) { var x = req.contado && req.contado[f]; cont[f] = x === '' || x == null ? 0 : opxNum_(x); if (x !== '' && x != null) tudoVazio = false; });
    if (tudoVazio) throw new Error('Digite o que foi contado');
    var e = opxEsperado_(data, loja);
    if (req.fundo !== '' && req.fundo != null && !isNaN(Number(opxNum_(req.fundo)))) { e.fundo = opxNum_(req.fundo); e.esperado.dinheiro = opxR2_(e.fundo + e.vendas.dinheiro - e.sangrias.total); }
    var dif = {}, maior = 0, tol = opxCfg_().tolerancia;
    OPX_FORMAS.forEach(function (f) { dif[f] = opxR2_(cont[f] - e.esperado[f]); maior = Math.max(maior, Math.abs(dif[f])); });
    var ja = ler_('Caixa').filter(function (r) { return r.data === data && r.loja === loja; })[0];
    if (ja && ja.status === 'conferido' && !admin) throw new Error('Este caixa já foi conferido pela administração. Fale com ela para reabrir.');
    var r = ja || { id: 'CX' + new Date().getTime() + Math.floor(Math.random() * 1e3), data: data, loja: loja, conferido_por: '', conferido_em: '', obs_adm: '' };
    r.criado_em = agora_(); r.por = por; r.colaboradora_id = eid || ''; r.fundo = String(e.fundo);
    r.esperado = JSON.stringify(e.esperado); r.contado = JSON.stringify(cont); r.diferenca = JSON.stringify(dif);
    r.sangrias = String(e.sangrias.total); r.vendas = JSON.stringify({ pix: e.vendas.pix, dinheiro: e.vendas.dinheiro, debito: e.vendas.debito, credito: e.vendas.credito, misto: e.vendas.misto, total: e.vendas.total, mistos: e.vendas.mistos.slice(0, 20) });
    r.qtd_vendas = String(e.vendas.qtd); r.status = maior > tol + 0.001 ? 'diferenca' : 'ok'; r.obs = String(req.obs || '').slice(0, 300);
    if (ja && ja.status === 'conferido') { r.status = 'diferenca'; r.conferido_por = ''; r.conferido_em = ''; }
    gravar_('Caixa', r);
    log_(por, 'caixa fechado', data + ' ' + loja + ' · ' + r.status + ' · maior diferença R$ ' + maior);
    var f = opxFech_(r); f.tolerancia = tol; f.sangriasLidas = e.sangrias.lidas; f.maior = maior;
    return f;
  });
}
function opxConferir_(req) {
  return comTrava_(function () {
    var r = ler_('Caixa').filter(function (x) { return x.id === req.id; })[0];
    if (!r) throw new Error('Fechamento não encontrado');
    if (req.reabrir) { r.status = 'diferenca'; r.conferido_por = ''; r.conferido_em = ''; }
    else { r.status = 'conferido'; r.conferido_por = String(req.quem || 'Administração').slice(0, 60); r.conferido_em = agora_(); }
    if (req.obs_adm != null) r.obs_adm = String(req.obs_adm).slice(0, 300);
    gravar_('Caixa', r);
    log_('Administração', req.reabrir ? 'caixa reaberto' : 'caixa conferido', r.data + ' ' + r.loja);
    return opxFech_(r);
  });
}
function opxSalvarCfg_(req) {
  var c = opxCfg_();
  if (req.tolerancia != null) c.tolerancia = Math.max(0, opxNum_(req.tolerancia));
  if (req.fundo && typeof req.fundo === 'object') for (var k in req.fundo) c.fundo[k] = opxNum_(req.fundo[k]);
  setCfg_('caixa', JSON.stringify(c));
  return c;
}

/* ───────── mínimo de estoque em lote (só grava a coluna minimo; não movimenta) ───────── */
function opxMinimoLote_(lista) {
  if (!Array.isArray(lista) || !lista.length) return { gravados: 0 };
  return comTrava_(function () {
    var sh = aba_('Estoque'), cab = cabecalho_('Estoque', sh), atuais = ler_('Estoque'), porChave = {};
    atuais.forEach(function (r) { porChave[r.chave] = r; });
    var n = 0, agora = agora_();
    lista.slice(0, 3000).forEach(function (m) {
      if (!m || !m.produto_id || !m.loja) return;
      var chave = m.produto_id + '|' + m.loja, r = porChave[chave];
      if (!r) { r = { chave: chave, produto_id: m.produto_id, loja: m.loja, qtd: '0', minimo: '' }; atuais.push(r); porChave[chave] = r; }
      var mn = m.minimo === '' || m.minimo == null ? '' : String(Math.max(0, Math.round(Number(m.minimo) || 0)));
      if (String(r.minimo || '') === mn) return;
      r.minimo = mn; r.atualizado_em = agora; r.por = 'Administração (mínimo)'; n++;
    });
    if (n) {
      var linhas = atuais.map(function (r) { return linha_('Estoque', r, cab); });
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
      if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
      log_('Administração', 'mínimo em lote', n + ' produto(s)');
    }
    return { gravados: n };
  });
}

/* ───────── pacote que vai junto com os dados ───────── */
function opxPacote_(admin, eid) {
  var cfg = opxCfg_();
  var lista = opxLista_(diaMais_(admin ? -62 : -14));
  if (!admin) lista = lista.map(function (f) { return { id: f.id, data: f.data, loja: f.loja, criado_em: f.criado_em, por: f.por, colaboradora_id: f.colaboradora_id, status: f.status, diferenca: f.colaboradora_id === eid ? f.diferenca : undefined, contado: f.colaboradora_id === eid ? f.contado : undefined, obs: f.obs }; });
  return { cfg: cfg, formas: OPX_FORMAS, fechamentos: lista };
}
var _opxDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _opxDadosColab(c);
  try { d.operacao = opxPacote_(false, c.id); } catch (e) { d.operacao = { erro: String(e && e.message || e) }; }
  return d;
};
var _opxAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _opxAdmDados(req);
  try { d.operacao = opxPacote_(true); } catch (e) { d.operacao = { erro: String(e && e.message || e) }; }
  return d;
};

var _opxRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'caixa') {
    try {
      var c = checarColab_(req);
      if (req.op === 'fechar') { var f = opxFechar_(req, c.nome, c.id, false); var d = dadosColab_(c); d.caixaFeito = f; return d; }
      if (req.op === 'esperado') { var e = opxEsperado_(hoje_(), req.loja); return { ok: true, qtd: e.vendas.qtd, sangrias: e.sangrias.qtd, fundo: e.fundo }; }   // sem valores: contagem às cegas
      return { ok: false, erro: 'Operação desconhecida' };
    } catch (e2) { return { ok: false, erro: String(e2 && e2.message || e2) }; }
  }
  return _opxRodar(req);
};
ADMIN.admOperacao = function (req) {
  var r = {};
  if (req.op === 'caixaFechar') r.caixaFeito = opxFechar_(req, 'Administração', '', true);
  else if (req.op === 'caixaConferir') r.caixaFeito = opxConferir_(req);
  else if (req.op === 'caixaEsperado') { r.esperado = opxEsperado_(/^\d{4}-\d{2}-\d{2}$/.test(req.data || '') ? req.data : hoje_(), req.loja); r.ok = true; return r; }
  else if (req.op === 'caixaCfg') r.cfg = opxSalvarCfg_(req);
  else if (req.op === 'minimoLote') r.minimo = opxMinimoLote_(req.lista);
  else throw new Error('Operação desconhecida');
  var d = ADMIN.admDados(req);
  for (var k in r) d[k] = r[k];
  return d;
};
