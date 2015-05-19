var EC = EC || {};
EC.Upload = (function (module) {
    'use strict';

    module.project_id = '';
    module.project_name = '';
    module.hierarchy_rows_to_sync = [];
    module.branch_rows_to_sync = [];
    module.main_rows_to_post = [];
    module.main_entries = [];
    module.hierarchy_forms = [];
    module.action = EC.Const.START_HIERARCHY_UPLOAD;
    module.current_entry = {};
    module.current_branch_entry = {};
    module.current_form = {};
    module.current_branch_form = {};
    module.has_branches = false;
    module.audio_synced = '';
    module.photo_synced = '';
    module.video_synced = '';
    module.current_image_file = '';
    module.current_audio_file = '';
    module.current_video_file = '';
    module.upload_data_btn = '';
    module.upload_images_btn = '';
    module.upload_audios_btn = '';
    module.upload_videos_btn = '';
    module.upload_data_feedback = '';
    module.back_btn = '';
    module.all_synced_message = '';

    //cache upload url for the current project in localStorage
    module.setUploadURL = function (the_url) {
        window.localStorage.upload_URL = the_url;
    };

    //get upload URL, when testing on Chrome returns 'test.php'
    module.getUploadURL = function () {
        return (!EC.Utils.isChrome()) ? window.localStorage.upload_URL : 'test.php';
    };
    return module;
}(EC.Upload));
