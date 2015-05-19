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

		module.getMainFormCurrentKeyValue = function(the_position) {

			var index = the_position - 1;
			var values = JSON.parse(window.localStorage.inputs_values);

			return values[index].value;

		};

		return module;

	}(EC.Inputs));
