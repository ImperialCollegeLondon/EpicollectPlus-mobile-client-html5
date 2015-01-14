/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.bindBackBtn = function(is_data_saved) {

			var back_btn = $("div[data-role='header'] div[data-href='back-btn']");
			back_btn.off().one('vclick', function(e) {

				if (is_data_saved) {

					//if user was navigating from a child from, send it back to child from list
					if (window.localStorage.is_child_form_nav) {

						//TODO: back to child entries list
						EC.Inputs.backToEntriesList();
					} else {
						//data saved, go back to entries list
						EC.Inputs.backToEntriesList();
					}

				} else {

					//if user was navigating from a child from, send it back to child from list
					if (window.localStorage.is_child_form_nav) {

						//TODO: back to child entries list
						EC.Inputs.backToEntriesList();
					} else {

						//data not saved, ask user confirmation
						EC.Notification.askConfirm(EC.Localise.getTranslation("exit"), EC.Localise.getTranslation("exit_confirm"), "EC.Inputs.backToEntriesList");
					}

				}
			});
		};

		return module;

	}(EC.Inputs));
