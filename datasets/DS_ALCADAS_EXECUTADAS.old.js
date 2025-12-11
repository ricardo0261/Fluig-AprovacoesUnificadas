function createDataset(fields, constraints, sortFields) {
	var newDataset = DatasetBuilder.newDataset();	
	var minhaQuery =
		"SELECT IT1.apvSequencia, IT1.apvLogin, ML.documentid, IT1.apvStatus, ML.numChamadoOrigem, IT1.apvObs "+
		"	FROM ML0012301 ML, DOCUMENTO D  "+
		"		INNER JOIN ML0012417 IT1 ON D.NR_DOCUMENTO = IT1.documentid and D.NR_VERSAO = IT1.version "+
		"	WHERE ML.documentId    = D.NR_DOCUMENTO "+
		"		AND ML.version     = D.NR_VERSAO "+
		"		AND D.COD_EMPRESA  = 1 "+
		"		AND D.VERSAO_ATIVA = 1 "+
		"       and IT1.apvStatus  = 'Aprovado' "+
		"	    and IT1.apvLogin  <> '' AND IT1.apvLogin IS NOT NULL ";
	
	var numChamadoOrigem = "'2226683'";
    if (constraints !== null && constraints !== undefined) 
    	for (var i = 0; i < constraints.length; i++) 
			if (constraints[i].fieldName == 'processoPai') 
				numChamadoOrigem = constraints[i].initialValue;
    
	minhaQuery += " AND ML.numChamadoOrigem = "+numChamadoOrigem;  // '"+constraints[i].initialValue+"'";

	log.info("start - DS_ALCADAS_EXECUTADAS QUERY: " + minhaQuery);
	var dataSource = "/jdbc/FluigDSRO";
	
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
