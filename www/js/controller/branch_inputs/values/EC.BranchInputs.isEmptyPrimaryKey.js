/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		/**
		 * @method isEmptyPrimaryKey: Check whether a primary key exists in the array of branch values we are abut to save.
		 */
		module.isEmptyPrimaryKey = function() {

			var is_empty_primary_key = true;
			var branch_inputs_values = JSON.parse(window.localStorage.branch_inputs_values);
			var i;
			var iLength;

			if (branch_inputs_values) {
				iLength = branch_inputs_values.length;
				for ( i = 0; i < iLength; i++) {

					if (branch_inputs_values[i].is_primary_key === 1) {
						is_empty_primary_key = (branch_inputs_values[i].value === "") ? true : false;
					}
				}
			}

			return is_empty_primary_key;
		};

		return module;

	}(EC.BranchInputs));
