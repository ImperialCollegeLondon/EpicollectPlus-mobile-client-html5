/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function() {"use strict";

		var query_error_message = "";

		//callback for a transaction error
		var txErrorCB = function(the_tx, the_error) {

			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(EC.Delete.query_error_message);
			console.log(JSON.stringify(the_error));
			console.log(JSON.stringify(the_tx));

			EC.Delete.query_error_message = "";

		};

		return {

			txErrorCB : txErrorCB,
			query_error_message : query_error_message

		};
	}());
