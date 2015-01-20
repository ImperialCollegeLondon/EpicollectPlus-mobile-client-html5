/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {
		"use strict";

		module.time = function(the_value, the_input) {

			var timepicker;
			var ios_timepicker;
			var span_label = $('div#branch-input-time span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var datebox_format;

			//update label text
			span_label.text(input.label + " - " + input.datetime_format);

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

			//Android Phonegap timepicker plugin http://goo.gl/xLrqZl
			timepicker = $('div#branch-input-time input.nativedatepicker');

			//iOS uses the HTML5 input type="time"
			ios_timepicker = $('div#branch-input-time input.ios-time');

			//hide immediate ios time input parent (JQM quirk, this is to hide the div
			// element border wrapping the input after JQM enhanced the markup)
			ios_timepicker.parent().addClass("no-border");

			/*show default date if input.value = input.datetime_format:
			 *if the option to show the current date as default is selected in the web form
			 * builder,
			 * the input value gets the value of datetime_format when parsing the xml
			 */
			if (input.datetime_format === input.default_value) {
				timepicker.val(EC.Utils.parseTime(new Date(), input.datetime_format));
			}
			else {
				//show cached value
				timepicker.val(value);
			}

			/*****************************************************************************************
			 * Android uses the Phonegap official DatePicker plugin
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.ANDROID) {
				/* bind input to 'vclick' insted of focus, as we set the input as readonly.
				 * this solved problem on android 2.3 where the keyboard was showing because the
				 * input is in focus when tapping "cancel"
				 * on the DatePicker popup
				 */
				timepicker.off().on('focus', function(event) {

					var timepicker = $(this);
					var selected_date = Date.parse(timepicker.val()) || new Date();

					// Same handling for iPhone and Android
					window.plugins.datePicker.show({
						date : selected_date,
						mode : 'time', // date or time or blank for both
						allowOldDates : true
					}, function(returned_date) {

						var new_date;

						if (returned_date !== undefined) {

							new_date = new Date(returned_date);

							timepicker.val(EC.Utils.parseTime(new_date, input.datetime_format));
						}

						// This fixes the problem you mention at the bottom of this script with it not
						// working a second/third time around, because it is in focus.
						timepicker.blur();
					});
				});
			}

			/*****************************************************************************************
			 * iOS uses the official HTML5 input type="time", only hours and minutes are
			 * returned
			 ****************************************************************************************/
			if (window.device.platform === EC.Const.IOS) {

				timepicker.off().on('vclick', function(event) {

					ios_timepicker.focus();

				});

				ios_timepicker.off().on('blur', function(event) {

					var ios_time = ios_timepicker.val();

					//get seconds (based on current time)
					var date = new Date(event.timeStamp);
					var seconds = date.getSeconds();

					//add seconds to have a string like HH:mm:ss
					ios_time = ios_time + ":" + seconds;

					timepicker.val(EC.Utils.parseIOSTime(ios_time, input.datetime_format));
					timepicker.attr("data-raw-date", ios_time);

				});
			}
		};

		return module;

	}(EC.BranchInputTypes));
