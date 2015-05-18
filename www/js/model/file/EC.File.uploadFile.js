/*global $, jQuery, cordova, device, FileTransfer*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = (function (module) {
    'use strict';

    var filename = '';
    var upload_URL = '';
    var project_name = '';
    var media_dir = '';
    var media_type = '';
    var _id = '';
    var self;
    var is_branch_file;

    module.uploadFile = function (the_file_row, the_media_dir) {

        console.log('the_filename: ' + the_file_row.value);

        var ft = new FileTransfer();
        var file_URI;
        var app_private_dir;
        var options = {};
        var uuid = EC.Utils.getPhoneUUID();
        var project_id = parseInt(window.localStorage.project_id, 10);

        var _doUpload = function () {

            project_name = window.localStorage.project_name;
            filename = the_file_row.value;
            _id = the_file_row._id;
            media_dir = the_media_dir;

            //add query parameters based on the type of file. URLs are set by
            // the server API
            switch (media_dir) {

                case EC.Const.PHOTO_DIR:
                    upload_URL += ('?type=thumbnail&phoneID=' + uuid);

                    console.log('Upload URL for thumbnail: ' + upload_URL);
                    media_type = EC.Const.PHOTO;

                    //branch or hierarchy?
                    if (EC.Upload.is_branch_image) {
                        is_branch_file = true;
                    }

                    break;

                case EC.Const.AUDIO_DIR:

                    upload_URL += ('?type=audio&phoneID=' + uuid);
                    media_type = EC.Const.AUDIO;

                    console.log('Upload URL for audio: ' + upload_URL);
                    //branch or hierarchy?
                    if (EC.Upload.is_branch_audio) {
                        is_branch_file = true;
                    }
                    break;

                case EC.Const.VIDEO_DIR:

                    upload_URL += ('?type=video&phoneID=' + uuid);
                    media_type = EC.Const.VIDEO;

                    console.log('Upload URL for video: ' + upload_URL);
                    if (EC.Upload.is_branch_video) {
                        is_branch_file = true;
                    }
                    break;
            }

            console.log('filename:' + JSON.stringify(filename));

            //get app private dir based on platform
            switch (window.device.platform) {
                case EC.Const.ANDROID:
                    app_private_dir = EC.Const.ANDROID_APP_PRIVATE_URI;
                    break;
                case EC.Const.IOS:
                    app_private_dir = EC.Const.IOS_APP_PRIVATE_URI;
                    break;
            }

            //set options for multipart entity file
            options.mimeType = '';
            options.fileKey = 'name';
            options.fileName = filename;

            if (window.device.platform === EC.Const.IOS) {
                //options.chunkedMode = false;
            }

            //build file full path
            file_URI = app_private_dir + media_dir + project_name + '/' + filename;

            console.log('file_URI: ' + JSON.stringify(file_URI));

            /*
             * in the future we might need this, to show a proper upload
             * feedback
             */
            ft.onprogress = function (progressEvent) {
                // if (progressEvent.lengthComputable) {
                // loadingStatus.setPercentage(progressEvent.loaded /
                // progressEvent.total);
                // } else {
                // loadingStatus.increment();
                // }
                //console.log(progressEvent);
                //console.log(loadingStatus);
            };

            //perform the upload
            ft.upload(file_URI, upload_URL, _onFileUploadSuccess, _onFileUploadError, options);
        };

        self = this;
        upload_URL = EC.Upload.getUploadURL();
        is_branch_file = false;

        //set upload URL for this project if not in localStorage yet
        if (!EC.Utils.isChrome() && !upload_URL) {
            $.when(EC.Select.getUploadURL(project_id)).then(function (the_project_url) {
                //enable upload data button
                console.log('Project URL is: ' + the_project_url);
                upload_URL = the_project_url;
                EC.Upload.setUploadURL(the_project_url);
                _doUpload();
            });
        }
        else {
            _doUpload();
        }

    };

    var _onFileUploadSuccess = function (response) {

        console.log(JSON.stringify(response));

        //update flag for this file row to indicate it has been synced to the
        // server
        $.when(EC.Update.flagOneFileAsSynced(_id, is_branch_file)).then(function () {

            //upload another file (if any) of the same media type
            EC.Upload.uploadNextFile(media_type);

        });

    };

    var _onFileUploadError = function (error) {

        console.log(JSON.stringify(error));

        EC.Notification.hideProgressDialog();
        EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('upload_error'));

        EC.Upload.handleMedia();
    };

    return module;

}(EC.File));
