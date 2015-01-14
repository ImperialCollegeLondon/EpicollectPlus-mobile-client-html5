/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, xml2json*/
/*
 * @module EC
 * @submodulemodule Parser
 */
var EC = EC || {};
EC.Parse = ( function(module) {"use strict";

		module.parseXML = function(the_data) {

			var self = this;
			var data = the_data;
			var i;
			var iLength;
			var malformed_json = "";
			var json = "";
			var obj;
			var form_has_media;
			var form_has_branches;
			var raw_forms = [];

			self.form_key = "";
			self.parsed_forms = [];
			self.form_inputs_positions = [];

			/* Map each form inputs against its position in the form:
			 * we do this because converting from xml to json it will group the same tags together therefore we would lose the inputs real order */
			self.form_inputs_positions = self.mapPositionToInput(data);

			console.log(self.form_inputs_positions, true);

			//remove "undefined" from json string (workaround to deal with ECML custom data format)
			malformed_json = xml2json(data);

			json = malformed_json.replace("undefined", "");

			console.log('json');
			console.log(json);

			//json string to object
			try {
				obj = JSON.parse(json);
			} catch (error) {
				//escape backslashes (found in regex, for example) -> double check cos it is working better without
				json = json.replace(/\\/g, "\\\\");
				obj = JSON.parse(json);

			}

			//get project details (access properties with @ as array keys)
			self.project = {
				name : obj.ecml.model.submission["@projectName"], //
				allowDownloadEdits : obj.ecml.model.submission["@allowDownloadEdits"], //
				version : obj.ecml.model.submission["@versionNumber"],
				downloadFromServer : obj.ecml.model.downloadFromServer,
				uploadToServer : obj.ecml.model.uploadToServer
			};

			//get the forms in raw format (with @ etc...)
			raw_forms = obj.ecml.form;

			//if no forms for this project, exit and warn user project xml is wrong
			if (raw_forms === undefined) {

				return false;
			}

			//cache lenght (with a single form project length defaults to 1 as the length property will be undefined)
			iLength = raw_forms.length || 1;

			//convert object to array (when it is a single form)
			if (iLength === 1) {
				raw_forms = [raw_forms];
			}

			console.log(self.project);

			//kepp track of number of form per type
			self.project.total_hierarchy_forms = 0;
			self.project.total_branch_forms = 0;

			//parse all the raw forms to have objects in proper format
			for ( i = 0; i < iLength; i++) {

				var form_obj = raw_forms[i];
				var type = "";
				//cache form number to be passed later to parseInput functions
				var form_num = form_obj["@num"];
				var form_type = (form_obj["@main"] === "false") ? "branch" : "main";
				var form_name = form_obj["@name"];

				//clear input_list
				self.input_list.length = 0;

				//clear genkey hidden flag
				self.is_form_genkey_hidden = 0;

				//store a flag to indicate the current form has at least 1 media input
				form_has_media = 0;

				//store a flag to indicate the current form has at least 1 branch
				form_has_branches = 0;

				//store the current form key for later use
				self.form_key = form_obj["@key"];

				//get form attribute
				self.parsed_forms.push({

					num : form_num,
					name : form_name,
					key : self.form_key

				});

				/*if @main is defined this is a form of type main, else it is a branch
				 *
				 */
				self.parsed_forms[i].type = form_type;

				/*	Parse single value form inputs/custom tags
				*   if a tag is not undefined, it can be either an Object (single occurrence) or Array of Objects (multiple occurrences)
				*	also add the form 'num' attribute to each input to reference the right form when storing the inputs to db
				*/

				//parse all the input tags (set as type text)
				if (form_obj.input !== undefined) {

					type = "text";

					if (Array.isArray(form_obj.input)) {
						self.parseInputArray(form_obj.input, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.input, type, form_num, form_type, form_name);
					}
				}

				//parse barcode tags (set as type barcode)
				if (form_obj.barcode !== undefined) {

					type = "barcode";

					if (Array.isArray(form_obj.barcode)) {
						self.parseInputArray(form_obj.barcode, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.barcode, type, form_num, form_type, form_name);
					}

				}

				//parse location tags (set as type location)
				if (form_obj.location !== undefined) {

					type = "location";

					if (Array.isArray(form_obj.location)) {
						self.parseInputArray(form_obj.location, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.location, type, form_num, form_type, form_name);
					}
				}

				//parse audio tags (set as type audio)
				if (form_obj.audio !== undefined) {

					type = "audio";
					form_has_media = 1;

					if (Array.isArray(form_obj.audio)) {
						self.parseInputArray(form_obj.audio, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.audio, type, form_num, form_type, form_name);
					}
				}

				//parse video tags (set as type video)
				if (form_obj.video !== undefined) {

					type = "video";
					form_has_media = 1;

					if (Array.isArray(form_obj.video)) {
						self.parseInputArray(form_obj.video, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.video, type, form_num, form_type, form_name);
					}

				}

				//parse photo tags (set as type photo)
				if (form_obj.photo !== undefined) {

					type = "photo";
					form_has_media = 1;

					if (Array.isArray(form_obj.photo)) {
						self.parseInputArray(form_obj.photo, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.photo, type, form_num, form_type, form_name);
					}

				}

				//parse textarea tags (set as type textarea)
				if (form_obj.textarea !== undefined) {

					type = "textarea";

					if (Array.isArray(form_obj.textarea)) {
						self.parseInputArray(form_obj.textarea, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.textarea, type, form_num, form_type, form_name);
					}

				}

				/*
				* Parse tags which allows selection from multiple values (drodpdown, checkbox, radio )
				*
				*  ! select -> checkbox
				*  ! select1 -> select (dropdown)
				*  ! radio -> radio button
				*
				*  Each sets of possible values is within the itme array
				*/

				//parse radio tags (set as type radio)
				if (form_obj.radio !== undefined) {

					type = "radio";

					if (Array.isArray(form_obj.radio)) {
						self.parseInputArray(form_obj.radio, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.radio, type, form_num, form_type, form_name);
					}

				}

				//parse select1 tags (set as type select)
				if (form_obj.select1 !== undefined) {

					type = "select";

					if (Array.isArray(form_obj.select1)) {
						self.parseInputArray(form_obj.select1, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.select1, type, form_num, form_type, form_name);
					}
				}

				//parse select tags (set as type checkbox)
				if (form_obj.select !== undefined) {

					type = "checkbox";

					if (Array.isArray(form_obj.select)) {
						self.parseInputArray(form_obj.select, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.select, type, form_num, form_type, form_name);
					}

				}

				//parse <branch> tag (set as type bracnh)
				if (form_obj.branch !== undefined) {

					type = "branch";
					form_has_branches = 1;

					if (Array.isArray(form_obj.branch)) {
						self.parseInputArray(form_obj.branch, type, form_num, form_type, form_name);
					} else {
						self.parseInputObject(form_obj.branch, type, form_num, form_type, form_name);
					}
				}

				/*
				* After all the field tags have been parsed, store input list for the current form and clear it for next form
				*/

				//store list of inputs for current form (hierarchy-> main=true, branch->main=false)
				if (form_obj["@main"] === "true") {
					self.inputs.push({
						num : form_obj["@num"],
						input_list : self.input_list.slice(0)
					});

					//count current form as hierarchy
					self.project.total_hierarchy_forms++;

				} else {
					self.branch_inputs.push({
						num : form_obj["@num"],
						input_list : self.input_list.slice(0)
					});

					//count current form as branch
					self.project.total_branch_forms++;
				}

				//add total number of inputs to current parsed form object
				self.parsed_forms[i].total_inputs = self.input_list.length;

				//add is_form_genkey_hidden flag, meaning the input field with the auto generated key will not be shown
				self.parsed_forms[i].is_form_genkey_hidden = self.is_form_genkey_hidden;

				//add flag to see if a form contains media input
				self.parsed_forms[i].has_media = form_has_media;

				//add flag to see if a form contains branches
				self.parsed_forms[i].has_branches = form_has_branches;

			}//for each raw_forms

			console.log("Parsed forms");
			console.log(self.parsed_forms, true);

		};

		return module;

	}(EC.Parse));
