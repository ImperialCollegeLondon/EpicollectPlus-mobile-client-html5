/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var project_id;
    var branch_form_names;
    var mapped_branch_forms;
    var deferred;

    var _getBranchFormLocalIDsTX = function (tx) {

        var i;
        var iLength = branch_form_names.length;
        var query = 'SELECT _id, name FROM ec_branch_forms WHERE name=? AND project_id=?';

        for (i = 0; i < iLength; i++) {
            tx.executeSql(query, [branch_form_names[i], project_id], _getBranchFormLocalIDsSQLSuccess, EC.Select.errorCB);
        }

    };

    var _getBranchFormLocalIDsSQLSuccess = function (the_tx, the_result) {

        //map form names against _id
        //TODO: is this right? why are we getting the first row only??
        mapped_branch_forms.push({
            _id: the_result.rows.item(0)._id,
            name: the_result.rows.item(0).name
        });

    };

    var _getBranchFormLocalIDsSuccessCB = function () {

        //return mappped branch forms
        deferred.resolve(mapped_branch_forms);

    };

    module.getBranchFormLocalIDs = function (the_project_id, the_branch_form_names) {

        project_id = the_project_id;
        branch_form_names = the_branch_form_names;
        deferred = new $.Deferred();
        mapped_branch_forms = [];

        EC.db.transaction(_getBranchFormLocalIDsTX, EC.Select.errorCB, _getBranchFormLocalIDsSuccessCB);

        // return promise
        return deferred.promise();

    };

    return module;

}(EC.Select));
