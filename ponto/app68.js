/* v68: bateu o ponto → continua logada.
   Antes: no computador da loja, depois de bater o ponto a tela de sucesso chamava sair() sozinha
   (7 s, ou 2 min quando aparecia o checklist) e o "Concluir" também deslogava a vendedora.
   Agora: entrada, saída/volta do almoço e pausas → ela vai para o Início do portal dela, logada
   (no computador da loja e no celular).
   • Saída do dia (fim do expediente) continua encerrando como antes — ela está indo embora.
   • Marcação feita sem internet no computador (sem os dados dela) continua saindo: não dá para abrir o portal.
   • "Sair do portal" e o "Sair" da tela de bater continuam deslogando na hora.
   Este é o embrulho mais externo de sair(): assim Kommo, entregas (GPS da motogirl), campanha etc.
   não são zerados à toa quando ela só está voltando para o portal. */
(function(){
  function fica68(){
    return S.tela==='sucesso' && !!(S.sess && S.sess.dados) && !!(S.ultimo && S.ultimo.campo && S.ultimo.campo!=='saida');
  }

  const _sairV68 = sair;
  sair = function sair(){
    try{
      if(fica68()){
        clearTimeout(timerVolta);
        S.tela = 'portal'; S.portalTab = 'inicio';
        render();
        return;
      }
    }catch(e){ try{ console.warn('v68: não consegui abrir o portal depois do ponto — saindo como antes', e); }catch(x){} }
    return _sairV68.apply(this, arguments);
  };

  /* na tela de sucesso o botão deixa claro para onde vai */
  const _telaSucessoV68 = telaSucesso;
  telaSucesso = function telaSucesso(){
    const h = _telaSucessoV68.apply(this, arguments);
    try{
      if(fica68()) return h.replace('onclick="sair()">Concluir</button>', 'onclick="sair()"><i class="ti ti-layout-dashboard"></i> Ir para o meu portal</button>');
    }catch(e){}
    return h;
  };
})();
