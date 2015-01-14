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

		module.onPrevBtnTapped = function(e, the_input) {

			var self = this;
			var branch_input = the_input;
			var branch_inputs_total = self.branch_inputs.length;
			var branch_current_value = self.getCurrentValue(branch_input.type);
			var branch_current_position = window.localStorage.branch_current_position;
			var branch_cached_value = EC.Inputs.getCachedInputValue(branch_current_position);

			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (window.localStorage.branch_edit_mode && parseInt(branch_input.has_jump, 10) === 1) {
				if (!EC.Inputs.valuesMatch(branch_cached_value, branch_current_value, branch_input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					window.localStorage.branch_has_new_jump_sequence = 1;
				}
			}

			//check we are not coming back from #save-confirm page
			if (branch_current_position <= self.branch_inputs.length) {

				//cache current value in localStorage
				self.setCachedInputValue(branch_current_value, branch_current_position, branch_input.type, branch_input.primary_key);
			}

			self.gotoPrevPage(e);

		};

		return module;

	}(EC.BranchInputs));
