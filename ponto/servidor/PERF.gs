/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PORTAL EQUIPE — DESEMPENHO (v32 · v2 de 11/11/2026: leitura em lote)
   Deixa o servidor mais rápido SEM mudar nenhuma regra:
   • Cada aba da planilha é lida no máximo UMA vez por chamada (antes a mesma aba era lida 3 a 10 vezes
     numa venda — Produtos, VendasPDV, Estoque, Clientes…).
   • Segurança: assim que qualquer parte do código pega a aba para GRAVAR (aba_), aquela aba deixa de
     usar a cópia e volta a ser lida direto da planilha até o fim da chamada. Nada fica desatualizado.
   • Cada chamada do Apps Script começa do zero (nada passa de uma chamada para outra).
   • v2 (11/11/2026) — LEITURA EM LOTE: cada leitura de aba custa ~0,2 s no Apps Script, mesmo aba pequena
     ("entrar" = 30 leituras = 8 s). Com o serviço avançado "Sheets" (Serviços › Google Sheets API) ligado,
     o PERF lê de UMA vez todas as abas que aquela ação costuma usar (44 abas inteiras = ~1 s).
     - A lista de abas de cada ação é aprendida sozinha (guardada 6 h no CacheService); só a LISTA de nomes
       fica guardada, nunca o conteúdo: o dado é sempre lido na hora.
     - Momentos do lote: no início da chamada; ao entrar na trava (relê tudo, como antes); ao montar o pacote
       de dados (depois de SpreadsheetApp.flush(), para enxergar o que acabou de ser gravado).
     - Quem pede a aba para gravar (aba_) tira essa aba do lote: dali em diante ela é lida direto.
     - Sem o serviço Sheets, ou se o lote falhar, tudo funciona como na v1 (aba por aba).
     - Diagnóstico: mandar "_perf": 1 no pedido devolve "_perf" com o tempo das leituras.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: PERF  (o ÚLTIMO da lista, depois de todos os outros)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   Para desligar: apague este arquivo e publique Nova versão (tudo volta a ser como antes).
   ═══════════════════════════════════════════════════════════════ */

var _perfMemo = {}, _perfGravando = {}, _perfLendo = 0;
var _perfAba = aba_, _perfLer = ler_;

/* ── v2: leitura em lote ── */
var PERF_LOTE_MAX = 60;                    // abas por lista
var _perfLote = {}, _perfCtx = '', _perfChave = '', _perfUsou = {}, _perfListas = {}, _perfListasAntes = {}, _perfStat = null;
function perfLoteLigado_() { try { return typeof Sheets !== 'undefined' && !!(Sheets && Sheets.Spreadsheets && Sheets.Spreadsheets.Values); } catch (e) { return false; } }

function perfNovaExecucao_() { _perfMemo = {}; _perfGravando = {}; _perfLendo = 0; _perfAlca = {}; _perfLote = {}; _perfCtx = ''; _perfChave = ''; _perfUsou = {}; _perfListas = {}; _perfListasAntes = {}; _perfStat = null; }
function perfCopia_(linhas) {
  var out = new Array(linhas.length);
  for (var i = 0; i < linhas.length; i++) { var o = {}, r = linhas[i]; for (var k in r) o[k] = r[k]; out[i] = o; }
  return out;
}

/* quem pede a aba fora do ler_ pode gravar nela: a partir daí essa aba é sempre lida da planilha.
   A "alça" da aba é guardada durante a chamada (antes a Config, por exemplo, era procurada 14 vezes). */
var _perfAlca = {};
aba_ = function (nome) {
  if (!_perfLendo) { _perfGravando[nome] = true; delete _perfMemo[nome]; delete _perfLote[nome]; if (_perfPacote > 0) { _perfPacSujo[nome] = true; delete _perfPac[nome]; } }
  if (arguments.length === 1 && _perfAlca[nome]) return _perfAlca[nome];
  var sh = _perfAba.apply(this, arguments);
  if (arguments.length === 1 && sh) _perfAlca[nome] = sh;
  return sh;
};

/* O Código.gs confere o cabeçalho de cada aba na 1ª vez que ela é usada em cada chamada (uma leitura a mais por aba).
   Guardamos por 6 h quais abas já foram conferidas; se a lista de colunas (ABAS) mudar numa versão nova, confere tudo de novo. */
var _perfAbaOkAntes = '';
function perfAbaOkChave_() {
  var s = ''; try { s = JSON.stringify(ABAS); } catch (e) {}
  var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 'perf_abaok_' + h;
}
function perfAbaOkCarregar_() {
  _perfAbaOkAntes = '';
  if (typeof _abaOk !== 'object' || !_abaOk) return;
  try {
    var j = CacheService.getScriptCache().get(perfAbaOkChave_());
    if (!j) return;
    JSON.parse(j).forEach(function (k) { if (ABAS[k]) _abaOk[k] = true; });
    _perfAbaOkAntes = j;
  } catch (e) {}
}
function perfAbaOkGuardar_() {
  if (typeof _abaOk !== 'object' || !_abaOk) return;
  try {
    var j = JSON.stringify(Object.keys(_abaOk).filter(function (k) { return _abaOk[k] === true; }).sort());
    if (j !== _perfAbaOkAntes) CacheService.getScriptCache().put(perfAbaOkChave_(), j, 21600);
  } catch (e) {}
}

ler_ = function (nome) {
  if (arguments.length === 1 && _perfGravando[nome] && _perfPacote > 0 && !_perfPacSujo[nome]) {
    /* montando o pacote de dados (só leitura): mesmo a aba que acabou de ser gravada é lida uma vez só */
    if (!_perfPac[nome]) _perfPac[nome] = perfCopia_(_perfLerDireto_.apply(this, arguments));
    return perfCopia_(_perfPac[nome]);
  }
  if (arguments.length !== 1 || _perfGravando[nome]) return _perfLerDireto_.apply(this, arguments);
  var m = _perfMemo[nome];
  if (m) return perfCopia_(m);
  var linhas = _perfLerDireto_.apply(this, arguments);
  if (!_perfGravando[nome] && Array.isArray(linhas)) _perfMemo[nome] = perfCopia_(linhas);
  return linhas;
};
function _perfLerDireto_(nome) {
  if (arguments.length === 1 && _perfLote[nome]) {
    var r = perfObjetos_(nome, _perfLote[nome]);
    if (r) { if (_perfStat) _perfStat.doLote++; return r; }
  }
  _perfLendo++;
  var t0 = _perfStat ? Date.now() : 0;
  try { return _perfLer.apply(this, arguments); }
  finally { _perfLendo--; if (_perfStat) { _perfStat.diretas++; _perfStat.msDiretas += Date.now() - t0; _perfStat.abasDiretas.push(String(nome)); } }
}
/* mesmo resultado do ler_ do Código.gs (inclusive o _linha), a partir do que veio no lote.
   Se faltar coluna no cabeçalho (versão nova acrescentou), devolve null: aí o ler_ normal conserta o cabeçalho. */
function perfObjetos_(nome, v) {
  var cab = v[0] || [];
  if (typeof ABAS === 'object' && ABAS[nome] && typeof _abaOk === 'object' && _abaOk && !_abaOk[nome]) {
    for (var i = 0; i < ABAS[nome].length; i++) if (cab.indexOf(ABAS[nome][i]) < 0) return null;
    _abaOk[nome] = true;
  }
  if (typeof ABAS === 'object' && ABAS[nome] && typeof _cabs === 'object' && _cabs && !_cabs[nome]) {
    var c1 = []; for (var k = 0; k < ABAS[nome].length; k++) c1.push(k < cab.length ? cab[k] : '');
    _cabs[nome] = c1.filter(String);
  }
  var out = [], n = 0;
  for (var j = 1; j < v.length; j++) {
    var l = v[j];
    if (l.join('') === '') continue;
    var o = { _linha: n + 2 }; n++;
    for (var x = 0; x < cab.length; x++) o[cab[x]] = l[x];
    out.push(o);
  }
  return out;
}
/* lê de uma vez as abas da lista aprendida para o momento atual (só as que ainda não estão na memória da chamada) */
function perfLote_(ctx) {
  if (!_perfListas || !perfLoteLigado_()) return;
  var lista = _perfListas[ctx] || [], nomes = [];
  for (var i = 0; i < lista.length; i++) { var n = lista[i]; if (!_perfLote[n] && !_perfMemo[n] && nomes.indexOf(n) < 0) nomes.push(n); }
  if (nomes.length < 2) return;            // uma aba só: a leitura normal custa o mesmo
  var t0 = Date.now(), ss = SpreadsheetApp.getActiveSpreadsheet(), r = null;
  var faixa = function (n) { return "'" + String(n).replace(/'/g, "''") + "'"; };
  try {
    SpreadsheetApp.flush();
    r = Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: nomes.map(faixa), valueRenderOption: 'FORMATTED_VALUE', majorDimension: 'ROWS' });
  } catch (e) {
    /* alguma aba da lista não existe mais: tenta de novo só com as que existem e corrige a lista */
    try {
      var existe = {}; ss.getSheets().forEach(function (sh) { existe[sh.getName()] = 1; });
      nomes = nomes.filter(function (n) { return existe[n]; });
      _perfListas[ctx] = lista.filter(function (n) { return existe[n]; });
      if (nomes.length < 2) return;
      r = Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: nomes.map(faixa), valueRenderOption: 'FORMATTED_VALUE', majorDimension: 'ROWS' });
    } catch (e2) { if (_perfStat) _perfStat.erros.push(String(e2 && e2.message || e2).slice(0, 120)); return; }
  }
  var vr = (r && r.valueRanges) || [];
  for (var j = 0; j < nomes.length && j < vr.length; j++) {
    var v = (vr[j] && vr[j].values) || [], w = 0;
    for (var a = 0; a < v.length; a++) if (v[a].length > w) w = v[a].length;
    var m = [];
    for (var b = 0; b < v.length; b++) { var lin = new Array(w); for (var c = 0; c < w; c++) lin[c] = v[b][c] == null ? '' : String(v[b][c]); m.push(lin); }
    _perfLote[nomes[j]] = m.length ? m : [['']];      // igual ao getDataRange().getDisplayValues() (conferido no ar: 44 abas idênticas)
  }
  if (_perfStat) { _perfStat.lotes.push(ctx + ':' + nomes.length + ' abas ' + (Date.now() - t0) + 'ms'); }
}
/* troca o "momento" (início / trava / pacote) e lê o lote dele; devolve o momento anterior */
function perfCtx_(ctx) { var antes = _perfCtx; _perfCtx = ctx; if (ctx) perfLote_(ctx); return antes; }
function perfCtxChave_(req) { return String(req && req.a || '') + (req && req.op ? ':' + String(req.op).slice(0, 30) : ''); }
function perfListasCarregar_(req) {
  _perfListas = {}; _perfListasAntes = {};
  if (!perfLoteLigado_()) return;
  var k = perfCtxChave_(req), ctxs = ['ini:' + k, 'trava:' + k, 'pac:dados', 'pac:boot', 'pac:adm', 'pac:est'];
  try {
    var g = CacheService.getScriptCache().getAll(ctxs.map(function (c) { return 'perf_l_' + c; }));
    ctxs.forEach(function (c) { var j = g['perf_l_' + c]; if (j) { _perfListasAntes[c] = j; try { _perfListas[c] = JSON.parse(j); } catch (e) {} } });
  } catch (e) {}
}
function perfListasGuardar_() {
  if (!perfLoteLigado_()) return;
  var novo = {};
  Object.keys(_perfUsou).forEach(function (c) {
    var l = (_perfListas[c] || []).slice();
    Object.keys(_perfUsou[c]).forEach(function (n) { if (l.indexOf(n) < 0) l.push(n); });
    l = l.slice(0, PERF_LOTE_MAX);
    var j = JSON.stringify(l);
    if (j !== _perfListasAntes[c]) novo['perf_l_' + c] = j;
  });
  try { if (Object.keys(novo).length) CacheService.getScriptCache().putAll(novo, 21600); } catch (e) {}
}

/* Ao ENTRAR numa trava (duas lojas gravando ao mesmo tempo), tudo é relido da planilha: quem relê
   "dentro da trava" para não fazer a mesma coisa duas vezes continua vendo o dado mais novo. */
function perfEsquecer_() { _perfMemo = {}; }
var _perfComTrava = typeof comTrava_ === 'function' ? comTrava_ : null;
if (_perfComTrava) comTrava_ = function (fn) {
  if (typeof _travaNivel === 'number' && _travaNivel > 0) return _perfComTrava(fn);
  return _perfComTrava(function () {
    perfEsquecer_(); _perfLote = {};
    var antes = _perfCtx ? perfCtx_('trava:' + _perfChave) : '';
    try { return fn(); } finally { if (antes) _perfCtx = antes; }
  });
};
var PERF_TRAVA_GERAL = false;   // true quando também deu para vigiar as travas do Código.gs (LockService direto)
try {
  var _perfGetLock = LockService.getScriptLock;
  LockService.getScriptLock = function () {
    var l = _perfGetLock.apply(LockService, arguments);
    return {
      waitLock: function (t) { var r = l.waitLock(t); perfEsquecer_(); return r; },
      tryLock: function (t) { var r = l.tryLock(t); if (r) perfEsquecer_(); return r; },
      releaseLock: function () { return l.releaseLock(); },
      hasLock: function () { return l.hasLock(); }
    };
  };
  PERF_TRAVA_GERAL = LockService.getScriptLock !== _perfGetLock;
} catch (e) { PERF_TRAVA_GERAL = false; }
/* se não deu para vigiar as travas do Código.gs, as abas dele não usam a cópia (fica como antes) */
var PERF_SO_DIRETO = { Pontos: 1, Solicitacoes: 1, Sangrias: 1, Ausencias: 1, Folgas: 1, Escala: 1, Aparelhos: 1, Log: 1 };
var _perfLerMemo = ler_;
ler_ = function (nome) {
  if (_perfCtx && arguments.length === 1) { var u = _perfUsou[_perfCtx] || (_perfUsou[_perfCtx] = {}); u[nome] = 1; }
  if (!PERF_TRAVA_GERAL && PERF_SO_DIRETO[nome]) return _perfLerDireto_.apply(this, arguments);
  return _perfLerMemo.apply(this, arguments);
};

/* Se alguém apagar uma coluna da planilha na mão, o conserto automático do cabeçalho continua valendo:
   na hora de GRAVAR, se faltar coluna, esquece o "já conferido" e deixa o Código.gs recriar as colunas. */
if (typeof cabecalho_ === 'function') {
  var _perfCab = cabecalho_;
  cabecalho_ = function (nome, sh) {
    var c = _perfCab.apply(this, arguments);
    try {
      if (typeof _abaOk === 'object' && _abaOk && ABAS[nome] && Array.isArray(c) && ABAS[nome].some(function (k) { return c.indexOf(k) < 0; })) {
        delete _abaOk[nome]; delete _perfAlca[nome];
        if (typeof _cabs === 'object' && _cabs) delete _cabs[nome];
        try { CacheService.getScriptCache().remove(perfAbaOkChave_()); } catch (e) {}
        c = _perfCab(nome, aba_(nome));
      }
    } catch (e) {}
    return c;
  };
}

/* Montar o pacote de dados que vai para o app (dadosColab_, admDados, boot_) só LÊ a planilha.
   Enquanto monta, cada aba é lida uma vez só (inclusive as que acabaram de ser gravadas pela venda);
   ao terminar, essa cópia é jogada fora. Se algo dentro do pacote pedir a aba para gravar, ela sai da cópia. */
var _perfPacote = 0, _perfPac = {}, _perfPacSujo = {};
function perfPacote_(fn, tipo) {
  return function () {
    var antes = null;
    if (_perfPacote === 0) { _perfPac = {}; _perfPacSujo = {}; if (_perfCtx) antes = perfCtx_('pac:' + tipo); }
    _perfPacote++;
    try { return fn.apply(this, arguments); }
    finally { _perfPacote--; if (_perfPacote === 0) { _perfPac = {}; _perfPacSujo = {}; } if (antes !== null) _perfCtx = antes; }
  };
}
if (typeof dadosColab_ === 'function') dadosColab_ = perfPacote_(dadosColab_, 'dados');
if (typeof boot_ === 'function') boot_ = perfPacote_(boot_, 'boot');
if (typeof ADMIN === 'object' && ADMIN && typeof ADMIN.admDados === 'function') ADMIN.admDados = perfPacote_(ADMIN.admDados, 'adm');
if (typeof estPacote_ === 'function') estPacote_ = perfPacote_(estPacote_, 'est');

/* cada chamada começa limpa (no Apps Script já começa; aqui é só garantia) */
var _perfRodar = rodar_;
rodar_ = function (req) {
  perfNovaExecucao_(); perfAbaOkCarregar_();
  var t0 = Date.now(), diag = !!(req && req._perf);
  if (diag) _perfStat = { diretas: 0, msDiretas: 0, abasDiretas: [], doLote: 0, lotes: [], erros: [] };
  var r;
  try {
    perfListasCarregar_(req);
    _perfChave = perfCtxChave_(req);
    perfCtx_('ini:' + _perfChave);
    r = _perfRodar.apply(this, arguments);
    if (diag && r && typeof r === 'object') { _perfStat.ms = Date.now() - t0; _perfStat.lote = perfLoteLigado_(); r._perf = _perfStat; }
    return r;
  } finally { try { perfListasGuardar_(); } catch (e) {} perfAbaOkGuardar_(); perfNovaExecucao_(); }
};
