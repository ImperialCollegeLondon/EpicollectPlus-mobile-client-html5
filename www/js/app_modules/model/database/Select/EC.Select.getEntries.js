/*global $, jQuery*/
var EC = EC || {};
EC.Select = EC.Select || {};
EC.Select = (function (module) {
    'use strict';

    var entries = [];
    var form_id;
    var parent;
    var titles = [];
    var full_titles = [];
    var primary_keys = [];
    var child_counter = 0;
    var entry_key;
    var offset;
    var deferred;

    var _getEntriesSuccessCB = function () {

        /*
         * store primary key values for current form
         * it is not possible to have duplicates for the primary key input field within the same form level
         * (using circular data structure)
         */
        var i;
        var iLength = entries.length;
        for (i = 0; i < iLength; i++) {
            primary_keys.push(entries[i].entry_key);
        }

        window.localStorage.primary_keys = JSON.stringify(primary_keys);
        primary_keys.length = 0;

        /*
         * Using each entry, select all the fields for that entry with 'is_title' = true
         * This will build the full title to be displayed per each itme in the listview
         * if no inputs are set as title, default to the value of the primary key
         */

        EC.db.transaction(_getEntriesTitlesTX, EC.Select.errorCB, _getEntriesTitlesSuccessCB);

        /*
         * Using each entry, count how many child entry there are per each entry
         * The counts will be displayed on the list of entries
         */

        console.log(EC.Const.TRANSACTION_SUCCESS);

    };

    var _getEntriesTitlesSuccessCB = function () {

        //Build the titles concatenating all the title fields found per each entry
        var i;
        var j;
        var iLength = entries.length;
        var jLength = titles.length;
        var full_title;

        for (i = 0; i < iLength; i++) {

            full_title = '';

            for (j = 0; j < jLength; j++) {

                if (entries[i].entry_key === titles[j].entry_key) {
                    full_title += (full_title === '') ? titles[j].value : ', ' + titles[j].value;
                }

            }//for titles

            full_titles.push({
                full_title: full_title,
                entry_key: entries[i].entry_key
            });

        }//for entries

        // console.log('full_titles');
        // console.log(full_titles);

        //get the count of child entries (if any)
        _getChildrenCount();

    };

    /*
     * Get all entries for a form and group them by entry_key:
     *
     * a form have multiple entries, one per each input, and they all have the same entry_key value)
     */
    var _getEntriesTX = function (tx) {


        //TODO: fix ordering of entries
        var query = 'SELECT _id, entry_key, parent FROM ec_data WHERE form_id=? AND parent=? GROUP BY entry_key ORDER BY _id LIMIT ' + window.localStorage.QUERY_LIMIT + ' OFFSET ' + offset;

        tx.executeSql(query, [form_id, parent], _getEntriesSQLSuccess, EC.Select.errorCB);

    };

    var _getEntriesSQLSuccess = function (the_tx, the_result) {

        var i;
        var iLenght = the_result.rows.length;

        //build object with entries
        for (i = 0; i < iLenght; i++) {

            entries.push(the_result.rows.item(i));

        }

        console.log(entries, true);

    };

    var _getEntriesTitlesTX = function (tx) {

        var i;
        var iLenght = entries.length;
        var query;

        //select all the rows to build the title (aside from skipped values as in the case of jumps)
        for (i = 0; i < iLenght; i++) {
            query = 'SELECT _id, value, entry_key FROM ec_data WHERE form_id=? AND is_title=? AND entry_key=? AND parent=? AND value<>?';
            tx.executeSql(query, [form_id, 1, entries[i].entry_key, entries[i].parent, EC.Const.SKIPPED], _getEntriesTitlesSQLSuccess, EC.Select.errorCB);
        }//for

    };

    var _getEntriesTitlesSQLSuccess = function (the_tx, the_result) {

        var i;
        var iLenght = the_result.rows.length;

        //build object with project data
        for (i = 0; i < iLenght; i++) {

            titles.push(the_result.rows.item(i));
        }

    };

    function _getChildrenCountTX(tx) {

        var i;
        var iLength = entries.length;
        var parent;
        var parent_path;
        var breadcrumb_trail;
        var query;

        //get breadcrumbs to convert to parent path
        breadcrumb_trail = JSON.parse(window.localStorage.breadcrumbs);
        parent_path = (breadcrumb_trail[0] === '') ? breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR).substring(1) : breadcrumb_trail.join(EC.Const.ENTRY_ROOT_PATH_SEPARATOR);

        for (i = 0; i < iLength; i++) {

            parent = (parent_path === '') ? entries[i].entry_key : parent_path + EC.Const.ENTRY_ROOT_PATH_SEPARATOR + entries[i].entry_key;

            query = 'SELECT parent FROM ec_data WHERE parent=? GROUP BY entry_key';

            // console.log(query);

            tx.executeSql(query, [parent], _getChildrenCountSQLSuccessCB, EC.Select.errorCB);

        }

    }

    function _getChildrenCountSuccessCB() {

        //offset is 0 resolve to entries list
        if (offset === 0) {
            deferred.resolve(full_titles.slice(0));
        } else {
            //if offset is not 0, we are loading more entries to be appended to the entries list
            EC.Entries.appendMoreEntries(full_titles.slice(0));
        }

        //clear all arrays
        full_titles.length = 0;
        titles.length = 0;
        entries.length = 0;
        child_counter = 0;

        console.log(EC.Const.TRANSACTION_SUCCESS);

    }

    function _getChildrenCountSQLSuccessCB(the_tx, the_result) {

        //Add total of children to its parent
        full_titles[child_counter].children = the_result.rows.length;

        child_counter++;

    }

    // Get the children for a parent form
    var _getChildrenCount = function () {

        if (entries.length > 0) {

            //get the count of children per each parent
            EC.db.transaction(_getChildrenCountTX, EC.Select.errorCB, _getChildrenCountSuccessCB);

        } else {

            //no child entries to fetch yet, render list of entries directly
            //Call Entries controller to render entries list (if offset is 0)
            if (offset === 0) {
                EC.Entries.renderList(full_titles.slice(0));
            } else {
                //if offset is not 0, we are loading more entries to be appended to the entries list
                EC.Entries.appendMoreEntries(full_titles.slice(0));
            }

            //clear all arrays
            full_titles.length = 0;
            titles.length = 0;
            entries.length = 0;
            child_counter = 0;

            console.log(EC.Const.TRANSACTION_SUCCESS);

        }

    };

    module.getEntries = function (the_form_id, the_parent_key, the_offset) {

        form_id = the_form_id;
        parent = the_parent_key;
        offset = the_offset;
        deferred = new $.Deferred();

        EC.db.transaction(_getEntriesTX, EC.Select.errorCB, _getEntriesSuccessCB);

        return deferred.promise();

    };

    return module;

}(EC.Select));
