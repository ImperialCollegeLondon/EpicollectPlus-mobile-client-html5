/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition.loadGoogleMapsApi = function () {
    'use strict';

    var deferred = new $.Deferred();

    //callback from Google Maps API needs to be in the global scope
    window.mapIsLoaded = function () {
        // EC.DevicePosition.is_api_loaded = true;
        deferred.resolve();
    };

    //is the Api already loaded?
    if (window.google !== undefined && window.google.maps) {
        console.log('Maps API cached already');
        //if no connection, exit and warn user todo
        if (EC.Utils.hasGoodConnection()) {
            //load API from server
            //connection looks good, try to load tiles
            deferred.resolve();
        }
        else {
            //could not load API
            deferred.reject();
        }
    }
    else {

        if (EC.Utils.hasGoodConnection()) {

            $.getScript('https://maps.googleapis.com/maps/api/js?sensor=true&callback=mapIsLoaded')
                .done(function (script, textStatus) {
                    console.log(textStatus);
                })
                .fail(function (jqxhr, settings, exception) {
                    console.log(jqxhr + exception);
                    deferred.reject();
                });
        }
        else {
            //could not load API
            deferred.reject();
        }
    }

    return deferred.promise();
};






