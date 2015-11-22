var R = require('ramda');
var defaultIncrement = 5; // degrees
var numOfBars = 6; // degrees

var helper = {
    calculateYScale: function(values, height) {
        var min = Math.min.apply(null, values);
        var max = Math.max.apply(null, values);
        var spread = Math.abs(max-min); 
        
        if(spread < defaultIncrement * (numOfBars - 1)) {
            return { 
                min: min - (((numOfBars / 2) * defaultIncrement) - (spread / 2)),
                step: defaultIncrement 
            }
        } else {
            // if it's larger
            var degreesBetweenLines = spread / (numOfBars + 1);
            return {
                min: min - degreesBetweenLines,
                step: degreesBetweenLines
            };
        }        
    }
}

module.exports = helper;