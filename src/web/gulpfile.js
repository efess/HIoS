var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    notify = require("gulp-notify"),
    bower = require('gulp-bower'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify');
    
var config = {
    sassPath: './resources/sass',
    jsPath: './resources/js',
    bowerDir: './components'
};

gulp.task('css', function(){
    
    return sass(config.sassPath + '/style.scss', {
        precision: 6,
        stopOnError: true,
        cacheLocation: './_cache',
        loadPath: [ 
            './resources/sass',
            config.bowerDir + '/bootstrap-sass/assets/stylesheets'
        ]
    })
    .on('error', notify.onError(function(err){
        return 'Error: ' + err.message;
    }))
    .pipe(gulp.dest('./public/css'))
})

gulp.task('js', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: ['./resources/js/app.js'],
    debug: true
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    // .pipe(sourcemaps.init({loadMaps: true}))
    //     // Add transformation tasks to the pipeline here.
    //     .pipe(uglify())
    //     .on('error', gutil.log)
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});
  
gulp.task('bower', function () {  
    gulp.src(mbf({includeDev: true}).filter(function (f) { return f.substr(-2) === 'js'; }))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('watch', function(){
    gulp.watch(config.sassPath + '/**/*.scss', ['css']);
    gulp.watch(config.jsPath + '/**/*.js', ['js']);
});

gulp.task('default', ['css']);