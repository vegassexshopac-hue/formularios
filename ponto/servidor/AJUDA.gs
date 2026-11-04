/* ═══════════ AJUDA.gs — v46: "Tirar dúvida" monitorado ═══════════
   Colar no Apps Script como arquivo novo (Arquivos › + › Script › nome: AJUDA), no fim da lista, e publicar Nova versão.
   ES5 (o projeto roda no runtime legado).

   • A vendedora pergunta no botão "Tirar dúvida" do portal. Cada pergunta vira uma linha na aba Duvidas
     (quem, quando, o que perguntou, qual resposta abriu, se resolveu, comentário, em que tela estava).
   • Se nenhuma resposta pronta serve, o portal pode pedir à IA (mesma chave da IA do Estoque, Propriedade IA_CHAVE),
     que responde só com base no guia do portal enviado pelo site.
   • "Não resolveu" vira dúvida aberta para a administração responder; a resposta aparece para ela no próprio botão.
   • Administração › Comunicação › Dúvidas da equipe: métricas, lista, responder, links dos vídeos (Config › ajuda_videos).
   Ações: duvida (PIN; op registrar | ia) · admDuvidas (op lista | responder | videos). Toda resposta com a colaboradora
   leva ajudaVideos e minhasDuvidas (as 10 últimas dela). */

if (typeof ABAS !== 'undefined') ABAS.Duvidas = ['id', 'quando', 'data', 'colaboradora_id', 'colaboradora', 'pergunta', 'achou', 'achou_titulo', 'util', 'comentario', 'tela', 'ia', 'status', 'resposta', 'respondido_por', 'respondido_em'];

function ajVideos_() { try { return JSON.parse(cfg_('ajuda_videos') || '{}') || {}; } catch (e) { return {}; } }
function ajTxt_(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 300); }
function ajMinhas_(eid) {
  var l = [];
  try { l = ler_('Duvidas').filter(function (d) { return d.colaboradora_id === eid && (d.status === 'aberta' || d.status === 'respondida'); }); } catch (e) { return []; }
  return l.slice(-10).reverse().map(function (d) { return { id: d.id, quando: d.quando, pergunta: d.pergunta, comentario: d.comentario, status: d.status, resposta: d.resposta, respondido_por: d.respondido_por }; });
}

function ajRegistrar_(c, req) {
  var id = ajTxt_(req.id, 40);
  if (!/^[\w-]{6,40}$/.test(id)) throw new Error('Pergunta sem identificação');
  var atual = ler_('Duvidas').filter(function (d) { return d.id === id; })[0];
  var o = atual || { id: id, quando: agora_(), data: hoje_(), colaboradora_id: c.id, colaboradora: c.nome, status: '' };
  if (atual && atual.colaboradora_id !== c.id) throw new Error('Essa pergunta é de outra pessoa');
  if (req.pergunta != null) o.pergunta = ajTxt_(req.pergunta, 300);
  if (req.achou != null) { o.achou = ajTxt_(req.achou, 40); o.achou_titulo = ajTxt_(req.achou_titulo, 120); }
  if (req.tela != null) o.tela = ajTxt_(req.tela, 30);
  if (req.ia != null) o.ia = req.ia ? 'SIM' : '';
  if (req.util === 'sim' || req.util === 'nao') o.util = req.util;
  if (req.comentario != null) o.comentario = ajTxt_(req.comentario, 500);
  if (o.util === 'nao' && o.status !== 'respondida') o.status = 'aberta';
  if (o.util === 'sim' && o.status === 'aberta') o.status = '';
  gravar_('Duvidas', o);
  return { ok: true, id: id, minhasDuvidas: ajMinhas_(c.id) };
}

function ajIA_(req) {
  var chave = typeof estChaveIA_ === 'function' ? estChaveIA_() : '';
  if (!chave) return { ok: true, ia: false };
  var cfg = typeof estCfg_ === 'function' ? estCfg_() : {}, prov = cfg.ia_provedor === 'gemini' ? 'gemini' : 'claude';
  var modelo = cfg.ia_modelo || (typeof EST_MODELOS !== 'undefined' ? EST_MODELOS[prov] : (prov === 'gemini' ? 'gemini-2.5-flash' : 'claude-sonnet-5-5'));
  var guia = ajTxt_(req.guia, 14000), pergunta = ajTxt_(req.pergunta, 300);
  if (!pergunta) throw new Error('Escreva a dúvida');
  var prompt = 'Você é a ajuda do Portal Equipe Las Vegas (sistema interno de uma loja: ponto, vendas no PDV, caixa, estoque, pedidos do site, metas). ' +
    'Responda a dúvida de uma vendedora em português do Brasil, curto e simples, em passos numerados (no máximo 6), ' +
    'usando SOMENTE as informações do GUIA abaixo. Se o guia não tiver a resposta, diga que não sabe e sugira tocar em "Não resolveu" para a administração responder. ' +
    'Nunca invente botões ou telas. Responda apenas com JSON: {"resposta":"texto com os passos, cada passo numa linha","tema":"id do tópico do guia mais próximo ou vazio"}.\n\nGUIA:\n' + guia + '\n\nDÚVIDA: ' + pergunta;
  var resp, txt = '';
  if (prov === 'gemini') {
    resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': chave },
      payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, response_mime_type: 'application/json' } }) });
    var jg = JSON.parse(resp.getContentText() || '{}');
    if (resp.getResponseCode() >= 300) return { ok: true, ia: false, erro: 'IA indisponível agora' };
    txt = ((((jg.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || ''; }).join('');
  } else {
    resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: modelo, max_tokens: 800, temperature: 0, messages: [{ role: 'user', content: prompt }] }) });
    var ja = JSON.parse(resp.getContentText() || '{}');
    if (resp.getResponseCode() >= 300) return { ok: true, ia: false, erro: 'IA indisponível agora' };
    txt = (ja.content || []).map(function (p) { return p.text || ''; }).join('');
  }
  var out = null;
  try { out = JSON.parse(txt); } catch (e) { var i = txt.indexOf('{'), f = txt.lastIndexOf('}'); if (i >= 0 && f > i) { try { out = JSON.parse(txt.slice(i, f + 1)); } catch (x) {} } }
  if (!out || !out.resposta) return { ok: true, ia: false };
  return { ok: true, ia: true, resposta: ajTxt_(out.resposta, 1500), tema: ajTxt_(out.tema, 40) };
}

ADMIN.admDuvidas = function (req) {
  if (req.op === 'responder') {
    var d = ler_('Duvidas').filter(function (x) { return x.id === req.id; })[0];
    if (!d) throw new Error('Dúvida não encontrada');
    d.resposta = ajTxt_(req.texto, 1000); d.status = d.resposta ? 'respondida' : 'aberta';
    d.respondido_por = ajTxt_(req.por || 'Administração', 40); d.respondido_em = agora_();
    gravar_('Duvidas', d);
    log_(d.respondido_por, 'respondeu dúvida', d.colaboradora + ': ' + d.pergunta);
  } else if (req.op === 'videos') {
    var v = {}, ent = req.videos || {};
    Object.keys(ent).forEach(function (k) { var u = ajTxt_(ent[k], 400); if (/^[\w-]{1,40}$/.test(k) && /^https:\/\//.test(u)) v[k] = u; });
    setCfg_('ajuda_videos', JSON.stringify(v));
    log_(ajTxt_(req.por || 'Administração', 40), 'vídeos da ajuda', Object.keys(v).length + ' vídeo(s)');
  }
  var dias = Math.min(180, Math.max(1, Number(req.dias) || 60)), lim = Utilities.formatDate(new Date(new Date().getTime() - dias * 86400000), TZ, 'yyyy-MM-dd');
  var itens = ler_('Duvidas').filter(function (x) { return String(x.data) >= lim; }).map(limpar_).reverse();
  return { ok: true, itens: itens, videos: ajVideos_(), ia: !!(typeof estChaveIA_ === 'function' && estChaveIA_()) };
};

var _ajRodar = rodar_;
rodar_ = function (req) {
  if (req && req.a === 'duvida') {
    try {
      var c = checarColab_(req);
      if (req.op === 'ia') return ajIA_(req);
      return comTrava_(function () { return ajRegistrar_(c, req); });
    } catch (err) { return { ok: false, erro: String(err && err.message || err) }; }
  }
  var r = _ajRodar(req);
  try {
    if (r && typeof r === 'object' && r.ok !== false && r.colaboradora && r.colaboradora.id) {
      r.ajudaVideos = ajVideos_();
      r.minhasDuvidas = ajMinhas_(r.colaboradora.id);
    }
  } catch (e) {}
  return r;
};
