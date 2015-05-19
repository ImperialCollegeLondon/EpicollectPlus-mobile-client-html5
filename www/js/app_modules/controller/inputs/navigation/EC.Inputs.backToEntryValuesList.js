/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToEntryValuesList = function() {

			var cached_branch_entry_keys;
			var i;
			var iLength;
			var has_cached = false;
			var page = window.localStorage.back_edit_nav_url;
			var key_position = EC.Inputs.getPrimaryKeyRefPosition();
			var breadcrumb_trail = JSON.parse(window.localStorage.getItem("breadcrumbs"));
			var parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
			//get value of primary key for this form
			var key_value = EC.Inputs.getCachedInputValue(key_position).value;

			//save full breadcrumbs as path to parent node (node tree representation using adjacent list)
			var parent_path = (breadcrumb_trail[0] === "") ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

			//if it is a nested form, keep track of its parent and save it in localStorage
			if (key_value !== parent_path) {

				var parent_path_array = parent_path.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
				parent_path_array.pop();
				window.localStorage.parent_path = parent_path_array.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
			}

			/*delete any cached branch entry not stored (main form not saved) BEFORE redirecting to index page
			 * (if any)
			 */
			try {

				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				//if there is the cached_branch_entries, tirgger deletion if there ia at least 1 element
				iLength = cached_branch_entry_keys.length;
				for ( i = 0; i < iLength; i++) {
					if (cached_branch_entry_keys[i].primary_keys.length > 0) {

						has_cached = true;
						break;
					}
				}

				if (has_cached) {

					//remove cached branch entries keys
					window.localStorage.removeItem("cached_branch_entry_keys");

					//delete any cached branch entry
					EC.Delete.deleteCachedBranchEntries();
				} else {

					//no primary keys cached, go straight back to index page

					//remove breadcrumb for navigation

					EC.Routing.changePage(page);
				}

			} catch(error) {

				//no object cached, go straight back to index page
				EC.Routing.changePage(page);

			}

		};

		return module;

	}(EC.Inputs));
