/* ═══════════ KOMMO.gs — vendas ganhas na Kommo entram no PDV (metas, Arena, ranking) ═══════════
   Colar no Apps Script como o ÚLTIMO arquivo e publicar Nova versão.
   Quem manda: o motor da Kommo (Railway), a cada 5 min, com a chave guardada nas Propriedades do Script
   (KOMMO_SEGREDO — gerada pela própria administração, ninguém digita).
   Cada lead entra uma vez na aba VendasKommo e soma na linha do dia da atendente (aba Vendas).
   Se o valor, a atendente ou a data mudarem, corrige; se o lead sair de "venda ganha", tira. Nada é apagado. */
ABAS.VendasKommo = ['lead', 'data', 'loja', 'colaboradora_id', 'colaboradora', 'valor', 'status', 'criado_em', 'atualizado_em'];

function kmTrava_(fn) {
  if (typeof comTrava_ === 'function') return comTrava_(fn);
  var l = LockService.getScriptLock(); l.waitLock(20000);
  try { return fn(); } finally { l.releaseLock(); }
}
function kmLoja_(c, data) {
  var lojas = JSON.parse(cfg_('lojas') || '{}'), p = pontoDe_(c.id, data);
  return (p && lojas[p.loja]) ? p.loja : (lojas[c.loja] ? c.loja : Object.keys(lojas)[0]);
}
function kmAplicar_(row, sinal, quem) {
  var c = colabs_().filter(function (x) { return x.id === row.colaboradora_id; })[0] || { id: row.colaboradora_id, nome: row.colaboradora };
  pdvAgregar_(row.data, row.loja, c, sinal * (Number(row.valor) || 0), quem);
}
function kmVendas_(req) {
  var segredo = PropertiesService.getScriptProperties().getProperty('KOMMO_SEGREDO');
  if (!segredo || String(req.segredo || '') !== segredo) return { ok: false, erro: 'Chave da Kommo não confere' };
  var mes = String(req.mes || '');
  if (!/^\d{4}-\d{2}$/.test(mes)) return { ok: false, erro: 'Mês inválido' };
  var lista = (req.lista || []).filter(function (x) { return x && x.lead && x.eid && /^\d{4}-\d{2}-\d{2}$/.test(String(x.data)) && String(x.data).slice(0, 7) === mes; });
  return kmTrava_(function () {
    var colabs = {}; colabs_().forEach(function (c) { colabs[c.id] = c; });
    var linhas = ler_('VendasKommo'), porLead = {};
    linhas.forEach(function (r) { if (r.status === 'ok') porLead[r.lead] = r; });
    var vistos = {}, res = { novas: 0, corrigidas: 0, tiradas: 0, iguais: 0, ignoradas: 0 };
    lista.forEach(function (x) {
      var lead = String(x.lead), c = colabs[String(x.eid)];
      if (!c) { res.ignoradas++; return; }
      vistos[lead] = true;
      var valor = Math.round((Number(x.valor) || 0) * 100) / 100, data = String(x.data), atual = porLead[lead];
      if (atual && atual.colaboradora_id === c.id && atual.data === data && Math.abs((Number(atual.valor) || 0) - valor) < 0.005) { res.iguais++; return; }
      if (atual) { kmAplicar_(atual, -1, 'Kommo'); atual.status = 'corrigida'; atual.atualizado_em = agora_(); gravar_('VendasKommo', atual); res.corrigidas++; }
      else res.novas++;
      var nova = { lead: lead, data: data, loja: kmLoja_(c, data), colaboradora_id: c.id, colaboradora: c.nome, valor: String(valor), status: 'ok', criado_em: agora_(), atualizado_em: agora_() };
      gravar_('VendasKommo', nova);
      kmAplicar_(nova, 1, 'Kommo');
    });
    // saiu de "venda ganha" (ou da atendente) neste mês → tira do PDV
    Object.keys(porLead).forEach(function (lead) {
      var r = porLead[lead];
      if (vistos[lead] || String(r.data).slice(0, 7) !== mes) return;
      kmAplicar_(r, -1, 'Kommo'); r.status = 'removida'; r.atualizado_em = agora_(); gravar_('VendasKommo', r); res.tiradas++;
    });
    if (res.novas || res.corrigidas || res.tiradas) log_('Kommo', 'vendas sincronizadas', mes + ' · ' + JSON.stringify(res));
    return { ok: true, resumo: res };
  });
}

/* ───────── ação pública (só com a chave): a = 'kommoVendas' ───────── */
var _kmRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'kommoVendas') { try { return kmVendas_(req); } catch (e) { return { ok: false, erro: String(e && e.message || e) }; } }
  return _kmRodar(req);
};

/* ───────── administração: a = 'admKommo' ───────── */
ADMIN.admKommo = function (req) {
  if (req.op === 'segredo') {
    var s = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    PropertiesService.getScriptProperties().setProperty('KOMMO_SEGREDO', s);
    log_('Administração', 'chave da Kommo gerada', '');
    return { ok: true, segredo: s };
  }
  if (req.op === 'lista') {
    var mes = String(req.mes || hoje_().slice(0, 7));
    return { ok: true, vendas: ler_('VendasKommo').filter(function (r) { return String(r.data).slice(0, 7) === mes && r.status === 'ok'; }).map(limpar_) };
  }
  return { ok: false, erro: 'Operação desconhecida' };
};

/* ───────── v33: vendas da Kommo aparecem na Arena ("Acabou de vender", flash, nº de vendas e ticket) ─────────
   Vão junto do pacote do PDV como "kommo" (sem produto nenhum — discrição). Não mexem na meta: ela já soma pela aba Vendas. */
function kmLinhasPdv_(desde) {
  return ler_('VendasKommo').filter(function (r) { return r.status === 'ok' && String(r.data) >= desde; }).map(function (r) {
    return { lead: String(r.lead), data: String(r.data), loja: r.loja, colaboradora_id: r.colaboradora_id, colaboradora: r.colaboradora, valor: Number(r.valor) || 0, criado_em: String(r.criado_em || '') };
  });
}
var _kmDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _kmDadosColab(c);
  try { if (d.pdv && !d.pdv.erro) d.pdv.kommo = kmLinhasPdv_(mesDe_(hoje_()) + '-01'); } catch (e) {}
  return d;
};
var _kmAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _kmAdmDados(req);
  try { if (d.pdv && !d.pdv.erro) d.pdv.kommo = kmLinhasPdv_(diaMais_(-62)); } catch (e) {}
  return d;
};
var _kmAoVivo = ADMIN.admAoVivo;
ADMIN.admAoVivo = function (req) {
  var d = _kmAoVivo(req);
  try { d.kommoMes = kmLinhasPdv_(mesDe_(hoje_()) + '-01'); } catch (e) {}
  return d;
};
