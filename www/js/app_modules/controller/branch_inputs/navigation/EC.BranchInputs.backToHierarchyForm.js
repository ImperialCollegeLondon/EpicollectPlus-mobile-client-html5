/*
 *	@module EC
 @submodule BranchInputs
 *
 * Route back user from a branch form to the linked hierararchy form, clearing cached branch data
 * 
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    module.backToHierarchyForm = function () {

        debugger;

        var inputs;
        var current_input;
        var current_input_position;
        var page;

        inputs = JSON.parse(window.localStorage.inputs);
        current_input_position = parseInt(window.localStorage.current_position, 10);
        current_input = inputs[current_input_position - 1];

        //clear branch data cache
        window.localStorage.removeItem('branch_current_position');
        window.localStorage.removeItem('branch_form_has_jumps');
        window.localStorage.removeItem('branch_form_name');
        window.localStorage.removeItem('branch_inputs_total');
        window.localStorage.removeItem('branch_inputs_trail');
        window.localStorage.removeItem('branch_inputs_values');
        window.localStorage.removeItem('branch_form_id');
        window.localStorage.removeItem('branch_edit_hash');
        window.localStorage.removeItem('branch_edit_key_value');
        window.localStorage.removeItem('branch_edit_type');

        window.localStorage.back_from_branch = 1;

        page = EC.Const.INPUT_VIEWS_DIR + current_input.type + EC.Const.HTML_FILE_EXT;

        //EC.Inputs.renderInput(current_input);
        EC.Routing.changePage(page);

    };

    return module;

}(EC.BranchInputs));
