var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';


    var branch_form_values = [];
    var entry_key;
    var deferred;

    //callback for a transaction error
    var _errorCB = function (the_tx, the_result) {
        console.log(EC.Utils.TRANSACTION_ERROR);
        console.log(the_result);
    };

    var _insertBranchFormValuesTX = function (tx) {

        var i;
        var iLength = branch_form_values.length;
        var remote_flag = 0;
        var is_cached = 1;
        var is_stored = 0;

        for (i = 0; i < iLength; i++) {

            var query = '';
            var obj = branch_form_values[i];

            query += 'INSERT INTO ec_branch_data (';
            query += 'input_id, ';
            query += 'form_id, ';
            query += 'hierarchy_entry_key_ref, ';
            query += 'hierarchy_entry_key_value, ';
            query += 'position, ';
            query += 'label, ';
            query += 'ref, ';
            query += 'value, ';
            query += 'is_title, ';
            query += 'entry_key, ';
            query += 'type, ';
            query += 'is_data_synced, ';
            query += 'is_media_synced, ';
            query += 'is_cached, ';
            query += 'is_stored, ';
            query += 'created_on, ';
            query += 'is_remote) ';
            query += 'VALUES (';

            //parameterized query (webSQL only allows '?' http://www.w3.org/TR/webdatabase/)
            query += '?,';//input_id
            query += '?,';//form_id
            query += '?,';//hierarchy_entry_key_ref
            query += '?,';//hierarchy_entry_key_value
            query += '?,';//position
            query += '?,';//label
            query += '?,';//ref
            query += '?,';//value
            query += '?,';//is_title
            query += '?,';//entry_key
            query += '?,';//type
            query += '?,';//is_data_synced
            query += '?,';//is_media_synced
            query += '?,';//is_cached
            query += '?,';//is_stored
            query += '?,';//created_on
            query += '?);';//is_remote

            tx.executeSql(query, [
                    obj.input_id,
                    obj.form_id,
                    obj.hierarchy_entry_key_ref,
                    obj.hierarchy_entry_key_value,
                    obj.position,
                    obj.label,
                    obj.ref,
                    obj.value,
                    obj.is_title,
                    obj.entry_key,
                    obj.type,
                    obj.is_data_synced,
                    obj.is_media_synced,
                    is_cached,
                    is_stored,
                    obj.created_on,
                    remote_flag
                ],
                _insertBranchFormValuesSQLSuccessCB,
                _errorCB);
        }

    };

    var _insertBranchFormValuesSuccessCB = function () {

        var branch_form_id = branch_form_values[0].form_id;

        //update branch entries counter, + 1
        $.when(EC.Update.updateCountersOnSingleBranchEntryInsertion(entry_key, branch_form_id)).then(function () {
            deferred.resolve(entry_key);
        }, function () {
            deferred.reject();
        });

    };

    var _insertBranchFormValueserrorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    var _insertBranchFormValuesSQLSuccessCB = function () {
    };

    /*
     * Commit a branch form to database; each value is a row in the table ec_data:
     * when committed, the branch form is set as is_cached = 1, is_stored = 0
     * the is_stored flag is set to one when the main form is saved.
     * If the user leaves the main form without saving, the branch entries only cached (is_stored = 0) will be deleted
     */
    module.insertBranchFormValues = function (the_branch_form_values, the_key_value) {

        branch_form_values = the_branch_form_values;
        entry_key = the_key_value;
        deferred = new $.Deferred();

        EC.db.transaction(_insertBranchFormValuesTX, _errorCB, _insertBranchFormValuesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Create));
