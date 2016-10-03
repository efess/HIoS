var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var cfg = require('./config');
var db = require('./db');
var schema = require('./store/schema');
var path = require('path');
var mqBroker = require('./mqtt/broker');

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
}

cfg.load()
    .then(function(config){
        return db.init(config.store)
            .then(schema.upgrade, function(err) {
                    console.log("Failure init db: " + err);
            })
            // .then(mqBroker.start,
            //     function(err){
            //         console.log("Failure init db, exiting\n" + err);
            //     })
            .then(function(){
                    return startServer(config);},
                function(err){
                    console.log("Failure init mq broker, exiting\n" + err);
                })
            .then(function(){}, function(err){
                    console.log("Failure starting server, exiting\n" + err);
            });
        },
        function(err){
            console.log('Failure loading config, exiting\n' + err);
        });