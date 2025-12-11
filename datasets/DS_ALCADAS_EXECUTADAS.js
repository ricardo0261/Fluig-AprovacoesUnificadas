function createDataset(fields, constraints, sortFields) {
	var newDataset = DatasetBuilder.newDataset();	
	
    // TABELA
    var const0    = [];
    	const0[0] = DatasetFactory.createConstraint("PROCESSO",'wfAprovacaoUnificada','AprovaçãoUnificada',ConstraintType.MUST);
    var dsFORM    = DatasetFactory.getDataset("DS_GED-FORMS",null,const0,null);
    var TABELA_PRINCIPAL = 'ML001'+dsFORM.getValue(0,"COD_LISTA");
    for (var index = 0; index < dsFORM.getRowsCount(); index++) {
    	if(dsFORM.getValue(index,"COD_TABELA")=='targetAutorizacoes')
    		var targetAutorizacoes = 'ML001'+dsFORM.getValue(index,"COD_LISTA_FILHO");
    	
    	if(dsFORM.getValue(index,"COD_TABELA")=='targetAprovadores')
    		var targetAprovadores  = 'ML001'+dsFORM.getValue(index,"COD_LISTA_FILHO");
	}
	
	var minhaQuery =
		"SELECT IT1.apvSequencia, IT1.apvLogin, ML.documentid, IT1.apvStatus, ML.numChamadoOrigem, IT1.apvObs "+
		"	FROM "+TABELA_PRINCIPAL+" ML, DOCUMENTO D  "+
		"		INNER JOIN "+targetAprovadores+" IT1 ON D.NR_DOCUMENTO = IT1.documentid and D.NR_VERSAO = IT1.version "+
		"	WHERE ML.documentId    = D.NR_DOCUMENTO "+
		"		AND ML.version     = D.NR_VERSAO "+
		"		AND D.COD_EMPRESA  = 1 "+
		"		AND D.VERSAO_ATIVA = 1 "+
		"	    and IT1.apvLogin  <> '' AND IT1.apvLogin IS NOT NULL ";
	
	// var numChamado = "'4081612'";
	// var numAtual   = "'4129200'";
	var numChamado = "'-1'";
	var numAtual   = "'-1'";
    if (constraints !== null && constraints !== undefined) 
    	for (var i = 0; i < constraints.length; i++) 
			if (constraints[i].fieldName == 'processoPai') {
				numAtual    = constraints[i].finalValue;
				minhaQuery += " AND ML.numChamadoOrigem = "+constraints[i].initialValue;
			} else if (constraints[i].fieldName == 'numChamado') {
				numChamado = constraints[i].initialValue;
				minhaQuery += " AND ML.numChamado = "+numChamado;
			}

	//minhaQuery += " AND ML.numChamado = "+numChamado;

	minhaQuery += 
		" UNION ALL "+
		" SELECT 0 AS apvSequencia,UT.USER_CODE AS apvLogin, ML.documentid, IT1.apvDecisao AS apvStatus, ML.numChamadoOrigem, IT1.apvObs "+
		"	FROM "+TABELA_PRINCIPAL+" ML, DOCUMENTO D  "+
		"		INNER JOIN "+targetAutorizacoes+" IT1 ON D.NR_DOCUMENTO = IT1.documentid and D.NR_VERSAO = IT1.version "+
		"       INNER JOIN FDN_USERTENANT UT ON IT1.apvEMail = UT.EMAIL "+
		"	WHERE ML.documentId    = D.NR_DOCUMENTO "+
		"		AND ML.version     = D.NR_VERSAO "+
		"		AND D.COD_EMPRESA  = 1 "+
		"		AND D.VERSAO_ATIVA = 1 "+
		"	    and IT1.apvDecisao = 'Aprovado' "+
		"	    AND ML.numChamado = "+numAtual;


	log.info("start - DS_ALCADAS_EXECUTADAS QUERY: " + minhaQuery);
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
		log.error("### DS_ALCADAS_EXECUTADAS ERROr --> " + e.message);
		newDataset.addColumn('ERRROR');
		newDataset.addRow([e.message]);
	} finally {
		if (rs   != null) rs.close();
		if (stmt != null) stmt.close();
		if (conn != null) conn.close();
	}
	return newDataset;
}
