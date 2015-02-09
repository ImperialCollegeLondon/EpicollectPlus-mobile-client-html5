/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var rows_deleted = [];
		var deleted_entries = [];
		var forms;
		var self;
		var deferred;

		//return the total of deleted entries (total of rows / number of inputs )
		var _getDeletedTotal = function(the_form_id, the_rows_deleted, the_forms) {

			var i;
			var form_id = the_form_id;
			var rows_deleted = the_rows_deleted;
			var forms = the_forms;
			var iLength = forms.length;

			for ( i = 0; i < iLength; i++) {

				if (rows_deleted[i].form_id === form_id) {
					return (rows_deleted[i].total_deleted / forms[i].total_inputs);
				}
			}
		};

		var _updateEntriesCountSuccessCB = function() {
			deferred.resolve();
		};

		var _updateEntriesCountTX = function(tx) {

			var i;
			var iLength = forms.length;
			var total_deleted;
			var query = "";

			for ( i = 0; i < iLength; i++) {

				//get total of entries deleted
				total_deleted = _getDeletedTotal(forms[i]._id, rows_deleted, forms);
				deleted_entries.push(total_deleted);
				query = 'UPDATE ec_forms SET entries = entries - ' + total_deleted + ' WHERE _id=?';

				tx.executeSql(query, [forms[i]._id], _onUpdateEntriesCountSQLSuccess, EC.Update.errorCB);
			}

			//store how many entries were deleted per each fomr in localStorage
			window.localStorage.deleted_entries = JSON.stringify(deleted_entries);

		};

		var _onUpdateEntriesCountSQLSuccess = function(the_tx, the_result) {
			console.log(the_result);
		};

		module.countSyncedDeleted = function(the_rows_deleted, the_forms) {

			self = this;
			rows_deleted = the_rows_deleted;
			forms = the_forms;
			deleted_entries.length = 0;
			deferred = new $.Deferred();

			EC.db.transaction(_updateEntriesCountTX, EC.Update.errorCB, _updateEntriesCountSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
