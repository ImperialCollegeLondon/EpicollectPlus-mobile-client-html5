var EC = EC || {};
EC.Forms = EC.Forms || {};
EC.Forms = (function (module) {
    'use strict';

    var _bindActionBarBtns = function () {

        var home_btn = $('div#forms div[data-role="header"] div[data-href="home"]');
        var nav_drawer_btn = $('div#forms div[data-role="header"] div[data-href="form-nav-btn"]');
        var upload_btn = $('div#forms  div[data-role="header"] div.ui-btn-right[data-href="upload"]');
        var ctx_menu_btn = $('div#forms div[data-role="header"] div.ui-btn-right[data-href="project-options"]');
        var inactive_tab = $('div#forms div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var settings_btn = $('div#forms div[data-role="header"] div#form-nav-drawer ul li div[data-href="settings"]');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $('#form-nav-drawer');

            panel.panel('open');

            home_btn.off().one('vclick', function (e) {
                //reload index page TODO: try a better way: if the page is in the dom do not reload: History API
                window.localStorage.back_nav_url = '#refresh';
                EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        upload_btn.off().one('vclick', function (e) {
            EC.Routing.changePage(EC.Const.UPLOAD_VIEW);
        });

        ctx_menu_btn.off().on('vclick', function () {
            $('.project-options-panel').panel('open');

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                $('.project-options-panel').panel('close');
            });
        });

        inactive_tab.off().one('vclick', function (e) {

            //reload index page TODO: try a better way: if the page is in the dom do not reload: History API
            window.localStorage.back_nav_url = '#refresh';
            EC.Routing.changePage(EC.Const.INDEX_VIEW, '../');
        });
    };

    module.renderList = function (the_forms, the_button_states) {

        //build HTML
        var HTML = '';
        var i;
        var iLength;
        var forms = the_forms;
        var dom_list = $('div#forms-list ul');
        var page = $('#forms');
        var header = $('div#forms div[data-role="header"] div[data-href="form-nav-btn"] span.project-name');
        var navbar_label = $('a.ui-btn-active span.ui-btn-inner');
        var email_backup_btn = $('div#forms div#project-options ul li#email-backup');
        var download_remote_data_btn = $('div#forms div#project-options ul li#download-remote-data');
        var unsync_all_entries_btn = $('div#forms div#project-options ul li#unsync-all-data');
        var delete_project_btn = $('div#forms div#project-options ul li#delete-project');
        var delete_all_entries_btn = $('div#forms div#project-options ul li#delete-all-entries');
        var delete_synced_entries_btn = $('div#forms div#project-options ul li#delete-synced-entries');
        var delete_media_files_btn = $('div#forms div#project-options ul li#delete-media-files');
        var backup_project_data_btn = $('div#forms div#project-options ul li#backup-project-data');
        var restore_from_backup_btn = $('div#forms div#project-options ul li#restore-data-from-backup');
        var export_data_to_csv_btn = $('div#forms div#project-options ul li#export-project-data-to-csv');
        var btn_states = the_button_states;
        var has_backup = window.localStorage.has_backup;
        var project_name = window.localStorage.project_name;

        //bind action bar buttons for this page
        _bindActionBarBtns();

        dom_list.empty();

        for (i = 0, iLength = forms.length; i < iLength; i++) {

            //if no entries for a form yet, disable the entry (aside from the top one) and hide icon
            if (i > 0 && parseInt(forms[i].entries, 10) === 0) {

                HTML += '<li data-icon="false">';
                HTML += '<a href="entries-list.html?form=' + forms[i]._id + '&name=' + forms[i].name + '&entry_key=&direction=forward" class="ui-disabled">' + forms[i].name;
                HTML += '<p>' + forms[i].total_inputs + EC.Localise.getTranslation('questions') + '</p>';
                HTML += '</a>';
                HTML += '</li>';

            } else {

                //render an active button
                HTML += '<li data-icon="ep-next-page">';
                HTML += '<a href="entries-list.html?form=' + forms[i]._id + '&name=' + forms[i].name + '&entry_key=&direction=forward&children=' + forms[i].entries + '">' + forms[i].name;
                HTML += '<span class="ui-li-count">' + forms[i].entries;
                HTML += '</span>';
                HTML += '<p>' + forms[i].total_inputs + EC.Localise.getTranslation('questions') + '</p>';
                HTML += '</a>';
                HTML += '</li>';
            }
        }

        //reset title in navbar
        navbar_label.text(EC.Const.FORMS);

        //add project name to header
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        dom_list.append(HTML);

        //page.page();

        dom_list.listview('refresh');

        //make this the current page
        //$.mobile.changePage(page);

        //init global forms object
        EC.Utils.setForms(forms);

        //remove form details from localStorage if any
        window.localStorage.form_name = '';
        window.localStorage.form_id = '';
        window.localStorage.removeItem('primary_keys');
        window.localStorage.removeItem('parent_path');

        email_backup_btn.off().on('vclick', function (e) {
            EC.Routing.changePage(EC.Const.EMAIL_BACKUP_VIEW);
        });

        download_remote_data_btn.off().on('vclick', function (e) {
            EC.Routing.changePage(EC.Const.DOWNLOAD_VIEW);
        });

        //attach event to context menu to button unsync all synced entries. Toggle button state accordingly
        if (btn_states.unsync_all_data === 0) {
            unsync_all_entries_btn.addClass('ui-disabled');
        } else {
            unsync_all_entries_btn.removeClass('ui-disabled');
        }
        unsync_all_entries_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('unsync_all_data'), EC.Localise.getTranslation('unsync_all_data'), 'EC.Entries.unsyncAllEntries');
        });

        //handler to delete project
        delete_project_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_project'), EC.Localise.getTranslation('delete_project_confirm'), 'EC.Project.deleteProject');
        });

        //handler to delete/save all entries (if any, otherwise show as disabled)
        if (btn_states.delete_all_entries === 0) {
            delete_all_entries_btn.addClass('ui-disabled');
            export_data_to_csv_btn.addClass('ui-disabled');
        } else {
            delete_all_entries_btn.removeClass('ui-disabled');
            export_data_to_csv_btn.removeClass('ui-disabled');
        }
        delete_all_entries_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_entries'), EC.Localise.getTranslation('delete_all_entries_confirm'), 'EC.Entries.deleteAllEntries');

        });

        export_data_to_csv_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('export_all_entries_to_csv'), EC.Localise.getTranslation('export_all_entries_to_csv_confirm'), 'EC.Entries.exportAllEntriesToCSV');
        });

        //handler to delete all the media files for this project (if any, otherwise disable)
        if (btn_states.delete_media_files === 0) {
            delete_media_files_btn.addClass('ui-disabled');
        } else {
            delete_media_files_btn.removeClass('ui-disabled');
        }
        delete_media_files_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_media'), EC.Localise.getTranslation('delete_all_media_confirm'), 'EC.Entries.deleteAllMedia');

        });

        //handler to delete all the synced entries for this project (if any, otherwise disable button)
        if (btn_states.delete_synced_entries === 0) {
            delete_synced_entries_btn.addClass('ui-disabled');
        } else {
            delete_synced_entries_btn.removeClass('ui-disabled');
        }
        delete_synced_entries_btn.off().on('vclick', function (e) {

            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_all_synced'), EC.Localise.getTranslation('delete_all_synced_confirm'), 'EC.Entries.deleteAllSynced');

        });

        //if there are any entries to backup, enable button
        if (btn_states.delete_all_entries === 0) {
            backup_project_data_btn.addClass('ui-disabled');
        } else {
            backup_project_data_btn.removeClass('ui-disabled');
        }

        backup_project_data_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('backup_data'), EC.Localise.getTranslation('backup_data_confirm'), 'EC.Project.backupCurrentProject');
        });

        //enable -restore from backup- and -mail backup- buttons only if a backup file exists
        if (has_backup) {
            restore_from_backup_btn.removeClass('ui-disabled');
            email_backup_btn.removeClass('ui-disabled');
        } else {
            restore_from_backup_btn.addClass('ui-disabled');
            email_backup_btn.addClass('ui-disabled');
        }

        restore_from_backup_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('restore_data'), EC.Localise.getTranslation('restore_data_confirm'), 'EC.Project.restoreFromBackup');
        });

        //hide restore backup buttons on IOS as redundant (backups on device are managed via iTunes)
        //we still mail backups in some situations where it is not possible to upload data via wifi or mobile network
        if (window.device.platform === EC.Const.IOS) {

            restore_from_backup_btn.addClass('not-shown');
            //email_backup_btn.addClass('not-shown');
            //backup_project_data_btn.addClass('not-shown');
        }

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        EC.Notification.hideProgressDialog();

    };

    return module;

}(EC.Forms));
