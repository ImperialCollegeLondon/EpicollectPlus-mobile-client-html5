/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
var EC = EC || {};
EC.Const = EC.Const || {};
//Define constant values to be used across the application
EC.Const = ( function() {
        "use strict";

        return {
            //debug on/off
            DEBUG : 1,

            //platforms
            ANDROID : "Android",
            IOS : "iOS",
            ANDROID_ASSETS_ABS_PATH : "file:///android_asset/www/",
            IOS_ASSETS_ABS_PATH : "Epicollect5-64bit.app/www/",

            //file paths
            ANDROID_APP_PRIVATE_URI : "file:///data/data/uk.ac.imperial.epicollect5",
            IOS_APP_PRIVATE_URI : "", //set at run time, it is the Documents
            // folder

            //input types
            TEXT : "text", //
            TEXTAREA : "textarea",
            INTEGER : "integer",
            DECIMAL : "decimal",
            DATE : "date",
            TIME : "time",
            RADIO : "radio",
            CHECKBOX : "checkbox",
            DROPDOWN : "select",
            BARCODE : "barcode",
            LOCATION : "location",
            AUDIO : "audio",
            VIDEO : "video",
            PHOTO : "photo",
            BRANCH : "branch",
            BRANCH_PREFIX : "branch-",
            //PHOTO_DIR : "/files/images/",
            PHOTO_DIR : "", //defined at run time
            AUDIO_DIR : "", //defined at run time
            VIDEO_DIR : "", //defined at run time
            BRANCH_VIEWS_DIR : "branch_inputs/",
            INPUT_VIEWS_DIR : "inputs/",
            VIEWS_DIR : "views/",
            HTML_FILE_EXT : ".html",
            PHOTO_FILE_EXTENSION : "jpg",

            //transaction callback log
            TRANSACTION_SUCCESS : "TRANSACTION SUCCESS ",
            TRANSACTION_ERROR : "TRANSACTION ERROR ----------------------------------------------------------------**",

            //Model actions
            DELETE : "delete",
            DELETE_SINGLE_ENTRY : "delete_single_entry",
            RESTORE : "restore",
            INSERT : "insert",
            DOWNLOAD : "download",

            //Upload actions
            START_HIERARCHY_UPLOAD : "start_hierarchy_upload",
            STOP_HIERARCHY_UPLOAD : "stop_hierarchy_upload",
            HIERARCHY_RECURSION : "hierarchy_recursion",
            START_BRANCH_UPLOAD : "start_branch_upload",
            STOP_BRANCH_UPLOAD : "stop_branch_upload",
            BRANCH_RECURSION : "branch_recursion",

            //navigation
            ADDING : "adding",
            FORWARD : "forward",
            BACKWARD : "backward",
            EDITING : "editing",
            PREVIOUS : "previous",
            NEXT : "next",
            VIEW : "view",

            //hierarchy views
            INDEX_VIEW : "index.html",
            UPLOAD_VIEW : "upload.html",
            DOWNLOAD_VIEW : "download.html",
            EMAIL_BACKUP_VIEW : "email-backup.html",
            ENTRIES_LIST_VIEW : "entries-list.html",
            SETTINGS_VIEW : "settings.html",
            ADD_PROJECT_VIEW : "add-project.html",
            FORMS_VIEW : "forms.html",
            SAVE_CONFIRM_VIEW : "save-confirm.html",

            //branch views
            BRANCH_ENTRIES_LIST_VIEW : "branch-entries-list.html",
            BRANCH_SAVE_CONFIRM_VIEW : "branch-save-confirm.html",
            BRANCH_FEEDBACK_VIEW : "branch-feedback.html",

            //max length for strings before triggering ellipsis
            PROJECT_NAME_MAX_LENGTH : 22,
            FORM_NAME_MAX_LENGTH : 12,

            //pagination
            ITEMS_PER_PAGE : 20,

            //various
            SET : "1",
            INDEX : "index",
            INPUTS : "inputs",
            PROJECT_LIST : "Project List",
            FORMS : "Forms",
            FILLER : "_fill3r_", //extra element to add to breadcrumb for
            // navigation

            //labels
            NO_OPTION_SELECTED : "select_one_option",
            PHOTO_AVAILABLE_LABEL : "photo_available",
            PHOTO_NOT_AVAILABLE_LABEL : "no_photo",
            AUDIO_AVAILABLE_LABEL : "audio_available",
            AUDIO_NOT_AVAILABLE_LABEL : "no_audio",
            VIDEO_AVAILABLE_LABEL : "video_available",
            VIDEO_NOT_AVAILABLE_LABEL : "no_video",

            //jumps
            JUMP_VALUE_IS : "IS",
            JUMP_VALUE_IS_NOT : "IS NOT",
            JUMP_ALWAYS : "ALL",
            JUMP_FIELD_IS_BLANK : "NULL",
            SKIPPED : "_skipp3d_", //flag to set as a value when an input field
            // is skipped by a jump
            END_OF_FORM : "END",

            // default server
            EPICOLLECT_SERVER_URL : "http://plus.epicollect.net/",
            
            //proxy to load xml in Chrome (CORS)
            PROXY: "http://www.corsproxy.com/plus.epicollect.net/",

            //the length of a cached file <timestamp.extension> (Android)
            CACHED_FILENAME_LENGTH : 17,

            //this is to concatenate the full path of an entry up to its root, to
            // identify immediate parent
            //used for navigation and uniquely identify an entry
            ENTRY_ROOT_PATH_SEPARATOR : "|",

            //Languages
            ENGLISH : "en",
            ITALIAN : "it",

            //minimum Android version NOT to run jsHybugger (regEx) 4.4.*
            PRE_KITKAT_REGEX : /^4.4.\d{1}$/,

            //Lollipop regex
            LOLLIPOP_REGEX : /^5.\d{1}$/

        };
    }());
