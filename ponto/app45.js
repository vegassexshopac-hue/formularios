/* ═══════════ Portal Equipe Las Vegas · v45 — "O que a equipe vê" + "Começar pra valer" ═══════════
   Pedido da Madu (04/11, fase de adaptação): liberar o portal para as vendedoras aos poucos.
   • Administração › Ajustes › "O que a equipe vê" (só no perfil Matheus): uma chave por tela do portal das
     vendedoras (Kommo, Arena, Metas…). Desligada, a tela some do menu, da barra do celular, do "Mais" e dos
     atalhos do Início. Bater o ponto e o Início nunca somem. Botão "Fase de adaptação" liga só o essencial.
   • Na mesma tela: "Zerar os testes" — mostra aba por aba o que vai sair, faz uma cópia da planilha e apaga
     os registros de teste (servidor VALER.gs, ação admZerarTestes).
   • A lista de telas desligadas fica na planilha (Config › modulos) e chega para todas pelo boot/entrar
     (campo modulosOff). Sem o VALER.gs publicado, nada some (o portal mostra tudo, como antes).
   Nomes internos: MOD45, mod45…, Z45. */

const MOD45_LISTA = [
  {g:'Vendas', k:'pdv',       n:'Vender (PDV)',            s:'Caixa da loja, comanda e comprovante', ic:'ti-shopping-cart'},
  {g:'Vendas', k:'estoque',   n:'Estoque e produtos',      s:'Produtos, fotos, "tem na loja?", receber', ic:'ti-packages'},
  {g:'Vendas', k:'site',      n:'Pedidos do site',         s:'Separar, enviar e entregar os pedidos da Nuvemshop', ic:'ti-truck-delivery'},
  {g:'Vendas', k:'whats',     n:'Atendimento · Kommo',     s:'Clientes esperando, tarefas e funil', ic:'ti-messages'},
  {g:'Vendas', k:'arena',     n:'Arena de vendas',         s:'Corrida da meta ao vivo e ranking', ic:'ti-flame'},
  {g:'Vendas', k:'metas',     n:'Metas e prêmios',         s:'Meta do mês e premiação', ic:'ti-trophy'},
  {g:'Vendas', k:'campanha',  n:'Campanha do mês',         s:'Missões, prints e prêmios da campanha', ic:'ti-target-arrow'},
  {g:'Meu dia', k:'caixa',    n:'Caixa e sangria',         s:'Sangria e fechamento do caixa', ic:'ti-cash-banknote'},
  {g:'Meu dia', k:'checklist',n:'Checklist do dia',        s:'Abertura até o fechamento', ic:'ti-checklist'},
  {g:'Meu dia', k:'mural',    n:'Mural de avisos',         s:'Recados da administração', ic:'ti-speakerphone'},
  {g:'Meu dia', k:'agenda',   n:'Agenda da equipe',        s:'Folgas, eventos e campanhas', ic:'ti-calendar-event'},
  {g:'Meu ponto', k:'mes',    n:'Meu mês',                 s:'Espelho do ponto e banco de horas', ic:'ti-calendar-stats'},
  {g:'Meu ponto', k:'escala', n:'Minha escala',            s:'Loja e turno de cada dia', ic:'ti-calendar-time'},
  {g:'Meu ponto', k:'pedidos',n:'Meus pedidos',            s:'Correção, atestado e folga', ic:'ti-send'},
  {g:'Aprender', k:'protocolos', n:'Protocolos',           s:'O manual da loja (POP)', ic:'ti-book'},
  {g:'Aprender', k:'treino',  n:'Treinamento',             s:'Trilha da equipe', ic:'ti-school'},
  {g:'Aprender', k:'atalhos', n:'Atalhos',                 s:'Links úteis', ic:'ti-apps'}
];
/* fase de adaptação: o que entra no 1º dia (ponto, PDV, produtos, caixa e o que é do ponto) */
const MOD45_ADAPTACAO = ['pdv','estoque','site','caixa','mes','escala','pedidos','mural'];
const MOD45 = { off: [], tem: false, adm: null, rascunho: null, salvando: false, erro: '' };
try{ const g = JSON.parse(localStorage.getItem('lv_modulos45')||'null'); if(g && Array.isArray(g.off)){ MOD45.off = g.off; MOD45.tem = true; } }catch(e){}

const mod45On = k => !MOD45.off.includes(k);
function mod45Guardar(off){
  if(!Array.isArray(off)) return;
  MOD45.off = off.slice(); MOD45.tem = true;
  try{ localStorage.setItem('lv_modulos45', JSON.stringify({off:MOD45.off, em:Date.now()})); }catch(e){}
}
/* toda resposta do servidor que traz modulosOff atualiza a lista (boot, entrar, dados, admDados…) */
const _apiV45 = api;
api = async function api(){
  const j = await _apiV45.apply(this, arguments);
  try{ if(j && Array.isArray(j.modulosOff)) mod45Guardar(j.modulosOff); }catch(e){}
  return j;
};

/* ───────── portal das vendedoras: esconde o que está desligado ───────── */
const MOD45_RE = /portalTab\s*=\s*['"]([\w-]+)['"]/;
function mod45Limpar(){
  if(S.tela!=='portal' || !MOD45.off.length) return;
  const w = document.querySelector('#app > .wrap'); if(!w) return;
  w.querySelectorAll('[onclick]').forEach(el=>{
    const m = (el.getAttribute('onclick')||'').match(MOD45_RE);
    if(m && !mod45On(m[1]) && el !== w) el.remove();
  });
  // grupos do "Mais" (celular) que ficaram sem nenhum bloco
  w.querySelectorAll('.mais-g').forEach(g=>{ const t = g.querySelector('.tiles'); if(t && !t.children.length) g.remove(); });
}
const _renderV45 = render;
render = function(){
  if(S.tela==='portal' && S.portalTab && !['inicio','eu','mais'].includes(S.portalTab) && !mod45On(S.portalTab)){ S.portalTab = 'inicio'; S.protoAberto = null; }
  _renderV45.apply(this, arguments);
  try{ mod45Limpar(); }catch(e){ console.warn('v45', e); }
};
/* cartões do Início que levam a telas desligadas (e que nem precisam carregar) */
if(typeof kmCartaoInicio==='function'){ const _k = kmCartaoInicio; kmCartaoInicio = function(){ return (S.tela==='portal' && !mod45On('whats')) ? '' : _k.apply(this, arguments); }; }
if(typeof cpCartaoInicio==='function'){ const _c = cpCartaoInicio; cpCartaoInicio = function(){ return (S.tela==='portal' && !mod45On('campanha')) ? '' : _c.apply(this, arguments); }; }
/* a busca (Ctrl+K) da vendedora também não oferece o que está desligado */
if(typeof itensBusca==='function'){
  const _ib = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ib.apply(this, arguments);
    if(S.tela!=='portal' || !MOD45.off.length) return r;
    return r.filter(x=>{ const m = String(x.go||'').match(MOD45_RE); return !(m && !mod45On(m[1])); });
  };
}

/* ───────── Administração › Ajustes › "O que a equipe vê" (perfil Matheus) ───────── */
async function mod45Carregar(forcar){
  if(!S.adm || (MOD45.adm && !forcar) || MOD45._c) return;
  MOD45._c = true;
  try{ MOD45.adm = await api('admModulos', {...S.adm.cred}); MOD45.erro = ''; mod45Guardar(MOD45.adm.off); MOD45.rascunho = null; }
  catch(e){ MOD45.adm = {erro: e.message}; }
  finally{ MOD45._c = false; }
  if(S.tela==='admin' && S.adm?.tab==='modulos') render();
}
function mod45Rasc(){ if(!MOD45.rascunho) MOD45.rascunho = (MOD45.adm && Array.isArray(MOD45.adm.off) ? MOD45.adm.off : MOD45.off).slice(); return MOD45.rascunho; }
function mod45Mudou(){ const a = (MOD45.adm?.off||[]).slice().sort().join(','), b = mod45Rasc().slice().sort().join(','); return a !== b; }
function mod45Toggle(k){
  const r = mod45Rasc(), i = r.indexOf(k);
  if(i >= 0) r.splice(i, 1); else r.push(k);
  render();
}
function mod45Preset(qual){
  MOD45.rascunho = qual==='tudo' ? [] : MOD45_LISTA.map(x=>x.k).filter(k=>!MOD45_ADAPTACAO.includes(k));
  MOD45.fase = qual==='tudo' ? 'tudo' : 'adaptacao';
  render();
}
async function mod45Salvar(){
  if(MOD45.salvando) return;
  MOD45.salvando = true; render();
  try{
    MOD45.adm = await api('admModulos', {...S.adm.cred, op:'salvar', off:mod45Rasc(), fase:MOD45.fase||'', por:(S.adm.perfil==='madu'?'Madu':'Matheus')});
    mod45Guardar(MOD45.adm.off); MOD45.rascunho = null;
    toast('Pronto ✔ As vendedoras veem a mudança na próxima vez que o portal atualizar');
    try{ chuvaConfete(); }catch(e){}
  }catch(e){ toast(e.message, true); }
  finally{ MOD45.salvando = false; render(); }
}
function mod45Sw(on, oc){ return `<button class="mod45-sw ${on?'on':''}" role="switch" aria-checked="${on}" onclick="${oc}"><i></i></button>`; }

function mod45Tela(){
  const A = MOD45.adm;
  if(!A){ mod45Carregar(); return `<div class="mod45-topo"><h2>👀 O que a equipe vê</h2><p><i class="ti ti-loader-2"></i> Carregando…</p></div>`; }
  if(A.erro){
    const falta = /desconhecida/i.test(A.erro);
    return `<div class="mod45-topo"><h2>👀 O que a equipe vê</h2></div><div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${falta
      ? '<b>Falta publicar o VALER.gs no servidor</b><br>Apps Script › Arquivos › + › Script › nome <b>VALER</b> › colar o arquivo <code>ponto/servidor/VALER.gs</code> (deixe o PERF como último) › Salvar › Implantar › Gerenciar implantações › ✏️ › Nova versão.'
      : esc(A.erro)}<br><button class="btn p" style="margin-top:8px" onclick="MOD45.adm=null;render()"><i class="ti ti-refresh"></i> Tentar de novo</button></div></div>`;
  }
  const off = mod45Rasc(), ligadas = MOD45_LISTA.filter(x=>!off.includes(x.k)).length, mudou = mod45Mudou();
  const grupos = [...new Set(MOD45_LISTA.map(x=>x.g))];
  const cartao = (x,i) => { const on = !off.includes(x.k);
    return `<div class="mod45-it ${on?'':'off'}" style="animation-delay:${i*25}ms" onclick="mod45Toggle('${x.k}')"><span class="ic"><i class="ti ${x.ic}"></i></span><div class="cresce"><b>${esc(x.n)}</b><small>${esc(x.s)}</small></div>${mod45Sw(on, `event.stopPropagation();mod45Toggle('${x.k}')`)}</div>`; };
  let n = 0;
  const hist = (A.hist||[]).slice(0,5).map(h=>`<li><small class="num">${esc(String(h.em).slice(8,10)+'/'+String(h.em).slice(5,7)+' '+String(h.em).slice(11,16))}</small> ${esc(h.por)}: ${h.des.length?'desligou '+h.des.map(k=>esc((MOD45_LISTA.find(x=>x.k===k)||{n:k}).n)).join(', '):''}${h.des.length&&h.lig.length?' · ':''}${h.lig.length?'ligou '+h.lig.map(k=>esc((MOD45_LISTA.find(x=>x.k===k)||{n:k}).n)).join(', '):''}</li>`).join('');
  return `<div class="mod45-topo"><div><h2>👀 O que a <mark>equipe vê</mark></h2>
      <p>Libere o portal aos poucos. O que estiver desligado some do menu, da barra do celular e do Início das vendedoras — nada é apagado, é só ligar de novo.</p></div>
      <div class="mod45-cont"><b class="num">${ligadas}</b><small>de ${MOD45_LISTA.length} telas ligadas</small></div></div>
    <div class="mod45-presets">
      <button class="btn p" onclick="mod45Preset('adaptacao')"><i class="ti ti-seeding"></i> Fase de adaptação <small>ponto, PDV, produtos, caixa</small></button>
      <button class="btn p" onclick="mod45Preset('tudo')"><i class="ti ti-bulb"></i> Liberar tudo</button>
    </div>
    <div class="nota info" style="margin:10px 0 12px"><i class="ti ti-fingerprint"></i><div><b>Bater o ponto e o Início ficam sempre ligados.</b> A administração continua vendo tudo.</div></div>
    <div class="mod45-g">${grupos.map(g=>`<section class="mod45-bloco"><h3>${esc(g)}</h3>${MOD45_LISTA.filter(x=>x.g===g).map(x=>cartao(x, n++)).join('')}</section>`).join('')}</div>
    <div class="mod45-salvar ${mudou?'on':''}"><span>${mudou?'Você mudou o que a equipe vê.':'Tudo salvo.'}</span>
      ${mudou?`<button class="btn" onclick="MOD45.rascunho=null;render()">Desfazer</button>`:''}
      <button class="btn pri" ${!mudou||MOD45.salvando?'disabled':''} onclick="mod45Salvar()"><i class="ti ti-device-floppy"></i> ${MOD45.salvando?'Salvando…':'Salvar'}</button></div>
    ${hist?`<section class="mod45-bloco"><h3>Últimas mudanças</h3><ul class="mod45-hist">${hist}</ul></section>`:''}
    ${z45Bloco()}`;
}

/* ───────── "Zerar os testes" (começar pra valer) ───────── */
const Z45 = { r:null, carregando:false, grupos:{}, feito:null, zerando:false };
async function z45Ver(){
  Z45.carregando = true; render();
  try{ Z45.r = await api('admZerarTestes', {...S.adm.cred, op:'ver', grupos:Z45.grupos}); }
  catch(e){ Z45.r = {erro:e.message}; }
  finally{ Z45.carregando = false; render(); }
}
function z45Grupo(g){ Z45.grupos[g] = Z45.grupos[g]===false; z45Ver(); }
async function z45Zerar(){
  const r = Z45.r; if(!r || !r.totalSai) return;
  const conf = prompt(`Vai apagar ${r.totalSai} registro(s) de teste.\nAntes, uma cópia da planilha inteira é salva no Drive.\n\nDigite ZERAR para confirmar:`);
  if(conf==null) return;
  if(String(conf).trim().toUpperCase()!=='ZERAR'){ toast('Não confirmado — nada foi apagado', true); return; }
  Z45.zerando = true; render();
  try{
    const j = await api('admZerarTestes', {...S.adm.cred, op:'zerar', confirmar:'ZERAR', grupos:Z45.grupos, desativarTeste:true, por:(S.adm.perfil==='madu'?'Madu':'Matheus')});
    Z45.feito = j.feito; Z45.r = j;
    try{ S.adm.dados = await api('admDados', {...S.adm.cred}); }catch(e){}
    try{ ['lv_pdv_comanda','lv_caixa_rasc'].forEach(k=>localStorage.removeItem(k)); }catch(e){}
    carregarBootSilencioso && carregarBootSilencioso();
    toast('Testes zerados ✔ Agora é pra valer!'); try{ chuvaConfete(); }catch(e){}
  }catch(e){ toast(e.message, true); }
  finally{ Z45.zerando = false; render(); }
}
function z45Bloco(){
  const r = Z45.r;
  const cab = `<section class="mod45-bloco z45"><h3>🧹 Zerar os testes <small class="apagado">começar pra valer</small></h3>`;
  if(!r) return cab + `<p class="suave" style="margin:0 0 10px">Apaga as vendas, caixas, sangrias, checklists e o resto que foi feito em teste. Primeiro mostra tudo o que vai sair — nada é apagado sem você confirmar, e antes é feita uma cópia da planilha.</p>
    <button class="btn pri" ${Z45.carregando?'disabled':''} onclick="z45Ver()"><i class="ti ti-search"></i> ${Z45.carregando?'Conferindo…':'Ver o que vai ser apagado'}</button></section>`;
  if(r.erro) return cab + `<div class="nota"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(r.erro)?'<b>Falta publicar o VALER.gs no servidor</b> (veja acima).':esc(r.erro)}</div></div><button class="btn p" onclick="z45Ver()">Tentar de novo</button></section>`;
  const dataBR = d => d ? d.slice(8,10)+'/'+d.slice(5,7) : '';
  const feito = Z45.feito ? `<div class="nota ok" style="margin-bottom:10px"><i class="ti ti-circle-check"></i><div><b>${Z45.feito.apagadas} registro(s) apagado(s).</b>${Z45.feito.desativados?.length?' Usuário de teste desativado: '+esc(Z45.feito.desativados.join(', '))+'.':''}${Z45.feito.backup?`<br><small>Cópia de segurança: <a href="${esc(Z45.feito.backup.url)}" target="_blank" rel="noopener">${esc(Z45.feito.backup.nome)}</a></small>`:''}</div></div>` : '';
  const grupos = Object.keys(r.nomesGrupos||{});
  const linhas = grupos.map(g=>{
    const abas = r.abas.filter(a=>a.grupo===g && a.existe), sai = abas.reduce((s,a)=>s+a.sai,0), on = r.grupos[g]!==false;
    const det = abas.filter(a=>a.sai).map(a=>`<li><b>${esc(a.aba)}</b>: ${a.sai} de ${a.total} <small class="apagado">${Object.entries(a.quem).slice(0,4).map(([q,n])=>esc(q)+' ('+n+')').join(' · ')}${a.ex[0]?.data?' · '+a.ex.map(e=>dataBR(e.data)).filter(Boolean).filter((x,i,l)=>l.indexOf(x)===i).slice(0,4).join(', '):''}</small></li>`).join('');
    return `<div class="z45-g ${on?'':'off'}"><div class="linha" style="gap:10px;align-items:center">${mod45Sw(on, `z45Grupo('${g}')`)}<div class="cresce"><b>${esc(r.nomesGrupos[g])}</b><small>${on?(sai?sai+' registro(s) saem':'nada para apagar'):'fica como está'}</small></div></div>${on&&det?`<ul>${det}</ul>`:''}</div>`;
  }).join('');
  return cab + feito + `<p class="suave" style="margin:0 0 10px">Sai tudo de <b>antes de ${dataBR(r.corte)}</b> nessas abas, e qualquer registro do usuário de teste${r.usuariosTeste?.length?' (<b>'+r.usuariosTeste.map(u=>esc(u.nome)).join(', ')+'</b>, que também é desativado)':''}. Não mexe no ponto das colaboradoras, produtos, fotos, mutirão, clientes, pedidos do site nem nas configurações.</p>
    <div class="z45-lista">${linhas}</div>
    <div class="nota info" style="margin:10px 0"><i class="ti ti-info-circle"></i><div>Vendas da Kommo não saem por aqui: elas vêm da própria Kommo. Se alguma venda de teste ainda está como "venda ganha" lá, tire ela de ganho na Kommo.</div></div>
    <div class="linha quebra" style="gap:8px"><button class="btn" onclick="z45Ver()"><i class="ti ti-refresh"></i> Conferir de novo</button>
      <button class="btn pri z45-zerar" ${!r.totalSai||Z45.zerando?'disabled':''} onclick="z45Zerar()"><i class="ti ti-eraser"></i> ${Z45.zerando?'Fazendo a cópia e apagando…':r.totalSai?'Zerar '+r.totalSai+' registro(s) de teste':'Nada para zerar'}</button></div>
    ${r.valer?`<small class="apagado" style="display:block;margin-top:8px">Última vez que zerou: ${esc(r.valer)}</small>`:''}</section>`;
}

/* ───────── encaixe: Ajustes › "O que a equipe vê" (só Matheus) ───────── */
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='ajustes'); if(a && !a.k.includes('modulos')) a.k.unshift('modulos'); NOMES34.modulos = 'O que a equipe vê'; }
if(typeof GRUPOS_ADM!=='undefined' && typeof NOMES12!=='undefined') NOMES12.admin.modulos = 'O que a equipe vê';
if(typeof TEC29!=='undefined' && !TEC29.includes('modulos')) TEC29.unshift('modulos');
const _telaAdminV45 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm; if(!A || !A.perfil) return _telaAdminV45.apply(this, arguments);
  if(A.perfil==='madu' && A.tab==='modulos') A.tab = 'central';
  const aqui = A.tab === 'modulos', marca = '<!--mod45-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV45.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'modulos'; }
    const i = h.indexOf(marca); h = i >= 0 ? h.slice(0, i) + mod45Tela() + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV45.apply(this, arguments);
  if(A.perfil!=='madu'){
    const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='modulos';TR=null;render()"><i class="ti ti-eye-check"></i> O que a equipe vê </button>`;
    h = h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
  }
  return h;
};
if(typeof itensBusca==='function'){
  const _ibA = itensBusca;
  itensBusca = function itensBusca(){
    const r = _ibA.apply(this, arguments);
    if(S.adm && S.tela==='admin' && S.adm.perfil!=='madu') r.unshift({t:'O que a equipe vê', s:'Ligar e desligar telas das vendedoras · zerar testes', i:'ti-eye-check', go:()=>{ S.adm.tab='modulos'; render(); }});
    return r;
  };
}

document.head.insertAdjacentHTML('beforeend', `<style>
.mod45-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 12px}
.mod45-topo h2{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin:6px 0 4px}.mod45-topo h2 mark{background:linear-gradient(transparent 55%,rgba(245,181,36,.5) 55%);color:inherit;padding:0 2px}
.mod45-topo p{color:var(--creme2);font-size:14px;max-width:620px;margin:0}
.mod45-cont{background:#fff;border:1px solid var(--linha);border-radius:18px;padding:10px 18px;text-align:center;box-shadow:var(--sh)}.mod45-cont b{display:block;font-size:30px;font-weight:900;color:var(--vermelho,#E3101F);line-height:1}.mod45-cont small{font-size:12px;color:var(--creme3)}
.mod45-presets{display:flex;gap:8px;flex-wrap:wrap}.mod45-presets .btn{display:inline-flex;align-items:center;gap:6px;transition:transform .15s}.mod45-presets .btn:hover{transform:translateY(-2px)}.mod45-presets small{font-weight:600;color:var(--creme3);font-size:12px}
.mod45-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.mod45-bloco{background:#fff;border:1px solid var(--linha);border-radius:20px;padding:14px 16px;box-shadow:var(--sh);margin-bottom:12px}
.mod45-bloco h3{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--creme3);margin:0 0 8px;display:flex;gap:8px;align-items:baseline}
.mod45-bloco.z45 h3{font-size:17px;letter-spacing:-.01em;text-transform:none;color:inherit}.mod45-bloco.z45 h3 small{font-size:12.5px;font-weight:600}
.mod45-it{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;cursor:pointer;transition:background .2s,opacity .25s,transform .15s;animation:mod45e .4s both}
.mod45-it:hover{background:var(--noite)}.mod45-it:active{transform:scale(.98)}
.mod45-it .ic{width:40px;height:40px;border-radius:13px;background:var(--vermelho,#E3101F);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;transition:background .25s,filter .25s}
.mod45-it b{display:block;font-size:15px}.mod45-it small{display:block;font-size:12.5px;color:var(--creme3);line-height:1.3}
.mod45-it.off{opacity:.55}.mod45-it.off .ic{background:#bbb4b6;filter:grayscale(1)}.mod45-it.off b{text-decoration:line-through;text-decoration-color:rgba(0,0,0,.25)}
.mod45-sw{all:unset;box-sizing:border-box;position:relative;width:48px;height:28px;border-radius:99px;background:#d9d4d6;flex-shrink:0;transition:background .25s;cursor:pointer}
.mod45-sw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:99px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .25s cubic-bezier(.3,1.5,.6,1)}
.mod45-sw.on{background:#22A55A}.mod45-sw.on i{transform:translateX(20px)}.mod45-sw:focus-visible{outline:2px solid var(--vermelho,#E3101F);outline-offset:2px}
.mod45-salvar{position:sticky;bottom:12px;z-index:5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;background:#fff;border:1px solid var(--linha);border-radius:18px;padding:10px 14px;box-shadow:var(--sh);margin:0 0 12px;transition:box-shadow .25s,border-color .25s}
.mod45-salvar span{margin-right:auto;font-weight:700;font-size:14px;color:var(--creme2)}
.mod45-salvar.on{border-color:var(--vermelho,#E3101F);box-shadow:0 10px 30px rgba(227,16,31,.18);animation:mod45p 1.6s ease-in-out infinite}
.mod45-hist{margin:0;padding-left:18px;font-size:13.5px;color:var(--creme2)}.mod45-hist li{margin:3px 0}
.z45-lista{display:flex;flex-direction:column;gap:8px}.z45-g{border:1px solid var(--linha);border-radius:14px;padding:10px 12px;transition:opacity .2s}.z45-g.off{opacity:.55}
.z45-g b{display:block;font-size:14.5px}.z45-g small{display:block;font-size:12.5px;color:var(--creme3)}.z45-g ul{margin:8px 0 0;padding-left:20px;font-size:13px}.z45-g li{margin:2px 0}.z45-g li small{display:inline}
.z45-zerar:not([disabled]){background:var(--vermelho,#E3101F)}
@keyframes mod45e{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes mod45p{0%,100%{box-shadow:0 10px 30px rgba(227,16,31,.12)}50%{box-shadow:0 10px 34px rgba(227,16,31,.3)}}
@media (prefers-reduced-motion:reduce){.mod45-it,.mod45-salvar.on{animation:none}}
@media (max-width:560px){.mod45-g{grid-template-columns:1fr}.mod45-salvar{bottom:76px}}
</style>`);
