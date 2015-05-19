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

		var self;
		var rows_to_delete;
		var deferred;
		var media_types;

		//select and count the rows we are going to delete to be able to update the
		// counter later
		var _deleteBranchEntryTX = function(tx) {

			var query = "DELETE FROM ec_branch_data WHERE _id=?";
			var i;
			var iLength = rows_to_delete.length;

			for ( i = 0; i < iLength; i++) {

				/* Get file names to delete(if any) for media types when the value stored is not
				 * empty
				 * n.b: media files cached are not deleted by Epicollect5, the system can delete
				 * them if it needs resources anyway
				 *
				 * It be good to have Epicollect5 purge orphan cached files in the future
				 * TODO
				 */
				if (media_types.indexOf(rows_to_delete[i].type) !== -1 && rows_to_delete[i].value.stored !== "") {
					self.deletion_files.push({
						value : rows_to_delete[i].value.stored,
						type : rows_to_delete[i].type
					});
				}

				tx.executeSql(query, [rows_to_delete[i]._id], null, _deleteBranchEntryErrorCB);
			}
		};

		var _deleteBranchEntrySuccessCB = function() {

			//any file to delete?
			if (self.deletion_files.length > 0) {
				$.when(EC.File.remove(window.localStorage.project_name, self.deletion_files)).then(function() {
					deferred.resolve(true);
				});
			}
			else {
				deferred.resolve();
			}
		};

		var _deleteBranchEntryErrorCB = function() {
			deferred.reject();
		};
		/**
		 * @method deleteBranchEntry Deletes all the rows belonging to a single branch
		 * entry.
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of
		 * objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected branch
		 * entry
		 */
		module.deleteBranchEntry = function(the_rows) {

			self = this;
			rows_to_delete = the_rows;
			deferred = new $.Deferred();
			media_types = [EC.Const.AUDIO, EC.Const.PHOTO, EC.Const.VIDEO];
			self.deletion_files = [];

			EC.db.transaction(_deleteBranchEntryTX, _deleteBranchEntryErrorCB, _deleteBranchEntrySuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
