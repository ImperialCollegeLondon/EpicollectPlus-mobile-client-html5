/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.dropdown = function (the_value, the_input) {

        var span_label = $('div#select span.label');
        var clone = $('div.clone');
        var double_entry;
        var value = the_value;
        var input = the_input;
        var disabled = '';
        var selected = '';
        var html = '';

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
            //reset the attribute to empty if not a primary key (JQM caches
            // pages and we recycle views)
            span_label.attr('data-primary-key', '');
        }

        //check if we need to replicate this input
        double_entry = (parseInt(input.has_double_check, 10) === 1);

        //if in editing mode, do not allow changes either if the field is a
        // primary key or it triggers a jump
        if (window.localStorage.edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
            disabled = 'disabled="disabled"';
        }

        //set the cached value as the selcted option
        selected = (value === '') ? 'selected' : '';

        //TODO: check markup on jqm docs for select. Fastclick: is needclick needed?
        html += '<select id="selection" name="selection" data-native-menu="true" >';
        html += '<option value ="0"' + selected + ' data-index="0">';
        html += EC.Localise.getTranslation(EC.Const.NO_OPTION_selected);
        html += '</option>';

        $(input.options).each(function (index) {

            var option_value = this.value;
            var option_index = (index + 1);
            var option_label = this.label;
            var option_id = 'select-choice-' + (index + 1);

            //check if we have a value cached and pre-select that input
            selected = (value === option_value) ? 'selected' : '';

            html += '<option ' + selected + ' ' + disabled + ' value ="' + option_value + '" data-index="' + option_index + '">' + option_label + '</option>';

        });

        html += '</select>';

        span_label.append(html);
        $('div#input-dropdown').trigger('create');
    };

    return module;

}(EC.InputTypes));
