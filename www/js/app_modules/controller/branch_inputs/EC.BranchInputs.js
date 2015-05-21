var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    var project_id;
    var branch_form_name;
    var self;


    module.getInputAt = function (the_position) {

        var index = the_position - 1;
        self = this;

        return self.branch_inputs[index];
    };

    module.getPrimaryKeyRefPosition = function () {

        var i;
        var iLenght = self.branch_inputs.length;
        self = this;

        //look for the position of the primary key
        for (i = 0; i < iLenght; i++) {

            if (parseInt(self.branch_inputs[i].is_primary_key, 10) === 1) {

                return self.branch_inputs[i].position;
            }
        }
    };

    /**
     * get list of inputs for the branch form specified
     */
    module.getList = function (the_branch_form_name, the_project_id) {

        var branch_edit_position = window.localStorage.branch_edit_position;
        branch_form_name = the_branch_form_name;
        project_id = the_project_id;

        //get all the branch inputs for the branch form
        $.when(EC.Select.getBranchInputs(branch_form_name, project_id)).then(function (branch_inputs, has_jumps) {

            //set branch inputs in memory
            EC.BranchInputs.setInputs(branch_inputs, has_jumps);

            //render first input on the list or the selected position (-1) if we are editing
            EC.BranchInputs.prepareFirstInput((branch_edit_position === undefined) ? branch_inputs[0] : branch_inputs[branch_edit_position - 1]);
        });

    };

    module.setInputs = function (the_branch_inputs, the_has_jumps_flag) {

        self = this;
        self.branch_inputs = the_branch_inputs;
        window.localStorage.branch_inputs_total = self.branch_inputs.length;

        //set flag to indicate if this form has or not any jumps
        window.localStorage.branch_form_has_jumps = (the_has_jumps_flag) ? 1 : 0;

    };

    module.getInputs = function () {
        return this.branch_inputs;
    };

    module.getFormDetails = function (the_input, the_value, the_project_id) {
        EC.Select.getBranchFormDetails(the_input, the_value, the_project_id);
    };

    module.setCachedBranchEntryKeys = function (the_branch_form_name, the_primary_keys) {

        var primary_keys = the_primary_keys;
        var branch_form_name = the_branch_form_name;
        var all_branches_keys;
        var current_branch_form_primary_keys;
        var is_branch_form_cached = false;
        var i;
        var iLength;

        //try to get branch_primary_keys object if it exists in LocalStorage
        try {
            all_branches_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);
        } catch (error) {

            all_branches_keys = [];
        }

        iLength = all_branches_keys.length;

        if (iLength > 0) {

            //get cached primary keys for this branch form only
            for (i = 0; i < iLength; i++) {

                if (all_branches_keys[i].branch_form_name === branch_form_name) {

                    is_branch_form_cached = true;

                    current_branch_form_primary_keys = all_branches_keys[i].primary_keys;

                    //add branch_primary keys to keys already in LocalStorage
                    current_branch_form_primary_keys = current_branch_form_primary_keys.concat(primary_keys).unique();

                    all_branches_keys[i].primary_keys = current_branch_form_primary_keys;

                    window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);
                }

            }

            //if the current branch form is not found in the cache, then add it
            if (!is_branch_form_cached) {

                //current branch form  not cached yet, add it to cached_branch_entry_keys global object
                all_branches_keys.push({
                    branch_form_name: branch_form_name,
                    primary_keys: primary_keys
                });

                window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);

            }

        } else {

            //window.localStorage.cached_branch_entry_keys is empty so this is the first branch form for this main form, add it straight away
            all_branches_keys.push({
                branch_form_name: branch_form_name,
                primary_keys: primary_keys
            });

            window.localStorage.cached_branch_entry_keys = JSON.stringify(all_branches_keys);

        }

    };

    module.getCachedBranchEntryKeys = function (the_branch_form_name) {

        var branch_form_name = the_branch_form_name;
        var all_branches_keys;
        var i;
        var iLength;
        var test;

        try {

            all_branches_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

        } catch (error) {

            all_branches_keys = [];
        }

        iLength = all_branches_keys.length;

        if (iLength > 0) {

            for (i = 0; i < iLength; i++) {

                if (all_branches_keys[i].branch_form_name === branch_form_name) {

                    test = all_branches_keys[i].primary_keys;

                    console.log(test, true);

                    return all_branches_keys[i].primary_keys;
                }

            }

        } else {

            return [];
        }

    };

    module.getJumpDestinationPosition = function (the_ref) {

        var i;
        var iLenght = this.branch_inputs.length;
        var ref = the_ref;

        //look for the position of the specified ref
        for (i = 0; i < iLenght; i++) {
            if (ref === this.branch_inputs[i].ref) {
                return this.branch_inputs[i].position;
            }
        }
    };

    return module;

}(EC.BranchInputs));
