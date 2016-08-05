var express = require('express'),
    Promise = require('promise'),
    smokes = require('../../model/smokes'),
    device = require('../../model/device'),
    mqtt = require('mqtt'),
    router = express.Router(),
    uuid = require('node-uuid'),
    base64 = require('base64-js');

var mqttHost = 'pihub.home.lan';

var strToArrayBuffer = function(arrayBuffer, offset, str, length) {
    var uint8view = new Uint8Array(arrayBuffer);
    for (var i=0; i < length && i < str.length; i++) {
        uint8view[i + offset] = str.charCodeAt(i);
    }
}

var client = mqtt.createClient(1880, mqttHost);
client.on('connect', function(){
    console.log('mqtt connected');
    client.subscribe("/home/outside/smoker/stoker/state");
});
 
client.on('message', function(topic, data){
    if(topic === "/home/outside/smoker/stoker/state") {
        var deviceIdStr = '11e6f399-dcb7-4651-a585-34e2059163e5';
        
        console.log(data);
        var smokerUpdate = JSON.parse(data);
        var deviceId = uuid.unparse(new Buffer(deviceIdStr));
        checkDevice(deviceId).then(function(){
                return smokes.getSmokesDevice(deviceId).then(function(smokesDevice){
                    if(!smokesDevice) {
                        return smokes.newSmokesDevice([deviceId, 0, 0])
                    } else {
                        return Promise.resolve(smokesDevice);
                    }
                });
            }).then(function(smokesDevice){
                var targets = smokesDevice || {}
                var tokens = [
                    deviceId,
                    new Date().getTime() / 1000, // seconds since epoch...
                    isNaN(smokerUpdate.probe0) ? null : smokerUpdate.probe0,
                    isNaN(smokerUpdate.probe1) ? null : smokerUpdate.probe1,
                    isNaN(smokerUpdate.probe2) ? null : smokerUpdate.probe2,
                    isNaN(smokerUpdate.probe3) ? null : smokerUpdate.probe3,
                    smokerUpdate.fanState
                ];
                smokes.addEvent(tokens)
                    .then(function(){
                        res.send(returnBody);
                    }, function(){
                        console.log('ERROR');
                    });
            }, function _failed(err){
                console.log('ERROR');
            });
    }
});

router.post('/changeOptions', function(req, res) {

    // var options = req.body.options || {};
    // var color = req.body.color || options.occupied.color;
    // var occupiedOpts = options.occupied;
    // var unoccupiedOpts = options.unoccupied;
    
    //validation?
    var buffer = new ArrayBuffer(64);
    var uint8view = new Uint8Array(buffer);
    var uint16view = new Uint16Array(buffer);
    
    var byteCounter = 0;
    strToArrayBuffer(buffer, byteCounter,"123456789012345", 16);
    byteCounter += 16;   
    uint16view[byteCounter/2] = 340;
    byteCounter += 2;
    uint8view[byteCounter++] = 1;
    uint8view[byteCounter++] = 1;

    strToArrayBuffer(buffer, byteCounter,"543210987654321", 16);
    byteCounter += 16;   
    uint16view[byteCounter/2] = 98;
    byteCounter += 2;
    uint8view[byteCounter++] = 3;
    uint8view[byteCounter++] = 1;

    strToArrayBuffer(buffer, byteCounter,"123456789012345", 16);
    byteCounter += 16;   
    uint16view[byteCounter/2] = 117;
    byteCounter += 2;
    uint8view[byteCounter++] = 2;
    uint8view[byteCounter++] = 1;

    // Grill Target
    uint16view[byteCounter/2] = 230;
    byteCounter += 2;

    // Fan Pulse
    uint8view[byteCounter++] = 8;

    var base64Str = base64.fromByteArray(uint8view.subarray(0, byteCounter));
    
    client.publish('/home/outside/smoker/stoker/config/update', base64Str);
    
    res.send('SUCCESS published ' + base64Str.length + ' long: ' + base64Str);
});


function padLeft(totalLength, padChar, str){
    var realStr = str + "";
    return Array(totalLength + 1 - realStr.length).join(padChar) + realStr;
}

function checkDevice(deviceId) {
    if(!deviceId) {
        return Promise.reject("Bad device");
    }
    
    return device.getDevice(deviceId)
        .then(function(deviceObj){
            if(!deviceObj || !deviceObj.length){
                return device.addDevice([deviceId,'smokes',new Date(), new Date()]);
            } else {
                return device.updateDevice([new Date(), deviceId]);
            }
        });
}

router.post('/event', function(req, res) {
    console.log(req.body);
    var deviceId = uuid.unparse(new Buffer(req.body.id));
    checkDevice(deviceId).then(function(){
            return smokes.getSmokesDevice(deviceId).then(function(smokesDevice){
                if(!smokesDevice) {
                    return smokes.newSmokesDevice([deviceId, 0, 0])
                } else {
                    return Promise.resolve(smokesDevice);
                }
            })
        }).then(function(smokesDevice){
            var targets = smokesDevice || {}
            var returnBody = "smokes_update:" + 
                "grill:" + padLeft(5, " ", targets.grillTarget || 0) + 
                "meat:" + padLeft(5, " ", targets.meatTarget || 0) +
                "END";
            
            var tokens = [
                deviceId,
                new Date().getTime() / 1000, // seconds since epoch...
                isNaN(req.body.grill) ? null : req.body.grill,
                isNaN(req.body.meat) ? null : req.body.meat,
                req.body.fanstate
            ];
            smokes.addEvent(tokens)
                .then(function(){
                    res.send(returnBody);
                }, function(){
                    res.send('ERROR');
                });
        }, function _failed(err){
                res.send('ERROR');
        })
    });
    
    
    
    
    
    

module.exports = router