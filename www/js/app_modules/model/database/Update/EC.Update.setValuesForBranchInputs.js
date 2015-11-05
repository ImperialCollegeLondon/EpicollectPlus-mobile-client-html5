var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = (function (module) {
    'use strict';

    var self;
    var branch_values;
    var form_id;
    var deferred;

    var _updateHierarchyEntryValuesSQLSuccessCB = function (the_tx, the_result) {

    };

    var _setValuesForBranchInputsTX = function (tx) {

        var query = 'UPDATE ec_data SET value=? WHERE form_id=? AND ref=?';

        debugger;
        $(branch_values).each(function (index, value) {

            var input_value = value.input_ref + '_form,' + value.total;

            tx.executeSql(query, [input_value, form_id, value.input_ref], _updateHierarchyEntryValuesSQLSuccessCB, _errorCB);
        });
    };

    var _setValuesForBranchInputsSuccessCB = function () {
        deferred.resolve();
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    module.setValuesForBranchInputs = function (the_form_id, the_branch_values) {

        self = this;
        deferred = new $.Deferred();
        branch_values = the_branch_values;
        form_id = the_form_id;

        EC.db.transaction(_setValuesForBranchInputsTX, _errorCB, _setValuesForBranchInputsSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Update));
