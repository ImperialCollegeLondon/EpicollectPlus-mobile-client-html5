/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 *  @method amendSkippedValues. Check the inputs_trail[] against inputs_values[]
		 *  inputs_trail[] contains the inputs the user actually navigated to by jumps
		 *  inputs_values[] contains all the values for all the inputs in a form, from start to finish
		 *  Skipped inputs (by a jump) are null elements in inputs_values[], so they are marked as "skipped" by setting their value as _skipp3d_, a custom reserved word
		 *  If the primary key for the form is auto generated and hidden, it will be in input_values[] but not in inputs_trail, add it manually
		 *  inputs_values[] is then cached to locaStorage after being amended
		 */
		module.amendSkippedValues = function() {
			
			var wls = window.localStorage;
			var i;
			var j;
			var iLength;
			var jLength;
			var max_skipped_position;
			var inputs_trail = [];
			var inputs_values = [];
			var is_found;
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden();

			inputs_trail = JSON.parse(wls.inputs_trail);
			inputs_values = JSON.parse(wls.inputs_values);

			iLength = inputs_values.length;
			jLength = inputs_trail.length;

			max_skipped_position = inputs_trail[inputs_trail.length - 1].position;

			for ( i = 0; i < iLength; i++) {//for each input in inputs_values

				is_found = false;

				//jumps can generate null values in the input_values array (when entering a new entry)
				if (inputs_values[i] === null) {
					is_found = true;
					// inputs_values[i] = {
						// value : EC.Const.SKIPPED
					// };
				} else {

					for ( j = 0; j < jLength; j++) {//for each input in inputs_trail

						//check if the input values is in the input trail array OR the input value is a hidden primary key value. In both case, the value needs to be saved
						if (parseInt(inputs_values[i].position, 10) === inputs_trail[j].position || (is_genkey_hidden === 1 && parseInt(inputs_values[i].is_primary_key, 10) === 1 )) {

							is_found = true;
							break;
						}
					}// for each inputs_trail
				}

				//not found values (and null values)
				// TODO: why was I also checking for inputs_values[i].position < max_skipped_position???
				if (!is_found) {
					inputs_values[i].value = EC.Const.SKIPPED;
				}

			}//for each inputs_values

			//store the amended values in localStorage for saving
			wls.inputs_values = JSON.stringify(inputs_values);

		};

		return module;

	}(EC.Inputs));
