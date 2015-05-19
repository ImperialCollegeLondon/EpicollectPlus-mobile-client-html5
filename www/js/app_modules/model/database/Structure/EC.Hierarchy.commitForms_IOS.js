/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 *   @module Hierarchy
 *	 	
 */

var EC = EC || {};
EC.Hierarchy = EC.Hierarchy || {};
EC.Hierarchy = ( function(module) {"use strict";

		var self;
		var deferred;
		var max_form_ID;

		//keep track of foreign keys
		var project_insertId;
		var forms_IDs = [];

		//store forms
		var forms;

		//we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
		var form_num_index = 0;

		/*  @method _formsTXSuccess
		 *
		 *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
		 *	it is called as a callback for each form executeSql()
		 */
		var _insertFormsSQLSuccess = function(the_tx, the_result) {
			
			// _id of last entered row will be max_form_ID + 1
			forms_IDs[form_num_index].id = ++max_form_ID;

			form_num_index++;

			console.log("executeSql SUCCESS FORMS");

		};

		var _insertFormsSuccessCB = function(the_tx, the_result) {

			console.log(the_tx);
			console.log(the_result);

			//reset forms arrays
			forms.length = 0;
			
			deferred.resolve(forms_IDs);

		};

		//Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
		var _insertFormsTX = function(tx) {

			var i;
			var iLenght = forms.length;
			var query;

			for ( i = 0; i < iLenght; i++) {

				query = 'INSERT INTO ec_forms (project_id, num, name, key, has_media, has_branches, is_genkey_hidden, total_inputs) ';
				query += 'VALUES ("';
				query += project_insertId + '", "';
				query += forms[i].num + '", "';
				query += forms[i].name + '", "';
				query += forms[i].key + '", "';
				query += forms[i].has_media + '", "';
				query += forms[i].has_branches + '", "';
				query += forms[i].is_form_genkey_hidden + '", "';
				query += forms[i].total_inputs + '");';

				//keep track of current form @num and database row ID. Defaults to 0, it will be set after the INSERT
				forms_IDs.push({
					num : forms[i].num,
					id : 0
				});
				tx.executeSql(query, [], _insertFormsSQLSuccess, self.errorCB);

			}
		};

		var _getHighestIdTX = function(tx) {

			var query = "SELECT MAX(_id) AS _id from ec_forms";
			
			//reset auto increment for ec_forms table
			var reset_seq_query = 'UPDATE sqlite_sequence SET seq = (SELECT MAX(_id) FROM ec_forms) WHERE name="ec_forms"';

			tx.executeSql(query, [], _getHighestIdSQLSuccess, self.errorCB);
			tx.executeSql(reset_seq_query, [], _resetSequenceSQLSuccess, null);

		};

		var _getHighestIdSQLSuccess = function(the_tx, the_result) {
			max_form_ID = the_result.rows.item(0)._id;
		};

		var _getHighestIdSuccessCB = function() {
			
			//we got the max _id, perform all the INSERT transactions
			EC.db.transaction(_insertFormsTX, self.errorCB, _insertFormsSuccessCB);
		};
		
		var _resetSequenceSQLSuccess = function(the_tx, the_result){
		};

		/**
		 * @method commitForms. Due to a bug on iOS (insertId undefined after INSERT)
		 * we need to get the MAX(_id) of the table ec_forms, reset the sqlite_sequence table to that value for the ec_forms column 
		 * to basically know in advance what the insertId will be in the database 
		 * 
		 */
		module.commitForms = function(the_forms_object, the_project_insertId) {

			self = this;
			deferred = new $.Deferred();
			forms = the_forms_object;
			project_insertId = the_project_insertId;
			forms_IDs.length = 0;
			form_num_index = 0;
			max_form_ID = 0;

			//select max _id from ec_forms
			EC.db.transaction(_getHighestIdTX, self.errorCB, _getHighestIdSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));
