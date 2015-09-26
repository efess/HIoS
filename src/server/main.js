var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var cfg = require('./config');
var db = require('./db');
var schema = require('./store/schema');

function startServer(config){
    
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
            .then(schema.upgrade)
            .then(function(){return startServer(config);},
                function(err){
                    console.log("Failure init db, exiting\n" + err);
                })
        },
        function(err){
            console.log('Failure loading config, exiting\n' + err);
        });