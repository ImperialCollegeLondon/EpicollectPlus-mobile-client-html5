/*global $, jQuery, LocalFileSystem, Media, cordova*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = (function (module) {
    'use strict';

    module.audio = function (the_value, the_input) {

        var span_label = $('div#branch-audio div#branch-input-audio span.label');
        var value = the_value;
        var input = the_input;
        var record_btn = $('div#branch-audio div#branch-input-audio div#start-btn');
        var stop_btn = $('div#branch-audio div#branch-input-audio div#stop-btn');
        var play_btn = $('div#branch-audio div#branch-input-audio div#play-btn');
        var ongoing_recording_spinner = $('div#branch-audio div#branch-input-audio div#ongoing-recording-spinner');
        var audio_feedback = $('div#branch-audio div#branch-input-audio p#audio-feedback');
        var cached_audio_uri = $('div#branch-audio div#branch-input-audio input#cached-audio-uri');
        var stored_audio_uri = $('div#branch-audio div#branch-input-audio input#stored-audio-uri');
        var header_btns = $('div#branch-audio div.ui-header');
        var current_path;
        var audio_full_path_uri;
        var cache_path;
        var mediaRec;
        var current_audio;

        //update label text
        span_label.text(input.label);

        //Localise
        if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
            EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
        }

        //attach event handlers (removing old ones to avoid tiggering an event twice)
        record_btn.off('vclick').one('vclick', recordAudio);
        stop_btn.off('vclick');
        play_btn.off('vclick').on('vclick', playAudio);

        //if an audio file is stored add it to hidden input field, to be shown if no
        // cached value is set
        if (window.localStorage.edit_mode && value.stored === undefined) {

            stored_audio_uri.val(value);
            value = {
                cached: '',
                stored: value
            };

        }//if


        //toggle 'play' button only if we have a file to play
        if (!value.cached) {

            if (value.stored) {

                play_btn.removeClass('ui-disabled');

                //build full path to get audio file from private app folder (depending on
                // platform)
                switch (window.device.platform) {
                    case EC.Const.ANDROID:
                        audio_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;
                        break;
                    case EC.Const.IOS:
                        audio_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + '/' + value.stored;
                        break;
                }

                console.log('image_full_path_uri: ' + audio_full_path_uri);

                current_path = audio_full_path_uri;

                audio_feedback.text('Audio available');

                console.log('current_path: ' + JSON.stringify(audio_full_path_uri));

            }
            else {

                play_btn.addClass('ui-disabled');
            }

        }
        else {

            //we have a cached file to play, current path gets the cached value
            play_btn.removeClass('ui-disabled');
            current_path = cached_audio_uri.val();
        }

        console.log('value.stored ' + value.stored);

        //If a cache value is set, add it to hidden field
        //cached_audio_uri.val(value.cached || '');
        console.log('cache_audio_uri: ' + cached_audio_uri.val());

        //add store audio uri cache_path (if any)
        stored_audio_uri.val(value.stored || '');

        //reset recording buttons
        record_btn.removeClass('enable');
        stop_btn.addClass('ui-disabled');

        //request temporary folder from file system based on platform
        //todo this will probably change with the new Cordova iOS to match Android
        if (window.device.platform === EC.Const.IOS) {

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.root.nativeURL;
                console.log('nativeURL: ' + cache_path);


                /* We need to provide the full path to the tmp folder to record an audio file
                 *
                 * iOS 7+ does not want 'file://' in the path to record an audio file
                 *
                 * if the path starts with 'file://', error thrown is
                 * 'Failed to start recording using AvAudioRecorder'
                 * so it is removed using slice(7);
                 */
                cache_path = cache_path.slice(7);
            }, function (error) {
                console.log(JSON.stringify(error));
            });

        }
        else {
            //Android only getting public cache directory
            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (the_file_system) {

                console.log(JSON.stringify(the_file_system));
                cache_path = the_file_system.nativeURL;
                console.log('nativeURL: ' + cache_path);

            }, function (error) {
                console.log(JSON.stringify(error));
            });
        }

        //record audio
        function recordAudio(e) {

            var filename;

            /*
             * disable navigation buttons while recording, to avoid users to navigate away
             * from the page causing the media object to stay open and impossible to release
             */
            header_btns.addClass('ui-disabled');

            //disable player buttons while recording
            stop_btn.removeClass('ui-disabled');
            stop_btn.one('vclick', stopRecordAudio);
            record_btn.addClass('ui-disabled');
            play_btn.addClass('not-shown');
            ongoing_recording_spinner.removeClass('not-shown');

            switch (window.device.platform) {

                case EC.Const.ANDROID:
                    //build filename timestamp + mp4 (Cordova 2.9 sources have been modified manually
                    // to record high quality audio)
                    filename = EC.Utils.getTimestamp() + '.mp4';
                    break;

                case EC.Const.IOS:
                    /*build filename timestamp + wav (iOS only records to files of type .wav and
                     returns an error if the file name extension is not correct.)
                     */
                    filename = EC.Utils.getTimestamp() + '.wav';
                    break;

            }

            //if there is a file cached already, we replace that one upon further recordings
            if (!current_path) {
                current_path = cache_path + filename;
            }

            console.log('Recording... - Full path: ' + current_path);

            mediaRec = new Media(current_path,

                // success callback
                function onRecordingSuccess() {

                    play_btn.removeClass('ui-disabled');
                    audio_feedback.text('Audio available');
                    console.log('recordAudio():Audio Success');
                    cached_audio_uri.val(current_path);
                },

                // error callback
                function onRecordingError(err) {
                    console.log('recordAudio():Audio Error: ' + err.code);
                });

            // Record audio
            mediaRec.startRecord();

            e.preventDefault();
            e.stopPropagation();

        }//recordAudio

        //stop recording
        function stopRecordAudio(e) {

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //enable player buttons
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('not-shown ui-disabled');
            ongoing_recording_spinner.addClass('not-shown');

            record_btn.one('vclick', recordAudio);

            //stop recording and release resources
            mediaRec.stopRecord();
            mediaRec.release();

            e.preventDefault();
            e.stopPropagation();

        }

        function stopPlayingAudio(e) {

            console.log('Audio stopped');

            //stop audio and release resources
            current_audio.stop();
            current_audio.release();

            //re-enable navigation buttons
            header_btns.removeClass('ui-disabled');

            //re-enable player buttons
            stop_btn.off().one('vclick', stopRecordAudio);
            stop_btn.addClass('ui-disabled');
            record_btn.removeClass('ui-disabled');
            play_btn.removeClass('ui-disabled');

        }

        //play the audio
        function playAudio() {

            //disable navigation buttons while playing
            header_btns.addClass('ui-disabled');

            console.log('Playing... ' + current_path);

            //unbind stopRecordAudio to bind stopPlayingAudio
            stop_btn.off().one('vclick', stopPlayingAudio);
            stop_btn.removeClass('ui-disabled');
            play_btn.addClass('ui-disabled');
            record_btn.addClass('ui-disabled');

            function onPlayStatusChange(the_status) {

                var status = the_status;

                if (status === 4) {

                    //re-enable navigation buttons
                    header_btns.removeClass('ui-disabled');

                    //re-enable player buttons
                    stop_btn.addClass('ui-disabled');
                    record_btn.removeClass('ui-disabled');
                    play_btn.removeClass('ui-disabled');
                }

            }

            current_audio = new Media(current_path, null, null, onPlayStatusChange);
            current_audio.play();

        }//playAudio

    };

    return module;

}(EC.BranchInputTypes));
