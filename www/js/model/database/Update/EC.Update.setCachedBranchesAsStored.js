/*jslint vars: true, nomen: true, plusplus: true*/
var EC = EC || {};
EC.Update = EC.Update || {};

EC.Update = ( function(module) {

		var cached_branch_entry_keys = [];
		var main_form_key_value;
		var project_id;
		var deferred;

		var _updateStoredFlagTX = function(tx) {

			var i;
			var j;
			var iLength;
			var jLength;
			var query;
			var branch_form_name;

			iLength = cached_branch_entry_keys.length;
			for ( i = 0; i < iLength; i++) {

				branch_form_name = cached_branch_entry_keys[i].branch_form_name;
				jLength = cached_branch_entry_keys[i].primary_keys.length;

				for ( j = 0; j < jLength; j++) {
					query = 'UPDATE ec_branch_data SET is_stored=? WHERE form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=? AND entry_key=?';
					tx.executeSql(query, [1, branch_form_name, project_id, main_form_key_value, cached_branch_entry_keys[i].primary_keys[j]], _updateStoredFlagSQLSuccess, _errorCB);
				}

			}

		};

		var _updateStoredFlagSuccessCB = function() {
			console.log("UPDATE BRANCH STORED FLAG  SUCCESS");
			
			//All good, show positive feedback to user after insertion of new antry
			deferred.resolve(main_form_key_value);

		};

		var _updateStoredFlagSQLSuccess = function() {
			console.log("UPDATE BRANCH STORED FLAG SQL SUCCESS");
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		/*
		 */
		module.setCachedBranchesAsStored = function(the_cached_branch_entry_keys, the_main_form_key_value, the_project_id) {

			cached_branch_entry_keys = the_cached_branch_entry_keys;
			main_form_key_value = the_main_form_key_value;
			project_id = the_project_id;
			deferred = $.Deferred();

			EC.db.transaction(_updateStoredFlagTX, _errorCB, _updateStoredFlagSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
