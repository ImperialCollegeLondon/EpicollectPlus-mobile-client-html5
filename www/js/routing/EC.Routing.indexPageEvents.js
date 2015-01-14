/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/

var EC = EC || {};
EC.Routing = EC.Routing || {};
EC.Routing.indexPageEvents = function() {"use strict";

    $(document).on("pagebeforeshow", "#index", function(e) {

        var back_nav_hash = window.localStorage.back_nav_url;

        //if we are coming to the #index page after a project deletion, force a getProjectList() to update the list of project
        if (window.localStorage.is_project_deleted === "1") {

            EC.Project.getList();

            window.localStorage.removeItem("is_project_deleted");
            return;

        }

        if (back_nav_hash === "#refresh") {
            EC.Project.getList();
            window.localStorage.removeItem("back_nav_hash");
        }

    });

    $(document).on("pagebeforeshow", "#forms", function(e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        console.log("#forms pagebeforeshow");

        //reset breadcrumbs trail
        window.localStorage.removeItem("breadcrumbs");
        window.localStorage.removeItem("entries_totals");
        //reset "editing mode" flag
        window.localStorage.removeItem("edit_mode");

        //get all form by project_id
        EC.Forms.getList(decodeURI($query_param));

    });

    $(document).on("pagebeforeshow", "#entries", function(e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        //reset "editing mode" flag
        window.localStorage.removeItem("edit_mode");

        //get all entries
        EC.Entries.getList(decodeURI($query_param));

    });

    $(document).on("pagebeforeshow", "#entry-values", function(e) {

        var $query_param = e.delegateTarget.baseURI;

        EC.Notification.showProgressDialog();

        EC.Entries.getEntryValues(decodeURI($query_param));

    });

    //settings page
    $(document).on("pagebeforeshow", "#settings", function(e) {
        EC.Settings.renderView();
    });

    //add project page
    $(document).on("pagebeforeshow", "#add-project", function(e) {
        EC.Project.renderAddProjectView();
    });

    //email backup page
    $(document).on("pagebeforeshow", "#email-backup", function(e) {
        EC.EmailBackup.renderSendEmailView();
    });

    //upload page
    $(document).on("pagebeforeshow", "#upload", function(e) {
        EC.Upload.renderUploadView(false);
    });

    //download page
    $(document).on("pagebeforeshow", "#download", function(e) {
        EC.Download.renderDownloadView();
    });

    /********************************************************/
    //force close the activity spinner loader
    $(document).on("pageshow", "#index", function(e) {
        EC.Notification.hideProgressDialog();
        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }

    });
    $(document).on("pageshow", "#forms", function(e) {

        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device.platform === EC.Const.IOS) {
            $.mobile.silentScroll(0);
        }
        //$("div#forms").scrollTop(18);
        EC.Notification.hideProgressDialog();

    });
    $(document).on("pageshow", "#entries", function(e) {

        if (window.localStorage.previous_tapped_entry_Y) {
            $.mobile.silentScroll(parseInt(window.localStorage.previous_tapped_entry_Y, 10));
        } else {
            /*@bug on iOS: hack to force a scroll to the top of the page,
             otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
            if (window.device) {
                if (window.device.platform === EC.Const.IOS) {
                    $.mobile.silentScroll(0);
                }
            }

        }

        EC.Notification.hideProgressDialog();
    });
    $(document).on("pageshow", "#entry-values", function(e) {
        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device) {
            if (window.device.platform === EC.Const.IOS) {
                $.mobile.silentScroll(0);
            }
        }

        EC.Notification.hideProgressDialog();
    });
    /********************************************************/

    /*Localise placeholders: it needs to be done here, after the markup has been enhanced by JQM
     *placing it in pagebeforeshow was not working
     */
    $(document).on("pageshow", "#add-project", function(e) {

        /*@bug on iOS: hack to force a scroll to the top of the page,
         otherwise page will scroll down 18px (due to iOS7 status bar quirk, see MainViewController.m in xCode)*/
        if (window.device.platform === EC.Const.IOS) {
            $.mobile.silentScroll(0);
        }

        //Localise placeholder if device language is not set to English and the language is supported
        //if the device language is not localised or it is English, do not translate placeholder
        if (Object.keys(EC.Dictionary).indexOf(window.localStorage.DEVICE_LANGUAGE) !== -1) {
            EC.Localise.applyToPlaceholders(window.localStorage.DEVICE_LANGUAGE);
        }

    });
};
