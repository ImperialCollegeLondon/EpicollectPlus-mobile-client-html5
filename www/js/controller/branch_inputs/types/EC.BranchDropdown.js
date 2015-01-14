/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
        "use strict";

        module.dropdown = function(the_value, the_input) {

            //to cache dom lookups
            var obj;
            var span_label = $('div#branch-select span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;
            var DISABLED = "";
            var SELECTED = "";
            var HTML = "";

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
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            //if in editing mode, do not allow changes either if the field is a
            // primary key or it triggers a jump
            if (window.localStorage.branch_edit_mode && (input.is_primary_key === '1' || input.has_jump === '1')) {
                DISABLED = 'disabled="disabled"';
            }

            SELECTED = (value === "") ? 'selected' : "";

            //TODO: check markup on jqm docs for select. Fastclick: is needclick
            // needed?
            HTML += '<select id="selection" name="selection" data-native-menu="true" >';
            HTML += '<option value ="0"' + SELECTED + '>' + EC.Const.NO_OPTION_SELECTED + '</option>';

            $(input.options).each(function(index) {

                var option_value = this.value;
                var option_index = (index + 1);
                var option_label = this.label;
                var option_id = 'select-choice-' + (index + 1);

                //check if we have a value cached and pre-select that input
                SELECTED = (value === option_value) ? 'selected' : "";

                HTML += '<option ' + SELECTED + ' ' + DISABLED + ' value ="' + option_value + '" data-index="' + option_index + '">' + option_label + '</option>';
            });

            HTML += '</select>';

            span_label.append(HTML);
            $('div#branch-input-dropdown').trigger("create");

            /*****************************************************************************************************
             *	Following code is a hack to make the select native widget work on
             * Android 4.4.2 (Nexus 5)
             */
            //Add needclick to all the markup as Fastclick is interfering and the
            // native popup with the list of options is never triggered
            // $("div#input-dropdown").addClass("needsclick");
            // $("div#input-dropdown div.ui-select").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn
            // span.ui-btn-inner").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-btn-text span").addClass("needsclick");
            // $("div#input-dropdown div.ui-btn span.ui-btn-inner
            // span.ui-icon").addClass("needsclick");

            //Manually trigger a click on a select element. Best solution I came
            // across
            $("select").on('vmousedown', function(e) {
                $(this).focus().click();
            });

            /*****************************************************************************************************
             * End hack
             */

        };

        return module;

    }(EC.BranchInputTypes));
