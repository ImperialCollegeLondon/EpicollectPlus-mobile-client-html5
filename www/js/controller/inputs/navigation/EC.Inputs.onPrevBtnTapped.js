/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.onPrevBtnTapped = function(e, the_input) {

			var self = this;
			var input = the_input;
			var inputs_total = self.inputs.length;
			var current_value = self.getCurrentValue(input.type);
			var current_position = parseInt(window.localStorage.current_position, 10);
			var cached_value = EC.Inputs.getCachedInputValue(current_position);
			
			//When editing, if the value of a field triggering a jump was changed, disable intermediate "Store Edit" button from now on
			if (window.localStorage.edit_mode && parseInt(input.has_jump,10) === 1) {
				if (!self.valuesMatch(cached_value, current_value, input.type)) {
					//set flag as from now until saving the form, store edit from an intermediate screen is disabled
					window.localStorage.has_new_jump_sequence = 1;
				}
			}

			//check we are not coming back from #save-confirm page
			if (current_position <= inputs_total) {
				//cache current value in localStorage
				self.setCachedInputValue(current_value, current_position, input.type, input.is_primary_key);
			}
			
			//remove flag that helps to handle back button when user is just dismissing barcode scanner
			window.localStorage.removeItem('is_dismissing_barcode');

			self.gotoPrevPage(e);

		};

		return module;

	}(EC.Inputs));
