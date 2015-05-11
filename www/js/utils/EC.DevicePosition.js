/*global $, jQuery, cordova, device, ActivityIndicator*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function () {
    'use strict';

    return {

        map: {},
        marker: {},
        coords: {},
        timeout: 30000,
        is_first_attempt: true,
        watchTimeout: function () {
            //set unlimited timeout for watch position to avoid timeout error on iOS when the device does not move
            // see http://goo.gl/tYsBSC, http://goo.gl/jYQhgr, http://goo.gl/8oR1g2
            return (window.device.platform === EC.Const.IOS) ? Infinity : 30000;
        },
        getCurrentPosition: function () {

            var deferred = new $.Deferred();
            var self = this;

            //attach event handler to resolve when map is loaded
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
                    map: self.map,
                    draggable: true
                });

                //let's use 'idle' event and a 2 secs timeout, to play it safe
                // 'tilesloaded' could not be fire if there are network problems
                google.maps.event.addListenerOnce(EC.DevicePosition.map, 'idle', function () {
                    window.setTimeout(function () {
                        deferred.resolve();
                    }, 2000);
                });
            }

            function onError(error) {
                console.log(error);
                deferred.reject();
            }

            navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                maximumAge: 0,
                timeout: self.timeout,
                enableHighAccuracy: true
            });

            return deferred.promise();
        },
        watchPosition: function () {

            var deferred = new $.Deferred();
            var geolocation_request;
            var timeout = EC.DevicePosition.watchTimeout();


            function onWatchSuccess(position) {

                console.log('onWatchSuccess called, accuracy: ' + position.coords.accuracy);

                //get HTML5 geolocation coords values replacing null with '' for not available values
                EC.DevicePosition.coords.latitude = (position.coords.latitude === null) ? '' : position.coords.latitude;
                EC.DevicePosition.coords.longitude = (position.coords.longitude === null) ? '' : position.coords.longitude;
                EC.DevicePosition.coords.altitude = (position.coords.altitude === null) ? '' : position.coords.altitude;
                EC.DevicePosition.coords.accuracy = (position.coords.accuracy === null) ? '' : position.coords.accuracy;
                EC.DevicePosition.coords.altitude_accuracy = (position.coords.altitudeAccuracy === null) ? '' : position.coords.altitudeAccuracy;
                EC.DevicePosition.coords.heading = (position.coords.heading === null) ? '' : position.coords.heading;

                //clear the current watch
                window.navigator.geolocation.clearWatch(geolocation_request);

                deferred.resolve(true);
            }

            //onError Callback
            function onWatchError(error) {

                console.log(error);
                window.navigator.geolocation.clearWatch(geolocation_request);

                switch (error.code) {
                    case 1:
                        if (window.device.platform === EC.Const.IOS) {
                            EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('location_service_fail'));
                        }
                        break;
                    case 3:
                        EC.Notification.showAlert(EC.Localise.getTranslation('error'), error.message + EC.Localise.getTranslation('location_fail'));
                        break;
                    default :
                        EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('unknow_error'));
                }
                deferred.resolve(false);
            }

            //on first attempt, get a quick and rough location just to get started
            //We do not use getCurrentPosition as it tends to give back a cached position when is it called, not looking for a new one each time
            if (self.is_first_attempt) {
                geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
                self.is_first_attempt = false;
            }
            else {

                /*
                 on subsequent calls, check position for 3 secs and return.
                 this will improve cases when watchPositionretunr immediately with the same value, as it might return more than once during the 3 secs period
                 */
                window.setTimeout(function () {

                    //be safe in case after 3 secs we still do not have a location, and resolve to show old values
                    window.navigator.geolocation.clearWatch(geolocation_request);
                    deferred.resolve(true);
                    console.log('setTimeout called without location');
                }, 30000);

                //stop checking after 30 seconds (value is milliseconds));

                //get location using watchPosition for more accurate results, It is called automatically when movement is detected,
                //not only when requesting it. Do thjis when user wants to improve location
                geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
            }

            return deferred.promise();
        }
    };
}());
