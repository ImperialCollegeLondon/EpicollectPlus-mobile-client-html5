/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function() {"use strict";

		
		//callback for a transaction error
		var errorCB = function(the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log("%c" + the_error.message, "color: red");
		};

		return {
			errorCB : errorCB
		};

	}());
