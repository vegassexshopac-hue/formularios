/* ═══════════════════════════════════════════════════════════════
   LAS VEGAS SEX SHOP · PORTAL EQUIPE — AÇÕES LEVES (velocidade, etapa 1 · 11/11/2026)
   Duas ações novas que respondem rápido porque NÃO montam o pacote inteiro da colaboradora:
   • checarPin — só confere o PIN (equipe ou administração). Usada pelo motor da Kommo, pelas entregas
     e pelo comprovante para abrir a sessão (antes eles pediam "entrar"/"admDados" inteiros só para isso).
     Mesma regra de bloqueio por PIN errado do Código.gs (checarColab_ / checarAdmin_).
   • arena — o que a Arena da vendedora precisa a cada 30 s: vendas do mês (PDV + Kommo) e metas.
     Antes a Arena pedia o pacote inteiro (com o catálogo de produtos) a cada 30 s.
   Nenhuma regra muda. Nenhum arquivo existente é alterado.
   ───────────────────────────────────────────────────────────────
   COMO INSTALAR: Arquivos › + › Script › nome: LEVE — no FIM da lista (se houver PERF, o LEVE vem antes dele).
   Para desligar: apagar este arquivo e publicar Nova versão — o site e os serviços voltam sozinhos ao jeito antigo.
   ═══════════════════════════════════════════════════════════════ */

var _leveRodar = rodar_;
rodar_ = function (req) {
  var a = req && req.a;
  if (a === 'checarPin') {
    try {
      if (req.adminPin || req.adminPinHash) { checarAdmin_(req); return { ok: true, papel: 'admin' }; }
      var c = checarColab_(req);
      return { ok: true, papel: 'equipe', colaboradora: { id: c.id, nome: c.nome, loja: c.loja, cargo: c.cargo || '' } };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  if (a === 'arena') {
    try {
      checarColab_(req);
      try { if (typeof cx48AvisarAsVezes_ === 'function') cx48AvisarAsVezes_(); } catch (e1) {}   // como o "dados" fazia
      var hoje = hoje_(), ini = mesDe_(hoje) + '-01', kommo = [];
      try { if (typeof kmLinhasPdv_ === 'function') kommo = kmLinhasPdv_(ini); } catch (e2) {}
      return { ok: true, leve: 1, hoje: hoje, hora: hora_(), desde: ini, metas: painelMetas_(), vendas: pdvVendas_(ini, false), kommo: kommo };
    } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  }
  return _leveRodar.apply(this, arguments);
};
