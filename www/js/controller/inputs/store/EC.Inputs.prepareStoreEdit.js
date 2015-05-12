/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.prepareStoreEdit = function (the_current_position, the_input, the_ctx) {

        var clone_value = '';
        var validation = {};
        var form_has_jumps;
        var current_value;
        var current_position = the_current_position;
        var input = the_input;
        var self = the_ctx;

        //disable to avoid double submit
        $(this).addClass('ui-disabled');

        form_has_jumps = window.localStorage.form_has_jumps;

        //get input value(based on input type and layout)
        current_value = EC.Inputs.getCurrentValue(input.type);
        current_position = window.localStorage.current_position;

        //if we need to check for a double entry, get clone value
        if (parseInt(input.has_double_check, 10) === 1) {

            clone_value = EC.Inputs.getCloneValue(input.type);

        }

        //validate input before going to next page
        validation = EC.Utils.isValidValue(input, current_value, clone_value);

        //check if the editing is valid
        if (!validation.is_valid) {
            //warn user about the type of error
            EC.Notification.showAlert('Error', validation.message);

            //re-enable button to allow user to try again
            $(this).removeClass('ui-disabled');
            return;
        }

        //cache current value in localStorage
        EC.Inputs.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

        //If this form has jump, edit the input_values array to set to _skipp3d_ all the values which are not part of the input_trail array
        //todo the above is wrong, we need to force the user to go to the end of the form when modifying a form with jumps, reviewing the inputs he just entered
        // (he can press 'next' over and over) -> quick and dirty solution would be disabling the on-screen store edit so the user needs to go to the end of the form, but only when he made a change to an input with a jump
        // if (form_has_jumps === '1') {

        //add current element on the view to inputs trail (as we are not tapping next)
        EC.Inputs.pushInputsTrail(input);

        //amend values skipped by the new jump sequence when editing
        //   EC.Inputs.amendSkippedValues();
        // }

        //store data.
        self.storeData(self);

    };

    return module;
}(EC.Inputs));
