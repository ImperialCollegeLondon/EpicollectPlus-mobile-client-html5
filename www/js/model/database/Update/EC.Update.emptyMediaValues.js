/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var forms;
		var project_id;
		var has_branches;
		var deferred;

		var _emptyMediaValuesTX = function(tx) {

			var i;
			var iLength = forms.length;
			var query = "UPDATE ec_data SET value=? WHERE form_id=? AND (type=? OR type=? OR type=?)";
			var branch_query = "";

			for ( i = 0; i < iLength; i++) {

				tx.executeSql(query, ["", forms[i]._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _emptyMediaValuesSQLSuccessCB, _emptyMediaValuesErrorCB);

			}//for

			if (has_branches) {

				//apparently SQLite does not support JOIN in UPDATE, so JOIN on SELECT
				branch_query = "UPDATE ec_branch_data SET value=? WHERE form_id IN (SELECT form_id FROM ec_branch_data JOIN ec_branch_forms WHERE ec_branch_data.form_id = ec_branch_forms._id AND ec_branch_forms.project_id=?) AND (type=? OR type=? OR type=?)";

				tx.executeSql(branch_query, ["", project_id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO], _emptyBranchMediaValuesSQLSuccessCB, _emptyMediaValuesErrorCB);
			}

		};

		var _emptyMediaValuesSQLSuccessCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		var _emptyBranchMediaValuesSQLSuccessCB = function(the_tx, the_result) {
			console.log(the_result);
		};

		var _emptyMediaValuesSuccessCB = function() {
			deferred.resolve();
		};

		var _emptyMediaValuesErrorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(the_tx, the_error);
			deferred.reject();
		};

		module.emptyMediaValues = function(the_hierarchy_forms, the_project_id) {

			forms = the_hierarchy_forms;
			project_id = the_project_id;
			has_branches = EC.Utils.projectHasBranches();
			deferred = new $.Deferred();

			EC.db.transaction(_emptyMediaValuesTX, _emptyMediaValuesErrorCB, _emptyMediaValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
