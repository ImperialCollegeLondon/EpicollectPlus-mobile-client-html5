/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderFeedbackView = function() {

			var self = this;
			var form_id = window.localStorage.form_id;
			var form_name = window.localStorage.form_name;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var add_another_entry_btn = $('div#branch-feedback div#branch-input-feedback div#add-entry-branch-form');
			var back_to_main_btn = $('div#branch-feedback div#branch-input-feedback div#back-to-main-form');
			var project_id = window.localStorage.project_id;
			var current_form_branches;

			//handle back button with no alert on this page
			self.bindBackBtn(true);

			//remove branch flags from localStorage
			window.localStorage.removeItem("branch_current_position");
			window.localStorage.removeItem("branch_edit_id");
			window.localStorage.removeItem("branch_edit_mode");
			window.localStorage.removeItem("branch_edit_position");
			window.localStorage.removeItem("branch_inputs_trail");
			window.localStorage.removeItem("branch_inputs_values");

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//Set text for buttons
			add_another_entry_btn.find('span.entry').text("(" + branch_form.name + ")");
			back_to_main_btn.find('span.form-name-inline').text(form_name);

			//bind button to add another branch form to this entry
			add_another_entry_btn.off().one('vclick', function(e) {

				EC.Notification.showProgressDialog();
				//get list of inputs for the branch form and render the first one on screen
				self.getList(branch_form.name, project_id);
			});

			//bind button to go back to main form input
			back_to_main_btn.off().one('vclick', function(e) {
				//go back to main form input
				self.backToHierarchyForm();
			});
			EC.Notification.hideProgressDialog();
		};

		return module;

	}(EC.BranchInputs));
