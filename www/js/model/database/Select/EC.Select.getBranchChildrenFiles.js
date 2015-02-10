/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * @method getBranchChildrenFiles 
 * 
 * get all the media files for all the branch
 * entries attached to a child entry and return the array with the file details
 * 
 * {value: <the_filename>, tyope: <the_media_type>}
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var deferred;
		var entries;
		var files;

		var _getBranchChildrenFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchChildrenFilesTX = function(tx) {

			var i;
			var iLength = entries.length;
			var query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
			for ( i = 0; i < iLength; i++) {
				//get all file names and types
				tx.executeSql(query, [entries[i].entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchChildrenFilesSQLSuccessCB, self.errorCB);
			}
		};

		var _getBranchChildrenFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		module.getBranchChildrenFiles = function() {

			self = this;
			deferred = new $.Deferred();
			entries = EC.Delete.deletion_entries;
			files = [];

			EC.db.transaction(_getBranchChildrenFilesTX, self.errorCB, _getBranchChildrenFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
