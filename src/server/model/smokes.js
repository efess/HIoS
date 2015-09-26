var db = require('../db');
var R = require('ramda');

var smokes = {
    addEvent: function(tokens){
        db.query("INSERT INTO smokes (id, )")
    }
}

module.exports = smokes;