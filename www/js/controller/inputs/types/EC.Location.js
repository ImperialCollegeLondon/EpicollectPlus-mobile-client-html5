/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    var self;

    module.location = function (the_value, the_input) {

        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var set_location_btn = $('div#location div#input-location div#set-location');
        var set_location_result = $('textarea#set-location-result');
        var accuracy_result = $('div#location  div#input-location div.current-accuracy-result');
        var accuracy_tip = $('div#location  div#input-location div.location-accuracy-tip');
        var map_progress_loader = $('div#location div#map-progress-spinner-loader');
        var map_canvas = $('div#location div#input-location div#map-canvas');

        self = this;

        //update label text
        span_label.text(input.label);

        //Localise text
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //hide feedback when showing the view the first time
        $(accuracy_result).addClass('not-shown');
        $(accuracy_tip).addClass('not-shown');
        $(map_canvas).addClass('map-hide');
        $(map_progress_loader).removeClass('not-shown');

        //set previous location value if any
        set_location_result.val(value);

        //get a rough location when the view is first loaded
        EC.Notification.showProgressDialog('Wait', 'Locating...');
        $.when(EC.DevicePosition.getCurrentPosition()).then(function () {

            $(accuracy_result).removeClass('not-shown');
            $(accuracy_tip).removeClass('not-shown');
            $(map_canvas).removeClass('map-hide');
            $(map_progress_loader).addClass('not-shown');
            EC.Notification.hideProgressDialog();
        }, function (error) {
            EC.Notification.hideProgressDialog();
            EC.Notification.showToast('Could not locate', 'long');
        });

        //todo strings need to be translated
        function _showAcquiredLocation(has_got_location) {

            $(accuracy_result).removeClass('not-shown');
            $(accuracy_tip).removeClass('not-shown');
            $(map_canvas).removeClass('not-shown');
            $(map_progress_loader).addClass('not-shown');

            if (has_got_location) {
                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));
                set_location_result.val(//
                    'Latitude: ' + EC.DevicePosition.coords.latitude + ',\n' + //
                    'Longitude: ' + EC.DevicePosition.coords.longitude + ',\n' + //
                    'Altitude: ' + EC.DevicePosition.coords.altitude + ',\n' + //
                    'Accuracy: ' + EC.DevicePosition.coords.accuracy + ',\n' + //
                    'Altitude Accuracy: ' + EC.DevicePosition.coords.altitude_accuracy + ',\n' + //
                    'Bearing: ' + EC.DevicePosition.coords.heading + '\n');

                //update marker position
                EC.DevicePosition.marker.setPosition(new google.maps.LatLng(EC.DevicePosition.coords.latitude, EC.DevicePosition.coords.longitude));

                if (!EC.Utils.isChrome()) {
                    EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
                }
            }
            else {
                //set location object to empty values
                set_location_result.val(//
                    'Latitude: ,\n' + //
                    'Longitude: ,\n' + //
                    'Altitude: ,\n' + //
                    'Accuracy: ,\n' + //
                    'Altitude Accuracy: ,\n' + //
                    'Bearing: \n');
            }

            set_location_btn.one('vclick', _handleSetLocation);

            EC.Notification.hideProgressDialog();

        }

        var _handleSetLocation = function () {

            set_location_btn.off('vclick');

            //check id GPS is enabled on the device
            $.when(EC.Utils.isGPSEnabled()).then(function () {

                //gps is on
                EC.Notification.showProgressDialog(EC.Localise.getTranslation('locating'), EC.Localise.getTranslation('wait'));

                //On Android, mostly on old devices, halt the execution to solve loader spinner not hiding after a gps lock
                if (window.device.platform === EC.Const.ANDROID) {

                    //if the device is older than KitKat I assume it is slow to hide the spinning loader and I need the execution halt to clear race conditions
                    if (!(EC.Const.KITKAT_REGEX.test(window.device.version) || EC.Const.LOLLIPOP_REGEX)) {
                        EC.Utils.sleep(2000);
                    }
                }


                $.when(EC.DevicePosition.watchPosition()).then(function (response) {
                    _showAcquiredLocation(response);
                });

            }, function () {
                console.log('gps NOT enabled');
                //no gps...do we have at least an internet connection?
                //TODO: replace with location services network
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('gps_disabled'));
            });

        };

        //bind set location button
        set_location_btn.off().one('vclick', _handleSetLocation);

    };

    return module;

}(EC.InputTypes));
