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

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

public class CordovaApp extends CordovaActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
String project = "";
		
		Log.d("Version", String.valueOf(android.os.Build.VERSION.SDK_INT));
		Log.d("app dir", this.getApplicationInfo().dataDir);
		
		Intent intent = getIntent();

		Uri uri = intent.getData();
		
		String extra = intent.getStringExtra("project");

		if (uri != null) {

			project = uri.getQueryParameter("project");

			Log.d("app passed project", String.valueOf(project));
		}
		
		//get project name when app is triggered via a Chrome intent
		if (extra != null) {
			project = extra;
		}
		
		/* Media folders to store media files are created at run time via native code
		 */
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

		// Set by <content src="index.html" /> in config.xml
		Log.d("launchUrl", String.valueOf(launchUrl));
		
		//override Cordova default launch URL to append project URL for deeplinking
		loadUrl(launchUrl + project);
	}


}
