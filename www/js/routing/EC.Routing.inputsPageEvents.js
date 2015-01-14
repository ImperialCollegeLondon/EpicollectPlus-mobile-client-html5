/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Routing
 */

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.inputsPageEvents = function() {"use strict";

	$(document).on('pageinit', '#feedback', function() {

		console.log("feedback init called");

	});

	$(document).on("pagebeforeshow", "#text", function(e) {

		//get the #text page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#integer", function(e) {

		//get the #number page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#decimal", function(e) {

		//get the #number page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#date", function(e) {

		//get the #date page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#time", function(e) {

		//get the #time page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});

	//#select is dropdown
	$(document).on("pagebeforeshow", "#select", function(e) {

		//get the #dropdown page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#radio", function(e) {

		//get the #radio page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

		//@bug in JQM maybe...I do not know any other way to make it work
		$('div#input-radio input:radio').each(function(i) {

			//if a value is cached, pre-select that radio button option manually triggering a 'vclick' event
			if ($(this).attr('checked')) {
				$(this).next().trigger('vclick');
			}
		});
		//@bug

	});

	$(document).on("pagebeforeshow", "#checkbox", function(e) {

		//get the #checkbox page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#textarea", function(e) {

		//get the #textarea page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagecreate", "#textarea", function(e) {
		//EC.Utils.updateFormCompletion(false);
	});

	$(document).on("pagebeforeshow", "#location", function(e) {

		//get the #location page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#photo", function(e) {

		//get the #photo page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#video", function(e) {

		//get the #video page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#audio", function(e) {

		//get the #audio page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});
	$(document).on("pagebeforeshow", "#barcode", function(e) {

		//get the #barcode page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});

	$(document).on("pagebeforeshow", "#branch", function(e) {

		//reset cached branch objects in localStorage
		window.localStorage.removeItem("branch_current_position");
		window.localStorage.removeItem("branch_entries");
		window.localStorage.removeItem("branch_form_has_jumps");
		window.localStorage.removeItem("branch_form_id");
		window.localStorage.removeItem("branch_form_name");
		window.localStorage.removeItem("branch_inputs_total");
		window.localStorage.removeItem("branch_inputs_trail");
		window.localStorage.removeItem("branch_inputs_values");

		//get the #branch page and inject the input data
		EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

	});

	$(document).on("pagebeforeshow", "#branch-entries", function(e) {

		//get the #branch-entries page and inject the input data
		EC.Entries.getBranchEntriesList();

	});

	$(document).on("pagebeforeshow", "#branch-entry-values", function(e, data) {

		//get full url with query string
		var $query_param = e.delegateTarget.baseURI;

		//get the #branch page and inject the input data
		EC.Entries.getBranchEntryValues(decodeURI($query_param));

	});

	$(document).on("pageshow", "#branch-entry-values", function() {
		EC.Notification.hideProgressDialog();
	});

	$(document).on("pagebeforeshow", "#save-confirm", function(e) {
		//Ask save confirmation to use
		EC.Inputs.renderSaveConfirmView();
	});

	$(document).on("pagebeforeshow", "#feedback", function(e) {

		//Show feedback to user
		EC.Inputs.renderFeedbackView();

	});
	
	/********************************************************/
	//force close the activity spinner loader
	$(document).on("pageshow", "#branch-entries", function(e) {
		EC.Notification.hideProgressDialog();
	});
	$(document).on("pageshow", "#branch-entry-values", function(e) {
		EC.Notification.hideProgressDialog();
	});
	/********************************************************/

};
