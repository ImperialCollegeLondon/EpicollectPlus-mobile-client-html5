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


