/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
/*
 *
 * Comments here - todo
 *
 */
var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = (function (module) {
    'use strict';


    module.postOneBranchEntry = function () {

        var self = this;
        var upload_URL;
        var project_id = parseInt(window.localStorage.project_id, 10);

        function _sendRequest() {

            //branch object ready to be posted
            $.ajax({
                type: 'POST',
                url: upload_URL,
                crossDomain: true,
                timeout: 20000, //timeout after 20 secs
                data: $.param(self.branch_entry_post_obj), //use $.param() to convert the object to a query string (?key=value&key2=value2...)
                success: function (response) {

                    //server response is 1 when successful
                    if (response === '1') {

                        //clear post object
                        self.branch_entry_post_obj = {};

                        // //halt execution and flag the branch rows just uploaded as synced
                        EC.Update.setBranchEntryAsSynced(self.branch_rows_to_sync).then(function () {

                            //entry rows synced, upload next entry (if any)
                            self.action = EC.Const.BRANCH_RECURSION;
                            EC.Select.getOneBranchEntry(project_id, self.current_branch_form.name, false);

                        });

                    } else {

                        //a problem occured while uploading/saving data on the server side

                        /**
                         * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
                         */

                        $.when(EC.Select.getOneBranchEntry(self.current_branch_form).then(function (branch_entry) {

                            //Entry found, prepare entry for upload
                            EC.Upload.current_entry = branch_entry;

                            EC.Notification.hideProgressDialog();
                            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('upload_error'));

                            self.branch_rows_to_sync.length = 0;

                        }));

                    }

                },
                error: function (request, status, error) {

                    //show request error
                    console.log(status + ', ' + error);
                    console.log('request: ' + JSON.stringify(request));

                    /**
                     * Recover an entry to be uploaded (it will be the last one the user tried to upload but the upload failed)
                     */

                    $.when(EC.Select.getOneBranchEntry(self.current_branch_form).then(function (entry) {

                        //Entry found, prepare entry for upload
                        EC.Upload.current_entry = entry;
                        self.branch_rows_to_sync.length = 0;
                        EC.Notification.hideProgressDialog();

                        //connection lost BEFORE tryng the ajax request
                        if (status === 'error' && error === '') {

                            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('connection_lost'));
                        }

                        //server timeout
                        //connection lost BEFORE tryng the ajax request
                        if (status === 'timeout' && error === 'timeout') {

                            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('connection_timeout'));
                        }

                    }));
                }
            });

        }


        upload_URL = self.getUploadURL();

        //set upload URL for this project if not in localStorage yet
        if (!EC.Utils.isChrome() && !upload_URL) {
            $.when(EC.Select.getUploadURL(project_id)).then(function (the_project_url) {
                //enable upload data button
                console.log('Project URL is: ' + the_project_url);
                upload_URL = the_project_url;
                _sendRequest();
            });
        }
        else {
            _sendRequest();
        }
    };

    return module;

}(EC.Upload));
