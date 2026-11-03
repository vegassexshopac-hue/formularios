/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · CAMPANHA DO MÊS (Portal Equipe) — v31
   Raspadinha do Dia, Bingo de Vendas da semana, Hora de Ouro (resgate de clientes),
   Ranking da semana e Mural dos Sonhos.
   Arquivo SEPARADO — fica DEPOIS de todos (Código → PDV → ROLETA → ESTOQUE → NUVEMSHOP → OPERACAO → FIDELIDADE → CAMPANHA).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: CAMPANHA  (o último da lista)
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   As abas CampPremios, CampPrints, CampSonhos e CampContatos são criadas sozinhas.
   Config › campanha guarda as regras (valor do dia, prêmios, horário da Hora de Ouro…).
   ───────────────────────────────────────────────────────────────
   REGRAS:
   • Raspadinha: 1 por dia em que a vendedora vendeu o "valor do dia" (soma da aba Vendas, todas as lojas).
     Vale por X dias. O prêmio é sorteado AQUI no servidor (peso de cada prêmio) — a tela só revela.
   • Bingo: cartela 3×3 por semana (segunda a sábado). Quadrados automáticos saem das vendas do PDV;
     os de print a vendedora envia a foto e a administração aprova. 1ª linha completa e cartela cheia
     viram prêmio (uma vez por semana cada).
   • Hora de Ouro: no horário marcado, cada vendedora recebe uma lista de clientes "sumidas"
     (cartão fidelidade) para chamar no WhatsApp. Ninguém recebe a mesma cliente no mesmo dia, e quem
     foi chamada não volta à lista por 15 dias. A mensagem nunca fala de produto comprado.
   ═══════════════════════════════════════════════════════════════ */

ABAS.CampPremios = ['id', 'tipo', 'colaboradora_id', 'colaboradora', 'ref', 'premio', 'nada', 'status', 'criado_em', 'entregue_em', 'entregue_por'];
ABAS.CampPrints = ['id', 'semana', 'colaboradora_id', 'colaboradora', 'quadrado', 'url', 'status', 'enviado_em', 'decidido_em', 'decidido_por', 'obs'];
ABAS.CampSonhos = ['colaboradora_id', 'colaboradora', 'texto', 'url', 'atualizado_em'];
ABAS.CampContatos = ['id', 'data', 'hora', 'colaboradora_id', 'colaboradora', 'cliente_id', 'cliente'];

var CAMP_PADRAO = {
  ativa: true,
  inicio: '2026-11-01',
  valor_dia: 1320,
  meta: { meta: 33000, super: 37000, hiper: 40000 },
  fora: [],
  raspadinha: {
    validade_dias: 7,
    premios: [
      { id: 'r1', nome: 'Sair 1 hora mais cedo', emoji: '🕐', peso: 10, ativo: true },
      { id: 'r2', nome: 'Chocolate', emoji: '🍫', peso: 30, ativo: true },
      { id: 'r3', nome: 'R$ 20 no Pix', emoji: '💸', peso: 10, ativo: true },
      { id: 'r4', nome: 'Produto de autocuidado da loja', emoji: '🎁', peso: 15, ativo: true },
      { id: 'r5', nome: 'Tente amanhã', emoji: '😅', peso: 35, ativo: true, nada: true }
    ]
  },
  bingo: { premio_linha: '🍫 Chocolate + escolher o turno da semana seguinte', premio_cartela: '🎁 Produto de autocuidado da loja' },
  hora_ouro: {
    bosque: '15:00-16:00', centro: '14:00-15:00', qtd: 10, dias_sumida: 30, pausa_dias: 15, mostrar_whats: true,
    mensagem: 'Oi, {nome}! Tudo bem? Aqui é a {vendedora}, da Las Vegas 💋 Faz um tempinho que você não aparece por aqui… chegou muita novidade e separei umas que são a sua cara. Quer que eu te mostre?'
  }
};
CONFIG_PADRAO.push(['campanha', JSON.stringify(CAMP_PADRAO), 'Campanha do mês (JSON): valor_dia, meta individual, raspadinha (prêmios e pesos), bingo (prêmios), hora_ouro (horário por loja, quantidade), fora (quem não participa)']);

/* O bingo é fixo (3×3). Ordem = posição na cartela, linha por linha. */
var CAMP_BINGO = [
  { id: 'r300', em: '💰', t: 'Uma venda de R$ 300 ou mais', tipo: 'auto' },
  { id: 'casada', em: '👙', t: 'Lingerie + cosmético na mesma venda', tipo: 'auto' },
  { id: 'avaliacao', em: '⭐', t: 'Avaliação 5 estrelas no Google', tipo: 'print' },
  { id: 'pecas3', em: '🛍️', t: 'Uma venda com 3 peças ou mais', tipo: 'auto' },
  { id: 'meta_dia', em: '🎯', t: 'Bateu o valor do dia', tipo: 'auto' },
  { id: 'story', em: '📲', t: 'Story ou vídeo de um produto da sua seção', tipo: 'print' },
  { id: 'vibra', em: '⚡', t: 'Vendeu um vibrador', tipo: 'auto' },
  { id: 'fid', em: '💳', t: 'Venda com cliente no cartão fidelidade', tipo: 'auto' },
  { id: 'resgate', em: '🔁', t: 'Cliente sumida voltou a comprar', tipo: 'auto_print' }
];
var CAMP_LINHAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function campCfg_() {
  var c = cfgJson_('campanha', {}) || {};
  var o = JSON.parse(JSON.stringify(CAMP_PADRAO));
  for (var k in c) {
    if (c[k] && typeof c[k] === 'object' && !Array.isArray(c[k]) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) { for (var j in c[k]) o[k][j] = c[k][j]; }
    else o[k] = c[k];
  }
  o.valor_dia = Number(o.valor_dia) || CAMP_PADRAO.valor_dia;
  o.fora = Array.isArray(o.fora) ? o.fora : [];
  o.raspadinha.validade_dias = Math.max(1, Math.min(31, Number(o.raspadinha.validade_dias) || 7));
  o.hora_ouro.qtd = Math.max(1, Math.min(30, Number(o.hora_ouro.qtd) || 10));
  o.hora_ouro.dias_sumida = Math.max(7, Number(o.hora_ouro.dias_sumida) || 30);
  o.hora_ouro.pausa_dias = Math.max(1, Number(o.hora_ouro.pausa_dias) || 15);
  return o;
}

/* ───────── datas ───────── */
function campDia_(iso, n) { var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function campSemana_(iso) { var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'), w = d.getUTCDay(); return campDia_(iso, w === 0 ? -6 : 1 - w); }   // segunda-feira
function campDiasUteis_(mes) {
  var n = 0, d = new Date(mes + '-01T12:00:00Z');
  while (d.toISOString().slice(0, 7) === mes) { if (d.getUTCDay() !== 0) n++; d.setUTCDate(d.getUTCDate() + 1); }
  return n;
}
function campJson_(s, p) { try { var v = JSON.parse(s || ''); return v == null ? p : v; } catch (e) { return p; } }
function campNorm_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function campPrimeiro_(n) { return String(n || '').split(' ')[0]; }

/* ───────── quem joga ───────── */
function campParticipantes_(cfg) {
  return colabs_().filter(function (c) { return c.ativa === 'SIM' && cfg.fora.indexOf(c.id) < 0 && !/teste/i.test(c.nome); });
}

/* ───────── vendas por dia (aba Vendas: PDV + lançamentos) ───────── */
function campVendasDia_(vendas, eid) {
  var m = {};
  vendas.forEach(function (v) { if (v.colaboradora_id === eid) m[v.data] = r2_((m[v.data] || 0) + (Number(v.valor) || 0)); });
  return m;
}

/* ───────── raspadinha ───────── */
function campRaspDisponiveis_(eid, cfg, vendas, premios) {
  var hoje = hoje_(), desde = campDia_(hoje, -(cfg.raspadinha.validade_dias - 1));
  if (cfg.inicio > desde) desde = cfg.inicio;
  var porDia = campVendasDia_(vendas, eid), feitas = {};
  premios.forEach(function (p) { if (p.tipo === 'raspadinha' && p.colaboradora_id === eid) feitas[p.ref] = 1; });
  var out = [];
  for (var d in porDia) if (d >= desde && d <= hoje && porDia[d] >= cfg.valor_dia - 0.009 && !feitas[d]) out.push({ data: d, vendido: porDia[d] });
  out.sort(function (a, b) { return a.data.localeCompare(b.data); });
  return out;
}
function campRaspar_(c, data) {
  return comTrava_(function () {
    var cfg = campCfg_();
    if (!cfg.ativa) throw new Error('A campanha está pausada');
    if (cfg.fora.indexOf(c.id) >= 0) throw new Error('Você não está participando dos jogos deste mês');
    var premios = ler_('CampPremios');
    var disp = campRaspDisponiveis_(c.id, cfg, ler_('Vendas'), premios);
    var alvo = disp.filter(function (x) { return x.data === data; })[0] || (data ? null : disp[0]);
    if (!alvo) {
      var ja = premios.filter(function (p) { return p.tipo === 'raspadinha' && p.colaboradora_id === c.id && p.ref === data; })[0];
      if (ja) return { ok: true, repetida: true, premio: campPremioPub_(ja) };
      throw new Error('Essa raspadinha não está liberada');
    }
    var lista = (cfg.raspadinha.premios || []).filter(function (p) { return p.ativo !== false && Number(p.peso) > 0; });
    if (!lista.length) throw new Error('A administração ainda não cadastrou os prêmios da raspadinha');
    var tot = lista.reduce(function (s, p) { return s + Number(p.peso); }, 0), sorte = Math.random() * tot, esc = lista[lista.length - 1];
    for (var i = 0; i < lista.length; i++) { sorte -= Number(lista[i].peso); if (sorte < 0) { esc = lista[i]; break; } }
    var p = { id: 'R|' + c.id + '|' + alvo.data, tipo: 'raspadinha', colaboradora_id: c.id, colaboradora: c.nome, ref: alvo.data,
              premio: (esc.emoji ? esc.emoji + ' ' : '') + esc.nome, nada: esc.nada ? 'SIM' : 'NÃO', status: esc.nada ? '—' : 'entregar', criado_em: agora_(), entregue_em: '', entregue_por: '' };
    gravar_('CampPremios', p);
    log_(c.nome, 'raspadinha', alvo.data + ' · ' + p.premio);
    return { ok: true, premio: campPremioPub_(p), restam: disp.length - 1 };
  });
}
function campPremioPub_(p) { return { id: p.id, tipo: p.tipo, ref: p.ref, premio: p.premio, nada: p.nada === 'SIM', status: p.status, criado_em: String(p.criado_em || ''), entregue_em: String(p.entregue_em || ''), colaboradora_id: p.colaboradora_id, colaboradora: campPrimeiro_(p.colaboradora) }; }

/* ───────── bingo ───────── */
function campItens_(v) { return campJson_(v.itens, []); }
function campMarcasAuto_(eid, semana, cfg, pdv, vendasDia, ultimaCompra) {
  var fim = campDia_(semana, 5), m = {};
  pdv.forEach(function (v) {
    if (v.colaboradora_id !== eid || v.status === 'cancelada' || v.data < semana || v.data > fim) return;
    var tot = Number(v.total) || 0, its = campItens_(v), cats = its.map(function (i) { return campNorm_(i.cat + ' ' + i.nome); });
    if (tot >= 300 - 0.009) m.r300 = m.r300 || v.data;
    if ((Number(v.qtd_itens) || 0) >= 3) m.pecas3 = m.pecas3 || v.data;
    var lin = cats.some(function (s) { return /linger|fantasi|body|camisol|calcinh|sutia|espartilh|cinta.liga/.test(s); });
    var cos = cats.some(function (s) { return /cosmet|gel|lubrific|excit|oleo|massag|vela|perfum|hidrat|sabonet|retard|adstring/.test(s); });
    if (lin && cos) m.casada = m.casada || v.data;
    if (cats.some(function (s) { return /vibr|bullet|rabbit|varinha|sugador/.test(s); })) m.vibra = m.vibra || v.data;
    if (v.cliente_id) {
      m.fid = m.fid || v.data;
      var ant = ultimaCompra(v.cliente_id, v.criada_em);
      if (ant && campDia_(ant, cfg.hora_ouro.dias_sumida) <= v.data) m.resgate = m.resgate || v.data;
    }
  });
  for (var d in vendasDia) if (d >= semana && d <= fim && vendasDia[d] >= cfg.valor_dia - 0.009) { m.meta_dia = m.meta_dia || d; break; }
  return m;
}
function campUltimaCompraFn_(pdv) {
  var por = {};
  pdv.forEach(function (v) { if (v.cliente_id && v.status !== 'cancelada') (por[v.cliente_id] = por[v.cliente_id] || []).push(String(v.criada_em)); });
  for (var k in por) por[k].sort();
  return function (cid, antesDe) {
    var l = por[cid] || [], r = '';
    for (var i = 0; i < l.length; i++) { if (l[i] < antesDe) r = l[i]; else break; }
    return r ? r.slice(0, 10) : '';
  };
}
function campCartela_(c, semana, cfg, ctx) {
  var auto = campMarcasAuto_(c.id, semana, cfg, ctx.pdv, campVendasDia_(ctx.vendas, c.id), ctx.ult);
  var prints = ctx.prints.filter(function (p) { return p.colaboradora_id === c.id && p.semana === semana; });
  var q = CAMP_BINGO.map(function (b, i) {
    var meus = prints.filter(function (p) { return p.quadrado === b.id; });
    var ap = meus.filter(function (p) { return p.status === 'aprovado'; })[0];
    var pend = meus.filter(function (p) { return p.status === 'pendente'; })[0];
    var rec = meus.filter(function (p) { return p.status === 'recusado'; }).slice(-1)[0];
    var feito = !!(auto[b.id] || ap);
    return { i: i, id: b.id, em: b.em, t: b.t, tipo: b.tipo, feito: feito, quando: auto[b.id] || (ap ? String(ap.decidido_em).slice(0, 10) : ''),
             como: auto[b.id] ? 'auto' : ap ? 'print' : '', pendente: !feito && !!pend, recusado: !feito && !pend && rec ? (rec.obs || 'Print recusado') : '' };
  });
  var linhas = CAMP_LINHAS.filter(function (l) { return l.every(function (i) { return q[i].feito; }); });
  return { semana: semana, ate: campDia_(semana, 5), quadrados: q, linhas: linhas, feitos: q.filter(function (x) { return x.feito; }).length, cheia: q.every(function (x) { return x.feito; }) };
}
/* grava (uma vez) os prêmios do bingo que a cartela já conquistou */
function campBingoPremios_(c, cart, cfg, premios) {
  var novos = [];
  if (cart.ate < cfg.inicio) return novos;                         // semana antes do começo da campanha não dá prêmio
  [['bingo_linha', cart.linhas.length > 0, cfg.bingo.premio_linha], ['bingo_cartela', cart.cheia, cfg.bingo.premio_cartela]].forEach(function (x) {
    if (!x[1]) return;
    var id = (x[0] === 'bingo_linha' ? 'BL|' : 'BC|') + c.id + '|' + cart.semana;
    if (premios.some(function (p) { return p.id === id; })) return;
    var p = { id: id, tipo: x[0], colaboradora_id: c.id, colaboradora: c.nome, ref: cart.semana, premio: String(x[2] || ''), nada: 'NÃO', status: 'entregar', criado_em: agora_(), entregue_em: '', entregue_por: '' };
    gravar_('CampPremios', p); premios.push(p); novos.push(campPremioPub_(p));
    log_(c.nome, 'bingo', x[0] + ' · semana ' + cart.semana);
  });
  return novos;
}
function campCtx_() {
  var pdv = ler_('VendasPDV');
  return { pdv: pdv, vendas: ler_('Vendas'), prints: ler_('CampPrints'), premios: ler_('CampPremios'), ult: campUltimaCompraFn_(pdv) };
}
function campEnviarPrint_(c, req) {
  return comTrava_(function () {
    var b = CAMP_BINGO.filter(function (x) { return x.id === req.quadrado; })[0];
    if (!b || b.tipo === 'auto') throw new Error('Esse quadrado marca sozinho pelas vendas');
    var semana = campSemana_(hoje_());
    var ps = ler_('CampPrints').filter(function (p) { return p.colaboradora_id === c.id && p.semana === semana && p.quadrado === b.id && p.status !== 'recusado'; });
    if (ps.length) throw new Error(ps[0].status === 'aprovado' ? 'Esse quadrado já está marcado' : 'Esse print já está esperando a aprovação');
    var url = campSalvarFoto_(req.img, 'Prints do bingo', c.nome + ' - ' + b.id + ' - ' + hoje_());
    var p = { id: 'P' + new Date().getTime() + Math.floor(Math.random() * 1e3), semana: semana, colaboradora_id: c.id, colaboradora: c.nome, quadrado: b.id, url: url,
              status: 'pendente', enviado_em: agora_(), decidido_em: '', decidido_por: '', obs: String(req.obs || '').slice(0, 200) };
    gravar_('CampPrints', p);
    log_(c.nome, 'print bingo', b.id);
    return { ok: true };
  });
}
function campSalvarFoto_(img, pastaNome, nome) {
  var bytes = Utilities.base64Decode(String(img || '').replace(/^data:image\/\w+;base64,/, ''));
  if (bytes.length < 1000) throw new Error('A foto não chegou — tente de novo');
  if (bytes.length > 900 * 1024) throw new Error('Foto grande demais');
  var raiz = pastaAnexos_(), it = raiz.getFoldersByName('Campanha da equipe');
  var camp = it.hasNext() ? it.next() : raiz.createFolder('Campanha da equipe');
  var it2 = camp.getFoldersByName(pastaNome), pasta = it2.hasNext() ? it2.next() : camp.createFolder(pastaNome);
  var f = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', String(nome).slice(0, 90) + '.jpg'));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w800';
}

/* ───────── hora de ouro ───────── */
function campJanela_(cfg, loja) {
  var j = String(cfg.hora_ouro[loja] || cfg.hora_ouro.bosque || '').split('-');
  return { ini: (j[0] || '').trim(), fim: (j[1] || '').trim() };
}
function campLojaHoje_(c) { var p = null; try { p = pontoDe_(c.id, hoje_()); } catch (e) {} return (p && p.loja) || c.loja || 'bosque'; }
function campOuro_(c) {
  var cfg = campCfg_(), hoje = hoje_(), part = campParticipantes_(cfg), eu = -1;
  part.forEach(function (x, i) { if (x.id === c.id) eu = i; });
  var contatos = ler_('CampContatos');
  var meusHoje = contatos.filter(function (x) { return x.colaboradora_id === c.id && x.data === hoje; });
  var base = { ok: true, janela: campJanela_(cfg, campLojaHoje_(c)), qtd: cfg.hora_ouro.qtd, chamadas_hoje: meusHoje.length, mostrar_whats: cfg.hora_ouro.mostrar_whats !== false, clientes: [] };
  if (eu < 0) return base;
  var limite = campDia_(hoje, -cfg.hora_ouro.pausa_dias), recente = {}, hojeDeQuem = {};
  contatos.forEach(function (x) { if (x.data > limite) recente[x.cliente_id] = x; if (x.data === hoje) hojeDeQuem[x.cliente_id] = x.colaboradora_id; });
  var pdv = ler_('VendasPDV'), ult = {};
  pdv.forEach(function (v) { if (v.cliente_id && v.status !== 'cancelada' && String(v.data) > (ult[v.cliente_id] || '')) ult[v.cliente_id] = String(v.data); });
  var corte = campDia_(hoje, -cfg.hora_ouro.dias_sumida), mesHoje = hoje.slice(5, 7);
  var cand = ler_('Clientes').filter(function (k) {
    if (k.ativo === 'NÃO' || !/^\d{10,11}$/.test(String(k.tel || '').replace(/\D/g, ''))) return false;
    if (ult[k.id]) return ult[k.id] <= corte;
    if (k.origem === 'importado') return true;                         // veio do sistema antigo: não sabemos a última compra
    var cad = String(k.criado_em || '').slice(0, 10);
    return !!cad && cad <= corte;                                     // cadastrou e nunca comprou pelo PDV
  });
  cand.sort(function (a, b) {
    var na = String(a.nascimento || '').slice(5, 7) === mesHoje ? 0 : 1, nb = String(b.nascimento || '').slice(5, 7) === mesHoje ? 0 : 1;
    return na - nb || (ult[b.id] || '').localeCompare(ult[a.id] || '') || String(a.id).localeCompare(String(b.id));
  });
  var minhas = [], n = 0;
  cand.forEach(function (k) {
    if (minhas.length >= cfg.hora_ouro.qtd) return;
    if (hojeDeQuem[k.id] === c.id) { minhas.push(k); return; }      // as que ela já chamou hoje continuam na lista
    if (recente[k.id]) return;
    if (n++ % part.length === eu) minhas.push(k);
  });
  var vend = campPrimeiro_(c.nome);
  base.clientes = minhas.map(function (k) {
    var tel = String(k.tel).replace(/\D/g, ''), primeiro = campPrimeiro_(k.nome);
    var msg = String(cfg.hora_ouro.mensagem || '').replace(/\{nome\}/g, primeiro).replace(/\{vendedora\}/g, vend);
    return { id: k.id, nome: k.nome, tel_mask: tel.length >= 4 ? '•••• ' + tel.slice(-4) : '', ultima: ult[k.id] || '', aniversario: String(k.nascimento || '').slice(5, 7) === mesHoje,
             chamada: hojeDeQuem[k.id] === c.id, link: base.mostrar_whats ? 'https://wa.me/55' + tel + '?text=' + encodeURIComponent(msg) : '' };
  });
  return base;
}
function campChamei_(c, req) {
  return comTrava_(function () {
    var k = ler_('Clientes').filter(function (x) { return x.id === req.cliente_id; })[0];
    if (!k) throw new Error('Cliente não encontrada');
    var hoje = hoje_();
    if (ler_('CampContatos').some(function (x) { return x.cliente_id === k.id && x.colaboradora_id === c.id && x.data === hoje; })) return { ok: true, ja: true };
    gravar_('CampContatos', { id: 'K' + new Date().getTime() + Math.floor(Math.random() * 1e3), data: hoje, hora: hora_(), colaboradora_id: c.id, colaboradora: c.nome, cliente_id: k.id, cliente: k.nome });
    return { ok: true };
  });
}

/* ───────── ranking ───────── */
function campRanking_(cfg, ctx) {
  var hoje = hoje_(), sem = campSemana_(hoje), semAnt = campDia_(sem, -7), mes = mesDe_(hoje);
  var part = campParticipantes_(cfg);
  var pessoas = part.map(function (c) {
    var dia = campVendasDia_(ctx.vendas, c.id), s = 0, sa = 0, m = 0, h = dia[hoje] || 0, diasBatidos = 0;
    for (var d in dia) {
      if (d >= sem && d <= campDia_(sem, 6)) s += dia[d];
      if (d >= semAnt && d < sem) sa += dia[d];
      if (d.slice(0, 7) === mes) { m += dia[d]; if (dia[d] >= cfg.valor_dia - 0.009) diasBatidos++; }
    }
    var cart = campCartela_(c, sem, cfg, ctx);
    var rasp = ctx.premios.filter(function (p) { return p.tipo === 'raspadinha' && p.colaboradora_id === c.id && String(p.ref).slice(0, 7) === mes; }).length;
    var nivel = m >= cfg.meta.hiper ? 'hiper' : m >= cfg.meta.super ? 'super' : m >= cfg.meta.meta ? 'meta' : '';
    return { id: c.id, nome: campPrimeiro_(c.nome), cor: c.cor || '', semana: r2_(s), semana_ant: r2_(sa), mes: r2_(m), hoje: r2_(h), dias_batidos: diasBatidos, bingo: cart.feitos, linhas: cart.linhas.length, raspadinhas: rasp, nivel: nivel };
  });
  pessoas.sort(function (a, b) { return b.semana - a.semana || b.mes - a.mes; });
  var dUteis = campDiasUteis_(mes), passados = 0, d0 = mes + '-01';
  for (var d = d0; d <= hoje && d.slice(0, 7) === mes; d = campDia_(d, 1)) if (new Date(d + 'T12:00:00Z').getUTCDay() !== 0) passados++;
  return { semana: sem, ate: campDia_(sem, 5), mes: mes, dias_uteis: dUteis, dias_passados: passados, meta: cfg.meta, valor_dia: cfg.valor_dia, pessoas: pessoas,
           equipe: { semana: r2_(pessoas.reduce(function (s, p) { return s + p.semana; }, 0)), mes: r2_(pessoas.reduce(function (s, p) { return s + p.mes; }, 0)) } };
}

/* ───────── mural dos sonhos ───────── */
function campSonhos_() {
  var ativos = {}; colabs_().forEach(function (c) { if (c.ativa === 'SIM') ativos[c.id] = c; });
  return ler_('CampSonhos').filter(function (s) { return ativos[s.colaboradora_id] && (s.texto || s.url); }).map(function (s) {
    return { id: s.colaboradora_id, nome: campPrimeiro_(ativos[s.colaboradora_id].nome), cor: ativos[s.colaboradora_id].cor || '', texto: s.texto, url: s.url, em: String(s.atualizado_em || '').slice(0, 10) };
  });
}
function campSonhoSalvar_(c, req) {
  return comTrava_(function () {
    var s = ler_('CampSonhos').filter(function (x) { return x.colaboradora_id === c.id; })[0] || { colaboradora_id: c.id };
    s.colaboradora = c.nome; s.texto = String(req.texto || '').trim().slice(0, 140);
    if (req.img) s.url = campSalvarFoto_(req.img, 'Mural dos sonhos', c.nome + ' - sonho - ' + hoje_());
    if (req.tirarFoto) s.url = '';
    if (!s.texto && !s.url) throw new Error('Escreva o seu sonho ou escolha uma foto');
    s.atualizado_em = agora_();
    gravar_('CampSonhos', s);
    log_(c.nome, 'mural dos sonhos', s.texto);
    return { ok: true, sonhos: campSonhos_() };
  });
}

/* ───────── pacote da vendedora (vai junto em toda resposta do portal) ───────── */
function campResumo_(c) {
  var cfg = campCfg_();
  var o = { ativa: !!cfg.ativa, participa: cfg.fora.indexOf(c.id) < 0, valor_dia: cfg.valor_dia, meta: cfg.meta, bingo_premios: cfg.bingo, janela: campJanela_(cfg, campLojaHoje_(c)), qtd_ouro: cfg.hora_ouro.qtd };
  if (!cfg.ativa) return o;
  var ctx = campCtx_(), hoje = hoje_(), dia = campVendasDia_(ctx.vendas, c.id), mes = mesDe_(hoje), m = 0;
  for (var d in dia) if (d.slice(0, 7) === mes) m += dia[d];
  o.hoje = r2_(dia[hoje] || 0); o.mes = r2_(m);
  o.dias_uteis = campDiasUteis_(mes);
  o.raspadinhas = o.participa ? campRaspDisponiveis_(c.id, cfg, ctx.vendas, ctx.premios) : [];
  o.premios = ctx.premios.filter(function (p) { return p.colaboradora_id === c.id; }).slice(-30).reverse().map(campPremioPub_);
  if (o.participa) {
    var cart = campCartela_(c, campSemana_(hoje), cfg, ctx);
    var novos = campBingoPremios_(c, cart, cfg, ctx.premios);
    if (novos.length) o.premios = novos.concat(o.premios);
    o.bingo = cart; o.bingo_novos = novos;
  }
  o.chamadas_hoje = ler_('CampContatos').filter(function (x) { return x.colaboradora_id === c.id && x.data === hoje; }).length;
  return o;
}
var _campDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _campDadosColab(c);
  try { d.campanha = campResumo_(c); } catch (e) { d.campanha = { erro: String(e && e.message || e) }; }
  return d;
};

/* ───────── ações da equipe: a = 'campanha' ───────── */
var _campRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'campanha') {
    try {
      var c = checarColab_(req), op = req.op;
      if (op === 'raspar') { var r = campRaspar_(c, String(req.data || '')); r.campanha = campResumo_(c); return r; }
      if (op === 'print') { campEnviarPrint_(c, req); return { ok: true, campanha: campResumo_(c) }; }
      if (op === 'ouro') return campOuro_(c);
      if (op === 'chamei') { var k = campChamei_(c, req); var o = campOuro_(c); o.ja = !!k.ja; return o; }
      if (op === 'ranking') { var cfg = campCfg_(); return { ok: true, ranking: campRanking_(cfg, campCtx_()), sonhos: campSonhos_() }; }
      if (op === 'sonho') return campSonhoSalvar_(c, req);
      return { ok: false, erro: 'Operação desconhecida' };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _campRodar(req);
};

/* ───────── administração: a = 'admCampanha' ───────── */
ADMIN.admCampanha = function (req) {
  var op = req.op || 'painel';
  if (op === 'painel') {
    var cfg = campCfg_(), ctx = campCtx_(), hoje = hoje_(), sem = campSemana_(hoje);
    var part = campParticipantes_(cfg), cartelas = {};
    comTrava_(function () { part.forEach(function (c) { var k = campCartela_(c, sem, cfg, ctx); campBingoPremios_(c, k, cfg, ctx.premios); cartelas[c.id] = k; }); });
    var contatos = ler_('CampContatos'), mes = mesDe_(hoje);
    return { ok: true, cfg: cfg, bingo: CAMP_BINGO, ranking: campRanking_(cfg, ctx), cartelas: cartelas,
             premios: ctx.premios.slice(-300).reverse().map(campPremioPub_),
             prints: ctx.prints.filter(function (p) { return p.status === 'pendente' || p.enviado_em >= campDia_(hoje, -21); }).reverse().map(function (p) {
               var b = CAMP_BINGO.filter(function (x) { return x.id === p.quadrado; })[0] || {};
               return { id: p.id, semana: p.semana, colaboradora: campPrimeiro_(p.colaboradora), colaboradora_id: p.colaboradora_id, quadrado: p.quadrado, texto: (b.em || '') + ' ' + (b.t || p.quadrado), url: p.url, status: p.status, enviado_em: String(p.enviado_em), obs: p.obs };
             }),
             sonhos: campSonhos_(),
             contatos: { hoje: contatos.filter(function (x) { return x.data === hoje; }).length, mes: contatos.filter(function (x) { return mesDe_(x.data) === mes; }).length,
                         porPessoa: part.map(function (c) { return { id: c.id, nome: campPrimeiro_(c.nome), hoje: contatos.filter(function (x) { return x.colaboradora_id === c.id && x.data === hoje; }).length, mes: contatos.filter(function (x) { return x.colaboradora_id === c.id && mesDe_(x.data) === mes; }).length }; }) },
             colaboradoras: colabs_().filter(function (c) { return c.ativa === 'SIM'; }).map(function (c) { return { id: c.id, nome: c.nome }; }) };
  }
  if (op === 'entregar') return comTrava_(function () {
    var p = ler_('CampPremios').filter(function (x) { return x.id === req.id; })[0];
    if (!p) throw new Error('Prêmio não encontrado');
    p.status = req.desfazer ? 'entregar' : 'entregue'; p.entregue_em = req.desfazer ? '' : agora_(); p.entregue_por = req.desfazer ? '' : 'Administração';
    gravar_('CampPremios', p);
    log_('Administração', 'prêmio campanha', p.id + ' · ' + p.status);
    return { ok: true };
  });
  if (op === 'print') return comTrava_(function () {
    var p = ler_('CampPrints').filter(function (x) { return x.id === req.id; })[0];
    if (!p) throw new Error('Print não encontrado');
    p.status = req.aprovar ? 'aprovado' : 'recusado'; p.decidido_em = agora_(); p.decidido_por = 'Administração';
    if (!req.aprovar) p.obs = String(req.motivo || 'Print recusado').slice(0, 200);
    gravar_('CampPrints', p);
    log_('Administração', 'print bingo', p.colaboradora + ' · ' + p.quadrado + ' · ' + p.status);
    return { ok: true };
  });
  if (op === 'cfg') {
    var v = req.valor || {}, atual = cfgJson_('campanha', {}) || {};
    if (v.valor_dia != null) { var n = 0; try { n = valor_(v.valor_dia); } catch (e) {} if (!(n > 0)) throw new Error('Valor do dia inválido'); atual.valor_dia = n; }
    if (v.meta) { var mt = {}; ['meta', 'super', 'hiper'].forEach(function (k) { var x = 0; try { x = valor_(v.meta[k]); } catch (e) {} if (!(x > 0)) throw new Error('Meta inválida'); mt[k] = x; }); atual.meta = mt; }
    if (v.ativa != null) atual.ativa = !!v.ativa;
    if (v.inicio) atual.inicio = String(v.inicio).slice(0, 10);
    if (Array.isArray(v.fora)) atual.fora = v.fora.map(String);
    if (v.raspadinha) {
      var ps = (v.raspadinha.premios || []).filter(function (p) { return String(p.nome || '').trim(); }).slice(0, 12).map(function (p, i) {
        return { id: p.id || 'r' + new Date().getTime() + i, nome: String(p.nome).trim().slice(0, 60), emoji: String(p.emoji || '').slice(0, 4), peso: Math.max(0, Math.round(Number(p.peso) || 0)), ativo: p.ativo !== false, nada: !!p.nada };
      });
      if (!ps.some(function (p) { return p.ativo && p.peso > 0; })) throw new Error('Deixe pelo menos um prêmio ativo com chance maior que zero');
      atual.raspadinha = { validade_dias: Math.max(1, Math.min(31, Number(v.raspadinha.validade_dias) || 7)), premios: ps };
    }
    if (v.bingo) atual.bingo = { premio_linha: String(v.bingo.premio_linha || '').slice(0, 120), premio_cartela: String(v.bingo.premio_cartela || '').slice(0, 120) };
    if (v.hora_ouro) {
      var ho = v.hora_ouro, ok = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      ['bosque', 'centro'].forEach(function (l) { if (ho[l] && !ok.test(String(ho[l]).replace(/\s/g, ''))) throw new Error('Horário da Hora de Ouro inválido (' + l + ') — use 15:00-16:00'); });
      atual.hora_ouro = { bosque: String(ho.bosque || '').replace(/\s/g, ''), centro: String(ho.centro || '').replace(/\s/g, ''), qtd: Math.max(1, Math.min(30, Number(ho.qtd) || 10)),
                          dias_sumida: Math.max(7, Number(ho.dias_sumida) || 30), pausa_dias: Math.max(1, Number(ho.pausa_dias) || 15), mostrar_whats: ho.mostrar_whats !== false, mensagem: String(ho.mensagem || '').slice(0, 500) };
    }
    setCfg_('campanha', JSON.stringify(atual));
    log_('Administração', 'config campanha', JSON.stringify(atual).slice(0, 400));
    return { ok: true, cfg: campCfg_() };
  }
  throw new Error('Operação desconhecida');
};
