/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToBranchEntryValuesList = function() {

			//get hash from localStorage to navigate back to branch entry values list
			var back_url = window.localStorage.branch_entry_values_url;

			//clear branch data cache
			window.localStorage.removeItem("branch_current_position");
			window.localStorage.removeItem("branch_form_has_jumps");
			window.localStorage.removeItem("branch_form_name");
			window.localStorage.removeItem("branch_inputs_total");
			window.localStorage.removeItem("branch_inputs_trail");
			window.localStorage.removeItem("branch_inputs_values");
			window.localStorage.removeItem("branch_form_id");
			window.localStorage.removeItem("branch_edit_hash");
			window.localStorage.removeItem("branch_edit_key_value");
			window.localStorage.removeItem("branch_edit_type");
			
			//clear navigation url
			window.localStorage.removeItem("branch_entry_values_url");

			//get branch entry values
			EC.Routing.changePage(back_url);
			
		};

		return module;

	}(EC.Inputs));
