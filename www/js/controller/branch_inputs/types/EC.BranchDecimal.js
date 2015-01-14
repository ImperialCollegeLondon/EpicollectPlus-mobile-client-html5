/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";
	
	module.decimal = function(the_value, the_input) {

			
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
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
			double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

			//re-enable input if needed
			$('div#branch-input-decimal input').removeAttr('disabled');

			//hide elements not needed
			clone.addClass('not-shown');
			min_range.addClass('not-shown');
			max_range.addClass('not-shown');

			if (double_entry) {

				//duplicate textarea input
				clone.removeClass('not-shown');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes either if the field is a primary key or it triggers a jump
				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			}

			//show min range if any
			if (input.min_range !== "") {

				min_range.removeClass('not-shown');
				min_range.text('Min: ' + input.min_range);

			}

			//show max range if any
			if (input.max_range !== "") {

				max_range.removeClass('not-shown');
				max_range.text('Max: ' + input.max_range);

			}

			$('div#input-decimal input').val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {
				$('div#branch-input-decimal input').attr('disabled', 'disabled');
					$('div#branch-input-decimal p.primary-key-not-editable').removeClass("not-shown");
			} else {
				
				$('div#branch-input-decimal p.primary-key-not-editable').addClass("not-shown");
			}

		};
		
	return module;
	
	}(EC.BranchInputTypes));