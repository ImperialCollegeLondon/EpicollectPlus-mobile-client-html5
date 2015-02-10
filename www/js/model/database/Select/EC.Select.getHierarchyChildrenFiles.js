/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * Get all the media files for a single hierarchy entry passing form ID and entry
 * key
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form;
		var deferred;
		var files;
		var entries;

		var _getHierarchyChildrenFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchyChildrenFilesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = 'SELECT value, type from ec_data WHERE form_id=? AND entry_key=? AND (type=? OR type=? OR type=?) AND value <>?';

			for ( i = 0; i < iLength; i++) {
				//get all file names and types
				tx.executeSql(query, [form._id, entries[i].entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getHierarchyChildrenFilesSQLSuccessCB, self.errorCB);
			}

		};

		var _getHierarchyChildrenFilesSuccessCB = function() {

			console.log("Hierarchy files: ****************************************");
			console.log("files:" + JSON.stringify(files));

			deferred.resolve(files);
		};

		module.getHierarchyChildrenFiles = function(the_form) {

			self = this;
			deferred = new $.Deferred();
			form = the_form;
			files = [];
			entries = EC.Delete.deletion_entries;

			EC.db.transaction(_getHierarchyChildrenFilesTX, self.errorCB, _getHierarchyChildrenFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
