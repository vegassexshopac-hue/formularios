/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · RELACIONAMENTO E SEGURANÇA (Portal Equipe) — v41
   1) Venda da Kommo no PDV: a vendedora lança os produtos da venda do WhatsApp/Instagram
      → baixa o estoque e dá selo/cashback no cartão fidelidade, SEM somar a meta de novo
        (a meta já vem da Kommo quando o lead vai para "Venda ganha").
   2) Brinde volta para o estoque quando a venda com presente é cancelada.
   3) Clientes para chamar: aniversariantes, cashback vencendo e clientes sumidas
      (com "feito" para ninguém mandar duas vezes).
   4) Backup automático da planilha todo dia no Drive (guarda os últimos 30).
   Arquivo SEPARADO — pode ficar no fim da lista (depois de todos).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: RELACIONAMENTO
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   As abas Contatos é criada sozinha. Backup: ligar em Administração › Ajustes › Regras.
   ═══════════════════════════════════════════════════════════════ */

ABAS.VendasPDV = ABAS.VendasPDV.concat(['origem', 'kommo_lead']);
ABAS.Contatos = ['id', 'cliente_id', 'cliente', 'tipo', 'ref', 'data', 'quando', 'por'];
var REL_PADRAO = { aniversario_dias: 7, cashback_dias: 7, sumida_de: 60, sumida_ate: 365, sumidas_max: 30 };
CONFIG_PADRAO.push(['relacionamento', JSON.stringify(REL_PADRAO), 'Clientes para chamar (JSON): dias de antecedência do aniversário e do cashback; sumida = sem comprar entre sumida_de e sumida_ate dias']);

function relCfg_() { var c = cfgJson_('relacionamento', {}) || {}, o = {}; for (var k in REL_PADRAO) o[k] = (c[k] != null && !isNaN(Number(c[k]))) ? Number(c[k]) : REL_PADRAO[k]; return o; }
function relTrava_(fn) { if (typeof comTrava_ === 'function') return comTrava_(fn); var l = LockService.getScriptLock(); l.waitLock(25000); try { return fn(); } finally { l.releaseLock(); } }
function relDias_(de, ate) { return Math.round((new Date(String(ate).slice(0, 10) + 'T12:00:00Z') - new Date(String(de).slice(0, 10) + 'T12:00:00Z')) / 864e5); }

/* ═════════ 1) venda da Kommo lançada no PDV ═════════ */
var _relVenderDentro = pdvVenderDentro_;
pdvVenderDentro_ = function (c, req) {
  if (!req || !req.kommo) return _relVenderDentro(c, req);
  var ag = pdvAgregar_, d;
  pdvAgregar_ = function () {};          // a meta já vem da Kommo: não soma de novo
  try { d = _relVenderDentro(c, req); } finally { pdvAgregar_ = ag; }
  try {
    if (d && d.pdvVenda && !d.pdvRepetida) {
      var v = ler_('VendasPDV').filter(function (x) { return x.id === d.pdvVenda.id; })[0];
      if (v && v.origem !== 'kommo') {
        v.origem = 'kommo'; v.kommo_lead = String(req.kommo_lead || '').replace(/\D/g, '').slice(0, 20);
        gravar_('VendasPDV', v);
        d.pdvVenda = pdvVenda_(v, false);
        log_(c.nome, 'pdv venda kommo', '#' + v.numero + (v.kommo_lead ? ' · lead ' + v.kommo_lead : '') + ' R$ ' + v.total);
      }
    }
  } catch (e) { log_('Sistema', 'erro marcar venda kommo', String(e && e.message || e)); }
  return d;
};
/* a venda da Kommo não entra no total do dia lançado à mão */
pdvSomaDia_ = function (data, loja, eid) {
  return r2_(ler_('VendasPDV').filter(function (v) { return v.data === data && v.loja === loja && v.colaboradora_id === eid && v.status !== 'cancelada' && v.origem !== 'kommo'; })
    .reduce(function (s, v) { return s + (Number(v.total) || 0); }, 0));
};

/* ═════════ 2) cancelar: venda da Kommo não mexe na meta; brinde volta ao estoque ═════════ */
var _relCancelar = pdvCancelarLinha_;
pdvCancelarLinha_ = function (v, por, motivo) {
  var kom = v && v.origem === 'kommo', ag = pdvAgregar_;
  if (kom) pdvAgregar_ = function () {};
  try { _relCancelar(v, por, motivo); } finally { pdvAgregar_ = ag; }
  try { relDevolverBrinde_(v, por); } catch (e) { log_('Sistema', 'erro devolver brinde', String(e && e.message || e)); }
};
function relDevolverBrinde_(v, por) {
  var premios = fidJson_(v.fid_premios, []).filter(function (p) { return p.presente_id; });
  if (!premios.length || typeof estMovimentar_ !== 'function') return;
  var pres = {}; ler_('Presentes').forEach(function (p) { pres[p.id] = p; });
  var movs = ler_('MovEstoque').filter(function (m) { return String(m.ref).indexOf(v.id) >= 0 && (m.tipo === 'brinde' || m.tipo === 'brinde_cancelado'); });
  if (!movs.some(function (m) { return m.tipo === 'brinde'; }) || movs.some(function (m) { return m.tipo === 'brinde_cancelado'; })) return;   // só devolve o que saiu, e uma vez
  var lista = premios.map(function (p) { var g = pres[p.presente_id]; return g && g.produto_id ? { produto_id: g.produto_id, produto: g.nome, loja: estPrateleiraDe_(v.loja), delta: 1 } : null; }).filter(Boolean);
  if (lista.length) estMovimentar_(lista, 'brinde_cancelado', 'Fidelidade · PDV #' + v.numero + ' · ' + v.id, por, 'Venda cancelada: presente volta para a prateleira');
}

/* ═════════ 3) clientes para chamar ═════════ */
function relLista_() {
  var hoje = hoje_(), cfg = fidCfg_(), rc = relCfg_();
  var cl = ler_('Clientes').filter(function (c) { return c.ativo !== 'NÃO'; }), idx = fidIndice_(null, cl);
  var feitos = {}; ler_('Contatos').forEach(function (r) { feitos[r.tipo + '|' + r.cliente_id + '|' + r.ref] = r; });
  var antigo = {};   // última compra no sistema antigo, pelo WhatsApp
  try { ler_('HistoricoAntigo').forEach(function (h) { var t = fidTel_(h.tel); if (!t) return; var d = String(h.data).slice(0, 10), a = antigo[t] || (antigo[t] = { ultima: '', n: 0 }); a.n++; if (d > a.ultima) a.ultima = d; }); } catch (e) {}
  var ano = hoje.slice(0, 4), aniv = [], cash = [], sumidas = [];
  cl.forEach(function (c) {
    var tel = fidTel_(c.tel);
    if (!tel) return;
    var base = { id: c.id, nome: c.nome, tel: tel };
    // aniversário (hoje até X dias)
    if (/^\d{4}-\d{2}-\d{2}$/.test(c.nascimento || '')) {
      var md = c.nascimento.slice(5), quando = ano + '-' + md;
      if (quando < hoje) quando = (Number(ano) + 1) + '-' + md;
      var dias = relDias_(hoje, quando);
      if (dias >= 0 && dias <= rc.aniversario_dias && !feitos['aniversario|' + c.id + '|' + quando.slice(0, 4)])
        aniv.push(Object.assign({ dias: dias, data: quando, idade: Number(quando.slice(0, 4)) - Number(c.nascimento.slice(0, 4)), ref: quando.slice(0, 4) }, base));
    }
    var minhas = idx.porCli[c.id] || [], k = null;
    if (minhas.length || (idx.indicados[c.id] || []).length) k = fidCartao_(c, idx, cfg, false);
    // cashback vencendo
    if (k && k.cashback.vence && k.cashback.saldo > 0) {
      var dv = relDias_(hoje, k.cashback.vence.data);
      if (dv >= 0 && dv <= rc.cashback_dias && !feitos['cashback|' + c.id + '|' + k.cashback.vence.data])
        cash.push(Object.assign({ valor: k.cashback.saldo, vence: k.cashback.vence.data, vence_valor: k.cashback.vence.valor, dias: dv, selos: k.selos, ref: k.cashback.vence.data }, base));
    }
    // sumida: última compra (portal ou sistema antigo) entre X e Y dias atrás
    var ult = k && k.ultima ? k.ultima : '', origem = 'portal', a = antigo[tel];
    if (a && a.ultima > ult) { ult = a.ultima; origem = 'antigo'; }
    if (ult) {
      var ds = relDias_(ult, hoje);
      if (ds >= rc.sumida_de && ds <= rc.sumida_ate && !feitos['sumida|' + c.id + '|' + ult])
        sumidas.push(Object.assign({ ultima: ult, dias: ds, origem: origem, compras: (k ? k.compras : 0) + (a ? a.n : 0), selos: k ? k.selos : 0, ref: ult }, base));
    }
  });
  aniv.sort(function (x, y) { return x.dias - y.dias || x.nome.localeCompare(y.nome); });
  cash.sort(function (x, y) { return x.dias - y.dias || y.valor - x.valor; });
  sumidas.sort(function (x, y) { return y.compras - x.compras || x.dias - y.dias; });
  var feitosHoje = 0; for (var f in feitos) if (feitos[f].data === hoje) feitosHoje++;
  return { ok: true, hoje: hoje, cfg: rc, aniversarios: aniv, cashback: cash, sumidas: sumidas.slice(0, rc.sumidas_max), sumidas_total: sumidas.length, feitos_hoje: feitosHoje };
}
function relFeito_(req, por) {
  var tipo = ['aniversario', 'cashback', 'sumida'].indexOf(req.tipo) >= 0 ? req.tipo : '';
  if (!tipo || !req.cliente_id || !req.ref) throw new Error('Faltou a cliente');
  return relTrava_(function () {
    var ja = ler_('Contatos').filter(function (r) { return r.tipo === tipo && r.cliente_id === req.cliente_id && r.ref === String(req.ref); })[0];
    if (req.desfazer) { if (ja) aba_('Contatos').deleteRow(ja._linha); return { ok: true }; }
    if (ja) return { ok: true, ja: true };
    var c = ler_('Clientes').filter(function (x) { return x.id === req.cliente_id; })[0];
    gravar_('Contatos', { id: 'R' + new Date().getTime() + Math.floor(Math.random() * 1e3), cliente_id: req.cliente_id, cliente: c ? c.nome : '', tipo: tipo, ref: String(req.ref), data: hoje_(), quando: agora_(), por: por });
    return { ok: true };
  });
}

/* ═════════ 4) backup automático da planilha ═════════ */
function relPastaBackup_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('BACKUP_PASTA');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var arq = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()), pais = arq.getParents();
  var pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
  var p = pai.createFolder('Backups · Portal Las Vegas');
  props.setProperty('BACKUP_PASTA', p.getId());
  return p;
}
function relBackup_(por) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), pasta = relPastaBackup_();
  var nome = 'Backup Portal Las Vegas · ' + agora_().slice(0, 16).replace(' ', ' às ');
  var copia = DriveApp.getFileById(ss.getId()).makeCopy(nome, pasta);
  var arqs = [], it = pasta.getFiles();
  while (it.hasNext()) { var f = it.next(); arqs.push(f); }
  arqs.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  var manter = 30;
  arqs.slice(manter).forEach(function (f) { try { f.setTrashed(true); } catch (e) {} });
  PropertiesService.getScriptProperties().setProperty('BACKUP_ULTIMO', agora_());
  log_(por, 'backup', nome);
  return { nome: nome, url: copia.getUrl() };
}
/** Chamada pelo gatilho diário (precisa ser pública, sem "_" no fim). */
function backupDiario() { relBackup_('Backup automático'); }
function relBackupGatilho_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'backupDiario'; })[0] || null; }
function relBackupEstado_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('BACKUP_PASTA'), url = '', qtd = 0;
  if (id) { try { var p = DriveApp.getFolderById(id); url = p.getUrl(); var it = p.getFiles(); while (it.hasNext()) { it.next(); qtd++; } } catch (e) {} }
  return { ok: true, ligado: !!relBackupGatilho_(), ultimo: props.getProperty('BACKUP_ULTIMO') || '', pasta: url, qtd: qtd };
}
ADMIN.admBackup = function (req) {
  if (req.op === 'agora') { var r = relBackup_('Administração'); var e = relBackupEstado_(); e.feito = r; return e; }
  if (req.op === 'ligar') {
    if (!relBackupGatilho_()) ScriptApp.newTrigger('backupDiario').timeBased().everyDays(1).atHour(3).create();
    log_('Administração', 'backup', 'automático ligado (todo dia às 3h)');
    return relBackupEstado_();
  }
  if (req.op === 'desligar') { var g = relBackupGatilho_(); if (g) ScriptApp.deleteTrigger(g); log_('Administração', 'backup', 'automático desligado'); return relBackupEstado_(); }
  return relBackupEstado_();
};

/* ═════════ ações ═════════ */
ADMIN.admRelacionamento = function (req) {
  if (req.op === 'feito') return relFeito_(req, 'Administração');
  if (req.op === 'cfg') {
    var v = req.valor || {}, atual = cfgJson_('relacionamento', {}) || {};
    for (var k in REL_PADRAO) if (v[k] != null && v[k] !== '' && !isNaN(Number(v[k]))) atual[k] = Math.max(0, Math.round(Number(v[k])));
    setCfg_('relacionamento', JSON.stringify(atual));
    return relLista_();
  }
  return relLista_();
};
var _relRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'relacionamento') {
    try {
      var c = checarColab_(req);
      if (req.op === 'feito') return relFeito_(req, c.nome);
      return relLista_();
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _relRodar(req);
};
