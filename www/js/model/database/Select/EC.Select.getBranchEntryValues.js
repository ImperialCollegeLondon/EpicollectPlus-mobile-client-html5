/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var hierarchy_entry_key_value;
		var entry_key;
		var project_id;
		var values = [];
		var deferred;

		var _getBranchEntryValuesTX = function(tx) {

			//get all entry values
			var query = 'SELECT * FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND entry_key=? AND hierarchy_entry_key_value =? ORDER BY position';

			tx.executeSql(query, [branch_form_name, project_id, entry_key, hierarchy_entry_key_value], _getBranchEntryValuesSQLSuccess, EC.Select.errorCB);

		};
		//_getEntryValues

		var _getBranchEntryValuesSQLSuccess = function(the_tx, the_result) {

			var i;
			var index;
			var iLenght = the_result.rows.length;
			var input_id = "";
			var current_input_id;
			var prev_value = [];
			var prev_obj;
			var new_obj;
			var new_object = {};
			var string;

			//build object with entry values
			for ( i = 0; i < iLenght; i++) {

				current_input_id = the_result.rows.item(i).input_id;

				values.push(the_result.rows.item(i));

			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT BRANCH ENTRY VALUES SUCCESS");

		};

		var _getBranchEntryValuesSuccessCB = function(the_tx) {

			//Render entry values list
			deferred.resolve(values.slice(0));
			values.length = 0;

		};

		module.getBranchEntryValues = function(the_project_id, the_branch_form_name, the_entry_key, the_hierarchy_entry_key_value) {

			branch_form_name = the_branch_form_name;
			entry_key = the_entry_key;
			project_id = the_project_id;
			hierarchy_entry_key_value = the_hierarchy_entry_key_value;
			deferred = new $.Deferred();

			//clear values array before requesting new values
			values.length = 0;

			EC.db.transaction(_getBranchEntryValuesTX, EC.Select.errorCB, _getBranchEntryValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
