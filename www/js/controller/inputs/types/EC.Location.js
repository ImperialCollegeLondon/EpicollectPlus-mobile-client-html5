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
        $(accuracy_result).addClass('hidden');
        $(accuracy_tip).addClass('hidden');
        $(map_canvas).addClass('map-hide');
        $(map_progress_loader).removeClass('hidden');

        //get a rough location when the view is first loaded (no value set yet)
        if (value === '') {
            EC.Notification.showProgressDialog('Wait', 'Locating...');
            $.when(EC.DevicePosition.getCurrentPosition()).then(function () {

                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));
                $(accuracy_result).removeClass('hidden');
                $(accuracy_tip).removeClass('hidden');

                //if the user wants to use the enhanced map, load Google Maps APi (it returns immediately if already loaded on app cold start)
                if (parseInt(window.localStorage.use_enhanced_map, 10) === 1) {
                    $.when(self.loadGoogleMapsApi()).then(function () {
                        $.when(self.initGoogleMap()).then(function () {
                            EC.Notification.hideProgressDialog();
                        });
                    }, function () {
                        //loading Google Maps Api failed, show standard view
                        set_location_result.val(EC.DevicePosition.getCoordsFormattedText());
                        $(set_location_result).removeClass('hidden');
                        EC.Notification.hideProgressDialog();
                    });
                }
                else {
                    //show standard view
                    set_location_result.val(EC.DevicePosition.getCoordsFormattedText());
                    $(set_location_result).removeClass('hidden');
                    EC.Notification.hideProgressDialog();
                }


            }, function (error) {
                EC.Notification.hideProgressDialog();
                EC.Notification.showToast('Could not locate', 'long');
            });
        }
        else {
            //set previous location value if any
            set_location_result.val(value);
            $(accuracy_result).find('span').text(Math.floor(EC.Utils.parseLocationString(value).Accuracy));
            $(accuracy_result).removeClass('hidden');
            $(accuracy_tip).removeClass('hidden');
            $(set_location_result).removeClass('hidden');
            EC.Notification.hideProgressDialog();
        }

        //todo strings need to be translated
        function _showAcquiredLocation(has_got_location) {

            $(accuracy_result).removeClass('hidden');
            $(accuracy_tip).removeClass('hidden');
            $(map_canvas).removeClass('hidden');


            if (has_got_location) {

                $(accuracy_result).find('span').text(Math.floor(EC.DevicePosition.coords.accuracy));

                if (parseInt(window.localStorage.use_enhanced_map, 10) === 1) {

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
                    set_location_result.val(EC.DevicePosition.getCoordsFormattedText());
                }
            }
            else {
                //set location object to empty values
                //todo what about google maps?
                set_location_result.val(EC.DevicePosition.getCoordsEmptyText());
            }

            if (!EC.Utils.isChrome()) {
                EC.Notification.showToast(EC.Localise.getTranslation('location_acquired'), 'short');
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
