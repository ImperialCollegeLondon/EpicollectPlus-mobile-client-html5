/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/**
 *
 * @module EC
 * @submodule Inputs
 *
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		//getCurrentValue
		module.getCloneValue = function(the_type) {

			var type = the_type;
			var test;
			var value;

			switch(type) {

				case EC.Const.TEXT:
					value = $('div.clone input#text-clone').val();
					break;
				case EC.Const.TEXTAREA:
					value = $('div.clone textarea#textarea-clone').val();
					break;
				case EC.Const.INTEGER:
					value = $('div.clone input#integer-clone').val();
					break;
				case EC.Const.DECIMAL:
					value = $('div.clone input#decimal-clone').val();
					break;
				case EC.Const.BARCODE:
					value = $('div.clone input#scan-result-confirm').val();
					break;
			}

			return value;
		};

		return module;

	}(EC.Inputs));
