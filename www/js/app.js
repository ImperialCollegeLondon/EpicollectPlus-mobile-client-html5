/*jslint vars: true, nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, FastClick, LocalFileSystem,
 * ActivityIndicator*/

/*
 * Define global namespace EC (Epicollect)
 */

var EC = EC || {};
EC.db = EC.db || {};

//init app
EC.Init();

//check if we are launching a new instance of the app on the device
if (!window.sessionStorage.app_loaded && !EC.Utils.isChrome()) {
	window.localStorage.clear();
}

//set default server url for projects if no one is defined
if (window.localStorage.project_server_url === undefined) {
	console.log('EC.Const.EPICOLLECT_SERVER_URL - ' + EC.Const.EPICOLLECT_SERVER_URL);
	window.localStorage.project_server_url = EC.Const.EPICOLLECT_SERVER_URL;
}

//if PhoneGap is not ready yet, wait for ondeviceready, else manually trigger
// ondeviceready on Chrome browser  only
if (EC.Utils.isChrome()) {
	console.log('deviceready Chrome');
	onDeviceReady();
}

//attach global handler for iOS, to be used when opening app using custom scheme
// epicollect5://key=value
window.localStorage.ios_project_form_url = "";
window.handleOpenURL = function(url) {
	"use strict";
	
	var project_name;

	if (url) {
		project_name = url.replace("epicollect5://project?", "");
		project_name = "http://" + project_name;
		window.localStorage.ios_project_form_url = project_name;

	}
};

function onDeviceReady() {

	"use strict";

	if (!EC.Utils.isChrome()) {

		//set media dir paths based on platform
		EC.Utils.setMediaDirPaths();

		//request iOS persistent file system
		if (window.device.platform === EC.Const.IOS) {

			//create media folders 'images', 'audios', 'videos'
			$.when(EC.File.createMediaDirs()).then(function() {

				//set iOS app root path at run time as app identifier can change
				EC.Utils.setIOSRootPath();

				//cache persistent storage path
				EC.Utils.setIOSPersistentStoragePath();

			});

		}

		if (window.device.platform === EC.Const.ANDROID) {
			navigator.globalization.getLocaleName(function(locale) {

				var device_language = locale.value.substring(0, 2);

				console.log('ANDROID language: ' + JSON.stringify(locale) + '\n');

				console.log(JSON.stringify(Object.keys(EC.Dictionary)));

				//if the device language is not localised default to English
				if (Object.keys(EC.Dictionary).indexOf(device_language) !== -1) {
					//set language globally getting the first part of locale.value
					window.localStorage.DEVICE_LANGUAGE = device_language;
				}
				else {
					//fallback to English as default language
					window.localStorage.DEVICE_LANGUAGE = "en";
				}

				EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

			}, function() {
				console.log('Error getting locale\n');

				//fallback to English as default language
				window.localStorage.DEVICE_LANGUAGE = "en";
				EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

			});
		}

		if (window.device.platform === EC.Const.IOS) {
			navigator.globalization.getPreferredLanguage(function(language) {

				var device_language = language.value.substring(0, 2);

				//if the device language is not localised default to English
				if (Object.keys(EC.Dictionary).indexOf(device_language) !== -1) {
					//set language globally getting the first part of locale.value
					window.localStorage.DEVICE_LANGUAGE = device_language;
				}
				else {
					//fallback to English as default language
					window.localStorage.DEVICE_LANGUAGE = "en";
				}

				EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

				console.log('IOS language: ' + language.value + '\n');
			}, function() {
				console.log('Error getting language\n');
				//fallback to English as default language
				window.localStorage.DEVICE_LANGUAGE = "en";
				EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);
			});
		}

	}
	else {
		//fallback to English as default language
		window.localStorage.DEVICE_LANGUAGE = "en";
		EC.Localise.setLanguage(window.localStorage.DEVICE_LANGUAGE);

		//set base URI for debugging on Chrome
		window.localStorage.BASE_URI = window.location.href.replace("index.html", "");
	}

	EC.db = EC.Utils.openDatabase();

	//Deal with JQM page events
	EC.Routing.indexPageEvents();
	EC.Routing.inputsPageEvents();
	EC.Routing.branchInputsPageEvents();

	//Bind button states and overlays
	EC.Ui.bindBtnStates();

	//set pagination parameters
	if (!window.localStorage.QUERY_LIMIT) {
		window.localStorage.QUERY_LIMIT = EC.Const.ITEMS_PER_PAGE;
	}
	window.localStorage.QUERY_ENTRIES_OFFSET = 0;
	window.localStorage.QUERY_CHILD_ENTRIES_OFFSET = 0;
	window.localStorage.QUERY_PARENT_ENTRIES_OFFSET = 0;

	window.sessionStorage.app_loaded = 0;

	$(function() {
		FastClick.attach(document.body);
	});

	if (!EC.Utils.isChrome()) {

		document.addEventListener("backbutton", onBackButton, false);

		//set the device UUID (depending on platform)
		switch(window.device.platform) {

			//on Android, it is possible to uniquely track a device (at the time of writing,
			// KitKat 4.4.2 is the latest release)
			case EC.Const.ANDROID:
				EC.Utils.setPhoneUUID(device.uuid);
				break;

			case EC.Const.IOS:
				window.IDFVPlugin.getIdentifier(function(result) {
					console.log("Vendor ID:" + result);
					EC.Utils.setPhoneUUID(result);
				}, function(error) {
					console.log(error);
					EC.Utils.setPhoneUUID("no_ios_id_available");
				});
				break;

		}

	}
	else {
		EC.Utils.setPhoneUUID("Chrome_Beta");
	}

	if (!window.localStorage.project_names) {
		window.localStorage.project_names = JSON.stringify([]);
	}

	//test referrer on Android platform
	if (window.device) {
		if (window.device.platform === EC.Const.ANDROID) {

			window.plugins.appPreferences.fetch(function(value) {
				console.log("Referrer value is ****************************" + value);
			}, function(error) {
				console.log("Referrer value error! ************************" + JSON.stringify(error));
			}, 'referrer');
		}
	}

	//if database already set, just list projects
	if (window.localStorage.is_db_set === EC.Const.SET) {
		console.log("getting list");
		EC.Project.getList();
	}
	else {

		//Initialise database BEFORE listing empty project view
		$.when(EC.DBAdapter.init()).then(function() {

			//database is set
			window.localStorage.is_db_set = "1";
			window.localStorage.stress_test = 1;
			EC.Project.getList();
		});
	}

}//onDeviceReady

/**
 * Handle back button on Android devices
 */
function onBackButton() {
	"use strict";

	var page_id = $.mobile.activePage.attr("id");

	//if the current page is the home page and the user press the back button, exit
	// app
	if (page_id === EC.Const.INDEX) {
		navigator.app.exitApp();
	}
	else {

		//check if user pressed back button while doing a barcode scan
		if (page_id === EC.Const.BARCODE && window.localStorage.is_dismissing_barcode) {
			window.localStorage.removeItem('is_dismissing_barcode');
			return;
		}
		else {

			if (page_id === EC.Const.PHOTO && $.swipebox.isOpen) {
				// close swipebox on back button (Android)
				$('a#swipebox-close').click();
			}
			else {
				EC.Routing.goBack(page_id);
			}

		}
		//navigator.app.backHistory();
	}
}

document.addEventListener("resume", onResume, false);
function onResume() {
	"use strict";
	console.log("App resumed");
}

