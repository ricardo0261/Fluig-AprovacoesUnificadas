function validateForm(form){
    // INICIAR CAMPOS DE CONTROLE
    msg      = "Favor verificar os seguintes campos: \n\n ";
    arrayMsg = [];

    // validar campos da tabela tbAlcadas
    var indexes = form.getChildrenIndexes('tbAlcadas');
    if(indexes.length == 0)
        arrayMsg.push(' &bull; É necessário incluir ao menos um Aprovador.\n');

	/** RESULTADO FINAL */
	var msgFinal = msg + arrayMsg.join('');
	if(msgFinal !== msg) 
        throw arrayMsg
	else 
        return true;
}
