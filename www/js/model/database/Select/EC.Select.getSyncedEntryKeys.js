/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid : true*/
/*global $, jQuery*/

/*
 * Get all the synced entry keys for a single form, using form ID
 * 
 * We use DISTICT to have a single occurrence of the netry key, as many rows can have the same
 */

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";
		
		var self;
		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;

		var _getSyncedEntryKeysTX = function(tx) {
			
			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=? AND is_data_synced=?';
			
			tx.executeSql(query, [form_id, 1], _getSyncedEntryKeysSQLSuccess, self.errorCB);
		};

		var _getSyncedEntryKeysSQLSuccess = function(the_tx, the_result) {
			
			debugger;
			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}
		};

		var _getSyncedEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entry keys for the specified form
		module.getSyncedEntryKeys = function(the_form_id) {
			
			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys =[];
			EC.db.transaction(_getSyncedEntryKeysTX, self.errorCB, _getSyncedEntryKeysSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
