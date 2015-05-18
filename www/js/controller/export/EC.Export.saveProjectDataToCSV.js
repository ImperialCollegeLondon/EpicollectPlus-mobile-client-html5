var EC = EC || {};
EC.Export = EC.Export || {};
EC.Export.saveProjectDataToCSV = function (the_project_id, the_forms) {
    'use strict';
    var project_id = project_id;
    var forms = the_forms;
    var parsed_forms_json;
    var single_form_json;

    function _prepareJSON() {

    }

    function _parseFormAllEntries(the_form) {

        var form = the_form;
        var iLength = form.total_entries;
        var i;
        var json = [];
        var single_entry_raw;

        //per each entry belonging to the current form, generate a json as key:value pair
        for (i = 0; i < iLength; i++) {
            single_entry_raw = form.data_rows.splice(0, form.total_inputs);
            json.push(_parseSingleEntry(single_entry_raw));
        }
        return json;
    }

    //each entry has got a number of inputs to define a single entry. Split each entry as key-value pairs
    function _parseSingleEntry(the_single_raw_entry) {

        var i;
        var single_entry_raw = the_single_raw_entry;
        var iLength = single_entry_raw.length;
        var single_entry_parsed = {};

        //loop each value for a single entry and generate an object listing all ref:value as the key:value pairs
        for (i = 0; i < iLength; i++) {

            //replace '_skipp3ed' with empty values
            if (single_entry_raw[i].value === EC.Const.SKIPPED) {
                single_entry_raw[i].value = '';
            }

            //split location values
            //todo

            single_entry_parsed[single_entry_raw[i].ref] = single_entry_raw[i].value;
        }

        console.log('Entry ' + i + ' content ********************************');
        console.log(single_entry_parsed);

        return single_entry_parsed;
    }

    //get data rows for all the forms for this project
    $.when(EC.Select.getAllProjectEntries(forms, project_id)).then(function (data) {
        console.log(data);

        var i;
        var iLength = data.length;

        parsed_forms_json = [];

        //per each form parse all the entries
        for (i = 0; i < iLength; i++) {
            parsed_forms_json[i] = _parseFormAllEntries(data[i]);
        }
        console.log('parsed_forms_json **********************************************');
        console.log(parsed_forms_json);

        //write csv files, one per each form


    });
};

