/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · CAIXA DA LOJA (Portal Equipe) — v48
   Uma gaveta por loja: o caixa é da LOJA, a venda é da VENDEDORA.
   • Abertura do caixa com contagem às cegas (compara com o fundo de troco da loja)
   • Passagem de turno: quem sai e quem fica conferem a gaveta com os dois PINs
   • Suprimento (entrada de troco) com PIN e motivo
   • Venda em dinheiro bloqueada com o caixa fechado
   • "Quem vendeu?": a venda feita no tablet/computador da loja vai para a vendedora escolhida
     (só quem bateu o ponto hoje naquela loja); fica gravado quem lançou
   • Misto dividido por forma + crédito à vista × parcelado no fechamento
   • Alertas para a administração ("Precisa de mim")
   Arquivo SEPARADO — fica no FIM da lista (depois do VENDAS e do AJUDA). Código ES5 (runtime antigo).
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: CAIXA
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   A aba CaixaMov e as colunas novas da VendasPDV são criadas sozinhas.
   ═══════════════════════════════════════════════════════════════ */

ABAS.CaixaMov = ['id', 'data', 'loja', 'tipo', 'criado_em', 'por_id', 'por', 'por2_id', 'por2', 'contado', 'esperado', 'diferenca',
                 'valor', 'obs', 'status', 'terminal'];
ABAS.VendasPDV = ABAS.VendasPDV.concat(['pagamentos', 'lancada_por_id', 'lancada_por']);

var CX48_PADRAO = { so_terminal: true, bloquear_dinheiro: true, limite_sangria: 500 };
CONFIG_PADRAO.push(['caixa48', JSON.stringify(CX48_PADRAO), 'Caixa da loja (JSON): so_terminal = abrir/passagem/suprimento/fechar só no computador da loja; bloquear_dinheiro = venda em dinheiro só com caixa aberto; limite_sangria em R$']);

function cx48Cfg_() {
  var c = cfgJson_('caixa48', {}) || {}, o = {};
  o.so_terminal = c.so_terminal == null ? CX48_PADRAO.so_terminal : !!c.so_terminal;
  o.bloquear_dinheiro = c.bloquear_dinheiro == null ? CX48_PADRAO.bloquear_dinheiro : !!c.bloquear_dinheiro;
  o.limite_sangria = c.limite_sangria == null || isNaN(Number(c.limite_sangria)) ? CX48_PADRAO.limite_sangria : Math.max(0, Number(c.limite_sangria));
  return o;
}
/* Número que veio da planilha ("189.9", gravado pelo próprio sistema) ou digitado ("189,90", "1.500,00", "1.500").
   O opxNum_ antigo tirava todo ponto e lia "189.9" como 1899 (sangria com centavos saía errada no fechamento). */
opxNum_ = function (v) {
  if (typeof v === 'number') return isNaN(v) ? 0 : opxR2_(v);
  var t = String(v == null ? '' : v).replace(/[^\d,.-]/g, '');
  if (!t) return 0;
  if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');          // 1.500,50 → 1500.50
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');         // 1.500 → 1500
  var n = Number(t);
  return isNaN(n) ? 0 : opxR2_(n);
};
function cx48Num_(v) { return opxNum_(v); }
function cx48Json_(s, p) { return opxJson_(s, p); }

/* ───────── leitura do dia ───────── */
function cx48Movs_(data, loja) {
  return ler_('CaixaMov').filter(function (m) { return m.data === data && (!loja || m.loja === loja); });
}
function cx48Abertura_(data, loja) {
  return cx48Movs_(data, loja).filter(function (m) { return m.tipo === 'abertura'; })[0] || null;
}
function cx48Fechado_(data, loja) {
  return ler_('Caixa').some(function (r) { return r.data === data && r.loja === loja && r.status !== 'reaberto'; });
}
function cx48Suprimentos_(data, loja) {
  return cx48Movs_(data, loja).filter(function (m) { return m.tipo === 'suprimento'; })
    .reduce(function (s, m) { return opxR2_(s + cx48Num_(m.valor)); }, 0);
}
/* como a venda foi paga, por forma (misto dividido; crédito à vista × parcelado) */
function cx48Partes_(v) {
  var tot = opxR2_(v.total), f = v.pagamento, parc = Number(v.parcelas) || 1, o = {};
  if (f === 'credito') { o[parc > 1 ? 'credito_parc' : 'credito_vista'] = tot; return o; }
  if (f === 'pix' || f === 'dinheiro' || f === 'debito') { o[f] = tot; return o; }
  var p = cx48Json_(v.pagamentos, null);
  if (p && typeof p === 'object') {
    var soma = 0, ks = ['pix', 'dinheiro', 'debito', 'credito'];
    ks.forEach(function (k) { var n = opxR2_(p[k]); if (n > 0) { soma = opxR2_(soma + n); if (k === 'credito') o[(Number(p.parcelas) || 1) > 1 ? 'credito_parc' : 'credito_vista'] = n; else o[k] = n; } });
    if (Math.abs(soma - tot) < 0.011) return o;
  }
  return { misto: tot };
}
/* substitui o que o OPERACAO calcula: misto entra por forma e o crédito é separado */
opxVendasDia_ = function (data, loja) {
  var t = { pix: 0, dinheiro: 0, debito: 0, credito: 0, credito_vista: 0, credito_parc: 0, misto: 0, total: 0, qtd: 0, mistos: [] };
  ler_('VendasPDV').forEach(function (v) {
    if (v.data !== data || v.loja !== loja || v.status === 'cancelada') return;
    var tot = opxR2_(v.total), p = cx48Partes_(v);
    for (var k in p) {
      t[k] = opxR2_(t[k] + p[k]);
      if (k === 'credito_vista' || k === 'credito_parc') t.credito = opxR2_(t.credito + p[k]);
    }
    if (p.misto) t.mistos.push({ numero: v.numero, total: tot, obs: v.obs || '' });
    t.total = opxR2_(t.total + tot); t.qtd++;
  });
  return t;
};
OPX_FORMAS = ['pix', 'dinheiro', 'debito', 'credito_vista', 'credito_parc'];
opxEsperado_ = function (data, loja) {
  var cfg = opxCfg_(), v = opxVendasDia_(data, loja), s = opxSangriasDia_(data, loja);
  var ab = cx48Abertura_(data, loja), sup = cx48Suprimentos_(data, loja);
  var fundo = ab ? cx48Num_(ab.contado) : (Number(cfg.fundo[loja]) || 0);
  return { data: data, loja: loja, fundo: fundo, suprimentos: sup, abertura: ab ? limpar_(ab) : null, vendas: v, sangrias: s,
           esperado: { pix: v.pix, dinheiro: opxR2_(fundo + sup + v.dinheiro - s.total), debito: v.debito,
                       credito_vista: v.credito_vista, credito_parc: v.credito_parc } };
};
/* dinheiro que deveria estar na gaveta agora (nunca vai para a equipe) */
function cx48GavetaAgora_(data, loja) { return opxEsperado_(data, loja).esperado.dinheiro; }

/* fechamento: com abertura, o fundo é o contado na abertura (a vendedora não digita mais o fundo);
   sem abertura, o fundo digitado soma os suprimentos do dia. Fechar fecha o caixa do dia. */
var _cx48Fechar = opxFechar_;
opxFechar_ = function (req, por, eid, admin) {
  var data = admin && /^\d{4}-\d{2}-\d{2}$/.test(req.data || '') ? req.data : hoje_();
  if (req.loja && cx48Abertura_(data, req.loja)) req.fundo = null;
  else if (req.fundo !== '' && req.fundo != null && req.loja) req.fundo = String(opxR2_(cx48Num_(req.fundo) + cx48Suprimentos_(data, req.loja)));
  var f = _cx48Fechar(req, por, eid, admin);
  if (f && !admin) f.formas = OPX_FORMAS;
  return f;
};

/* ───────── quem está no ponto agora (para o "Quem vendeu?") ───────── */
function cx48NoPonto_(data) {
  var ativas = {}; colabs_().forEach(function (c) { if (c.ativa === 'SIM') ativas[c.id] = c; });
  var lista = [];
  ler_('Pontos').forEach(function (r) {
    if (r.data !== data || !ativas[r.colaboradora_id] || !r.entrada || r.saida || (r.tipo && r.tipo !== 'normal')) return;
    lista.push({ id: r.colaboradora_id, nome: ativas[r.colaboradora_id].nome, loja: r.loja, entrada: r.entrada,
                 st: (r.saida_almoco && !r.volta_almoco) ? 'almoco' : (r.inicio_pausa && !r.fim_pausa) ? 'pausa' : 'ativa' });
  });
  return lista;
}

/* ───────── pacote da equipe (sem valores esperados: contagem às cegas) ───────── */
function cx48Pacote_(admin) {
  var hoje = hoje_(), lojas = JSON.parse(cfg_('lojas')), cfg = cx48Cfg_(), pc = {};
  var movs = ler_('CaixaMov').filter(function (m) { return m.data === hoje; });
  var fech = {}; ler_('Caixa').forEach(function (r) { if (r.data === hoje && r.status !== 'reaberto') fech[r.loja] = r; });
  Object.keys(lojas).forEach(function (k) {
    var ab = movs.filter(function (m) { return m.loja === k && m.tipo === 'abertura'; })[0];
    var o = { aberto: !!ab && !fech[k], fechado: !!fech[k], abertura: null, passagens: [], suprimentos: 0, pedirSangria: false };
    if (ab) o.abertura = { por: ab.por, hora: String(ab.criado_em).slice(11, 16), status: ab.status, contado: admin ? cx48Num_(ab.contado) : undefined };
    if (fech[k]) o.fechamento = { por: fech[k].por, hora: String(fech[k].criado_em).slice(11, 16), status: fech[k].status };
    movs.forEach(function (m) {
      if (m.loja !== k) return;
      if (m.tipo === 'passagem') o.passagens.push({ por: m.por, por2: m.por2, hora: String(m.criado_em).slice(11, 16), status: m.status });
      if (m.tipo === 'suprimento') o.suprimentos++;
    });
    if (o.aberto && cfg.limite_sangria > 0) { try { o.pedirSangria = cx48GavetaAgora_(hoje, k) > cfg.limite_sangria + 0.001; } catch (e) {} }
    pc[k] = o;
  });
  return { cfg: cfg, lojas: pc, noPonto: cx48NoPonto_(hoje), hoje: hoje };
}

/* ───────── alertas para a administração ───────── */
function cx48Alertas_() {
  var hoje = hoje_(), ontem = diaMais_(-1), lojas = JSON.parse(cfg_('lojas')), cfg = cx48Cfg_(), A = [];
  var nomeLoja = function (k) { return (lojas[k] || {}).nome || k; };
  ler_('CaixaMov').forEach(function (m) {
    if (m.data < ontem || m.status !== 'diferenca') return;
    var dif = cx48Json_(m.diferenca, 0);
    A.push({ tipo: m.tipo === 'abertura' ? 'abertura' : 'passagem', data: m.data, loja: m.loja, quem: m.por + (m.por2 ? ' → ' + m.por2 : ''),
             hora: String(m.criado_em).slice(11, 16), valor: Number(dif) || 0, obs: m.obs || '' });
  });
  ler_('VendasPDV').forEach(function (v) {
    if (v.status !== 'cancelada' || String(v.cancelada_em).slice(0, 10) < ontem) return;
    var p = cx48Partes_(v);
    if (!(p.dinheiro > 0)) return;
    A.push({ tipo: 'cancelDinheiro', data: v.data, loja: v.loja, quem: v.cancelada_por || v.colaboradora, hora: String(v.cancelada_em).slice(11, 16),
             valor: p.dinheiro, numero: v.numero, obs: v.motivo_cancel || '' });
  });
  var agoraMin = min_(hora_());
  Object.keys(lojas).forEach(function (k) {
    var ab = cx48Abertura_(hoje, k), fechado = cx48Fechado_(hoje, k);
    if (ab && !fechado) {
      var fecha = min_(lojas[k].fecha || '20:00');
      if (fecha != null && agoraMin > fecha + 30) A.push({ tipo: 'naoFechou', data: hoje, loja: k, quem: ab.por, hora: lojas[k].fecha });
      if (cfg.limite_sangria > 0) { try { var g = cx48GavetaAgora_(hoje, k); if (g > cfg.limite_sangria + 0.001) A.push({ tipo: 'gaveta', data: hoje, loja: k, valor: g }); } catch (e) {} }
    }
    if (!ab && !fechado) {
      var abre = min_(lojas[k].abre || '08:00');
      var temVenda = ler_('VendasPDV').some(function (v) { return v.data === hoje && v.loja === k && v.status !== 'cancelada'; });
      if (abre != null && agoraMin > abre + 60 && temVenda) A.push({ tipo: 'semAbertura', data: hoje, loja: k });
    }
  });
  A.forEach(function (a) { a.lojaNome = nomeLoja(a.loja); });
  return A;
}
function cx48AdmPacote_() {
  var desde = diaMais_(-62);
  var wc = cx48WhatsCfg_(), c48 = cfgJson_('caixa48', {}) || {};
  var whats = { numeros: String(c48.whats || ''), ligado: c48.whats_ligado !== false, chave: wc.chave, gatilho: !!cx48Gatilho_() };
  return { whats: whats, cfg: cx48Cfg_(), movs: ler_('CaixaMov').filter(function (m) { return m.data >= desde; }).map(function (m) {
             var o = limpar_(m); o.contado = cx48Num_(m.contado); o.esperado = m.esperado === '' ? null : cx48Num_(m.esperado);
             o.diferenca = m.diferenca === '' ? null : cx48Num_(m.diferenca); o.valor = cx48Num_(m.valor); return o; }).reverse(),
           alertas: cx48Alertas_(), hoje: cx48Pacote_(true) };
}

var _cx48DadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _cx48DadosColab(c);
  try { d.caixa48 = cx48Pacote_(false); } catch (e) { d.caixa48 = { erro: String(e && e.message || e) }; }
  return d;
};
var _cx48AdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _cx48AdmDados(req);
  try { d.caixa48 = cx48AdmPacote_(); } catch (e) { d.caixa48 = { erro: String(e && e.message || e) }; }
  return d;
};

/* ───────── operações do caixa (PIN de quem faz) ───────── */
function cx48Terminal_(req, loja) {
  var ap = aparelhoDe_(req.token);
  if (cx48Cfg_().so_terminal) {
    if (!ap) throw new Error('Isso é feito no computador da loja (o caixa fica lá).');
    if (loja && ap.loja && ap.loja !== loja) throw new Error('Este computador é da loja ' + (JSON.parse(cfg_('lojas'))[ap.loja] || {}).nome + '.');
  }
  return ap;
}
function cx48Loja_(req, ap) {
  var lojas = JSON.parse(cfg_('lojas'));
  var loja = lojas[req.loja] ? req.loja : (ap && ap.loja) || null;
  if (!loja) throw new Error('Escolha a loja');
  return loja;
}
function cx48Status_(contado, esperado) {
  if (esperado == null) return 'ok';
  return Math.abs(opxR2_(contado - esperado)) > opxCfg_().tolerancia + 0.001 ? 'diferenca' : 'ok';
}
function cx48Abrir_(req, c) {
  return comTrava_(function () {
    var ap = cx48Terminal_(req, req.loja), loja = cx48Loja_(req, ap), hoje = hoje_();
    var ja = cx48Abertura_(hoje, loja);
    if (ja) throw new Error('O caixa da loja já foi aberto hoje por ' + String(ja.por).split(' ')[0] + ' às ' + String(ja.criado_em).slice(11, 16) + '.');
    if (cx48Fechado_(hoje, loja)) throw new Error('O caixa de hoje desta loja já foi fechado.');
    if (req.contado === '' || req.contado == null) throw new Error('Conte o dinheiro da gaveta e digite o valor');
    var cont = cx48Num_(req.contado), fundo = opxCfg_().fundo[loja];
    var esp = fundo == null || isNaN(Number(fundo)) ? null : opxR2_(fundo);
    var st = cx48Status_(cont, esp), dif = esp == null ? '' : String(opxR2_(cont - esp));
    if (st === 'diferenca' && String(req.obs || '').trim().length < 3) throw new Error('Deu diferença com o fundo de troco. Conte de novo; se continuar, escreva o motivo.');
    var m = { id: 'CM' + new Date().getTime() + Math.floor(Math.random() * 1e3), data: hoje, loja: loja, tipo: 'abertura', criado_em: agora_(),
              por_id: c.id, por: c.nome, por2_id: '', por2: '', contado: String(cont), esperado: esp == null ? '' : String(esp), diferenca: dif,
              valor: '', obs: String(req.obs || '').slice(0, 300), status: st, terminal: ap ? ap.nome || ap.id : '' };
    gravar_('CaixaMov', m);
    log_(c.nome, 'caixa aberto', loja + ' · contado R$ ' + cont + (st === 'diferenca' ? ' · DIFERENÇA ' + dif : ''));
    return { status: st, diferenca: dif === '' ? null : Number(dif), contado: cont, loja: loja };
  });
}
function cx48Passagem_(req, sai, fica) {
  return comTrava_(function () {
    if (sai.id === fica.id) throw new Error('Quem sai e quem fica precisam ser pessoas diferentes');
    var ap = cx48Terminal_(req, req.loja), loja = cx48Loja_(req, ap), hoje = hoje_();
    if (!cx48Abertura_(hoje, loja)) throw new Error('O caixa ainda não foi aberto hoje.');
    if (cx48Fechado_(hoje, loja)) throw new Error('O caixa de hoje já foi fechado.');
    if (req.contado === '' || req.contado == null) throw new Error('Contem o dinheiro da gaveta juntas e digitem o valor');
    var cont = cx48Num_(req.contado), esp = cx48GavetaAgora_(hoje, loja), st = cx48Status_(cont, esp), dif = opxR2_(cont - esp);
    var m = { id: 'CM' + new Date().getTime() + Math.floor(Math.random() * 1e3), data: hoje, loja: loja, tipo: 'passagem', criado_em: agora_(),
              por_id: sai.id, por: sai.nome, por2_id: fica.id, por2: fica.nome, contado: String(cont), esperado: String(esp), diferenca: String(dif),
              valor: '', obs: String(req.obs || '').slice(0, 300), status: st, terminal: ap ? ap.nome || ap.id : '' };
    gravar_('CaixaMov', m);
    log_(sai.nome, 'passagem de caixa', loja + ' → ' + fica.nome + ' · ' + st + (st === 'diferenca' ? ' ' + dif : ''));
    return { status: st, diferenca: dif, loja: loja };
  });
}
function cx48Suprimento_(req, c) {
  return comTrava_(function () {
    var ap = cx48Terminal_(req, req.loja), loja = cx48Loja_(req, ap), hoje = hoje_();
    if (!cx48Abertura_(hoje, loja)) throw new Error('Abra o caixa antes de registrar o suprimento.');
    if (cx48Fechado_(hoje, loja)) throw new Error('O caixa de hoje já foi fechado.');
    var v = valor_(req.valor);
    if (v <= 0) throw new Error('Digite o valor');
    var obs = String(req.obs || '').trim();
    if (obs.length < 3) throw new Error('Conte de onde veio o troco');
    gravar_('CaixaMov', { id: 'CM' + new Date().getTime() + Math.floor(Math.random() * 1e3), data: hoje, loja: loja, tipo: 'suprimento', criado_em: agora_(),
              por_id: c.id, por: c.nome, por2_id: '', por2: '', contado: '', esperado: '', diferenca: '', valor: String(v), obs: obs.slice(0, 300),
              status: 'ok', terminal: ap ? ap.nome || ap.id : '' });
    log_(c.nome, 'suprimento de caixa', loja + ' R$ ' + v + ' · ' + obs);
    return { status: 'ok', valor: v, loja: loja };
  });
}

/* ───────── avisos no WhatsApp da administração (lidos pelo motor, mesma chave KOMMO_SEGREDO) ─────────
   O motor chama a cada ~2 min e manda o que ainda não mandou (cada item tem uma chave única).
   Nunca vai produto nem cliente — só loja, pessoa, hora e valores do caixa. */
function cx48Brl_(n) {
  var v = opxR2_(n), s = v < 0 ? '-' : '', t = Math.abs(v).toFixed(2).split('.');
  return s + 'R$ ' + t[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + t[1];
}
function cx48AvisosMotor_(req) {
  var segredo = PropertiesService.getScriptProperties().getProperty('KOMMO_SEGREDO');
  if (!segredo || String(req.segredo || '') !== segredo) return { ok: false, erro: 'Chave da Kommo não confere' };
  return { ok: true, hoje: hoje_(), itens: cx48ItensAvisos_() };
}
function cx48ItensAvisos_() {
  var hoje = hoje_(), lojas = JSON.parse(cfg_('lojas')), cfg = cx48Cfg_(), itens = [];
  var nome = function (k) { return (lojas[k] || {}).nome || k; };
  var pn = function (s) { return String(s || '').split(' ')[0]; };
  var hm = function (s) { return String(s || '').slice(11, 16); };
  /* abertura / passagem com diferença */
  ler_('CaixaMov').forEach(function (m) {
    if (m.data !== hoje || m.status !== 'diferenca') return;
    var dif = cx48Num_(m.diferenca), tit = m.tipo === 'abertura' ? 'Abertura do caixa' : 'Passagem de turno';
    itens.push({ k: 'cxmov|' + m.id, txt: '⚠️ *' + tit + ' com diferença — ' + nome(m.loja) + '*\n' +
      (m.tipo === 'passagem' ? pn(m.por) + ' → ' + pn(m.por2) : pn(m.por)) + ' às ' + hm(m.criado_em) + '\n' +
      'Contado ' + cx48Brl_(cx48Num_(m.contado)) + ' · esperado ' + cx48Brl_(cx48Num_(m.esperado)) + ' · *' + (dif > 0 ? '+' : '') + cx48Brl_(dif) + '*' +
      (m.obs ? '\nMotivo: ' + String(m.obs).slice(0, 120) : '') });
  });
  /* resumo de cada fechamento (refazer manda de novo) */
  var formas = [['dinheiro', 'Dinheiro'], ['pix', 'Pix'], ['debito', 'Débito'], ['credito_vista', 'Crédito à vista'], ['credito_parc', 'Crédito parcelado']];
  ler_('Caixa').forEach(function (r) {
    if (r.data !== hoje || r.status === 'reaberto') return;
    var cont = opxJson_(r.contado, {}), esp = opxJson_(r.esperado, {}), dif = opxJson_(r.diferenca, {}), maior = 0;
    var linhas = [];
    formas.forEach(function (f) {
      if (!(f[0] in cont) && !(f[0] in esp)) return;
      var d = opxR2_(dif[f[0]]); maior = Math.max(maior, Math.abs(d));
      linhas.push((Math.abs(d) < 0.005 ? '✔ ' : '✖ ') + f[1] + ': ' + cx48Brl_(cont[f[0]]) + (Math.abs(d) < 0.005 ? '' : ' (esperado ' + cx48Brl_(esp[f[0]]) + ' · ' + (d > 0 ? '+' : '') + cx48Brl_(d) + ')'));
    });
    var vend = opxJson_(r.vendas, {});
    itens.push({ k: 'cxfech|' + r.id + '|' + r.criado_em, txt: (r.status === 'diferenca' ? '⚠️' : '✅') + ' *Caixa fechado — ' + nome(r.loja) + '*\n' +
      pn(r.por) + ' às ' + hm(r.criado_em) + ' · ' + (r.status === 'diferenca' ? '*diferença de ' + cx48Brl_(maior) + '*' : 'bateu') + '\n\n' + linhas.join('\n') + '\n\n' +
      '🛒 ' + (Number(r.qtd_vendas) || 0) + ' venda(s) · ' + cx48Brl_(vend.total) + ' · 💸 sangrias ' + cx48Brl_(cx48Num_(r.sangrias)) + ' · 🪙 fundo ' + cx48Brl_(cx48Num_(r.fundo)) +
      (r.obs ? '\nObs.: ' + String(r.obs).slice(0, 120) : '') });
  });
  /* venda com dinheiro cancelada hoje */
  ler_('VendasPDV').forEach(function (v) {
    if (v.status !== 'cancelada' || String(v.cancelada_em).slice(0, 10) !== hoje) return;
    var p = cx48Partes_(v); if (!(p.dinheiro > 0)) return;
    itens.push({ k: 'cxcanc|' + v.id, txt: '💸 *Venda em dinheiro cancelada — ' + nome(v.loja) + '*\n#' + v.numero + ' de ' + pn(v.colaboradora) + ' (' + String(v.hora || '') + ') · ' +
      cx48Brl_(p.dinheiro) + ' em dinheiro\nCancelou: ' + pn(v.cancelada_por) + ' às ' + hm(v.cancelada_em) + (v.motivo_cancel ? '\nMotivo: ' + String(v.motivo_cancel).slice(0, 120) : '') });
  });
  /* sangria registrada */
  try {
    ler_('Sangrias').forEach(function (sg) {
      if (sg.data !== hoje) return;
      itens.push({ k: 'cxsang|' + sg.id, txt: '💵 *Sangria — ' + nome(sg.loja) + '*: ' + cx48Brl_(cx48Num_(sg.valor)) + ' por ' + pn(sg.tirou) + ' às ' + String(sg.hora || '') +
        (sg.conferiu ? ' · conferiu: ' + pn(sg.conferiu) : '') + (sg.video_url ? '\nFoto do envelope: ' + sg.video_url : '') });
    });
  } catch (e) {}
  /* estados do dia: caixa sem fechar, gaveta cheia, vendendo sem abrir */
  cx48Alertas_().forEach(function (a) {
    if (a.data !== hoje) return;
    if (a.tipo === 'naoFechou') itens.push({ k: 'cxnaofechou|' + hoje + '|' + a.loja, txt: '🔓 *Caixa da loja ' + a.lojaNome + ' ainda não foi fechado* (a loja fecha às ' + a.hora + ').' });
    if (a.tipo === 'gaveta' && cfg.limite_sangria > 0) itens.push({ k: 'cxgaveta|' + hoje + '|' + a.loja + '|' + Math.floor(a.valor / cfg.limite_sangria), txt: '💰 *Dinheiro demais na gaveta — ' + a.lojaNome + '*: passou de ' + cx48Brl_(cfg.limite_sangria) + '. Hora de pedir a sangria.' });
    if (a.tipo === 'semAbertura') itens.push({ k: 'cxsemab|' + hoje + '|' + a.loja, txt: '⛔ *Loja ' + a.lojaNome + ' vendendo sem abrir o caixa* — só cartão e Pix estão passando.' });
  });
  return itens;
}

/* ───────── WhatsApp direto da planilha (Evolution API do WhatsApp da loja) ─────────
   Propriedades do Script: EVOLUTION_KEY (a administração cola na tela Regras do caixa — nunca volta para a tela),
   EVOLUTION_URL e EVOLUTION_INSTANCE (padrões abaixo). Config › caixa48: whats (números), whats_ligado. */
var CX48_EVO_URL = 'https://evolution-api-production-43cd.up.railway.app', CX48_EVO_INST = 'lasvegas';
function cx48Prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function cx48WhatsCfg_() {
  var c = cfgJson_('caixa48', {}) || {};
  var nums = String(c.whats || '').split(/[,;\n\/]+/).map(function (n) { var d = n.replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 ? d : ''; }).filter(String);
  return { ligado: c.whats_ligado !== false && nums.length > 0, numeros: nums, chave: !!cx48Prop_('EVOLUTION_KEY') };
}
function cx48WhatsEnviar_(numero, texto) {
  var url = (cx48Prop_('EVOLUTION_URL') || CX48_EVO_URL).replace(/\/+$/, '') + '/message/sendText/' + (cx48Prop_('EVOLUTION_INSTANCE') || CX48_EVO_INST);
  var op = function (corpo) { return { method: 'post', contentType: 'application/json', headers: { apikey: cx48Prop_('EVOLUTION_KEY') }, payload: JSON.stringify(corpo), muteHttpExceptions: true }; };
  var r = UrlFetchApp.fetch(url, op({ number: numero, text: texto }));
  if (r.getResponseCode() === 400) r = UrlFetchApp.fetch(url, op({ number: numero, textMessage: { text: texto } }));
  var c = r.getResponseCode();
  if (c < 200 || c >= 300) throw new Error('WhatsApp respondeu ' + c + ' ' + String(r.getContentText()).slice(0, 120));
}
function cx48Enviados_() { try { var o = JSON.parse(cx48Prop_('CX48_ENVIADOS') || '{}'); return o && o.dia === hoje_() ? o : { dia: hoje_(), k: {} }; } catch (e) { return { dia: hoje_(), k: {} }; } }
var CX48_RODAPE = '\n\n_aviso automático do Portal Equipe · caixa da loja_';
/* manda o que ainda não foi (nunca derruba a ação de quem chamou) */
function cx48Avisar_(marcarSo) {
  try {
    var w = cx48WhatsCfg_();
    if (!marcarSo && (!w.ligado || !w.chave)) return { enviados: 0, motivo: !w.chave ? 'sem chave' : 'sem número' };
    var env = cx48Enviados_(), n = 0, erro = '';
    cx48ItensAvisos_().forEach(function (it) {
      if (env.k[it.k]) return;
      if (!marcarSo) {
        try { w.numeros.forEach(function (num) { cx48WhatsEnviar_(num, it.txt + CX48_RODAPE); }); n++; }
        catch (e) { erro = String(e && e.message || e); log_('Sistema', 'whats caixa erro', erro); return; }
      }
      env.k[it.k] = 1;
    });
    PropertiesService.getScriptProperties().setProperty('CX48_ENVIADOS', JSON.stringify(env));
    return { enviados: n, erro: erro };
  } catch (e) { try { log_('Sistema', 'whats caixa erro', String(e && e.message || e)); } catch (x) {} return { enviados: 0, erro: String(e && e.message || e) }; }
}
/* depois das ações que mexem no caixa; e de vez em quando (no máximo a cada 5 min) quando alguém usa o portal */
function cx48AvisarDepois_() { cx48Avisar_(false); }
function cx48AvisarAsVezes_() {
  try { var c = CacheService.getScriptCache(); if (c.get('cx48av')) return; c.put('cx48av', '1', 300); } catch (e) { return; }
  cx48Avisar_(false);
}
/* gatilho (Regras do caixa › verificar a cada 15 min): pega "caixa sem fechar" e "gaveta cheia" mesmo sem ninguém usando o portal */
function caixaAvisosGatilho() { cx48Avisar_(false); }
function cx48Gatilho_() { return ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'caixaAvisosGatilho'; })[0] || null; }

var _cx48Rodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'caixaAvisos48') { try { return cx48AvisosMotor_(req); } catch (e0) { return { ok: false, erro: String(e0 && e0.message || e0) }; } }
  if (req && req.a === 'caixa' && /^(abrir|passagem|suprimento|status48)$/.test(req.op || '')) {
    try {
      var c = checarColab_(req), r;
      if (req.op === 'abrir') r = cx48Abrir_(req, c);
      else if (req.op === 'suprimento') r = cx48Suprimento_(req, c);
      else if (req.op === 'passagem') {
        var fica = checarColab_({ eid: req.eid2, pin: req.pin2, pinHash: req.pin2Hash });
        r = cx48Passagem_(req, c, fica);
      } else r = {};
      if (req.op !== 'status48') cx48AvisarDepois_();
      return { ok: true, feito: r, caixa48: cx48Pacote_(false) };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (req && req.a === 'caixa' && req.op === 'fechar') {
    try { cx48Terminal_(req, req.loja); } catch (e2) { return { ok: false, erro: String(e2 && e2.message || e2) }; }
    var rf = _cx48Rodar(req);
    if (rf && rf.ok !== false) cx48AvisarDepois_();
    return rf;
  }
  if (req && (req.a === 'sangria' || (req.a === 'venda' && req.pdv && req.cancelar))) {
    var rv = _cx48Rodar(req);
    if (rv && rv.ok !== false) cx48AvisarDepois_();
    return rv;
  }
  if (req && (req.a === 'dados' || req.a === 'entrar' || req.a === 'admDados' || req.a === 'admAoVivo')) cx48AvisarAsVezes_();
  return _cx48Rodar(req);
};

/* ───────── a venda: "quem vendeu?", misto dividido, dinheiro só com caixa aberto ───────── */
function cx48ComoOutra_(vend, logada, fn) {
  var real = dadosColab_, r;
  dadosColab_ = function () { return { ok: true }; };      // o pacote da outra vendedora não vai para este aparelho
  try { r = fn(vend); } finally { dadosColab_ = real; }
  var d = dadosColab_(logada);
  for (var k in r) if (k !== 'ok') d[k] = r[k];
  return d;
}
var _cx48Venda = COLAB.venda;
COLAB.venda = function (c, req) {
  if (!req || !req.pdv) return _cx48Venda(c, req);
  /* desfazer / pedir cancelamento de venda que ESTE aparelho lançou para outra vendedora */
  if ((req.cancelar || req.pedirCancel) && req.id) {
    var v0 = ler_('VendasPDV').filter(function (x) { return x.id === req.id; })[0];
    if (v0 && v0.colaboradora_id !== c.id && v0.lancada_por_id === c.id) {
      var dona = colabs_().filter(function (x) { return x.id === v0.colaboradora_id; })[0];
      if (dona) return cx48ComoOutra_(dona, c, function (o) { return _cx48Venda(o, req); });
    }
    return _cx48Venda(c, req);
  }
  if (req.cancelar || req.pedirCancel) return _cx48Venda(c, req);
  var uid = String(req.uid || '').replace(/[^\w-]/g, '').slice(0, 40);
  var repetida = uid && ler_('VendasPDV').some(function (v) { return v.id === uid; });
  var lojas = JSON.parse(cfg_('lojas')), hoje = hoje_();
  var loja = lojas[req.loja] ? req.loja : (pontoDe_(c.id, hoje) || {}).loja || c.loja;

  /* quem vendeu */
  var vend = c;
  var vid = String(req.vendedora_id || '');
  if (vid && vid !== c.id && !repetida) {
    var no = cx48NoPonto_(hoje).filter(function (p) { return p.id === vid; })[0];
    if (!no) throw new Error('Essa vendedora não está com o ponto aberto hoje. Ela precisa bater o ponto para vender.');
    if (no.loja && no.loja !== loja) throw new Error('Essa vendedora bateu o ponto na outra loja hoje.');
    vend = colabs_().filter(function (x) { return x.id === vid && x.ativa === 'SIM'; })[0];
    if (!vend) throw new Error('Vendedora não encontrada');
  }

  /* misto dividido */
  var mix = null;
  if (req.pagamento === 'misto' && req.mix && typeof req.mix === 'object') {
    mix = {};
    ['pix', 'dinheiro', 'debito', 'credito'].forEach(function (k) { var n = req.mix[k] === '' || req.mix[k] == null ? 0 : cx48Num_(req.mix[k]); if (n < 0) throw new Error('Valor inválido no pagamento misto'); if (n > 0) mix[k] = n; });
    if (mix.credito) mix.parcelas = Math.max(1, Math.min(12, Number(req.parcelas) || 1));
    if (!Object.keys(mix).length) mix = null;
  }

  /* dinheiro só com o caixa aberto */
  var temDinheiro = req.pagamento === 'dinheiro' || (mix && mix.dinheiro > 0);
  if (temDinheiro && !repetida && cx48Cfg_().bloquear_dinheiro) {
    if (!cx48Abertura_(hoje, loja)) throw new Error('O caixa da loja ' + ((lojas[loja] || {}).nome || loja) + ' ainda não foi aberto. Abra o caixa no computador da loja para vender em dinheiro (cartão e Pix continuam liberados).');
    if (cx48Fechado_(hoje, loja)) throw new Error('O caixa de hoje já foi fechado — venda em dinheiro precisa de caixa aberto.');
  }

  req.loja = loja;
  var d = vend.id === c.id ? _cx48Venda(c, req) : cx48ComoOutra_(vend, c, function (o) { return _cx48Venda(o, req); });

  /* grava o que esta versão acrescenta na linha da venda */
  try {
    if (d && d.pdvVenda && !d.pdvRepetida && (mix || vend.id !== c.id)) {
      var v = ler_('VendasPDV').filter(function (x) { return x.id === d.pdvVenda.id; })[0];
      if (v) {
        if (mix) {
          var soma = opxR2_((mix.pix || 0) + (mix.dinheiro || 0) + (mix.debito || 0) + (mix.credito || 0));
          if (Math.abs(soma - opxR2_(v.total)) > 0.011) mix.confere = 'soma ' + soma + ' ≠ total ' + v.total;
          v.pagamentos = JSON.stringify(mix);
          if (mix.credito) v.parcelas = String(mix.parcelas);
        }
        if (vend.id !== c.id) { v.lancada_por_id = c.id; v.lancada_por = c.nome; }
        gravar_('VendasPDV', v);
        d.pdvVenda = pdvVenda_(v, false);
        if (vend.id !== c.id) log_(c.nome, 'pdv venda para outra', '#' + v.numero + ' → ' + vend.nome + ' R$ ' + v.total);
      }
    }
  } catch (e) { log_('Sistema', 'erro caixa48 venda', String(e && e.message || e)); }
  return d;
};

/* ───────── administração ───────── */
var _cx48AdmCancelar = ADMIN.admPdvCancelar;
ADMIN.admPdvCancelar = function (req) { var d = _cx48AdmCancelar(req); cx48AvisarDepois_(); return d; };
if (ADMIN.admPdvPedidoCancel) { var _cx48AdmPedido = ADMIN.admPdvPedidoCancel; ADMIN.admPdvPedidoCancel = function (req) { var d = _cx48AdmPedido(req); cx48AvisarDepois_(); return d; }; }
ADMIN.admCaixa48 = function (req) {
  if (req.op === 'whats') {
    var c0 = cfgJson_('caixa48', {}) || {};
    if (req.whats != null) c0.whats = String(req.whats).slice(0, 120);
    if (req.whats_ligado != null) c0.whats_ligado = !!req.whats_ligado;
    setCfg_('caixa48', JSON.stringify(c0));
    if (req.chave) PropertiesService.getScriptProperties().setProperty('EVOLUTION_KEY', String(req.chave).trim());
    if (req.gatilho === true && !cx48Gatilho_()) ScriptApp.newTrigger('caixaAvisosGatilho').timeBased().everyMinutes(15).create();
    if (req.gatilho === false && cx48Gatilho_()) ScriptApp.deleteTrigger(cx48Gatilho_());
    cx48Avisar_(true);       // começa a partir de agora: o que já aconteceu hoje não é mandado de uma vez
    log_('Administração', 'whats do caixa', 'números ' + String(c0.whats || '').replace(/\d(?=\d{4})/g, '•') + (req.chave ? ' · chave nova' : ''));
    var d0 = ADMIN.admDados(req);
    if (req.teste) { try { var w0 = cx48WhatsCfg_(); if (!w0.chave) throw new Error('Falta colar a chave do WhatsApp'); if (!w0.numeros.length) throw new Error('Falta o número'); w0.numeros.forEach(function (n) { cx48WhatsEnviar_(n, '✅ *Teste do Portal Equipe* — os avisos do caixa da loja vão chegar aqui.' + CX48_RODAPE); }); d0.whatsTeste = 'ok'; } catch (e) { d0.whatsTeste = String(e && e.message || e); } }
    return d0;
  }
  if (req.op === 'cfg') {
    var c = cx48Cfg_(), velho = cfgJson_('caixa48', {}) || {};
    if (velho.whats != null) c.whats = velho.whats;
    if (velho.whats_ligado != null) c.whats_ligado = velho.whats_ligado;
    if (req.so_terminal != null) c.so_terminal = !!req.so_terminal;
    if (req.bloquear_dinheiro != null) c.bloquear_dinheiro = !!req.bloquear_dinheiro;
    if (req.limite_sangria != null && req.limite_sangria !== '') c.limite_sangria = Math.max(0, cx48Num_(req.limite_sangria));
    setCfg_('caixa48', JSON.stringify(c));
    log_('Administração', 'config caixa', JSON.stringify(c));
  } else if (req.op === 'obs') {
    var m = ler_('CaixaMov').filter(function (x) { return x.id === req.id; })[0];
    if (!m) throw new Error('Registro não encontrado');
    m.obs = (String(m.obs || '') + ' · Adm: ' + String(req.obs || '').slice(0, 200)).replace(/^ · /, '');
    if (req.conferido) m.status = m.status === 'diferenca' ? 'conferido' : m.status;
    gravar_('CaixaMov', m);
    log_('Administração', 'caixa mov conferido', m.tipo + ' ' + m.data + ' ' + m.loja);
  } else if (req.op === 'reabrir') {
    /* desfaz o fechamento de HOJE da loja (ex.: fechado por engano/teste): a versão fechada vai para o CaixaHistorico,
       o caixa volta a ficar aberto e o próximo fechamento substitui esta linha */
    comTrava_(function () {
      var hoje = hoje_(), loja = String(req.loja || '');
      var r = ler_('Caixa').filter(function (x) { return x.data === hoje && x.loja === loja; })[0];
      if (!r || r.status === 'reaberto') throw new Error('O caixa de hoje desta loja não está fechado');
      gravar_('CaixaHistorico', { id: 'H' + new Date().getTime() + Math.floor(Math.random() * 1e3), orig_id: r.id, data: r.data, loja: r.loja,
        criado_em: r.criado_em, por: r.por, colaboradora_id: r.colaboradora_id, fundo: r.fundo, esperado: r.esperado, contado: r.contado,
        diferenca: r.diferenca, sangrias: r.sangrias, qtd_vendas: r.qtd_vendas, status: r.status, obs: r.obs, substituido_em: agora_(), substituido_por: 'Administração (reabriu)' });
      r.status = 'reaberto'; r.conferido_por = ''; r.conferido_em = '';
      r.obs_adm = (String(r.obs_adm || '') + ' · reaberto em ' + agora_() + (req.motivo ? ': ' + String(req.motivo).slice(0, 150) : '')).replace(/^ · /, '');
      gravar_('Caixa', r);
      log_('Administração', 'caixa reaberto (v48)', hoje + ' ' + loja);
    });
  } else throw new Error('Operação desconhecida');
  return ADMIN.admDados(req);
};
