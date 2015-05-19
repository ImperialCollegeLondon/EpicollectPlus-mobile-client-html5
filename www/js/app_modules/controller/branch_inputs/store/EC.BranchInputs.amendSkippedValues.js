/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.amendSkippedValues = function() {

			var self = this;
			var wls = window.localStorage;
			var i;
			var j;
			var iLength;
			var jLength;
			var max_skipped_position;
			var branch_inputs_trail = [];
			var branch_inputs_values = [];
			var is_found;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();

			branch_inputs_trail = JSON.parse(wls.branch_inputs_trail);
			branch_inputs_values = JSON.parse(wls.branch_inputs_values);

			iLength = branch_inputs_values.length;
			jLength = branch_inputs_trail.length;

			max_skipped_position = branch_inputs_trail[branch_inputs_trail.length - 1].position;

			for ( i = 0; i < iLength; i++) {//for each input in inputs_values

				is_found = false;

				//jumps can generate null values in the input_values array (when entering a new entry)
				if (branch_inputs_values[i] === null) {
					is_found = true;
				} else {

					for ( j = 0; j < jLength; j++) {//for each input in inputs_trail
						//check if the branch input values is in the branch input trail array OR the input value is a hidden primary key value. In both case, the value needs to be saved

						if (parseInt(branch_inputs_values[i].position, 10) === branch_inputs_trail[j].position || (is_genkey_hidden === 1 && parseInt(branch_inputs_values[i].is_primary_key, 10) === 1 )) {

							is_found = true;
							break;
						}

					}// for each inputs_trail
				}

				//not found values (and null values)
				// TODO: why was I also checking for inputs_values[i].position < max_skipped_position???
				if (!is_found) {
					branch_inputs_values[i].value = EC.Const.SKIPPED;
				}

			}//for each inputs_values

			//store the amended values in localStorage for saving
			wls.branch_inputs_values = JSON.stringify(branch_inputs_values);

		};

		return module;

	}(EC.BranchInputs));
