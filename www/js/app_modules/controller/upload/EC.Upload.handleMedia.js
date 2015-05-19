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

		module.handleMedia = function() {
			
			var self = this;

			self.audio_synced = true;
			self.photo_synced = true;
			self.video_synced = true;

			var _audioCheck = function(the_audio) {

				var deferred = new $.Deferred();
				self.current_audio_file = the_audio;

				if (!self.current_audio_file) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchAudioFile(self.project_id, EC.Const.AUDIO)).then(function(the_audio) {

							self.current_audio_file = the_audio;
							self.is_branch_audio = true;

							//enable upload audio button
							self.upload_audios_btn.removeClass("ui-disabled");
							self.audio_synced = false;

							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.is_branch_audio = false;
					//enable upload audio button
					self.upload_audios_btn.removeClass("ui-disabled");
					self.audio_synced = false;
					deferred.resolve();
				}
				return deferred.promise();
			};

			var _photoCheck = function(the_image) {

				var deferred = new $.Deferred();
				self.current_image_file = the_image;

				if (!self.current_image_file) {
					if (self.has_branches) {
						$.when(EC.Select.getOneBranchPhotoFile(self.project_id, EC.Const.PHOTO)).then(function(the_image) {

							self.current_image_file = the_image;
							self.is_branch_image = true;

							//enable upload image button
							self.upload_images_btn.removeClass("ui-disabled");
							self.photo_synced = false;
							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.is_branch_image = false;
					//enable upload image button
					self.upload_images_btn.removeClass("ui-disabled");
					self.photo_synced = false;
					deferred.resolve();
				}
				return deferred.promise();
			};

			var _videoCheck = function(the_video) {

				var deferred = new $.Deferred();
				self.current_video_file = the_video;

				if (!self.current_video_file) {

					if (self.has_branches) {
						$.when(EC.Select.getOneBranchVideoFile(self.project_id, EC.Const.VIDEO)).then(function(the_video) {

							self.current_video_file = the_video;
							self.video_synced = false;
							self.is_branch_video = true;

							//enable upload audio button
							self.upload_videos_btn.removeClass("ui-disabled");

							deferred.resolve();
						}, function() {
							deferred.resolve();
						});
					}
					else {
						deferred.resolve();
					}
				}
				else {

					self.video_synced = false;
					EC.Upload.is_branch_video = false;
					//enable upload video button
					self.upload_videos_btn.removeClass("ui-disabled");
					deferred.resolve();
				}
				return deferred.promise();
			};

			/*We are using a super safe approach to just fetch 1 single row (file) per media
			 * type, and then fetch the next one recursively (like we did for data)
			 *It is a bit slower but I will have only 1 element at a time in memory and it is
			 * easier to recover from a failure (dropped connections, server down, phone
			 * kills the app, etc)
			 */

			$.when(EC.Select.getOneHierarchyMediaPerType(self.project_id)).then(function(the_image, the_audio, the_video) {

				//got media, enable buttons with media and look for branch file if no hierarchy
				// media found
				self.current_image_file = the_image;
				self.current_audio_file = the_audio;
				self.current_video_file = the_video;

				//if all media are synced, show all synced message
				$.when(_photoCheck(self.current_image_file), _audioCheck(self.current_audio_file), _videoCheck(self.current_video_file)).then(function() {
					if (!(self.audio_synced && self.photo_synced && self.video_synced)) {
						self.all_synced_message.addClass('hidden');
					}
					else {
						self.all_synced_message.removeClass('hidden');
					}
				});

			}, function() {

				//TODO: no media found (image, audio, video are ALL empty)
				//do nothing yet
				self.all_synced_message.removeClass('hidden');
			});
		};

		return module;

	}(EC.Upload));
