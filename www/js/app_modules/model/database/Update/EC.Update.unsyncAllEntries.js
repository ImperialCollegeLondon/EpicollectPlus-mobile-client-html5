/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var forms = [];
		var deferred;
		var has_branches;
		var project_id;

		var _unsyncAllEntriesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var branch_query;

			var query = 'UPDATE ec_data SET is_data_synced=? WHERE form_id=?';
			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [0, forms[i]._id], _unsyncAllEntriesSQLSuccess, _unsyncAllEntriesErrorCB);
			}

			if (has_branches) {
				var branch_query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE form_id IN (SELECT form_id FROM ec_branch_data JOIN ec_branch_forms WHERE ec_branch_data.form_id = ec_branch_forms._id AND ec_branch_forms.project_id=?)';
				tx.executeSql(branch_query, [0, project_id], _unsyncAllBranchEntriesSQLSuccess, _unsyncAllEntriesErrorCB);
			}

		};

		var _unsyncAllEntriesSQLSuccess = function(the_tx, the_result) {
			console.log("Hierarchy entries ");
			console.log(the_result);
		};

		var _unsyncAllBranchEntriesSQLSuccess = function(the_tx, the_result) {
			console.log("Branch entries ");
			console.log(the_result);
		};

		var _unsyncAllEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncAllBrachEntriesSuccessCB = function() {
			deferred.resolve();
		};

		var _unsyncAllEntriesErrorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		module.unsyncAllEntries = function(the_forms, the_project_id) {

			forms = the_forms;
			project_id = the_project_id;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_unsyncAllEntriesTX, _unsyncAllEntriesErrorCB, _unsyncAllEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
