/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PORTAL EQUIPE — AÇÕES LEVES (velocidade, etapa 1 · 11/11/2026)
   Duas ações novas que respondem rápido porque NÃO montam o pacote inteiro da colaboradora:
   • checarPin — só confere o PIN (equipe ou administração). Usada pelo motor da Kommo, pelas entregas
     e pelo comprovante para abrir a sessão (antes eles pediam "entrar"/"admDados" inteiros só para isso).
     Mesma regra de bloqueio por PIN errado do Código.gs (checarColab_ / checarAdmin_).
   • arena — o que a Arena da vendedora precisa a cada 30 s: vendas do mês (PDV + Kommo) e metas.
     Antes a Arena pedia o pacote inteiro (com o catálogo de produtos) a cada 30 s.
   Nenhuma regra muda. Nenhum arquivo existente é alterado.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR: Arquivos › + › Script › nome: LEVE — no FIM da lista (se houver PERF, o LEVE vem antes dele).
   Para desligar: apagar este arquivo e publicar Nova versão — o site e os serviços voltam sozinhos ao jeito antigo.
   ═══════════════════════════════════════════════════════════════ */

var _leveRodar = rodar_;
rodar_ = function (req) {
  var a = req && req.a;
  if (a === 'checarPin') {
    try {
      if (req.adminPin || req.adminPinHash) { checarAdmin_(req); return { ok: true, papel: 'admin' }; }
      var c = checarColab_(req);
      return { ok: true, papel: 'equipe', colaboradora: { id: c.id, nome: c.nome, loja: c.loja, cargo: c.cargo || '' } };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (a === 'arena') {
    try {
      checarColab_(req);
      try { if (typeof cx48AvisarAsVezes_ === 'function') cx48AvisarAsVezes_(); } catch (e1) {}   // como o "dados" fazia
      var hoje = hoje_(), ini = mesDe_(hoje) + '-01', kommo = [];
      try { if (typeof kmLinhasPdv_ === 'function') kommo = kmLinhasPdv_(ini); } catch (e2) {}
      return { ok: true, leve: 1, hoje: hoje, hora: hora_(), desde: ini, metas: painelMetas_(), vendas: pdvVendas_(ini, false), kommo: kommo };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _leveRodar.apply(this, arguments);
};

/* ───────── diagnóstico de velocidade (só lê; rodar pelo editor: escolher velDiag › Executar) ───────── */
function velDiag() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), abas = [];
  ss.getSheets().forEach(function (sh) {
    var t = Date.now(), v = sh.getDataRange().getDisplayValues(), ms = Date.now() - t;
    abas.push(sh.getName() + ' ' + v.length + 'x' + (v[0] ? v[0].length : 0) + ' ' + ms + 'ms ' + Math.round(JSON.stringify(v).length / 1024) + 'KB');
  });
  Logger.log('VELDIAG ABAS: ' + abas.join(' | '));
  var c = colabs_().filter(function (x) { return x.ativa === 'SIM'; })[0];
  [['boot', function () { return boot_(); }], ['dados', function () { return dadosColab_(c); }], ['dados2', function () { return dadosColab_(c); }], ['admDados', function () { return ADMIN.admDados({}); }]].forEach(function (p) {
    var reg = {}, n = 0, msLer = 0, orig = _perfLer;
    _perfLer = function (nome) { var t = Date.now(); var r = orig.apply(this, arguments); var d = Date.now() - t; n++; msLer += d; reg[nome] = (reg[nome] || 0) + d; return r; };
    if (typeof perfNovaExecucao_ === 'function') perfNovaExecucao_();
    _cfg = null; _abaOk = {}; _cabs = {};
    var t0 = Date.now(), r, kb = 0;
    try { r = p[1](); var tj = Date.now(); kb = Math.round(JSON.stringify(r).length / 1024); var msJson = Date.now() - tj; } catch (e) { r = { erro: String(e) }; }
    var tot = Date.now() - t0;
    _perfLer = orig;
    var top = Object.keys(reg).sort(function (a, b) { return reg[b] - reg[a]; }).slice(0, 12).map(function (k) { return k + ' ' + reg[k] + 'ms'; });
    Logger.log('VELDIAG ' + p[0] + ': total ' + tot + 'ms · leituras ' + n + ' (' + msLer + 'ms) · json ' + (msJson || 0) + 'ms · ' + kb + 'KB · PERF_TRAVA_GERAL=' + (typeof PERF_TRAVA_GERAL === 'undefined' ? '-' : PERF_TRAVA_GERAL) + ' · ' + top.join(', '));
  });
}

/* diagnóstico 2: a leitura em lote (API do Sheets) devolve exatamente o mesmo que a leitura normal? (só lê) */
function velDiag2() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), nomes = ss.getSheets().map(function (s) { return s.getName(); });
  var t = Date.now();
  var r = Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: nomes.map(function (n) { return "'" + n.replace(/'/g, "''") + "'"; }), valueRenderOption: 'FORMATTED_VALUE', majorDimension: 'ROWS' });
  var msLote = Date.now() - t, dif = [], tam = 0;
  nomes.forEach(function (n, i) {
    var a = ss.getSheetByName(n).getDataRange().getDisplayValues();
    var v = (r.valueRanges[i] && r.valueRanges[i].values) || [], w = 0;
    v.forEach(function (l) { if (l.length > w) w = l.length; });
    var b = v.length ? v.map(function (l) { var o = []; for (var j = 0; j < w; j++) o.push(l[j] == null ? '' : String(l[j])); return o; }) : [['']];
    var ja = JSON.stringify(a), jb = JSON.stringify(b); tam += jb.length;
    if (ja !== jb) {
      var k = 0; while (ja[k] === jb[k]) k++;
      dif.push(n + ' (' + a.length + 'x' + (a[0] || []).length + ' × ' + b.length + 'x' + (b[0] || []).length + ') normal: ' + ja.slice(Math.max(0, k - 40), k + 60) + ' ‖ lote: ' + jb.slice(Math.max(0, k - 40), k + 60));
    }
  });
  Logger.log('VELDIAG2 lote de ' + nomes.length + ' abas em ' + msLote + 'ms (' + Math.round(tam / 1024) + 'KB) · diferentes: ' + dif.length + (dif.length ? ' → ' + dif.join(' ||| ') : ''));
  var poucas = ['Config', 'Colaboradoras', 'Pontos', 'Eventos', 'Escala', 'Vendas', 'ChecklistFeito'];
  t = Date.now(); Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: poucas.map(function (n) { return "'" + n + "'"; }), valueRenderOption: 'FORMATTED_VALUE' });
  Logger.log('VELDIAG2 lote das 7 abas do boot: ' + (Date.now() - t) + 'ms');
  var semProd = nomes.filter(function (n) { return ['Produtos', 'Log', 'Arrumacao', 'VinculosNuvemshop', 'Clientes'].indexOf(n) < 0; });
  t = Date.now(); Sheets.Spreadsheets.Values.batchGet(ss.getId(), { ranges: semProd.map(function (n) { return "'" + n + "'"; }), valueRenderOption: 'FORMATTED_VALUE' });
  Logger.log('VELDIAG2 lote de ' + semProd.length + ' abas sem as grandes: ' + (Date.now() - t) + 'ms');
}

/* diagnóstico 3: monta "entrar" e "boot" 3 vezes com o código salvo (1ª vez aprende a lista, depois usa o lote). Só lê. */
function velDiag3() {
  var c = colabs_().filter(function (x) { return x.ativa === 'SIM'; })[0];
  for (var i = 1; i <= 3; i++) {
    perfNovaExecucao_(); _cfg = null; _abaOk = {}; _cabs = {}; perfAbaOkCarregar_();
    _perfStat = { diretas: 0, msDiretas: 0, abasDiretas: [], doLote: 0, lotes: [], erros: [] };
    var t = Date.now();
    perfListasCarregar_({ a: 'entrar' }); _perfChave = 'entrar'; perfCtx_('ini:entrar');
    colabs_(); var d = dadosColab_(c);
    var ms = Date.now() - t; perfListasGuardar_(); perfAbaOkGuardar_();
    Logger.log('VELDIAG3 entrar #' + i + ': ' + ms + 'ms · ' + Math.round(JSON.stringify(d).length / 1024) + 'KB · lotes ' + _perfStat.lotes.join(', ') + ' · diretas ' + _perfStat.diretas + ' (' + _perfStat.msDiretas + 'ms: ' + _perfStat.abasDiretas.join(' ') + ') · erros ' + _perfStat.erros.join(' '));
  }
  for (var j = 1; j <= 3; j++) {
    var t2 = Date.now(), r = rodar_({ a: 'boot', _perf: 1 });
    Logger.log('VELDIAG3 boot #' + j + ': ' + (Date.now() - t2) + 'ms · ' + JSON.stringify(r._perf));
  }
  perfNovaExecucao_();
}
