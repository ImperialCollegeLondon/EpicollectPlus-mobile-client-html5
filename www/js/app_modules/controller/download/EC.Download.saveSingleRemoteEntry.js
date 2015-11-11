/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Download = EC.Download || {};
EC.Download = (function (module) {
    'use strict';

    var self;

    module.saveSingleRemoteEntry = function (the_single_remote_entry) {

        debugger;

        self = this;

        $.when(EC.Create.commitRemoteEntry(self.project_id, self.chosen_form_id, the_single_remote_entry)).then(function () {

            if (self.entries.length === 0) {
                if (self.data.length === 0) {

                    EC.Notification.showToast('All data downloaded', 'short');

                    //@bug on iOS, spinner loader not hiding, force to hide
                    // it here calling it directly with no timeout
                    if (window.device) {
                        if (window.device.platform === EC.Const.IOS) {
                            window.ActivityIndicator.hide();
                        }
                    }

                    //clear cached object for this form (table)
                    window.localStorage.removeItem('dre_local_entries_keys');
                    window.localStorage.removeItem('dre_inputs');

                    //back to forms list
                    EC.Routing.changePage(window.localStorage.back_nav_url);
                }
                else {

                    self.entries = self.data.splice(0, 500);
                    self.saveSingleRemoteEntry(self.entries.shift());
                }

            }
            else {
                self.saveSingleRemoteEntry(self.entries.shift());
            }

        }, function () {

            /* When downloading remote entries, if parent entry is missing on the device database the user needs to download from the parent table first
             * to keep the database referential integrity
             */

            //TODO: get parent form name
            var parent_form = EC.Utils.getParentFormByChildID(self.chosen_form_id);

            EC.Notification.hideProgressDialog();
            EC.Notification.showAlert('Error', 'Parent keys for ' + self.chosen_form_name + ' are missing on device database, please download ' + parent_form.name + ' entries first');
        });
    };

    return module;

}(EC.Download));
