/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*

 *
 * Select and count the rows we are going to delete to be able to update the
 * entries counters later, the one we use to show the entries total per each form
 * on the form list page
 * This is mainly done for performance reason, as querying COUNT per each form
 * each time the form list view is called was a bit heavy
 * Doing this way we have a column "entries_total" per each form and we keep that
 * value updated accordingly
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

		var _countEntriesForDeletionSQLSuccessCB = function(the_tx, the_result) {

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

			console.log(entries);

		};

		var _countEntriesForDeletionTX = function(tx) {

			//select COUNT(*) and rows we are going to delete: we do this to update the entry
			// counter after deletion
			var query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE entry_key=? GROUP BY form_id";

			tx.executeSql(query, [entry_key], _countEntriesForDeletionSQLSuccessCB, EC.Delete.errorCB);
		};

		var _countEntriesForDeletionSuccessCB = function() {

			deferred.resolve(entries, counters);
		};

		module.countEntriesForDeletion = function(the_entry_key) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			entries = [];
			counters = [];

			EC.db.transaction(_countEntriesForDeletionTX, EC.Delete.errorCB, _countEntriesForDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
