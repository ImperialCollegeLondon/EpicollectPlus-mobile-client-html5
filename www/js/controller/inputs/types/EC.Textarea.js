/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.textarea = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

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
			$('div#input-textarea textarea').removeAttr('disabled');

			if (double_entry) {

				//duplicate textarea input
				clone.removeClass('hidden');
				$('div.clone textarea').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				if (window.localStorage.edit_mode && input.is_primary_key === 1) {

					$('div.clone textarea').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			//Set value
			$('div#input-textarea textarea').val(value);

			//if in editing mode, do not allow changes either if the field is a primary key
			if (window.localStorage.edit_mode && input.is_primary_key === 1) {

				$('div#input-textarea textarea').attr('disabled', 'disabled');
				$('div#input-textarea p.primary-key-not-editable').removeClass("hidden");
			}
			else{
				$('div#input-textarea p.primary-key-not-editable').addClass("hidden");
			}
			
			

		};

		return module;

	}(EC.InputTypes)); 