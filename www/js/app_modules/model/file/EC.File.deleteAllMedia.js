/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
        "use strict";

        /*
        * Delete media files from app private folder by project_name and in sequence images -> audios -> videos recursively
        *
        * Android: file://data/data/{package_name}/files
        *
        * -images
        * -audios
        * -videos
        *
        * /<project_name>
        *
        * @param {the_project_name} the project name to delete media from
        * @param {has_project_been_deleted} whether the project itself was deleted beforehand or not:
        *  we need to keep track of this as if the project is not deleted, we have to set the values of all the media rows to empty strings
        *
        *
        */
        //media dirs are declared outside deleteAllMedia because the fucntion is
        // called recursively
        var media_dirs;

        var deferred;

        module.deleteAllMedia = function(the_project_name, has_project_been_deleted, the_media_dirs) {

            var self = this;
            var project_name = the_project_name;
            var is_project_deleted = has_project_been_deleted;
            var media_dirs = the_media_dirs;
            var dir = media_dirs.shift();
            var app_private_dir_path;
            var project_id = window.parseInt(window.localStorage.project_id, 10);
            var hierarchy_forms = JSON.parse(window.localStorage.forms);

            if (!deferred) {
                deferred = new $.Deferred();
            }

            console.log("dir: " + EC.Const.ANDROID_APP_PRIVATE_URI + dir + project_name);

            var _onDirSuccess = function(the_dir) {

                var dir_entry = the_dir;

                console.log('dir_entry: ' + JSON.stringify(dir_entry));

                var _onDirDeleted = function() {
                    console.log("dir deleted, skip to next one if any");

                    if (media_dirs.length > 0) {

                        self.deleteAllMedia(project_name, is_project_deleted, media_dirs);

                    } else {
                        console.log("All media deleted");

                        //update database, set all media values to empty string
                        // for this project (if project not deleted)
                        if (!is_project_deleted) {
                            $.when(EC.Update.emptyMediaValues(hierarchy_forms, project_id)).then(function() {
                                //EC.Entries.allMediaDeletedFeedback(true);
                                deferred.resolve();

                            }, function(error) {
                                //EC.Entries.allMediaDeletedFeedback(false);
                                deferred.resolve();
                                console.log(error);
                            });
                        } else {
                            deferred.resolve();
                            deferred = null;
                        }

                    }

                };

                var _onDirDeleteError = function(the_error) {
                    console.log(JSON.stringify(the_error));
                };

                dir_entry.removeRecursively(_onDirDeleted, _onDirDeleteError);
            };

            var _onDirError = function(the_error) {

                //if the directory is not found (error code 1), no files yet so
                // skip to next media type
                if (the_error.code === 1) {

                    //skip to next folder if any
                    console.log("no dir " + dir + ", skip to next");

                    if (media_dirs.length > 0) {
                        self.deleteAllMedia(project_name, is_project_deleted, media_dirs);
                    } else {

                        console.log("All media deleted");

                        //update database, set all media values to empty string
                        // for this project (if project not deleted)
                        if (!is_project_deleted) {
                            $.when(EC.Update.emptyMediaValues(hierarchy_forms, project_id)).then(function() {
                                //EC.Entries.allMediaDeletedFeedback(true);
                                deferred.resolve();
                                deferred = null;
                            }, function() {
                                //EC.Entries.allMediaDeletedFeedback(false);
                                deferred.resolve();
                                deferred = null;
                            });
                        } else {
                            deferred.resolve();
                            deferred = null;
                        }

                    }
                }

                console.log(JSON.stringify(the_error));
            };

            //get app private data path based on platform
            switch(window.device.platform) {

                case EC.Const.ANDROID:
                    app_private_dir_path = EC.Const.ANDROID_APP_PRIVATE_URI;
                    break;
                case EC.Const.IOS:
                    app_private_dir_path = "file://" + EC.Const.IOS_APP_PRIVATE_URI;
                    break;
            }

            console.log(app_private_dir_path + dir + project_name);

            //get app private dir (Android) for the media of this project
            window.resolveLocalFileSystemURL(app_private_dir_path + dir + project_name, _onDirSuccess, _onDirError);

            return deferred.promise();

        };

        return module;
    }(EC.File));
