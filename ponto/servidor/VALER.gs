/* ═══════════ VALER.gs — v45: "começar pra valer" (fase de adaptação) ═══════════
   Colar no Apps Script como arquivo novo (Arquivos › + › Script › nome: VALER), ANTES do PERF
   (o PERF continua sendo o último da lista), e publicar Nova versão.

   1) O QUE A EQUIPE VÊ (Config › modulos)
      Administração › Ajustes › "O que a equipe vê" (perfil Matheus): liga/desliga cada tela do portal
      das vendedoras (Kommo, Arena, Metas…). Toda resposta que leva a colaboradora ou a equipe
      (boot, entrar, dados, admDados…) leva junto "modulosOff" = telas desligadas. Bater o ponto nunca some.

   2) ZERAR OS TESTES (ação admZerarTestes)
      op 'ver'   → mostra, aba por aba, o que vai sair (nada é apagado).
      op 'zerar' → faz uma CÓPIA da planilha inteira no Drive (pasta "Backups · Portal Las Vegas")
                   e só então apaga os registros de teste. Também desativa o usuário de teste.
      O que é "teste": tudo de antes do dia escolhido (padrão: hoje) nas abas de movimento
      (vendas do PDV, caixa, sangrias, checklist, cupons da roleta, campanha) + qualquer registro
      feito pelo usuário de teste (nome com "teste" ou "Matheus"), em qualquer dia.
      NÃO mexe em: Pontos das colaboradoras de verdade, produtos, fotos, mutirão (Arrumacao), clientes,
      compras antigas, configurações, pedidos do site (VendasSite), vendas da Kommo (a Kommo manda de novo) e Log. */

/* ───────── 1) módulos ───────── */
function modCfg_() {
  var m = {};
  try { m = JSON.parse(cfg_('modulos') || '{}') || {}; } catch (e) { m = {}; }
  return { off: Array.isArray(m.off) ? m.off : [], fase: m.fase || '', em: m.em || '', por: m.por || '', hist: Array.isArray(m.hist) ? m.hist.slice(0, 30) : [] };
}
ADMIN.admModulos = function (req) {
  if (req.op === 'salvar') {
    var atual = modCfg_(), antes = {};
    atual.off.forEach(function (k) { antes[k] = 1; });
    var off = [], visto = {};
    (Array.isArray(req.off) ? req.off : []).forEach(function (k) { k = String(k); if (/^[\w-]{1,30}$/.test(k) && !visto[k]) { visto[k] = 1; off.push(k); } });
    var lig = atual.off.filter(function (k) { return !visto[k]; }), des = off.filter(function (k) { return !antes[k]; });
    var por = String(req.por || 'Administração').slice(0, 40), hist = atual.hist;
    if (lig.length || des.length) hist.unshift({ em: agora_(), por: por, lig: lig, des: des });
    var novo = { off: off.slice(0, 80), fase: String(req.fase || '').slice(0, 40), em: agora_(), por: por, hist: hist.slice(0, 30) };
    setCfg_('modulos', JSON.stringify(novo));
    log_(por, 'o que a equipe vê', (des.length ? 'desligou ' + des.join(', ') : '') + (lig.length ? (des.length ? ' · ' : '') + 'ligou ' + lig.join(', ') : '') || 'sem mudança');
  }
  var r = modCfg_(); r.ok = true; r.valer = cfg_('valer_em') || '';
  return r;
};

/* ───────── 2) zerar os testes ───────── */
var VALER_ABAS = [
  // [aba (ou nomes alternativos), grupo, regra]  regra: 'antes' = antes do dia de corte OU do usuário de teste; 'teste' = só do usuário de teste
  [['VendasPDV'], 'vendas', 'antes'],
  [['Vendas'], 'vendas', 'antes'],
  [['Caixa'], 'caixa', 'antes'],
  [['CaixaHistorico'], 'caixa', 'antes'],
  [['Sangrias'], 'caixa', 'antes'],
  [['ChecklistFeitos'], 'rotina', 'antes'],
  [['ChecklistFeito'], 'rotina', 'antes'],
  [['CuponsRoleta'], 'rotina', 'antes'],
  [['Contatos'], 'rotina', 'antes'],
  [['CampPrints'], 'campanha', 'antes'],
  [['CampPremios'], 'campanha', 'antes'],
  [['CampContatos'], 'campanha', 'antes'],
  [['Solicitacoes'], 'ponto', 'teste'],
  [['Pontos'], 'ponto', 'teste'],
  [['Estoque'], 'estoque', 'tudo'],
  [['MovEstoque'], 'estoque', 'antes'],
  [['Contagens'], 'estoque', 'antes'],
  [['ContagemLeituras'], 'estoque', 'antes'],
  [['Transferencias'], 'estoque', 'antes'],
  [['Entradas'], 'estoque', 'antes']
];
var VALER_GRUPOS = { vendas: 'Vendas do PDV e totais do dia', caixa: 'Caixa, fechamentos e sangrias', rotina: 'Checklist, cupons da roleta e contatos', campanha: 'Campanha (prints e prêmios)', ponto: 'Ponto e pedidos do usuário de teste', estoque: 'Estoque de teste (saldo volta a zero para o levantamento)' };
var VALER_DATA = ['data', 'criada_em', 'criado_em', 'quando', 'enviado_em', 'em', 'ref', 'semana', 'lancado_em'];
var VALER_QUEM = ['colaboradora_id', 'colaboradora', 'por', 'tirou', 'conferiu', 'lancado_por', 'nome'];

function valerTeste_() {
  var ids = {}, nomes = {}, lista = [];
  ler_('Colaboradoras').forEach(function (c) {
    if (/teste|matheus/i.test(String(c.nome || '') + ' ' + String(c.id || ''))) { ids[c.id] = 1; nomes[norm_(c.nome)] = 1; lista.push({ id: c.id, nome: c.nome, ativa: c.ativa, _linha: c._linha }); }
  });
  return { ids: ids, nomes: nomes, lista: lista };
}
function valerSheet_(nomes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < nomes.length; i++) { var sh = ss.getSheetByName(nomes[i]); if (sh) return sh; }
  return null;
}
function valerData_(o) {
  for (var i = 0; i < VALER_DATA.length; i++) { var v = String(o[VALER_DATA[i]] || ''); if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10); }
  return '';
}
function valerQuem_(o) {
  for (var i = 0; i < VALER_QUEM.length; i++) { var v = String(o[VALER_QUEM[i]] || '').trim(); if (v) return v; }
  return '';
}
function valerDoTeste_(o, T) {
  for (var i = 0; i < VALER_QUEM.length; i++) {
    var v = String(o[VALER_QUEM[i]] || '').trim();
    if (v && (T.ids[v] || T.nomes[norm_(v)])) return true;
  }
  return false;
}
/** Lê uma aba e separa as linhas que saem. Não grava nada. */
function valerPlano_(def, corte, T, grupos) {
  var sh = valerSheet_(def[0]);
  var r = { aba: def[0][0], nomes: def[0], grupo: def[1], regra: def[2], existe: !!sh, total: 0, sai: 0, linhas: [], ex: [], quem: {} };
  if (!sh || !grupos[def[1]]) return r;
  var v = sh.getDataRange().getDisplayValues(), cab = v.shift();
  v.forEach(function (l, i) {
    if (l.join('') === '') return;
    r.total++;
    var o = {}; cab.forEach(function (c, j) { o[c] = l[j]; });
    var d = valerData_(o), teste = valerDoTeste_(o, T);
    var sai = def[2] === 'tudo' || teste || (def[2] === 'antes' && d && d < corte);
    if (!sai) return;
    r.sai++; r.linhas.push(i + 2);
    var q = valerQuem_(o) || '—'; r.quem[q] = (r.quem[q] || 0) + 1;
    if (r.ex.length < 4) r.ex.push({ data: d, quem: q, valor: o.total || o.valor || o.qtd || '' });
  });
  return r;
}
function valerPlanoTudo_(req) {
  var corte = /^\d{4}-\d{2}-\d{2}$/.test(String(req.corte || '')) ? String(req.corte) : hoje_();
  var grupos = {}; Object.keys(VALER_GRUPOS).forEach(function (g) { grupos[g] = !(req.grupos && req.grupos[g] === false); });
  var T = valerTeste_();
  return { corte: corte, grupos: grupos, teste: T, abas: VALER_ABAS.map(function (d) { return valerPlano_(d, corte, T, grupos); }) };
}
function valerResumo_(P) {
  return {
    ok: true, corte: P.corte, hoje: hoje_(), grupos: P.grupos, nomesGrupos: VALER_GRUPOS, valer: cfg_('valer_em') || '',
    usuariosTeste: P.teste.lista.map(function (c) { return { id: c.id, nome: c.nome, ativa: c.ativa }; }),
    abas: P.abas.map(function (a) { return { aba: a.aba, grupo: a.grupo, regra: a.regra, existe: a.existe, total: a.total, sai: a.sai, ex: a.ex, quem: a.quem }; }),
    totalSai: P.abas.reduce(function (s, a) { return s + a.sai; }, 0)
  };
}
function valerBackup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), props = PropertiesService.getScriptProperties(), pasta = null, id = props.getProperty('BACKUP_PASTA');
  if (id) { try { pasta = DriveApp.getFolderById(id); } catch (e) { pasta = null; } }
  if (!pasta) {
    var pais = DriveApp.getFileById(ss.getId()).getParents(), pai = pais.hasNext() ? pais.next() : DriveApp.getRootFolder();
    pasta = pai.createFolder('Backups · Portal Las Vegas'); props.setProperty('BACKUP_PASTA', pasta.getId());
  }
  var nome = 'Antes de começar pra valer · ' + agora_().slice(0, 16).replace(' ', ' às ');
  var copia = DriveApp.getFileById(ss.getId()).makeCopy(nome, pasta);
  return { nome: nome, url: copia.getUrl() };
}
function valerZerar_(req) {
  var P = valerPlanoTudo_(req), resumo = valerResumo_(P);
  if (!resumo.totalSai && !(req.desativarTeste && P.teste.lista.some(function (c) { return c.ativa === 'SIM'; }))) { resumo.feito = { apagadas: 0, backup: null }; return resumo; }
  var bk = valerBackup_(), apagadas = 0;
  P.abas.forEach(function (a) {
    if (!a.sai) return;
    var sh = valerSheet_(a.nomes);
    a.linhas.sort(function (x, y) { return y - x; }).forEach(function (n) { sh.deleteRow(n); apagadas++; });
  });
  var desativados = [];
  if (req.desativarTeste !== false) {
    var shC = valerSheet_(['Colaboradoras']), cab = shC.getRange(1, 1, 1, shC.getLastColumn()).getDisplayValues()[0], col = cab.indexOf('ativa') + 1;
    if (col > 0) P.teste.lista.forEach(function (c) { if (c.ativa === 'SIM') { shC.getRange(c._linha, col).setValue('NÃO'); desativados.push(c.nome); } });
  }
  setCfg_('valer_em', agora_());
  log_(String(req.por || 'Administração'), 'zerar testes', 'corte ' + P.corte + ' · ' + apagadas + ' linhas · backup: ' + bk.nome + (desativados.length ? ' · desativado: ' + desativados.join(', ') : ''));
  var depois = valerResumo_(valerPlanoTudo_(req));
  depois.feito = { apagadas: apagadas, backup: bk, desativados: desativados, porAba: P.abas.filter(function (a) { return a.sai; }).map(function (a) { return { aba: a.aba, sai: a.sai }; }) };
  return depois;
}
ADMIN.admZerarTestes = function (req) {
  if (req.op === 'zerar') {
    if (String(req.confirmar || '').trim().toUpperCase() !== 'ZERAR') throw new Error('Digite ZERAR para confirmar');
    return valerZerar_(req);   // o rodar_ do Código.gs já roda as ações de administração dentro da trava (comTrava_)
  }
  return valerResumo_(valerPlanoTudo_(req));
};

/* toda resposta que leva a equipe também leva as telas desligadas */
var _valerRodar = rodar_;
rodar_ = function (req) {
  var r = _valerRodar(req);
  try {
    if (r && typeof r === 'object' && r.ok !== false && (r.colaboradora || r.colaboradoras || r.equipe)) r.modulosOff = modCfg_().off;
  } catch (e) {}
  return r;
};
