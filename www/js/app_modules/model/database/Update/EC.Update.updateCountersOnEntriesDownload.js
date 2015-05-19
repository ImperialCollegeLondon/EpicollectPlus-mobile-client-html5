/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Update = EC.Update || {};
EC.Update = ( function(module) {
		"use strict";
		
		var self;
		var form_id;
		var deferred;

		module.updateCountersOnEntriesDownload = function(the_form_id) {
			
			self = this;
			deferred = new $.Deferred();
			form_id = the_form_id;
		
			EC.db.transaction(_updateCountersOnEntriesDownloadTX, self.errorCB, _updateCountersOnEntriesDownloadCB);

			return deferred.promise();
		};

		var _updateCountersOnEntriesDownloadTX = function(tx) {

			var query = 'UPDATE ec_forms SET entries = entries + ' + 1 + ' WHERE _id=?';

			tx.executeSql(query, [form_id], null, self.errorCB);
		};

		var _updateCountersOnEntriesDownloadCB = function() {
			deferred.resolve();
		};

		return module;

	}(EC.Update));
