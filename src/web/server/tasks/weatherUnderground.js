var Promise = require('promise');
var https = require('https');
var weatherDb = require('../model/weather');
var R = require('ramda');

var apiHost = "api.wunderground.com";


function getRequest(path) {
    return new Promise(function(resolve, reject){
        var url = 'https://' + apiHost + '/' + path;
        var req = https.get(url, function(response) {
            var body = '';
            response.on('data', function(chunk) {
                body += chunk;
            });
            response.on('end', function() {
                var json;
                try {
                    json = JSON.parse(body);
                    resolve(json);
                }
                catch(e) {
                    reject(e);
                }
            });
            response.on('error', function(e) {
                reject(e);
            });
        });

        req.on('error', function(e) {
            reject(e);
        });
    });
}

function needsAstronomyUpdate(config, location) {
    return weatherDb.getAstronomy(location.tableId)
        .then(function(data) {
            if(!data) {
                return true;
            }
            var currentRecord = new Date();
            currentRecord.setTime(data.timestamp * 1000);
            currentRecord.setHours(0,0,0,0);

            var now = new Date();
            now.setHours(0,0,0,0);
            return now.getTime() !== currentRecord.getTime();
        }, function(){
            console.log("Error retrieving astronomy:" + err);
        });
}

function updateLocation(config, location) {

    needsAstronomyUpdate(config, location).then(function(getAstro){
        return Promise.all([
            getRequest(['api', config.apiKey, 'conditions/q',location.api_url].join('/')),
            getRequest(['api', config.apiKey, 'forecast10day/q',location.api_url].join('/')),
            getRequest(['api', config.apiKey, 'hourly/q',location.api_url].join('/')),
            getAstro ? getRequest(['api', config.apiKey, 'astronomy/q',location.api_url].join('/')) : Promise.resolve(null)
        ]).then(function(data) {
            var now = (new Date().getTime() / 1000);
            return Promise.all([
                weatherDb.setNow(location.tableId, now, JSON.stringify(data[0].current_observation)),
                weatherDb.setForecast(location.tableId, now, now, 10, JSON.stringify(data[1].forecast)),
                weatherDb.setHourly(location.tableId, now, now, JSON.stringify(data[2].hourly_forecast)),
                data[3] ? weatherDb.setAstronomy(location.tableId, now, JSON.stringify(data[3])): Promise.resolve()
            ]);
        }, function(err) {
            console.log("Error updating weather locatin:" + err);
        });
    });
    
}
function updateLocations(config, locations) {
    if(locations.tableId) {
        locations = [locations];
    }
    if(!locations.length) {
        return Promise.resolve();
    }
    // recursively hit each location sequentially
    return updateLocation(config, R.head(locations))
        .then(updateLocations.bind(null, config, R.tail(locations)));
}

function update(config) {
    return weatherDb.getLocations()
        .then(function(locations){
            return updateLocations(config, locations);
        });
}

module.exports = {update: update}