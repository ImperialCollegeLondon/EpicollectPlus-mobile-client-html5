/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/*
		 * get cache value from localStorage by the passed position
		 *
		 * @method getCachedInputValue
		 * @param {int} the input position attribute in the form input sequence
		 * @return {Object} {_id: <the input id>, type: <the input type>, value: <the current value cached>, position : <the input position property>}
		 */
		module.getCachedInputValue = function(the_position) {

			var values;
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
				values = JSON.parse(window.localStorage.inputs_values);

				/* if index is out of bounds return false as value cannot be found:
				 * a case scenario is when the user leaves a form half way through it but he wants to save the progress
				 * Any value not found will be saved as empty string in the db
				 */
				if (values[index] === undefined) {
					return empty_value;
				}

				//search all values where the passed position matches
				iLength = values.length;
				for ( i = 0; i < iLength; i++) {

					//if values[i] is null, this input was skipped by a jump so create an empty one
					if (values[i] === null) {
						values[i] = empty_value;
					}

					//@bug Android 2.3 :/ should be solved parsing values to integer
					if (parseInt(values[i].position, 10) === position) {

						if (window.localStorage.edit_mode) {

							window.localStorage.edit_id = values[i]._id;
							window.localStorage.edit_type = values[i].type;
						}

						//return the value object found
						return values[i];

					}

				}//end for each input values

				//return an empty value if no position match found, meaning the value was not cache because skipped by a jump
				return empty_value;

			} catch(error) {
				//Handle errors here
				return false;
			}

		};

		return module;

	}(EC.Inputs));
