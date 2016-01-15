var db = require('../db');
var R = require('ramda');

var device = {
    getDevice: function(deviceId){
        return db.query("SELECT * FROM device WHERE id = ?", [deviceId]);
    },
    addDevice: function(tokens) {
        return db.query("INSERT INTO device (id, type, firstSeen, lastConnect) VALUES" +
            " (?, ?, ?, ?)", tokens);
    },
    updateDevice: function(tokens) {
        return db.query("UPDATE device SET lastConnect = ? WHERE id = ?", tokens);
    }
};

module.exports = device;