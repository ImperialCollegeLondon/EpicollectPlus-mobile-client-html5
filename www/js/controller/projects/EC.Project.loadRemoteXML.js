/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/**
 * @module EC
 * @submodule Project
 */

var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = ( function(module) {"use strict";

        module.loadRemoteXML = function(the_project_name) {

            var cached_project_names;
            var i;
            var iLength;
            var project_name = the_project_name;
            var project_xml_URL;
            var epicollect_server_url;

            //if the project is already on the device, warn user and exit
            try {
                cached_project_names = JSON.parse(window.localStorage.project_names);
                iLength = cached_project_names.length;
                for ( i = 0; i < iLength; i++) {

                    if (cached_project_names[i] === project_name) {
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_already_loaded"));
                        return;
                    }
                }
            } catch(error) {
                //no project yet
                console.log("no projects on device yet");
            }

            //If  Chrome, load xml using a proxy
            if (EC.Utils.isChrome()) {
                project_xml_URL = EC.Const.PROXY +  project_name + ".xml";
            } else {

                //if the project name is a full url, use that instead of app settings
                if (EC.Utils.isURL(project_name)) {
                    project_xml_URL = project_name;
                } else {
                    //get the project server url (default to http://plus.epicollect.net/)
                    epicollect_server_url = window.localStorage.project_server_url;
                    project_xml_URL = epicollect_server_url + project_name + '.xml';
                }
            }

            EC.Notification.showProgressDialog();


            //all good, load project on device
            $.when(EC.Project.request(project_xml_URL)).then(function() {
                // Commit project to database
                $.when(EC.Structure.commitAll()).then(function() {
                    //redirect to project list
                    EC.Routing.changePage(EC.Const.INDEX_VIEW);

                });
            }, function() {
                //request failed
                //TODO
                console.log("request failed");
            });

        };

        return module;

    }(EC.Project));
