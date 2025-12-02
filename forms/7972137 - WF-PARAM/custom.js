/*  SM2CE LTDA
	ANALISTA RICARDO ANDRADE
           ATENCAO
	 *** NAO IDENTAR ESTE CODIGO ***
	     VERSAO 1.0.0
	     r20200408
 */
// FUNCOES FORM
var beforeSendValidate = function(numState,nextState){
	var msg       = "Favor verificar os seguintes campos: \n\n ";
	var arrayMsg  = [];

	// MESSAGEM FINAL
	var msgFinal = msg + arrayMsg.join("");
	if (msgFinal !== msg) {
		throw (msgFinal+' \n\n ');
	} else
		return true;
}
function cep_callback(conteudo) {
	if (!("erro" in conteudo)) {
		// ATUALIZA OS CAMPOS COM OS VALORES
		document.getElementById('txtLOGRADOURO').value = (conteudo.logradouro);
		document.getElementById('txtBAIRRO'    ).value = (conteudo.bairro);
		document.getElementById('txtCIDADE'    ).value = (conteudo.localidade);
		document.getElementById('txtUF'        ).value = (conteudo.uf);
		// MOVIMENTAR PARA O NUMERO 
		document.getElementById('txtNumero').focus();
	} else {
		// CEP NÃO ENCONTRADO
        FLUIGC.toast({
            title: 'Busca CEP',
            message: 'CEP não localizado',
            type: 'danger'
        });
	}
};
function pesquisacep(qCEP) {
	//VARIAVEL "CEP" SOMENTE COM DIGITOS
	var cep = qCEP.replace(/\D/g, '');

	//VERIFICA SE O CAMPO CEP POSSUI VALOR INFORMADO
	if (cep!=="") {
		//EXPRESSAO REGULAR PARA VALIDAR O CEP
		var validacep = /^[0-9]{8}$/;
		//VALIDA O FORMATO DO CEP
		if (validacep.test(cep)) {
			//PREENCHE OS CAMPOS COM "..." ENQUANTO CONSULTA WEBSERVICE
			document.getElementById('txtLOGRADOURO').value = "";
			document.getElementById('txtBAIRRO'    ).value = "";
			document.getElementById('txtCIDADE'    ).value = "";
			document.getElementById('txtUF'        ).value = "";

			//cria um elemento javascript
			var script = document.createElement('script');

			//SINCRONIZA COM O CALLBACK
			script.src = '//viacep.com.br/ws/'+cep+'/json/?callback=cep_callback';

			//INSERE SCRIPT NO DOCUMENTO E CARREGA O CONTEÚDO.
			document.body.appendChild(script);
		} else {
			//CEP É INVÁLIDO.
			//LIMPA_FORMULÁRIO_CEP();
			alert("Formato de CEP inválido.");
		}
	}
};
