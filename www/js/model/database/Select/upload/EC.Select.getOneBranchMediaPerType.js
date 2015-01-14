/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var forms = [];
		var hierarchy_image;
		var hierarchy_audio;
		var hierarchy_video;
		var branch_images = [];
		var branch_audios = [];
		var branch_videos = [];
		var image;
		var audio;
		var video;
		var deferred;

		var _getOneHierarchyMediaPerTypeTX = function(tx) {

			var i;
			var iLength = forms.length;
			var photo = EC.Const.PHOTO;
			var audio = EC.Const.AUDIO;
			var video = EC.Const.VIDEO;

			// branch_images.length = 0;
			// branch_audios.length = 0;
			// branch_videos.length = 0;

			var hierarchy_query = 'SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			//var branch_query = 'SELECT _id, value, type FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=? AND has_media=?) AND (type=? OR type=? OR type=?) AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			tx.executeSql(hierarchy_query, [project_id, 1, photo, 1, 0, ""], _getOneImageSQLSuccess, EC.Select.txErrorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, audio, 1, 0, ""], _getOneAudioSQLSuccess, EC.Select.txErrorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, video, 1, 0, ""], _getOneVideoSQLSuccess, EC.Select.txErrorCB);

			//tx.executeSql(branch_query, [project_id, 1, photo, video, audio, 1, 0, ""], _getBranchMediaSQLSuccess, EC.Select.txErrorCB);

			EC.Select.query_error_message = "EC.SelectgetOneHierarchyMediaPerType() _getOneHierarchyMediaPerTypeTX";
		};

		var _getOneImageSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				image = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy images found, try branches??
			}

		};
		var _getOneAudioSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				audio = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy audio found, try branches??
			}

		};
		var _getOneVideoSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {

				video = the_result.rows.item(0);

			} else {

				//TODO: no hierarchy video found, try branches??
			}

		};

		var _getOneHierarchyMediaPerTypeSuccessCB = function() {

			//resolve object with only files from hierarchy entries (if any)
			deferred.resolve(image, audio, video);

		};

		module.getOneHierarchyMediaPerType = function(the_project_id) {

			project_id = the_project_id;

			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaPerTypeTX, EC.Select.txErrorCB, _getOneHierarchyMediaPerTypeSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();
		};

		return module;

	}(EC.Select));
