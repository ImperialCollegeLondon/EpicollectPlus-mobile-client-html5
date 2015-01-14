/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 * @module EC
 */
var EC = EC || {};

/* Remove one or more files from a project
 *
 * @submodule File
 * @method remove
 * @param {string} the_project_name - the name of the project
 * @param {array} files - array of file names
 *
 */
EC.File = EC.File || {};
EC.File = ( function(module) {"use strict";

		var project_name;
		var files = [];
		var self;
		var rows_deleted;
		var deferred;

		module.remove = function(the_project_name, the_files) {

			var parts;
			var dir;
			var ext;
			var filename;

			self = this;
			deferred = new $.Deferred();

			//get files details
			project_name = the_project_name;
			files = the_files;

			//get a sinlge file
			filename = files.shift();

			//get directory from file extension
			parts = filename.split(".");
			ext = parts[parts.length - 1];

			switch(ext) {

				case "jpg":
					dir = EC.Const.PHOTO_DIR;
					break;

				case "mp4":
					dir = EC.Const.AUDIO_DIR;
					break;

			}

			_removeOneFile(filename, dir);

			return deferred.promise();

		};

		var _removeOneFile = function(the_filename, the_dir) {

			var filename = the_filename;
			var dir = the_dir;
			var full_path;

			full_path = EC.Const.ANDROID_APP_PRIVATE_URI + dir + project_name + "/" + filename;

			console.log("file full path: " + full_path);

			//get file entry
			window.resolveLocalFileSystemURI(full_path, _onGetFileSuccess, _onGetFileError);

		};

		var _onGetFileSuccess = function(the_file_entry) {

			var file_entry = the_file_entry;

			console.log(file_entry);

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
				self.remove(project_name, files);
			} else {

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

