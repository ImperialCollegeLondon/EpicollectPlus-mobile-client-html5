/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function() {"use strict";

		var query_error_message = "";

		//callback for a transaction error
		var txErrorCB = function(the_tx, the_error) {

			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(EC.Select.query_error_message);
			console.log(the_error);
			console.log(the_tx);

			EC.Select.query_error_message = "";

		};

		return {

			txErrorCB : txErrorCB,
			query_error_message : query_error_message

		};

	}());
