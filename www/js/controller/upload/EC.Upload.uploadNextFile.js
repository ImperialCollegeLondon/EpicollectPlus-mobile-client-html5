/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {
		"use strict";

		var upload_images_btn;
		var upload_audios_btn;
		var upload_videos_btn;

		module.uploadNextFile = function(the_media_type) {

			var self = this;
			var media_dir;
			var project_id = parseInt(window.localStorage.project_id, 10);
			var all_synced_message = $('div#upload div#upload-options .all-synced-message');

			//upload another file of same type (if any)
			switch(the_media_type) {

				case EC.Const.PHOTO:

					//get next image (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.PHOTO).then(function(the_image) {

						//post image
						media_dir = EC.Const.PHOTO_DIR;
						EC.Upload.is_branch_image = false;
						EC.File.uploadFile(the_image, media_dir);

					}, function() {

						/* no more hierarchy images to post
						 * check branches for images
						 */
						$.when(EC.Select.getOneBranchPhotoFile(project_id)).then(function(the_branch_image) {

							//post image
							media_dir = EC.Const.PHOTO_DIR;
							EC.Upload.is_branch_image = true;
							EC.File.uploadFile(the_branch_image, media_dir);

						}, function() {

							//disable upload images button, as no more images to upload
							upload_images_btn = $('div#upload div#upload-options div#upload-images-btn');
							upload_images_btn.addClass("ui-disabled");
							self.photo_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('not-shown');
							}
							else {
								all_synced_message.removeClass('not-shown');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_images_uploaded"), "short");
						});

					}));

					break;

				case EC.Const.AUDIO:

					//get next audio file (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.AUDIO).then(function(the_audio) {

						//post audio file
						media_dir = EC.Const.AUDIO_DIR;
						EC.Upload.is_branch_audio = false;
						EC.File.uploadFile(the_audio, media_dir);

					}, function() {

						/* No more audio files to post
						 * check branches for audios
						 */
						$.when(EC.Select.getOneBranchAudioFile(project_id)).then(function(the_branch_audio) {

							//post image
							media_dir = EC.Const.AUDIO_DIR;
							EC.Upload.is_branch_audio = true;
							EC.File.uploadFile(the_branch_audio, media_dir);

						}, function() {

							//disable upload audios button, as no more audio files to upload
							upload_audios_btn = $('div#upload div#upload-options div#upload-audios-btn');
							upload_audios_btn.addClass("ui-disabled");
							self.audio_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('not-shown');
							}
							else {
								all_synced_message.removeClass('not-shown');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_audios_uploaded"), "short");
						});

					}));
					break;

				case EC.Const.VIDEO:

					//get next image (if any)
					$.when(EC.Select.getOneHierarchyMediaFile(project_id, EC.Const.VIDEO).then(function(the_video) {

						//post video
						media_dir = EC.Const.VIDEO_DIR;
						EC.File.uploadFile(the_video, media_dir);

					}, function() {

						/* No more video files to post
						 * check branches for audios
						 */
						$.when(EC.Select.getOneBranchAudioFile(project_id)).then(function(the_branch_image) {

							//post image
							media_dir = EC.Const.VIDEO_DIR;
							EC.Upload.is_branch_video = true;
							EC.File.uploadFile(the_branch_image, media_dir);

						}, function() {

							//disable upload audios button, as no more audio files to upload
							upload_videos_btn = $('div#upload div#upload-options div#upload-videos-btn');
							upload_videos_btn.addClass("ui-disabled");
							self.video_synced = true;
							
							//if all sync show message
							if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
								all_synced_message.addClass('not-shown');
							}
							else {
								all_synced_message.removeClass('not-shown');
							}

							//notify user all data were uploaded successfully
							EC.Notification.hideProgressDialog();

							//show feedback message to user
							EC.Notification.showToast(EC.Localise.getTranslation("all_videos_uploaded"), "short");
						});
					}));
					break;

			}

		};

		return module;

	}(EC.Upload));
