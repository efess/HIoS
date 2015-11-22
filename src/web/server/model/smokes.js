var db = require('../db');
var R = require('ramda');

var smokes = {
    addEvent: function(tokens) {
        return db.query("INSERT INTO smokes_events (deviceId, timestamp, grillTemp, meatTemp, fanState) VALUES" +
            " (?, ?, ?, ?, ?)", tokens);
    },
    newSmokesDevice: function(tokens){
        return db.query("INSERT INTO smokes (deviceId, grillTarget, meatTarget) VALUES (?,?,?)", tokens);
    },
    getSmokesDevice: function(deviceId) {
        return db.query("SELECT * FROM smokes WHERE deviceId = ?", [deviceId]).then(R.head);
    },
    //tokens: From, To, DeviceId, Granularity (seconds)
    getEvents: function(tokens) {
        return db.query("CALL temps (?, ?, ?, ?, ?)", tokens).then(R.head);
    },
    // get latest event
    getEvent: function(deviceId) {
        return db.query("SELECT * FROM smokes_events WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1", [deviceId]).then(R.head);
    },
    setTargets: function(tokens) {
        return db.query("UPDATE smokes SET grillTarget = ?, meatTarget = ? WHERE deviceId = ?", tokens).then(R.head);
    },
    getTargets: function(deviceId) {
        return db.query("SELECT grillTarget, meatTarget FROM smokes WHERE deviceId = ?", [deviceId]).then(R.head);
    },
    getExistingSession: function(deviceId) {
        return db.query("SELECT * FROM smokes_session WHERE end <= 0 AND deviceId = ? ORDER BY start LIMIT 1", [deviceId]).then(R.head);
    },
    createSession: function(tokens){
        return db.query("INSERT INTO smokes_session (deviceId, start, end, meat, smokerType, description) VALUES" +
            " (?, ?, ?, ?, ?, ?)", tokens);
    },
    saveSession: function(tokens) {
        return db.query('UPDATE smokes_session SET end = ?, meat = ?, smokerType = ?, description = ? WHERE tableId = ?' +
            " (?, ?, ?, ?, ?)", tokens);
    }
    
}
module.exports = smokes;