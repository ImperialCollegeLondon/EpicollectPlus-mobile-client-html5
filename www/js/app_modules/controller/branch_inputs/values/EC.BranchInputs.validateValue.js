/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		var _isUniqueValue = function(the_value, the_branch_form_name) {

			var cached_branch_entry_keys;
			var current_branch_form_keys;
			var i;
			var iLength;
			var value = the_value;
			var branch_form_name = the_branch_form_name;
			var unique = true;

			//get Branch primary keys
			try {
				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);
			} catch (error) {
				cached_branch_entry_keys = [];
			}

			iLength = cached_branch_entry_keys.length;
			if (iLength > 0) {

				//get primary keys for the current form
				for ( i = 0; i < iLength; i++) {

					if (cached_branch_entry_keys[i].branch_form_name === branch_form_name) {

						current_branch_form_keys = cached_branch_entry_keys[i].primary_keys;

						//check if the current value clashes a branch primary key
						if (current_branch_form_keys.indexOf(value) !== -1) {
							unique = false;
						}
					}
				}
			}

			return unique;
		};

		module.validateValue = function(the_input, the_value, the_position) {

			var self = this;
			var input = the_input;
			var current_value = the_value;
			var current_position = the_position;
			var clone_value = "";
			var is_primary_key = $('span.label').attr('data-primary-key');
			var validation = {};

			//if we need to check for a double entry, get clone value
			if (parseInt(input.has_double_check, 10) === 1) {
				clone_value = self.getCloneValue(input.type);
			}

			//validate input
			validation = EC.Utils.isValidValue(input, current_value, clone_value);

			if (!validation.is_valid) {
				//value not valid, return
				return validation;
			}

			//check if this input value is a primary key field: if it is, check uniqueness (skip when we are editing)
			if (is_primary_key === 'true' && !window.localStorage.branch_edit_mode) {

				if (!_isUniqueValue(current_value)) {

					//primary key value already exist, return
					validation = {
						is_valid : false,
						message : "Value already exists!"
					};

					//on Chrome native alert is not working: dump to console error message
					console.log("Error: value already exists");

					return validation;
				}
			}

			return validation;

		};

		return module;

	}(EC.BranchInputs));
