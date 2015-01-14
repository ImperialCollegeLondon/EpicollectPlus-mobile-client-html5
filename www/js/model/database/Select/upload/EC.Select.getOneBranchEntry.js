/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var branch_form_name;
		var branch_form;
		var upload_branch_forms;
		var project_id;
		var hierarchy_entry_key_value;
		var branch_entry_values;
		var branch_entry_key;
		var branch_entry;
		var deferred;
		var self;

		/**
		 *  @method _getOneEntryKeyTX Execute a query to get a single branch entry_key based on hierarchy_entry_key_value and NOT synced
		 */
		var _getOneEntryKeyTX = function(tx) {

			var query = "";

			//select a single entry key
			query += "SELECT DISTINCT entry_key FROM ec_branch_data WHERE hierarchy_entry_key_value=? AND is_data_synced=? AND form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) LIMIT 1";

			tx.executeSql(query, [hierarchy_entry_key_value, 0, branch_form_name, project_id], _getOneEntryKeySQLSuccess, EC.Select.txErrorCB);

		};

		/**
		 *  _getOneEntryKeySQLSuccess : SQL success callback, the result will be always 1 single element containing 1 branch entry_key (or none)
		 */
		var _getOneEntryKeySQLSuccess = function(the_tx, the_result) {

			var iLength = the_result.rows.length;

			//if a entry_key is found
			if (iLength > 0) {

				branch_entry_key = the_result.rows.item(0).entry_key;
				branch_entry_values = [];

				//get all the values for the branche entry key found
				EC.db.transaction(_getOneBranchEntryTX, EC.Select.txErrorCB, _getOneBranchEntrySuccessCB);
			} else {

				//no unsynced branch entries for the current branch form, try next one (if any)
				if (EC.Upload.branch_forms.length > 0) {
					
					EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();

					self.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name, false);

				} else {

					/* NO more unsynced branch entries: show feedback
					 * check which action we were perfomorming, as the notification feedback has to be displayed only after an upload
					 */

					EC.Upload.action = (EC.Upload.action === EC.Const.BRANCH_RECURSION) ? EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD : EC.Const.START_BRANCH_UPLOAD;
					EC.Upload.renderUploadViewFeedback(true);

				}

			}

		};

		/**
		 * _getOneBranchEntryTX : Select all the rows for a single branch entry key, not synced and belonging to the main entry_key specified
		 * to enforce uniqueness, we are also adding the form_id as we might have clashes across project, so let's avoid them
		 */
		var _getOneBranchEntryTX = function(tx) {

			var query = "";
			query += 'SELECT _id, hierarchy_entry_key_ref, hierarchy_entry_key_value, ref, value, entry_key, type, created_on FROM ec_branch_data WHERE form_id IN ';
			query += '(SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) ';
			query += 'AND is_data_synced=? AND hierarchy_entry_key_value=? AND entry_key=?';

			tx.executeSql(query, [branch_form_name, project_id, 0, hierarchy_entry_key_value, branch_entry_key], _getOneBranchEntrySQLSuccess, EC.Select.txErrorCB);
		};

		/**
		 *  _getOneBranchEntrySQLSuccess SQL success callback, collecting all the values for a single branch entry to an array
		 */
		var _getOneBranchEntrySQLSuccess = function(the_tx, the_result) {

			var i;
			var result = the_result;
			var iLength = result.rows.length;
			var ref;
			var new_ref = "";
			var location_ref = "";
			var location_obj = {};
			var location_string;
			var parent_ref;
			var path;
			var values_counter = 0;

			//build first branch entry
			branch_entry = {
				created_on : result.rows.item(0).created_on,
				entry_key : result.rows.item(0).entry_key,
				hierarchy_entry_key_ref : result.rows.item(0).hierarchy_entry_key_ref,
				hierarchy_entry_key_value : result.rows.item(0).hierarchy_entry_key_value,
				values : [{}]
			};

			console.log(result.rows.item(0));

			//add all values for this entry
			i = 0;
			values_counter = 0;
			//using a separate index for the entry values as each location value will be splitted into 4 components
			while (i < iLength) {

				//set empty object
				branch_entry.values[values_counter] = {};

				switch(result.rows.item(i).type) {

					//TODO: add branc type;

					case EC.Const.LOCATION:

						//split the location values to different parts (as expected on server)
						location_string = result.rows.item(i).value.replace("\n", "").replace("\r", "");

						//no location saved, so fill in with empty values
						if (location_string === "") {

							branch_entry.values[values_counter].ref = result.rows.item(i).ref + "_lat";
							branch_entry.values[values_counter].value = "";
							branch_entry.values[values_counter]._id = result.rows.item(i)._id;
							branch_entry.values[values_counter].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 1] = {};
							branch_entry.values[values_counter + 1].ref = result.rows.item(i).ref + "_lon";
							branch_entry.values[values_counter + 1].value = "";
							branch_entry.values[values_counter + 1]._id = "";
							branch_entry.values[values_counter + 1].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 2] = {};
							branch_entry.values[values_counter + 2].ref = result.rows.item(i).ref + "_acc";
							branch_entry.values[values_counter + 2].value = "";
							branch_entry.values[values_counter + 2]._id = "";
							branch_entry.values[values_counter + 2].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 3] = {};
							branch_entry.values[values_counter + 3].ref = result.rows.item(i).ref + "_alt";
							branch_entry.values[values_counter + 3].value = "";
							branch_entry.values[values_counter + 3]._id = "";
							branch_entry.values[values_counter + 3].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 4] = {};
							branch_entry.values[values_counter + 4].ref = result.rows.item(i).ref + "_bearing";
							branch_entry.values[values_counter + 4].value = "";
							branch_entry.values[values_counter + 4]._id = "";
							branch_entry.values[values_counter + 4].type = result.rows.item(i).type;
						} else {

							//get location object
							location_obj = EC.Utils.parseLocationString(location_string);

							branch_entry.values[values_counter].ref = result.rows.item(i).ref + "_lat";
							branch_entry.values[values_counter].value = location_obj.Latitude;
							branch_entry.values[values_counter]._id = result.rows.item(i)._id;
							branch_entry.values[values_counter].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 1] = {};
							branch_entry.values[values_counter + 1].ref = result.rows.item(i).ref + "_lon";
							branch_entry.values[values_counter + 1].value = location_obj.Longitude;
							branch_entry.values[values_counter + 1]._id = "";
							branch_entry.values[values_counter + 1].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 2] = {};
							branch_entry.values[values_counter + 2].ref = result.rows.item(i).ref + "_acc";
							branch_entry.values[values_counter + 2].value = location_obj.Accuracy;
							branch_entry.values[values_counter + 2]._id = "";
							branch_entry.values[values_counter + 2].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 3] = {};
							branch_entry.values[values_counter + 3].ref = result.rows.item(i).ref + "_alt";
							branch_entry.values[values_counter + 3].value = location_obj.Altitude;
							branch_entry.values[values_counter + 3]._id = "";
							branch_entry.values[values_counter + 3].type = result.rows.item(i).type;

							branch_entry.values[values_counter + 4] = {};
							branch_entry.values[values_counter + 4].ref = result.rows.item(i).ref + "_bearing";
							branch_entry.values[values_counter + 4].value = location_obj.Bearing;
							branch_entry.values[values_counter + 4]._id = "";
							branch_entry.values[values_counter + 4].type = result.rows.item(i).type;

						}

						//increase values_counter as we split the location value into 4 components
						values_counter += 4;

						break;

					default:

						branch_entry.values[values_counter].ref = result.rows.item(i).ref;
						branch_entry.values[values_counter].value = result.rows.item(i).value;
						branch_entry.values[values_counter]._id = result.rows.item(i)._id;
						branch_entry.values[values_counter].type = result.rows.item(i).type;

				}//switch

				//increase counter for next value
				values_counter++;
				i++;

			}//for

		};

		/**
		 * _getOneBranchEntrySuccessCB All values for a single branch entry collected, upload them
		 */
		var _getOneBranchEntrySuccessCB = function() {

			var branch_forms;

			console.log("One branch entry");
			console.log(branch_entry);

			switch(EC.Upload.action) {

				case EC.Const.START_BRANCH_UPLOAD:
					if (branch_entry) {
						deferred.resolve(branch_entry);
					} else {
						deferred.reject();
					}
					break;

				case EC.Const.BRANCH_RECURSION:

					//Upload entry
					if (branch_entry) {

						EC.Upload.current_branch_entry = branch_entry;

						if ($.isEmptyObject(EC.Upload.current_branch_form)) {

						}

						EC.Upload.prepareOneBranchEntry(EC.Upload.current_branch_form.name, EC.Upload.current_branch_entry);

					} else {

						//TODO: no entry to upload, show upload success??
						EC.Upload.action = (EC.Upload.action === EC.Const.BRANCH_RECURSION) ? EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD : EC.Const.START_BRANCH_UPLOAD;
						EC.Upload.renderUploadViewFeedback(true);

					}
					break;

			}

		};

		/**
		 * _getOneEntryKeySuccessCB
		 */
		var _getOneEntryKeySuccessCB = function() {

			console.log(JSON.stringify(branch_entry_key));

		};

		var _getOneHierarchyEntryKeyValueTX = function(tx) {

			var query = "SELECT DISTINCT hierarchy_entry_key_value FROM ec_branch_data WHERE is_data_synced=? AND form_id IN (SELECT _id from ec_branch_forms WHERE name=? AND project_id=?) LIMIT 1";

			tx.executeSql(query, [0, branch_form_name, project_id], _getOneHierarchyEntryKeyValueSQLSuccess, EC.Select.txErrorCB);

		};

		var _getOneHierarchyEntryKeyValueSQLSuccess = function(the_tx, the_result) {

			if (the_result.rows.length > 0) {
				hierarchy_entry_key_value = the_result.rows.item(0).hierarchy_entry_key_value;
			}

		};

		var _getOneHierarchyEntryKeyValueSuccessCB = function() {

			if (hierarchy_entry_key_value) {

				//TODO: get entry key

				//get a single branch entry key
				EC.db.transaction(_getOneEntryKeyTX, EC.Select.txErrorCB, _getOneEntryKeySuccessCB);

			} else {

				//no branch entries for this form, try with next one if any
				if (EC.Upload.branch_forms.length > 0) {
					
					EC.Upload.current_branch_form = EC.Upload.branch_forms.shift();
					self.getOneBranchEntry(project_id, EC.Upload.current_branch_form.name);

				} else {

					/* NO more branch entries:
					 */

					if (EC.Upload.action === EC.Const.BRANCH_RECURSION) {
						EC.Upload.action = EC.Const.STOP_BRANCH_UPLOAD;
						EC.Upload.renderUploadViewFeedback(true);
					}

					if (EC.Upload.action === EC.Const.START_BRANCH_UPLOAD) {

						//deferred rejected?
						deferred.reject();

					}

				}

			}

		};

		/**
		 * @method getOneBranchEntry Trigger a transaction to get 1 single branch entry key
		 * @param {Object} the_branch_form_name
		 * @param {Object} the_project_id
		 * @param {Object} the_hierarchy_entry_key_value
		 */
		module.getOneBranchEntry = function(the_project_id, the_branch_form_name, is_called_from_view) {

			self = this;
			project_id = the_project_id;
			branch_form_name = the_branch_form_name;
			branch_entry = {};

			/*
			 * if we are calling this method from  the upload view, bind a deferred object to resolve to that call
			 * This happens when the user loads the upload view and the first forms in the db do not have any entry to sync:
			 * the getOneBranchEntry is then called recursively until an entry is found but WITHOUT overriding the deferred object
			 */
			if (is_called_from_view) {
				deferred = new $.Deferred();
			}

			//get a single hierarchy_entry_key_value
			EC.db.transaction(_getOneHierarchyEntryKeyValueTX, EC.Select.txErrorCB, _getOneHierarchyEntryKeyValueSuccessCB);

			// return promise to update ui when entry has/has not been found
			if (is_called_from_view) {
				return deferred.promise();
			}

		};

		return module;

	}(EC.Select));
