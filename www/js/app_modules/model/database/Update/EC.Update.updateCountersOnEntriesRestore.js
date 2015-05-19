/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var amount;
		var forms_data_left;
		var forms_data_restored = [];
		var deferred;
		var old_forms;
		var current_form;

		module.updateCountersOnEntriesRestore = function(the_form_id, the_amount, the_forms_data_left) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			amount = the_amount;
			forms_data_left = the_forms_data_left;
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

			EC.db.transaction(_updateCountersOnEntriesRestoreTX, EC.Update.errorCB, _updateCountersOnEntriesRestoreSuccessCB);

			return deferred.promise();
		};

		var _updateCountersOnEntriesRestoreTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + amount + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, EC.Update.errorCB);
		};

		var _updateCountersOnEntriesRestoreSuccessCB = function() {

			//if we have nested forms, enter the next form data recursively
			if (forms_data_left.length > 0) {
				deferred.reject(forms_data_left);
			}
			else {
				//restore successful, update forms in localStorage
				window.localStorage.forms = JSON.stringify(forms_data_restored);

				forms_data_restored.length = 0;
				//reset total of entries
				amount = 0;

				deferred.resolve();
			}

		};

		return module;

	}(EC.Update));
