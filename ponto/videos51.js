/* ═══════════ v51: VÍDEOS DO PORTAL dentro do próprio portal ═══════════
   Pedido da Madu (04/11): "colocar esses vídeos dentro do próprio portal, pra quando alguém quiser assistir tá lá".
   • Os vídeos tutoriais (feitos no computador da loja, com narração) ficam no site em ponto/videos/NN.mp4.
   • No "Tirar dúvida": faixa "🎬 Vídeos do portal" no topo e, em cada resposta, "Ver o vídeo" toca aqui mesmo (sem sair do portal).
   • Se a administração colar outro link em Comunicação › Dúvidas › Vídeos da ajuda, vale o link dela.
   • Cada vídeo assistido vira uma linha na aba Duvidas (achou = video-NN), então entra nas métricas de "Dúvidas da equipe". */

const VID51 = [
  {n:'01', t:'Entrar no portal', d:'Nome, PIN e o menu'},
  {n:'02', t:'Bater o ponto', d:'Entrada, almoço, pausa e saída'},
  {n:'03', t:'Fazer uma venda no PDV', d:'Quem vendeu, pagamento e finalizar'},
  {n:'04', t:'Abrir, sangria e fechar o caixa', d:'Abertura às cegas, sangria, passagem e fechamento'},
  {n:'05', t:'Produtos e estoque', d:'Consultar, catálogo e produto novo'},
  {n:'07', t:'Metas, Arena e prêmios', d:'Metinhas, corrida e prêmios'},
  {n:'08', t:'Meu mês, escala e pedidos', d:'Banco de horas, folga, atestado'},
  {n:'09', t:'Tirar dúvida no portal', d:'Pergunte do seu jeito'},
];
const VID51_V = 'v51';
function vid51Url(n){ return `videos/${n}.mp4?${VID51_V}`; }
function vid51Capa(n){ return `videos/${n}.jpg?${VID51_V}`; }

(function(){
  const css = `
.vid51-faixa{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;margin:0 0 6px;scrollbar-width:thin}
.vid51-c{flex:0 0 168px;display:flex;flex-direction:column;justify-content:flex-start;align-self:stretch;border:0;background:#fff;border-radius:14px;padding:0;overflow:hidden;cursor:pointer;text-align:left;font:inherit;box-shadow:0 2px 10px rgba(0,0,0,.08);transition:transform .15s}
.vid51-c:hover{transform:translateY(-2px)}
.vid51-c .im{position:relative;aspect-ratio:16/9;background:#2a0508 center/cover no-repeat}
.vid51-c .im:after{content:'▶';position:absolute;inset:0;margin:auto;width:38px;height:38px;border-radius:50%;background:rgba(227,16,31,.92);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;padding-left:3px;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.vid51-c b{display:block;font-size:12.5px;line-height:1.25;padding:7px 9px 1px}
.vid51-c small{display:block;font-size:11px;color:var(--suave,#777);padding:0 9px 8px}
.vid51-veu{position:fixed;inset:0;z-index:100000;background:rgba(10,4,6,.86);display:flex;align-items:center;justify-content:center;padding:18px;animation:vid51In .2s ease}
@keyframes vid51In{from{opacity:0}to{opacity:1}}
.vid51-box{width:min(1100px,100%);background:#111;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.vid51-box video{display:block;width:100%;max-height:78vh;background:#000}
.vid51-cab{display:flex;align-items:center;gap:10px;padding:10px 14px;color:#fff}
.vid51-cab b{flex:1;font-size:15px}
.vid51-cab button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:7px 12px;font:inherit;cursor:pointer}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

function vid51Faixa(){
  return `<small class="aj46-sub">🎬 Vídeos do portal</small><div class="vid51-faixa">${VID51.map(v=>`<button class="vid51-c" onclick="vid51Abrir('${v.n}')"><div class="im" style="background-image:url('${vid51Capa(v.n)}')"></div><b>${esc(v.t)}</b><small>${esc(v.d)}</small></button>`).join('')}</div>`;
}
function vid51Abrir(n, urlExterna){
  const v = VID51.find(x=>x.n===n) || {n, t:'Vídeo '+n};
  document.getElementById('vid51')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div id="vid51" class="vid51-veu" onclick="if(event.target===this)vid51Fechar()">
    <div class="vid51-box"><div class="vid51-cab"><b>🎬 ${esc(v.t)}</b><button onclick="vid51Fechar()"><i class="ti ti-x"></i> Fechar</button></div>
    <video src="${esc(urlExterna||vid51Url(n))}" controls autoplay playsinline preload="auto" poster="${vid51Capa(n)}"></video></div></div>`);
  vid51Registrar(n, v.t);
}
function vid51Fechar(){ const e = document.getElementById('vid51'); if(e){ const vv = e.querySelector('video'); try{ vv.pause(); }catch(x){} e.remove(); } }
addEventListener('keydown', e=>{ if(e.key==='Escape' && document.getElementById('vid51')) vid51Fechar(); });
async function vid51Registrar(n, t){
  try{
    const s = S.sess; if(!s?.cred || typeof api!=='function') return;
    await api('duvida', {op:'registrar', eid:s.eid, ...s.cred, id:aj46Id(), pergunta:'▶ assistiu o vídeo '+n, achou:'video-'+n, achou_titulo:t, tela:S.portalTab||''});
  }catch(e){}
}

/* vídeo de cada resposta: link da administração ou o vídeo do próprio portal */
if(typeof aj46Video==='function'){
  const _v = aj46Video;
  aj46Video = function(g){ const u = _v(g); if(u) return u; return (g.v && VID51.some(x=>x.n===g.v)) ? vid51Url(g.v) : ''; };
}
if(typeof aj46Resposta==='function'){
  const _r = aj46Resposta;
  aj46Resposta = function(g){
    let h = _r(g);
    return h.replace(/<a class="btn" href="([^"]+)" target="_blank" rel="noopener">/, (m, href) => {
      const loc = href.startsWith('videos/');
      const arg = loc ? `'${esc(g.v)}'` : `'${esc(g.v||'')}','${href.replace(/'/g,'%27')}'`;
      return /drive\.google|youtu/.test(href) ? m : `<a class="btn" href="${href}" onclick="vid51Abrir(${arg});return false;">`;
    });
  };
}
if(typeof aj46PintarLista==='function'){
  const _p = aj46PintarLista;
  aj46PintarLista = function(){
    _p();
    try{
      const box = document.getElementById('aj46-lista');
      if(box && !AJ46.sel && !AJ46.ia && !AJ46.iaCarregando && !String(AJ46.q||'').trim()) box.insertAdjacentHTML('afterbegin', vid51Faixa());
    }catch(e){}
  };
}
/* respostas novas (v47/v48) apontam para o vídeo certo */
if(typeof AJ46_GUIA!=='undefined'){
  [['abrir-caixa','04'],['passagem-caixa','04'],['quem-vendeu','03'],['misto','03'],['relatorio-vendas','03']].forEach(([id,v])=>{ const g = AJ46_GUIA.find(x=>x.id===id); if(g && !g.v) g.v = v; });
  AJ46_GUIA.push({id:'videos', t:'Vídeos do portal (tutoriais)', p:'video videos tutorial tutoriais assistir aprender treinamento como usar', s:['Toque em "Tirar dúvida".','No topo aparecem os vídeos do portal: toque em um para assistir aqui mesmo.','Cada resposta também tem "Ver o vídeo" do assunto.'], ir:'', v:'01'});
}
