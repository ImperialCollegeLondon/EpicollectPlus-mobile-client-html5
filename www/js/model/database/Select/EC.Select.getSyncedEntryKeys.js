/*jslint vars: true , nomen: true, devel: true, plusplus:true, stupid : true*/
/*global $, jQuery*/

/*
 * Get all the synced entry keys for a single form, using form ID
 *
 * We use DISTICT to have a single occurrence of the entry key, as many rows can
 * have the same entry key.
 *
 * A row is fully synced when:
 *
 * is_data_synced= 1 but the row is not a media type (audio, photo, video),
 * is_data_synced is set to 1 after successfully uploading to the server
 *
 * is_data_synced = 1 and is_media_synced= 1 and the row is of type media (audio,
 * photo, video), this means the file was uploaded successfully
 *
 * is_data_synced = 1, is_media_synced is still 0, the type is media (audio,
 * photo, video) but the value is empty: this means the entry is data synced but
 * there is not any file to upload, therefore the entry can be safely deleted, as
 * the user decided not to enter any media when requested
 * TODO: check this better
 */

var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = ( function(module) {
		"use strict";

		var self;
		var form_id;
		var entry_key;
		var entry_keys;
		var deferred;

		var _getSyncedEntryKeysTX = function(tx) {

			var query = 'SELECT DISTINCT entry_key FROM ec_data WHERE form_id=?';
			query += ' AND ((is_data_synced=? AND type NOT IN ("audio", "photo", video"))';
			query += ' OR (is_data_synced=? AND is_media_synced=? AND type IN ("audio", "photo", video"))';
			query += ' OR (is_data_synced=? AND is_media_synced=? AND type IN ("audio", "photo", video") AND value=?))';

			tx.executeSql(query, [form_id, 1, 1, 1, 1, 0, ""], _getSyncedEntryKeysSQLSuccess, self.errorCB);
		};

		var _getSyncedEntryKeysSQLSuccess = function(the_tx, the_result) {

			var i;
			var iLength = the_result.rows.length;

			//build object with entry keys
			for ( i = 0; i < iLength; i++) {
				entry_keys.push(the_result.rows.item(i).entry_key);
			}
		};

		var _getSyncedEntryKeysSuccessCB = function() {
			deferred.resolve(entry_keys);
		};

		//get all entry keys for the specified form
		module.getSyncedEntryKeys = function(the_form_id) {

			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
			entry_keys = [];
			EC.db.transaction(_getSyncedEntryKeysTX, self.errorCB, _getSyncedEntryKeysSuccessCB);

			return deferred.promise();

		};

		return module;

	}(EC.Select));
