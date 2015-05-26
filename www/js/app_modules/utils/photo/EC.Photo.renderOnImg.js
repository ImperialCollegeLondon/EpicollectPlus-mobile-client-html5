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



