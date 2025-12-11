// Objeto para encapsular contexto e evitar variáveis globais
var AprovacaoContext = {
	// Flags de controle
	lerFILIAIS: false,
	lerCCUSTOS: false,
	lerPA: false,
	lerCV: false,
	verCV: false,
	verFILIAIS: false,
	lerPA_VRVA: false,
	
	// Dados principais
	CC: '',
	CC_Cod: '',
	filial: '',
	codFilial: '',
	usabilidade: '',
	cartaExcecao: '',
	valorSolicitado: '',
	valorCartaExcecao: '',
	operacao: '',
	CV: '',
	codCV: '',
	tipoSolicitacao: '',
	aprovadores: 0,
	area: '',
	nomeFornecedor : '',
	cnpjFornecedor: '',
	
	// Dados de processamento
	usuarios: [],
	nomesUsuarios: [], // Lista para controlar nomes de usuários já adicionados
	origem: '',
	xSequencia: 0,
	colleague: '',
	usuario: '',
	dsAprovadores: null
};

function servicetask13(attempt, message) {
	var numChamado = getValue("WKNumProces");
	log.info("### AprovacaoUnificada.serviceTask13 - INICIADO wf: "+numChamado);

	// ALTERAR USUARIO DE ABERTURA DO FLUXO DE ACORDO COM A ABERTURA DO FLUXO DE ORIGEM NO DATASET workflowProcess
	var params = [];
		params.push( DatasetFactory.createConstraint("workflowProcessPK.processInstanceId",numChamado,numChamado,ConstraintType.MUST) );
	var dsProcesso = buscarDataset("workflowProcess", params);
	var numChamadoOrigem = dsProcesso.getValue(0, "sourceProcess");

	var params = [];
		params.push( DatasetFactory.createConstraint("workflowProcessPK.processInstanceId",numChamadoOrigem,numChamadoOrigem,ConstraintType.MUST) );
	var dsProcessoOrigem = buscarDataset("workflowProcess", params);
	if(dsProcessoOrigem.rowsCount > 0){
		// DATA DE CRIACAO PROCESSO PAI e CHAMADO ORIGEM
		hAPI.setCardValue("numChamadoOrigem" ,numChamadoOrigem );
		hAPI.setCardValue("dtAberturaChamado",dsProcessoOrigem.getValue(0, "startDateProcess") );

		// USUARIO DE CRIACAO
		var usuarioOrigem   = dsProcessoOrigem.getValue(0, "requesterId");
		if(usuarioOrigem != null && usuarioOrigem != ""){
			params = [];
			params.push( DatasetFactory.createConstraint("colleaguePK.colleagueId",usuarioOrigem,usuarioOrigem,ConstraintType.MUST) );
			var dsColleague = buscarDataset("colleague", params);
			if(dsColleague.rowsCount == 0) {
				throw "### Cadastro não encontrado ou usuário bloqueado para "+usuarioOrigem;   
			} else {
				hAPI.setCardValue("usrCriacao"       ,usuarioOrigem );
				hAPI.setCardValue("nomeCriacao"      ,dsColleague.getValue(0, "colleagueName") );
			} 
		}
	}

	// PARAMETROS - usando contexto encapsulado
	AprovacaoContext.CC                = String(hAPI.getCardValue("centroCusto"			) || '').replace('&nbsp;','');	 
	AprovacaoContext.CC_Cod            = String(hAPI.getCardValue("cdCentroCusto"		) || '').replace('&nbsp;','');
	AprovacaoContext.filial            = String(hAPI.getCardValue("filial"				) || '').replace('&nbsp;','');
	AprovacaoContext.codFilial         = String(hAPI.getCardValue("cdFilial"			) || '').replace('&nbsp;','');
	AprovacaoContext.cartaExcecao      = String(hAPI.getCardValue("cartaExcecao"		) || '').replace('&nbsp;','');
	AprovacaoContext.valorSolicitado   = String(hAPI.getCardValue("valorSolicitado"		) || '').replace('&nbsp;','');
	AprovacaoContext.valorCartaExcecao = String(hAPI.getCardValue("valorCartaExcecao"	) || '').replace('&nbsp;','');
	AprovacaoContext.operacao          = String(hAPI.getCardValue("operacao"			) || '').replace('&nbsp;',''); 
	AprovacaoContext.CV                = String(hAPI.getCardValue("classeValor"			) || '').replace('&nbsp;','');
	AprovacaoContext.codCV             = String(hAPI.getCardValue("cdClasseValor"		) || '').replace('&nbsp;','');
	AprovacaoContext.tipoSolicitacao   = String(hAPI.getCardValue("tipoSolicitacao"		) || '').replace('&nbsp;','');
	AprovacaoContext.area              = String(hAPI.getCardValue("area"				) || '').replace('&nbsp;','');
	AprovacaoContext.aprovadores       = 0;
	AprovacaoContext.usabilidade       = ''; // usada somente para PA - pegar usabilidade da filial
	AprovacaoContext.nomeFornecedor    = String(hAPI.getCardValue("nomeFornecedor"		) || '').replace('&nbsp;','');
	AprovacaoContext.cnpjFornecedor    = String(hAPI.getCardValue("cnpjFornecedor"		) || '').replace('&nbsp;','').replace(/[^\d]+/g,''); // somente numeros

	// SEGURANCA FILIAL
	if(AprovacaoContext.codFilial=='' || isNaN(parseInt(AprovacaoContext.codFilial))){
		// RECUPERAR CODIGO
		var xFilial = AprovacaoContext.filial.substring(0,AprovacaoContext.filial.indexOf('-') -1).trim();
		hAPI.setCardValue('cdFilial',xFilial);
		AprovacaoContext.codFilial=xFilial;

	} else if(AprovacaoContext.filial=='' || AprovacaoContext.filial==null){
		// RECUPERAR FILTRO
		params = [];
		params.push( DatasetFactory.createConstraint("CODIGO",AprovacaoContext.codFilial,AprovacaoContext.codFilial,ConstraintType.MUST) );
		var dsFilial = buscarDataset("ds_Filiais", params);
		if(dsFilial.rowsCount >0) {
			AprovacaoContext.filial = dsFilial.getValue(0, "FILTRO");
			hAPI.setCardValue('filial',AprovacaoContext.filial);
		}
	}

	log.info("### AprovacaoUnificada.serviceTask13 - PARAMETROS");
	log.dir(AprovacaoContext.nomeFornecedor);
	log.dir(AprovacaoContext.CC);
	log.dir(AprovacaoContext.CC_Cod);
	log.dir(AprovacaoContext.filial);
	log.dir(AprovacaoContext.codFilial);
	log.dir(AprovacaoContext.cartaExcecao);
	log.dir(AprovacaoContext.valorSolicitado);
	log.dir(AprovacaoContext.valorCartaExcecao);
	log.dir(AprovacaoContext.operacao);
	log.dir(AprovacaoContext.CV);
	log.info("### AprovacaoUnificada.serviceTask13 - PARAMETROS fim");

	// CLASSE DE VALOR
	if(AprovacaoContext.codCV== '')
		if(AprovacaoContext.CV != null && AprovacaoContext.CV != ""){
			AprovacaoContext.codCV = AprovacaoContext.CV.split(' - ')[0];
			if(AprovacaoContext.codCV == null || AprovacaoContext.codCV == "")
				throw "### Falha na leitura da classe de valor. Favor abrir chamado no ISM.";
		} 

	// SEGURANCA CODIGO CENTRO DE CUSTO 90010379 - DIRETORIA HOSPITALAR (OPERACOES)
	// CENTRO DE CUSTO PODE VIR UNICO OU COM VARIOS CENTROS DE CUSTOS SEPARADOS POR VIRGULA
	AprovacaoContext.lerCCUSTOS = true;
	try {
		if(AprovacaoContext.CC_Cod=='' || isNaN(parseInt(AprovacaoContext.CC_Cod))) {
			var xCCusto = AprovacaoContext.CC;
			xCCusto = hAPI.getCardValue('centroCusto').substring(0,xCCusto.indexOf('-') -1).trim();
			AprovacaoContext.CC_Cod = xCCusto;
		}

		if (AprovacaoContext.CC.indexOf(",") != -1)
			AprovacaoContext.CC = AprovacaoContext.CC.split(",");
		else {
			if(AprovacaoContext.CC.indexOf("-") <0) AprovacaoContext.CC=AprovacaoContext.CC_Cod+' - '+AprovacaoContext.CC; // SE SEM O CODIGO NO CENTRO DE CUSTO CARREGAR CONF CC_Cod

			// 11050201 - LINHA DE CUIDADOS
			AprovacaoContext.CC = [AprovacaoContext.CC]; 
		}
	} catch (e) {
		AprovacaoContext.lerCCUSTOS = false;
	}

	// SE VALOR SOLICITADO VIER ENTRE PARENTESIS (VALOR NEGATIVO) REMOVER OS PARENTESIS
	if(AprovacaoContext.valorSolicitado.indexOf('(') >= 0 && AprovacaoContext.valorSolicitado.indexOf(')') >= 0){
		AprovacaoContext.valorSolicitado = AprovacaoContext.valorSolicitado.replace('(', '').replace(')', '');
		// if(AprovacaoContext.valorSolicitado <0)
		//	AprovacaoContext.valorSolicitado = AprovacaoContext.valorSolicitado * -1; // CONVERTER PARA NEGATIVO
	} 

	// TRANSFORMAR VALOR CARTA EXCECAO - R$ 33.000,00
	AprovacaoContext.valorCartaExcecao = parseValorMonetario(AprovacaoContext.valorCartaExcecao);

	// SEGURANCA CARTA DE EXCECAO
	AprovacaoContext.cartaExcecao = isTrue(AprovacaoContext.cartaExcecao) ? 'Sim' : 'Não';
	hAPI.setCardValue("cartaExcecao", AprovacaoContext.cartaExcecao);

	// VALOR DA SOLICITACAO  
	var valorCarta = hAPI.getCardValue("valorCartaExcecao");
	if(valorCarta=='' || valorCarta==null)
		valorCarta = AprovacaoContext.valorSolicitado;

	// SE CARTA DE EXCESSAO TROCAR VALOR PELO VALOR DA CARTA
	if(AprovacaoContext.cartaExcecao == 'S' || AprovacaoContext.cartaExcecao == 'on' || AprovacaoContext.cartaExcecao == "Sim" || AprovacaoContext.cartaExcecao=='sim' )
		AprovacaoContext.valorSolicitado = valorCarta;

	// FORMATAR VALOR SOLICITADO
	var moeda = getMoeda(AprovacaoContext.valorSolicitado);
	AprovacaoContext.valorSolicitado = parseValorMonetario(AprovacaoContext.valorSolicitado);

	if (isNaN(AprovacaoContext.valorSolicitado) || AprovacaoContext.valorSolicitado === 0)
		throw "### Valor solicitado invalido |"+AprovacaoContext.valorSolicitado+'|'+hAPI.getCardValue( "valorSolicitado" )+'|'+hAPI.getCardValue( "valorCartaExcecao" );

	// VERIFICA SE O VALOR ESTÁ EM MOEDA ESTRANGEIRA
	if (moeda !== "Real") {
		var cotacao = valorPadrao(moeda);
		AprovacaoContext.valorSolicitado = AprovacaoContext.valorSolicitado * cotacao;
		hAPI.setCardValue("cotacaoMOEDA", ''+cotacao);
	} else {
		hAPI.setCardValue("cotacaoMOEDA", '1.00');
	}

	// CAMPOS OBRIGATORIOS
	var xmsg=[];

	// VALOR PADRAO PARA CARTA DE EXCECAO
	if(AprovacaoContext.cartaExcecao == null || AprovacaoContext.cartaExcecao == "")
		AprovacaoContext.cartaExcecao = "N";

    // 
	AprovacaoContext.xSequencia = 0;
	AprovacaoContext.usuarios   = [];
	AprovacaoContext.origem     = hAPI.getCardValue("numChamadoOrigem");
	var atual  = hAPI.getCardValue("numChamado");
	
	// O PRIMEIRO APROVADOR FAZ TRATAMENTO PARA ADIANTAMENTO CONF REGRAS DE REEMBOLSO
	// ATUALMENTE A CONSULTA AO SUPERIOR IMEDIATO ESTA SENDO FEITA ATRAVES DO DATASET DA SENIOR PELO NOME DO PRIMEIRO APROVADOR
	var primeiroAPROVADOR = '';

	// VERIFICAR SE EXISTE OUTROS SUBPROCESSOS DE APROVACAO PARA O PROCESSO PAI E NAO CONSIDERAR AS APROVACOES JA INSERIDAS E QUE O STATUS SEJA IGUAL A "Aprovado"
	// EXCETO MEDICAO e REEMBOLSO/ADIANTAMENTO QUE DEVEM APROVAR NOVAMENTE
	log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_EXECUTADAS "+AprovacaoContext.operacao);
	if(AprovacaoContext.operacao !='Solicitação de Medição de Contrato' && 
	   AprovacaoContext.operacao !='Solicitação de Reembolso ou Adiantamento'){
		var params = new Array();
		params.push( DatasetFactory.createConstraint("processoPai",AprovacaoContext.origem,atual,ConstraintType.MUST) );
		var dsExecutados      = buscarDataset("DS_ALCADAS_EXECUTADAS", params);
		if(dsExecutados.rowsCount > 0)
			for (var i1 = 0; i1 < dsExecutados.rowsCount; i1++) {
				AprovacaoContext.colleague  = ''+dsExecutados.getValue(i1, "apvLogin" );
				var status = ''+dsExecutados.getValue(i1, "apvStatus");
				
				log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_EXECUTADAS-colleague "+AprovacaoContext.colleague);
				log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_EXECUTADAS-usuarios. "+AprovacaoContext.usuarios );
				
				if(status=='Aprovado' && AprovacaoContext.colleague !=null ){
					AprovacaoContext.usuarios.push(AprovacaoContext.colleague);
				}
			}
		
		log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_EXECUTADAS usuarios");
		log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_EXECUTADAS-usuarios. "+AprovacaoContext.usuarios );
		log.info("### AprovacaoUnificada.serviceTask13 - operacao : "+AprovacaoContext.operacao);
	}

	// SE OPERACAO = Solicitação de Reembolso ou Adiantamento
	log.info("### AprovacaoUnificada.serviceTask13 - operacao : "+AprovacaoContext.operacao);
	if(AprovacaoContext.operacao=='Solicitação de Reembolso ou Adiantamento') {
		alcadasReembolso();
	} else {
		alcadasPadrao();
	}

	// APROVADORES NAO LOCALIZADOS
	if(AprovacaoContext.usuarios.length<=0){
		throw '### Atenção: Não consigo localizar os aprovadores conforme parametros. Favor acionar o suporte';
	}

	// FINALZADO
	log.info("### AprovacaoUnificada.serviceTask13 - FINALIZADO");
}

// FUNCAO PARA ALCADAS PADRAO
function alcadasPadrao(){
	log.info("### AprovacaoUnificada.serviceTask13 - alcadasPadrao()");
	// CONTROLE DE FILIAIS - EXCETO PARA OS CENTROS DE CUSTOS ABAIXO
	AprovacaoContext.lerFILIAIS = true;
	for (var i = 0; i < AprovacaoContext.CC.length; i++) {
		var centroCusto = AprovacaoContext.CC[i].toUpperCase();
		if (centroCusto.indexOf("NOVOS NEGÓCIOS"             ) != -1 || centroCusto.indexOf("NOVOS NEGÓCIOS JURÍDICO" ) != -1 || 
			centroCusto.indexOf("NOVOS NEGOCIOS"             ) != -1 || centroCusto.indexOf("NOVOS NEGOCIOS JURIDICO" ) != -1 ||
			centroCusto.indexOf("TRIBUTARIO"                 ) != -1 || 
			centroCusto.indexOf("RECEBIMENTO FISCAL"         ) != -1 ||
			centroCusto.indexOf("ADMINISTRACAO DE PESSOAL"   ) != -1 || 
			centroCusto.indexOf("DISPENSACAO DE MEDICAMENTOS") != -1 || 
			centroCusto.indexOf("FOLHA DE PAGAMENTO"         ) != -1  
		){
			AprovacaoContext.lerFILIAIS = false;
			break;
		}
	}
	// CONTROLE DE FILIAIS - dataset EXCECAO
	var params = new Array();
		params.push( DatasetFactory.createConstraint("CC",AprovacaoContext.CC_Cod,AprovacaoContext.CC_Cod,ConstraintType.MUST) );
	var dsCC = buscarDataset("DS_ALCADAS_UNIFICADAS_EXCECAO", params);
	if(dsCC.rowsCount > 0)
		AprovacaoContext.lerFILIAIS = false;

	// VERIFICA SE APROVACAO POR CLASSE DE VALOR FOI INFORMADA COM O CAMPO CLASSE DE VALOR
	if(AprovacaoContext.codCV!=null && AprovacaoContext.codCV!=''){
		log.info("### AprovacaoUnificada.serviceTask13 - codCV: "+AprovacaoContext.codCV);
		AprovacaoContext.verCV	    = true;
		AprovacaoContext.lerCV	    = true;
		AprovacaoContext.lerCCUSTOS = false; // NAO LER CENTRO DE CUSTOS
		AprovacaoContext.lerFILIAIS = false; // NAO LER FILIAIS
		AprovacaoContext.lerPA	    = false; // NAO LER PAGAMENTO ANTECIPADO
		AprovacaoContext.lerPA_VRVA = false; // NAO LER PAGAMENTO ANTECIPADO VR/VA
	} else {
		AprovacaoContext.verCV      = false;
		AprovacaoContext.lerCV      = false;
		AprovacaoContext.lerCCUSTOS = true;
		AprovacaoContext.lerPA      = false; // NAO LER PAGAMENTO ANTECIPADO
		AprovacaoContext.lerPA_VRVA = false; // NAO LER PAGAMENTO ANTECIPADO VR/VA
	}

	// VERIFICA SE APROVACAO FOR OPERACACAO PA - PAGAMENTO ANTECIPADO
	if(AprovacaoContext.operacao.toLowerCase()=='pa' || 
	   AprovacaoContext.operacao.toLowerCase()=='pagamento antecipado' ||
	   AprovacaoContext.operacao.toLowerCase()=='pagamentos estrangeiros'){
		log.info("### AprovacaoUnificada.serviceTask13 - operacao: "+AprovacaoContext.operacao);
		AprovacaoContext.lerCV      = false;
		AprovacaoContext.lerFILIAIS = false;
		AprovacaoContext.lerCCUSTOS = false;
		AprovacaoContext.lerPA      = true;
		AprovacaoContext.lerPA_VRVA = false; // NAO LER PAGAMENTO ANTECIPADO VR/VA
		if( isPA_VRVA()){
			log.info("### AprovacaoUnificada.serviceTask13 - operacao PA_VRVA: "+AprovacaoContext.operacao);
			AprovacaoContext.lerPA      = false;
			AprovacaoContext.lerPA_VRVA = true;
		} else {
			// SE FILIAL FOR INFORMADA CARREGAR USABILIDADE execeto se for PA_VRVA
			if(AprovacaoContext.codFilial != null && AprovacaoContext.codFilial != ''){
				log.info("### AprovacaoUnificada.serviceTask13 - codFilial: "+AprovacaoContext.codFilial);
				var params = new Array();
					params.push( DatasetFactory.createConstraint("CODIGO",AprovacaoContext.codFilial,AprovacaoContext.codFilial,ConstraintType.MUST) );
				var dsFiliais = buscarDataset("ds_Filiais", params);
				if(dsFiliais.rowsCount > 0){
					AprovacaoContext.usabilidade = dsFiliais.getValue(0, "USABILIDADE") || '';
					if(AprovacaoContext.usabilidade=='')
						throw 'ou FALHA no Cadastro de Filiais porque o campo USABILIDADE não foi informado. Favor abrir chamado no ISM.';
					else
						log.info("### AprovacaoUnificada.serviceTask13 - usabilidade: "+AprovacaoContext.usabilidade);
				} else {
					throw "ou FALHA em buscar Filial: "+AprovacaoContext.codFilial+". Favor abrir chamado no ISM.";
				}
			}
		}

	}

	// SE APROVACAO FOR PAGAMENTO ANTECIPADO VR/VA - TODOS OS APROVADORES SAO NIVEL 1 E FILTRAR SOMENTE PELO NIVEL PA_VRVA
	if( isPA_VRVA() ){
		log.info("### AprovacaoUnificada.serviceTask13 - operacao PA_VRVA: "+AprovacaoContext.operacao);
		AprovacaoContext.lerCV      = false;
		AprovacaoContext.lerFILIAIS = false;
		AprovacaoContext.lerCCUSTOS = false;
		AprovacaoContext.lerPA      = false;
		AprovacaoContext.lerPA_VRVA = true;
	}

	// LEITURA CONFORME ALCADAS DE APROVACAO UNIFICADAS x GRUPOS DE APROVACAO (CENTRO DE CUSTO E FILIAL) 
	for (var iGrupo = 0; iGrupo <=4; iGrupo++) {
		log.info("### AprovacaoUnificada.serviceTask13 - LEITURA "+iGrupo+" - wf: "+getValue("WKNumProces"));
		log.info("### AprovacaoUnificada.serviceTask13 - AprovacaoContext.lerCV: "+AprovacaoContext.lerCV);
		log.info("### AprovacaoUnificada.serviceTask13 - AprovacaoContext.lerCCUSTOS: "+AprovacaoContext.lerCCUSTOS);
		log.info("### AprovacaoUnificada.serviceTask13 - AprovacaoContext.lerFILIAIS: "+AprovacaoContext.lerFILIAIS);
		log.info("### AprovacaoUnificada.serviceTask13 - AprovacaoContext.lerPA: "+AprovacaoContext.lerPA);
		log.info("### AprovacaoUnificada.serviceTask13 - AprovacaoContext.lerPA_VRVA: "+AprovacaoContext.lerPA_VRVA);
		log.info("### AprovacaoUnificada.serviceTask13 - LEITURA fim "+iGrupo);
		
		var params = new Array();

		// SE GRUPO 0 - CLASSE DE VALOR INFORMADA NAO TEM APROVACAO POR CENTRO DE CUSTO
		if(iGrupo==0){
			log.info("### AprovacaoUnificada.serviceTask13 - iGrupo: "+iGrupo);
			// SE lerCV FOR FALSE NAO LER CLASSE DE VALOR
			if(!AprovacaoContext.lerCV)
				continue;
			
			if(AprovacaoContext.codCV!=''){
				AprovacaoContext.verCV      = true;
				AprovacaoContext.lerCCUSTOS = false;
				AprovacaoContext.lerFILIAIS = false;
				params.push( DatasetFactory.createConstraint("CV",AprovacaoContext.codCV,AprovacaoContext.codCV,ConstraintType.MUST) );
			}
		} 
		
		else if(iGrupo==1){
			log.info("### AprovacaoUnificada.serviceTask13 - iGrupo: "+iGrupo);
			// SE lerCCUSTOS FOR FALSE NAO LER CENTRO DE CUSTOS
			if(!AprovacaoContext.lerCCUSTOS)
				continue;	

			params.push( DatasetFactory.createConstraint("CDCCUSTO",AprovacaoContext.CC_Cod,AprovacaoContext.CC_Cod,ConstraintType.MUST) );

			// FAZER A LEITURA DE CADA CENTRO DE CUSTO INFORMADO NO CAMPO CENTRO DE CUSTO CC
			// for (var iCC = 0; iCC < CC.length; iCC++) 
			// params.push( DatasetFactory.createConstraint("CDCCUSTO",CC_Cod,CC_Cod,ConstraintType.MUST) );
		 } 
		
		else if(iGrupo==2){
			log.info("### AprovacaoUnificada.serviceTask13 - iGrupo: "+iGrupo);
			// SE lerFILIAIS FOR FALSE NAO LER FILIAIS
			if(!AprovacaoContext.lerFILIAIS)
				continue;	

			// GRUPO 2 - FILIAL
			params.push( DatasetFactory.createConstraint("CDFILIAL",AprovacaoContext.codFilial ,AprovacaoContext.codFilial,ConstraintType.MUST) );

		} 
		
		else if(iGrupo==3){
			log.info("### AprovacaoUnificada.serviceTask13 - iGrupo: "+iGrupo);
			// SE lerPA FOR FALSE NAO LER PAGAMENTO ANTECIPADO
			if(!AprovacaoContext.lerPA)
				continue;	

			// GRUPO 3 - PA - PAGAMENTO ANTECIPADO
			params.push( DatasetFactory.createConstraint("PA",'sim','sim',ConstraintType.MUST) );
		}

		else if(iGrupo==4){
			log.info("### AprovacaoUnificada.serviceTask13 - iGrupo: "+iGrupo);
			// SE lerPA_VRVA FOR FALSE NAO LER PAGAMENTO ANTECIPADO VR/VA
			if(!AprovacaoContext.lerPA_VRVA)
				continue;	

			// GRUPO 4 - PA_VRVA - PAGAMENTO ANTECIPADO VR/VA
			params.push( DatasetFactory.createConstraint("PA_VRVA",'sim','sim',ConstraintType.MUST) );
		}
		
		log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_UNIFICADAS: "+iGrupo);
		log.dir(params);
		
		// CARREGAR SOMENTE SE TEM PARAMETROS
		if(params.length<=0)
			continue;

		// CARREGAR ALCADAS UNIFICADAS		
        AprovacaoContext.dsAprovadores = buscarDataset("DS_ALCADAS_UNIFICADAS", params); 
        
        // SE NAO RETORNAR VALOR VERIFICAR AINDA SE EXISTE ALCADA CONF FILIAL
        // Adicionar verificação de rowsCount antes de acessar getValue(0, ...)
        if(AprovacaoContext.dsAprovadores.rowsCount > 0 && AprovacaoContext.dsAprovadores.getValue(0,"ERROR"))
                throw AprovacaoContext.dsAprovadores.getValue(0,"ERROR");
        
		// SE POSSUIR CLASSE DE VALOR E NAO ENCONTRAR APROVADOR PARA A CLASSE FORCAR PARADA PQ APROVADOR PARA A CLASSE DE VALOR EH OBRIGATORIO
		if(AprovacaoContext.verCV)
			if(AprovacaoContext.dsAprovadores.rowsCount == 0)
				throw "### Aprovador para a classe de valor "+AprovacaoContext.codCV+" não encontrado. Favor acionar a Central de Atendimento e solicitar o cadastro do aprovador.";
	
		// CARREGAR OS APROVADORES
		lerAPROVADORES(0);
	}
	log.info("### AprovacaoUnificada.serviceTask13 - alcadasPadrao()-Finalizado");
}

function lerAPROVADORES(qAPROVADORES){
	log.info("### AprovacaoUnificada.serviceTask13 - lerAPROVADORES() "+qAPROVADORES);
	
	// LIMITE DE APROVADORES CONF PARAMETRO qAPROVADORES
	var limite = AprovacaoContext.dsAprovadores.rowsCount;
	log.info("### AprovacaoUnificada.serviceTask13 - limite "+limite);
	
	// GRAVAR APROVADORES NA TABELA targetAprovadores
	var Compliance = false;
	for (var iAPV= 0; iAPV < limite; iAPV++) {

		// SE APROVACAO SERA COM BASE NO MOVIMENTO COM OU SEM CARTA DE EXCECAO
		var base='0';
		if(AprovacaoContext.cartaExcecao == "Sim") 
			base = AprovacaoContext.dsAprovadores.getValue(iAPV, "vlrComCarta").replace('&&nbsp;', ''); // COM CARTA DE EXCECAO
		else
			base = AprovacaoContext.dsAprovadores.getValue(iAPV, "vlrSemCarta").replace('&&nbsp;', ''); // SEM CARTA DE EXCECAO

		if(base==null || base=='null' || base==''){
			throw "### Valor base para aprovação não encontrado a- "+base;
		}
			
		base = base.toString();
		base = replaceAll( base,'R$',''  );
		base = replaceAll( base,".", ""  );
		base = replaceAll( base,",", "." );
		base = parseFloat(base);
		if(isNaN(base) || base < 0){
			throw "### Valor base do aprovador invalido b- "+base;
		}

		log.info("### AprovacaoUnificada.serviceTask13 - iAPV "           +iAPV);
		log.info("### AprovacaoUnificada.serviceTask13 - valorSolicitado "+AprovacaoContext.valorSolicitado);
		log.info("### AprovacaoUnificada.serviceTask13 - base "           +base);
		log.info("### AprovacaoUnificada.serviceTask13 - operacao "       +AprovacaoContext.operacao);
		
		// VALOR SOLICITADO PODERA VIR NEGATIVO SE O REEMBOLSO CALCULAR VALOR A SER REESTITUIDO PARA A CIA
		if(AprovacaoContext.valorSolicitado<0)
			AprovacaoContext.valorSolicitado = AprovacaoContext.valorSolicitado * -1;

		// SE VALOR SOLICITADO FOR MAIOR QUE O VALOR TETO DO APROVADOR
		// SE OPERACAO = Solicitação de Reembolso ou Adiantamento - Forcar os 2 primeiros aprovadores da classe de valor independente do valor solicitado
		if(AprovacaoContext.valorSolicitado >= base || AprovacaoContext.operacao=='Solicitação de Reembolso ou Adiantamento' || Compliance) {

			// se operacao = Pagamento Antecipado validar usabilidade
			if(AprovacaoContext.operacao.toLowerCase()=='pa' || AprovacaoContext.operacao.toLowerCase()=='pagamento antecipado'){
				var usabilidadeAprovador = AprovacaoContext.dsAprovadores.getValue(iAPV, "usabilidade") || '';
				
				// Se usabilidade da filial estiver preenchida, verificar se consta na usabilidade do aprovador
				if(AprovacaoContext.usabilidade && AprovacaoContext.usabilidade.trim() !== '' && usabilidadeAprovador.indexOf(AprovacaoContext.usabilidade) < 0){
					log.info("### AprovacaoUnificada.serviceTask13 - Usabilidade do aprovador (" + usabilidadeAprovador + ") não confere com a usabilidade da filial (" + AprovacaoContext.usabilidade + "). Ignorar aprovador");
					continue; // IGNORAR APROVADOR
				}
			}

			// PEGAR USUARIO E COLLEAGUE DO APROVADOR
			AprovacaoContext.colleague = ''+AprovacaoContext.dsAprovadores.getValue(iAPV, "apv_Usuario_Id");
			if(AprovacaoContext.colleague=='null' || AprovacaoContext.colleague=='') 
				AprovacaoContext.colleague = ''+AprovacaoContext.dsAprovadores.getValue(iAPV, "matrGestor");

			if(AprovacaoContext.colleague==null || AprovacaoContext.colleague=='')
				AprovacaoContext.colleague = 'integrador.fluig';

			AprovacaoContext.usuario = ''+AprovacaoContext.dsAprovadores.getValue(iAPV, "apv_Usuario");
			if(AprovacaoContext.usuario=='null' || AprovacaoContext.usuario=='')
				AprovacaoContext.usuario = ''+AprovacaoContext.dsAprovadores.getValue(iAPV, "gestor");

			log.info("### AprovacaoUnificada.serviceTask13 - colleague "+AprovacaoContext.colleague);
			log.info("### AprovacaoUnificada.serviceTask13 - usuario.. "+AprovacaoContext.usuario  );
			log.info("### AprovacaoUnificada.serviceTask13 - usuarios. "+AprovacaoContext.usuarios );
			if(AprovacaoContext.colleague==null) 
				continue;

			// VERIFICAR SE O USUARIO JA NAO FOI INSERIDO NA TABELA targetAprovadores
			if(AprovacaoContext.usuarios.indexOf(AprovacaoContext.colleague) == -1){

				// VERIFICAR Compliance E SE FOR TRUE / USUARIO APROVADOR x FORNECEDOR NAO PODE TER APROVACAO - SUBIR O NIVEL PARA O PROXIMO APROVADOR
				Compliance = isExcecaoCompliance(AprovacaoContext.colleague,AprovacaoContext.nomeFornecedor);
				if(Compliance)
					continue; // APROVADOR NAO ATENDE OS CRITERIOS DE Compliance - BUSCAR NOVO APROVADOR

				log.info("### AprovacaoUnificada.serviceTask13 - usuario "+AprovacaoContext.usuario+" nao encontrado na lista de usuarios. Inserindo aprovador...");
				AprovacaoContext.usuarios.push(AprovacaoContext.colleague);

				// PEGAR LOGIN DO USUARIO CONFORME DATASET ALCADAS x COLLEAGUE
				log.info("### AprovacaoUnificada.serviceTask13 - busca dados usuario "+AprovacaoContext.usuario);
				var paramColleague = new Array();
					paramColleague.push( DatasetFactory.createConstraint('colleaguePK.companyId'  ,1        ,1        ,ConstraintType.MUST) );
					paramColleague.push( DatasetFactory.createConstraint('colleaguePK.colleagueId',AprovacaoContext.colleague,AprovacaoContext.colleague,ConstraintType.MUST) );
				var dsColleague = buscarDataset("colleague", paramColleague);
				if(dsColleague.rowsCount == 0)
					throw "### Cadastro não encontrado para o usuário "+AprovacaoContext.usuario+'/ de: '+AprovacaoContext.usuarios;
				else {
					// SE TEM MAIS DE UM CADASTRO ATIVO PARA O USUARIO BLOQUEAR APROVACAO
					if(dsColleague.rowsCount > 1)
						throw "### Usuário "+AprovacaoContext.usuario+" possui mais de um cadastro ativo no fluig. Favor acionar o suporte";
					else { 
						// SE USUARIO ESTIVER BLOQUEADO
						if(dsColleague.getValue(0,"active") =='false' || dsColleague.getValue(0,"active") ==false )
							throw "### Usuário "+AprovacaoContext.usuario+" está Bloqueado no Fluig. Favor acionar o suporte";
						else {
							// PEGAR ID DO USUARIO
							AprovacaoContext.colleague = dsColleague.getValue(0, "colleaguePK.colleagueId");
							if(AprovacaoContext.colleague == null || AprovacaoContext.colleague == "")
								throw "### Colleague não encontrado para o usuário "+AprovacaoContext.usuario+'. Favor acionar o suporte';
						}
					}
				}
				
				// SE O APROVADOR FOR TBM O nomeFornecedor ADICIONAR APROVADOR FINANCEIRO
				log.info("### AprovacaoUnificada.serviceTask13 - operacao: "+AprovacaoContext.operacao);
				log.info("### AprovacaoUnificada.serviceTask13 - nomeFornecedor: "+AprovacaoContext.nomeFornecedor);
				log.info("### AprovacaoUnificada.serviceTask13 - usuario: "+AprovacaoContext.usuario);
				if(isMesmaPessoa(AprovacaoContext.usuario, AprovacaoContext.nomeFornecedor) ){
					log.info("### AprovacaoUnificada.serviceTask13 - Detectado que aprovador é o mesmo que nomeFornecedor: " + AprovacaoContext.usuario );
					log.info("### AprovacaoUnificada.serviceTask13 - Detectado que aprovador é o mesmo que nomeFornecedor: " + AprovacaoContext.nomeFornecedor);
					// buscar usuario do papel financeiro apv_FinanceiroAlcadas
					var qPAPEL = 'apv_FinanceiroAlcadas';
					var paramRoleId = [];
						paramRoleId.push( DatasetFactory.createConstraint("workflowColleagueRolePK.roleId",qPAPEL,qPAPEL,ConstraintType.MUST) );
					var resultDS = DatasetFactory.getDataset("workflowColleagueRole",null,paramRoleId,null);
					if(resultDS.rowsCount>0){
						for (var iResult=0; iResult<resultDS.rowsCount; iResult++) {
							var novoAPV = resultDS.getValue(iResult,"workflowColleagueRolePK.colleagueId");

							// buscar nome do usuario em colleague
							var paramsColleague = [];
								paramsColleague.push( DatasetFactory.createConstraint("colleaguePK.companyId"  ,1      ,1      ,ConstraintType.MUST) );
								paramsColleague.push( DatasetFactory.createConstraint("colleaguePK.colleagueId",novoAPV,novoAPV,ConstraintType.MUST) );
							var resultColleague = DatasetFactory.getDataset("colleague",null,paramsColleague,null);
							var nomeAPV = resultColleague.getValue(0,"colleagueName");
							
							AprovacaoContext.usuarios.push(nomeAPV);
							log.info("### AprovacaoUnificada.serviceTask13 - colleagueName: "+nomeAPV);

							// TROCAR O APROVADOR SOLICITANTE PELO APROVADOR REGISTRADO EM apv_FinanceiroAlcadas
							AprovacaoContext.colleague = novoAPV;
						}
					}
				}

				// CONTROLE DE USUARIO x USUARIOS APROVADORES
				AprovacaoContext.usuarios.push(AprovacaoContext.usuario);

				// INSERIR APROVADOR NA TABELA targetAprovadores
				var newRow = new java.util.HashMap();
					newRow.put("apvSequencia", ''+(AprovacaoContext.xSequencia+1)   );
					newRow.put("apvLogin"    , ''+AprovacaoContext.colleague        );
					newRow.put("apvValorTeto", ''+base.toFixed(2)  );
					newRow.put("apvStatus"   , "nao_confirmado"    );
	
				log.info("### AprovacaoUnificada.serviceTask13 - targetAprovadores: "+newRow);
				try {
					hAPI.addCardChild("targetAprovadores", newRow);
					AprovacaoContext.xSequencia  +=1;
					AprovacaoContext.aprovadores +=1; // SOMA DE TODOS OS APROVADORES ENCONTRADOS
				} catch (e) {
					throw "### addCardChild - targetAprovadores falha. Favor abrir chamado no ISM.";
				}

				// REINICIAR Compliance
				Compliance = false;

				// QUANDO PROCESSO ORIGEM = jornadaFornecedorV360 PEGAR SOMENTE 2 APROVADORES
				if(AprovacaoContext.operacao == 'jornadaFornecedorV360')
					if(AprovacaoContext.aprovadores >= 2)
						break;

				// MEDICAO DE CONTRATOS SOMENTE 1 APROVADOR
				if(AprovacaoContext.operacao.toUpperCase()=='SOLICITAÇÃO DE MEDIÇÃO DE CONTRATO' ||
				   AprovacaoContext.operacao.toUpperCase()=='MEDIÇÃO DE CONTRATOS')
					if(AprovacaoContext.aprovadores >= 1)
						break;

				// SE OPERACAO = 'Cancelamento NFSe Tasy x OC Integra x Protheus'
				if(AprovacaoContext.operacao.toUpperCase()=='Cancelamento NFSe Tasy x OC Integra x Protheus')
					if(AprovacaoContext.aprovadores >= 2)
						break;
				
				// SE OPERACAO = 'Solicitação de Reembolso ou Adiantamento'
				if(AprovacaoContext.operacao.toUpperCase()=='SOLICITAÇÃO DE REEMBOLSO OU ADIANTAMENTO')
					if(AprovacaoContext.aprovadores >= 2)
						break;

				// NUMERO MAXIMO DE APROVADORES CONF SOLICITADO EDGAR BUSINESS CONTROL
				if(AprovacaoContext.aprovadores >= 7)
					break;
			}
		}
	}

	// NAO ENCONTROU USUARIO SUBSTITUTO PARA REGRA DE Compliance
	if(Compliance){
		var qPAPEL = 'apv_FinanceiroAlcadas';
		var paramRoleId = [];
			paramRoleId.push( DatasetFactory.createConstraint("workflowColleagueRolePK.roleId",qPAPEL,qPAPEL,ConstraintType.MUST) );
		var resultDS = DatasetFactory.getDataset("workflowColleagueRole",null,paramRoleId,null);
		if(resultDS.rowsCount>0){
			for (var iResult=0; iResult<resultDS.rowsCount; iResult++) {
				var novoAPV = resultDS.getValue(iResult,"workflowColleagueRolePK.colleagueId");

				// buscar nome do usuario em colleague
				var paramsColleague = [];
					paramsColleague.push( DatasetFactory.createConstraint("colleaguePK.companyId"  ,1      ,1      ,ConstraintType.MUST) );
					paramsColleague.push( DatasetFactory.createConstraint("colleaguePK.colleagueId",novoAPV,novoAPV,ConstraintType.MUST) );
				var resultColleague = DatasetFactory.getDataset("colleague",null,paramsColleague,null);
				var nomeAPV = resultColleague.getValue(0,"colleagueName");
				AprovacaoContext.usuarios.push(nomeAPV);
				log.info("### AprovacaoUnificada.serviceTask13 - colleagueName: "+nomeAPV);

				// INSERIR APROVADOR NA TABELA targetAprovadores
				var newRow = new java.util.HashMap();
					newRow.put("apvSequencia", ''+(AprovacaoContext.xSequencia+1)   );
					newRow.put("apvLogin"    , ''+novoAPV);
					newRow.put("apvValorTeto", ''+base.toFixed(2)  );
					newRow.put("apvStatus"   , "nao_confirmado"    );

				try {
					hAPI.addCardChild("targetAprovadores", newRow);
					AprovacaoContext.xSequencia  +=1;
					AprovacaoContext.aprovadores +=1; // SOMA DE TODOS OS APROVADORES ENCONTRADOS
				} catch (e) {
					throw "### addCardChild - targetAprovadores falha aprovador financeiro. Favor abrir chamado no ISM.";
				}
			}
		}
	}

	// VERIFICA SE CLASSE DE VALOR FOI INFORMADA
	if(AprovacaoContext.codCV != null && AprovacaoContext.codCV != "")
		// SE tipoSolicitacao NAO POSSUIR 2 APROVADORES PARA ADIANTAMENTO RETORNAR ERRO
		if(AprovacaoContext.tipoSolicitacao == 'adiantamento' && AprovacaoContext.aprovadores < 2)
			throw "### Atenção: Não foi possível localizar todos os aprovadores para o adiantamento. Necessário 2 aprovadores para a Classe de Valor. Favor acionar o suporte";

	// FINALIZADA A LEITURA DO DATASET
	log.info("### AprovacaoUnificada.serviceTask13 - lerAPROVADORES()-Finalizado");
}

// FUNCAO PARA TROCAR APROVADOR CONFORME EXCESSAO Compliance
function isExcecaoCompliance(qUSER,qFORNECEDOR){
	log.info("### AprovacaoUnificada.serviceTask13 - isExcecaoCompliance()");
	var isExcecao = false;

	var user        = (qUSER || '').toUpperCase();
	var fornecedor  = (qFORNECEDOR || '').toUpperCase();
	var listaExcecao = {
						nome		:	"Luiz Felippe Quites Teixeira",
						idUser		:	"8d3dbb700c46490fb96e8175604d6ff6",
						razaoSocial	:	"Azevedo Sette Advogados",
						CNPJ		:	"65.174.088/0001-03"
					};

	for(var key in listaExcecao){
		if((listaExcecao[key].idUser || '').toUpperCase() == user && (listaExcecao[key].razaoSocial || '').toUpperCase() == fornecedor){
			isExcecao = true;
			break;
		}
	}
	log.info("### AprovacaoUnificada.serviceTask13 - isExcecaoCompliance() - isExcecao: "+isExcecao);
	return isExcecao;
}

// FUNCAO PARA IDENTIFICAR PA_VRVA
function isPA_VRVA(){
	log.info("### AprovacaoUnificada.serviceTask13 - isPA_VRVA()");
	var isVRVA = false;
	
  	log.info("### AprovacaoUnificada.serviceTask13 - isPA_VRVA() - CNPJ: "+AprovacaoContext.cnpjFornecedor);
	
	// LISTA DE CNPJS QUE UTILIZAM VR/VA NO PAGAMENTO ANTECIPADO 
	var listaCNPJ = [ 	
		{ nome: 'PLUXEE BENEFICIOS DO BRASIL',    cnpj: '69034668000156' },
		{ nome: 'BENEFICIO FACIL SERVICOS LTDAE', cnpj: '06353068000130' }
	];
	
	// VERIFICAR SE OPERACAO = PA - PAGAMENTO ANTECIPADO
	if(	AprovacaoContext.operacao.toLowerCase()=='pagamento antecipado vr_va'   || 
		AprovacaoContext.operacao.toLowerCase()=='pagamento antecipado'         || 
		AprovacaoContext.operacao.toLowerCase()=='pagamento antecipado - vr/va' || 
		AprovacaoContext.operacao.toLowerCase()=='pa_vrva' 						){
		// VERIFICAR SE CNPJ DO FORNECEDOR ESTA NA LISTA DE VR/VA
		for(var i = 0; i < listaCNPJ.length; i++){
			if(listaCNPJ[i].cnpj == AprovacaoContext.cnpjFornecedor){
				log.info("### AprovacaoUnificada.serviceTask13 - isPA_VRVA() - CNPJ encontrado na lista de VR/VA: "+listaCNPJ[i].nome);
				isVRVA = true;
				break;
			}
		}
	}
	
	log.info("### AprovacaoUnificada.serviceTask13 - isPA_VRVA() - isVRVA: "+isVRVA);
	return isVRVA;
}

// FUNCAO PARA ALCADAS DE REEMBOLSO E/OU ADIANTAMENTO
function alcadasReembolso()	{
	log.info("### AprovacaoUnificada.serviceTask13 - alcadasReembolso()");
	
	// LEITURA CONFORME ALCADAS DE APROVACAO UNIFICADAS x GRUPOS DE APROVACAO (CENTRO DE CUSTO E FILIAL) 
	log.info("### AprovacaoUnificada.serviceTask13 - DS_ALCADAS_UNIFICADAS: AR-Adiantamento/Reembolso");
	var params = new Array();

	if(AprovacaoContext.CV!=''){
		// CAPEX 
		// 	SE REEMBOLSO
		//    LIDER DO PROJETO - primeiro aprovador da classe de valor
		// 	SE ADIANTAMENTO
		//    LIDER DO PROJETO - primeiro aprovador da classe de valor
		//    GESTOR IMEDIATO  - segundo aprovador da classe de valor
		// CLASSE DE VALOR
		params.push( DatasetFactory.createConstraint("CV",AprovacaoContext.codCV,AprovacaoContext.codCV,ConstraintType.MUST) );

	} else {
		// OPEX
		// 	SE REEMBOLSO
		// 	SE ADIANTAMENTO
		// 		SEMPRE 2 APROVADORES POR CENTRO DE CUSTO
		params.push( DatasetFactory.createConstraint("AR"      ,'SIM' ,'SIM',ConstraintType.MUST) );
		params.push( DatasetFactory.createConstraint("CDCCUSTO",AprovacaoContext.CC_Cod,AprovacaoContext.CC_Cod,ConstraintType.MUST) );
	}
	AprovacaoContext.dsAprovadores = buscarDataset("DS_ALCADAS_UNIFICADAS", params); 
	if(AprovacaoContext.dsAprovadores.rowsCount > 0 && AprovacaoContext.dsAprovadores.getValue(0,"ERROR"))
		throw AprovacaoContext.dsAprovadores.getValue(0,"ERROR");
	
	// SE POSSUIR CLASSE DE VALOR E NAO ENCONTRAR APROVADOR PARA A CLASSE FORCAR PARADA PQ APROVADOR PARA A CLASSE DE VALOR EH OBRIGATORIO
	if(AprovacaoContext.codCV != null && AprovacaoContext.codCV != ""){
		if(AprovacaoContext.verCV && AprovacaoContext.dsAprovadores.rowsCount == 0)
			throw "### Aprovador para a classe de valor "+AprovacaoContext.codCV+" não encontrado. Favor acionar a Controladoria para cadastro do aprovador";
	} else {
		// SE NAO POSSUIR CLASSE DE VALOR E NAO ENCONTRAR APROVADOR PARA O CENTRO DE CUSTO FORCAR LEITURA POR FILIAL
		if(AprovacaoContext.dsAprovadores.rowsCount == 0){
			log.info("### AprovacaoUnificada.serviceTask13 - alcadasReembolso() - CENTRO DE CUSTO NAO ENCONTRADO APROVADORES");
			params = new Array();
			params.push( DatasetFactory.createConstraint("AR"      ,'SIM' ,'SIM',ConstraintType.MUST) );
			params.push( DatasetFactory.createConstraint("CDFILIAL",AprovacaoContext.codFilial ,AprovacaoContext.codFilial,ConstraintType.MUST) );
			AprovacaoContext.dsAprovadores = buscarDataset("DS_ALCADAS_UNIFICADAS", params); 
			if(AprovacaoContext.dsAprovadores.rowsCount > 0 && AprovacaoContext.dsAprovadores.getValue(0,"ERROR"))
				throw AprovacaoContext.dsAprovadores.getValue(0,"ERROR");

			if(AprovacaoContext.dsAprovadores.rowsCount == 0)
				throw "### Aprovador para a Centro de Custo ou FILIAL/AR "+AprovacaoContext.codFilial+" não encontrado. Favor acionar a Controladoria para cadastro do aprovador";
		}
	}

	// CARREGAR OS APROVADORES
	lerAPROVADORES(1);
	log.info("### AprovacaoUnificada.serviceTask13 - alcadasReembolso()-Finalizado");
}

// FUNCAO PARA VERIFICAR SE DUAS PESSOAS SAO A MESMA COMPARANDO NOMES DE FORMA INTELIGENTE
function isMesmaPessoa(nome1, nome2) {
	log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa()");
	if (!nome1 || !nome2) return false;
	
	// Normalizar os nomes: converter para lowercase 
	var n1 = nome1.toString().toLowerCase().trim();
	var n2 = nome2.toString().toLowerCase().trim();
	
	// Se forem exatamente iguais após normalização
	log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa() - n1/n2: "+n1+'/'+n2);
	if (n1 == n2) return true;
	
	// Dividir os nomes em palavras (primeiro nome, sobrenomes)
	var palavras1 = n1.split(' ');
	var palavras2 = n2.split(' ');
	
	// Filtrar palavras vazias
	var temp1 = [];
	for (var k = 0; k < palavras1.length; k++) {
		if (palavras1[k].length > 0) {
			temp1.push(palavras1[k]);
		}
	}
	palavras1 = temp1;
	
	var temp2 = [];
	for (var l = 0; l < palavras2.length; l++) {
		if (palavras2[l].length > 0) {
			temp2.push(palavras2[l]);
		}
	}
	palavras2 = temp2;
	log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa() - palavras1/palavras2: "+palavras1+'/'+palavras2);
	if (palavras1.length == 0 || palavras2.length == 0) return false;
	
	// Verificar se o primeiro nome é o mesmo
	log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa() - palavras1[0]/palavras2[0]: "+palavras1[0]+'/'+palavras2[0]);
	if (palavras1[0] !== palavras2[0]) return false;
	
	// Verificar se o último sobrenome é o mesmo (importante para identificação)
	var ultimoSobrenome1 = palavras1[palavras1.length - 1];
	var ultimoSobrenome2 = palavras2[palavras2.length - 1];
	log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa() - ultimoSobrenome1/ultimoSobrenome2: "+ultimoSobrenome1+'/'+ultimoSobrenome2);
	if (ultimoSobrenome1 !== ultimoSobrenome2) return false;
	
	// Se chegou até aqui, primeiro nome e último sobrenome são iguais
	// Verificar se as palavras do nome menor estão contidas no nome maior
	var nomeCompleto, nomeSimples;
	if (palavras1.length <= palavras2.length) {
		nomeSimples = palavras1;
		nomeCompleto = palavras2;
	} else {
		nomeSimples = palavras2;
		nomeCompleto = palavras1;
	}
	
	// Verificar se todas as palavras do nome simples estão no nome completo
	for (var i = 0; i < nomeSimples.length; i++) {
		log.info("### AprovacaoUnificada.serviceTask13 - isMesmaPessoa() - nomeSimples[i]/nomeCompleto: "+nomeSimples[i]+'/'+nomeCompleto);
		var encontrou = false;
		for (var j = 0; j < nomeCompleto.length; j++) {
			if (nomeSimples[i] === nomeCompleto[j]) {
				encontrou = true;
				break;
			}
		}
		if (!encontrou) return false;
	}
	
	return true;
}

// FUNCAO PARA SUBSTITUIR TODOS OS CARACTERES DE UMA STRING
function replaceAll(str, de, para){
    var pos = str.indexOf(de);
    while (pos > -1){
		str = str.replace(de, para);
		pos = str.indexOf(de);
	}
    return (str);
}

function obterCotacaoMoedasBancoCentral(moeda, dataCotacao, callback) {
	// Formata a data para o formato MM-dd-yyyy 04-08-2025
	var dataAtual = new Date();
	var dia = ( dataAtual.getDate()       < 10 ? '0' : '') +  dataAtual.getDate();
	var mes = ((dataAtual.getMonth() + 1) < 10 ? '0' : '') + (dataAtual.getMonth() + 1); // Janeiro é 0
	var ano = dataAtual.getFullYear();
	var dataFormatada = dataCotacao || ''+mes + '-' + dia + '-' + ano;
	
	// URL da API do Banco Central
	//         
	// DOLAR e SAR
	// https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='08-04-2025'&$top=100&$format=json&$select=cotacaoCompra
	//
	// EURO
	// https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='EUR'&@dataInicial='04-22-2025'&@dataFinalCotacao='04-22-2025'&$top=1&$format=json&$select=cotacaoCompra
	
	// EUA e SAR
	var url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='" + dataFormatada + "'&$top=100&$format=json&$select=cotacaoCompra";
	if(moeda=='EUR')
		url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='EUR'&@dataInicial='" + dataFormatada + "'&@dataFinalCotacao='" + dataFormatada + "'&$top=1&$format=json&$select=cotacaoCompra";
	
	log.info("### cotacao dolar/euro banco central - endPoint:");
	log.dir(url);
	
    try {
        // Faz a requisição HTTP usando HttpURLConnection
        var URL = new java.net.URL(url);
        var connection = URL.openConnection();
        connection.setRequestMethod("GET");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.connect();

        var responseCode = connection.getResponseCode();
        if (responseCode === 200) {
            var scanner = new java.util.Scanner(connection.getInputStream());
            var response = "";
            while (scanner.hasNext()) {
                response += scanner.nextLine();
            }
            scanner.close();

            // Parseia a resposta JSON
            var jsonResponse = JSON.parse(response);

            // Verifica se há valores retornados
            if (jsonResponse.value && jsonResponse.value.length > 0) {
                callback(null, jsonResponse.value[0].cotacaoCompra); // Retorna a cotação de compra
            } else {
				// SE NAO ENCONTRAR VALOR LANCAR CONF VALORES FIXOS INFORMADOS PELA GESTAO DE BUSINESS CONTROL
            	// MAIO.25 
            	// usd = R$5,66 
            	// JPY = R$0,04 
            	// SAR = R$1,51 
            	// EUR = R$6,42
           		callback(null, valorPadrao(moeda));
            }
        } else {
       		callback(null, valorPadrao(moeda));
            // callback("### Falha ao acessar a API do Banco Central: " + responseCode, null);
        }
    } catch (error) {
   		callback(null, valorPadrao(moeda));
        // callback("### Falha ao obter a cotação do dólar do Banco Central: " + error+' --- '+url, null);
    }
}

function valorPadrao(qMOEDA){
	if(qMOEDA=='USD')
		return 5.66;
	
	else if(qMOEDA=='JPY')
		return 0.04;

	else if(qMOEDA=='SAR')
		return 1.51;

	else if(qMOEDA=='EUR')
		return 6.42;
	
	else if(qMOEDA=='LIB')
		return 7.24
	
	else return 1;
}

function parseValorMonetario(valor) {
    if (valor === null || valor === '') return 0; // Verificação mais robusta

    var valorStr = String(valor); // Garante que estamos trabalhando com uma string

    // Etapa 1: Remover símbolos de moeda e espaços
    var simbolosMoeda = ["R$", "US$", "€", "﷼", "£"];
    // Substituindo forEach por um loop for padrão
    for (var i = 0; i < simbolosMoeda.length; i++) {
        var simbolo = simbolosMoeda[i];
        // Usar split/join para simular replaceAll e evitar problemas com regex no Fluig/Rhino
        // É importante que 'simbolo' não contenha caracteres especiais de regex se fosse usar replace com regex.
        // Com split/join, ele é tratado literalmente.
        if (valorStr.indexOf(simbolo) !== -1) { // Otimização: só fazer split/join se o símbolo existir
            valorStr = valorStr.split(simbolo).join("");
        }
    }

    // Remover espaços. A regex original /s cobria todos os tipos de whitespace.
    // split(" ").join("") só remove espaços literais (' ').
    // Se outros caracteres de espaço em branco (como tabulações) precisarem ser removidos,
    // esta parte pode precisar de ajustes adicionais (ex: valorStr = valorStr.split("\t").join("");)
    valorStr = valorStr.split(" ").join("");

    // Etapa 2: Remover pontos (usados como separadores de milhar)
    valorStr = valorStr.split(".").join("");

    // Etapa 3: Substituir vírgula (usada como separador decimal) por ponto
    valorStr = valorStr.replace(",", ".");

    var resultado = parseFloat(valorStr);
    
    // Retorna 0 se o resultado não for um número (ex: se a string original era inválida)
    return isNaN(resultado) ? 0 : resultado;
}

function isTrue(valor) {
    if (valor === true) return true;
    if (typeof valor === 'string') {
        var v = valor.trim().toLowerCase();
        return v === 'true' || v === 'sim' || v === 's' || v === 'on';
    }
    return false;
}

var MOEDAS = {
    'US$': 'USD',
    '€'  : 'EUR',
    '﷼'  : 'SAR',
    'R$' : 'REAL',
    '£'  : 'LIB'
};

function getMoeda(valor) {
    for (var simbolo in MOEDAS) {
        if (valor.indexOf(simbolo) !== -1) return MOEDAS[simbolo];
    }
    return 'Real';
}

function buscarDataset(nome, constraints) {
    var ds = DatasetFactory.getDataset(nome, null, constraints, null);
    return ds;
}
