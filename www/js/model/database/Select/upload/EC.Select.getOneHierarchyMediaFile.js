/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var media_type;
		var file;

		var _getOneHierarchyMediaFileTX = function(tx) {

			var query = "SELECT _id, value, type FROM ec_data WHERE form_id IN (SELECT _id FROM ec_forms WHERE project_id=? AND has_media=?) AND type=? AND is_data_synced=? AND is_media_synced=? AND value<>? LIMIT 1";

			tx.executeSql(query, [project_id, 1, media_type, 1, 0, ""], getOneHierarchyMediaFileSQLSuccess, EC.Select.errorCB);

		};

		var getOneHierarchyMediaFileSQLSuccess = function(the_tx, the_result) {

			file = the_result.rows.item(0);

		};

		var _getOneHierarchyMediaFileSuccessCB = function() {

			if (file) {
				deferred.resolve(file);
			} else {
				console.log("reject video upload");
				deferred.reject();
			}

		};

		module.getOneHierarchyMediaFile = function(the_project_id, the_type) {

			project_id = the_project_id;
			media_type = the_type;

			deferred = new $.Deferred();

			EC.db.transaction(_getOneHierarchyMediaFileTX, EC.Select.errorCB, _getOneHierarchyMediaFileSuccessCB);

			// return promise to update ui when entry has/has not been found
			return deferred.promise();

		};

		return module;

	}(EC.Select));
