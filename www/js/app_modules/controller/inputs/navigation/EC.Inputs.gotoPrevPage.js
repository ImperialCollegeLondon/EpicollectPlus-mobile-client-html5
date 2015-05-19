/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.gotoPrevPage = function(evt) {

			var self = this;
			var current_position = parseInt(window.localStorage.current_position, 10);
			var inputs_trail = JSON.parse(window.localStorage.inputs_trail);
			var prev_page;
			var prev_input_position = parseInt(inputs_trail[inputs_trail.length - 1].position, 10);
			var prev_input = self.getInputAt(prev_input_position);
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(window.localStorage.form_id);

			//skip prev input (from user) if it is a hidden auto genkey
			if (is_genkey_hidden && prev_input.is_primary_key === 1) {

				prev_input_position = inputs_trail[inputs_trail.length - 2].position;
				prev_input = EC.Inputs.getInputAt(prev_input_position);

				//update current input position in session (store confirm screen will get a position = array.length)
				window.localStorage.current_position = current_position - 2;

				//remove last  entry from inputs_trail
				self.popInputsTrail();

			} else {

				//update current input position in session
				window.localStorage.current_position = prev_input_position;

			}

			//remove last  entry from inputs_trail
			self.popInputsTrail();

			prev_page = EC.Const.INPUT_VIEWS_DIR + prev_input.type + EC.Const.HTML_FILE_EXT;

			EC.Routing.changePage(prev_page);

			//avoid events triggering multiple times
			evt.preventDefault();

		};

		return module;

	}(EC.Inputs));
