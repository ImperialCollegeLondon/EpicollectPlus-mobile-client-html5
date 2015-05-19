/*jslint vars: true , nomen: true, devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 * @module EC
 * @submodulemodule Parser
 *
 * Parse the XML (normalising it) and create the following objects matching the DB structure
 *
 * - Project
 * - Forms
 * - Inputs
 * - Input_options
 *
 */

var EC = EC || {};
EC.Parse = EC.Parse || {};
EC.Parse = (function (module) {
    'use strict';

    //static variable to expose across the module
    //*******************************************
    module.is_form_genkey_hidden = '';
    module.form_key = '';
    //project definition
    module.project = {};
    //parsed forms
    module.parsed_forms = [];
    //store inputs for hierarchy forms (main) (each element is an object with allthe inputs for a single form)
    module.inputs = [];
    //store inputs for branch forms (main) (each element is an object with allthe inputs for a single form)
    module.branch_inputs = [];
    module.form_inputs_positions = [];
    //store list of inputs for a single form
    module.input_list = [];
    //store sets of option for tags like <radio>, <select> and <select1>
    module.options = [];
    module.branch_options = [];
    //*******************************************

    module.getHierarchyForms = function () {

        var self = this;
        var i;
        var iLength = self.parsed_forms.length;
        var hierarchy_forms = [];

        for (i = 0; i < iLength; i++) {
            if (self.parsed_forms[i].type === 'main') {
                hierarchy_forms.push(self.parsed_forms[i]);
            }
        }
        return hierarchy_forms;
    };

    module.getBranchForms = function () {

        var self = this;
        var i;
        var iLength = self.parsed_forms.length;
        var branch_forms = [];

        for (i = 0; i < iLength; i++) {
            if (self.parsed_forms[i].type === 'branch') {
                branch_forms.push(self.parsed_forms[i]);
            }
        }
        return branch_forms;
    };
    return module;

}(EC.Parse));

