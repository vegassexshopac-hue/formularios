/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PORTAL EQUIPE — DESEMPENHO (v32)
   Deixa o servidor mais rápido SEM mudar nenhuma regra:
   • Cada aba da planilha é lida no máximo UMA vez por chamada (antes a mesma aba era lida 3 a 10 vezes
     numa venda — Produtos, VendasPDV, Estoque, Clientes…).
   • Segurança: assim que qualquer parte do código pega a aba para GRAVAR (aba_), aquela aba deixa de
     usar a cópia e volta a ser lida direto da planilha até o fim da chamada. Nada fica desatualizado.
   • Cada chamada do Apps Script começa do zero (nada passa de uma chamada para outra).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: PERF  (o ÚLTIMO da lista, depois de todos os outros)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   Para desligar: apague este arquivo e publique Nova versão (tudo volta a ser como antes).
   ═══════════════════════════════════════════════════════════════ */

var _perfMemo = {}, _perfGravando = {}, _perfLendo = 0;
var _perfAba = aba_, _perfLer = ler_;

function perfNovaExecucao_() { _perfMemo = {}; _perfGravando = {}; _perfLendo = 0; _perfAlca = {}; }
function perfCopia_(linhas) {
  var out = new Array(linhas.length);
  for (var i = 0; i < linhas.length; i++) { var o = {}, r = linhas[i]; for (var k in r) o[k] = r[k]; out[i] = o; }
  return out;
}

/* quem pede a aba fora do ler_ pode gravar nela: a partir daí essa aba é sempre lida da planilha.
   A "alça" da aba é guardada durante a chamada (antes a Config, por exemplo, era procurada 14 vezes). */
var _perfAlca = {};
aba_ = function (nome) {
  if (!_perfLendo) { _perfGravando[nome] = true; delete _perfMemo[nome]; if (_perfPacote > 0) { _perfPacSujo[nome] = true; delete _perfPac[nome]; } }
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
function _perfLerDireto_() {
  _perfLendo++;
  try { return _perfLer.apply(this, arguments); } finally { _perfLendo--; }
}

/* Ao ENTRAR numa trava (duas lojas gravando ao mesmo tempo), tudo é relido da planilha: quem relê
   "dentro da trava" para não fazer a mesma coisa duas vezes continua vendo o dado mais novo. */
function perfEsquecer_() { _perfMemo = {}; }
var _perfComTrava = typeof comTrava_ === 'function' ? comTrava_ : null;
if (_perfComTrava) comTrava_ = function (fn) {
  if (typeof _travaNivel === 'number' && _travaNivel > 0) return _perfComTrava(fn);
  return _perfComTrava(function () { perfEsquecer_(); return fn(); });
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
function perfPacote_(fn) {
  return function () {
    if (_perfPacote === 0) { _perfPac = {}; _perfPacSujo = {}; }
    _perfPacote++;
    try { return fn.apply(this, arguments); }
    finally { _perfPacote--; if (_perfPacote === 0) { _perfPac = {}; _perfPacSujo = {}; } }
  };
}
if (typeof dadosColab_ === 'function') dadosColab_ = perfPacote_(dadosColab_);
if (typeof boot_ === 'function') boot_ = perfPacote_(boot_);
if (typeof ADMIN === 'object' && ADMIN && typeof ADMIN.admDados === 'function') ADMIN.admDados = perfPacote_(ADMIN.admDados);
if (typeof estPacote_ === 'function') estPacote_ = perfPacote_(estPacote_);

/* cada chamada começa limpa (no Apps Script já começa; aqui é só garantia) */
var _perfRodar = rodar_;
rodar_ = function (req) {
  perfNovaExecucao_(); perfAbaOkCarregar_();
  try { return _perfRodar.apply(this, arguments); } finally { perfAbaOkGuardar_(); perfNovaExecucao_(); }
};
