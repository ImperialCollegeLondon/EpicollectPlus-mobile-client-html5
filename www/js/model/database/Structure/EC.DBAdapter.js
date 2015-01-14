/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/
/*
 * @module DBAdapter
 *
 *   Initialise the database using Phonegap 2.9
 *   Phonegap uses Web SQL specifications on the Chrome browser (Android)
 *
 */
var EC = EC || {};
EC.DBAdapter = EC.DBAdapter || {};
EC.DBAdapter = ( function() {"use strict";

		//Initialise private database object if it is not already
		//var EC.db =  window.openDatabase("epicollect", "1.0", "Epicollect", 2000000);

		//native
		//var EC.db =  db || window.sqlitePlugin.openDatabase("epicollect", "1.0", "Epicollect", 2000000);

		/*
		 *  Query to create the database tables
		 *  foreign keys apparently do not work on Web SQL, so it is better to use triggers or manually do all the delete/update on cascade
		 *
		 */

		var deferred;

		//Query to create ec_projects table
		var cq_ec_projects = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_projects" (', //
		' "_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,', //
		'"name" TEXT, ', //
		'"total_hierarchy_forms" INTEGER DEFAULT 0, ', //
		'"total_branch_forms" INTEGER DEFAULT 0, ', //
		'"is_active" INTEGER DEFAULT 0,', //
		'"uploadToServer" TEXT,', //
		'"downloadFromServer" TEXT,', //
		'"allowDownloadEdits" INTEGER DEFAULT 0,', //
		'"version" TEXT,', '"description" TEXT,', //
		'"radiobutton_image_url" TEXT,', //
		'"reg_mail" TEXT);'//
		].join('');
		//

		//Query to create ec_forms table
		var cq_ec_forms = ['', 'CREATE TABLE IF NOT EXISTS "ec_forms" (', //
		' "_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE,', //
		'"project_id" INTEGER NOT NULL, ', //
		'"name" TEXT, ', //
		'"num" INTEGER, ', //
		'"key" TEXT, ', //
		'"total_inputs" INTEGER, ', //
		'"has_media" INTEGER DEFAULT 0, ', //
		'"has_branches" INTEGER DEFAULT 0, ', //
		'"is_genkey_hidden" INTEGER DEFAULT 0, ', //
		'"entries" INTEGER DEFAULT 0, ', //
		'FOREIGN KEY ("project_id") REFERENCES ec_projects ("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE);'].join('');
		//

		//Query to create ec_branch_forms table
		var cq_ec_branch_forms = ['', 'CREATE TABLE IF NOT EXISTS "ec_branch_forms" (', //
		' "_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE,', //
		'"project_id" INTEGER NOT NULL, ', //
		'"name" TEXT, ', //
		'"num" INTEGER, ', //
		'"key" TEXT, ', //
		'"total_inputs" INTEGER, ', //
		'"has_media" INTEGER DEFAULT 0, ', //
		'"is_genkey_hidden" INTEGER DEFAULT 0, ', //
		'"entries" INTEGER DEFAULT 0, ', //
		'FOREIGN KEY ("project_id") REFERENCES ec_projects ("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE);'].join('');
		//

		//Query to create ec_inputs table
		var cq_ec_inputs = ['', //
		'CREATE  TABLE IF NOT EXISTS "ec_inputs" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , ', //
		'"form_id" INTEGER NOT NULL , ', //
		'"ref" TEXT,', //
		'"position" INTEGER,', //
		'"label" TEXT,', //
		'"default_value" TEXT,', //
		'"type" TEXT, ', //
		'"is_primary_key" INTEGER,', //
		'"is_genkey" INTEGER,', //
		'"has_double_check" INTEGER,', //
		'"max_range" TEXT,', //
		'"min_range" TEXT , ', //
		'"is_required" INTEGER, ', //
		'"is_title" INTEGER,', //
		'"is_server_local" INTEGER,', //
		'"is_searchable" TEXT, ', //
		'"regex" TEXT, ', //
		'"has_jump" INTEGER,', //
		'"jumps" TEXT,', //
		'"has_advanced_jump" INTEGER, ', //
		'"datetime_format" TEXT,', //
		'"branch_form_name" TEXT,', //
		'FOREIGN KEY ("form_id") REFERENCES ec_forms(_id) ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');
		//

		//Query to create ec_branch_inputs table
		var cq_ec_branch_inputs = ['', //
		'CREATE  TABLE IF NOT EXISTS "ec_branch_inputs" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , ', //
		'"form_id" INTEGER NOT NULL , ', //
		'"ref" TEXT,', //
		'"position" INTEGER,', //
		'"label" TEXT,', //
		'"default_value" TEXT,', //
		'"type" TEXT, ', //
		'"is_primary_key" INTEGER,', //
		'"is_genkey" INTEGER,', //
		'"has_double_check" INTEGER,', //
		'"max_range" TEXT,', //
		'"min_range" TEXT , ', //
		'"is_required" INTEGER, ', //
		'"is_title" INTEGER,', //
		'"is_server_local" INTEGER,', //
		'"is_searchable" TEXT, ', //
		'"regex" TEXT, ', //
		'"has_jump" INTEGER,', //
		'"jumps" TEXT,', //
		'"has_advanced_jump" INTEGER, ', //
		'"datetime_format" TEXT,', //
		'FOREIGN KEY ("form_id") REFERENCES ec_branch_forms(_id) ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');
		//

		//Query to create ec_input_options table
		var cq_ec_input_options = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_input_options" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL , ', //
		'"ref" TEXT NOT NULL ,', //
		'"label" TEXT NOT NULL ,', //
		'"value" TEXT NOT NULL , ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_branch_input_options table
		var cq_ec_branch_input_options = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_branch_input_options" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL , ', //
		'"ref" TEXT NOT NULL ,', //
		'"label" TEXT NOT NULL ,', //
		'"value" TEXT NOT NULL , ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_branch_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_data table
		var cq_ec_data = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_data" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL, ', //
		'"form_id" INTEGER NOT NULL, ', //
		'"position" INTEGER NOT NULL, ', //
		'"parent" TEXT NOT NULL DEFAULT "", ', //
		'"label" TEXT NOT NULL DEFAULT "", ', //
		'"value" TEXT, ', //
		'"ref" TEXT, ', //
		'"is_title" INTEGER DEFAULT 0, ', //
		'"entry_key" TEXT NOT NULL,', //
		'"type" TEXT, ', //
		'"is_data_synced" INTEGER DEFAULT 0, ', //
		'"is_media_synced" INTEGER DEFAULT 0, ', //
		'"is_remote" INTEGER DEFAULT 0, ', //
		'"created_on" INTEGER, ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		//Query to create ec_data table
		var cq_ec_branch_data = ['', //
		'CREATE TABLE IF NOT EXISTS "ec_branch_data" (', //
		'"_id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE ,', //
		'"input_id" INTEGER NOT NULL, ', //
		'"form_id" INTEGER NOT NULL, ', //
		'"hierarchy_entry_key_value" TEXT, ', //main form entry key value
		'"hierarchy_entry_key_ref" TEXT, ', //main form entry key value
		'"position" INTEGER NOT NULL, ', //
		'"label" TEXT NOT NULL DEFAULT "", ', //
		'"value" TEXT, ', //
		'"ref" TEXT, ', //
		'"is_title" INTEGER DEFAULT 0, ', //
		'"entry_key" TEXT NOT NULL,', //
		'"type" TEXT, ', //
		'"is_data_synced" INTEGER DEFAULT 0, ', //
		'"is_media_synced" INTEGER DEFAULT 0, ', //
		'"is_remote" INTEGER DEFAULT 0, ', //if the entry has been downloaded remotely or created
		'"is_cached" INTEGER DEFAULT 0, ', // if the etry is cached (branch form saved but not its main form)
		'"is_stored" INTEGER DEFAULT 0, ', // if the entry and its main form is saved
		'"created_on" INTEGER, ', //
		'FOREIGN KEY ("input_id") REFERENCES ec_branch_inputs("_id") ON DELETE CASCADE ON ', //
		'UPDATE CASCADE', //
		');'//
		].join('');

		/**
		 * *********************** TRIGGERS *******************************************************
		 */

		var tq_delete_forms = [//
		'CREATE TRIGGER delete_forms ', //
		'BEFORE DELETE ', //
		'ON ec_projects ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_forms WHERE ec_forms.project_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_forms = [//
		'CREATE TRIGGER delete_branch_forms ', //
		'BEFORE DELETE ', //
		'ON ec_projects ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_forms WHERE ec_branch_forms.project_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_inputs = [//
		'CREATE TRIGGER delete_inputs ', //
		'BEFORE DELETE ', //
		'ON ec_forms ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_inputs WHERE ec_inputs.form_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_inputs = [//
		'CREATE TRIGGER delete_branch_inputs ', //
		'BEFORE DELETE ', //
		'ON ec_branch_forms ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_inputs WHERE ec_branch_inputs.form_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_input_options = [//
		'CREATE TRIGGER delete_input_options ', //
		'BEFORE DELETE ', //
		'ON ec_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_input_options WHERE ec_input_options.input_id = old._id; ', //
		'END'//
		].join('');

		var tq_delete_branch_input_options = [//
		'CREATE TRIGGER delete_branch_input_options ', //
		'BEFORE DELETE ', //
		'ON ec_branch_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_input_options WHERE ec_branch_input_options.input_id = old._id; ', //
		'END'//
		].join('');
		
		var tq_delete_ec_data = [//
		'CREATE TRIGGER delete_ec_data ', //
		'BEFORE DELETE ', //
		'ON ec_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_data WHERE ec_data.input_id = old._id; ', //
		'END'//
		].join('');
		
		var tq_delete_ec_branch_data = [//
		'CREATE TRIGGER delete_ec_branch_data ', //
		'BEFORE DELETE ', //
		'ON ec_branch_inputs ', //
		'FOR EACH ROW ', //
		'BEGIN ', //
		'DELETE FROM ec_branch_data WHERE ec_branch_data.input_id = old._id; ', //
		'END'//
		].join('');
		

		/**
		 *********************** DROP TRIGGERS
		 */
		var dtq_delete_forms = 'DROP TRIGGER IF EXISTS delete_forms ';
		var dtq_delete_branch_forms = 'DROP TRIGGER IF EXISTS delete_branch_forms ';
		var dtq_delete_inputs = 'DROP TRIGGER IF EXISTS delete_inputs ';
		var dtq_delete_branch_inputs = 'DROP TRIGGER IF EXISTS delete_branch_inputs ';
		var dtq_delete_input_options = 'DROP TRIGGER IF EXISTS delete_input_options ';
		var dtq_delete_branch_input_options = 'DROP TRIGGER IF EXISTS delete_branch_input_options ';
		var dtq_delete_ec_data = 'DROP TRIGGER IF EXISTS delete_ec_data ';
		var dtq_delete_ec_branch_data = 'DROP TRIGGER IF EXISTS delete_ec_branch_data ';

		//Create database if not exist
		var _initDB = function(tx) {

			//tx.executeSql("PRAGMA foreign_keys = ON;"); //apparently PRAGMA is disabled is some browsers

			//create tables
			tx.executeSql(cq_ec_projects);
			tx.executeSql(cq_ec_forms);
			tx.executeSql(cq_ec_branch_forms);
			tx.executeSql(cq_ec_inputs);
			tx.executeSql(cq_ec_branch_inputs); 
			tx.executeSql(cq_ec_input_options);
			tx.executeSql(cq_ec_branch_input_options);
			tx.executeSql(cq_ec_data);
			tx.executeSql(cq_ec_branch_data);

			//drop existing triggers
			tx.executeSql(dtq_delete_forms);
			tx.executeSql(dtq_delete_branch_forms);
			tx.executeSql(dtq_delete_inputs);
			tx.executeSql(dtq_delete_branch_inputs);
			tx.executeSql(dtq_delete_input_options);
			tx.executeSql(dtq_delete_branch_input_options);
			tx.executeSql(dtq_delete_ec_data);
			tx.executeSql(dtq_delete_ec_branch_data);

			//add triggers
			tx.executeSql(tq_delete_forms);
			tx.executeSql(tq_delete_branch_forms);
			tx.executeSql(tq_delete_inputs);
			tx.executeSql(tq_delete_branch_inputs);
			tx.executeSql(tq_delete_input_options);
			tx.executeSql(tq_delete_branch_input_options);
			tx.executeSql(tq_delete_ec_data);
			tx.executeSql(tq_delete_ec_branch_data);

		};

		//error callback if any errors occured during a transaction
		var _errorCB = function(the_error) {
			console.log(the_error);
		};

		//success callback when database transaction successful
		var _initSuccessCB = function() {
			console.log("TRANSACTION INIT SUCCESS");
			deferred.resolve();
		};

		/* initialise database object */
		var init = function() {

			deferred = new $.Deferred();
			//open or create a webSQL database (on webkit)
			EC.db.transaction(_initDB, _errorCB, _initSuccessCB);

			return deferred.promise();

		};

		return {
			init : init
		};

	}());
