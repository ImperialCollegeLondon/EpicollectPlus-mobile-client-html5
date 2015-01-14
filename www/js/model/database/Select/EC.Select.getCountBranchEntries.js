/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var entries = [];
		var input;
		var form_id;
		var branch_form_name;
		var entry_key;
		var count;
		var deferred;
		var hierarchy_key_value;
		var project_id;

		/*
		 * Get all entries for a form and group them by entry_key:
		 * a form have multiple entries, one per each input, and they all have the same entry_key value)
		 */
		var _getCountBranchEntriesTX = function(tx) {

			var query;

			query = 'SELECT COUNT(DISTINCT entry_key) as count FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=?';

			tx.executeSql(query, [branch_form_name, project_id, hierarchy_key_value], _getBranchEntriesSQLSuccess, EC.Select.txErrorCB);

		};

		var _getBranchEntriesSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				count = (the_result.rows.item(0).count);
			} else {
				count = 0;
			}

		};

		var _getCountBranchEntriesSuccessCB = function() {

			//resolve deferred returning total of entries
			deferred.resolve(count, input);

		};

		module.getCountBranchEntries = function(the_input, the_hierarchy_key_value, the_project_id) {

			input = the_input;
			branch_form_name = the_input.branch_form_name;
			hierarchy_key_value = the_hierarchy_key_value;
			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getCountBranchEntriesTX, EC.Select.txErrorCB, _getCountBranchEntriesSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));
