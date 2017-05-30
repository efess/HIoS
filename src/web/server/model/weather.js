var db = require('../db');
var R = require('ramda');

module.exports = {
    getLocations: function() {
        return db.query('SELECT * FROM weather_location')
            .then(R.head);
    },
    setForecast: function(locationId, timestamp, startDate, days, json) {
        return db.query('DELETE FROM weather_forecast WHERE locationId = ?', [locationId])
            .then(function() {
                db.query("INSERT INTO weather_forecast (locationId, timestamp, startDate, days, json) VALUES" +
                    " (?, ?, ?, ?, ?)", [locationId, timestamp, startDate, days, json])
            });
    },
    setNow: function(locationId, timestamp, json) {
        return db.query('DELETE FROM weather_now WHERE locationId = ?', [locationId])
            .then(function() {
                db.query("INSERT INTO weather_now (locationId, timestamp, json) VALUES" +
                    " (?, ?, ?)", [locationId, timestamp, json]);
            });
    },
    setHourly: function(locationId, timestamp, date, json) {
        return db.query('DELETE FROM weather_hourly WHERE locationId = ?', [locationId])
            .then(function() {
                db.query("INSERT INTO weather_hourly (locationId, timestamp, date, json) VALUES" +
                    " (?, ?, ?, ?)", [locationId, timestamp, date, json]);
            });
    },
    setAstronomy: function(locationId, timestamp, json) {
        return db.query('DELETE FROM weather_astronomy WHERE locationId = ?', [locationId])
            .then(function() {
                db.query("INSERT INTO weather_astronomy (locationId, timestamp, json) VALUES" +
                    " (?, ?, ?)", [locationId, timestamp, json]);
            });
    },
    getNow: function(locationId) {
        return db.query('SELECT * FROM weather_now WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getForecast: function(locationId) {
        return db.query('SELECT * FROM weather_forecast WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getHourly: function(locationId) {
        return db.query('SELECT * FROM weather_hourly WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getAstronomy: function(locationId) {
        return db.query('SELECT * FROM weather_astronomy WHERE locationId = ?', [locationId])
            .then(R.head);
    }
}

