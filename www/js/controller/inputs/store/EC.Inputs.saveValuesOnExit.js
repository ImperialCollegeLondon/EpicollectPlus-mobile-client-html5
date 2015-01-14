/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.saveValuesOnExit = function(the_current_input) {

			var self = this;
			var current_input = the_current_input;
			//get current value from th einput currently on screen
			var current_value = self.getCurrentValue(current_input.type);
			var current_position = parseInt(window.localStorage.current_position, 10);
			var validation = self.validateValue(current_input, current_value, current_position);

			//back to same screen if invalid value
			if (!validation.is_valid) {
				//warn user about the type of error
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation(validation.message));
				return;
			}

			//cache current value in localStorage
			self.setCachedInputValue(current_value, current_position, current_input.type, current_input.is_primary_key);
			self.pushInputsTrail(current_input);

			self.onStoreValues();

		};

		return module;

	}(EC.Inputs));
