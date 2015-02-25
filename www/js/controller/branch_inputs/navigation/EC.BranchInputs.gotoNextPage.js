/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		var self;
		var branch_current_position;
		var is_jump_found;
		
		/*
		 * @function _checkJumps check if there is any jump to perform based on the input value and jumps mapped to that input
		 */
		var _checkJumps = function(the_jumps, the_current_value) {

			var jumps = the_jumps;
			var i;
			var iLength = jumps.length;
			var branch_destination_position;
			var branch_destination;
			var current_value = the_current_value;
			var branch_inputs_total = window.localStorage.branch_inputs_total;

			//if not any jump conditions match, set destination to the next input as default
			branch_destination_position = branch_current_position + 1;

			for ( i = 0; i < iLength; i++) {

				//check if we jump always
				if (jumps[i].jump_when === EC.Const.JUMP_ALWAYS) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				//check if we jump whan a value is not selected
				if (jumps[i].jump_when === EC.Const.JUMP_FIELD_IS_BLANK && (current_value === null || current_value === EC.Const.NO_OPTION_SELECTED)) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS && current_value.toString() === jumps[i].jump_value.toString()) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

				if (jumps[i].jump_when === EC.Const.JUMP_VALUE_IS_NOT && current_value.toString() !== jumps[i].jump_value.toString()) {
					
					is_jump_found = true;
					branch_destination = jumps[i].jump_to;
					branch_destination_position = (branch_destination === EC.Const.END_OF_FORM) ? branch_inputs_total : self.getJumpDestinationPosition(branch_destination);
					break;
				}

			}

			//override current_input_position with the position of the input set by the jump (-1 because we are adding +1 later)
			branch_current_position = branch_destination_position - 1;
			
			return branch_destination;
		};
		
		/*
		 * @method gotoNextPage load next input into view, checking for jumps etc.
		 */
		module.gotoNextPage = function(evt, the_current_value) {

			var branch_current_input;
			var current_value = the_current_value;
			var next_branch_input;
			var next_page;
			var options;
			var i;
			var iLength;
			var obj;
			var branch_destination;
			var branch_destination_position;
			var jumps;
			var is_branch_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var next_branch_value;
			var is_checkbox = false;
			
			self = this;
			branch_current_position = parseInt(window.localStorage.branch_current_position, 10);
			
			//get value from object in the case of a dropdown/radio (object is like {label:"<label>", index:"<value>"})
			if (current_value.hasOwnProperty("value")) {
				current_value = current_value.value;
			}
			
			//if current value is an array, we have checkbox values to parse and check each of them against jumps
			if (Array.isArray(current_value)) {
				is_checkbox = true;
			}

			//check if we have reached the end of the form
			if (branch_current_position === self.branch_inputs.length) {
				next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;
			} else {

				//check if the current input triggers a jump
				branch_current_input = self.getInputAt(branch_current_position);

				if (parseInt(branch_current_input.has_jump, 10) === 1) {

					//get jumps
					jumps = EC.Utils.parseJumpString(branch_current_input.jumps);

					//if we have an arry of values (checkboxes) check each of them if it triggers a jump
					if (is_checkbox) {

						is_jump_found = false;
						iLength = current_value.length;

						//loop each selected value until the first jump is found (or no more elements to check against)
						for ( i = 0; i < iLength; i++) {

							branch_destination = _checkJumps(jumps, current_value[i].value);
							if (is_jump_found) {
								break;
							}
						}

					} else {
						//single value
						branch_destination = _checkJumps(jumps, current_value);
					}

				}//if has jump

				if (branch_destination === EC.Const.END_OF_FORM) {
					next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;
				} else {

					next_branch_input = self.getInputAt(branch_current_position + 1);

					/*
					 * if is_genkey_hidden = 1, the from creator decided to hide the auto genkey
					 * The nasty form builder allows users to drag the primary key input fields to any position (lol)
					 * therefore we have to test each input if it is a primary key field
					 * We have to skip the next input (from the user) but add an entry to inputs_values, inputs_trail with the UUID
					 *
					 */

					if (is_branch_genkey_hidden && next_branch_input.is_primary_key === 1) {

						//add skipped genkey entry also in inputs_trail
						self.pushInputsTrail(next_branch_input);

						//add an entry with UUID to inputs_values if we are entering a new entry
						next_branch_value = EC.Utils.getGenKey();

						//cache next value in localStorage
						self.setCachedInputValue(next_branch_value, branch_current_position + 1, next_branch_input.type, next_branch_input.is_primary_key);

						//go to the next  input AFTER the hidden primary key (if it exists, otherwise the save confirm page)
						next_branch_input = self.getInputAt(branch_current_position + 2);
						if (!next_branch_input) {

							next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_SAVE_CONFIRM_VIEW;

							//TODO check this???
						}

						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.branch_current_position = branch_current_position + 2;

					} else {
						//update current input position in session (store confirm screen will get a position = array.length)
						window.localStorage.branch_current_position = branch_current_position + 1;
					}

					if (next_branch_input) {
						next_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + next_branch_input.type + EC.Const.HTML_FILE_EXT;
					}

				}

			}

			EC.Routing.changePage(next_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};
		return module;

	}(EC.BranchInputs));
