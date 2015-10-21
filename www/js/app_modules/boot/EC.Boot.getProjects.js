/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

EC.Boot.getProjects = function () {
    'use strict';

    function _error(error) {
        console.log(error);
    }

    //hide splashcreen (timeout so we have time to render the project list, 1.5 sec will be enough)
    if (!EC.Utils.isChrome()) {
        if (window.device.platform === EC.Const.IOS) {
            window.setTimeout(function () {
                navigator.splashscreen.hide();
            }, 1500);
        }
    }

    //if database already set, just list projects
    if (parseInt(window.localStorage.is_db_set, 10) === EC.Const.SET) {


        //get database version and update database if necessary
        $.when(EC.Structure.doesVersionTableExist()).then(function () {
            console.log('ec_version table exists');

            //ec_version table exist, check version and update if necessary
            //todo there is not this option now as all the apps shipped do not have that table ;)
            //todo get database version
            $.when(EC.Structure.getDatabaseVersion()).then(function (version) {

                //apply update if necessary
                if (version < EC.Const.DATABASE_VERSION) {

                    console.warn('Updating database from version ' + version + ' to ' + EC.Const.DATABASE_VERSION);

                    //this is update from 1 to 2 (we need to make this generic)
                    $.when(EC.Structure.createGroupInputsTables()).then(function () {
                        console.log('getting list');
                        EC.Project.getList();
                    }, _error);
                }
                else {
                    console.log('getting list');
                    EC.Project.getList();
                }
            });


        }, function () {
            console.log('ec_version table does not exists, creating...');

            //ec_version table does not exist, create it and set version to EC.Const.DATABASE_VERSION
            $.when(EC.Structure.createVersionTable()).then(function () {
                //ec_version table created successfully

                //add group tables
                $.when(EC.Structure.createGroupInputsTables()).then(function () {
                    // group tables created

                    console.log('getting list');
                    EC.Project.getList();


                }, _error);
            }, _error);
        });
    }
    else {

        //Initialise database BEFORE listing empty project view
        $.when(EC.Structure.createSQLiteDatabase()).then(function () {

            //database is set
            window.localStorage.is_db_set = EC.Const.SET;
            //window.localStorage.stress_test = EC.Const.SET;
            EC.Project.getList();
        });
    }
};
