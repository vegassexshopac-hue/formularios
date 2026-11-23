/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · BLACK VEGAS — 24 POR R$ 24 (v60 · 23/11/2026) — Portal Equipe
   Arquivo SEPARADO — fica DEPOIS do CAIXA/MISSAO/ANDAMENTOS e ANTES do LEVE e do PERF.
   ───────────────────────────────────────────────────────────────
   Pedido da Madu: campanha de 24 horas, na terça 24/11/2026 — 24 produtos por R$ 24 cada,
   nas lojas (PDV) e no site. Sem limite por cliente. R$ 24 é preço final: não soma com a
   Black Friday 30%, desconto digitado, cupom da roleta nem os 20% do cartão fidelidade
   (os outros produtos da mesma comanda continuam com desconto normal).
   O que este arquivo faz:
   • PDV: no dia BV24.data (horário do Acre) os produtos da lista saem por R$ 24 sozinhos
     (entram como preço promocional, com a marca bv24). Fora do dia, nada muda.
   • Venda: o desconto (digitado ou Black Friday) só vale sobre os produtos que NÃO são de R$ 24.
     Cupom da roleta e 20% do cartão não entram em comanda com produto de R$ 24.
     A venda fica marcada na coluna promo ("Black Vegas 24 por R$ 24 (N)") e cada item leva bv24:1.
   • Site (Nuvemshop): bv24SiteLigar põe o preço promocional de R$ 24 e a categoria da campanha;
     bv24SiteDesligar devolve tudo. bv24Agendar cria os dois gatilhos (00:00 de 24/11 e 00:00 de 25/11).
   Para repetir em outra data: mudar BV24.data e a lista e publicar Nova versão.
   ═══════════════════════════════════════════════════════════════ */

var BV24 = {
  nome: 'Black Vegas', titulo: '24 por R$ 24', preco: 24, data: '2026-11-24',
  categoria: 'Black Vegas 24 por R$ 24', handle: 'black-vegas-24',
  /* n = número na lista da Madu · ns = id(s) do produto no site · sku = SKU das variações · de = preço cheio da lista.
     Só entra a variação cujo preço normal é até o "de" (ex.: Plug Círculo só o tamanho P, de R$ 45). */
  itens: [
    { n: 1,  nome: 'Calcinha Tailandesa em Renda com Pérolas',        ns: ['308187364'], sku: ['604', '605', '606'], de: 35 },
    { n: 2,  nome: 'Meia-Calça Rendada Preta',                         ns: ['308181136'], sku: ['482'], de: 49.99 },
    { n: 3,  nome: 'Lubrificante Love Lub à Base de Água',             ns: ['309017807'], sku: ['545', '546', '547'], de: 39.99 },
    { n: 4,  nome: 'Desodorante Íntimo Aerossol Poésie',               ns: ['308192155'], sku: ['666', '667', '668'], de: 50 },
    { n: 5,  nome: 'Sabonete Íntimo Feminino Babaloob 150 ml',         ns: ['308182467'], sku: ['45'], de: 39.99 },
    { n: 6,  nome: 'Prolongador Masculino Hot Balls 15 g',             ns: ['308180944'], sku: ['471'], de: 45 },
    { n: 7,  nome: 'Gel Excitante Delirium Unissex 25 g',              ns: ['308181047'], sku: ['477'], de: 45 },
    { n: 8,  nome: 'Sete Sensações Gel Deslizante 25 g',               ns: ['308180821'], sku: ['465'], de: 45 },
    { n: 9,  nome: 'Kuloko Gel 15 g',                                  ns: ['308187142'], sku: ['408'], de: 30 },
    { n: 10, nome: 'Gel Adstringente Sempre Virgem 25 g',              ns: ['308180982'], sku: ['473'], de: 45 },
    { n: 11, nome: 'Power Shock Excitante Eletrizante Beijável 15 ml', ns: ['309042526'], sku: ['568', '569'], de: 45 },
    { n: 12, nome: 'Egg Masturbador Masculino Clicker',                ns: ['308694601'], sku: ['516'], de: 39.99 },
    { n: 13, nome: 'Plug Anal Formato Círculo (tamanho P)',            ns: ['308187200'], sku: ['686', '688', '692', '695', '698'], de: 45 },
    { n: 14, nome: 'Chaveiro Pênis',                                   ns: ['308186052'], sku: ['304'], de: 45 },
    { n: 15, nome: 'Anel Peniano Kit 3',                               ns: ['309066464'], sku: ['277'], de: 39.99 },
    { n: 16, nome: 'Dados Jogo do Prazer Hétero',                      ns: ['308180541'], sku: ['450'], de: 30 },
    { n: 17, nome: 'Baralho Kama Sutra Super Erótico',                 ns: ['308187217'], sku: ['414'], de: 49.99 },
    { n: 18, nome: 'Algema de Metal com Chaves',                       ns: ['308180324'], sku: ['440'], de: 39.99 },
    { n: 19, nome: 'Vibrador Golfinho Ponto G',                        ns: ['308990446', '308736355'], sku: ['706', '532'], de: 45 },
    { n: 20, nome: 'Prótese Tortinho Rosa Aromatizada 13,5 x 5 cm',    ns: ['308983315'], sku: ['575', '576'], de: 95 },
    { n: 21, nome: 'Prendedor de Mamilo com Sinos',                    ns: ['308181851'], sku: ['8'], de: 49.99 },
    { n: 22, nome: 'Volumão Gel Excitante Masculino 25 g',             ns: ['308180764'], sku: ['461'], de: 45 },
    { n: 23, nome: 'Excitante Feminino Xana Loka 15 g',                ns: ['308180994'], sku: ['474'], de: 30 },
    { n: 24, nome: 'Lub In Lubrificante Íntimo com Aplicador',         ns: ['308187233'], sku: ['416'], de: 55 }
  ]
};

function bv24Ativa_() { return hoje_() === BV24.data; }
function bv24R2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
var _bv24Sku = null;
function bv24PorSku_() {
  if (!_bv24Sku) { _bv24Sku = {}; BV24.itens.forEach(function (it) { it.sku.forEach(function (s) { _bv24Sku[s] = it; }); }); }
  return _bv24Sku;
}
/** o item da campanha a que este produto do catálogo pertence (ou null) — vale o preço que ele tinha ANTES da campanha */
function bv24ItemDe_(p) {
  var sku = String(p.sku || '').trim(), it = sku ? bv24PorSku_()[sku] : null;
  if (!it) return null;
  var cheio = Number(p.preco) || 0, promo = Number(p.promo) || 0, vale = promo > 0 && promo < cheio ? promo : cheio;
  if (promo === BV24.preco && cheio > BV24.preco) return it;   // o R$ 24 já veio do site (importação no dia)
  if (vale <= BV24.preco) return null;                 // já custa R$ 24 ou menos
  if (vale > it.de + 0.011) return null;               // variação mais cara (ex.: Plug M e G) fica fora
  return it;
}

/* ───────── PDV: no dia, os produtos da lista saem por R$ 24 ───────── */
var _bv24Produtos = pdvProdutos_;
pdvProdutos_ = function (admin) {
  var l = _bv24Produtos(admin);
  if (!bv24Ativa_()) return l;
  l.forEach(function (p) { var it = bv24ItemDe_(p); if (it) { p.promo = BV24.preco; p.bv24 = it.n; } });
  return l;
};
var _bv24Cfg = pdvCfg_;
pdvCfg_ = function () {
  var o = _bv24Cfg();
  if (bv24Ativa_()) o.bv24 = { nome: BV24.nome, titulo: BV24.titulo, preco: BV24.preco, data: BV24.data, qtd: BV24.itens.length };
  return o;
};

/* ───────── a venda: produto de R$ 24 não entra em desconto nenhum ───────── */
var _bv24Vender = pdvVenderDentro_;
pdvVenderDentro_ = function (c, req) {
  if (!req || !bv24Ativa_()) return _bv24Vender(c, req);
  var cat = {}; pdvProdutos_(true).forEach(function (p) { cat[p.id] = p; });
  var lista = Array.isArray(req.itens) ? req.itens.slice(0, 80) : [], n24 = 0, base = 0, ids24 = {};
  lista.forEach(function (i) {
    var q = Math.max(1, Math.min(999, Math.round(Number(i.qtd) || 1))), p = cat[i.id];
    if (p && p.bv24) { n24 += q; ids24[p.id] = 1; return; }
    var preco = p ? bv24R2_(p.promo > 0 ? p.promo : p.preco) : (function () { try { return valor_(i.preco); } catch (e) { return 0; } })();
    base += preco * q;
  });
  if (!n24) return _bv24Vender(c, req);
  var uid = String(req.uid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (uid && ler_('VendasPDV').some(function (v) { return v.id === uid; })) return _bv24Vender(c, req);   // reenvio da mesma venda

  var rotulo = BV24.nome + ' ' + BV24.titulo;
  if (req.roleta_codigo) throw new Error('Produto de R$ 24 (' + BV24.nome + ') não soma com o cupom da roleta. Passe os produtos de R$ 24 em outra comanda.');
  try {
    var ciclo = fidCfg_().ciclo, esc = req.fid_presentes && typeof req.fid_presentes === 'object' ? req.fid_presentes : {};
    for (var key in esc) { var nn = Number(String(key).split('|')[1]); if (nn && nn % ciclo === 0) throw new Error('Produto de R$ 24 (' + BV24.nome + ') não soma com os 20% do cartão fidelidade. Passe os produtos de R$ 24 em outra comanda.'); }
  } catch (e) { if (/R\$ 24/.test(String(e && e.message))) throw e; }
  var manual = req.desconto ? valor_(req.desconto) : 0, max = pdvCfg_().desconto_max;
  base = bv24R2_(base);
  if (manual > base * max / 100 + 0.01) {
    var teto = bv24R2_(base * max / 100).toFixed(2).replace('.', ',');
    throw new Error(base > 0.009 ? 'Os produtos de R$ 24 não entram no desconto. Nesta comanda o desconto máximo é R$ ' + teto + ' (' + max + '% dos outros produtos).'
                                 : 'Produto de R$ 24 (' + BV24.nome + ') já é preço final: não tem desconto. Tire o desconto e finalize de novo.');
  }
  var d = _bv24Vender(c, req);
  try {
    if (d && d.pdvVenda && !d.pdvRepetida) {
      var v = ler_('VendasPDV').filter(function (x) { return x.id === d.pdvVenda.id; })[0];
      if (v) {
        var itens = []; try { itens = JSON.parse(v.itens || '[]'); } catch (e2) {}
        itens.forEach(function (i) { if (i.id && ids24[i.id]) i.bv24 = 1; });
        v.itens = JSON.stringify(itens);
        v.promo = (v.promo ? v.promo + ' + ' : '') + rotulo + ' (' + n24 + ')';
        gravar_('VendasPDV', v);
        d.pdvVenda = pdvVenda_(v, false);
        log_(c.nome, 'pdv black vegas 24', '#' + v.numero + ' · ' + n24 + ' produto(s) de R$ 24');
      }
    }
  } catch (e3) { log_('Sistema', 'erro marcar venda bv24', String(e3 && e3.message || e3)); }
  return d;
};

/* ═════════ SITE (Nuvemshop): preço promocional de R$ 24 + categoria da campanha ═════════
   Rodar pelo editor (ou pelos gatilhos do bv24Agendar). Guarda o que mudou na Propriedade BV24_SITE para devolver depois. */
function bv24Prop_(v) {
  var p = PropertiesService.getScriptProperties();
  if (v === undefined) { try { return JSON.parse(p.getProperty('BV24_SITE') || '{}') || {}; } catch (e) { return {}; } }
  p.setProperty('BV24_SITE', JSON.stringify(v)); return v;
}
/** Só confere: lista o que o Ligar vai mudar (não altera nada). O resultado vai para o Log. */
function bv24SiteConferir() {
  var linhas = [];
  BV24.itens.forEach(function (it) {
    it.ns.forEach(function (pid) {
      var p = nsApi_('get', '/products/' + pid + '?fields=id,name,published,variants,categories');
      if (!p) { linhas.push(it.n + ' ' + pid + ' NÃO ACHADO'); return; }
      var entra = (p.variants || []).filter(function (v) { return bv24VarEntra_(v, it); });
      linhas.push(it.n + ' ' + nsTexto_(p.name).slice(0, 40) + ' · ' + entra.length + '/' + (p.variants || []).length + ' variações · estoque ' +
        entra.reduce(function (s, v) { return s + (v.stock == null ? 999 : Number(v.stock) || 0); }, 0) + (p.published === false ? ' · ESCONDIDO' : ''));
      Utilities.sleep(350);
    });
  });
  log_('Sistema', 'bv24 conferir', linhas.join(' | ').slice(0, 45000));
  Logger.log(linhas.join('\n'));
  return linhas;
}
function bv24VarEntra_(v, it) {
  var cheio = Number(v.price) || 0, promo = Number(v.promotional_price) || 0, vale = promo > 0 && promo < cheio ? promo : cheio;
  return vale > BV24.preco && vale <= it.de + 0.011;
}
/** Liga no site: preço promocional R$ 24 nas variações da lista e a categoria da campanha. Pode rodar de novo sem estragar. */
function bv24SiteLigar() {
  var g = bv24Prop_(); g.vars = g.vars || {}; g.cats = g.cats || {};
  if (!g.categoria_id) {
    var cat = nsApi_('post', '/categories', { name: { pt: BV24.categoria }, handle: { pt: BV24.handle } });
    g.categoria_id = cat && cat.id ? String(cat.id) : ''; g.categoria_handle = cat && cat.handle ? nsTexto_(cat.handle) : '';
    bv24Prop_(g);
  }
  var mudou = 0, erros = [];
  BV24.itens.forEach(function (it) {
    it.ns.forEach(function (pid) {
      try {
        var p = nsApi_('get', '/products/' + pid + '?fields=id,variants,categories');
        if (!p) { erros.push(it.n + ' ' + pid + ' não achado'); return; }
        (p.variants || []).forEach(function (v) {
          var chave = pid + '/' + v.id;
          if (g.vars[chave] === undefined) { if (!bv24VarEntra_(v, it)) return; g.vars[chave] = v.promotional_price == null ? '' : String(v.promotional_price); bv24Prop_(g); }
          if (Number(v.promotional_price) === BV24.preco) return;
          nsApi_('put', '/products/' + pid + '/variants/' + v.id, { promotional_price: BV24.preco.toFixed(2) });
          mudou++; Utilities.sleep(350);
        });
        if (g.categoria_id) {
          var atuais = (p.categories || []).map(function (c) { return String(c.id); });
          if (atuais.indexOf(g.categoria_id) < 0) {
            if (g.cats[pid] === undefined) { g.cats[pid] = atuais; bv24Prop_(g); }
            nsApi_('put', '/products/' + pid, { categories: atuais.concat([g.categoria_id]).map(Number) });
            Utilities.sleep(350);
          }
        }
      } catch (e) { erros.push(it.n + ' ' + pid + ': ' + String(e && e.message || e).slice(0, 120)); }
    });
  });
  g.ligado_em = agora_(); g.desligado_em = ''; bv24Prop_(g);
  log_('Sistema', 'bv24 site ligado', mudou + ' variações a R$ ' + BV24.preco + ' · categoria ' + (g.categoria_id || '—') + (erros.length ? ' · ERROS: ' + erros.join(' | ') : ''));
  return { mudou: mudou, erros: erros, categoria: g.categoria_id, handle: g.categoria_handle };
}
/** Desliga no site: devolve o preço promocional que cada variação tinha e tira a categoria. Também limpa a planilha se o R$ 24 tiver sido importado. */
function bv24SiteDesligar() {
  var g = bv24Prop_(), voltou = 0, erros = [];
  Object.keys(g.vars || {}).forEach(function (chave) {
    try {
      var pv = chave.split('/'), antes = g.vars[chave];
      nsApi_('put', '/products/' + pv[0] + '/variants/' + pv[1], { promotional_price: antes === '' ? null : antes });
      voltou++; Utilities.sleep(350);
    } catch (e) { erros.push(chave + ': ' + String(e && e.message || e).slice(0, 120)); }
  });
  Object.keys(g.cats || {}).forEach(function (pid) {
    try { nsApi_('put', '/products/' + pid, { categories: (g.cats[pid] || []).map(Number) }); Utilities.sleep(350); }
    catch (e) { erros.push('cat ' + pid + ': ' + String(e && e.message || e).slice(0, 120)); }
  });
  var limpos = 0;
  try {
    comTrava_(function () {
      ler_('Produtos').forEach(function (p) {
        if (Number(p.preco_promo) === BV24.preco && bv24PorSku_()[String(p.sku || '').trim()]) { p.preco_promo = ''; p.atualizado_em = agora_(); gravar_('Produtos', p); limpos++; }
      });
    });
  } catch (e) { erros.push('planilha: ' + String(e && e.message || e).slice(0, 120)); }
  g.desligado_em = agora_(); if (!erros.length) { g.vars = {}; g.cats = {}; } bv24Prop_(g);
  log_('Sistema', 'bv24 site desligado', voltou + ' variações de volta · ' + limpos + ' na planilha' + (erros.length ? ' · ERROS: ' + erros.join(' | ') : ''));
  return { voltou: voltou, limpos: limpos, erros: erros };
}
/** Cria os dois gatilhos: liga à 00:00 de 24/11 e desliga à 00:00 de 25/11 (horário do Acre, UTC−5). Rodar UMA vez pelo editor. */
function bv24Agendar() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (/^bv24Site(Ligar|Desligar)$/.test(t.getHandlerFunction())) ScriptApp.deleteTrigger(t); });
  var dia = BV24.data, prox = Utilities.formatDate(new Date(new Date(dia + 'T12:00:00-05:00').getTime() + 86400000), TZ, 'yyyy-MM-dd');
  ScriptApp.newTrigger('bv24SiteLigar').timeBased().at(new Date(dia + 'T00:00:10-05:00')).create();
  ScriptApp.newTrigger('bv24SiteDesligar').timeBased().at(new Date(prox + 'T00:00:10-05:00')).create();
  log_('Sistema', 'bv24 agendado', 'liga ' + dia + ' 00:00 · desliga ' + prox + ' 00:00');
  return 'Agendado: liga ' + dia + ' 00:00 · desliga ' + prox + ' 00:00 (Acre)';
}
