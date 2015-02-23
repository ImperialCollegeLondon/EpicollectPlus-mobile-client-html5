/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var project_id;
		var mapped_branch_inputs;
		var deferred;

		var _getBranchInputsLocalIDsTX = function(tx) {

			var query = "SELECT ec_branch_inputs._id, ec_branch_inputs.ref FROM ec_branch_inputs JOIN ec_branch_forms ON ec_branch_forms._id=ec_branch_inputs.form_id WHERE ec_branch_forms.project_id=?";

			tx.executeSql(query, [project_id], _getBranchInputsLocalIDsSQLSuccess, EC.Select.errorCB);

		};

		var _getBranchInputsLocalIDsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {

				//map form names against _id
				mapped_branch_inputs.push({
					_id : the_result.rows.item(i)._id,
					ref : the_result.rows.item(i).ref
				});
			}

		};

		var _getBranchInputsLocalIDsSuccessCB = function() {

			//return mappped branch forms
			deferred.resolve(mapped_branch_inputs);

		};

		module.getBranchInputsLocalIDs = function(the_project_id) {

			project_id = the_project_id;

			deferred = new $.Deferred();
			mapped_branch_inputs = [];

			EC.db.transaction(_getBranchInputsLocalIDsTX, EC.Select.errorCB, _getBranchInputsLocalIDsSuccessCB);

			// return promise
			return deferred.promise();

		};

		return module;

	}(EC.Select));
