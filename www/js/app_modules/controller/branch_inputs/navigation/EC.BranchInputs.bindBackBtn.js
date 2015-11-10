/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/

/*
 * @method bindBackBtn set back button label to go back from branch form to linked hierarchy form
 */

var EC = EC || {};
EC.BranchInputs = EC.BranchInputs || {};
EC.BranchInputs = (function (module) {
    'use strict';

    module.bindBackBtn = function (is_data_saved) {

        var self = this;
        var back_btn = $('div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = back_btn.find('span.main-form-name');
        var form_name = window.localStorage.form_name;

        //set back button label to go back to main form
        back_btn_label.text('Back to:  ' + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

        back_btn.off().one('vclick', function (evt) {

            if (is_data_saved) {
                //go back to main form input
                self.backToHierarchyForm();
            } else {
                //id data are not saved, ask confirmation to user before proceeding
                EC.Notification.askConfirm(EC.Localise.getTranslation('exit'), EC.Localise.getTranslation('exit_confirm'), 'EC.BranchInputs.backToHierarchyForm');
            }
        });
    };

    return module;

}(EC.BranchInputs));
