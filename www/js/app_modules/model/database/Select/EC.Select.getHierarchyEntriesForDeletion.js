/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method getHierarchyEntriesForDeletion
 *
 * Select and count the rows we are going to delete to be able to update the
 * entries counters later, the ones we use to show the entries total per each form
 * on the form list page
 * This is mainly done for performance reason, as querying COUNT per each form
 * each time the form list view is called was a bit heavy
 * Doing this way we have a column "entries_total" per each form and we keep that
 * value updated accordingly
 *
 * This method also caches details about the entries we are going to delete later,
 * this is mainly to have a reference for any branches or media files  attached
 * to these entries which need to be deleted as well
 * 
 * on resolve(), entries and counters objects are returned
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entry_key;
		var entries;
		var counters;

		var _getHierarchyEntriesForDeletionSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//cache entries
			for ( i = 0; i < iLength; i++) {
				entries.push(the_result.rows.item(i));
			}

			//update counters
			counters.push({
				form_id : entries[0].form_id,
				amount : entries.length
			});
		};

		var _getHierarchyEntriesForDeletionTX = function(tx) {

			var query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE entry_key=? GROUP BY form_id";

			tx.executeSql(query, [entry_key], _getHierarchyEntriesForDeletionSQLSuccessCB, EC.Delete.errorCB);
		};

		var _getHierarchyEntriesForDeletionSuccessCB = function() {
			
			//return entries details and counters
			deferred.resolve(entries, counters);
		};

		module.getHierarchyEntriesForDeletion = function(the_entry_key) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			entries = [];
			counters = [];

			EC.db.transaction(_getHierarchyEntriesForDeletionTX, EC.Delete.errorCB, _getHierarchyEntriesForDeletionSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Select));
