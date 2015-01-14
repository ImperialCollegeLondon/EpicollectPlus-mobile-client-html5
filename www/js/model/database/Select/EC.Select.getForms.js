/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {"use strict";

		var forms = [];
		var project_id;
		var total_synced_rows = 0;
		var total_entries_rows = 0;
		var total_media_files = 0;
		var total_all_synced_rows = 0;
		var button_states = {};
		var deferred;

		//callback for a forms select transaction success
		var _getFormsSuccessCB = function() {

			//get info about this project data to enable/ disable context menu buttons
			total_synced_rows = 0;
			total_entries_rows = 0;
			total_media_files = 0;
			total_all_synced_rows = 0;
			EC.db.transaction(_getDataInfoTX, EC.Select.txErrorCB, _getDataInfoSuccessCB);

		};

		var _getDataInfoTX = function(tx) {

			var i;
			var iLength = forms.length;
			var has_data_synced_query = 'SELECT COUNT(*) AS total_synced_rows FROM ec_data WHERE form_id=? AND is_data_synced=?';
			var has_entries_query = 'SELECT COUNT(*) AS total_entries_rows FROM ec_data WHERE form_id=?';
			var has_media_query = 'SELECT COUNT(*) AS total_media_files FROM ec_data WHERE form_id=? AND (type=? OR type=? OR type=?) AND value<>?';
			var has_all_synced_query = 'SELECT COUNT(*) AS total_all_synced_rows FROM ec_data WHERE form_id=? AND is_data_synced=? AND (type=? OR type=? OR type=? AND is_media_synced=?)';

			for ( i = 0; i < iLength; i++) {

				tx.executeSql(has_data_synced_query, [forms[i]._id, 1], _onDataSyncedSQLSuccess, EC.Select.txErrorCB);
				tx.executeSql(has_entries_query, [forms[i]._id], _onHasEntriesSQLSuccess, EC.Select.txErrorCB);
				tx.executeSql(has_media_query, [forms[i]._id, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, ""], _onHasMediaSQLSuccess, EC.Select.txErrorCB);
				tx.executeSql(has_all_synced_query, [forms[i]._id, 1, EC.Const.PHOTO, EC.Const.AUDIO, EC.Const.VIDEO, 1], _onHasAllSyncedSQLSuccess, EC.Select.txErrorCB);
			}

		};

		var _onDataSyncedSQLSuccess = function(the_tx, the_result) {
			total_synced_rows += parseInt(the_result.rows.item(0).total_synced_rows, 10);
		};

		var _onHasEntriesSQLSuccess = function(the_tx, the_result) {
			total_entries_rows += parseInt(the_result.rows.item(0).total_entries_rows, 10);
		};

		var _onHasMediaSQLSuccess = function(the_tx, the_result) {
			total_media_files += parseInt(the_result.rows.item(0).total_media_files, 10);
		};

		var _onHasAllSyncedSQLSuccess = function(the_tx, the_result) {
			total_all_synced_rows += parseInt(the_result.rows.item(0).total_all_synced_rows, 10);
		};

		var _getDataInfoSuccessCB = function() {

			console.log("Data info collected");

			button_states.unsync_all_data = (total_synced_rows > 0) ? 1 : 0;
			button_states.delete_all_entries = (total_entries_rows > 0) ? 1 : 0;
			button_states.delete_media_files = (total_media_files > 0) ? 1 : 0;
			button_states.delete_synced_entries = (total_all_synced_rows > 0) ? 1 : 0;

			deferred.resolve(forms.slice(0), button_states);

			//clear forms array
			forms.length = 0;
		};

		var _getFormsTX = function(tx) {

			var query = 'SELECT _id, name, key, num, has_media, has_branches, is_genkey_hidden, total_inputs, entries FROM ec_forms WHERE project_id=?';
			tx.executeSql(query, [project_id], _getFormsSQLSuccess, EC.Select.txErrorCB);
		};

		var _getFormsSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLenght = the_result.rows.length;

			//build object with project data
			for ( i = 0; i < iLenght; i++) {
				forms.push(the_result.rows.item(i));
			}

			console.log(the_tx);
			console.log("TRANSACTION SELECT FORMS SUCCESS");

		};

		module.getForms = function(the_project_id) {

			project_id = the_project_id;
			deferred = new $.Deferred();

			EC.db.transaction(_getFormsTX, EC.Select.txErrorCB, _getFormsSuccessCB);

			return deferred.promise();

		};
		//getForms

		return module;

	}(EC.Select));
