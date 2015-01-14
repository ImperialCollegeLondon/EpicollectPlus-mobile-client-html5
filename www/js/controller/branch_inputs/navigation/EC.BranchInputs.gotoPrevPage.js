/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.gotoPrevPage = function(evt) {

			var self = this;
			var branch_current_position = parseInt(window.localStorage.branch_current_position, 10);
			var branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);
			var prev_page;
			var prev_input_position = branch_inputs_trail[branch_inputs_trail.length - 1].position;
			var prev_input = self.getInputAt(prev_input_position);
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			//skip prev input (from user) if it is a hidden auto genkey
			if (is_genkey_hidden && prev_input.is_primary_key === 1) {

				prev_input_position = branch_inputs_trail[branch_inputs_trail.length - 2].position;
				prev_input = self.getInputAt(prev_input_position);

				//update current input position in session (store confirm screen will get a position = array.length)
				window.localStorage.branch_current_position = branch_current_position - 2;

				//remove last  entry from branch_inputs_trail
				self.popInputsTrail();

			} else {

				//update current input position in session
				window.localStorage.branch_current_position = prev_input_position;

			}

			//remove last  entry from branch_inputs_trail
			self.popInputsTrail();

			prev_page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_PREFIX + prev_input.type + EC.Const.HTML_FILE_EXT;

			EC.Routing.changePage(prev_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};

		return module;

	}(EC.BranchInputs));
