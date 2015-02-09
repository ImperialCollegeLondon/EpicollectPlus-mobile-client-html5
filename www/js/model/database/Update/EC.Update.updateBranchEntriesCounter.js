/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var form_values = [];
		var entry_rows = [];
		var form_id;
		var entry_key;
		var row_id;
		var amount = 0;
		var action;
		var forms_data_left;
		var forms_data_restored = [];
		var deferred;

		var _updateHierarchyEntriesCounterTX = function(tx) {

			var query = 'UPDATE ec_branch_forms SET entries = entries + ' + amount + ' WHERE _id=?';
			tx.executeSql(query, [form_id], _onupdateHierarchyEntriesCounterSQLCB, EC.Update.errorCB);
		};

		var _onCounterUpdateSuccessCB = function() {

			var hash;
			var project_id;
			var project_name;
			var form_id;
			var form_name;

			switch(action) {

				// case EC.Const.RESTORE:
				//
				// //if we have nested forms, enter the next form data recursively
				// if (forms_data_left.length > 0) {
				//
				// EC.Create.insertEntries(forms_data_left.shift());
				//
				// } else {
				//
				// //restore successful
				//
				// //update forms in localStorage
				// window.localStorage.forms = JSON.stringify(forms_data_restored);
				// forms_data_restored.length = 0;
				//
				// //show feedback
				// EC.Project.restoreFeedback(true);
				//
				// //reset total of entries
				// amount = 0;
				//
				// }
				//
				// break;

				case EC.Const.INSERT:

					deferred.resolve(true, entry_key);
					break;

				// case EC.Const.DOWNLOAD:
				//
				// project_id = window.localStorage.project_id;
				// project_name = window.localStorage.project_name;
				// hash = "forms.html?project=" + project_id + "&name=" + project_name;
				//
				// //show feedback for successuful download
				// EC.Download.downloadFeedback(hash);
				//
				// //reset total of entries
				// amount = 0;
				//
				// break;
				//
				// case EC.Const.DELETE_SINGLE_ENTRY:
				//
				// //form_id = window.localStorage.form_id;
				// //form_name = window.localStorage.form_name;
				//
				// if (forms_data_left.length > 0) {
				//
				// var current_count = forms_data_left.shift();
				//
				// EC.Update.updateHierarchyEntriesCounter(null, current_count.form_id, current_count.amount, EC.Const.DELETE_SINGLE_ENTRY, forms_data_left);
				//
				// } else {
				//
				// EC.Entries.deleteEntryFeedback(true);
				//
				// //reset total of entries
				// amount = 0;
				//
				// }

				//hash = "#entries?form=" + form_id + "&name=" + form_name + "&entry_key=&direction=" + EC.Const.FORWARD;

				//change direction value (to preserve the right breadcrumb sequence)
				//hash = EC.Utils.changeHashNavigationDirection(window.localStorage.back_nav_url, EC.Const.DELETE_SINGLE_ENTRY);

				//EC.Entries.getList(hash);

				//break;

			}

		};

		var _onupdateHierarchyEntriesCounterSQLCB = function() {
		};

		/*
		 * @method updateHierarchyEntriesCounter Update the total of entries for a form, after entering/deleting entries
		 */
		module.updateBranchEntriesCounter = function(the_entry_key, the_form_id, the_amount, the_action, the_forms_data_left) {

			var old_forms;
			var current_form;

			//reset amount
			amount = 0;
			amount = the_amount;
			entry_key = the_entry_key;
			form_id = the_form_id;
			action = the_action;
			forms_data_left = the_forms_data_left;
			deferred = new $.Deferred();

			EC.db.transaction(_updateHierarchyEntriesCounterTX, EC.Update.errorCB, _onCounterUpdateSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
