/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {
        "use strict";

        /**
         *
         * @param {String} the_hash_to_parse: Query string like
         * "branch_form_name=awesome_form&entry_key=1297f543-fe9e-4c01-e5a0-10512e7968b0"
         */
        module.getBranchEntryValues = function(the_hash_to_parse) {

            //get branch form name and entry key parsing the href
            var hash = the_hash_to_parse.split('?');
            var parent;
            var is_child_form_nav = window.localStorage.is_child_form_nav;
            var form = hash[1].split('&');
            var branch_form_name = form[0].replace("branch_form_name=", "");
            var entry_key = form[1].replace("entry_key=", "");
            var project_id = window.localStorage.project_id;

            /* hierarchy_entry_key_value is the current value of the primary key
             * for the form we want to enter branches to
             * we need it as we need to link the branch entries to a single main
             * form entry (like it is its parent)
             */
            var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
            var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);

            //cache hash to go back to branch-entry-values list when leaving an
            // edit action
            window.localStorage.branch_entry_values_url = "branch-entry-values.html?branch_form_name=" + branch_form_name + "&entry_key=" + entry_key;

            //Select all values stored for this entry THEN render view
            $.when(EC.Select.getBranchEntryValues(project_id, branch_form_name, entry_key, hierarchy_entry_key_value)).then(function(the_values) {

                //get inputs to map values against labels for dropdown, radio and
                // checkbox
                $.when(EC.Select.getBranchInputs(branch_form_name, project_id)).then(function(branch_inputs, has_jumps) {

                    //set inputs in memory
                    EC.BranchInputs.setInputs(branch_inputs, has_jumps);

                    EC.Entries.renderBranchEntryValues(the_values);

                    window.localStorage.removeItem("branch_has_new_jump_sequence");

                });

            });

        };

        return module;

    }(EC.Entries));
