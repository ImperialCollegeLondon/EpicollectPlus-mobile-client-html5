/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		module.spliceInputsTrail = function(the_position) {

			var position = parseInt(the_position, 10);
			var inputs_trail = JSON.parse(window.localStorage.inputs_trail);
			var i;
			var iLength = inputs_trail.length;
			var index;
			var how_many_to_remove;

			for ( i = 0; i < iLength; i++) {

				if (parseInt(inputs_trail[i].position, 10) === position) {

					index = i;
					break;
				}

			}

			how_many_to_remove = iLength - index;
			inputs_trail.splice(index, how_many_to_remove);
			window.localStorage.inputs_trail = JSON.stringify(inputs_trail);

		};

		//spliceInputsTrail
		return module;

	}(EC.Inputs));
