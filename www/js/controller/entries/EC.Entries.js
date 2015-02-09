/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 *
 * Deals with:
 * -getting the list of entries for a form and render it
 * -getting list of values for a single entry and render it
 * -getting and rendering list of child entries, i.e. list of entries for a child
 * form grouped by the parent form. (When the user selects a form which is not
 * the top one)
 * -unsync a single entry (to be re-uploaded if needed)
 * -delete all entries for a form
 * -delete all media for a form, but keeping the data
 * -delete all synced entries, to free space on the device. It deletes only the
 * entries fully synced, (data + media)
 *
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function() {
		"use strict";

		var trail = [];

		/**
		 * @method unsyncEntry
		 *
		 * unsync a single entry
		 */
		var unsyncEntry = function() {

			var rows_to_unsync = JSON.parse(window.localStorage.inputs_values);
			var project_id = parseInt(window.localStorage.project_id, 10);
			var entry_key = window.localStorage.entry_key;

			//unsync all the value rows for this entry
			$.when(EC.Update.unsyncOneHierarchyEntry(rows_to_unsync, entry_key, project_id)).then(function() {

				//close panel
				$('.entry-values-options').panel("close");

				//disable unsync btn
				$("div#entry-values div.entry-values-options ul li#unsync-entry").addClass('ui-disabled');

				EC.Notification.showToast(EC.Localise.getTranslation("entry_unsynced"), "short");

			}, function() {

				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
			});

		};

		var unsyncAllEntries = function() {

			var forms = JSON.parse(window.localStorage.forms);
			var project_id = parseInt(window.localStorage.project_id, 10);

			//get all the rows to unsync
			$.when(EC.Update.unsyncAllEntries(forms, project_id)).then(function() {
				//close panel
				$('div#forms div#project-options').panel("close");

				//disable unsync entries button
				$("div#forms div#project-options ul li#unsync-all-data").addClass('ui-disabled');

				//disable delete sync entries button
				$("div#forms div#project-options ul li#delete-synced-entries").addClass('ui-disabled');

				EC.Notification.showToast(EC.Localise.getTranslation("all_data_synced"), "short");

			}, function() {
				//close panel
				$('div#forms div#project-options').panel("close");
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
			});

		};

		/**
		 * @method deleteAllEntries Call model class to delete all the entris for
		 * the currently selected project
		 */
		var deleteAllEntries = function() {

			var project_name = window.localStorage.project_name;

			$.when(EC.Delete.deleteAllEntries(EC.Const.DELETE, project_name)).then(function() {

				//disable related btns (we do not have any entries for this
				// project now)
				$('div#forms div#project-options ul li#delete-all-entries').addClass('ui-disabled');
				$('div#forms div#project-options ul li#delete-synced-entries').addClass('ui-disabled');
				$('div#forms div#project-options ul li#delete-media-files').addClass('ui-disabled');
				$('div#forms div#project-options ul li#unsync-all-data').addClass('ui-disabled');

				//update UI
				var forms_list_items = $('div#forms-list ul li');

				//update entry count bubbles in forms list
				forms_list_items.each(function(i) {

					if (i === 0) {
						//set top form children count to 0
						$(this).find('a').find('span.ui-li-count.ui-btn-up-c.ui-btn-corner-all').text("0");

					}
					else {
						//disable children forms and hide bubble count
						$(this).addClass('ui-disabled');
						$(this).find('a').find('span.ui-li-count.ui-btn-up-c.ui-btn-corner-all').remove();

					}

				});

				//success
				$('#project-options').panel("close");
				EC.Notification.hideProgressDialog();
				EC.Notification.showToast(EC.Localise.getTranslation("all_entries_deleted"), "short");

			}, function() {
				//error occurred
				$('#project-options').panel("close");
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
			});
		};

		/**
		 * @method deleteAllMedia Call model class to delete all the media files
		 * for the currently selected project
		 *
		 */
		var deleteAllMedia = function() {

			var project_name = window.localStorage.project_name;
			var forms = JSON.parse(window.localStorage.forms);

			if (!EC.Utils.isChrome()) {

				//delete media files (if any), project not deleted so 2nd argument is set to
				// false
				$.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function() {
					EC.Entries.allMediaDeletedFeedback(true);
				});

			}
			else {
				//in Chrome, just update database setting values to empty strings
				// - just for debugging
				EC.Update.emptyMediaValues(forms);
			}
		};

		/**
		 * @method allEntriesDeletedFeedback
		 * @param {boolean} is_positive State if the entries are deleted
		 * successfully or not
		 */
		var allEntriesDeletedFeedback = function(is_positive) {

		};

		/**
		 * @method allMediaDeletedFeedback Display feedback to user after media
		 * deletion
		 * @param {boolean} is_positive State if the media are deleted
		 * successfully or not
		 */
		var allMediaDeletedFeedback = function(is_positive) {

			//close panel
			$('#project-options').panel("close");

			EC.Notification.hideProgressDialog();
			if (is_positive) {

				//disable delete media button
				$('div#forms div#project-options ul li#delete-media-files').addClass('ui-disabled');

				EC.Notification.showToast(EC.Localise.getTranslation("all_media_deleted"), "short");
			}
			else {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
			}
		};

		/**
		 * @method deleteAllSynced Calls model class to delete all the entries
		 * fully synced (data + media)
		 */
		var deleteAllSynced = function() {

			var forms = JSON.parse(window.localStorage.forms);
			var project_name = window.localStorage.project_name;
			var project_id = parseInt(window.localStorage.project_id, 10);

			//delete synced entries and media
			$.when(EC.Delete.deleteAllSynced(project_id, project_name, forms)).then(function() {
				_allSyncedDeletedFeedback(true);
			}, function() {
				_allSyncedDeletedFeedback(false);
			});

		};

		/**
		 * @method allSyncedDeletedFeedback Display feedback to user after
		 * deleting synced entries
		 * @param {boolean} is_positive States id the synced entries are deleted
		 * successufully or not
		 */
		var _allSyncedDeletedFeedback = function(is_positive) {

			var forms_list = $('div#forms-list ul li');
			var deleted_entries = JSON.parse(window.localStorage.deleted_entries);
			var count;
			var current_count_holder;

			//close panel
			$('#project-options').panel("close");

			//update entries count on DOM to show the user the correct amount
			// after deletion
			if (is_positive) {
				forms_list.each(function(i) {

					var new_count;

					current_count_holder = $(this).find('a').find('span.ui-li-count');

					new_count = parseInt(current_count_holder.text(), 10) - deleted_entries[i];

					console.log("new_count" + new_count);

					current_count_holder.text(new_count);

				});
				EC.Notification.showToast(EC.Localise.getTranslation("all_synced_deleted"), "short");
			}
			else {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic_error"));
			}
		};

		var deleteEntry = function() {

			var rows_to_delete = JSON.parse(window.localStorage.inputs_values);
			var entry_key = window.localStorage.entry_key;
			var form_id = window.localStorage.form_id;
			var project_name = window.localStorage.project_name;

			//get hash from data-hef attribute
			window.localStorage.back_nav_url = $('div#entry-values div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr("data-href");

			//remove cache entries to request list gain after entry deletion
			window.localStorage.removeItem('cached_entries_list');

			//delete all the rows for this entry
			$.when(EC.Delete.deleteEntry(project_name, rows_to_delete, entry_key, form_id)).then(function(is_positive) {

				if (is_positive) {
					EC.Notification.showToast(EC.Localise.getTranslation("entry_deleted"), "short");
					EC.Routing.changePage(window.localStorage.back_nav_url);
				}
				else {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic"));
				}
			});

		};

		var deleteBranchEntry = function() {

			var rows_to_delete = JSON.parse(window.localStorage.branch_inputs_values);

			//delete all the rows for this branch entry
			$.when(EC.Delete.deleteBranchEntry(rows_to_delete)).then(function() {

				EC.Notification.showToast(EC.Localise.getTranslation("branch_entry_deleted"), "short");

				window.localStorage.removeItem("branch_edit_mode");

				EC.Routing.changePage("branch-entries-list.html");

			}, function() {
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("generic"));
			});

		};

		var addEntry = function() {

			var form_id = parseInt(window.localStorage.form_id, 10);

			EC.Notification.showProgressDialog();

			$.when(EC.Select.getInputs(form_id)).then(function(inputs, has_jumps) {

				//set inputs in memory
				EC.Inputs.setInputs(inputs, has_jumps);

				//render first input on the list or the selected position (-1) if
				// we are editing
				EC.Inputs.prepareFirstInput((window.localStorage.edit_position === undefined) ? inputs[0] : inputs[window.localStorage.edit_position - 1]);

			});
		};

		return {
			addEntry : addEntry,
			unsyncEntry : unsyncEntry,
			unsyncAllEntries : unsyncAllEntries,
			deleteEntry : deleteEntry,
			deleteBranchEntry : deleteBranchEntry,
			deleteAllEntries : deleteAllEntries,
			deleteAllMedia : deleteAllMedia,
			deleteAllSynced : deleteAllSynced,
			allEntriesDeletedFeedback : allEntriesDeletedFeedback,
			allMediaDeletedFeedback : allMediaDeletedFeedback
		};

	}());

