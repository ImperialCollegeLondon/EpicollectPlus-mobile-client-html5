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
            console.log('version table exists');

            //todo get database version
            $.when(EC.Structure.getDatabaseVersion()).then(function (version) {

                //apply update if necessary
                if (version < EC.Const.DATABASE_VERSION) {

                    console.warn('Updating database from version ' + version + ' to ' + EC.Const.DATABASE_VERSION);

                    //this is update from 1 to 2 (we need to make this generic)
                    $.when(self.createGroupTables()).then(function () {
                        deferred.resolve();
                    }, _error);
                }
            });
        }
        else {
            console.log('version table does not exist, creating...');

            //create version table
            $.when(self.createVersionTable()).then(function () {

                //this is update from 1 to 2 (we need to make this generic)
                $.when(self.createGroupTables()).then(function () {
                    deferred.resolve();
                }, _error);

            }, _error);
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




