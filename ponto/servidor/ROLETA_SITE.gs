/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · ROLETA DO SITE — giros, cupom único de 24h e lista (v61 · 23/11/2026)
   Arquivo SEPARADO — fica DEPOIS de todos (precisa do ROLETA.gs e do NUVEMSHOP.gs antes).
   ───────────────────────────────────────────────────────────────
   O que faz:
   • O sorteio acontece AQUI (não no navegador da cliente).
   • Cada giro é gravado na aba GirosSite: nome, WhatsApp, prêmio, código, quando vence, aceite de mensagens.
   • Cada prêmio de desconto/frete vira um CUPOM ÚNICO na Nuvemshop (1 uso; SOMA com outras promoções desde 23/11 —
     cupom que não soma é recusado pela Nuvemshop quando há produto com preço promocional no carrinho).
     A Nuvemshop só aceita vencimento por dia; por isso o portal apaga o cupom quando completam as 24 h
     (gatilho roletaSiteLimpar a cada 15 min).
   • 1 giro por WhatsApp a cada X dias: quem volta vê o mesmo prêmio (ou o aviso de que venceu).
   • Pedido do site que usa o cupom → o giro fica "usado" com o número do pedido.
   • Brinde não vira cupom: a cliente resgata pelo WhatsApp com o código.
   Regras em Config › roleta_site (JSON). Modo (desligada | teste | ligada) continua no ROLETA.gs.
   ═══════════════════════════════════════════════════════════════ */

ABAS.GirosSite = ['id', 'criado_em', 'data', 'hora', 'nome', 'tel', 'chave_tel', 'premio', 'chave_premio', 'tipo', 'valor', 'minimo', 'ns_cupom_id',
                  'vence_em', 'vence_ms', 'status', 'usado_em', 'pedido', 'aceita', 'modo', 'obs'];

var RS_PADRAO = {
  horas: 24, bloqueio_dias: 30, limite_minuto: 30, prefixo: 'NATAL', combina: true,
  premios: [
    { k: 'p5',     nome: '5% OFF',       tipo: 'percentage', valor: 5,  minimo: 0,   chance: 30 },
    { k: 'p10',    nome: '10% OFF',      tipo: 'percentage', valor: 10, minimo: 0,   chance: 25 },
    { k: 'frete',  nome: 'FRETE GRÁTIS', tipo: 'shipping',   valor: 0,  minimo: 100, chance: 20 },
    { k: 'brinde', nome: 'BRINDE',       tipo: 'brinde',     valor: 0,  minimo: 0,   chance: 10 },
    { k: 'p15',    nome: '15% OFF',      tipo: 'percentage', valor: 15, minimo: 0,   chance: 5 }
  ]
};
CONFIG_PADRAO.push(['roleta_site', JSON.stringify({ horas: 24, bloqueio_dias: 30 }), 'Roleta do site (JSON): horas = validade do cupom · bloqueio_dias = 1 giro por WhatsApp a cada X dias · premios (opcional): k, nome, tipo, valor, minimo, chance']);

function rsNum_(v, p) { var n = Number(String(v == null ? '' : v).replace(',', '.')); return (v == null || v === '' || isNaN(n)) ? p : n; }
function rsCfg_() {
  var c = cfgJson_('roleta_site', {}) || {}, o = {};
  o.horas = Math.min(168, Math.max(1, rsNum_(c.horas, RS_PADRAO.horas)));
  o.bloqueio_dias = Math.min(365, Math.max(0, Math.round(rsNum_(c.bloqueio_dias, RS_PADRAO.bloqueio_dias))));
  o.limite_minuto = Math.max(5, Math.round(rsNum_(c.limite_minuto, RS_PADRAO.limite_minuto)));
  o.prefixo = String(c.prefixo || RS_PADRAO.prefixo).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'LV';
  o.combina = c.combina !== false;   // 23/11: a Madu decidiu deixar somar (cupom que não soma é recusado se houver produto em promoção no carrinho)
  var base = {}; RS_PADRAO.premios.forEach(function (p) { base[p.k] = p; });
  var lista = Array.isArray(c.premios) && c.premios.length ? c.premios : RS_PADRAO.premios;
  o.premios = lista.filter(function (p) { return p && base[p.k]; }).map(function (p) {
    var b = base[p.k];
    return { k: b.k, nome: String(p.nome || b.nome).slice(0, 24), tipo: b.tipo, valor: Math.max(0, rsNum_(p.valor, b.valor)),
             minimo: Math.max(0, rsNum_(p.minimo, b.minimo)), chance: Math.max(0, rsNum_(p.chance, b.chance)) };
  });
  if (!o.premios.length) o.premios = RS_PADRAO.premios.slice();
  return o;
}

/* ───────── utilidades ───────── */
function rsNome_(s) { return String(s || '').replace(/[<>&"'`\\\/\{\}\[\]=;]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30); }
function rsTel_(s) {
  var d = String(s || '').replace(/\D/g, '');
  if (d.length >= 12 && d.indexOf('55') === 0) d = d.slice(2);
  if (d.charAt(0) === '0') d = d.slice(1);
  return (d.length === 10 || d.length === 11) ? d : '';
}
/* mesma pessoa com ou sem o 9 na frente: DDD + últimos 8 dígitos */
function rsChaveTel_(tel) { return tel ? tel.slice(0, 2) + tel.slice(-8) : ''; }
function rsDataBr_(ms) { return Utilities.formatDate(new Date(ms), 'America/Sao_Paulo', 'yyyy-MM-dd'); }
function rsQuando_(ms) { return Utilities.formatDate(new Date(ms), 'America/Rio_Branco', 'yyyy-MM-dd HH:mm:ss'); }
function rsTrava_(fn) {
  if (typeof comTrava_ === 'function') return comTrava_(fn);
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function rsCodigo_(cfg, usados) {
  var letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', cod = '';
  for (var t = 0; t < 60; t++) {
    cod = cfg.prefixo; for (var k = 0; k < 5; k++) cod += letras.charAt(Math.floor(Math.random() * letras.length));
    if (!usados[cod]) return cod;
  }
  return cfg.prefixo + String(new Date().getTime()).slice(-7);
}
function rsSortear_(cfg) {
  var total = cfg.premios.reduce(function (s, p) { return s + p.chance; }, 0), r = Math.random() * total;
  if (total <= 0) return cfg.premios[Math.floor(Math.random() * cfg.premios.length)];
  for (var i = 0; i < cfg.premios.length; i++) { r -= cfg.premios[i].chance; if (r < 0) return cfg.premios[i]; }
  return cfg.premios[0];
}

/* ───────── cupom na Nuvemshop ───────── */
function rsCupomCriar_(cfg, p, codigo, agoraMs, venceMs) {
  var corpo = { code: codigo, type: p.tipo, valid: true, max_uses: 1, start_date: rsDataBr_(agoraMs), end_date: rsDataBr_(venceMs),
                combines_with_other_discounts: !!cfg.combina };
  if (p.tipo === 'percentage') corpo.value = String(p.valor);
  if (p.minimo > 0) corpo.min_price = Number(p.minimo);
  var r = nsApi_('post', '/coupons', corpo);
  if (!r || !r.id) throw new Error('A Nuvemshop não devolveu o cupom');
  return String(r.id);
}
function rsCupomApagar_(id) { if (!id) return; try { nsApi_('delete', '/coupons/' + id); } catch (e) { log_('Sistema', 'roleta site cupom', 'não apagou ' + id + ': ' + String(e && e.message || e).slice(0, 120)); throw e; } }

/* ───────── resposta para o site ───────── */
function rsPublico_(g, cfg, extra) {
  var p = cfg.premios.filter(function (x) { return x.k === g.chave_premio; })[0] || {};
  var o = { ok: true, k: g.chave_premio, premio: g.premio, tipo: g.tipo, valor: Number(g.valor) || 0, minimo: Number(g.minimo) || 0,
            codigo: g.id, vence: Number(g.vence_ms) || 0, agora: new Date().getTime(), status: g.status, horas: cfg.horas };
  if (extra) for (var k in extra) o[k] = extra[k];
  return o;
}
function rsPremiosPublico_(cfg) { return cfg.premios.map(function (p) { return { k: p.k, nome: p.nome, tipo: p.tipo, valor: p.valor, minimo: p.minimo }; }); }

/* ───────── o giro ───────── */
function rsGirar_(req) {
  var modo = roletaCfg_().modo, teste = req.teste === true || req.teste === 1 || req.teste === '1';
  if (modo === 'desligada' || (modo === 'teste' && !teste)) throw new Error('A roleta não está disponível agora.');
  if (modo === 'ligada') teste = false;
  var nome = rsNome_(req.nome), tel = rsTel_(req.tel);
  if (nome.length < 2) throw new Error('Coloca seu nome pra gente te chamar certinho.');
  if (!tel) throw new Error('Confere o WhatsApp: DDD + número, ex. 68 99999-9999.');
  if (!(req.maior === true || req.maior === 1 || req.maior === '1')) throw new Error('A roleta é só para maiores de 18 anos.');
  if (typeof nsConectado_ !== 'function' || !nsConectado_()) { log_('Sistema', 'roleta site', 'Nuvemshop desconectada'); throw new Error('A roleta está em manutenção. Tente de novo mais tarde.'); }

  var cfg = rsCfg_(), cache = CacheService.getScriptCache(), chaveMin = 'rs_min_' + Math.floor(new Date().getTime() / 60000);
  var n = Number(cache.get(chaveMin) || 0);
  if (n >= cfg.limite_minuto) throw new Error('Muita gente girando agora 🎄 Tente de novo em 1 minuto.');
  cache.put(chaveMin, String(n + 1), 120);

  var chave = rsChaveTel_(tel);
  var res = rsTrava_(function () {
    var giros = ler_('GirosSite'), agoraMs = new Date().getTime(), usados = {}, ant = null;
    giros.forEach(function (g) { usados[g.id] = 1; if (g.chave_tel === chave && g.status !== 'cancelado') ant = g; });

    if (ant && !teste) {
      var feito = Number(ant.vence_ms) - cfg.horas * 3600000;
      if (ant.modo !== 'teste' && agoraMs - feito < cfg.bloqueio_dias * 86400000) return rsPublico_(ant, cfg, { ja: true });
    }
    if (ant && teste && ant.modo === 'teste' && ant.status === 'aberto') {
      try { rsCupomApagar_(ant.ns_cupom_id); } catch (e) {}
      ant.status = 'cancelado'; ant.obs = 'novo teste'; gravar_('GirosSite', ant);
    }

    var p = rsSortear_(cfg), cod = rsCodigo_(cfg, usados), venceMs = agoraMs + cfg.horas * 3600000, cupomId = '';
    if (p.tipo !== 'brinde') {
      try { cupomId = rsCupomCriar_(cfg, p, cod, agoraMs, venceMs); }
      catch (e) { log_('Sistema', 'roleta site erro', String(e && e.message || e).slice(0, 200)); throw new Error('Não consegui gerar seu cupom agora. Tente de novo em instantes.'); }
    }
    var row = { id: cod, criado_em: agora_(), data: hoje_(), hora: hora_(), nome: nome, tel: tel, chave_tel: chave, premio: p.nome, chave_premio: p.k, tipo: p.tipo,
                valor: String(p.valor), minimo: String(p.minimo), ns_cupom_id: cupomId, vence_em: rsQuando_(venceMs), vence_ms: String(venceMs), status: 'aberto',
                usado_em: '', pedido: '', aceita: req.aceita === true || req.aceita === 1 || req.aceita === '1' ? 'sim' : 'não', modo: teste ? 'teste' : 'site', obs: '' };
    gravar_('GirosSite', row);
    return rsPublico_(row, cfg, { ja: false });
  });
  try { rsGatilho_(); } catch (e) {}
  return res;
}

/* ───────── vencimento: apaga o cupom quando completam as horas ───────── */
function rsLimpar_() {
  var agoraMs = new Date().getTime(), n = 0;
  var pend = ler_('GirosSite').filter(function (g) { return g.status === 'aberto' && Number(g.vence_ms) > 0 && Number(g.vence_ms) <= agoraMs; });
  if (!pend.length) return 0;
  return rsTrava_(function () {
    pend.slice(0, 40).forEach(function (g) {
      try { if (g.ns_cupom_id && typeof nsConectado_ === 'function' && nsConectado_()) rsCupomApagar_(g.ns_cupom_id); g.status = 'vencido'; gravar_('GirosSite', g); n++; }
      catch (e) { /* tenta de novo na próxima rodada */ }
    });
    return n;
  });
}
/** Gatilho (a cada 15 min). Fica com este nome fixo. */
function roletaSiteLimpar() { try { rsLimpar_(); } catch (e) { log_('Sistema', 'roleta site limpar', String(e && e.message || e).slice(0, 160)); } }
function rsTemGatilho_() { try { return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'roletaSiteLimpar'; }); } catch (e) { return false; } }
function rsGatilho_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('RS_GATILHO') === '1') return true;
  if (!rsTemGatilho_()) ScriptApp.newTrigger('roletaSiteLimpar').timeBased().everyMinutes(15).create();
  props.setProperty('RS_GATILHO', '1');
  return true;
}

/* ───────── pedido do site usou o cupom → giro "usado" ───────── */
function rsPedidoUsou_(o) {
  if (!o) return;
  var cups = o.coupon || o.coupons || [], cods = {};
  if (!Array.isArray(cups)) cups = [cups];
  cups.forEach(function (c) { var cd = String((c && c.code) || c || '').toUpperCase().trim(); if (cd) cods[cd] = 1; });
  if (!Object.keys(cods).length) return;
  var cancelado = o.status === 'cancelled' || o.status === 'cancelado';
  ler_('GirosSite').forEach(function (g) {
    if (!cods[String(g.id).toUpperCase()]) return;
    if (!cancelado && g.status !== 'usado') { g.status = 'usado'; g.usado_em = agora_(); g.pedido = String(o.number || o.id || ''); gravar_('GirosSite', g); }
  });
}
if (typeof nsProcessarPedido_ === 'function') {
  var _rsNsPedido = nsProcessarPedido_;
  nsProcessarPedido_ = function (o, origem) {
    var r = _rsNsPedido(o, origem);
    try { rsPedidoUsou_(o); } catch (e) { log_('Sistema', 'roleta site pedido', String(e && e.message || e).slice(0, 160)); }
    return r;
  };
}

/* ───────── conferir um código (usado pelo robô da Kommo quando a cliente manda a mensagem da roleta) ─────────
   Devolve só o que a dona do código já sabe (primeiro nome, prêmio, até quando vale). Com whats:1 anota que ela chamou no WhatsApp. */
function rsConferir_(req) {
  var cod = String(req.codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  if (cod.length < 6) return { ok: true, achou: false };
  var cache = CacheService.getScriptCache(), chaveMin = 'rs_conf_' + Math.floor(new Date().getTime() / 60000), n = Number(cache.get(chaveMin) || 0);
  if (n >= 60) throw new Error('Muitas consultas. Tente de novo em 1 minuto.');
  cache.put(chaveMin, String(n + 1), 120);
  var g = ler_('GirosSite').filter(function (x) { return String(x.id).toUpperCase() === cod && x.status !== 'cancelado'; })[0];
  if (!g) return { ok: true, achou: false };
  if ((req.whats === 1 || req.whats === '1' || req.whats === true) && String(g.obs || '').indexOf('WhatsApp') < 0) {
    rsTrava_(function () { g.obs = (g.obs ? g.obs + ' · ' : '') + 'Chamou no WhatsApp'; gravar_('GirosSite', g); });
  }
  var agoraMs = new Date().getTime(), st = g.status === 'aberto' && Number(g.vence_ms) <= agoraMs ? 'vencido' : g.status;
  return { ok: true, achou: true, codigo: g.id, nome: String(g.nome || '').split(' ')[0], premio: g.premio, tipo: g.tipo, minimo: Number(g.minimo) || 0,
           vence: Number(g.vence_ms) || 0, agora: agoraMs, status: st, modo: g.modo };
}

/* ───────── entrada pública: a = 'roletaSite' ───────── */
var _rsRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'roletaSite') {
    try {
      if (req.op === 'girar') return rsGirar_(req);
      if (req.op === 'conferir') return rsConferir_(req);
      var cfg = rsCfg_();
      return { ok: true, modo: roletaCfg_().modo, horas: cfg.horas, premios: rsPremiosPublico_(cfg) };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _rsRodar(req);
};

/* ───────── administração: a = 'admRoletaSite' ───────── */
ADMIN.admRoletaSite = function (req) {
  var op = String(req.op || 'lista');
  if (op === 'limpar') { rsLimpar_(); }
  if (op === 'brinde') {
    var id = String(req.id || '').toUpperCase();
    rsTrava_(function () {
      var g = ler_('GirosSite').filter(function (x) { return x.id === id; })[0];
      if (!g) throw new Error('Giro não encontrado');
      if (g.tipo !== 'brinde') throw new Error('Esse prêmio não é brinde');
      g.status = 'usado'; g.usado_em = agora_(); g.obs = ('Brinde entregue' + (req.obs ? ': ' + String(req.obs) : '')).slice(0, 120); gravar_('GirosSite', g);
    });
    log_('Administração', 'roleta site brinde', id);
  }
  var cfg = rsCfg_(), agoraMs = new Date().getTime(), todos = ler_('GirosSite');
  var res = { total: 0, abertos: 0, usados: 0, vencidos: 0, testes: 0, aceitam: 0 };
  var lista = todos.filter(function (g) { return g.status !== 'cancelado'; }).map(function (g) {
    var st = g.status === 'aberto' && Number(g.vence_ms) <= agoraMs ? 'vencido' : g.status;
    if (g.modo === 'teste') res.testes++;
    else { res.total++; if (st === 'aberto') res.abertos++; if (st === 'usado') res.usados++; if (st === 'vencido') res.vencidos++; if (g.aceita === 'sim') res.aceitam++; }
    return { id: g.id, criado_em: g.criado_em, nome: g.nome, tel: g.tel, premio: g.premio, tipo: g.tipo, vence_em: g.vence_em, vence_ms: Number(g.vence_ms) || 0,
             status: st, usado_em: g.usado_em, pedido: g.pedido, aceita: g.aceita, modo: g.modo, obs: g.obs };
  });
  return { ok: true, agora: agoraMs, resumo: res, giros: lista.slice(-300).reverse(), cfg: { horas: cfg.horas, bloqueio_dias: cfg.bloqueio_dias, premios: cfg.premios },
           gatilho: rsTemGatilho_(), nuvemshop: typeof nsConectado_ === 'function' && nsConectado_() };
};
