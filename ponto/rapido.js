/* ═══════════ Velocidade · etapa 1 (11/11/2026) — rapido.js ═══════════
   A Arena da vendedora atualiza a cada 30 s. Antes pedia o pacote inteiro ("dados": catálogo, estoque, ponto…,
   ~18 s no servidor). Agora pede só o que a Arena usa — vendas do mês (PDV + Kommo) e metas — pela ação leve
   "arena" do servidor (LEVE.gs) e encaixa no pacote que já está no aparelho. A cada 10 min busca o pacote inteiro.
   • Servidor ainda sem o LEVE.gs ("Ação desconhecida"): volta sozinho para o jeito antigo.
   • Administração: nada muda (já usava o "ao vivo", que é leve).
   Para desligar: tirar a linha do rapido.js no app9.js. */
const RAP = { naArena:false, semLeve:false, completoEm:0, COMPLETO_MS:10*60e3 };

const _arenaBuscarRap = arenaBuscar;
arenaBuscar = async function arenaBuscar(){
  RAP.naArena = true;                       // o pedido "dados" sai na hora (antes do 1º await), ainda com a marca ligada
  let p; try{ p = _arenaBuscarRap.apply(this, arguments); } finally { RAP.naArena = false; }
  return p;
};

const _apiRap = api;
api = async function api(a, dados={}){
  const d = S.sess?.dados;
  if(a==='dados' && RAP.naArena && !RAP.semLeve && !S.adm && d && d.pdv && !d.pdv.erro && Date.now()-RAP.completoEm < RAP.COMPLETO_MS){
    try{
      const r = await _apiRap('arena', dados);
      const pdv = d.pdv, desde = String(r.desde||'');
      const vendas = (pdv.vendas||[]).filter(v=>String(v.data) < desde).concat(r.vendas||[]);
      return {...d, hoje:r.hoje||d.hoje, hora:r.hora||d.hora, metas:r.metas||d.metas, pdv:{...pdv, vendas, kommo:r.kommo||[]}};
    }catch(e){
      if(/Ação desconhecida/i.test(e && e.message || '')) RAP.semLeve = true;   // servidor antigo: segue pelo pacote inteiro
      else throw e;
    }
  }
  const r = await _apiRap.apply(this, arguments);
  if((a==='dados' || a==='entrar') && r && r.ok!==false) RAP.completoEm = Date.now();
  return r;
};
