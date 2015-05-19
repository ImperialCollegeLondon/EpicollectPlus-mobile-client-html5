/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @method updateCountersOnSyncedEntriesDeletion
 * Update the total of entries locally stored for each form after deleteing all the synced entries for a project
 * 
 * @param {Array} the_counters
 * 
 * array of objects containing the amount of entries deleted per each form:
 * {form_id: <the_form_id>, amount: <the_amount>}
 */
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var counters;
		var deleted_entries;

		var _updateCountersOnSyncedEntriesDeletionSuccessCB = function() {
			deferred.resolve();
		};

		var _updateCountersOnSyncedEntriesDeletionTX = function(tx) {

			var i;
			var iLength = counters.length;
			var query;
			
			//loop and do a transaction per each form
			for ( i = 0; i < iLength; i++) {

				query = 'UPDATE ec_forms SET entries = entries - ' + counters[i].amount + ' WHERE _id=?';
				
				deleted_entries.push(counters[i].amount);

				tx.executeSql(query, [counters[i].form_id], null, self.errorCB);
			}

			//store how many entries were deleted per each form (to update counters in the dom after deletion)
			window.localStorage.deleted_entries = JSON.stringify(deleted_entries);

		};

		module.updateCountersOnSyncedEntriesDeletion = function(the_counters) {

			self = this;
			counters = the_counters;
			deleted_entries =[];
			deferred = new $.Deferred();

			EC.db.transaction(_updateCountersOnSyncedEntriesDeletionTX, self.errorCB, _updateCountersOnSyncedEntriesDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
