/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 *
 */
var EC = EC || {};
EC.Project = EC.Project || {};
EC.Project = (function (module) {
    'use strict';

    var project_xml_URL;
    var deferred;

    module.request = function (the_project_xml_url) {

        project_xml_URL = the_project_xml_url;
        console.log('doing request: ' + project_xml_URL);

        deferred = new $.Deferred();

        $.ajax({
            url: project_xml_URL, //url
            type: 'get', //method type post or get
            crossDomain: true,
            dataType: 'xml', //return data type
            timeout: 30000, // stop after 30 seconds
            success: function (data) {

                var is_project_xml_valid = true;
                var branch_forms = [];

                //parse the xml
                is_project_xml_valid = EC.Parse.parseXML(data);

                //parse error? Alert user
                if (is_project_xml_valid === false) {
                    EC.Notification.hideProgressDialog();
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("invalid_xml"));
                    deferred.reject();
                    return;
                }


                deferred.resolve();

            },
            error: function (request, status, error) {

                EC.Utils.sleep(1000);

                EC.Notification.hideProgressDialog();

                //show request error
                console.log(status + ", " + error);

                switch (status) {

                    case "parsererror":
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("invalid_xml"));
                        break;
                    case "timeout":
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("connection_timeout"));
                        break;
                    default:

                        if (error === "Page not found") {
                            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_not_found_on_server") + window.localStorage.project_server_url);
                            return;
                        }

                        if (error === "Not Found") {
                            EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("project_not_found"));
                            return;
                        }

                        //show unknow error if nothing match
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknow_error"));
                }

                deferred.reject();

            }
        });

        return deferred.promise();

    };

    return module;

}(EC.Project));
