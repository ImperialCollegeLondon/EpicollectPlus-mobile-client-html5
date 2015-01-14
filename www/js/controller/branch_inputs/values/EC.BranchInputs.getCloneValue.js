/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.getCloneValue = function(the_type) {

			var type = the_type;
			var clone_value;

			switch(type) {

				case EC.Const.TEXT:
					clone_value = $('div.clone input#branch-text-clone').val();
					break;

				case EC.Const.TEXTAREA:
					clone_value = $('div.clone textarea#branch-textarea-clone').val();
					break;

				case EC.Const.INTEGER:
					clone_value = $('div.clone input#branch-integer-clone').val();
					break;

				case EC.Const.DECIMAL:
					clone_value = $('div.clone input#branch-decimal-clone').val();
					break;

				case EC.Const.BARCODE:
					clone_value = $('div#branch-input-barcode div.clone input#scan-result-confirm').val();
					break;

			}//switch

			return clone_value.trim();

		};
		//getCloneValue

		return module;

	}(EC.BranchInputs)); 