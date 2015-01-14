/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *	@module EC
 @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareFirstInput = function(the_first_input) {

			var self = this;
			var first_input_position = 1;
			var branch_input = the_first_input;
			var page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + branch_input.type + EC.Const.HTML_FILE_EXT;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			//set array to keep track of input navigation (get pre-built one when editing)
			if (!window.localStorage.branch_edit_mode) {
				window.localStorage.branch_inputs_trail = [];
			} else {
				//update inputs trail to remove all the elements past the current edit position
				self.spliceInputsTrail(window.localStorage.branch_edit_position);
			}

			//update current position in session depending on mode
			window.localStorage.branch_current_position = (window.localStorage.branch_edit_mode) ? window.localStorage.branch_edit_position : first_input_position;

			/*
			 * If if the genkey hidden flag is set to 1 and the input is a primary key input, do not render this input on screen but:
			 *
			 * - just cache it with an auto genkey in localStorage if we are entering a new entry
			 * - do nothing if we are editing, ad the inputs_values array will be set already (it is set when listing the entry values)
			 */
			if (is_genkey_hidden === 1 && branch_input.is_primary_key === 1) {

				//skip input
				window.localStorage.branch_current_position = first_input_position + 1;

				//if we are entering a new entry add an auto generated key in input_values
				if (!window.localStorage.branch_edit_mode) {
					window.localStorage.branch_inputs_values = JSON.stringify([{
						_id : "",
						type : "",
						value : EC.Utils.getGenKey(),
						position : 1,
						is_primary_key : 1
					}]);
				}
				//get next input to set page we have to go to (first_input_position is equal to current_position-1, so...)
				branch_input = self.branch_inputs[first_input_position];
				page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + branch_input.type + EC.Const.HTML_FILE_EXT;
			}

			EC.Routing.changePage(page);
		};

		return module;

	}(EC.BranchInputs));
