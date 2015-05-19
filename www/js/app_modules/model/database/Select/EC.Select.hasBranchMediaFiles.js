/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var branch_forms_ids;
		var total_branch_media_files;
		var project_id;
		var deferred;

		var _getBranchMediaFileSuccessCB = function() {
			deferred.resolve(total_branch_media_files > 0 ? true : false);	
		};

		var _getBranchMediaFileSQLSuccess = function(the_tx, the_result) {
			total_branch_media_files += parseInt(the_result.rows.item(0).total_branch_media_files, 10);
		};

		var _getBranchMediaFileTX = function(tx) {

			var i;
			var iLength = branch_forms_ids.length;
			var query = 'SELECT COUNT(*) AS total_branch_media_files FROM ec_branch_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value<>?';

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [branch_forms_ids[i], EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _getBranchMediaFileSQLSuccess, EC.Select.errorCB);
			}

		};

		module.hasBranchMediaFiles = function(the_branch_forms_ids) {

			branch_forms_ids = the_branch_forms_ids;
			total_branch_media_files = 0;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchMediaFileTX, EC.Select.errorCB, _getBranchMediaFileSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
