/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

        module.location = function(the_value, the_input) {

            //to cache dom lookups
            var obj;
            var span_label = $('span.label');
            var clone = $('div.clone');
            var double_entry;
            var value = the_value;
            var input = the_input;

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

                //reset the attribute to empty if not a primary key (JQM caches pages and we recycle views)
                span_label.attr('data-primary-key', '');
            }

            //check if we need to replicate this input
            double_entry = (parseInt(input.has_double_check, 10) === 1) ? true : false;

            var set_location_btn = $('div#location div#input-location div#set-location');
            var set_location_result = $('textarea#set-location-result');

            //set previous location value if any
            set_location_result.val(value);

            // onSuccess Callback
            //   This method accepts a `Position` object, which contains
            //   the current GPS coordinates
            //

            var _getLocation = function() {

                set_location_btn.off('vclick');

                //check id GPS is enabled on the device
                $.when(EC.Utils.isGPSEnabled()).then(function() {
                    
                    //gps is on
                    EC.Notification.showProgressDialog(EC.Localise.getTranslation("locating"), EC.Localise.getTranslation("wait"));

                    //On Android, mostly on old devices, halt the execution to solve loader spinner not hiding after a gps lock
                    if (window.device.platform === EC.Const.ANDROID) {
                        EC.Utils.sleep(2000);
                    }

                    navigator.geolocation.getCurrentPosition(onGCPSuccess, onGCPError, {
                        maximumAge : 0,
                        timeout : 30000,
                        enableHighAccuracy : true
                    });

                }, function() {
                    console.log("gps NOT enabled");

                    //no gps...do we have at least an internet connection?
                    //TODO: replace with location services network
                    //if (!EC.Utils.hasConnection()) {

                        //console.log("No internet connection");

                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("gps_disabled"));
                        return;
                  //  }
                });

            };

            var onGCPSuccess = function(position) {

                //show location component values replacing null with "" for not available components
                var latitude = (position.coords.latitude === null) ? "" : position.coords.latitude;
                var longitude = (position.coords.longitude === null) ? "" : position.coords.longitude;
                var altitude = (position.coords.altitude === null) ? "" : position.coords.altitude;
                var accuracy = (position.coords.accuracy === null) ? "" : position.coords.accuracy;
                var altitude_accuracy = (position.coords.altitudeAccuracy === null) ? "" : position.coords.altitudeAccuracy;
                var heading = (position.coords.heading === null) ? "" : position.coords.heading;

                EC.Notification.hideProgressDialog();

                set_location_result.val(//
                'Latitude: ' + latitude + ',\n' + //
                'Longitude: ' + longitude + ',\n' + //
                'Altitude: ' + altitude + ',\n' + //
                'Accuracy: ' + accuracy + ',\n' + //
                'Altitude Accuracy: ' + altitude_accuracy + ',\n' + //
                'Bearing: ' + heading + '\n');
                //

                if (!EC.Utils.isChrome()) {
                    EC.Notification.showToast(EC.Localise.getTranslation("location_acquired"), "short");
                }

                set_location_btn.one('vclick', _getLocation);

            };

            // onError Callback receives a PositionError object
            //
            var onGCPError = function(error) {

                var empty = "";

                EC.Notification.hideProgressDialog();

                console.log(JSON.stringify(error));

                if (error.code === 3) {
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), error.message + EC.Localise.getTranslation("location_fail"));

                } else if (error.code === 1) {

                    if (window.device.platform === EC.Const.IOS) {
                        EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("location_service_fail"));
                    }
                } else {
                    EC.Notification.showAlert(EC.Localise.getTranslation("error"), EC.Localise.getTranslation("unknow_error"));
                }

                //set location object to empty values
                set_location_result.val(//
                'Latitude: ' + empty + ',\n' + //
                'Longitude: ' + empty + ',\n' + //
                'Altitude: ' + empty + ',\n' + //
                'Accuracy: ' + empty + ',\n' + //
                'Altitude Accuracy: ' + empty + ',\n' + //
                'Bearing: ' + empty + '\n');
                //

                set_location_btn.one('vclick', _getLocation);

            };

            //bind set location button
            set_location_btn.off().one('vclick', _getLocation);

        };

        return module;

    }(EC.InputTypes));
