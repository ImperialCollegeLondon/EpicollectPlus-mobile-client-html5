/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.onNextBtnTapped = function(e, the_input) {

			var self = this;
			var wls = window.localStorage;
			var edit_id = wls.edit_id || "";
			var edit_type = wls.edit_type || "";
			var input = the_input;
			var current_value = self.getCurrentValue(input.type);
			var current_position = parseInt(wls.current_position, 10);
			var cached_value = EC.Inputs.getCachedInputValue(current_position);
			var validation = self.validateValue(input, current_value, current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				
				//warn user about the type of error. IMP: validation.message comes localised already
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), validation.message);
				return;
			}

			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (wls.edit_mode && parseInt(input.has_jump, 10) === 1) {
				if (!self.valuesMatch(cached_value, current_value, input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					wls.has_new_jump_sequence = 1;
				}
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);

			self.pushInputsTrail(input);

			self.gotoNextPage(e, current_value);

		};

		return module;

	}(EC.Inputs));
