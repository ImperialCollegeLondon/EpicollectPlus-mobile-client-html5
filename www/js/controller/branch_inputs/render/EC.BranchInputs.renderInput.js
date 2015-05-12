/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *	@module EC
 @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		//render input calling the proper page and passing input attributes
		module.renderInput = function(the_input) {

			//get module context
			var self = this;
			var wls = window.localStorage;
			var branch_input = the_input;
			var branch_current_value;
			var branch_current_position = parseInt(wls.branch_current_position, 10);
			var branch_cached_value = self.getCachedInputValue(branch_current_position);
			var back_btn = $("div#branch-" + branch_input.type + " div[data-role='header'] div[data-href='back-btn']");
			var back_btn_label = $("div[data-role='header'] div[data-href='back-btn'] span.form-name");
			var parent_key;
			var rows_to_save = [];
			var prev_btn = $('div.branch-input-nav-tabs div.ui-block-a.input-prev-btn');
			var next_btn = $('div.branch-input-nav-tabs div.ui-block-c.input-next-btn');
			var form_name = wls.form_name;
			var branch_inputs_total = self.branch_inputs.length;
			var branch_form = JSON.parse(wls.branch_form);
			var is_genkey_hidden = EC.Utils.isBranchFormGenKeyHidden();
			var branch_inputs_values;
			var first_branch_input;
			var is_prev_button_hidden = false;

			back_btn.off().on('vclick', function(e) {

				//TODO: when editing an existing branch form, go back to entry values list?

				if (wls.branch_edit_mode) {
					if (wls.branch_has_new_jump_sequence) {
						EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToHierarchyForm", false, branch_input, true);

					} else {

						//check if user is leaving after modifying a jump and neither "Store Edit", "prev" or "next" button were tapped
						if (parseInt(branch_input.has_jump, 10) === 1) {

							branch_current_value = EC.Inputs.getCurrentValue(branch_input.type);

							if (!EC.Inputs.valuesMatch(branch_cached_value, branch_current_value, branch_input.type)) {

								EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToHierarchyForm", false, branch_input, true);
							} else {

								EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
							}
						} else {
							EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
						}
					}
				} else {
					//not editing, go to entries list
					EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToBranchEntryValuesList", true, branch_input, true);
				}

			});

			back_btn_label.text("Back to " + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

			//show branch form name in the top bar
			$('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

			//reset button visibility
			$(prev_btn, next_btn).removeClass("invisible");

			//TODO :doe we need to -> skip input rendering if it is the preloader screen
			if (branch_current_position !== 0) {

				//check if we have a cached value for this input in session
				branch_current_value = self.getCachedInputValue(branch_current_position).value;

				//check it the value is _skipp3d_ keyword
				branch_current_value = (branch_current_value === EC.Const.SKIPPED) ? "" : branch_current_value;

				//if the input is either photo, audio or video, no default value will be available so we pass an empty object {cached: "", stored: ""}
				if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.AUDIO || branch_input.type === EC.Const.VIDEO) {

					if (branch_current_value) {
						self.renderInputView(branch_input, branch_current_value);
					} else {
						self.renderInputView(branch_input, {
							cached : "",
							stored : ""
						});
					}

				} else {

					//for normal inputs, render view passing the default value (or empty if not defined) if no input value is cached
					if (branch_current_value) {
						self.renderInputView(branch_input, branch_current_value);
					} else {
						self.renderInputView(branch_input, branch_input.default_value);
					}
				}
			}

			//set next button to go to next input (if any)
			if (branch_current_position <= branch_inputs_total) {

				//Next button handler
				next_btn.off().on('vclick', function(e) {
					self.onNextBtnTapped(e, branch_input);
				});

				//set previous button to fade to previous input (if any)
				if (branch_current_position - 1 > 0) {

					//check if the first input is a hidden genkey, in that case do not show prev button
					if (branch_current_position === 2) {

						branch_inputs_values = JSON.parse(wls.branch_inputs_values);
						first_branch_input = branch_inputs_values[0];

						if (first_branch_input.is_primary_key === 1 && is_genkey_hidden === 1) {

							//hide prev button for first input of the form
							prev_btn.addClass("invisible");
							is_prev_button_hidden = true;

						}

					}

					//bind vclick event only if the button is not hidden
					if (!is_prev_button_hidden) {
						//handler for prev button, showing prev input
						prev_btn.off().on('vclick', function(e) {
							self.onPrevBtnTapped(e, branch_input);
						});
					}

				} else {

					//hide prev button for first input of the form
					prev_btn.addClass("invisible");

					//reset inputs_trail in session
					wls.removeItem('branch_inputs_trail');
				}

				//show store edit button if we are in "editing mode" and bind it to callback
				if (wls.branch_edit_mode) {

					$('div.store-edit').removeClass('hidden');

					if (branch_input.has_jump === 1) {

						// disable store edit button, to force the user to go through the form again to retain the jumps sequence
						$('div.store-edit').addClass('ui-disabled');

					} else {

						$('div.store-edit').removeClass('ui-disabled');

					}

					//bind events with on(), as we need to submit again if the input does not validate successfully
					$('div.store-edit').off().on('vclick', function() {

						self.prepareStoreEdit(branch_current_value, branch_current_position, branch_input);

					});

				}

			}

			//update completion percentage and bar for this form
			self.updateFormCompletion(branch_current_position, branch_inputs_total);

		};

		return module;

	}(EC.BranchInputs));
