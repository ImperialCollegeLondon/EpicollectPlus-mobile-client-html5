var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.integer = function(the_value, the_input) {

			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = parseInt(the_value, 10);
			var input = the_input;
			var min_range = $('span.min-range');
			var max_range = $('span.max-range');

			//update label text
			span_label.text(input.label);

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
			double_entry = (parseInt(input.has_double_check, 10) == 1);

			//trigger numeric keyboard on iOS
			if (window.device.platform === EC.Const.IOS) {
				$('div#input-integer input').attr('pattern', '[0-9]*');
			}

			//hide elements not needed
			clone.addClass('hidden');
			min_range.addClass('hidden');
			max_range.addClass('hidden');

			//check if we need to render a double entry for this input
			if (double_entry) {

				//duplicate integer input
				clone.removeClass('hidden');
				$('div.clone input').val(value  = isNaN(value) ? "" : value);

				//if in editing mode, do not allow changes either if the field is a primary key
				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			}
			//show min range if any
			if (input.min_range !== "") {

				min_range.removeClass('hidden');
				min_range.text('Min: ' + input.min_range);

			}

			//show max range if any
			if (input.max_range !== "") {

				max_range.removeClass('hidden');
				max_range.text('Max: ' + input.max_range);

			}

			$('div#input-integer input').val(value  = isNaN(value) ? "" : value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.edit_mode && input.is_primary_key === 1) {
				$('div#input-integer input').attr('disabled', 'disabled');
				$('div#input-integer p.primary-key-not-editable').removeClass("hidden");
			} else {
				//re-enable input if needed
				$('div#input-integer input').removeAttr('disabled');
				$('div#input-integer p.primary-key-not-editable').addClass("hidden");
			}

		};

		return module;

	}(EC.InputTypes));
