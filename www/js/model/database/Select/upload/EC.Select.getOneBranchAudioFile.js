/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var media_type;
		var audio;

		var _getOneBranchAudioFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, EC.Const.AUDIO, 1, 0, ""], getOneBranchAudioFileSQLSuccess, EC.Select.txErrorCB);

		};

		var getOneBranchAudioFileSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				audio = the_result.rows.item(0);
			}

		};

		var _getOneBranchAudioFileSuccessCB = function() {

			if (audio) {
				deferred.resolve(audio);
			} else {
				deferred.reject();
			}

		};
		
		/* Get an audio file to upload, data needs to be synced and media unsynced
		 */
		module.getOneBranchAudioFile = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();
			audio =null;

			EC.db.transaction(_getOneBranchAudioFileTX, EC.Select.txErrorCB, _getOneBranchAudioFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));
