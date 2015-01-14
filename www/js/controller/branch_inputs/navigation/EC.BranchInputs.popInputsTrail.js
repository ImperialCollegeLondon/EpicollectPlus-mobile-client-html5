/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.popInputsTrail = function() {

			var branch_inputs_trail;

			try {

				branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);

				branch_inputs_trail.pop();

				window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

			} catch(error) {
			}

		};
		//popInputsTrail

		return module;

	}(EC.BranchInputs));
