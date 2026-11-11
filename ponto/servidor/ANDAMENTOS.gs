/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · HISTÓRICO DE ANDAMENTOS (Portal Equipe · v54)
   Arquivo SEPARADO — fica por ÚLTIMO (… → CAIXA → MISSAO → ANDAMENTOS).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: ANDAMENTOS
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   Não cria aba nova: lê a aba Log, onde o portal já anota tudo o que cada pessoa faz
   (ponto, venda, caixa, sangria, estoque, produtos, pedidos do site, campanha, pedidos…).
   Só a administração enxerga (ação admAndamentos, com o PIN da administração).
   Roda no runtime antigo (Rhino): só ES5.
   ═══════════════════════════════════════════════════════════════ */

var AND_MAX_DIAS = 62;      // período máximo de uma consulta
var AND_MAX_LINHAS = 6000;  // linhas devolvidas por consulta (as mais novas)
var AND_JANELA = 30000;     // quantas linhas do fim do Log são lidas (o Log só cresce para baixo)

function andData_(v, padrao) { var t = String(v || ''); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : padrao; }

/* A coluna "quando" é texto aaaa-mm-dd hh:mm:ss; se alguma linha tiver virado data na planilha (dd/mm/aaaa), arruma. */
function andQuando_(v) {
  var t = String(v || ''), m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
  return m ? m[3] + '-' + m[2] + '-' + m[1] + m[4] : t;
}

/* Lê só o fim da aba Log (as linhas mais novas), sem carregar a aba inteira. */
function andLerLog_() {
  var sh = aba_('Log'), ultima = sh.getLastRow();
  if (ultima < 2) return [];
  var n = Math.min(ultima - 1, AND_JANELA);
  return sh.getRange(ultima - n + 1, 1, n, 4).getDisplayValues();
}

/* {de, ate} (aaaa-mm-dd) → linhas do período, da mais nova para a mais antiga. */
ADMIN.admAndamentos = function (req) {
  var hoje = hoje_(), ate = andData_(req.ate, hoje), de = andData_(req.de, diaMais_(-6));
  if (de > ate) { var t = de; de = ate; ate = t; }
  var limite = diaMais_(-AND_MAX_DIAS);
  var linhas = [], cortado = false, v = andLerLog_();
  for (var i = v.length - 1; i >= 0; i--) {
    var q = andQuando_(v[i][0]), dia = q.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;
    if (dia > ate) continue;
    if (dia < de) break;                      // o Log está em ordem de data: dali para cima é mais antigo
    if (linhas.length >= AND_MAX_LINHAS) { cortado = true; break; }
    linhas.push({ q: q, quem: String(v[i][1] || ''), acao: String(v[i][2] || ''), det: String(v[i][3] || '').slice(0, 300) });
  }
  var equipe = colabs_().filter(function (c) { return c.ativa === 'SIM'; }).map(function (c) { return { id: c.id, nome: c.nome }; });
  return { ok: true, de: de, ate: ate, hoje: hoje, agora: agora_(), limite: limite, cortado: cortado, linhas: linhas, equipe: equipe };
};
