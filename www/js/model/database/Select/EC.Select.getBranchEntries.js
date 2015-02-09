/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var self;
		var entries = [];
		var form_id;
		var project_id;
		var branch_form_name;
		var hierarchy_key_value;
		var titles = [];
		var full_titles = [];
		var branch_primary_keys = [];
		var child_counter = 0;
		var entry_key;
		var offset;
		var deferred;

		var _getBranchEntriesSuccessCB = function() {

			/*
			 * store primary key values for current branch form
			 * it is not possible to have duplicates for the primary key input field within the same form level
			 * (using circular data structure)
			 */
			var i;
			var iLength = entries.length;
			for ( i = 0; i < iLength; i++) {

				branch_primary_keys.push(entries[i].entry_key);
			}

			EC.BranchInputs.setCachedBranchEntryKeys(branch_form_name, branch_primary_keys);

			branch_primary_keys.length = 0;

			/*
			 * Using each entry, select all the fields for that entry with 'is_title' = true
			 * This will build the full title to be displayed per each itme in the listview
			 * if no inputs are set as title, default to the value of the primary key
			 */

			EC.db.transaction(_getEntriesTitlesTX, EC.Select.errorCB, _getEntriesTitlesSuccessCB);

			/*
			 * Using each entry, count how many child entry there are per each entry
			 * The counts will be displayed on the list of entries
			 */

			console.log(EC.Const.TRANSACTION_SUCCESS);

		};

		var _getEntriesTitlesTX = function(tx) {

			var i;
			var iLenght = entries.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'SELECT _id, value, entry_key FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND is_title=? AND entry_key=? AND hierarchy_entry_key_value=?';
				tx.executeSql(query, [branch_form_name, project_id, 1, entries[i].entry_key, entries[i].hierarchy_entry_key_value], _getEntriesTitlesSQLSuccess, EC.Select.errorCB);

			}//for

		};

		var _getEntriesTitlesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {

				titles.push(the_result.rows.item(i));
			}

		};

		var _getEntriesTitlesSuccessCB = function() {

			//Build the titles concatenating all the title fields found per each entry
			var i;
			var j;
			var iLength = entries.length;
			var jLength = titles.length;
			var full_title;

			for ( i = 0; i < iLength; i++) {

				full_title = "";

				for ( j = 0; j < jLength; j++) {

					if (entries[i].entry_key === titles[j].entry_key) {

						full_title += (full_title === "") ? titles[j].value : ", " + titles[j].value;

					}

				}//for titles

				full_titles.push({
					full_title : full_title,
					entry_key : entries[i].entry_key
				});

			}//for entries

			console.log("branch entries full_titles");
			console.log(full_titles);

			//resolve deferred returning full titles
			deferred.resolve(full_titles.slice(0));

			//clear all arrays
			full_titles.length = 0;
			titles.length = 0;
			entries.length = 0;

		};

		/*
		 * Get all entries for a form and group them by entry_key:
		 * a form have multiple entries, one per each input, and they all have the same entry_key value)
		 */
		var _getBranchEntriesTX = function(tx) {

			var query = "";

			query = 'SELECT _id, entry_key, hierarchy_entry_key_value FROM ec_branch_data ';
			query += 'WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) ';
			query += 'AND hierarchy_entry_key_value=? ';
			query += 'GROUP BY entry_key ';
			query += 'ORDER BY entry_key ';
			query += 'LIMIT ' + window.localStorage.QUERY_LIMIT + " OFFSET " + offset;

			tx.executeSql(query, [branch_form_name, project_id, hierarchy_key_value], _getBranchEntriesSQLSuccess, EC.Select.errorCB);
			self.query_error_message = "EC.Select.getBranchEntries _getBranchEntriesTX";

		};

		var _getBranchEntriesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with entries
			for ( i = 0; i < iLenght; i++) {

				entries.push(the_result.rows.item(i));

			}

			console.log(entries, true);

		};

		var _getBranchEntriesTitlesTX = function(tx) {

			var i;
			var iLenght = entries.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'SELECT _id, value, entry_key FROM ec_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE name=? AND project_id=?) AND is_title=? AND entry_key=? AND hierarchy_entry_key_value=?';
				tx.executeSql(query, [branch_form_name, project_id, 1, entries[i].entry_key, entries[i].hierarchy_entry_key_value], _getBranchEntriesTitlesSQLSuccess, EC.Select.errorCB);

			}//for

		};

		var _getBranchEntriesTitlesSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with titles
			for ( i = 0; i < iLenght; i++) {

				titles.push(the_result.rows.item(i));
			}

		};

		module.getBranchEntries = function(the_project_id, the_branch_form_name, the_hierarchy_entry_key_value, the_offset) {

			self = this;
			branch_form_name = the_branch_form_name;
			hierarchy_key_value = the_hierarchy_entry_key_value;
			project_id = the_project_id;
			offset = the_offset;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchEntriesTX, EC.Select.errorCB, _getBranchEntriesSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));
