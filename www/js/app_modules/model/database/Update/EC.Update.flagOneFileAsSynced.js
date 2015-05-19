/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid: true*/
/*global $, jQuery*/

/*
 * Set a single row is_media_synced value to 1 to indicate file has been synced to the server 
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var row_id;
		var is_branch_file;
		var deferred;

		var _flagOneFileAsSyncedTX = function(tx) {

			var table = (is_branch_file) ? "ec_branch_data" : "ec_data";
			var query = 'UPDATE ' + table + ' SET is_media_synced=? WHERE _id=?';

			tx.executeSql(query, [1, row_id], null, EC.Update.errorCB);
		};

		var _flagOneFileAsSyncedSuccessCB = function() {
			deferred.resolve();
		};

		//flag a single media row as synced on the local DB (for photo, video, audio)
		module.flagOneFileAsSynced = function(the_row_id, the_is_branch_file_flag) {

			row_id = the_row_id;
			is_branch_file = the_is_branch_file_flag;
			deferred = new $.Deferred();

			EC.db.transaction(_flagOneFileAsSyncedTX, EC.Update.errorCB, _flagOneFileAsSyncedSuccessCB);

			return deferred.promise();
		};

		return module;
	}(EC.Update));
