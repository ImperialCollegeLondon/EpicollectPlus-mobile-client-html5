/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";

		var hierarchy_entry_key;
		var deferred;
		
		var _errorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_error);
		};
		
		var _removeLinkedBranchEntriesSQLSuccessCB = function(the_tx, the_result){
		};
		
		var _removeLinkedBranchEntriesTX = function(tx){
			
			//delete all branches linked to this entry key (if any)
			var delete_branches_query = "DELETE FROM ec_branch_data WHERE hierarchy_entry_key_value=?";
			tx.executeSql(delete_branches_query, [hierarchy_entry_key], _removeLinkedBranchEntriesSQLSuccessCB, _errorCB);
			
		};
		
		var _removeLinkedBranchEntriesSuccessCB = function(){
			
			deferred.resolve();
		};

		module.removeLinkedBranchEntries = function(the_hierarchy_entry_key) {

			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;

			EC.db.transaction(_removeLinkedBranchEntriesTX, _errorCB, _removeLinkedBranchEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Delete));
