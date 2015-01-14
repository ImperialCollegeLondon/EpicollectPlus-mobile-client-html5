/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.goBack = function(the_page_id) {"use strict";

	var page_id = the_page_id;
	var back_btn = null;
	var inactive_tab = null;

	var input_views_ids = [//
	"audio", //
	"barcode", //
	"branch", //
	"checkbox", //
	"date", //
	"decimal", //
	"integer", //
	"location", //
	"photo", //
	"radio", //
	"save-confirm", // 
	"save-feedback", //
	"select", //
	"text", //
	"textarea", //
	"time", //
	"video"//
	];

	var branch_input_views_ids = [//
	"branch-audio", //
	"branch-barcode", //
	"branch-branch", //
	"branch-checkbox", //
	"branch-date", //
	"branch-decimal", //
	"branch-integer", //
	"branch-location", //
	"branch-photo", //
	"branch-radio", //
	"branch-save-confirm", //
	"branch-save-feedback", //
	"branch-select", //
	"branch-text", //
	"branch-textarea", //
	"branch-time", //
	"branch-video"//
	];

	var hierarchy_views_ids = [//
	"forms", //
	"entries", //
	"entry-values" //
	];

	var branch_views_ids = [//
	"branch-entries", //
	"branch-entry-values" //
	];

	var action_views_ids = [//
	"settings", //
	"add-project", //
	"email-backup", //
	"upload", //
	"download" //
	];
	//

	//if the page is an input view, back button will perform the same action as the top left back button on screen
	if (EC.Utils.inArray(input_views_ids, page_id)) {

		//force a click to on screen back button
		back_btn = $("div#" + page_id + " div[data-role='header'] div[data-href='back-btn']");
		back_btn.trigger("vclick");

	}

	//if the page if a branch input view, back button will perform the same action as the top left back button on screen
	if (EC.Utils.inArray(branch_input_views_ids, page_id)) {

		//force a click to on screen back button
		back_btn = $("div#" + page_id + " div[data-role='header'] div[data-href='back-btn']");
		back_btn.trigger("vclick");

	}

	//if the page is one of the hierarchy dynamic navigation pages, the back button will perform the same action as the left tab button on screen
	if (EC.Utils.inArray(hierarchy_views_ids, page_id)) {

		//force a click to on screen back button
		inactive_tab = $('div#' + page_id +' div[data-role="header"] div[data-role="navbar"] ul li.inactive-tab');
		inactive_tab.trigger("vclick");

	}

	
	//if the page if a action view, back button will perform the same action as the top left back button on screen
	if (EC.Utils.inArray(action_views_ids, page_id)) {

		//force a click to on screen back button
		back_btn = $("div#" + page_id + " div[data-role='header'] div[data-href='back-btn']");
		back_btn.trigger("vclick");

	}

};
