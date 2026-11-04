/* ═════════════════ v49: Início no computador — usa a largura toda ═════════════════
   No computador (tela larga) o Início da vendedora vira um painel em 2 colunas:
   esquerda  = meta, minhas vendas, raspadinha/bingo e "O que você precisa?"
   direita   = avisos/atendimento/pedidos do site, ponto de hoje, números, atalhos e o resto.
   Celular e tablet em pé continuam exatamente como antes (nada muda abaixo de 1200 px). */
const INI49_MIN = 1200;
const ini49Largo = () => window.innerWidth >= INI49_MIN;

function ini49Montar(){
  if(S.tela!=='portal' || S.portalTab!=='inicio' || !ini49Largo()) return;
  const w = document.querySelector('#app > .wrap') || document.querySelector('#app .wrap');
  if(!w || w.querySelector(':scope > .ini49-grade')) return;
  const filhos = [...w.children];
  const ola = filhos.find(c=>c.classList.contains('ola'));
  if(!ola) return;
  w.style.maxWidth = '';
  w.classList.add('ini49');

  /* topo: saudação + data à esquerda, "Voltar ao ponto" à direita (economiza uma linha inteira) */
  const data = ola.nextElementSibling && ola.nextElementSibling.classList.contains('suave') ? ola.nextElementSibling : null;
  const voltar = filhos.find(c=>c.classList.contains('voltar'));
  const topo = document.createElement('div'); topo.className = 'ini49-topo';
  const tx = document.createElement('div'); tx.className = 'ini49-ola';
  ola.before(topo); tx.append(ola); if(data) tx.append(data); topo.append(tx);
  if(voltar) topo.append(voltar);

  /* blocos depois da data → 2 colunas */
  const fim = filhos.findIndex(c=>c.id==='barra' || (c.tagName==='STYLE'));
  const ini = filhos.indexOf(data || ola) + 1;
  const blocos = filhos.slice(ini, fim < 0 ? undefined : fim).filter(c=>c.parentNode===w);
  if(!blocos.length) return;
  const grade = document.createElement('div'); grade.className = 'ini49-grade';
  const esq = document.createElement('div'); esq.className = 'ini49-col ini49-esq';
  const dir = document.createElement('div'); dir.className = 'ini49-col ini49-dir';
  grade.append(esq, dir);
  (fim >= 0 ? filhos[fim] : null) ? filhos[fim].before(grade) : w.append(grade);

  /* "Minhas vendas" + raspadinha/bingo numa linha só */
  const linhaVendas = document.createElement('div'); linhaVendas.className = 'ini49-vendas';
  const ehPrecisa = el => el.tagName==='H2' && /o que voc[eê] precisa/i.test(el.textContent);
  for(let i=0; i<blocos.length; i++){
    const b = blocos[i];
    if(b.classList.contains('mm46')) esq.append(b);
    else if(b.classList.contains('vr47-at') || b.classList.contains('cp-ini')){ if(!linhaVendas.parentNode) esq.append(linhaVendas); linhaVendas.append(b); }
    else if(ehPrecisa(b)){ esq.append(b); const prox = blocos[i+1]; if(prox && prox.classList.contains('atalhos')){ esq.append(prox); i++; } }
    else dir.append(b);
  }
  /* os quadradinhos de números (banco de horas, mês, pendências, meta da loja, checklist, escala) num só bloco */
  const nums = [...dir.children].filter(c=>c.classList.contains('numeros'));
  if(nums.length > 1){ const caixa = document.createElement('div'); caixa.className = 'ini49-nums'; nums[0].before(caixa); nums.forEach(n=>caixa.append(n)); }
  if(!esq.children.length){ /* nada para a esquerda (metas desligadas): divide ao meio pela ordem */
    const meio = Math.ceil(dir.children.length/2); [...dir.children].slice(0, meio).forEach(b=>esq.append(b));
  }
  if(linhaVendas.children.length===1) linhaVendas.classList.add('so1');
  if(!dir.children.length) grade.classList.add('uma');
}

const _renderV49 = render;
render = function(){
  const r = _renderV49.apply(this, arguments);
  try{ ini49Montar(); }catch(e){ console.warn('v49', e); }
  return r;
};

/* mudou de largo para estreito (ou o contrário)? redesenha */
let ini49Era = ini49Largo(), ini49T = null;
window.addEventListener('resize', ()=>{
  clearTimeout(ini49T);
  ini49T = setTimeout(()=>{ const agora = ini49Largo(); if(agora!==ini49Era){ ini49Era = agora; if(S.tela==='portal' && S.portalTab==='inicio') render(); } }, 180);
});

document.head.insertAdjacentHTML('beforeend', `<style id="ini49-css">
@media (min-width:${INI49_MIN}px){
  .wrap.ini49{max-width:1480px}
  .ini49-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:2px 0 18px}
  .ini49-topo .ola{margin-bottom:2px!important}
  .ini49-topo .suave{margin-bottom:0!important}
  .ini49-topo .voltar{margin:0;flex:0 0 auto}
  .ini49-grade{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(340px,1fr);gap:20px;align-items:start}
  .ini49-grade.uma{grid-template-columns:1fr}
  .ini49-col{display:flex;flex-direction:column;gap:14px;min-width:0}
  .ini49-col>*{margin-top:0!important;margin-bottom:0!important}
  .ini49-col>h2.secao{margin:6px 0 -4px!important}
  .ini49-vendas{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.6fr);gap:12px;align-items:stretch}
  .ini49-vendas.so1{grid-template-columns:1fr}
  .ini49-vendas>*{margin:0!important;height:100%}
  .ini49-vendas .cp-ini{height:100%}
  .ini49-vendas .cp-ini>*{height:100%}
  .ini49-esq .atalhos{grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .ini49-esq .atalhos button{min-height:104px}
  .ini49-nums{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ini49-nums>.numeros{display:contents}
  .ini49-dir .numeros:not(.ini49-nums .numeros){grid-template-columns:1fr 1fr!important}
  .ini49-dir .grade-atalhos{grid-template-columns:1fr 1fr!important}
  .ini49-dir .grade-atalhos>:last-child:nth-child(odd){grid-column:1/-1}
  .ini49-dir .atalhos{grid-template-columns:1fr 1fr!important}
}
@media (min-width:1700px){
  .ini49-grade{grid-template-columns:minmax(0,1.55fr) minmax(400px,1fr);gap:24px}
  .ini49-nums{grid-template-columns:1fr 1fr 1fr}
}
@media (min-width:${INI49_MIN}px) and (max-width:1599px){
  .ini49-vendas{grid-template-columns:1fr}
}
</style>`);
