/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = (function (module) {
    'use strict';

    var self;

    module.fetchRemoteData = function () {

        var url;

        // this will reference EC.Utils? Because I am calling the function from that context? Who knows
        self = EC.Download;//self references EC.Utils?
        url = self.project_server_url + self.project_name + '/' + self.chosen_form_name + '.json';

        EC.Notification.showProgressDialog();

        $.ajax({
            url: url, //url
            type: 'get', //method type post or get
            crossDomain: true,
            timeout: 60000, // stop after 60 seconds
            dataType: 'json', //return data type
            success: function (the_data) {

                self.data = the_data;

                if (self.data.length === 0) {
                    //no entries on the server yet, go back to form list
                    EC.Notification.showAlert('Sorry', 'No remote entries for the selected form yet!');
                }
                else {
                    self.entries = self.data.splice(0, 500);
                    self.saveSingleRemoteEntry(self.entries.shift());
                }
            },
            error: function (request, status, error) {

                EC.Notification.hideProgressDialog();

                //@bug on the server, which is sending a full html page as
                // response when project is private
                if (request.responseText) {
                    if (request.responseText.trim().charAt(0) === '<') {
                        EC.Notification.showAlert('Sorry, private project', 'This project is set as private therefore you cannot download data');
                    }
                }

                if (status === 'timeout' && error === 'timeout') {
                    EC.Notification.showAlert('Error', 'Server Timeout');
                }

                //show request error
                console.log(status + ', ' + error);
                console.log(request);
            }
        });
    };

    return module;

}(EC.Download));
