function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    	dataset.addColumn("STATUS");
    	dataset.addColumn("MESSAGE");
        
    log.info("Iniciando inclusão de comentário via dataset DS_LANCAR_HISTORICO_WF2");

    // DATASET COM USUARIO E SENHA DO USUARIO ADM
    var ds_usuarioIntegrador = DatasetFactory.getDataset("DS_USUARIO_INTEGRADOR",null,null,null);
    var USER      = ''+ds_usuarioIntegrador.getValue(0,"user")+'@oncoclinicas.com',
        PWSD      = ''+ds_usuarioIntegrador.getValue(0,"password"),
        MATRICULA = ''+ds_usuarioIntegrador.getValue(0,"userId");

    dataset.addRow(["INFO", "Usuário de integração: "+USER+" | Matrícula para comentário: "+MATRICULA]);

    var params = {};
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            var c = constraints[i];
            if(c.fieldName =='PROCESS_INSTANCE_ID' ||
               c.fieldName =='USER_ID'             ||
               c.fieldName =='COMMENTS'            ||
               c.fieldName =='THREAD_SEQUENCE'     ){
                   params[c.fieldName] = c.initialValue;
               }
        }
    }
 
    params.COMPANY_ID = 1;
    params.LOGIN      = USER;
    params.PASSWORD   = PWSD;
    params.USER_ID    = MATRICULA;

    dataset.addRow(["INFO", "Parâmetros preparados para inclusão de comentário. Iniciando chamada ao serviço..."]);
    try {
        var companyId         = parseInt(params.COMPANY_ID, 10);
        var processInstanceId = parseInt(params.PROCESS_INSTANCE_ID, 10);
        var threadSequence    =          params.THREAD_SEQUENCE ? parseInt(params.THREAD_SEQUENCE, 10) : 0;

        // parametros do serviço
        log.info("### Parâmetros para inclusão de comentário:");
        log.info("companyId: " + companyId);
        log.info("processInstanceId: " + processInstanceId);
        log.info("userId: " + params.USER_ID);
        log.info("threadSequence: " + threadSequence);
        log.info("comments: " + params.COMMENTS);
 
        // Nome do serviço cadastrado no Fluig
        var SERVICE_NAME   = "ECMWorkflowEngineService";
        var SERVICE_PATH   = "br.com.oncoclinicas.fluig.ECMWorkflowEngineServiceService";
        var serviceHelper  = ServiceManager.getService(SERVICE_NAME).getBean();
        var serviceLocator = serviceHelper.instantiate(SERVICE_PATH);
        var service        = serviceLocator.getWorkflowEngineServicePort();
 
        /*
         * Método: setTasksComments
         * Assinatura (documentação Fluig):
         * setTasksComments(String user, String password, int companyId,
         *                  int processInstanceId, String userId,
         *                  int threadSequence, String comments)
         */
        var result = service.setTasksComments(
            params.LOGIN,            // user (login do usuário de integração)
            params.PASSWORD,         // password
            companyId,               // companyId
            processInstanceId,       // processInstanceId (número da solicitação)
            params.USER_ID,          // userId (quem aparece como autor do comentário)
            threadSequence,          // threadSequence (geralmente 0)
            params.COMMENTS          // comments

        );
        log.info("Comentário incluído com sucesso via dataset DS_LANCAR_HISTORICO_WF2. Resultado: ");
        log.dir(result);
 
        dataset.addRow(["OK", "Comentário incluído com sucesso na solicitação " + processInstanceId]);
        dataset.addRow(["RESULT", result.toString()]);
    } catch (e) {
        log.error("Erro ao incluir comentário via dataset: " + e);
        dataset.addRow(["ERROR", e.toString()]);
    }
    return dataset;
}
