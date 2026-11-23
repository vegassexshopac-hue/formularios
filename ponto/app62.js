/* ═════════════════════ RESULTADO DA CAMPANHA 24 POR R$ 24 (v62 · 23/11/2026) ═════════════════════
   Pedido da Madu: "acho ótimo ter esses parâmetros" — quantas peças saíram, quanto faturou, qual produto mais saiu e quem mais vendeu.
   Administração › Vendas › "Resultado 24 por R$ 24". Só leitura: o servidor (BV24.gs › admBv24) soma as vendas do PDV marcadas
   com a campanha e os pedidos do site do dia. Atualiza sozinho a cada minuto no dia da campanha.
   Carrega depois do app61. Para tirar: remover a linha do app62 no app9.js. */
(function(){ const st = document.createElement('style'); st.textContent = `
.r62-topo{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;justify-content:space-between;margin-bottom:14px;padding:16px 18px;border-radius:18px;background:linear-gradient(110deg,#0b0b0d 0%,#1d0508 60%,#4a0911 100%);color:#fff;border:1.5px solid #E0162B}
.r62-topo h2{margin:0;font-size:19px;letter-spacing:.5px} .r62-topo p{margin:3px 0 0;font-size:13.5px;opacity:.88}
.r62-topo .est{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:#FFD23F;color:#0b0b0d;font-weight:900;font-size:12.5px;white-space:nowrap}
.r62-topo button{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.r62-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.r62-nums .n{padding:14px 14px 12px;border-radius:16px;background:var(--cartao,#fff);border:1px solid var(--linha,rgba(0,0,0,.08))}
.r62-nums .n small{display:block;font-size:12px;opacity:.7;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.r62-nums .n b{display:block;font-size:26px;font-weight:900;line-height:1.15;margin-top:4px}
.r62-nums .n span{display:block;font-size:12px;opacity:.7;margin-top:2px}
.r62-nums .n.d b{color:#E0162B}
.r62-grade{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}
.r62-grade h3{margin:0 0 10px;font-size:15px}
.r62-l{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:7px 0;border-top:1px solid var(--linha,rgba(0,0,0,.07))}
.r62-l:first-of-type{border-top:0}
.r62-l .nm{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r62-l .q{font-size:14px;font-weight:900;white-space:nowrap}
.r62-l .q small{font-weight:600;opacity:.65;font-size:11.5px}
.r62-l .b{grid-column:1/3;height:7px;border-radius:99px;background:rgba(0,0,0,.07);overflow:hidden;display:flex}
.r62-l .b i{display:block;height:100%;background:#E0162B} .r62-l .b i.s{background:#FFB107}
.r62-leg{display:flex;gap:14px;font-size:12px;opacity:.75;margin:-4px 0 8px} .r62-leg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;background:#E0162B} .r62-leg i.s{background:#FFB107}
.r62-horas{display:flex;align-items:flex-end;gap:4px;height:96px;margin-top:6px}
.r62-horas div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;font-size:10.5px;opacity:.9;min-width:0}
.r62-horas i{display:block;width:100%;border-radius:5px 5px 0 0;background:#E0162B;min-height:2px}
.r62-zero{opacity:.45}
@media (max-width:900px){.r62-grade{grid-template-columns:1fr}.r62-nums .n b{font-size:22px}}
`; document.head.appendChild(st); })();

const R62 = { r:null, em:0, buscando:false, erro:'', timer:null };
async function r62Carregar(forcar){
  if(R62.buscando) return;
  if(!forcar && R62.r && Date.now()-R62.em < 55000) return;
  R62.buscando = true; R62.erro = '';
  try{ R62.r = await api('admBv24', {...S.adm.cred, op:'resultado'}); R62.em = Date.now(); }
  catch(e){ R62.erro = e.message || 'Erro'; }
  R62.buscando = false;
  if(S.adm && S.tela==='admin' && S.adm.tab==='bv24') render();
}
function r62Dia(d){ const x = new Date(d+'T12:00:00'); return ['domingo','segunda','terça','quarta','quinta','sexta','sábado'][x.getDay()] + ', ' + d.slice(8) + '/' + d.slice(5,7); }
function r62Barra(lista, maxi, comSite){
  return lista.map(p=>{ const t = comSite ? p.loja+p.site : p.pecas;
    return `<div class="r62-l ${t?'':'r62-zero'}"><span class="nm">${p.n?`<span class="apagado">${p.n}.</span> `:''}${esc(p.nome||'')}</span><span class="q">${t} <small>${t===1?'peça':'peças'}${comSite?'':' · '+brl2(p.valor24)}</small></span>
      <span class="b">${comSite ? `<i style="width:${Math.round(p.loja/maxi*100)}%"></i><i class="s" style="width:${Math.round(p.site/maxi*100)}%"></i>` : `<i style="width:${Math.round(t/maxi*100)}%"></i>`}</span></div>`; }).join('');
}
function r62Tela(){
  const r = R62.r;
  if(R62.erro && !r) return `<div class="nota" style="border-color:var(--vermelho)"><i class="ti ti-plug-x"></i><div>${/desconhecida/i.test(R62.erro)?'<b>Falta publicar a atualização do servidor (BV24.gs).</b> Assim que for publicada, o resultado aparece aqui.':esc(R62.erro)}<br><button class="btn p" style="margin-top:8px" onclick="r62Carregar(true);render()">Tentar de novo</button></div></div>`;
  if(!r){ r62Carregar(); return `<p class="suave"><i class="ti ti-loader-2"></i> Somando as vendas da campanha…</p>`; }
  r62Carregar();
  clearTimeout(R62.timer); if(r.estado==='hoje') R62.timer = setTimeout(()=>{ if(S.adm && S.tela==='admin' && S.adm.tab==='bv24') r62Carregar(true); }, 60000);
  const c = r.campanha, L = r.lojas, St = r.site;
  const pecas = L.pecas + St.pecas, fat = r2(L.valor24 + St.valor24), nv = L.vendas + St.pedidos;
  const est = {antes:'⏳ Começa '+r62Dia(c.data), hoje:'🔥 Acontecendo agora', depois:'✅ Encerrada'}[r.estado];
  const topo = `<div class="r62-topo"><div><h2>🔥 ${esc(c.nome)} · ${esc(c.titulo)}</h2><p>${r62Dia(c.data)} · ${c.itens.length} produtos por ${brl2(c.preco)} cada · lojas e site</p></div>
    <div class="linha" style="gap:8px"><span class="est">${est}</span><button onclick="r62Carregar(true);render()" title="Atualizar"><i class="ti ti-refresh"></i> Atualizar</button></div></div>`;
  if(r.estado==='antes') return topo + `<div class="nota info" style="margin-bottom:14px"><i class="ti ti-info-circle"></i><div>Os números aparecem aqui a partir da meia-noite de ${r62Dia(c.data)}, conforme as vendas entram no PDV e no site. Durante o dia a tela se atualiza sozinha a cada minuto.</div></div>
    <div class="cartao pad"><h3 style="margin:0 0 10px;font-size:15px">Os ${c.itens.length} produtos da campanha</h3>${c.itens.map(i=>`<div class="r62-l"><span class="nm"><span class="apagado">${i.n}.</span> ${esc(i.nome)}</span><span class="q"><small>de ${brl2(i.de)}</small> ${brl2(c.preco)}</span></div>`).join('')}</div>`;
  const nums = `<div class="r62-nums">
    <div class="n d"><small>Peças de R$ 24 vendidas</small><b>${pecas}</b><span>${L.pecas} nas lojas · ${St.pecas} no site</span></div>
    <div class="n d"><small>Faturamento da campanha</small><b>${brl2(fat)}</b><span>só os produtos de ${brl2(c.preco)}</span></div>
    <div class="n"><small>Vendas com a campanha</small><b>${nv}</b><span>${L.vendas} no PDV · ${St.pedidos} ${St.pedidos===1?'pedido':'pedidos'} no site</span></div>
    <div class="n"><small>Outros produtos junto</small><b>${brl2(L.outros)}</b><span>levados na mesma comanda (lojas)</span></div>
    <div class="n"><small>Peças por venda</small><b>${nv ? (pecas/nv).toFixed(1).replace('.',',') : '0'}</b><span>média entre lojas e site</span></div></div>`;
  if(!pecas) return topo + nums + `<div class="nota info"><i class="ti ti-hourglass"></i><div>Ainda não entrou nenhuma venda da campanha.${L.canceladas?' ('+L.canceladas+' cancelada'+(L.canceladas===1?'':'s')+' não conta'+(L.canceladas===1?'':'m')+'.)':''}</div></div>`;
  // produtos: os 24 sempre, os que não saíram ficam no fim
  const vend = {}; r.produtos.forEach(p=>{ vend[p.n] = p; });
  const todos = r.produtos.concat(c.itens.filter(i=>!vend[i.n]).map(i=>({n:i.n, nome:i.nome, loja:0, site:0})));
  const maxP = Math.max(1, ...todos.map(p=>p.loja+p.site)), maxV = Math.max(1, ...r.vendedoras.map(v=>v.pecas));
  const lojas = S.boot.lojas || {};
  const locais = r.por_loja.map(l=>({nome:'Loja '+((lojas[l.k]||{}).nome || l.k), pecas:l.pecas, valor24:l.valor24})).concat(St.pecas ? [{nome:'Site', pecas:St.pecas, valor24:St.valor24}] : []);
  const maxL = Math.max(1, ...locais.map(l=>l.pecas)), maxH = Math.max(1, ...r.por_hora.map(h=>h.pecas));
  const semSaida = todos.filter(p=>!(p.loja+p.site)).length;
  return topo + nums + `<div class="r62-grade">
    <div class="cartao pad"><h3>🏆 Produtos que mais saíram</h3><div class="r62-leg"><span><i></i>lojas</span><span><i class="s"></i>site</span>${semSaida?`<span>${semSaida} ainda sem venda</span>`:''}</div>${r62Barra(todos, maxP, true)}</div>
    <div style="display:grid;gap:14px">
      <div class="cartao pad"><h3>👑 Quem mais vendeu</h3>${r.vendedoras.length ? r62Barra(r.vendedoras.map(v=>({nome:primeiroNome(v.nome||''), pecas:v.pecas, valor24:v.valor24})), maxV, false) : '<p class="suave" style="margin:0">Nenhuma venda nas lojas ainda.</p>'}</div>
      <div class="cartao pad"><h3>📍 Onde vendeu</h3>${r62Barra(locais, maxL, false)}</div>
      <div class="cartao pad"><h3>⏰ Hora a hora (lojas)</h3>${r.por_hora.length ? `<div class="r62-horas">${r.por_hora.map(h=>`<div title="${h.pecas} peças"><b>${h.pecas}</b><i style="height:${Math.max(4, Math.round(h.pecas/maxH*64))}px"></i><span>${esc(h.nome)}</span></div>`).join('')}</div>` : '<p class="suave" style="margin:0">Sem vendas nas lojas ainda.</p>'}</div>
    </div></div>
    <p class="apagado" style="font-size:12.5px;margin-top:12px">Atualizado às ${esc(String(r.agora||'').slice(11,16))}. Venda cancelada não entra${L.canceladas?' ('+L.canceladas+' até agora)':''}. No site contam os pedidos do dia com produto da campanha a ${brl2(c.preco)}.</p>`;
}

/* ───────── encaixe na Administração › Vendas ───────── */
if(typeof AREAS34!=='undefined'){ const a = AREAS34.find(x=>x.id==='vendas'); if(a && !a.k.includes('bv24')) a.k.splice(a.k.indexOf('pdv')>=0 ? a.k.indexOf('pdv')+1 : 0, 0, 'bv24'); NOMES34.bv24 = 'Resultado 24 por R$ 24'; }
if(typeof GRUPOS_ADM!=='undefined'){ const g = GRUPOS_ADM.find(x=>x.k.includes('pdv')); if(g && !g.k.includes('bv24')) g.k.splice(g.k.indexOf('pdv')+1, 0, 'bv24'); if(typeof NOMES12!=='undefined') NOMES12.admin.bv24 = 'Resultado 24 por R$ 24'; }
const _telaAdminV62 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm; if(!A || (typeof perfil29==='function' && !A.perfil)) return _telaAdminV62.apply(this, arguments);
  const aqui = A.tab === 'bv24', marca = '<!--r62-conteudo-->';
  let h;
  if(aqui){
    const orig = admAtalhos; A.tab = 'atalhos'; admAtalhos = () => marca;
    try{ h = _telaAdminV62.apply(this, arguments); } finally { admAtalhos = orig; A.tab = 'bv24'; }
    const i = h.indexOf(marca);
    let tela; try{ tela = r62Tela(); }catch(e){ console.error('v62 resultado', e); tela = `<div class="nota"><i class="ti ti-alert-triangle"></i><div>Não consegui montar o resultado. Atualize a página.</div></div>`; }
    h = i >= 0 ? h.slice(0, i) + tela + h.slice(i + marca.length) : h;
    h = h.replace(`class="aba on" onclick="S.adm.tab='atalhos'`, `class="aba " onclick="S.adm.tab='atalhos'`);
  } else h = _telaAdminV62.apply(this, arguments);
  const btn = `<button class="aba ${aqui?'on':''}" onclick="S.adm.tab='bv24';TR=null;render()"><i class="ti ti-flame"></i> Resultado 24 por R$ 24 </button>`;
  return h.replace(/<div class="abas"([^>]*)>/, m => m + btn);
};
