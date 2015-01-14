/*jslint vars: true , nomen: true devel: true, plusplus: true*/
/*global $, jQuery, cordova, device, onDeviceReady*/
var EC = EC || {};
EC.Init = EC.Init || {};

/**
 * Init application triggering onDeviceReady when both jQuery Mobile and Cordova are ready
 * 
 * Also set the debig mode (EC.Const.DEBUG is set manually)
 */
EC.Init = function() {"use strict";

	//disable console.log if nor debugging
	if (EC.Const.DEBUG === 0) {
		console.log = function() {
			//
		};
	}

	//wait for both JQM pageinit and PG onDeviceReady before doing anything
	var jqmReady = $.Deferred(), pgReady = $.Deferred();

	// jqm page is ready
	$(document).bind("pageinit", jqmReady.resolve);

	// phonegap ready
	document.addEventListener("deviceready", pgReady.resolve, false);

	// all ready, throw a custom 'PG_pageinit' event
	$.when(jqmReady, pgReady).then(function() {

		console.log('both JQM and Phone gap triggered init event');
		onDeviceReady();

	});

};
