/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

/**
 * Init application triggering onDeviceReady when both jQuery Mobile and Cordova
 * are ready
 *
 * Also disable console.log() when debugging is off (EC.Const.DEBUG is set manually)
 */
EC.Boot.init = function () {
    'use strict';

    //wait for both JQM pageinit and PG onDeviceReady before doing anything
    var jqmReady = $.Deferred();
    var cordovaReady = $.Deferred();


   //manually trigger ondeviceready on Chrome browser  only
    if (EC.Utils.isChrome()) {
        console.log('deviceready Chrome');
        cordovaReady.resolve();
    }

    //fix JSON.parse bug for old Android V8 Javascript
    JSON.originalParse = JSON.parse;
    JSON.parse = function (text) {

        if (text) {
            return JSON.originalParse(text);
        }
        // no longer crashing on null value but just returning null
        return [];

    };

    //disable console.log if not debugging
    if (EC.Const.DEBUG === 0) {
        console.log = function () {
            //
        };
    }

    //check if we are launching a new instance of the app on the device
    if (!window.sessionStorage.app_loaded && !EC.Utils.isChrome()) {
        window.localStorage.clear();
    }

    //set default server url for projects if no one is defined
    if (window.localStorage.project_server_url === undefined) {
        console.log('EC.Const.EPICOLLECT_SERVER_URL - ' + EC.Const.EPICOLLECT_SERVER_URL);
        window.localStorage.project_server_url = EC.Const.EPICOLLECT_SERVER_URL;
    }


    //resolve when jqm page is ready
    $(document).bind('pageinit', jqmReady.resolve);

    //resolve when Cordova ready
    document.addEventListener('deviceready', cordovaReady.resolve, false);

    // all ready, trigger app!
    $.when(jqmReady, cordovaReady).then(function () {
        console.log('both JQM and Cordova triggered init event');
        EC.Boot.onDeviceReady();
    });

};
