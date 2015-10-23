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
    var project_id;
    var form_id;
    var entry_key_ref;
    var full_parent_path;
    var self;
    var deferred;
    var immediate_parent_key_value;

    var _errorCB = function (the_tx, the_result) {
        console.log(the_tx);
        console.log(the_result);
    };

    /**
     * parseLocation() Convert a location json object to a single string concatenating the location components values
     */
    function _parseLocationObjToString(the_location_obj) {

        var location_obj = the_location_obj;
        var latitude = (location_obj.latitude === 'N/A') ? '' : location_obj.latitude;
        var longitude = (location_obj.longitude === 'N/A') ? '' : location_obj.longitude;
        var altitude = (location_obj.altitude === 'N/A') ? '' : location_obj.altitude;
        var accuracy = (location_obj.accuracy === 'N/A') ? '' : location_obj.accuracy;
        var bearing = (location_obj.bearing === 'N/A') ? '' : location_obj.bearing;

        return (//
        'Latitude: ' + latitude + ',\n' + //
        'Longitude: ' + longitude + ',\n' + //
        'Altitude: ' + altitude + ',\n' + //
        'Accuracy: ' + accuracy + ',\n' + //
        'Altitude Accuracy: ' + ' ' + ',\n' + //
        'Heading: ' + bearing + '\n');
        //
    }

    //get all primary key for local entries and all the inputs for the project
    var _getFormLocalDataTX = function (tx) {

        var query_entry_key = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';
        var query_inputs = 'SELECT * FROM ec_inputs WHERE form_id=? ORDER BY position';

        tx.executeSql(query_entry_key, [form_id], _getFormPrimaryKeysSQLSuccessCB, self.errorCB);
        tx.executeSql(query_inputs, [form_id], _getFormInputsSQLSuccessCB, self.errorCB);

    };

    //fill in array with all the inputs for this form
    var _getFormInputsSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;

        for (i = 0; i < iLength; i++) {
            inputs.push(the_result.rows.item(i));
        }
        debugger;

        //todo here I Can find out if there is a group, so get all the group refs

        window.localStorage.dre_inputs = JSON.stringify(inputs);

    };

    //fill in array with all the local entry keys
    var _getFormPrimaryKeysSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;

        for (i = 0; i < iLength; i++) {
            local_entries_keys.push(the_result.rows.item(i).entry_key);
        }

        window.localStorage.dre_local_entries_keys = JSON.stringify(local_entries_keys);

    };

    //insert all the values for a single entry
    function _insertEntryValues(the_inputs, the_tx, the_immediate_parent_key_value, the_current_remote_entry, the_current_remote_entry_key, the_current_remote_timestamp) {

        var i;
        var iLength = the_inputs.length;
        var query;
        var ref;
        var obj;
        var location_obj;
        var tx = the_tx;
        var immediate_parent_key_value = the_immediate_parent_key_value;
        var current_remote_entry = the_current_remote_entry;
        var current_remote_entry_key = the_current_remote_entry_key;
        var current_remote_timestamp = the_current_remote_timestamp;
        var remote_ref_value;
        var remote_ref_value_location;

        //loop all the input fields
        for (i = 0; i < iLength; i++) {

            ref = inputs[i].ref;

            //per each ref, check if the remote entry has a value
            if (current_remote_entry.hasOwnProperty(ref)) {

                //location object needs to be converted to string
                if (typeof (current_remote_entry[ref]) === 'string') {
                    remote_ref_value = current_remote_entry[ref];
                } else {
                    //location is a json object listing the components, so convert it to string
                    location_obj = current_remote_entry[ref];
                    remote_ref_value_location = _parseLocationObjToString(location_obj);
                }

            } else {
                //the current input ref is not part of the downloaded data set therefore set it to an empty string
                remote_ref_value = '';
            }

            //build query to insert values

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
                remote_ref_value,
                obj.is_title,
                current_remote_entry_key,
                obj.type,
                current_remote_timestamp,
                1,
                1,
                1
            ], _insertNewRowSQLSuccessCB, _errorCB);

        }//for all input fields

    }

    //insert values for top parent form
    var _insertTopFormValuesTX = function (tx) {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var current_remote_timestamp = current_remote_entry.created;

        //insert entry values
        _insertEntryValues(inputs, tx, immediate_parent_key_value, current_remote_entry, current_remote_entry_key, current_remote_timestamp);

    };

    //insert values for one of the child forms
    var _insertChildFormValuesTX = function (tx) {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var current_remote_timestamp = current_remote_entry.created;

        //insert entry values
        _insertEntryValues(inputs, tx, immediate_parent_key_value, current_remote_entry, current_remote_entry_key, current_remote_timestamp);
    };

    //A local entry with the same key is stored on the local database, so we have to update its values with the remote ones
    var _updateLocalRowWithRemoteTX = function (tx) {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var current_remote_timestamp = current_remote_entry.created;
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
                    //location is a json object listing the components, so convert it to string
                    location_obj = current_remote_entry[ref];
                    remote_ref_value_location = _parseLocationObjToString(location_obj);
                }

            } else {

                //the current input ref is not part of the downloaded data set therefore set it to an empty string
                remote_ref_value = '';
            }

            query = 'UPDATE ec_data SET value=?, is_remote=? WHERE form_id=? AND input_id=? AND entry_key=?';
            tx.executeSql(query, [remote_ref_value, 1, form_id, input_id, current_remote_entry_key], _updateLocalRowWithRemoteSQLSuccessCB, self.errorCB);

        }//for each input field

    };

    var _updateLocalRowWithRemoteSQLSuccessCB = function (the_tx, the_result) {

    };

    //update entries counter for the current form (adding new entry, + 1)
    var _updateLocalRowWithRemoteSuccessCB = function (tx) {
        deferred.resolve();
    };


    var _getFormLocalDataSuccessCB = function () {

        var current_remote_entry = remote_entry;
        var current_remote_entry_key = current_remote_entry[entry_key_ref];
        var current_remote_timestamp = current_remote_entry.created;
        var form_tree = JSON.parse(window.localStorage.form_tree);
        var parent_form_name = form_tree.pname;
        var immediate_parent_form;
        var hierarchy_entry_key_value_ref;

        //check if the currenty entry match a primary key of a local entry
        if (EC.Utils.inArray(local_entries_keys, current_remote_entry_key)) {

            //update existing row
            console.log('***********************************************************  update ' + current_remote_entry_key);

            //TODO: we have a match: update existing row
            EC.db.transaction(_updateLocalRowWithRemoteTX, _errorCB, _updateLocalRowWithRemoteSuccessCB);
        } else {

            //check parent first, then trigger different transaction based on parenting
            //insert new row
            console.log('***********************************************************  insert ' + current_remote_entry_key);

            //manage parenting and form tree: if parent_name is '' we are entering data for top form so immediate_parent_key_value is set to ''
            if (parent_form_name === '') {

                immediate_parent_key_value = '';

                //TODO: insert top parent form values
                EC.db.transaction(_insertTopFormValuesTX, _errorCB, _insertTopFormValuesSuccessCB);

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

                    EC.db.transaction(_insertChildFormValuesTX, _errorCB, _insertChildFormValuesSuccessCB);

                }, function () {
                    //no parent key found on the device, warn user
                    deferred.reject();

                });

            }

        }

    };

    var _insertNewRowSQLSuccessCB = function (the_tx, the_result) {
        console.log('INSERT REMOTE ENTRY SUCCESS');
        console.log(JSON.stringify(the_result));
    };

    var _insertTopFormValuesSuccessCB = function (the_tx, the_result) {

        //update entries counter for the current form (adding new entry, + 1)
        $.when(EC.Update.updateCountersOnEntriesDownload(form_id)).then(function () {
            deferred.resolve();
        });

    };

    var _insertChildFormValuesSuccessCB = function (the_tx, the_result) {

        //update entries counter for the current form (adding new entry, + 1)
        $.when(EC.Update.updateCountersOnEntriesDownload(form_id)).then(function () {
            deferred.resolve();
        });

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

        debugger;

        project_id = the_project_id;
        form_id = the_form_id;
        remote_entry = the_remote_entry;
        self = this;
        deferred = new $.Deferred();

        entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

        //reset array (we might have keys from a previous download)
        local_entries_keys.length = 0;
        //reset counter
        updated_entries_counter = 0;
        //reset inputs array
        inputs.length = 0;

        if (!window.localStorage.dre_local_entries_keys && !window.localStorage.dre_inputs) {

            //get all local primary keys and inputs for the current form before saving the new entries
            EC.db.transaction(_getFormLocalDataTX, _errorCB, _getFormLocalDataSuccessCB);
        } else {

            //local primary keys and inputs are cached, no need to query db
            //TODO
            local_entries_keys = JSON.parse(window.localStorage.dre_local_entries_keys);
            inputs = JSON.parse(window.localStorage.dre_inputs);

            _getFormLocalDataSuccessCB();
        }

        return deferred.promise();

    };

    return module;

}(EC.Create));
