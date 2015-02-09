/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var entry_key;
		var parent_path;
		var values = [];
		var branches = [];
		var deferred;

		var _getEntryValues = function(tx) {

			//get all entry values
			var query = 'SELECT * FROM ec_data WHERE form_id=? AND entry_key=? AND parent=? ORDER BY position';

			tx.executeSql(query, [form_id, entry_key, parent_path], _getEntryValuesSQLSuccess, EC.Select.errorCB);

		};
		//_getEntryValues

		var _getEntryValuesSQLSuccess = function(the_tx, the_result) {

			var i;
			var index;
			var iLenght = the_result.rows.length;
			var input_id = "";
			var current_input_id;
			var prev_value = [];
			var prev_obj;
			var new_obj;
			var new_object = {};
			var string;

			//build object with entry values
			for ( i = 0; i < iLenght; i++) {

				current_input_id = the_result.rows.item(i).input_id;

				values.push(the_result.rows.item(i));

				//keep track of branches, if any
				if (the_result.rows.item(i).type === EC.Const.BRANCH) {
					branches.push(the_result.rows.item(i));
				}

			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT ENTRY VALUES SUCCESS");

		};
		//_getEntryValuesSQLSuccess

		var _getEntryValuesSuccessCB = function(the_tx) {

			
			
			deferred.resolve(values.slice(0));

			//clear values array
			values.length = 0;
			console.log(EC.Const.TRANSACTION_SUCCESS);
		};

		module.getEntryValues = function(the_form_id, the_entry_key, the_parent_path) {

			form_id = the_form_id;
			entry_key = the_entry_key;
			parent_path = the_parent_path;
			deferred = new $.Deferred();

			EC.db.transaction(_getEntryValues, EC.Select.errorCB, _getEntryValuesSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
