function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    	newDataset.addColumn('RESPOSTA');
    var dataSource = "/jdbc/AppDS"; 
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;

    /**
     * ATUALIZAR VERSAO DO FORMULARIO
     * DEVE SER EXECUTADO SOMENTE PELA EQUIPE DE TI
     */
	var myQuery = 
		"UPDATE DOCUMENTO SET NUM_VERS_PROPRIED = 21000 WHERE COD_EMPRESA=1 AND NR_DOCUMENTO_PAI = 7640845 ";

    log.info("### DS_ATUALIZA_VERSAO_FORM ---> "+myQuery);
 	try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs   = stmt.executeUpdate(myQuery);
        newDataset.addRow( new Array('OK') );
    } catch (e) {
        log.error("ERROR DS_ATUALIZA_VERSAO_FORM ---> " + e.message);
        newDataset.addRow( new Array(e.message) );
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}
