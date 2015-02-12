/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @method setBranchEntryAsSynced
 * Set all the rows of a branch entry to synced, setting is_data_synced to 1
 * 
 * @param {Array } the_branch_rows_to_sync
 * all the rows of a branch entry
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var branch_rows_to_sync;
		var deferred;
		var self;

		var _updateDataSyncedFlagTX = function(tx) {

			var i;
			var iLength = branch_rows_to_sync.length;
			var query;
			var branch_form_name;

			for ( i = 0; i < iLength; i++) {
				query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE _id=?';
				tx.executeSql(query, [1, branch_rows_to_sync[i]._id], null, self.errorCB);
			}
		};

		var _updateDataSyncedFlagSuccessCB = function() {
			deferred.resolve();
		};

		module.setBranchEntryAsSynced = function(the_branch_rows_to_sync) {

			self = this;
			branch_rows_to_sync = the_branch_rows_to_sync;
			deferred = new $.Deferred();

			EC.db.transaction(_updateDataSyncedFlagTX, self.errorCB, _updateDataSyncedFlagSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Update));
