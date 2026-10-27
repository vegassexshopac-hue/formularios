/* ════════════════════════════════════════════════════════════════════════════
   Portal Equipe Las Vegas — v15 (app15.js): LINK DE FOTOS SEM PIN
   • Administração › Estoque › 📸 Produtos › "Link sem PIN": gera um link
     …/#fotos=CHAVE para mandar no grupo. Quem abre vê SÓ os produtos sem foto
     (nome, código, categoria — sem preço, estoque ou venda), diz quem é e vai
     fotografando pelo celular. O servidor registra quem tirou cada foto.
   • Desligar o link / gerar chave nova: no mesmo botão.
   ════════════════════════════════════════════════════════════════════════════ */
(function(){ const st = document.createElement('style'); st.textContent = `
.fl-pag{max-width:680px;margin:0 auto;padding:14px 16px 60px;font-family:inherit}
.fl-topo{display:flex;align-items:center;gap:12px;background:var(--vermelho,#D4121B);color:#fff;border-radius:16px;padding:12px 14px;margin-bottom:14px}
.fl-topo img{height:36px}
.fl-topo b{font-size:16px;display:block}.fl-topo small{opacity:.9;font-size:12px}
.fl-card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.fl-barra{height:10px;border-radius:99px;background:rgba(0,0,0,.08);overflow:hidden;margin:8px 0 4px}
.fl-barra i{display:block;height:100%;background:linear-gradient(90deg,#F5B524,#2fb36b);border-radius:99px;transition:width .6s}
.fl-nomes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.fl-nomes button{border:1.5px solid rgba(0,0,0,.12);background:#fff;border-radius:99px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer;color:#222}
.fl-nomes button.on{background:#D4121B;border-color:#D4121B;color:#fff}
.fl-busca{width:100%;border:1.5px solid rgba(0,0,0,.14);border-radius:12px;padding:11px 12px;font-size:15px;margin-top:8px}
.fl-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.fl-item{display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:14px;background:#fff;border:1px solid rgba(0,0,0,.08);text-align:left;cursor:pointer;color:#222;font:inherit}
.fl-item .semft{width:100%;aspect-ratio:1/1;border-radius:10px;border:2px dashed rgba(212,18,27,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#D4121B;font-weight:800;font-size:13px;background:rgba(212,18,27,.05)}
.fl-item .semft i{font-size:30px}
.fl-item b{font-size:12.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fl-item small{font-size:11px;color:#777}
.fl-item.ok{opacity:.55}.fl-item.ok .semft{border-style:solid;border-color:#2fb36b;color:#2fb36b;background:rgba(47,179,107,.08)}
.fl-item.env .semft{border-color:#F5B524;color:#b07a00}
.fl-vazio{text-align:center;color:#777;padding:30px 10px;font-size:15px}
.fl-ok{font-size:13px;color:#2fb36b;font-weight:700}
.fl-rod{text-align:center;color:#999;font-size:12px;margin-top:18px}
@media (prefers-color-scheme:dark){ .fl-card,.fl-item,.fl-nomes button{background:#fff;color:#222} }
`; document.head.appendChild(st); })();

var FL = null;   // {chave, por, lista, total, com, q, feitos:{id:url}, enviando:{}}
function flChaveDaUrl(){ const m = location.hash.match(/^#fotos=([a-z0-9]{6,20})$/i); return m ? m[1] : ''; }

/* entra no modo "só fotos" antes do app normal abrir */
const _carregarV15 = carregar;
carregar = async function(){
  const ch = flChaveDaUrl();
  if(!ch) return _carregarV15();
  if(!S.api){ return _carregarV15(); }
  S.tela = 'fotos';
  FL = {chave: ch, por: LS.get('lv_fotos_por', ''), lista: [], total: 0, com: 0, q: '', feitos: {}, enviando: {}, nomes: [], erro: ''};
  flPintar();
  await flCarregar();
};
async function flCarregar(){
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'lista'});
    FL.lista = r.produtos || []; FL.total = r.total || 0; FL.com = r.com || 0; FL.nomes = r.nomes || []; FL.erro = '';
  }catch(e){ FL.erro = e.message; }
  flPintar();
}
function flLista(){
  const q = semAcento(FL.q.trim()), ws = q ? q.split(/\s+/) : [];
  return FL.lista.filter(p=>!ws.length || ws.every(w=>semAcento(p.nome+' '+(p.codigo||'')+' '+(p.categoria||'')).includes(w)))
    .sort((a,b)=>(FL.feitos[a.id]?1:0)-(FL.feitos[b.id]?1:0) || a.nome.localeCompare(b.nome));
}
function flPintar(){
  const app = $('#app'); if(!app || S.tela!=='fotos') return;
  const feitos = Object.keys(FL.feitos).length, com = FL.com + feitos, pct = FL.total ? Math.round(com/FL.total*100) : 0, falta = FL.total - com;
  const l = flLista();
  app.innerHTML = `<div class="fl-pag">
    <div class="fl-topo"><img src="${LOGO}" alt=""><div><b>Fotos dos produtos</b><small>Las Vegas Sex Shop · ${FL.erro?'—':falta+' produto(s) sem foto'}</small></div></div>
    ${FL.erro?`<div class="fl-card" style="border-color:#D4121B;color:#D4121B;font-weight:700"><i class="ti ti-alert-triangle"></i> ${esc(FL.erro)}</div>`:`
    <div class="fl-card">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#555"><span><b style="color:#222">${com}</b> de ${FL.total} com foto</span><span>${pct}%</span></div>
      <div class="fl-barra"><i style="width:${pct}%"></i></div>
      ${feitos?`<div class="fl-ok">✔ Você já tirou ${feitos} foto(s) agora</div>`:''}
    </div>
    <div class="fl-card">
      <div style="font-weight:800;font-size:15px">Quem está fotografando?</div>
      <div class="fl-nomes">${FL.nomes.map(n=>`<button class="${FL.por===n?'on':''}" onclick="flPor('${esc(n)}')">${esc(n)}</button>`).join('')}<button class="${FL.por&&!FL.nomes.includes(FL.por)?'on':''}" onclick="flPorOutro()">${FL.por&&!FL.nomes.includes(FL.por)?esc(FL.por):'Outro…'}</button></div>
      ${!FL.por?`<p style="margin:10px 0 0;font-size:13px;color:#D4121B;font-weight:700">Toque no seu nome para começar.</p>`:''}
    </div>
    <div class="fl-card">
      <div style="font-weight:800;font-size:15px">Toque no produto e tire a foto</div>
      <p style="margin:4px 0 0;font-size:13px;color:#666">Fundo claro, produto inteiro, sem a mão na frente. A foto já vai direto para o sistema.</p>
      <input class="fl-busca" placeholder="Buscar por nome ou código…" value="${esc(FL.q)}" oninput="FL.q=this.value;flPintarGrade()">
      <div id="fl-grade" style="margin-top:12px">${flGradeHtml(l)}</div>
    </div>
    <div class="fl-rod">Link de fotos · não mostra preço nem estoque · <a href="#" onclick="flCarregar();return false" style="color:#D4121B">atualizar lista</a></div>`}
  </div>`;
}
function flGradeHtml(l){
  if(!l.length) return `<div class="fl-vazio">${FL.lista.length?'Nada encontrado.':'🎉 Todos os produtos já têm foto!'}</div>`;
  return `<div class="fl-grade">${l.slice(0,120).map(p=>{ const ok = FL.feitos[p.id], env = FL.enviando[p.id]; return `<button class="fl-item ${ok?'ok':''} ${env?'env':''}" onclick="flTirar('${p.id}')">
      ${ok?`<img class="pf" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px" src="${esc(ok)}" alt="">`:`<span class="semft"><i class="ti ${env?'ti-loader-2':'ti-camera-plus'}"></i>${env?'Enviando…':'Tirar foto'}</span>`}
      <b>${esc(p.nome)}</b><small>${esc(p.codigo||'sem código')}${p.categoria?' · '+esc(p.categoria):''}</small></button>`; }).join('')}</div>
    ${l.length>120?`<p class="fl-vazio">… e mais ${l.length-120}. Use a busca.</p>`:''}`;
}
function flPintarGrade(){ const g = $('#fl-grade'); if(g) g.innerHTML = flGradeHtml(flLista()); }
function flPor(n){ FL.por = n; LS.set('lv_fotos_por', n); flPintar(); }
function flPorOutro(){ const n = prompt('Seu nome:', FL.por && !FL.nomes.includes(FL.por) ? FL.por : ''); if(n && n.trim()) flPor(n.trim().slice(0,40)); }
async function flTirar(pid){
  if(!FL.por){ toast('Primeiro toque no seu nome', true); return; }
  if(FL.enviando[pid]) return;
  const p = FL.lista.find(x=>x.id===pid); if(!p) return;
  const img = await fotoEscolher(); if(!img) return;
  FL.enviando[pid] = true; flPintarGrade();
  try{
    const r = await api('fotos', {chave: FL.chave, op: 'salvar', produto_id: pid, img, por: FL.por});
    FL.feitos[pid] = fotoUrl({foto: r.foto}, 240); try{ estBip(true); }catch(e){}
    toast('Foto salva ✔');
  }catch(e){ toast(erroRede(e) ? 'Sem internet — tente de novo' : e.message, true); }
  delete FL.enviando[pid]; flPintar();
}

/* ───────── administração: gerar / copiar / desligar o link (na tela 📸 Produtos) ───────── */
const _estCatalogoV15 = estCatalogo;
estCatalogo = function(){
  const h = _estCatalogoV15();
  if(!estAdmin()) return h;
  return h.replace('<button class="btn ouro" onclick="novoProduto()">', '<button class="btn" onclick="flAdmin()" title="Link para a equipe tirar fotos sem PIN"><i class="ti ti-camera-share"></i> Link sem PIN</button><button class="btn ouro" onclick="novoProduto()">');
};
function flCopiar(){ const i = $('#modal .inp'); if(!i) return; i.select(); navigator.clipboard.writeText(i.value).then(()=>toast('Link copiado ✔ — mande no grupo'), ()=>toast('Selecione e copie o link', true)); }
async function flAdmin(acao){
  let chave;
  try{ toast('Um instante…'); const r = await api('admEstoque', {...S.adm.cred, op:'fotosLink', novo: acao==='novo', desligar: acao==='desligar'}); chave = r.chave; }
  catch(e){ toast(e.message, true); return; }
  const link = chave ? location.origin + location.pathname + '#fotos=' + chave : '';
  const msg = `📸 *Fotos dos produtos — Las Vegas*\nMeninas, toquem no link, escolham o nome de vocês e tirem foto dos produtos que ainda estão sem foto (fundo claro, produto inteiro). Já vai direto pro sistema!\n${link}`;
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal" style="max-width:520px">
    <div class="modal-t"><h3 class="cresce" style="font-size:16px">📸 Link de fotos sem PIN</h3><button class="icone" aria-label="Fechar" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">
      ${chave?`<p class="suave" style="margin:0 0 8px;font-size:13px">Quem abrir este link vê só os produtos <b>sem foto</b> (sem preço, estoque ou venda), diz quem é e fotografa pelo celular. Fica registrado quem tirou cada foto.</p>
      <input class="inp" readonly value="${esc(link)}" onclick="this.select()" style="margin-bottom:10px">
      <div class="g2"><button class="btn ouro" onclick="flCopiar()"><i class="ti ti-copy"></i> Copiar link</button>
        <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><i class="ti ti-brand-whatsapp"></i> Mandar no WhatsApp</a></div>
      <div class="g2" style="margin-top:8px"><button class="btn p" onclick="flAdmin('novo')"><i class="ti ti-refresh"></i> Gerar link novo</button><button class="btn p" onclick="flAdmin('desligar')"><i class="ti ti-link-off"></i> Desligar o link</button></div>
      <p class="apagado" style="font-size:12px;margin:10px 0 0">Gerar link novo ou desligar faz o link antigo parar de funcionar na hora.</p>`
      :`<p class="suave" style="margin:0 0 12px">O link está <b>desligado</b>. Ninguém consegue mandar fotos por ele.</p><button class="btn ouro largo" onclick="flAdmin('novo')"><i class="ti ti-link"></i> Ligar e gerar o link</button>`}
    </div></div></div>`;
}
