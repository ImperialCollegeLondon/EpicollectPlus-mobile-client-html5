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

		module.setCachedInputValue = function(the_value, the_position, the_type, is_primary_key_flag) {
			
			var wls = window.localStorage;
			var values;
			var value = the_value;
			var checkbox_values = [];
			var position = parseInt(the_position, 10);
			var index = position - 1;
			var type;
			var _id;
			var is_primary_key = is_primary_key_flag;
			var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(window.localStorage.form_id);
			var i;
			var iLength;

			if (wls.edit_mode) {

				_id = wls.edit_id;
				type = wls.edit_type;

			} else {

				_id = '';
				type = the_type;

			}

			//if the value is an object from either dropdown or radio inputs, cache the value only (index is needed only for jumps)
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
				values = JSON.parse(wls.inputs_values);

			} catch(error) {
				//Handle errors here
				values = [];
			}
			
			//TODO: check against values length??? try when hidden key is last element of the form
			if (values[index] !== null && index < values.length) {

				//if the values already is cached in inputs_values AND it is a primary_key AND it is a hidden auto generated key, do not override it but use that same value
				//This happens when the user is editing a form with an autogen key hidden, we do no want to override it
				if (values[index].is_primary_key === 1 && is_genkey_hidden === 1) {
					value = values[index].value;
				} else {

					values[index] = {
						_id : _id,
						type : type,
						value : value,
						position : position,
						is_primary_key : is_primary_key
					};
				}

			} else {

				values[index] = {
					_id : _id,
					type : type,
					value : value,
					position : position,
					is_primary_key : is_primary_key
				};
			}

			wls.inputs_values = JSON.stringify(values);
			console.log("input_values: " + wls.inputs_values);

		};

		return module;

	}(EC.Inputs));
