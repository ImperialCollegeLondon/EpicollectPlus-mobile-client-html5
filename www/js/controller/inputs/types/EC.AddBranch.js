/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.addBranch = function(the_count, the_input) {

			var obj;
			var span_label = $('div#branch span.label');
			var count = the_count;
			var input = the_input;
			var project_id = window.localStorage.project_id;
			var add_branch_btn = $('div#input-branch div#add-branch-btn');
			var list_branch_entries_btn = $('div#input-branch div#list-branch-entries-btn');
			var list_entries_count = $('div#input-branch div#list-branch-entries-btn span.branch-entries-count');

			//hierarchy_entry_key_value is the current value of the primary key for the form we want to enter branches to
			//var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
			//var hierarchy_entry_key_value = EC.Inputs.getMainFormCurrentKeyValue(parent_key_position).value;
			var branch_form = JSON.parse(window.localStorage.branch_form);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			var _addBranchEntry = function() {
				//get list of inputs for the branch form and render the first one on screen
				EC.BranchInputs.getList(branch_form.name, project_id);
			};

			var _listBranchEntries = function() {
				EC.Routing.changePage(EC.Const.BRANCH_ENTRIES_LIST_VIEW);
			};

			//update label text
			span_label.text(input.label);

			//attach event handlers (removing old ones to avoid tiggering an event twice)
			add_branch_btn.off().one('vclick', _addBranchEntry);

			//add branch form name as data value to add-branch button
			add_branch_btn.attr("data-branch-form-name", input.branch_form_name);

			if (count > 0) {
				//show branch entries on cick
				list_branch_entries_btn.off('vclick').one('vclick', _listBranchEntries);
				list_branch_entries_btn.removeClass("ui-disabled");
				list_branch_entries_btn.find("span.branch-entries-count").text(count);

			} else {
				//no entries for this branch, disable button and reset counter to empty(0)
				list_branch_entries_btn.addClass("ui-disabled");
				list_entries_count.text("");
			}

			//add entries count as a data atttribute to button
			list_branch_entries_btn.attr("data-entries-count", count);
			
		};

		return module;

	}(EC.InputTypes));
