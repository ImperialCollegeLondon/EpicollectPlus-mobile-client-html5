/*jslint vars: true , nomen: true*/
var EC = EC || {};
EC.File = EC.File || {};

EC.File = ( function(module) {

		/**
		 * @method restoreFromBackup Read a backup file and insert all the data to the database
		 * @param {Object} the_project_name
		 */
		module.restoreFromBackup = function(the_project_name, the_project_id) {

			var filename = the_project_name + ".txt";
			var backup_path;
			var forms_data = [];
			var branch_data = [];
			var branch_form_names = [];
			var project_id = the_project_id;
			var deferred = new $.Deferred();
			var hierarchy_deferred = new $.Deferred();
			var branch_deferred = new $.Deferred();

			//return promise only when BOTH hierarchy and branch data are saved
			$.when(hierarchy_deferred, branch_deferred).then(function() {
				deferred.resolve();
				console.log("Restore from backup done");
			});

			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

			function gotFS(the_fileSystem) {

				console.log(JSON.stringify(the_fileSystem));

				backup_path = the_fileSystem.root.fullPath;

				the_fileSystem.root.getFile(filename, {
					create : false,
					exclusive : false
				}, gotFileEntry, fail);

				function gotFileEntry(fileEntry) {
					fileEntry.file(gotFile, fail);
				}

				function gotFile(file) {
					//readDataUrl(file);
					readAsText(file);
				}

				function readAsText(file) {

					var reader = new FileReader();

					reader.onloadend = function(evt) {
						console.log("Read as text");
						console.log(evt.target.result);

						forms_data = JSON.parse(evt.target.result);
						console.log(forms_data);

						//check if we have some branches data (last element of forms_data)
						//TODO: test on android 2.3
						if (forms_data[forms_data.length - 1].has_branches == true) {
							//insert branches
							branch_data = forms_data.pop();
							branch_form_names = branch_data.branch_form_names;

							$.when(EC.Select.getBranchFormLocalIDs(project_id, branch_form_names), EC.Select.getBranchInputsLocalIDs(project_id))//
							.then(function(the_mapped_branch_forms, the_mapped_input_ids) {

								console.log(the_mapped_branch_forms);
								console.log(the_mapped_input_ids);

								$.when(EC.Create.insertBranchDataRows(branch_data, the_mapped_branch_forms, the_mapped_input_ids)).then(function() {
									branch_deferred.resolve();
									console.log("Branches rows restored");
								});
							});

						} else {
							//resolve branch deferred immediately as no branches to insert
							branch_deferred.resolve();
						}

						//insert entries per each form recursively, resolve when all done
						$.when(EC.Create.insertAllFormsData(forms_data, branch_data)).then(function() {
							hierarchy_deferred.resolve();
							console.log("Hierarchy entries restored");
						});

					};
					reader.readAsText(file);
				}

			}

			function fail(the_error) {
				console.log(the_error);
				if (the_error.code === 1) {
					EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("no_backup_saved"));
				}
			}

			return deferred.promise();

		};

		return module;

	}(EC.File));
