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
