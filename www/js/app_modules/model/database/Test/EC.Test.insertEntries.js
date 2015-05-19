/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Test
 *
 */

var EC = EC || {};
EC.Test = EC.Test || {};
EC.Test = ( function(module) {"use strict";

		var total;
		var deferred;

		function _makeString(how_long) {

			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var i;

			for ( i = 0; i < how_long; i++) {
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			return text;
		}

		var _insertFormValuesTX = function(tx) {

			var i;
			var iLength = total;
			var query;
			var obj;
			var remote_flag = 0;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = {};
				obj.parent = "";
				obj.is_data_synced = 0;
				obj.is_media_synced = 0;
				obj.created_on = EC.Utils.getTimestamp();

				if (i % 2 === 0) {

					//this is the ID input
					obj.label = "ID";
					obj.ref = "id";

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
					query += 1 + '", "';
					query += 1 + '", "';
					query += 1 + '", "';
					query += obj.parent + '", "';
					query += obj.label + '", "';
					query += obj.ref + '", "';
					query += i+10000 + '", "';
					query += 1 + '", "';
					query += i+10000 + '", "';
					query += EC.Const.INTEGER + '", "';
					query += obj.created_on + '", "';
					query += obj.is_data_synced + '", "';
					query += remote_flag + '", "';
					query += obj.is_media_synced + '");';

				} else {

					//this is the name input
					obj.label = "Name";
					obj.ref = "ecplus_form_ctrl2";

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
					query += 2 + '", "';
					query += 1 + '", "';
					query += 2 + '", "';
					query += obj.parent + '", "';
					query += obj.label + '", "';
					query += obj.ref + '", "';
					query += _makeString(25) + '", "';
					query += 1 + '", "';
					query += i-1 + 10000+ '", "';
					query += EC.Const.TEXT + '", "';
					query += obj.created_on + '", "';
					query += obj.is_data_synced + '", "';
					query += remote_flag + '", "';
					query += obj.is_media_synced + '");';

				}

				tx.executeSql(query, [], _insertFormValuesSQLSuccessCB, _errorCB);

			}//for

		};

		var _onupdateHierarchyEntriesCounterSQLCB = function() {
		};

		var _updateHierarchyEntriesCounterTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + total/2 + ' WHERE _id=?';

			tx.executeSql(query, [1], _onupdateHierarchyEntriesCounterSQLCB, _errorCB);
		};

		var _onCounterUpdateSuccessCB = function() {

			deferred.resolve();
		};

		var _insertFormValuesSQLSuccessCB = function() {
			console.log("FORM VALUE SQL QUERY SUCCESS");
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		var _insertFormValuesSuccessCB = function() {

			EC.db.transaction(_updateHierarchyEntriesCounterTX, _errorCB, _onCounterUpdateSuccessCB);

		};

		/*
		 * Commit a form to database; each value is a row in the table ec_data
		 * a single entry get multiple rows
		 */
		module.insertEntries = function(the_total) {

			total = the_total;
			deferred = new $.Deferred();

			EC.db.transaction(_insertFormValuesTX, _errorCB, _insertFormValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Test));
