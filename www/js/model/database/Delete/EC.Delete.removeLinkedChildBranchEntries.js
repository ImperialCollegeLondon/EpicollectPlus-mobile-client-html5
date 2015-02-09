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
		var hierarchy_entry_key;
		var deferred;
		var entries;

		var _removeLinkedChildBranchEntriesSQLSuccessCB = function(the_tx, the_result) {
		};

		var _removeLinkedChildBranchEntriesTX = function(tx) {

			var i;
			var iLength;
			var query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].entry_key], _removeLinkedChildBranchEntriesSQLSuccessCB, self.errorCB);
			}
		};

		var _removeLinkedChildBranchEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeLinkedChildBranchEntries = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeLinkedChildBranchEntriesTX, self.errorCB, _removeLinkedChildBranchEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
