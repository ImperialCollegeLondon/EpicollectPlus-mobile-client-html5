/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.pushInputsTrail = function(the_input) {

			var input = the_input;

			var inputs_trail;

			//catch Chrome error `Uncaught SyntaxError: Unexpected end of input` when parsing empty content
			try {
				inputs_trail = JSON.parse(window.localStorage.inputs_trail);

			} catch(error) {

				//Handle errors here
				inputs_trail = [];

			}

			inputs_trail.push({
				position : input.position,
				label : input.label

			});

			window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

		};
		//pushInputsTrail
		return module;

	}(EC.Inputs));
