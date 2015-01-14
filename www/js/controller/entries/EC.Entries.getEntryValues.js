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
         * @method getEntryValues Fetches the list of values for a single entry
         * (form)
         * @param {String} the_hash_to_parse Info about which data to fetch
         * "#values?form=1&entry_key=Kingston&direction=forward"
         *
         * #values we are requesting a list of values
         * form=1 The form id
         * entry_key=Kingston The value of the primary key for the selected entry
         * direction=forwardThe direction the user is navigating to
         *
         */
        module.getEntryValues = function(the_hash_to_parse) {

            //get form id and entry key parsing the href
            var hash = the_hash_to_parse.split('?');
            var wls = window.localStorage;
            var breadcrumbs_trail = [];
            var parent;
            var parent_path;
            var nav_parent_path;
            var is_child_form_nav = wls.is_child_form_nav;
            var form = hash[1].split('&');
            var form_id = form[0].replace("form=", "");
            var entry_key = form[1].replace("entry_key=", "");
            var direction = form[2].replace("direction=", "");
            var form_name = wls.form_name;
            var form_tree = JSON.parse(wls.form_tree);
            var entries_totals = [];
            var children;
            var current_view_url_parts;

            //cache current page url for navigation purposes
            current_view_url_parts = the_hash_to_parse.split("/");
            wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

            //update entry key in localStorage
            wls.entry_key = entry_key;

            //cache url to go back to entry-values list when leaving an edit
            // action
            wls.back_edit_nav_url = "entry-values.html?form=" + form_id + "&entry_key=" + entry_key + "&direction=" + EC.Const.EDITING;

            //try if a parent is defined, in that case we are selecting a child
            // entry from a child form list
            try {
                parent = form[3].replace("parent=", "");

                //remove any breadcrumbs for navigation
                wls.removeItem("breadcrumbs");

            } catch (e) {
                parent = "";
                console.log(e);
            }

            //get breadcrumb trail, first iteration will be "" when it is the top
            // form on the tree
            try {
                breadcrumbs_trail = JSON.parse(wls.breadcrumbs);
            } catch (error) {
                breadcrumbs_trail = [];
            }

            /* Get parent path from breadcrumbs (if not defined in localStorage
             * by a Store Edit action)
             * When saving a form, window.localStorage.parent_path is set in
             * EC.Inputs.buildRows
             * We need that value to uniquely identify a set of entries when
             * navigating down the tree structure.
             * It will be like key|key|key... so the full path to the root.
             */
            nav_parent_path = wls.parent_path;
            if (nav_parent_path === undefined) {
                parent_path = (breadcrumbs_trail[0] === "") ? breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
            } else {
                //a parent path is defined, therefore we are coming back from the
                // inputs page after a "Store Edit" action
                parent_path = nav_parent_path;
            }

            //update breadcrumb trail based on navigation direction
            switch(direction) {

                case EC.Const.FORWARD:
                    breadcrumbs_trail.push(entry_key);

                    break;
                case EC.Const.BACKWARD:
                    breadcrumbs_trail.pop();
                    break;
                case EC.Const.EDITING:
                    console.log("back from editing");
                    //do nothing
                    break;
                case EC.Const.VIEW:

                    breadcrumbs_trail.push(entry_key);

                    break;

            }

            wls.setItem("breadcrumbs", JSON.stringify(breadcrumbs_trail));
            //window.localStorage.setItem("entries_totals",
            // JSON.stringify(breadcrumbs_trail));

            //get current form tree (parent and child form based on the active
            // one)
            form_tree = EC.Utils.getParentAndChildForms(form_id);

            if (parent !== "") {

                parent_path = (parent_path === "") ? parent : parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parent_path;
            }

            //if parent_path at this point is equal to the entry key, set it to
            // "" (It happens when tapping "Store Edit" after editing a form)
            if (parent_path === entry_key) {
                parent_path = "";

                //remove last element from breadcrumb trail
                breadcrumbs_trail = JSON.parse(wls.breadcrumbs);
                breadcrumbs_trail.pop();
                wls.setItem("breadcrumbs", JSON.stringify(breadcrumbs_trail));
            }

            //remove parent_path flag to restore normal navigation
            // (backward-forward)
            wls.removeItem("parent_path");

            //reset offset for entries pagination
            //wls.QUERY_ENTRIES_OFFSET = 0;

            //Select all values stored for this entry
            $.when(EC.Select.getEntryValues(form_id, entry_key, parent_path)).then(function(the_values) {

                //get inputs to map values against labels for dropdown, radio and
                // checkbox
                $.when(EC.Select.getInputs(form_id)).then(function(inputs, has_jumps) {

                    //set inputs in memory
                    EC.Inputs.setInputs(inputs, has_jumps);

                    //Render entry values list
                    EC.Entries.renderEntryValues(the_values);

                });

            });

        };

        return module;

    }(EC.Entries));
