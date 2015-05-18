/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var self;
    var project_id;
    var form;
    var entry;
    var entry_key;
    var deferred;
    var hierarchy_entry_values;
    var all_data_synced_on_start = false;

    /**
     * @method _getParentRef
     * @param {String} the_child_form_name
     *
     * Passing a form name, get the parent ref and its value. It will be used to link the child to its parent on the server
     *
     * When passing the top form, false is returned which means no parent for the current form
     */
    var _getParentRef = function (the_form_name) {

        var i;
        var name = the_form_name;
        var forms = JSON.parse(window.localStorage.forms);
        var iLength = forms.length;

        //check children only (skip first element, the top form)
        for (i = 1; i < iLength; i++) {

            if (forms[i].name === name) {

                return forms[i - 1].key;
            }

        }

        return false;

    };

    /**
     *  @method _getOneEntryKeyTX Execute a query to get a single entry_key  NOT synced
     */
    var _getOneEntryKeyTX = function (tx) {

        //select a single entry key
        var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=? AND is_data_synced=? LIMIT 1';

        tx.executeSql(query, [form._id, 0], _getOneEntryKeySQLSuccess, EC.Select.errorCB);

    };

    var _getOneEntryKeySQLSuccess = function (the_tx, the_result) {

        var iLength = the_result.rows.length;
        var project_id = parseInt(window.localStorage.project_id, 10);

        //if a entry_key is found
        if (iLength > 0) {

            //get all rows for this entry key
            entry_key = the_result.rows.item(0).entry_key;
            hierarchy_entry_values = [];

            //get all the values for the hierarchy entry key found
            EC.db.transaction(_getOneHierarchyEntryTX, EC.Select.errorCB, _getOneHierarchyEntrySuccessCB);

        } else {

            //no entries for this form  to upload, try next form (child) if any
            if (EC.Upload.hierarchy_forms.length > 0) {

                EC.Upload.current_form = EC.Upload.hierarchy_forms.shift();
                self.getOneHierarchyEntry(EC.Upload.current_form);

            } else {

                /*No entries for any form: Hierarchy upload completed
                 */

                //if the project has NOT branches, all done, shoe feedback to user
                if (!EC.Upload.has_branches) {

                    if (EC.Upload.action === EC.Const.HIERARCHY_RECURSION) {
                        EC.Upload.action = EC.Const.STOP_HIERARCHY_UPLOAD;
                        EC.Upload.renderUploadViewFeedback(true);
                    }

                }

                /* If triggered by the upload view, reject the deferred object triggered on the upload view by EC.Select.getOneHierarchyEntry();
                 * as no hierarchy entries found. The fail callback will be handled by looking for branches (if any)
                 * */
                if (EC.Upload.action === EC.Const.START_HIERARCHY_UPLOAD) {
                    deferred.reject();
                }

                //if it is a recursive call, it means we uploaded all the hierarchy entries and we have to upload all the branch entries
                if (EC.Upload.action === EC.Const.HIERARCHY_RECURSION) {

                    //switch to branch recursion to upload branch entries
                    EC.Upload.action = EC.Const.BRANCH_RECURSION;

                    //get branch forms for this project BEFORE tryng to look for a branch entry
                    $.when(EC.Select.getBranchForms(project_id)).then(function (the_branch_forms) {

                        EC.Upload.branch_forms = the_branch_forms;
                        EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();
                        //get branch entry WITHOUT creating a deferred object, as we are uploading branch entries automatically, without binding to upload view buttons
                        EC.Select.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name, false);
                    });
                }

            }
        }

    };

    var _getOneHierarchyEntryTX = function (tx) {

        var query = 'SELECT _id, entry_key, parent, value, type, ref, created_on FROM ec_data WHERE entry_key=? AND form_id=? AND is_data_synced=?';

        tx.executeSql(query, [entry_key, form._id, 0], _getOneHierarchyEntrySQLSuccess, EC.Select.errorCB);

        EC.Select.query_error_message = 'EC.Select.getOneHierarchyEntry _getOneHierarchyEntryTX';

    };

    var _getOneHierarchyEntrySQLSuccess = function (the_tx, the_result) {

        var i;
        var result = the_result;
        var iLength = result.rows.length;
        var ref;
        var new_ref = '';
        var location_ref = '';
        var location_obj = {};
        var location_string;
        var parent_ref;
        var path;
        var values_counter = 0;

        //build first entry
        entry = {
            created_on: result.rows.item(0).created_on,
            entry_key: result.rows.item(0).entry_key,
            values: [{}]
        };

        //if it is a child form, add parent @ref and its value as a parent obj
        parent_ref = _getParentRef(form.name);

        //if it is a child form, store parent ref
        if (parent_ref) {

            //get immediate parent value
            entry.parent_ref = parent_ref;
            path = (result.rows.item(0).parent).split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            entry.parent_key_value = path[path.length - 1];
        }

        //add all values for this entry
        i = 0;
        values_counter = 0;
        //using a separate index for the entry values as each location value will be splitted into 4 components
        while (i < iLength) {

            //set empty object
            entry.values[values_counter] = {};

            switch (result.rows.item(i).type) {

                //TODO: add branc type;

                case EC.Const.LOCATION:

                    //split the location values to different parts (as expected on server)
                    location_string = result.rows.item(i).value.replace('\n', '').replace('\r', '');

                    //no location saved, so fill in with empty values
                    if (location_string === '') {

                        entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        entry.values[values_counter].value = '';
                        entry.values[values_counter]._id = result.rows.item(i)._id;
                        entry.values[values_counter].type = result.rows.item(i).type;

                        entry.values[values_counter + 1] = {};
                        entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        entry.values[values_counter + 1].value = '';
                        entry.values[values_counter + 1]._id = '';
                        entry.values[values_counter + 1].type = result.rows.item(i).type;

                        entry.values[values_counter + 2] = {};
                        entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        entry.values[values_counter + 2].value = '';
                        entry.values[values_counter + 2]._id = '';
                        entry.values[values_counter + 2].type = result.rows.item(i).type;

                        entry.values[values_counter + 3] = {};
                        entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        entry.values[values_counter + 3].value = '';
                        entry.values[values_counter + 3]._id = '';
                        entry.values[values_counter + 3].type = result.rows.item(i).type;

                        entry.values[values_counter + 4] = {};
                        entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        entry.values[values_counter + 4].value = '';
                        entry.values[values_counter + 4]._id = '';
                        entry.values[values_counter + 4].type = result.rows.item(i).type;
                    } else {

                        //get location object
                        location_obj = EC.Utils.parseLocationString(location_string);

                        entry.values[values_counter].ref = result.rows.item(i).ref + '_lat';
                        entry.values[values_counter].value = location_obj.latitude;
                        entry.values[values_counter]._id = result.rows.item(i)._id;
                        entry.values[values_counter].type = result.rows.item(i).type;

                        entry.values[values_counter + 1] = {};
                        entry.values[values_counter + 1].ref = result.rows.item(i).ref + '_lon';
                        entry.values[values_counter + 1].value = location_obj.longitude;
                        entry.values[values_counter + 1]._id = '';
                        entry.values[values_counter + 1].type = result.rows.item(i).type;

                        entry.values[values_counter + 2] = {};
                        entry.values[values_counter + 2].ref = result.rows.item(i).ref + '_acc';
                        entry.values[values_counter + 2].value = location_obj.accuracy;
                        entry.values[values_counter + 2]._id = '';
                        entry.values[values_counter + 2].type = result.rows.item(i).type;

                        entry.values[values_counter + 3] = {};
                        entry.values[values_counter + 3].ref = result.rows.item(i).ref + '_alt';
                        entry.values[values_counter + 3].value = location_obj.altitude;
                        entry.values[values_counter + 3]._id = '';
                        entry.values[values_counter + 3].type = result.rows.item(i).type;

                        //heading on the server is called bearing
                        entry.values[values_counter + 4] = {};
                        entry.values[values_counter + 4].ref = result.rows.item(i).ref + '_bearing';
                        entry.values[values_counter + 4].value = location_obj.heading;
                        entry.values[values_counter + 4]._id = '';
                        entry.values[values_counter + 4].type = result.rows.item(i).type;

                    }

                    //increase values_counter as we split the location value into 4 components
                    values_counter += 4;

                    break;

                default:

                    entry.values[values_counter].ref = result.rows.item(i).ref;

                    //set skipped values as empty strings
                    if (result.rows.item(i).value === EC.Const.SKIPPED) {
                        entry.values[values_counter].value = '';
                    } else {
                        entry.values[values_counter].value = result.rows.item(i).value;
                    }

                    entry.values[values_counter]._id = result.rows.item(i)._id;
                    entry.values[values_counter].type = result.rows.item(i).type;

            }//switch

            //increase counter for next value
            values_counter++;
            i++;

        }//for

    };

    var _getOneHierarchyEntrySuccessCB = function () {

        console.log('One entry');
        console.log(entry);

        switch (EC.Upload.action) {

            case EC.Const.START_HIERARCHY_UPLOAD:
                if (entry) {
                    deferred.resolve(entry);
                } else {
                    deferred.reject();
                }
                break;

            case EC.Const.HIERARCHY_RECURSION:

                //Upload entry
                if (entry) {
                    EC.Upload.current_entry = entry;
                    EC.Upload.prepareOneHierarchyEntry(EC.Upload.current_form.name, EC.Upload.current_entry);
                } else {
                    //TODO: no entry to upload, show upload success??
                    console.log('no entry to upload');
                }
                break;
        }
    };

    var _getOneEntryKeySuccessCB = function () {

    };

    module.getOneHierarchyEntry = function (the_form, is_called_from_view) {

        self = this;
        form = the_form;
        entry = {};

        if (is_called_from_view) {
            deferred = new $.Deferred();
        }

        EC.db.transaction(_getOneEntryKeyTX, EC.Select.errorCB, _getOneEntryKeySuccessCB);

        if (is_called_from_view) {
            // return promise to update ui when entry has/has not been found
            return deferred.promise();
        }

    };

    return module;

}(EC.Select));
