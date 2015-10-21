var EC = EC || {};
EC.Ui = EC.Ui || {};
EC.Ui = {

    colors: {
        tap_action_overlay: '#2a6fc3',
        default_button_background: '#EEEEEE',
        list_item_background: '#DDDDDD',
        fa_entry_value_embedded_btn_default: '#000000'
    },

    //attach vmousedown and vmouseup event to highlight buttons on tap
    bindBtnStates: function () {
        'use strict';

        var self = this;

        //bind events to apply hover effect on buttons (Action Bar)
        $(document).on('vmousedown', 'div.ui-btn-right', function (e) {
            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);
        });

        $(document).on('vmouseup', 'div.ui-btn-right', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background', 'none');

        });

        //bind events to apply hover effect on action buttons large (Action Bar top left)
        $(document).on('vmousedown', 'div.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'div.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background', 'none');

        });

        //bind events to apply hover effect on navigation list item (sidebar options)
        $(document).on('vmousedown', 'li.v-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.v-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.list_item_background);

        });

        //bind events to apply hover effect on autocomplete list items
        $(document).on('vmousedown', 'li.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.h-nav-item', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.list_item_background);

        });

        // //bind events to apply hover effect on navbar(secondary navigation)
        $(document).on('vmousedown', 'li.inactive-tab', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'li.inactive-tab', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.default_button_background);

        });

        //bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
        $(document).on('vmousedown', '.input-prev-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.input-prev-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.default_button_background);

        });

        //bind events to apply hover effect on prev/next button on inputs page (secondary navigation)
        $(document).on('vmousedown', '.input-next-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.input-next-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.default_button_background);

        });

        //bind events to apply hover effect on embedded buttons
        $(document).on('vmousedown', 'div.embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'div.embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.default_button_background);

        });

        //bind events to apply hover effect on embedded buttons
        $(document).on('vmousedown', 'i.fa-ep-entry-value-embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', 'i.fa-ep-entry-value-embedded-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('color', self.colors.fa_entry_value_embedded_btn_default);

        });

        //bind events to apply hover effect on 'show more' buttons
        $(document).on('vmousedown', '.more-items-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.tap_action_overlay);

        });

        $(document).on('vmouseup', '.more-items-btn', function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(this).css('background-color', self.colors.default_button_background);
        });

        /* Following code is a hack to make the select native widget work on
         * Android 4.4.2 (Nexus 5)
         */
        //Hack: manually trigger a click on a select element.
        // Best solution I came across
        $('select').on('vmousedown', function (e) {
            $(this).focus().click();
        });
    }
};

