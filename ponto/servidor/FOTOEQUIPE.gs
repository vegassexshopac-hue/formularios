/* ═══════════ FOTOEQUIPE.gs — v39: foto de cada colaboradora ═══════════
   Colar no Apps Script como arquivo novo (Arquivos › + › Script › FOTOEQUIPE), depois dos outros, e publicar Nova versão.
   • Coluna nova "foto" na aba Colaboradoras (criada sozinha).
   • Administração › Equipe e ponto › Cadastro da equipe › tocar na colaboradora › Foto (ação admFotoColab).
   • A foto vai para o Drive › pasta de anexos › "Fotos da equipe" (a antiga vai para a lixeira ao trocar).
   • Toda resposta que traz a equipe (boot, entrar, admDados…) leva junto "fotosEquipe" = {id: link da foto},
     e o site troca as iniciais pela foto onde aparece o avatar. */

if (typeof ABAS !== 'undefined' && ABAS.Colaboradoras && ABAS.Colaboradoras.indexOf('foto') < 0) ABAS.Colaboradoras.push('foto');

function feqMapa_() {
  var m = {};
  colabs_().forEach(function (c) { if (c && c.id && c.foto) m[c.id] = String(c.foto); });
  return m;
}
function feqIdDrive_(u) { var m = String(u || '').match(/[?&]id=([\w-]+)/); return m ? m[1] : ''; }

function feqSalvar_(req) {
  var c = colabs_().filter(function (x) { return x.id === req.id; })[0];
  if (!c) throw new Error('Colaboradora não encontrada');
  var antigo = feqIdDrive_(c.foto);
  if (req.remover) c.foto = '';
  else {
    var b64 = String((req.foto && req.foto.base64) || req.foto || '').replace(/^data:image\/\w+;base64,/, '');
    var bytes = b64 ? Utilities.base64Decode(b64) : [];
    if (bytes.length < 1500) throw new Error('Escolha uma foto');
    if (bytes.length > 900 * 1024) throw new Error('Foto grande demais — escolha outra');
    var raiz = pastaAnexos_(), it = raiz.getFoldersByName('Fotos da equipe');
    var pasta = it.hasNext() ? it.next() : raiz.createFolder('Fotos da equipe');
    var arq = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', String(c.nome || c.id).slice(0, 60) + ' - ' + hoje_() + '.jpg'));
    arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    c.foto = 'https://drive.google.com/thumbnail?id=' + arq.getId() + '&sz=w400';
  }
  gravar_('Colaboradoras', c);
  if (antigo) { try { DriveApp.getFileById(antigo).setTrashed(true); } catch (e) {} }
  log_('Administração', 'foto da colaboradora', String(c.nome || c.id) + (req.remover ? ' · removida' : ' · nova'));
}

ADMIN.admFotoColab = function (req) {
  if (typeof comTrava_ === 'function') comTrava_(function () { feqSalvar_(req); });
  else feqSalvar_(req);
  return ADMIN.admDados(req);
};

var _feqRodar = rodar_;
rodar_ = function (req) {
  var r = _feqRodar(req);
  try {
    if (r && typeof r === 'object' && r.ok !== false && (r.colaboradoras || r.equipe || r.colaboradora)) r.fotosEquipe = feqMapa_();
  } catch (e) {}
  return r;
};
