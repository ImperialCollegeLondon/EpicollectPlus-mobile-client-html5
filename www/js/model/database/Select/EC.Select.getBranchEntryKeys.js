/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var project_id;
		var entry_key;
		var entry_keys = [];
		var deferred;

		var _getEntryKeys = function(tx) {

			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?)';

			tx.executeSql(query, [branch_form_name, project_id], _getEntryKeysSQLSuccess, EC.Select.txErrorCB);

		};

		var _getEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}

		};

		var _getEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entr+key value for the specified form
		module.getBranchEntryKeys = function(the_branch_form_name, the_project_id) {

			deferred = new $.Deferred();
			branch_form_name = the_branch_form_name;
			project_id = the_project_id;
			entry_keys.length = 0;

			EC.db.transaction(_getEntryKeys, EC.Select.txErrorCB, _getEntryKeysSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
