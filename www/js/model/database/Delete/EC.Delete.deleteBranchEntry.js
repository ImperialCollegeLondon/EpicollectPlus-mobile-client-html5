/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {"use strict";

		var self;
		var rows_to_delete;
		var deferred;

		//select and count the rows we are going to delete to be able to update the counter later
		var _deleteBranchEntryTX = function(tx) {

			var delete_branch_query = "DELETE FROM ec_branch_data WHERE _id=?";
			var i;
			var iLength = rows_to_delete.length;

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(delete_branch_query, [rows_to_delete[i]._id], _deleteBranchEntrySQLSuccessCB, _deleteBranchEntryErrorCB);
			}

			self.query_error_message = "EC.Select.deleteBranchEntry _deleteBranchEntryTX";
		};

		var _deleteBranchEntrySQLSuccessCB = function(the_tx, the_result) {
			//do nothing
		};

		var _deleteBranchEntrySuccessCB = function() {
			console.log("Branch entry deleted");

			deferred.resolve();

			//EC.Entries.deleteBranchEntryFeedback(true);
		};

		var _deleteBranchEntryErrorCB = function() {
			deferred.reject();
		};
		/**
		 * @method deleteBranchEntry Deletes all the rows belonging to a single branch entry.
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected branch entry
		 */
		module.deleteBranchEntry = function(the_rows) {

			self = this;
			rows_to_delete = the_rows;
			deferred = new $.Deferred();

			EC.db.transaction(_deleteBranchEntryTX, _deleteBranchEntryErrorCB, _deleteBranchEntrySuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
