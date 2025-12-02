function displayFields(form,customHTML){
    var state         = getValue("WKNumState" ); 
    var numChamado    = getValue("WKNumProces"); 
    var usuarioCodigo = getValue("WKUser"     );
    var agora         = new Date().toLocaleString('pt-BR');
    
    if (form.getValue("codSolicitante")=="") {
        var usuarioNome = "";
        var usuarioMail = "";
        var c1 = DatasetFactory.createConstraint("colleaguePK.colleagueId", usuarioCodigo, usuarioCodigo, ConstraintType.MUST);
        var ds = DatasetFactory.getDataset("colleague", null, [c1], null);
        if (ds.rowsCount > 0) {
            usuarioNome = ds.getValue(0, "colleagueName");
            usuarioMail = ds.getValue(0, "mail");
        }
        form.setValue("codSolicitante"  , usuarioCodigo);
        form.setValue("nomeSolicitante" , usuarioNome  );
        form.setValue("emailSolicitante", usuarioMail  );
    }

    customHTML.append("<script language='javascript'>");
	customHTML.append("  function getAtividade(){return '" +state				+"'};");
	customHTML.append("  function getFormMode() {return '" +form.getFormMode()	+"'};");
	customHTML.append("  function getUser()     {return '" +usuarioCodigo       +"'};");
	customHTML.append("  function getProcess()  {return '" +numChamado		    +"'};");
    customHTML.append("</script>");
}
