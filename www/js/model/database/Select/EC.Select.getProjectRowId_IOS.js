/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_name;
		var project_id;
		var deferred;

		var _getProjectRowIdSuccessCB = function() {
			deferred.resolve(project_id);
		};

		var _getProjectRowIdSQLSuccess = function(the_tx, the_result) {

			project_id = the_result.rows.item(0)._id;

		};

		var _getProjectRowIdTX = function(tx) {

			var query = 'SELECT _id FROM ec_projects WHERE name=?';
			tx.executeSql(query, [project_name], _getProjectRowIdSQLSuccess, EC.Select.txErrorCB);
		};

		module.getProjectRowId = function(the_project_name) {

			deferred = new $.Deferred();
			project_name = the_project_name;

			EC.db.transaction(_getProjectRowIdTX, EC.Select.txErrorCB, _getProjectRowIdSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
