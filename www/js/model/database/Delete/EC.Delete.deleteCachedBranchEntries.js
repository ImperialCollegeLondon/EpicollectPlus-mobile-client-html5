/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {"use strict";

		var _deleteCachedBranchEntriesTX = function(tx) {

			var delete_query = "DELETE FROM ec_branch_data WHERE is_cached=? AND is_stored=?";

			tx.executeSql(delete_query, [1, 0], _deleteCachedBranchEntriesSQLSuccessCB, EC.Delete.txErrorCB);

		};

		var _deleteCachedBranchEntriesSuccessCB = function() {

			console.log("Cached branch entries deleted");

			EC.Routing.changePage(EC.Const.INDEX_VIEW);

		};

		var _deleteCachedBranchEntriesSQLSuccessCB = function(the_tx, the_result) {

			console.log(the_result);
		};

		module.deleteCachedBranchEntries = function() {

			EC.db.transaction(_deleteCachedBranchEntriesTX, EC.Delete.txErrorCB, _deleteCachedBranchEntriesSuccessCB);

		};

		return module;

	}(EC.Delete));
