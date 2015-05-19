/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Project
 */

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function(module) {"use strict";

		module.restoreFromBackup = function() {

			var project_name = window.localStorage.project_name;
			var project_id = window.localStorage.project_id;

			//TODO: check if there is a backup

			var _restoreFeedback = function(is_positive) {

				var forms_list_items = $('div#forms-list ul li');
				var project_id;
				var HTML;
				var forms;
				var dom_list = $('div#forms-list ul');

				//get updated forms
				forms = JSON.parse(window.localStorage.forms);
				project_id = parseInt(window.localStorage.project_id, 10);

				if (is_positive) {
					EC.Notification.showAlert(EC.Localise.getTranslation("success"), EC.Localise.getTranslation("project_restored"));

					//show forms list
					$.when(EC.Select.getForms(project_id)).then(function(the_forms, the_btn_states) {
						EC.Forms.renderList(the_forms, the_btn_states);
						$('div#forms div#project-options').panel("close");
					});

				} else {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
				}

			};
			
			//Show spinning loader
			EC.Notification.showProgressDialog();

			//delete existing data first
			$.when(EC.Delete.deleteAllEntries(EC.Const.RESTORE, project_name, project_id)).then(function(the_forms) {

				//Map local input ids against ref and cache them before restoring from backup
				$.when(EC.Select.getLocalInputIDs(the_forms)).then(function(the_input_ids) {

					window.localStorage.local_input_ids = JSON.stringify(the_input_ids);
					
					//restore from backup file success
					$.when(EC.File.restoreFromBackup(project_name, project_id)).then(function() {
						EC.Notification.hideProgressDialog();
						_restoreFeedback(true);
					});

				});
			});

		};

		return module;

	}(EC.Project));
