function servicetask35(attempt, message) {
	// CONFIRMAR SE O BANCO DE DADOS LIBEROU O COMMIT DO FORM ANTES DE TESTAR A VALIDACAO
	// FAZER 3 TENTATIVAS A CADA 2 MINUTOS
	var numChamado = hAPI.getCardValue("numChamado");
	var usuario    = getValue('WKUser'); //matricula do usuário corrente

	// Verifica se o usuário atual é o responsável pela aprovação
	log.info("### AprovacaoUnificada.servicetask35 - numChamado: "+numChamado);
	log.info("### AprovacaoUnificada.servicetask35 - usuario: "+usuario);

	var params = new Array();
		params.push( DatasetFactory.createConstraint("numChamado",numChamado,'',ConstraintType.MUST) );
	var dsExecutados = DatasetFactory.getDataset("DS_ALCADAS_EXECUTADAS",null,params,null);
	log.info("### AprovacaoUnificada.servicetask35 - DS_ALCADAS_EXECUTADAS");
	log.dir(dsExecutados);
	
	var achei='nao';
	if(dsExecutados.rowsCount > 0)
		for (var i1 = 0; i1 < dsExecutados.rowsCount; i1++) {
			var status = ''+dsExecutados.getValue(i1, "apvStatus");
			// gravar historico e motido da reprovação no workflow horiginal se o ultimo registro for Reprovado
			if(status =='Reprovado'){
				var numChamadoOrigem = dsExecutados.getValue(i1,"numChamadoOrigem");
				var apvLogin	 = ''+dsExecutados.getValue(i1,"apvLogin");

				// BUSCAR NOME DO APROVADOR NO DATASET DE USUARIOS COLEEAGUE
				var constUser = new Array();
					constUser.push( DatasetFactory.createConstraint("colleaguePK.colleagueId",apvLogin,apvLogin,ConstraintType.MUST) );
				var dsUser = DatasetFactory.getDataset("colleague",null,constUser,null);
				var nomeAprovador = dsUser.getValue(0,"colleagueName");
				var comments = 'Atenção: '+nomeAprovador+" Reprovou esta solicitação - Motivo: "+dsExecutados.getValue(i1,"apvObs");

				var users = new java.util.ArrayList();
					users.add(usuario); // matrícula do usuário

				// ENVIAR HISTORICO PARA O WORKFLOW ORIGEM ATRAVES DATASET DS_LANCAR_HISTORICO_WF2
				var params = new Array();
					params.push( DatasetFactory.createConstraint("PROCESS_INSTANCE_ID"	,numChamadoOrigem	,'',ConstraintType.MUST) );
					params.push( DatasetFactory.createConstraint("USER_ID"				,usuario			,'',ConstraintType.MUST) );
					params.push( DatasetFactory.createConstraint("COMMENTS"				,comments			,'',ConstraintType.MUST) );
					params.push( DatasetFactory.createConstraint("THREAD_SEQUENCE"		,"0"				,'',ConstraintType.MUST) );
				var dsLancarHistorico = DatasetFactory.getDataset("DS_LANCAR_HISTORICO_WF2",null,params,null);
				log.info("### AprovacaoUnificada.servicetask35 - DS_LANCAR_HISTORICO_WF2");
				log.dir(dsLancarHistorico);
				break;
			} else {
				if(status =='nao_confirmado'){
					achei='sim';
					break;
				}
			}
		}
	else 
		achei='vazio';
	
	log.info("### AprovacaoUnificada.servicetask35 - achei: "+achei);
	return achei;
}
