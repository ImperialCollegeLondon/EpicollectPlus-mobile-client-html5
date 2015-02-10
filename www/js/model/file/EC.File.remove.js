/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 */
var EC = EC || {};

/* Remove one or more files from a project recursively
 *
 * @submodule File
 * @method remove
 * @param {string} the_project_name - the name of the project
 * @param {array} files - array of file names and media type like:
 * 
 * {value: <the_filenemae>, type: <the_media_type>}
 *
 */
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		var project_name;
		var files = [];
		var self;
		var rows_deleted;
		var deferred;

		module.remove = function(the_project_name, the_files) {

			self = this;
			deferred = new $.Deferred();

			//get files details
			project_name = the_project_name;
			files = the_files;
			
			//remove 1 file at a time recursively
			_removeOneFile();

			return deferred.promise();

		};

		var _removeOneFile = function() {
			
			//get a single file
			var file = files.shift();
			var filename = file.value;
			var type = file.type;
			var dir;
			var full_path;
			
			//get directory the file is saved in based on its type (photo, audio, video)
			switch(type) {

				case EC.Const.PHOTO:
					dir = EC.Const.PHOTO_DIR;
					break;

				case EC.Const.AUDIO:
					dir = EC.Const.AUDIO_DIR;
					break;

				case EC.Const.VIDEO:
					dir = EC.Const.VIDEO_DIR;
					break;

			}
			
			full_path = EC.Const.ANDROID_APP_PRIVATE_URI + dir + project_name + "/" + filename;

			console.log("file full path: " + full_path);

			//get file entry
			window.resolveLocalFileSystemURI(full_path, _onGetFileSuccess, _onGetFileError);
		};

		var _onGetFileSuccess = function(the_file_entry) {

			var file_entry = the_file_entry;

			file_entry.remove(_onRemoveSuccess, _onRemoveError);
		};

		var _onGetFileError = function(the_error) {
			console.log("Error getting file: " + JSON.stringify(the_error));
		};

		var _onRemoveSuccess = function(the_entry) {

			console.log("File removed: " + JSON.stringify(the_entry));

			//delete next file (if any)
			if (files.length > 0) {
				//recursive call to remove next file
				_removeOneFile();
			}
			else {
				//All files removed
				EC.Notification.showToast(EC.Localise.getTranslation("all_media_deleted"), "short");
				deferred.resolve();
			}
		};

		var _onRemoveError = function(the_error) {
			console.log("Error: " + JSON.stringify(the_error));
			EC.Notification.showToast(EC.Localise.getTranslation("generic_error"), "short");
		};

		return module;

	}(EC.File));

