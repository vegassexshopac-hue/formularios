/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · ROLETA DO SITE (liga / desliga / teste)
   Arquivo SEPARADO — fica DEPOIS do Código.gs e do PDV.gs.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: ROLETA
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   O site (Nuvemshop) pergunta aqui se a roleta está ligada.
   A administração muda em: Portal › Administração › Roleta do site.
   ═══════════════════════════════════════════════════════════════ */

var ROLETA_MODOS = ['desligada', 'teste', 'ligada'];
var ROLETA_PADRAO = { modo: 'teste' };
CONFIG_PADRAO.push(['roleta', JSON.stringify(ROLETA_PADRAO), 'Roleta do site (JSON): modo = desligada | teste | ligada']);

function roletaCfg_() {
  var c = cfgJson_('roleta', {}) || {};
  var modo = ROLETA_MODOS.indexOf(c.modo) >= 0 ? c.modo : ROLETA_PADRAO.modo;
  return { modo: modo, atualizado_em: c.atualizado_em || '', por: c.por || '' };
}

/** Resposta pública e leve: só o modo. Fica 60 s em cache para não pesar na planilha. */
function roletaPublico_() {
  var cache = CacheService.getScriptCache();
  var modo = cache.get('roleta_modo');
  if (!modo) { modo = roletaCfg_().modo; cache.put('roleta_modo', modo, 60); }
  return { ok: true, modo: modo };
}

/* O site pergunta com ?a=roleta (GET) ou {"a":"roleta"} (POST). Entra pelo mesmo caminho das outras ações. */
var _rolRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'roleta') { try { return roletaPublico_(); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; } }
  return _rolRodar(req);
};

/* ───────── administração ───────── */
var _rolAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _rolAdmDados(req);
  try { d.roleta = roletaCfg_(); } catch (e) { d.roleta = { erro: String(e && e.message || e) }; }
  return d;
};

var _rolAdmConfig = ADMIN.admConfig;
ADMIN.admConfig = function (req) {
  if (req.chave === 'roleta') {
    var v; try { v = JSON.parse(String(req.valor)); } catch (e) { throw new Error('Formato inválido'); }
    if (ROLETA_MODOS.indexOf(v.modo) < 0) throw new Error('Escolha desligada, teste ou ligada');
    setCfg_('roleta', JSON.stringify({ modo: v.modo, atualizado_em: agora_(), por: 'Administração' }));
    CacheService.getScriptCache().remove('roleta_modo');
    log_('Administração', 'roleta do site', v.modo);
    return ADMIN.admDados();
  }
  return _rolAdmConfig(req);
};
