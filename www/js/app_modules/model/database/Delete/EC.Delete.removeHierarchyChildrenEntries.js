/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeHierarchyChildrenEntries
 * 
 * Removes all the children entries of a hierarchy entry (direct children)
 * 
 * This method is called recursively to delete all the children for immediate parent entries
 * 
 * EC.Delete.deletion_entries is an array containign all the parent entry keys used to remove the children
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var parent;
		var deferred;
		var entries;
		var parent_key;

		var _removeHierarchyChildrenEntriesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = "DELETE FROM ec_data WHERE parent=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].parent], null, self.errorCB);
			}
		};

		var _removeHierarchyChildrenEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeHierarchyChildrenEntries = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeHierarchyChildrenEntriesTX, self.errorCB, _removeHierarchyChildrenEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
