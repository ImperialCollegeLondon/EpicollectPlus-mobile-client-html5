/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = (function (module) {
    'use strict';

    var self;
    var deferred;
    var project_id;
    var form_id;
    var remote_entry;
    var groups;
    var entry_key_ref;
    var local_entries_keys;
    var updated_entries_counter;
    var inputs;


    module.prepareForRemoteDataSaving = function (the_project_id, the_form_id, the_remote_entry) {

        self = this;
        self.project_id = the_project_id;
        self.form_id = the_form_id;
        self.remote_entry = the_remote_entry;

        deferred = new $.Deferred();

        //todo move dependency outside?
        entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

        //reset array (we might have keys from a previous download)
        local_entries_keys = [];
        //reset counter
        updated_entries_counter = 0;
        //reset inputs array
        inputs = [];
        groups = [];

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

                //_saveRemoteEntries();
                deferred.resolve(inputs, local_entries_keys, groups);

            });

        } else {

            //local primary keys and inputs are cached, no need to query db
            local_entries_keys = JSON.parse(window.localStorage.dre_local_entries_keys);
            inputs = JSON.parse(window.localStorage.dre_inputs);
            groups = JSON.parse(window.localStorage.dre_groups);

            //_saveRemoteEntries();
            deferred.resolve(inputs, local_entries_keys, groups);
        }

        return deferred.promise();
    };
    return module;

}(EC.Download));
