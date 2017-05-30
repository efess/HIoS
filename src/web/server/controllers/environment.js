var express = require('express'),
    Promise = require('promise'),
    envModel = require('../model/environment'),
    router = express.Router(),
    R = require('ramda');

router.post('/status', function(req, res) { 
    var deviceId = req.body.deviceId;
    var response = {};

    envModel.getEvent(deviceId)
        .then(function(data){
            response.current = data;
        })
        .then(function _success(){
            res.send(JSON.stringify(response));
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/current', function(req, res) { 
    var deviceId = req.body.deviceId;
    var response = {};

    envModel.getEvent(deviceId)
        .then(function(data){
            response.current = data;
        })
        .then(function _success(){
            res.send(JSON.stringify(response));
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/history', function(req, res) {
    // input should probably be Room?
    var deviceId = req.body.deviceId;
    var recordLimit = parseInt(req.body.limit || 100);
    var gran = parseInt(req.body.gran || 3600);
    var now = parseInt(req.body.time || (new Date().getTime() / 1000));

    //var now = (new Date().getTime() / 1000);
    
    var fromTime = (now - (now % gran)) - (recordLimit * gran);

    var difference = now - fromTime;
    console.log(now + "     " + fromTime + "      " + difference);
    var toTime = now;
    var response = {
        
    };

    var tokens = [
        deviceId,
        fromTime, // seconds since epoch...
        toTime,
        gran,
        recordLimit,
    ];
      
    envModel.getEvents(tokens).then(function(data){
        response.history = [];

        var timedData = data.reduce((arr, row) => {
            arr[row.timestamp] = row;
            return arr;
        }, {});

        for(var i = 0; i < recordLimit; i++){
            var exp = fromTime + (i * gran);
            var point = timedData[exp];
            if(point){
                response.history.push(point);
            } else {
                response.history.push({timestamp: exp, temperature: null, humidity: null, pressure: null, motion:null});
            }
        }
    }).then(function _success(){
        res.send(JSON.stringify(response));
    }, function _fail(err) {
        res.send('Error: ' + err);
    });
});


module.exports = router;