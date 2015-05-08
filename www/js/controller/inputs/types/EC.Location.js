/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';


    var timeout;

    module.location = function (the_value, the_input) {

        var self = this;
        var location = {};
        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var geolocation_request;
        var is_first_attempt = true;
        var timeout;
        var clear_timeout;
        var set_location_btn = $('div#location div#input-location div#set-location');
        var set_location_result = $('textarea#set-location-result');
        var accuracy_result = $('div#location  div#input-location div.current-accuracy-result');
        var accuracy_tip = $('div#location  div#input-location div.location-accuracy-tip');

        //update label text
        span_label.text(input.label);

        //Localise text
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //hide feedback when showing the view the first time
        $(accuracy_result).addClass('not-shown');
        $(accuracy_tip).addClass('not-shown');

        //set previous location value if any
        set_location_result.val(value);

        EC.Notification.showProgressDialog('Wait', 'Locating...');
        $.when(self.getCurrentPosition()).then(function () {
            EC.Notification.hideProgressDialog();
        }, function (error) {
            EC.Notification.hideProgressDialog();
            EC.Notification.showToast('Could not locate', 'long');
        });

        function _showAcquiredLocation() {

            $(accuracy_result).find('span').text(Math.floor(location.accuracy));
            $(accuracy_result).removeClass('not-shown');
            $(accuracy_tip).removeClass('not-shown');

            EC.Notification.hideProgressDialog();

            set_location_result.val(//
                'Latitude: ' + location.latitude + ',\n' + //
                'Longitude: ' + location.longitude + ',\n' + //
                'Altitude: ' + location.altitude + ',\n' + //
                'Accuracy: ' + location.accuracy + ',\n' + //
                'Altitude Accuracy: ' + location.altitude_accuracy + ',\n' + //
                'Bearing: ' + location.heading + '\n');

            //update marker position
            EC.DevicePosition.marker.setPosition(new google.maps.LatLng(location.latitude, location.longitude));

            if (!EC.Utils.isChrome()) {
                EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
            }
            set_location_btn.one('vclick', _getLocation);

        }

        //request position
        //todo this can be improved firing watchPosition when starting the form with a location so the first location is already accurate enough
        function requestPosition() {

            console.log('requestPosition called');

            //on first attempt, get a quick and rough location just to get started
            //We do not use getCurrentPosition as it tends to give back a cached position when is it called, not looking for a new one each time
            if (is_first_attempt) {
                geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
            }
            else {

                /*
                 on subsequent calls, check position for 3 secs and return.
                 this will improve cases when watchPositionretunr immediately with the same value, as it might return more than once during the 3 secs period
                 */
                clear_timeout = window.setTimeout(function () {
                        //be safe in case after 3 secs we still do not have a location
                        window.navigator.geolocation.clearWatch(geolocation_request);
                        _showAcquiredLocation();
                        console.log('setTimeout called with location');
                    },
                    30000 //stop checking after 30 seconds (value is milliseconds)
                );

                //get location using watchPosition for more accurate results, It is called automatically when movement is detected,
                //not only when requesting it. Do thjis when user wants to improve location
                geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
            }
        }

        var _getLocation = function () {

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

                requestPosition();

            }, function () {
                console.log('gps NOT enabled');
                //no gps...do we have at least an internet connection?
                //TODO: replace with location services network
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('gps_disabled'));
            });

        };

        var onWatchSuccess = function (position) {

            console.log('onWatchSuccess called, accuracy: ' + position.coords.accuracy);

            //get HTML5 geolocation component values replacing null with '' for not available components
            location.latitude = (position.coords.latitude === null) ? '' : position.coords.latitude;
            location.longitude = (position.coords.longitude === null) ? '' : position.coords.longitude;
            location.altitude = (position.coords.altitude === null) ? '' : position.coords.altitude;
            location.accuracy = (position.coords.accuracy === null) ? '' : position.coords.accuracy;
            location.altitude_accuracy = (position.coords.altitudeAccuracy === null) ? '' : position.coords.altitudeAccuracy;
            location.heading = (position.coords.heading === null) ? '' : position.coords.heading;

            window.navigator.geolocation.clearWatch(geolocation_request);
            _showAcquiredLocation();

        };

        // onError Callback receives a PositionError object
        var onWatchError = function (error) {

            var empty = '';

            window.navigator.geolocation.clearWatch(geolocation_request);

            EC.Notification.hideProgressDialog();

            console.log(JSON.stringify(error));

            if (error.code === 3) {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), error.message + EC.Localise.getTranslation('location_fail'));

            } else if (error.code === 1) {

                if (window.device.platform === EC.Const.IOS) {
                    EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('location_service_fail'));
                }
            } else {
                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('unknow_error'));
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


    module.watchPosition = function () {


    };

    module.getCurrentPosition = function () {

        var deferred = new $.Deferred();

        //attach event handler to resolve when map is loaded


        //set unlimited timeout for watch position to avoid timeout error on iOS when the device does not move
        // see http://goo.gl/tYsBSC, http://goo.gl/jYQhgr, http://goo.gl/8oR1g2
        if (window.device) {
            timeout = (window.device.platform === EC.Const.IOS) ? Infinity : 30000;
        }

        function onSuccess(position) {

            var current_position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var mapOptions = {
                center: {lat: position.coords.latitude, lng: position.coords.longitude},
                zoom: 20,
                disableDefaultUI: true
            };


            EC.DevicePosition.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            //add current user position
            EC.DevicePosition.marker = new google.maps.Marker({
                position: current_position,
                map: EC.DevicePosition.map,
                draggable: true
            });

            google.maps.event.addListenerOnce(EC.DevicePosition.map, 'tilesloaded', function () {
                // Visible tiles loaded!
                deferred.resolve();
            });
        }

        function onError(error) {
            console.log(error);
            deferred.reject();
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            maximumAge: 0,
            timeout: timeout,
            enableHighAccuracy: true
        });

        return deferred.promise();
    };

    return module;

}(EC.InputTypes));
