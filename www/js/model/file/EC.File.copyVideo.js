/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /*
     * Copyvthe video file from app private folder to app cache folder changing the file name to the current timestamp (video extension will be always .mp4)
     *
     * We do so to make it playable via a third party application (ANDROID only, and it needs a better implementation on 4.4+)
     */
    var video_path;
    var stored_filename;
    var cached_filename;
    var is_branch;
    var deferred;

    module.copyVideo = function (the_video_path, is_branch_flag) {

        deferred = new $.Deferred();
        video_path = the_video_path;
        is_branch = is_branch_flag;
        cached_filename = EC.Utils.getTimestamp() + '.mp4';

        function fail(error) {
            console.log(error);
        }

        function onLFSSuccess(the_video_file_entry) {

            function gotFS(the_file_system) {

                var fs = the_file_system;
                console.log(fs);
                //move file to externalCacheDirectory (directory entry pointing to external cache folder)
                the_video_file_entry.copyTo(fs, cached_filename, function (success) {
                    deferred.resolve(cached_filename);
                }, fail);
            }

            function fail(error) {
                console.log(error);
            }
            //request temporary folder from file system
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, gotFS, fail);
        }

        //get file entry resolving file full path
        window.resolveLocalFileSystemURI(video_path, onLFSSuccess, fail);

        return deferred.promise();

    };

    return module;

}(EC.File));
