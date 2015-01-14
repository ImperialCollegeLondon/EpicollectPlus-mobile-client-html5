/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *   @module Hierarchy
 *
 *  It will create a project hierarchy structure (project, forms, inputs, input_values) to the database
 *
    each method will accept a single object (that can be a single or an array of objects) to be saved
 *
 */

var EC = EC || {};
EC.Hierarchy = ( function() {"use strict";

		//callback for a transaction error
		var errorCB = function(the_tx, the_result) {

			console.log(EC.Utils.TRANSACTION_ERROR);
			console.log(the_tx);
			console.log(the_result);

		};

		return {
			errorCB : errorCB
		};

	}());
