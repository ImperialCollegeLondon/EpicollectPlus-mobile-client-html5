/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /*  Android only, iOS has got its own method to move the file
     * Move the video file from sd card folder (real or emulated) t
     * o app cache folder changing the file name to the current timestamp
     * (video extension will be always .mp4)
     */
    var video_path;
    var cached_filename;
    var is_branch;
    var deferred;

    module.moveVideo = function (the_video_path, the_cache_video_uri, is_branch_flag) {

        deferred = new $.Deferred();
        video_path = the_video_path;
        is_branch = is_branch_flag;
        cached_filename = (the_cache_video_uri === '') ? EC.Utils.getTimestamp() + '.mp4' : the_cache_video_uri;

        function onLFSSuccess(the_video_file_entry) {

            function gotFS(the_file_system) {

                var fs = the_file_system;

                //move file to fs.root(directory entry pointing to app cache folder)
                the_video_file_entry.moveTo(fs, cached_filename, function (success) {
                    console.log(success);
                    deferred.resolve(cached_filename);
                }, function (error) {
                    console.log(error);
                });
            }

            function fail(error) {
                console.log(error);
            }

            //request temporary folder from file system
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, gotFS, fail);
        }

        function onLFSError(error) {
            console.log(error);
        }

        //get file entry resolving file full path
        window.resolveLocalFileSystemURI(video_path, onLFSSuccess, onLFSError);

        return deferred.promise();

    };

    return module;

}(EC.File));
