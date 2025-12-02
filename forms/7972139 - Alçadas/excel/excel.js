var tbFluig = '';

function Upload(qTabela) {
    // PEDIR CONFIRMACAO DO USUARIO PARA EXECUTAR O UPLOAD PQ OS DADOS ATUAIS SERAO APAGADOS 
    FLUIGC.message.confirm({
        message: 'Atenção! Você tem certeza que deseja fazer o upload do arquivo? Os dados atuais serão apagados.',
        title: 'Upload de Arquivo Excel',
        labelYes: 'Sim',
        labelNo: 'Não',
        closeOnEscape: true,
    }, function (result, el, ev) {
        // SE O USUARIO CONFIRMAR O UPLOAD, CHAMAR A FUNCAO PARA PROCESSAR O ARQUIVO
        if (result) {
            FLUIGC.toast({
                message: 'Processando arquivo Excel...',
                type: 'info'
            });

            // REFERENCE THE FILEUPLOAD ELEMENT.
            var fileUpload = document.getElementById("fileUpload");
            tbFluig = qTabela;

            // VALIDATE WHETHER FILE IS VALID EXCEL FILE.
            var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
            if (regex.test(fileUpload.value.toLowerCase()))
                if (typeof (FileReader) != "undefined") {
                    var reader = new FileReader();
                    // FOR BROWSERS OTHER THAN IE.
                    if (reader.readAsBinaryString) {
                        reader.onload = function (e) {
                            ProcessExcel(e.target.result);
                        };
                        reader.readAsBinaryString(fileUpload.files[0]);
                    } else {
                        // FOR IE BROWSER.
                        reader.onload = function (e) {
                            var data = "";
                            var bytes = new Uint8Array(e.target.result);
                            for (var i = 0; i < bytes.byteLength; i++) {
                                data += String.fromCharCode(bytes[i]);
                            }
                            FLUIGC.toast({
                                message: 'Processando arquivo Excel...',
                                type: 'info'
                            });
                            setTimeout(function () {
                                ProcessExcel(data);
                            }, 1000);
                        };
                        reader.readAsArrayBuffer(fileUpload.files[0]);
                    }
                } else
                    FLUIGC.toast({
                        message: 'Este navegador não suporta HTML5',
                        type: 'danger'
                    })
            else
                FLUIGC.toast({
                    message: 'Arquivo selecionado não é do tipo Excel valido',
                    type: 'danger'
                });
        }
    });
}

function ProcessExcel(data) {
    var MSG = [];

    // Ler os dados do arquivo Excel
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    // Obter o nome da primeira planilha
    var firstSheet = workbook.SheetNames[0];
    var sheet = workbook.Sheets[firstSheet];

    // Definir o número de linhas e colunas
    var linhas = sheet['!ref'].split(':')[1].match(/\d+/)[0];
    var colunas = sheet['!ref'].split(':')[1].match(/[A-Z]+/)[0].charCodeAt(0) - 64;
    var niveis = colunas - 3;

    // LIMPAR TABELA
    if (tbFluig == 'tbAlcadas')
        $('table[tablename=tbAlcadas] tbody tr').not(':first').remove();

    // Carregar dados e gravar tabela fazendo o de/para com os campos do formulário HTML
    var excelRows = [];
    for (var iLn = 2; iLn <= linhas; iLn++) {
        var row = {};
        row['nivel'] = sheet[XLSX.utils.encode_col(0) + iLn] ? sheet[XLSX.utils.encode_col(0) + iLn].v : '';
        row['tipoAprovacao'] = sheet[XLSX.utils.encode_col(1) + iLn] ? sheet[XLSX.utils.encode_col(1) + iLn].v : '';

        // USAR ESTE SE PLANILHA FOR POR CENTRO DE CUSTO OU ADIANTAMENTO/REEMBOLSO OPEX 
        if (row['tipoAprovacao'     ] == 'Centro de Custo'             || row['tipoAprovacao'] == 'CC' || 
            row['tipoAprovacao'     ] == 'Adiantamento/Reembolso Opex' || row['tipoAprovacao'] == 'AR') {
            row['zoomCentroCusto_Id'] = sheet[XLSX.utils.encode_col(2) + iLn] ? sheet[XLSX.utils.encode_col(2) + iLn].v : '';
            row['zoomCentroCusto'   ] = sheet[XLSX.utils.encode_col(3) + iLn] ? sheet[XLSX.utils.encode_col(3) + iLn].v : '';
        }

        // USAR ESTE SE PLANILHA FOR POR FILIAL ou ADIANTAMENTO/REEMBOLSO OPEX
        if (row['tipoAprovacao'] == 'Filial' || row['tipoAprovacao'] == 'FL' || 
            row['tipoAprovacao'] == 'Adiantamento/Reembolso Opex' || row['tipoAprovacao'] == 'AR') {
            row['zoomFilial'   ] = sheet[XLSX.utils.encode_col(4) + iLn] ? sheet[XLSX.utils.encode_col(4) + iLn].v : '';
            row['zoomFilial_Id'] = sheet[XLSX.utils.encode_col(5) + iLn] ? sheet[XLSX.utils.encode_col(5) + iLn].v : '';
        }

        // USAR ESTE SE PLANILHA FOR POR CLASSE DE VALOR
        if (row['tipoAprovacao'     ] == 'Classe de Valor' || row['tipoAprovacao'] == 'CV') {
            row['zoomClasseValor'   ] = sheet[XLSX.utils.encode_col(6) + iLn] ? sheet[XLSX.utils.encode_col(6) + iLn].v : '';
            row['zoomClasseValor_Id'] = sheet[XLSX.utils.encode_col(7) + iLn] ? sheet[XLSX.utils.encode_col(7) + iLn].v : '';
        }

        // USUARIO APROVADOR
        row['Aprovador'   ] = sheet[XLSX.utils.encode_col(8) + iLn] ? sheet[XLSX.utils.encode_col(8) + iLn].v : '';
        row['Aprovador_Id'] = sheet[XLSX.utils.encode_col(9) + iLn] ? sheet[XLSX.utils.encode_col(9) + iLn].v : '';

        excelRows.push(row);
    }

    // PREENCHER TABELA COM DADOS DO EXCEL
    for (var i = 0; i < excelRows.length; i++) {
      if (excelRows[i]['nivel'] !== '' && excelRows[i]['nivel'] !== undefined && excelRows[i]['nive'] !== null) {
         // INSERIR LINHA NA TABELA
         var index = wdkAddChild(tbFluig);
         console.log('index: ' + index);

         // NIVEL DE APROVACAO - SEQUENCIA
         $('#aprovadorNivel___' + index).val(excelRows[i]['nivel']);

         // TIPO DE APROVACAO
         var tipoAprovacao = '';
         switch (excelRows[i]['tipoAprovacao']) {
            case 'Centro de Custo':
               // CENTRO DE CUSTO CONF NIVEL
               tipoAprovacao = 'CC';
               $('#zoomCentroCusto___' + index).val(excelRows[i]['zoomCentroCusto']);
               window['zoomCentroCusto___' + index].setValue(excelRows[i]['zoomCentroCusto']);
               $('#zoomCentroCusto_Id___' + index).val(excelRows[i]['zoomCentroCusto_Id']);
               break;

            case 'Suprimentos':
               tipoAprovacao = 'SP';
               break;

            case 'Filial':
               // FILIAL CONF NIVEL
               tipoAprovacao = 'FL';
               $('#zoomFilial___' + index).val(excelRows[i]['zoomFilial']);
               window['zoomFilial___' + index].setValue(excelRows[i]['zoomFilial']);
               $('#zoomFilial_Id___' + index).val(excelRows[i]['zoomFilial_Id']);
               break;

            case 'Classe de Valor':
            case 'CV':
               // CLASSE DE VALOR
               tipoAprovacao = 'CV';
               $('#zoomClasseValor___' + index).val(excelRows[i]['zoomClasseValor']);
               window['zoomClasseValor___' + index].setValue(excelRows[i]['zoomClasseValor']);
               $('#zoomClasseValor_Id___' + index).val(excelRows[i]['zoomClasseValor_Id']);
               break;

            case 'Pagamento Antecipado':
            case 'PA':
               tipoAprovacao = 'PA';
               break;

            case 'Carreira Médica':
            case 'CM':
               tipoAprovacao = 'CM';
               break;

            case 'Adiantamento/Reembolso Opex':
            case 'AR':
                // ADIANTAMENTO/REEMBOLSO OPEX
                tipoAprovacao = 'AR';
                $('#zoomFilial___'          + index).val(excelRows[i]['zoomFilial']);
                window['zoomFilial___'      + index].setValue(excelRows[i]['zoomFilial']);
                $('#zoomFilial_Id___'       + index).val(excelRows[i]['zoomFilial_Id']);

                $('#zoomCentroCusto___'     + index).val(excelRows[i]['zoomCentroCusto']);
                window['zoomCentroCusto___' + index].setValue(excelRows[i]['zoomCentroCusto']);
                $('#zoomCentroCusto_Id___'  + index).val(excelRows[i]['zoomCentroCusto_Id']);
                break;
                
            default:
               tipoAprovacao = 'nao_informado';
               break;
         }

         // TIPO DE APROVACAO
         $('#tipoAprovacao___' + index).val(tipoAprovacao);
         if (i == 0)
            verTipoAprovacao($('#tipoAprovacao___' + index)[0]);

         // APROVADOR CONF NIVEL
         $('#apv_Usuario___' + index).val(excelRows[i]['Aprovador']);
         window['apv_Usuario___' + index].setValue(excelRows[i]['Aprovador']);
         $('#apv_Usuario_Id___' + index).val(excelRows[i]['Aprovador_Id']);
      }
    }

    // Exibir os dados processados (ou realizar outra ação necessária)
    FLUIGC.toast({
        message: 'Final da carga de Dados. Clique no botão de "Validar" para confirmar os códigos dos dados importados.',
        type: 'success'
    });
}

function exportarParaCSV() {
    var dadosTabela = [];
    var tabela = document.querySelector("table[tablename='tbAlcadas']");
    if (!tabela) {
        alert('Tabela não encontrada!');
        return;
    }
    // Cabeçalho manual igual ao Excel
    var cabecalho = [
        'Nível',
        'Tipo de Aprovação',
        'Centro de Custo',
        'Centro de Custo ID',
        'Filial',
        'Filial ID',
        'Classe de Valor',
        'Classe de Valor ID',
        'Aprovador',
        'Aprovador ID'
    ];
    dadosTabela.push(cabecalho);
    // DADOS
    tabela.querySelectorAll("tbody tr").forEach(function (linha) {
        var linhaDados = [];
        // Nível
        var nivel = linha.querySelector('input[id^="aprovadorNivel___"]');
        linhaDados.push(nivel ? nivel.value : '');
        // Tipo de Aprovação
        var tipo = linha.querySelector('select[id^="tipoAprovacao___"]');
        linhaDados.push(tipo ? (tipo.options[tipo.selectedIndex] ? tipo.options[tipo.selectedIndex].text : '') : '');
        // Centro de Custo
        var cc = linha.querySelector('select[id^="zoomCentroCusto___"]');
        linhaDados.push(cc ? cc.value : '');
        var cc_Id = linha.querySelector('input[id^="zoomCentroCusto_Id___"]');
        linhaDados.push(cc_Id ? cc_Id.value : '');
        // Filial
        var filial = linha.querySelector('select[id^="zoomFilial___"]');
        linhaDados.push(filial ? filial.value : '');
        var filial_Id = linha.querySelector('input[id^="zoomFilial_Id___"]');
        linhaDados.push(filial_Id ? filial_Id.value : '');
        // Classe de Valor
        var classe = linha.querySelector('select[id^="zoomClasseValor___"]');
        linhaDados.push(classe ? classe.value : '');
        var classe_Id = linha.querySelector('input[id^="zoomClasseValor_Id___"]');
        linhaDados.push(classe_Id ? classe_Id.value : '');
        // Aprovador
        var aprovador = linha.querySelector('select[id^="apv_Usuario___"]');
        linhaDados.push(aprovador ? aprovador.value : '');
        var aprovador_Id = linha.querySelector('input[id^="apv_Usuario_Id___"]');
        linhaDados.push(aprovador_Id ? aprovador_Id.value : '');
        // Só adiciona se houver dados
        if (linhaDados.length > 0 && linhaDados.some(function (x) { return x !== ''; })) {
            dadosTabela.push(linhaDados);
        }
    });
    var Sheet1 = $('#nomePlanilha').val() || 'Alcadas';
    // Adiciona BOM para garantir acentuação correta no Excel
    var BOM = '\uFEFF';
    var csvContent = BOM + dadosTabela.map(function (linha) {
        return linha.map(function (campo) {
            // Escapa aspas e separador
            if (typeof campo === 'string') campo = campo.replace(/"/g, '""');
            return '"' + campo + '"';
        }).join(';');
    }).join("\n");
    var encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", Sheet1 + ".csv");
    document.body.appendChild(link);
    link.click();
}

function exportarParaExcel() {
    var dadosTabela = [];
    var tabela = document.querySelector("table[tablename='tbAlcadas']");
    if (!tabela) {
        alert('Tabela não encontrada!');
        return;
    }
    // Cabeçalho manual (ajuste conforme os campos do seu formulário)
    var cabecalho = [
        'Nível',
        'Tipo de Aprovação',
        'Centro de Custo',
        'Centro de Custo ID',
        'Filial',
        'Filial ID',
        'Classe de Valor',
        'Classe de Valor ID',
        'Aprovador',
        'Aprovador ID'
    ];
    dadosTabela.push(cabecalho);

    // DADOS
    tabela.querySelectorAll("tbody tr").forEach(function (linha) {
        var linhaDados = [];
        // Nível
        var nivel = linha.querySelector('input[id^="aprovadorNivel___"]');
        linhaDados.push(nivel ? nivel.value : '');

        // Tipo de Aprovação
        var tipo = linha.querySelector('select[id^="tipoAprovacao___"]');
        linhaDados.push(tipo ? (tipo.options[tipo.selectedIndex] ? tipo.options[tipo.selectedIndex].text : '') : '');

        // Centro de Custo
        var cc = linha.querySelector('select[id^="zoomCentroCusto___"]');
        linhaDados.push(cc ? cc.value : '');

        var cc_Id = linha.querySelector('input[id^="zoomCentroCusto_Id___"]');
        linhaDados.push(cc_Id ? cc_Id.value : '');

        // Filial
        var filial = linha.querySelector('select[id^="zoomFilial___"]');
        linhaDados.push(filial ? filial.value : '');

        var filial_Id = linha.querySelector('input[id^="zoomFilial_Id___"]');
        linhaDados.push(filial_Id ? filial_Id.value : '');

        // Classe de Valor
        var classe = linha.querySelector('select[id^="zoomClasseValor___"]');
        linhaDados.push(classe ? classe.value : '');

        var classe_Id = linha.querySelector('input[id^="zoomClasseValor_Id___"]');
        linhaDados.push(classe_Id ? classe_Id.value : '');

        // Aprovador
        var aprovador = linha.querySelector('select[id^="apv_Usuario___"]');
        linhaDados.push(aprovador ? aprovador.value : '');

        var aprovador_Id = linha.querySelector('input[id^="apv_Usuario_Id___"]');
        linhaDados.push(aprovador_Id ? aprovador_Id.value : '');

        // Só adiciona se houver dados
        if (linhaDados.length > 0 && linhaDados.some(function (x) { return x !== ''; })) {
            dadosTabela.push(linhaDados);
        }
    });
    // Limita o nome da planilha a 31 caracteres (limite do Excel)
    var nomeOriginal = $('#nomePlanilha').val() || 'Alcadas';
    var Sheet1 = nomeOriginal.length > 31 ? nomeOriginal.substring(0, 31) : nomeOriginal;
    var ws = XLSX.utils.aoa_to_sheet(dadosTabela);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, Sheet1);
    XLSX.writeFile(wb, Sheet1 + ".xlsx");
}
