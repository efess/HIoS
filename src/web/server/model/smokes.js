var db = require('../db');
var R = require('ramda');

var smokes = {
    addEvent: function(tokens) {
        return db.query("INSERT INTO smokes_events (deviceId, timestamp, temp1, temp2, temp3, temp4, fanState) VALUES" +
            " (?, ?, ?, ?, ?, ?, ?)", tokens);
    },
    //tokens: From, To, DeviceId, Granularity (seconds)
    getEvents: function(tokens) {
        return db.query("CALL temps (?, ?, ?, ?)", tokens)
            .then(R.head);
    },
}
module.exports = smokes;