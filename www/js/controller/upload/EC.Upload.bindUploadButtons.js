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

		module.bindUploadButtons = function(the_has_hard_reload_flag) {

			var self = this;
			var back_button_label = $("div#upload div[data-role='header'] div[data-href='back-btn'] span");
			var hash;
			var has_hard_reload = the_has_hard_reload_flag;
			var media_dir;
			var project_name = window.localStorage.project_name;
			var project_id = parseInt(window.localStorage.project_id, 10);

			self.upload_data_btn = $('div#upload div#upload-options div#upload-data-btn');
			self.upload_images_btn = $('div#upload div#upload-options div#upload-images-btn');
			self.upload_audios_btn = $('div#upload div#upload-options div#upload-audios-btn');
			self.upload_videos_btn = $('div#upload div#upload-options div#upload-videos-btn');
			self.back_btn = $("div#upload div[data-role='header'] div[data-href='back-btn']");
			self.all_synced_message = $('div#upload div#upload-options .all-synced-message');

			hash = "forms.html?project=" + project_id + "&name=" + project_name;
			if (has_hard_reload) {
				back_button_label.text("Forms");
			}

			if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !== "#refresh") {
				back_button_label.text("Entries");
			}
			else {
				back_button_label.text("Forms");
			}

			//bind back button for navigating back from upload page
			self.back_btn.off().one('vclick', function(e) {

				//TODO: we have to decide what is better...go back to save feedback page or
				// entries list??
				//if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !==
				// "#refresh") {
				//go back to entries list; back_nav_url is an url when user goes to upload page
				// after adding/editing an entry
				//EC.Routing.changePage(window.localStorage.back_nav_url);
				//} else {
				//go back to form list
				window.history.back(-1);
				//}

			});

			//bind vclicks data upload
			self.upload_data_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				//reset rows count
				self.hierarchy_rows_to_sync=[];
				self.branch_rows_to_sync= [];

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				if (self.is_branch_entry) {

					//prepare branch entry
					self.prepareOneBranchEntry(self.current_branch_form.name, self.current_branch_entry);

				}
				else {

					//prepare hierarchy entry
					self.prepareOneHierarchyEntry(self.current_form.name, self.current_entry);
				}

			});

			//bind vclicks image upload
			self.upload_images_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {

					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;

				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				//post one image directly as it is already loaded in memory when requesting the
				// upload page
				media_dir = EC.Const.PHOTO_DIR;
				EC.File.uploadFile(self.current_image_file, media_dir);

			});

			//bind vclicks audio upload
			self.upload_audios_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.AUDIO_DIR;
				EC.File.uploadFile(self.current_audio_file, media_dir);

			});

			//bind vclicks video upload
			self.upload_videos_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.VIDEO_DIR;
				EC.File.uploadFile(self.current_video_file, media_dir);

			});

		};

		return module;

	}(EC.Upload));
