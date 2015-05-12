/*global $, jQuery, cordova, device, ActivityIndicator*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function () {
    'use strict';

    return {

        map: {},
        marker: {},
        circle: {},
        coords: {},
        current_position: {},
        map_options: {},
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

            //resolve passing position to caller
            function onSuccess(position) {
                self.setCoords(position);
                deferred.resolve();
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
            var self = this;

            function onWatchSuccess(position) {

                console.log('onWatchSuccess called, accuracy: ' + position.coords.accuracy);

                //get HTML5 geolocation coords values replacing null with '' for not available values
                self.setCoords(position);
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

                //get location using watchPosition for more accurate results, It is called automatically when movement is detected,
                //not only when requesting it. Do thjis when user wants to improve location
                geolocation_request = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, {
                    maximumAge: 0,
                    timeout: timeout,
                    enableHighAccuracy: true
                });
            }

            return deferred.promise();
        },
        setCoords: function (position) {

            var self = this;
            //get HTML5 geolocation coords values replacing null with '' for not available values
            self.coords = {
                latitude: (position.coords.latitude === null) ? '' : position.coords.latitude,
                longitude: (position.coords.longitude === null) ? '' : position.coords.longitude,
                altitude: (position.coords.altitude === null) ? '' : position.coords.altitude,
                accuracy: (position.coords.accuracy === null) ? '' : position.coords.accuracy,
                altitude_accuracy: (position.coords.altitudeAccuracy === null) ? '' : position.coords.altitudeAccuracy,
                heading: (position.coords.heading === null) ? '' : position.coords.heading
            };
        },
        getCoordsFormattedText: function () {

            return 'Latitude: ' + this.coords.latitude + ',\n' + //
                'Longitude: ' + this.coords.longitude + ',\n' + //
                'Altitude: ' + this.coords.altitude + ',\n' + //
                'Accuracy: ' + this.coords.accuracy + ',\n' + //
                'Altitude Accuracy: ' + this.coords.altitude_accuracy + ',\n' + //
                'Bearing: ' + this.coords.heading + '\n';

        },
        getCoordsEmptyText: function () {
            return 'Latitude: ,\n' + 'Longitude: ,\n' + 'Altitude: ,\n' + 'Accuracy: ,\n' + 'Altitude Accuracy: ,\n' + 'Bearing: \n';
        }

    };
}());
