/*global $, jQuery*/
/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.getGroupCurrentValues = function () {

        debugger;

        //for a group, we need to loop all the inputs, per each type
        var group_text_inputs = $('div.group-text');
        var group_textarea_inputs = $('div.group-textarea');
        var group_integer_inputs = $('div.group-integer');
        var group_decimal_inputs = $('div.group-decimal');
        var group_date_inputs = $('div.group-date');
        var group_time_inputs = $('div.group-time');
        var group_dropdown_inputs = $('div.group-dropdown');
        var group_radio_inputs = $('div.group-radio');
        var group_checkbox_inputs = $('div.group-checkbox');
        var group_values = [];

        $.each(group_text_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value = $(this).find('input').val();
            console.log(ref, value);
            group_values.push({ref: ref, value: value});
        });

        $.each(group_textarea_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value = $(this).find('textarea').val();
            console.log(ref, value);
            group_values.push({ref: ref, value: value});

        });

        $.each(group_integer_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value = $(this).find('input').val();
            console.log(ref, value);
            group_values.push({ref: ref, value: value});

        });

        $.each(group_decimal_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value = $(this).find('input').val();
            console.log(ref, value);
            group_values.push({ref: ref, value: value});

        });

        $.each(group_date_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value;

            if (window.device) {
                if (window.device.platform === EC.Const.ANDROID) {
                    value = $(this).find('input.nativedatepicker').val() || '';
                }
                if (window.device.platform === EC.Const.IOS) {
                    value = $(this).find('input.ios-date').val() || '';
                }
            }
            else {
                //testing on Chrome
                value = '';
            }
            console.log(ref, value);
            group_values.push({ref: ref, value: value});
        });

        $.each(group_time_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var value;

            if (window.device) {
                if (window.device.platform === EC.Const.ANDROID) {
                    value = $(this).find('input.nativedatepicker').val() || '';
                }
                if (window.device.platform === EC.Const.IOS) {
                    value = $(this).find('input.ios-time').val() || '';
                }
            }
            else {
                //testing on Chrome
                value = '';
            }

            console.log(ref, value);
            group_values.push({ref: ref, value: value});
        });

        $.each(group_checkbox_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var input_holder = $(this).find('input[type=checkbox]:checked');

            //single checkbox
            var checkbox_value = {
                value: '',
                ref: ref
            };

            //list of selected options for a single checkbox
            var checkboxes_values = [];

            $(input_holder).each(function () {

                //todo why are we caching the label?
                //checkboxes_values.push({
                //    value: $(this).val().trim(),
                //    label: $(this).parent().text().trim()
                //});
                checkboxes_values.push(
                    $(this).val().trim()
                );
            });

            //cache empty string if no checkboxes are selected
            checkbox_value.value = (checkboxes_values.length === 0) ? EC.Const.NO_OPTION_SELECTED : checkboxes_values;

            group_values.push(checkbox_value);
        });

        $.each(group_dropdown_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var input_holder = $(this).find('select').find('option:selected');

            /* single selection dropdown' grab both value and index:
             * index is needed for the jumps/validation and value will be saved and displayed to users (linked to label)
             */
            var dropdown_value = {
                value: '',
                index: '',
                ref: ref
            };

            dropdown_value.value = input_holder.val();
            dropdown_value.index = input_holder.attr('data-index');

            //if the value is '0', for consistency set it to a default for unselected option
            if (dropdown_value.index === '0') {
                dropdown_value.index = EC.Const.NO_OPTION_SELECTED;
            }

            group_values.push(dropdown_value);

        });

        $.each(group_radio_inputs, function () {

            var ref = $(this).attr('data-input-ref');
            var input_holder = $(this).find('input[type=radio]:checked');

            /* single selection dropdown' grab both value and index:
             * index is needed for the jumps/validation and value will be saved and displayed to users (linked to label)
             */
            var radio_value = {
                value: '',
                index: '',
                ref: ref
            };

            radio_value.value = input_holder.val();
            radio_value.index = input_holder.attr('data-index');

            //if no value selected among the radio options, create an empty object with NO_OPTION_SELECTED label
            if (radio_value.value === undefined) {
                radio_value.value = EC.Const.NO_OPTION_SELECTED;
                radio_value.index = EC.Const.NO_OPTION_SELECTED;
            } else {
                radio_value.value.trim();
                radio_value.index.trim();
            }

            group_values.push(radio_value);

        });

        return group_values;

    };

    return module;


}(EC.Inputs));
