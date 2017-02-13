var express = require('express'),
    Promise = require('promise'),
    smokes = require('../model/smokes'),
    router = express.Router(),
    R = require('ramda'),
    mqtt = require('mqtt'),
    uuid = require('node-uuid'),
    base64 = require('base64-js');

var mqttHost = 'pihub.home.lan';
var _probeArray = [0,1,2,3];
var _testDeviceId = '31316536-6633-3939-2d64-6362372d3436';

var strToArrayBuffer = function(arrayBuffer, offset, str, length) {
    var uint8view = new Uint8Array(arrayBuffer);
    for (var i=0; i < length && i < str.length; i++) {
        uint8view[i + offset] = str.charCodeAt(i);
    }
}

function sendDeviceUpdate(config) {
    var buffer = new ArrayBuffer(64);
    var uint8view = new Uint8Array(buffer);
    var uint16view = new Uint16Array(buffer);

    var grillTarget = 0;
    var byteCounter = 0;

    var probes = config.probes;
    var grillProbe = R.find(R.propEq('probeId', 0))(probes);
    grillTarget = grillProbe && grillProbe.target || 0;

    function setProbeProps(probeId, name, enabled, target) {
        strToArrayBuffer(buffer, byteCounter,name, 16);
        byteCounter += 16;   
        uint16view[byteCounter/2] = target;
        byteCounter += 2;
        uint8view[byteCounter++] = probeId;
        uint8view[byteCounter++] = enabled;
    }

    for(var i = 1; i < 4; i++) {
        var probe = R.find(R.propEq('probeId', i))(probes);
        if(!probe){
            setProbeProps(i, "", 0, 0);
        } else {
            setProbeProps(i, probe.name, 1, probe.target);
        }
    }

    // Grill Target
    uint16view[byteCounter/2] = grillTarget;
    byteCounter += 2;

    // Fan Pulse
    uint8view[byteCounter++] = config.options.fanPulse;

    var base64Str = base64.fromByteArray(uint8view.subarray(0, byteCounter));
    
    var client = mqtt.createClient(1880, mqttHost);
    client.publish('/home/outside/smoker/stoker/config/update', base64Str);
    
    res.send('SUCCESS published ' + base64Str.length + ' long: ' + base64Str);
}

function getDeviceConfig(deviceId) {
    var config = {};
    return Promise.all([
        smokes.getExistingSessions(deviceId, new Date()).then(function(data){
            config.probes = data;
        }),
        smokes.getSmokerOptions(deviceId).then(function(data){ 
            config.options = data;
        })
    ]).then(function() {
        return config;
    });        
}

function handleProbeUpdate(deviceId){
    return getDeviceConfig(deviceId)
        .then(sendDeviceUpdate);
}
 
router.get('/', function(req, res) {
    res.render('smoker', { title: 'Home HIoS - Smoker Stoker'});
});

router.get('/history', function(req, res) {
    res.render('smokerHistory', { title: 'Home HIoS - Smoker Stoker - History'});
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

    smokes.updateProbeTarget(deviceId, probeId, target)
        .then(function _success(){
            handleProbeUpdate(deviceId);
            res.send({status:"SUCCESS"});
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/closeSession', function(req, res) {
    var deviceId = req.body.deviceId || _testDeviceId;
    var target = parseInt(req.body.target || 0);
    var probeId = req.body.probeId || 0;

    var tokens = [
        req.body.end || new Date().getTime(),
        req.body.description || '',
        deviceId,
        probeId
    ];
    
    smokes.closeSession(tokens)
        .then(function _success(){
            handleProbeUpdate(deviceId);
            res.send({status:"SUCCESS"});
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
    var deviceId = req.body.deviceId || _testDeviceId;
    var tokens = [
        deviceId,
        new Date().getTime(),
        0,
        req.body.meat || 'Some meat',
        req.body.target || 0,
        "Char-Griller AKORN", //req.body.smokerType || '',
        req.body.description || '',
        req.body.probeId 
    ];
    
    smokes.createSession(tokens)
        .then(function _success(){
            handleProbeUpdate(deviceId);
            res.send({status:"SUCCESS"});
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/getHistory', function(req, res) {
    var deviceId = req.body.deviceId || _testDeviceId;
    return smokes.getPreviousSessions(deviceId)
        .then(function(data) {
            // var response = {
            //     sessions: sessions,
            //     options: options
            // };
            res.json(data); 
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
    var recordLimit = parseInt(req.body.limit || 100);
    var gran = parseInt(req.body.gran || 3600);

    var now = (new Date().getTime() / 1000);
    
    var fromTime = (now - (now % gran))  - (100 * gran);
    var toTime = now;
    var response = {
        probeDetail: _probeArray.map(function(id){ return {history: { data:[], gran: gran}, current: {} }; })
    };

    var tokens = [
        deviceId,
        fromTime, // seconds since epoch...
        toTime,
        gran,
        req.body.limit || 100,
    ];
        
    Promise.all([
        smokes.getSmokerOptions()
            .then(function(data){ response.options = data; }),
        smokes.getEvents(tokens).then(function(data){
            var timeMap = data.reduce(function(arr, hist) {
                arr[hist.timestamp] = hist;
                return arr;
            }, {});
            var probes = response.probeDetail;

            for(var i = 0; i < recordLimit; i++){
                var exp = fromTime + (i * gran);
                var hist = timeMap[exp];
                if(!hist){
                    probes[0].history.data.push({timestamp: exp, temp: 0, target: 0});
                    probes[1].history.data.push({timestamp: exp, temp: 0, target: 0});
                    probes[2].history.data.push({timestamp: exp, temp: 0, target: 0});
                    probes[3].history.data.push({timestamp: exp, temp: 0, target: 0});
                } else {
                    probes[0].history.data.push({timestamp: hist.timestamp,temp: hist.probe0,target: hist.probe0Target});
                    probes[1].history.data.push({timestamp: hist.timestamp,temp: hist.probe1,target: hist.probe1Target})
                    probes[2].history.data.push({timestamp: hist.timestamp,temp: hist.probe2,target: hist.probe2Target})
                    probes[3].history.data.push({timestamp: hist.timestamp,temp: hist.probe3,target: hist.probe3Target})
                }

            }
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
                
                response.probeDetail[probeId].current = data && {
                    timestamp: data && data.timestamp,
                    temp: data[strProbeId],
                    target: data[strProbeId + 'Target'],
                    fanstate: data.fanstate
                } || {};
            });
        })
    ]).then(function _success(){
        res.send(JSON.stringify(response));
    }, function _fail(err) {
        res.send('Error: ' + err);
    });
});

module.exports = router;