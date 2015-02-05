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

		var rows_to_delete;
		var entry_key;
		var current_form;
		var children_forms = [];
		var current_child_form;
		

		var hierarchy_files = [];
		var branch_files = [];
		var has_branches;
		var self;
		var deferred;
		var project_name;

		/* select and count the rows we are going to delete to be able to update the
		 * entries counters later, the one we use to show the entries total per each form
		 * on the form list page
		 * This is mainly done for performance reason, as querying COUNT per each form
		 * each time the form list view is called was a bit heavy
		 * Doing this way we have a column "entries_total" per each form and we keep that
		 * value updated accordingly
		 */
		var _deleteEntryTX = function(tx) {

			var delete_query;
			var delete_branches_query;
			var select_query;
			var select_hierarchy_files_query;
			var select_branch_files_query;
			var i;
			var iLength = rows_to_delete.length;

			//select COUNT(*) and rows we are going to delete: we do this to update the entry
			// counter after deletion
			select_query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE entry_key=? GROUP BY form_id";

			//delete all rows matching entry_key
			delete_query = "DELETE FROM ec_data WHERE entry_key=?";

			if (current_form.has_media === 1) {

				//this entry has some media to delete so we need to delete
				select_hierarchy_files_query = 'SELECT value from ec_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value <>?';

				//get all file names before deleting
				tx.executeSql(select_hierarchy_files_query, [current_form._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectHierarchyFilesSQLSuccessCB, EC.Delete.errorCB);

			}

			//delete all branches linked to this entry key (if any)
			if (has_branches) {

				//are there media files for the branches?
				select_branch_files_query = 'SELECT value from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
				delete_branches_query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";

				tx.executeSql(select_branch_files_query, [entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectBranchFilesSQLSuccessCB, EC.Delete.errorCB);
				tx.executeSql(delete_branches_query, [entry_key], _deleteBranchEntrySQLSuccessCB, EC.Delete.errorCB);
			}

			tx.executeSql(select_query, [entry_key], _selectEntriesSQLSuccessCB, EC.Delete.errorCB);
			tx.executeSql(delete_query, [entry_key], _deleteEntrySQLSuccessCB, EC.Delete.errorCB);

		};

		var _selectBranchFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				branch_files.push(the_result.rows.item(i).value);
			}

			console.log("Branch files: ****************************************");
			console.log("files:" + JSON.stringify(branch_files));

		};

		var _selectHierarchyFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				hierarchy_files.push(the_result.rows.item(i).value);
			}

			console.log("Hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(hierarchy_files));
		};

		var _deleteBranchEntrySQLSuccessCB = function(the_tx, the_result) {
		};

		var _selectEntriesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//cache entries
			for ( i = 0; i < iLength; i++) {
				self.deletion_entries.push(the_result.rows.item(i));
			}

			//update counters
			self.deletion_counters.push({
				form_id : self.deletion_entries[0].form_id,
				amount : self.deletion_entries.length
			});

			console.log(self.deletion_entries);
		};

		var _countEntriesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				self.deletion_entries.push(the_result.rows.item(i));
			}

		};

		var _deleteEntrySQLSuccessCB = function(the_tx, the_result) {
			//do nothing
		};

		var _updateEntriesCount = function() {

			var i;
			var iLength = self.deletion_counters.length;
			var current_count = self.deletion_counters.shift();

			console.log("self.deletion_counters *************");
			console.log(self.deletion_counters);

			EC.Update.updateHierarchyEntriesCounter(null, current_count.form_id, current_count.amount, EC.Const.DELETE_SINGLE_ENTRY, self.deletion_counters);

		};

		var _deleteEntrySuccessCB = function() {

			rows_to_delete.length = 0;
			var files = [];

			//delete children recursively if any
			if (children_forms.length > 0) {

				current_child_form = children_forms.shift();

				EC.db.transaction(_deleteChildrenEntriesTX, EC.Delete.errorCB, _deleteChildrenEntriesSuccessCB);

			}
			else {

				//delete all the files (hierarchy and branches)

				files = hierarchy_files.concat(branch_files);

				if (files.length > 0) {
					$.when(EC.File.remove(project_name, files)).then(function() {

						console.log(project_name + " media deleted");

					});
				}

				//update counters
				_updateEntriesCount();

			}

		};

		var _deleteChildrenEntriesTX = function(tx) {

			var i;
			var iLength = self.deletion_entries.length;
			var parent;
			var select_query;
			var delete_query;

			self.query_error_message = "EC.Select.deleteEntry _deleteChildrenEntriesTX";

			for ( i = 0; i < iLength; i++) {

				if (self.deletion_entries[i].parent === "") {

					parent = self.deletion_entries[i].entry_key;

					//select entries first
				}
				else {

					parent = self.deletion_entries[i].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + self.deletion_entries[i].entry_key;

				}

				//count how many rows per form we are going to delete. We will need those values
				// to update the total_entries counter
				select_query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE parent=? GROUP BY entry_key";

				//delete all rows matching parent
				delete_query = "DELETE FROM ec_data WHERE parent=?";

				tx.executeSql(select_query, [parent], _selectChildrenEntriesSQLSuccessCB, EC.Delete.errorCB);
				tx.executeSql(delete_query, [parent], _deleteChildrenEntriesSQLSuccessCB, EC.Delete.errorCB);

			}//for each children

		};

		var _deleteChildrenEntriesSuccessCB = function() {

			//delete children entries if any
			if (children_forms.length > 0) {

				current_child_form = children_forms.shift();

				EC.db.transaction(_deleteChildrenEntriesTX, EC.Delete.errorCB, _deleteChildrenEntriesSuccessCB);

			}
			else {

				//update counters
				_updateEntriesCount();

			}

		};

		var _selectChildrenEntriesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//reset entries
			self.deletion_entries.length = 0;

			for ( i = 0; i < iLength; i++) {
				self.deletion_entries.push(the_result.rows.item(i));
			}

			if (iLength > 0) {
				self.deletion_counters.push({
					form_id : self.deletion_entries[0].form_id,
					amount : self.deletion_entries.length
				});
			}

			console.log(self.deletion_entries);

			//delete all branches linked to the children entry keys (if any)
			if (has_branches) {
				EC.db.transaction(_deleteBranchEntryTX, EC.Delete.errorCB, _deleteBranchEntrySuccessCB);
			}

		};

		//delete all branch entries per each hierarchy netry key
		var _deleteBranchEntryTX = function(tx) {

			var i;
			var iLength = self.deletion_entries.length;
			var delete_branches_query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";
			self.query_error_message = "EC.Select.deleteEntry _deleteBranchEntryTX";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(delete_branches_query, [self.deletion_entries[i].entry_key], _deleteBranchEntrySQLSuccessCB, EC.Delete.errorCB);
			}

		};

		var _deleteBranchEntrySuccessCB = function() {
			console.log("Branch entry deleted");
		};

		var _deleteChildrenEntriesSQLSuccessCB = function(the_tx, the_result) {
		};

		/**
		 * @method deleteEntry Deletes all the rows belonging to a single entry. It will
		 * also delete all the children entries and branch entries linked, plus all the
		 * files associated with these
		 * entries
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of
		 * objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected entry
		 * @param {Object} the_children_forms The children forms structure as an array of
		 * objects
		 */
		module.deleteEntry = function(the_project_name, the_rows, the_entry_key, the_current_form_id, the_children_forms) {

			self = this;
			deferred = new $.Deferred();
			rows_to_delete = the_rows;
			entry_key = the_entry_key;
			children_forms = the_children_forms;
			has_branches = EC.Utils.projectHasBranches();
			current_form = EC.Utils.getFormByID(the_current_form_id);
			project_name = the_project_name;
			hierarchy_files = [];
			branch_files = [];
			self.deletion_counters = [];
			self.deletion_entries = [];

			EC.db.transaction(_deleteEntryTX, EC.Delete.errorCB, _deleteEntrySuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Delete));
