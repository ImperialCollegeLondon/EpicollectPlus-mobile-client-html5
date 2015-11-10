/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Branch
 *
 */

var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function(module) {"use strict";

		var self;
		//store input values object
		var branch_input_options;

		var branch_inputs_IDs = [];

		//Transaction to save each options to the db (form multiple option branch_inputs like radio, checkbox, select)
	var _commitBranchInputOptionsTX = function(tx) {

			var i;
			var j;
			var k;
			var iLength;
			var jLength;
			var kLength;
			var ref;
			var branch_input_id;
			var label;
			var value;
			var num;
			var query;

			//loop the branch_input_options array
			for ( i = 0, iLength = branch_input_options.length; i < iLength; i++) {

				//get the branch_input ID based on (branch_input ref AND form num)
				ref = branch_input_options[i].ref;
				num = branch_input_options[i].num;

				//loop all the branch_input IDs to find a match
				for ( j = 0, jLength = branch_inputs_IDs.length; j < jLength; j++) {

					if (branch_inputs_IDs[j].ref === ref && branch_inputs_IDs[j].form_num === num) {

						branch_input_id = branch_inputs_IDs[j].id;
						break;

					}
				}//loop branch_input_IDs

				//commit each option (IF ANY: we allow radio, checkbox and dropdown not to have any option)
				if (branch_input_options[i].options === undefined) {
					kLength = 0;

				} else {

					kLength = branch_input_options[i].options.length;
				}

				for ( k = 0; k < kLength; k++) {

					label = branch_input_options[i].options[k].label;
					value = branch_input_options[i].options[k].value;

					query = 'INSERT INTO ec_branch_input_options (';
					query += 'input_id, ';
					query += 'ref, ';
					query += 'label, ';
					query += 'value)';
					query += 'VALUES ("';
					query += branch_input_id + '", "';
					query += ref + '", "';
					query += label + '", "';
					query += value + '");';

					tx.executeSql(query, [], _commitBranchInputOptionsSQLSuccess, self.errorCB);

				}//loop branch_input_options.options

			}//loop branch_input_options

		};

		var _commitBranchInputOptionsSQLSuccess = function(the_tx, the_result) {

			//console.log(the_result);
			console.log("executeSql SUCCESS BRANCH INPUT OPTIONS");

		};

		var _commitBranchInputOptionsSuccessCB = function() {

			//reset options length
			branch_input_options.length = 0;

			//Branch structure saved to database correctly, trigger custom event
			$(document).trigger('BranchModelReady');
			console.log("BranchModelReady");

		};

		module.commitBranchInputOptions = function(the_brach_input_options, the_branch_inputs_ids) {

			self = this;
			branch_input_options = the_brach_input_options;
			branch_inputs_IDs = the_branch_inputs_ids;

			EC.db.transaction(_commitBranchInputOptionsTX, self.errorCB, _commitBranchInputOptionsSuccessCB);

		};

		return module;

	}(EC.Branch));
