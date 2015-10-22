/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.buildRows = function (the_filenameToTimestamp) {

        

        var self = this;
        var i;
        var input;
        var value_obj;
        var value;
        var _id;
        var ref;
        var rows = [];
        var iLength = EC.Inputs.inputs.length;
        var key_position = EC.Inputs.getPrimaryKeyRefPosition();
        var parts;
        var filename;
        var filename_parts;
        var extension;
        var form_name = window.localStorage.form_name;
        var uuid = EC.Utils.getPhoneUUID();
        var form_id = window.localStorage.form_id;
        var created_on = EC.Utils.getTimestamp();
        var ios_filenames = the_filenameToTimestamp;
        var timestamp;

        //get parent key value for the current form
        var current_input_position = parseInt(window.localStorage.current_position, 10);
        var breadcrumb_trail = JSON.parse(window.localStorage.getItem('breadcrumbs'));
        var parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];

        //save full breadcrumbs as path to parent node (node tree representation using adjacent list)
        var parent_path = (breadcrumb_trail[0] === '') ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

        //get value of primary key for this form
        var key_value = EC.Inputs.getCachedInputValue(key_position).value;

        var branch_entries;

        //build rows to be saved - the text value for each input is saved in an array with corresponding indexes
        for (i = 0; i < iLength; i++) {

            //get current value details
            input = EC.Inputs.inputs[i];
            value_obj = self.getCachedInputValue(input.position);

            //save cached value OR '' when input_values not found...that should never happen?
            value = value_obj.value || '';

            //_id is set only when we are editing, it is the _id of the current row in the database which will be updated
            _id = value_obj._id;

            //deal with media types to save the correct value (full path uri)
            if (input.type === EC.Const.PHOTO || input.type === EC.Const.VIDEO || input.type === EC.Const.AUDIO) {

                //check whether the value is defined as media value {stored: '<path>', cached: '<path>'}
                if (value.hasOwnProperty('stored')) {

                    if (value.stored === '') {

                        //we are saving a new media file path from the cached one (or an empty string if the file field was optional)
                        if (value.cached !== '') {

                            //build file name (in the format <form_name>_<ref>_<uuid>_filename) with the cached value (Android) or the timestamp (iOS)
                            //Cordova Camera API unfortunately returns the timestamp as a file name on Android only, on iOS some smart guy decided to use the same file name with an incremental index (lol)
                            parts = value.cached.split('/');
                            filename = parts[parts.length - 1];

                            switch (window.device.platform) {

                                case EC.Const.ANDROID:
                                    //do nothing
                                    break;
                                case EC.Const.IOS:

                                    //replace filename with <timestamp>.jpg as on IOS the Camera, Audio and Video capture is inconsistent and returns weird file names
                                    //not always the timestamp. We want to save the files using the timestamp as we do on Android (and following Epicollect+ filename schema)
                                    if (input.type === EC.Const.PHOTO || input.type === EC.Const.AUDIO || input.type === EC.Const.VIDEO) {

                                        //get linked timestamp as we save the file using the timestamp as the file name
                                        filename_parts = filename.split('.');
                                        extension = filename_parts[filename_parts.length - 1];

                                        timestamp = EC.Utils.getIOSFilename(ios_filenames, filename);
                                        filename = timestamp + '.' + extension;
                                    }

                                    break;

                            }

                            value = form_name + '_' + input.ref + '_' + uuid + '_' + filename;

                        } else {

                            value = '';
                        }

                    } else {

                        //use the existing stored path
                        value = value.stored;
                    }
                } else {
                    //value was not defined as media value: use case when user leaves a form halfway through but still wants to save. Save an empty object then
                    value = '';
                }

            }

            //deal with branch type to save the value ({branch_form_name, total_of_entries}) in the correct format
            if (input.type === EC.Const.BRANCH) {

                //check if the branch input was skipped (by jumps or exiting a form earlier)

                if (value === EC.Const.SKIPPED) {

                    value = input.branch_form_name + ',0';

                } else {
                    //get branch form name and total of entries and save them as csv (cannot save JSON.stringify(obj) due to quotes, balls!)
                    value = value.branch_form_name + ',' + value.branch_total_entries;
                }

            }

            //dropdown/radio values
            if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO) {

                //if the input was NOT skipped, save the value or '' when no option was selected in the dropdown
                if (value !== EC.Const.SKIPPED) {

                    //if the label is the select placeholder OR the value was skipped, save an empty value
                    if (value === EC.Const.NO_OPTION_SELECTED) {
                        value = '';
                    }
                }
            }

            //checkbox values we save all the value  as csv
            if (input.type === EC.Const.CHECKBOX) {

                //if the input was NOT skipped, save the value or '' when no option was selected in the checkboxes list
                if (value !== EC.Const.SKIPPED) {
                    //TODO: if the label is the select placeholder OR the value was skipped, save an empty value does it happen this is an empty array?
                    if (value === EC.Const.NO_OPTION_SELECTED) {
                        value = '';
                    } else {
                        value = value.join(', ');
                    }
                }
            }

            //deal with group, save all the group inputs answers (array) as a json object. Quick to do it, we added groups too late to the party ;)
            if (input.type === EC.Const.GROUP) {


                //for a group, value will always be an array of values
                //todo deal with _skipp3d_ group, but are we allowing this?
                value = JSON.stringify(value);

                console.log(value);
                console.log(input.label);
                console.log(input.ref);

            }

            rows.push({
                _id: _id, //this is set only when we are editing
                input_id: input._id,
                form_id: input.form_id,
                position: input.position,
                parent: parent_path,
                label: input.label,
                value: value,
                ref: input.ref,
                is_title: input.is_title,
                entry_key: key_value,
                type: input.type,
                is_data_synced: 0,
                is_media_synced: 0,
                is_remote: 0,
                created_on: created_on
            });

        }//for each input


        console.log('rows: ' + JSON.stringify(rows));

        //save/update values to database
        if (window.localStorage.edit_mode) {

            $.when(EC.Update.updateHierarchyEntryValues(rows)).then(function () {

                //TODO: check this
                //set selected key value in localStorage to show list of values later
                //window.localStorage.entry_key = key_value;

                //check if we came to the editing from a child form list or selecting the top form and going through the whole sequence
                if (window.localStorage.is_child_form_nav) {

                    //TODO

                } else {
                    window.localStorage.back_nav_url = window.localStorage.back_edit_nav_url;
                }

                //if it is a nested form, keep track of its parent and save it in localStorage
                if (key_value !== parent_path) {

                    var parent_path_array = parent_path.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
                    parent_path_array.pop();
                    window.localStorage.parent_path = parent_path_array.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
                }

                EC.Inputs.renderStoreEditFeedback(true);
            }, function () {
                EC.Inputs.renderStoreEditFeedback(false);
            });

        } else {
            //insert form values, on success/fail show feedback
            $.when(EC.Create.insertFormValues(rows, key_value)).then(function (main_form_entry_key) {
                EC.Inputs.prepareFeedback(true, main_form_entry_key);
            }, function () {
                EC.Inputs.prepareFeedback(false, null);
            });
        }
    };

    return module;

}(EC.Inputs));
