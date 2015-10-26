/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = (function (module) {
    'use strict';

    var form_id;
    var deferred;
    var inputs;
    var remote_entry;
    var entry_key_ref;
    var self;

    var _errorCB = function (the_tx, the_result) {
        console.log(the_tx);
        console.log(the_result);
    };

    var _updateLocalRowWithRemoteSQLSuccessCB = function (the_tx, the_result) {
    };

    //A local entry with the same key is stored on the local database, so we have to update its values with the remote ones
    var _updateLocalRowWithRemoteTX = function (tx) {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var ref;
        var input_id;
        var i;
        var iLength = inputs.length;
        var location_obj;
        var remote_ref_value;
        var remote_ref_value_location;
        var query;

        //loop all the input fields
        for (i = 0; i < iLength; i++) {

            //get local input _id and ref
            ref = inputs[i].ref;
            input_id = inputs[i]._id;

            //per each ref, check if the remote entry has a value
            if (current_remote_entry.hasOwnProperty(ref)) {

                //check if the current remote entry is a location object or not
                if (typeof (current_remote_entry[ref]) === 'string') {
                    remote_ref_value = current_remote_entry[ref];
                } else {
                    //location is a json object listing the components, so convert it to string for storing
                    location_obj = current_remote_entry[ref];
                    remote_ref_value = EC.Utils.parseLocationObjToString(location_obj);
                }
            } else {
                //the current input ref is not part of the downloaded data set therefore set it to an empty string
                remote_ref_value = '';
            }

            query = 'UPDATE ec_data SET value=?, is_remote=? WHERE form_id=? AND input_id=? AND entry_key=?';
            tx.executeSql(query, [remote_ref_value, 1, form_id, input_id, current_remote_entry_key], _updateLocalRowWithRemoteSQLSuccessCB, self.errorCB);
        }
    };

    //update entries counter for the current form (adding new entry, + 1)
    var _updateLocalRowWithRemoteSuccessCB = function (tx) {
        deferred.resolve();
    };

    //we have an existing row already saved on the device with that ref and unique value, so update it.
    // Entries downloaded from the server always override the local entries by design
    module.updateLocalRowsWithRemoteData = function (the_form_id, the_local_inputs, the_remote_entry, the_entry_key_ref) {

        form_id = the_form_id;
        inputs = the_local_inputs;
        remote_entry = the_remote_entry;
        entry_key_ref = the_entry_key_ref;
        self = this;
        deferred = new $.Deferred();

        EC.db.transaction(_updateLocalRowWithRemoteTX, _errorCB, _updateLocalRowWithRemoteSuccessCB);

        return deferred.promise();
    };

    return module;

}(EC.Update));
