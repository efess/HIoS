module.exports = {
    diffString(start, end) {

        var timeDiffSeconds = ((end - start)/1000);
        var timeMinutes = parseInt(timeDiffSeconds / 60) % 60;
        var timeHours = parseInt(timeDiffSeconds / 3600) % 60;
        
        return "" + timeHours + ':' + ("0"+timeMinutes).slice(-2);
    }
}