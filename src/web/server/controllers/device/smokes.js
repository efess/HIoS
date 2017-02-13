var express = require('express'),
    Promise = require('promise'),
    smokes = require('../../model/smokes'),
    device = require('../../model/device'),
    router = express.Router(),
    uuid = require('node-uuid'),
    base64 = require('base64-js');


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
    

module.exports = router