function createDataset(fields, constraints, sortFields) {
	log.info("### DS_APROVADORES_UNIFICADOS - INICIADO");
	var newDataset = DatasetBuilder.newDataset();

	// VALOR CONFORME PARAMETROS
	var usuario="'todos'"; // TODOS - 57d432e684db11eaa3d70a586460a80e
    if (constraints !== null && constraints !== undefined) 
    	for (var i = 0; i < constraints.length; i++) 
    		if (constraints[i].fieldName == 'usuario')
    			usuario = "'"+constraints[i].initialValue+"'";
    
    // ATENCAO 
    // QUANDO O PARAMETRO usuario VIER PREENCHIDO COM todos A CONCULTA VAI CARREGAR TODAS AS PENDENCIAS DE APROVACAO
    // ESTE PARAMETRO DEVE SER USADO SOMENTE PARA GERAR UMA LISTA DE TODAS AS PENDENCIAS INDEPENDENTEMENTE DO APROVADOR
    // FOI FEITO ASSIM PARA ALIMENTAR A LISTA DE EMAILS PENDENTES DE APROVACAO POR APROVADOR
    
    // TABELA
    var const0    = [];
    	const0[0] = DatasetFactory.createConstraint("PROCESSO",'wfAprovacaoUnificada','AprovaçãoUnificada',ConstraintType.MUST);
    var dsFORM    = DatasetFactory.getDataset("DS_GED-FORMS",null,const0,null);
    var TABELA_PRINCIPAL   = 'ML001'+dsFORM.getValue(0,"COD_LISTA");
	var TABELA_APROVADORES = 'ML001821';
	for(var i=0;i<dsFORM.getRowsCount();i++)
		if(dsFORM.getValue(i,"COD_TABELA")=='targetAprovadores'){
			TABELA_APROVADORES = 'ML001'+dsFORM.getValue(i,"COD_LISTA_FILHO");
			break;
		}

	var minhaQuery = 
		"SELECT DISTINCT PW.NUM_PROCES, "+
		"   PW.START_DATE, " +
		"   DATEDIFF(CURDATE(), TR.ASSIGN_START_DATE) AS DIAS, "+ 
		"   ML.dtAberturaChamado, "+
		"   APV.apvSequencia, "+
		"   APV.apvLogin, "+
		"   PW.NUM_PROCES_ORIG, PW.COD_MATR_REQUISIT, FU1.FULL_NAME, TR.NUM_SEQ_ESCOLHID, HP.NUM_SEQ_ESTADO, TR.CD_MATRICULA, TR.NUM_SEQ_MOVTO, PW.NR_DOCUMENTO_CARD, PW.COD_DEF_PROCES,FU2.FULL_NAME ,ML.* "+
		"	FROM PROCES_WORKFLOW PW "+
		"				LEFT OUTER JOIN FDN_USERTENANT  FU0 ON FU0.USER_CODE =PW.COD_MATR_REQUISIT "+
		"				LEFT OUTER JOIN FDN_USER        FU1 ON FU0.USER_ID   =FU1.USER_ID "+
		"			,TAR_PROCES TR "+
		"				LEFT OUTER JOIN FDN_USERTENANT  FU  ON FU.USER_CODE =TR.CD_MATRICULA "+
		"				LEFT OUTER JOIN FDN_USER        FU2 ON FU.USER_ID   =FU2.USER_ID "+
		"      ,DOCUMENTO D, HISTOR_PROCES HP "+
		"      ,"+TABELA_PRINCIPAL+" ML LEFT OUTER JOIN "+TABELA_APROVADORES+" APV ON ML.documentId = APV.documentId AND ML.version = APV.version  "+  
		"	WHERE PW.COD_EMPRESA      = 1 "+
		"	 AND (PW.COD_DEF_PROCES   = 'AprovaçãoUnificada' or  PW.COD_DEF_PROCES ='wfAprovacaoUnificada') "+
		"	 AND PW.NUM_PROCES        = TR.NUM_PROCES "+
		"	 AND TR.LOG_ATIV          = 1 "+
		"	 AND HP.NUM_PROCES        = PW.NUM_PROCES "+
		"	 AND HP.LOG_ATIV          = 1 "+
		"    AND PW.COD_EMPRESA       = D.COD_EMPRESA "+
		"	 AND PW.NR_DOCUMENTO_CARD = D.NR_DOCUMENTO "+
		"	 AND HP.NUM_SEQ_ESTADO    = 5 "+
		"	 AND D.VERSAO_ATIVA       = 1 "+
		"	 AND ML.documentId        = D.NR_DOCUMENTO "+
		"	 AND ML.version           = D.NR_VERSAO "+
		"    AND ( TR.CD_MATRICULA    = APV.apvLogin OR TR.COD_MATR_ESCOLHID = APV.apvLogin ) "+
		"    AND (    TR.CD_MATRICULA      IN ( select CD_MATRICULA from COLAB_SUBSTTO where (COD_SUBSTTO = "+usuario+" OR "+usuario+" = 'todos' ) and DAT_FIM_VALID >= curdate() ) "+
		"          OR TR.COD_MATR_ESCOLHID IN ( select CD_MATRICULA from COLAB_SUBSTTO where (COD_SUBSTTO = "+usuario+" OR "+usuario+" = 'todos' ) and DAT_FIM_VALID >= curdate() ) "+
		"          OR (TR.CD_MATRICULA      = "+usuario+" OR "+usuario+" = 'todos' ) "+
		"          OR (TR.COD_MATR_ESCOLHID = "+usuario+" OR "+usuario+" = 'todos' ) "+
		"         ) "+
		"    ORDER BY TR.CD_MATRICULA, PW.NUM_PROCES, APV.apvSequencia ";
	
	var dataSource = "/jdbc/AppDS";
	log.info("### DS_APROVADORES_UNIFICADOS - minhaQuery: "+minhaQuery);
	
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
		log.error("### DS_APROVADORES_UNIFICADOS ERROR --> " + e.message);
		newDataset.addColumn('ERRROR');
		newDataset.addRow([e.message]);
	} finally {
		if (rs != null)
			rs.close();
		
		if (stmt != null)
			stmt.close();
		
		if (conn != null)
			conn.close();
	}
	log.info("### DS_APROVADORES_UNIFICADOS - FINALIZADO");
	return newDataset;
}
