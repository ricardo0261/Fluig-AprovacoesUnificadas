$(function () {
   $("document").ready(function () {
      // ESCONDER TODOS OS BOTOES DO FORMULARIO
      if (getFormMode() == 'VIEW') {
         $('.btn').hide();
         $('.verBotoes').hide();
      } else {
         $('.btn').show();
         $('.verBotoes').show();
      }

      // EXIBIR COLUNAS DE ACORDO COM O TIPO DE APROVACAO
      if ($('#tipoAprovacao___1')[0] != undefined)
         verTipoAprovacao($('#tipoAprovacao___1')[0]);

      // Exemplo de uso: chame após inserir ou editar linhas
      ordenarTbAlcadas();
      criarFiltros();
      
      // Inicializar campos de usabilidade existentes
      setTimeout(function() {
         // debugUsabilidade(); // Debug para verificar elementos
         inicializarUsabilidade();
         
         // No modo VIEW, força inicialização de todas as linhas com valores
         if (getFormMode() === 'VIEW') {
            forcarInicializacaoViewMode();
         }
      }, 500);
   });
});

function criarFiltros() {
   var html = '' +
      '<div class="form-group col-md-3">' +
      '<input type="search" class="form-control filial" id="filtroFILIAL" placeholder="Filial..." />' +
      '</div>' +
      '<div class="form-group col-md-3">' +
      '<input type="search" class="form-control centroCusto" id="filtroCCUSTO" placeholder="Centro de Custo..." />' +
      '</div>' +
      '<div class="form-group col-md-3">' +
      '<input type="search" class="form-control classeValor" id="filtroCLASSEVALOR" placeholder="Classe de Valor..." />' +
      '</div>' +
      '<div class="form-group col-md-3">' +
      '<input type="search" class="form-control" id="filtroAPROVADOR" placeholder="Aprovador..." />'+
      '</div>' ;      

   // Insere os filtros no div correto após o carregamento do form
   $('#filtroDIV').html(html);
}

// FILTRO DINÂMICO PARA TABELA tbAlcadas
$(document).on('input', '#filtroFILIAL, #filtroCCUSTO, #filtroCLASSEVALOR, #filtroAPROVADOR', function () {
    var filtroFilial = $('#filtroFILIAL').val().toLowerCase();
    var filtroCCusto = $('#filtroCCUSTO').val().toLowerCase();
    var filtroClasse = $('#filtroCLASSEVALOR').val().toLowerCase();
    var filtroAprov  = $('#filtroAPROVADOR').val().toLowerCase();

    // Pega todas as linhas exceto a primeira (linha 0)
    $('#tbAlcadas tbody tr').each(function (idx) {
         if (idx === 0) {
            $(this).hide(); // Garante que a linha 0 fique sempre escondida
            return;
         }
         var $tr = $(this);
         // Busca o texto visível dos campos (zoom ou input)
         var txtFilial =$tr.find('[id^="zoomFilial___"]'     ).text().toLowerCase() || '';
         var txtCCusto =$tr.find('[id^="zoomCentroCusto___"]').text().toLowerCase() || '';
         var txtClasse =$tr.find('[id^="zoomClasseValor___"]').text().toLowerCase() || '';
         var txtAprov  =$tr.find('[id^="apv_Usuario___"]'    ).text().toLowerCase() || '';

         var show = true;
         if (filtroFilial && txtFilial.indexOf(filtroFilial) === -1) show = false;
         if (filtroCCusto && txtCCusto.indexOf(filtroCCusto) === -1) show = false;
         if (filtroClasse && txtClasse.indexOf(filtroClasse) === -1) show = false;
         if (filtroAprov  && txtAprov.indexOf(filtroAprov)   === -1) show = false;

         $tr.toggle(show);
    });
});

// FUNCAO PARA REVISAR CODIGOS DOS CADASTROS DE C.CUSTO, FILIAIS E USUARIOS
$(document).on('click', '#btnValidar', function () {
   var 
      MSG         = [],
      usuarios    = [], tUsuarios    = [],
      filiais     = [], tFiliais     = [],
      centroCusto = [], tCentroCusto = [],
      classValor  = [], tClassValor  = [];

   // LOOP DE LINHAS DA TABELA DE APROVADORES
   var linhas = $('table[tablename=tbAlcadas] tbody tr').not(':first');
   for (var i = 0; i < linhas.length; i++) {
      var id = linhas[i].id.split('___')[1];

      var classeValor = $('#zoomClasseValor___' + id).val()[0];
      if (classeValor != '' && classeValor != undefined && classeValor != null) 
         if (tClassValor.indexOf(classeValor) == -1) 
            tClassValor.push(classeValor);

      var centroCusto = $('#zoomCentroCusto___' + id).val()[0];
      if (centroCusto != '' && centroCusto != undefined && centroCusto != null) 
         if (tCentroCusto.indexOf(centroCusto) == -1) 
            tCentroCusto.push(centroCusto);

      var filial = $('#zoomFilial___' + id).val()[0];
      if (filial != '' && filial != undefined && filial != null) 
         if (tFiliais.indexOf(filial) == -1) 
            tFiliais.push(filial);

      var usuario = $('#apv_Usuario___' + id).val()[0];
      if (usuario != '' && usuario != undefined && usuario != null) 
         if (tUsuarios.indexOf(usuario) == -1) 
            tUsuarios.push(usuario);
   }

   //  BUSCAR CADASTRO DE USUARIOS colleague ATRAVES DO NOME DO USUARIO
   if (tUsuarios.length > 0) {
      var paramsU = [];
      for (var i = 0; i < tUsuarios.length; i++) 
         paramsU.push( DatasetFactory.createConstraint('colleagueName', tUsuarios[i], tUsuarios[i], ConstraintType.SHOULD) );

      var dsColleague = DatasetFactory.getDataset('colleague', null, paramsU, null);
      for (var i=0; i < dsColleague.values.length; i++) {
         var usuario = dsColleague.values[i]['colleagueName'];
         for (var j = 0; j < linhas.length; j++) {
            var id = linhas[j].id.split('___')[1];
            if ($('#apv_Usuario___' + id).val()[0] == usuario) 
               $('#apv_Usuario_Id___' + id).val(dsColleague.values[i]['colleaguePK.colleagueId']);
         }
      } 
   }

   // BUSCAR CADASTRO DE CLASSE DE VALOR ds_ClasseValor ATRAVES DO NOME DA CLASSE DE VALOR
   if (tClassValor.length > 0) {
      var paramsCV = [];
      for (var i = 0; i < tClassValor.length; i++)
         paramsCV.push( DatasetFactory.createConstraint('DESCRICAO', tClassValor[i], tClassValor[i], ConstraintType.SHOULD) );

      var dsClasseValor = DatasetFactory.getDataset('ds_ClasseValor', null, paramsCV, null);
      for (var i=0; i < dsClasseValor.values.length; i++) {
         var classeValor = dsClasseValor.values[i]['DESCRICAO'];
         for (var j = 0; j < linhas.length; j++) {
            var id = linhas[j].id.split('___')[1];
            if ($('#zoomClasseValor___'   + id).val()[0] == classeValor)
               $('#zoomClasseValor_Id___' + id).val(dsClasseValor.values[i]['CLASSE_VLR']);
         }
      }  
   }

   // BUSCAR CADASTRO DE CENTRO DE CUSTO ds_CentroCusto ATRAVES DO NOME DO CENTRO DE CUSTO
   if (tCentroCusto.length > 0) {
      var paramsCC = [];
      for (var i = 0; i < tCentroCusto.length; i++)
         if(tCentroCusto[i].indexOf('CALL') ==-1 )
            paramsCC.push( DatasetFactory.createConstraint('DESCRICAO', tCentroCusto[i], tCentroCusto[i], ConstraintType.SHOULD) );

      var dsCentroCusto = DatasetFactory.getDataset('ds_CentroCusto', null, paramsCC, null);
      for (var i=0; i < dsCentroCusto.values.length; i++) {
         var centroCusto = dsCentroCusto.values[i]['DESCRICAO'];
         for (var j = 0; j < linhas.length; j++) {
            var id = linhas[j].id.split('___')[1];
            if ($('#zoomCentroCusto___'  + id).val()[0] == centroCusto)
               $('#zoomCentroCusto_Id___'+ id).val(dsCentroCusto.values[i]['CODIGO']);
         }
      }  
   }

   // BUSCAR CADASTRO DE FILIAIS ds_Filial ATRAVES DO NOME DA FILIAL
   if (tFiliais.length > 0) {

	   // LIMPAR CAMPOS
	   for (var j =1; j <= tFiliais.length; j++)
		   $('#zoomFilial_Id___'+j).val('');

	   var paramsF = [];
	   for (var i = 0; i < tFiliais.length; i++)
		   paramsF.push( DatasetFactory.createConstraint('DESCRICAO', tFiliais[i], tFiliais[i], ConstraintType.SHOULD) );

	   var dsFilial = DatasetFactory.getDataset('ds_Filial', null, paramsF, null);
	   for (var i=0; i < dsFilial.values.length; i++) {
		   var filial = dsFilial.values[i]['DESCRICAO'];
		   var codigo = dsFilial.values[i]['CODIGO'];

		   for (var j = 0; j < linhas.length; j++) {
			   var id = linhas[j].id.split('___')[1];
			   if ($('#zoomFilial___'  +id).val()[0] == filial)
				   $('#zoomFilial_Id___'+id).val(codigo);
		   }
	   }
   }

   // VERIRICAR SE A TABELA DE APROVADORES FICOU SEM ALGUMA INFORMACAO DE ID NAO ATUALIZADO
   for (var i = 0; i < linhas.length; i++) {
      var id = linhas[i].id.split('___')[1];

      if($('#nivelAprovacao___' + id).val() == 'CC' && $('#zoomCentroCusto_Id___' + id).val() == '')
         MSG.push('Centro de Custo não localizado: '+$('#zoomCentroCusto___' + id).val() );

      if( ($('#nivelAprovacao___' + id).val() == 'FL' || $('#nivelAprovacao___' + id).val() == 'CM') && $('#zoomFilial_Id___' + id).val() == '')
         MSG.push('Filial não localizada: '+$('#zoomFilial___' + id).val() );

      if($('#nivelAprovacao___' + id).val() == 'CV' && $('#zoomClasseValor_Id___' + id).val() == '')
         MSG.push('Classe de Valor não localizada: '+$('#zoomClasseValor___' + id).val() );

      if($('#nivelAprovacao___' + id).val() == 'US' && $('#apv_Usuario_Id___' + id).val() == '')
         MSG.push('Usuário não localizado: '+$('#apv_Usuario___' + id).val() );
   }

   // FINALIZADO
   if (MSG != '')
      avisoMODAL('Atenção', MSG);
   else
      avisoMODAL('Informação',['Validação concluída com sucesso!']);
});

function avisoMODAL(avTITULO, avMSG) {
   if (avMSG == null || avMSG == '')
      avMSG = 'Favor confirmar os dados do seu formulário';

   var xContent = '';
   for (var iMSG = 0; iMSG < avMSG.length; iMSG++)
      xContent += '<p id="p' + iMSG + '"></p>';

   if (avTITULO == null || avTITULO == '')
      avTITULO = 'Atenção';

   FLUIGC.modal({
      title: avTITULO,
      content: xContent,
      id: 'fmWF_Aviso',
      size: 'large', // full | large | small
      actions: [{
         'label': 'Ok',
         'autoClose': true
      }]
   });

   for (var iMSG = 0; iMSG < avMSG.length; iMSG++)
      typeWriter(avMSG[iMSG], iMSG);
}

function typeWriter(text, iMSG) {
   var i = 0;
   var speed = 20; // Velocidade da digitação
   function typing() {
      if (i < text.length)
         try {
            document.getElementById('p' + iMSG).innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
         } catch (e) {
            // NENHUMA ACAO
            document.getElementById('p' + iMSG).innerHTML += text;
         }
   }
   typing();
}

// EXECUTAR INCLUSAO DE ITENS DA TABELA DE APROVADORES
$(document).on('click', '#btnInserirAprovador', function () {
   var index = wdkAddChild('tbAlcadas');
   $('#aprovadorNivel___'  + index).val(index);
   $('#lnAPV___'           + index).removeAttr('class');
   $('#zoomCentroCusto___' + index).prop('readonly', true).prop('disabled', true);
   $('#zoomFilial___'      + index).prop('readonly', true).prop('disabled', true);

   var inputs = $("[mask]");
   MaskEvent.initMask(inputs);
   
   // Inicializar usabilidade para a nova linha
   inicializarUsabilidadeNovaLinha(index);
});

// EXECUTAR INCLUSAO DE ITENS DA TABELA DE FAIXA DE VALORES
$(document).on('click', '#btnInserirValor', function () {
   var index = wdkAddChild('tbValores');
   $('#vlrNivel___' + index).val(index);

   var inputs = $("[mask]");
   MaskEvent.initMask(inputs);
});

// EXECUTAR INCLUSAO DE ITENS DA TABELA DE EXCESSAO
$(document).on('click', '#btnInserirExcessao', function () {
   var index = wdkAddChild('tbExcessoes');
   $('#excessaoNivel___' + index).val(index);

   var inputs = $("[mask]");
   MaskEvent.initMask(inputs);
});

function limparTabela(qTABELA) {
   $('table[tablename=' + qTABELA + '] tbody tr').not(':first').remove();
   return;
}

function verTipoAprovacao(qCAMPO) {
   try {
      var valorSelecionado = $("#" + qCAMPO.id + " option:selected").val()
      var id = qCAMPO.id.split('___')[1];
   } catch (error) {
      return false
   }
   if (valorSelecionado == undefined)
      valorSelecionado = $("#" + qCAMPO.id)[0].innerText;

   $('.centroCusto').hide();
   $('.filial'     ).hide();
   $('.classeValor').hide();
   $('.PA'         ).hide();
   $('#zoomCentroCusto___' + id).prop('readonly', true).prop('disabled', true);
   $('#zoomFilial___'      + id).prop('readonly', true).prop('disabled', true);
   $('#zoomClasseValor___' + id).prop('readonly', true).prop('disabled', true);

   switch (valorSelecionado) {
      case 'AR': // ADIANTAMENTO/REEMBOLSO OPEX
      case 'Adiantamento/Reembolso Opex':
         $('.centroCusto').show();
         $('.filial'     ).show();
         $('#zoomCentroCusto___' + id).prop('readonly', false).prop('disabled', false);
         $('#zoomFilial___'      + id).prop('readonly', false).prop('disabled', false);
         break;

      case 'CC': // CENTRO DE CUSTO
      case 'Centro de Custo':
         $('.centroCusto').show();
         $('#zoomCentroCusto___' + id).prop('readonly', false).prop('disabled', false);
         break;
   
      case 'CM': // CARREIRA MEDICA - LER FILIAL
      case 'Carreira Médica':
      case 'FL': // FILIAL
      case 'Filial':
         $('.filial').show();
         $('#zoomFilial___' + id).prop('readonly', false).prop('disabled', false);
         break;

      case 'CV': // CLASSE DE VALOR
      case 'Classe de Valor':
         $('.classeValor').show();
         $('#zoomClasseValor___' + id).prop('readonly', false).prop('disabled', false);
         break;

      case 'PA': // PAGAMENTO ANTECIPADO
      case 'Pagamento Antecipado':
         $('.PA').show();
         
         // Inicializa a usabilidade para esta linha quando PA for selecionado
         setTimeout(function() {
            if (id) {
               forcarCriacaoUsabilidade(id);
            } else {
               forcarCriacaoUsabilidade('');
            }
         }, 100);
         break;

      case 'PA_VRVA': // PAGAMENTO ANTECIPADO - VR/VA
      case 'Pagamento Antecipado - VR/VA':
         // tem solmente que solicitar aprovadores e todos devem estar no nivel 1 - valor zerado 
         break;

      default: // TODOS OS DEMAIS
         $('#zoomCentroCusto___' + id).prop('readonly', true).prop('disabled', true);
         $('#zoomFilial___'      + id).prop('readonly', true).prop('disabled', true);
         $('#zoomClasseValor___' + id).prop('readonly', true).prop('disabled', true);
         break;
   }
}

function MostrarOcultarDIV(valor) {
   var buscaDiv = document.getElementById(valor);
   if (buscaDiv.style.display == 'none')
      buscaDiv.style.display = 'block';
   else
      buscaDiv.style.display = 'none';
}

function pad(num) {
   var numRet = num;
   if (parseInt(num) <= 9)
      numRet = "0" + num;
   return numRet;
}

function setSelectedZoomItem(selectedItem) {
   try {
      var id = selectedItem.inputId.split('___');
   } catch (error) {
      avisoMODAL('Erro ao tentar selecionar item no zoom');
      return;
   }
   
   if (id[0] == 'ccExcessao') {
      $('#ccExcessao_Id___' + id[1]).val(selectedItem.CODIGO);
   
   } else if (id[0] == 'zoomCentroCusto') {
      $('#zoomCentroCusto_Id___' + id[1]).val(selectedItem.CODIGO);
      // Limpar filial quando centro de custo for selecionado
      $('#zoomFilial___' + id[1]).val('').trigger('change');
      $('#zoomFilial_Id___' + id[1]).val('');

   } else if (id[0] == 'zoomFilial') {
      $('#zoomFilial_Id___' + id[1]).val(selectedItem.CODIGO);
      // Limpar centro de custo quando filial for selecionada
      $('#zoomCentroCusto___' + id[1]).val('').trigger('change');
      $('#zoomCentroCusto_Id___' + id[1]).val('');

   } else if (id[0] == 'zoomClasseValor') {
      $('#zoomClasseValor_Id___' + id[1]).val(selectedItem.CLASSE_VLR);
   
   } else if (id[0] == 'apv_Usuario') {
      $('#apv_Usuario_Id___' + id[1]).val(selectedItem.colleagueId);
   }
}

function removedZoomItem(removedItem) {
   try {
      var id = removedItem.inputId.split('___');
   } catch (error) {
      avisoMODAL('Erro ao tentar remover item no zoom');
   }
   if (id[0] == 'zoomCentroCusto')
      $('#zoomCentroCusto_Id___' + id[1]).val('');

   else if (id[0] == 'zoomFilial')
      $('#zoomFilial_Id___' + id[1]).val('');

   else if (id[0] == 'apv_Usuario')
	      $('#apv_Usuario_Id___' + id[1]).val('');

}

function ordenarTbAlcadas() {
    var $tbody = $('#tbAlcadas tbody');
    var $rows = $tbody.find('tr').toArray();

    // Mantém a linha 0 separada
    var linhaZero = $rows.length > 0 ? $rows[0] : null;
    var linhasParaOrdenar = $rows.slice(1); // ignora a linha 0

    // Função para extrair os valores de cada linha para ordenação
    function getValores(row) {
        var $row = $(row);
        function getZoomText(selector) {
            var $el = $row.find(selector);
            if ($el.length && $el[0].tagName.toLowerCase() === 'input')
                return $el[0].value || '';
            else if($el[0].tagName.toLowerCase() === 'span') 
                return $el[0].innerHTML || '';
            else if ($el.length && $el[0].tagName.toLowerCase() === 'select') 
                return $el.find('option:selected').text() || '';
            
            return '';
        }
        return {
            filial: getZoomText('[id^="zoomFilial___"]'     ).toLowerCase(),
            ccusto: getZoomText('[id^="zoomCentroCusto___"]').toLowerCase(),
            classe: getZoomText('[id^="zoomClasseValor___"]').toLowerCase(),
            nivel : getZoomText('[id^="aprovadorNivel___"]' )
        };
    }

    linhasParaOrdenar.sort(function(a, b) {
         var va = getValores(a);
         var vb = getValores(b);
         if (va.filial < vb.filial) return -1;
         if (va.filial > vb.filial) return 1;
         if (va.ccusto < vb.ccusto) return -1;
         if (va.ccusto > vb.ccusto) return 1;
         if (va.classe < vb.classe) return -1;
         if (va.classe > vb.classe) return 1;
         if (va.nivel < vb.nivel) return -1;
         if (va.nivel > vb.nivel) return 1;
         // Se todos os outros critérios forem iguais, ordena por nível
         return va.nivel - vb.nivel;
    });

    // Remove as linhas antigas e adiciona as ordenadas, mantendo a linha 0 no topo e escondida
    $tbody.empty();
    if (linhaZero) {
        $tbody.append(linhaZero);
        $(linhaZero).hide();
    }
    linhasParaOrdenar.forEach(function(row) {
        $tbody.append(row);
    });
}

function esconderDIV(qVALOR){
   var buscaDiv = document.getElementById(qVALOR);
   if (buscaDiv.style.display == 'block')
      buscaDiv.style.display = 'none';
   else
      buscaDiv.style.display = 'block';
}

/**
 * Opções disponíveis para o campo usabilidade
 */
var OPCOES_USABILIDADE = [
   { value: '0', label: '0-Holding'             , tipo: 'multiplo' },
   { value: '1', label: '1-Clínica'             , tipo: 'multiplo' },
   { value: '2', label: '2-Hospital'            , tipo: 'multiplo' },
   { value: '3', label: '3-Farmácia'            , tipo: 'multiplo' },
   { value: '4', label: '4-Laboratório'         , tipo: 'multiplo' },
   { value: '5', label: '5-Veículo de Aquisição', tipo: 'multiplo' }
];

/**
 * Cria os checkboxes de usabilidade para uma linha específica
 * @param {string} lineId - ID da linha (vazio para primeira linha, número para outras)
 */
function criarCheckboxesUsabilidade(lineId) {
   try {
      var suffix = lineId ? '___' + lineId : '';
      var containerId = 'checkbox-list-usabilidade' + suffix;
      
      // Procura pelo container específico da linha
      var container = $('#' + containerId);
      
      // Se não encontrou o container específico, procura na célula da tabela
      if (container.length === 0) {
         var targetRow;
         if (lineId) {
            targetRow = $('#lnAPV___' + lineId);
         } else {
            targetRow = $('#lnAPV');
         }
         
         if (targetRow.length > 0) {
            // A célula de usabilidade tem classe 'PA'
            var usabilidadeCell = targetRow.find('td.PA');
            
            if (usabilidadeCell.length > 0) {
               var usabilidadeContainer = usabilidadeCell.find('.usabilidade-container');
               if (usabilidadeContainer.length > 0) {
                  container = usabilidadeContainer.find('.checkbox-list');
                  if (container.length > 0) {
                     container.attr('id', containerId);
                  }
               }
            }
         }
      }
      
      if (container.length === 0) {
         return;
      }
      
      // Limpa o container
      container.empty();
      
      // Cria os checkboxes seguindo o padrão Fluig
      var isViewMode = getFormMode() === 'VIEW';
      
      OPCOES_USABILIDADE.forEach(function(opcao) {
         var checkboxId = 'usabilidade_' + opcao.value.replace('.', '_') + suffix;
         var checkboxHtml = 
            '<div class="custom-checkbox custom-checkbox-success">' +
               '<input type="checkbox" ' +
                     'id="' + checkboxId + '" ' +
                     'value="' + opcao.value + '" ' +
                     'data-tipo="' + opcao.tipo + '" ' +
                     (isViewMode ? 'disabled ' : '') +
                     'onchange="atualizarCampoUsabilidade(this, \'' + suffix + '\')">' +
               '<label for="' + checkboxId + '">' + opcao.label + '</label>' +
            '</div>';
         
         container.append(checkboxHtml);
      });
      // Força estilo vertical após criar os elementos
      aplicarEstilosUsabilidade(suffix);
      
   } catch (error) {
      // Erro silencioso na criação de checkboxes
   }
}

/**
 * Função SIMPLIFICADA para atualizar o campo hidden
 * @param {string} suffix - Sufixo da linha
 */
function atualizarCampoUsabilidade(checkbox,suffix) {
   try {
      suffix = suffix || '';
      
      // Encontra o campo hidden
      var campoHidden = $('#usabilidade' + suffix);
      if (campoHidden.length === 0) {
         return;
      }
      
      // Encontra o container dos checkboxes
      var container = $('#checkbox-list-usabilidade' + suffix);
      
      // Se não encontrou o container pelo ID específico, procura na linha correspondente
      if (container.length === 0) {
         var targetRow = suffix ? $('#lnAPV' + suffix) : $('#lnAPV');
         if (targetRow.length > 0) {
            container = targetRow.find('.checkbox-list').first();
         }
      }
      
      if (container.length === 0) {
         return;
      }
      
      var valoresSelecionados = [];
      
      // Coleta TODOS os checkboxes marcados no container
      container.find('input[type="checkbox"]:checked').each(function() {
         valoresSelecionados.push($(this).val());
      });
      
      // Atualiza o campo hidden com valores separados por vírgula
      var valorFinal = valoresSelecionados.join(',');
      campoHidden.val(valorFinal);
      
   } catch (error) {
      // Erro silencioso
   }
}

/**
 * Função SIMPLIFICADA para carregar valores salvos nos checkboxes
 * @param {string} suffix - Sufixo da linha
 */
function carregarUsabilidade(suffix) {
   try {
      suffix = suffix || '';
      
      var campoHidden = $('#usabilidade' + suffix);
      var container = $('#checkbox-list-usabilidade' + suffix);
      
      // Se não encontrou o container pelo ID específico, procura na linha correspondente
      if (container.length === 0) {
         var targetRow = suffix ? $('#lnAPV' + suffix) : $('#lnAPV');
         if (targetRow.length > 0) {
            container = targetRow.find('.checkbox-list').first();
         }
      }
      
      if (campoHidden.length === 0) {
         return;
      }
      
      if (container.length === 0) {
         return;
      }
      
      var valor = campoHidden.val();
      
      // Desmarca todos os checkboxes primeiro
      container.find('input[type="checkbox"]').prop('checked', false);
      
      if (!valor) {
         return;
      }
      
      var valores = valor.split(',');
      
      valores.forEach(function(val) {
         val = val.trim();
         if (val) {
            var checkbox = container.find('input[value="' + val + '"]');
            if (checkbox.length > 0) {
               checkbox.prop('checked', true);
            }
         }
      });
      
   } catch (error) {
      // Erro silencioso
   }
}

/**
 * Força a criação dos checkboxes de usabilidade mesmo se o container não existir
 * @param {string} lineId - ID da linha
 */
function forcarCriacaoUsabilidade(lineId) {
   try {
      var suffix = lineId ? '___' + lineId : '';
      var targetRow = lineId ? $('#lnAPV___' + lineId) : $('#lnAPV');
      
      if (targetRow.length === 0) {
         return;
      }
      
      // Procura pela célula de usabilidade (célula com classe 'PA')
      var usabilidadeCell = targetRow.find('td.PA');
      
      if (usabilidadeCell.length === 0) {
         return;
      }
      
      // Se não existe o container, cria
      var container = usabilidadeCell.find('.checkbox-list');
      if (container.length === 0) {
         var html = 
            '<div class="usabilidade-container">' +
               '<div class="checkbox-list" id="checkbox-list-usabilidade' + suffix + '">' +
               '</div>' +
               '<input type="hidden" class="form-control" id="usabilidade' + suffix + '" name="usabilidade' + suffix + '">' +
            '</div>';
         
         usabilidadeCell.html(html);
         container = usabilidadeCell.find('.checkbox-list');
      } else {
         // Se o container já existe, garante que tem o ID correto
         container.attr('id', 'checkbox-list-usabilidade' + suffix);
      }
      
      // Cria os checkboxes seguindo o padrão Fluig
      var isViewMode = getFormMode() === 'VIEW';
      container.empty();
      
      OPCOES_USABILIDADE.forEach(function(opcao) {
         var checkboxId = 'usabilidade_' + opcao.value.replace('.', '_') + suffix;
         var checkboxHtml = 
            '<div class="custom-checkbox custom-checkbox-success">' +
               '<input type="checkbox" ' +
                     'id="' + checkboxId + '" ' +
                     'value="' + opcao.value + '" ' +
                     'data-tipo="' + opcao.tipo + '" ' +
                     (isViewMode ? 'disabled ' : '') +
                     'onchange="atualizarCampoUsabilidade(this, \'' + suffix + '\')">' +
               '<label for="' + checkboxId + '">' + opcao.label + '</label>' +
            '</div>';
         
         container.append(checkboxHtml);
      });
      
      // Aplica estilos verticais
      aplicarEstilosUsabilidade(suffix);
      
      // Carrega valores existentes
      carregarUsabilidade(suffix);
      
   } catch (error) {
      // Erro silencioso
   }
}

/**
 * Inicializa todos os campos de usabilidade existentes
 * No modo VIEW, inicializa TODAS as linhas independente do tipo
 * No modo EDIT, só inicializa se o tipo de aprovação for 'PA' (Pagamento Antecipado)
 */
function inicializarUsabilidade() {
   try {
      var isViewMode = getFormMode() === 'VIEW';
      
      // Primeiro, verifica e inicializa a linha principal (sem numeração)
      var linhaPrincipal = $('#lnAPV');
      if (linhaPrincipal.length > 0) {
         if (isViewMode) {
            // No modo VIEW, verifica se tem valor no campo hidden
            var valorUsabilidade = $('#usabilidade').val();
            if (valorUsabilidade && valorUsabilidade.trim() !== '') {
               forcarCriacaoUsabilidade('');
            }
         } else {
            // No modo EDIT, só inicializa se for PA
            var tipoAprovacao = linhaPrincipal.find('#tipoAprovacao').val();
            if (tipoAprovacao === 'PA') {
               forcarCriacaoUsabilidade('');
            }
         }
      }
      
      // Depois, verifica e inicializa todas as linhas numeradas existentes
      $('#tbAlcadas tbody tr[id^="lnAPV___"]').each(function() {
         var lineId = $(this).attr('id').split('___')[1];
         
         if (isViewMode) {
            // No modo VIEW, verifica se tem valor no campo hidden
            var valorUsabilidade = $('#usabilidade___' + lineId).val();
            if (valorUsabilidade && valorUsabilidade.trim() !== '') {
               forcarCriacaoUsabilidade(lineId);
            }
         } else {
            // No modo EDIT, só inicializa se for PA
            var tipoAprovacao = $(this).find('#tipoAprovacao___' + lineId).val();
            if (tipoAprovacao === 'PA') {
               forcarCriacaoUsabilidade(lineId);
            }
         }
      });
      
   } catch (error) {
      // Erro silencioso
   }
}

/**
 * Inicializa usabilidade para uma nova linha específica
 * Só inicializa se o tipo de aprovação for 'PA' (Pagamento Antecipado)
 * @param {string} lineId - ID numérico da linha
 */
function inicializarUsabilidadeNovaLinha(lineId) {
   try {
      setTimeout(function() {
         var targetRow = lineId ? $('#lnAPV___' + lineId) : $('#lnAPV');
         if (targetRow.length > 0) {
            var tipoSelect = targetRow.find('select[id^="tipoAprovacao"]');
            var tipoAprovacao = tipoSelect.val();
            
            if (tipoAprovacao === 'PA') {
               forcarCriacaoUsabilidade(lineId);
            }
         }
      }, 300);
   } catch (error) {
      // Erro silencioso
   }
}

/**
 * Força inicialização de todas as linhas com valores no modo VIEW
 * Esta função é necessária porque no modo VIEW todas as linhas já existem
 */
function forcarInicializacaoViewMode() {
   try {
      // Procura por TODOS os campos hidden de usabilidade que tenham valores
      $('input[id^="usabilidade"]').each(function() {
         var campoId = $(this).attr('id');
         var valor = $(this).val();
         
         if (valor && valor.trim() !== '') {
            // Extrai o sufixo do ID (se houver)
            var suffix = '';
            if (campoId !== 'usabilidade') {
               // Se não é o campo principal, extrai o sufixo
               var parts = campoId.split('usabilidade');
               if (parts.length > 1) {
                  suffix = parts[1];
               }
            }
            
            // Extrai apenas o número do sufixo para usar como lineId
            var lineId = '';
            if (suffix.startsWith('___')) {
               lineId = suffix.substring(3); // Remove os três underscores
            }
            
            forcarCriacaoUsabilidade(lineId);
         }
      });
      
   } catch (error) {
      // Erro silencioso
   }
}
function debugUsabilidade() {
   // Função de debug desabilitada
}

/**
 * Aplica estilos SIMPLES seguindo padrão Fluig
 * @param {string} suffix - Sufixo da linha
 */
function aplicarEstilosUsabilidade(suffix) {
   try {
      suffix = suffix || '';
      var containerId = '#checkbox-list-usabilidade' + suffix;
      var container = $(containerId);
      
      if (container.length === 0) {
         container = $('.checkbox-list').last();
      }
      
      // Aplica estilos seguindo padrão Fluig
      container.find('.custom-checkbox').each(function() {
         $(this).css({
            'display': 'block',
            'margin-bottom': '8px',
            'clear': 'both',
            'width': '100%'
         });
      });
      
   } catch (error) {
      // Erro silencioso
   }
}
