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


