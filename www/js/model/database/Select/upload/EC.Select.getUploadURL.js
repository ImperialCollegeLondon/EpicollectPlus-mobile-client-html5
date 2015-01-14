/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var deferred;
		var upload_URL;

		var _getProjectURLTX = function(tx) {

			var query = "SELECT uploadToServer FROM ec_projects WHERE _id=?";

			tx.executeSql(query, [project_id], getProjectURLSQLSuccess, EC.Select.txErrorCB);

		};

		var getProjectURLSQLSuccess = function(the_tx, the_result) {

			var result = the_result;
			upload_URL = result.rows.item(0).uploadToServer;

		};

		var _getProjectURLSuccessCB = function() {

			EC.Upload.setUploadURL(upload_URL);
			deferred.resolve(upload_URL);

		};

		module.getUploadURL = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getProjectURLTX, EC.Select.txErrorCB, _getProjectURLSuccessCB);

			// return promise when upload url is found
			return deferred.promise();

		};

		return module;

	}(EC.Select));
