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
