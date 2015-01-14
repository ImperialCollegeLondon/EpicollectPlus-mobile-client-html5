/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function() {"use strict";

		var form_values = [];
		var rows_to_unsync = [];
		var form_id;
		var self;

		//error message for a transaction error
		var query_error_message = "";

		/*
		 * callback for a transaction error
		 * Important: the call to EC.Update.query_error_message is explicit using method invocation as "this" will refers to the windows object (this.query_error_message will not work)
		 * That is because the function is called internally by Phonegap and probably NOT using method invocation
		 *
		 */
		function txErrorCB(the_tx, the_error) {

			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(EC.Update.query_error_message);
			console.log(the_error);
			console.log(the_tx);

			//reset error message
			EC.Update.query_error_message = "";

		}

		return {

			txErrorCB : txErrorCB,
			query_error_message : query_error_message

		};

	}());
