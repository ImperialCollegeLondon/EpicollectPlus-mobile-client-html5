/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.group = function (the_value, the_input) {

        

        var span_label = $('span.label');
        var clone = $('div.clone');
        var value = the_value;
        var input = the_input;

        var group_wrapper = $('div#input-group');
        var RADIO_CHECKED = '';
        var SELECTED = '';
        var CHECKBOX_CHECKED = '';
        var datepicker;
        var timepicker;
        var ios_datepicker;
        var ios_timepicker;
        var html;

        //clear any previous group dom
        group_wrapper.empty();

        //update label text
        span_label.text(input.label);

        //parse group_inputs (if they are not parsed already)
        if (!Array.isArray(input.group_inputs)) {
            input.group_inputs = JSON.parse(input.group_inputs);
        }

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //add group title
        group_wrapper.append('<span class="group-header label">' + input.label + '</span>');

        html = '';

        //if value is an array, we have some cached group values to map, as on first load is a string
        //todo what about when we edit existing data?
        if (Array.isArray(value)) {
            //map the cached values to each group input value property, so we can display cached values
            input.group_inputs = EC.Inputs.mapGroupCachedValues(input.group_inputs, value);
        }

        //render all inputs for the group dinamically
        $.each(input.group_inputs, function (index, single_group_input) {

            single_group_input.value = (single_group_input.value) ? single_group_input.value : '';


            switch (single_group_input.type) {

                //render text inputs
                case EC.Const.TEXT:

                    html += '<div class="group-text" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';
                    html += '<input type="text" name="the_name" value="' + single_group_input.value + '"/>';
                    html += '</div>';
                    break;

                //render textarea inputs
                case EC.Const.TEXTAREA:

                    html += '<div class="group-textarea" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';
                    html += '<textarea>' + single_group_input.value + '</textarea>';
                    html += '</div>';
                    break;

                //render checkbox inputs
                case EC.Const.CHECKBOX:

                    html += '<div class="group-checkbox" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';
                    //List of checkbox options  generated dynamically

                    //display all checkboxes options
                    $(single_group_input.options).each(function (index) {

                        var name = 'choice';
                        var option_value = this.value.trim();
                        var option_label = this.label.trim();
                        var option_id = 'checkbox-choice-' + (index + 1);
                        var i;
                        var iLength = single_group_input.value.length;

                        //check if we have any value stored. For checkboxes, 'value' will be an array
                        for (i = 0; i < iLength; i++) {

                            CHECKBOX_CHECKED = '';
                            //if any match is found, pre-select that checkbox in the markup
                            if (single_group_input.value[i].trim() === option_value) {
                                CHECKBOX_CHECKED = 'checked="checked"';
                                break;
                            }
                        }

                        html += '<label>';
                        html += '<input type="checkbox" ' + CHECKBOX_CHECKED + ' name="' + name;
                        html += '" id="' + option_id;
                        html += '" value="' + option_value;
                        html += '" data-label="' + option_label;
                        html += '" />' + option_label;
                        html += '</label>';

                    });

                    html += '</div>';
                    break;

                //render date inputs
                case EC.Const.DATE:

                    //set default value to date input
                    if (single_group_input.value === input.datetime_format) {
                        single_group_input.value = EC.Utils.parseDate(new Date(), input.datetime_format);
                    }


                    html += '<div class="group-date" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';
                    html += '<input type="text" name="the_name" class="nativedatepicker" data-datetimeformat="' + single_group_input.datetime_format + '" data-raw-date="' + new Date() + '" readonly value="' + single_group_input.value + '"/>';
                    html += '<input type="date" name="the_date" class="ios-date" style="position:absolute; top:-200em;" value="' + single_group_input.value + '"/>';
                    html += '</div>';
                    break;

                //render decimal inputs
                case EC.Const.DECIMAL:

                    //todo add decimal logic, messy with more on the same page?
                    html += '<div class="group-decimal" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';

                    html += '<span class="min-range hidden"></span>';
                    html += '<span class="max-range hidden"></span>';

                    //Input for decimals is set as text to avoid the browser built-in validation
                    html += ' <input type="text" name="the_name" value="' + single_group_input.value + '"/>';
                    html += '</div>';
                    break;

                //render integer inputs
                case EC.Const.INTEGER:

                    //todo add integer logic, messy with more on the same page?
                    html += '<div class="group-integer" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';

                    html += '<span class="min-range hidden"></span>';
                    html += '<span class="max-range hidden"></span>';

                    //Input for decimals is set as text to avoid the browser built-in validation
                    html += ' <input type="number" name="the_name" value="' + single_group_input.value + '"/>';
                    html += '</div>';
                    break;

                //render radio inputs
                case EC.Const.RADIO:

                    //todo add radio logic, messy with more on the same page?
                    html += '<div class="group-radio" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';


                    //List of radio buttons  generated dynamically
                    html += '<fieldset data-role="controlgroup">';

                    //render list of options
                    $(single_group_input.options).each(function (index) {

                        //increase value by 1, as we use value = 0 when no option is selected (like for select/dropdown) We are using the index as radio jumps are mapped against the index of the value
                        var option_value = this.value;
                        var option_index = (index + 1);
                        var option_label = this.label;
                        var option_id = 'radio-choice-' + (index + 1);

                        //pre select an element if the value matches the cached value
                        RADIO_CHECKED = (single_group_input.value === option_value) ? 'checked="checked"' : '';

                        html += '<input type="radio" name="radio-options" id="' + option_id + '" value="' + option_value + '"' + RADIO_CHECKED + ' data-index="' + option_index + '">';
                        html += '<label for="' + option_id + '">' + option_label + '</label>';
                    });

                    html += '</fieldset>';
                    html += '</div>';
                    break;

                //render dropdown inputs
                case EC.Const.DROPDOWN:

                    //todo add dropdown logic, messy with more on the same page?
                    html += '<div class="group-dropdown" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';

                    //List of dropdown options  generated dynamically
                    //set the cached value as the selcted option
                    SELECTED = (single_group_input.value === '') ? 'selected' : '';

                    //TODO: check markup on jqm docs for select. Fastclick: is needclick
                    // needed?
                    html += '<select id="selection" name="selection" data-native-menu="true" >';
                    html += '<option value ="0"' + SELECTED + ' data-index="0">';
                    html += EC.Localise.getTranslation(EC.Const.NO_OPTION_SELECTED);
                    html += '</option>';

                    $(single_group_input.options).each(function (index) {

                        var option_value = this.value;
                        var option_index = (index + 1);
                        var option_label = this.label;
                        var option_id = 'select-choice-' + (index + 1);

                        //check if we have a value cached and pre-select that input
                        SELECTED = (single_group_input.value === option_value) ? 'selected' : '';

                        html += '<option ' + SELECTED + ' value ="' + option_value + '" data-index="' + option_index + '">' + option_label + '</option>';

                    });

                    html += '</select>';
                    html += '</div>';
                    break;

                //render time inputs
                case EC.Const.TIME:

                    //set default value to date input
                    if (single_group_input.value === input.datetime_format) {
                        single_group_input.value = EC.Utils.parseDate(new Date(), input.datetime_format);
                    }


                    html += '<div class="group-time" data-input-ref="' + single_group_input.ref + '">';
                    html += '<span class="label">' + single_group_input.label + '</span>';
                    html += '<input type="text" name="the_name" class="nativedatepicker" data-datetimeformat="' + single_group_input.datetime_format + '" data-raw-date="' + new Date() + '" readonly value="' + single_group_input.value + '"/>';
                    html += '<input type="time" name="the_date" class="ios-time" style="position:absolute; top:-200em;" value="' + single_group_input.value + '"/>';
                    html += '</div>';
                    break;

            }
        });

        console.log(html);

        //append the whole html
        group_wrapper.append(html);

        //add jquery mobile styling when dom is ready
        group_wrapper.trigger('create');

        //Android DatePicker plugin http://goo.gl/xLrqZl
        datepicker = $('div.group-date input.nativedatepicker');
        timepicker = $('div.group-time input.nativedatepicker');

        //iOS uses the HTML5 input type='date'
        ios_datepicker = $('div.group-date input.ios-date');
        ios_timepicker = $('div.group-time input.ios-time');

        if (window.device) {
            /*****************************************************************************************
             * Android uses the Phonegap official DatePicker plugin
             ****************************************************************************************/
            if (window.device.platform === EC.Const.ANDROID) {

                console.log('datepicker length: ' + datepicker.length);

                //attach events to each date input
                datepicker.each(function () {
                    EC.Datetime.initAndroidDatetimePicker($(this), $(this).attr('data-datetimeformat'), EC.Const.DATE);
                });
                //attach event to all time inputs
                timepicker.each(function () {
                    EC.Datetime.initAndroidDatetimePicker($(this), $(this).attr('data-datetimeformat'), EC.Const.TIME);
                });
            }
            /*****************************************************************************************
             * iOS uses the official HTML5 input type='date'
             ****************************************************************************************/
            //todo text this on iOS
            if (window.device.platform === EC.Const.IOS) {
                //attach events to each date input
                ios_datepicker.each(function () {
                    EC.Datetime.initiOSDatetimePicker($(this), $(this).attr('data-datetimeformat'), EC.Const.DATE);
                });
                //attach event to all time inputs
                ios_timepicker.each(function () {
                    EC.Datetime.initiOSDatetimePicker($(this), $(this).attr('data-datetimeformat'), EC.Const.TIME);
                });
            }
        }
    };
    return module;

}(EC.InputTypes));
