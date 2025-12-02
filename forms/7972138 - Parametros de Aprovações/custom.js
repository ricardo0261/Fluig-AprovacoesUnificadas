$(function(){
    $("document").ready(function() {
    });
});

function defineVALOR(qCAMPO){
	var auxCAMPO = 'aux_'+qCAMPO.id;
	$('#'+auxCAMPO).val(qCAMPO.value);
}

function setSelectedZoomItem(selectedItem) {  
    if(selectedItem.inputId == 'process_name'){
        $('#process_id'      ).val(selectedItem.processId);
        $('#nickname_process').val(selectedItem.processDescription);

        changeClassProcess(selectedItem.processDescription);
        getVersionProcess(selectedItem.processId);
        getActivities();
    }
}

function removedZoomItem(removedItem) {
	if (removedItem.inputId == "process_name"){
		cleanActivities();
	}
}

function mostrarOcultarDiv(valor) {
	var buscaDiv = document.getElementById(valor);
	if (buscaDiv.style.display == 'none') {
		buscaDiv.style.display = 'block';
	} else {
		buscaDiv.style.display = 'none';
	}
}

function getVersionProcess(process_id){
    var constraintVersion = new Array();
    constraintVersion.push(DatasetFactory.createConstraint('processDefinitionVersionPK.processId', process_id, process_id, ConstraintType.MUST));
    constraintVersion.push(DatasetFactory.createConstraint('processDefinitionVersionPK.companyId', '1', '1', ConstraintType.MUST));
    constraintVersion.push(DatasetFactory.createConstraint('active', true, true, ConstraintType.MUST));
    var datasetVersion = DatasetFactory.getDataset('processDefinitionVersion', null, constraintVersion, null);
    if( datasetVersion != null && datasetVersion != undefined && datasetVersion.values.length > 0) {
        $('#process_version').val(datasetVersion.values[datasetVersion.values.length-1]['processDefinitionVersionPK.version']);
    }
}

function getActivities(){
    let process_id      = $('#process_id'     ).val();
    let process_version = $('#process_version').val();

    var constraintActivities = new Array();
        constraintActivities.push(DatasetFactory.createConstraint('processStatePK.processId', process_id, process_id, ConstraintType.MUST));
        constraintActivities.push(DatasetFactory.createConstraint('processStatePK.version', process_version, process_version, ConstraintType.MUST));
        constraintActivities.push(DatasetFactory.createConstraint('processStatePK.companyId', '1', '1', ConstraintType.MUST));
    var datasetActivities = DatasetFactory.getDataset('processState', null, constraintActivities, ['stateName']);
    if( datasetActivities != null && datasetActivities != undefined && datasetActivities.values.length > 0) 
        for(var i=0; i<datasetActivities.values.length; i++){
            var state_type = datasetActivities.values[i]['stateType'];
            var join = datasetActivities.values[i]['join'];
			if(state_type != '1' && 
               state_type != '4' && 
               state_type != '6' && 
               !join){

                /* NOVO REGISTRO */
                var indexes = wdkAddChild('table-activities');

                /* VALORES PADROES */
                $('#code_activities___'    +indexes).val( datasetActivities.values[i]['processStatePK.sequence'] );
                $('#approval_activities___'+indexes).val( 'nao');	
                $('#name_activities___'    +indexes).val( datasetActivities.values[i]['stateName'] );

                $('#sequence_approved___'+indexes).val(0);
                $('#final_approved___'   +indexes).val(0);
                $('#value_approved___'   +indexes).val( datasetActivities.values[i]['stateName'].indexOf('Aprovação')>=0 ? 'sim' : '');
                
                $('#sequence_reproved___'+indexes).val(0);
                $('#final_reproved___'   +indexes).val(0);
                $('#value_reproved___'   +indexes).val( datasetActivities.values[i]['stateName'].indexOf('Aprovação')>=0 ? 'nao' : '');

                $('#sequence_refused___' +indexes).val(0);
                $('#final_refused___'    +indexes).val(0);
                $('#value_refused___'    +indexes).val( datasetActivities.values[i]['stateName'].indexOf('Aprovação')>=0 ? 'recusado' : '');
            }
        }
}

function cleanActivities(){
	$('#table-activities tbody tr').not(':first').each(function(count, tr) {
	    fnWdkRemoveChild($(this).find('input')[0]);
	});
}

function changeClassProcess(value){
    var class_process = value;
    class_process = class_process.toLowerCase();
    class_process = class_process.replaceAll(' ', '_');
    class_process = class_process.replaceAll('(', '');
    class_process = class_process.replaceAll(')', '');
    class_process = class_process.replaceAll('"', '');
    class_process = class_process.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    $('#class_process').val(class_process);
}
