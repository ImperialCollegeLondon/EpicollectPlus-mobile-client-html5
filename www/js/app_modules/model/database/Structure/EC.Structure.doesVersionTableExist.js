var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;
    var exist;
    var version;
    var self = this;

    function _error(error) {
        console.log(error);
        deferred.reject();
    }

    function _doesVersionTableExistSQLSuccess(the_tx, the_result) {

        if (the_result.rows.length > 0) {
            if (the_result.rows[0].name === EC.Const.EC_VERSION_TABLE) {
                exist = true;
            }
        }
    }

    function _doesVersionTableExist(tx) {

        var query = 'SELECT * FROM sqlite_master WHERE name="ec_version" AND type="table";';
        tx.executeSql(query, [], _doesVersionTableExistSQLSuccess, _error);
    }

    function _doesVersionTableExistSuccessCB() {
        //check the version and update accordingly (run each update since the db current version)

        if (exist) {
            deferred.resolve();
        }
        else {
            deferred.reject();
        }
    }

    /* apply database update */
    module.doesVersionTableExist = function () {

        deferred = new $.Deferred();
        self = this;
        exist = false;

        //test if the version table exist
        EC.db.transaction(_doesVersionTableExist, _error, _doesVersionTableExistSuccessCB);

        return deferred.promise();
    };

    return module;


}(EC.Structure));




