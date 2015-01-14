/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/**
 * @module EC
 * @submodule Entries
 */

var EC = EC || {};
EC.Entries = ( function(module) {"use strict";

		/**
		 * @method renderList
		 * Update the UI listing all the entries for a form. What is listed is all the field values flagged as "title"
		 * If no title field is found, the value of the primary key of that form is shown instead
		 *
		 * @param {array} the_entries Array with all the entries for a form.
		 * Each element is like {children: 1, entry_key: "Kingston", full_title: "Kingston, KI6475746856"}
		 * -children- is the number of child entries belonging to each parent entry (if any)
		 * -entry_key- value of the primary key for that form
		 * -full_title- all the values flagged as title in csv format
		 *
		 */

		var wls;

		/**
		 *  Bind Action Bar buttons tap events
		 */
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

			//open inputs
			add_entry_btn.off().on('vclick', function(e) {
				EC.Entries.addEntry();
			});

			inactive_tab.off().on('vclick', function(e) {

				var project_id = wls.project_id;
				var project_name = wls.project_name;

				//get url from data-hef attribute
				var page = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i').attr("data-href");

				EC.Routing.changePage(page);

			});

		};

		var _buildList = function(the_form_id, the_form_tree, the_entries) {

			var form_id = the_form_id;
			var form_tree = the_form_tree;
			var entries = the_entries;
			var i;
			var iLength = entries.length;
			var HTML = "";

			//if it is the last form, show single list view row with no nested children (no right button)
			if (form_tree.child === 0) {
				for ( i = 0; i < iLength; i++) {

					//if no title set, use value of primary key as title
					entries[i].full_title = (entries[i].full_title === "") ? entries[i].entry_key : entries[i].full_title;

					HTML += '<li data-icon="false">';
					HTML += '<a href="entry-values.html?form=' + form_id + '&entry_key=' + entries[i].entry_key + '&direction=' + EC.Const.FORWARD + '">';

					//show full entries title removing last comma if any
					HTML += entries[i].full_title.replace(/,\s*$/, "");
					HTML += '</a>';
					HTML += '</li>';
				}//for

			} else {

				//split listview to show a button on the right to navigate down the form tree entries and a button to list the inputs for the entry
				for ( i = 0, iLength = entries.length; i < iLength; i++) {

					//if no title set, use value of primary key as title
					entries[i].full_title = (entries[i].full_title === "") ? entries[i].entry_key : entries[i].full_title;

					//render entry as a button to view the entry (direction =  VIEW)
					HTML += '<li data-icon="ep-next-page">';
					HTML += '<a href="entry-values.html?form=' + form_id;
					HTML += '&entry_key=' + entries[i].entry_key;
					HTML += '&direction=' + EC.Const.VIEW;
					HTML += '">';

					//show full entries title removing last comma if any
					HTML += entries[i].full_title.replace(/,\s*$/, "");
					HTML += '</a>';

					//render button to go to children entries for that entry (direction = FORWARD)
					HTML += '<a href="entries-list.html?form=' + form_tree.child;
					HTML += '&name=' + form_tree.cname;
					HTML += '&entry_key=' + entries[i].entry_key;
					HTML += '&direction=' + EC.Const.FORWARD;
					HTML += '&children=' + entries[i].children;
					HTML += '">';
					HTML += '</a>';
					// here we need to display the total of direct children for this entry
					HTML += '<span class="ui-li-count">' + entries[i].children;
					HTML += '</span>';
					HTML += '</li>';
				}//for
			}

			return HTML;

		};

		module.renderList = function(the_entries) {

			//build HTML
			var HTML = "";
			var back_href = "";
			var back_children;
			var i;
			var iLength;
			var entries = the_entries;
			var dom_list = $('div#entries-list ul');
			var empty_entries_list = $("div#entries div#entries-list div#empty-entries-list");
			var empty_entries_list_form_name = $("div#entries div#entries-list div#empty-entries-list p span.form-name");
			var page = $('#entries');
			var header = $('div#entries div[data-role="header"] div[data-href="entries-nav-btn"] span.project-name');
			var trail;
			var inactive_label = "";
			var dom_back_home_btn = $('div#entries a.back-home');
			var action_bar_btn = $('div#entries div#entries-actionbar');
			var active_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.active-tab span');
			var inactive_tab = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
			var inactive_tab_hash = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab i');
			var inactive_tab_label = $('div#entries div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab span');
			var form_id;
			var form_name;
			var form_tree;
			var project_name;
			var load_more_btn = $('div#entries div#entries-list div.more-items-btn');
			var load_more_spinner = $('div#entries div#entries-list div.more-items-btn-spinner');
			var self = this;
			var offset;
			var limit;
			var current_entries_total;
			var totals;

			wls = window.localStorage;
			form_id = parseInt(wls.form_id, 10);
			form_name = wls.form_name;
			form_tree = JSON.parse(wls.form_tree);
			project_name = wls.project_name;
			offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
			limit = parseInt(wls.QUERY_LIMIT, 10);

			//reset entries offset if we are not using the cached entries
			if (!window.localStorage.cached_entries_list) {

				wls.QUERY_ENTRIES_OFFSET = 0;

				//cache current entries only the first time we load the page from the form list
				window.localStorage.cached_entries_list = JSON.stringify(entries);
			}

			//request pagination when going back
			totals = JSON.parse(wls.entries_totals);
			current_entries_total = totals[totals.length - 1].entries_total;
			//request pagination when going back
			back_children = (totals.length > 1) ? totals[totals.length - 2].entries_total : 0;

			//bind action bar buttons for this page
			_bindActionBarBtns();

			//show action bar buttons
			action_bar_btn.show();

			//show "Show more" button if we have more entries to display
			if (current_entries_total > (offset + limit)) {
				load_more_btn.removeClass('not-shown');
			} else {
				load_more_btn.addClass('not-shown');
			}

			//bind "show more button"
			load_more_btn.off().on('vclick', function(e) {

				/**
				 * Embedded spinning loader works only on iOS, do not know why
				 */

				if (window.device.platform === EC.Const.IOS) {
					//hide button and show loader
					$(this).addClass('not-shown');
					load_more_spinner.removeClass('not-shown');
				}

				if (window.device.platform === EC.Const.ANDROID) {
					EC.Notification.showProgressDialog();
				}

				//increase offset
				offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
				offset += parseInt(wls.QUERY_LIMIT, 10);
				wls.QUERY_ENTRIES_OFFSET = offset;

				//get more entries
				self.getMoreEntries(offset);

			});

			//empty current list
			dom_list.empty();

			//if we have entries, list them
			if (entries.length > 0) {

				//hide empty list message (no entries found)
				empty_entries_list.addClass('not-shown');
				dom_list.removeClass('not-shown');

				//build list of entries markup
				HTML = _buildList(form_id, form_tree, entries);

			} else {

				//no entries found
				//hide empty list message (no entries found)
				empty_entries_list.removeClass('not-shown');
				dom_list.addClass('not-shown');

				empty_entries_list_form_name.text(form_name);

			}

			//add project name to header
			header.text(project_name.trunc(EC.Const.PROJECT_NAME_MAX_LENGTH));

			//check if this form is at the top of the tree so the back button will go back to the form page (#forms)
			if (form_tree.parent === 0) {

				inactive_label = "Forms";

				//build url
				back_href = "forms.html?project=" + wls.project_id + "&name=" + wls.project_name;

			} else {

				//this is a nested form, so we need to go back to the previous form in the stack based on what entry was selected
				trail = JSON.parse(wls.breadcrumbs);

				//breadcrumb label will indicate form and last element of the breadcrumb trail
				inactive_label = form_tree.pname + ": " + trail[trail.length - 1];

				//back button will have parent form and parent entry key (which is the next to last element in the breadcrumb trail)
				//and number of children (parent entries when going back) for pagination
				back_href += 'entries-list.html?form=' + form_tree.parent;
				back_href += '&name=' + form_tree.pname;
				back_href += '&entry_key=' + trail[trail.length - 2];
				back_href += '&direction=' + EC.Const.BACKWARD;
				back_href += '&children=' + back_children;
			}

			//update active tab name with the current active form
			active_tab.text(form_name);

			//update inactive tab
			inactive_tab_label.text(inactive_label);
			inactive_tab_hash.attr("data-href", back_href);

			if (entries.length > 0) {
				dom_list.append(HTML);
				dom_list.listview('refresh');
			}

			//add form name to localStorage
			wls.form_name = form_name;
			wls.form_id = form_id;

			//remove navigation objects
			wls.removeItem("inputs_values");
			wls.removeItem("inputs_trail");
			wls.removeItem("current_position");
			wls.removeItem("back_edit_nav_url");

			//reset "editing mode" flags
			wls.removeItem("edit_mode");
			wls.removeItem("edit_position");
			wls.removeItem("edit_type");
			wls.removeItem("edit_id");

			//handle tap on list item: cache Y position from top of screen, to silently scroll to position when navigating back from single entry values
			$("div#entries-list ul li").off().on('vclick', function() {
				console.log($(this).position().top);
				//window.localStorage.previous_tapped_entry_Y = $(this).offset().top;
				window.localStorage.previous_tapped_entry_Y = $(this).position().top;

			});
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			EC.Notification.hideProgressDialog();
		};

		module.getMoreEntries = function(the_offset) {

			var load_more_parameters = JSON.parse(wls.load_more_parameters);
			var form_id = load_more_parameters.form_id;
			var parent_path = load_more_parameters.parent_path;
			var offset = the_offset;

			EC.Select.getEntries(form_id, parent_path, offset);
		};

		module.appendMoreEntries = function(the_entries) {

			var dom_list = $('div#entries-list ul');
			var entries = the_entries;
			var form_id = parseInt(wls.form_id, 10);
			var form_name = wls.form_name;
			var form_tree = JSON.parse(wls.form_tree);
			var project_name = wls.project_name;
			var load_more_btn = $('div#entries-list .more-items-btn');
			var HTML = "";
			var offset = parseInt(wls.QUERY_ENTRIES_OFFSET, 10);
			var limit = parseInt(wls.QUERY_LIMIT, 10);
			var totals;
			var current_entries_total;
			var cached_entries;

			//get total of entries
			totals = JSON.parse(wls.entries_totals);
			current_entries_total = totals[totals.length - 1].entries_total;

			HTML = _buildList(form_id, form_tree, entries);

			dom_list.append(HTML);
			dom_list.listview("refresh");
			dom_list.trigger("updatelayout");

			//handle tap on list item: cache Y position from top of screen, to silently scroll to position when navigating back from single entry values
			$("div#entries-list ul li").off().on('vclick', function() {
				console.log($(this).position().top);
				//window.localStorage.previous_tapped_entry_Y = $(this).offset().top;
				window.localStorage.previous_tapped_entry_Y = $(this).position().top;

			});

			//show button and hide loader
			if (window.device.platform === EC.Const.IOS) {
				$('div#entries div#entries-list div.more-items-btn-spinner').addClass('not-shown');
			}
			if (window.device.platform === EC.Const.ANDROID) {
				EC.Notification.hideProgressDialog();
			}

			if (current_entries_total > (offset + limit)) {
				$('div#entries div#entries-list div.more-items-btn').removeClass('not-shown');
			}

			//cache new entries
			cached_entries = JSON.parse(window.localStorage.cached_entries_list);
			window.localStorage.cached_entries_list = JSON.stringify(cached_entries.concat(entries));
			
			

		};

		return module;

	}(EC.Entries));
