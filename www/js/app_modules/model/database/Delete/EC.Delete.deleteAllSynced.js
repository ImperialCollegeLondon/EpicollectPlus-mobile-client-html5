/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
/*
 *
 * @method deleteAllSynced
 * deletes all the synced entries for a project. It also deletes any linked branches and any media files linked to the synced entries
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var project_name;
		var project_id;
		var forms;
		var current_form;
		var counter;
		var deferred;

		function _doDeletion() {

			//delete synced hierarchy entries for the current form
			$.when(EC.Delete.removeSyncedHierarchyEntries(current_form._id)).then(function() {

				if (forms.length > 0) {
					//delete synced entries for next form
					_deleteSynced(forms.shift());
				}
				else {

					//update total of synced hierachy entries deletes in ec_forms table for each form
					// of this project
					$.when(EC.Update.updateCountersOnSyncedEntriesDeletion(self.deletion_counters)).then(function() {

						//remove files (if any)
						if (self.deletion_files.length > 0) {
							$.when(EC.File.remove(project_name, self.deletion_files)).then(function() {
								deferred.resolve();
							});
						}
						else {
							deferred.resolve();
						}
					});

				}

			});
		}

		function _handleBranches(the_entry_keys) {

			var deferred = new $.Deferred();
			var entry_keys = the_entry_keys;

			//get all the branch files linked to synced entries (if any)
			$.when(EC.Select.getBranchSyncedFiles(entry_keys)).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries which are both data and media synced
				$.when(EC.Delete.removeSyncedBranchEntries(entry_keys)).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();
		}


		module.deleteAllSynced = function(the_project_id, the_project_name, the_forms) {

			self = this;
			deferred = new $.Deferred();
			project_name = the_project_name;
			project_id = the_project_id;
			forms = the_forms;
			self.deletion_synced_entry_keys = [];
			self.deletion_files = [];
			self.deletion_counters = [];

			//delete synced entries per each for recursively
			_deleteSynced(forms.shift());

			return deferred.promise();
		};

		function _deleteSynced(the_current_form) {

			current_form = the_current_form;

			/*
			 * Select all the synced entries, we need the hierarchy
			 * entry keys to delete any branches
			 *
			 */
			$.when(EC.Select.getSyncedEntryKeys(current_form._id)).then(function(the_entry_keys) {

				self.deletion_synced_entry_keys = the_entry_keys;
				self.deletion_counters.push({form_id: current_form._id, amount: the_entry_keys.length});

				if (current_form.has_media === 1) {

					//get hierarchy files to delete (synced only)
					$.when(EC.Select.getHierarchySyncedFiles(current_form._id)).then(function(the_files) {

						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches?
						if (current_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleBranches(self.deletion_synced_entry_keys)).then(function() {
								_doDeletion();
							});
						}
						else {
							_doDeletion();
						}
					});

				}
				else {

					//no media for this form, any branches?
					if (current_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleBranches(self.deletion_synced_entry_keys)).then(function() {
							_doDeletion();
						});

					}
					else {
						_doDeletion();
					}
				}
			});
		}

		return module;

	}(EC.Delete));

