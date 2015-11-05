/**
 * @module EC
 * @submodule GetData
 */

var EC = EC || {};

EC.Select = (function (module) {
    'use strict';

    var project_id;
    var project;
    var deferred;

    var _getProjectByIDTX = function (tx) {
        var query = 'SELECT * FROM ec_projects WHERE _id=?';
        tx.executeSql(query, [project_id], _getProjectByIDSQLSuccess, EC.Select.errorCB);
    };

    var _getProjectByIDSQLSuccess = function (the_tx, the_result) {
        project = the_result.rows.item(0);
    };

    var _getProjectByIDSuccessCB = function () {
        deferred.resolve(project);
    };

    module.getProjectByID = function (the_project_id) {

        project_id = the_project_id;
        deferred = new $.Deferred();

        EC.db.transaction(_getProjectByIDTX, EC.Select.errorCB, _getProjectByIDSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Select));
