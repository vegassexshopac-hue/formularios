/* ═══════════ v65: Relatórios no WhatsApp (24/11/2026) ═══════════
   Pedido da Madu: quando o caixa for fechado, chegar no WhatsApp dela e do Matheus o relatório do dia
   (vendido, quem vendeu mais, lojas, formas de pagamento, campanha, meta do mês e ponto); e uma mensagem
   a cada ponto batido. Já fica pronto para as colaboradoras (confirmação do ponto + "seu dia" com a meta),
   só falta o número e ligar a chave de cada uma.
   • Sai do WhatsApp da loja pela Evolution API (mesma chave EVOLUTION_KEY dos avisos do caixa).
   • Relatório: quando o ÚLTIMO caixa do dia fecha. Se alguma loja não fechar até 30 min depois do horário,
     sai assim mesmo com o aviso. Se um caixa for refeito depois, manda de novo marcado "atualizado".
   • Discrição: nunca vai nome de cliente nem produto.
   • Configuração: Config › relatorio65 (Administração › Comunicação › Relatórios no WhatsApp, perfil Matheus).
   • Arquivo novo: vai por último no Apps Script. Para desligar tudo: chave geral na tela. */

var REL65_PADRAO = {
  ligado: true,
  admins: [
    { id: 'madu', nome: 'Madu', numero: '556896018996', ligado: true, tipos: { relatorio: true, ponto: true, intervalo: false, so_atraso: false } },
    { id: 'matheus', nome: 'Matheus', numero: '556892496323', ligado: true, tipos: { relatorio: true, ponto: true, intervalo: false, so_atraso: false } }
  ],
  equipe: {},                 // eid: { ligado, numero, tipos: { ponto, dia } } — desligado até a administração ligar
  meta_equipe: 0,             // 0 = soma das metas individuais do mês
  tol_atraso: null,           // null = 5 min (atraso a partir de quantos minutos depois da escala)
  sem_resumo_caixa: false     // true = não manda mais o resumo curto de cada fechamento (avisos do caixa)
};
var REL65_RODAPE = '\n\n_Portal Equipe Las Vegas · relatório automático_';
var REL65_RODAPE_PONTO = '\n\n_Portal Equipe Las Vegas_';
var REL65_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
var REL65_DIAS_MIN = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
var REL65_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/* ───────── configuração ───────── */
function rel65Cfg_() {
  var s = cfgJson_('relatorio65', null), p = JSON.parse(JSON.stringify(REL65_PADRAO));
  if (!s || typeof s !== 'object') return p;
  var c = { ligado: s.ligado !== false, admins: Array.isArray(s.admins) ? s.admins : p.admins, equipe: s.equipe && typeof s.equipe === 'object' ? s.equipe : {},
            meta_equipe: Number(s.meta_equipe) || 0, tol_atraso: s.tol_atraso == null || s.tol_atraso === '' ? null : Number(s.tol_atraso), sem_resumo_caixa: !!s.sem_resumo_caixa };
  c.admins = c.admins.map(function (a) { var t = a.tipos || {}; return { id: String(a.id || ''), nome: String(a.nome || ''), numero: rel65Num_(a.numero), ligado: a.ligado !== false,
    tipos: { relatorio: t.relatorio !== false, ponto: t.ponto !== false, intervalo: !!t.intervalo, so_atraso: !!t.so_atraso } }; });
  for (var k in c.equipe) { var e = c.equipe[k] || {}, te = e.tipos || {}; c.equipe[k] = { ligado: !!e.ligado, numero: rel65Num_(e.numero), tipos: { ponto: te.ponto !== false, dia: te.dia !== false } }; }
  return c;
}
function rel65Num_(n) { var d = String(n || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 && d.length <= 13 ? d : ''; }
function rel65Tel_(d) { d = String(d || ''); if (d.length < 12) return d; var l = d.slice(4); return '(' + d.slice(2, 4) + ') ' + l.slice(0, l.length - 4) + '-' + l.slice(-4); }
function rel65NumColab_(c, cfg) {
  var e = cfg.equipe[c.id] || {};
  return e.numero || rel65Num_(c.telefone);
}
function rel65Tol_(cfg) { return cfg.tol_atraso != null && !isNaN(cfg.tol_atraso) ? cfg.tol_atraso : 5; }

/* ───────── números e textos ───────── */
function rel65R2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function rel65Brl_(n) { var v = rel65R2_(n), s = v < 0 ? '-' : '', t = Math.abs(v).toFixed(2).split('.'); return s + 'R$ ' + t[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + t[1]; }
function rel65Brl0_(n) { var v = Math.round(Number(n) || 0); return 'R$ ' + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function rel65Mil_(n) { var v = Number(n) || 0; if (v >= 1000 && v % 100 === 0) { var m = v / 1000; return String(m).replace('.', ',') + ' mil'; } return rel65Brl0_(v); }
function rel65Pn_(s) { return String(s || '').split(' ')[0]; }
function rel65Barra_(pct) { var n = Math.max(0, Math.min(10, Math.floor(pct / 10))); var b = ''; for (var i = 0; i < 10; i++) b += i < n ? '🟥' : '⬛'; return b; }
function rel65Dur_(m) { m = Math.max(0, Math.round(m || 0)); var h = Math.floor(m / 60), r = m % 60; return h ? h + 'h' + ('0' + r).slice(-2) : r + ' min'; }
function rel65Dow_(data) { return new Date(data + 'T12:00:00Z').getUTCDay(); }
function rel65DataBr_(data) { return String(data).slice(8, 10) + '/' + String(data).slice(5, 7); }
function rel65Lojas_() { try { return JSON.parse(cfg_('lojas')) || {}; } catch (e) { return {}; } }
function rel65DiasRestantes_(data) {
  var fer = String(cfg_('feriados') || '').split(',').map(function (x) { return x.trim(); }), n = 0;
  var d = new Date(data + 'T12:00:00Z'), mes = d.getUTCMonth();
  for (;;) {
    d = new Date(d.getTime() + 86400000);
    if (d.getUTCMonth() !== mes) break;
    var iso = d.toISOString().slice(0, 10);
    if (d.getUTCDay() !== 0 && fer.indexOf(iso) < 0) n++;
  }
  return n;
}

/* ───────── ponto: horário previsto pela escala ───────── */
function rel65InicioEscala_(eid, data, loja) {
  var e = ler_('Escala').filter(function (x) { return x.data === data && x.colaboradora_id === eid; })[0];
  if (!e || !e.turno || /folga/i.test(e.turno)) return null;
  var turnos = cfgJson_('turnos', {}) || {}, t = e.turno === 'dia' ? 'abertura' : e.turno;
  var txt = ((turnos[e.loja || loja] || {})[t]) || '';
  var m = String(txt).match(/(\d{1,2}):(\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}

/* ───────── envio (Evolution API do WhatsApp da loja, em paralelo) ───────── */
function rel65Prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function rel65Chave_() { return !!rel65Prop_('EVOLUTION_KEY'); }
function rel65Enviar_(lista, tipo) {
  lista = (lista || []).filter(function (x) { return x && x.numero && x.texto; });
  if (!lista.length) return { ok: 0, erros: [] };
  if (!rel65Chave_()) { rel65Hist_(lista.map(function (x) { return { para: x.quem, tipo: tipo, ok: false, erro: 'falta a chave do WhatsApp' }; })); return { ok: 0, erros: ['falta a chave do WhatsApp'] }; }
  var url = (rel65Prop_('EVOLUTION_URL') || 'https://evolution-api-production-43cd.up.railway.app').replace(/\/+$/, '') + '/message/sendText/' + (rel65Prop_('EVOLUTION_INSTANCE') || 'lasvegas');
  var pedido = function (corpo) { return { url: url, method: 'post', contentType: 'application/json', headers: { apikey: rel65Prop_('EVOLUTION_KEY') }, payload: JSON.stringify(corpo), muteHttpExceptions: true }; };
  var resp = [];
  try { resp = UrlFetchApp.fetchAll(lista.map(function (x) { return pedido({ number: x.numero, text: x.texto }); })); }
  catch (e) { resp = lista.map(function (x) { try { return UrlFetchApp.fetch(url, pedido({ number: x.numero, text: x.texto })); } catch (e2) { return null; } }); }
  var ok = 0, erros = [], hist = [];
  lista.forEach(function (x, i) {
    var r = resp[i], c = r ? r.getResponseCode() : 0;
    if (c === 400) { try { r = UrlFetchApp.fetch(url, pedido({ number: x.numero, textMessage: { text: x.texto } })); c = r.getResponseCode(); } catch (e3) { c = 0; } }
    var bom = c >= 200 && c < 300;
    if (bom) ok++; else erros.push(x.quem + ': ' + (c ? 'WhatsApp respondeu ' + c + ' ' + String(r.getContentText()).slice(0, 80) : 'sem resposta'));
    hist.push({ para: x.quem, tipo: tipo, ok: bom, erro: bom ? '' : (c ? 'respondeu ' + c : 'sem resposta') });
  });
  rel65Hist_(hist);
  if (erros.length) try { log_('Sistema', 'relatório whats erro', erros.join(' | ').slice(0, 400)); } catch (e4) {}
  return { ok: ok, erros: erros };
}
function rel65Hist_(itens) {
  try {
    var h = JSON.parse(rel65Prop_('REL65_HIST') || '[]'); if (!Array.isArray(h)) h = [];
    var em = agora_();
    itens.forEach(function (i) { h.unshift({ em: em, para: i.para, tipo: i.tipo, ok: i.ok, erro: i.erro || '' }); });
    PropertiesService.getScriptProperties().setProperty('REL65_HIST', JSON.stringify(h.slice(0, 40)));
  } catch (e) {}
}
function rel65Env_() { try { var o = JSON.parse(rel65Prop_('REL65_ENV') || '{}'); return o && o.dia === hoje_() ? o : { dia: hoje_(), k: {} }; } catch (e) { return { dia: hoje_(), k: {} }; } }
function rel65EnvSalvar_(o) { PropertiesService.getScriptProperties().setProperty('REL65_ENV', JSON.stringify(o)); }

/* ═════════ 1) PONTO ═════════ */
var REL65_CAMPO = {
  entrada:      { ic: '🟢', t: 'ENTRADA',             adm: 'ponto',     eu: '🟢 Entrada às {h}' },
  saida:        { ic: '🔴', t: 'SAÍDA',               adm: 'ponto',     eu: '🔴 Saída às {h}' },
  saida_almoco: { ic: '☕', t: 'SAIU PARA O ALMOÇO',  adm: 'intervalo', eu: '☕ Saída para o almoço às {h}' },
  volta_almoco: { ic: '↩️', t: 'VOLTOU DO ALMOÇO',    adm: 'intervalo', eu: '↩️ Volta do almoço às {h}' },
  inicio_pausa: { ic: '⏸️', t: 'PAUSA',               adm: 'intervalo', eu: '⏸️ Pausa às {h}' },
  fim_pausa:    { ic: '▶️', t: 'VOLTOU DA PAUSA',     adm: 'intervalo', eu: '▶️ Volta da pausa às {h}' }
};
function rel65PontoTextos_(c, r, campo, hora, cfg) {
  var info = REL65_CAMPO[campo]; if (!info) return null;
  var lojas = rel65Lojas_(), loja = r.loja || c.loja, nomeLoja = 'Loja ' + ((lojas[loja] || {}).nome || loja);
  var nome = rel65Pn_(c.nome), atraso = null, linha = '🕗 ' + hora, tit = info.ic + ' *PONTO · ' + info.t + '*';
  if (campo === 'entrada') {
    var ini = rel65InicioEscala_(c.id, r.data || hoje_(), loja), tol = rel65Tol_(cfg);
    if (ini != null) {
      var dif = min_(hora) - ini;
      if (dif > tol) { atraso = dif; tit = '🟡 *PONTO · ENTRADA COM ATRASO*'; linha += ' · ⚠️ ' + rel65Dur_(dif) + ' de atraso _(escala ' + hhmm_(ini) + ')_'; }
      else linha += ' · ✅ no horário';
    }
  }
  if (campo === 'saida') { var tr = trabalhado_(r); if (tr) linha += ' · ⏱️ ' + tr.replace(':', 'h').replace(/^0/, '') + ' trabalhadas hoje'; }
  if (campo === 'volta_almoco' && r.saida_almoco) linha += ' · ' + rel65Dur_(min_(hora) - min_(r.saida_almoco)) + ' de almoço';
  if (campo === 'fim_pausa' && r.inicio_pausa) linha += ' · ' + rel65Dur_(min_(hora) - min_(r.inicio_pausa)) + ' de pausa';
  var adm = tit + '\n👤 *' + nome + '* · ' + nomeLoja + '\n' + linha + REL65_RODAPE_PONTO;
  var eu = '✅ *Ponto batido, ' + nome + '!*\n' + info.eu.replace('{h}', hora) + ' · ' + nomeLoja;
  if (campo === 'saida') { var tr2 = trabalhado_(r); eu += (tr2 ? '\n⏱️ ' + tr2.replace(':', 'h').replace(/^0/, '') + ' hoje' : '') + '\nBom descanso! 🖤'; }
  else if (campo === 'entrada') eu += '\nBoas vendas! ❤️';
  else if (campo === 'saida_almoco') eu += '\nBom almoço! 🍽️';
  eu += REL65_RODAPE_PONTO;
  return { adm: adm, eu: eu, atraso: atraso, tipo: info.adm };
}
function rel65Ponto_(eid, campo, hora) {
  try {
    var cfg = rel65Cfg_(); if (!cfg.ligado) return;
    var c = colabs_().filter(function (x) { return x.id === eid; })[0]; if (!c) return;
    var r = pontoDe_(eid, hoje_()); if (!r) return;
    var env = rel65Env_(), chave = 'p|' + eid + '|' + campo;
    if (env.k[chave]) return;
    var tx = rel65PontoTextos_(c, r, campo, hora || r[campo], cfg); if (!tx) return;
    var lista = [];
    cfg.admins.forEach(function (a) {
      if (!a.ligado || !a.numero) return;
      var vai = a.tipos.so_atraso ? (a.tipos.ponto && campo === 'entrada' && tx.atraso != null) : !!a.tipos[tx.tipo];
      if (vai) lista.push({ numero: a.numero, quem: a.nome, texto: tx.adm });
    });
    var e = cfg.equipe[eid];
    if (e && e.ligado && e.tipos.ponto) { var n = rel65NumColab_(c, cfg); if (n) lista.push({ numero: n, quem: rel65Pn_(c.nome), texto: tx.eu }); }
    env.k[chave] = 1; rel65EnvSalvar_(env);
    rel65Enviar_(lista, 'ponto');
  } catch (err) { try { log_('Sistema', 'relatório ponto erro', String(err && err.message || err)); } catch (x) {} }
}

/* ═════════ 2) RELATÓRIO DO DIA ═════════ */
function rel65LojasDoDia_(data) {
  var lojas = rel65Lojas_(), ativas = {};
  try { ler_('CaixaMov').forEach(function (m) { if (m.data === data && m.tipo === 'abertura') ativas[m.loja] = 1; }); } catch (e) {}
  ler_('Caixa').forEach(function (r) { if (r.data === data && r.status !== 'reaberto') ativas[r.loja] = 1; });
  ler_('VendasPDV').forEach(function (v) { if (v.data === data && v.status !== 'cancelada' && v.loja) ativas[v.loja] = 1; });
  return Object.keys(lojas).filter(function (k) { return ativas[k]; });
}
function rel65Fechamentos_(data) {
  var f = {}; ler_('Caixa').forEach(function (r) { if (r.data === data && r.status !== 'reaberto') f[r.loja] = r; }); return f;
}
function rel65Dados_(data) {
  var lojas = rel65Lojas_(), ym = String(data).slice(0, 7), semana = Utilities.formatDate(new Date(new Date(data + 'T12:00:00Z').getTime() - 7 * 86400000), 'UTC', 'yyyy-MM-dd');
  var ativos = {}; colabs_().forEach(function (c) { if (c.ativa === 'SIM') ativos[c.id] = c; });
  var nomeDe = function (id, nome) { return rel65Pn_((ativos[id] || {}).nome || nome || id); };
  var D = { data: data, ym: ym, lojas: lojas, ativas: rel65LojasDoDia_(data), fech: rel65Fechamentos_(data), porLoja: {}, pessoas: {}, total: 0, qtd: 0, ticketBase: 0,
            site: { n: 0, total: 0 }, formas: { pix: 0, dinheiro: 0, debito: 0, credito_vista: 0, credito_parc: 0, misto: 0 }, sangrias: 0, promos: {}, semana: 0, mes: 0, mesPessoa: {} };
  Object.keys(lojas).forEach(function (k) { D.porLoja[k] = { valor: 0, n: 0 }; });
  ler_('Vendas').forEach(function (v) {
    var n = Number(v.valor) || 0; if (!n) return;
    if (v.data === data) {
      if (!D.porLoja[v.loja]) D.porLoja[v.loja] = { valor: 0, n: 0 };
      D.porLoja[v.loja].valor = rel65R2_(D.porLoja[v.loja].valor + n);
      var p = D.pessoas[v.colaboradora_id] = D.pessoas[v.colaboradora_id] || { id: v.colaboradora_id, nome: nomeDe(v.colaboradora_id, v.colaboradora), valor: 0, n: 0 };
      p.valor = rel65R2_(p.valor + n); D.total = rel65R2_(D.total + n);
    }
    if (v.data === semana) D.semana = rel65R2_(D.semana + n);
    if (String(v.data).slice(0, 7) === ym && v.data <= data) { D.mes = rel65R2_(D.mes + n); D.mesPessoa[v.colaboradora_id] = rel65R2_((D.mesPessoa[v.colaboradora_id] || 0) + n); }
  });
  ler_('VendasPDV').forEach(function (v) {
    if (v.data !== data || v.status === 'cancelada') return;
    var t = Number(v.total) || 0;
    D.qtd++; D.ticketBase = rel65R2_(D.ticketBase + t);
    if (D.porLoja[v.loja]) D.porLoja[v.loja].n++;
    var p = D.pessoas[v.colaboradora_id] = D.pessoas[v.colaboradora_id] || { id: v.colaboradora_id, nome: nomeDe(v.colaboradora_id, v.colaboradora), valor: 0, n: 0 };
    p.n++;
    var pr = String(v.promo || '').trim();
    if (pr) { var o = D.promos[pr] = D.promos[pr] || { n: 0, total: 0 }; o.n++; o.total = rel65R2_(o.total + t); }
    var partes = typeof cx48Partes_ === 'function' ? cx48Partes_(v) : (function () { var x = {}; x[v.pagamento === 'credito' ? ((Number(v.parcelas) || 1) > 1 ? 'credito_parc' : 'credito_vista') : (v.pagamento || 'misto')] = t; return x; })();
    for (var k in partes) { if (D.formas[k] == null) k = 'misto'; D.formas[k] = rel65R2_(D.formas[k] + (Number(partes[k]) || 0)); }
  });
  try {
    ler_('VendasSite').forEach(function (v) {
      if (/cancel/i.test(String(v.status || ''))) return;
      var t = Number(v.total) || 0;
      if (v.data === data) { D.site.n++; D.site.total = rel65R2_(D.site.total + t); D.qtd++; D.ticketBase = rel65R2_(D.ticketBase + t); }
      if (v.data === semana) D.semana = rel65R2_(D.semana + t);
    });
  } catch (e) {}
  D.total = rel65R2_(D.total + D.site.total);
  try { ler_('Sangrias').forEach(function (s) { if (s.data === data) D.sangrias = rel65R2_(D.sangrias + (typeof cx48Num_ === 'function' ? cx48Num_(s.valor) : Number(s.valor) || 0)); }); } catch (e) {}
  /* metas do mês */
  var metas = (cfgJson_('metas', {}) || {})[ym] || {}, pes = metas.pessoas || {}, cfg = rel65Cfg_();
  D.premios = cfgJson_('premios', {}) || {};
  D.metasPessoa = {};
  var somaMetas = 0;
  Object.keys(pes).forEach(function (id) { if (!ativos[id] || !pes[id] || !Number(pes[id].meta)) return; D.metasPessoa[id] = { meta: Number(pes[id].meta), super: Number(pes[id].super) || Number(pes[id].meta), hiper: Number(pes[id].hiper) || Number(pes[id].super) || Number(pes[id].meta) }; somaMetas += Number(pes[id].meta); });
  D.metaEquipe = cfg.meta_equipe || Number((metas.equipe || {}).meta) || somaMetas || 0;
  if (!D.metaEquipe) Object.keys(lojas).forEach(function (k) { D.metaEquipe += Number((metas[k] || {}).meta) || 0; });
  D.diasRestantes = rel65DiasRestantes_(data);
  D.nomes = {}; Object.keys(ativos).forEach(function (id) { D.nomes[id] = rel65Pn_(ativos[id].nome); });
  /* ponto */
  var tol = rel65Tol_(cfg), P = { bateram: 0, atrasos: [], fora: [] };
  ler_('Pontos').forEach(function (r) {
    if (r.data !== data || !ativos[r.colaboradora_id]) return;
    if (r.tipo && r.tipo !== 'normal') { P.fora.push(D.nomes[r.colaboradora_id] + ' (' + r.tipo + ')'); return; }
    if (!r.entrada) return;
    P.bateram++;
    var ini = rel65InicioEscala_(r.colaboradora_id, data, r.loja);
    if (ini != null && min_(r.entrada) - ini > tol) P.atrasos.push(D.nomes[r.colaboradora_id] + ', ' + rel65Dur_(min_(r.entrada) - ini));
  });
  D.ponto = P;
  return D;
}
function rel65Texto_(D, pendentes, atualizado) {
  var L = [], lojas = D.lojas, sep = '━━━━━━━━━━━━━━━';
  var dw = rel65Dow_(D.data);
  L.push('❤️🖤 *LAS VEGAS SEX SHOP* 🖤❤️');
  L.push('📊 *RELATÓRIO DO DIA*' + (atualizado ? ' · 🔄 _atualizado_' : ''));
  L.push('🗓️ ' + REL65_DIAS[dw] + ', ' + rel65DataBr_(D.data) + (pendentes.length ? '' : ' · caixas fechados'));
  if (pendentes.length) L.push('⚠️ *' + pendentes.map(function (k) { return (lojas[k] || {}).nome || k; }).join(' e ') + (pendentes.length > 1 ? ' ainda não fecharam' : ' ainda não fechou') + ' o caixa*');
  L.push('');
  L.push('💰 *VENDIDO HOJE: ' + rel65Brl_(D.total) + '*');
  if (D.qtd) L.push('🧾 ' + D.qtd + ' venda' + (D.qtd > 1 ? 's' : '') + ' · ticket médio ' + rel65Brl_(D.ticketBase / D.qtd));
  if (D.semana > 0) { var pct = Math.round((D.total - D.semana) / D.semana * 100); L.push((pct >= 0 ? '📈 +' : '📉 ') + pct + '% x ' + REL65_DIAS_MIN[dw] + ' passad' + (dw === 0 || dw === 6 ? 'o' : 'a') + ' (' + rel65Brl0_(D.semana) + ')'); }
  /* ranking */
  var rk = Object.keys(D.pessoas).map(function (k) { return D.pessoas[k]; }).filter(function (p) { return p.valor > 0; }).sort(function (a, b) { return b.valor - a.valor; });
  if (rk.length) {
    L.push(''); L.push(sep); L.push('🏆 *QUEM VENDEU MAIS*');
    rk.forEach(function (p, i) { L.push((['🥇', '🥈', '🥉'][i] || '▫️') + ' *' + p.nome + '* — ' + rel65Brl_(p.valor) + (p.n ? ' · ' + p.n + ' venda' + (p.n > 1 ? 's' : '') : '')); });
  }
  /* lojas */
  L.push(''); L.push(sep); L.push('🏪 *POR LOJA*');
  Object.keys(lojas).forEach(function (k) {
    var pl = D.porLoja[k] || { valor: 0, n: 0 }, f = D.fech[k], ativa = D.ativas.indexOf(k) >= 0;
    if (!ativa && !pl.valor) return;
    L.push('📍 *' + (lojas[k].nome || k) + '* — ' + rel65Brl_(pl.valor) + (pl.n ? ' · ' + pl.n + ' venda' + (pl.n > 1 ? 's' : '') : ''));
    if (f) {
      var dif = opxJson_(f.diferenca, {}), maior = 0, soma = 0;
      for (var x in dif) { var d = rel65R2_(dif[x]); soma = rel65R2_(soma + d); if (Math.abs(d) > Math.abs(maior)) maior = d; }
      var st = f.status === 'diferenca' ? '⚠️ ' + (soma < 0 ? 'faltou ' : 'sobrou ') + rel65Brl_(Math.abs(soma || maior)) : '✅ bateu';
      L.push('     🔐 ' + rel65Pn_(f.por) + ' fechou ' + String(f.criado_em).slice(11, 16) + ' · ' + st);
    } else if (ativa) L.push('     🔓 caixa ainda aberto');
  });
  if (D.site.n) L.push('🛒 *Site* — ' + rel65Brl_(D.site.total) + ' · ' + D.site.n + ' pedido' + (D.site.n > 1 ? 's' : ''));
  /* formas */
  var F = D.formas, cred = rel65R2_(F.credito_vista + F.credito_parc), linhasF = [];
  if (F.pix) linhasF.push('Pix ' + rel65Brl_(F.pix));
  if (cred) linhasF.push('Crédito ' + rel65Brl_(cred) + (F.credito_vista && F.credito_parc ? ' _(à vista ' + rel65Brl_(F.credito_vista).replace('R$ ', '') + ' · parcelado ' + rel65Brl_(F.credito_parc).replace('R$ ', '') + ')_' : F.credito_parc ? ' _(parcelado)_' : ''));
  if (F.debito) linhasF.push('Débito ' + rel65Brl_(F.debito));
  if (F.dinheiro || D.sangrias) linhasF.push('Dinheiro ' + rel65Brl_(F.dinheiro) + (D.sangrias ? ' · sangrias ' + rel65Brl_(D.sangrias) : ''));
  if (F.misto) linhasF.push('Misto ' + rel65Brl_(F.misto));
  if (linhasF.length) { L.push(''); L.push('💳 *COMO PAGARAM*'); linhasF.forEach(function (l) { L.push(l); }); }
  /* campanhas do dia (promoção marcada na venda) */
  Object.keys(D.promos).forEach(function (pr) { var o = D.promos[pr]; L.push(''); L.push('🔥 *' + pr + '*'); L.push(o.n + ' venda' + (o.n > 1 ? 's' : '') + ' · ' + rel65Brl_(o.total)); });
  /* meta do mês */
  if (D.metaEquipe) {
    var pctM = Math.round(D.mes / D.metaEquipe * 100), falta = Math.max(0, D.metaEquipe - D.mes);
    L.push(''); L.push(sep);
    L.push('🎯 *META DE ' + REL65_MESES[+D.ym.slice(5, 7) - 1].toUpperCase() + ' · ' + rel65Mil_(D.metaEquipe) + '*');
    L.push(rel65Barra_(pctM) + ' ' + pctM + '%');
    L.push('✅ ' + rel65Brl_(D.mes) + ' vendidos');
    if (falta > 0) L.push('⏳ Faltam *' + rel65Brl_(falta) + '*' + (D.diasRestantes ? ' em ' + D.diasRestantes + ' dia' + (D.diasRestantes > 1 ? 's' : '') + ' → ' + rel65Brl0_(falta / D.diasRestantes) + '/dia' : ' · último dia do mês'));
    else L.push('🏆 *Meta da equipe batida!*');
    var ids = Object.keys(D.metasPessoa).sort(function (a, b) { return (D.mesPessoa[b] || 0) - (D.mesPessoa[a] || 0); });
    if (ids.length) L.push('');
    ids.forEach(function (id) {
      var m = D.metasPessoa[id], v = D.mesPessoa[id] || 0, txt = '• ' + (D.nomes[id] || id) + ' — ' + rel65Brl0_(v) + ' · ';
      if (v >= m.hiper) txt += '🏆 bateu a hiper!';
      else if (v >= m.super) txt += '⭐ super batida · faltam ' + rel65Brl0_(m.hiper - v) + ' p/ hiper';
      else if (v >= m.meta) txt += '✅ meta batida · faltam ' + rel65Brl0_(m.super - v) + ' p/ super';
      else txt += 'faltam ' + rel65Brl0_(m.meta - v) + ' p/ ' + rel65Mil_(m.meta);
      L.push(txt);
    });
  }
  /* ponto */
  var P = D.ponto;
  if (P.bateram || P.fora.length) {
    L.push('');
    L.push('⏰ *PONTO:* ' + P.bateram + ' bat' + (P.bateram === 1 ? 'eu' : 'eram') + (P.atrasos.length ? ' · ' + P.atrasos.length + ' atraso' + (P.atrasos.length > 1 ? 's' : '') + ' (' + P.atrasos.join('; ') + ')' : ' · sem atrasos') + (P.fora.length ? ' · ' + P.fora.join(', ') : ''));
  }
  return L.join('\n') + REL65_RODAPE;
}
/* "seu dia" da colaboradora (só dela: vendas, posição e meta) */
function rel65TextoEu_(D, id) {
  var nome = D.nomes[id] || '', p = D.pessoas[id] || { valor: 0, n: 0 }, m = D.metasPessoa[id], L = [];
  var rk = Object.keys(D.pessoas).map(function (k) { return D.pessoas[k]; }).filter(function (x) { return x.valor > 0; }).sort(function (a, b) { return b.valor - a.valor; });
  var pos = -1; rk.forEach(function (x, i) { if (x.id === id) pos = i; });
  if (!p.valor && !m) return '';
  L.push('❤️🖤 *Seu dia, ' + nome + '!*');
  if (p.valor) {
    L.push('💰 Você vendeu *' + rel65Brl_(p.valor) + '* hoje' + (p.n ? ' · ' + p.n + ' venda' + (p.n > 1 ? 's' : '') : ''));
    if (pos === 0 && rk.length > 1) L.push('🥇 1º lugar do dia!'); else if (pos > 0) L.push((['🥇', '🥈', '🥉'][pos] || '🏅') + ' ' + (pos + 1) + 'º lugar do dia');
  } else L.push('Hoje não teve venda no seu nome.');
  if (m) {
    var v = D.mesPessoa[id] || 0, alvo = v < m.meta ? m.meta : v < m.super ? m.super : m.hiper, nivel = v < m.meta ? 'meta' : v < m.super ? 'super' : 'hiper';
    var pct = Math.round(v / m.meta * 100), falta = Math.max(0, alvo - v), pr = D.premios || {};
    L.push(''); L.push('🎯 *Sua meta de ' + REL65_MESES[+D.ym.slice(5, 7) - 1] + '*');
    L.push(rel65Barra_(pct) + ' ' + pct + '%');
    L.push(rel65Brl0_(v) + ' de ' + rel65Brl0_(m.meta));
    if (v >= m.hiper) L.push('🏆 *Hiper meta batida!* Que mulher! 🔥');
    else {
      L.push('⏳ Faltam *' + rel65Brl0_(falta) + '* p/ ' + (nivel === 'meta' ? 'a meta' : nivel === 'super' ? 'a super' : 'a hiper') + (D.diasRestantes ? ' → ' + rel65Brl0_(falta / D.diasRestantes) + '/dia nos ' + D.diasRestantes + ' dias que restam' : ''));
      if (pr[nivel]) L.push('🏅 Batendo, ganha *' + rel65Brl0_(pr[nivel]) + '*' + (nivel === 'meta' && m.super > m.meta ? ' · próxima: ' + rel65Mil_(m.super) + (pr.super ? ' (' + rel65Brl0_(pr.super) + ')' : '') : ''));
      L.push(''); L.push(falta <= alvo * 0.15 ? 'Bora que tá perto! 💪' : 'Amanhã tem mais! 💪');
    }
  }
  return L.join('\n') + REL65_RODAPE_PONTO;
}
/* confere se é hora de mandar o relatório (depois de cada fechamento, no gatilho e de vez em quando) */
function rel65Checar_(forcar) {
  try {
    var cfg = rel65Cfg_(); if (!cfg.ligado) return { enviado: false, motivo: 'desligado' };
    var hoje = hoje_(), ativas = rel65LojasDoDia_(hoje); if (!ativas.length) return { enviado: false, motivo: 'sem movimento hoje' };
    var fech = rel65Fechamentos_(hoje), lojas = rel65Lojas_();
    var pend = ativas.filter(function (k) { return !fech[k]; });
    if (pend.length && !forcar) {
      var agoraMin = min_(hora_()), tarde = pend.every(function (k) { var f = min_((lojas[k] || {}).fecha || '20:00'); return f != null && agoraMin > f + 30; });
      if (!tarde) return { enviado: false, motivo: 'esperando ' + pend.join(', ') };
    }
    var sig = ativas.map(function (k) { return k + ':' + (fech[k] ? fech[k].id + '@' + fech[k].criado_em : '-'); }).join('|');
    return comTrava_(function () {
      var env = rel65Env_(), ja = env.k.rel;
      if (ja && ja.sig === sig && !forcar) return { enviado: false, motivo: 'já enviado' };
      if (ja && pend.length && !forcar) return { enviado: false, motivo: 'já enviado' };
      var D = rel65Dados_(hoje), texto = rel65Texto_(D, pend, !!ja), lista = [];
      cfg.admins.forEach(function (a) { if (a.ligado && a.numero && a.tipos.relatorio) lista.push({ numero: a.numero, quem: a.nome, texto: texto }); });
      var cs = {}; colabs_().forEach(function (c) { cs[c.id] = c; });
      Object.keys(cfg.equipe).forEach(function (eid) {
        var e = cfg.equipe[eid], c = cs[eid];
        if (!e.ligado || !e.tipos.dia || !c || c.ativa !== 'SIM' || env.k['dia|' + eid]) return;
        var n = rel65NumColab_(c, cfg), t = rel65TextoEu_(D, eid);
        if (n && t) { lista.push({ numero: n, quem: rel65Pn_(c.nome), texto: t }); env.k['dia|' + eid] = 1; }
      });
      env.k.rel = { sig: sig, em: agora_() }; rel65EnvSalvar_(env);
      var r = rel65Enviar_(lista, 'relatório');
      return { enviado: true, ok: r.ok, erros: r.erros };
    });
  } catch (err) { try { log_('Sistema', 'relatório erro', String(err && err.message || err)); } catch (x) {} return { enviado: false, erro: String(err && err.message || err) }; }
}
function rel65ChecarAsVezes_() {
  try { var c = CacheService.getScriptCache(); if (c.get('rel65av')) return; c.put('rel65av', '1', 300); } catch (e) { return; }
  rel65Checar_(false);
}
/* gatilho a cada 15 min (criado ao salvar a tela): pega a loja que não fechou mesmo sem ninguém usando o portal */
function relatorioGatilho65() { rel65Checar_(false); }
function rel65Gatilho_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'relatorioGatilho65'; })[0] || null; }

/* o resumo curto de cada fechamento (avisos do caixa) pode ser desligado — o relatório já traz o fechamento */
if (typeof cx48ItensAvisos_ === 'function') {
  var _rel65ItensCx = cx48ItensAvisos_;
  cx48ItensAvisos_ = function () {
    var it = _rel65ItensCx.apply(this, arguments);
    try { if (rel65Cfg_().sem_resumo_caixa) it = it.filter(function (x) { return String(x.k).indexOf('cxfech|') !== 0; }); } catch (e) {}
    return it;
  };
}

/* ═════════ 3) ADMINISTRAÇÃO (perfil Matheus) ═════════ */
function rel65Estado_() {
  var cfg = rel65Cfg_(), hist = []; try { hist = JSON.parse(rel65Prop_('REL65_HIST') || '[]'); } catch (e) {}
  var equipe = colabs_().filter(function (c) { return c.ativa === 'SIM'; }).map(function (c) {
    var e = cfg.equipe[c.id] || { ligado: false, numero: '', tipos: { ponto: true, dia: true } };
    return { id: c.id, nome: c.nome, cargo: c.cargo || '', loja: c.loja || '', cor: c.cor || '', telCadastro: rel65Num_(c.telefone), ligado: e.ligado, numero: e.numero, tipos: e.tipos };
  });
  var env = rel65Env_(), ativas = [], fech = {};
  try { ativas = rel65LojasDoDia_(hoje_()); fech = rel65Fechamentos_(hoje_()); } catch (e) {}
  return { ok: true, cfg: cfg, equipe: equipe, chave: rel65Chave_(), gatilho: !!rel65Gatilho_(), hist: hist,
           hoje: { data: hoje_(), lojas: ativas.map(function (k) { return { k: k, fechado: !!fech[k] }; }), enviado: env.k.rel ? env.k.rel.em : '' } };
}
ADMIN.admRel65 = function (req) {
  var op = req.op || 'ver';
  if (op === 'salvar') {
    var c = req.cfg || {}, atual = rel65Cfg_(), novo = {
      ligado: c.ligado !== false,
      admins: (Array.isArray(c.admins) ? c.admins : atual.admins).slice(0, 6).map(function (a, i) { var t = a.tipos || {};
        return { id: String(a.id || ('adm' + i)).slice(0, 30), nome: String(a.nome || '').slice(0, 40) || 'Administração', numero: rel65Num_(a.numero), ligado: a.ligado !== false,
                 tipos: { relatorio: t.relatorio !== false, ponto: t.ponto !== false, intervalo: !!t.intervalo, so_atraso: !!t.so_atraso } }; }),
      equipe: {}, meta_equipe: Math.max(0, Number(String(c.meta_equipe || '').replace(/\D/g, '')) || 0),
      tol_atraso: c.tol_atraso === '' || c.tol_atraso == null ? null : Math.max(0, Math.min(120, Number(c.tol_atraso) || 0)),
      sem_resumo_caixa: !!c.sem_resumo_caixa
    };
    var ids = {}; colabs_().forEach(function (x) { ids[x.id] = 1; });
    Object.keys(c.equipe || {}).forEach(function (eid) { if (!ids[eid]) return; var e = c.equipe[eid] || {}, t = e.tipos || {};
      novo.equipe[eid] = { ligado: !!e.ligado, numero: rel65Num_(e.numero), tipos: { ponto: t.ponto !== false, dia: t.dia !== false } }; });
    novo.admins.forEach(function (a) { if (a.ligado && !a.numero) throw new Error('Falta o número de ' + a.nome); });
    setCfg_('relatorio65', JSON.stringify(novo));
    if (req.chave) PropertiesService.getScriptProperties().setProperty('EVOLUTION_KEY', String(req.chave).trim());
    try {
      if (novo.ligado && !rel65Gatilho_()) ScriptApp.newTrigger('relatorioGatilho65').timeBased().everyMinutes(15).create();
      if (!novo.ligado && rel65Gatilho_()) ScriptApp.deleteTrigger(rel65Gatilho_());
    } catch (e) {}
    /* começa a contar de agora: o que já aconteceu hoje não é mandado de uma vez */
    var env = rel65Env_(); ler_('Pontos').forEach(function (r) { if (r.data === hoje_()) CAMPOS.forEach(function (k) { if (r[k]) env.k['p|' + r.colaboradora_id + '|' + k] = 1; }); }); rel65EnvSalvar_(env);
    log_(req.por || 'Administração', 'relatórios whats', (novo.ligado ? 'ligado' : 'desligado') + ' · ' + novo.admins.map(function (a) { return a.nome + (a.ligado ? '' : ' (off)'); }).join(', ') +
      ' · equipe ligada: ' + Object.keys(novo.equipe).filter(function (k) { return novo.equipe[k].ligado; }).length + (req.chave ? ' · chave nova' : ''));
    return rel65Estado_();
  }
  if (op === 'previa') {
    var D = rel65Dados_(hoje_()), fech = rel65Fechamentos_(hoje_()), pend = D.ativas.filter(function (k) { return !fech[k]; });
    var eu = {}; Object.keys(D.nomes).forEach(function (id) { var t = rel65TextoEu_(D, id); if (t) eu[id] = t; });
    var cs = colabs_().filter(function (x) { return x.ativa === 'SIM'; }), c0 = cs[0], ponto = null;
    if (c0) ponto = rel65PontoTextos_(c0, pontoDe_(c0.id, hoje_()) || { data: hoje_(), loja: c0.loja, entrada: hora_() }, 'entrada', (pontoDe_(c0.id, hoje_()) || {}).entrada || hora_(), rel65Cfg_());
    return { ok: true, relatorio: rel65Texto_(D, pend, false), eu: eu, ponto: ponto };
  }
  if (op === 'teste') {
    var cfg = rel65Cfg_(), lista = [], txt = String(req.tipo) === 'relatorio' ? null : '✅ *Teste do Portal Equipe* — os relatórios e o ponto vão chegar aqui. ❤️🖤' + REL65_RODAPE_PONTO;
    if (!txt) { var D2 = rel65Dados_(hoje_()), f2 = rel65Fechamentos_(hoje_()); txt = '🧪 _teste · números de agora_\n\n' + rel65Texto_(D2, D2.ativas.filter(function (k) { return !f2[k]; }), false); }
    if (req.numero) lista.push({ numero: rel65Num_(req.numero), quem: String(req.quem || 'teste'), texto: txt });
    if (!lista.length || !lista[0].numero) throw new Error('Número inválido');
    var r = rel65Enviar_(lista, 'teste');
    var est = rel65Estado_(); est.teste = r.ok ? 'ok' : (r.erros[0] || 'não enviou'); return est;
  }
  if (op === 'agora') { var rr = rel65Checar_(true), e2 = rel65Estado_(); e2.agora = rr; return e2; }
  return rel65Estado_();
};

/* ═════════ 4) GANCHOS ═════════ */
var _rel65Rodar = rodar_;
rodar_ = function (req) {
  var r = _rel65Rodar(req);
  try {
    if (req && r && r.ok !== false) {
      if ((req.a === 'bater' || req.a === 'baterCel') && r.campo) {
        var eid = (r.ponto && r.ponto.colaboradora_id) || req.eid;
        if (eid) rel65Ponto_(eid, r.campo, r.hora);
      } else if (req.a === 'caixa' && req.op === 'fechar') rel65Checar_(false);
      else if (/^admCaixa/.test(req.a || '') || req.a === 'admConfig') rel65ChecarAsVezes_();
      else if (req.a === 'dados' || req.a === 'entrar' || req.a === 'admDados' || req.a === 'admAoVivo') rel65ChecarAsVezes_();
    }
  } catch (e) { try { log_('Sistema', 'relatório gancho erro', String(e && e.message || e)); } catch (x) {} }
  return r;
};
