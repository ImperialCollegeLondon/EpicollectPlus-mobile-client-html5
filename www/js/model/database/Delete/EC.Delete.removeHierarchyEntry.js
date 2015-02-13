/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * @method removeHierarchyEntry
 * remove all the rows belonging to a hierarchy entry
 *
 * @param {String} the_hierarchy_entry_key 
 * the entry key of the hierarchy entry
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {
		"use strict";
		
		var self;
		var hierarchy_entry_key;
		var deferred;
		
		var _removeHierarchyEntryTX = function(tx){
			
			//delete all rows belonging to this entry 
			var query = "DELETE FROM ec_data WHERE entry_key=?";
			tx.executeSql(query, [hierarchy_entry_key], null, self.errorCB);
		};
		
		var _removeHierarchyEntrySuccessCB = function(){
			deferred.resolve();
		};

		module.removeHierarchyEntry = function(the_hierarchy_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;

			EC.db.transaction(_removeHierarchyEntryTX, self.errorCB, _removeHierarchyEntrySuccessCB);

			return deferred.promise();
		};

		return module;

	}(EC.Delete));
