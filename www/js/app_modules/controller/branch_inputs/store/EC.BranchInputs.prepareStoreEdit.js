/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *	@module EC
*   @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareStoreEdit = function(the_current_value, the_current_position, the_input) {

			var self = this;
			var clone_value = "";
			var validation = {};
			var form_has_jumps;
			var current_value = the_current_value;
			var current_position = the_current_position;
			var input = the_input;

			//disable to avoid double submit (not unbind, as if validation is wrong, I will have to re-bind again)
			$(this).addClass('ui-disabled');

			form_has_jumps = window.localStorage.form_has_jumps;

			//get input value(based on input type and layout)
			current_value = EC.BranchInputs.getCurrentValue(input.type);
			current_position = window.localStorage.branch_current_position;

			//if we need to check for a double entry, get clone value
			if (parseInt(input.has_double_check, 10) === 1) {

				clone_value = self.getCloneValue(input.type);

			}

			//validate input before going to next page
			validation = EC.Utils.isValidValue(input, current_value, clone_value);

			//check if the editing is valid
			if (!validation.is_valid) {

				//warn user about the type of error
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));

				//re-enable button to allow user to try again
				$(this).removeClass('ui-disabled');

				return;

			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

			//If this form has jump, edit the input_values array to set to _skipp3d_ all the values which are not part of the input_trail array
			if (form_has_jumps === '1') {

				//add current element on the view to inputs trail (as we are not tapping next)
				self.pushInputsTrail(input);

				//amend values skipped by the new jump sequence when editing
				self.amendSkippedValues();
			}

			//store data.
			self.storeData(self);

		};

		return module;

	}(EC.BranchInputs));
