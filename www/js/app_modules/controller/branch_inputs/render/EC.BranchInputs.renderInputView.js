/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.renderInputView = function(the_branch_input, the_value) {

			var branch_input = the_branch_input;
			var branch_value = the_value;

			//render layout based on the input type
			switch(branch_input.type) {

				case EC.Const.TEXT:

					EC.BranchInputTypes.text(branch_value, branch_input);
					break;

				case EC.Const.TEXTAREA:

					EC.BranchInputTypes.textarea(branch_value, branch_input);
					break;

				case EC.Const.INTEGER:

					EC.BranchInputTypes.integer(branch_value, branch_input);
					break;

				case EC.Const.DECIMAL:

					EC.BranchInputTypes.decimal(branch_value, branch_input);
					break;

				case EC.Const.DATE:

					EC.BranchInputTypes.date(branch_value, branch_input);
					break;

				case EC.Const.TIME:

					EC.BranchInputTypes.time(branch_value, branch_input);
					break;

				case EC.Const.RADIO:

					EC.BranchInputTypes.radio(branch_value, branch_input);
					break;

				case EC.Const.CHECKBOX:

					EC.BranchInputTypes.checkbox(branch_value, branch_input);
					break;

				case EC.Const.DROPDOWN:

					EC.BranchInputTypes.dropdown(branch_value, branch_input);
					break;

				case EC.Const.BARCODE:

					EC.BranchInputTypes.barcode(branch_value, branch_input);
					break;

				case EC.Const.LOCATION:

					EC.BranchInputTypes.location(branch_value, branch_input);
					break;

				case EC.Const.PHOTO:

					EC.BranchInputTypes.photo(branch_value, branch_input);
					break;

				//deal with audio recording
				case EC.Const.AUDIO:

					EC.BranchInputTypes.audio(branch_value, branch_input);
					break;

				case EC.Const.VIDEO:

					EC.BranchInputTypes.video(branch_value, branch_input);
					break;

			}//switch

			//remove progress dialog (triggered when loading inputs.html)
			EC.Notification.hideProgressDialog();

		};

		return module;

	}(EC.BranchInputs));
