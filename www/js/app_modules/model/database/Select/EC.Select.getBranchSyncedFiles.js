/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/* @module getBranchSyncedFiles
 * Get all the synced branch files linked to all the synced entries for a form
 *
 * @param {Array} the_hierarchy_entry_keys contains all the entry keys for synced
 * entries of a form
 */
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var hierarchy_entry_keys;
		var deferred;
		var files;

		var _getBranchSyncedFilesSuccessCB = function() {
			deferred.resolve(files);
		};

		var _getBranchSyncedFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchSyncedFilesTX = function(tx) {

			var i;
			var iLength = hierarchy_entry_keys.length;
			var query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=? AND is_media_synced=? AND (type=? OR type=? OR type=?) AND value <>?';

			for ( i = 0; i < iLength; i++) {
				//get file names and types
				tx.executeSql(query, [hierarchy_entry_keys[i], 1, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchSyncedFilesSQLSuccessCB, self.errorCB);
			}

		};

		module.getBranchSyncedFiles = function(the_hierarchy_entry_keys) {

			self = this;
			deferred = new $.Deferred();
			hierarchy_entry_keys = the_hierarchy_entry_keys;
			files = [];

			EC.db.transaction(_getBranchSyncedFilesTX, self.errorCB, _getBranchSyncedFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
