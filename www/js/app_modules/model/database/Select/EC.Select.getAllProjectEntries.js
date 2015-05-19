var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var forms;
    var project_id;
    var entries;
    var branch_data_rows;
    var branch_form_names;
    var form_counter;
    var branch_form_counter;
    var has_branches;
    var deferred;

    //get all ec_data rows for this project	 (per each form)
    var _getAllProjectEntriesTX = function (tx) {

        var i;
        var iLength = forms.length;
        var select_query = 'SELECT * FROM ec_data WHERE form_id=?';
        var branch_select_query;
        form_counter = 0;
        branch_form_counter = 0;

        for (i = 0; i < iLength; i++) {
            tx.executeSql(select_query, [forms[i]._id], _getAllProjectEntriesSQLSuccessCB, EC.Select.errorCB);
        }

        if (has_branches) {
            branch_data_rows = [];
            branch_form_names = [];
            branch_select_query = 'SELECT * FROM ec_branch_data JOIN ec_branch_forms ON ec_branch_data.form_id=ec_branch_forms._id WHERE ec_branch_forms.project_id=?';
            tx.executeSql(branch_select_query, [project_id], _getAllProjectBranchEntriesSQLSuccessCB, EC.Select.errorCB);
        }

    };

    var _getAllProjectEntriesSuccessCB = function () {

        //if we have any branch data, append them to the end of entries array
        if (branch_data_rows.length > 0) {
            entries.push({
                has_branches: true,
                branch_data_rows: branch_data_rows,
                branch_form_names: branch_form_names
            });
        }

        //return entries to backup controller
        deferred.resolve(entries.slice(0));

        entries.length = 0;
        branch_data_rows.length = 0;
        forms.length = 0;
    };

    var _getAllProjectEntriesSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;
        var current_data_rows;

        //per each form, save form details and an array with all the entries for that form
        entries[form_counter] = {
            form_id: forms[form_counter]._id,
            form_name: forms[form_counter].name,
            total_entries: forms[form_counter].entries,
            total_inputs: forms[form_counter].total_inputs,
            data_rows: []
        };

        for (i = 0; i < iLength; i++) {

            current_data_rows = entries[form_counter].data_rows;
            current_data_rows.push(the_result.rows.item(i));

            //if the entry row just added is a media field, set value to empty string (as media files are not backed up)
            if (current_data_rows[current_data_rows.length - 1].type === EC.Const.PHOTO || current_data_rows[current_data_rows.length - 1].type === EC.Const.AUDIO || current_data_rows[current_data_rows.length - 1].type === EC.Const.VIDEO) {
                current_data_rows[current_data_rows.length - 1].value = '';
            }

        }

        form_counter++;

    };

    var _getAllProjectBranchEntriesSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;
        var current_branch_form_name;

        for (i = 0; i < iLength; i++) {

            branch_data_rows.push(the_result.rows.item(i));

            //cache branch form names: when restoring we will neeed the branch form name and project id to map the rows against the actual branch form id
            //which will be different from the one we save
            current_branch_form_name = the_result.rows.item(i).name;
            //store only unique values
            if (!EC.Utils.inArray(branch_form_names, current_branch_form_name)) {
                branch_form_names.push(current_branch_form_name);
            }
        }

    };

    /**
     *
     * @param {Object} the_forms Fetch all project entries rows
     */
    module.getAllProjectEntries = function (the_forms, the_project_id) {

        forms = the_forms;
        project_id = the_project_id;
        has_branches = EC.Utils.projectHasBranches();
        entries = [];
        branch_data_rows = [];
        deferred = new $.Deferred();

        EC.db.transaction(_getAllProjectEntriesTX, EC.Select.errorCB, _getAllProjectEntriesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Select));
