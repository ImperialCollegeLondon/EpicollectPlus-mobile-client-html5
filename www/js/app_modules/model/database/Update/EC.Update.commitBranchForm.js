/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = (function (module) {
    'use strict';

    var self;
    var form_values;
    var form_id;
    var deferred;

    var _insertFormValuesTX = function (tx) {

        var i;
        var query;
        var obj;
        var iLength = form_values.length;

        for (i = 0; i < iLength; i++) {

            query = '';
            obj = form_values[i];

            //convert array to csv value (for checkboxes when multiple values are selected)
            if (Object.prototype.toString.call(obj.value) === '[object Array]') {
                obj.value = obj.value.join(', ');
            }

            query = 'UPDATE ec_branch_data SET value=? WHERE _id=?';

            tx.executeSql(query, [obj.value, obj._id], _insertFormValuesSQLSuccessCB, _errorCB);

        }
    };

    var _insertFormValuesSQLSuccessCB = function (the_tx, the_result) {
    };

    var _insertFormValuesSuccessCB = function () {
        deferred.resolve();
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
        console.log('Error updating branch data');
        deferred.reject();
    };

    /**
     *
     * @param {Object} the_form_values: the values to update
     */
    module.commitBranchForm = function (the_form_values) {

        form_values = the_form_values;
        deferred = new $.Deferred();

        EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

        return deferred.promise();
    };

    return module;

}(EC.Update));
