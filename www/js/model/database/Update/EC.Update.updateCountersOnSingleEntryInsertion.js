/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method updateCountersOnSingleEntryInsertion
 * Update the total of entries for a
 * hierarchy form, after entering entries.
 * It also updates the total of branch
 * entries linked to a hierarchy entry if any
 *
 * @param {the_entry_key} the value of the primary key for the form (entry) just
 * entered
 * @param {the_form_id} the _id of the form in the database
 */
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var amount;
		var deferred;

		module.updateCountersOnSingleEntryInsertion = function(the_entry_key, the_form_id) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			form_id = the_form_id;

			//update entries counter for the appropriate form
			EC.Utils.updateFormsObj(form_id);

			EC.db.transaction(_updateCountersOnSingleEntryInsertionTX, self.errorCB, _updateCountersOnSingleEntryInsertionSuccessCB);

			return deferred.promise();
		};

		var _updateCountersOnSingleEntryInsertionTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + 1 + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _updateCountersOnSingleEntryInsertionSuccessCB = function() {

			var project_id;
			var cached_branch_entry_keys;
			var branch_to_store;
			var i;
			var iLength;

			/* Hierarchy entry counter updated.
			 *
			 * If there are any branches set their rows "is_stored" flag to 1
			 */
			try {
				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				iLength = cached_branch_entry_keys.length;
				branch_to_store = false;

				//do we have any branch form cached?
				for ( i = 0; i < iLength; i++) {
					if (cached_branch_entry_keys[i].primary_keys.length > 0) {

						branch_to_store = true;
						break;
					}
				}

				if (branch_to_store) {

					project_id = window.localStorage.project_id;
					$.when(EC.Update.setCachedBranchesAsStored(cached_branch_entry_keys, entry_key, project_id)).then(function(entry_key) {
						deferred.resolve(entry_key);
					});

				}
				else {
					//no branches
					deferred.resolve(entry_key);
				}
			} catch(error) {

				//no branches to save, show positive feedback to user after insertion of new
				// entry
				deferred.resolve(entry_key);
			}
		};

		return module;

	}(EC.Update));
