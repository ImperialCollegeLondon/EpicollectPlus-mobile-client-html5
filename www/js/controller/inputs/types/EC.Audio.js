/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, Media, LocalFileSystem*/

var EC = EC || {};
EC.InputTypes = EC.InputTypes || {};
EC.InputTypes = ( function(module) {"use strict";

		module.audio = function(the_value, the_input) {

			//to cache dom lookups
			var obj;
			var span_label = $('span.label');
			var clone = $('div.clone');
			var double_entry;
			var value = the_value;
			var input = the_input;
			var record_btn = $('div#input-audio div#start-btn');
			var stop_btn = $('div#input-audio div#stop-btn');
			var play_btn = $('div#input-audio div#play-btn');
			var ongoing_recording_spinner = $('div#input-audio div#ongoing-recording-spinner');
			var audio_feedback = $('div#input-audio p#audio-feedback');
			var cached_audio_uri = $('div#input-audio input#cached-audio-uri');
			var stored_audio_uri = $('div#input-audio input#stored-audio-uri');
			var prev_btn = $('div.ui-block-a.input-prev-btn');
			var next_btn = $('div.ui-block-c.input-next-btn');
			var cancel_btn = $('div.ui-btn-right a.delete');
			var back_btn = $('div#audio').find('a.back-btn');
			var current_path;
			var audio_full_path_uri;
			var cached_path;
			var src;
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

			//if an audio file is stored add it to hidden input field, to be shown if no cached value is set
			if (window.localStorage.edit_mode && value.stored === undefined) {

				stored_audio_uri.val(value);
				value = {
					cached : "",
					stored : value
				};

			}//if

			//toggle 'play' button only if we have a file to play
			if (!value.cached) {

				if (value.stored) {

					play_btn.removeClass('ui-disabled');

					//build full path to get audio file from private app folder (depending on platform)
					switch(window.device.platform) {
						case EC.Const.ANDROID:
							audio_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name + "/" + value.stored;
							break;
						case EC.Const.IOS:
						
							audio_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.AUDIO_DIR + window.localStorage.project_name  + "/" + value.stored;
							
							break;
					}

					console.log('audio_full_path_uri: ' + audio_full_path_uri);

					current_path = audio_full_path_uri;

					audio_feedback.text('Audio available');

					console.log("current_path: " + JSON.stringify(audio_full_path_uri));


				} else {

					play_btn.addClass('ui-disabled');
				}

			} else {

				console.log("we have a cached value");

				//we have a cached file to play, current path gets the cached value
				play_btn.removeClass('ui-disabled');
				current_path = cached_audio_uri.val();

			}

			//******************************************************
			//TODO: The following is probably redundant but today I am tired
			//it is working now and I will leave it as it is until I feel like it

			//If a cache value is set, add it to hidden field.
			// if (value.cached === "") {
			//
			// if (value.stored !== "") {
			// cached_audio_uri.val(current_path);
			// } else {
			// cached_audio_uri.val("");
			// }
			// } else {
			// cached_audio_uri.val(value.cached);
			// }
			//********************************************************

			console.log('cache_audio_uri: ' + cached_audio_uri.val());

			//add store audio uri cached_path (if any)
			stored_audio_uri.val(value.stored || "");

			//reset recording buttons
			record_btn.removeClass('enable');
			stop_btn.addClass('ui-disabled');

			//request temporary folder from file system
			window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(the_file_system) {

				console.log(JSON.stringify(the_file_system));
				cached_path = the_file_system.root.fullPath;
				console.log('Fullpath: ' + cached_path);

			}, function(error) {
				console.log(JSON.stringify(error));
			});

			//record audio
			function recordAudio(e) {

				var filename;

				//disable navigation buttons while recording
				$(prev_btn, next_btn, cancel_btn, back_btn).addClass('ui-disabled');

				//disable player buttons while recording
				stop_btn.removeClass('ui-disabled');
				stop_btn.one('vclick', stopRecordAudio);
				record_btn.addClass('ui-disabled');
				play_btn.addClass('not-shown');
				ongoing_recording_spinner.removeClass("not-shown");

				switch(window.device.platform) {

					case EC.Const.ANDROID:
						//build filename timestamp + mp4 (Cordova 2.9 sources have been modified manually to record high quality audio)
						filename = EC.Utils.getTimestamp() + ".mp4";
						break;

					case EC.Const.IOS:
						//build filename timestamp + wav (iOS only records to files of type .wav and returns an error if the file name extension is not correct.)
						filename = EC.Utils.getTimestamp() + ".wav";
						break;

				}

				console.log('Recording...');
				console.log('Full path: ' + cached_path + "/" + filename);

				mediaRec = new Media(cached_path + "/" + filename,

				// success callback
				function onRecordingSuccess() {

					play_btn.removeClass('ui-disabled');
					audio_feedback.text('Audio available');
					console.log("recordAudio():Audio Success");
					current_path = cached_path + "/" + filename;
					cached_audio_uri.val(current_path);
					console.log("current_path: " + current_path);

				},

				// error callback
				function onRecordingError(err) {
					console.log("recordAudio():Audio Error: " + err.code);
					console.log("recordAudio():Audio Error: " + JSON.stringify(err));
				});

				// Record audio
				mediaRec.startRecord();

				e.preventDefault();
				e.stopPropagation();

			}//recordAudio

			//stop recording
			function stopRecordAudio(e) {

				//re-enable navigation buttons
				$(prev_btn, next_btn, cancel_btn, back_btn).removeClass('ui-disabled');

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

				console.log("Audio stopped");

				//stop audio and release resources
				current_audio.stop();
				current_audio.release();

				//re-enable navigation buttons
				$(prev_btn, next_btn, cancel_btn, back_btn).removeClass('ui-disabled');

				//re-enable player buttons
				stop_btn.off().one('vclick', stopRecordAudio);
				stop_btn.addClass('ui-disabled');
				record_btn.removeClass('ui-disabled');
				play_btn.removeClass('ui-disabled');

			}

			//play the audio
			function playAudio() {

				//disable navigation buttons while playing
				$(prev_btn, next_btn, cancel_btn, back_btn).addClass('ui-disabled');

				//current_path = cached_audio_uri.val();
				console.log("Playing... " + current_path);

				//unbind stopRecordAudio to bind stopPlayingAudio
				stop_btn.off().one('vclick', stopPlayingAudio);
				stop_btn.removeClass('ui-disabled');
				play_btn.addClass('ui-disabled');
				record_btn.addClass('ui-disabled');

				function onPlaySuccess() {
				}

				function onPlayError() {
				}

				function onPlayStatusChange(the_status) {

					var status = the_status;

					if (status === 4) {

						//re-enable navigation buttons
						$(prev_btn, next_btn, cancel_btn, back_btn).removeClass('ui-disabled');

						//re-enable player buttons
						stop_btn.addClass('ui-disabled');
						record_btn.removeClass('ui-disabled');
						play_btn.removeClass('ui-disabled');

					}
				}

				current_audio = new Media(current_path, onPlaySuccess, onPlayError, onPlayStatusChange);
				current_audio.play();

			}//playAudio

		};

		return module;

	}(EC.InputTypes));
