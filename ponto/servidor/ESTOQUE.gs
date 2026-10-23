/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · ESTOQUE + ENTRADA DE MERCADORIA (Portal Equipe)
   Arquivo SEPARADO — fica DEPOIS do Código.gs, do PDV.gs e do ROLETA.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: ESTOQUE
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
      (o Google vai pedir uma permissão nova: "conectar a serviço externo" — é a IA que lê a nota)
   As abas Estoque, MovEstoque, Entradas e VinculosEstoque são criadas sozinhas.
   A chave da IA fica guardada nas Propriedades do Script (nunca na planilha).
   ═══════════════════════════════════════════════════════════════ */

ABAS.Estoque = ['chave', 'produto_id', 'loja', 'qtd', 'minimo', 'atualizado_em', 'por'];
ABAS.MovEstoque = ['id', 'quando', 'data', 'loja', 'produto_id', 'produto', 'tipo', 'qtd', 'saldo', 'ref', 'por', 'obs'];
ABAS.Entradas = ['id', 'criada_em', 'loja', 'fornecedor', 'cnpj', 'numero', 'chave_nfe', 'emissao', 'valor_total', 'qtd_total',
                 'itens', 'origem', 'status', 'por', 'divergencias', 'novos', 'obs', 'cancelada_em', 'cancelada_por'];
ABAS.VinculosEstoque = ['chave', 'cnpj', 'cod_fornecedor', 'ean', 'produto_id', 'descricao', 'atualizado_em'];

var EST_PADRAO = { baixa_pdv: false, ia_provedor: 'anthropic', ia_modelo: '' };
var EST_MODELOS = { anthropic: 'claude-sonnet-5-5', gemini: 'gemini-2.5-flash' };
var EST_TIPOS = { entrada: 'Entrada (nota)', saldo_inicial: 'Saldo inicial', ajuste: 'Ajuste', venda: 'Venda PDV', venda_cancelada: 'Venda cancelada', entrada_cancelada: 'Entrada cancelada' };
CONFIG_PADRAO.push(['estoque', JSON.stringify(EST_PADRAO), 'Estoque (JSON): baixa_pdv = dá baixa ao vender no PDV · ia_provedor = anthropic | gemini · ia_modelo (opcional)']);

function estCfg_() {
  var c = cfgJson_('estoque', {}) || {}, o = {};
  for (var k in EST_PADRAO) o[k] = c[k] != null ? c[k] : EST_PADRAO[k];
  o.baixa_pdv = o.baixa_pdv === true || o.baixa_pdv === 'true';
  if (!EST_MODELOS[o.ia_provedor]) o.ia_provedor = 'anthropic';
  return o;
}
function estChaveIA_() { try { return PropertiesService.getScriptProperties().getProperty('IA_CHAVE') || ''; } catch (e) { return ''; } }
function estLojas_() { return JSON.parse(cfg_('lojas')); }
function estNum_(v) { var n = Number(String(v == null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : Math.round(n * 1000) / 1000; }

/* ───────── leitura ───────── */
function estSaldos_() {
  return ler_('Estoque').map(function (r) { return { produto_id: r.produto_id, loja: r.loja, qtd: estNum_(r.qtd), minimo: estNum_(r.minimo) }; });
}
function estEntrada_(e) {
  var o = limpar_(e); try { o.itens = JSON.parse(e.itens || '[]'); } catch (x) { o.itens = []; }
  try { o.divergencias = JSON.parse(e.divergencias || '[]'); } catch (x) { o.divergencias = []; }
  o.valor_total = Number(o.valor_total) || 0; o.qtd_total = Number(o.qtd_total) || 0; o.novos = Number(o.novos) || 0;
  return o;
}
function estPacote_(admin) {
  var desde = diaMais_(admin ? -120 : -45);
  var p = { cfg: estCfg_(), iaPronta: !!estChaveIA_(), saldos: estSaldos_(), tipos: EST_TIPOS,
            entradas: ler_('Entradas').filter(function (e) { return String(e.criada_em).slice(0, 10) >= desde; }).map(estEntrada_).reverse().slice(0, 80),
            vinculos: ler_('VinculosEstoque').map(function (v) { return { chave: v.chave, ean: v.ean, produto_id: v.produto_id }; }) };
  if (admin) p.movimentos = ler_('MovEstoque').slice(-400).map(limpar_).reverse();
  return p;
}

/* ───────── junta o estoque nos pacotes que o app já recebe ───────── */
var _estDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _estDadosColab(c);
  try { d.estoque = estPacote_(false); } catch (e) { d.estoque = { erro: String(e && e.message || e) }; }
  return d;
};
var _estAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _estAdmDados(req);
  try { d.estoque = estPacote_(true); } catch (e) { d.estoque = { erro: String(e && e.message || e) }; }
  return d;
};

/* ───────── movimentar (tudo de uma vez, com trava para duas lojas ao mesmo tempo) ─────────
   lista: [{produto_id, produto, loja, delta}] ou [{..., definir: N}] (saldo inicial / ajuste)  */
function estMovimentar_(lista, tipo, ref, por, obs) {
  if (!lista.length) return [];
  var trava = LockService.getScriptLock(); trava.waitLock(20000);
  try {
    var sh = aba_('Estoque'), cab = cabecalho_('Estoque', sh), atuais = ler_('Estoque'), porChave = {};
    atuais.forEach(function (r) { porChave[r.chave] = r; });
    var agora = agora_(), hoje = hoje_(), base = new Date().getTime() + '' + Math.floor(Math.random() * 1e4), movs = [];
    lista.forEach(function (m, n) {
      var chave = m.produto_id + '|' + m.loja;
      var r = porChave[chave];
      if (!r) { r = { chave: chave, produto_id: m.produto_id, loja: m.loja, qtd: '0', minimo: '' }; atuais.push(r); porChave[chave] = r; }
      var antes = estNum_(r.qtd);
      var depois = m.definir != null ? estNum_(m.definir) : Math.round((antes + estNum_(m.delta)) * 1000) / 1000;
      if (m.minimo != null && m.minimo !== '') r.minimo = String(estNum_(m.minimo));
      r.qtd = String(depois); r.atualizado_em = agora; r.por = por;
      movs.push({ id: 'M' + base + '-' + n, quando: agora, data: hoje, loja: m.loja, produto_id: m.produto_id, produto: String(m.produto || '').slice(0, 120),
                  tipo: tipo, qtd: String(Math.round((depois - antes) * 1000) / 1000), saldo: String(depois), ref: ref || '', por: por, obs: String(m.obs || obs || '').slice(0, 200) });
    });
    var linhas = atuais.map(function (r) { return linha_('Estoque', r, cab); });
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
    if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
    var shM = aba_('MovEstoque'), cabM = cabecalho_('MovEstoque', shM);
    shM.getRange(shM.getLastRow() + 1, 1, movs.length, cabM.length).setNumberFormat('@').setValues(movs.map(function (m) { return linha_('MovEstoque', m, cabM); }));
    return movs;
  } finally { trava.releaseLock(); }
}

/* ───────── IA: lê a nota (foto ou PDF) e confere a foto dos produtos ───────── */
var EST_PROMPT_NOTA = 'Você lê notas fiscais brasileiras de COMPRA de mercadoria (DANFE de NF-e, cupom ou pedido do fornecedor) de um sex shop. ' +
  'Extraia TODOS os itens, na ordem, sem pular nenhum (a nota pode ter várias páginas). Não invente nada: se um campo não estiver legível, deixe vazio. ' +
  'Quantidade é a coluna QTD/QUANT (número, use ponto decimal). Valor unitário e total em número (ponto decimal). ' +
  'Responda SOMENTE com JSON, sem texto antes ou depois, neste formato: ' +
  '{"fornecedor":"","cnpj":"só números","numero":"nº da nota","emissao":"AAAA-MM-DD","chave":"44 dígitos ou vazio","destinatario_cnpj":"só números",' +
  '"valor_total":0,"itens":[{"cod":"código do produto no fornecedor","ean":"código de barras ou vazio","desc":"descrição","un":"UN","qtd":0,"vunit":0,"vtotal":0}],' +
  '"legibilidade":"boa|média|ruim","obs":"algo estranho ou ilegível"}';

function estPromptConferir_(itens) {
  return 'Estas fotos mostram mercadorias que acabaram de chegar a um sex shop. Abaixo está a lista da nota fiscal. ' +
    'Para cada item, conte quantas unidades você CONSEGUE VER nas fotos. Seja honesto: se as caixas estiverem fechadas, empilhadas ou não der para contar, use null e explique em "obs". ' +
    'Não conte o mesmo produto duas vezes se aparecer em fotos diferentes do mesmo ângulo. Liste também produtos que aparecem nas fotos e NÃO estão na nota. ' +
    'Responda SOMENTE com JSON: {"itens":[{"n":1,"visto":0,"obs":""}],"extras":[{"desc":"","qtd":0}],"resumo":"uma frase"}\n\nLista da nota:\n' +
    itens.map(function (i) { return (i.n) + ') ' + String(i.desc).slice(0, 120) + ' — qtd na nota: ' + i.qtd; }).join('\n');
}

function estIA_(arquivos, prompt) {
  var chave = estChaveIA_();
  if (!chave) throw new Error('A leitura por IA ainda não foi ligada. Administração › Estoque › Configurar: cole a chave da IA.');
  if (!arquivos || !arquivos.length) throw new Error('Envie a foto ou o PDF');
  if (arquivos.length > 8) throw new Error('No máximo 8 arquivos por vez');
  var cfg = estCfg_(), modelo = cfg.ia_modelo || EST_MODELOS[cfg.ia_provedor], resp, txt;
  arquivos.forEach(function (a) {
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(a.mime || '')) throw new Error('Formato não aceito: ' + a.mime);
    if (String(a.b64 || '').length > 14000000) throw new Error('Arquivo grande demais (máx. ~10 MB)');
  });
  if (cfg.ia_provedor === 'gemini') {
    var partes = arquivos.map(function (a) { return { inline_data: { mime_type: a.mime, data: a.b64 } }; });
    partes.push({ text: prompt });
    resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': chave },
      payload: JSON.stringify({ contents: [{ role: 'user', parts: partes }], generationConfig: { temperature: 0, response_mime_type: 'application/json' } }) });
    var jg = estJson_(resp.getContentText());
    if (resp.getResponseCode() >= 300) throw new Error('A IA recusou (' + resp.getResponseCode() + '): ' + ((jg && jg.error && jg.error.message) || 'erro'));
    txt = ((((jg.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || ''; }).join('');
  } else {
    var conteudo = arquivos.map(function (a) {
      return a.mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: a.mime, data: a.b64 } }
                                           : { type: 'image', source: { type: 'base64', media_type: a.mime, data: a.b64 } };
    });
    conteudo.push({ type: 'text', text: prompt });
    resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: modelo, max_tokens: 16000, temperature: 0, messages: [{ role: 'user', content: conteudo }] }) });
    var ja = estJson_(resp.getContentText());
    if (resp.getResponseCode() >= 300) throw new Error('A IA recusou (' + resp.getResponseCode() + '): ' + ((ja && ja.error && ja.error.message) || 'erro'));
    txt = (ja.content || []).map(function (p) { return p.text || ''; }).join('');
  }
  var out = estJson_(txt);
  if (!out) throw new Error('A IA não conseguiu ler. Tente uma foto mais nítida, de frente e com boa luz.');
  return out;
}
function estJson_(t) {
  t = String(t || '');
  try { return JSON.parse(t); } catch (e) {}
  var i = t.indexOf('{'), f = t.lastIndexOf('}');
  if (i >= 0 && f > i) { try { return JSON.parse(t.slice(i, f + 1)); } catch (e) {} }
  return null;
}
function estNotaLimpa_(n) {
  n = n || {};
  var itens = (Array.isArray(n.itens) ? n.itens : []).map(function (i) {
    return { cod: String(i.cod || '').trim().slice(0, 60), ean: String(i.ean || '').replace(/\D/g, '').slice(0, 14), desc: String(i.desc || '').trim().slice(0, 160),
             un: String(i.un || 'UN').trim().slice(0, 6).toUpperCase(), qtd: estNum_(i.qtd), vunit: estNum_(i.vunit), vtotal: estNum_(i.vtotal) };
  }).filter(function (i) { return i.desc || i.cod; });
  return { fornecedor: String(n.fornecedor || '').slice(0, 120), cnpj: String(n.cnpj || '').replace(/\D/g, '').slice(0, 14), numero: String(n.numero || '').replace(/[^\w.-]/g, '').slice(0, 20),
           emissao: /^\d{4}-\d{2}-\d{2}$/.test(n.emissao || '') ? n.emissao : '', chave: String(n.chave || '').replace(/\D/g, '').length === 44 ? String(n.chave).replace(/\D/g, '') : '',
           destinatario_cnpj: String(n.destinatario_cnpj || '').replace(/\D/g, ''), valor_total: estNum_(n.valor_total), itens: itens,
           legibilidade: String(n.legibilidade || ''), obs: String(n.obs || '').slice(0, 300) };
}

/* ───────── confirmar a entrada ───────── */
function estConfirmar_(req, por) {
  var e = req.entrada || {}, lojas = estLojas_();
  if (!lojas[e.loja]) throw new Error('Escolha a loja que recebeu');
  var itens = Array.isArray(e.itens) ? e.itens.slice(0, 400) : [];
  if (!itens.length) throw new Error('Nenhum item na entrada');
  var chaveNfe = String(e.chave_nfe || '').replace(/\D/g, '');
  var cnpj = String(e.cnpj || '').replace(/\D/g, ''), numero = String(e.numero || '').trim().slice(0, 20);
  var jaEntrou = ler_('Entradas').filter(function (x) {
    return x.status === 'confirmada' && ((chaveNfe && x.chave_nfe === chaveNfe) || (numero && cnpj && x.numero === numero && x.cnpj === cnpj));
  })[0];
  if (jaEntrou && !req.forcar) throw new Error('Essa nota já deu entrada em ' + String(jaEntrou.criada_em).slice(8, 10) + '/' + String(jaEntrou.criada_em).slice(5, 7) + ' (loja ' + ((lojas[jaEntrou.loja] || {}).nome || jaEntrou.loja) + ', por ' + jaEntrou.por + ').');

  // produtos novos (o que a nota trouxe e ainda não existe no catálogo)
  var cat = {}; ler_('Produtos').forEach(function (p) { cat[p.id] = p; });
  var novos = 0, agora = agora_(), base = new Date().getTime() + '' + Math.floor(Math.random() * 1e4);
  itens.forEach(function (i, n) {
    if (i.produto_id && cat[i.produto_id]) return;
    if (!i.criar) throw new Error('O item "' + String(i.desc || '').slice(0, 50) + '" não está ligado a nenhum produto');
    var nome = String(i.criar.nome || i.desc || '').trim().slice(0, 120);
    if (!nome) throw new Error('Produto novo sem nome');
    var preco = i.criar.preco ? valor_(i.criar.preco) : 0;
    var p = { id: 'P' + base + '-e' + n, codigo: String(i.criar.codigo || i.ean || '').replace(/\D/g, '').slice(0, 40), sku: String(i.criar.sku || '').slice(0, 40), nome: nome,
              categoria: String(i.criar.categoria || '').slice(0, 60), preco: String(preco), preco_promo: '', ativo: preco > 0 ? 'SIM' : 'NÃO', origem: 'entrada', atualizado_em: agora };
    gravar_('Produtos', p); cat[p.id] = p; i.produto_id = p.id; novos++;
  });

  var limpos = itens.map(function (i) {
    var p = cat[i.produto_id];
    return { cod: String(i.cod || '').slice(0, 60), ean: String(i.ean || '').replace(/\D/g, '').slice(0, 14), desc: String(i.desc || p.nome).slice(0, 160), un: String(i.un || 'UN').slice(0, 6),
             qtd_nota: estNum_(i.qtd_nota), qtd: estNum_(i.qtd != null ? i.qtd : i.qtd_nota), vunit: estNum_(i.vunit), produto_id: p.id, produto: p.nome,
             visto: i.visto == null || i.visto === '' ? null : estNum_(i.visto), novo: !!i.criar };
  });
  var divs = limpos.filter(function (i) { return i.qtd !== i.qtd_nota; }).map(function (i) { return { produto: i.produto, nota: i.qtd_nota, recebido: i.qtd }; });
  var id = 'E' + base;
  var ent = { id: id, criada_em: agora, loja: e.loja, fornecedor: String(e.fornecedor || '').slice(0, 120), cnpj: cnpj, numero: numero, chave_nfe: chaveNfe,
              emissao: /^\d{4}-\d{2}-\d{2}$/.test(e.emissao || '') ? e.emissao : '', valor_total: String(estNum_(e.valor_total) || limpos.reduce(function (s, i) { return s + i.vunit * i.qtd_nota; }, 0)),
              qtd_total: String(limpos.reduce(function (s, i) { return s + i.qtd; }, 0)), itens: JSON.stringify(limpos), origem: String(e.origem || 'manual').slice(0, 20),
              status: 'confirmada', por: por, divergencias: JSON.stringify(divs), novos: String(novos), obs: String(e.obs || '').slice(0, 300), cancelada_em: '', cancelada_por: '' };
  gravar_('Entradas', ent);

  // soma no estoque da loja (juntando linhas repetidas do mesmo produto)
  var soma = {};
  limpos.forEach(function (i) { if (i.qtd > 0) { soma[i.produto_id] = soma[i.produto_id] || { produto_id: i.produto_id, produto: i.produto, loja: e.loja, delta: 0 }; soma[i.produto_id].delta += i.qtd; } });
  var ref = 'NF ' + (numero || 's/n') + (ent.fornecedor ? ' · ' + ent.fornecedor : '');
  estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'entrada', ref, por);

  // aprende: da próxima vez, o mesmo código desse fornecedor já vem ligado ao produto certo
  if (cnpj) {
    var vs = ler_('VinculosEstoque'), porV = {};
    vs.forEach(function (v) { porV[v.chave] = v; });
    limpos.forEach(function (i) {
      if (!i.cod) return;
      var ch = cnpj + '|' + i.cod, v = porV[ch] || { chave: ch, cnpj: cnpj, cod_fornecedor: i.cod };
      if (v.produto_id === i.produto_id && v.ean === i.ean) return;
      v.ean = i.ean; v.produto_id = i.produto_id; v.descricao = i.desc; v.atualizado_em = agora;
      gravar_('VinculosEstoque', v); porV[ch] = v;
    });
  }
  // código de barras da nota completa o cadastro quando o produto ainda não tem
  limpos.forEach(function (i) {
    var p = cat[i.produto_id];
    if (i.ean && p && !p.codigo && /^\d{8,14}$/.test(i.ean)) { p.codigo = i.ean; p.atualizado_em = agora; gravar_('Produtos', p); }
  });
  log_(por, 'entrada estoque', ref + ' · ' + e.loja + ' · ' + ent.qtd_total + ' peças' + (divs.length ? ' · ' + divs.length + ' divergência(s)' : ''));
  return estEntrada_(ent);
}

function estCancelarEntrada_(id, motivo, por) {
  var e = ler_('Entradas').filter(function (x) { return x.id === id; })[0];
  if (!e) throw new Error('Entrada não encontrada');
  if (e.status !== 'confirmada') throw new Error('Essa entrada já foi cancelada');
  if (!String(motivo || '').trim()) throw new Error('Conte o motivo');
  var itens = []; try { itens = JSON.parse(e.itens || '[]'); } catch (x) {}
  var soma = {};
  itens.forEach(function (i) { if (i.qtd > 0) { soma[i.produto_id] = soma[i.produto_id] || { produto_id: i.produto_id, produto: i.produto, loja: e.loja, delta: 0 }; soma[i.produto_id].delta -= i.qtd; } });
  e.status = 'cancelada'; e.cancelada_em = agora_(); e.cancelada_por = por; e.obs = (e.obs ? e.obs + ' · ' : '') + 'Cancelada: ' + String(motivo).slice(0, 200);
  gravar_('Entradas', e);
  estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'entrada_cancelada', 'NF ' + (e.numero || 's/n'), por, String(motivo).slice(0, 200));
  log_(por, 'entrada estoque cancelada', 'NF ' + e.numero + ' · ' + motivo);
}

/* Saldo inicial / contagem: define o número exato de cada produto na loja (vem do PDV antigo ou de uma contagem). */
function estDefinir_(req, por, tipo) {
  var lojas = estLojas_(), cat = {};
  ler_('Produtos').forEach(function (p) { cat[p.id] = p; });
  var lista = (Array.isArray(req.lista) ? req.lista : []).slice(0, 6000).map(function (i) {
    if (!lojas[i.loja]) throw new Error('Loja inválida: ' + i.loja);
    var p = cat[i.produto_id]; if (!p) throw new Error('Produto não encontrado');
    var q = estNum_(i.qtd); if (q < 0) throw new Error('Quantidade negativa em ' + p.nome);
    return { produto_id: p.id, produto: p.nome, loja: i.loja, definir: q, minimo: i.minimo, obs: i.obs };
  });
  if (!lista.length) throw new Error('Lista vazia');
  estMovimentar_(lista, tipo, String(req.ref || '').slice(0, 60), por, String(req.obs || '').slice(0, 200));
  log_(por, tipo === 'ajuste' ? 'ajuste estoque' : 'saldo inicial estoque', lista.length + ' produto(s)' + (req.obs ? ' · ' + req.obs : ''));
}

/* ───────── ações ─────────
   Equipe: {a:'estoque', eid, pin…, op:'ler'|'conferir'|'confirmar'}  ·  Administração: {a:'admEstoque', adminPin…, op:…} */
function estOp_(req, por, admin) {
  var op = String(req.op || '');
  if (op === 'ler') return { ok: true, nota: estNotaLimpa_(estIA_(req.arquivos, EST_PROMPT_NOTA)) };
  if (op === 'conferir') {
    var itens = (Array.isArray(req.itens) ? req.itens : []).slice(0, 150);
    if (!itens.length) throw new Error('Sem itens para conferir');
    var r = estIA_(req.arquivos, estPromptConferir_(itens)) || {};
    return { ok: true, conferencia: { itens: (r.itens || []).map(function (i) { return { n: Number(i.n) || 0, visto: i.visto == null ? null : estNum_(i.visto), obs: String(i.obs || '').slice(0, 160) }; }),
                                      extras: (r.extras || []).slice(0, 30).map(function (x) { return { desc: String(x.desc || '').slice(0, 120), qtd: estNum_(x.qtd) }; }), resumo: String(r.resumo || '').slice(0, 300) } };
  }
  if (op === 'confirmar') return { entrada: estConfirmar_(req, por) };
  if (!admin) throw new Error('Só a administração pode fazer isso');
  if (op === 'cancelar') { estCancelarEntrada_(req.id, req.motivo, por); return {}; }
  if (op === 'saldo') { estDefinir_(req, por, 'saldo_inicial'); return {}; }
  if (op === 'ajuste') { estDefinir_(req, por, 'ajuste'); return {}; }
  if (op === 'cfg') {
    var c = estCfg_(), v = req.cfg || {};
    if (v.baixa_pdv != null) c.baixa_pdv = !!v.baixa_pdv;
    if (v.ia_provedor && EST_MODELOS[v.ia_provedor]) c.ia_provedor = v.ia_provedor;
    if (v.ia_modelo != null) c.ia_modelo = String(v.ia_modelo).replace(/[^\w.:-]/g, '').slice(0, 60);
    setCfg_('estoque', JSON.stringify(c));
    if (v.chave != null) {
      var k = String(v.chave).trim();
      if (k && k.length < 20) throw new Error('Essa chave parece incompleta');
      var props = PropertiesService.getScriptProperties();
      if (k) props.setProperty('IA_CHAVE', k); else props.deleteProperty('IA_CHAVE');
    }
    log_(por, 'config estoque', JSON.stringify({ baixa_pdv: c.baixa_pdv, ia: c.ia_provedor, chave: v.chave != null ? (v.chave ? 'trocada' : 'apagada') : 'mantida' }));
    return {};
  }
  throw new Error('Ação desconhecida');
}

var _estRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'estoque') {
    try {
      var c = checarColab_(req);
      var r = estOp_(req, c.nome, false);
      if (req.op === 'confirmar') { var d = dadosColab_(c); d.entradaFeita = r.entrada; return d; }
      return r;
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _estRodar(req);
};
ADMIN.admEstoque = function (req) {
  var r = estOp_(req, 'Administração', true);
  if (req.op === 'ler' || req.op === 'conferir') return r;
  var d = ADMIN.admDados(req);
  if (r.entrada) d.entradaFeita = r.entrada;
  return d;
};

/* ───────── baixa automática quando vende pelo PDV (liga em Administração › Estoque › Configurar) ───────── */
var _estPdvVender = pdvVender_;
pdvVender_ = function (c, req) {
  var d = _estPdvVender(c, req);
  try {
    if (estCfg_().baixa_pdv && d && d.pdvVenda && !d.pdvRepetida) {
      var v = d.pdvVenda, soma = {};
      (v.itens || []).forEach(function (i) { if (i.id) { soma[i.id] = soma[i.id] || { produto_id: i.id, produto: i.nome, loja: v.loja, delta: 0 }; soma[i.id].delta -= i.qtd; } });
      estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'venda', 'PDV #' + v.numero, c.nome);
      d.estoque = estPacote_(false);
    }
  } catch (e) { log_('Sistema', 'erro baixa estoque', String(e && e.message || e)); }
  return d;
};
var _estPdvCancelar = pdvCancelarLinha_;
pdvCancelarLinha_ = function (v, por, motivo) {
  _estPdvCancelar(v, por, motivo);
  try {
    var ja = ler_('MovEstoque').some(function (m) { return m.tipo === 'venda' && m.ref === 'PDV #' + v.numero && m.data === v.data && m.loja === v.loja; });
    if (!ja) return;                                   // só devolve se essa venda tinha dado baixa
    var itens = []; try { itens = JSON.parse(v.itens || '[]'); } catch (x) {}
    var soma = {};
    itens.forEach(function (i) { if (i.id) { soma[i.id] = soma[i.id] || { produto_id: i.id, produto: i.nome, loja: v.loja, delta: 0 }; soma[i.id].delta += i.qtd; } });
    estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'venda_cancelada', 'PDV #' + v.numero, por, motivo);
  } catch (e) { log_('Sistema', 'erro devolver estoque', String(e && e.message || e)); }
};
