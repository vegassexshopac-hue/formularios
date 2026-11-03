/* ═══════════ PONTOCEL.gs — v30: ponto pelo celular com QR Code da loja + selfie ═══════════
   Colar no Apps Script como o ÚLTIMO arquivo (Arquivos › + › Script › PONTOCEL) e publicar Nova versão.

   Como funciona
   • O computador autorizado da loja mostra um QR Code que muda a cada ~40 s (ação 'qrPonto', com o token do computador).
     O código vale 2 minutos e fica só no cache do servidor, ligado ao computador que o mostrou.
   • A colaboradora lê o QR com o celular dela, tira a selfie e toca em "Registrar" (ação 'baterCel', com PIN).
     O servidor confere o código e bate o ponto exatamente como se fosse no computador da loja (mesma regra,
     mesma loja, hora do servidor). Ler o QR prova que ela está na loja; a selfie prova que é ela.
   • O token do computador NUNCA sai no QR: o celular só recebe um código curto que vence sozinho.
   • Liga/desliga: Administração › Regras › "Ponto pelo celular (QR Code + selfie)". Padrão: ligado.
     Fica nas Propriedades do Script (PONTO_CELULAR = SIM/NÃO).
   • O ponto pelo computador com PIN continua funcionando (plano B: celular sem bateria ou sem internet). */

var PC_VALIDADE_SEG = 120;
var PC_LETRAS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function pcLigado_() {
  var v = PropertiesService.getScriptProperties().getProperty('PONTO_CELULAR');
  return v !== 'NÃO';
}
function pcCodigoNovo_() {
  var s = '';
  for (var i = 0; i < 6; i++) s += PC_LETRAS.charAt(Math.floor(Math.random() * PC_LETRAS.length));
  return s;
}
function pcLimpaCodigo_(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }

/* computador da loja pede um QR novo */
function pcQr_(req) {
  if (!pcLigado_()) return { ok: true, desligado: true };
  var token = String(req.token || '');
  if (!token) return { ok: false, erro: 'Este computador não está autorizado' };
  var cache = CacheService.getScriptCache(), chaveAp = 'pcap_' + token.slice(0, 200), ap = null;
  var guardado = cache.get(chaveAp);
  if (guardado) ap = JSON.parse(guardado);
  else {
    var r = _pcRodar({ a: 'aparelho', token: token });
    if (!r || r.ok === false || !r.aparelho) return { ok: false, erro: 'Este computador não está autorizado' };
    ap = { loja: r.aparelho.loja, nome: r.aparelho.nome || '' };
    cache.put(chaveAp, JSON.stringify(ap), 300);
  }
  var codigo = pcCodigoNovo_();
  cache.put('pc_' + codigo, JSON.stringify({ token: token, loja: ap.loja, aparelho: ap.nome, ate: new Date().getTime() + PC_VALIDADE_SEG * 1000 }), PC_VALIDADE_SEG + 30);
  return { ok: true, codigo: codigo, validade: PC_VALIDADE_SEG, loja: ap.loja };
}

/* celular da colaboradora bate o ponto */
function pcBater_(req) {
  if (!pcLigado_()) return { ok: false, erro: 'O ponto pelo celular está desligado. Bata no computador da loja.' };
  var codigo = pcLimpaCodigo_(req.codigo);
  var raw = codigo ? CacheService.getScriptCache().get('pc_' + codigo) : null;
  var q = raw ? JSON.parse(raw) : null;
  if (!q || !(q.ate > new Date().getTime())) return { ok: false, erro: 'QR Code vencido ou inválido. Leia de novo o QR Code que está na tela do computador da loja.', qrVencido: true };
  var c = checarColab_(req);                                   // PIN confere antes de qualquer coisa
  var b64 = String((req.foto && req.foto.base64) || req.foto || '').replace(/^data:image\/\w+;base64,/, '');
  var bytes = b64 ? Utilities.base64Decode(b64) : [];
  if (bytes.length < 1500) return { ok: false, erro: 'Tire a selfie para bater o ponto 📸' };
  if (bytes.length > 900 * 1024) return { ok: false, erro: 'Foto grande demais — tire de novo' };

  var pedido = {};
  for (var k in req) if (k !== 'a' && k !== 'codigo' && k !== 'token' && k !== 'foto') pedido[k] = req[k];
  pedido.a = 'bater'; pedido.token = q.token; pedido.foto = { base64: b64 };
  var r = _pcRodar(pedido);
  if (!r || r.ok === false) return r || { ok: false, erro: 'Não consegui registrar' };

  var link = '';
  if (String(cfg_('foto_ponto') || '') !== 'SIM') {          // se a foto do ponto estiver desligada, a selfie fica guardada aqui
    try {
      var raiz = pastaAnexos_(), it = raiz.getFoldersByName('Ponto pelo celular - selfies');
      var pasta = it.hasNext() ? it.next() : raiz.createFolder('Ponto pelo celular - selfies');
      var nome = hoje_() + ' ' + hora_().replace(':', 'h') + ' ' + String(req.campo || '') + ' - ' + String(c.nome || '').slice(0, 40) + '.jpg';
      var arq = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', nome));
      link = 'https://drive.google.com/file/d/' + arq.getId() + '/view';
    } catch (e) {}
  }
  log_(c.nome, 'ponto pelo celular', String(req.campo || '') + ' · loja ' + q.loja + (link ? ' · selfie: ' + link : ''));
  r.via = 'celular'; r.lojaPonto = q.loja;
  return r;
}

var _pcRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'qrPonto') { try { return pcQr_(req); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; } }
  if (req && req.a === 'baterCel') { try { return pcBater_(req); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; } }
  var r = _pcRodar(req);
  if (req && req.a === 'boot' && r && r.ok !== false) { try { r.pontoCelular = pcLigado_(); } catch (e) {} }
  return r;
};

var _pcAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _pcAdmDados(req);
  try { d.pontoCelular = pcLigado_(); } catch (e) {}
  return d;
};
ADMIN.admPontoCel = function (req) {
  var liga = req.valor === true || req.valor === 'SIM';
  PropertiesService.getScriptProperties().setProperty('PONTO_CELULAR', liga ? 'SIM' : 'NÃO');
  log_('Administração', 'ponto pelo celular', liga ? 'ligado' : 'desligado');
  return ADMIN.admDados(req);
};
