var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var branch_entries;
    var local_branch_inputs;
    var local_branch_entries_keys;
    var local_input;
    var rows;
    var deferred;
    var branch_input_values;
    var form_id;

    function _getLocalBranchInput(the_ref) {

        var ref = the_ref;
        var found = {};

        $(local_branch_inputs).each(function (index, input) {
            if (input.ref === ref) {
                found = input;
                return false;
            }
        });

        return found;
    }

    module.saveRemoteBranchEntries = function (the_form_id, the_branch_entries, the_local_branch_inputs, the_local_branch_entries_keys) {

        form_id = the_form_id;
        branch_entries = the_branch_entries;
        local_branch_inputs = the_local_branch_inputs;
        local_branch_entries_keys = the_local_branch_entries_keys;
        rows = [];
        local_input = {};
        deferred = new $.Deferred();
        branch_input_values = [];

        /* for each branch entry entries, check if the same primary key is already saved locally,
         and it that case update, otherwise insert
         */
        $(branch_entries).each(function (index, single_branch) {

            debugger;

            branch_input_values.push({
                input_ref: single_branch.owner_input_ref,
                branch_ref: single_branch.main_form_key_ref,
                branch_form_id: single_branch.form_id,
                total: single_branch.branch_entries.length
            });

            $(single_branch.branch_entries).each(function (index, single_branch_entry) {

                //cache this property as we need it later
                var created_on = single_branch_entry.created;

                //delete useless properties from the object first
                delete single_branch_entry.DeviceID;
                delete single_branch_entry.id;
                delete single_branch_entry.lastEdited;
                delete single_branch_entry.uploaded;
                delete single_branch_entry.created;


                //each property is saved a a single row
                for (var key in single_branch_entry) {
                    if (single_branch_entry.hasOwnProperty(key)) {

                        //EC.Create.insertSingleBranchDataRow(key, single_branch_entry[key], _getLocalBranchInput(key));
                        local_input = _getLocalBranchInput(key);

                        //skip the parent key property, as it is not part of the branch rows we are saving
                        if (key !== single_branch.main_form_key_ref) {

                            rows.push({
                                input_id: local_input._id,
                                form_id: single_branch.form_id,
                                hierarchy_entry_key_value: single_branch.main_form_key_ref_value,
                                hierarchy_entry_key_ref: single_branch.main_form_key_ref,
                                position: local_input.position,
                                label: local_input.label,
                                ref: key,
                                value: single_branch_entry[key],
                                is_title: local_input.is_title,
                                entry_key: single_branch.main_form_key_ref,
                                type: local_input.type,
                                is_data_synced: 1,
                                is_media_synced: 1,
                                is_remote: 1,
                                is_cached: 1,
                                is_stored: 1,
                                created_on: created_on
                            });
                        }
                    }
                }
            });
        });

        //console.log('rows ----------------------------------------->');
        //console.log(JSON.stringify(rows.slice()));

        $.when(EC.Create.insertRemoteBranchDataRows(rows)).then(function () {


            debugger;
            console.log(JSON.stringify(branch_input_values));
            //todo insert in the owner form the ref and the total per each branch
            $.when(EC.Update.setValuesForBranchInputs(form_id, branch_input_values)).then(function () {


            });

            deferred.resolve();
        });


        return deferred.promise();
    };

    return module;

}(EC.Create));
