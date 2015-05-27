# EpiCollect+ Mobile Client HTML5
Epicollect+  Mobile Client based on HTML5

## Dependencies
- Cordova CLI 5.0 resolving to Cordova 3.8 on iOS and Cordova 4.0.0 on Android
- jQuery Mobile 1.3.2
 
## Platforms supported
 - Android 4.1+ (Jelly Bean, released in July 2012)
 - iOS 7+ (Released in September 2013)

## Installation 

#### 
Clone repo (png resources were added manually using `git add res/ios/*.png -f`)

####
Add Android using Cordova CLI

####
Plugins dependencies are added automatically via Cordova hooks when adding Android

####
Copy `res/android/` files to proper folder under `platform/android`

####
Run `cordova prepare` to copy file per each platform

####
Open project in Android Studio (Android) or Xcode (iOS)

####
Fix deployment info, Java import ect. if needed

####
Update Android Manifest file, change default theme to Holo Light
` android:theme="@android:style/Theme.Holo.Light.NoActionBar"`

####
Run on device

####
Look for log errors about missing plugins and fix (I am looking into this but no solution so far)

####
Custom URL schemes need to be added manually to Android manifest and iOS plist files (if you want to deeplink your app to a web page, otherwise you can skip this)

    iOS: http://goo.gl/SPLNo
    Android: `todo`

####
Currently using 4.0.0 on Android, where jsHybugger (debugging tool) does not work. It would work on 3.7.0 but Eclipse does not compile the project (missing .jar). To debug Android <4.4, clone repo, use to 3.7 and debug there. Make the changes to the main repo manually.

####
For debugging, add ` console.error(_error.message);` to `SQLitePlugin.js` at line 375 as it is catching general errors which have nothing to do with the plugin or database

####
Enable file sharing on iOS (useful for "Export to CSV" feature to be able to get hold of the csv bundle) adding 
`<key>UIFileSharingEnabled</key>
<string>YES</string>`
to `info.plist`
