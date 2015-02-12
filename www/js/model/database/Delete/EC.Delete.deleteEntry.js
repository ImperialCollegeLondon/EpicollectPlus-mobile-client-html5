/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";
		
		var self;
		var entry_key;
		var current_form;
		var current_child_form;
		var hierarchy_files = [];
		var branch_files = [];
		var has_branches;
		var deferred;
		var project_name;

		function _handleBranches(the_entry_key) {

			var deferred = new $.Deferred();
			var entry_key = the_entry_key;

			//get all the branch files (if any)
			$.when(EC.Select.getBranchFiles(entry_key)).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries linked to this hierarchy entry
				$.when(EC.Delete.removeLinkedBranchEntries(entry_key)).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();
		}

		/**
		 * @method deleteEntry Deletes all the rows belonging to a single entry. It will
		 * also delete all the children entries and branch entries linked, plus all the
		 * files associated with these
		 * entries
		 * @param {Object} the_rows Rows for a single entry to be deleted, as an array of
		 * objects containing the row _id
		 * @param {Object} the_entry_key The entry key value for the selected entry
		 */
		module.deleteEntry = function(the_project_name, the_rows, the_entry_key, the_current_form_id) {

			self = this;
			deferred = new $.Deferred();
			entry_key = the_entry_key;
			has_branches = EC.Utils.projectHasBranches();
			current_form = EC.Utils.getFormByID(the_current_form_id);
			project_name = the_project_name;
			self.deletion_files = [];
			self.deletion_counters = [];
			self.deletion_entries = [];
			self.children_forms = EC.Utils.getChildrenForms(current_form._id);

			/*
			 * select COUNT(*) and rows we are going to delete: we do this to update the
			 * entry counter after deletion and to delete any children attached to the
			 * selected antry
			 */
			$.when(EC.Select.getHierarchyEntriesForDeletion(entry_key)).then(function(the_entries, the_counters) {

				self.deletion_entries = the_entries;
				self.deletion_counters = the_counters;

				//Does this entry has any media attached to delete?
				if (current_form.has_media === 1) {

					//select all the hierarchy media files to be deleted
					$.when(EC.Select.getHierarchyFiles(current_form, entry_key)).then(function(the_files) {

						//cache files to be deleted
						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches?
						if (current_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleBranches(entry_key)).then(function() {
								_doDeletion();
							});

						}
						else {
							_doDeletion();
						}

					});
				}
				else {

					//no media, any branches?
					if (current_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleBranches(entry_key)).then(function() {
							_doDeletion();
						});
					}
					else {
						_doDeletion();
					}

				}

			});

			return deferred.promise();

		};

		function _doDeletion() {

			//delete the hierarchy entry (the one currently selected by the user)
			$.when(EC.Delete.removeHierarchyEntryData(entry_key)).then(function() {

				//TODO delete all the media files -> wait, check for children and children files

				//TODO delete hierarchy files, branches and branch files if any

				//delete children recursively if any
				if (self.children_forms.length > 0) {

					console.log("delete children and branches and media attached");

					$.when(EC.Delete.deleteChildEntries()).then(function() {

						//all children deleted, update counters (recursively) for all the forms
						console.log("all children deleted");
						console.log(self.deletion_counters);

						$.when(EC.Update.updateCountersOnSingleEntryDeletion(self.deletion_counters)).then(function() {
							//All done

							//any media files to remove?
							if (self.deletion_files.length > 0) {

								$.when(EC.File.remove(project_name, self.deletion_files)).then(function() {

									console.log(project_name + " media deleted");
									deferred.resolve(true);

								});

							}
							else {

								deferred.resolve(true);
							}
						});
					});
				}
				else {
					//no children, just update counters now (recursively) for all the forms
					$.when(EC.Update.updateCountersOnSingleEntryDeletion(self.deletion_counters)).then(function() {
						//All done
						deferred.resolve(true);
					});
				}
			});
		}

		return module;

	}(EC.Delete));
