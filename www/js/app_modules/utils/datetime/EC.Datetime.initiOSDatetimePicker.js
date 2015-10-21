/*global $, Camera*/
var EC = EC || {};
EC.Datetime = EC.Datetime || {};
EC.Datetime = (function (module) {
    'use strict';

    //todo test this, why do we need 2 pickers???
    module.initiOSDatetimePicker = function (the_ios_datepicker, the_datepicker, the_format, the_mode) {

        var datepicker = the_datepicker;
        var ios_datepicker = the_ios_datepicker;
        var datetimeformat = the_format;

        datepicker.off().on('vclick', function (event) {
            ios_datepicker.focus();
        });

        ios_datepicker.off().on('blur', function (event) {

            var ios_date = ios_datepicker.val();

            datepicker.val(EC.Utils.parseIOSDate(ios_date, datetime_format));
            datepicker.attr('data-raw-date', ios_date);
        });


    };

    return module;
}(EC.Datetime));
