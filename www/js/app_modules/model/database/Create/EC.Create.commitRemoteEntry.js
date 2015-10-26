/*global $, jQuery*/
/**
 * @module EC
 * @submodule SetData
 */

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var remote_entry;
    var updated_entries_counter;
    var local_entries_keys = [];
    var inputs = [];
    var groups;
    var project_id;
    var form_id;
    var entry_key_ref;
    var self;
    var deferred;
    var immediate_parent_key_value;


    var _saveRemoteEntries = function () {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];

        var form_tree = JSON.parse(window.localStorage.form_tree);
        var parent_form_name = form_tree.pname;
        var immediate_parent_form;
        var hierarchy_entry_key_value_ref;

        /*
         Per each group in my local inputs, I need to map the remote data against the local structure
         */

        debugger;

        $(groups).each(function (index, single_group) {

            var temp_array = [];

            //a group is always a collection (Array)
            current_remote_entry[single_group.ref] = {};

            $(single_group.inputs).each(function (index, single_value) {

                //if it is a checkbox, parse value to array, as when saving it is expecting an array
                if (single_value.type === EC.Const.CHECKBOX) {

                    temp_array.push({ref: single_value.ref, value: current_remote_entry[single_value.ref].split(',')});
                }
                else {
                    temp_array.push({ref: single_value.ref, value: current_remote_entry[single_value.ref]});
                }


                //delete detached ref from current_remote_entry for each group input ref not to be saved as orphan data
                delete current_remote_entry[single_value.ref];
            });

            current_remote_entry[single_group.ref] = JSON.stringify(temp_array);

            debugger;

        });

        //check if the currenty entry match a primary key of a local entry
        if (EC.Utils.inArray(local_entries_keys, current_remote_entry_key)) {
            //update existing row
            console.log('***********************************************************  update ' + current_remote_entry_key);
            $.when(EC.Update.updateLocalRowsWithRemoteData(form_id, inputs, remote_entry, entry_key_ref)).then(function () {
                deferred.resolve();
            });

        } else {

            /*************************************************************************/
            //check parent first, then trigger different transaction based on parenting
            /*************************************************************************/

            //insert new row
            console.log('***********************************************************  insert ' + current_remote_entry_key);

            //manage parenting and form tree: if parent_name is '' we are entering data for top form so immediate_parent_key_value is set to ''
            if (parent_form_name === '') {
                immediate_parent_key_value = '';
                $.when(EC.Create.insertRemoteFormValues(form_id, inputs, remote_entry, entry_key_ref, immediate_parent_key_value)).then(function () {
                    deferred.resolve();
                });
            } else {
                //child form therefore use parent entry key value from downloaded data
                hierarchy_entry_key_value_ref = EC.Utils.getFormParentPrimaryKeyRef(form_id);
                immediate_parent_key_value = current_remote_entry[hierarchy_entry_key_value_ref];
                immediate_parent_form = EC.Utils.getParentFormByChildID(form_id);

                //TODO: can we cache the full parent path (or part of it) to improve performance?
                $.when(EC.Select.getFullParentPath(immediate_parent_form._id, immediate_parent_key_value)).then(function (the_full_parent_path) {

                    //build full parent path in the form key|key|key....
                    if (the_full_parent_path !== '') {
                        immediate_parent_key_value = the_full_parent_path + '|' + immediate_parent_key_value;
                    }
                    $.when(EC.Create.insertRemoteFormValues(form_id, inputs, remote_entry, entry_key_ref, immediate_parent_key_value, groups)).then(function () {
                        deferred.resolve();
                    });
                }, function () {
                    //no parent key found on the device, warn user
                    deferred.reject();
                });
            }
        }
    };

    /**
     *
     * @param {Object} the_project_id
     * @param {Object} the_form_id
     * @param {Object} the_remote_entry
     *
     * @method commitRemoteEntry Commit a remote entry, insert it if a new one, otherwise update existing one on device as entries on the server overrides local entries
     */
    module.commitRemoteEntry = function (the_project_id, the_form_id, the_remote_entry) {

        project_id = the_project_id;
        form_id = the_form_id;
        remote_entry = the_remote_entry;
        self = this;
        deferred = new $.Deferred();
        groups = [];

        entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

        //reset array (we might have keys from a previous download)
        local_entries_keys = [];
        //reset counter
        updated_entries_counter = 0;
        //reset inputs array
        inputs = [];

        debugger;

        if (!window.localStorage.dre_local_entries_keys && !window.localStorage.dre_inputs) {

            //get all locally stored primary keys and inputs for the current form before saving the new entries,
            //as we need to map against the local row '_id's
            $.when(EC.Structure.getLocalDataStructure(form_id)).then(function (the_local_inputs, the_local_entries_keys, the_groups) {

                //cache local data structure (dre_ stands for download remote entries ;))
                window.localStorage.dre_local_entries_keys = JSON.stringify(the_local_entries_keys);
                window.localStorage.dre_groups = JSON.stringify(the_groups);
                window.localStorage.dre_inputs = JSON.stringify(the_local_inputs);

                inputs = the_local_inputs;
                local_entries_keys = the_local_entries_keys;
                groups = the_groups;

                _saveRemoteEntries();

            });

        } else {

            //local primary keys and inputs are cached, no need to query db
            local_entries_keys = JSON.parse(window.localStorage.dre_local_entries_keys);
            inputs = JSON.parse(window.localStorage.dre_inputs);
            groups = JSON.parse(window.localStorage.dre_groups);

            _saveRemoteEntries();
        }

        return deferred.promise();

    };

    return module;

}(EC.Create));
