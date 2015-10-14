var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;

    //Query to create version table (single row to store db version)
    var cq_ec_version = ['', //
        'CREATE TABLE IF NOT EXISTS "ec_version" (', //
        ' "_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,', //
        '"version" INT);'//
    ].join('');

    var iq_version = 'INSERT INTO ec_version (version) VALUES (' + EC.Const.DATABASE_VERSION + ');';


    module.createVersionTable = function () {

        deferred = new $.Deferred();

        function _createVersionTableError(error) {
            deferred.reject(error);

        }

        function _createVersionTableSuccess() {
            deferred.resolve();
        }

        EC.db.transaction(function (tx) {
                tx.executeSql(cq_ec_version);
                tx.executeSql(iq_version);
            },
            _createVersionTableError,
            _createVersionTableSuccess);

        return deferred.promise();
    };

    return module;

}(EC.Structure));
