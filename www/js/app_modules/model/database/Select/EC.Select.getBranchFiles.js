/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var hierarchy_entry_key;
		var deferred;
		var files;

		var _errorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_error);
		};

		var _selectBranchFilesSQLSuccessCB = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				files.push(the_result.rows.item(i));
			}
		};

		var _getBranchFilesTX = function(tx) {

			var select_branch_files_query = 'SELECT value, type from ec_branch_data WHERE hierarchy_entry_key_value=? AND (type=? OR type=? OR type=?) AND value <>?';
			//get all file names and types
			tx.executeSql(select_branch_files_query, [hierarchy_entry_key, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectBranchFilesSQLSuccessCB, _errorCB);
		};

		var _getBranchFilesSuccessCB = function() {

			console.log("Branch files: ****************************************");
			console.log("Branch files:" + JSON.stringify(files));

			deferred.resolve(files);
		};

		//get all the media files for all the branch entries attached to a hierarchy entry
		module.getBranchFiles = function(the_hierarchy_entry_key) {

			deferred = new $.Deferred();
			hierarchy_entry_key = the_hierarchy_entry_key;
			files = [];

			EC.db.transaction(_getBranchFilesTX, _errorCB, _getBranchFilesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
