/* ═════════════════════ ADMINISTRAÇÃO › ROLETA DO SITE (v8) ═════════════════════
   Liga, desliga ou deixa em teste a roleta de prêmios do www.lasvegassexshop.com.br.
   Servidor: ponto/servidor/ROLETA.gs · Script do site: /site/roleta.js */
const ROLETA_SITE = 'https://www.lasvegassexshop.com.br';
const ROLETA_MODOS = {
  desligada: {i:'ti-power', n:'Desligada', s:'Ninguém vê a roleta no site.', cor:'var(--bad)', bg:'var(--bad-bg)'},
  teste:     {i:'ti-flask', n:'Só teste', s:'Só aparece em quem abriu o link de teste. Clientes não veem.', cor:'var(--warn)', bg:'var(--warn-bg)'},
  ligada:    {i:'ti-confetti', n:'Ligada', s:'Aparece para todas as clientes do site.', cor:'var(--ok)', bg:'var(--ok-bg)'},
};
const ROLETA_PREMIOS = [['5% OFF','GIRO5','30%'],['10% OFF','GIRO10','25%'],['Entrega R$ 0 (Rio Branco)','ENTREGA0','20%'],['Brinde surpresa (via WhatsApp)','BRINDEVEGAS','10%'],['15% OFF','GIRO15','5%']];

function admRoleta(){
  const R = S.adm.dados.roleta;
  if(!R) return `<div class="nota warn"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem a roleta.</b> Abra o Apps Script, crie o arquivo <b>ROLETA</b>, cole o código e publique uma nova versão.</div></div>`;
  if(R.erro) return `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div>Erro ao ler a roleta: ${esc(R.erro)}</div></div>`;
  const m = ROLETA_MODOS[R.modo] || ROLETA_MODOS.desligada;
  return `<style>
    .rol-modos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
    .rol-modos button{display:grid;gap:4px;justify-items:start;text-align:left;padding:14px;border-radius:14px;border:1.5px solid var(--linha,rgba(255,255,255,.12));background:transparent;color:inherit;cursor:pointer;font:inherit}
    .rol-modos button i{font-size:22px}
    .rol-modos button b{font-size:15px}
    .rol-modos button small{opacity:.75;font-size:12.5px;line-height:1.35}
    .rol-modos button.on{border-color:var(--c);background:var(--bg);box-shadow:0 0 0 1px var(--c) inset}
    .rol-modos button.on i{color:var(--c)}
    .rol-modos button:disabled{opacity:.6;cursor:wait}
    .rol-status{display:flex;align-items:center;gap:10px;font-size:15px}
    .rol-luz{width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 0 4px var(--bg)}
    @media (max-width:640px){.rol-modos{grid-template-columns:1fr}}
  </style>
  <div class="cartao pad" style="max-width:760px">
    <div class="rol-status" style="--c:${m.cor};--bg:${m.bg}"><span class="rol-luz"></span><div class="cresce"><b>Roleta do site: ${m.n}</b><div class="apagado" style="font-size:13px">${R.atualizado_em?'Mudou em '+esc(quando(R.atualizado_em)):'Ainda não foi alterada'} · o site atualiza em até 5 minutos</div></div></div>
    <div class="rol-modos">${Object.entries(ROLETA_MODOS).map(([k,o])=>`<button id="rol-${k}" class="${R.modo===k?'on':''}" style="--c:${o.cor};--bg:${o.bg}" onclick="admRoletaModo('${k}')"><i class="ti ${o.i}"></i><b>${o.n}</b><small>${o.s}</small></button>`).join('')}</div>
    <div class="nota info"><i class="ti ti-flask"></i><div><b>Para testar sem as clientes verem:</b> deixe em <b>Só teste</b> e abra o link abaixo no seu celular ou computador. A roleta aparece só nesse aparelho, com a etiqueta “Modo teste”, quantas vezes quiser.
      <div class="linha quebra" style="gap:8px;margin-top:10px"><a class="btn ouro" href="${ROLETA_SITE}/?roleta=teste" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Abrir o site em modo teste</a>
      <button class="btn" onclick="admRoletaCopiar()"><i class="ti ti-copy"></i> Copiar link de teste</button>
      <a class="btn p fantasma" href="${ROLETA_SITE}/?roleta=sair" target="_blank" rel="noopener">Sair do modo teste neste aparelho</a></div></div>
  </div>
  <h2 class="secao">Prêmios <small>todo giro ganha · cupons cadastrados na Nuvemshop</small></h2>
  <div class="tabela" style="max-width:760px"><table><thead><tr><th>Prêmio</th><th>Cupom</th><th>Chance</th></tr></thead><tbody>
    ${ROLETA_PREMIOS.map(([p,c,x])=>`<tr><td>${p}</td><td><span class="selo">${c}</span></td><td class="num">${x}</td></tr>`).join('')}</tbody></table></div>
  <p class="apagado" style="font-size:13px;margin-top:10px;max-width:760px">Para mudar prêmios, chances, textos ou cores, peça ao Claude: ele edita a roleta e você testa aqui antes de ligar. Os cupons ficam em Nuvemshop › Marketing › Cupons.</p>`;
}
async function admRoletaModo(modo){
  if(S.adm.dados.roleta?.modo === modo) return;
  document.querySelectorAll('.rol-modos button').forEach(b=>b.disabled=true);
  try{ S.adm.dados = await api('admConfig', {...S.adm.cred, chave:'roleta', valor:JSON.stringify({modo})}); render();
    toast({desligada:'Roleta desligada ✔', teste:'Roleta em modo teste ✔ Só quem abrir o link de teste vê.', ligada:'Roleta ligada para todas as clientes 🎰'}[modo]); }
  catch(e){ toast(e.message, true); render(); }
}
function admRoletaCopiar(){
  const url = ROLETA_SITE + '/?roleta=teste';
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(()=>toast('Link de teste copiado ✔')).catch(()=>toast(url));
}

/* ───────── encaixe na Administração sem mexer nos arquivos antigos ─────────
   Desenha a tela normal (usando a aba Regras como base) e troca o conteúdo pela Roleta. */
const _telaAdminV8 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, naRoleta = A.tab === 'roleta';
  if(naRoleta) A.tab = 'regras';
  let h = _telaAdminV8();
  if(naRoleta){
    A.tab = 'roleta';
    h = h.replace(admRegras(), ()=>admRoleta()).replace(`class="aba on" onclick="S.adm.tab='regras'`, `class="aba " onclick="S.adm.tab='regras'`);
  }
  const btn = `<button class="aba ${naRoleta?'on':''}" onclick="S.adm.tab='roleta';TR=null;render()"><i class="ti ti-confetti"></i> Roleta do site </button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV8 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV8();
  if(S.adm) r.unshift({t:'Roleta do site', s:'Liga, desliga ou testa a roleta', i:'ti-confetti', go:()=>{ S.adm.tab='roleta'; render(); }});
  return r;
};

/* v9: Estoque + entrada de mercadoria (Portal › Receber · Administração › Estoque) — carrega aqui, antes do app4 (que inicia o app) */
/* v10: depósito + contagem + transferências + saída + reposição + PDV ligado ao estoque (app11.js) */
document.write('<script src="app10.js?v=15"><\/script><script src="app11.js?v=15"><\/script>');
/* v13: fotos dos produtos + tela Produtos (catálogo, tirar foto, produto novo, link #produtos) */
document.write('<script src="app13.js?v=13"><\/script>');
/* v14: entrada nova (bater o ponto × entrar no portal) e portal no endereço principal, sem /ponto */
document.write('<script src="app14.js?v=14"><\/script>');
/* v15: link de fotos sem PIN (app15.js) — antes do app12, que fica por último */
document.write('<script src="app15.js?v=15j"><\/script>');
/* v16: Nuvemshop — conectar o site (API), importar produtos, estoque e pedidos (Administração › Nuvemshop) */
document.write('<script src="app16.js?v=16"><\/script>');
/* v15d: catálogo do site — categorias, nomes, descrição e preços pelo CSV da Nuvemshop (app17.js) */
document.write('<script src="app17.js?v=17b"><\/script>');
/* v18: Contagens com passo a passo, detalhes, corrigir produto, desfazer e apagar (app18.js) */
document.write('<script src="app18.js?v=18a"><\/script>');
/* v12: layout novo — tema claro, menu lateral agrupado e movimento (app12.js carrega o tema.css) */
document.write('<script src="app12.js?v=12"><\/script>');
