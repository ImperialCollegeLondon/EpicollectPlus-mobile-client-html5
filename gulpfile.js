'use strict';
var gulp = require('gulp');
var concat = require('gulp-concat');
var order = require('gulp-order');
//var uglify = require('gulp-uglify');
//var sourcemaps = require('gulp-sourcemaps');
//var gulpignore = require('gulp-ignore');
var vendor_path = './www/js/vendor/';
var app_modules_path = './www/js/app_modules/';
//var app_styles_path = './css/';

// Concatenate vendor js files
gulp.task('vendor-scripts', function () {
    return gulp.src([vendor_path + '*.js', '!./js/vendor/chance.js'])//this works, re-add chance.js when testing
        // .pipe(gulpignore.exclude('./js/vendor/chance.js'))
        // .pipe(sourcemaps.init())
        .pipe(order([
            'js/vendor/jquery-1.9.1.min.js',
            'js/vendor/jquery.mobile-1.3.2.min.js',
            'js/vendor/jquery.mobile.config.js',
            'js/vendor/*.js'
        ], {base: './'}))
        .pipe(concat('vendor.js'))
        // .pipe(uglify())
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./www/js/dist/'));
});

//concatenate app modules to dist folder
gulp.task('app-modules-android', function () {
    return gulp.src([//
        app_modules_path + '**/*.js',
        '!' + app_modules_path + 'model/file/EC.File.createMediaDirs_iOS.js', //
        '!' + app_modules_path + 'model/file/EC.File.moveIOS.js', //
        '!' + app_modules_path + 'model/file/EC.File.moveVideoIOS.js' //
    ])
        .pipe(order([
            'www/js/app_modules/model/**/*.js',
            'www/js/app_modules/**/*.js'
        ], {base: './'}))
        //  .pipe(sourcemaps.init())
        .pipe(concat('build-android.js'))
        //  .pipe(uglify())
        //  .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./www/js/dist/'));
});

//concatenate css. Use same path as destination not to screw up img and fonts urls
//gulp.task('app-styles', function () {
//    return gulp.src(app_styles_path + '*.css')
//        .pipe(concat('bestpint.css'))
//        .pipe(gulp.dest('./css/'));
//});

// Default Task (re-run manually when adding a vendor)
gulp.task('default', ['vendor-scripts', 'app-modules-android'], function () {
    // watch for JS changes
    // gulp.watch('./js/**/*.js', ['app-modules']);
    // watch for CSS changes
    // gulp.watch('./css/*.css', ['app-styles']);
});