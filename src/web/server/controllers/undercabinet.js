var express = require('express'),
    Promise = require('promise'),
    router = express.Router(),
    uuid = require('node-uuid'),
    mqtt = require('mqtt'),
    base64 = require('base64-js');

var mqttHost = 'pihub.home.lan';
var topics = {
    stateResponse: '/home/kitchen/cabinet/lights/response',
    stateRequest: '/home/kitchen/cabinet/lights/request'
}
// Options: [timeout]
function getUInt32Option(options) {
    
}

router.get('/', function(req, res) {
    res.render('undercabinet', { title: 'Home HIoS - Under cabinet lights'});
});

router.post('/getState', function(req, res) {
    
    var client = mqtt.createClient(1880, mqttHost);
    client.on('connect', function(){
        console.log('mqtt connected');
        client.subscribe(topics.stateResponse);
        client.publish(topics.stateRequest);
    });
    
    client.on('message', function(topic, data){
        if(topic === topics.stateResponse) {
            var base64Str = data.toString();
            var uint8view = base64.toByteArray(base64Str)
            var uint16view = new Uint16Array(uint8view.buffer);
            var uint32View = new Uint32Array(uint8view.buffer);
            
            var byteCount = 0;
            var options = {
                unoccupied: {},
                occupied: {}
            }
            
            options.pirTimeout = uint16view[byteCount];
            byteCount += 4;
            
            function pullRoomOptions(byteStart, roomOptions) {
                var byteOffset = byteStart;
                roomOptions.transition = uint8view[byteOffset++];
                roomOptions.animation = uint8view[byteOffset++];
                roomOptions.brightness = uint8view[byteOffset++];
                byteOffset++;
                
                roomOptions.color = uint32View[byteOffset / 4];
                byteOffset += 4;
                
                roomOptions.pallete = [];
                for(var i = 0, b = byteOffset / 4; i < 16; i++, b++) {
                    roomOptions.pallete[i] = uint32View[b];
                    byteOffset += 4;
                }
                return byteOffset - byteStart;
            }
            
            byteCount += pullRoomOptions(byteCount, options.occupied);
            byteCount += pullRoomOptions(byteCount, options.unoccupied);
            
            var response = {
                options: options
            }; 
            
            res.send(response);
            client.end();
        }
    });
});

router.post('/changeOptions', function(req, res) {
    var client = mqtt.createClient(1880, mqttHost);
    var options = req.body.options || {};
    var color = req.body.color || options.occupied.color;
    var occupiedOpts = options.occupied;
    var unoccupiedOpts = options.unoccupied;
    
    //validation?
    var buffer = new ArrayBuffer(316);
    
    var uint8view = new Uint8Array(buffer);
    var uint16view = new Uint16Array(buffer);
    var uint32View = new Uint32Array(buffer);
    
    var byteCounter = 0;
    
    uint16view[0] = options.pirTimeout || 300;  // timeout seconds
    uint8view[3] = options.alwaysOn || 0;
    byteCounter += 4;
    
    function setRoomOptions(byteStart, roomOptions) {
        var byteOffset = byteStart;
        uint8view[byteOffset++] =  parseInt(roomOptions.transition);
        uint8view[byteOffset++] =  parseInt(roomOptions.animation);
        uint8view[byteOffset++] =  parseInt(roomOptions.brightness);
        byteOffset++;
        
        uint32View[byteOffset / 4] = parseInt(roomOptions.color);
        byteOffset += 4;
        for(var start = byteOffset / 4, i = 0; i < 16; i++, start++) {
            uint32View[start] = roomOptions.pallete[i];
            byteOffset += 4;
        }
        
        return byteOffset - byteStart;
    }
    byteCounter += setRoomOptions(byteCounter, occupiedOpts);
    byteCounter += setRoomOptions(byteCounter, unoccupiedOpts);
    
    var base64Str = base64.fromByteArray(uint8view.subarray(0, byteCounter));
    
    client.publish('/home/kitchen/cabinet/lights/update', base64Str);
    
    res.send('SUCCESS published ' + base64Str.length + ' long: ' + base64Str);
});

module.exports = router