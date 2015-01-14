/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Create
 *
 */

var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function(module) {"use strict";

		var form_values;
		var entry_key;
		var deferred;

		var _insertFormValuesTX = function(tx) {

			var i;
			var iLength = form_values.length;
			var remote_flag = 0;
			var query;
			var obj;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = form_values[i];

				query += 'INSERT INTO ec_data (';
				query += 'input_id, ';
				query += 'form_id, ';
				query += 'position, ';
				query += 'parent, ';
				query += 'label, ';
				query += 'ref, ';
				query += 'value, ';
				query += 'is_title, ';
				query += 'entry_key, ';
				query += 'type, ';
				query += 'created_on, ';
				query += 'is_data_synced, ';
				query += 'is_remote, ';
				query += 'is_media_synced) ';
				query += 'VALUES ("';
				query += obj.input_id + '", "';
				query += obj.form_id + '", "';
				query += obj.position + '", "';
				query += obj.parent + '", "';
				query += obj.label + '", "';
				query += obj.ref + '", "';
				query += obj.value + '", "';
				query += obj.is_title + '", "';
				query += obj.entry_key + '", "';
				query += obj.type + '", "';
				query += obj.created_on + '", "';
				query += obj.is_data_synced + '", "';
				query += remote_flag + '", "';
				query += obj.is_media_synced + '");';

				tx.executeSql(query, [], _insertFormValuesSQLSuccessCB, _errorCB);

			}//for

		};

		var _insertFormValuesSuccessCB = function() {

			var form_id = form_values[0].form_id;
			console.log("FORM VALUES SAVED SUCCESSFULLY");

			//update entries counter, + 1
			$.when(EC.Update.updateHierarchyEntriesCounter(entry_key, form_id, 1, EC.Const.INSERT, null)).then(function(main_form_entry_key) {
				deferred.resolve(main_form_entry_key);
			}, function() {
				deferred.reject();
			});

		};

		var _insertFormValuesSQLSuccessCB = function() {
			console.log("FORM VALUE SQL QUERY SUCCESS");
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		/*
		 * Commit a form to database; each value is a row in the table ec_data
		 * a single entry get multiple rows
		 */
		module.insertFormValues = function(the_form_values, the_key_value) {

			form_values = the_form_values;
			entry_key = the_key_value;
			deferred = new $.Deferred();

			EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Create));
