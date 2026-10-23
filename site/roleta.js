/* ===== Roleta Las Vegas Sex Shop · www.lasvegassexshop.com.br =====
   Fica hospedada no Portal (equipe.lasvegassexshop.com.br/site/roleta.js).
   A Nuvemshop só tem um "carregador" em Configurações › Códigos externos — para mudar a roleta, edite ESTE arquivo.
   Liga / desliga / teste: Portal › Administração › Roleta do site.
   Modo teste: abra o site com ?roleta=teste (sair: ?roleta=sair).
   Cupons que precisam existir na Nuvemshop (Marketing › Cupons): GIRO5, GIRO10, GIRO15, ENTREGA0, BRINDEVEGAS
*/
(function () {
  var CFG = {
    whatsapp: "5568992822275",
    delayMs: 8000,           // abre sozinha depois de 8s
    repeatDays: 7,           // não reaparece por 7 dias pra quem fechou
    // peso = chance relativa
    prizes: [
      { label: "5% OFF",          code: "GIRO5",       weight: 30, text: "5% de desconto" },
      { label: "10% OFF",         code: "GIRO10",      weight: 25, text: "10% de desconto" },
      { label: "ENTREGA R$ 0",    code: "ENTREGA0",    weight: 20, text: "entrega grátis em Rio Branco" },
      { label: "BRINDE",          code: "BRINDEVEGAS", weight: 10, text: "um brinde surpresa", noCart: true },
      { label: "15% OFF",         code: "GIRO15",      weight: 5,  text: "15% de desconto" }
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
  var KEY = "lvr_roleta_v1";
  function store(get, val) {
    try { if (get) return JSON.parse(localStorage.getItem(KEY) || "{}"); localStorage.setItem(KEY, JSON.stringify(val)); } catch (e) { return {}; }
  }
  var saved = store(true) || {};
  if (!PREVIEW && /checkout|account/.test(location.pathname)) return;

  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,600;1,6..96,800&family=Manrope:wght@400;600;800&display=swap";
  document.head.appendChild(font);

  var css = "\
.lvr-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(8,6,6,.78);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .3s}\
.lvr-ov.on{opacity:1}\
.lvr-box{position:relative;width:100%;max-width:420px;max-height:calc(100vh - 32px);overflow:auto;background:#0d0b0b;color:#f6efe6;border:1px solid #3a1414;border-radius:18px;padding:26px 22px 22px;font-family:Manrope,system-ui,sans-serif;box-shadow:0 30px 80px rgba(200,16,30,.25);transform:translateY(14px) scale(.97);transition:transform .35s cubic-bezier(.2,.9,.3,1.2)}\
.lvr-ov.on .lvr-box{transform:none}\
.lvr-x{position:absolute;top:10px;right:12px;background:none;border:0;color:#a89a8e;font-size:26px;line-height:1;cursor:pointer;padding:4px 8px}\
.lvr-eye{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#f5c518;text-align:center;font-weight:800}\
.lvr-h{font-family:'Bodoni Moda',Georgia,serif;font-style:italic;font-weight:800;font-size:30px;line-height:1.05;text-align:center;margin:6px 0 4px;color:#fff}\
.lvr-h b{color:#e3172b}\
.lvr-sub{text-align:center;font-size:14px;color:#c9bdb2;margin:0 0 14px}\
.lvr-wrap{position:relative;width:min(300px,78vw,42vh);aspect-ratio:1;margin:0 auto 16px}\
.lvr-wrap canvas{width:100%;height:100%;display:block;transition:transform 5.2s cubic-bezier(.12,.78,.18,1)}\
.lvr-pin{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:28px solid #f5c518;filter:drop-shadow(0 3px 3px rgba(0,0,0,.6));z-index:2}\
.lvr-hub{position:absolute;inset:39%;border-radius:50%;background:#0d0b0b;border:3px solid #f5c518;display:flex;align-items:center;justify-content:center;font-family:'Bodoni Moda',Georgia,serif;font-style:italic;font-weight:800;color:#f5c518;font-size:clamp(14px,4vw,19px)}\
.lvr-f{display:grid;gap:9px}\
.lvr-f input[type=text],.lvr-f input[type=tel]{width:100%;box-sizing:border-box;background:#1a1515;border:1px solid #3d3030;color:#fff;border-radius:10px;padding:12px 14px;font:inherit;font-size:15px}\
.lvr-f input:focus{outline:2px solid #f5c518;outline-offset:1px}\
.lvr-ck{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#b5a89c;line-height:1.35}\
.lvr-ck input{margin-top:2px;accent-color:#e3172b}\
.lvr-btn{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border:0;border-radius:999px;padding:14px;font:800 15px Manrope,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;background:#e3172b;color:#fff;transition:transform .15s,background .15s}\
.lvr-btn:hover{background:#c40f22;transform:translateY(-1px)}\
.lvr-btn:disabled{opacity:.55;cursor:default;transform:none}\
.lvr-btn.alt{background:#25d366;color:#08240f}\
.lvr-btn.ghost{background:transparent;border:1px solid #4a3b3b;color:#d8ccc0;font-size:13px}\
.lvr-err{color:#ff7a7a;font-size:12px;min-height:1em;margin:0}\
.lvr-res{text-align:center;display:grid;gap:10px}\
.lvr-prize{font-family:'Bodoni Moda',Georgia,serif;font-style:italic;font-weight:800;font-size:40px;color:#f5c518;line-height:1;margin:4px 0}\
.lvr-code{display:inline-block;border:2px dashed #f5c518;border-radius:10px;padding:8px 18px;font:800 20px/1 Manrope,monospace;letter-spacing:.12em;color:#fff;margin:0 auto}\
.lvr-fine{font-size:11.5px;color:#8f8378;margin:2px 0 0}\
.lvr-test{position:absolute;top:12px;left:14px;background:#f5c518;color:#140f0f;font:800 10.5px Manrope,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 10px}\
.lvr-fab{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147482999;background:#0d0b0b;color:#f5c518;border:2px solid #f5c518;border-radius:999px;padding:10px 16px;font:800 13px Manrope,system-ui,sans-serif;letter-spacing:.05em;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:lvrPulse 2.4s infinite}\
@keyframes lvrPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,197,24,.45)}50%{box-shadow:0 0 0 10px rgba(245,197,24,0)}}\
@media (prefers-reduced-motion:reduce){.lvr-wrap canvas{transition-duration:.01s}.lvr-fab{animation:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function drawWheel(canvas) {
    var n = CFG.wheel.length, size = 600, c = canvas.getContext("2d");
    canvas.width = canvas.height = size;
    var r = size / 2, a = (Math.PI * 2) / n;
    var fills = ["#c8101e", "#140f0f", "#e3172b", "#221a1a"];
    for (var i = 0; i < n; i++) {
      var s = -Math.PI / 2 + i * a;
      c.beginPath(); c.moveTo(r, r); c.arc(r, r, r - 10, s, s + a); c.closePath();
      c.fillStyle = fills[i % fills.length]; c.fill();
      c.strokeStyle = "#f5c518"; c.lineWidth = 3; c.stroke();
      c.save(); c.translate(r, r); c.rotate(s + a / 2);
      c.textAlign = "right"; c.fillStyle = i % 2 ? "#f5c518" : "#ffffff";
      var lb = CFG.prizes[CFG.wheel[i]].label;
      c.font = "800 " + (lb.length > 8 ? 23 : 30) + "px Manrope, system-ui, sans-serif";
      c.fillText(lb, r - 30, 10);
      c.restore();
    }
    c.beginPath(); c.arc(r, r, r - 5, 0, Math.PI * 2); c.strokeStyle = "#f5c518"; c.lineWidth = 10; c.stroke();
    for (var k = 0; k < n * 2; k++) {
      var ang = k * (Math.PI / n);
      c.beginPath(); c.arc(r + Math.cos(ang) * (r - 5), r + Math.sin(ang) * (r - 5), 6, 0, Math.PI * 2);
      c.fillStyle = "#fff6d0"; c.fill();
    }
  }

  function pickSlice() {
    var total = 0, i;
    for (i = 0; i < CFG.prizes.length; i++) total += CFG.prizes[i].weight;
    var roll = Math.random() * total, prize = 0;
    for (i = 0; i < CFG.prizes.length; i++) { roll -= CFG.prizes[i].weight; if (roll < 0) { prize = i; break; } }
    var slots = [];
    CFG.wheel.forEach(function (p, idx) { if (p === prize) slots.push(idx); });
    return slots[Math.floor(Math.random() * slots.length)];
  }

  var ov;
  function close() {
    if (!ov) return;
    ov.classList.remove("on");
    var o = ov; ov = null;
    setTimeout(function () { o.remove(); }, 300);
    var s = store(true) || {}; if (!s.won) { s.closedAt = Date.now(); store(false, s); }
    showFab();
  }

  function open() {
    if (ov) return;
    var fab = document.querySelector(".lvr-fab"); if (fab) fab.remove();
    ov = el("div", "lvr-ov");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Roleta de prêmios");
    var box = el("div", "lvr-box");
    var x = el("button", "lvr-x", "&times;"); x.setAttribute("aria-label", "Fechar"); x.onclick = close;
    box.appendChild(x);
    if (TESTER) { box.style.paddingTop = "46px"; box.appendChild(el("div", "lvr-test", "🧪 Modo teste · só você vê")); }

    var s = store(true) || {};
    if (s.won && !DEMO) { box.appendChild(result(CFG.prizes[s.won.p], s.won.name)); }
    else {
      box.appendChild(el("div", "lvr-eye", "O que acontece em Vegas…"));
      box.appendChild(el("h2", "lvr-h", "Gire e descubra <b>seu segredo</b>"));
      box.appendChild(el("p", "lvr-sub", "Todo giro ganha. Seu presente chega direto no WhatsApp."));
      var wrap = el("div", "lvr-wrap");
      var cv = el("canvas"); drawWheel(cv);
      wrap.appendChild(el("div", "lvr-pin")); wrap.appendChild(cv); wrap.appendChild(el("div", "lvr-hub", "Vegas"));
      box.appendChild(wrap);

      var f = el("form", "lvr-f");
      f.innerHTML = '<input id="lvr-nome" type="text" autocomplete="given-name" placeholder="Seu primeiro nome" required>' +
        '<input id="lvr-zap" type="tel" inputmode="tel" autocomplete="tel" placeholder="WhatsApp com DDD — (68) 9…" required>' +
        '<label class="lvr-ck"><input id="lvr-18" type="checkbox"> Tenho 18 anos ou mais</label>' +
        '<label class="lvr-ck"><input id="lvr-ok" type="checkbox" checked> Aceito receber novidades da Las Vegas no WhatsApp, com discrição</label>' +
        '<p class="lvr-err" id="lvr-err"></p>' +
        '<button class="lvr-btn" type="submit">Girar a roleta</button>';
      box.appendChild(f);
      var rot = 0;
      f.onsubmit = function (ev) {
        ev.preventDefault();
        var nome = f.querySelector("#lvr-nome").value.trim();
        var zap = f.querySelector("#lvr-zap").value.replace(/\D/g, "");
        var err = f.querySelector("#lvr-err");
        if (!nome) { err.textContent = "Coloca seu nome pra gente te chamar certinho."; return; }
        if (zap.length < 10 || zap.length > 13) { err.textContent = "Confere o WhatsApp: DDD + número, ex. 68 99999-9999."; return; }
        if (!f.querySelector("#lvr-18").checked) { err.textContent = "A roleta é só para maiores de 18 anos."; return; }
        err.textContent = "";
        var btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Girando…";
        var slice = pickSlice(), n = CFG.wheel.length, deg = 360 / n;
        var jitter = (Math.random() - 0.5) * deg * 0.6;
        rot += 360 * 6 + (360 - ((rot % 360))) + (360 - (slice * deg + deg / 2)) + jitter;
        cv.style.transform = "rotate(" + rot + "deg)";
        var pIdx = CFG.wheel[slice];
        setTimeout(function () {
          var data = store(true) || {};
          data.won = { p: pIdx, name: nome, at: Date.now() };
          store(false, data);
          if (window.dataLayer) window.dataLayer.push({ event: "roleta_giro", premio: CFG.prizes[pIdx].code });
          box.querySelectorAll(".lvr-eye,.lvr-h,.lvr-sub,.lvr-wrap,.lvr-f").forEach(function (n) { n.remove(); });
          box.appendChild(result(CFG.prizes[pIdx], nome));
        }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 5400);
      };
    }

    ov.appendChild(box);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov && ov.classList.add("on"); });
  }

  function result(p, nome) {
    var r = el("div", "lvr-res");
    var msg = "Oi! Sou a " + nome + ", girei a roleta no site e ganhei *" + p.label + "* 🎰 Cupom: *" + p.code + "*";
    r.innerHTML =
      '<div class="lvr-eye">' + (nome ? nome.replace(/[<>&"]/g, "") + ", você ganhou" : "Você ganhou") + '</div>' +
      '<div class="lvr-prize">' + p.label + '</div>' +
      '<p class="lvr-sub" style="margin:0">Seu cupom de ' + p.text + ':</p>' +
      '<div class="lvr-code">' + p.code + '</div>' +
      (p.noCart ? "" : '<a class="lvr-btn" href="/discount/' + p.code + '">Usar agora no carrinho</a>') +
      '<a class="lvr-btn alt" target="_blank" rel="noopener" href="https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg) + '">' +
      (p.noCart ? "Resgatar brinde no WhatsApp" : "Guardar no meu WhatsApp") + '</a>' +
      '<button class="lvr-btn ghost" type="button">Continuar comprando</button>' +
      '<p class="lvr-fine">1 uso por cliente. Embalagem 100% discreta, sempre.</p>';
    r.querySelector(".ghost").onclick = close;
    return r;
  }

  function showFab() {
    if (document.querySelector(".lvr-fab")) return;
    var b = el("button", "lvr-fab", TESTER ? "🧪 Roleta (teste)" : "🎰 Gire e ganhe");
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
      if (TESTER) { setTimeout(open, 1500); return; }
      var s = store(true) || {};
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
