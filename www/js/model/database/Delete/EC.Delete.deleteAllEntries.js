/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function(module) {"use strict";

		var forms = [];
		var action = "";
		var project_name;
		var has_branches;
		var deferred;
		var project_id;

		var _deleteAllEntriesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var delete_branches_query;
			var delete_query = "DELETE FROM ec_data WHERE form_id=?";
			var update_count_query = "UPDATE ec_forms SET entries=? WHERE _id=?";

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(delete_query, [forms[i]._id], _deleteAllEntriesSQLSuccessCB, _deleteAllEntriesErrorCB);
				tx.executeSql(update_count_query, [0, forms[i]._id]);
			}

			if (has_branches) {
				delete_branches_query = "DELETE FROM ec_branch_data WHERE form_id IN (SELECT _id FROM ec_branch_forms WHERE project_id=?)";
				tx.executeSql(delete_branches_query, [project_id], _deleteAllEntriesSQLSuccessCB, _deleteAllEntriesErrorCB);
			}

		};

		var _deleteAllEntriesSuccessCB = function() {

			var forms = JSON.parse(window.localStorage.forms);
			var i;
			var iLength;

			switch(action) {

				case EC.Const.RESTORE:
				//delete media files (if any) 
					$.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function() {
						deferred.resolve(forms);
					});
					
					break;
				case EC.Const.DELETE:

					//update entries count in forms array in localStorage
					iLength = forms.length;
					for ( i = 0; i < iLength; i++) {
						forms[i].entries = 0;
					}
					window.localStorage.forms = JSON.stringify(forms);

					//delete media files (if any) 
					$.when(EC.File.deleteAllMedia(project_name, false, [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR])).then(function() {
						deferred.resolve();
					});

					break;
			}

		};

		var _deleteAllEntriesErrorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		var _deleteAllEntriesSQLSuccessCB = function(the_tx, the_result) {

			console.log(the_result);
		};

		module.deleteAllEntries = function(the_action, the_project_name) {

			forms = JSON.parse(window.localStorage.forms);
			project_id = parseInt(window.localStorage.project_id, 10);
			action = the_action;
			project_name = the_project_name;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_deleteAllEntriesTX, _deleteAllEntriesErrorCB, _deleteAllEntriesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Delete));
