/*jslint vars: true , nomen: true devel: true, plusplus: true */
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = ( function() {
        "use strict";

        var project_server_url;
        var project_name;
        var project_id;
        var form_name;
        var form_id;
        var chosen_form_id;
        var chosen_form_name;
        var entries;
        var data;

        function _commitRemoteBatch(the_remote_batch) {

            var single_remote_entry;
            var i;
            var iLength = the_remote_batch.length;
            var batch = the_remote_batch;
            var counter = 0;
            var inner_defer;
            var error_thrown = false;
            var parent_form;

            for ( i = 0; i < iLength; i++) {

                single_remote_entry = batch[i];

                console.log(JSON.stringify(single_remote_entry));

                $.when(EC.Create.commitRemoteEntry(project_id, form_id, single_remote_entry)).then(function() {

                    counter++;

                    if (counter === iLength) {

                        //the whole batch stored in the local db
                        if (entries.length === 0) {

                            EC.Notification.showToast(EC.Localise.getTranslation("download_success"), "short");

                            //clear cached object for this form (table)
                            window.localStorage.removeItem("dre_local_entries_keys");
                            window.localStorage.removeItem("dre_inputs");

                            //@bug on iOS, spinner loader not hiding, force to
                            // hide it here calling it directly with no timeout
                            if (window.device.platform === EC.Const.IOS) {
                                window.ActivityIndicator.hide();
                            }

                            //back to forms list
                            EC.Routing.changePage(window.localStorage.back_nav_url);
                        } else {
                            _commitRemoteBatch(entries.splice(0, 500));
                        }
                    }

                }, function() {

                    /* When downloading remote entries, if parent entry is
                     * missing on the device database the user needs to download
                     * from the parent table first
                     * to keep the database referential integrity
                     */

                    if (!error_thrown) {

                        error_thrown = true;

                        parent_form = EC.Utils.getParentFormByChildID(chosen_form_id);

                        EC.Notification.hideProgressDialog();
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("parent_key_for_1") + chosen_form_name + EC.Localise.getTranslation("parent_key_for_2") + parent_form.name + EC.Localise.getTranslation("parent_key_for_3"));
                    }

                });

            }

        }

        function _commitRemoteEntry(the_single_remote_entry) {

            $.when(EC.Create.commitRemoteEntry(project_id, form_id, the_single_remote_entry)).then(function() {

                if (entries.length === 0) {

                    if (data.length === 0) {

                        EC.Notification.showToast("All data downloaded", "short");

                        //@bug on iOS, spinner loader not hiding, force to hide
                        // it here calling it directly with no timeout
                        if (window.device.platform === EC.Const.IOS) {
                            window.ActivityIndicator.hide();
                        }

                        //clear cached object for this form (table)
                        window.localStorage.removeItem("dre_local_entries_keys");
                        window.localStorage.removeItem("dre_inputs");

                        //back to forms list
                        EC.Routing.changePage(window.localStorage.back_nav_url);
                    } else {

                        entries = data.splice(0, 500);
                        _commitRemoteEntry(entries.shift());
                    }

                } else {
                    _commitRemoteEntry(entries.shift());
                }

            }, function() {

                /* When downloading remote entries, if parent entry is missing on the device database the user needs to download from the parent table first
                * to keep the database referential integrity
                */

                //TODO: get parent form name
                var parent_form = EC.Utils.getParentFormByChildID(chosen_form_id);

                EC.Notification.hideProgressDialog();
                EC.Notification.showAlert("Error", "Parent keys for " + chosen_form_name + " are missing on device database, please download " + parent_form.name + " entries first");

            });

        }

        var _performRequest = function(the_url) {

            var url = the_url;
            var hash;

            $.ajax({
                url : url, //url
                type : 'get', //method type post or get
                crossDomain : true,
                timeout : 60000, // stop after 60 seconds
                dataType : 'json', //return data type
                success : function(the_data) {

                    data = the_data;

                    //console.log(JSON.stringify(data));

                    if (data.length === 0) {
                        //no entries on the server yet, go back to form list
                        EC.Notification.showAlert("Sorry", "No remote entries for the selected form yet!");
                    } else {

                        if (window.device.platform === EC.Const.IOS) {

                            entries = data.splice(0, 500);
                            _commitRemoteEntry(entries.shift());

                        }

                        if (window.device.platform === EC.Const.ANDROID) {

                            //download batch only works on Android (and I do not
                            // even know how)
                            entries = data;
                            _commitRemoteBatch(entries.splice(0, 500));
                        }

                    }

                },
                error : function(request, status, error) {

                    EC.Notification.hideProgressDialog();

                    //@bug on the server, which is sending a full html page as
                    // response when project is private
                    if (request.responseText) {
                        if (request.responseText.trim().charAt(0) === "<") {
                            EC.Notification.showAlert("Sorry, private project", "This project is set as private therefore you cannot download data");
                        }
                    }

                    if (status === "timeout" && error === "timeout") {
                        EC.Notification.showAlert("Error", "Server Timeout");
                    }

                    //show request error
                    console.log(status + ", " + error);
                    console.log(request);
                }
            });

        };

        var fetchRemoteData = function() {

            EC.Notification.showProgressDialog();

            //get request ajax
            _performRequest(project_server_url + project_name + "/" + chosen_form_name + ".json");

        };

        var renderDownloadView = function() {

            var forms = JSON.parse(window.localStorage.forms);
            var i;
            var j;
            var iLength = forms.length;
            var jLength = iLength;
            var HTML = "";
            var dom_list = $('div#download div#download-forms');
            var page = $('#download');
            var form_btn;
            var form_tree;
            var hash = "forms.html?project=" + project_id + "&name=" + project_name;
            var back_btn = $("div#download div[data-role='header'] div[data-href='back-btn']");

            project_id = window.localStorage.project_id;
            project_name = window.localStorage.project_name;
            project_server_url = window.localStorage.project_server_url;

            //set back_nav_url for navigating back to forms list
            window.localStorage.back_nav_url = "forms.html?project=" + project_id + "&name=" + project_name;

            var _form_btn_handler = function() {

                //get chosen form data
                chosen_form_name = $(this).find("span").text();
                chosen_form_id = $(this).attr("id");

                //update form tree in localStorage
                form_tree = EC.Utils.getParentAndChildForms(chosen_form_id);
                window.localStorage.form_tree = JSON.stringify(form_tree);
                form_id = chosen_form_id;

                EC.Notification.askConfirm("Download remote data", "Are you sure to proceed? It might take some time", "EC.Download.fetchRemoteData");
            };

            //handle back button hash
            back_btn.off().one('vclick', function(e) {
                EC.Routing.changePage(window.localStorage.back_nav_url);
            });

            //build buttons
            for ( i = 0; i < iLength; i++) {
                HTML += '<div id="' + forms[i]._id + '" class="embedded-btn">';
                HTML += '<i class="fa fa-download  fa-fw fa-ep-embedded-btn"></i>';
                HTML += '<span class="v-nav-item-label">' + forms[i].name + '</span>';
                HTML += '</div>';
            }

            //add buttons to dom
            dom_list.append(HTML);

            //bind buttons
            for ( j = 0; j < jLength; j++) {
                form_btn = $("div#download div#download-forms div#" + forms[j]._id);
                form_btn.off().on('vclick', _form_btn_handler);
            }
        };

        return {
            fetchRemoteData : fetchRemoteData,
            renderDownloadView : renderDownloadView
        };

    }());
