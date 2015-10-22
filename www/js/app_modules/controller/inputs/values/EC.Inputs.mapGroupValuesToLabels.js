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

    module.mapGroupValuesToLabels = function (the_group_inputs, the_values) {

        var group_inputs = the_group_inputs;
        var values = the_values;
        var checkbox_values;
        var labels = [];

        $.each(values, function (index, single_value) {
            $.each(group_inputs, function (index, single_group_input) {

                //map each cached value to its group input value
                if (single_group_input.ref === single_value.ref) {

                    //checkboxs need a different mapping, as they allow multiple values to be saved
                    if (single_group_input.type === EC.Const.CHECKBOX) {

                        checkbox_values = [];

                        //single_value.value is array of values (selected checkboxes)
                        $(single_value.value).each(function (index, value) {

                            //single_group_input.options has labels and values
                            $(single_group_input.options).each(function (index, option) {

                                //for each value, get the label (loop and map)
                                if (option.value === value) {
                                    checkbox_values.push({label: option.label, value: value});
                                }
                            });
                        });

                        //return all the checkbox value mapped against its lable
                        labels.push({label: single_group_input.label, value: checkbox_values});
                    }
                    else {

                        //radio and dropdown need mapping too, but they always have a single value
                        if (single_group_input.type === EC.Const.RADIO || single_group_input.type === EC.Const.DROPDOWN) {

                            //single_group_input.options has labels and values
                            $(single_group_input.options).each(function (index, option) {

                                //for each value, get the label (loop and map)
                                if (option.value === single_value.value) {
                                    labels.push({label: single_group_input.label, value: option.label});
                                }
                            });
                        }
                        else {
                            //any othe input gets  a single value
                            labels.push({label: single_group_input.label, value: single_value.value});
                        }

                    }
                }
            });
        });

        return labels;
    };

    return module;

}(EC.Inputs));
