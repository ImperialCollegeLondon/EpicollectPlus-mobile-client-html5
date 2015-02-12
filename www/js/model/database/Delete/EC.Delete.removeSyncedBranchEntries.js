/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid:true*/
/*global $, jQuery*/
/*
 *
 * Remove all the synced branch entries linked to synced hierarchy entries, lopping all the entry keys of the hierarchy entries
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var hierarchy_entry_keys;
		var deferred;

		var _removeSyncedBranchEntriesTX = function(tx) {

			var i;
			var iLength = hierarchy_entry_keys.length;
			var query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [hierarchy_entry_keys[i], 1], null, self.errorCB);
			}
		};

		var _removeSyncedBranchEntriesSuccessCB = function() {
			deferred.resolve();
		};
 
		module.removeSyncedBranchEntries = function(the_hierarchy_entry_keys) {

			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_keys = the_hierarchy_entry_keys;

			EC.db.transaction(_removeSyncedBranchEntriesTX, self.errorCB, _removeSyncedBranchEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
