/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var form_id;
		var main_form_entry_key;
		var row_id;
		var amount = 0;
		var action;
		var forms_data_left;
		var forms_data_restored = [];
		var deferred;

		/*
		 * @method updateHierarchyEntriesCounter Update the total of entries for a
		 * hierarchy form, after entering/deleting entries
		 * @param {the_entry_key} the value of the primary key for the form (entry) just
		 * entered
		 * @param {the_form_id} the _id of the form in the database
		 * @param {the_amount} the quantity of entries added (1 when adding a single
		 * form, or the total of entries when downloading remote entries)
		 * @param {the_action} the type of action performed before calling
		 * updateHierarchyEntriesCounter:
		 * -INSERT
		 * -RESTORE
		 * -DELETE_SINGLE_ENTRY
		 * @param {the_forms_data_left} all the child forms based on the current form
		 * (hierarchy structure)
		 */

		module.updateHierarchyEntriesCounter = function(the_entry_key, the_form_id, the_amount, the_action, the_forms_data_left) {

			var old_forms;
			var current_form;

			deferred = new $.Deferred();
			amount = 0;
			amount = the_amount;
			main_form_entry_key = the_entry_key;
			form_id = the_form_id;
			action = the_action;
			forms_data_left = the_forms_data_left;

			//update forms in localStorage if we are entering a new entry
			if (action === EC.Const.INSERT) {
				//update entries counter for the appropriate form
				EC.Utils.updateFormsObj(form_id);
			}

			//update forms in localStorage if we are restoring from a backup
			if (action === EC.Const.RESTORE) {

				old_forms = JSON.parse(window.localStorage.forms);
				current_form = old_forms.shift();

				forms_data_restored.push({
					_id : form_id,
					entries : amount,
					has_media : current_form.has_media,
					num : current_form.num,
					total_inputs : current_form.total_inputs,
					name : current_form.name,
					is_active : current_form.is_active,
					key : current_form.key

				});

				window.localStorage.forms = JSON.stringify(old_forms);
			}

			if (action === EC.Const.DELETE_SINGLE_ENTRY) {

				amount = -amount;

				////update forms in localStorage with the new total entries values
				//todo, maybe not needed
				console.log("localstorage forms maybe need to be updated here");
			}

			EC.db.transaction(_updateHierarchyEntriesCounterTX, EC.Update.txErrorCB, _onCounterUpdateSuccessCB);

			return deferred.promise();

		};

		var _updateHierarchyEntriesCounterTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + amount + ' WHERE _id=?';

			console.log(query);

			tx.executeSql(query, [form_id], _onupdateHierarchyEntriesCounterSQLCB, EC.Update.txErrorCB);

		};

		var _onCounterUpdateSuccessCB = function() {

			var hash;
			var project_id;
			var project_name;
			var form_id;
			var form_name;
			var cached_branch_entry_keys;
			var branch_to_store;
			var i;
			var iLength;

			switch(action) {

				case EC.Const.RESTORE:

					//if we have nested forms, enter the next form data recursively
					if (forms_data_left.length > 0) {
						deferred.reject(forms_data_left);
					}
					else {
						//restore successful
						//update forms in localStorage
						window.localStorage.forms = JSON.stringify(forms_data_restored);
						forms_data_restored.length = 0;
						//reset total of entries
						amount = 0;

						deferred.resolve();
					}
					break;
				case EC.Const.INSERT:

					//main form entry rows saved. If there are any branch set their rows "is_stored"
					// flag to 1
					try {
						cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

						iLength = cached_branch_entry_keys.length;
						branch_to_store = false;

						//do we have any branch form cached?
						for ( i = 0; i < iLength; i++) {
							if (cached_branch_entry_keys[i].primary_keys.length > 0) {

								branch_to_store = true;
								break;
							}
						}

						if (branch_to_store) {

							project_id = window.localStorage.project_id;
							$.when(EC.Update.setCachedBranchesAsStored(cached_branch_entry_keys, main_form_entry_key, project_id)).then(function(main_form_entry_key) {
								deferred.resolve(main_form_entry_key);
							});

						}
						else {

							//no branches
							deferred.resolve(main_form_entry_key);

						}
					} catch(error) {

						//no branches to save, show positive feedback to user after insertion of new
						// entry
						deferred.resolve(main_form_entry_key);

					}

					break;

				case EC.Const.DOWNLOAD:

					deferred.resolve();
					//reset total of entries
					amount = 0;

					break;

				case EC.Const.DELETE_SINGLE_ENTRY:

					if (forms_data_left.length > 0) {

						var current_count = forms_data_left.shift();

						EC.Update.updateHierarchyEntriesCounter(null, current_count.form_id, current_count.amount, EC.Const.DELETE_SINGLE_ENTRY, forms_data_left);

					}
					else {

						deferred.resolve();

						//reset total of entries
						amount = 0;
					}

					break;

			}

		};

		var _onupdateHierarchyEntriesCounterSQLCB = function() {
		};

		return module;

	}(EC.Update));
