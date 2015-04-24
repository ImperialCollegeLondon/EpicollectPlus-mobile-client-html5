/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, FastClick, LocalFileSystem, ActivityIndicator */

/*
 * Define global namespace EC (Epicollect)
 */
var EC = EC || {};
EC.db = EC.db || {};

//init app
EC.Boot.init();

//attach global handler to be used when opening app using custom scheme
// epicollect5://key=value
window.localStorage.autoload_project_url = '';
window.handleOpenURL = function (url) {
    'use strict';

    console.log('handleOpenURL called with ' + url);

    var project_name_parts;
    var project_name;

    if (url) {

        project_name_parts = url.split('://project?');
        //project_name = url.replace('epicollect5://project?', '');
        project_name = project_name_parts[1];
        project_name = 'http://' + project_name;
        window.localStorage.autoload_project_url = project_name;

        EC.Boot.getProjects();
    }
};


/**
 * Handle back button on Android devices
 */
function onBackButton() {
    'use strict';

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
document.addEventListener('resume', onResume, false);
function onResume() {
    'use strict';
    console.log('App resumed');
}

