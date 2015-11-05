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

    function _getQuery() {

        var query;
        query = '';
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

        return query;
    }
    var _insertRemoteBranchDataRowsTX = function (tx) {


        $(branch_rows).each(function (index, row) {

            tx.executeSql(_getQuery(), [
                    row.input_id,
                    row.form_id,
                    row.hierarchy_entry_key_ref,
                    row.hierarchy_entry_key_value,
                    row.position,
                    row.label,
                    row.ref,
                    row.value,
                    row.is_title,
                    row.entry_key,
                    row.type,
                    row.is_data_synced,
                    row.is_media_synced,
                    row.is_cached,
                    row.is_stored,
                    row.created_on,
                    row.is_remote
                ],
                _sqlSuccessCB,
                _errorCB);
        });
    };




    var _sqlSuccessCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    var _insertRemoteBranchDataRowsSuccessCB = function () {
        deferred.resolve();
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    module.insertRemoteBranchDataRows = function (the_rows) {


        branch_rows = the_rows;
        deferred = new $.Deferred();

        EC.db.transaction(_insertRemoteBranchDataRowsTX, _errorCB, _insertRemoteBranchDataRowsSuccessCB);

        return deferred.promise();

    };

    return module;
}(EC.Create));

