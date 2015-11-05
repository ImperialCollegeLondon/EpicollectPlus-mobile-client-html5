/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device*/

var EC = EC || {};
EC.Inputs = EC.Inputs || {};
EC.Inputs = ( function (module) {
    "use strict";

    /**
     * @method renderStoreEditFeedback Show feedback after an edit action and redirect the entries-list page
     * @param {Object} is_positive
     */
    module.renderStoreEditFeedback = function (is_positive) {

        EC.Notification.hideProgressDialog();

        if (is_positive) {

            EC.Notification.showToast(EC.Localise.getTranslation("edit_saved"), "short");

            window.localStorage.removeItem("edit_hash");
            window.localStorage.removeItem("edit_id");
            window.localStorage.removeItem("edit_mode");
            window.localStorage.removeItem("edit_position");
            window.localStorage.removeItem("edit_type");
            window.localStorage.removeItem("edit_key_value");

            //remove flag that disable store edit from an intermediate screen
            window.localStorage.removeItem("has_new_jump_sequence");

            //go back to entries-list page using cached back navigation url
            EC.Routing.changePage(window.localStorage.back_nav_url);
        }

    };

    return module;

}(EC.Inputs));
