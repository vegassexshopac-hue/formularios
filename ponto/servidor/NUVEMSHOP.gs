/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · NUVEMSHOP (API do site) — Portal Equipe
   Arquivo SEPARADO — fica DEPOIS do Código.gs, PDV.gs, ROLETA.gs e ESTOQUE.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: NUVEMSHOP
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
      (o Google vai pedir a permissão "conectar a serviço externo" se ainda não pediu)
   O que ele faz:
   • Conecta o portal à loja da Nuvemshop (OAuth): a administração cola o App ID e o
     Client Secret do app criado no Portal de Parceiros, clica em "Autorizar" e pronto.
     O token fica nas Propriedades do Script (nunca na planilha).
   • Importa os produtos do site (com variações, código de barras, SKU, preço e foto)
     para a aba Produtos e guarda o vínculo produto do portal ⇄ variante do site.
   • Manda o estoque do portal para o site (soma dos locais escolhidos) — na hora que
     o estoque muda (venda, entrada, transferência…) e em lote quando a administração pedir.
   • Recebe os pedidos do site por webhook (sem ficar consultando): grava na aba VendasSite
     e dá baixa no local escolhido (padrão: Bosque · Depósito). Pedido cancelado devolve.
   Endereço do webhook e do retorno do OAuth: o próprio /exec deste script.
   ═══════════════════════════════════════════════════════════════ */

ABAS.VendasSite = ['id', 'numero', 'criada_em', 'data', 'hora', 'status', 'pagamento_status', 'envio_status', 'cliente', 'cliente_tel',
                   'subtotal', 'desconto', 'frete', 'total', 'pagamento', 'itens', 'qtd_itens', 'baixa_local', 'baixa_em', 'devolvido_em', 'obs', 'atualizado_em'];
ABAS.VinculosNuvemshop = ['produto_id', 'ns_produto_id', 'ns_variante_id', 'sku', 'ean', 'nome', 'estoque_enviado', 'enviado_em', 'atualizado_em'];

var NS_PADRAO = { local_baixa: 'deposito', locais_site: ['bosque', 'deposito', 'centro'], baixa_site: true, enviar_estoque: true, importar_fotos: true,
                  ultima_importacao: '', ultimo_envio: '', webhooks: [] };
CONFIG_PADRAO.push(['nuvemshop', JSON.stringify(NS_PADRAO), 'Nuvemshop (JSON): local_baixa = local de onde sai o pedido do site · locais_site = locais somados no estoque do site · baixa_site · enviar_estoque']);
EST_TIPOS.venda_site = 'Venda no site';
EST_TIPOS.venda_site_cancelada = 'Venda no site cancelada';

var NS_API = 'https://api.nuvemshop.com.br/v1/';
var NS_TOKEN_URL = 'https://www.nuvemshop.com.br/apps/authorize/token';
var NS_AGENTE = 'Portal Equipe Las Vegas (vegassexshop.ac@gmail.com)';
var NS_EVENTOS = ['order/created', 'order/paid', 'order/cancelled', 'order/updated'];
var NS_FILA_MAX = 400;

/* ───────── configuração e segredos ───────── */
function nsCfg_() {
  var c = cfgJson_('nuvemshop', {}) || {}, o = {};
  for (var k in NS_PADRAO) o[k] = c[k] != null ? c[k] : NS_PADRAO[k];
  var locais = estLocaisMapa_();
  o.locais_site = (Array.isArray(o.locais_site) ? o.locais_site : NS_PADRAO.locais_site).filter(function (l) { return locais[l]; });
  if (!o.locais_site.length) o.locais_site = Object.keys(locais);
  if (!locais[o.local_baixa]) o.local_baixa = locais.deposito ? 'deposito' : Object.keys(locais)[0];
  o.baixa_site = o.baixa_site !== false && o.baixa_site !== 'false';
  o.enviar_estoque = o.enviar_estoque !== false && o.enviar_estoque !== 'false';
  o.importar_fotos = o.importar_fotos !== false && o.importar_fotos !== 'false';
  if (!Array.isArray(o.webhooks)) o.webhooks = [];
  return o;
}
function nsCfgGravar_(o) { setCfg_('nuvemshop', JSON.stringify(o)); }
function nsProps_() { return PropertiesService.getScriptProperties(); }
function nsProp_(k) { try { return nsProps_().getProperty('NS_' + k) || ''; } catch (e) { return ''; } }
function nsPropSet_(k, v) { if (v) nsProps_().setProperty('NS_' + k, String(v)); else nsProps_().deleteProperty('NS_' + k); }
function nsAleatorio_(n) { var s = '', a = 'abcdefghjkmnpqrstuvwxyz23456789'; for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; }
function nsUrlExec_() { try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; } }
function nsConectado_() { return !!(nsProp_('TOKEN') && nsProp_('STORE_ID')); }
function nsChaveHook_() { var k = nsProp_('HOOK_KEY'); if (!k) { k = nsAleatorio_(24); nsPropSet_('HOOK_KEY', k); } return k; }
function nsUrlWebhook_() { var u = nsUrlExec_(); return u ? u + '?a=nsHook&k=' + nsChaveHook_() : ''; }
function nsUrlAutorizar_() {
  var app = nsProp_('APP_ID'); if (!app) return '';
  var st = nsProp_('STATE'); if (!st) { st = nsAleatorio_(16); nsPropSet_('STATE', st); }
  return 'https://www.nuvemshop.com.br/apps/' + app + '/authorize?state=' + st;
}

/* ───────── chamada à API ───────── */
function nsApi_(metodo, caminho, corpo, tentativa) {
  var token = nsProp_('TOKEN'), loja = nsProp_('STORE_ID');
  if (!token || !loja) throw new Error('A Nuvemshop ainda não está conectada');
  var o = { method: metodo, muteHttpExceptions: true, headers: { 'Authentication': 'bearer ' + token, 'User-Agent': NS_AGENTE, 'Content-Type': 'application/json' } };
  if (corpo != null) o.payload = JSON.stringify(corpo);
  var r = UrlFetchApp.fetch(NS_API + loja + caminho, o), cod = r.getResponseCode(), txt = r.getContentText();
  if (cod === 429 && !tentativa) { Utilities.sleep(1500); return nsApi_(metodo, caminho, corpo, 1); }
  if (cod === 401) throw new Error('A Nuvemshop recusou o acesso (token inválido ou app desinstalado). Autorize de novo.');
  if (cod === 404) return null;
  if (cod < 200 || cod >= 300) throw new Error('Nuvemshop ' + cod + ': ' + String(txt || '').slice(0, 200));
  if (!txt) return {};
  try { return JSON.parse(txt); } catch (e) { return {}; }
}
function nsTexto_(v) { if (v == null) return ''; if (typeof v === 'object') return String(v.pt || v['pt-BR'] || v.es || v.en || Object.keys(v).map(function (k) { return v[k]; })[0] || ''); return String(v); }

/* ───────── OAuth: troca o código pelo token e guarda ───────── */
function nsConectar_(code) {
  var app = nsProp_('APP_ID'), seg = nsProp_('CLIENT_SECRET');
  if (!app || !seg) throw new Error('Salve o App ID e o Client Secret antes de autorizar');
  var r = UrlFetchApp.fetch(NS_TOKEN_URL, { method: 'post', muteHttpExceptions: true, contentType: 'application/json',
    headers: { 'User-Agent': NS_AGENTE }, payload: JSON.stringify({ client_id: app, client_secret: seg, grant_type: 'authorization_code', code: String(code) }) });
  var cod = r.getResponseCode(), j = {}; try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) {}
  if (cod < 200 || cod >= 300 || !j.access_token) throw new Error('A Nuvemshop não aceitou o código (' + cod + '): ' + String(j.error_description || j.error || r.getContentText() || '').slice(0, 160));
  nsPropSet_('TOKEN', j.access_token); nsPropSet_('STORE_ID', String(j.user_id || j.store_id || ''));
  nsPropSet_('ESCOPO', String(j.scope || '')); nsPropSet_('CONECTADO_EM', agora_()); nsPropSet_('STATE', '');
  try { var s = nsApi_('get', '/store'); nsPropSet_('LOJA_NOME', nsTexto_(s && s.name)); nsPropSet_('LOJA_URL', s && s.original_domain ? 'https://' + s.original_domain : (s && s.url_with_protocol) || ''); } catch (e) { log_('Sistema', 'nuvemshop loja', String(e.message || e)); }
  log_('Administração', 'nuvemshop conectada', 'loja ' + nsProp_('STORE_ID'));
  return nsStatus_();
}
function nsDesconectar_() { ['TOKEN', 'STORE_ID', 'ESCOPO', 'CONECTADO_EM', 'LOJA_NOME', 'LOJA_URL', 'STATE'].forEach(function (k) { nsPropSet_(k, ''); }); log_('Administração', 'nuvemshop desconectada', ''); }
function nsPaginaHtml_(ok, titulo, texto) {
  var h = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + '</title>' +
    '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F5F3;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1C1416}' +
    '.c{max-width:440px;margin:20px;padding:34px 30px;border-radius:22px;background:#fff;box-shadow:0 20px 50px -24px rgba(0,0,0,.35);text-align:center}' +
    '.i{width:72px;height:72px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:36px;background:' + (ok ? '#D1FAE5' : '#FEE2E2') + '}' +
    'h1{font-size:22px;margin:0 0 8px}p{margin:0 0 18px;color:#4B4446}a{display:inline-block;padding:12px 22px;border-radius:12px;background:#E3101F;color:#fff;font-weight:800;text-decoration:none}</style></head>' +
    '<body><div class="c"><div class="i">' + (ok ? '✅' : '⚠️') + '</div><h1>' + titulo + '</h1><p>' + texto + '</p><a href="https://equipe.lasvegassexshop.com.br/">Voltar ao Portal Equipe</a></div></body></html>';
  return HtmlService.createHtmlOutput(h).setTitle(titulo).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
/** Retorno do OAuth: a Nuvemshop manda a cliente para …/exec?code=…&state=… depois de autorizar o app na loja. */
function nsRetornoOauth_(e) {
  var p = (e && e.parameter) || {};
  try {
    var st = nsProp_('STATE');
    if (st && p.state && p.state !== st) throw new Error('Este link de autorização é antigo. Volte ao portal e clique em Autorizar de novo.');
    nsConectar_(p.code);
    return nsPaginaHtml_(true, 'Loja conectada!', 'O Portal Equipe já está ligado à <b>' + (nsProp_('LOJA_NOME') || 'sua loja na Nuvemshop') + '</b>. Volte ao portal para importar os produtos e ligar a sincronização.');
  } catch (err) {
    log_('Sistema', 'nuvemshop oauth erro', String(err && err.message || err));
    return nsPaginaHtml_(false, 'Não deu para conectar', String(err && err.message || err));
  }
}

/* ───────── pacote para a administração (leve: não chama a API) ───────── */
function nsStatus_() {
  var cfg = nsCfg_();
  return { configurado: !!(nsProp_('APP_ID') && nsProp_('CLIENT_SECRET')), app_id: nsProp_('APP_ID'), conectado: nsConectado_(), store_id: nsProp_('STORE_ID'),
           loja_nome: nsProp_('LOJA_NOME'), loja_url: nsProp_('LOJA_URL'), conectado_em: nsProp_('CONECTADO_EM'), escopo: nsProp_('ESCOPO'),
           url_callback: nsUrlExec_(), url_webhook: nsConectado_() ? nsUrlWebhook_() : '', url_autorizar: nsUrlAutorizar_(),
           cfg: cfg, locais: estLocaisLista_(), fila: nsFilaLer_().length, gatilho: nsTemGatilho_(),
           vinculos: ler_('VinculosNuvemshop').length, produtos: ler_('Produtos').length };
}
function nsPacote_() {
  var s = nsStatus_();
  s.pedidos = ler_('VendasSite').slice(-60).map(nsPedidoLimpo_).reverse();
  return s;
}
function nsPedidoLimpo_(v) {
  var o = limpar_(v); try { o.itens = JSON.parse(v.itens || '[]'); } catch (e) { o.itens = []; }
  ['subtotal', 'desconto', 'frete', 'total', 'qtd_itens', 'numero'].forEach(function (k) { o[k] = Number(o[k]) || 0; });
  return o;
}
var _nsAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _nsAdmDados(req);
  try { d.nuvemshop = nsPacote_(); } catch (e) { d.nuvemshop = { erro: String(e && e.message || e) }; }
  return d;
};

/* ───────── vínculos produto do portal ⇄ variante do site ───────── */
function nsVinculos_() { return ler_('VinculosNuvemshop'); }
function nsVinculosGravar_(lista) {
  var sh = aba_('VinculosNuvemshop'), cab = cabecalho_('VinculosNuvemshop', sh);
  var linhas = lista.map(function (v) { return linha_('VinculosNuvemshop', v, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
}
function nsVariantes_(p) {
  var imgs = {}; (p.images || []).forEach(function (i) { imgs[String(i.id)] = String(i.src || ''); });
  var foto = p.images && p.images.length ? String(p.images[0].src || '') : '';
  var nome = nsTexto_(p.name).replace(/\s+/g, ' ').trim(), cat = p.categories && p.categories.length ? nsTexto_(p.categories[0].name) : '';
  return (p.variants || []).map(function (v) {
    var vals = (v.values || []).map(function (x) { return nsTexto_(x); }).filter(String);
    var preco = Number(v.price) || 0, promo = Number(v.promotional_price) || 0;
    return { ns_produto_id: String(p.id), ns_variante_id: String(v.id), sku: String(v.sku || '').trim().slice(0, 40), ean: String(v.barcode || '').trim().slice(0, 40),
             nome: (vals.length ? nome + ' · ' + vals.join(' / ') : nome).slice(0, 120), categoria: String(cat || '').slice(0, 60),
             preco: preco, promo: promo > 0 && promo < preco ? promo : 0, ativo: p.published !== false, foto: (v.image_id && imgs[String(v.image_id)]) || foto,
             estoque_site: v.stock == null ? null : Number(v.stock) };
  });
}
/** Baixa TODOS os produtos do site (páginas de 200) e junta com a aba Produtos. */
function nsImportarProdutos_(req, por) {
  var cfg = nsCfg_(), pagina = 1, variantes = [], total = 0;
  while (pagina <= 40) {
    var lote = nsApi_('get', '/products?per_page=200&page=' + pagina + '&fields=id,name,published,categories,images,variants');
    if (!Array.isArray(lote) || !lote.length) break;
    lote.forEach(function (p) { total++; variantes = variantes.concat(nsVariantes_(p)); });
    if (lote.length < 200) break;
    pagina++;
  }
  if (!total) throw new Error('O site não devolveu nenhum produto');
  var r = comTrava_(function () { return nsJuntarProdutos_(variantes, cfg, por); });
  cfg.ultima_importacao = agora_(); nsCfgGravar_(cfg);
  log_(por, 'nuvemshop importar', total + ' produtos · ' + variantes.length + ' variantes · ' + r.novos + ' novos · ' + r.atualizados + ' atualizados');
  r.produtos_site = total; r.variantes = variantes.length;
  return r;
}
function nsJuntarProdutos_(variantes, cfg, por) {
  var sh = aba_('Produtos'), cab = cabecalho_('Produtos', sh), atuais = ler_('Produtos'), porId = {}, porCod = {}, porSku = {}, porNome = {};
  atuais.forEach(function (p) { porId[p.id] = p; if (p.codigo) porCod[p.codigo] = porCod[p.codigo] || p; if (p.sku) porSku[p.sku] = porSku[p.sku] || p; porNome[norm_(p.nome)] = porNome[norm_(p.nome)] || p; });
  var vinc = nsVinculos_(), porVar = {}; vinc.forEach(function (v) { porVar[v.ns_variante_id] = v; });
  var novos = 0, atualizados = 0, agora = agora_(), base = new Date().getTime(), fotos = {};
  variantes.forEach(function (x, n) {
    var v = porVar[x.ns_variante_id], p = v && porId[v.produto_id];
    if (!p && x.ean) p = porCod[x.ean] || porSku[x.ean];
    if (!p && x.sku) p = porSku[x.sku] || porCod[x.sku];
    if (!p) p = porNome[norm_(x.nome)];
    if (!p) { p = { id: 'P' + base + '-' + n, origem: 'nuvemshop', ativo: 'SIM', codigo: '', sku: '' }; atuais.push(p); porId[p.id] = p; novos++; } else atualizados++;
    if (x.ean && !p.codigo) p.codigo = x.ean;
    if (x.sku && !p.sku) p.sku = x.sku;
    if (!p.nome || p.origem === 'nuvemshop' || p.origem === 'importado') p.nome = x.nome;
    if (x.categoria && !p.categoria) p.categoria = x.categoria;
    if (x.preco > 0) p.preco = String(x.preco);
    p.preco_promo = x.promo > 0 ? String(x.promo) : '';
    p.atualizado_em = agora;
    if (x.ean) porCod[x.ean] = porCod[x.ean] || p; if (x.sku) porSku[x.sku] = porSku[x.sku] || p; porNome[norm_(p.nome)] = porNome[norm_(p.nome)] || p;
    if (!v) { v = { produto_id: p.id, ns_variante_id: x.ns_variante_id, estoque_enviado: '', enviado_em: '' }; vinc.push(v); porVar[x.ns_variante_id] = v; }
    v.produto_id = p.id; v.ns_produto_id = x.ns_produto_id; v.sku = x.sku; v.ean = x.ean; v.nome = x.nome; v.atualizado_em = agora;
    if (x.estoque_site != null && v.estoque_enviado === '') v.estoque_enviado = String(x.estoque_site);
    if (x.foto && estFotoUrlOk_(x.foto)) fotos[p.id] = x.foto;
  });
  var linhas = atuais.map(function (p) { return linha_('Produtos', p, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  nsVinculosGravar_(vinc);
  var nFotos = 0;
  if (cfg.importar_fotos) { try { nFotos = estFotosGravar_(fotos, 'site', por, true); } catch (e) { log_('Sistema', 'nuvemshop fotos', String(e.message || e)); } }
  return { novos: novos, atualizados: atualizados, fotos: nFotos, vinculos: vinc.length };
}

/* ───────── estoque do portal → site ───────── */
function nsEstoqueSite_(ids) {
  var cfg = nsCfg_(), soma = {}, quer = ids ? {} : null;
  if (ids) ids.forEach(function (i) { quer[i] = 1; });
  estSaldos_().forEach(function (s) { if (cfg.locais_site.indexOf(s.loja) < 0) return; if (quer && !quer[s.produto_id]) return; soma[s.produto_id] = (soma[s.produto_id] || 0) + s.qtd; });
  return soma;
}
/** Manda o estoque de uma lista de produtos (ou de todos). Devolve quantos foram enviados; respeita o limite da API. */
function nsEnviarEstoque_(ids, forcar, limite) {
  if (!nsConectado_()) throw new Error('A Nuvemshop ainda não está conectada');
  var soma = nsEstoqueSite_(ids), vinc = nsVinculos_(), enviados = 0, iguais = 0, erros = [], falhou = [], agora = agora_(), max = limite || 150, mudou = false, restam = false;
  var quer = ids ? {} : null; if (ids) ids.forEach(function (i) { quer[i] = 1; });
  for (var i = 0; i < vinc.length; i++) {
    var v = vinc[i];
    if (quer && !quer[v.produto_id]) continue;
    var q = Math.max(0, Math.floor(soma[v.produto_id] || 0));
    if (!forcar && v.estoque_enviado !== '' && Number(v.estoque_enviado) === q) { iguais++; continue; }
    if (enviados >= max) { restam = true; falhou.push(v.produto_id); continue; }
    try {
      nsApi_('put', '/products/' + v.ns_produto_id + '/variants/' + v.ns_variante_id, { stock: q });
      v.estoque_enviado = String(q); v.enviado_em = agora; enviados++; mudou = true;
    } catch (e) {
      falhou.push(v.produto_id); erros.push((v.nome || v.produto_id) + ': ' + String(e.message || e).slice(0, 80));
      if (/recusou o acesso/.test(String(e.message || e))) { restam = true; break; }
    }
    if (enviados % 8 === 0) Utilities.sleep(400);
  }
  if (mudou) nsVinculosGravar_(vinc);
  if (enviados) { var c = nsCfg_(); c.ultimo_envio = agora; nsCfgGravar_(c); }
  log_('Sistema', 'nuvemshop estoque', enviados + ' enviados · ' + iguais + ' iguais' + (erros.length ? ' · ' + erros.length + ' erros' : '') + (restam ? ' · ficaram para a próxima' : ''));
  return { enviados: enviados, iguais: iguais, erros: erros.slice(0, 10), restam: restam, falhou: falhou };
}

/* fila: quando o estoque muda, os produtos entram aqui e são enviados logo em seguida (ou pelo gatilho) */
function nsFilaLer_() { try { return JSON.parse(nsProp_('FILA') || '[]'); } catch (e) { return []; } }
function nsFilaGravar_(l) { nsPropSet_('FILA', l.length ? JSON.stringify(l.slice(-NS_FILA_MAX)) : ''); }
function nsFilaPor_(ids) { if (!ids.length) return; var f = nsFilaLer_(), m = {}; f.forEach(function (i) { m[i] = 1; }); ids.forEach(function (i) { if (!m[i]) { f.push(i); m[i] = 1; } }); nsFilaGravar_(f); }
function nsFilaProcessar_(limite) {
  var f = nsFilaLer_(); if (!f.length) return { enviados: 0, fila: 0 };
  var lote = f.slice(0, limite || 40);
  var r = nsEnviarEstoque_(lote, true, lote.length);
  var falhou = {}; r.falhou.forEach(function (i) { falhou[i] = 1; });
  var ok = {}; lote.forEach(function (i) { if (!falhou[i]) ok[i] = 1; });   // quem deu erro continua na fila (o gatilho tenta de novo)
  var resto = f.filter(function (i) { return !ok[i]; });
  nsFilaGravar_(resto);
  r.fila = resto.length;
  return r;
}
/** Chamada pelo gatilho de tempo (Administração › Nuvemshop › Ligar envio em segundo plano). */
function nsProcessarFila() { try { if (nsConectado_() && nsCfg_().enviar_estoque) nsFilaProcessar_(60); } catch (e) { log_('Sistema', 'nuvemshop fila', String(e.message || e)); } }
function nsTemGatilho_() { try { return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'nsProcessarFila'; }); } catch (e) { return false; } }
function nsGatilho_(ligar) {
  var tem = nsTemGatilho_();
  if (ligar && !tem) ScriptApp.newTrigger('nsProcessarFila').timeBased().everyMinutes(5).create();
  if (!ligar && tem) ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'nsProcessarFila') ScriptApp.deleteTrigger(t); });
}
/* Toda mudança de estoque num local que conta para o site → entra na fila e tenta enviar na hora (sem travar a venda se falhar). */
var _nsMovimentar = estMovimentar_;
estMovimentar_ = function (lista, tipo, ref, por, obs, uid) {
  var movs = _nsMovimentar(lista, tipo, ref, por, obs, uid);
  try {
    var cfg = nsCfg_();
    if (cfg.enviar_estoque && nsConectado_() && movs && movs.length) {
      var ids = {}; movs.forEach(function (m) { if (cfg.locais_site.indexOf(m.loja) >= 0 && m.produto_id) ids[m.produto_id] = 1; });
      var lista2 = Object.keys(ids);
      if (lista2.length) { nsFilaPor_(lista2); nsFilaProcessar_(10); }   // até 10 na hora; o resto fica na fila (gatilho ou próximo movimento)
    }
  } catch (e) { log_('Sistema', 'nuvemshop sync', String(e && e.message || e)); }
  return movs;
};

/* ───────── webhooks: pedidos do site ───────── */
function nsWebhooksRegistrar_() {
  var url = nsUrlWebhook_(); if (!url) throw new Error('Não achei o endereço deste script (publique uma versão como app da web)');
  var atuais = nsApi_('get', '/webhooks') || [], ok = [], agora = agora_();
  atuais.forEach(function (w) { if (w.url && w.url.indexOf('a=nsHook') >= 0 && w.url !== url) { try { nsApi_('delete', '/webhooks/' + w.id); } catch (e) {} } });
  atuais = atuais.filter(function (w) { return w.url === url; });
  NS_EVENTOS.forEach(function (ev) {
    var tem = atuais.filter(function (w) { return w.event === ev; })[0];
    if (!tem) tem = nsApi_('post', '/webhooks', { event: ev, url: url });
    ok.push({ event: ev, id: tem && tem.id, em: agora });
  });
  var cfg = nsCfg_(); cfg.webhooks = ok; nsCfgGravar_(cfg);
  log_('Administração', 'nuvemshop webhooks', ok.length + ' registrados');
  return ok;
}
function nsPedidoDoSite_(o) {
  var cli = o.customer || {}, env = o.shipping_address || {}, itens = (o.products || []).map(function (i) {
    return { ns_produto_id: String(i.product_id || ''), ns_variante_id: String(i.variant_id || ''), nome: String(i.name || '').slice(0, 100), sku: String(i.sku || ''), qtd: Math.max(0, Math.round(Number(i.quantity) || 0)), preco: r2_(i.price) };
  });
  var criado = String(o.created_at || '').replace('T', ' ').slice(0, 19);
  var dt; try { dt = new Date(o.created_at); } catch (e) { dt = new Date(); }
  var data = isNaN(dt.getTime()) ? hoje_() : Utilities.formatDate(dt, TZ, 'yyyy-MM-dd'), hora = isNaN(dt.getTime()) ? hora_() : Utilities.formatDate(dt, TZ, 'HH:mm');
  return { id: 'NS' + o.id, numero: String(o.number || o.id), criada_em: criado || agora_(), data: data, hora: hora, status: String(o.status || ''), pagamento_status: String(o.payment_status || ''),
           envio_status: String(o.shipping_status || ''), cliente: String(cli.name || (env.name) || '').slice(0, 80), cliente_tel: String(cli.phone || env.phone || '').replace(/\D/g, '').slice(0, 13),
           subtotal: String(r2_(o.subtotal)), desconto: String(r2_(Number(o.discount || 0) + Number(o.promotional_discount && o.promotional_discount.total_discount_amount || 0))),
           frete: String(r2_(o.shipping_cost_customer)), total: String(r2_(o.total)), pagamento: String(o.gateway_name || o.gateway || o.payment_details && o.payment_details.method || '').slice(0, 40),
           itens: JSON.stringify(itens), qtd_itens: String(itens.reduce(function (s, i) { return s + i.qtd; }, 0)), atualizado_em: agora_() };
}
/** Processa um pedido (vindo do webhook ou de "buscar pedidos"): grava, dá baixa (uma vez só) e devolve se cancelou. */
function nsProcessarPedido_(o, origem) {
  return comTrava_(function () {
    var cfg = nsCfg_(), novo = nsPedidoDoSite_(o), ant = ler_('VendasSite').filter(function (v) { return v.id === novo.id; })[0];
    var v = ant || { baixa_local: '', baixa_em: '', devolvido_em: '', obs: '' };
    for (var k in novo) v[k] = novo[k];
    var itens = JSON.parse(v.itens || '[]'), cancelado = v.status === 'cancelled' || v.status === 'cancelado';
    if (cfg.baixa_site && !cancelado && !v.baixa_em) {
      var mov = nsItensParaEstoque_(itens), faltam = mov.faltam;
      if (mov.lista.length) estMovimentar_(mov.lista.map(function (m) { return { produto_id: m.produto_id, produto: m.produto, loja: cfg.local_baixa, delta: -m.qtd }; }), 'venda_site', 'Site #' + v.numero, 'Site');
      v.baixa_local = cfg.local_baixa; v.baixa_em = agora_();
      if (faltam.length) v.obs = ('Sem vínculo no portal: ' + faltam.join(', ')).slice(0, 200);
    }
    if (cancelado && v.baixa_em && !v.devolvido_em) {
      var mov2 = nsItensParaEstoque_(itens);
      if (mov2.lista.length) estMovimentar_(mov2.lista.map(function (m) { return { produto_id: m.produto_id, produto: m.produto, loja: v.baixa_local || cfg.local_baixa, delta: m.qtd }; }), 'venda_site_cancelada', 'Site #' + v.numero, 'Site');
      v.devolvido_em = agora_();
    }
    gravar_('VendasSite', v);
    log_('Site', 'pedido ' + (origem || 'webhook'), '#' + v.numero + ' ' + v.status + '/' + v.pagamento_status + ' R$ ' + v.total);
    return nsPedidoLimpo_(v);
  });
}
function nsItensParaEstoque_(itens) {
  var vinc = nsVinculos_(), porVar = {}, porSku = {}, prods = {}, lista = [], faltam = [];
  vinc.forEach(function (x) { porVar[x.ns_variante_id] = x; if (x.sku) porSku[x.sku] = x; if (x.ean) porSku[x.ean] = x; });
  ler_('Produtos').forEach(function (p) { prods[p.id] = p; if (p.codigo) porSku[p.codigo] = porSku[p.codigo] || { produto_id: p.id }; if (p.sku) porSku[p.sku] = porSku[p.sku] || { produto_id: p.id }; });
  itens.forEach(function (i) {
    if (!i.qtd) return;
    var x = porVar[i.ns_variante_id] || (i.sku && porSku[i.sku]);
    if (!x || !prods[x.produto_id]) { faltam.push(i.nome); return; }
    lista.push({ produto_id: x.produto_id, produto: prods[x.produto_id].nome, qtd: i.qtd });
  });
  return { lista: lista, faltam: faltam };
}
function nsWebhook_(e) {
  var corpo = {}; try { corpo = JSON.parse(e.postData && e.postData.contents || '{}'); } catch (x) {}
  var ev = String(corpo.event || ''), id = corpo.id;
  if (!id || !/^order\//.test(ev)) return { ok: true, ignorado: ev };
  try {
    var o = nsApi_('get', '/orders/' + id);
    if (!o) return { ok: true, ignorado: 'pedido não encontrado' };
    nsProcessarPedido_(o, ev);
    return { ok: true };
  } catch (err) { log_('Sistema', 'nuvemshop webhook erro', ev + ' ' + id + ': ' + String(err && err.message || err)); return { ok: false, erro: String(err && err.message || err) }; }
}
/** Busca na API os pedidos recentes (para conferir ou recuperar algum que o webhook perdeu). */
function nsBuscarPedidos_(dias) {
  var desde = new Date(new Date().getTime() - (dias || 7) * 86400000).toISOString().slice(0, 19) + '-05:00';
  var lista = nsApi_('get', '/orders?per_page=100&created_at_min=' + encodeURIComponent(desde)) || [], n = 0;
  (Array.isArray(lista) ? lista : []).forEach(function (o) { nsProcessarPedido_(o, 'busca'); n++; });
  return n;
}

/* ───────── entrada (GET = retorno do OAuth · POST = webhook) ───────── */
var _nsDoGet = typeof doGet === 'function' ? doGet : null;
doGet = function (e) {
  var p = (e && e.parameter) || {};
  if (p.code && !p.a) return nsRetornoOauth_(e);
  if (_nsDoGet) return _nsDoGet(e);
  return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: 'Ação desconhecida' })).setMimeType(ContentService.MimeType.JSON);
};
var _nsDoPost = typeof doPost === 'function' ? doPost : null;
doPost = function (e) {
  var p = (e && e.parameter) || {};
  if (p.a === 'nsHook') {
    var r = (p.k && p.k === nsProp_('HOOK_KEY')) ? nsWebhook_(e) : { ok: false, erro: 'chave inválida' };
    return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  }
  if (_nsDoPost) return _nsDoPost(e);
  return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: 'Ação desconhecida' })).setMimeType(ContentService.MimeType.JSON);
};

/* ───────── administração ───────── */
ADMIN.admNuvemshop = function (req) {
  var op = String(req.op || ''), r = {};
  if (op === 'cfg') {
    var v = req.cfg || {}, cfg = nsCfg_(), locais = estLocaisMapa_();
    if (v.app_id != null) { var a = String(v.app_id).trim(); if (a && !/^\d{2,12}$/.test(a)) throw new Error('O App ID é só números (está no Portal de Parceiros)'); nsPropSet_('APP_ID', a); }
    if (v.client_secret != null) { var s = String(v.client_secret).trim(); if (s && s.length < 20) throw new Error('Esse Client Secret parece incompleto'); if (s) nsPropSet_('CLIENT_SECRET', s); }
    if (Array.isArray(v.locais_site)) { var ls = v.locais_site.filter(function (l) { return locais[l]; }); if (!ls.length) throw new Error('Escolha pelo menos um local para o estoque do site'); cfg.locais_site = ls; }
    if (v.local_baixa != null && locais[v.local_baixa]) cfg.local_baixa = v.local_baixa;
    if (v.baixa_site != null) cfg.baixa_site = !!v.baixa_site;
    if (v.enviar_estoque != null) cfg.enviar_estoque = !!v.enviar_estoque;
    if (v.importar_fotos != null) cfg.importar_fotos = !!v.importar_fotos;
    nsCfgGravar_(cfg);
    log_('Administração', 'nuvemshop config', JSON.stringify({ locais: cfg.locais_site, baixa: cfg.local_baixa, baixa_site: cfg.baixa_site, enviar: cfg.enviar_estoque, app: v.app_id != null ? 'salvo' : 'mantido', secret: v.client_secret ? 'trocado' : 'mantido' }));
  }
  else if (op === 'conectar') { r.status = nsConectar_(req.code); }
  else if (op === 'desconectar') { nsDesconectar_(); }
  else if (op === 'testar') { var st = nsApi_('get', '/store'); nsPropSet_('LOJA_NOME', nsTexto_(st && st.name)); nsPropSet_('LOJA_URL', st && st.original_domain ? 'https://' + st.original_domain : (st && st.url_with_protocol) || ''); r.teste = { nome: nsTexto_(st && st.name), url: nsProp_('LOJA_URL'), email: st && st.email || '', plano: st && st.plan_name || '' }; }
  else if (op === 'importar') { r.importacao = nsImportarProdutos_(req, 'Administração'); }
  else if (op === 'enviar') { r.envio = nsEnviarEstoque_(null, !!req.tudo, 200); }
  else if (op === 'fila') { r.envio = nsFilaProcessar_(60); }
  else if (op === 'webhooks') { r.webhooks = nsWebhooksRegistrar_(); }
  else if (op === 'gatilho') { nsGatilho_(!!req.ligar); }
  else if (op === 'pedidos') { r.buscados = nsBuscarPedidos_(Number(req.dias) || 7); }
  else throw new Error('Ação desconhecida');
  var d = ADMIN.admDados(req);
  for (var k in r) d['ns_' + k] = r[k];
  return d;
};
