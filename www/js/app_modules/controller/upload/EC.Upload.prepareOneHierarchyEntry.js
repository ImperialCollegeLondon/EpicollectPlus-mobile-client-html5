var EC = EC || {};
EC.Upload = EC.Upload || {};
EC.Upload = (function (module) {
    'use strict';

    //property to hold arrays of values across module
    module.values = [];
    //property to hold main entry key value across module
    module.main_entry_key = [];
    //branch_form name across modules
    module.branch_form_name = '';
    module.hierarchy_entry_post_obj = {};

    /**
     * Post a single row (server side) which consists of all the input values for a form entry
     */
    module.prepareOneHierarchyEntry = function (the_table, the_entry) {



        var self = this;
        var parent_ref;
        var parent_value;
        var entry = the_entry;

        self.values = entry.values;
        self.hierarchy_rows_to_sync = [];

        //table name
        self.hierarchy_entry_post_obj.table = the_table;

        //timestamp when entry is first created
        self.hierarchy_entry_post_obj.ecTimeCreated = entry.created_on;

        //phone uuid
        self.hierarchy_entry_post_obj.ecPhoneID = EC.Utils.getPhoneUUID();

        //add parent ref and parent value for a child form (if defined)
        if (entry.parent_ref !== undefined) {

            parent_ref = entry.parent_ref;
            parent_value = entry.parent_key_value;
            self.hierarchy_entry_post_obj[parent_ref] = parent_value;
        }
        //append entry values to main entry object to be posted
        self.appendEntryValue(self.values.shift());
    };

    /*
     append each input value for a form like 'key=value'
     we prepare a hierarchy object to be posted as 'application/x-www-form-urlencoded'
     therefore a string like 'key=value&key=value&key=value...'
     */
    module.appendEntryValue = function (the_entry_value) {

        var self = this;
        var current_value;
        var current_ref;
        var group_values;

        current_value = the_entry_value.value;
        current_ref = the_entry_value.ref;

        //keep track of row _id (if _id is empty, it is because the location value was split into 4 parts but just one row is saved in the database)
        if (the_entry_value._id !== '') {
            self.hierarchy_rows_to_sync.push({
                _id: the_entry_value._id,
                type: the_entry_value.type
            });
        }

        /*if the current value is a branch skip it, we do not need it as part of the hierarchy post
         * Branches need to be uploaded separately, AFTER all hierarchy entries have been uploaded
         */
        if (the_entry_value.type !== EC.Const.BRANCH) {


            //if this value is for a group, parse value and loop through, as a group value contains multiple values
            if (the_entry_value.type === EC.Const.GROUP) {

                group_values = JSON.parse(current_value);

                $(group_values).each(function (index, single_group_value) {
                    //value is an array for checkboxes, as they allow multiple inputs, to be serialised
                    if (Array.isArray(single_group_value.value)) {
                        //checkbox data are sent as csv
                        single_group_value.value = single_group_value.value.join(', ');
                    }
                    self.hierarchy_entry_post_obj[single_group_value.ref] = single_group_value.value;
                });
            }
            else {
                //common value, add it to main entry object
                self.hierarchy_entry_post_obj[current_ref] = current_value;
            }
        }

        //append next value(if any)
        if (self.values.length > 0) {
            self.appendEntryValue(self.values.shift());

        } else {

            //TODO: no more values to append to the object to be posted for this main entry, so post 1 single main entry
            console.log(self.hierarchy_entry_post_obj);
            //no more values to append, post main entry now as all the branch entries have been uploaded
            self.postOneHierarchyEntry();
        }

    };

    return module;

}(EC.Upload));
