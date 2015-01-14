/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var forms;
		var input_ids = [];
		var deferred;

		module.getLocalInputIDs = function(the_forms) {

			forms = the_forms;
			deferred = new $.Deferred();

			EC.db.transaction(_getInputsIDsTX, EC.Select.txErrorCB, _getInputsIDsSuccessCB);

			return deferred.promise();

		};

		var _getInputsIDsTX = function(tx) {

			var i;
			var iLength = forms.length;
			var query = 'SELECT _id, ref FROM ec_inputs WHERE form_id=?';

			for ( i = 0; i < iLength; i++) {
				tx.executeSql(query, [forms[i]._id], _getInputsIDsSQLSuccess, EC.Select.txErrorCB);
			}

		};
		var _getInputsIDsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			for ( i = 0; i < iLength; i++) {
				input_ids.push(the_result.rows.item(i));
			}

		};

		var _getInputsIDsSuccessCB = function() {
			deferred.resolve(input_ids);
		};

		return module;

	}(EC.Select));
