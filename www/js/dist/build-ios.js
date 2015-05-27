/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = window.EC || {};
EC.Boot = EC.Boot || {};

EC.Boot.getProjects = function () {
    'use strict';

    //hide splashcreen (timeout so we have time to render the project list, 1.5 sec will be enough)
    if (!EC.Utils.isChrome()) {
        if (window.device.platform === EC.Const.IOS) {
            window.setTimeout(function () {
                navigator.splashscreen.hide();
            }, 1500);
        }
    }

    //if database already set, just list projects
    if (window.localStorage.is_db_set === EC.Const.SET) {
        console.log('getting list');
        EC.Project.getList();
    }
    else {

        //Initialise database BEFORE listing empty project view
        $.when(EC.DBAdapter.init()).then(function () {

            //database is set
            window.localStorage.is_db_set = EC.Const.SET;
            //window.localStorage.stress_test = EC.Const.SET;
            EC.Project.getList();
        });
    }
}

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

        var page_id = $.mobile.activePage.attr('id');

        /*
         this condition can be true when we either go back to the Photo page after a picture taken or after having opened the gallery
         we need to check if the cached file is still there, as from the gallery app it is possible to delete it.
         If the file gets deleted, set cache to empty and refresh the view.
         When the picture is taken, file is there
         When the user cancelled the camera/gallery action, file is there

         */
        if (page_id === EC.Const.PHOTO) {

            //check if image file exist
            //todo get hold of file with cordova file api
            //EC.File.wasImageDeleted(EC.InputTy)

        }


    };
    document.addEventListener('resume', window.onResume, false);
};

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

    //handle device events
    EC.Boot.handleDeviceEvents();

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

    //attach global handler to be used when opening app using custom scheme
    //scheme://key=value
    window.localStorage.autoload_project_url = '';
    window.handleOpenURL = function (url) {

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

    // all ready, trigger app!
    $.when(jqmReady, cordovaReady).then(function () {
        console.log('both JQM and Cordova triggered init event');
        EC.Boot.onDeviceReady();
    });

};

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
                $.when(EC.Utils.getPackageName()).then(function (package_name) {
                    EC.Const.ANDROID_APP_PRIVATE_URI += package_name;
                    console.log('Android media folders created for ' + package_name);
                });
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

/*global $, jQuery, cordova, device, ActivityIndicator*/

var EC = EC || {};
EC.Notification = EC.Notification || {};
EC.Notification = (function () {
    'use strict';

    /*
     *	Display native alert popup based on the platform we are running the
     * app on
     */
    var showAlert = function (the_title, the_message) {
        if (navigator.notification && !EC.Utils.isChrome()) {
            navigator.notification.alert(the_message, null, the_title, 'ok');
        } else {
            alert(the_title ? the_title + ': ' + the_message : the_message);
        }

    };

    var askConfirm = function (the_title, the_message, onConfirmCallback, has_data_to_save, the_current_input, is_branch) {

        var current_input = the_current_input;
        var response;

        if (navigator.notification && !EC.Utils.isChrome()) {

            var _confirmCallback = function (btn_index) {
                console.log('btn_index: ' + btn_index);

                if (btn_index === 1) {
                    EC.Utils.executeFunctionByName(onConfirmCallback, window);
                } else {
                    return;
                }
            };

            var _saveConfirmCallback = function (btn_index) {

                switch (btn_index) {

                    case 1:
                        //exit without saving current form data
                        EC.Utils.executeFunctionByName(onConfirmCallback, window);
                        break;

                    case 2:
                        //save data before leaving form
                        EC.Notification.showProgressDialog();

                        if (is_branch) {
                            EC.BranchInputs.saveValuesOnExit(current_input);
                        } else {
                            EC.Inputs.saveValuesOnExit(current_input);
                        }

                        break;
                    default:
                        return;
                }

            };

            //cordova async confirm
            if (has_data_to_save) {
                //we have a third option: save the data before exiting
                navigator.notification.confirm(the_message, _saveConfirmCallback, the_title, [EC.Localise.getTranslation('no'), EC.Localise.getTranslation('save'), EC.Localise.getTranslation('dismiss')]);
            } else {
                //normal confirmation just 2 options (Android and iOS options
                // order is inverted, use iOS order)

                if (window.device.platform === EC.Const.IOS) {
                    navigator.notification.confirm(the_message, _confirmCallback, the_title, [EC.Localise.getTranslation('confirm'), EC.Localise.getTranslation('dismiss')]);
                }

                if (window.device.platform === EC.Const.ANDROID) {
                    navigator.notification.confirm(the_message, _confirmCallback, the_title, [EC.Localise.getTranslation('confirm'), EC.Localise.getTranslation('dismiss')]);
                }

            }

        } else {

            //standard javascript confirm, synced call
            response = confirm(the_title ? the_title + ': ' + the_message : the_message);
            if (response) {
                EC.Utils.executeFunctionByName(onConfirmCallback, window);
            } else {
                return;
            }
        }

    };

    /*
     * Show a native toast notification (All platforms)
     */
    var showToast = function (text, duration) {

        var toasts;

        //show only an alert when testing on browser
        if (EC.Utils.isChrome()) {
            alert(text);
            return;
        }

        window.plugins.toast.show(text, duration, 'bottom', function (a) {
            // console.log('toast success: ' + a);
        }, function (b) {
            alert('toast error: ' + b);
        });

    };

    /*
     * Show a progress dialog (spinning loader)
     */
    var showProgressDialog = function (the_title, the_message) {

        var title = the_title;
        var message = the_message;
        var ActivityIndicator;

        if (EC.Utils.isChrome()) {

            $.mobile.loading('show', {
                text: the_message,
                textVisible: true,
                theme: 'a',
                html: ''
            });

        } else {

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    navigator.notification.activityStart(title || '', message || 'Loading...');
                    break;

                case EC.Const.IOS:

                    window.ActivityIndicator.show(message);
                    break;

            }
        }

    };

    /*
     * Hide progress dialog
     */
    var hideProgressDialog = function () {

        var ActivityIndicator;

        if (EC.Utils.isChrome()) {

            $.mobile.loading('hide');
            return;

        }

        console.log('Platform: ' + device.platform);

        switch (window.device.platform) {

            case EC.Const.ANDROID:
                /*
                 * here we use a timeout as the activityStop() is buggy,
                 * sometimes does not trigger if other js code is running.
                 * Setting a timeout seems to fix the problems
                 */
                window.setTimeout(function () {
                    navigator.notification.activityStop();
                }, 500);
                break;

            case EC.Const.IOS:

                if (window.ActivityIndicator) {

                    //if edit mode remove it without timeout
                    if (window.localStorage.edit_mode) {
                        window.ActivityIndicator.hide();
                    } else {
                        window.setTimeout(function () {
                            window.ActivityIndicator.hide();
                        }, 500);
                    }

                }

                break;

        }
    };

    return {
        showAlert: showAlert,
        askConfirm: askConfirm,
        showToast: showToast,
        showProgressDialog: showProgressDialog,
        hideProgressDialog: hideProgressDialog
    };

}());

/* jslint vars: true , nomen: true devel: true, plusplus: true*/
/* global $, jQuery*/
var EC = EC || {};
EC.Ui = EC.Ui || {};
EC.Ui = {

  

    colors: {
        tap_action_overlay: '#2a6fc3',
        default_button_background: '#EEEEEE',
        list_item_background: '#DDDDDD',
        fa_entry_value_embedded_btn_default: '#000000'
    },

    bindBtnStates: function () {
        'use strict';
        
        var _this = this;

        //bind events to apply hover effect on buttons (Action Bar)
        $(document).on('vmousedown', 'div.ui-btn-right', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'div.ui-btn-right', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background', 'none');

        });

        //bind events to apply hover effect on action buttons large (Action Bar top left)
        $(document).on('vmousedown', 'div.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'div.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background", "none");

        });

        //bind events to apply hover effect on navigation list item (sidebar options)
        $(document).on('vmousedown', 'li.v-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.v-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.list_item_background);

        });

        //bind events to apply hover effect on autocomplete list items
        $(document).on('vmousedown', 'li.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.list_item_background);

        });

        // //bind events to apply hover effect on navbar(secondary navigation)
        $(document).on('vmousedown', 'li.inactive-tab', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.inactive-tab', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.default_button_background);

        });

        //bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
        $(document).on('vmousedown', '.input-prev-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.input-prev-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.default_button_background);

        });

        //bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
        $(document).on('vmousedown', '.input-next-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.input-next-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.default_button_background);

        });

        //bind events to apply hover effect on embedded buttons
        $(document).on('vmousedown', 'div.embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'div.embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.default_button_background);

        });

        //bind events to apply hover effect on embedded buttons
        $(document).on('vmousedown', 'i.fa-ep-entry-value-embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'i.fa-ep-entry-value-embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("color", _this.colors.fa_entry_value_embedded_btn_default);

        });

        //bind events to apply hover effect on "show more" buttons
        $(document).on('vmousedown', '.more-items-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.more-items-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css("background-color", _this.colors.default_button_background);

        });

    }
};


/*global $, jQuery, cordova, Connection, LocalFileSystem*/

var EC = EC || {};
EC.Utils = EC.Utils || {};
EC.Utils = (function () {
    'use strict';

    var UUID;
    var project = {};
    var forms = [];

    //UUID is the phone ID set by Phonegap (see Phonegap docs)
    var setPhoneUUID = function (the_uuid) {
        this.UUID = the_uuid;
        console.log('device UUID: ' + this.UUID);
    };

    var getPhoneUUID = function () {
        return this.UUID;
    };

    //return a v4 GUID
    var _generateGUID = function () {
        var d = new Date().getTime();
        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
        return guid;
    };

    //auto gen key is based ion GUID v4
    var getGenKey = function () {
        //auto generate a unique key in the form <guid>_<timestamp>
        return _generateGUID();
    };

    //return UNIX Epoch timestamp (seconds, 10 digits)
    var getTimestamp = function () {
        return Math.floor((new Date().getTime()) / 1000);
    };

    //open db based on platform
    var openDatabase = function () {

        if (EC.Utils.isChrome()) {
            console.log('chrome websql db init');
            //Chrome Chrome
            return window.openDatabase('epicollect', '1.0', 'Epicollect', 5 * 1024 * 1024);

        }

        console.log('native SQLite db init');

        //native implementation via SQLite plugin
        return window.sqlitePlugin.openDatabase({
            name: 'epicollect.db'
        });
        //return window.sqlitePlugin.openDatabase({name: 'epicollect',
        // bgType: 0});

    };

    //check if the environment is the Chrome browser (using feature detection
    // http://goo.gl/x4jcS) so we will have to trigger deviceready manually
    // and also NOT call any Phonegap functions
    var isChrome = function () {
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
        return !!window.chrome && !isOpera;
    };


    var sleep = function (milliseconds) {

        var i;
        var start = new Date().getTime();
        for (i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    };

    /*
     * Parse the specified date format(Timestamp mask) to POSIX standards
     * (DateBox)
     */
    var parseTimestampDate2Posix = function (the_format, the_type) {

        var format = the_format;
        var type = the_type;
        var elements;
        var formatted_elements = [];
        var i;
        var iLength;

        //split format based on its type
        elements = (type === 'date') ? format.split('/') : format.split(':');

        iLength = elements.length;
        for (i = 0; i < iLength; i++) {

            switch (elements[i]) {

                case 'dd':
                    formatted_elements.push('%d');
                    break;

                case 'MM':
                    formatted_elements.push('%m');
                    break;

                case 'yyyy':
                    formatted_elements.push('%Y');
                    break;

                case 'YYYY':
                    formatted_elements.push('%Y');
                    break;

                //hours in 24 format
                case 'HH':
                    formatted_elements.push('%H');
                    break;

                //hours in 12 format
                case 'hh':
                    formatted_elements.push('%I');
                    break;

                case 'mm':
                    formatted_elements.push('%M');
                    break;

                case 'ss':
                    formatted_elements.push('%S');
                    break;
            }//switch

        }//for

        return (type === 'date') ? formatted_elements.join('/') : formatted_elements.join(':');

    };

    /** Parse a JS date according to the specified format.
     *  On Android, date is returned by the datePicker Phonegap plugin in the
     * form of yyyy/mm/dd
     *  and it is converted to a javascript date
     *
     *  @param {the_date} a JS Date object
     *  @param {the_format} the format to parse the date to for presentation
     *  Returns the formatted string
     */
    var parseDate = function (the_date, the_format) {

        var date = the_date;
        var format = the_format;
        var day = date.getDate();
        var month = date.getMonth() + 1;
        //months start from 0
        var year = date.getFullYear();

        var format_parts = format.split('/');
        var parsed_date_parts = [];
        var i;
        var iLength = format_parts.length;

        for (i = 0; i < iLength; i++) {

            switch (format_parts[i]) {

                case 'dd':
                    parsed_date_parts.push(day);
                    break;
                case 'MM':
                    parsed_date_parts.push(month);
                    break;
                case 'yyyy':
                    parsed_date_parts.push(year);
                    break;
            }

        }

        return parsed_date_parts.join('/');

    };

    /**
     * Parse an iOS input type='date' value according to the specified
     * format.
     * The HTML5 date input specification [1] refers to the RFC3339
     * specification [2], which specifies a full-date     format equal to:
     * yyyy-mm-dd
     * Returns the formatted string
     */
    var parseIOSDate = function (the_ios_date, the_format) {

        var date = the_ios_date;
        var date_parts = date.split('-');
        var format = the_format;
        var day = date_parts[2];
        var month = date_parts[1];
        var year = date_parts[0];

        var format_parts = format.split('/');
        var parsed_date_parts = [];
        var i;
        var iLength = format_parts.length;

        for (i = 0; i < iLength; i++) {

            switch (format_parts[i]) {

                case 'dd':
                    parsed_date_parts.push(day);
                    break;
                case 'MM':
                    parsed_date_parts.push(month);
                    break;
                case 'yyyy':
                    parsed_date_parts.push(year);
                    break;
            }

        }

        return parsed_date_parts.join('/');

    };

    //Parse time according to the specified format. Returns the formatted
    // time string
    var parseTime = function (the_date, the_format) {

        var date = the_date;
        var format = the_format;
        var hours24 = date.getHours();
        var hours12 = ((hours24 + 11) % 12) + 1;
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();

        var format_parts = format.split(':');
        var parsed_date_parts = [];
        var i;
        var iLength = format_parts.length;

        var _addZero = function (num) {
            return (num >= 0 && num < 10) ? '0' + num : num;
        };
        for (i = 0; i < iLength; i++) {
            switch (format_parts[i]) {
                case 'hh':
                    parsed_date_parts.push(hours12);
                    break;
                case 'HH':
                    parsed_date_parts.push(_addZero(hours24));
                    break;
                case 'mm':
                    parsed_date_parts.push(_addZero(minutes));
                    break;
                case 'ss':
                    parsed_date_parts.push(_addZero(seconds));
                    break;
            }
        }
        return parsed_date_parts.join(':');
    };

    /**
     * Parse time according to the specified format.
     * @param {the_ios_time} time in the form HH:mm:ss
     * @para, {the_format} format to display time
     * Returns the formatted time string
     */
    var parseIOSTime = function (the_ios_time, the_format) {

        var time = the_ios_time;
        var format = the_format;

        var time_parts = time.split(':');

        var hours24 = parseInt(time_parts[0], 10);
        var hours12 = ((hours24 + 11) % 12) + 1;
        var minutes = parseInt(time_parts[1], 10);
        var seconds = parseInt(time_parts[2], 10);

        var format_parts = format.split(':');
        var parsed_date_parts = [];
        var i;
        var iLength = format_parts.length;

        var _addZero = function (num) {
            return (num >= 0 && num < 10) ? '0' + num : num;
        };
        for (i = 0; i < iLength; i++) {
            switch (format_parts[i]) {
                case 'hh':
                    parsed_date_parts.push(hours12);
                    break;
                case 'HH':
                    parsed_date_parts.push(_addZero(hours24));
                    break;
                case 'mm':
                    parsed_date_parts.push(_addZero(minutes));
                    break;
                case 'ss':
                    parsed_date_parts.push(_addZero(seconds));
                    break;
            }
        }
        return parsed_date_parts.join(':');
    };

    var setProject = function (the_project) {

        this.project = the_project;
    };

    var getProject = function () {

        return this.project;
    };

    var setForms = function (the_forms) {

        this.forms = the_forms;

        window.localStorage.forms = JSON.stringify(this.forms);

    };

    /*
     * form tree is defined by @num sequence, i.e form num=2 is always the
     * child of form num=1 and so on
     *
     * @return an object { parent: <id>, pname: <parent name>, child: <id>,
     * cname: <child name>} with an id of 0 if parent or
     * child is not applicable
     */
    var getParentAndChildForms = function (the_form_id) {

        //get forms object if it is not defined
        this.forms = this.forms || JSON.parse(window.localStorage.forms);

        var form_id = parseInt(the_form_id, 10);
        var i;
        var iLength = this.forms.length;
        var parent_form_id;
        var parent_form_name;
        var child_form_id;
        var child_form_name;

        for (i = 0; i < iLength; i++) {

            //get current form num
            if (parseInt(this.forms[i]._id, 10) === form_id) {

                if (i - 1 === -1) {
                    //return 0 if this is the top parent form in the tree
                    parent_form_id = 0;
                    parent_form_name = '';

                }
                else {
                    parent_form_id = this.forms[i - 1]._id;
                    parent_form_name = this.forms[i - 1].name;
                }

                if (i + 1 === iLength) {

                    child_form_id = 0;
                    child_form_name = '';

                }
                else {
                    //return 0 if this is the bottom child in the tree
                    child_form_id = this.forms[i + 1]._id;
                    child_form_name = this.forms[i + 1].name;
                }

                return {
                    parent: parent_form_id,
                    pname: parent_form_name,
                    child: child_form_id,
                    cname: child_form_name
                };

            }

        }//for

    };

    /*
     * Parse location string returning a json object with all the properties
     * in the form property: value
     *
     * Also remove any new line or carriage return from the values
     *
     * if the value is skipped, return an object with empty properties
     */
    var parseLocationString = function (the_string) {

        var string = the_string;
        var coords = {};
        var temp_array = string.split(',');


        if (temp_array[0] === EC.Const.SKIPPED) {
            coords.latitude = '';
            coords.longitude = '';
            coords.altitude = '';
            coords.accuracy = '';
            coords.heading = '';

        }
        else {
            coords.latitude = parseFloat(temp_array[0].replace('Latitude: ', '').replace(/(\r\n|\n|\r)/gm, ''));
            coords.longitude = parseFloat(temp_array[1].replace('Longitude: ', '').replace(/(\r\n|\n|\r)/gm, ''));
            coords.altitude = parseFloat(temp_array[2].replace('Altitude: ', '').replace(/(\r\n|\n|\r)/gm, ''));
            coords.accuracy = parseFloat(temp_array[3].replace('Accuracy: ', '').replace(/(\r\n|\n|\r)/gm, ''));
            coords.heading = parseFloat(temp_array[5].replace('Heading: ', '').replace(/(\r\n|\n|\r)/gm, ''));

            //remove NAN todo better find a new way...
            coords.latitude = isNaN(coords.latitude) ? '' : coords.latitude;
            coords.longitude = isNaN(coords.longitude) ? '' : coords.longitude;
            coords.altitude = isNaN(coords.altitude) ? '' : coords.altitude;
            coords.accuracy = isNaN(coords.accuracy) ? '' : coords.accuracy;
            coords.heading = isNaN(coords.heading) ? '' : coords.heading;
        }

        return coords;
    };

    //test is astring is a valid URL
    var isURL = function (the_string) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        return regexp.test(the_string);
    };

    var isValidEmail = function (the_email) {
        var re = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
        return re.test(the_email);
    };

    var getForms = function () {
        return this.forms;
    };

    var isGPSEnabled = function () {

        var is_gps_enabled = true;
        var deferred = new $.Deferred();

        function _onGpsChecked(isEnabled) {
            console.log('gps is ' + isEnabled);
            if (!isEnabled) {
                deferred.reject();
            }
            else {
                deferred.resolve();
            }
        }

        if (!EC.Utils.isChrome()) {

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    cordova.plugins.diagnostic.isLocationEnabled(_onGpsChecked);
                    break;
                case EC.Const.IOS:
                    //TODO: resolve until we have a way to get this via
                    // Cordova, maybe allowing location at the beginning is
                    // enough
                    deferred.resolve();
                    break;
            }
        }
        return deferred.promise();
    };

    //execute a function passing its full namespaced name (and window as
    // context) form_tr
    //http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
    var executeFunctionByName = function (functionName, context /*, args */) {

        var i;
        var args = Array.prototype.slice.call(arguments).splice(2);
        var namespaces = functionName.split('.');
        var func = namespaces.pop();
        for (i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }
        return context[func].apply(this, args);
    };

    /*
     * When jumps are defined in the xml they are a comma separated list of
     * values like:
     *
     * ecplus_University_ctrl16,1,ecplus_University_ctrl16,!1
     *
     * odd item is identifier to jump to
     * even element is the INDEX of the value (starting from 1) that trigger
     * the jump for RADIO and DROPDOWN
     * for CHECKBOX, the even element is  bizzarely the VALUE that trigger
     * the jump (not the INDEX). Go figure
     * the '!' will define the jump logic (is/is not)
     * END means the end off the form
     * ALL means jump always
     *
     */
    var parseJumpString = function (the_jump_string) {

        var raw_jumps;
        var parsed_jumps = [];
        var i;
        var iLength;
        var obj;

        raw_jumps = the_jump_string.split(',');
        iLength = raw_jumps.length;

        for (i = 0; i < iLength; i += 2) {

            obj = {};

            //even element is a jump destination, as @ref
            obj.jump_to = raw_jumps[i];

            if (raw_jumps[i + 1].charAt(0) === '!') {

                obj.jump_when = EC.Const.JUMP_VALUE_IS_NOT;
                obj.jump_value = raw_jumps[i + 1].substr(1);

            }
            else {

                switch (raw_jumps[i + 1]) {

                    case EC.Const.JUMP_ALWAYS:
                        obj.jump_when = EC.Const.JUMP_ALWAYS;
                        obj.jump_value = '';
                        break;

                    case EC.Const.JUMP_FIELD_IS_BLANK:
                        obj.jump_when = EC.Const.JUMP_FIELD_IS_BLANK;
                        obj.jump_value = '';
                        break;

                    default:
                        obj.jump_when = obj.jump_when = EC.Const.JUMP_VALUE_IS;
                        obj.jump_value = raw_jumps[i + 1];

                }

            }

            parsed_jumps.push(obj);

        }

        return parsed_jumps;

    };

    var getLocalFormID = function (the_form_name) {

        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;
        var name = the_form_name;

        for (i = 0; i < iLength; i++) {

            if (forms[i].name === name) {
                return forms[i]._id;
            }

        }

    };

    var isFormGenKeyHidden = function () {

        var forms = JSON.parse(window.localStorage.forms);
        var form_id = parseInt(window.localStorage.form_id, 10);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {

            if (parseInt(forms[i]._id, 10) === form_id) {
                return parseInt(forms[i].is_genkey_hidden, 10);
            }

        }

    };

    var isBranchFormGenKeyHidden = function () {

        var form = JSON.parse(window.localStorage.branch_form);

        return form.is_genkey_hidden;

    };

    var getLocalInputID = function (the_ref) {

        var inputs = JSON.parse(window.localStorage.local_input_ids);
        var i;
        var iLength = inputs.length;
        var ref = the_ref;

        for (i = 0; i < iLength; i++) {

            if (inputs[i].ref === ref) {

                return inputs[i]._id;

            }

        }
    };

    var getFormPrimaryKeyRef = function (the_form_id) {

        var form_id = parseInt(the_form_id, 10);
        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {

            if (forms[i]._id === form_id) {

                return forms[i].key;
            }
        }

    };

    var projectHasBranches = function () {

        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;
        var has_branches = false;

        for (i = 0; i < iLength; i++) {

            if (parseInt(forms[i].has_branches, 10) === 1) {
                has_branches = true;
            }
        }
        return has_branches;

    };

    //to keep track of parent-child relationship, we need the 'ref' of the parent form for some features
    var getFormParentPrimaryKeyRef = function (the_form_id) {

        var form_id = parseInt(the_form_id, 10);
        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {
            if (forms[i]._id === form_id) {
                return forms[i - 1].key;
            }
        }
    };

    var getFormByID = function (the_form_id) {

        var form_id = parseInt(the_form_id, 10);
        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {

            if (parseInt(forms[i]._id, 10) === form_id) {

                return forms[i];
            }
        }

    };

    var getEntriesCount = function () {

        var i;
        var iLength;
        var forms = JSON.parse(window.localStorage.forms);
        var count = 0;

        for (i = 0; i < iLength; i++) {
            count += parseInt(forms[i].entries, 10);
        }
        return count;
    };

    var getParentFormByChildID = function (the_child_form_id) {

        var form_id = parseInt(the_child_form_id, 10);
        var forms = JSON.parse(window.localStorage.forms);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {
            if (forms[i]._id === form_id) {
                return forms[i - 1];
            }
        }
    };

    var updateFormsObj = function (the_form_id) {

        var forms = JSON.parse(window.localStorage.forms);
        var form_id = parseInt(the_form_id, 10);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {

            if (forms[i]._id === form_id) {

                //increase entries counter
                forms[i].entries = forms[i].entries + 1;
                break;
            }
        }

        window.localStorage.forms = JSON.stringify(forms);

    };

    var getChildrenForms = function (the_form_id) {

        var forms = JSON.parse(window.localStorage.forms);
        var form_id = parseInt(the_form_id, 10);
        var i;
        var iLength = forms.length;

        for (i = 0; i < iLength; i++) {

            if (forms[i]._id === form_id) {

                //return all the elements after the current index
                return forms.slice(i + 1, iLength + 1);
            }
        }
    };

    var changeHashNavigationDirection = function (the_hash, the_new_direction) {

        var hash = the_hash.split('&');
        var direction = hash[hash.length - 1].split('=');

        direction[direction.length - 1] = the_new_direction;

        hash[hash.length - 1] = direction[0] + '=' + direction[1];

        console.log(hash);

        return hash.join('&');

    };

    //check if a value is in the array, return true on success
    var inArray = function (the_array, the_value, is_case_sensitive) {

        if (!the_array) {
            return false;
        }

        function findWord(array, word) {
            return -1 < array.map(function (item) {
                    return item.toLowerCase();
                }).indexOf(word.toLowerCase());
        }

        //case sensitive search
        if (is_case_sensitive) {
            return (the_array.indexOf(the_value) !== -1);
        }

        // case not sensitive search
        return findWord(the_array, the_value);
    };

    /*
     * Get app version name
     */
    var getVersionName = function () {

        var version_name;
        var deferred = new $.Deferred();

        cordova.getAppVersion(function (the_version_name) {
            console.log('App version ' + the_version_name);
            version_name = the_version_name;
            deferred.resolve(version_name);
        });

        return deferred.promise();

    };

    var getAppName = function () {

        var app_name;
        var deferred = new $.Deferred();
        if (!EC.Utils.isChrome()) {
            cordova.getAppVersion.getAppName(function (the_app_name) {
                console.log('App name ' + the_app_name);
                app_name = the_app_name;
                deferred.resolve(app_name);
            });
        }
        else {
            deferred.resolve('');
        }

        return deferred.promise();

    };

    var getPackageName = function () {

        var package_name;
        var deferred = new $.Deferred();
        if (!EC.Utils.isChrome()) {
            cordova.getAppVersion.getPackageName(function (the_package_name) {
                console.log('Package ' + the_package_name);
                package_name = the_package_name;
                deferred.resolve(package_name);
            });
        }
        else {
            deferred.resolve('');
        }

        return deferred.promise();

    };

    var getExportDirName = function () {

        var dir;
        var deferred = new $.Deferred();

        if (!EC.Utils.isChrome()) {
            cordova.getAppVersion.getAppName(function (the_app_name) {
                //sanitise app name to be used as a directory (remove all special chars with '-')
                dir = the_app_name.replace(/[^\w\s]/gi, '-');
                //remove all spaces
                dir = dir.replace(/\s+/g, '');
                //append export suffix foe easier identification
                dir += '-export';
                deferred.resolve(dir);
            });
        }
        else {
            deferred.resolve('');
        }
        return deferred.promise();
    };

    //get absolute path for page urls
    var getPageBaseURI = function () {

        var base_uri;

        //if we are testing with Chrome Chrome/browser on the iMac (replace based on your
        // dev environment if needed)
        if (EC.Utils.isChrome()) {

            base_uri = window.localStorage.BASE_URI;

        }
        else {

            switch (window.device.platform) {

                case 'Android':

                    //@debug on: old android platforms need jsHybugger to run
                    // as a service, newer platform do not
                    //check if the phone is running anything less than 4.4.*
                    // KitKat then request pages via the service if needed
                    console.log('kitkat regex: ' + EC.Const.KITKAT_REGEX.test(window.device.version));
                    if (EC.Const.DEBUG === 1 && !(EC.Const.KITKAT_REGEX.test(window.device.version) || EC.Const.LOLLIPOP_REGEX.test(window.device.version))) {

                        //base_uri = 'content://jsHybugger.org/file:///android_asset/www/';
                        //@debug off
                        base_uri = EC.Const.ANDROID_ASSETS_ABS_PATH;

                    }
                    else {

                        //@debug off
                        base_uri = EC.Const.ANDROID_ASSETS_ABS_PATH;
                    }

                    break;

                case 'iOS':

                    base_uri = EC.Const.IOS_ASSETS_ABS_PATH;
                    break;

            }
        }
        return base_uri;
    };

    var isValidValue = function (the_input, the_value, the_clone_value) {

        var self = this;

        //store validation details in coordsheadin.
        var validation = {
            is_valid: true,
            message: ''
        };

        var input = the_input;
        var value = the_value;
        var pattern;
        var clone_value = the_clone_value;

        //return immediately if input is branch
        if (input.type === EC.Const.BRANCH) {
            return validation;
        }

        //return immediately if input is integer value is not an integer but
        // a float (user can enter the dot, depending on the native keyboard
        // layout)
        if (input.type === EC.Const.INTEGER) {

            //check if number value is integer, not float
            if (parseFloat(value) !== parseInt(value, 10) && value !== '') {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation('invalid_integer');

                return validation;
            }
        }

        /** for iOS only: it is currently NOT possible to show a keyboard
         * with only numbers and the dot '.' to input decimal values
         *  therefore the full keyboard is shown and we need to sanitise the
         * input against wrong chars
         *
         */
        if (input.type === EC.Const.DECIMAL) {

            //check if value is a decimal value (http://goo.gl/Q4J4cU)
            if (!self.isNumber(value)) {

                if (value !== '') {
                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation('invalid_decimal');

                    return validation;
                }

            }
        }

        //if the value is a primary key, check that is does not contain the
        // char set as ENTRY_ROOT_PATH_SEPARATOR
        if (input.is_primary_key === 1 && value.indexOf(EC.Const.ENTRY_ROOT_PATH_SEPARATOR) !== -1) {

            validation.is_valid = false;
            validation.message = EC.Localise.getTranslation('pk_reserved_char') + EC.Const.ENTRY_ROOT_PATH_SEPARATOR;

            return validation;

        }

        //check if the input needs to match a regular expression
        if (input.regex !== '') {

            if (!value.match(input.regex)) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation('invalid_regex') + input.regex;

                return validation;
            }
        }

        //check if the value has a double check. In that case 'value' will
        // contain 2 values to match
        if (parseInt(input.has_double_check, 10) === 1) {

            if (value !== clone_value) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation('values_unmatched');

                return validation;
            }
        }

        //check if the value is within the max range
        if (input.max_range !== '') {

            //use parseFloat as it can be an integer or a decimal value
            if (parseFloat(value) > parseFloat(input.max_range)) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation('out_of_range');

                return validation;
            }
        }

        //check if the value is within the min range
        if (input.min_range !== '') {

            //use parseFloat as it can be an integer or a decimal value
            if (parseFloat(value) < parseFloat(input.min_range)) {

                validation.is_valid = false;
                validation.message = EC.Localise.getTranslation('out_of_range');

                return validation;
            }
        }

        //check the user did not entered the reserved word _skipp3d_
        if (input.value === EC.Const.SKIPPED) {

            validation.is_valid = false;
            validation.message = EC.Localise.getTranslation('reserved_keyword');

            return validation;

        }

        //check if the input is required
        if (parseInt(input.is_required, 10) === 1) {

            //if the input is a dropdown, radio or checkbox, check for
            // NO_OPTION_SELECTED label
            if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO || input.type === EC.Const.CHECKBOX) {

                if (value === EC.Const.NO_OPTION_SELECTED) {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation('field_required');

                    return validation;
                }

            }
            else {

                if (value === '') {

                    validation.is_valid = false;
                    validation.message = EC.Localise.getTranslation('field_required');

                    return validation;
                }

            }
        }

        return validation;
    };

    // get iOS app root path (www)
    var setIOSRootPath = function () {

        function onSuccess(fileSystem) {

            var documents_path;

            //get absolute path on iOS 8, there is a bug in Cordova 3.7 see
            // http://goo.gl/lUIqyl
            if (window.device.platform === EC.Const.IOS && parseFloat(window.device.version) >= 8) {

                documents_path = fileSystem.toURL();

                EC.Const.IOS_ASSETS_ABS_PATH = documents_path.replace('file:////', 'file:///private/');
                EC.Const.IOS_ASSETS_ABS_PATH += 'www/';
                console.log('iOS 8+ root www - ' + EC.Const.IOS_ASSETS_ABS_PATH);
            }
            else {

                /* Very imp!!!! they changed the property from 'fullPath'
                 * (Cordova  2.9) to 'nativeURL' somewhere in time!!!!
                 */

                console.log(fileSystem);

                //get app name
                $.when(EC.Utils.getAppName()).then(function (name) {

                    EC.Const.IOS_ASSETS_ABS_PATH = name + '.app/www/';
                    documents_path = fileSystem.root.nativeURL;
                    documents_path = documents_path.replace('Documents/', '');

                    //IOS_ASSETS_ABS_PATH : 'Epicollect5 64bit.app/www/' -> we ned to append this
                    EC.Const.IOS_ASSETS_ABS_PATH = documents_path + EC.Const.IOS_ASSETS_ABS_PATH;

                    console.log('iOS root www - ' + EC.Const.IOS_ASSETS_ABS_PATH);
                });
            }
        }

        function onError(error) {

            console.log(JSON.stringify(error));
        }

        //on iOS 8, get the Directory Entry using new method
        if (window.device.platform === EC.Const.IOS && parseFloat(window.device.version) >= 8) {
            window.resolveLocalFileSystemURL(cordova.file.applicationDirectory, onSuccess, onError);
        }
        else {
            //on other platforms, use legacy method
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
        }
    };

    var setIOSPersistentStoragePath = function () {

        function onSuccess(fileSystem) {

            EC.Const.IOS_APP_PRIVATE_URI = fileSystem.root.nativeURL;

            /*remove 'file://' from path: images from iOS application folder
             * will need the 'file://'
             * to be loaded, but audio and video files will not:
             * http://stackoverflow.com/questions/24205331/mp3-audio-playback-not-working-with-cordova-3-5-on-ios
             */
            EC.Const.IOS_APP_PRIVATE_URI = EC.Const.IOS_APP_PRIVATE_URI.slice(7);

            console.log('iOS Documents path - ' + EC.Const.IOS_APP_PRIVATE_URI);
        }

        function onError(error) {
            console.log(JSON.stringify(error));
        }

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
    };

    var setMediaDirPaths = function () {

        switch (window.device.platform) {

            case EC.Const.ANDROID:
                EC.Const.PHOTO_DIR = '/files/images/';
                EC.Const.AUDIO_DIR = '/files/audios/';
                EC.Const.VIDEO_DIR = '/files/videos/';
                break;
            case EC.Const.IOS:
                EC.Const.PHOTO_DIR = 'images/';
                EC.Const.AUDIO_DIR = 'audios/';
                EC.Const.VIDEO_DIR = 'videos/';
                break;

        }

    };

    /**
     *
     * @param {Object} the_filenames an array mapping filenames against their
     * timestamps
     * @param {Object} the_current_filename The filename to look the
     * timestamp for
     *
     * get the filename for a photo saved in persistent storage on iOS.
     * Cordova Camera API returns an image URI like <cdv_photo_001.jpg> on
     * iOS tmp folder
     * but we save the file using the timestamp in the Documents folder, as
     * wee do on Android
     * (where the timestamp is used as file name by default).
     */
    var getIOSFilename = function (the_filenames, the_current_filename) {

        var i;
        var filenames = the_filenames;
        var current_filename = the_current_filename;
        var iLength = filenames.length;

        for (i = 0; i < iLength; i++) {
            if (filenames[i].filename === current_filename) {
                return filenames[i].timestamp;
            }
        }
    };

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    var mapLabelToValue = function (the_value, the_inputs) {

        function _getInputByRef(the_ref, the_inputs) {

            var inputs = the_inputs;
            var i;
            var iLength = inputs.length;

            for (i = 0; i < iLength; i++) {

                if (inputs[i].ref === the_ref) {
                    return inputs[i];
                }
            }
        }

        function _getCheckboxLabels(the_value, the_current_input) {

            var value_as_array = the_value.value.split(',');
            var current_input = the_current_input;
            var i;
            var j;
            var iLength = value_as_array.length;
            var jLength = current_input.options.length;
            var labels = [];
            for (i = 0; i < iLength; i++) {
                for (j = 0; j < jLength; j++) {

                    if (current_input.options[j].value === value_as_array[i].trim()) {
                        labels.push(current_input.options[j].label);
                    }

                }
            }

            return labels;

        }

        function _getDropdownOrRadioLabel(the_value, the_current_input) {

            var i;
            var current_input = the_current_input;
            var value = the_value;
            var iLength = current_input.options.length;

            for (i = 0; i < iLength; i++) {
                if (current_input.options[i].value === value.value.trim()) {
                    return current_input.options[i].label;
                }
            }
        }

        var value = the_value;
        var ref = value.ref;
        var inputs = the_inputs;
        var current_input = _getInputByRef(ref, inputs);
        var mapped_label;

        switch (value.type) {

            //value.value will be an array
            case EC.Const.CHECKBOX:
                //for checkboxes, mapped_label will be a csv
                mapped_label = _getCheckboxLabels(value, current_input);
                break;

            //value.value will be string
            case EC.Const.DROPDOWN:

                mapped_label = _getDropdownOrRadioLabel(value, current_input);
                break;

            //value.value will be string
            case EC.Const.RADIO:

                mapped_label = _getDropdownOrRadioLabel(value, current_input);
                break;

        }

        return mapped_label;

    };

    //check if the audio files is stored or cache, comparing the paths
    function isAudioFileStored(the_cache_path, _the_file_path) {

        var file_path = _the_file_path;
        var cache_path = the_cache_path;
        var file_path_parts = file_path.split('/');

        file_path_parts.pop();
        file_path = file_path_parts.join('/');
        file_path += '/';

        console.log('cache_path ' + cache_path);
        console.log('file_path' + file_path);

        return (file_path === cache_path) ? false : true;

    }

    function generateAudioFileName() {

        var filename;

        switch (window.device.platform) {

            case EC.Const.ANDROID:
                //build filename timestamp + mp4 (Cordova 2.9 sources have been modified manually
                // to record high quality audio)
                filename = EC.Utils.getTimestamp() + '.mp4';
                break;

            case EC.Const.IOS:

                //build filename timestamp + wav (iOS only records to files of type .wav and
                // returns an error if the file name extension is not correct.)
                filename = EC.Utils.getTimestamp() + '.wav';
                break;

        }

        return filename;

    }

    //check if there is a internet connection (cordova online and offline events consider Connection.UNKNOWN as online? Better to use this function)
    var hasConnection = function () {
        //return immediately if testing on Chrome
        if (EC.Utils.isChrome()) {
            return true;
        }
        if (navigator.network) {
            return !(navigator.network.connection.type === Connection.NONE || navigator.network.connection.type === Connection.UNKNOWN);
        }
    };

    //check if the connection is good enough to load map tiles (well, CELL network type is not available on iOS so this function is exactly like hasConnection)
    function hasGoodConnection() {

        var is_good = true;

        switch (navigator.connection.type) {

            case Connection.NONE:
                console.log('no internet connection');
                is_good = false;
                break;

            case Connection.UNKNOWN:
                console.log('unknown internet connection');
                is_good = false;
                break;

            //this would be great but Cell network info are not available on iOS
            //case Connection.CELL_2G:
            //    console.log('2G connection too weak');
            //    is_good = false;
            //    break;
            //
            //case Connection.CELL:
            //    console.log('Connection too weak');
            //    is_good = false;
            //    break;
        }
        //I assume the connection is good enough to load the map tiles
        return is_good;
    }

    return {

        setForms: setForms,
        getForms: getForms,
        getPhoneUUID: getPhoneUUID,
        setPhoneUUID: setPhoneUUID,
        getGenKey: getGenKey,
        getParentAndChildForms: getParentAndChildForms,
        getTimestamp: getTimestamp,
        hasConnection: hasConnection,
        openDatabase: openDatabase,
        isChrome: isChrome,
        projectHasBranches: projectHasBranches,
        parseTimestampDate2Posix: parseTimestampDate2Posix,
        parseDate: parseDate,
        parseIOSDate: parseIOSDate,
        parseTime: parseTime,
        parseIOSTime: parseIOSTime,
        parseLocationString: parseLocationString,
        parseJumpString: parseJumpString,
        isURL: isURL,
        isNumber: isNumber,
        sleep: sleep,
        isGPSEnabled: isGPSEnabled,
        executeFunctionByName: executeFunctionByName,
        getLocalInputID: getLocalInputID,
        getLocalFormID: getLocalFormID,
        isValidEmail: isValidEmail,
        getFormPrimaryKeyRef: getFormPrimaryKeyRef,
        getFormParentPrimaryKeyRef: getFormParentPrimaryKeyRef,
        getFormByID: getFormByID,
        getEntriesCount: getEntriesCount,
        isFormGenKeyHidden: isFormGenKeyHidden,
        isBranchFormGenKeyHidden: isBranchFormGenKeyHidden,
        getParentFormByChildID: getParentFormByChildID,
        updateFormsObj: updateFormsObj,
        getChildrenForms: getChildrenForms,
        changeHashNavigationDirection: changeHashNavigationDirection,
        inArray: inArray,
        getVersionName: getVersionName,
        getAppName: getAppName,
        getPackageName: getPackageName,
        getExportDirName: getExportDirName,
        getPageBaseURI: getPageBaseURI,
        isValidValue: isValidValue,
        setIOSRootPath: setIOSRootPath,
        setMediaDirPaths: setMediaDirPaths,
        setIOSPersistentStoragePath: setIOSPersistentStoragePath,
        getIOSFilename: getIOSFilename,
        getParameterByName: getParameterByName,
        mapLabelToValue: mapLabelToValue,
        isAudioFileStored: isAudioFileStored,
        generateAudioFileName: generateAudioFileName,
        hasGoodConnection: hasGoodConnection
    };

}());


/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function (module) {
    'use strict';

    module.initGoogleMap = function () {

        var self = this;
        var deferred = new $.Deferred();

        self.current_position = new google.maps.LatLng(self.coords.latitude, self.coords.longitude);
        self.map_options = {
            center: {lat: self.coords.latitude, lng: self.coords.longitude},
            zoom: 16,
            disableDefaultUI: true
        };

        self.map = new google.maps.Map(document.getElementById('map-canvas'), self.map_options);
        //add current user position
        self.marker = new google.maps.Marker({
            position: self.current_position,
            map: self.map,
            draggable: true
        });

        //draw accuracy circle
        self.circle = new google.maps.Circle({
            center: self.current_position,
            radius: self.coords.accuracy,
            map: self.map,
            fillColor: '#0000FF',
            fillOpacity: 0.2,
            strokeColor: '0',
            strokeOpacity: 0
        });

        self.marker.bindTo('position', self.circle, 'center');
        self.map.fitBounds(self.circle.getBounds());

        //let's use 'idle' event and a 2 secs timeout, to play it safe
        // 'tilesloaded' could not be fire if there are network problems
        window.google.maps.event.addListenerOnce(self.map, 'idle', function () {
            window.setTimeout(function () {
                deferred.resolve();
            }, 2000);
        });

        window.google.maps.event.addListener(self.marker, 'dragend', function (event) {
            console.debug('final position is ' + event.latLng.lat() + ' / ' + event.latLng.lng());
            self.coords.latitude = event.latLng.lat();
            self.coords.latitude = event.latLng.lng();
            EC.Notification.showToast('Marker dragged by user', 'short');
        });

        return deferred.promise();
    };

    return module;

}(EC.DevicePosition));

/*global $, jQuery, cordova, device, ActivityIndicator*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function (module) {
    'use strict';

    module.map = {};
    module.marker = {};
    module.circle = {};
    module.coords = {};
    module.current_position = {};
    module.map_options = {};
    module.timeout = 30000;
    module.is_first_attempt = true;
    module.is_api_loaded = false;
    //the 'is_enhanced_map_on' flag changes a lot, if the device loses connection and stuff, so it is a good idea to always request it via a function
    module.is_enhanced_map_on = function () {
        return parseInt(window.localStorage.is_enhanced_map_on, 10) === 1;
    };

    module.watchTimeout = function () {
        //set unlimited timeout for watch position to avoid timeout error on iOS when the device does not move
        // see http://goo.gl/tYsBSC, http://goo.gl/jYQhgr, http://goo.gl/8oR1g2
        return (window.device.platform === EC.Const.IOS) ? Infinity : 30000;
    };

    module.getCurrentPosition = function () {

        var deferred = new $.Deferred();
        var self = this;

        //resolve passing position to caller
        function onSuccess(position) {
            self.setCoords(position);
            deferred.resolve();
        }

        function onError(error) {
            console.log(error);
            deferred.reject();
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            maximumAge: 0,
            timeout: self.timeout,
            enableHighAccuracy: true
        });

        return deferred.promise();
    };

    module.watchPosition = function () {

        var deferred = new $.Deferred();
        var geolocation_request;
        var timeout = EC.DevicePosition.watchTimeout();
        var self = this;

        function onWatchSuccess(position) {

            console.log('onWatchSuccess called, accuracy: ' + position.coords.accuracy);

            //get HTML5 geolocation coords values replacing null with '' for not available values
            self.setCoords(position);
            //clear the current watch
            window.navigator.geolocation.clearWatch(geolocation_request);
            deferred.resolve(true);
        }

        //onError Callback
        function onWatchError(error) {

            console.log(error);
            window.navigator.geolocation.clearWatch(geolocation_request);

            switch (error.code) {
                case 1:
                    if (window.device.platform === EC.Const.IOS) {
                        EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('location_service_fail'));
                    }
                    break;
                case 3:
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), error.message + EC.Localise.getTranslation('location_fail'));
                    break;
                default :
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('unknow_error'));
            }
            deferred.resolve(false);
        }

        //on first attempt, get a quick and rough location just to get started
        //We do not use getCurrentPosition as it tends to give back a cached position when is it called, not looking for a new one each time
        if (self.is_first_attempt) {
            geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                maximumAge: 0,
                timeout: timeout,
                enableHighAccuracy: true
            });
            self.is_first_attempt = false;
        }
        else {

            /*
             on subsequent calls, check position for 3 secs and return.
             this will improve cases when watchPositionretunr immediately with the same value, as it might return more than once during the 3 secs period
             */
            window.setTimeout(function () {

                //be safe in case after 3 secs we still do not have a location, and resolve to show old values
                window.navigator.geolocation.clearWatch(geolocation_request);
                deferred.resolve(true);
                console.log('setTimeout called without location');
            }, 30000);

            //get location using watchPosition for more accurate results, It is called automatically when movement is detected,
            //not only when requesting it. Do thjis when user wants to improve location
            geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                maximumAge: 0,
                timeout: timeout,
                enableHighAccuracy: true
            });
        }

        return deferred.promise();
    };

    //set HTML5 geolocation coords values replacing null with '' for not available values
    module.setCoords = function (position) {
        this.coords = {
            latitude: (position.coords.latitude === null) ? '' : position.coords.latitude,
            longitude: (position.coords.longitude === null) ? '' : position.coords.longitude,
            altitude: (position.coords.altitude === null) ? '' : position.coords.altitude,
            accuracy: (position.coords.accuracy === null) ? '' : position.coords.accuracy,
            altitude_accuracy: (position.coords.altitudeAccuracy === null) ? '' : position.coords.altitudeAccuracy,
            heading: (position.coords.heading === null) ? '' : position.coords.heading
        };
    };

    //when not able to locate, set HTML5 geolocation coords to ''
    module.setEmptyCoords = function () {
        this.coords = {
            latitude: '',
            longitude: '',
            altitude: '',
            accuracy: '',
            altitude_accuracy: '',
            heading: ''
        };
    };

    module.getCoordsFormattedText = function () {

        return 'Latitude: ' + this.coords.latitude + ',\n' + //
            'Longitude: ' + this.coords.longitude + ',\n' + //
            'Altitude: ' + this.coords.altitude + ',\n' + //
            'Accuracy: ' + this.coords.accuracy + ',\n' + //
            'Altitude Accuracy: ' + this.coords.altitude_accuracy + ',\n' + //
            'Heading: ' + this.coords.heading + '\n';

    };

    module.getCoordsEmptyText = function () {
        return 'Latitude: ,\n' + 'Longitude: ,\n' + 'Altitude: ,\n' + 'Accuracy: ,\n' + 'Altitude Accuracy: ,\n' + 'Heading: \n';
    };

    return module;
}(EC.DevicePosition));

/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition.loadGoogleMapsApi = function () {
    'use strict';

    var deferred = new $.Deferred();

    //callback from Google Maps API needs to be in the global scope
    window.mapIsLoaded = function () {
        // EC.DevicePosition.is_api_loaded = true;
        deferred.resolve();
    };

    //is the Api already loaded?
    if (window.google !== undefined && window.google.maps) {
        console.log('Maps API cached already');
        //if no connection, exit and warn user todo
        if (EC.Utils.hasGoodConnection()) {
            //load API from server
            //connection looks good, try to load tiles
            deferred.resolve();
        }
        else {
            //could not load API
            deferred.reject();
        }
    }
    else {

        if (EC.Utils.hasGoodConnection()) {

            $.getScript('https://maps.googleapis.com/maps/api/js?sensor=true&callback=mapIsLoaded')
                .done(function (script, textStatus) {
                    console.log(textStatus);
                })
                .fail(function (jqxhr, settings, exception) {
                    console.log(jqxhr + exception);
                    deferred.reject();
                });
        }
        else {
            //could not load API
            deferred.reject();
        }
    }

    return deferred.promise();
};







/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function (module) {
    'use strict';

    module.updateGoogleMap = function () {

        var self = this;
        var deferred = new $.Deferred();

        //get info from map on the dom: if the details are the same, we are navigation to an existing map on the dom, no need to update

        self.current_position = new google.maps.LatLng(self.coords.latitude, self.coords.longitude);
        self.map_options = {
            center: {lat: self.coords.latitude, lng: self.coords.longitude},
            zoom: 16,
            disableDefaultUI: true
        };

        self.map = new google.maps.Map(document.getElementById('map-canvas'), self.map_options);
        //add current user position
        self.marker = new google.maps.Marker({
            position: self.current_position,
            map: self.map,
            draggable: true
        });

        //draw accuracy circle
        self.circle = new google.maps.Circle({
            center: self.current_position,
            radius: self.coords.accuracy,
            map: self.map,
            fillColor: '#0000FF',
            fillOpacity: 0.2,
            strokeColor: '0',
            strokeOpacity: 0
        });

        self.marker.bindTo('position', self.circle, 'center');
        self.map.fitBounds(self.circle.getBounds());

        //let's use 'idle' event and a 2 secs timeout, to play it safe
        // 'tilesloaded' could not be fire if there are network problems
        window.google.maps.event.addListenerOnce(self.map, 'idle', function () {
            window.setTimeout(function () {
                deferred.resolve();
            }, 2000);
        });

        window.google.maps.event.addListener(self.marker, 'dragend', function (event) {
            console.debug('final position is ' + event.latLng.lat() + ' / ' + event.latLng.lng());
            self.coords.latitude = event.latLng.lat();
            self.coords.latitude = event.latLng.lng();
            EC.Notification.showToast('Marker dragged by user', 'short');
        });

        return deferred.promise();
    };

    return module;

}(EC.DevicePosition));

/*global $, Camera*/
var EC = EC || {};
EC.Photo = EC.Photo || {};
EC.Photo = (function (module) {
    'use strict';

    module.getCameraOptions = function () {

        //Set camera options - anything more than 1024 x 728 will crash
        var source = Camera.PictureSourceType.CAMERA;

        return {
            quality: 50, //anything more than this will cause memory leaks, we might offer the user to set this value in the future
            //  allowEdit: true, //this enables crop, better to leave it off for now
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: source,
            encodingType: Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            correctOrientation: true,
            saveToPhotoAlbum: false, //save to cache folder only
            /*
             actual image is not square 1024 x 1014, but this will keep the aspect ratio
             landscape 1024 x 768
             portrait  768 x 1024
             */
            targetWidth: 1024,
            targetHeight: 1024
        };
    };

    return module;
}(EC.Photo));

/*global $*/
var EC = EC || {};
EC.Photo = EC.Photo || {};
EC.Photo = (function (module) {
    'use strict';

    module.getStoredImageDir = function () {

        var dir;
        //build full path to get image from private app folder
        switch (window.device.platform) {
            case EC.Const.ANDROID:
                dir = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/';
                break;
            case EC.Const.IOS:
                //prepend 'file://' to load images from iOS application directory
                dir = 'file://' + EC.Const.IOS_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/';
                break;
        }
        return dir;
    };
    return module;
}(EC.Photo));

/*global $, jQuery, Camera, FileViewerPlugin*/

var EC = EC || {};
EC.Photo = EC.Photo || {};
EC.Photo = (function (module) {
    'use strict';

    module.openImageView = function (tap_event, the_href) {
        var href = the_href;
        var e = tap_event;
        var params;

        switch (window.device.platform) {

            //on Android we show the image as a js popup using swipebox.js
            //todo replace with native image viewer, to be built ;)
            case EC.Const.ANDROID:
                e.preventDefault();
                $.swipebox([{
                    href: href
                }]);
                break;
            //on iOS we show the native image viewer using the FileViewerPlugin
            case EC.Const.IOS:
                //todo: do we nee the action parameter on iOS?
                params = {
                    action: FileViewerPlugin.ACTION_VIEW,
                    url: encodeURI(href)
                };
                FileViewerPlugin.view(params, function () {
                    console.log('viewing image');
                }, function (error) {
                    console.log('error opening image' + error);
                });
                break;
        }
    };

    return module;

}(EC.Photo));



/*global $, jQuery, Camera, FileViewerPlugin*/

var EC = EC || {};
EC.Photo = EC.Photo || {};
EC.Photo = (function (module) {
    'use strict';

    module.renderOnCanvas = function(the_canvas_portrait_dom, the_canvas_landscape_dom, the_image_uri) {

        //clear canvas from previous images
        var canvas_portrait_dom = the_canvas_portrait_dom;
        var canvas_landscape_dom = the_canvas_landscape_dom;
        var canvas_portrait = canvas_portrait_dom[0];
        var canvas_landscape = canvas_landscape_dom[0];
        //load taken image on <canvas> tag
        var image = new Image();
        var context;
        var source = the_image_uri;


        /**Attach a timestamp to the source URI to make the UIWebView
         * refresh the cache
         * and request a new image otherwise old images are loaded (iOS
         * quirk)
         * The same thing happens on a browser. On Android this does not
         * happen
         * because the image URI is saved using the timestamp as filename
         * directly (good choice)
         *
         * Anyway, when editing and replacing the image with a new one the saved url does
         * not change, so we need to force a refresh on all platforms
         */
        source += '?' + parseInt(new Date().getTime() / 1000, 10);
        image.src = source;

        image.onerror = function () {
            console.log('Image failed!');
            EC.Notification.hideProgressDialog();
        };

        image.onload = function () {

            //todo resize image to fit in canvas -> it is not working
            // properly!
            console.log('on load called');
            var width = this.width;
            var height = this.height;
            var thumb_height;
            var thumb_width;
            var canvas;

            if (height > width) {
                //portrait
                canvas = canvas_portrait;
                thumb_width = 188;
                thumb_height = 250;
                canvas_landscape_dom.addClass('hidden');
                canvas_portrait_dom.removeClass('hidden');

            }
            else {
                //landscape
                canvas = canvas_landscape;
                thumb_width = 250;
                thumb_height = 188;
                canvas_portrait_dom.addClass('hidden');
                canvas_landscape_dom.removeClass('hidden');
            }

            context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.save();
            //scale image based on device pixel density
            // context.scale(window.devicePixelRatio, window.devicePixelRatio);
            context.imageSmoothingEnabled = false;
            context.drawImage(this, 0, 0, thumb_width, thumb_height);
            context.restore();
            EC.Notification.hideProgressDialog();

        };
        //image.onload
        console.log(JSON.stringify(source));
    };

    return module;

}(EC.Photo));



/*global $, jQuery, Camera, FileViewerPlugin*/

var EC = EC || {};
EC.Photo = EC.Photo || {};
EC.Photo = (function (module) {
    'use strict';

    module.renderOnImg = function (the_image_uri) {

        var image = new Image();
        var source = the_image_uri;
        //todo move as dependency
        var img_wrapper = $('img.thumb');

        /**Attach a timestamp to the source URI to make the UIWebView
         * refresh the cache
         * and request a new image otherwise old images are loaded (iOS
         * quirk)
         * The same thing happens on a browser. On Android this does not
         * happen
         * because the image URI is saved using the timestamp as filename
         * directly (good choice)
         *
         * Anyway, when editing and replacing the image with a new one the saved url does
         * not change, so we need to force a refresh on all platforms
         */
        source += '?' + parseInt(new Date().getTime() / 1000, 10);

        image.src = source;

        image.onload = function () {
            var width = this.width;
            var height = this.height;

            if (width > height) {
                img_wrapper.attr('src', the_image_uri).width(250).height(188);
            }
            else {
                img_wrapper.attr('src', the_image_uri).width(188).height(250);
            }
            EC.Notification.hideProgressDialog();
        };

        image.onerror = function () {
            console.log('Image failed!');
            EC.Notification.hideProgressDialog();

        };
    };

    return module;

}(EC.Photo));




/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Small library of utility function helpful when running epicollect5 on older platforms or when a custom function is necessary
 *
 */
var EC = window.EC || {};
EC.Config = (function () {
    'use strict';

    //concatenate array only keeping unique values
    Array.prototype.unique = function () {

        var i;
        var j;
        var a = this.concat();

        for (i = 0; i < a.length; ++i) {
            for (j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j]) {
                    a.splice(j--, 1);
                }
            }
        }
        return a;
    };

    //search element in array
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            var i, pivot = fromIndex || 0, length;

            if (!this) {
                throw new TypeError();
            }

            length = this.length;

            if (length === 0 || pivot >= length) {
                return -1;
            }

            if (pivot < 0) {
                pivot = length - Math.abs(pivot);
            }

            for (i = pivot; i < length; i++) {
                if (this[i] === searchElement) {
                    return i;
                }
            }
            return -1;
        };
    }//indexOf

    //check if two arrays are identical, strict flag if the elements need to be in the same order
    Array.prototype.equals = function (array, is_strict) {

        var i;

        if (!array) {
            return false;
        }
        if (arguments.length === 1) {
            is_strict = true;
        }

        if (this.length !== array.length) {
            return false;
        }
        for (i = 0; i < this.length; i++) {
            if (this[i] instanceof Array && array[i] instanceof Array) {
                if (!this[i].equals(array[i], is_strict)) {
                    return false;
                }
            }
            if (is_strict && this[i] !== array[i]) {
                return false;
            }
            if (!is_strict) {
                return this.sort().equals(array.sort(), true);
            }
        }
        return true;
    };

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    //check if a string start with the passed substring/char
    if (!String.prototype.startsWith) {
        Object.defineProperty(String.prototype, 'startsWith', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function (searchString, position) {
                position = position || 0;
                return this.indexOf(searchString, position) === position;
            }
        });
    }//startsWith

    /* Truncate a string
     * @param {n} the length
     */
    String.prototype.trunc = function (n) {
        return this.substr(0, n - 1) + (this.length > n ? '...' : '');
    };

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({
                toString: null
            }).propertyIsEnumerable('toString'), dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'], dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                var result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
    }
}());

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
var EC = EC || {};
EC.Const = EC.Const || {};

//Define constant values to be used across the application
EC.Const = (function () {
    'use strict';

    return {
        //debug on/off
        DEBUG: 1,

        //platforms
        ANDROID: 'Android',
        IOS: 'iOS',
        ANDROID_ASSETS_ABS_PATH: 'file:///android_asset/www/',
        IOS_ASSETS_ABS_PATH: '',//set at run time

        //file paths
        ANDROID_APP_PRIVATE_URI: 'file:///data/data/', //package name is appended at run time
        IOS_APP_PRIVATE_URI: '', //set at run time, it is the Documents folder or the Library folder
        // folder

        //input types
        TEXT: 'text', //
        TEXTAREA: 'textarea',
        INTEGER: 'integer',
        DECIMAL: 'decimal',
        DATE: 'date',
        TIME: 'time',
        RADIO: 'radio',
        CHECKBOX: 'checkbox',
        DROPDOWN: 'select',
        BARCODE: 'barcode',
        LOCATION: 'location',
        AUDIO: 'audio',
        VIDEO: 'video',
        PHOTO: 'photo',
        BRANCH: 'branch',
        BRANCH_PREFIX: 'branch-',
        //PHOTO_DIR : '/files/images/',
        PHOTO_DIR: '', //defined at run time
        AUDIO_DIR: '', //defined at run time
        VIDEO_DIR: '', //defined at run time
        BRANCH_VIEWS_DIR: 'branch_inputs/',
        INPUT_VIEWS_DIR: 'inputs/',
        VIEWS_DIR: 'views/',
        HTML_FILE_EXT: '.html',
        PHOTO_FILE_EXTENSION: 'jpg',

        //transaction callback log
        TRANSACTION_SUCCESS: 'TRANSACTION SUCCESS ',
        TRANSACTION_ERROR: 'TRANSACTION ERROR ----------------------------------------------------------------**',

        //Model actions
        DELETE: 'delete',
        DELETE_SINGLE_ENTRY: 'delete_single_entry',
        RESTORE: 'restore',
        INSERT: 'insert',
        DOWNLOAD: 'download',

        //Upload actions
        START_HIERARCHY_UPLOAD: 'start_hierarchy_upload',
        STOP_HIERARCHY_UPLOAD: 'stop_hierarchy_upload',
        HIERARCHY_RECURSION: 'hierarchy_recursion',
        START_BRANCH_UPLOAD: 'start_branch_upload',
        STOP_BRANCH_UPLOAD: 'stop_branch_upload',
        BRANCH_RECURSION: 'branch_recursion',

        //navigation
        ADDING: 'adding',
        FORWARD: 'forward',
        BACKWARD: 'backward',
        EDITING: 'editing',
        PREVIOUS: 'previous',
        NEXT: 'next',
        VIEW: 'view',

        //hierarchy views
        INDEX_VIEW: 'index.html',
        UPLOAD_VIEW: 'upload.html',
        DOWNLOAD_VIEW: 'download.html',
        EMAIL_BACKUP_VIEW: 'email-backup.html',
        ENTRIES_LIST_VIEW: 'entries-list.html',
        SETTINGS_VIEW: 'settings.html',
        ADD_PROJECT_VIEW: 'add-project.html',
        FORMS_VIEW: 'forms.html',
        SAVE_CONFIRM_VIEW: 'save-confirm.html',

        //branch views
        BRANCH_ENTRIES_LIST_VIEW: 'branch-entries-list.html',
        BRANCH_SAVE_CONFIRM_VIEW: 'branch-save-confirm.html',
        BRANCH_FEEDBACK_VIEW: 'branch-feedback.html',

        //max length for strings before triggering ellipsis
        PROJECT_NAME_MAX_LENGTH: 22,
        FORM_NAME_MAX_LENGTH: 12,

        //pagination
        ITEMS_PER_PAGE: 20,

        //various
        SET: 1,
        INDEX: 'index',
        INPUTS: 'inputs',
        PROJECT_LIST: 'Project List',
        FORMS: 'Forms',
        FILLER: '_fill3r_', //extra element to add to breadcrumb for
        // navigation

        //labels
        NO_OPTION_SELECTED: 'select_one_option',
        PHOTO_AVAILABLE_LABEL: 'photo_available',
        PHOTO_NOT_AVAILABLE_LABEL: 'no_photo',
        AUDIO_AVAILABLE_LABEL: 'audio_available',
        AUDIO_NOT_AVAILABLE_LABEL: 'no_audio',
        VIDEO_AVAILABLE_LABEL: 'video_available',
        VIDEO_NOT_AVAILABLE_LABEL: 'no_video',

        //jumps
        JUMP_VALUE_IS: 'IS',
        JUMP_VALUE_IS_NOT: 'IS NOT',
        JUMP_ALWAYS: 'ALL',
        JUMP_FIELD_IS_BLANK: 'NULL',
        SKIPPED: '_skipp3d_', //flag to set as a value when an input field
        // is skipped by a jump
        END_OF_FORM: 'END',

        // default server
        EPICOLLECT_SERVER_URL: 'http://plus.epicollect.net/',

        //proxy to load xml in Chrome (CORS)
        //TODO this is not used anymore as we are using a Chrome plugin, it will be removed
        //http://goo.gl/oQNhwh
        PROXY: 'http://www.corsproxy.com/plus.epicollect.net/',

        //the length of a cached file <timestamp.extension> (Android)
        CACHED_FILENAME_LENGTH: 17,

        //this is to concatenate the full path of an entry up to its root, to
        // identify immediate parent
        //used for navigation and uniquely identify an entry
        ENTRY_ROOT_PATH_SEPARATOR: '|',

        //Languages
        ENGLISH: 'en',
        ITALIAN: 'it',

        //minimum Android version NOT to run jsHybugger (regEx) 4.4.*
        KITKAT_REGEX: /^4.4.\d{1}$/,

        //Lollipop regex
        LOLLIPOP_REGEX: /^5.\d{1}$/

    };
}());

/*jslint vars: true , nomen: true, devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 * @module EC
 * @submodulemodule Parser
 *
 * Parse the XML (normalising it) and create the following objects matching the DB structure
 *
 * - Project
 * - Forms
 * - Inputs
 * - Input_options
 *
 */

var EC = EC || {};
EC.Parse = EC.Parse || {};
EC.Parse = (function (module) {
    'use strict';

    //static variable to expose across the module
    //*******************************************
    module.is_form_genkey_hidden = '';
    module.form_key = '';
    //project definition
    module.project = {};
    //parsed forms
    module.parsed_forms = [];
    //store inputs for hierarchy forms (main) (each element is an object with allthe inputs for a single form)
    module.inputs = [];
    //store inputs for branch forms (main) (each element is an object with allthe inputs for a single form)
    module.branch_inputs = [];
    module.form_inputs_positions = [];
    //store list of inputs for a single form
    module.input_list = [];
    //store sets of option for tags like <radio>, <select> and <select1>
    module.options = [];
    module.branch_options = [];
    //*******************************************

    module.getHierarchyForms = function () {

        var self = this;
        var i;
        var iLength = self.parsed_forms.length;
        var hierarchy_forms = [];

        for (i = 0; i < iLength; i++) {
            if (self.parsed_forms[i].type === 'main') {
                hierarchy_forms.push(self.parsed_forms[i]);
            }
        }
        return hierarchy_forms;
    };

    module.getBranchForms = function () {

        var self = this;
        var i;
        var iLength = self.parsed_forms.length;
        var branch_forms = [];

        for (i = 0; i < iLength; i++) {
            if (self.parsed_forms[i].type === 'branch') {
                branch_forms.push(self.parsed_forms[i]);
            }
        }
        return branch_forms;
    };
    return module;

}(EC.Parse));


/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodulemodule Parser
 */
var EC = EC || {};
EC.Parse = ( function(module) {"use strict";

		/**
		 * Map the position a form input using the @ref attribute and return an array:
		 * Doing this because when converting to json the same tags are grouped together and we lose the correct inputs order!
		 */

		module.mapPositionToInput = function(the_xml) {

			var xml = the_xml;
			var form_children;
			var input_positions = [];
			var form_num;
			var form_position = 1;
			var position;
			var positions;
			var key;
			var main;
			var form_name;
			var hierarchy_skip_key;
			var branch_skip_keys = [];

			$(xml).find('form').each(function(i) {

				form_children = $(this).children();
				positions = [];
				position = 1;

				//get form key value
				key = $(this).attr('key');

				//get form main value. true: main form, false: branch form
				main = $(this).attr('main');

				form_num = parseInt($(this).attr('num'), 10);

				//get form name which is unique within a project
				form_name = $(this).attr('name');

				//loop all the inputs
				$(form_children).each(function(index) {

					var ref = $(this).attr('ref');

					if (form_num === 1) {

						if (!hierarchy_skip_key) {
							hierarchy_skip_key = key;
							branch_skip_keys.push(key);
						}

						positions.push({

							form_num : form_num,
							form_name : form_name,
							form_position : form_position,
							position : position,
							ref : ref

						});
						position++;

					} else {

						/* remove reference to parent key from child form: we have to skip the input where the @ref is equal to the @key of the immediate parent;
						 * that input is there on the xml for legacy reasons. It is used in the old Android client but no more on the new HTML5 implementation
						 */

						if (ref === hierarchy_skip_key) {

							positions.push({

								form_num : form_num,
								form_name : form_name,
								form_position : form_position,
								position : "skip",
								ref : ref

							});
						} else {

							//check if the current form is a branch, in that case skip the input if the ref is equal to any one of the cached main keys
							//(again to skip the useless input there for legacy reasons)
							if (main === "false" && EC.Utils.inArray(branch_skip_keys, ref)) {

								positions.push({

									form_num : form_num,
									form_name : form_name,
									form_position : form_position,
									position : "skip",
									ref : ref

								});

							} else {

								positions.push({

									form_num : form_num,
									form_name : form_name,
									form_position : form_position,
									position : position,
									ref : ref

								});
							}

							position++;
						}

					}

				});

				/*if the form is a main one and not a branch, cache its key
				 (as it is needed later to recognised a legacy input field to be removed)
				 as the branch forms are in random order (lol),
				 the hierarchy forms keys are cached in an array as we have to skip a branch input
				 if the ref is equal to any of them */
				if (main === "true") {

					hierarchy_skip_key = key;
					branch_skip_keys.push(key);
				}

				input_positions.push(positions);
				form_num++;
				form_position++;

			});

			console.log("input_positions");
			console.log(input_positions, true);

			return input_positions;
		};

		return module;

	}(EC.Parse));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodulemodule Parser
 */
var EC = EC || {};
EC.Parse = ( function(module) {"use strict";

		var self;

		/*
		 * Return the position of an input within a form based on form name AND the input @ref (uniqueness is given by the composite key)
		 */
		var _getInputPosition = function(the_ref, the_form_name) {

			var ref = the_ref;
			var form_name = the_form_name;
			var input_position;
			var i;
			var iLength = self.form_inputs_positions.length;
			var j;
			var jLength;
			var current_num;
			var current_ref;
			var inputs;

			//loop all forms
			for ( i = 0; i < iLength; i++) {

				//loop all inputs within a form
				inputs = self.form_inputs_positions[i];
				jLength = inputs.length;
				for ( j = 0; j < jLength; j++) {

					if (inputs[j].form_name === form_name && inputs[j].ref === ref) {

						return inputs[j].position;

					}

				}

			}

		};
		
		/*
		 * Get an array of objects to loop and pass to "parseInputObject" for parsing
		 */
		module.parseInputArray = function(the_raw_array, the_type, the_form_num, the_form_type, the_form_name) {

			var self = this;

			$.each(the_raw_array, function(key, value) {
				self.parseInputObject(value, the_type, the_form_num, the_form_type, the_form_name);
			});
		};


		module.parseInputObject = function(the_raw_input, the_type, the_form_num, the_form_type, the_form_name) {

			var i;
			var iLength;
			var j;
			var jLenght;
			var input_position;
			var ref;
			var form_num;
			var form_type;
			var form_name;
			var is_genkey_hidden;

			self = this;
			ref = the_raw_input["@ref"];
			form_num = the_form_num;
			form_type = the_form_type;
			form_name = the_form_name;

			//get input position
			input_position = _getInputPosition(ref, form_name);

			//skip this input if position is set to 'skip'
			if (input_position === "skip") {
				return;
			}

			var parsed_input = {

				position : input_position,
				label : the_raw_input.label,
				type : the_type,
				ref : ref,
				datetime_format : "",
				has_jump : "",
				jumps : "",
				has_advanced_jump : ""

			};

			parsed_input.is_genkey = (the_raw_input["@genkey"] === undefined) ? "" : 1;

			is_genkey_hidden = (the_raw_input["@display"] === undefined) ? 0 : 1;

			if (parsed_input.is_genkey === 1 && is_genkey_hidden === 1) {
				self.is_form_genkey_hidden = 1;
			}

			//Set primary key flag to true  if the input is the primary key for current form
			parsed_input.is_primary_key = (parsed_input.ref === self.form_key) ? 1 : 0;
			
			//#handle a bug in the form builder when a NOT autogenerated key can be hidden (LOL): when a primary key input is hidden, force it to be autogenerated
			if(parsed_input.is_primary_key === 1 && is_genkey_hidden === 1){
				self.is_form_genkey_hidden = 1;
			}

			//if @default is present, there is a default value set for this input
			parsed_input.default_value = (the_raw_input["@default"] === undefined) ? "" : parsed_input.default_value = the_raw_input["@default"];

			//if @integer is present, convert the type to integer (it defaults to text)
			if (the_raw_input["@integer"] !== undefined) {
				parsed_input.type = "integer";

			}

			//if @decimal is present, convert the type to integer (it defaults to text)
			if (the_raw_input["@decimal"] !== undefined) {
				parsed_input.type = "decimal";

			}

			//if @setdate or @date  is present, convert the type to date (it defaults to text) and add the "format" attribute
			if (the_raw_input["@setdate"] !== undefined || the_raw_input["@date"] !== undefined) {

				parsed_input.type = "date";
				parsed_input.datetime_format = the_raw_input["@setdate"] || the_raw_input["@date"];

				//also add the setdate value as default to indicate it needs to default to current date
				parsed_input.default_value = the_raw_input["@setdate"] || "";

			}

			//if @settime or @time is present, convert the type to time (it defaults to text) and add the "format" attribute
			if (the_raw_input["@settime"] !== undefined || the_raw_input["@time"] !== undefined) {

				parsed_input.type = "time";
				parsed_input.datetime_format = the_raw_input["@settime"] || the_raw_input["@time"];

				//also add the settime value as default to indicate it needs to default to current time
				parsed_input.default_value = the_raw_input["@settime"] || "";
			}

			//set regex if any @regex is specified
			parsed_input.regex = (the_raw_input["@regex"] === undefined) ? "" : the_raw_input["@regex"];

			//set max and min value if any specified (not numeric fields will get "none")
			parsed_input.max_range = (the_raw_input["@max"] === undefined) ? "" : the_raw_input["@max"];
			parsed_input.min_range = (the_raw_input["@min"] === undefined) ? "" : the_raw_input["@min"];

			//set is_required to true or false based on the @required present or not
			parsed_input.is_required = (the_raw_input["@required"] === undefined) ? 0 : 1;

			//set search flag: this will be used for the advanced search function
			parsed_input.is_searchable = (the_raw_input["@search"] === undefined) ? 0 : 1;

			/*
			 * set title to true or false based on the @title present or not
			 *
			 * !--XML form builder needs to force at least one occurrence of @title --!
			 */
			parsed_input.is_title = (the_raw_input["@title"] === undefined) ? 0 : 1;

			//set is_double_entry flag based on @verify present or not
			parsed_input.has_double_check = (the_raw_input["@verify"] === undefined) ? 0 : 1;

			if (the_raw_input["@jump"] !== undefined) {

				//Set flag about this input triggering a jump or not
				parsed_input.has_jump = 1;

				parsed_input.jumps = the_raw_input["@jump"];
			}

			//<radio>, <select> (checkbox), <select1>(select) will have list of available options attached as "item" array
			if (the_type === EC.Const.RADIO || the_type === EC.Const.CHECKBOX || the_type === EC.Const.DROPDOWN) {

				//add set of options to options array, to link back to each input using @ref, @num

				//options for hierarchy forms (main)
				if (form_type === "main") {
					self.options.push({
						num : the_form_num,
						ref : the_raw_input["@ref"],
						options : the_raw_input.item
					});
				} else {

					//options for branch form
					self.branch_options.push({
						num : the_form_num,
						ref : the_raw_input["@ref"],
						options : the_raw_input.item
					});
				}

			}//if

			//if the type is branch, set branch_form value
			parsed_input.branch_form_name = (the_raw_input["@branch_form"] === undefined) ? "" : the_raw_input["@branch_form"];

			//store input
			self.input_list.push(parsed_input);
		};

		return module;

	}(EC.Parse));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, xml2json*/
/*
 * @module EC
 * @submodulemodule Parser
 */
var EC = EC || {};
EC.Parse = ( function(module) {"use strict";

		module.parseXML = function(the_data) {

			var self = this;
			var data = the_data;
			var i;
			var iLength;
			var malformed_json = "";
			var json = "";
			var obj;
			var form_has_media;
			var form_has_branches;
			var raw_forms = [];

			self.form_key = "";
			self.parsed_forms = [];
			self.form_inputs_positions = [];

			/* Map each form inputs against its position in the form:
			 * we do this because converting from xml to json it will group the same tags together therefore we would lose the inputs real order */
			self.form_inputs_positions = self.mapPositionToInput(data);

			console.log(self.form_inputs_positions, true);

			//remove "undefined" from json string (workaround to deal with ECML custom data format)
			malformed_json = xml2json(data);

			json = malformed_json.replace("undefined", "");

			console.log('json');
			console.log(json);

			//json string to object
			try {
				obj = JSON.parse(json);
			} catch (error) {
				//escape backslashes (found in regex, for example) -> double check cos it is working better without
				json = json.replace(/\\/g, "\\\\");
				obj = JSON.parse(json);

			}

			//get project details (access properties with @ as array keys)
			self.project = {
				name : obj.ecml.model.submission["@projectName"], //
				allowDownloadEdits : obj.ecml.model.submission["@allowDownloadEdits"], //
				version : obj.ecml.model.submission["@versionNumber"],
				downloadFromServer : obj.ecml.model.downloadFromServer,
				uploadToServer : obj.ecml.model.uploadToServer
			};

			//get the forms in raw format (with @ etc...)
			raw_forms = obj.ecml.form;

			//if no forms for this project, exit and warn user project xml is wrong
			if (raw_forms === undefined) {

				return false;
			}

			//cache lenght (with a single form project length defaults to 1 as the length property will be undefined)
			iLength = raw_forms.length || 1;

			//convert object to array (when it is a single form)
			if (iLength === 1) {
				raw_forms = [raw_forms];
			}

			console.log(self.project);

			//kepp track of number of form per type
			self.project.total_hierarchy_forms = 0;
			self.project.total_branch_forms = 0;

			//parse all the raw forms to have objects in proper format
			for ( i = 0; i < iLength; i++) {

				var form_obj = raw_forms[i];
				var type = "";
				//cache form number to be passed later to parseInput functions
				var form_num = form_obj["@num"];
				var form_type = (form_obj["@main"] === "false") ? "branch" : "main";
				var form_name = form_obj["@name"];

				//clear input_list
				self.input_list.length = 0;

				//clear genkey hidden flag
				self.is_form_genkey_hidden = 0;

				//store a flag to indicate the current form has at least 1 media input
				form_has_media = 0;

				//store a flag to indicate the current form has at least 1 branch
				form_has_branches = 0;

				//store the current form key for later use
				self.form_key = form_obj["@key"];

				//get form attribute
				self.parsed_forms.push({

					num : form_num,
					name : form_name,
					key : self.form_key

				});

				/*if @main is defined this is a form of type main, else it is a branch
				 *
				 */
				self.parsed_forms[i].type = form_type;

				/*	Parse single value form inputs/custom tags
				*   if a tag is not undefined, it can be either an Object (single occurrence) or Array of Objects (multiple occurrences)
				*	also add the form 'num' attribute to each input to reference the right form when storing the inputs to db
				*/

				//parse all the input tags (set as type text)
				if (form_obj.input !== undefined) {

					type = "text";

					if (Array.isArray(form_obj.input)) {
						self.parseInputArray(form_obj.input, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.input, type, form_num, form_type, form_name);
					}
				}

				//parse barcode tags (set as type barcode)
				if (form_obj.barcode !== undefined) {

					type = "barcode";

					if (Array.isArray(form_obj.barcode)) {
						self.parseInputArray(form_obj.barcode, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.barcode, type, form_num, form_type, form_name);
					}

				}

				//parse location tags (set as type location)
				if (form_obj.location !== undefined) {

					type = "location";

					if (Array.isArray(form_obj.location)) {
						self.parseInputArray(form_obj.location, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.location, type, form_num, form_type, form_name);
					}
				}

				//parse audio tags (set as type audio)
				if (form_obj.audio !== undefined) {

					type = "audio";
					form_has_media = 1;

					if (Array.isArray(form_obj.audio)) {
						self.parseInputArray(form_obj.audio, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.audio, type, form_num, form_type, form_name);
					}
				}

				//parse video tags (set as type video)
				if (form_obj.video !== undefined) {

					type = "video";
					form_has_media = 1;

					if (Array.isArray(form_obj.video)) {
						self.parseInputArray(form_obj.video, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.video, type, form_num, form_type, form_name);
					}

				}

				//parse photo tags (set as type photo)
				if (form_obj.photo !== undefined) {

					type = "photo";
					form_has_media = 1;

					if (Array.isArray(form_obj.photo)) {
						self.parseInputArray(form_obj.photo, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.photo, type, form_num, form_type, form_name);
					}

				}

				//parse textarea tags (set as type textarea)
				if (form_obj.textarea !== undefined) {

					type = "textarea";

					if (Array.isArray(form_obj.textarea)) {
						self.parseInputArray(form_obj.textarea, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.textarea, type, form_num, form_type, form_name);
					}

				}

				/*
				* Parse tags which allows selection from multiple values (drodpdown, checkbox, radio )
				*
				*  ! select -> checkbox
				*  ! select1 -> select (dropdown)
				*  ! radio -> radio button
				*
				*  Each sets of possible values is within the itme array
				*/

				//parse radio tags (set as type radio)
				if (form_obj.radio !== undefined) {

					type = "radio";

					if (Array.isArray(form_obj.radio)) {
						self.parseInputArray(form_obj.radio, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.radio, type, form_num, form_type, form_name);
					}

				}

				//parse select1 tags (set as type select)
				if (form_obj.select1 !== undefined) {

					type = "select";

					if (Array.isArray(form_obj.select1)) {
						self.parseInputArray(form_obj.select1, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.select1, type, form_num, form_type, form_name);
					}
				}

				//parse select tags (set as type checkbox)
				if (form_obj.select !== undefined) {

					type = "checkbox";

					if (Array.isArray(form_obj.select)) {
						self.parseInputArray(form_obj.select, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.select, type, form_num, form_type, form_name);
					}

				}

				//parse <branch> tag (set as type bracnh)
				if (form_obj.branch !== undefined) {

					type = "branch";
					form_has_branches = 1;

					if (Array.isArray(form_obj.branch)) {
						self.parseInputArray(form_obj.branch, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.branch, type, form_num, form_type, form_name);
					}
				}

				/*
				* After all the field tags have been parsed, store input list for the current form and clear it for next form
				*/

				//store list of inputs for current form (hierarchy-> main=true, branch->main=false)
				if (form_obj["@main"] === "true") {
					self.inputs.push({
						num : form_obj["@num"],
						input_list : self.input_list.slice(0)
					});

					//count current form as hierarchy
					self.project.total_hierarchy_forms++;

				} else {
					self.branch_inputs.push({
						num : form_obj["@num"],
						input_list : self.input_list.slice(0)
					});

					//count current form as branch
					self.project.total_branch_forms++;
				}

				//add total number of inputs to current parsed form object
				self.parsed_forms[i].total_inputs = self.input_list.length;

				//add is_form_genkey_hidden flag, meaning the input field with the auto generated key will not be shown
				self.parsed_forms[i].is_form_genkey_hidden = self.is_form_genkey_hidden;

				//add flag to see if a form contains media input
				self.parsed_forms[i].has_media = form_has_media;

				//add flag to see if a form contains branches
				self.parsed_forms[i].has_branches = form_has_branches;

			}//for each raw_forms

			console.log("Parsed forms");
			console.log(self.parsed_forms, true);

		};

		return module;

	}(EC.Parse));

/*jslint vars: true , nomen: true, devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Routing
 */

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.branchInputsPageEvents = function () {
    'use strict';

    $(document).on('pageinit', '#branch-feedback', function () {
        console.log('feedback init called');
    });

    /********BRANCH INPUT TEXT*********/
    $(document).on('pagebeforeshow', '#branch-text', function (e) {
        //get the branch-text.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-text', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /**********************************/

    /********BRANCH INPUT INTEGER*********/
    $(document).on('pagebeforeshow', '#branch-integer', function (e) {
        //get the branch-integer.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-integer', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT DECIMAL*********/
    $(document).on('pagebeforeshow', '#branch-decimal', function (e) {
        //get the branch-decimal.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-decimal', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT DATE*********/
    $(document).on('pagebeforeshow', '#branch-date', function (e) {
        //get the #branch-date.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-date', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT TIME*********/
    $(document).on('pagebeforeshow', '#branch-time', function (e) {
        //get the branch-time.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-time', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    //#select is rendered as dropdown
    /********BRANCH INPUT DROPDOWN*********/
    $(document).on('pagebeforeshow', '#branch-select', function (e) {
        //get the branch-select.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-select', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT RADIO*********/
    $(document).on('pagebeforeshow', '#branch-radio', function (e) {

        //get the branch-radio.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));

        //@bug in JQM maybe...I do not know any other way to make it work
        $('div#input-radio input:radio').each(function (i) {

            //if a value is cached, pre-select that radio button option manually triggering a 'vclick' event
            if ($(this).attr('checked')) {
                $(this).next().trigger('vclick');
            }
        });
    });
    // $(document).on('pagecreate', '#branch-radio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /* BRANCH INPUT CHECKBOX ************/
    $(document).on('pagebeforeshow', '#branch-checkbox', function (e) {
        //get the branch-checkbox,html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-checkbox', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /* BRANCH INPUT TEXTAREA ************/
    $(document).on('pagebeforeshow', '#branch-textarea', function (e) {
        //get the #textarea page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-textarea', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT LOCATION **********/
    $(document).on('pagebeforeshow', '#branch-location', function (e) {
        //get the branch-location.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-location', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT PHOTO *************/
    $(document).on('pagebeforeshow', '#branch-photo', function (e) {
        //get the branch-photo.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-photo', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT VIDEO *************/
    $(document).on('pagebeforeshow', '#branch-video', function (e) {
        //get the branch-video.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-video', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT AUDIO *************/
    $(document).on('pagebeforeshow', '#branch-audio', function (e) {
        //get the branch-audio page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-audio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /*************************************/

    /** BRANCH INPUT BARCODE *************/
    $(document).on('pagebeforeshow', '#branch-barcode', function (e) {
        //get the  branch-barcode.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-audio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /*************************************/

    $(document).on('pagebeforeshow', '#branch-save-confirm', function (e) {
        //Ask save confirmation to use
        EC.BranchInputs.renderSaveConfirmView();
    });

    $(document).on('pagebeforeshow', '#branch-feedback', function (e) {
        //Show feedback to user
        EC.BranchInputs.renderFeedbackView();
    });
};

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.changePage = function (the_view, the_path) {
    'use strict';

    var view = the_view;
    var page_uri;
    //TODO: make the function reusable when we want or not want to add a new entry in the browser history
    var page;
    var transition;

    page_uri = EC.Utils.getPageBaseURI();
    page = (view === EC.Const.INDEX_VIEW) ? page_uri + view : page_uri + EC.Const.VIEWS_DIR + view;

    console.log('Routing to ---------------------------------> ' + page);

    //remove fade transition on input pages (I find it annoying)
    if (view.indexOf('inputs/') > -1 || view.indexOf('branch_inputs/') > -1) {
        transition = 'none';
    }
    else {
        transition = 'fade';
    }

    $.mobile.changePage(page, {
        transition: transition,
        reverse: false,
        changeHash: true,
        allowSamePageTransition: true
    });
};

/* jslint vars: true , nomen: true devel: true, plusplus: true*/
/* global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.goBack = function (the_page_id) {
    'use strict';

    var page_id = the_page_id;
    var back_btn = null;
    var inactive_tab = null;

    var input_views_ids = [//
        'audio', //
        'barcode', //
        'branch', //
        'checkbox', //
        'date', //
        'decimal', //
        'integer', //
        'location', //
        'photo', //
        'radio', //
        'save-confirm', //
        'save-feedback', //
        'select', //
        'text', //
        'textarea', //
        'time', //
        'video'//
    ];

    var branch_input_views_ids = [//
        'branch-audio', //
        'branch-barcode', //
        'branch-branch', //
        'branch-checkbox', //
        'branch-date', //
        'branch-decimal', //
        'branch-integer', //
        'branch-location', //
        'branch-photo', //
        'branch-radio', //
        'branch-save-confirm', //
        'branch-save-feedback', //
        'branch-select', //
        'branch-text', //
        'branch-textarea', //
        'branch-time', //
        'branch-video'//
    ];

    var hierarchy_views_ids = [//
        'forms', //
        'entries', //
        'entry-values' //
    ];

    var branch_views_ids = [//
        'branch-entries', //
        'branch-entry-values' //
    ];

    var action_views_ids = [//
        'settings', //
        'add-project', //
        'email-backup', //
        'upload', //
        'download' //
    ];



    //if the page is an input view, back button will perform the same action as the
    // top left back button on screen
    if (EC.Utils.inArray(input_views_ids, page_id)) {

        //force a click to on screen back button
        back_btn = $('div#' + page_id + ' div[data-role="header"] div[data-href="back-btn"]');
        back_btn.trigger('vclick');

    }

    //if the page if a branch input view, back button will perform the same action as
    // the top left back button on screen
    if (EC.Utils.inArray(branch_input_views_ids, page_id)) {

        //force a click to on screen back button
        back_btn = $('div#' + page_id + ' div[data-role="header"] div[data-href="back-btn"]');
        back_btn.trigger('vclick');

    }

    //if the page is one of the hierarchy dynamic navigation pages, the back button
    // will perform the same action as the left tab button on screen
    if (EC.Utils.inArray(hierarchy_views_ids, page_id)) {

        //force a click to on screen back button
        inactive_tab = $('div#' + page_id + ' div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        inactive_tab.trigger('vclick');

    }

    /* if the page is one of the branch dynamic navigation pages, the back button
     * will perform the same action as the left tab button on screen i.e back 1 step
     *
     */
    if (EC.Utils.inArray(branch_views_ids, page_id)) {
        //force a click to on screen back button
        inactive_tab = $('div#' + page_id + ' div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        inactive_tab.trigger('vclick');
    }

    //if the page if a action view, back button will perform the same action as the
    // top left back button on screen
    if (EC.Utils.inArray(action_views_ids, page_id)) {

        //force a click to on screen back button
        back_btn = $('div#' + page_id + ' div[data-role="header"] div[data-href="back-btn"]');
        back_btn.trigger('vclick');

    }

};

/*global $, jQuery*/

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.indexPageEvents = function () {
    'use strict';

    $(document).on('pagebeforeshow', '#index', function (e) {

        var back_nav_hash = window.localStorage.back_nav_url;

        //if we are coming to the #index page after a project deletion, force a getProjectList() to update the list of project
        if (window.localStorage.is_project_deleted === '1') {

            EC.Project.getList();

            window.localStorage.removeItem('is_project_deleted');
            return;

        }

        if (back_nav_hash === '#refresh') {
            EC.Project.getList();
            window.localStorage.removeItem('back_nav_hash');
        }

    });

    $(document).on('pagebeforeshow', '#forms', function (e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        console.log('#forms pagebeforeshow');

        //reset breadcrumbs trail
        window.localStorage.removeItem('breadcrumbs');
        window.localStorage.removeItem('entries_totals');
        //reset 'editing mode' flag
        window.localStorage.removeItem('edit_mode');

        //get all form by project_id
        EC.Forms.getList(decodeURI($query_param));

    });

    $(document).on('pagebeforeshow', '#entries', function (e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        //reset 'editing mode' flag
        window.localStorage.removeItem('edit_mode');

        //get all entries
        EC.Entries.getList(decodeURI($query_param));

    });

    $(document).on('pagebeforeshow', '#entry-values', function (e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        EC.Entries.getEntryValues(decodeURI($query_param));

    });

    //settings page
    $(document).on('pagebeforeshow', '#settings', function (e) {
        EC.Settings.renderView();
    });

    //add project page
    $(document).on('pagebeforeshow', '#add-project', function (e) {
        EC.Project.renderAddProjectView();
    });

    //email backup page
    $(document).on('pagebeforeshow', '#email-backup', function (e) {
        EC.EmailBackup.renderSendEmailView();
    });

    //upload page
    $(document).on('pagebeforeshow', '#upload', function (e) {
        EC.Upload.renderUploadView(false);
    });

    //download page
    $(document).on('pagebeforeshow', '#download', function (e) {
        EC.Download.renderDownloadView();
    });

    /********************************************************/
    //force close the activity spinner loader
    $(document).on('pageshow', '#index', function (e) {
        EC.Notification.hideProgressDialog();
        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }

    });

    $(document).on('pageshow', '#forms', function (e) {

        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }
        //$('div#forms').scrollTop(18);
        EC.Notification.hideProgressDialog();

    });

    $(document).on('pageshow', '#entries', function (e) {

        if (window.localStorage.previous_tapped_entry_Y) {
            $.mobile.silentScroll(parseInt(window.localStorage.previous_tapped_entry_Y, 10));
        }
        else {
            /*@bug on iOS: hack to force a scroll to the top of the page,
             otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
            if (window.device) {
                if (window.device.platform === EC.Const.IOS) {
                    $.mobile.silentScroll(0);
                }
            }

        }

        EC.Notification.hideProgressDialog();
    });

    $(document).on('pageshow', '#entry-values', function (e) {
        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }

        EC.Notification.hideProgressDialog();
    });
    /********************************************************/

    /*Localise placeholders: it needs to be done here, after the markup has been enhanced by JQM
     *placing it in pagebeforeshow was not working
     */
    $(document).on('pageshow', '#add-project', function (e) {

        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }


        //add placeholder
        $('div#add-project div#add-project-content ul#projects-autocomplete').attr('data-filter-placeholder', 'type_project_name_here');

        //Localise placeholder if device language is not set to English and the language is supported
        //if the device language is not localised or it is English, do not translate placeholder
        if (Object.keys(EC.Dictionary).indexOf(window.localStorage.DEVICE_LANGUAGE) !== -1) {
            EC.Localise.applyToPlaceholders(window.localStorage.DEVICE_LANGUAGE);
        }

    });
};

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Routing
 */

var EC = window.EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.inputsPageEvents = function () {
    'use strict';

    $(document).on('pageinit', '#feedback', function () {

        console.log('feedback init called');

    });

    $(document).on('pagebeforeshow', '#text', function () {

        //get the #text page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#integer', function () {

        //get the #number page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#decimal', function () {

        //get the #number page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#date', function () {

        //get the #date page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#time', function () {

        //get the #time page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    //#select is dropdown
    $(document).on('pagebeforeshow', '#select', function () {

        //get the #dropdown page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#radio', function () {

        //get the #radio page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

        //@bug in JQM maybe...I do not know any other way to make it work
        $('div#input-radio input:radio').each(function () {

            //if a value is cached, pre-select that radio button option manually triggering a 'vclick' event
            if ($(this).attr('checked')) {
                $(this).next().trigger('vclick');
            }
        });
        //@bug

    });

    $(document).on('pagebeforeshow', '#checkbox', function () {

        //get the #checkbox page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#textarea', function () {

        //get the #textarea page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagecreate', '#textarea', function () {
        //EC.Utils.updateFormCompletion(false);
    });

    $(document).on('pagebeforeshow', '#location', function () {

        //get the #location page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#photo', function () {

        //get the #photo page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#video', function () {

        //get the #video page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#audio', function () {

        //get the #audio page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#barcode', function () {

        //get the #barcode page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    $(document).on('pagebeforeshow', '#branch', function () {

        //reset cached branch objects in localStorage
        window.localStorage.removeItem('branch_current_position');
        window.localStorage.removeItem('branch_entries');
        window.localStorage.removeItem('branch_form_has_jumps');
        window.localStorage.removeItem('branch_form_id');
        window.localStorage.removeItem('branch_form_name');
        window.localStorage.removeItem('branch_inputs_total');
        window.localStorage.removeItem('branch_inputs_trail');
        window.localStorage.removeItem('branch_inputs_values');

        //get the #branch page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    $(document).on('pagebeforeshow', '#branch-entries', function () {

        //get the #branch-entries page and inject the input data
        EC.Entries.getBranchEntriesList();

    });

    $(document).on('pagebeforeshow', '#branch-entry-values', function (e) {

        //get full url with query string
        var $query_param = e.delegateTarget.baseURI;

        //get the #branch page and inject the input data
        EC.Entries.getBranchEntryValues(decodeURI($query_param));

    });

    $(document).on('pageshow', '#branch-entry-values', function () {
        EC.Notification.hideProgressDialog();
    });

    $(document).on('pagebeforeshow', '#save-confirm', function () {
        //Ask save confirmation to use
        EC.Inputs.renderSaveConfirmView();
    });

    $(document).on('pagebeforeshow', '#feedback', function () {

        //Show feedback to user
        EC.Inputs.renderFeedbackView();

    });

    /********************************************************/
    //force close the activity spinner loader
    $(document).on('pageshow', '#branch-entries', function () {
        EC.Notification.hideProgressDialog();
    });
    $(document).on('pageshow', '#branch-entry-values', function () {
        EC.Notification.hideProgressDialog();
    });
    /********************************************************/

};

var EC = EC || {};
EC.Dictionary = EC.Dictionary || {};
EC.Dictionary = {

    en: {
        home: 'Home',
        settings: 'Settings',
        help: 'Help',
        rate_us: 'Rate Us',
        add_project: 'Add project',
        loading_project: 'Loading project',
        search_project: 'Search a project using the box above',
        projects: 'Projects',
        filter_project: 'Filter projects...',
        no_projects_found: 'No projects found!',
        project_list: 'Project List',
        type_project_name_here: 'Type a project name here...',
        tap_the: 'Tap the ',
        button: 'button ',
        add: 'Add ',
        to: ' to ',
        to_add: 'to add ',
        to_add_one: 'to add one.',
        upload_to: 'Upload to ',
        upload_data: 'Upload Data',
        upload_images: 'Upload Images',
        upload_audios: 'Upload Audios',
        upload_videos: 'Upload Videos',
        remote_server_url: 'Remote Server URL',
        pagination: 'Pagination: entries listed per page',
        app_version: 'App Version: ',
        forms: 'Forms',
        backup_data: 'Backup Project Data',
        restore_data: 'Restore Data from Backup',
        email_backup: 'Email Backup',
        download_remote_data: 'Download remote data',
        unsync_entries: 'Unsync All Entries Data',
        delete_entries: 'Delete All Entries',
        export_all_entries_to_csv: 'Export Data to CSV',
        export_all_entries_to_csv_confirm: 'Are you sure you want to export data to CSV?',
        delete_synced: 'Delete Synced Entries',
        delete_media: 'Delete Media Files',
        delete_project: 'Delete Project',
        show_more: 'Show more',
        no_entries_found: 'No entries found!',
        enter_email: 'Enter email address',
        email_backup_to: 'Email Backup for',
        select_form_download: 'Select form to download data from',
        delete_entry: 'Delete Entry',
        unsync_entry: 'Unsync Entry',
        prev: 'Previous',
        next: 'Next',
        record: 'Record',
        stop: 'Stop',
        play: 'Play',
        recording: 'Recording',
        no_audio_available: 'No audio available yet',
        scan: 'Scan',
        type_confirm: 'Type again to confirm',
        pk_not_editable: 'This value is the primary key for this entry, it cannot be edited. ',
        add_branch_form: 'Add branch form',
        list_branch_entries: 'List branch entries',
        set_location: 'Set Location',
        take_photo: 'Take Photo',
        tap_to_store: 'Tap button to store values',
        store: 'Store',
        store_edit: 'Store Edit',
        data_saved_success: 'Data saved successfully',
        branch_data_saved_success: 'Branch data saved successfully',
        add_another: 'Add another ',
        list: 'List ',
        entries: ' entries ',
        add_video: 'Add video',
        play_video: 'Play video',
        back_to: 'Back to ',
        error: 'Error',
        project_already_loaded: 'Project already loaded on device!',
        exit: 'Exit',
        exit_confirm: 'Are you sure? \nData will NOT be saved',
        value_exist: 'Value already exists!',
        invalid_integer: 'The number entered is not an integer value!',
        invalid_decimal: 'The value entered is not a decimal value! Only numbers and the dot "." are allowed',
        pk_reserved_char: 'This field is a primary key: it cannot cointain the reserved char: ',
        invalid_regex: 'This field does not match the regex: ',
        values_unmatched: 'This fields do not match each other',
        out_of_range: 'Value entered is out of range',
        reserved_keyword: 'Value entered is an Epicollect+ reserved keyword',
        field_required: 'This field is required',
        invalid_xml: 'Project XML is no valid, maybe no forms yet?',
        connection_timeout: 'Server connection time out',
        connection_lost: 'Connection lost, please retry',
        project_not_found_on_server: 'Project not found on server ',
        project_not_found: 'Project not found!',
        unknow_error: 'Unknown Error!',
        leaving_current_form: 'Leaving current form',
        save_before_leave: 'Save data before leaving?',
        edit_saved: 'Edit saved!',
        missing_pk: 'Primary key value for this form is missing.You probably jumped a required field, please go back and try again',
        gps_disabled: 'Please enable GPS',
        locating: 'Locating',
        wait: 'Wait...',
        location_acquired: 'Location acquired',
        location_fail: ', not able to locate!',
        location_service_fail: 'Something went wrong...are Location Services enabled for Epicollect5?',
        failed_because: 'Failed because: ',
        download_success: 'All data downloaded',
        parent_key_for_1: 'Parent keys for ',
        parent_key_for_2: ' are missing on device database, please download ',
        parent_key_for_3: ' entries first',
        no_internet: 'No Internet Connection!!',
        invalid_email: 'Not a valid email address!!',
        invalid_email_client: 'Please set up a mail client app first',
        generic_error: 'An error occurred, please retry',
        entry_unsynced: 'Entry unsynced',
        entry_deleted: 'Entry deleted',
        all_data_synced: 'All data unsynced',
        all_entries_deleted: 'All entries deleted',
        data_exported_to_csv: 'Data exported to csv',
        all_media_deleted: 'All media deleted',
        all_synced_deleted: 'All synced entries deleted',
        branch_entry_deleted: 'Branch entry deleted',
        delete_branch_entry: 'Delete Branch Entry',
        delete_entry_confirm: 'Are you sure you want to delete this entry?',
        unsync_entry_confirm: 'Are you sure you want to unsync this entry?',
        delete_entry_with_children_confirm: 'Are you sure you want to delete this entry?  \n This entry and all its children will be deleted!',
        unsync_all_data: 'Unsync all data',
        unsync_all_data_confirm: 'Are you sure you want to unsync all the data?',
        delete_project_confirm: 'Are you sure you want to delete this project?',
        delete_all_entries: 'Delete all entries',
        delete_all_entries_confirm: 'Are you sure you want to delete all entries?',
        delete_all_media: 'Delete all media files',
        delete_all_media_confirm: 'Are you sure you want to delete all media files?',
        delete_all_synced: 'Delete all synced entries',
        delete_all_synced_confirm: 'Are you sure you want to delete all synced entries?',
        backup_data_confirm: 'Are you sure you want to backup all project entries?',
        restore_data_confirm: 'Are you sure you want to restore from a backup? Existing data will be overriden!',
        warning: 'Warning',
        edited_jump: 'You modified a value linked to a jump so it is not possible to save the edit yet \nTap NEXT to proceed or revert your changes before saving',
        success: 'Success',
        project_backup_success: 'Project backed up!',
        project_deleted: 'Project deleted',
        project_no_spaces_allowed: 'Project name cannot have empty spaces',
        project_empty_not_allowed: 'Project name cannot be empty',
        project_restored: 'Project restored!',
        upload_error: ' An error occurred while uploading, please retry. ',
        no_backup_saved: 'No backup file found!!',
        all_images_uploaded: 'All image files uploaded! ',
        all_audios_uploaded: 'All audio files uploaded! ',
        all_videos_uploaded: 'All video files uploaded! ',
        uploading: 'Uploading...',
        data_upload_success: ' Data uploaded! ',
        check_your_internet: ', check you internet connection.',
        settings_saved_success: 'Settings saved',
        questions: ' Questions',
        hierarchy_forms: ' Hierarchy form(s)',
        branch_forms: ' Branch(es)',
        sending_message: 'Sending message...',
        backup_for: 'Backup for ',
        backup_for_project: 'Backup for project ',
        is_attached: ' is attached',
        select_one_option: 'Select one option',
        photo_available: 'Photo available',
        no_photo: 'No photo saved',
        audio_available: 'Audio available',
        no_audio: 'No audio saved',
        video_available: 'Video available',
        no_video: 'No video saved',
        no: 'No',
        save: 'Save',
        dismiss: 'Dismiss',
        confirm: 'Confirm'
    },
    it: {
        home: 'Home',
        settings: 'Impostazioni',
        help: 'Aiuto',
        rate_us: 'Votaci',
        add_project: 'Aggiungi progetto',
        loading_project: 'Caricando progetto',
        search_project: 'Cerca progetto usando l\'input di testo sopra',
        projects: 'Progetti',
        filter_project: 'Filtra progetti',
        no_projects_found: 'Nessun progetto trovato!',
        project_list: 'Lista progetti',
        type_project_name_here: 'Digita il nome del progetto...',
        tap_the: 'Premi il ',
        button: '',
        add: 'Add ',
        to: ' a ',
        to_add: 'per aggiungere ',
        to_add_one: 'per aggiungerne uno ',
        upload_to: 'Carica dati a ',
        upload_data: 'Carica dati',
        upload_images: 'Carica foto',
        upload_audios: 'Carica tracce audio',
        upload_videos: 'Carica video',
        remote_server_url: 'URL del server remoto',
        pagination: 'Paginazione: quanti elementi per pagina',
        app_version: 'Versione della app: ',
        forms: 'Schede',
        backup_data: 'Backup dati',
        restore_data: 'Ripristina da Backup',
        email_backup: 'Posta Backup',
        download_remote_data: 'Scarica dati remoti',
        unsync_entries: 'De-sincronizza dati',
        delete_entries: 'Cancella dati',
        delete_synced: 'Cancella elementi sincronizzati',
        delete_media: 'Cancella files multimedia',
        delete_project: 'Cancella progetto',
        show_more: 'Mostra altri elementi',
        no_entries_found: 'Nessun elemento trovato!',
        enter_email: 'Inserisci indirizzo email',
        email_backup_to: 'Manda backup tramite email per ',
        select_form_download: 'Seleziona la scheda da cui scaricare dati',
        delete_entry: 'Cancella elemento',
        unsync_entry: 'De-sincronizza elemento',
        prev: 'Prec',
        next: 'Succ',
        record: 'Record',
        stop: 'Stop',
        play: 'Play',
        recording: 'Registrazione',
        no_audio_available: 'Nessuna registrazione trovata',
        scan: 'Scan',
        type_confirm: 'Digita di nuovo pre confermare',
        pk_not_editable: 'Questo dato &egrave; una chiave primaria, non si &ograve; modificare',
        add_branch_form: 'Aggiungi scheda diramazione',
        list_branch_entries: 'Lista schede diramate',
        set_location: 'Imposta posizione',
        take_photo: 'Scatta foto',
        data_saved_success: 'Dati salvati con successo',
        branch_data_saved_success: 'Dati ramificazione salvati con successo',
        add_another: 'Aggiungi un altro ',
        list: 'Lista ',
        entries: ' elementi ',
        add_video: 'Aggiungi video',
        play_video: 'Play video',
        back_to: 'Torna a ',
        error: 'Error',
        project_already_loaded: 'Questo progetto esiste gi&agrave;',
        exit: 'Exit',
        exit_confirm: 'Sei sicuro? \nDati NON verranno salvati',
        value_exist: 'Questo valore esiste gi&agrave;',
        invalid_integer: 'Valore inserito non &egrave; un numero intero',
        invalid_decimal: 'Valore inserito non &egrave; un  numero decimale, solo numeri e punto (.) sono permessi',
        pk_reserved_char: 'Questo campo &egrave; una chiave primaria, non pu&ograve; contenere il carattere riservato: ',
        invalid_regex: 'Valore non soddisfa la epressione regolare: ',
        values_unmatched: 'I valori non corrispondono',
        out_of_range: 'Valore inserito &egrave; fuori dai limiti',
        reserved_keyword: 'Valore inserito &egrave; un valore riservato a Epicollect+',
        field_required: 'Un valore &egrave; richiesto',
        invalid_xml: 'Progetto XML non valiso, forse non ha schede ancora?',
        connection_timeout: 'Connessione al server scaduta',
        connection_lost: 'Connessione persa, riprova',
        project_not_found_on_server: 'Progetto non trovato nel server ',
        project_not_found: 'Progetto non trovato!',
        unknow_error: 'Errore sconosciuto!',
        leaving_current_form: 'Uscire da scheda corrente',
        save_before_leave: 'Salvare dati prima di uscire?',
        edit_saved: 'Modifiche salvate',
        missing_pk: 'Manca chive primaria.Probabilmente un campo obbligatorio &egrave; stato saltato, torna indietro e riprova',
        gps_disabled: 'Per favore, attivare GPS',
        locating: 'Localizzazione',
        wait: 'Aspetta...',
        location_acquired: 'Posizione acquisita',
        location_fail: ', incapace di trovare posizione',
        location_service_fail: 'Qualcosa &egrave; andato storto...sono i Servizi Locazione abilitati per Epicollect5 app?',
        failed_because: 'Fallito perch&egrave;: ',
        download_success: 'Tutti i dati scaricati',
        parent_key_for_1: 'Chiavi padre per ',
        parent_key_for_2: ' mancano nel database del dispositivo, scarica ',
        parent_key_for_3: ' elementi prima',
        no_internet: 'Nessuna connessione internet!!',
        invalid_email: 'Indirizzo Email non valido!!',
        invalid_email_client: 'Una app per mandare emails non &egrave; stata ancora impostata',
        generic_error: 'Errore, riprova',
        entry_unsynced: 'Elemento de-sincronizzato',
        entry_deleted: 'Elemento cancellato',
        all_data_synced: 'Tutti i dati sincronizzati',
        all_entries_deleted: 'Tutti gli elementi cancellati',
        all_media_deleted: 'Tutti i media cancellati',
        all_synced_deleted: 'Tutti gli elementi sincronizzati cancellati',
        branch_entry_deleted: 'Elemento ramificato cancellato',
        delete_branch_entry: 'Cancella elemento ramificato',
        delete_entry_confirm: 'Sei sicuro che vuoi cancellare questo elemento?',
        unsync_entry_confirm: 'Sei sicuro che vuoi de-sincronizzare questo elemento?',
        delete_entry_with_children_confirm: 'Sei sicuro che vuoi cancellare questo elemento?  \n Questo elemento e tutti i "figli" verranno cancellati',
        unsync_all_data: 'Unsync all data',
        unsync_all_data_confirm: 'Sei sicuro che vuoi de-sincronizzare tutti i dati?',
        delete_project_confirm: 'Sei sicuro che vuoi cancellare questo progetto?',
        delete_all_entries: 'Cancella tutti gli elementi',
        data_exported_to_csv: 'Dati esportati in formato csv',
        delete_all_entries_confirm: 'Sei sicuro che vuoi cancellare tutti gli elementi',
        export_all_entries_to_csv: 'Esportare dati formato csv',
        export_all_entries_to_csv_confirm: 'Sicuro di esportare tutti dati in formato csv?',
        delete_all_media: 'Cancellare tutti i file media',
        delete_all_media_confirm: 'Sei sicuro che vuoi cancellare tutti i file media?',
        delete_all_synced: 'Cancella tutti elementi sincronizzati',
        delete_all_synced_confirm: 'Sei sicuro che vuoi cancellare tutti gli elementi sincronizzati?',
        backup_data_confirm: 'Sicuro che vuoi fare un backup',
        restore_data_confirm: 'Sicuro che vuoi ripristinare da backup? Dati esistenti verranno persi!',
        warning: 'Attenzione',
        edited_jump: 'Hai modificato un valore collegato a un salto quindi non &egrave; possibile salvare le modifiche \nPremi "Successivo" per procedere o annulla le modifiche per salvare',
        success: 'Successo',
        project_backup_success: 'Backup del progetto eseguito!',
        project_deleted: 'Progetto cancellato',
        project_no_spaces_allowed: 'Il nome del progetto non pu&ograve; aver spazi',
        project_empty_not_allowed: 'Il nome del progetto non pu&ograve; essere vuoto',
        project_restored_: 'Progetto ripristinato!',
        upload_error: ' Errore durante caricamento dati, riprovare. ',
        no_backup_saved: 'Nessun file di backup trovato!!',
        all_images_uploaded: 'Tutte i file immagini caricati! ',
        all_audios_uploaded: 'Tutti i file audio caricati! ',
        all_videos_uploaded: 'Tutti i file video caricati! ',
        uploading: 'Caricando...',
        data_upload_success: ' Dati caricati! ',
        check_your_internet: ', controlla la tua connessione internet.',
        settings_saved_success: 'Impostazioni salvate',
        questions: ' Domande',
        hierarchy_forms: ' Schede gerarchia',
        branch_forms: ' Schede ramificate',
        sending_message: 'Mandando email...',
        backup_for: 'Backup per ',
        backup_for_project: 'Il backup per il progetto ',
        is_attached: ' &egrave; attaccato',
        select_one_option: 'Scegli opzione',
        photo_available: 'Foto presente',
        no_photo: 'Nessuna foto salvata',
        audio_available: 'Traccia audio presente',
        no_audio: 'Nessuna traccia audio presente',
        video_available: 'Video presente',
        no_video: 'Nessun video presente',
        no: 'No',
        save: 'Salva',
        dismiss: 'Annulla',
        confirm: 'Conferma'
    }
};

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Localise
 */

var EC = EC || {};
EC.Localise = EC.Localise || {};
EC.Localise = ( function () {
    "use strict";

    //TODO: get device language from localStorage (set in app.js)
    var language;
    var self;

    function setLanguage() {
        language = window.localStorage.DEVICE_LANGUAGE;
    }

    //TODO: return translation based on key and device language
    function getTranslation(the_key) {

        var key_to_lookup = the_key;
        var translated_string = "";

        try {
            translated_string = EC.Dictionary[language][key_to_lookup];
        } catch (error) {
            translated_string = "Translation not found";
        }

        return translated_string;

    }

    function applyToHTML(the_language) {

        //TODO for each data-i10n, replace text with translated one
        var page_id = $.mobile.activePage.attr("id");
        var strings = $('div#' + page_id + ' [data-i10n]');
        var translated_string;
        var self = this;

        console.log(strings);

        strings.each(function (index) {

            console.log($(this).data("i10n"));
            translated_string = self.getTranslation($(this).data("i10n"));
            $(this).text(translated_string);

        });

    }

    function applyToPlaceholders(the_language) {

        var page_id = $.mobile.activePage.attr("id");
        var placeholders = $('div#' + page_id + ' [placeholder]');
        var translated_string;
        var self = this;

        placeholders.each(function (index) {

            console.log($(this).attr("placeholder"));
            translated_string = self.getTranslation($(this).attr("placeholder"));
            $(this).attr("placeholder", translated_string);

        });

    }

    return {
        setLanguage: setLanguage,
        getTranslation: getTranslation,
        applyToHTML: applyToHTML,
        applyToPlaceholders: applyToPlaceholders
    };

}());

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *   @module Branch
 *
 */
var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function(module) {"use strict";

        var self;
        var deferred;
        //keep track of foreign keys
        var project_insertId;
        var branch_forms_IDs = [];
        //store forms
        var branch_forms;
        //we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
        var branch_form_num_index = 0;

        var _errorCB = function(the_tx, the_result) {
            console.log(the_result);
        };

        //Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
        var _commitBranchFormsTX = function(tx) {

            var i;
            var iLenght = branch_forms.length;
            var query;
            for ( i = 0; i < iLenght; i++) {

                query = "";
                query += 'INSERT INTO ec_branch_forms (project_id, num, name, key, has_media, is_genkey_hidden, total_inputs) ';
                query += 'VALUES ("';
                query += project_insertId + '", "';
                query += branch_forms[i].num + '", "';
                query += branch_forms[i].name + '", "';
                query += branch_forms[i].key + '", "';
                query += branch_forms[i].has_media + '", "';
                query += branch_forms[i].is_form_genkey_hidden + '", "';
                query += branch_forms[i].total_inputs + '");';

                //keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
                branch_forms_IDs.push({
                    num : branch_forms[i].num,
                    id : 0
                });

                tx.executeSql(query, [], _commitBranchFormsSQLSuccess, _errorCB);
            }

        };

        /*
         *  @method _commitBranchFormsSQLSuccess
         *
         *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
         *	it is called as a callback for each form executeSql()
         */
        var _commitBranchFormsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its form
            branch_forms_IDs[branch_form_num_index].id = the_result.insertId;
            branch_form_num_index++;

        };

        //resets forms array
        var _commitBranchFormsSuccessCB = function() {

            //reset forms arrays
            branch_forms.length = 0;
            
            //return branch forms IDs
            deferred.resolve(branch_forms_IDs);

        };

        /**
         * @method insertForms
         */
        module.commitBranchForms = function(the_branch_forms, the_project_insertId) {

            self = this;
            deferred = new $.Deferred();
            branch_forms = the_branch_forms;
            project_insertId = the_project_insertId;
            branch_forms_IDs.length = 0;
            branch_form_num_index = 0;

            EC.db.transaction(_commitBranchFormsTX, _errorCB, _commitBranchFormsSuccessCB);

            return deferred.promise();
        };

        return module;

    }(EC.Branch));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *   @module Branch
 *
 */
var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function(module) {"use strict";

		var self;
		var deferred;
		var branch_max_form_ID;
		//keep track of foreign keys
		var project_insertId;
		var branch_forms_IDs = [];
		//store forms
		var branch_forms;
		//we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
		var branch_form_num_index = 0;
		
		var _errorCB = function(the_tx, the_result){
			console.log(the_result);
		};

		//Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
		var _commitBranchFormsTX = function(tx) {

			var i;
			var iLenght = branch_forms.length;
			var query;
			for ( i = 0; i < iLenght; i++) {

				query = "";
				query += 'INSERT INTO ec_branch_forms (project_id, num, name, key, has_media, is_genkey_hidden, total_inputs) ';
				query += 'VALUES ("';
				query += project_insertId + '", "';
				query += branch_forms[i].num + '", "';
				query += branch_forms[i].name + '", "';
				query += branch_forms[i].key + '", "';
				query += branch_forms[i].has_media + '", "';
				query += branch_forms[i].is_form_genkey_hidden + '", "';
				query += branch_forms[i].total_inputs + '");';

				//keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
				branch_forms_IDs.push({
					num : branch_forms[i].num,
					id : 0
				});

				tx.executeSql(query, [], _commitBranchFormsSQLSuccess, _errorCB);
			}

		};

		/*
		 *  @method _commitBranchFormsSQLSuccess
		 *
		 *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
		 *	it is called as a callback for each form executeSql()
		 */
		var _commitBranchFormsSQLSuccess = function(the_tx, the_result) {

			// _id of last entered row will be max_form_ID + 1
			branch_forms_IDs[branch_form_num_index].id = ++branch_max_form_ID;
			branch_form_num_index++;

		};

		//resets forms array
		var _commitBranchFormsSuccessCB = function() {

			//reset forms arrays
			branch_forms.length = 0;
			
			deferred.resolve(branch_forms_IDs);

		};
		
		var _getHighestIdTX = function(tx) {

			var query = "SELECT MAX(_id) AS _id from ec_branch_forms";
			
			//reset auto increment for ec_forms table
			var reset_seq_query = 'UPDATE sqlite_sequence SET seq = (SELECT MAX(_id) FROM ec_branch_forms) WHERE name="ec_branch_forms"';

			tx.executeSql(query, [], _getHighestIdSQLSuccess, self.errorCB);
			tx.executeSql(reset_seq_query, [], _resetSequenceSQLSuccess, null);

		};

		var _getHighestIdSQLSuccess = function(the_tx, the_result) {
			branch_max_form_ID = the_result.rows.item(0)._id;
		};

		var _getHighestIdSuccessCB = function() {
			
			//we got the max _id, perform all the INSERT transactions
			EC.db.transaction(_commitBranchFormsTX, self.errorCB, _commitBranchFormsSuccessCB);

		};
		
		var _resetSequenceSQLSuccess = function(the_tx, the_result){
		};

		/**
		 * @method commitBranchForms. Due to a bug on iOS (insertId undefined after INSERT)
		 * we need to get the MAX(_id) of the table ec_branch_forms, reset the sqlite_sequence table to that value for the ec_branch_forms column 
		 * to basically know in advance what the insertId will be in the database 
		 * 
		 */
		module.commitBranchForms = function(the_branch_forms, the_project_insertId) {

			self = this;
			deferred = new $.Deferred();
			branch_forms = the_branch_forms;
			project_insertId = the_project_insertId;
			branch_forms_IDs.length = 0;
			branch_form_num_index = 0;
			branch_max_form_ID = 0;
			
			//select max _id from ec_branch_forms
			EC.db.transaction(_getHighestIdTX, self.errorCB, _getHighestIdSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Branch));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Branch
 *
 */

var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function(module) {"use strict";

		var self;
		//store input values object
		var branch_input_options;

		var branch_inputs_IDs = [];

		//Transaction to save each options to the db (form multiple option branch_inputs like radio, checkbox, select)
		var _commitBranchInputOptionsTX = function(tx) {

			var i;
			var j;
			var k;
			var iLength;
			var jLength;
			var kLength;
			var ref;
			var branch_input_id;
			var label;
			var value;
			var num;
			var query;

			//loop the branch_input_options array
			for ( i = 0, iLength = branch_input_options.length; i < iLength; i++) {

				//get the branch_input ID based on (branch_input ref AND form num)
				ref = branch_input_options[i].ref;
				num = branch_input_options[i].num;

				//loop all the branch_input IDs to find a match
				for ( j = 0, jLength = branch_inputs_IDs.length; j < jLength; j++) {

					if (branch_inputs_IDs[j].ref === ref && branch_inputs_IDs[j].form_num === num) {

						branch_input_id = branch_inputs_IDs[j].id;
						break;

					}
				}//loop branch_input_IDs

				//commit each option (IF ANY: we allow radio, checkbox and dropdown not to have any option)
				if (branch_input_options[i].options === undefined) {
					kLength = 0;

				} else {

					kLength = branch_input_options[i].options.length;
				}

				for ( k = 0; k < kLength; k++) {

					label = branch_input_options[i].options[k].label;
					value = branch_input_options[i].options[k].value;

					query = 'INSERT INTO ec_branch_input_options (';
					query += 'input_id, ';
					query += 'ref, ';
					query += 'label, ';
					query += 'value)';
					query += 'VALUES ("';
					query += branch_input_id + '", "';
					query += ref + '", "';
					query += label + '", "';
					query += value + '");';

					tx.executeSql(query, [], _commitBranchInputOptionsSQLSuccess, self.errorCB);

				}//loop branch_input_options.options

			}//loop branch_input_options

		};

		var _commitBranchInputOptionsSQLSuccess = function(the_tx, the_result) {

			//console.log(the_result);
			console.log("executeSql SUCCESS BRANCH INPUT OPTIONS");

		};

		var _commitBranchInputOptionsSuccessCB = function() {

			//reset options length
			branch_input_options.length = 0;

			//Branch structure saved to database correctly, trigger custom event
			$(document).trigger('BranchModelReady');
			console.log("BranchModelReady");

		};

		module.commitBranchInputOptions = function(the_brach_input_options, the_branch_inputs_ids) {

			self = this;
			branch_input_options = the_brach_input_options;
			branch_inputs_IDs = the_branch_inputs_ids;

			EC.db.transaction(_commitBranchInputOptionsTX, self.errorCB, _commitBranchInputOptionsSuccessCB);

		};

		return module;

	}(EC.Branch));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Branch
 *
 */

var EC = EC || {};
EC.Branch = ( function(module) {"use strict";

        var self;
        var deferred;

        //track inputs IDs
        var branch_inputs_IDs = [];

        //we need to keep track of the input option @ref to be linked with whatever ID it gets upon being entered to the the db
        var branch_input_option_index = 0;

        //store inputs object
        var branch_inputs;

        var branch_forms_with_media = [];
        var branch_forms_IDs = [];

        //Transaction to save all the inputs for each form to database
        var _commitBranchInputsTX = function(tx) {

            var i;
            var j;
            var k;
            var iLength;
            var jLength;
            var kLength;
            var current_form_num;
            var current_form_id;
            var input_list;
            var input_type;
            var input_ref;
            var query;

            //loop input array, one element per form . Each element contains an input list and the @num attribute
            for ( i = 0, iLength = branch_inputs.length; i < iLength; i++) {

                //get the database ID for the current form
                current_form_num = branch_inputs[i].num;
                for ( j = 0, jLength = branch_forms_IDs.length; j < jLength; j++) {

                    if (branch_forms_IDs[j].num === current_form_num) {

                        //exit loop as soon as we get a match
                        current_form_id = branch_forms_IDs[j].id;
                        break;
                    }
                }//j for

                //loop each input for the current element(form) and commit it
                for ( k = 0, kLength = branch_inputs[i].input_list.length; k < kLength; k++) {

                    input_type = branch_inputs[i].input_list[k].type;
                    input_ref = branch_inputs[i].input_list[k].ref;

                    query = "";
                    query += 'INSERT INTO ec_branch_inputs (';
                    query += 'form_id, ';
                    query += 'label, ';
                    query += 'default_value, ';
                    query += 'type, ';
                    query += 'ref, ';
                    query += 'position, ';
                    query += 'is_primary_key, ';
                    query += 'is_genkey, ';
                    query += 'regex, ';
                    query += 'max_range, ';
                    query += 'min_range, ';
                    query += 'is_required, ';
                    query += 'is_title, ';
                    query += 'has_jump, ';
                    query += 'jumps, ';
                    query += 'has_advanced_jump, ';
                    query += 'datetime_format, ';
                    query += 'has_double_check) ';
                    query += 'VALUES ("';
                    query += current_form_id + '", "';
                    query += branch_inputs[i].input_list[k].label + '", "';
                    query += branch_inputs[i].input_list[k].default_value + '", "';
                    query += input_type + '", "';
                    query += input_ref + '", "';
                    query += branch_inputs[i].input_list[k].position + '", "';
                    query += branch_inputs[i].input_list[k].is_primary_key + '", "';
                    query += branch_inputs[i].input_list[k].is_genkey + '", "';
                    query += branch_inputs[i].input_list[k].regex + '", "';
                    query += branch_inputs[i].input_list[k].max_range + '", "';
                    query += branch_inputs[i].input_list[k].min_range + '", "';
                    query += branch_inputs[i].input_list[k].is_required + '", "';
                    query += branch_inputs[i].input_list[k].is_title + '", "';
                    query += branch_inputs[i].input_list[k].has_jump + '", "';
                    query += branch_inputs[i].input_list[k].jumps + '", "';
                    query += branch_inputs[i].input_list[k].has_advanced_jump + '", "';
                    query += branch_inputs[i].input_list[k].datetime_format + '", "';

                    query += branch_inputs[i].input_list[k].has_double_check + '");';

                    //keep track of current input @ref
                    branch_inputs_IDs.push({
                        ref : input_ref,
                        form_id : current_form_id,
                        form_num : current_form_num
                    });

                    tx.executeSql(query, [], _commitBranchInputsSQLSuccess, self.errorCB);

                }//for each input

            }// for each form

        };

        /* Callback called each time an input executeSql is successful
         *
         * here the input ID (geerated from the query when entering the input) is linked to its input @ref
         */
        var _commitBranchInputsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its input
            branch_inputs_IDs[branch_input_option_index].id = the_result.insertId;
            branch_input_option_index++;

            console.log("executeSql SUCCESS INPUTS");

        };

        var _commitBranchInputsSuccessCB = function() {

            branch_forms_IDs.length = 0;
            branch_inputs.length = 0;
            branch_forms_with_media.length = 0;

            deferred.resolve(branch_inputs_IDs);
            
        };

        module.commitBranchInputs = function(the_branch_inputs, the_branch_forms_ids) {

            self = this;
            deferred = new $.Deferred();
            branch_inputs = the_branch_inputs;
            branch_forms_IDs = the_branch_forms_ids;

            EC.db.transaction(_commitBranchInputsTX, self.errorCB, _commitBranchInputsSuccessCB);

            return deferred.promise();
        };

        return module;

    }(EC.Branch));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Branch
 *
 *  It will save the project branches data structure (branch_forms, branch_inputs, branch_input_values)
 to the database
 *
 */
var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = (function (module) {
    'use strict';

    //callback for a transaction error
    module.errorCB = function (the_error) {
        console.log('Error INSERT STRUCTURE BRANCH');
        console.log(the_error);
        console.log(EC.Utils.TRANSACTION_ERROR);
    };
    return module;
}(EC.Branch));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 * @module DBAdapter
 *
 *   Initialise the database using Phonegap 2.9
 *   Phonegap uses Web SQL specifications on the Chrome browser (Android)
 *
 */
var EC = EC || {};
EC.DBAdapter = EC.DBAdapter || {};
EC.DBAdapter = ( function() {
		"use strict";

		//Initialise private database object if it is not already
		//var EC.db =  window.openDatabase("epicollect", "1.0", "Epicollect", 2000000);

		//native
		//var EC.db =  db || window.sqlitePlugin.openDatabase("epicollect", "1.0",
		// "Epicollect", 2000000);

		/*
		 *  Query to create the database tables
		 *  foreign keys apparently do not work on Web SQL, so it is better to use
		 * triggers or manually do all the delete/update on cascade
		 *
		 */

		var deferred;

		//Query to create ec_projects table
		var cq_ec_projects = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_projects" (', //
		' "_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,', //
		'"name" TEXT, ', //
		'"total_hierarchy_forms" INTEGER DEFAULT 0, ', //
		'"total_branch_forms" INTEGER DEFAULT 0, ', //
		'"is_active" INTEGER DEFAULT 0,', //
		'"uploadToServer" TEXT,', //
		'"downloadFromServer" TEXT,', //
		'"allowDownloadEdits" INTEGER DEFAULT 0,', //
		'"version" TEXT,', '"description" TEXT,', //
		'"radiobutton_image_url" TEXT,', //
		'"reg_mail" TEXT);'//
		].join('');
		//

		//Query to create ec_forms table
		var cq_ec_forms = ['', 'CREATE TABLE IF NOT EXISTS "ec_forms" (', //
		' "_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE,', //
		'"project_id" INTEGER NOT NULL, ', //
		'"name" TEXT, ', //
		'"num" INTEGER, ', //
		'"key" TEXT, ', //
		'"total_inputs" INTEGER, ', //
		'"has_media" INTEGER DEFAULT 0, ', //
		'"has_branches" INTEGER DEFAULT 0, ', //
		'"is_genkey_hidden" INTEGER DEFAULT 0, ', //
		'"entries" INTEGER DEFAULT 0, ', //
		'FOREIGN KEY ("project_id") REFERENCES ec_projects ("_id") ON DELETE CASCADE ON ',
		// //
		'UPDATE CASCADE);'].join('');
		//

		//Query to create ec_branch_forms table
		var cq_ec_branch_forms = ['', 'CREATE TABLE IF NOT EXISTS "ec_branch_forms" (',
		// //
		' "_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE,', //
		'"project_id" INTEGER NOT NULL, ', //
		'"name" TEXT, ', //
		'"num" INTEGER, ', //
		'"key" TEXT, ', //
		'"total_inputs" INTEGER, ', //
		'"has_media" INTEGER DEFAULT 0, ', //
		'"is_genkey_hidden" INTEGER DEFAULT 0, ', //
		'"entries" INTEGER DEFAULT 0, ', //
		'FOREIGN KEY ("project_id") REFERENCES ec_projects ("_id") ON DELETE CASCADE ON ',
		// //
		'UPDATE CASCADE);'].join('');
		//

		//Query to create ec_inputs table
		var cq_ec_inputs = ['', //
		'CREATE  TABLE IF NOT EXISTS "ec_inputs" (', //
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
		'"has_jump" INTEGER,', //
		'"jumps" TEXT,', //
		'"has_advanced_jump" INTEGER, ', //
		'"datetime_format" TEXT,', //
		'"branch_form_name" TEXT,', //
		'FOREIGN KEY ("form_id") REFERENCES ec_forms(_id) ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');
		//

		//Query to create ec_branch_inputs table
		var cq_ec_branch_inputs = ['', //
		'CREATE  TABLE IF NOT EXISTS "ec_branch_inputs" (', //
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
		'"has_jump" INTEGER,', //
		'"jumps" TEXT,', //
		'"has_advanced_jump" INTEGER, ', //
		'"datetime_format" TEXT,', //
		'FOREIGN KEY ("form_id") REFERENCES ec_branch_forms(_id) ON DELETE CASCADE ON ',
		// //
		'UPDATE CASCADE', //
		');'//
		].join('');
		//

		//Query to create ec_input_options table
		var cq_ec_input_options = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_input_options" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL , ', //
		'"ref" TEXT NOT NULL ,', //
		'"label" TEXT NOT NULL ,', //
		'"value" TEXT NOT NULL , ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_branch_input_options table
		var cq_ec_branch_input_options = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_branch_input_options" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL , ', //
		'"ref" TEXT NOT NULL ,', //
		'"label" TEXT NOT NULL ,', //
		'"value" TEXT NOT NULL , ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_branch_inputs("_id") ON DELETE CASCADE ON ',
		// //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_data table
		var cq_ec_data = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_data" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL, ', //
		'"form_id" INTEGER NOT NULL, ', //
		'"position" INTEGER NOT NULL, ', //
		'"parent" TEXT NOT NULL DEFAULT "", ', //
		'"label" TEXT NOT NULL DEFAULT "", ', //
		'"value" TEXT, ', //
		'"ref" TEXT, ', //
		'"is_title" INTEGER DEFAULT 0, ', //
		'"entry_key" TEXT NOT NULL,', //
		'"type" TEXT, ', //
		'"is_data_synced" INTEGER DEFAULT 0, ', //
		'"is_media_synced" INTEGER DEFAULT 0, ', //
		'"is_remote" INTEGER DEFAULT 0, ', //
		'"created_on" INTEGER, ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_data table
		var cq_ec_branch_data = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_branch_data" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL, ', //
		'"form_id" INTEGER NOT NULL, ', //
		'"hierarchy_entry_key_value" TEXT, ', //main form entry key value
		'"hierarchy_entry_key_ref" TEXT, ', //main form entry key value
		'"position" INTEGER NOT NULL, ', //
		'"label" TEXT NOT NULL DEFAULT "", ', //
		'"value" TEXT, ', //
		'"ref" TEXT, ', //
		'"is_title" INTEGER DEFAULT 0, ', //
		'"entry_key" TEXT NOT NULL,', //
		'"type" TEXT, ', //
		'"is_data_synced" INTEGER DEFAULT 0, ', //
		'"is_media_synced" INTEGER DEFAULT 0, ', //
		'"is_remote" INTEGER DEFAULT 0, ', //if the entry has been downloaded remotely or
		// created
		'"is_cached" INTEGER DEFAULT 0, ', // if the etry is cached (branch form saved
		// but not its main form)
		'"is_stored" INTEGER DEFAULT 0, ', // if the entry and its main form is saved
		'"created_on" INTEGER, ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_branch_inputs("_id") ON DELETE CASCADE ON ',
		// //
		'UPDATE CASCADE', //
		');'//
		].join('');

		/**
		 * *********************** TRIGGERS
		 * *******************************************************
		 */

		var tq_delete_forms = [//
		'CREATE TRIGGER delete_forms ', //
		'BEFORE DELETE ', //
		'ON ec_projects ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_forms WHERE ec_forms.project_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_forms = [//
		'CREATE TRIGGER delete_branch_forms ', //
		'BEFORE DELETE ', //
		'ON ec_projects ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_forms WHERE ec_branch_forms.project_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_inputs = [//
		'CREATE TRIGGER delete_inputs ', //
		'BEFORE DELETE ', //
		'ON ec_forms ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_inputs WHERE ec_inputs.form_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_inputs = [//
		'CREATE TRIGGER delete_branch_inputs ', //
		'BEFORE DELETE ', //
		'ON ec_branch_forms ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_inputs WHERE ec_branch_inputs.form_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_input_options = [//
		'CREATE TRIGGER delete_input_options ', //
		'BEFORE DELETE ', //
		'ON ec_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_input_options WHERE ec_input_options.input_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_input_options = [//
		'CREATE TRIGGER delete_branch_input_options ', //
		'BEFORE DELETE ', //
		'ON ec_branch_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_input_options WHERE ec_branch_input_options.input_id = old._id; ',
		// //
		'END'//
		].join('');

		var tq_delete_ec_data = [//
		'CREATE TRIGGER delete_ec_data ', //
		'BEFORE DELETE ', //
		'ON ec_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_data WHERE ec_data.input_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_ec_branch_data = [//
		'CREATE TRIGGER delete_ec_branch_data ', //
		'BEFORE DELETE ', //
		'ON ec_branch_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_data WHERE ec_branch_data.input_id = old._id; ', //
		'END'//
		].join('');

		/**
		 *********************** DROP TRIGGERS
		 */
		var dtq_delete_forms = 'DROP TRIGGER IF EXISTS delete_forms ';
		var dtq_delete_branch_forms = 'DROP TRIGGER IF EXISTS delete_branch_forms ';
		var dtq_delete_inputs = 'DROP TRIGGER IF EXISTS delete_inputs ';
		var dtq_delete_branch_inputs = 'DROP TRIGGER IF EXISTS delete_branch_inputs ';
		var dtq_delete_input_options = 'DROP TRIGGER IF EXISTS delete_input_options ';
		var dtq_delete_branch_input_options = 'DROP TRIGGER IF EXISTS delete_branch_input_options ';
		var dtq_delete_ec_data = 'DROP TRIGGER IF EXISTS delete_ec_data ';
		var dtq_delete_ec_branch_data = 'DROP TRIGGER IF EXISTS delete_ec_branch_data ';

		//Create database if not exist
		var _initDB = function(tx) {

			//tx.executeSql("PRAGMA foreign_keys = ON;"); //apparently PRAGMA is disabled is
			// some browsers

			//create tables
			tx.executeSql(cq_ec_projects);
			tx.executeSql(cq_ec_forms);
			tx.executeSql(cq_ec_branch_forms);
			tx.executeSql(cq_ec_inputs);
			tx.executeSql(cq_ec_branch_inputs);
			tx.executeSql(cq_ec_input_options);
			tx.executeSql(cq_ec_branch_input_options);
			tx.executeSql(cq_ec_data);
			tx.executeSql(cq_ec_branch_data);

			//drop existing triggers
			tx.executeSql(dtq_delete_forms);
			tx.executeSql(dtq_delete_branch_forms);
			tx.executeSql(dtq_delete_inputs);
			tx.executeSql(dtq_delete_branch_inputs);
			tx.executeSql(dtq_delete_input_options);
			tx.executeSql(dtq_delete_branch_input_options);
			tx.executeSql(dtq_delete_ec_data);
			tx.executeSql(dtq_delete_ec_branch_data);

			//add triggers
			tx.executeSql(tq_delete_forms);
			tx.executeSql(tq_delete_branch_forms);
			tx.executeSql(tq_delete_inputs);
			tx.executeSql(tq_delete_branch_inputs);
			tx.executeSql(tq_delete_input_options);
			tx.executeSql(tq_delete_branch_input_options);
			tx.executeSql(tq_delete_ec_data);
			tx.executeSql(tq_delete_ec_branch_data);

		};

		//Global callback for a transaction error
		var errorCB = function(the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log("%c" + the_error.message, "color: red");
		};

		//success callback when database transaction successful
		var _initSuccessCB = function() {
			console.log("TRANSACTION INIT SUCCESS");
			deferred.resolve();
		};

		/* initialise database object */
		var init = function() {

			deferred = new $.Deferred();
			//open or create a webSQL database (on webkit)
			EC.db.transaction(_initDB, errorCB, _initSuccessCB);

			return deferred.promise();

		};

		return {
			init : init,
			errorCB : errorCB
		};

	}());

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Hierarchy
 *
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

		var self;
		var deferred;
		//keep track of foreign keys
		var project_insertId;
		var forms_IDs = [];
		//store forms
		var forms =[];

		//we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
		var form_num_index = 0;

		/*  @method _formsTXSuccess
		 *
		 *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
		 *	it is called as a callback for each form executeSql()
		 */
		var _commitFormsSQLSuccess = function(the_tx, the_result) {
		

			//link each row ID to its form.
			if (the_result.insertId) {
				forms_IDs[form_num_index].id = the_result.insertId;
			} else {
				//Weird bug on iOS: insertId is undefined sometimes!
				//If that happem, drop parsing, delete tables and ask the user to start over
				//TODO: maybe adding forms recursively instead of looping?

				var project_id = parseInt(window.localStorage.project_id, 10);
				var project_name = window.localStorage.project_name;

				$.when(EC.Delete.deleteProject(project_id, project_name)).then(function() {

					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknown_error"));
					window.localStorage.is_project_deleted = 1;
					window.localStorage.back_nav_url = "#refresh";
					EC.Routing.changePage(EC.Const.INDEX_VIEW);

				}, function() {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknown_error"));
				});

			}

			form_num_index++;

			console.log("executeSql SUCCESS FORMS");

		};

		//resets forms array
		var _commitFormsSuccessCB = function(the_tx, the_result) {

			console.log(the_tx);
			console.log(the_result);

			//reset forms arrays
			forms.length = 0;

			//trigger function to save all the inputs for this form
			//self.commitInputs(EC.Parse.inputs, forms_IDs);
			
			deferred.resolve(forms_IDs);

		};

		//Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
		var _commitFormsTX = function(tx) {

			var i;
			var iLenght = forms.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'INSERT INTO ec_forms (project_id, num, name, key, has_media, has_branches, is_genkey_hidden, total_inputs) ';
				query += 'VALUES ("';
				query += project_insertId + '", "';
				query += forms[i].num + '", "';
				query += forms[i].name + '", "';
				query += forms[i].key + '", "';
				query += forms[i].has_media + '", "';
				query += forms[i].has_branches + '", "';
				query += forms[i].is_form_genkey_hidden + '", "';
				query += forms[i].total_inputs + '");';

				//keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
				forms_IDs.push({
					num : forms[i].num,
					id : 0
				});
				tx.executeSql(query, [], _commitFormsSQLSuccess, self.errorCB);
				
				
			}
		};

		/**
		 * @method insertForms
		 */
		module.commitForms = function(the_forms_object, the_project_insertId) {

			self = this;
			deferred = new $.Deferred();
			forms = the_forms_object;
			project_insertId = the_project_insertId;
			forms_IDs.length = 0;
			form_num_index = 0;

			EC.db.transaction(_commitFormsTX, self.errorCB, _commitFormsSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Hierarchy
 *	 	
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

		var self;
		var deferred;
		var max_form_ID;

		//keep track of foreign keys
		var project_insertId;
		var forms_IDs = [];

		//store forms
		var forms;

		//we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
		var form_num_index = 0;

		/*  @method _formsTXSuccess
		 *
		 *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
		 *	it is called as a callback for each form executeSql()
		 */
		var _insertFormsSQLSuccess = function(the_tx, the_result) {
			
			// _id of last entered row will be max_form_ID + 1
			forms_IDs[form_num_index].id = ++max_form_ID;

			form_num_index++;

			console.log("executeSql SUCCESS FORMS");

		};

		var _insertFormsSuccessCB = function(the_tx, the_result) {

			console.log(the_tx);
			console.log(the_result);

			//reset forms arrays
			forms.length = 0;
			
			deferred.resolve(forms_IDs);

		};

		//Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
		var _insertFormsTX = function(tx) {

			var i;
			var iLenght = forms.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'INSERT INTO ec_forms (project_id, num, name, key, has_media, has_branches, is_genkey_hidden, total_inputs) ';
				query += 'VALUES ("';
				query += project_insertId + '", "';
				query += forms[i].num + '", "';
				query += forms[i].name + '", "';
				query += forms[i].key + '", "';
				query += forms[i].has_media + '", "';
				query += forms[i].has_branches + '", "';
				query += forms[i].is_form_genkey_hidden + '", "';
				query += forms[i].total_inputs + '");';

				//keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
				forms_IDs.push({
					num : forms[i].num,
					id : 0
				});
				tx.executeSql(query, [], _insertFormsSQLSuccess, self.errorCB);

			}
		};

		var _getHighestIdTX = function(tx) {

			var query = "SELECT MAX(_id) AS _id from ec_forms";
			
			//reset auto increment for ec_forms table
			var reset_seq_query = 'UPDATE sqlite_sequence SET seq = (SELECT MAX(_id) FROM ec_forms) WHERE name="ec_forms"';

			tx.executeSql(query, [], _getHighestIdSQLSuccess, self.errorCB);
			tx.executeSql(reset_seq_query, [], _resetSequenceSQLSuccess, null);

		};

		var _getHighestIdSQLSuccess = function(the_tx, the_result) {
			max_form_ID = the_result.rows.item(0)._id;
		};

		var _getHighestIdSuccessCB = function() {
			
			//we got the max _id, perform all the INSERT transactions
			EC.db.transaction(_insertFormsTX, self.errorCB, _insertFormsSuccessCB);
		};
		
		var _resetSequenceSQLSuccess = function(the_tx, the_result){
		};

		/**
		 * @method commitForms. Due to a bug on iOS (insertId undefined after INSERT)
		 * we need to get the MAX(_id) of the table ec_forms, reset the sqlite_sequence table to that value for the ec_forms column 
		 * to basically know in advance what the insertId will be in the database 
		 * 
		 */
		module.commitForms = function(the_forms_object, the_project_insertId) {

			self = this;
			deferred = new $.Deferred();
			forms = the_forms_object;
			project_insertId = the_project_insertId;
			forms_IDs.length = 0;
			form_num_index = 0;
			max_form_ID = 0;

			//select max _id from ec_forms
			EC.db.transaction(_getHighestIdTX, self.errorCB, _getHighestIdSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

		var self;
		var deferred;
		var input_options;
		var inputs_IDs = [];

		var _errorCB = function(the_tx, the_result) {

			console.log(EC.Utils.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_result);
		};

		var _commitOneOption = function(the_input_id, the_ref, the_label, the_value, the_tx) {

			var query = "";
			var input_id = the_input_id;
			var ref = the_ref;
			var label = the_label;
			var value = the_value;
			var tx = the_tx;

			query = 'INSERT INTO ec_input_options (';
			query += 'input_id, ';
			query += 'ref, ';
			query += 'label, ';
			query += 'value)';
			query += 'VALUES ("';
			query += input_id + '", "';
			query += ref + '", "';
			query += label + '", "';
			query += value + '");';

			tx.executeSql(query, [], _commitInputOptionsSQLSuccess, _errorCB);
		};

		//Transaction to save each options to the db (form multiple option inputs like radio, checkbox, select)
		var _commitInputOptionsTX = function(tx) {

			var i;
			var j;
			var k;
			var iLength;
			var jLength;
			var kLength;
			var ref;
			var input_id;
			var label;
			var value;
			var num;
			var query = "";

			//loop the input_options array
			for ( i = 0, iLength = input_options.length; i < iLength; i++) {

				//get the input ID based on (input ref AND form num)
				ref = input_options[i].ref;
				num = input_options[i].num;

				//loop all the input IDs to find a match
				for ( j = 0, jLength = inputs_IDs.length; j < jLength; j++) {

					if (inputs_IDs[j].ref === ref && inputs_IDs[j].form_num === num) {

						input_id = inputs_IDs[j].id;
						break;

					}
				}//loop input_IDs

				//commit each option (IF ANY: we allow radio, checkbox and dropdown not to have any option)
				if (input_options[i].options === undefined) {
					kLength = 0;

				} else {

					//if we have only 1 option the "input_options[i].options: will be an object, not an array, so set one option manually
					if (Object.prototype.toString.call(input_options[i].options) === '[object Array]') {
						kLength = input_options[i].options.length;
					} else {
						//set length to 0 to skip the following loop
						kLength = 0;

						//set option properties as first element of input_options[i].options array
						label = input_options[i].options.label;
						value = input_options[i].options.value;

						_commitOneOption(input_id, ref, label, value, tx);
					}

				}

				//commit all options (one at a time)
				for ( k = 0; k < kLength; k++) {

					label = input_options[i].options[k].label;
					value = input_options[i].options[k].value;

					_commitOneOption(input_id, ref, label, value, tx);

				}//loop input_options.options

			}//loop input_options

		};

		var _commitInputOptionsSQLSuccess = function(the_tx, the_result) {

			//console.log(the_result);
			console.log("executeSql SUCCESS INPUT OPTIONS");

		};

		var _commitInputOptionsSuccessCB = function() {

			//reset options length
			input_options.length = 0;

			//Hierarchy structure saved to database correctly
			deferred.resolve();

		};

		module.commitInputOptions = function(the_input_options, the_inputs_ids) {

			self = this;
			deferred = new $.Deferred();
			input_options = the_input_options;
			inputs_IDs = the_inputs_ids;

			EC.db.transaction(_commitInputOptionsTX, _errorCB, _commitInputOptionsSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {
        "use strict";

        var self;
        var deferred;

        //track inputs IDs
        var inputs_IDs = [];

        //we need to keep track of the input option @ref to be linked with
        // whatever ID it gets after being entered to the the db
        var input_option_index;

        //store inputs object
        var inputs;

        var forms_with_media = [];
        var forms_IDs = [];

        //Transaction to save all the inputs for each form to database
        var _commitInputsTX = function(tx) {

            var i;
            var j;
            var k;
            var iLength;
            var jLength;
            var kLength;
            var current_form_num;
            var current_form_id;
            var input_list;
            var input_type;
            var input_ref;
            var query;

            //loop input array, one element per form . Each element contains an
            // input list and the @num attribute
            for ( i = 0, iLength = inputs.length; i < iLength; i++) {

                //get the database ID for the current form
                current_form_num = inputs[i].num;
                for ( j = 0, jLength = forms_IDs.length; j < jLength; j++) {

                    if (forms_IDs[j].num === current_form_num) {

                        //exit loop as soon as we get a match
                        current_form_id = forms_IDs[j].id;
                        break;
                    }
                }

                //loop each input for the current element(form) and commit it
                kLength = inputs[i].input_list.length;
                for ( k = 0; k < kLength; k++) {

                    input_type = inputs[i].input_list[k].type;
                    input_ref = inputs[i].input_list[k].ref;

                    query = 'INSERT INTO ec_inputs (';
                    query += 'form_id, ';
                    query += 'label, ';
                    query += 'default_value, ';
                    query += 'type, ';
                    query += 'ref, ';
                    query += 'position, ';
                    query += 'is_primary_key, ';
                    query += 'is_genkey, ';
                    query += 'regex, ';
                    query += 'max_range, ';
                    query += 'min_range, ';
                    query += 'is_required, ';
                    query += 'is_title, ';
                    query += 'has_jump, ';
                    query += 'jumps, ';
                    query += 'has_advanced_jump, ';
                    query += 'datetime_format, ';
                    query += 'branch_form_name, ';
                    query += 'has_double_check) ';
                    query += 'VALUES (';
                    //parameterized query (webSQL only allows '?' http://www.w3.org/TR/webdatabase/)
                    //
                    query += '?,';
                    //current_form_id
                    //
                    query += '?,';
                    //label
                    //
                    query += '?,';
                    //default_value
                    //
                    query += '?,';
                    //type
                    //
                    query += '?,';
                    //ref
                    //
                    query += '?,';
                    //position
                    //
                    query += '?,';
                    //is_primary_key
                    //
                    query += '?,';
                    //is_gen_key
                    //
                    query += '?,';
                    //regex
                    //
                    query += '?,';
                    //max_range
                    //
                    query += '?,';
                    //min_range
                    //
                    query += '?,';
                    //is_required
                    //
                    query += '?,';
                    //is_title
                    //
                    query += '?,';
                    //has_jump
                    //
                    query += '?,';
                    //jumps
                    //
                    query += '?,';
                    //has_advanced_jump
                    //
                    query += '?,';
                    //datetime_format
                    //
                    query += '?,';
                    //branch_form_name
                    //
                    query += '?);';
                    //has_double_check

                    //keep track of current input @ref
                    inputs_IDs.push({
                        ref : input_ref,
                        form_id : current_form_id,
                        form_num : current_form_num,
                        id : ""//fill this after INSERT
                    });

                    tx.executeSql(query, [//
                    current_form_id, //
                    inputs[i].input_list[k].label, //
                    inputs[i].input_list[k].default_value, //
                    input_type, //
                    input_ref, //
                    inputs[i].input_list[k].position, //
                    inputs[i].input_list[k].is_primary_key, //
                    inputs[i].input_list[k].is_genkey, //
                    inputs[i].input_list[k].regex, //
                    inputs[i].input_list[k].max_range, //
                    inputs[i].input_list[k].min_range, //
                    inputs[i].input_list[k].is_required, //
                    inputs[i].input_list[k].is_title, //
                    inputs[i].input_list[k].has_jump, //
                    inputs[i].input_list[k].jumps, //
                    inputs[i].input_list[k].has_advanced_jump, //
                    inputs[i].input_list[k].datetime_format, //
                    inputs[i].input_list[k].branch_form_name, //
                    inputs[i].input_list[k].has_double_check//

                    ], _commitInputsSQLSuccess, _errorCB);

                }//for each input
            }// for each form

        };

        /* Callback called each time an input executeSql is successful
         *
         * here the input ID (geerated from the query when entering the input) is
         * linked to its input @ref
         */
        var _commitInputsSQLSuccess = function(the_tx, the_result) {

            //link each row ID to its input
            inputs_IDs[input_option_index].id = the_result.insertId;
            input_option_index++;

            console.log("executeSql SUCCESS HIERARCHY INPUTS");

        };

        var _commitInputsSuccessCB = function() {

            deferred.resolve(inputs_IDs);

            forms_with_media.length = 0;
            inputs.length = 0;

        };

        var _errorCB = function(the_tx, the_result) {

            console.log(EC.Utils.TRANSACTION_ERROR);
            console.log(the_tx);
            console.log(the_result);
        };

        module.commitInputs = function(the_inputs_object, the_forms_ids) {

            self = this;
            deferred = new $.Deferred();
            inputs = the_inputs_object;
            forms_IDs = the_forms_ids;

            inputs_IDs = [];
            forms_with_media = [];
            input_option_index = 0;

            EC.db.transaction(_commitInputsTX, _errorCB, _commitInputsSuccessCB);

            return deferred.promise();

        };

        return module;

    }(EC.Hierarchy));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Hierarchy
 *
 */
var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

        var self;
        var project;
        var deferred;

        //Transaction to save the project object
        var _commitProjectTX = function(tx) {

            var query = "";
            query += 'INSERT INTO ec_projects ( ';
            query += 'name, ';
            query += 'allowDownloadEdits, ';
            query += 'version, ';
            query += 'total_hierarchy_forms, ';
            query += 'total_branch_forms, ';
            query += 'downloadFromServer, ';
            query += 'uploadToServer) ';
            query += 'VALUES ("';
            query += project.name + '", "';
            query += project.allowDownloadEdits + '", "';
            query += project.version + '", "';
            query += project.total_hierarchy_forms + '", "';
            query += project.total_branch_forms + '", "';
            query += project.downloadFromServer + '", "';
            query += project.uploadToServer + '");';

            tx.executeSql(query, [], _commitProjectSQLSuccess, self.errorCB);

        };

        //Callback executed if the project is saved correctly to the db
        var _commitProjectSQLSuccess = function(the_tx, the_result) {

            //keep track of the last project ID we entered to the database
            project.insertId = the_result.insertId;
        };

        var _commitProjectSuccessCB = function() {

            var branch_forms;
            //commit all the hierarchy forms (main)

            //@bug on iOS: insertID can be undefined, so get the id of the last INSERT project manually
            if (project.insertId) {

                deferred.resolve(project);

            } else {
                
                alert("ios");
                //oh my..IOS...let's get the ID of the last entered project before doing anything else
                $.when(EC.Select.getProjectRowId(project.name)).then(function(the_project_id) {

                    project.insertId = the_project_id;

                    deferred.resolve(project);

                });
            }
        };

        module.commitProject = function(the_project_object) {

            self = this;
            project = the_project_object;
            deferred = new $.Deferred();

            EC.db.transaction(_commitProjectTX, self.errorCB, _commitProjectSuccessCB);

            return deferred.promise();

        };

        return module;

    }(EC.Hierarchy));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 *  It will create a project hierarchy structure (project, forms, inputs, input_values) to the database
 *
 each method will accept a single object (that can be a single or an array of objects) to be saved
 *
 */

var EC = EC || {};
EC.Hierarchy = (function (module) {
    'use strict';

    //callback for a transaction error
    module.errorCB = function (the_tx, the_result) {
        console.log(EC.Utils.TRANSACTION_ERROR);
        console.log(the_tx);
        console.log(the_result);
    };

    return module;
}(EC.Hierarchy));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *   @module Structure
 *
 */
var EC = EC || {};
EC.Structure = EC.Structure || {};
EC.Structure = ( function(module) {"use strict";

        var deferred;
        var project;

        module.commitAll = function() {

            deferred = new $.Deferred();

            $.when(EC.Hierarchy.commitProject(EC.Parse.project)).then(function(the_project) {

                project = the_project;

                //if we have branches, save both hierarchy and branch structure to db

                //commit all branch forms (if any)
                var branch_forms = EC.Parse.getBranchForms();
                var hierarchy_forms = EC.Parse.getHierarchyForms();
                if (branch_forms.length > 0) {

                    //commit both hierarchy and branch forms
                    $.when(EC.Hierarchy.commitForms(hierarchy_forms, project.insertId), EC.Branch.commitBranchForms(branch_forms, project.insertId)).then(function(hierarchy_forms_IDs, branch_forms_IDs) {

                        var hierarchy_inputs = EC.Parse.inputs;
                        var branch_inputs = EC.Parse.branch_inputs;

                        $.when(EC.Hierarchy.commitInputs(hierarchy_inputs, hierarchy_forms_IDs), EC.Branch.commitBranchInputs(branch_inputs, branch_forms_IDs)).then(function(hierarchy_inputs_IDs, branch_inputs_IDs) {

                            var branch_options = EC.Parse.branch_options;
                            var hierarchy_options = EC.Parse.options;

                            //commit hierarchy input options if any
                            if (hierarchy_options.length > 0) {
                                $.when(EC.Hierarchy.commitInputOptions(hierarchy_options, hierarchy_inputs_IDs)).then(function() {

                                    //hierarchy option saved, save branch input options if any
                                    if (branch_options.length > 0) {
                                        $.when(EC.Branch.commitBranchInputOptions(branch_options, branch_inputs_IDs)).then(function() {

                                            //options saved , redirect to projects list
                                            console.log("models ready");
                                            deferred.resolve();
                                        });

                                    } else {

                                        //no branch options, redirect
                                        console.log("models ready");
                                        deferred.resolve();
                                    }

                                });
                            } else {
                                //commit branch input options if any
                                if (branch_options.length > 0) {
                                    $.when(EC.Branch.commitBranchInputOptions(branch_options, branch_inputs_IDs)).then(function() {

                                        //options saved
                                        console.log("models ready");
                                        deferred.resolve();
                                    });
                                } else {
                                    //no branch options, done
                                    console.log("models ready");
                                    deferred.resolve();
                                }
                            }
                        });

                    });

                } else {

                    //commit only hierarchy forms
                    $.when(EC.Hierarchy.commitForms(hierarchy_forms, project.insertId)).then(function(forms_IDs) {
                        //commit hierarchy inputs
                        var inputs = EC.Parse.inputs;

                        $.when(EC.Hierarchy.commitInputs(inputs, forms_IDs)).then(function(inputs_IDs) {

                            var options = EC.Parse.options;

                            //commit input options if any
                            if (options.length > 0) {
                                $.when(EC.Hierarchy.commitInputOptions(options, inputs_IDs)).then(function() {

                                    //options saved , done
                                    console.log("models ready");
                                    deferred.resolve();

                                });
                            } else {
                                //no options, done
                                console.log("models ready");
                                deferred.resolve();
                            }

                        });

                    });

                }

            });

            return deferred.promise();

        };

        return module;

    }(EC.Structure));

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var forms;
    var project_id;
    var entries;
    var branch_data_rows;
    var branch_form_names;
    var form_counter;
    var branch_form_counter;
    var has_branches;
    var deferred;

    //get all ec_data rows for this project	 (per each form)
    var _getAllProjectEntriesTX = function (tx) {

        var i;
        var iLength = forms.length;
        var select_query = 'SELECT * FROM ec_data WHERE form_id=?';
        var branch_select_query;
        form_counter = 0;
        branch_form_counter = 0;

        for (i = 0; i < iLength; i++) {
            tx.executeSql(select_query, [forms[i]._id], _getAllProjectEntriesSQLSuccessCB, EC.Select.errorCB);
        }

        //get any branches
        if (has_branches) {
            branch_data_rows = [];
            branch_form_names = [];
            branch_select_query = 'SELECT * FROM ec_branch_data JOIN ec_branch_forms ON ec_branch_data.form_id=ec_branch_forms._id WHERE ec_branch_forms.project_id=?';
            tx.executeSql(branch_select_query, [project_id], _getAllProjectBranchEntriesSQLSuccessCB, EC.Select.errorCB);
        }

    };



    var _getAllProjectEntriesSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;
        var current_data_rows;

        //per each form, save form details and an array with all the entries for that form
        entries[form_counter] = {
            form_id: forms[form_counter]._id,
            form_name: forms[form_counter].name,
            total_entries: forms[form_counter].entries,
            total_inputs: forms[form_counter].total_inputs,
            data_rows: []
        };

        for (i = 0; i < iLength; i++) {

            current_data_rows = entries[form_counter].data_rows;
            current_data_rows.push(the_result.rows.item(i));

            //if the entry row just added is a media field, set value to empty string (as media files are not backed up)
            if (current_data_rows[current_data_rows.length - 1].type === EC.Const.PHOTO || current_data_rows[current_data_rows.length - 1].type === EC.Const.AUDIO || current_data_rows[current_data_rows.length - 1].type === EC.Const.VIDEO) {
                current_data_rows[current_data_rows.length - 1].value = '';
            }

        }

        form_counter++;

    };

    var _getAllProjectBranchEntriesSQLSuccessCB = function (the_tx, the_result) {

        var i;
        var iLength = the_result.rows.length;
        var current_branch_form_name;

        for (i = 0; i < iLength; i++) {

            branch_data_rows.push(the_result.rows.item(i));

            //cache branch form names: when restoring we will neeed the branch form name and project id to map the rows against the actual branch form id
            //which will be different from the one we save
            current_branch_form_name = the_result.rows.item(i).name;
            //store only unique values
            if (!EC.Utils.inArray(branch_form_names, current_branch_form_name)) {
                branch_form_names.push(current_branch_form_name);
            }
        }

    };

    var _getAllProjectEntriesSuccessCB = function () {

        //if we have any branch data, append them to the end of entries array
        if (branch_data_rows.length > 0) {
            entries.push({
                has_branches: true,
                branch_data_rows: branch_data_rows,
                branch_form_names: branch_form_names
            });
        }

        //return entries to backup controller
        deferred.resolve(entries.slice(0));

        entries.length = 0;
        branch_data_rows.length = 0;
        forms.length = 0;
    };

    /**
     *
     * @param {Object} the_forms Fetch all project entries rows
     */
    module.getAllProjectEntries = function (the_forms, the_project_id) {

        forms = the_forms;
        project_id = the_project_id;
        has_branches = EC.Utils.projectHasBranches();
        entries = [];
        branch_data_rows = [];
        deferred = new $.Deferred();

        EC.db.transaction(_getAllProjectEntriesTX, EC.Select.errorCB, _getAllProjectEntriesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Select));

/*jslint vars: true, nomen: true, plusplus: true*/
/**
 * @module EC
 * @submodule GetData
 */

var EC = EC || {};

EC.Select = ( function(module) {

		var project_id;
		var allow_download_edits;
		var deferred;

		var _getADEFlagTX = function(tx) {

			var query = 'SELECT allowDownloadEdits FROM ec_projects WHERE _id=?';

			tx.executeSql(query, [project_id], _getADEFlagSQLSuccess, EC.Select.errorCB);
		};

		var _getADEFlagSQLSuccess = function(the_tx, the_result) {
			allow_download_edits = the_result.rows.item(0).allowDownloadEdits;
		};

		var _getADEFlagTXSuccessCB = function() {

			if (allow_download_edits === "false") {
				deferred.reject();
			} else {
				deferred.resolve();
			}
		};

		/**
		 * @method getAllowDownloadEdits Fetch the AllowDownloadEdits flag for the selected project and set it in localStorage
		 * @param {int} the_project_id  The project id
		 */
		module.getAllowDownloadEdits = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getADEFlagTX, EC.Select.errorCB, _getADEFlagTXSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * @method getBranchChildrenFiles 
 * 
 * get all the media files for all the branch
 * entries attached to a child entry and return the array with the file details
 * 
 * {value: <the_filename>, tyope: <the_media_type>}
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entries;
		var files;

		var _getBranchChildrenFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchChildrenFilesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
			for ( i = 0; i < iLength; i++) {
				//get all file names and types
				tx.executeSql(query, [entries[i].entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchChildrenFilesSQLSuccessCB, self.errorCB);
			}
		};

		var _getBranchChildrenFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		module.getBranchChildrenFiles = function() {

			self = this;
			deferred = new $.Deferred();
			entries = EC.Delete.deletion_entries;
			files = [];

			EC.db.transaction(_getBranchChildrenFilesTX, self.errorCB, _getBranchChildrenFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var self;
		var entries = [];
		var form_id;
		var project_id;
		var branch_form_name;
		var hierarchy_key_value;
		var titles = [];
		var full_titles = [];
		var branch_primary_keys = [];
		var child_counter = 0;
		var entry_key;
		var offset;
		var deferred;

		var _getBranchEntriesSuccessCB = function() {

			/*
			 * store primary key values for current branch form
			 * it is not possible to have duplicates for the primary key input field within the same form level
			 * (using circular data structure)
			 */
			var i;
			var iLength = entries.length;
			for ( i = 0; i < iLength; i++) {

				branch_primary_keys.push(entries[i].entry_key);
			}

			EC.BranchInputs.setCachedBranchEntryKeys(branch_form_name, branch_primary_keys);

			branch_primary_keys.length = 0;

			/*
			 * Using each entry, select all the fields for that entry with 'is_title' = true
			 * This will build the full title to be displayed per each itme in the listview
			 * if no inputs are set as title, default to the value of the primary key
			 */

			EC.db.transaction(_getEntriesTitlesTX, EC.Select.errorCB, _getEntriesTitlesSuccessCB);

			/*
			 * Using each entry, count how many child entry there are per each entry
			 * The counts will be displayed on the list of entries
			 */

			console.log(EC.Const.TRANSACTION_SUCCESS);

		};

		var _getEntriesTitlesTX = function(tx) {

			var i;
			var iLenght = entries.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'SELECT _id, value, entry_key FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND is_title=? AND entry_key=? AND hierarchy_entry_key_value=?';
				tx.executeSql(query, [branch_form_name, project_id, 1, entries[i].entry_key, entries[i].hierarchy_entry_key_value], _getEntriesTitlesSQLSuccess, EC.Select.errorCB);

			}//for

		};

		var _getEntriesTitlesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {

				titles.push(the_result.rows.item(i));
			}

		};

		var _getEntriesTitlesSuccessCB = function() {

			//Build the titles concatenating all the title fields found per each entry
			var i;
			var j;
			var iLength = entries.length;
			var jLength = titles.length;
			var full_title;

			for ( i = 0; i < iLength; i++) {

				full_title = "";

				for ( j = 0; j < jLength; j++) {

					if (entries[i].entry_key === titles[j].entry_key) {

						full_title += (full_title === "") ? titles[j].value : ", " + titles[j].value;

					}

				}//for titles

				full_titles.push({
					full_title : full_title,
					entry_key : entries[i].entry_key
				});

			}//for entries

			console.log("branch entries full_titles");
			console.log(full_titles);

			//resolve deferred returning full titles
			deferred.resolve(full_titles.slice(0));

			//clear all arrays
			full_titles.length = 0;
			titles.length = 0;
			entries.length = 0;

		};

		/*
		 * Get all entries for a form and group them by entry_key:
		 * a form have multiple entries, one per each input, and they all have the same entry_key value)
		 */
		var _getBranchEntriesTX = function(tx) {

			var query = "";

			query = 'SELECT _id, entry_key, hierarchy_entry_key_value FROM ec_branch_data ';
			query += 'WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) ';
			query += 'AND hierarchy_entry_key_value=? ';
			query += 'GROUP BY entry_key ';
			query += 'ORDER BY entry_key ';
			query += 'LIMIT ' + window.localStorage.QUERY_LIMIT + " OFFSET " + offset;

			tx.executeSql(query, [branch_form_name, project_id, hierarchy_key_value], _getBranchEntriesSQLSuccess, EC.Select.errorCB);
			self.query_error_message = "EC.Select.getBranchEntries _getBranchEntriesTX";

		};

		var _getBranchEntriesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with entries
			for ( i = 0; i < iLenght; i++) {

				entries.push(the_result.rows.item(i));

			}

			console.log(entries, true);

		};

		var _getBranchEntriesTitlesTX = function(tx) {

			var i;
			var iLenght = entries.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'SELECT _id, value, entry_key FROM ec_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND is_title=? AND entry_key=? AND hierarchy_entry_key_value=?';
				tx.executeSql(query, [branch_form_name, project_id, 1, entries[i].entry_key, entries[i].hierarchy_entry_key_value], _getBranchEntriesTitlesSQLSuccess, EC.Select.errorCB);

			}//for

		};

		var _getBranchEntriesTitlesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with titles
			for ( i = 0; i < iLenght; i++) {

				titles.push(the_result.rows.item(i));
			}

		};

		module.getBranchEntries = function(the_project_id, the_branch_form_name, the_hierarchy_entry_key_value, the_offset) {

			self = this;
			branch_form_name = the_branch_form_name;
			hierarchy_key_value = the_hierarchy_entry_key_value;
			project_id = the_project_id;
			offset = the_offset;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchEntriesTX, EC.Select.errorCB, _getBranchEntriesSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var project_id;
		var entry_key;
		var entry_keys = [];
		var deferred;

		var _getEntryKeys = function(tx) {

			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?)';

			tx.executeSql(query, [branch_form_name, project_id], _getEntryKeysSQLSuccess, EC.Select.errorCB);

		};

		var _getEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}

		};

		var _getEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entr+key value for the specified form
		module.getBranchEntryKeys = function(the_branch_form_name, the_project_id) {

			deferred = new $.Deferred();
			branch_form_name = the_branch_form_name;
			project_id = the_project_id;
			entry_keys.length = 0;

			EC.db.transaction(_getEntryKeys, EC.Select.errorCB, _getEntryKeysSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var hierarchy_entry_key_value;
		var entry_key;
		var project_id;
		var values = [];
		var deferred;

		var _getBranchEntryValuesTX = function(tx) {

			//get all entry values
			var query = 'SELECT * FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND entry_key=? AND hierarchy_entry_key_value =? ORDER BY position';

			tx.executeSql(query, [branch_form_name, project_id, entry_key, hierarchy_entry_key_value], _getBranchEntryValuesSQLSuccess, EC.Select.errorCB);

		};
		//_getEntryValues

		var _getBranchEntryValuesSQLSuccess = function(the_tx, the_result) {

			var i;
			var index;
			var iLenght = the_result.rows.length;
			var input_id = "";
			var current_input_id;
			var prev_value = [];
			var prev_obj;
			var new_obj;
			var new_object = {};
			var string;

			//build object with entry values
			for ( i = 0; i < iLenght; i++) {

				current_input_id = the_result.rows.item(i).input_id;

				values.push(the_result.rows.item(i));

			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT BRANCH ENTRY VALUES SUCCESS");

		};

		var _getBranchEntryValuesSuccessCB = function(the_tx) {

			//Render entry values list
			deferred.resolve(values.slice(0));
			values.length = 0;

		};

		module.getBranchEntryValues = function(the_project_id, the_branch_form_name, the_entry_key, the_hierarchy_entry_key_value) {

			branch_form_name = the_branch_form_name;
			entry_key = the_entry_key;
			project_id = the_project_id;
			hierarchy_entry_key_value = the_hierarchy_entry_key_value;
			deferred = new $.Deferred();

			//clear values array before requesting new values
			values.length = 0;

			EC.db.transaction(_getBranchEntryValuesTX, EC.Select.errorCB, _getBranchEntryValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var hierarchy_entry_key;
		var deferred;
		var files;

		var _errorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_error);
		};

		var _selectBranchFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchFilesTX = function(tx) {

			var select_branch_files_query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
			//get all file names and types
			tx.executeSql(select_branch_files_query, [hierarchy_entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectBranchFilesSQLSuccessCB, _errorCB);
		};

		var _getBranchFilesSuccessCB = function() {

			console.log("Branch files: ****************************************");
			console.log("Branch files:" + JSON.stringify(files));

			deferred.resolve(files);
		};

		//get all the media files for all the branch entries attached to a hierarchy entry
		module.getBranchFiles = function(the_hierarchy_entry_key) {

			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;
			files = [];

			EC.db.transaction(_getBranchFilesTX, _errorCB, _getBranchFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var value;
		var input;
		var project_id;
		var entry_key;
		var entry_keys = [];
		var branch_form;
		var deferred;

		var _getBranchFormDetailsTX = function(tx) {

			var query = "SELECT _id, project_id, name,num, key, total_inputs, has_media, is_genkey_hidden, entries FROM ec_branch_forms WHERE name=? AND project_id=?";

			tx.executeSql(query, [branch_form_name, project_id], _getBranchFormDetailsSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchFormDetailsSQLSuccess = function(the_tx, the_result) {

			branch_form = the_result.rows.item(0);

		};

		var _getBranchFormDetailsSuccessCB = function() {

			//return branch form details
			deferred.resolve(branch_form);

		};

		module.getBranchFormDetails = function(the_input, the_value, the_project_id) {

			input = the_input;
			value = the_value;
			branch_form_name = input.branch_form_name;
			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormDetailsTX, EC.Select.errorCB, _getBranchFormDetailsSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var branch_form_names;
		var mapped_branch_forms;
		var deferred;

		var _getBranchFormLocalIDsTX = function(tx) {

			var i;
			var iLength = branch_form_names.length;
			var query = "SELECT _id, name FROM ec_branch_forms WHERE name=? AND project_id=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [branch_form_names[i], project_id], _getBranchFormLocalIDsSQLSuccess, EC.Select.errorCB);
			}

		};

		var _getBranchFormLocalIDsSQLSuccess = function(the_tx, the_result) {
			
			//map form names against _id
			//TODO: is this right? why are we getting the first row only??
			mapped_branch_forms.push({
				_id : the_result.rows.item(0)._id,
				name : the_result.rows.item(0).name
			});

		};

		var _getBranchFormLocalIDsSuccessCB = function() {

			//return mappped branch forms
			deferred.resolve(mapped_branch_forms);

		};

		module.getBranchFormLocalIDs = function(the_project_id, the_branch_form_names) {

			project_id = the_project_id;
			branch_form_names = the_branch_form_names;
			deferred = new $.Deferred();
			mapped_branch_forms = [];

			EC.db.transaction(_getBranchFormLocalIDsTX, EC.Select.errorCB, _getBranchFormLocalIDsSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var branch_forms;
		var project_id;
		var deferred;

		var _getBranchFormsSuccessCB = function() {
			deferred.resolve(branch_forms);
		};

		var _getBranchFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				branch_forms.push(the_result.rows.item(i));
			}
		};

		var _getBranchFormsTX = function(tx) {
			var query = 'SELECT _id, name, key, num, has_media, is_genkey_hidden, total_inputs, entries FROM ec_branch_forms WHERE project_id=?';
			tx.executeSql(query, [project_id], _getBranchFormsSQLSuccess, EC.Select.errorCB);
		};

		module.getBranchForms = function(the_project_id) {

			project_id = the_project_id;
			branch_forms =[];
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormsTX, EC.Select.errorCB, _getBranchFormsSuccessCB);

			return deferred.promise();

		};
		

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_inputs = [];
		var branch_input_options_ids = [];
		var branch_input_options = [];
		var has_jumps;
		var branch_form_name;
		var project_id;
		var form_id;
		var deferred;

		//callback triggered when all the branch_inputs for a form are fetched correctly. 'branch_inputs' contains all the branch_inputs
		var _getBranchInputsSuccessCB = function(tx) {

			console.log("TRANSACTION SELECT INPUTS SUCCESS");
			has_jumps = false;
			branch_input_options_ids.length = 0;

			//We have all the inputs, need to check if any radio, select(dropdown), checkbox input has input options
			var i;
			var iLenght = branch_inputs.length;

			//loop inputs looking for type radio, checkbox or dropdown and also to check if the form has some jumps
			for ( i = 0; i < iLenght; i++) {

				if (branch_inputs[i].type === "radio" || branch_inputs[i].type === "select" || branch_inputs[i].type === "checkbox") {
					//list which inputs have input options (the ids)
					branch_input_options_ids.push({
						"id" : branch_inputs[i]._id
					});
				}

				if (branch_inputs[i].has_jump === 1 && !has_jumps) {
					has_jumps = true;
				}
			}

			//map any option (if any) to the inputs
			if (branch_input_options_ids.length > 0) {
				//get input options
				EC.db.transaction(_getBranchInputOptionsTX, EC.Select.errorCB, _getBranchInputOptionsSuccessCB);
			}

			//no options to map then just render form
			else {
				deferred.resolve(branch_inputs, has_jumps);
			}

		};

		var _getBranchInputsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				branch_inputs.push(the_result.rows.item(i));
			}

			console.log(branch_inputs, true);

		};

		var _getBranchInputOptionsSuccessCB = function(the_tx) {

			//map input options to input
			var i;
			var j;
			var iLength = branch_inputs.length;
			var jLength = branch_input_options.length;

			//console.log(JSON.stringify(input_options));

			//build object with inputs data
			for ( i = 0; i < iLength; i++) {

				branch_inputs[i].options = [];

				for ( j = 0; j < jLength; j++) {

					if (branch_inputs[i]._id === branch_input_options[j].input_id) {

						branch_inputs[i].options.push({
							jump_to : branch_input_options[j].jump_to,
							jump_when : branch_input_options[j].jump_when,
							label : branch_input_options[j].label,
							ref : branch_input_options[j].ref,
							value : branch_input_options[j].value

						});

					}//if

				}//for

			}//for

			deferred.resolve(branch_inputs, has_jumps);

		};
		//_getInputOptionsSuccessCB

		var _getBranchInputOptionsTX = function(tx) {

			var i;
			var iLenght = branch_input_options_ids.length;
			var query;

			//get all input options per each input
			for ( i = 0; i < iLenght; i++) {
				query = 'SELECT * FROM ec_branch_input_options WHERE input_id=?';
				tx.executeSql(query, [branch_input_options_ids[i].id], _getBranchInputOptionsSQLSuccess, EC.Select.errorCB);
			}

		};

		var _getBranchInputOptionsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				branch_input_options.push(the_result.rows.item(i));
			}

		};

		var _getBranchInputsTX = function(tx) {

			//get all branch inputs (using a nested query to get form id in the database)
			var query = 'SELECT * FROM ec_branch_inputs WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) ORDER BY position';

			tx.executeSql(query, [branch_form_name, project_id], _getBranchInputsSQLSuccess, EC.Select.errorCB);

		};

		module.getBranchInputs = function(the_branch_form_name, the_project_id) {

			deferred = new $.Deferred();
			project_id = the_project_id;
			branch_form_name = the_branch_form_name;

			//reset branch arrays
			branch_inputs.length = 0;
			branch_input_options_ids.length = 0;
			branch_input_options.length = 0;

			//if the project is using a circular network, get all other keys for the specified form. It can be done async (or use a deferred object: todo)
			$.when(EC.Select.getBranchEntryKeys(branch_form_name, project_id)).then(function(branch_entry_keys) {

				var cached_keys;
				var form_level_keys;

				//merge keys with those already in localStorage (if we are using circular network and form level key uniqueness) avoiding duplicates
				try {
					cached_keys = JSON.parse(window.localStorage.branch_primary_keys);
				} catch(error) {
					cached_keys = [];
				}
				form_level_keys = cached_keys.concat(branch_entry_keys).unique();
				window.localStorage.branch_primary_keys = JSON.stringify(form_level_keys);

				EC.db.transaction(_getBranchInputsTX, EC.Select.errorCB, _getBranchInputsSuccessCB);

			});

			return deferred.promise();
		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var mapped_branch_inputs;
		var deferred;

		var _getBranchInputsLocalIDsTX = function(tx) {

			var query = "SELECT ec_branch_inputs._id, ec_branch_inputs.ref FROM ec_branch_inputs JOIN ec_branch_forms ON ec_branch_forms._id=ec_branch_inputs.form_id WHERE ec_branch_forms.project_id=?";

			tx.executeSql(query, [project_id], _getBranchInputsLocalIDsSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchInputsLocalIDsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {

				//map form names against _id
				mapped_branch_inputs.push({
					_id : the_result.rows.item(i)._id,
					ref : the_result.rows.item(i).ref
				});
			}

		};

		var _getBranchInputsLocalIDsSuccessCB = function() {

			//return mappped branch forms
			deferred.resolve(mapped_branch_inputs);

		};

		module.getBranchInputsLocalIDs = function(the_project_id) {

			project_id = the_project_id;

			deferred = new $.Deferred();
			mapped_branch_inputs = [];

			EC.db.transaction(_getBranchInputsLocalIDsTX, EC.Select.errorCB, _getBranchInputsLocalIDsSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @module getBranchSyncedFiles
 * Get all the synced branch files linked to all the synced entries for a form
 *
 * @param {Array} the_hierarchy_entry_keys contains all the entry keys for synced
 * entries of a form
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var hierarchy_entry_keys;
		var deferred;
		var files;

		var _getBranchSyncedFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		var _getBranchSyncedFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchSyncedFilesTX = function(tx) {

			var i;
			var iLength = hierarchy_entry_keys.length;
			var query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?) AND value <>?';

			for ( i = 0; i < iLength; i++) {
				//get file names and types
				tx.executeSql(query, [hierarchy_entry_keys[i], 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchSyncedFilesSQLSuccessCB, self.errorCB);
			}

		};

		module.getBranchSyncedFiles = function(the_hierarchy_entry_keys) {

			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_keys = the_hierarchy_entry_keys;
			files = [];

			EC.db.transaction(_getBranchSyncedFilesTX, self.errorCB, _getBranchSyncedFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var parents = [];
		var parent_counter = 0;
		var children_counter = 0;
		var children_offset;
		var nested_children_counter = 0;
		var offset = 0;
		var prev_parent_children;
		var parent_offset;
		var form_total_inputs;
		var parent_form_total_entries;
		var form_total_entries;
		var is_loading_more;
		var query_limit;
		var self;
		var new_request;

		var _getChildEntriesParentsTX = function(tx) {

			//get all the parents one at a time
			var query = "";
			query += 'SELECT DISTINCT parent FROM ec_data WHERE form_id=? ORDER BY parent ';
			query += 'LIMIT ' + 1 + ' ';
			query += 'OFFSET ' + (parent_offset);

			tx.executeSql(query, [form_id], _getChildEntriesParentsSQLSuccess, EC.Select.errorCB);
		};

		var _getChildEntriesParentsSuccessCB = function(the_tx) {

		};

		var _getChildEntriesParentsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;
			var parent;

			//if we have a parent to get children for
			if (iLength > 0) {
				parent = the_result.rows.item(0).parent;
				parents.push(the_result.rows.item(0));

				//get children per each parent
				EC.db.transaction(_getAllChildrenTX, EC.Select.errorCB, _getAllChildrenSuccessCB);
			} else {

				//no more parents found, display entries
				if (new_request) {

					EC.Entries.appendMoreChildEntries(parents);

				} else {

					//are we loading more children? (user tapped "show more")
					if (is_loading_more) {
						EC.Entries.appendMoreChildEntries(parents);

					} else {
						//render children on screen
						EC.Entries.renderChildEntriesList(parents);
					}

				}

			}

		};

		var _getAllChildrenTX = function(tx) {

			//select all entries aside from the one skipped (by jumps)
			var parent = parents[parent_counter].parent;
			var query = 'SELECT form_id, parent, label, value,  entry_key, is_title, type FROM ec_data WHERE parent=? AND value<>?';

			//if new_request is true, we need to request the maximum number of children according to the pagination settings
			if (new_request) {
				query += 'LIMIT ' + ((window.localStorage.QUERY_LIMIT) * form_total_inputs) + ' ';
				new_request = false;

			} else {

				//new_request is false, so is it not a user request but recursion. Since we have got children from a previous parent, we need to request less entries
				query += 'LIMIT ' + ((window.localStorage.QUERY_LIMIT - prev_parent_children) * form_total_inputs) + ' ';

			}

			//if children offset is 0, request children starting from first row
			if (children_offset === 0) {
				query += 'OFFSET 0';
			} else {

				//we have an offset, so load all the children AFTER the offset.
				//If we have any previous children already loaded, the offset needs to be exactly that, usually less then the pagination.
				//That happen when we loaded children for more parents, so we loaded less then the pagination limit for the last parent children
				if (prev_parent_children === 0) {
					query += 'OFFSET ' + children_offset * form_total_inputs;
				} else {
					query += 'OFFSET ' + prev_parent_children * form_total_inputs;
					prev_parent_children = 0;
				}

			}

			tx.executeSql(query, [parent, EC.Const.SKIPPED], _getAllChildrenSQLSuccessCB, EC.Select.errorCB);

		};

		var _getAllChildrenSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;
			var child_full_title = "";

			//check if we have any entries
			if (iLength > 0) {

				//get first row and entry key
				var row = the_result.rows.item(0);
				var entry_key = row.entry_key;

				//build title (avoiding empty fields so we do not end up with "my_title, , , , ,")
				if (row.is_title === 1 && row.value !== "") {
					child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
				}

				parents[parent_counter].children = [];
				children_counter = 0;

				//loop all the other rows past the first one
				for ( i = 1; i < iLength; i++) {

					row = the_result.rows.item(i);

					//if entry key is matching, build title only
					if (row.entry_key === entry_key) {

						//build title (avoiding empty fields so we do not end up with "my_title, , , , ,")
						if (row.is_title === 1 && row.value !== "") {
							child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
						}

						//different entry key i.e another entry
					} else {

						//if no title yet, default to value of primary key
						if (child_full_title === "") {
							child_full_title = entry_key;
						}

						//add child
						parents[parent_counter].children[children_counter] = {
							full_title : child_full_title,
							entry_key : entry_key
						};

						entry_key = row.entry_key;
						children_counter++;
						child_full_title = "";

						//reset title
						if (row.is_title === 1 && row.value !== "") {
							child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
						}
					}
				}

				//if after looping all the rows title is still empty, default to value of the primary key
				if (child_full_title === "") {
					child_full_title = entry_key;
				}

				//add child
				parents[parent_counter].children[children_counter] = {
					full_title : child_full_title,
					entry_key : entry_key
				};

				child_full_title = "";

			}
		};

		/*
		 * All children fetched correctly, get nested children count
		 */
		var _getAllChildrenSuccessCB = function() {

			var i;
			var iLength = parents.length;

			EC.db.transaction(_getNestedChildrenCountTX, EC.Select.errorCB, _getNestedChildrenCountSuccessCB);
		};

		var _getNestedChildrenCountSuccessCB = function() {

			var query_limit = window.localStorage.QUERY_LIMIT;

			nested_children_counter = 0;
			children_counter = 0;

			//are we loading more for the same parent? (user tapped "Show More" button)
			if (is_loading_more) {

				//if the total of children for the current parent is less then the items per page settings, get the next parent and its children
				if (parents[parent_counter].children.length < (query_limit - prev_parent_children)) {

					//update counters before getting new parent
					prev_parent_children = parents[parent_counter].children.length;
					parent_counter++;
					parent_offset++;
					children_offset = 0;

					//get next parent first
					EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

				} else {

					//cache the last parent children total
					prev_parent_children = parents[parent_counter].children.length;

					//append children to list
					EC.Entries.appendMoreChildEntries(parents);
				}

			} else {

				var j;
				var jLength = parents.length;
				var total_children_loaded = 0;

				//calculate total of children loaded recursively for each parent
				for ( j = 0; j < jLength; j++) {
					total_children_loaded += parents[j].children.length;
				}

				//it the total of children is less then the pagination limit, get next parent and its children
				if (total_children_loaded < query_limit) {

					//get next parent and its children
					self.getNextParentChildEntries(total_children_loaded);

				} else {

					//cache last parent total of children
					prev_parent_children = parents[parent_counter].children.length;

					//render list of children
					EC.Entries.renderChildEntriesList(parents);
				}
			}
		};

		var _getNestedChildrenCountTX = function(tx) {

			var i;
			var iLength = parents[parent_counter].children.length;
			var query;
			var parent_path;
			var form_tree = EC.Utils.getParentAndChildForms(form_id);
			var child_form_id = form_tree.child;

			for ( i = 0; i < iLength; i++) {

				//build root path (parent|entry_key)
				parent_path = parents[parent_counter].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parents[parent_counter].children[i].entry_key;

				query = 'SELECT entry_key FROM ec_data WHERE parent=? AND form_id=? GROUP BY entry_key';

				tx.executeSql(query, [parent_path, child_form_id], _getNestedChildrenCountSQLSuccessCB, EC.Select.errorCB);

			}

		};

		var _getNestedChildrenCountSQLSuccessCB = function(the_tx, the_result) {

			//store total of nested children
			parents[parent_counter].children[nested_children_counter].nested_children_count = the_result.rows.length;
			nested_children_counter++;

		};

		module.getChildEntries = function(the_child_form_id, the_parent_offset, the_children_offset) {

			form_id = the_child_form_id;
			parent_offset = the_parent_offset;
			children_offset = the_children_offset;
			form_total_entries = EC.Utils.getFormByID(form_id).entries;
			form_total_inputs = EC.Utils.getFormByID(form_id).total_inputs;
			parent_form_total_entries = 0;
			is_loading_more = false;
			prev_parent_children = 0;
			parents.length = 0;
			parent_counter = 0;
			self = this;

			//get all parents first
			EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

		};

		module.getNextParentChildEntries = function(the_total_of_children_loaded) {

			//get total of children already loaded
			prev_parent_children = the_total_of_children_loaded;

			//increase parent counter
			parent_offset++;
			parent_counter++;

			//get all parents first
			EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

		};

		module.getMoreChildEntries = function(the_child_form_id, the_children_offset) {

			form_id = the_child_form_id;
			children_offset = the_children_offset;
			is_loading_more = true;
			query_limit = window.localStorage.QUERY_LIMIT;

			//set a flag so we know we are dealing with a new user request aaction (tapping "show more" on the entries list)
			new_request = true;

			//save last parent and set it as first elements of parents aray.
			//When tapping for more entries, we need to fetch for the last parent first
			var last_parent = parents[parents.length - 1];
			parents.length = 0;
			parents.push(last_parent);

			//reset children count to 0, as we need to remove previous children already listed in the DOM
			parents[0].children.length = 0;

			parent_counter = 0;

			console.log(parents);

			//get more entries for the same parent
			EC.db.transaction(_getAllChildrenTX, EC.Select.errorCB, _getAllChildrenSuccessCB);

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * Select  all the entries we are going to delete and cache them
 *
 * We need the total amount of entries deleted to update the entries counter per
 * each form, also we need to delete any children based on the entry key of the
 * selected entry
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var parent_key;
		var child_entries;
		var child_counters;
		var parent_entries;

		var _getChildEntriesForDeletionSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;
			
			//get all child entries
			for ( i = 0; i < iLength; i++) {
				child_entries.push(the_result.rows.item(i));
			}
			
			//get totalt of entries deleted from a specific form
			if (iLength > 0) {
				child_counters = {
					form_id : child_entries[0].form_id,
					amount : child_entries.length
				};
			}
		};

		var _getChildEntriesForDeletionTX = function(tx) {

			var i;
			var iLength = parent_entries.length;
			var query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE parent=? GROUP BY entry_key";

			//We will loop using all the 'parent' values as we might have more than one child
			// to delete

			/* per each entry, get parent key building up full path to the root
			 * like <parent_key>|<child_key> etc.
			 * parent key is "" when the entry is a top level entry (top level form), because
			 * it cannot have any parent
			 */
			for ( i = 0; i < iLength; i++) {

				if (parent_entries[i].parent === "") {
					parent_key = parent_entries[i].entry_key;
				}
				else {
					parent_key = parent_entries[i].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parent_entries[i].entry_key;
				}

				tx.executeSql(query, [parent_key], _getChildEntriesForDeletionSQLSuccessCB, self.errorCB);
			}

		};

		var _getChildEntriesForDeletionSuccessCB = function() {
			deferred.resolve(child_entries, child_counters);
		};

		module.getChildEntriesForDeletion = function() {

			self = this;
			deferred = new $.Deferred();
			parent_entries = EC.Delete.deletion_entries;
			child_entries = [];
			child_counters = {};

			EC.db.transaction(_getChildEntriesForDeletionTX, self.errorCB, _getChildEntriesForDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var entries = [];
		var input;
		var form_id;
		var branch_form_name;
		var entry_key;
		var count;
		var deferred;
		var hierarchy_key_value;
		var project_id;

		/*
		 * Get all entries for a form and group them by entry_key:
		 * a form have multiple entries, one per each input, and they all have the same entry_key value)
		 */
		var _getCountBranchEntriesTX = function(tx) {

			var query;

			query = 'SELECT COUNT(DISTINCT entry_key) as count FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=?';

			tx.executeSql(query, [branch_form_name, project_id, hierarchy_key_value], _getBranchEntriesSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchEntriesSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				count = (the_result.rows.item(0).count);
			} else {
				count = 0;
			}

		};

		var _getCountBranchEntriesSuccessCB = function() {

			//resolve deferred returning total of entries
			deferred.resolve(count, input);

		};

		module.getCountBranchEntries = function(the_input, the_hierarchy_key_value, the_project_id) {

			input = the_input;
			branch_form_name = the_input.branch_form_name;
			hierarchy_key_value = the_hierarchy_key_value;
			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getCountBranchEntriesTX, EC.Select.errorCB, _getCountBranchEntriesSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var entries = [];
		var form_id;
		var parent;
		var titles = [];
		var full_titles = [];
		var primary_keys = [];
		var child_counter = 0;
		var entry_key;
		var offset;
		var deferred;

		var _getEntriesSuccessCB = function() {

			/*
			 * store primary key values for current form
			 * it is not possible to have duplicates for the primary key input field within the same form level
			 * (using circular data structure)
			 */
			var i;
			var iLength = entries.length;
			for ( i = 0; i < iLength; i++) {
				primary_keys.push(entries[i].entry_key);
			}

			window.localStorage.primary_keys = JSON.stringify(primary_keys);
			primary_keys.length = 0;

			/*
			 * Using each entry, select all the fields for that entry with 'is_title' = true
			 * This will build the full title to be displayed per each itme in the listview
			 * if no inputs are set as title, default to the value of the primary key
			 */

			EC.db.transaction(_getEntriesTitlesTX, EC.Select.errorCB, _getEntriesTitlesSuccessCB);

			/*
			 * Using each entry, count how many child entry there are per each entry
			 * The counts will be displayed on the list of entries
			 */

			console.log(EC.Const.TRANSACTION_SUCCESS);

		};

		var _getEntriesTitlesSuccessCB = function() {

			//Build the titles concatenating all the title fields found per each entry
			var i;
			var j;
			var iLength = entries.length;
			var jLength = titles.length;
			var full_title;

			for ( i = 0; i < iLength; i++) {

				full_title = "";

				for ( j = 0; j < jLength; j++) {

					if (entries[i].entry_key === titles[j].entry_key) {
						full_title += (full_title === "") ? titles[j].value : ", " + titles[j].value;
					}

				}//for titles

				full_titles.push({
					full_title : full_title,
					entry_key : entries[i].entry_key
				});

			}//for entries

			// console.log("full_titles");
			// console.log(full_titles);

			//get the count of child entries (if any)
			_getChildrenCount();

		};

		/*
		 * Get all entries for a form and group them by entry_key:
		 *
		 * a form have multiple entries, one per each input, and they all have the same entry_key value)
		 */
		var _getEntriesTX = function(tx) {
			
			
			//TODO: fix ordering of entries
			var query = 'SELECT _id, entry_key, parent FROM ec_data WHERE form_id=? AND parent=? GROUP BY entry_key ORDER BY _id LIMIT ' + window.localStorage.QUERY_LIMIT + " OFFSET " + offset;

			tx.executeSql(query, [form_id, parent], _getEntriesSQLSuccess, EC.Select.errorCB);

		};

		var _getEntriesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with entries
			for ( i = 0; i < iLenght; i++) {

				entries.push(the_result.rows.item(i));

			}

			console.log(entries, true);

		};

		var _getEntriesTitlesTX = function(tx) {

			var i;
			var iLenght = entries.length;
			var query;

			//select all the rows to build the title (aside from skipped values as in the case of jumps)
			for ( i = 0; i < iLenght; i++) {
				query = 'SELECT _id, value, entry_key FROM ec_data WHERE form_id=? AND is_title=? AND entry_key=? AND parent=? AND value<>?';
				tx.executeSql(query, [form_id, 1, entries[i].entry_key, entries[i].parent, EC.Const.SKIPPED], _getEntriesTitlesSQLSuccess, EC.Select.errorCB);
			}//for

		};

		var _getEntriesTitlesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {

				titles.push(the_result.rows.item(i));
			}

		};

		function _getChildrenCountTX(tx) {

			var i;
			var iLength = entries.length;
			var parent;
			var parent_path;
			var breadcrumb_trail;
			var query;

			//get breadcrumbs to convert to parent path
			breadcrumb_trail = JSON.parse(window.localStorage.breadcrumbs);
			parent_path = (breadcrumb_trail[0] === "") ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

			for ( i = 0; i < iLength; i++) {

				parent = (parent_path === "") ? entries[i].entry_key : parent_path + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + entries[i].entry_key;

				query = 'SELECT parent FROM ec_data WHERE parent=? GROUP BY entry_key';

				// console.log(query);

				tx.executeSql(query, [parent], _getChildrenCountSQLSuccessCB, EC.Select.errorCB);

			}

		}

		function _getChildrenCountSuccessCB() {

			//offset is 0 resolve to entries list
			if (offset === 0) {
				deferred.resolve(full_titles.slice(0));
			} else {
				//if offset is not 0, we are loading more entries to be appended to the entries list
				EC.Entries.appendMoreEntries(full_titles.slice(0));
			}

			//clear all arrays
			full_titles.length = 0;
			titles.length = 0;
			entries.length = 0;
			child_counter = 0;

			console.log(EC.Const.TRANSACTION_SUCCESS);

		}

		function _getChildrenCountSQLSuccessCB(the_tx, the_result) {

			//Add total of children to its parent
			full_titles[child_counter].children = the_result.rows.length;

			child_counter++;

		}

		// Get the children for a parent form
		var _getChildrenCount = function() {

			if (entries.length > 0) {

				//get the count of children per each parent
				EC.db.transaction(_getChildrenCountTX, EC.Select.errorCB, _getChildrenCountSuccessCB);

			} else {

				//no child entries to fetch yet, render list of entries directly
				//Call Entries controller to render entries list (if offset is 0)
				if (offset === 0) {
					EC.Entries.renderList(full_titles.slice(0));
				} else {
					//if offset is not 0, we are loading more entries to be appended to the entries list
					EC.Entries.appendMoreEntries(full_titles.slice(0));
				}

				//clear all arrays
				full_titles.length = 0;
				titles.length = 0;
				entries.length = 0;
				child_counter = 0;

				console.log(EC.Const.TRANSACTION_SUCCESS);

			}

		};

		module.getEntries = function(the_form_id, the_parent_key, the_offset) {

			form_id = the_form_id;
			parent = the_parent_key;
			offset = the_offset;
			deferred = new $.Deferred();

			EC.db.transaction(_getEntriesTX, EC.Select.errorCB, _getEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * Get all the entry keys for a single form, using form ID
 *
 * We use DISTICT to have a single occurrence of the netry key, as all the rows
 * belonging to a form entry can have the same
 */

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;

		var _getEntryKeys = function(tx) {

			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';

			tx.executeSql(query, [form_id], _getEntryKeysSQLSuccess, self.errorCB);
		};

		var _getEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}
		};

		var _getEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entry keys for the specified form
		module.getEntryKeys = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys = [];
			EC.db.transaction(_getEntryKeys, self.errorCB, _getEntryKeysSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var entry_key;
		var parent_path;
		var values = [];
		var branches = [];
		var deferred;

		var _getEntryValues = function(tx) {

			//get all entry values
			var query = 'SELECT * FROM ec_data WHERE form_id=? AND entry_key=? AND parent=? ORDER BY position';

			tx.executeSql(query, [form_id, entry_key, parent_path], _getEntryValuesSQLSuccess, EC.Select.errorCB);

		};
		//_getEntryValues

		var _getEntryValuesSQLSuccess = function(the_tx, the_result) {

			var i;
			var index;
			var iLenght = the_result.rows.length;
			var input_id = "";
			var current_input_id;
			var prev_value = [];
			var prev_obj;
			var new_obj;
			var new_object = {};
			var string;

			//build object with entry values
			for ( i = 0; i < iLenght; i++) {

				current_input_id = the_result.rows.item(i).input_id;

				values.push(the_result.rows.item(i));

				//keep track of branches, if any
				if (the_result.rows.item(i).type === EC.Const.BRANCH) {
					branches.push(the_result.rows.item(i));
				}

			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT ENTRY VALUES SUCCESS");

		};
		//_getEntryValuesSQLSuccess

		var _getEntryValuesSuccessCB = function(the_tx) {

			
			
			deferred.resolve(values.slice(0));

			//clear values array
			values.length = 0;
			console.log(EC.Const.TRANSACTION_SUCCESS);
		};

		module.getEntryValues = function(the_form_id, the_entry_key, the_parent_path) {

			form_id = the_form_id;
			entry_key = the_entry_key;
			parent_path = the_parent_path;
			deferred = new $.Deferred();

			EC.db.transaction(_getEntryValues, EC.Select.errorCB, _getEntryValuesSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var forms;
		var project_id;
		var has_branches;
		var total_synced_rows;
		var total_entries_rows;
		var total_media_files;
		var total_branch_media_files;
		var total_all_synced_rows;
		var button_states = {};
		var deferred;

		//callback for a forms select transaction success
		var _getFormsSuccessCB = function() {

			//get info about this project data to enable/ disable context menu buttons
			total_synced_rows = 0;
			total_entries_rows = 0;
			total_media_files = 0;
			total_all_synced_rows = 0;
			total_branch_media_files = 0;
			has_branches = EC.Utils.projectHasBranches();
			EC.db.transaction(_getDataInfoTX, EC.Select.errorCB, _getDataInfoSuccessCB);

		};

		var _getDataInfoTX = function(tx) {

			var i;
			var iLength = forms.length;
			var has_data_synced_query = 'SELECT COUNT(*) AS total_synced_rows FROM ec_data WHERE form_id=? AND is_data_synced=?';
			var has_entries_query = 'SELECT COUNT(*) AS total_entries_rows FROM ec_data WHERE form_id=?';
			var has_media_query = 'SELECT COUNT(*) AS total_media_files FROM ec_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value<>?';

			/* all synced: is_data_synced must be 1, there are some edge case where
			 * is_media_synced must be 1 before deleting, or the entry is of type media but
			 * no file has been saved
			 * 
			 * To simplify things, we enable the button when at least one row has is_data_synced=1 and we handle edge cases upon deletion (see EC.Select.getSyncedEntryKeys())
			 */
			var has_all_synced_query = 'SELECT COUNT(*) AS total_all_synced_rows FROM ec_data WHERE form_id=? AND is_data_synced=?';

			for ( i = 0; i < iLength; i++) {

				tx.executeSql(has_data_synced_query, [forms[i]._id, 1], _onDataSyncedSQLSuccess, EC.Select.errorCB);
				tx.executeSql(has_entries_query, [forms[i]._id], _onHasEntriesSQLSuccess, EC.Select.errorCB);
				tx.executeSql(has_media_query, [forms[i]._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _onHasMediaSQLSuccess, EC.Select.errorCB);
				tx.executeSql(has_all_synced_query, [forms[i]._id, 1], _onHasAllSyncedSQLSuccess, EC.Select.errorCB);
			}

		};

		var _onDataSyncedSQLSuccess = function(the_tx, the_result) {
			total_synced_rows += parseInt(the_result.rows.item(0).total_synced_rows, 10);
		};

		var _onHasEntriesSQLSuccess = function(the_tx, the_result) {
			total_entries_rows += parseInt(the_result.rows.item(0).total_entries_rows, 10);
		};

		var _onHasMediaSQLSuccess = function(the_tx, the_result) {
			total_media_files += parseInt(the_result.rows.item(0).total_media_files, 10);
		};

		var _onHasAllSyncedSQLSuccess = function(the_tx, the_result) {
			total_all_synced_rows += parseInt(the_result.rows.item(0).total_all_synced_rows, 10);
		};

		var _getDataInfoSuccessCB = function() {

			var i;
			var iLength;
			var branch_form_with_media_ids = [];

			console.log("Data info collected");

			button_states.unsync_all_data = (total_synced_rows > 0) ? 1 : 0;
			button_states.delete_all_entries = (total_entries_rows > 0) ? 1 : 0;
			button_states.delete_media_files = (total_media_files > 0) ? 1 : 0;
			button_states.delete_synced_entries = (total_all_synced_rows > 0) ? 1 : 0;

			//any branches? check for media files then
			if (has_branches) {

				//get all branch forms
				$.when(EC.Select.getBranchForms(project_id)).then(function(the_branch_forms) {

					//look up for branch forms with media
					iLength = the_branch_forms.length;
					for ( i = 0; i < iLength; i++) {
						if (parseInt(the_branch_forms[i].has_media, 10) === 1) {
							branch_form_with_media_ids.push(the_branch_forms[i]._id);
						}
					}

					//look up if there is at least 1 branch media file
					if (branch_form_with_media_ids.length > 0) {

						$.when(EC.Select.hasBranchMediaFiles(branch_form_with_media_ids)).then(function(is_media_found) {
							button_states.delete_media_files = (is_media_found) ? 1 : 0;
							deferred.resolve(forms.slice(0), button_states);
						});

					}
					else {
						deferred.resolve(forms.slice(0), button_states);
					}

				});

			}
			else {
				deferred.resolve(forms.slice(0), button_states);
			}

		};

		var _getFormsTX = function(tx) {

			var query = 'SELECT _id, name, key, num, has_media, has_branches, is_genkey_hidden, total_inputs, entries FROM ec_forms WHERE project_id=?';
			tx.executeSql(query, [project_id], _getFormsSQLSuccess, EC.Select.errorCB);
		};

		var _getFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				forms.push(the_result.rows.item(i));
			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT FORMS SUCCESS");

		};

		module.getForms = function(the_project_id) {

			project_id = the_project_id;
			forms = [];
			deferred = new $.Deferred();

			EC.db.transaction(_getFormsTX, EC.Select.errorCB, _getFormsSuccessCB);

			return deferred.promise();

		};
		//getForms

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var parent_form_name;
		var immediate_parent_key_value;
		var full_parent_path;
		var form_id;
		var deferred;

		var _errorCB = function(the_tx, the_result) {
			console.log(the_tx);
			console.log(the_result);
		};

		var _getFullParentPathSQLSuccess = function(the_tx, the_result) {

			//result will be null if no parent is found
			if (the_result.rows.item(0)) {
				full_parent_path = (the_result.rows.item(0).parent);
			}

		};

		var _getFullParentPathSuccessCB = function() {

			//if we have the parent entry for the current entry resolve otherwise reject the promise
			if (full_parent_path !== null) {
				deferred.resolve(full_parent_path);
			} else {
				deferred.reject();
			}

		};

		var _getFullParentPathTX = function(tx) {

			//a parent entry consists of multiple
			var query = 'SELECT parent FROM ec_data WHERE form_id=? AND entry_key=? LIMIT 1';
			tx.executeSql(query, [form_id, immediate_parent_key_value], _getFullParentPathSQLSuccess, _errorCB);

		};

		/* The new hierarchy foreign key constraint feature a parent key like key|key|key...
		 * therefore when downloading remote entries, we need to get the full parent path looking up the parent table on the device.
		 * If no parent entry is found, the user will be prompted to download from the immediate parent table to keep the referential integrity in the database
		 */
		module.getFullParentPath = function(the_form_id, the_immediate_parent_key_value) {

			form_id = the_form_id;
			immediate_parent_key_value = the_immediate_parent_key_value;
			deferred = new $.Deferred();
			full_parent_path = null;

			EC.db.transaction(_getFullParentPathTX, _errorCB, _getFullParentPathSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Get all the media files for a single hierarchy entry passing form ID and entry
 * key
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form;
		var deferred;
		var files;
		var entries;

		var _getHierarchyChildrenFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchyChildrenFilesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = 'SELECT value, type from ec_data WHERE form_id=? AND entry_key=? AND (type=? OR type=? OR type=?) AND value <>?';

			for ( i = 0; i < iLength; i++) {
				//get all file names and types
				tx.executeSql(query, [form._id, entries[i].entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getHierarchyChildrenFilesSQLSuccessCB, self.errorCB);
			}

		};

		var _getHierarchyChildrenFilesSuccessCB = function() {

			console.log("Hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(files));

			deferred.resolve(files);
		};

		module.getHierarchyChildrenFiles = function(the_form) {

			self = this;
			deferred = new $.Deferred();
			form = the_form;
			files = [];
			entries = EC.Delete.deletion_entries;

			EC.db.transaction(_getHierarchyChildrenFilesTX, self.errorCB, _getHierarchyChildrenFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method getHierarchyEntriesForDeletion
 *
 * Select and count the rows we are going to delete to be able to update the
 * entries counters later, the ones we use to show the entries total per each form
 * on the form list page
 * This is mainly done for performance reason, as querying COUNT per each form
 * each time the form list view is called was a bit heavy
 * Doing this way we have a column "entries_total" per each form and we keep that
 * value updated accordingly
 *
 * This method also caches details about the entries we are going to delete later,
 * this is mainly to have a reference for any branches or media files  attached
 * to these entries which need to be deleted as well
 * 
 * on resolve(), entries and counters objects are returned
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entry_key;
		var entries;
		var counters;

		var _getHierarchyEntriesForDeletionSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//cache entries
			for ( i = 0; i < iLength; i++) {
				entries.push(the_result.rows.item(i));
			}

			//update counters
			counters.push({
				form_id : entries[0].form_id,
				amount : entries.length
			});
		};

		var _getHierarchyEntriesForDeletionTX = function(tx) {

			var query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE entry_key=? GROUP BY form_id";

			tx.executeSql(query, [entry_key], _getHierarchyEntriesForDeletionSQLSuccessCB, EC.Delete.errorCB);
		};

		var _getHierarchyEntriesForDeletionSuccessCB = function() {
			
			//return entries details and counters
			deferred.resolve(entries, counters);
		};

		module.getHierarchyEntriesForDeletion = function(the_entry_key) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			entries = [];
			counters = [];

			EC.db.transaction(_getHierarchyEntriesForDeletionTX, EC.Delete.errorCB, _getHierarchyEntriesForDeletionSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Get all the media files for a single hierarchy entry passing form ID and entry key
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form;
		var deferred;
		var files;
		var entry_key;
		
		var _selectHierarchyFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchyFilesTX = function(tx) {

			var query = 'SELECT value, type from ec_data WHERE form_id=? AND entry_key=? AND (type=? OR type=? OR type=?) AND value <>?';

			//get all file names and types
			tx.executeSql(query, [form._id, entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectHierarchyFilesSQLSuccessCB, self.errorCB);
		};
		
		var _getHierarchyFilesSuccessCB = function(){
			deferred.resolve(files);
		};
		
		module.getHierarchyFiles = function(the_form, the_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			form = the_form;
			entry_key = the_entry_key;
			files =[];

			EC.db.transaction(_getHierarchyFilesTX, self.errorCB, _getHierarchyFilesSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
/*
 * Get all the synced media files for a hierarchy form
 * 
 * files are synced when is_data_synced=? AND is_media_synced=? are both 1
 * 
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var deferred;
		var files;

		var _getHierarchySyncedFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		var _getHierarchySyncedFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchySyncedFilesTX = function(tx) {

			var query = "SELECT value, type from ec_data WHERE form_id=? AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?) AND value<>?";

			tx.executeSql(query, [form_id, 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getHierarchySyncedFilesSQLSuccessCB, self.errorCB);
		};

		module.getHierarchySyncedFiles = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			files = [];

			EC.db.transaction(_getHierarchySyncedFilesTX, self.errorCB, _getHierarchySyncedFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*global $, jQuery*/

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var form_id;
    var inputs = [];
    var input_options_ids = [];
    var input_options = [];
    var has_jumps;
    var has_location;
    var deferred;

    //callback triggered when all the inputs for a form are fetched correctly. 'inputs' contains all the inputs
    var _getInputsSuccessCB = function (tx) {

        console.log('TRANSACTION SELECT INPUTS SUCCESS');
        has_jumps = has_location = false;

        input_options_ids.length = 0;

        //We have all the inputs, need to check if any radio, select(dropdown), checkbox input has input options
        var i;
        var iLenght = inputs.length;

        //loop inputs looking for type radio, checkbox or dropdown and also to check if the form has some jumps
        for (i = 0; i < iLenght; i++) {

            if (inputs[i].type === EC.Const.RADIO || inputs[i].type === EC.Const.DROPDOWN || inputs[i].type === EC.Const.CHECKBOX) {

                //list which inputs have input options (the ids)
                input_options_ids.push({
                    id: inputs[i]._id
                });

            }
            //do we have a location input?
            if (inputs[i].type === EC.Const.LOCATION) {
                //this flag will be used to start watchPosition geolocation when adding an entry
                has_location = true;
            }


            if (inputs[i].has_jump === 1 && !has_jumps) {
                has_jumps = true;
            }
        }

        //map any option (if any) to the inputs
        if (input_options_ids.length > 0) {

            //console.log(JSON.stringify(input_options_ids));

            //get input options
            EC.db.transaction(_getInputOptionsTX, EC.Select.errorCB, _getInputOptionsSuccessCB);

        }
        //no options to map then just render form
        else {
            //resolve query
            deferred.resolve(inputs, has_jumps, has_location);
        }
    };

    var _getInputsSQLSuccess = function (the_tx, the_result) {

        var i;
        var iLenght = the_result.rows.length;

        //build object with inputs data
        for (i = 0; i < iLenght; i++) {
            inputs.push(the_result.rows.item(i));
        }
    };

    var _getInputOptionsSuccessCB = function (the_tx) {

        //map input options to input
        var i;
        var j;
        var iLength = inputs.length;
        var jLength = input_options.length;

        //build object with inputs data
        for (i = 0; i < iLength; i++) {

            inputs[i].options = [];

            for (j = 0; j < jLength; j++) {

                if (inputs[i]._id === input_options[j].input_id) {

                    inputs[i].options.push({
                        label: input_options[j].label,
                        ref: input_options[j].ref,
                        value: input_options[j].value
                    });

                }//if

            }//for

        }//for

        //resolve query
        deferred.resolve(inputs, has_jumps, has_location);
    };
    //_getInputOptionsSuccessCB

    var _getInputOptionsTX = function (tx) {

        var i;
        var iLenght = input_options_ids.length;
        var query;

        //get all input options per each input
        for (i = 0; i < iLenght; i++) {
            query = 'SELECT * FROM ec_input_options WHERE input_id=?';
            tx.executeSql(query, [input_options_ids[i].id], _getInputOptionsSQLSuccess, EC.Select.errorCB);
        }

    };

    var _getInputOptionsSQLSuccess = function (the_tx, the_result) {

        var i;
        var iLenght = the_result.rows.length;

        //build object with inputs data
        for (i = 0; i < iLenght; i++) {
            input_options.push(the_result.rows.item(i));
        }

    };

    var _getInputsTX = function (tx) {

        var query = 'SELECT * FROM ec_inputs WHERE form_id=? ORDER BY position';
        tx.executeSql(query, [form_id], _getInputsSQLSuccess, EC.Select.errorCB);
    };

    module.getInputs = function (the_form_id) {

        deferred = new $.Deferred();
        form_id = the_form_id;

        inputs.length = 0;
        input_options_ids.length = 0;
        input_options.length = 0;

        //if the project is using a circular network, get all other keys for the specified form to avoid entering the same primary key value for a form of the same hierarchy level
        $.when(EC.Select.getEntryKeys(form_id)).then(function (entry_keys) {

            var cached_keys;
            var form_level_keys;

            //merge keys with those already in localStorage (if we are using circular network and form level key uniqueness) avoiding duplicates
            try {
                cached_keys = JSON.parse(window.localStorage.primary_keys);
            } catch (error) {
                cached_keys = [];
            }
            form_level_keys = cached_keys.concat(entry_keys).unique();
            window.localStorage.primary_keys = JSON.stringify(form_level_keys);

            EC.db.transaction(_getInputsTX, EC.Select.errorCB, _getInputsSuccessCB);

        });

        return deferred.promise();

    };

    return module;

}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var forms;
		var input_ids = [];
		var deferred;

		module.getLocalInputIDs = function(the_forms) {

			forms = the_forms;
			deferred = new $.Deferred();

			EC.db.transaction(_getInputsIDsTX, EC.Select.errorCB, _getInputsIDsSuccessCB);

			return deferred.promise();

		};

		var _getInputsIDsTX = function(tx) {

			var i;
			var iLength = forms.length;
			var query = 'SELECT _id, ref FROM ec_inputs WHERE form_id=?';

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [forms[i]._id], _getInputsIDsSQLSuccess, EC.Select.errorCB);
			}

		};
		var _getInputsIDsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				input_ids.push(the_result.rows.item(i));
			}

		};

		var _getInputsIDsSuccessCB = function() {
			deferred.resolve(input_ids);
		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_name;
		var project_id;
		var deferred;

		var _getProjectRowIdSuccessCB = function() {
			deferred.resolve(project_id);
		};

		var _getProjectRowIdSQLSuccess = function(the_tx, the_result) {

			project_id = the_result.rows.item(0)._id;

		};

		var _getProjectRowIdTX = function(tx) {

			var query = 'SELECT _id FROM ec_projects WHERE name=?';
			tx.executeSql(query, [project_name], _getProjectRowIdSQLSuccess, EC.Select.errorCB);
		};

		module.getProjectRowId = function(the_project_name) {

			deferred = new $.Deferred();
			project_name = the_project_name;

			EC.db.transaction(_getProjectRowIdTX, EC.Select.errorCB, _getProjectRowIdSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var projects = [];
		var deferred;

		var _getProjectsSuccessCB = function() {
			console.log(EC.Const.TRANSACTION_SUCCESS);
		};

		var _getProjectsTX = function(tx) {

			var query = 'SELECT _id, name, total_hierarchy_forms, total_branch_forms FROM ec_projects ORDER BY name';
			tx.executeSql(query, [], _getProjectsSQLSuccess, EC.Select.errorCB);
		};

		var _getProjectsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				projects.push(the_result.rows.item(i));
			}

			deferred.resolve(projects);
		};

		module.getProjects = function() {

			deferred = new $.Deferred();
			//clear projects array
			projects.length = 0;

			EC.db.transaction(_getProjectsTX, EC.Select.errorCB, _getProjectsSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid : true*/
/*global $, jQuery*/

/*
 * Get all the synced entry keys for a single form, using form ID
 *
 * We use DISTICT to have a single occurrence of the entry key, as many rows can
 * have the same entry key.
 *
 * A row is fully synced when:
 *
 * is_data_synced= 1 but the row is not a media type (audio, photo, video),
 * is_data_synced is set to 1 after successfully uploading to the server
 *
 * is_data_synced = 1 and is_media_synced= 1 and the row is of type media (audio,
 * photo, video), this means the file was uploaded successfully
 *
 * is_data_synced = 1, is_media_synced is still 0, the type is media (audio,
 * photo, video) but the value is empty: this means the entry is data synced but
 * there is not any file to upload, therefore the entry can be safely deleted, as
 * the user decided not to enter any media when requested
 * TODO: check this better
 */

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;
		
		var _errorCB = function(the_result, the_error){
			console.log(the_result);
			console.log(the_error);
		};

		var _getSyncedEntryKeysTX = function(tx) {

			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';
			query += ' AND ((is_data_synced=? AND type NOT IN ("audio", "photo", "video"))';
			query += ' OR (is_data_synced=? AND is_media_synced=? AND type IN ("audio", "photo", "video"))';
			query += ' OR (is_data_synced=? AND is_media_synced=? AND type IN ("audio", "photo", "video") AND value=?))';

			tx.executeSql(query, [form_id, 1, 1, 1, 1, 0, ""], _getSyncedEntryKeysSQLSuccess, _errorCB);
		};

		var _getSyncedEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}
		};

		var _getSyncedEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entry keys for the specified form
		module.getSyncedEntryKeys = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys = [];
			EC.db.transaction(_getSyncedEntryKeysTX, self.errorCB, _getSyncedEntryKeysSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var branch_forms_ids;
		var total_branch_media_files;
		var project_id;
		var deferred;

		var _getBranchMediaFileSuccessCB = function() {
			deferred.resolve(total_branch_media_files > 0 ? true : false);	
		};

		var _getBranchMediaFileSQLSuccess = function(the_tx, the_result) {
			total_branch_media_files += parseInt(the_result.rows.item(0).total_branch_media_files, 10);
		};

		var _getBranchMediaFileTX = function(tx) {

			var i;
			var iLength = branch_forms_ids.length;
			var query = 'SELECT COUNT(*) AS total_branch_media_files FROM ec_branch_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value<>?';

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [branch_forms_ids[i], EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchMediaFileSQLSuccess, EC.Select.errorCB);
			}

		};

		module.hasBranchMediaFiles = function(the_branch_forms_ids) {

			branch_forms_ids = the_branch_forms_ids;
			total_branch_media_files = 0;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchMediaFileTX, EC.Select.errorCB, _getBranchMediaFileSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    //callback for a transaction error
    module.errorCB = function (the_result, the_error) {
        console.log(EC.Const.TRANSACTION_ERROR);
        console.log('%c' + the_error.message, 'color: red');
        console.log('%c' + the_result, 'color: red');
    };

    return module;

}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var branch_forms;
		var deferred;

		var _getBranchFormsTX = function(tx) {

			var query = "SELECT _id, name, num, key, total_inputs, has_media, is_genkey_hidden, entries FROM ec_branch_forms WHERE project_id=?";

			tx.executeSql(query, [project_id], _getBranchFormsSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				branch_forms.push(the_result.rows.item(i));

			}

		};

		var _getBranchFormsSuccessCB = function() {

			deferred.resolve(branch_forms);

		};

		module.getBranchForms = function(the_project_id) {

			project_id = the_project_id;
			branch_forms = [];
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormsTX, EC.Select.errorCB, _getBranchFormsSuccessCB);

			// return promise (with the branch_forms)
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var media_type;
		var audio;

		var _getOneBranchAudioFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, EC.Const.AUDIO, 1, 0, ""], getOneBranchAudioFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneBranchAudioFileSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				audio = the_result.rows.item(0);
			}

		};

		var _getOneBranchAudioFileSuccessCB = function() {

			if (audio) {
				deferred.resolve(audio);
			} else {
				deferred.reject();
			}

		};
		
		/* Get an audio file to upload, data needs to be synced and media unsynced
		 */
		module.getOneBranchAudioFile = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();
			audio =null;

			EC.db.transaction(_getOneBranchAudioFileTX, EC.Select.errorCB, _getOneBranchAudioFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var branch_form_name;
    var branch_form;
    var upload_branch_forms;
    var project_id;
    var hierarchy_entry_key_value;
    var branch_entry_values;
    var branch_entry_key;
    var branch_entry;
    var deferred;
    var self;

    /**
     *  @method _getOneEntryKeyTX Execute a query to get a single branch entry_key based on hierarchy_entry_key_value and NOT synced
     */
    var _getOneEntryKeyTX = function (tx) {

        var query = '';

        //select a single entry key
        query += 'SELECT DISTINCT entry_key FROM ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=? AND form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) LIMIT 1';

        tx.executeSql(query, [hierarchy_entry_key_value, 0, branch_form_name, project_id], _getOneEntryKeySQLSuccess, EC.Select.errorCB);

    };

    /**
     *  _getOneEntryKeySQLSuccess : SQL success callback, the result will be always 1 single element containing 1 branch entry_key (or none)
     */
    var _getOneEntryKeySQLSuccess = function (the_tx, the_result) {

        var iLength = the_result.rows.length;

        //if a entry_key is found
        if (iLength > 0) {

            branch_entry_key = the_result.rows.item(0).entry_key;
            branch_entry_values = [];

            //get all the values for the branche entry key found
            EC.db.transaction(_getOneBranchEntryTX, EC.Select.errorCB, _getOneBranchEntrySuccessCB);
        } else {

            //no unsynced branch entries for the current branch form, try next one (if any)
            if (EC.Upload.branch_forms.length > 0) {

                EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();

                self.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name, false);

            } else {

                /* NO more unsynced branch entries: show feedback
                 * check which action we were perfomorming, as the notification feedback has to be displayed only after an upload
                 */

                EC.Upload.action = (EC.Upload.action === EC.Const.BRANCH_RECURSION) ? EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD : EC.Const.START_BRANCH_UPLOAD;
                EC.Upload.renderUploadViewFeedback(true);

            }

        }

    };

    /**
     * _getOneBranchEntryTX : Select all the rows for a single branch entry key, not synced and belonging to the main entry_key specified
     * to enforce uniqueness, we are also adding the form_id as we might have clashes across project, so let's avoid them
     */
    var _getOneBranchEntryTX = function (tx) {

        var query = '';
        query += 'SELECT _id, hierarchy_entry_key_ref, hierarchy_entry_key_value, ref, value, entry_key, type, created_on FROM ec_branch_data WHERE form_id IN ';
        query += '(SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) ';
        query += 'AND is_data_synced=? AND hierarchy_entry_key_value=? AND entry_key=?';

        tx.executeSql(query, [branch_form_name, project_id, 0, hierarchy_entry_key_value, branch_entry_key], _getOneBranchEntrySQLSuccess, EC.Select.errorCB);
    };

    /**
     *  _getOneBranchEntrySQLSuccess SQL success callback, collecting all the values for a single branch entry to an array
     */
    var _getOneBranchEntrySQLSuccess = function (the_tx, the_result) {

        var i;
        var result = the_result;
        var iLength = result.rows.length;
        var ref;
        var new_ref = '';
        var location_ref = '';
        var location_obj = {};
        var location_string;
        var parent_ref;
        var path;
        var values_counter = 0;

        //build first branch entry
        branch_entry = {
            created_on: result.rows.item(0).created_on,
            entry_key: result.rows.item(0).entry_key,
            hierarchy_entry_key_ref: result.rows.item(0).hierarchy_entry_key_ref,
            hierarchy_entry_key_value: result.rows.item(0).hierarchy_entry_key_value,
            values: [{}]
        };

        console.log(result.rows.item(0));

        //add all values for this entry
        i = 0;
        values_counter = 0;
        //using a separate index for the entry values as each location value will be splitted into 4 components
        while (i < iLength) {

            //set empty object
            branch_entry.values[values_counter] = {};

            switch (result.rows.item(i).type) {

                //TODO: add branc type;

                case EC.Const.LOCATION:

                    //split the location values to different parts (as expected on server)
                    location_string = result.rows.item(i).value.replace('\n', '').replace('\r', '');

                    //no location saved, so fill in with empty values
                    if (location_string === '') {

                        branch_entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        branch_entry.values[values_counter].value = '';
                        branch_entry.values[values_counter]._id = result.rows.item(i)._id;
                        branch_entry.values[values_counter].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 1] = {};
                        branch_entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        branch_entry.values[values_counter + 1].value = '';
                        branch_entry.values[values_counter + 1]._id = '';
                        branch_entry.values[values_counter + 1].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 2] = {};
                        branch_entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        branch_entry.values[values_counter + 2].value = '';
                        branch_entry.values[values_counter + 2]._id = '';
                        branch_entry.values[values_counter + 2].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 3] = {};
                        branch_entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        branch_entry.values[values_counter + 3].value = '';
                        branch_entry.values[values_counter + 3]._id = '';
                        branch_entry.values[values_counter + 3].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 4] = {};
                        branch_entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        branch_entry.values[values_counter + 4].value = '';
                        branch_entry.values[values_counter + 4]._id = '';
                        branch_entry.values[values_counter + 4].type = result.rows.item(i).type;
                    } else {

                        //get location object
                        location_obj = EC.Utils.parseLocationString(location_string);

                        branch_entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        branch_entry.values[values_counter].value = location_obj.latitude;
                        branch_entry.values[values_counter]._id = result.rows.item(i)._id;
                        branch_entry.values[values_counter].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 1] = {};
                        branch_entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        branch_entry.values[values_counter + 1].value = location_obj.longitude;
                        branch_entry.values[values_counter + 1]._id = '';
                        branch_entry.values[values_counter + 1].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 2] = {};
                        branch_entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        branch_entry.values[values_counter + 2].value = location_obj.accuracy;
                        branch_entry.values[values_counter + 2]._id = '';
                        branch_entry.values[values_counter + 2].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 3] = {};
                        branch_entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        branch_entry.values[values_counter + 3].value = location_obj.altitude;
                        branch_entry.values[values_counter + 3]._id = '';
                        branch_entry.values[values_counter + 3].type = result.rows.item(i).type;

                        branch_entry.values[values_counter + 4] = {};

                        //heading on the server is called bearing
                        branch_entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        branch_entry.values[values_counter + 4].value = location_obj.heading;
                        branch_entry.values[values_counter + 4]._id = '';
                        branch_entry.values[values_counter + 4].type = result.rows.item(i).type;

                    }

                    //increase values_counter as we split the location value into 4 components
                    values_counter += 4;

                    break;

                default:

                    branch_entry.values[values_counter].ref = result.rows.item(i).ref;
                    branch_entry.values[values_counter].value = result.rows.item(i).value;
                    branch_entry.values[values_counter]._id = result.rows.item(i)._id;
                    branch_entry.values[values_counter].type = result.rows.item(i).type;

            }//switch

            //increase counter for next value
            values_counter++;
            i++;

        }//for

    };

    /**
     * _getOneBranchEntrySuccessCB All values for a single branch entry collected, upload them
     */
    var _getOneBranchEntrySuccessCB = function () {

        var branch_forms;

        console.log('One branch entry');
        console.log(branch_entry);

        switch (EC.Upload.action) {

            case EC.Const.START_BRANCH_UPLOAD:
                if (branch_entry) {
                    deferred.resolve(branch_entry);
                } else {
                    deferred.reject();
                }
                break;

            case EC.Const.BRANCH_RECURSION:

                //Upload entry
                if (branch_entry) {

                    EC.Upload.current_branch_entry = branch_entry;

                    //if ($.isEmptyObject(EC.Upload.current_branch_form)) {
                    //
                    //}

                    EC.Upload.prepareOneBranchEntry(EC.Upload.current_branch_form.name, EC.Upload.current_branch_entry);

                } else {

                    //TODO: no entry to upload, show upload success??
                    EC.Upload.action = (EC.Upload.action === EC.Const.BRANCH_RECURSION) ? EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD : EC.Const.START_BRANCH_UPLOAD;
                    EC.Upload.renderUploadViewFeedback(true);

                }
                break;

        }

    };

    /**
     * _getOneEntryKeySuccessCB
     */
    var _getOneEntryKeySuccessCB = function () {

        console.log(JSON.stringify(branch_entry_key));

    };

    var _getOneHierarchyEntryKeyValueTX = function (tx) {

        var query = 'SELECT DISTINCT hierarchy_entry_key_value FROM ec_branch_data WHERE is_data_synced=? AND form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) LIMIT 1';

        tx.executeSql(query, [0, branch_form_name, project_id], _getOneHierarchyEntryKeyValueSQLSuccess, EC.Select.errorCB);

    };

    var _getOneHierarchyEntryKeyValueSQLSuccess = function (the_tx, the_result) {

        if (the_result.rows.length > 0) {
            hierarchy_entry_key_value = the_result.rows.item(0).hierarchy_entry_key_value;
        }

    };

    var _getOneHierarchyEntryKeyValueSuccessCB = function () {

        if (hierarchy_entry_key_value) {

            //TODO: get entry key

            //get a single branch entry key
            EC.db.transaction(_getOneEntryKeyTX, EC.Select.errorCB, _getOneEntryKeySuccessCB);

        } else {

            //no branch entries for this form, try with next one if any
            if (EC.Upload.branch_forms.length > 0) {

                EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();
                self.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name);

            } else {

                /* NO more branch entries:
                 */

                if (EC.Upload.action === EC.Const.BRANCH_RECURSION) {
                    EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD;
                    EC.Upload.renderUploadViewFeedback(true);
                }

                if (EC.Upload.action === EC.Const.START_BRANCH_UPLOAD) {

                    //deferred rejected?
                    deferred.reject();

                }

            }

        }

    };

    /**
     * @method getOneBranchEntry Trigger a transaction to get 1 single branch entry key
     * @param {Object} the_branch_form_name
     * @param {Object} the_project_id
     * @param {Object} the_hierarchy_entry_key_value
     */
    module.getOneBranchEntry = function (the_project_id, the_branch_form_name, is_called_from_view) {

        self = this;
        project_id = the_project_id;
        branch_form_name = the_branch_form_name;
        branch_entry = {};

        /*
         * if we are calling this method from  the upload view, bind a deferred object to resolve to that call
         * This happens when the user loads the upload view and the first forms in the db do not have any entry to sync:
         * the getOneBranchEntry is then called recursively until an entry is found but WITHOUT overriding the deferred object
         */
        if (is_called_from_view) {
            deferred = new $.Deferred();
        }

        //get a single hierarchy_entry_key_value
        EC.db.transaction(_getOneHierarchyEntryKeyValueTX, EC.Select.errorCB, _getOneHierarchyEntryKeyValueSuccessCB);

        // return promise to update ui when entry has/has not been found
        if (is_called_from_view) {
            return deferred.promise();
        }

    };

    return module;

}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var media_type;
		var file;

		var _getOneBranchMediaFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, media_type, 1, 0, ""], getOneBranchMediaFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneBranchMediaFileSQLSuccess = function(the_tx, the_result) {

			file = the_result.rows.item(0);

		};

		var _getOneBranchMediaFileSuccessCB = function() {

			if (file) {
				deferred.resolve(file);
			} else {
				deferred.reject();
			}

		};

		module.getOneBranchMediaFile = function(the_project_id, the_type) {

			project_id = the_project_id;
			media_type = the_type;

			deferred = new $.Deferred();

			EC.db.transaction(_getOneBranchMediaFileTX, EC.Select.errorCB, _getOneBranchMediaFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var forms = [];
		var hierarchy_image;
		var hierarchy_audio;
		var hierarchy_video;
		var branch_images = [];
		var branch_audios = [];
		var branch_videos = [];
		var image;
		var audio;
		var video;
		var deferred;

		var _getOneHierarchyMediaPerTypeTX = function(tx) {

			var i;
			var iLength = forms.length;
			var photo = EC.Const.PHOTO;
			var audio = EC.Const.AUDIO;
			var video = EC.Const.VIDEO;

			// branch_images.length = 0;
			// branch_audios.length = 0;
			// branch_videos.length = 0;

			var hierarchy_query = 'SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			//var branch_query = 'SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND (type=? OR type=? OR type=?) AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			tx.executeSql(hierarchy_query, [project_id, 1, photo, 1, 0, ""], _getOneImageSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, audio, 1, 0, ""], _getOneAudioSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, video, 1, 0, ""], _getOneVideoSQLSuccess, EC.Select.errorCB);

			//tx.executeSql(branch_query, [project_id, 1, photo, video, audio, 1, 0, ""], _getBranchMediaSQLSuccess, EC.Select.errorCB);

			EC.Select.query_error_message = "EC.SelectgetOneHierarchyMediaPerType() _getOneHierarchyMediaPerTypeTX";
		};

		var _getOneImageSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				image = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy images found, try branches??
			}

		};
		var _getOneAudioSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				audio = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy audio found, try branches??
			}

		};
		var _getOneVideoSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				video = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy video found, try branches??
			}

		};

		var _getOneHierarchyMediaPerTypeSuccessCB = function() {

			//resolve object with only files from hierarchy entries (if any)
			deferred.resolve(image, audio, video);

		};

		module.getOneHierarchyMediaPerType = function(the_project_id) {

			project_id = the_project_id;

			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaPerTypeTX, EC.Select.errorCB, _getOneHierarchyMediaPerTypeSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();
		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var image;

		var _getOneBranchPhotoFileTX = function(tx) {

			var query = "SELECT * FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, EC.Const.PHOTO, 1, 0, ""], getOneBranchPhotoFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneBranchPhotoFileSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				image = the_result.rows.item(0);
			}

		};

		var _getOneBranchPhotoFileSuccessCB = function() {

			if (image) {
				console.log(image);
				deferred.resolve(image);
			} else {
				deferred.reject();
			}

		};

		module.getOneBranchPhotoFile = function(the_project_id) {

			project_id = the_project_id;
			image = null;
			deferred = new $.Deferred();

			EC.db.transaction(_getOneBranchPhotoFileTX, EC.Select.errorCB, _getOneBranchPhotoFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var project_id;
		var deferred;
		var media_type;
		var video;

		var _getOneBranchVideoFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, EC.Const.VIDEO, 1, 0, ""], getOneBranchVideoFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneBranchVideoFileSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				video = the_result.rows.item(0);
			}

		};

		var _getOneBranchVideoFileSuccessCB = function() {

			if (video) {
				deferred.resolve(video);
			}
			else {
				deferred.reject();
			}

		};
		
		/* Get a video file to upload, data needs to be synced and media unsynced
		 */
		module.getOneBranchVideoFile = function(the_project_id, the_type) {

			project_id = the_project_id;
			deferred = new $.Deferred();
			video = null;

			EC.db.transaction(_getOneBranchVideoFileTX, EC.Select.errorCB, _getOneBranchVideoFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var self;
    var project_id;
    var form;
    var entry;
    var entry_key;
    var deferred;
    var hierarchy_entry_values;
    var all_data_synced_on_start = false;

    /**
     * @method _getParentRef
     * @param {String} the_child_form_name
     *
     * Passing a form name, get the parent ref and its value. It will be used to link the child to its parent on the server
     *
     * When passing the top form, false is returned which means no parent for the current form
     */
    var _getParentRef = function (the_form_name) {

        var i;
        var name = the_form_name;
        var forms = JSON.parse(window.localStorage.forms);
        var iLength = forms.length;

        //check children only (skip first element, the top form)
        for (i = 1; i < iLength; i++) {

            if (forms[i].name === name) {

                return forms[i - 1].key;
            }

        }

        return false;

    };

    /**
     *  @method _getOneEntryKeyTX Execute a query to get a single entry_key  NOT synced
     */
    var _getOneEntryKeyTX = function (tx) {

        //select a single entry key
        var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=? AND is_data_synced=? LIMIT 1';

        tx.executeSql(query, [form._id, 0], _getOneEntryKeySQLSuccess, EC.Select.errorCB);

    };

    var _getOneEntryKeySQLSuccess = function (the_tx, the_result) {

        var iLength = the_result.rows.length;
        var project_id = parseInt(window.localStorage.project_id, 10);

        //if a entry_key is found
        if (iLength > 0) {

            //get all rows for this entry key
            entry_key = the_result.rows.item(0).entry_key;
            hierarchy_entry_values = [];

            //get all the values for the hierarchy entry key found
            EC.db.transaction(_getOneHierarchyEntryTX, EC.Select.errorCB, _getOneHierarchyEntrySuccessCB);

        } else {

            //no entries for this form  to upload, try next form (child) if any
            if (EC.Upload.hierarchy_forms.length > 0) {

                EC.Upload.current_form = EC.Upload.hierarchy_forms.shift();
                self.getOneHierarchyEntry(EC.Upload.current_form);

            } else {

                /*No entries for any form: Hierarchy upload completed
                 */

                //if the project has NOT branches, all done, shoe feedback to user
                if (!EC.Upload.has_branches) {

                    if (EC.Upload.action === EC.Const.HIERARCHY_RECURSION) {
                        EC.Upload.action = EC.Const.STOP_HIERARCHY_UPLOAD;
                        EC.Upload.renderUploadViewFeedback(true);
                    }

                }

                /* If triggered by the upload view, reject the deferred object triggered on the upload view by EC.Select.getOneHierarchyEntry();
                 * as no hierarchy entries found. The fail callback will be handled by looking for branches (if any)
                 * */
                if (EC.Upload.action === EC.Const.START_HIERARCHY_UPLOAD) {
                    deferred.reject();
                }

                //if it is a recursive call, it means we uploaded all the hierarchy entries and we have to upload all the branch entries
                if (EC.Upload.action === EC.Const.HIERARCHY_RECURSION) {

                    //switch to branch recursion to upload branch entries
                    EC.Upload.action = EC.Const.BRANCH_RECURSION;

                    //get branch forms for this project BEFORE tryng to look for a branch entry
                    $.when(EC.Select.getBranchForms(project_id)).then(function (the_branch_forms) {

                        EC.Upload.branch_forms = the_branch_forms;
                        EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();
                        //get branch entry WITHOUT creating a deferred object, as we are uploading branch entries automatically, without binding to upload view buttons
                        EC.Select.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name, false);
                    });
                }

            }
        }

    };

    var _getOneHierarchyEntryTX = function (tx) {

        var query = 'SELECT _id, entry_key, parent, value, type, ref, created_on FROM ec_data WHERE entry_key=? AND form_id=? AND is_data_synced=?';

        tx.executeSql(query, [entry_key, form._id, 0], _getOneHierarchyEntrySQLSuccess, EC.Select.errorCB);

        EC.Select.query_error_message = 'EC.Select.getOneHierarchyEntry _getOneHierarchyEntryTX';

    };

    var _getOneHierarchyEntrySQLSuccess = function (the_tx, the_result) {

        var i;
        var result = the_result;
        var iLength = result.rows.length;
        var ref;
        var new_ref = '';
        var location_ref = '';
        var location_obj = {};
        var location_string;
        var parent_ref;
        var path;
        var values_counter = 0;

        //build first entry
        entry = {
            created_on: result.rows.item(0).created_on,
            entry_key: result.rows.item(0).entry_key,
            values: [{}]
        };

        //if it is a child form, add parent @ref and its value as a parent obj
        parent_ref = _getParentRef(form.name);

        //if it is a child form, store parent ref
        if (parent_ref) {

            //get immediate parent value
            entry.parent_ref = parent_ref;
            path = (result.rows.item(0).parent).split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            entry.parent_key_value = path[path.length - 1];
        }

        //add all values for this entry
        i = 0;
        values_counter = 0;
        //using a separate index for the entry values as each location value will be splitted into 4 components
        while (i < iLength) {

            //set empty object
            entry.values[values_counter] = {};

            switch (result.rows.item(i).type) {

                //TODO: add branc type;

                case EC.Const.LOCATION:

                    //split the location values to different parts (as expected on server)
                    location_string = result.rows.item(i).value.replace('\n', '').replace('\r', '');

                    //no location saved, so fill in with empty values
                    if (location_string === '') {

                        entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        entry.values[values_counter].value = '';
                        entry.values[values_counter]._id = result.rows.item(i)._id;
                        entry.values[values_counter].type = result.rows.item(i).type;

                        entry.values[values_counter + 1] = {};
                        entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        entry.values[values_counter + 1].value = '';
                        entry.values[values_counter + 1]._id = '';
                        entry.values[values_counter + 1].type = result.rows.item(i).type;

                        entry.values[values_counter + 2] = {};
                        entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        entry.values[values_counter + 2].value = '';
                        entry.values[values_counter + 2]._id = '';
                        entry.values[values_counter + 2].type = result.rows.item(i).type;

                        entry.values[values_counter + 3] = {};
                        entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        entry.values[values_counter + 3].value = '';
                        entry.values[values_counter + 3]._id = '';
                        entry.values[values_counter + 3].type = result.rows.item(i).type;

                        entry.values[values_counter + 4] = {};
                        entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        entry.values[values_counter + 4].value = '';
                        entry.values[values_counter + 4]._id = '';
                        entry.values[values_counter + 4].type = result.rows.item(i).type;
                    } else {

                        //get location object
                        location_obj = EC.Utils.parseLocationString(location_string);

                        entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        entry.values[values_counter].value = location_obj.latitude;
                        entry.values[values_counter]._id = result.rows.item(i)._id;
                        entry.values[values_counter].type = result.rows.item(i).type;

                        entry.values[values_counter + 1] = {};
                        entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        entry.values[values_counter + 1].value = location_obj.longitude;
                        entry.values[values_counter + 1]._id = '';
                        entry.values[values_counter + 1].type = result.rows.item(i).type;

                        entry.values[values_counter + 2] = {};
                        entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        entry.values[values_counter + 2].value = location_obj.accuracy;
                        entry.values[values_counter + 2]._id = '';
                        entry.values[values_counter + 2].type = result.rows.item(i).type;

                        entry.values[values_counter + 3] = {};
                        entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        entry.values[values_counter + 3].value = location_obj.altitude;
                        entry.values[values_counter + 3]._id = '';
                        entry.values[values_counter + 3].type = result.rows.item(i).type;

                        //heading on the server is called bearing
                        entry.values[values_counter + 4] = {};
                        entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        entry.values[values_counter + 4].value = location_obj.heading;
                        entry.values[values_counter + 4]._id = '';
                        entry.values[values_counter + 4].type = result.rows.item(i).type;

                    }

                    //increase values_counter as we split the location value into 4 components
                    values_counter += 4;

                    break;

                default:

                    entry.values[values_counter].ref = result.rows.item(i).ref;

                    //set skipped values as empty strings
                    if (result.rows.item(i).value === EC.Const.SKIPPED) {
                        entry.values[values_counter].value = '';
                    } else {
                        entry.values[values_counter].value = result.rows.item(i).value;
                    }

                    entry.values[values_counter]._id = result.rows.item(i)._id;
                    entry.values[values_counter].type = result.rows.item(i).type;

            }//switch

            //increase counter for next value
            values_counter++;
            i++;

        }//for

    };

    var _getOneHierarchyEntrySuccessCB = function () {

        console.log('One entry');
        console.log(entry);

        switch (EC.Upload.action) {

            case EC.Const.START_HIERARCHY_UPLOAD:
                if (entry) {
                    deferred.resolve(entry);
                } else {
                    deferred.reject();
                }
                break;

            case EC.Const.HIERARCHY_RECURSION:

                //Upload entry
                if (entry) {
                    EC.Upload.current_entry = entry;
                    EC.Upload.prepareOneHierarchyEntry(EC.Upload.current_form.name, EC.Upload.current_entry);
                } else {
                    //TODO: no entry to upload, show upload success??
                    console.log('no entry to upload');
                }
                break;
        }
    };

    var _getOneEntryKeySuccessCB = function () {

    };

    module.getOneHierarchyEntry = function (the_form, is_called_from_view) {

        self = this;
        form = the_form;
        entry = {};

        if (is_called_from_view) {
            deferred = new $.Deferred();
        }

        EC.db.transaction(_getOneEntryKeyTX, EC.Select.errorCB, _getOneEntryKeySuccessCB);

        if (is_called_from_view) {
            // return promise to update ui when entry has/has not been found
            return deferred.promise();
        }

    };

    return module;

}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var media_type;
		var file;

		var _getOneHierarchyMediaFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, media_type, 1, 0, ""], getOneHierarchyMediaFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneHierarchyMediaFileSQLSuccess = function(the_tx, the_result) {

			file = the_result.rows.item(0);

		};

		var _getOneHierarchyMediaFileSuccessCB = function() {

			if (file) {
				deferred.resolve(file);
			} else {
				console.log("reject video upload");
				deferred.reject();
			}

		};

		module.getOneHierarchyMediaFile = function(the_project_id, the_type) {

			project_id = the_project_id;
			media_type = the_type;

			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaFileTX, EC.Select.errorCB, _getOneHierarchyMediaFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var forms = [];
		var hierarchy_image;
		var hierarchy_audio;
		var hierarchy_video;
		var branch_images = [];
		var branch_audios = [];
		var branch_videos = [];
		var image;
		var audio;
		var video;
		var deferred;

		var _getOneHierarchyMediaPerTypeTX = function(tx) {

			var i;
			var iLength = forms.length;
			var hierarchy_query = 'SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.PHOTO, 1, 0, ""], _getOneImageSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.AUDIO, 1, 0, ""], _getOneAudioSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.VIDEO, 1, 0, ""], _getOneVideoSQLSuccess, EC.Select.errorCB);

			EC.Select.query_error_message = "EC.SelectgetOneHierarchyMediaPerType() _getOneHierarchyMediaPerTypeTX";
		};

		var _getOneImageSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_image = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy images found, try branches??
			}

		};

		var _getOneAudioSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_audio = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy audio found, try branches??
			}
		};

		var _getOneVideoSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_video = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy video found, try branches??
			}
		};

		var _getOneHierarchyMediaPerTypeSuccessCB = function() {
			//resolve object with only files from hierarchy entries (if any)
			deferred.resolve(hierarchy_image, hierarchy_audio, hierarchy_video);
		};

		module.getOneHierarchyMediaPerType = function(the_project_id) {

			project_id = the_project_id;
			hierarchy_image = null;
			hierarchy_audio = null;
			hierarchy_video = null;
			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaPerTypeTX, EC.Select.errorCB, _getOneHierarchyMediaPerTypeSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();
		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var upload_URL;

		var _getProjectURLTX = function(tx) {

			var query = "SELECT uploadToServer FROM ec_projects WHERE _id=?";

			tx.executeSql(query, [project_id], getProjectURLSQLSuccess, EC.Select.errorCB);

		};

		var getProjectURLSQLSuccess = function(the_tx, the_result) {

			var result = the_result;
			upload_URL = result.rows.item(0).uploadToServer;

		};

		var _getProjectURLSuccessCB = function() {

			EC.Upload.setUploadURL(upload_URL);
			deferred.resolve(upload_URL);

		};

		module.getUploadURL = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getProjectURLTX, EC.Select.errorCB, _getProjectURLSuccessCB);

			// return promise when upload url is found
			return deferred.promise();

		};

		return module;

	}(EC.Select));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var self;
		var form_values;
		var form_id;
		var deferred;

		var _insertFormValuesTX = function(tx) {

			var i;
			var query;
			var obj;
			var iLength = form_values.length;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = form_values[i];

				//convert array to csv value (for checkboxes when multiple values are selected)
				if (Object.prototype.toString.call(obj.value) === '[object Array]') {
					obj.value = obj.value.join(', ');
				}

				query = 'UPDATE ec_branch_data SET value=? WHERE _id=?';

				tx.executeSql(query, [obj.value, obj._id], _insertFormValuesSQLSuccessCB, _errorCB);

			}
		};

		var _insertFormValuesSQLSuccessCB = function(the_tx, the_result) {
		};

		var _insertFormValuesSuccessCB = function() {
			deferred.resolve();
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			console.log("Error updating branch data");
			deferred.reject();
		};

		/**
		 *
		 * @param {Object} the_form_values: the values to update
		 */
		module.commitBranchForm = function(the_form_values) {

			form_values = the_form_values;
			deferred = new $.Deferred();

			EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var rows_deleted = [];
		var deleted_entries = [];
		var forms;
		var self;
		var deferred;

		//return the total of deleted entries (total of rows / number of inputs )
		var _getDeletedTotal = function(the_form_id, the_rows_deleted, the_forms) {

			var i;
			var form_id = the_form_id;
			var rows_deleted = the_rows_deleted;
			var forms = the_forms;
			var iLength = forms.length;

			for ( i = 0; i < iLength; i++) {

				if (rows_deleted[i].form_id === form_id) {
					return (rows_deleted[i].total_deleted / forms[i].total_inputs);
				}
			}
		};

		var _updateEntriesCountSuccessCB = function() {
			deferred.resolve();
		};

		var _updateEntriesCountTX = function(tx) {

			var i;
			var iLength = forms.length;
			var total_deleted;
			var query = "";

			for ( i = 0; i < iLength; i++) {

				//get total of entries deleted
				total_deleted = _getDeletedTotal(forms[i]._id, rows_deleted, forms);
				deleted_entries.push(total_deleted);
				query = 'UPDATE ec_forms SET entries = entries - ' + total_deleted + ' WHERE _id=?';

				tx.executeSql(query, [forms[i]._id], _onUpdateEntriesCountSQLSuccess, EC.Update.errorCB);
			}

			//store how many entries were deleted per each fomr in localStorage
			window.localStorage.deleted_entries = JSON.stringify(deleted_entries);

		};

		var _onUpdateEntriesCountSQLSuccess = function(the_tx, the_result) {
			console.log(the_result);
		};

		module.countSyncedDeleted = function(the_rows_deleted, the_forms) {

			self = this;
			rows_deleted = the_rows_deleted;
			forms = the_forms;
			deleted_entries.length = 0;
			deferred = new $.Deferred();

			EC.db.transaction(_updateEntriesCountTX, EC.Update.errorCB, _updateEntriesCountSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var forms;
		var project_id;
		var has_branches;
		var deferred;

		var _emptyMediaValuesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var query = "UPDATE ec_data SET value=? WHERE form_id=? AND (type=? OR type=? OR type=?)";
			var branch_query = "";

			for ( i = 0; i < iLength; i++) {

				tx.executeSql(query, ["", forms[i]._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _emptyMediaValuesSQLSuccessCB, _emptyMediaValuesErrorCB);

			}//for

			if (has_branches) {

				//apparently SQLite does not support JOIN in UPDATE, so JOIN on SELECT
				branch_query = "UPDATE ec_branch_data SET value=? WHERE form_id IN (SELECT form_id FROM ec_branch_data JOIN ec_branch_forms WHERE ec_branch_data.form_id = ec_branch_forms._id AND ec_branch_forms.project_id=?) AND (type=? OR type=? OR type=?)";

				tx.executeSql(branch_query, ["", project_id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _emptyBranchMediaValuesSQLSuccessCB, _emptyMediaValuesErrorCB);
			}

		};

		var _emptyMediaValuesSQLSuccessCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		var _emptyBranchMediaValuesSQLSuccessCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		var _emptyMediaValuesSuccessCB = function() {
			deferred.resolve();
		};

		var _emptyMediaValuesErrorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx, the_error);
			deferred.reject();
		};

		module.emptyMediaValues = function(the_hierarchy_forms, the_project_id) {

			forms = the_hierarchy_forms;
			project_id = the_project_id;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_emptyMediaValuesTX, _emptyMediaValuesErrorCB, _emptyMediaValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/*
 * Set a single row is_media_synced value to 1 to indicate file has been synced to the server 
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var row_id;
		var is_branch_file;
		var deferred;

		var _flagOneFileAsSyncedTX = function(tx) {

			var table = (is_branch_file) ? "ec_branch_data" : "ec_data";
			var query = 'UPDATE ' + table + ' SET is_media_synced=? WHERE _id=?';

			tx.executeSql(query, [1, row_id], null, EC.Update.errorCB);
		};

		var _flagOneFileAsSyncedSuccessCB = function() {
			deferred.resolve();
		};

		//flag a single media row as synced on the local DB (for photo, video, audio)
		module.flagOneFileAsSynced = function(the_row_id, the_is_branch_file_flag) {

			row_id = the_row_id;
			is_branch_file = the_is_branch_file_flag;
			deferred = new $.Deferred();

			EC.db.transaction(_flagOneFileAsSyncedTX, EC.Update.errorCB, _flagOneFileAsSyncedSuccessCB);

			return deferred.promise();
		};

		return module;
	}(EC.Update));

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = (function (module) {
    'use strict';
    //callback for a transaction error
    module.errorCB = function (the_error) {
        console.log(EC.Const.TRANSACTION_ERROR);
        console.log('%c' + the_error.message, 'color: red');
    };
    return module;
}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @method setBranchEntryAsSynced
 * Set all the rows of a branch entry to synced, setting is_data_synced to 1
 * 
 * @param {Array } the_branch_rows_to_sync
 * all the rows of a branch entry
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var branch_rows_to_sync;
		var deferred;
		var self;

		var _updateDataSyncedFlagTX = function(tx) {

			var i;
			var iLength = branch_rows_to_sync.length;
			var query;
			var branch_form_name;

			for ( i = 0; i < iLength; i++) {
				query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE _id=?';
				tx.executeSql(query, [1, branch_rows_to_sync[i]._id], null, self.errorCB);
			}
		};

		var _updateDataSyncedFlagSuccessCB = function() {
			deferred.resolve();
		};

		module.setBranchEntryAsSynced = function(the_branch_rows_to_sync) {

			self = this;
			branch_rows_to_sync = the_branch_rows_to_sync;
			deferred = new $.Deferred();

			EC.db.transaction(_updateDataSyncedFlagTX, self.errorCB, _updateDataSyncedFlagSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Update));

/*jslint vars: true, nomen: true, plusplus: true*/
var EC = EC || {};
EC.Update = EC.Update || {};

EC.Update = ( function(module) {

		var cached_branch_entry_keys = [];
		var main_form_key_value;
		var project_id;
		var deferred;

		var _updateStoredFlagTX = function(tx) {

			var i;
			var j;
			var iLength;
			var jLength;
			var query;
			var branch_form_name;

			iLength = cached_branch_entry_keys.length;
			for ( i = 0; i < iLength; i++) {

				branch_form_name = cached_branch_entry_keys[i].branch_form_name;
				jLength = cached_branch_entry_keys[i].primary_keys.length;

				for ( j = 0; j < jLength; j++) {
					query = 'UPDATE ec_branch_data SET is_stored=? WHERE form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=? AND entry_key=?';
					tx.executeSql(query, [1, branch_form_name, project_id, main_form_key_value, cached_branch_entry_keys[i].primary_keys[j]], _updateStoredFlagSQLSuccess, _errorCB);
				}

			}

		};

		var _updateStoredFlagSuccessCB = function() {
			console.log("UPDATE BRANCH STORED FLAG  SUCCESS");
			
			//All good, show positive feedback to user after insertion of new antry
			deferred.resolve(main_form_key_value);

		};

		var _updateStoredFlagSQLSuccess = function() {
			console.log("UPDATE BRANCH STORED FLAG SQL SUCCESS");
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		/*
		 */
		module.setCachedBranchesAsStored = function(the_cached_branch_entry_keys, the_main_form_key_value, the_project_id) {

			cached_branch_entry_keys = the_cached_branch_entry_keys;
			main_form_key_value = the_main_form_key_value;
			project_id = the_project_id;
			deferred = $.Deferred();

			EC.db.transaction(_updateStoredFlagTX, _errorCB, _updateStoredFlagSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var rows_to_sync;
		var deferred;
		var self;

		var _updateDataSyncedFlagTX = function(tx) {

			var i;
			var iLength = rows_to_sync.length;
			var query;

			for ( i = 0; i < iLength; i++) {

				/* If the row is NOT a media entry, set both is_data_synced AND is_media_synced
				 * to 1
				 *
				 * If the row is a media entry, i.e. of type audio, photo or video, AND its value
				 * is NOT an empty string, it means there is a file to upload so set
				 * _is_data_synced to 1 but keep is_media_sync to 0, as we need to upload and
				 * sync files separately.
				 */

				query = 'UPDATE ec_data SET is_data_synced=? WHERE _id=?';
				tx.executeSql(query, [1, rows_to_sync[i]._id], null, self.errorCB);

			}

		};

		var _updateDataSyncedFlagSuccessCB = function() {
			deferred.resolve();
		};

		module.setHierarchyEntryAsSynced = function(the_hierarchy_rows_to_sync) {

			self = this;
			rows_to_sync = the_hierarchy_rows_to_sync;
			deferred = new $.Deferred();

			EC.db.transaction(_updateDataSyncedFlagTX, self.errorCB, _updateDataSyncedFlagSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var forms = [];
		var deferred;
		var has_branches;
		var project_id;

		var _unsyncAllEntriesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var branch_query;

			var query = 'UPDATE ec_data SET is_data_synced=? WHERE form_id=?';
			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [0, forms[i]._id], _unsyncAllEntriesSQLSuccess, _unsyncAllEntriesErrorCB);
			}

			if (has_branches) {
				var branch_query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE form_id IN (SELECT form_id FROM ec_branch_data JOIN ec_branch_forms WHERE ec_branch_data.form_id = ec_branch_forms._id AND ec_branch_forms.project_id=?)';
				tx.executeSql(branch_query, [0, project_id], _unsyncAllBranchEntriesSQLSuccess, _unsyncAllEntriesErrorCB);
			}

		};

		var _unsyncAllEntriesSQLSuccess = function(the_tx, the_result) {
			console.log("Hierarchy entries ");
			console.log(the_result);
		};

		var _unsyncAllBranchEntriesSQLSuccess = function(the_tx, the_result) {
			console.log("Branch entries ");
			console.log(the_result);
		};

		var _unsyncAllEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncAllBrachEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncAllEntriesErrorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		module.unsyncAllEntries = function(the_forms, the_project_id) {

			forms = the_forms;
			project_id = the_project_id;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_unsyncAllEntriesTX, _unsyncAllEntriesErrorCB, _unsyncAllEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var rows_to_unsync;
		var self;
		var has_branches;
		var branch_form_names;
		var project_id;
		var entry_key;
		var deferred;

		var _unsyncOneHierarchyEntryTX = function(tx) {

			var update_query = 'UPDATE ec_data SET is_data_synced=? WHERE _id=?';
			var i;
			var iLength = rows_to_unsync.length;

			//unsync all rows
			for ( i = 0; i < iLength; i++) {

				//if we have branches, cache branch form names (if any, as the has_braches flag is at project level and we might not have branches for this hierarchy form)
				if (has_branches) {

					if (rows_to_unsync[i].type === EC.Const.BRANCH) {

						branch_form_names.push(rows_to_unsync[i].value.branch_form_name);

					}

				}

				tx.executeSql(update_query, [0, rows_to_unsync[i]._id], _unsyncOneHierarchyEntrySQLSuccess, _unsyncOneHierarchyEntryErrorCB);
			}

		};

		var _unsyncOneHierarchyEntrySQLSuccess = function(the_tx, the_result) {

			console.log(the_result, false);

		};

		var _unsyncOneHierarchyEntrySuccessCB = function() {

			rows_to_unsync.length = 0;

			//TODO:unsync any branches for this hierarchy entry
			if (has_branches && branch_form_names.length > 0) {
				EC.db.transaction(_unsyncBranchEntriesTX, _unsyncOneHierarchyEntryErrorCB, _unsyncBranchEntriesSuccessCB);
			} else {

				deferred.resolve();

			}

		};

		var _unsyncBranchEntriesTX = function(tx) {

			var update_query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=?';
			var i;
			var iLength = branch_form_names.length;

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(update_query, [0, branch_form_names[i], project_id, entry_key], _unsyncBranchEntriesSQLSuccess, _unsyncOneHierarchyEntryErrorCB);
			}

		};

		var _unsyncBranchEntriesSQLSuccess = function(the_tx, the_result) {
		};

		var _unsyncBranchEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncOneHierarchyEntryErrorCB = function() {
			deferred.reject();
		};

		module.unsyncOneHierarchyEntry = function(the_rows, the_entry_key, the_project_id) {

			self = this;
			has_branches = EC.Utils.projectHasBranches();
			rows_to_unsync = the_rows;
			entry_key = the_entry_key;
			project_id = the_project_id;
			branch_form_names = [];
			deferred = new $.Deferred();

			EC.db.transaction(_unsyncOneHierarchyEntryTX, _unsyncOneHierarchyEntryErrorCB, _unsyncOneHierarchyEntrySuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";
		
		var self;
		var form_id;
		var deferred;

		module.updateCountersOnEntriesDownload = function(the_form_id) {
			
			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
		
			EC.db.transaction(_updateCountersOnEntriesDownloadTX, self.errorCB, _updateCountersOnEntriesDownloadCB);

			return deferred.promise();
		};

		var _updateCountersOnEntriesDownloadTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + 1 + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _updateCountersOnEntriesDownloadCB = function() {
			deferred.resolve();
		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var amount;
		var forms_data_left;
		var forms_data_restored = [];
		var deferred;
		var old_forms;
		var current_form;

		module.updateCountersOnEntriesRestore = function(the_form_id, the_amount, the_forms_data_left) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			amount = the_amount;
			forms_data_left = the_forms_data_left;
			old_forms = JSON.parse(window.localStorage.forms);
			current_form = old_forms.shift();

			forms_data_restored.push({
				_id : form_id,
				entries : amount,
				has_media : current_form.has_media,
				num : current_form.num,
				total_inputs : current_form.total_inputs,
				name : current_form.name,
				is_active : current_form.is_active,
				key : current_form.key

			});

			window.localStorage.forms = JSON.stringify(old_forms);

			EC.db.transaction(_updateCountersOnEntriesRestoreTX, EC.Update.errorCB, _updateCountersOnEntriesRestoreSuccessCB);

			return deferred.promise();
		};

		var _updateCountersOnEntriesRestoreTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + amount + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, EC.Update.errorCB);
		};

		var _updateCountersOnEntriesRestoreSuccessCB = function() {

			//if we have nested forms, enter the next form data recursively
			if (forms_data_left.length > 0) {
				deferred.reject(forms_data_left);
			}
			else {
				//restore successful, update forms in localStorage
				window.localStorage.forms = JSON.stringify(forms_data_restored);

				forms_data_restored.length = 0;
				//reset total of entries
				amount = 0;

				deferred.resolve();
			}

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;

		var deferred;

		var _updateCountersOnSingleBranchEntryInsertionTX = function(tx) {

			var query = 'UPDATE ec_branch_forms SET entries = entries + ' + 1 + ' WHERE _id=?';
			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _updateCountersOnSingleBranchEntryInsertionSuccessCB = function() {
			deferred.resolve(true, entry_key);
		};

		module.updateCountersOnSingleBranchEntryInsertion = function(the_entry_key, the_form_id) {

			self = this;
			entry_key = the_entry_key;
			form_id = the_form_id;
			deferred = new $.Deferred();

			EC.db.transaction(_updateCountersOnSingleBranchEntryInsertionTX, self.errorCB, _updateCountersOnSingleBranchEntryInsertionSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/* @method updateCountersOnSingleEntryDeletion
 *
 * This method recursively updates the entries counters per each form after a
 * single entry deletion (ec_form table)
 *
 * @param {the_counters} array of objects like:
 *
 * { amount: 3,
 *   form_id : 39
 * }
 *
 * where amount is the total of entries deleted for the form, identified by
 * form_id
 *
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form;
		var counters;
		var row_id;
		var amount;
		var forms_data_left;
		var deferred;

		var _updateCountersOnSingleEntryDeletionSuccessCB = function() {
			
			//any more forms to update?
			if (counters.length > 0) {

				form = counters.shift();

				_doUpdate();
			}
			else {
				deferred.resolve();
			}

		};

		var _updateCountersOnSingleEntryDeletionTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + amount + ' WHERE _id=?';

			tx.executeSql(query, [form.form_id], null, self.errorCB);
		};

		function _doUpdate() {
			
			//amount will be removed
			amount = -form.amount;

			//update forms in localStorage with the new total entries values
			//TODO, maybe not needed
			console.log("localstorage forms maybe need to be updated here");

			EC.db.transaction(_updateCountersOnSingleEntryDeletionTX, self.errorCB, _updateCountersOnSingleEntryDeletionSuccessCB);
		}


		module.updateCountersOnSingleEntryDeletion = function(the_counters) {

			self = this;
			deferred = new $.Deferred();
			counters = the_counters;
			form = counters.shift();
			amount = 0;

			_doUpdate();

			return deferred.promise();
		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method updateCountersOnSingleEntryInsertion
 * Update the total of entries for a
 * hierarchy form, after entering entries.
 * It also updates the total of branch
 * entries linked to a hierarchy entry if any
 *
 * @param {the_entry_key} the value of the primary key for the form (entry) just
 * entered
 * @param {the_form_id} the _id of the form in the database
 */
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var amount;
		var deferred;

		module.updateCountersOnSingleEntryInsertion = function(the_entry_key, the_form_id) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			form_id = the_form_id;

			//update entries counter for the appropriate form
			EC.Utils.updateFormsObj(form_id);

			EC.db.transaction(_updateCountersOnSingleEntryInsertionTX, self.errorCB, _updateCountersOnSingleEntryInsertionSuccessCB);

			return deferred.promise();
		};

		var _updateCountersOnSingleEntryInsertionTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + 1 + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _updateCountersOnSingleEntryInsertionSuccessCB = function() {

			var project_id;
			var cached_branch_entry_keys;
			var branch_to_store;
			var i;
			var iLength;

			/* Hierarchy entry counter updated.
			 *
			 * If there are any branches set their rows "is_stored" flag to 1
			 */
			try {
				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				iLength = cached_branch_entry_keys.length;
				branch_to_store = false;

				//do we have any branch form cached?
				for ( i = 0; i < iLength; i++) {
					if (cached_branch_entry_keys[i].primary_keys.length > 0) {

						branch_to_store = true;
						break;
					}
				}

				if (branch_to_store) {

					project_id = window.localStorage.project_id;
					$.when(EC.Update.setCachedBranchesAsStored(cached_branch_entry_keys, entry_key, project_id)).then(function(entry_key) {
						deferred.resolve(entry_key);
					});

				}
				else {
					//no branches
					deferred.resolve(entry_key);
				}
			} catch(error) {

				//no branches to save, show positive feedback to user after insertion of new
				// entry
				deferred.resolve(entry_key);
			}
		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @method updateCountersOnSyncedEntriesDeletion
 * Update the total of entries locally stored for each form after deleteing all the synced entries for a project
 * 
 * @param {Array} the_counters
 * 
 * array of objects containing the amount of entries deleted per each form:
 * {form_id: <the_form_id>, amount: <the_amount>}
 */
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var counters;
		var deleted_entries;

		var _updateCountersOnSyncedEntriesDeletionSuccessCB = function() {
			deferred.resolve();
		};

		var _updateCountersOnSyncedEntriesDeletionTX = function(tx) {

			var i;
			var iLength = counters.length;
			var query;
			
			//loop and do a transaction per each form
			for ( i = 0; i < iLength; i++) {

				query = 'UPDATE ec_forms SET entries = entries - ' + counters[i].amount + ' WHERE _id=?';
				
				deleted_entries.push(counters[i].amount);

				tx.executeSql(query, [counters[i].form_id], null, self.errorCB);
			}

			//store how many entries were deleted per each form (to update counters in the dom after deletion)
			window.localStorage.deleted_entries = JSON.stringify(deleted_entries);

		};

		module.updateCountersOnSyncedEntriesDeletion = function(the_counters) {

			self = this;
			counters = the_counters;
			deleted_entries =[];
			deferred = new $.Deferred();

			EC.db.transaction(_updateCountersOnSyncedEntriesDeletionTX, self.errorCB, _updateCountersOnSyncedEntriesDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/**
 * Update a hierarchy entry in database; each value is a row in the table ec_data like:
 *
 * "input_id": 15,
 "form_id": 1,
 "position": 4,
 "parent": "Imperial College",
 "value": "Mirko is great",
 "is_title": 0,
 "entry_key": "Biology",
 "type": "textarea",
 "is_synced": 0
 *
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var self;
		var form_values;
		var form_id;
		var deferred;

		var _updateHierarchyEntryValuesSQLSuccessCB = function() {
			console.log("FORM VALUE EDITED SQL QUERY SUCCESS");
		};

		var _updateHierarchyEntryValuesTX = function(tx) {

			var i;
			var iLength = form_values.length;
			var query = 'UPDATE ec_data SET value=? WHERE _id=?';
			var obj;

			for ( i = 0; i < iLength; i++) {

				obj = form_values[i];
				//convert array to csv value (for checkboxes when multiple values are selected)
				if (Object.prototype.toString.call(obj.value) === '[object Array]') {
					obj.value = obj.value.join(', ');
				}
				tx.executeSql(query, [obj.value, obj._id], _updateHierarchyEntryValuesSQLSuccessCB, _errorCB);
			}
		};

		var _updateHierarchyEntryValuesSuccessCB = function() {
			console.log("FORM VALUES UPDATED SUCCESSFULLY");
			deferred.resolve();
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		module.updateHierarchyEntryValues = function(the_form_values) {

			self = this;
			deferred = new $.Deferred();
			form_values = the_form_values;
			form_id = form_values[0].form_id;

			EC.db.transaction(_updateHierarchyEntryValuesTX, _errorCB, _updateHierarchyEntryValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));

/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule SetData
 */

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function(module) {"use strict";

		var remote_entry;
		var updated_entries_counter;
		var local_entries_keys = [];
		var inputs = [];
		var project_id;
		var form_id;
		var entry_key_ref;
		var full_parent_path;
		var self;
		var deferred;
		var immediate_parent_key_value;

		var _errorCB = function(the_tx, the_result) {
			console.log(the_tx);
			console.log(the_result);
		};

		/**
		 * parseLocation() Convert a location json object to a single string concatenating the location components values
		 */
		function _parseLocationObjToString(the_location_obj) {

			var location_obj = the_location_obj;
			var latitude = (location_obj.latitude === "N/A") ? "" : location_obj.latitude;
			var longitude = (location_obj.longitude === "N/A") ? "" : location_obj.longitude;
			var altitude = (location_obj.altitude === "N/A") ? "" : location_obj.altitude;
			var accuracy = (location_obj.accuracy === "N/A") ? "" : location_obj.accuracy;
			var bearing = (location_obj.bearing === "N/A") ? "" : location_obj.bearing;

			return (//
				'Latitude: ' + latitude + ',\n' + //
				'Longitude: ' + longitude + ',\n' + //
				'Altitude: ' + altitude + ',\n' + //
				'Accuracy: ' + accuracy + ',\n' + //
				'Altitude Accuracy: ' + " " + ',\n' + //
				'Heading: ' + bearing + '\n');
			//
		}

		//get all primary key for local entries and all the inputs for the project
		var _getFormLocalDataTX = function(tx) {

			var query_entry_key = "SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?";
			var query_inputs = 'SELECT * FROM ec_inputs WHERE form_id=? ORDER BY position';

			tx.executeSql(query_entry_key, [form_id], _getFormPrimaryKeysSQLSuccessCB, self.errorCB);
			tx.executeSql(query_inputs, [form_id], _getFormInputsSQLSuccessCB, self.errorCB);

		};

		//fill in array with all the inputs for this form
		var _getFormInputsSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				inputs.push(the_result.rows.item(i));
			}

			window.localStorage.dre_inputs = JSON.stringify(inputs);

		};

		//fill in array with all the local entry keys
		var _getFormPrimaryKeysSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				local_entries_keys.push(the_result.rows.item(i).entry_key);
			}

			window.localStorage.dre_local_entries_keys = JSON.stringify(local_entries_keys);

		};

		//insert all the values for a single entry
		function _insertEntryValues(the_inputs, the_tx, the_immediate_parent_key_value, the_current_remote_entry, the_current_remote_entry_key, the_current_remote_timestamp) {

			var i;
			var iLength = the_inputs.length;
			var query;
			var ref;
			var obj;
			var location_obj;
			var latitude;
			var longitude;
			var altitude;
			var accuracy;
			var bearing;
			var tx = the_tx;
			var immediate_parent_key_value = the_immediate_parent_key_value;
			var current_remote_entry = the_current_remote_entry;
			var current_remote_entry_key = the_current_remote_entry_key;
			var current_remote_timestamp = the_current_remote_timestamp;
			var remote_ref_value;
			var remote_ref_value_location;

			//loop all the input fields
			for ( i = 0; i < iLength; i++) {

				ref = inputs[i].ref;

				//per each ref, check if the remote entry has a value
				if (current_remote_entry.hasOwnProperty(ref)) {

					//location object needs to be converted to string
					if ( typeof (current_remote_entry[ref]) === "string") {
						remote_ref_value = current_remote_entry[ref];
					} else {
						//location is a json object listing the components, so convert it to string
						location_obj = current_remote_entry[ref];
						remote_ref_value_location = _parseLocationObjToString(location_obj);
					}

				} else {
					//the current input ref is not part of the downloaded data set therefore set it to an empty string
					remote_ref_value = "";
				}

				//build query to insert values

				query = "";
				obj = inputs[i];

				query += 'INSERT INTO ec_data (';
				query += 'input_id, ';
				query += 'form_id, ';
				query += 'position, ';
				query += 'parent, ';
				query += 'label, ';
				query += 'ref, ';
				query += 'value, ';
				query += 'is_title, ';
				query += 'entry_key, ';
				query += 'type, ';
				query += 'created_on, ';
				query += 'is_remote, ';
				query += 'is_data_synced, ';
				query += 'is_media_synced) ';
				query += 'VALUES ("';
				query += obj._id + '", "';
				query += form_id + '", "';
				query += obj.position + '", "';
				query += immediate_parent_key_value + '", "';
				query += obj.label + '", "';
				query += ref + '", "';
				query += remote_ref_value + '", "';
				query += obj.is_title + '", "';
				query += current_remote_entry_key + '", "';
				query += obj.type + '", "';
				query += current_remote_timestamp + '", "';
				query += 1 + '", "';
				query += 1 + '", "';
				query += 1 + '");';
				tx.executeSql(query, [], _insertNewRowSQLSuccessCB, _errorCB);

			}//for all input fields

		}

		//insert values for top parent form
		var _insertTopFormValuesTX = function(tx) {

			var current_remote_entry = remote_entry;
			var current_remote_entry_key = current_remote_entry[entry_key_ref];
			var current_remote_timestamp = current_remote_entry.created;

			//insert entry values
			_insertEntryValues(inputs, tx, immediate_parent_key_value, current_remote_entry, current_remote_entry_key, current_remote_timestamp);

		};

		//insert values for one of the child forms
		var _insertChildFormValuesTX = function(tx) {

			var current_remote_entry = remote_entry;
			var current_remote_entry_key = current_remote_entry[entry_key_ref];
			var current_remote_timestamp = current_remote_entry.created;

			//insert entry values
			_insertEntryValues(inputs, tx, immediate_parent_key_value, current_remote_entry, current_remote_entry_key, current_remote_timestamp);
		};

		//A local entry with the same key is stored on the local database, so we have to update its values with the remote ones
		var _updateLocalRowWithRemoteTX = function(tx) {

			var current_remote_entry = remote_entry;
			var current_remote_entry_key = current_remote_entry[entry_key_ref];
			var current_remote_timestamp = current_remote_entry.created;
			var ref;
			var input_id;
			var i;
			var iLength = inputs.length;
			var location_obj;
			var remote_ref_value;
			var remote_ref_value_location;
			var query;

			//loop all the input fields
			for ( i = 0; i < iLength; i++) {

				//get local input _id and ref
				ref = inputs[i].ref;
				input_id = inputs[i]._id;

				//per each ref, check if the remote entry has a value
				if (current_remote_entry.hasOwnProperty(ref)) {

					//check if the current remote entry is a location object or not
					if ( typeof (current_remote_entry[ref]) === "string") {
						remote_ref_value = current_remote_entry[ref];
					} else {
						//location is a json object listing the components, so convert it to string
						location_obj = current_remote_entry[ref];
						remote_ref_value_location = _parseLocationObjToString(location_obj);
					}

				} else {

					//the current input ref is not part of the downloaded data set therefore set it to an empty string
					remote_ref_value = "";
				}

				query = 'UPDATE ec_data SET value=?, is_remote=? WHERE form_id=? AND input_id=? AND entry_key=?';
				tx.executeSql(query, [remote_ref_value, 1, form_id, input_id, current_remote_entry_key], _updateLocalRowWithRemoteSQLSuccessCB, self.errorCB);

			}//for each input field

		};

		var _updateLocalRowWithRemoteSQLSuccessCB = function(the_tx, the_result) {

		};

		//update entries counter for the current form (adding new entry, + 1)
		var _updateLocalRowWithRemoteSuccessCB = function(tx) {
			deferred.resolve();
		};


		var _getFormLocalDataSuccessCB = function() {

			var current_remote_entry = remote_entry;
			var current_remote_entry_key = current_remote_entry[entry_key_ref];
			var current_remote_timestamp = current_remote_entry.created;
			var form_tree = JSON.parse(window.localStorage.form_tree);
			var parent_form_name = form_tree.pname;
			var immediate_parent_form;
			var hierarchy_entry_key_value_ref;

			//check if the currenty entry match a primary key of a local entry
			if (EC.Utils.inArray(local_entries_keys, current_remote_entry_key)) {

				//update existing row
				console.log("***********************************************************  update " + current_remote_entry_key);

				//TODO: we have a match: update existing row
				EC.db.transaction(_updateLocalRowWithRemoteTX, _errorCB, _updateLocalRowWithRemoteSuccessCB);
			} else {

				//check parent first, then trigger different transaction based on parenting
				//insert new row
				console.log("***********************************************************  insert " + current_remote_entry_key);

				//manage parenting and form tree: if parent_name is "" we are entering data for top form so immediate_parent_key_value is set to ""
				if (parent_form_name === "") {

					immediate_parent_key_value = "";

					//TODO: insert top parent form values
					EC.db.transaction(_insertTopFormValuesTX, _errorCB, _insertTopFormValuesSuccessCB);

				} else {

					//child form therefore use parent entry key value from downloaded data
					hierarchy_entry_key_value_ref = EC.Utils.getFormParentPrimaryKeyRef(form_id);
					immediate_parent_key_value = current_remote_entry[hierarchy_entry_key_value_ref];
					immediate_parent_form = EC.Utils.getParentFormByChildID(form_id);

					//TODO: can we cache the full parent path (or part of it) to improve performance?
					$.when(EC.Select.getFullParentPath(immediate_parent_form._id, immediate_parent_key_value)).then(function(the_full_parent_path) {

						//build full parent path in the form key|key|key....
						if (the_full_parent_path !== "") {
							immediate_parent_key_value = the_full_parent_path + "|" + immediate_parent_key_value;
						}

						EC.db.transaction(_insertChildFormValuesTX, _errorCB, _insertChildFormValuesSuccessCB);

					}, function() {
						//no parent key found on the device, warn user
						deferred.reject();

					});

				}

			}

		};

		var _insertNewRowSQLSuccessCB = function(the_tx, the_result) {
			console.log("INSERT REMOTE ENTRY SUCCESS");
			console.log(JSON.stringify(the_result));
		};

		var _insertTopFormValuesSuccessCB = function(the_tx, the_result) {

			//update entries counter for the current form (adding new entry, + 1)
			$.when(EC.Update.updateCountersOnEntriesDownload(form_id)).then(function() {
				deferred.resolve();
			});

		};

		var _insertChildFormValuesSuccessCB = function(the_tx, the_result) {

			//update entries counter for the current form (adding new entry, + 1)
			$.when(EC.Update.updateCountersOnEntriesDownload(form_id)).then(function() {
				deferred.resolve();
			});

		};

		/**
		 *
		 * @param {Object} the_project_id
		 * @param {Object} the_form_id
		 * @param {Object} the_remote_entry
		 *
		 * @method commitRemoteEntry Commit a remote entry, insert it if a new one, otherwise update existing one on device as entries on the server overrides local entries
		 */
		module.commitRemoteEntry = function(the_project_id, the_form_id, the_remote_entry) {

			project_id = the_project_id;
			form_id = the_form_id;
			remote_entry = the_remote_entry;
			self = this;
			deferred = new $.Deferred();

			entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

			//reset array (we might have keys from a previous download)
			local_entries_keys.length = 0;
			//reset counter
			updated_entries_counter = 0;
			//reset inputs array
			inputs.length = 0;

			if (!window.localStorage.dre_local_entries_keys && !window.localStorage.dre_inputs) {

				//get all local primary keys and inputs for the current form before saving the new entries
				EC.db.transaction(_getFormLocalDataTX, _errorCB, _getFormLocalDataSuccessCB);
			} else {

				//local primary keys and inputs are cached, no need to query db
				//TODO
				local_entries_keys = JSON.parse(window.localStorage.dre_local_entries_keys);
				inputs = JSON.parse(window.localStorage.dre_inputs);

				_getFormLocalDataSuccessCB();
			}

			return deferred.promise();

		};

		return module;

	}(EC.Create));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Create
 *
 */

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function(module) {"use strict";

		var branch_rows;
		var deferred;
		var mapped_branch_forms;
		var mapped_input_ids;

		var _getLocalBranchFormID = function(the_name) {

			var i;
			var _id;

			for ( i = 0; i < mapped_branch_forms.length; i++) {

				if (mapped_branch_forms[i].name === the_name) {

					_id = mapped_branch_forms[i]._id;
					break;
				}
			}

			return _id;

		};

		var _getLocalBranchInputID = function(the_ref) {

			var i;
			var _id;

			for ( i = 0; i < mapped_input_ids.length; i++) {

				if (mapped_input_ids[i].ref === the_ref) {

					_id = mapped_input_ids[i]._id;
					break;
				}
			}

			return _id;

		};

		var _insertBranchDataRowsTX = function(tx) {

			var i;
			var iLength = branch_rows.length;
			var query = "";
			var obj = {};
			var local_branch_form_id;
			var local_branch_input_id;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = branch_rows[i];

				//use current local ids for forms and inputs to match the foreign key constraint
				local_branch_form_id = _getLocalBranchFormID(obj.name);
				local_branch_input_id = _getLocalBranchInputID(obj.ref);

				query += 'INSERT INTO ec_branch_data (';
				query += 'input_id, ';
				query += 'form_id, ';
				query += 'hierarchy_entry_key_ref, ';
				query += 'hierarchy_entry_key_value, ';
				query += 'position, ';
				query += 'label, ';
				query += 'ref, ';
				query += 'value, ';
				query += 'is_title, ';
				query += 'entry_key, ';
				query += 'type, ';
				query += 'is_data_synced, ';
				query += 'is_media_synced, ';
				query += 'is_cached, ';
				query += 'is_stored, ';
				query += 'created_on, ';
				query += 'is_remote) ';
				query += 'VALUES ("';
				query += local_branch_input_id + '", "';
				query += local_branch_form_id + '", "';
				query += obj.hierarchy_entry_key_ref + '", "';
				query += obj.hierarchy_entry_key_value + '", "';
				query += obj.position + '", "';
				query += obj.label + '", "';
				query += obj.ref + '", "';
				query += obj.value + '", "';
				query += obj.is_title + '", "';
				query += obj.entry_key + '", "';
				query += obj.type + '", "';
				query += obj.is_data_synced + '", "';
				query += obj.is_media_synced + '", "';
				query += obj.is_cached + '", "';
				query += obj.is_stored + '", "';
				query += obj.created_on + '", "';
				query += obj.remote_flag + '");';

				tx.executeSql(query, [], _insertBranchFormValuesSQLSuccessCB, _errorCB);
			}

		};

		var _insertBranchFormValuesSQLSuccessCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		var _insertBranchDataRowsSuccessCB = function() {
			deferred.resolve();
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		module.insertBranchDataRows = function(the_branch_forms_data, the_mapped_branch_forms, the_mapped_input_ids) {

			branch_rows = the_branch_forms_data.branch_data_rows;
			mapped_branch_forms = the_mapped_branch_forms;
			mapped_input_ids = the_mapped_input_ids;
			deferred = new $.Deferred();

			EC.db.transaction(_insertBranchDataRowsTX, _errorCB, _insertBranchDataRowsSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Create));

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var self;
    var branch_form_values = [];
    var branch_forms_data = [];
    var entries = [];
    var entry_key;
    var local_branch_form_id;
    var branch_form_total_entries;
    var deferred;

    //callback for a transaction error
    var _errorCB = function (the_tx, the_result) {
        console.log(EC.Utils.TRANSACTION_ERROR);
        console.log(the_result);
    };

    var _insertBranchFormValuesTX = function (tx) {

        var i;
        var iLength = branch_form_values.length;
        var remote_flag = 0;
        var is_cached = 1;
        var is_stored = 0;

        for (i = 0; i < iLength; i++) {

            var query = '';
            var obj = branch_form_values[i];

            query += 'INSERT INTO ec_branch_data (';
            query += 'input_id, ';
            query += 'form_id, ';
            query += 'hierarchy_entry_key_ref, ';
            query += 'hierarchy_entry_key_value, ';
            query += 'position, ';
            query += 'label, ';
            query += 'ref, ';
            query += 'value, ';
            query += 'is_title, ';
            query += 'entry_key, ';
            query += 'type, ';
            query += 'is_data_synced, ';
            query += 'is_media_synced, ';
            query += 'is_cached, ';
            query += 'is_stored, ';
            query += 'created_on, ';
            query += 'is_remote) ';
            query += 'VALUES ("';
            query += obj.input_id + '", "';
            query += obj.form_id + '", "';
            query += obj.hierarchy_entry_key_ref + '", "';
            query += obj.hierarchy_entry_key_value + '", "';
            query += obj.position + '", "';
            query += obj.label + '", "';
            query += obj.ref + '", "';
            query += obj.value + '", "';
            query += obj.is_title + '", "';
            query += obj.entry_key + '", "';
            query += obj.type + '", "';
            query += obj.is_data_synced + '", "';
            query += obj.is_media_synced + '", "';
            query += is_cached + '", "';
            query += is_stored + '", "';
            query += obj.created_on + '", "';
            query += remote_flag + '");';

            tx.executeSql(query, [], _insertBranchFormValuesSQLSuccessCB, _errorCB);

        }//for

    };

    var _insertBranchFormValuesSuccessCB = function () {

        var branch_form_id = branch_form_values[0].form_id;

        //update branch entries counter, + 1
        $.when(EC.Update.updateCountersOnSingleBranchEntryInsertion(entry_key, branch_form_id)).then(function () {
            deferred.resolve(entry_key);
        }, function () {
            deferred.reject();
        });

    };

    var _insertBranchFormValueserrorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    var _insertBranchFormValuesSQLSuccessCB = function () {
    };

    /*
     * Commit a branch form to database; each value is a row in the table ec_data:
     * when committed, the branch form is set as is_cached = 1, is_stored = 0
     * the is_stored flag is set to one when the main form is saved.
     * If the user leaves the main form without saving, the branch entries only cached (is_stored = 0) will be deleted
     */
    module.insertBranchFormValues = function (the_branch_form_values, the_key_value) {

        branch_form_values = the_branch_form_values;
        entry_key = the_key_value;
        deferred = new $.Deferred();

        EC.db.transaction(_insertBranchFormValuesTX, _errorCB, _insertBranchFormValuesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Create));

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function (module) {
    'use strict';

    var form_values;
    var entry_key;
    var deferred;

    var _insertFormValuesTX = function (tx) {

        var i;
        var iLength = form_values.length;
        var remote_flag = 0;
        var query;
        var obj;

        for (i = 0; i < iLength; i++) {

            query = '';
            obj = form_values[i];

            query += 'INSERT INTO ec_data (';
            query += 'input_id, ';
            query += 'form_id, ';
            query += 'position, ';
            query += 'parent, ';
            query += 'label, ';
            query += 'ref, ';
            query += 'value, ';
            query += 'is_title, ';
            query += 'entry_key, ';
            query += 'type, ';
            query += 'created_on, ';
            query += 'is_data_synced, ';
            query += 'is_remote, ';
            query += 'is_media_synced) ';
            query += 'VALUES ("';
            query += obj.input_id + '", "';
            query += obj.form_id + '", "';
            query += obj.position + '", "';
            query += obj.parent + '", "';
            query += obj.label + '", "';
            query += obj.ref + '", "';
            query += obj.value + '", "';
            query += obj.is_title + '", "';
            query += obj.entry_key + '", "';
            query += obj.type + '", "';
            query += obj.created_on + '", "';
            query += obj.is_data_synced + '", "';
            query += remote_flag + '", "';
            query += obj.is_media_synced + '");';

            tx.executeSql(query, [], _insertFormValuesSQLSuccessCB, _errorCB);

        }//for

    };

    var _insertFormValuesSuccessCB = function () {

        var form_id = form_values[0].form_id;
        console.log('FORM VALUES SAVED SUCCESSFULLY');

        //update entries counter, + 1
        $.when(EC.Update.updateCountersOnSingleEntryInsertion(entry_key, form_id)).then(function (main_form_entry_key) {
            deferred.resolve(main_form_entry_key);
        }, function () {
            deferred.reject();
        });

    };

    var _insertFormValuesSQLSuccessCB = function () {
        console.log('FORM VALUE SQL QUERY SUCCESS');
    };

    var _errorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    /*
     * Commit a form to database; each value is a row in the table ec_data
     * a single entry get multiple rows
     */
    module.insertFormValues = function (the_form_values, the_key_value) {

        form_values = the_form_values;
        entry_key = the_key_value;
        deferred = new $.Deferred();

        EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Create));

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = (function (module) {
    'use strict';

    var hierarchy_forms_data = [];
    var entries = [];
    var entry_key;
    var single_entry_values;
    var single_entry_key;
    var local_form_id;
    var form_total_entries;
    var self;
    var deferred;

    //callback for a transaction error
    module.errorCB = function (the_tx, the_error) {
        console.log(EC.Utils.TRANSACTION_ERROR);
        console.log(the_error);
        console.log(the_tx);
    };

    var _insertSingleEntryValues = function (the_entry_values, the_entry_key) {

        single_entry_values = the_entry_values;
        single_entry_key = the_entry_key;

        EC.db.transaction(_insertSingleEntryValuesTX, EC.Create.errorCB, _insertSingleEntryValuesSuccessCB);

    };

    module.insertAllFormsData = function (the_hierarchy_data) {

        self = this;
        hierarchy_forms_data = the_hierarchy_data;
        deferred = new $.Deferred();

        //insert hierarchy entries recursively
        self.insertEntries(hierarchy_forms_data.shift());

        return deferred.promise();

    };

    module.insertEntries = function (the_single_form_values) {

        var i;
        var iLength;
        var current_row;
        var current_entry_key;
        var current_entry_values = [];

        //get current form details and data rows the first time the function is called
        if (the_single_form_values.hasOwnProperty('form_name')) {

            local_form_id = EC.Utils.getLocalFormID(the_single_form_values.form_name);
            form_total_entries = the_single_form_values.total_entries;
            entries = the_single_form_values.data_rows;
        } else {
            //on subsequent calls only the elements left to insert are passed
            entries = the_single_form_values;
        }

        current_entry_key = entries[0].entry_key;
        iLength = entries.length;

        for (i = 0; i < iLength; i++) {
            //fill in form_values with only the rows for a single entry, checking entry_key value
            if (entries[i].entry_key === current_entry_key) {
                current_entry_values.push(entries[i]);
            } else {
                break;
            }
        }//for

        //remove current entry values from main entries array and exit
        entries.splice(0, current_entry_values.length);

        //save the rows currently in form_values to database, as they all belong to the same form
        _insertSingleEntryValues(current_entry_values, current_entry_key);

    };

    var _insertSingleEntryValuesTX = function (tx) {

        var i;
        var iLength = single_entry_values.length;
        var query;
        var obj;
        var local_input_id;

        for (i = 0; i < iLength; i++) {

            query = '';
            obj = single_entry_values[i];
            local_input_id = EC.Utils.getLocalInputID(obj.ref);

            query += 'INSERT INTO ec_data (';
            query += 'input_id, ';
            query += 'form_id, ';
            query += 'position, ';
            query += 'parent, ';
            query += 'label, ';
            query += 'ref, ';
            query += 'value, ';
            query += 'is_title, ';
            query += 'entry_key, ';
            query += 'type, ';
            query += 'created_on, ';
            query += 'is_data_synced, ';
            query += 'is_media_synced) ';
            query += 'VALUES ("';
            query += local_input_id + '", "';
            query += local_form_id + '", "';
            query += obj.position + '", "';
            query += obj.parent + '", "';
            query += obj.label + '", "';
            query += obj.ref + '", "';
            query += obj.value + '", "';
            query += obj.is_title + '", "';
            query += obj.entry_key + '", "';
            query += obj.type + '", "';
            query += obj.created_on + '", "';
            query += obj.is_data_synced + '", "';
            query += obj.is_media_synced + '");';

            tx.executeSql(query, [], _insertSingleEntryValuesSQLSuccessCB, EC.Create.errorCB);

        }//for
    };

    var _insertSingleEntryValuesSQLSuccessCB = function () {

        console.log('SINGLE ENTRY VALUE SQL INSERT SUCCESS');
    };

    var _insertSingleEntryValuesSuccessCB = function () {

        console.log('SINGLE ENTRY VALUES SAVED SUCCESSFULLY');

        //insert next entries if any
        if (entries.length > 0) {
            self.insertEntries(entries);
        } else {
            //update entries counter for the current form. Resolved: all hierarchy data saved; Rejected: still data to save
            $.when(EC.Update.updateCountersOnEntriesRestore(local_form_id, form_total_entries, hierarchy_forms_data)).then(function () {
                //all forms updated
                deferred.resolve();
            }, function (the_forms_data_left) {
                //insert entries for next form
                self.insertEntries(the_forms_data_left.shift());
            });
        }

    };

    return module;

}(EC.Create));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {"use strict";

		var forms = [];
		var action = "";
		var project_name;
		var has_branches;
		var deferred;
		var project_id;

		var _deleteAllEntriesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var delete_branches_query;
			var delete_query = "DELETE FROM ec_data WHERE form_id=?";
			var update_count_query = "UPDATE ec_forms SET entries=? WHERE _id=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(delete_query, [forms[i]._id], _deleteAllEntriesSQLSuccessCB, _deleteAllEntriesErrorCB);
				tx.executeSql(update_count_query, [0, forms[i]._id]);
			}

			if (has_branches) {
				delete_branches_query = "DELETE FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=?)";
				tx.executeSql(delete_branches_query, [project_id], _deleteAllEntriesSQLSuccessCB, _deleteAllEntriesErrorCB);
			}

		};

		var _deleteAllEntriesSuccessCB = function() {

			var forms = JSON.parse(window.localStorage.forms);
			var i;
			var iLength;

			switch(action) {

				case EC.Const.RESTORE:
				//delete media files (if any) 
					$.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function() {
						deferred.resolve(forms);
					});
					
					break;
				case EC.Const.DELETE:

					//update entries count in forms array in localStorage
					iLength = forms.length;
					for ( i = 0; i < iLength; i++) {
						forms[i].entries = 0;
					}
					window.localStorage.forms = JSON.stringify(forms);

					//delete media files (if any) 
					$.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function() {
						deferred.resolve();
					});

					break;
			}

		};

		var _deleteAllEntriesErrorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		var _deleteAllEntriesSQLSuccessCB = function(the_tx, the_result) {

			console.log(the_result);
		};

		module.deleteAllEntries = function(the_action, the_project_name) {

			forms = JSON.parse(window.localStorage.forms);
			project_id = parseInt(window.localStorage.project_id, 10);
			action = the_action;
			project_name = the_project_name;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_deleteAllEntriesTX, _deleteAllEntriesErrorCB, _deleteAllEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
/*
 *
 * @method deleteAllSynced
 * deletes all the synced entries for a project. It also deletes any linked branches and any media files linked to the synced entries
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var project_name;
		var project_id;
		var forms;
		var current_form;
		var counter;
		var deferred;

		function _doDeletion() {

			//delete synced hierarchy entries for the current form
			$.when(EC.Delete.removeSyncedHierarchyEntries(current_form._id)).then(function() {

				if (forms.length > 0) {
					//delete synced entries for next form
					_deleteSynced(forms.shift());
				}
				else {

					//update total of synced hierachy entries deletes in ec_forms table for each form
					// of this project
					$.when(EC.Update.updateCountersOnSyncedEntriesDeletion(self.deletion_counters)).then(function() {

						//remove files (if any)
						if (self.deletion_files.length > 0) {
							$.when(EC.File.remove(project_name, self.deletion_files)).then(function() {
								deferred.resolve();
							});
						}
						else {
							deferred.resolve();
						}
					});

				}

			});
		}

		function _handleBranches(the_entry_keys) {

			var deferred = new $.Deferred();
			var entry_keys = the_entry_keys;

			//get all the branch files linked to synced entries (if any)
			$.when(EC.Select.getBranchSyncedFiles(entry_keys)).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries which are both data and media synced
				$.when(EC.Delete.removeSyncedBranchEntries(entry_keys)).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();
		}


		module.deleteAllSynced = function(the_project_id, the_project_name, the_forms) {

			self = this;
			deferred = new $.Deferred();
			project_name = the_project_name;
			project_id = the_project_id;
			forms = the_forms;
			self.deletion_synced_entry_keys = [];
			self.deletion_files = [];
			self.deletion_counters = [];

			//delete synced entries per each for recursively
			_deleteSynced(forms.shift());

			return deferred.promise();
		};

		function _deleteSynced(the_current_form) {

			current_form = the_current_form;

			/*
			 * Select all the synced entries, we need the hierarchy
			 * entry keys to delete any branches
			 *
			 */
			$.when(EC.Select.getSyncedEntryKeys(current_form._id)).then(function(the_entry_keys) {

				self.deletion_synced_entry_keys = the_entry_keys;
				self.deletion_counters.push({form_id: current_form._id, amount: the_entry_keys.length});

				if (current_form.has_media === 1) {

					//get hierarchy files to delete (synced only)
					$.when(EC.Select.getHierarchySyncedFiles(current_form._id)).then(function(the_files) {

						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches?
						if (current_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleBranches(self.deletion_synced_entry_keys)).then(function() {
								_doDeletion();
							});
						}
						else {
							_doDeletion();
						}
					});

				}
				else {

					//no media for this form, any branches?
					if (current_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleBranches(self.deletion_synced_entry_keys)).then(function() {
							_doDeletion();
						});

					}
					else {
						_doDeletion();
					}
				}
			});
		}

		return module;

	}(EC.Delete));


/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var rows_to_delete;
		var deferred;
		var media_types;

		//select and count the rows we are going to delete to be able to update the
		// counter later
		var _deleteBranchEntryTX = function(tx) {

			var query = "DELETE FROM ec_branch_data WHERE _id=?";
			var i;
			var iLength = rows_to_delete.length;

			for ( i = 0; i < iLength; i++) {

				/* Get file names to delete(if any) for media types when the value stored is not
				 * empty
				 * n.b: media files cached are not deleted by Epicollect5, the system can delete
				 * them if it needs resources anyway
				 *
				 * It be good to have Epicollect5 purge orphan cached files in the future
				 * TODO
				 */
				if (media_types.indexOf(rows_to_delete[i].type) !== -1 && rows_to_delete[i].value.stored !== "") {
					self.deletion_files.push({
						value : rows_to_delete[i].value.stored,
						type : rows_to_delete[i].type
					});
				}

				tx.executeSql(query, [rows_to_delete[i]._id], null, _deleteBranchEntryErrorCB);
			}
		};

		var _deleteBranchEntrySuccessCB = function() {

			//any file to delete?
			if (self.deletion_files.length > 0) {
				$.when(EC.File.remove(window.localStorage.project_name, self.deletion_files)).then(function() {
					deferred.resolve(true);
				});
			}
			else {
				deferred.resolve();
			}
		};

		var _deleteBranchEntryErrorCB = function() {
			deferred.reject();
		};
		/**
		 * @method deleteBranchEntry Deletes all the rows belonging to a single branch
		 * entry.
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of
		 * objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected branch
		 * entry
		 */
		module.deleteBranchEntry = function(the_rows) {

			self = this;
			rows_to_delete = the_rows;
			deferred = new $.Deferred();
			media_types = [EC.Const.AUDIO, EC.Const.PHOTO, EC.Const.VIDEO];
			self.deletion_files = [];

			EC.db.transaction(_deleteBranchEntryTX, _deleteBranchEntryErrorCB, _deleteBranchEntrySuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {"use strict";

		var _deleteCachedBranchEntriesTX = function(tx) {

			var delete_query = "DELETE FROM ec_branch_data WHERE is_cached=? AND is_stored=?";

			tx.executeSql(delete_query, [1, 0], _deleteCachedBranchEntriesSQLSuccessCB, EC.Delete.errorCB);

		};

		var _deleteCachedBranchEntriesSuccessCB = function() {

			console.log("Cached branch entries deleted");

			EC.Routing.changePage(EC.Const.INDEX_VIEW);

		};

		var _deleteCachedBranchEntriesSQLSuccessCB = function(the_tx, the_result) {

			console.log(the_result);
		};

		module.deleteCachedBranchEntries = function() {

			EC.db.transaction(_deleteCachedBranchEntriesTX, EC.Delete.errorCB, _deleteCachedBranchEntriesSuccessCB);

		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method deleteChildEntries deletes all the child entries linked to a hierarchy entry
 * 
 * It also deletes all the branches and get all the files linked to the braches (to be deleted later)
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var child_hierarchy_files;
		var child_branch_files;
		var current_child_form;

		module.deleteChildEntries = function() {

			self = this;
			deferred = new $.Deferred();
			current_child_form = EC.Delete.children_forms.shift();
			child_hierarchy_files = [];
			child_branch_files = [];

			_removeChildren();

			return deferred.promise();

		};
		
		//recursively delete the children entries
		function _doChildrenDeletion() {
			//delete all the hierarchy children data
			$.when(EC.Delete.removeHierarchyChildrenEntries()).then(function() {

				//another child form to delete entries from?
				if (EC.Delete.children_forms.length > 0) {

					current_child_form = EC.Delete.children_forms.shift();

					//delete children a level down recursively
					_removeChildren();
				}
				else {

					//all children deleted
					deferred.resolve();
				}
			});
		}

		function _removeChildren() {

			/*
			 * Cache child entries total and child entries details we are going to delete: we
			 * do this to
			 * update the entry counters after deletion (per each form) and to delete any
			 * children
			 * attached to the selected child entry. We also need the children entry keys to
			 * grab all the files attached
			 *
			 * We get:
			 *  - all the children entries like:
			 * { count: 3, entry_key: <the_entry_key>, form_id: <the_form_id>, parent :
			 * <the_parent_etry_key>}
			 *  - the total of children entries and the child form id
			 * { amount: <the_amount>, form_id: <the_form_id>}
			 */
			$.when(EC.Select.getChildEntriesForDeletion()).then(function(the_entries, the_counters) {
				
				//cache child entries and files in module object
				self.deletion_entries = the_entries;
				self.deletion_counters.push(the_counters);

				//Any media attached to delete?
				if (current_child_form.has_media === 1) {

					/* Select all the hierarchy children media files to be deleted
					 * (loop al the keys as we migth have more than one child
					 */
					$.when(EC.Select.getHierarchyChildrenFiles(current_child_form)).then(function(the_files) {

						//cache files to be deleted
						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches for the children?
						if (current_child_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleChildBranches()).then(function() {
								_doChildrenDeletion();
							});
						}
						else {
							_doChildrenDeletion();
						}
					});
				}
				else {

					//no media, any branches for the children then?
					if (current_child_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleChildBranches()).then(function() {
							_doChildrenDeletion();
						});
					}
					else {
						_doChildrenDeletion();
					}
				}
			});
		}

		function _handleChildBranches() {

			var deferred = new $.Deferred();

			//get all the branch files (if any)
			$.when(EC.Select.getBranchChildrenFiles()).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries linked to this hierarchy entry
				$.when(EC.Delete.removeLinkedBranchChildEntries()).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();

		}

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";
		
		var self;
		var entry_key;
		var current_form;
		var current_child_form;
		var hierarchy_files = [];
		var branch_files = [];
		var has_branches;
		var deferred;
		var project_name;

		function _handleBranches(the_entry_key) {

			var deferred = new $.Deferred();
			var entry_key = the_entry_key;

			//get all the branch files (if any)
			$.when(EC.Select.getBranchFiles(entry_key)).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries linked to this hierarchy entry
				$.when(EC.Delete.removeLinkedBranchEntries(entry_key)).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();
		}

		/**
		 * @method deleteEntry Deletes all the rows belonging to a single entry. It will
		 * also delete all the children entries and branch entries linked, plus all the
		 * files associated with these
		 * entries
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of
		 * objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected entry
		 */
		module.deleteEntry = function(the_project_name, the_rows, the_entry_key, the_current_form_id) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			has_branches = EC.Utils.projectHasBranches();
			current_form = EC.Utils.getFormByID(the_current_form_id);
			project_name = the_project_name;
			self.deletion_files = [];
			self.deletion_counters = [];
			self.deletion_entries = [];
			self.children_forms = EC.Utils.getChildrenForms(current_form._id);

			/*
			 * select COUNT(*) and rows we are going to delete: we do this to update the
			 * entry counter after deletion and to delete any children attached to the
			 * selected antry
			 */
			$.when(EC.Select.getHierarchyEntriesForDeletion(entry_key)).then(function(the_entries, the_counters) {

				self.deletion_entries = the_entries;
				self.deletion_counters = the_counters;

				//Does this entry has any media attached to delete?
				if (current_form.has_media === 1) {

					//select all the hierarchy media files to be deleted
					$.when(EC.Select.getHierarchyFiles(current_form, entry_key)).then(function(the_files) {

						//cache files to be deleted
						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches?
						if (current_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleBranches(entry_key)).then(function() {
								_doDeletion();
							});

						}
						else {
							_doDeletion();
						}

					});
				}
				else {

					//no media, any branches?
					if (current_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleBranches(entry_key)).then(function() {
							_doDeletion();
						});
					}
					else {
						_doDeletion();
					}

				}

			});

			return deferred.promise();

		};

		function _doDeletion() {

			//delete the hierarchy entry (the one currently selected by the user)
			$.when(EC.Delete.removeHierarchyEntry(entry_key)).then(function() {

				//TODO delete all the media files -> wait, check for children and children files

				//TODO delete hierarchy files, branches and branch files if any

				//delete children recursively if any
				if (self.children_forms.length > 0) {

					console.log("delete children and branches and media attached");

					$.when(EC.Delete.deleteChildEntries()).then(function() {

						//all children deleted, update counters (recursively) for all the forms
						console.log("all children deleted");
						console.log(self.deletion_counters);

						$.when(EC.Update.updateCountersOnSingleEntryDeletion(self.deletion_counters)).then(function() {
							//All done

							//any media files to remove?
							if (self.deletion_files.length > 0) {

								$.when(EC.File.remove(project_name, self.deletion_files)).then(function() {

									console.log(project_name + " media deleted");
									deferred.resolve(true);

								});

							}
							else {

								deferred.resolve(true);
							}
						});
					});
				}
				else {
					//no children, just update counters now (recursively) for all the forms
					$.when(EC.Update.updateCountersOnSingleEntryDeletion(self.deletion_counters)).then(function() {
						//All done
						deferred.resolve(true);
					});
				}
			});
		}

		return module;

	}(EC.Delete));

/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = (function (module) {
    'use strict';

    var project_id;
    var project_name;
    var deferred;

    var _deleteProjectTX = function (tx) {

        //enable PRAGMA to use foreign keys constraint: it is OFF by default
        EC.db.executeSql('PRAGMA foreign_keys=ON;', [], function (res) {
            console.log('PRAGMA res: ' + JSON.stringify(res));

            //hack to make it work on Android https://github.com/litehelpers/Cordova-sqlite-storage/issues/45
            if (window.device.platform === EC.Const.ANDROID) {
                EC.db.executeSql('PRAGMA foreign_keys;', [], function (res) {
                    console.log('PRAGMA res: ' + JSON.stringify(res));
                });
            }
        });

        var query = 'DELETE FROM ec_projects WHERE _id=?';
        tx.executeSql(query, [project_id], _deleteProjectSQLSuccessCB, _deleteProjectErrorCB);
    };

    var _deleteProjectSQLSuccessCB = function (the_tx, the_result) {
        console.log(the_result);
    };

    var _deleteProjectSuccessCB = function () {

        //delete media files (if any) for the project just deleted
        $.when(EC.File.deleteAllMedia(project_name, true, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function () {
            deferred.resolve();
        });
    };

    var _deleteProjectErrorCB = function (the_tx, the_result) {
        console.log(the_result);
        deferred.reject();
    };

    //Delete a project and related tables: database integrity will be kept with
    // triggers (see EC.DBAdapter)
    module.deleteProject = function (the_project_id, the_project_name) {

        project_id = the_project_id;
        project_name = the_project_name;
        deferred = new $.Deferred();

        EC.db.transaction(_deleteProjectTX, _deleteProjectErrorCB, _deleteProjectSuccessCB);

        return deferred.promise();
    };

    return module;

}(EC.Delete));

var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = (function (module) {
    'use strict';

    module.deletion_counters = [];
    module.deletion_entries = [];
    module.deletion_files = [];
    module.children_forms = [];

    //callback for a transaction error
    module.errorCB = function (the_error) {
        console.log(EC.Const.TRANSACTION_ERROR);
        console.log('%c' + the_error.message, 'color: red');
    };

    return module;
}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeHierarchyChildrenEntries
 * 
 * Removes all the children entries of a hierarchy entry (direct children)
 * 
 * This method is called recursively to delete all the children for immediate parent entries
 * 
 * EC.Delete.deletion_entries is an array containign all the parent entry keys used to remove the children
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var parent;
		var deferred;
		var entries;
		var parent_key;

		var _removeHierarchyChildrenEntriesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = "DELETE FROM ec_data WHERE parent=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].parent], null, self.errorCB);
			}
		};

		var _removeHierarchyChildrenEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeHierarchyChildrenEntries = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeHierarchyChildrenEntriesTX, self.errorCB, _removeHierarchyChildrenEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeHierarchyEntry
 * remove all the rows belonging to a hierarchy entry
 *
 * @param {String} the_hierarchy_entry_key 
 * the entry key of the hierarchy entry
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";
		
		var self;
		var hierarchy_entry_key;
		var deferred;
		
		var _removeHierarchyEntryTX = function(tx){
			
			//delete all rows belonging to this entry 
			var query = "DELETE FROM ec_data WHERE entry_key=?";
			tx.executeSql(query, [hierarchy_entry_key], null, self.errorCB);
		};
		
		var _removeHierarchyEntrySuccessCB = function(){
			deferred.resolve();
		};

		module.removeHierarchyEntry = function(the_hierarchy_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;

			EC.db.transaction(_removeHierarchyEntryTX, self.errorCB, _removeHierarchyEntrySuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeLinkedBranchChildEntries remove all the branch entries linked to
 * a child of a hierarchy entry
 *
 * no parameters are passed, as when this method is called the object
 * self.deletion_entries will contain all the entries entry key.
 * 
 * Branches are linked to a hierarchy entry via the hierarchy entry key
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entries;

		var _removeLinkedBranchChildEntriesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].entry_key], null, self.errorCB);
			}
		};

		var _removeLinkedBranchChildEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeLinkedBranchChildEntries = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeLinkedBranchChildEntriesTX, self.errorCB, _removeLinkedBranchChildEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";
		
		var self;
		var hierarchy_entry_key;
		var deferred;
		
		var _removeLinkedBranchEntriesSQLSuccessCB = function(the_tx, the_result){
		};
		
		var _removeLinkedBranchEntriesTX = function(tx){
			
			//delete all branches linked to this entry key (if any)
			var delete_branches_query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";
			tx.executeSql(delete_branches_query, [hierarchy_entry_key], _removeLinkedBranchEntriesSQLSuccessCB, self.errorCB);
		};
		
		var _removeLinkedBranchEntriesSuccessCB = function(){
			deferred.resolve();
		};

		module.removeLinkedBranchEntries = function(the_hierarchy_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;

			EC.db.transaction(_removeLinkedBranchEntriesTX, self.errorCB, _removeLinkedBranchEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid:true*/
/*global $, jQuery*/
/*
 *
 * Remove all the synced branch entries linked to synced hierarchy entries, lopping all the entry keys of the hierarchy entries
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var hierarchy_entry_keys;
		var deferred;

		var _removeSyncedBranchEntriesTX = function(tx) {

			var i;
			var iLength = hierarchy_entry_keys.length;
			var query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [hierarchy_entry_keys[i], 1], null, self.errorCB);
			}
		};

		var _removeSyncedBranchEntriesSuccessCB = function() {
			deferred.resolve();
		};
 
		module.removeSyncedBranchEntries = function(the_hierarchy_entry_keys) {

			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_keys = the_hierarchy_entry_keys;

			EC.db.transaction(_removeSyncedBranchEntriesTX, self.errorCB, _removeSyncedBranchEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var deferred;

		var _removeSyncedHierarchyEntriesTX = function(tx) {

			//delete all rows belonging to this form which are data synced
			var query = "DELETE FROM ec_data WHERE form_id=? AND is_data_synced=?";
			tx.executeSql(query, [form_id, 1], null, self.errorCB);
		};

		var _removeSyncedHierarchyEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeSyncedHierarchyEntries = function(the_form_id) {

			self = this;
			form_id = the_form_id;
			deferred = new $.Deferred();

			EC.db.transaction(_removeSyncedHierarchyEntriesTX, self.errorCB, _removeSyncedHierarchyEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

/* global LocalFileSystem */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    var forms;
    var project_name;
    var project_id;
    var backup_path;

    /**
     * @method _writeFile Write the project backup object to a file <project_name>.txt
     * The file is written to LocalFileSystem.PERSISTENT, whatever that resolves to (it depends on the device and platform)
     * @param {Object} the_content
     */
    function _writeFile(the_content) {
        function fail(the_error) {
            console.log(the_error);
        }


        console.log(JSON.stringify(the_content));

        var txt_content = JSON.stringify(the_content);
        var filename = project_name + '.txt';
        var deferred = new $.Deferred();

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

        function gotFS(the_fileSystem) {

            console.log(JSON.stringify(the_fileSystem));
            backup_path = the_fileSystem.root.fullPath;

            the_fileSystem.root.getFile(filename, {
                create: true,
                exclusive: false
            }, gotFileEntry, fail);
        }

        function gotFileEntry(fileEntry) {
            fileEntry.createWriter(gotFileWriter, fail);
        }

        function gotFileWriter(writer) {

            writer.onwritestart = function () {
            };

            writer.onwriteend = function (evt) {

                //file written successfully,
                deferred.resolve();
                console.log('Content of file:' + txt_content);
            };
            //write content to file
            writer.write(txt_content);
        }

        return deferred.promise();
    }

    /** @method backup Get data to backup for the current project (saving tables ec_data and ec_branch_data)
     *
     * @param {Object} the_forms the hierarchy forms
     * @param {Object} the_project_name current project name
     */
    module.backup = function (the_forms, the_project_name, the_project_id) {

        var deferred = new $.Deferred();
        forms = the_forms;
        project_name = the_project_name;
        project_id = the_project_id;

        //get data rows for all the forms for this project
        $.when(EC.Select.getAllProjectEntries(forms, project_id)).then(function (the_entries) {
            $.when(_writeFile(the_entries)).then(function () {
                deferred.resolve();
            });
        });

        return deferred.promise();

    };

    return module;

}(EC.File));

/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /*
     * Copyvthe video file from app private folder to app cache folder changing the file name to the current timestamp (video extension will be always .mp4)
     *
     * We do so to make it playable via a third party application (ANDROID only, and it needs a better implementation on 4.4+)
     */
    var video_path;
    var stored_filename;
    var cached_filename;
    var is_branch;
    var deferred;

    module.copyVideo = function (the_video_path, is_branch_flag) {

        deferred = new $.Deferred();
        video_path = the_video_path;
        is_branch = is_branch_flag;
        cached_filename = EC.Utils.getTimestamp() + '.mp4';

        function fail(error) {
            console.log(error);
        }

        function onLFSSuccess(the_video_file_entry) {

            function gotFS(the_file_system) {

                var fs = the_file_system;
                console.log(fs);
                //move file to externalCacheDirectory (directory entry pointing to external cache folder)
                the_video_file_entry.copyTo(fs, cached_filename, function (success) {
                    deferred.resolve(cached_filename);
                }, fail);
            }

            function fail(error) {
                console.log(error);
            }
            //request temporary folder from file system
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, gotFS, fail);
        }

        //get file entry resolving file full path
        window.resolveLocalFileSystemURI(video_path, onLFSSuccess, fail);

        return deferred.promise();

    };

    return module;

}(EC.File));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /* The new file system API will throw an error when trying to create a folder if
     * a parent does not exist
     * therefore we have to create the folders to contain the media files.
     *
     * -images
     * -audios
     * -videos
     *
     * in the Documents folder as the iOS permanent storage
     *
     * On iOS we create the folders at runtime using Cordova,
     * while on Android the folders are created using Java code
     *
     *
     */

    var dirs;
    var entry;
    var deferred;

    function onCreateSuccess() {
        _createMediaDir();
    }

    function onCreateFail(error) {
        console.log(error);
        deferred.reject();
    }

    function _createMediaDir() {

        var media_dir;

        if (dirs.length > 0) {

            media_dir = dirs.shift();

            //create a media folder: images, audios, videos
            entry.getDirectory(media_dir, {
                create: true,
                exclusive: false
            }, onCreateSuccess, onCreateFail);

        }
        else {
            console.log('Media folders created');
            deferred.resolve();
        }
    }

    function onIOSRFSSuccess(the_fileSystem) {

        entry = the_fileSystem.root;

        //create media folders recursively
        _createMediaDir();

    }

    function onIOSRFSError(error) {
        console.log(error);
        deferred.reject();
    }


    module.createMediaDirs = function () {

        deferred = new $.Deferred();

        dirs = [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR];

        //persistent storage on iOS is the "Documents" folder in the app sandbox
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess, onIOSRFSError);

        return deferred.promise();

    };

    return module;

}(EC.File));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
        "use strict";

        /*
        * Delete media files from app private folder by project_name and in sequence images -> audios -> videos recursively
        *
        * Android: file://data/data/{package_name}/files
        *
        * -images
        * -audios
        * -videos
        *
        * /<project_name>
        *
        * @param {the_project_name} the project name to delete media from
        * @param {has_project_been_deleted} whether the project itself was deleted beforehand or not:
        *  we need to keep track of this as if the project is not deleted, we have to set the values of all the media rows to empty strings
        *
        *
        */
        //media dirs are declared outside deleteAllMedia because the fucntion is
        // called recursively
        var media_dirs;

        var deferred;

        module.deleteAllMedia = function(the_project_name, has_project_been_deleted, the_media_dirs) {

            var self = this;
            var project_name = the_project_name;
            var is_project_deleted = has_project_been_deleted;
            var media_dirs = the_media_dirs;
            var dir = media_dirs.shift();
            var app_private_dir_path;
            var project_id = window.parseInt(window.localStorage.project_id, 10);
            var hierarchy_forms = JSON.parse(window.localStorage.forms);

            if (!deferred) {
                deferred = new $.Deferred();
            }

            console.log("dir: " + EC.Const.ANDROID_APP_PRIVATE_URI + dir + project_name);

            var _onDirSuccess = function(the_dir) {

                var dir_entry = the_dir;

                console.log('dir_entry: ' + JSON.stringify(dir_entry));

                var _onDirDeleted = function() {
                    console.log("dir deleted, skip to next one if any");

                    if (media_dirs.length > 0) {

                        self.deleteAllMedia(project_name, is_project_deleted, media_dirs);

                    } else {
                        console.log("All media deleted");

                        //update database, set all media values to empty string
                        // for this project (if project not deleted)
                        if (!is_project_deleted) {
                            $.when(EC.Update.emptyMediaValues(hierarchy_forms, project_id)).then(function() {
                                //EC.Entries.allMediaDeletedFeedback(true);
                                deferred.resolve();

                            }, function(error) {
                                //EC.Entries.allMediaDeletedFeedback(false);
                                deferred.resolve();
                                console.log(error);
                            });
                        } else {
                            deferred.resolve();
                            deferred = null;
                        }

                    }

                };

                var _onDirDeleteError = function(the_error) {
                    console.log(JSON.stringify(the_error));
                };

                dir_entry.removeRecursively(_onDirDeleted, _onDirDeleteError);
            };

            var _onDirError = function(the_error) {

                //if the directory is not found (error code 1), no files yet so
                // skip to next media type
                if (the_error.code === 1) {

                    //skip to next folder if any
                    console.log("no dir " + dir + ", skip to next");

                    if (media_dirs.length > 0) {
                        self.deleteAllMedia(project_name, is_project_deleted, media_dirs);
                    } else {

                        console.log("All media deleted");

                        //update database, set all media values to empty string
                        // for this project (if project not deleted)
                        if (!is_project_deleted) {
                            $.when(EC.Update.emptyMediaValues(hierarchy_forms, project_id)).then(function() {
                                //EC.Entries.allMediaDeletedFeedback(true);
                                deferred.resolve();
                                deferred = null;
                            }, function() {
                                //EC.Entries.allMediaDeletedFeedback(false);
                                deferred.resolve();
                                deferred = null;
                            });
                        } else {
                            deferred.resolve();
                            deferred = null;
                        }

                    }
                }

                console.log(JSON.stringify(the_error));
            };

            //get app private data path based on platform
            switch(window.device.platform) {

                case EC.Const.ANDROID:
                    app_private_dir_path = EC.Const.ANDROID_APP_PRIVATE_URI;
                    break;
                case EC.Const.IOS:
                    app_private_dir_path = "file://" + EC.Const.IOS_APP_PRIVATE_URI;
                    break;
            }

            console.log(app_private_dir_path + dir + project_name);

            //get app private dir (Android) for the media of this project
            window.resolveLocalFileSystemURL(app_private_dir_path + dir + project_name, _onDirSuccess, _onDirError);

            return deferred.promise();

        };

        return module;
    }(EC.File));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    module.hasBackup = function (the_project_name) {

        var filename = the_project_name + '.txt';
        var backup_path;
        var forms_data = [];
        var deferred = new $.Deferred();

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, gotFSfail);

        function gotFS(the_fileSystem) {

            console.log(JSON.stringify(the_fileSystem));

            backup_path = the_fileSystem.root.fullPath;

            the_fileSystem.root.getFile(filename, {
                create: false,
                exclusive: false
            }, gotBackupSuccess, gotBackupFail);

        }

        function gotBackupSuccess() {
            deferred.resolve();
        }

        function gotBackupFail() {
            deferred.reject();
        }

        function gotFSfail(the_error) {
            console.log(the_error);
        }

        return deferred.promise();

    };

    return module;

}(EC.File));

/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /* IOS
     *
     * Move files from temporary (tmp) folder to persistent (Documents) folder
     *
     *
     * subfolders:
     * /images
     * /audios
     * /videos
     *
     * /<project_name>
     *
     *  @param {array} the_files - array of file objects like:
     * {
     *      type: <input type>,
     *      ref: <input ref>,
     *      cached: <file path on the filesystem for cached files>,
     *      stored: <file path on the filesystem for stored files>
     * }
     *
     * @return void, but it triggers a recursive call to itself after each file is
     * moved successfully.
     *
     * When all files are saved, it calls EC.Inputs.buildRows() to save all the input
     * fields related to this form and media to the db
     */

    var filenameToTimestamp;

    module.move = function (the_files, is_branch_flag) {

        //Get media directory based on the type of file
        function _getMediaDir(the_file_type) {

            var type = the_file_type;
            var dir;

            switch (type) {

                case EC.Const.PHOTO:
                    dir = EC.Const.PHOTO_DIR;
                    break;

                case EC.Const.AUDIO:
                    dir = EC.Const.AUDIO_DIR;
                    break;

                case EC.Const.VIDEO:
                    dir = EC.Const.VIDEO_DIR;
                    break;
            }

            return dir;

        }

        var files = the_files;
        var is_branch = is_branch_flag;

        //get details for current file
        var file = files.shift();

        //keep track of timestamp as Cordova iOS returns a weird filename which is always
        // the same per 'session'
        if (!filenameToTimestamp) {
            filenameToTimestamp = [];
        }

        console.log('files: ' + JSON.stringify(file));

        var cached_filepath = file.cached;
        var stored_filepath = file.stored;
        var parts;
        var filename;
        var filename_parts;
        var extension;
        var ref = file.ref;
        var destination = _getMediaDir(file.type);

        console.log();

        if (cached_filepath === '' || cached_filepath === undefined) {

            //we do not have a cached file to move, skip to next file (if any)
            if (files.length === 0) {

                //all files saved, build and save the rows
                if (is_branch) {
                    //save rows for branch form
                    EC.BranchInputs.buildRows();
                }
                else {
                    //save rows for main form
                    EC.Inputs.buildRows();
                }

            }
            else {

                EC.File.move(files, is_branch);

            }
        }
        else {

            console.log('cached filepath: ' + JSON.stringify(cached_filepath));

            //we have a cache file to move
            parts = cached_filepath.split('/');
            filename = parts[parts.length - 1];
            filename_parts = filename.split('.');
            extension = filename_parts[filename_parts.length - 1];

            //request temporary folder from file system
            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

        }

        console.log('stored filepath:' + stored_filepath);

        function gotFS(the_file_system) {

            //create a directory reader to read files inside the temporary folder
            var fs = the_file_system;
            var dir = fs.root.createReader();
            dir.readEntries(onDirReadSuccess, onDirReadError);

            function onDirReadSuccess(the_dir_entries) {

                var dir_entries = the_dir_entries;
                var i;
                var iLength = dir_entries.length;

                //loop all the files in the temporary directory to find the one we want to move
                for (i = 0; i < iLength; i++) {

                    console.log('dir_entries[i].name' + dir_entries[i].name);
                    console.log('filename' + filename);

                    //if the current file name matches the file name we want to save, move the file
                    if (dir_entries[i].name === filename) {

                        fs.root.getFile(dir_entries[i].name, {
                            create: false
                        }, processEntry, onFileError);
                    }
                }

                //process the file
                function processEntry(the_entry) {
                    console.log('processEntry called');

                    var file = the_entry;
                    var project_name = window.localStorage.project_name;
                    var form_name = window.localStorage.form_name;
                    var uuid = EC.Utils.getPhoneUUID();
                    var stored_filename;

                    //For photos, generate a timestamp as a file name (Cordova iOS always generates
                    // the same names when capturing photos)
                    var timestamp = parseInt(new Date().getTime() / 1000, 10);

                    //Create a new file or override existing one
                    if (stored_filepath === '') {

                        //build file name in the format <form_name>_<ref>_<uuid>_filename
                        stored_filename = form_name + '_' + ref + '_' + uuid + '_' + timestamp + '.' + extension;

                    }
                    else {

                        parts = stored_filepath.split('/');
                        stored_filename = parts[parts.length - 1];

                        console.log('stored_filename' + stored_filename);
                    }

                    //persistent storage on iOS is the 'Documents' folder in the app sandbox
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess, onIOSRFSError);

                    function onIOSRFSSuccess(the_fileSystem) {

                        console.log('onIOSRFSSuccess called');

                        var entry = the_fileSystem.root;
                        var project_dir = window.localStorage.project_name;

                        console.log('destination + project_dir ' + destination + project_dir);

                        //create a directory for this project if it does not exist (destination is the
                        // media folder: images, audios, videos)
                        entry.getDirectory(destination + project_dir, {
                            create: true,
                            exclusive: false
                        }, onGetIOSDirectorySuccess, onGetIOSDirectoryFail);

                        function onGetIOSDirectorySuccess(the_dir) {

                            file.moveTo(the_dir, stored_filename, onMovedOK, onMovedFail);

                            function onMovedOK(success) {

                                console.log('files length:' + files.length);
                                console.log(JSON.stringify(files));

                                //map file names to timestamp (for IOS Photos only)
                                filenameToTimestamp.push({
                                    filename: filename,
                                    timestamp: timestamp
                                });

                                //save next file or trigger callback to save the row
                                if (files.length === 0) {

                                    console.log('no more files to save, build rows');

                                    //all files saved, build and save the rows
                                    if (is_branch) {
                                        //save rows for branch form
                                        EC.BranchInputs.buildRows(filenameToTimestamp.slice(0));

                                    }
                                    else {
                                        //save rows for main form
                                        EC.Inputs.buildRows(filenameToTimestamp.slice(0));

                                    }

                                    filenameToTimestamp = null;

                                }
                                else {
                                    //save next file
                                    console.log('move another file');
                                    EC.File.move(files, is_branch);
                                }

                                console.log('file move OK : ' + JSON.stringify(success));
                            }

                            function onMovedFail(error) {
                                console.log('onMovedFail:' + JSON.stringify(error));
                            }

                        }

                        function onGetIOSDirectoryFail(error) {
                            console.log('Error creating directory ' + error.code);
                        }

                    }

                    function onIOSRFSError(error) {
                        console.log(error);
                    }
                }

            }//onDirReadSuccess

            function onDirReadError(error) {
                console.log('onDirReadError: ' + JSON.stringify(error));
            }//onDirReadError

            function onFileError(error) {
                console.log('onFileError ' + JSON.stringify(error));
            }//onFileError

        }//gotFS

        function fail(error) {
            console.log('fail' + JSON.stringify(error));
        }//fail

    };
    //moveFile

    return module;

}(EC.File));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {"use strict";

		/*
		 * Move the video file from sd card folder to app cache folder changing the file name to the current timestamp (video extension will be always .mp4)
		 */
		var video_path;
		var stored_filename;
		var cached_filename;
		var is_branch;
		var deferred;

		module.moveVideo = function(the_video_path, the_cache_video_uri, is_branch_flag) {

			deferred = new $.Deferred();

			video_path = the_video_path;

			is_branch = is_branch_flag;

			cached_filename = (the_cache_video_uri === "") ? EC.Utils.getTimestamp() + ".mp4" : the_cache_video_uri;

			function onLFSSuccess(the_video_file_entry) {

				function gotFS(the_file_system) {

					var fs = the_file_system;

					console.log(fs);

					//move file to fs.root(directory entry pointing to "tmp" folder)
					the_video_file_entry.moveTo(fs.root, cached_filename, function(success) {

						deferred.resolve(cached_filename);

					}, function(error) {
						console.log(error);
					});

				}

				function fail(error) {
					console.log(error);
				}

				//request temporary folder from file system
				window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);
			}

			function onLFSError(error) {
				console.log(error);
			}

			//get file entry resolving file full path (prepending "file://" as on IOS the full path is not an URI)
			window.resolveLocalFileSystemURL("file://" + video_path, onLFSSuccess, onLFSError);

			return deferred.promise();

		};

		return module;

	}(EC.File));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 */
var EC = EC || {};

/* Remove one or more files from a project recursively 
 *
 * @submodule File
 * @method remove
 * @param {string} the_project_name - the name of the project
 * @param {array} files - array of file names and media type like:
 *
 * {value: <the_filenemae>, type: <the_media_type>}
 *
 */
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		var project_name;
		var files = [];
		var self;
		var rows_deleted;
		var deferred;

		module.remove = function(the_project_name, the_files) {

			self = this;
			deferred = new $.Deferred();

			//get files details
			project_name = the_project_name;
			files = the_files;

			//remove 1 file at a time recursively
			_removeOneFile();

			return deferred.promise();

		};

		var _removeOneFile = function() {

			//get a single file
			var file = files.shift();
			var filename = file.value;
			var type = file.type;
			var dir;
			var full_path;

			//get directory the file is saved in based on its type (photo, audio, video)
			switch(type) {

				case EC.Const.PHOTO:
					dir = EC.Const.PHOTO_DIR;
					break;

				case EC.Const.AUDIO:
					dir = EC.Const.AUDIO_DIR;
					break;

				case EC.Const.VIDEO:
					dir = EC.Const.VIDEO_DIR;
					break;

			}

			//get full path to file based on platform
			switch(window.device.platform) {

				case EC.Const.ANDROID:
					full_path = EC.Const.ANDROID_APP_PRIVATE_URI + dir + project_name + "/" + filename;
					break;
				case EC.Const.IOS:
					
					//on iOS we need to prepend "file://" to get file object for deletion
					full_path = 'file://' + EC.Const.IOS_APP_PRIVATE_URI + dir + project_name + "/" + filename;
					break;
			}

			console.log("file full path: " + full_path);

			//get file entry
			window.resolveLocalFileSystemURL(full_path, _onGetFileSuccess, _onGetFileError);
		};

		var _onGetFileSuccess = function(the_file_entry) {

			var file_entry = the_file_entry;

			file_entry.remove(_onRemoveSuccess, _onRemoveError);
		};

		var _onGetFileError = function(the_error) {
			console.log("Error getting file: " + JSON.stringify(the_error));
		};

		var _onRemoveSuccess = function(the_entry) {

			console.log("File removed: " + JSON.stringify(the_entry));

			//delete next file (if any)
			if (files.length > 0) {
				//recursive call to remove next file
				_removeOneFile();
			}
			else {
				//All files removed
				EC.Notification.showToast(EC.Localise.getTranslation("all_media_deleted"), "short");
				deferred.resolve();
			}
		};

		var _onRemoveError = function(the_error) {
			console.log("Error: " + JSON.stringify(the_error));
			EC.Notification.showToast(EC.Localise.getTranslation("generic_error"), "short");
		};

		return module;

	}(EC.File));


/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem, FileReader*/

/**
 * @method restoreFromBackup Read a backup file and insert all the data to the
 * the local database
 *
 * @param {Object} the_project_name project name
 * @param {Object} the_project_id project id on local database
 */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		module.restoreFromBackup = function(the_project_name, the_project_id) {

			var filename = the_project_name + ".txt";
			var backup_path;
			var forms_data = [];
			var branch_data = {};
			var branch_form_names = [];
			var project_id = the_project_id;
			var deferred = new $.Deferred();

			function fail(the_error) {
				console.log(the_error);
				if (the_error.code === 1) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_backup_saved"));
				}
			}

			//get hold of backup file (must be in the public storage folder root (Android
			// only, not possible on iOS))
			function gotFS(the_fileSystem) {

				backup_path = the_fileSystem.root.fullPath;

				the_fileSystem.root.getFile(filename, {
					create : false,
					exclusive : false
				}, function(fileEntry) {

					//got the file entry
					fileEntry.file(function(file) {

						//read the file as text
						readAsText(file);
					}, fail);
				}, fail);

				//When we got the file, read content and save data to db
				function readAsText(file) {

					var reader = new FileReader();

					//When the file has been read write data to DB
					reader.onloadend = function(evt) {

						console.log("Read as text");
						console.log(evt.target.result);

						forms_data = JSON.parse(evt.target.result);
						console.log(forms_data);

						/* get branch data from last element of data array (if any).Branch entries are
						 * not nested within each hierarchy entry but appended at the end. They are
						 * mapped to the unique branch form name each branch input gets
						 *
						 */
						if (forms_data[forms_data.length - 1].has_branches === true) {
							branch_data = forms_data.pop();
						}

						//insert hierarchy entries per each form recursively
						$.when(EC.Create.insertAllFormsData(forms_data, branch_data)).then(function() {

							console.log("Hierarchy entries restored");

							//do we have any branches? - last element of forms_data array contains all the
							// branches
							if (branch_data.branch_data_rows.length > 0) {

								//get branches details
								branch_form_names = branch_data.branch_form_names;

								//get local branch form ids and branch inputs ids to map the backup branch data
								// against
								$.when(EC.Select.getBranchFormLocalIDs(project_id, branch_form_names)).then(function(the_mapped_branch_forms) {
									$.when(EC.Select.getBranchInputsLocalIDs(project_id)).then(function(the_mapped_input_ids) {

										console.log(the_mapped_branch_forms);
										console.log(the_mapped_input_ids);

										//insert all the branch backup data into the ec_branch_data table
										$.when(EC.Create.insertBranchDataRows(branch_data, the_mapped_branch_forms, the_mapped_input_ids)).then(function() {

											// console.log("Branches rows restored");
											deferred.resolve();
										});
									});
								});
							}
							else {
								deferred.resolve();
							}
						});
					};

					//read file as text
					reader.readAsText(file);
				}
			}

			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

			return deferred.promise();
		};

		return module;

	}(EC.File));

/*global $, jQuery, cordova, device, FileTransfer*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    var filename = '';
    var upload_URL = '';
    var project_name = '';
    var media_dir = '';
    var media_type = '';
    var _id = '';
    var self;
    var is_branch_file;

    module.uploadFile = function (the_file_row, the_media_dir) {

        console.log('the_filename: ' + the_file_row.value);

        var ft = new FileTransfer();
        var file_URI;
        var app_private_dir;
        var options = {};
        var uuid = EC.Utils.getPhoneUUID();
        var project_id = parseInt(window.localStorage.project_id, 10);

        var _doUpload = function () {

            project_name = window.localStorage.project_name;
            filename = the_file_row.value;
            _id = the_file_row._id;
            media_dir = the_media_dir;

            //add query parameters based on the type of file. URLs are set by
            // the server API
            switch (media_dir) {

                case EC.Const.PHOTO_DIR:
                    upload_URL += ('?type=thumbnail&phoneID=' + uuid);

                    console.log('Upload URL for thumbnail: ' + upload_URL);
                    media_type = EC.Const.PHOTO;

                    //branch or hierarchy?
                    if (EC.Upload.is_branch_image) {
                        is_branch_file = true;
                    }

                    break;

                case EC.Const.AUDIO_DIR:

                    upload_URL += ('?type=audio&phoneID=' + uuid);
                    media_type = EC.Const.AUDIO;

                    console.log('Upload URL for audio: ' + upload_URL);
                    //branch or hierarchy?
                    if (EC.Upload.is_branch_audio) {
                        is_branch_file = true;
                    }
                    break;

                case EC.Const.VIDEO_DIR:

                    upload_URL += ('?type=video&phoneID=' + uuid);
                    media_type = EC.Const.VIDEO;

                    console.log('Upload URL for video: ' + upload_URL);
                    if (EC.Upload.is_branch_video) {
                        is_branch_file = true;
                    }
                    break;
            }

            console.log('filename:' + JSON.stringify(filename));

            //get app private dir based on platform
            switch (window.device.platform) {
                case EC.Const.ANDROID:
                    app_private_dir = EC.Const.ANDROID_APP_PRIVATE_URI;
                    break;
                case EC.Const.IOS:
                    app_private_dir = EC.Const.IOS_APP_PRIVATE_URI;
                    break;
            }

            //set options for multipart entity file
            options.mimeType = '';
            options.fileKey = 'name';
            options.fileName = filename;

            if (window.device.platform === EC.Const.IOS) {
                //options.chunkedMode = false;
            }

            //build file full path
            file_URI = app_private_dir + media_dir + project_name + '/' + filename;

            console.log('file_URI: ' + JSON.stringify(file_URI));

            /*
             * in the future we might need this, to show a proper upload
             * feedback
             */
            ft.onprogress = function (progressEvent) {
                // if (progressEvent.lengthComputable) {
                // loadingStatus.setPercentage(progressEvent.loaded /
                // progressEvent.total);
                // } else {
                // loadingStatus.increment();
                // }
                //console.log(progressEvent);
                //console.log(loadingStatus);
            };

            //perform the upload
            ft.upload(file_URI, upload_URL, _onFileUploadSuccess, _onFileUploadError, options);
        };

        self = this;
        upload_URL = EC.Upload.getUploadURL();
        is_branch_file = false;

        //set upload URL for this project if not in localStorage yet
        if (!EC.Utils.isChrome() && !upload_URL) {
            $.when(EC.Select.getUploadURL(project_id)).then(function (the_project_url) {
                //enable upload data button
                console.log('Project URL is: ' + the_project_url);
                upload_URL = the_project_url;
                EC.Upload.setUploadURL(the_project_url);
                _doUpload();
            });
        }
        else {
            _doUpload();
        }

    };

    var _onFileUploadSuccess = function (response) {

        console.log(JSON.stringify(response));

        //update flag for this file row to indicate it has been synced to the
        // server
        $.when(EC.Update.flagOneFileAsSynced(_id, is_branch_file)).then(function () {

            //upload another file (if any) of the same media type
            EC.Upload.uploadNextFile(media_type);

        });

    };

    var _onFileUploadError = function (error) {

        console.log(JSON.stringify(error));

        EC.Notification.hideProgressDialog();
        EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('upload_error'));

        EC.Upload.handleMedia();
    };

    return module;

}(EC.File));

/* global cordova, Papa, JSZip */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    //currently Android only
    module.writeProjectDataAsCSV = function (the_project_name, the_data) {

        var deferred = new $.Deferred();
        var export_dir;
        var filename;
        var csv;
        var zip;
        var zip_content;
        var data = the_data;
        var project_name = the_project_name;

        function fail(error) {
            console.log(error);
        }

        function onGotFS(filesystem) {
            //filesystem is a handler to <sdcard>, emulated or real it does not matter

            //create app directory in externalstorage if it does not exist
            filesystem.getDirectory(export_dir, {
                create: true,
                exclusive: false
            }, onCreateDirSuccess, fail);

            function onCreateDirSuccess(filesystem) {

                console.log(filesystem.nativeURL);

                /*
                 inside this function, filesystem is:
                     Android:/storage/emulated/0/<app_name>-export/ (path can be different depending on device)

                     iOS : /var/mobile/Containers/Data/Application/<Bundle_ID>/Documents/<app_name>-export/

                 with <app_name> sanitised from special chars
                 */


                function gotFileEntry(fileEntry) {

                    function gotFileWriter(writer) {

                        writer.onwritestart = function () {
                        };

                        writer.onwriteend = function (evt) {
                            //file written successfully,
                            console.log('Content of file:' + zip_content);
                            deferred.resolve({
                                filename: filename,
                                folder: export_dir
                            });
                        };
                        //write content to file
                        writer.write(zip_content);
                    }

                    fileEntry.createWriter(gotFileWriter, fail);
                }

                filesystem.getFile(filename, {
                    create: true,
                    exclusive: false
                }, gotFileEntry, fail);
            }
        }

        //get export dir name before doing anything
        $.when(EC.Utils.getExportDirName()).then(function (the_dir) {

            var i;
            var iLength;
            console.log(the_dir);
            export_dir = the_dir;

            //JSZip API https://stuk.github.io/jszip/
            zip = new JSZip();

            //zip file name is the project name
            filename = project_name + '.zip';

            //loop each form
            iLength = data.length;

            //generate a csv file per each form
            for (i = 0; i < iLength; i++) {

                //parse JSON to CSV
                csv = Papa.unparse(data[i].entries, {
                    quotes: true,
                    delimiter: ',',
                    newline: '\r\n'
                });
                console.log(csv);

                //add file (use form name as filename) to master zip file
                zip.file(data[i].name + '.csv', csv);
            }

            //generate zip file containing all the forms
            zip_content = zip.generate({type: 'blob', compression: 'STORE'});

            //start writing zip file to disk
            if (window.device.platform === EC.Const.ANDROID) {
                //on Android, get hold of the public storage roor dir
                window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, onGotFS, fail);
            }
            else {
                //on iOS, get hold of 'Documents/' dir
                window.resolveLocalFileSystemURL(cordova.file.documentsDirectory, onGotFS, fail);
            }
        });

        return deferred.promise();

    };
    return module;
}(EC.File));

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    var project_id;
    var branch_form_name;
    var self;


    module.getInputAt = function (the_position) {

        var index = the_position - 1;
        self = this;

        return self.branch_inputs[index];
    };

    module.getPrimaryKeyRefPosition = function () {

        var i;
        var iLenght = self.branch_inputs.length;
        self = this;

        //look for the position of the primary key
        for (i = 0; i < iLenght; i++) {

            if (parseInt(self.branch_inputs[i].is_primary_key, 10) === 1) {

                return self.branch_inputs[i].position;
            }
        }
    };

    /**
     * get list of inputs for the branch form specified
     */
    module.getList = function (the_branch_form_name, the_project_id) {

        var branch_edit_position = window.localStorage.branch_edit_position;
        branch_form_name = the_branch_form_name;
        project_id = the_project_id;

        //get all the branch inputs for the branch form
        $.when(EC.Select.getBranchInputs(branch_form_name, project_id)).then(function (branch_inputs, has_jumps) {

            //set branch inputs in memory
            EC.BranchInputs.setInputs(branch_inputs, has_jumps);

            //render first input on the list or the selected position (-1) if we are editing
            EC.BranchInputs.prepareFirstInput((branch_edit_position === undefined) ? branch_inputs[0] : branch_inputs[branch_edit_position - 1]);
        });

    };

    module.setInputs = function (the_branch_inputs, the_has_jumps_flag) {

        self = this;
        self.branch_inputs = the_branch_inputs;
        window.localStorage.branch_inputs_total = self.branch_inputs.length;

        //set flag to indicate if this form has or not any jumps
        window.localStorage.branch_form_has_jumps = (the_has_jumps_flag) ? 1 : 0;

    };

    module.getInputs = function () {
        return this.branch_inputs;
    };

    module.getFormDetails = function (the_input, the_value, the_project_id) {
        EC.Select.getBranchFormDetails(the_input, the_value, the_project_id);
    };

    module.setCachedBranchEntryKeys = function (the_branch_form_name, the_primary_keys) {

        var primary_keys = the_primary_keys;
        var branch_form_name = the_branch_form_name;
        var all_branches_keys;
        var current_branch_form_primary_keys;
        var is_branch_form_cached = false;
        var i;
        var iLength;

        //try to get branch_primary_keys object if it exists in LocalStorage
        try {
            all_branches_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);
        } catch (error) {

            all_branches_keys = [];
        }

        iLength = all_branches_keys.length;

        if (iLength > 0) {

            //get cached primary keys for this branch form only
            for (i = 0; i < iLength; i++) {

                if (all_branches_keys[i].branch_form_name === branch_form_name) {

                    is_branch_form_cached = true;

                    current_branch_form_primary_keys = all_branches_keys[i].primary_keys;

                    //add branch_primary keys to keys already in LocalStorage
                    current_branch_form_primary_keys = current_branch_form_primary_keys.concat(primary_keys).unique();

                    all_branches_keys[i].primary_keys = current_branch_form_primary_keys;

                    window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);
                }

            }

            //if the current branch form is not found in the cache, then add it
            if (!is_branch_form_cached) {

                //current branch form  not cached yet, add it to cached_branch_entry_keys global object
                all_branches_keys.push({
                    branch_form_name: branch_form_name,
                    primary_keys: primary_keys
                });

                window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);

            }

        } else {

            //window.localStorage.cached_branch_entry_keys is empty so this is the first branch form for this main form, add it straight away
            all_branches_keys.push({
                branch_form_name: branch_form_name,
                primary_keys: primary_keys
            });

            window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);

        }

    };

    module.getCachedBranchEntryKeys = function (the_branch_form_name) {

        var branch_form_name = the_branch_form_name;
        var all_branches_keys;
        var i;
        var iLength;
        var test;

        try {

            all_branches_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

        } catch (error) {

            all_branches_keys = [];
        }

        iLength = all_branches_keys.length;

        if (iLength > 0) {

            for (i = 0; i < iLength; i++) {

                if (all_branches_keys[i].branch_form_name === branch_form_name) {

                    test = all_branches_keys[i].primary_keys;

                    console.log(test, true);

                    return all_branches_keys[i].primary_keys;
                }

            }

        } else {

            return [];
        }

    };

    module.getJumpDestinationPosition = function (the_ref) {

        var i;
        var iLenght = this.branch_inputs.length;
        var ref = the_ref;

        //look for the position of the specified ref
        for (i = 0; i < iLenght; i++) {
            if (ref === this.branch_inputs[i].ref) {
                return this.branch_inputs[i].position;
            }
        }
    };

    return module;

}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *	@module EC
    @submodule BranchInputs
 *
 * Route back user from a branch form to the linked hierararchy form, clearing cached branch data
 * 
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.backToHierarchyForm = function() {

			var inputs;
			var current_input;
			var current_input_position;
			var page;

			inputs = JSON.parse(window.localStorage.inputs);
			current_input_position = parseInt(window.localStorage.current_position, 10);
			current_input = inputs[current_input_position - 1];

			//clear branch data cache
			window.localStorage.removeItem("branch_current_position");
			window.localStorage.removeItem("branch_form_has_jumps");
			window.localStorage.removeItem("branch_form_name");
			window.localStorage.removeItem("branch_inputs_total");
			window.localStorage.removeItem("branch_inputs_trail");
			window.localStorage.removeItem("branch_inputs_values");
			window.localStorage.removeItem("branch_form_id");
			window.localStorage.removeItem("branch_edit_hash");
			window.localStorage.removeItem("branch_edit_key_value");
			window.localStorage.removeItem("branch_edit_type");

			window.localStorage.back_from_branch = 1;

			page = EC.Const.INPUT_VIEWS_DIR + current_input.type + EC.Const.HTML_FILE_EXT;

			//EC.Inputs.renderInput(current_input);
			EC.Routing.changePage(page);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method bindBackBtn set back button label to go back from branch form to linked hierarchy form
 */

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.bindBackBtn = function(is_data_saved) {

			var self = this;
			var back_btn = $("div[data-role='header'] div[data-href='back-btn']");
			var back_btn_label = back_btn.find("span.main-form-name");
			var form_name = window.localStorage.form_name;

			//set back button label to go back to main form
			back_btn_label.text("Back to " + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

			back_btn.off().one('vclick', function(evt) {

				if (is_data_saved) {
					//go back to main form input
					self.backToHierarchyForm();
				} else {
					//id data are not saved, ask confirmation to user before proceeding
					EC.Notification.askConfirm(EC.Localise.getTranslation("exit"), EC.Localise.getTranslation("exit_confirm"), "EC.BranchInputs.backToHierarchyForm");
				}
			});
		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		var self;
		var branch_current_position;
		var is_jump_found;
		
		/*
		 * @function _checkJumps check if there is any jump to perform based on the input value and jumps mapped to that input
		 */
		var _checkJumps = function(the_jumps, the_current_value) {

			var jumps = the_jumps;
			var i;
			var iLength = jumps.length;
			var branch_destination_position;
			var branch_destination;
			var current_value = the_current_value;
			var branch_inputs_total = window.localStorage.branch_inputs_total;

			//if not any jump conditions match, set destination to the next input as default
			branch_destination_position = branch_current_position + 1;

			for ( i = 0; i < iLength; i++) {

				//check if we jump always
				if (jumps[i].jump_when === EC.Const.JUMP_ALWAYS) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				//check if we jump whan a value is not selected
				if (jumps[i].jump_when === EC.Const.JUMP_FIELD_IS_BLANK && (current_value === null || current_value === EC.Const.NO_OPTION_SELECTED)) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS && current_value.toString() === jumps[i].jump_value.toString()) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS_NOT && current_value.toString() !== jumps[i].jump_value.toString()) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

			}

			//override current_input_position with the position of the input set by the jump (-1 because we are adding +1 later)
			branch_current_position = branch_destination_position - 1;
			
			return branch_destination;
		};
		
		/*
		 * @method gotoNextPage load next input into view, checking for jumps etc.
		 */
		module.gotoNextPage = function(evt, the_current_value) {

			var branch_current_input;
			var current_value = the_current_value;
			var next_branch_input;
			var next_page;
			var options;
			var i;
			var iLength;
			var obj;
			var branch_destination;
			var branch_destination_position;
			var jumps;
			var is_branch_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var next_branch_value;
			var is_checkbox = false;
			
			self = this;
			branch_current_position = parseInt(window.localStorage.branch_current_position, 10);
			
			//get value from object in the case of a dropdown/radio (object is like {label:"<label>", index:"<value>"})
			if (current_value.hasOwnProperty("value")) {
				current_value = current_value.value;
			}
			
			//if current value is an array, we have checkbox values to parse and check each of them against jumps
			if (Array.isArray(current_value)) {
				is_checkbox = true;
			}

			//check if we have reached the end of the form
			if (branch_current_position === self.branch_inputs.length) {
				next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;
			} else {

				//check if the current input triggers a jump
				branch_current_input = self.getInputAt(branch_current_position);

				if (parseInt(branch_current_input.has_jump, 10) === 1) {

					//get jumps
					jumps = EC.Utils.parseJumpString(branch_current_input.jumps);

					//if we have an arry of values (checkboxes) check each of them if it triggers a jump
					if (is_checkbox) {

						is_jump_found = false;
						iLength = current_value.length;

						//loop each selected value until the first jump is found (or no more elements to check against)
						for ( i = 0; i < iLength; i++) {

							branch_destination = _checkJumps(jumps, current_value[i].value);
							if (is_jump_found) {
								break;
							}
						}

					} else {
						//single value
						branch_destination = _checkJumps(jumps, current_value);
					}

				}//if has jump

				if (branch_destination === EC.Const.END_OF_FORM) {
					next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;
				} else {

					next_branch_input = self.getInputAt(branch_current_position + 1);

					/*
					 * if is_genkey_hidden = 1, the from creator decided to hide the auto genkey
					 * The nasty form builder allows users to drag the primary key input fields to any position (lol)
					 * therefore we have to test each input if it is a primary key field
					 * We have to skip the next input (from the user) but add an entry to inputs_values, inputs_trail with the UUID
					 *
					 */

					if (is_branch_genkey_hidden && next_branch_input.is_primary_key === 1) {

						//add skipped genkey entry also in inputs_trail
						self.pushInputsTrail(next_branch_input);

						//add an entry with UUID to inputs_values if we are entering a new entry
						next_branch_value = EC.Utils.getGenKey();

						//cache next value in localStorage
						self.setCachedInputValue(next_branch_value, branch_current_position + 1, next_branch_input.type, next_branch_input.is_primary_key);

						//go to the next  input AFTER the hidden primary key (if it exists, otherwise the save confirm page)
						next_branch_input = self.getInputAt(branch_current_position + 2);
						if (!next_branch_input) {

							next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;

							//TODO check this???
						}

						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.branch_current_position = branch_current_position + 2;

					} else {
						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.branch_current_position = branch_current_position + 1;
					}

					if (next_branch_input) {
						next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + next_branch_input.type + EC.Const.HTML_FILE_EXT;
					}

				}

			}

			EC.Routing.changePage(next_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};
		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.gotoPrevPage = function(evt) {

			var self = this;
			var branch_current_position = parseInt(window.localStorage.branch_current_position, 10);
			var branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);
			var prev_page;
			var prev_input_position = branch_inputs_trail[branch_inputs_trail.length - 1].position;
			var prev_input = self.getInputAt(prev_input_position);
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			//skip prev input (from user) if it is a hidden auto genkey
			if (is_genkey_hidden && prev_input.is_primary_key === 1) {

				prev_input_position = branch_inputs_trail[branch_inputs_trail.length - 2].position;
				prev_input = self.getInputAt(prev_input_position);

				//update current input position in session (store confirm screen will get a position = array.length)
				window.localStorage.branch_current_position = branch_current_position - 2;

				//remove last  entry from branch_inputs_trail
				self.popInputsTrail();

			} else {

				//update current input position in session
				window.localStorage.branch_current_position = prev_input_position;

			}

			//remove last  entry from branch_inputs_trail
			self.popInputsTrail();

			prev_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + prev_input.type + EC.Const.HTML_FILE_EXT;

			EC.Routing.changePage(prev_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *@module EC
 *@submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {
		"use strict";

		module.onNextBtnTapped = function(e, the_input) {

			var self = this;
			var wls = window.localStorage;
			var branch_input = the_input;
			var branch_edit_id = wls.branch_edit_id || "";
			var branch_edit_type = wls.branch_edit_type || "";
			var branch_form = JSON.parse(wls.branch_form);
			//get input value(based on input type and layout)
			var current_value = EC.BranchInputs.getCurrentValue(branch_input.type);
			var branch_current_position = wls.branch_current_position;
			var branch_cached_value = EC.Inputs.getCachedInputValue(branch_current_position);
			var validation = self.validateValue(branch_input, current_value, branch_current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				//warn user about the type of error
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));
				return;
			}

			//When editing, if the value of a field triggering a jump was changed, disable
			// intermediate "Store Edit" button from now on
			if (wls.branch_edit_mode && parseInt(branch_input.has_jump, 10) === 1) {
				if (!EC.Inputs.valuesMatch(branch_cached_value, current_value, branch_input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate
					// screen is disabled
					wls.branch_has_new_jump_sequence = 1;
				}
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, branch_current_position, branch_input.type, branch_input.is_primary_key);

			self.pushInputsTrail(branch_input);

			//remove flag that helps to handle back button when user is just dismissing
			// barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoNextPage(e, current_value);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.onPrevBtnTapped = function(e, the_input) {

			var self = this;
			var branch_input = the_input;
			var branch_inputs_total = self.branch_inputs.length;
			var branch_current_value = self.getCurrentValue(branch_input.type);
			var branch_current_position = window.localStorage.branch_current_position;
			var branch_cached_value = EC.Inputs.getCachedInputValue(branch_current_position);

			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (window.localStorage.branch_edit_mode && parseInt(branch_input.has_jump, 10) === 1) {
				if (!EC.Inputs.valuesMatch(branch_cached_value, branch_current_value, branch_input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					window.localStorage.branch_has_new_jump_sequence = 1;
				}
			}

			//check we are not coming back from #save-confirm page
			if (branch_current_position <= self.branch_inputs.length) {

				//cache current value in localStorage
				self.setCachedInputValue(branch_current_value, branch_current_position, branch_input.type, branch_input.primary_key);
			}
			
			//remove flag that helps to handle back button when user is just dismissing barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoPrevPage(e);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.popInputsTrail = function() {

			var branch_inputs_trail;

			try {

				branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);

				branch_inputs_trail.pop();

				window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

			} catch(error) {
			}

		};
		//popInputsTrail

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
    @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.pushInputsTrail = function(the_input) {

			var input = the_input;

			var branch_inputs_trail;

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);

			} catch(error) {

				//Handle errors here
				branch_inputs_trail = [];

			}

			branch_inputs_trail.push({
				position : input.position,
				label : input.label

			});

			window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
    @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.spliceInputsTrail = function(the_position) {

			var position = parseInt(the_position, 10);
			var branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);
			var i;
			var iLength = branch_inputs_trail.length;
			var index;
			var how_many_to_remove;

			for ( i = 0; i < iLength; i++) {

				if (branch_inputs_trail[i].position === position) {

					index = i;
					break;
				}

			}

			how_many_to_remove = iLength - index;
			branch_inputs_trail.splice(index, how_many_to_remove);
			window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareFeedback = function(the_status, the_entry_key) {

			var self = this;
			var status = the_status;
			var page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_FEEDBACK_VIEW;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var entry_key = the_entry_key;

			//prepare feedback based on status
			if (status) {
				self.message = "Branch entry saved successfully!";

				/*
				 * Cache entry key value for the branch form entry just saved. If the main form does not get saved (user leaves without saving)
				 * we have to remove from the DB all the rows with that entry key value. This will work no matter how many branch forms we have
				 * for a main (hierarchy) form. This array is cleared when either the form is saved or all its cached entries are deleted.
				 */
				self.setCachedBranchEntryKeys(branch_form.name, [entry_key]);

			} else {
				self.message = "Error saving data...please retry";
			}

			EC.Routing.changePage(page);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *	@module EC
 @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareFirstInput = function(the_first_input) {

			var self = this;
			var first_input_position = 1;
			var branch_input = the_first_input;
			var page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + branch_input.type + EC.Const.HTML_FILE_EXT;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			//set array to keep track of input navigation (get pre-built one when editing)
			if (!window.localStorage.branch_edit_mode) {
				window.localStorage.branch_inputs_trail = [];
			} else {
				//update inputs trail to remove all the elements past the current edit position
				self.spliceInputsTrail(window.localStorage.branch_edit_position);
			}

			//update current position in session depending on mode
			window.localStorage.branch_current_position = (window.localStorage.branch_edit_mode) ? window.localStorage.branch_edit_position : first_input_position;

			/*
			 * If if the genkey hidden flag is set to 1 and the input is a primary key input, do not render this input on screen but:
			 *
			 * - just cache it with an auto genkey in localStorage if we are entering a new entry
			 * - do nothing if we are editing, ad the inputs_values array will be set already (it is set when listing the entry values)
			 */
			if (is_genkey_hidden === 1 && branch_input.is_primary_key === 1) {

				//skip input
				window.localStorage.branch_current_position = first_input_position + 1;

				//if we are entering a new entry add an auto generated key in input_values
				if (!window.localStorage.branch_edit_mode) {
					window.localStorage.branch_inputs_values = JSON.stringify([{
						_id : "",
						type : "",
						value : EC.Utils.getGenKey(),
						position : 1,
						is_primary_key : 1
					}]);
				}
				//get next input to set page we have to go to (first_input_position is equal to current_position-1, so...)
				branch_input = self.branch_inputs[first_input_position];
				page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + branch_input.type + EC.Const.HTML_FILE_EXT;
			}

			EC.Routing.changePage(page);
		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderFeedbackView = function() {

			var self = this;
			var form_id = window.localStorage.form_id;
			var form_name = window.localStorage.form_name;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var add_another_entry_btn = $('div#branch-feedback div#branch-input-feedback div#add-entry-branch-form');
			var back_to_main_btn = $('div#branch-feedback div#branch-input-feedback div#back-to-main-form');
			var project_id = window.localStorage.project_id;
			var current_form_branches;

			//handle back button with no alert on this page
			self.bindBackBtn(true);

			//remove branch flags from localStorage
			window.localStorage.removeItem("branch_current_position");
			window.localStorage.removeItem("branch_edit_id");
			window.localStorage.removeItem("branch_edit_mode");
			window.localStorage.removeItem("branch_edit_position");
			window.localStorage.removeItem("branch_inputs_trail");
			window.localStorage.removeItem("branch_inputs_values");

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//Set text for buttons
			add_another_entry_btn.find('span.entry').text("(" + branch_form.name + ")");
			back_to_main_btn.find('span.form-name-inline').text(form_name);

			//bind button to add another branch form to this entry
			add_another_entry_btn.off().one('vclick', function(e) {

				EC.Notification.showProgressDialog();
				//get list of inputs for the branch form and render the first one on screen
				self.getList(branch_form.name, project_id);
			});

			//bind button to go back to main form input
			back_to_main_btn.off().one('vclick', function(e) {
				//go back to main form input
				self.backToHierarchyForm();
			});
			EC.Notification.hideProgressDialog();
		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *	@module EC
 @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		//render input calling the proper page and passing input attributes
		module.renderInput = function(the_input) {

			//get module context
			var self = this;
			var wls = window.localStorage;
			var branch_input = the_input;
			var branch_current_value;
			var branch_current_position = parseInt(wls.branch_current_position, 10);
			var branch_cached_value = self.getCachedInputValue(branch_current_position);
			var back_btn = $("div#branch-" + branch_input.type + " div[data-role='header'] div[data-href='back-btn']");
			var back_btn_label = $("div[data-role='header'] div[data-href='back-btn'] span.form-name");
			var parent_key;
			var rows_to_save = [];
			var prev_btn = $('div.branch-input-nav-tabs div.ui-block-a.input-prev-btn');
			var next_btn = $('div.branch-input-nav-tabs div.ui-block-c.input-next-btn');
			var form_name = wls.form_name;
			var branch_inputs_total = self.branch_inputs.length;
			var branch_form = JSON.parse(wls.branch_form);
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var branch_inputs_values;
			var first_branch_input;
			var is_prev_button_hidden = false;

			back_btn.off().on('vclick', function(e) {

				//TODO: when editing an existing branch form, go back to entry values list?

				if (wls.branch_edit_mode) {
					if (wls.branch_has_new_jump_sequence) {
						EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToHierarchyForm", false, branch_input, true);

					} else {

						//check if user is leaving after modifying a jump and neither "Store Edit", "prev" or "next" button were tapped
						if (parseInt(branch_input.has_jump, 10) === 1) {

							branch_current_value = EC.Inputs.getCurrentValue(branch_input.type);

							if (!EC.Inputs.valuesMatch(branch_cached_value, branch_current_value, branch_input.type)) {

								EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToHierarchyForm", false, branch_input, true);
							} else {

								EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
							}
						} else {
							EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
						}
					}
				} else {
					//not editing, go to entries list
					EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
				}

			});

			back_btn_label.text("Back to " + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//reset button visibility
			$(prev_btn, next_btn).removeClass("invisible");

			//TODO :doe we need to -> skip input rendering if it is the preloader screen
			if (branch_current_position !== 0) {

				//check if we have a cached value for this input in session
				branch_current_value = self.getCachedInputValue(branch_current_position).value;

				//check it the value is _skipp3d_ keyword
				branch_current_value = (branch_current_value === EC.Const.SKIPPED) ? "" : branch_current_value;

				//if the input is either photo, audio or video, no default value will be available so we pass an empty object {cached: "", stored: ""}
				if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.AUDIO || branch_input.type === EC.Const.VIDEO) {

					if (branch_current_value) {
						self.renderInputView(branch_input, branch_current_value);
					} else {
						self.renderInputView(branch_input, {
							cached : "",
							stored : ""
						});
					}

				} else {

					//for normal inputs, render view passing the default value (or empty if not defined) if no input value is cached
					if (branch_current_value) {
						self.renderInputView(branch_input, branch_current_value);
					} else {
						self.renderInputView(branch_input, branch_input.default_value);
					}
				}
			}

			//set next button to go to next input (if any)
			if (branch_current_position <= branch_inputs_total) {

				//Next button handler
				next_btn.off().on('vclick', function(e) {
					self.onNextBtnTapped(e, branch_input);
				});

				//set previous button to fade to previous input (if any)
				if (branch_current_position - 1 > 0) {

					//check if the first input is a hidden genkey, in that case do not show prev button
					if (branch_current_position === 2) {

						branch_inputs_values = JSON.parse(wls.branch_inputs_values);
						first_branch_input = branch_inputs_values[0];

						if (first_branch_input.is_primary_key === 1 && is_genkey_hidden === 1) {

							//hide prev button for first input of the form
							prev_btn.addClass("invisible");
							is_prev_button_hidden = true;

						}

					}

					//bind vclick event only if the button is not hidden
					if (!is_prev_button_hidden) {
						//handler for prev button, showing prev input
						prev_btn.off().on('vclick', function(e) {
							self.onPrevBtnTapped(e, branch_input);
						});
					}

				} else {

					//hide prev button for first input of the form
					prev_btn.addClass("invisible");

					//reset inputs_trail in session
					wls.removeItem('branch_inputs_trail');
				}

				//show store edit button if we are in "editing mode" and bind it to callback
				if (wls.branch_edit_mode) {

					$('div.store-edit').removeClass('hidden');

					if (branch_input.has_jump === 1) {

						// disable store edit button, to force the user to go through the form again to retain the jumps sequence
						$('div.store-edit').addClass('ui-disabled');

					} else {

						$('div.store-edit').removeClass('ui-disabled');

					}

					//bind events with on(), as we need to submit again if the input does not validate successfully
					$('div.store-edit').off().on('vclick', function() {

						self.prepareStoreEdit(branch_current_value, branch_current_position, branch_input);

					});

				}

			}

			//update completion percentage and bar for this form
			self.updateFormCompletion(branch_current_position, branch_inputs_total);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderInputView = function(the_branch_input, the_value) {

			var branch_input = the_branch_input;
			var branch_value = the_value;

			//render layout based on the input type
			switch(branch_input.type) {

				case EC.Const.TEXT:

					EC.BranchInputTypes.text(branch_value, branch_input);
					break;

				case EC.Const.TEXTAREA:

					EC.BranchInputTypes.textarea(branch_value, branch_input);
					break;

				case EC.Const.INTEGER:

					EC.BranchInputTypes.integer(branch_value, branch_input);
					break;

				case EC.Const.DECIMAL:

					EC.BranchInputTypes.decimal(branch_value, branch_input);
					break;

				case EC.Const.DATE:

					EC.BranchInputTypes.date(branch_value, branch_input);
					break;

				case EC.Const.TIME:

					EC.BranchInputTypes.time(branch_value, branch_input);
					break;

				case EC.Const.RADIO:

					EC.BranchInputTypes.radio(branch_value, branch_input);
					break;

				case EC.Const.CHECKBOX:

					EC.BranchInputTypes.checkbox(branch_value, branch_input);
					break;

				case EC.Const.DROPDOWN:

					EC.BranchInputTypes.dropdown(branch_value, branch_input);
					break;

				case EC.Const.BARCODE:

					EC.BranchInputTypes.barcode(branch_value, branch_input);
					break;

				case EC.Const.LOCATION:

					EC.BranchInputTypes.location(branch_value, branch_input);
					break;

				case EC.Const.PHOTO:

					EC.BranchInputTypes.photo(branch_value, branch_input);
					break;

				//deal with audio recording
				case EC.Const.AUDIO:

					EC.BranchInputTypes.audio(branch_value, branch_input);
					break;

				case EC.Const.VIDEO:

					EC.BranchInputTypes.video(branch_value, branch_input);
					break;

			}//switch

			//remove progress dialog (triggered when loading inputs.html)
			EC.Notification.hideProgressDialog();

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderSaveConfirmView = function() {

			var self = this;
			var prev_btn = $('div#branch-save-confirm div.ui-grid-b div.ui-block-a.input-prev-btn');
			var store_btn = $('div#branch-save-confirm div#branch-input-save-confirm div#store');
			var store_edit_btn = $('div#branch-save-confirm div.store-edit');
			var percentage_bar = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
			var percentage_txt = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar span.form-completion-percent');
			var branch_inputs_total = self.branch_inputs.length;
			var current_branch_input_position = parseInt(window.localStorage.branch_current_position, 10);
			var branch_form = JSON.parse(window.localStorage.branch_form);

			self.bindBackBtn(false);

			//update completion percentage and bar for this form
			self.updateFormCompletion(branch_inputs_total + 1, branch_inputs_total, percentage_txt, percentage_bar);

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//reset back button visibility
			prev_btn.removeClass("invisible");

			//handler for prev button, showing prev input
			prev_btn.off().on('vclick', function(e) {
				self.gotoPrevPage(e);
			});

			//show "store" or "store edit" button based on where we are editing or adding a new entry
			if (window.localStorage.branch_edit_mode) {

				store_btn.hide();

				//enable store edit button (if the form has jumps it got disabled) and show it
				store_edit_btn.removeClass('ui-disabled hidden');

				//bind event with one() to enforce a single submit
				store_edit_btn.off().one('vclick', function(e) {
					self.onStoreValues();
				});

			} else {

				store_btn.show();

				//hide store edit button
				$('div.store-edit').addClass('hidden');

				//bind event with one() to enforce a single submit
				store_btn.off().one('vclick', function(e) {
					self.onStoreValues();
				});
				
			}
			
			//update completion percentage and bar for this branch form
			self.updateFormCompletion(branch_inputs_total + 1, branch_inputs_total);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderStoreEditFeedback = function(is_positive) {

			//EC.Notification.hideProgressDialog();

			if (is_positive) {

				EC.Notification.showToast(EC.Localise.getTranslation("edit_saved"), "short");

				//remove flag that disable store edit from an intermediate screen
				window.localStorage.removeItem("branch_has_new_jump_sequence");

				//open branch entries list page
				EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
			}
		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.updateFormCompletion = function(the_position, the_length) {

			var ratio = Math.ceil(100 * (the_position - 1) / the_length);
			var percentage_bar = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
			var percentage_txt = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar span.form-completion-percent');

			percentage_txt.text(ratio + "%");
			percentage_bar.css("width", ratio + "%");

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.amendSkippedValues = function() {

			var self = this;
			var wls = window.localStorage;
			var i;
			var j;
			var iLength;
			var jLength;
			var max_skipped_position;
			var branch_inputs_trail = [];
			var branch_inputs_values = [];
			var is_found;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			branch_inputs_trail = JSON.parse(wls.branch_inputs_trail);
			branch_inputs_values = JSON.parse(wls.branch_inputs_values);

			iLength = branch_inputs_values.length;
			jLength = branch_inputs_trail.length;

			max_skipped_position = branch_inputs_trail[branch_inputs_trail.length - 1].position;

			for ( i = 0; i < iLength; i++) {//for each input in inputs_values

				is_found = false;

				//jumps can generate null values in the input_values array (when entering a new entry)
				if (branch_inputs_values[i] === null) {
					is_found = true;
				} else {

					for ( j = 0; j < jLength; j++) {//for each input in inputs_trail
						//check if the branch input values is in the branch input trail array OR the input value is a hidden primary key value. In both case, the value needs to be saved

						if (parseInt(branch_inputs_values[i].position, 10) === branch_inputs_trail[j].position || (is_genkey_hidden === 1 && parseInt(branch_inputs_values[i].is_primary_key, 10) === 1 )) {

							is_found = true;
							break;
						}

					}// for each inputs_trail
				}

				//not found values (and null values)
				// TODO: why was I also checking for inputs_values[i].position < max_skipped_position???
				if (!is_found) {
					branch_inputs_values[i].value = EC.Const.SKIPPED;
				}

			}//for each inputs_values

			//store the amended values in localStorage for saving
			wls.branch_inputs_values = JSON.stringify(branch_inputs_values);

		};

		return module;

	}(EC.BranchInputs));

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    module.buildRows = function (the_filenameToTimestamp) {

        var self = this;
        var i;
        var branch_input;
        var value_obj;
        var value;
        var _id;
        var ref;
        var rows = [];
        var iLength = EC.BranchInputs.branch_inputs.length;
        var key_position = EC.BranchInputs.getPrimaryKeyRefPosition();
        var hierarchy_key_position = EC.Inputs.getPrimaryKeyRefPosition();
        var parts;
        var filename;
        var filename_parts;
        var extension;
        var form_name = window.localStorage.form_name;
        var uuid = EC.Utils.getPhoneUUID();
        var form_id = window.localStorage.form_id;
        var created_on = EC.Utils.getTimestamp();
        var branch_form_name = window.localStorage.branch_form_name;
        var ios_filenames = the_filenameToTimestamp;
        var timestamp;

        //get parent key value for the current branch form
        var current_branch_input_position = parseInt(window.localStorage.branch_current_position, 10);

        //get value of primary key for this branchform
        var key_value = EC.BranchInputs.getCachedInputValue(key_position).value;

        /* Get key and value of primary key for the hierarchy entry of this branch form.
         * The hierarchy key value is the one cached, if the user edits it before saving the entry, it will need to be updated in the database
         * or lock the editing after inserting a branch form.
         */
        var hierarchy_entry_key_value = EC.Inputs.getCachedInputValue(hierarchy_key_position).value;
        var hierarchy_entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

        //build rows to be saved - the text value for each input is saved in an array with corresponding indexes
        for (i = 0; i < iLength; i++) {

            //get current value
            branch_input = EC.BranchInputs.branch_inputs[i];
            value_obj = EC.BranchInputs.getCachedInputValue(branch_input.position);

            //save cached value OR '' when the value cannot be found
            value = value_obj.value || '';

            //_id is set only when we are editing, it is the _id of the current row in the database which will be updated
            _id = value_obj._id;

            //deal with media types to save the correct value (full path uri)
            if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.VIDEO || branch_input.type === EC.Const.AUDIO) {

                //check whether the value is defined as media value {stored: '<path>', cached: '<path>'}
                if (value.hasOwnProperty('stored')) {

                    if (value.stored === '') {

                        //we are saving a new media file path from the cached one (or an empty string if the file field was optional)
                        if (value.cached !== '') {

                            //build file name (in the format <form_name>_<ref>_<uuid>_filename) with the cached value
                            //Cordova Camera API unfortunately returns the timestamp as a file name on Android only, on iOS a smart guy decided to use the same file name with an incremental index (lol)

                            parts = value.cached.split('/');
                            filename = parts[parts.length - 1];

                            switch (window.device.platform) {

                                case EC.Const.ANDROID:
                                    //do nothing
                                    break;
                                case EC.Const.IOS:

                                    //replace filename with <timestamp>.jpg as on IOS the Camera, Audio and Video capture is inconsistent and returns weird file names
                                    //not always the timestamp. We want to save the files using the timestamp as we do on Android (and following Epicollect+ filename schema)
                                    if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.AUDIO || branch_input.type === EC.Const.VIDEO) {

                                        //get linked timestamp as we save the file using the timestamp as the file name
                                        filename_parts = filename.split('.');
                                        extension = filename_parts[filename_parts.length - 1];

                                        timestamp = EC.Utils.getIOSFilename(ios_filenames, filename);
                                        filename = timestamp + '.' + extension;
                                    }

                                    break;

                            }

                            value = form_name + '_' + branch_input.ref + '_' + uuid + '_' + filename;
                        } else {

                            value = '';
                        }

                    } else {

                        //use the existing stored path
                        value = value.stored;
                    }

                } else {
                    //value was not defined as media value: use case when user leaves a form halfway through but still wants to save. Save an empty object then
                    value = '';
                }
            }

            rows.push({
                _id: _id, //this is set only when we are editing
                input_id: branch_input._id,
                form_id: branch_input.form_id,
                position: branch_input.position,
                hierarchy_entry_key_value: hierarchy_entry_key_value,
                hierarchy_entry_key_ref: hierarchy_entry_key_ref,
                label: branch_input.label,
                value: value,
                ref: branch_input.ref,
                is_title: branch_input.is_title,
                entry_key: key_value,
                type: branch_input.type,
                is_data_synced: 0,
                is_media_synced: 0,
                is_remote: 0,
                created_on: created_on
            });

        }//for each input

        //EC.Notification.showProgressDialog();

        console.log('rows');
        console.log(JSON.stringify(rows));

        //save/update values to database
        if (window.localStorage.branch_edit_mode) {

            $.when(EC.Update.commitBranchForm(rows)).then(function () {

                window.localStorage.branch_edit_hash = '#entries?form=' + form_id + '&name=' + form_name + '&entry_key=&direction=' + EC.Const.EDITING;

                //set selected key value in localStorage to show list of values later
                window.localStorage.branch_edit_key_value = key_value;

                //redirect to branch entries list page with positive flag
                EC.BranchInputs.renderStoreEditFeedback(true);

            }, function () {
                EC.BranchInputs.renderStoreEditFeedback(false);
            });

        } else {

            $.when(EC.Create.insertBranchFormValues(rows, key_value, hierarchy_entry_key_value)).then(function (entry_key) {
                EC.BranchInputs.prepareFeedback(true, entry_key);
            }, function () {
                EC.BranchInputs.prepareFeedback(false, null);
            });
        }

    };

    return module;

}(EC.BranchInputs));


/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *	@module EC
*   @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareStoreEdit = function(the_current_value, the_current_position, the_input) {

			var self = this;
			var clone_value = "";
			var validation = {};
			var form_has_jumps;
			var current_value = the_current_value;
			var current_position = the_current_position;
			var input = the_input;

			//disable to avoid double submit (not unbind, as if validation is wrong, I will have to re-bind again)
			$(this).addClass('ui-disabled');

			form_has_jumps = window.localStorage.form_has_jumps;

			//get input value(based on input type and layout)
			current_value = EC.BranchInputs.getCurrentValue(input.type);
			current_position = window.localStorage.branch_current_position;

			//if we need to check for a double entry, get clone value
			if (parseInt(input.has_double_check, 10) === 1) {

				clone_value = self.getCloneValue(input.type);

			}

			//validate input before going to next page
			validation = EC.Utils.isValidValue(input, current_value, clone_value);

			//check if the editing is valid
			if (!validation.is_valid) {

				//warn user about the type of error
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));

				//re-enable button to allow user to try again
				$(this).removeClass('ui-disabled');

				return;

			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

			//If this form has jump, edit the input_values array to set to _skipp3d_ all the values which are not part of the input_trail array
			if (form_has_jumps === '1') {

				//add current element on the view to inputs trail (as we are not tapping next)
				self.pushInputsTrail(input);

				//amend values skipped by the new jump sequence when editing
				self.amendSkippedValues();
			}

			//store data.
			self.storeData(self);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.saveValuesOnExit = function(the_current_input) {

			var self = this;
			var current_input = the_current_input;
			//get current value from the input currently on screen
			var current_value = self.getCurrentValue(current_input.type);
			var current_position = parseInt(window.localStorage.branch_current_position, 10);
			var validation = self.validateValue(current_input, current_value, current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				//warn user about the type of error
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));
				return;
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, current_input.type, current_input.is_primary_key);
			self.pushInputsTrail(current_input);

			self.onStoreValues();

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {
		"use strict";

		module.storeData = function(the_ctx) {

			//get context
			var self = the_ctx;
			var branch_media_files = [];

			var getCachedMediaFiles = function() {

				var branch_inputs_values = JSON.parse(window.localStorage.branch_inputs_values);
				var iLength = branch_inputs_values.length;
				var i;
				var branch_input;
				var value;

				var files = [];

				//count how many media files we have to save
				for ( i = 0; i < iLength; i++) {

					//get current value
					branch_input = EC.BranchInputs.branch_inputs[i];
					value = EC.BranchInputs.getCachedInputValue(branch_input.position).value;

					if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.VIDEO || branch_input.type === EC.Const.AUDIO) {
						// If cache path is empty, we do not have a file to save for that input so skip
						// it
						if (value.cached !== "") {
							files.push({
								type : branch_input.type,
								cached : value.cached,
								stored : value.stored,
								ref : branch_input.ref
							});
						}
					}

				}//for

				/*
				 * Now we got all the file paths, so clear DOM from any references
				 * otherwise on editing input some cache/stored file paths could be there and
				 * that causes errors upon saving
				 * as the EC.File.move() mehod will look for non-existent files
				 */

				if (files.length > 0) {
					//audio
					$('div#branch-audio div#branch-input-audio input#cached-audio-uri').val('');
					$('div#branch-audio div#branch-input-audio input#stored-audio-uri').val('');
				}

				return files;
			};

			branch_media_files = getCachedMediaFiles();

			console.log('media_files.length= ' + branch_media_files.length);

			//Save data directly if no files are found (or we are using Chrome)
			if (branch_media_files.length === 0 || EC.Utils.isChrome()) {

				self.buildRows();

			}
			else {

				//save media files, when all are saved trigger buildRows();
				console.log(JSON.stringify(branch_media_files));

				//move branch media files, pass the is_branch flag as true to trigger
				// BRanchINputs,buildRows AFTER files are moved
				EC.File.move(branch_media_files, true);
			}

		};

		/** @method onStoreValues When the user tap the button to save data,
		 *  check first we have a primary key to save, then take care of skipped (by a
		 * jump) values
		 */
		module.onStoreValues = function() {

			var self = this;

			//check if the primary key field has a value (there are cases where jumps skip
			// the primary key field, so warn the user form cannot be saved)
			if (self.isEmptyPrimaryKey()) {
				//warn user
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("missing_pk"));
				return;
			}

			if (window.localStorage.branch_form_has_jumps === '1') {
				//amend input values to save, setting the keyword "_skipp3d_" to skipped fields
				self.amendSkippedValues();
			}

			self.storeData(self);
		};

		return module;

	}(EC.BranchInputs));

/*global $, jQuery, LocalFileSystem, Media, cordova*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = (function (module) {
    'use strict';

    module.audio = function (the_value, the_input) {

        var span_label = $('div#branch-audio div#branch-input-audio span.label');
        var value = the_value;
        var input = the_input;
        var record_btn = $('div#branch-audio div#branch-input-audio div#start-btn');
        var stop_btn = $('div#branch-audio div#branch-input-audio div#stop-btn');
        var play_btn = $('div#branch-audio div#branch-input-audio div#play-btn');
        var ongoing_recording_spinner = $('div#branch-audio div#branch-input-audio div#ongoing-recording-spinner');
        var audio_feedback = $('div#branch-audio div#branch-input-audio p#audio-feedback');
        var cached_audio_uri = $('div#branch-audio div#branch-input-audio input#cached-audio-uri');
        var stored_audio_uri = $('div#branch-audio div#branch-input-audio input#stored-audio-uri');
        var header_btns = $('div#branch-audio div.ui-header');
        var current_path;
        var audio_full_path_uri;
        var cache_path;
        var mediaRec;
        var current_audio;

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //attach event handlers (removing old ones to avoid tiggering an event twice)
        record_btn.off('vclick').one('vclick', recordAudio);
        stop_btn.off('vclick');
        play_btn.off('vclick').on('vclick', playAudio);

        //if an audio file is stored add it to hidden input field, to be shown if no
        // cached value is set
        if (window.localStorage.edit_mode && value.stored === undefined) {

            stored_audio_uri.val(value);
            value = {
                cached: '',
                stored: value
            };

        }//if


        //toggle 'play' button only if we have a file to play
        if (!value.cached) {

            if (value.stored) {

                play_btn.removeClass('ui-disabled');

                //build full path to get audio file from private app folder (depending on
                // platform)
                switch (window.device.platform) {
                    case EC.Const.ANDROID:
                        audio_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;
                        break;
                    case EC.Const.IOS:
                        audio_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;
                        break;
                }

                console.log('image_full_path_uri: ' + audio_full_path_uri);

                current_path = audio_full_path_uri;

                audio_feedback.text('Audio available');

                console.log('current_path: ' + JSON.stringify(audio_full_path_uri));

            }
            else {

                play_btn.addClass('ui-disabled');
            }

        }
        else {

            //we have a cached file to play, current path gets the cached value
            play_btn.removeClass('ui-disabled');
            current_path = cached_audio_uri.val();
        }

        console.log('value.stored ' + value.stored);

        //If a cache value is set, add it to hidden field
        //cached_audio_uri.val(value.cached || '');
        console.log('cache_audio_uri: ' + cached_audio_uri.val());

        //add store audio uri cache_path (if any)
        stored_audio_uri.val(value.stored || '');

        //reset recording buttons
        record_btn.removeClass('enable');
        stop_btn.addClass('ui-disabled');

        //request temporary folder from file system based on platform
        //todo this will probably change with the new Cordova iOS to match Android
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cache_path);


                /* We need to provide the full path to the tmp folder to record an audio file
                 *
                 * iOS 7+ does not want 'file://' in the path to record an audio file
                 *
                 * if the path starts with 'file://', error thrown is
                 * 'Failed to start recording using AvAudioRecorder'
                 * so it is removed using slice(7);
                 */
                cache_path = cache_path.slice(7);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //Android only getting public cache directory
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cache_path);

            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }

        //record audio
        function recordAudio(e) {

            var filename;

            /*
             * disable navigation buttons while recording, to avoid users to navigate away
             * from the page causing the media object to stay open and impossible to release
             */
            header_btns.addClass('ui-disabled');

            //disable player buttons while recording
            stop_btn.removeClass('ui-disabled');
            stop_btn.one('vclick', stopRecordAudio);
            record_btn.addClass('ui-disabled');
            play_btn.addClass('hidden');
            ongoing_recording_spinner.removeClass('hidden');

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    //build filename timestamp + mp4 (Cordova 2.9 sources have been modified manually
                    // to record high quality audio)
                    filename = EC.Utils.getTimestamp() + '.mp4';
                    break;

                case EC.Const.IOS:
                    /*build filename timestamp + wav (iOS only records to files of type .wav and
                     returns an error if the file name extension is not correct.)
                     */
                    filename = EC.Utils.getTimestamp() + '.wav';
                    break;

            }

            //if there is a file cached already, we replace that one upon further recordings
            if (!current_path) {
                current_path = cache_path + filename;
            }

            console.log('Recording... - Full path: ' + current_path);

            mediaRec = new Media(current_path,

                // success callback
                function onRecordingSuccess() {

                    play_btn.removeClass('ui-disabled');
                    audio_feedback.text('Audio available');
                    console.log('recordAudio():Audio Success');
                    cached_audio_uri.val(current_path);
                },

                // error callback
                function onRecordingError(err) {
                    console.log('recordAudio():Audio Error: ' + err.code);
                });

            // Record audio
            mediaRec.startRecord();

            e.preventDefault();
            e.stopPropagation();

        }//recordAudio

        //stop recording
        function stopRecordAudio(e) {

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //enable player buttons
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('hidden ui-disabled');
            ongoing_recording_spinner.addClass('hidden');

            record_btn.one('vclick', recordAudio);

            //stop recording and release resources
            mediaRec.stopRecord();
            mediaRec.release();

            e.preventDefault();
            e.stopPropagation();

        }

        function stopPlayingAudio(e) {

            console.log('Audio stopped');

            //stop audio and release resources
            current_audio.stop();
            current_audio.release();

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //re-enable player buttons
            stop_btn.off().one('vclick', stopRecordAudio);
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('ui-disabled');

        }

        //play the audio
        function playAudio() {

            //disable navigation buttons while playing
            header_btns.addClass('ui-disabled');

            console.log('Playing... ' + current_path);

            //unbind stopRecordAudio to bind stopPlayingAudio
            stop_btn.off().one('vclick', stopPlayingAudio);
            stop_btn.removeClass('ui-disabled');
            play_btn.addClass('ui-disabled');
            record_btn.addClass('ui-disabled');

            function onPlayStatusChange(the_status) {

                var status = the_status;

                if (status === 4) {

                    //re-enable navigation buttons
                    header_btns.removeClass('ui-disabled');

                    //re-enable player buttons
                    stop_btn.addClass('ui-disabled');
                    record_btn.removeClass('ui-disabled');
                    play_btn.removeClass('ui-disabled');
                }

            }

            current_audio = new Media(current_path, null, null, onPlayStatusChange);
            current_audio.play();

        }//playAudio

    };

    return module;

}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
		"use strict";

		module.barcode = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var scanner = $('div#branch-barcode div#branch-input-barcode div#scanner');
			var scanner_confirm = $('div#branch-barcode div#branch-input-barcode div#scanner-confirm');
			var scan_result = $('div#branch-barcode div#branch-input-barcode input.scan-result');
			var scan_result_confirm = $('div#branch-barcode div#branch-input-barcode input.scan-result-confirm');

			//update label text
			span_label.text(input.label);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//reset buttons
			scanner.removeClass('ui-disabled');
			scanner_confirm.removeClass('ui-disabled');

			scan_result.val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			// or it triggers a jump
			if (window.localStorage.branch_edit_mode && input.is_primary_key === '1') {

				//disable scan button
				scanner.addClass('ui-disabled');
				$('div#branch-input-barcode p.primary-key-not-editable').removeClass("hidden");
			}
			else {
				$('div#branch-input-barcode p.primary-key-not-editable').addClass("hidden");
			}

			if (double_entry) {

				//duplicate text input
				clone.removeClass('hidden');
				scan_result_confirm.val(value);

				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					//disable clone scan button
					scanner_confirm.addClass('ui-disabled');
				}

				//add event handler to second scan button
				scanner_confirm.off().on('vclick', function() {

					//flag needed to handle case when user dismiss the barcode scanner
					window.localStorage.is_dismissing_barcode = 1;

					cordova.plugins.barcodeScanner.scan(function(result) {

						//do not override value if the scan action is cancelled by the user
						if (!result.cancelled) {
							scan_result_confirm.val(result.text);
						}

					}, function(error) {
						console.log(error);
					});

				});
			}
			else {

				//add hidden class if missing
				clone.addClass('hidden');
			}

			//set handlers for scan button
			scanner.off().on('vclick', function() {

				//flag needed to handle case when user dismiss the barcode scanner
				window.localStorage.is_dismissing_barcode = 1;

				cordova.plugins.barcodeScanner.scan(function(result) {

					//do not override value if the scan action is cancelled by the user
					if (!result.cancelled) {
						scan_result.val(result.text);
					}

				}, function(error) {
					console.log(error);
				});

			});

		};

		return module;

	}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.checkbox = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#branch-checkbox span.label');
			var clone = $('div#branch-checkbox div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var CHECKBOX_CHECKED = "";
			var DISABLED = "";
			var SELECTED = "";
			var HTML = "";

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');
			} else {
				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//if in editing mode, do not allow changes either if the field is a primary key or it triggers a jump
			if (window.localStorage.branch_edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
				DISABLED = 'disabled="disabled"';
			}

			//display all checkboxes options
			$(input.options).each(function(index) {

				var name = "choice";
				var option_value = this.value.trim();
                var option_label = this.label.trim();
				var option_id = 'checkbox-choice-' + (index + 1);
				var i;
				var iLength;

				//check if we have any value stored. For checkboxes, 'value' will be an array
				for ( i = 0, iLength = value.length; i < iLength; i++) {

					CHECKBOX_CHECKED = "";

					//if any match is found, pre-select that checkbox in the markup
					if (value[i] === option_value) {
						CHECKBOX_CHECKED = 'checked="checked"';
						break;
					}

				}

				HTML += '<label>';
				HTML += '<input type="checkbox" ' + CHECKBOX_CHECKED + ' ' + DISABLED + ' name="' + option_label;
				HTML += '" id="' + option_id;
				HTML += '" value="' + option_value;
				HTML += '" />' + option_label;
				HTML += '</label>';

			});

			span_label.append(HTML);
			$('div#branch-input-checkbox').trigger("create");

		};

		return module;

	}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
		"use strict";

		module.date = function(the_value, the_input) {

			var datepicker;
			var ios_datepicker;
			var span_label = $('div#branch-date span.label');
			var clone = $('div#branch-date div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;
			var default_date;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//Android Phonegap DatePicker plugin http://goo.gl/xLrqZl
			datepicker = $('div#branch-input-date input.nativedatepicker');

			//iOS uses the HTML5 input type="date"
			ios_datepicker = $('div#branch-input-date input.ios-date');

			//hide immediate ios date input parent (JQM quirk, this is to hide the div
			// element border wrapping the input after JQM enhanced the markup)
			ios_datepicker.parent().addClass("no-border");

			/* Set current date in custom data attribute.
			 * Important: since Epicollect for some bizzarre reason does not store the
			 * timestamps, but a formatted date,
			 * it is impossible to trigger the datapicker to the right data/time value after
			 * a saving, as the timestamp is lost
			 * i.e. if I save save 25th march 1988 just as 25/3, I will never get the year
			 * back :/ and it will default to the current date
			 * TODO: save date and time values with a timestamp attached
			 */

			datepicker.attr("data-raw-date", new Date());

			/*show default date if input.value = input.datetime_format:
			 *if the option to show the current date as default is selected in the web form
			 * builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (value === input.datetime_format) {
				datepicker.val(EC.Utils.parseDate(new Date(), input.datetime_format));
			}
			else {
				datepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {

				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the
				 * input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */

				datepicker.off().on('focus', function(event) {

					var datepicker = $(this);
					var selected_date = new Date(datepicker.attr("data-raw-date"));

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'date', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {

						var new_date;

						if (returned_date !== undefined) {
							new_date = new Date(returned_date);

							datepicker.val(EC.Utils.parseDate(new_date, input.datetime_format));
							datepicker.attr("data-raw-date", new_date);
						}

						// This fixes the problem you mention at the bottom of this script with it not
						// working a second/third time around, because it is in focus.
						datepicker.blur();
					});
				});
			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="date"
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				datepicker.off().on('vclick', function(event) {
					ios_datepicker.focus();
				});

				ios_datepicker.off().on('blur', function(event) {

					var ios_date = ios_datepicker.val();

					datepicker.val(EC.Utils.parseIOSDate(ios_date, input.datetime_format));
					datepicker.attr("data-raw-date", ios_date);
				});
			}
		};

		return module;

	}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";
	
	module.decimal = function(the_value, the_input) {

			
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			var min_range = $('span.min-range');
			var max_range = $('span.max-range');

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#branch-input-decimal input').removeAttr('disabled');

			//hide elements not needed
			clone.addClass('hidden');
			min_range.addClass('hidden');
			max_range.addClass('hidden');

			if (double_entry) {

				//duplicate textarea input
				clone.removeClass('hidden');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes either if the field is a primary key or it triggers a jump
				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			}

			//show min range if any
			if (input.min_range !== "") {

				min_range.removeClass('hidden');
				min_range.text('Min: ' + input.min_range);

			}

			//show max range if any
			if (input.max_range !== "") {

				max_range.removeClass('hidden');
				max_range.text('Max: ' + input.max_range);

			}

			$('div#input-decimal input').val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {
				$('div#branch-input-decimal input').attr('disabled', 'disabled');
					$('div#branch-input-decimal p.primary-key-not-editable').removeClass("hidden");
			} else {
				
				$('div#branch-input-decimal p.primary-key-not-editable').addClass("hidden");
			}

		};
		
	return module;
	
	}(EC.BranchInputTypes));
/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
        "use strict";

        module.dropdown = function(the_value, the_input) {

            //to cache dom lookups
            var obj;
            var span_label = $('div#branch-select span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;
            var DISABLED = "";
            var SELECTED = "";
            var HTML = "";

            //update label text
            span_label.text(input.label);

            //Localise
            if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
                EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
            }

            //Add attribute to flag the primary key input field
            if (parseInt(input.is_primary_key, 10) === 1) {
                span_label.attr('data-primary-key', 'true');
            } else {
                //reset the attribute to empty if not a primary key (JQM caches
                // pages and we recycle views)
                span_label.attr('data-primary-key', '');
            }

            //check if we need to replicate this input
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            //if in editing mode, do not allow changes either if the field is a
            // primary key or it triggers a jump
            if (window.localStorage.branch_edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
                DISABLED = 'disabled="disabled"';
            }

            SELECTED = (value === "") ? 'selected' : "";

            //TODO: check markup on jqm docs for select. Fastclick: is needclick
            // needed?
            HTML += '<select id="selection" name="selection" data-native-menu="true" >';
            HTML += '<option value ="0"' + SELECTED + '>' + EC.Const.NO_OPTION_SELECTED + '</option>';

            $(input.options).each(function(index) {

                var option_value = this.value;
                var option_index = (index + 1);
                var option_label = this.label;
                var option_id = 'select-choice-' + (index + 1);

                //check if we have a value cached and pre-select that input
                SELECTED = (value === option_value) ? 'selected' : "";

                HTML += '<option ' + SELECTED + ' ' + DISABLED + ' value ="' + option_value + '" data-index="' + option_index + '">' + option_label + '</option>';
            });

            HTML += '</select>';

            span_label.append(HTML);
            $('div#branch-input-dropdown').trigger("create");

            /*****************************************************************************************************
             *	Following code is a hack to make the select native widget work on
             * Android 4.4.2 (Nexus 5)
             */
            //Add needclick to all the markup as Fastclick is interfering and the
            // native popup with the list of options is never triggered
            // $("div#input-dropdown").addClass("needsclick");
            // $("div#input-dropdown div.ui-select").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn
            // span.ui-btn-inner").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text span").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-icon").addClass("needsclick");

            //Manually trigger a click on a select element. Best solution I came
            // across
            $("select").on('vmousedown', function(e) {
                $(this).focus().click();
            });

            /*****************************************************************************************************
             * End hack
             */

        };

        return module;

    }(EC.BranchInputTypes));

/*jslint vars: true, nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.integer = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#branch-integer span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = parseInt(the_value, 10);
			var input = the_input;
			var min_range = $('div#branch-input-integer span.min-range');
			var max_range = $('div#branch-input-integer span.max-range');
			var input_holder = $('div#branch-input-integer input');

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			input_holder.removeAttr('disabled');

			if (window.device.platform === EC.Const.IOS) {
				//trigger numeric keyboard on iOS
				$('div#branch-input-integer input').attr('pattern', '[0-9]*');
			}

			//hide elements not needed
			clone.addClass('hidden');
			min_range.addClass('hidden');
			max_range.addClass('hidden');

			//check if we need to render a double entry for this input
			if (double_entry) {

				//duplicate integer input
				clone.removeClass('hidden');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes either if the field is a primary key
				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			}
			//show min range if any
			if (input.min_range !== "") {

				min_range.removeClass('hidden');
				min_range.text('Min: ' + input.min_range);

			}

			//show max range if any
			if (input.max_range !== "") {

				max_range.removeClass('hidden');
				max_range.text('Max: ' + input.max_range);

			}

			input_holder.val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {
				input_holder.attr('disabled', 'disabled');
				$('div#branch-input-integer p.primary-key-not-editable').removeClass("hidden");
			} else {
				
				$('div#branch-input-integer p.primary-key-not-editable').addClass("hidden");
			}

		};

		return module;

	}(EC.BranchInputTypes)); 
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = (function (module) {
    'use strict';

    //branches only have old location implementation
    module.location = function (the_value, the_input) {

        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var requests = [];
        var geolocation_request;
        var is_first_attempt = true;
        //set unlimited timeout for watch position to avoid timeout error on iOS when the device does not move
        // see http://goo.gl/tYsBSC, http://goo.gl/jYQhgr, http://goo.gl/8oR1g2
        var timeout = (window.device.platform === EC.Const.IOS) ? Infinity : 30000;
        var set_location_btn = $('div#branch-location div#branch-input-location div#branch-set-location');
        var set_location_result = $('textarea#branch-set-location-result');
        var accuracy_result = $('div#branch-location  div#branch-input-location div.current-accuracy-result');
        var accuracy_tip = $('div#branch-location  div#branch-input-location div.location-accuracy-tip');

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //set previous location value if any
        if (value !== '') {
            set_location_result.val(value);
            accuracy_result.find('span').text(Math.floor(location.accuracy));
            accuracy_result.removeClass('hidden');
            accuracy_tip.removeClass('hidden');
        } else {
            //hide feedback when showing the view the first time
            $(accuracy_result).addClass('hidden');
            $(accuracy_tip).addClass('hidden');
        }

        function _showAcquiredLocation() {

            window.navigator.geolocation.clearWatch(geolocation_request);
            accuracy_result.find('span').text(Math.floor(location.accuracy));
            accuracy_result.removeClass('hidden');
            accuracy_tip.removeClass('hidden');

            EC.Notification.hideProgressDialog();

            set_location_result.val(//
                'Latitude: ' + location.latitude + ',\n' + //
                'Longitude: ' + location.longitude + ',\n' + //
                'Altitude: ' + location.altitude + ',\n' + //
                'Accuracy: ' + location.accuracy + ',\n' + //
                'Altitude Accuracy: ' + location.altitude_accuracy + ',\n' + //
                'Heading: ' + location.heading + '\n');
            //

            if (!EC.Utils.isChrome()) {
                EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
            }
            set_location_btn.one('vclick', _getLocation);

        }

        function requestPosition() {

            console.log('requestPosition called');
            //on first attempt, get a quick and rough location just to get started
            //We do not use getCurrentPosition as it tends to give back a cached position when is it called, not looking for a new one each time
            if (is_first_attempt) {
                geolocation_request = navigator.geolocation.watchPosition(onGCPSuccess, onGCPError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
            }
            else {

                /*
                 on subsequent calls, check position for 3 secs and return.
                 this will improve cases when watchPositionretunr immediately with the same value, as it might return more than once during the 3 secs period
                 */

                geolocation_request = navigator.geolocation.watchPosition(onGCPSuccess, onGCPError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });

                window.setTimeout(function () {
                        window.navigator.geolocation.clearWatch(geolocation_request);

                        _showAcquiredLocation();

                        console.log('setTimeout called');
                    },
                    3000 //stop checking after 3 seconds (value is milliseconds)
                );
            }
        }

        var _getLocation = function () {

            set_location_btn.off('vclick');
            requests = [];


            //check id GPS is enabled on the device
            $.when(EC.Utils.isGPSEnabled()).then(function () {

                //gps is on
                EC.Notification.showProgressDialog(EC.Localise.getTranslation('locating'), EC.Localise.getTranslation('wait'));

                //On Android, mostly on old devices, halt the execution to solve loader spinner not hiding after a gps lock
                if (window.device.platform === EC.Const.ANDROID) {
                    //if the device is older than KitKat I assume it is slow to hide the spinning loader and I need the execution halt to clear race conditions
                    if (!(EC.Const.KITKAT_REGEX.test(window.device.version) || EC.Const.LOLLIPOP_REGEX)) {
                        EC.Utils.sleep(2000);
                    }
                }

                requestPosition();

            }, function () {
                console.log('gps NOT enabled');

                //no gps...do we have at least an internet connection?
                //TODO: replace with location services network
                //if (!EC.Utils.hasConnection()) {

                //console.log('No internet connection');

                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('gps_disabled'));

                //  }
            });

        };

        var onGCPSuccess = function (position) {

            console.log('onGCPSuccess called, accuracy: ' + position.coords.accuracy);
            //get HTML5 geolocation component values replacing null with '' for not available components
            location.latitude = (position.coords.latitude === null) ? '' : position.coords.latitude;
            location.longitude = (position.coords.longitude === null) ? '' : position.coords.longitude;
            location.altitude = (position.coords.altitude === null) ? '' : position.coords.altitude;
            location.accuracy = (position.coords.accuracy === null) ? '' : position.coords.accuracy;
            location.altitude_accuracy = (position.coords.altitudeAccuracy === null) ? '' : position.coords.altitudeAccuracy;
            location.heading = (position.coords.heading === null) ? '' : position.coords.heading;

            _showAcquiredLocation();
        };

        // onError Callback receives a PositionError object
        //
        var onGCPError = function (error) {

            var empty = '';

            window.navigator.geolocation.clearWatch(geolocation_request);

            // clearAllRequests();

            EC.Notification.hideProgressDialog();

            console.log(JSON.stringify(error));

            if (error.code === 3) {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), error.message + EC.Localise.getTranslation('location_fail'));

            } else if (error.code === 1) {

                if (window.device.platform === EC.Const.IOS) {
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('location_service_fail'));
                }
            } else {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('unknow_error'));
            }

            //set location object to empty values
            set_location_result.val(//
                'Latitude: ' + empty + ',\n' + //
                'Longitude: ' + empty + ',\n' + //
                'Altitude: ' + empty + ',\n' + //
                'Accuracy: ' + empty + ',\n' + //
                'Altitude Accuracy: ' + empty + ',\n' + //
                'Heading: ' + empty + '\n');
            //

            set_location_btn.one('vclick', _getLocation);
        };

        //bind set location button
        set_location_btn.off().one('vclick', _getLocation);

    };

    return module;

}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery, Camera*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = (function (module) {
    'use strict';

    var app_storage_dir;

    module.photo = function (the_value, the_input) {

        var span_label = $('div#branch-photo span.label');
        var value = the_value;
        var input = the_input;
        var camera_btn = $('div#branch-input-photo div#camera-btn');
        var store_image_uri = $('div#branch-input-photo input#stored-image-uri');
        var cache_image_uri = $('div#branch-input-photo input#cached-image-uri');
        var image_full_path_uri;

        //clear canvas from previous images
        var canvas_portrait_dom = $('div#branch-input-photo #canvas-portrait');
        var canvas_landscape_dom = $('div#branch-input-photo #canvas-landscape');
        var canvas_portrait = $('div#branch-input-photo #canvas-portrait')[0];
        var canvas_landscape = $('div#branch-input-photo #canvas-landscape')[0];

        var context_portrait = canvas_portrait.getContext('2d');
        context_portrait.clearRect(0, 0, canvas_portrait.width, canvas_portrait.height);

        var context_landscape = canvas_landscape.getContext('2d');
        context_landscape.clearRect(0, 0, canvas_landscape.width, canvas_landscape.height);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        // //on iOS, close image popup on orientation change
        if (EC.Const.IOS) {
            //TODO
        }

        $('div#canvas-wrapper').off().on('vclick', function (e) {

            var href = $('div#branch-input-photo input#cached-image-uri').val();
            var iOS_popup = $('#branch-photo-popup');

            console.log(href);

            //if cached image url is empty, get stored image url
            if (href === '') {
                href = app_storage_dir + $('div#branch-input-photo input#stored-image-uri').val();
            }

            if (window.device) {
                switch (window.device.platform) {

                    //on Android we show the image as a opo up using swipebox
                    case EC.Const.ANDROID:
                        e.preventDefault();
                        $.swipebox([{
                            href: href
                        }]);
                        break;

                    //on iOS we show a built in JQM popup, as swipebox has
                    // got issues
                    case EC.Const.IOS:
                        iOS_popup.find('img').attr('src', href);

                        /*
                         * let's use a timeout otherwise the popup is not
                         * centered on the first tap, because the
                         * image is not loaded. Not the prettiest solution,
                         * but since the image is loaded locally
                         * and always the same size, I can assume 100 ms will
                         * work everytime on iPhones
                         *
                         * see here
                         * http://stackoverflow.com/questions/21304763/jquery-mobile-popup-not-centered-on-first-click
                         *
                         */

                        window.setTimeout(function () {
                            iOS_popup.popup('open');
                        }, 100);

                        $(window).on('orientationchange', function (event) {
                            console.log('called orientationchange');

                            //close popup, as it is not scaled/positioned
                            // properly
                            iOS_popup.popup('close');
                        });

                        break;
                }

            }

        });

        //Render thumbnail on <canvas>
        var _renderThumb = function (the_image_uri) {

            //load taken image on <canvas> tag
            var image = new Image();
            var canvas;
            var context;
            var source = the_image_uri;

            image.src = source;

            image.onerror = function () {
                console.log('Image failed!');
            };

            image.onload = function () {

                //resize image to fit in canvas -> it is not working properly!
                console.log('on load called');
                var width = this.width;
                var height = this.height;
                var thumb_height;
                var thumb_width;
                var canvas;

                if (height > width) {

                    //portrait
                    canvas = canvas_portrait;
                    thumb_width = 188;
                    thumb_height = 250;
                    canvas_landscape_dom.addClass('hidden');
                    canvas_portrait_dom.removeClass('hidden');

                }
                else {

                    //landscape
                    canvas = canvas_landscape;
                    thumb_width = 250;
                    thumb_height = 188;
                    canvas_portrait_dom.addClass('hidden');
                    canvas_landscape_dom.removeClass('hidden');
                }

                context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                context.save();

                //scale image based on device pixel density
                // context.scale(window.devicePixelRatio, window.devicePixelRatio);
                context.imageSmoothingEnabled = false;

                context.drawImage(this, 0, 0, thumb_width, thumb_height);

                context.restore();

            };
            //image.onload

            console.log(JSON.stringify(source));

        };

        //hide both canvas
        canvas_landscape_dom.addClass('hidden');
        canvas_portrait_dom.addClass('hidden');

        //unbind camera button event to avoid multiple calls to Camera API
        camera_btn.off('vclick');

        //update label text
        span_label.text(input.label);

        //if a value is stored when editing, on the first load add it to hidden input
        // field,  to be shown if no cached value is set
        if (window.localStorage.branch_edit_mode) {

            if (value.stored === undefined) {
                store_image_uri.val(value);
                value = {
                    cached: '',
                    stored: value
                };
            }
            else {

                store_image_uri.val(value.stored);
            }

        }
        else {
            //clear any previous stored path in the DOM, otherwise it get cached and it causes the same image to be overriden when adding a new entry
            store_image_uri.val('');
        }

        console.log('value.stored ' + JSON.stringify(value.stored));

        //If a cache value is set, add it to hidden field
        cache_image_uri.val(value.cached || '');
        console.log('cache_image_uri: ' + cache_image_uri.val());

        //Show cached image if any, otherwise the stored image, if any
        if (value.cached === '') {

            console.log('cached value empty');

            if (value.stored !== '') {

                //build full path to get image from private app folder
                switch (window.device.platform) {

                    case EC.Const.ANDROID:
                        image_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/' + value.stored;
                        app_storage_dir = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/';

                        break;
                    case EC.Const.IOS:
                        image_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/' + value.stored;
                        app_storage_dir = 'file://' + EC.Const.IOS_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + '/';

                        break;

                }

                console.log('image_full_path_uri: ' + image_full_path_uri);

                _renderThumb(image_full_path_uri);

            }

        }
        else {

            //render the cached image
            _renderThumb(value.cached);
        }

        //Set camera options - anything more than 1024 x 728 will crash
        var source = Camera.PictureSourceType.CAMERA;
        var camera_options = {
            quality: 50, //anything more than this will cause memory leaks
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: source,
            encodingType: Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            correctOrientation: true,
            saveToPhotoAlbum: false,
            targetWidth: 1024, //more than this resoution and it will happily crash
            targetHeight: 768
        };

        //open camera app on click
        camera_btn.on('vclick', function () {

            navigator.camera.getPicture(onGPSuccess, onGPError, camera_options);

        });

        //Success callback
        var onGPSuccess = function (the_image_uri) {

            console.log('image_uri: ' + the_image_uri);

            var image_uri = the_image_uri;

            //render the new image on canvas
            _renderThumb(image_uri);

            //save cached filename in hidden input field
            console.log('image uri is' + image_uri);

            $('div#branch-input-photo input#cached-image-uri').val(image_uri);

        };

        //Error callback
        var onGPError = function (error) {
            console.log('Error', 'Failed because: ' + error);
        };
    };

    return module;

}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.radio = function(the_value, the_input) {
			
			var obj;
			var span_label = $('div#branch-radio div#branch-input-radio span.label');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var HTML = "";
			var RADIO_CHECKED = "";
			var DISABLED = "";

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');

			} else {
				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//if in editing mode, do not allow changes either if the field is a primary key or it triggers a jump
			if (window.localStorage.branch_edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
				DISABLED = 'disabled="disabled"';
			}

			HTML += '<fieldset data-role="controlgroup">';

			//render list of options
			$(input.options).each(function(index) {

				    //increase value by 1, as we use value = 0 when no option is selected (like for select/dropdown) We are using the index as radio jumps are mapped against the index of the value
                var option_value = this.value;
                var option_index = (index + 1);
                var option_label = this.label;
				var option_id = 'radio-choice-' + (index + 1);
			
				RADIO_CHECKED = (value === option_value) ? 'checked="checked"' : "";

				HTML += '<input type="radio" name="radio-options" id="' + option_id + '" value="' + option_value + '"' + RADIO_CHECKED + ' ' + DISABLED + ' data-index="' + option_index + '">';
                HTML += '<label for="' + option_id + '">' + option_label + '</label>';

			});

			HTML += '</fieldset>';
			
			//append radio buttons and trigger layout	
			span_label.append(HTML);
			$('div#branch-input-radio').trigger("create");

		};

		return module;

	}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";
	
	module.text = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#branch-text div#branch-input-text span.label');
			var clone = $('div#branch-text div#branch-input-text div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			//update label text
			span_label.text(input.label);

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#branch-input-text input').removeAttr('disabled');

			if (double_entry) {

				//duplicate text input
				clone.removeClass('hidden');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				console.log( typeof input.is_primary_key);
				console.log( typeof input.has_jump);

				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			$('div#branch-input-text input').val(value);

			//if it is a genkey field, disable input and pre-fill it with the genkey
			if (input.is_genkey === 1 && value === "") {

				$('div#branch-input-text input').attr('disabled', 'disabled').val(EC.Utils.getGenKey());
				return;

			}

			//if in branch editing mode, do not allow changes if the field is a primary key 
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {
				$('div#branch-input-text input').attr('disabled', 'disabled');
				$('div#branch-input-text p.primary-key-not-editable').removeClass("hidden");
			} else {
				
				$('div#branch-input-text p.primary-key-not-editable').addClass("hidden");
			}

		};

	
	return module;
	
}(EC.BranchInputTypes));
/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.textarea = function(the_value, the_input) {

			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#branch-input-textarea textarea').removeAttr('disabled');

			if (double_entry) {

				//duplicate textarea input
				clone.removeClass('hidden');
				$('div.clone textarea').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone textarea').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			//Set value
			$('div#branch-input-textarea textarea').val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

				$('div#branch-input-textarea textarea').attr('disabled', 'disabled');
				$('div#branch-input-textarea p.primary-key-not-editable').removeClass("hidden");
			} else {
				
				$('div#branch-input-textarea p.primary-key-not-editable').addClass("hidden");
			}
			

		};

		return module;

	}(EC.BranchInputTypes)); 
/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
		"use strict";

		module.time = function(the_value, the_input) {

			var timepicker;
			var ios_timepicker;
			var span_label = $('div#branch-input-time span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//Android Phonegap timepicker plugin http://goo.gl/xLrqZl
			timepicker = $('div#branch-input-time input.nativedatepicker');

			//iOS uses the HTML5 input type="time"
			ios_timepicker = $('div#branch-input-time input.ios-time');

			//hide immediate ios time input parent (JQM quirk, this is to hide the div
			// element border wrapping the input after JQM enhanced the markup)
			ios_timepicker.parent().addClass("no-border");

			/*show default date if input.value = input.datetime_format:
			 *if the option to show the current date as default is selected in the web form
			 * builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (input.datetime_format === input.default_value) {
				timepicker.val(EC.Utils.parseTime(new Date(), input.datetime_format));
			}
			else {
				//show cached value
				timepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {
				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the
				 * input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */
				timepicker.off().on('focus', function(event) {

					var timepicker = $(this);
					var selected_date = Date.parse(timepicker.val()) || new Date();

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'time', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {

						var new_date;

						if (returned_date !== undefined) {

							new_date = new Date(returned_date);

							timepicker.val(EC.Utils.parseTime(new_date, input.datetime_format));
						}

						// This fixes the problem you mention at the bottom of this script with it not
						// working a second/third time around, because it is in focus.
						timepicker.blur();
					});
				});
			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="time", only hours and minutes are
			 * returned
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				timepicker.off().on('vclick', function(event) {

					ios_timepicker.focus();

				});

				ios_timepicker.off().on('blur', function(event) {

					var ios_time = ios_timepicker.val();

					//get seconds (based on current time)
					var date = new Date(event.timeStamp);
					var seconds = date.getSeconds();

					//add seconds to have a string like HH:mm:ss
					ios_time = ios_time + ":" + seconds;

					timepicker.val(EC.Utils.parseIOSTime(ios_time, input.datetime_format));
					timepicker.attr("data-raw-date", ios_time);

				});
			}
		};

		return module;

	}(EC.BranchInputTypes));

/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = (function (module) {
    'use strict';

    module.video = function (the_value, the_input) {

        //to cache dom lookups
        var span_label = $('div#branch-video div#branch-input-video span.label');
        var value = the_value;
        var input = the_input;
        var video_btn = $('div#branch-video div#branch-input-video div#video-btn');
        var play_video_btn = $('div#branch-video div#branch-input-video div#play-video-btn');
        var store_video_uri = $('div#branch-video div#branch-input-video input#stored-video-uri');
        var cache_video_uri = $('div#branch-video div#branch-input-video input#cached-video-uri');
        var video_full_path_uri;
        var cached_path;
        var video_sd_path;
        var ios_video_player_wrapper = $('div#branch-input-video div#ios-video-player-wrapper');
        var ios_video_player = $('div#branch-input-video video#ios-video-player');

        var _renderVideo = function (the_video_file_path) {
            play_video_btn.attr('data-video-path', the_video_file_path);
            play_video_btn.removeClass('ui-disabled');
        };

        //hide play button on ios, also hide video wrapper
        if (window.device.platform === EC.Const.IOS) {
            $(play_video_btn, ios_video_player_wrapper).addClass('hidden');
        }

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //if a value is stored, on the first load add it to hidden input field,  to be
        // shown if no cached value is set
        if (window.localStorage.edit_mode) {

            if (value.stored === undefined) {
                store_video_uri.val(value);
                value = {
                    cached: '',
                    stored: value
                };
            }
            else {

                store_video_uri.val(value.stored);
            }

        }

        console.log('value.stored ' + JSON.stringify(value.stored));

        //If a cache value is set, add it to hidden field
        cache_video_uri.val(value.cached || '');
        console.log('cache_video_uri: ' + cache_video_uri.val());

        //Show cached video if any, otherwise the stored video, if any
        if (value.cached === '') {

            console.log('cached value empty');

            if (value.stored !== '') {

                //build full path to get video from private app folder depending on platform
                switch (window.device.platform) {
                    case EC.Const.ANDROID:

                        video_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        /** Copy video to cache folder to make it playable (rename it using timestamp).
                         *    Due to permission issues, on Android files are not accessible by other
                         * application
                         *  Since Android support for <video> is pretty weak, we need to use an external
                         * video player app top play the video
                         *  (Whatever app capable of playing the video is installed on the device will be
                         * triggered via an intent)
                         */

                        EC.Notification.showProgressDialog();
                        $.when(EC.File.copyVideo(video_full_path_uri)).then(function (the_cached_filename) {

                            //file has been copied, update view setting it as cached file to play
                            cache_video_uri.val(the_cached_filename);
                            play_video_btn.attr('data-video-path', the_cached_filename);
                            play_video_btn.removeClass('ui-disabled');

                            EC.Notification.hideProgressDialog();

                        });
                        break;

                    case EC.Const.IOS:
                        //build full path (file is stored in persisten storage (Documents folder))
                        video_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        //add source to HTML5 video tag
                        ios_video_player.attr('src', video_full_path_uri);

                        /*this is causing the video to open automatically on iOS7,
                         * it is here because the video preview does not work on iOS 8 without it
                         */
                        if (parseFloat(window.device.version) >= 8) {
                            ios_video_player.load();
                        }

                        //show video player wrapper
                        ios_video_player_wrapper.removeClass('hidden');
                        break;
                }

            }
            else {

                play_video_btn.addClass('ui-disabled');
                ios_video_player_wrapper.addClass('hidden');
            }

        }
        else {

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    //render the cached video
                    _renderVideo(value.cached);
                    break;

                case EC.Const.IOS:
                    ios_video_player_wrapper.removeClass('hidden');
                    break;

            }
        }

        //request temporary folder from file system based on platform
        //todo: this will change on iOS with the next release to match Android I suppose
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //on Android only
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }

        //Success callback
        var onCaptureVideoSuccess = function (the_media_object) {

            var cache_video_uri = $('div#branch-video div#branch-input-video input#cached-video-uri');

            console.log(JSON.stringify(the_media_object[0]));

            video_sd_path = the_media_object[0].fullPath;

            EC.Notification.showProgressDialog();

            //move video to cache folder (temporary storage), as by default on Android is saved in the DCIM/Camera folder
            $.when(EC.File.moveVideo(video_sd_path, cache_video_uri.val())).then(function (the_cached_video_path) {

                if (window.device.platform === EC.Const.IOS) {

                    ios_video_player_wrapper.removeClass('hidden');

                    //request temporary folder from file system
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                        //imp! since Cordova 3.5+ 'fullPath' became nativeURL
                        var temp_cache_path = the_file_system.root.nativeURL;

                        var video_full_path = temp_cache_path + '/' + the_cached_video_path;

                        ios_video_player.attr('src', video_full_path);

                        cache_video_uri.val(the_cached_video_path);
                        EC.Notification.hideProgressDialog();

                    }, function (error) {
                        console.log(JSON.stringify(error));
                        EC.Notification.hideProgressDialog();
                    });
                }

                if (window.device.platform === EC.Const.ANDROID) {

                    //update cached video uri to use always the same name
                    //when taking more videos for the same input and avoid several cached videos

                    cache_video_uri.val(the_cached_video_path);
                    play_video_btn.attr('data-video-path', the_cached_video_path);
                    play_video_btn.removeClass('ui-disabled');
                    EC.Notification.hideProgressDialog();
                }

            });

        };

        //Error callback
        var onCaptureVideoError = function (error) {
            console.log(error.message);
        };

        //play button handler
        play_video_btn.off().on('vclick', function () {

            var current_cached_video = $(this).attr('data-video-path');

            //request temporary folder from file system based on platform
            //todo this will chnage with new Cordova iOS releases to match Android probably
            if (window.device.platform === EC.Const.IOS) {
                window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                    var temp_cache_path = the_file_system.root.nativeURL;
                    var video_full_path = temp_cache_path + '/' + current_cached_video;

                    window.plugins.videoPlayer.play(video_full_path);

                }, function (error) {
                    console.log(JSON.stringify(error));
                });

            }
            else {
                //Android only
                window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                    var temp_cache_path = the_file_system.nativeURL;
                    var video_full_path = temp_cache_path + '/' + current_cached_video;

                    window.plugins.videoPlayer.play(video_full_path);

                }, function (error) {
                    console.log(JSON.stringify(error));
                });
            }

        });

        //open camera app on click
        video_btn.off().on('vclick', function () {

            var options = {
                limit: 1
            };

            // start video capture
            navigator.device.capture.captureVideo(onCaptureVideoSuccess, onCaptureVideoError, options);
        });

    };

    return module;

}(EC.BranchInputTypes));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/*
		 * get cached bracnh input value from localStorage by the passed position
		 *
		 * @method getCachedBranchInputValue
		 * @param {int} the input position attribute in the form input sequence
		 * @return {Object} {_id: <the input id>, type: <the input type>, value: <the current value cached>, position : <the input position property>}
		 */
		module.getCachedInputValue = function(the_position) {

			var branch_values;
			var position = parseInt(the_position, 10);
			var index = position - 1;
			var i;
			var iLength;
			var empty_value = {
				_id : "",
				type : "",
				value : EC.Const.SKIPPED,
				position : "",
				is_primary_key : ""
			};

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_values = JSON.parse(window.localStorage.branch_inputs_values);

				//if index is out of bounds
				if (branch_values[index] === undefined) {
					return empty_value;
				}

				//search all values where the passed position matches
				iLength = branch_values.length;
				for (i = 0; i < iLength; i++) {

					//if values[i] is null, this input was skipped by a jump so create an empty one
					if (branch_values[i] === null) {

						branch_values[i] = empty_value;

					}

					//@bug on Android 2.3 :/ be careful with this comparison
					if (parseInt(branch_values[i].position, 10) === position) {

						if (window.localStorage.branch_edit_mode) {

							window.localStorage.branch_edit_id = branch_values[i]._id;
							window.localStorage.branch_edit_type = branch_values[i].type;

						}

						//return the value object found
						return branch_values[i];

					}

				}//end for each input values

				//return an empty value if no position match found, meaning the value was not cache because skipped by a jump
				return empty_value;

			} catch(error) {
				//Handle errors here
				console.log(error);
				return false;
			}

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.getCloneValue = function(the_type) {

			var type = the_type;
			var clone_value;

			switch(type) {

				case EC.Const.TEXT:
					clone_value = $('div.clone input#branch-text-clone').val();
					break;

				case EC.Const.TEXTAREA:
					clone_value = $('div.clone textarea#branch-textarea-clone').val();
					break;

				case EC.Const.INTEGER:
					clone_value = $('div.clone input#branch-integer-clone').val();
					break;

				case EC.Const.DECIMAL:
					clone_value = $('div.clone input#branch-decimal-clone').val();
					break;

				case EC.Const.BARCODE:
					clone_value = $('div#branch-input-barcode div.clone input#scan-result-confirm').val();
					break;

			}//switch

			return clone_value.trim();

		};
		//getCloneValue

		return module;

	}(EC.BranchInputs)); 
/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/* Get the current branch input value based on the input type
		 *
		 * @return - a single value or an array of values based on the type passed
		 */
		module.getCurrentValue = function(the_type) {

			var type = the_type;
			var values = [];
			var checkboxes_values = [];
			var current_value;
			var got_value;
			var input_holder;

			switch(type) {

				case EC.Const.TEXT:
					values.push($('div#branch-input-text input').val());
					got_value = values[0].trim();
					break;

				case EC.Const.TEXTAREA:
					values.push($('div#branch-input-textarea textarea').val());
					got_value = values[0].trim();
					break;

				case EC.Const.INTEGER:
					values.push($('div#branch-input-integer input').val());
					got_value = values[0].trim();
					break;

				case EC.Const.DECIMAL:
					values.push($('div#branch-input-decimal input#decimal-main').val());
					got_value = values[0].trim();
					break;

				case EC.Const.DATE:
					values.push($('div#branch-input-date input').val());
					got_value = values[0];
					break;

				case EC.Const.TIME:
					values.push($('div#branch-input-time input').val());
					got_value = values[0];
					break;

				case EC.Const.RADIO:

					input_holder = $('div#branch-input-radio input[type=radio]:checked');

					/* single selection radio: grab both value and "label":
					 * value is needed for the jumps/validation and label will be saved and displayed to users
					 */
					current_value = {
						value : "",
						index : ""
					};

					current_value.value = input_holder.val();
					   current_value.index = input_holder.attr("data-index");

					//if no value selected among the radio options, create an empty object with NO_OPTION_SELECTED label
                    if (current_value.value === undefined) {
                        current_value.value = EC.Const.NO_OPTION_SELECTED;
                        current_value.index = EC.Const.NO_OPTION_SELECTED;
                    } else {
                        current_value.value.trim();
                        current_value.index.trim();
                    }
					

					values.push(current_value);

					got_value = values[0];
					break;

				//multiple selection checkboxes
				case EC.Const.CHECKBOX:

					//loop through all the selected checkboxes
					$('div#branch-input-checkbox input[type=checkbox]:checked').each(function() {

						checkboxes_values.push({
							value : $(this).val().trim(),
							label : $(this).parent().text().trim()
						});

					});

					//cache empty string if no checkboxes are selected
					values.push((checkboxes_values.length === 0) ? EC.Const.NO_OPTION_SELECTED : checkboxes_values);

					got_value = values[0];
					break;

				case EC.Const.DROPDOWN:

					input_holder = $('div#branch-input-dropdown select option:selected');

					/* single selection dropdown" grab both value and "label":
					 * value is needed for the jumps/validation and label will be saved and displayed to users
					 */
					current_value = {
						value : "",
						index : ""
					};

					current_value.value = input_holder.val();
					current_value.index = input_holder.attr('data-index');

					//if the value is "0", for consistency set it to a default for unselected option
                    if (current_value.index === "0") {
                        current_value.index = EC.Const.NO_OPTION_SELECTED;
                    }

					values.push(current_value);
					got_value = values[0];
					break;

				case EC.Const.BARCODE:
					current_value = $('div#branch-input-barcode input.scan-result').val();
					values.push(current_value);
					//console.log("barcode current value is: " + current_value);
					got_value = values[0];
					break;

				case EC.Const.LOCATION:
					current_value = $('div#branch-input-location textarea#branch-set-location-result').val();
					values.push(current_value);
					got_value = values[0];
					break;

				case EC.Const.AUDIO:

					if (EC.Utils.isChrome()) {

						current_value = {
							cached : "...audio cached  uri...",
							stored : "...audio stored uri..."
						};

					} else {

						//console.log("getting audio file values");

						current_value = {
							cached : $('div#branch-input-audio input#cached-audio-uri').val(),
							stored : $('div#branch-input-audio input#stored-audio-uri').val()
						};

						//console.log('current_value ' + JSON.stringify(current_value));

					}

					values.push(current_value);
					got_value = values[0];
					break;

				case EC.Const.VIDEO:

					if (EC.Utils.isChrome()) {

						current_value = {
							cached : "...video cached  uri...",
							stored : "...video stored uri..."
						};

					} else {

						console.log("getting video file values");

						current_value = {
							cached : $('div#branch-input-video input#cached-video-uri').val(),
							stored : $('div#branch-input-video input#stored-video-uri').val()
						};

						console.log('current_value ' + JSON.stringify(current_value));

					}

					values.push(current_value);
					got_value = values[0];
					break;

				case EC.Const.PHOTO:

					//keep track of both cache value(image uri currently on canvas) and store value (image uri on the database)
					if (EC.Utils.isChrome()) {

						current_value = {
							cached : "placeholder.jpg",
							stored : "placeholder.jpg"
						};

					} else {

						current_value = {
							cached : $('div#branch-input-photo input#cached-image-uri').val(),
							stored : $('div#branch-input-photo input#stored-image-uri').val()
						};

						console.log('current_value ' + JSON.stringify(current_value));

					}

					values.push(current_value);
					got_value = values[0];
					break;

			}//switch

			return got_value;

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/**
		 * @method isEmptyPrimaryKey: Check whether a primary key exists in the array of branch values we are abut to save.
		 */
		module.isEmptyPrimaryKey = function() {

			var is_empty_primary_key = true;
			var branch_inputs_values = JSON.parse(window.localStorage.branch_inputs_values);
			var i;
			var iLength;

			if (branch_inputs_values) {
				iLength = branch_inputs_values.length;
				for ( i = 0; i < iLength; i++) {

					if (branch_inputs_values[i].is_primary_key === 1) {
						is_empty_primary_key = (branch_inputs_values[i].value === "") ? true : false;
					}
				}
			}

			return is_empty_primary_key;
		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/**
		 * @method setCachedBranchInputValue Set the current branch input value in localStorage, in the array branch_inputs_values
		 *
		 * (the value is then fetched from localStorage when the user navigate the branch form inputs back and forth
		 * and displayed on screen)
		 */

		module.setCachedInputValue = function(the_value, the_position, the_type, is_primary_key_flag) {

			var wls = window.localStorage;
			var branch_values;
			var value = the_value;
			var checkbox_values = [];
			var position = the_position;
			var index = position - 1;
			var type;
			var _id;
			var is_primary_key = is_primary_key_flag;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var i;
			var iLength;

			if (wls.branch_edit_mode) {

				_id = wls.branch_edit_id;
				type = wls.branch_edit_type;

			} else {

				_id = '';
				type = the_type;

			}

			//if the value is an object from either dropdown or radio inputs, cache the label only
			if (type === EC.Const.DROPDOWN || type === EC.Const.RADIO) {
				value = value.value;
			}

			//if the value is an array from checkboxes, cache an array of the labels
			if (type === EC.Const.CHECKBOX) {

				//if any checkbox was selected, get it, otherwise do nothing and let the value be EC.Const.NO_OPTION_SELECTED
				if (value !== EC.Const.NO_OPTION_SELECTED) {

					iLength = value.length;
					for ( i = 0; i < iLength; i++) {
						checkbox_values.push(value[i].value);
					}

					value = checkbox_values;
				}
			}

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_values = JSON.parse(wls.branch_inputs_values);
			} catch(error) {
				//Handle errors here
				branch_values = [];
			}

			//TODO: check against values length??? try when hidden key is last element of the form
			if (branch_values[index] !== null && index < branch_values.length) {

				//if the values already is cached in branch_inputs_values AND it is a primary_key AND it is a hidden auto generated key, do not override it but use that same value
				//This happens when the user is editing a branch form with an autogen key hidden, we do no want to override it
				if (branch_values[index].is_primary_key === 1 && is_genkey_hidden === 1) {
					value = branch_values[index].value;
				} else {

					branch_values[index] = {
						_id : _id,
						type : type,
						value : value,
						position : position,
						is_primary_key : is_primary_key
					};
				}

			} else {

				branch_values[index] = {
					_id : _id,
					type : type,
					value : value,
					position : position,
					is_primary_key : is_primary_key
				};
			}

			wls.branch_inputs_values = JSON.stringify(branch_values);
			console.log("branch_input_values: " + wls.branch_inputs_values, true);

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		var _isUniqueValue = function(the_value, the_branch_form_name) {

			var cached_branch_entry_keys;
			var current_branch_form_keys;
			var i;
			var iLength;
			var value = the_value;
			var branch_form_name = the_branch_form_name;
			var unique = true;

			//get Branch primary keys
			try {
				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);
			} catch (error) {
				cached_branch_entry_keys = [];
			}

			iLength = cached_branch_entry_keys.length;
			if (iLength > 0) {

				//get primary keys for the current form
				for ( i = 0; i < iLength; i++) {

					if (cached_branch_entry_keys[i].branch_form_name === branch_form_name) {

						current_branch_form_keys = cached_branch_entry_keys[i].primary_keys;

						//check if the current value clashes a branch primary key
						if (current_branch_form_keys.indexOf(value) !== -1) {
							unique = false;
						}
					}
				}
			}

			return unique;
		};

		module.validateValue = function(the_input, the_value, the_position) {

			var self = this;
			var input = the_input;
			var current_value = the_value;
			var current_position = the_position;
			var clone_value = "";
			var is_primary_key = $('span.label').attr('data-primary-key');
			var validation = {};

			//if we need to check for a double entry, get clone value
			if (parseInt(input.has_double_check, 10) === 1) {
				clone_value = self.getCloneValue(input.type);
			}

			//validate input
			validation = EC.Utils.isValidValue(input, current_value, clone_value);

			if (!validation.is_valid) {
				//value not valid, return
				return validation;
			}

			//check if this input value is a primary key field: if it is, check uniqueness (skip when we are editing)
			if (is_primary_key === 'true' && !window.localStorage.branch_edit_mode) {

				if (!_isUniqueValue(current_value)) {

					//primary key value already exist, return
					validation = {
						is_valid : false,
						message : "Value already exists!"
					};

					//on Chrome native alert is not working: dump to console error message
					console.log("Error: value already exists");

					return validation;
				}
			}

			return validation;

		};

		return module;

	}(EC.BranchInputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true */
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = ( function() {
		"use strict";

		var project_server_url;
		var project_name;
		var project_id;
		var form_name;
		var form_id;
		var chosen_form_id;
		var chosen_form_name;
		var entries;
		var data;

		function _commitRemoteEntry(the_single_remote_entry) {

			$.when(EC.Create.commitRemoteEntry(project_id, form_id, the_single_remote_entry)).then(function() {

				if (entries.length === 0) {

					if (data.length === 0) {

						EC.Notification.showToast("All data downloaded", "short");

						//@bug on iOS, spinner loader not hiding, force to hide
						// it here calling it directly with no timeout
						if (window.device.platform === EC.Const.IOS) {
							window.ActivityIndicator.hide();
						}

						//clear cached object for this form (table)
						window.localStorage.removeItem("dre_local_entries_keys");
						window.localStorage.removeItem("dre_inputs");

						//back to forms list
						EC.Routing.changePage(window.localStorage.back_nav_url);
					}
					else {

						entries = data.splice(0, 500);
						_commitRemoteEntry(entries.shift());
					}

				}
				else {
					_commitRemoteEntry(entries.shift());
				}

			}, function() {

				/* When downloading remote entries, if parent entry is missing on the device database the user needs to download from the parent table first
				* to keep the database referential integrity
				*/

				//TODO: get parent form name
				var parent_form = EC.Utils.getParentFormByChildID(chosen_form_id);

				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert("Error", "Parent keys for " + chosen_form_name + " are missing on device database, please download " + parent_form.name + " entries first");

			});

		}

		var _performRequest = function(the_url) {

			var url = the_url;
			var hash;

			$.ajax({
				url : url, //url
				type : 'get', //method type post or get
				crossDomain : true,
				timeout : 60000, // stop after 60 seconds
				dataType : 'json', //return data type
				success : function(the_data) {

					data = the_data;

					//console.log(JSON.stringify(data));

					if (data.length === 0) {
						//no entries on the server yet, go back to form list
						EC.Notification.showAlert("Sorry", "No remote entries for the selected form yet!");
					}
					else {
						entries = data.splice(0, 500);
						_commitRemoteEntry(entries.shift());
					}
				},
				error : function(request, status, error) {

					EC.Notification.hideProgressDialog();

					//@bug on the server, which is sending a full html page as
					// response when project is private
					if (request.responseText) {
						if (request.responseText.trim().charAt(0) === "<") {
							EC.Notification.showAlert("Sorry, private project", "This project is set as private therefore you cannot download data");
						}
					}

					if (status === "timeout" && error === "timeout") {
						EC.Notification.showAlert("Error", "Server Timeout");
					}

					//show request error
					console.log(status + ", " + error);
					console.log(request);
				}

			});

		};

		var fetchRemoteData = function() {

			EC.Notification.showProgressDialog();

			//get request ajax
			_performRequest(project_server_url + project_name + "/" + chosen_form_name + ".json");

		};

		var renderDownloadView = function() {

			var forms = JSON.parse(window.localStorage.forms);
			var i;
			var j;
			var iLength = forms.length;
			var jLength = iLength;
			var HTML = "";
			var dom_list = $('div#download div#download-forms');
			var page = $('#download');
			var form_btn;
			var form_tree;
			var hash = "forms.html?project=" + project_id + "&name=" + project_name;
			var back_btn = $("div#download div[data-role='header'] div[data-href='back-btn']");

			project_id = window.localStorage.project_id;
			project_name = window.localStorage.project_name;
			project_server_url = window.localStorage.project_server_url;

			//set back_nav_url for navigating back to forms list
			window.localStorage.back_nav_url = "forms.html?project=" + project_id + "&name=" + project_name;

			var _form_btn_handler = function() {

				//get chosen form data
				chosen_form_name = $(this).find("span").text();
				chosen_form_id = $(this).attr("id");

				//update form tree in localStorage
				form_tree = EC.Utils.getParentAndChildForms(chosen_form_id);
				window.localStorage.form_tree = JSON.stringify(form_tree);
				form_id = chosen_form_id;

				EC.Notification.askConfirm("Download remote data", "Are you sure to proceed? It might take some time", "EC.Download.fetchRemoteData");
			};

			//handle back button hash
			back_btn.off().one('vclick', function(e) {
				EC.Routing.changePage(window.localStorage.back_nav_url);
			});

			//build buttons
			for ( i = 0; i < iLength; i++) {
				HTML += '<div id="' + forms[i]._id + '" class="embedded-btn">';
				HTML += '<i class="fa fa-download  fa-fw fa-ep-embedded-btn"></i>';
				HTML += '<span class="v-nav-item-label">' + forms[i].name + '</span>';
				HTML += '</div>';
			}

			//add buttons to dom
			dom_list.append(HTML);

			//bind buttons
			for ( j = 0; j < jLength; j++) {
				form_btn = $("div#download div#download-forms div#" + forms[j]._id);
				form_btn.off().on('vclick', _form_btn_handler);
			}
		};

		return {
			fetchRemoteData : fetchRemoteData,
			renderDownloadView : renderDownloadView
		};

	}());

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {"use strict";

		module.getBranchEntriesList = function() {

			/* hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to;
			 * we need it as we need to link the branch entries to a single hierarchy form entry (like it is its parent)
			 */
			var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
			var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);
			var project_id = parseInt(window.localStorage.project_id, 10);
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var offset = 0;

			//look for branch entries
			$.when(EC.Select.getBranchEntries(project_id, branch_form.name, hierarchy_entry_key_value, 0)).then(function(the_branch_entries) {

				if (the_branch_entries.length > 0) {
					//entries found, render list
					EC.Entries.renderBranchEntriesList(the_branch_entries);
				} else {
					
					//no branch entries, user probably deleted all of them, go back to hierarchy form
					EC.BranchInputs.backToHierarchyForm();

				}

			});

		};

		return module;

	}(EC.Entries));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {
        "use strict";

        /**
         *
         * @param {String} the_hash_to_parse: Query string like
         * "branch_form_name=awesome_form&entry_key=1297f543-fe9e-4c01-e5a0-10512e7968b0"
         */
        module.getBranchEntryValues = function(the_hash_to_parse) {

            //get branch form name and entry key parsing the href
            var hash = the_hash_to_parse.split('?');
            var parent;
            var is_child_form_nav = window.localStorage.is_child_form_nav;
            var form = hash[1].split('&');
            var branch_form_name = form[0].replace("branch_form_name=", "");
            var entry_key = form[1].replace("entry_key=", "");
            var project_id = window.localStorage.project_id;

            /* hierarchy_entry_key_value is the current value of the primary key
             * for the form we want to enter branches to
             * we need it as we need to link the branch entries to a single main
             * form entry (like it is its parent)
             */
            var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
            var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);

            //cache hash to go back to branch-entry-values list when leaving an
            // edit action
            window.localStorage.branch_entry_values_url = "branch-entry-values.html?branch_form_name=" + branch_form_name + "&entry_key=" + entry_key;

            //Select all values stored for this entry THEN render view
            $.when(EC.Select.getBranchEntryValues(project_id, branch_form_name, entry_key, hierarchy_entry_key_value)).then(function(the_values) {

                //get inputs to map values against labels for dropdown, radio and
                // checkbox
                $.when(EC.Select.getBranchInputs(branch_form_name, project_id)).then(function(branch_inputs, has_jumps) {

                    //set inputs in memory
                    EC.BranchInputs.setInputs(branch_inputs, has_jumps);

                    EC.Entries.renderBranchEntryValues(the_values);

                    window.localStorage.removeItem("branch_has_new_jump_sequence");

                });

            });

        };

        return module;

    }(EC.Entries));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {
        "use strict";

        /**
         * @method getEntryValues Fetches the list of values for a single entry
         * (form)
         * @param {String} the_hash_to_parse Info about which data to fetch
         * "#values?form=1&entry_key=Kingston&direction=forward"
         *
         * #values we are requesting a list of values
         * form=1 The form id
         * entry_key=Kingston The value of the primary key for the selected entry
         * direction=forwardThe direction the user is navigating to
         *
         */
        module.getEntryValues = function(the_hash_to_parse) {

            //get form id and entry key parsing the href
            var hash = the_hash_to_parse.split('?');
            var wls = window.localStorage;
            var breadcrumbs_trail = [];
            var parent;
            var parent_path;
            var nav_parent_path;
            var is_child_form_nav = wls.is_child_form_nav;
            var form = hash[1].split('&');
            var form_id = form[0].replace("form=", "");
            var entry_key = form[1].replace("entry_key=", "");
            var direction = form[2].replace("direction=", "");
            var form_name = wls.form_name;
            var form_tree = JSON.parse(wls.form_tree);
            var entries_totals = [];
            var children;
            var current_view_url_parts;

            //cache current page url for navigation purposes
            current_view_url_parts = the_hash_to_parse.split("/");
            wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

            //update entry key in localStorage
            wls.entry_key = entry_key;

            //cache url to go back to entry-values list when leaving an edit
            // action
            wls.back_edit_nav_url = "entry-values.html?form=" + form_id + "&entry_key=" + entry_key + "&direction=" + EC.Const.EDITING;

            //try if a parent is defined, in that case we are selecting a child
            // entry from a child form list
            try {
                parent = form[3].replace("parent=", "");

                //remove any breadcrumbs for navigation
                wls.removeItem("breadcrumbs");

            } catch (e) {
                parent = "";
                console.log(e);
            }

            //get breadcrumb trail, first iteration will be "" when it is the top
            // form on the tree
            try {
                breadcrumbs_trail = JSON.parse(wls.breadcrumbs);
            } catch (error) {
                breadcrumbs_trail = [];
            }

            /* Get parent path from breadcrumbs (if not defined in localStorage
             * by a Store Edit action)
             * When saving a form, window.localStorage.parent_path is set in
             * EC.Inputs.buildRows
             * We need that value to uniquely identify a set of entries when
             * navigating down the tree structure.
             * It will be like key|key|key... so the full path to the root.
             */
            nav_parent_path = wls.parent_path;
            if (nav_parent_path === undefined) {
                parent_path = (breadcrumbs_trail[0] === "") ? breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            } else {
                //a parent path is defined, therefore we are coming back from the
                // inputs page after a "Store Edit" action
                parent_path = nav_parent_path;
            }

            //update breadcrumb trail based on navigation direction
            switch(direction) {

                case EC.Const.FORWARD:
                    breadcrumbs_trail.push(entry_key);

                    break;
                case EC.Const.BACKWARD:
                    breadcrumbs_trail.pop();
                    break;
                case EC.Const.EDITING:
                    console.log("back from editing");
                    //do nothing
                    break;
                case EC.Const.VIEW:

                    breadcrumbs_trail.push(entry_key);

                    break;

            }

            wls.setItem("breadcrumbs", JSON.stringify(breadcrumbs_trail));
            //window.localStorage.setItem("entries_totals",
            // JSON.stringify(breadcrumbs_trail));

            //get current form tree (parent and child form based on the active
            // one)
            form_tree = EC.Utils.getParentAndChildForms(form_id);

            if (parent !== "") {

                parent_path = (parent_path === "") ? parent : parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parent_path;
            }

            //if parent_path at this point is equal to the entry key, set it to
            // "" (It happens when tapping "Store Edit" after editing a form)
            if (parent_path === entry_key) {
                parent_path = "";

                //remove last element from breadcrumb trail
                breadcrumbs_trail = JSON.parse(wls.breadcrumbs);
                breadcrumbs_trail.pop();
                wls.setItem("breadcrumbs", JSON.stringify(breadcrumbs_trail));
            }

            //remove parent_path flag to restore normal navigation
            // (backward-forward)
            wls.removeItem("parent_path");

            //reset offset for entries pagination
            //wls.QUERY_ENTRIES_OFFSET = 0;

            //Select all values stored for this entry
            $.when(EC.Select.getEntryValues(form_id, entry_key, parent_path)).then(function(the_values) {

                //get inputs to map values against labels for dropdown, radio and
                // checkbox
                $.when(EC.Select.getInputs(form_id)).then(function(inputs, has_jumps) {

                    //set inputs in memory
                    EC.Inputs.setInputs(inputs, has_jumps);

                    //Render entry values list
                    EC.Entries.renderEntryValues(the_values);

                });

            });

        };

        return module;

    }(EC.Entries));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {"use strict";

		/**
		 *
		 * @param {String} the_hash_to_parse Query string with information about which data will need to be fetched
		 * like "#entries?form=1&name=University&entry_key=&direction=backward"
		 *
		 * #entries indicates we are requesting a list of entries
		 * form=1 The form id we are requesting entries for
		 * name=University The form name
		 * direction=backward The direction the user is navigating to (either forward or backward)
		 */
		module.getList = function(the_hash_to_parse) {

			var form_id;
			var form;
			var form_name;
			var form_tree;
			var entry_key;
			var direction;
			var children;
			var breadcrumbs_trail = [];
			var entries_totals = [];
			var parent_path;
			var nav_parent_path;
			var offset = 0;
			var parent_offset = 0;
			var children_offset = 0;
			var total;
			var current_view_url_parts;
			var wls = window.localStorage;

			//cache current page url for navigation purposes
			current_view_url_parts = the_hash_to_parse.split("/");
			wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

			//get form id parsing the href hash
			var hash = the_hash_to_parse.split('?');

			nav_parent_path = wls.parent_path;

			form = hash[1].split('&');
			form_id = form[0].replace("form=", "");
			form_name = form[1].replace("name=", "");
			entry_key = form[2].replace("entry_key=", "");
			direction = form[3].replace("direction=", "");

			children = parseInt(form[4].replace("children=", ""), 10);

			//get breadcrumb trail, first iteration will be "" when it is the top form on the tree
			breadcrumbs_trail = JSON.parse(wls.getItem("breadcrumbs")) || breadcrumbs_trail;

			//get total of entries, first iteration generate empty object
			entries_totals = JSON.parse(wls.getItem("entries_totals")) || entries_totals;

			//update breadcrumb trail and totals based on navigation direction
			switch(direction) {

				case EC.Const.FORWARD:

					breadcrumbs_trail.push(entry_key);

					if (entries_totals.length === breadcrumbs_trail.length - 1) {
						entries_totals.push({
							form : form_name,
							entry_key : entry_key,
							entries_total : children
						});
					}
					
					//delete cached entries when going forward
					window.localStorage.removeItem('cached_entries_list');

					break;
				case EC.Const.BACKWARD:
					breadcrumbs_trail.pop();
					entries_totals.pop();
					break;
				case EC.Const.EDITING:
					//to do
					break;
				case EC.Const.ADDING:
					//to do
					break;
				case EC.Const.VIEW:
					breadcrumbs_trail.pop();
					//to do
					break;

			}

			wls.setItem("breadcrumbs", JSON.stringify(breadcrumbs_trail));
			wls.setItem("entries_totals", JSON.stringify(entries_totals));

			//get current form tree (parent and child form based on the active one)
			form_tree = EC.Utils.getParentAndChildForms(form_id);
			wls.form_id = form_id;
			wls.form_name = form_name;
			wls.form_tree = JSON.stringify(form_tree);

			//select all entries for selected form based on tree structure
			if ((form_tree.parent > 0 && entry_key === "" && nav_parent_path === undefined) || wls.is_child_form_nav) {

				//we did not select the top form, select all the entries for the selected child form
				EC.Select.getChildEntries(form_id, parent_offset, children_offset);

				//set a flag to indicate we are in "child form navigation mode" i.e. user selected a child form in the forms list
				wls.is_child_form_nav = 1;

			} else {

				//top form was selected, remove child form navigation flag
				wls.removeItem("is_child_form_nav");

				if (nav_parent_path) {

					console.log(nav_parent_path);

					parent_path = nav_parent_path;

				} else {
					parent_path = (breadcrumbs_trail[0] === "") ? breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

				}

				//set parameters for pagination
				wls.load_more_parameters = JSON.stringify({
					form_id : form_id,
					parent_path : parent_path
				});

				//TODO: if there are entries cached and we are navigating back from a VIEW action, render the cached list

				if (direction === EC.Const.VIEW && window.localStorage.cached_entries_list) {
					//EC.Entries.renderCachedList();
					EC.Entries.renderList(JSON.parse(window.localStorage.cached_entries_list));
				} else {

					//if entry_key="" we are requesting the list of all entries (parent will be 0), typical when we are in the 'Forms' screen and select the top form
					$.when(EC.Select.getEntries(form_id, parent_path, offset)).then(function(the_entries) {
						EC.Entries.renderList(the_entries);
					});
				}

			}

		};

		return module;

	}(EC.Entries));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 *
 * Deals with:
 * -getting the list of entries for a form and render it
 * -getting list of values for a single entry and render it
 * -getting and rendering list of child entries, i.e. list of entries for a child
 * form grouped by the parent form. (When the user selects a form which is not
 * the top one)
 * -unsync a single entry (to be re-uploaded if needed)
 * -delete all entries for a form
 * -delete all media for a form, but keeping the data
 * -delete all synced entries, to free space on the device. It deletes only the
 * entries fully synced, (data + media)
 *
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = (function (module) {
    'use strict';
    /**
     * @method unsyncEntry
     *
     * unsync a single entry
     */
    module.unsyncEntry = function () {

        var rows_to_unsync = JSON.parse(window.localStorage.inputs_values);
        var project_id = parseInt(window.localStorage.project_id, 10);
        var entry_key = window.localStorage.entry_key;

        //unsync all the value rows for this entry
        $.when(EC.Update.unsyncOneHierarchyEntry(rows_to_unsync, entry_key, project_id)).then(function () {

            //close panel
            $('.entry-values-options').panel('close');

            //disable unsync btn
            $('div#entry-values div.entry-values-options ul li#unsync-entry').addClass('ui-disabled');

            EC.Notification.showToast(EC.Localise.getTranslation('entry_unsynced'), 'short');

        }, function () {

            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        });

    };

    module.unsyncAllEntries = function () {

        var forms = JSON.parse(window.localStorage.forms);
        var project_id = parseInt(window.localStorage.project_id, 10);

        //get all the rows to unsync
        $.when(EC.Update.unsyncAllEntries(forms, project_id)).then(function () {
            //close panel
            $('div#forms div#project-options').panel('close');

            //disable unsync entries button
            $('div#forms div#project-options ul li#unsync-all-data').addClass('ui-disabled');

            //disable delete sync entries button
            $('div#forms div#project-options ul li#delete-synced-entries').addClass('ui-disabled');

            EC.Notification.showToast(EC.Localise.getTranslation('all_data_synced'), 'short');

        }, function () {
            //close panel
            $('div#forms div#project-options').panel('close');
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        });

    };

    /**
     * @method deleteAllEntries Call model class to delete all the entris for
     * the currently selected project
     */
    module.deleteAllEntries = function () {

        var project_name = window.localStorage.project_name;

        $.when(EC.Delete.deleteAllEntries(EC.Const.DELETE, project_name)).then(function () {

            //disable related btns (we do not have any entries for this
            // project now)
            $('div#forms div#project-options ul li#delete-all-entries').addClass('ui-disabled');
            $('div#forms div#project-options ul li#delete-synced-entries').addClass('ui-disabled');
            $('div#forms div#project-options ul li#delete-media-files').addClass('ui-disabled');
            $('div#forms div#project-options ul li#unsync-all-data').addClass('ui-disabled');

            //update UI
            var forms_list_items = $('div#forms-list ul li');

            //update entry count bubbles in forms list
            forms_list_items.each(function (i) {

                if (i === 0) {
                    //set top form children count to 0
                    $(this).find('a').find('span.ui-li-count.ui-btn-up-c.ui-btn-corner-all').text('0');

                }
                else {
                    //disable children forms and hide bubble count
                    $(this).addClass('ui-disabled');
                    $(this).find('a').find('span.ui-li-count.ui-btn-up-c.ui-btn-corner-all').remove();

                }

            });

            //success
            $('#project-options').panel('close');
            EC.Notification.hideProgressDialog();
            EC.Notification.showToast(EC.Localise.getTranslation('all_entries_deleted'), 'short');

        }, function () {
            //error occurred
            $('#project-options').panel('close');
            EC.Notification.hideProgressDialog();
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        });
    };

    /**
     * @method deleteAllMedia Call model class to delete all the media files
     * for the currently selected project
     *
     */
    module.deleteAllMedia = function () {

        var project_name = window.localStorage.project_name;
        var forms = JSON.parse(window.localStorage.forms);

        if (!EC.Utils.isChrome()) {

            //delete media files (if any), project not deleted so 2nd argument is set to
            // false
            $.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function () {
                EC.Entries.allMediaDeletedFeedback(true);
            });

        }
        else {
            //in Chrome, just update database setting values to empty strings
            // - just for debugging
            EC.Update.emptyMediaValues(forms);
        }
    };

    /**
     * @method allEntriesDeletedFeedback
     * @param {boolean} is_positive State if the entries are deleted
     * successfully or not
     */
    module.allEntriesDeletedFeedback = function (is_positive) {

    };

    /**
     * @method allMediaDeletedFeedback Display feedback to user after media
     * deletion
     * @param {boolean} is_positive State if the media are deleted
     * successfully or not
     */
    module.allMediaDeletedFeedback = function (is_positive) {

        //close panel
        $('#project-options').panel('close');

        EC.Notification.hideProgressDialog();
        if (is_positive) {

            //disable delete media button
            $('div#forms div#project-options ul li#delete-media-files').addClass('ui-disabled');

            EC.Notification.showToast(EC.Localise.getTranslation('all_media_deleted'), 'short');
        }
        else {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        }
    };

    /**
     * @method deleteAllSynced Calls model class to delete all the entries
     * fully synced (data + media)
     */
    module.deleteAllSynced = function () {

        var forms = JSON.parse(window.localStorage.forms);
        var project_name = window.localStorage.project_name;
        var project_id = parseInt(window.localStorage.project_id, 10);

        //delete synced entries and media
        $.when(EC.Delete.deleteAllSynced(project_id, project_name, forms)).then(function () {
            _allSyncedDeletedFeedback(true);
        }, function () {
            _allSyncedDeletedFeedback(false);
        });

    };

    /**
     * @method allSyncedDeletedFeedback Display feedback to user after
     * deleting synced entries
     * @param {boolean} is_positive States id the synced entries are deleted
     * successufully or not
     */
    var _allSyncedDeletedFeedback = function (is_positive) {

        var forms_list = $('div#forms-list ul li');
        var deleted_entries = JSON.parse(window.localStorage.deleted_entries);
        var count;
        var current_count_holder;
        var current_form_list_item;

        //close panel
        $('#project-options').panel('close');

        //update entries count on DOM to show the user the correct amount
        // after deletion
        if (is_positive) {
            forms_list.each(function (i) {

                var new_count;

                current_form_list_item = $(this).find('a');
                current_count_holder = current_form_list_item.find('span.ui-li-count');

                new_count = parseInt(current_count_holder.text(), 10) - deleted_entries[i];

                console.log('new_count' + new_count);

                current_count_holder.text(new_count);

                if (new_count === 0 && i > 0) {
                    current_form_list_item.addClass('ui-disabled');
                }

            });
            EC.Notification.showToast(EC.Localise.getTranslation('all_synced_deleted'), 'short');
        }
        else {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        }
    };

    module.deleteEntry = function () {

        var rows_to_delete = JSON.parse(window.localStorage.inputs_values);
        var entry_key = window.localStorage.entry_key;
        var form_id = window.localStorage.form_id;
        var project_name = window.localStorage.project_name;

        //get hash from data-hef attribute
        window.localStorage.back_nav_url = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');

        //remove cache entries to request list gain after entry deletion
        window.localStorage.removeItem('cached_entries_list');

        //delete all the rows for this entry
        $.when(EC.Delete.deleteEntry(project_name, rows_to_delete, entry_key, form_id)).then(function (is_positive) {

            if (is_positive) {
                EC.Notification.showToast(EC.Localise.getTranslation('entry_deleted'), 'short');
                EC.Routing.changePage(window.localStorage.back_nav_url);
            }
            else {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic'));
            }
        });

    };

    /*
     * Delete a single branch entry and linked files
     */
    module.deleteBranchEntry = function () {

        var rows_to_delete = JSON.parse(window.localStorage.branch_inputs_values);

        //delete all the rows for this branch entry and linked files (if any)
        $.when(EC.Delete.deleteBranchEntry(rows_to_delete)).then(function () {

            EC.Notification.showToast(EC.Localise.getTranslation('branch_entry_deleted'), 'short');

            window.localStorage.removeItem('branch_edit_mode');

            EC.Routing.changePage('branch-entries-list.html');

        }, function () {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic'));
        });

    };

    module.addEntry = function () {

        var form_id = parseInt(window.localStorage.form_id, 10);

        EC.Notification.showProgressDialog();

        $.when(EC.Select.getInputs(form_id)).then(function (inputs, has_jumps, has_location) {

            //set inputs in memory
            EC.Inputs.setInputs(inputs, has_jumps, has_location);

            //render first input on the list or the selected position (-1) if
            // we are editing
            EC.Inputs.prepareFirstInput((window.localStorage.edit_position === undefined) ? inputs[0] : inputs[window.localStorage.edit_position - 1]);
        });
    };

    module.exportAllEntriesToCSV = function () {

        var project_id = window.localStorage.project_id;
        var forms = JSON.parse(window.localStorage.forms);

        EC.Notification.showProgressDialog();
        $.when(EC.Export.saveProjectDataToCSV(project_id, forms)).then(function (response) {

            var filename = response.filename;
            var folder = response.folder;

            //close panel
            $('#project-options').panel('close');
            EC.Notification.hideProgressDialog();
            EC.Notification.showAlert(EC.Localise.getTranslation('success'), filename + ' saved in folder: ' + folder);
        });
    };

    return module;

}(EC.Entries));


/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */

var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = (function (module) {
    'use strict';

    /**
     *  Bind Action Bar buttons tap events
     */
    var _bindBackBtn = function () {

        var back_btn = $('div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var form_name = window.localStorage.form_name;

        back_btn_label.text('Back to ' + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

        back_btn.off().one('vclick', function (e) {
            window.localStorage.back_from_branch = 1;
            EC.BranchInputs.backToHierarchyForm();
        });

    };

    var _buildList = function (the_branch_form_name, the_entries) {

        var branch_form_name = the_branch_form_name;
        var entries = the_entries;
        var i;
        var iLength = entries.length;
        var HTML = '';

        for (i = 0; i < iLength; i++) {

            //if no title set, use value of primary key as title
            entries[i].full_title = (entries[i].full_title === '') ? entries[i].entry_key : entries[i].full_title;

            HTML += '<li data-icon="false">';
            HTML += '<a href="branch-entry-values.html?branch_form_name=' + branch_form_name + '&entry_key=' + entries[i].entry_key + '">';
            HTML += entries[i].full_title;
            HTML += '</a>';
            HTML += '</li>';
        }//for

        return HTML;

    };

    module.renderBranchEntriesList = function (the_entries) {

        var self = this;
        var entries = the_entries;
        var dom_list = $('div#branch-entries-list ul');
        var branch_form = JSON.parse(window.localStorage.branch_form);
        var load_more_btn = $('div#branch-entries div#branch-entries-list div.more-items-btn');
        var load_more_spinner = $('div#branch-entries div#branch-entries-list div.more-items-btn-spinner');
        var offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
        var limit = parseInt(window.localStorage.QUERY_LIMIT, 10);
        var current_entries_total;
        var HTML;

        //reset entries offset
        window.localStorage.QUERY_ENTRIES_OFFSET = 0;

        //bind action bar buttons for this page
        _bindBackBtn();

        //show branch form name in the top bar
        $('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

        //show 'Show more' button if we have more entries to display
        if (current_entries_total > (offset + limit)) {
            load_more_btn.removeClass('hidden');
        } else {
            load_more_btn.addClass('hidden');
        }

        //bind 'show more button'
        load_more_btn.off().on('vclick', function (e) {

            //hide button and show loader
            $(this).addClass('hidden');
            load_more_spinner.removeClass('hidden');

            //increase offset
            offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
            offset += parseInt(window.localStorage.QUERY_LIMIT, 10);
            window.localStorage.QUERY_ENTRIES_OFFSET = offset;

            //get more entries
            self.getMoreEntries(offset);

        });

        //empty current list
        dom_list.empty();

        HTML = _buildList(branch_form.name, entries);

        dom_list.append(HTML);
        dom_list.listview('refresh');

        //hide spinning loader
        EC.Notification.hideProgressDialog();

    };

    module.getMoreBranchEntries = function (the_offset) {

        var load_more_parameters = JSON.parse(window.localStorage.load_more_parameters);
        var form_id = load_more_parameters.form_id;
        var parent_path = load_more_parameters.parent_path;
        var offset = the_offset;

        EC.Select.getEntries(form_id, parent_path, offset);
    };

    module.appendMoreBranchEntries = function (the_entries) {

        var dom_list = $('div#entries-list ul');
        var entries = the_entries;
        var form_id = parseInt(window.localStorage.form_id, 10);
        var HTML;
        var offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
        var limit = parseInt(window.localStorage.QUERY_LIMIT, 10);
        var totals;
        var current_entries_total;

        //get total of entries
        totals = JSON.parse(window.localStorage.entries_totals);
        current_entries_total = totals[totals.length - 1].entries_total;

        HTML = _buildList(form_id, entries);

        dom_list.append(HTML);
        dom_list.listview('refresh');
        dom_list.trigger('updatelayout');

        //show button and hide loader
        $('div#entries div#entries-list div.more-items-btn-spinner').addClass('hidden');

        if (current_entries_total > (offset + limit)) {
            $('div#entries div#entries-list div.more-items-btn').removeClass('hidden');
        }
    };

    return module;

}(EC.Entries));

/*global $, jQuery, cordova, device*/

/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};

EC.Entries = (function (module) {
    'use strict';

    var _bindActionBarBtns = function () {

        var back_btn = $('div#branch-entry-values div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = $('div#branch-entry-values div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var ctx_menu_btn = $('div#branch-entry-values div[data-role="controlgroup"] i[data-href="branch-entry-values-options"]');
        var delete_branch_entry_btn = $('div#branch-entry-values div#branch-entry-values-options ul li#delete-branch-entry');
        var entry_value_edit_btn = $('div#branch-entry-values div#branch-entry-values-list ul');
        var form_name = window.localStorage.form_name;
        var branch_form = JSON.parse(window.localStorage.branch_form);
        var project_id = window.localStorage.project_id;
        var unsync_entry_btn = $('div#entry-values div#entry-values-options ul li#unsync-entry');

        back_btn_label.text('Back to ' + branch_form.name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        back_btn.off().one('vclick', function (e) {

            //go back to branch entries list
            window.localStorage.removeItem('branch_edit_mode');
            EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
        });

        entry_value_edit_btn.off().on('vclick', 'i', function (e) {

            var hash = $(e.target).parent().attr('data-href');

            EC.Notification.showProgressDialog();

            if (hash) {

                //set edit position
                window.localStorage.branch_edit_position = parseInt(hash.replace('?position=', ''), 10);

                //get list of inputs for the branch form and render the first
                // one on screen
                EC.BranchInputs.getList(branch_form.name, project_id);

            }

            e.preventDefault();

        });

        delete_branch_entry_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_branch_entry'), EC.Localise.getTranslation('delete_entry_confirm'), 'EC.Entries.deleteBranchEntry');
        });

        ctx_menu_btn.off().on('vclick', function (e) {

            var panel = $('div#branch-entry-values-options');

            panel.panel('open');


            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });
        });
    };

    /**
     *
     * @param {String} the_values: values array
     */
    module.renderBranchEntryValues = function (the_values) {

        //build HTML
        var HTML = '';
        var i;
        var iLength;
        var values = the_values;
        var branch_inputs_values = [];
        var branch_inputs_trail = [];
        var dom_list = $('div#branch-entry-values-list ul');
        var form_id = parseInt(window.localStorage.form_id, 10);
        var branch_form = JSON.parse(window.localStorage.branch_form);
        var allow_download_edits = window.localStorage.allow_download_edits;
        var project_name = window.localStorage.project_name;
        var data_synced = 0;
        var formatted_location;
        var current_entries_total;
        var totals;
        var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
        var is_primary_key;
        var branch_inputs = EC.BranchInputs.getInputs();
        var labels;
        var dropdown_label;
        var radio_label;

        //bind buttons
        _bindActionBarBtns();

        //empty current list
        dom_list.empty();

        //show branch form name in the top bar
        $('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

        for (i = 0, iLength = values.length; i < iLength; i++) {

            data_synced += values[i].is_data_synced;

            //check if the current value is a primary key (it is only when
            // entry_key === value)
            is_primary_key = (values[i].value === values[i].entry_key) ? 1 : 0;

            /*
             * Build input_values array. by default a value is a single value
             * (string)
             * Media value is an object which contains the path to the stored
             * file and the path to the cached file (if any)
             * Checkbox values are saved as csv, but they are converted back
             * to array
             */
            switch (values[i].type) {

                //Checkbox values are saved as csv values: they are converted
                // back to array
                case EC.Const.CHECKBOX:
                    branch_inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value.split(','),
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.PHOTO :
                    branch_inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.AUDIO :
                    branch_inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.VIDEO :
                    branch_inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                default:
                    branch_inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value,
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
            }//switch

            //build input_trail array to be used for navigation between
            // inputs (skip _skipp3d_ values, to retain jump sequence)
            if (values[i].value !== EC.Const.SKIPPED) {

                branch_inputs_trail.push({
                    position: values[i].position,
                    label: values[i].label
                });

                //build list of values (_skipp3d_ values are skipped)
                HTML += '<li data-role="list-divider">';
                HTML += values[i].label;
                HTML += '</li>';
                HTML += '<li class="entry-value-btn-wrapper">';

                //format media and location values for displaying purposes
                switch (values[i].type) {

                    //show labels for checkbox choices, as tey are saved as
                    // values
                    case EC.Const.CHECKBOX:

                        labels = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                        HTML += '<span class="h-entry-value-label">' + labels.join(', ') + '</span>';

                        break;

                    case EC.Const.DROPDOWN:

                        dropdown_label = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                        HTML += '<span class="h-entry-value-label">' + dropdown_label + '</span>';

                        break;

                    case EC.Const.RADIO:

                        radio_label = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                        HTML += '<span class="h-entry-value-label">' + radio_label + '</span>';

                        break;

                    case EC.Const.LOCATION:

                        var location = values[i].value;
                        location = location.split(',');

                        var j;
                        var jLength = location.length;

                        for (j = 0; j < jLength; j++) {

                            HTML += '<span class="h-entry-value-label">' + location[j] + '<span>';

                        }
                        break;

                    case EC.Const.PHOTO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.AUDIO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.VIDEO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    default:
                        HTML += '<span class="h-entry-value-label">' + values[i].value + '</span>';

                }

                HTML += '<div class="entry-value-embedded-btn" data-href="?position=' + values[i].position + '">';

                //deal with remote entries and disable edit button if no
                // editable
                if (values[i].is_remote === 1) {

                    if (allow_download_edits === '1') {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                    } else {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn ui-disabled"></i>';
                    }

                } else {
                    HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                }

                HTML += '</div>';
                HTML += '</li>';

            }//if NOT skipped

        }//for

        //add values to localStorage 'branch_inputs_values', to be used to
        // pre-populate fields when editing
        window.localStorage.branch_inputs_values = JSON.stringify(branch_inputs_values);

        //add values to localStorage 'branch_inputs_trail', to navigate back
        // and forth input fields when editing
        window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

        dom_list.append(HTML);
        dom_list.listview('refresh');

        //Set 'editing mode' flag for branches
        window.localStorage.branch_edit_mode = 1;

        EC.Notification.hideProgressDialog();

    };

    return module;

}(EC.Entries));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/**
 * @module EC
 * @submodule Entries
 */

var EC = EC || {};
EC.Entries = ( function (module) {
    "use strict";

    var wls;

    /**
     *  Bind Action Bar buttons tap events
     */
    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $("div#entries div[data-role='header'] div[data-href='entries-nav-btn']");
        var home_btn = $("div#entries div[data-role='header'] div[data-href='home']");
        var settings_btn = $('div#entries div[data-role="header"] div#entries-nav-drawer ul li div[data-href="settings"]');
        var add_entry_btn = $("div#entries div[data-role='header'] i[data-href='add-entry']");
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $("#entries-nav-drawer");

            panel.panel("open");

            home_btn.off().one('vclick', function (e) {
                //reset offset, as when going back we make a new request for the first entries
                wls.QUERY_ENTRIES_OFFSET = 0;

                //trigger a pgae refresh when navigating back to project list
                wls.back_nav_url = "#refresh";
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                window.localStorage.reached_settings_view_from = $.mobile.activePage.attr("id");
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        //open inputs
        add_entry_btn.off().on('vclick', function (e) {
            EC.Entries.addEntry();
        });

        inactive_tab.off().on('vclick', function (e) {

            var project_id = wls.project_id;
            var project_name = wls.project_name;

            //get url from data-hef attribute
            var page = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr("data-href");

            EC.Routing.changePage(page);

        });

    };

    module.renderCachedList = function () {

        //build HTML
        var HTML = "";
        var back_href = "";
        var back_children;
        var i;
        var iLength;
        var dom_list = $('div#entries-list ul');
        var empty_entries_list = $("div#entries div#entries-list div#empty-entries-list");
        var empty_entries_list_form_name = $("div#entries div#entries-list div#empty-entries-list p span.form-name");
        var page = $('#entries');
        var header = $('div#entries div[data-role="header"] div[data-href="entries-nav-btn"] span.project-name');
        var trail;
        var inactive_label = "";
        var dom_back_home_btn = $('div#entries a.back-home');
        var action_bar_btn = $('div#entries div#entries-actionbar');
        var active_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var inactive_tab_hash = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
        var inactive_tab_label = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
        var form_id;
        var form_name;
        var form_tree;
        var project_name;
        var load_more_btn = $('div#entries div#entries-list div.more-items-btn');
        var load_more_spinner = $('div#entries div#entries-list div.more-items-btn-spinner');
        var self = this;
        var offset;
        var limit;
        var current_entries_total;
        var totals;

        wls = window.localStorage;
        form_id = parseInt(wls.form_id, 10);
        form_name = wls.form_name;
        form_tree = JSON.parse(wls.form_tree);
        project_name = wls.project_name;
        offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
        limit = parseInt(wls.QUERY_LIMIT, 10);

        //reset entries offset
        //TODO: do not do if cached...
        //wls.QUERY_ENTRIES_OFFSET = 0;

        //request pagination when going back
        totals = JSON.parse(wls.entries_totals);
        current_entries_total = totals[totals.length - 1].entries_total;
        //request pagination when going back
        back_children = (totals.length > 1) ? totals[totals.length - 2].entries_total : 0;

        //bind action bar buttons for this page
        _bindActionBarBtns();

        //show action bar buttons
        action_bar_btn.show();

        //show "Show more" button if we have more entries to display
        if (current_entries_total > (offset + limit)) {
            load_more_btn.removeClass('hidden');
        } else {
            load_more_btn.addClass('hidden');
        }

        //bind "show more button"
        load_more_btn.off().on('vclick', function (e) {

            /**
             * Embedded spinning loader works only on iOS, do not know why
             */

            if (window.device.platform === EC.Const.IOS) {
                //hide button and show loader
                $(this).addClass('hidden');
                load_more_spinner.removeClass('hidden');
            }

            if (window.device.platform === EC.Const.ANDROID) {
                EC.Notification.showProgressDialog();
            }

            //increase offset
            offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
            offset += parseInt(wls.QUERY_LIMIT, 10);
            wls.QUERY_ENTRIES_OFFSET = offset;

            //get more entries
            self.getMoreEntries(offset);

        });

        //empty current list
        dom_list.empty();

        //add project name to header
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        //check if this form is at the top of the tree so the back button will go back to the form page (#forms)
        if (form_tree.parent === 0) {

            inactive_label = "Forms";

            //build url
            back_href = "forms.html?project=" + wls.project_id + "&name=" + wls.project_name;

        } else {

            //this is a nested form, so we need to go back to the previous form in the stack based on what entry was selected
            trail = JSON.parse(wls.breadcrumbs);

            //breadcrumb label will indicate form and last element of the breadcrumb trail
            inactive_label = form_tree.pname + ": " + trail[trail.length - 1];

            //back button will have parent form and parent entry key (which is the next to last element in the breadcrumb trail)
            //and number of children (parent entries when going back) for pagination
            back_href += 'entries-list.html?form=' + form_tree.parent;
            back_href += '&name=' + form_tree.pname;
            back_href += '&entry_key=' + trail[trail.length - 2];
            back_href += '&direction=' + EC.Const.BACKWARD;
            back_href += '&children=' + back_children;
        }

        //update active tab name with the current active form
        active_tab.text(form_name);

        //update inactive tab
        inactive_tab_label.text(inactive_label);
        inactive_tab_hash.attr("data-href", back_href);

        dom_list.append(window.localStorage.cached_entries_list);

        //add form name to localStorage
        wls.form_name = form_name;
        wls.form_id = form_id;

        //remove navigation objects
        wls.removeItem("inputs_values");
        wls.removeItem("inputs_trail");
        wls.removeItem("current_position");
        wls.removeItem("back_edit_nav_url");

        //reset "editing mode" flags
        wls.removeItem("edit_mode");
        wls.removeItem("edit_position");
        wls.removeItem("edit_type");
        wls.removeItem("edit_id");

        EC.Notification.hideProgressDialog();
    };

    return module;

}(EC.Entries));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function (module) {
    "use strict";

    /**
     * @method renderChildEntriesList Renders the list of entries for a child form grouped by the immediate parent form primary key
     * It is triggered when the user selects a form other than the top one (the main parent)
     *
     * @param {Array} the_child_entries Array that contains the values of the primry key and all the children per each child form
     * {parent: the value of the immediate parent primary key
		 *  children (Array): {entry_key: the value of the primary key for this child,
		 * full_title: all the title values in csv,
		 * nested_children_count: the total of children belonging to this child entry, to be shown in the bubble count
		 * }
		 */

    var wls;

    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $("div#entries div[data-role='header'] div[data-href='entries-nav-btn']");
        var home_btn = $("div#entries div[data-role='header'] div[data-href='home']");
        var settings_btn = $('div#entries div[data-role="header"] div#entries-nav-drawer ul li div[data-href="settings"]');
        var add_entry_btn = $("div#entries div[data-role='header'] i[data-href='add-entry']");
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $("#entries-nav-drawer");

            panel.panel("open");

            home_btn.off().one('vclick', function (e) {
                //reset offset, as when going back we make a new request for the first entries
                wls.QUERY_ENTRIES_OFFSET = 0;

                //trigger a pgae refresh when navigating back to project list
                wls.back_nav_url = "#refresh";
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                wls.reached_settings_view_from = $.mobile.activePage.attr("id");
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        inactive_tab.off().on('vclick', function (e) {
            //get url from data-hef attribute
            var back_url = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr("data-href");
            EC.Routing.changePage(back_url);
        });

    };

    var _buildChildEntriesList = function (the_form_id, the_form_tree, the_entries) {

        var form_id = the_form_id;
        var form_tree = the_form_tree;
        var entries = the_entries;
        var full_parent = [];
        var i;
        var j;
        var iLength;
        var jLength;
        var HTML = "";

        //list child entries grouped by immediate parent
        for (i = 0, iLength = entries.length; i < iLength; i++) {

            HTML += '<div class="parent-entry-divider">';
            HTML += '<span>';

            //show only the immediate parent parsing the full parent
            full_parent = entries[i].parent.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            HTML += full_parent[full_parent.length - 1];

            HTML += '</span>';
            HTML += '<a id="' + entries[i].parent + '" class="context-add-child-entry" href="#"  data-ajax="false">';
            HTML += '<i class="fa fa-plus-square-o fa-ep fa-ep-in-list" data-href="add-project"></i>';
            HTML += '</a>';
            HTML += '</div>';

            //show all children
            jLength = entries[i].children.length;

            for (j = 0; j < jLength; j++) {

                //each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
                HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
                HTML += '<a href="entry-values.html?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
                HTML += entries[i].children[j].full_title;
                HTML += '</a>';

                // here we need to display the total of direct childrens for this entry (if not the last form)
                if (form_tree.child !== 0) {

                    HTML += '<span class="ui-li-count">';
                    HTML += entries[i].children[j].nested_children_count;
                    HTML += '</span>';
                }
                HTML += '</li>';

            }

        }//for

        //cache the last rendered parent (for pagination purposes) We will use this value when the user taps on "Show more"
        window.localStorage.last_parent = entries[entries.length - 1].parent;

        return HTML;

    };

    module.renderChildEntriesList = function (the_child_entries) {

        //build HTML
        var HTML = "";
        var back_href;
        var i;
        var iLength;
        var j;
        var jLength;
        var entries = the_child_entries;
        var dom_list = $('div#entries-list ul');
        var dom_back_home_btn = $('div#entries a.back-home');
        var action_bar_btn = $('div#entries div#entries-actionbar');
        var active_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var inactive_tab_hash = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
        var inactive_tab_label = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
        var page = $('#entries');
        var header = $('div#entries div[data-role="header"] div[data-href="back-btn"] span.project-name');
        var trail;
        var active_label = "";
        var inactive_label = "";
        var form_id = parseInt(window.localStorage.form_id, 10);
        var form_name = window.localStorage.form_name;
        var form_tree = JSON.parse(window.localStorage.form_tree);
        var project_id = window.localStorage.project_id;
        var project_name = window.localStorage.project_name;
        var load_more_btn = $('div#entries div#entries-list div.more-items-btn');
        var load_more_spinner = $('div#entries div#entries-list div.more-items-btn-spinner');
        var children_offset = parseInt(window.localStorage.QUERY_CHILD_ENTRIES_OFFSET, 10);
        var parent_offset = parseInt(window.localStorage.QUERY_PARENT_ENTRIES_OFFSET, 10);
        var entries_total;
        var self = this;

        wls = window.localStorage;

        //reset breadcrumbs, as if the user adds an entry from a child list, we will grab the full parent path from the dom, as we are not navigating the forms manually
        wls.breadcrumbs = JSON.stringify([""]);

        //bind action bar buttons for this page
        _bindActionBarBtns(form_id, form_tree, entries);

        //empty current list
        dom_list.empty();

        //hide action bar button (top right, add and menu)
        action_bar_btn.hide();

        if (entries.length > 0) {
            HTML = _buildChildEntriesList(form_id, form_tree, entries.slice(0));

        } else {

            /*no more child entries (when user deleted all the entries one by one from child entries list)
             so redirect to forms list*/
            EC.Forms.getList("forms.html?project=" + project_id + "&name=" + project_name);

        }

        //add project name to header
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        //check if this form is at the top of the tree so the back button will go back to the form page (#forms)
        inactive_label = "Forms";

        //build back button hash
        back_href = "forms.html?project=" + wls.project_id + "&name=" + wls.project_name;
        wls.back_nav_url = back_href;

        //update active tab name with the current active form
        active_label = form_name;

        //update active tab name with the current active form
        active_tab.text(form_name);

        //update inactive tab
        inactive_tab_label.text(inactive_label);
        inactive_tab_hash.attr("data-href", back_href);

        //append list and change page
        dom_list.append(HTML);
        dom_list.listview('refresh');

        //attach delegate event to all links to add a child entry for the selected parent
        dom_list.off().on('vclick', "a.context-add-child-entry", function () {

            //add parent of selected itme in breadcrumbs
            var breadcrumbs_trail = JSON.parse(wls.getItem("breadcrumbs")) || [];
            breadcrumbs_trail.push($(this).attr("id"));
            wls.breadcrumbs = JSON.stringify(breadcrumbs_trail);

            EC.Entries.addEntry();

        });

        //show "Show more" button if we have more entries to display
        entries_total = EC.Utils.getFormByID(form_id).entries;
        if (entries_total > (children_offset + wls.QUERY_LIMIT)) {
            load_more_btn.removeClass('hidden');
        } else {
            load_more_btn.addClass('hidden');
        }

        //bind "show more button"
        load_more_btn.off().on('vclick', function (e) {

            //hide button and show loader
            $(this).addClass('hidden');
            load_more_spinner.removeClass('hidden');

            //increase offset
            children_offset = parseInt(wls.QUERY_CHILD_ENTRIES_OFFSET, 10);
            children_offset += parseInt(wls.QUERY_LIMIT, 10);
            wls.QUERY_CHILD_ENTRIES_OFFSET = children_offset;

            //get more entries
            self.getMoreChildEntries(form_id, children_offset);

        });

        //set handler for context add button (in a child entries list)
        $('div#entries a.context-add-btn').off().on('vclick', function (e) {

            var parent_key = $(this).attr('id');
            var primary_keys = [];
            var breadcrumb_trail = [];

            //get all <li> but exclude list dividers
            var selected_list = $(this).parent().parent().find("li:not('.custom-divider')");

            //manually add parent key in breadcrumb trail as we are adding an entry from a child entries list
            breadcrumb_trail = parent_key.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            wls.breadcrumbs = JSON.stringify(breadcrumb_trail);

            //collect all primary key from data-entry-key attribute for selected list
            selected_list.each(function (i) {

                if ($(this).hasClass(parent_key)) {

                    console.log($(this).attr('data-entry-key'));
                    primary_keys.push($(this).attr('data-entry-key'));

                }
            });

            //store primary keys (for validate against duplication)
            wls.primary_keys = JSON.stringify(primary_keys);

            navigator.notification.activityStart("", "Loading...");

        });

        //add form name to localStorage
        wls.form_name = form_name;
        wls.form_id = form_id;

        //reset "editing mode" flags
        wls.removeItem("edit_mode");
        wls.removeItem("edit_position");
        wls.removeItem("edit_type");
        wls.removeItem("edit_id");

        //reset inputs values and trail
        wls.removeItem("inputs_values");
        wls.removeItem("inputs_trail");

        //reset child full parent path
        wls.removeItem("child_full_parent_path");

        //hide spinning loader
        EC.Notification.hideProgressDialog();

    };

    module.getMoreChildEntries = function (the_form_id, the_children_offset) {

        var form_id = the_form_id;
        var children_offset = the_children_offset;

        //EC.Select.getChildEntries(form_id, parent_offset, children_offset);
        EC.Select.getMoreChildEntries(form_id, children_offset);
    };

    module.appendMoreChildEntries = function (the_entries) {

        var entries = the_entries;
        var i;
        var j;
        var iLength = entries.length;
        var jLength;
        var dom_list = $('div#entries-list ul');
        var form_id = window.localStorage.form_id;
        var form_tree = JSON.parse(window.localStorage.form_tree);
        var load_more_btn = $('div#entries-list .more-items-btn');
        var HTML = "";
        var children_offset = parseInt(window.localStorage.QUERY_CHILD_ENTRIES_OFFSET, 10);
        var entries_total = EC.Utils.getFormByID(form_id).entries;
        var query_limit = parseInt(window.localStorage.QUERY_LIMIT, 10);

        for (i = 0, iLength = entries.length; i < iLength; i++) {

            //Check if we still have entries to append to the current parent
            if (entries[i].parent === window.localStorage.last_parent) {

                //show all children
                jLength = entries[i].children.length;
                for (j = 0; j < jLength; j++) {

                    //each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
                    HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
                    HTML += '<a href="#values?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
                    HTML += entries[i].children[j].full_title;
                    HTML += '</a>';

                    // here we need to display the total of direct childrens for this entry (if not the last form)
                    if (form_tree.child !== 0) {

                        HTML += '<span class="ui-li-count">';
                        HTML += entries[i].children[j].nested_children_count;
                        HTML += '</span>';
                    }
                    HTML += '</li>';

                }

            }

            //attach new parent and its entries
            else {

                //show parent key value as divider and context button to add an entry
                HTML += '<li data-role="list-divider">';
                HTML += entries[i].parent;
                HTML += '<a id="' + entries[i].parent + '" class="context-add-btn" href="views/inputs.html"  data-ajax="false">';
                HTML += '<i class="fa fa-plus-square-o fa-ep fa-fw fa-ep-in-list" data-href="add-project"></i>';
                HTML += '</a>';
                HTML += '</li>';

                //show all children
                jLength = entries[i].children.length;

                for (j = 0; j < jLength; j++) {

                    //each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
                    HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
                    HTML += '<a href="#values?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
                    HTML += entries[i].children[j].full_title;
                    HTML += '</a>';

                    // here we need to display the total of direct childrens for this entry (if not the last form)
                    if (form_tree.child !== 0) {

                        HTML += '<span class="ui-li-count">';
                        HTML += entries[i].children[j].nested_children_count;
                        HTML += '</span>';
                    }
                    HTML += '</li>';

                }

            }

        }//for

        //keep track of last parent which entries are listed on screen (it will be the first parent to search entries for when tapping "Show More")
        window.localStorage.last_parent = entries[entries.length - 1].parent;

        //append list
        dom_list.append(HTML);
        dom_list.listview("refresh");
        dom_list.trigger("updatelayout");

        //show button and hide loader (if there are more entries to show)
        $('div#entries div#entries-list div.more-items-btn-spinner').addClass('hidden');
        if (entries_total > (children_offset + query_limit)) {
            $('div#entries div#entries-list div.more-items-btn').removeClass('hidden');
        }

    };

    return module;

}(EC.Entries));

/*global $, jQuery, cordova, device*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = (function (module) {
    'use strict';

    /**
     * @method renderEntryValues Render a list of all the values for a single
     * entry
     * @param {the_values} array of values for a single entry (basically a
     * form filled in)
     * { _id: the row id
         *  created_on: timestamp when entry was saved forst time
         *  entry_key: value of primary key
         *  form_id: id of the form
         *  input_id: id of the input
         *  is_data_synced: if the value is data synced
         *  is_media_synced: if the value is media synced
         *  is_title: if this vaue is part of the title
         *  label: label for the field
         *  parent: value of the parent primary key
         *  position: the position of this field in the form fields sequence
         *  ref: the field ref
         *  type: the input type
         *  value: the input value}
     */

    var unsync_entry_btn;
    var wls;
    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $('div#entry-values div[data-role="header"] div[data-href="entry-values-nav-btn"]');
        var home_btn = $('div#entry-values div[data-role="header"] div[data-href="home"]');
        var settings_btn = $('div#entry-values div[data-role="header"] div#entry-values-nav-drawer ul li div[data-href="settings"]');
        var ctx_menu_btn = $('div#entry-values div[data-role="header"] div.ui-btn-right[data-href="entry-values-options"]');
        var delete_entry_btn = $('div#entry-values div.entry-values-options ul li#delete-entry');
        var inactive_tab = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var entry_value_btn = $('div#entry-values div#entry-values-list ul');
        var input_page_href = window.localStorage.input_page_href;

        //get hold of unsync button
        unsync_entry_btn = $('div#entry-values div.entry-values-options ul li#unsync-entry');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $('#entry-values-nav-drawer');
            panel.panel('open');

            home_btn.off().one('vclick', function (e) {
                //trigger a pgae refresh when navigating back to project list
                wls.back_nav_url = '#refresh';
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            });

            //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                window.localStorage.reached_settings_view_from = $.mobile.activePage.attr('id');
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        inactive_tab.off().on('vclick', function (e) {
            //get url from data-hef attribute
            var page = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');
            EC.Routing.changePage(page);
            //window.history.back(-1);
        });

        entry_value_btn.off().on('vclick', 'i', function (e) {

            var hash = $(e.target).parent().attr('data-href');
            var edit_position = parseInt(hash.replace('?position=', ''), 10);

            window.localStorage.edit_position = edit_position;
            window.localStorage.edit_mode = 1;

            //cache back_nav_hash, to be used for navigate back after an edit
            // action
            window.localStorage.back_nav_url = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');

            //open inputs page at the right input position
            EC.Entries.addEntry();

            e.preventDefault();

        });

        //attach event to context menu to button unsync this entry
        unsync_entry_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('unsync_entry'), EC.Localise.getTranslation('unsync_entry_confirm'), 'EC.Entries.unsyncEntry');
        });

        delete_entry_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_entry'), EC.Localise.getTranslation('delete_entry_with_children_confirm'), 'EC.Entries.deleteEntry');
        });

        ctx_menu_btn.off().on('vclick', function (e) {

            var panel = $('.entry-values-options');

            panel.panel('open');


            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });
        });
    };

    module.renderEntryValues = function (the_values) {

        //build HTML
        var HTML = '';
        var back_href;
        var back_children;
        var i;
        var iLength;
        var values = the_values;
        var inputs_values = [];
        var inputs_trail = [];
        var dom_list = $('div#entry-values-list ul');
        var page = $('#entry-values');
        var header = $('div#entry-values div[data-role="header"] div[data-href="entry-values-nav-btn"] span.project-name');
        var active_key = '';
        var entry_key = window.localStorage.entry_key;
        var active_tab_label = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
        var inactive_tab = $('div#entry-value div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var inactive_tab_hash = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
        var inactive_tab_label = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
        var form_id = parseInt(window.localStorage.form_id, 10);
        var form_name = window.localStorage.form_name;
        var form_tree = JSON.parse(window.localStorage.form_tree);
        var trail;
        var allow_download_edits = window.localStorage.allow_download_edits;
        var project_name = window.localStorage.project_name;
        var data_synced = 0;
        var formatted_location;
        var current_entries_total;
        var totals;
        var branch_values;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);
        var is_primary_key;
        var inputs = EC.Inputs.getInputs();
        var labels;
        var dropdown_label;
        var radio_label;

        wls = window.localStorage;

        //stop background watch position if any
        window.navigator.geolocation.clearWatch(wls.watch_position);
        window.localStorage.form_has_location = 0;

        //bind buttons
        _bindActionBarBtns();

        //Add selected entry key value as the active key (it is the default if no title specified)
        active_key = entry_key;

        //empty current list
        dom_list.empty();

        for (i = 0, iLength = values.length; i < iLength; i++) {

            data_synced += values[i].is_data_synced;

            //check if the current value is a primary key (it is onlt when
            // entry_key === value)
            is_primary_key = (values[i].value === values[i].entry_key) ? 1 : 0;


            //do we have at least a title field? If so, show the first title field value as active key
            if (parseInt(values[i].is_title, 10) === 1 && active_key === entry_key) {
                active_key = values[i].value;
            }

            /*
             * Build input_values array. by default a value is a single value
             * (string)
             * Media value is an object which contains the path to the stored
             * file and the path to the cached file (if any)
             * Checkbox values are saved as csv, but they are converted back
             * to array
             * Branch values represent the branch form name and its total of
             * entries
             */
            switch (values[i].type) {

                //Checkbox values are saved as csv values: they are converted
                // back to array
                case EC.Const.CHECKBOX:
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value.split(','),
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.PHOTO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.AUDIO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.VIDEO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                case EC.Const.BRANCH:

                    branch_values = values[i].value.split(',');
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            branch_form_name: branch_values[0],
                            branch_total_entries: parseInt(branch_values[1], 10)
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });

                    break;

                default:
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value,
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
            }//switch

            /* build input_trail array to be used for navigation between
             * inputs be aware that:
             *
             * - _skipp3d_ values are skipped, to retain jump sequence when
             * listing values
             * - if is_genkey_hidden is set to 1 and the value is a primary
             * key, do not show it
             *  (values[i].value === values[i].entry_key) i strue only if
             * that value is the the primary key
             */

            if (values[i].value !== EC.Const.SKIPPED && !(is_genkey_hidden === 1 && values[i].value === values[i].entry_key)) {

                inputs_trail.push({
                    position: values[i].position,
                    label: values[i].label
                });

                //build list of values (_skipp3d_ values are skipped)
                HTML += '<li data-role="list-divider">';
                HTML += values[i].label;
                HTML += '</li>';
                HTML += '<li class="entry-value-btn-wrapper">';

                //format media and location values for displaying purposes
                switch (values[i].type) {

                    //show labels for checkbox choices, as tey are saved as
                    // values
                    case EC.Const.CHECKBOX:

                        console.log('CHECKBOX');
                        console.log(values[i]);

                        labels = EC.Utils.mapLabelToValue(values[i], inputs);
                        HTML += '<span class="h-entry-value-label">' + labels.join(', ') + '</span>';

                        break;

                    case EC.Const.DROPDOWN:

                        console.log('DROPDOWN');
                        console.log(values[i]);

                        if (values[i].value !== '0') {
                            dropdown_label = EC.Utils.mapLabelToValue(values[i], inputs);
                        }
                        else {
                            dropdown_label = '';
                        }

                        HTML += '<span class="h-entry-value-label">' + dropdown_label + '</span>';

                        break;

                    case EC.Const.RADIO:

                        console.log('RADIO');
                        console.log(values[i]);

                        if (values[i].value !== '') {
                            radio_label = EC.Utils.mapLabelToValue(values[i], inputs);
                        }
                        else {
                            radio_label = '';
                        }


                        HTML += '<span class="h-entry-value-label">' + radio_label + '</span>';

                        break;

                    case EC.Const.LOCATION:

                        var location = values[i].value;
                        location = location.split(',');

                        var j;
                        var jLength = location.length;

                        for (j = 0; j < jLength; j++) {

                            HTML += '<span class="h-entry-value-label">' + location[j] + '<span>';

                        }
                        break;

                    case EC.Const.BRANCH:

                        //show branch form mane and total of entries (we set
                        // the branch_values array earlier)
                        HTML += '<span class="h-entry-value-label">' + branch_values[0] + '<br/>(' + branch_values[1] + ')' + '</span>';

                        break;

                    case EC.Const.PHOTO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.AUDIO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.VIDEO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    default:
                        HTML += '<span class="h-entry-value-label">' + values[i].value + '</span>';

                }

                HTML += '<div class="entry-value-embedded-btn" data-href="?position=' + values[i].position + '">';

                //deal with remote entries and disable edit button if no
                // editable
                if (values[i].is_remote === 1) {

                    if (allow_download_edits === '1') {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                    } else {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn ui-disabled"></i>';
                    }

                } else {
                    HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                }

                HTML += '</div>';
                HTML += '</li>';

            }//if NOT skipped

        }//for

        //add values to localStorage 'inputs_values', to be used to
        // pre-populate fields when editing
        window.localStorage.inputs_values = JSON.stringify(inputs_values);

        //add values to localStorage 'inputs_trail', to navigate back and
        // forth input fields when editing
        window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

        //add project name to header (top left)
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        /*
         * Build back button behaviour:
         */

        //check if this form is at the top of the tree so the back button
        // will go back to the form page (#forms)
        if (form_tree.parent === 0) {
            entry_key = '';
        } else {

            //this is a nested form, so we need to go back to the previous
            // form in the stack based on what entry was selected
            trail = JSON.parse(window.localStorage.breadcrumbs);

            entry_key = trail[trail.length - 2];

            //window.localStorage.breadcrumbs = JSON.stringify(trail);
        }

        //request pagination when going back to entries list
        totals = JSON.parse(window.localStorage.entries_totals);
        back_children = totals[totals.length - 1].entries_total;

        /*set hash to be used to list this entries when loading index.html
         * going back
         The direction will be VIEW as we are viewing(listing) the current
         form entries */
        back_href = '';
        back_href += 'entries-list.html?form=' + form_id;
        back_href += '&name=' + form_name;
        back_href += '&entry_key=' + entry_key;
        back_href += '&direction=' + EC.Const.VIEW;
        back_href += '&children=' + back_children;

        if (data_synced > 0) {
            //enable unsync-data button
            unsync_entry_btn.removeClass('ui-disabled');
        } else {
            //disable unsync-data button
            unsync_entry_btn.addClass('ui-disabled');
        }

        //update active tab name with the current active form
        active_tab_label.text(active_key);

        //update inactive tab with back navigation href
        inactive_tab_label.text(form_name);
        inactive_tab_hash.attr('data-href', back_href);

        //console.log(HTML);
        dom_list.append(HTML);

        //build page and refresh listview
        page.page();
        dom_list.listview('refresh');

        //set a flag as any time we go back from entry value list page we
        // need to show the list of entries for the previous selected entry
        //if entry_key is undefined, it is because we are coming back from a
        // 'Store Edit' action
        if (entry_key !== undefined) {
            window.localStorage.back_nav_url = back_href;
        }

        //Set 'editing mode' flag
        window.localStorage.edit_mode = 1;

        EC.Notification.hideProgressDialog();
    };

    return module;

}(EC.Entries));

/*global $, jQuery, cordova, device*/
/**
 * @module EC
 * @submodule Entries
 */

var EC = EC || {};
EC.Entries = (function (module) {
    'use strict';

    /**
     * @method renderList
     * Update the UI listing all the entries for a form. What is listed is all the
     * field values flagged as 'title'
     * If no title field is found, the value of the primary key of that form is shown
     * instead
     *
     * @param {array} the_entries Array with all the entries for a form.
     * Each element is like {children: 1, entry_key: 'Kingston', full_title:
		 * 'Kingston, KI6475746856'}
     * -children- is the number of child entries belonging to each parent entry (if
     * any)
     * -entry_key- value of the primary key for that form
     * -full_title- all the values flagged as title in csv format
     *
     */

    var wls;

    /**
     *  Bind Action Bar buttons tap events
     */
    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $('div#entries div[data-role="header"] div[data-href="entries-nav-btn"]');
        var home_btn = $('div#entries div[data-role="header"] div[data-href="home"]');
        var settings_btn = $('div#entries div[data-role="header"] div#entries-nav-drawer ul li div[data-href="settings"]');
        var add_entry_btn = $('div#entries div[data-role="header"] i[data-href="add-entry"]');
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $('#entries-nav-drawer');

            panel.panel('open');

            home_btn.off().one('vclick', function (e) {
                //reset offset, as when going back we make a new request for the first entries
                wls.QUERY_ENTRIES_OFFSET = 0;

                //trigger a pgae refresh when navigating back to project list
                wls.back_nav_url = '#refresh';
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                wls.reached_settings_view_from = $.mobile.activePage.attr('id');
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        //open inputs
        add_entry_btn.off().on('vclick', function (e) {
            EC.Entries.addEntry();
        });

        inactive_tab.off().on('vclick', function (e) {

            var project_id = wls.project_id;
            var project_name = wls.project_name;

            //get url from data-hef attribute
            var page = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');

            EC.Routing.changePage(page);

        });

    };

    var _buildList = function (the_form_id, the_form_tree, the_entries) {

        var form_id = the_form_id;
        var form_tree = the_form_tree;
        var entries = the_entries;
        var i;
        var iLength = entries.length;
        var HTML = '';

        //if it is the last form, show single list view row with no nested children (no
        // right button)
        if (form_tree.child === 0) {
            for (i = 0; i < iLength; i++) {

                //if no title set, use value of primary key as title
                entries[i].full_title = (entries[i].full_title === '') ? entries[i].entry_key : entries[i].full_title;

                HTML += '<li data-icon="false">';
                HTML += '<a href="entry-values.html?form=' + form_id + '&entry_key=' + entries[i].entry_key + '&direction=' + EC.Const.FORWARD + '">';

                //show full entries title removing last comma if any
                HTML += entries[i].full_title.replace(/,\s*$/, '');
                HTML += '</a>';
                HTML += '</li>';
            }//for

        }
        else {

            //split listview to show a button on the right to navigate down the form tree
            // entries and a button to list the inputs for the entry
            for (i = 0,
                     iLength = entries.length; i < iLength; i++) {

                //if no title set, use value of primary key as title
                entries[i].full_title = (entries[i].full_title === '') ? entries[i].entry_key : entries[i].full_title;

                //render entry as a button to view the entry (direction =  VIEW)
                HTML += '<li data-icon="ep-next-page">';
                HTML += '<a href="entry-values.html?form=' + form_id;
                HTML += '&entry_key=' + entries[i].entry_key;
                HTML += '&direction=' + EC.Const.VIEW;
                HTML += '">';

                //show full entries title removing last comma if any
                HTML += entries[i].full_title.replace(/,\s*$/, '');
                HTML += '</a>';

                //render button to go to children entries for that entry (direction = FORWARD)
                HTML += '<a href="entries-list.html?form=' + form_tree.child;
                HTML += '&name=' + form_tree.cname;
                HTML += '&entry_key=' + entries[i].entry_key;
                HTML += '&direction=' + EC.Const.FORWARD;
                HTML += '&children=' + entries[i].children;
                HTML += '">';
                HTML += '</a>';
                // here we need to display the total of direct children for this entry
                HTML += '<span class="ui-li-count">' + entries[i].children;
                HTML += '</span>';
                HTML += '</li>';
            }//for
        }

        return HTML;

    };

    module.renderList = function (the_entries) {

        //build HTML
        var HTML = '';
        var back_href = '';
        var back_children;
        var i;
        var iLength;
        var entries = the_entries;
        var dom_list = $('div#entries-list ul');
        var empty_entries_list = $('div#entries div#entries-list div#empty-entries-list');
        var empty_entries_list_form_name = $('div#entries div#entries-list div#empty-entries-list p span.form-name');
        var page = $('#entries');
        var header = $('div#entries div[data-role="header"] div[data-href="entries-nav-btn"] span.project-name');
        var trail;
        var inactive_label = '';
        var dom_back_home_btn = $('div#entries a.back-home');
        var action_bar_btn = $('div#entries div#entries-actionbar');
        var active_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
        var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var inactive_tab_hash = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
        var inactive_tab_label = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
        var form_id;
        var form_name;
        var form_tree;
        var project_name;
        var load_more_btn = $('div#entries div#entries-list div.more-items-btn');
        var load_more_spinner = $('div#entries div#entries-list div.more-items-btn-spinner');
        var self = this;
        var offset;
        var limit;
        var current_entries_total;
        var totals;

        wls = window.localStorage;
        form_id = parseInt(wls.form_id, 10);
        form_name = wls.form_name;
        form_tree = JSON.parse(wls.form_tree);
        project_name = wls.project_name;
        offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
        limit = parseInt(wls.QUERY_LIMIT, 10);

        //reset entries offset if we are not using the cached entries
        if (!window.localStorage.cached_entries_list) {
            wls.QUERY_ENTRIES_OFFSET = 0;
        }

        //stop background watch position if any
        window.navigator.geolocation.clearWatch(window.localStorage.watch_position);
        window.localStorage.form_has_location = 0;

        //request pagination when going back
        totals = JSON.parse(wls.entries_totals);
        current_entries_total = totals[totals.length - 1].entries_total;
        //request pagination when going back
        back_children = (totals.length > 1) ? totals[totals.length - 2].entries_total : 0;

        //bind action bar buttons for this page
        _bindActionBarBtns();

        //show action bar buttons
        action_bar_btn.show();

        //show 'Show more' button if we have more entries to display
        if (current_entries_total > (offset + limit)) {
            load_more_btn.removeClass('hidden');
        }
        else {
            load_more_btn.addClass('hidden');
        }

        //bind 'show more button'
        load_more_btn.off().on('vclick', function (e) {

            /**
             * Embedded spinning loader works only on iOS, do not know why
             */

            if (window.device.platform === EC.Const.IOS) {
                //hide button and show loader
                $(this).addClass('hidden');
                load_more_spinner.removeClass('hidden');
            }

            if (window.device.platform === EC.Const.ANDROID) {
                EC.Notification.showProgressDialog();
            }

            //increase offset
            offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
            offset += parseInt(wls.QUERY_LIMIT, 10);
            wls.QUERY_ENTRIES_OFFSET = offset;

            //get more entries
            self.getMoreEntries(offset);

        });

        //empty current list
        dom_list.empty();

        //if we have entries, list them
        if (entries.length > 0) {

            //hide empty list message (no entries found)
            empty_entries_list.addClass('hidden');
            dom_list.removeClass('hidden');

            //build list of entries markup
            HTML = _buildList(form_id, form_tree, entries);

        }
        else {

            //no entries found
            //hide empty list message (no entries found)
            empty_entries_list.removeClass('hidden');
            dom_list.addClass('hidden');

            empty_entries_list_form_name.text(form_name);

        }

        //add project name to header
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        //check if this form is at the top of the tree so the back button will go back to
        // the form page (#forms)
        if (form_tree.parent === 0) {

            inactive_label = 'Forms';

            //build url
            back_href = 'forms.html?project=' + wls.project_id + '&name=' + wls.project_name;

        }
        else {

            //this is a nested form, so we need to go back to the previous form in the stack
            // based on what entry was selected
            trail = JSON.parse(wls.breadcrumbs);

            //breadcrumb label will indicate form and last element of the breadcrumb trail
            //todo we remove the entry key from being displayed (as 99% of the time is autogenerated and not human readable)
            //tofdo we should cjeck for auto gen key and display the entry in the navigation only when the ky is entered by the user
            //inactive_label = form_tree.pname + ': ' + trail[trail.length - 1];
            inactive_label = form_tree.pname;

            //back button will have parent form and parent entry key (which is the next to
            // last element in the breadcrumb trail)
            //and number of children (parent entries when going back) for pagination
            back_href += 'entries-list.html?form=' + form_tree.parent;
            back_href += '&name=' + form_tree.pname;
            back_href += '&entry_key=' + trail[trail.length - 2];
            back_href += '&direction=' + EC.Const.BACKWARD;
            back_href += '&children=' + back_children;
        }

        //update active tab name with the current active form
        active_tab.text(form_name);

        //update inactive tab
        inactive_tab_label.text(inactive_label);
        inactive_tab_hash.attr('data-href', back_href);

        if (entries.length > 0) {
            dom_list.append(HTML);
            dom_list.listview('refresh');
        }

        //add form name to localStorage
        wls.form_name = form_name;
        wls.form_id = form_id;

        //remove navigation objects
        wls.removeItem('inputs_values');
        wls.removeItem('inputs_trail');
        wls.removeItem('current_position');
        wls.removeItem('back_edit_nav_url');

        //reset 'editing mode' flags
        wls.removeItem('edit_mode');
        wls.removeItem('edit_position');
        wls.removeItem('edit_type');
        wls.removeItem('edit_id');

        //handle tap on list item: cache Y position from top of screen, to silently
        // scroll to position when navigating back from single entry values
        $('div#entries-list ul li').off().on('vclick', function () {
            console.log($(this).position().top);
            //window.localStorage.previous_tapped_entry_Y = $(this).offset().top;
            window.localStorage.previous_tapped_entry_Y = $(this).position().top;

        });

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //cache current entries
        window.localStorage.cached_entries_list = JSON.stringify(entries);

        EC.Notification.hideProgressDialog();
    };

    module.getMoreEntries = function (the_offset) {

        var load_more_parameters = JSON.parse(wls.load_more_parameters);
        var form_id = load_more_parameters.form_id;
        var parent_path = load_more_parameters.parent_path;
        var offset = the_offset;

        EC.Select.getEntries(form_id, parent_path, offset);
    };

    module.appendMoreEntries = function (the_entries) {

        var dom_list = $('div#entries-list ul');
        var entries = the_entries;
        var form_id = parseInt(wls.form_id, 10);
        var form_name = wls.form_name;
        var form_tree = JSON.parse(wls.form_tree);
        var project_name = wls.project_name;
        var load_more_btn = $('div#entries-list .more-items-btn');
        var HTML = '';
        var offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
        var limit = parseInt(wls.QUERY_LIMIT, 10);
        var totals;
        var current_entries_total;
        var cached_entries;

        //get total of entries
        totals = JSON.parse(wls.entries_totals);
        current_entries_total = totals[totals.length - 1].entries_total;

        HTML = _buildList(form_id, form_tree, entries);

        dom_list.append(HTML);
        dom_list.listview('refresh');
        dom_list.trigger('updatelayout');

        //handle tap on list item: cache Y position from top of screen, to silently
        // scroll to position when navigating back from single entry values
        $('div#entries-list ul li').off().on('vclick', function () {
            console.log($(this).position().top);
            //window.localStorage.previous_tapped_entry_Y = $(this).offset().top;
            window.localStorage.previous_tapped_entry_Y = $(this).position().top;

        });

        //show button and hide loader
        if (window.device.platform === EC.Const.IOS) {
            $('div#entries div#entries-list div.more-items-btn-spinner').addClass('hidden');
        }
        if (window.device.platform === EC.Const.ANDROID) {
            EC.Notification.hideProgressDialog();
        }

        if (current_entries_total > (offset + limit)) {
            $('div#entries div#entries-list div.more-items-btn').removeClass('hidden');
        }

        //cache new entries
        cached_entries = JSON.parse(window.localStorage.cached_entries_list);
        window.localStorage.cached_entries_list = JSON.stringify(cached_entries.concat(entries));

    };

    return module;

}(EC.Entries));

/* global LocalFileSystem */
var EC = EC || {};
EC.EmailBackup = EC.EmailBackup || {};
EC.EmailBackup = (function () {
    'use strict';

    var project_name;
    var project_id;
    var mailto;
    var backup_path;
    var filename;

    var _getBackupPath = function (the_project_name) {

        filename = the_project_name + '.txt';

        //todo this needs to be fixed
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, gotFSfail);

        function gotFS(the_fileSystem) {

            backup_path = the_fileSystem.root.nativeURL + filename;

            console.log('Backup path: ' + backup_path);

            //remove file:// from path for iOS
            if (window.device.platform === EC.Const.IOS) {
                backup_path = backup_path.slice(7);
            }

        }

        function gotFSfail(the_error) {
            console.log(the_error);
        }

    };

    var renderSendEmailView = function () {

        var mailto_holder = $('div#email-backup div#email-address-wrapper input#email-address');
        var send_email_btn = $('div#email-backup div[data-role="header"] div#send-email');
        var back_btn = $('div#email-backup div[data-role="header"] div[data-href="back-btn"]');
        var subject;
        var body;
        var back_btn_href;

        project_name = window.localStorage.project_name;
        project_id = window.localStorage.project_id;
        back_btn_href = 'forms.html?project=' + project_id + '&name=' + project_name;

        back_btn.off().one('vclick', function () {
            //go back to previuos page in history
            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            }
            else {
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            }
        });

        //Set header
        $('div#email-backup div[data-role="navbar"] ul li.title-tab span#email-backup-label span.project-name-inline').text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        subject = 'Backup for ' + project_name;
        body = 'The backup for project ' + project_name + ' is attached';

        //set backup full path variable (async)
        _getBackupPath(project_name);

        function sendingStatus(res) {

            console.log('Email result: ' + res);

        }


        send_email_btn.off().on('vclick', function (e) {

            if (!EC.Utils.hasConnection()) {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('no_internet'));
                return;
            }

            //get email address from input
            mailto = mailto_holder.val();

            //validate email address
            if (mailto === '' || !EC.Utils.isValidEmail(mailto)) {

                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('invalid_email'));
                return;
            }

            //check if a mail client is setup on the device
            window.plugin.email.isServiceAvailable(function (is_available) {

                //no mail client set up yet? Warn user
                if (!is_available) {
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('invalid_email_client'));
                    return;
                }

                //open mail UI
                window.plugin.email.open({
                    to: [mailto], // email addresses for TO field
                    cc: [], // email addresses for CC field
                    bcc: [], // email addresses for BCC field
                    attachments: [backup_path], //
                    subject: subject, // subject of the email
                    body: body, // email body (could be HTML code, in this case set isHtml to true)
                    isHtml: true// indicates if the body is HTML or plain text
                }, function () {
                    console.log('email view dismissed');
                }, this);

            });

        });

    };

    return {
        renderSendEmailView: renderSendEmailView
    };

}());

/* global Papa*/
var EC = EC || {};
EC.Export = EC.Export || {};
EC.Export.saveProjectDataToCSV = function (the_project_id, the_forms) {
    'use strict';

    var deferred = new $.Deferred();
    var project_id = project_id;
    var forms = the_forms;
    var parsed_forms_json;

    function _parseFormAllEntries(the_form, has_parent_flag) {

        var form = the_form;
        var iLength = form.total_entries;
        var i;
        var json = [];
        var single_entry_raw;
        var has_parent = has_parent_flag;


        //per each entry belonging to the current form, generate a json as key:value pair
        for (i = 0; i < iLength; i++) {
            single_entry_raw = form.data_rows.splice(0, form.total_inputs);
            json.push(_parseSingleEntry(single_entry_raw, has_parent));
        }
        return json;
    }

    //each entry has got a number of inputs to define a single entry. Split each entry as key-value pairs
    function _parseSingleEntry(the_single_raw_entry, has_parent_flag) {

        var i;
        var single_entry_raw = the_single_raw_entry;
        var iLength = single_entry_raw.length;
        var single_entry_parsed = {};
        var has_parent = has_parent_flag;
        var parent_key_ref;
        var parent_key_ref_value;
        var temp;
        var location_value;
        var coords = {};

        //for child entries, we need the value of the parent key, so we can link a child form csv to its parent on the server
        if (has_parent) {
            parent_key_ref = EC.Utils.getFormParentPrimaryKeyRef(single_entry_raw[0].form_id);
            temp = single_entry_raw[0].parent.split('|');
            parent_key_ref_value = temp[temp.length - 1];
            single_entry_parsed[parent_key_ref] = parent_key_ref_value;
        }

        //loop each value for a single entry and generate an object listing all ref:value as the key:value pairs
        for (i = 0; i < iLength; i++) {

            //console.log('raw entry ****************************');
            //console.log(single_entry_raw[i]);

            //replace '_skipp3ed' with empty values
            if (single_entry_raw[i].value === EC.Const.SKIPPED) {
                single_entry_raw[i].value = '';
            }


            //split location value to components (as)expected on server
            if (single_entry_raw[i].type === EC.Const.LOCATION) {

                //remove formatting
                location_value = single_entry_raw[i].value.replace('\n', '').replace('\r', '');

                //split the location values to different parts (as expected on Epicollect+ server)
                if (location_value === '') {
                    //fill with empty values
                    single_entry_parsed[single_entry_raw[i].ref + '_lat'] = '';
                    single_entry_parsed[single_entry_raw[i].ref + '_lon'] = '';
                    single_entry_parsed[single_entry_raw[i].ref + '_acc'] = '';
                    single_entry_parsed[single_entry_raw[i].ref + '_alt'] = '';
                    single_entry_parsed[single_entry_raw[i].ref + '_bearing'] = '';
                }
                else {
                    //fill with components values
                    coords = EC.Utils.parseLocationString(single_entry_raw[i].value);
                    single_entry_parsed[single_entry_raw[i].ref + '_lat'] = coords.latitude;
                    single_entry_parsed[single_entry_raw[i].ref + '_lon'] = coords.longitude;
                    single_entry_parsed[single_entry_raw[i].ref + '_acc'] = coords.accuracy;
                    single_entry_parsed[single_entry_raw[i].ref + '_alt'] = coords.altitude;
                    single_entry_parsed[single_entry_raw[i].ref + '_bearing'] = coords.heading;
                }
            }
            else {
                single_entry_parsed[single_entry_raw[i].ref] = single_entry_raw[i].value;
            }
        }
        // console.log('Entry ' + i + ' content ********************************');
        // console.log(single_entry_parsed);
        return single_entry_parsed;
    }

    //get data rows for all the forms for this project
    $.when(EC.Select.getAllProjectEntries(forms, project_id)).then(function (data) {
        console.log(data);

        var i;
        var iLength = data.length;

        parsed_forms_json = [];

        //per each form parse all the entries, also set form mane and list headers
        for (i = 0; i < iLength; i++) {

            parsed_forms_json[i] = {
                name: data[i].form_name,
                entries: []
            };
            //parse entries to get a proper object for the csv conversion. We pass in a flag to determine if the form is the main parent or not
            parsed_forms_json[i].entries = _parseFormAllEntries(data[i], (i !== 0));
        }
        console.log('parsed_forms_json **********************************************');
        console.log(parsed_forms_json);

        //write csv files, one per each form
        $.when(EC.File.writeProjectDataAsCSV(window.localStorage.project_name, parsed_forms_json)).then(function (response) {
            deferred.resolve(response);
        });
    });

    return deferred.promise();
};


/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Forms = EC.Forms || {};
EC.Forms = ( function (module) {
    "use strict";

    module.getList = function (the_hash_to_parse) {

        //get the requested form parsing the href
        var hash = the_hash_to_parse.split('?');
        var params = hash[1].split('&');
        var project_id = params[0].replace("project=", "");
        var project_name = params[1].replace("name=", "");
        var wls = window.localStorage;
        var current_view_url_parts;

        //cache current page url for navigation purposes
        current_view_url_parts = the_hash_to_parse.split("/");
        wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

        //set project 'id' and 'name' in localStorage for navigation
        wls.project_id = project_id;
        wls.project_name = project_name;

        //check if this project has a backup file saved and set result in localStorage (device only)
        if (!EC.Utils.isChrome()) {
            $.when(EC.File.hasBackup(project_name)).then(function () {
                wls.has_backup = 1;
            }, function () {
                wls.removeItem("has_backup");
            });
        }

        //set allow_download_edits flag in LocalStorage
        $.when(EC.Select.getAllowDownloadEdits(project_id)).then(function () {
            wls.allow_download_edits = 1;
        }, function () {
            wls.allow_download_edits = 0;
        });

        //show forms list
        $.when(EC.Select.getForms(project_id)).then(function (the_forms, the_btn_states) {

            //reset offset for entries pagination
            wls.QUERY_ENTRIES_OFFSET = 0;
            wls.QUERY_CHILD_ENTRIES_OFFSET = 0;
            wls.QUERY_PARENT_ENTRIES_OFFSET = 0;

            //reset other flags for pagination
            wls.removeItem("last_parent");
            wls.removeItem("entry_key");
            wls.removeItem("form_has_jumps");
            wls.removeItem("load_more_parameters");
            wls.removeItem("current_position");

            //remove child form navigation flag
            wls.removeItem("is_child_form_nav");

            //remove flag that disable store edit from an intermediate screen
            wls.removeItem("has_new_jump_sequence");

            //reset navigation TODO: check this, experimental
            wls.removeItem("back_nav_url");

            //TODO: to be tested:
            //remove cached entries
            wls.removeItem("cached_entries_list");

            wls.removeItem("previous_tapped_entry_Y");


            EC.Forms.renderList(the_forms, the_btn_states);
        });

    };

    return module;
}(EC.Forms));

var EC = EC || {};
EC.Forms = EC.Forms || {};
EC.Forms = (function (module) {
    'use strict';

    var _bindActionBarBtns = function () {

        var home_btn = $('div#forms div[data-role="header"] div[data-href="home"]');
        var nav_drawer_btn = $('div#forms div[data-role="header"] div[data-href="form-nav-btn"]');
        var upload_btn = $('div#forms  div[data-role="header"] div.ui-btn-right[data-href="upload"]');
        var ctx_menu_btn = $('div#forms div[data-role="header"] div.ui-btn-right[data-href="project-options"]');
        var inactive_tab = $('div#forms div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var settings_btn = $('div#forms div[data-role="header"] div#form-nav-drawer ul li div[data-href="settings"]');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $('#form-nav-drawer');

            panel.panel('open');

            home_btn.off().one('vclick', function (e) {
                //reload index page TODO: try a better way: if the page is in the dom do not reload: History API
                window.localStorage.back_nav_url = '#refresh';
                EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        upload_btn.off().one('vclick', function (e) {
            EC.Routing.changePage(EC.Const.UPLOAD_VIEW);
        });

        ctx_menu_btn.off().on('vclick', function () {
            $('.project-options-panel').panel('open');

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                $('.project-options-panel').panel('close');
            });
        });

        inactive_tab.off().one('vclick', function (e) {

            //reload index page TODO: try a better way: if the page is in the dom do not reload: History API
            window.localStorage.back_nav_url = '#refresh';
            EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
        });
    };

    module.renderList = function (the_forms, the_button_states) {

        //build HTML
        var HTML = '';
        var i;
        var iLength;
        var forms = the_forms;
        var dom_list = $('div#forms-list ul');
        var page = $('#forms');
        var header = $('div#forms div[data-role="header"] div[data-href="form-nav-btn"] span.project-name');
        var navbar_label = $('a.ui-btn-active span.ui-btn-inner');
        var email_backup_btn = $('div#forms div#project-options ul li#email-backup');
        var download_remote_data_btn = $('div#forms div#project-options ul li#download-remote-data');
        var unsync_all_entries_btn = $('div#forms div#project-options ul li#unsync-all-data');
        var delete_project_btn = $('div#forms div#project-options ul li#delete-project');
        var delete_all_entries_btn = $('div#forms div#project-options ul li#delete-all-entries');
        var delete_synced_entries_btn = $('div#forms div#project-options ul li#delete-synced-entries');
        var delete_media_files_btn = $('div#forms div#project-options ul li#delete-media-files');
        var backup_project_data_btn = $('div#forms div#project-options ul li#backup-project-data');
        var restore_from_backup_btn = $('div#forms div#project-options ul li#restore-data-from-backup');
        var export_data_to_csv_btn = $('div#forms div#project-options ul li#export-project-data-to-csv');
        var btn_states = the_button_states;
        var has_backup = window.localStorage.has_backup;
        var project_name = window.localStorage.project_name;

        //bind action bar buttons for this page
        _bindActionBarBtns();

        dom_list.empty();

        for (i = 0, iLength = forms.length; i < iLength; i++) {

            //if no entries for a form yet, disable the entry (aside from the top one) and hide icon
            if (i > 0 && parseInt(forms[i].entries, 10) === 0) {

                HTML += '<li data-icon="false">';
                HTML += '<a href="entries-list.html?form=' + forms[i]._id + '&name=' + forms[i].name + '&entry_key=&direction=forward" class="ui-disabled">' + forms[i].name;
                HTML += '<p>' + forms[i].total_inputs + EC.Localise.getTranslation('questions') + '</p>';
                HTML += '</a>';
                HTML += '</li>';

            } else {

                //render an active button
                HTML += '<li data-icon="ep-next-page">';
                HTML += '<a href="entries-list.html?form=' + forms[i]._id + '&name=' + forms[i].name + '&entry_key=&direction=forward&children=' + forms[i].entries + '">' + forms[i].name;
                HTML += '<span class="ui-li-count">' + forms[i].entries;
                HTML += '</span>';
                HTML += '<p>' + forms[i].total_inputs + EC.Localise.getTranslation('questions') + '</p>';
                HTML += '</a>';
                HTML += '</li>';
            }
        }

        //reset title in navbar
        navbar_label.text(EC.Const.FORMS);

        //add project name to header
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        dom_list.append(HTML);

        //page.page();

        dom_list.listview('refresh');

        //make this the current page
        //$.mobile.changePage(page);

        //init global forms object
        EC.Utils.setForms(forms);

        //remove form details from localStorage if any
        window.localStorage.form_name = '';
        window.localStorage.form_id = '';
        window.localStorage.removeItem('primary_keys');
        window.localStorage.removeItem('parent_path');

        email_backup_btn.off().on('vclick', function (e) {
            EC.Routing.changePage(EC.Const.EMAIL_BACKUP_VIEW);
        });

        download_remote_data_btn.off().on('vclick', function (e) {
            EC.Routing.changePage(EC.Const.DOWNLOAD_VIEW);
        });

        //attach event to context menu to button unsync all synced entries. Toggle button state accordingly
        if (btn_states.unsync_all_data === 0) {
            unsync_all_entries_btn.addClass('ui-disabled');
        } else {
            unsync_all_entries_btn.removeClass('ui-disabled');
        }
        unsync_all_entries_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('unsync_all_data'), EC.Localise.getTranslation('unsync_all_data'), 'EC.Entries.unsyncAllEntries');
        });

        //handler to delete project
        delete_project_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_project'), EC.Localise.getTranslation('delete_project_confirm'), 'EC.Project.deleteProject');
        });

        //handler to delete/save all entries (if any, otherwise show as disabled)
        if (btn_states.delete_all_entries === 0) {
            delete_all_entries_btn.addClass('ui-disabled');
            export_data_to_csv_btn.addClass('ui-disabled');
        } else {
            delete_all_entries_btn.removeClass('ui-disabled');
            export_data_to_csv_btn.removeClass('ui-disabled');
        }
        delete_all_entries_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_entries'), EC.Localise.getTranslation('delete_all_entries_confirm'), 'EC.Entries.deleteAllEntries');

        });

        export_data_to_csv_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('export_all_entries_to_csv'), EC.Localise.getTranslation('export_all_entries_to_csv_confirm'), 'EC.Entries.exportAllEntriesToCSV');
        });

        //handler to delete all the media files for this project (if any, otherwise disable)
        if (btn_states.delete_media_files === 0) {
            delete_media_files_btn.addClass('ui-disabled');
        } else {
            delete_media_files_btn.removeClass('ui-disabled');
        }
        delete_media_files_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_media'), EC.Localise.getTranslation('delete_all_media_confirm'), 'EC.Entries.deleteAllMedia');

        });

        //handler to delete all the synced entries for this project (if any, otherwise disable button)
        if (btn_states.delete_synced_entries === 0) {
            delete_synced_entries_btn.addClass('ui-disabled');
        } else {
            delete_synced_entries_btn.removeClass('ui-disabled');
        }
        delete_synced_entries_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_synced'), EC.Localise.getTranslation('delete_all_synced_confirm'), 'EC.Entries.deleteAllSynced');

        });

        //if there are any entries to backup, enable button
        if (btn_states.delete_all_entries === 0) {
            backup_project_data_btn.addClass('ui-disabled');
        } else {
            backup_project_data_btn.removeClass('ui-disabled');
        }

        backup_project_data_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('backup_data'), EC.Localise.getTranslation('backup_data_confirm'), 'EC.Project.backupCurrentProject');
        });

        //enable -restore from backup- and -mail backup- buttons only if a backup file exists
        if (has_backup) {
            restore_from_backup_btn.removeClass('ui-disabled');
            email_backup_btn.removeClass('ui-disabled');
        } else {
            restore_from_backup_btn.addClass('ui-disabled');
            email_backup_btn.addClass('ui-disabled');
        }

        restore_from_backup_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('restore_data'), EC.Localise.getTranslation('restore_data_confirm'), 'EC.Project.restoreFromBackup');
        });

        //hide restore backup buttons on IOS as redundant (backups on device are managed via iTunes)
        //we still mail backups in some situations where it is not possible to upload data via wifi or mobile network
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {

                restore_from_backup_btn.addClass('hidden');
                //email_backup_btn.addClass('hidden');
                //backup_project_data_btn.addClass('hidden');
            }
        }

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        EC.Notification.hideProgressDialog();

    };

    return module;

}(EC.Forms));

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var input;

    module.getInputs = function () {
        return this.inputs;
    };

    module.setInputs = function (the_inputs, the_has_jumps_flag, the_has_location_flag) {

        this.inputs = the_inputs;
        //set flag to indicate if this form has or not any jumps
        window.localStorage.form_has_jumps = (the_has_jumps_flag) ? 1 : 0;
        window.localStorage.form_has_location = (the_has_location_flag) ? 1 : 0;
    };

    module.getPrimaryKeyRefPosition = function () {

        var i;
        var iLenght = this.inputs.length;

        //look for the position of the primary key
        for (i = 0; i < iLenght; i++) {
            if (parseInt(this.inputs[i].is_primary_key, 10) === 1) {
                return this.inputs[i].position;
            }
        }
    };

    module.getJumpDestinationPosition = function (the_ref) {

        var i;
        var iLenght = this.inputs.length;
        var ref = the_ref;

        //look for the position of the specified ref
        for (i = 0; i < iLenght; i++) {
            if (ref === this.inputs[i].ref) {
                return this.inputs[i].position;
            }
        }
    };

    module.getInputAt = function (the_position) {
        return this.inputs[the_position - 1];
    };

    module.updateFormCompletion = function (the_position, the_length) {

        var ratio = Math.ceil(100 * (the_position - 1) / the_length);
        var percentage_bar = $('div.ui-grid-b.input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
        var percentage_txt = $('div.ui-grid-b.input-nav-tabs div.input-progress-bar span.form-completion-percent');

        percentage_txt.text(ratio + '%');
        percentage_bar.css('width', ratio + '%');
    };

    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToBranchEntryValuesList = function() {

			//get hash from localStorage to navigate back to branch entry values list
			var back_url = window.localStorage.branch_entry_values_url;

			//clear branch data cache
			window.localStorage.removeItem("branch_current_position");
			window.localStorage.removeItem("branch_form_has_jumps");
			window.localStorage.removeItem("branch_form_name");
			window.localStorage.removeItem("branch_inputs_total");
			window.localStorage.removeItem("branch_inputs_trail");
			window.localStorage.removeItem("branch_inputs_values");
			window.localStorage.removeItem("branch_form_id");
			window.localStorage.removeItem("branch_edit_hash");
			window.localStorage.removeItem("branch_edit_key_value");
			window.localStorage.removeItem("branch_edit_type");
			
			//clear navigation url
			window.localStorage.removeItem("branch_entry_values_url");

			//get branch entry values
			EC.Routing.changePage(back_url);
			
		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToEntriesList = function() {

			var cached_branch_entry_keys;
			var i;
			var iLength;
			var has_cached = false;
			var page = window.localStorage.back_nav_url;

			/*delete any cached branch entry not stored (main form not saved) BEFORE redirecting to index page
			 * (if any)
			 */
			try {

				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				//if there is the cached_branch_entries, tirgger deletion if t∆here ia at least 1 element
				iLength = cached_branch_entry_keys.length;
				for ( i = 0; i < iLength; i++) {
					if (cached_branch_entry_keys[i].primary_keys.length > 0) {

						has_cached = true;
						break;
					}
				}

				if (has_cached) {

					//remove cached branch entries keys
					window.localStorage.removeItem("cached_branch_entry_keys");

					//delete any cached branch entry
					EC.Delete.deleteCachedBranchEntries();
				} else {

					//no primary keys cached, go straight back to index page

					//remove breadcrumb for navigation

					EC.Routing.changePage(page);
				}

			} catch(error) {

				//no object cached, go straight back to index page
				EC.Routing.changePage(page);

			}

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToEntryValuesList = function() {

			var cached_branch_entry_keys;
			var i;
			var iLength;
			var has_cached = false;
			var page = window.localStorage.back_edit_nav_url;
			var key_position = EC.Inputs.getPrimaryKeyRefPosition();
			var breadcrumb_trail = JSON.parse(window.localStorage.getItem("breadcrumbs"));
			var parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
			//get value of primary key for this form
			var key_value = EC.Inputs.getCachedInputValue(key_position).value;

			//save full breadcrumbs as path to parent node (node tree representation using adjacent list)
			var parent_path = (breadcrumb_trail[0] === "") ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

			//if it is a nested form, keep track of its parent and save it in localStorage
			if (key_value !== parent_path) {

				var parent_path_array = parent_path.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
				parent_path_array.pop();
				window.localStorage.parent_path = parent_path_array.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
			}

			/*delete any cached branch entry not stored (main form not saved) BEFORE redirecting to index page
			 * (if any)
			 */
			try {

				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				//if there is the cached_branch_entries, tirgger deletion if there ia at least 1 element
				iLength = cached_branch_entry_keys.length;
				for ( i = 0; i < iLength; i++) {
					if (cached_branch_entry_keys[i].primary_keys.length > 0) {

						has_cached = true;
						break;
					}
				}

				if (has_cached) {

					//remove cached branch entries keys
					window.localStorage.removeItem("cached_branch_entry_keys");

					//delete any cached branch entry
					EC.Delete.deleteCachedBranchEntries();
				} else {

					//no primary keys cached, go straight back to index page

					//remove breadcrumb for navigation

					EC.Routing.changePage(page);
				}

			} catch(error) {

				//no object cached, go straight back to index page
				EC.Routing.changePage(page);

			}

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.bindBackBtn = function(is_data_saved) {

			var back_btn = $("div[data-role='header'] div[data-href='back-btn']");
			back_btn.off().one('vclick', function(e) {

				if (is_data_saved) {

					//if user was navigating from a child from, send it back to child from list
					if (window.localStorage.is_child_form_nav) {

						//TODO: back to child entries list
						EC.Inputs.backToEntriesList();
					} else {
						//data saved, go back to entries list
						EC.Inputs.backToEntriesList();
					}

				} else {

					//if user was navigating from a child from, send it back to child from list
					if (window.localStorage.is_child_form_nav) {

						//TODO: back to child entries list
						EC.Inputs.backToEntriesList();
					} else {

						//data not saved, ask user confirmation
						EC.Notification.askConfirm(EC.Localise.getTranslation("exit"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToEntriesList");
					}

				}
			});
		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		var self;
		var current_input_position;
		var is_jump_found;

		/*
		 * check if a selected value triggers a jump. If multiple jumps are true, the first triggered jump will win, according to the jump checking sequence
		 */
		function _checkJumps(the_jumps, the_current_value) {

			var jumps = the_jumps;
			var i;
			var iLength = jumps.length;
			var destination_position;
			var destination;
			var current_value = the_current_value;
			var inputs_length = self.inputs.length;

			//if not any jump conditions match, set destination to the next input as default
			destination_position = current_input_position + 1;

			for ( i = 0; i < iLength; i++) {

				//check if we jump always
				if (jumps[i].jump_when === EC.Const.JUMP_ALWAYS) {

					is_jump_found = true;
					destination = jumps[i].jump_to;
					destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
					break;
				}

				//check if we jump whan a value is not selected (not selected values are set to null for consistency)
				//TODO: check this
				if (jumps[i].jump_when === EC.Const.JUMP_FIELD_IS_BLANK && (current_value === null || current_value === EC.Const.NO_OPTION_SELECTED)) {

					is_jump_found = true;
					destination = jumps[i].jump_to;
					destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
					break;
				}

				//jump when the value IS: the jump is performed by index so the index of the <option> tag is to be checked against the "jump_value"
				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS && current_value.toString() === jumps[i].jump_value.toString()) {

					is_jump_found = true;
					destination = jumps[i].jump_to;
					destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
					break;
				}

				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS_NOT && current_value.toString() !== jumps[i].jump_value.toString()) {

					is_jump_found = true;
					destination = jumps[i].jump_to;
					destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
					break;
				}

			}

			//override current_input_position with the position of the input set by the jump (-1 because we are adding +1 later)
			current_input_position = destination_position - 1;

			return destination;

		}

		module.gotoNextPage = function(evt, the_current_value) {

			var current_input;
			var current_value = the_current_value;
			var next_input;
			var next_page;
			var options;
			var obj;
			var destination;
			var jumps;
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(parseInt(window.localStorage.form_id, 10));
			var next_value;
			var i;
			var iLength;
			var is_checkbox = false;

			self = this;
			current_input_position = parseInt(window.localStorage.current_position, 10);
			
			/* DROPDOWN/RADIO*/
			//get index from object in the case of a dropdown/radio (object is like {label:"<label>", index:"<value>"})
			if (current_value.hasOwnProperty("index")) {
				current_value = current_value.index;
			}
            
            /* CHECKBOX*/
			//if current value is an array, we have checkbox values to parse and check each of them against jumps
			if (Array.isArray(current_value)) {
				is_checkbox = true;
			}

			//check if we have reached the end of the form
			if (current_input_position === self.inputs.length) {
				next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
			} else {

				//check if the current input triggers a jump
				current_input = self.getInputAt(current_input_position);

				if (parseInt(current_input.has_jump, 10) === 1) {

					//get jumps
					jumps = EC.Utils.parseJumpString(current_input.jumps);

					//if we have an arry of values (checkboxes) check each of them if it triggers a jump
					if (is_checkbox) {

						is_jump_found = false;
						iLength = current_value.length;

						//loop each selected value until the first jump is found (or no more elements to check against)
						for ( i = 0; i < iLength; i++) {

							destination = _checkJumps(jumps, current_value[i].value);
							if (is_jump_found) {
								break;
							}
						}

					} else {
						//single value
						destination = _checkJumps(jumps, current_value);

					}

				}//if has jump

				if (destination === EC.Const.END_OF_FORM) {
					next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
				} else {
					next_input = self.getInputAt(current_input_position + 1);

					/*
					 * if is_genkey_hidden = 1, the from creator decided to hide the auto genkey
					 * The nasty form builder allows users to drag the primary key input fields to any position (lol)
					 * therefore we have to test each input if it is a primary key field
					 * We have to skip the next input (from the user) but add an entry to inputs_values, inputs_trail with the UUID
					 *
					 */

					if (is_genkey_hidden && next_input.is_primary_key === 1) {

						//add skipped genkey entry also in inputs_trail
						self.pushInputsTrail(next_input);

						//add an entry with UUID to inputs_values if we are entering a new entry
						next_value = EC.Utils.getGenKey();

						//cache next value in localStorage
						self.setCachedInputValue(next_value, current_input_position + 1, next_input.type, next_input.is_primary_key);

						//go to the next  input AFTER the hidden primary key (if it exists, otherwise the save confirm page)
						next_input = self.getInputAt(current_input_position + 2);
						if (!next_input) {
							next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
						}

						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.current_position = current_input_position + 2;

					} else {

						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.current_position = current_input_position + 1;

					}

					if (next_input) {
						next_page = EC.Const.INPUT_VIEWS_DIR + next_input.type + EC.Const.HTML_FILE_EXT;
					}

				}

			}

			EC.Routing.changePage(next_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};
		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.gotoPrevPage = function(evt) {

			var self = this;
			var current_position = parseInt(window.localStorage.current_position, 10);
			var inputs_trail = JSON.parse(window.localStorage.inputs_trail);
			var prev_page;
			var prev_input_position = parseInt(inputs_trail[inputs_trail.length - 1].position, 10);
			var prev_input = self.getInputAt(prev_input_position);
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(window.localStorage.form_id);

			//skip prev input (from user) if it is a hidden auto genkey
			if (is_genkey_hidden && prev_input.is_primary_key === 1) {

				prev_input_position = inputs_trail[inputs_trail.length - 2].position;
				prev_input = EC.Inputs.getInputAt(prev_input_position);

				//update current input position in session (store confirm screen will get a position = array.length)
				window.localStorage.current_position = current_position - 2;

				//remove last  entry from inputs_trail
				self.popInputsTrail();

			} else {

				//update current input position in session
				window.localStorage.current_position = prev_input_position;

			}

			//remove last  entry from inputs_trail
			self.popInputsTrail();

			prev_page = EC.Const.INPUT_VIEWS_DIR + prev_input.type + EC.Const.HTML_FILE_EXT;

			EC.Routing.changePage(prev_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.onNextBtnTapped = function(e, the_input) {

			var self = this;
			var wls = window.localStorage;
			var edit_id = wls.edit_id || "";
			var edit_type = wls.edit_type || "";
			var input = the_input;
			var current_value = self.getCurrentValue(input.type);
			var current_position = parseInt(wls.current_position, 10);
			var cached_value = EC.Inputs.getCachedInputValue(current_position);
			var validation = self.validateValue(input, current_value, current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				
				//warn user about the type of error. IMP: validation.message comes localised already
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), validation.message);
				return;
			}

			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (wls.edit_mode && parseInt(input.has_jump, 10) === 1) {
				if (!self.valuesMatch(cached_value, current_value, input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					wls.has_new_jump_sequence = 1;
				}
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

			self.pushInputsTrail(input);
			
			//remove flag that helps to handle back button when user is just dismissing barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoNextPage(e, current_value);

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.onPrevBtnTapped = function(e, the_input) {

			var self = this;
			var input = the_input;
			var inputs_total = self.inputs.length;
			var current_value = self.getCurrentValue(input.type);
			var current_position = parseInt(window.localStorage.current_position, 10);
			var cached_value = EC.Inputs.getCachedInputValue(current_position);
			
			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (window.localStorage.edit_mode && parseInt(input.has_jump,10) === 1) {
				if (!self.valuesMatch(cached_value, current_value, input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					window.localStorage.has_new_jump_sequence = 1;
				}
			}

			//check we are not coming back from #save-confirm page
			if (current_position <= inputs_total) {
				//cache current value in localStorage
				self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);
			}
			
			//remove flag that helps to handle back button when user is just dismissing barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoPrevPage(e);

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.popInputsTrail = function() {

			var inputs_trail;

			try {

				inputs_trail = JSON.parse(window.localStorage.inputs_trail);

				inputs_trail.pop();

				window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

			} catch(error) {
			}

		};
		//popInputsTrail
		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.pushInputsTrail = function(the_input) {

			var input = the_input;

			var inputs_trail;

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				inputs_trail = JSON.parse(window.localStorage.inputs_trail);

			} catch(error) {

				//Handle errors here
				inputs_trail = [];

			}

			inputs_trail.push({
				position : input.position,
				label : input.label

			});

			window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

		};
		//pushInputsTrail
		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.spliceInputsTrail = function(the_position) {

			var position = parseInt(the_position, 10);
			var inputs_trail = JSON.parse(window.localStorage.inputs_trail);
			var i;
			var iLength = inputs_trail.length;
			var index;
			var how_many_to_remove;

			for ( i = 0; i < iLength; i++) {

				if (parseInt(inputs_trail[i].position, 10) === position) {

					index = i;
					break;
				}

			}

			how_many_to_remove = iLength - index;
			inputs_trail.splice(index, how_many_to_remove);
			window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

		};

		//spliceInputsTrail
		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {
        "use strict";

        module.prepareFeedback = function(the_status, the_entry_key) {

            var self = this;
            var status = the_status;
            var page = EC.Const.INPUT_VIEWS_DIR + "save-feedback.html";
            var primary_keys = JSON.parse(window.localStorage.primary_keys);
            var back_nav_hash = window.localStorage.back_nav_url;
            var back_nav_hash_parts;
            var children;
            var entries_totals = JSON.parse(window.localStorage.entries_totals);

            self.entry_key = the_entry_key;

            //prepare feedback based on status
            if (status) {

                this.message = "Data save successfully!";

                back_nav_hash_parts = back_nav_hash.split("=");
                children = parseInt(back_nav_hash_parts[back_nav_hash_parts.length - 1], 10);

                //increase children for this entry, update back nav hash and pagination object
                back_nav_hash_parts[back_nav_hash_parts.length - 1] = children + 1;
                back_nav_hash = back_nav_hash_parts.join("=");
                entries_totals[entries_totals.length - 1].entries_total = children + 1;

                window.localStorage.back_nav_url = back_nav_hash;
                window.localStorage.entries_totals = JSON.stringify(entries_totals);

                //add last entry primary key to localStorage
                primary_keys.push(self.entry_key);
                window.localStorage.primary_keys = JSON.stringify(primary_keys);

            } else {

                this.message = "Error saving data...please retry";
            }

            EC.Routing.changePage(page);
        };
        //prepareFeedback

        return module;

    }(EC.Inputs));

/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.prepareFirstInput = function (the_first_input) {

        var self = this;
        var first_input_position = 1;
        var back_nav_url;
        var form_name = window.localStorage.form_name;
        var form_id = window.localStorage.form_id;
        var breadcrumbs = JSON.parse(window.localStorage.breadcrumbs);
        var entry_key = breadcrumbs[breadcrumbs.length - 1];
        var input = the_first_input;
        var page = EC.Const.INPUT_VIEWS_DIR + input.type + EC.Const.HTML_FILE_EXT;
        var back_btn = $('div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var entries_totals = JSON.parse(window.localStorage.entries_totals);
        var children = entries_totals[entries_totals.length - 1].entries_total;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);


        //start watching for device position if the form has got a location field
        if (parseInt(window.localStorage.form_has_location, 10) === 1) {
            window.localStorage.watch_position = navigator.geolocation.watchPosition(function (position) {
                console.log(position);
            }, function (error) {
                console.log(error);
            }, {
                maximumAge: 0,
                timeout: 300000,
                enableHighAccuracy: true
            });
        }

        //reset entry key
        self.entry_key = null;

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        //set array to keep track of input navigation (get pre-built one when editing)
        if (!window.localStorage.edit_mode) {
            window.localStorage.inputs_trail = [];
        } else {
            //update inputs trail to remove all the elements past the current edit position
            EC.Inputs.spliceInputsTrail(window.localStorage.edit_position);
        }

        //set hash to be used to list these entries when loading entries-list.html after a save/exit action
        if (!window.localStorage.edit_mode) {
            back_nav_url = 'entries-list.html';
            back_nav_url += '?form=' + form_id;
            back_nav_url += '&name=' + form_name;
            back_nav_url += '&entry_key=' + entry_key;
            back_nav_url += '&direction=' + EC.Const.ADDING;
            back_nav_url += '&children=' + children;

            window.localStorage.back_nav_url = back_nav_url;
        }

        /* Update current position if edit_mode is active. When editing, the user can start editing the form from any input
         * not just the first one. In that case we have to update the first position to be the selected input position
         * not 1
         */
        window.localStorage.current_position = (window.localStorage.edit_mode) ? window.localStorage.edit_position : first_input_position;

        /*
         * If if the genkey hidden flag is set to 1 and the input is a primary key input, do not render this input on screen but:
         *
         * - just cache it with an auto genkey in localStorage if we are entering a new entry
         * - do nothing if we are editing, ad the inputs_values array will be set already (it is set when listing the entry values)
         *
         */

        if (is_genkey_hidden === 1 && input.is_primary_key === 1) {

            //skip input
            window.localStorage.current_position = first_input_position + 1;

            //if we are entering a new entry, add an auto generated key in input_values[]
            if (!window.localStorage.edit_mode) {
                window.localStorage.inputs_values = JSON.stringify([{
                    _id: '',
                    type: '',
                    value: EC.Utils.getGenKey(),
                    position: 1,
                    is_primary_key: 1
                }]);

            }

            //get next input to set page we have to go to (first_input_position is equal to current_position-1, so...)
            input = self.inputs[first_input_position];
            page = EC.Const.INPUT_VIEWS_DIR + input.type + EC.Const.HTML_FILE_EXT;

        }

        //remove branch flags and objects from localStorage
        window.localStorage.removeItem('cached_branch_entry_keys');
        window.localStorage.removeItem('stored_branch_entry_keys');
        window.localStorage.removeItem('branch_current_position');
        window.localStorage.removeItem('branch_form');
        window.localStorage.removeItem('branch_form_has_jumps');
        window.localStorage.removeItem('branch_form_id');
        window.localStorage.removeItem('branch_form_name');
        window.localStorage.removeItem('branch_inputs_total');
        window.localStorage.removeItem('branch_primary_keys');
        window.localStorage.removeItem('branch_edit_id');
        window.localStorage.removeItem('branch_edit_mode');
        window.localStorage.removeItem('branch_edit_position');
        window.localStorage.removeItem('branch_inputs_trail');
        window.localStorage.removeItem('branch_inputs_values');

        //get first input view
        EC.Routing.changePage(page);

    };

    return module;

}(EC.Inputs));

/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.renderFeedbackView = function () {

        var self = this;
        var form_id = window.localStorage.form_id;
        var form_name = window.localStorage.form_name;
        var form_tree = EC.Utils.getParentAndChildForms(form_id);
        var upload_btn = $('div#feedback div#input-feedback div#upload');
        var add_another_entry_btn = $('div#feedback div#input-feedback div#add-entry-current-form');
        var list_entries_btn = $('div#feedback div#input-feedback div#list-entries-current-form');
        var add_child_btn = $('div#feedback div#input-feedback div#add-child-entry');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');

        //stop background watch position if any
        window.navigator.geolocation.clearWatch(window.localStorage.watch_position);
        window.localStorage.form_has_location = 0;

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        //handle back button with no alert on this page
        self.bindBackBtn(true);

        //remove navigation flags from localStorage
        window.localStorage.removeItem('edit_id');
        window.localStorage.removeItem('edit_mode');
        window.localStorage.removeItem('edit_position');
        window.localStorage.removeItem('inputs_trail');
        window.localStorage.removeItem('inputs_values');
        window.localStorage.removeItem('current_position');
        //clear cached branch entry keys
        window.localStorage.removeItem('cached_branch_entry_keys');

        //Set feedback message
        $('p#message').text(this.message);

        //Set text for 'add another entry' button
        add_another_entry_btn.find('span.entry').text(form_name);

        upload_btn.off().one('vclick', function () {
            EC.Routing.changePage(EC.Const.UPLOAD_VIEW);
        });

        add_another_entry_btn.off().one('vclick', function (e) {
            EC.Entries.addEntry();
        });

        list_entries_btn.off().one('vclick', function (e) {
            //if user was navigating from a child from, send it back to child from list
            if (window.localStorage.is_child_form_nav) {

                //TODO: back to child entries list
                EC.Inputs.backToEntriesList();
            } else {
                //data saved, go back to entries list
                EC.Inputs.backToEntriesList();
            }
        });

        //set text for list entries
        list_entries_btn.find('span.form-name-inline').text(form_name);

        //Set text for 'add child to form (if there is a child form)
        if (form_tree.cname !== '') {

            //show add child to current for button
            add_child_btn.find('span').text(EC.Localise.getTranslation('add') + form_tree.cname + EC.Localise.getTranslation('to') + form_name);

            //show add child button
            add_child_btn.removeClass('hidden');

            //Add a child entry btn
            add_child_btn.one('vclick', function (e) {

                var breadcrumb_trail;
                var entries_totals;

                //Set up form values to add a child form for the current form
                window.localStorage.form_name = form_tree.cname;
                window.localStorage.form_id = form_tree.child;

                //add current entry key to breadcrumbs
                breadcrumb_trail = JSON.parse(window.localStorage.breadcrumbs);
                //TODO: where entry_key comes from?
                breadcrumb_trail.push(self.entry_key);
                window.localStorage.breadcrumbs = JSON.stringify(breadcrumb_trail);

                //add current entry to pagination object
                entries_totals = JSON.parse(window.localStorage.entries_totals);
                entries_totals.push({
                    form: form_tree.cname,
                    entry_key: self.entry_key,
                    entries_total: 1
                });

                window.localStorage.entries_totals = JSON.stringify(entries_totals);

                EC.Entries.addEntry();
            });
        }
        EC.Notification.hideProgressDialog();
    };

    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function (module) {
    "use strict";

    /**
     * @method renderInput This method is called by JQM page events each time a new page (input type) is requested
     * The application show a single input per page: this method prepare the DOM common to all inputs  and then calls the
     * appropriate view based on the input type
     *
     * @param {Object} the_input : a single input object like:
     *
     * {input object here}
     *
     */

    module.renderInput = function (the_input) {

        var self = this;
        var wls = window.localStorage;
        var input = the_input;
        var current_value;
        var page = EC.Const.INPUT_VIEWS_DIR + input.type;
        var current_position = parseInt(wls.current_position, 10);
        var cached_value = self.getCachedInputValue(current_position);
        var breadcrumb_trail = JSON.parse(wls.getItem("breadcrumbs"));
        var back_btn = $("div[data-role='header'] div[data-href='back-btn']");
        var back_btn_label = $("div[data-role='header'] div[data-href='back-btn'] span.form-name");
        var parent_key;
        var rows_to_save = [];
        var prev_btn = $('div.input-nav-tabs div.ui-block-a.input-prev-btn');
        var next_btn = $('div.input-nav-tabs div.ui-block-c.input-next-btn');
        var form_name = wls.form_name;
        var form_id = wls.form_id;
        var inputs_total = self.inputs.length;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);
        var inputs_values;
        var first_input;
        var is_prev_button_hidden = false;

        back_btn.off().on('vclick', function (e) {

            //when editing, the back button takes to the entry values list
            if (wls.edit_mode) {

                if (wls.has_new_jump_sequence) {
                    EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), "Are you sure? \nData will NOT be saved", "EC.Inputs.backToEntryValuesList", false, input, false);

                } else {

                    //check if user is leaving after modifying a jump and neither "Store Edit", "prev" or "next" button were tapped
                    if (parseInt(input.has_jump, 10) === 1) {

                        current_value = EC.Inputs.getCurrentValue(input.type);

                        if (!self.valuesMatch(cached_value, current_value, input.type)) {

                            EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToEntryValuesList", false, input, false);
                        } else {

                            EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntryValuesList", true, input, false);
                        }
                    } else {
                        EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntryValuesList", true, input, false);
                    }
                }

            } else {
                //not editing, go to entries list
                EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntriesList", true, input, false);
            }

        });

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + EC.Localise.getTranslation("entries"));

        //get parent key based on the user navigating, editing or adding from child list
        if (wls.edit_mode) {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 2];
        } else {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
        }

        //reset button visibility
        $(prev_btn, next_btn).removeClass("invisible");

        //show parent key in the top bar (if any)
        if (parent_key !== "" && parent_key !== undefined) {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(wls.form_name + ' for ' + parent_key);
        } else {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(wls.form_name);
        }

        //TODO :do we need to -> skip input rendering if it is the preloader screen
        if (current_position !== 0) {

            //check if we have a cached value for this input in session
            current_value = self.getCachedInputValue(current_position).value;

            //check it the value is _skipp3d_ reserved keyword
            current_value = (current_value === EC.Const.SKIPPED) ? "" : current_value;

            //if the input is either photo, audio or video, if no default value is available we pass an empty object {cached: "", stored: ""}
            if (input.type === EC.Const.PHOTO || input.type === EC.Const.AUDIO || input.type === EC.Const.VIDEO) {

                self.renderInputView(input, current_value || {
                    cached: "",
                    stored: ""
                });

            } else {

                //for normal inputs, render view passing the default value (empty if not set) if no input value is cached
                self.renderInputView(input, current_value || input.default_value);
            }
        }

        //set next button to go to next input (if any)
        if (current_position <= inputs_total) {
            //Next button handler
            next_btn.off().on('vclick', function (e) {
                self.onNextBtnTapped(e, input, self);
            });
        }

        //set previous button (if any)
        if (current_position - 1 > 0) {

            //check if the first input is a hidden genkey, in that case do not show prev button
            if (current_position === 2) {

                inputs_values = JSON.parse(wls.inputs_values);
                first_input = inputs_values[0];

                if (first_input.is_primary_key === 1 && is_genkey_hidden === 1) {
                    //hide prev button for first input of the form
                    prev_btn.addClass("invisible");
                    is_prev_button_hidden = true;
                }
            }

            //bind vclick event only if the button is not hidden
            if (!is_prev_button_hidden) {
                //handler for prev button, showing prev input
                prev_btn.off().on('vclick', function (e) {
                    self.onPrevBtnTapped(e, input);
                });
            }

        } else {

            //hide prev button for first input of the form
            prev_btn.addClass("invisible");

            //reset inputs_trail in session
            wls.removeItem('inputs_trail');
        }

        //show store edit button if we are in "editing mode" and bind it to callback
        if (wls.edit_mode) {

            $('div.store-edit').removeClass('hidden');

            /* Disable store edit button when a new jump sequence was triggered
             * by the user making a change to a input field with a jump
             * User is then forced to go through the form until it ends to follow the new jumps sequence
             */
            if (wls.has_new_jump_sequence) {
                $('div.store-edit').addClass('ui-disabled');
            } else {
                $('div.store-edit').removeClass('ui-disabled');
            }

            //bind events with on(), as we need to submit again if the input does not validate successfully
            $('div.store-edit').off().on('vclick', function () {

                var cached_value;

                if (parseInt(input.has_jump, 10) === 1) {

                    current_position = wls.current_position;
                    cached_value = EC.Inputs.getCachedInputValue(current_position);

                    //TODO: do validation first??? or is it done when calling prepareStoreEdit?

                    /*
                     * if we are making a change to a field triggering a jump
                     * ask confirmation to user he will have to complete the whole form
                     */

                    if (!self.valuesMatch(cached_value, current_value, input.type)) {

                        //disable intermediate "store edit" button
                        //	$('div.store-edit').addClass('ui-disabled');

                        //TODO:
                        //Alert user there is the need to complete the whole form
                        EC.Notification.showAlert(EC.Localise.getTranslation("warning"), EC.Localise.getTranslation("edited_jump"));

                        //set flag as from now until saving the form, store edit from an intermediate screen is disabled
                        wls.has_new_jump_sequence = 1;

                    } else {

                        wls.removeItem("has_new_jump_sequence");
                        self.prepareStoreEdit(current_position, input, self);
                    }

                } else {
                    self.prepareStoreEdit(current_position, input, self);
                }

            });

        }
        else {
            $('div.store-edit').addClass('hidden');
        }

        //update completion percentage and bar for this form
        self.updateFormCompletion(current_position, inputs_total);

    };
    //renderInput

    return module;

}(EC.Inputs));

/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var branchFormCacheReady;
    var branchEntriesCacheReady;
    var branch_input;
    var count;
    var branch_form;

    module.renderInputView = function (the_input, the_value) {

        var input = the_input;
        var value = the_value;
        var self = this;
        var offset = 0;
        var project_id = window.localStorage.project_id;
        var parent_key_position;
        var hierarchy_entry_key_value;

        //render layout based on the input type
        switch (input.type) {

            case EC.Const.TEXT:

                EC.InputTypes.text(value, input);
                break;

            case EC.Const.TEXTAREA:

                EC.InputTypes.textarea(value, input);
                break;

            case EC.Const.INTEGER:

                EC.InputTypes.integer(value, input);
                break;

            case EC.Const.DECIMAL:

                EC.InputTypes.decimal(value, input);
                break;

            case EC.Const.DATE:

                EC.InputTypes.date(value, input);
                break;

            case EC.Const.TIME:

                EC.InputTypes.time(value, input);
                break;

            case EC.Const.RADIO:

                EC.InputTypes.radio(value, input);
                break;

            case EC.Const.CHECKBOX:

                EC.InputTypes.checkbox(value, input);
                break;

            case EC.Const.DROPDOWN:

                EC.InputTypes.dropdown(value, input);
                break;

            case EC.Const.BARCODE:

                EC.InputTypes.barcode(value, input);
                break;

            case EC.Const.LOCATION:

                EC.InputTypes.location(value, input);
                break;

            case EC.Const.PHOTO:

                EC.InputTypes.photo(value, input);
                break;

            //deal with audio recording
            case EC.Const.AUDIO:

                EC.InputTypes.audio(value, input);
                break;

            case EC.Const.VIDEO:

                EC.InputTypes.video(value, input);
                break;

            case EC.Const.BRANCH:

                //if we are opening a branch form, cache inputs
                if (!window.localStorage.back_from_branch) {

                    //cache inputs in localStorage (to have them ready when coming back from branch form)
                    window.localStorage.inputs = JSON.stringify(self.inputs);
                } else {

                    //back from a branch, remove flag
                    window.localStorage.removeItem('back_from_branch');
                }

                //if loading a branch input, we set two deferred objects to know when the branch form and its entries are BOTH cached in LocalStorage, as SQLite queries are async
                branchFormCacheReady = $.Deferred();
                branchEntriesCacheReady = $.Deferred();

                //For branch inputs only: when BOTH async queries are done, render AddBranch page
                $.when(branchFormCacheReady, branchEntriesCacheReady).then(function () {

                    //models ready, update UI
                    console.log('Branch cache ready');
                    EC.InputTypes.addBranch(count, branch_input);

                });

                /* hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to
                 * we need it as we need to link the branch entries to a single main form entry (like it is its parent)
                 */
                parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
                hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);

                /*
                 * Trigger 2 database queries and use a deferred object to show the AddBranch page when tehy are BOTH completed
                 */

                //get branch count  BEFORE rendering AddBranch
                $.when(EC.Select.getCountBranchEntries(input, hierarchy_entry_key_value, project_id, offset)).then(function (the_count, the_input) {

                    branch_input = the_input;
                    count = the_count;

                    branchEntriesCacheReady.resolve();
                    console.log('branchEntriesCacheReady called');

                });

                //get branch form details and cache them BEFORE rendering AddBranch
                $.when(EC.Select.getBranchFormDetails(input, value, project_id)).then(function (the_branch_form) {

                    branch_form = the_branch_form;

                    window.localStorage.branch_form = JSON.stringify(branch_form);

                    branchFormCacheReady.resolve();
                    console.log('branchFormCacheReady called');

                });

                break;

        }//switch

        //remove progress dialog (triggered when loading inputs.html)
        //for 'location' inputs, skip this as we are hiding ti from the location view
        if (input.type !== EC.Const.LOCATION) {
            if (window.google) {
                //clear any events related to the google maps object
                google.maps.event.clearListeners(EC.DevicePosition.map);
            }
            EC.Notification.hideProgressDialog();
        }
    };

    return module;

}(EC.Inputs));

/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.renderSaveConfirmView = function () {

        var self = this;
        var prev_btn = $('div#save-confirm div.ui-block-a.input-prev-btn');
        var store_btn = $('div#save-confirm div#input-save-confirm div#store');
        var store_edit_btn = $('div.store-edit');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var inputs_total = self.inputs.length;
        var breadcrumb_trail = JSON.parse(window.localStorage.getItem('breadcrumbs'));
        var form_name = window.localStorage.form_name;
        var parent_key;



        //get parent key based on the user navigating or editing
        if (window.localStorage.edit_mode) {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 2];
        } else {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
        }

        //show parent key in the top bar (if any)
        if (parent_key !== '' && parent_key !== undefined) {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(window.localStorage.form_name + ' for ' + parent_key);
        } else {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(window.localStorage.form_name);
        }

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        self.bindBackBtn(false);

        //reset back button visibility
        prev_btn.removeClass('invisible');

        //handler for prev button, showing prev input
        prev_btn.off().on('vclick', function (e) {
            self.gotoPrevPage(e);
        });

        //show 'store' or 'store edit' button based on where we are editing or adding a new entry
        if (window.localStorage.edit_mode) {

            store_btn.hide();

            //enable/show store edit button (if the form has jumps it got disabled)
            $('div.store-edit').removeClass('ui-disabled hidden');

            //bind event with one() to enforce a single submit
            store_edit_btn.off().one('vclick', function (e) {

                EC.Notification.showProgressDialog();
                self.onStoreValues();
            });

        } else {

            store_btn.show();

            //hide store edit button
            $('div.store-edit').addClass('hidden');

            //bind event with one() to enforce a single submit
            store_btn.off().one('vclick', function (e) {

                EC.Notification.showProgressDialog();
                self.onStoreValues();
            });
        }

        //update completion percentage and bar for this form
        self.updateFormCompletion(inputs_total + 1, inputs_total);

    };


    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 * @method renderStoreEditFeedback Show feedback after an edit action and redirect the entries-list page
		 * @param {Object} is_positive
		 */
		module.renderStoreEditFeedback = function(is_positive) {

			EC.Notification.hideProgressDialog();

			if (is_positive) {

				EC.Notification.showToast(EC.Localise.getTranslation("edit_saved"), "short");

				window.localStorage.removeItem("edit_hash");
				window.localStorage.removeItem("edit_id");
				window.localStorage.removeItem("edit_mode");
				window.localStorage.removeItem("edit_position");
				window.localStorage.removeItem("edit_type");
				window.localStorage.removeItem("edit_key_value");

				//remove flag that disable store edit from an intermediate screen
				window.localStorage.removeItem("has_new_jump_sequence");

				//go back to entries-list page using cached back navigation url
				EC.Routing.changePage(window.localStorage.back_nav_url);
			}

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 *  @method amendSkippedValues. Check the inputs_trail[] against inputs_values[]
		 *  inputs_trail[] contains the inputs the user actually navigated to by jumps
		 *  inputs_values[] contains all the values for all the inputs in a form, from start to finish
		 *  Skipped inputs (by a jump) are null elements in inputs_values[], so they are marked as "skipped" by setting their value as _skipp3d_, a custom reserved word
		 *  If the primary key for the form is auto generated and hidden, it will be in input_values[] but not in inputs_trail, add it manually
		 *  inputs_values[] is then cached to locaStorage after being amended
		 */
		module.amendSkippedValues = function() {
			
			var wls = window.localStorage;
			var i;
			var j;
			var iLength;
			var jLength;
			var max_skipped_position;
			var inputs_trail = [];
			var inputs_values = [];
			var is_found;
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden();

			inputs_trail = JSON.parse(wls.inputs_trail);
			inputs_values = JSON.parse(wls.inputs_values);

			iLength = inputs_values.length;
			jLength = inputs_trail.length;

			max_skipped_position = inputs_trail[inputs_trail.length - 1].position;

			for ( i = 0; i < iLength; i++) {//for each input in inputs_values

				is_found = false;

				//jumps can generate null values in the input_values array (when entering a new entry)
				if (inputs_values[i] === null) {
					is_found = true;
					// inputs_values[i] = {
						// value : EC.Const.SKIPPED
					// };
				} else {

					for ( j = 0; j < jLength; j++) {//for each input in inputs_trail

						//check if the input values is in the input trail array OR the input value is a hidden primary key value. In both case, the value needs to be saved
						if (parseInt(inputs_values[i].position, 10) === inputs_trail[j].position || (is_genkey_hidden === 1 && parseInt(inputs_values[i].is_primary_key, 10) === 1 )) {

							is_found = true;
							break;
						}
					}// for each inputs_trail
				}

				//not found values (and null values)
				// TODO: why was I also checking for inputs_values[i].position < max_skipped_position???
				if (!is_found) {
					inputs_values[i].value = EC.Const.SKIPPED;
				}

			}//for each inputs_values

			//store the amended values in localStorage for saving
			wls.inputs_values = JSON.stringify(inputs_values);

		};

		return module;

	}(EC.Inputs));

/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.buildRows = function (the_filenameToTimestamp) {

        var self = this;
        var i;
        var input;
        var value_obj;
        var value;
        var _id;
        var ref;
        var rows = [];
        var iLength = EC.Inputs.inputs.length;
        var key_position = EC.Inputs.getPrimaryKeyRefPosition();
        var parts;
        var filename;
        var filename_parts;
        var extension;
        var form_name = window.localStorage.form_name;
        var uuid = EC.Utils.getPhoneUUID();
        var form_id = window.localStorage.form_id;
        var created_on = EC.Utils.getTimestamp();
        var ios_filenames = the_filenameToTimestamp;
        var timestamp;

        //get parent key value for the current form
        var current_input_position = parseInt(window.localStorage.current_position, 10);
        var breadcrumb_trail = JSON.parse(window.localStorage.getItem('breadcrumbs'));
        var parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];

        //save full breadcrumbs as path to parent node (node tree representation using adjacent list)
        var parent_path = (breadcrumb_trail[0] === '') ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

        //get value of primary key for this form
        var key_value = EC.Inputs.getCachedInputValue(key_position).value;

        var branch_entries;

        //build rows to be saved - the text value for each input is saved in an array with corresponding indexes
        for (i = 0; i < iLength; i++) {

            //get current value details
            input = EC.Inputs.inputs[i];
            value_obj = self.getCachedInputValue(input.position);

            //save cached value OR '' when input_values not found...that should never happen?
            value = value_obj.value || '';

            //_id is set only when we are editing, it is the _id of the current row in the database which will be updated
            _id = value_obj._id;

            //deal with media types to save the correct value (full path uri)
            if (input.type === EC.Const.PHOTO || input.type === EC.Const.VIDEO || input.type === EC.Const.AUDIO) {

                //check whether the value is defined as media value {stored: '<path>', cached: '<path>'}
                if (value.hasOwnProperty('stored')) {

                    if (value.stored === '') {

                        //we are saving a new media file path from the cached one (or an empty string if the file field was optional)
                        if (value.cached !== '') {

                            //build file name (in the format <form_name>_<ref>_<uuid>_filename) with the cached value (Android) or the timestamp (iOS)
                            //Cordova Camera API unfortunately returns the timestamp as a file name on Android only, on iOS some smart guy decided to use the same file name with an incremental index (lol)
                            parts = value.cached.split('/');
                            filename = parts[parts.length - 1];

                            switch (window.device.platform) {

                                case EC.Const.ANDROID:
                                    //do nothing
                                    break;
                                case EC.Const.IOS:

                                    //replace filename with <timestamp>.jpg as on IOS the Camera, Audio and Video capture is inconsistent and returns weird file names
                                    //not always the timestamp. We want to save the files using the timestamp as we do on Android (and following Epicollect+ filename schema)
                                    if (input.type === EC.Const.PHOTO || input.type === EC.Const.AUDIO || input.type === EC.Const.VIDEO) {

                                        //get linked timestamp as we save the file using the timestamp as the file name
                                        filename_parts = filename.split('.');
                                        extension = filename_parts[filename_parts.length - 1];

                                        timestamp = EC.Utils.getIOSFilename(ios_filenames, filename);
                                        filename = timestamp + '.' + extension;
                                    }

                                    break;

                            }

                            value = form_name + '_' + input.ref + '_' + uuid + '_' + filename;

                        } else {

                            value = '';
                        }

                    } else {

                        //use the existing stored path
                        value = value.stored;
                    }
                } else {
                    //value was not defined as media value: use case when user leaves a form halfway through but still wants to save. Save an empty object then
                    value = '';
                }

            }

            //deal with branch type to save the value ({branch_form_name, total_of_entries}) in the correct format
            if (input.type === EC.Const.BRANCH) {

                //check if the branch input was skipped (by jumps or exiting a form earlier)

                if (value === EC.Const.SKIPPED) {

                    value = input.branch_form_name + ',0';

                } else {
                    //get branch form name and total of entries and save them as csv (cannot save JSON.stringify(obj) due to quotes, balls!)
                    value = value.branch_form_name + ',' + value.branch_total_entries;
                }

            }

            //dropdown/radio values
            if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO) {

                //if the input was NOT skipped, save the value or '' when no option was selected in the dropdown
                if (value !== EC.Const.SKIPPED) {

                    //if the label is the select placeholder OR the value was skipped, save an empty value
                    if (value === EC.Const.NO_OPTION_SELECTED) {
                        value = '';
                    }
                }
            }

            //checkbox values we save all the value  as csv
            if (input.type === EC.Const.CHECKBOX) {

                //if the input was NOT skipped, save the value or '' when no option was selected in the checkboxes list
                if (value !== EC.Const.SKIPPED) {
                    //TODO: if the label is the select placeholder OR the value was skipped, save an empty value does it happen this is an empty array?
                    if (value === EC.Const.NO_OPTION_SELECTED) {
                        value = '';
                    } else {
                        value = value.join(', ');
                    }
                }

            }

            rows.push({
                _id: _id, //this is set only when we are editing
                input_id: input._id,
                form_id: input.form_id,
                position: input.position,
                parent: parent_path,
                label: input.label,
                value: value,
                ref: input.ref,
                is_title: input.is_title,
                entry_key: key_value,
                type: input.type,
                is_data_synced: 0,
                is_media_synced: 0,
                is_remote: 0,
                created_on: created_on
            });

        }//for each input

        //EC.Notification.showProgressDialog();

        console.log('rows: ' + JSON.stringify(rows));

        //save/update values to database
        if (window.localStorage.edit_mode) {

            $.when(EC.Update.updateHierarchyEntryValues(rows)).then(function () {

                //TODO: check this
                //set selected key value in localStorage to show list of values later
                //window.localStorage.entry_key = key_value;

                //check if we came to the editing from a child form list or selecting the top form and going through the whole sequence
                if (window.localStorage.is_child_form_nav) {

                    //TODO

                } else {
                    window.localStorage.back_nav_url = window.localStorage.back_edit_nav_url;
                }

                //if it is a nested form, keep track of its parent and save it in localStorage
                if (key_value !== parent_path) {

                    var parent_path_array = parent_path.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
                    parent_path_array.pop();
                    window.localStorage.parent_path = parent_path_array.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
                }

                EC.Inputs.renderStoreEditFeedback(true);
            }, function () {
                EC.Inputs.renderStoreEditFeedback(false);
            });

        } else {
            //insert form values, on success/fail show feedback
            $.when(EC.Create.insertFormValues(rows, key_value)).then(function (main_form_entry_key) {
                EC.Inputs.prepareFeedback(true, main_form_entry_key);
            }, function () {
                EC.Inputs.prepareFeedback(false, null);
            });
        }
    };

    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.prepareStoreEdit = function (the_current_position, the_input, the_ctx) {

        var clone_value = '';
        var validation = {};
        var form_has_jumps;
        var current_value;
        var current_position = the_current_position;
        var input = the_input;
        var self = the_ctx;

        //disable to avoid double submit
        $(this).addClass('ui-disabled');

        form_has_jumps = window.localStorage.form_has_jumps;

        //get input value(based on input type and layout)
        current_value = EC.Inputs.getCurrentValue(input.type);
        current_position = window.localStorage.current_position;

        //if we need to check for a double entry, get clone value
        if (parseInt(input.has_double_check, 10) === 1) {

            clone_value = EC.Inputs.getCloneValue(input.type);

        }

        //validate input before going to next page
        validation = EC.Utils.isValidValue(input, current_value, clone_value);

        //check if the editing is valid
        if (!validation.is_valid) {
            //warn user about the type of error
            EC.Notification.showAlert('Error', validation.message);

            //re-enable button to allow user to try again
            $(this).removeClass('ui-disabled');
            return;
        }

        //cache current value in localStorage
        EC.Inputs.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

        //If this form has jump, edit the input_values array to set to _skipp3d_ all the values which are not part of the input_trail array
        //todo the above is wrong, we need to force the user to go to the end of the form when modifying a form with jumps, reviewing the inputs he just entered
        // (he can press 'next' over and over) -> quick and dirty solution would be disabling the on-screen store edit so the user needs to go to the end of the form, but only when he made a change to an input with a jump
        // if (form_has_jumps === '1') {

        //add current element on the view to inputs trail (as we are not tapping next)
        EC.Inputs.pushInputsTrail(input);

        //amend values skipped by the new jump sequence when editing
        //   EC.Inputs.amendSkippedValues();
        // }

        //store data.
        self.storeData(self);

    };

    return module;
}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.saveValuesOnExit = function(the_current_input) {

			var self = this;
			var current_input = the_current_input;
			//get current value from th einput currently on screen
			var current_value = self.getCurrentValue(current_input.type);
			var current_position = parseInt(window.localStorage.current_position, 10);
			var validation = self.validateValue(current_input, current_value, current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				//warn user about the type of error
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));
				return;
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, current_input.type, current_input.is_primary_key);
			self.pushInputsTrail(current_input);

			self.onStoreValues();

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    "use strict";

    module.storeData = function (the_ctx) {

        //get context
        var self = the_ctx;
        var media_files = [];

        var _getCachedMediaFiles = function () {

            var inputs_values = JSON.parse(window.localStorage.inputs_values);
            var iLength = inputs_values.length;
            var i;
            var input;
            var value;

            var files = [];

            //count how many media files we have to save
            for (i = 0; i < iLength; i++) {

                //get current value
                input = EC.Inputs.inputs[i];
                value = EC.Inputs.getCachedInputValue(input.position).value;

                if (input.type === EC.Const.PHOTO || input.type === EC.Const.VIDEO || input.type === EC.Const.AUDIO) {

                    // If cache path is empty, we do not have a file to save for that input so skip it
                    if (value.cached !== "") {
                        files.push({
                            type: input.type,
                            cached: value.cached,
                            stored: value.stored,
                            ref: input.ref
                        });
                    }
                }
            }

            /*
             * Now we got all the file paths, so clear DOM from any references
             * otherwise on editing input some cache/stored file paths could be there and
             * that causes errors upon saving
             * as the EC.File.move() mehod will look for non-existent files
             */

            if (files.length > 0) {
                //audio
                $('div#audio div#input-audio input#cached-audio-uri').val('');
                $('div#audio div#input-audio input#stored-audio-uri').val('');
            }
            return files;
        };

        media_files = _getCachedMediaFiles();

        console.log('media_files.length= ' + media_files.length);

        //Save data directly if no files are found (or we are using Chrome)
        if (media_files.length === 0 || EC.Utils.isChrome()) {

            self.buildRows();

        }
        else {

            //save media files, when all are saved trigger buildRows();
            console.log(JSON.stringify(media_files));

            EC.File.move(media_files);
        }

    };

    /** @method onStoreValues When the user tap the button to save data,
     *  check first we have a primary key to save, then take care of skipped (by a
     * jump) values
     */
    module.onStoreValues = function () {

        var self = this;

        //check if the primary key field has a value (there are cases where jumps skip
        // the primary key field, so warn the user form cannot be saved)
        if (self.isEmptyPrimaryKey()) {
            //warn user
            EC.Notification.hideProgressDialog();
            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("missing_pk"));
            return;
        }

        if (window.localStorage.form_has_jumps === '1') {
            //amend input values to save, setting the keyword "_skipp3d_" to skipped fields
            self.amendSkippedValues();
        }

        self.storeData(self);
    };

    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.addBranch = function(the_count, the_input) {

			var obj;
			var span_label = $('div#branch span.label');
			var count = the_count;
			var input = the_input;
			var project_id = window.localStorage.project_id;
			var add_branch_btn = $('div#input-branch div#add-branch-btn');
			var list_branch_entries_btn = $('div#input-branch div#list-branch-entries-btn');
			var list_entries_count = $('div#input-branch div#list-branch-entries-btn span.branch-entries-count');

			//hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to
			//var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
			//var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position).value;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			var _addBranchEntry = function() {
				//get list of inputs for the branch form and render the first one on screen
				EC.BranchInputs.getList(branch_form.name, project_id);
			};

			var _listBranchEntries = function() {
				EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
			};

			//update label text
			span_label.text(input.label);

			//attach event handlers (removing old ones to avoid tiggering an event twice)
			add_branch_btn.off().one('vclick', _addBranchEntry);

			//add branch form name as data value to add-branch button
			add_branch_btn.attr("data-branch-form-name", input.branch_form_name);

			if (count > 0) {
				//show branch entries on cick
				list_branch_entries_btn.off('vclick').one('vclick', _listBranchEntries);
				list_branch_entries_btn.removeClass("ui-disabled");
				list_branch_entries_btn.find("span.branch-entries-count").text(count);

			} else {
				//no entries for this branch, disable button and reset counter to empty(0)
				list_branch_entries_btn.addClass("ui-disabled");
				list_entries_count.text("");
			}

			//add entries count as a data atttribute to button
			list_branch_entries_btn.attr("data-entries-count", count);
			
		};

		return module;

	}(EC.InputTypes));

/*global $, jQuery, cordova, device, Media, LocalFileSystem*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.audio = function (the_value, the_input) {

        //to cache dom lookups

        var span_label = $('span.label');
        var clone = $('div.clone');
        var value = the_value;
        var input = the_input;
        var record_btn = $('div#input-audio div#start-btn');
        var stop_btn = $('div#input-audio div#stop-btn');
        var play_btn = $('div#input-audio div#play-btn');
        var ongoing_recording_spinner = $('div#input-audio div#ongoing-recording-spinner');
        var audio_feedback = $('div#input-audio p#audio-feedback');
        var cached_audio_uri = $('div#input-audio input#cached-audio-uri');
        var stored_audio_uri = $('div#input-audio input#stored-audio-uri');
        var header_btns = $('div#audio div.ui-header');
        var current_path;
        var audio_full_path_uri;
        var cache_path;
        var mediaRec;
        var current_audio;

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //attach event handlers (removing old ones to avoid tiggering an event twice)
        record_btn.off('vclick').one('vclick', recordAudio);
        stop_btn.off('vclick');
        play_btn.off('vclick').on('vclick', playAudio);

        //if an audio file is stored add it to hidden input field, to be shown if no
        // cached value is set
        if (window.localStorage.edit_mode && value.stored === undefined) {

            stored_audio_uri.val(value);
            value = {
                cached: '',
                stored: value
            };

        }//if

        //toggle 'play' button only if we have a file to play
        if (!value.cached) {

            if (value.stored) {

                play_btn.removeClass('ui-disabled');

                //build full path to get audio file from private app folder (depending on
                // platform)
                switch (window.device.platform) {
                    case EC.Const.ANDROID:
                        audio_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;
                        break;
                    case EC.Const.IOS:

                        audio_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;

                        break;
                }

                console.log('audio_full_path_uri: ' + audio_full_path_uri);

                current_path = audio_full_path_uri;

                audio_feedback.text('Audio available');

                console.log('current_path: ' + JSON.stringify(audio_full_path_uri));

            }
            else {

                play_btn.addClass('ui-disabled');
            }

        }
        else {

            console.log('we have a cached value');

            //we have a cached file to play, current path gets the cached value
            play_btn.removeClass('ui-disabled');
            current_path = cached_audio_uri.val();

        }

        console.log('cache_audio_uri: ' + cached_audio_uri.val());

        //add store audio uri cache_path (if any)
        stored_audio_uri.val(value.stored || '');

        //reset recording buttons
        record_btn.removeClass('enable');
        stop_btn.addClass('ui-disabled');

        //request temporary folder from file system based on platform
        //todo this will probably change with the new Cordova iOS to match Android
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cache_path);


                /* We need to provide the full path to the tmp folder to record an audio file
                 *
                 * iOS 7+ does not want 'file://' in the path to record an audio file
                 *
                 * if the path starts with 'file://', error thrown is
                 * 'Failed to start recording using AvAudioRecorder'
                 * so it is removed using slice(7);
                 */
                cache_path = cache_path.slice(7);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //Android only getting public cache directory
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cache_path);

            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }


        //record audio
        function recordAudio(e) {

            var filename;

            //disable navigation buttons while recording
            header_btns.addClass('ui-disabled');

            //disable player buttons while recording
            stop_btn.removeClass('ui-disabled');
            stop_btn.one('vclick', stopRecordAudio);
            record_btn.addClass('ui-disabled');
            play_btn.addClass('hidden');
            ongoing_recording_spinner.removeClass('hidden');

            //if the current path is not set yet, we are definitely recording a new audio
            // file
            if (!current_path) {
                current_path = cache_path + EC.Utils.generateAudioFileName();
            }
            else {

                /* we have a current path, is it a saved file or cached?
                 * if it is a saved file, we have to replace the current path with the new
                 * recording
                 * path , pointing to the cache folder. This is to replace the existing stored
                 * audio file with the new recording, so the new cached file will override the
                 * stored file when saving the entry
                 */
                if (EC.Utils.isAudioFileStored(cache_path, current_path)) {
                    current_path = cache_path + EC.Utils.generateAudioFileName();
                }
            }

            console.log('Recording... - Full path: ' + current_path);

            mediaRec = new Media(current_path,

                // success callback
                function onRecordingSuccess() {

                    play_btn.removeClass('ui-disabled');
                    audio_feedback.text('Audio available');
                    console.log('recordAudio():Audio Success');

                    cached_audio_uri.val(current_path);

                    console.log('current_path: ' + current_path);

                },

                // error callback
                function onRecordingError(err) {
                    console.log('recordAudio():Audio Error: ' + err.code);
                    console.log('recordAudio():Audio Error: ' + JSON.stringify(err));
                });

            // Record audio
            mediaRec.startRecord();

            e.preventDefault();
            e.stopPropagation();

        }//recordAudio

        //stop recording
        function stopRecordAudio(e) {

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //enable player buttons
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('hidden ui-disabled');
            ongoing_recording_spinner.addClass('hidden');

            record_btn.off().one('vclick', recordAudio);

            //stop recording and release resources
            mediaRec.stopRecord();
            mediaRec.release();

            e.preventDefault();
            e.stopPropagation();

        }

        function stopPlayingAudio(e) {

            console.log('Audio stopped');

            //stop audio and release resources
            current_audio.stop();
            current_audio.release();

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //re-enable player buttons
            stop_btn.off().one('vclick', stopRecordAudio);
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('ui-disabled');

        }

        //play the audio
        function playAudio() {

            //disable navigation buttons while playing
            header_btns.addClass('ui-disabled');

            //current_path = cached_audio_uri.val();
            console.log('Playing... ' + current_path);

            //unbind stopRecordAudio to bind stopPlayingAudio
            stop_btn.off().one('vclick', stopPlayingAudio);
            stop_btn.removeClass('ui-disabled');
            play_btn.addClass('ui-disabled');
            record_btn.addClass('ui-disabled');

            function onPlayStatusChange(the_status) {

                var status = the_status;

                if (status === 4) {

                    //re-enable navigation buttons
                    header_btns.removeClass('ui-disabled');

                    //re-enable player buttons
                    stop_btn.addClass('ui-disabled');
                    record_btn.removeClass('ui-disabled');
                    play_btn.removeClass('ui-disabled');

                }
            }

            current_audio = new Media(current_path, null, null, onPlayStatusChange);
            current_audio.play();

        }//playAudio

    };

    return module;

}(EC.InputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery, cordova*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
		"use strict";

		module.barcode = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#barcode span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var scanner = $('div#barcode div#scanner');
			var scanner_confirm = $('div#barcode div#scanner-confirm');
			var scan_result = $('div#barcode input.scan-result');
			var scan_result_confirm = $('div#barcode input.scan-result-confirm');

			//update label text
			span_label.text(input.label);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches
				// pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//reset buttons
			scanner.removeClass('ui-disabled');
			scanner_confirm.removeClass('ui-disabled');

			scan_result.val(value);

			//if in editing mode, do not allow changes either if the field is a
			// primary key or it triggers a jump
			if (window.localStorage.edit_mode && input.is_primary_key === '1') {
				//disable scan button
				scanner.addClass('ui-disabled');
				$('div#input-barcode p.primary-key-not-editable').removeClass("hidden");
			}
			else {
				$('div#input-barcode p.primary-key-not-editable').addClass("hidden");
			}

			if (double_entry) {

				//duplicate text input
				clone.removeClass('hidden');
				scan_result_confirm.val(value);

				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					//disable clone scan button
					scanner_confirm.addClass('ui-disabled');
				}

				//add event handler to second scan button
				scanner_confirm.off().on('vclick', function() {

					//flag needed to handle case when user dismiss the barcode scanner
					window.localStorage.is_dismissing_barcode = 1;

					cordova.plugins.barcodeScanner.scan(function(result) {

						//do not override value if the scan action is cancelled by the user
						if (!result.cancelled) {
							scan_result_confirm.val(result.text);
						}

					}, function(error) {
						console.log(error);
					});
				});
			}
			else {
				//add hidden class if missing
				clone.addClass('hidden');
			}

			//set handlers for scan button
			scanner.off().on('vclick', function() {

				//flag needed to handle case when user dismiss the barcode scanner
				window.localStorage.is_dismissing_barcode = 1;

				cordova.plugins.barcodeScanner.scan(function(result) {

					console.log(result);

					//do not override value if the scan action is cancelled by the user
					if (!result.cancelled) {
						scan_result.val(result.text);
					}

				}, function(error) {
					console.log(error);
					//EC.Notification.showAlert("Scanning failed", error);
				});

			});

		};

		return module;

	}(EC.InputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.checkbox = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#checkbox span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var CHECKBOX_CHECKED = "";
			var DISABLED = "";
			var SELECTED = "";
			var HTML = "";

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');
			} else {
				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//if in editing mode, do not allow changes either if the field is a primary key or it triggers a jump
			if (window.localStorage.edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
				DISABLED = 'disabled="disabled"';
			}

			//display all checkboxes options
			$(input.options).each(function(index) {

				var name = "choice";
				var option_value = this.value.trim();
				var option_label = this.label.trim();
				var option_id = 'checkbox-choice-' + (index + 1);
				var i;
				var iLength = value.length;

				//check if we have any value stored. For checkboxes, 'value' will be an array
				for ( i = 0; i < iLength; i++) {

					CHECKBOX_CHECKED = "";
					//if any match is found, pre-select that checkbox in the markup
					if (value[i].trim() === option_value) {
						CHECKBOX_CHECKED = 'checked="checked"';
						break;
					}
				}

				HTML += '<label>';
				HTML += '<input type="checkbox" ' + CHECKBOX_CHECKED + ' ' + DISABLED + ' name="' + name;
				HTML += '" id="' + option_id;
				HTML += '" value="' + option_value;
				HTML += '" data-label="' + option_label;
				HTML += '" />' + option_label;
				HTML += '</label>';

			});

			span_label.append(HTML);
			$('div#input-checkbox').trigger("create");

		};

		return module;

	}(EC.InputTypes));

/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device */

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
		"use strict";

		module.date = function(the_value, the_input) {

			var datepicker;
			var ios_datepicker;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;
			var default_date;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');
			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//Android Phonegap DatePicker plugin http://goo.gl/xLrqZl
			datepicker = $('div#input-date input.nativedatepicker');

			//iOS uses the HTML5 input type="date"
			ios_datepicker = $('div#input-date input.ios-date');

			//hide immediate ios date input parent (JQM quirk, this is to hide the div
			// element border wrapping the input after JQM enhanced the markup)
			ios_datepicker.parent().addClass("no-border");

			/* Set current date in custom data attribute.
			 * Important: since Epicollect+  for some bizzarre reason does not store the
			 * timestamps yet, but a formatted date,
			 * it is impossible to trigger the datapicker to the right data/time value after
			 * a saving, as the timestamp is lost
			 * i.e. if I save save 25th march 1988 just as 25/3, I will never get the year
			 * back :/ and it will default to the current date
			 * TODO: save date and time values with a timestamp attached
			 */

			datepicker.attr("data-raw-date", new Date());

			/*show default date if input.value = input.datetime_format:
			 *if the option to show the current date as default is selected in the web form
			 * builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (value === input.datetime_format) {
				datepicker.val(EC.Utils.parseDate(new Date(), input.datetime_format));
			}
			else {
				datepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {

				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the
				 * input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */
				datepicker.off().on('vclick', function(event) {

					var datepicker = $(this);
					var selected_date = new Date(datepicker.attr("data-raw-date"));

					//use debouncing/throttling to avoid triggering multiple `focus` event
					// http://goo.gl/NFdHDW
					var now = new Date();
					var lastFocus = datepicker.data("lastFocus");
					if (lastFocus && (now - lastFocus) < 500) {
						// Don't do anything
						return;
					}

					datepicker.data("lastFocus", now);

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'date', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {

						var new_date;

						if (returned_date !== undefined) {
							new_date = new Date(returned_date);

							datepicker.val(EC.Utils.parseDate(new_date, input.datetime_format));
							datepicker.attr("data-raw-date", new_date);
						}

						// This fixes the problem you mention at the bottom of this script with it not
						// working a second/third time around, because it is in focus.
						datepicker.blur();
					});

					// This fixes the problem you mention at the bottom of this script with it not
					// working a second/third time around, because it is in focus.
					datepicker.blur();
				});

			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="date"
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				datepicker.off().on('vclick', function(event) {
					ios_datepicker.focus();
				});

				ios_datepicker.off().on('blur', function(event) {

					var ios_date = ios_datepicker.val();

					datepicker.val(EC.Utils.parseIOSDate(ios_date, input.datetime_format));
					datepicker.attr("data-raw-date", ios_date);
				});
			}
		};

		return module;

	}(EC.InputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
        "use strict";

        module.decimal = function(the_value, the_input) {

            //to cache dom lookups
            var obj;
            var span_label = $('span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;
            // var ios_decimal_part = $("div#input-decimal
            // input#decimal-for-ios");
            var min_range = $('span.min-range');
            var max_range = $('span.max-range');

            //update label text
            span_label.text(input.label);

            //Localise
            if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
                EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
            }

            //Add attribute to flag the primary key input field
            if (parseInt(input.is_primary_key, 10) === 1) {

                span_label.attr('data-primary-key', 'true');

            } else {

                //reset the attribute to empty if not a primary key (JQM caches
                // pages and we recycle views)
                span_label.attr('data-primary-key', '');
            }

            //check if we need to replicate this input
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            //re-enable input if needed
            $('div#input-decimal input').removeAttr('disabled');

            if (window.device.platform === EC.Const.IOS) {

                /**
                 * Trigger numeric keyboard with added key for comma or dot on
                 * iOS
                 * This will still bring the full keyboard but in the
                 * number/symbol pane be default.
                 * The user can still switch to alphanumeric BUT upon onblur
                 * event,
                 * the pattern kicks in and removes any alphanumeric characters
                 * (but not numbers).
                 */
                //$('div#input-decimal input').attr("pattern", "\d+(\.\d*)?");

            }

            //hide elements not needed
            clone.addClass('hidden');
            min_range.addClass('hidden');
            max_range.addClass('hidden');

            if (double_entry) {

                //duplicate textarea input
                clone.removeClass('hidden');
                $('div.clone input').val(value);

                //if in editing mode, do not allow changes either if the field is
                // a primary key or it triggers a jump
                if (window.localStorage.edit_mode && input.is_primary_key === 1) {

                    $('div.clone input').attr('disabled', 'disabled');
                }

            }

            //show min range if any
            if (input.min_range !== "") {

                min_range.removeClass('hidden');
                min_range.text('Min: ' + input.min_range);

            }

            //show max range if any
            if (input.max_range !== "") {

                max_range.removeClass('hidden');
                max_range.text('Max: ' + input.max_range);

            }

            $('div#input-decimal input').val(value);

            //if in editing mode, do not allow changes either if the field is a
            // primary key
            if (window.localStorage.edit_mode && input.is_primary_key === 1) {

                $('div#input-decimal input').attr('disabled', 'disabled');
                $('div#input-decimal p.primary-key-not-editable').removeClass("hidden");
            } else {
                $('div#input-decimal p.primary-key-not-editable').addClass("hidden");
            }

        };

        return module;

    }(EC.InputTypes));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
        "use strict";

        module.dropdown = function(the_value, the_input) {

            var obj;
            var span_label = $('div#select span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;
            var DISABLED = "";
            var SELECTED = "";
            var HTML = "";

            //update label text
            span_label.text(input.label);

            //Localise
            if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
                EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
            }

            //Add attribute to flag the primary key input field
            if (parseInt(input.is_primary_key, 10) === 1) {
                span_label.attr('data-primary-key', 'true');
            } else {
                //reset the attribute to empty if not a primary key (JQM caches
                // pages and we recycle views)
                span_label.attr('data-primary-key', '');
            }

            //check if we need to replicate this input
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            //if in editing mode, do not allow changes either if the field is a
            // primary key or it triggers a jump
            if (window.localStorage.edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
                DISABLED = 'disabled="disabled"';
            }

            //set the cached value as the selcted option
            SELECTED = (value === "") ? 'selected' : "";

            //TODO: check markup on jqm docs for select. Fastclick: is needclick
            // needed?
            HTML += '<select id="selection" name="selection" data-native-menu="true" >';
            HTML += '<option value ="0"' + SELECTED + ' data-index="0">';
            HTML += EC.Localise.getTranslation(EC.Const.NO_OPTION_SELECTED);
            HTML += '</option>';

            $(input.options).each(function(index) {

                var option_value = this.value;
                var option_index = (index + 1);
                var option_label = this.label;
                var option_id = 'select-choice-' + (index + 1);

                //check if we have a value cached and pre-select that input
                SELECTED = (value === option_value) ? 'selected' : "";

                HTML += '<option ' + SELECTED + ' ' + DISABLED + ' value ="' + option_value + '" data-index="' + option_index + '">' + option_label + '</option>';

            });

            HTML += '</select>';

            span_label.append(HTML);
            $('div#input-dropdown').trigger("create");

            /*****************************************************************************************************
             *	Following code is a hack to make the select native widget work on
             * Android 4.4.2 (Nexus 5)
             */
            //Add needclick to all the markup as Fastclick is interfering and the
            // native popup with the list of options is never triggered
            // $("div#input-dropdown").addClass("needsclick");
            // $("div#input-dropdown div.ui-select").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn
            // span.ui-btn-inner").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text span").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-icon").addClass("needsclick");

            //Manually trigger a click on a select element. Best solution I came
            // across
            $("select").on('vmousedown', function(e) {
                $(this).focus().click();
            });

            /*****************************************************************************************************
             * End hack
             */

        };

        return module;

    }(EC.InputTypes));

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.integer = function(the_value, the_input) {

			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = parseInt(the_value, 10);
			var input = the_input;
			var min_range = $('span.min-range');
			var max_range = $('span.max-range');

			//update label text
			span_label.text(input.label);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');
			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) == 1);

			//trigger numeric keyboard on iOS
			if (window.device.platform === EC.Const.IOS) {
				$('div#input-integer input').attr('pattern', '[0-9]*');
			}

			//hide elements not needed
			clone.addClass('hidden');
			min_range.addClass('hidden');
			max_range.addClass('hidden');

			//check if we need to render a double entry for this input
			if (double_entry) {

				//duplicate integer input
				clone.removeClass('hidden');
				$('div.clone input').val(value  = isNaN(value) ? "" : value);

				//if in editing mode, do not allow changes either if the field is a primary key
				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			}
			//show min range if any
			if (input.min_range !== "") {

				min_range.removeClass('hidden');
				min_range.text('Min: ' + input.min_range);

			}

			//show max range if any
			if (input.max_range !== "") {

				max_range.removeClass('hidden');
				max_range.text('Max: ' + input.max_range);

			}

			$('div#input-integer input').val(value  = isNaN(value) ? "" : value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.edit_mode && input.is_primary_key === 1) {
				$('div#input-integer input').attr('disabled', 'disabled');
				$('div#input-integer p.primary-key-not-editable').removeClass("hidden");
			} else {
				//re-enable input if needed
				$('div#input-integer input').removeAttr('disabled');
				$('div#input-integer p.primary-key-not-editable').addClass("hidden");
			}

		};

		return module;

	}(EC.InputTypes));

/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    var self;

    module.location = function (the_value, the_input) {

        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var set_location_btn = $('div#location div#input-location div#set-location');
        var textarea_coords = $('textarea#coords');
        var accuracy_result = $('div#location  div#input-location div.current-accuracy-result');
        var accuracy_tip = $('div#location  div#input-location div.location-accuracy-tip');
        var map_canvas = $('div#location div#input-location div#map-canvas');
        var cached_coords = [];

        self = this;
        //update label text
        span_label.text(input.label);

        //Localise text
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //hide feedback when showing the view the first time
        accuracy_result.addClass('hidden');
        accuracy_tip.addClass('hidden');
        map_canvas.addClass('hidden');

        //get a rough location when the view is first loaded (no value set yet)
        if (value === '') {
            EC.Notification.showProgressDialog('Wait', 'Locating...');
            $.when(EC.DevicePosition.getCurrentPosition()).then(function () {

                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));
                $(accuracy_result).removeClass('hidden');
                $(accuracy_tip).removeClass('hidden');

                //if the user wants to use the enhanced map, load Google Maps APi (it returns immediately if already loaded on app cold start)
                if (EC.DevicePosition.is_enhanced_map_on()) {

                    map_canvas.removeClass('hidden');
                    textarea_coords.addClass('hidden');

                    $.when(EC.DevicePosition.loadGoogleMapsApi()).then(function () {
                        $.when(EC.DevicePosition.initGoogleMap()).then(function () {
                            EC.Notification.hideProgressDialog();
                        });
                    }, function () {

                        //loading Google Maps Api failed, show standard view, warn user and rever back to standard mode
                        window.localStorage.is_enhanced_map_on = 0;

                        EC.Notification.showAlert('Sorry...', 'Google Maps failed to load, reverting to standard mode');
                        textarea_coords.val(EC.DevicePosition.getCoordsFormattedText()).removeClass('hidden');
                        map_canvas.addClass('hidden');
                        EC.Notification.hideProgressDialog();
                    });
                }
                else {
                    //show standard view
                    textarea_coords.val(EC.DevicePosition.getCoordsFormattedText());
                    textarea_coords.removeClass('hidden');
                    EC.Notification.hideProgressDialog();
                }
            }, function (error) {
                EC.Notification.hideProgressDialog();
                EC.Notification.showToast('Could not locate', 'long');
                textarea_coords.removeClass('hidden');
                textarea_coords.val(EC.DevicePosition.getCoordsEmptyText());

                //set empty coords (resolving to all the properties set to ''), this will be picked up when changing page
                EC.DevicePosition.setEmptyCoords();
            });
        }
        else {

            accuracy_result.find('span').text(Math.floor(EC.Utils.parseLocationString(value).accuracy));
            accuracy_result.removeClass('hidden');
            accuracy_tip.removeClass('hidden');

            //set previous location value if any
            if (EC.DevicePosition.is_enhanced_map_on()) {

                //deal with enhanced maps
                map_canvas.removeClass('hidden');
                textarea_coords.addClass('hidden');

                //if the cached coords are the same, the user is navigating back and forth the inputs only, so do not update the map

                //set coords in DevicePosition object to set google maps to that value before initialising map
                cached_coords = EC.Utils.parseLocationString(value);
                if (cached_coords.latitude === EC.DevicePosition.coords.latitude && cached_coords.longitude === EC.DevicePosition.coords.longitude) {

                    //todo: same position, do not update. If we are editing, create a map and set position
                }
                else {

                    //todo different position, update marker, circle and bounds using existing map object if any, or create it
                    console.log('map needs to be updated');
                }

                EC.Notification.hideProgressDialog();

            } else {
                textarea_coords.val(value);
                $(textarea_coords).removeClass('hidden');
                EC.Notification.hideProgressDialog();
            }
        }

        //todo strings need to be translated
        function _showAcquiredLocation(has_got_location) {

            accuracy_result.removeClass('hidden');
            accuracy_tip.removeClass('hidden');

            if (has_got_location) {

                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));

                if (EC.DevicePosition.is_enhanced_map_on()) {

                    map_canvas.removeClass('hidden');
                    textarea_coords.addClass('hidden');

                    //update enhanced view
                    EC.DevicePosition.current_position = new google.maps.LatLng(EC.DevicePosition.coords.latitude, EC.DevicePosition.coords.longitude);

                    //update marker position
                    EC.DevicePosition.marker.setPosition(EC.DevicePosition.current_position);

                    //update accuracy circle
                    EC.DevicePosition.circle.setOptions({
                        center: EC.DevicePosition.current_position,
                        radius: EC.DevicePosition.coords.accuracy
                    });
                }
                else {
                    //standar view
                    textarea_coords.val(EC.DevicePosition.getCoordsFormattedText());
                }

                if (!EC.Utils.isChrome()) {
                    EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
                }

            }
            else {
                //set location object to empty values
                if (EC.DevicePosition.is_enhanced_map_on()) {

                    //todo what about google maps -> hide map canvas?
                }
                else {
                    textarea_coords.val(EC.DevicePosition.getCoordsEmptyText());
                }

            }
            set_location_btn.one('vclick', _handleSetLocation);
            EC.Notification.hideProgressDialog();
        }

        var _handleSetLocation = function () {

            set_location_btn.off('vclick');

            //check id GPS is enabled on the device
            //todo check if it on when we start watch position
            $.when(EC.Utils.isGPSEnabled()).then(function () {

                //gps is on
                EC.Notification.showProgressDialog(EC.Localise.getTranslation('locating'), EC.Localise.getTranslation('wait'));

                //On Android, mostly on old devices, halt the execution to solve loader spinner not hiding after a gps lock
                if (window.device.platform === EC.Const.ANDROID) {
                    //if the device is older than KitKat I assume it is slow to hide the spinning loader and I need the execution halt to clear race conditions
                    if (!(EC.Const.KITKAT_REGEX.test(window.device.version) || EC.Const.LOLLIPOP_REGEX)) {
                        EC.Utils.sleep(2000);
                    }
                }

                //has the device a good connection?(showing maps and then lost the connection for some reasons? revert to standard view then)
                if (!EC.Utils.hasGoodConnection()) {
                    window.localStorage.is_enhanced_map_on = 0;
                }


                $.when(EC.DevicePosition.watchPosition()).then(function (response) {
                    _showAcquiredLocation(response);
                });

            }, function () {
                console.log('gps NOT enabled');

                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('gps_disabled'));

                //re-enable button
                set_location_btn.on('vclick');
            });

        };

        //bind set location button
        set_location_btn.off().one('vclick', _handleSetLocation);

    };

    return module;

}(EC.InputTypes));

/*global $, jQuery, Camera, FileViewerPlugin*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.photo = function (the_value, the_input) {

        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var camera_btn = $('div#input-photo div#camera-btn');
        var store_image_uri = $('div#input-photo input#stored-image-uri');
        var cache_image_uri = $('div#input-photo input#cached-image-uri');
        var image_full_path_uri;
        var app_photo_dir = EC.Photo.getStoredImageDir();

        //clear canvas from previous images
        var canvas_portrait_dom = $('#canvas-portrait');
        var canvas_landscape_dom = $('#canvas-landscape');
        var canvas_portrait = canvas_portrait_dom[0];
        var canvas_landscape = canvas_landscape_dom[0];
        var context_portrait = canvas_portrait.getContext('2d');
        var context_landscape = canvas_landscape.getContext('2d');
        context_portrait.clearRect(0, 0, canvas_portrait.width, canvas_portrait.height);
        context_landscape.clearRect(0, 0, canvas_landscape.width, canvas_landscape.height);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //hide both canvas
        canvas_landscape_dom.addClass('hidden');
        canvas_portrait_dom.addClass('hidden');

        //update label text
        span_label.text(input.label);

        //if a value is stored when editing, on the first load add it to
        // hidden input field,  to be shown if no cached value is set
        if (window.localStorage.edit_mode) {
            if (value.stored === undefined) {
                store_image_uri.val(value);
                value = {
                    cached: '',
                    stored: value
                };
            }
            else {
                store_image_uri.val(value.stored);
            }
        }
        else {
            //clear any previous stored path in the DOM, otherwise it get cached and it causes the same image to be overriden when adding a new entry
            store_image_uri.val('');
        }

        console.log('value.stored ' + JSON.stringify(value.stored));

        //If a cache value is set, add it to hidden field
        cache_image_uri.val(value.cached || '');
        console.log('cache_image_uri: ' + cache_image_uri.val());

        //Show cached image if any, otherwise the stored image, if any
        if (value.cached === '') {
            console.log('cached value empty');
            if (value.stored !== '') {
                image_full_path_uri = app_photo_dir + value.stored;
                console.log('image_full_path_uri: ' + image_full_path_uri);
                EC.Photo.renderOnCanvas(canvas_portrait_dom, canvas_landscape_dom, image_full_path_uri);
                // _renderOnImg(image_full_path_uri);
            }
        }
        else {
            EC.Photo.renderOnCanvas(canvas_portrait_dom, canvas_landscape_dom, value.cached);
            //_renderOnImg(value.cached);
        }

        //open camera app on click
        camera_btn.off().on('vclick', function () {

            EC.Notification.showProgressDialog();

            navigator.camera.getPicture(function (the_image_uri) {
                    console.log('image_uri: ' + the_image_uri);
                    var image_uri = the_image_uri;
                    //render the new image on canvas
                    EC.Photo.renderOnCanvas(canvas_portrait_dom, canvas_landscape_dom, image_uri);
                    // _renderOnImg(image_uri);
                    //save cached filename in hidden input field
                    console.log('image uri is' + image_uri);
                    $('div#input-photo input#cached-image-uri').val(image_uri);
                }, function (error) {
                    console.log('Error', 'Failed because: ' + error);
                    EC.Notification.hideProgressDialog();
                },
                EC.Photo.getCameraOptions()
            );
        });

        //open image view popup for both implementation (canvas or img)
        $('.thumb').off().on('vclick', function (e) {
            var href = $('div#input-photo input#cached-image-uri').val();
            //if cached image url is empty, get stored image url
            if (href === '') {
                href = app_photo_dir + $('div#input-photo input#stored-image-uri').val();
            }
            EC.Photo.openImageView(e, href);
        });
    };

    return module;

}(EC.InputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.radio = function(the_value, the_input) {

			var obj;
			var span_label = $('div#radio div#input-radio span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var old_cached_value;
			var input = the_input;
			var HTML = "";
			var RADIO_CHECKED = "";
			var DISABLED = "";

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {
				span_label.attr('data-primary-key', 'true');
			} else {
				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//if in editing mode, do not allow changes if the field is a primary key
			if (window.localStorage.edit_mode && parseInt(input.is_primary_key, 10) === 1) {
				DISABLED = 'disabled="disabled"';
			}
			
			HTML += '<fieldset data-role="controlgroup">';

			//render list of options
			$(input.options).each(function(index) {

				//increase value by 1, as we use value = 0 when no option is selected (like for select/dropdown) We are using the index as radio jumps are mapped against the index of the value
				var option_value = this.value;
				var option_index = (index + 1);
				var option_label = this.label;
				var option_id = 'radio-choice-' + (index + 1);

				//pre select an element if the value matches the cached value
				RADIO_CHECKED = (value === option_value) ? 'checked="checked"' : "";

				HTML += '<input type="radio" name="radio-options" id="' + option_id + '" value="' + option_value + '"' + RADIO_CHECKED + ' ' + DISABLED + ' data-index="' + option_index + '">';
				HTML += '<label for="' + option_id + '">' + option_label + '</label>';
			});

			HTML += '</fieldset>';

			span_label.append(HTML);
			$('div#input-radio').trigger("create");
		};

		return module;

	}(EC.InputTypes));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";
	
	module.text = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#input-text input').removeAttr('disabled');

			if (double_entry) {

				//duplicate text input
				clone.removeClass('hidden');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				console.log( typeof input.is_primary_key);
				console.log( typeof input.has_jump);

				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			$('div#input-text input').val(value);

			//if it is a genkey field, disable input and pre-fill it with the genkey
			if (parseInt(input.is_genkey,10) === 1 && value === "") {

				$('div#input-text input').attr('disabled', 'disabled').val(EC.Utils.getGenKey());
				return;

			}

			//if in editing mode, do not allow changes if the field is a primary key 
			if (window.localStorage.edit_mode && input.is_primary_key === 1) {
				$('div#input-text input').attr('disabled', 'disabled');
				$('div#input-text p.primary-key-not-editable').removeClass("hidden");
			}
			else{
				$('div#input-text p.primary-key-not-editable').addClass("hidden");
			}
			

		};

	
	return module;
	
}(EC.InputTypes));
/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.textarea = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			//update label text
			span_label.text(input.label);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#input-textarea textarea').removeAttr('disabled');

			if (double_entry) {

				//duplicate textarea input
				clone.removeClass('hidden');
				$('div.clone textarea').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					$('div.clone textarea').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			//Set value
			$('div#input-textarea textarea').val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.edit_mode && input.is_primary_key === 1) {

				$('div#input-textarea textarea').attr('disabled', 'disabled');
				$('div#input-textarea p.primary-key-not-editable').removeClass("hidden");
			}
			else{
				$('div#input-textarea p.primary-key-not-editable').addClass("hidden");
			}
			
			

		};

		return module;

	}(EC.InputTypes)); 
/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
		"use strict";

		module.time = function(the_value, the_input) {

			var timepicker;
			var ios_timepicker;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//Android Phonegap timepicker plugin http://goo.gl/xLrqZl
			timepicker = $('div#input-time input.nativedatepicker');

			//iOS uses the HTML5 input type="time"
			ios_timepicker = $('div#input-time input.ios-time');

			//hide immediate ios time input parent (JQM quirk, this is to hide the div
			// element border wrapping the input after JQM enhanced the markup)
			ios_timepicker.parent().addClass("no-border");

			/*show current time if value = input.datetime_format:
			 *if the option to show the current time as default is selected in the web form
			 * builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (value === input.datetime_format) {
				timepicker.val(EC.Utils.parseTime(new Date(), input.datetime_format));
			}
			else {
				//show cached value
				timepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {
				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the
				 * input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */
				timepicker.off().on('vclick', function(e) {

					var timepicker = $(this);
					var selected_date = Date.parse(timepicker.val()) || new Date();

					//use debouncing/throttling to avoid triggering multiple `focus` event
					// http://goo.gl/NFdHDW
					var now = new Date();
					var lastFocus = timepicker.data("lastFocus");
					if (lastFocus && (now - lastFocus) < 500) {
						// Don't do anything
						return;
					}
					timepicker.data("lastFocus", now);

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'time', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {
						
						var new_date;

						if (returned_date !== undefined) {

							new_date = new Date(returned_date);

							timepicker.val(EC.Utils.parseTime(new_date, input.datetime_format));
						}

						// This fixes the problem you mention at the bottom of this script with it not
						// working a second/third time around, because it is in focus.
						timepicker.blur();
					});
				});
			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="time", only hours and minutes are
			 * returned
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				timepicker.off().on('vclick', function(event) {

					ios_timepicker.focus();

				});

				ios_timepicker.off().on('blur', function(event) {

					var ios_time = ios_timepicker.val();

					//get seconds (based on current time)
					var date = new Date(event.timeStamp);
					var seconds = date.getSeconds();

					//add seconds to have a string like HH:mm:ss
					ios_time = ios_time + ":" + seconds;

					timepicker.val(EC.Utils.parseIOSTime(ios_time, input.datetime_format));
					timepicker.attr("data-raw-date", ios_time);

				});
			}

		};

		return module;

	}(EC.InputTypes));

/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.video = function (the_value, the_input) {

        //to cache dom lookups
        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var video_btn = $('div#input-video div#video-btn');
        var play_video_btn = $('div#input-video div#play-video-btn');
        var store_video_uri = $('div#input-video input#stored-video-uri');
        var cache_video_uri = $('div#input-video input#cached-video-uri');
        var video_full_path_uri;
        var cached_path;
        var video_sd_path;
        var ios_video_player_wrapper = $('div#input-video div#ios-video-player-wrapper');
        var ios_video_player = $('div#input-video video#ios-video-player');

        var _renderVideo = function (the_video_file_path) {

            play_video_btn.attr('data-video-path', the_video_file_path);
            play_video_btn.removeClass('ui-disabled');

        };

        //hide play button on ios, also hide video wrapper
        if (window.device.platform === EC.Const.IOS) {
            $(play_video_btn, ios_video_player_wrapper).addClass('hidden');

        }

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //if a value is stored, on the first load add it to hidden input field,  to be
        // shown if no cached value is set
        if (window.localStorage.edit_mode) {

            if (value.stored === undefined) {
                store_video_uri.val(value);
                value = {
                    cached: '',
                    stored: value
                };
            }
            else {
                store_video_uri.val(value.stored);
            }
        }

        console.log('value.stored ' + JSON.stringify(value.stored));

        //If a cache value is set, add it to hidden field
        cache_video_uri.val(value.cached || '');
        console.log('cache_video_uri: ' + cache_video_uri.val());

        //Show cached video if any, otherwise the stored video, if any
        if (value.cached === '') {

            console.log('cached value empty');

            if (value.stored !== '') {

                //build full path to get video from private app folder depending on platform
                switch (window.device.platform) {
                    case EC.Const.ANDROID:

                        video_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        /** Copy video to cache folder to make it playable (rename it using timestamp).
                         *    Due to permission issues, on Android files are not accessible by other
                         * application
                         *  Since Android support for <video> is pretty weak, we need to use an external
                         * video player app top play the video
                         *  (Whatever app capable of playing the video is installed on the device will be
                         * triggered via an intent)
                         */

                        EC.Notification.showProgressDialog();
                        $.when(EC.File.copyVideo(video_full_path_uri)).then(function (the_cached_filename) {

                            //file has been copied, update view setting it as cached file to play
                            cache_video_uri.val(the_cached_filename);
                            play_video_btn.attr('data-video-path', the_cached_filename);
                            play_video_btn.removeClass('ui-disabled');

                            EC.Notification.hideProgressDialog();

                        });
                        break;

                    case EC.Const.IOS:
                        //build full path (file is stored in persisten storage (Documents folder))
                        video_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        //add source to HTML5 video tag, 'file://' needs to be aded for file access
                        //TODO: on first load, the preview image for the video, bug?
                        ios_video_player.attr('src', 'file://' + video_full_path_uri);

                        /*this is causing the video to open automatically on iOS7,
                         * it is here because the video preview does not work on iOS 8 without it
                         */
                        if (parseFloat(window.device.version) >= 8) {
                            ios_video_player.load();
                        }

                        //show video player wrapper
                        ios_video_player_wrapper.removeClass('hidden');
                        break;
                }
            }
            else {
                play_video_btn.addClass('ui-disabled');
                ios_video_player_wrapper.addClass('hidden');
            }

        }
        else {

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    //render the cached video
                    _renderVideo(value.cached);
                    break;

                case EC.Const.IOS:
                    ios_video_player_wrapper.removeClass('hidden');
                    break;

            }

        }

        //request temporary folder from file system based on platform
        //todo: this will change on iOS with the next release to match Android I suppose
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //on Android only
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }


        //Success callback
        var onCaptureVideoSuccess = function (the_media_object) {

            var cache_video_uri = $('div#input-video input#cached-video-uri');

            console.log(cache_video_uri.val());

            console.log(JSON.stringify(the_media_object[0]));

            video_sd_path = the_media_object[0].fullPath;

            EC.Notification.showProgressDialog();

            //move video to cache folder (temporary storage)
            $.when(EC.File.moveVideo(video_sd_path, cache_video_uri.val())).then(function (the_cached_video_path) {

                if (window.device.platform === EC.Const.IOS) {

                    ios_video_player_wrapper.removeClass('hidden');

                    //request temporary folder from file system
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                        //imp! since Cordova 3.5+ 'fullPath' became nativeURL
                        var temp_cache_path = the_file_system.root.nativeURL;

                        var video_full_path = temp_cache_path + '/' + the_cached_video_path;

                        ios_video_player.attr('src', video_full_path);

                        cache_video_uri.val(the_cached_video_path);
                        EC.Notification.hideProgressDialog();

                    }, function (error) {
                        console.log(JSON.stringify(error));
                        EC.Notification.hideProgressDialog();
                    });
                }

                if (window.device.platform === EC.Const.ANDROID) {

                    //update cached video uri to use always the same name
                    //when taking more videos for the same input and avoid several cached videos
                    cache_video_uri.val(the_cached_video_path);
                    play_video_btn.attr('data-video-path', the_cached_video_path);
                    play_video_btn.removeClass('ui-disabled');
                    EC.Notification.hideProgressDialog();
                }

            });

        };

        var onCaptureVideoError = function (error) {
            console.log(error.message);
        };

        //play button handler (only on Android)
        //TODO: on kitkat maybe <video> ha got proper support, run some tests
        if (window.device.platform === EC.Const.ANDROID) {

            play_video_btn.off().on('vclick', function () {

                var current_cached_video = $(this).attr('data-video-path');

                //request temporary folder from file system based on platform

                //Android only
                window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                    var temp_cache_path = the_file_system.nativeURL;
                    var video_full_path = temp_cache_path + '/' + current_cached_video;

                    window.plugins.videoPlayer.play(video_full_path);

                }, function (error) {
                    console.log(JSON.stringify(error));
                });

            });
        }

        //open camera app on click
        video_btn.off().on('vclick', function () {

            //record 1 video at a time
            var options = {
                limit: 1
                //duration: 30//set duration to a maximum of 30 seconds
            };
            // start video capture
            navigator.device.capture.captureVideo(onCaptureVideoSuccess, onCaptureVideoError, options);
        });
    };

    return module;

}(EC.InputTypes));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/*
		 * get cache value from localStorage by the passed position
		 *
		 * @method getCachedInputValue
		 * @param {int} the input position attribute in the form input sequence
		 * @return {Object} {_id: <the input id>, type: <the input type>, value: <the current value cached>, position : <the input position property>}
		 */
		module.getCachedInputValue = function(the_position) {

			var values;
			var position = parseInt(the_position, 10);
			var index = position - 1;
			var i;
			var iLength;
			var empty_value = {
				_id : "",
				type : "",
				value : EC.Const.SKIPPED,
				position : "",
				is_primary_key : ""
			};

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				values = JSON.parse(window.localStorage.inputs_values);

				/* if index is out of bounds return false as value cannot be found:
				 * a case scenario is when the user leaves a form half way through it but he wants to save the progress
				 * Any value not found will be saved as empty string in the db
				 */
				if (values[index] === undefined) {
					return empty_value;
				}

				//search all values where the passed position matches
				iLength = values.length;
				for ( i = 0; i < iLength; i++) {

					//if values[i] is null, this input was skipped by a jump so create an empty one
					if (values[i] === null) {
						values[i] = empty_value;
					}

					//@bug Android 2.3 :/ should be solved parsing values to integer
					if (parseInt(values[i].position, 10) === position) {

						if (window.localStorage.edit_mode) {

							window.localStorage.edit_id = values[i]._id;
							window.localStorage.edit_type = values[i].type;
						}

						//return the value object found
						return values[i];

					}

				}//end for each input values

				//return an empty value if no position match found, meaning the value was not cache because skipped by a jump
				return empty_value;

			} catch(error) {
				//Handle errors here
				return false;
			}

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		//getCurrentValue
		module.getCloneValue = function(the_type) {

			var type = the_type;
			var test;
			var value;

			switch(type) {

				case EC.Const.TEXT:
					value = $('div.clone input#text-clone').val();
					break;
				case EC.Const.TEXTAREA:
					value = $('div.clone textarea#textarea-clone').val();
					break;
				case EC.Const.INTEGER:
					value = $('div.clone input#integer-clone').val();
					break;
				case EC.Const.DECIMAL:
					value = $('div.clone input#decimal-clone').val();
					break;
				case EC.Const.BARCODE:
					value = $('div.clone input#scan-result-confirm').val();
					break;
			}

			return value;
		};

		return module;

	}(EC.Inputs));

/*global $, jQuery*/
/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    /* Get the current input value based on the input type
     *
     * @return - a single value or an array of values based on the type passed
     */
    module.getCurrentValue = function (the_type) {

        var type = the_type;
        var values = [];
        var checkboxes_values = [];
        var branch_form;
        var branch_entries;
        var current_value;
        var got_value;
        var input_holder;

        switch (type) {

            case EC.Const.TEXT:
                values.push($('div#input-text input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.TEXTAREA:
                values.push($('div#input-textarea textarea').val());
                got_value = values[0].trim();
                break;

            case EC.Const.INTEGER:
                values.push($('div#input-integer input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.DECIMAL:
                values.push($('div#input-decimal input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.DATE:
                values.push($('div#input-date input').val());
                got_value = values[0];
                break;

            case EC.Const.TIME:
                values.push($('div#input-time input').val());
                got_value = values[0];
                break;

            case EC.Const.RADIO:

                input_holder = $('div#input-radio input[type=radio]:checked');

                /* single selection radio: grab both value and 'label':
                 * value is needed for the jumps/validation and label will be saved and displayed to users
                 */
                current_value = {
                    value: '',
                    index: ''
                };
                current_value.value = input_holder.val();
                current_value.index = input_holder.attr('data-index');

                //if no value selected among the radio options, create an empty object with NO_OPTION_SELECTED label
                if (current_value.value === undefined) {
                    current_value.value = EC.Const.NO_OPTION_SELECTED;
                    current_value.index = EC.Const.NO_OPTION_SELECTED;
                } else {
                    current_value.value.trim();
                    current_value.index.trim();
                }

                values.push(current_value);

                got_value = values[0];
                break;

            //multiple selection checkboxes
            case EC.Const.CHECKBOX:

                /*
                 * Get all the selected checkboxes. Checkboxes jumps are mapped against the value, not the index, so use its label
                 */
                $('div#input-checkbox input[type=checkbox]:checked').each(function () {
                    checkboxes_values.push({
                        value: $(this).val().trim(),
                        label: $(this).parent().text().trim()
                    });
                });

                //cache empty string if no checkboxes are selected
                values.push((checkboxes_values.length === 0) ? EC.Const.NO_OPTION_SELECTED : checkboxes_values);

                //return array of object (one per each selected checkbox)
                got_value = values[0];
                break;

            case EC.Const.DROPDOWN:

                input_holder = $('div#input-dropdown select option:selected');

                /* single selection dropdown' grab both value and index:
                 * index is needed for the jumps/validation and value will be saved and displayed to users (linked to label)
                 */
                current_value = {
                    value: '',
                    index: ''
                };

                current_value.value = input_holder.val();
                current_value.index = input_holder.attr('data-index');

                //if the value is '0', for consistency set it to a default for unselected option
                if (current_value.index === '0') {
                    current_value.index = EC.Const.NO_OPTION_SELECTED;
                }

                values.push(current_value);

                got_value = values[0];
                break;

            case EC.Const.BARCODE:
                current_value = $('div#input-barcode input.scan-result').val();
                values.push(current_value);
                //console.log('barcode current value is: ' + current_value);
                got_value = values[0];
                break;

            case EC.Const.LOCATION:

                //store location as csv string
                current_value = EC.DevicePosition.getCoordsFormattedText();
                values.push(current_value);
                //console.log('location current value is: ' + current_value);
                got_value = values[0];
                break;

            case EC.Const.AUDIO:

                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: '...audio cached  uri...',
                        stored: '...audio stored uri...'
                    };

                } else {

                    //console.log('getting audio file values');

                    current_value = {
                        cached: $('div#input-audio input#cached-audio-uri').val(),
                        stored: $('div#input-audio input#stored-audio-uri').val()
                    };

                    //console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.VIDEO:

                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: '...video cached  uri...',
                        stored: '...video stored uri...'
                    };

                } else {

                    console.log('getting video file values');

                    current_value = {
                        cached: $('div#input-video input#cached-video-uri').val(),
                        stored: $('div#input-video input#stored-video-uri').val()
                    };

                    console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.PHOTO:

                //keep track of both cache value(image uri currently on canvas) and store value (image uri on the database)
                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: 'placeholder.jpg',
                        stored: 'placeholder.jpg'
                    };

                } else {

                    current_value = {
                        cached: $('div#input-photo input#cached-image-uri').val(),
                        stored: $('div#input-photo input#stored-image-uri').val()
                    };

                    console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.BRANCH:

                //this is a branch form input, so its value is na object with the branch form name and the its total of entries
                branch_form = JSON.parse(window.localStorage.branch_form);

                //get branch entries for this form from DOM. If branch entries is NaN, it means we have no entries (0)
                branch_entries = parseInt($('div#input-branch div#list-branch-entries-btn span span.branch-entries-count').text(), 10);

                current_value = {
                    branch_form_name: branch_form.name,
                    branch_total_entries: isNaN(branch_entries) ? 0 : branch_entries
                };

                console.log(branch_entries);

                values.push(current_value);
                got_value = values[0];
                break;

        }//switch

        return got_value;

    };

    return module;

}(EC.Inputs));

/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.getMainFormCurrentKeyValue = function(the_position) {

			var index = the_position - 1;
			var values = JSON.parse(window.localStorage.inputs_values);

			return values[index].value;

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 * @method isEmptyPrimaryKey: Check whether a primary key exists in the array of values we are abut to save.
		 */
		module.isEmptyPrimaryKey = function() {

			var is_empty_primary_key = true;
			var inputs_values;
			var i;
			var iLength;

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				inputs_values = JSON.parse(window.localStorage.inputs_values);
			} catch(error) {
				return is_empty_primary_key;
			}

			iLength = inputs_values.length;
			for ( i = 0; i < iLength; i++) {
				
				//if there is an input valus, check if it is a primary key (some values can be null in the case of jumps)
				if (inputs_values[i]) {
					if (parseInt(inputs_values[i].is_primary_key, 10) === 1) {
						is_empty_primary_key = (inputs_values[i].value === "") ? true : false;
					}
				}
			}

			return is_empty_primary_key;

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.setCachedInputValue = function(the_value, the_position, the_type, is_primary_key_flag) {
			
			var wls = window.localStorage;
			var values;
			var value = the_value;
			var checkbox_values = [];
			var position = parseInt(the_position, 10);
			var index = position - 1;
			var type;
			var _id;
			var is_primary_key = is_primary_key_flag;
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(window.localStorage.form_id);
			var i;
			var iLength;

			if (wls.edit_mode) {

				_id = wls.edit_id;
				type = wls.edit_type;

			} else {

				_id = '';
				type = the_type;

			}

			//if the value is an object from either dropdown or radio inputs, cache the value only (index is needed only for jumps)
			if (type === EC.Const.DROPDOWN || type === EC.Const.RADIO) {
				value = value.value;
			}

			//if the value is an array from checkboxes, cache an array of the labels
			if (type === EC.Const.CHECKBOX) {

				//if any checkbox was selected, get it, otherwise do nothing and let the value be EC.Const.NO_OPTION_SELECTED
				if (value !== EC.Const.NO_OPTION_SELECTED) {

					iLength = value.length;
					for ( i = 0; i < iLength; i++) {
						checkbox_values.push(value[i].value);
					}

					value = checkbox_values;
				}
			}

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				values = JSON.parse(wls.inputs_values);

			} catch(error) {
				//Handle errors here
				values = [];
			}
			
			//TODO: check against values length??? try when hidden key is last element of the form
			if (values[index] !== null && index < values.length) {

				//if the values already is cached in inputs_values AND it is a primary_key AND it is a hidden auto generated key, do not override it but use that same value
				//This happens when the user is editing a form with an autogen key hidden, we do no want to override it
				if (values[index].is_primary_key === 1 && is_genkey_hidden === 1) {
					value = values[index].value;
				} else {

					values[index] = {
						_id : _id,
						type : type,
						value : value,
						position : position,
						is_primary_key : is_primary_key
					};
				}

			} else {

				values[index] = {
					_id : _id,
					type : type,
					value : value,
					position : position,
					is_primary_key : is_primary_key
				};
			}

			wls.inputs_values = JSON.stringify(values);
			console.log("input_values: " + wls.inputs_values);

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		var _isUniqueValue = function(the_value) {

			var primary_keys = [];
			var value = the_value;
			var unique = true;

			//get Hierarchy (main) primary keys
			primary_keys = JSON.parse(window.localStorage.primary_keys);

			//check if the current value clashes a global primary key
			if (primary_keys.indexOf(value) !== -1) {
				unique = false;
			}

			return unique;
		};

		module.validateValue = function(the_input, the_value) {

			var self = this;
			var input = the_input;
			var current_value = the_value;
			var clone_value = "";
			var is_primary_key = $('span.label').attr('data-primary-key');
			var validation = {};

			//get value from object in the case of a dropdown, radio or checkbox
			if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO || input.type === EC.Const.CHECKBOX) {
				current_value = current_value.value;
			}

			//if we need to check for a double entry, get clone value
			if (parseInt(input.has_double_check, 10) === 1) {
				clone_value = self.getCloneValue(input.type);
			}

			//validate input
			validation = EC.Utils.isValidValue(input, current_value, clone_value);

			if (!validation.is_valid) {
				//value not valid, return
				return validation;
			}

			//check if this input value is a primary key field: if it is, check uniqueness (skip when we are editing)
			if (is_primary_key === 'true' && !window.localStorage.edit_mode) {

				if (!_isUniqueValue(current_value)) {

					//primary key value already exist, return
					validation = {
						is_valid : false,
						message : EC.Localise.getTranslation("value_exist")
					};

					//on Chrome native alert is not working: dump to console error message
					console.log("Error: value already exists");

					return validation;
				}
			}

			return validation;

		};

		return module;

	}(EC.Inputs));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 * @method valuesMatch
		 */
		module.valuesMatch = function(the_cached_value, the_current_value, the_input_type) {

			var cached_value = the_cached_value;
			var current_value = the_current_value;
			var type = the_input_type;
			var is_matching = false;
			var i;
			var j;
			var iLength;
			var jLength;
			var matches_count = 0;

			switch(type) {

				case EC.Const.DROPDOWN:

					if (current_value.label === cached_value.value) {
						is_matching = true;
					}
					break;
				case EC.Const.RADIO:

					if (current_value.label === cached_value.value) {
						is_matching = true;
					}
					break;
				case EC.Const.CHECKBOX:

					//check if ALL the checkbox values match. A single difference might trigger a different jump
					iLength = current_value.length;
					jLength = cached_value.value.length;

					if (iLength === jLength) {

						for ( i = 0; i < iLength; i++) {
							for ( j = 0; j < jLength; j++) {
								if (current_value[i].label.trim() === cached_value.value[j].trim()) {
									matches_count++;
								}
							}
						}

						if (matches_count === iLength) {
							is_matching = true;
						}
					}
					break;
				// case EC.Const.LOCATION:
				// //TODO: handle location
				// break;
				default:
					if (cached_value === current_value) {
						is_matching = true;
					}
			}
			return is_matching;

		};

		return module;

	}(EC.Inputs));

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    function _projectBackupFeedback(is_positive) {

        var restore_from_backup_btn = $('div#forms div#project-options ul li#restore-data-from-backup');
        var mail_backup_btn = $('div#forms div#project-options ul li#email-backup');

        //close panel
        $('div#forms div#project-options').panel('close');
        if (is_positive) {
            EC.Notification.showAlert(EC.Localise.getTranslation('success'), EC.Localise.getTranslation('project_backup_success'));

            //enable 'restore from backup' button and 'email backup'
            restore_from_backup_btn.removeClass('ui-disabled');
            mail_backup_btn.removeClass('ui-disabled');
        } else {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        }
    }

    module.backupCurrentProject = function () {

        EC.Notification.showProgressDialog();

        var forms = JSON.parse(window.localStorage.forms);
        var project_name = window.localStorage.project_name;
        var project_id = parseInt(window.localStorage.project_id, 10);

        $.when(EC.File.backup(forms, project_name, project_id)).then(function () {
            EC.Notification.hideProgressDialog();
            _projectBackupFeedback(true);
        }, function () {
            EC.Notification.hideProgressDialog();
            _projectBackupFeedback(false);
        });
    };

    return module;

}(EC.Project));

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    var project_xml_URL = '';
    var projects = [];

    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $('div#index div[data-role="header"] div[data-href="home-settings"]');
        var add_project_btn = $('div#index div[data-role="header"] div.ui-btn-right[data-href="add-project"]');
        var settings_btn = $('div.home-settings ul li div[data-href="settings"]');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            //we are using a class instead of an id because there is a bug with the panel not working when navigating the app
            var panel = $('.home-settings');

            panel.panel('open');
            //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //test closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });
        });

        //bind add project button (action bar)
        add_project_btn.off().one('vclick', function (e) {
            window.localStorage.back_nav_url = '#refresh';
            EC.Routing.changePage(EC.Const.ADD_PROJECT_VIEW);
        });

    };

    function _autoload(the_project_to_autoload) {

        var project_names = JSON.parse(window.localStorage.project_names);

        var project_to_autoload = window.decodeURI(the_project_to_autoload);
        var project_name;
        var deferred = new $.Deferred();
        var project_params = project_to_autoload.split('/');

        //parse project name from full project xml url
        project_name = project_params[project_params.length - 1];
        project_name = project_name.split('.');
        project_name = project_name[0];

        //There is a project to autoload: warn user if the project is already loaded on
        // the device
        console.log('Project names **************************************');
        console.log(JSON.stringify(project_names));
        if (EC.Utils.inArray(project_names, project_name, false)) {
            deferred.reject();
        }
        else {

            //double check if have an internet connection just in case
            if (EC.Utils.hasConnection()) {

                //testing on Chrome?
                if (EC.Utils.isChrome()) {
                    console.log('Testing on Chrome *****************************');
                    project_xml_URL = 'xml/' + project_name + '.xml';
                }

                project_xml_URL = project_to_autoload;

                //all good, load project on device
                $.when(EC.Project.request(project_xml_URL)).then(function () {
                    // Commit project to database
                    $.when(EC.Structure.commitAll()).then(function () {
                        deferred.resolve();


                    });
                }, function () {
                    //request failed
                    deferred.reject();
                });

            }
            else {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('connection_lost'));
                deferred.reject();
            }
        }

        return deferred.promise();
    }

    module.getList = function () {

        //@bug in Chrome where this function is called twice, I have no idea why
        console.log('EC.Project.getList() called ***********************************');

        var self = this;
        var project_to_autoload;
        var project_server_url;
        var project_xml_URL;

        //remove cached project names
        // window.localStorage.removeItem('project_names');

        //remove cached current view
        window.localStorage.removeItem('current_view_url');

        //clear project upload URL
        window.localStorage.removeItem('upload_URL');

        //load a project from custom URL scheme on device?
        if (!EC.Utils.isChrome()) {
            project_to_autoload = window.localStorage.autoload_project_url;
        }
        else {
            //testing on Chrome
            project_to_autoload = EC.Utils.getParameterByName('project');
        }

        //select all project on device
        $.when(EC.Select.getProjects()).then(function (the_projects) {

            //local variable projects?
            var projects = the_projects;
            var project_names = [];
            var i;
            var iLength;

            //cache projects in localStorage, or empty array if none yet
            if (projects.length > 0) {
                iLength = projects.length;
                for (i = 0; i < iLength; i++) {
                    project_names.push(projects[i].name);
                }
            }
            window.localStorage.project_names = JSON.stringify(project_names);
            console.log('Window Project names **************************************');
            console.log(JSON.stringify(window.localStorage.project_names));

            if (project_to_autoload === '') {

                //no project to autoload? we are done, sho list of projects on the device
                if (projects.length > 0) {
                    self.renderList(projects);
                }
                else {
                    self.renderEmptyList();
                }

            }
            else {

                //show loader we are requesting a project automatically
                EC.Notification.showProgressDialog(EC.Localise.getTranslation('wait'), EC.Localise.getTranslation('loading_project') + '/n' + project_to_autoload);

                $.when(_autoload(project_to_autoload)).then(function () {

                    //add latest project to project list
                    projects.push({
                        _id: EC.Parse.project.insertId,
                        name: EC.Parse.project.name,
                        total_branch_forms: EC.Parse.project.total_branch_forms,
                        total_hierarchy_forms: EC.Parse.project.total_hierarchy_forms
                    });

                    //remove project from localStorage (iOS only)
                    window.localStorage.autoload_project_url = '';

                    EC.Notification.hideProgressDialog();
                    //add new project to render
                    self.renderList(projects);

                }, function () {
                    //we get here when trying to autoload a project already on the device, just
                    // render stored projects
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('project_already_loaded'));
                    EC.Notification.hideProgressDialog();
                    self.renderList(projects);

                    //remove project from localStorage (iOS only)
                    window.localStorage.ios_project_form_url = '';
                });

            }

        });

    };

    module.renderList = function (the_projects) {

        var project_names = [];
        //build HTML
        var HTML = '';
        var i;
        var iLength;
        var dom_list = $('div#project-list ul');
        var navbar = $('a.ui-btn-active span.ui-btn-inner');

        projects = the_projects;

        //bind buttons
        _bindActionBarBtns();

        $('div#empty-list').hide();

        //dom_list.find('li').removeClass('ui-btn-active');
        dom_list.empty();

        for (i = 0,
                 iLength = projects.length; i < iLength; i++) {

            HTML += '<li data-icon="ep-next-page" >';
            HTML += '<a href="views/forms.html?project=' + projects[i]._id + '&name=' + projects[i].name + '">' + projects[i].name;
            HTML += '<span class="ui-li-count">' + projects[i].total_hierarchy_forms;
            HTML += '</span>';
            HTML += '<p>' + projects[i].total_hierarchy_forms + EC.Localise.getTranslation('hierarchy_forms') + ', ' + projects[i].total_branch_forms + EC.Localise.getTranslation('branch_forms') + '</p>';
            HTML += '</a>';
            HTML += '</li>';

            //cache the project names (unique)
            project_names.push(projects[i].name);

        }

        //cache project names in localStorage, to be used when checking for project name
        // uniqueness
        window.localStorage.project_names = JSON.stringify(project_names);

        //reset title in navbar
        navbar.text(EC.Const.PROJECT_LIST);

        dom_list.append(HTML);
        dom_list.listview('refresh');

        //remove navigation flags
        window.localStorage.removeItem('current_position');
        window.localStorage.removeItem('form_id');
        window.localStorage.removeItem('form_name');
        window.localStorage.removeItem('project_id');
        window.localStorage.removeItem('project_name');
        window.localStorage.removeItem('form_tree');

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        window.setTimeout(function () {
            $('body').removeClass('hidden');
        }, 500);

        console.log('Language set to ' + window.localStorage.DEVICE_LANGUAGE);

    };//renderList

    module.renderEmptyList = function () {

        var dom_list = $('div#project-list ul');

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //bind buttons
        _bindActionBarBtns();

        //empty the list (if anything)
        dom_list.empty();

        //remove cached projects
        $('div#index div#empty-list').show();

        window.setTimeout(function () {
            $('body').removeClass('hidden');
        }, 500);

        //load a project from custom URL scheme?
        console.log('project to be loaded = ' + EC.Utils.getParameterByName('project'));

        EC.Notification.hideProgressDialog();

    };

    /**
     * delete project by project ID and project name
     */
    module.deleteProject = function () {

        var project_id = parseInt(window.localStorage.project_id, 10);
        var project_name = window.localStorage.project_name;

        //@bug: panel closes itself on changePage, .panel('close') will stop the panel
        // from working
        $.when(EC.Delete.deleteProject(project_id, project_name)).then(function () {

            EC.Notification.showToast(EC.Localise.getTranslation('project_deleted'), 'short');
            window.localStorage.is_project_deleted = 1;
            window.localStorage.back_nav_url = '#refresh';
            EC.Routing.changePage(EC.Const.INDEX_VIEW);

        }, function () {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('generic_error'));
        });
    };

    return module;
}(EC.Project));


/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Project
 */

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function (module) {
    "use strict";

    module.loadRemoteXML = function (the_project_name) {

        var cached_project_names;
        var i;
        var iLength;
        var project_name = the_project_name;
        var project_xml_URL;
        var epicollect_server_url;

        //if the project is already on the device, warn user and exit
        try {
            cached_project_names = JSON.parse(window.localStorage.project_names);
            iLength = cached_project_names.length;
            for (i = 0; i < iLength; i++) {

                if (cached_project_names[i] === project_name) {
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_already_loaded"));
                    return;
                }
            }
        } catch (error) {
            //no project yet
            console.log("no projects on device yet");
        }


        //if the project name is a full url, use that instead of app settings
        if (EC.Utils.isURL(project_name)) {
            project_xml_URL = project_name;
        } else {
            //get the project server url (default to http://plus.epicollect.net/)
            epicollect_server_url = window.localStorage.project_server_url;
            project_xml_URL = epicollect_server_url + project_name + '.xml';
        }

        //all good, load project on device
        EC.Notification.showProgressDialog();
        $.when(EC.Project.request(project_xml_URL)).then(function () {
            // Commit project to database
            $.when(EC.Structure.commitAll()).then(function () {
                //redirect to project list
                EC.Routing.changePage(EC.Const.INDEX_VIEW);

            });
        }, function () {
            //request failed
            //TODO
            console.log("request failed");
        });

    };

    return module;

}(EC.Project));

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    var load_project_btn;
    var back_btn;
    var input_value;
    var autocomplete_spinning_loader;
    var project_url;

    var _load = function () {

        if (EC.Utils.hasConnection()) {
            _loadProjectFromXML();
        } else {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('no_internet'));
            //load_project_btn.off().one('vclick', _load);
        }
    };

    //Load the specified project via Ajax
    var _loadProjectFromXML = function () {

        var project_name = input_value.val();

        //empty project name
        if (project_name === '') {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('project_empty_not_allowed'));
            load_project_btn.off().one('vclick', _load);
            return;
        }

        // It has any kind of whitespace
        if (/\s/.test(project_name)) {
            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('project_no_spaces_allowed'));
            load_project_btn.off().one('vclick', _load);
            return;
        }

        //load project from remote XML
        EC.Project.loadRemoteXML(project_name);

    };
    //loadProjectFromXML

    module.renderAddProjectView = function () {

        var dom_list = $('div#add-project-content ul#projects-autocomplete');
        var request_timeout;

        load_project_btn = $('div#add-project div[data-role="header"] div.ui-btn-right[data-href="load-project-confirm"]');
        back_btn = $('div#add-project div[data-role="header"] div[data-href="back-btn"]');
        input_value = $('div#add-project-content form div input[data-type="search"]');
        autocomplete_spinning_loader = $('.autocomplete-spinner-loader');
        project_url = window.localStorage.project_server_url;

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        input_value.val('');

        //populate lists with autocomplete suggestions based on project names on the server
        dom_list.on('listviewbeforefilter', function (e, data) {

            console.log('typing');

            var $ul = $(this);
            var $input = $(data.input);
            var value = $input.val();
            var html = '';

            //wait a fifth of a second the user stops typing
            var request_delay = 200;

            $ul.html('');

            //trigger request with more than 2 chars
            if (value && value.length > 2) {

                autocomplete_spinning_loader.removeClass('hidden');

                $ul.html('<li class="autocomplete-spinner"><i class="fa fa-spinner fa-spin"></i></li>');
                $ul.listview('refresh');

                /* Throttle requests as the user is typing on a phone. We want to send as fewer requests as possible:
                 * Typing a new char will stop the previous ajax request, not tapping for a third of a second will let the request go through
                 */
                clearTimeout(request_timeout);
                request_timeout = setTimeout(function () {

                    console.log('requesting');

                    $.ajax({
                        url: 'http://plus.epicollect.net/' + 'projects?q=' + value + '&limit=25',
                        dataType: 'json',
                        crossDomain: true,
                        success: function (response) {

                            autocomplete_spinning_loader.addClass('hidden');

                            $.each(response, function (i) {
                                html += '<li class="h-nav-item">' + response[i].name + '</li>';
                            });
                            $ul.html(html);
                            $ul.listview('refresh');
                            $ul.trigger('updatelayout');

                        },
                        error: function (request, status, error) {
                            autocomplete_spinning_loader.addClass('hidden');
                        }
                    });

                }, request_delay);
            }//if
        });

        dom_list.on('vclick', function (e) {

            if (e.target.tagName.toLowerCase() === 'li') {

                input_value.val(e.target.innerText);
                input_value.attr('value', e.target.innerText);

            } else {

                return;
            }

        });

        //Load project confirm button handler
        load_project_btn.off().on('vclick', _load);

        back_btn.off().one('vclick', function (e) {

            window.localStorage.back_nav_url = '#refresh';
            EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
        });
    };

    return module;

}(EC.Project));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 *
 */
var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    var project_xml_URL;
    var deferred;

    module.request = function (the_project_xml_url) {

        project_xml_URL = the_project_xml_url;
        console.log('doing request: ' + project_xml_URL);

        deferred = new $.Deferred();

        $.ajax({
            url: project_xml_URL, //url
            type: 'get', //method type post or get
            crossDomain: true,
            dataType: 'xml', //return data type
            timeout: 30000, // stop after 30 seconds
            success: function (data) {

                var is_project_xml_valid = true;
                var branch_forms = [];

                //parse the xml
                is_project_xml_valid = EC.Parse.parseXML(data);

                //parse error? Alert user
                if (is_project_xml_valid === false) {
                    EC.Notification.hideProgressDialog();
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("invalid_xml"));
                    deferred.reject();
                    return;
                }


                deferred.resolve();

            },
            error: function (request, status, error) {

                EC.Utils.sleep(1000);

                EC.Notification.hideProgressDialog();

                //show request error
                console.log(status + ", " + error);

                switch (status) {

                    case "parsererror":
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("invalid_xml"));
                        break;
                    case "timeout":
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_timeout"));
                        break;
                    default:

                        if (error === "Page not found") {
                            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_not_found_on_server") + window.localStorage.project_server_url);
                            return;
                        }

                        if (error === "Not Found") {
                            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_not_found"));
                            return;
                        }

                        //show unknow error if nothing match
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknow_error"));
                }

                deferred.reject();

            }
        });

        return deferred.promise();

    };

    return module;

}(EC.Project));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Project
 */

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function(module) {"use strict";

		module.restoreFromBackup = function() {

			var project_name = window.localStorage.project_name;
			var project_id = window.localStorage.project_id;

			//TODO: check if there is a backup

			var _restoreFeedback = function(is_positive) {

				var forms_list_items = $('div#forms-list ul li');
				var project_id;
				var HTML;
				var forms;
				var dom_list = $('div#forms-list ul');

				//get updated forms
				forms = JSON.parse(window.localStorage.forms);
				project_id = parseInt(window.localStorage.project_id, 10);

				if (is_positive) {
					EC.Notification.showAlert(EC.Localise.getTranslation("success"), EC.Localise.getTranslation("project_restored"));

					//show forms list
					$.when(EC.Select.getForms(project_id)).then(function(the_forms, the_btn_states) {
						EC.Forms.renderList(the_forms, the_btn_states);
						$('div#forms div#project-options').panel("close");
					});

				} else {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
				}

			};
			
			//Show spinning loader
			EC.Notification.showProgressDialog();

			//delete existing data first
			$.when(EC.Delete.deleteAllEntries(EC.Const.RESTORE, project_name, project_id)).then(function(the_forms) {

				//Map local input ids against ref and cache them before restoring from backup
				$.when(EC.Select.getLocalInputIDs(the_forms)).then(function(the_input_ids) {

					window.localStorage.local_input_ids = JSON.stringify(the_input_ids);
					
					//restore from backup file success
					$.when(EC.File.restoreFromBackup(project_name, project_id)).then(function() {
						EC.Notification.hideProgressDialog();
						_restoreFeedback(true);
					});

				});
			});

		};

		return module;

	}(EC.Project));

/*global $, jQuery*/
/**
 *
 *
 */
var EC = EC || {};
EC.Settings = EC.Settings || {};
EC.Settings = (function () {
    'use strict';

    var project_server_url;
    var project_server_url_holder;
    var pagination_radio_btns;
    var selected_radio_value;
    var save_btn;
    var back_btn;
    var version_name;
    var version_name_label;
    var project_name;
    var header;
    var enhance_map_checkbox;
    var app_name;

    var renderView = function () {

        //set project server url
        project_server_url = window.localStorage.project_server_url;
        project_server_url_holder = $('div#settings').find('div#settings-values').find('input#project-server-url');
        save_btn = $('div#settings div[data-role="header"] div.ui-btn-right[data-href="save-settings"]');
        back_btn = $('div#settings div[data-role="header"] div[data-href="back-btn"]');
        version_name_label = $('div#settings div#settings-values p#version-name span.version');
        pagination_radio_btns = $('form#pagination-options input[type="radio"]');
        enhance_map_checkbox = $('div#settings div#settings-values input#enhanced-location-google-maps');
        project_name = window.localStorage.project_name;
        header = $('div#settings div[data-role="header"] div[data-href="back-btn"] span.project-name');
        app_name = $('div#settings div#settings-values p#version-name span.app-name');

        //show app version (we use a deferred object as on iOS the version plugins returns a value too late)
        $.when(EC.Utils.getVersionName(), EC.Utils.getAppName()).then(function (the_version_name, the_app_name) {
            version_name_label.text(the_version_name);
            app_name.text(the_app_name);
        });

        project_server_url_holder.val(project_server_url);

        //add project name to header (if a project is actually selected)
        //if we go directly to the settings page without selecting a project first, project name would be undefined
        if (project_name) {
            header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));
        } else {
            header.text(EC.Const.PROJECT_LIST);
        }

        //bind save button
        save_btn.off().one('vclick', function (e) {

            //cache user preferences todo better user a native storage for this a slocalStorage is not 100% reliable
            window.localStorage.project_server_url = project_server_url_holder.val();
            window.localStorage.is_enhanced_map_on = (enhance_map_checkbox.is(':checked')) ? 1 : 0;

            //get the checked pagination radio
            pagination_radio_btns.each(function (index) {

                var checked = $(this).is(':checked');
                if (checked) {
                    console.log($(this).val());
                    window.localStorage.QUERY_LIMIT = $(this).val();
                }
            });

            //show toast on device
            if (!EC.Utils.isChrome()) {
                EC.Notification.showToast(EC.Localise.getTranslation('settings_saved_success'), 'short');
            }

            //go back to previuos page in history
            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            } else {
                //TODO: test this
                //EC.Routing.changePage(EC.Const.INDEX_VIEW);
                window.history.back(-1);
            }
        });

        //bind back button
        back_btn.off().one('vclick', function (e) {
            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            } else {

                //TODO: test this
                //EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
                window.history.back(-1);
            }
        });

        //check (highlight) the radio button based on user preferences
        pagination_radio_btns.each(function (index) {
            if ($(this).val() === window.localStorage.QUERY_LIMIT) {
                $(this).prop('checked', true).checkboxradio('refresh');
            }
        });

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }
    };

    return {
        renderView: renderView
    };
}());

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *
 * Comments here TODO
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		module.bindUploadButtons = function(the_has_hard_reload_flag) {

			var self = this;
			var back_button_label = $("div#upload div[data-role='header'] div[data-href='back-btn'] span");
			var hash;
			var has_hard_reload = the_has_hard_reload_flag;
			var media_dir;
			var project_name = window.localStorage.project_name;
			var project_id = parseInt(window.localStorage.project_id, 10);

			self.upload_data_btn = $('div#upload div#upload-options div#upload-data-btn');
			self.upload_images_btn = $('div#upload div#upload-options div#upload-images-btn');
			self.upload_audios_btn = $('div#upload div#upload-options div#upload-audios-btn');
			self.upload_videos_btn = $('div#upload div#upload-options div#upload-videos-btn');
			self.back_btn = $("div#upload div[data-role='header'] div[data-href='back-btn']");
			self.all_synced_message = $('div#upload div#upload-options .all-synced-message');

			hash = "forms.html?project=" + project_id + "&name=" + project_name;
			if (has_hard_reload) {
				back_button_label.text("Forms");
			}

			if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !== "#refresh") {
				back_button_label.text("Entries");
			}
			else {
				back_button_label.text("Forms");
			}

			//bind back button for navigating back from upload page
			self.back_btn.off().one('vclick', function(e) {

				//TODO: we have to decide what is better...go back to save feedback page or
				// entries list??
				//if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !==
				// "#refresh") {
				//go back to entries list; back_nav_url is an url when user goes to upload page
				// after adding/editing an entry
				//EC.Routing.changePage(window.localStorage.back_nav_url);
				//} else {
				//go back to form list
				window.history.back(-1);
				//}

			});

			//bind vclicks data upload
			self.upload_data_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				//reset rows count
				self.hierarchy_rows_to_sync=[];
				self.branch_rows_to_sync= [];

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				if (self.is_branch_entry) {

					//prepare branch entry
					self.prepareOneBranchEntry(self.current_branch_form.name, self.current_branch_entry);

				}
				else {

					//prepare hierarchy entry
					self.prepareOneHierarchyEntry(self.current_form.name, self.current_entry);
				}

			});

			//bind vclicks image upload
			self.upload_images_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {

					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;

				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				//post one image directly as it is already loaded in memory when requesting the
				// upload page
				media_dir = EC.Const.PHOTO_DIR;
				EC.File.uploadFile(self.current_image_file, media_dir);

			});

			//bind vclicks audio upload
			self.upload_audios_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.AUDIO_DIR;
				EC.File.uploadFile(self.current_audio_file, media_dir);

			});

			//bind vclicks video upload
			self.upload_videos_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.VIDEO_DIR;
				EC.File.uploadFile(self.current_video_file, media_dir);

			});

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		module.handleMedia = function() {
			
			var self = this;

			self.audio_synced = true;
			self.photo_synced = true;
			self.video_synced = true;

			var _audioCheck = function(the_audio) {

				var deferred = new $.Deferred();
				self.current_audio_file = the_audio;

				if (!self.current_audio_file) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchAudioFile(self.project_id, EC.Const.AUDIO)).then(function(the_audio) {

							self.current_audio_file = the_audio;
							self.is_branch_audio = true;

							//enable upload audio button
							self.upload_audios_btn.removeClass("ui-disabled");
							self.audio_synced = false;

							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.is_branch_audio = false;
					//enable upload audio button
					self.upload_audios_btn.removeClass("ui-disabled");
					self.audio_synced = false;
					deferred.resolve();
				}
				return deferred.promise();
			};

			var _photoCheck = function(the_image) {

				var deferred = new $.Deferred();
				self.current_image_file = the_image;

				if (!self.current_image_file) {
					if (self.has_branches) {
						$.when(EC.Select.getOneBranchPhotoFile(self.project_id, EC.Const.PHOTO)).then(function(the_image) {

							self.current_image_file = the_image;
							self.is_branch_image = true;

							//enable upload image button
							self.upload_images_btn.removeClass("ui-disabled");
							self.photo_synced = false;
							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.is_branch_image = false;
					//enable upload image button
					self.upload_images_btn.removeClass("ui-disabled");
					self.photo_synced = false;
					deferred.resolve();
				}
				return deferred.promise();
			};

			var _videoCheck = function(the_video) {

				var deferred = new $.Deferred();
				self.current_video_file = the_video;

				if (!self.current_video_file) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchVideoFile(self.project_id, EC.Const.VIDEO)).then(function(the_video) {

							self.current_video_file = the_video;
							self.video_synced = false;
							self.is_branch_video = true;

							//enable upload audio button
							self.upload_videos_btn.removeClass("ui-disabled");

							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.video_synced = false;
					EC.Upload.is_branch_video = false;
					//enable upload video button
					self.upload_videos_btn.removeClass("ui-disabled");
					deferred.resolve();
				}
				return deferred.promise();
			};

			/*We are using a super safe approach to just fetch 1 single row (file) per media
			 * type, and then fetch the next one recursively (like we did for data)
			 *It is a bit slower but I will have only 1 element at a time in memory and it is
			 * easier to recover from a failure (dropped connections, server down, phone
			 * kills the app, etc)
			 */

			$.when(EC.Select.getOneHierarchyMediaPerType(self.project_id)).then(function(the_image, the_audio, the_video) {

				//got media, enable buttons with media and look for branch file if no hierarchy
				// media found
				self.current_image_file = the_image;
				self.current_audio_file = the_audio;
				self.current_video_file = the_video;

				//if all media are synced, show all synced message
				$.when(_photoCheck(self.current_image_file), _audioCheck(self.current_audio_file), _videoCheck(self.current_video_file)).then(function() {
					if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
						self.all_synced_message.addClass('hidden');
					}
					else {
						self.all_synced_message.removeClass('hidden');
					}
				});

			}, function() {

				//TODO: no media found (image, audio, video are ALL empty)
				//do nothing yet
				self.all_synced_message.removeClass('hidden');
			});
		};

		return module;

	}(EC.Upload));

var EC = EC || {};
EC.Upload = (function (module) {
    'use strict';

    module.project_id = '';
    module.project_name = '';
    module.hierarchy_rows_to_sync = [];
    module.branch_rows_to_sync = [];
    module.main_rows_to_post = [];
    module.main_entries = [];
    module.hierarchy_forms = [];
    module.action = EC.Const.START_HIERARCHY_UPLOAD;
    module.current_entry = {};
    module.current_branch_entry = {};
    module.current_form = {};
    module.current_branch_form = {};
    module.has_branches = false;
    module.audio_synced = '';
    module.photo_synced = '';
    module.video_synced = '';
    module.current_image_file = '';
    module.current_audio_file = '';
    module.current_video_file = '';
    module.upload_data_btn = '';
    module.upload_images_btn = '';
    module.upload_audios_btn = '';
    module.upload_videos_btn = '';
    module.upload_data_feedback = '';
    module.back_btn = '';
    module.all_synced_message = '';

    //cache upload url for the current project in localStorage
    module.setUploadURL = function (the_url) {
        window.localStorage.upload_URL = the_url;
    };

    //get upload URL, when testing on Chrome returns 'test.php'
    module.getUploadURL = function () {
        return (!EC.Utils.isChrome()) ? window.localStorage.upload_URL : 'test.php';
    };
    return module;
}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		var branch_form_name;
		var project_id;
		var hierarchy_entry_key_value;
		
		module.branch_rows_to_sync = [];

		module.postBranchEntries = function(the_hierarchy_entry_key_value) {
			
			var self = this;
			branch_form_name = self.branch_form_name;
			project_id = parseInt(window.localStorage.project_id, 10);
			hierarchy_entry_key_value = the_hierarchy_entry_key_value;

			EC.Select.getOneBranchEntry(branch_form_name, project_id, hierarchy_entry_key_value);

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		module.postOneBranchEntry = function() {

			var self = this;
			var upload_URL;
			var project_id = parseInt(window.localStorage.project_id,10);
			console.log(self.branch_entry_post_obj);

			upload_URL = self.getUploadURL();

			//set upload URL for this project if not in localStorage yet
			if (!EC.Utils.isChrome() && !upload_URL) {
				$.when(EC.Select.getUploadURL(project_id)).then(function(the_project_url) {
					//enable upload data button
					console.log("Project URL is: " + the_project_url);
					upload_URL = the_project_url;
				});
			}

			//branch object ready to be posted
			$.ajax({
				type : "POST",
				url : upload_URL,
				crossDomain : true,
				timeout : 20000, //timeout after 20 secs
				data : $.param(self.branch_entry_post_obj), //use $.param() to convert the object to a query string (?key=value&key2=value2...)
				success : function(response) {

					//server response is 1 when successful
					if (response === '1') {

						//clear post object
						self.branch_entry_post_obj = {};

						// //halt execution and flag the branch rows just uploaded as synced
						EC.Update.setBranchEntryAsSynced(self.branch_rows_to_sync).then(function() {

							//entry rows synced, upload next entry (if any)
							self.action = EC.Const.BRANCH_RECURSION;
							EC.Select.getOneBranchEntry(project_id, self.current_branch_form.name, false);

						});

					} else {

						//a problem occured while uploading/saving data on the server side

						/**
						 * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
						 */

						$.when(EC.Select.getOneBranchEntry(self.current_branch_form).then(function(branch_entry) {

							//Entry found, prepare entry for upload
							EC.Upload.current_entry = branch_entry;

							EC.Notification.hideProgressDialog();
							EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("upload_error"));

							self.branch_rows_to_sync.length = 0;

						}));

					}

				},
				error : function(request, status, error) {

					//show request error
					console.log(status + ", " + error);
					console.log('request: ' + JSON.stringify(request));

					/**
					 * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
					 */

					$.when(EC.Select.getOneBranchEntry(self.current_branch_form).then(function(entry) {

						//Entry found, prepare entry for upload
						EC.Upload.current_entry = entry;
						self.branch_rows_to_sync.length = 0;
						EC.Notification.hideProgressDialog();

						//connection lost BEFORE tryng the ajax request
						if (status === "error" && error === "") {

							EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_lost"));
						}

						//server timeout
						//connection lost BEFORE tryng the ajax request
						if (status === "timeout" && error === "timeout") {

							EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_timeout"));
						}

					}));
				}
			});

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		module.postOneHierarchyEntry = function() {

			var self = this;
			var upload_URL;
			var project_id = parseInt(window.localStorage.project_id, 10);

			function _sendRequest() {

				$.ajax({
					type : "POST",
					url : upload_URL,
					crossDomain : true,
					timeout : 20000, //timeout after 20 secs
					data : $.param(self.hierarchy_entry_post_obj), //use $.param() to convert the object to a query string (?key=value&key2=value2...)
					success : function(response) {

						//server response is 1 when successful: need to create a better object on the server side
						if (response === '1') {

							//clear post object
							self.hierarchy_entry_post_obj = {};

							// //halt execution and flag the hierarchy rows just uploaded as synced
							EC.Update.setHierarchyEntryAsSynced(self.hierarchy_rows_to_sync).then(function() {

								//entry rows synced, upload next entry (if any)
								self.action = EC.Const.HIERARCHY_RECURSION;
								EC.Select.getOneHierarchyEntry(self.current_form, false);

							});

						} else {

							//a problem occured while uploading/saving data on the server side

							/**
							 * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
							 */

							$.when(EC.Select.getOneHierarchyEntry(self.current_form).then(function(entry) {

								//Entry found, prepare entry for upload
								EC.Upload.current_entry = entry;

								EC.Notification.hideProgressDialog();
								EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("upload_error"));

								self.hierarchy_rows_to_sync.length = 0;

							}));

						}

					},
					error : function(request, status, error) {

						EC.Notification.hideProgressDialog();

						//show request error
						console.log(status + ", " + error);
						console.log('request: ' + JSON.stringify(request));

						/**
						 * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
						 */

						$.when(EC.Select.getOneHierarchyEntry(self.current_form, true).then(function(entry) {

							//Entry found, prepare entry for upload
							EC.Upload.current_entry = entry;
							self.hierarchy_rows_to_sync.length = 0;
							EC.Notification.hideProgressDialog();

							//connection lost BEFORE tryng the ajax request
							if (status === "error" && error === "") {

								EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_lost"));
							}

							//server timeout
							//connection lost BEFORE tryng the ajax request
							if (status === "timeout" && error === "timeout") {

								EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_timeout"));
							}

							//TODO: SQL issues
							if (request.status === 405) {
								EC.Notification.showAlert(EC.Localise.getTranslation("error"), request.responseText);
							}

							//TODO / network issues
							if (request.status === 403) {
								EC.Notification.showAlert(EC.Localise.getTranslation("error"), error + EC.Localise.getTranslation("check_your_internet"));
							}

						}));

					}
				});
			}


			console.log(self.hierarchy_entry_post_obj);

			upload_URL = self.getUploadURL();

			//set upload URL for this project if not in localStorage yet
			if (!EC.Utils.isChrome() && !upload_URL) {
				$.when(EC.Select.getUploadURL(project_id)).then(function(the_project_url) {
					//enable upload data button
					console.log("Project URL is: " + the_project_url);
					upload_URL = the_project_url;
					_sendRequest();
				});
			} else {
				_sendRequest();
			}

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		var branch_entry;
		var self;

		module.branch_entry_post_obj = {};

		module.prepareOneBranchEntry = function(the_table, the_entry) {

			var current_ref;
			var current_value;
			var parent_ref;
			var parent_value;
			var branch_entry = the_entry;

			self = this;
			self.values = branch_entry.values;
			self.branch_entry_key = branch_entry.entry_key;
			self.branch_rows_to_sync = [];

			//table name
			self.branch_entry_post_obj.table = the_table;

			//hierarchy entry owning thi branch
			self.branch_entry_post_obj[branch_entry.hierarchy_entry_key_ref] = branch_entry.hierarchy_entry_key_value;

			//timestamp when entry is first created
			self.branch_entry_post_obj.ecTimeCreated = branch_entry.created_on;

			//phone uuid
			self.branch_entry_post_obj.ecPhoneID = EC.Utils.getPhoneUUID();

			//append entry values to main entry object to be posted
			self.appendBranchEntryValue(self.values.shift(), self.branch_entry_key);

		};

		module.appendBranchEntryValue = function(the_entry_value) {

			var self = this;
			var current_value;
			var current_ref;
			var branch_form;

			current_value = the_entry_value.value;
			current_ref = the_entry_value.ref;

			/*Keep track of row _id (if _id is empty, it is because the location value was split into 4 parts but just one row is saved in the database)
			 *rows _ids are needed later to sync the branch entry after a successful upload
			 */

			if (the_entry_value._id !== "") {
				self.branch_rows_to_sync.push({
					_id : the_entry_value._id
				});
			}

			//common value, add it to main entry object
			self.branch_entry_post_obj[current_ref] = current_value;

			//append next value(if any)
			if (self.values.length > 0) {

				self.appendBranchEntryValue(self.values.shift(), self.branch_entry_key);

			} else {

				//no more values to append to the object to be posted for this branch entry, so post 1 single branch entry
				self.postOneBranchEntry();
			}

		};

		return module;

	}(EC.Upload));

var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = (function (module) {
    'use strict';

    //property to hold arrays of values across module
    module.values = [];
    //property to hold main entry key value across module
    module.main_entry_key = [];
    //branch_form name across modules
    module.branch_form_name = '';
    module.hierarchy_entry_post_obj = {};

    /**
     * Post a single row (server side) which consists of all the input values for a form entry
     */
    module.prepareOneHierarchyEntry = function (the_table, the_entry) {

        var self = this;
        var parent_ref;
        var parent_value;
        var entry = the_entry;

        self.values = entry.values;
        self.hierarchy_rows_to_sync = [];

        //table name
        self.hierarchy_entry_post_obj.table = the_table;

        //timestamp when entry is first created
        self.hierarchy_entry_post_obj.ecTimeCreated = entry.created_on;

        //phone uuid
        self.hierarchy_entry_post_obj.ecPhoneID = EC.Utils.getPhoneUUID();

        //add parent ref and parent value for a child form (if defined)
        if (entry.parent_ref !== undefined) {

            parent_ref = entry.parent_ref;
            parent_value = entry.parent_key_value;
            self.hierarchy_entry_post_obj[parent_ref] = parent_value;
        }
        //append entry values to main entry object to be posted
        self.appendEntryValue(self.values.shift());
    };

    module.appendEntryValue = function (the_entry_value) {

        var self = this;
        var current_value;
        var current_ref;

        current_value = the_entry_value.value;
        current_ref = the_entry_value.ref;

        //keep track of row _id (if _id is empty, it is because the location value was split into 4 parts but just one row is saved in the database)
        if (the_entry_value._id !== '') {
            self.hierarchy_rows_to_sync.push({
                _id: the_entry_value._id,
                type: the_entry_value.type
            });
        }

        /*if the current value is a branch skip it, we do not need it as part of the hierarchy post
         * Branches need to be uploaded separately, AFTER all hierarchy entries have been uploaded
         */
        if (the_entry_value.type !== EC.Const.BRANCH) {
            //common value, add it to main entry object
            self.hierarchy_entry_post_obj[current_ref] = current_value;
        }

        //append next value(if any)
        if (self.values.length > 0) {

            self.appendEntryValue(self.values.shift());

        } else {

            //TODO: no more values to append to the object to be posted for this main entry, so post 1 single main entry
            console.log(self.hierarchy_entry_post_obj);
            //no more values to append, post main entry now as all the branch entries have been uploaded
            self.postOneHierarchyEntry();
        }

    };

    return module;

}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *
 * Comments here TODO
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		module.renderUploadView = function(the_has_hard_reload_flag) {

			var self = this;
			var has_hard_reload = the_has_hard_reload_flag;

			self.project_name = window.localStorage.project_name;
			self.project_id = parseInt(window.localStorage.project_id, 10);
			self.has_branches = EC.Utils.projectHasBranches();
			self.hierarchy_forms = JSON.parse(window.localStorage.forms);
			self.current_form = self.hierarchy_forms.shift();
			self.current_entry = {};
			self.action = EC.Const.START_HIERARCHY_UPLOAD;

			//set label (page title)
			console.log(self.project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));
			$("div#upload div[data-role='navbar'] ul li.title-tab span#upload-label span.project-name").text(self.project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

			//bind view buttons
			self.bindUploadButtons(has_hard_reload, self);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//callback when a single un-synced hierarchy entry is found
			function _onOneHierarchyEntryFound(the_entry) {

				//Entry found, prepare entry for upload
				self.current_entry = the_entry;

				//keep track this is a hierarchy entry
				self.is_branch_entry = false;

				//enable upload data button
				self.upload_data_btn.removeClass("ui-disabled");

				//hide all synced message
				self.all_synced_message.addClass('hidden');
			}

			//callback when no hierarchy un-synced entries are found upon first page load
			function _onOneHierarchyEntryNotFound() {

				console.log("No unsynced hierarchy data entry found");

				//reset branch forms array to get rid of old cahced forms
				self.branch_forms = [];

				//no hierarchy entry found, if the project has branches check for any un-synced
				// branch entries
				if (self.has_branches) {

					var _onOneBranchEntryFound = function(the_branch_entry) {

						//Entry found, prepare entry for upload
						self.current_branch_entry = the_branch_entry;

						//keep track this is a branch entry
						self.is_branch_entry = true;

						//enable upload data button
						self.upload_data_btn.removeClass("ui-disabled");
						self.all_synced_message.addClass('hidden');
					};

					var _onOneBranchEntryNotFound = function() {

						//no branch entries found, handle media
						self.handleMedia();

					};

					//start brach upload
					self.action = EC.Const.START_BRANCH_UPLOAD;

					//get branch forms for this project BEFORE tryng to look for a branch entry
					$.when(EC.Select.getBranchForms(self.project_id)).then(function(the_branch_forms) {

						self.branch_forms = the_branch_forms;
						self.current_branch_form = self.branch_forms.shift();

						//look for a branch entry for the first form
						$.when(EC.Select.getOneBranchEntry(self.project_id, self.current_branch_form.name, true).then(_onOneBranchEntryFound, _onOneBranchEntryNotFound));
					});

				}
				else {

					/* This project does not have branches: since no hierarchy entries were found,
					 * check if we have any media ready to upload (is_data_synced = 1 AND
					 * is_media_synced = 0)
					 */
					self.handleMedia();

				}
			}

			//let's start looking at hierarchy branches first, then branches
			self.is_branch_image = false;
			self.is_branch_audio = false;
			self.is_branch_video = false;

			//get first hierarchy entry not yet synced. The approach is to upload and sync a
			// single entry (cluster of rows) at a time
			$.when(EC.Select.getOneHierarchyEntry(self.current_form, true).then(_onOneHierarchyEntryFound, _onOneHierarchyEntryNotFound));

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *
 * Comments here TODO
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		module.renderUploadViewFeedback = function(is_successful) {

			var self = this;

			//notify user all data were uploaded successfully
			EC.Notification.hideProgressDialog();

			//show upload success notification only after an upload. When the user first
			// request the uplad view, that will not be shown
			if (self.action === EC.Const.STOP_HIERARCHY_UPLOAD || self.action === EC.Const.STOP_BRANCH_UPLOAD) {
				if (is_successful) {

					//disable data upload button as no data to upload any more
					self.upload_data_btn.addClass('ui-disabled');
					self.all_synced_message.removeClass('hidden');

					EC.Notification.showToast(EC.Localise.getTranslation("data_upload_success"), "short");

					//look for media to upload (if any)
					self.handleMedia();
				}
			}
		};
		
		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		var upload_images_btn;
		var upload_audios_btn;
		var upload_videos_btn;

		module.uploadNextFile = function(the_media_type) {

			var self = this;
			var media_dir;
			var project_id = parseInt(window.localStorage.project_id, 10);
			var all_synced_message = $('div#upload div#upload-options .all-synced-message');

			//upload another file of same type (if any)
			switch(the_media_type) {

				case EC.Const.PHOTO:

					//get next image (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.PHOTO).then(function(the_image) {

						//post image
						media_dir = EC.Const.PHOTO_DIR;
						EC.Upload.is_branch_image = false;
						EC.File.uploadFile(the_image, media_dir);

					}, function() {

						/* no more hierarchy images to post
						 * check branches for images
						 */
						$.when(EC.Select.getOneBranchPhotoFile(project_id)).then(function(the_branch_image) {

							//post image
							media_dir = EC.Const.PHOTO_DIR;
							EC.Upload.is_branch_image = true;
							EC.File.uploadFile(the_branch_image, media_dir);

						}, function() {

							//disable upload images button, as no more images to upload
							upload_images_btn = $('div#upload div#upload-options div#upload-images-btn');
							upload_images_btn.addClass("ui-disabled");
							self.photo_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('hidden');
							}
							else {
								all_synced_message.removeClass('hidden');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_images_uploaded"), "short");
						});

					}));

					break;

				case EC.Const.AUDIO:

					//get next audio file (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.AUDIO).then(function(the_audio) {

						//post audio file
						media_dir = EC.Const.AUDIO_DIR;
						EC.Upload.is_branch_audio = false;
						EC.File.uploadFile(the_audio, media_dir);

					}, function() {

						/* No more audio files to post
						 * check branches for audios
						 */
						$.when(EC.Select.getOneBranchAudioFile(project_id)).then(function(the_branch_audio) {

							//post image
							media_dir = EC.Const.AUDIO_DIR;
							EC.Upload.is_branch_audio = true;
							EC.File.uploadFile(the_branch_audio, media_dir);

						}, function() {

							//disable upload audios button, as no more audio files to upload
							upload_audios_btn = $('div#upload div#upload-options div#upload-audios-btn');
							upload_audios_btn.addClass("ui-disabled");
							self.audio_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('hidden');
							}
							else {
								all_synced_message.removeClass('hidden');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_audios_uploaded"), "short");
						});

					}));
					break;

				case EC.Const.VIDEO:

					//get next image (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.VIDEO).then(function(the_video) {

						//post video
						media_dir = EC.Const.VIDEO_DIR;
						EC.File.uploadFile(the_video, media_dir);

					}, function() {

						/* No more video files to post
						 * check branches for video files
						 */
						$.when(EC.Select.getOneBranchVideoFile(project_id)).then(function(the_branch_video) {

							//post image
							media_dir = EC.Const.VIDEO_DIR;
							EC.Upload.is_branch_video = true;
							EC.File.uploadFile(the_branch_video, media_dir);

						}, function() {

							//disable upload audios button, as no more audio files to upload
							upload_videos_btn = $('div#upload div#upload-options div#upload-videos-btn');
							upload_videos_btn.addClass("ui-disabled");
							self.video_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('hidden');
							}
							else {
								all_synced_message.removeClass('hidden');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_videos_uploaded"), "short");
						});
					}));
					break;

			}

		};

		return module;

	}(EC.Upload));

/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Test
 *
 */

var EC = EC || {};
EC.Test = EC.Test || {};
EC.Test = ( function(module) {"use strict";

		var total;
		var deferred;

		function _makeString(how_long) {

			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var i;

			for ( i = 0; i < how_long; i++) {
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			return text;
		}

		var _insertFormValuesTX = function(tx) {

			var i;
			var iLength = total;
			var query;
			var obj;
			var remote_flag = 0;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = {};
				obj.parent = "";
				obj.is_data_synced = 0;
				obj.is_media_synced = 0;
				obj.created_on = EC.Utils.getTimestamp();

				if (i % 2 === 0) {

					//this is the ID input
					obj.label = "ID";
					obj.ref = "id";

					query += 'INSERT INTO ec_data (';
					query += 'input_id, ';
					query += 'form_id, ';
					query += 'position, ';
					query += 'parent, ';
					query += 'label, ';
					query += 'ref, ';
					query += 'value, ';
					query += 'is_title, ';
					query += 'entry_key, ';
					query += 'type, ';
					query += 'created_on, ';
					query += 'is_data_synced, ';
					query += 'is_remote, ';
					query += 'is_media_synced) ';
					query += 'VALUES ("';
					query += 1 + '", "';
					query += 1 + '", "';
					query += 1 + '", "';
					query += obj.parent + '", "';
					query += obj.label + '", "';
					query += obj.ref + '", "';
					query += i+10000 + '", "';
					query += 1 + '", "';
					query += i+10000 + '", "';
					query += EC.Const.INTEGER + '", "';
					query += obj.created_on + '", "';
					query += obj.is_data_synced + '", "';
					query += remote_flag + '", "';
					query += obj.is_media_synced + '");';

				} else {

					//this is the name input
					obj.label = "Name";
					obj.ref = "ecplus_form_ctrl2";

					query += 'INSERT INTO ec_data (';
					query += 'input_id, ';
					query += 'form_id, ';
					query += 'position, ';
					query += 'parent, ';
					query += 'label, ';
					query += 'ref, ';
					query += 'value, ';
					query += 'is_title, ';
					query += 'entry_key, ';
					query += 'type, ';
					query += 'created_on, ';
					query += 'is_data_synced, ';
					query += 'is_remote, ';
					query += 'is_media_synced) ';
					query += 'VALUES ("';
					query += 2 + '", "';
					query += 1 + '", "';
					query += 2 + '", "';
					query += obj.parent + '", "';
					query += obj.label + '", "';
					query += obj.ref + '", "';
					query += _makeString(25) + '", "';
					query += 1 + '", "';
					query += i-1 + 10000+ '", "';
					query += EC.Const.TEXT + '", "';
					query += obj.created_on + '", "';
					query += obj.is_data_synced + '", "';
					query += remote_flag + '", "';
					query += obj.is_media_synced + '");';

				}

				tx.executeSql(query, [], _insertFormValuesSQLSuccessCB, _errorCB);

			}//for

		};

		var _onupdateHierarchyEntriesCounterSQLCB = function() {
		};

		var _updateHierarchyEntriesCounterTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + total/2 + ' WHERE _id=?';

			tx.executeSql(query, [1], _onupdateHierarchyEntriesCounterSQLCB, _errorCB);
		};

		var _onCounterUpdateSuccessCB = function() {

			deferred.resolve();
		};

		var _insertFormValuesSQLSuccessCB = function() {
			console.log("FORM VALUE SQL QUERY SUCCESS");
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		var _insertFormValuesSuccessCB = function() {

			EC.db.transaction(_updateHierarchyEntriesCounterTX, _errorCB, _onCounterUpdateSuccessCB);

		};

		/*
		 * Commit a form to database; each value is a row in the table ec_data
		 * a single entry get multiple rows
		 */
		module.insertEntries = function(the_total) {

			total = the_total;
			deferred = new $.Deferred();

			EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Test));
