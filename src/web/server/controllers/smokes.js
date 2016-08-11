var express = require('express'),
    Promise = require('promise'),
    smokes = require('../model/smokes'),
    router = express.Router(),
    R = require('ramda'),
    uuid = require('node-uuid');

var _probeArray = [0,1,2,3];
var _testDeviceId = '31316536-6633-3939-2d64-6362372d3436';
    
router.get('/', function(req, res) {
    res.render('smoker', { 
        title: 'Home HIoS - Smoker Stoker'});
});

router.post('/changeTargets', function(req,res) {
    var meatTarget = parseInt(req.body.meatTarget) || 0;
    if(meatTarget < 50 || meatTarget > 1000) {
        meatTarget = 0;
    }
    var grillTarget = parseInt(req.body.grillTarget) || 0;
    if(grillTarget < 50 || grillTarget > 1000) {
        grillTarget = 0;
    }
    var tokens = [
        grillTarget,
        meatTarget,
        req.body.deviceId || _testDeviceId
    ];
    
    smokes.setTargets(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/updateProbeTarget', function(req, res) {
    var deviceId = req.body.deviceId || _testDeviceId;
    var target = parseInt(req.body.target || 0);
    var probeId = req.body.probeId || 0;

    if(!probeId) {
        res.send('Missing probeid');
        return;
    }

    if(target < 50 || target > 1000) {
        target = 0;
    }

    smokes.updateProbeTarget(deviceId, req.body.probeId, target)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/closeSession', function(req, res) {
    var deviceId = req.body.deviceId || _testDeviceId;
    var target = parseInt(req.body.target || 0);
    var probeId = req.body.probeId || 0;

    var tokens = [
        req.body.end ? new Date() : 0,
        req.body.description || '',
        deviceId,
        probeId
    ];
    
    smokes.closeSession(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/newSession', function(req, res) {
    if(!req.body.probeId) {
        res.send('Missing probeid');
        return;
    }
    if(req.body.probeId === 0) {
        res.send('Cannot add session for probeId 0');
        return;
    }
    var tokens = [
        req.body.deviceId || _testDeviceId,
        new Date(),
        0,
        req.body.meat || 'Some meat',
        req.body.target || 0,
        "Char-Griller AKORN", //req.body.smokerType || '',
        req.body.description || '',
        req.body.probeId 
    ];
    
    smokes.createSession(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/getSessions', function(req, res) {

    var deviceId = req.body.deviceId || _testDeviceId;
    var options = {};
    var sessions = [];

    Promise.all([
        smokes.getSmokerOptions()
            .then(function(data){ options = data; }),
        smokes.getExistingSessions(deviceId, new Date())
            .then(function(data){
                if(!R.any(R.propEq('probeId', 0), data)) {
                    var smokerSession = {
                        probeId: 0,
                        start: 0,
                        end: 0,
                        target: 225,
                        name: 'Smoker'
                    };
                    data.unshift(smokerSession);

                    var tokens = [
                        deviceId,
                        smokerSession.start,
                        smokerSession.end,
                        smokerSession.name,
                        smokerSession.target,
                        "Char-Griller AKORN", //req.body.smokerType || '',
                        '',
                        smokerSession.probeId
                    ];
                    smokes.createSession(tokens).then(function(){}, function(err){
                        console.log('error creating default smoker session: ' + err);
                    });
                }
                sessions = data; 
            })
    ]).then(function() {
        var response = {
            sessions: sessions,
            options: options
        };
        res.json(response); 
    }, function _fail(err) {
        res.send('Error: ' + err);
    });
});

router.post('/getSmokerStatus', function(req, res){
    var deviceId = req.body.deviceId || _testDeviceId;

    var fromTime = 0;
    var toTime = 9443881643;
    var response = {
        probeDetail: _probeArray.map(function(id){ return {history: {}, current: {} }; })
    };

    var tokens = [
        deviceId,
        fromTime, // seconds since epoch...
        toTime,
        req.body.gran || 3600,
        req.body.limit || 100,
    ];
    
    Promise.all([
        smokes.getSmokerOptions()
            .then(function(data){ response.options = data; }),
        smokes.getEvents(tokens).then(function(data){
            _probeArray.forEach(function(probeId) {
                var strProbeId = 'probe' + probeId;
                response.probeDetail[probeId].history = 
                    data.map(function(hist){
                        return {
                            timestamp: hist.timestamp,
                            temp: hist[strProbeId],
                            target: hist[strProbeId + 'Target']
                        };
                    });
            })
            response.probeDetail.history = _probeArray.reduce(function(arr, probeId){
                
            },[])
        }),
        smokes.getExistingSessions(deviceId, new Date()).then(function(data){
            if(!R.any(R.propEq('probeId', 0), data)) {
                var smokerSession = {
                    probeId: 0,
                    start: 0,
                    end: 0,
                    target: 225,
                    name: 'Smoker'
                };
                data.unshift(smokerSession);

                var tokens = [
                    deviceId,
                    smokerSession.start,
                    smokerSession.end,
                    smokerSession.name,
                    smokerSession.target,
                    "Char-Griller AKORN", //req.body.smokerType || '',
                    '',
                    smokerSession.probeId
                ];
                
                smokes.createSession(tokens).then(function(){}, function(err){
                    console.log('error creating default smoker session: ' + err);
                });
            }
            response.sessions = data; 
        }),
        smokes.getEvent(deviceId).then(function(data){ 
             _probeArray.forEach(function(probeId) {
                var strProbeId = 'probe' + probeId;
                response.probeDetail[probeId].current = {
                    timestamp: data.timestamp,
                    temp: data[strProbeId],
                    target: data[strProbeId + 'Target'],
                    fanstate: data.fanstate
                };
            })
        })
    ]).then(function _success(){
        res.send(JSON.stringify(response));
    }, function _fail(err) {
        res.send('Error: ' + err);
    });


    // var fakeData = {
    //     temps: [
    //         {   id: 1,
    //             name: "grill",
    //             current: 211,
    //             target: 230,
    //             graph: [
    //                 { time: 123456789, temp: 110 },
    //                 { time: 123456790, temp: 110 },
    //                 { time: 123456791, temp: 110 },
    //                 { time: 123456792, temp: 100 },
    //                 { time: 123456793, temp: 105 },
    //             ]
    //         },
    //         {
    //             id: 2,
    //             name: 'Steak',
    //             current: 190,
    //             target: 195
    //         }
    //     ] 
    // };
    
    //res.json(fakeData);
});

module.exports = router;