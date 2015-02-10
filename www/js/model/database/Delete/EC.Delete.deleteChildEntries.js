/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method deleteChildEntries deletes all the child entries linked to a hierarchy entry
 * 
 * It also deletes all the branches and get all the files linked to the braches (to be deleted later)
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var child_hierarchy_files;
		var child_branch_files;
		var current_child_form;

		module.deleteChildEntries = function() {

			self = this;
			deferred = new $.Deferred();
			current_child_form = EC.Delete.children_forms.shift();
			child_hierarchy_files = [];
			child_branch_files = [];

			_removeChildren();

			return deferred.promise();

		};
		
		//recursively delete the children entries
		function _doChildrenDeletion() {
			//delete all the hierarchy children data
			$.when(EC.Delete.removeHierarchyChildrenData()).then(function() {

				//another child form to delete entries from?
				if (EC.Delete.children_forms.length > 0) {

					current_child_form = EC.Delete.children_forms.shift();

					//delete children a level down recursively
					_removeChildren();
				}
				else {

					//all children deleted
					deferred.resolve();
				}
			});
		}

		function _removeChildren() {

			/*
			 * Cache child entries total and child entries details we are going to delete: we
			 * do this to
			 * update the entry counters after deletion (per each form) and to delete any
			 * children
			 * attached to the selected child entry. We also need the children entry keys to
			 * grab all the files attached
			 *
			 * We get:
			 *  - all the children entries like:
			 * { count: 3, entry_key: <the_entry_key>, form_id: <the_form_id>, parent :
			 * <the_parent_etry_key>}
			 *  - the total of children entries and the child form id
			 * { amount: <the_amount>, form_id: <the_form_id>}
			 */
			$.when(EC.Select.getChildEntriesForDeletion()).then(function(the_entries, the_counters) {
				
				//cache child entries and files in module object
				self.deletion_entries = the_entries;
				self.deletion_counters.push(the_counters);

				//Any media attached to delete?
				if (current_child_form.has_media === 1) {

					/* Select all the hierarchy children media files to be deleted
					 * (loop al the keys as we migth have more than one child
					 */
					$.when(EC.Select.getHierarchyChildrenFiles(current_child_form)).then(function(the_files) {

						//cache files to be deleted
						self.deletion_files = self.deletion_files.concat(the_files);

						//any branches for the children?
						if (current_child_form.has_branches === 1) {

							//get branch files and delete branch entries
							$.when(_handleChildBranches()).then(function() {
								_doChildrenDeletion();
							});
						}
						else {
							_doChildrenDeletion();
						}
					});
				}
				else {

					//no media, any branches for the children then?
					if (current_child_form.has_branches === 1) {

						//get branch files and delete branch entries
						$.when(_handleChildBranches()).then(function() {
							_doChildrenDeletion();
						});
					}
					else {
						_doChildrenDeletion();
					}
				}
			});
		}

		function _handleChildBranches() {

			var deferred = new $.Deferred();

			//get all the branch files (if any)
			$.when(EC.Select.getBranchChildrenFiles()).then(function(the_files) {

				self.deletion_files = self.deletion_files.concat(the_files);

				//delete all branch entries linked to this hierarchy entry
				$.when(EC.Delete.removeLinkedBranchChildEntries()).then(function() {
					deferred.resolve();
				});
			});
			return deferred.promise();

		}

		return module;

	}(EC.Delete));
