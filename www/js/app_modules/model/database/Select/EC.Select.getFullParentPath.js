/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function (module) {
    "use strict";

    var parent_form_name;
    var immediate_parent_key_value;
    var full_parent_path;
    var form_id;
    var deferred;

    var _errorCB = function (the_tx, the_result) {
        console.log(the_tx);
        console.log(the_result);
    };

    var _getFullParentPathSQLSuccess = function (the_tx, the_result) {

        //result will be null if no parent is found
        if (the_result.rows.item(0)) {
            full_parent_path = (the_result.rows.item(0).parent);
        }

    };

    var _getFullParentPathSuccessCB = function () {

        //if we have the parent entry for the current entry resolve otherwise reject the promise
        if (full_parent_path !== null) {
            deferred.resolve(full_parent_path);
        } else {
            deferred.reject();
        }

    };

    var _getFullParentPathTX = function (tx) {

        //a parent entry consists of multiple
        var query = 'SELECT parent FROM ec_data WHERE form_id=? AND entry_key=? LIMIT 1';
        tx.executeSql(query, [form_id, immediate_parent_key_value], _getFullParentPathSQLSuccess, _errorCB);

    };

    /* The new hierarchy foreign key constraint feature a parent key like key|key|key...
     * therefore when downloading remote entries, we need to get the full parent path looking up the parent table on the device.
     * If no parent entry is found, the user will be prompted to download from the immediate parent table to keep the referential integrity in the database
     */
    module.getFullParentPath = function (the_form_id, the_immediate_parent_key_value) {

        form_id = the_form_id;
        immediate_parent_key_value = the_immediate_parent_key_value;
        deferred = new $.Deferred();
        full_parent_path = null;

        EC.db.transaction(_getFullParentPathTX, _errorCB, _getFullParentPathSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Select));
