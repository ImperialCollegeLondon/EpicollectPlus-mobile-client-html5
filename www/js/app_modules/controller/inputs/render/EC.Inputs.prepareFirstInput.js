/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.prepareFirstInput = function (the_first_input) {



        var self = this;
        var first_input_position = 1;
        var back_nav_url;
        var form_name = window.localStorage.form_name;
        var form_id = window.localStorage.form_id;
        var breadcrumbs = JSON.parse(window.localStorage.breadcrumbs);
        var entry_key = breadcrumbs[breadcrumbs.length - 1];
        var input = the_first_input;
        var page = EC.Const.INPUT_VIEWS_DIR + input.type + EC.Const.HTML_FILE_EXT;
        var back_btn = $('div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var entries_totals = JSON.parse(window.localStorage.entries_totals);
        var children = entries_totals[entries_totals.length - 1].entries_total;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);


        //start watching for device position if the form has got a location field
        if (parseInt(window.localStorage.form_has_location, 10) === 1) {
            window.localStorage.watch_position = navigator.geolocation.watchPosition(function (position) {
                console.log(position);
            }, function (error) {
                console.log(error);
            }, {
                maximumAge: 0,
                timeout: 300000,
                enableHighAccuracy: true
            });
        }

        //reset entry key
        self.entry_key = null;

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        //set array to keep track of input navigation (get pre-built one when editing)
        if (!window.localStorage.edit_mode) {
            window.localStorage.inputs_trail = [];
        } else {
            //update inputs trail to remove all the elements past the current edit position
            EC.Inputs.spliceInputsTrail(window.localStorage.edit_position);
        }

        //set hash to be used to list these entries when loading entries-list.html after a save/exit action
        if (!window.localStorage.edit_mode) {
            back_nav_url = 'entries-list.html';
            back_nav_url += '?form=' + form_id;
            back_nav_url += '&name=' + form_name;
            back_nav_url += '&entry_key=' + entry_key;
            back_nav_url += '&direction=' + EC.Const.ADDING;
            back_nav_url += '&children=' + children;

            window.localStorage.back_nav_url = back_nav_url;
        }

        /* Update current position if edit_mode is active. When editing, the user can start editing the form from any input
         * not just the first one. In that case we have to update the first position to be the selected input position
         * not 1
         */
        window.localStorage.current_position = (window.localStorage.edit_mode) ? window.localStorage.edit_position : first_input_position;

        /*
         * If if the genkey hidden flag is set to 1 and the input is a primary key input, do not render this input on screen but:
         *
         * - just cache it with an auto genkey in localStorage if we are entering a new entry
         * - do nothing if we are editing, ad the inputs_values array will be set already (it is set when listing the entry values)
         *
         */

        if (is_genkey_hidden === 1 && input.is_primary_key === 1) {

            //skip input
            window.localStorage.current_position = first_input_position + 1;

            //if we are entering a new entry, add an auto generated key in input_values[]
            if (!window.localStorage.edit_mode) {
                window.localStorage.inputs_values = JSON.stringify([{
                    _id: '',
                    type: '',
                    value: EC.Utils.getGenKey(),
                    position: 1,
                    is_primary_key: 1
                }]);

            }

            //get next input to set page we have to go to (first_input_position is equal to current_position-1, so...)
            input = self.inputs[first_input_position];
            page = EC.Const.INPUT_VIEWS_DIR + input.type + EC.Const.HTML_FILE_EXT;

        }

        //remove branch flags and objects from localStorage
        window.localStorage.removeItem('cached_branch_entry_keys');
        window.localStorage.removeItem('stored_branch_entry_keys');
        window.localStorage.removeItem('branch_current_position');
        window.localStorage.removeItem('branch_form');
        window.localStorage.removeItem('branch_form_has_jumps');
        window.localStorage.removeItem('branch_form_id');
        window.localStorage.removeItem('branch_form_name');
        window.localStorage.removeItem('branch_inputs_total');
        window.localStorage.removeItem('branch_primary_keys');
        window.localStorage.removeItem('branch_edit_id');
        window.localStorage.removeItem('branch_edit_mode');
        window.localStorage.removeItem('branch_edit_position');
        window.localStorage.removeItem('branch_inputs_trail');
        window.localStorage.removeItem('branch_inputs_values');

        //get first input view
        EC.Routing.changePage(page);

    };

    return module;

}(EC.Inputs));
