function createDataset(fields, constraints, sortFields) {
	log.info("### DS_ALCADAS_UNIFICADAS INICIADO");
	var newDataset = DatasetBuilder.newDataset();	
	
	// DEFINICAO DE FILTROS
	var filtro    ='';
	var xCFILIAL  ="",
	    xNFILIAL  ="",
		xCARREIRA ="",
	    xCCCUSTO  ="",
	    xNCCUSTO  ="",
	    xCLASSE   ="",
	    xPA       ="",
		xPA_VRVA  ="",
		xRA       ="",
		area	  ="";
	
	for (var i = 0; i < constraints.length; i++) {
		if (constraints[i].fieldName.toUpperCase() == 'CDCCUSTO') 
			xCCCUSTO = ''+constraints[i].initialValue;
		
		else if (constraints[i].fieldName.toUpperCase() == 'CC') 
			xNCCUSTO = ''+constraints[i].initialValue;
		
		else if (constraints[i].fieldName.toUpperCase() == 'PA') 
			xPA = ''+constraints[i].initialValue;

		else if (constraints[i].fieldName.toUpperCase() == 'AR') 
			xRA = ''+constraints[i].initialValue;

		else if (constraints[i].fieldName.toUpperCase() == 'CDFILIAL') 
			xCFILIAL = ''+constraints[i].initialValue;
		
		else if (constraints[i].fieldName.toUpperCase() == 'FILIAL') 
			xNFILIAL = ''+constraints[i].initialValue;

		else if (constraints[i].fieldName.toUpperCase() == 'CARREIRA')
			xCARREIRA = ''+constraints[i].initialValue;
		
		else if (constraints[i].fieldName.toUpperCase() == 'CV')
			xCLASSE = ''+constraints[i].initialValue;

		else if (constraints[i].fieldName.toUpperCase() == 'AREA')
			area = constraints[i].initialValue; // DESCRICAO DA AREA

		else if (constraints[i].fieldName.toUpperCase() == 'PA_VRVA')
			xPA_VRVA = ''+constraints[i].initialValue;

	}

	// gestorDE - primeiro aprovador
	// if(area!=='' && xRA=='' && (xCFILIAL=='00101' || xCFILIAL=='00104')  ){
	// 	// TABELA 0 - ALCADAS POR AREA QDO CSH - BH ou HOLDING - SP
	// 	var const0      = [];
	// 		const0[0]   = DatasetFactory.createConstraint("DATASET",'ds_areas_aprovadores','',ConstraintType.MUST);
	// 	var dsFORM      = DatasetFactory.getDataset("DS_GED-FORMS-SIMPLES",null,const0,null);
	// 	var TABELA_PRINCIPAL = 'ML001'+dsFORM.getValue(0,"COD_LISTA");
	// 	var TABELA_AREA      = 'ML001'+dsFORM.getValue(0,"COD_LISTA_FILHO");
    // 
	// 	var minhaQuery =
	// 		"SELECT 1 AS vlrNivel, 0 AS vlrSemCarta, 0 AS vlrComCarta, "+
	// 		"       1 AS aprovadorNivel, 'area' as tipoAprovacao, '' AS zoomCentroCusto, '' AS zoomCentroCusto_Id, "+
	// 		"       '' AS zoomFilial, '' AS zoomFilial_Id,"+
	// 		"       '' AS usabilidade, "+
	// 		"       '' AS apv_Usuario, "+
	// 		"       '' AS apv_Usuario_Id, "+
	// 		"       '' AS zoomClasseValor, "+
	// 		"       '' AS zoomClasseValor_Id, "+
	// 		"       IT1.gestor, "+
	// 		"       IT1.matrGestor "+
	// 		"	FROM "+TABELA_PRINCIPAL+" ML, DOCUMENTO D "+
	// 		"       ,"+TABELA_AREA+" IT1 "+
	// 		" WHERE ML.companyid   = 1 "+
	// 		"   AND ML.companyid   = D.COD_EMPRESA "+
	// 		"   AND ML.documentid  = D.NR_DOCUMENTO "+
	// 		"   AND ML.version     = D.NR_VERSAO "+
	// 		"   AND D.VERSAO_ATIVA = 1 "+
	// 		"   AND ML.codFilial   = "+xCFILIAL+
	// 		"   AND ML.codFilial   <>'' "+
	// 		"   AND ML.documentid  = IT1.documentid "+
	// 		"   AND ML.version     = IT1.version ";
    // 
	// 	filtro     += " AND IT1.area   = '"+area+"' ";
	// 	minhaQuery += filtro;
    // 
	// } else {
	
	// TABELA 1
	var const0    = [];
		const0[0] = DatasetFactory.createConstraint("DATASET",'ds_Alcadas','',ConstraintType.MUST);
	var dsFORM    = DatasetFactory.getDataset("DS_GED-FORMS-SIMPLES",null,const0,null);
	var TABELA_PRINCIPAL = 'ML001'+dsFORM.getValue(0,"COD_LISTA");
	
	for (var index = 0; index < dsFORM.getRowsCount(); index++) 
		if(dsFORM.getValue(index,"COD_TABELA")=='tbValores')
			var tbValores = 'ML001'+dsFORM.getValue(index,"COD_LISTA_FILHO");
		else
		if(dsFORM.getValue(index,"COD_TABELA")=='tbAlcadas')
			var tbAlcadas  = 'ML001'+dsFORM.getValue(index,"COD_LISTA_FILHO");
		else
		if(dsFORM.getValue(index,"COD_TABELA")=='tbExcessoes')
			var tbExcessoes  = 'ML001'+dsFORM.getValue(index,"COD_LISTA_FILHO");
	
	var minhaQuery =
		"SELECT IT1.vlrNivel, IT1.vlrSemCarta, IT1.vlrComCarta, "+
		"       IT2.aprovadorNivel, IT2.tipoAprovacao, "+
		"       IT2.zoomCentroCusto, IT2.zoomCentroCusto_Id, "+
		"       IT2.zoomFilial, IT2.zoomFilial_Id, "+
		" 	 	IT2.usabilidade, "+
		"       IT2.apv_Usuario, IT2.apv_Usuario_Id, IT2.zoomClasseValor, IT2.zoomClasseValor_Id, "+
		"       '' as gestor, "+
		"       '' as matrGestor "+
		"	FROM "+TABELA_PRINCIPAL+" ML, DOCUMENTO D,"+tbValores+" IT1,"+tbAlcadas+" IT2 "+
		" WHERE ML.companyid         = 1 "+
		"   AND ML.companyid        = D.COD_EMPRESA "+
		"   AND ML.documentid       = D.NR_DOCUMENTO "+
		"   AND ML.version          = D.NR_VERSAO "+
		"   AND D.VERSAO_ATIVA      = 1 "+
		"   AND IT1.documentid      = ML.documentid "+
		"   AND IT1.version         = ML.version "+
		"   AND IT2.documentid      = ML.documentid "+
		"   AND IT2.version         = ML.version "+
		"   AND IT2.aprovadorNivel  = IT1.vlrNivel ";

	/** TIPOS DE APROVACOES */
	// "CC" - Centro de Custo
	// "SP" - Suprimentos
	// "FL" - Filial
	// "CV" - Classe de Valor
	// "PA" - Pagamento Antecipado
	// "PA_VRVA" - Pagamento Antecipado VR/VA
	// "CM" - Carreira Médica
	// "AR" - Adiantamento/Reembolso Opex

	// FILTRAR PA - PAGAMENTO ANTECIPADO
	if(xPA!='')
		filtro += " AND IT2.tipoAprovacao = 'PA' ";
	else
		filtro += " AND IT2.tipoAprovacao <> 'PA' ";

	// FILTRAR PA_VRVA - PAGAMENTO ANTECIPADO VR/VA
	if(xPA_VRVA!='')
		filtro += " AND IT2.tipoAprovacao = 'PA_VRVA' ";
	else
		filtro += " AND IT2.tipoAprovacao <> 'PA_VRVA' ";

	// FILTRAR AR - SOLICITAÇÃO DE REEMBOLSO OU ADIANTAMENTO
	if(xRA!='')
		filtro += " AND IT2.tipoAprovacao = 'AR' ";
	else
		filtro += " AND IT2.tipoAprovacao <> 'AR' ";

	// FILTRAR CARREIRA MÉDICA
	if(xCARREIRA !='')
		filtro += " AND IT2.tipoAprovacao = 'CM' ";
	else
		filtro += " AND IT2.tipoAprovacao <> 'CM' ";
	
	// FILTRAR CENTRO DE CUSTO
	if(xCCCUSTO !='')
		filtro += " AND IT2.zoomCentroCusto_Id = '" + xCCCUSTO + "' AND IT2.zoomCentroCusto_Id <>'' ";
	else if(xNCCUSTO !='')
		filtro += " AND IT2.zoomCentroCusto = '"    + xNCCUSTO + "'  AND IT2.zoomCentroCusto_Id <>'' ";
			
	// FILTRAR FILIAL
	if(xCFILIAL !='')
		filtro += " AND IT2.zoomFilial_Id = '"      + xCFILIAL + "' AND IT2.zoomFilial_Id <>'' ";
	else if(xNFILIAL !='')
		filtro += " AND IT2.zoomFilial = '"         + xNFILIAL + "' AND IT2.zoomFilial_Id <>'' ";
	
	// FILTRAR CLASSE DE VALOR
	if(xCLASSE !='')
		filtro += " AND IT2.zoomClasseValor_Id = '" + xCLASSE  + "' AND IT2.zoomClasseValor_Id <>'' ";

	minhaQuery += filtro;
	minhaQuery += " Order by IT2.aprovadorNivel, ML.nomePlanilha ";
	// }
		
	// SE NENHUM PARAMETRO ENVIADO NAO PERMITIR CONSULTA A TABELA PARA NAO GERAR ERRO DE APROVADOR
	if( xCFILIAL  =="" &&
		xNFILIAL  =="" &&
		xCARREIRA =="" &&
		xCCCUSTO  =="" &&
		xNCCUSTO  =="" &&
		xCLASSE   =="" &&
		xPA       =="" &&
		xPA_VRVA  =="" &&
		xRA       =="" &&
		area	  =="" ){
			filtro = '';			
		}

	// LOG DE VARIAVEIS
    log.info("### DS_ALCADAS_UNIFICADAS constraints: ");
	log.dir(constraints);
	log.info("### DS_ALCADAS_UNIFICADAS QUERY: " + minhaQuery);
    
    if(filtro=='' && xPA=='' && xRA==''){
		log.error("### DS_ALCADAS_UNIFICADAS ERROR --> NENHUM PARAMETRO DE FILTRO INFORMADO OU LOCALIZADO");
		newDataset.addColumn('ERRROR');
		newDataset.addRow(['DS_ALCADAS_UNIFICADAS ERROR --> NENHUM PARAMETRO DE FILTRO INFORMADO OU LOCALIZADO']);
    } else {
    	var dataSource = "/jdbc/AppDS";

    	var conn = null;
    	var stmt = null;
    	var rs   = null;
    	var ic   = new javax.naming.InitialContext();
    	var ds   = ic.lookup(dataSource);
    	var created = false;
    	try {
    		conn = ds.getConnection();
    		stmt = conn.createStatement();
    		rs = stmt.executeQuery(minhaQuery);
    		var columnCount = rs.getMetaData().getColumnCount();
    		while (rs.next()) {
    			if (!created) {
    				for (var i = 1; i <= columnCount; i++) 
    					newDataset.addColumn(rs.getMetaData().getColumnName(i));
    				created = true;
    			}
    			var Arr = new Array();
    			for (var i = 1; i <= columnCount; i++) {
    				var obj = rs.getObject(rs.getMetaData().getColumnName(i));
    				if (null != obj)
    					Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
    				else
    					Arr[i - 1] = null;
    			}
    			newDataset.addRow(Arr);	
    		}
    	} catch (e) {
    		log.error("### DS_ALCADAS_UNIFICADAS ERROr --> " + e.message);
    		newDataset.addColumn('ERRROR');
    		newDataset.addRow([e.message]);
    	} finally {
    		if (rs   != null) rs.close();
    		if (stmt != null) stmt.close();
    		if (conn != null) conn.close();
    	}

    }
	// FINALIZADO		
	log.info("### DS_ALCADAS_UNIFICADAS FINALIZADO");
	log.dir(newDataset);
	return newDataset;
}
