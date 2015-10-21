/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.radio = function (the_value, the_input) {

        var obj;
        var span_label = $('div#radio div#input-radio span.label');
        var clone = $('div.clone');
        var double_entry;
        var value = the_value;
        var old_cached_value;
        var input = the_input;
        var HTML = "";
        var RADIO_CHECKED = "";
        var DISABLED = "";

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //Add attribute to flag the primary key input field
        if (parseInt(input.is_primary_key, 10) === 1) {
            span_label.attr('data-primary-key', 'true');
        } else {
            //reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
            span_label.attr('data-primary-key', '');
        }

        //check if we need to replicate this input
        double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

        //if in editing mode, do not allow changes if the field is a primary key
        if (window.localStorage.edit_mode && parseInt(input.is_primary_key, 10) === 1) {
            DISABLED = 'disabled="disabled"';
        }

        HTML += '<fieldset data-role="controlgroup">';

        //render list of options
        $(input.options).each(function (index) {

            //increase value by 1, as we use value = 0 when no option is selected (like for select/dropdown) We are using the index as radio jumps are mapped against the index of the value
            var option_value = this.value;
            var option_index = (index + 1);
            var option_label = this.label;
            var option_id = 'radio-choice-' + (index + 1);

            //pre select an element if the value matches the cached value
            RADIO_CHECKED = (value === option_value) ? 'checked="checked"' : "";

            HTML += '<input type="radio" name="radio-options" id="' + option_id + '" value="' + option_value + '"' + RADIO_CHECKED + ' ' + DISABLED + ' data-index="' + option_index + '">';
            HTML += '<label for="' + option_id + '">' + option_label + '</label>';
        });

        HTML += '</fieldset>';

        span_label.append(HTML);
        $('div#input-radio').trigger("create");
    };

    return module;

}(EC.InputTypes));
