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

    module.mapGroupCachedValues = function (the_group_inputs, the_cached_values) {

        debugger;

        var group_inputs = the_group_inputs;
        var values = the_cached_values;


        $.each(values, function (index, single_value) {

            $.each(group_inputs, function (index, single_group_input) {

                //map each cached value to its group input value
                if (single_group_input.ref === single_value.ref) {

                    //checkboxs need a different mapping
                    if (single_group_input.type === EC.Const.CHECKBOX) {
                        single_group_input.value = single_value.value;
                    }
                    else {
                        //any othe input gets  a single value
                        single_group_input.value = single_value.value;
                    }


                }
            });
        });


        return group_inputs;


    };

    return module;


}(EC.Inputs));
