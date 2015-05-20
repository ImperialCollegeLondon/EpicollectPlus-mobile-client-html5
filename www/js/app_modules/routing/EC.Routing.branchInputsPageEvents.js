/*jslint vars: true , nomen: true, devel: true, plusplus: true*/
/*global $, jQuery*/

/**
 * @module EC
 * @submodule Routing
 */

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.branchInputsPageEvents = function () {
    'use strict';

    $(document).on('pageinit', '#branch-feedback', function () {
        console.log('feedback init called');
    });

    /********BRANCH INPUT TEXT*********/
    $(document).on('pagebeforeshow', '#branch-text', function (e) {
        //get the branch-text.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-text', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /**********************************/

    /********BRANCH INPUT INTEGER*********/
    $(document).on('pagebeforeshow', '#branch-integer', function (e) {
        //get the branch-integer.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-integer', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT DECIMAL*********/
    $(document).on('pagebeforeshow', '#branch-decimal', function (e) {
        //get the branch-decimal.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-decimal', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT DATE*********/
    $(document).on('pagebeforeshow', '#branch-date', function (e) {
        //get the #branch-date.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-date', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT TIME*********/
    $(document).on('pagebeforeshow', '#branch-time', function (e) {
        //get the branch-time.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-time', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    //#select is rendered as dropdown
    /********BRANCH INPUT DROPDOWN*********/
    $(document).on('pagebeforeshow', '#branch-select', function (e) {
        //get the branch-select.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-select', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /********BRANCH INPUT RADIO*********/
    $(document).on('pagebeforeshow', '#branch-radio', function (e) {

        //get the branch-radio.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));

        //@bug in JQM maybe...I do not know any other way to make it work
        $('div#input-radio input:radio').each(function (i) {

            //if a value is cached, pre-select that radio button option manually triggering a 'vclick' event
            if ($(this).attr('checked')) {
                $(this).next().trigger('vclick');
            }
        });
    });
    // $(document).on('pagecreate', '#branch-radio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /* BRANCH INPUT CHECKBOX ************/
    $(document).on('pagebeforeshow', '#branch-checkbox', function (e) {
        //get the branch-checkbox,html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-checkbox', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /* BRANCH INPUT TEXTAREA ************/
    $(document).on('pagebeforeshow', '#branch-textarea', function (e) {
        //get the #textarea page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-textarea', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT LOCATION **********/
    $(document).on('pagebeforeshow', '#branch-location', function (e) {
        //get the branch-location.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-location', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT PHOTO *************/
    $(document).on('pagebeforeshow', '#branch-photo', function (e) {
        //get the branch-photo.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-photo', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT VIDEO *************/
    $(document).on('pagebeforeshow', '#branch-video', function (e) {
        //get the branch-video.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-video', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /************************************/

    /** BRANCH INPUT AUDIO *************/
    $(document).on('pagebeforeshow', '#branch-audio', function (e) {
        //get the branch-audio page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-audio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /*************************************/

    /** BRANCH INPUT BARCODE *************/
    $(document).on('pagebeforeshow', '#branch-barcode', function (e) {
        //get the  branch-barcode.html page and inject the input data
        EC.BranchInputs.renderInput(EC.BranchInputs.getInputAt(window.localStorage.branch_current_position));
    });
    // $(document).on('pagecreate', '#branch-audio', function(e) {
    // EC.Utils.updateFormCompletion(true);
    // });
    /*************************************/

    $(document).on('pagebeforeshow', '#branch-save-confirm', function (e) {
        //Ask save confirmation to use
        EC.BranchInputs.renderSaveConfirmView();
    });

    $(document).on('pagebeforeshow', '#branch-feedback', function (e) {
        //Show feedback to user
        EC.BranchInputs.renderFeedbackView();
    });
};
