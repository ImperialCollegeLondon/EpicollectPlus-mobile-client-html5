/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Forms = EC.Forms || {};
EC.Forms = ( function (module) {
    "use strict";

    module.getList = function (the_hash_to_parse) {

        //get the requested form parsing the href
        var hash = the_hash_to_parse.split('?');
        var params = hash[1].split('&');
        var project_id = params[0].replace("project=", "");
        var project_name = params[1].replace("name=", "");
        var wls = window.localStorage;
        var current_view_url_parts;

        //cache current page url for navigation purposes
        current_view_url_parts = the_hash_to_parse.split("/");
        wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

        //set project 'id' and 'name' in localStorage for navigation
        wls.project_id = project_id;
        wls.project_name = project_name;

        //check if this project has a backup file saved and set result in localStorage (device only)
        if (!EC.Utils.isChrome()) {
            $.when(EC.File.hasBackup(project_name)).then(function () {
                wls.has_backup = 1;
            }, function () {
                wls.removeItem("has_backup");
            });
        }

        //set allow_download_edits flag in LocalStorage
        $.when(EC.Select.getAllowDownloadEdits(project_id)).then(function () {
            wls.allow_download_edits = 1;
        }, function () {
            wls.allow_download_edits = 0;
        });

        //show forms list
        $.when(EC.Select.getForms(project_id)).then(function (the_forms, the_btn_states) {

            //reset offset for entries pagination
            wls.QUERY_ENTRIES_OFFSET = 0;
            wls.QUERY_CHILD_ENTRIES_OFFSET = 0;
            wls.QUERY_PARENT_ENTRIES_OFFSET = 0;

            //reset other flags for pagination
            wls.removeItem("last_parent");
            wls.removeItem("entry_key");
            wls.removeItem("form_has_jumps");
            wls.removeItem("load_more_parameters");
            wls.removeItem("current_position");

            //remove child form navigation flag
            wls.removeItem("is_child_form_nav");

            //remove flag that disable store edit from an intermediate screen
            wls.removeItem("has_new_jump_sequence");

            //reset navigation TODO: check this, experimental
            wls.removeItem("back_nav_url");

            //TODO: to be tested:
            //remove cached entries
            wls.removeItem("cached_entries_list");

            wls.removeItem("previous_tapped_entry_Y");


            EC.Forms.renderList(the_forms, the_btn_states);
        });

    };

    return module;
}(EC.Forms));
