/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
    @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.pushInputsTrail = function(the_input) {

			var input = the_input;

			var branch_inputs_trail;

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);

			} catch(error) {

				//Handle errors here
				branch_inputs_trail = [];

			}

			branch_inputs_trail.push({
				position : input.position,
				label : input.label

			});

			window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

		};

		return module;

	}(EC.BranchInputs));
