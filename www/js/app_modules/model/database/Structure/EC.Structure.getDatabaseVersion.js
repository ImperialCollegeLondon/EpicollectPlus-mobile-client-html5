var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;
    var version;
    var self = this;

    function _error(error) {
        console.log(error);
        deferred.reject();
    }

    function _getDatabaseVersionSQLSuccess(the_tx, the_result) {

        if (the_result.rows.length > 0) {
            version = the_result.rows[0].version;
        }
    }

    function _getDatabaseVersionTX(tx) {

        var query = 'SELECT version FROM ec_version LIMIT 1';
        tx.executeSql(query, [], _getDatabaseVersionSQLSuccess, _error);
    }

    function _getDatabaseVersionSuccessCB() {
        //check the version and update accordingly (run each update since the db current version)
        deferred.resolve(version);

    }

    /* apply database update */
    module.getDatabaseVersion = function () {

        deferred = new $.Deferred();
        self = this;

        //test if the version table exist
        EC.db.transaction(_getDatabaseVersionTX, _error, _getDatabaseVersionSuccessCB);

        return deferred.promise();
    };

    return module;


}(EC.Structure));




