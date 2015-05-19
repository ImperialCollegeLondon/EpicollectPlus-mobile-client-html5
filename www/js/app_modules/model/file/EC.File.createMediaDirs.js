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
     *
     * Android: folders are created in 'data/data/<package_name>/files/'
     * iOS: in the Documents folder as the iOS permanent storage
     *
     *
     *
     */

    var dirs;
    var entry;
    var deferred;
    var platform;

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

            //quick hack for Android
            //todo: fix media folder paths on Android
            if (platform === EC.Const.ANDROID) {
                media_dir = media_dir.replace('/files/', '');
            }

            //create a media folder: images, audios, videos
            entry.getDirectory(media_dir, {
                create: true,
                exclusive: false
            }, onCreateSuccess, onCreateFail);

        }
        else {
            console.log('Media folders created');
            window.localStorage.are_media_folders_created = 1;
            deferred.resolve();
        }
    }

    function onIOSRFSSuccess(the_fileSystem) {


        if (platform === EC.Const.ANDROID) {
            entry = the_fileSystem;
        }
        else {
            // on iOS we are still using the old invocation...to be updated
            entry = the_fileSystem.root;
        }

        //create media folders recursively
        _createMediaDir();

    }

    function onIOSRFSError(error) {
        console.log(error);
        deferred.reject();
    }

    module.createMediaDirs = function () {

        deferred = new $.Deferred();
        platform = window.device.platform;

        //if folders are already created, resolve immediately
        if (window.localStorage.are_media_folders_created) {
            deferred.resolve();
        }
        else {

            dirs = [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR];

            if (platform === EC.Const.ANDROID) {
                //get hanlde of 'data/data/<package_name>/files/' on Android
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, onIOSRFSSuccess, onIOSRFSError);
            }
            else {
                //todo update with new invocation like Android
                //persistent storage on iOS is the "Documents" or 'Library' folder in the app sandbox
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess, onIOSRFSError);
            }
        }

        return deferred.promise();
    };

    return module;

}(EC.File));
