/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery, cordova*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {
        "use strict";

        module.barcode = function(the_value, the_input) {

            //to cache dom lookups
            var obj;
            var span_label = $('div#barcode span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;
            var scanner = $('div#barcode div#scanner');
            var scanner_confirm = $('div#barcode div#scanner-confirm');
            var scan_result = $('div#barcode input#scan-result');
            var scan_result_confirm = $('div#barcode input#scan-result-confirm');

            //update label text
            span_label.text(input.label);

            //Localise
            if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
                EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
            }

            //Add attribute to flag the primary key input field
            if (parseInt(input.is_primary_key, 10) === 1) {

                span_label.attr('data-primary-key', 'true');

            } else {

                //reset the attribute to empty if not a primary key (JQM caches
                // pages and we recycle views)
                span_label.attr('data-primary-key', '');
            }

            //check if we need to replicate this input
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            //reset buttons
            scanner.removeClass('ui-disabled');
            scanner_confirm.removeClass('ui-disabled');

            scan_result.val(value);

            //if in editing mode, do not allow changes either if the field is a
            // primary key or it triggers a jump
            if (window.localStorage.edit_mode && input.is_primary_key === '1') {
                //disable scan button
                scanner.addClass('ui-disabled');
                $('div#input-barcode p.primary-key-not-editable').removeClass("not-shown");
            } else {
                $('div#input-barcode p.primary-key-not-editable').addClass("not-shown");
            }

            if (double_entry) {

                //duplicate text input
                clone.removeClass('not-shown');
                scan_result_confirm.val(value);

                if (window.localStorage.edit_mode && input.is_primary_key === 1) {

                    //disable clone scan button
                    scanner_confirm.addClass('ui-disabled');
                }

                //add event handler to second scan button
                scanner_confirm.on('vclick', function() {

                    cordova.plugins.barcodeScanner.scan(function(result) {
                    }, function(error) {
                        alert("Scanning failed: " + error);
                    });
                });
            } else {
                //add not-shown class if missing
                clone.addClass('not-shown');
            }

            //set handlers for scan button
            scanner.off().on('vclick', function() {

                cordova.plugins.barcodeScanner.scan(function(result) {
                    scan_result.val(result.text);
                }, function(error) {
                    console.log(error);
                    //EC.Utils.showAlert("Scanning failed", error);
                });

            });

        };

        return module;

    }(EC.InputTypes));
