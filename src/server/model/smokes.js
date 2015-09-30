var db = require('../db');
var R = require('ramda');

var smokes = {
    addEvent: function(tokens){
        db.query("INSERT INTO smokes (deviceId, timestamp, temp1, temp2, temp3, temp4, fanState) VALUES" +
            " (?, ?, ?, ?, ?, ?, ?)");
    }
}
module.exports = smokes;