var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var deferred;
    var inputs;
    var remote_entry;
    var entry_key_ref;
    var immediate_parent_key_value;
    var form_id;
    var branch_entries;

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    var _insertNewRowSQLSuccessCB = function (the_tx, the_result) {
        console.log('INSERT REMOTE ENTRY SUCCESS');
        console.log(JSON.stringify(the_result));
    };

    var _insertRemoteFormValuesTX = function (tx) {

        var i;
        var iLength = inputs.length;
        var query;
        var ref;
        var obj;
        var location_obj;
        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var current_remote_timestamp = current_remote_entry.created;
        var remote_ref_value;

        //loop all the input fields
        for (i = 0; i < iLength; i++) {

            ref = inputs[i].ref;


            //per each ref, check if the remote entry has a value
            if (current_remote_entry.hasOwnProperty(ref)) {


                //todo deal with branches. They will always be an array (checkbox values come as csv)
                if (Array.isArray(current_remote_entry[ref])) {

                    debugger;
                    //we have a branch, save data (if any)
                    branch_entries.push({
                        form_id: form_id,
                        owner_input_ref: ref,
                        main_form_key_ref: entry_key_ref,
                        main_form_key_ref_value: current_remote_entry[entry_key_ref],
                        branch_entries: current_remote_entry[ref]
                    });

                }
                else {

                    //location object needs to be converted to string
                    if (typeof (current_remote_entry[ref]) === 'string') {
                        remote_ref_value = current_remote_entry[ref];
                    } else {
                        //location is a json object listing the components, so convert it to string
                        location_obj = current_remote_entry[ref];
                        remote_ref_value = EC.Utils.parseLocationObjToString(location_obj);
                    }
                }

            } else {
                //the current input ref is not part of the downloaded data set therefore set it to an empty string
                remote_ref_value = '';
            }

            //build query to insert hierarchy (main) values
            query = '';
            obj = inputs[i];

            query += 'INSERT INTO ec_data (';
            query += 'input_id, ';
            query += 'form_id, ';
            query += 'position, ';
            query += 'parent, ';
            query += 'label, ';
            query += 'ref, ';
            query += 'value, ';
            query += 'is_title, ';
            query += 'entry_key, ';
            query += 'type, ';
            query += 'created_on, ';
            query += 'is_remote, ';
            query += 'is_data_synced, ';
            query += 'is_media_synced) ';
            query += 'VALUES (';

            //parameterized query (webSQL only allows '?' http://www.w3.org/TR/webdatabase/)
            query += '?,';//input_id
            query += '?,';//form_id
            query += '?,';//position
            query += '?,';//parent
            query += '?,';//label
            query += '?,';//ref
            query += '?,';//value
            query += '?,';//is_title
            query += '?,';//entry_key
            query += '?,';//type
            query += '?,';//created_on
            query += '?,';//is_remote
            query += '?,';//is_data_synced
            query += '?);';//is_media_synced

            tx.executeSql(query, [
                    obj._id,
                    form_id,
                    obj.position,
                    immediate_parent_key_value,
                    obj.label,
                    ref,
                    remote_ref_value.trim(),
                    obj.is_title,
                    current_remote_entry_key,
                    obj.type,
                    current_remote_timestamp,
                    1,
                    1,
                    1
                ],
                _insertNewRowSQLSuccessCB,
                _errorCB);

        }
    };

    var _insertRemoteFormValuesSuccessCB = function (the_tx, the_result) {

        //update entries counter for the current form (adding new entry, + 1)
        $.when(EC.Update.updateCountersOnEntriesDownload(form_id)).then(function () {

            //if I have any braches, return them
            console.log('branch_entries here ***************************************');
            console.log(branch_entries);

            deferred.resolve(branch_entries);

        });
    };

    //insert downloaded entries to the local SQLite database
    module.insertRemoteFormValues = function (the_form_id, the_local_inputs, the_remote_entry, the_entry_key_ref, the_immediate_parent_key_value) {

        form_id = the_form_id;
        inputs = the_local_inputs;
        remote_entry = the_remote_entry;
        entry_key_ref = the_entry_key_ref;
        immediate_parent_key_value = the_immediate_parent_key_value;
        branch_entries = [];

        deferred = new $.Deferred();

        //insert remote form values to top parent form
        EC.db.transaction(_insertRemoteFormValuesTX, _errorCB, _insertRemoteFormValuesSuccessCB);

        return deferred.promise();
    };

    return module;

}(EC.Create));
