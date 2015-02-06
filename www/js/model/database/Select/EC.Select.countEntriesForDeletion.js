/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
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
			entries =[];
			counters = [];

			EC.db.transaction(_countEntriesForDeletionTX, EC.Delete.errorCB, _countEntriesForDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
