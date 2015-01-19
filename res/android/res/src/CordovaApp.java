/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package uk.ac.imperial.epicollect5_64bit;

import java.io.File;

import org.apache.cordova.CordovaActivity;
import org.apache.cordova.CordovaChromeClient;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaWebViewClient;
import org.jshybugger.DebugServiceClient;

import android.os.Bundle;

public class CordovaApp extends CordovaActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// create images dir
		File images_dir = new File(getFilesDir(), "images");
		images_dir.mkdir();

		// create audios dir
		File audios_dir = new File(getFilesDir(), "audios");
		audios_dir.mkdir();

		// create videos dir
		File videos_dir = new File(getFilesDir(), "videos");
		videos_dir.mkdir();

		super.init();

		// load HTML page via jsHybugger content provider
		//super.loadUrl(DebugServiceClient.getDebugUrl(launchUrl));

		// Set by <content src="index.html" /> in config.xml
		loadUrl(launchUrl);
	}

//	/**
//	 * Attach webView to debugging service.
//	 */
//	@Override
//	public void init(CordovaWebView webView, CordovaWebViewClient webViewClient, CordovaChromeClient webChromeClient) {
//		super.init(webView, webViewClient, webChromeClient);
//		DebugServiceClient.attachWebView(webView, this);
//	}
}
