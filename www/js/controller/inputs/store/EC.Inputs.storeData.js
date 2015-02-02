/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {
		"use strict";

		module.storeData = function(the_ctx) {

			//get context
			var self = the_ctx;
			var media_files = [];

			var _getCachedMediaFiles = function() {

				var inputs_values = JSON.parse(window.localStorage.inputs_values);
				var iLength = inputs_values.length;
				var i;
				var input;
				var value;

				var files = [];

				//count how many media files we have to save
				for ( i = 0; i < iLength; i++) {

					//get current value
					input = EC.Inputs.inputs[i];
					value = EC.Inputs.getCachedInputValue(input.position).value;

					if (input.type === EC.Const.PHOTO || input.type === EC.Const.VIDEO || input.type === EC.Const.AUDIO) {

						// If cache path is empty, we do not have a file to save for that input so skip it
						if (value.cached !== "") {
							files.push({
								type : input.type,
								cached : value.cached,
								stored : value.stored,
								ref : input.ref
							});
						}
					}
				}

				/*
				 * Now we got all the file paths, so clear DOM from any references
				 * otherwise on editing input some cache/stored file paths could be there and
				 * that causes errors upon saving
				 * as the EC.File.move() mehod will look for non-existent files
				 */

				if (files.length > 0) {
					//audio
					$('div#audio div#input-audio input#cached-audio-uri').val('');
					$('div#audio div#input-audio input#stored-audio-uri').val('');
				}
				return files;
			};

			media_files = _getCachedMediaFiles();

			console.log('media_files.length= ' + media_files.length);

			//Save data directly if no files are found (or we are using Chrome)
			if (media_files.length === 0 || EC.Utils.isChrome()) {

				self.buildRows();

			}
			else {

				//save media files, when all are saved trigger buildRows();
				console.log(JSON.stringify(media_files));

				EC.File.move(media_files);
			}

		};

		/** @method onStoreValues When the user tap the button to save data,
		 *  check first we have a primary key to save, then take care of skipped (by a
		 * jump) values
		 */
		module.onStoreValues = function() {

			var self = this;

			//check if the primary key field has a value (there are cases where jumps skip
			// the primary key field, so warn the user form cannot be saved)
			if (self.isEmptyPrimaryKey()) {
				//warn user
				EC.Notification.hideProgressDialog();
				EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("missing_pk"));
				return;
			}

			if (window.localStorage.form_has_jumps === '1') {
				//amend input values to save, setting the keyword "_skipp3d_" to skipped fields
				self.amendSkippedValues();
			}

			self.storeData(self);
		};

		return module;

	}(EC.Inputs));
