/*global $, jQuery*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.renderSaveConfirmView = function () {

        var self = this;
        var prev_btn = $('div#save-confirm div.ui-block-a.input-prev-btn');
        var store_btn = $('div#save-confirm div#input-save-confirm div#store');
        var store_edit_btn = $('div.store-edit');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var inputs_total = self.inputs.length;
        var breadcrumb_trail = JSON.parse(window.localStorage.getItem('breadcrumbs'));
        var form_name = window.localStorage.form_name;
        var parent_key;



        //get parent key based on the user navigating or editing
        if (window.localStorage.edit_mode) {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 2];
        } else {
            parent_key = breadcrumb_trail[breadcrumb_trail.length - 1];
        }

        //show parent key in the top bar (if any)
        if (parent_key !== '' && parent_key !== undefined) {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(window.localStorage.form_name + ' for ' + parent_key);
        } else {
            $('div.parent-key div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(window.localStorage.form_name);
        }

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        self.bindBackBtn(false);

        //reset back button visibility
        prev_btn.removeClass('invisible');

        //handler for prev button, showing prev input
        prev_btn.off().on('vclick', function (e) {
            self.gotoPrevPage(e);
        });

        //show 'store' or 'store edit' button based on where we are editing or adding a new entry
        if (window.localStorage.edit_mode) {

            store_btn.hide();

            //enable/show store edit button (if the form has jumps it got disabled)
            $('div.store-edit').removeClass('ui-disabled hidden');

            //bind event with one() to enforce a single submit
            store_edit_btn.off().one('vclick', function (e) {

                EC.Notification.showProgressDialog();
                self.onStoreValues();
            });

        } else {

            store_btn.show();

            //hide store edit button
            $('div.store-edit').addClass('hidden');

            //bind event with one() to enforce a single submit
            store_btn.off().one('vclick', function (e) {

                EC.Notification.showProgressDialog();
                self.onStoreValues();
            });
        }

        //update completion percentage and bar for this form
        self.updateFormCompletion(inputs_total + 1, inputs_total);

    };


    return module;

}(EC.Inputs));
