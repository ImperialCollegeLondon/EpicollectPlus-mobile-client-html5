/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function() {"use strict";

		//callback for a transaction error
		var errorCB = function(the_result,the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log("%c" + the_error.message, "color: red");
			console.log("%c" + the_result, "color: red");
		};

		return {
			errorCB : errorCB
		};

	}());
