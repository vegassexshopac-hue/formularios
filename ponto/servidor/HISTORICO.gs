/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · COMPRAS DO SISTEMA ANTIGO (Portal Equipe) — v38
   Guarda o histórico de vendas do Gestão Fácil (Bosque e Centro) e mostra
   na ficha da cliente (Administração › Vendas › Clientes › ficha).
   NÃO entra nas vendas do PDV: não mexe em metas, estoque, selos nem cashback.
   Arquivo SEPARADO — fica DEPOIS de FIDELIDADE.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR:
   1) Apps Script: Arquivos › + › Script › nome: HISTORICO
   2) Cole este arquivo inteiro e salve.
   3) Implantar › Gerenciar implantações › lápis › Nova versão › Implantar.
   A aba HistoricoAntigo é criada sozinha.
   ═══════════════════════════════════════════════════════════════ */

ABAS.HistoricoAntigo = ['id', 'loja', 'cupom', 'data', 'cliente', 'tel', 'vendedora', 'total', 'itens', 'importado_em'];

/** Compras antigas de uma cliente (pelo WhatsApp; sem WhatsApp, pelo nome). Mais nova primeiro. */
function histDoCliente_(tel, nome) {
  var t = fidTel_(tel), n = norm_(nome || '');
  if (!t && !n) return [];
  return ler_('HistoricoAntigo').filter(function (h) {
    var ht = fidTel_(h.tel);
    return t ? ht === t : (!ht && norm_(h.cliente) === n);
  }).map(function (h) {
    return { loja: h.loja, cupom: h.cupom, data: String(h.data || ''), vendedora: h.vendedora, total: Number(h.total) || 0, itens: fidJson_(h.itens, []) };
  }).sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : 0; });
}

/** Grava um lote. Mesma loja + cupom = mesma venda (substitui, não duplica). */
function histImportar_(lista) {
  lista = Array.isArray(lista) ? lista : [];
  if (!lista.length) throw new Error('Lista vazia');
  if (lista.length > 3000) throw new Error('Lote grande demais (máx. 3.000 vendas)');
  var sh = aba_('HistoricoAntigo'), cab = cabecalho_('HistoricoAntigo', sh), atuais = ler_('HistoricoAntigo'), porId = {}, agora = agora_();
  atuais.forEach(function (h) { porId[h.id] = h; });
  var novas = 0, atualizadas = 0, ignoradas = 0;
  lista.forEach(function (v) {
    var loja = String(v.loja || '').toLowerCase().trim(), cupom = String(v.cupom || '').trim();
    var data = String(v.data || '').trim();
    if (!loja || !cupom || !/^\d{4}-\d{2}-\d{2}/.test(data)) { ignoradas++; return; }
    var itens = (Array.isArray(v.itens) ? v.itens : []).slice(0, 80).map(function (i) {
      return { cod: String(i.cod || '').slice(0, 30), desc: String(i.desc || '').slice(0, 120), qtd: Number(i.qtd) || 0, preco: Number(i.preco) || 0, total: Number(i.total) || 0 };
    });
    var id = loja + '-' + cupom, h = porId[id];
    if (h) atualizadas++; else { h = { id: id }; atuais.push(h); porId[id] = h; novas++; }
    h.loja = loja; h.cupom = cupom; h.data = data.slice(0, 16);
    h.cliente = String(v.cliente || '').trim().slice(0, 80);
    h.tel = fidTel_(v.tel); h.vendedora = String(v.vendedora || '').slice(0, 40);
    h.total = String(Math.round((Number(v.total) || 0) * 100) / 100);
    h.itens = JSON.stringify(itens); h.importado_em = agora;
  });
  var linhas = atuais.map(function (h) { return linha_('HistoricoAntigo', h, cab); });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cab.length).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setNumberFormat('@').setValues(linhas);
  log_('Administração', 'importar histórico antigo', novas + ' novas · ' + atualizadas + ' atualizadas · ' + ignoradas + ' ignoradas');
  return { ok: true, importados: { novas: novas, atualizadas: atualizadas, ignoradas: ignoradas }, total: atuais.length };
}

/* ───────── administração: a = 'admHistorico' ───────── */
ADMIN.admHistorico = function (req) {
  if (req.op === 'importar') return fidTrava_(function () { return histImportar_(req.lista); });
  if (req.op === 'resumo') {
    var l = ler_('HistoricoAntigo'), r = { total: l.length, lojas: {} };
    l.forEach(function (h) { r.lojas[h.loja] = (r.lojas[h.loja] || 0) + 1; });
    return { ok: true, resumo: r };
  }
  if (req.op === 'cliente') return { ok: true, antigas: histDoCliente_(req.tel, req.nome) };
  throw new Error('Operação desconhecida');
};

/* A ficha da cliente (admFidelidade › cartao) já volta com as compras antigas — sem ida extra ao servidor. */
var _histAdmFid = ADMIN.admFidelidade;
ADMIN.admFidelidade = function (req) {
  var r = _histAdmFid(req);
  if (req && (req.op === 'cartao' || req.op === 'salvar' || req.op === 'cadastrar') && r && r.cartao) {
    try { r.cartao.antigas = histDoCliente_(r.cartao.tel, r.cartao.nome); } catch (e) { r.cartao.antigas = []; r.cartao.antigas_erro = String(e && e.message || e); }
  }
  return r;
};
