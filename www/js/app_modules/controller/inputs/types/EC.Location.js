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
        var textarea_coords = $('textarea#coords');
        var accuracy_result = $('div#location  div#input-location div.current-accuracy-result');
        var accuracy_tip = $('div#location  div#input-location div.location-accuracy-tip');
        var map_canvas = $('div#location div#input-location div#map-canvas');
        var cached_coords = [];

        self = this;
        //update label text
        span_label.text(input.label);

        //Localise text
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }


        //hide feedback when showing the view the first time
        accuracy_result.addClass('hidden');
        accuracy_tip.addClass('hidden');
        map_canvas.addClass('hidden');

        //get a rough location when the view is first loaded (no value set yet)
        getRoughLocation();

        function getRoughLocation() {

            if (value === '') {
                EC.Notification.showProgressDialog('Wait', 'Locating...');
                $.when(EC.DevicePosition.getCurrentPosition()).then(function () {

                    $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));
                    $(accuracy_result).removeClass('hidden');
                    $(accuracy_tip).removeClass('hidden');

                    //if the user wants to use the enhanced map, load Google Maps APi (it returns immediately if already loaded on app cold start)
                    if (EC.DevicePosition.is_enhanced_map_on()) {

                        map_canvas.removeClass('hidden');
                        textarea_coords.addClass('hidden');

                        $.when(EC.DevicePosition.loadGoogleMapsApi()).then(function () {
                            $.when(EC.DevicePosition.initGoogleMap()).then(function () {
                                EC.Notification.hideProgressDialog();
                            });
                        }, function () {

                            //loading Google Maps Api failed, show standard view, warn user and rever back to standard mode
                            window.localStorage.is_enhanced_map_on = 0;

                            EC.Notification.showAlert('Sorry...', 'Google Maps failed to load, reverting to standard mode');
                            textarea_coords.val(EC.DevicePosition.getCoordsFormattedText()).removeClass('hidden');
                            map_canvas.addClass('hidden');
                            EC.Notification.hideProgressDialog();
                        });
                    }
                    else {
                        //show standard view
                        textarea_coords.val(EC.DevicePosition.getCoordsFormattedText());
                        textarea_coords.removeClass('hidden');
                        EC.Notification.hideProgressDialog();
                    }
                }, function (error) {
                    EC.Notification.hideProgressDialog();
                    EC.Notification.showToast('Could not locate', 'long');
                    textarea_coords.removeClass('hidden');
                    textarea_coords.val(EC.DevicePosition.getCoordsEmptyText());

                    //set empty coords (resolving to all the properties set to ''), this will be picked up when changing page
                    EC.DevicePosition.setEmptyCoords();
                });
            }
            else {

                accuracy_result.find('span').text(Math.floor(EC.Utils.parseLocationString(value).accuracy));
                accuracy_result.removeClass('hidden');
                accuracy_tip.removeClass('hidden');

                //set previous location value if any
                if (EC.DevicePosition.is_enhanced_map_on()) {

                    //deal with enhanced maps
                    map_canvas.removeClass('hidden');
                    textarea_coords.addClass('hidden');

                    //if the cached coords are the same, the user is navigating back and forth the inputs only, so do not update the map

                    //set coords in DevicePosition object to set google maps to that value before initialising map
                    cached_coords = EC.Utils.parseLocationString(value);
                    if (cached_coords.latitude === EC.DevicePosition.coords.latitude && cached_coords.longitude === EC.DevicePosition.coords.longitude) {

                        //todo: same position, do not update. If we are editing, create a map and set position
                    }
                    else {

                        //todo different position, update marker, circle and bounds using existing map object if any, or create it
                        console.log('map needs to be updated');
                    }

                    EC.Notification.hideProgressDialog();

                } else {
                    textarea_coords.val(value);
                    $(textarea_coords).removeClass('hidden');
                    EC.Notification.hideProgressDialog();
                }
            }
        }

        //todo strings need to be translated
        function _showAcquiredLocation(has_got_location) {

            accuracy_result.removeClass('hidden');
            accuracy_tip.removeClass('hidden');

            if (has_got_location) {

                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));

                if (EC.DevicePosition.is_enhanced_map_on()) {

                    map_canvas.removeClass('hidden');
                    textarea_coords.addClass('hidden');

                    //update enhanced view
                    EC.DevicePosition.current_position = new google.maps.LatLng(EC.DevicePosition.coords.latitude, EC.DevicePosition.coords.longitude);

                    //update marker position
                    EC.DevicePosition.marker.setPosition(EC.DevicePosition.current_position);

                    //update accuracy circle
                    EC.DevicePosition.circle.setOptions({
                        center: EC.DevicePosition.current_position,
                        radius: EC.DevicePosition.coords.accuracy
                    });
                }
                else {
                    //standar view
                    textarea_coords.val(EC.DevicePosition.getCoordsFormattedText());
                }

                if (!EC.Utils.isChrome()) {
                    EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
                }

            }
            else {
                //set location object to empty values
                if (EC.DevicePosition.is_enhanced_map_on()) {

                    //todo what about google maps -> hide map canvas?
                }
                else {
                    textarea_coords.val(EC.DevicePosition.getCoordsEmptyText());
                }

            }
            set_location_btn.one('vclick', _handleSetLocation);
            EC.Notification.hideProgressDialog();
        }

        var _handleSetLocation = function () {

            set_location_btn.off('vclick');

            //check id GPS is enabled on the device
            //todo check if it on when we start watch position
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

                //has the device a good connection?(showing maps and then lost the connection for some reasons? revert to standard view then)
                if (!EC.Utils.hasGoodConnection()) {
                    window.localStorage.is_enhanced_map_on = 0;
                }


                $.when(EC.DevicePosition.watchPosition()).then(function (response) {
                    _showAcquiredLocation(response);
                });

            }, function () {
                console.log('gps NOT enabled');

                EC.Notification.showAlert(EC.Localise.getTranslation('error'), EC.Localise.getTranslation('gps_disabled'));

                //re-enable button
                set_location_btn.on('vclick');
            });

        };

        //bind set location button
        set_location_btn.off().one('vclick', _handleSetLocation);

    };

    return module;

}(EC.InputTypes));
