/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, Camera*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
        "use strict";

        module.photo = function(the_value, the_input) {

            var obj;
            var span_label = $('span.label');
            var value = the_value;
            var input = the_input;
            var camera_btn = $('div#input-photo div#camera-btn');
            var thumbnail = $('img#image_thumbnail');
            var store_image_uri = $('div#input-photo input#stored-image-uri');
            var cache_image_uri = $('div#input-photo input#cached-image-uri');
            var image_full_path_uri;
            // var image_src_loaded = false;

            //clear canvas from previous images
            var canvas_portrait_dom = $('#canvas-portrait');
            var canvas_landscape_dom = $('#canvas-landscape');
            var canvas_portrait = $('#canvas-portrait')[0];
            var canvas_landscape = $('#canvas-landscape')[0];

            var context_portrait = canvas_portrait.getContext("2d");
            context_portrait.clearRect(0, 0, canvas_portrait.width, canvas_portrait.height);

            var context_landscape = canvas_landscape.getContext("2d");
            context_landscape.clearRect(0, 0, canvas_landscape.width, canvas_landscape.height);

            //Localise
            if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
                EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
            }

            // //on iOS, close image popup on orientation change
            if (EC.Const.IOS) {
                //TODO
            }

            $('div#canvas-wrapper').off().on('vclick', function(e) {

                if (window.device) {
                    switch(window.device.platform) {

                        //on Android we show the image as a opo up using swipebox
                        case EC.Const.ANDROID:
                            e.preventDefault();
                            $.swipebox([{
                                href : $('div#input-photo input#cached-image-uri').val()
                            }]);
                            break;

                        //on iOS we show a built in JQM popup, as swipebox has
                        // got issues
                        case EC.Const.IOS:
                            $("#photo-popup img").attr("src", $('div#input-photo input#cached-image-uri').val());

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

                            window.setTimeout(function() {
                                $("#photo-popup").popup("open");
                            }, 100);

                            $(window).on("orientationchange", function(event) {
                                console.log("called orientationchange");

                                //close popup, as it is not scaled/positioned
                                // properly
                                $("#photo-popup").popup("close");
                            });

                            break;
                    }

                }

            });

            //Render thumbnail on <canvas>
            var _renderThumb = function(the_image_uri) {

                //load taken image on <canvas> tag
                var image = new Image();
                var canvas;
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
                 */
                if (window.device.platform === EC.Const.IOS) {
                    source += "?" + parseInt(new Date().getTime() / 1000, 10);
                }

                image.src = source;

                image.onerror = function() {
                    console.log("Image failed!");
                };

                image.onload = function() {

                    //TODO:resize image to fit in canvas -> it is not working
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
                        canvas_landscape_dom.addClass('not-shown');
                        canvas_portrait_dom.removeClass('not-shown');

                    } else {

                        //landscape
                        canvas = canvas_landscape;
                        thumb_width = 250;
                        thumb_height = 188;
                        canvas_portrait_dom.addClass('not-shown');
                        canvas_landscape_dom.removeClass('not-shown');
                    }

                    context = canvas.getContext("2d");
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.save();

                    //scale image based on device pixel density
                    // context.scale(window.devicePixelRatio,
                    // window.devicePixelRatio);
                    context.imageSmoothingEnabled = false;
                    context.drawImage(this, 0, 0, thumb_width, thumb_height);
                    context.restore();

                };
                //image.onload

                console.log(JSON.stringify(source));

            };

            //hide both canvas
            canvas_landscape_dom.addClass('not-shown');
            canvas_portrait_dom.addClass('not-shown');

            //update label text
            span_label.text(input.label);

            //if a value is stored when editing, on the first load add it to
            // hidden input field,  to be shown if no cached value is set
            if (window.localStorage.edit_mode) {

                if (value.stored === undefined) {
                    store_image_uri.val(value);
                    value = {
                        cached : "",
                        stored : value
                    };
                } else {

                    store_image_uri.val(value.stored);
                }

            }

            console.log('value.stored ' + JSON.stringify(value.stored));

            //If a cache value is set, add it to hidden field
            cache_image_uri.val(value.cached || "");
            console.log('cache_image_uri: ' + cache_image_uri.val());

            //Show cached image if any, otherwise the stored image, if any
            if (value.cached === "") {

                console.log("cached value empty");

                if (value.stored !== "") {

                    //build full path to get image from private app folder
                    switch(window.device.platform) {

                        case EC.Const.ANDROID:
                            image_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + "/" + value.stored;
                            break;
                        case EC.Const.IOS:
                            //prepend "file://" to load images from iOS
                            // application directory
                            image_full_path_uri = "file://" + EC.Const.IOS_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + "/" + value.stored;
                            break;

                    }

                    console.log('image_full_path_uri: ' + image_full_path_uri);

                    _renderThumb(image_full_path_uri);

                }

            } else {

                //render the cached image
                _renderThumb(value.cached);
            }

            //Set camera options - anything more than 1024 x 728 will crash
            var source = Camera.PictureSourceType.CAMERA;
            var camera_options = {
                quality : 50, //anything more than this will cause memory leaks
                destinationType : Camera.DestinationType.FILE_URI,
                sourceType : source,
                encodingType : Camera.EncodingType.JPEG,
                mediaType : Camera.MediaType.PICTURE,
                correctOrientation : true,
                saveToPhotoAlbum : false,
                targetWidth : 1024,
                targetHeight : 768
            };

            //open camera app on click
            camera_btn.off().on('vclick', function() {

                navigator.camera.getPicture(onGPSuccess, onGPError, camera_options);

            });

            //Success callback
            var onGPSuccess = function(the_image_uri) {

                console.log("image_uri: " + the_image_uri);

                var image_uri = the_image_uri;

                //render the new image on canvas
                _renderThumb(image_uri);

                //save cached filename in hidden input field
                console.log('image uri is' + image_uri);

                $('div#input-photo input#cached-image-uri').val(image_uri);

                // image_src_loaded = false;

            };

            //Error callback
            var onGPError = function(error) {

                EC.Utils.showAlert("Error", "Failed because: " + error);

            };

        };

        return module;

    }(EC.InputTypes));
