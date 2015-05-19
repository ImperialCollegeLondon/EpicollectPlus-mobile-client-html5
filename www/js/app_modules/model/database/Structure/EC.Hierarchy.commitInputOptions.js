/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

		var self;
		var deferred;
		var input_options;
		var inputs_IDs = [];

		var _errorCB = function(the_tx, the_result) {

			console.log(EC.Utils.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_result);
		};

		var _commitOneOption = function(the_input_id, the_ref, the_label, the_value, the_tx) {

			var query = "";
			var input_id = the_input_id;
			var ref = the_ref;
			var label = the_label;
			var value = the_value;
			var tx = the_tx;

			query = 'INSERT INTO ec_input_options (';
			query += 'input_id, ';
			query += 'ref, ';
			query += 'label, ';
			query += 'value)';
			query += 'VALUES ("';
			query += input_id + '", "';
			query += ref + '", "';
			query += label + '", "';
			query += value + '");';

			tx.executeSql(query, [], _commitInputOptionsSQLSuccess, _errorCB);
		};

		//Transaction to save each options to the db (form multiple option inputs like radio, checkbox, select)
		var _commitInputOptionsTX = function(tx) {

			var i;
			var j;
			var k;
			var iLength;
			var jLength;
			var kLength;
			var ref;
			var input_id;
			var label;
			var value;
			var num;
			var query = "";

			//loop the input_options array
			for ( i = 0, iLength = input_options.length; i < iLength; i++) {

				//get the input ID based on (input ref AND form num)
				ref = input_options[i].ref;
				num = input_options[i].num;

				//loop all the input IDs to find a match
				for ( j = 0, jLength = inputs_IDs.length; j < jLength; j++) {

					if (inputs_IDs[j].ref === ref && inputs_IDs[j].form_num === num) {

						input_id = inputs_IDs[j].id;
						break;

					}
				}//loop input_IDs

				//commit each option (IF ANY: we allow radio, checkbox and dropdown not to have any option)
				if (input_options[i].options === undefined) {
					kLength = 0;

				} else {

					//if we have only 1 option the "input_options[i].options: will be an object, not an array, so set one option manually
					if (Object.prototype.toString.call(input_options[i].options) === '[object Array]') {
						kLength = input_options[i].options.length;
					} else {
						//set length to 0 to skip the following loop
						kLength = 0;

						//set option properties as first element of input_options[i].options array
						label = input_options[i].options.label;
						value = input_options[i].options.value;

						_commitOneOption(input_id, ref, label, value, tx);
					}

				}

				//commit all options (one at a time)
				for ( k = 0; k < kLength; k++) {

					label = input_options[i].options[k].label;
					value = input_options[i].options[k].value;

					_commitOneOption(input_id, ref, label, value, tx);

				}//loop input_options.options

			}//loop input_options

		};

		var _commitInputOptionsSQLSuccess = function(the_tx, the_result) {

			//console.log(the_result);
			console.log("executeSql SUCCESS INPUT OPTIONS");

		};

		var _commitInputOptionsSuccessCB = function() {

			//reset options length
			input_options.length = 0;

			//Hierarchy structure saved to database correctly
			deferred.resolve();

		};

		module.commitInputOptions = function(the_input_options, the_inputs_ids) {

			self = this;
			deferred = new $.Deferred();
			input_options = the_input_options;
			inputs_IDs = the_inputs_ids;

			EC.db.transaction(_commitInputOptionsTX, _errorCB, _commitInputOptionsSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));
