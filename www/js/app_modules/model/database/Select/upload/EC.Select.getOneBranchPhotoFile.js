/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var image;

		var _getOneBranchPhotoFileTX = function(tx) {

			var query = "SELECT * FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, EC.Const.PHOTO, 1, 0, ""], getOneBranchPhotoFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneBranchPhotoFileSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				image = the_result.rows.item(0);
			}

		};

		var _getOneBranchPhotoFileSuccessCB = function() {

			if (image) {
				console.log(image);
				deferred.resolve(image);
			} else {
				deferred.reject();
			}

		};

		module.getOneBranchPhotoFile = function(the_project_id) {

			project_id = the_project_id;
			image = null;
			deferred = new $.Deferred();

			EC.db.transaction(_getOneBranchPhotoFileTX, EC.Select.errorCB, _getOneBranchPhotoFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));
