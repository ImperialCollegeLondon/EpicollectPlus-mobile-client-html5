/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

EC.Boot.onDeviceReady = function () {

    'use strict';

    if (!EC.Utils.isChrome()) {

        console.log('OS version: ' + window.device.version);

        //set media dir paths based on platform
        EC.Utils.setMediaDirPaths();

        //request iOS persistent file system
        if (window.device.platform === EC.Const.IOS) {

            //create media folders 'images', 'audios', 'videos'
            $.when(EC.File.createMediaDirs()).then(function () {

                //set iOS app root path at run time as app identifier can change
                EC.Utils.setIOSRootPath();

                //cache persistent storage path
                EC.Utils.setIOSPersistentStoragePath();

            });

        }

        if (window.device.platform === EC.Const.ANDROID) {

            //create Android media folders
            $.when(EC.File.createMediaDirs()).then(function () {
                console.log('Android media folders created');
            });

            navigator.globalization.getLocaleName(function (locale) {

                var device_language = locale.value.substring(0, 2);

                console.log('ANDROID language: ' + JSON.stringify(locale) + '\n');

                console.log(JSON.stringify(Object.keys(EC.Dictionary)));

                //if the device language is not localised default to English
                if (Object.keys(EC.Dictionary).indexOf(device_language) !== -1) {
                    //set language globally getting the first part of locale.value
                    window.localStorage.DEVICE_LANGUAGE = device_language;
                }
                else {
                    //fallback to English as default language
                    window.localStorage.DEVICE_LANGUAGE = 'en';
                }

                EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

            }, function () {
                console.log('Error getting locale\n');

                //fallback to English as default language
                window.localStorage.DEVICE_LANGUAGE = 'en';
                EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

            });
        }

        if (window.device.platform === EC.Const.IOS) {
            navigator.globalization.getPreferredLanguage(function (language) {

                var device_language = language.value.substring(0, 2);

                //if the device language is not localised default to English
                if (Object.keys(EC.Dictionary).indexOf(device_language) !== -1) {
                    //set language globally getting the first part of locale.value
                    window.localStorage.DEVICE_LANGUAGE = device_language;
                }
                else {
                    //fallback to English as default language
                    window.localStorage.DEVICE_LANGUAGE = 'en';
                }

                EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

                console.log('IOS language: ' + language.value + '\n');
            }, function () {
                console.log('Error getting language\n');
                //fallback to English as default language
                window.localStorage.DEVICE_LANGUAGE = 'en';
                EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);
            });
        }

    }
    else {
        //fallback to English as default language
        window.localStorage.DEVICE_LANGUAGE = 'en';
        EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

        //set base URI for debugging on Chrome
        window.localStorage.BASE_URI = window.location.href.replace('index.html', '');

        //replace page title with name of the app (used mostly for GapDebug)
        $.when(EC.Utils.getAppName()).then(function (the_app_name) {
            $(document).prop('title', the_app_name);
        });
    }

    EC.db = EC.Utils.openDatabase();

    //Deal with JQM page events
    EC.Routing.indexPageEvents();
    EC.Routing.inputsPageEvents();
    EC.Routing.branchInputsPageEvents();

    //Bind button states and overlays
    EC.Ui.bindBtnStates();

    //set pagination parameters
    if (!window.localStorage.QUERY_LIMIT) {
        window.localStorage.QUERY_LIMIT = EC.Const.ITEMS_PER_PAGE;
    }
    window.localStorage.QUERY_ENTRIES_OFFSET = 0;
    window.localStorage.QUERY_CHILD_ENTRIES_OFFSET = 0;
    window.localStorage.QUERY_PARENT_ENTRIES_OFFSET = 0;

    window.sessionStorage.app_loaded = 0;

    $(function () {
        FastClick.attach(document.body);
    });

    if (!EC.Utils.isChrome()) {

        document.addEventListener('backbutton', window.onBackButton, false);

        //set the device UUID (depending on platform)
        switch (window.device.platform) {

            //on Android, it is possible to uniquely track a device (at the time of writing,
            // KitKat 4.4.2 is the latest release)
            case EC.Const.ANDROID:
                EC.Utils.setPhoneUUID(device.uuid);
                break;

            case EC.Const.IOS:
                window.IDFVPlugin.getIdentifier(function (result) {
                    console.log('Vendor ID:' + result);
                    EC.Utils.setPhoneUUID(result);
                }, function (error) {
                    console.log(error);
                    EC.Utils.setPhoneUUID('no_ios_id_available');
                });
                break;

        }

    }
    else {
        EC.Utils.setPhoneUUID('Chrome_Beta');
    }

    if (!window.localStorage.project_names) {
        window.localStorage.project_names = JSON.stringify([]);
    }

    //test referrer on Android platform
    if (window.device) {
        if (window.device.platform === EC.Const.ANDROID) {
            window.plugins.appPreferences.fetch(function (value) {
                console.log('Referrer value is ****************************' + value);
            }, function (error) {
                console.log('Referrer value error! ************************' + JSON.stringify(error));
            }, 'referrer');
        }
    }
    EC.Boot.getProjects();
};
