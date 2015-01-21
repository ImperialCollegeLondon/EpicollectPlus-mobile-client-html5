/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
		"use strict";

		module.barcode = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var scanner = $('div#branch-barcode div#branch-input-barcode div#scanner');
			var scanner_confirm = $('div#branch-barcode div#branch-input-barcode div#scanner-confirm');
			var scan_result = $('div#branch-barcode div#branch-input-barcode input#scan-result');
			var scan_result_confirm = $('div#branch-barcode div#branch-input-barcode input#scan-result-confirm');

			//update label text
			span_label.text(input.label);

			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			}
			else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we
				// recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//reset buttons
			scanner.removeClass('ui-disabled');
			scanner_confirm.removeClass('ui-disabled');

			scan_result.val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			// or it triggers a jump
			if (window.localStorage.branch_edit_mode && input.is_primary_key === '1') {

				//disable scan button
				scanner.addClass('ui-disabled');
				$('div#branch-input-barcode p.primary-key-not-editable').removeClass("not-shown");
			}
			else {
				$('div#branch-input-barcode p.primary-key-not-editable').addClass("not-shown");
			}

			if (double_entry) {

				//duplicate text input
				clone.removeClass('not-shown');
				scan_result_confirm.val(value);

				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					//disable clone scan button
					scanner_confirm.addClass('ui-disabled');
				}

				//add event handler to second scan button
				scanner_confirm.on('vclick', function() {

					//flag needed to handle case when user dismiss the barcode scanner
					window.localStorage.is_dismissing_barcode = 1;

					window.plugins.barcodeScanner.scan(function(result) {
						//alert("We got a barcode\n" + "Result: " + result.text + "\n" + "Format: " +
						// result.format + "\n" + "Cancelled: " +
						// result.cancelled);

						scan_result_confirm.val(result.text);

					}, function(error) {

						EC.Notification.showAlert("Scanning failed", error);

					});

				});

			}
			else {

				//add not-shown class if missing
				clone.addClass('not-shown');

			}

			//set handlers for scan button
			scanner.on('vclick', function() {

				//flag needed to handle case when user dismiss the barcode scanner
				window.localStorage.is_dismissing_barcode = 1;

				window.plugins.barcodeScanner.scan(function(result) {
					//alert("We got a barcode\n" + "Result: " + result.text + "\n" + "Format: " +
					// result.format + "\n" + "Cancelled: " +
					// result.cancelled);

					scan_result.val(result.text);

				}, function(error) {
					EC.Notification.showAlert("Scanning failed", error);
				});

			});

		};

		return module;

	}(EC.BranchInputTypes));
