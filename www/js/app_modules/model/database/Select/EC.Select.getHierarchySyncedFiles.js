/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/
/*
 * Get all the synced media files for a hierarchy form
 * 
 * files are synced when is_data_synced=? AND is_media_synced=? are both 1
 * 
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var deferred;
		var files;

		var _getHierarchySyncedFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		var _getHierarchySyncedFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getHierarchySyncedFilesTX = function(tx) {

			var query = "SELECT value, type from ec_data WHERE form_id=? AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?) AND value<>?";

			tx.executeSql(query, [form_id, 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getHierarchySyncedFilesSQLSuccessCB, self.errorCB);
		};

		module.getHierarchySyncedFiles = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			files = [];

			EC.db.transaction(_getHierarchySyncedFilesTX, self.errorCB, _getHierarchySyncedFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
