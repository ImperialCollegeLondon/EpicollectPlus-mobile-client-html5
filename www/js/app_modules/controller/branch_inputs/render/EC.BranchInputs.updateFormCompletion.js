/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 *	@module EC
 *  @submodule BranchInputs
 *
 */
var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = ( function(module) {"use strict";

		module.updateFormCompletion = function(the_position, the_length) {

			var ratio = Math.ceil(100 * (the_position - 1) / the_length);
			var percentage_bar = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar div.progress.progress_tiny');
			var percentage_txt = $('div.ui-grid-b.branch-input-nav-tabs div.input-progress-bar span.form-completion-percent');

			percentage_txt.text(ratio + "%");
			percentage_bar.css("width", ratio + "%");

		};

		return module;

	}(EC.BranchInputs));
