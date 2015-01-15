# epicollect5-64bit
Epicollect5  Mobile Client refactored to support 64bit architectures

## Dependencies
- Cordova CLI 4.1.2 resolving to Cordova 3.7 on iOS and 3.6.4 on Android
- jQuery Mobile 1.3.2

## Installation 

1. Clone repo (png resources was added manually using <code>git add res/ios/*.png -f<code>)
2. Add Android and iOS platforms using Cordova CLI
3. Plugins dependencies are added automatically via Cordova hooks
4. Run `cordova prepare` to copy file per each platform
5. Open project in Eclipse (Android) or Xcode (iOS)
6. Fix deployment info, Java import ect. if needed
7. Build on device
