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
		//keep track of foreign keys
		var project_insertId;
		var forms_IDs = [];
		//store forms
		var forms =[];

		//we need to keep track of the form @num to be linked with whatever ID it gets upon being entered to the the db
		var form_num_index = 0;

		/*  @method _formsTXSuccess
		 *
		 *	it links the form @num with the actual ID on the database to be used as foreign key on the ec_inputs table
		 *	it is called as a callback for each form executeSql()
		 */
		var _commitFormsSQLSuccess = function(the_tx, the_result) {
		

			//link each row ID to its form.
			if (the_result.insertId) {
				forms_IDs[form_num_index].id = the_result.insertId;
			} else {
				//Weird bug on iOS: insertId is undefined sometimes!
				//If that happem, drop parsing, delete tables and ask the user to start over
				//TODO: maybe adding forms recursively instead of looping?

				var project_id = parseInt(window.localStorage.project_id, 10);
				var project_name = window.localStorage.project_name;

				$.when(EC.Delete.deleteProject(project_id, project_name)).then(function() {

					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknown_error"));
					window.localStorage.is_project_deleted = 1;
					window.localStorage.back_nav_url = "#refresh";
					EC.Routing.changePage(EC.Const.INDEX_VIEW);

				}, function() {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknown_error"));
				});

			}

			form_num_index++;

			console.log("executeSql SUCCESS FORMS");

		};

		//resets forms array
		var _commitFormsSuccessCB = function(the_tx, the_result) {

			console.log(the_tx);
			console.log(the_result);

			//reset forms arrays
			forms.length = 0;

			//trigger function to save all the inputs for this form
			//self.commitInputs(EC.Parse.inputs, forms_IDs);
			
			deferred.resolve(forms_IDs);

		};

		//Transaction to save all the forms to the db. Each form will get its own executeSql and relative callback
		var _commitFormsTX = function(tx) {

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
				tx.executeSql(query, [], _commitFormsSQLSuccess, self.errorCB);
				
				
			}
		};

		/**
		 * @method insertForms
		 */
		module.commitForms = function(the_forms_object, the_project_insertId) {

			self = this;
			deferred = new $.Deferred();
			forms = the_forms_object;
			project_insertId = the_project_insertId;
			forms_IDs.length = 0;
			form_num_index = 0;

			EC.db.transaction(_commitFormsTX, self.errorCB, _commitFormsSuccessCB);
			
			return deferred.promise();

		};

		return module;

	}(EC.Hierarchy));
