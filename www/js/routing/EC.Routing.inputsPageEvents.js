/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Routing
 */

var EC = window.EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.inputsPageEvents = function () {
    'use strict';

    $(document).on('pageinit', '#feedback', function () {

        console.log('feedback init called');

    });

    $(document).on('pagebeforeshow', '#text', function () {

        //get the #text page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#integer', function () {

        //get the #number page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#decimal', function () {

        //get the #number page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#date', function () {

        //get the #date page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#time', function () {

        //get the #time page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    //#select is dropdown
    $(document).on('pagebeforeshow', '#select', function () {

        //get the #dropdown page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#radio', function () {

        //get the #radio page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

        //@bug in JQM maybe...I do not know any other way to make it work
        $('div#input-radio input:radio').each(function () {

            //if a value is cached, pre-select that radio button option manually triggering a 'vclick' event
            if ($(this).attr('checked')) {
                $(this).next().trigger('vclick');
            }
        });
        //@bug

    });

    $(document).on('pagebeforeshow', '#checkbox', function () {

        //get the #checkbox page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#textarea', function () {

        //get the #textarea page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagecreate', '#textarea', function () {
        //EC.Utils.updateFormCompletion(false);
    });

    $(document).on('pagebeforeshow', '#location', function () {

        //get the #location page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#photo', function () {

        //get the #photo page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#video', function () {

        //get the #video page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#audio', function () {

        //get the #audio page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });
    $(document).on('pagebeforeshow', '#barcode', function () {

        //get the #barcode page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    $(document).on('pagebeforeshow', '#branch', function () {

        //reset cached branch objects in localStorage
        window.localStorage.removeItem('branch_current_position');
        window.localStorage.removeItem('branch_entries');
        window.localStorage.removeItem('branch_form_has_jumps');
        window.localStorage.removeItem('branch_form_id');
        window.localStorage.removeItem('branch_form_name');
        window.localStorage.removeItem('branch_inputs_total');
        window.localStorage.removeItem('branch_inputs_trail');
        window.localStorage.removeItem('branch_inputs_values');

        //get the #branch page and inject the input data
        EC.Inputs.renderInput(EC.Inputs.getInputAt(window.localStorage.current_position));

    });

    $(document).on('pagebeforeshow', '#branch-entries', function () {

        //get the #branch-entries page and inject the input data
        EC.Entries.getBranchEntriesList();

    });

    $(document).on('pagebeforeshow', '#branch-entry-values', function (e) {

        //get full url with query string
        var $query_param = e.delegateTarget.baseURI;

        //get the #branch page and inject the input data
        EC.Entries.getBranchEntryValues(decodeURI($query_param));

    });

    $(document).on('pageshow', '#branch-entry-values', function () {
        EC.Notification.hideProgressDialog();
    });

    $(document).on('pagebeforeshow', '#save-confirm', function () {
        //Ask save confirmation to use
        EC.Inputs.renderSaveConfirmView();
    });

    $(document).on('pagebeforeshow', '#feedback', function () {

        //Show feedback to user
        EC.Inputs.renderFeedbackView();

    });

    /********************************************************/
    //force close the activity spinner loader
    $(document).on('pageshow', '#branch-entries', function () {
        EC.Notification.hideProgressDialog();
    });
    $(document).on('pageshow', '#branch-entry-values', function () {
        EC.Notification.hideProgressDialog();
    });
    /********************************************************/

};
