/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/*
		 * get cached bracnh input value from localStorage by the passed position
		 *
		 * @method getCachedBranchInputValue
		 * @param {int} the input position attribute in the form input sequence
		 * @return {Object} {_id: <the input id>, type: <the input type>, value: <the current value cached>, position : <the input position property>}
		 */
		module.getCachedInputValue = function(the_position) {

			var branch_values;
			var position = parseInt(the_position, 10);
			var index = position - 1;
			var i;
			var iLength;
			var empty_value = {
				_id : "",
				type : "",
				value : EC.Const.SKIPPED,
				position : "",
				is_primary_key : ""
			};

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_values = JSON.parse(window.localStorage.branch_inputs_values);

				//if index is out of bounds
				if (branch_values[index] === undefined) {
					return empty_value;
				}

				//search all values where the passed position matches
				iLength = branch_values.length;
				for (i = 0; i < iLength; i++) {

					//if values[i] is null, this input was skipped by a jump so create an empty one
					if (branch_values[i] === null) {

						branch_values[i] = empty_value;

					}

					//@bug on Android 2.3 :/ be careful with this comparison
					if (parseInt(branch_values[i].position, 10) === position) {

						if (window.localStorage.branch_edit_mode) {

							window.localStorage.branch_edit_id = branch_values[i]._id;
							window.localStorage.branch_edit_type = branch_values[i].type;

						}

						//return the value object found
						return branch_values[i];

					}

				}//end for each input values

				//return an empty value if no position match found, meaning the value was not cache because skipped by a jump
				return empty_value;

			} catch(error) {
				//Handle errors here
				console.log(error);
				return false;
			}

		};

		return module;

	}(EC.BranchInputs));
