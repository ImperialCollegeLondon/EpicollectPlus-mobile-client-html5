/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    /**
     * @method isEmptyPrimaryKey: Check whether a primary key exists in the array of branch values we are abut to save.
     */
    module.isEmptyPrimaryKey = function () {

        var is_empty_primary_key = true;
        var branch_inputs_values;
        var i;
        var iLength;

        //catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
        try {
            branch_inputs_values = JSON.parse(window.localStorage.branch_inputs_values);
        } catch (error) {
            return is_empty_primary_key;
        }

        iLength = branch_inputs_values.length;
        for (i = 0; i < iLength; i++) {

            //if there is an input valus, check if it is a primary key (some values can be null in the case of jumps)
            if (branch_inputs_values[i]) {
                if (parseInt(branch_inputs_values[i].is_primary_key, 10) === 1) {
                    is_empty_primary_key = (branch_inputs_values[i].value === '');
                }
            }
        }

        return is_empty_primary_key;
    };

    return module;

}(EC.BranchInputs));
