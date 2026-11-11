/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · MISSÃO DO DIA (Portal Equipe) — v54
   Stories das "Ofertas do Dia" do site valendo pontos; os pontos viram raspadinha extra.
   Arquivo SEPARADO — fica DEPOIS de todos (… → CAIXA → MISSAO). ES5 (runtime legado).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: MISSAO (o último da lista)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   As abas MissaoStories e MissaoOfertas são criadas sozinhas. Config › missao guarda as regras.
   ───────────────────────────────────────────────────────────────
   REGRAS:
   • Ofertas do dia: o portal lê o calendário que já está na página inicial do site (6 produtos por dia)
     e guarda na aba MissaoOfertas. Se não conseguir ler, a administração cola os links do dia.
   • Cada vendedora posta 1 story por dia no Instagram da loja, de 1 produto da oferta (cada produto com
     uma vendedora). Manda o print do story no ar → a IA confere (é story? é da conta da loja?) e libera os pontos.
   • Depois manda o print dos números do story (visualizações, respostas, cliques…) → a IA lê os números.
     Print que a IA não consegue ler (ou IA desligada) vai para a administração conferir.
   • Pontos: postou, sequência de dias, respostas, cliques, reações, compartilhamentos, faixa de visualizações,
     venda de produto da oferta do dia (sozinho, pelo PDV) e story campeão da semana.
   • A cada X pontos no mês, 1 raspadinha extra (mesmos prêmios da raspadinha da campanha).
   • O mesmo print não vale duas vezes (o portal reconhece a imagem repetida).
   ═══════════════════════════════════════════════════════════════ */

ABAS.MissaoStories = ['id', 'data', 'colaboradora_id', 'colaboradora', 'handle', 'produto', 'horario', 'url_post', 'hash_post', 'status', 'post_em', 'ia_post',
                      'url_num', 'hash_num', 'num_em', 'views', 'respostas', 'cliques', 'reacoes', 'compart', 'ia_num', 'num_status', 'obs', 'decidido_por', 'decidido_em'];
ABAS.MissaoOfertas = ['data', 'itens', 'origem', 'atualizado_em'];

var MISS_PADRAO = {
  ativa: true,
  inicio: '2026-11-11',
  fora: [],
  conta: 'lasvegas_ac',
  site: 'https://www.lasvegassexshop.com.br',
  gtm: 'GTM-TCBTS2V',
  horarios: ['10:30', '14:00', '17:30'],
  prazo_numeros_dias: 2,
  por_raspadinha: 50,
  pontos: { postou: 10, sequencia: 20, sequencia_dias: 5, resposta: 3, clique: 1, reacao: 1, compart: 2, venda: 20, campea: 30, teto_story: 60,
            views: [{ min: 300, pts: 5 }, { min: 500, pts: 10 }] }
};
CONFIG_PADRAO.push(['missao', JSON.stringify(MISS_PADRAO), 'Missão do Dia (JSON): stories das ofertas do dia — pontos, horários do rodízio, conta do Instagram, quem participa, pontos por raspadinha']);

var _missMemo = null;

/* ───────── liga/desliga de cada jogo da campanha (Administração › Campanha) ───────── */
var JOGOS_NOMES = ['raspadinha', 'bingo', 'ouro', 'ranking', 'sonhos'];
CONFIG_PADRAO.push(['camp_jogos', '{}', 'Jogos da campanha ligados/desligados (JSON): raspadinha, bingo, ouro, ranking, sonhos — false = desligado. A Missão do Dia fica em missao.ativa']);
function campJogos_() {
  var j = cfgJson_('camp_jogos', {}) || {}, o = {};
  JOGOS_NOMES.forEach(function (k) { o[k] = j[k] !== false; });
  return o;
}
function missInt_(v) { var n = Math.round(Number(String(v == null ? '' : v).replace(/[^\d.-]/g, ''))); return isNaN(n) || n < 0 ? 0 : n; }
function missCfg_() {
  var c = cfgJson_('missao', {}) || {}, o = JSON.parse(JSON.stringify(MISS_PADRAO)), k;
  for (k in c) { if (k === 'pontos' && c.pontos && typeof c.pontos === 'object') { for (var j in c.pontos) o.pontos[j] = c.pontos[j]; } else o[k] = c[k]; }
  o.fora = Array.isArray(o.fora) ? o.fora : [];
  o.horarios = (Array.isArray(o.horarios) ? o.horarios : []).filter(function (h) { return /^\d{2}:\d{2}$/.test(h); });
  if (!o.horarios.length) o.horarios = MISS_PADRAO.horarios.slice();
  o.prazo_numeros_dias = Math.max(1, Math.min(7, missInt_(o.prazo_numeros_dias) || 2));
  o.por_raspadinha = Math.max(5, missInt_(o.por_raspadinha) || 50);
  o.conta = String(o.conta || 'lasvegas_ac').replace(/^@/, '').toLowerCase();
  ['postou', 'sequencia', 'sequencia_dias', 'resposta', 'clique', 'reacao', 'compart', 'venda', 'campea', 'teto_story'].forEach(function (x) { o.pontos[x] = missInt_(o.pontos[x]); });
  o.pontos.sequencia_dias = Math.max(2, o.pontos.sequencia_dias || 5);
  o.pontos.views = (Array.isArray(o.pontos.views) ? o.pontos.views : []).map(function (f) { return { min: missInt_(f.min), pts: missInt_(f.pts) }; })
    .filter(function (f) { return f.min > 0 && f.pts > 0; }).sort(function (a, b) { return a.min - b.min; });
  return o;
}
function missParticipantes_(cfg) {
  return colabs_().filter(function (c) { return c.ativa === 'SIM' && cfg.fora.indexOf(c.id) < 0 && !/teste/i.test(c.nome); })
    .sort(function (a, b) { return String(a.id).localeCompare(String(b.id)); });
}
function missDiaNum_(iso) { return Math.floor(new Date(String(iso).slice(0, 10) + 'T12:00:00Z').getTime() / 86400000); }
function missDomingo_(iso) { return new Date(String(iso).slice(0, 10) + 'T12:00:00Z').getUTCDay() === 0; }
function missHash_(img) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(img || '').replace(/^data:image\/\w+;base64,/, ''), Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}
function missDec_(s) { return String(s || '').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(); }

/* ───────── ofertas do dia (vêm do site) ───────── */
/* o calendário das ofertas é um script que o Google Tag Manager injeta na página (não vem no HTML da loja):
   procura no HTML e, se não achar, no gtm.js de cada contêiner GTM citado na página */
function missCalendarioTexto_(t) {
  var re = /\\?"(\d{4}-\d{2}-\d{2})\\?"\s*:\s*\\?"([^"\\]+)\\?"\.split\(/g, m, cal = {};
  while ((m = re.exec(t))) cal[m[1]] = m[2].split(' ').filter(String);
  return cal;
}
function missBaixar_(url) {
  try { var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true }); return { cod: r.getResponseCode(), txt: r.getResponseCode() < 300 ? r.getContentText() : '' }; }
  catch (e) { return { cod: 0, txt: '', erro: String(e && e.message || e) }; }
}
function missTem_(o) { for (var k in o) return true; return false; }
function missCalendarioSite_(cfg) {
  var passos = [], cal, g, ids = {};
  if (cfg.gtm) ids[cfg.gtm] = 1;
  for (var id in ids) {                                   // 1º: o contêiner GTM conhecido (não depende da loja responder)
    g = missBaixar_('https://www.googletagmanager.com/gtm.js?id=' + id); passos.push('GTM ' + id + ': ' + (g.cod || g.erro));
    cal = missCalendarioTexto_(g.txt); if (missTem_(cal)) return cal;
  }
  var h = missBaixar_(cfg.site + '/'); passos.push('site: ' + (h.cod || h.erro));
  cal = missCalendarioTexto_(h.txt); if (missTem_(cal)) return cal;
  (h.txt.match(/GTM-[A-Z0-9]{4,12}/g) || []).forEach(function (x) { if (!ids[x]) ids[x] = 2; });
  for (var id2 in ids) if (ids[id2] === 2) {
    g = missBaixar_('https://www.googletagmanager.com/gtm.js?id=' + id2); passos.push('GTM ' + id2 + ': ' + (g.cod || g.erro));
    cal = missCalendarioTexto_(g.txt); if (missTem_(cal)) return cal;
  }
  throw new Error('Não achei o calendário das ofertas (' + passos.join(' · ') + ')');
}
/* rodar pelo editor do Apps Script para ver por que as ofertas não vieram (só lê, não grava nada) */
function missDiagnostico() {
  var cfg = missCfg_(), hoje = hoje_(), o = { hoje: hoje, ativa: cfg.ativa, inicio: cfg.inicio, domingo: missDomingo_(hoje) };
  var g = missBaixar_('https://www.googletagmanager.com/gtm.js?id=' + cfg.gtm), cg = missCalendarioTexto_(g.txt);
  o.gtm = { cod: g.cod, erro: g.erro, tamanho: g.txt.length, dias: Object.keys(cg).length, hoje: cg[hoje] || null };
  var h = missBaixar_(cfg.site + '/'); o.site = { cod: h.cod, erro: h.erro, tamanho: h.txt.length, dias: Object.keys(missCalendarioTexto_(h.txt)).length };
  var hs = cg[hoje] || [];
  if (hs.length) { var p = missBaixar_(cfg.site + '/produtos/' + hs[0] + '/'); o.pagina_produto = { cod: p.cod, erro: p.erro, tamanho: p.txt.length }; try { o.produto = missProdutoSite_(cfg, hs[0]); } catch (e) { o.produto = String(e); } }
  try { o.api_conectada = typeof nsConectado_ === 'function' && nsConectado_(); } catch (e2) { o.api_conectada = String(e2); }
  try { o.aba = ler_('MissaoOfertas').map(function (r) { return r.data + ' ' + r.origem; }); } catch (e3) { o.aba = String(e3); }
  try { o.espera = CacheService.getScriptCache().get('miss_falha'); } catch (e4) {}
  Logger.log('DIAG ' + JSON.stringify(o));
  return o;
}
function missProdutoSite_(cfg, handle) {
  var o = { handle: handle, nome: '', foto: '', preco: 0, url: cfg.site + '/produtos/' + handle + '/', ns_id: '' };
  try {
    if (typeof nsConectado_ === 'function' && nsConectado_()) {
      var l = nsApi_('get', '/products?handle=' + encodeURIComponent(handle) + '&fields=id,name,images,variants');
      var p = Array.isArray(l) ? l[0] : null;
      if (p) {
        o.ns_id = String(p.id); o.nome = nsTexto_(p.name).replace(/\s+/g, ' ').trim();
        o.foto = p.images && p.images.length ? String(p.images[0].src || '') : '';
        var v = (p.variants || [])[0] || {}; o.preco = Number(v.price) || 0;
      }
    }
  } catch (e) {}
  if (!o.nome) {
    try {
      var r = UrlFetchApp.fetch(o.url, { muteHttpExceptions: true, followRedirects: true });
      if (r.getResponseCode() < 300) {
        var t = r.getContentText(), g = function (re) { var m = t.match(re); return m ? missDec_(m[1]) : ''; };
        o.nome = g(/<meta property="og:title" content="([^"]*)"/);
        o.foto = g(/<meta property="og:image" content="([^"]*)"/);
        o.preco = Number(g(/nuvemshop:price" content="([^"]*)"/)) || 0;
        o.ns_id = g(/product_id(?:&quot;|")\s*:\s*(\d+)/);
      }
    } catch (e2) {}
  }
  if (!o.nome) o.nome = handle.replace(/-[a-z0-9]{5}$/, '').replace(/-/g, ' ').replace(/(^|\s)\S/g, function (x) { return x.toUpperCase(); });
  o.foto = String(o.foto || '').replace(/^http:/, 'https:').replace(/^\/\//, 'https://');
  o.nome = o.nome.slice(0, 120);
  return o;
}
/* liga cada oferta aos produtos do PDV (pelo vínculo com o site), para a venda pontuar sozinha */
function missLigarPdv_(itens) {
  var porNs = {};
  try { ler_('VinculosNuvemshop').forEach(function (v) { (porNs[v.ns_produto_id] = porNs[v.ns_produto_id] || []).push(v.produto_id); }); } catch (e) {}
  itens.forEach(function (i) { i.pids = i.ns_id && porNs[i.ns_id] ? porNs[i.ns_id] : []; });
  return itens;
}
function missHandle_(s) {
  s = String(s || '').trim().toLowerCase();
  var m = s.match(/\/produtos\/([^\/?#]+)/); if (m) s = m[1]; else if (s.indexOf('-') < 0) return '';      // solto, só vale se tiver cara de endereço de produto
  return /^[a-z0-9][a-z0-9-]{2,160}$/.test(s) ? s : '';
}
function missGravarOfertas_(data, handles, origem, cfg) {
  var vistos = {}, itens = [];
  handles.forEach(function (h) { h = missHandle_(h); if (h && !vistos[h] && itens.length < 12) { vistos[h] = 1; itens.push(missProdutoSite_(cfg, h)); } });
  missLigarPdv_(itens);
  var row = ler_('MissaoOfertas').filter(function (r) { return r.data === data; })[0] || { data: data };
  row.itens = JSON.stringify(itens); row.origem = origem; row.atualizado_em = agora_();
  gravar_('MissaoOfertas', row);
  _missMemo = null;
  return itens;
}
/* lê do site uma vez por dia; se falhar, espera 10 min antes de tentar de novo (não trava o portal) */
function missGarantirOfertas_(cfg, forcar) {
  var hoje = hoje_();
  if (!forcar) {
    if (missDomingo_(hoje) || hoje < cfg.inicio) return;
    if (ler_('MissaoOfertas').some(function (r) { return r.data === hoje; })) return;
    var cache = CacheService.getScriptCache();
    if (cache.get('miss_falha')) return;
  }
  try {
    var cal = missCalendarioSite_(cfg), hs = cal[hoje] || [];
    if (!hs.length) throw new Error('O site não tem ofertas marcadas para hoje');
    missGravarOfertas_(hoje, hs, 'site', cfg);
  } catch (e) {
    try { CacheService.getScriptCache().put('miss_falha', String(e && e.message || e).slice(0, 300) || '1', 180); } catch (e2) {}
    log_('Missão do Dia', 'ofertas do site', String(e && e.message || e));
    if (forcar) throw e;
  }
}

/* ───────── contexto (lido uma vez por chamada) ───────── */
function missCtx_() {
  if (_missMemo) return _missMemo;
  var cfg = missCfg_(), ofertas = {};
  ler_('MissaoOfertas').forEach(function (r) { ofertas[r.data] = campJson_(r.itens, []); });
  var pontos = {};
  ler_('Pontos').forEach(function (p) { if (p.entrada) pontos[p.chave] = 1; });
  _missMemo = { cfg: cfg, hoje: hoje_(), ofertas: ofertas, stories: ler_('MissaoStories'), pdv: ler_('VendasPDV'), pontos: pontos, part: missParticipantes_(cfg), ev: {} };
  return _missMemo;
}
function missPostado_(s) { return s.status === 'ok' || s.status === 'conferir'; }
function missViewsPts_(cfg, views) { var p = 0; cfg.pontos.views.forEach(function (f) { if (views >= f.min) p = f.pts; }); return p; }
function missEngaj_(cfg, s) {
  if (s.status !== 'ok' || s.num_status !== 'ok') return 0;
  var P = cfg.pontos, t = missInt_(s.respostas) * P.resposta + missInt_(s.cliques) * P.clique + missInt_(s.reacoes) * P.reacao + missInt_(s.compart) * P.compart + missViewsPts_(cfg, missInt_(s.views));
  return P.teto_story > 0 ? Math.min(P.teto_story, t) : t;
}
function missStoryPts_(cfg, s) { return s.status === 'ok' ? cfg.pontos.postou + missEngaj_(cfg, s) : 0; }
function missVendeuOferta_(venda, itensOferta) {
  var its = campJson_(venda.itens, []), achou = '';
  its.forEach(function (i) {
    if (achou) return;
    var n = campNorm_(i.nome);
    itensOferta.forEach(function (o) {
      if (achou) return;
      if (i.id && (o.pids || []).indexOf(i.id) >= 0) { achou = o.nome; return; }
      var on = campNorm_(o.nome);
      if (on.length >= 6 && (n === on || n.indexOf(on + ' ') === 0)) achou = o.nome;
    });
  });
  return achou;
}
/* campeãs de cada semana já encerrada (seg–sáb): quem somou mais pontos de story; vale a partir da terça seguinte */
function missCampeas_(ctx) {
  if (ctx.campeas) return ctx.campeas;
  var cfg = ctx.cfg, out = {}, sem = campSemana_(cfg.inicio);
  for (; campDia_(sem, 8) <= ctx.hoje; sem = campDia_(sem, 7)) {
    var fim = campDia_(sem, 5), soma = {}, max = 0;
    ctx.stories.forEach(function (s) { if (s.data >= sem && s.data <= fim && s.data >= cfg.inicio) soma[s.colaboradora_id] = (soma[s.colaboradora_id] || 0) + missStoryPts_(cfg, s); });
    for (var k in soma) if (soma[k] > max) max = soma[k];
    out[sem] = { fim: fim, ids: max > 0 ? Object.keys(soma).filter(function (k2) { return soma[k2] === max; }) : [], pts: max };
  }
  ctx.campeas = out;
  return out;
}
/* tudo o que deu ponto para a pessoa: [{data, tipo, pts, txt}] + a sequência atual */
function missEventos_(eid, ctx) {
  if (ctx.ev[eid]) return ctx.ev[eid];
  var cfg = ctx.cfg, P = cfg.pontos, ev = [], meus = {}, d;
  ctx.stories.forEach(function (s) { if (s.colaboradora_id === eid && s.data >= cfg.inicio) meus[s.data] = s; });
  for (d in meus) {
    var s = meus[d];
    if (s.status === 'ok') {
      ev.push({ data: d, tipo: 'postou', pts: P.postou, txt: 'Story de ' + s.produto });
      var e = missEngaj_(cfg, s);
      if (e > 0) ev.push({ data: d, tipo: 'engajamento', pts: e, txt: missInt_(s.views) + ' visualizações · ' + missInt_(s.respostas) + ' respostas · ' + missInt_(s.cliques) + ' cliques' });
    }
  }
  var run = 0;
  for (d = cfg.inicio; d <= ctx.hoje; d = campDia_(d, 1)) {
    if (missDomingo_(d)) continue;
    if (meus[d] && missPostado_(meus[d])) { run++; if (run % P.sequencia_dias === 0 && P.sequencia > 0) ev.push({ data: d, tipo: 'sequencia', pts: P.sequencia, txt: run + ' dias seguidos postando' }); }
    else if (d < ctx.hoje && ctx.ofertas[d] && ctx.pontos[eid + '|' + d]) run = 0;      // trabalhou, tinha oferta e não postou: zera
  }
  if (P.venda > 0) ctx.pdv.forEach(function (v) {
    if (v.colaboradora_id !== eid || v.status === 'cancelada' || v.data < cfg.inicio || !ctx.ofertas[v.data]) return;
    var nome = missVendeuOferta_(v, ctx.ofertas[v.data]);
    if (nome) ev.push({ data: v.data, tipo: 'venda', pts: P.venda, txt: 'Vendeu a oferta do dia: ' + nome });
  });
  var camp = missCampeas_(ctx);
  if (P.campea > 0) for (var sem in camp) if (camp[sem].ids.indexOf(eid) >= 0) ev.push({ data: camp[sem].fim, tipo: 'campea', pts: P.campea, txt: 'Story campeão da semana de ' + sem.slice(8, 10) + '/' + sem.slice(5, 7) });
  ev.sort(function (a, b) { return b.data.localeCompare(a.data); });
  ctx.ev[eid] = { ev: ev, sequencia: run };
  return ctx.ev[eid];
}
function missSoma_(ev, de, ate) { return ev.reduce(function (s, e) { return s + (e.data >= de && e.data <= ate ? e.pts : 0); }, 0); }
function missPontosMes_(eid, ctx, mes) { return missSoma_(missEventos_(eid, ctx).ev, mes + '-01', mes + '-31'); }

/* ───────── raspadinhas da missão (a cada X pontos no mês) ───────── */
function missTickets_(eid, premios) {
  var ctx = missCtx_(), cfg = ctx.cfg, out = [];
  if (!cfg.ativa || !ctx.part.some(function (c) { return c.id === eid; })) return out;
  var feitas = {}; premios.forEach(function (p) { if (p.tipo === 'raspadinha' && p.colaboradora_id === eid) feitas[p.ref] = 1; });
  var meses = [mesDe_(ctx.hoje)];
  if (Number(ctx.hoje.slice(8, 10)) <= 7) meses.unshift(mesDe_(campDia_(ctx.hoje.slice(0, 8) + '01', -1)));      // até o dia 7 ainda dá para raspar as do mês passado
  meses.forEach(function (mes) {
    var n = Math.floor(missPontosMes_(eid, ctx, mes) / cfg.por_raspadinha);
    for (var k = 1; k <= n; k++) { var ref = mes + '-M' + ('0' + k).slice(-2); if (!feitas[ref]) out.push({ data: ref, vendido: 0, missao: true, pontos: k * cfg.por_raspadinha }); }
  });
  return out;
}
var _missRaspDisp = campRaspDisponiveis_;
campRaspDisponiveis_ = function (eid, cfg, vendas, premios) {
  var base = campJogos_().raspadinha ? _missRaspDisp(eid, cfg, vendas, premios) : [];      // raspadinha de venda desligada: ficam só as da missão
  try { base = base.concat(missTickets_(eid, premios)); } catch (e) {}
  return base;
};
function missRaspar_(c, ref) {
  return comTrava_(function () {
    var cfg = campCfg_(), premios = ler_('CampPremios');
    var alvo = missTickets_(c.id, premios).filter(function (x) { return x.data === ref; })[0];
    if (!alvo) {
      var ja = premios.filter(function (p) { return p.tipo === 'raspadinha' && p.colaboradora_id === c.id && p.ref === ref; })[0];
      if (ja) return { ok: true, repetida: true, premio: campPremioPub_(ja) };
      throw new Error('Essa raspadinha não está liberada');
    }
    var lista = (cfg.raspadinha.premios || []).filter(function (p) { return p.ativo !== false && Number(p.peso) > 0; });
    if (!lista.length) throw new Error('A administração ainda não cadastrou os prêmios da raspadinha');
    var tot = lista.reduce(function (s, p) { return s + Number(p.peso); }, 0), sorte = Math.random() * tot, esc = lista[lista.length - 1];
    for (var i = 0; i < lista.length; i++) { sorte -= Number(lista[i].peso); if (sorte < 0) { esc = lista[i]; break; } }
    var p = { id: 'R|' + c.id + '|' + ref, tipo: 'raspadinha', colaboradora_id: c.id, colaboradora: c.nome, ref: ref,
              premio: (esc.emoji ? esc.emoji + ' ' : '') + esc.nome, nada: esc.nada ? 'SIM' : 'NÃO', status: esc.nada ? '—' : 'entregar', criado_em: agora_(), entregue_em: '', entregue_por: '' };
    gravar_('CampPremios', p);
    log_(c.nome, 'raspadinha da missão', ref + ' · ' + p.premio);
    return { ok: true, premio: campPremioPub_(p) };
  });
}
var _missBingoPremios = campBingoPremios_;
campBingoPremios_ = function (c, cart, cfg, premios) { return campJogos_().bingo ? _missBingoPremios(c, cart, cfg, premios) : []; };      // bingo desligado não gera prêmio
var _missCampRaspar = campRaspar_;
campRaspar_ = function (c, data) { return /-M\d+$/.test(String(data || '')) ? missRaspar_(c, String(data)) : _missCampRaspar(c, data); };

/* ───────── IA que confere os prints ───────── */
function missIaLigada_() { try { return typeof estChaveIA_ === 'function' && !!estChaveIA_(); } catch (e) { return false; } }
function missIA_(img, prompt) {
  if (!missIaLigada_()) return null;
  try { return estIA_([{ mime: 'image/jpeg', b64: String(img || '').replace(/^data:image\/\w+;base64,/, '') }], prompt) || null; }
  catch (e) { log_('Missão do Dia', 'IA', String(e && e.message || e)); return null; }
}
function missPromptPost_(cfg, produto) {
  return 'Esta imagem deveria ser uma captura de tela de um STORY do Instagram JÁ PUBLICADO na conta @' + cfg.conta + ' (uma loja), mostrando o produto "' + produto + '". ' +
    'Olhe com atenção e seja honesto. Um story publicado mostra, no topo, as barrinhas de progresso, a foto e o nome da conta e há quanto tempo foi postado; ' +
    'a tela de edição (antes de publicar) mostra botões como "Seu story", "Amigos próximos" ou ferramentas de texto/figurinha e NÃO vale. Foto solta da galeria também não vale. ' +
    'Responda SOMENTE com JSON, sem texto antes ou depois: {"eh_story":true,"publicado":true,"conta":"nome de usuário que aparece no topo, sem @, ou vazio se não der para ler",' +
    '"mostra_produto":true,"confianca":"alta|media|baixa","obs":"uma frase curta dizendo o que você viu"}. Use null em mostra_produto se não der para saber.';
}
function missPromptNum_(cfg) {
  return 'Esta imagem deveria ser uma captura de tela dos NÚMEROS de um story do Instagram da conta @' + cfg.conta + ': a tela de informações/insights do story ' +
    '(Visão geral, Contas alcançadas, Interações, Respostas, Compartilhamentos, Cliques no link, Curtidas) ou a lista "Visto por N" / o ícone de olho com o número de visualizações. ' +
    'Leia SOMENTE os números que estão escritos na imagem. Não invente e não some: o que não aparecer fica null. "1,2 mil" = 1200. ' +
    'Responda SOMENTE com JSON, sem texto antes ou depois: {"eh_numeros":true,"views":0,"contas_alcancadas":0,"respostas":0,"cliques_link":0,"curtidas":0,"compartilhamentos":0,' +
    '"confianca":"alta|media|baixa","obs":"uma frase curta"}. views = visualizações / "Visto por". curtidas = curtidas ou reações.';
}

/* rodar pelo editor do Apps Script: mostra se a IA está ligada e testa a leitura com o último print enviado (não grava nada) */
function missDiagnosticoIA() {
  var o = { ligada: missIaLigada_() }, cfg = missCfg_();
  try { var ec = estCfg_(); o.provedor = ec.ia_provedor; o.modelo = ec.ia_modelo || EST_MODELOS[ec.ia_provedor]; } catch (e) { o.cfg_erro = String(e); }
  var st = ler_('MissaoStories'); o.stories = st.slice(-4).map(function (s) { return s.id + ' · ' + s.status + ' · ' + s.obs + ' · ia: ' + String(s.ia_post).slice(0, 200); });
  var ult = st.filter(function (s) { return s.url_post; }).pop();
  if (ult && o.ligada) {
    try {
      var id = (String(ult.url_post).match(/[?&]id=([\w-]+)/) || [])[1], b64 = Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes());
      o.tamanho_b64 = b64.length;
      o.teste = estIA_([{ mime: 'image/jpeg', b64: b64 }], missPromptPost_(cfg, ult.produto));
    } catch (e2) { o.teste_erro = String(e2 && e2.message || e2); }
  }
  Logger.log('DIAGIA ' + JSON.stringify(o));
  return o;
}

/* ───────── vendedora: postar e mandar os números ───────── */
function missHorario_(cfg, part, eid, data) {
  var i = -1; part.forEach(function (p, k) { if (p.id === eid) i = k; });
  return i < 0 ? '' : cfg.horarios[(i + missDiaNum_(data)) % cfg.horarios.length];
}
function missSugerida_(part, eid, data, itens) {
  var i = -1; part.forEach(function (p, k) { if (p.id === eid) i = k; });
  return i < 0 || !itens.length ? '' : itens[(i + missDiaNum_(data)) % itens.length].handle;
}
function missChecarParticipa_(c, cfg) {
  if (!cfg.ativa) throw new Error('A Missão do Dia está pausada');
  if (cfg.fora.indexOf(c.id) >= 0) throw new Error('Você não está participando da Missão do Dia');
}
function missPrintRepetido_(hash, menosId, parte) {
  return ler_('MissaoStories').some(function (s) {
    return (s.hash_post === hash && !(s.id === menosId && parte === 'post')) || (s.hash_num === hash && !(s.id === menosId && parte === 'num'));
  });
}
function missPostar_(c, req) {
  var cfg = missCfg_(); missChecarParticipa_(c, cfg);
  var hoje = hoje_(), id = 'S|' + c.id + '|' + hoje, handle = missHandle_(req.handle);
  missGarantirOfertas_(cfg, false);
  var itens = campJson_((ler_('MissaoOfertas').filter(function (r) { return r.data === hoje; })[0] || {}).itens, []);
  var of = itens.filter(function (i) { return i.handle === handle; })[0];
  if (!of) throw new Error('Escolha um dos produtos da oferta de hoje');
  var stories = ler_('MissaoStories'), meu = stories.filter(function (s) { return s.id === id; })[0];
  if (meu && missPostado_(meu)) throw new Error(meu.status === 'ok' ? 'O seu story de hoje já está valendo ✔' : 'O seu story de hoje está esperando a conferência da administração');
  var part = missParticipantes_(cfg);
  if (itens.length >= part.length && stories.some(function (s) { return s.data === hoje && s.handle === handle && s.colaboradora_id !== c.id && missPostado_(s); }))
    throw new Error('Esse produto já foi postado hoje por outra pessoa — escolha outro da lista');
  var hash = missHash_(req.img);
  if (missPrintRepetido_(hash, id, 'post')) throw new Error('Esse print já foi usado antes. Mande o print do story de hoje.');
  var ia = missIA_(req.img, missPromptPost_(cfg, of.nome)), status = 'conferir', obs = '';
  if (ia) {
    var conta = String(ia.conta || '').replace(/^@/, '').toLowerCase(), contaOk = !!conta && conta.indexOf(cfg.conta) >= 0;
    if (ia.eh_story === false && ia.confianca === 'alta') throw new Error('Esse print não parece um story no ar' + (ia.obs ? ' (' + String(ia.obs).slice(0, 120) + ')' : '') + '. Abra o story publicado no Instagram da loja e tire o print dele.');
    if (ia.publicado === false && ia.confianca === 'alta') throw new Error('Parece a tela antes de publicar. Publique o story e tire o print dele já no ar.');
    if (ia.eh_story === true && ia.publicado !== false && contaOk && ia.confianca !== 'baixa') status = 'ok';
    else obs = !contaOk ? 'A IA não achou @' + cfg.conta + ' no print' + (conta ? ' (leu "' + conta.slice(0, 40) + '")' : '') : 'A IA ficou em dúvida: ' + String(ia.obs || '').slice(0, 160);
  } else obs = missIaLigada_() ? 'A IA não conseguiu ler este print' : 'Leitura automática desligada';
  var url = campSalvarFoto_(req.img, 'Stories da missão', c.nome + ' - story - ' + hoje);
  return comTrava_(function () {
    var s = ler_('MissaoStories').filter(function (x) { return x.id === id; })[0] || { id: id };
    s.data = hoje; s.colaboradora_id = c.id; s.colaboradora = c.nome; s.handle = handle; s.produto = of.nome; s.horario = missHorario_(cfg, part, c.id, hoje);
    s.url_post = url; s.hash_post = hash; s.status = status; s.post_em = agora_(); s.ia_post = ia ? JSON.stringify(ia).slice(0, 600) : '';
    s.obs = obs; s.decidido_por = status === 'ok' ? 'IA' : ''; s.decidido_em = status === 'ok' ? agora_() : '';
    gravar_('MissaoStories', s); _missMemo = null;
    log_(c.nome, 'missão · story', of.nome + ' · ' + status);
    return { ok: true, status: status };
  });
}
function missPrazo_(cfg, data) { return campDia_(data, cfg.prazo_numeros_dias); }
function missNumeros_(c, req) {
  var cfg = missCfg_(); missChecarParticipa_(c, cfg);
  var hoje = hoje_(), id = 'S|' + c.id + '|' + String(req.data || '').slice(0, 10);
  var s0 = ler_('MissaoStories').filter(function (x) { return x.id === id; })[0];
  if (!s0 || !missPostado_(s0)) throw new Error('Não achei o seu story desse dia');
  if (hoje > missPrazo_(cfg, s0.data)) throw new Error('O prazo para mandar os números desse story já passou');
  var hash = missHash_(req.img);
  if (missPrintRepetido_(hash, id, 'num')) throw new Error('Esse print já foi usado antes. Mande o print dos números deste story.');
  var ia = missIA_(req.img, missPromptNum_(cfg)), status = 'conferir', obs = '', n = { views: 0, respostas: 0, cliques: 0, reacoes: 0, compart: 0 };
  if (ia) {
    if (ia.eh_numeros === false && ia.confianca === 'alta') throw new Error('Esse print não mostra os números do story' + (ia.obs ? ' (' + String(ia.obs).slice(0, 120) + ')' : '') + '. Abra o story, deslize para cima e tire o print da tela de visualizações.');
    n.views = missInt_(ia.views) || missInt_(ia.contas_alcancadas); n.respostas = missInt_(ia.respostas); n.cliques = missInt_(ia.cliques_link);
    n.reacoes = missInt_(ia.curtidas); n.compart = missInt_(ia.compartilhamentos);
    if (ia.eh_numeros === true && ia.confianca !== 'baixa' && n.views > 0 && n.views <= 50000) status = 'ok';
    else obs = n.views > 50000 ? 'Número alto demais — confira' : 'A IA ficou em dúvida: ' + String(ia.obs || 'não achei as visualizações').slice(0, 160);
  } else obs = missIaLigada_() ? 'A IA não conseguiu ler este print' : 'Leitura automática desligada';
  var url = campSalvarFoto_(req.img, 'Stories da missão', c.nome + ' - numeros - ' + s0.data);
  return comTrava_(function () {
    var s = ler_('MissaoStories').filter(function (x) { return x.id === id; })[0];
    if (s.num_status === 'ok' && status !== 'ok') throw new Error('Não consegui ler esse print novo, então os números que já estavam valendo continuam.');
    if (s.num_status === 'ok' && n.views < missInt_(s.views)) throw new Error('Esse print tem menos visualizações do que o que já está valendo — fica o anterior.');
    s.url_num = url; s.hash_num = hash; s.num_em = agora_(); s.ia_num = ia ? JSON.stringify(ia).slice(0, 600) : '';
    s.views = String(n.views); s.respostas = String(n.respostas); s.cliques = String(n.cliques); s.reacoes = String(n.reacoes); s.compart = String(n.compart);
    s.num_status = status; if (obs) s.obs = obs;
    gravar_('MissaoStories', s); _missMemo = null;
    log_(c.nome, 'missão · números', s.produto + ' · ' + status + ' · ' + n.views + ' views');
    return { ok: true, status: status, numeros: n, pontos: status === 'ok' ? missEngaj_(cfg, s) : 0 };
  });
}

/* ───────── pacote da vendedora ───────── */
function missStoryPub_(cfg, s) {
  return { id: s.id, data: s.data, colaboradora_id: s.colaboradora_id, colaboradora: campPrimeiro_(s.colaboradora), handle: s.handle, produto: s.produto, horario: s.horario, url_post: s.url_post, status: s.status, post_em: String(s.post_em || ''),
           url_num: s.url_num, num_status: s.num_status || '', num_em: String(s.num_em || ''), views: missInt_(s.views), respostas: missInt_(s.respostas), cliques: missInt_(s.cliques), reacoes: missInt_(s.reacoes), compart: missInt_(s.compart),
           obs: s.obs || '', pontos: missStoryPts_(cfg, s), prazo: missPrazo_(cfg, s.data), por: s.decidido_por || '' };
}
function missRanking_(ctx) {
  var cfg = ctx.cfg, hoje = ctx.hoje, mes = mesDe_(hoje), sem = campSemana_(hoje), fimSem = campDia_(sem, 6);
  var l = ctx.part.map(function (c) {
    var E = missEventos_(c.id, ctx), evMes = E.ev.filter(function (e) { return mesDe_(e.data) === mes; });
    var conta = function (t) { return evMes.filter(function (e) { return e.tipo === t; }).length; };
    var st = ctx.stories.filter(function (s) { return s.colaboradora_id === c.id && s.data === hoje; })[0];
    return { id: c.id, nome: campPrimeiro_(c.nome), cor: c.cor || '', mes: missSoma_(E.ev, mes + '-01', mes + '-31'), semana: missSoma_(E.ev, sem, fimSem), stories: conta('postou'), vendas: conta('venda'),
             sequencia: E.sequencia, hoje: st ? st.status : '', ev: evMes.slice(0, 20) };
  });
  l.sort(function (a, b) { return b.mes - a.mes || b.semana - a.semana || a.nome.localeCompare(b.nome); });
  return l;
}
function missResumo_(c) {
  var cfg = missCfg_(), o = { ativa: !!cfg.ativa, participa: cfg.fora.indexOf(c.id) < 0, conta: cfg.conta, regras: cfg.pontos, por_raspadinha: cfg.por_raspadinha, prazo_dias: cfg.prazo_numeros_dias, ia: missIaLigada_() };
  if (!cfg.ativa) return o;
  missGarantirOfertas_(cfg, false);
  var ctx = missCtx_(), hoje = ctx.hoje, mes = mesDe_(hoje), itens = ctx.ofertas[hoje] || [];
  var deHoje = ctx.stories.filter(function (s) { return s.data === hoje && missPostado_(s); }), tomada = {};
  deHoje.forEach(function (s) { tomada[s.handle] = s.colaboradora_id === c.id ? 'você' : campPrimeiro_(s.colaboradora); });
  o.comecou = hoje >= cfg.inicio; o.inicio = cfg.inicio; o.domingo = missDomingo_(hoje);
  o.ofertas = itens.map(function (i) { return { handle: i.handle, nome: i.nome, foto: i.foto, preco: i.preco, url: i.url, tomada: itens.length >= ctx.part.length ? (tomada[i.handle] || '') : '' }; });
  o.ranking = missRanking_(ctx);
  if (!o.participa) return o;
  var E = missEventos_(c.id, ctx), pts = missSoma_(E.ev, mes + '-01', mes + '-31');
  o.pontos_mes = pts; o.sequencia = E.sequencia; o.faltam = cfg.por_raspadinha - (pts % cfg.por_raspadinha);
  o.extrato = E.ev.slice(0, 25);
  o.horario = missHorario_(cfg, ctx.part, c.id, hoje); o.sugerida = missSugerida_(ctx.part, c.id, hoje, itens);
  var meu = ctx.stories.filter(function (s) { return s.id === 'S|' + c.id + '|' + hoje; })[0];
  o.story = meu ? missStoryPub_(cfg, meu) : null;
  o.numeros = ctx.stories.filter(function (s) { return s.colaboradora_id === c.id && missPostado_(s) && hoje <= missPrazo_(cfg, s.data); })
    .sort(function (a, b) { return b.data.localeCompare(a.data); }).map(function (s) { return missStoryPub_(cfg, s); });
  o.raspadinhas = missTickets_(c.id, ler_('CampPremios'));
  return o;
}
var _missCampResumo = campResumo_;
campResumo_ = function (c) {
  var o = _missCampResumo(c);
  try { o.jogos = campJogos_(); if (!o.jogos.bingo) { delete o.bingo; o.bingo_novos = []; } } catch (e0) {}
  try { o.missao = missResumo_(c); if (o.jogos) o.jogos.missao = !!o.missao.ativa; if (o.ativa && !o.participa && o.missao.raspadinhas) o.raspadinhas = o.missao.raspadinhas; }
  catch (e) { o.missao = { erro: String(e && e.message || e) }; }
  return o;
};

/* ───────── ações da equipe: a = 'missao' ───────── */
var _missRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'missao') {
    try {
      var c = checarColab_(req), op = req.op, r;
      if (op === 'postar') r = missPostar_(c, req);
      else if (op === 'numeros') r = missNumeros_(c, req);
      else return { ok: false, erro: 'Operação desconhecida' };
      _missMemo = null; r.campanha = campResumo_(c);
      return r;
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (req && req.a === 'campanha') {
    var J = campJogos_(), qual = { print: 'bingo', ouro: 'ouro', chamei: 'ouro', ranking: 'ranking', sonho: 'sonhos' }[req.op];
    if (qual === 'ranking' && J.sonhos) qual = '';                         // o mural usa a mesma chamada do ranking
    if (qual && !J[qual]) return { ok: false, erro: 'Esse jogo está desligado no momento' };
  }
  return _missRodar(req);
};

/* ───────── administração: a = 'admMissao' ───────── */
ADMIN.admMissao = function (req) {
  var op = req.op || 'painel', cfg = missCfg_();
  if (op === 'painel') {
    var aviso = '';
    if (cfg.ativa) { try { missGarantirOfertas_(cfg, false); } catch (e) {} }
    var ctx = missCtx_(), hoje = ctx.hoje, desde = campDia_(hoje, -35);
    if (cfg.ativa && !missDomingo_(hoje) && hoje >= cfg.inicio && !(ctx.ofertas[hoje] || []).length) { aviso = 'Não consegui ler as ofertas de hoje no site. Toque em "Buscar no site de novo" ou cole os links dos produtos.'; try { var mf = CacheService.getScriptCache().get('miss_falha'); if (mf && mf !== '1') aviso += ' Motivo: ' + mf; } catch (e9) {} }
    var jg = campJogos_(); jg.missao = !!cfg.ativa;
    return { ok: true, cfg: cfg, jogos: jg, ia: missIaLigada_(), hoje: hoje, aviso: aviso, ofertas: ctx.ofertas[hoje] || [], origem: (ler_('MissaoOfertas').filter(function (r) { return r.data === hoje; })[0] || {}).origem || '',
             ranking: missRanking_(ctx), campeas: missCampeas_(ctx),
             stories: ctx.stories.filter(function (s) { return s.data >= desde; }).sort(function (a, b) { return String(b.post_em).localeCompare(String(a.post_em)); }).map(function (s) { return missStoryPub_(cfg, s); }),
             escala: ctx.part.map(function (c) { return { id: c.id, nome: campPrimeiro_(c.nome), horario: missHorario_(cfg, ctx.part, c.id, hoje), sugerida: missSugerida_(ctx.part, c.id, hoje, ctx.ofertas[hoje] || []) }; }),
             colaboradoras: colabs_().filter(function (c) { return c.ativa === 'SIM' && !/teste/i.test(c.nome); }).map(function (c) { return { id: c.id, nome: c.nome }; }) };
  }
  if (op === 'jogos') {
    var vj = req.valor || {}, aj = cfgJson_('camp_jogos', {}) || {};
    JOGOS_NOMES.forEach(function (k) { if (vj[k] != null) aj[k] = !!vj[k]; });
    setCfg_('camp_jogos', JSON.stringify(aj));
    if (vj.missao != null) { var am = cfgJson_('missao', {}) || {}; am.ativa = !!vj.missao; setCfg_('missao', JSON.stringify(am)); }
    _missMemo = null;
    log_('Administração', 'jogos da campanha', JSON.stringify(vj));
    var jj = campJogos_(); jj.missao = !!missCfg_().ativa;
    return { ok: true, jogos: jj };
  }
  if (op === 'decidir') {
    var s = ler_('MissaoStories').filter(function (x) { return x.id === req.id; })[0];
    if (!s) throw new Error('Story não encontrado');
    if (req.parte === 'num') {
      if (req.aprovar) {
        var nn = req.numeros || {};
        ['views', 'respostas', 'cliques', 'reacoes', 'compart'].forEach(function (k) { if (nn[k] != null && nn[k] !== '') s[k] = String(missInt_(nn[k])); });
        s.num_status = 'ok'; if (!s.num_em) s.num_em = agora_();
      } else { s.num_status = 'recusado'; s.hash_num = ''; }
    } else { s.status = req.aprovar ? 'ok' : 'recusado'; if (!req.aprovar) s.hash_post = ''; }
    s.obs = req.aprovar ? '' : String(req.motivo || 'Print recusado').slice(0, 200);
    s.decidido_por = 'Administração'; s.decidido_em = agora_();
    gravar_('MissaoStories', s); _missMemo = null;
    log_('Administração', 'missão · ' + (req.parte === 'num' ? 'números' : 'story'), s.colaboradora + ' · ' + s.data + ' · ' + (req.aprovar ? 'aprovado' : 'recusado'));
    return { ok: true };
  }
  if (op === 'ofertas') {
    if (req.buscar) { missGarantirOfertas_(cfg, true); return { ok: true }; }
    var hs = String(req.links || '').split(/[\s,;]+/).map(missHandle_).filter(String);
    if (!hs.length) throw new Error('Cole os links dos produtos da oferta de hoje (um por linha)');
    missGravarOfertas_(hoje_(), hs, 'administração', cfg);
    log_('Administração', 'missão · ofertas', hs.join(' '));
    return { ok: true };
  }
  if (op === 'cfg') {
    var v = req.valor || {}, atual = cfgJson_('missao', {}) || {};
    if (v.ativa != null) atual.ativa = !!v.ativa;
    if (v.inicio && /^\d{4}-\d{2}-\d{2}$/.test(v.inicio)) atual.inicio = v.inicio;
    if (Array.isArray(v.fora)) atual.fora = v.fora.map(String);
    if (v.conta != null) { var ct = String(v.conta).replace(/^@/, '').trim().toLowerCase(); if (!/^[a-z0-9._]{2,30}$/.test(ct)) throw new Error('Conta do Instagram inválida'); atual.conta = ct; }
    if (v.horarios != null) {
      var hh = String(Array.isArray(v.horarios) ? v.horarios.join(' ') : v.horarios).split(/[\s,;]+/).filter(String);
      if (!hh.length || hh.some(function (h) { return !/^([01]\d|2[0-3]):[0-5]\d$/.test(h); })) throw new Error('Horários inválidos — use 10:30, 14:00, 17:30');
      atual.horarios = hh.slice(0, 8);
    }
    if (v.prazo_numeros_dias != null) atual.prazo_numeros_dias = Math.max(1, Math.min(7, missInt_(v.prazo_numeros_dias)));
    if (v.por_raspadinha != null) { if (missInt_(v.por_raspadinha) < 5) throw new Error('Pontos por raspadinha: no mínimo 5'); atual.por_raspadinha = missInt_(v.por_raspadinha); }
    if (v.pontos) {
      var P = atual.pontos || {};
      ['postou', 'sequencia', 'sequencia_dias', 'resposta', 'clique', 'reacao', 'compart', 'venda', 'campea', 'teto_story'].forEach(function (k) { if (v.pontos[k] != null && v.pontos[k] !== '') P[k] = missInt_(v.pontos[k]); });
      if (Array.isArray(v.pontos.views)) P.views = v.pontos.views.map(function (f) { return { min: missInt_(f.min), pts: missInt_(f.pts) }; }).filter(function (f) { return f.min > 0 && f.pts > 0; }).slice(0, 5);
      atual.pontos = P;
    }
    setCfg_('missao', JSON.stringify(atual)); _missMemo = null;
    log_('Administração', 'config missão', JSON.stringify(atual).slice(0, 400));
    return { ok: true, cfg: missCfg_() };
  }
  throw new Error('Operação desconhecida');
};
