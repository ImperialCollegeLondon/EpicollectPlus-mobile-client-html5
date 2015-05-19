/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeLinkedBranchChildEntries remove all the branch entries linked to
 * a child of a hierarchy entry
 *
 * no parameters are passed, as when this method is called the object
 * self.deletion_entries will contain all the entries entry key.
 * 
 * Branches are linked to a hierarchy entry via the hierarchy entry key
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entries;

		var _removeLinkedBranchChildEntriesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].entry_key], null, self.errorCB);
			}
		};

		var _removeLinkedBranchChildEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeLinkedBranchChildEntries = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeLinkedBranchChildEntriesTX, self.errorCB, _removeLinkedBranchChildEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
