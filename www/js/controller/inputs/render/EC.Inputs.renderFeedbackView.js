/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = (function (module) {
    'use strict';

    module.renderFeedbackView = function () {

        var self = this;
        var form_id = window.localStorage.form_id;
        var form_name = window.localStorage.form_name;
        var form_tree = EC.Utils.getParentAndChildForms(form_id);
        var upload_btn = $('div#feedback div#input-feedback div#upload');
        var add_another_entry_btn = $('div#feedback div#input-feedback div#add-entry-current-form');
        var list_entries_btn = $('div#feedback div#input-feedback div#list-entries-current-form');
        var add_child_btn = $('div#feedback div#input-feedback div#add-child-entry');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');

        //stop background watch position if any
        window.navigator.geolocation.clearWatch(window.localStorage.watch_position);
        window.localStorage.form_has_location = 0;

        back_btn_label.text(form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH) + ' entries');

        //handle back button with no alert on this page
        self.bindBackBtn(true);

        //remove navigation flags from localStorage
        window.localStorage.removeItem('edit_id');
        window.localStorage.removeItem('edit_mode');
        window.localStorage.removeItem('edit_position');
        window.localStorage.removeItem('inputs_trail');
        window.localStorage.removeItem('inputs_values');
        window.localStorage.removeItem('current_position');
        //clear cached branch entry keys
        window.localStorage.removeItem('cached_branch_entry_keys');

        //Set feedback message
        $('p#message').text(this.message);

        //Set text for 'add another entry' button
        add_another_entry_btn.find('span.entry').text(form_name);

        upload_btn.off().one('vclick', function () {
            EC.Routing.changePage(EC.Const.UPLOAD_VIEW);
        });

        add_another_entry_btn.off().one('vclick', function (e) {
            EC.Entries.addEntry();
        });

        list_entries_btn.off().one('vclick', function (e) {
            //if user was navigating from a child from, send it back to child from list
            if (window.localStorage.is_child_form_nav) {

                //TODO: back to child entries list
                EC.Inputs.backToEntriesList();
            } else {
                //data saved, go back to entries list
                EC.Inputs.backToEntriesList();
            }
        });

        //set text for list entries
        list_entries_btn.find('span.form-name-inline').text(form_name);

        //Set text for 'add child to form (if there is a child form)
        if (form_tree.cname !== '') {

            //show add child to current for button
            add_child_btn.find('span').text(EC.Localise.getTranslation('add') + form_tree.cname + EC.Localise.getTranslation('to') + form_name);

            //show add child button
            add_child_btn.removeClass('hidden');

            //Add a child entry btn
            add_child_btn.one('vclick', function (e) {

                var breadcrumb_trail;
                var entries_totals;

                //Set up form values to add a child form for the current form
                window.localStorage.form_name = form_tree.cname;
                window.localStorage.form_id = form_tree.child;

                //add current entry key to breadcrumbs
                breadcrumb_trail = JSON.parse(window.localStorage.breadcrumbs);
                //TODO: where entry_key comes from?
                breadcrumb_trail.push(self.entry_key);
                window.localStorage.breadcrumbs = JSON.stringify(breadcrumb_trail);

                //add current entry to pagination object
                entries_totals = JSON.parse(window.localStorage.entries_totals);
                entries_totals.push({
                    form: form_tree.cname,
                    entry_key: self.entry_key,
                    entries_total: 1
                });

                window.localStorage.entries_totals = JSON.stringify(entries_totals);

                EC.Entries.addEntry();
            });
        }
        EC.Notification.hideProgressDialog();
    };

    return module;

}(EC.Inputs));
