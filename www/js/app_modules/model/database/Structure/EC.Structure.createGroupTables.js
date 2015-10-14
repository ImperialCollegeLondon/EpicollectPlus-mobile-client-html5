var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = (function (module) {
    'use strict';

    var deferred;

    //Query to create ec_group_inputs table
    var cq_ec_group_inputs = ['', //
        'CREATE  TABLE IF NOT EXISTS "ec_group_inputs" (', //
        '"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , ', //
        '"form_id" INTEGER NOT NULL , ', //
        '"ref" TEXT,', //
        '"position" INTEGER,', //
        '"label" TEXT,', //
        '"default_value" TEXT,', //
        '"type" TEXT, ', //
        '"is_primary_key" INTEGER,', //
        '"is_genkey" INTEGER,', //
        '"has_double_check" INTEGER,', //
        '"max_range" TEXT,', //
        '"min_range" TEXT , ', //
        '"is_required" INTEGER, ', //
        '"is_title" INTEGER,', //
        '"is_server_local" INTEGER,', //
        '"is_searchable" TEXT, ', //
        '"regex" TEXT, ', //
        '"datetime_format" TEXT,', //
        'FOREIGN KEY ("form_id") REFERENCES ec_forms(_id) ON DELETE CASCADE ON ',
        // //
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
        // //
        'UPDATE CASCADE', //
        ');'//
    ].join('');

    function _createGroupTablesError(error) {
        deferred.reject(error);
    }

    function _createGroupTablesSuccess() {
        deferred.resolve();
    }

    //create only group tables, for a device with the old app already installed
    module.createGroupTables = function () {

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
            _createGroupTablesError,
            _createGroupTablesSuccess);

        return deferred.promise();
    };

    return module;

}(EC.Structure));
