/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Create
 *
 */

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var branch_rows;
    var deferred;
    var mapped_branch_forms;
    var mapped_input_ids;

    var _getLocalBranchFormID = function (the_name) {

        var i;
        var _id;

        for (i = 0; i < mapped_branch_forms.length; i++) {

            if (mapped_branch_forms[i].name === the_name) {

                _id = mapped_branch_forms[i]._id;
                break;
            }
        }

        return _id;

    };

    var _getLocalBranchInputID = function (the_ref) {

        var i;
        var _id;

        for (i = 0; i < mapped_input_ids.length; i++) {

            if (mapped_input_ids[i].ref === the_ref) {

                _id = mapped_input_ids[i]._id;
                break;
            }
        }

        return _id;

    };

    var _insertBranchDataRowsTX = function (tx) {

        var i;
        var iLength = branch_rows.length;
        var query = '';
        var obj = {};
        var local_branch_form_id;
        var local_branch_input_id;

        for (i = 0; i < iLength; i++) {

            query = '';
            obj = branch_rows[i];

            //use current local ids for forms and inputs to match the foreign key constraint
            local_branch_form_id = _getLocalBranchFormID(obj.name);
            local_branch_input_id = _getLocalBranchInputID(obj.ref);

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
            query += 'VALUES ("';

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
                local_branch_input_id,
                local_branch_form_id,
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
                obj.is_cached,
                obj.is_stored,
                obj.created_on,
                obj.remote_flag
            ], _insertBranchFormValuesSQLSuccessCB, _errorCB);
        }

    };

    var _insertBranchFormValuesSQLSuccessCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    var _insertBranchDataRowsSuccessCB = function () {
        deferred.resolve();
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    module.insertBranchDataRows = function (the_branch_forms_data, the_mapped_branch_forms, the_mapped_input_ids) {

        branch_rows = the_branch_forms_data.branch_data_rows;
        mapped_branch_forms = the_mapped_branch_forms;
        mapped_input_ids = the_mapped_input_ids;
        deferred = new $.Deferred();

        EC.db.transaction(_insertBranchDataRowsTX, _errorCB, _insertBranchDataRowsSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Create));
