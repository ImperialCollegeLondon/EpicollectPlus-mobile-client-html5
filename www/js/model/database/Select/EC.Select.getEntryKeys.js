/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * Get all the entry keys for a single form, using form ID
 *
 * We use DISTICT to have a single occurrence of the netry key, as all the rows
 * belonging to a form entry can have the same
 */

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;

		var _getEntryKeys = function(tx) {

			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';

			tx.executeSql(query, [form_id], _getEntryKeysSQLSuccess, self.errorCB);
		};

		var _getEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}
		};

		var _getEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entry keys for the specified form
		module.getEntryKeys = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys = [];
			EC.db.transaction(_getEntryKeys, self.errorCB, _getEntryKeysSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
