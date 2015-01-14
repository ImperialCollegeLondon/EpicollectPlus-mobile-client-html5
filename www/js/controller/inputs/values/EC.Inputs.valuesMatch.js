/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule EC.Inputs
 */
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {"use strict";

		/**
		 * @method valuesMatch
		 */
		module.valuesMatch = function(the_cached_value, the_current_value, the_input_type) {

			var cached_value = the_cached_value;
			var current_value = the_current_value;
			var type = the_input_type;
			var is_matching = false;
			var i;
			var j;
			var iLength;
			var jLength;
			var matches_count = 0;

			switch(type) {

				case EC.Const.DROPDOWN:

					if (current_value.label === cached_value.value) {
						is_matching = true;
					}
					break;
				case EC.Const.RADIO:

					if (current_value.label === cached_value.value) {
						is_matching = true;
					}
					break;
				case EC.Const.CHECKBOX:

					//check if ALL the checkbox values match. A single difference might trigger a different jump
					iLength = current_value.length;
					jLength = cached_value.value.length;

					if (iLength === jLength) {

						for ( i = 0; i < iLength; i++) {
							for ( j = 0; j < jLength; j++) {
								if (current_value[i].label.trim() === cached_value.value[j].trim()) {
									matches_count++;
								}
							}
						}

						if (matches_count === iLength) {
							is_matching = true;
						}
					}
					break;
				// case EC.Const.LOCATION:
				// //TODO: handle location
				// break;
				default:
					if (cached_value === current_value) {
						is_matching = true;
					}
			}
			return is_matching;

		};

		return module;

	}(EC.Inputs));
