var express = require('express'),
    Promise = require('promise'),
    envModel = require('../model/environment'),
    router = express.Router(),
    R = require('ramda');

router.get('/', function(req, res) {
    res.render('environment', { title: 'Home HIoS - Room'});
});

router.post('/status', function(req, res) {
    // input should probably be Room?

    var deviceId = req.body.deviceId;
    var recordLimit = parseInt(req.body.limit || 100);
    var gran = parseInt(req.body.gran || 3600);

    var now = (new Date().getTime() / 1000);
    
    var fromTime = (now - (now % gran)) - (100 * gran);
    var toTime = now;
    var response = {
        
    };

    var tokens = [
        deviceId,
        fromTime, // seconds since epoch...
        toTime,
        gran,
        req.body.limit || 100,
    ];
      
    envModel.getEvents(tokens).then(function(data){
        response.history = data;
        return;

        // var timeMap = data.reduce(function(arr, hist) {
        //     arr[hist.timestamp] = hist;
        //     return arr;
        // }, {});
        // var probes = response.probeDetail;

        // for(var i = 0; i < recordLimit; i++){
        //     var exp = fromTime + (i * gran);
        //     var hist = timeMap[exp];
        //     if(!hist){
        //         probes[0].history.data.push({timestamp: exp, temp: 0, target: 0});
        //         probes[1].history.data.push({timestamp: exp, temp: 0, target: 0});
        //         probes[2].history.data.push({timestamp: exp, temp: 0, target: 0});
        //         probes[3].history.data.push({timestamp: exp, temp: 0, target: 0});
        //     } else {
        //         probes[0].history.data.push({timestamp: hist.timestamp,temp: hist.probe0,target: hist.probe0Target});
        //         probes[1].history.data.push({timestamp: hist.timestamp,temp: hist.probe1,target: hist.probe1Target})
        //         probes[2].history.data.push({timestamp: hist.timestamp,temp: hist.probe2,target: hist.probe2Target})
        //         probes[3].history.data.push({timestamp: hist.timestamp,temp: hist.probe3,target: hist.probe3Target})
        //     }

        // }
    }).then(function _success(){
        res.send(JSON.stringify(response));
    }, function _fail(err) {
        res.send('Error: ' + err);
    });
});


module.exports = router;