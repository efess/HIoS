var Promise = require('promise'),
    envModel = require('../../model/environment'),
    checkDevice = require('./device').checkDevice,
    device = require('../../model/device');

function onEnvironmentUpdate(data, topic){
    var topicTokens = topic.split('/');
    var deviceId = topicTokens[1];
    
    var re = /\0/g;
    str = data.toString().replace(re, "");
    var envData = JSON.parse(str);
    
    checkDevice(deviceId, 'environment')
        .then(function(){
            var tokens = [
                deviceId,
                new Date().getTime() / 1000, // seconds since epoch...
                isNaN(envData.temp) ? null : envData.temp/100,
                isNaN(envData.humid) ? null : envData.humid/1000,
                isNaN(envData.pres) ? null : envData.pres/1000,
                isNaN(envData.motion) ? null : envData.motion
            ];

            envModel.addEvent(tokens)
                .then(function(args){
                }, function(err){
                    console.log('ERROR ' + err);
                });
        }, function _failed(err){
            console.log('ERROR ' + err);
        });
}
var events = [{
    topic: '/device/+/environment',
    topicRegex: /\/device\/.+\/environment/g,
    onEvent:onEnvironmentUpdate
}];

module.exports = {events: events};