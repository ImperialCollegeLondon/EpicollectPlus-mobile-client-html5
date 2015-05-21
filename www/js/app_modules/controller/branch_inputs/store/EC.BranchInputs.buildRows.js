var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    module.buildRows = function (the_filenameToTimestamp) {

        var self = this;
        var i;
        var branch_input;
        var value_obj;
        var value;
        var _id;
        var ref;
        var rows = [];
        var iLength = EC.BranchInputs.branch_inputs.length;
        var key_position = EC.BranchInputs.getPrimaryKeyRefPosition();
        var hierarchy_key_position = EC.Inputs.getPrimaryKeyRefPosition();
        var parts;
        var filename;
        var filename_parts;
        var extension;
        var form_name = window.localStorage.form_name;
        var uuid = EC.Utils.getPhoneUUID();
        var form_id = window.localStorage.form_id;
        var created_on = EC.Utils.getTimestamp();
        var branch_form_name = window.localStorage.branch_form_name;
        var ios_filenames = the_filenameToTimestamp;
        var timestamp;

        //get parent key value for the current branch form
        var current_branch_input_position = parseInt(window.localStorage.branch_current_position, 10);

        //get value of primary key for this branchform
        var key_value = EC.BranchInputs.getCachedInputValue(key_position).value;

        /* Get key and value of primary key for the hierarchy entry of this branch form.
         * The hierarchy key value is the one cached, if the user edits it before saving the entry, it will need to be updated in the database
         * or lock the editing after inserting a branch form.
         */
        var hierarchy_entry_key_value = EC.Inputs.getCachedInputValue(hierarchy_key_position).value;
        var hierarchy_entry_key_ref = EC.Utils.getFormPrimaryKeyRef(form_id);

        //build rows to be saved - the text value for each input is saved in an array with corresponding indexes
        for (i = 0; i < iLength; i++) {

            //get current value
            branch_input = EC.BranchInputs.branch_inputs[i];
            value_obj = EC.BranchInputs.getCachedInputValue(branch_input.position);

            //save cached value OR '' when the value cannot be found
            value = value_obj.value || '';

            //_id is set only when we are editing, it is the _id of the current row in the database which will be updated
            _id = value_obj._id;

            //deal with media types to save the correct value (full path uri)
            if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.VIDEO || branch_input.type === EC.Const.AUDIO) {

                //check whether the value is defined as media value {stored: '<path>', cached: '<path>'}
                if (value.hasOwnProperty('stored')) {

                    if (value.stored === '') {

                        //we are saving a new media file path from the cached one (or an empty string if the file field was optional)
                        if (value.cached !== '') {

                            //build file name (in the format <form_name>_<ref>_<uuid>_filename) with the cached value
                            //Cordova Camera API unfortunately returns the timestamp as a file name on Android only, on iOS a smart guy decided to use the same file name with an incremental index (lol)

                            parts = value.cached.split('/');
                            filename = parts[parts.length - 1];

                            switch (window.device.platform) {

                                case EC.Const.ANDROID:
                                    //do nothing
                                    break;
                                case EC.Const.IOS:

                                    //replace filename with <timestamp>.jpg as on IOS the Camera, Audio and Video capture is inconsistent and returns weird file names
                                    //not always the timestamp. We want to save the files using the timestamp as we do on Android (and following Epicollect+ filename schema)
                                    if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.AUDIO || branch_input.type === EC.Const.VIDEO) {

                                        //get linked timestamp as we save the file using the timestamp as the file name
                                        filename_parts = filename.split('.');
                                        extension = filename_parts[filename_parts.length - 1];

                                        timestamp = EC.Utils.getIOSFilename(ios_filenames, filename);
                                        filename = timestamp + '.' + extension;
                                    }

                                    break;

                            }

                            value = form_name + '_' + branch_input.ref + '_' + uuid + '_' + filename;
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

            rows.push({
                _id: _id, //this is set only when we are editing
                input_id: branch_input._id,
                form_id: branch_input.form_id,
                position: branch_input.position,
                hierarchy_entry_key_value: hierarchy_entry_key_value,
                hierarchy_entry_key_ref: hierarchy_entry_key_ref,
                label: branch_input.label,
                value: value,
                ref: branch_input.ref,
                is_title: branch_input.is_title,
                entry_key: key_value,
                type: branch_input.type,
                is_data_synced: 0,
                is_media_synced: 0,
                is_remote: 0,
                created_on: created_on
            });

        }//for each input

        //EC.Notification.showProgressDialog();

        console.log('rows');
        console.log(JSON.stringify(rows));

        //save/update values to database
        if (window.localStorage.branch_edit_mode) {

            $.when(EC.Update.commitBranchForm(rows)).then(function () {

                window.localStorage.branch_edit_hash = '#entries?form=' + form_id + '&name=' + form_name + '&entry_key=&direction=' + EC.Const.EDITING;

                //set selected key value in localStorage to show list of values later
                window.localStorage.branch_edit_key_value = key_value;

                //redirect to branch entries list page with positive flag
                EC.BranchInputs.renderStoreEditFeedback(true);

            }, function () {
                EC.BranchInputs.renderStoreEditFeedback(false);
            });

        } else {

            $.when(EC.Create.insertBranchFormValues(rows, key_value, hierarchy_entry_key_value)).then(function (entry_key) {
                EC.BranchInputs.prepareFeedback(true, entry_key);
            }, function () {
                EC.BranchInputs.prepareFeedback(false, null);
            });
        }

    };

    return module;

}(EC.BranchInputs));

