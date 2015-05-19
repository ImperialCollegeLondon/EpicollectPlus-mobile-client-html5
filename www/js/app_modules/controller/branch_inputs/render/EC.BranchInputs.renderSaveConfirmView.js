/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderSaveConfirmView = function() {

			var self = this;
			var prev_btn = $('div#branch-save-confirm div.ui-grid-b div.ui-block-a.input-prev-btn');
			var store_btn = $('div#branch-save-confirm div#branch-input-save-confirm div#store');
			var store_edit_btn = $('div#branch-save-confirm div.store-edit');
			var percentage_bar = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
			var percentage_txt = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar span.form-completion-percent');
			var branch_inputs_total = self.branch_inputs.length;
			var current_branch_input_position = parseInt(window.localStorage.branch_current_position, 10);
			var branch_form = JSON.parse(window.localStorage.branch_form);

			self.bindBackBtn(false);

			//update completion percentage and bar for this form
			self.updateFormCompletion(branch_inputs_total + 1, branch_inputs_total, percentage_txt, percentage_bar);

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//reset back button visibility
			prev_btn.removeClass("invisible");

			//handler for prev button, showing prev input
			prev_btn.off().on('vclick', function(e) {
				self.gotoPrevPage(e);
			});

			//show "store" or "store edit" button based on where we are editing or adding a new entry
			if (window.localStorage.branch_edit_mode) {

				store_btn.hide();

				//enable store edit button (if the form has jumps it got disabled) and show it
				store_edit_btn.removeClass('ui-disabled hidden');

				//bind event with one() to enforce a single submit
				store_edit_btn.off().one('vclick', function(e) {
					self.onStoreValues();
				});

			} else {

				store_btn.show();

				//hide store edit button
				$('div.store-edit').addClass('hidden');

				//bind event with one() to enforce a single submit
				store_btn.off().one('vclick', function(e) {
					self.onStoreValues();
				});
				
			}
			
			//update completion percentage and bar for this branch form
			self.updateFormCompletion(branch_inputs_total + 1, branch_inputs_total);

		};

		return module;

	}(EC.BranchInputs));
