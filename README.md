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
5. Copy `res/android/` files to proper folder under `platform/android`
6. Change `android:theme` attribute to `android:theme="@style/Theme.Epicollect5"` 
7. Run `cordova prepare` to copy file per each platform
8. Open project in Eclipse (Android) or Xcode (iOS)
9. Fix deployment info, Java import ect. if needed
10. Run on device
11. Look for log errors about missing plugins (iOS) and fix
12. There is a bug on Cordova 3.7 iOS where `handleOpenURL()` is not called if the app is not active, solution wa to downgrade to 3.6.3
13. Cordova statusbar plugin is causing problems so it does not get installed, modify `MainViewController.m` directly instead
14. Custom URL schemes need to be added manually to Android manifest and iOS plist files
