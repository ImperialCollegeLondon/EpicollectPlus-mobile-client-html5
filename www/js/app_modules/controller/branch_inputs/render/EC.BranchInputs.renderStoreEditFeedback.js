/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderStoreEditFeedback = function(is_positive) {

			//EC.Notification.hideProgressDialog();

			if (is_positive) {

				EC.Notification.showToast(EC.Localise.getTranslation("edit_saved"), "short");

				//remove flag that disable store edit from an intermediate screen
				window.localStorage.removeItem("branch_has_new_jump_sequence");

				//open branch entries list page
				EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
			}
		};

		return module;

	}(EC.BranchInputs));
