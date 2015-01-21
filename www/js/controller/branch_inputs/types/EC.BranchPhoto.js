/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery, Camera*/
var EC = EC || {};
EC.BranchInputTypes = EC.BranchInputTypes || {};
EC.BranchInputTypes = ( function(module) {"use strict";

		module.photo = function(the_value, the_input) {
			
			var obj;
			var span_label = $('div#branch-photo span.label');
			var value = the_value;
			var input = the_input;
			var camera_btn = $('div#branch-input-photo div#camera-btn');
			// var thumbnail = $('img#image_thumbnail');
			var store_image_uri = $('div#branch-input-photo input#stored-image-uri');
			var cache_image_uri = $('div#branch-input-photo input#cached-image-uri');
			var image_full_path_uri;

			//clear canvas from previous images
			var canvas_portrait_dom = $('div#branch-input-photo #canvas-portrait');
			var canvas_landscape_dom = $('div#branch-input-photo #canvas-landscape');
			var canvas_portrait = $('div#branch-input-photo #canvas-portrait')[0];
			var canvas_landscape = $('div#branch-input-photo #canvas-landscape')[0];

			var context_portrait = canvas_portrait.getContext("2d");
			context_portrait.clearRect(0, 0, canvas_portrait.width, canvas_portrait.height);

			var context_landscape = canvas_landscape.getContext("2d");
			context_landscape.clearRect(0, 0, canvas_landscape.width, canvas_landscape.height);
			
			//Localise
			if (window.localStorage.DEVICE_LANGUAGE !== EC.Const.ENGLISH) {
				EC.Localise.applyToHTML(window.localStorage.DEVICE_LANGUAGE);
			}

			//Render thumbnail on <canvas>
			var _renderThumb = function(the_image_uri) {

				//load taken image on <canvas> tag
				var image = new Image();
				var canvas;
				var context;
				var source = the_image_uri;

				image.src = source;

				image.onerror = function() {
					console.log("Image failed!");
				};

				image.onload = function() {

					//resize image to fit in canvas -> it is not working properly!
					console.log('on load called');
					var width = this.width;
					var height = this.height;
					var thumb_height;
					var thumb_width;
					var canvas;

					if (height > width) {

						//portrait
						canvas = canvas_portrait;
						thumb_width = 188;
						thumb_height = 250;
						canvas_landscape_dom.addClass('not-shown');
						canvas_portrait_dom.removeClass('not-shown');

					} else {

						//landscape
						canvas = canvas_landscape;
						thumb_width = 250;
						thumb_height = 188;
						canvas_portrait_dom.addClass('not-shown');
						canvas_landscape_dom.removeClass('not-shown');
					}

					context = canvas.getContext("2d");
					context.clearRect(0, 0, canvas.width, canvas.height);

					context.save();

					//scale image based on device pixel density
					// context.scale(window.devicePixelRatio, window.devicePixelRatio);
					context.imageSmoothingEnabled = false;

					context.drawImage(this, 0, 0, thumb_width, thumb_height);

					context.restore();

				};
				//image.onload

				console.log(JSON.stringify(source));

			};

			//hide both canvas
			canvas_landscape_dom.addClass('not-shown');
			canvas_portrait_dom.addClass('not-shown');

			//unbind camera button event to avoid multiple calls to Camera API
			camera_btn.off('vclick');

			//update label text
			span_label.text(input.label);

			//if a value is stored when editing, on the first load add it to hidden input field,  to be shown if no cached value is set
			if (window.localStorage.branch_edit_mode) {

				if (value.stored === undefined) {
					store_image_uri.val(value);
					value = {
						cached : "",
						stored : value
					};
				} else {

					store_image_uri.val(value.stored);
				}

			}

			console.log('value.stored ' + JSON.stringify(value.stored));

			//If a cache value is set, add it to hidden field
			cache_image_uri.val(value.cached || "");
			console.log('cache_image_uri: ' + cache_image_uri.val());

			//Show cached image if any, otherwise the stored image, if any
			if (value.cached === "") {

				console.log("cached value empty");

				if (value.stored !== "") {

					//build full path to get image from private app folder
					switch(window.device.platform) {

						case EC.Const.ANDROID:
							image_full_path_uri = EC.Const.ANDROID_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + "/" + value.stored;
							break;
						case EC.Const.IOS:
							image_full_path_uri = EC.Const.IOS_APP_PRIVATE_URI + EC.Const.PHOTO_DIR + window.localStorage.project_name + "/" + value.stored;
							break;

					}

					console.log('image_full_path_uri: ' + image_full_path_uri);

					_renderThumb(image_full_path_uri);

				}

			} else {

				//render the cached image
				_renderThumb(value.cached);
			}

			//Set camera options - anything more than 1024 x 728 will crash
			var source = Camera.PictureSourceType.CAMERA;
			var camera_options = {
				quality : 50, //anything more than this will cause memory leaks
				destinationType : Camera.DestinationType.FILE_URI,
				sourceType : source,
				encodingType : Camera.EncodingType.JPEG,
				mediaType : Camera.MediaType.PICTURE,
				correctOrientation : true,
				saveToPhotoAlbum : false,
				targetWidth : 1024, //more than this resoution and it will happily crash
				targetHeight : 768
			};

			//open camera app on click
			camera_btn.on('vclick', function() {

				navigator.camera.getPicture(onGPSuccess, onGPError, camera_options);

			});

			//Success callback
			var onGPSuccess = function(the_image_uri) {

				console.log("image_uri: " + the_image_uri);

				var image_uri = the_image_uri;

				//render the new image on canvas
				_renderThumb(image_uri);

				//save cached filename in hidden input field
				console.log('image uri is' + image_uri);

				$('div#branch-input-photo input#cached-image-uri').val(image_uri);

			};

			//Error callback
			var onGPError = function(error) {

				EC.Notification.showAlert("Error", "Failed because: " + error);

			};

		};

		return module;

	}(EC.BranchInputTypes));
