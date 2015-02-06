/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function() {"use strict";

		var query_error_message = "";

		//callback for a transaction error
		var txErrorCB = function(the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log("%c" + the_error.message, "color: red");
		};

		return {
			txErrorCB : txErrorCB,
			query_error_message : query_error_message
		};

	}());
