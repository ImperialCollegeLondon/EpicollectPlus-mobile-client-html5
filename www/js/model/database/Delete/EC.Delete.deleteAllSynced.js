/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var project_name;
		var project_id;
		var forms;
		var files;
		var branch_files;
		var self;
		var counter;
		var rows_deleted = [];
		var deferred;
		var has_branches;

		var _deleteAllSyncedTX = function(tx) {

			var i;
			var iLength = forms.length;
			var select_files_query = "";
			var delete_query = "";
			var branch_select_files_query;
			var branch_delete_query;

			counter = 0;
			rows_deleted.length = 0;
			files = [];
			branch_files = [];

			for ( i = 0; i < iLength; i++) {

				rows_deleted[counter] = {};
				rows_deleted[counter].form_id = forms[i]._id;

				delete_query = "DELETE FROM ec_data WHERE form_id=? AND is_data_synced=?";

				if (forms[i].has_media === 1) {

					//this form has some media to delete so we need to delete only the rows which are
					// BOTH data and media synced
					select_files_query = "SELECT value,type from ec_data WHERE form_id=? AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?)";

					//get all file names before deleting
					tx.executeSql(select_files_query, [forms[i]._id, 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _selectFilesSQLSuccessCB, EC.Delete.errorCB);
					tx.executeSql(delete_query, [forms[i]._id, 1], _deleteAllSyncedSQLSuccessCB, EC.Delete.errorCB);

				}
				else {

					//no media for this form, go ahead and delete entries which are "data" synced
					// only
					tx.executeSql(delete_query, [forms[i]._id, 1], _deleteAllSyncedSQLSuccessCB, EC.Delete.errorCB);
				}

			}

			if (has_branches) {

				//some branches with media to delete, same approach: cache the file names then
				// delete
				branch_select_files_query = "SELECT value,type from ec_branch_data WHERE form_id IN (SELECT _id FROM branch_forms WHERE project_id=? AND has_media=?) AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?)";
				branch_delete_query = "DELETE FROM ec_branch_data WHERE form_id IN (SELECT _id FROM branch_forms WHERE project_id=?) AND is_data_synced=?";

				tx.executeSql(branch_select_files_query, [project_id, 1, 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _selectBranchFilesSQLSuccessCB, EC.Delete.errorCB);
				tx.executeSql(branch_delete_query, [project_id, 1], _deleteAllBranchesSyncedSQLSuccessCB, EC.Delete.errorCB);

			}

		};

		var _selectFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}

			console.log("files:" + JSON.stringify(files));

		};

		var _selectBranchFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				branch_files.push(the_result.rows.item(i));
			}

			console.log("files:" + JSON.stringify(branch_files));

		};

		var _deleteAllSyncedSQLSuccessCB = function(the_tx, the_result) {

			console.log("_deleteAllSyncedSQLSuccessCB");

			rows_deleted[counter].total_deleted = the_result.rowsAffected;
			counter++;

			console.log(the_result);
			console.log(the_tx);

		};

		var _deleteAllBranchesSyncedSQLSuccessCB = function(the_tx, the_result) {

			//TODO: check this, but I think we do not need to count how many branches have
			// been deleted as they are linked to its hierarchy entry that gets deleted
			// anyway
			console.log("_deleteAllBranchesSyncedSQLSuccessCB");
			console.log(the_result);
			console.log(the_tx);

		};

		/**
		 * After successful rows deletion, resolve the deferred AFTER the total of
		 * hierarchy entries is updated AND all the files (if any) are deleted
		 */
		var _deleteAllSyncedTXSuccessCB = function() {

			console.log(self);
			var forms = JSON.parse(window.localStorage.forms);
			var file_deleted_defr = new $.Deferred();
			var count_synced_defr = new $.Deferred();

			//update total of entries in ec_forms table
			$.when(EC.Update.countSyncedDeleted(rows_deleted, forms)).then(function() {
				count_synced_defr.resolve();
			});

			//remove files (if any)
			if (files.length > 0) {
				$.when(EC.File.remove(project_name, files)).then(function() {
					file_deleted_defr.resolve();
				});
			}
			else {
				file_deleted_defr.resolve();
			}

			//both the above actions completed, resolve deferred
			$.when(file_deleted_defr, count_synced_defr).then(function() {
				deferred.resolve();
			});

		};

		module.deleteAllSynced = function(the_project_id, the_project_name, the_forms) {

			self = this;
			project_name = the_project_name;
			project_id = the_project_id;
			forms = the_forms;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_deleteAllSyncedTX, EC.Delete.errorCB, _deleteAllSyncedTXSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));

