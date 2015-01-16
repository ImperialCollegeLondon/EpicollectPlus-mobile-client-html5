# epicollect5-64bit
Epicollect5  Mobile Client refactored to support 64bit architectures

## Dependencies
- Cordova CLI 4.1.2 resolving to Cordova 3.7 on iOS and 3.6.4 on Android
- jQuery Mobile 1.3.2

## Installation 

1. Clone repo (png resources were added manually using <code>git add res/ios/*.png -f<code>)
2. Add Android using Cordova CLI
3. Plugins dependencies are added automatically via Cordova hooks when adding Android
4. Add iOS using Cordova CLI (plugins will be added already from steps above)
5. Copy `res/android/res/values/styles.xml` and `res/android/res/values-v11/styles.xml` in the platform Android `res` folder
6. Change `android:theme` attribute to `android:theme="@style/Theme.Epicollect5"` 
7. Run `cordova prepare` to copy file per each platform
8. Open project in Eclipse (Android) or Xcode (iOS)
9. Fix deployment info, Java import ect. if needed
10. Run on device
11. Look for log errors about missing plugins (iOS) and fix
