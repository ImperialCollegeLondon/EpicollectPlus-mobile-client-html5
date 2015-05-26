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
