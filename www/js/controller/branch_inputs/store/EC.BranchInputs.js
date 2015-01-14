/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.buildRows = function() {

			var self = this;
			var i;
			var branch_input;
			var value;
			var _id;
			var ref;
			var rows = [];
			var iLength = EC.BranchInputs.branch_inputs.length;
			var key_position = EC.BranchInputs.getPrimaryKeyRefPosition();
			var parent_key_position = EC.Inputs.getPrimaryKeyRefPosition();
			var parts;
			var filename;
			var form_name = window.localStorage.form_name;
			var uuid = EC.Utils.getPhoneUUID();
			var form_id = window.localStorage.form_id;
			var created_on = EC.Utils.getTimestamp();
			var branch_form_name = window.localStorage.branch_form_name;

			//get parent key value for the current branch form
			var current_branch_input_position = parseInt(window.localStorage.branch_current_position, 10);

			//get value of primary key for this branchform
			var key_value = EC.BranchInputs.getCachedInputValue(key_position).value;

			/* Get value of primary key for the parent entry of this branch form.
			 * The parent key value is the one cached, if the user edits it before saving the entry, it will need to be updated in the database
			 * or lock the editing after inserting a branch form
			 */

			var hierarchy_entry_key_value = EC.Inputs.getCachedInputValue(parent_key_position).value;

			//build rows to be saved - the text value for each input is saved in an array with corresponding indexes
			for ( i = 0; i < iLength; i++) {

				//get current value
				branch_input = EC.BranchInputs.branch_inputs[i];
				value = EC.BranchInputs.getCachedInputValue(branch_input.position).value;
				_id = EC.BranchInputs.getCachedInputValue(branch_input.position)._id;

				//deal with media types to save the correct value (full path uri)
				if (branch_input.type === EC.Const.PHOTO || branch_input.type === EC.Const.VIDEO || branch_input.type === EC.Const.AUDIO) {

					console.log("value: " + JSON.stringify(value));

					if (value.stored === "") {

						//we are saving a new media file path from the cached one (or an empty string if the file field was optional)
						if (value.cached !== "") {

							//build file name (in the format <form_name>_<ref>_<uuid>_filename) with the cached value
							parts = value.cached.split('/');
							filename = parts[parts.length - 1];

							value = form_name + "_" + branch_input.ref + "_" + uuid + "_" + filename;
						} else {

							value = "";
						}

					} else {

						//use the existing stored path
						value = value.stored;
					}

				}

				console.log('branch_input.type: ' + branch_input.type);

				rows.push({
					_id : _id, //this is set only when we are editing
					input_id : branch_input._id,
					form_id : branch_input.form_id,
					position : branch_input.position,
					hierarchy_entry_key_value : hierarchy_entry_key_value,
					label : branch_input.label,
					value : value,
					ref : branch_input.ref,
					is_title : branch_input.is_title,
					entry_key : key_value,
					type : branch_input.type,
					is_data_synced : 0,
					is_media_synced : 0,
					is_remote : 0,
					created_on : created_on
				});

			}//for each input

			EC.Notification.showProgressDialog();

			console.log('rows');
			console.log(JSON.stringify(rows));

			//save/update values to database
			if (window.localStorage.branch_edit_mode) {

				EC.Update.commitBranchForm(rows);
				window.localStorage.branch_edit_hash = '#entries?form=' + form_id + '&name=' + form_name + '&entry_key=&direction=' + EC.Const.EDITING;

				//set selected key value in localStorage to show list of values later
				window.localStorage.branch_edit_key_value = key_value;

			} else {

				EC.Create.insertBranchFormValues(rows, key_value, hierarchy_entry_key_value);
			}

		};

		return module;

	}(EC.BranchInputs));
