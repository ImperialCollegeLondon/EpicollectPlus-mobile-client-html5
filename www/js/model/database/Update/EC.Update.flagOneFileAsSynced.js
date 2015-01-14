/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var row_id;
		var deferred;

		var _flagOneFileAsSyncedTX = function(tx) {

			console.log("row_id: " + row_id, false);

			var query = 'UPDATE ec_data SET is_media_synced=? WHERE _id=?';

			tx.executeSql(query, [1, row_id], _flagOneFileAsSyncedSQLSuccess, EC.Update.txErrorCB);

		};

		

		var _flagOneFileAsSyncedSQLSuccess = function(the_tx, the_result) {

			console.log("_onflagOneFileAsSyncededSQLSuccess", false);
			console.log(the_result.rowsAffected, false);

		};

		var _flagOneFileAsSyncedSuccessCB = function() {

			deferred.resolve();

		};

		//flag a single media row as synced on the local DB (for photo, video, audio)
		module.flagOneFileAsSynceded = function(the_row_id) {

			row_id = the_row_id;

			deferred = new $.Deferred();

			EC.db.transaction(_flagOneFileAsSyncedTX, EC.Update.txErrorCB, _flagOneFileAsSyncedSuccessCB);
			
			// return promise to upload next file
			return deferred.promise();
		};

		return module;

	}(EC.Update));
