/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function (module) {
    "use strict";

    /**
     * @method renderInput This method is called by JQM page events each time a new page (input type) is requested
     * The application show a single input per page: this method prepare the DOM common to all inputs  and then calls the
     * appropriate view based on the input type
     *
     * @param {Object} the_input : a single input object like:
     *
     * {input object here}
     *
     */

    module.renderInput = function (the_input) {

        var self = this;
        var wls = window.localStorage;
        var input = the_input;
        var current_value;
        var page = EC.Const.INPUT_VIEWS_DIR + input.type;
        var current_position = parseInt(wls.current_position, 10);
        var cached_value = self.getCachedInputValue(current_position);
        var breadcrumb_trail = JSON.parse(wls.getItem("breadcrumbs"));
        var back_btn = $("div[data-role='header'] div[data-href='back-btn']");
        var back_btn_label = $("div[data-role='header'] div[data-href='back-btn'] span.form-name");
        var parent_key;
        var rows_to_save = [];
        var prev_btn = $('div.input-nav-tabs div.ui-block-a.input-prev-btn');
        var next_btn = $('div.input-nav-tabs div.ui-block-c.input-next-btn');
        var form_name = wls.form_name;
        var form_id = wls.form_id;
        var inputs_total = self.inputs.length;
        var is_genkey_hidden = EC.Utils.isFormGenKeyHidden(form_id);
        var inputs_values;
        var first_input;
        var is_prev_button_hidden = false;

        back_btn.off().on('vclick', function (e) {

            //when editing, the back button takes to the entry values list
            if (wls.edit_mode) {

                if (wls.has_new_jump_sequence) {
                    EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), "Are you sure? \nData will NOT be saved", "EC.Inputs.backToEntryValuesList", false, input, false);

                } else {

                    //check if user is leaving after modifying a jump and neither "Store Edit", "prev" or "next" button were tapped
                    if (parseInt(input.has_jump, 10) === 1) {

                        current_value = EC.Inputs.getCurrentValue(input.type);

                        if (!self.valuesMatch(cached_value, current_value, input.type)) {

                            EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToEntryValuesList", false, input, false);
                        } else {

                            EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntryValuesList", true, input, false);
                        }
                    } else {
                        EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntryValuesList", true, input, false);
                    }
                }

            } else {
                //not editing, go to entries list
                EC.Notification.askConfirm(EC.Localise.getTranslation("leaving_current_form"), EC.Localise.getTranslation("save_before_leave"), "EC.Inputs.backToEntriesList", true, input, false);
            }

        });

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + EC.Localise.getTranslation("entries"));

        //get parent key based on the user navigating, editing or adding from child list
        if (wls.edit_mode) {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 2];
        } else {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
        }

        //reset button visibility
        $(prev_btn, next_btn).removeClass("invisible");

        //show parent key in the top bar (if any)
        if (parent_key !== "" && parent_key !== undefined) {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(wls.form_name + ' for ' + parent_key);
        } else {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(wls.form_name);
        }

        //TODO :do we need to -> skip input rendering if it is the preloader screen
        if (current_position !== 0) {

            //check if we have a cached value for this input in session
            current_value = self.getCachedInputValue(current_position).value;

            //check it the value is _skipp3d_ reserved keyword
            current_value = (current_value === EC.Const.SKIPPED) ? "" : current_value;

            //if the input is either photo, audio or video, if no default value is available we pass an empty object {cached: "", stored: ""}
            if (input.type === EC.Const.PHOTO || input.type === EC.Const.AUDIO || input.type === EC.Const.VIDEO) {

                self.renderInputView(input, current_value || {
                    cached: "",
                    stored: ""
                });

            } else {

                //for normal inputs, render view passing the default value (empty if not set) if no input value is cached
                self.renderInputView(input, current_value || input.default_value);
            }
        }

        //set next button to go to next input (if any)
        if (current_position <= inputs_total) {
            //Next button handler
            next_btn.off().on('vclick', function (e) {
                self.onNextBtnTapped(e, input, self);
            });
        }

        //set previous button (if any)
        if (current_position - 1 > 0) {

            //check if the first input is a hidden genkey, in that case do not show prev button
            if (current_position === 2) {

                inputs_values = JSON.parse(wls.inputs_values);
                first_input = inputs_values[0];

                if (first_input.is_primary_key === 1 && is_genkey_hidden === 1) {
                    //hide prev button for first input of the form
                    prev_btn.addClass("invisible");
                    is_prev_button_hidden = true;
                }
            }

            //bind vclick event only if the button is not hidden
            if (!is_prev_button_hidden) {
                //handler for prev button, showing prev input
                prev_btn.off().on('vclick', function (e) {
                    self.onPrevBtnTapped(e, input);
                });
            }

        } else {

            //hide prev button for first input of the form
            prev_btn.addClass("invisible");

            //reset inputs_trail in session
            wls.removeItem('inputs_trail');
        }

        //show store edit button if we are in "editing mode" and bind it to callback
        if (wls.edit_mode) {

            $('div.store-edit').removeClass('not-shown');

            /* Disable store edit button when a new jump sequence was triggered
             * by the user making a change to a input field with a jump
             * User is then forced to go through the form until it ends to follow the new jumps sequence
             */
            if (wls.has_new_jump_sequence) {
                $('div.store-edit').addClass('ui-disabled');
            } else {
                $('div.store-edit').removeClass('ui-disabled');
            }

            //bind events with on(), as we need to submit again if the input does not validate successfully
            $('div.store-edit').off().on('vclick', function () {

                var cached_value;

                if (parseInt(input.has_jump, 10) === 1) {

                    current_position = wls.current_position;
                    cached_value = EC.Inputs.getCachedInputValue(current_position);

                    //TODO: do validation first??? or is it done when calling prepareStoreEdit?

                    /*
                     * if we are making a change to a field triggering a jump
                     * ask confirmation to user he will have to complete the whole form
                     */

                    if (!self.valuesMatch(cached_value, current_value, input.type)) {

                        //disable intermediate "store edit" button
                        //	$('div.store-edit').addClass('ui-disabled');

                        //TODO:
                        //Alert user there is the need to complete the whole form
                        EC.Notification.showAlert(EC.Localise.getTranslation("warning"), EC.Localise.getTranslation("edited_jump"));

                        //set flag as from now until saving the form, store edit from an intermediate screen is disabled
                        wls.has_new_jump_sequence = 1;

                    } else {

                        wls.removeItem("has_new_jump_sequence");
                        self.prepareStoreEdit(current_position, input, self);
                    }

                } else {
                    self.prepareStoreEdit(current_position, input, self);
                }

            });

        }
        else {
            $('div.store-edit').addClass('not-shown');
        }

        //update completion percentage and bar for this form
        self.updateFormCompletion(current_position, inputs_total);

    };
    //renderInput

    return module;

}(EC.Inputs));
