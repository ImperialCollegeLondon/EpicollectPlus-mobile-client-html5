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

		var deferred;
		var child_hierarchy_files;
		var child_branch_files;
		var current_child_form;

		var _errorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_error);

		};

		var _deleteChildrenEntriesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var parent;
			var select_query;
			var select_child_hierarchy_files_query;
			var select_child_branch_files_query;
			var delete_query;
			var delete_child_branches_query;

			for ( i = 0; i < iLength; i++) {

				if (entries[i].parent === "") {
					parent = entries[i].entry_key;
					//select entries first
				}
				else {
					parent = entries[i].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + entries[i].entry_key;
				}

				//count how many rows per form we are going to delete. We will need those values
				// to update the total_entries counter
				select_query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE parent=? GROUP BY entry_key";

				//do we have any media to delete for child entries?
				if (current_child_form.has_media === 1) {

					//this entry has some media to delete so we need to grab the file names and type
					select_child_hierarchy_files_query = 'SELECT value, type from ec_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value <>?';

					//get all file names before deleting
					tx.executeSql(select_child_hierarchy_files_query, [current_child_form._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectChildHierarchyFilesSQLSuccessCB, _errorCB);
				}

				//delete all branches linked to this entry key (if any)
				if (current_child_form.has_branches) {

					//are there media files for the branches?
					select_child_branch_files_query = 'SELECT value,type from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
					delete_child_branches_query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";

					tx.executeSql(select_child_branch_files_query, [entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectChildBranchFilesSQLSuccessCB, _errorCB);
					tx.executeSql(delete_child_branches_query, [entry_key], _deleteBranchEntrySQLSuccessCB, _errorCB);
				}

				//delete all rows matching parent
				delete_query = "DELETE FROM ec_data WHERE parent=?";

				tx.executeSql(select_query, [parent], _selectChildrenEntriesSQLSuccessCB, _errorCB);
				tx.executeSql(delete_query, [parent], _deleteChildrenEntriesSQLSuccessCB, _errorCB);

			}

		};

		var _deleteChildrenEntriesSuccessCB = function() {

			var files = [];

			//delete children entries if any
			if (children_forms.length > 0) {

				current_child_form = children_forms.shift();

				EC.db.transaction(_deleteChildrenEntriesTX, _errorCB, _deleteChildrenEntriesSuccessCB);

			}
			else {

				files = child_hierarchy_files.concat(child_branch_files);

				//remove files if any
				if (files.length > 0) {
					$.when(EC.File.remove(project_name, files)).then(function() {
						console.log(project_name + " media deleted");
						//update entries counters
						_updateEntriesCount();
					});
				}
				else {
					//update counters
					_updateEntriesCount();
				}
			}
		};
		
		var _selectChildrenEntriesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//reset entries
			entries.length = 0;

			for ( i = 0; i < iLength; i++) {
				entries.push(the_result.rows.item(i));
			}

			if (iLength > 0) {
				counters.push({
					form_id : entries[0].form_id,
					amount : entries.length
				});
			}

			console.log(entries);

			//delete all branches linked to the children entry keys (if any)
			if (has_branches) {
				EC.db.transaction(_deleteBranchEntryTX, _errorCB, _deleteBranchEntrySuccessCB);
			}

		};
		
		var _selectChildBranchFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				child_branch_files.push(the_result.rows.item(i));
			}

			console.log("Child hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(hierarchy_files));

		};
		
		var _selectChildHierarchyFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				child_hierarchy_files.push(the_result.rows.item(i));
			}

			console.log("Child hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(hierarchy_files));
		};

		
		var _deleteChildrenEntriesSQLSuccessCB = function(the_tx, the_result) {
		};


		module.deleteChildEntry = function(the_current_child_form) {

			deferred = new $.Deferred();
			current_child_form = the_current_child_form;
			child_hierarchy_files = [];
			child_branch_files = [];

			EC.db.transaction(_deleteChildrenEntriesTX, _errorCB, _deleteChildrenEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Delete));
