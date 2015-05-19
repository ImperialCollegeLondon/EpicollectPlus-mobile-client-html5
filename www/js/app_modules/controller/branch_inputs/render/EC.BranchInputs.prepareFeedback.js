/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.prepareFeedback = function(the_status, the_entry_key) {

			var self = this;
			var status = the_status;
			var page = EC.Const.BRANCH_VIEWS_DIR + EC.Const.BRANCH_FEEDBACK_VIEW;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			var entry_key = the_entry_key;

			//prepare feedback based on status
			if (status) {
				self.message = "Branch entry saved successfully!";

				/*
				 * Cache entry key value for the branch form entry just saved. If the main form does not get saved (user leaves without saving)
				 * we have to remove from the DB all the rows with that entry key value. This will work no matter how many branch forms we have
				 * for a main (hierarchy) form. This array is cleared when either the form is saved or all its cached entries are deleted.
				 */
				self.setCachedBranchEntryKeys(branch_form.name, [entry_key]);

			} else {
				self.message = "Error saving data...please retry";
			}

			EC.Routing.changePage(page);

		};

		return module;

	}(EC.BranchInputs));
