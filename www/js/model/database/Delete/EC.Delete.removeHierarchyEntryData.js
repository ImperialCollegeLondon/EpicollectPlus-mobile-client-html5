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
		
		var self;
		var hierarchy_entry_key;
		var deferred;
		
		var _removeHierarchyEntryDataSQLSuccessCB = function(the_tx, the_result){
			//do nothing
		};
		
		var _removeHierarchyEntryDataTX = function(tx){
			
			//delete all rows belonging to this entry 
			var query = "DELETE FROM ec_data WHERE entry_key=?";
			tx.executeSql(query, [hierarchy_entry_key], _removeHierarchyEntryDataSQLSuccessCB, self.errorCB);
		};
		
		var _removeHierarchyEntryDataSuccessCB = function(){
			deferred.resolve();
		};

		module.removeHierarchyEntryData = function(the_hierarchy_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;

			EC.db.transaction(_removeHierarchyEntryDataTX, self.errorCB, _removeHierarchyEntryDataSuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
