/* ===== Roleta de Natal · Las Vegas Sex Shop · www.lasvegassexshop.com.br (v63 · 23/11/2026 · gira na hora do clique, visual cassino + Natal) =====
   Fica hospedada no Portal (equipe.lasvegassexshop.com.br/site/roleta.js).
   A Nuvemshop só tem um "carregador" em Configurações › Códigos externos — para mudar a roleta, edite ESTE arquivo.
   Liga / desliga / teste: Portal › Administração › Roleta do site (lá também fica a lista de quem girou).
   Modo teste: abra o site com ?roleta=teste (sair: ?roleta=sair).
   O sorteio e o cupom são do SERVIDOR (ponto/servidor/ROLETA_SITE.gs): cada giro cria um cupom único na Nuvemshop,
   válido por 24 h, 1 uso, que SOMA com outras promoções (decisão da Madu em 23/11). 1 giro por WhatsApp.
*/
/* Textos do site que ainda dizem 21/11 (barra do topo, aviso do Pix na página do produto e faixa "termina sábado"): a promoção foi estendida
   até 30/11 (pedido da Madu em 23/11/2026). Troca só o texto, na tela. O definitivo é mudar em Nuvemshop › Loja online › Layout › Editar layout atual › barra de anúncio — aí este trecho pode sair. */
(function () {
  function novo(t) {
    return t.replace(/termina s[áa]bado,?\s*21\/11/gi, "termina segunda, 30/11")
            .replace(/s[óo] at[ée] s[áa]bado,?\s*21\/11/gi, "só até 30/11")
            .replace(/at[ée] s[áa]bado,?\s*21\/11/gi, "até 30/11")
            .replace(/at[ée] 21\/11/gi, "até 30/11");
  }
  function troca() {
    try {
      var l = document.querySelectorAll(".js-topbar a, .section-topbar a");          // barra do topo
      for (var i = 0; i < l.length; i++) if (/21\/11/.test(l[i].textContent)) l[i].textContent = novo(l[i].textContent);
      var st = document.querySelectorAll("style");                                     // avisos escritos no CSS do layout (página do produto e faixa "termina sábado")
      for (var j = 0; j < st.length; j++) if (/21\/11/.test(st[j].textContent)) st[j].textContent = novo(st[j].textContent);
    } catch (e) {}
  }
  troca(); document.addEventListener("DOMContentLoaded", troca); setTimeout(troca, 1200); setTimeout(troca, 4000);
})();
/* Black Vegas — 24 por R$ 24 (terça 24/11/2026): a faixa com contagem regressiva fica em site/blackvegas.js e só aparece no dia. */
(function () {
  try {
    if (Date.now() < Date.UTC(2026, 10, 25, 5, 0, 0)) {
      var s = document.createElement("script");
      s.src = "https://equipe.lasvegassexshop.com.br/site/blackvegas.js?v=" + Math.floor(Date.now() / 9e5);
      s.async = true; document.head.appendChild(s);
    }
  } catch (e) {}
})();
(function () {
  var CFG = {
    whatsapp: "5568992822275",
    delayMs: 8000,           // abre sozinha depois de 8s
    repeatDays: 7,           // não reaparece por 7 dias pra quem fechou
    // k = chave do prêmio no servidor (ROLETA_SITE.gs). As chances ficam no servidor.
    prizes: [
      { k: "p5",     label: "5% OFF",        text: "5% de desconto" },
      { k: "p7",     label: "7% OFF",        text: "7% de desconto" },
      { k: "vale50", label: "VALE R$ 50",    text: "R$ 50 de desconto" },
      { k: "denovo", label: "TENTE DE NOVO", text: "mais um giro" },
      { k: "p10",    label: "10% OFF",       text: "10% de desconto" }
    ],
    // ordem das fatias na roda (índices de prizes)
    wheel: [0, 1, 2, 0, 3, 1, 4, 2]
  };

  var API = "https://script.google.com/macros/s/AKfycbw_rhPwaL7Xj-Bxcc5QiLUR2kbrNy8KDdUh7V58mi0FM9UUjE32WbAcTSEuUlfeMmpX/exec";
  if (window.__lvrRoleta) return; window.__lvrRoleta = true;
  var PREVIEW = !!window.LVR_DEMO;
  var TESTER = (function () {
    try {
      var q = location.search;
      if (/[?&]roleta=teste/.test(q)) localStorage.setItem("lvr_teste", "1");
      if (/[?&]roleta=sair/.test(q)) localStorage.removeItem("lvr_teste");
      return localStorage.getItem("lvr_teste") === "1";
    } catch (e) { return false; }
  })();
  var DEMO = PREVIEW || TESTER;
  var KEY = "lvr_natal_v1";
  function store(get, val) {
    try { if (get) return JSON.parse(localStorage.getItem(KEY) || "{}"); localStorage.setItem(KEY, JSON.stringify(val)); } catch (e) { return {}; }
  }
  if (!PREVIEW && /checkout|account/.test(location.pathname)) return;

  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,600;1,6..96,800&family=Manrope:wght@400;600;800&display=swap";
  document.head.appendChild(font);

  var css = "\
.lvr-ov{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 35%,rgba(90,8,20,.72),rgba(5,3,3,.92) 70%);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;transition:opacity .3s}\
.lvr-ov.on{opacity:1}\
.lvr-box{position:relative;width:100%;max-width:430px;max-height:calc(100vh - 28px);overflow:auto;overflow-x:hidden;background:radial-gradient(120% 70% at 50% 0%,#5a0913 0%,#22060b 42%,#0b0606 100%);color:#f6efe6;border:2px solid #f5c518;border-radius:22px;padding:30px 20px 20px;font-family:Manrope,system-ui,sans-serif;box-shadow:0 0 0 5px rgba(245,197,24,.12),0 0 46px rgba(245,197,24,.28),0 30px 90px rgba(227,23,43,.5);transform:translateY(30px) scale(.9);transition:transform .5s cubic-bezier(.2,1.3,.35,1)}\
.lvr-ov.on .lvr-box{transform:none}\
.lvr-box>*{position:relative}\
.lvr-neve{position:absolute!important;inset:0;overflow:hidden;pointer-events:none;border-radius:20px}\
.lvr-neve i{position:absolute;top:-12px;width:5px;height:5px;border-radius:50%;background:#fff;opacity:.75;animation:lvrCai linear infinite}\
@keyframes lvrCai{to{transform:translate(18px,760px)}}\
.lvr-luzes{position:absolute!important;top:5px;left:22px;right:22px;display:flex;justify-content:space-between;pointer-events:none}\
.lvr-luzes i{width:8px;height:8px;border-radius:50%;animation:lvrPisca 1.3s ease-in-out infinite}\
.lvr-luzes i:nth-child(4n+1){background:#ff3348;color:#ff3348}\
.lvr-luzes i:nth-child(4n+2){background:#ffd84a;color:#ffd84a;animation-delay:.32s}\
.lvr-luzes i:nth-child(4n+3){background:#3ee07a;color:#3ee07a;animation-delay:.64s}\
.lvr-luzes i:nth-child(4n){background:#fff;color:#fff;animation-delay:.96s}\
@keyframes lvrPisca{0%,100%{opacity:.35;box-shadow:0 0 0 currentColor}50%{opacity:1;box-shadow:0 0 10px 2px currentColor}}\
.lvr-x{position:absolute!important;top:14px;right:10px;background:rgba(0,0,0,.35);border:0;border-radius:50%;width:32px;height:32px;color:#e9dccf;font-size:22px;line-height:1;cursor:pointer;padding:0;z-index:5}\
.lvr-eye{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#ffd84a;text-align:center;font-weight:800;text-shadow:0 0 12px rgba(245,197,24,.7)}\
.lvr-h{font-family:'Bodoni Moda',Georgia,serif;font-style:italic;font-weight:800;font-size:clamp(23px,7vw,32px);line-height:1.05;text-align:center;margin:6px 0 4px;background:linear-gradient(100deg,#f5c518 0%,#fff6c4 25%,#f5c518 50%,#fff6c4 75%,#f5c518 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#f5c518;animation:lvrBrilho 3.2s linear infinite;filter:drop-shadow(0 2px 10px rgba(245,197,24,.35))}\
@keyframes lvrBrilho{to{background-position:-200% 0}}\
.lvr-sub{text-align:center;font-size:14px;color:#e2d5c8;margin:0 0 12px}\
.lvr-sub b{color:#ffd84a}\
.lvr-wrap{position:relative;width:min(310px,80vw,42vh);aspect-ratio:1;margin:0 auto 16px;border-radius:50%;background:radial-gradient(circle,#2a0509 60%,#12080a 100%);box-shadow:0 0 0 3px #f5c518,0 0 0 6px #7a5a05,0 0 34px rgba(245,197,24,.45),0 14px 34px rgba(0,0,0,.7);animation:lvrAura 2.4s ease-in-out infinite}\
@keyframes lvrAura{50%{box-shadow:0 0 0 3px #ffe37a,0 0 0 6px #7a5a05,0 0 58px rgba(245,197,24,.75),0 14px 34px rgba(0,0,0,.7)}}\
.lvr-wrap canvas{position:absolute;inset:6.5%;width:87%;height:87%;display:block;border-radius:50%;will-change:transform}\
.lvr-bulb{position:absolute;width:3.6%;height:3.6%;margin:-1.8% 0 0 -1.8%;border-radius:50%;background:#fff3b8;box-shadow:0 0 8px 2px #ffd84a;animation:lvrLuz 1s steps(1) infinite;z-index:1}\
.lvr-bulb.b{animation-delay:.5s}\
.lvr-wrap.girando .lvr-bulb{animation-duration:.24s}\
.lvr-wrap.girando .lvr-bulb.b{animation-delay:.12s}\
.lvr-wrap.ganhou .lvr-bulb{animation-duration:.16s;background:#fff}\
@keyframes lvrLuz{0%{opacity:1}50%{opacity:.22;box-shadow:none}}\
.lvr-pin{position:absolute;top:-3.5%;left:50%;width:11%;height:15%;margin-left:-5.5%;transform-origin:50% 18%;z-index:3;filter:drop-shadow(0 4px 4px rgba(0,0,0,.7))}\
.lvr-pin:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#fff3b0,#f5c518 45%,#b8860b);clip-path:polygon(50% 100%,0 28%,12% 6%,50% 0,88% 6%,100% 28%)}\
.lvr-pin:after{content:'';position:absolute;left:32%;top:14%;width:36%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a96,#e3172b 55%,#7d0613)}\
.lvr-hub{position:absolute;inset:38.5%;border-radius:50%;border:0;padding:0;cursor:pointer;z-index:2;background:radial-gradient(circle at 35% 28%,#fff6c4,#f5c518 42%,#a87708 100%);box-shadow:0 0 0 4px #1a0a05,0 0 0 6px #f5c518,0 6px 14px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:800 clamp(11px,3.2vw,14px) Manrope,system-ui,sans-serif;letter-spacing:.08em;color:#3a0608;text-transform:uppercase;animation:lvrBate 1.3s ease-in-out infinite}\
@keyframes lvrBate{50%{transform:scale(1.08)}}\
.lvr-wrap.girando .lvr-hub{animation:none;cursor:default}\
.lvr-f{display:grid;gap:9px}\
.lvr-f input[type=text],.lvr-f input[type=tel]{width:100%;box-sizing:border-box;background:rgba(0,0,0,.45);border:1px solid #6b4a12;color:#fff;border-radius:12px;padding:12px 14px;font:inherit;font-size:16px}\
.lvr-f input::placeholder{color:#a8998c}\
.lvr-f input:focus{outline:2px solid #f5c518;outline-offset:1px}\
.lvr-ck{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#cbbdb0;line-height:1.35}\
.lvr-ck input{margin-top:2px;accent-color:#e3172b}\
.lvr-btn{position:relative;overflow:hidden;display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border:0;border-radius:999px;padding:15px;font:800 15px Manrope,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;background:linear-gradient(180deg,#ff3b4f,#c8101e);color:#fff;box-shadow:0 5px 0 #7d0613,0 10px 24px rgba(227,23,43,.5);transition:transform .12s,box-shadow .12s,filter .12s}\
.lvr-btn:hover{filter:brightness(1.1);color:#fff}\
.lvr-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #7d0613}\
.lvr-btn:disabled{filter:saturate(.5) brightness(.8);cursor:default}\
.lvr-btn.ouro{background:linear-gradient(180deg,#ffe37a,#f5c518 55%,#d49b06);color:#3a0608;box-shadow:0 5px 0 #8a6205,0 10px 26px rgba(245,197,24,.45);animation:lvrChama 1.6s ease-in-out infinite}\
.lvr-btn.ouro:active{box-shadow:0 2px 0 #8a6205}\
.lvr-btn.ouro:disabled{animation:none}\
@keyframes lvrChama{50%{transform:scale(1.025)}}\
.lvr-btn.ouro:after,.lvr-btn.vai:after{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-20deg);animation:lvrVarre 2.2s ease-in-out infinite}\
@keyframes lvrVarre{0%{left:-60%}55%,100%{left:130%}}\
.lvr-btn.alt{background:linear-gradient(180deg,#3fe07d,#1fb457);color:#06260f;box-shadow:0 5px 0 #0e7a36}\
.lvr-btn.ghost{background:transparent;border:1px solid #6b4a12;color:#e2d5c8;font-size:13px;box-shadow:none;padding:12px}\
.lvr-err{color:#ff9a9a;font-size:12.5px;min-height:1em;margin:0;text-align:center}\
.lvr-res{text-align:center;display:grid;gap:11px;animation:lvrSobe .5s cubic-bezier(.2,1.3,.35,1) both}\
@keyframes lvrSobe{from{opacity:0;transform:translateY(18px) scale(.94)}}\
.lvr-prize{font-family:'Bodoni Moda',Georgia,serif;font-style:italic;font-weight:800;font-size:52px;line-height:1;margin:2px 0;background:linear-gradient(100deg,#f5c518,#fff6c4 30%,#f5c518 60%,#fff6c4 90%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#f5c518;animation:lvrBrilho 2.4s linear infinite,lvrPop .7s cubic-bezier(.2,1.6,.35,1) both;filter:drop-shadow(0 0 18px rgba(245,197,24,.55))}\
@keyframes lvrPop{from{transform:scale(.3) rotate(-8deg);opacity:0}}\
.lvr-code{display:inline-block;border:2px dashed #f5c518;border-radius:12px;padding:10px 20px;font:800 22px/1 Manrope,monospace;letter-spacing:.14em;color:#fff;margin:0 auto;user-select:all;background:rgba(0,0,0,.4);box-shadow:0 0 22px rgba(245,197,24,.3)}\
.lvr-clock{display:inline-flex;align-items:center;gap:8px;margin:0 auto;background:rgba(0,0,0,.45);border:1px solid #c8101e;border-radius:999px;padding:7px 14px;font:800 13px Manrope,system-ui,sans-serif;color:#ffd9d9;letter-spacing:.03em}\
.lvr-clock b{font-variant-numeric:tabular-nums;color:#fff;font-size:15px}\
.lvr-min{margin:0 auto;background:#3a2a05;border:1px solid #f5c518;color:#ffe9a8;border-radius:10px;padding:7px 12px;font:600 13px Manrope,system-ui,sans-serif}\
.lvr-min b{color:#fff}\
.lvr-fine{font-size:11.5px;color:#a8998c;margin:2px 0 0}\
.lvr-test{position:absolute!important;top:18px;left:14px;background:#f5c518;color:#140f0f;font:800 10.5px Manrope,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 10px;z-index:4}\
.lvr-conf{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483001}\
.lvr-fab{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147482999;background:linear-gradient(180deg,#5a0913,#1a0508);color:#ffd84a;border:2px solid #f5c518;border-radius:999px;padding:11px 17px;font:800 13px Manrope,system-ui,sans-serif;letter-spacing:.05em;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);animation:lvrPulse 2s infinite}\
@keyframes lvrPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,197,24,.55),0 8px 24px rgba(0,0,0,.45)}50%{box-shadow:0 0 0 12px rgba(245,197,24,0),0 8px 24px rgba(0,0,0,.45)}}\
@media (prefers-reduced-motion:reduce){.lvr-neve,.lvr-conf{display:none}.lvr-box *,.lvr-fab,.lvr-wrap{animation:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function limpo(s) { return String(s == null ? "" : s).replace(/[<>&"']/g, ""); }
  function premioDe(k) { for (var i = 0; i < CFG.prizes.length; i++) if (CFG.prizes[i].k === k) return i; return 0; }

  var COR = {   // cada prêmio tem a sua cor na roda: [centro, borda, texto]
    p5: ["#ff4257", "#9c0a18", "#ffffff"], p7: ["#1f9a52", "#0a3f20", "#ffffff"], p10: ["#ff4257", "#9c0a18", "#fff3b0"],
    vale50: ["#fff3b0", "#e0a906", "#3a0608"], denovo: ["#2a2222", "#060404", "#ffd84a"]
  };
  function drawWheel(canvas) {
    var n = CFG.wheel.length, size = 640, c = canvas.getContext("2d");
    canvas.width = canvas.height = size;
    var r = size / 2, a = (Math.PI * 2) / n, R = r - 14;
    for (var i = 0; i < n; i++) {
      var s = -Math.PI / 2 + i * a, pz = CFG.prizes[CFG.wheel[i]], cor = COR[pz.k] || COR.p5;
      var g = c.createRadialGradient(r, r, r * 0.25, r, r, R); g.addColorStop(0, cor[0]); g.addColorStop(1, cor[1]);
      c.beginPath(); c.moveTo(r, r); c.arc(r, r, R, s, s + a); c.closePath();
      c.fillStyle = g; c.fill();
      c.strokeStyle = "#f5c518"; c.lineWidth = 4; c.stroke();
      c.save(); c.translate(r, r); c.rotate(s + a / 2);
      c.textAlign = "right"; c.textBaseline = "middle";
      var lb = pz.label;
      c.font = "800 " + (lb.length > 11 ? 19 : lb.length > 8 ? 26 : 34) + "px Manrope, system-ui, sans-serif";
      c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = cor[2] === "#3a0608" ? 0 : 6; c.shadowOffsetY = 2;
      c.fillStyle = cor[2]; c.fillText(lb, R - 26, 0);
      c.restore();
    }
    var aro = c.createLinearGradient(0, 0, size, size);             // aro dourado
    aro.addColorStop(0, "#fff3b0"); aro.addColorStop(0.35, "#f5c518"); aro.addColorStop(0.65, "#a87708"); aro.addColorStop(1, "#ffe37a");
    c.beginPath(); c.arc(r, r, R + 4, 0, Math.PI * 2); c.strokeStyle = aro; c.lineWidth = 16; c.stroke();
    for (var k = 0; k < n; k++) {                                   // pinos entre as fatias
      var ang = -Math.PI / 2 + k * a;
      c.beginPath(); c.arc(r + Math.cos(ang) * (R + 4), r + Math.sin(ang) * (R + 4), 7, 0, Math.PI * 2);
      c.fillStyle = "#fff"; c.shadowColor = "#000"; c.shadowBlur = 4; c.fill(); c.shadowBlur = 0;
    }
  }

  /* chuva de confete e moedas quando sai o prêmio */
  function confete() {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var cv = el("canvas", "lvr-conf"), c = cv.getContext("2d"), W = cv.width = innerWidth, H = cv.height = innerHeight;
      document.body.appendChild(cv);
      var cores = ["#f5c518", "#ffe37a", "#e3172b", "#ff5b6b", "#1f9a52", "#ffffff"], ps = [];
      for (var i = 0; i < 140; i++) {
        var lado = i % 2 ? -1 : 1, moeda = i % 4 === 0;
        ps.push({ x: W / 2 + lado * Math.random() * 60, y: H * 0.42, vx: lado * (2 + Math.random() * 9), vy: -(7 + Math.random() * 11), g: 0.32 + Math.random() * 0.12,
                  t: Math.random() * 6, vt: (Math.random() - 0.5) * 0.4, w: moeda ? 13 : 6 + Math.random() * 7, h: moeda ? 13 : 9 + Math.random() * 8, m: moeda, c: moeda ? "#f5c518" : cores[i % cores.length] });
      }
      var ini = performance.now();
      (function passo(ts) {
        var vida = (ts - ini) / 2800;
        if (vida >= 1) { cv.remove(); return; }
        c.clearRect(0, 0, W, H); c.globalAlpha = vida > 0.7 ? (1 - vida) / 0.3 : 1;
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i]; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.t += p.vt;
          c.save(); c.translate(p.x, p.y); c.rotate(p.t); c.scale(1, Math.abs(Math.cos(p.t * 2.2)) * 0.8 + 0.2);
          c.fillStyle = p.c;
          if (p.m) { c.beginPath(); c.arc(0, 0, p.w / 2, 0, 6.3); c.fill(); c.lineWidth = 2; c.strokeStyle = "#a87708"; c.stroke(); }
          else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          c.restore();
        }
        requestAnimationFrame(passo);
      })(ini);
      if (navigator.vibrate) navigator.vibrate([50, 40, 110]);
    } catch (e) {}
  }

  /* fatia da roda que mostra o prêmio sorteado pelo servidor */
  function sliceDe(pIdx) {
    var slots = [];
    CFG.wheel.forEach(function (p, idx) { if (p === pIdx) slots.push(idx); });
    return slots.length ? slots[Math.floor(Math.random() * slots.length)] : 0;
  }

  /* pede o giro ao servidor (POST simples: nome e WhatsApp vão no corpo, nunca no endereço) */
  function girarNoServidor(nome, zap, aceita) {
    if (PREVIEW) {
      var i = Math.floor(Math.random() * CFG.prizes.length), p = CFG.prizes[i];
      return Promise.resolve({ ok: true, k: p.k, premio: p.label, tipo: p.noCart ? "brinde" : "percentage", codigo: "NATALDEMO", vence: Date.now() + 864e5, agora: Date.now(), status: "aberto", minimo: p.k === "vale50" ? 250 : 0, horas: p.k === "vale50" ? 720 : 24, ja: false, denovo: p.k === "denovo" });
    }
    return fetch(API, { method: "POST", body: JSON.stringify({ a: "roletaSite", op: "girar", nome: nome, tel: zap, maior: 1, aceita: aceita ? 1 : 0, teste: TESTER ? 1 : 0 }) })
      .then(function (r) { return r.json(); });
  }

  var ov, relogio;
  function close() {
    if (!ov) return;
    ov.classList.remove("on");
    var o = ov; ov = null;
    clearInterval(relogio);
    setTimeout(function () { o.remove(); }, 300);
    var s = store(true) || {}; if (!s.won) { s.closedAt = Date.now(); store(false, s); }
    showFab();
  }
  function ganhoVivo() { var s = store(true) || {}; return s.won && s.won.vence > Date.now() ? s.won : null; }

  function open() {
    if (ov) return;
    var fab = document.querySelector(".lvr-fab"); if (fab) fab.remove();
    ov = el("div", "lvr-ov");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Roleta de Natal");
    var box = el("div", "lvr-box");
    var x = el("button", "lvr-x", "&times;"); x.setAttribute("aria-label", "Fechar"); x.onclick = close;
    box.appendChild(x);
    var neve = el("div", "lvr-neve"), nh = "";
    for (var ni = 0; ni < 16; ni++) nh += '<i style="left:' + Math.round(Math.random() * 96) + '%;width:' + (3 + ni % 3) + 'px;height:' + (3 + ni % 3) + 'px;animation-duration:' + (5 + Math.random() * 6).toFixed(1) + 's;animation-delay:-' + (Math.random() * 9).toFixed(1) + 's"></i>';
    neve.innerHTML = nh; box.appendChild(neve);
    box.appendChild(el("div", "lvr-luzes", new Array(14).join("<i></i>")));
    if (TESTER) { box.style.paddingTop = "52px"; box.appendChild(el("div", "lvr-test", "🧪 Modo teste · só você vê")); }

    var vivo = ganhoVivo();
    if (vivo && !DEMO) { box.appendChild(result(vivo)); }
    else {
      box.appendChild(el("div", "lvr-eye", "🎰 Natal Las Vegas 🎄"));
      box.appendChild(el("h2", "lvr-h", "Gire e ganhe seu presente"));
      box.appendChild(el("p", "lvr-sub", "Todo mundo ganha. <b>Vale hoje</b>, direto no site."));
      var wrap = el("div", "lvr-wrap");
      var cv = el("canvas"); drawWheel(cv);
      var pin = el("div", "lvr-pin");
      var hub = el("button", "lvr-hub", "Girar"); hub.type = "button"; hub.setAttribute("aria-label", "Girar a roleta");
      for (var bi = 0; bi < 20; bi++) {          // lâmpadas em volta da roda
        var bu = el("i", "lvr-bulb" + (bi % 2 ? " b" : "")), ba = bi * Math.PI / 10;
        bu.style.left = (50 + Math.cos(ba) * 46.6) + "%"; bu.style.top = (50 + Math.sin(ba) * 46.6) + "%";
        wrap.appendChild(bu);
      }
      wrap.appendChild(cv); wrap.appendChild(pin); wrap.appendChild(hub);
      box.appendChild(wrap);

      var f = el("form", "lvr-f");
      f.innerHTML = '<input id="lvr-nome" type="text" autocomplete="given-name" maxlength="30" placeholder="Seu primeiro nome" required>' +
        '<input id="lvr-zap" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="WhatsApp com DDD — (68) 9…" required>' +
        '<label class="lvr-ck"><input id="lvr-18" type="checkbox"> Tenho 18 anos ou mais</label>' +
        '<label class="lvr-ck"><input id="lvr-ok" type="checkbox" checked> Aceito receber novidades da Las Vegas no WhatsApp, com discrição</label>' +
        '<p class="lvr-err" id="lvr-err"></p>' +
        '<button class="lvr-btn ouro" type="submit">🎁 Girar a roleta</button>';
      box.appendChild(f);
      hub.onclick = function () { if (f.requestSubmit) f.requestSubmit(); else f.querySelector("button").click(); };

      /* --- motor da roda: começa a girar NA HORA do clique e freia na fatia certa quando o servidor responde --- */
      var NF = CFG.wheel.length, GRAU = 360 / NF, VMAX = 640, PARADO = matchMedia("(prefers-reduced-motion: reduce)").matches;
      var ang = 0, vel = 0, fase = 0, ult = 0, t0 = 0, a0 = 0, DIST = 0, DUR = 0, aoParar = null, fatia = 0, ultTic = 0, inicio = 0;
      function pinta(ts) {
        cv.style.transform = "rotate(" + ang + "deg)";
        var fa = Math.floor(ang / GRAU);
        if (fa !== fatia) {                      // o ponteiro "bate" em cada pino que passa
          fatia = fa;
          if (ts - ultTic > 70 && pin.animate) { ultTic = ts; pin.animate([{ transform: "rotate(-22deg)" }, { transform: "rotate(0deg)" }], { duration: 130, easing: "ease-out" }); }
        }
      }
      function quadro(ts) {
        if (!ov || !fase) return;
        var dt = Math.min(0.05, (ts - ult) / 1000); ult = ts;
        if (fase === 1) { vel = Math.min(VMAX, vel + VMAX * dt / 0.3); ang += vel * dt; }
        else {
          var p = Math.min(1, (ts - t0) / DUR); ang = a0 + DIST * (1 - (1 - p) * (1 - p));
          if (p >= 1) { fase = 0; pinta(ts); wrap.classList.remove("girando"); var fn = aoParar; aoParar = null; if (fn) fn(); return; }
        }
        pinta(ts); requestAnimationFrame(quadro);
      }
      function girar() {
        inicio = performance.now(); wrap.classList.remove("ganhou");
        if (PARADO || fase) return;
        fase = 1; vel = 0; ult = inicio; wrap.classList.add("girando"); requestAnimationFrame(quadro);
      }
      function frear(dist, fn) {                 // freia suave percorrendo "dist" graus
        if (PARADO || !fase) { ang += dist; cv.style.transform = "rotate(" + ang + "deg)"; fase = 0; wrap.classList.remove("girando"); setTimeout(fn, 250); return; }
        var v = Math.max(vel, 320);
        a0 = ang; DIST = dist; DUR = 2000 * dist / v; t0 = performance.now(); aoParar = fn; fase = 2;
      }
      function pararNa(slice, fn) {              // para com a fatia "slice" embaixo do ponteiro
        var alvo = 360 - (slice * GRAU + GRAU / 2) + (Math.random() - 0.5) * GRAU * 0.6;
        var atual = ((ang % 360) + 360) % 360, d = (((alvo - atual) % 360) + 360) % 360;
        frear(d + 720, fn);
      }
      function depoisDoEmbalo(fn) { setTimeout(function () { if (ov) fn(); }, Math.max(0, 900 - (performance.now() - inicio))); }   // deixa a roda pegar embalo antes de frear

      f.onsubmit = function (ev) {
        ev.preventDefault();
        if (fase) return;
        var nome = f.querySelector("#lvr-nome").value.trim();
        var zap = f.querySelector("#lvr-zap").value.replace(/\D/g, "");
        var err = f.querySelector("#lvr-err");
        err.style.color = "";
        if (!nome) { err.textContent = "Coloca seu nome pra gente te chamar certinho."; return; }
        if (zap.length < 10 || zap.length > 13) { err.textContent = "Confere o WhatsApp: DDD + número, ex. 68 99999-9999."; return; }
        if (!f.querySelector("#lvr-18").checked) { err.textContent = "A roleta é só para maiores de 18 anos."; return; }
        err.textContent = "";
        var btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Girando… 🎰"; hub.textContent = "★";
        girar();                                 // gira já, sem esperar o servidor
        var libera = function (rotulo) { btn.disabled = false; btn.textContent = rotulo; hub.textContent = "Girar"; };
        var falhou = function (msg) {
          depoisDoEmbalo(function () { frear(300, function () { libera("🎁 Girar a roleta"); err.textContent = msg || "Não deu certo agora. Tente de novo em instantes."; }); });
        };
        girarNoServidor(nome, zap, f.querySelector("#lvr-ok").checked).then(function (j) {
          if (!ov) return;
          if (!j || !j.ok) return falhou(j && j.erro);
          var pIdx = premioDe(j.k);
          if (j.denovo) {                        // "Tente de novo": a roda para na fatia e a cliente gira mais uma vez (no 2º giro sempre sai prêmio)
            return depoisDoEmbalo(function () {
              pararNa(sliceDe(pIdx), function () {
                if (!ov) return;
                libera("🎁 Girar de novo");
                err.style.color = "#ffd84a"; err.textContent = "Quase! Você ganhou mais um giro. Toque em Girar de novo.";
              });
            });
          }
          var won = { k: j.k, codigo: j.codigo, premio: j.premio, minimo: j.minimo || 0, name: nome, ja: !!j.ja, status: j.status, noCart: j.tipo === "brinde",
                      horas: Number(j.horas) || 24, vence: Date.now() + (Number(j.vence) - Number(j.agora)), at: Date.now() };
          var mostra = function () {
            if (!ov) return;
            if (!DEMO) { var data = store(true) || {}; data.won = won; store(false, data); }
            if (window.dataLayer) window.dataLayer.push({ event: "roleta_giro", premio: won.k });
            box.querySelectorAll(".lvr-eye,.lvr-h,.lvr-sub,.lvr-wrap,.lvr-f").forEach(function (n) { n.remove(); });
            box.appendChild(result(won));
          };
          if (won.ja) return depoisDoEmbalo(function () { frear(300, mostra); });   // já tinha girado: mostra logo o presente dela
          depoisDoEmbalo(function () {
            pararNa(sliceDe(pIdx), function () {
              if (!ov) return;
              wrap.classList.add("ganhou"); confete();
              setTimeout(mostra, PARADO ? 0 : 850);
            });
          });
        }).catch(function () { falhou("Sem conexão agora. Confere a internet e tente de novo."); });
      };
    }

    ov.appendChild(box);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov && ov.classList.add("on"); });
  }

  function falta(ms) {
    if (ms <= 0) return "00:00:00";
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x;
  }
  function ateQuando(ms) {
    var d = new Date(ms), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " às " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function result(w) {
    var p = CFG.prizes[premioDe(w.k)], nome = limpo(w.name), cod = limpo(w.codigo), r = el("div", "lvr-res");
    var vencido = w.vence <= Date.now(), usado = w.status === "usado";
    var zap = function (msg, rotulo) { return '<a class="lvr-btn alt" target="_blank" rel="noopener" href="https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg) + '">' + rotulo + '</a>'; };
    if (usado || vencido) {
      r.innerHTML =
        '<div class="lvr-eye">' + (nome ? nome + ", " : "") + (usado ? "você já usou seu presente 🎁" : "seu presente venceu ⏳") + '</div>' +
        '<div class="lvr-prize">' + limpo(w.premio || p.label) + '</div>' +
        '<p class="lvr-sub" style="margin:0">' + (usado ? "Cada WhatsApp ganha um giro. Obrigada por comprar com a gente!" : "O prazo do cupom acabou. Fala com a gente no WhatsApp que a equipe te ajuda.") + '</p>' +
        zap("Oi! Aqui é " + w.name + " ✨ Girei a Roleta de Natal no site e queria uma ajuda.", "Falar com a loja") +
        '<button class="lvr-btn ghost" type="button">Continuar comprando</button>';
      r.querySelector(".ghost").onclick = close;
      return r;
    }
    var longo = (w.horas || 24) > 48;      // vale-compra de 30 dias: mostra a data em vez do relógio
    var msg = "Oi! Aqui é " + w.name + " ✨ Girei a Roleta de Natal no site e ganhei *" + (w.premio || p.label) + "*. Meu código: *" + w.codigo + "* (vale até " + ateQuando(w.vence) + (!w.noCart && w.minimo > 0 ? ", em compras acima de R$ " + String(w.minimo).replace(".", ",") : "") + ")";
    var regra = w.noCart ? "Resgate pelo WhatsApp em até 24 horas."
      : "Vale por " + (longo ? Math.round((w.horas || 24) / 24) + " dias" : "24 horas") + " · 1 uso · vale também em produtos em promoção.";
    var aviso = !w.noCart && w.minimo > 0 ? '<div class="lvr-min">⚠️ Vale em compras <b>acima de R$ ' + String(w.minimo).replace(".", ",") + '</b></div>' : "";
    r.innerHTML =
      '<div class="lvr-eye">🎁 ' + (nome ? nome + ", " : "") + (w.ja ? "você já girou. Seu presente:" : "você ganhou") + '</div>' +
      '<div class="lvr-prize">' + limpo(w.premio || p.label) + '</div>' +
      '<p class="lvr-sub" style="margin:0">' + (w.noCart ? "Seu código para resgatar " + p.text + ":" : "Seu cupom de " + p.text + ":") + '</p>' +
      '<div class="lvr-code">' + cod + '</div>' +
      aviso +
      (longo ? '<div class="lvr-clock">⏳ Vale até <b>' + ateQuando(w.vence).split(" às ")[0] + '</b></div>'
             : '<div class="lvr-clock">⏳ Acaba em <b class="lvr-t">' + falta(w.vence - Date.now()) + '</b></div>') +
      (w.noCart ? "" : '<a class="lvr-btn ouro" href="/discount/' + encodeURIComponent(w.codigo) + '">Usar agora no carrinho</a>') +
      zap(msg, w.noCart ? "Resgatar brinde no WhatsApp" : "Guardar no meu WhatsApp") +
      '<button class="lvr-btn ghost" type="button">Continuar comprando</button>' +
      '<p class="lvr-fine">' + regra + ' Embalagem 100% discreta, sempre.</p>';
    r.querySelector(".ghost").onclick = close;
    clearInterval(relogio);
    relogio = setInterval(function () {
      var t = r.querySelector(".lvr-t"); if (!document.body.contains(r)) { clearInterval(relogio); return; }
      if (!t) { if (w.vence <= Date.now()) { clearInterval(relogio); var nv = result(w); r.parentNode && r.parentNode.replaceChild(nv, r); } return; }
      var ms = w.vence - Date.now(); t.textContent = falta(ms);
      if (ms <= 0) { clearInterval(relogio); var novo = result(w); r.parentNode && r.parentNode.replaceChild(novo, r); }
    }, 1000);
    return r;
  }

  function showFab() {
    if (document.querySelector(".lvr-fab")) return;
    var vivo = ganhoVivo(), s = store(true) || {};
    if (!TESTER && s.won && !vivo) return;                      // já girou e venceu: não insiste
    var b = el("button", "lvr-fab", TESTER ? "🧪 Roleta (teste)" : vivo ? "🎁 Seu presente de Natal" : "🎄 Gire e ganhe");
    b.type = "button"; b.onclick = open;
    document.body.appendChild(b);
  }

  window.LVR_OPEN = open;
  function modo(cb) {
    try {
      var c = JSON.parse(sessionStorage.getItem("lvr_modo") || "null");
      if (c && !TESTER && Date.now() - c.t < 300000) return cb(c.m);
    } catch (e) {}
    var feito = false, fim = function (m) { if (feito) return; feito = true; try { sessionStorage.setItem("lvr_modo", JSON.stringify({ m: m, t: Date.now() })); } catch (e) {} cb(m); };
    setTimeout(function () { fim("desligada"); }, 12000);
    fetch(API + "?a=roleta", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { fim((j && j.modo) || "desligada"); })
      .catch(function () { fim("desligada"); });
  }
  function boot() {
    if (PREVIEW) { open(); return; }
    modo(function (m) {
      if (m === "desligada" || (m === "teste" && !TESTER)) return;
      if (TESTER) {   // teste: abre sozinha só na primeira página da visita; depois fica o botão "Roleta (teste)" no canto
        var ja = false; try { ja = sessionStorage.getItem("lvr_teste_abriu") === "1"; sessionStorage.setItem("lvr_teste_abriu", "1"); } catch (e) {}
        if (ja) showFab(); else setTimeout(open, 1500);
        return;
      }
      var s = store(true) || {};
      if (s.won && Date.now() - (s.won.at || 0) > 30 * 864e5) { delete s.won; store(false, s); }   // depois de 30 dias pode girar de novo
      var recent = s.closedAt && Date.now() - s.closedAt < CFG.repeatDays * 864e5;
      if (s.won || recent) { showFab(); return; }
      setTimeout(open, CFG.delayMs);
      document.addEventListener("mouseout", function exit(e) {
        if (!e.relatedTarget && e.clientY < 8) { open(); document.removeEventListener("mouseout", exit); }
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
