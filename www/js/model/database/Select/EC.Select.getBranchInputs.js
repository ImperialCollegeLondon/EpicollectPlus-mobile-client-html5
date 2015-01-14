/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_inputs = [];
		var branch_input_options_ids = [];
		var branch_input_options = [];
		var has_jumps;
		var branch_form_name;
		var project_id;
		var form_id;
		var deferred;

		//callback triggered when all the branch_inputs for a form are fetched correctly. 'branch_inputs' contains all the branch_inputs
		var _getBranchInputsSuccessCB = function(tx) {

			console.log("TRANSACTION SELECT INPUTS SUCCESS");
			has_jumps = false;
			branch_input_options_ids.length = 0;

			//We have all the inputs, need to check if any radio, select(dropdown), checkbox input has input options
			var i;
			var iLenght = branch_inputs.length;

			//loop inputs looking for type radio, checkbox or dropdown and also to check if the form has some jumps
			for ( i = 0; i < iLenght; i++) {

				if (branch_inputs[i].type === "radio" || branch_inputs[i].type === "select" || branch_inputs[i].type === "checkbox") {
					//list which inputs have input options (the ids)
					branch_input_options_ids.push({
						"id" : branch_inputs[i]._id
					});
				}

				if (branch_inputs[i].has_jump === 1 && !has_jumps) {
					has_jumps = true;
				}
			}

			//map any option (if any) to the inputs
			if (branch_input_options_ids.length > 0) {
				//get input options
				EC.db.transaction(_getBranchInputOptionsTX, EC.Select.txErrorCB, _getBranchInputOptionsSuccessCB);
			}

			//no options to map then just render form
			else {
				deferred.resolve(branch_inputs, has_jumps);
			}

		};

		var _getBranchInputsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				branch_inputs.push(the_result.rows.item(i));
			}

			console.log(branch_inputs, true);

		};

		var _getBranchInputOptionsSuccessCB = function(the_tx) {

			//map input options to input
			var i;
			var j;
			var iLength = branch_inputs.length;
			var jLength = branch_input_options.length;

			//console.log(JSON.stringify(input_options));

			//build object with inputs data
			for ( i = 0; i < iLength; i++) {

				branch_inputs[i].options = [];

				for ( j = 0; j < jLength; j++) {

					if (branch_inputs[i]._id === branch_input_options[j].input_id) {

						branch_inputs[i].options.push({
							jump_to : branch_input_options[j].jump_to,
							jump_when : branch_input_options[j].jump_when,
							label : branch_input_options[j].label,
							ref : branch_input_options[j].ref,
							value : branch_input_options[j].value

						});

					}//if

				}//for

			}//for

			deferred.resolve(branch_inputs, has_jumps);

		};
		//_getInputOptionsSuccessCB

		var _getBranchInputOptionsTX = function(tx) {

			var i;
			var iLenght = branch_input_options_ids.length;
			var query;

			//get all input options per each input
			for ( i = 0; i < iLenght; i++) {
				query = 'SELECT * FROM ec_branch_input_options WHERE input_id=?';
				tx.executeSql(query, [branch_input_options_ids[i].id], _getBranchInputOptionsSQLSuccess, EC.Select.txErrorCB);
			}

		};

		var _getBranchInputOptionsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				branch_input_options.push(the_result.rows.item(i));
			}

		};

		var _getBranchInputsTX = function(tx) {

			//get all branch inputs (using a nested query to get form id in the database)
			var query = 'SELECT * FROM ec_branch_inputs WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) ORDER BY position';

			tx.executeSql(query, [branch_form_name, project_id], _getBranchInputsSQLSuccess, EC.Select.txErrorCB);

		};

		module.getBranchInputs = function(the_branch_form_name, the_project_id) {

			deferred = new $.Deferred();
			project_id = the_project_id;
			branch_form_name = the_branch_form_name;

			//reset branch arrays
			branch_inputs.length = 0;
			branch_input_options_ids.length = 0;
			branch_input_options.length = 0;

			//if the project is using a circular network, get all other keys for the specified form. It can be done async (or use a deferred object: todo)
			$.when(EC.Select.getBranchEntryKeys(branch_form_name, project_id)).then(function(branch_entry_keys) {

				var cached_keys;
				var form_level_keys;

				//merge keys with those already in localStorage (if we are using circular network and form level key uniqueness) avoiding duplicates
				try {
					cached_keys = JSON.parse(window.localStorage.branch_primary_keys);
				} catch(error) {
					cached_keys = [];
				}
				form_level_keys = cached_keys.concat(branch_entry_keys).unique();
				window.localStorage.branch_primary_keys = JSON.stringify(form_level_keys);

				EC.db.transaction(_getBranchInputsTX, EC.Select.txErrorCB, _getBranchInputsSuccessCB);

			});

			return deferred.promise();
		};

		return module;

	}(EC.Select));
