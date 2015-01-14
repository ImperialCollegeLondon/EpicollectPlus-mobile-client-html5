/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Ui = EC.Ui || {};
EC.Ui = {

	bindBtnStates : function() {"use strict";

		//bind events to apply hover effect on buttons (Action Bar)
		$(document).on('vmousedown', 'div.ui-btn-right', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'div.ui-btn-right', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background", "none");

		});

		//bind events to apply hover effect on action buttons large (Action Bar top left)
		$(document).on('vmousedown', 'div.h-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'div.h-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background", "none");

		});

		//bind events to apply hover effect on navigation list item (sidebar options)
		$(document).on('vmousedown', 'li.v-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'li.v-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#DDDDDD");

		});

		//bind events to apply hover effect on autocomplete list items
		$(document).on('vmousedown', 'li.h-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'li.h-nav-item', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#DDDDDD");

		});

		// //bind events to apply hover effect on navbar(secondary navigation)
		$(document).on('vmousedown', 'li.inactive-tab', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'li.inactive-tab', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#EEEEEE");

		});

		//bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
		$(document).on('vmousedown', '.input-prev-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', '.input-prev-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#EEEEEE");

		});

		//bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
		$(document).on('vmousedown', '.input-next-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', '.input-next-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#EEEEEE");

		});

		//bind events to apply hover effect on embedded buttons
		$(document).on('vmousedown', 'div.embedded-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', 'div.embedded-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#EEEEEE");

		});

		//bind events to apply hover effect on embedded buttons
		$(document).on('vmousedown', 'i.fa-ep-entry-value-embedded-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("color", "#FFB870");

		});

		$(document).on('vmouseup', 'i.fa-ep-entry-value-embedded-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("color", "#000000");

		});

		//bind events to apply hover effect on "show more" buttons
		$(document).on('vmousedown', '.more-items-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#FFB870");

		});

		$(document).on('vmouseup', '.more-items-btn', function(e) {

			e.preventDefault();
			e.stopPropagation();

			$(this).css("background-color", "#EEEEEE");

		});

	}
};

