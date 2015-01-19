/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *@module EC
 *@submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {
		"use strict";

		module.onNextBtnTapped = function(e, the_input) {

			var self = this;
			var wls = window.localStorage;
			var branch_input = the_input;
			var branch_edit_id = wls.branch_edit_id || "";
			var branch_edit_type = wls.branch_edit_type || "";
			var branch_form = JSON.parse(wls.branch_form);
			//get input value(based on input type and layout)
			var current_value = EC.BranchInputs.getCurrentValue(branch_input.type);
			var branch_current_position = wls.branch_current_position;
			var branch_cached_value = EC.Inputs.getCachedInputValue(branch_current_position);
			var validation = self.validateValue(branch_input, current_value, branch_current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				//warn user about the type of error
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));
				return;
			}

			//When editing, if the value of a field triggering a jump was changed, disable
			// intermediate "Store Edit" button from now on
			if (wls.branch_edit_mode && parseInt(branch_input.has_jump, 10) === 1) {
				if (!EC.Inputs.valuesMatch(branch_cached_value, current_value, branch_input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate
					// screen is disabled
					wls.branch_has_new_jump_sequence = 1;
				}
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, branch_current_position, branch_input.type, branch_input.is_primary_key);

			self.pushInputsTrail(branch_input);

			//remove flag that helps to handle back button when user is just dismissing
			// barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoNextPage(e, current_value);

		};

		return module;

	}(EC.BranchInputs));
