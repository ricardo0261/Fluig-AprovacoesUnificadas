$(function(){
	$("document").ready(function() {
		$('#pnlAprovador' ).hide();
		var ATIVIDADE = parseInt(getAtividade());
		if(ATIVIDADE == 5) {
			// AGUARDANDO A TOTVS PARA VER SOLUCAO UPDATECARDDATA
			avisoMODAL('Atenção',['As aprovações deste Workflow devem ser executadas no novo Painel de Aprovações Unificadas'], 'warning');
			//	try {
			//		if(getFormMode()!='VIEW') $('#pnlAprovador' ).show();
			//	} catch (e) {
			//		$('#pnlAprovador' ).show();
			//	}

			$('#pnlAprovacoes').show();
			$('#nomeAprovador').val( getNameUser() );
			$('#txtObservacao').val('');
			$('#rdAprovado-1' )[0].checked=false;
			$('#rdAprovado-2' )[0].checked=false;
			$('#seAprovado'   ).val("nao_confirmado");
		} else
			if(ATIVIDADE <5){
				$('#pnlAprovador' ).hide();
				$('#pnlAprovacoes').hide();
			} else 
				$('#pnlAprovacoes').show();

		// EXIBIR DOCUMENTO ORIGINAL  E AJUSTAR NOME DO FORMULARIO CONFORME OPERACAO
		setTimeout(function() {
			// SEGURANCA OPERACAO
			var operacao = $('#operacao').val();
			if(operacao==null || operacao=='')
				operacao = $('#operacao')[0].innerHTML;

		    // SEGURANCA VALOR NEGATIVO
			if(getFormMode()!='VIEW') 
				formatarValorNegativo();

			// SEGURANCA CODIGO FILIAL
			var cdFilial = $('#cdFilial').val();
			if(cdFilial=='' || isNaN(parseInt(cdFilial))){
				var xFilial = $('#filial').val();
				xFilial = $('#filial').val().substring(0,xFilial.indexOf('-') -1).trim();
				$('#cdFilial').val(xFilial);
				cdFilial=xFilial;
			}

			// SEGURANCA VALOR PARA APROVACAO
		    //var valor = $('#valorSolicitado').val();
			//if(valor=='')
			//	valor = $('#valorSolicitado')[0].innerHTML;
			//if (valor) {
			//	// Remove símbolos e espaços
			//	var valorNum = valor.replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
			//	valorNum = parseFloat(valorNum);
			//	var valorFormatado = 'R$ ' + Math.abs(valorNum).toFixed(2).replace('.', ',');
			//	if (valorNum < 0) {
			//		valorFormatado = '(' + valorFormatado + ')';
			//	}
			//	$('#valorSolicitado').val(valorFormatado);
			//}
			
		    // SEGURANCA NOME FILIAL
			var filial = $('#filial').val();
		    if(filial=='' || filial==null){
				var params = [];
				params.push( DatasetFactory.createConstraint("CODIGO",cdFilial,cdFilial,ConstraintType.MUST) );
				var dsFilial = DatasetFactory.getDataset("ds_Filiais", null, params, null);
				if(dsFilial.values.length >0) {
					filial = dsFilial.values[0]["FILTRO"];
					$('#filial').val(filial);
				}
		    }

			// SEGURANCA CODIGO CENTRO DE CUSTO 90010379 - DIRETORIA HOSPITALAR (OPERACOES)
			if($('#cdCentroCusto').val()=='' || isNaN(parseInt($('#cdCentroCusto').val()))){
				var xCCusto = $('#centroCusto').val();
				xCCusto = $('#centroCusto').val().substring(0,xCCusto.indexOf('-') -1).trim();
				$('#cdCentroCusto').val(xCCusto);
			}

			// MOSTRAR QTDE DE REGISTROS DAS DUAS TABELAS DE APROVACOES E APROVADORES
			var targetAutorizacoes = $('#targetAutorizacoes tbody tr').length -1;
			var targetAprovadores  = $('#targetAprovadores tbody tr' ).length -1;
			$('#lblAprovacoes' )[0].innerHTML = 'APROVAÇÕES ['+targetAutorizacoes+'/'+targetAprovadores+']';
			if(targetAutorizacoes ==targetAprovadores)
				$('#seAprovado').val('Aprovado');

			// BUSCAR DADOS DA SOLICITACAO ORIGINAL
			$('#spDADOS_WF' )[0].innerHTML = operacao.toUpperCase();

			// VERIFICAR SE O DOCUMENTO ORIGINAL EXISTE
			var id = parseFloat($('#orig_documentid').val());
			
			// ALTERAR USUARIO DE ABERTURA DO FLUXO DE ACORDO COM A ABERTURA DO FLUXO DE ORIGEM NO DATASET workflowProcess
			var numChamado = $("#numChamado").val();
			if(numChamado=='' || numChamado==null) 
				numChamado = $("#numChamado")[0].innerHTML;
			
			var numChamadoOrigem = $("#numChamadoOrigem").val();
			if(numChamadoOrigem==null || numChamadoOrigem=='0' || numChamadoOrigem=='')
				numChamadoOrigem = $("#numChamadoOrigem")[0].innerHTML;
			
			if(numChamado==null)
				numChamado=getProcess();
			
			var params = [];
			params.push( DatasetFactory.createConstraint("workflowProcessPK.processInstanceId",numChamado,numChamado,ConstraintType.MUST) );
			var dsProcesso = DatasetFactory.getDataset("workflowProcess", null, params, null);
			var numChamadoOrigem = dsProcesso.values[0]["sourceProcess"];
			$("#numChamadoOrigem").val(numChamadoOrigem);
			$("#numChamadoOrigem")[0].innerHTML = numChamadoOrigem;

			var params = [];
			params.push( DatasetFactory.createConstraint("workflowProcessPK.processInstanceId",numChamadoOrigem,numChamadoOrigem,ConstraintType.MUST) );
			var dsProcessoOrigem = DatasetFactory.getDataset("workflowProcess", null, params, null);
			if(dsProcessoOrigem.values.length > 0){
				// DOCUMENTO ORIGINAL
				var orig_documentId  = dsProcessoOrigem.values[0]["cardDocumentId"];
				var qOrig_documentId = parseInt( $("#orig_documenentid").val());
				if(isNaN(qOrig_documentId)|| qOrig_documentId==0)
					$('#orig_documentid').val( orig_documentId );

				// USUARIO DE CRIACAO
				var usuarioOrigem   = dsProcessoOrigem.values[0]["requesterId"];
				if(usuarioOrigem != null && usuarioOrigem != undefined && usuarioOrigem != ""){
					var params = [];
					params.push( DatasetFactory.createConstraint("colleaguePK.colleagueId",usuarioOrigem,usuarioOrigem,ConstraintType.MUST) );
					var dsColleague = DatasetFactory.getDataset("colleague", null, params, null);
					if(dsColleague.values.length <= 0) {
						throw "### --- Cadastro não encontrado ou usuário bloqueado para "+usuarioOrigem;   
					} else {
						$("#usrCriacao"       ).val( usuarioOrigem );
						$("#nomeCriacao"      ).val( dsColleague.values[0]["colleagueName"] );
						$('#nomeSolicitante'  ).val( dsColleague.values[0]["colleagueName"] );
						$('#emailSolicitante' ).val( dsColleague.values[0]["mail"] );

						// AJUSTE USUARIO EM TELA 12.11.2025
						$("#nomeCriacao"      )[0].innerHTML = dsColleague.values[0]["colleagueName"];
						$('#nomeSolicitante'  )[0].innerHTML = dsColleague.values[0]["colleagueName"];
						$('#emailSolicitante' )[0].innerHTML = dsColleague.values[0]["mail"];
						
						var qData = new Date( dsProcessoOrigem.values[0]["startDateProcess"] );
						var qDataFormatada = pad(qData.getDate()) + '/' + pad(qData.getMonth() + 1) + '/' + qData.getFullYear();
						var qHoraFormatada = pad(qData.getHours()) + ':' + pad(qData.getMinutes()) + ':' + pad(qData.getSeconds());
						var qDataHoraFormatada = qDataFormatada + ' ' + qHoraFormatada;
						$('#dtAberturaChamado').val( qDataHoraFormatada );
					} 
				}
			}
			// BUSCAR DADOS DO DOCUMENTO ORIGINAL
			showDocument($("#orig_documentid").val(), $("#orig_version").val());

		},300);
	});

   $('#rdAprovado-1, #rdAprovado-2').on('click', function() {
      if($("#rdAprovado-1")[0].checked) {
         $('#txtObservacao').val('De acordo com a solicitação.');
         $('#seAprovado').val('Aprovado');
      } else if($("#rdAprovado-2")[0].checked) {
          $('#txtObservacao').val('');
          $('#seAprovado').val('Reprovado');
      } else {
         $('#txtObservacao').val('');
         $('#seAprovado').val('nao_confirmado');
      }
   });
	
	// ADICIONAR FUNCIONALIDADE: Abrir FAQ (prioriza bloco embutido em #faq-md)
	$(document).on('click', '.logo-faq', function(e){
		e.preventDefault();
		// 1) tentar bloco embutido no HTML
		try{
			var embedded = $('#faq-md');
			if(embedded && embedded.length > 0){
				var md = embedded.text();
				if(md && md.trim().length > 0){
					var html = markdownToHtml(md);
					var content = getFaqModalContent(html);
					FLUIGC.modal({ title: 'FAQ - Aprovação Unificada', content: content, id: 'faq-modal', size: 'full', actions: [ { 'label': 'Fechar', 'autoClose': true } ] }, function(err, data){ if(err) console.log(err); });
					return;
				}
			}
		} catch(e){ console.warn('Erro lendo bloco embutido FAQ:', e); }

		// 2) fallback: tentar múltiplos caminhos via AJAX
		var candidates = [];
		var scriptTag = $('script[src*="custom/custom.js"]').last();
		if(scriptTag.length){
			var src = scriptTag.attr('src');
			var dir = src.replace(/\/[^\/]*$/, '/');
			candidates.push(dir + 'FAQ.md');
		}
		candidates.push('custom/FAQ.md');
		try{ var basePath = window.location.pathname.replace(/\/[^\/]*$/, '/'); candidates.push(basePath + 'custom/FAQ.md'); } catch(e){}

		var tried = 0;
		function tryNext(){
			if(tried >= candidates.length){
				avisoMODAL('Erro', 'Não foi possível carregar o FAQ. Favor contatar o suporte.','danger');
				console.error('Erro ao carregar FAQ: todos os caminhos tentados falharam', candidates);
				return;
			}
			var path = candidates[tried++];
			$.ajax({ url: path, dataType: 'text', cache: false,
				success: function(md){
					var html = markdownToHtml(md);
					var content = getFaqModalContent(html);
					FLUIGC.modal({ title: 'FAQ - Aprovação Unificada', content: content, id: 'faq-modal', size: 'full', actions: [ { 'label':'Fechar','autoClose':true } ] }, function(err){ if(err) console.log(err); });
				},
				error: function(xhr, status, err){
					console.warn('Falha ao carregar FAQ em', path, 'status:', xhr && xhr.status, xhr && xhr.statusText);
					tryNext();
				}
			});
		}
		tryNext();
	});
	
	// Conversor Markdown minimalista: cobre títulos (#), parágrafos, listas e code blocks simples
	function markdownToHtml(md){
	    if(!md) return '';
	    console.log('Markdown original length:', md.length);
	    
	    // Escapar HTML básico
	    var text = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	
	    var lines = text.split(/\r?\n/);
	    var out = [];
	    var inList = false;
	    var inCodeBlock = false;
	    
	    for(var i=0;i<lines.length;i++){
	        var line = lines[i];
	        
	        // Pular linhas vazias múltiplas
	        if(/^\s*$/.test(line)){
	            if(inList){ out.push('</ul>'); inList=false; }
	            continue;
	        }
	        
	        // Code block toggle
	        if(/^```/.test(line)){
	            if(inCodeBlock){
	                out.push('</code></pre>');
	                inCodeBlock = false;
	            } else {
	                if(inList){ out.push('</ul>'); inList=false; }
	                out.push('<pre><code>');
	                inCodeBlock = true;
	            }
	            continue;
	        }
	        
	        // Se dentro de code block, adicionar linha direto
	        if(inCodeBlock){
	            out.push(line);
	            continue;
	        }
	        
	        // Headers (melhorado para capturar ## com emojis)
	        var h = line.match(/^#{1,6}\s+(.*)/);
	        if(h){ 
	            if(inList){ out.push('</ul>'); inList=false; }
	            var level = (line.match(/^#+/) || [''])[0].length;
	            var title = h[1];
	            out.push('<h'+level+'>'+title+'</h'+level+'>'); 
	            continue; 
	        }
	        
	        // Unordered list
	        var li = line.match(/^\s*[-*+]\s+(.*)/);
	        if(li){ 
	            if(!inList){ out.push('<ul>'); inList=true; } 
	            out.push('<li>'+li[1]+'</li>'); 
	            continue; 
	        }
	        
	        // Close list if not list item
	        if(inList){ out.push('</ul>'); inList=false; }
	        
	        // Inline formatting
	        var inline = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
	                         .replace(/\*(.*?)\*/g, '<em>$1</em>');
	        
	        // Links
	        inline = inline.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
	        
	        // Horizontal rule
	        if(/^---+$/.test(line.trim())){
	            out.push('<hr>');
	            continue;
	        }
	        
	        // Paragraphs
	        if(inline.trim() !== ''){
	            out.push('<p>'+inline+'</p>');
	        }
	    }
	    
	    if(inList) out.push('</ul>');
	    if(inCodeBlock) out.push('</code></pre>');
	    
	    var result = out.join('\n');
	    console.log('HTML convertido length:', result.length);
	    console.log('Primeiros 500 chars:', result.substring(0, 500));
	    
	    return result;
	}


// Gera o HTML do modal do FAQ com CSS inline para garantir estilo consistente
function getFaqModalContent(innerHtml){
	var css = '<style>' +
		// Estilos gerais do container
		'.faq-modal-container{ font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color:#333; line-height: 1.6; }' +
		
		// Cabeçalho do FAQ
		'.faq-header { background: linear-gradient(135deg, #35b1a7 0%, #2a9389 100%); color: white; padding: 20px; margin: -15px -15px 20px -15px; border-radius: 8px 8px 0 0; }' +
		'.faq-title { font-size: 24px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 10px; }' +
		'.faq-subtitle { font-size: 14px; opacity: 0.9; margin: 8px 0 0 0; }' +
		
		// Campo de busca
		'.faq-search { margin: 20px 0; position: relative; }' +
		'.faq-search input { width: 100%; padding: 12px 45px 12px 15px; border: 2px solid #e0e0e0; border-radius: 25px; font-size: 16px; outline: none; transition: border-color 0.3s; }' +
		'.faq-search input:focus { border-color: #35b1a7; box-shadow: 0 0 0 3px rgba(53, 177, 167, 0.1); }' +
		'.faq-search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #666; font-size: 18px; }' +
		
		// Categorias/filtros
		'.faq-categories { margin: 20px 0; display: flex; flex-wrap: wrap; gap: 8px; }' +
		'.faq-category-btn { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s; font-size: 14px; }' +
		'.faq-category-btn:hover, .faq-category-btn.active { background: #35b1a7; color: white; border-color: #35b1a7; }' +
		
		// Itens do FAQ
		'.faq-items { margin-top: 20px; }' +
		'.faq-item { background: white; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px; overflow: hidden; transition: all 0.3s; }' +
		'.faq-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }' +
		'.faq-question { padding: 16px 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; background: #f8f9fa; font-weight: 500; transition: background 0.3s; }' +
		'.faq-question:hover { background: #e9ecef; }' +
		'.faq-question.active { background: #35b1a7; color: white; }' +
		'.faq-icon { font-size: 18px; color: #35b1a7; min-width: 20px; }' +
		'.faq-question.active .faq-icon { color: white; }' +
		'.faq-text { flex: 1; font-size: 16px; }' +
		'.faq-arrow { font-size: 14px; transition: transform 0.3s; }' +
		'.faq-question.active .faq-arrow { transform: rotate(180deg); color: white; }' +
		'.faq-answer { padding: 0; background: white; max-height: 0; overflow: hidden; transition: all 0.4s ease; }' +
		'.faq-answer.open { max-height: 1000px; padding: 20px; }' +
		
		// Conteúdo das respostas
		'.faq-modal-container h1, .faq-modal-container h2, .faq-modal-container h3 { color:#35b1a7; margin: 20px 0 12px 0; font-weight: 600; }' +
		'.faq-modal-container h1 { font-size: 22px; }' +
		'.faq-modal-container h2 { font-size: 20px; }' +
		'.faq-modal-container h3 { font-size: 18px; }' +
		'.faq-modal-container p { margin: 12px 0; }' +
		'.faq-modal-container ul { margin: 12px 0 12px 20px; }' +
		'.faq-modal-container li { margin: 6px 0; }' +
		'.faq-modal-container strong { color: #2a9389; }' +
		'.faq-modal-container pre { background:#f6f8fa; padding:15px; border-radius:6px; overflow:auto; margin: 15px 0; border-left: 4px solid #35b1a7; }' +
		'.faq-modal-container code { background:#f1f1f1; padding:3px 6px; border-radius:3px; font-family: "Courier New", monospace; }' +
		'.faq-modal-container a { color:#35b1a7; text-decoration:none; font-weight: 500; }' +
		'.faq-modal-container a:hover { text-decoration: underline; }' +
		'.faq-modal-container hr { border: none; border-top: 2px solid #e0e0e0; margin: 25px 0; }' +
		
		// Elementos especiais
		'.highlight-box { background: #e8f5f3; border-left: 4px solid #35b1a7; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; }' +
		'.warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; color: #856404; }' +
		'.tip-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; color: #0c5460; }' +
		
		// Container do modal
		'.faq-modal-body { max-height:75vh; overflow:auto; padding:0; }' +
		'.faq-content { padding: 15px; }' +
		
		// Responsividade
		'@media (max-width: 768px) {' +
			'.faq-categories { justify-content: center; }' +
			'.faq-category-btn { font-size: 13px; padding: 6px 12px; }' +
			'.faq-question { padding: 14px 16px; font-size: 15px; }' +
			'.faq-text { font-size: 15px; }' +
			'.faq-title { font-size: 20px; }' +
		'}' +
		
		// Scrollbar customizada
		'.faq-modal-body::-webkit-scrollbar { width: 8px; }' +
		'.faq-modal-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }' +
		'.faq-modal-body::-webkit-scrollbar-thumb { background: #35b1a7; border-radius: 4px; }' +
		'.faq-modal-body::-webkit-scrollbar-thumb:hover { background: #2a9389; }' +
	'</style>';

	// Processar o HTML para criar estrutura interativa
	var processedHtml = processQuestionsToAccordion(innerHtml);
	
	// Fallback se não conseguiu processar as perguntas
	if (!processedHtml || processedHtml.trim() === '') {
		console.log('Usando fallback manual...');
		processedHtml = getFallbackFAQContent();
	}
	
	return css + '<div class="faq-modal-container">' +
		'<div class="faq-header">' +
			'<div class="faq-title"><i class="fa fa-question-circle"></i> Central de Ajuda - Aprovações Unificadas</div>' +
			'<div class="faq-subtitle">Encontre respostas rápidas para suas dúvidas mais frequentes</div>' +
		'</div>' +
		'<div class="faq-content">' +
			'<div class="faq-search">' +
				'<input type="text" id="faqSearchInput" placeholder="🔍 Digite palavras-chave para encontrar sua dúvida..." onkeyup="filterFAQItems(this.value)">' +
				'<i class="fa fa-search faq-search-icon"></i>' +
			'</div>' +
			'<div class="faq-categories">' +
				'<button class="faq-category-btn active" onclick="filterByCategory(\'all\', this)">📋 Todas</button>' +
				'<button class="faq-category-btn" onclick="filterByCategory(\'como-funciona\', this)">⚙️ Como Funciona</button>' +
				'<button class="faq-category-btn" onclick="filterByCategory(\'aprovacao\', this)">✅ Aprovação</button>' +
				'<button class="faq-category-btn" onclick="filterByCategory(\'problemas\', this)">⚠️ Problemas</button>' +
				'<button class="faq-category-btn" onclick="filterByCategory(\'suporte\', this)">🆘 Suporte</button>' +
			'</div>' +
			'<div class="faq-items">' + processedHtml + '</div>' +
		'</div>' +
	'</div>';
}

// Função para processar perguntas em formato accordion
function processQuestionsToAccordion(html) {
	// Debug - verificar o HTML recebido
	console.log('HTML recebido:', html.substring(0, 500));
	
	// Extrair perguntas baseadas em h2 (melhorada)
	var sections = html.split(/(<h2[^>]*>.*?<\/h2>)/gi);
	var processedItems = '';
	
	for (var i = 1; i < sections.length; i += 2) {
		if (i + 1 < sections.length) {
			var questionHtml = sections[i];
			var answerHtml = sections[i + 1];
			
			// Extrair texto da pergunta
			var questionMatch = questionHtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
			if (!questionMatch) continue;
			
			var question = questionMatch[1].trim().replace(/\*\*/g, '').replace(/🤔|📝|👥|📜|🚫|⏰|👀|❌|🤷|💱|🆘|📞/g, '').trim();
			var category = getCategoryFromQuestion(question);
			var icon = getIconFromQuestion(question);
			
			// Limpar a resposta (remover h2 se houver)
			var cleanAnswer = answerHtml.replace(/<h2[^>]*>.*?<\/h2>/gi, '').trim();
			
			processedItems += 
				'<div class="faq-item" data-category="' + category + '">' +
					'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
						'<i class="fa ' + icon + ' faq-icon"></i>' +
						'<span class="faq-text">' + question + '</span>' +
						'<i class="fa fa-chevron-down faq-arrow"></i>' +
					'</div>' +
					'<div class="faq-answer">' +
						'<div class="answer-content">' + cleanAnswer + '</div>' +
					'</div>' +
				'</div>';
		}
	}
	
	// Se não encontrou nada com h2, tentar método alternativo
	if (processedItems === '') {
		console.log('Tentando método alternativo...');
		var lines = html.split('\n');
		var currentQuestion = '';
		var currentAnswer = '';
		var inAnswer = false;
		
		for (var j = 0; j < lines.length; j++) {
			var line = lines[j].trim();
			
			// Detectar pergunta (linha que contém **)
			if (line.includes('**') && (line.includes('?') || line.includes('funciona') || line.includes('como') || line.includes('que') || line.includes('por'))) {
				// Salvar pergunta anterior se existir
				if (currentQuestion && currentAnswer) {
					var category = getCategoryFromQuestion(currentQuestion);
					var icon = getIconFromQuestion(currentQuestion);
					processedItems += 
						'<div class="faq-item" data-category="' + category + '">' +
							'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
								'<i class="fa ' + icon + ' faq-icon"></i>' +
								'<span class="faq-text">' + currentQuestion + '</span>' +
								'<i class="fa fa-chevron-down faq-arrow"></i>' +
							'</div>' +
							'<div class="faq-answer">' +
								'<div class="answer-content">' + currentAnswer + '</div>' +
							'</div>' +
						'</div>';
				}
				
				// Nova pergunta
				currentQuestion = line.replace(/\*\*/g, '').replace(/##/g, '').replace(/🤔|📝|👥|📜|🚫|⏰|👀|❌|🤷|💱|🆘|📞/g, '').trim();
				currentAnswer = '';
				inAnswer = true;
			} else if (inAnswer && line !== '') {
				currentAnswer += '<p>' + line + '</p>';
			}
		}
		
		// Adicionar última pergunta
		if (currentQuestion && currentAnswer) {
			var category = getCategoryFromQuestion(currentQuestion);
			var icon = getIconFromQuestion(currentQuestion);
			processedItems += 
				'<div class="faq-item" data-category="' + category + '">' +
					'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
						'<i class="fa ' + icon + ' faq-icon"></i>' +
						'<span class="faq-text">' + currentQuestion + '</span>' +
						'<i class="fa fa-chevron-down faq-arrow"></i>' +
					'</div>' +
					'<div class="faq-answer">' +
						'<div class="answer-content">' + currentAnswer + '</div>' +
					'</div>' +
				'</div>';
		}
	}
	
	console.log('Itens processados:', processedItems.length);
	return processedItems;
}

// Determinar categoria baseada na pergunta
function getCategoryFromQuestion(question) {
	question = question.toLowerCase();
	if (question.includes('funciona') || question.includes('sistema') || question.includes('automático')) {
		return 'como-funciona';
	} else if (question.includes('aprovar') || question.includes('aprovação') || question.includes('tempo')) {
		return 'aprovacao';
	} else if (question.includes('erro') || question.includes('bloqueada') || question.includes('problema')) {
		return 'problemas';
	} else if (question.includes('suporte') || question.includes('chamado') || question.includes('dúvida')) {
		return 'suporte';
	}
	return 'geral';
}

// Obter ícone baseado na pergunta
function getIconFromQuestion(question) {
	question = question.toLowerCase();
	if (question.includes('funciona') || question.includes('sistema')) return 'fa-cogs';
	if (question.includes('quem') || question.includes('aprovador')) return 'fa-users';
	if (question.includes('carta') || question.includes('exceção')) return 'fa-certificate';
	if (question.includes('próprio') || question.includes('conflito')) return 'fa-user-times';
	if (question.includes('tempo') || question.includes('quanto')) return 'fa-clock-o';
	if (question.includes('acompanhar') || question.includes('status')) return 'fa-eye';
	if (question.includes('bloqueada') || question.includes('erro')) return 'fa-exclamation-triangle';
	if (question.includes('nome') || question.includes('apareceu')) return 'fa-user-plus';
	if (question.includes('moeda') || question.includes('conversão')) return 'fa-calculator';
	if (question.includes('suporte') || question.includes('chamado')) return 'fa-life-ring';
	if (question.includes('dúvida') || question.includes('encontrou')) return 'fa-question-circle';
	return 'fa-info-circle';
}

// Formatar conteúdo da resposta
function formatAnswerContent(content) {
	// Processar markdown básico
	content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
	
	// Processar listas
	content = content.replace(/^- (.+)/gm, '<li>$1</li>');
	content = content.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
	
	// Processar parágrafos
	content = content.replace(/\n\n/g, '</p><p>');
	content = '<p>' + content + '</p>';
	
	// Limpar tags vazias
	content = content.replace(/<p><\/p>/g, '');
	content = content.replace(/<p>\s*<ul>/g, '<ul>');
	content = content.replace(/<\/ul>\s*<\/p>/g, '</ul>');
	
	return content;
}

// Função fallback com conteúdo manual
function getFallbackFAQContent() {
	return '<div class="faq-item" data-category="como-funciona">' +
		'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
			'<i class="fa fa-cogs faq-icon"></i>' +
			'<span class="faq-text">Como funciona o sistema de aprovações?</span>' +
			'<i class="fa fa-chevron-down faq-arrow"></i>' +
		'</div>' +
		'<div class="faq-answer">' +
			'<div class="answer-content">' +
				'<p>O sistema <strong>automaticamente identifica</strong> quem precisa aprovar sua solicitação com base em:</p>' +
				'<ul>' +
					'<li><strong>Valor da solicitação:</strong> Quanto maior o valor, mais níveis de aprovação</li>' +
					'<li><strong>Tipo de solicitação:</strong> Reembolso, adiantamento, pagamento, etc.</li>' +
					'<li><strong>Centro de custo:</strong> Cada área tem seus aprovadores específicos</li>' +
					'<li><strong>Filial:</strong> Aprovadores locais e regionais</li>' +
				'</ul>' +
				'<p><strong>Você não precisa escolher os aprovadores</strong> - o sistema faz isso automaticamente!</p>' +
			'</div>' +
		'</div>' +
	'</div>' +
	
	'<div class="faq-item" data-category="aprovacao">' +
		'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
			'<i class="fa fa-users faq-icon"></i>' +
			'<span class="faq-text">Quem pode aprovar minha solicitação?</span>' +
			'<i class="fa fa-chevron-down faq-arrow"></i>' +
		'</div>' +
		'<div class="faq-answer">' +
			'<div class="answer-content">' +
				'<p>Apenas pessoas <strong>previamente cadastradas nas regras de aprovação</strong> podem aprovar sua solicitação.</p>' +
				'<p>Os aprovadores são definidos automaticamente considerando:</p>' +
				'<ul>' +
					'<li><strong>Classe de Valor:</strong> Limites de aprovação por valor</li>' +
					'<li><strong>Centro de Custo:</strong> Gestores da sua área</li>' +
					'<li><strong>Filial:</strong> Responsáveis locais</li>' +
					'<li><strong>Tipo de Solicitação:</strong> Especialistas em cada tipo de processo</li>' +
				'</ul>' +
			'</div>' +
		'</div>' +
	'</div>' +
	
	'<div class="faq-item" data-category="problemas">' +
		'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
			'<i class="fa fa-exclamation-triangle faq-icon"></i>' +
			'<span class="faq-text">Por que minha solicitação foi bloqueada com erro?</span>' +
			'<i class="fa fa-chevron-down faq-arrow"></i>' +
		'</div>' +
		'<div class="faq-answer">' +
			'<div class="answer-content">' +
				'<p><strong>Principais causas de erro:</strong></p>' +
				'<ul>' +
					'<li><strong>Valor inválido:</strong> Campo "Valor" está vazio, zerado ou com formato incorreto</li>' +
					'<li><strong>Aprovador não encontrado:</strong> Não há aprovador cadastrado para sua Classe de Valor ou Centro de Custo</li>' +
					'<li><strong>Usuário bloqueado:</strong> Aprovador está inativo no sistema ou com cadastro duplicado</li>' +
					'<li><strong>Dados incompletos:</strong> Filial ou Centro de Custo não foram informados corretamente</li>' +
				'</ul>' +
				'<p><strong>O que fazer:</strong> Anote a mensagem de erro e o número do processo, depois abra um chamado no ISM.</p>' +
			'</div>' +
		'</div>' +
	'</div>' +
	
	'<div class="faq-item" data-category="suporte">' +
		'<div class="faq-question" onclick="toggleFAQAccordion(this)">' +
			'<i class="fa fa-life-ring faq-icon"></i>' +
			'<span class="faq-text">Como abrir um chamado de suporte?</span>' +
			'<i class="fa fa-chevron-down faq-arrow"></i>' +
		'</div>' +
		'<div class="faq-answer">' +
			'<div class="answer-content">' +
				'<p><strong>Caminho no ISM:</strong></p>' +
				'<p>SM → Tecnologia da Informação → Sistemas Corporativos → Fluig → Reportar Problemas</p>' +
				'<p><strong>Informações essenciais para incluir:</strong></p>' +
				'<ul>' +
					'<li><strong>Número do processo:</strong> Encontre no campo "Nº WF Aprovação"</li>' +
					'<li><strong>Mensagem de erro:</strong> Copie o texto completo do erro</li>' +
					'<li><strong>Print da tela:</strong> Anexe imagem mostrando o problema</li>' +
					'<li><strong>Dados do processo:</strong> Valor, Centro de Custo, Filial, Tipo de Solicitação</li>' +
				'</ul>' +
				'<p><strong>Tempo de resposta:</strong> Chamados são atendidos em até 24 horas úteis.</p>' +
			'</div>' +
		'</div>' +
	'</div>';
}
});
function observacaoAPV(qRESULT){
	if(qRESULT=='sim')
		$('#txtObservacao').val('De acordo com a solicitação.');
	else
		$('#txtObservacao').val('');
}

function showDocument(qDocumentID,qVersion) {
	if(parseFloat(qDocumentID) <=0 )
		return false;
	
	// MOSTRAR DOCTO ORIGINAL
   var paramDOC = new Array();
	   paramDOC.push(DatasetFactory.createConstraint("activeVersion"        ,true       ,true       ,ConstraintType.MUST));
	   paramDOC.push(DatasetFactory.createConstraint("documentPK.documentId",qDocumentID,qDocumentID,ConstraintType.MUST));
   var dsDOC = DatasetFactory.getDataset("document", null, paramDOC, null);
   qVersion = dsDOC.values[0]['documentPK.version'];
	
   var xContent = '<iframe id="imgVIEWER" src="/webdesk/streamcontrol/0/' + qDocumentID + '/' + qVersion + '/" width="100%" height="500px" frameborder="0"></iframe>';
   $('#divDocument').html(xContent);
}

function openDocument() {
   var id             = $("#orig_documentid").val(),    
       version        = $("#orig_version").val() ? $("#orig_version").val() : "1000",
       docSolicitacao = $("#orig_docSolicitacao").val() ? $("#orig_docSolicitacao").val() : "Documento";

   if(id == undefined || id == null) {
      avisoMODAL('Atenção', 'Documento não encontrado. Favor acionar o suporte.', 'danger');
      return false;
   }
   
   // CARREGAR DOCUMENTO
   var xContent = '<iframe id="imgVIEWER" src="/webdesk/streamcontrol/0/' + id + '/' + version + '/" width="100%" height="100%" frameborder="0"></iframe>';
   FLUIGC.toast({title: 'Aguarde...', message: 'Buscando documento...', type: 'info'});
   var myModalDocto = FLUIGC.modal({
      title   : "Visualizar: " + docSolicitacao,
      content : xContent,
      id      : 'fluig-document',
      size    : 'full',
      actions : [{
         'label': 'Voltar',
         'autoClose': true
      }]
   }, function(err, data) {
      if(err) 
         console.log(err)
   });
}


function MostrarOcultarDIV(valor) {
	var buscaDiv = document.getElementById(valor);
	if (buscaDiv.style.display == 'none') 
		buscaDiv.style.display = 'block';
	else
		buscaDiv.style.display = 'none';
}

function openDocumentBySolicitacao(qSOLICITACAO) {
    // LOCALIZAR O ID NO DATASET PROCES_WORKFLOW
    fluigc.toast({title: 'Aguarde...', message: 'Buscando documento...', type: 'info'});

    var qEMPRESA = getValue("WKCompany");

    var param = new Array();
        param.push(DatasetFactory.createConstraint("COD_EMPRESA",qEMPRESA    ,qEMPRESA    ,ConstraintType.MUST));
        param.push(DatasetFactory.createConstraint("NUM_PROCES" ,qSOLICITACAO,qSOLICITACAO,ConstraintType.MUST));
    var ds = DatasetFactory.getDataset("PROCES_WORKFLOW", null, param, null);
    var id = ds.values[0]['NR_DOCUMENTO_CARD'];

    var paramDOC = new Array();
        paramDOC.push(DatasetFactory.createConstraint("activeVersion"        ,true,true,ConstraintType.MUST));
        paramDOC.push(DatasetFactory.createConstraint("documentPK.documentId",id  ,id  ,ConstraintType.MUST));
    var dsDOC   = DatasetFactory.getDataset("document", null, paramDOC, null);
    var version = dsDOC.values[0]['documentPK.version']; 
 
    var xContent = '<iframe id="imgVIEWER" src="/webdesk/streamcontrol/0/' + id + '/' + version + '/" width="100%" height="350px" frameborder="0" style="center no-repeat;"></iframe>';
    var myModalDocto = FLUIGC.modal({
       title   : "Visualizar: " + qSOLICITACAO,
       content : xContent,
       id      : 'fluig-document',
       size    : 'full',
       actions : [{
          'label': 'Voltar',
          'autoClose': true
       }]
    }, function(err, data) {
       if(err) 
          console.log(err)
    });
 }
 
 function pad(num) {
    var numRet = num;
    if(parseInt(num) <= 9) 
       numRet = "0" + num;
    return numRet;
 }

function formatarValorNegativo() {
    var campoValor = document.getElementById('valorSolicitado');
    
    if (campoValor) {
        var valor = campoValor.value;
        if( valor ==undefined || valor=='')
        	valor = campoValor.innerText;
        
        // Remove formatação existente (R$, pontos de milhar) para verificar o número
        // Adapte essa lógica se o valor vier com outros formatos (ex: vírgula como decimal)
        var valorNumerico = parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.'));

        if (!isNaN(valorNumerico) && valorNumerico < 0) {
            // Remove o sinal negativo e adiciona parênteses
            var valorAbsoluto = Math.abs(valorNumerico);
            // Formata de volta para o padrão brasileiro, se necessário, ou mantenha simples
            // Esta é uma formatação simples. Para formatação monetária complexa, considere bibliotecas.
            campoValor.value = '(' + valorAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ')';
        } else if (!isNaN(valorNumerico)) {
            // Se for positivo ou zero, apenas garante a formatação padrão (opcional)
            campoValor.value = valorNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        // Se o valor original não for um número válido ou já estiver formatado, pode não fazer nada ou tratar o erro.
    }
}

// Funções para interatividade do FAQ
window.toggleFAQAccordion = function(element) {
	var answer = element.nextElementSibling;
	var arrow = element.querySelector('.faq-arrow');
	var question = element;
	
	// Fechar outros itens abertos (comportamento accordion)
	var allItems = document.querySelectorAll('.faq-item');
	allItems.forEach(function(item) {
		if (item !== element.parentElement) {
			var otherAnswer = item.querySelector('.faq-answer');
			var otherArrow = item.querySelector('.faq-arrow');
			var otherQuestion = item.querySelector('.faq-question');
			if (otherAnswer && otherAnswer.classList.contains('open')) {
				otherAnswer.classList.remove('open');
				otherArrow.className = 'fa fa-chevron-down faq-arrow';
				otherQuestion.classList.remove('active');
			}
		}
	});
	
	// Toggle do item atual
	if (answer.classList.contains('open')) {
		answer.classList.remove('open');
		arrow.className = 'fa fa-chevron-down faq-arrow';
		question.classList.remove('active');
	} else {
		answer.classList.add('open');
		arrow.className = 'fa fa-chevron-up faq-arrow';
		question.classList.add('active');
	}
};

window.filterByCategory = function(category, buttonElement) {
	// Atualizar botões ativos
	var buttons = document.querySelectorAll('.faq-category-btn');
	buttons.forEach(function(btn) {
		btn.classList.remove('active');
	});
	buttonElement.classList.add('active');
	
	// Filtrar itens
	var items = document.querySelectorAll('.faq-item');
	items.forEach(function(item) {
		if (category === 'all' || item.dataset.category === category) {
			item.style.display = 'block';
		} else {
			item.style.display = 'none';
		}
	});
	
	// Limpar busca
	var searchInput = document.getElementById('faqSearchInput');
	if (searchInput) {
		searchInput.value = '';
	}
};

window.filterFAQItems = function(searchTerm) {
	searchTerm = searchTerm.toLowerCase();
	var items = document.querySelectorAll('.faq-item');
	var hasResults = false;
	
	items.forEach(function(item) {
		var question = item.querySelector('.faq-text').textContent.toLowerCase();
		var answer = item.querySelector('.answer-content').textContent.toLowerCase();
		
		if (question.includes(searchTerm) || answer.includes(searchTerm)) {
			item.style.display = 'block';
			hasResults = true;
		} else {
			item.style.display = 'none';
		}
	});
	
	// Se há busca ativa, remover filtro de categoria
	if (searchTerm) {
		var buttons = document.querySelectorAll('.faq-category-btn');
		buttons.forEach(function(btn) {
			btn.classList.remove('active');
		});
	}
	
	// Mostrar mensagem se não há resultados (opcional)
	// Você pode implementar uma div de "nenhum resultado encontrado" se desejar
};
