/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var self;
    var current_input_position;
    var is_jump_found;

    /*
     * check if a selected value triggers a jump. If multiple jumps are true, the first triggered jump will win, according to the jump checking sequence
     */
    function _checkJumps(the_jumps, the_current_value) {

        var jumps = the_jumps;
        var i;
        var iLength = jumps.length;
        var destination_position;
        var destination;
        var current_value = the_current_value;
        var inputs_length = self.inputs.length;

        //if not any jump conditions match, set destination to the next input as default
        destination_position = current_input_position + 1;

        for (i = 0; i < iLength; i++) {

            //check if we jump always
            if (jumps[i].jump_when === EC.Const.JUMP_ALWAYS) {

                is_jump_found = true;
                destination = jumps[i].jump_to;
                destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
                break;
            }

            //check if we jump whan a value is not selected (not selected values are set to null for consistency)
            //TODO: check this
            if (jumps[i].jump_when === EC.Const.JUMP_FIELD_IS_BLANK && (current_value === null || current_value === EC.Const.NO_OPTION_SELECTED)) {

                is_jump_found = true;
                destination = jumps[i].jump_to;
                destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
                break;
            }

            //jump when the value IS: the jump is performed by index so the index of the <option> tag is to be checked against the "jump_value"
            if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS && current_value.toString() === jumps[i].jump_value.toString()) {

                is_jump_found = true;
                destination = jumps[i].jump_to;
                destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
                break;
            }

            if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS_NOT && current_value.toString() !== jumps[i].jump_value.toString()) {

                is_jump_found = true;
                destination = jumps[i].jump_to;
                destination_position = (destination === EC.Const.END_OF_FORM) ? inputs_length : self.getJumpDestinationPosition(destination);
                break;
            }

        }

        //override current_input_position with the position of the input set by the jump (-1 because we are adding +1 later)
        current_input_position = destination_position - 1;

        return destination;

    }

    module.gotoNextPage = function (evt, the_current_value) {


        var current_input;
        var current_value = the_current_value;
        var next_input;
        var next_page;
        var options;
        var obj;
        var destination;
        var jumps;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(parseInt(window.localStorage.form_id, 10));
        var next_value;
        var i;
        var iLength;
        var is_checkbox = false;
        var is_group = false;

        self = this;
        current_input_position = parseInt(window.localStorage.current_position, 10);

        /* DROPDOWN/RADIO*/
        //get index from object in the case of a dropdown/radio (object is like {label:"<label>", index:"<value>"})
        if (current_value.hasOwnProperty('index')) {
            current_value = current_value.index;
        }

        /* CHECKBOX*/
        //if current value is an array, we have checkbox values to parse and check each of them against jumps
        //if 'ref' property is present for any element of the array, this is not a checkbox but group form values
        if (Array.isArray(current_value) && !current_value[0].hasOwnProperty('ref')) {
            is_checkbox = true;
        }

        /* GROUP */
        //if current value is an array and the property 'ref' exists, this is a group
        if (Array.isArray(current_value)) {
            if (current_value[0].hasOwnProperty('ref')) {
                is_group = true;
            }
        }

        //check if we have reached the end of the form
        if (current_input_position === self.inputs.length) {
            next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
        } else {
            //skip jumps if it is a group
            if (!is_group) {
                //check if the current input triggers a jump
                current_input = self.getInputAt(current_input_position);

                if (parseInt(current_input.has_jump, 10) === 1) {
                    //get jumps
                    jumps = EC.Utils.parseJumpString(current_input.jumps);

                    //if we have an arry of values (checkboxes) check each of them if it triggers a jump
                    if (is_checkbox) {

                        is_jump_found = false;
                        iLength = current_value.length;

                        //loop each selected value until the first jump is found (or no more elements to check against)
                        for (i = 0; i < iLength; i++) {

                            destination = _checkJumps(jumps, current_value[i].value);
                            if (is_jump_found) {
                                break;
                            }
                        }
                    } else {
                        //single value
                        destination = _checkJumps(jumps, current_value);
                    }
                }
            }

            if (destination === EC.Const.END_OF_FORM) {
                next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
            } else {
                next_input = self.getInputAt(current_input_position + 1);

                /*
                 * if is_genkey_hidden = 1, the from creator decided to hide the auto genkey
                 * The nasty form builder allows users to drag the primary key input fields to any position (lol)
                 * therefore we have to test each input if it is a primary key field
                 * We have to skip the next input (from the user) but add an entry to inputs_values, inputs_trail with the UUID
                 *
                 */

                if (is_genkey_hidden && next_input.is_primary_key === 1) {

                    //add skipped genkey entry also in inputs_trail
                    self.pushInputsTrail(next_input);

                    //add an entry with UUID to inputs_values if we are entering a new entry
                    next_value = EC.Utils.getGenKey();

                    //cache next value in localStorage
                    self.setCachedInputValue(next_value, current_input_position + 1, next_input.type, next_input.is_primary_key);

                    //go to the next  input AFTER the hidden primary key (if it exists, otherwise the save confirm page)
                    next_input = self.getInputAt(current_input_position + 2);
                    if (!next_input) {
                        next_page = EC.Const.INPUT_VIEWS_DIR + EC.Const.SAVE_CONFIRM_VIEW;
                    }

                    //update current input position in session (store confirm screen will get a position = array.length)
                    window.localStorage.current_position = current_input_position + 2;

                } else {

                    //update current input position in session (store confirm screen will get a position = array.length)
                    window.localStorage.current_position = current_input_position + 1;

                }

                if (next_input) {
                    next_page = EC.Const.INPUT_VIEWS_DIR + next_input.type + EC.Const.HTML_FILE_EXT;
                }

            }

        }

        EC.Routing.changePage(next_page);

        //avoid events triggering multiple times
        evt.preventDefault();

    };
    return module;

}(EC.Inputs));
