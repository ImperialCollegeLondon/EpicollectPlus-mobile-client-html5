var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;

    //Query to create ec_group_inputs table
    var cq_ec_group_inputs = ['', //
        'CREATE  TABLE IF NOT EXISTS "ec_group_inputs" (', //
        '"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , ', //
        '"input_id" INTEGER NOT NULL , ', //
        '"ref" TEXT,', //
        '"position" INTEGER,', //
        '"label" TEXT,', //
        '"default_value" TEXT,', //
        '"type" TEXT, ', //
        '"has_double_check" INTEGER,', //
        '"max_range" TEXT,', //
        '"min_range" TEXT , ', //
        '"is_required" INTEGER, ', //
        '"regex" TEXT, ', //
        '"datetime_format" TEXT,', //
        'FOREIGN KEY ("input_id") REFERENCES ec_inputs(_id) ON DELETE CASCADE ON ',
        'UPDATE CASCADE', //
        ');'//
    ].join('');

    //Query to create ec_group_input_options table
    var cq_ec_group_input_options = ['', //
        'CREATE TABLE IF NOT EXISTS "ec_group_input_options" (', //
        '"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
        '"input_id" INTEGER NOT NULL , ', //
        '"ref" TEXT NOT NULL ,', //
        '"label" TEXT NOT NULL ,', //
        '"value" TEXT NOT NULL , ', //
        'FOREIGN KEY ("input_id") REFERENCES ec_group_inputs("_id") ON DELETE CASCADE ON ',
        'UPDATE CASCADE', //
        ');'//
    ].join('');

    function _createGroupInputsTablesError(error) {
        deferred.reject(error);
    }

    function _createGroupInputsTablesSuccess() {
        deferred.resolve();
    }

    //create only group tables, for a device with the old app already installed
    module.createGroupInputsTables = function () {

        deferred = new $.Deferred();

        function _createVersionTableError() {
            deferred.resolve();
        }

        function _createVersionTableSuccess(error) {
            deferred.reject(error);
        }

        EC.db.transaction(function (tx) {
                tx.executeSql(cq_ec_group_inputs);
                tx.executeSql(cq_ec_group_input_options);
            },
            _createGroupInputsTablesError,
            _createGroupInputsTablesSuccess);

        return deferred.promise();
    };

    return module;

}(EC.Structure));
