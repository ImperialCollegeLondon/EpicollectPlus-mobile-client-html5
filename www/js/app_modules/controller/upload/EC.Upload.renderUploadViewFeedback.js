/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *
 * Comments here TODO
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		module.renderUploadViewFeedback = function(is_successful) {

			var self = this;

			//notify user all data were uploaded successfully
			EC.Notification.hideProgressDialog();

			//show upload success notification only after an upload. When the user first
			// request the uplad view, that will not be shown
			if (self.action === EC.Const.STOP_HIERARCHY_UPLOAD || self.action === EC.Const.STOP_BRANCH_UPLOAD) {
				if (is_successful) {

					//disable data upload button as no data to upload any more
					self.upload_data_btn.addClass('ui-disabled');
					self.all_synced_message.removeClass('hidden');

					EC.Notification.showToast(EC.Localise.getTranslation("data_upload_success"), "short");

					//look for media to upload (if any)
					self.handleMedia();
				}
			}
		};
		
		return module;

	}(EC.Upload));
