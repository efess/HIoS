var gulp = require('gulp'),
    webpack = require('webpack-stream'),
    sass = require('gulp-ruby-sass'),
    notify = require("gulp-notify"),
    bower = require('gulp-bower'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    WebpackDevServer = require("webpack-dev-server"),
    babelify = require('babelify');
    //babel = require('gulp-babel');
    
var config = {
    sassPath: './resources/sass',
    jsPath: './resources/js',
    bowerDir: './components',
    webComponentsDir: './elements'
};

gulp.task('css', function(){
    return sass(config.sassPath + '/style.scss', {
        precision: 6,
        stopOnError: true,
        cacheLocation: './_cache',
        loadPath: [ 
            './resources/sass',
            config.bowerDir + '/bootstrap/scss'
            //config.bowerDir + '/bootstrap-sass/assets/stylesheets'
        ]
    })
    .on('error', notify.onError(function(err){
        return 'Error: ' + err.message;
    }))
    .pipe(gulp.dest('./public/css'))
})

gulp.task('js-browserify', function () {
  var b = browserify({
    entries: ['./resources/js/app.js'],
    debug: true
  });
   
  return b
    .transform('babelify', {presets: ['react', 'es2015']})
    .bundle()
    .on('error', function(error){
        console.log('ERROR: ' + error.message);
        this.emit('end');
    })
    .pipe(source('app.js'))   
    .pipe(buffer())
    // .pipe(sourcemaps.init({loadMaps: true}))
    //     // Add transformation tasks to the pipeline here.
    //     .pipe(uglify())
    //     .on('error', gutil.log)
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('js', function() {
  return gulp.src('resources/js/app.js')
    .pipe(webpack())
    .pipe(gulp.dest('public/js/'));
});
gulp.task("webpack-dev-server", function(callback) {
    // Start a webpack-dev-server
    var compiler = webpack({
        // configuration
    });

    new WebpackDevServer(compiler, {
        // server and middleware options
    }).listen(8080, "localhost", function(err) {
        if(err) throw new gutil.PluginError("webpack-dev-server", err);
        // Server listening
        gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");

        // keep the server alive or continue?
        // callback();
    });
});
gulp.task('bower', function () {  
    gulp.src(mbf({includeDev: true}).filter(function (f) { return f.substr(-2) === 'js'; }))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('watch', function(){
    gulp.watch(config.sassPath + '/**/*.scss', ['css']);
    gulp.watch(config.jsPath + '/**/*.js', ['js']);
    gulp.watch(config.webComponentsDir + '/**/*.html', ['vulcanize']);
});

gulp.task('default', ['css']);