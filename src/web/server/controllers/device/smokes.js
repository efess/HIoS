var express = require('express'),
    Promise = require('promise'),
    smokes = require('../../model/smokes'),
    device = require('../../model/device'),
    mqtt = require('mqtt'),
    router = express.Router(),
    uuid = require('node-uuid');

var mqttHost = 'pihub.home.lan';

var client = mqtt.createClient(1880, mqttHost);
client.on('connect', function(){
    console.log('mqtt connected');
    client.subscribe("/home/outside/smoker/stoker/update");
});
 
client.on('message', function(topic, data){
    if(topic === "/home/outside/smoker/stoker/update") {
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
                    isNaN(smokerUpdate.grill) ? null : smokerUpdate.grill,
                    isNaN(smokerUpdate.meat) ? null : smokerUpdate.meat,
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