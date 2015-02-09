/*jslint vars: true, nomen: true, plusplus: true*/
/**
 * @module EC
 * @submodule GetData
 */

var EC = EC || {};

EC.Select = ( function(module) {

		var project_id;
		var allow_download_edits;
		var deferred;

		var _getADEFlagTX = function(tx) {

			var query = 'SELECT allowDownloadEdits FROM ec_projects WHERE _id=?';

			tx.executeSql(query, [project_id], _getADEFlagSQLSuccess, EC.Select.errorCB);
		};

		var _getADEFlagSQLSuccess = function(the_tx, the_result) {
			allow_download_edits = the_result.rows.item(0).allowDownloadEdits;
		};

		var _getADEFlagTXSuccessCB = function() {

			if (allow_download_edits === "false") {
				deferred.reject();
			} else {
				deferred.resolve();
			}
		};

		/**
		 * @method getAllowDownloadEdits Fetch the AllowDownloadEdits flag for the selected project and set it in localStorage
		 * @param {int} the_project_id  The project id
		 */
		module.getAllowDownloadEdits = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getADEFlagTX, EC.Select.errorCB, _getADEFlagTXSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
