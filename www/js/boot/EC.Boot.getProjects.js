/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

EC.Boot.getProjects = function () {
    'use strict';

    //if database already set, just list projects
    if (window.localStorage.is_db_set === EC.Const.SET) {
        console.log('getting list');
        EC.Project.getList();
    }
    else {

        //Initialise database BEFORE listing empty project view
        $.when(EC.DBAdapter.init()).then(function () {

            //database is set
            window.localStorage.is_db_set = '1';
            window.localStorage.stress_test = 1;
            EC.Project.getList();
        });
    }
}
