/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * Select  all the rows we are going to delete and cache them
 *
 * We need the total amount of rows deleted ot updated the entries counter per
 * each form, also we need to delete any children based on the entry key of the
 * selected entry
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var parent_key;
		var child_entries;
		var child_counters;
		var parent_entries;

		var _getChildEntriesForDeletionSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				child_entries.push(the_result.rows.item(i));
			}

			if (iLength > 0) {
				child_counters = {
					form_id : child_entries[0].form_id,
					amount : child_entries.length
				};
			}
		};

		var _getChildEntriesForDeletionTX = function(tx) {

			var i;
			var iLength = parent_entries.length;
			var query = "SELECT form_id, parent, entry_key, COUNT(*) as count FROM ec_data WHERE parent=? GROUP BY entry_key";

			//We will loop using all the 'parent' values as we might have more than one child
			// to delete

			/* per each entry, get parent key building up full path to the root
			 * like <parent_key>|<child_key> etc.
			 * parent key is "" when the entry is a top level entry (top level form), because
			 * it cannot have any parent
			 */
			for ( i = 0; i < iLength; i++) {

				if (parent_entries[i].parent === "") {
					parent_key = parent_entries[i].entry_key;
				}
				else {
					parent_key = parent_entries[i].parent + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + parent_entries[i].entry_key;
				}

				//TODO: is parent key always the same for all entries? IT should be...
				console.log("parent key: " + parent_key);

				tx.executeSql(query, [parent_key], _getChildEntriesForDeletionSQLSuccessCB, self.errorCB);
			}

		};

		var _getChildEntriesForDeletionSuccessCB = function() {
			deferred.resolve(child_entries, child_counters);
		};

		module.getChildEntriesForDeletion = function() {

			self = this;
			deferred = new $.Deferred();
			parent_entries = EC.Delete.deletion_entries;
			child_entries = [];
			child_counters = {};

			EC.db.transaction(_getChildEntriesForDeletionTX, self.errorCB, _getChildEntriesForDeletionSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
