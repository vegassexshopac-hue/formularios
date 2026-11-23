/* ===== Black Vegas — 24 produtos por R$ 24 · www.lasvegassexshop.com.br =====
   Faixa com contagem regressiva no site, só na terça 24/11/2026 (00:00 às 23:59, horário do Acre).
   Fica no Portal (equipe.lasvegassexshop.com.br/site/blackvegas.js) e é chamada pelo roleta.js.
   Os preços de R$ 24 e a categoria /black-vegas-24/ são ligados e desligados pelo servidor (BV24.gs).
   Ver antes da hora: abra o site com ?blackvegas=teste (sair: ?blackvegas=sair).
   Para repetir em outra data: mudar INI, FIM e LINK aqui (e a lista no BV24.gs). */
(function () {
  if (window.__lvBlackVegas) return; window.__lvBlackVegas = true;
  var INI = Date.UTC(2026, 10, 24, 5, 0, 0);      // 24/11 00:00 no Acre (UTC−5)
  var FIM = Date.UTC(2026, 10, 25, 5, 0, 0);      // 25/11 00:00 no Acre
  var LINK = "/black-vegas-24/";
  var TESTE = (function () {
    try {
      var q = location.search;
      if (/[?&]blackvegas=teste/.test(q)) localStorage.setItem("lvbv_teste", "1");
      if (/[?&]blackvegas=sair/.test(q)) localStorage.removeItem("lvbv_teste");
      return localStorage.getItem("lvbv_teste") === "1";
    } catch (e) { return false; }
  })();
  function fim() { return TESTE && Date.now() < INI ? INI : FIM; }           // no teste antes do dia, o relógio conta até a abertura
  function ativa() { var n = Date.now(); return TESTE ? n < FIM : (n >= INI && n < FIM); }
  if (!ativa()) return;
  if (/checkout/.test(location.pathname)) return;

  var css = ""
    + ".lvbv{position:relative;overflow:hidden;background:linear-gradient(100deg,#0b0b0d 0%,#1d0508 55%,#4a0911 100%);color:#fff;font-family:Manrope,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;border-bottom:2px solid #E0162B}"
    + ".lvbv *{box-sizing:border-box}"
    + ".lvbv:before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.13) 50%,transparent 58%);transform:translateX(-100%);animation:lvbvBrilho 4s ease-in-out infinite;pointer-events:none}"
    + ".lvbv a.lvbv-in{position:relative;display:flex;align-items:center;justify-content:center;gap:14px 22px;flex-wrap:wrap;max-width:1200px;margin:0 auto;padding:10px 16px;color:#fff;text-decoration:none}"
    + ".lvbv-sel{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#E0162B;color:#fff;font-weight:900;font-size:13px;line-height:1;text-align:center;box-shadow:0 0 0 0 rgba(224,22,43,.7);animation:lvbvPulsa 1.6s ease-in-out infinite}"
    + ".lvbv-sel b{display:block;font-size:20px;letter-spacing:-1px}"
    + ".lvbv-tx{min-width:0;text-align:left}"
    + ".lvbv-tx strong{display:block;font-size:17px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#FFD23F}"
    + ".lvbv-tx span{display:block;font-size:13.5px;opacity:.92;margin-top:1px}"
    + ".lvbv-rel{display:flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums}"
    + ".lvbv-rel small{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-right:4px}"
    + ".lvbv-rel i{font-style:normal;display:grid;place-items:center;min-width:40px;padding:5px 6px 4px;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);font-weight:900;font-size:18px;line-height:1}"
    + ".lvbv-rel i em{display:block;font-style:normal;font-size:9px;font-weight:700;letter-spacing:.1em;opacity:.75;margin-top:3px}"
    + ".lvbv-bt{flex:none;display:inline-flex;align-items:center;height:38px;padding:0 18px;border-radius:999px;background:#FFD23F;color:#0b0b0d;font-weight:900;font-size:13.5px;letter-spacing:.04em;white-space:nowrap}"
    + ".lvbv.g a.lvbv-in{padding:20px 16px;gap:16px 30px}"
    + ".lvbv.g .lvbv-sel{width:76px;height:76px;font-size:15px}.lvbv.g .lvbv-sel b{font-size:30px}"
    + ".lvbv.g .lvbv-tx strong{font-size:26px}.lvbv.g .lvbv-tx span{font-size:15.5px}"
    + ".lvbv.g .lvbv-rel i{min-width:54px;font-size:26px;padding:8px 8px 6px}.lvbv.g .lvbv-bt{height:46px;font-size:15px;padding:0 24px}"
    + "@media (max-width:640px){.lvbv a.lvbv-in{gap:8px 12px;padding:9px 12px}.lvbv-sel{width:44px;height:44px;font-size:11px}.lvbv-sel b{font-size:17px}.lvbv-tx strong{font-size:14px;letter-spacing:.1em}.lvbv-tx span{font-size:12px}.lvbv-rel small{display:none}.lvbv-rel i{min-width:34px;font-size:15px}.lvbv-bt{height:32px;font-size:12px;padding:0 13px}"
    + ".lvbv.g a.lvbv-in{padding:14px 12px}.lvbv.g .lvbv-sel{width:58px;height:58px}.lvbv.g .lvbv-sel b{font-size:23px}.lvbv.g .lvbv-tx strong{font-size:18px}.lvbv.g .lvbv-tx span{font-size:13px}.lvbv.g .lvbv-rel i{min-width:42px;font-size:19px}.lvbv.g .lvbv-bt{height:38px;font-size:13px}}"
    + "@keyframes lvbvBrilho{0%,60%{transform:translateX(-100%)}100%{transform:translateX(100%)}}"
    + "@keyframes lvbvPulsa{0%,100%{box-shadow:0 0 0 0 rgba(224,22,43,.7)}50%{box-shadow:0 0 0 10px rgba(224,22,43,0)}}"
    + "@media (prefers-reduced-motion:reduce){.lvbv:before,.lvbv-sel{animation:none}}";

  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function montar() {
    if (document.getElementById("lvbv")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var p = location.pathname, grande = p === "/" || p.indexOf(LINK) === 0, naPagina = p.indexOf(LINK) === 0;
    var antes = TESTE && Date.now() < INI;
    var el = document.createElement("div");
    el.id = "lvbv"; el.className = "lvbv" + (grande ? " g" : "");
    el.innerHTML = '<a class="lvbv-in" href="' + LINK + '" aria-label="Black Vegas: 24 produtos por 24 reais, só hoje">'
      + '<span class="lvbv-sel"><span>R$<b>24</b></span></span>'
      + '<span class="lvbv-tx"><strong>🔥 Black Vegas</strong><span>24 produtos por <b>R$ 24</b> cada · ' + (antes ? "começa à meia-noite" : "só hoje, 24 horas") + '</span></span>'
      + '<span class="lvbv-rel"><small>' + (antes ? "Começa em" : "Termina em") + '</small><i><span id="lvbv-h">00</span><em>h</em></i><i><span id="lvbv-m">00</span><em>min</em></i><i><span id="lvbv-s">00</span><em>seg</em></i></span>'
      + (naPagina ? "" : '<span class="lvbv-bt">Ver os 24 →</span>')
      + '</a>';
    var head = document.querySelector("header.js-head-main, header");
    if (head && head.parentNode) head.parentNode.insertBefore(el, head.nextSibling); else document.body.insertBefore(el, document.body.firstChild);
    var H = document.getElementById("lvbv-h"), M = document.getElementById("lvbv-m"), S = document.getElementById("lvbv-s");
    function tique() {
      var falta = Math.floor((fim() - Date.now()) / 1000);
      if (falta <= 0) { if (!TESTE || Date.now() >= FIM) { el.parentNode && el.parentNode.removeChild(el); clearInterval(rel); return; } falta = 0; }
      H.textContent = dois(Math.floor(falta / 3600)); M.textContent = dois(Math.floor(falta % 3600 / 60)); S.textContent = dois(falta % 60);
    }
    var rel = setInterval(tique, 1000); tique();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
