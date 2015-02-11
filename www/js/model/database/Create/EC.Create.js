/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Create = EC.Create || {};
EC.Create = ( function() {"use strict";

		var form_values = [];
		var hierarchy_forms_data = [];
		var entries = [];
		var entry_key;
		var single_entry_values;
		var single_entry_key;
		var local_form_id;
		var form_total_entries;
		var self;
		var deferred;

		//callback for a transaction error
		var errorCB = function(the_tx, the_error) {

			console.log(EC.Utils.TRANSACTION_ERROR);
			console.log(the_error);
			console.log(the_tx);

		};

		var _insertSingleEntryValues = function(the_entry_values, the_entry_key) {

			single_entry_values = the_entry_values;
			single_entry_key = the_entry_key;

			EC.db.transaction(_insertSingleEntryValuesTX, errorCB, _insertSingleEntryValuesSuccessCB);

		};

		function insertAllFormsData(the_hierarchy_data) {

			self = this;
			hierarchy_forms_data = the_hierarchy_data;
			deferred = new $.Deferred();

			//insert hierarchy entries recursively
			self.insertEntries(hierarchy_forms_data.shift());

			return deferred.promise();

		}

		function insertEntries(the_single_form_values) {

			var self = this;
			var i;
			var iLength;
			var current_row;
			var current_entry_key;
			var current_entry_values = [];

			//get current form details and data rows the first time the function is called
			if (the_single_form_values.hasOwnProperty('form_name')) {

				local_form_id = EC.Utils.getLocalFormID(the_single_form_values.form_name);
				form_total_entries = the_single_form_values.total_entries;
				entries = the_single_form_values.data_rows;
			} else {
				//on subsequent calls only the elements left to insert are passed
				entries = the_single_form_values;
			}

			current_entry_key = entries[0].entry_key;
			iLength = entries.length;

			for ( i = 0; i < iLength; i++) {
				//fill in form_values with only the rows for a single entry, checking entry_key value
				if (entries[i].entry_key === current_entry_key) {
					current_entry_values.push(entries[i]);
				} else {
					break;
				}
			}//for

			//remove current entry values from main entries array and exit
			entries.splice(0, current_entry_values.length);

			//save the rows currently in form_values to database, as they all belong to the same form
			_insertSingleEntryValues(current_entry_values, current_entry_key);

		}

		var _insertSingleEntryValuesTX = function(tx) {

			var i;
			var iLength = single_entry_values.length;
			var query;
			var obj;
			var local_input_id;

			for ( i = 0; i < iLength; i++) {

				query = "";
				obj = single_entry_values[i];
				local_input_id = EC.Utils.getLocalInputID(obj.ref);

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
				query += 'is_media_synced) ';
				query += 'VALUES ("';
				query += local_input_id + '", "';
				query += local_form_id + '", "';
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
				query += obj.is_media_synced + '");';

				tx.executeSql(query, [], _insertSingleEntryValuesSQLSuccessCB, errorCB);

			}//for
		};

		var _insertSingleEntryValuesSQLSuccessCB = function() {

			console.log("SINGLE ENTRY VALUE SQL INSERT SUCCESS");
		};

		var _insertSingleEntryValuesSuccessCB = function() {

			console.log("SINGLE ENTRY VALUES SAVED SUCCESSFULLY");

			//insert next entries if any
			if (entries.length > 0) {
				self.insertEntries(entries);
			} else {
				//update entries counter for the current form. Resolved: all hierarchy data saved; Rejected: still data to save
				$.when(EC.Update.updateCountersOnEntriesRestore(local_form_id, form_total_entries, hierarchy_forms_data)).then(function() {
					//all forms updated
					deferred.resolve();
				}, function(the_forms_data_left) {
					//insert entries for next form
					self.insertEntries(the_forms_data_left.shift());
				});
			}

		};

		return {
			insertAllFormsData : insertAllFormsData,
			insertEntries : insertEntries,
			errorCB : errorCB
		};

	}());
