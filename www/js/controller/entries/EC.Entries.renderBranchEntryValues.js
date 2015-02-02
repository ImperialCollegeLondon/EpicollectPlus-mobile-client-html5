/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};

EC.Entries = ( function(module) {
        "use strict";

        var _bindActionBarBtns = function() {

            var back_btn = $("div#branch-entry-values div[data-role='header'] div[data-href='back-btn']");
            var back_btn_label = $("div#branch-entry-values div[data-role='header'] div[data-href='back-btn'] span.form-name");
            var ctx_menu_btn = $("div#branch-entry-values div[data-role='controlgroup'] i[data-href='branch-entry-values-options']");
            var delete_branch_entry_btn = $("div#branch-entry-values div#branch-entry-values-options ul li#delete-branch-entry");
            var entry_value_edit_btn = $('div#branch-entry-values div#branch-entry-values-list ul');
            var form_name = window.localStorage.form_name;
            var branch_form = JSON.parse(window.localStorage.branch_form);
            var project_id = window.localStorage.project_id;
            var unsync_entry_btn = $("div#entry-values div#entry-values-options ul li#unsync-entry");

            back_btn_label.text("Back to " + branch_form.name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + " entries");

            back_btn.off().one('vclick', function(e) {

                //go back to branch entries list
                window.localStorage.removeItem("branch_edit_mode");
                EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
            });

            entry_value_edit_btn.off().on('vclick', "i", function(e) {

                var hash = $(e.target).parent().attr("data-href");

                EC.Notification.showProgressDialog();

                if (hash) {

                    //set edit position
                    window.localStorage.branch_edit_position = parseInt(hash.replace("?position=", ""), 10);

                    //get list of inputs for the branch form and render the first
                    // one on screen
                    EC.BranchInputs.getList(branch_form.name, project_id);

                }

                e.preventDefault();

            });

            delete_branch_entry_btn.off().on('vclick', function(e) {
                EC.Notification.askConfirm(EC.Localise.getTranslation("delete_branch_entry"), EC.Localise.getTranslation("delete_entry_confirm"), "EC.Entries.deleteBranchEntry");
            });

            ctx_menu_btn.off().on('vclick', function(e) {
                $("div#branch-entry-values-options").panel("open");
            });
        };

        /**
         *
         * @param {String} the_hash_to_parse: Query string like
         * "branch_form_name=awesome_form&entry_key=1297f543-fe9e-4c01-e5a0-10512e7968b0"
         */
        module.renderBranchEntryValues = function(the_values) {

            //build HTML
            var HTML = "";
            var i;
            var iLength;
            var values = the_values;
            var branch_inputs_values = [];
            var branch_inputs_trail = [];
            var dom_list = $('div#branch-entry-values-list ul');
            var form_id = parseInt(window.localStorage.form_id, 10);
            var branch_form = JSON.parse(window.localStorage.branch_form);
            var allow_download_edits = window.localStorage.allow_download_edits;
            var project_name = window.localStorage.project_name;
            var data_synced = 0;
            var formatted_location;
            var current_entries_total;
            var totals;
            var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
            var is_primary_key;
            var branch_inputs = EC.BranchInputs.getInputs();
            var labels;
            var dropdown_label;
            var radio_label;

            //bind buttons
            _bindActionBarBtns();

            //empty current list
            dom_list.empty();

            //show branch form name in the top bar
            $('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

            for ( i = 0, iLength = values.length; i < iLength; i++) {

                data_synced += values[i].is_data_synced;

                //check if the current value is a primary key (it is only when
                // entry_key === value)
                is_primary_key = (values[i].value === values[i].entry_key) ? 1 : 0;

                /*
                 * Build input_values array. by default a value is a single value
                 * (string)
                 * Media value is an object which contains the path to the stored
                 * file and the path to the cached file (if any)
                 * Checkbox values are saved as csv, but they are converted back
                 * to array
                 */
                switch(values[i].type) {

                    //Checkbox values are saved as csv values: they are converted
                    // back to array
                    case EC.Const.CHECKBOX:
                        branch_inputs_values.push({
                            _id : values[i]._id,
                            type : values[i].type,
                            value : values[i].value.split(","),
                            position : values[i].position,
                            is_primary_key : is_primary_key
                        });
                        break;

                    //Media files values need to be in the form {cached: "",
                    // stored: <the_filename>}
                    case EC.Const.PHOTO :
                        branch_inputs_values.push({
                            _id : values[i]._id,
                            type : values[i].type,
                            value : {
                                cached : "",
                                stored : values[i].value
                            },
                            position : values[i].position,
                            is_primary_key : is_primary_key
                        });
                        break;

                    //Media files values need to be in the form {cached: "",
                    // stored: <the_filename>}
                    case EC.Const.AUDIO :
                        branch_inputs_values.push({
                            _id : values[i]._id,
                            type : values[i].type,
                            value : {
                                cached : "",
                                stored : values[i].value
                            },
                            position : values[i].position,
                            is_primary_key : is_primary_key
                        });
                        break;

                    //Media files values need to be in the form {cached: "",
                    // stored: <the_filename>}
                    case EC.Const.VIDEO :
                        branch_inputs_values.push({
                            _id : values[i]._id,
                            type : values[i].type,
                            value : {
                                cached : "",
                                stored : values[i].value
                            },
                            position : values[i].position,
                            is_primary_key : is_primary_key
                        });
                        break;

                    default:
                        branch_inputs_values.push({
                            _id : values[i]._id,
                            type : values[i].type,
                            value : values[i].value,
                            position : values[i].position,
                            is_primary_key : is_primary_key
                        });
                }//switch

                //build input_trail array to be used for navigation between
                // inputs (skip _skipp3d_ values, to retain jump sequence)
                if (values[i].value !== EC.Const.SKIPPED) {

                    branch_inputs_trail.push({
                        position : values[i].position,
                        label : values[i].label
                    });

                    //build list of values (_skipp3d_ values are skipped)
                    HTML += '<li data-role="list-divider">';
                    HTML += values[i].label;
                    HTML += '</li>';
                    HTML += '<li class="entry-value-btn-wrapper">';

                    //format media and location values for displaying purposes
                    switch(values[i].type) {

                        //show labels for checkbox choices, as tey are saved as
                        // values
                        case EC.Const.CHECKBOX:

                            labels = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                            HTML += '<span class="h-entry-value-label">' + labels.join(', ') + '</span>';

                            break;

                        case EC.Const.DROPDOWN:

                            dropdown_label = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                            HTML += '<span class="h-entry-value-label">' + dropdown_label + '</span>';

                            break;

                        case EC.Const.RADIO:

                            radio_label = EC.Utils.mapLabelToValue(values[i], branch_inputs);
                            HTML += '<span class="h-entry-value-label">' + radio_label + '</span>';

                            break;

                        case EC.Const.LOCATION:

                            var location = values[i].value;
                            location = location.split(",");

                            var j;
                            var jLength = location.length;

                            for ( j = 0; j < jLength; j++) {

                                HTML += '<span class="h-entry-value-label">' + location[j] + '<span>';

                            }
                            break;

                        case EC.Const.PHOTO:

                            if (values[i].value !== "") {
                                HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_AVAILABLE_LABEL) + '</span>';
                            } else {
                                HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.PHOTO_NOT_AVAILABLE_LABEL) + '</span>';
                            }

                            break;

                        case EC.Const.AUDIO:

                            if (values[i].value !== "") {
                                HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_AVAILABLE_LABEL) + '</span>';
                            } else {
                                HTML += '<span class="h-entry-value-label">' + EC.Localise.getTranslation(EC.Const.AUDIO_NOT_AVAILABLE_LABEL) + '</span>';
                            }

                            break;

                        case EC.Const.VIDEO:

                            if (values[i].value !== "") {
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

                        if (allow_download_edits === "1") {
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

            //add values to localStorage 'branch_inputs_values', to be used to
            // pre-populate fields when editing
            window.localStorage.branch_inputs_values = JSON.stringify(branch_inputs_values);

            //add values to localStorage 'branch_inputs_trail', to navigate back
            // and forth input fields when editing
            window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

            dom_list.append(HTML);
            dom_list.listview('refresh');

            //Set "editing mode" flag for branches
            window.localStorage.branch_edit_mode = 1;

            EC.Notification.hideProgressDialog();

        };

        return module;

    }(EC.Entries));
