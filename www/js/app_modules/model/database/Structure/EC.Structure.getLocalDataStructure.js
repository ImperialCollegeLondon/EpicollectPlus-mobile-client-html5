/*global $, jQuery*/
/*
 *   @module Structure
 *
 */
var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var form_id;
    var inputs;
    var local_entries_keys;
    var groups;
    var deferred;
    var self;

    var _errorCB = function (the_tx, the_result) {
        console.log(the_tx);
        console.log(the_result);
    };

    //fill in array with all the inputs for the form, this also will get local "_id"s as the inputs are already stored
    var _getFormInputsSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;
        var group_inputs = [];
        var input;

        for (i = 0; i < iLength; i++) {

            input = the_result.rows.item(i);
            inputs.push(input);

            //todo here I can find out if there is a group, so get all the group refs
            if (input.type === EC.Const.GROUP) {
                //grab all the refs for a group
                group_inputs.push(JSON.parse(the_result.rows.item(i).group_inputs));
                groups.push({ref: input.ref, inputs: group_inputs[0]});
            }
        }
    };

    //fill in array with all the locally stored entry keys
    var _getFormPrimaryKeysSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;

        for (i = 0; i < iLength; i++) {
            local_entries_keys.push(the_result.rows.item(i).entry_key);
        }

    };

    //get all primary keys for local entries and all the inputs for the project stored locally
    var _getLocalDataStructureTX = function (tx) {

        var query_entry_key = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';
        var query_inputs = 'SELECT * FROM ec_inputs WHERE form_id=? ORDER BY position';

        tx.executeSql(query_entry_key, [form_id], _getFormPrimaryKeysSQLSuccessCB, self.errorCB);
        tx.executeSql(query_inputs, [form_id], _getFormInputsSQLSuccessCB, self.errorCB);

    };

    var _getLocalDataStructureSuccessCB = function () {
        deferred.resolve(inputs, local_entries_keys, groups);
    };


    module.getLocalDataStructure = function (the_form_id) {

        inputs = [];
        local_entries_keys = [];
        groups = [];
        deferred = new $.Deferred();
        self = this;
        form_id = the_form_id;

        //get all local primary keys and inputs for the current form before saving the new entries
        EC.db.transaction(_getLocalDataStructureTX, _errorCB, _getLocalDataStructureSuccessCB);

        return deferred.promise();
    };


    return module;

}(EC.Structure));
