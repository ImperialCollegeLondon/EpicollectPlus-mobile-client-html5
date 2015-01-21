//#!/usr/bin/env node
//this hook installs all your plugins
// add your plugins to this list--either the identifier, the filesystem location
// or the URL
var pluginlist = [
//native plugins
"org.apache.cordova.device", //
"org.apache.cordova.device-orientation", //
"org.apache.cordova.geolocation", //
"org.apache.cordova.network-information", //
"org.apache.cordova.camera", //
"org.apache.cordova.media-capture", //
// file plugin is added as a dependency of media-capture!
"org.apache.cordova.file-transfer", "org.apache.cordova.globalization", //
// Fork of media pugin see README
"org.apache.cordova.splashscreen", "https://github.com/ImperialCollegeLondon/cordova-plugin-media.git",
//fork of dialogs plugin see README
"https://github.com/ImperialCollegeLondon/cordova-plugin-dialogs.git",
// Official SQLite plugin
"https://github.com/brodysoft/Cordova-SQLitePlugin.git",
// App preferences
"https://github.com/apla/me.apla.cordova.app-preferences.git", //
//Toast plugin
"https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git",
//Activity indicator
"https://github.com/Initsogar/cordova-activityindicator",
//Barcode scanner ZXing
"com.phonegap.plugins.barcodescanner",
//App Version
"https://github.com/whiteoctober/cordova-plugin-app-version.git", //
//status bar in ios7
"org.apache.cordova.statusbar",
//video player plugin android
"cordova plugin add https://github.com/macdonst/VideoPlayer",
//diagnostic plugin
"https://github.com/mablack/cordova-diagnostic-plugin.git",
//native date picker for android
"https://github.com/VitaliiBlagodir/cordova-plugin-datepicker",
//identifier for vendor iOS
"https://github.com/jcesarmobile/IDFVPlugin.git"];
// no need to configure below
var fs = require('fs');
var path = require('path');
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) {
	sys.puts(stdout)
}

pluginlist.forEach(function(plug) {
	exec("cordova plugin add " + plug, puts);
});
