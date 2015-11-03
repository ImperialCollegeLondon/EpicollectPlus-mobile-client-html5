/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    var _isUniqueValue = function (the_value) {

        var primary_keys = [];
        var value = the_value;
        var unique = true;

        //get Hierarchy (main) primary keys
        primary_keys = JSON.parse(window.localStorage.primary_keys);

        //check if the current value clashes a global primary key
        if (primary_keys.indexOf(value) !== -1) {
            unique = false;
        }

        return unique;
    };

    module.validateValue = function (the_input, the_value) {

        var self = this;
        var input = the_input;
        var current_value = the_value;
        var clone_value = '';
        var is_primary_key = $('span.label').attr('data-primary-key');
        var validation = {};

        //get value from object in the case of a dropdown, radio or checkbox
        if (input.type === EC.Const.DROPDOWN || input.type === EC.Const.RADIO || input.type === EC.Const.CHECKBOX) {
            current_value = current_value.value;
        }

        //if we need to check for a double entry, get clone value
        if (parseInt(input.has_double_check, 10) === 1) {
            clone_value = self.getCloneValue(input.type);
        }

        //validate input
        validation = EC.Utils.isValidValue(input, current_value, clone_value);

        if (!validation.is_valid) {
            //value not valid, return
            return validation;
        }

        //check if this input value is a primary key field: if it is, check uniqueness (skip when we are editing)
        if (is_primary_key === 'true' && !window.localStorage.edit_mode) {

            if (!_isUniqueValue(current_value)) {

                //primary key value already exist, return
                validation = {
                    is_valid: false,
                    message: EC.Localise.getTranslation("value_exist")
                };

                //on Chrome native alert is not working: dump to console error message
                console.log("Error: value already exists");

                return validation;
            }
        }

        return validation;

    };

    return module;

}(EC.Inputs));
