/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */
var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = ( function(module) {"use strict";

		/**
		 * @method renderChildEntriesList Renders the list of entries for a child form grouped by the immediate parent form primary key
		 * It is triggered when the user selects a form other than the top one (the main parent)
		 *
		 * @param {Array} the_child_entries Array that contains the values of the primry key and all the children per each child form
		 * {parent: the value of the immediate parent primary key
		 *  children (Array): {entry_key: the value of the primary key for this child,
		 * full_title: all the title values in csv,
		 * nested_children_count: the total of children belonging to this child entry, to be shown in the bubble count
		 * }
		 */
		
		var wls;

		var _bindActionBarBtns = function() {

			var nav_drawer_btn = $("div#entries div[data-role='header'] div[data-href='entries-nav-btn']");
			var home_btn = $("div#entries div[data-role='header'] div[data-href='home']");
			var settings_btn = $('div#entries div[data-role="header"] div#entries-nav-drawer ul li div[data-href="settings"]');
			var add_entry_btn = $("div#entries div[data-role='header'] i[data-href='add-entry']");
			var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');

			//bind left sidebar open/close
			nav_drawer_btn.off().on('vclick', function(e) {

				$("#entries-nav-drawer").panel("open");

				home_btn.off().one('vclick', function(e) {
					//reset offset, as when going back we make a new request for the first entries
					wls.QUERY_ENTRIES_OFFSET = 0;

					//trigger a pgae refresh when navigating back to project list
					wls.back_nav_url = "#refresh";
					EC.Routing.changePage(EC.Const.INDEX_VIEW);
				});

				// //bind add project button (action bar)
				settings_btn.off().one('vclick', function(e) {
					wls.reached_settings_view_from = $.mobile.activePage.attr("id");
					EC.Routing.changePage(EC.Const.SETTINGS_VIEW);
				});

			});

			inactive_tab.off().on('vclick', function(e) {
				//get url from data-hef attribute
				var back_url = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr("data-href");
				EC.Routing.changePage(back_url);
			});

		};

		var _buildChildEntriesList = function(the_form_id, the_form_tree, the_entries) {

			var form_id = the_form_id;
			var form_tree = the_form_tree;
			var entries = the_entries;
			var full_parent = [];
			var i;
			var j;
			var iLength;
			var jLength;
			var HTML = "";

			//list child entries grouped by immediate parent
			for ( i = 0, iLength = entries.length; i < iLength; i++) {

				HTML += '<div class="parent-entry-divider">';
				HTML += '<span>';

				//show only the immediate parent parsing the full parent
				full_parent = entries[i].parent.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
				HTML += full_parent[full_parent.length - 1];

				HTML += '</span>';
				HTML += '<a id="' + entries[i].parent + '" class="context-add-child-entry" href="#"  data-ajax="false">';
				HTML += '<i class="fa fa-plus-square-o fa-ep fa-ep-in-list" data-href="add-project"></i>';
				HTML += '</a>';
				HTML += '</div>';

				//show all children
				jLength = entries[i].children.length;

				for ( j = 0; j < jLength; j++) {

					//each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
					HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
					HTML += '<a href="entry-values.html?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
					HTML += entries[i].children[j].full_title;
					HTML += '</a>';

					// here we need to display the total of direct childrens for this entry (if not the last form)
					if (form_tree.child !== 0) {

						HTML += '<span class="ui-li-count">';
						HTML += entries[i].children[j].nested_children_count;
						HTML += '</span>';
					}
					HTML += '</li>';

				}

			}//for

			//cache the last rendered parent (for pagination purposes) We will use this value when the user taps on "Show more"
			window.localStorage.last_parent = entries[entries.length - 1].parent;

			return HTML;

		};

		module.renderChildEntriesList = function(the_child_entries) {

			//build HTML
			var HTML = "";
			var back_href;
			var i;
			var iLength;
			var j;
			var jLength;
			var entries = the_child_entries;
			var dom_list = $('div#entries-list ul');
			var dom_back_home_btn = $('div#entries a.back-home');
			var action_bar_btn = $('div#entries div#entries-actionbar');
			var active_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
			var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
			var inactive_tab_hash = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
			var inactive_tab_label = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
			var page = $('#entries');
			var header = $('div#entries div[data-role="header"] div[data-href="back-btn"] span.project-name');
			var trail;
			var active_label = "";
			var inactive_label = "";
			var form_id = parseInt(window.localStorage.form_id, 10);
			var form_name = window.localStorage.form_name;
			var form_tree = JSON.parse(window.localStorage.form_tree);
			var project_id = window.localStorage.project_id;
			var project_name = window.localStorage.project_name;
			var load_more_btn = $('div#entries div#entries-list div.more-items-btn');
			var load_more_spinner = $('div#entries div#entries-list div.more-items-btn-spinner');
			var children_offset = parseInt(window.localStorage.QUERY_CHILD_ENTRIES_OFFSET, 10);
			var parent_offset = parseInt(window.localStorage.QUERY_PARENT_ENTRIES_OFFSET, 10);
			var entries_total;
			var self = this;
			
			wls = window.localStorage;

			//reset breadcrumbs, as if the user adds an entry from a child list, we will grab the full parent path from the dom, as we are not navigating the forms manually
			wls.breadcrumbs = JSON.stringify([""]);

			//bind action bar buttons for this page
			_bindActionBarBtns(form_id, form_tree, entries);

			//empty current list
			dom_list.empty();

			//hide action bar button (top right, add and menu)
			action_bar_btn.hide();

			if (entries.length > 0) {
				HTML = _buildChildEntriesList(form_id, form_tree, entries.slice(0));

			} else {

				/*no more child entries (when user deleted all the entries one by one from child entries list)
				 so redirect to forms list*/
				EC.Forms.getList("forms.html?project=" + project_id + "&name=" + project_name);

			}

			//add project name to header
			header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

			//check if this form is at the top of the tree so the back button will go back to the form page (#forms)
			inactive_label = "Forms";

			//build back button hash
			back_href = "forms.html?project=" + wls.project_id + "&name=" + wls.project_name;
			wls.back_nav_url = back_href;

			//update active tab name with the current active form
			active_label = form_name;

			//update active tab name with the current active form
			active_tab.text(form_name);

			//update inactive tab
			inactive_tab_label.text(inactive_label);
			inactive_tab_hash.attr("data-href", back_href);

			//append list and change page
			dom_list.append(HTML);
			dom_list.listview('refresh');

			//attach delegate event to all links to add a child entry for the selected parent
			dom_list.off().on('vclick', "a.context-add-child-entry", function() {

				//add parent of selected itme in breadcrumbs
				var breadcrumbs_trail = JSON.parse(wls.getItem("breadcrumbs")) || [];
				breadcrumbs_trail.push($(this).attr("id"));
				wls.breadcrumbs = JSON.stringify(breadcrumbs_trail);

				EC.Entries.addEntry();

			});

			//show "Show more" button if we have more entries to display
			entries_total = EC.Utils.getFormByID(form_id).entries;
			if (entries_total > (children_offset + wls.QUERY_LIMIT)) {
				load_more_btn.removeClass('not-shown');
			} else {
				load_more_btn.addClass('not-shown');
			}

			//bind "show more button"
			load_more_btn.off().on('vclick', function(e) {

				//hide button and show loader
				$(this).addClass('not-shown');
				load_more_spinner.removeClass('not-shown');

				//increase offset
				children_offset = parseInt(wls.QUERY_CHILD_ENTRIES_OFFSET, 10);
				children_offset += parseInt(wls.QUERY_LIMIT, 10);
				wls.QUERY_CHILD_ENTRIES_OFFSET = children_offset;

				//get more entries
				self.getMoreChildEntries(form_id, children_offset);

			});

			//set handler for context add button (in a child entries list)
			$('div#entries a.context-add-btn').off().on('vclick', function(e) {

				var parent_key = $(this).attr('id');
				var primary_keys = [];
				var breadcrumb_trail = [];

				//get all <li> but exclude list dividers
				var selected_list = $(this).parent().parent().find("li:not('.custom-divider')");

				//manually add parent key in breadcrumb trail as we are adding an entry from a child entries list
				breadcrumb_trail = parent_key.split(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);
				wls.breadcrumbs = JSON.stringify(breadcrumb_trail);

				//collect all primary key from data-entry-key attribute for selected list
				selected_list.each(function(i) {

					if ($(this).hasClass(parent_key)) {

						console.log($(this).attr('data-entry-key'));
						primary_keys.push($(this).attr('data-entry-key'));

					}
				});

				//store primary keys (for validate against duplication)
				wls.primary_keys = JSON.stringify(primary_keys);

				navigator.notification.activityStart("", "Loading...");

			});

			//add form name to localStorage
			wls.form_name = form_name;
			wls.form_id = form_id;

			//reset "editing mode" flags
			wls.removeItem("edit_mode");
			wls.removeItem("edit_position");
			wls.removeItem("edit_type");
			wls.removeItem("edit_id");

			//reset inputs values and trail
			wls.removeItem("inputs_values");
			wls.removeItem("inputs_trail");

			//reset child full parent path
			wls.removeItem("child_full_parent_path");

			//hide spinning loader
			EC.Notification.hideProgressDialog();

		};

		module.getMoreChildEntries = function(the_form_id, the_children_offset) {

			var form_id = the_form_id;
			var children_offset = the_children_offset;

			//EC.Select.getChildEntries(form_id, parent_offset, children_offset);
			EC.Select.getMoreChildEntries(form_id, children_offset);
		};

		module.appendMoreChildEntries = function(the_entries) {

			var entries = the_entries;
			var i;
			var j;
			var iLength = entries.length;
			var jLength;
			var dom_list = $('div#entries-list ul');
			var form_id = window.localStorage.form_id;
			var form_tree = JSON.parse(window.localStorage.form_tree);
			var load_more_btn = $('div#entries-list .more-items-btn');
			var HTML = "";
			var children_offset = parseInt(window.localStorage.QUERY_CHILD_ENTRIES_OFFSET, 10);
			var entries_total = EC.Utils.getFormByID(form_id).entries;
			var query_limit = parseInt(window.localStorage.QUERY_LIMIT, 10);

			for ( i = 0, iLength = entries.length; i < iLength; i++) {

				//Check if we still have entries to append to the current parent
				if (entries[i].parent === window.localStorage.last_parent) {

					//show all children
					jLength = entries[i].children.length;
					for ( j = 0; j < jLength; j++) {

						//each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
						HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
						HTML += '<a href="#values?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
						HTML += entries[i].children[j].full_title;
						HTML += '</a>';

						// here we need to display the total of direct childrens for this entry (if not the last form)
						if (form_tree.child !== 0) {

							HTML += '<span class="ui-li-count">';
							HTML += entries[i].children[j].nested_children_count;
							HTML += '</span>';
						}
						HTML += '</li>';

					}

				}

				//attach new parent and its entries
				else {

					//show parent key value as divider and context button to add an entry
					HTML += '<li data-role="list-divider">';
					HTML += entries[i].parent;
					HTML += '<a id="' + entries[i].parent + '" class="context-add-btn" href="views/inputs.html"  data-ajax="false">';
					HTML += '<i class="fa fa-plus-square-o fa-ep fa-fw fa-ep-in-list" data-href="add-project"></i>';
					HTML += '</a>';
					HTML += '</li>';

					//show all children
					jLength = entries[i].children.length;

					for ( j = 0; j < jLength; j++) {

						//each element will have the entry key in 'data-entry-key' and the parent key as a class to load the primary keys in memory when adding a new entry from here
						HTML += '<li data-entry-key="' + entries[i].children[j].entry_key + '" class="' + entries[i].parent + '" data-icon="false">';
						HTML += '<a href="#values?form=' + form_id + '&entry_key=' + entries[i].children[j].entry_key + '&direction=' + EC.Const.FORWARD + '&parent=' + entries[i].parent + '">';
						HTML += entries[i].children[j].full_title;
						HTML += '</a>';

						// here we need to display the total of direct childrens for this entry (if not the last form)
						if (form_tree.child !== 0) {

							HTML += '<span class="ui-li-count">';
							HTML += entries[i].children[j].nested_children_count;
							HTML += '</span>';
						}
						HTML += '</li>';

					}

				}

			}//for

			//keep track of last parent which entries are listed on screen (it will be the first parent to search entries for when tapping "Show More")
			window.localStorage.last_parent = entries[entries.length - 1].parent;

			//append list
			dom_list.append(HTML);
			dom_list.listview("refresh");
			dom_list.trigger("updatelayout");

			//show button and hide loader (if there are more entries to show)
			$('div#entries div#entries-list div.more-items-btn-spinner').addClass('not-shown');
			if (entries_total > (children_offset + query_limit)) {
				$('div#entries div#entries-list div.more-items-btn').removeClass('not-shown');
			}

		};

		return module;

	}(EC.Entries));
