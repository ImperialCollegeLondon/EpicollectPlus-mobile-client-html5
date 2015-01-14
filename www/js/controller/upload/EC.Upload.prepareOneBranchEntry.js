/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = ( function(module) {"use strict";

		var branch_entry;
		var self;

		module.branch_entry_post_obj = {};

		module.prepareOneBranchEntry = function(the_table, the_entry) {

			var current_ref;
			var current_value;
			var parent_ref;
			var parent_value;
			var branch_entry = the_entry;

			self = this;
			self.values = branch_entry.values;
			self.branch_entry_key = branch_entry.entry_key;
			self.branch_rows_to_sync = [];

			//table name
			self.branch_entry_post_obj.table = the_table;

			//hierarchy entry owning thi branch
			self.branch_entry_post_obj[branch_entry.hierarchy_entry_key_ref] = branch_entry.hierarchy_entry_key_value;

			//timestamp when entry is first created
			self.branch_entry_post_obj.ecTimeCreated = branch_entry.created_on;

			//phone uuid
			self.branch_entry_post_obj.ecPhoneID = EC.Utils.getPhoneUUID();

			//append entry values to main entry object to be posted
			self.appendBranchEntryValue(self.values.shift(), self.branch_entry_key);

		};

		module.appendBranchEntryValue = function(the_entry_value) {

			var self = this;
			var current_value;
			var current_ref;
			var branch_form;

			current_value = the_entry_value.value;
			current_ref = the_entry_value.ref;

			/*Keep track of row _id (if _id is empty, it is because the location value was split into 4 parts but just one row is saved in the database)
			 *rows _ids are needed later to sync the branch entry after a successful upload
			 */

			if (the_entry_value._id !== "") {
				self.branch_rows_to_sync.push({
					_id : the_entry_value._id
				});
			}

			//common value, add it to main entry object
			self.branch_entry_post_obj[current_ref] = current_value;

			//append next value(if any)
			if (self.values.length > 0) {

				self.appendBranchEntryValue(self.values.shift(), self.branch_entry_key);

			} else {

				//no more values to append to the object to be posted for this branch entry, so post 1 single branch entry
				self.postOneBranchEntry();
			}

		};

		return module;

	}(EC.Upload));
