/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Get all the media files for a single hierarchy entry passing form ID and entry key
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form;
		var deferred;
		var files;
		var entry_key;
		
		var _selectHierarchyFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchyFilesTX = function(tx) {

			var select_hierarchy_files_query = 'SELECT value, type from ec_data WHERE form_id=? AND entry_key=? AND (type=? OR type=? OR type=?) AND value <>?';

			//get all file names and types
			tx.executeSql(select_hierarchy_files_query, [form._id, entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectHierarchyFilesSQLSuccessCB, self.errorCB);
		};
		
		var _getHierarchyFilesSuccessCB = function(){
			
			console.log("Hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(files));
			
			deferred.resolve(files);
		};
		
		module.getHierarchyFiles = function(the_form, the_entry_key) {
			
			self = this;
			deferred = new $.Deferred();
			form = the_form;
			entry_key = the_entry_key;
			files =[];

			EC.db.transaction(_getHierarchyFilesTX, self.errorCB, _getHierarchyFilesSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
