'use strict';

var gulp = require('gulp');
var changed = require('gulp-changed');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var del = require('del');
var path = require('path');

var jsdocmetadata = require('./makemetadata.js');
var apisets = require('./makeapisets.js');
var makepage = require('./makepage.js');
var makecustompage = require('./makecustompage.js');

var site = './site';
var tmp = './tmp';

gulp.task('default', ['scss', 
                      'content-html', 
                      'other-html', 
                      'static-files', 
                      'javascripture.js'], function() {
});
 
gulp.task('scss', function() {
  return gulp.src('styles.scss')
    .pipe(changed(site, { extension: '.css' }))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(site));
});

gulp.task('metadata', function() {
  var dest = tmp + '/metadata';
  return gulp.src('./content/**/*.jsdoc')
    .pipe(jsdocmetadata())
    .pipe(changed(dest, { extension: '.json', hasChanged: changed.compareSha1Digest }))
    .pipe(gulp.dest(dest));
});

gulp.task('apisets', ['metadata'], function() {
  return gulp.src(tmp + '/metadata/**/*.json')
    .pipe(apisets())
    .pipe(gulp.dest(tmp));
});

gulp.task('content-html', ['apisets'], function() {
  return gulp.src(['./content/**/*.jsdoc', './templates/*.ejs'])
    .pipe(filter('**/*.jsdoc'))
    .pipe(rename({ dirname: '' }))
    .pipe(changed(site, { extension: '.html' }))
    .pipe(makepage())
    .pipe(gulp.dest(site));
});

gulp.task('other-html', ['apisets'], function() {
  return gulp.src(['./templates/feedback.ejs', 
                   './templates/index.ejs',
                   './templates/license.ejs',
                   './templates/thankyou.ejs'])
    .pipe(makecustompage())
    .pipe(gulp.dest(site));
});

gulp.task('javascripture.js', ['apisets'], function() {
  return gulp.src('./templates/javascripture.ejs')
    .pipe(makecustompage('.js'))
    .pipe(gulp.dest(site));
});

gulp.task('static-files', function() {
  return gulp.src('./static/*')
    .pipe(gulp.dest(site));
});

gulp.task('clean', function(callback) {
  del([tmp, site], callback);
});
