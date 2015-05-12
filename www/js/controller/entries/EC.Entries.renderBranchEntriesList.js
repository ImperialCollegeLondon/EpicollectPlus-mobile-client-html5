/*global $, jQuery*/
/**
 * @module EC
 * @submodule Entries
 */

var EC = EC || {};
EC.Entries = EC.Entries || {};
EC.Entries = (function (module) {
    'use strict';

    /**
     *  Bind Action Bar buttons tap events
     */
    var _bindBackBtn = function () {

        var back_btn = $('div[data-role="header"] div[data-href="back-btn"]');
        var back_btn_label = $('div[data-role="header"] div[data-href="back-btn"] span.form-name');
        var form_name = window.localStorage.form_name;

        back_btn_label.text('Back to ' + form_name.trunc(EC.Const.FORM_NAME_MAX_LENGTH));

        back_btn.off().one('vclick', function (e) {
            window.localStorage.back_from_branch = 1;
            EC.BranchInputs.backToHierarchyForm();
        });

    };

    var _buildList = function (the_branch_form_name, the_entries) {

        var branch_form_name = the_branch_form_name;
        var entries = the_entries;
        var i;
        var iLength = entries.length;
        var HTML = '';

        for (i = 0; i < iLength; i++) {

            //if no title set, use value of primary key as title
            entries[i].full_title = (entries[i].full_title === '') ? entries[i].entry_key : entries[i].full_title;

            HTML += '<li data-icon="false">';
            HTML += '<a href="branch-entry-values.html?branch_form_name=' + branch_form_name + '&entry_key=' + entries[i].entry_key + '">';
            HTML += entries[i].full_title;
            HTML += '</a>';
            HTML += '</li>';
        }//for

        return HTML;

    };

    module.renderBranchEntriesList = function (the_entries) {

        var self = this;
        var entries = the_entries;
        var dom_list = $('div#branch-entries-list ul');
        var branch_form = JSON.parse(window.localStorage.branch_form);
        var load_more_btn = $('div#branch-entries div#branch-entries-list div.more-items-btn');
        var load_more_spinner = $('div#branch-entries div#branch-entries-list div.more-items-btn-spinner');
        var offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
        var limit = parseInt(window.localStorage.QUERY_LIMIT, 10);
        var current_entries_total;
        var HTML;

        //reset entries offset
        window.localStorage.QUERY_ENTRIES_OFFSET = 0;

        //bind action bar buttons for this page
        _bindBackBtn();

        //show branch form name in the top bar
        $('div.branch-form-name div.ui-block-a span.ui-btn-active span.ui-btn-inner').text(branch_form.name);

        //show 'Show more' button if we have more entries to display
        if (current_entries_total > (offset + limit)) {
            load_more_btn.removeClass('hidden');
        } else {
            load_more_btn.addClass('hidden');
        }

        //bind 'show more button'
        load_more_btn.off().on('vclick', function (e) {

            //hide button and show loader
            $(this).addClass('hidden');
            load_more_spinner.removeClass('hidden');

            //increase offset
            offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
            offset += parseInt(window.localStorage.QUERY_LIMIT, 10);
            window.localStorage.QUERY_ENTRIES_OFFSET = offset;

            //get more entries
            self.getMoreEntries(offset);

        });

        //empty current list
        dom_list.empty();

        HTML = _buildList(branch_form.name, entries);

        dom_list.append(HTML);
        dom_list.listview('refresh');

        //hide spinning loader
        EC.Notification.hideProgressDialog();

    };

    module.getMoreBranchEntries = function (the_offset) {

        var load_more_parameters = JSON.parse(window.localStorage.load_more_parameters);
        var form_id = load_more_parameters.form_id;
        var parent_path = load_more_parameters.parent_path;
        var offset = the_offset;

        EC.Select.getEntries(form_id, parent_path, offset);
    };

    module.appendMoreBranchEntries = function (the_entries) {

        var dom_list = $('div#entries-list ul');
        var entries = the_entries;
        var form_id = parseInt(window.localStorage.form_id, 10);
        var HTML;
        var offset = parseInt(window.localStorage.QUERY_ENTRIES_OFFSET, 10);
        var limit = parseInt(window.localStorage.QUERY_LIMIT, 10);
        var totals;
        var current_entries_total;

        //get total of entries
        totals = JSON.parse(window.localStorage.entries_totals);
        current_entries_total = totals[totals.length - 1].entries_total;

        HTML = _buildList(form_id, entries);

        dom_list.append(HTML);
        dom_list.listview('refresh');
        dom_list.trigger('updatelayout');

        //show button and hide loader
        $('div#entries div#entries-list div.more-items-btn-spinner').addClass('hidden');

        if (current_entries_total > (offset + limit)) {
            $('div#entries div#entries-list div.more-items-btn').removeClass('hidden');
        }
    };

    return module;

}(EC.Entries));
