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

		module.renderUploadView = function(the_has_hard_reload_flag) {

			var self = this;
			var has_hard_reload = the_has_hard_reload_flag;

			self.project_name = window.localStorage.project_name;
			self.project_id = parseInt(window.localStorage.project_id, 10);
			self.has_branches = EC.Utils.projectHasBranches();
			self.hierarchy_forms = JSON.parse(window.localStorage.forms);
			self.current_form = self.hierarchy_forms.shift();
			self.current_entry = {};
			self.action = EC.Const.START_HIERARCHY_UPLOAD;

			//set label (page title)
			console.log(self.project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));
			$("div#upload div[data-role='navbar'] ul li.title-tab span#upload-label span.project-name").text(self.project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

			//bind view buttons
			self.bindUploadButtons(has_hard_reload, self);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//callback when a single un-synced hierarchy entry is found
			function _onOneHierarchyEntryFound(the_entry) {

				//Entry found, prepare entry for upload
				self.current_entry = the_entry;

				//keep track this is a hierarchy entry
				self.is_branch_entry = false;

				//enable upload data button
				self.upload_data_btn.removeClass("ui-disabled");

				//hide all synced message
				self.all_synced_message.addClass('hidden');
			}

			//callback when no hierarchy un-synced entries are found upon first page load
			function _onOneHierarchyEntryNotFound() {

				console.log("No unsynced hierarchy data entry found");

				//reset branch forms array to get rid of old cahced forms
				self.branch_forms = [];

				//no hierarchy entry found, if the project has branches check for any un-synced
				// branch entries
				if (self.has_branches) {

					var _onOneBranchEntryFound = function(the_branch_entry) {

						//Entry found, prepare entry for upload
						self.current_branch_entry = the_branch_entry;

						//keep track this is a branch entry
						self.is_branch_entry = true;

						//enable upload data button
						self.upload_data_btn.removeClass("ui-disabled");
						self.all_synced_message.addClass('hidden');
					};

					var _onOneBranchEntryNotFound = function() {

						//no branch entries found, handle media
						self.handleMedia();

					};

					//start brach upload
					self.action = EC.Const.START_BRANCH_UPLOAD;

					//get branch forms for this project BEFORE tryng to look for a branch entry
					$.when(EC.Select.getBranchForms(self.project_id)).then(function(the_branch_forms) {

						self.branch_forms = the_branch_forms;
						self.current_branch_form = self.branch_forms.shift();

						//look for a branch entry for the first form
						$.when(EC.Select.getOneBranchEntry(self.project_id, self.current_branch_form.name, true).then(_onOneBranchEntryFound, _onOneBranchEntryNotFound));
					});

				}
				else {

					/* This project does not have branches: since no hierarchy entries were found,
					 * check if we have any media ready to upload (is_data_synced = 1 AND
					 * is_media_synced = 0)
					 */
					self.handleMedia();

				}
			}

			//let's start looking at hierarchy branches first, then branches
			self.is_branch_image = false;
			self.is_branch_audio = false;
			self.is_branch_video = false;

			//get first hierarchy entry not yet synced. The approach is to upload and sync a
			// single entry (cluster of rows) at a time
			$.when(EC.Select.getOneHierarchyEntry(self.current_form, true).then(_onOneHierarchyEntryFound, _onOneHierarchyEntryNotFound));

		};

		return module;

	}(EC.Upload));
