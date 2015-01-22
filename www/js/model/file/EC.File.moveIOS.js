/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		/* IOS
		 *
		 * Move files from temporary (tmp) folder to persistent (Documents) folder
		 *
		 *
		 * subfolders:
		 * /images
		 * /audios
		 * /videos
		 *
		 * /<project_name>
		 *
		 *  @param {array} the_files - array of file objects like:
		 * {
		 *      type: <input type>,
		 *      ref: <input ref>,
		 *      cached: <file path on the filesystem for cached files>,
		 *      stored: <file path on the filesystem for stored files>
		 * }
		 *
		 * @return void, but it triggers a recursive call to itself after each file is
		 * moved successfully.
		 *
		 * When all files are saved, it calls EC.Inputs.buildRows() to save all the input
		 * fields related to this form and media to the db
		 */

		var filenameToTimestamp;

		module.move = function(the_files, is_branch_flag) {

			//Get media directory based on the type of file
			function _getMediaDir(the_file_type) {

				var type = the_file_type;
				var dir;

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

				return dir;

			}

			var files = the_files;
			var is_branch = is_branch_flag;

			//get details for current file
			var file = files.shift();

			//keep track of timestamp as Cordova iOS returns a weird filename which is always
			// the same per "session"
			if (!filenameToTimestamp) {
				filenameToTimestamp = [];
			}

			console.log("files: " + JSON.stringify(file));

			var cached_filepath = file.cached;
			var stored_filepath = file.stored;
			var parts;
			var filename;
			var filename_parts;
			var extension;
			var ref = file.ref;
			var destination = _getMediaDir(file.type);

			console.log();

			if (cached_filepath === "" || cached_filepath === undefined) {

				//we do not have a cached file to move, skip to next file (if any)
				if (files.length === 0) {

					//all files saved, build and save the rows
					if (is_branch) {
						//save rows for branch form
						EC.BranchInputs.buildRows();
					}
					else {
						//save rows for main form
						EC.Inputs.buildRows();
					}

				}
				else {

					EC.File.move(files, is_branch);

				}
			}
			else {

				console.log("cached filepath: " + JSON.stringify(cached_filepath));

				//we have a cache file to move
				parts = cached_filepath.split('/');
				filename = parts[parts.length - 1];
				filename_parts = filename.split(".");
				extension = filename_parts[filename_parts.length - 1];

				//request temporary folder from file system
				window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);

			}

			console.log("stored filepath:" + stored_filepath);

			function gotFS(the_file_system) {

				//create a directory reader to read files inside the temporary folder
				var fs = the_file_system;
				var dir = fs.root.createReader();
				dir.readEntries(onDirReadSuccess, onDirReadError);

				function onDirReadSuccess(the_dir_entries) {

					var dir_entries = the_dir_entries;
					var i;
					var iLength = dir_entries.length;

					//loop all the files in the temporary directory to find the one we want to move
					for ( i = 0; i < iLength; i++) {

						console.log("dir_entries[i].name" + dir_entries[i].name);
						console.log("filename" + filename);

						//if the current file name matches the file name we want to save, move the file
						if (dir_entries[i].name === filename) {

							fs.root.getFile(dir_entries[i].name, {
								create : false
							}, processEntry, onFileError);
						}
						else {
							
							
							//TODO check this! It was causing problems on Android
							/********************************************************************************/
							//no match? It can happen when no audio file was saved for the current entry, so
							// save the entry data only
							//save next file or trigger callback to save the row
							if (files.length === 0) {

								console.log('no more files to save, build rows');

								//all files saved, build and save the rows
								if (is_branch) {
									//save rows for branch form
									EC.BranchInputs.buildRows();
								}
								else {
									//save rows for main form
									EC.Inputs.buildRows();
								}

							}
							else {
								//save next file
								console.log('move another file');
								EC.File.move(files, is_branch);
							}
						}
						/**********************************************************************************/

					}//for

					//process the file
					function processEntry(the_entry) {
						console.log("processEntry called");

						var file = the_entry;
						var project_name = window.localStorage.project_name;
						var form_name = window.localStorage.form_name;
						var uuid = EC.Utils.getPhoneUUID();
						var stored_filename;

						//For photos, generate a timestamp as a file name (Cordova iOS always generates
						// the same names when capturing photos)
						var timestamp = parseInt(new Date().getTime() / 1000, 10);

						//Create a new file or override existing one
						if (stored_filepath === "") {

							//build file name in the format <form_name>_<ref>_<uuid>_filename
							stored_filename = form_name + "_" + ref + "_" + uuid + "_" + timestamp + "." + extension;

						}
						else {

							parts = stored_filepath.split("/");
							stored_filename = parts[parts.length - 1];

							console.log("stored_filename" + stored_filename);
						}

						//persistent storage on iOS is the "Documents" folder in the app sandbox
						window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess, onIOSRFSError);

						function onIOSRFSSuccess(the_fileSystem) {

							console.log("onIOSRFSSuccess called");

							var entry = the_fileSystem.root;
							var project_dir = window.localStorage.project_name;

							console.log("destination + project_dir " + destination + project_dir);

							//create a directory for this project if it does not exist (destination is the
							// media folder: images, audios, videos)
							entry.getDirectory(destination + project_dir, {
								create : true,
								exclusive : false
							}, onGetIOSDirectorySuccess, onGetIOSDirectoryFail);

							function onGetIOSDirectorySuccess(the_dir) {

								file.moveTo(the_dir, stored_filename, onMovedOK, onMovedFail);

								function onMovedOK(success) {

									console.log("files length:" + files.length);
									console.log(JSON.stringify(files));

									//map file names to timestamp (for IOS Photos only)
									filenameToTimestamp.push({
										filename : filename,
										timestamp : timestamp
									});

									//save next file or trigger callback to save the row
									if (files.length === 0) {

										console.log('no more files to save, build rows');

										//all files saved, build and save the rows
										if (is_branch) {
											//save rows for branch form
											EC.BranchInputs.buildRows(filenameToTimestamp.slice(0));

										}
										else {
											//save rows for main form
											EC.Inputs.buildRows(filenameToTimestamp.slice(0));

										}

										filenameToTimestamp = null;

									}
									else {
										//save next file
										console.log('move another file');
										EC.File.move(files, is_branch);
									}

									console.log('file move OK : ' + JSON.stringify(success));
								}

								function onMovedFail(error) {
									console.log('onMovedFail:' + JSON.stringify(error));
								}

							}

							function onGetIOSDirectoryFail(error) {
								console.log("Error creating directory " + error.code);
							}

						}

						function onIOSRFSError(error) {
							console.log(error);
						}

					}

				}//onDirReadSuccess

				function onDirReadError(error) {
					console.log('onDirReadError: ' + JSON.stringify(error));
				}//onDirReadError

				function onFileError(error) {
					console.log('onFileError ' + JSON.stringify(error));
				}//onFileError

			}//gotFS

			function fail(error) {
				console.log('fail' + JSON.stringify(error));
			}//fail

		};
		//moveFile

		return module;

	}(EC.File));
