/*
 * jQuery Client Side Excel Export Plugin Library
 * http://techbytarun.com/
 *
 * Copyright (c) 2013 Batta Tech Private Limited
 * https://github.com/tarunbatta/ExcelExportJs/blob/master/LICENSE.txt
 *
 * March 22, 2017 - Update by Maynard for IE 11.09 up compatability
 */

(function ($) {
    var $defaults = {
        containerid: null,
        datatype: 'table',
        dataset: null,
        columns: null,
        returnUri: false,
        locale: 'pt-BR',
        worksheetName: "Alçadas",
        encoding: "utf-8"
    };

    var $settings = $defaults;

    $.fn.excelexportjs = function (options) {
        $settings = $.extend({}, $defaults, options);

        var gridData = [];
        var excelData;

        return Initialize();

        function Initialize() {
            var type = $settings.datatype.toLowerCase();
            BuildDataStructure(type);

            switch (type) {
                case 'table':
                    excelData = Export(ConvertFromTable());
                    break;
                case 'json':
                case 'xml':
                case 'jqgrid':
                    excelData = Export(ConvertDataStructureToTable());
                    break;
            }

            if ($settings.returnUri) {
                return excelData;
            } else {
                if (!isBrowserIE()) {
                    window.open(excelData);
                }
            }
        }

        function BuildDataStructure(type) {
            switch (type) {
                case 'table':
                    break;
                case 'json':
                    gridData = $settings.dataset;
                    break;
                case 'xml':
                    $($settings.dataset).find("row").each(function () {
                        var item = {};
                        if (this.attributes != null && this.attributes.length > 0) {
                            $(this.attributes).each(function () {
                                item[this.name] = this.value;
                            });
                            gridData.push(item);
                        }
                    });
                    break;
                case 'jqgrid':
                    $($settings.dataset).find("rows > row").each(function () {
                        var item = {};
                        if (this.children != null && this.children.length > 0) {
                            $(this.children).each(function () {
                                item[this.tagName] = $(this).text();
                            });
                            gridData.push(item);
                        }
                    });
                    break;
            }
        }

        function ConvertFromTable() {
            var result = $('<div>').append($('#' + $settings.containerid).clone()).html();
            return result;
        }

        function ConvertDataStructureToTable() {
            var result = "<table id='tabledata'>";
            result += "<thead><tr>";
            $($settings.columns).each(function () {
                if (this.ishidden != true) {
                    result += "<th";
                    if (this.width != null) {
                        result += " style='width: " + this.width + "'";
                    }
                    result += ">";
                    result += this.headertext;
                    result += "</th>";
                }
            });
            result += "</tr></thead>";
            result += "<tbody>";
            $(gridData).each(function (key, value) {
                result += "<tr>";
                $($settings.columns).each(function () {
                    if (value.hasOwnProperty(this.datafield)) {
                        if (this.ishidden != true) {
                            result += "<td";
                            if (this.width != null) {
                                result += " style='width: " + this.width + "'";
                            }
                            result += ">";
                            result += value[this.datafield];
                            result += "</td>";
                        }
                    }
                });
                result += "</tr>";
            });
            result += "</tbody>";
            result += "</table>";
            return result;
        }

        function Export(htmltable) {
            if (isBrowserIE()) {
                exportToExcelIE(htmltable);
            } else {
                var excelFile = "<html xml:lang=" + $defaults.locale + " xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
                excelFile += "<head>";
                excelFile += '<meta http-equiv="Content-type" content="text/html;charset=' + $defaults.encoding + '" />';
                excelFile += "<!--[if gte mso 9]>";
                excelFile += "<xml>";
                excelFile += "<x:ExcelWorkbook>";
                excelFile += "<x:ExcelWorksheets>";
                excelFile += "<x:ExcelWorksheet>";
                excelFile += "<x:Name>";
                excelFile += "{worksheet}";
                excelFile += "</x:Name>";
                excelFile += "<x:WorksheetOptions>";
                excelFile += "<x:DisplayGridlines/>";
                excelFile += "</x:WorksheetOptions>";
                excelFile += "</x:ExcelWorksheet>";
                excelFile += "</x:ExcelWorksheets>";
                excelFile += "</x:ExcelWorkbook>";
                excelFile += "</xml>";
                excelFile += "<![endif]-->";
                excelFile += "</head>";
                excelFile += "<body>";
                excelFile += htmltable.replace(/"/g, '\'');
                excelFile += "</body>";
                excelFile += "</html>";

                var uri = "data:application/vnd.ms-excel;base64,";
                var ctx = { worksheet: $settings.worksheetName, table: htmltable };

                return (uri + base64(format(excelFile, ctx)));
            }
        }

        function base64(s) {
            return window.btoa(unescape(encodeURIComponent(s)));
        }

        function format(s, c) {
            return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; });
        }

        function isBrowserIE() {
            var msie = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
            return msie > 0;
        }

        function exportToExcelIE(table) {
            var el = document.createElement('div');
            el.innerHTML = table;

            var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>";
            var tab;

            if ($settings.datatype.toLowerCase() == 'table') {
                tab = document.getElementById($settings.containerid);
            } else {
                tab = el.children[0];
            }

            for (var j = 0; j < tab.rows.length; j++) {
                tab_text = tab_text + tab.rows[j].innerHTML + "</tr>";
            }

            tab_text = tab_text + "</table>";
            tab_text = tab_text.replace(/<A[^>]*>|<\/A>/g, "");
            tab_text = tab_text.replace(/<img[^>]*>/gi, "");
            tab_text = tab_text.replace(/<input[^>]*>|<\/input>/gi, "");

            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");

            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
                txtArea1.document.open("txt/html", "replace");
                txtArea1.document.write(tab_text);
                txtArea1.document.close();
                txtArea1.focus();
                sa = txtArea1.document.execCommand("SaveAs", true, "Pagamentos" + new Date());
            } else {
                sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));
            }

            return (sa);
        }
    };
})(jQuery);

//get columns
function getColumns(paramData) {
    var header = [];
    $.each(paramData[0], function (key) {
        var obj = {};
        obj["headertext"] = key;
        obj["datatype"] = "string";
        obj["datafield"] = key;
        header.push(obj);
    });
    return header;
}
