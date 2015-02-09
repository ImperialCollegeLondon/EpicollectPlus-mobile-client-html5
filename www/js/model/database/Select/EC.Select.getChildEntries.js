/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var form_id;
		var parents = [];
		var parent_counter = 0;
		var children_counter = 0;
		var children_offset;
		var nested_children_counter = 0;
		var offset = 0;
		var prev_parent_children;
		var parent_offset;
		var form_total_inputs;
		var parent_form_total_entries;
		var form_total_entries;
		var is_loading_more;
		var query_limit;
		var self;
		var new_request;

		/**
		 * @method _getChildEntriesParentsTX Get a parent entry (one at a time)
		 */
		var _getChildEntriesParentsTX = function(tx) {

			//get all the parents one at a time
			var query = "";
			query += 'SELECT DISTINCT parent FROM ec_data WHERE form_id=? ORDER BY parent ';
			query += 'LIMIT ' + 1 + ' ';
			query += 'OFFSET ' + (parent_offset);

			tx.executeSql(query, [form_id], _getChildEntriesParentsSQLSuccess, EC.Select.errorCB);
		};

		var _getChildEntriesParentsSuccessCB = function(the_tx) {

		};

		/**
		 * @method _getChildEntriesParentsSQLSuccess Get all the children for the passed parent
		 * @param {Object} the_tx the transaction
		 * @param {Object} the_result the object returned by a successful query
		 */
		var _getChildEntriesParentsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;
			var parent;

			//if we have a parent to get children for
			if (iLength > 0) {
				parent = the_result.rows.item(0).parent;
				parents.push(the_result.rows.item(0));

				//get children per each parent
				EC.db.transaction(_getAllChildrenTX, EC.Select.errorCB, _getAllChildrenSuccessCB);
			} else {

				//no more parents found, display entries
				if (new_request) {

					EC.Entries.appendMoreChildEntries(parents);

				} else {

					//are we loading more children? (user tapped "show more")
					if (is_loading_more) {
						EC.Entries.appendMoreChildEntries(parents);

					} else {
						//render children on screen
						EC.Entries.renderChildEntriesList(parents);
					}

				}

			}

		};

		/**
		 *
		 * @method _getAllChildrenTX query ec_data table for children of a parent, paginated by LIMIT * (number of inputs for that form)
		 * @param {Object} tx the transaction
		 */
		var _getAllChildrenTX = function(tx) {

			//select all entries aside from the one skipped (by jumps)
			var parent = parents[parent_counter].parent;
			var query = 'SELECT form_id, parent, label, value,  entry_key, is_title, type FROM ec_data WHERE parent=? AND value<>?';

			//if new_request is true, we need to request the maximum number of children according to the pagination settings
			if (new_request) {
				query += 'LIMIT ' + ((window.localStorage.QUERY_LIMIT) * form_total_inputs) + ' ';
				new_request = false;

			} else {

				//new_request is false, so is it not a user request but recursion. Since we have got children from a previous parent, we need to request less entries
				query += 'LIMIT ' + ((window.localStorage.QUERY_LIMIT - prev_parent_children) * form_total_inputs) + ' ';

			}

			//if children offset is 0, request children starting from first row
			if (children_offset === 0) {
				query += 'OFFSET 0';
			} else {

				//we have an offset, so load all the children AFTER the offset.
				//If we have any previous children already loaded, the offset needs to be exactly that, usually less then the pagination.
				//That happen when we loaded children for more parents, so we loaded less then the pagination limit for the last parent children
				if (prev_parent_children === 0) {
					query += 'OFFSET ' + children_offset * form_total_inputs;
				} else {
					query += 'OFFSET ' + prev_parent_children * form_total_inputs;
					prev_parent_children = 0;
				}

			}

			tx.executeSql(query, [parent, EC.Const.SKIPPED], _getAllChildrenSQLSuccessCB, EC.Select.errorCB);

		};

		/**
		 * @method _getAllChildrenSQLSuccessCB Gets all the children for a parent.
		 * A single entry is made of multiple rows so we need to loop to build the title
		 * @param {Object} the_tx
		 * @param {Object} the_result
		 */
		var _getAllChildrenSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;
			var child_full_title = "";

			//check if we have any entries
			if (iLength > 0) {

				//get first row and entry key
				var row = the_result.rows.item(0);
				var entry_key = row.entry_key;

				//build title (avoiding empty fields so we do not end up with "my_title, , , , ,")
				if (row.is_title === 1 && row.value !== "") {
					child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
				}

				parents[parent_counter].children = [];
				children_counter = 0;

				//loop all the other rows past the first one
				for ( i = 1; i < iLength; i++) {

					row = the_result.rows.item(i);

					//if entry key is matching, build title only
					if (row.entry_key === entry_key) {

						//build title (avoiding empty fields so we do not end up with "my_title, , , , ,")
						if (row.is_title === 1 && row.value !== "") {
							child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
						}

						//different entry key i.e another entry
					} else {

						//if no title yet, default to value of primary key
						if (child_full_title === "") {
							child_full_title = entry_key;
						}

						//add child
						parents[parent_counter].children[children_counter] = {
							full_title : child_full_title,
							entry_key : entry_key
						};

						entry_key = row.entry_key;
						children_counter++;
						child_full_title = "";

						//reset title
						if (row.is_title === 1 && row.value !== "") {
							child_full_title += (child_full_title === "") ? row.value : ', ' + row.value;
						}
					}
				}

				//if after looping all the rows title is still empty, default to value of the primary key
				if (child_full_title === "") {
					child_full_title = entry_key;
				}

				//add child
				parents[parent_counter].children[children_counter] = {
					full_title : child_full_title,
					entry_key : entry_key
				};

				child_full_title = "";

			}
		};

		/*
		 * All children fetched correctly, get nested children count
		 */
		var _getAllChildrenSuccessCB = function() {

			var i;
			var iLength = parents.length;

			EC.db.transaction(_getNestedChildrenCountTX, EC.Select.errorCB, _getNestedChildrenCountSuccessCB);
		};

		var _getNestedChildrenCountSuccessCB = function() {

			var query_limit = window.localStorage.QUERY_LIMIT;

			nested_children_counter = 0;
			children_counter = 0;

			//are we loading more for the same parent? (user tapped "Show More" button)
			if (is_loading_more) {

				//if the total of children for the current parent is less then the items per page settings, get the next parent and its children
				if (parents[parent_counter].children.length < (query_limit - prev_parent_children)) {

					//update counters before getting new parent
					prev_parent_children = parents[parent_counter].children.length;
					parent_counter++;
					parent_offset++;
					children_offset = 0;

					//get next parent first
					EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

				} else {

					//cache the last parent children total
					prev_parent_children = parents[parent_counter].children.length;

					//append children to list
					EC.Entries.appendMoreChildEntries(parents);
				}

			} else {

				var j;
				var jLength = parents.length;
				var total_children_loaded = 0;

				//calculate total of children loaded recursively for each parent
				for ( j = 0; j < jLength; j++) {
					total_children_loaded += parents[j].children.length;
				}

				//it the total of children is less then the pagination limit, get next parent and its children
				if (total_children_loaded < query_limit) {

					//get next parent and its children
					self.getNextParentChildEntries(total_children_loaded);

				} else {

					//cache last parent total of children
					prev_parent_children = parents[parent_counter].children.length;

					//render list of children
					EC.Entries.renderChildEntriesList(parents);
				}
			}
		};

		var _getNestedChildrenCountTX = function(tx) {

			var i;
			var iLength = parents[parent_counter].children.length;
			var query;
			var parent_path;
			var form_tree = EC.Utils.getParentAndChildForms(form_id);
			var child_form_id = form_tree.child;

			for ( i = 0; i < iLength; i++) {

				//build root path (parent|entry_key)
				parent_path = parents[parent_counter].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parents[parent_counter].children[i].entry_key;

				query = 'SELECT entry_key FROM ec_data WHERE parent=? AND form_id=? GROUP BY entry_key';

				tx.executeSql(query, [parent_path, child_form_id], _getNestedChildrenCountSQLSuccessCB, EC.Select.errorCB);

			}

		};

		var _getNestedChildrenCountSQLSuccessCB = function(the_tx, the_result) {

			//store total of nested children
			parents[parent_counter].children[nested_children_counter].nested_children_count = the_result.rows.length;
			nested_children_counter++;

		};

		module.getChildEntries = function(the_child_form_id, the_parent_offset, the_children_offset) {

			form_id = the_child_form_id;
			parent_offset = the_parent_offset;
			children_offset = the_children_offset;
			form_total_entries = EC.Utils.getFormByID(form_id).entries;
			form_total_inputs = EC.Utils.getFormByID(form_id).total_inputs;
			parent_form_total_entries = 0;
			is_loading_more = false;
			prev_parent_children = 0;
			parents.length = 0;
			parent_counter = 0;
			self = this;

			//get all parents first
			EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

		};

		module.getNextParentChildEntries = function(the_total_of_children_loaded) {

			//get total of children already loaded
			prev_parent_children = the_total_of_children_loaded;

			//increase parent counter
			parent_offset++;
			parent_counter++;

			//get all parents first
			EC.db.transaction(_getChildEntriesParentsTX, EC.Select.errorCB, _getChildEntriesParentsSuccessCB);

		};

		module.getMoreChildEntries = function(the_child_form_id, the_children_offset) {

			form_id = the_child_form_id;
			children_offset = the_children_offset;
			is_loading_more = true;
			query_limit = window.localStorage.QUERY_LIMIT;

			//set a flag so we know we are dealing with a new user request aaction (tapping "show more" on the entries list)
			new_request = true;

			//save last parent and set it as first elements of parents aray.
			//When tapping for more entries, we need to fetch for the last parent first
			var last_parent = parents[parents.length - 1];
			parents.length = 0;
			parents.push(last_parent);

			//reset children count to 0, as we need to remove previous children already listed in the DOM
			parents[0].children.length = 0;

			parent_counter = 0;

			console.log(parents);

			//get more entries for the same parent
			EC.db.transaction(_getAllChildrenTX, EC.Select.errorCB, _getAllChildrenSuccessCB);

		};

		return module;

	}(EC.Select));
