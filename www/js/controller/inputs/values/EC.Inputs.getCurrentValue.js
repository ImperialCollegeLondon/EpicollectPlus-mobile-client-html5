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

    /* Get the current input value based on the input type
     *
     * @return - a single value or an array of values based on the type passed
     */
    module.getCurrentValue = function (the_type) {

        var type = the_type;
        var values = [];
        var checkboxes_values = [];
        var branch_form;
        var branch_entries;
        var current_value;
        var got_value;
        var input_holder;

        switch (type) {

            case EC.Const.TEXT:
                values.push($('div#input-text input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.TEXTAREA:
                values.push($('div#input-textarea textarea').val());
                got_value = values[0].trim();
                break;

            case EC.Const.INTEGER:
                values.push($('div#input-integer input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.DECIMAL:
                values.push($('div#input-decimal input').val());
                got_value = values[0].trim();
                break;

            case EC.Const.DATE:
                values.push($('div#input-date input').val());
                got_value = values[0];
                break;

            case EC.Const.TIME:
                values.push($('div#input-time input').val());
                got_value = values[0];
                break;

            case EC.Const.RADIO:

                input_holder = $('div#input-radio input[type=radio]:checked');

                /* single selection radio: grab both value and 'label':
                 * value is needed for the jumps/validation and label will be saved and displayed to users
                 */
                current_value = {
                    value: '',
                    index: ''
                };
                current_value.value = input_holder.val();
                current_value.index = input_holder.attr('data-index');

                //if no value selected among the radio options, create an empty object with NO_OPTION_SELECTED label
                if (current_value.value === undefined) {
                    current_value.value = EC.Const.NO_OPTION_SELECTED;
                    current_value.index = EC.Const.NO_OPTION_SELECTED;
                } else {
                    current_value.value.trim();
                    current_value.index.trim();
                }

                values.push(current_value);

                got_value = values[0];
                break;

            //multiple selection checkboxes
            case EC.Const.CHECKBOX:

                /*
                 * Get all the selected checkboxes. Checkboxes jumps are mapped against the value, not the index, so use its label
                 */
                $('div#input-checkbox input[type=checkbox]:checked').each(function () {
                    checkboxes_values.push({
                        value: $(this).val().trim(),
                        label: $(this).parent().text().trim()
                    });
                });

                //cache empty string if no checkboxes are selected
                values.push((checkboxes_values.length === 0) ? EC.Const.NO_OPTION_SELECTED : checkboxes_values);

                //return array of object (one per each selected checkbox)
                got_value = values[0];
                break;

            case EC.Const.DROPDOWN:

                input_holder = $('div#input-dropdown select option:selected');

                /* single selection dropdown' grab both value and index:
                 * index is needed for the jumps/validation and value will be saved and displayed to users (linked to label)
                 */
                current_value = {
                    value: '',
                    index: ''
                };

                current_value.value = input_holder.val();
                current_value.index = input_holder.attr('data-index');

                //if the value is '0', for consistency set it to a default for unselected option
                if (current_value.index === '0') {
                    current_value.index = EC.Const.NO_OPTION_SELECTED;
                }

                values.push(current_value);

                got_value = values[0];
                break;

            case EC.Const.BARCODE:
                current_value = $('div#input-barcode input.scan-result').val();
                values.push(current_value);
                //console.log('barcode current value is: ' + current_value);
                got_value = values[0];
                break;

            case EC.Const.LOCATION:
                current_value = $('div#input-location textarea#set-location-result').val();
                values.push(current_value);
                //console.log('location current value is: ' + current_value);
                got_value = values[0];
                break;

            case EC.Const.AUDIO:

                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: '...audio cached  uri...',
                        stored: '...audio stored uri...'
                    };

                } else {

                    //console.log('getting audio file values');

                    current_value = {
                        cached: $('div#input-audio input#cached-audio-uri').val(),
                        stored: $('div#input-audio input#stored-audio-uri').val()
                    };

                    //console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.VIDEO:

                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: '...video cached  uri...',
                        stored: '...video stored uri...'
                    };

                } else {

                    console.log('getting video file values');

                    current_value = {
                        cached: $('div#input-video input#cached-video-uri').val(),
                        stored: $('div#input-video input#stored-video-uri').val()
                    };

                    console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.PHOTO:

                //keep track of both cache value(image uri currently on canvas) and store value (image uri on the database)
                if (EC.Utils.isChrome()) {

                    current_value = {
                        cached: 'placeholder.jpg',
                        stored: 'placeholder.jpg'
                    };

                } else {

                    current_value = {
                        cached: $('div#input-photo input#cached-image-uri').val(),
                        stored: $('div#input-photo input#stored-image-uri').val()
                    };

                    console.log('current_value ' + JSON.stringify(current_value));

                }

                values.push(current_value);
                got_value = values[0];
                break;

            case EC.Const.BRANCH:

                //this is a branch form input, so its value is na object with the branch form name and the its total of entries
                branch_form = JSON.parse(window.localStorage.branch_form);

                //get branch entries for this form from DOM. If branch entries is NaN, it means we have no entries (0)
                branch_entries = parseInt($('div#input-branch div#list-branch-entries-btn span span.branch-entries-count').text(), 10);

                current_value = {
                    branch_form_name: branch_form.name,
                    branch_total_entries: isNaN(branch_entries) ? 0 : branch_entries
                };

                console.log(branch_entries);

                values.push(current_value);
                got_value = values[0];
                break;

        }//switch

        return got_value;

    };

    return module;

}(EC.Inputs));
