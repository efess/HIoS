var Promise = require('promise'),
    smokes = require('../../model/smokes'),
    device = require('../../model/device'),
    checkDevice = require('./device').checkDevice,
    uuid = require('node-uuid'),
    base64 = require('base64-js');


function padLeft(totalLength, padChar, str){
    var realStr = str + "";
    return Array(totalLength + 1 - realStr.length).join(padChar) + realStr;
}

var events = [{
    topic: '/home/outside/smoker/stoker/state',
    onEvent: function(data) {
        var deviceIdStr = '11e6f399-dcb7-4651-a585-34e2059163e5';
        console.log(data);

        var smokerUpdate = JSON.parse(data);
        var deviceId = uuid.unparse(new Buffer(deviceIdStr));
        checkDevice(deviceId, 'smokes')
            .then(function(){
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
                    .then(function(){ }, function(err){
                        console.log('ERROR ' + err);
                    });
            }, function _failed(err){
                console.log('ERROR ' + err);
            });
    }
}];

module.exports = {events: events};