/*jslint vars: true , nomen: true devel: true, plusplus: true*/
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
			var hierarchy_query = 'SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1';

			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.PHOTO, 1, 0, ""], _getOneImageSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.AUDIO, 1, 0, ""], _getOneAudioSQLSuccess, EC.Select.errorCB);
			tx.executeSql(hierarchy_query, [project_id, 1, EC.Const.VIDEO, 1, 0, ""], _getOneVideoSQLSuccess, EC.Select.errorCB);

			EC.Select.query_error_message = "EC.SelectgetOneHierarchyMediaPerType() _getOneHierarchyMediaPerTypeTX";
		};

		var _getOneImageSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_image = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy images found, try branches??
			}

		};

		var _getOneAudioSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_audio = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy audio found, try branches??
			}
		};

		var _getOneVideoSQLSuccess = function(the_tx, the_result) {

			//check if have a row
			if (the_result.rows.length > 0) {
				hierarchy_video = the_result.rows.item(0);
			} else {
				//TODO: no hierarchy video found, try branches??
			}
		};

		var _getOneHierarchyMediaPerTypeSuccessCB = function() {
			//resolve object with only files from hierarchy entries (if any)
			deferred.resolve(hierarchy_image, hierarchy_audio, hierarchy_video);
		};

		module.getOneHierarchyMediaPerType = function(the_project_id) {

			project_id = the_project_id;
			hierarchy_image = null;
			hierarchy_audio = null;
			hierarchy_video = null;
			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaPerTypeTX, EC.Select.errorCB, _getOneHierarchyMediaPerTypeSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();
		};

		return module;

	}(EC.Select));
