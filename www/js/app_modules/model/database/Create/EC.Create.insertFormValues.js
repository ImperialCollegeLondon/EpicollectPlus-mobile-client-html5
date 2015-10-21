var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function (module) {
    'use strict';

    var form_values;
    var entry_key;
    var deferred;

    var _insertFormValuesTX = function (tx) {

        var i;
        var iLength = form_values.length;
        var remote_flag = 0;
        var query;
        var obj;

        for (i = 0; i < iLength; i++) {

            query = '';
            obj = form_values[i];

            //use prepared statements to escape quotes and double quotes

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
            query += 'is_data_synced, ';
            query += 'is_remote, ';
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
            query += '?,';//is_data_synced
            query += '?,';//is_remote
            query += '?);';//is_media_synced

            tx.executeSql(query, [
                obj.input_id,
                obj.form_id,
                obj.position,
                obj.parent,
                obj.label,
                obj.ref,
                obj.value,
                obj.is_title,
                obj.entry_key,
                obj.type,
                obj.created_on,
                obj.is_data_synced,
                remote_flag,
                obj.is_media_synced
            ], _insertFormValuesSQLSuccessCB, _errorCB);

        }//for

    };

    var _insertFormValuesSuccessCB = function () {

        var form_id = form_values[0].form_id;
        console.log('FORM VALUES SAVED SUCCESSFULLY');

        //update entries counter, + 1
        $.when(EC.Update.updateCountersOnSingleEntryInsertion(entry_key, form_id)).then(function (main_form_entry_key) {
            deferred.resolve(main_form_entry_key);
        }, function () {
            deferred.reject();
        });

    };

    var _insertFormValuesSQLSuccessCB = function () {
        console.log('FORM VALUE SQL QUERY SUCCESS');
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    /*
     * Commit a form to database; each value is a row in the table ec_data
     * a single entry get multiple rows
     */
    module.insertFormValues = function (the_form_values, the_key_value) {

        form_values = the_form_values;
        entry_key = the_key_value;
        deferred = new $.Deferred();

        EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Create));
