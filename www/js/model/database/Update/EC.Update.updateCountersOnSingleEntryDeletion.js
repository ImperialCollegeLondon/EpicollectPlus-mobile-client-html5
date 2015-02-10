/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/* @method updateCountersOnSingleEntryDeletion
 *
 * This method recursively updates the entries counters per each form after a
 * single entry deletion (ec_form table)
 *
 * @param {the_counters} array of objects like:
 *
 * { amount: 3,
 *   form_id : 39
 * }
 *
 * where amount is the total of entries deleted for the form, identified by
 * form_id
 *
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form;
		var counters;
		var row_id;
		var amount;
		var forms_data_left;
		var deferred;

		var _onCounterUpdateSuccessCB = function() {
			
			//any more forms to update?
			if (counters.length > 0) {

				form = counters.shift();

				_doUpdate();
			}
			else {
				deferred.resolve();
			}

		};

		var _updateHierarchyEntriesCounterTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + amount + ' WHERE _id=?';

			tx.executeSql(query, [form.form_id], null, self.errorCB);
		};

		function _doUpdate() {
			
			//amount will be removed
			amount = -form.amount;

			//update forms in localStorage with the new total entries values
			//TODO, maybe not needed
			console.log("localstorage forms maybe need to be updated here");

			EC.db.transaction(_updateHierarchyEntriesCounterTX, self.errorCB, _onCounterUpdateSuccessCB);
		}


		module.updateCountersOnSingleEntryDeletion = function(the_counters) {

			self = this;
			deferred = new $.Deferred();
			counters = the_counters;
			form = counters.shift();
			amount = 0;

			_doUpdate();

			return deferred.promise();
		};

		return module;

	}(EC.Update));
