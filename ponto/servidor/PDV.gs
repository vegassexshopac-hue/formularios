/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PDV (Ponto de Venda) do Portal Equipe
   Arquivo SEPARADO do Código.gs — não precisa mexer no código antigo.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) No Apps Script: Arquivos › + › Script › nome: PDV  (fica DEPOIS do Código.gs)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   As abas Produtos e VendasPDV são criadas sozinhas na planilha.
   ═══════════════════════════════════════════════════════════════ */

ABAS.Produtos = ['id', 'codigo', 'sku', 'nome', 'categoria', 'preco', 'preco_promo', 'ativo', 'origem', 'atualizado_em'];
ABAS.VendasPDV = ['id', 'numero', 'criada_em', 'data', 'hora', 'loja', 'colaboradora_id', 'colaboradora', 'itens', 'qtd_itens',
                  'subtotal', 'desconto', 'total', 'pagamento', 'parcelas', 'recebido', 'troco', 'cliente', 'cliente_tel', 'obs',
                  'status', 'cancelada_em', 'cancelada_por', 'motivo_cancel'];

var PDV_FORMAS = ['pix', 'dinheiro', 'debito', 'credito', 'misto'];
var PDV_PADRAO = { desconto_max: 15, cancelar_min: 15 };
CONFIG_PADRAO.push(['pdv', JSON.stringify(PDV_PADRAO), 'Regras do PDV (JSON): desconto_max em % e minutos para a vendedora desfazer a própria venda']);

function pdvCfg_() { var c = cfgJson_('pdv', {}); var o = {}; for (var k in PDV_PADRAO) o[k] = (c && c[k] != null) ? Number(c[k]) : PDV_PADRAO[k]; return o; }
function r2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }

/* ───────── leitura ───────── */
function pdvProdutos_(admin) {
  return ler_('Produtos').filter(function (p) { return admin || p.ativo !== 'NÃO'; }).map(function (p) {
    return { id: p.id, codigo: p.codigo, sku: p.sku, nome: p.nome, categoria: p.categoria,
             preco: Number(p.preco) || 0, promo: Number(p.preco_promo) || 0, ativo: p.ativo !== 'NÃO' };
  });
}
function pdvVenda_(v, admin) {
  var o = limpar_(v), itens = [];
  try { itens = JSON.parse(v.itens || '[]'); } catch (e) {}
  o.itens = itens;
  ['qtd_itens', 'subtotal', 'desconto', 'total', 'parcelas', 'recebido', 'troco', 'numero'].forEach(function (k) { o[k] = Number(o[k]) || 0; });
  if (!admin) delete o.cliente_tel;
  return o;
}
function pdvVendas_(desde, admin) {
  return ler_('VendasPDV').filter(function (v) { return v.data >= desde; }).map(function (v) { return pdvVenda_(v, admin); });
}
function pdvPacote_(admin) {
  var hoje = hoje_();
  return { cfg: pdvCfg_(), formas: PDV_FORMAS, produtos: pdvProdutos_(admin),
           vendas: pdvVendas_(admin ? diaMais_(-62) : mesDe_(hoje) + '-01', admin) };
}

/* ───────── junta o PDV nos pacotes que o app já recebe ───────── */
var _pdvDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _pdvDadosColab(c);
  try { d.pdv = pdvPacote_(false); } catch (e) { d.pdv = { erro: String(e && e.message || e) }; }
  return d;
};
var _pdvAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _pdvAdmDados(req);
  try { d.pdv = pdvPacote_(true); } catch (e) { d.pdv = { erro: String(e && e.message || e) }; }
  return d;
};
var _pdvAoVivo = ADMIN.admAoVivo;
ADMIN.admAoVivo = function (req) {
  var d = _pdvAoVivo(req);
  try { d.pdvHoje = pdvVendas_(hoje_(), true).filter(function (v) { return v.data === hoje_(); }); } catch (e) {}
  return d;
};

/* ───────── a venda (passa pela ação "venda", que já é liberada para a equipe) ───────── */
var _pdvVendaManual = COLAB.venda;
COLAB.venda = function (c, req) {
  if (req.pdv && req.cancelar) return pdvDesfazer_(c, req);
  if (req.pdv) return pdvVender_(c, req);
  // Lançamento manual do total do dia: não pode ficar menor do que o que já passou no PDV
  var data = /^\d{4}-\d{2}-\d{2}$/.test(req.data || '') ? req.data : hoje_();
  var lojas = JSON.parse(cfg_('lojas'));
  var loja = lojas[req.loja] ? req.loja : (pontoDe_(c.id, data) || {}).loja || c.loja;
  var noPdv = pdvSomaDia_(data, loja, c.id);
  if (noPdv > 0 && valor_(req.valor) < noPdv - 0.009) throw new Error('As vendas do PDV de hoje já somam R$ ' + noPdv.toFixed(2).replace('.', ',') + '. O total do dia não pode ser menor.');
  return _pdvVendaManual(c, req);
};

function pdvSomaDia_(data, loja, eid) {
  return r2_(ler_('VendasPDV').filter(function (v) { return v.data === data && v.loja === loja && v.colaboradora_id === eid && v.status !== 'cancelada'; })
    .reduce(function (s, v) { return s + (Number(v.total) || 0); }, 0));
}

/** Soma (ou tira) da linha do dia em "Vendas" — é ela que alimenta metas, ranking e a tela inicial. */
function pdvAgregar_(data, loja, colab, delta, por) {
  var chave = data + '|' + loja + '|' + colab.id;
  var v = ler_('Vendas').filter(function (x) { return x.chave === chave; })[0] ||
          { chave: chave, data: data, loja: loja, colaboradora_id: colab.id, colaboradora: colab.nome, valor: '0', origem: 'pdv' };
  v.valor = String(Math.max(0, r2_((Number(v.valor) || 0) + delta)));
  v.origem = 'pdv'; v.obs = 'PDV'; v.lancado_em = agora_(); v.lancado_por = por;
  gravar_('Vendas', v);
}

function pdvVender_(c, req) {
  var cfg = pdvCfg_();
  var uid = String(req.uid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (uid) {                                   // reenvio da mesma venda (internet caiu) não duplica
    var ja = ler_('VendasPDV').filter(function (v) { return v.id === uid; })[0];
    if (ja) { var d0 = dadosColab_(c); d0.pdvVenda = pdvVenda_(ja, false); d0.pdvRepetida = true; return d0; }
  }
  var lojas = JSON.parse(cfg_('lojas'));
  var data = hoje_();
  var loja = lojas[req.loja] ? req.loja : (pontoDe_(c.id, data) || {}).loja || c.loja;
  var cat = {}; pdvProdutos_(true).forEach(function (p) { cat[p.id] = p; });
  var lista = Array.isArray(req.itens) ? req.itens.slice(0, 80) : [];
  var itens = lista.map(function (i) {
    var q = Math.max(1, Math.min(999, Math.round(Number(i.qtd) || 1)));
    var p = cat[i.id];
    if (p) return { id: p.id, codigo: p.codigo || p.sku || '', nome: p.nome, cat: p.categoria || '', preco: r2_(p.promo > 0 ? p.promo : p.preco), qtd: q };
    var preco = valor_(i.preco);
    if (preco <= 0) throw new Error('Item avulso sem valor');
    return { id: '', codigo: '', nome: String(i.nome || 'Item avulso').slice(0, 80), cat: 'Avulso', preco: preco, qtd: q, avulso: true };
  });
  if (!itens.length) throw new Error('Carrinho vazio');
  var subtotal = r2_(itens.reduce(function (s, i) { return s + i.preco * i.qtd; }, 0));
  var desconto = req.desconto ? valor_(req.desconto) : 0;
  if (desconto > subtotal) throw new Error('Desconto maior que a venda');
  if (desconto > subtotal * cfg.desconto_max / 100 + 0.01) throw new Error('Desconto acima de ' + cfg.desconto_max + '% precisa da administração.');
  var total = r2_(subtotal - desconto);
  var forma = PDV_FORMAS.indexOf(req.pagamento) >= 0 ? req.pagamento : '';
  if (!forma) throw new Error('Escolha a forma de pagamento');
  var recebido = forma === 'dinheiro' && req.recebido ? valor_(req.recebido) : 0;
  if (forma === 'dinheiro' && recebido && recebido < total - 0.009) throw new Error('Valor recebido menor que o total');
  var mes = mesDe_(data);
  var numero = ler_('VendasPDV').filter(function (v) { return mesDe_(v.data) === mes; }).length + 1;
  var v = { id: uid || ('V' + new Date().getTime() + Math.floor(Math.random() * 1e3)), numero: String(numero), criada_em: agora_(),
            data: data, hora: hora_(), loja: loja, colaboradora_id: c.id, colaboradora: c.nome, itens: JSON.stringify(itens),
            qtd_itens: String(itens.reduce(function (s, i) { return s + i.qtd; }, 0)), subtotal: String(subtotal), desconto: String(r2_(desconto)),
            total: String(total), pagamento: forma, parcelas: String(forma === 'credito' ? Math.max(1, Math.min(12, Number(req.parcelas) || 1)) : 1),
            recebido: String(recebido), troco: String(recebido ? r2_(recebido - total) : 0),
            cliente: String(req.cliente || '').slice(0, 80), cliente_tel: String(req.cliente_tel || '').replace(/\D/g, '').slice(0, 13),
            obs: String(req.obs || '').slice(0, 200), status: 'ok', cancelada_em: '', cancelada_por: '', motivo_cancel: '' };
  gravar_('VendasPDV', v);
  pdvAgregar_(data, loja, c, total, c.nome + ' (PDV)');
  log_(c.nome, 'pdv venda', '#' + numero + ' ' + loja + ' R$ ' + total + ' · ' + forma);
  var d = dadosColab_(c);
  d.pdvVenda = pdvVenda_(v, false);
  return d;
}

/** A vendedora desfaz a PRÓPRIA venda, no mesmo dia, até X minutos depois (errou o item, cliente desistiu). */
function pdvDesfazer_(c, req) {
  var v = ler_('VendasPDV').filter(function (x) { return x.id === req.id; })[0];
  if (!v || v.colaboradora_id !== c.id) throw new Error('Venda não encontrada');
  if (v.status === 'cancelada') throw new Error('Essa venda já foi desfeita');
  var lim = pdvCfg_().cancelar_min;
  var feita = new Date(String(v.criada_em).replace(' ', 'T') + '-05:00').getTime();
  if (v.data !== hoje_() || (new Date().getTime() - feita) > lim * 60000) throw new Error('Passou de ' + lim + ' minutos: peça para a administração cancelar.');
  pdvCancelarLinha_(v, c.nome, String(req.motivo || '').slice(0, 200) || 'Desfeita pela vendedora');
  return dadosColab_(c);
}

function pdvCancelarLinha_(v, por, motivo) {
  v.status = 'cancelada'; v.cancelada_em = agora_(); v.cancelada_por = por; v.motivo_cancel = motivo;
  gravar_('VendasPDV', v);
  pdvAgregar_(v.data, v.loja, { id: v.colaboradora_id, nome: v.colaboradora }, -(Number(v.total) || 0), por + ' (cancelou PDV #' + v.numero + ')');
  log_(por, 'pdv cancelar', '#' + v.numero + ' R$ ' + v.total + ' · ' + motivo);
}

/* ───────── administração ───────── */
ADMIN.admPdvCancelar = function (req) {
  var v = ler_('VendasPDV').filter(function (x) { return x.id === req.id; })[0];
  if (!v) throw new Error('Venda não encontrada');
  if (v.status === 'cancelada') throw new Error('Essa venda já está cancelada');
  if (!String(req.motivo || '').trim()) throw new Error('Conte o motivo do cancelamento');
  pdvCancelarLinha_(v, 'Administração', String(req.motivo).slice(0, 200));
  return ADMIN.admDados();
};

/** Cria ou edita um produto. */
ADMIN.admProduto = function (req) {
  var p = req.produto || {};
  if (!String(p.nome || '').trim()) throw new Error('Informe o nome do produto');
  var preco = valor_(p.preco);
  var r = p.id ? ler_('Produtos').filter(function (x) { return x.id === p.id; })[0] : null;
  r = r || { id: 'P' + new Date().getTime() + Math.floor(Math.random() * 1e3), origem: 'manual' };
  r.codigo = String(p.codigo || '').trim().slice(0, 40); r.sku = String(p.sku || '').trim().slice(0, 40);
  r.nome = String(p.nome).trim().slice(0, 120); r.categoria = String(p.categoria || '').trim().slice(0, 60);
  r.preco = String(preco); r.preco_promo = p.promo ? String(valor_(p.promo)) : '';
  r.ativo = p.ativo === false || p.ativo === 'NÃO' ? 'NÃO' : 'SIM'; r.atualizado_em = agora_();
  gravar_('Produtos', r);
  log_('Administração', 'produto', r.nome + ' R$ ' + r.preco);
  return ADMIN.admDados();
};

/** Importa uma lista (planilha da Nuvemshop, Gestão Fácil ou qualquer CSV). Atualiza quem já existe e cria os novos — de uma vez só. */
ADMIN.admProdutos = function (req) {
  var lista = Array.isArray(req.lista) ? req.lista : [];
  if (!lista.length) throw new Error('Lista vazia');
  if (lista.length > 5000) throw new Error('Lista grande demais (máx. 5.000)');
  var sh = aba_('Produtos'), cab = cabecalho_('Produtos', sh);
  var atuais = ler_('Produtos'), porChave = {};
  var chaveDe = function (o) { return o.codigo ? 'c:' + o.codigo : o.sku ? 's:' + o.sku : 'n:' + norm_(o.nome); };
  atuais.forEach(function (p) { porChave[chaveDe(p)] = p; if (p.sku) porChave['s:' + p.sku] = porChave['s:' + p.sku] || p; porChave['n:' + norm_(p.nome)] = porChave['n:' + norm_(p.nome)] || p; });
  var novos = 0, alterados = 0, agora = agora_(), base = new Date().getTime();
  lista.forEach(function (i, n) {
    var o = { codigo: String(i.codigo || '').trim().slice(0, 40), sku: String(i.sku || '').trim().slice(0, 40), nome: String(i.nome || '').trim().slice(0, 120) };
    if (!o.nome) return;
    var preco; try { preco = valor_(i.preco); } catch (e) { return; }
    var p = porChave[chaveDe(o)] || (o.sku && porChave['s:' + o.sku]) || porChave['n:' + norm_(o.nome)];
    if (!p) { p = { id: 'P' + base + '-' + n, origem: String(req.origem || 'importado').slice(0, 30), ativo: 'SIM' }; atuais.push(p); porChave[chaveDe(o)] = p; novos++; }
    else alterados++;
    p.codigo = o.codigo || p.codigo || ''; p.sku = o.sku || p.sku || ''; p.nome = o.nome;
    p.categoria = String(i.categoria || p.categoria || '').trim().slice(0, 60);
    p.preco = String(preco); p.preco_promo = i.promo ? String(valor_(i.promo)) : '';
    if (i.ativo === false) p.ativo = 'NÃO'; else if (i.ativo === true) p.ativo = 'SIM';
    p.atualizado_em = agora;
  });
  var linhas = atuais.map(function (p) { return linha_('Produtos', p, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  log_('Administração', 'importar produtos', novos + ' novos · ' + alterados + ' atualizados');
  var d = ADMIN.admDados();
  d.importados = { novos: novos, alterados: alterados };
  return d;
};

/** Configuração do PDV (desconto máximo etc.). */
var _pdvAdmConfig = ADMIN.admConfig;
ADMIN.admConfig = function (req) {
  if (req.chave === 'pdv') {
    var v; try { v = JSON.parse(String(req.valor)); } catch (e) { throw new Error('Formato inválido'); }
    setCfg_('pdv', JSON.stringify(v));
    log_('Administração', 'config', 'pdv = ' + req.valor);
    return ADMIN.admDados();
  }
  return _pdvAdmConfig(req);
};
