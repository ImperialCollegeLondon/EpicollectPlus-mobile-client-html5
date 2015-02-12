/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
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
		var form_id;
		var deferred;

		var _removeSyncedHierarchyEntriesTX = function(tx) {

			//delete all rows belonging to this form which are data synced
			var query = "DELETE FROM ec_data WHERE form_id=? AND is_data_synced=?";
			tx.executeSql(query, [form_id, 1], null, self.errorCB);
		};

		var _removeSyncedHierarchyEntriesSuccessCB = function() {
			deferred.resolve();
		};

		module.removeSyncedHierarchyEntries = function(the_form_id) {

			self = this;
			form_id = the_form_id;
			deferred = new $.Deferred();

			EC.db.transaction(_removeSyncedHierarchyEntriesTX, self.errorCB, _removeSyncedHierarchyEntriesSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
