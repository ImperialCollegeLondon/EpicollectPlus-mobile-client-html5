/*global $, jQuery, cordova, device*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = (function (module) {
    'use strict';

    /**
     * @method renderEntryValues Render a list of all the values for a single
     * entry
     * @param {the_values} array of values for a single entry (basically a
     * form filled in)
     * { _id: the row id
         *  created_on: timestamp when entry was saved forst time
         *  entry_key: value of primary key
         *  form_id: id of the form
         *  input_id: id of the input
         *  is_data_synced: if the value is data synced
         *  is_media_synced: if the value is media synced
         *  is_title: if this vaue is part of the title
         *  label: label for the field
         *  parent: value of the parent primary key
         *  position: the position of this field in the form fields sequence
         *  ref: the field ref
         *  type: the input type
         *  value: the input value}
     */

    var unsync_entry_btn;
    var wls;
    var _bindActionBarBtns = function () {

        var nav_drawer_btn = $('div#entry-values div[data-role="header"] div[data-href="entry-values-nav-btn"]');
        var home_btn = $('div#entry-values div[data-role="header"] div[data-href="home"]');
        var settings_btn = $('div#entry-values div[data-role="header"] div#entry-values-nav-drawer ul li div[data-href="settings"]');
        var ctx_menu_btn = $('div#entry-values div[data-role="header"] div.ui-btn-right[data-href="entry-values-options"]');
        var delete_entry_btn = $('div#entry-values div.entry-values-options ul li#delete-entry');
        var inactive_tab = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var entry_value_btn = $('div#entry-values div#entry-values-list ul');
        var input_page_href = window.localStorage.input_page_href;

        //get hold of unsync button
        unsync_entry_btn = $('div#entry-values div.entry-values-options ul li#unsync-entry');

        //bind left sidebar open/close
        nav_drawer_btn.off().on('vclick', function (e) {

            var panel = $('#entry-values-nav-drawer');

            panel.panel('open');

            home_btn.off().one('vclick', function (e) {

                //trigger a pgae refresh when navigating back to project list
                wls.back_nav_url = '#refresh';
                EC.Routing.changePage(EC.Const.INDEX_VIEW);
            });

            // //bind add project button (action bar)
            settings_btn.off().one('vclick', function (e) {
                window.localStorage.reached_settings_view_from = $.mobile.activePage.attr('id');
                EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
            });

            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });

        });

        inactive_tab.off().on('vclick', function (e) {
            //get url from data-hef attribute
            var page = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');
            EC.Routing.changePage(page);

            //window.history.back(-1);

        });

        entry_value_btn.off().on('vclick', 'i', function (e) {

            var hash = $(e.target).parent().attr('data-href');
            var edit_position = parseInt(hash.replace('?position=', ''), 10);

            window.localStorage.edit_position = edit_position;
            window.localStorage.edit_mode = 1;

            //cache back_nav_hash, to be used for navigate back after an edit
            // action
            window.localStorage.back_nav_url = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr('data-href');

            //open inputs page at the right input position
            EC.Entries.addEntry();

            e.preventDefault();

        });

        //attach event to context menu to button unsync this entry
        unsync_entry_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('unsync_entry'), EC.Localise.getTranslation('unsync_entry_confirm'), 'EC.Entries.unsyncEntry');
        });

        delete_entry_btn.off().on('vclick', function (e) {
            EC.Notification.askConfirm(EC.Localise.getTranslation('delete_entry'), EC.Localise.getTranslation('delete_entry_with_children_confirm'), 'EC.Entries.deleteEntry');
        });

        ctx_menu_btn.off().on('vclick', function (e) {

            var panel = $('.entry-values-options');

            panel.panel('open');


            //Closing panel globally: there is bug (panel does not close tapping off the panel) using the built in jqm methods, so this hack is needed
            //docs: http://demos.jquerymobile.com/1.3.2/widgets/panels/
            $('.ui-panel-dismiss-open').off().on('vclick', function () {
                panel.panel('close');
            });
        });
    };

    module.renderEntryValues = function (the_values) {

        //build HTML
        var HTML = '';
        var back_href;
        var back_children;
        var i;
        var iLength;
        var values = the_values;
        var inputs_values = [];
        var inputs_trail = [];
        var dom_list = $('div#entry-values-list ul');
        var page = $('#entry-values');
        var header = $('div#entry-values div[data-role="header"] div[data-href="entry-values-nav-btn"] span.project-name');
        var active_key = '';
        var entry_key = window.localStorage.entry_key;
        var active_tab_label = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
        var inactive_tab = $('div#entry-value div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
        var inactive_tab_hash = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
        var inactive_tab_label = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
        var form_id = parseInt(window.localStorage.form_id, 10);
        var form_name = window.localStorage.form_name;
        var form_tree = JSON.parse(window.localStorage.form_tree);
        var trail;
        var allow_download_edits = window.localStorage.allow_download_edits;
        var project_name = window.localStorage.project_name;
        var data_synced = 0;
        var formatted_location;
        var current_entries_total;
        var totals;
        var branch_values;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);
        var is_primary_key;
        var inputs = EC.Inputs.getInputs();
        var labels;
        var dropdown_label;
        var radio_label;

        wls = window.localStorage;

        //bind buttons
        _bindActionBarBtns();

        //Add selected entry key value as the active key (it is the default if no title specified)
        active_key = entry_key;

        //empty current list
        dom_list.empty();

        for (i = 0, iLength = values.length; i < iLength; i++) {

            data_synced += values[i].is_data_synced;

            //check if the current value is a primary key (it is onlt when
            // entry_key === value)
            is_primary_key = (values[i].value === values[i].entry_key) ? 1 : 0;


            //do we have at least a title field? If so, show the first title field value as active key
            if (parseInt(values[i].is_title, 10) === 1 && active_key === entry_key) {
                active_key = values[i].value;
            }

            /*
             * Build input_values array. by default a value is a single value
             * (string)
             * Media value is an object which contains the path to the stored
             * file and the path to the cached file (if any)
             * Checkbox values are saved as csv, but they are converted back
             * to array
             * Branch values represent the branch form name and its total of
             * entries
             */
            switch (values[i].type) {

                //Checkbox values are saved as csv values: they are converted
                // back to array
                case EC.Const.CHECKBOX:
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value.split(','),
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.PHOTO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.AUDIO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                //Media files values need to be in the form {cached: '',
                // stored: <the_filename>}
                case EC.Const.VIDEO :
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            cached: '',
                            stored: values[i].value
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
                    break;

                case EC.Const.BRANCH:

                    branch_values = values[i].value.split(',');
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: {
                            branch_form_name: branch_values[0],
                            branch_total_entries: parseInt(branch_values[1], 10)
                        },
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });

                    break;

                default:
                    inputs_values.push({
                        _id: values[i]._id,
                        type: values[i].type,
                        value: values[i].value,
                        position: values[i].position,
                        is_primary_key: is_primary_key
                    });
            }//switch

            /* build input_trail array to be used for navigation between
             * inputs be aware that:
             *
             * - _skipp3d_ values are skipped, to retain jump sequence when
             * listing values
             * - if is_genkey_hidden is set to 1 and the value is a primary
             * key, do not show it
             *  (values[i].value === values[i].entry_key) i strue only if
             * that value is the the primary key
             */

            if (values[i].value !== EC.Const.SKIPPED && !(is_genkey_hidden === 1 && values[i].value === values[i].entry_key)) {

                inputs_trail.push({
                    position: values[i].position,
                    label: values[i].label
                });

                //build list of values (_skipp3d_ values are skipped)
                HTML += '<li data-role="list-divider">';
                HTML += values[i].label;
                HTML += '</li>';
                HTML += '<li class="entry-value-btn-wrapper">';

                //format media and location values for displaying purposes
                switch (values[i].type) {

                    //show labels for checkbox choices, as tey are saved as
                    // values
                    case EC.Const.CHECKBOX:

                        console.log('CHECKBOX');
                        console.log(values[i]);

                        labels = EC.Utils.mapLabelToValue(values[i], inputs);
                        HTML += '<span class="h-entry-value-label">' + labels.join(', ') + '</span>';

                        break;

                    case EC.Const.DROPDOWN:

                        console.log('DROPDOWN');
                        console.log(values[i]);

                        if (values[i].value !== '0') {
                            dropdown_label = EC.Utils.mapLabelToValue(values[i], inputs);
                        }
                        else {
                            dropdown_label = '';
                        }

                        HTML += '<span class="h-entry-value-label">' + dropdown_label + '</span>';

                        break;

                    case EC.Const.RADIO:

                        console.log('RADIO');
                        console.log(values[i]);

                        if (values[i].value !== '') {
                            radio_label = EC.Utils.mapLabelToValue(values[i], inputs);
                        }
                        else {
                            radio_label = '';
                        }


                        HTML += '<span class="h-entry-value-label">' + radio_label + '</span>';

                        break;

                    case EC.Const.LOCATION:

                        var location = values[i].value;
                        location = location.split(',');

                        var j;
                        var jLength = location.length;

                        for (j = 0; j < jLength; j++) {

                            HTML += '<span class="h-entry-value-label">' + location[j] + '<span>';

                        }
                        break;

                    case EC.Const.BRANCH:

                        //show branch form mane and total of entries (we set
                        // the branch_values array earlier)
                        HTML += '<span class="h-entry-value-label">' + branch_values[0] + '<br/>(' + branch_values[1] + ')' + '</span>';

                        break;

                    case EC.Const.PHOTO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.AUDIO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    case EC.Const.VIDEO:

                        if (values[i].value !== '') {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_AVAILABLE_LABEL) + '</span>';
                        } else {
                            HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.VIDEO_NOT_AVAILABLE_LABEL) + '</span>';
                        }

                        break;

                    default:
                        HTML += '<span class="h-entry-value-label">' + values[i].value + '</span>';

                }

                HTML += '<div class="entry-value-embedded-btn" data-href="?position=' + values[i].position + '">';

                //deal with remote entries and disable edit button if no
                // editable
                if (values[i].is_remote === 1) {

                    if (allow_download_edits === '1') {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                    } else {
                        HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn ui-disabled"></i>';
                    }

                } else {
                    HTML += '<i class="fa fa-edit  fa-fw fa-ep-entry-value-embedded-btn"></i>';
                }

                HTML += '</div>';
                HTML += '</li>';

            }//if NOT skipped

        }//for

        //add values to localStorage 'inputs_values', to be used to
        // pre-populate fields when editing
        window.localStorage.inputs_values = JSON.stringify(inputs_values);

        //add values to localStorage 'inputs_trail', to navigate back and
        // forth input fields when editing
        window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

        //add project name to header (top left)
        header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

        /*
         * Build back button behaviour:
         */

        //check if this form is at the top of the tree so the back button
        // will go back to the form page (#forms)
        if (form_tree.parent === 0) {
            entry_key = '';
        } else {

            //this is a nested form, so we need to go back to the previous
            // form in the stack based on what entry was selected
            trail = JSON.parse(window.localStorage.breadcrumbs);

            entry_key = trail[trail.length - 2];

            //window.localStorage.breadcrumbs = JSON.stringify(trail);
        }

        //request pagination when going back to entries list
        totals = JSON.parse(window.localStorage.entries_totals);
        back_children = totals[totals.length - 1].entries_total;

        /*set hash to be used to list this entries when loading index.html
         * going back
         The direction will be VIEW as we are viewing(listing) the current
         form entries */
        back_href = '';
        back_href += 'entries-list.html?form=' + form_id;
        back_href += '&name=' + form_name;
        back_href += '&entry_key=' + entry_key;
        back_href += '&direction=' + EC.Const.VIEW;
        back_href += '&children=' + back_children;

        if (data_synced > 0) {
            //enable unsync-data button
            unsync_entry_btn.removeClass('ui-disabled');
        } else {
            //disable unsync-data button
            unsync_entry_btn.addClass('ui-disabled');
        }

        //update active tab name with the current active form
        active_tab_label.text(active_key);

        //update inactive tab with back navigation href
        inactive_tab_label.text(form_name);
        inactive_tab_hash.attr('data-href', back_href);

        //console.log(HTML);
        dom_list.append(HTML);

        //build page and refresh listview
        page.page();
        dom_list.listview('refresh');

        //set a flag as any time we go back from entry value list page we
        // need to show the list of entries for the previous selected entry
        //if entry_key is undefined, it is because we are coming back from a
        // 'Store Edit' action
        if (entry_key !== undefined) {
            window.localStorage.back_nav_url = back_href;
        }

        //Set 'editing mode' flag
        window.localStorage.edit_mode = 1;

        EC.Notification.hideProgressDialog();
    };

    return module;

}(EC.Entries));
