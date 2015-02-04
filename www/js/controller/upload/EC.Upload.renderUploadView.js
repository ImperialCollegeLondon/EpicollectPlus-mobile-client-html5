/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *
 * Comments here TODO
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		var upload_data_btn;
		var upload_images_btn;
		var upload_audios_btn;
		var upload_videos_btn;
		var back_btn;
		var project_name;
		var project_id;
		var image;
		var audio;
		var video;
		var branch_forms;

		var _bindBtns = function(the_has_hard_reload_flag, the_ctx) {

			var self = the_ctx;
			var back_button_label = $("div#upload div[data-role='header'] div[data-href='back-btn'] span");
			var hash;
			var has_hard_reload = the_has_hard_reload_flag;
			var media_dir;

			upload_data_btn = $('div#upload div#upload-options div#upload-data-btn');
			upload_images_btn = $('div#upload div#upload-options div#upload-images-btn');
			upload_audios_btn = $('div#upload div#upload-options div#upload-audios-btn');
			upload_videos_btn = $('div#upload div#upload-options div#upload-videos-btn');
			back_btn = $("div#upload div[data-role='header'] div[data-href='back-btn']");

			hash = "forms.html?project=" + project_id + "&name=" + project_name;
			if (has_hard_reload) {
				//back_button_label.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH) + " forms");
				back_button_label.text("Forms");
			}

			if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !== "#refresh") {
				back_button_label.text("Entries");
			} else {
				back_button_label.text("Forms");
			}

			//bind back button for navigating back from upload page
			back_btn.off().one('vclick', function(e) {

				//TODO: we have to decide what is better...go back to save feedback page or entries list??
				//if (window.localStorage.back_nav_url && window.localStorage.back_nav_url !== "#refresh") {
					//go back to entries list; back_nav_url is an url when user goes to upload page after adding/editing an entry
					//EC.Routing.changePage(window.localStorage.back_nav_url);
				//} else {
					//go back to form list
					window.history.back(-1);
				//}

			});

			//bind vclicks data upload
			upload_data_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				//reset rows count
				EC.Upload.hierarchy_rows_to_sync.length = 0;
				EC.Upload.branch_rows_to_sync.length = 0;

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				if (EC.Upload.is_branch_entry) {

					//prepare branch entry
					self.prepareOneBranchEntry(self.current_branch_form.name, self.current_branch_entry);

				} else {

					//prepare hierarchy entry
					self.prepareOneHierarchyEntry(self.current_form.name, self.current_entry);
				}

			});

			//bind vclicks image upload
			upload_images_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {

					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;

				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				//post one image directly as it is already loaded in memory when requesting the upload page
				media_dir = EC.Const.PHOTO_DIR;
				EC.File.uploadFile(image, media_dir);

			});

			//bind vclicks audio upload
			upload_audios_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.AUDIO_DIR;
				EC.File.uploadFile(audio, media_dir);

			});

			//bind vclicks video upload
			upload_videos_btn.off().on('vclick', function(e) {

				// if no internet connection, show warning and exit
				if (!EC.Utils.hasConnection()) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_internet"));
					return;
				}

				EC.Notification.showProgressDialog(EC.Localise.getTranslation("uploaded"), EC.Localise.getTranslation("wait"));

				media_dir = EC.Const.VIDEO_DIR;
				EC.File.uploadFile(video, media_dir);

			});

		};

		module.renderUploadView = function(the_has_hard_reload_flag) {

			var self = this;
			var has_hard_reload = the_has_hard_reload_flag;

			project_name = window.localStorage.project_name;
			project_id = parseInt(window.localStorage.project_id, 10);
			self.has_branches = EC.Utils.projectHasBranches();
			self.hierarchy_forms = JSON.parse(window.localStorage.forms);
			self.current_form = self.hierarchy_forms.shift();
			self.current_entry = {};
			self.action = EC.Const.START_HIERARCHY_UPLOAD;

			//set label (page title)
			$("div#upload div[data-role='navbar'] ul li.title-tab span#upload-label span").text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

			//bind view buttons
			_bindBtns(has_hard_reload, self);
			
			//Localise
			if(window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH){
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//callback when a single un-synced hierarchy entry is found
			function _onOneHierarchyEntryFound(the_entry) {

				//Entry found, prepare entry for upload
				EC.Upload.current_entry = the_entry;

				//keep track this is a hierarchy entry
				EC.Upload.is_branch_entry = false;

				//enable upload data button
				upload_data_btn.removeClass("ui-disabled");
			}

			//callback when no hierarchy un-synced entries are found upon first page load
			function _onOneHierarchyEntryNotFound() {

				console.log("No unsynced hierarchy data entry found");

				//reset branch forms array to get rid of old cahced forms
				EC.Upload.branch_forms = [];

				//no hierarchy entry found, if the project has branches check for any un-synced branch entries
				if (self.has_branches) {

					var _onOneBranchEntryFound = function(the_branch_entry) {

						//Entry found, prepare entry for upload
						EC.Upload.current_branch_entry = the_branch_entry;

						//keep track this is a branch entry
						EC.Upload.is_branch_entry = true;

						//enable upload data button
						upload_data_btn.removeClass("ui-disabled");

					};

					var _onOneBranchEntryNotFound = function() {

						//no branch entries found, handle media
						self.handleMedia();

					};

					//start brach upload
					EC.Upload.action = EC.Const.START_BRANCH_UPLOAD;

					//get branch forms for this project BEFORE tryng to look for a branch entry
					$.when(EC.Select.getBranchForms(project_id)).then(function(the_branch_forms) {

						self.branch_forms = the_branch_forms;
						self.current_branch_form = self.branch_forms.shift();

						//look for a branch entry for the first form
						$.when(EC.Select.getOneBranchEntry(project_id, self.current_branch_form.name, true).then(_onOneBranchEntryFound, _onOneBranchEntryNotFound));
					});

				} else {

					/* This project does not have branches: since no hierarchy entries were found,
					 * check if we have any media ready to upload (is_data_synced = 1 AND is_media_synced = 0)
					 */
					self.handleMedia();

				}

			}
			
			//let's start looking at hierarchy branches first, then branches
			EC.Upload.is_branch_image = false;
			EC.Upload.is_branch_audio = false;
			EC.Upload.is_branch_video = false;

			//get first hierarchy entry not yet synced. The approach is to upload and sync a single entry (cluster of rows) at a time
			$.when(EC.Select.getOneHierarchyEntry(self.current_form, true).then(_onOneHierarchyEntryFound, _onOneHierarchyEntryNotFound));

		};

		module.handleMedia = function() {

			var self = this;

			/*We are using a super safe approach to just fetch 1 single row (file) per media type, and then fetch the next one recursively (like we did for data)
			 *It is a bit slower but I will have only 1 element at a time in memory and it is easier to recover from a failure (dropped connections, server down, phone kills the app, etc)
			 */

			$.when(EC.Select.getOneHierarchyMediaPerType(project_id)).then(function(the_image, the_audio, the_video) {

				//got media, enable buttons with media and look for branch file if no hierarchy media found
				image = the_image;
				audio = the_audio;
				video = the_video;

				/**
				 *
				 */
				if (!image) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchPhotoFile(project_id, EC.Const.PHOTO)).then(function(the_image) {

							image = the_image;

							EC.Upload.is_branch_image = true;

							//enable upload image button
							upload_images_btn.removeClass("ui-disabled");

						});

					}

				} else {
					
					EC.Upload.is_branch_image = false;
					//enable upload image button
					upload_images_btn.removeClass("ui-disabled");
				}

				/**
				 *
				 */
				if (!audio) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchAudioFile(project_id, EC.Const.AUDIO)).then(function(the_audio) {

							audio = the_audio;

							EC.Upload.is_branch_audio = true;

							//enable upload audio button
							upload_audios_btn.removeClass("ui-disabled");

						});

					}

				} else {
					
					EC.Upload.is_branch_audio = false;
					//enable upload audio button
					upload_audios_btn.removeClass("ui-disabled");
				}

				/**
				 *
				 */
				if (!video) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchVideoFile(project_id, EC.Const.VIDEO)).then(function(the_video) {

							video = the_video;

							EC.Upload.is_branch_video = true;

							//enable upload audio button
							upload_videos_btn.removeClass("ui-disabled");

						});
					}

				} else {
					
					EC.Upload.is_branch_video = false;
					//enable upload video button
					upload_videos_btn.removeClass("ui-disabled");
				}

			}, function() {

				//TODO: no media found (image, audio, video are ALL empty)
				//do nothing yet

			});

		};

		module.renderUploadViewFeedback = function(is_successful) {

			var self = this;

			//notify user all data were uploaded successfully
			EC.Notification.hideProgressDialog();

			//show upload success notification only after an upload. When the user first request the uplad view, that will not be shown
			if (self.action === EC.Const.STOP_HIERARCHY_UPLOAD || self.action === EC.Const.STOP_BRANCH_UPLOAD) {
				if (is_successful) {

					//disable data upload button as no data to upload any more
					upload_data_btn.addClass('ui-disabled');

					EC.Notification.showToast(EC.Localise.getTranslation("data_upload_success"), "short");

					//look for media to upload (if any)
					self.handleMedia();

				}
			}

		};

		return module;

	}(EC.Upload));
