/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery*/
var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function(module) {
        "use strict";

        module.prepareFeedback = function(the_status, the_entry_key) {

            var self = this;
            var status = the_status;
            var page = EC.Const.INPUT_VIEWS_DIR + "save-feedback.html";
            var primary_keys = JSON.parse(window.localStorage.primary_keys);
            var back_nav_hash = window.localStorage.back_nav_url;
            var back_nav_hash_parts;
            var children;
            var entries_totals = JSON.parse(window.localStorage.entries_totals);

            self.entry_key = the_entry_key;

            //prepare feedback based on status
            if (status) {

                this.message = "Data save successfully!";

                back_nav_hash_parts = back_nav_hash.split("=");
                children = parseInt(back_nav_hash_parts[back_nav_hash_parts.length - 1], 10);

                //increase children for this entry, update back nav hash and pagination object
                back_nav_hash_parts[back_nav_hash_parts.length - 1] = children + 1;
                back_nav_hash = back_nav_hash_parts.join("=");
                entries_totals[entries_totals.length - 1].entries_total = children + 1;

                window.localStorage.back_nav_url = back_nav_hash;
                window.localStorage.entries_totals = JSON.stringify(entries_totals);

                //add last entry primary key to localStorage
                primary_keys.push(self.entry_key);
                window.localStorage.primary_keys = JSON.stringify(primary_keys);

            } else {

                this.message = "Error saving data...please retry";
            }

            EC.Routing.changePage(page);
        };
        //prepareFeedback

        return module;

    }(EC.Inputs));
