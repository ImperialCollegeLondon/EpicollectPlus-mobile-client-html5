/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;

		var _getEntryKeys = function(tx) {
			//get all entry key for the specified form
			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';
			
			tx.executeSql(query, [form_id], _getEntryKeysSQLSuccess, EC.Select.errorCB);
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

		//get all entr+key value for the specified form
		module.getEntryKeys = function(the_form_id) {

			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys =[];
			EC.db.transaction(_getEntryKeys, EC.Select.errorCB, _getEntryKeysSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
