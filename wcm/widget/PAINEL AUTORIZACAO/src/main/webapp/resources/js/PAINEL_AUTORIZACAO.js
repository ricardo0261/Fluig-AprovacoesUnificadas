/*
 * ANALISTA RICARDO ANDRADE                                
 * 2505v23E 
 */
var USER,MATRICULA, subMAIL, userCode, cargoAprovador, qCargo, qMail, xData,
   PWSD, userNome, userMail, COMPANY, myInstance, myModalOBS, myLoading, qSO, gOBS = '',
   xMSGClick = 'Click sobre a linha da relação abaixo para aprovação individual',
   server, processoCI, userId, myURL, datasetFilhos, qBrowser, mydata,
   myTable, idAprovador, mailAprovador, nomeAprovador, ipINFO, ApprovalID,
   totWFS, totRET;

// CONTROLES PARA ENVIO DE LOTE DAS APROVACOES
var _LOG 				   = "sim"; 	// GRAVAR LOG SIM/NÃO
var _ASYNC_COUNT 		   = 0; 		   // NUMERO DE REQUISICOES ATIVAS
var _ASYNC_MAX_REQUESTS = 3; 		   // LIMITE MAXIMO DE REQUISICOES SIMULTANEAS
var _ASYNC_CALL_WAIT 	= 1000; 	   // INTERVALO DE ESPERA ENTRE REQUISICOES EM MILISEGUNDOS
var tipoAprovacao       = 1;		   // TIPO DE APROVACAO 1=164 OU 2=181
var _GIF_PROCESSANDO;
var dsParams;

var painelAUTORIZACAO = SuperWidget.extend({
   init: function() {
      // TIPO DE USUARIO
      myLoading = FLUIGC.loading(window, {
         textMessage: 'Processando...'
      });
      var tipUSU = tipoUSUARIO();
      if(!tipUSU && 1==0) {
         $('.super-widget').hide();
         FLUIGC.toast({
            message: 'Usuário sem permissão de acesso.',
            type: 'danger'
         });
         return false;
      } else {
         // FORCAR PERMANECER NO WS SE STATE=0
         $(document).ajaxError(function(e, jqXHR, settings, exception) {
            if(jqXHR.readyState == 0 || jqXHR.status == 0) {
               // HORA DO RETORNO
               xHora = new Date();
               xHora = pad(xHora.getHours()) + ':' + pad(xHora.getMinutes()) + ':' + pad(xHora.getSeconds());

               // DATASET LOG
               callbackFactory = new Object();
               callbackFactory.success = function(data) {};
               callbackFactory.error = function(xhr, txtStatus, error) {};
               var constLOG = new Array();
                  constLOG.push(DatasetFactory.createConstraint("jqXHR-timer", xHora, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("jqXHR-error", jqXHR, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("jqXHR-error", settings, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("jqXHR-error", exception, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("jqXHR-error", jqXHR.getAllResponseHeaders(), null, ConstraintType.MUST));
               DatasetFactory.getDataset("DS_AUTORIZAR_LOGS", null, constLOG, null, callbackFactory);
               return; // Skip this error
            }
         });

         qSO = isMobile();
         if(qSO !== 'mobile') {
            // VERIFICA QUAL O NAVEGADOR EM USO
            qBrowser = getBrowserName();
            if((qBrowser !== 'Chrome' && qSO == 'web') && qBrowser !== 'Safari' && qBrowser !== 'unknown')
               FLUIGC.toast({
                  message: 'Navegador não homologado:' + qBrowser,
                  type: 'warning'
               });
         } else {
            // AJUSTAR QUADRO DE APROVACAO
            $('.noMobile').hide();
            $('.simMobile').show();
         }
         // DATASET COM PARAMETROS LOG/LOTES APROVACOES
         var dsPARAM = DatasetFactory.getDataset("DS_WF-PARAM", null, null, null);
         _ASYNC_COUNT         = 0;
         _LOG                 =          dsPARAM.values[0]["ASYNC_LOG"];
         _ASYNC_MAX_REQUESTS  = parseInt(dsPARAM.values[0]["ASYNC_MAX_REQUESTS"]);
         _ASYNC_CALL_WAIT     = parseInt(dsPARAM.values[0]["ASYNC_CALL_WAIT"]   );
         _GIF_PROCESSANDO     =          dsPARAM.values[0]["GIF_PROCESSANDO"];
         tipoAprovacao		   = parseInt(dsPARAM.values[0]["TIPO_APROVACAO"]    );

         // DATASET COM USUARIO E SENHA DO USUARIO ADM
         var ds_usuarioIntegrador = DatasetFactory.getDataset("DS_USUARIO_INTEGRADOR");
         USER      = ''+ds_usuarioIntegrador.values[0]["user"]+'@oncoclinicas.com';
         PWSD      = ds_usuarioIntegrador.values[0]["password"];
         MATRICULA = ds_usuarioIntegrador.values[0]["matricula"];

         // DADOS DO USUARIO APROVADOR
         server         = WCMAPI.serverURL;
         COMPANY        = WCMAPI.getOrganizationId();
         userNome       = WCMAPI["user"];
         userMail       = WCMAPI["userEmail"];
         ApprovalID     = WCMAPI["userId"];
         userCode       = WCMAPI["userCode"];
         cargoAprovador = '';

         $('#userNOME')[0].innerHTML = userNome.toUpperCase();
         $('#imgCOLABORADOR')[0].src = server + '/social/api/rest/social/image/profile/' + userCode + '/SMALL_PICTURE';

         // CARREGAR TABELA COM PENDENCIAS
         myInstance = this.instanceId;

         // ALTA DIRECAO e VERIFICAR SE O COLABORADOR/FORNECEDOR OU CLIENTE
         // EH O PROPRIO SUPERIOR IMEDIATO
         idAprovador   = [];
         mailAprovador = [];
         nomeAprovador = [];

         // CARREGAR TAREFAS
         myLoading.show();
         setTimeout(function() {
            loadTable();
            ajustaCSSCards();
            temAnexos();
         }, 300);

      }
      window.onbeforeunload = function(e) {
         if (_ASYNC_COUNT > 0) {
            var confirmationMessage = 'Há Aprovações em andamento. Você tem certeza que deseja sair?';
            (e || window.event).returnValue = confirmationMessage; // Padrão para a maioria dos navegadores
            return confirmationMessage; // Para navegadores mais antigos
         }
      }
   }
});

function loadTable(){
   // INICIAR PROCEDIMENTO DE CARREGAR APROVACOES
   processoCI = [];
   subMAIL    = [];
   qCargo     = [];
   qMail      = [];
   userId;
   myURL;
   
   // CARREGAR DATASET PROCESSOS E ATVIDADES QUE POSSUEM APROVACAO PENDENTE CONF PARAMETROS
   dsParams = DatasetFactory.getDataset("ds_ParamsWF_Aprovacao",null,null,null);
   
   // PASSO 1 - INICIAR VARIAVEIS DE CONTROLE E DADOS
   var that = this;

   // VARIAVEIS DE CONTROLE
   totalAPVS   = 0;
   myWF        = [];
   mydata      = [];

   // PASSO 2 - CARREGAR TABELA DE APROVACAO COM AS PENDENCIAS DO APROVADOR
   // USUARIO APROVADOR E USUARIO SUBSTITUTO CONF DATASET DS_APROVADORES_UNIFICADOS
   var params = new Array();
       params.push(DatasetFactory.createConstraint("usuario", userCode, userCode, ConstraintType.MUST));
   var processoCI = DatasetFactory.getDataset("DS_APROVADORES_UNIFICADOS", null,params, null);    

   // NENHUM MOIMENTO ENCONTRATO PARA O USUARIO
   if(processoCI.values.length <=0){
       FLUIGC.toast({
           message: 'Nenhuma pendência encontrada para o usuário ou substituidos',
           type: 'warning'
        });
        myLoading.hide();
        return false;
   } else
   // SE RETORNO FOR ERROR PARAR CARGA
   if(processoCI.values[0]["ERROR"] != undefined)
      if(processoCI.values[0]["ERROR"] != '') {
         FLUIGC.toast({
            message: 'Erro ao tentar carregar aprovacoes: ' + processoCI.values[0]["ERROR"],
            type: 'danger'
         });
         myLoading.hide();
         return false;
      }

   // CARREGAR DADOS DA TABELA DE APROVACAO
   for (var i = 0; i < processoCI.values.length; i++) {
      // GRAVAR LINHA DE SOLICITACAO PENDENTE DE APROVACAO OU REPROVACAO
      totalAPVS += 1;

      var dtAberturaChamado = processoCI.values[i][ "dtAberturaChamado"];
	   var qData = dtAberturaChamado.substring(0,16);
      if(dtAberturaChamado.indexOf('-')>=0){
    	  var START_DATE = dtAberturaChamado.substring(0,10).split('-');
    	  	  START_DATE = START_DATE[2] + '/' + START_DATE[1] + '/' + START_DATE[0];
    	  
    	  var START_TIME = dtAberturaChamado.substring(11,19).split(':');
    	  	  START_TIME = START_TIME[0] + ':' + START_TIME[1];
    	  
    	  qData = START_DATE + ' ' + START_TIME;
      }
      
      var operacao = processoCI.values[i][ "operacao" ];
      if(operacao=='Solicita&ccedil;&atilde;o de Pagamentos')
      	  operacao = 'Solicitação de Pagamentos';
      
      var nivel = processoCI.values[i][ "apvSequencia" ];
      //  nivel ='' // DELISGADO TEMPORARIAMENTE
      
      var valorAPV = processoCI.values[i][ "valorSolicitado" ];
      try {
    	  valorAPV = valorAPV.replace(',0000',',00');
      } catch (e) {
    	  valorAPV = processoCI.values[i][ "valorSolicitado" ];
      }

      mydata.push({	
			Selecionado					  : null,
			Decisao						  : "Analisar",
			dataAbertura                  : qData,
			processDescription			  : operacao,
			processId					  : processoCI.values[i][ "COD_DEF_PROCES"	   	],
			processInstanceId			  : processoCI.values[i][ "NUM_PROCES"		   	],
			processInstanceOrigem    	  : processoCI.values[i][ "NUM_PROCES_ORIG"		], // "numChamadoOrigem"
			version					      : processoCI.values[i][ "version"			   	],
			requesterId					  : processoCI.values[i][ "COD_MATR_REQUISIT"	],
			requesterName				  : processoCI.values[i][ "FULL_NAME"	   	    ], // nomeSolicitante
			valorSolicitado				  : valorAPV,
			stateId						  : 5,
			colleagueName				  : processoCI.values[i][ "FULL_NAME"			],
			movementSequence			  : 7,
			mainAttachmentDocumentId	  : processoCI.values[i][ "documentid"		   	],
			mainAttachmentDocumentVersion : processoCI.values[i][ "version"			   	],
			idAprovador					  : processoCI.values[i][ "CD_MATRICULA"		],
			nivel                         : nivel,
			Obs							  : '',
			fornecedor                    : processoCI.values[i][ "nomeFornecedor"      ] || '',
			filial                        : processoCI.values[i][ "filial"			   	] || '',
			ccusto                        : processoCI.values[i][ "centroCusto"			] || '',
			cvalor                        : processoCI.values[i][ "classeValor"			] || '',
			tipo                          : processoCI.values[i][ "tipoSolicitacao"     ] || '',
			carta                         : processoCI.values[i][ "cartaExcecao"		] || 'Não',
        });
   }

  // TOTALIZADORES
  $('#numTOTAL_'+that.myInstance)[0].innerText = totalAPVS
  $('#apvTOTAL_'+that.myInstance)[0].innerText = '0';
  $('#repTOTAL_'+that.myInstance)[0].innerText = '0';

  // HEADER
  var xHeader = new Array();
  if(qSO == 'mobile') {
	  xHeader.push(   {'title': 'Sel'
                  }, {'title': 'Decisão'  ,'display': false
                  }, {'title': 'Abertura'
                  }, {'title': 'Processo'
                  }, {'title': 'Nº Fluig'
                  }, {'title': 'Nº Apv'    ,'display': false
                  }, {'title': 'Requerente','display': false
                  }, {'title': 'Valor'
                  }, {'title': 'Aprovador','display': false
                  }, {'title': 'Nível'    ,'display': false
                  }, {'title': 'Obs'      ,'display': false
                  }, {'title': 'Fornecedor'
                  }, {'title': 'Filial'
                  }, {'title': 'Centro Custo'
                  }, {'title': 'Classe Valor'
                  }, {'title': 'Tipo'         ,'display': false
                  }, {'title': 'Carta Exceção'
                  }, {'title': 'Anexo'
                  }, {'title': 'Docto'
	  });
  } else
  xHeader.push(   {'title': 'Sel'
               }, {'title': 'Decisão'      ,'display': false
               }, {'title': 'Abertura'
               }, {'title': 'Processo'
               }, {'title': 'Nº Fluig'
               }, {'title': 'Nº Apv'       
               }, {'title': 'Requerente'
               }, {'title': 'Valor'
               }, {'title': 'Aprovador'
               }, {'title': 'Nível'    
               }, {'title': 'Obs'          ,'display': false
               }, {'title': 'Fornecedor'
               }, {'title': 'Filial'
               }, {'title': 'Centro Custo'
               }, {'title': 'Classe Valor'
               }, {'title': 'Tipo'         ,'display': false
               }, {'title': 'Carta Exceção'
               }, {'title': 'Anexo'
               }, {'title': 'Docto'
               });
  //
  var qSearch = {
		  enabled: true,
		  onlyEnterkey: true,
		  searchAreaStyle: 'col-md-4 col-xs-12',
		  onSearch: function(res) {
			  myTable.reload(that.tableData);
			  var bResult;
			  if(res) {
				  var data = myTable.getData();
				  var searchTerm = res.toUpperCase(); // Converte o termo de busca para maiúsculas uma vez

                  var search = data.filter(function(el) {
                      // Itera sobre os valores de cada objeto 'el'
                      return Object.values(el).some(function(value) {
                          if (value === null || value === undefined) {
                              return false; // Ignora valores nulos ou indefinidos
                          }
                          // Converte o valor para string, depois para maiúsculas e verifica se inclui o termo de busca
                          return String(value).toUpperCase().includes(searchTerm);
                      });
                  });
				  myTable.reload(search);

				  if(search && search.length) {
					  myTable.reload(search);
					  bResult = true;
				  } else {
					  bResult = false;
				  }
			  }

			  if(!bResult && res) {
				  FLUIGC.toast({
					  title: 'Procurando por ' + res + ': ',
					  message: 'Não localizado',
					  type: 'warning'
				  });
			  } else {
				  temAnexos();
			  }
		  }
  };
  var qTemplate = '.template_area_buttons';
  if(qSO == 'mobile') {
	  qSearch = {
			  enabled: false
	  }
	  $('.template_area_buttons').hide();
	  qTemplate = '';
  }
  myTable = FLUIGC.datatable('#tabREQUERENTES_' + that.myInstance, {
	  dataRequest: that.mydata,
	  emptymessage: '<div class="text-center" style="color:red;"><b>Nenhuma pendência encontrada até o momento.</b></div>',
	  navButtons: {
		  enabled: false
	  },
	  draggable: {
		  enabled: false
	  },
	  classSelected: 'warning',
	  renderContent: '.tarefas_datatable',
	  header: xHeader,
	  tableStyle: 'table-hover',
	  search: qSearch,
	  actions: {
		  enabled: true,
		  template: qTemplate,
		  actionAreaStyle: 'col-md-8'
	  },
	  scroll: {
		  target: '#tabREQUERENTES_' + that.myInstance,
		  enabled: false
	  },
  }, function(err, data) {
	  if(err) {
		  FLUIGC.toast({
			  message: 'Erro ao tentar carregar o portal. \n ' + err,
			  type: 'danger'
		  });
	  } else {
		  if(qSO == 'mobile')
			  $('#msgClick').hide();
	  }
  });

  myTable.on('fluig.datatable.loadcomplete', function() {
	  if(!that.tableData) {
		  that.tableData = myTable.getData();
	  }
  });

  // ON CLICK SOLICITACAO
  $('#tabREQUERENTES_' + myInstance + ' tbody').on('click', 'tr', function() {
	  var xK = event.target.id;
	  var data = this.cells;
	  var myIndice = this.rowIndex - 1;

	  // SEGURANCA NENHUMA APROVACAO
	  if(data[0].children[0].innerHTML == 'Não há dados para serem exibidos.') {
		  FLUIGC.toast({
			  title: 'ATENÇÃO',
			  message: "Não há dados para serem exibidos. Você pode clicar no botão Atualizar para nova busca!",
			  type: 'info'
		  });
		  return false;
	  }

	  //
	  if(xK !== 'itSelecionado' && xK !== 'btnVerAnexos' & xK !== 'btnVerDoc') {
		  var Requerente  = data.Solicitante.textContent,
		  	  Decisao     = data.Decisao.textContent,
		  	  Workflow    = data.Workflow.textContent,
		  	  Solicitacao = data.Solicitacao.textContent

		  avaliarREQUERENTE(myIndice,Requerente,Decisao,Workflow,Solicitacao);
	  } else
		  if(xK == 'itSelecionado') {
			  // SOMAR ITEN SELECIONADO
			  var data = this.cells;
			  var myIndice = this.rowIndex - 1;
			  var qValor = data.Selecionado["children"]["itSelecionado"].checked;
			  var qSomar;
			  if(qValor) {
				  qSomar = +1;
			  } else {
				  qSomar = -1;
			  }
			  qSomar += parseInt($('.apvTOTAL')[0].innerText);
			  $('.apvTOTAL')[0].innerText = qSomar;
			  $('.repTOTAL')[0].innerText = qSomar;
		  } else
			  if(xK == 'btnVerAnexos') {
				  verAnexos(data.Solicitacao.textContent);
			  } else
				  if(xK == 'btnVerDoc') {
					  openDocument(data.Formulario.textContent, data.Versao.textContent, data.Solicitacao.textContent);
				  }
  });

  // ON CLICK GRAVAR OBSERVACAO REPROVACAO GLOBAL
  $(document).on("click", "[data-open-modal03]", function(ev) {
      if($('#globalOBS').val() == '' || $('#globalOBS').val() == undefined || $('#globalOBS').val() == null) {
          FLUIGC.toast({
              title: 'ATENÇÃO',
              message: "É preciso preencher a observação.",
              type: 'warning',
              timeout: 3000
          });
      } else {
          // REPROVAR
          var xAchei = false;
          myModalOBS.remove();
          var qLinhas = $('.regAprovacao td#Decisao').length;
          qOBS = $('#globalOBS').val();
          if(qLinhas > 0) {
              for (var i = 0; i < qLinhas; i++) {
                  if($('.regAprovacao td#Selecionado input#itSelecionado')[i].checked) {
                      $('.regAprovacao td#Decisao')[i].innerText = 'Reprovado';
                      $('.regAprovacao td#Obs')[i].innerText = gOBS; // Atenção: gOBS é global, talvez devesse ser qOBS aqui?
                      xAchei = true;
                  }
              }
              //
              if(xAchei) {
                  // PROCESSAR DECISAO
                  $('#nao_pbACOMPANHA').hide();
                  $('#pbACOMPANHA'    ).show();
                  setTimeout(function() {
                       confirmarENVIO(-1);
                  }, 300);
              } else {
                  $('#pbACOMPANHA'    ).hide(); // Se não achou nada, esconde a barra de progresso
                  $('#nao_pbACOMPANHA').show(); // e mostra o estado normal
                  FLUIGC.toast({
                      title: 'ATENÇÃO',
                      message: "Nenhuma solicitação selecionada para ação de reprovação",
                      type: 'warning',
                      timeout: 3000
                  });
              }
          } else {
              $('#pbACOMPANHA'    ).hide(); // Se não tem linhas, esconde a barra de progresso
              $('#nao_pbACOMPANHA').show(); // e mostra o estado normal
              FLUIGC.toast({
                  title: 'ATENÇÃO',
                  message: "Nenhuma solicitação encontrada",
                  type: 'warning',
                  timeout: 300
              });
          }
      }
   });
   // FINALIZADO
   $('#pbACOMPANHA'    ).hide();
   $('#nao_pbACOMPANHA').show();
   myLoading.hide();
}

function avaliarREQUERENTE(gbLinha,gbRequerente,gbDecisao,gbWorkflow,gbSolicitacao) {
   // APROVACOES NAS ATIVIDADES
   // FORUMULARIO PARA VISUALIZACAO
   var qLinha = gbLinha;
   
   var elDOCTO     = $('.regAprovacao td#Formulario' )[qLinha].innerText,
       elVERSAO    = $('.regAprovacao td#Versao'     )[qLinha].innerText,
       ATIVIDADE   = $('.regAprovacao td#stateId'    )[qLinha].innerText,
       SOLICITACAO = $('.regAprovacao td#Solicitacao')[qLinha].innerText,
       qTXT        = 'Aprovar Solicitação';
   
   // MONTAR CONSULTA
   var divConsulta =
      '<input type="hidden" id="qLinha" value="' + qLinha + '" />' +
      '<h5 style="text-align: center;">'+gbWorkflow+'</h5>'+
   	  '<h5 style="text-align: center;">('+SOLICITACAO+')</h5>';
   //
   var modo = WCMAPI.isMobileAppMode();
   if(modo == false) {
      divConsulta +=
         '<div class="pointer" style="text-align:center;text-decoration:underline;" onclick="openDocument(' + elDOCTO + ',' + elVERSAO + ',' + SOLICITACAO + ')">Visualizar Documento' +
         '</div>' +
         '<div class="pointer" style="text-align:center;text-decoration:underline;" onclick="verAnexos(' + SOLICITACAO + ')">Visualizar Anexos' +
         '</div>';
   }
   //

   divConsulta +=
      '<div id="mdDecisao">' +
      '   <p style="text-align: center">Decisão:&nbsp;</p>' +
      '   <input type="hidden" id="txtDecisao" name="txtDecisao" />' +
      '   <div class="row">' +
      '   	<div class="col-md-12 col-xs-12" style="text-align:center">' +
      '         <button type="button" class="btn btn-success" btn-avalia-Aprovado  id="btn1" style="font-size:x-small;">Aprovado</button> ' +
      '         <button type="button" class="btn btn-danger"  btn-avalia-Reprovado id="btn2" style="font-size:x-small;">Reprovado</button> ' +
   // '         <button type="button" class="btn btn-info"    btn-avalia-Revisar   id="btn3" style="font-size:x-small;">Recusado</button> '+ // ATIVAR SOMENTE SE O PROCEDIMENTO DE REVISAO FOR IMPLEMENTADO NO CLIENTE
      '   	</div>' +
      '   </div>' +
      '   <div class="row">' +
      '   	<div class="col-md-12 col-xs-12">' +
      '          <label>Obs</label>' +
      '   		<input type="text" class="form-control" id="txtObs" name="txtObs" style="text-align: center" />' +
      '   	</div>' +
      '   </div>' +
      '   <!-- PROGRESSO DECISAO -->' +
      '   <br />' +
      '   <div class="row">' +
      '     <div id="mdACOMPANHA" class="progress col-lg-12 col-md-10 col-xs-12" style="display:none;" >' +
      '       <div class="progress-bar-gif" role="progressbar" style="width:100%;"></div>' +
      '     </div>' +
      '   </div>' +
      '</div>';
   //
   var myModal1 = FLUIGC.modal({
      title: qTXT,
      content: divConsulta,
      id: 'fluig-modal01',
      size: 'small', // 'full | large | small'
      actions: [{
         'label': 'Confirmar',
         'bind': 'data-open-modal01'
      }, {
         'label': 'Fechar',
         'autoClose': true
      }]
   }, function(err, data) {
      if(err) {
         // FALHA AO TENTAR CARREGAR AVALIACAO
         FLUIGC.toast({
            title: 'ATENÇÃO',
            message: "Falha ao tentar carregar a tela de aprovação. MSG: " + err,
            type: 'danger'
         });
      }
   });

   // FUNCOES AUXILIARES
   // OBS PADRAO
   var retLinha = $('#qLinha').val();
   if($('.regAprovacao td#Obs')[retLinha].innerText !== '' && $('.regAprovacao td#Obs')[retLinha].innerText != undefined && $('.regAprovacao td#Obs')[retLinha].innerText != null)
      $('#txtObs').val($('.regAprovacao td#Obs')[retLinha].innerText);

   // GRAVAR ITEM
   $(document).on("click", "[data-open-modal01]", function(ev) {
      // RECUPERAR LINHA ATUAL DE EDICAO
      var retLinha = $('#qLinha').val();

      if($('#txtDecisao').val() !== '' && $('#txtDecisao').val() !== undefined) {
         // GRAVAR RESULTADO DA AVALIACAO
         $('.regAprovacao td#Decisao')[retLinha].innerText = $('#txtDecisao').val();
         if($('#txtObs').val() !== '' && $('#txtObs').val() !== undefined)
            $('.regAprovacao td#Obs')[retLinha].innerText = $('#txtObs').val();

         // VERIFICAR E SEGUIR
         if($('#txtDecisao').val() !== 'Aprovado' &&
            ($('#txtObs').val() == '' || $('#txtObs').val() == undefined || $('#txtObs').val() == null)) {
            FLUIGC.toast({
               message: 'é necessário preencher o campo Obs.',
               type: 'danger'
            });
         } else {
            // PROCESSAR DECISAO
            $('#pbACOMPANHA'    ).show();
            $('#nao_pbACOMPANHA').hide();
            setTimeout(function() {
               confirmarENVIO(retLinha);
            }, 300);
            myModal1.remove();
         }
      }
   })
   
   // APROVADO
   $(document).on("click", "[btn-avalia-Aprovado]", function(ev) {
      $('#txtDecisao').val('Aprovado');
      $('#btn1').attr('style', 'opacity: 1;font-size:x-small;');
      $('#btn2').attr('style', 'opacity:.5;font-size:x-small;');
      $('#btn3').attr('style', 'opacity:.5;font-size:x-small;');
   })
   // REPROVADO
   $(document).on("click", "[btn-avalia-Reprovado]", function(ev) {
      $('#txtDecisao').val('Reprovado');
      $('#btn1').attr('style', 'opacity:.5;font-size:x-small;');
      $('#btn2').attr('style', 'opacity: 1;font-size:x-small;');
      $('#btn3').attr('style', 'opacity:.5;font-size:x-small;');
      // PEDIR OBS
      $('#txtObs').focus();
   })
   // REVISAR
   $(document).on("click", "[btn-avalia-Revisar]", function(ev) {
      $('#txtDecisao').val('Revisar');
      $('#btn1').attr('style', 'opacity:.5;font-size:x-small;');
      $('#btn2').attr('style', 'opacity:.5;font-size:x-small;');
      $('#btn3').attr('style', 'opacity: 1;font-size:x-small;');
      // PEDIR OBS
      $('#txtObs').focus();
   })
   // FINAL FNC
}

function SelecionaTodos() {
   var qLinhas = $('.regAprovacao td#Decisao').length;
   if(qLinhas > 0) {
      var qSomar = 0;
      for (var i = 0; i < qLinhas; i++) {
         $('.regAprovacao td#Selecionado input#itSelecionado')[i].checked = true;
         qSomar += 1;
      }
      $('.apvTOTAL')[0].innerText = qSomar;
      $('.repTOTAL')[0].innerText = qSomar;
      // REFAZER VALOR TOTAL/SELECIONADOS
      FLUIGC.toast({
         title: 'ATENÇÃO',
         message: 'Todos os itens foram selecionados.',
         type: 'info'
      });
   }
}

function DesmarcarTodos() {
   var qLinhas = $('.regAprovacao td#Decisao').length;
   if(qLinhas > 0) {
      var qSomar = 0;
      for (var i = 0; i < qLinhas; i++) {
         $('.regAprovacao td#Selecionado input#itSelecionado')[i].checked = false;
      }
      $('.apvTOTAL')[0].innerText = qSomar;
      $('.repTOTAL')[0].innerText = qSomar;
      // REFAZER VALOR TOTAL/SELECIONADOS
      FLUIGC.toast({
         title: 'ATENÇÃO',
         message: 'Todos os itens foram desmarcados.',
         type: 'info'
      });
   }
}

function AprovaTodos(sender, e) {
   // e.preventDefault();
   var xAchei = false;
   var qLinhas = $('.regAprovacao td#Decisao').length;
   for (var i = 0; i < qLinhas; i++) {
      if($('.regAprovacao td#Selecionado input#itSelecionado')[i].checked) {
         $('.regAprovacao td#Decisao')[i].innerText = 'Aprovado';
         xAchei = true;
      }
   }
   //
   if(xAchei) {
      // PROCESSAR DECISAO
      $('#pbACOMPANHA'    ).show(); // Se não achou nada, esconde a barra de progresso
      $('#nao_pbACOMPANHA').hide(); // e mostra o estado normal
      setTimeout(function() {
         confirmarENVIO(-1);
      }, 300);
   } else {
      $('#pbACOMPANHA'    ).hide(); // Se não achou nada, esconde a barra de progresso
      $('#nao_pbACOMPANHA').show(); // e mostra o estado normal
      FLUIGC.toast({
         title: 'ATENÇÃO',
         message: "Nenhuma solicitação selecionada para ação de aprovação",
         type: 'warning',
         timeout: 3000
      });
   }
}

function ReprovaTodos(sender, e) {
   // e.preventDefault();
   // SOLICITAR MOTIVO REPROVACAO GLOBAL
   // BUSCA OBSERVACAO REPROVACAO TODOS
   var divDigValor =
      '<div class="row">' +
      '	<div class="col-md-12 col-xs-12">' +
      '       <label>Observação Reprovação Selecionados</label>' +
      '		<input type="text" class="form-control" id="globalOBS" name="globalOBS" />' +
      '	</div>' +
      '</div>';
   //
   myModalOBS = FLUIGC.modal({
      title: 'Observação',
      content: divDigValor,
      id: 'fluig-modal01Valor',
      size: 'small', // 'full | large | small'
      actions: [{
         'label': 'Confirmar',
         'bind': 'data-open-modal03'
      }, {
         'label': 'Voltar',
         'autoClose': true
      }]
   }, function(err, data) {
      if(err) {
         // FALHA AO TENTAR CARREGAR MODAL
         FLUIGC.toast({
            title: 'ATENÇÃO',
            message: "Falha ao tentar carregar a tela observação. MSG: " + err,
            type: 'warning',
            timeout: 3000
         });
      }
   });
}

function openDocument(id, version, docSolicitacao) {
   if(id == undefined || id == null) {
      var index = myTarefas.selectedRows()[0];
      var selected = myTarefas.getRow(index);
      id = selected.Formulario;
      docSolicitacao = selected.Solicitacao;
      
   }
   var paramDOC = new Array();
	   paramDOC.push(DatasetFactory.createConstraint("activeVersion",true,true,ConstraintType.MUST));
	   paramDOC.push(DatasetFactory.createConstraint("documentPK.documentId"   ,id  ,id  ,ConstraintType.MUST));
   var dsDOC = DatasetFactory.getDataset("document", null, paramDOC, null);
   version = dsDOC.values[0]['documentPK.version']; 

   var xContent = '<iframe id="imgVIEWER" src="/webdesk/streamcontrol/0/' + id + '/' + version + '/" width="100%" height="700px" frameborder="0" style="background:url(' + _GIF_PROCESSANDO + ') center center no-repeat;"></iframe>';
   var myModalDocto = FLUIGC.modal({
	  title: "Visualizar: " + docSolicitacao,
      content: xContent,
      id: 'fluig-document',
      size: 'full',
      actions: [{
         'label': 'Voltar',
         'autoClose': true
      }]
   }, function(err, data) {
      if(err) {
         console.log(err)
      } else {
    	  $('.modal-title').hide();
      }
   });
}

function pad(num) {
   var numRet = num;
   if(parseInt(num) <= 9) {
      numRet = "0" + num;
   }
   return numRet;
}

function verAnexos(qSOLICITACAO) {
   // LISTAR ANEXOS E VISUALIZAR
   if(qSOLICITACAO == undefined || qSOLICITACAO == null) {
      var index = myTarefas.selectedRows()[0];
      var selected = myTarefas.getRow(index);
      qSOLICITACAO = selected.Solicitacao;
   }
   var qARQUIVOS = [];
   var processAnexos =
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/">' +
      '<soapenv:Header/>' +
      '<soapenv:Body>' +
      ' <ws:getAttachments>' +
      '  <companyId>' + COMPANY + '</companyId>' +
      '  <username>' + USER + '</username>' +
      '  <password>' + PWSD + '</password>' +
      '  <userId>' + userCode + '</userId>' +
      '  <processInstanceId>' + qSOLICITACAO + '</processInstanceId>' +
      ' </ws:getAttachments>' +
      '</soapenv:Body>' +
      '</soapenv:Envelope>';

   // ENVIANDO REQUISICAO PARA LOCALIZAR ANEXCOS DA SOLICITACAO
   var wsUrl2 = server + "/webdesk/ECMWorkflowEngineService?wsdl";
   var parserprocessoCI = new DOMParser();
   var xmlRequestprocessoCI = parserprocessoCI.parseFromString(processAnexos, "text/xml");
   WCMAPI.Create({
      url: wsUrl2,
      async: false,
      contentType: "text/xml; charset=UTF-8",
      dataType: "xml",
      data: xmlRequestprocessoCI,
      error: function(data) {
         FLUIGC.toast({
            message: 'Não foi possível verificar os anexos da solicitação nº ' + qSOLICITACAO + '. \n' + JSON.stringify(data),
            type: 'danger'
         })
      },
      success: function(data) {
         var rows = data["children"][0]["children"][0]["children"][0]["children"][0]["children"].length;
         for (var row = 1; row < rows; row++) {
            var xArquivo    = data["children"][0]["children"][0]["children"][0]["children"][0]["children"][row]["children"][8].innerHTML;
            var xFormulario = data["children"][0]["children"][0]["children"][0]["children"][0]["children"][row]["children"][7].innerHTML;
            var xVersao     = data["children"][0]["children"][0]["children"][0]["children"][0]["children"][row]["children"][14].innerHTML;
            //
            var xURL = '';
            var xARQ = server + "/api/public/2.0/documents/getDownloadURL/" + xFormulario;
            WCMAPI.Create({
               async: false,
               dataType: 'json',
               url: xARQ,
               type: 'GET',
               contenttype: 'application/json',
               success: function(data) {
                  xURL = data.content;
                  qARQUIVOS.push({
                     Arquivos: xArquivo,
                     Formulario: xFormulario,
                     Versao: xVersao,
                     meuLink: xURL
                  });
               },
               error: function(request, status, error) {
                  FLUIGC.toast({
                     message: 'Não foi possível localizar o anexo ' + xFormulario + ' \n' + error,
                     type: 'danger'
                  });
               }
            });
         }
         // FIM DOS ANEXOS
      }
   });

   // INSERIR RELACAO DE ANEXOS
   var divConsulta = '<div class="row" id="verANEXOS">';
   qSO = isMobile();
   if(qSO !== 'mobile')
      divConsulta += '<div class="alert alert-success" role="alert" style="text-align:center;font-size:small;"><b>Clique sobre o nome do arquivo para visualizar</b></div> ';
   divConsulta += '<div class="col-md-12 col-xs-12" id="tabANEXOS"></div></div>';
   //
   var myModalAnexos = FLUIGC.modal({
      title: 'ARQUIVOS ANEXOS',
      content: divConsulta,
      id: 'fluig-modalAnexos',
      size: 'large', // 'full | large | small'
      actions: [{
         'label': 'Fechar',
         'autoClose': true
      }]
   }, function(err, data) {
      if(err) {
         // FALHA AO TENTAR CARREGAR ANEXOS
         FLUIGC.toast({
            title: 'ATENÇÃO',
            message: "Falha ao tentar carregar relação de anexos. MSG: " + err,
            type: 'danger'
         });
      } else {
         // CARREGAR DATATABLE COM RELACAO DE ANEXOS
         myTableAnexos = FLUIGC.datatable('#tabANEXOS', {
            dataRequest: qARQUIVOS,
            emptymessage: '<div class="text-center" style="color:red;"><b>Nenhum anexo localizado.</b></div>',
            search: {
               enabled: false
            },
            navButtons: {
               enabled: false
            },
            draggable: {
               enabled: false
            },
            classSelected: 'danger',
            renderContent: '.arquivos_Anexos',
            header: [{
               'title': 'Nome Arquivo'
            }, {
               'title': ''
            }, {
               'title': ''
            }, {
               'title': 'Formulario',
               'display': false
            }, {
               'title': 'Versao',
               'display': false
            }],
            scroll: {
               target: '#tabANEXOS',
               enabled: true
            },
         }, function(err, data) {
            if(err) {
               FLUIGC.toast({
                  message: 'Erro ao tentar carregar relação de anexos. ' + err,
                  type: 'danger'
               });
            }
         });
      }
   });

   // ON CLICK VER ANEXO
   $('#tabANEXOS tbody').on('click', 'tr', function() {
      var xK = event.target.id;
      // **if(xK=='Arquivos' || xK=='Visualizar' || xK=='myVer') {
      if(xK == 'myVer' || (qSO !== 'mobile') && xK == 'Arquivos') {
         var data = this.cells;
         var myForm = this.cells.Formulario.innerText;
         var myVers = this.cells.Versao.innerText;
         var myFile = this.cells.Baixar.children.myLink.href;
         var myName = this.cells.Arquivos.innerText;
         // 
         openAttachmentView(myForm, myVers, myName);
      }
   });
}

function openAttachmentView(docId, docVersion, fileName) {
   // SE FORM IMAGEM OU GIF ABRE O ANEXO NO PROCESSO PADRÃO
   qSO = isMobile();
   if(qSO !== 'mobile') {
      // /stream/documentview
      var myURL = server + "/ecm_documentview/documentView.ftl";
      ECM.documentView = {};
      var cfg = {
         url: myURL,
         width: 750,
         height: 500,
         maximized: true,
         showbtclose: false,
         title: "Processando...",
         callBack: function() {
            ECM.documentView.getDocument(docId, docVersion);
         },
         customButtons: []
      };
      ECM.documentView.panel = WCMC.panel(cfg);
      $('#ecm-documentview-toolbar').hide();
      ECM.documentView.panel.bind("panel-close", function() {
         ECM.documentView.hideIFrame();
         if(ECM.documentView.toUndefined == undefined || ECM.documentView.toUndefined) {
            ECM.documentView = undefined;
         }
      });
   } else {

      // O primeiro passo é checarmos se estamos no mobile
      // RETORNO TOTVS CHAMADO 7279630 EM 18.05.2020
      // if(WCMAPI.isMobileAppMode()) {
      // var config = {
      // documentId: docId, // Código do documento que será aberto
      // title: fileName // Título que será usado na janela (Opcional)
      // };
      //	 
      // // Por fim abrimos o documento.
      // var configString = JSON.stringify(config);
      // JSInterface.openDocument(configString);
      // }

      var xARQ = server + "/api/public/2.0/documents/getDownloadURL/" + docId;
      WCMAPI.Create({
         async: false,
         dataType: 'json',
         url: xARQ,
         type: 'GET',
         contenttype: 'application/json',
         success: function(data) {
            var divConsulta = '';
            if(/\.(jpe?g|png|gif)$/i.test(fileName))
               divConsulta =
               '<div id="windowAnexo" class="col-lg-12 col-md-12 col-xs-12 col-sm-12">' +
               '<img src="' + data.content + '" alt="Houve um problema na exibição desta imagem." style="width:100%;"></img>' +
               '</div>';
            else
               divConsulta =
               '<iframe id="windowAnexo" class="col-lg-12 col-md-12 col-xs-12 col-sm-12" src="https://docs.google.com/viewerng/viewer?url=' + data.content + '&embedded=true" frameborder="0" style="padding:0;margin:0;background-color:gray;" width="100%" height="100%" allowfullscreen></iframe>';
            //
            myModalShowAnexos = FLUIGC.modal({
               title: fileName,
               content: divConsulta,
               id: 'fluig-showAnexos',
               size: 'full' // 'full | large | small'
            }, function(err, data) {
               if(err) {
                  // FALHA AO TENTAR CARREGAR VISUALIZACAO DO ANEXO
                  FLUIGC.toast({
                     title: 'ATENÇÃO',
                     message: "Falha ao tentar carregar o anexo. MSG: " + err,
                     type: 'warning',
                     timeout: 3000
                  });
               }
            });
            $('#fluig-showAnexos')[0].style.width = window.innerWidth - 5 + 'px';
            $('#fluig-showAnexos')[0].style.height = window.innerHeight - 5 + 'px';
            $("#fluig-showAnexos .modal-content")[0].style.height = window.innerHeight - 50 + 'px';
            $("#fluig-showAnexos .modal-content .modal-body")[0].style.height = window.innerHeight - 5 + 'px';
            $("#fluig-showAnexos .modal-content .modal-body")[0].style.maxHeight = window.innerHeight - 100 + 'px';
         },
         error: function(request, status, error) {
            FLUIGC.toast({
               message: 'Não foi possível localizar o anexo ' + xFormulario + ' \n' + error,
               type: 'danger'
            });
         }
      });
   }
}

function DTAgora() {
   var dtAgora = new Date();
   dtAgora.setDate(dtAgora.getDate());
   //
   var fData = pad(dtAgora.getDate()) + "/" +
      pad(parseInt(dtAgora.getMonth() + 1)) + "/" +
      dtAgora.getFullYear();
   //
   var hrAgora = new Date();
   hrAgora = pad(hrAgora.getHours()) + ':' + pad(hrAgora.getMinutes());
   //
   fData = fData + ' as ' + hrAgora;

   // VERIFICA SO
   fData = fData + ' / ' + qSO;

   return fData;
}

// CONTROLE
var 
   qItem,totWFS,totRET,xData,decisao,obs,xActualThreadprocessDescription,processId,
   processInstanceId,version,requesterId,requesterName,stateId,stateDescription,
   deadlineDate,deadlineText,colleagueName,movementSequence,mainAttachmentDocumentId,
   mainAttachmentDocumentVersion; 

function confirmarENVIO(qENVIO) {
   // CONTROLE DE LINHA OU LINHAS SELECIONADAS
   qENVIO             = parseInt(qENVIO);
   totWFS             = 0;
   totRET             = 0;
   xData              = DTAgora();
   obs                = [];
   decisao            = [];
   xActualThread      = [];
   processDescription = []; 		     
   processId          = []; 				        
   processInstanceId  = []; 		        
   stateId            = []; 					        
   proximaTarefa      = [];
   tarefaFinal        = [];
   xResult            = [];
   mainAttachmentDocumentId=[];
   requesterId        = []; 				        

   // SOMENTE QUANDO UM PROCESSO LIBERADO
   var qLinhas = $('.regAprovacao td#Decisao').length;
   if(qLinhas == 0) {
      // NENHUM ITEM SELECIONADO
      FLUIGC.toast({
         message: 'Nenhum item pendente de aprovação até o momento. Favor atualizar o teu painel.',
         type: 'warning',
         timeout: 3000
      });
      $('#pbACOMPANHA').hide(); // Esconder se não há itens
      $('#nao_pbACOMPANHA').show();
   } else {
      var qLinha = 0;
      if(qENVIO >= 0) {
         qLinha  = qENVIO;
         qLinhas = qENVIO + 1;
      }
      if(qLinha < 0) // Deve ser qENVIO < 0 para processamento em lote
         qLinha = 0;

      // ACOMPANHAMENTO
      // $('#pbACOMPANHA').show(); // Já deve estar visível por quem chamou

      // PEGAR DO ULTIMO ATE O PRIMERO PQ A MEDIDA QUE VAI LIBERANDO AS LINHAS DO DATATABLE EH ELIMINADA
      // DESTA FORMA NAO VAI PERDER OS DADOS DA LINHA SELECIONADA
      // SOMENTE ITENS AVALIADOS
      var itensProcessados = 0; // Contador para verificar se algum item foi realmente processado
      for (var itens1 = qLinha; itens1 < $('.regAprovacao td#Decisao').length; itens1++) { // Ajustado para o tamanho atual da tabela
         // Se qENVIO >= 0, processa apenas um item. Se qENVIO < 0, processa os selecionados/alterados.
         if (qENVIO >= 0 && itens1 > qLinha) break; 

         decisao[itens1] = $('.regAprovacao td#Decisao')[itens1].innerText;
         
         // Para processamento em lote (qENVIO < 0), verificar se está selecionado
         var isSelecionadoParaLote = (qENVIO < 0 && $('.regAprovacao td#Selecionado input#itSelecionado')[itens1].checked);

         if(decisao[itens1] !== 'Analisar' && (qENVIO >=0 || isSelecionadoParaLote) ) {
            itensProcessados++;
            // LOCALIZAR LINHA PARA GRAVAR DECISAO
            var xOBS = $('.regAprovacao td#Obs')[itens1].innerText;
            if(xOBS == '' || xOBS == null || xOBS == undefined)
               xOBS = gOBS; // gOBS é usado para reprovação em lote, qOBS para individual
            obs[itens1] = xOBS;

            processDescription[itens1]      	=  $('.regAprovacao td#Workflow'      )[itens1].innerText; 
            processId[itens1] 			     	=  $('.regAprovacao td#cdProcesso'    )[itens1].innerText; 
            processInstanceId[itens1] 	     	=  $('.regAprovacao td#Solicitacao'   )[itens1].innerText; 
            stateId[itens1] 					   =  $('.regAprovacao td#stateId'       )[itens1].innerText; 
            mainAttachmentDocumentId[itens1]	=  $('.regAprovacao td#Formulario'    )[itens1].innerText; 
            requesterId[itens1] 				   =  $('.regAprovacao td#idSolicitante' )[itens1].innerText; 
            idAprovador[itens1] 				   =  $('.regAprovacao td#idAprovador'   )[itens1].innerText; 
        
            // CONTROLE DE APROVACAO/REPROVACAO
            switch (decisao[itens1]) {
                case "Aprovado": 
                  for (var iParams = 0; iParams < dsParams.values.length; iParams++) { // Adicionado iParams < dsParams.values.length
                     if(processId[itens1]==dsParams.values[iParams].CodDEF_Proces && stateId[itens1]==dsParams.values[iParams].code_activities){ // Adicionado &&
                            proximaTarefa[itens1] = dsParams.values[iParams].sequence_approved;
                            tarefaFinal[itens1]   = dsParams.values[iParams].final_approved;
                            xResult[itens1]       = dsParams.values[iParams].value_approved;
                            break;
                         }
                  }
                   break;

                case "Reprovado":
                   for (var iParams = 0; iParams < dsParams.values.length; iParams++) { // Adicionado iParams < dsParams.values.length
                     if(processId[itens1]==dsParams.values[iParams].CodDEF_Proces && stateId[itens1]==dsParams.values[iParams].code_activities){ // Adicionado &&
                            proximaTarefa[itens1] = dsParams.values[iParams].sequence_reproved;
                            tarefaFinal[itens1]   = dsParams.values[iParams].final_reproved;
                            xResult[itens1]       = dsParams.values[iParams].value_reproved;
                            break;
                         }
                  }
                	break;
    
                case "Recusado": // "Revisar" no modal, "Recusado" aqui. Verificar consistência.
                  for (var iParams = 0; iParams < dsParams.values.length; iParams++) { // Adicionado iParams < dsParams.values.length
                     if(processId[itens1]==dsParams.values[iParams].CodDEF_Proces && stateId[itens1]==dsParams.values[iParams].code_activities){ // Adicionado &&
                            proximaTarefa[itens1] = dsParams.values[iParams].sequence_refused;
                            tarefaFinal[itens1]   = dsParams.values[iParams].final_refused;
                            xResult[itens1]       = dsParams.values[iParams].value_refused;
                            break;
                         }
                  }
                	break;
            }

            // CONTROLE WF
            totWFS += 1;
            if(tipoAprovacao==164 || tipoAprovacao==1)
                movimentar164(itens1); // movimentar164 não está definido no código fornecido
            else
                movimentar181(itens1);
         }
      }
      
      if(itensProcessados === 0 && qENVIO < 0){ // Se for lote e nada foi processado (nada selecionado)
          $('#pbACOMPANHA').hide();
          $('#nao_pbACOMPANHA').show();
          FLUIGC.toast({
             title: 'ATENÇÃO',
             message: "Nenhuma solicitação selecionada para esta ação.",
             type: 'warning',
             timeout: 3000
          });
      }


      // ELIMINAR SOMENTE ITENS AVALIADOS SOMENTE QUANDO UM PROCESSO LIBERADO
      // Esta lógica de remoção pode ser melhorada para acontecer após a confirmação do sucesso da movimentação em wfRetorno
      // Por ora, manterei como está, mas é um ponto de atenção.
      $('#apvTOTAL_' + myInstance)[0].innerText = '0';
      $('#repTOTAL_' + myInstance)[0].innerText = '0';

      var qLinhasLoop = $('.regAprovacao td#Decisao').length - 1;
      for (var itens2 = qLinhasLoop; itens2 >= 0; itens2--) {
         var iDecisao = $('.regAprovacao td#Decisao')[itens2].innerText;
         if(iDecisao !== 'Analisar') {
            // ATUALIZAR PAINEL
            totalAPVS -= 1;
            $('#numTOTAL_' + myInstance)[0].innerText = totalAPVS;
            // myTable.removeRow(itens2); // Usar API do datatable se possível, ou:
            $($('.regAprovacao')[itens2]).remove();
         }
      };

      // Acompanhamento
      if (totWFS === 0 && itensProcessados > 0) { // Se itens foram marcados para processar mas nenhum iniciou WF (ex: erro antes de _async_remote_Call)
            $('#pbACOMPANHA').hide();
            $('#nao_pbACOMPANHA').show();
      } else if (totWFS === 0 && itensProcessados === 0 && qENVIO >=0) { // Se era individual e não processou
            $('#pbACOMPANHA').hide();
            $('#nao_pbACOMPANHA').show();
      }
   }
}

function wfRetorno() {
   totRET += 1;
   if(totRET >= totWFS) {
      // FINALIZADO
      $('#pbACOMPANHA').hide();
      $('#nao_pbACOMPANHA').show(); // Mostrar o estado normal dos botões
      FLUIGC.toast({
         message: 'Processo de Aprovações finalizado!',
         type: 'success',
         timeout: 10000
      });
   }
}

String.prototype.replaceAll = function(de, para) {
   var str = this;
   var pos = str.indexOf(de);
   while (pos > -1) {
      str = str.replace(de, para);
      pos = str.indexOf(de);
   }
   return (str);
}

function ajustaCSSCards() {
   var xTamCards = 0;
   var qCards = document.getElementsByClassName('panel').length;
   if(qCards > 1) {
      for (var index1 = 0; index1 < qCards; index1++) {
         if(xTamCards == 0) {
            xTamCards = document.getElementsByClassName('panel')[index1].offsetHeight;
         } else {
            if(xTamCards < document.getElementsByClassName('panel')[index1].offsetHeight) {
               xTamCards = document.getElementsByClassName('panel')[index1].offsetHeight;
            }
         }
      }
      if(xTamCards > 0)
         for (var index1 = 0; index1 < qCards; index1++) {
            document.getElementsByClassName('panel')[index1].style.height = xTamCards + 'px';
         }
   }
}

function tipoUSUARIO() {
   // CONFIGURAR ACESSO MENUS DE ACORDO COM OS GRUPOS DE USUARIOS
   // (grp__Aprovadores)
   var adm = false,
      myUSER = WCMAPI.userCode,
      myServer = WCMAPI.serverURL,
      myURL = myServer + '/api/public/2.0/groups/containsUser/grp_Aprovadores/' + myUSER;
   FLUIGC.ajax({
      url: myURL,
      type: 'GET',
      dataType: 'json',
      contenttype: 'application/json',
      async: false,
      success: function(result) {
         adm = result["content"];
      },
      error: function(request, status, error) {
         FLUIGC.toast({
            message: 'Não foi possivel localizar a permissão de acesso do usuário logado. \n' + error,
            type: 'danger'
         })
      }
   });
   return adm;
}

function atualizaCIs() {
   if (_ASYNC_COUNT > 0) {
      // Pergunta ao usuário se ele quer continuar mesmo com operações pendentes
      if (!confirm('Há Aprovações em andamento. Você tem certeza que deseja atualizar?')) {
         return; // Usuário clicou em "Cancelar", então a função não prossegue.
      }
      // Se o usuário clicou em "OK", a execução continua abaixo.
   }

   // CARREGAR TAREFAS
   myLoading.show();
   setTimeout(function() {
      loadTable();
      temAnexos();
   }, 300);
}

function _async_remote_Call(options) {
   // EXECUCAO EM LOTE FORCAR A EXECUCAO CONFORME PARAMETROS EM DS_-PARAM
   if(_ASYNC_COUNT >= _ASYNC_MAX_REQUESTS) {
      // GERAR LOG
      console.log('@ ' + _ASYNC_COUNT + ' de ' + options.process);
      setTimeout(function() {
         _async_remote_Call(options)
      }, _ASYNC_CALL_WAIT);
   } else {
      // GERAR LOG
      console.log('# ' + _ASYNC_COUNT + ' de ' + options.process);

      // HORA DO INICIO
      xHora = new Date();
      xHora = pad(xHora.getHours()) + ':' + pad(xHora.getMinutes()) + ':' + pad(xHora.getSeconds());
      xParams = '' + _ASYNC_MAX_REQUESTS + ':' + _ASYNC_COUNT + ':' + _LOG;
      tSOAP = options.txtSOAP.replaceAll(' <', '<').replace(USER, '************').replace(PWSD, '************');

      // DATASET LOG
      var constLOG = new Array();

      // ** constLOG.push( DatasetFactory.createConstraint("meuIP",ipINFO["responseJSON"]["ip"],null,ConstraintType.MUST) );
      constLOG.push(DatasetFactory.createConstraint("timer"				 , xHora, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("param"				 , xParams, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("process/num"		 , options.process, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/url"		 , options.url, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/async"		 , options.async, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/setTimeout" , options.setTimeout, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/timeout"	 , options.timeout, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/contentType", options.contentType, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/dataType"	 , options.dataType, null, ConstraintType.MUST));
      constLOG.push(DatasetFactory.createConstraint("options/data"		 , tSOAP, null, ConstraintType.MUST));
      //
      WCMAPI.Create({
         url: options.url,
         async: options.async,
         setTimeout: options.setTimeout,
         timeout: options.timeout,
         contentType: options.contentType,
         dataType: options.dataType,
         data: options.data,
         success: function(response, status, jqXHR) {
            if(options.success) 
               options.success(response);
         },
         error: function(jqXHR, status, errorThrown) {
            if(options.error) {
               options.error(jqXHR, status, errorThrown, options);
               // GERAR LOG
               if(_LOG == "sim") {
                  // HORA DO RETORNO
                  xHora = new Date();
                  xHora = pad(xHora.getHours()) + ':' + pad(xHora.getMinutes()) + ':' + pad(xHora.getSeconds());

                  // DATASET LOG
                  callbackFactory = new Object();
                  callbackFactory.success = function(data) {};
                  callbackFactory.error = function(xhr, txtStatus, error) {};
                  constLOG.push(DatasetFactory.createConstraint("timer " + options.process, xHora, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("error " + options.process, jqXHR, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("error " + options.process, status, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("error " + options.process, errorThrown, null, ConstraintType.MUST));
                  constLOG.push(DatasetFactory.createConstraint("error " + options.process, jqXHR.getAllResponseHeaders(), null, ConstraintType.MUST));
                  DatasetFactory.getDataset("DS_AUTORIZAR_LOGS", null, constLOG, null, callbackFactory);
               }
            }
         },
         complete: function(jqXHR, status) {
            _ASYNC_COUNT--;
            if(options.complete) {
               options.complete();
            }
            // GERAR LOG
            if(_LOG == "sim") {
               // HORA DO RETORNO
               xHora = new Date();
               xHora = pad(xHora.getHours()) + ':' + pad(xHora.getMinutes()) + ':' + pad(xHora.getSeconds());
               // DATASET LOG
               callbackFactory = new Object();
               callbackFactory.success = function(data) {};
               callbackFactory.error = function(xhr, txtStatus, error) {};
               constLOG.push(DatasetFactory.createConstraint("timer    " + options.process, xHora, null, ConstraintType.MUST));
               constLOG.push(DatasetFactory.createConstraint("status   " + options.process, status, null, ConstraintType.MUST));
               constLOG.push(DatasetFactory.createConstraint("complete " + options.process, "Ok", null, ConstraintType.MUST));
               constLOG.push(DatasetFactory.createConstraint("complete " + options.process, jqXHR.getAllResponseHeaders(), null, ConstraintType.MUST));
               DatasetFactory.getDataset("DS_AUTORIZAR_LOGS", null, constLOG, null, callbackFactory);
            }
         }
      });
      // PROXIMO
      _ASYNC_COUNT++;
   }
}

// Função auxiliar (garanta que ela exista no escopo)
function escapeXML(str) {
    if (str === null || typeof str === 'undefined') {
        return ''; // Retorna string vazia para nulos ou indefinidos
    }
    if (typeof str !== 'string') {
        str = String(str); // Converte para string se não for
    }
    return str.replace(/[<>&'"]/g, function (char) {
        switch (char) {
            case '<' : return '&lt;';
            case '>' : return '&gt;';
            case '&' : return '&amp;';
            case '\'': return '&apos;';
            case '"' : return '&quot;';
            default  : return char;
        }
    });
}

function movimentar181(qITEM) {
    // MOVIMENTAR A SOLICITACAO USANDO O METODO DATASET
    // PASSAR TODOS OS PARAMETROS PARA O METODO
    var processo = processInstanceId[qITEM]; // Valor da solicitação específica para esta execução da função
    var wsUrl1   = server + "/webdesk/ECMCardService?wsdl";
    var wsUrl2   = server + "/webdesk/ECMWorkflowEngineService?wsdl";

    // LOG ADICIONADO PARA VERIFICAR OS VALORES NO INÍCIO DA FUNÇÃO
    console.log("[movimentar181] Iniciando para qITEM:", qITEM);
    console.log("[movimentar181] Usando processInstanceId[" + qITEM + "]:", processo);
    if (processo === undefined || processo === null || processo.trim() === "") {
        console.error("[movimentar181] ERRO: 'processo' está indefinido ou vazio para qITEM:", qITEM);
        FLUIGC.toast({ title: 'Erro Crítico:', message: 'ID do Processo não encontrado para movimentação. Item: ' + qITEM, type: 'danger' });
        return false; // Interrompe a execução se o ID do processo for inválido
    }

    // VERIFICA SE O APROVADOR EH O SUBSTITUTO
    var substituto = 'não';
    if(idAprovador[qITEM] != userCode)
        substituto = 'sim';

    // TRANSFORMAR A DATA E HORA EM UM NUMERO INTEIRO
    var iData   = new Date();
    var nIndice = pad(iData.getHours()) + '' + pad(iData.getMinutes()) + '' + pad(iData.getSeconds());
        nIndice = parseFloat(nIndice);

    // RECUPERAR INDICE DA LINHA DO APROVADOR CONF SEQUENCIA DE APROVACAO
    var constAPV = new Array();
    constAPV.push(DatasetFactory.createConstraint("documentId", mainAttachmentDocumentId[qITEM], null, ConstraintType.MUST));
    var dsAPV = DatasetFactory.getDataset("DS_ALCADAS_QUEMAPROVA", null, constAPV, null);
    var statusIndice = -1;
    if(dsAPV.values != undefined && dsAPV.values.length > 0)
        statusIndice = dsAPV.values[0].apvSequencia;
   
    // PASSO 1 - LER DADOS DO FORMULARIO DE APROVACAO
    var cardDataRequestXML = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/"> '+
                   '<soapenv:Header/> '+
                   '<soapenv:Body> '+
                   '   <ws:getInstanceCardData>' +
                   '     <companyId>' + escapeXML(COMPANY) + '</companyId>' +
                   '     <username>' + escapeXML(USER) + '</username>' +
                   '     <password>' + escapeXML(PWSD) + '</password>' +
                   '     <userId>' + escapeXML(userCode) + '</userId>' +
                   '     <processInstanceId>'+ escapeXML(processo) +'</processInstanceId> '+
                   '   </ws:getInstanceCardData> '+
                   '</soapenv:Body> '+
                   '</soapenv:Envelope> ';
 	
	var parserCardData = new DOMParser();
	var xmlRequestcardData = parserCardData.parseFromString(cardDataRequestXML, "text/xml");
	
	_async_remote_Call({
		process: 'getInstanceCardData:' + processo,
		txtSOAP: cardDataRequestXML, // Usar a variável com o XML da requisição
		url: wsUrl2,
		async: true,
		setTimeout: 84000,
		timeout: 84000,
		contentType: "text/xml; charset=UTF-8",
		dataType: "xml",
		data: xmlRequestcardData,
		error: function(jqXHR, status, errorThrown) {
			console.error("[movimentar181] Passo 1 - ERRO em getInstanceCardData para processo " + processo + ":", status, errorThrown, jqXHR);
			FLUIGC.toast({
				message: 'getInstanceCardData error para processo ' + processo + '. Status: ' + status + '. Erro: ' + errorThrown,
				type: 'danger'
			});
		},
		success: function(responseXMLGetInstanceCardData) { // Renomeado para clareza
			console.log("[movimentar181] Passo 1 - SUCESSO em getInstanceCardData para processo " + processo + ". Resposta:", responseXMLGetInstanceCardData);
			var faultString = $(responseXMLGetInstanceCardData).find("faultstring").text();
         if (faultString) {
               console.error("[movimentar181] Passo 1 - Erro SOAP em getInstanceCardData para processo " + processo + ":", faultString);
               FLUIGC.toast({
                  message: 'Erro (SOAP) ao recuperar dados do formulário da solicitação nº ' + processo + '. MSG: ' + faultString,
                  type: 'danger'
               });
               return;
         }

         // Tornar esta variável local para este escopo de callback
         var localCardDataElements = responseXMLGetInstanceCardData.getElementsByTagName("CardData");
            
         if(localCardDataElements.length <= 0) {
               console.warn("[movimentar181] Passo 1 - CardData não encontrado na resposta de getInstanceCardData para processo " + processo);
               FLUIGC.toast({
                  message: 'Não foi possível encontrar CardData para a solicitação nº ' + processo,
                  type: 'warning'
               });
               return false;
         }

         // Verificar se o numChamadoOrigem no envelope recebido é igual ao valor da variavel processo
         // Usar localCardDataElements
         var numChamadoOrigemElement = localCardDataElements[0].getElementsByTagName("numChamadoOrigem")[0]; 
         if(numChamadoOrigemElement && numChamadoOrigemElement.textContent.trim() !== processo) {
               console.error("[movimentar181] Passo 1 - numChamadoOrigem não corresponde ao processo esperado. Esperado: " + processo + ", Recebido: " + numChamadoOrigemElement.textContent.trim());
               FLUIGC.toast({
                     message: 'Erro crítico: numChamadoOrigem não corresponde ao processo esperado. Esperado: ' + processo + ', Recebido: ' + numChamadoOrigemElement.textContent.trim(),
                     type: 'danger'
               });
               return false;
         }
            
         // Nota: A modificação de 'apvStatus___' diretamente no responseXMLGetInstanceCardData (linhas 1274-1283 do código original)
         // não afetaria o 'localCardDataElements' se feita após sua extração,
         // e não seria refletida na construção de 'cardDataContent' abaixo da forma como está.
         // Se 'apvStatus___' precisa ser enviado, deve ser adicionado explicitamente ao 'cardDataContent'.

         console.log("[movimentar181] ### Processando getInstanceCardData para processo " + processo + " - localCardDataElements:", localCardDataElements);

         // PASSO 2 - RECUPERAR THREAD DA SOLICITACAO A SER MOVIMENTADO
         var threadProcess =
               '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/"> ' +
               '   <soapenv:Header/> ' +
               '   <soapenv:Body> ' +
               '      <ws:getActualThread> ' +
               '         <companyId>' + escapeXML(COMPANY) + '</companyId>' +
               '         <username>' + escapeXML(USER) + '</username>' +
               '         <password>' + escapeXML(PWSD) + '</password>' +
               '         <processInstanceId>' + escapeXML(processo) + '</processInstanceId> ' + 
               '         <stateSequence>' + parseInt(stateId[qITEM]) + '</stateSequence> ' + // stateId[qITEM] já é numérico ou convertido para
               '      </ws:getActualThread> ' +
               '   </soapenv:Body> ' +
               '</soapenv:Envelope> ';
            
         console.log("[movimentar181] Passo 2 - getActualThread - XML SOAP para processo " + processo + ":", threadProcess);

         var parserprocessoCI = new DOMParser();
         var xmlRequestprocessoCI = parserprocessoCI.parseFromString(threadProcess, "text/xml");
         // xActualThread[qITEM] = 0; // xActualThread é um array, será definido no success

         _async_remote_Call({
               process: 'getActualThread:' + processo, 
               txtSOAP: threadProcess,
               url: wsUrl2,
               async: true,
               setTimeout: 84000,
               timeout: 84000,
               contentType: "text/xml; charset=UTF-8",
               dataType: "xml",
               data: xmlRequestprocessoCI,
               error: function(jqXHR, status, errorThrown) {
                  console.error("[movimentar181] Passo 2 - ERRO em getActualThread para processo " + processo + ":", status, errorThrown, jqXHR);
                  FLUIGC.toast({
                     message: 'getActualThread error para processo ' + processo + '. Status: ' + status + '. Erro: ' + errorThrown,
                     type: 'danger'
                  });
               },
               success: function(responseXMLGetActualThread) { // Renomeado para clareza
                  console.log("[movimentar181] Passo 2 - SUCESSO em getActualThread para processo " + processo + ". Resposta:", responseXMLGetActualThread);
                  var faultStringStep2 = $(responseXMLGetActualThread).find("faultstring").text();
                  if (faultStringStep2) {
                     console.error("[movimentar181] Passo 2 - Erro SOAP em getActualThread para processo " + processo + ":", faultStringStep2);
                     FLUIGC.toast({
                           message: 'Erro (SOAP) ao recuperar Thread da solicitação nº ' + processo + '. MSG: ' + faultStringStep2,
                           type: 'danger'
                     });
                     return;
                  }
                  
                  // Variável local para a thread
                  var currentActualThread =  parseInt( $(responseXMLGetActualThread).find("ActualThread")[0].innerHTML ); // $(responseXMLGetActualThread).find("result"); 
                  if (isNaN(currentActualThread)) {
                     console.error("[movimentar181] Passo 2 - Não foi possível extrair o valor da thread da resposta para o processo " + processo);
                     FLUIGC.toast({ message: 'Não foi possível obter a thread da solicitação nº ' + processo, type: 'danger' });
                     return;
                  }

                  // PASSO 3 - MOVIMENTAR SOLICITACAO
                  var qMovProcesso;
                  var movprocessoXML;

                  if(idAprovador[qITEM] !== userCode) {
                     // SUBSTITUTO
                     qMovProcesso = 'saveAndSendTaskByReplacement';
                     movprocessoXML =
                           '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/">' +
                           '   <soapenv:Header/>' +
                           '   <soapenv:Body>' +
                           '      <ws:saveAndSendTaskByReplacement>' +
                           '         <companyId>' + escapeXML(COMPANY) + '</companyId>' +
                           '         <username>' + escapeXML(USER) + '</username>' +
                           '         <password>' + escapeXML(PWSD) + '</password>' +
                           '         <userId>' + escapeXML(idAprovador[qITEM]) + '</userId>' +
                           '         <replacementId>' + escapeXML(userCode) + '</replacementId>' +
                           '         <processInstanceId>' + escapeXML(processo) + '</processInstanceId>' + 
                           '         <choosedState>' + escapeXML(proximaTarefa[qITEM]) + '</choosedState>' +
                           '         <colleagueIds>' + escapeXML(requesterId[qITEM]) + '</colleagueIds>' +
                           '         <comments>Decisão via Painel de Aprovação como ' + escapeXML(decisao[qITEM]) + '/substituto: ' + escapeXML(userNome) + '</comments>' +
                           '         <completeTask>true</completeTask>' +
                           '         <threadSequence>' + currentActualThread + '</threadSequence>' + // currentActualThread já é numérico
                           '         <attachments></attachments>' +
                           '         <cardData></cardData>' + // Será preenchido abaixo
                           '         <appointment></appointment>' +
                           '         <managerMode>false</managerMode>' +
                           '      </ws:saveAndSendTaskByReplacement>' +
                           '   </soapenv:Body>' +
                           '</soapenv:Envelope>';
                  } else {
                                             // APROVADOR
                     qMovProcesso = 'saveAndSendTask';
                     movprocessoXML =
                           '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/">' +
                           '   <soapenv:Header/>' +
                           '   <soapenv:Body>' +
                           '      <ws:saveAndSendTask>' +
                           '         <companyId>' + escapeXML(COMPANY) + '</companyId>' +
                           '         <username>' + escapeXML(USER) + '</username>' +
                           '         <password>' + escapeXML(PWSD) + '</password>' +
                           '         <userId>' + escapeXML(userCode) + '</userId>' +
                           '         <processInstanceId>' + escapeXML(processo) + '</processInstanceId>' + 
                           '         <choosedState>' + escapeXML(proximaTarefa[qITEM]) + '</choosedState>' +
                           '         <colleagueIds></colleagueIds>' +
                           '         <comments>Decisão via Painel de Aprovação como ' + escapeXML(decisao[qITEM]) + '</comments>' +
                           '         <completeTask>true</completeTask>' +
                           '         <threadSequence>' + currentActualThread + '</threadSequence>' + // currentActualThread já é numérico
                           '         <managerMode>false</managerMode>' +
                           '         <attachments></attachments>' +
                           '         <cardData></cardData>' + // Será preenchido abaixo
                           '         <appointment></appointment>' +
                           '      </ws:saveAndSendTask>' +
                           '   </soapenv:Body>' +
                           '</soapenv:Envelope>';
                  }

                  var cardDataContent = '';
                  // Usar localCardDataElements (capturado pelo closure)
                  if (localCardDataElements && localCardDataElements.length > 0 && localCardDataElements[0]) {
                     for (var i = 0; i < localCardDataElements[0].childElementCount; i++) {
                           var fieldElement = localCardDataElements[0].children[i].children[0];
                           var valueElement = localCardDataElements[0].children[i].children[1];

                           if (fieldElement && valueElement) {
                              var field = fieldElement.textContent.trim();
                              var value = valueElement.textContent.trim();
                              if (value !== '') // Adicionar apenas se o valor não estiver vazio
                                 cardDataContent +=
                                 '<item>' +
                                 '   <item>' + escapeXML(field) + '</item>' + 
                                 '   <item>' + escapeXML(value) + '</item>' + 
                                 '</item>';
                           }
                     }
                  }
                  
                  // Adicionar os campos de aprovação
                  cardDataContent += '<item><item>seAprovado</item><item>'+ escapeXML(xResult[qITEM]) +'</item></item>';
                  cardDataContent += '<item><item>apvQuando___'+nIndice+'</item><item>'+ escapeXML(xData) +'</item></item>';
                  cardDataContent += '<item><item>apvNome___'+nIndice+'</item><item>'+ escapeXML(userNome) +'</item></item>';
                  cardDataContent += '<item><item>apvSubstituto___'+nIndice+'</item><item>'+ escapeXML(substituto) +'</item></item>';
                  cardDataContent += '<item><item>apvEMail___'+nIndice+'</item><item>'+ escapeXML(userMail) +'</item></item>';
                  cardDataContent += '<item><item>apvDecisao___'+nIndice+'</item><item>'+ escapeXML(xResult[qITEM]) +'</item></item>';
                  cardDataContent += '<item><item>apvObs___'+nIndice+'</item><item>'+ escapeXML(obs[qITEM]) +'</item></item>';
                  // Adicionar explicitamente apvStatus se necessário
                  if (statusIndice !== -1) {
                        cardDataContent += '<item><item>apvStatus___'+ statusIndice +'</item><item>'+ escapeXML(xResult[qITEM]) +'</item></item>';
                  }

                  movprocessoXML = movprocessoXML.replace('<cardData></cardData>', '<cardData>' + cardDataContent + '</cardData>');
                  // A linha movprocesso = movprocesso.replaceAll('&ccedil;','ç')... pode ser problemática. É melhor escapar os valores ao construir o XML.
                  
                  console.log('[movimentar181] Passo 3 - ' + qMovProcesso + ' - XML SOAP para processo ' + processo + ':', movprocessoXML);
                  
                  var parserMovProcesso = new DOMParser(); 
                  var xmlRequestMovProcesso = parserMovProcesso.parseFromString(movprocessoXML, "text/xml"); 

                  var paramsTeste = {
                           process: qMovProcesso + ':' + processo, 
                           txtSOAP: movprocessoXML,
                           url: wsUrl2,
                           async: true,
                           setTimeout: 84000,
                           timeout: 84000,
                           contentType: "text/xml; charset=UTF-8",
                           dataType: "xml",
                           data: xmlRequestMovProcesso, 
                           nr_tentativa: 0,
                           error: function(jqXHR, status, errorThrown, memory) {
                              console.error("[movimentar181] Passo 3 - ERRO em " + qMovProcesso + " para processo " + processo + ":", status, errorThrown, jqXHR);
                              FLUIGC.toast({
                                 message: 'Não foi possível liberar a solicitação nº ' + processo +'. Status: ' + status + '. Erro: ' + errorThrown, 
                                 type: 'danger'
                              });
                           },
                           success: function(responseXMLMovimentar) { // Renomeado para clareza
                              console.log("[movimentar181] Passo 3 - SUCESSO em " + qMovProcesso + " para processo " + processo + ". Resposta:", responseXMLMovimentar);
                              var wsResultText = $(responseXMLMovimentar).find("result").text(); 
                              var errorMsgText = $(responseXMLMovimentar).find("message").text(); 

                              if (wsResultText.toUpperCase().includes('ERROR') || (errorMsgText && errorMsgText.toUpperCase().includes('ERROR'))) {
                                 console.error("[movimentar181] Passo 3 - Erro retornado pelo webservice " + qMovProcesso + " para processo " + processo + ":", errorMsgText || wsResultText);
                                 // ADICIONAR LINHA MOVIMENTADA EM txtProcessando
                                 var txt = $('#txtProcessando').val();
                                       txt += '> Falha WF:' + processo + '\n';
                                 $('#txtProcessando').val(txt);
                                 FLUIGC.toast({
                                       message: 'Não foi possível liberar a solicitação nº ' + processo + '. ' + (errorMsgText || wsResultText),
                                       type: 'danger'
                                 })
                              } else {
                                 // ADICIONAR LINHA MOVIMENTADA EM txtProcessando
                                 var txt = $('#txtProcessando').val();
                                       txt += '* Sucesso WF:' + processo + '\n';
                                 $('#txtProcessando').val(txt);
                                 wfRetorno();
                              }
                        }      
                     };

                  // Chamada assíncrona para movimentar181
                  _async_remote_Call(paramsTeste);
                }
            });
        }
    });
}
