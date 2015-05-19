/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var projects = [];
		var deferred;

		var _getProjectsSuccessCB = function() {
			console.log(EC.Const.TRANSACTION_SUCCESS);
		};

		var _getProjectsTX = function(tx) {

			var query = 'SELECT _id, name, total_hierarchy_forms, total_branch_forms FROM ec_projects ORDER BY name';
			tx.executeSql(query, [], _getProjectsSQLSuccess, EC.Select.errorCB);
		};

		var _getProjectsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				projects.push(the_result.rows.item(i));
			}

			deferred.resolve(projects);
		};

		module.getProjects = function() {

			deferred = new $.Deferred();
			//clear projects array
			projects.length = 0;

			EC.db.transaction(_getProjectsTX, EC.Select.errorCB, _getProjectsSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
