/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, LocalFileSystem, FileReader*/

/**
 * @method restoreFromBackup Read a backup file and insert all the data to the
 * the local database
 *
 * @param {Object} the_project_name project name
 * @param {Object} the_project_id project id on local database
 */
var EC = EC || {};
EC.File = EC.File || {};
EC.File = ( function(module) {
		"use strict";

		module.restoreFromBackup = function(the_project_name, the_project_id) {

			var filename = the_project_name + ".txt";
			var backup_path;
			var forms_data = [];
			var branch_data = {};
			var branch_form_names = [];
			var project_id = the_project_id;
			var deferred = new $.Deferred();

			function fail(the_error) {
				console.log(the_error);
				if (the_error.code === 1) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_backup_saved"));
				}
			}

			//get hold of backup file (must be in the public storage folder root (Android
			// only, not possible on iOS))
			function gotFS(the_fileSystem) {

				backup_path = the_fileSystem.root.fullPath;

				the_fileSystem.root.getFile(filename, {
					create : false,
					exclusive : false
				}, function(fileEntry) {

					//got the file entry
					fileEntry.file(function(file) {

						//read the file as text
						readAsText(file);
					}, fail);
				}, fail);

				//When we got the file, read content and save data to db
				function readAsText(file) {

					var reader = new FileReader();

					//When the file has been read write data to DB
					reader.onloadend = function(evt) {

						console.log("Read as text");
						console.log(evt.target.result);

						forms_data = JSON.parse(evt.target.result);
						console.log(forms_data);

						/* get branch data from last element of data array (if any).Branch entries are
						 * not nested within each hierarchy entry but appended at the end. They are
						 * mapped to the unique branch form name each branch input gets
						 *
						 */
						if (forms_data[forms_data.length - 1].has_branches === true) {
							branch_data = forms_data.pop();
						}

						//insert hierarchy entries per each form recursively
						$.when(EC.Create.insertAllFormsData(forms_data, branch_data)).then(function() {

							console.log("Hierarchy entries restored");

							//do we have any branches? - last element of forms_data array contains all the
							// branches
							if (branch_data.branch_data_rows.length > 0) {

								//get branches details
								branch_form_names = branch_data.branch_form_names;

								//get local branch form ids and branch inputs ids to map the backup branch data
								// against
								$.when(EC.Select.getBranchFormLocalIDs(project_id, branch_form_names)).then(function(the_mapped_branch_forms) {
									$.when(EC.Select.getBranchInputsLocalIDs(project_id)).then(function(the_mapped_input_ids) {

										console.log(the_mapped_branch_forms);
										console.log(the_mapped_input_ids);

										//insert all the branch backup data into the ec_branch_data table
										$.when(EC.Create.insertBranchDataRows(branch_data, the_mapped_branch_forms, the_mapped_input_ids)).then(function() {

											// console.log("Branches rows restored");
											deferred.resolve();
										});
									});
								});
							}
							else {
								deferred.resolve();
							}
						});
					};

					//read file as text
					reader.readAsText(file);
				}
			}

			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

			return deferred.promise();
		};

		return module;

	}(EC.File));
