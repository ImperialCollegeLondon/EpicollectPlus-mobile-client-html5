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
		var deferred;
		var child_hierarchy_files;
		var child_branch_files;
		var current_child_form;
		
		module.deleteChildEntries = function() {

			debugger;

			self = this;
			deferred = new $.Deferred();
			current_child_form = EC.Delete.children_forms.shift();
			child_hierarchy_files = [];
			child_branch_files = [];

			//clear entries, branches and media of parent form
			self.deletion_hierarchy_files = [];
			self.deletion_branch_files = [];

		
			_removeChildren();

			return deferred.promise();

		};

		function _doChildrenDeletion() {
			//delete all the hierarchy children data
			$.when(EC.Delete.removeHierarchyChildrenData()).then(function() {

				//all che children deleted

				//delete all files - now or later?
				//TODO

				//another child form to delete entries from?
				if (EC.Delete.children_forms.length > 0) {
					
					current_child_form = EC.Delete.children_forms.shift();

					//delete children a level down recursively
					_removeChildren();
				}
				else {

					//all children deleted, update counters? or in the caller?
					//TODO
					deferred.resolve();
				}

			});
		}

		function _removeChildren() {
			
				/*
			 * Cache the total and the child entries we are going to delete: we do this to update the
			 * entry counter after deletion (per each form) and to delete any children attached to the
			 * selected child entry.
			 *
			 * We get:
			 *  - all the children entries
			 *  - the total of children entries and the child form id
			 *  - the parent key the child entries are linked to
			 */

			$.when(EC.Select.getChildEntriesForDeletion()).then(function(the_entries, the_counters, the_parent_key) {

				self.deletion_entries = the_entries;
				self.deletion_counters.push(the_counters);
				

				//Any media attached to delete for the children?
				if (current_child_form.has_media === 1) {

					/* Select all the hierarchy children media files to be deleted (loop al the keys
					 * as we migth have more than on child
					 */
					$.when(EC.Select.getHierarchyChildrenFiles(current_child_form)).then(function(the_files) {

						//cache files to be deleted
						self.deletion_hierarchy_files = the_files;

						//any branches for the children?
						if (current_child_form.has_branches === 1) {

							//Delete all the branches linked to the children
							$.when(EC.Delete.removeLinkedChildBranchEntries()).then(function() {

								_doChildrenDeletion();

							});

						}

					});
				}
				else {

					//no media, nay branches for the children then?
					//any branches for the children?
					if (current_child_form.has_branches === 1) {

						//TODO

					}
					else {

						_doChildrenDeletion();
					}

				}

			});
		}

		return module;

	}(EC.Delete));
