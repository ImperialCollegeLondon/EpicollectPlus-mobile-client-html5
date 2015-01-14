/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.date = function(the_value, the_input) {

			var datepicker;
			var ios_datepicker;
			var span_label = $('div#branch-date span.label');
			var clone = $('div#branch-date div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;
			var default_date;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Add attribute to flag the primary key input field
			if (parseInt(input.is_primary_key, 10) === 1) {

				span_label.attr('data-primary-key', 'true');

			} else {

				//reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
				span_label.attr('data-primary-key', '');
			}

			//check if we need to replicate this input
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//Android Phonegap DatePicker plugin http://goo.gl/xLrqZl
			datepicker = $('div#branch-input-date input.nativedatepicker');

			//iOS uses the HTML5 input type="date"
			ios_datepicker = $('div#branch-input-date input.ios-date');

			//hide immediate ios date input parent (JQM quirk, this is to hide the div element border wrapping the input after JQM enhanced the markup)
			ios_datepicker.parent().addClass("no-border");

			/* Set current date in custom data attribute.
			 * Important: since Epicollect for some bizzarre reason does not store the timestamps, but a formatted date,
			 * it is impossible to trigger the datapicker to the right data/time value after a saving, as the timestamp is lost
			 * i.e. if I save save 25th march 1988 just as 25/3, I will never get the year back :/ and it will default to the current date
			 * TODO: save date and time values with a timestamp attached
			 */

			datepicker.attr("data-raw-date", new Date());

			/*show default date if input.value = input.datetime_format:
			 *if the option to show the current date as default is selected in the web form builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (value === input.datetime_format) {
				datepicker.val(EC.Utils.parseDate(new Date(), input.datetime_format));
			} else {
				datepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {

				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */

				datepicker.off().on('focus', function(event) {

					var datepicker = $(this);
					var selected_date = new Date(datepicker.attr("data-raw-date"));

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'date', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {

						var new_date = new Date(returned_date);

						datepicker.val(EC.Utils.parseDate(new_date, input.datetime_format));
						datepicker.attr("data-raw-date", new_date);

						// This fixes the problem you mention at the bottom of this script with it not working a second/third time around, because it is in focus.
						datepicker.blur();
					});
				});
			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="date"
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				datepicker.off().on('vclick', function(event) {
					ios_datepicker.focus();
				});

				ios_datepicker.off().on('blur', function(event) {

					var ios_date = ios_datepicker.val();

					datepicker.val(EC.Utils.parseIOSDate(ios_date, input.datetime_format));
					datepicker.attr("data-raw-date", ios_date);
				});
			}
		};

		return module;

	}(EC.BranchInputTypes));
