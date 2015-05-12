/*global $, jQuery*/
/**
 *
 *
 */
var EC = EC || {};
EC.Settings = EC.Settings || {};
EC.Settings = (function () {
    'use strict';

    var project_server_url;
    var project_server_url_holder;
    var pagination_radio_btns;
    var selected_radio_value;
    var save_btn;
    var back_btn;
    var version_name;
    var version_name_label;
    var project_name;
    var header;
    var enhance_map_checkbox;

    var renderView = function () {

        //set project server url
        project_server_url = window.localStorage.project_server_url;
        project_server_url_holder = $('div#settings').find('div#settings-values').find('input#project-server-url');
        save_btn = $('div#settings div[data-role="header"] div.ui-btn-right[data-href="save-settings"]');
        back_btn = $('div#settings div[data-role="header"] div[data-href="back-btn"]');
        version_name_label = $('div#settings div#settings-values p#version-name span.version');
        pagination_radio_btns = $('form#pagination-options input[type="radio"]');
        enhance_map_checkbox = $('div#settings div#settings-values input#enhanced-location-google-maps');
        project_name = window.localStorage.project_name;
        header = $('div#settings div[data-role="header"] div[data-href="back-btn"] span.project-name');

        //show app version (we use a deferred object as on iOS the version plugins returns a value too late)
        $.when(EC.Utils.getVersionName()).then(function (the_version_name) {
            version_name_label.text(the_version_name);
        });

        project_server_url_holder.val(project_server_url);

        //add project name to header (if a project is actually selected)
        //if we go directly to the settings page without selecting a project first, project name would be undefined
        if (project_name) {
            header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));
        } else {
            header.text(EC.Const.PROJECT_LIST);
        }

        //bind save button
        save_btn.off().one('vclick', function (e) {

            window.localStorage.project_server_url = project_server_url_holder.val();

            window.localStorage.use_enhanced_map = (enhance_map_checkbox.is(':checked')) ? 1 : 0;

            //get the checked pagination radio
            pagination_radio_btns.each(function (index) {

                var checked = $(this).is(':checked');

                if (checked) {
                    console.log($(this).val());
                    window.localStorage.QUERY_LIMIT = $(this).val();
                }

            });

            //show toast on device
            if (!EC.Utils.isChrome()) {
                EC.Notification.showToast(EC.Localise.getTranslation('settings_saved_success'), 'short');
            }

            //go back to previuos page in history
            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            } else {

                //TODO: test this
                //EC.Routing.changePage(EC.Const.INDEX_VIEW);
                window.history.back(-1);
            }

        });

        //bind back button
        back_btn.off().one('vclick', function (e) {

            if (window.localStorage.current_view_url) {
                EC.Routing.changePage(window.localStorage.current_view_url);
            } else {

                //TODO: test this
                //EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
                window.history.back(-1);
            }

        });

        //check (highlight) the radio button based on user preferences
        pagination_radio_btns.each(function (index) {

            if ($(this).val() === window.localStorage.QUERY_LIMIT) {
                $(this).prop('checked', true).checkboxradio('refresh');
            }
        });

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

    };

    return {
        renderView: renderView
    };

}());
