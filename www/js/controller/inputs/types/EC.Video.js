/*global $, jQuery, LocalFileSystem, cordova*/
var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = (function (module) {
    'use strict';

    module.video = function (the_value, the_input) {

        //to cache dom lookups
        var span_label = $('span.label');
        var value = the_value;
        var input = the_input;
        var video_btn = $('div#input-video div#video-btn');
        var play_video_btn = $('div#input-video div#play-video-btn');
        var store_video_uri = $('div#input-video input#stored-video-uri');
        var cache_video_uri = $('div#input-video input#cached-video-uri');
        var video_full_path_uri;
        var cached_path;
        var video_sd_path;
        var ios_video_player_wrapper = $('div#input-video div#ios-video-player-wrapper');
        var ios_video_player = $('div#input-video video#ios-video-player');

        var _renderVideo = function (the_video_file_path) {

            play_video_btn.attr('data-video-path', the_video_file_path);
            play_video_btn.removeClass('ui-disabled');

        };

        //hide play button on ios, also hide video wrapper
        if (window.device.platform === EC.Const.IOS) {
            $(play_video_btn, ios_video_player_wrapper).addClass('not-shown');

        }

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //if a value is stored, on the first load add it to hidden input field,  to be
        // shown if no cached value is set
        if (window.localStorage.edit_mode) {

            if (value.stored === undefined) {
                store_video_uri.val(value);
                value = {
                    cached: '',
                    stored: value
                };
            }
            else {
                store_video_uri.val(value.stored);
            }
        }

        console.log('value.stored ' + JSON.stringify(value.stored));

        //If a cache value is set, add it to hidden field
        cache_video_uri.val(value.cached || '');
        console.log('cache_video_uri: ' + cache_video_uri.val());

        //Show cached video if any, otherwise the stored video, if any
        if (value.cached === '') {

            console.log('cached value empty');

            if (value.stored !== '') {

                //build full path to get video from private app folder depending on platform
                switch (window.device.platform) {
                    case EC.Const.ANDROID:

                        video_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        /** Copy video to cache folder to make it playable (rename it using timestamp).
                         *    Due to permission issues, on Android files are not accessible by other
                         * application
                         *  Since Android support for <video> is pretty weak, we need to use an external
                         * video player app top play the video
                         *  (Whatever app capable of playing the video is installed on the device will be
                         * triggered via an intent)
                         */

                        EC.Notification.showProgressDialog();
                        $.when(EC.File.copyVideo(video_full_path_uri)).then(function (the_cached_filename) {

                            //file has been copied, update view setting it as cached file to play
                            cache_video_uri.val(the_cached_filename);
                            play_video_btn.attr('data-video-path', the_cached_filename);
                            play_video_btn.removeClass('ui-disabled');

                            EC.Notification.hideProgressDialog();

                        });
                        break;

                    case EC.Const.IOS:
                        //build full path (file is stored in persisten storage (Documents folder))
                        video_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.VIDEO_DIR + window.localStorage.project_name + '/' + value.stored;

                        //add source to HTML5 video tag, 'file://' needs to be aded for file access
                        //TODO: on first load, the preview image for the video, bug?
                        ios_video_player.attr('src', 'file://' + video_full_path_uri);

                        /*this is causing the video to open automatically on iOS7,
                         * it is here because the video preview does not work on iOS 8 without it
                         */
                        if (parseFloat(window.device.version) >= 8) {
                            ios_video_player.load();
                        }

                        //show video player wrapper
                        ios_video_player_wrapper.removeClass('not-shown');
                        break;
                }
            }
            else {
                play_video_btn.addClass('ui-disabled');
                ios_video_player_wrapper.addClass('not-shown');
            }

        }
        else {

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    //render the cached video
                    _renderVideo(value.cached);
                    break;

                case EC.Const.IOS:
                    ios_video_player_wrapper.removeClass('not-shown');
                    break;

            }

        }

        //request temporary folder from file system based on platform
        //todo: this will change on iOS with the next release to match Android I suppose
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //on Android only
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cached_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cached_path);
            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }


        //Success callback
        var onCaptureVideoSuccess = function (the_media_object) {

            var cache_video_uri = $('div#input-video input#cached-video-uri');

            console.log(cache_video_uri.val());

            console.log(JSON.stringify(the_media_object[0]));

            video_sd_path = the_media_object[0].fullPath;

            EC.Notification.showProgressDialog();

            //move video to cache folder (temporary storage)
            $.when(EC.File.moveVideo(video_sd_path, cache_video_uri.val())).then(function (the_cached_video_path) {

                if (window.device.platform === EC.Const.IOS) {

                    ios_video_player_wrapper.removeClass('not-shown');

                    //request temporary folder from file system
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                        //imp! since Cordova 3.5+ 'fullPath' became nativeURL
                        var temp_cache_path = the_file_system.root.nativeURL;

                        var video_full_path = temp_cache_path + '/' + the_cached_video_path;

                        ios_video_player.attr('src', video_full_path);

                        cache_video_uri.val(the_cached_video_path);
                        EC.Notification.hideProgressDialog();

                    }, function (error) {
                        console.log(JSON.stringify(error));
                        EC.Notification.hideProgressDialog();
                    });
                }

                if (window.device.platform === EC.Const.ANDROID) {

                    //update cached video uri to use always the same name
                    //when taking more videos for the same input and avoid several cached videos
                    cache_video_uri.val(the_cached_video_path);
                    play_video_btn.attr('data-video-path', the_cached_video_path);
                    play_video_btn.removeClass('ui-disabled');
                    EC.Notification.hideProgressDialog();
                }

            });

        };

        var onCaptureVideoError = function (error) {
            console.log(error.message);
        };

        //play button handler (only on Android)
        //TODO: on kitkat maybe <video> ha got proper support, run some tests
        if (window.device.platform === EC.Const.ANDROID) {

            play_video_btn.off().on('vclick', function () {

                var current_cached_video = $(this).attr('data-video-path');

                //request temporary folder from file system based on platform

                //Android only
                window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                    var temp_cache_path = the_file_system.nativeURL;
                    var video_full_path = temp_cache_path + '/' + current_cached_video;

                    window.plugins.videoPlayer.play(video_full_path);

                }, function (error) {
                    console.log(JSON.stringify(error));
                });

            });
        }

        //open camera app on click
        video_btn.off().on('vclick', function () {

            //record 1 video at a time
            var options = {
                limit: 1
                //duration: 30//set duration to a maximum of 30 seconds
            };
            // start video capture
            navigator.device.capture.captureVideo(onCaptureVideoSuccess, onCaptureVideoError, options);
        });
    };

    return module;

}(EC.InputTypes));
