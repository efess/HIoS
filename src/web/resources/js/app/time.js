var time = {
    secondsToDuration: function(seconds) {
        var timeMinutes = parseInt(seconds / 60) % 60;
        var timeHours = parseInt(seconds / 3600) % 60;
        return "" + timeHours + ':' + ("0"+timeMinutes).slice(-2);
    }
}

module.exports = time;