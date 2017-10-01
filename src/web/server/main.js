var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var cfg = require('./config');
var db = require('./db');
var schema = require('./store/schema');
var path = require('path');
require('./mqtt/client');
var tasks = require('./tasks/task');
var wu = require('./tasks/weatherUnderground');

function startServer(config){
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.use(express.static(path.join(__dirname, '../public')));    
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    var port = process.env.PORT || config.listenPort || 8080;
    app.use(express.static(config.publicDir));
    app.use(require('./controllers'));
    
    app.listen(port);
    console.log('Server is listening on port ' + port);

    // startTasks(config);
}

function startTasks(config) {
    tasks.addTask({
        timing: 'interval',
        time: 600000,   // every 10 minutes
                        // key only gives 500 calls per day
                        // 10 minutes means 432 per day (3 API calls per)
        fn: wu.update,
        fnContext: config.weatherUnderground
    });
    tasks.startAll();
}

cfg.load()
    .then(function(config){
        return db.init(config.store)
            .then(schema.upgrade, function(err) {
                console.log("Failure init db: " + err);
            })
            .then(startServer.bind(null, config),
                function(err){ console.log("Failure upgrading db, exiting\n" + err); })
            .then(function(){}, 
                function(err){ console.log("Failure starting server, exiting\n" + err); });
        },
        function(err){
            console.log('Failure loading config, exiting\n' + err);
        });