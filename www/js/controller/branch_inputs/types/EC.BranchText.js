/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";
	
	module.text = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('div#branch-text div#branch-input-text span.label');
			var clone = $('div#branch-text div#branch-input-text div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;

			//update label text
			span_label.text(input.label);

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
			$('div#branch-input-text input').removeAttr('disabled');

			if (double_entry) {

				//duplicate text input
				clone.removeClass('hidden');
				$('div.clone input').val(value);

				//if in editing mode, do not allow changes  if the field is a primary key
				console.log( typeof input.is_primary_key);
				console.log( typeof input.has_jump);

				if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {

					$('div.clone input').attr('disabled', 'disabled');
				}

			} else {

				//add hidden class if missing
				clone.addClass('hidden');

			}

			$('div#branch-input-text input').val(value);

			//if it is a genkey field, disable input and pre-fill it with the genkey
			if (input.is_genkey === 1 && value === "") {

				$('div#branch-input-text input').attr('disabled', 'disabled').val(EC.Utils.getGenKey());
				return;

			}

			//if in branch editing mode, do not allow changes if the field is a primary key 
			if (window.localStorage.branch_edit_mode && input.is_primary_key === 1) {
				$('div#branch-input-text input').attr('disabled', 'disabled');
				$('div#branch-input-text p.primary-key-not-editable').removeClass("hidden");
			} else {
				
				$('div#branch-input-text p.primary-key-not-editable').addClass("hidden");
			}

		};

	
	return module;
	
}(EC.BranchInputTypes));