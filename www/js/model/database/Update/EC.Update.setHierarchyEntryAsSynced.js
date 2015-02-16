/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";

		var rows_to_sync;
		var deferred;
		var self;

		var _updateDataSyncedFlagTX = function(tx) {

			var i;
			var iLength = rows_to_sync.length;
			var query;

			for ( i = 0; i < iLength; i++) {

				/* If the row is NOT a media entry, set both is_data_synced AND is_media_synced
				 * to 1
				 *
				 * If the row is a media entry, i.e. of type audio, photo or video, AND its value
				 * is NOT an empty string, itmeans there is a file to upload so set
				 * _is_data_synced to 1 but keep is_media_sync to 0, as we need to upload and
				 * sync files separately.
				 */

				query = 'UPDATE ec_data SET is_data_synced=? WHERE _id=?';
				tx.executeSql(query, [1, rows_to_sync[i]._id], null, self.errorCB);
				//set error message if query fails
				self.query_error_message = "Error -> EC.Update.setHierarchyEntryAsSynced";

			}

		};

		var _updateDataSyncedFlagSuccessCB = function() {

			console.log("UPDATE HIERARCHY DATA SYNCED FLAG TRANSACTION SUCCESS");
			deferred.resolve();

		};

		module.setHierarchyEntryAsSynced = function(the_hierarchy_rows_to_sync) {

			self = this;
			rows_to_sync = the_hierarchy_rows_to_sync;
			deferred = new $.Deferred();

			EC.db.transaction(_updateDataSyncedFlagTX, self.errorCB, _updateDataSyncedFlagSuccessCB);

			// return promise so that outside code cannot reject/resolve the deferred
			return deferred.promise();

		};

		return module;

	}(EC.Update));
