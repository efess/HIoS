var device = require('../../model/device');

function checkDevice(deviceId, type) {
    if(!deviceId) {
        return Promise.reject("Bad device");
    }
    
    return device.getDevice(deviceId)
        .then(function(deviceObj){
            if(!deviceObj || !deviceObj.length){
                return device.addDevice([deviceId,type,new Date(), new Date()]);
            } else {
                return device.updateDevice([new Date(), deviceId]);
            }
        });
}

module.exports = { checkDevice: checkDevice };