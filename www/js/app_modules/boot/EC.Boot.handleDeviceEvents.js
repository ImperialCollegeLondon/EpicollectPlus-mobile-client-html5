/* jslint vars: true , nomen: true devel: true, plusplus: true*/
/* global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

EC.Boot.handleDeviceEvents = function () {
    'use strict';
    /**
     * Handle back button on Android devices
     */
    window.onBackButton = function () {

        var page_id = $.mobile.activePage.attr('id');

        //if the current page is the home page and the user press the back button, exit
        // app
        if (page_id === EC.Const.INDEX) {
            navigator.app.exitApp();
        }
        else {

            //check if user pressed back button while doing a barcode scan
            if ((page_id === EC.Const.BARCODE || page_id === EC.Const.BRANCH_PREFIX + EC.Const.BARCODE ) && window.localStorage.is_dismissing_barcode) {
                window.localStorage.removeItem('is_dismissing_barcode');
            }
            else {

                if ((page_id === EC.Const.PHOTO || page_id === EC.Const.BRANCH_PREFIX + EC.Const.PHOTO) && $.swipebox.isOpen) {
                    // close swipebox on back button (Android)
                    $('a#swipebox-close').click();
                }
                else {
                    EC.Routing.goBack(page_id);
                }
            }
            //navigator.app.backHistory();
        }
    }

//handle app resume
    window.onResume = function () {
        console.log('App resumed');
    };
    document.addEventListener('resume', window.onResume, false);
};
