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
EC.Parse = ( function() {"use strict";

		//static variable to expose across the module
		//*******************************************
		var is_form_genkey_hidden;
		var form_key;
		//project definition
		var project = {};
		//parsed forms
		var parsed_forms = [];
		//store inputs for hierarchy forms (main) (each element is an object with allthe inputs for a single form)
		var inputs = [];
		//store inputs for branch forms (main) (each element is an object with allthe inputs for a single form)
		var branch_inputs = [];
		var form_inputs_positions = [];
		//store list of inputs for a single form
		var input_list = [];
		//store sets of option for tags like <radio>, <select> and <select1>
		var options = [];
		var branch_options = [];
		//*******************************************

		var  getHierarchyForms = function() {
			
			var self = this;
			var i;
			var iLength = self.parsed_forms.length;
			var hierarchy_forms = [];
			

			for ( i = 0; i < iLength; i++) {
				if (self.parsed_forms[i].type === "main") {

					hierarchy_forms.push(self.parsed_forms[i]);
				}
			}
			return hierarchy_forms;
		};

		var  getBranchForms = function() {

			var self = this;
			var i;
			var iLength = self.parsed_forms.length;
			var branch_forms = [];

			for ( i = 0; i < iLength; i++) {
				if (self.parsed_forms[i].type === "branch") {

					branch_forms.push(self.parsed_forms[i]);
				}
			}
			return branch_forms;
		};

		return {
			//****************************************
			project : project,
			form_key : form_key,
			parsed_forms : parsed_forms,
			inputs : inputs,
			options : options,
			branch_options : branch_options,
			input_list : input_list,
			branch_inputs : branch_inputs,
			is_form_genkey_hidden : is_form_genkey_hidden,
			//*****************************************
			form_inputs_positions : form_inputs_positions,
			getHierarchyForms : getHierarchyForms,
			getBranchForms : getBranchForms
		};

	}());

