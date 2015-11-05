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
     *
     * @param {String} the_hash_to_parse Query string with information about which data will need to be fetched
     * like '#entries?form=1&name=University&entry_key=&direction=backward'
     *
     * #entries indicates we are requesting a list of entries
     * form=1 The form id we are requesting entries for
     * name=University The form name
     * direction=backward The direction the user is navigating to (either forward or backward)
     */
    module.getList = function (the_hash_to_parse) {

        var form_id;
        var form;
        var form_name;
        var form_tree;
        var entry_key;
        var direction;
        var children;
        var breadcrumbs_trail = [];
        var entries_totals = [];
        var parent_path;
        var nav_parent_path;
        var offset = 0;
        var parent_offset = 0;
        var children_offset = 0;
        var total;
        var current_view_url_parts;
        var wls = window.localStorage;

        //cache current page url for navigation purposes
        current_view_url_parts = the_hash_to_parse.split('/');
        wls.current_view_url = current_view_url_parts[current_view_url_parts.length - 1];

        //get form id parsing the href hash
        var hash = the_hash_to_parse.split('?');

        nav_parent_path = wls.parent_path;

        form = hash[1].split('&');
        form_id = form[0].replace('form=', '');
        form_name = form[1].replace('name=', '');
        entry_key = form[2].replace('entry_key=', '');
        direction = form[3].replace('direction=', '');

        children = parseInt(form[4].replace('children=', ''), 10);

        //get breadcrumb trail, first iteration will be '' when it is the top form on the tree
        breadcrumbs_trail = JSON.parse(wls.getItem('breadcrumbs')) || breadcrumbs_trail;

        //get total of entries, first iteration generate empty object
        entries_totals = JSON.parse(wls.getItem('entries_totals')) || entries_totals;

        //update breadcrumb trail and totals based on navigation direction
        switch (direction) {

            case EC.Const.FORWARD:

                breadcrumbs_trail.push(entry_key);

                if (entries_totals.length === breadcrumbs_trail.length - 1) {
                    entries_totals.push({
                        form: form_name,
                        entry_key: entry_key,
                        entries_total: children
                    });
                }

                //delete cached entries when going forward
                window.localStorage.removeItem('cached_entries_list');

                break;
            case EC.Const.BACKWARD:
                breadcrumbs_trail.pop();
                entries_totals.pop();
                break;
            case EC.Const.EDITING:
                //to do
                break;
            case EC.Const.ADDING:
                //to do
                break;
            case EC.Const.VIEW:
                breadcrumbs_trail.pop();
                //to do
                break;

        }

        wls.setItem('breadcrumbs', JSON.stringify(breadcrumbs_trail));
        wls.setItem('entries_totals', JSON.stringify(entries_totals));

        //get current form tree (parent and child form based on the active one)
        form_tree = EC.Utils.getParentAndChildForms(form_id);
        wls.form_id = form_id;
        wls.form_name = form_name;
        wls.form_tree = JSON.stringify(form_tree);

        //select all entries for selected form based on tree structure
        if ((form_tree.parent > 0 && entry_key === '' && nav_parent_path === undefined) || wls.is_child_form_nav) {

            //we did not select the top form, select all the entries for the selected child form
            EC.Select.getChildEntries(form_id, parent_offset, children_offset);

            //set a flag to indicate we are in 'child form navigation mode' i.e. user selected a child form in the forms list
            wls.is_child_form_nav = 1;

        } else {

            //top form was selected, remove child form navigation flag
            wls.removeItem('is_child_form_nav');

            if (nav_parent_path) {

                console.log(nav_parent_path);

                parent_path = nav_parent_path;

            } else {
                parent_path = (breadcrumbs_trail[0] === '') ? breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumbs_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

            }

            //set parameters for pagination
            wls.load_more_parameters = JSON.stringify({
                form_id: form_id,
                parent_path: parent_path
            });

            //TODO: if there are entries cached and we are navigating back from a VIEW action, render the cached list

            if (direction === EC.Const.VIEW && window.localStorage.cached_entries_list) {
                //EC.Entries.renderCachedList();
                EC.Entries.renderList(JSON.parse(window.localStorage.cached_entries_list));
            } else {

                //if entry_key='' we are requesting the list of all entries (parent will be 0), typical when we are in the 'Forms' screen and select the top form
                $.when(EC.Select.getEntries(form_id, parent_path, offset)).then(function (the_entries) {
                    EC.Entries.renderList(the_entries);
                });
            }

        }
    };

    return module;

}(EC.Entries));
