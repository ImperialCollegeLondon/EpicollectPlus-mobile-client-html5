/*global $, Camera*/
var EC = EC || {};
EC.Datetime = EC.Datetime || {};
EC.Datetime = (function (module) {
    'use strict';

    module.initAndroidDatetimePicker = function (the_datepicker, the_format, the_mode) {

        var datepicker = the_datepicker;
        var datetime_format = the_format;
        var mode = the_mode;


        /* bind input to 'vclick' insted of focus, as we set the input as readonly.
         * this solved problem on android 2.3 where the keyboard was showing because the
         * input is in focus when tapping 'cancel' on the DatePicker popup
         */
        datepicker.off().on('vclick', function (event) {

            var datepicker = $(this);
            var selected_date = new Date(datepicker.attr('data-raw-date'));

            //use debouncing/throttling to avoid triggering multiple `focus` event
            // http://goo.gl/NFdHDW
            var now = new Date();
            var lastFocus = datepicker.data('lastFocus');
            if (lastFocus && (now - lastFocus) < 500) {
                // Don't do anything
                return;
            }

            datepicker.data('lastFocus', now);

            // Same handling for iPhone and Android
            window.plugins.datePicker.show({
                date: selected_date,
                mode: mode, // date or time or blank for both
                allowOldDates: true
            }, function (returned_date) {

                var new_date;

                if (returned_date !== undefined) {
                    new_date = new Date(returned_date);

                    if (mode === EC.Const.DATE) {
                        datepicker.val(EC.Utils.parseDate(new_date, datetime_format));
                    }
                    else {
                        //it is a time picker
                        datepicker.val(EC.Utils.parseTime(new_date, datetime_format));
                    }

                    datepicker.attr('data-raw-date', new_date);
                }

                // This fixes the problem you mention at the bottom of this script with it not
                // working a second/third time around, because it is in focus.
                datepicker.blur();
            });

            // This fixes the problem you mention at the bottom of this script with it not
            // working a second/third time around, because it is in focus.
            datepicker.blur();
        });
    };

    return module;
}(EC.Datetime));
