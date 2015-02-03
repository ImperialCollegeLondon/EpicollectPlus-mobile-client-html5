/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var branch_forms;
		var project_id;
		var deferred;

		var _getBranchFormsSuccessCB = function() {
			deferred.resolve(branch_forms);
		};

		var _getBranchFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				branch_forms.push(the_result.rows.item(i));
			}
		};

		var _getBranchFormsTX = function(tx) {
			var query = 'SELECT _id, name, key, num, has_media, is_genkey_hidden, total_inputs, entries FROM ec_branch_forms WHERE project_id=?';
			tx.executeSql(query, [project_id], _getBranchFormsSQLSuccess, EC.Select.txErrorCB);
		};

		module.getBranchForms = function(the_project_id) {

			project_id = the_project_id;
			branch_forms =[];
			deferred = new $.Deferred();

			EC.db.transaction(_getBranchFormsTX, EC.Select.txErrorCB, _getBranchFormsSuccessCB);

			return deferred.promise();

		};
		

		return module;

	}(EC.Select));
