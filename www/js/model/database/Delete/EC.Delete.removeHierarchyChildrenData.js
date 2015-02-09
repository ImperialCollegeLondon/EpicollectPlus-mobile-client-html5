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
		var parent;
		var deferred;
		var entries;
		var parent_key;

		var _removeHierarchyChildrenDataSQLSuccessCB = function(the_tx, the_result) {
			//do nothing
		};

		var _removeHierarchyChildrenDataTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = "DELETE FROM ec_data WHERE parent=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [entries[i].parent], _removeHierarchyChildrenDataSQLSuccessCB, self.errorCB);
			}
		};

		var _removeHierarchyChildrenDataSuccessCB = function() {
			deferred.resolve();
		};

		module.removeHierarchyChildrenData = function() {

			self = this;
			deferred = new $.Deferred();
			entries = self.deletion_entries;

			EC.db.transaction(_removeHierarchyChildrenDataTX, self.errorCB, _removeHierarchyChildrenDataSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
