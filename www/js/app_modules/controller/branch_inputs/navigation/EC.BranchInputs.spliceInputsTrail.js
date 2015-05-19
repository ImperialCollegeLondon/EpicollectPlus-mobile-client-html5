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

		module.spliceInputsTrail = function(the_position) {

			var position = parseInt(the_position, 10);
			var branch_inputs_trail = JSON.parse(window.localStorage.branch_inputs_trail);
			var i;
			var iLength = branch_inputs_trail.length;
			var index;
			var how_many_to_remove;

			for ( i = 0; i < iLength; i++) {

				if (branch_inputs_trail[i].position === position) {

					index = i;
					break;
				}

			}

			how_many_to_remove = iLength - index;
			branch_inputs_trail.splice(index, how_many_to_remove);
			window.localStorage.branch_inputs_trail = JSON.stringify(branch_inputs_trail);

		};

		return module;

	}(EC.BranchInputs));
