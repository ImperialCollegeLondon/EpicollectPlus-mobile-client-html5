/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;

		var deferred;

		var _updateCountersOnSingleBranchEntryInsertionTX = function(tx) {

			var query = 'UPDATE ec_branch_forms SET entries = entries + ' + 1 + ' WHERE _id=?';
			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _onCounterUpdateSuccessCB = function() {
			deferred.resolve(true, entry_key);
		};

		module.updateCountersOnSingleBranchEntryInsertion = function(the_entry_key, the_form_id) {

			self = this;
			entry_key = the_entry_key;
			form_id = the_form_id;
			deferred = new $.Deferred();

			EC.db.transaction(_updateCountersOnSingleBranchEntryInsertionTX, self.errorCB, _updateCountersOnSingleBranchEntryInsertionSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Update));
