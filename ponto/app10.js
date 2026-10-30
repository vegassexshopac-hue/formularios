/* ═════════════════════ ESTOQUE + ENTRADA DE MERCADORIA (v9) ═════════════════════
   Equipe: Portal › Receber (nota em XML, foto ou PDF → a IA lê → conferência → estoque da loja + relatório)
   Administração › Estoque: saldo por loja, entradas, movimentos, saldo inicial (do PDV antigo) e configuração.
   Servidor: ponto/servidor/ESTOQUE.gs */
const EST_CNPJ_LOJA = '47100282000162';
const EST_UN_OK = /^(UN|UND|UNID|UNIDADE|PC|PCS|PÇ|PECA|PEÇA)$/i;

(function(){ const st = document.createElement('style'); st.textContent = `
.est-fontes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
.est-fonte{position:relative;display:grid;gap:4px;justify-items:start;text-align:left;padding:16px;border-radius:16px;border:1.5px solid var(--linha);background:rgba(255,255,255,.03);color:inherit;cursor:pointer;font:inherit}
.est-fonte i{font-size:26px;color:var(--dourado)} .est-fonte b{font-size:15.5px} .est-fonte small{opacity:.75;font-size:12.5px;line-height:1.35}
.est-fonte:hover{border-color:var(--dourado)} .est-fonte.top{border-color:rgba(245,181,36,.55)}
.est-fonte .tag{position:absolute;top:10px;right:10px;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;background:var(--ok-bg);color:var(--ok)}
.est-fonte[disabled]{opacity:.45;cursor:not-allowed}
.est-fonte input{position:absolute;inset:0;opacity:0;cursor:pointer}
.est-lojas{display:flex;gap:8px;flex-wrap:wrap}
.est-lojas button{padding:9px 16px;border-radius:99px;border:1.5px solid var(--linha);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}
.est-lojas button.on{border-color:var(--dourado);background:rgba(245,181,36,.14);color:var(--dourado)}
.est-cab{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.est-cab div{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04)} .est-cab small{display:block;opacity:.7;font-size:12px} .est-cab b{font-size:15px}
.est-itens{display:grid;gap:10px;margin-top:12px}
.est-item{border:1.5px solid var(--linha);border-radius:16px;padding:12px 14px;display:grid;gap:10px}
.est-item.alerta{border-color:rgba(245,181,36,.6)} .est-item.ruim{border-color:var(--bad)} .est-item.ok{border-color:rgba(91,212,155,.45)}
.est-it-top{display:flex;gap:10px;align-items:flex-start}
.est-it-top .n{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);font-size:12px;font-weight:800}
.est-it-top .d{flex:1;min-width:0} .est-it-top .d>b{display:block;font-size:14.5px;line-height:1.3} .est-it-top .d small{opacity:.65;font-size:12px}
.est-it-qtd{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.est-it-qtd .inp{width:96px;text-align:center;font-weight:800;font-size:17px;padding:8px}
.est-it-qtd .mini{font-size:12.5px;opacity:.8}
.est-prod{display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04);cursor:pointer;border:0;color:inherit;font:inherit;text-align:left;width:100%}
.est-prod .cresce{min-width:0} .est-prod b{font-size:14px} .est-prod small{display:block;opacity:.7;font-size:12px}
.est-novo{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}
.est-foto{display:flex;gap:6px;align-items:center;font-size:13px;padding:6px 10px;border-radius:10px}
.est-foto.igual{background:var(--ok-bg);color:var(--ok)} .est-foto.dif{background:var(--warn-bg);color:var(--warn)} .est-foto.nada{background:rgba(255,255,255,.05);opacity:.8}
.est-resumo{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.est-barra{position:sticky;bottom:0;z-index:5;margin:16px -4px 0;padding:12px 4px;background:linear-gradient(transparent,var(--noite) 30%);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.est-lendo{display:grid;justify-items:center;gap:12px;padding:44px 16px;text-align:center}
.est-lendo i{font-size:44px;color:var(--dourado);animation:estGira 1.1s linear infinite}
@keyframes estGira{to{transform:rotate(360deg)}}
.est-feito{display:grid;justify-items:center;gap:8px;text-align:center;padding:22px 10px}
.est-feito .big{font-size:56px;line-height:1}
.est-relat{white-space:pre-wrap;font-size:13.5px;line-height:1.5;background:rgba(255,255,255,.04);border-radius:12px;padding:12px 14px;text-align:left;width:100%;max-width:560px}
.est-ent{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;border:1px solid var(--linha);cursor:pointer;background:transparent;color:inherit;font:inherit;text-align:left;width:100%}
.est-ent + .est-ent{margin-top:8px} .est-ent .ico{font-size:22px} .est-ent b{font-size:14.5px} .est-ent small{display:block;opacity:.7;font-size:12.5px}
.est-q{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.est-tab td.q{font-weight:800;text-align:center;font-variant-numeric:tabular-nums}
.est-tab td.q.zero{color:var(--bad)} .est-tab td.q.baixo{color:var(--warn)}
.est-busca-res{display:grid;gap:6px;max-height:50vh;overflow:auto;margin-top:10px}
@media (max-width:640px){.est-barra{bottom:64px}.est-barra .btn.pri{font-size:14px}.est-ok-loja{display:none}}
.est-prod .selo{font-size:11px;padding:1px 7px;margin-left:4px;vertical-align:1px}
@media (max-width:700px){.est-fontes{grid-template-columns:1fr}.est-cab{grid-template-columns:1fr 1fr}.est-novo{grid-template-columns:1fr 1fr}.est-novo .nome{grid-column:1/-1}}
`; document.head.appendChild(st); })();

/* ───────── dados ───────── */
function estD(){
  const d = S.adm ? S.adm.dados : S.sess?.dados;
  if(d && d.estoque && !d.estoque.erro) return d.estoque;
  return {saldos:[], entradas:[], vinculos:[], movimentos:[], cfg:{}, iaPronta:false, semServidor:true, erro:d?.estoque?.erro};
}
const estAdmin = () => !!(S.adm && S.tela==='admin');
/* locais de estoque: bosque (prateleira) · deposito (Bosque) · centro (prateleira) — vêm do servidor */
const EST_LOCAIS_PADRAO = [{id:'bosque',nome:'Bosque · Prateleira',loja:'bosque',tipo:'prateleira'},{id:'deposito',nome:'Bosque · Depósito',loja:'bosque',tipo:'deposito'},{id:'centro',nome:'Centro · Prateleira',loja:'centro',tipo:'prateleira'}];
const estLocais = () => (estD().locais && estD().locais.length) ? estD().locais : EST_LOCAIS_PADRAO;
const estLocaisIds = () => estLocais().map(l=>l.id);
function estLojaHoje(){
  if(S.aparelho?.loja) return S.aparelho.loja;
  const d = S.sess?.dados; if(!d) return estLocaisIds()[0];
  return (d.pontos||[]).find(p=>p.data===hojeISO())?.loja || (d.escala||[]).find(e=>e.data===hojeISO() && e.colaboradora_id===S.sess.eid)?.loja || d.colaboradora?.loja || estLocaisIds()[0];
}
const estPrateleira = loja => (estLocais().find(l=>l.loja===loja && l.tipo!=='deposito')||{}).id || loja;
/* mercadoria que chega vai para o depósito da loja (se tiver); senão para a prateleira */
function estLojaPadrao(){ const loja = estLojaHoje(); return (estLocais().find(l=>l.loja===loja && l.tipo==='deposito')||{}).id || estPrateleira(loja); }
const estLojaNome = k => (estLocais().find(l=>l.id===k)||{}).nome || S.boot.lojas[k]?.nome || k;
const estLocalIco = k => (estLocais().find(l=>l.id===k)||{}).tipo==='deposito' ? 'ti-building-warehouse' : 'ti-building-store';
function estChipsLocal(atual, acao, filtro){ return `<div class="est-lojas">${estLocais().filter(filtro||(()=>true)).map(l=>`<button class="${atual===l.id?'on':''}" onclick="${acao.replace(/\$ID/g,l.id)}"><i class="ti ${estLocalIco(l.id)}"></i> ${esc(l.nome)}</button>`).join('')}</div>`; }
function estQtdDe(pid, loja){ const s = estD().saldos.find(x=>x.produto_id===pid && x.loja===loja); return s ? s.qtd : null; }
const estN = v => { let t = String(v??'').trim().replace(/[^\d,.-]/g,''); if(t.includes(',')) t = t.replace(/\./g,'').replace(',','.'); const n = Number(t); return isNaN(n) ? 0 : Math.round(n*1000)/1000; };
const estFmt = n => n==null ? '—' : (Number(n)||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
async function estApi(op, dados={}){
  if(estAdmin()) return api('admEstoque', {...S.adm.cred, op, ...dados});
  return api('estoque', {eid:S.sess.eid, ...S.sess.cred, op, ...dados});
}

/* ───────── casar o item da nota com o produto do catálogo ───────── */
const EST_STOP = new Set(['de','da','do','das','dos','com','para','e','em','a','o','un','und','unid','kit','cx','sex','shop','gel','cor']);
function estTokens(s){
  return semAcento(s).replace(/(\d)[\s,.]+(ml|g|gr|cm|un|mm)\b/g,'$1$2').split(/[^a-z0-9]+/).filter(w=>w.length>1 && !EST_STOP.has(w));
}
function estParecido(a, b){
  const A = new Set(estTokens(a)), B = new Set(estTokens(b));
  if(!A.size || !B.size) return 0;
  let i = 0; A.forEach(w=>{ if(B.has(w)) i++; else if(w.length>3 && [...B].some(x=>x.length>3 && (x.startsWith(w)||w.startsWith(x)))) i += .7; });
  return 2*i/(A.size+B.size);
}
function estCasar(it, cnpj){
  const P = pdvD().produtos, V = estD().vinculos||[];
  const v = cnpj && it.cod ? V.find(x=>x.chave===cnpj+'|'+it.cod) : null;
  if(v && P.some(p=>p.id===v.produto_id)) return {produto_id:v.produto_id, como:'aprendido'};
  if(it.ean && /^\d{8,14}$/.test(it.ean)){ const p = P.find(p=>p.codigo===it.ean || p.sku===it.ean); if(p) return {produto_id:p.id, como:'ean'}; }
  if(it.cod){ const p = P.find(p=>p.sku && p.sku===it.cod); if(p) return {produto_id:p.id, como:'sku'}; }
  let melhor = null, nota = 0;
  P.forEach(p=>{ const s = estParecido(it.desc, p.nome); if(s>nota){ nota = s; melhor = p; } });
  if(melhor && nota>=0.6) return {produto_id:melhor.id, como:'parecido', nota};
  return {produto_id:'', como:''};
}
function estSugerirPreco(vunit){ if(!vunit) return ''; return (Math.ceil(vunit*2.2)-0.1).toFixed(2).replace('.',','); }
function estNomeBonito(desc){ return String(desc||'').toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase()).replace(/\b(\d+)(Ml|G|Gr|Cm)\b/g,(m,n,u)=>n+u.toLowerCase()).trim(); }

/* ───────── ler XML da NF-e (sem IA: é exato) ───────── */
function estLerXML(txt){
  const doc = new DOMParser().parseFromString(txt, 'application/xml');
  if(doc.getElementsByTagName('parsererror').length) throw new Error('Esse arquivo não é um XML válido');
  const tag = (el, n) => el ? el.getElementsByTagNameNS('*', n)[0] || el.getElementsByTagName(n)[0] : null;
  const val = (el, n) => (tag(el, n)?.textContent || '').trim();
  const inf = tag(doc, 'infNFe');
  if(!inf) throw new Error('Esse XML não é de NF-e (pode ser CT-e do frete). Procure o XML da nota do fornecedor.');
  const emit = tag(inf,'emit'), dest = tag(inf,'dest'), ide = tag(inf,'ide');
  const dets = [...inf.getElementsByTagNameNS('*','det')];
  const itens = dets.map(det=>{ const p = tag(det,'prod'); let ean = val(p,'cEAN'); if(!/^\d{8,14}$/.test(ean)) ean = val(p,'cEANTrib'); if(!/^\d{8,14}$/.test(ean)) ean = '';
    return {cod:val(p,'cProd'), ean, desc:val(p,'xProd'), un:(val(p,'uCom')||'UN').toUpperCase(), qtd:Math.round((Number(val(p,'qCom'))||0)*1000)/1000, vunit:Number(val(p,'vUnCom'))||0, vtotal:Number(val(p,'vProd'))||0}; });
  return {fornecedor: val(emit,'xFant') || val(emit,'xNome'), cnpj: val(emit,'CNPJ') || val(emit,'CPF'), numero: val(ide,'nNF'), emissao: (val(ide,'dhEmi')||val(ide,'dEmi')).slice(0,10),
    chave: (inf.getAttribute('Id')||'').replace(/\D/g,''), destinatario_cnpj: val(dest,'CNPJ') || val(dest,'CPF'), valor_total: Number(val(tag(inf,'ICMSTot'),'vNF'))||itens.reduce((s,i)=>s+i.vtotal,0), itens, legibilidade:'exata'};
}

/* ───────── arquivos → base64 (foto reduzida para ir rápido) ───────── */
function estB64(buf){ let s = ''; const b = new Uint8Array(buf); for(let i=0;i<b.length;i+=0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i+0x8000)); return btoa(s); }
async function estPreparar(file){
  if(file.type==='application/pdf' || /\.pdf$/i.test(file.name)){
    if(file.size > 9.5e6) throw new Error('PDF grande demais (máx. 9 MB). Mande só as páginas dos produtos.');
    return {mime:'application/pdf', b64:estB64(await file.arrayBuffer())};
  }
  if(!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) throw new Error('Arquivo não aceito: '+file.name+'. Use foto (JPG/PNG) ou PDF.');
  const url = URL.createObjectURL(file);
  try{
    const img = await new Promise((ok, erro)=>{ const i = new Image(); i.onload=()=>ok(i); i.onerror=()=>erro(new Error('Não consegui abrir a foto '+file.name+'. Se for HEIC do iPhone, tire a foto pela câmera do portal.')); i.src = url; });
    const max = 2000, k = Math.min(1, max/Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return {mime:'image/jpeg', b64:c.toDataURL('image/jpeg', 0.85).split(',')[1]};
  } finally { URL.revokeObjectURL(url); }
}

/* ───────── estado da entrada ───────── */
let EST = null;
function estNovo(){ EST = {passo:'inicio', loja:estLojaPadrao(), nota:null, itens:[], origem:'', conf:null, obs:'', feito:null, erro:''}; }
function estPintar(){ render(); }

async function estArquivos(inp, tipo){
  const files = [...(inp.files||[])]; inp.value = '';
  if(!files.length) return;
  EST.erro = '';
  try{
    if(tipo==='xml'){
      const notas = [];
      for(const f of files){ let t; const buf = await f.arrayBuffer(); try{ t = new TextDecoder('utf-8',{fatal:true}).decode(buf); }catch(e){ t = new TextDecoder('windows-1252').decode(buf); } notas.push(estLerXML(t)); }
      if(notas.length>1) toast(`${notas.length} XMLs: vou abrir um de cada vez. Começando pela nota ${notas[0].numero}.`);
      EST.fila = notas.slice(1);
      estAbrirNota(notas[0], 'xml'); return;
    }
    if(files.length>8) throw new Error('No máximo 8 fotos/arquivos por vez');
    EST.passo = 'lendo'; EST.lendoTxt = tipo==='pdf' ? 'Lendo o PDF da nota…' : 'Lendo a foto da nota…'; estPintar();
    const arquivos = []; for(const f of files) arquivos.push(await estPreparar(f));
    const r = await estApi('ler', {arquivos});
    if(!r.nota.itens.length) throw new Error('Não achei itens nessa nota. Tire a foto de frente, pegando a tabela de produtos inteira.');
    estAbrirNota(r.nota, tipo);
  }catch(e){ EST.passo = EST.nota ? 'conferir' : 'inicio'; EST.erro = e.message; estPintar(); }
}
function estAbrirNota(nota, origem){
  EST.nota = nota; EST.origem = origem; EST.conf = null; EST.passo = 'conferir'; EST.uid = null;
  EST.itens = nota.itens.map((it, n)=>{ const m = estCasar(it, nota.cnpj);
    return {...it, n:n+1, qtd_nota:it.qtd, qtd:it.qtd, produto_id:m.produto_id, como:m.como, criar: m.produto_id ? null : {nome:estNomeBonito(it.desc), preco:estSugerirPreco(it.vunit), categoria:''}}; });
  estPintar();
}
function estManual(){ EST.nota = {fornecedor:'', cnpj:'', numero:'', emissao:'', chave:'', valor_total:0, itens:[], legibilidade:'manual'}; EST.origem = 'manual'; EST.itens = []; EST.passo = 'conferir'; EST.uid = null; estPintar(); estBuscarProduto(-1); }

/* ───────── telas ───────── */
function estTela(){
  if(!EST) estNovo();
  const E = estD();
  const aviso = E.semServidor ? `<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem o estoque.</b> A administração precisa publicar o arquivo ESTOQUE no Apps Script. ${E.erro?'<br>Erro: '+esc(E.erro):''}</div></div>` : '';
  const erro = EST.erro ? `<div class="nota bad" style="margin-bottom:12px"><i class="ti ti-alert-triangle"></i><div>${esc(EST.erro)}</div></div>` : '';
  return aviso + erro + ({inicio:estInicio, lendo:estLendo, conferir:estConferir, feito:estFeito})[EST.passo]();
}
function estInicio(){
  const E = estD(), ia = E.iaPronta, adm = estAdmin();
  const semIA = !ia ? (adm ? `<button class="btn p fantasma" style="padding:0;height:auto" onclick="S.adm.estSub='config';render()">ligar a IA</button>` : 'peça à administração para ligar a IA') : '';
  const fonte = (tipo, ico, nome, sub, accept, extra='', bloqueada=false) => `<label class="est-fonte ${tipo==='xml'?'top':''}" ${bloqueada?'disabled':''}>${tipo==='xml'?'<span class="tag">exato</span>':''}<i class="ti ${ico}"></i><b>${nome}</b><small>${sub}</small>
      ${bloqueada?'':`<input type="file" accept="${accept}" ${extra} onchange="estArquivos(this,'${tipo}')">`}</label>`;
  const ultimas = (E.entradas||[]).slice(0,8);
  return `<div class="cartao pad">
    <h2 style="margin:0 0 4px;font-size:20px">📦 Receber mercadoria</h2>
    <p class="suave" style="margin:0 0 14px;font-size:14px">Mande a nota do fornecedor: o sistema lê os produtos, você confere o que chegou e o estoque da loja já sai atualizado, com relatório pronto.</p>
    <div class="campo" style="margin-bottom:4px"><label>Onde a mercadoria vai ficar?</label>${estChipsLocal(EST.loja, "EST.loja='$ID';estPintar()")}</div>
    <div class="est-fontes">
      ${fonte('xml','ti-file-code','XML da nota','O arquivo .xml que o fornecedor ou o contador manda. Leitura 100% exata, sem IA.','.xml,text/xml,application/xml','multiple')}
      ${fonte('foto','ti-camera','Foto da nota','Tire foto do DANFE (pode ser mais de uma página). A IA lê os itens.'+(ia?'':' <br><b>'+semIA+'</b>'),'image/*','multiple capture="environment"', !ia)}
      ${fonte('pdf','ti-file-type-pdf','PDF da nota','O PDF (DANFE) recebido por e-mail ou WhatsApp. A IA lê os itens.'+(ia?'':' <br><b>'+semIA+'</b>'),'application/pdf,.pdf','', !ia)}
    </div>
    <button class="btn p fantasma" onclick="estManual()"><i class="ti ti-pencil-plus"></i> Chegou sem nota? Lançar na mão</button>
  </div>
  ${!adm ? estConsulta() : ''}
  <h2 class="secao">Últimas entradas</h2>
  ${ultimas.length ? ultimas.map(estLinhaEntrada).join('') : '<p class="suave">Nenhuma entrada ainda.</p>'}`;
}
function estLinhaEntrada(e){
  const div = (e.divergencias||[]).length;
  return `<button class="est-ent" onclick="estVerEntrada('${e.id}')" style="${e.status==='cancelada'?'opacity:.5':''}"><span class="ico">${e.status==='cancelada'?'🚫':div?'⚠️':'✅'}</span>
    <div class="cresce"><b>${esc(e.fornecedor||'Sem fornecedor')} ${e.numero?'· NF '+esc(e.numero):''}</b>
    <small>${esc(estLojaNome(e.loja))} · ${quando(e.criada_em)} · ${esc(primeiroNome(e.por))} · ${estFmt(e.qtd_total)} peças${div?` · <span style="color:var(--warn)">${div} divergência(s)</span>`:''}${e.novos?` · ${e.novos} novo(s)`:''}${e.status==='cancelada'?' · cancelada':''}</small></div>
    <i class="ti ti-chevron-right apagado"></i></button>`;
}
function estLendo(){
  return `<div class="cartao est-lendo"><i class="ti ti-loader-2"></i><b style="font-size:17px">${esc(EST.lendoTxt||'Lendo…')}</b><p class="suave" style="margin:0;max-width:380px">A IA está lendo item por item. Leva de 15 segundos a 1 minuto — não feche esta tela.</p></div>`;
}
function estConferir(){
  const N = EST.nota, it = EST.itens, conf = EST.conf;
  const ligados = it.filter(i=>i.produto_id).length, novos = it.filter(i=>!i.produto_id && i.criar).length;
  const pecas = it.reduce((s,i)=>s+estN(i.qtd),0), difs = it.filter(i=>estN(i.qtd)!==estN(i.qtd_nota)).length;
  const avisos = [];
  if(N.destinatario_cnpj && N.destinatario_cnpj.replace(/\D/g,'')!==EST_CNPJ_LOJA) avisos.push(['bad','ti-alert-octagon',`<b>Essa nota não é para a Las Vegas</b> (destinatário ${esc(N.destinatario_cnpj)}). Confira antes de dar entrada.`]);
  if(/média|media|ruim/i.test(N.legibilidade||'')) avisos.push(['warn','ti-eye-exclamation',`A IA achou a foto <b>${esc(N.legibilidade)}</b> de ler. Confira quantidades e nomes com atenção${N.obs?': '+esc(N.obs):''}.`]);
  else if(N.obs) avisos.push(['info','ti-info-circle', esc(N.obs)]);
  if(it.some(i=>!EST_UN_OK.test(i.un||'UN'))) avisos.push(['warn','ti-box-multiple','Tem item vendido em <b>caixa/pacote</b> (unidade diferente de UN). Ajuste a quantidade para o número de <b>peças</b> que entram no estoque.']);
  if(EST.fila?.length) avisos.push(['info','ti-files',`Depois desta, ainda tem ${EST.fila.length} nota(s) na fila.`]);
  return `<div class="cartao pad">
    <div class="linha entre quebra" style="gap:8px;margin-bottom:12px"><h2 style="margin:0;font-size:19px">Conferir ${EST.origem==='manual'?'entrada':'a nota'} · ${esc(estLojaNome(EST.loja))}</h2>
      <span class="selo ${EST.origem==='xml'?'ok':'info'}">${({xml:'XML · exato',foto:'Foto · lida pela IA',pdf:'PDF · lido pela IA',manual:'Lançado na mão'})[EST.origem]||''}</span></div>
    <div class="est-cab">
      <div><small>Fornecedor</small><input class="inp" style="padding:4px 0;border:0;background:transparent;font-weight:700" value="${esc(N.fornecedor)}" placeholder="nome" oninput="EST.nota.fornecedor=this.value"></div>
      <div><small>Nota nº</small><input class="inp" style="padding:4px 0;border:0;background:transparent;font-weight:700" value="${esc(N.numero)}" placeholder="—" oninput="EST.nota.numero=this.value"></div>
      <div><small>Emissão</small><b>${N.emissao?ddmm(N.emissao)+'/'+N.emissao.slice(0,4):'—'}</b></div>
      <div><small>Valor da nota</small><b>${N.valor_total?brl2(N.valor_total):'—'}</b></div>
    </div>
    ${avisos.map(([c,i,t])=>`<div class="nota ${c}" style="margin-top:10px"><i class="ti ${i}"></i><div>${t}</div></div>`).join('')}
    <div class="est-resumo"><span class="selo">${it.length} itens</span><span class="selo ok">${ligados} ligados ao catálogo</span>${novos?`<span class="selo info">${novos} produto(s) novo(s)</span>`:''}<span class="selo">${estFmt(pecas)} peças</span>${difs?`<span class="selo warn">${difs} diferente(s) da nota</span>`:''}</div>
    ${estD().iaPronta && EST.origem!=='manual' ? `<label class="btn ${conf?'':'ouro'}" style="position:relative;overflow:hidden"><i class="ti ti-camera-check"></i> ${conf?'Conferir com outra foto':'Conferir com foto dos produtos (IA conta)'}<input type="file" accept="image/*" multiple capture="environment" style="position:absolute;inset:0;opacity:0;cursor:pointer" onchange="estConferirFoto(this)"></label>` : ''}
    ${conf ? `<div class="nota ${conf.itens.some(c=>c.visto!=null && c.visto!==estN((it[c.n-1]||{}).qtd_nota))?'warn':'ok'}" style="margin-top:10px"><i class="ti ti-camera"></i><div><b>Foto conferida:</b> ${esc(conf.resumo||'')}${conf.extras.length?`<br>Na foto e fora da nota: ${conf.extras.map(x=>esc(x.desc)+(x.qtd?' ('+estFmt(x.qtd)+')':'')).join(', ')}`:''}
      ${conf.itens.some(c=>c.visto!=null && c.visto!==estN((it[c.n-1]||{}).qtd))?`<br><button class="btn p fantasma" style="padding:0;height:auto" onclick="estUsarFoto()">Usar a contagem da foto onde ela conseguiu contar</button>`:''}</div></div>` : ''}
    <div class="est-itens">${it.map((x,k)=>estItem(x,k)).join('')}</div>
    <button class="btn p" style="margin-top:10px" onclick="estBuscarProduto(-1)"><i class="ti ti-plus"></i> Adicionar item</button>
    <div class="campo" style="margin-top:14px"><label>Observação (opcional)</label><input class="inp" value="${esc(EST.obs)}" placeholder="ex.: 1 caixa chegou amassada" oninput="EST.obs=this.value"></div>
    <div class="est-barra"><button class="btn" onclick="if(confirm('Descartar esta conferência?')){estNovo();estPintar()}"><i class="ti ti-x"></i> Descartar</button>
      <button class="btn pri cresce" id="btn-est-ok" onclick="estConfirmar()" ${it.length?'':'disabled'}><i class="ti ti-check"></i> <span id="est-ok-txt">Confirmar · ${estFmt(pecas)} peças</span><span class="est-ok-loja">&nbsp;em ${esc(estLojaNome(EST.loja))}</span></button></div>
  </div>`;
}
function estItem(x, k){
  const P = pdvD().produtos, p = P.find(y=>y.id===x.produto_id);
  const c = EST.conf?.itens.find(z=>z.n===x.n);
  const dif = estN(x.qtd)!==estN(x.qtd_nota);
  const cls = !x.produto_id && !x.criar ? 'ruim' : (dif || x.como==='parecido') ? 'alerta' : (x.produto_id ? 'ok' : '');
  const selo = ({ean:'<span class="selo ok">código de barras ✓</span>', aprendido:'<span class="selo ok">já conhecido ✓</span>', sku:'<span class="selo ok">referência ✓</span>', parecido:'<span class="selo warn">parecido — confira</span>', escolhido:'<span class="selo ok">escolhido ✓</span>'})[x.como]||'';
  const atual = p ? estQtdDe(p.id, EST.loja) : null;
  const foto = c ? (c.visto==null ? `<div class="est-foto nada"><i class="ti ti-camera-off"></i> Foto: não deu para contar${c.obs?' — '+esc(c.obs):''}</div>`
                   : `<div class="est-foto ${c.visto===estN(x.qtd)?'igual':'dif'}"><i class="ti ti-camera"></i> Foto: ${estFmt(c.visto)} ${c.visto===estN(x.qtd)?'✓':'— diferente'}${c.obs?' · '+esc(c.obs):''}</div>`) : '';
  return `<div class="est-item ${cls}" id="est-it-${k}">
    <div class="est-it-top"><span class="n">${x.n}</span><div class="d"><b>${esc(x.desc||p?.nome||'Item')}</b><small>${[x.cod&&'cód. '+esc(x.cod), x.ean&&'EAN '+esc(x.ean), x.un&&!EST_UN_OK.test(x.un)?'<b style="color:var(--warn)">'+esc(x.un)+'</b>':'', x.vunit?brl2(x.vunit)+' un.':''].filter(Boolean).join(' · ')}</small></div>
      <button class="icone" title="Tirar item" onclick="estTirar(${k})"><i class="ti ti-trash"></i></button></div>
    <div class="est-it-qtd">${EST.origem!=='manual'?`<span class="mini">Nota: <b>${estFmt(x.qtd_nota)}</b></span><i class="ti ti-arrow-right apagado"></i>`:''}<span class="mini">Chegou:</span>
      <input class="inp num" inputmode="decimal" value="${estFmt(x.qtd)}" oninput="estQtd(${k},this.value)" onfocus="this.select()">
      <span class="est-dif">${dif?'<span class="selo warn">diferente da nota</span>':''}</span></div>
    ${foto}
    ${x.produto_id ? `<button class="est-prod" onclick="estBuscarProduto(${k})"><span style="font-size:20px">${emojiDe(p||{})}</span><div class="cresce"><b>${esc(p?.nome||'Produto removido')}</b><small>${p?brl2(precoDe(p))+' · ':''}estoque ${esc(estLojaNome(EST.loja))}: ${estFmt(atual??0)} → <b class="est-depois">${estFmt((atual||0)+estN(x.qtd))}</b> ${selo}</small></div><i class="ti ti-switch-horizontal apagado"></i></button>`
      : x.criar ? `<div class="nota info" style="margin:0;padding:8px 10px"><i class="ti ti-sparkles"></i><div><b>Produto novo</b> — entra no catálogo do PDV. <button class="btn p fantasma" style="padding:0;height:auto" onclick="estBuscarProduto(${k})">ou ligar a um que já existe</button></div></div>
          <div class="est-novo"><input class="inp nome" value="${esc(x.criar.nome)}" placeholder="Nome no catálogo" oninput="EST.itens[${k}].criar.nome=this.value"><input class="inp num" inputmode="decimal" value="${esc(x.criar.preco)}" placeholder="Preço venda" oninput="EST.itens[${k}].criar.preco=this.value" title="Preço de venda (sugestão: custo × 2,2)"><input class="inp" list="est-cats" value="${esc(x.criar.categoria)}" placeholder="Categoria" oninput="EST.itens[${k}].criar.categoria=this.value"></div>
          <datalist id="est-cats">${[...new Set(pdvD().produtos.flatMap(catsDe))].sort().map(y=>`<option value="${esc(y)}">`).join('')}</datalist>`
      : `<button class="btn" onclick="estBuscarProduto(${k})"><i class="ti ti-link"></i> Ligar a um produto</button>`}
  </div>`;
}
/* muda a quantidade sem redesenhar a tela (não perde o foco nem o toque no próximo botão) */
function estQtd(k, v){
  const x = EST.itens[k]; x.qtd = estN(v); if(EST.origem==='manual') x.qtd_nota = x.qtd;
  const el = document.getElementById('est-it-'+k); if(!el) return;
  const dif = estN(x.qtd)!==estN(x.qtd_nota) && EST.origem!=='manual';
  el.querySelector('.est-dif').innerHTML = dif ? '<span class="selo warn">diferente da nota</span>' : '';
  el.classList.toggle('alerta', dif || x.como==='parecido'); el.classList.toggle('ok', !!x.produto_id && !dif && x.como!=='parecido');
  const dep = el.querySelector('.est-depois'); if(dep) dep.textContent = estFmt((estQtdDe(x.produto_id, EST.loja)||0) + x.qtd);
  const ok = document.getElementById('est-ok-txt'); if(ok) ok.textContent = `Confirmar · ${estFmt(EST.itens.reduce((s,i)=>s+estN(i.qtd),0))} peças`;
}
function estTirar(k){ EST.itens.splice(k,1); EST.itens.forEach((x,i)=>{ if(EST.origem==='manual') x.n = i+1; }); estPintar(); }
async function estConferirFoto(inp){
  const files = [...(inp.files||[])]; inp.value = ''; if(!files.length) return;
  const volta = EST.passo; EST.passo = 'lendo'; EST.lendoTxt = 'Contando os produtos na foto…'; EST.erro = ''; estPintar();
  try{
    const arquivos = []; for(const f of files.slice(0,8)) arquivos.push(await estPreparar(f));
    const r = await estApi('conferir', {arquivos, itens:EST.itens.map(x=>({n:x.n, desc:x.desc||'', qtd:x.qtd_nota}))});
    EST.conf = r.conferencia; EST.passo = volta; estPintar();
  }catch(e){ EST.passo = volta; EST.erro = e.message; estPintar(); }
}
function estUsarFoto(){ let n = 0; EST.conf.itens.forEach(c=>{ const x = EST.itens.find(i=>i.n===c.n); if(x && c.visto!=null && c.visto!==estN(x.qtd)){ x.qtd = c.visto; n++; } }); estPintar(); toast(n+' quantidade(s) ajustada(s) pela foto'); }

/* buscar/escolher produto do catálogo para um item (k = -1 → item novo) */
let ESTB = null;
function estBuscarProduto(k){
  ESTB = {k, q: k>=0 ? estTokens(EST.itens[k].desc).slice(0,3).join(' ') : ''};
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${k>=0?'Qual produto é este?':'Adicionar item'}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c">${k>=0?`<p class="suave" style="margin:0 0 10px;font-size:14px">Na nota: <b>${esc(EST.itens[k].desc)}</b></p>`:''}
      <input class="inp" id="estb-q" placeholder="Buscar por nome ou bipar o código…" value="${esc(ESTB.q)}" oninput="ESTB.q=this.value;estBuscaPintar()" onkeydown="if(event.key==='Enter'){const b=document.querySelector('.est-busca-res button');if(b)b.click()}">
      <div class="est-busca-res" id="estb-res"></div></div></div></div>`;
  estBuscaPintar(); setTimeout(()=>$('#estb-q')?.focus(), 50);
}
function estBuscaPintar(){
  const el = $('#estb-res'); if(!el) return;
  const q = ESTB.q.trim(), P = pdvD().produtos;
  let lista;
  if(/^\d{6,14}$/.test(q)) lista = P.filter(p=>p.codigo===q || p.sku===q);
  else if(q){ const qs = semAcento(q); lista = P.map(p=>({p, s: semAcento(p.nome+' '+p.sku+' '+p.codigo).includes(qs) ? 2 : estParecido(q, p.nome)})).filter(x=>x.s>0.25).sort((a,b)=>b.s-a.s).slice(0,40).map(x=>x.p); }
  else lista = P.slice(0,30);
  const k = ESTB.k;
  el.innerHTML = lista.map(p=>`<button class="est-prod" onclick="estEscolher('${p.id}')"><span style="font-size:20px">${emojiDe(p)}</span><div class="cresce"><b>${esc(p.nome)}</b><small>${esc(p.codigo||p.sku||'')} · ${brl2(precoDe(p))} · estoque ${esc(estLojaNome(EST.loja))}: ${estFmt(estQtdDe(p.id, EST.loja)??0)}</small></div><i class="ti ti-check apagado"></i></button>`).join('')
    + (k>=0 ? `<button class="est-prod" onclick="estEscolher('')"><span style="font-size:20px">🆕</span><div class="cresce"><b>É um produto novo</b><small>Cadastrar no catálogo com o nome da nota</small></div></button>` : '')
    + (!P.length ? `<div class="nota warn"><i class="ti ti-package-off"></i><div>O catálogo do PDV ainda está vazio. A administração importa em Administração › PDV › Produtos.</div></div>` : '');
}
function estEscolher(pid){
  const k = ESTB.k;
  if(k<0){ if(!pid) return; const p = pdvD().produtos.find(x=>x.id===pid);
    EST.itens.push({n:EST.itens.length+1, cod:'', ean:p.codigo||'', desc:p.nome, un:'UN', qtd_nota:1, qtd:1, vunit:0, produto_id:p.id, como:'escolhido', criar:null}); }
  else { const x = EST.itens[k];
    if(pid){ x.produto_id = pid; x.como = 'escolhido'; x.criar = null; }
    else { x.produto_id = ''; x.como = ''; x.criar = {nome:estNomeBonito(x.desc), preco:estSugerirPreco(x.vunit), categoria:''}; } }
  fecharModal(); estPintar();
}

async function estConfirmar(){
  const semPreco = EST.itens.filter(x=>!x.produto_id && x.criar && !estN(x.criar.preco));
  if(semPreco.length && !confirm(semPreco.length+' produto(s) novo(s) sem preço de venda: eles entram no estoque, mas ficam ocultos no PDV até a administração colocar o preço. Continuar?')) return;
  const b = $('#btn-est-ok'); if(b){ b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Gravando…'; }
  const N = EST.nota;
  EST.uid = EST.uid || ('e'+Date.now()+Math.floor(Math.random()*1e4));   // mesmo uid se clicar de novo depois de um erro de rede → o servidor não soma 2×
  const entrada = {uid:EST.uid, loja:EST.loja, fornecedor:N.fornecedor, cnpj:N.cnpj, numero:N.numero, chave_nfe:N.chave, emissao:N.emissao, valor_total:N.valor_total, origem:EST.origem, obs:EST.obs,
    itens: EST.itens.map(x=>({cod:x.cod, ean:x.ean, desc:x.desc, un:x.un, qtd_nota:estN(x.qtd_nota), qtd:estN(x.qtd), vunit:x.vunit, produto_id:x.produto_id||'', visto: EST.conf?.itens.find(c=>c.n===x.n)?.visto ?? null,
      criar: x.produto_id ? null : {...x.criar, codigo:x.ean, preco: estN(x.criar?.preco) ? String(estN(x.criar.preco)) : ''}}))};
  try{
    const d = await estApi('confirmar', {entrada});
    if(estAdmin()) S.adm.dados = d; else S.sess.dados = d;
    EST.feito = d.entradaFeita; EST.passo = 'feito'; EST.erro = ''; EST.uid = null;
    estPintar(); try{ chuvaConfete(); }catch(e){}
  }catch(e){ EST.erro = e.message; estPintar(); }
}

function estRelatorio(e){
  const L = [`*📦 Entrada de mercadoria — ${estLojaNome(e.loja)}*`, `_${[e.fornecedor, e.numero?'NF '+e.numero:'', quando(e.criada_em)].filter(Boolean).join(' · ')}_`, '',
    `✅ *${e.itens.length} itens · ${estFmt(e.qtd_total)} peças*${e.valor_total?' · '+brl2(e.valor_total):''}`];
  if(e.divergencias.length){ L.push('', `⚠️ *Divergências (${e.divergencias.length})*`); e.divergencias.forEach(x=>L.push(`• ${x.produto}: nota ${estFmt(x.nota)}, chegou *${estFmt(x.recebido)}*`)); }
  const novos = e.itens.filter(i=>i.novo); if(novos.length){ L.push('', `🆕 *Produtos novos no catálogo (${novos.length})*`); novos.slice(0,15).forEach(i=>L.push('• '+i.produto)); }
  if(e.obs) L.push('', '📝 '+e.obs);
  L.push('', `👤 Conferido por ${e.por}`);
  return L.join('\n');
}
function estFeito(){
  const e = EST.feito, txt = estRelatorio(e);
  const prox = EST.fila?.length ? `<button class="btn ouro" onclick="const n=EST.fila.shift(), f=EST.fila, l=EST.loja; estNovo(); EST.loja=l; EST.fila=f; estAbrirNota(n,'xml')"><i class="ti ti-arrow-right"></i> Próxima nota (${EST.fila.length})</button>` : '';
  return `<div class="cartao est-feito"><div class="big">${e.divergencias.length?'⚠️':'🎉'}</div>
    <h2 style="margin:0;font-size:22px">Entrada confirmada!</h2>
    <p class="suave" style="margin:0">${estFmt(e.qtd_total)} peças entraram no estoque da ${esc(estLojaNome(e.loja))}${e.divergencias.length?` · <b style="color:var(--warn)">${e.divergencias.length} divergência(s) registrada(s)</b>`:''}.</p>
    <div class="est-relat">${esc(txt)}</div>
    <div class="linha quebra" style="gap:8px;justify-content:center"><button class="btn ouro" onclick="estCopiar()"><i class="ti ti-brand-whatsapp"></i> Copiar relatório</button>${prox}
      <button class="btn" onclick="estNovo();estPintar()"><i class="ti ti-plus"></i> Nova entrada</button></div></div>`;
}
function estCopiar(){ const t = estRelatorio(EST.feito); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Relatório copiado ✔ Cole no WhatsApp')).catch(()=>{ window.open('https://wa.me/?text='+encodeURIComponent(t)); }); }

function estVerEntrada(id){
  const e = (estD().entradas||[]).find(x=>x.id===id); if(!e) return;
  const adm = estAdmin();
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal largo">
    <div class="modal-t"><h3 class="cresce">${esc(e.fornecedor||'Entrada')} ${e.numero?'· NF '+esc(e.numero):''}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 10px;font-size:14px">${esc(estLojaNome(e.loja))} · ${quando(e.criada_em)} · por ${esc(e.por)} · ${({xml:'XML',foto:'foto + IA',pdf:'PDF + IA',manual:'na mão'})[e.origem]||esc(e.origem)}${e.status==='cancelada'?` · <b style="color:var(--bad)">cancelada por ${esc(e.cancelada_por)}</b>`:''}</p>
      ${e.obs?`<div class="nota info" style="margin-bottom:10px"><i class="ti ti-note"></i><div>${esc(e.obs)}</div></div>`:''}
      <div class="tabela"><table><thead><tr><th>Produto</th><th>Nota</th><th>Chegou</th>${e.itens.some(i=>i.visto!=null)?'<th>Foto</th>':''}<th>Custo un.</th></tr></thead><tbody>
      ${e.itens.map(i=>`<tr style="${i.qtd!==i.qtd_nota?'color:var(--warn)':''}"><td>${i.novo?'🆕 ':''}${esc(i.produto)}<br><small class="apagado">${esc(i.desc)}</small></td><td class="n num">${estFmt(i.qtd_nota)}</td><td class="n num"><b>${estFmt(i.qtd)}</b></td>${e.itens.some(z=>z.visto!=null)?`<td class="n num">${i.visto==null?'—':estFmt(i.visto)}</td>`:''}<td class="n num">${i.vunit?brl2(i.vunit):''}</td></tr>`).join('')}</tbody></table></div>
      <div class="linha quebra" style="gap:8px;margin-top:12px"><button class="btn" onclick="EST={...(EST||{}),feito:(estD().entradas||[]).find(x=>x.id==='${e.id}')};estCopiar()"><i class="ti ti-brand-whatsapp"></i> Copiar relatório</button>
      ${adm && e.status==='confirmada'?`<button class="btn" style="color:var(--bad)" onclick="estCancelarEntrada('${e.id}')"><i class="ti ti-arrow-back-up"></i> Cancelar entrada (tira do estoque)</button>`:''}</div></div></div></div>`;
}
async function estCancelarEntrada(id){
  const motivo = prompt('Por que cancelar esta entrada? As peças saem do estoque da loja.'); if(!motivo) return;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'cancelar', id, motivo}); fecharModal(); render(); toast('Entrada cancelada ✔ Estoque devolvido'); }catch(e){ toast(e.message, true); }
}

/* consulta rápida de estoque (equipe) */
function estConsulta(){
  const q = S.estQ||'', P = pdvD().produtos, lojas = estLocaisIds();
  const qs = semAcento(q.trim());
  const lista = qs.length>=2 ? P.filter(p=>semAcento(p.nome+' '+p.codigo+' '+p.sku).includes(qs)).slice(0,12) : [];
  return `<h2 class="secao">Tem na loja? <small>consulta rápida</small></h2>
    <div class="cartao pad"><input class="inp" id="est-cq" placeholder="Digite o produto ou bipe o código…" value="${esc(q)}" oninput="S.estQ=this.value;clearTimeout(window._ecq);window._ecq=setTimeout(()=>{render();const i=$('#est-cq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},250)">
    ${lista.length?`<div class="tabela est-tab" style="margin-top:10px"><table><thead><tr><th>Produto</th>${lojas.map(l=>`<th>${esc(estLojaNome(l))}</th>`).join('')}</tr></thead><tbody>${lista.map(p=>`<tr><td>${emojiDe(p)} ${esc(p.nome)}</td>${lojas.map(l=>{ const v = estQtdDe(p.id,l); return `<td class="q ${v!=null&&v<=0?'zero':''}">${v==null?'—':estFmt(v)}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`: qs.length>=2?'<p class="suave" style="margin:10px 0 0">Nada encontrado.</p>':''}</div>`;
}

/* ═════════ ADMINISTRAÇÃO › ESTOQUE ═════════ */
function admEstoque(){
  const sub = S.adm.estSub || 'saldo', E = estD();
  const subs = [['saldo','ti-stack-2','Saldo por loja'],['receber','ti-truck-delivery','Receber mercadoria'],['entradas','ti-file-invoice','Entradas'],['movimentos','ti-arrows-exchange','Movimentos'],['importar','ti-file-import','Saldo inicial'],['config','ti-settings','Configurar']];
  const corpo = ({saldo:admEstSaldo, receber:estTela, entradas:admEstEntradas, movimentos:admEstMov, importar:admEstImportar, config:admEstConfig})[sub]();
  return `${E.semServidor?`<div class="nota warn" style="margin-bottom:12px"><i class="ti ti-plug-connected-x"></i><div><b>O servidor ainda não tem o estoque.</b> Abra o Apps Script, crie o arquivo <b>ESTOQUE</b>, cole o código e publique uma nova versão. ${E.erro?'<br>Erro: '+esc(E.erro):''}</div></div>`:''}
    ${!E.semServidor && !E.iaPronta && sub!=='config'?`<div class="nota info" style="margin-bottom:12px"><i class="ti ti-sparkles"></i><div>A entrada por <b>XML</b> já funciona. Para ler <b>foto e PDF</b> da nota, ligue a IA em <button class="btn p fantasma" style="padding:0;height:auto" onclick="S.adm.estSub='config';render()">Configurar</button>.</div></div>`:''}
    <div class="pdv-sub">${subs.map(([k,i,n])=>`<button class="${sub===k?'on':''}" onclick="S.adm.estSub='${k}';render()"><i class="ti ${i}"></i>${n}</button>`).join('')}</div>${corpo}`;
}
function admEstSaldo(){
  const P = pdvD().produtos, E = estD(), lojas = estLocaisIds(), f = S.adm.estF || 'todos', qs = semAcento(S.adm.estQ||'');
  const sal = {}; E.saldos.forEach(s=>{ (sal[s.produto_id] = sal[s.produto_id] || {})[s.loja] = s; });
  let linhas = P.map(p=>{ const s = sal[p.id]||{}; const tot = lojas.reduce((a,l)=>a+(s[l]?.qtd||0),0); return {p, s, tot, tem: Object.keys(s).length>0}; });
  if(qs) linhas = linhas.filter(x=>semAcento(x.p.nome+' '+x.p.codigo+' '+x.p.sku+' '+x.p.categoria).includes(qs));
  const baixo = x => lojas.some(l=>x.s[l] && x.s[l].minimo>0 && x.s[l].qtd<=x.s[l].minimo);
  const cont = {todos:linhas.length, com:linhas.filter(x=>x.tem).length, zerado:linhas.filter(x=>x.tem && lojas.some(l=>x.s[l] && x.s[l].qtd<=0)).length, baixo:linhas.filter(baixo).length, sem:linhas.filter(x=>!x.tem).length};
  linhas = linhas.filter(x=> f==='todos' || (f==='com'&&x.tem) || (f==='zerado'&&x.tem&&lojas.some(l=>x.s[l]&&x.s[l].qtd<=0)) || (f==='baixo'&&baixo(x)) || (f==='sem'&&!x.tem)).sort((a,b)=>a.p.nome.localeCompare(b.p.nome));
  const pecas = l => E.saldos.filter(s=>s.loja===l && s.qtd>0).reduce((a,s)=>a+s.qtd,0);
  return `<div class="numeros" style="margin-bottom:12px">${lojas.map(l=>`<div class="numero"><small>${esc(estLojaNome(l))}</small><b class="num">${estFmt(pecas(l))}</b><span>peças em estoque</span></div>`).join('')}
      <div class="numero"><small>Produtos com saldo</small><b class="num">${cont.com}</b><span>de ${P.length} no catálogo</span></div></div>
    <div class="est-q"><input class="inp" style="max-width:320px" id="est-aq" placeholder="Buscar produto…" value="${esc(S.adm.estQ||'')}" oninput="S.adm.estQ=this.value;clearTimeout(window._eaq);window._eaq=setTimeout(()=>{render();const i=$('#est-aq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},250)">
      ${[['todos','Todos'],['com','Com saldo'],['zerado','Zerados/negativos'],['baixo','Abaixo do mínimo'],['sem','Nunca contados']].map(([k,n])=>`<button class="selo ${f===k?'info':''}" style="cursor:pointer;border:0" onclick="S.adm.estF='${k}';render()">${n} · ${cont[k]}</button>`).join('')}
      <button class="btn p" onclick="estExportarSaldo()"><i class="ti ti-download"></i> Exportar CSV</button></div>
    ${!P.length?`<div class="nota warn"><i class="ti ti-package-off"></i><div><b>Primeiro o catálogo:</b> importe os produtos em Administração › PDV › Produtos (CSV da Nuvemshop). O estoque é ligado a esses produtos.</div></div>`:''}
    <div class="tabela est-tab"><table><thead><tr><th>Produto</th>${lojas.map(l=>`<th style="text-align:center">${esc(estLojaNome(l))}</th>`).join('')}<th style="text-align:center">Total</th></tr></thead><tbody>
      ${linhas.slice(0,300).map(x=>`<tr class="clica" onclick="admEstAjuste('${x.p.id}')"><td>${emojiDe(x.p)} ${esc(x.p.nome)}<br><small class="apagado">${esc(x.p.codigo||x.p.sku||'')}</small></td>${lojas.map(l=>{ const s = x.s[l]; return `<td class="q ${s&&s.qtd<=0?'zero':s&&s.minimo>0&&s.qtd<=s.minimo?'baixo':''}">${s?estFmt(s.qtd):'<span class="apagado">—</span>'}</td>`; }).join('')}<td class="q">${x.tem?estFmt(x.tot):''}</td></tr>`).join('') || `<tr><td colspan="${lojas.length+2}" class="suave">Nada aqui.</td></tr>`}</tbody></table></div>
    ${linhas.length>300?`<p class="apagado" style="font-size:13px;margin-top:8px">Mostrando 300 de ${linhas.length}. Use a busca.</p>`:''}`;
}
function estExportarSaldo(){
  const P = pdvD().produtos, lojas = estLocaisIds(), sal = {};
  estD().saldos.forEach(s=>{ (sal[s.produto_id] = sal[s.produto_id] || {})[s.loja] = s.qtd; });
  const q = v => '"'+String(v??'').replace(/"/g,'""')+'"';
  const linhas = [['Produto','Código de barras','SKU','Categoria',...lojas.map(estLojaNome),'Total'].map(q).join(';')]
    .concat(P.map(p=>{ const s = sal[p.id]||{}; return [p.nome,p.codigo,p.sku,p.categoria,...lojas.map(l=>s[l]??''),lojas.reduce((a,l)=>a+(s[l]||0),0)].map(q).join(';'); }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿'+linhas.join('\n')],{type:'text/csv'})); a.download = 'estoque-las-vegas-'+hojeISO()+'.csv'; a.click();
}
let AJ = null;
function admEstAjuste(pid){
  const p = pdvD().produtos.find(x=>x.id===pid), lojas = estLocaisIds();
  AJ = {pid, obs:'', v:Object.fromEntries(lojas.map(l=>{ const s = estD().saldos.find(x=>x.produto_id===pid && x.loja===l); return [l, {qtd: s?String(s.qtd):'', minimo: s&&s.minimo?String(s.minimo):'', antes: s?s.qtd:null}]; }))};
  const movs = (estD().movimentos||[]).filter(m=>m.produto_id===pid).slice(0,12);
  $('#modal').innerHTML = `<div class="veu" onclick="if(event.target===this)fecharModal()"><div class="modal">
    <div class="modal-t"><h3 class="cresce">${emojiDe(p)} ${esc(p.nome)}</h3><button class="icone" onclick="fecharModal()"><i class="ti ti-x"></i></button></div>
    <div class="modal-c"><p class="suave" style="margin:0 0 12px;font-size:14px">Contou e deu diferente? Ponha o número <b>real</b> da prateleira. O mínimo avisa quando precisa repor.</p>
      ${lojas.map(l=>`<div class="g2"><div class="campo"><label>${esc(estLojaNome(l))} — qtd</label><input class="inp num" inputmode="decimal" value="${esc(AJ.v[l].qtd)}" placeholder="não contado" oninput="AJ.v['${l}'].qtd=this.value"></div>
        <div class="campo"><label>Mínimo</label><input class="inp num" inputmode="decimal" value="${esc(AJ.v[l].minimo)}" placeholder="opcional" oninput="AJ.v['${l}'].minimo=this.value"></div></div>`).join('')}
      <div class="campo"><label>Motivo</label><input class="inp" placeholder="ex.: contagem do mês, quebrou, brinde, troca" oninput="AJ.obs=this.value"></div>
      <button class="btn pri largo" id="btn-aj" onclick="admEstSalvarAjuste()"><i class="ti ti-device-floppy"></i> Salvar</button>
      ${movs.length?`<h2 class="secao" style="margin-top:16px">Últimos movimentos</h2><div class="tabela"><table><tbody>${movs.map(m=>`<tr><td>${quando(m.quando)}<br><small class="apagado">${esc(estLojaNome(m.loja))} · ${esc(m.por)}</small></td><td>${esc(estD().tipos?.[m.tipo]||m.tipo)}<br><small class="apagado">${esc(m.ref||m.obs||'')}</small></td><td class="n num" style="color:${Number(m.qtd)<0?'var(--bad)':'var(--ok)'}">${Number(m.qtd)>0?'+':''}${estFmt(Number(m.qtd))}</td><td class="n num">${estFmt(Number(m.saldo))}</td></tr>`).join('')}</tbody></table></div>`:''}
    </div></div></div>`;
}
async function admEstSalvarAjuste(){
  const lista = Object.entries(AJ.v).filter(([l,v])=>v.qtd!=='' && (estN(v.qtd)!==v.antes || v.minimo!=='')).map(([loja,v])=>({produto_id:AJ.pid, loja, qtd:estN(v.qtd), minimo:v.minimo}));
  if(!lista.length) return fecharModal();
  if(!AJ.obs.trim()) return toast('Conte o motivo do ajuste', true);
  const b = $('#btn-aj'); b.disabled = true;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'ajuste', lista, obs:AJ.obs}); fecharModal(); render(); toast('Estoque ajustado ✔'); }catch(e){ toast(e.message, true); b.disabled = false; }
}
function admEstEntradas(){
  const L = estD().entradas||[];
  const mes = L.filter(e=>e.status==='confirmada' && mesDe(e.criada_em)===mesDe(hojeISO()));
  return `<div class="numeros" style="margin-bottom:12px"><div class="numero"><small>Entradas no mês</small><b class="num">${mes.length}</b><span>notas conferidas</span></div>
      <div class="numero"><small>Peças recebidas</small><b class="num">${estFmt(mes.reduce((s,e)=>s+e.qtd_total,0))}</b><span>no mês</span></div>
      <div class="numero"><small>Valor em notas</small><b class="num">${brl(mes.reduce((s,e)=>s+e.valor_total,0))}</b><span>no mês</span></div>
      <div class="numero"><small>Com divergência</small><b class="num ${mes.some(e=>e.divergencias.length)?'':'pos'}">${mes.filter(e=>e.divergencias.length).length}</b><span>falta/sobra na conferência</span></div></div>
    ${L.length ? L.map(estLinhaEntrada).join('') : '<p class="suave">Nenhuma entrada ainda. Use “Receber mercadoria”.</p>'}`;
}
function admEstMov(){
  const qs = semAcento(S.adm.estMq||''), T = estD().tipos||{};
  const L = (estD().movimentos||[]).filter(m=>!qs || semAcento(m.produto+' '+m.ref+' '+m.por+' '+m.obs).includes(qs)).slice(0,300);
  return `<div class="est-q"><input class="inp" style="max-width:320px" id="est-mq" placeholder="Filtrar por produto, nota, pessoa…" value="${esc(S.adm.estMq||'')}" oninput="S.adm.estMq=this.value;clearTimeout(window._emq);window._emq=setTimeout(()=>{render();const i=$('#est-mq');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},250)"></div>
    <div class="tabela"><table><thead><tr><th>Quando</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Saldo</th></tr></thead><tbody>
    ${L.map(m=>`<tr><td>${quando(m.quando)}<br><small class="apagado">${esc(estLojaNome(m.loja))} · ${esc(primeiroNome(m.por))}</small></td><td>${esc(m.produto)}</td><td>${esc(T[m.tipo]||m.tipo)}<br><small class="apagado">${esc(m.ref||'')}${m.obs?' · '+esc(m.obs):''}</small></td><td class="n num" style="color:${Number(m.qtd)<0?'var(--bad)':'var(--ok)'}">${Number(m.qtd)>0?'+':''}${estFmt(Number(m.qtd))}</td><td class="n num">${estFmt(Number(m.saldo))}</td></tr>`).join('') || '<tr><td colspan="5" class="suave">Nenhum movimento ainda.</td></tr>'}</tbody></table></div>`;
}

/* saldo inicial: a lista do PDV antigo (CSV/Excel colado) → define o número exato por loja */
let SI = null;
function admEstImportar(){
  SI = SI || {loja:estLocaisIds()[0], linhas:null, txt:''};
  return `<div class="cartao pad" style="max-width:860px">
    <h2 style="margin:0 0 4px;font-size:18px">Saldo inicial (o que está nas lojas hoje)</h2>
    <p class="suave" style="margin:0 0 12px;font-size:14px">Use a lista de estoque do PDV de cada loja: CSV/Excel com <b>código de barras</b> (ou nome) e <b>quantidade</b>. O número que vier aqui <b>substitui</b> o saldo daquela loja. Faça uma loja de cada vez.</p>
    <div class="campo"><label>Local</label>${estChipsLocal(SI.loja, "SI.loja='$ID';admEstPrever(SI.txt)")}</div>
    <div class="campo"><label>Arquivo CSV</label><input class="inp" type="file" accept=".csv,.txt,text/csv" style="padding-top:10px" onchange="admEstArquivo(this)"></div>
    <div class="campo"><label>…ou cole do Excel (com a linha de títulos: Código; Produto; Quantidade)</label><textarea class="inp" placeholder="Código;Produto;Quantidade" oninput="admEstPrever(this.value)">${esc(SI.txt)}</textarea></div>
    <div id="si-prev">${admEstPrevHtml()}</div></div>`;
}
async function admEstArquivo(inp){
  const f = inp.files[0]; if(!f) return; const buf = await f.arrayBuffer();
  let t; try{ t = new TextDecoder('utf-8',{fatal:true}).decode(buf); }catch(e){ t = new TextDecoder('windows-1252').decode(buf); }
  admEstPrever(t);
}
function admEstPrever(txt){
  SI.txt = txt; SI.linhas = null;
  if(txt.trim()){
    const rows = lerCSV(txt);
    const cab = (rows[0]||[]).map(h=>semAcento(h).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim());
    const acha = (...n) => { for(const x of n){ const i = cab.indexOf(x); if(i>=0) return i; } for(const x of n){ const i = cab.findIndex(h=>h.startsWith(x)); if(i>=0) return i; } return -1; };
    const iQ = acha('quantidade','qtd','qtde','estoque','saldo','estoque atual','qtd atual','quant');
    const iCod = acha('codigo de barras','cod barras','ean','gtin','codigo','cod');
    const iSku = acha('sku','referencia','ref','cod interno','codigo interno');
    const iNome = acha('produto','nome','descricao','descricao do produto','item');
    if(iQ<0 || (iCod<0 && iNome<0 && iSku<0)) SI.linhas = 'erro';
    else {
      const P = pdvD().produtos;
      SI.linhas = rows.slice(1).map(r=>{ const g = i => i>=0 ? String(r[i]??'').trim() : '';
        const cod = g(iCod).replace(/\.0$/,''), sku = g(iSku), nome = g(iNome), qtd = estN(g(iQ));
        let p = (cod && P.find(x=>x.codigo===cod || x.sku===cod)) || (sku && P.find(x=>x.sku===sku || x.codigo===sku)) || (nome && P.find(x=>semAcento(x.nome)===semAcento(nome)));
        let como = p ? 'exato' : '';
        if(!p && nome){ let best=null, s=0; P.forEach(x=>{ const v = estParecido(nome, x.nome); if(v>s){ s=v; best=x; } }); if(best && s>=0.75){ p = best; como = 'parecido'; } }
        return {cod, nome, qtd, p, como};
      }).filter(x=>x.cod || x.nome);
    }
  }
  const el = $('#si-prev'); if(el) el.innerHTML = admEstPrevHtml(); else render();
  document.querySelectorAll('.est-lojas button').forEach(b=>b.classList.toggle('on', b.textContent.trim()===estLojaNome(SI.loja)));
}
function admEstPrevHtml(){
  if(!SI || !SI.linhas) return '';
  if(SI.linhas==='erro') return `<div class="nota bad"><i class="ti ti-alert-triangle"></i><div>Não achei as colunas. A primeira linha precisa ter <b>Quantidade</b> e <b>Código</b> (ou <b>Produto</b>).</div></div>`;
  const ok = SI.linhas.filter(x=>x.p), sem = SI.linhas.filter(x=>!x.p), par = ok.filter(x=>x.como==='parecido');
  return `<div class="nota ${sem.length?'warn':'ok'}"><i class="ti ti-${sem.length?'alert-triangle':'check'}"></i><div><b>${ok.length} de ${SI.linhas.length} produtos encontrados no catálogo</b>${par.length?` (${par.length} pelo nome parecido — confira abaixo)`:''}.${sem.length?` <b>${sem.length} não estão no catálogo</b>: importe o catálogo completo antes (PDV › Produtos) ou eles ficam de fora.`:''}</div></div>
    <div class="tabela pdv-prev" style="margin-top:10px"><table><thead><tr><th>Na lista</th><th>No catálogo</th><th>Qtd</th></tr></thead><tbody>
    ${[...par, ...sem, ...ok.filter(x=>x.como==='exato')].slice(0,40).map(x=>`<tr style="${!x.p?'opacity:.55':''}"><td>${esc(x.nome||x.cod)}<br><small class="apagado">${esc(x.cod)}</small></td><td>${x.p?esc(x.p.nome)+(x.como==='parecido'?' <span class="selo warn">parecido</span>':''):'<span class="selo bad">não achei</span>'}</td><td class="n num">${estFmt(x.qtd)}</td></tr>`).join('')}
    ${SI.linhas.length>40?`<tr><td colspan="3" class="apagado">… e mais ${SI.linhas.length-40}</td></tr>`:''}</tbody></table></div>
    ${ok.length?`<button class="btn ouro largo" id="btn-si" style="margin-top:12px" onclick="admEstConfirmarSaldo()"><i class="ti ti-database-import"></i> Definir saldo de ${ok.length} produtos na ${esc(estLojaNome(SI.loja))}</button>`:''}`;
}
async function admEstConfirmarSaldo(){
  const ok = SI.linhas.filter(x=>x.p), soma = {};
  ok.forEach(x=>{ soma[x.p.id] = (soma[x.p.id]||0) + x.qtd; });
  if(!confirm(`Substituir o saldo de ${Object.keys(soma).length} produtos na ${estLojaNome(SI.loja)} pelos números da lista?`)) return;
  const b = $('#btn-si'); b.disabled = true; b.innerHTML = '<i class="ti ti-loader-2"></i> Gravando… (pode levar até 1 minuto)';
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'saldo', ref:'Saldo inicial · PDV '+estLojaNome(SI.loja), lista:Object.entries(soma).map(([produto_id,qtd])=>({produto_id, loja:SI.loja, qtd}))});
    SI = null; S.adm.estSub = 'saldo'; render(); toast('Saldo da loja definido ✔'); }
  catch(e){ toast(e.message, true); b.disabled = false; }
}
let ECF = null;
function admEstConfig(){
  const E = estD(), c = E.cfg||{};
  ECF = ECF || {prov:c.ia_provedor||'anthropic', chave:'', baixa:!!c.baixa_pdv};
  return `<div class="cartao pad" style="max-width:760px">
    <h2 style="margin:0 0 6px;font-size:18px"><i class="ti ti-sparkles"></i> IA que lê a nota</h2>
    <div class="nota ${E.iaPronta?'ok':'warn'}" style="margin-bottom:12px"><i class="ti ti-${E.iaPronta?'check':'plug-connected-x'}"></i><div>${E.iaPronta?'<b>Ligada.</b> A equipe já pode mandar foto e PDF da nota.':'<b>Desligada.</b> Só o XML funciona. Cole uma chave abaixo para ligar foto e PDF.'}</div></div>
    <div class="campo"><label>Qual IA</label><div class="est-lojas">
      <button class="${ECF.prov==='anthropic'?'on':''}" onclick="ECF.prov='anthropic';render()">Claude (Anthropic)</button>
      <button class="${ECF.prov==='gemini'?'on':''}" onclick="ECF.prov='gemini';render()">Gemini (Google)</button></div></div>
    <p class="suave" style="font-size:13.5px;margin:0 0 10px">${ECF.prov==='anthropic'?'Crie a chave em <b>console.anthropic.com</b> › API Keys (começa com <b>sk-ant-</b>). Cobra por uso: uma nota costuma custar poucos centavos.':'Crie a chave em <b>aistudio.google.com</b> › Get API key. Tem cota gratuita diária.'}</p>
    <div class="campo"><label>Chave da API ${E.iaPronta?'(deixe em branco para manter a atual)':''}</label><input class="inp" type="password" autocomplete="off" placeholder="${ECF.prov==='anthropic'?'sk-ant-…':'AIza…'}" value="${esc(ECF.chave)}" oninput="ECF.chave=this.value"></div>
    <p class="apagado" style="font-size:12.5px;margin:-4px 0 12px">A chave fica guardada no servidor (Propriedades do Apps Script), nunca na planilha nem no celular de ninguém.</p>
    <h2 style="margin:18px 0 6px;font-size:18px"><i class="ti ti-shopping-cart"></i> Baixa automática nas vendas</h2>
    <label class="linha" style="gap:10px;align-items:flex-start;margin-bottom:6px;cursor:pointer"><input type="checkbox" ${ECF.baixa?'checked':''} onchange="ECF.baixa=this.checked" style="margin-top:4px"><div><b>Tirar do estoque quando vender pelo PDV do portal</b><br><span class="suave" style="font-size:13.5px">Cada venda tira da <b>prateleira</b> da loja onde foi feita. Venda desfeita ou cancelada devolve. O que for vendido pelo PDV antigo o portal não vê: por isso o ideal é as lojas venderem só pelo portal.</span></div></label>
    <div class="linha quebra" style="gap:8px;margin-top:14px"><button class="btn pri" id="btn-ecf" onclick="admEstSalvarCfg()"><i class="ti ti-device-floppy"></i> Salvar</button>
      ${E.iaPronta?`<button class="btn p" style="color:var(--bad)" onclick="if(confirm('Desligar a IA e apagar a chave?')){ECF.chave='__apagar';admEstSalvarCfg()}">Apagar chave</button>`:''}</div></div>`;
}
async function admEstSalvarCfg(){
  const cfg = {ia_provedor:ECF.prov, baixa_pdv:ECF.baixa};
  if(ECF.chave==='__apagar') cfg.chave = ''; else if(ECF.chave.trim()) cfg.chave = ECF.chave.trim();
  const b = $('#btn-ecf'); if(b) b.disabled = true;
  try{ S.adm.dados = await api('admEstoque', {...S.adm.cred, op:'cfg', cfg}); ECF = null; render(); toast('Configuração do estoque salva ✔'); }
  catch(e){ toast(e.message, true); if(b) b.disabled = false; }
}

/* ───────── encaixe no portal e na administração, sem mexer nos arquivos antigos ───────── */
function portalEstoque(){ return estTela(); }
const _telaPortalV9 = telaPortal;
telaPortal = function telaPortal(){
  const naEst = S.portalTab === 'estoque';
  if(naEst) S.portalTab = 'atalhos';
  let h = _telaPortalV9();
  if(naEst){
    S.portalTab = 'estoque';
    const base = portalAtalhos(), i = h.lastIndexOf(base);
    if(i >= 0) h = h.slice(0, i) + portalEstoque() + h.slice(i + base.length);
    h = h.replace(`class="aba on" style="flex:0 0 auto" onclick="S.portalTab='atalhos'`, `class="aba " style="flex:0 0 auto" onclick="S.portalTab='atalhos'`);
  }
  const btn = `<button class="aba ${naEst?'on':''}" style="flex:0 0 auto" onclick="S.portalTab='estoque';S.protoAberto=null;render()"><i class="ti ti-truck-delivery"></i> Receber </button>`;
  const ancora = h.indexOf(`onclick="S.portalTab='mural'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _portalMaisV9 = portalMais;
portalMais = function portalMais(){
  return `<button class="pedido" style="width:100%;text-align:left;cursor:pointer" onclick="S.portalTab='estoque';render()"><div class="ico"><i class="ti ti-truck-delivery"></i></div><div class="cresce"><b>Receber mercadoria</b><p>Nota do fornecedor → estoque da loja · consultar estoque</p></div><i class="ti ti-chevron-right apagado"></i></button>` + _portalMaisV9();
};
const _telaAdminV9 = telaAdmin;
telaAdmin = function telaAdmin(){
  const A = S.adm, naEst = A.tab === 'estoque';
  if(naEst) A.tab = 'regras';
  let h = _telaAdminV9();
  if(naEst){
    A.tab = 'estoque';
    const base = admRegras(), i = h.lastIndexOf(base);
    if(i >= 0) h = h.slice(0, i) + admEstoque() + h.slice(i + base.length);
    h = h.replace(`class="aba on" onclick="S.adm.tab='regras'`, `class="aba " onclick="S.adm.tab='regras'`);
  }
  const btn = `<button class="aba ${naEst?'on':''}" onclick="S.adm.tab='estoque';TR=null;render()"><i class="ti ti-packages"></i> Estoque </button>`;
  const ancora = h.indexOf(`onclick="S.adm.tab='pedidos'`);
  if(ancora > 0){ const ini = h.lastIndexOf('<button', ancora); h = h.slice(0, ini) + btn + h.slice(ini); }
  return h;
};
const _itensBuscaV9 = itensBusca;
itensBusca = function itensBusca(){
  const r = _itensBuscaV9();
  if(S.adm && S.tela==='admin'){
    r.unshift({t:'Estoque', s:'Saldo por loja, entradas e ajustes', i:'ti-packages', go:()=>{ S.adm.tab='estoque'; S.adm.estSub='saldo'; render(); }});
    r.unshift({t:'Receber mercadoria', s:'Nota do fornecedor → estoque', i:'ti-truck-delivery', go:()=>{ S.adm.tab='estoque'; S.adm.estSub='receber'; render(); }});
  } else if(S.sess) r.unshift({t:'Receber mercadoria', s:'Nota do fornecedor → estoque da loja', i:'ti-truck-delivery', go:()=>{ S.tela='portal'; S.portalTab='estoque'; render(); }});
  return r;
};
