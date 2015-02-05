/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var form;
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

			var select_branch_files_query = 'SELECT value, type from ec_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value <>?';

			//get all file names and types
			tx.executeSql(select_branch_files_query, [form._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _selectBranchFilesSQLSuccessCB, _errorCB);
		};
		
		var _getBranchFilesSuccessCB = function(){
			
			console.log("Branch files: ****************************************");
			console.log("files:" + JSON.stringify(files));
			
			deferred.resolve(files);
		};
		
		//get all the media files for all the branch entries attached to a hierarchy entry
		module.getBranchFiles = function(the_form) {

			deferred = new $.Deferred();
			form = the_form;
			files =[];

			EC.db.transaction(_getBranchFilesTX, _errorCB, _getBranchFilesSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Select));
