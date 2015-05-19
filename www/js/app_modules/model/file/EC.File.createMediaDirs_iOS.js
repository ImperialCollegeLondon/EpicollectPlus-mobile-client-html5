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
