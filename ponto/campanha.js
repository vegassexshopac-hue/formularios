/* ═══════════ Portal Equipe Las Vegas · v31 — CAMPANHA DO MÊS ═══════════
   Equipe (Portal › Vendas › Campanha do mês): Raspadinha do Dia (raspa com o dedo),
   Bingo de Vendas da semana (marca sozinho pelo PDV; print com aprovação), Hora de Ouro
   (clientes sumidas para chamar no WhatsApp), Ranking da semana e Mural dos Sonhos.
   Administração (Vendas e estoque › Campanha): prêmios a entregar, prints para aprovar,
   cartelas, ranking com mensagem pronta para o grupo e configuração.
   O sorteio da raspadinha acontece no servidor (CAMPANHA.gs) — a tela só revela. */
const CP = { sub:'raspadinha', ouro:null, rank:null, sonhos:null, adm:null, admSub:'premios', snap:null, _c:{} };
(function(){
  const css = `
.cp-hub{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.cp-hub button{border:1px solid var(--linha2);background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;gap:6px;align-items:center;transition:transform .15s var(--mola),box-shadow .15s}
.cp-hub button:hover{transform:translateY(-1px);box-shadow:var(--sh)}.cp-hub button:active{transform:scale(.95)}
.cp-hub button.on{background:var(--vermelho);color:#fff;border-color:var(--vermelho)}
.cp-hub .contador{background:var(--vermelho);color:#fff}.cp-hub button.on .contador{background:#fff;color:var(--vermelho)}
.cp-topo{position:relative;overflow:hidden;border-radius:22px;padding:16px 18px;color:#fff;background:linear-gradient(125deg,#1C1416,#3a0c12 55%,#E3101F);margin-bottom:12px;animation:cpSobe .35s var(--mola)}
.cp-topo::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.13) 48%,transparent 60%);background-size:260% 100%;animation:cpBrilho 6s ease-in-out infinite;pointer-events:none}
.cp-topo h3{margin:0;font-size:19px;letter-spacing:-.01em}.cp-topo p{margin:4px 0 0;opacity:.88;font-size:13.5px}
.cp-topo .barra{height:12px;border-radius:99px;background:rgba(255,255,255,.18);margin-top:12px;overflow:hidden}
.cp-topo .barra i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#F5B524,#FFE08A);transform-origin:left;animation:cpCresce 1s var(--mola) both}
.cp-topo .num{font-size:30px;font-weight:900;letter-spacing:-.03em;line-height:1}
.cp-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.cp-tick{position:relative;border:0;border-radius:18px;padding:16px 12px;min-height:118px;font:inherit;color:#1C1416;cursor:pointer;background:repeating-linear-gradient(135deg,#F5B524 0 10px,#F7C24A 10px 20px);box-shadow:0 10px 24px -12px rgba(227,154,0,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;animation:cpPula .5s var(--mola) both;transition:transform .15s var(--mola)}
.cp-tick:hover{transform:translateY(-3px) rotate(-1deg)}.cp-tick:active{transform:scale(.95)}
.cp-tick .em{font-size:34px;animation:cpBalanca 2.4s ease-in-out infinite}.cp-tick b{font-size:15px}.cp-tick small{font-size:12px;opacity:.75}
.cp-tick::before,.cp-tick::after{content:'';position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:var(--noite);transform:translateY(-50%)}
.cp-tick::before{left:-8px}.cp-tick::after{right:-8px}
.cp-raspa{position:relative;width:min(320px,82vw);aspect-ratio:1.25;margin:4px auto 10px;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 40%,#fff,#FFF3D6);box-shadow:var(--sh2);touch-action:none;user-select:none}
.cp-raspa .premio{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:14px;gap:6px}
.cp-raspa .premio .em{font-size:64px;line-height:1}.cp-raspa .premio b{font-size:20px;letter-spacing:-.01em}
.cp-raspa canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab;transition:opacity .6s}
.cp-raspa canvas.some{opacity:0;pointer-events:none}
.cp-bingo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:520px;margin:0 auto}
.cp-q{position:relative;aspect-ratio:1;border-radius:16px;background:#fff;border:2px dashed var(--linha2);padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;font-size:12.5px;line-height:1.25;animation:cpSobe .35s both;overflow:hidden}
.cp-q .em{font-size:26px}.cp-q .tx{font-weight:700}
.cp-q.feito{border:2px solid var(--vermelho);background:linear-gradient(160deg,#fff,#FDE8EA)}
.cp-q.feito::after{content:'✔';position:absolute;top:6px;right:6px;width:30px;height:30px;border-radius:50%;background:var(--vermelho);color:#fff;font-size:16px;font-weight:900;display:grid;place-items:center;box-shadow:0 4px 10px -3px rgba(227,16,31,.7);transform:rotate(-14deg);animation:cpCarimbo .45s var(--mola) both}
.cp-q.linha{box-shadow:0 0 0 3px #F5B524,0 10px 22px -10px rgba(227,154,0,.9)}
.cp-q.pend{border:2px solid #F5B524;background:var(--ouro-claro)}
.cp-q .bt{margin-top:2px;border:0;border-radius:99px;padding:5px 9px;font:inherit;font-size:11.5px;font-weight:800;background:var(--vermelho);color:#fff;cursor:pointer;transition:transform .15s var(--mola)}
.cp-q .bt:active{transform:scale(.92)}
.cp-q .st{font-size:11px;font-weight:800;color:var(--warn)}
.cp-q .rec{font-size:10.5px;color:var(--bad);font-weight:700}
.cp-lista{display:grid;gap:8px}
.cp-it{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px 12px;animation:cpSobe .3s both}
.cp-it .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;flex:none;background:var(--veludo2)}
.cp-it .t{flex:1;min-width:0}.cp-it .t b{display:block}.cp-it .t small{color:var(--creme2);font-size:12.5px}
.cp-it.ok{opacity:.6}.cp-it.ok .av{background:var(--ok-bg);color:var(--ok)}
.cp-zap{border:0;background:#25D366;color:#fff;border-radius:12px;padding:9px 12px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;display:flex;gap:6px;align-items:center;text-decoration:none;flex:none;transition:transform .15s var(--mola)}
.cp-zap:hover{transform:translateY(-1px)}.cp-zap:active{transform:scale(.93)}.cp-zap.feito{background:var(--ok-bg);color:var(--ok)}
.cp-rank{display:grid;gap:10px}
.cp-pess{background:#fff;border-radius:18px;padding:12px 14px;box-shadow:var(--sh);animation:cpSobe .4s both;display:grid;grid-template-columns:auto 1fr auto;gap:4px 12px;align-items:center}
.cp-pess .pos{font-size:28px;width:40px;text-align:center}
.cp-pess .nm{font-weight:800;font-size:16px}.cp-pess .vl{font-weight:900;font-size:18px;text-align:right}
.cp-pess .sub{grid-column:2/4;font-size:12.5px;color:var(--creme2);display:flex;gap:10px;flex-wrap:wrap}
.cp-pess .trilho{grid-column:1/4;position:relative;height:12px;border-radius:99px;background:var(--veludo2);overflow:visible;margin-top:6px}
.cp-pess .trilho i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),#F5B524);transform-origin:left;animation:cpCresce 1.1s var(--mola) both}
.cp-pess .trilho s{position:absolute;top:-3px;bottom:-3px;width:2px;background:#1C1416;opacity:.35;text-decoration:none}
.cp-pess .marcos{grid-column:1/4;display:flex;justify-content:space-between;font-size:11px;color:var(--creme3)}
.cp-sonhos{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.cp-sonho{background:#fff;border-radius:18px;overflow:hidden;box-shadow:var(--sh);animation:cpPula .5s var(--mola) both}
.cp-sonho .ft{aspect-ratio:1;background:linear-gradient(135deg,#FDE8EA,#FFF3D6);display:grid;place-items:center;font-size:52px;background-size:cover;background-position:center}
.cp-sonho .tx{padding:10px 12px}.cp-sonho .tx b{display:block;font-size:14px}.cp-sonho .tx p{margin:3px 0 0;font-size:13px;line-height:1.35}
.cp-sonho.meu{outline:3px solid var(--vermelho)}
.cp-ini{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.cp-ini button{flex:1 1 170px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px 12px;font:inherit;text-align:left;cursor:pointer;animation:cpSobe .35s both;transition:transform .15s var(--mola)}
.cp-ini button:hover{transform:translateY(-2px)}.cp-ini button:active{transform:scale(.97)}
.cp-ini b{display:block;font-size:16px;line-height:1.1}.cp-ini small{color:var(--creme2);font-size:12px}
.cp-ini .ic{font-size:24px}.cp-ini .ouro{border-color:#F5B524;background:linear-gradient(120deg,#FFF3D6,#fff)}.cp-ini .ouro .ic{animation:cpBalanca 1.6s infinite}
.cp-ini .rasp{border-color:var(--vermelho);background:linear-gradient(120deg,#FDE8EA,#fff)}.cp-ini .rasp .ic{animation:cpPulsa 1.4s infinite}
.cp-mini{display:grid;grid-template-columns:repeat(3,22px);gap:3px}.cp-mini i{width:22px;height:22px;border-radius:6px;background:var(--veludo2);display:block}.cp-mini i.f{background:var(--vermelho)}.cp-mini i.p{background:#F5B524}
.cp-ok{background:var(--ok-bg);color:var(--ok);border-radius:99px;padding:3px 9px;font-size:12px;font-weight:800}
.cp-pend{background:var(--warn-bg);color:var(--warn);border-radius:99px;padding:3px 9px;font-size:12px;font-weight:800}
.cp-vazio{text-align:center;padding:26px 10px;color:var(--creme2)}.cp-vazio .em{font-size:44px;display:block;animation:cpFlutua 3s ease-in-out infinite}
.cp-print{display:grid;grid-template-columns:96px 1fr;gap:12px;background:#fff;border:1px solid var(--linha2);border-radius:16px;padding:10px;animation:cpSobe .3s both}
.cp-print img{width:96px;height:96px;object-fit:cover;border-radius:12px;background:var(--veludo2);cursor:zoom-in}
.cp-confete{position:fixed;width:9px;height:14px;border-radius:2px;z-index:9999;pointer-events:none;animation:cpCai 1.6s cubic-bezier(.2,.6,.4,1) forwards}

.cpa-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin:2px 2px 14px}
.cpa-topo h2{font-size:clamp(22px,3vw,30px);font-weight:800;letter-spacing:-.025em;line-height:1.1;margin:0}
.cpa-topo p{color:var(--creme2);font-weight:600;margin:4px 0 0}
.cpa-eq{background:linear-gradient(125deg,#1C1416,#3a0c12 60%,#E3101F);color:#fff;border-radius:22px;padding:16px 18px;box-shadow:var(--sh2);animation:cpSobe .35s var(--mola) both}
.cpa-eq small{display:block;opacity:.8;font-size:12.5px}.cpa-eq b{display:block;font-size:30px;font-weight:900;letter-spacing:-.03em;line-height:1.1}
.cpa-sit{font-weight:800;font-size:16px;text-align:right}.cpa-sit small{font-weight:600}
.cpa-eq.atras .cpa-sit{color:#FFD98A}
.cpa-b{position:relative;height:9px;border-radius:99px;background:var(--veludo2);margin-top:6px;overflow:visible}
.cpa-b i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--vermelho),#F5B524);transform-origin:left;animation:cpCresce 1s var(--mola) both}
.cpa-b.grande{height:14px;background:rgba(255,255,255,.18);margin-top:12px}.cpa-b.grande i{background:linear-gradient(90deg,#F5B524,#FFE08A)}
.cpa-b s{position:absolute;top:-4px;bottom:-4px;width:3px;border-radius:2px;background:#fff;text-decoration:none}
.cpa-it{align-items:center;flex-wrap:wrap;cursor:default}.cpa-it:hover{transform:none}
.cpa-mini{width:48px;height:48px;border-radius:12px;object-fit:cover;cursor:zoom-in;flex-shrink:0;background:var(--veludo2)}
.cpa-bts{display:flex;gap:6px;flex-wrap:wrap}.cpa-bts .btn{padding:8px 12px}
.cpa-ps{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.cpa-p{background:#fff;border-radius:20px;padding:14px;box-shadow:var(--sh);display:grid;gap:12px;animation:entraCard .45s var(--mola) both;animation-delay:calc(var(--k,0) * 70ms)}
.cpa-p-top{display:flex;align-items:center;gap:10px}.cpa-p-top b{font-size:17px;flex:1}
.cpa-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:var(--vermelho-claro);color:var(--vermelho2)}
.cpa-l span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--creme3)}.cpa-l b{display:block;font-size:20px;font-weight:900;letter-spacing:-.02em}.cpa-l small{display:block;font-size:12.5px;color:var(--creme2)}
.cpa-rod{display:flex;justify-content:space-between;gap:6px;font-size:13px;font-weight:700;border-top:1px solid var(--linha);padding-top:10px}
.cpa-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
.cpa-tile{position:relative;text-align:left;background:#fff;border:1px solid var(--linha);border-radius:18px;padding:14px;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:3px;box-shadow:var(--sh);transition:transform .2s var(--mola),box-shadow .2s;animation:entraCard .45s var(--mola) both}
.cpa-tile:hover{transform:translateY(-3px);box-shadow:var(--sh2)}.cpa-tile:active{transform:scale(.97)}
.cpa-tile .em{font-size:28px}.cpa-tile b{font-size:15px}.cpa-tile small{color:var(--creme2);font-size:12.5px}
.cpa-tile .contador{position:absolute;top:10px;right:10px}
.cpa-como{margin-top:16px;background:#fff;border-radius:16px;padding:12px 16px;border:1px solid var(--linha)}
.cpa-como summary{cursor:pointer;font-weight:800}.cpa-como ul{margin:10px 0 2px;padding-left:4px;list-style:none;display:grid;gap:8px;font-size:14px;line-height:1.45}
.cpa-it .cresce{flex:1 1 200px;min-width:0}
@media(max-width:620px){.cpa-bts{flex:1 1 100%;justify-content:flex-end}.cpa-tiles{grid-template-columns:1fr 1fr}.cpa-sit{text-align:left}}
.cpa-teste{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-top:14px;padding:14px 16px;border-radius:20px;border:2px dashed #F5B524;background:linear-gradient(120deg,#FFF3D6,#fff);font:inherit;cursor:pointer;transition:transform .2s var(--mola)}
.cpa-teste:hover{transform:translateY(-2px)}.cpa-teste:active{transform:scale(.98)}.cpa-teste .em{font-size:32px}.cpa-teste b{display:block;font-size:16px}.cpa-teste small{color:var(--creme2)}
.cpa-volta{border:0;background:none;font:inherit;font-weight:800;color:var(--vermelho2);cursor:pointer;padding:4px 0;margin-bottom:6px;display:inline-flex;gap:6px;align-items:center}
.cpa-tit{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 12px}
@keyframes cpSobe{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes cpPula{0%{transform:scale(.6);opacity:0}100%{transform:none;opacity:1}}
@keyframes cpBrilho{0%,60%{background-position:120% 0}100%{background-position:-60% 0}}
@keyframes cpCresce{from{transform:scaleX(0)}}
@keyframes cpBalanca{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}
@keyframes cpPulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@keyframes cpFlutua{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes cpCarimbo{0%{transform:scale(2.2) rotate(-14deg);opacity:0}100%{transform:scale(1) rotate(-14deg);opacity:1}}
@keyframes cpCai{to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}
@media(prefers-reduced-motion:reduce){.cp-topo::after,.cp-tick .em,.cp-ini .ic,.cp-vazio .em{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

/* ───────── pedacinhos ───────── */
const cpD = () => S.sess?.dados?.campanha || null;
const cpDia = iso => { const [a,m,d] = String(iso||'').split('-'); return d ? d+'/'+m : ''; };
/* v54: raspadinha ganha com os pontos da Missão do Dia tem ref "2026-11-M02" */
const cpRaspM = ref => { const m = String(ref||'').match(/-M(\d+)$/); return m ? Number(m[1]) : 0; };
const cpRaspNome = ref => cpRaspM(ref) ? 'Raspadinha da Missão nº '+cpRaspM(ref) : 'Raspadinha de '+cpDia(ref);
const cpRaspRef = ref => cpRaspM(ref) ? 'Missão do Dia nº '+cpRaspM(ref) : 'dia '+cpDia(ref);
const cpSemanaTxt = (a, b) => cpDia(a)+' a '+cpDia(b);
function cpHojeMin(){ const d = new Date(); return d.getHours()*60 + d.getMinutes() + (Number(S.offset)||0); }
function cpMin(hhmm){ const [h,m] = String(hhmm||'').split(':').map(Number); return isNaN(h) ? null : h*60+(m||0); }
function cpOuroAgora(j){ if(!j||!j.ini) return 'sem'; const a = cpMin(j.ini), b = cpMin(j.fim), n = cpHojeMin(); return n < a ? 'antes' : n <= b ? 'agora' : 'depois'; }
function cpVazio(em, t, s){ return `<div class="cp-vazio"><span class="em">${em}</span><b>${t}</b>${s?`<p style="margin:4px 0 0;font-size:13.5px">${s}</p>`:''}</div>`; }
function cpConfete(qtd=60){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cores = ['#E3101F','#F5B524','#FFE08A','#1C1416','#fff'], w = innerWidth;
  for(let i=0;i<qtd;i++){ const c = document.createElement('i'); c.className = 'cp-confete';
    c.style.cssText = `left:${w/2+(Math.random()*120-60)}px;top:${innerHeight*0.38}px;background:${cores[i%cores.length]};--x:${(Math.random()*2-1)*w*0.55}px;--y:${-(80+Math.random()*innerHeight*0.45)+innerHeight*0.5}px;--r:${Math.random()*720-360}deg;animation-delay:${Math.random()*.15}s`;
    document.body.appendChild(c); setTimeout(()=>c.remove(), 1900); }
}
async function cpApi(op, dados={}){ return api('campanha', {eid:S.sess.eid, ...S.sess.cred, op, ...dados}); }
async function cpAdmApi(op, dados={}){ return api('admCampanha', {...S.adm.cred, op, ...dados}); }
function cpAtualizar(c){ if(c && S.sess?.dados){ S.sess.dados.campanha = c; } }
/* foto → JPEG pequeno (a internet da loja agradece) */
function cpFoto(file, max=1000){
  return new Promise((ok, erro)=>{
    if(!file) return erro(new Error('Escolha uma foto'));
    if(!/^image\//.test(file.type||'image/')) return erro(new Error('Escolha uma imagem (print ou foto)'));
    const fr = new FileReader();
    fr.onerror = ()=>erro(new Error('Não consegui ler a foto'));
    fr.onload = ()=>{ const im = new Image(); im.onerror = ()=>erro(new Error('Não consegui abrir a foto'));
      im.onload = ()=>{ const k = Math.min(1, max/Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width*k); c.height = Math.round(im.height*k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        let q = .8, d = c.toDataURL('image/jpeg', q); while(d.length > 800*1024 && q > .4){ q -= .1; d = c.toDataURL('image/jpeg', q); }
        ok(d); };
      im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
function cpModal(titulo, corpo, largo){
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)cpFechar()"><div class="modal ${largo?'largo':''}"><div class="modal-t"><h3 class="cresce">${titulo}</h3><button class="icone" onclick="cpFechar()"><i class="ti ti-x"></i></button></div><div class="modal-c">${corpo}</div></div></div>`;
}
function cpFechar(){ fecharModal(); render(); }

/* ───────── topo: hoje e mês ───────── */
function cpTopo(c){
  const falta = Math.max(0, c.valor_dia - (c.hoje||0)), pct = Math.min(100, (c.hoje||0)/c.valor_dia*100);
  const mt = c.meta||{}, m = c.mes||0, nivel = m >= mt.hiper ? '🚀 Hiper meta batida!' : m >= mt.super ? '🔥 Super meta batida!' : m >= mt.meta ? '🎯 Meta batida!' : `faltam ${brl(mt.meta - m)} para a meta`;
  return `<div class="cp-topo"><div class="linha entre" style="gap:10px;align-items:flex-end"><div><h3>${falta ? 'Hoje: faltam '+brl(falta) : 'Valor do dia batido! 🎟️'}</h3><p>${brl(c.hoje||0)} de ${brl(c.valor_dia)} · ${falta ? 'se bater, ganha uma raspadinha' : 'a raspadinha de hoje é sua'}</p></div><span class="num">${Math.round(pct)}%</span></div>
    <div class="barra"><i style="width:${pct}%"></i></div>
    <p style="margin-top:10px">Mês: <b>${brl(m)}</b> · ${nivel}</p></div>`;
}

/* ───────── raspadinha ───────── */
function cpRaspadinha(c){
  const disp = c.raspadinhas||[], meus = (c.premios||[]).filter(p=>p.tipo==='raspadinha');
  const tickets = disp.length ? `<div class="cp-grade" style="margin-bottom:14px">${disp.map((r,i)=>`<button class="cp-tick" style="animation-delay:${i*70}ms" onclick="cpAbrirRaspa('${r.data}')"><span class="em">🎟️</span><b>${cpRaspNome(r.data)}</b><small>${r.missao?'ganha com os pontos da Missão ⭐':'você vendeu '+brl(r.vendido)}</small></button>`).join('')}</div>`
    : cpVazio('🎟️', 'Nenhuma raspadinha esperando', `Venda ${brl(c.valor_dia)} num dia e ela aparece aqui. Vale por alguns dias, então não esquece de raspar!`);
  const hist = meus.length ? `<h3 class="secao" style="margin-top:6px">Seus prêmios</h3><div class="cp-lista">${meus.map((p,i)=>`<div class="cp-it" style="animation-delay:${Math.min(i,10)*35}ms"><span class="av">${p.nada?'😅':'🎁'}</span><div class="t"><b>${esc(p.premio)}</b><small>${cpRaspNome(p.ref).toLowerCase()}</small></div>${p.nada?'':p.status==='entregue'?'<span class="cp-ok">entregue</span>':'<span class="cp-pend">a receber</span>'}</div>`).join('')}</div>` : '';
  return tickets + hist;
}
async function cpAbrirRaspa(data){
  cpModal('🎟️ '+cpRaspNome(data), `<p class="suave" style="text-align:center"><i class="ti ti-loader-2"></i> Preparando a sua raspadinha…</p>`);
  let r; try{ r = await cpApi('raspar', {data}); }catch(e){ fecharModal(); return toast(e.message, true); }
  cpAtualizar(r.campanha);
  const p = r.premio, em = (p.premio.match(/^\p{Extended_Pictographic}️?/u)||['🎁'])[0], nome = p.premio.replace(/^\p{Extended_Pictographic}️?\s*/u, '');
  cpModal('🎟️ '+cpRaspNome(data), `<p style="text-align:center;margin:0 0 8px" class="suave">Raspe com o dedo 👇</p>
    <div class="cp-raspa" id="cp-raspa"><div class="premio"><span class="em">${em}</span><b>${esc(nome)}</b><small class="suave">${p.nada?'Amanhã tem mais!':'A administração entrega para você 💋'}</small></div><canvas id="cp-canvas"></canvas></div>
    <p id="cp-raspa-fim" style="text-align:center;min-height:22px;font-weight:800;margin:0"></p>
    <button class="btn pri" style="width:100%;margin-top:8px" onclick="cpFechar()">Fechar</button>`);
  cpPrepararRaspa(p);
}
function cpPrepararRaspa(p){
  const cv = $('#cp-canvas'); if(!cv) return;
  const box = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio||1);
  cv.width = Math.round(box.width*dpr); cv.height = Math.round(box.height*dpr);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const gr = g.createLinearGradient(0, 0, box.width, box.height); gr.addColorStop(0,'#C9A227'); gr.addColorStop(.45,'#F5D77A'); gr.addColorStop(.55,'#E6C14E'); gr.addColorStop(1,'#B8891A');
  g.fillStyle = gr; g.fillRect(0, 0, box.width, box.height);
  g.fillStyle = 'rgba(255,255,255,.18)'; for(let i=0;i<60;i++){ g.beginPath(); g.arc(Math.random()*box.width, Math.random()*box.height, Math.random()*2.5+.5, 0, 7); g.fill(); }
  g.fillStyle = '#5a3d00'; g.textAlign = 'center'; g.font = '900 22px system-ui, sans-serif'; g.fillText('RASPE AQUI ✨', box.width/2, box.height/2 - 4);
  g.font = '700 13px system-ui, sans-serif'; g.fillText('Las Vegas · Campanha do mês', box.width/2, box.height/2 + 20);
  g.globalCompositeOperation = 'destination-out';
  let raspando = false, ult = null, revelou = false, n = 0;
  const pt = e => { const r = cv.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; };
  const risca = (a, b) => { g.lineWidth = 42; g.lineCap = 'round'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.beginPath(); g.arc(b.x, b.y, 21, 0, 7); g.fill(); };
  const conferir = () => {
    if(revelou) return; const d = g.getImageData(0, 0, cv.width, cv.height).data; let lim = 0, tot = 0;
    for(let i=3;i<d.length;i+=4*37){ tot++; if(d[i] < 40) lim++; }
    if(lim/tot > .5) revelar();
  };
  const revelar = () => { revelou = true; cv.classList.add('some'); const f = $('#cp-raspa-fim');
    if(f) f.textContent = p.nada ? 'Não foi dessa vez… amanhã tem mais! 💪' : 'Parabéns! 🎉 Você ganhou: '+p.premio;
    if(!p.nada){ cpConfete(80); navigator.vibrate?.([60,40,120]); } };
  cv.addEventListener('pointerdown', e=>{ raspando = true; ult = pt(e); cv.setPointerCapture?.(e.pointerId); risca(ult, ult); });
  cv.addEventListener('pointermove', e=>{ if(!raspando) return; const a = pt(e); risca(ult, a); ult = a; if(++n % 6 === 0) conferir(); });
  const solta = () => { if(raspando){ raspando = false; conferir(); } };
  cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta); cv.addEventListener('pointerleave', solta);
  cv.addEventListener('dblclick', revelar);
}

/* ───────── bingo ───────── */
function cpBingo(c){
  const b = c.bingo; if(!b) return cpVazio('🎱','Bingo indisponível');
  const naLinha = new Set(); (b.linhas||[]).forEach(l=>l.forEach(i=>naLinha.add(i)));
  const pr = c.bingo_premios||{};
  const cel = q => `<div class="cp-q ${q.feito?'feito':''} ${q.pendente?'pend':''} ${naLinha.has(q.i)?'linha':''}" style="animation-delay:${q.i*45}ms" title="${esc(q.t)}">
      <span class="em">${q.em}</span><span class="tx">${esc(q.t)}</span>
      ${q.feito ? `<small class="apagado">${q.como==='print'?'print aprovado':'pelo PDV'}${q.quando?' · '+cpDia(q.quando):''}</small>`
        : q.pendente ? '<span class="st">⏳ esperando aprovação</span>'
        : q.tipo!=='auto' ? `${q.recusado?`<span class="rec">${esc(q.recusado)}</span>`:''}<button class="bt" onclick="cpPrint('${q.id}')"><i class="ti ti-camera"></i> ${q.recusado?'Mandar de novo':'Mandar print'}</button>${q.tipo==='auto_print'?'<small class="apagado">ou marca sozinho</small>':''}`
        : '<small class="apagado">marca sozinho no PDV</small>'}
    </div>`;
  return `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><div><b style="font-size:16px">🎱 Cartela da semana · ${cpSemanaTxt(b.semana, b.ate)}</b><br><small class="apagado">${b.feitos} de 9 marcados · recomeça toda segunda</small></div>
      <div class="cp-mini">${b.quadrados.map(q=>`<i class="${q.feito?'f':q.pendente?'p':''}"></i>`).join('')}</div></div>
    <div class="cp-bingo">${b.quadrados.map(cel).join('')}</div>
    <div class="cp-lista" style="margin-top:12px">
      <div class="cp-it"><span class="av">${b.linhas.length?'✅':'➖'}</span><div class="t"><b>Fechou uma linha (deitada, em pé ou na diagonal)</b><small>${esc(pr.premio_linha||'')}</small></div>${b.linhas.length?'<span class="cp-ok">conquistado</span>':''}</div>
      <div class="cp-it"><span class="av">${b.cheia?'🏆':'🎯'}</span><div class="t"><b>Cartela cheia</b><small>${esc(pr.premio_cartela||'')}</small></div>${b.cheia?'<span class="cp-ok">conquistado</span>':''}</div>
    </div>
    <input type="file" accept="image/*" id="cp-arq" hidden onchange="cpPrintEnviar(this)">`;
}
function cpPrint(id){ CP._q = id; const i = $('#cp-arq'); if(i){ i.value = ''; i.click(); } }
async function cpPrintEnviar(inp){
  const f = inp.files && inp.files[0]; if(!f) return;
  toast('Enviando o print…');
  try{ const img = await cpFoto(f, 1000); const r = await cpApi('print', {quadrado:CP._q, img}); cpAtualizar(r.campanha); toast('Print enviado ✔ A administração vai aprovar.'); render(); }
  catch(e){ toast(e.message, true); }
}

/* ───────── hora de ouro ───────── */
function cpOuro(c){
  const o = CP.ouro;
  if(!o){ cpOuroCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Separando as suas clientes…</p>`; }
  if(o.erro) return `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-alert-triangle"></i><div>${esc(o.erro)}<br><button class="btn p" style="margin-top:6px" onclick="CP.ouro=null;render()">Tentar de novo</button></div></div>`;
  const st = cpOuroAgora(o.janela), feitas = o.chamadas_hoje||0, pct = Math.min(100, feitas/o.qtd*100);
  const topo = `<div class="cp-topo" style="background:linear-gradient(125deg,#3a2600,#A86F00 55%,#F5B524)"><div class="linha entre" style="gap:10px;align-items:flex-end"><div><h3>${st==='agora'?'⏰ É Hora de Ouro!':'⏰ Hora de Ouro'}</h3><p>${o.janela?.ini?`Hoje das ${o.janela.ini} às ${o.janela.fim}`:'Horário não definido'} · ${st==='antes'?'ainda não começou — pode adiantar':st==='agora'?'loja parada vira venda':'já passou, mas ainda dá tempo de chamar'}</p></div><span class="num">${feitas}/${o.qtd}</span></div>
    <div class="barra"><i style="width:${pct}%"></i></div><p style="margin-top:8px">Chame as clientes que sumiram. A mensagem já vai pronta, sem falar do que ela comprou.</p></div>`;
  if(!o.clientes?.length) return topo + cpVazio('💌','Nenhuma cliente para chamar agora', 'A lista sai do cartão fidelidade: aparecem as clientes que não compram há mais de um mês. Cadastre as clientes no PDV para a lista crescer.');
  return topo + `<div class="cp-lista">${o.clientes.map((k,i)=>`<div class="cp-it ${k.chamada?'ok':''}" style="animation-delay:${Math.min(i,12)*35}ms"><span class="av">${k.chamada?'✔':esc(iniciais(k.nome))}</span>
      <div class="t"><b>${esc(k.nome)} ${k.aniversario?'🎂':''}</b><small>${k.ultima?'última compra '+cpDia(k.ultima):'sem compra no PDV'}${k.tel_mask?' · '+esc(k.tel_mask):''}${k.aniversario?' · aniversário este mês':''}</small></div>
      ${k.chamada?'<span class="cp-zap feito"><i class="ti ti-check"></i> Chamada</span>':k.link?`<a class="cp-zap" href="${esc(k.link)}" target="_blank" rel="noopener" onclick="cpChamei('${k.id}')"><i class="ti ti-brand-whatsapp"></i> Chamar</a>`:`<button class="cp-zap" onclick="cpChamei('${k.id}')"><i class="ti ti-check"></i> Chamei</button>`}</div>`).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin-top:8px">Cada vendedora recebe clientes diferentes. Quem foi chamada sai da lista por alguns dias. Se ela voltar a comprar no seu PDV, marca o quadrado 🔁 do bingo sozinho.</p>`;
}
async function cpOuroCarregar(){
  if(CP._c.ouro) return; CP._c.ouro = true;
  try{ CP.ouro = await cpApi('ouro'); }catch(e){ CP.ouro = {erro:e.message}; } finally{ CP._c.ouro = false; }
  cpRepintar();
}
async function cpChamei(id){
  try{ const r = await cpApi('chamei', {cliente_id:id}); CP.ouro = r; if(S.sess.dados.campanha) S.sess.dados.campanha.chamadas_hoje = r.chamadas_hoje;
    if(!r.ja) toast(r.chamadas_hoje >= r.qtd ? 'Hora de Ouro completa! 🏆' : 'Boa! '+r.chamadas_hoje+' de '+r.qtd+' ✔'); if(r.chamadas_hoje === r.qtd && !r.ja) cpConfete(50);
    setTimeout(render, 300); }
  catch(e){ toast(e.message, true); }
}

/* ───────── ranking e sonhos ───────── */
function cpRanking(c){
  const R = CP.rank;
  if(!R){ cpRankCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Montando o ranking…</p>`; }
  if(R.erro) return `<p class="suave">${esc(R.erro)}</p>`;
  return cpRankHtml(R, S.sess.eid);
}
function cpRankHtml(R, eu){
  const mt = R.meta, med = ['🥇','🥈','🥉'];
  return `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><b style="font-size:16px">🏆 Semana ${cpSemanaTxt(R.semana, R.ate)}</b><span class="apagado" style="font-size:13px">Equipe: <b>${brl(R.equipe.semana)}</b> na semana · <b>${brl(R.equipe.mes)}</b> no mês</span></div>
    <div class="cp-rank">${R.pessoas.map((p,i)=>{ const top = Math.max(mt.hiper, p.mes)*1.04, w = Math.min(100, p.mes/top*100), s = x => `<s style="left:${x/top*100}%"></s>`;
      const sobe = p.semana_ant ? Math.round((p.semana/p.semana_ant - 1)*100) : null;
      return `<div class="cp-pess" style="animation-delay:${i*80}ms;${p.id===eu?'outline:3px solid var(--vermelho)':''}"><span class="pos">${med[i]||'#'+(i+1)}</span><span class="nm">${esc(p.nome)}${p.nivel?` <span class="cp-ok">${p.nivel==='hiper'?'🚀 hiper':p.nivel==='super'?'🔥 super':'🎯 meta'}</span>`:''}</span><span class="vl">${brl(p.semana)}</span>
        <span class="sub"><span>📅 hoje ${brl(p.hoje)}</span><span>🎱 bingo ${p.bingo}/9</span><span>🎟️ ${p.raspadinhas} raspadinha${p.raspadinhas===1?'':'s'}</span><span>✅ ${p.dias_batidos} dia${p.dias_batidos===1?'':'s'} batido${p.dias_batidos===1?'':'s'}</span>${sobe!=null?`<span>${sobe>=0?'⬆️':'⬇️'} ${Math.abs(sobe)}% vs semana passada</span>`:''}</span>
        <div class="trilho"><i style="width:${w}%;animation-delay:${i*80}ms"></i>${s(mt.meta)}${s(mt.super)}${s(mt.hiper)}</div>
        <div class="marcos"><span>Mês: <b>${brl(p.mes)}</b></span><span>meta ${brl(mt.meta)} · super ${brl(mt.super)} · hiper ${brl(mt.hiper)}</span></div></div>`; }).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin-top:8px">Dia ${R.dias_passados} de ${R.dias_uteis} dias de loja · valor do dia ${brl(R.valor_dia)}. A semana vai de segunda a sábado.</p>`;
}
async function cpRankCarregar(){
  if(CP._c.rank) return; CP._c.rank = true;
  try{ const r = await cpApi('ranking'); CP.rank = r.ranking; CP.sonhos = r.sonhos; }catch(e){ CP.rank = {erro:e.message}; } finally{ CP._c.rank = false; }
  cpRepintar();
}
function cpSonhos(){
  const L = CP.sonhos;
  if(!L){ cpRankCarregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Abrindo o mural…</p>`; }
  const eu = S.sess.eid, meu = L.find(s=>s.id===eu);
  const card = (s,i) => `<div class="cp-sonho ${s.id===eu?'meu':''}" style="animation-delay:${i*70}ms"><div class="ft" ${s.url?`style="background-image:url('${esc(s.url)}')"`:''}>${s.url?'':'💭'}</div><div class="tx"><b>${esc(s.nome)}</b><p>${esc(s.texto||'')}</p></div></div>`;
  return `<div class="nota info" style="margin-bottom:12px"><i class="ti ti-sparkles"></i><div><b>Pelo que você está correndo este mês?</b> Uma viagem, uma conta paga, um presente… Coloque a foto e olhe para ela todo dia. A meta é o caminho, o sonho é o motivo.</div></div>
    <button class="btn pri" style="margin-bottom:12px" onclick="cpSonhoEditar()"><i class="ti ti-${meu?'pencil':'plus'}"></i> ${meu?'Editar o meu sonho':'Colocar o meu sonho'}</button>
    ${L.length?`<div class="cp-sonhos">${L.map(card).join('')}</div>`:cpVazio('💭','O mural ainda está vazio','Seja a primeira a colocar o seu sonho!')}`;
}
function cpSonhoEditar(){
  const meu = (CP.sonhos||[]).find(s=>s.id===S.sess.eid) || {};
  CP._fotoSonho = null;
  cpModal('💭 Meu sonho', `<div class="campo"><label>Qual é o seu sonho?</label><input class="inp" id="cp-sonho-tx" maxlength="140" placeholder="Ex.: viajar com a minha filha" value="${esc(meu.texto||'')}"></div>
    <div class="campo"><label>Uma foto que lembra esse sonho (opcional)</label><input class="inp" type="file" accept="image/*" id="cp-sonho-ft" onchange="cpSonhoFoto(this)"></div>
    <div id="cp-sonho-prev" style="margin-bottom:10px">${meu.url?`<img src="${esc(meu.url)}" style="max-width:140px;border-radius:12px">`:''}</div>
    <button class="btn pri" style="width:100%" id="cp-sonho-ok" onclick="cpSonhoSalvar()"><i class="ti ti-heart"></i> Salvar no mural</button>`);
}
async function cpSonhoFoto(inp){ try{ CP._fotoSonho = await cpFoto(inp.files[0], 900); $('#cp-sonho-prev').innerHTML = `<img src="${CP._fotoSonho}" style="max-width:140px;border-radius:12px">`; }catch(e){ toast(e.message, true); } }
async function cpSonhoSalvar(){
  const b = $('#cp-sonho-ok'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Salvando…'; }
  try{ const r = await cpApi('sonho', {texto:$('#cp-sonho-tx').value, img:CP._fotoSonho||''}); CP.sonhos = r.sonhos; fecharModal(); toast('Sonho no mural 💭✨'); cpConfete(40); render(); }
  catch(e){ toast(e.message, true); if(b){ b.disabled = false; b.innerHTML = '<i class="ti ti-heart"></i> Salvar no mural'; } }
}

/* ───────── tela da equipe ───────── */
function cpRepintar(){ if(typeof modalAberto==='function' && modalAberto()) return; const ae = document.activeElement; if(ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;
  if((S.tela==='portal' && (S.portalTab==='campanha' || S.portalTab==='inicio')) || (S.tela==='admin' && (S.adm?.tab==='campanha' || S.adm?.tab==='central'))) render(); }
function cpTela(){
  const c = cpD();
  if(!c) return `<h2 class="secao">🎯 Campanha do mês</h2>`+cpVazio('🛠️','A campanha ainda não foi ligada no servidor','Avise a administração.');
  if(c.erro) return `<h2 class="secao">🎯 Campanha do mês</h2><p class="suave">${esc(c.erro)}</p>`;
  if(!c.ativa) return `<h2 class="secao">🎯 Campanha do mês</h2>`+cpVazio('⏸️','A campanha está pausada','Quando a administração ligar de novo, os jogos voltam a aparecer aqui.');
  const subs = c.participa ? [['raspadinha','ti-ticket','Raspadinha',(c.raspadinhas||[]).length],['bingo','ti-grid-dots','Bingo'],['ouro','ti-clock-hour-3','Hora de Ouro'],['ranking','ti-trophy','Ranking'],['sonhos','ti-sparkles','Mural dos sonhos']]
                           : [['ouro','ti-clock-hour-3','Hora de Ouro'],['ranking','ti-trophy','Ranking'],['sonhos','ti-sparkles','Mural dos sonhos']];
  if(typeof msSubs==='function') msSubs(c, subs);      /* v54: Missão do Dia (missao.js) */
  const sub = subs.some(s=>s[0]===CP.sub) ? CP.sub : subs[0][0];
  const corpo = ({missao:()=>msTela(c), raspadinha:()=>cpRaspadinha(c), bingo:()=>cpBingo(c), ouro:()=>cpOuro(c), ranking:()=>cpRanking(c), sonhos:cpSonhos})[sub]();
  return `<div class="linha entre quebra" style="gap:8px;margin-bottom:10px"><h2 class="secao" style="margin:0">🎯 Campanha do mês</h2><button class="icone" title="Atualizar" onclick="cpRecarregar()"><i class="ti ti-refresh"></i></button></div>
    ${c.participa?cpTopo(c):`<div class="nota info" style="margin-bottom:12px"><i class="ti ti-heart-handshake"></i><div>Você está como <b>suporte</b> este mês: não entra na meta nem nos jogos de venda, mas a Hora de Ouro, o ranking e o mural dos sonhos são seus também 💛</div></div>`}
    <div class="cp-hub">${subs.map(([k,i,n,b])=>`<button class="${sub===k?'on':''}" onclick="CP.sub='${k}';render()"><i class="ti ${i}"></i>${n}${b?`<span class="contador">${b}</span>`:''}</button>`).join('')}</div>
    ${corpo}`;
}
async function cpRecarregar(){
  CP.ouro = null; CP.rank = null; CP.sonhos = null;
  try{ S.sess.dados = await api('dados', {eid:S.sess.eid, ...S.sess.cred}); }catch(e){ toast(e.message, true); }
  render();
}

/* cartão no Início da vendedora */
function cpCartaoInicio(){
  const c = cpD(); if(!c || c.erro || !c.ativa) return '';
  const r = (c.raspadinhas||[]).length, st = cpOuroAgora(c.janela), falta = Math.max(0, c.valor_dia - (c.hoje||0));
  const ouro = st==='agora' ? `<button class="ouro" onclick="S.portalTab='campanha';CP.sub='ouro';CP.ouro=null;render()"><span class="ic">⏰</span><span><b>É Hora de Ouro!</b><small>${c.chamadas_hoje||0} de ${c.qtd_ouro} clientes chamadas</small></span></button>` : '';
  const ms = typeof msInicio==='function' ? msInicio(c) : '';
  if(!c.participa) return (ouro||ms) ? `<div class="cp-ini">${ms}${ouro}</div>` : '';
  return `<div class="cp-ini">
    ${ms}
    ${r?`<button class="rasp" onclick="S.portalTab='campanha';CP.sub='raspadinha';render()"><span class="ic">🎟️</span><span><b>${r===1?'1 raspadinha':r+' raspadinhas'} para raspar!</b><small>toque para raspar</small></span></button>`
       :`<button onclick="S.portalTab='campanha';CP.sub='raspadinha';render()"><span class="ic">🎯</span><span><b>${falta?'Faltam '+brl(falta):'Valor do dia batido!'}</b><small>${falta?'para liberar a raspadinha de hoje':'boa! 🎉'}</small></span></button>`}
    ${ouro}
    ${c.bingo?`<button style="animation-delay:60ms" onclick="S.portalTab='campanha';CP.sub='bingo';render()"><span class="ic">🎱</span><span><b>Bingo ${c.bingo.feitos}/9</b><small>${c.bingo.cheia?'cartela cheia! 🏆':c.bingo.linhas.length?'linha fechada ✅':'cartela da semana'}</small></span></button>`:''}
  </div>`;
}

/* comemora depois da venda: raspadinha liberada, quadrado do bingo, linha, cartela */
function cpCompara(antes, depois){
  if(!antes || !depois || !depois.participa) return [];
  const msgs = [];
  if((depois.raspadinhas||[]).length > (antes.raspadinhas||[]).length) msgs.push('🎟️ Você bateu o valor do dia e liberou uma RASPADINHA!');
  const a = new Set((antes.bingo?.quadrados||[]).filter(q=>q.feito).map(q=>q.id));
  (depois.bingo?.quadrados||[]).filter(q=>q.feito && !a.has(q.id)).forEach(q=>msgs.push('🎱 Bingo: '+q.em+' '+q.t+' ✔'));
  (depois.bingo_novos||[]).forEach(p=>msgs.push(p.tipo==='bingo_cartela'?'🏆 CARTELA CHEIA! '+p.premio:'✅ Linha no bingo! '+p.premio));
  return msgs;
}
if(typeof pdvCelebrar === 'function'){
  const _pdvCelebrarCamp = pdvCelebrar;
  pdvCelebrar = function pdvCelebrar(){
    const r = _pdvCelebrarCamp.apply(this, arguments);
    try{ const msgs = cpCompara(CP.snap, cpD()); CP.snap = cpD();
      msgs.slice(0, 3).forEach((m,i)=>setTimeout(()=>{ toast(m); if(i===0) cpConfete(60); }, 3800 + i*2600)); }catch(e){}
    return r;
  };
}

/* guarda como estava a campanha antes de cada venda, para comemorar o que mudou */
const _apiCamp = api;
api = async function api(a, dados){ if(a==='venda' && S.sess) CP.snap = cpD() ? JSON.parse(JSON.stringify(cpD())) : null; return _apiCamp.apply(this, arguments); };

/* ───────── encaixe no portal da equipe ───────── */
function cpGrupos(){
  try{
    if(typeof GRUPOS_PORTAL !== 'undefined'){ const g = GRUPOS_PORTAL.find(x=>x.k.includes('metas')); if(g && !g.k.includes('campanha')) g.k.splice(g.k.indexOf('metas')+1, 0, 'campanha'); NOMES12.portal.campanha = 'Campanha do mês'; }
    if(typeof GRUPOS_ADM !== 'undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('metas')); if(g && !g.k.includes('campanha')) g.k.splice(g.k.indexOf('metas')+1, 0, 'campanha'); NOMES12.admin.campanha = 'Campanha do mês'; }
  }catch(e){}
}
function cpPatchMais(){
  if(window._cpMais || typeof portalMais !== 'function') return; window._cpMais = true;
  const base = portalMais;
  portalMais = function portalMais(){
    const g = typeof GRUPOS_PORTAL!=='undefined' ? GRUPOS_PORTAL.find(x=>x.k.includes('campanha')) : null, i = g ? g.k.indexOf('campanha') : -1;
    if(i >= 0) g.k.splice(i, 1);
    let h; try{ h = base(); } finally { if(i >= 0) g.k.splice(i, 0, 'campanha'); }
    const c = cpD(), n = (c?.raspadinhas||[]).length;
    const tile = `<button class="tile" style="--cor:var(--g-vendas)" onclick="S.portalTab='campanha';render()"><i class="ti ti-confetti"></i><b>Campanha do mês</b><small>${n?n+' raspadinha'+(n>1?'s':'')+' para raspar':'Raspadinha, bingo e ranking'}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
    const a = h.indexOf('<div class="tiles">');
    return a >= 0 ? h.slice(0, a+19) + tile + h.slice(a+19) : tile + h;
  };
}
const _telaPortalCamp = telaPortal;
telaPortal = function telaPortal(){
  cpGrupos(); cpPatchMais();
  const aqui = S.portalTab === 'campanha';
  let h;
  if(aqui){
    const orig = portalAtalhos; S.portalTab = 'atalhos'; portalAtalhos = () => cpTela();
    try{ h = _telaPortalCamp(); } finally { portalAtalhos = orig; S.portalTab = 'campanha'; }
    h = h.replace(`class="aba on" style="flex:0 0 auto" onclick="S.portalTab='atalhos'`, `class="aba " style="flex:0 0 auto" onclick="S.portalTab='atalhos'`);
  } else h = _telaPortalCamp();
  const c = cpD(), n = (c?.raspadinhas||[]).length;
  const btn = `<button class="aba ${aqui?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='campanha';S.protoAberto=null;render()"><i class="ti ti-confetti"></i> Campanha ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const a = h.indexOf(`onclick="S.portalTab='arena'`);
  if(a > 0){ const ini = h.lastIndexOf('<button', a); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _portalInicioCamp = portalInicio;
portalInicio = function portalInicio(){
  const h = _portalInicioCamp(), c = cpCartaoInicio();
  if(!c) return h;
  const i = h.indexOf('class="suave"'), f = i >= 0 ? h.indexOf('</div>', i) : -1;
  return f >= 0 ? h.slice(0, f+6) + c + h.slice(f+6) : c + h;
};

/* ───────── administração ───────── */
function cpAdmTela(){
  const A = CP.adm;
  if(!A){ cpAdmCarregar(); return `<div class="cpa-topo"><h2>🎯 Campanha do mês</h2><p><i class="ti ti-loader-2"></i> Carregando…</p></div>`; }
  if(A.erro) return `<div class="cpa-topo"><h2>🎯 Campanha do mês</h2></div><div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(A.erro)?'<b>Falta instalar o servidor da campanha.</b> Cole o arquivo CAMPANHA.gs no Apps Script e publique uma Nova versão.':esc(A.erro)}<br><button class="btn p" style="margin-top:8px" onclick="CP.adm=null;render()">Tentar de novo</button></div></div>`;
  const sub = ['resumo','missao','premios','prints','ranking','cartelas','sonhos','config'].includes(CP.admSub) ? CP.admSub : 'resumo';
  if(sub==='resumo') return cpAdmResumo();
  const nomes = {missao:'📲 Missão do Dia', premios:'🎁 Prêmios', prints:'📸 Prints', ranking:'🏆 Ranking e mensagem do grupo', cartelas:'🎱 Cartelas do bingo', sonhos:'💭 Mural dos sonhos', config:'⚙️ Configurar a campanha'};
  const corpo = ({missao:()=>msAdmTela(), premios:cpAdmPremios, prints:cpAdmPrints, ranking:cpAdmRanking, cartelas:cpAdmCartelas, sonhos:cpAdmSonhos, config:cpAdmConfig})[sub]();
  return `<button class="cpa-volta" onclick="CP.admSub='resumo';render()"><i class="ti ti-arrow-left"></i> Voltar para a campanha</button>
    <h2 class="cpa-tit">${nomes[sub]}</h2>${corpo}`;
}
/* tela principal: o que precisa de você + como está cada uma hoje + atalhos grandes */
function cpAdmResumo(){
  const A = CP.adm, R = A.ranking, cfg = A.cfg, mt = R.meta;
  const pend = A.premios.filter(p=>p.status==='entregar'), prn = A.prints.filter(p=>p.status==='pendente');
  const metaEq = mt.meta * Math.max(1, R.pessoas.length), pctEq = Math.min(100, R.equipe.mes / metaEq * 100), ritmo = R.dias_passados / R.dias_uteis * 100;
  const noRitmo = pctEq >= ritmo - 2;
  const tipo = t => t==='raspadinha'?'Raspadinha':t==='bingo_linha'?'Linha do bingo':'Cartela cheia';
  const precisa = [];
  if(typeof msAdmPrecisa==='function') msAdmPrecisa(precisa);
  prn.forEach(p=>precisa.push(`<div class="c34-it warn cpa-it"><img class="cpa-mini" src="${esc(p.url)}" alt="" onclick="window.open('${esc(p.url)}','_blank')">
      <span class="cresce"><b>${esc(p.colaboradora)} mandou um print</b><small>${esc(p.texto)} · confira se está certo</small></span>
      <span class="cpa-bts"><button class="btn pri" onclick="cpAdmPrint('${p.id}',true)"><i class="ti ti-check"></i> Aprovar</button><button class="btn" onclick="cpAdmPrint('${p.id}',false)">Recusar</button></span></div>`));
  pend.forEach(p=>precisa.push(`<div class="c34-it info cpa-it"><span class="c34-ic" style="background:var(--ouro-claro);color:#A86F00">🎁</span>
      <span class="cresce"><b>Entregar para ${esc(p.colaboradora)}: ${esc(p.premio)}</b><small>${tipo(p.tipo)} · ${p.tipo==='raspadinha'?cpRaspRef(p.ref):'semana de '+cpDia(p.ref)}</small></span>
      <span class="cpa-bts"><button class="btn pri" onclick="cpAdmEntregar('${esc(p.id)}')"><i class="ti ti-check"></i> Já entreguei</button></span></div>`));
  const cont = {}; (A.contatos.porPessoa||[]).forEach(p=>cont[p.id]=p);
  const pessoa = (p,i) => {
    const pctD = Math.min(100, p.hoje / R.valor_dia * 100), bateu = p.hoje >= R.valor_dia - .009, k = A.cartelas[p.id];
    const pctM = Math.min(100, p.mes / mt.meta * 100), falta = Math.max(0, mt.meta - p.mes);
    return `<div class="cpa-p" style="--k:${i}">
      <div class="cpa-p-top"><span class="cpa-av">${esc(iniciais(p.nome))}</span><b>${esc(p.nome)}</b>${p.nivel?`<span class="cp-ok">${p.nivel==='hiper'?'🚀 hiper':p.nivel==='super'?'🔥 super':'🎯 meta'}</span>`:''}</div>
      <div class="cpa-l"><span>Hoje</span><b>${brl(p.hoje)}</b><small>${bateu?'🎟️ liberou a raspadinha':'faltam '+brl(R.valor_dia-p.hoje)+' para a raspadinha'}</small><div class="cpa-b"><i style="width:${pctD}%;${bateu?'background:var(--ok)':''}"></i></div></div>
      <div class="cpa-l"><span>No mês</span><b>${brl(p.mes)}</b><small>${falta?'faltam '+brl(falta)+' para a meta':'meta batida!'}</small><div class="cpa-b"><i style="width:${pctM}%"></i></div></div>
      <div class="cpa-rod"><span title="Bingo da semana">🎱 ${p.bingo}/9${p.linhas?' ✅':''}</span><span title="Raspadinhas no mês">🎟️ ${p.raspadinhas}</span><span title="Clientes chamadas hoje na Hora de Ouro">⏰ ${(cont[p.id]||{}).hoje||0} hoje</span></div>
    </div>`; };
  const tile = (em, t, s, sub, n) => `<button class="cpa-tile" onclick="CP.admSub='${sub}';render()"><span class="em">${em}</span><b>${t}</b><small>${s}</small>${n?`<span class="contador">${n}</span>`:''}</button>`;
  return `<div class="cpa-topo"><div><h2>🎯 Campanha de ${nomeMes(R.mes).split(' ')[0].toLowerCase()} ${cfg.ativa?'':'<span class="cp-pend">pausada</span>'}</h2>
      <p>Dia ${R.dias_passados} de ${R.dias_uteis} · meta de cada uma ${brl(mt.meta)} · valor do dia ${brl(R.valor_dia)}</p></div>
      <button class="icone" title="Atualizar" onclick="CP.adm=null;render()"><i class="ti ti-refresh"></i></button></div>
    <button class="cpa-teste" onclick="cpDemo()"><span class="em">🎮</span><span class="cresce"><b>Testar os jogos como a equipe vê</b><small>Raspadinha e bingo de mentirinha — não grava nada e não conta prêmio</small></span><i class="ti ti-chevron-right"></i></button>
    <section class="cpa-eq ${noRitmo?'':'atras'}" style="margin-top:14px"><div class="linha entre quebra" style="gap:8px"><span><small>Equipe no mês</small><b class="num">${brl(R.equipe.mes)}</b><small>de ${brl(metaEq)} (a meta das ${R.pessoas.length} somada)</small></span>
      <span class="cpa-sit">${noRitmo?'✅ No ritmo':'⚠️ Abaixo do ritmo'}<small>${Math.round(pctEq)}% feito · o mês está em ${Math.round(ritmo)}%</small></span></div>
      <div class="cpa-b grande"><i style="width:${pctEq}%"></i><s style="left:${ritmo}%" title="onde deveria estar hoje"></s></div></section>
    <section class="c34-caixa ${precisa.length?'':'ok'}" style="margin-top:14px"><div class="c34-cab"><h3>${precisa.length?'O que precisa de você':'Tudo em dia ✨'}</h3>${precisa.length?`<span class="c34-n">${precisa.length}</span>`:''}</div>
      ${precisa.length?`<div class="c34-lista">${precisa.join('')}</div>`:`<p class="c34-vazio">Nenhum print para aprovar e nenhum prêmio para entregar. Quando alguém ganhar ou mandar print, aparece aqui.</p>`}</section>
    <h2 class="secao" style="margin-top:18px">Como está cada uma</h2>
    <div class="cpa-ps">${R.pessoas.map(pessoa).join('') || '<p class="suave">Ninguém participando — veja em Configurar.</p>'}</div>
    <h2 class="secao" style="margin-top:18px">Mais</h2>
    <div class="cpa-tiles">
      ${typeof msAdmTela==='function'?tile('📲','Missão do Dia','stories das ofertas, pontos e prints','missao', msAdmPend()):''}
      ${tile('🏆','Ranking da semana','e a mensagem pronta para o grupo','ranking')}
      ${tile('🎱','Cartelas do bingo','o que cada uma já marcou','cartelas')}
      ${tile('💭','Mural dos sonhos','pelo que cada uma está correndo','sonhos')}
      ${tile('🎁','Histórico de prêmios','tudo o que já foi ganho e entregue','premios')}
      ${tile('⚙️','Configurar','prêmios, horários e quem participa','config')}
    </div>
    <details class="cpa-como"><summary>❓ Como funciona a campanha</summary><ul>
      <li>🎟️ <b>Raspadinha:</b> vendeu ${brl(R.valor_dia)} no dia, ganha uma raspadinha no portal. O prêmio é sorteado pelo sistema e aparece aqui para você entregar.</li>
      <li>🎱 <b>Bingo:</b> cartela da semana que marca sozinha pelas vendas do PDV. Avaliação no Google e story precisam de print — você aprova aqui em cima. Fechou linha ou cartela, ganha prêmio.</li>
      <li>⏰ <b>Hora de Ouro:</b> no horário parado (Bosque ${esc(cfg.hora_ouro.bosque)}, Centro ${esc(cfg.hora_ouro.centro)}) cada uma chama clientes sumidas no WhatsApp.</li>
      <li>🏆 <b>Ranking</b> toda segunda no grupo e 💭 <b>mural dos sonhos</b> para lembrar o motivo.</li></ul></details>`;
}
async function cpAdmCarregar(){
  if(CP._c.adm) return; CP._c.adm = true;
  try{ CP.adm = await cpAdmApi('painel'); }catch(e){ CP.adm = {erro:e.message}; } finally{ CP._c.adm = false; }
  cpRepintar();
}
function cpAdmPremios(){
  const L = CP.adm.premios.filter(p=>!p.nada), pend = L.filter(p=>p.status==='entregar'), feitos = L.filter(p=>p.status==='entregue').slice(0, 30);
  const tipo = t => t==='raspadinha'?'🎟️ Raspadinha':t==='bingo_linha'?'🎱 Linha do bingo':'🏆 Cartela cheia';
  const it = (p,i,ok) => `<div class="cp-it ${ok?'ok':''}" style="animation-delay:${Math.min(i,12)*30}ms"><span class="av">${esc(iniciais(p.colaboradora))}</span><div class="t"><b>${esc(p.premio)}</b><small>${esc(p.colaboradora)} · ${tipo(p.tipo)} · ${p.tipo==='raspadinha'?cpRaspRef(p.ref):'semana de '+cpDia(p.ref)}${ok&&p.entregue_em?' · entregue '+cpDia(p.entregue_em.slice(0,10)):''}</small></div>
    ${ok?`<button class="btn p" onclick="cpAdmEntregar('${esc(p.id)}',true)">Desfazer</button>`:`<button class="btn pri" onclick="cpAdmEntregar('${esc(p.id)}')"><i class="ti ti-check"></i> Entregue</button>`}</div>`;
  return (pend.length?`<div class="cp-lista">${pend.map((p,i)=>it(p,i,false)).join('')}</div>`:cpVazio('🎁','Nenhum prêmio esperando entrega'))
    + (feitos.length?`<h3 class="secao" style="margin-top:14px">Já entregues</h3><div class="cp-lista">${feitos.map((p,i)=>it(p,i,true)).join('')}</div>`:'');
}
async function cpAdmEntregar(id, desfazer){ try{ await cpAdmApi('entregar', {id, desfazer:!!desfazer}); toast(desfazer?'Voltou para a lista':'Prêmio entregue ✔'); CP.adm = null; render(); }catch(e){ toast(e.message, true); } }
function cpAdmPrints(){
  const L = CP.adm.prints;
  if(!L.length) return cpVazio('📸','Nenhum print enviado ainda');
  return `<div class="cp-lista">${L.map((p,i)=>`<div class="cp-print" style="animation-delay:${Math.min(i,12)*30}ms"><img src="${esc(p.url)}" alt="print" loading="lazy" onclick="window.open('${esc(p.url).replace('&amp;sz=w800','&amp;sz=w1600')}','_blank')">
      <div><b>${esc(p.colaboradora)}</b> · ${esc(p.texto)}<br><small class="apagado">enviado ${cpDia(p.enviado_em.slice(0,10))} ${p.enviado_em.slice(11,16)} · semana de ${cpDia(p.semana)}</small>
      <div class="linha quebra" style="gap:6px;margin-top:8px">${p.status==='pendente'?`<button class="btn pri" onclick="cpAdmPrint('${p.id}',true)"><i class="ti ti-check"></i> Aprovar</button><button class="btn" onclick="cpAdmPrint('${p.id}',false)"><i class="ti ti-x"></i> Recusar</button>`:p.status==='aprovado'?'<span class="cp-ok">aprovado</span>':`<span class="cp-pend" style="color:var(--bad);background:var(--bad-bg)">recusado${p.obs?': '+esc(p.obs):''}</span>`}</div></div></div>`).join('')}</div>`;
}
async function cpAdmPrint(id, aprovar){
  let motivo = '';
  if(!aprovar){ motivo = prompt('Por que o print foi recusado? (ela vai ver este recado)', 'Não dá para ver direito — manda de novo?'); if(motivo === null) return; }
  try{ await cpAdmApi('print', {id, aprovar, motivo}); toast(aprovar?'Aprovado ✔ O quadrado já foi marcado.':'Recusado — ela pode mandar de novo.'); CP.adm = null; render(); }catch(e){ toast(e.message, true); }
}
function cpAdmRanking(){
  const R = CP.adm.ranking;
  return cpRankHtml(R, '') + `<div class="cartao pad" style="margin-top:12px"><b>📣 Mensagem para o grupo</b><p class="apagado" style="font-size:13px;margin:4px 0 8px">Pronta para colar no WhatsApp da equipe toda segunda.</p>
    <textarea class="inp" id="cp-msg" rows="10" style="font-family:inherit">${esc(cpMsgGrupo(R))}</textarea>
    <button class="btn pri" style="margin-top:8px" onclick="cpCopiar()"><i class="ti ti-copy"></i> Copiar mensagem</button></div>`;
}
function cpMsgGrupo(R){
  const med = ['🥇','🥈','🥉'], c = CP.adm.contatos;
  const linhas = R.pessoas.map((p,i)=>`${med[i]||'▫️'} *${p.nome}* — ${brl(p.semana)} na semana · ${brl(p.mes)} no mês${p.nivel?' '+(p.nivel==='hiper'?'🚀':p.nivel==='super'?'🔥':'🎯'):''}`);
  const bingo = R.pessoas.map(p=>`${p.nome} ${p.bingo}/9${p.linhas?' ✅':''}`).join(' · ');
  const ouro = (c.porPessoa||[]).filter(p=>p.mes).map(p=>`${p.nome} ${p.mes}`).join(' · ');
  return `*🏆 RANKING DA SEMANA* (${cpSemanaTxt(R.semana, R.ate)})\n\n${linhas.join('\n')}\n\n👥 *Equipe:* ${brl(R.equipe.semana)} na semana · ${brl(R.equipe.mes)} no mês\n🎯 *Meta de cada uma:* ${brl(R.meta.meta)} · super ${brl(R.meta.super)} · hiper ${brl(R.meta.hiper)}\n📅 *Valor do dia:* ${brl(R.valor_dia)} — bateu, raspou! 🎟️\n\n🎱 *Bingo:* ${bingo}${ouro?`\n⏰ *Hora de Ouro (clientes chamadas no mês):* ${ouro}`:''}\n\n_Bora pra cima que essa semana é nossa! 💋_`;
}
async function cpCopiar(){ const t = $('#cp-msg').value; try{ await navigator.clipboard.writeText(t); toast('Mensagem copiada ✔'); }catch(e){ $('#cp-msg').select(); document.execCommand('copy'); toast('Mensagem copiada ✔'); } }
function cpAdmCartelas(){
  const A = CP.adm, nomes = {}; A.colaboradoras.forEach(c=>nomes[c.id]=primeiroNome(c.nome));
  const ids = Object.keys(A.cartelas);
  if(!ids.length) return cpVazio('🎱','Ninguém participando');
  return `<div class="cp-grade" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${ids.map((id,i)=>{ const k = A.cartelas[id];
    return `<div class="cartao pad" style="animation:cpSobe .35s both;animation-delay:${i*60}ms"><div class="linha entre"><b>${esc(nomes[id]||id)}</b><span class="${k.cheia?'cp-ok':k.linhas.length?'cp-ok':'cp-pend'}">${k.feitos}/9${k.cheia?' 🏆':k.linhas.length?' ✅':''}</span></div>
      <div class="cp-bingo" style="gap:4px;margin-top:8px">${k.quadrados.map(q=>`<div class="cp-q ${q.feito?'feito':''} ${q.pendente?'pend':''}" style="font-size:10px;padding:4px;border-radius:10px" title="${esc(q.t)}"><span style="font-size:18px">${q.em}</span></div>`).join('')}</div></div>`; }).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin-top:8px">Semana ${cpSemanaTxt(A.ranking.semana, A.ranking.ate)}. Quadrados vermelhos foram marcados; amarelos esperam a aprovação do print.</p>`;
}
function cpAdmSonhos(){
  const L = CP.adm.sonhos;
  return L.length ? `<div class="cp-sonhos">${L.map((s,i)=>`<div class="cp-sonho" style="animation-delay:${i*70}ms"><div class="ft" ${s.url?`style="background-image:url('${esc(s.url)}')"`:''}>${s.url?'':'💭'}</div><div class="tx"><b>${esc(s.nome)}</b><p>${esc(s.texto||'')}</p></div></div>`).join('')}</div>
    <p class="apagado" style="font-size:12.5px;margin-top:8px">Use na conversa individual: pergunte o que falta para ela chegar lá.</p>` : cpVazio('💭','Ninguém colocou o sonho ainda','Peça na conversa individual do início do mês.');
}
function cpAdmConfig(){
  const c = CP.adm.cfg, rp = c.raspadinha.premios, tot = rp.filter(p=>p.ativo!==false).reduce((s,p)=>s+(Number(p.peso)||0),0)||1, ho = c.hora_ouro;
  CP._rp = rp.map(p=>({...p}));
  return `<div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 10px;font-size:16px">🎯 Metas e valor do dia</h3>
      <label class="linha" style="gap:8px;margin-bottom:10px;cursor:pointer"><input type="checkbox" id="cp-ativa" ${c.ativa?'checked':''}> Campanha ligada (desligue para pausar os jogos)</label>
      <div class="fid-g2"><div class="campo"><label>Valor do dia (libera a raspadinha)</label><input class="inp" id="cp-vdia" inputmode="decimal" value="${c.valor_dia}"></div>
      <div class="campo"><label>Vale a partir de</label><input class="inp" type="date" id="cp-ini" value="${esc(c.inicio)}"></div></div>
      <div class="fid-g2" style="grid-template-columns:repeat(3,1fr)"><div class="campo"><label>Meta (cada uma)</label><input class="inp" id="cp-m1" inputmode="decimal" value="${c.meta.meta}"></div><div class="campo"><label>Super</label><input class="inp" id="cp-m2" inputmode="decimal" value="${c.meta.super}"></div><div class="campo"><label>Hiper</label><input class="inp" id="cp-m3" inputmode="decimal" value="${c.meta.hiper}"></div></div>
      <div class="campo"><label>Quem participa dos jogos de venda</label><div class="linha quebra" style="gap:6px">${CP.adm.colaboradoras.map(x=>`<label class="selo" style="cursor:pointer"><input type="checkbox" class="cp-part" value="${x.id}" ${c.fora.includes(x.id)?'':'checked'}> ${esc(primeiroNome(x.nome))}</label>`).join('')}</div><small class="apagado">Desmarque quem é suporte (não entra na meta). Ela continua vendo a Hora de Ouro, o ranking e o mural.</small></div></div>
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 4px;font-size:16px">🎟️ Prêmios da raspadinha</h3><p class="apagado" style="font-size:13px;margin:0 0 10px">O peso é a chance de sair. Ex.: chocolate 30 e "tente amanhã" 35 → o chocolate sai em ~30% das raspadinhas.</p>
      <div id="cp-rp">${rp.map((p,i)=>cpAdmLinhaPremio(p,i,tot)).join('')}</div>
      <button class="btn p" style="margin:6px 0 10px" onclick="cpAdmMaisPremio()"><i class="ti ti-plus"></i> Prêmio</button>
      <div class="campo" style="max-width:220px"><label>A raspadinha vale por (dias)</label><input class="inp" type="number" id="cp-val" min="1" max="31" value="${c.raspadinha.validade_dias}"></div></div>
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 10px;font-size:16px">🎱 Prêmios do bingo</h3>
      <div class="campo"><label>Fechou uma linha</label><input class="inp" id="cp-bl" maxlength="120" value="${esc(c.bingo.premio_linha)}"></div>
      <div class="campo"><label>Cartela cheia</label><input class="inp" id="cp-bc" maxlength="120" value="${esc(c.bingo.premio_cartela)}"></div>
      <small class="apagado">Cada prêmio sai uma vez por semana por vendedora.</small></div>
    <div class="cartao pad" style="margin-bottom:12px"><h3 style="margin:0 0 10px;font-size:16px">⏰ Hora de Ouro</h3>
      <div class="fid-g2"><div class="campo"><label>Bosque (ex.: 15:00-16:00)</label><input class="inp" id="cp-hb" value="${esc(ho.bosque)}"></div><div class="campo"><label>Centro</label><input class="inp" id="cp-hc" value="${esc(ho.centro)}"></div></div>
      <div class="fid-g2" style="grid-template-columns:repeat(3,1fr)"><div class="campo"><label>Clientes por dia</label><input class="inp" type="number" id="cp-hq" min="1" max="30" value="${ho.qtd}"></div><div class="campo"><label>"Sumida" depois de (dias)</label><input class="inp" type="number" id="cp-hs" min="7" value="${ho.dias_sumida}"></div><div class="campo"><label>Não chamar de novo por (dias)</label><input class="inp" type="number" id="cp-hp" min="1" value="${ho.pausa_dias}"></div></div>
      <div class="campo"><label>Mensagem pronta ({nome} = cliente, {vendedora} = quem chama)</label><textarea class="inp" id="cp-hm" rows="3" maxlength="500">${esc(ho.mensagem)}</textarea></div>
      <label class="linha" style="gap:8px;cursor:pointer"><input type="checkbox" id="cp-hw" ${ho.mostrar_whats!==false?'checked':''}> Botão "Chamar" abre o WhatsApp da cliente (a equipe continua vendo só o final do número)</label></div>
    <button class="btn pri" style="width:100%" onclick="cpAdmSalvar()"><i class="ti ti-device-floppy"></i> Salvar a campanha</button>`;
}
function cpAdmLinhaPremio(p, i, tot){
  return `<div class="linha quebra cp-rp-l" data-i="${i}" style="gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid var(--linha2)">
    <input class="inp cp-rp-em" style="width:58px;text-align:center" maxlength="4" value="${esc(p.emoji||'')}" placeholder="🎁">
    <input class="inp cp-rp-nm" style="flex:1 1 160px" maxlength="60" value="${esc(p.nome)}" placeholder="Nome do prêmio">
    <input class="inp cp-rp-ps" type="number" min="0" style="width:80px" value="${Number(p.peso)||0}" title="peso (chance)">
    <small class="apagado" style="width:46px">${p.ativo!==false?Math.round((Number(p.peso)||0)/tot*100)+'%':'—'}</small>
    <label class="selo" style="cursor:pointer" title="Não é prêmio (tente amanhã)"><input type="checkbox" class="cp-rp-nd" ${p.nada?'checked':''}> sem prêmio</label>
    <label class="selo" style="cursor:pointer"><input type="checkbox" class="cp-rp-at" ${p.ativo!==false?'checked':''}> ativo</label>
    <input type="hidden" class="cp-rp-id" value="${esc(p.id||'')}"></div>`;
}
function cpAdmMaisPremio(){ const box = $('#cp-rp'); const n = box.querySelectorAll('.cp-rp-l').length; box.insertAdjacentHTML('beforeend', cpAdmLinhaPremio({nome:'', emoji:'🎁', peso:10, ativo:true}, n, 100)); box.lastElementChild.querySelector('.cp-rp-nm').focus(); }
async function cpAdmSalvar(){
  const premios = [...document.querySelectorAll('.cp-rp-l')].map(l=>({id:l.querySelector('.cp-rp-id').value, emoji:l.querySelector('.cp-rp-em').value.trim(), nome:l.querySelector('.cp-rp-nm').value.trim(), peso:+l.querySelector('.cp-rp-ps').value, nada:l.querySelector('.cp-rp-nd').checked, ativo:l.querySelector('.cp-rp-at').checked})).filter(p=>p.nome);
  const fora = [...document.querySelectorAll('.cp-part')].filter(x=>!x.checked).map(x=>x.value);
  const valor = { ativa:$('#cp-ativa').checked, valor_dia:$('#cp-vdia').value, inicio:$('#cp-ini').value, meta:{meta:$('#cp-m1').value, super:$('#cp-m2').value, hiper:$('#cp-m3').value}, fora,
    raspadinha:{validade_dias:+$('#cp-val').value, premios}, bingo:{premio_linha:$('#cp-bl').value, premio_cartela:$('#cp-bc').value},
    hora_ouro:{bosque:$('#cp-hb').value, centro:$('#cp-hc').value, qtd:+$('#cp-hq').value, dias_sumida:+$('#cp-hs').value, pausa_dias:+$('#cp-hp').value, mensagem:$('#cp-hm').value, mostrar_whats:$('#cp-hw').checked} };
  try{ const r = await cpAdmApi('cfg', {valor}); CP.adm.cfg = r.cfg; toast('Campanha salva ✔'); CP.adm = null; render(); }catch(e){ toast(e.message, true); }
}

const _telaAdminCamp = telaAdmin;
telaAdmin = function telaAdmin(){
  cpGrupos(); try{ cpGancho34(); }catch(e){}
  const A = S.adm, aqui = A.tab === 'campanha';
  let h;
  if(aqui){
    /* desenha a casca da tela "Atalhos" (existe nos dois perfis) com um marcador no lugar do conteúdo e troca pelo da campanha */
    const orig = admAtalhos, marca = '<!--cp-adm-conteudo-->';
    A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminCamp(); } finally { admAtalhos = orig; A.tab = 'campanha'; }
    const i = h.indexOf(marca);
    h = i >= 0 ? h.slice(0, i) + cpAdmTela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminCamp();
  const n = CP.adm && !CP.adm.erro ? CP.adm.premios.filter(p=>p.status==='entregar').length + CP.adm.prints.filter(p=>p.status==='pendente').length : 0;
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='campanha';TR=null;render()"><i class="ti ti-confetti"></i> Campanha ${n?`<span class="contador">${n}</span>`:''}</button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaCamp = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaCamp(), adm = !!(S.adm && S.tela==='admin');
  if(adm || S.sess) r.unshift({t:'Campanha do mês', s:'Raspadinha, bingo, hora de ouro, ranking e mural dos sonhos', i:'ti-confetti', go:()=>{ if(adm) S.adm.tab='campanha'; else { S.tela='portal'; S.portalTab='campanha'; } render(); }});
  return r;
};
/* sai da sessão: esquece o que era da vendedora */
const _sairCamp = typeof sair==='function' ? sair : null;
if(_sairCamp) sair = function sair(){ Object.assign(CP, {ouro:null, rank:null, sonhos:null, snap:null}); return _sairCamp.apply(this, arguments); };

/* "O que precisa de mim hoje" (Início da Administração, v34): prints para aprovar e prêmios para entregar */
function cpGancho34(){
  if(window._cp34 || typeof itens34 !== 'function') return; window._cp34 = true;
  const _itens34Camp = itens34;
  itens34 = function itens34(){
    const I = _itens34Camp.apply(this, arguments);
    try{
      if(!CP.adm){ cpAdmCarregar(); return I; }
      if(CP.adm.erro) return I;
      const prn = CP.adm.prints.filter(p=>p.status==='pendente'), pend = CP.adm.premios.filter(p=>p.status==='entregar');
      const ir = () => { S.adm.tab = 'campanha'; CP.admSub = 'resumo'; };
      if(prn.length) I.push({c:'warn', i:'ti-photo-check', t:`${prn.length===1?'1 print':prn.length+' prints'} do bingo para aprovar`, s:prn.slice(0,3).map(p=>p.colaboradora).join(' · '), b:'Aprovar', go:ir});
      if(pend.length) I.push({c:'info', i:'ti-gift', t:`${pend.length===1?'1 prêmio':pend.length+' prêmios'} da campanha para entregar`, s:pend.slice(0,3).map(p=>p.colaboradora+': '+p.premio).join(' · '), b:'Ver', go:ir});
      if(typeof msAdm34==='function') msAdm34(I);
    }catch(e){}
    return I;
  };
}

/* modo teste da administração: raspadinha e bingo de mentirinha (nada vai para o servidor) */
function cpDemo(aba){
  aba = aba || 'raspa';
  const tabs = `<div class="cp-hub" style="justify-content:center"><button class="${aba==='raspa'?'on':''}" onclick="cpDemo('raspa')">🎟️ Raspadinha</button><button class="${aba==='bingo'?'on':''}" onclick="cpDemo('bingo')">🎱 Bingo</button></div>`;
  if(aba==='raspa'){
    const ps = (CP.adm?.cfg?.raspadinha?.premios||[]).filter(p=>p.ativo!==false && Number(p.peso)>0);
    const tot = ps.reduce((s,p)=>s+Number(p.peso),0); let r = Math.random()*tot, e = ps[ps.length-1] || {nome:'Chocolate', emoji:'🍫'};
    for(const p of ps){ r -= Number(p.peso); if(r < 0){ e = p; break; } }
    const pr = {premio:(e.emoji?e.emoji+' ':'')+e.nome, nada:!!e.nada};
    cpModal('🎮 Teste · Raspadinha', `${tabs}<p style="text-align:center;margin:0 0 8px" class="suave">Raspe com o dedo (ou com o mouse) 👇 — é só teste, sorteio de verdade com os seus prêmios</p>
      <div class="cp-raspa"><div class="premio"><span class="em">${esc(e.emoji||'🎁')}</span><b>${esc(e.nome)}</b><small class="suave">${e.nada?'Amanhã tem mais!':'A administração entrega para você 💋'}</small></div><canvas id="cp-canvas"></canvas></div>
      <p id="cp-raspa-fim" style="text-align:center;min-height:22px;font-weight:800;margin:0"></p>
      <div class="linha" style="gap:8px;margin-top:8px"><button class="btn" style="flex:1" onclick="cpDemo('raspa')"><i class="ti ti-refresh"></i> Outra raspadinha</button><button class="btn pri" style="flex:1" onclick="fecharModal()">Fechar</button></div>`);
    setTimeout(()=>cpPrepararRaspa(pr), 30);
  } else {
    const feitos = new Set(['r300','pecas3','meta_dia','casada']);
    const q = (CP.adm?.bingo||[]).map((b,i)=>({...b, i, feito:feitos.has(b.id), como:'auto', quando:'', pendente:b.id==='avaliacao', recusado:''}));
    const fake = {participa:true, bingo_premios:CP.adm?.cfg?.bingo||{}, bingo:{semana:'', ate:'', quadrados:q, linhas:[[0,1,2].every(i=>q[i]?.feito)?[0,1,2]:null,[3,4,5].every(i=>q[i]?.feito)?[3,4,5]:null].filter(Boolean), feitos:q.filter(x=>x.feito).length, cheia:false}};
    let h = cpBingo(fake).replace(/onclick="cpPrint\('[^']+'\)"/g, `onclick="toast('No teste o print não é enviado 😉')"`).replace('Cartela da semana · a ', 'Cartela de exemplo ');
    cpModal('🎮 Teste · Bingo', `${tabs}<p class="suave" style="text-align:center;margin:0 0 10px">Assim fica a cartela da vendedora: os quadrados vermelhos marcam sozinhos pelas vendas do PDV.</p>${h}`, true);
  }
}
