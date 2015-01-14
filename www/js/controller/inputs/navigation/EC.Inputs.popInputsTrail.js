/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.popInputsTrail = function() {

			var inputs_trail;

			try {

				inputs_trail = JSON.parse(window.localStorage.inputs_trail);

				inputs_trail.pop();

				window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

			} catch(error) {
			}

		};
		//popInputsTrail
		return module;

	}(EC.Inputs));
