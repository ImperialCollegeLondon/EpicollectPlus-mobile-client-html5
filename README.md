# EpiCollect+ Mobile Client HTML5
Epicollect+  Mobile Client based on HTML5

## Dependencies
- Cordova CLI 5.0 resolving to Cordova 3.8 on iOS and Cordova 4.0.0 on Android
- jQuery Mobile 1.3.2
 
## Platforms supported
 - Android 4.1+ (Jelly Bean, released in July 2012)
 - iOS 7+ (Released in September 2013)

## Installation 

1. Clone repo (png resources were added manually using `git add res/ios/*.png -f`)
2. Add Android using Cordova CLI
3. Plugins dependencies are added automatically via Cordova hooks when adding Android
5. Copy `res/android/` files to proper folder under `platform/android`
6. Change `android:theme` attribute to `android:theme="@style/Theme.Epicollect5"` 
7. Run `cordova prepare` to copy file per each platform
8. Open project in Android Studio (Android) or Xcode (iOS)
9. Fix deployment info, Java import ect. if needed
10. Update Android Manifest file, see the one on Epicollect5 repo
11. Run on device
12. Look for log errors about missing plugins (iOS) and fix
13. Cordova statusbar plugin (iOS) is causing problems so it does not get installed, modify `MainViewController.m` directly instead. Replace the `viewDidLoad()` method with the following:


    ```
    - (void)viewDidLoad
     {
         [super viewDidLoad];
         // Do any additional setup after loading the view from its nib.
     
         //Lower screen 20px on ios7: http://goo.gl/hoijax
         //this is done here as viewDidLoad will be executed only once (what you actually want)
         //while viewWillAppear is executed EVERY time this view is shown/presented to the user
         if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 7) {
            CGRect viewBounds = [self.webView bounds];
            viewBounds.origin.y = 18;
            viewBounds.size.height = viewBounds.size.height -18;
            self.webView.frame = viewBounds;
        }
     
    }
    ```


14. Custom URL schemes need to be added manually to Android manifest and iOS plist files (if you want to deeplink your app to a web page, otherwise you can skip this)

    iOS: http://goo.gl/SPLNo
    Android: `todo`
    
15. Currently using 4.0.0 on Android, where jsHybugger (debugging tool) does not work. It would work on 3.7.0 but Eclipse does not compile the project (missing .jar). To debug Android <4.4, clone repo, use to 3.7 and debug there. Make the changes to the main repo manually.
