/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var inputs = [];
		var input_options_ids = [];
		var input_options = [];
		var has_jumps;
		var deferred;

		//callback triggered when all the inputs for a form are fetched correctly. 'inputs' contains all the inputs
		var _getInputsSuccessCB = function(tx) {

			console.log("TRANSACTION SELECT INPUTS SUCCESS");
			has_jumps = false;
			input_options_ids.length = 0;

			//We have all the inputs, need to check if any radio, select(dropdown), checkbox input has input options
			var i;
			var iLenght = inputs.length;

			//loop inputs looking for type radio, checkbox or dropdown and also to check if the form has some jumps
			for ( i = 0; i < iLenght; i++) {

				if (inputs[i].type === "radio" || inputs[i].type === "select" || inputs[i].type === "checkbox") {

					//list which inputs have input options (the ids)
					input_options_ids.push({
						"id" : inputs[i]._id
					});

				}

				if (inputs[i].has_jump === 1 && !has_jumps) {

					has_jumps = true;
				}

			}

			//map any option (if any) to the inputs
			if (input_options_ids.length > 0) {

				//console.log(JSON.stringify(input_options_ids));

				//get input options
				EC.db.transaction(_getInputOptionsTX, EC.Select.txErrorCB, _getInputOptionsSuccessCB);

			}
			//no options to map then just render form
			else {
				//resolve query
				deferred.resolve(inputs, has_jumps);
			}
		};

		var _getInputsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				inputs.push(the_result.rows.item(i));
			}
		};

		var _getInputOptionsSuccessCB = function(the_tx) {

			//map input options to input
			var i;
			var j;
			var iLength = inputs.length;
			var jLength = input_options.length;

			//build object with inputs data
			for ( i = 0; i < iLength; i++) {

				inputs[i].options = [];

				for ( j = 0; j < jLength; j++) {

					if (inputs[i]._id === input_options[j].input_id) {

						inputs[i].options.push({
							label : input_options[j].label,
							ref : input_options[j].ref,
							value : input_options[j].value
						});

					}//if

				}//for

			}//for

			//resolve query
			deferred.resolve(inputs, has_jumps);
		};
		//_getInputOptionsSuccessCB

		var _getInputOptionsTX = function(tx) {

			var i;
			var iLenght = input_options_ids.length;
			var query;

			//get all input options per each input
			for ( i = 0; i < iLenght; i++) {
				query = 'SELECT * FROM ec_input_options WHERE input_id=?';
				tx.executeSql(query, [input_options_ids[i].id], _getInputOptionsSQLSuccess, EC.Select.txErrorCB);
			}

		};

		var _getInputOptionsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with inputs data
			for ( i = 0; i < iLenght; i++) {
				input_options.push(the_result.rows.item(i));
			}

		};

		var _getInputsTX = function(tx) {

			var query = 'SELECT * FROM ec_inputs WHERE form_id=? ORDER BY position';
			tx.executeSql(query, [form_id], _getInputsSQLSuccess, EC.Select.txErrorCB);
		};

		module.getInputs = function(the_form_id) {

			deferred = new $.Deferred();
			form_id = the_form_id;

			inputs.length = 0;
			input_options_ids.length = 0;
			input_options.length = 0;

			//if the project is using a circular network, get all other keys for the specified form to avoid entering the same primary key value for a form of the same hierarchy level
			$.when(EC.Select.getEntryKeys(form_id)).then(function(entry_keys) {

				var cached_keys;
				var form_level_keys;

				//merge keys with those already in localStorage (if we are using circular network and form level key uniqueness) avoiding duplicates
				try {
					cached_keys = JSON.parse(window.localStorage.primary_keys);
				} catch(error) {
					cached_keys = [];
				}
				form_level_keys = cached_keys.concat(entry_keys).unique();
				window.localStorage.primary_keys = JSON.stringify(form_level_keys);

				EC.db.transaction(_getInputsTX, EC.Select.txErrorCB, _getInputsSuccessCB);

			});

			return deferred.promise();

		};

		return module;

	}(EC.Select));
