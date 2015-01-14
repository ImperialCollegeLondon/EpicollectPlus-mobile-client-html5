/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {"use strict";

		module.getBranchEntriesList = function() {

			/* hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to;
			 * we need it as we need to link the branch entries to a single hierarchy form entry (like it is its parent)
			 */
			var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
			var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position);
			var project_id = parseInt(window.localStorage.project_id, 10);
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var offset = 0;

			//look for branch entries
			$.when(EC.Select.getBranchEntries(project_id, branch_form.name, hierarchy_entry_key_value, 0)).then(function(the_branch_entries) {

				if (the_branch_entries.length > 0) {
					//entries found, render list
					EC.Entries.renderBranchEntriesList(the_branch_entries);
				} else {
					
					//no branch entries, user probably deleted all of them, go back to hierarchy form
					EC.BranchInputs.backToHierarchyForm();

				}

			});

		};

		return module;

	}(EC.Entries));
