/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function (module) {
    'use strict';

    module.loadGoogleMapsApi = function () {

        var deferred = new $.Deferred();

        //is the Api already loaded?
        if (window.google !== undefined && window.google.maps) {

            // api is cached already
            console.log('Maps API cached already');
            deferred.resolve();
        }


        //if no connection, exit and warn user
        if (navigator.connection.type === Connection.NONE || navigator.connection.type === Connection.UNKNOWN) {
            console.log('no internet connection');
            deferred.reject();
            return;
        }

        if (navigator.connection.type === Connection.CELL_2G || navigator.connection.type === Connection.CELL) {
            console.log('connection too weak');
            deferred.reject();
            return;
        }

        //this function is called as a callback when Google Maps Api is ready to be used
        function mapIsLoaded() {
            deferred.resolve();
        }

        $.getScript('https://maps.googleapis.com/maps/api/js?sensor=true&callback=mapIsLoaded')
            .done(function (script, textStatus) {
                console.log(textStatus);
            })
            .fail(function (jqxhr, settings, exception) {
                console.log(jqxhr + exception);
                deferred.reject();
            });

        return deferred.promise();

    };

    return module;


}(EC.DevicePosition));
