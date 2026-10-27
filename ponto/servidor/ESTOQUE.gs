/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · ESTOQUE + ENTRADA DE MERCADORIA (Portal Equipe)
   Arquivo SEPARADO — fica DEPOIS do Código.gs, do PDV.gs e do ROLETA.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: ESTOQUE
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
      (o Google vai pedir uma permissão nova: "conectar a serviço externo" — é a IA que lê a nota)
   As abas Estoque, MovEstoque, Entradas, VinculosEstoque, Contagens, ContagemLeituras e Transferencias são criadas sozinhas.
   LOCAIS de estoque (Config › estoque_locais): bosque = Bosque prateleira · deposito = Bosque depósito · centro = Centro prateleira.
   A venda do PDV dá baixa na prateleira da loja onde foi feita.
   A chave da IA fica guardada nas Propriedades do Script (nunca na planilha).
   ═══════════════════════════════════════════════════════════════ */

ABAS.Estoque = ['chave', 'produto_id', 'loja', 'qtd', 'minimo', 'atualizado_em', 'por'];
ABAS.MovEstoque = ['id', 'quando', 'data', 'loja', 'produto_id', 'produto', 'tipo', 'qtd', 'saldo', 'ref', 'por', 'obs'];
ABAS.Entradas = ['id', 'criada_em', 'loja', 'fornecedor', 'cnpj', 'numero', 'chave_nfe', 'emissao', 'valor_total', 'qtd_total',
                 'itens', 'origem', 'status', 'por', 'divergencias', 'novos', 'obs', 'cancelada_em', 'cancelada_por'];
ABAS.VinculosEstoque = ['chave', 'cnpj', 'cod_fornecedor', 'ean', 'produto_id', 'descricao', 'atualizado_em'];
ABAS.Contagens = ['id', 'nome', 'local', 'status', 'criada_em', 'criada_por', 'fechada_em', 'fechada_por', 'resumo', 'obs'];
ABAS.ContagemLeituras = ['id', 'contagem_id', 'produto_id', 'delta', 'por', 'quando'];
ABAS.Transferencias = ['id', 'criada_em', 'de', 'para', 'itens', 'qtd_total', 'status', 'por', 'recebida_em', 'recebida_por', 'divergencias', 'obs'];

var EST_LOCAIS_PADRAO = [
  { id: 'bosque', nome: 'Bosque · Prateleira', loja: 'bosque', tipo: 'prateleira' },
  { id: 'deposito', nome: 'Bosque · Depósito', loja: 'bosque', tipo: 'deposito' },
  { id: 'centro', nome: 'Centro · Prateleira', loja: 'centro', tipo: 'prateleira' }
];
CONFIG_PADRAO.push(['estoque_locais', JSON.stringify(EST_LOCAIS_PADRAO), 'Locais de estoque (JSON): id, nome, loja e tipo (prateleira | deposito)']);
var EST_MOTIVOS_SAIDA = ['Avaria / quebra', 'Brinde', 'Chá de lingerie / evento', 'Uso interno / mostruário', 'Devolução ao fornecedor', 'Perda / sumiu', 'Troca com cliente', 'Outro'];
function estLocaisLista_() { var l = cfgJson_('estoque_locais', null); return Array.isArray(l) && l.length ? l : EST_LOCAIS_PADRAO; }
function estLocaisMapa_() { var m = {}; estLocaisLista_().forEach(function (x) { m[x.id] = x; }); return m; }
/** Prateleira da loja (onde a venda do PDV dá baixa). */
function estPrateleiraDe_(loja) { var l = estLocaisLista_().filter(function (x) { return x.loja === loja && x.tipo !== 'deposito'; })[0]; return l ? l.id : loja; }

var EST_PADRAO = { baixa_pdv: true, ia_provedor: 'anthropic', ia_modelo: '' };
var EST_MODELOS = { anthropic: 'claude-sonnet-5-5', gemini: 'gemini-2.5-flash' };
var EST_TIPOS = { entrada: 'Entrada (nota)', saldo_inicial: 'Saldo inicial', ajuste: 'Ajuste', venda: 'Venda PDV', venda_cancelada: 'Venda cancelada', entrada_cancelada: 'Entrada cancelada',
                  contagem: 'Contagem', transf_saida: 'Transferência (saiu)', transf_entrada: 'Transferência (entrou)', transf_cancelada: 'Transferência cancelada', saida: 'Saída' };
CONFIG_PADRAO.push(['estoque', JSON.stringify(EST_PADRAO), 'Estoque (JSON): baixa_pdv = dá baixa ao vender no PDV · ia_provedor = anthropic | gemini · ia_modelo (opcional)']);

function estCfg_() {
  var c = cfgJson_('estoque', {}) || {}, o = {};
  for (var k in EST_PADRAO) o[k] = c[k] != null ? c[k] : EST_PADRAO[k];
  o.baixa_pdv = o.baixa_pdv === true || o.baixa_pdv === 'true';
  if (!EST_MODELOS[o.ia_provedor]) o.ia_provedor = 'anthropic';
  return o;
}
function estChaveIA_() { try { return PropertiesService.getScriptProperties().getProperty('IA_CHAVE') || ''; } catch (e) { return ''; } }
function estLojas_() { return estLocaisMapa_(); }   // entradas, saldo e ajuste agora são por LOCAL
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
  var p = { cfg: estCfg_(), iaPronta: !!estChaveIA_(), saldos: estSaldos_(), tipos: EST_TIPOS, locais: estLocaisLista_(), motivos: EST_MOTIVOS_SAIDA,
            contagens: estContagensPacote_(admin), transferencias: estTransfPacote_(admin),
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
function estMovimentar_(lista, tipo, ref, por, obs, uid) {
  if (!lista.length) return [];
  return comTrava_(function () {
    var sh = aba_('Estoque'), cab = cabecalho_('Estoque', sh), atuais = ler_('Estoque'), porChave = {};
    atuais.forEach(function (r) { porChave[r.chave] = r; });
    var agora = agora_(), hoje = hoje_(), base = uid || (new Date().getTime() + '' + Math.floor(Math.random() * 1e4)), movs = [];
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
  });
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
function estUid_(u) { return String(u || '').replace(/[^\w-]/g, '').slice(0, 40); }
function estConfirmar_(req, por) { return comTrava_(function () { return estConfirmarDentro_(req, por); }); }
function estConfirmarDentro_(req, por) {
  var e = req.entrada || {}, lojas = estLojas_();
  var uid = estUid_(e.uid || req.uid);
  if (uid) {                                   // reenvio da mesma entrada (internet caiu, clicou de novo) não soma 2×
    var jaUid = ler_('Entradas').filter(function (x) { return x.id === 'E' + uid; })[0];
    if (jaUid) { var r0 = estEntrada_(jaUid); r0.repetida = true; return r0; }
  }
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
  var id = uid ? 'E' + uid : 'E' + base;
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

function estCancelarEntrada_(id, motivo, por) { return comTrava_(function () { return estCancelarEntradaDentro_(id, motivo, por); }); }
function estCancelarEntradaDentro_(id, motivo, por) {
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
  if (op === 'fotosLink') { if (!admin) throw new Error('Só a administração'); return estFotosLink_(req); }
  if (op === 'catalogoLote') { if (!admin) throw new Error('Só a administração'); return estCatalogoLote_(req); }
  if (op === 'arrPendentes') { if (!admin) throw new Error('Só a administração'); return { pendentes: estArrPendentes_() }; }
  if (op === 'arrPainel') { if (!admin) throw new Error('Só a administração'); return { produtos: estArrLista_(), historico: estArrHistorico_().historico }; }
  if (op === 'arrHistorico') { if (!admin) throw new Error('Só a administração'); return estArrHistorico_(); }
  if (op === 'arrDesfazer') { if (!admin) throw new Error('Só a administração'); return estArrDesfazer_(req); }
  if (op === 'arrRevisar') { if (!admin) throw new Error('Só a administração'); return estArrRevisar_(req); }
  if (op === 'confirmar') return { entrada: estConfirmar_(req, por) };
  if (op === 'contar') return { contagem: estContar_(req, por) };
  if (op === 'contagem') return { contagem: estContagemTotais_(String(req.id || '')) };
  if (op === 'transferir') return { transferencia: estTransferir_(req, por, admin) };
  if (op === 'receberTransf') return { transferencia: estReceberTransf_(req, por) };
  if (op === 'saida') { estSaida_(req, por, admin); return {}; }
  if (op === 'vincular') { estVincular_(req, por); return { ok: true, vinculos: estPacote_(false).vinculos }; }
  if (op === 'foto') return { ok: true, foto: estFotoSalvar_(req, por) };
  if (op === 'produtoNovo') return { ok: true, produto: estProdutoNovo_(req, por) };
  if (!admin) throw new Error('Só a administração pode fazer isso');
  if (op === 'fotosSite') return { fotos: estFotosSite_(req, por) };
  if (op === 'fotoRemover') { estFotoRemover_(req, por); return {}; }
  if (op === 'contagemAbrir') return { contagem: estContagemAbrir_(req, por) };
  if (op === 'contagemFechar') { estContagemFechar_(req, por); return {}; }
  if (op === 'contagemCancelar') { estContagemCancelar_(req, por); return {}; }
  if (op === 'cancelarTransf') { estCancelarTransf_(req, por); return {}; }
  if (op === 'locais') { estSalvarLocais_(req); return {}; }
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

/* ───────── LINK DE FOTOS SEM PIN (v15) ─────────
   Administração › Estoque › Produtos › "Link sem PIN" gera uma chave (Config › fotos_chave). Quem abrir
   …/#fotos=CHAVE vê só a lista de produtos SEM foto (nome, código, categoria — sem preço nem estoque),
   diz quem é e vai tirando as fotos pelo celular. Desligar o link = apagar a chave. */
function estFotosChave_() { return String(cfg_('fotos_chave') || '').trim(); }
function estFotosLink_(req) {
  if (req.desligar) { setCfg_('fotos_chave', ''); log_('Administração', 'link de fotos', 'desligado'); return { chave: '' }; }
  var ch = estFotosChave_();
  if (!ch || req.novo) {
    var al = 'abcdefghjkmnpqrstuvwxyz23456789', n = ''; for (var i = 0; i < 10; i++) n += al.charAt(Math.floor(Math.random() * al.length));
    ch = n; setCfg_('fotos_chave', ch); log_('Administração', 'link de fotos', req.novo ? 'chave nova' : 'ligado');
  }
  return { chave: ch };
}
/* ───────── MUTIRÃO DE ARRUMAÇÃO (v15c) — o mesmo link sem PIN ─────────
   lista: todos os produtos ativos (foto, código, categoria, preço) (sem ranking: o histórico de quem fez o quê fica só na administração).
   salvar: foto · corrigir: nome / código / categoria entram na hora; PREÇO vira pedido para a administração aprovar.
   ok: "está certo assim" (some o aviso daquele produto). Tudo fica na aba Arrumacao (quem, o quê, antes → depois). */
ABAS.Arrumacao = ['id', 'quando', 'por', 'produto_id', 'produto', 'tipo', 'campo', 'antes', 'depois', 'status', 'revisado_por', 'revisado_em'];
function estArrRegistrar_(o) {
  o.id = o.id || ('A' + new Date().getTime() + Math.floor(Math.random() * 1e4)); o.quando = agora_(); o.status = o.status || 'feito';
  gravar_('Arrumacao', o); return o;
}
function estArrRanking_() {
  var r = {};
  ler_('Arrumacao').forEach(function (a) {
    if (a.status === 'recusado' || a.tipo === 'ok') return;
    var n = String(a.por || '').trim(); if (!n) return;
    r[n] = r[n] || { nome: n, fotos: 0, correcoes: 0, pontos: 0 };
    if (a.tipo === 'foto') r[n].fotos++; else r[n].correcoes++;
    r[n].pontos++;
  });
  return Object.keys(r).map(function (k) { return r[k]; }).sort(function (x, y) { return y.pontos - x.pontos; });
}
function estFotosPublico_(req) {
  var ch = estFotosChave_();
  if (!ch || String(req.chave || '') !== ch) throw new Error('Esse link de fotos não está mais ativo. Peça o link novo para a administração.');
  var op = String(req.op || 'lista');
  var por = String(req.por || '').trim().slice(0, 40);
  if (op !== 'lista' && !por) throw new Error('Toque no seu nome antes');
  var achar = function () { var p = ler_('Produtos').filter(function (x) { return x.id === String(req.produto_id || ''); })[0]; if (!p) throw new Error('Produto não encontrado'); return p; };
  if (op === 'salvar') {
    var p0 = achar(), fotoAntes = estFotosMapa_()[p0.id] || '';
    var url = estFotoSalvar_(req, por + ' (link)');
    comTrava_(function () { estArrRegistrar_({ por: por, produto_id: p0.id, produto: p0.nome, tipo: 'foto', campo: 'foto', antes: fotoAntes, depois: url }); });
    return { ok: true, foto: url };
  }
  if (op === 'corrigir') {
    return comTrava_(function () {
      var p = achar(), c = req.campos || {}, feitos = [], pendentes = [];
      var trocar = function (campo, valor, max) {
        var v = String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim().slice(0, max);
        if (v === String(p[campo] || '')) return;
        estArrRegistrar_({ por: por, produto_id: p.id, produto: p.nome, tipo: 'correcao', campo: campo, antes: String(p[campo] || ''), depois: v });
        p[campo] = v; feitos.push(campo);
      };
      if ('nome' in c) { if (String(c.nome || '').trim().length < 3) throw new Error('Nome muito curto'); trocar('nome', c.nome, 120); }
      if ('categoria' in c) trocar('categoria', c.categoria, 60);
      if ('codigo' in c) {
        var cod = String(c.codigo || '').replace(/\s/g, '').slice(0, 40);
        if (cod && cod !== String(p.codigo || '')) {
          var dono = ler_('Produtos').filter(function (x) { return x.id !== p.id && (x.codigo === cod || x.sku === cod); })[0];
          if (dono) throw new Error('O código ' + cod + ' já é do produto "' + dono.nome + '"');
        }
        trocar('codigo', cod, 40);
      }
      if (feitos.length) { p.atualizado_em = agora_(); gravar_('Produtos', p); }
      if ('preco' in c && String(c.preco).trim() !== '') {
        var novo = valor_(c.preco), atual = Number(p.preco) || 0;
        if (Math.abs(novo - atual) > 0.004) {
          var ja = ler_('Arrumacao').filter(function (a) { return a.produto_id === p.id && a.campo === 'preco' && a.status === 'pendente'; })[0];
          if (ja) { ja.depois = String(novo); ja.por = por; ja.quando = agora_(); gravar_('Arrumacao', ja); }
          else estArrRegistrar_({ por: por, produto_id: p.id, produto: p.nome, tipo: 'correcao', campo: 'preco', antes: String(atual), depois: String(novo), status: 'pendente' });
          pendentes.push('preco');
        }
      }
      if (!feitos.length && !pendentes.length) throw new Error('Nada mudou');
      log_(por + ' (link)', 'arrumou produto', p.nome + ' · ' + feitos.concat(pendentes).join(', '));
      return { ok: true, feitos: feitos, pendentes: pendentes };
    });
  }
  if (op === 'ok') {
    return comTrava_(function () {
      var p = achar(), av = String(req.aviso || '').replace(/[^\w-]/g, '').slice(0, 30);
      if (!av) throw new Error('Qual aviso?');
      estArrRegistrar_({ por: por, produto_id: p.id, produto: p.nome, tipo: 'ok', campo: av, antes: '', depois: 'está certo' });
      return { ok: true };
    });
  }
  var lista = estArrLista_(), com = lista.filter(function (p) { return p.foto; }).length;
  return { ok: true, total: lista.length, com: com, produtos: lista, todos: 1,
           nomes: colabs_().filter(function (c) { return c.ativa === 'SIM'; }).map(function (c) { return String(c.nome).split(' ')[0]; }) };
}
function estArrLista_() {
  var fotos = estFotosMapa_(), okAvisos = {}, pend = {};
  ler_('Arrumacao').forEach(function (a) {
    if (a.tipo === 'ok') (okAvisos[a.produto_id] = okAvisos[a.produto_id] || []).push(a.campo);
    if (a.campo === 'preco' && a.status === 'pendente') pend[a.produto_id] = Number(a.depois) || 0;
  });
  return ler_('Produtos').filter(function (p) { return p.ativo !== 'NÃO'; }).map(function (p) {
    return { id: p.id, nome: p.nome, codigo: p.codigo || '', sku: p.sku || '', categoria: p.categoria || '', preco: Number(p.preco) || 0,
             foto: fotos[p.id] || '', ok: okAvisos[p.id] || [], precoPendente: pend[p.id] || 0 };
  });
}
/* ───────── CATÁLOGO EM LOTE (v15d) — categorias, nomes, descrição e preços vindos do CSV da Nuvemshop ─────────
   O navegador da administração lê o CSV, cruza com os produtos, mostra a prévia; aqui só grava o que foi aprovado.
   lista: [{id, nome?, categoria?, descricao?, preco?}] — até 400 por chamada. */
if (ABAS.Produtos.indexOf('descricao') < 0) ABAS.Produtos.push('descricao');
function estCatalogoLote_(req) {
  var lista = Array.isArray(req.lista) ? req.lista.slice(0, 400) : [];
  if (!lista.length) throw new Error('Nada para gravar');
  return comTrava_(function () {
    var sh = aba_('Produtos'), cab = cabecalho_('Produtos', sh);
    if (cab.indexOf('descricao') < 0 && typeof _cabs !== 'undefined') { _cabs.Produtos = null; cab = cabecalho_('Produtos', sh); }
    var atuais = ler_('Produtos'), porId = {}, n = 0, agora = agora_();
    atuais.forEach(function (p) { porId[p.id] = p; });
    lista.forEach(function (i) {
      var p = porId[i.id]; if (!p) return; var mudou = false;
      if (i.nome != null && String(i.nome).trim().length >= 3) { p.nome = String(i.nome).replace(/\s+/g, ' ').trim().slice(0, 120); mudou = true; }
      if (i.categoria != null) { p.categoria = String(i.categoria).trim().slice(0, 60); mudou = true; }
      if (i.descricao != null) { p.descricao = String(i.descricao).replace(/\r/g, '').trim().slice(0, 3000); mudou = true; }
      if (i.preco != null && i.preco !== '') { var v = valor_(i.preco); if (v > 0) { p.preco = String(v); mudou = true; } }
      if (mudou) { p.atualizado_em = agora; n++; }
    });
    var linhas = atuais.map(function (p) { return linha_('Produtos', p, cab); });
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
    if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
    log_('Administração', 'catálogo em lote', n + ' produto(s) · ' + String(req.origem || 'CSV').slice(0, 40));
    return { alterados: n };
  });
}
/* administração: histórico do mutirão (conferência interna) e desfazer uma edição */
function estArrHistorico_() {
  var L = ler_('Arrumacao').map(limpar_).reverse().slice(0, 2000);
  var porPessoa = {};
  L.forEach(function (a) { var n = a.por || '?'; var x = porPessoa[n] = porPessoa[n] || { nome: n, fotos: 0, correcoes: 0, precos: 0, ok: 0, desfeitos: 0 };
    if (a.status === 'desfeito' || a.status === 'recusado') x.desfeitos++;
    if (a.tipo === 'foto') x.fotos++; else if (a.tipo === 'ok') x.ok++; else if (a.campo === 'preco') x.precos++; else x.correcoes++; });
  return { historico: L, pessoas: Object.keys(porPessoa).map(function (k) { return porPessoa[k]; }) };
}
function estArrDesfazer_(req) {
  return comTrava_(function () {
    var a = ler_('Arrumacao').filter(function (x) { return x.id === req.id; })[0];
    if (!a) throw new Error('Edição não encontrada');
    if (a.status === 'desfeito') throw new Error('Essa edição já foi desfeita');
    if (a.status === 'pendente' || a.status === 'recusado') throw new Error('Preço pendente/recusado não precisa desfazer — use Aprovar/Recusar');
    if (a.tipo === 'foto') {
      var m = {}; m[a.produto_id] = a.antes || '';
      estFotosGravar_(m, a.antes ? 'equipe' : '', 'Administração (desfez)', false);
    } else if (a.tipo === 'correcao') {
      var p = ler_('Produtos').filter(function (x) { return x.id === a.produto_id; })[0];
      if (!p) throw new Error('Produto não encontrado');
      var campo = a.campo === 'preco' ? 'preco' : a.campo;
      if (['nome', 'codigo', 'categoria', 'preco'].indexOf(campo) < 0) throw new Error('Campo não pode ser desfeito');
      if (String(p[campo] || '') !== String(a.depois || '') && !req.forcar) throw new Error('Esse campo já foi mudado de novo depois (agora: "' + p[campo] + '"). Confira antes de desfazer.');
      p[campo] = a.antes || ''; p.atualizado_em = agora_(); gravar_('Produtos', p);
    }
    a.status = 'desfeito'; a.revisado_por = 'Administração'; a.revisado_em = agora_(); gravar_('Arrumacao', a);
    log_('Administração', 'desfez edição do mutirão', a.produto + ' · ' + a.campo + ' (' + a.por + ')');
    return estArrHistorico_();
  });
}
/* administração: preços sugeridos pelo link (aprovar / recusar) */
function estArrPendentes_() {
  return ler_('Arrumacao').filter(function (a) { return a.campo === 'preco' && a.status === 'pendente'; }).map(limpar_);
}
function estArrRevisar_(req) {
  return comTrava_(function () {
    var a = ler_('Arrumacao').filter(function (x) { return x.id === req.id; })[0];
    if (!a || a.status !== 'pendente') throw new Error('Esse pedido já foi resolvido');
    if (req.aprovar) {
      var p = ler_('Produtos').filter(function (x) { return x.id === a.produto_id; })[0];
      if (!p) throw new Error('Produto não encontrado');
      p.preco = String(valor_(req.preco != null && req.preco !== '' ? req.preco : a.depois)); p.atualizado_em = agora_(); gravar_('Produtos', p);
      a.depois = p.preco; a.status = 'aprovado';
    } else a.status = 'recusado';
    a.revisado_por = 'Administração'; a.revisado_em = agora_(); gravar_('Arrumacao', a);
    log_('Administração', 'preço do link ' + a.status, a.produto + ' · ' + a.antes + ' → ' + a.depois);
    return { pendentes: estArrPendentes_() };
  });
}

var _estRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'fotos') { try { return estFotosPublico_(req); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; } }
  if (req && req.a === 'estoque') {
    try {
      var c = checarColab_(req);
      var r = estOp_(req, c.nome, false);
      if (['confirmar', 'transferir', 'receberTransf', 'saida', 'produtoNovo'].indexOf(req.op) >= 0) { var d = dadosColab_(c); d.entradaFeita = r.entrada; d.transfFeita = r.transferencia; d.produtoFeito = r.produto; return d; }
      if (req.op === 'contar' || req.op === 'contagem') { r.ok = true; return r; }
      return r;
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _estRodar(req);
};
ADMIN.admEstoque = function (req) {
  var r = estOp_(req, 'Administração', true);
  if (req.op === 'ler' || req.op === 'conferir' || req.op === 'contar' || req.op === 'contagem' || req.op === 'foto' || req.op === 'fotosLink' || req.op === 'arrPendentes' || req.op === 'arrRevisar' || req.op === 'catalogoLote' || req.op === 'arrHistorico' || req.op === 'arrDesfazer' || req.op === 'arrPainel') { r.ok = true; return r; }
  if (req.op === 'produtoNovo') { var d0 = ADMIN.admDados(req); d0.produtoFeito = r.produto; return d0; }
  var d = ADMIN.admDados(req);
  if (r.fotos) d.fotosFeitas = r.fotos;
  if (r.entrada) d.entradaFeita = r.entrada;
  if (r.transferencia) d.transfFeita = r.transferencia;
  return d;
};

/* ───────── baixa automática quando vende pelo PDV (liga em Administração › Estoque › Configurar) ───────── */
var _estPdvVender = pdvVender_;
pdvVender_ = function (c, req) { return comTrava_(function () { return estPdvVenderDentro_(c, req); }); };
function estPdvVenderDentro_(c, req) {
  var d = _estPdvVender(c, req);
  try {
    if (estCfg_().baixa_pdv && d && d.pdvVenda && !d.pdvRepetida) {
      var v = d.pdvVenda, soma = {};
      var pr = estPrateleiraDe_(v.loja);
      (v.itens || []).forEach(function (i) { if (i.id) { soma[i.id] = soma[i.id] || { produto_id: i.id, produto: i.nome, loja: pr, delta: 0 }; soma[i.id].delta -= i.qtd; } });
      var negativos = estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'venda', estRefVenda_(v), c.nome)
        .filter(function (m) { return estNum_(m.saldo) < 0; }).map(function (m) { return m.produto; });
      d.estoque = estPacote_(false);
      if (negativos.length) d.estoqueAviso = 'Estoque ficou negativo: ' + negativos.slice(0, 3).join(', ') + (negativos.length > 3 ? ' e mais ' + (negativos.length - 3) : '') + '. Confira a prateleira.';
    }
  } catch (e) { log_('Sistema', 'erro baixa estoque', String(e && e.message || e)); d.estoqueErro = 'A venda foi gravada, mas o estoque NÃO baixou (' + String(e && e.message || e).slice(0, 80) + '). Avise a administração.'; }
  return d;
}
/* ref do movimento da venda: inclui o id (único) — o número pode repetir em meses diferentes */
function estRefVenda_(v) { return 'PDV #' + v.numero + ' · ' + v.id; }
var _estPdvCancelar = pdvCancelarLinha_;
pdvCancelarLinha_ = function (v, por, motivo) {
  comTrava_(function () {
    _estPdvCancelar(v, por, motivo);
    try {
      var pr = estPrateleiraDe_(v.loja), ref = estRefVenda_(v);
      var ja = ler_('MovEstoque').some(function (m) { return m.tipo === 'venda' && (m.ref === ref || (m.ref === 'PDV #' + v.numero && m.data === v.data && m.loja === pr)); });
      if (!ja) return;                                   // só devolve se essa venda tinha dado baixa
      var itens = []; try { itens = JSON.parse(v.itens || '[]'); } catch (x) {}
      var soma = {};
      itens.forEach(function (i) { if (i.id) { soma[i.id] = soma[i.id] || { produto_id: i.id, produto: i.nome, loja: pr, delta: 0 }; soma[i.id].delta += i.qtd; } });
      estMovimentar_(Object.keys(soma).map(function (k) { return soma[k]; }), 'venda_cancelada', ref, por, motivo);
    } catch (e) { log_('Sistema', 'erro devolver estoque', String(e && e.message || e)); }
  });
};


/* ═════════════ CONTAGEM (levantamento) ═════════════
   A administração abre uma contagem para um local. Várias pessoas contam ao mesmo tempo (leitor de código, câmera ou digitando):
   cada aparelho manda as leituras em lotes (sem duplicar se reenviar). A administração revisa sistema × contado e fecha:
   aí o saldo do local vira o número contado. */
function estContagensPacote_(admin) {
  var abertas = ler_('Contagens').filter(function (c) { return c.status === 'aberta' || (admin && String(c.fechada_em).slice(0, 10) >= diaMais_(-60)); });
  return abertas.map(function (c) { var o = limpar_(c); try { o.resumo = JSON.parse(c.resumo || '{}'); } catch (e) { o.resumo = {}; } return o; }).reverse();
}
function estContagemAchar_(id, aberta) {
  var c = ler_('Contagens').filter(function (x) { return x.id === id; })[0];
  if (!c) throw new Error('Contagem não encontrada');
  if (aberta && c.status !== 'aberta') throw new Error('Essa contagem já foi fechada');
  return c;
}
function estContagemTotais_(id) {
  var c = estContagemAchar_(id, false), tot = {}, pessoas = {}, n = 0;
  ler_('ContagemLeituras').forEach(function (l) {
    if (l.contagem_id !== id) return;
    var d = estNum_(l.delta); tot[l.produto_id] = Math.round(((tot[l.produto_id] || 0) + d) * 1000) / 1000;
    pessoas[l.por] = (pessoas[l.por] || 0) + d; n++;
  });
  return { id: id, nome: c.nome, local: c.local, status: c.status, totais: tot, pessoas: pessoas, leituras: n };
}
function estContagemAbrir_(req, por) {
  var locais = estLocaisMapa_(), local = String(req.local || '');
  if (!locais[local]) throw new Error('Escolha o local da contagem');
  if (ler_('Contagens').some(function (c) { return c.status === 'aberta' && c.local === local; })) throw new Error('Já tem uma contagem aberta em ' + locais[local].nome);
  var c = { id: 'C' + new Date().getTime() + Math.floor(Math.random() * 1e4), nome: String(req.nome || ('Contagem ' + locais[local].nome)).slice(0, 80), local: local, status: 'aberta',
            criada_em: agora_(), criada_por: por, fechada_em: '', fechada_por: '', resumo: '', obs: String(req.obs || '').slice(0, 200) };
  gravar_('Contagens', c);
  log_(por, 'contagem aberta', c.nome);
  return limpar_(c);
}
/** leituras: [{uid, produto_id, delta}] — uid evita contar duas vezes se a internet cair e o aparelho reenviar. */
function estContar_(req, por) {
  var lista = Array.isArray(req.leituras) ? req.leituras.slice(0, 500) : [];
  var cat = {}; ler_('Produtos').forEach(function (p) { cat[p.id] = 1; });
  var c = comTrava_(function () {
    var c = estContagemAchar_(String(req.contagem_id || ''), true);   // confere dentro da trava: fechou enquanto o lote vinha → recusa (não some em silêncio)
    var ja = {}; ler_('ContagemLeituras').forEach(function (l) { if (l.contagem_id === c.id) ja[l.id] = 1; });
    var novas = [], agora = agora_();
    lista.forEach(function (l) {
      var uid = String(l.uid || '').replace(/[^\w-]/g, '').slice(0, 50), d = estNum_(l.delta);
      if (!uid || ja[uid] || !cat[l.produto_id] || !d || Math.abs(d) > 100000) return;
      ja[uid] = 1; novas.push({ id: uid, contagem_id: c.id, produto_id: l.produto_id, delta: String(d), por: por, quando: agora });
    });
    if (novas.length) {
      var sh = aba_('ContagemLeituras'), cab = cabecalho_('ContagemLeituras', sh);
      sh.getRange(sh.getLastRow() + 1, 1, novas.length, cab.length).setNumberFormat('@').setValues(novas.map(function (x) { return linha_('ContagemLeituras', x, cab); }));
    }
    return c;
  });
  return estContagemTotais_(c.id);
}
/** Fecha: o saldo do local vira o contado. Produto não contado: zera (zerar:true) ou mantém o saldo antigo. */
function estContagemFechar_(req, por) { return comTrava_(function () { return estContagemFecharDentro_(req, por); }); }
function estContagemFecharDentro_(req, por) {
  var c = estContagemAchar_(String(req.id || ''), true), t = estContagemTotais_(c.id).totais;
  var cat = {}; ler_('Produtos').forEach(function (p) { cat[p.id] = p; });
  var atuais = {}; estSaldos_().forEach(function (s) { if (s.loja === c.local) atuais[s.produto_id] = s.qtd; });
  var lista = [], sobra = 0, falta = 0, iguais = 0, zerados = 0;
  Object.keys(t).forEach(function (pid) {
    if (!cat[pid]) return;
    var q = Math.max(0, t[pid]), antes = atuais[pid] || 0;
    if (q > antes) sobra += q - antes; else if (q < antes) falta += antes - q; else iguais++;
    lista.push({ produto_id: pid, produto: cat[pid].nome, loja: c.local, definir: q });
  });
  if (req.zerar) Object.keys(atuais).forEach(function (pid) {
    if (t[pid] != null || !cat[pid] || atuais[pid] === 0) return;
    if (atuais[pid] > 0) falta += atuais[pid];
    lista.push({ produto_id: pid, produto: cat[pid].nome, loja: c.local, definir: 0, obs: 'não contado' }); zerados++;
  });
  if (!lista.length) throw new Error('Nada contado ainda');
  estMovimentar_(lista, 'contagem', c.nome, por, '');
  c.status = 'fechada'; c.fechada_em = agora_(); c.fechada_por = por;
  c.resumo = JSON.stringify({ produtos: Object.keys(t).length, pecas: Object.keys(t).reduce(function (s, k) { return s + Math.max(0, t[k]); }, 0), sobra: sobra, falta: falta, iguais: iguais, zerados: zerados });
  gravar_('Contagens', c);
  log_(por, 'contagem fechada', c.nome + ' · ' + c.resumo);
}
function estContagemCancelar_(req, por) {
  var c = estContagemAchar_(String(req.id || ''), true);
  c.status = 'cancelada'; c.fechada_em = agora_(); c.fechada_por = por; gravar_('Contagens', c);
  log_(por, 'contagem cancelada', c.nome);
}

/* ═════════════ TRANSFERÊNCIAS ═════════════
   Depósito → prateleira da MESMA loja: entra na hora. Entre lojas (ex.: depósito do Bosque → Centro): sai da origem e fica
   "em trânsito" até quem recebe conferir no destino (o que faltar vira divergência). */
function estTransfPacote_(admin) {
  var desde = diaMais_(admin ? -60 : -20);
  return ler_('Transferencias').filter(function (t) { return t.status === 'em_transito' || String(t.criada_em).slice(0, 10) >= desde; })
    .map(estTransf_).reverse().slice(0, 60);
}
function estTransf_(t) {
  var o = limpar_(t); try { o.itens = JSON.parse(t.itens || '[]'); } catch (e) { o.itens = []; }
  try { o.divergencias = JSON.parse(t.divergencias || '[]'); } catch (e) { o.divergencias = []; }
  o.qtd_total = Number(o.qtd_total) || 0; return o;
}
function estItensValidos_(itens) {
  var cat = {}; ler_('Produtos').forEach(function (p) { cat[p.id] = p; });
  var soma = {};
  (Array.isArray(itens) ? itens.slice(0, 400) : []).forEach(function (i) {
    var p = cat[i.produto_id], q = estNum_(i.qtd);
    if (!p) throw new Error('Produto não encontrado');
    if (q <= 0) return;
    soma[p.id] = soma[p.id] || { produto_id: p.id, produto: p.nome, qtd: 0 }; soma[p.id].qtd += q;
  });
  var l = Object.keys(soma).map(function (k) { return soma[k]; });
  if (!l.length) throw new Error('Nenhum item com quantidade');
  return l;
}
/* O que tem de fato no local (para não deixar tirar mais do que existe) */
function estConferirSaldo_(itens, local, admin) {
  var atual = {}; estSaldos_().forEach(function (s) { if (s.loja === local) atual[s.produto_id] = s.qtd; });
  var faltam = itens.filter(function (i) { return i.qtd > (atual[i.produto_id] || 0); });
  if (faltam.length && !admin) throw new Error('Não tem essa quantidade em ' + ((estLocaisMapa_()[local] || {}).nome || local) + ': ' +
    faltam.slice(0, 3).map(function (i) { return i.produto + ' (tem ' + (atual[i.produto_id] || 0) + ', pediu ' + i.qtd + ')'; }).join(', ') + (faltam.length > 3 ? ' e mais ' + (faltam.length - 3) : '') + '. Confira a contagem ou peça para a administração ajustar.');
  return faltam;
}
function estTransferir_(req, por, admin) { return comTrava_(function () { return estTransferirDentro_(req, por, admin); }); }
function estTransferirDentro_(req, por, admin) {
  var locais = estLocaisMapa_(), de = String(req.de || ''), para = String(req.para || '');
  var uid = estUid_(req.uid);
  if (uid) { var ja = ler_('Transferencias').filter(function (x) { return x.id === 'T' + uid; })[0]; if (ja) { var r0 = estTransf_(ja); r0.repetida = true; return r0; } }
  if (!locais[de] || !locais[para]) throw new Error('Escolha de onde sai e para onde vai');
  if (de === para) throw new Error('Origem e destino são o mesmo local');
  var itens = estItensValidos_(req.itens);
  estConferirSaldo_(itens, de, admin);
  var mesmaLoja = locais[de].loja === locais[para].loja;
  var t = { id: uid ? 'T' + uid : 'T' + new Date().getTime() + Math.floor(Math.random() * 1e3), criada_em: agora_(), de: de, para: para, itens: JSON.stringify(itens),
            qtd_total: String(itens.reduce(function (s, i) { return s + i.qtd; }, 0)), status: mesmaLoja ? 'concluida' : 'em_transito', por: por,
            recebida_em: mesmaLoja ? agora_() : '', recebida_por: mesmaLoja ? por : '', divergencias: '[]', obs: String(req.obs || '').slice(0, 200) };
  var ref = locais[de].nome + ' → ' + locais[para].nome;
  gravar_('Transferencias', t);                       // grava ANTES de movimentar: se a baixa falhar, a transferência fica registrada
  estMovimentar_(itens.map(function (i) { return { produto_id: i.produto_id, produto: i.produto, loja: de, delta: -i.qtd }; }), 'transf_saida', ref, por, t.obs);
  if (mesmaLoja) estMovimentar_(itens.map(function (i) { return { produto_id: i.produto_id, produto: i.produto, loja: para, delta: i.qtd }; }), 'transf_entrada', ref, por, t.obs);
  log_(por, 'transferência', ref + ' · ' + t.qtd_total + ' peças · ' + t.status);
  return estTransf_(t);
}
function estReceberTransf_(req, por) { return comTrava_(function () { return estReceberTransfDentro_(req, por); }); }
function estReceberTransfDentro_(req, por) {
  var t = ler_('Transferencias').filter(function (x) { return x.id === req.id; })[0];
  if (!t) throw new Error('Transferência não encontrada');
  if (t.status !== 'em_transito') throw new Error('Essa transferência já foi recebida ou cancelada');
  var locais = estLocaisMapa_(), enviados = JSON.parse(t.itens || '[]'), receb = {};
  (Array.isArray(req.itens) ? req.itens : []).forEach(function (i) { receb[i.produto_id] = estNum_(i.qtd); });
  var divs = [], mov = [];
  enviados.forEach(function (i) {
    var q = receb[i.produto_id] != null ? Math.max(0, Math.min(i.qtd, receb[i.produto_id])) : i.qtd;   // não dá para receber mais do que saiu
    if (q !== i.qtd) divs.push({ produto: i.produto, enviado: i.qtd, recebido: q });
    if (q > 0) mov.push({ produto_id: i.produto_id, produto: i.produto, loja: t.para, delta: q });
  });
  var ref = (locais[t.de] || {}).nome + ' → ' + (locais[t.para] || {}).nome;
  if (mov.length) estMovimentar_(mov, 'transf_entrada', ref, por, divs.length ? 'recebido com diferença' : '');
  t.status = 'recebida'; t.recebida_em = agora_(); t.recebida_por = por; t.divergencias = JSON.stringify(divs);
  gravar_('Transferencias', t);
  log_(por, 'transferência recebida', ref + (divs.length ? ' · ' + divs.length + ' divergência(s)' : ''));
  return estTransf_(t);
}
function estCancelarTransf_(req, por) { return comTrava_(function () { return estCancelarTransfDentro_(req, por); }); }
function estCancelarTransfDentro_(req, por) {
  var t = ler_('Transferencias').filter(function (x) { return x.id === req.id; })[0];
  if (!t) throw new Error('Transferência não encontrada');
  if (t.status !== 'em_transito') throw new Error('Só dá para cancelar a que ainda está em trânsito');
  var itens = JSON.parse(t.itens || '[]');
  estMovimentar_(itens.map(function (i) { return { produto_id: i.produto_id, produto: i.produto, loja: t.de, delta: i.qtd }; }), 'transf_cancelada', 'Volta para a origem', por, String(req.motivo || '').slice(0, 200));
  t.status = 'cancelada'; t.recebida_em = agora_(); t.recebida_por = por; t.obs = (t.obs ? t.obs + ' · ' : '') + 'Cancelada: ' + String(req.motivo || '').slice(0, 150);
  gravar_('Transferencias', t);
  log_(por, 'transferência cancelada', t.id);
}

/* ═════════════ SAÍDA (sem venda) ═════════════ */
function estSaida_(req, por, admin) { return comTrava_(function () { return estSaidaDentro_(req, por, admin); }); }
function estSaidaDentro_(req, por, admin) {
  var locais = estLocaisMapa_(), local = String(req.local || '');
  if (!locais[local]) throw new Error('Escolha o local');
  var motivo = String(req.motivo || '').trim();
  if (!motivo) throw new Error('Escolha o motivo da saída');
  var uid = estUid_(req.uid);
  if (uid && ler_('MovEstoque').some(function (m) { return m.tipo === 'saida' && m.id.indexOf('M' + uid + '-') === 0; })) return;   // reenvio não tira 2×
  var itens = estItensValidos_(req.itens);
  estConferirSaldo_(itens, local, admin);
  estMovimentar_(itens.map(function (i) { return { produto_id: i.produto_id, produto: i.produto, loja: local, delta: -i.qtd }; }), 'saida', motivo, por, String(req.obs || '').slice(0, 200), uid);
  log_(por, 'saída estoque', locais[local].nome + ' · ' + motivo + ' · ' + itens.length + ' produto(s)');
}
function estSalvarLocais_(req) {
  var l = Array.isArray(req.locais) ? req.locais : [];
  var lojas = JSON.parse(cfg_('lojas')), ids = {};
  l = l.map(function (x) {
    var id = String(x.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (!id || ids[id]) throw new Error('Código de local inválido ou repetido');
    if (!lojas[x.loja]) throw new Error('Loja inválida no local ' + id);
    ids[id] = 1; return { id: id, nome: String(x.nome || id).slice(0, 40), loja: x.loja, tipo: x.tipo === 'deposito' ? 'deposito' : 'prateleira' };
  });
  if (!l.length) throw new Error('Cadastre ao menos um local');
  setCfg_('estoque_locais', JSON.stringify(l));
}

/* Código de barras que não está no catálogo (ex.: EAN da embalagem de um produto cadastrado só com código interno):
   a equipe diz qual produto é e o código passa a ser reconhecido na contagem, nas transferências e no PDV. */
function estVincular_(req, por) {
  var cod = String(req.codigo || '').replace(/\s/g, '').slice(0, 40);
  if (cod.length < 4) throw new Error('Código inválido');
  var p = ler_('Produtos').filter(function (x) { return x.id === req.produto_id; })[0];
  if (!p) throw new Error('Produto não encontrado');
  if (p.codigo === cod || p.sku === cod) return;
  if (!p.codigo && /^\d{8,14}$/.test(cod)) { p.codigo = cod; p.atualizado_em = agora_(); gravar_('Produtos', p); }
  var ch = 'EAN|' + cod, v = ler_('VinculosEstoque').filter(function (x) { return x.chave === ch; })[0] || { chave: ch, cnpj: 'EAN', cod_fornecedor: cod };
  v.ean = cod; v.produto_id = p.id; v.descricao = p.nome + ' (por ' + por + ')'; v.atualizado_em = agora_();
  gravar_('VinculosEstoque', v);
  log_(por, 'código vinculado', cod + ' → ' + p.nome);
}

/* ───────── fotos dos produtos ─────────
   As fotos do site (Nuvemshop) entram de uma vez pela administração; o que faltar a equipe fotografa pelo celular
   (Estoque › Produtos ou na contagem). A foto aparece no PDV, na contagem e nas listas. Aba FotosProdutos. */
ABAS.FotosProdutos = ['produto_id', 'url', 'origem', 'por', 'em'];
function estFotosMapa_() { var m = {}; ler_('FotosProdutos').forEach(function (f) { if (f.url) m[f.produto_id] = f.url; }); return m; }
var _estPdvProdutos = pdvProdutos_;
pdvProdutos_ = function (admin) {
  var l = _estPdvProdutos(admin), f = estFotosMapa_();
  l.forEach(function (p) { if (f[p.id]) p.foto = f[p.id]; });
  return l;
};
function estFotoUrlOk_(u) { return /^https:\/\/([a-z0-9-]+\.mitiendanube\.com|drive\.google\.com|lh3\.googleusercontent\.com)\//.test(String(u || '')); }
function estComTrava_(fn) { return comTrava_(fn); }
/* mapa {produto_id: url}; manter = não troca a foto que a equipe tirou */
function estFotosGravar_(mapa, origem, por, manter) {
  var sh = aba_('FotosProdutos'), cab = cabecalho_('FotosProdutos', sh), atuais = ler_('FotosProdutos'), porId = {}, n = 0, agora = agora_();
  atuais.forEach(function (f) { porId[f.produto_id] = f; });
  Object.keys(mapa).forEach(function (id) {
    var f = porId[id], u = mapa[id];
    if (f && f.url && manter && f.origem !== 'site') return;
    if (!f) { f = { produto_id: id }; atuais.push(f); porId[id] = f; }
    if (f.url === u) return;
    f.url = u; f.origem = u ? origem : ''; f.por = por; f.em = agora; n++;
  });
  var linhas = atuais.filter(function (f) { return f.url; }).map(function (f) { return linha_('FotosProdutos', f, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  return n;
}
function estFotoSalvar_(req, por) {
  var id = String(req.produto_id || '');
  var p = ler_('Produtos').filter(function (x) { return x.id === id; })[0];
  if (!p) throw new Error('Produto não encontrado');
  var bytes = Utilities.base64Decode(String(req.img || '').replace(/^data:image\/\w+;base64,/, ''));
  if (bytes.length < 1500) throw new Error('A foto não chegou — tente de novo');
  if (bytes.length > 700 * 1024) throw new Error('Foto grande demais');
  var raiz = pastaAnexos_(), it = raiz.getFoldersByName('Fotos dos produtos');
  var pasta = it.hasNext() ? it.next() : raiz.createFolder('Fotos dos produtos');
  var f = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', (p.codigo || p.id) + ' - ' + String(p.nome).slice(0, 60) + '.jpg'));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w600', m = {};
  m[id] = url;
  estComTrava_(function () { estFotosGravar_(m, 'equipe', por, false); });
  log_(por, 'foto do produto', p.nome);
  return url;
}
function estFotosSite_(req, por) {
  var lista = Array.isArray(req.lista) ? req.lista.slice(0, 6000) : [];
  var porCod = {}, ids = {};
  ler_('Produtos').forEach(function (p) { ids[p.id] = 1; if (p.codigo) porCod[p.codigo] = p.id; if (p.sku && !porCod[p.sku]) porCod[p.sku] = p.id; });
  var m = {}, sem = 0;
  lista.forEach(function (i) {
    var id = ids[i.produto_id] ? i.produto_id : porCod[String(i.codigo || '').trim()], u = String(i.url || '').trim();
    if (!id || !estFotoUrlOk_(u)) { sem++; return; }
    m[id] = u;
  });
  var n = estComTrava_(function () { return estFotosGravar_(m, 'site', por, !req.substituir); });
  log_(por, 'fotos do site', n + ' gravadas · ' + sem + ' sem par');
  return { gravadas: n, recebidas: lista.length, sem_par: sem };
}
function estFotoRemover_(req, por) {
  var m = {}; m[String(req.produto_id || '')] = '';
  estComTrava_(function () { estFotosGravar_(m, '', por, false); });
}

/* Produto que chegou e ainda não está no sistema: a equipe cadastra pelo celular (código, foto, nome, preço e quantas peças chegaram). */
function estProdutoNovo_(req, por) {
  var nome = String(req.nome || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (nome.length < 3) throw new Error('Escreva o nome do produto');
  var preco = valor_(req.preco);
  if (!(preco > 0)) throw new Error('Informe o preço de venda');
  var cod = String(req.codigo || '').replace(/\s/g, '').slice(0, 40), todos = ler_('Produtos');
  if (cod) {
    var ja = todos.filter(function (x) { return x.codigo === cod || x.sku === cod; })[0];
    if (ja) throw new Error('Esse código já é do produto "' + ja.nome + '"');
  }
  var mesmoNome = todos.filter(function (x) { return norm_(x.nome) === norm_(nome); })[0];
  if (mesmoNome && !req.mesmoAssim) throw new Error('Já existe "' + mesmoNome.nome + '" — confira se não é o mesmo produto');
  var r = { id: 'P' + new Date().getTime() + Math.floor(Math.random() * 1e3), origem: 'equipe', codigo: cod, sku: '', nome: nome,
            categoria: String(req.categoria || '').trim().slice(0, 60), preco: String(preco), preco_promo: '', ativo: 'SIM', atualizado_em: agora_() };
  gravar_('Produtos', r);
  log_(por, 'produto novo', nome + ' R$ ' + preco + (cod ? ' · ' + cod : ''));
  var o = { id: r.id, codigo: r.codigo, sku: '', nome: r.nome, categoria: r.categoria, preco: preco, promo: 0, ativo: true };
  if (req.img) { try { o.foto = estFotoSalvar_({ produto_id: r.id, img: req.img }, por); } catch (e) { o.erroFoto = String(e.message || e); } }
  var qtd = estNum_(req.qtd), locais = estLocaisMapa_();
  if (qtd > 0 && locais[req.local]) estMovimentar_([{ produto_id: r.id, produto: nome, loja: req.local, delta: qtd }], 'entrada', 'cadastro', por, 'produto novo');
  return o;
}
