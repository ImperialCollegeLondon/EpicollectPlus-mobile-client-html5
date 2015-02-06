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
		
		var deletion_counters =[];
		var deletion_entries =[];
		var deletion_hierarchy_files =[];
		var deletion_branch_files =[];

		//callback for a transaction error
		var errorCB = function(the_error) {
			console.log(EC.Const.TRANSACTION_ERROR);
			console.log("%c" + the_error.message, "color: red");
		};

		return {
			errorCB : errorCB,
			deletion_counters: deletion_counters,
			deletion_entries: deletion_entries,
			deletion_hierarchy_files: deletion_hierarchy_files
		};
	}());
