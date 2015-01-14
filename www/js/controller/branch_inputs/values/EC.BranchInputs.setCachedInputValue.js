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

		/**
		 * @method setCachedBranchInputValue Set the current branch input value in localStorage, in the array branch_inputs_values
		 *
		 * (the value is then fetched from localStorage when the user navigate the branch form inputs back and forth
		 * and displayed on screen)
		 */

		module.setCachedInputValue = function(the_value, the_position, the_type, is_primary_key_flag) {

			var wls = window.localStorage;
			var branch_values;
			var value = the_value;
			var checkbox_values = [];
			var position = the_position;
			var index = position - 1;
			var type;
			var _id;
			var is_primary_key = is_primary_key_flag;
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var i;
			var iLength;

			if (wls.branch_edit_mode) {

				_id = wls.branch_edit_id;
				type = wls.branch_edit_type;

			} else {

				_id = '';
				type = the_type;

			}

			//if the value is an object from either dropdown or radio inputs, cache the label only
			if (type === EC.Const.DROPDOWN || type === EC.Const.RADIO) {
				value = value.value;
			}

			//if the value is an array from checkboxes, cache an array of the labels
			if (type === EC.Const.CHECKBOX) {

				//if any checkbox was selected, get it, otherwise do nothing and let the value be EC.Const.NO_OPTION_SELECTED
				if (value !== EC.Const.NO_OPTION_SELECTED) {

					iLength = value.length;
					for ( i = 0; i < iLength; i++) {
						checkbox_values.push(value[i].value);
					}

					value = checkbox_values;
				}
			}

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_values = JSON.parse(wls.branch_inputs_values);
			} catch(error) {
				//Handle errors here
				branch_values = [];
			}

			//TODO: check against values length??? try when hidden key is last element of the form
			if (branch_values[index] !== null && index < branch_values.length) {

				//if the values already is cached in branch_inputs_values AND it is a primary_key AND it is a hidden auto generated key, do not override it but use that same value
				//This happens when the user is editing a branch form with an autogen key hidden, we do no want to override it
				if (branch_values[index].is_primary_key === 1 && is_genkey_hidden === 1) {
					value = branch_values[index].value;
				} else {

					branch_values[index] = {
						_id : _id,
						type : type,
						value : value,
						position : position,
						is_primary_key : is_primary_key
					};
				}

			} else {

				branch_values[index] = {
					_id : _id,
					type : type,
					value : value,
					position : position,
					is_primary_key : is_primary_key
				};
			}

			wls.branch_inputs_values = JSON.stringify(branch_values);
			console.log("branch_input_values: " + wls.branch_inputs_values, true);

		};

		return module;

	}(EC.BranchInputs));
