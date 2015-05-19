/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		var branch_form_name;
		var project_id;
		var hierarchy_entry_key_value;
		
		module.branch_rows_to_sync = [];

		module.postBranchEntries = function(the_hierarchy_entry_key_value) {
			
			var self = this;
			branch_form_name = self.branch_form_name;
			project_id = parseInt(window.localStorage.project_id, 10);
			hierarchy_entry_key_value = the_hierarchy_entry_key_value;

			EC.Select.getOneBranchEntry(branch_form_name, project_id, hierarchy_entry_key_value);

		};

		return module;

	}(EC.Upload));
