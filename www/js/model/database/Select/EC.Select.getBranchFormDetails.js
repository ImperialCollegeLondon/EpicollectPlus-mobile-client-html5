/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var value;
		var input;
		var project_id;
		var entry_key;
		var entry_keys = [];
		var branch_form;
		var deferred;

		var _getBranchFormDetailsTX = function(tx) {

			var query = "SELECT _id, project_id, name,num, key, total_inputs, has_media, is_genkey_hidden, entries FROM ec_branch_forms WHERE name=? AND project_id=?";

			tx.executeSql(query, [branch_form_name, project_id], _getBranchFormDetailsSQLSuccess, EC.Select.txErrorCB);

		};

		var _getBranchFormDetailsSQLSuccess = function(the_tx, the_result) {

			branch_form = the_result.rows.item(0);

		};

		var _getBranchFormDetailsSuccessCB = function() {

			//return branch form details
			deferred.resolve(branch_form);

		};

		module.getBranchFormDetails = function(the_input, the_value, the_project_id) {

			input = the_input;
			value = the_value;
			branch_form_name = input.branch_form_name;
			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormDetailsTX, EC.Select.txErrorCB, _getBranchFormDetailsSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));
