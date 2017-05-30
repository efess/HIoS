var express = require('express'),
    model = require('../model/weather');
    Promise = require('promise'),
    router = express.Router(),
    uuid = require('node-uuid'),
    mqtt = require('mqtt'),
    base64 = require('base64-js');


function getAllWeatherData() {
    return model.getLocations()
        .then((locs) => {
            var locId;
            if(locs.tableId) {
                locId = locs.tableId;
            } else {
                locId = locs[0].tableId;
            }

            return Promise.all([
                model.getNow(locId),
                model.getForecast(locId),
                model.getHourly(locId),
                model.getAstronomy(locId)
            ])
            .then((dataz) => {
                return {
                    current: JSON.parse(dataz[0].json),
                    forecast: JSON.parse(dataz[1].json),
                    hourly: JSON.parse(dataz[2].json),
                    astronomy: JSON.parse(dataz[3].json)
                };
            });
        });
}

router.get('/', function(req, res) {
    res.render('weather', { title: 'Home HIoS - Weather'});
});

router.post('/simpleForecast', function(req, res) {
    getAllWeatherData()
        .then((locData) => {
            
            var rspObj = {
                current: {
                    temp: locData.current.temp_c,
                    feelsLike: locData.current.feelslike_c,
                    icon: locData.current.icon,
                    timestamp: locData.current.observation_epoch,
                    wind_speed: locData.current.wind_kph,
                    wind_dir: locData.current.wind_dir
                },
                forecast: locData.forecast.simpleforecast.forecastday.map((forecast) => {
                    return {
                        date: forecast.date.epoch,
                        icon: forecast.icon,
                        tempHigh: forecast.high.celsius,
                        tempLow: forecast.low.celsius
                    };
                })
            };
            
            res.send(rspObj);
        });
});
router.post('/forecast', function(req, res) {
    getAllWeatherData()
        .then((locData) => {
            
            var rspObj = {
                current: {
                    temp: locData.current.temp_c,
                    feelsLike: locData.current.feelslike_c,
                    icon: locData.current.icon,
                    timestamp: locData.current.observation_epoch,
                    wind_speed: locData.current.wind_kph,
                    wind_dir: locData.current.wind_dir,
                        humidity: locData.current.relative_humidity
                },
                forecast: locData.forecast.simpleforecast.forecastday.map((forecast) => {
                    return {
                        date: forecast.date.epoch,
                        icon: forecast.icon,
                        tempHigh: forecast.high.celsius,
                        tempLow: forecast.low.celsius,
                        wind_speed: forecast.avewind.kph,
                        wind_dir: forecast.avewind.dir,
                        humidity: forecast.avehumidity
                    };
                }),
                hourly: locData.hourly.map((hourly) => {
                    return {
                        date: hourly.FCTTIME.epoch,
                        icon: hourly.icon,
                        temp: hourly.temp.metric,
                        wind_speed: hourly.wspd.metric,
                        wind_dir: hourly.wdir.dir,
                        humidity: hourly.avehumidity
                    };
                }),
                astronomy: {
                    sunrise: {
                        hour: locData.astronomy.sun_phase.sunrise.hour,
                        minute: locData.astronomy.sun_phase.sunrise.minute,
                    },
                    sunset: {
                        hour: locData.astronomy.sun_phase.sunset.hour,
                        minute: locData.astronomy.sun_phase.sunset.minute,
                    },
                    moon: {
                        percent: locData.astronomy.moon_phase.percentIlluminated,
                        phase: locData.astronomy.moon_phase.phaseofMoon,
                    }
                }
            };
            
            res.send(rspObj);
        }, (err) => {
            res.send('ERROR ' + err);
        })
});

module.exports = router;