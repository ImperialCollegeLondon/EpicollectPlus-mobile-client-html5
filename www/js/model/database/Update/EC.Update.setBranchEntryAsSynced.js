/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var branch_rows_to_sync;
		var deferred;
		var self;

		var _updateDataSyncedFlagTX = function(tx) {

			var i;
			var iLength = branch_rows_to_sync.length;
			var query;
			var branch_form_name;

			for ( i = 0; i < iLength; i++) {

				query = 'UPDATE ec_branch_data SET is_data_synced=? WHERE _id=?';
				tx.executeSql(query, [1, branch_rows_to_sync[i]._id], _updateDataSyncedFlagSQLSuccess, EC.Update.errorCB);
				//set error message if query fails
				self.query_error_message = "Error -> EC.Update.setBranchEntryAsSynced";

			}

		};

		var _updateDataSyncedFlagSQLSuccess = function(the_tx, the_result) {

			console.log("UPDATE BRANCH DATA SYNCED FLAG SQL SUCCESS");

		};

		var _updateDataSyncedFlagSuccessCB = function() {

			console.log("UPDATE BRANCH DATA SYNCED FLAG TRANSACTION SUCCESS");
			deferred.resolve();

		};

		module.setBranchEntryAsSynced = function(the_branch_rows_to_sync) {
			
			//TODO: check this assignment?
			self = EC.Update;
			branch_rows_to_sync = the_branch_rows_to_sync;
			deferred = new $.Deferred();

			EC.db.transaction(_updateDataSyncedFlagTX, EC.Update.errorCB, _updateDataSyncedFlagSuccessCB);

			// return promise so that outside code cannot reject/resolve the deferred
			return deferred.promise();

		};

		return module;

	}(EC.Update));
