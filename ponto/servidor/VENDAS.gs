/* ═══════════ VENDAS.gs — v47: relatório de vendas da equipe + pedido de cancelamento ═══════════
   Colar no Apps Script como arquivo novo (Arquivos › + › Script › nome: VENDAS), NO FIM da lista (depois do AJUDA),
   e publicar Nova versão. ES5 (runtime legado).

   Pedido da Madu (04/11/2026):
   • A vendedora vê o histórico das vendas do dia, da semana e do mês para rever e conferir.
   • Até 15 min ela mesma desfaz a venda (com motivo). A venda NUNCA some: fica no histórico marcada como desfeita.
   • Depois de 15 min ela PEDE o cancelamento com o motivo; a administração aprova (cancela) ou recusa (com resposta).
     Tudo fica registrado: quem pediu, quando, motivo, quem decidiu, quando e a resposta.

   Aba nova: CancelPedidos (criada sozinha).
   Ações: venda {pdv:1, pedirCancel:1, id, motivo} (equipe, PIN) · admPdvPedidoCancel {id, aprovar, resposta, por}.
   Muda também: desfazer sem motivo não passa mais; o pacote da vendedora traz as vendas desde a segunda-feira
   da semana (se ela começou no mês anterior) e os pedidos de cancelamento dela. */

ABAS.CancelPedidos = ['id', 'venda_id', 'numero', 'data_venda', 'hora_venda', 'loja', 'colaboradora_id', 'colaboradora', 'total',
                      'motivo', 'pedido_em', 'status', 'decidido_em', 'decidido_por', 'resposta'];

function vdTxt_(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200); }

/** Segunda-feira da semana de uma data AAAA-MM-DD. */
function vdSegunda_(iso) {
  var p = String(iso).split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
  var dow = (d.getDay() + 6) % 7;                  // 0 = segunda
  d.setDate(d.getDate() - dow);
  var m = d.getMonth() + 1, dd = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
}

function vdPedidos_(filtro) {
  var l = [];
  try { l = ler_('CancelPedidos').filter(filtro); } catch (e) { return []; }
  return l.map(function (p) { var o = limpar_(p); o.total = Number(o.total) || 0; o.numero = Number(o.numero) || 0; return o; }).reverse();
}

/* ───────── pacote da vendedora: semana inteira + os pedidos dela ───────── */
var _vdDadosColab = dadosColab_;
dadosColab_ = function (c) {
  var d = _vdDadosColab(c);
  try {
    if (d.pdv && !d.pdv.erro) {
      var hoje = hoje_(), ini = mesDe_(hoje) + '-01', seg = vdSegunda_(hoje);
      if (seg < ini) {                              // a semana começou no mês passado: completa os dias que faltam
        var ja = {}; (d.pdv.vendas || []).forEach(function (v) { ja[v.id] = 1; });
        ler_('VendasPDV').forEach(function (v) { if (v.data >= seg && v.data < ini && !ja[v.id]) d.pdv.vendas.push(pdvVenda_(v, false)); });
      }
      var lim = diaMais_(-62);
      d.pdv.pedidosCancel = vdPedidos_(function (p) { return p.colaboradora_id === c.id && String(p.pedido_em).slice(0, 10) >= lim; });
    }
  } catch (e) {}
  return d;
};

/* ───────── administração: pendentes + decididos dos últimos 30 dias ───────── */
var _vdAdmDados = ADMIN.admDados;
ADMIN.admDados = function (req) {
  var d = _vdAdmDados(req);
  try {
    if (d.pdv && !d.pdv.erro) {
      var lim = diaMais_(-30);
      d.pdv.pedidosCancel = vdPedidos_(function (p) { return p.status === 'pendente' || String(p.pedido_em).slice(0, 10) >= lim; });
    }
  } catch (e) {}
  return d;
};

/* ───────── equipe: desfazer (com motivo) e pedir cancelamento ───────── */
var _vdVenda = COLAB.venda;
COLAB.venda = function (c, req) {
  if (req.pdv && req.pedirCancel) return vdPedirCancel_(c, req);
  if (req.pdv && req.cancelar && vdTxt_(req.motivo).length < 3) throw new Error('Conte o motivo (ex.: errei o produto, cliente desistiu)');
  return _vdVenda(c, req);
};

function vdPedirCancel_(c, req) {
  var motivo = vdTxt_(req.motivo, 200);
  if (motivo.length < 3) throw new Error('Conte o motivo do cancelamento');
  var v = ler_('VendasPDV').filter(function (x) { return x.id === req.id; })[0];
  if (!v || v.colaboradora_id !== c.id) throw new Error('Venda não encontrada');
  if (v.status === 'cancelada') throw new Error('Essa venda já foi cancelada');
  var aberto = ler_('CancelPedidos').filter(function (p) { return p.venda_id === v.id && p.status === 'pendente'; })[0];
  if (aberto) throw new Error('Já existe um pedido de cancelamento para essa venda esperando a administração');
  var p = { id: 'CP' + new Date().getTime() + Math.floor(Math.random() * 1e3), venda_id: v.id, numero: v.numero, data_venda: v.data,
            hora_venda: v.hora, loja: v.loja, colaboradora_id: c.id, colaboradora: c.nome, total: v.total, motivo: motivo,
            pedido_em: agora_(), status: 'pendente', decidido_em: '', decidido_por: '', resposta: '' };
  gravar_('CancelPedidos', p);
  log_(c.nome, 'pediu cancelamento', '#' + v.numero + ' ' + v.data + ' R$ ' + v.total + ' · ' + motivo);
  var d = dadosColab_(c);
  d.pedidoCancel = vdPedidos_(function (x) { return x.id === p.id; })[0];
  return d;
}

/* ───────── administração: aprovar (cancela a venda) ou recusar ───────── */
ADMIN.admPdvPedidoCancel = function (req) {
  var p = ler_('CancelPedidos').filter(function (x) { return x.id === req.id; })[0];
  if (!p) throw new Error('Pedido não encontrado');
  if (p.status !== 'pendente') throw new Error('Esse pedido já foi decidido');
  var por = vdTxt_(req.por || 'Administração', 40), resposta = vdTxt_(req.resposta, 200);
  if (req.aprovar) {
    var v = ler_('VendasPDV').filter(function (x) { return x.id === p.venda_id; })[0];
    if (!v) throw new Error('Venda não encontrada');
    if (v.status !== 'cancelada') pdvCancelarLinha_(v, 'Administração (' + por + ')', 'Pedido de ' + p.colaboradora + ': ' + p.motivo + (resposta ? ' · ' + resposta : ''));
    p.status = 'aprovado';
  } else {
    if (resposta.length < 3) throw new Error('Conte para ela por que o cancelamento foi recusado');
    p.status = 'recusado';
  }
  p.decidido_em = agora_(); p.decidido_por = por; p.resposta = resposta;
  gravar_('CancelPedidos', p);
  log_(por, 'cancelamento ' + p.status, '#' + p.numero + ' de ' + p.colaboradora + (resposta ? ' · ' + resposta : ''));
  return ADMIN.admDados();
};

/* Se a administração cancela direto pela venda, o pedido aberto dela fica resolvido junto. */
var _vdAdmCancelar = ADMIN.admPdvCancelar;
ADMIN.admPdvCancelar = function (req) {
  var r = _vdAdmCancelar(req), n = 0;
  try {
    ler_('CancelPedidos').filter(function (p) { return p.venda_id === req.id && p.status === 'pendente'; }).forEach(function (p) {
      p.status = 'aprovado'; p.decidido_em = agora_(); p.decidido_por = vdTxt_(req.por || 'Administração', 40);
      p.resposta = vdTxt_(req.motivo, 200); gravar_('CancelPedidos', p); n++;
    });
    if (n) r = ADMIN.admDados();
  } catch (e) {}
  return r;
};
