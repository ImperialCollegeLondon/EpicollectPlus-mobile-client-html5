/*global $, jQuery, cordova, device, ActivityIndicator, Connection*/
var EC = EC || {};
EC.DevicePosition = EC.DevicePosition || {};
EC.DevicePosition = (function (module) {
    'use strict';

    module.initGoogleMap = function () {

        var self = this;
        var deferred = new $.Deferred();

        self.current_position = new google.maps.LatLng(self.coords.latitude, self.coords.longitude);
        self.map_options = {
            center: {lat: self.coords.latitude, lng: self.coords.longitude},
            zoom: 16,
            disableDefaultUI: true
        };

        self.map = new google.maps.Map(document.getElementById('map-canvas'), self.map_options);
        //add current user position
        self.marker = new google.maps.Marker({
            position: self.current_position,
            map: self.map,
            draggable: true
        });

        //draw accuracy circle
        self.circle = new google.maps.Circle({
            center: self.current_position,
            radius: self.coords.accuracy,
            map: self.map,
            fillColor: '#0000FF',
            fillOpacity: 0.2,
            strokeColor: '0',
            strokeOpacity: 0
        });

        self.marker.bindTo('position', self.circle, 'center');
        self.map.fitBounds(self.circle.getBounds());

        //let's use 'idle' event and a 2 secs timeout, to play it safe
        // 'tilesloaded' could not be fire if there are network problems
        window.google.maps.event.addListenerOnce(self.map, 'idle', function () {
            window.setTimeout(function () {
                deferred.resolve();
            }, 2000);
        });

        window.google.maps.event.addListener(self.marker, 'dragend', function (event) {
            console.debug('final position is ' + event.latLng.lat() + ' / ' + event.latLng.lng());
        });

        return deferred.promise();
    };

    return module;

}(EC.DevicePosition));
