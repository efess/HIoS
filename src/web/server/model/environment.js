var db = require('../db');
var R = require('ramda');

module.exports = {
    addEvent: function(tokens) {
        return db.query("INSERT INTO env_events (deviceId, timestamp, temperature, humidity, pressure, motion) VALUES" +
            " (?, ?, ?, ?, ?, ?)", tokens);
    },
    //tokens: From, To, DeviceId, Granularity (seconds)
    getEvents: function(tokens) {
        return db.query("CALL proc_env_history (?, ?, ?, ?, ?)", tokens)
            .then(R.head);
    },
    // get latest event
    getEvent: function(deviceId) {
        var timeout = (new Date().getTime() / 1000) - 60;
        return db.query("SELECT * FROM env_events WHERE deviceId = ? AND timestamp >  ? ORDER BY timestamp DESC LIMIT 1", [deviceId, timeout])
            .then(R.head);
    },
}

