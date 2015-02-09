/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var branch_forms;
		var deferred;

		var _getBranchFormsTX = function(tx) {

			var query = "SELECT _id, name, num, key, total_inputs, has_media, is_genkey_hidden, entries FROM ec_branch_forms WHERE project_id=?";

			tx.executeSql(query, [project_id], _getBranchFormsSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				branch_forms.push(the_result.rows.item(i));

			}

		};

		var _getBranchFormsSuccessCB = function() {

			deferred.resolve(branch_forms);

		};

		module.getBranchForms = function(the_project_id) {

			project_id = the_project_id;
			branch_forms = [];
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormsTX, EC.Select.errorCB, _getBranchFormsSuccessCB);

			// return promise (with the branch_forms)
			return deferred.promise();

		};

		return module;

	}(EC.Select));
