var db = require('../db');
var R = require('ramda');

var smokes = {
    addEvent: function(tokens) {
        return db.query("INSERT INTO smokes_events (deviceId, timestamp, probe0, probe1, probe2, probe3, fanState) VALUES" +
            " (?, ?, ?, ?, ?, ?, ?)", tokens);
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
    setSmokerOptions: function(tokens) {
        return db.query("UPDATE smokes SET smokerTarget = ?, fanPulse = ? WHERE deviceId = ?", tokens).then(R.head);
    },
    getSmokerOptions: function(deviceId) {
        return db.query("SELECT * FROM smokes WHERE deviceId = ?", [deviceId]).then(R.head);
    },
    getExistingSessions: function(deviceId, dateTime) {
        return db.query("SELECT * FROM smokes_session WHERE end <= 0 AND deviceId = ? ORDER BY start", [deviceId]);
    },
    createSession: function(tokens){
        return db.query("INSERT INTO smokes_session (deviceId, start, end, name, target, smokerType, description, probeId) VALUES" +
            " (?, ?, ?, ?, ?, ?, ?, ?)", tokens);
    },
    updateSession: function(tokens) {
        return db.query('UPDATE smokes_session SET end = ?, meat = ?, smokerType = ?, description = ? WHERE tableId = ?' +
            " (?, ?, ?, ?, ?)", tokens);
    },
    closeSession: function(tokens) {
        return db.query('UPDATE smokes_session SET end = ?, description = ? WHERE deviceId = ? AND probeId = ?', tokens);
    },
    updateProbeTarget: function(deviceId, probeId, target){
        return db.query('UPDATE smokes_session SET target = ? WHERE deviceId = ? AND probeId = ?', 
            [target, deviceId, probeId]);
    }
}
module.exports = smokes;