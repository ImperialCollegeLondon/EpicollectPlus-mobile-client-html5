/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.backToEntriesList = function() {

			var cached_branch_entry_keys;
			var i;
			var iLength;
			var has_cached = false;
			var page = window.localStorage.back_nav_url;

			/*delete any cached branch entry not stored (main form not saved) BEFORE redirecting to index page
			 * (if any)
			 */
			try {

				cached_branch_entry_keys = JSON.parse(window.localStorage.cached_branch_entry_keys);

				//if there is the cached_branch_entries, tirgger deletion if t∆here ia at least 1 element
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
