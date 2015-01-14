/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Branch
 *
 *  It will save the project branches data structure (branch_forms, branch_inputs, branch_input_values)
 to the database
 *
 */

var EC = EC || {};
EC.Branch = EC.Branch || {};
EC.Branch = ( function() {"use strict";

		//callback for a transaction error
		var errorCB = function(the_error) {

			console.log("Error INSERT STRUCTURE BRANCH");
			console.log(the_error);
			console.log(EC.Utils.TRANSACTION_ERROR);

		};

		return {
			errorCB : errorCB
		};

	}());
