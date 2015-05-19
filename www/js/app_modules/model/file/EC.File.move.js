/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    /*
     * Move files from temporary (cache) folder to app (private) folder
     *
     * Android: file://data/data/{package_name}/files
     *
     * /images
     * /audios
     * /videos
     *
     * /<project_name>
     *
     *  @param {array} the_files - array of file objects like:
     * {
     *      type: <input type>,
     *      ref: <input ref>,
     *      cached: <file path on the filesystem for cached files>,
     *      stored: <file path on the filesystem for stored files>
     * }
     *
     * @return void, but it triggers a recursive call to itself after each file is
     * moved successfully.
     *
     * When all files are saved, it calls EC.Inputs.buildRows() to save all the input
     * fields related to this form and media to the db
     */
    module.move = function (the_files, is_branch_flag) {

        //Get media directory based on the type of file
        function _getMediaDir(the_file_type) {

            var type = the_file_type;
            var dir;

            switch (type) {

                case EC.Const.PHOTO:
                    dir = EC.Const.PHOTO_DIR;
                    break;

                case EC.Const.AUDIO:
                    dir = EC.Const.AUDIO_DIR;
                    break;

                case EC.Const.VIDEO:
                    dir = EC.Const.VIDEO_DIR;
                    break;
            }

            return dir;

        }

        var files = the_files;
        var is_branch = is_branch_flag;

        //get details for current file
        var file = files.shift();

        console.log('files: ' + JSON.stringify(file));

        var cached_filepath = file.cached;
        var stored_filepath = file.stored;
        var parts;
        var filename;
        var ref = file.ref;
        var destination = _getMediaDir(file.type);

        if (cached_filepath === '' || cached_filepath === undefined) {

            //we do not have a cached file to move, skip to next file (if any)
            if (files.length === 0) {

                //all files saved, build and save the rows
                if (is_branch) {
                    //save rows for branch form
                    EC.BranchInputs.buildRows();
                }
                else {
                    //save rows for main form
                    EC.Inputs.buildRows();
                }

            }
            else {
                EC.File.move(files, is_branch);
            }
        }
        else {

            console.log('cached filepath: ' + JSON.stringify(cached_filepath));

            //we have a cache file to move
            parts = cached_filepath.split('/');
            filename = parts[parts.length - 1];

            //request external cache temporary folder from file system
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, gotFS, fail);

            console.log('stored filepath:' + stored_filepath);
        }

        function gotFS(the_file_system) {

            //create a directory reader to read files inside the temporary folder
            var fs = the_file_system;
            var dir = fs.createReader();
            dir.readEntries(onDirReadSuccess, onDirReadError);

            function onDirReadSuccess(the_dir_entries) {

                var dir_entries = the_dir_entries;
                var i;
                var iLength = dir_entries.length;

                //loop all the files in the temporary directory to find the one we want to move
                for (i = 0; i < iLength; i++) {

                    console.log('dir_entries[i].name  ' + dir_entries[i].name);
                    console.log('filename  ' + filename);

                    //if the current file name matches the file name we want to save, move the file
                    if (dir_entries[i].name === filename) {

                        fs.getFile(dir_entries[i].name, {
                            create: false
                        }, processEntry, onFileError);
                    }
                }

                //process the file
                function processEntry(the_entry) {

                    var file = the_entry;
                    var project_name = window.localStorage.project_name;
                    var form_name = window.localStorage.form_name;
                    var uuid = EC.Utils.getPhoneUUID();
                    var stored_filename;

                    //Create a new file or override existing one
                    if (stored_filepath === '') {

                        //build file name in the format <form_name>_<ref>_<uuid>_filename
                        stored_filename = form_name + '_' + ref + '_' + uuid + '_' + filename;

                    }
                    else {

                        parts = stored_filepath.split('/');
                        stored_filename = parts[parts.length - 1];
                    }

                    //get app private dir (Android) requested subfolder (destination: images, audios,
                    // videos)
                    window.resolveLocalFileSystemURL(EC.Const.ANDROID_APP_PRIVATE_URI + destination, onLFSSuccess, onLFSError);

                    function onLFSSuccess(the_parent_dir) {

                        var project_dir = window.localStorage.project_name;
                        var parent_dir = the_parent_dir;

                        //create new project directory (if not exits)
                        parent_dir.getDirectory(project_dir, {
                            create: true,
                            exclusive: false
                        }, onGetDirectorySuccess, onGetDirectoryFail);

                        function onGetDirectorySuccess() {

                            console.log('parent_dir: ' + JSON.stringify(parent_dir));
                            console.log('destination dir: ' + destination + project_dir + '/' + stored_filename);

                            //move file to project directory
                            file.moveTo(parent_dir, '/' + project_dir + '/' + stored_filename, onMovedOK, onMovedFail);

                            function onMovedOK(success) {

                                console.log('files length:' + files.length);
                                console.log(JSON.stringify(files));

                                //save next file or trigger callback to save the row
                                if (files.length === 0) {

                                    console.log('no more files to save, build rows');

                                    //all files saved, build and save the rows
                                    if (is_branch) {
                                        //save rows for branch form
                                        EC.BranchInputs.buildRows();
                                    }
                                    else {
                                        //save rows for main form
                                        EC.Inputs.buildRows();
                                    }

                                }
                                else {
                                    //save next file
                                    console.log('move another file');
                                    EC.File.move(files, is_branch);
                                }

                                console.log('file move OK : ' + JSON.stringify(success));
                            }

                            function onMovedFail(error) {

                                console.log('onMovedFail:' + JSON.stringify(error));
                            }

                        }

                        function onGetDirectoryFail(error) {
                            console.log('onGetDirectoryFail: ' + JSON.stringify(error));
                        }

                    }//onLFSSuccess

                    function onLFSError(error) {
                        console.log('onLFSError: ' + JSON.stringify(error));
                    }//onLFSError

                }

            }//onDirReadSuccess

            function onDirReadError(error) {
                console.log('onDirReadError: ' + JSON.stringify(error));
            }//onDirReadError

            function onFileError(error) {
                console.log('onFileError ' + JSON.stringify(error));
            }//onFileError

        }//gotFS

        function fail(error) {
            console.log('fail' + JSON.stringify(error));
        }//fail

    };
    //moveFile

    return module;

}(EC.File));
