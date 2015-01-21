/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem*/
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		/* The new file system API will throw an error when trying to create a folder if
		 * a parent does not exist
		 * therefore we have to create the folders to contain the media files.
		 *
		 * -images
		 * -audios
		 * -videos
		 *
		 * in the Documents folder as the iOS permanent storage
		 *
		 * On iOS we create the folders at runtime using Cordova,
		 * while on Android the folders are created using Java code
		 *
		 *
		 */

		var dirs;
		var entry;
		var deferred;

		function onCreateSuccess() {
			_createMediaDir();
		}

		function onCreateFail(error) {
			console.log(error);
			deferred.reject();
		}

		function _createMediaDir() {

			var media_dir;

			if (dirs.length > 0) {

				media_dir = dirs.shift();

				//create a media folder: images, audios, videos
				entry.getDirectory(media_dir, {
					create : true,
					exclusive : false
				}, onCreateSuccess, onCreateFail);

			}
			else {
				console.log("Media folders created");
				deferred.resolve();
			}
		}

		function onIOSRFSSuccess(the_fileSystem) {

			entry = the_fileSystem.root;
			
			//create media folders recursively
			_createMediaDir();

		}

		function onIOSRFSError(error) {
			console.log(error);
			deferred.reject();
		}


		module.createMediaDirs = function() {

			deferred = new $.Deferred();

			dirs = [EC.Const.PHOTO_DIR, EC.Const.AUDIO_DIR, EC.Const.VIDEO_DIR];

			//persistent storage on iOS is the "Documents" folder in the app sandbox
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess, onIOSRFSError);

			return deferred.promise();

		};

		return module;

	}(EC.File));

// //persistent storage on iOS is the "Documents" folder in the app sandbox
// window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onIOSRFSSuccess,
// onIOSRFSError);
//
// function onIOSRFSSuccess(the_fileSystem) {
//
// var entry = the_fileSystem.root;
// var project_dir = window.localStorage.project_name;
//
// //create a directory for this project if it does not exist (destination is the
// // media folder: images, audios, videos)
// entry.getDirectory(destination + project_dir, {
// create : true,
// exclusive : false
// }, onGetIOSDirectorySuccess, onGetIOSDirectoryFail);
//
// function onGetIOSDirectorySuccess(the_dir) {
//
// file.moveTo(the_dir, stored_filename, onMovedOK, onMovedFail);
//
// function onMovedOK(success) {
//
// console.log("files length:" + files.length);
// console.log(JSON.stringify(files));
//
// //map file names to timestamp (for IOS Photos only)
// filenameToTimestamp.push({
// filename : filename,
// timestamp : timestamp
// });
//
// //save next file or trigger callback to save the row
// if (files.length === 0) {
//
// console.log('no more files to save, build rows');
//
// //all files saved, build and save the rows
// if (is_branch) {
// //save rows for branch form
// EC.BranchInputs.buildRows(filenameToTimestamp.slice(0));
//
// }
// else {
// //save rows for main form
// EC.Inputs.buildRows(filenameToTimestamp.slice(0));
//
// }
//
// filenameToTimestamp = null;
//
// }
// else {
// //save next file
// console.log('move another file');
// EC.File.move(files, is_branch);
// }
//
// console.log('file move OK : ' + JSON.stringify(success));
// }
//
// function onMovedFail(error) {
// console.log('onMovedFail:' + JSON.stringify(error));
// }
//
// }
//
// function onGetIOSDirectoryFail(error) {
// console.log("Error creating directory " + error.code);
// }
//
// }
//
// function onIOSRFSError(error) {
// console.log(error);
// }
//
// }
//
// }//onDirReadSuccess
//
// };
//
// return module;
//
// }(
// EC.File));
