/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var rows_to_unsync;
		var self;
		var has_branches;
		var branch_form_names;
		var project_id;
		var entry_key;
		var deferred;

		var _unsyncOneHierarchyEntryTX = function(tx) {

			var update_query = 'UPDATE ec_data SET is_data_synced=? WHERE _id=?';
			var i;
			var iLength = rows_to_unsync.length;

			//unsync all rows
			for ( i = 0; i < iLength; i++) {

				//if we have branches, cache branch form names (if any, as the has_braches flag is at project level and we might not have branches for this hierarchy form)
				if (has_branches) {

					if (rows_to_unsync[i].type === EC.Const.BRANCH) {

						branch_form_names.push(rows_to_unsync[i].value.branch_form_name);

					}

				}

				tx.executeSql(update_query, [0, rows_to_unsync[i]._id], _unsyncOneHierarchyEntrySQLSuccess, _unsyncOneHierarchyEntryErrorCB);
			}

		};

		var _unsyncOneHierarchyEntrySQLSuccess = function(the_tx, the_result) {

			console.log(the_result, false);

		};

		var _unsyncOneHierarchyEntrySuccessCB = function() {

			rows_to_unsync.length = 0;

			//TODO:unsync any branches for this hierarchy entry
			if (has_branches && branch_form_names.length > 0) {
				EC.db.transaction(_unsyncBranchEntriesTX, _unsyncOneHierarchyEntryErrorCB, _unsyncBranchEntriesSuccessCB);
			} else {

				deferred.resolve();

			}

		};

		var _unsyncBranchEntriesTX = function(tx) {

			var update_query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND hierarchy_entry_key_value=?';
			var i;
			var iLength = branch_form_names.length;

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(update_query, [0, branch_form_names[i], project_id, entry_key], _unsyncBranchEntriesSQLSuccess, _unsyncOneHierarchyEntryErrorCB);
			}

		};

		var _unsyncBranchEntriesSQLSuccess = function(the_tx, the_result) {
		};

		var _unsyncBranchEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncOneHierarchyEntryErrorCB = function() {
			deferred.reject();
		};

		module.unsyncOneHierarchyEntry = function(the_rows, the_entry_key, the_project_id) {

			self = this;
			has_branches = EC.Utils.projectHasBranches();
			rows_to_unsync = the_rows;
			entry_key = the_entry_key;
			project_id = the_project_id;
			branch_form_names = [];
			deferred = new $.Deferred();

			EC.db.transaction(_unsyncOneHierarchyEntryTX, _unsyncOneHierarchyEntryErrorCB, _unsyncOneHierarchyEntrySuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
