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
