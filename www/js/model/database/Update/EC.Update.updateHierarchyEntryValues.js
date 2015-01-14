/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/**
 * Update a hierarchy entry in database; each value is a row in the table ec_data like:
 *
 * "input_id": 15,
 "form_id": 1,
 "position": 4,
 "parent": "Imperial College",
 "value": "Mirko is great",
 "is_title": 0,
 "entry_key": "Biology",
 "type": "textarea",
 "is_synced": 0
 *
 */

var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {"use strict";

		var self;
		var form_values;
		var form_id;
		var deferred;

		var _updateHierarchyEntryValuesSQLSuccessCB = function() {
			console.log("FORM VALUE EDITED SQL QUERY SUCCESS");
		};

		var _updateHierarchyEntryValuesTX = function(tx) {

			var i;
			var iLength = form_values.length;
			var query = 'UPDATE ec_data SET value=? WHERE _id=?';
			var obj;

			for ( i = 0; i < iLength; i++) {

				obj = form_values[i];
				//convert array to csv value (for checkboxes when multiple values are selected)
				if (Object.prototype.toString.call(obj.value) === '[object Array]') {
					obj.value = obj.value.join(', ');
				}
				tx.executeSql(query, [obj.value, obj._id], _updateHierarchyEntryValuesSQLSuccessCB, _errorCB);
			}
		};

		var _updateHierarchyEntryValuesSuccessCB = function() {
			console.log("FORM VALUES UPDATED SUCCESSFULLY");
			deferred.resolve();
		};

		var _errorCB = function(the_tx, the_result) {
			console.log(the_result);
			deferred.reject();
		};

		module.updateHierarchyEntryValues = function(the_form_values) {

			self = this;
			deferred = new $.Deferred();
			form_values = the_form_values;
			form_id = form_values[0].form_id;

			EC.db.transaction(_updateHierarchyEntryValuesTX, _errorCB, _updateHierarchyEntryValuesSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Update));
