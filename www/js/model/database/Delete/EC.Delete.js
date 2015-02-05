/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Delete = EC.Delete || {};
EC.Delete = ( function() {
		"use strict";

		//callback for a transaction error
		var errorCB = function(the_tx, the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log(JSON.stringify(the_error));
			console.log(JSON.stringify(the_tx));
		};

		return {
			errorCB : errorCB
		};
	}());
