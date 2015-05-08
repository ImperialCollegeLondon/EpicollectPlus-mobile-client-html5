/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var branchFormCacheReady;
    var branchEntriesCacheReady;
    var branch_input;
    var count;
    var branch_form;

    module.renderInputView = function (the_input, the_value) {

        var input = the_input;
        var value = the_value;
        var self = this;
        var offset = 0;
        var project_id = window.localStorage.project_id;
        var parent_key_position;
        var hierarchy_entry_key_value;

        //render layout based on the input type
        switch (input.type) {

            case EC.Const.TEXT:

                EC.InputTypes.text(value, input);
                break;

            case EC.Const.TEXTAREA:

                EC.InputTypes.textarea(value, input);
                break;

            case EC.Const.INTEGER:

                EC.InputTypes.integer(value, input);
                break;

            case EC.Const.DECIMAL:

                EC.InputTypes.decimal(value, input);
                break;

            case EC.Const.DATE:

                EC.InputTypes.date(value, input);
                break;

            case EC.Const.TIME:

                EC.InputTypes.time(value, input);
                break;

            case EC.Const.RADIO:

                EC.InputTypes.radio(value, input);
                break;

            case EC.Const.CHECKBOX:

                EC.InputTypes.checkbox(value, input);
                break;

            case EC.Const.DROPDOWN:

                EC.InputTypes.dropdown(value, input);
                break;

            case EC.Const.BARCODE:

                EC.InputTypes.barcode(value, input);
                break;

            case EC.Const.LOCATION:

                EC.InputTypes.location(value, input);
                break;

            case EC.Const.PHOTO:

                EC.InputTypes.photo(value, input);
                break;

            //deal with audio recording
            case EC.Const.AUDIO:

                EC.InputTypes.audio(value, input);
                break;

            case EC.Const.VIDEO:

                EC.InputTypes.video(value, input);
                break;

            case EC.Const.BRANCH:

                //if we are opening a branch form, cache inputs
                if (!window.localStorage.back_from_branch) {

                    //cache inputs in localStorage (to have them ready when coming back from branch form)
                    window.localStorage.inputs = JSON.stringify(self.inputs);
                } else {

                    //back from a branch, remove flag
                    window.localStorage.removeItem('back_from_branch');
                }

                //if loading a branch input, we set two deferred objects to know when the branch form and its entries are BOTH cached in LocalStorage, as SQLite queries are async
                branchFormCacheReady = $.Deferred();
                branchEntriesCacheReady = $.Deferred();

                //For branch inputs only: when BOTH async queries are done, render AddBranch page
                $.when(branchFormCacheReady, branchEntriesCacheReady).then(function () {

                    //models ready, update UI
                    console.log('Branch cache ready');
                    EC.InputTypes.addBranch(count, branch_input);

                });

                /* hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to
                 * we need it as we need to link the branch entries to a single main form entry (like it is its parent)
                 */
                parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
                hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);

                /*
                 * Trigger 2 database queries and use a deferred object to show the AddBranch page when tehy are BOTH completed
                 */

                //get branch count  BEFORE rendering AddBranch
                $.when(EC.Select.getCountBranchEntries(input, hierarchy_entry_key_value, project_id, offset)).then(function (the_count, the_input) {

                    branch_input = the_input;
                    count = the_count;

                    branchEntriesCacheReady.resolve();
                    console.log('branchEntriesCacheReady called');

                });

                //get branch form details and cache them BEFORE rendering AddBranch
                $.when(EC.Select.getBranchFormDetails(input, value, project_id)).then(function (the_branch_form) {

                    branch_form = the_branch_form;

                    window.localStorage.branch_form = JSON.stringify(branch_form);

                    branchFormCacheReady.resolve();
                    console.log('branchFormCacheReady called');

                });

                break;

        }//switch

        //remove progress dialog (triggered when loading inputs.html)
        EC.Notification.hideProgressDialog();

    };

    return module;

}(EC.Inputs));
